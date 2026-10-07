/**
 * Recipe 06 - el-table
 *
 * Pitfalls:
 *  1. Header and body are two separate <table> elements. getByRole('row')
 *     counts the header row too, and there is no header/cell association
 *     for Playwright (or a screen reader) to use.
 *  2. Generated column classes (`el-table_1_column_3`) change when columns
 *     are added or the table is not the first on the page. Give columns a
 *     stable `class-name` instead of relying on index or generated names.
 *  3. While v-loading is on, data is usually [] and the EMPTY text is already
 *     rendered under the mask, so an "empty state" assertion passes before
 *     the data arrives.
 *  4. Clicking the header cell cycles ascending -> descending -> none, but
 *     the "Sort by X" caret button does NOT: a plain click() hits its lower
 *     (descending) caret. Assert the header's `aria-sort` after every click.
 *
 * Note: older Element UI / early Element Plus rendered fixed columns as a
 * second, overlapping table (every fixed cell existed twice). Current
 * Element Plus uses `position: sticky` in the same table, so rows are not
 * duplicated - but code ported from those days often still has workarounds.
 */
import { expect, test } from '@playwright/test'
import { columnTexts, rowByCell, tableRows, waitForTable } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/table')
})

test('the empty text is visible while the table is still loading', async ({ page }) => {
  const table = page.getByTestId('books-table')

  // Naive: this passes immediately - the data just has not arrived yet.
  await expect(table.getByText('No books match')).toBeVisible()
  await expect(table.locator('.el-loading-mask')).toBeVisible()

  // Robust: wait for the loading mask to go, THEN judge rows / empty state.
  await waitForTable(table)
  await expect(tableRows(table)).toHaveCount(5)
  await expect(table.getByText('No books match')).toBeHidden()
})

test('count body rows, not every role="row"', async ({ page }) => {
  const table = page.getByTestId('books-table')
  await waitForTable(table)

  // Naive: getByRole('row') includes the header row from the header table.
  await expect(table.getByRole('row')).toHaveCount(6)
  // Robust: body rows only.
  await expect(tableRows(table)).toHaveCount(5)
  expect(await table.locator('table').count()).toBe(2)
})

test('find a row by a cell value, then act inside that row', async ({ page }) => {
  const table = page.getByTestId('books-table')
  await waitForTable(table)

  // Naive: tableRows(table).filter({ hasText: 'Emma' }) would also match a
  // row whose ANY cell contains "Emma" (an author named Emma, ...).
  const row = rowByCell(table, 'col-title', 'Persuasion')
  await expect(row).toHaveCount(1)
  await expect(row.locator('td.col-author')).toHaveText('Jane Austen')

  // The fixed right column is part of the same row.
  await row.getByRole('button', { name: 'Borrow' }).click()
  await expect(page.getByTestId('borrowed')).toHaveText('Persuasion')
})

test('sorting: the "Sort by" button is not a cycle button', async ({ page }) => {
  const table = page.getByTestId('books-table')
  await waitForTable(table)
  const yearHeader = table.locator('th.col-year')

  // Naive: click the accessible "Sort by Year" button. Playwright clicks its
  // centre, which lands on the lower (descending) caret -> straight to
  // DESCENDING, and a second click clears the sort instead of flipping it.
  await table.getByRole('button', { name: 'Sort by Year' }).click()
  await expect(yearHeader).toHaveAttribute('aria-sort', 'descending')
  await table.getByRole('button', { name: 'Sort by Year' }).click()
  await expect(yearHeader).toHaveAttribute('aria-sort', '')
})

test('sorting: click the header cell to cycle, or a caret to set', async ({ page }) => {
  const table = page.getByTestId('books-table')
  await waitForTable(table)
  const yearHeader = table.locator('th.col-year')

  // Clicking the header cell cycles ascending -> descending -> none.
  await yearHeader.click()
  await expect(yearHeader).toHaveAttribute('aria-sort', 'ascending')
  await expect.poll(() => columnTexts(table, 'col-year')).toEqual(['1815', '1817', '1871', '1965', '1984'])

  await yearHeader.click()
  await expect(yearHeader).toHaveAttribute('aria-sort', 'descending')
  await expect.poll(() => columnTexts(table, 'col-year')).toEqual(['1984', '1965', '1871', '1817', '1815'])

  await yearHeader.click()
  await expect(yearHeader).toHaveAttribute('aria-sort', '')
  await expect.poll(() => columnTexts(table, 'col-title')).toEqual(['Dune', 'Emma', 'Middlemarch', 'Neuromancer', 'Persuasion'])

  // To SET a direction regardless of the current state, click that caret.
  await table.locator('th.col-pages .sort-caret.ascending').click()
  await expect(table.locator('th.col-pages')).toHaveAttribute('aria-sort', 'ascending')
  await expect.poll(() => columnTexts(table, 'col-pages')).toEqual(['249', '271', '412', '474', '880'])
})

test('a real empty state after filtering', async ({ page }) => {
  const table = page.getByTestId('books-table')
  await waitForTable(table)
  await page.getByRole('textbox', { name: 'Filter by title' }).fill('zzz')
  await expect(tableRows(table)).toHaveCount(0)
  await expect(table.locator('.el-table__empty-text')).toHaveText('No books match')
})
