/**
 * Recipe 18 - el-dropdown
 *
 * Pitfalls:
 *  1. The menu is teleported to <body>. The trigger's `aria-controls` points
 *     at it.
 *  2. The default trigger is hover. The menu opens after a short delay and
 *     closes again when the mouse leaves trigger and menu, so moving the
 *     mouse elsewhere between "open" and "pick" closes it.
 *  3. With trigger="click", hovering does nothing.
 *  4. The same item text ("Share") exists in several menus. Hidden menus
 *     stay in the DOM.
 *  5. A disabled item has `aria-disabled="true"`, so a click waits for it to
 *     become enabled and times out. Assert toBeDisabled() instead.
 *  6. A split button is two buttons: the main action and "Toggle Dropdown".
 */
import { expect, test } from '@playwright/test'
import { dropdownCommand, openDropdown, popperOf } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/dropdown')
})

test('the menu is teleported; follow aria-controls', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Shelf actions' })
  const menu = await openDropdown(page, trigger)
  await expect(page.locator('.el-dropdown').first().getByRole('menu')).toHaveCount(0)
  await expect(menu).toHaveAttribute('role', 'menu')
  await expect(menu.getByRole('menuitem')).toHaveText(['Sort', 'Share', 'Archive'])
})

test('a hover menu closes when the mouse moves away', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Shelf actions' })
  const menu = await openDropdown(page, trigger)

  // Naive: open it, do something else with the mouse, then pick.
  await page.mouse.move(700, 600)
  await expect(menu).toBeHidden()

  await dropdownCommand(page, trigger, 'Sort')
  await expect(page.getByTestId('last')).toHaveText('hover: sort')
})

test('a click menu ignores hover', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Book actions' })
  const menu = await popperOf(page, trigger)
  await trigger.hover()
  // Give the hover delay a fair chance before asserting the absence.
  await page.waitForTimeout(500)
  await expect(menu).toBeHidden()

  await dropdownCommand(page, trigger, 'Share')
  await expect(page.getByTestId('last')).toHaveText('click: share')
})

test('same item text in two menus: scope to the open menu', async ({ page }) => {
  await openDropdown(page, page.getByRole('button', { name: 'Shelf actions' }))
  await page.mouse.move(700, 600)
  const menu = await openDropdown(page, page.getByRole('button', { name: 'Book actions' }))
  expect(await page.locator('.el-dropdown-menu__item', { hasText: 'Share' }).count()).toBe(2)
  await menu.getByRole('menuitem', { name: 'Share' }).click()
  await expect(page.getByTestId('last')).toHaveText('click: share')
})

test('a disabled item: assert it, do not click it', async ({ page }) => {
  const menu = await openDropdown(page, page.getByRole('button', { name: 'Shelf actions' }))
  const archive = menu.getByRole('menuitem', { name: 'Archive' })
  await expect(archive).toBeDisabled()
  await expect(archive.click({ timeout: 1_000 })).rejects.toThrow(/Timeout/)
})

test('split button: main action and menu are separate buttons', async ({ page }) => {
  await page.getByRole('button', { name: 'Read now' }).click()
  await expect(page.getByTestId('last')).toHaveText('split: main')

  await dropdownCommand(page, page.getByRole('button', { name: 'Toggle Dropdown' }), 'Read later')
  await expect(page.getByTestId('last')).toHaveText('split: later')
})
