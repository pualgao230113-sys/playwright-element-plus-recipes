/**
 * Recipe 03 - el-checkbox / el-radio / el-switch
 *
 * Pitfalls:
 *  1. The real <input> is visually hidden (0x0, opacity 0). `check()` on it
 *     waits for visibility and times out; `{ force: true }` fails with
 *     "Element is outside of the viewport".
 *  2. The same option text can exist in several groups (Small/Medium/Large
 *     here) -> strict-mode violations unless you scope to the group.
 *  3. el-switch's active/inactive texts are not "set to" buttons: clicking
 *     either one TOGGLES the switch.
 *  4. el-switch keeps its state in `aria-checked`. After a click on the
 *     el-form-item label, the hidden input's native `checked` property is
 *     out of sync, so `toBeChecked()` reports the wrong state.
 */
import { expect, test } from '@playwright/test'
import { formItem, setChecked, setSwitch } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/checkbox')
})

test('the hidden input cannot be checked directly', async ({ page }) => {
  const input = page.getByRole('checkbox', { name: 'I agree to the terms' })
  // Naive: input.check() -> "element is not visible" until timeout.
  await expect(input.check({ timeout: 1_000 })).rejects.toThrow(/Timeout/)
  // Naive #2: input.check({ force: true }) -> "outside of the viewport".
  await expect(input.check({ force: true, timeout: 1_000 })).rejects.toThrow(/outside of the viewport/)
})

test('check through the label; assert on the input or the is-checked class', async ({ page }) => {
  await setChecked(page, 'I agree to the terms', true)
  await expect(page.getByTestId('agree-value')).toHaveText('true')

  // setChecked is idempotent: calling it again does not toggle back.
  await setChecked(page, 'I agree to the terms', true)
  await expect(page.getByTestId('agree-value')).toHaveText('true')

  // Equivalent visual assertion, if you prefer classes.
  await expect(page.locator('label.el-checkbox', { hasText: 'I agree to the terms' })).toHaveClass(/is-checked/)
})

test('checkbox group: read the state of every box', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Toppings' })
  await setChecked(page, 'Olives', true)
  await setChecked(page, 'Cheese', false)

  await expect(group.getByRole('checkbox', { name: 'Olives' })).toBeChecked()
  await expect(group.getByRole('checkbox', { name: 'Cheese' })).not.toBeChecked()
  await expect(page.getByTestId('toppings-value')).toHaveText('Olives')
})

test('radio: scope to the radiogroup, then use the label', async ({ page }) => {
  // Naive: page.getByRole('radio', { name: 'Large' }) -> 2 matches
  // (the plain radios AND the radio buttons below them).
  await expect(page.getByRole('radio', { name: 'Large' })).toHaveCount(2)

  const sizes = page.getByRole('radiogroup', { name: 'Size', exact: true })
  await sizes.locator('label', { hasText: 'Large' }).check()
  await expect(sizes.getByRole('radio', { name: 'Large' })).toBeChecked()
  await expect(page.getByTestId('size-value')).toHaveText('Large')

  const buttons = page.getByRole('radiogroup', { name: 'Button size' })
  await buttons.locator('label', { hasText: 'Small' }).check()
  await expect(buttons.getByRole('radio', { name: 'Small' })).toBeChecked()
  await expect(page.getByTestId('size-button-value')).toHaveText('Small')
})

test('switch: trust aria-checked, not toBeChecked()', async ({ page }) => {
  // el-form-item renders <label for="..."> pointing at the switch input,
  // so the switch gets an accessible name and clicking the label toggles it.
  const reminders = page.getByRole('switch', { name: 'Email reminders' })
  await page.getByText('Email reminders', { exact: true }).click()
  await expect(page.getByTestId('notify-value')).toHaveText('true')

  // Naive: toBeChecked() reads the native `checked` property, which the
  // label click left at false. It reports "unchecked" for a switch that is ON.
  await expect(reminders).not.toBeChecked()
  // Better: the component's real state.
  await expect(reminders).toHaveAttribute('aria-checked', 'true')
  await expect(formItem(page, 'Email reminders').locator('.el-switch')).toHaveClass(/is-checked/)
})

test('switch: active/inactive texts toggle, they do not set', async ({ page }) => {
  const theme = formItem(page, 'Theme')
  // Clicking "Dark" turns it on...
  await theme.getByText('Dark', { exact: true }).click()
  await expect(page.getByTestId('dark-value')).toHaveText('true')
  // ...but clicking "Dark" again turns it OFF. The texts are toggles, not setters.
  await theme.getByText('Dark', { exact: true }).click()
  await expect(page.getByTestId('dark-value')).toHaveText('false')

  // Better: an idempotent helper that checks state before clicking.
  await setSwitch(theme.locator('.el-switch'), true)
  await setSwitch(theme.locator('.el-switch'), true)
  await expect(page.getByTestId('dark-value')).toHaveText('true')
})
