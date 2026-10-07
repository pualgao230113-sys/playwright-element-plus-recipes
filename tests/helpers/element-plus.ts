/**
 * Small, dependency-free helpers for driving Element Plus components from
 * Playwright. Each helper encodes one "robust pattern" from the recipes;
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
