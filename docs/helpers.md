# Helpers

All helpers live in one file, [`packages/playwright-element-plus/src/index.ts`](../packages/playwright-element-plus/src/index.ts), the source of the `playwright-element-plus` npm package. The recipes import it through `tests/helpers/element-plus.ts`. In your own project, install the package and import from it:

```bash
npm i -D playwright-element-plus
```

```ts
import { selectOption, drainMessages } from 'playwright-element-plus'
```

Every helper takes Playwright's own `Page` and `Locator` objects. There are no fixtures to register.

A `Name` is either a string, matched exactly, or a RegExp, matched as given. Use a RegExp such as `/Username$/` for fields inside a required `el-form-item`: the red asterisk ends up in the accessible name (`"* Username"`), so an exact string finds nothing.

## General

| Helper | What it does |
|---|---|
| `exactText(text: string): RegExp` | A RegExp that matches the whole trimmed text, for `hasText` filters. |
| `combobox(page, name: Name): Locator` | The `role="combobox"` input of an el-select, date picker or time picker. |
| `popperOf(page, trigger: Locator, attribute = 'aria-controls'): Promise<Locator>` | The teleported popper that `trigger` points at through `aria-controls` or `aria-describedby`. |

```ts
const panel = await popperOf(page, page.getByRole('button', { name: 'Remove todo' }), 'aria-describedby')
await panel.getByRole('button', { name: 'Yes', exact: true }).click()
```

## el-select

| Helper | What it does |
|---|---|
| `selectRoot(page, label: Name): Locator` | The `.el-select` wrapper of the select with that accessible name. |
| `openSelect(page, label: Name): Promise<Locator>` | Opens the select and returns its own listbox (found through `aria-controls`). |
| `selectOption(page, label: Name, option: string): Promise<void>` | Picks one option by exact label and waits for the dropdown to close. |
| `selectOptions(page, label: Name, options: string[]): Promise<void>` | Picks several options in a `multiple` select, then closes it with Escape. |
| `selectTags(page, label: Name): Locator` | The tag labels a `multiple` select shows. |
| `searchAndSelect(page, label: Name, query: string, option: string): Promise<void>` | Types into a filterable or remote select and picks the result once it shows up. |

```ts
await selectOption(page, 'Fruit', 'Apple')
await selectOptions(page, 'Basket', ['Banana', 'Mango'])
await expect(selectTags(page, 'Basket')).toHaveText(['Banana', 'Mango'])
await searchAndSelect(page, 'Book', 'moby', 'Moby-Dick')
```

## ElMessage

| Helper | What it does |
|---|---|
| `messages(page): Locator` | Every toast on screen. |
| `message(page, text: string): Locator` | One toast, matched by its full text. |
| `drainMessages(page, timeout = 10_000): Promise<void>` | Waits until every toast has gone. |
| `recordMessages(page): Promise<() => Promise<string[]>>` | Starts recording every toast that appears, even short ones. Call the returned function to read them. |

```ts
await drainMessages(page)
await page.getByRole('button', { name: 'Save book' }).click()
await expect(message(page, 'Book saved')).toBeVisible()

const recorded = await recordMessages(page)
await page.getByRole('button', { name: 'Refresh' }).click()
await page.waitForTimeout(500)
expect(await recorded()).toEqual([])
```

## el-checkbox / el-switch

| Helper | What it does |
|---|---|
| `setChecked(page, label: Name, checked: boolean): Promise<void>` | Sets an `el-checkbox` by calling Playwright's `setChecked()` on its `label.el-checkbox`. Safe to call twice. Not for `el-checkbox-button`. For radios, call Playwright's `check()` on the radio's `<label>` inside its `radiogroup`. |
| `setSwitch(sw: Locator, on: boolean): Promise<void>` | Sets an `.el-switch` by reading `aria-checked` first. Safe to call twice. |

```ts
await setChecked(page, 'I agree to the terms', true)
await setSwitch(page.locator('.el-switch').first(), true)
```

## el-date-picker / el-time-picker

| Helper | What it does |
|---|---|
| `typeDate(page, label: Name, displayValue: string): Promise<void>` | Types a date in the display format (`format` prop) and commits it with Enter. |
| `pickDay(page, label: Name, day: number): Promise<void>` | Opens the picker and clicks a day of the month it shows, skipping the greyed-out days of the months around it. |
| `typeTime(page, label: Name, displayValue: string): Promise<void>` | Opens a time picker, types a time in the display format and commits it with Enter. |

```ts
await page.clock.setFixedTime(new Date('2026-03-10T10:00:00'))
await typeDate(page, 'Due date', '15/03/2026')
await pickDay(page, 'Due date', 1)
await typeTime(page, 'Opening time', '17:45')
```

## el-form

| Helper | What it does |
|---|---|
| `formItem(page, label: Name): Locator` | The `.el-form-item` whose label text is `label`. |
| `formError(page, label: Name): Locator` | That form item's validation message. |

```ts
await page.getByRole('textbox', { name: /Username$/ }).press('Tab')
await expect(formError(page, 'Username')).toHaveText('Username is required')
```

## el-table

| Helper | What it does |
|---|---|
| `waitForTable(table: Locator): Promise<void>` | Waits until the `v-loading` mask is gone. |
| `tableRows(table: Locator): Locator` | Body rows only, not the header row. |
| `rowByCell(table: Locator, columnClass: string, text: string): Locator` | The row whose cell in that column (set with the column's `class-name`) has exactly `text`. |
| `columnTexts(table: Locator, columnClass: string): Promise<string[]>` | The texts of one column, top to bottom. |

```ts
const table = page.getByTestId('books-table')
await waitForTable(table)
await rowByCell(table, 'col-title', 'Persuasion').getByRole('button', { name: 'Borrow' }).click()
await expect.poll(() => columnTexts(table, 'col-year')).toEqual(['1815', '1817'])
```

## el-cascader

| Helper | What it does |
|---|---|
| `cascaderRoot(page, label: Name): Locator` | The `.el-cascader` wrapper whose textbox has that name. |
| `openCascader(page, label: Name): Promise<Locator>` | Opens the cascader and returns its panel (found through `aria-describedby`). |
| `pickCascaderPath(page, label: Name, path: string[]): Promise<void>` | Clicks through a path of labels and waits for the panel to close. |

```ts
await pickCascaderPath(page, 'Produce', ['Fruit', 'Citrus', 'Lemon'])
await expect(page.getByRole('textbox', { name: 'Produce' })).toHaveValue('Fruit / Citrus / Lemon')
```

## el-tree / el-tree-select

| Helper | What it does |
|---|---|
| `treeNode(scope: Locator, label: string): Locator` | A tree node by exact label. |
| `expandTreeNode(scope: Locator, label: string): Promise<void>` | Expands a node if it is collapsed. |
| `setTreeChecked(scope: Locator, label: string, checked: boolean): Promise<void>` | Checks or unchecks a node through its checkbox. |
| `selectTreeNode(page, label: Name, path: string[]): Promise<void>` | Opens a tree-select, expands the parents in `path` and picks the last one. |

```ts
const tree = page.getByRole('tree', { name: 'Library' })
await expandTreeNode(tree, 'Fiction')
await setTreeChecked(tree, 'Dune', true)
await selectTreeNode(page, 'Book', ['Fiction', 'Emma'])
```

## el-autocomplete

| Helper | What it does |
|---|---|
| `autocompleteListbox(page, label: Name): Promise<Locator>` | The suggestion list of the autocomplete whose textbox has that name. |
| `pickSuggestion(page, label: Name, query: string, option: string, expected?: string[]): Promise<void>` | Types `query`, waits for `expected` (the full new list) if given, then clicks `option`. |

```ts
await pickSuggestion(page, 'Fruit', 'ap', 'Pineapple', ['Apple', 'Apricot', 'Grape', 'Pineapple'])
```

## el-input-number

| Helper | What it does |
|---|---|
| `setInputNumber(page, label: Name, value: number \| string): Promise<string>` | Types a value, commits it with Tab and returns what the field shows afterwards. |
| `inputNumberButton(page, label: Name, which: 'increase' \| 'decrease'): Locator` | The + or - control of that one field. |

```ts
expect(await setInputNumber(page, 'Quantity', 25)).toBe('10') // max is 10
await inputNumberButton(page, 'Quantity', 'decrease').click()
```

## el-upload

| Helper | What it does |
|---|---|
| `uploadInput(upload: Locator): Locator` | The hidden `<input type="file">` inside an `.el-upload`. |
| `uploadedFileNames(scope: Locator): Locator` | The file names in the upload list, without the hidden keyboard hint. |
| `fakeUploadEndpoint(page, url: string \| RegExp, body = { ok: true }, status = 200): Promise<void>` | Answers the upload URL with fixed JSON through `page.route()`. |

```ts
await fakeUploadEndpoint(page, '**/api/upload')
await uploadInput(page.locator('.el-upload')).setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: Buffer.from('png') })
await expect(uploadedFileNames(page.getByRole('main'))).toHaveText(['cover.png'])
```

## el-pagination

| Helper | What it does |
|---|---|
| `pageButton(pagination: Locator, n: number): Locator` | The page number `n` (an item labelled "page n"). |
| `currentPage(pagination: Locator): Locator` | The page marked `aria-current="true"`. |
| `jumpToPage(pagination: Locator, n: number): Promise<void>` | Types into the "Go to" field and presses Enter. |

```ts
const pagination = page.locator('.el-pagination')
await pageButton(pagination, 3).click()
await expect(currentPage(pagination)).toHaveText('3')
await jumpToPage(pagination, 7)
```

## el-dropdown

| Helper | What it does |
|---|---|
| `openDropdown(page, trigger: Locator): Promise<Locator>` | Opens the dropdown (hover, then click if hover did nothing) and returns its menu. |
| `dropdownCommand(page, trigger: Locator, item: string): Promise<void>` | Opens the dropdown and clicks an item by exact text. |

```ts
await dropdownCommand(page, page.getByRole('button', { name: 'Shelf actions' }), 'Sort')
```

## el-popconfirm

| Helper | What it does |
|---|---|
| `answerPopconfirm(page, reference: Locator, answer: string): Promise<void>` | Clicks the reference button, then the popconfirm button named `answer`, and waits for it to close. |

```ts
await answerPopconfirm(page, page.getByRole('button', { name: 'Remove todo' }), 'Yes')
```

## ElNotification

| Helper | What it does |
|---|---|
| `notifications(page): Locator` | Every notification on screen. |
| `notification(page, title: string): Locator` | One notification, matched by its exact title. |
| `drainNotifications(page, timeout = 10_000): Promise<void>` | Moves the mouse away, then waits until every notification has closed. |
| `closeNotification(page, title: string): Promise<void>` | Clicks a notification's close icon and waits for it to go. |

```ts
await expect(notification(page, 'Sync failed')).toContainText('Could not reach the server')
await closeNotification(page, 'Reminder')
await drainNotifications(page)
```

## el-collapse

| Helper | What it does |
|---|---|
| `collapseHeader(page, title: string): Locator` | A collapse item's header by exact title. |
| `setCollapseItem(page, title: string, open: boolean): Promise<void>` | Opens or closes an item, checking `aria-expanded` first, and waits for the open animation to finish. |

```ts
await setCollapseItem(page, 'Garden', true)
await expect(page.getByRole('region', { name: 'Garden' })).toContainText('Water the plants')
```
