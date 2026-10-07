/**
 * Recipe 05 - el-dialog / el-drawer / ElMessageBox
 *
 * Pitfalls:
 *  1. A closed el-dialog is not removed from the DOM (unless destroy-on-close
 *     / v-if); it is hidden after a fade-out. `toHaveCount(0)` on it fails,
 *     and text inside it still "exists".
 *  2. Button texts repeat between the page and the overlay ("Delete book" on
 *     the page vs "Delete" in the confirm box). Name matching is substring by
 *     default, so a page-level getByRole('button', { name: 'Delete' }) hits both.
 *  3. Scroll locking is done with a class on <body>; it is removed only after
 *     the close transition, so assert it with a retrying expect.
 *  4. ElMessageBox is created imperatively and appended to <body>, outside
 *     your component tree.
 */
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/dialog')
})

test('scope to the dialog by its accessible name', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit book' }).click()

  // el-dialog renders role="dialog" with aria-label = title.
  const dialog = page.getByRole('dialog', { name: 'Edit book' })
  await expect(dialog).toBeVisible()

  await dialog.getByRole('textbox', { name: 'Title' }).fill('Dune Messiah')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByTestId('saved-title')).toHaveText('Dune Messiah')
})

test('a closed dialog is hidden, not removed', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit book' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit book' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel' }).click()

  // Naive: expect(page.locator('.el-dialog')).toHaveCount(0) -> fails forever.
  await expect(page.locator('.el-dialog')).toHaveCount(1)
  // Robust: assert visibility. Role queries skip hidden elements, so this works too.
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('lock-scroll toggles a class on <body>', async ({ page }) => {
  const body = page.locator('body')
  await expect(body).not.toHaveClass(/el-popup-parent--hidden/)

  await page.getByRole('button', { name: 'Edit book' }).click()
  await expect(body).toHaveClass(/el-popup-parent--hidden/)

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Edit book' })).toBeHidden()
  // Retrying assertion: the class goes away at the end of the transition.
  await expect(body).not.toHaveClass(/el-popup-parent--hidden/)
})

test('drawer: same pattern, it is a role="dialog" too', async ({ page }) => {
  await page.getByRole('button', { name: 'Show details' }).click()
  const drawer = page.getByRole('dialog', { name: 'Book details' })
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('Frank Herbert')

  await drawer.getByRole('button', { name: 'Close details' }).click()
  await expect(drawer).toBeHidden()
})

test('ElMessageBox.confirm: scope buttons to the box, use exact names', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete book' }).click()
  const box = page.getByRole('dialog', { name: 'Delete book' })
  await expect(box).toBeVisible()
  await expect(box).toContainText('Delete "Dune"? This cannot be undone.')
  // It lives outside the Vue app root, so never scope it to a page section.
  expect(await box.evaluate((el) => el.closest('#app'))).toBeNull()

  // Naive: page.getByRole('button', { name: 'Delete' }) also matches the
  // page's own "Delete book" button -> strict mode violation.
  await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(2)

  await box.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(box).toBeHidden()
  await expect(page.getByTestId('status')).toHaveText('deleted')
})

test('ElMessageBox: Cancel rejects the promise, Escape too', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete book' }).click()
  const box = page.getByRole('dialog', { name: 'Delete book' })
  await box.getByRole('button', { name: 'Keep it' }).click()
  await expect(page.getByTestId('status')).toHaveText('kept')
  await expect(box).toBeHidden()

  // Reopen only after the previous box is gone, or two boxes overlap briefly.
  await page.getByRole('button', { name: 'Delete book' }).click()
  await expect(box).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(box).toBeHidden()
})
