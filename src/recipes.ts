import type { Component } from 'vue'

// One entry per recipe. The home page, the sidebar, the search and each
// page's header all read from this list.
//
// Text here ends up on the demo pages, which the specs query. Keep option
// values and other demo data (fruit names, book titles, ...) out of it, and
// don't wrap field names in their own element: an exact getByText() would
// match it.

export const REPO_URL = 'https://github.com/pualgao230113-sys/playwright-element-plus-recipes'
export const README_URL = `${REPO_URL}#recipes`
export const specUrl = (file: string) => `${REPO_URL}/blob/main/tests/${file}`

export type Family = 'Lists and pickers' | 'Dates and times' | 'Inputs and forms' | 'Data and layout' | 'Overlays' | 'Feedback'

export const families: Family[] = [
  'Lists and pickers',
  'Dates and times',
  'Inputs and forms',
  'Data and layout',
  'Overlays',
  'Feedback',
]

export interface Recipe {
  /** Two-digit number, same as the spec file prefix. */
  num: string
  path: string
  /** Page title. Some specs click or count this heading, so keep it as is. */
  title: string
  /** Element Plus component tag(s), shown under the title. */
  component: string
  family: Family
  spec: string
  /** One line about the main pitfall, for the home page and the search. */
  pitfall: string
  /** Pitfall counts, as marked in the README table. */
  common: number
  specific: number
  /** Things a person can do by hand to see the pitfall. Each one is asserted in the spec. */
  steps: string[]
  /** The main helper call for this page, as you'd write it in your own test. */
  snippet: string
  page: () => Promise<Component>
}

const recipeList: Recipe[] = [
  {
    num: '01',
    path: '/select',
    title: 'Select',
    component: 'el-select',
    family: 'Lists and pickers',
    spec: '01-select.spec.ts',
    pitfall: 'The options are rendered in <body>, not inside the select, and a multiple select stays open after each pick.',
    common: 3,
    specific: 1,
    steps: [
      'Open the first select, right-click an option and choose Inspect. The option sits at the end of <body>, not inside the select.',
      'Open Basket and pick an option. The list stays open. Press Escape to close it.',
      'In Filtered fruit, type ap. The field shows your text, but v-model is still empty until you pick an option.',
      'Click Book and wait. No list appears until you type and the search has answered.',
    ],
    snippet: `import { selectOption } from 'playwright-element-plus'

await selectOption(page, 'Country', 'Australia')`,
    page: () => import('./pages/SelectPage.vue'),
  },
  {
    num: '02',
    path: '/message',
    title: 'Message (toasts)',
    component: 'ElMessage',
    family: 'Feedback',
    spec: '02-message.spec.ts',
    pitfall: 'Toasts stack, and toHaveCount(0) also passes for a toast that showed up and faded.',
    common: 2,
    specific: 0,
    steps: [
      'Click Save book, then Delete book straight away. Two toasts are on screen at once.',
      'Click Refresh (buggy). An error toast shows for about half a second, then it is gone.',
      'Click Refresh (correct). Nothing shows. A test that only counts toasts afterwards cannot tell these two apart.',
    ],
    snippet: `import { drainMessages, message } from 'playwright-element-plus'

await expect(message(page, 'Saved')).toBeVisible()
await drainMessages(page)`,
    page: () => import('./pages/MessagePage.vue'),
  },
  {
    num: '03',
    path: '/checkbox',
    title: 'Checkbox / Radio / Switch',
    component: 'el-checkbox / el-radio / el-switch',
    family: 'Inputs and forms',
    spec: '03-checkbox-radio-switch.spec.ts',
    pitfall: 'The real input is hidden, so check() times out, and the switch texts toggle instead of set.',
    common: 1,
    specific: 2,
    steps: [
      'Inspect the first checkbox. The real <input> is 0 by 0 and transparent; you click its label.',
      'Under Theme, click Dark twice. The first click turns the switch on, the second turns it off again.',
      'Click the label of the first switch. It turns on, but the hidden input keeps checked set to false. Only aria-checked is right.',
    ],
    snippet: `import { setChecked } from 'playwright-element-plus'

await setChecked(page, 'Accept terms', true)`,
    page: () => import('./pages/CheckboxPage.vue'),
  },
  {
    num: '04',
    path: '/date-picker',
    title: 'Date picker',
    component: 'el-date-picker',
    family: 'Dates and times',
    spec: '04-date-picker.spec.ts',
    pitfall: 'format is what you see, value-format is what v-model holds, and typed text only counts after Enter or blur.',
    common: 4,
    specific: 2,
    steps: [
      'In Due date, type 15/03/2026 and wait. The field shows it, v-model is still empty.',
      'Press Enter. Now v-model holds 2026-03-15.',
      'Replace the text with 3/4/2026 and press Enter. It turns into 04/03/2026, the 4th of March (Element Plus 2.14.4 and later).',
      'If your time zone is east of UTC, pick a day in Plain date. The stored JSON is the day before.',
    ],
    snippet: `import { typeDate } from 'playwright-element-plus'

await page.clock.setFixedTime(new Date('2026-03-10T10:00:00'))
await typeDate(page, 'Start date', '15/03/2026')`,
    page: () => import('./pages/DatePickerPage.vue'),
  },
  {
    num: '05',
    path: '/dialog',
    title: 'Dialog / Drawer / MessageBox',
    component: 'el-dialog / el-drawer / ElMessageBox',
    family: 'Overlays',
    spec: '05-dialog-drawer-messagebox.spec.ts',
    pitfall: 'A closed dialog stays in the DOM, and the message box is rendered outside #app.',
    common: 2,
    specific: 1,
    steps: [
      'Click Edit book, then Cancel. Inspect the page: the dialog is still there, only hidden.',
      'Open Edit book again and inspect <body>. It gets the el-popup-parent--hidden class, which stops the page behind from scrolling, and loses it once the dialog has closed.',
      'Click Delete book. The confirm box has its own button with "Delete" in the name, so a loose name match finds two buttons.',
    ],
    snippet: `const dialog = page.getByRole('dialog', { name: 'Edit profile' })
await dialog.getByRole('button', { name: 'Save', exact: true }).click()
await expect(dialog).toBeHidden()`,
    page: () => import('./pages/DialogPage.vue'),
  },
  {
    num: '06',
    path: '/table',
    title: 'Table',
    component: 'el-table',
    family: 'Data and layout',
    spec: '06-table.spec.ts',
    pitfall: 'The empty text shows under the loading mask before the rows arrive, and the header row counts as a row.',
    common: 2,
    specific: 1,
    steps: [
      'Reload the page and watch the table. The empty text is there under the loading mask before the rows arrive.',
      'Click the left part of the Year header three times: ascending, descending, then no sort.',
      'Click the small up arrow next to Pages. One click sorts ascending, without passing through descending.',
      'Type a title that matches nothing into the filter. This time the empty text is real.',
    ],
    snippet: `import { rowByCell, waitForTable } from 'playwright-element-plus'

const table = page.getByTestId('orders-table')
await waitForTable(table)
await rowByCell(table, 'col-number', 'A-1042').getByRole('button', { name: 'Open' }).click()`,
    page: () => import('./pages/TablePage.vue'),
  },
  {
    num: '07',
    path: '/form',
    title: 'Form validation',
    component: 'el-form',
    family: 'Inputs and forms',
    spec: '07-form-validation.spec.ts',
    pitfall: 'Blur rules do nothing while you type, and the required asterisk ends up in the field name.',
    common: 2,
    specific: 1,
    steps: [
      'Click into Username, then click outside without typing. The required error only shows once the field loses focus.',
      'Type admin into Username and press Tab. For about half a second the field is still being checked, so "no error" is true before the answer is in. A taken name gets its error only after that.',
      'Click Create account with the form empty. All three errors show. Then pick a favourite fruit: its error goes away without a blur.',
    ],
    snippet: `import { formError } from 'playwright-element-plus'

await page.getByRole('textbox', { name: /Email$/ }).press('Tab')
await expect(formError(page, 'Email')).toHaveText('Email is required')`,
    page: () => import('./pages/FormPage.vue'),
  },
  {
    num: '08',
    path: '/input',
    title: 'Input',
    component: 'el-input',
    family: 'Inputs and forms',
    spec: '08-input.spec.ts',
    pitfall: 'maxlength cuts what you type, the clear icon needs a hover or focus, and emptying the field is not a clear.',
    common: 0,
    specific: 3,
    steps: [
      'Type or paste more than 10 characters into Nickname. The field stops at 10.',
      'Type into Search fruit, then click outside the field. The clear icon disappears; hover the field to get it back.',
      'Click the clear icon and clear events: goes up. Select the text and delete it instead, and it does not.',
    ],
    snippet: `const search = page.getByRole('textbox', { name: 'Search' })
await search.hover()
await page.locator('.el-input', { has: search }).locator('.el-input__clear').click()`,
    page: () => import('./pages/InputPage.vue'),
  },
  {
    num: '09',
    path: '/popper',
    title: 'Viewport & popper placement',
    component: 'poppers',
    family: 'Overlays',
    spec: '09-viewport-popper.spec.ts',
    pitfall: 'A dropdown opens above its trigger when there is no room below, so the result depends on the viewport height.',
    common: 1,
    specific: 0,
    steps: [
      'Make the viewport about 560 px tall (for example in DevTools device mode), scroll to the top and open Colour. The list opens above the field.',
      'Make the viewport 900 px tall or more and open it again. Now it opens below.',
    ],
    snippet: `import { openSelect } from 'playwright-element-plus'

const listbox = await openSelect(page, 'Country')
await expect(page.locator('.el-select__popper', { has: listbox }))
  .toHaveAttribute('data-popper-placement', /^bottom/)`,
    page: () => import('./pages/PopperPage.vue'),
  },
  {
    num: '10',
    path: '/cascader',
    title: 'Cascader',
    component: 'el-cascader',
    family: 'Lists and pickers',
    spec: '10-cascader.spec.ts',
    pitfall: 'The input shows labels, v-model holds values, and clicking a parent only opens the next column.',
    common: 3,
    specific: 3,
    steps: [
      'In Produce, click a first-column item, then a second-column item. The panel moves on, nothing is stored yet.',
      'Click an item in the last column. The panel closes, the field shows labels joined with " / ", v-model holds the values.',
      'In Any level, click a first-column label: it only expands. Click the round radio in front of it to pick that level.',
      'In Search produce, type a few letters. The matches are a flat list of full paths, and v-model stays empty until you click one.',
    ],
    snippet: `import { pickCascaderPath } from 'playwright-element-plus'

await pickCascaderPath(page, 'Region', ['Europe', 'France', 'Paris'])`,
    page: () => import('./pages/CascaderPage.vue'),
  },
  {
    num: '11',
    path: '/tree',
    title: 'Tree / Tree select',
    component: 'el-tree / el-tree-select',
    family: 'Lists and pickers',
    spec: '11-tree.spec.ts',
    pitfall: 'Children are not rendered until their parent has been opened once, and a half-checked parent says aria-checked="false".',
    common: 2,
    specific: 3,
    steps: [
      'Inspect the tree before expanding anything. The child nodes are not in the page yet.',
      'Click the text of a top node. It expands; it does not get checked.',
      'Expand the first group and check one child. The group box shows a dash, but its treeitem still says aria-checked="false".',
      'In Shelf, check a whole group. v-model gets the child keys only, not the group key.',
    ],
    snippet: `import { selectTreeNode } from 'playwright-element-plus'

await selectTreeNode(page, 'Folder', ['Projects', 'Archive'])`,
    page: () => import('./pages/TreePage.vue'),
  },
  {
    num: '12',
    path: '/autocomplete',
    title: 'Autocomplete',
    component: 'el-autocomplete',
    family: 'Lists and pickers',
    spec: '12-autocomplete.spec.ts',
    pitfall: 'Old suggestions stay up until the debounce runs, and Enter with nothing highlighted picks nothing.',
    common: 4,
    specific: 0,
    steps: [
      'Click the field and wait for the full list. Then type a few letters: for a moment the old list is still there.',
      'Press Enter without using the arrow keys. v-model is your text and select events: stays at 0.',
      'Press the down arrow, then Enter. Now a suggestion is picked and select events: goes up.',
      'Type a whole suggestion by hand and click outside. v-model has it, but nothing was picked.',
    ],
    snippet: `import { pickSuggestion } from 'playwright-element-plus'

await pickSuggestion(page, 'City', 'mel', 'Melbourne', ['Melbourne', 'Melton'])`,
    page: () => import('./pages/AutocompletePage.vue'),
  },
  {
    num: '13',
    path: '/input-number',
    title: 'Input number',
    component: 'el-input-number',
    family: 'Inputs and forms',
    spec: '13-input-number.spec.ts',
    pitfall: 'max is applied to v-model while the field still shows what you typed, and the +/- buttons are never disabled for Playwright.',
    common: 2,
    specific: 3,
    steps: [
      'Replace the value in Quantity with 25. The field shows 25, v-model is already 10.',
      'Press Enter. The field snaps to 10.',
      'At 10, click the + button. It looks greyed out but is still an enabled button, and the click does nothing.',
      'Replace the value in Boxes of 6 with 10 and press Tab. It snaps to 12.',
    ],
    snippet: `import { setInputNumber } from 'playwright-element-plus'

expect(await setInputNumber(page, 'Seats', 25)).toBe('10')`,
    page: () => import('./pages/InputNumberPage.vue'),
  },
  {
    num: '14',
    path: '/time-picker',
    title: 'Time picker / Time select',
    component: 'el-time-picker / el-time-select',
    family: 'Dates and times',
    spec: '14-time-picker.spec.ts',
    pitfall: 'Opening the picker writes the current time into v-model before you pick anything.',
    common: 3,
    specific: 1,
    steps: [
      'Click Opening time, then press Escape. The field keeps the current time, and so does v-model.',
      'Reload, open it again and click Cancel. Now it is empty again.',
      'Click Opening time, replace its text with 25:99 and press Enter. It rolls over to 02:39.',
      'Open Pickup slot. It is a select with times as options, not a time picker.',
    ],
    snippet: `import { typeTime } from 'playwright-element-plus'

await page.clock.setFixedTime(new Date('2026-03-10T10:00:00'))
await typeTime(page, 'Start time', '17:45')`,
    page: () => import('./pages/TimePickerPage.vue'),
  },
  {
    num: '15',
    path: '/upload',
    title: 'Upload',
    component: 'el-upload',
    family: 'Inputs and forms',
    spec: '15-upload.spec.ts',
    pitfall: 'accept only filters the file dialog, and without a server the file drops out of the list.',
    common: 4,
    specific: 4,
    steps: [
      'Click Choose cover, switch the file dialog to all files and pick a text file. before-upload rejects it; accept only filtered the dialog.',
      'Pick a small PNG. There is no upload server here, so the request fails and the file drops out of the list.',
      'Pick a PNG over 1 MB. before-upload rejects it with a message.',
    ],
    snippet: `import { fakeUploadEndpoint, uploadInput } from 'playwright-element-plus'

await fakeUploadEndpoint(page, '**/api/upload')
await uploadInput(page.locator('.el-upload')).setInputFiles('fixtures/photo.png')`,
    page: () => import('./pages/UploadPage.vue'),
  },
  {
    num: '16',
    path: '/tabs',
    title: 'Tabs',
    component: 'el-tabs',
    family: 'Data and layout',
    spec: '16-tabs.spec.ts',
    pitfall: 'Inactive panes stay in the DOM, and a disabled tab is still clickable for Playwright.',
    common: 1,
    specific: 2,
    steps: [
      'Inspect the tabs. The text of the other panes is already in the page, only hidden.',
      'Open Reviews, go back to the first tab, and open Reviews again. The loaded line shows it mounted once.',
      'Click Sequels. It looks disabled and nothing happens, but it has no aria-disabled.',
    ],
    snippet: `await page.getByRole('tab', { name: 'Billing', exact: true }).click()
await expect(page.getByRole('tabpanel', { name: 'Billing' })).toBeVisible()`,
    page: () => import('./pages/TabsPage.vue'),
  },
  {
    num: '17',
    path: '/pagination',
    title: 'Pagination',
    component: 'el-pagination',
    family: 'Data and layout',
    spec: '17-pagination.spec.ts',
    pitfall: 'Page numbers are list items labelled "page N", and the Go to box waits for Enter.',
    common: 1,
    specific: 2,
    steps: [
      'Type 7 into Go to and wait. Nothing happens until you press Enter or leave the box.',
      'Type 99 and press Enter. You land on page 10, the last one.',
      'On page 10, switch to 50/page. You end up on page 2.',
    ],
    snippet: `import { currentPage, jumpToPage } from 'playwright-element-plus'

const pagination = page.locator('.el-pagination')
await jumpToPage(pagination, 7)
await expect(currentPage(pagination)).toHaveText('7')`,
    page: () => import('./pages/PaginationPage.vue'),
  },
  {
    num: '18',
    path: '/dropdown',
    title: 'Dropdown',
    component: 'el-dropdown',
    family: 'Lists and pickers',
    spec: '18-dropdown.spec.ts',
    pitfall: 'A hover menu closes as soon as the mouse leaves it, and a disabled item cannot be clicked.',
    common: 2,
    specific: 3,
    steps: [
      'Hover Shelf actions, then move the mouse away before picking. The menu closes.',
      'Hover Book actions. Nothing opens; this one needs a click.',
      'Click the arrow half of Read now. It is a separate button that opens the menu; the other half runs the main action.',
    ],
    snippet: `import { dropdownCommand } from 'playwright-element-plus'

await dropdownCommand(page, page.getByRole('button', { name: 'More' }), 'Rename')`,
    page: () => import('./pages/DropdownPage.vue'),
  },
  {
    num: '19',
    path: '/popover',
    title: 'Popconfirm / Tooltip',
    component: 'el-popconfirm / el-tooltip',
    family: 'Overlays',
    spec: '19-popconfirm-tooltip.spec.ts',
    pitfall: 'A popconfirm is role="tooltip", not a dialog, and only its cancel button fires cancel.',
    common: 2,
    specific: 1,
    steps: [
      'Click Remove todo, then click an empty part of the page. It closes and the status stays (none): no cancel event.',
      'Click Remove todo again and press Escape. Nothing happens while focus is on the button.',
      'Hover Water the plants. The tooltip is only in the page while you hover.',
    ],
    snippet: `import { answerPopconfirm } from 'playwright-element-plus'

await answerPopconfirm(page, page.getByRole('button', { name: 'Remove' }), 'Yes')`,
    page: () => import('./pages/PopoverPage.vue'),
  },
  {
    num: '20',
    path: '/notification',
    title: 'Notification',
    component: 'ElNotification',
    family: 'Feedback',
    spec: '20-notification.spec.ts',
    pitfall: 'Notifications stack as role="alert", and hovering one pauses its timer.',
    common: 3,
    specific: 2,
    steps: [
      'Click Complete todo, then Sync. Two notifications are open at once.',
      'Click Complete todo and keep the mouse on the notification. It stays well past its 4.5 seconds.',
      'Click Remind me. It never closes by itself. Its close x is an icon, not a button.',
    ],
    snippet: `import { drainNotifications, notification } from 'playwright-element-plus'

await expect(notification(page, 'Upload done')).toBeVisible()
await drainNotifications(page)`,
    page: () => import('./pages/NotificationPage.vue'),
  },
  {
    num: '21',
    path: '/collapse',
    title: 'Collapse',
    component: 'el-collapse',
    family: 'Data and layout',
    spec: '21-collapse.spec.ts',
    pitfall: 'Clicking a header toggles, so an "open it" step can close an item, and closed content stays in the DOM.',
    common: 2,
    specific: 1,
    steps: [
      'Click the first header. It was already open, so it closes.',
      'Click the second header and watch it slide open. A test sees it as visible from the first frame.',
    ],
    snippet: `import { setCollapseItem } from 'playwright-element-plus'

await setCollapseItem(page, 'Shipping', true)`,
    page: () => import('./pages/CollapsePage.vue'),
  },
]

/** Recipes in sidebar order: grouped by family, numbered within. */
export const recipes: Recipe[] = families.flatMap((f) => recipeList.filter((r) => r.family === f))

export const recipeByPath = (path: string) => recipes.find((r) => r.path === path)
