/**
 * Recipe 14 - el-time-picker / el-time-select
 *
 * Pitfalls:
 *  1. Opening the time picker writes the CURRENT time into the input and the
 *     model, before you pick anything. Escape or a click outside keeps it;
 *     only Cancel restores the old value. Freeze the clock.
 *  2. Spinner items outside the visible part of a column cannot be clicked:
 *     Playwright scrolls them into view, the spinner scrolls back to the
 *     active item, and the active item "intercepts pointer events".
 *  3. Typed times are parsed leniently: "7:5" becomes 07:05, "25:99" becomes
 *     02:39 (it rolls over).
 *  4. el-time-select is an el-select with time options, not a time picker.
 *     Use the select helpers.
 */
import { expect, test } from '@playwright/test'
import { combobox, popperOf, selectOption, typeTime } from './helpers/element-plus'
import { epAtLeast } from './support/version'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-03-10T10:00:00'))
  await page.goto('/time-picker')
})

test('opening the picker sets the model to "now"', async ({ page }) => {
  const input = combobox(page, 'Opening time')
  await input.click()
  await expect(input).toHaveValue('10:00')
  await expect(page.getByTestId('opens-value')).toHaveText('10:00')

  // Escape does not undo it.
  await page.keyboard.press('Escape')
  await expect(await popperOf(page, input)).toBeHidden()
  await expect(page.getByTestId('opens-value')).toHaveText('10:00')

  // Neither does a click outside, on a fresh page.
  await page.goto('/time-picker')
  await combobox(page, 'Opening time').click()
  await expect(combobox(page, 'Opening time')).toHaveValue('10:00')
  await page.getByRole('heading', { name: 'Time picker / Time select' }).click()
  await expect(await popperOf(page, combobox(page, 'Opening time'))).toBeHidden()
  await expect(page.getByTestId('opens-value')).toHaveText('10:00')
})

test('Cancel restores the previous value', async ({ page }) => {
  const input = combobox(page, 'Opening time')
  await input.click()
  const panel = await popperOf(page, input)
  await panel.getByRole('button', { name: 'Cancel' }).click()
  await expect(input).toHaveValue('')
  await expect(page.getByTestId('opens-value')).toHaveText('(none)')
  // An empty field becomes null from 2.13.4 on, an empty string before that.
  await expect(page.getByTestId('opens-raw')).toHaveText(epAtLeast('2.13.4') ? 'null' : '""')
})

test('type a time, then commit with Enter', async ({ page }) => {
  await typeTime(page, 'Opening time', '17:45')
  await expect(page.getByTestId('opens-value')).toHaveText('17:45')
})

test('typed times are parsed leniently', async ({ page }) => {
  const input = combobox(page, 'Opening time')
  await input.click()
  await input.fill('7:5')
  await input.press('Enter')
  await expect(input).toHaveValue('07:05')

  await input.click()
  await input.fill('25:99')
  await input.press('Enter')
  await expect(input).toHaveValue('02:39')
  await expect(page.getByTestId('opens-value')).toHaveText('02:39')
})

test('spinner items outside the visible column cannot be clicked', async ({ page }) => {
  const input = combobox(page, 'Opening time')
  await input.click()
  const panel = await popperOf(page, input)
  const minutes = panel.locator('.el-time-spinner__wrapper').nth(1)

  await expect(
    minutes.locator('.el-time-spinner__item', { hasText: /^\s*30\s*$/ }).click({ timeout: 1_500 }),
  ).rejects.toThrow(/intercepts pointer events/)

  // Items near the active one are in view and do work.
  await panel.locator('.el-time-spinner__wrapper').nth(0).locator('.el-time-spinner__item', { hasText: /^\s*11\s*$/ }).click()
  await panel.getByRole('button', { name: 'OK' }).click()
  await expect(page.getByTestId('opens-value')).toHaveText('11:00')
})

test('time-select is a select', async ({ page }) => {
  await selectOption(page, 'Pickup slot', '10:30')
  await expect(page.getByTestId('slot-value')).toHaveText('10:30')
})
