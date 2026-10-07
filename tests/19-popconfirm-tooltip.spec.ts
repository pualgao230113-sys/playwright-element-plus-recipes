/**
 * Recipe 19 - el-popconfirm / el-tooltip
 *
 * Pitfalls:
 *  1. A popconfirm is role="tooltip", not "dialog". getByRole('dialog')
 *     finds nothing.
 *  2. Its content (with the "Yes"/"No" buttons) is only in the DOM while it
 *     is open: not before the first open, and not after it closes. The
 *     reference button points at it with `aria-describedby` while open.
 *  3. Only the cancel button fires `cancel`. A click outside closes it
 *     silently. Escape closes it (again without `cancel`) only when focus is
 *     inside it; with focus on the reference button, Escape does nothing.
 *  4. A tooltip is not in the DOM until hovered, and it is removed again
 *     after the mouse leaves. A text query before hovering finds nothing.
 *  5. While a tooltip is open, the trigger's accessible description is the
 *     tooltip text, so toHaveAccessibleDescription() checks the link too.
 */
import { expect, test } from '@playwright/test'
import { answerPopconfirm, popperOf } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/popover')
})

test('popconfirm: role tooltip, linked by aria-describedby', async ({ page }) => {
  // Not hidden: not rendered at all before the first open.
  await expect(page.getByText('Remove this todo?')).toHaveCount(0)
  await expect(page.locator('.el-popconfirm')).toHaveCount(0)
  const reference = page.getByRole('button', { name: 'Remove todo' })
  await reference.click()

  await expect(page.getByRole('dialog')).toHaveCount(0)
  const popper = await popperOf(page, reference, 'aria-describedby')
  await expect(popper).toHaveAttribute('role', 'tooltip')
  await expect(popper).toContainText('Remove this todo?')
  await popper.getByRole('button', { name: 'Yes', exact: true }).click()
  await expect(page.getByTestId('status')).toHaveText('removed')
})

test('popconfirm: custom button texts, and cancel', async ({ page }) => {
  await answerPopconfirm(page, page.getByRole('button', { name: 'Clear todos' }), 'Clear')
  await expect(page.getByTestId('status')).toHaveText('cleared')

  await answerPopconfirm(page, page.getByRole('button', { name: 'Remove todo' }), 'No')
  await expect(page.getByTestId('status')).toHaveText('kept')
})

test('popconfirm: Escape closes it only when focus is inside', async ({ page }) => {
  const reference = page.getByRole('button', { name: 'Remove todo' })
  await reference.click()
  const popper = await popperOf(page, reference, 'aria-describedby')
  await expect(popper).toBeVisible()

  // Focus is still on the reference button: Escape does nothing.
  await expect(reference).toBeFocused()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500) // asserting an absence
  await expect(popper).toBeVisible()

  // Focus inside the popconfirm: Escape closes it, but `cancel` does not fire.
  await popper.getByRole('button', { name: 'No', exact: true }).focus()
  await page.keyboard.press('Escape')
  await expect(popper).toBeHidden()
  await expect(page.getByTestId('status')).toHaveText('(none)')
})

test('popconfirm: a click outside closes it without firing cancel', async ({ page }) => {
  const reference = page.getByRole('button', { name: 'Remove todo' })
  await reference.click()
  const popper = await popperOf(page, reference, 'aria-describedby')
  await expect(popper).toBeVisible()

  await page.getByRole('heading', { name: 'Popconfirm / Tooltip' }).click()
  await expect(popper).toBeHidden()
  await expect(page.getByTestId('status')).toHaveText('(none)')
  // Like a tooltip, the content is removed again once it has closed.
  await expect(page.locator('.el-popconfirm')).toHaveCount(0)
  await expect(page.getByText('Remove this todo?')).toHaveCount(0)
})

test('tooltip: hover first, then assert', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Water the plants' })
  await expect(page.getByText('Due tomorrow at 9:00')).toHaveCount(0)

  await button.hover()
  await expect(page.getByRole('tooltip', { name: 'Due tomorrow at 9:00' })).toBeVisible()
  await expect(button).toHaveAccessibleDescription('Due tomorrow at 9:00')

  await page.mouse.move(700, 600)
  await expect(page.getByText('Due tomorrow at 9:00')).toHaveCount(0)
  await expect(button).not.toHaveAttribute('aria-describedby', /.*/)
})
