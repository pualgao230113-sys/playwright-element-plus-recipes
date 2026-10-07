/**
 * Recipe 10 - el-cascader
 *
 * Pitfalls:
 *  1. The cascader input is a readonly `textbox`, not a combobox, and it has
 *     no `aria-controls`. The panel is teleported to <body>, and the panels
 *     of every cascader on the page stay in the DOM once opened.
 *  2. The only link from a cascader to its panel is `aria-describedby` on
 *     the `.el-cascader` wrapper, and it exists only while the panel is open.
 *  3. Clicking a parent ("Fruit") opens the next column but does not change
 *     the model. Only the leaf click does, and then the panel closes.
 *  4. The input shows labels joined with " / ", the model holds the values.
 *  5. With `checkStrictly`, clicking a parent label still only expands it.
 *     You have to click the node's radio to pick that level.
 *  6. A filterable cascader shows search results as a plain list of full
 *     paths ("Fruit / Berries / Blueberry"), not as menu items.
 *  7. A `multiple` cascader stays open after each check, and checking a
 *     parent puts every leaf under it into the model.
 */
import { expect, test } from '@playwright/test'
import { cascaderRoot, openCascader, pickCascaderPath } from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/cascader')
})

test('the input is a textbox, and the panel is linked only while open', async ({ page }) => {
  // Naive: treat it like el-select.
  await expect(page.getByRole('combobox', { name: 'Produce' })).toHaveCount(0)
  const input = page.getByRole('textbox', { name: 'Produce', exact: true })
  await expect(input).not.toHaveAttribute('aria-controls', /.*/)

  const root = cascaderRoot(page, 'Produce')
  await expect(root).not.toHaveAttribute('aria-describedby', /.*/)
  const panel = await openCascader(page, 'Produce')
  await expect(root).toHaveAttribute('aria-describedby', /.+/)
  // The panel is outside the cascader's subtree.
  await expect(root.getByRole('menuitem')).toHaveCount(0)
  await expect(panel.getByRole('menuitem')).toHaveText(['Fruit', 'Vegetables'])

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(root).not.toHaveAttribute('aria-describedby', /.*/)
})

test('a parent click does not change the model; the leaf click does', async ({ page }) => {
  const panel = await openCascader(page, 'Produce')
  await panel.getByRole('menuitem', { name: 'Fruit', exact: true }).click()
  await panel.getByRole('menuitem', { name: 'Citrus', exact: true }).click()
  await expect(page.getByTestId('basic-value')).toHaveText('(none)')

  await panel.getByRole('menuitem', { name: 'Lemon', exact: true }).click()
  await expect(panel).toBeHidden()
  // Labels in the input, values in the model.
  await expect(page.getByRole('textbox', { name: 'Produce', exact: true })).toHaveValue('Fruit / Citrus / Lemon')
  await expect(page.getByTestId('basic-value')).toHaveText('["fruit","citrus","lemon"]')
})

test('panels of other cascaders stay in the DOM', async ({ page }) => {
  await pickCascaderPath(page, 'Produce', ['Vegetables', 'Root', 'Carrot'])
  await expect(page.getByTestId('basic-value')).toHaveText('["vegetables","root","carrot"]')

  // The closed panel is still there; a CSS query finds its nodes.
  expect(await page.locator('.el-cascader-node', { hasText: 'Carrot' }).count()).toBe(1)
  // Role queries skip hidden elements, and the helper scopes to the open panel.
  await expect(page.getByRole('menuitem', { name: 'Carrot' })).toHaveCount(0)
  await pickCascaderPath(page, 'Hover produce', ['Vegetables', 'Root', 'Carrot'])
  await expect(page.getByTestId('hover-value')).toHaveText('["vegetables","root","carrot"]')
})

test('checkStrictly: click the radio to pick a parent level', async ({ page }) => {
  const panel = await openCascader(page, 'Any level')
  const fruit = panel.getByRole('menuitem', { name: 'Fruit', exact: true })

  // Naive: clicking the label only expands.
  await fruit.click()
  await expect(fruit).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByTestId('any-value')).toHaveText('(none)')

  await fruit.locator('.el-radio').click()
  await expect(page.getByTestId('any-value')).toHaveText('["fruit"]')
  // The panel stays open after picking a level this way.
  await expect(panel).toBeVisible()
})

test('filterable: results are a plain list of full paths', async ({ page }) => {
  const panel = await openCascader(page, 'Search produce')
  await page.getByRole('textbox', { name: 'Search produce' }).fill('berry')
  // Nothing is stored until you click a result.
  await expect(page.getByTestId('search-value')).toHaveText('(none)')

  await expect(panel.getByRole('menuitem')).toHaveCount(0)
  await expect(panel.getByRole('listitem')).toHaveText(['Fruit / Berries / Strawberry', 'Fruit / Berries / Blueberry'])
  await panel.getByRole('listitem').filter({ hasText: 'Fruit / Berries / Blueberry' }).click()
  await expect(page.getByTestId('search-value')).toHaveText('["fruit","berries","blueberry"]')
})

test('multiple: checking a parent picks all its leaves and the panel stays open', async ({ page }) => {
  const panel = await openCascader(page, 'Many produce')
  const fruit = panel.getByRole('menuitem', { name: 'Fruit', exact: true })

  // The checkbox input is hidden like any el-checkbox; click its wrapper.
  await fruit.locator('.el-checkbox').click()
  await expect(panel).toBeVisible()
  await expect(cascaderRoot(page, 'Many produce').locator('.el-tag')).toHaveText([
    'Fruit / Citrus / Lemon',
    'Fruit / Citrus / Orange',
    'Fruit / Berries / Strawberry',
    'Fruit / Berries / Blueberry',
  ])
  await expect(fruit.getByRole('checkbox')).toBeChecked()

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})
