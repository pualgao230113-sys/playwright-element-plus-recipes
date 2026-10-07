/**
 * Recipe 20 - ElNotification
 *
 * Pitfalls:
 *  1. Notifications are role="alert", like ElMessage toasts, and they stack.
 *     getByRole('alert') matches every one of them.
 *  2. The title is an <h2>. While a notification is open, a page-level
 *     getByRole('heading', { level: 2 }) also matches the notification.
 *  3. The type is a class on the ICON (`el-notification--error`), not on the
 *     box.
 *  4. The close "button" is an <i> icon with no role, so
 *     getByRole('button', { name: 'Close' }) finds nothing.
 *  5. Hovering a notification pauses its timer. A test that leaves the mouse
 *     over it waits forever for it to close.
 */
import { expect, test } from '@playwright/test'
import { closeNotification, drainNotifications, notification, notifications } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/notification')
})

test('match by title, not by role="alert"', async ({ page }) => {
  await page.getByRole('button', { name: 'Complete todo' }).click()
  await page.getByRole('button', { name: 'Sync' }).click()
  await expect(page.getByRole('alert')).toHaveCount(2)

  const failed = notification(page, 'Sync failed')
  await expect(failed).toContainText('Could not reach the server')
  await expect(failed.locator('.el-notification__icon')).toHaveClass(/el-notification--error/)
  await expect(failed).not.toHaveClass(/el-notification--error/)
})

test('the title is a level-2 heading', async ({ page }) => {
  const before = await page.getByRole('heading', { level: 2 }).count()
  await page.getByRole('button', { name: 'Complete todo' }).click()
  // A page-level heading query now also finds the notification title.
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(before + 1)
  await expect(page.getByRole('heading', { level: 2, name: 'Todo done' })).toBeVisible()
  // Scope page headings to <main> to stay clear of it.
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Notification')
})

test('close a sticky notification with its icon', async ({ page }) => {
  await page.getByRole('button', { name: 'Remind me' }).click()
  const reminder = notification(page, 'Reminder')
  await expect(reminder).toBeVisible()
  await expect(reminder.getByRole('button')).toHaveCount(0)
  // duration: 0 never closes by itself: still there after the default 4.5 s.
  await page.mouse.move(0, 0)
  await page.waitForTimeout(5_000)
  await expect(reminder).toBeVisible()

  await closeNotification(page, 'Reminder')
  await expect(notifications(page)).toHaveCount(0)
})

test('hovering pauses the timer', async ({ page }) => {
  await page.getByRole('button', { name: 'Complete todo' }).click()
  const done = notification(page, 'Todo done')
  await done.hover()
  // The default duration is 4.5 s. Still there after 5 s.
  await page.waitForTimeout(5_000)
  await expect(done).toBeVisible()

  // drainNotifications() moves the mouse away first.
  await drainNotifications(page)
})
