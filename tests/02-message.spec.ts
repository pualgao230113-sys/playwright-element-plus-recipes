/**
 * Recipe 02 - ElMessage (toasts)
 *
 * Pitfalls:
 *  1. Toasts stack. `getByRole('alert')` alone matches every visible toast,
 *     including an older one from a previous step -> strict-mode error, or
 *     `.first()` silently checks the wrong toast.
 *  2. Toasts time out (3 s by default). A toast from step N can still be on
 *     screen when step N+1 asserts "the same" toast text.
 *  3. `expect(toasts).toHaveCount(0)` cannot prove a toast NEVER appeared:
 *     the assertion retries, so a toast that appeared and faded also passes.
 */
import { expect, test } from '@playwright/test'
import { drainMessages, message, messages, recordMessages } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/message')
})

test('match a toast by its text, not by position', async ({ page }) => {
  await page.getByRole('button', { name: 'Save book' }).click()
  await page.getByRole('button', { name: 'Delete book' }).click()

  // Two toasts are visible at once.
  await expect(messages(page)).toHaveCount(2)

  // Naive: expect(page.getByRole('alert')).toHaveText('Book deleted')
  //   -> strict mode violation (2 elements). With .first() it reads "Book saved".
  await expect(page.getByRole('alert').first()).toHaveText('Book saved')

  // Robust: filter by the exact text you expect.
  await expect(message(page, 'Book deleted')).toBeVisible()
})

test('assert the toast type through its modifier class', async ({ page }) => {
  await page.getByRole('button', { name: 'Sync library' }).click()
  const toast = message(page, 'Could not reach the library')
  await expect(toast).toBeVisible()
  await expect(toast).toHaveClass(/el-message--error/)
})

test('drain toasts before repeating an action with the same toast text', async ({ page }) => {
  await page.getByRole('button', { name: 'Save book' }).click()
  await expect(message(page, 'Book saved')).toBeVisible()

  // Without draining, the next toBeVisible() could pass on the OLD toast even
  // if the second save showed nothing at all.
  await drainMessages(page)

  await page.getByRole('button', { name: 'Save book' }).click()
  await expect(message(page, 'Book saved')).toHaveCount(1)
})

test('toHaveCount(0) is fooled by a toast that flashed and faded', async ({ page }) => {
  const recorded = await recordMessages(page)

  // "Refresh (buggy)" shows an error toast for 600 ms although it should be silent.
  await page.getByRole('button', { name: 'Refresh (buggy)' }).click()

  // Naive: this PASSES - it keeps retrying until the toast has faded.
  await expect(messages(page)).toHaveCount(0)

  // Robust: a MutationObserver installed before the action saw it.
  expect(await recorded()).toEqual(['Unexpected warning'])
})

test('prove that a quiet action really shows no toast', async ({ page }) => {
  const recorded = await recordMessages(page)
  await page.getByRole('button', { name: 'Refresh (correct)' }).click()

  // Give a would-be toast a fair chance to appear, then check the recording.
  // A short fixed wait is acceptable here: we are asserting an absence.
  await page.waitForTimeout(500)
  expect(await recorded()).toEqual([])
})
