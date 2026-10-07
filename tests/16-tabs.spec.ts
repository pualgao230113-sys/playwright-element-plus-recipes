/**
 * Recipe 16 - el-tabs
 *
 * Pitfalls:
 *  1. Inactive panes are in the DOM, just hidden. Text from another tab
 *     "exists" for a CSS or text query.
 *  2. A `lazy` pane is not in the DOM until its tab is opened the first
 *     time. After that it stays (hidden), so its setup runs once.
 *  3. "Summary" also matches "Summary notes" unless exact.
 *  4. A disabled tab has only an `is-disabled` class: no `aria-disabled`.
 *     Playwright clicks it without complaint and nothing happens.
 */
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/tabs')
})

test('inactive panes are in the DOM, but hidden', async ({ page }) => {
  await expect(page.getByText('Notes on the summary.')).toHaveCount(1)
  await expect(page.getByText('Notes on the summary.')).toBeHidden()
  // Better: assert on the visible tabpanel, named by its tab.
  await expect(page.getByRole('tabpanel')).toHaveCount(1)
  await expect(page.getByRole('tabpanel', { name: 'Summary' })).toContainText('A desert planet')
})

test('a lazy pane mounts on first open and then stays', async ({ page }) => {
  await expect(page.getByText(/^Reviews:/)).toHaveCount(0)
  await expect(page.getByTestId('loads')).toHaveText('(none)')

  await page.getByRole('tab', { name: 'Reviews' }).click()
  await expect(page.getByRole('tab', { name: 'Reviews' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toHaveText('Reviews: 3 readers liked this book')

  await page.getByRole('tab', { name: 'Summary', exact: true }).click()
  await page.getByRole('tab', { name: 'Reviews' }).click()
  // Mounted once, not on every visit.
  await expect(page.getByTestId('loads')).toHaveText('reviews')
})

test('tab names match by substring', async ({ page }) => {
  await expect(page.getByRole('tab', { name: 'Summary' })).toHaveCount(2)
  await page.getByRole('tab', { name: 'Summary notes' }).click()
  await expect(page.getByTestId('active-tab')).toHaveText('notes')
})

test('a disabled tab looks enabled to Playwright', async ({ page }) => {
  const sequels = page.getByRole('tab', { name: 'Sequels' })
  // Naive: expect(sequels).toBeDisabled() fails.
  await expect(sequels).toBeEnabled()
  await expect(sequels).toHaveClass(/is-disabled/)
  await sequels.click()
  await expect(page.getByTestId('active-tab')).toHaveText('summary')
})
