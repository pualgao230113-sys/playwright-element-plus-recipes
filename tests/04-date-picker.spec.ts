/**
 * Recipe 04 - el-date-picker
 *
 * Pitfalls:
 *  1. `format` (what the user sees) and `value-format` (what v-model holds)
 *     are different things. Type in the DISPLAY format; assert the MODEL
 *     format separately.
 *  2. Without `value-format`, v-model holds a Date object. Serialising it
 *     (JSON / API payload) converts to UTC, which in a timezone east of UTC
 *     turns "15 March" into "2026-03-14T13:00:00.000Z".
 *  3. Day numbers repeat in the calendar grid: leading/trailing days of the
 *     neighbouring months are rendered too. "1" also substring-matches
 *     10-19, 21 and 31.
 *  4. The calendar opens on "today", so a test that clicks day cells depends
 *     on the date it runs. Freeze the clock.
 *  5. Typed text only reaches v-model on Enter/blur, and it is parsed
 *     leniently (2.14.4+): "3/4/2026" becomes 4 March, "31/02/2026" rolls
 *     over to 3 March, while "15/3/2026" is rejected (reverts to the old
 *     value). Older versions reject "3/4/2026". Never assume the typed text
 *     is what got stored.
 */
import { expect, test } from '@playwright/test'
import { exactText, pickDay, typeDate } from './helpers/element-plus'
import { epAtLeast } from './support/version'

test.beforeEach(async ({ page }) => {
  // Freeze "now" so the calendar always opens on March 2026.
  await page.clock.setFixedTime(new Date('2026-03-10T10:00:00'))
  await page.goto('/date-picker')
})

test('type in the display format, assert the model format', async ({ page }) => {
  await typeDate(page, 'Due date', '15/03/2026')
  await expect(page.getByTestId('due-value')).toHaveText('2026-03-15')
})

test('the model only updates when the typed value is committed', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'Due date', exact: true })
  await input.fill('15/03/2026')
  // Naive: assert right after fill(). The model is still empty.
  await expect(page.getByTestId('due-value')).toHaveText('(none)')
  // Commit with Enter (or blur).
  await input.press('Enter')
  await expect(page.getByTestId('due-value')).toHaveText('2026-03-15')
})

test('typed text is parsed leniently: always assert what it became', async ({ page }) => {
  test.skip(!epAtLeast('2.14.4'), 'Before Element Plus 2.14.4, "3/4/2026" is rejected and the field stays empty.')
  const input = page.getByRole('combobox', { name: 'Due date', exact: true })
  const commit = async (text: string) => {
    await input.fill(text)
    await input.press('Enter')
    await page.getByRole('heading', { name: 'Date picker' }).click() // blur
  }

  // A day-first user means 3 April, but the fallback parser reads month-first.
  await commit('3/4/2026')
  await expect(input).toHaveValue('04/03/2026')
  await expect(page.getByTestId('due-value')).toHaveText('2026-03-04')

  // An impossible date silently rolls over instead of being rejected.
  await commit('31/02/2026')
  await expect(input).toHaveValue('03/03/2026')

  // ...while a perfectly readable single-digit month is rejected: the field
  // quietly reverts to the previous value. A test that only checks "no error"
  // would pass while the user's input was thrown away.
  await commit('15/3/2026')
  await expect(input).toHaveValue('03/03/2026')
  await expect(page.getByTestId('due-value')).toHaveText('2026-03-03')
})

test('the calendar opens on today', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'Due date', exact: true })
  await input.click()
  const panel = page.locator(`[id="${await input.getAttribute('aria-controls')}"]`)
  // "Today" is the frozen clock: 10 March 2026.
  await expect(panel.locator('.el-date-picker__header')).toContainText('2026')
  await expect(panel.locator('.el-date-picker__header')).toContainText('March')
  await expect(panel.locator('td.today')).toHaveText('10')
})

test('pick a day from the panel with the clock frozen', async ({ page }) => {
  await pickDay(page, 'Due date', 1)
  // March 1st, not April 1st (also shown in the grid) and not 10-19/21/31.
  await expect(page.getByTestId('due-value')).toHaveText('2026-03-01')
  await expect(page.getByRole('combobox', { name: 'Due date', exact: true })).toHaveValue('01/03/2026')
})

test('why pickDay filters on td.available', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'Due date', exact: true })
  await input.click()
  const panel = page.locator(`[id="${await input.getAttribute('aria-controls')}"]`)

  // Naive: substring match on "1" hits 1, 10-19, 21, 31 and next month's 1, ...
  expect(await panel.getByRole('gridcell', { name: '1' }).count()).toBeGreaterThan(2)
  // ...and even an exact match finds March 1 AND the trailing April 1.
  await expect(panel.getByRole('gridcell', { name: '1', exact: true })).toHaveCount(2)
  // Better: only cells of the shown month carry the `available` class.
  await expect(panel.locator('td.available').filter({ hasText: exactText('1') })).toHaveCount(1)
})

test.describe('without value-format, in a timezone east of UTC', () => {
  test.use({ timezoneId: 'Australia/Sydney' })

  test('a picked date serialises to the previous day in UTC', async ({ page }) => {
    await pickDay(page, 'Plain date', 15)
    // v-model is a Date at local midnight; JSON turns it into UTC (11 h earlier in March).
    await expect(page.getByTestId('plain-value')).toHaveText('"2026-03-14T13:00:00.000Z"')
    // The fix lives in the app: set value-format="YYYY-MM-DD" (see "Due date").
  })
})

test('date range: fill both inputs in the display format', async ({ page }) => {
  const from = page.getByPlaceholder('From')
  const to = page.getByPlaceholder('To')
  await from.fill('01/03/2026')
  await to.fill('12/03/2026')
  await to.press('Enter')
  await expect(page.getByTestId('range-value')).toHaveText('2026-03-01 to 2026-03-12')
})
