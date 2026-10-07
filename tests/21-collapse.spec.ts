/**
 * Recipe 21 - el-collapse
 *
 * Pitfalls:
 *  1. Closed items keep their content in the DOM (hidden).
 *  2. Headers are role="button" and match by substring: "Garden" also
 *     matches "Garden tools".
 *  3. Clicking a header toggles. An "open this item" step that clicks an
 *     item that is already open closes it.
 *  4. The content counts as visible from the first pixel of the height
 *     transition, so toBeVisible() passes before it is fully open.
 */
import { expect, test } from '@playwright/test'
import { collapseHeader, setCollapseItem } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/collapse')
})

test('closed content is in the DOM, hidden', async ({ page }) => {
  await expect(page.getByText('Water the plants, cut the grass')).toHaveCount(1)
  await expect(page.getByText('Water the plants, cut the grass')).toBeHidden()
  await expect(page.getByRole('region', { name: 'Shopping' })).toBeVisible()
})

test('header names match by substring', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Garden' })).toHaveCount(2)
  await expect(collapseHeader(page, 'Garden')).toHaveCount(1)
})

test('clicking an open header closes it', async ({ page }) => {
  // Naive "open Shopping" step: it was already open.
  await collapseHeader(page, 'Shopping').click()
  await expect(collapseHeader(page, 'Shopping')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByTestId('open-value')).toHaveText('(none)')

  // Better: check aria-expanded first (the helper does).
  await setCollapseItem(page, 'Shopping', true)
  await setCollapseItem(page, 'Shopping', true)
  await expect(page.getByTestId('open-value')).toHaveText('shopping')
})

test('visible is not the same as fully open', async ({ page }) => {
  const header = collapseHeader(page, 'Garden')
  const content = page.locator(`[id="${await header.getAttribute('aria-controls')}"]`)
  await header.click()
  await expect(content).toBeVisible()
  // Still animating: the height is capped inline and it is shorter than its content.
  await expect(content).toHaveAttribute('style', /max-height/)
  expect((await content.boundingBox())!.height).toBeLessThan(40)

  // Wait for the inline style to go (setCollapseItem does this).
  await expect(content).not.toHaveAttribute('style', /height/)
  expect((await content.boundingBox())!.height).toBeGreaterThan(40)
})
