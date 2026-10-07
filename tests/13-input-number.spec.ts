/**
 * Recipe 13 - el-input-number
 *
 * Pitfalls:
 *  1. The model follows typing, but `change` only fires on blur or Enter.
 *  2. min/max are applied to the MODEL while you type, but the input keeps
 *     showing the typed text until blur. Typing 25 into a max-10 field shows
 *     "25" with the model already at 10.
 *  3. Clearing the field gives an empty model (undefined), not `min`.
 *  4. Every field has buttons named "increase number" / "decrease number".
 *     At the limit they are not disabled for Playwright: no `disabled`, no
 *     `aria-disabled`, only an `is-disabled` class. A click "works" and does
 *     nothing.
 *  5. `precision` rounds on commit (2.345 -> 2.35), `step-strictly` snaps to
 *     the nearest step (10 -> 12 with step 6).
 */
import { expect, test } from '@playwright/test'
import { inputNumberButton, setInputNumber } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/input-number')
})

test('the model follows typing, change waits for blur', async ({ page }) => {
  const quantity = page.getByRole('spinbutton', { name: 'Quantity' })
  await quantity.fill('7')
  await expect(page.getByTestId('quantity-value')).toHaveText('7')
  await expect(page.getByTestId('quantity-changes')).toHaveText('0')

  await quantity.press('Tab')
  await expect(page.getByTestId('quantity-changes')).toHaveText('1')
})

test('max is applied to the model before the input shows it', async ({ page }) => {
  const quantity = page.getByRole('spinbutton', { name: 'Quantity' })
  await quantity.fill('25')
  // The input and the model disagree until the field is committed.
  await expect(quantity).toHaveValue('25')
  await expect(page.getByTestId('quantity-value')).toHaveText('10')

  await quantity.press('Enter')
  await expect(quantity).toHaveValue('10')

  expect(await setInputNumber(page, 'Quantity', 0)).toBe('1')
  await expect(page.getByTestId('quantity-value')).toHaveText('1')
})

test('an empty field is an empty model, not min', async ({ page }) => {
  expect(await setInputNumber(page, 'Quantity', '')).toBe('')
  await expect(page.getByTestId('quantity-value')).toHaveText('(empty)')
})

test('the +/- buttons: scope them, and read is-disabled', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'increase number' })).toHaveCount(3)

  await setInputNumber(page, 'Quantity', 10)
  const increase = inputNumberButton(page, 'Quantity', 'increase')
  // Naive: toBeDisabled() fails, Playwright sees an enabled button.
  await expect(increase).toBeEnabled()
  await expect(increase).toHaveClass(/is-disabled/)
  await increase.click()
  await expect(page.getByTestId('quantity-value')).toHaveText('10')

  await inputNumberButton(page, 'Quantity', 'decrease').click()
  await expect(page.getByTestId('quantity-value')).toHaveText('9')
})

test('precision and step-strictly change what you typed', async ({ page }) => {
  expect(await setInputNumber(page, 'Price', 2.345)).toBe('2.35')
  await expect(page.getByTestId('price-value')).toHaveText('2.35')

  expect(await setInputNumber(page, 'Boxes of 6', 10)).toBe('12')
  expect(await setInputNumber(page, 'Boxes of 6', 8)).toBe('6')
  await expect(page.getByTestId('boxes-value')).toHaveText('6')
})
