/**
 * Recipe 09 - viewport size and popper placement
 *
 * Pitfalls:
 *  1. Element Plus poppers (select dropdowns, date panels, tooltips) flip
 *     above their trigger when there is no room below. The same test can
 *     pass on a 1080p CI runner and fail on a laptop - or produce different
 *     screenshots - purely because of viewport height.
 *  2. Coordinate-based clicks (page.mouse.click(x, y)) or "the option below
 *     the input" style assumptions break when the popper flips.
 *
 * Robust: pin the viewport in playwright.config.ts (this repo uses
 * 1280x800), use locators instead of coordinates, and when placement
 * matters, assert `data-popper-placement` explicitly.
 */
import { expect, test } from '@playwright/test'
import { openSelect, selectOption } from './helpers/element-plus'

test.describe('short viewport', () => {
  test.use({ viewport: { width: 1280, height: 560 } })

  test('the dropdown flips to the top', async ({ page }) => {
    await page.goto('/popper')
    const listbox = await openSelect(page, 'Colour')
    const popper = page.locator('.el-select__popper', { has: listbox })
    await expect(popper).toHaveAttribute('data-popper-placement', /^top/)

    // Locator-based picking does not care where the popper went.
    await listbox.getByRole('option', { name: 'Indigo', exact: true }).click()
    await expect(page.getByTestId('colour-value')).toHaveText('Indigo')
  })
})

test.describe('tall viewport', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('the same dropdown opens below', async ({ page }) => {
    await page.goto('/popper')
    const listbox = await openSelect(page, 'Colour')
    const popper = page.locator('.el-select__popper', { has: listbox })
    await expect(popper).toHaveAttribute('data-popper-placement', /^bottom/)
  })
})

test('the popper is positioned against the viewport, so placement can change mid-test', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/popper')
  await selectOption(page, 'Colour', 'Green')

  // Resize, reopen: now it flips. Do not cache "which side" across steps.
  await page.setViewportSize({ width: 1280, height: 560 })
  const listbox = await openSelect(page, 'Colour')
  await expect(page.locator('.el-select__popper', { has: listbox })).toHaveAttribute('data-popper-placement', /^top/)
})
