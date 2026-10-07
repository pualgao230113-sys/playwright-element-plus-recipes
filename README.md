# playwright-element-plus-recipes

**Tested recipes for the Element Plus quirks that make Playwright tests flaky, each one shown as pitfall, then why, then a robust pattern.**

<!-- TODO: add a GIF or screenshot of the demo app / test run here -->
<p align="center"><em>[ GIF / screenshot placeholder ]</em></p>

## Why this exists

[Element Plus](https://element-plus.org) is one of the most widely used Vue 3 component libraries, and [Playwright](https://playwright.dev) is the go-to E2E tool. Very little is written about using the two together, and the problems you run into are rarely Playwright bugs. They come from how Element Plus builds its components:

- dropdowns are teleported to `<body>`, so the options are not inside the select;
- the real `<input>` of a checkbox, radio or switch is hidden;
- toasts stack and fade, so a toast can disappear before an assertion that it never appeared even runs;
- a date picker reads `3/4/2026` as **4 March** even when its display format is `DD/MM/YYYY`;
- the red "required" asterisk ends up inside a field's accessible name.

This repo collects those cases. Each recipe is a small page in a Vue 3 + Element Plus demo app and a Playwright spec that **passes**. Where it helps, the spec also runs the naive version, so you can watch it fail or give a false result.

## Quick start

```bash
git clone <this repo>
cd playwright-element-plus-recipes
npm install
npx playwright install chromium   # first time only
npm test                          # starts the demo app on :5179 and runs every recipe
```

| Script | What it does |
|---|---|
| `npm run dev` | Demo app at <http://localhost:5179>, one page per recipe |
| `npm test` | Full Playwright suite (headless Chromium, 1 worker) |
| `npm run test:ui` | Playwright UI mode, good for stepping through a recipe |

The reusable helpers live in [`tests/helpers/element-plus.ts`](tests/helpers/element-plus.ts) (`selectOption`, `selectOptions`, `searchAndSelect`, `drainMessages`, `recordMessages`, `setChecked`, `setSwitch`, `typeDate`, `pickDay`, `formItem`/`formError`, `rowByCell`, `waitForTable`, ...). Copy the file into your own project as a starting point.

## Recipes

| # | Component | Pitfall | Robust pattern | Spec |
|---|---|---|---|---|
| 01 | `el-select` | Options are teleported to `<body>`. Clicking the combobox `<input>` is intercepted by the placeholder. `"Apple"` also matches `"Pineapple"`. A multiple select stays open. A remote select stays hidden until results arrive. | Click the `.el-select` root. Follow `aria-controls` to **that** select's listbox. Use exact role names. Press Escape after multi-picks. Wait for the option, never for a fixed time. | [01-select](tests/01-select.spec.ts) |
| 02 | `ElMessage` | Toasts stack, so `getByRole('alert')` hits the old toast. `toHaveCount(0)` also passes for a toast that **appeared and faded**. | Match toasts by exact text. Call `drainMessages()` before repeating an action. To prove "no toast", install a `MutationObserver` (`recordMessages()`) before the action. | [02-message](tests/02-message.spec.ts) |
| 03 | `el-checkbox` / `el-radio` / `el-switch` | The real input is hidden: `check()` times out and `force` fails with "outside of the viewport". Option text repeats across groups. Switch texts toggle rather than set. After a label click, the switch's native `checked` disagrees with `aria-checked`. | Call `setChecked()` on the `<label>`. Scope to the `radiogroup`. Read switch state from `aria-checked` / `.is-checked`, not `toBeChecked()`. | [03-checkbox-radio-switch](tests/03-checkbox-radio-switch.spec.ts) |
| 04 | `el-date-picker` | `format` is not the same as `value-format`. Typed text only commits on Enter/blur and is parsed leniently: `3/4/2026` becomes 4 March, `31/02` rolls over, `15/3/2026` reverts silently. Day numbers repeat in the grid. "Today" moves. Without `value-format`, the Date serialises to the **previous day** east of UTC. | Type in the display format, then assert both the shown value and the model. Freeze the clock with `page.clock`. Pick only `td.available` cells. Set `value-format` in the app. | [04-date-picker](tests/04-date-picker.spec.ts) |
| 05 | `el-dialog` / `el-drawer` / `ElMessageBox` | A closed dialog stays in the DOM. `"Delete"` substring-matches the page's `"Delete book"`. Scroll-lock is a `<body>` class that is removed only after the transition. The message box lives outside `#app`. | `getByRole('dialog', { name })` scoping. `toBeHidden()` rather than `toHaveCount(0)`. Exact button names. A retrying assertion on the body class. | [05-dialog-drawer-messagebox](tests/05-dialog-drawer-messagebox.spec.ts) |
| 06 | `el-table` | The header and body are separate `<table>`s. The empty text is already visible **under the loading mask**. Generated column classes are unstable. The "Sort by X" button jumps straight to *descending*, and a second click clears the sort. | Wait for `.el-loading-mask` to hide. Count only `tbody tr.el-table__row`. Use your own `class-name` per column. Find rows by a specific cell. Click the header cell to cycle or a caret to set, and assert `aria-sort`. | [06-table](tests/06-table.spec.ts) |
| 07 | `el-form` | `trigger: 'blur'` rules do nothing until blur. An async validator makes "no error" pass too early. The required asterisk is part of the accessible name (`"* Username"`). | Press Tab to blur. Wait for `is-success` / `is-validating`. Match names with an anchored RegExp (`/Username$/`). | [07-form-validation](tests/07-form-validation.spec.ts) |
| 08 | `el-input` | `maxlength` makes the browser truncate `fill()`. The clear icon is `visibility: hidden` until hover. `fill('')` does not emit `clear`. | Assert the truncated value and the `role="status"` counter. Hover before clicking clear. Click the icon when the app relies on `@clear`. | [08-input](tests/08-input.spec.ts) |
| 09 | Poppers + viewport | Dropdowns flip above the trigger when there's no room below, so results depend on screen height. | Pin the viewport in the config, use locators rather than coordinates, and assert `data-popper-placement` when placement matters. | [09-viewport-popper](tests/09-viewport-popper.spec.ts) |

## Versions tested

| Package | Version |
|---|---|
| Vue | 3.5.43 |
| Element Plus | 2.14.7 |
| @playwright/test | 1.63.0 (Chromium headless shell 153) |
| Vite | 8.3.3 |
| Node.js | 24 |

Some of these behaviours (lenient date parsing, the switch `checked`/`aria-checked` mismatch, the caret-button click target) are implementation details of Element Plus. They may change in a future release. If a recipe starts failing after an upgrade, that tells you something changed, so check the recipe before rewriting your own tests.

## Project layout

```
src/pages/          one small page per recipe (fruits, books, plain demo data)
tests/NN-*.spec.ts  one spec per recipe; the doc comment at the top lists the pitfalls
tests/helpers/      reusable Element Plus helpers
```

## 中文简介

这是一个用 **Playwright 测试 Element Plus（Vue 3）** 的实战"踩坑食谱"。网上很少有针对这个组合的资料。每个食谱都按"坑 → 原因 → 稳定写法"组织，配一个可运行、能通过的测试。

收录的坑包括：

- el-select 下拉框被 teleport 到 `<body>`；
- 复选框、单选框、开关的真实 input 被隐藏；
- ElMessage 叠加和淡出，导致 `toHaveCount(0)` 无法证明"从未出现"；
- 日期选择器宽松解析，`DD/MM/YYYY` 下输入 `3/4/2026` 会变成 3 月 4 日；不设 `value-format` 时，在东半球时区会序列化成前一天；
- 表格加载遮罩下已经显示"空数据"；
- 必填星号会进入可访问名称；
- 弹出层在视口较矮时翻转到上方。

运行方法：`npm install` → `npx playwright install chromium` → `npm test`。

## License

[MIT](LICENSE) © 2026 Paul Gao
