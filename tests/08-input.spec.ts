/**
 * Recipe 08 - el-input: maxlength, show-word-limit, clearable
 *
 * Pitfalls:
 *  1. `maxlength` is passed to the native <input>, so the BROWSER truncates
 *     whatever fill()/type() sends. A test that fills 16 characters and then
 *     expects 16 characters fails - and a test meant to prove "the server
 *     rejects long names" can never get a long name through the UI.
 *  2. The word-limit counter is a separate element (`.el-input__count`),
 *     with role="status" since 2.14.5.
 *  3. The clear icon cannot be clicked until the input is hovered (or
 *     focused). Since 2.14.0 it is in the DOM with `visibility: hidden`;
 *     before that it is not rendered at all.
 *  4. `fill('')` empties the field but does NOT emit the `clear` event, so
 *     code listening to @clear (reset filters, reload a list...) never runs.
 */
import { expect, test } from '@playwright/test'
import { epAtLeast } from './support/version'

test.beforeEach(async ({ page }) => {
  await page.goto('/input')
})

test('maxlength truncates what fill() sends', async ({ page }) => {
  const nickname = page.getByRole('textbox', { name: 'Nickname' })
  await nickname.fill('Strawberry-Fields')

  // Naive: expect(nickname).toHaveValue('Strawberry-Fields') -> fails.
  await expect(nickname).toHaveValue('Strawberry')
  await expect(page.getByTestId('nickname-value')).toHaveText('Strawberry')
})

test('the word-limit counter is a status element', async ({ page }) => {
  test.skip(!epAtLeast('2.14.5'), 'The counter got role="status" in Element Plus 2.14.5. Before that, use .el-input__count.')
  const nickname = page.getByRole('textbox', { name: 'Nickname' })
  const counter = page.locator('.el-input', { has: nickname }).getByRole('status')

  await expect(counter).toHaveText('0 / 10')
  await nickname.fill('Kiwi')
  await expect(counter).toHaveText('4 / 10')
  await expect(counter).toHaveAttribute('aria-label', '4 / 10 characters')

  // Same for a textarea; its counter sits next to the <textarea>.
  const note = page.getByRole('textbox', { name: 'Note' })
  await note.fill('Buy apples')
  await expect(page.locator('.el-textarea', { has: note }).locator('.el-input__count')).toHaveText('10 / 30')
})

test('the clear icon only becomes clickable on hover', async ({ page }) => {
  const search = page.getByRole('textbox', { name: 'Search fruit' })
  const wrapper = page.locator('.el-input', { has: search })
  const clearIcon = wrapper.locator('.el-input__clear')

  await search.fill('kiwi')
  await page.getByRole('heading', { name: 'Input', exact: true }).click() // blur, mouse away
  // Since 2.14.0 the icon is in the DOM but invisible. Before that it is not
  // rendered at all until hover. Either way, a click without hovering fails.
  await expect(clearIcon).toHaveCount(epAtLeast('2.14.0') ? 1 : 0)
  await expect(clearIcon).toBeHidden()

  // Better: hover the input first, like a user.
  await search.hover()
  await clearIcon.click()
  await expect(search).toHaveValue('')
  await expect(page.getByTestId('clear-count')).toHaveText('1')
})

test("fill('') is not the same as clearing", async ({ page }) => {
  const search = page.getByRole('textbox', { name: 'Search fruit' })
  await search.fill('kiwi')
  await search.fill('')

  await expect(page.getByTestId('search-value')).toHaveText('(empty)')
  // The value is empty, but the app's @clear handler never ran.
  await expect(page.getByTestId('clear-count')).toHaveText('0')
})
