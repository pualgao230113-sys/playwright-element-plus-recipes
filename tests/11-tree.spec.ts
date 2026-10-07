/**
 * Recipe 11 - el-tree with checkboxes / el-tree-select
 *
 * Pitfalls:
 *  1. Child nodes are not rendered until their parent has been expanded
 *     once. A locator for "Dune" finds nothing in a collapsed tree.
 *  2. Clicking the node text expands it; it does not check it.
 *  3. Names match by substring: "Fiction" also matches "Non-fiction".
 *  4. A half-checked parent reports `aria-checked="false"` on its treeitem.
 *     The indeterminate state is only on the checkbox input, and the parent
 *     is not in `getCheckedKeys()`.
 *  5. el-tree-select is an el-select with a tree inside. Nodes are options
 *     inside treeitems, and clicking a parent expands it, it does not pick it.
 *  6. A multiple tree-select with checkboxes stores LEAF keys only: checking
 *     "Fiction" puts its three books in the model, not "fiction".
 */
import { expect, test } from '@playwright/test'
import {
  expandTreeNode,
  openSelect,
  selectTags,
  selectTreeNode,
  setTreeChecked,
  treeNode,
} from './helpers/element-plus'

test.beforeEach(async ({ page }) => {
  await page.goto('/tree')
})

test('children do not exist until the parent is expanded', async ({ page }) => {
  const tree = page.getByRole('tree', { name: 'Library' })
  await expect(tree.locator('.el-tree-node__label', { hasText: 'Dune' })).toHaveCount(0)

  await expandTreeNode(tree, 'Fiction')
  await expect(treeNode(tree, 'Dune')).toBeVisible()

  // Collapse again: now the children stay in the DOM, just hidden.
  await tree.getByRole('treeitem', { name: 'Fiction', exact: true }).locator('.el-tree-node__expand-icon').first().click()
  await expect(treeNode(tree, 'Dune')).toHaveCount(0)
  await expect(tree.locator('.el-tree-node__label', { hasText: 'Dune' })).toHaveCount(1)
})

test('"Fiction" also matches "Non-fiction" unless exact', async ({ page }) => {
  const tree = page.getByRole('tree', { name: 'Library' })
  await expect(tree.getByRole('treeitem', { name: 'Fiction' })).toHaveCount(2)
  await expect(treeNode(tree, 'Fiction')).toHaveCount(1)
})

test('clicking the node text expands, it does not check', async ({ page }) => {
  const tree = page.getByRole('tree', { name: 'Library' })
  await treeNode(tree, 'Fiction').locator('.el-tree-node__label').first().click()
  await expect(treeNode(tree, 'Fiction')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByTestId('checked-value')).toHaveText('(none)')
})

test('a half-checked parent: read the checkbox, not the treeitem', async ({ page }) => {
  const tree = page.getByRole('tree', { name: 'Library' })
  await expandTreeNode(tree, 'Fiction')
  await setTreeChecked(tree, 'Dune', true)

  const fiction = treeNode(tree, 'Fiction')
  // Naive: the treeitem says "not checked" and nothing more.
  await expect(fiction).toHaveAttribute('aria-checked', 'false')
  // Better: the parent's own checkbox (the first one in the node) is mixed.
  await expect(fiction.getByRole('checkbox').first()).toBeChecked({ indeterminate: true })
  await expect(page.getByTestId('checked-value')).toHaveText('dune')
  await expect(page.getByTestId('half-value')).toHaveText('fiction')

  // Checking the rest makes the parent fully checked.
  await setTreeChecked(tree, 'Emma', true)
  await setTreeChecked(tree, 'Ulysses', true)
  await expect(fiction).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByTestId('checked-value')).toHaveText('fiction, dune, emma, ulysses')
})

test('tree-select: expand the parent, then pick the leaf option', async ({ page }) => {
  const listbox = await openSelect(page, 'Book')
  await listbox.getByRole('option', { name: 'Fiction', exact: true }).click()
  // Naive: that expanded "Fiction" but picked nothing.
  await expect(treeNode(listbox, 'Fiction')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByTestId('single-value')).toHaveText('(none)')
  await expect(listbox).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(listbox).toBeHidden()

  await selectTreeNode(page, 'Book', ['Fiction', 'Emma'])
  await expect(page.getByTestId('single-value')).toHaveText('emma')
})

test('multiple tree-select stores leaf keys only', async ({ page }) => {
  const listbox = await openSelect(page, 'Shelf')
  await setTreeChecked(listbox, 'Fiction', true)
  await expect(page.getByTestId('multi-value')).toHaveText('dune, emma, ulysses')
  await expect(selectTags(page, 'Shelf')).toHaveText(['Dune', 'Emma', 'Ulysses'])
  await page.keyboard.press('Escape')
  await expect(listbox).toBeHidden()
})
