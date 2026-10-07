/**
 * Recipe 01 - el-select
 *
 * Pitfalls:
 *  1. The dropdown is teleported to <body>. Looking for options *inside* the
 *     select finds nothing.
 *  2. Clicking the combobox <input> of a non-filterable select times out:
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

test.beforeEach(async ({ page }) => {
  await page.goto('/select')
})

test('options are teleported to <body>, not rendered inside the select', async ({ page }) => {
  const root = selectRoot(page, 'Fruit')
  await root.click()

  // Naive: scope options to the component. Finds nothing.
  await expect(root.getByRole('option')).toHaveCount(0)

  // Robust: follow aria-controls from the combobox to its listbox.
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

  // Robust: click the .el-select root (what a user actually clicks).
  await selectRoot(page, 'Fruit').click()
  await expect(combobox).toHaveAttribute('aria-expanded', 'true')
})

test('pick an option by exact name from the right listbox', async ({ page }) => {
  // Hidden options of all four selects are in the DOM right now.
  expect(await page.locator('.el-select-dropdown__item').count()).toBeGreaterThan(7)

  // Naive: page.getByText('Apple') matches hidden options AND "Pineapple".
  // Robust: role query (skips hidden elements) + exact name + scoped listbox.
  await selectOption(page, 'Fruit', 'Apple')
  await expect(page.getByTestId('fruit-value')).toHaveText('Apple')

  // The select shows the picked label (not the value) in its wrapper.
  await expect(selectRoot(page, 'Fruit')).toContainText('Apple')
})

test('filterable select: type, then pick from the filtered list', async ({ page }) => {
  const listbox = await openSelect(page, 'Filtered fruit')
  await page.getByRole('combobox', { name: 'Filtered fruit', exact: true }).fill('ap')

  // Filtering hides non-matching options; role queries only see visible ones.
  await expect(listbox.getByRole('option')).toHaveText(['Apple', 'Apricot', 'Grape', 'Pineapple'])

  await listbox.getByRole('option', { name: 'Grape', exact: true }).click()
  await expect(page.getByTestId('filtered-fruit-value')).toHaveText('Grape')
})

test('multiple select: dropdown stays open, assert tags', async ({ page }) => {
  // Robust: pick everything, then close with Escape (the helper does both).
  await selectOptions(page, 'Basket', ['Banana', 'Cherry', 'Mango'])
  await expect(selectTags(page, 'Basket')).toHaveText(['Banana', 'Cherry', 'Mango'])
  await expect(page.getByTestId('basket-value')).toHaveText('Banana, Cherry, Mango')

  // Removing a tag uses the tag's own close button.
  await selectRoot(page, 'Basket')
    .locator('.el-tag', { hasText: 'Cherry' })
    .getByRole('button', { name: 'Close this tag' })
    .click()
  await expect(selectTags(page, 'Basket')).toHaveText(['Banana', 'Mango'])
})

test('remote select: wait for the option, never for a fixed time', async ({ page }) => {
  // Naive: fill + page.waitForTimeout(500) + click. Breaks as soon as the
  // API is slower than your guess. Robust: wait for the option itself.
  await searchAndSelect(page, 'Book', 'moby', 'Moby-Dick')
  await expect(page.getByTestId('book-value')).toHaveText('Moby-Dick')
})
