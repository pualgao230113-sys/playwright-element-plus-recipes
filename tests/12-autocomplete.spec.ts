/**
 * Recipe 12 - el-autocomplete
 *
 * Pitfalls:
 *  1. Unlike el-select, the named element is a `textbox`. The `combobox`
 *     role sits on an unnamed wrapper, so getByRole('combobox', { name })
 *     finds nothing. The textbox's `aria-controls` points at the listbox
 *     (from 2.13.1; before that it is the literal string "id").
 *  2. After you type, the previous suggestions stay on screen until the
 *     debounce runs. Waiting for "an option called X" can pass on the OLD
 *     list.
 *  3. Pressing Enter with nothing highlighted picks nothing: the model is
 *     the typed text and `select` never fires.
 *  4. Free text is a valid value. Typing a full suggestion and leaving the
 *     field does not fire `select` either.
 */
import { expect, test } from '@playwright/test'
import { autocompleteListbox, pickSuggestion } from './helpers/element-plus'
import { epAtLeast } from './support/version'

test.beforeEach(async ({ page }) => {
  await page.goto('/autocomplete')
})

// Before 2.13.1 the textbox's aria-controls is the literal string "id", so
// the listbox cannot be found through it.
const brokenLink = !epAtLeast('2.13.1')
const linkReason = 'Element Plus < 2.13.1: aria-controls does not point at the listbox.'

test('the textbox has the name, not the combobox', async ({ page }) => {
  await expect(page.getByRole('combobox', { name: 'Fruit' })).toHaveCount(0)
  await expect(page.getByRole('combobox')).toHaveCount(1)
  await expect(page.getByRole('textbox', { name: 'Fruit' })).toHaveAttribute('aria-controls', /.+/)
})

test('old suggestions stay visible until the debounce runs', async ({ page }) => {
  test.skip(brokenLink, linkReason)
  const input = page.getByRole('textbox', { name: 'Fruit' })
  const listbox = await autocompleteListbox(page, 'Fruit')
  await input.click()
  await expect(listbox.getByRole('option')).toHaveCount(8)

  await input.fill('berry')
  // Naive: this passes right away, on the list for the EMPTY query.
  await expect(listbox.getByRole('option', { name: 'Apple', exact: true })).toBeVisible()
  // Better: wait for the whole list the new query should produce.
  await expect(listbox.getByRole('option')).toHaveText(['Blackberry', 'Blueberry'])
})

test('Enter with nothing highlighted keeps the typed text', async ({ page }) => {
  test.skip(brokenLink, linkReason)
  const input = page.getByRole('textbox', { name: 'Fruit' })
  const listbox = await autocompleteListbox(page, 'Fruit')
  await input.fill('berry')
  await expect(listbox.getByRole('option')).toHaveText(['Blackberry', 'Blueberry'])

  await input.press('Enter')
  await expect(page.getByTestId('model-value')).toHaveText('berry')
  await expect(page.getByTestId('select-count')).toHaveText('0')

  // Highlight first, then Enter.
  await input.press('ArrowDown')
  await expect(listbox.getByRole('option', { name: 'Blackberry' })).toHaveAttribute('aria-selected', 'true')
  await input.press('Enter')
  await expect(page.getByTestId('picked-value')).toHaveText('Blackberry')
  await expect(page.getByTestId('select-count')).toHaveText('1')
})

test('typing a full suggestion is not the same as picking it', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Fruit' })
  await input.fill('Cherry')
  await page.getByRole('heading', { name: 'Autocomplete' }).click()
  await expect(page.getByTestId('model-value')).toHaveText('Cherry')
  await expect(page.getByTestId('picked-value')).toHaveText('(none)')
  await expect(page.getByTestId('select-count')).toHaveText('0')
})

test('pick a suggestion after the new list has arrived', async ({ page }) => {
  test.skip(brokenLink, linkReason)
  await pickSuggestion(page, 'Fruit', 'ap', 'Pineapple', ['Apple', 'Apricot', 'Grape', 'Pineapple'])
  await expect(page.getByTestId('model-value')).toHaveText('Pineapple')
  await expect(page.getByTestId('picked-value')).toHaveText('Pineapple')
})
