# playwright-element-plus-recipes

[English](README.md) | **简体中文** | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md) | [Bahasa Melayu](README.ms.md) | [हिन्दी](README.hi.md)

[![Tests](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml/badge.svg)](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://pualgao230113-sys.github.io/playwright-element-plus-recipes/)

Element Plus 组件有些行为会让 Playwright 测试挂得莫名其妙：下拉框渲染在页面的别处、input 是隐藏的、消息提示会叠加、值要等失焦才提交。这个仓库里有一个小演示应用，每个组件一个页面；每个组件配一个 Playwright spec，把问题实际复现出来；还有一个 helper 文件，你可以直接用在自己的测试里。

<p align="center"><img src="docs/demo.gif" alt="Playwright 操作演示应用：从下拉框里选值、叠加的消息提示、选择日期" width="720"></p>

在线演示：<https://pualgao230113-sys.github.io/playwright-element-plus-recipes/>

与 Element Plus 和 Playwright 均无关联。这两个名字只用来说明本项目测试的是什么。

## 快速开始

```bash
git clone https://github.com/pualgao230113-sys/playwright-element-plus-recipes.git
cd playwright-element-plus-recipes
npm ci
npx playwright install chromium   # first time only
npm test                          # starts the demo app on :5179 and runs every recipe
```

| 脚本 | 作用 |
|---|---|
| `npm run dev` | 演示应用，地址 <http://localhost:5179>，每个示例一个页面 |
| `npm test` | 完整的 Playwright 测试套件（headless Chromium，1 个 worker） |
| `npm run test:ui` | Playwright UI 模式，用来一步步走完某个示例 |
| `npm run typecheck` | 对应用、spec 和 helper 做类型检查 |
| `npm run build` | 把演示应用构建到 `dist/` |
| `npm run build:helpers` | 把 `playwright-element-plus` 包构建到 `packages/playwright-element-plus/dist/` |

## 在你自己的项目里使用 helper

```bash
npm i -D playwright-element-plus
```

你的项目里需要已经装好 `@playwright/test`；它是 peer dependency，测试时用的是 1.63。

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

ESM 和 CommonJS 的测试项目都能用，类型定义也一起带上了。每个 helper 都在 [docs/helpers.md](docs/helpers.md) 里列出并附有示例。这个包自己的 README 在 [packages/playwright-element-plus/README.md](packages/playwright-element-plus/README.md)。如果你不想多加一个依赖，就把 [`packages/playwright-element-plus/src/index.ts`](packages/playwright-element-plus/src/index.ts) 复制到你的项目里。它只 import 了 `@playwright/test`。

### 改从 GitHub 安装

```bash
npm i -D github:pualgao230113-sys/playwright-element-plus-recipes
```

这样装上的包名是 `playwright-element-plus-recipes`，所以要改成从 `'playwright-element-plus-recipes'` import。npm 会在安装时构建 helper（靠的是这个仓库的 `prepare` 脚本），所以第一次安装要花一分钟左右。

pnpm 会拦下依赖的构建脚本，所以要先在 `pnpm-workspace.yaml` 里放行这个包。pnpm 11 这样写：

```yaml
allowBuilds:
  playwright-element-plus-recipes: true
```

如果是 pnpm 10，就把 pnpm 在 `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` 报错里打印出来的那一项加到 `onlyBuiltDependencies` 里。git 依赖的这一项带着 commit，所以每次更新它都会变。

## 示例

每个坑都标为 **Common**（常见：大多数用这个组件的应用都会碰到）或 **Specific**（特定：只在括号里写的选项或版本下出现）。每一条都由对应 spec 里的一个测试复现。

有一件事几乎每个页面都会碰到，而且它是 Playwright 的行为，不是 Element Plus 的：可访问名称默认按子串匹配。`getByRole('option', { name: 'Apple' })` 也会找到 "Pineapple"，`getByRole('button', { name: 'Delete' })` 也会找到一个 "Delete book" 按钮。传入 `exact: true` 或带锚点的正则；同样的文字出现两次时，把范围限定在对应的分组、对话框或菜单里。spec 里演示了 select（[01](tests/01-select.spec.ts)）、radio 分组（[03](tests/03-checkbox-radio-switch.spec.ts)）、对话框（[05](tests/05-dialog-drawer-messagebox.spec.ts)）、树（[11](tests/11-tree.spec.ts)）、tab（[16](tests/16-tabs.spec.ts)）、菜单（[18](tests/18-dropdown.spec.ts)）和折叠项（[21](tests/21-collapse.spec.ts)）的情况。helper 用的都是精确名称。

| # | 组件 | 坑 | 怎么做 | Spec |
|---|---|---|---|---|
| 01 | `el-select` | **Common:** 选项被 teleport 到 `<body>`，不在 select 内部渲染。<br>**Common:** 在不可筛选的 select（默认就是）上，点击 combobox 的 `<input>` 会被 placeholder 拦截。可筛选的 select 的 input 能点，只有 2.13.3–2.14.1 这几个版本也会被 placeholder 拦截。<br>**Common:** `multiple` 下拉框每选一项后都保持展开。<br>**Specific**（`remote`）：第一批结果返回之前，下拉框一直是隐藏的。 | 点击 `.el-select` 根元素。顺着 `aria-controls` 找到这个 select 自己的 listbox。多选后按 Escape。等待选项出现，不要固定等一段时间。 | [01-select](tests/01-select.spec.ts) |
| 02 | `ElMessage` | **Common:** 消息提示会叠加，所以 `getByRole('alert')` 也会命中更早的提示。<br>**Common:** 一个出现后又淡出的提示，`toHaveCount(0)` 照样会通过。 | 按精确文本匹配提示。重复某个操作前先调用 `drainMessages()`。要证明“没有提示”，在操作之前就启动 `recordMessages()`。 | [02-message](tests/02-message.spec.ts) |
| 03 | `el-checkbox` / `el-radio` / `el-switch` | **Common:** 真实的 input 是隐藏的：`check()` 会超时，加 `force` 则报 "outside of the viewport"。<br>**Specific**（`active-text` / `inactive-text`）：开关的文字是切换状态，不是设置状态。<br>**Specific**（`el-form-item` 里的开关，通过 label 点击）：原生的 `checked` 与 `aria-checked` 不一致。 | 用 `setChecked()` helper。它会对 checkbox 的 `label.el-checkbox` 调用 Playwright 的 `setChecked()`（只适用于普通 checkbox，不适用于 `el-checkbox-button`）。radio 的话，对 `radiogroup` 里它的 `<label>` 调用 Playwright 的 `check()`。从 `aria-checked` 读取开关状态，不要用 `toBeChecked()`。 | [03-checkbox-radio-switch](tests/03-checkbox-radio-switch.spec.ts) |
| 04 | `el-date-picker` | **Common:** `format`（显示用）和 `value-format`（存储用）是两回事。<br>**Common:** 输入的文字只有在回车或失焦时才会进入 model。<br>**Common:** 网格里的日期数字会重复（下个月的头几天也会显示出来）。<br>**Common:** 日历打开时停在今天，所以点哪一天取决于当前日期。<br>**Specific**（没有 `value-format`，时区在 UTC 以东）：日期会被序列化成前一天。<br>**Specific**（手动输入，2.14.4+）：解析很宽松：`3/4/2026` 变成 3 月 4 日，`31/02/2026` 变成 3 月 3 日，`15/3/2026` 会被拒绝，旧值保留。 | 按显示格式输入，然后同时检查 input 和 model。用 `page.clock` 冻结时钟。只点 `td.available` 单元格。在应用里设置 `value-format`。 | [04-date-picker](tests/04-date-picker.spec.ts) |
| 05 | `el-dialog` / `el-drawer` / `ElMessageBox` | **Common:** 关闭后的对话框仍留在 DOM 里。<br>**Common:** 消息框渲染在 `#app` 之外。<br>**Specific**（断言滚动锁定）：锁定是 `<body>` 上的一个 class，对话框关闭后才移除。 | 用 `getByRole('dialog', { name })` 限定范围。断言 `toBeHidden()`，不要用 `toHaveCount(0)`。用会自动重试的 `expect` 检查 body 的 class。 | [05-dialog-drawer-messagebox](tests/05-dialog-drawer-messagebox.spec.ts) |
| 06 | `el-table` | **Common:** `getByRole('row')` 会把表头行也算进去。表头还是一个单独的 `<table>`。<br>**Common:** 空数据文字在加载遮罩下面就已经可见了。<br>**Specific**（可排序列，2.13.0+）："Sort by X" 按钮会直接跳到降序，再点一次会清除排序。 | 等待 `.el-loading-mask` 隐藏。统计 `tbody tr.el-table__row`。给列设置你自己的 `class-name`，通过单元格查找行。点击表头单元格循环切换，或点击箭头直接设置，并检查 `aria-sort`。 | [06-table](tests/06-table.spec.ts) |
| 07 | `el-form` | **Common:** `trigger: 'blur'` 规则在字段失焦之前什么都不做。<br>**Common:** 必填星号是可访问名称的一部分（`"* Username"`）。<br>**Specific**（异步校验器）：校验器还没给出结果，“没有错误”的断言就已经通过了。 | 按 Tab 触发失焦。等待 `is-success` / `is-validating`。用带锚点的正则匹配名称（`/Username$/`）。 | [07-form-validation](tests/07-form-validation.spec.ts) |
| 08 | `el-input` | **Specific**（`maxlength`）：浏览器会截断 `fill()` 输入的内容。<br>**Specific**（`clearable`）：鼠标悬停到 input 上之前，清除图标点不了。<br>**Specific**（`@clear`）：`fill('')` 不会触发 `clear`。 | 断言截断后的值和计数器。点击清除前先 hover。当应用依赖 `@clear` 时，点击这个图标。 | [08-input](tests/08-input.spec.ts) |
| 09 | 弹出层与视口 | **Common:** 下方空间不够时，下拉框会在触发元素上方打开，所以结果取决于窗口高度。 | 在配置里固定视口，用 locator 而不是坐标，在意弹出方向时检查 `data-popper-placement`。 | [09-viewport-popper](tests/09-viewport-popper.spec.ts) |
| 10 | `el-cascader` | **Common:** input 是 `textbox`，不是 combobox，也没有 `aria-controls`。面板只通过外层 wrapper 的 `aria-describedby` 关联，而且只在展开时才有。<br>**Common:** 点击父级会打开下一列，但不会改变 model；点击叶子节点才会，并且会关闭面板。<br>**Common:** input 显示的是 label（`Fruit / Citrus / Lemon`），model 存的是 value。<br>**Specific**（`checkStrictly`）：点击父级的 label 只会展开它；要点它的 radio。<br>**Specific**（`filterable`）：结果是完整路径组成的普通列表，不是菜单项。<br>**Specific**（`multiple`）：面板保持展开，勾选父级会把它的所有叶子节点都加进来。 | 用 `openCascader()` / `pickCascaderPath()`。同时断言 input 和 model。 | [10-cascader](tests/10-cascader.spec.ts) |
| 11 | `el-tree` / `el-tree-select` | **Common:** 父节点第一次展开之前，子节点不会渲染。<br>**Common:** 在 tree-select 里，点击父节点是展开它，而不是选中它。<br>**Specific**（`show-checkbox`）：点击节点文字是展开它，不是勾选它。<br>**Specific**（`show-checkbox`，部分子节点已勾选）：父级 treeitem 显示 `aria-checked="false"`；只有它的 checkbox 是半选状态，而且它不在 `getCheckedKeys()` 里。<br>**Specific**（带 checkbox 的 `multiple` tree-select）：model 里只有叶子节点的 key。 | 先展开（`expandTreeNode()`），通过 checkbox 的 label 勾选（`setTreeChecked()`），并对 checkbox 断言 `toBeChecked({ indeterminate: true })`。 | [11-tree](tests/11-tree.spec.ts) |
| 12 | `el-autocomplete` | **Common:** 有名称的元素是 `textbox`；`combobox` role 在一个没有名称的 wrapper 上。<br>**Common:** debounce 执行之前，上一次的建议还留在屏幕上，所以等待 "option X" 可能在旧列表上就通过了。<br>**Common:** 没有高亮任何项时按回车，什么也选不上：model 就是输入的文字，`select` 也不会触发。<br>**Common:** 输入一条完整的建议，不等于选中了它。 | 通过 textbox 的 `aria-controls` 找到 listbox（2.13.1+）。用 `toHaveText([...])` 等整个新列表出现，再点击。检查 `select` 确实触发了，也检查一下 input。 | [12-autocomplete](tests/12-autocomplete.spec.ts) |
| 13 | `el-input-number` | **Common:** model 跟着输入实时变化，但 `change` 只在失焦或回车时触发。<br>**Common:** 每个字段都有名为 "increase number" / "decrease number" 的按钮，到达上下限时它们只是多了一个 `is-disabled` class，所以 `toBeDisabled()` 会失败。<br>**Specific**（`min` / `max`）：在最大值为 10 的字段里输入 25，显示的是 "25"，而 model 已经是 10。<br>**Specific**（清空字段）：model 变成空值，而不是 `min`。<br>**Specific**（`precision` / `step-strictly`）：提交时值会被四舍五入（2.345 变成 2.35，step 为 6 时 10 变成 12）。 | 用 Tab 提交（`setInputNumber()`），然后断言字段此时显示的值。把按钮限定在字段内（`inputNumberButton()`），并检查 class。 | [13-input-number](tests/13-input-number.spec.ts) |
| 14 | `el-time-picker` / `el-time-select` | **Common:** 打开选择器会把当前时间写进 input 和 model。按 Escape 或点击外部都会保留它；只有 Cancel 会恢复旧值。<br>**Common:** 某一列里不在可见区域内的滚动项点不到：当前激活项会拦截点击。<br>**Common:** `el-time-select` 是一个 `el-select`，不是时间选择器。<br>**Specific**（手动输入）：解析很宽松：`7:5` 变成 07:05，`25:99` 变成 02:39。 | 冻结时钟。输入时间后按回车（`typeTime()`）。time-select 用 select 的 helper。 | [14-time-picker](tests/14-time-picker.spec.ts) |
| 15 | `el-upload` | **Common:** 真实的 `<input type="file">` 是 `display: none`；直接对它调用 `setInputFiles()`。<br>**Common:** `accept` 拦不住 `setInputFiles()`，所以只有 `before-upload` 会检查类型。<br>**Common:** 没有服务器时请求会失败，文件会从列表里消失。<br>**Common:** 每个列表项里还有一个隐藏的 "press delete to remove" 提示，`toHaveText()` 会把它算进去。<br>**Specific**（2.11.7+）：触发按钮的名称会匹配到两个按钮。<br>**Specific**（内存中的文件）：你传入的 `mimeType` 就是 `before-upload` 看到的 `file.type`。<br>**Specific**（`limit`）：多出来的文件会进入 `on-exceed`，不会抛错。<br>**Specific**（没有 `multiple`）：用 `setInputFiles()` 一次传多个文件会抛错。 | 用 `uploadInput()` 和 `fakeUploadEndpoint()`。用 `uploadedFileNames()` 断言文件名。大文件在测试里用 buffer 构造。 | [15-upload](tests/15-upload.spec.ts) |
| 16 | `el-tabs` | **Common:** 未激活的面板也在 DOM 里，只是隐藏了。<br>**Specific**（`lazy`）：对应的 tab 打开之前，面板不在 DOM 里；打开之后就一直留着。<br>**Specific**（禁用的 tab）：只有一个 `is-disabled` class；点击不会报错，但什么也不发生。 | 对 `getByRole('tabpanel', { name })` 和 `aria-selected` 做断言。禁用的 tab 检查 class。 | [16-tabs](tests/16-tabs.spec.ts) |
| 17 | `el-pagination` | **Common:** 页码是标注为 "page N" 的列表项，不是按钮，而且 "page 1" 也会匹配到 "page 10"。<br>**Specific**（`jumper`）：输入的时候 "Go to" 什么都不做；按回车或失焦时才生效，而且最多只跳到最后一页。<br>**Specific**（`sizes`）：每页条数的 select 没有可访问名称，调大每页条数可能会让你跳到另一页。 | 用 `pageButton()` / `currentPage()` / `jumpToPage()`。通过分页组件的根元素找到条数 select。 | [17-pagination](tests/17-pagination.spec.ts) |
| 18 | `el-dropdown` | **Common:** 菜单被 teleport 出去了；触发元素的 `aria-controls` 指向它。关闭的菜单仍留在 DOM 里。<br>**Common:** hover 菜单在鼠标移到别处时马上关闭。<br>**Specific**（`trigger="click"`）：hover 没有任何效果。<br>**Specific**（禁用的菜单项）：点击会一直等到超时；改为断言 `toBeDisabled()`。<br>**Specific**（`split-button`）：菜单要从另一个 "Toggle Dropdown" 按钮打开。 | 用 `openDropdown()` / `dropdownCommand()`，打开和选择之间不要移动鼠标。 | [18-dropdown](tests/18-dropdown.spec.ts) |
| 19 | `el-popconfirm` / `el-tooltip` | **Common:** popconfirm 是 `role="tooltip"`，不是 `dialog`。<br>**Common:** popconfirm 的内容只在它打开时才在 DOM 里，tooltip 也一样（hover 之后）。<br>**Specific**（在取消时有动作的应用）：只有取消按钮会触发 `cancel`。点击外部会关闭它，但不触发 `cancel`。按 Escape 也会关闭它，同样不触发 `cancel`，但前提是焦点在 popconfirm 里面；焦点在触发按钮上时，Escape 什么都不做。 | 顺着触发元素（reference）的 `aria-describedby` 找（`answerPopconfirm()`）。断言 tooltip 之前先 hover，并检查 `toHaveAccessibleDescription()`。 | [19-popconfirm-tooltip](tests/19-popconfirm-tooltip.spec.ts) |
| 20 | `ElNotification` | **Common:** 通知和消息提示一样是 `role="alert"`，也会叠加。<br>**Common:** 关闭用的 x 是一个没有 role 的 `<i>`。<br>**Common:** 鼠标悬停在通知上会暂停它的计时器。<br>**Specific**（按标题级别查询 heading 的页面）：标题是一个 `<h2>`。<br>**Specific**（断言类型）：类型 class 在图标上，不在外框上。 | 按标题匹配（`notification()`），用 `closeNotification()` 关闭，并用 `drainNotifications()`，它会先把鼠标移开。 | [20-notification](tests/20-notification.spec.ts) |
| 21 | `el-collapse` | **Common:** 收起的项仍把内容留在 DOM 里。<br>**Common:** 点击标题是切换，所以“打开它”这一步会把已经打开的项关掉。<br>**Specific**（打开后立刻截图或点击）：从动画的第一帧开始，内容就算可见了。 | 点击前先检查 `aria-expanded`（`setCollapseItem()`），并等待动画结束。 | [21-collapse](tests/21-collapse.spec.ts) |

## 测试过的版本

Vue 3.5.43、@playwright/test 1.63.0（Chromium headless shell）、Vite 8.3.3、Node.js 24。

下面每个 Element Plus 版本都单独安装，并用它跑了整套测试（111 个测试）。如果某个行为在版本之间有变化，spec 要么跳过并在原因里写明版本，要么针对每个版本断言对应的正确值。CI 会跑三个受支持的版本。

| Element Plus | 结果 | 说明 |
|---|---|---|
| 2.14.7 | 111 个通过 | 所有示例都适用。 |
| 2.13.7 | 109 个通过，2 个跳过 | 还没有宽松的日期解析（04），input 计数器上没有 `role="status"`（08）。 |
| 2.9.11 | 104 个通过，7 个跳过 | 另外：表格里没有 "Sort by" 按钮和 `aria-sort`（06），autocomplete 的 `aria-controls` 不指向它的 listbox（12）。 |
| 2.7.8 | 不支持：13 个失败，7 个跳过 | 日期和时间选择器的 input 没有 `combobox` role，所以对应的 helper 什么也找不到。另外，可筛选的 select 的 placeholder 仍然会挡住对 input 的点击（01），点击外部也不会关闭 popconfirm（19）。 |
| 2.4.4 | 不支持：19 个失败，7 个跳过 | 日期选择器、时间选择器和 popconfirm 的失败和 2.7.8 一样，另外 select、checkbox / radio、dialog、tree-select 和分页还有 7 个失败（比如 select 的 placeholder 根本不会挡住对 input 的点击）。 |

每个变化是从哪个版本开始的，方便你判断哪些说明适用于你的版本：

| 起始版本 | 变化 | 示例 |
|---|---|---|
| 2.11.7 | 上传触发元素的 wrapper 加上了 `role="button"`，所以触发按钮的名称会匹配到两个按钮。 | 15 |
| 2.12.0 | 多选 select 里 tag 的关闭图标变成了一个名为 "Close this tag" 的按钮。spec 用的是 `.el-tag__close`，所有版本都能用。 | 01 |
| 2.13.0 | 可排序的表头加上了 `aria-sort` 和一个 "Sort by X" 按钮。 | 06 |
| 2.13.1 | autocomplete textbox 的 `aria-controls` 指向 listbox。之前它是字面字符串 `"id"`。 | 12 |
| 2.13.3–2.14.1 | 可筛选的 select 的 input 也会被 placeholder 拦截。2.14.2 修好了。 | 01 |
| 2.13.4 | 在空的时间选择器上点 Cancel，model 里留下的是 `null`。之前是空字符串。 | 14 |
| 2.14.0 | input 的清除图标在隐藏时也留在 DOM 里。之前只在 hover 时才渲染。不管哪种，都先 hover。 | 08 |
| 2.14.4 | 手动输入的日期按宽松方式解析（`3/4/2026` 变成 3 月 4 日）。之前 `3/4/2026` 会被拒绝。 | 04 |
| 2.14.5 | 字数计数器加上了 `role="status"`。之前请用 `.el-input__count`。 | 08 |

## 局限与已知差异

- 只测了 Chromium。这些示例没有在 Firefox 或 WebKit 上跑过。
- 这些行为大多是 Element Plus 的实现细节，不是文档里写明的 API。如果升级后某个示例开始失败，说明有东西变了。改写你自己的测试之前，先看看这个示例。
- helper 匹配的是演示应用显示的英文文字（"increase number"、"page N"、"Yes" / "No"）。如果你的应用用的是别的语言，就传入你自己的名称，或者改一下 helper。
- 演示页面故意做得很小。真实应用会有自己的时序（API 调用、你自己的过渡动画），所以要继续等结果，而不是等时间。

## 参与贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。主要规则：只有能用测试在真实的库上复现的坑，才会被收进来。

## 许可证

[MIT](LICENSE) © 2026 Paul Gao

## 翻译

以英文 README 为准。翻译有问题的话，欢迎提 pull request 修正。
