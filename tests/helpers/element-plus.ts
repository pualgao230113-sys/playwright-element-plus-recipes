/**
 * Small, dependency-free helpers for driving Element Plus components from
 * Playwright. Each helper is the working pattern from one recipe;
 * the spec files explain the pitfall it avoids.
 */
import { expect, type Locator, type Page } from '@playwright/test'

/** Escape a string for use inside a RegExp. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** RegExp that matches the whole (trimmed) text exactly. */
export function exactText(text: string): RegExp {
  return new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`)
}

/**
 * An accessible name to match: a string is matched EXACTLY, a RegExp as given.
 *
 * Use a RegExp for fields inside a required el-form-item: the red asterisk is
 * CSS `::before` content on the label, and it becomes part of the accessible
 * name ("* Username"), so an exact string match finds nothing.
 */
export type Name = string | RegExp

function byName(name: Name): { name: Name; exact?: boolean } {
  return typeof name === 'string' ? { name, exact: true } : { name }
}

/** The combobox `<input>` of an el-select / el-date-picker. */
export function combobox(page: Page, name: Name): Locator {
  return page.getByRole('combobox', byName(name))
}

// ---------------------------------------------------------------------------
// el-select
// ---------------------------------------------------------------------------

/**
 * The `.el-select` root for a select whose input has the given accessible
 * name (from `aria-label`, or an `el-form-item` label).
 *
 * Use `exact: true`: by default Playwright matches names by substring, so
 * "Fruit" would also match a select labelled "Filtered fruit".
 */
export function selectRoot(page: Page, label: Name): Locator {
  return page.locator('.el-select', {
    has: combobox(page, label),
  })
}

/**
 * Open a select and return ITS listbox.
 *
 * - We click the `.el-select` wrapper, not the combobox `<input>`: on a
 *   non-filterable select the placeholder/selected-label element sits on top
 *   of the tiny input and intercepts the click.
 * - The dropdown is teleported to `<body>`, so it is NOT inside the select.
 *   The input's `aria-controls` points at the listbox id, which ties the two
 *   together even while another select's popper is still fading out.
 */
export async function openSelect(page: Page, label: Name): Promise<Locator> {
  const input = combobox(page, label)
  const listboxId = await input.getAttribute('aria-controls')
  if (!listboxId) throw new Error(`Select "${label}" has no aria-controls`)
  const listbox = page.locator(`[id="${listboxId}"]`)

  if ((await input.getAttribute('aria-expanded')) !== 'true') {
    await selectRoot(page, label).click()
  }
  await expect(listbox).toBeVisible()
  return listbox
}

/** Pick one option (by exact visible label) from a single select. */
export async function selectOption(page: Page, label: Name, option: string): Promise<void> {
  const listbox = await openSelect(page, label)
  await listbox.getByRole('option', { name: option, exact: true }).click()
  // A single select closes after a pick; wait so the next step does not race
  // the fade-out transition.
  await expect(listbox).toBeHidden()
}

/**
 * Pick several options from a `multiple` select. The dropdown stays open
 * between picks, so close it explicitly with Escape at the end.
 */
export async function selectOptions(page: Page, label: Name, options: string[]): Promise<void> {
  const listbox = await openSelect(page, label)
  for (const option of options) {
    await listbox.getByRole('option', { name: option, exact: true }).click()
  }
  await page.keyboard.press('Escape')
  await expect(listbox).toBeHidden()
}

/** Labels of the tags a `multiple` select currently shows. */
export function selectTags(page: Page, label: Name): Locator {
  return selectRoot(page, label).locator('.el-select__tags-text')
}

/**
 * Type into a filterable / remote select and pick a result. Waits for the
 * option to exist instead of sleeping for the debounce + request time.
 */
export async function searchAndSelect(
  page: Page,
  label: Name,
  query: string,
  option: string,
): Promise<void> {
  const input = combobox(page, label)
  const listbox = page.locator(`[id="${await input.getAttribute('aria-controls')}"]`)
  // Do not wait for the listbox here: a remote select with no results yet
  // keeps its dropdown hidden until the first response arrives.
  await selectRoot(page, label).click()
  await input.fill(query)
  const target = listbox.getByRole('option', { name: option, exact: true })
  await expect(target).toBeVisible()
  await target.click()
  await expect(listbox).toBeHidden()
}

// ---------------------------------------------------------------------------
// ElMessage
// ---------------------------------------------------------------------------

/** All ElMessage toasts currently on screen (they render with role="alert"). */
export function messages(page: Page): Locator {
  return page.locator('.el-message')
}

/** One toast, matched by its full text. */
export function message(page: Page, text: string): Locator {
  return messages(page).filter({ hasText: exactText(text) })
}

/**
 * Wait until every toast has faded out. Call this before an action whose
 * own toast you are about to assert, so an older toast with the same text
 * cannot satisfy (or confuse) the assertion.
 */
export async function drainMessages(page: Page, timeout = 10_000): Promise<void> {
  await expect(messages(page)).toHaveCount(0, { timeout })
}

/**
 * Start recording every ElMessage that gets added to the page, even ones that
 * disappear again before any assertion runs. Returns a function that reads
 * the recorded texts.
 *
 * This is the only reliable way to prove "no toast appeared": a negative
 * `toHaveCount(0)` is also satisfied by a toast that showed and then faded.
 */
export async function recordMessages(page: Page): Promise<() => Promise<string[]>> {
  await page.evaluate(() => {
    const w = window as unknown as { __epMessages?: string[]; __epObserver?: MutationObserver }
    w.__epObserver?.disconnect()
    w.__epMessages = []
    w.__epObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.classList.contains('el-message')) {
            w.__epMessages!.push(node.textContent?.trim() ?? '')
          }
        })
      }
    })
    w.__epObserver.observe(document.body, { childList: true, subtree: true })
  })
  return () =>
    page.evaluate(() => [...((window as unknown as { __epMessages?: string[] }).__epMessages ?? [])])
}

// ---------------------------------------------------------------------------
// el-checkbox / el-radio / el-switch
// ---------------------------------------------------------------------------

/**
 * Set an el-checkbox to a state through its visible `<label>` wrapper.
 *
 * The real `<input>` is visually hidden (zero size, opacity 0), so
 * `getByRole('checkbox').check()` fails Playwright's visibility check, and
 * `{ force: true }` fails with "outside of the viewport". Calling
 * `setChecked()` on the LABEL works: Playwright reads the state from the
 * label's control and clicks the label itself. It is also idempotent, unlike
 * a plain `click()`.
 */
export async function setChecked(page: Page, label: Name, checked: boolean): Promise<void> {
  const input = page.getByRole('checkbox', byName(label))
  await page.locator('label.el-checkbox', { has: input }).setChecked(checked)
  // Reading state from the hidden input is fine: assertions do not require visibility.
  await expect(input).toBeChecked({ checked })
}

/**
 * Set an el-switch through its wrapper. The switch `<input role="switch">`
 * is hidden too, and the active/inactive texts both just TOGGLE: clicking
 * "Dark" while it is already on turns it off. So check state first.
 *
 * State is read from `aria-checked`, NOT `toBeChecked()`: after a click on
 * the form-item label, the native `checked` property of the input can be out
 * of sync with the component (aria-checked="true", checked === false).
 */
export async function setSwitch(sw: Locator, on: boolean): Promise<void> {
  const input = sw.getByRole('switch')
  if ((await input.getAttribute('aria-checked')) !== String(on)) {
    await sw.locator('.el-switch__core').click()
  }
  await expect(input).toHaveAttribute('aria-checked', String(on))
}

// ---------------------------------------------------------------------------
// el-date-picker
// ---------------------------------------------------------------------------

/**
 * Type a date into a date picker in its DISPLAY format (the `format` prop,
 * e.g. DD/MM/YYYY) and commit it with Enter.
 */
export async function typeDate(page: Page, label: Name, displayValue: string): Promise<void> {
  const input = combobox(page, label)
  await input.fill(displayValue)
  await input.press('Enter')
  await expect(input).toHaveValue(displayValue)
}

/**
 * Open a date picker and click a day of the CURRENTLY SHOWN month.
 * Only `td.available` cells belong to the shown month; the greyed-out
 * leading/trailing days of the neighbouring months carry the same numbers.
 */
export async function pickDay(page: Page, label: Name, day: number): Promise<void> {
  const input = combobox(page, label)
  const panelId = await input.getAttribute('aria-controls')
  await input.click()
  const panel = page.locator(`[id="${panelId}"]`)
  await expect(panel).toBeVisible()
  await panel
    .locator('td.available')
    .filter({ has: page.locator('.el-date-table-cell__text', { hasText: exactText(String(day)) }) })
    .click()
  await expect(panel).toBeHidden()
}

// ---------------------------------------------------------------------------
// el-form
// ---------------------------------------------------------------------------

/** The `.el-form-item` whose label text is exactly `label`. */
export function formItem(page: Page, label: Name): Locator {
  // textContent does not include the CSS asterisk, so an exact match is safe here.
  return page.locator('.el-form-item', {
    has: page.locator('.el-form-item__label', {
      hasText: typeof label === 'string' ? exactText(label) : label,
    }),
  })
}

/** The validation error element of a form item. */
export function formError(page: Page, label: Name): Locator {
  return formItem(page, label).locator('.el-form-item__error')
}

// ---------------------------------------------------------------------------
// el-table
// ---------------------------------------------------------------------------

/** Wait until the table's v-loading mask is gone. */
export async function waitForTable(table: Locator): Promise<void> {
  await expect(table.locator('.el-loading-mask')).toBeHidden()
}

/** Body rows only. Header cells live in a separate `<table>`. */
export function tableRows(table: Locator): Locator {
  return table.locator('.el-table__body tr.el-table__row')
}

/**
 * A body row whose cell in column `columnClass` (set via the column's
 * `class-name` prop) has exactly the given text.
 */
export function rowByCell(table: Locator, columnClass: string, text: string): Locator {
  return tableRows(table).filter({
    has: table.page().locator(`td.${columnClass}`, { hasText: exactText(text) }),
  })
}

/** Texts of one column, top to bottom, from body rows only. */
export function columnTexts(table: Locator, columnClass: string): Promise<string[]> {
  return tableRows(table)
    .locator(`td.${columnClass}`)
    .allInnerTexts()
    .then((texts) => texts.map((t) => t.trim()))
}

// ---------------------------------------------------------------------------
// Teleported poppers in general
// ---------------------------------------------------------------------------

/**
 * The element that `trigger` points at through `aria-controls` (default) or
 * `aria-describedby`. Element Plus teleports poppers to `<body>`, so this id
 * link is the only thing that ties a trigger to ITS popper.
 *
 * Some components (cascader, tooltip, popconfirm) only set
 * `aria-describedby` while the popper is open, so call this after opening.
 */
export async function popperOf(
  page: Page,
  trigger: Locator,
  attribute: 'aria-controls' | 'aria-describedby' = 'aria-controls',
): Promise<Locator> {
  await expect(trigger).toHaveAttribute(attribute, /.+/)
  const id = await trigger.getAttribute(attribute)
  return page.locator(`[id="${id}"]`)
}

// ---------------------------------------------------------------------------
// el-cascader
// ---------------------------------------------------------------------------

/**
 * The `.el-cascader` root whose text input has the given accessible name.
 * The cascader input is a plain `textbox` (not a combobox) with no
 * `aria-controls`.
 */
export function cascaderRoot(page: Page, label: Name): Locator {
  return page.locator('.el-cascader', { has: page.getByRole('textbox', byName(label)) })
}

/**
 * Open a cascader and return ITS panel. The wrapper only gets
 * `aria-describedby` (pointing at the teleported panel) while open.
 */
export async function openCascader(page: Page, label: Name): Promise<Locator> {
  const root = cascaderRoot(page, label)
  if ((await root.getAttribute('aria-describedby')) === null) await root.click()
  const panel = await popperOf(page, root, 'aria-describedby')
  await expect(panel).toBeVisible()
  return panel
}

/**
 * Click through a cascader path, e.g. `['Fruit', 'Citrus', 'Lemon']`.
 * Clicking a parent only opens the next column; the model changes when the
 * leaf is clicked, and then the panel closes.
 */
export async function pickCascaderPath(page: Page, label: Name, path: string[]): Promise<void> {
  const panel = await openCascader(page, label)
  for (const step of path) {
    await panel.getByRole('menuitem', { name: step, exact: true }).click()
  }
  await expect(panel).toBeHidden()
}

// ---------------------------------------------------------------------------
// el-tree / el-tree-select
// ---------------------------------------------------------------------------

/** A tree node by its exact label ("Fiction" must not match "Non-fiction"). */
export function treeNode(scope: Locator, label: string): Locator {
  return scope.getByRole('treeitem', { name: label, exact: true })
}

/**
 * Expand a tree node if it is collapsed. Child nodes are not rendered at all
 * until their parent has been expanded once.
 */
export async function expandTreeNode(scope: Locator, label: string): Promise<void> {
  const node = treeNode(scope, label)
  if ((await node.getAttribute('aria-expanded')) !== 'true') {
    // The first expand icon inside the node is the node's own.
    await node.locator('.el-tree-node__expand-icon').first().click()
  }
  await expect(node).toHaveAttribute('aria-expanded', 'true')
}

/**
 * Check or uncheck a tree node through its checkbox label. Clicking the node
 * text only expands it (unless the app sets `check-on-click-node`).
 */
export async function setTreeChecked(scope: Locator, label: string, checked: boolean): Promise<void> {
  const node = treeNode(scope, label)
  // `.first()`: an expanded node also contains its children's checkboxes.
  await node.locator('label.el-checkbox').first().setChecked(checked)
  await expect(node.getByRole('checkbox').first()).toBeChecked({ checked })
}

/**
 * Pick a node in an el-tree-select by its path, e.g. `['Fiction', 'Emma']`.
 * Parents are expanded, then the last label is clicked as an option.
 */
export async function selectTreeNode(page: Page, label: Name, path: string[]): Promise<void> {
  const listbox = await openSelect(page, label)
  for (const parent of path.slice(0, -1)) await expandTreeNode(listbox, parent)
  await listbox.getByRole('option', { name: path[path.length - 1], exact: true }).click()
  await expect(listbox).toBeHidden()
}

// ---------------------------------------------------------------------------
// el-autocomplete
// ---------------------------------------------------------------------------

/**
 * The suggestion listbox of an el-autocomplete. The named element is the
 * `textbox`; the `combobox` role sits on an unnamed wrapper.
 */
export async function autocompleteListbox(page: Page, label: Name): Promise<Locator> {
  return popperOf(page, page.getByRole('textbox', byName(label)))
}

/**
 * Type a query and click a suggestion. Pass `expected` (the full list the
 * query should produce) so the click cannot land on the previous query's
 * results, which stay on screen until the debounce has run.
 */
export async function pickSuggestion(
  page: Page,
  label: Name,
  query: string,
  option: string,
  expected?: string[],
): Promise<void> {
  const input = page.getByRole('textbox', byName(label))
  const listbox = await autocompleteListbox(page, label)
  await input.fill(query)
  if (expected) await expect(listbox.getByRole('option')).toHaveText(expected)
  await listbox.getByRole('option', { name: option, exact: true }).click()
  await expect(listbox).toBeHidden()
}

// ---------------------------------------------------------------------------
// el-input-number
// ---------------------------------------------------------------------------

/**
 * Type a number and commit it with Tab. min/max/step-strictly/precision are
 * only applied on commit, and `change` only fires then.
 * Returns the committed text so you can see what the component made of it.
 */
export async function setInputNumber(page: Page, label: Name, value: number | string): Promise<string> {
  const input = page.getByRole('spinbutton', byName(label))
  await input.fill(String(value))
  await input.press('Tab')
  return input.inputValue()
}

/** The +/- control of an el-input-number. Every field has the same names. */
export function inputNumberButton(page: Page, label: Name, which: 'increase' | 'decrease'): Locator {
  return page
    .locator('.el-input-number', { has: page.getByRole('spinbutton', byName(label)) })
    .getByRole('button', { name: `${which} number`, exact: true })
}

// ---------------------------------------------------------------------------
// el-time-picker
// ---------------------------------------------------------------------------

/**
 * Type a time into an el-time-picker in its display format and commit it.
 * Opens the panel first, like a user would. Opening it writes the current
 * time into the input, so the helper types over that value afterwards.
 */
export async function typeTime(page: Page, label: Name, displayValue: string): Promise<void> {
  const input = combobox(page, label)
  await input.click()
  await expect(await popperOf(page, input)).toBeVisible()
  await input.fill(displayValue)
  await input.press('Enter')
  await expect(input).toHaveValue(displayValue)
}

// ---------------------------------------------------------------------------
// el-upload
// ---------------------------------------------------------------------------

/** The hidden `<input type="file">` of an el-upload (it has `display: none`). */
export function uploadInput(upload: Locator): Locator {
  return upload.locator('input[type="file"]')
}

/**
 * File names in the upload list. Use these instead of the list item text:
 * each item also contains a hidden "press delete to remove" hint, which
 * toHaveText() includes.
 */
export function uploadedFileNames(scope: Locator): Locator {
  return scope.locator('.el-upload-list__item-file-name')
}

/**
 * Answer an upload endpoint with a fixed JSON body instead of a real server.
 * Without this, the POST fails and el-upload drops the file from its list.
 */
export async function fakeUploadEndpoint(
  page: Page,
  url: string | RegExp,
  body: unknown = { ok: true },
  status = 200,
): Promise<void> {
  await page.route(url, (route) => route.fulfill({ status, json: body }))
}

// ---------------------------------------------------------------------------
// el-pagination
// ---------------------------------------------------------------------------

/**
 * A page number in an el-pagination. Pages are `listitem`s labelled
 * "page N", not buttons, and "page 1" also matches "page 10" unless exact.
 */
export function pageButton(pagination: Locator, n: number): Locator {
  return pagination.getByRole('listitem', { name: `page ${n}`, exact: true })
}

/** The page that is currently selected (`aria-current="true"`). */
export function currentPage(pagination: Locator): Locator {
  return pagination.locator('.el-pager li[aria-current="true"]')
}

/** Type into the "Go to" jumper and commit with Enter. Values are clamped. */
export async function jumpToPage(pagination: Locator, n: number): Promise<void> {
  const jumper = pagination.getByRole('spinbutton')
  await jumper.fill(String(n))
  await jumper.press('Enter')
}

// ---------------------------------------------------------------------------
// el-dropdown
// ---------------------------------------------------------------------------

/**
 * Open an el-dropdown and return its teleported menu. Works for both
 * triggers: hover first (trigger="hover", the default), and if the menu did
 * not open, click (trigger="click").
 *
 * A hover menu closes as soon as the mouse leaves trigger and menu, so do not
 * move the mouse elsewhere between opening and picking.
 */
export async function openDropdown(page: Page, trigger: Locator): Promise<Locator> {
  const menu = await popperOf(page, trigger)
  await trigger.hover()
  try {
    await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout: 1_000 })
  } catch {
    await trigger.click()
  }
  await expect(menu).toBeVisible()
  return menu
}

/** Open a dropdown and click one of its items by exact text. */
export async function dropdownCommand(page: Page, trigger: Locator, item: string): Promise<void> {
  const menu = await openDropdown(page, trigger)
  await menu.getByRole('menuitem', { name: item, exact: true }).click()
  await expect(menu).toBeHidden()
}

// ---------------------------------------------------------------------------
// el-popconfirm / el-tooltip
// ---------------------------------------------------------------------------

/**
 * Click a popconfirm's reference button and answer it. Returns the popper
 * (role="tooltip", not "dialog"). The default button texts are "Yes" and
 * "No"; pass yours if the app sets confirm/cancel-button-text.
 */
export async function answerPopconfirm(
  page: Page,
  reference: Locator,
  answer: string,
): Promise<void> {
  await reference.click()
  const popper = await popperOf(page, reference, 'aria-describedby')
  await expect(popper).toBeVisible()
  await popper.getByRole('button', { name: answer, exact: true }).click()
  await expect(popper).toBeHidden()
}

// ---------------------------------------------------------------------------
// ElNotification
// ---------------------------------------------------------------------------

/** All ElNotification boxes currently on screen. */
export function notifications(page: Page): Locator {
  return page.locator('.el-notification')
}

/**
 * One notification, matched by its exact title. The title renders as a
 * level-2 heading inside the box.
 */
export function notification(page: Page, title: string): Locator {
  return notifications(page).filter({ has: page.getByRole('heading', { name: title, exact: true }) })
}

/**
 * Wait until every notification has closed. Moves the mouse away first:
 * a notification under the mouse pauses its own timer and never closes.
 * Sticky ones (`duration: 0`) never close by themselves; close them first.
 */
export async function drainNotifications(page: Page, timeout = 10_000): Promise<void> {
  await page.mouse.move(0, 0)
  await expect(notifications(page)).toHaveCount(0, { timeout })
}

/** Close a notification with its x icon (an `<i>`, not a button). */
export async function closeNotification(page: Page, title: string): Promise<void> {
  const box = notification(page, title)
  await box.locator('.el-notification__closeBtn').click()
  await expect(box).toHaveCount(0)
}

// ---------------------------------------------------------------------------
// el-collapse
// ---------------------------------------------------------------------------

/** A collapse item's header (role="button") by its exact title. */
export function collapseHeader(page: Page, title: string): Locator {
  return page.getByRole('button', { name: title, exact: true })
}

/**
 * Open or close a collapse item. Clicking the header toggles, so check
 * `aria-expanded` first. Waits for the end of the height transition when
 * opening, because the content counts as "visible" from its first pixel.
 */
export async function setCollapseItem(page: Page, title: string, open: boolean): Promise<void> {
  const header = collapseHeader(page, title)
  if ((await header.getAttribute('aria-expanded')) !== String(open)) await header.click()
  await expect(header).toHaveAttribute('aria-expanded', String(open))
  const content = page.locator(`[id="${await header.getAttribute('aria-controls')}"]`)
  if (open) {
    await expect(content).toBeVisible()
    // The wrapper animates its inline height; it is done when no height is set.
    await expect(content).not.toHaveAttribute('style', /height/)
  } else {
    await expect(content).toBeHidden()
  }
}
