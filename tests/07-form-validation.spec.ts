/**
 * Recipe 07 - el-form validation
 *
 * Pitfalls:
 *  1. Rules with trigger: 'blur' do nothing while you type. `fill()` alone
 *     never shows the error; the field has to lose focus.
 *  2. Async validators resolve later. Asserting "no error" right after blur
 *     passes immediately - before the validator has even answered.
 *  3. Errors fade in/out with a transition, and the error element is
 *     removed (not hidden) when the field becomes valid.
 *  4. A select inside a form uses trigger: 'change'; picking an option must
 *     clear the error without any blur.
 *  5. The red "required" asterisk is CSS ::before content on the label, and
 *     it ends up IN the accessible name: the field is named "* Username".
 *     Exact name matches silently find nothing.
 */
import { expect, test } from '@playwright/test'
import { formError, formItem, selectOption } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/form')
})

test('the required asterisk is part of the accessible name', async ({ page }) => {
  // Naive: exact match on the label text you see.
  await expect(page.getByRole('textbox', { name: 'Username', exact: true })).toHaveCount(0)
  // What the accessibility tree really says:
  await expect(page.getByRole('textbox', { name: '* Username', exact: true })).toHaveCount(1)
  // Robust: anchor a RegExp at the end (still rejects "Old username" etc.).
  await expect(page.getByRole('textbox', { name: /Username$/ })).toHaveCount(1)
  await expect(page.getByRole('combobox', { name: /Favourite fruit$/ })).toHaveCount(1)
})

test('blur-triggered rules need a real blur', async ({ page }) => {
  const email = page.getByRole('textbox', { name: /Email$/ })
  await email.fill('not-an-email')
  // "Enter a valid email" has trigger ['blur', 'change'], so it shows while typing.
  await expect(formError(page, 'Email')).toHaveText('Enter a valid email')

  const username = page.getByRole('textbox', { name: /Username$/ })
  await username.fill('')
  // Naive: expect the "required" error now. Nothing happens - trigger is 'blur'.
  await expect(formError(page, 'Username')).toHaveCount(0)

  // Robust: move focus away like a user would.
  await username.press('Tab')
  await expect(formError(page, 'Username')).toHaveText('Username is required')
})

test('async validator: wait for the verdict, not just for "no error"', async ({ page }) => {
  const username = page.getByRole('textbox', { name: /Username$/ })
  const item = formItem(page, 'Username')

  await username.fill('admin')
  await username.press('Tab')
  // While the fake server call runs the item carries `is-validating`.
  await expect(item).toHaveClass(/is-validating/)
  await expect(formError(page, 'Username')).toHaveText('That username is taken')

  await username.fill('bookworm')
  await username.press('Tab')
  // Naive: expect(formError(...)).toHaveCount(0) - can pass while the old
  // error is fading or before the new verdict lands. Robust: wait for the
  // positive success state, then check the error is gone.
  await expect(item).toHaveClass(/is-success/)
  await expect(formError(page, 'Username')).toHaveCount(0)
})

test('submit validates every field at once', async ({ page }) => {
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByTestId('form-result')).toHaveText('invalid')
  await expect(page.locator('.el-form-item__error')).toHaveText([
    'Username is required',
    'Email is required',
    'Pick a favourite fruit',
  ])
})

test('select with trigger "change" clears its error on pick', async ({ page }) => {
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(formError(page, 'Favourite fruit')).toHaveText('Pick a favourite fruit')

  // The el-form-item label names the select's combobox (asterisk included).
  await selectOption(page, /Favourite fruit$/, 'Cherry')
  await expect(formError(page, 'Favourite fruit')).toHaveCount(0)
})

test('happy path: valid form submits', async ({ page }) => {
  await page.getByRole('textbox', { name: /Username$/ }).fill('bookworm')
  await page.getByRole('textbox', { name: /Email$/ }).fill('reader@example.com')
  await selectOption(page, /Favourite fruit$/, 'Apple')
  await page.getByRole('button', { name: 'Create account' }).click()
  // validate() waits for the async validator; so must the test.
  await expect(page.getByTestId('form-result')).toHaveText('submitted')
})
