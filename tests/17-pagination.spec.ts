/**
 * Recipe 17 - el-pagination
 *
 * Pitfalls:
 *  1. Page numbers are `listitem`s labelled "page N", not buttons.
 *     getByRole('button', { name: '2' }) finds nothing, and the label
 *     "page 1" also matches "page 10" unless exact.
 *  2. The "Go to" jumper does nothing while you type. It applies on Enter
 *     or blur, and it clamps out-of-range numbers to the last page.
 *  3. Changing the page size can change the current page (page 10 of 10
 *     becomes page 2 of 2).
 *  4. The page-size select has no accessible name. Scope it to the
 *     pagination and follow `aria-controls` like any el-select.
 */
import { expect, test } from '@playwright/test'
import { currentPage, jumpToPage, pageButton, popperOf } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/pagination')
})

test('pages are list items labelled "page N"', async ({ page }) => {
  const pagination = page.locator('.el-pagination')
  await expect(pagination.getByRole('button', { name: '2' })).toHaveCount(0)
  await expect(pagination.getByRole('listitem', { name: 'page 1' })).toHaveCount(2) // page 1 and page 10

  await pageButton(pagination, 3).click()
  await expect(currentPage(pagination)).toHaveText('3')
  await expect(page.getByTestId('fruit-list').locator('li').first()).toHaveText('Fruit 21')
})

test('the jumper applies on Enter or blur, and clamps', async ({ page }) => {
  const pagination = page.locator('.el-pagination')
  const jumper = pagination.getByRole('spinbutton', { name: 'Page' })
  await jumper.fill('7')
  await expect(page.getByTestId('page')).toHaveText('1')
  await jumper.press('Enter')
  await expect(page.getByTestId('page')).toHaveText('7')

  // Leaving the field applies it too.
  await jumper.fill('4')
  await jumper.blur()
  await expect(page.getByTestId('page')).toHaveText('4')

  await jumpToPage(pagination, 99)
  await expect(page.getByTestId('page')).toHaveText('10')
  await expect(jumper).toHaveValue('10')
  await expect(pagination.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
})

test('a bigger page size can move you to another page', async ({ page }) => {
  const pagination = page.locator('.el-pagination')
  await jumpToPage(pagination, 10)

  const sizes = pagination.getByRole('combobox')
  // It has no accessible name, so reach it through the pagination root.
  await expect(sizes).toHaveAccessibleName('')
  await pagination.locator('.el-select').click()
  const listbox = await popperOf(page, sizes)
  await listbox.getByRole('option', { name: '50/page', exact: true }).click()

  await expect(page.getByTestId('size')).toHaveText('50')
  await expect(page.getByTestId('page')).toHaveText('2')
  await expect(page.getByTestId('fruit-list').locator('li').first()).toHaveText('Fruit 51')
})
