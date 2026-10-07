/**
 * Recipe 01 - el-select
 *
 * Pitfalls:
 *  1. The dropdown is teleported to <body>. Looking for options *inside* the
 *     select finds nothing.
 *  2. Clicking the combobox <input> of a NON-filterable select times out:
 *     the placeholder / selected label sits on top and intercepts the click.
 *  3. Options of every select stay in the DOM while closed (just hidden),
 *     and Playwright's name matching is substring by default ("Apple" also
 *     matches "Pineapple").
 *  4. A `multiple` select stays open after each pick.
 *  5. A remote select's options only exist after the (debounced) request,
 *     and its dropdown stays hidden until the first results arrive.
 *  6. Element Plus puts the combobox's `aria-label` on the listbox as well,
 *     but role queries skip hidden elements, so the CLOSED listboxes of
 *     other selects never get in the way.
 */
import { expect, test } from '@playwright/test'
import {
  openSelect,
  searchAndSelect,
  selectOption,
  selectOptions,
  selectRoot,
  selectTags,
} from './helpers/element-plus'
import { epAtLeast } from './support/version'

test.beforeEach(async ({ page }) => {
  await page.goto('/select')
})

test('options are teleported to <body>, not rendered inside the select', async ({ page }) => {
  const root = selectRoot(page, 'Fruit')
  await root.click()

  // Naive: scope options to the component. Finds nothing.
  await expect(root.getByRole('option')).toHaveCount(0)

  // Better: follow aria-controls from the combobox to its listbox.
  const listbox = await openSelect(page, 'Fruit')
  await expect(listbox.getByRole('option')).toHaveCount(7)
  // The listbox really lives outside the select's subtree.
  expect(await root.locator('[role="listbox"]').count()).toBe(0)
})

test('click the select wrapper, not the combobox input', async ({ page }) => {
  const combobox = page.getByRole('combobox', { name: 'Fruit', exact: true })

  // Naive: clicking the input waits for "placeholder intercepts pointer events"
  // until it times out. We prove it with a short trial click.
  await expect(combobox.click({ timeout: 1_000, trial: true })).rejects.toThrow(/intercepts pointer events/)

  // Better: click the .el-select root (what a user actually clicks).
  await selectRoot(page, 'Fruit').click()
  await expect(combobox).toHaveAttribute('aria-expanded', 'true')

  // A filterable select's input is clickable, except in 2.13.3–2.14.1 where
  // the placeholder intercepts it there too (fixed in 2.14.2).
  await page.keyboard.press('Escape')
  const filtered = page.getByRole('combobox', { name: 'Filtered fruit', exact: true })
  if (!(epAtLeast('2.13.3') && !epAtLeast('2.14.2'))) {
    await filtered.click()
    await expect(filtered).toHaveAttribute('aria-expanded', 'true')
  } else {
    await expect(filtered.click({ timeout: 1_000, trial: true })).rejects.toThrow(/intercepts pointer events/)
  }
})

test('pick an option by exact name from the right listbox', async ({ page }) => {
  // Hidden options of all four selects are in the DOM right now.
  expect(await page.locator('.el-select-dropdown__item').count()).toBeGreaterThan(7)

  // Naive: a default (substring) name match finds "Apple" AND "Pineapple".
  const listbox = await openSelect(page, 'Fruit')
  await expect(listbox.getByRole('option', { name: 'Apple' })).toHaveText(['Apple', 'Pineapple'])
  await page.keyboard.press('Escape')
  await expect(listbox).toBeHidden()

  // Better: role query (skips hidden elements) + exact name + scoped listbox.
  await selectOption(page, 'Fruit', 'Apple')
  await expect(page.getByTestId('fruit-value')).toHaveText('Apple')

  // The select shows the picked label (not the value) in its wrapper.
  await expect(selectRoot(page, 'Fruit')).toContainText('Apple')
})

test('filterable select: type, then pick from the filtered list', async ({ page }) => {
  const listbox = await openSelect(page, 'Filtered fruit')
  await page.getByRole('combobox', { name: 'Filtered fruit', exact: true }).fill('ap')
  // The typed text is only a filter: v-model stays empty until you pick.
  await expect(page.getByTestId('filtered-fruit-value')).toHaveText('(none)')

  // Filtering hides non-matching options; role queries only see visible ones.
  await expect(listbox.getByRole('option')).toHaveText(['Apple', 'Apricot', 'Grape', 'Pineapple'])

  await listbox.getByRole('option', { name: 'Grape', exact: true }).click()
  await expect(page.getByTestId('filtered-fruit-value')).toHaveText('Grape')
})

test('multiple select: dropdown stays open, assert tags', async ({ page }) => {
  // After one pick the dropdown is still open.
  const listbox = await openSelect(page, 'Basket')
  await listbox.getByRole('option', { name: 'Apple', exact: true }).click()
  await page.waitForTimeout(500) // give it a chance to close
  await expect(listbox).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(listbox).toBeHidden()
  await selectRoot(page, 'Basket').locator('.el-tag', { hasText: 'Apple' }).locator('.el-tag__close').click()
  await expect(selectTags(page, 'Basket')).toHaveCount(0)

  // Better: pick everything, then close with Escape (the helper does both).
  await selectOptions(page, 'Basket', ['Banana', 'Cherry', 'Mango'])
  await expect(selectTags(page, 'Basket')).toHaveText(['Banana', 'Cherry', 'Mango'])
  await expect(page.getByTestId('basket-value')).toHaveText('Banana, Cherry, Mango')


  // Remove a tag with its close icon. Since 2.12.0 it is also a button
  // named "Close this tag"; the class works in every version.
  await selectRoot(page, 'Basket').locator('.el-tag', { hasText: 'Cherry' }).locator('.el-tag__close').click()
  await expect(selectTags(page, 'Basket')).toHaveText(['Banana', 'Mango'])
})

test('remote select: wait for the option, never for a fixed time', async ({ page }) => {
  // Before any search there are no options, and the dropdown stays hidden.
  const input = page.getByRole('combobox', { name: 'Book', exact: true })
  const listbox = page.locator(`[id="${await input.getAttribute('aria-controls')}"]`)
  await selectRoot(page, 'Book').click()
  await page.waitForTimeout(500) // asserting an absence
  await expect(listbox).toBeHidden()
  await page.keyboard.press('Escape')

  // Naive: fill + page.waitForTimeout(500) + click. Breaks as soon as the
  // API is slower than your guess. Better: wait for the option itself.
  await searchAndSelect(page, 'Book', 'moby', 'Moby-Dick')
  await expect(page.getByTestId('book-value')).toHaveText('Moby-Dick')
})
