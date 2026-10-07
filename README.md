# playwright-element-plus-recipes

**English** | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md) | [Bahasa Melayu](README.ms.md) | [हिन्दी](README.hi.md)

[![Tests](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml/badge.svg)](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://pualgao230113-sys.github.io/playwright-element-plus-recipes/) [![npm](https://img.shields.io/npm/v/playwright-element-plus)](https://www.npmjs.com/package/playwright-element-plus)

Element Plus components do things that break Playwright tests in confusing ways: dropdowns rendered somewhere else in the page, hidden inputs, toasts that stack, values that only commit on blur. This repo has a small demo app with one page per component, a Playwright spec for each that shows the problem happening, and the helpers, published on npm as [`playwright-element-plus`](https://www.npmjs.com/package/playwright-element-plus), for your own tests.

<p align="center"><img src="docs/demo.gif" alt="Playwright driving the demo app: picking from a select, stacking toasts, choosing a date" width="720"></p>

Live demo: <https://pualgao230113-sys.github.io/playwright-element-plus-recipes/>

Not affiliated with Element Plus or Playwright. The names are used only to describe what the project tests.

## Quick start

```bash
git clone https://github.com/pualgao230113-sys/playwright-element-plus-recipes.git
cd playwright-element-plus-recipes
npm ci
npx playwright install chromium   # first time only
npm test                          # starts the demo app on :5179 and runs every recipe
```

| Script | What it does |
|---|---|
| `npm run dev` | Demo app at <http://localhost:5179>, one page per recipe |
| `npm test` | Full Playwright suite (headless Chromium, 1 worker) |
| `npm run test:ui` | Playwright UI mode, for stepping through one recipe |
| `npm run typecheck` | Type-checks the app, the specs and the helpers |
| `npm run build` | Builds the demo app into `dist/` |
| `npm run build:helpers` | Builds the `playwright-element-plus` package into `packages/playwright-element-plus/dist/` |

## Use the helpers in your own project

```bash
npm i -D playwright-element-plus
```

Your project needs `@playwright/test` already; it is a peer dependency, tested with 1.63.

```ts
import { expect, test } from '@playwright/test'
import { drainMessages, message, selectOption } from 'playwright-element-plus'

test('save a fruit', async ({ page }) => {
  await page.goto('/fruits')
  await selectOption(page, 'Fruit', 'Apple')
  await drainMessages(page)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(message(page, 'Saved')).toBeVisible()
})
```

It works from ESM and CommonJS test projects, and the types come with it. Every helper is listed with an example in [docs/helpers.md](docs/helpers.md). The package's own README is [packages/playwright-element-plus/README.md](packages/playwright-element-plus/README.md). If you'd rather not add a dependency, copy [`packages/playwright-element-plus/src/index.ts`](packages/playwright-element-plus/src/index.ts) into your project. It only imports `@playwright/test`.

### Install the latest from GitHub

Only needed for changes that are on `main` but not released to npm yet.

```bash
npm i -D github:pualgao230113-sys/playwright-element-plus-recipes
```

This installs the repo under the name `playwright-element-plus-recipes`, so import from `'playwright-element-plus-recipes'` instead. npm builds the helpers during install (the repo's `prepare` script), so the first install takes a minute.

pnpm blocks build scripts of dependencies, so allow this one in `pnpm-workspace.yaml` first. With pnpm 11:

```yaml
allowBuilds:
  playwright-element-plus-recipes: true
```

With pnpm 10, add the entry pnpm prints in its `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` error to `onlyBuiltDependencies`. For a git dependency it includes the commit, so it changes when you update.

## Recipes

Each pitfall is marked **Common** (most apps that use the component will hit it) or **Specific** (only with the option or version in brackets). Every one is reproduced by a test in the linked spec.

One thing comes up on almost every page, and it is Playwright, not Element Plus: accessible names match by substring by default. `getByRole('option', { name: 'Apple' })` also finds "Pineapple", and `getByRole('button', { name: 'Delete' })` also finds a "Delete book" button. Pass `exact: true` or an anchored RegExp, and scope to the group, dialog or menu when the same text appears twice. The specs show it for selects ([01](tests/01-select.spec.ts)), radio groups ([03](tests/03-checkbox-radio-switch.spec.ts)), dialogs ([05](tests/05-dialog-drawer-messagebox.spec.ts)), trees ([11](tests/11-tree.spec.ts)), tabs ([16](tests/16-tabs.spec.ts)), menus ([18](tests/18-dropdown.spec.ts)) and collapse items ([21](tests/21-collapse.spec.ts)). The helpers use exact names.

| # | Component | Pitfalls | What to do | Spec |
|---|---|---|---|---|
| 01 | `el-select` | **Common:** options are teleported to `<body>`, not rendered inside the select.<br>**Common:** on a non-filterable select (the default), clicking the combobox `<input>` is intercepted by the placeholder. A filterable select's input can be clicked, except in 2.13.3–2.14.1, where the placeholder intercepts it too.<br>**Common:** a `multiple` select stays open after each pick.<br>**Specific** (`remote`): the dropdown stays hidden until the first results arrive. | Click the `.el-select` root. Follow `aria-controls` to that select's listbox. Press Escape after multi-picks. Wait for the option, not for a fixed time. | [01-select](tests/01-select.spec.ts) |
| 02 | `ElMessage` | **Common:** toasts stack, so `getByRole('alert')` hits older toasts too.<br>**Common:** `toHaveCount(0)` also passes for a toast that appeared and faded. | Match toasts by exact text. Call `drainMessages()` before repeating an action. To prove "no toast", start `recordMessages()` before the action. | [02-message](tests/02-message.spec.ts) |
| 03 | `el-checkbox` / `el-radio` / `el-switch` | **Common:** the real input is hidden: `check()` times out and `force` fails with "outside of the viewport".<br>**Specific** (`active-text` / `inactive-text`): the switch texts toggle, they don't set.<br>**Specific** (switch in an `el-form-item`, clicked via its label): the native `checked` disagrees with `aria-checked`. | Use the `setChecked()` helper. It calls Playwright's `setChecked()` on the checkbox's `label.el-checkbox` (plain checkboxes, not `el-checkbox-button`). For a radio, call Playwright's `check()` on its `<label>` inside the `radiogroup`. Read switch state from `aria-checked`, not `toBeChecked()`. | [03-checkbox-radio-switch](tests/03-checkbox-radio-switch.spec.ts) |
| 04 | `el-date-picker` | **Common:** `format` (shown) and `value-format` (stored) are different things.<br>**Common:** typed text only reaches the model on Enter or blur.<br>**Common:** day numbers repeat in the grid (the next month's first days are shown too).<br>**Common:** the calendar opens on today, so day clicks depend on the date.<br>**Specific** (no `value-format`, timezone east of UTC): the date serialises to the previous day.<br>**Specific** (typing, 2.14.4+): parsing is lenient: `3/4/2026` becomes 4 March, `31/02/2026` becomes 3 March, and `15/3/2026` is rejected while the old value stays. | Type in the display format, then check both the input and the model. Freeze the clock with `page.clock`. Pick only `td.available` cells. Set `value-format` in the app. | [04-date-picker](tests/04-date-picker.spec.ts) |
| 05 | `el-dialog` / `el-drawer` / `ElMessageBox` | **Common:** a closed dialog stays in the DOM.<br>**Common:** the message box is rendered outside `#app`.<br>**Specific** (asserting scroll lock): the lock is a class on `<body>`, removed once the dialog has closed. | Scope with `getByRole('dialog', { name })`. Assert `toBeHidden()`, not `toHaveCount(0)`. Check the body class with a retrying `expect`. | [05-dialog-drawer-messagebox](tests/05-dialog-drawer-messagebox.spec.ts) |
| 06 | `el-table` | **Common:** `getByRole('row')` counts the header row too. The header is also a separate `<table>`.<br>**Common:** the empty text is already visible under the loading mask.<br>**Specific** (sortable columns, 2.13.0+): the "Sort by X" button jumps straight to descending, and a second click clears the sort. | Wait for `.el-loading-mask` to hide. Count `tbody tr.el-table__row`. Give columns your own `class-name` and find rows by cell. Click the header cell to cycle, or a caret to set, and check `aria-sort`. | [06-table](tests/06-table.spec.ts) |
| 07 | `el-form` | **Common:** `trigger: 'blur'` rules do nothing until the field loses focus.<br>**Common:** the required asterisk is part of the accessible name (`"* Username"`).<br>**Specific** (async validators): "no error" passes before the validator has answered. | Press Tab to blur. Wait for `is-success` / `is-validating`. Match names with an anchored RegExp (`/Username$/`). | [07-form-validation](tests/07-form-validation.spec.ts) |
| 08 | `el-input` | **Specific** (`maxlength`): the browser cuts what `fill()` types.<br>**Specific** (`clearable`): the clear icon can't be clicked until the input is hovered.<br>**Specific** (`@clear`): `fill('')` does not emit `clear`. | Assert the cut value and the counter. Hover before clicking clear. Click the icon when the app relies on `@clear`. | [08-input](tests/08-input.spec.ts) |
| 09 | Poppers and viewport | **Common:** dropdowns open above the trigger when there's no room below, so results depend on the window height. | Pin the viewport in the config, use locators instead of coordinates, and check `data-popper-placement` when the side matters. | [09-viewport-popper](tests/09-viewport-popper.spec.ts) |
| 10 | `el-cascader` | **Common:** the input is a `textbox`, not a combobox, and has no `aria-controls`. The panel is linked only through the wrapper's `aria-describedby`, and only while open.<br>**Common:** clicking a parent opens the next column but doesn't change the model; the leaf click does, and closes the panel.<br>**Common:** the input shows labels (`Fruit / Citrus / Lemon`), the model holds values.<br>**Specific** (`checkStrictly`): clicking a parent label only expands it; click its radio.<br>**Specific** (`filterable`): results are a plain list of full paths, not menu items.<br>**Specific** (`multiple`): the panel stays open, and checking a parent adds all its leaves. | Use `openCascader()` / `pickCascaderPath()`. Assert both the input and the model. | [10-cascader](tests/10-cascader.spec.ts) |
| 11 | `el-tree` / `el-tree-select` | **Common:** child nodes are not rendered until the parent has been expanded once.<br>**Common:** in a tree-select, clicking a parent expands it instead of picking it.<br>**Specific** (`show-checkbox`): clicking the node text expands it, it doesn't check it.<br>**Specific** (`show-checkbox`, some children checked): the parent treeitem says `aria-checked="false"`; only its checkbox is indeterminate, and it isn't in `getCheckedKeys()`.<br>**Specific** (`multiple` tree-select with checkboxes): the model holds leaf keys only. | Expand first (`expandTreeNode()`), check through the checkbox label (`setTreeChecked()`), and assert `toBeChecked({ indeterminate: true })` on the checkbox. | [11-tree](tests/11-tree.spec.ts) |
| 12 | `el-autocomplete` | **Common:** the named element is a `textbox`; the `combobox` role is on an unnamed wrapper.<br>**Common:** the previous suggestions stay on screen until the debounce runs, so waiting for "option X" can pass on the old list.<br>**Common:** Enter with nothing highlighted picks nothing: the model is the typed text and `select` never fires.<br>**Common:** typing a full suggestion is not the same as picking it. | Find the listbox through the textbox's `aria-controls` (2.13.1+). Wait for the whole new list with `toHaveText([...])`, then click. Check that `select` fired, and check the input too. | [12-autocomplete](tests/12-autocomplete.spec.ts) |
| 13 | `el-input-number` | **Common:** the model follows typing, but `change` fires only on blur or Enter.<br>**Common:** every field has buttons named "increase number" / "decrease number", and at the limit they only get an `is-disabled` class, so `toBeDisabled()` fails.<br>**Specific** (`min` / `max`): typing 25 into a max-10 field shows "25" while the model is already 10.<br>**Specific** (clearing the field): the model becomes empty, not `min`.<br>**Specific** (`precision` / `step-strictly`): values are rounded on commit (2.345 to 2.35, 10 to 12 with step 6). | Commit with Tab (`setInputNumber()`) and assert what the field shows afterwards. Scope the buttons to the field (`inputNumberButton()`) and check the class. | [13-input-number](tests/13-input-number.spec.ts) |
| 14 | `el-time-picker` / `el-time-select` | **Common:** opening the picker writes the current time into the input and the model. Escape and outside clicks keep it; only Cancel restores the old value.<br>**Common:** spinner items outside the visible part of a column can't be clicked: the active item intercepts the click.<br>**Common:** `el-time-select` is an `el-select`, not a time picker.<br>**Specific** (typing): parsing is lenient: `7:5` becomes 07:05, `25:99` becomes 02:39. | Freeze the clock. Type the time and press Enter (`typeTime()`). Use the select helpers for time-select. | [14-time-picker](tests/14-time-picker.spec.ts) |
| 15 | `el-upload` | **Common:** the real `<input type="file">` is `display: none`; call `setInputFiles()` on it directly.<br>**Common:** `accept` doesn't stop `setInputFiles()`, so only `before-upload` checks the type.<br>**Common:** without a server the request fails and the file drops out of the list.<br>**Common:** each list item also contains a hidden "press delete to remove" hint, which `toHaveText()` includes.<br>**Specific** (2.11.7+): the trigger name matches two buttons.<br>**Specific** (in-memory files): the `mimeType` you pass is what `before-upload` sees as `file.type`.<br>**Specific** (`limit`): an extra file goes to `on-exceed`; nothing throws.<br>**Specific** (no `multiple`): `setInputFiles()` with several files throws. | Use `uploadInput()` and `fakeUploadEndpoint()`. Assert file names with `uploadedFileNames()`. Build big files as buffers in the test. | [15-upload](tests/15-upload.spec.ts) |
| 16 | `el-tabs` | **Common:** inactive panes are in the DOM, just hidden.<br>**Specific** (`lazy`): the pane isn't in the DOM until its tab is opened, then it stays.<br>**Specific** (disabled tabs): only an `is-disabled` class; the click goes through and does nothing. | Assert on `getByRole('tabpanel', { name })` and `aria-selected`. Check the class for disabled tabs. | [16-tabs](tests/16-tabs.spec.ts) |
| 17 | `el-pagination` | **Common:** page numbers are list items labelled "page N", not buttons, and "page 1" also matches "page 10".<br>**Specific** (`jumper`): "Go to" does nothing while you type; it applies on Enter or blur, and clamps to the last page.<br>**Specific** (`sizes`): the page-size select has no accessible name, and a bigger page size can move you to another page. | Use `pageButton()` / `currentPage()` / `jumpToPage()`. Reach the size select through the pagination root. | [17-pagination](tests/17-pagination.spec.ts) |
| 18 | `el-dropdown` | **Common:** the menu is teleported; the trigger's `aria-controls` points at it. Closed menus stay in the DOM.<br>**Common:** a hover menu closes as soon as the mouse moves elsewhere.<br>**Specific** (`trigger="click"`): hovering does nothing.<br>**Specific** (disabled items): a click waits and times out; assert `toBeDisabled()` instead.<br>**Specific** (`split-button`): the menu opens from a separate "Toggle Dropdown" button. | Use `openDropdown()` / `dropdownCommand()`, and don't move the mouse between opening and picking. | [18-dropdown](tests/18-dropdown.spec.ts) |
| 19 | `el-popconfirm` / `el-tooltip` | **Common:** a popconfirm is `role="tooltip"`, not `dialog`.<br>**Common:** a popconfirm's content is only in the DOM while it is open, and so is a tooltip's (after hover).<br>**Specific** (apps that act on cancel): only the cancel button fires `cancel`. A click outside closes it without `cancel`. Escape closes it, also without `cancel`, only when focus is inside the popconfirm; with focus on the reference button, Escape does nothing. | Follow the reference's `aria-describedby` (`answerPopconfirm()`). Hover before asserting a tooltip, and check `toHaveAccessibleDescription()`. | [19-popconfirm-tooltip](tests/19-popconfirm-tooltip.spec.ts) |
| 20 | `ElNotification` | **Common:** notifications are `role="alert"` like toasts, and they stack.<br>**Common:** the close x is an `<i>` with no role.<br>**Common:** hovering a notification pauses its timer.<br>**Specific** (pages that query headings by level): the title is an `<h2>`.<br>**Specific** (asserting the type): the type class is on the icon, not the box. | Match by title (`notification()`), close with `closeNotification()`, and use `drainNotifications()`, which moves the mouse away first. | [20-notification](tests/20-notification.spec.ts) |
| 21 | `el-collapse` | **Common:** closed items keep their content in the DOM.<br>**Common:** clicking a header toggles, so an "open it" step closes an item that is already open.<br>**Specific** (screenshots or clicks right after opening): the content counts as visible from the first pixel of the animation. | Check `aria-expanded` before clicking (`setCollapseItem()`), and wait for the animation to end. | [21-collapse](tests/21-collapse.spec.ts) |

## Tested versions

Vue 3.5.43, @playwright/test 1.63.0 (Chromium headless shell), Vite 8.3.3, Node.js 24.

Each Element Plus version below was installed on its own and the whole suite run against it (111 tests). Where a behaviour changed between versions, the spec skips with the version in the reason, or asserts the right value for each version. CI runs the three supported versions.

| Element Plus | Result | Notes |
|---|---|---|
| 2.14.7 | 111 passed | All recipes apply. |
| 2.13.7 | 109 passed, 2 skipped | No lenient date parsing yet (04), no `role="status"` on the input counter (08). |
| 2.9.11 | 104 passed, 7 skipped | Also: no "Sort by" button or `aria-sort` in tables (06), and the autocomplete's `aria-controls` doesn't point at its listbox (12). |
| 2.7.8 | Not supported: 13 failed, 7 skipped | Date and time picker inputs have no `combobox` role, so their helpers find nothing. Also, a filterable select's placeholder still blocks clicks on its input (01), and a click outside does not close a popconfirm (19). |
| 2.4.4 | Not supported: 19 failed, 7 skipped | The same date picker, time picker and popconfirm failures as 2.7.8, plus 7 more in select, checkbox / radio, dialog, tree-select and pagination (for example, the select's placeholder doesn't block clicks on its input at all). |

Where each change happened, so you can tell which notes apply to your version:

| From | Change | Recipe |
|---|---|---|
| 2.11.7 | The upload trigger's wrapper gets `role="button"`, so the trigger name matches two buttons. | 15 |
| 2.12.0 | The tag close icon in a multiple select becomes a button named "Close this tag". The spec uses `.el-tag__close`, which works in every version. | 01 |
| 2.13.0 | Sortable headers get `aria-sort` and a "Sort by X" button. | 06 |
| 2.13.1 | The autocomplete textbox's `aria-controls` points at the listbox. Before, it is the literal string `"id"`. | 12 |
| 2.13.3–2.14.1 | A filterable select's input is intercepted by the placeholder too. Fixed in 2.14.2. | 01 |
| 2.13.4 | Cancel on an empty time picker leaves `null` in the model. Before, an empty string. | 14 |
| 2.14.0 | The input clear icon stays in the DOM while hidden. Before, it is only rendered on hover. Either way, hover first. | 08 |
| 2.14.4 | Typed dates are parsed leniently (`3/4/2026` becomes 4 March). Before, `3/4/2026` is rejected. | 04 |
| 2.14.5 | The word-limit counter gets `role="status"`. Before, use `.el-input__count`. | 08 |

## Limits and known differences

- Chromium only. The recipes were not run in Firefox or WebKit.
- Most of these behaviours are Element Plus implementation details, not documented API. If a recipe starts failing after an upgrade, something changed. Check the recipe before rewriting your own tests.
- The helpers match the English texts the demo app shows ("increase number", "page N", "Yes" / "No"). If your app uses another locale, pass your own names or adjust the helper.
- The demo pages are small on purpose. A real app adds its own timing (API calls, your own transitions), so keep waiting for results, not for time.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The main rule: a pitfall goes in only if a test reproduces it against the real library.

## License

[MIT](LICENSE) © 2026 Paul Gao

## Translations

The English README is the reference. Fixes to translations are welcome as pull requests.
