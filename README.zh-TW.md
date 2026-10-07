# playwright-element-plus-recipes

[English](README.md) | [简体中文](README.zh-CN.md) | **繁體中文** | [日本語](README.ja.md) | [한국어](README.ko.md) | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md) | [Bahasa Melayu](README.ms.md) | [हिन्दी](README.hi.md)

[![Tests](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml/badge.svg)](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://pualgao230113-sys.github.io/playwright-element-plus-recipes/)

Element Plus 元件有些行為會讓 Playwright 測試壞得莫名其妙：下拉選單渲染在頁面的別處、input 是隱藏的、訊息提示會堆疊、值要等失焦才送出。這個 repo 裡有一個小示範應用程式，每個元件一個頁面；每個元件配一個 Playwright spec，把問題實際重現出來；還有一個 helper 檔案，你可以直接用在自己的測試裡。

<p align="center"><img src="docs/demo.gif" alt="Playwright 操作示範應用程式：從下拉選單選值、堆疊的訊息提示、選擇日期" width="720"></p>

線上示範：<https://pualgao230113-sys.github.io/playwright-element-plus-recipes/>

與 Element Plus 和 Playwright 皆無關聯。這兩個名稱只用來說明本專案測試的是什麼。

## 快速開始

```bash
git clone https://github.com/pualgao230113-sys/playwright-element-plus-recipes.git
cd playwright-element-plus-recipes
npm ci
npx playwright install chromium   # first time only
npm test                          # starts the demo app on :5179 and runs every recipe
```

| 指令碼 | 用途 |
|---|---|
| `npm run dev` | 示範應用程式，網址 <http://localhost:5179>，每個範例一個頁面 |
| `npm test` | 完整的 Playwright 測試套件（headless Chromium，1 個 worker） |
| `npm run test:ui` | Playwright UI 模式，用來一步步走完某個範例 |
| `npm run typecheck` | 對應用程式、spec 和 helper 做型別檢查 |
| `npm run build` | 把示範應用程式建置到 `dist/` |
| `npm run build:helpers` | 把 `playwright-element-plus` 套件建置到 `packages/playwright-element-plus/dist/` |

## 在你自己的專案裡使用 helper

```bash
npm i -D playwright-element-plus
```

你的專案裡需要已經裝好 `@playwright/test`；它是 peer dependency，測試時用的是 1.63。

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

ESM 和 CommonJS 的測試專案都能用，型別定義也一起附上了。每個 helper 都在 [docs/helpers.md](docs/helpers.md) 裡列出並附有範例。這個套件自己的 README 在 [packages/playwright-element-plus/README.md](packages/playwright-element-plus/README.md)。如果你不想多加一個相依套件，就把 [`packages/playwright-element-plus/src/index.ts`](packages/playwright-element-plus/src/index.ts) 複製到你的專案裡。它只 import 了 `@playwright/test`。

### 改從 GitHub 安裝

```bash
npm i -D github:pualgao230113-sys/playwright-element-plus-recipes
```

這樣安裝的套件名稱是 `playwright-element-plus-recipes`，所以要改成從 `'playwright-element-plus-recipes'` import。npm 會在安裝時建置 helper（靠的是這個 repo 的 `prepare` 指令碼），所以第一次安裝要花一分鐘左右。

pnpm 會擋下相依套件的建置指令碼，所以要先在 `pnpm-workspace.yaml` 裡放行這個套件。pnpm 11 這樣寫：

```yaml
allowBuilds:
  playwright-element-plus-recipes: true
```

如果是 pnpm 10，就把 pnpm 在 `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` 錯誤訊息裡印出來的那一項加到 `onlyBuiltDependencies` 裡。git 相依套件的這一項帶著 commit，所以每次更新它都會變。

## 範例

每個陷阱都標為 **Common**（常見：大多數用這個元件的應用程式都會碰到）或 **Specific**（特定：只在括號裡寫的選項或版本下出現）。每一條都由對應 spec 裡的一個測試重現。

有一件事幾乎每個頁面都會碰到，而且它是 Playwright 的行為，不是 Element Plus 的：無障礙名稱預設按子字串比對。`getByRole('option', { name: 'Apple' })` 也會找到 "Pineapple"，`getByRole('button', { name: 'Delete' })` 也會找到一個 "Delete book" 按鈕。傳入 `exact: true` 或加上錨點的正規表示式；同樣的文字出現兩次時，把範圍限定在對應的群組、對話框或選單裡。spec 裡示範了 select（[01](tests/01-select.spec.ts)）、radio 群組（[03](tests/03-checkbox-radio-switch.spec.ts)）、對話框（[05](tests/05-dialog-drawer-messagebox.spec.ts)）、樹狀結構（[11](tests/11-tree.spec.ts)）、tab（[16](tests/16-tabs.spec.ts)）、選單（[18](tests/18-dropdown.spec.ts)）和摺疊項目（[21](tests/21-collapse.spec.ts)）的情況。helper 用的都是精確名稱。

| # | 元件 | 陷阱 | 怎麼做 | Spec |
|---|---|---|---|---|
| 01 | `el-select` | **Common:** 選項被 teleport 到 `<body>`，不在 select 內部渲染。<br>**Common:** 在不可篩選的 select（預設就是）上，點擊 combobox 的 `<input>` 會被 placeholder 攔截。可篩選的 select 的 input 能點，只有 2.13.3–2.14.1 這幾個版本也會被 placeholder 攔截。<br>**Common:** `multiple` 下拉選單每選一項後都保持展開。<br>**Specific**（`remote`）：第一批結果回來之前，下拉選單一直是隱藏的。 | 點擊 `.el-select` 根元素。順著 `aria-controls` 找到這個 select 自己的 listbox。多選後按 Escape。等待選項出現，不要固定等一段時間。 | [01-select](tests/01-select.spec.ts) |
| 02 | `ElMessage` | **Common:** 訊息提示會堆疊，所以 `getByRole('alert')` 也會命中較早的提示。<br>**Common:** 一個出現後又淡出的提示，`toHaveCount(0)` 照樣會通過。 | 以精確文字比對提示。重複某個操作前先呼叫 `drainMessages()`。要證明「沒有提示」，在操作之前就啟動 `recordMessages()`。 | [02-message](tests/02-message.spec.ts) |
| 03 | `el-checkbox` / `el-radio` / `el-switch` | **Common:** 真正的 input 是隱藏的：`check()` 會逾時，加 `force` 則出現 "outside of the viewport"。<br>**Specific**（`active-text` / `inactive-text`）：開關的文字是切換狀態，不是設定狀態。<br>**Specific**（`el-form-item` 裡的開關，透過 label 點擊）：原生的 `checked` 與 `aria-checked` 不一致。 | 用 `setChecked()` helper。它會對 checkbox 的 `label.el-checkbox` 呼叫 Playwright 的 `setChecked()`（只適用於一般 checkbox，不適用於 `el-checkbox-button`）。radio 的話，對 `radiogroup` 裡它的 `<label>` 呼叫 Playwright 的 `check()`。從 `aria-checked` 讀取開關狀態，不要用 `toBeChecked()`。 | [03-checkbox-radio-switch](tests/03-checkbox-radio-switch.spec.ts) |
| 04 | `el-date-picker` | **Common:** `format`（顯示用）和 `value-format`（儲存用）是兩回事。<br>**Common:** 輸入的文字只有在按 Enter 或失焦時才會進入 model。<br>**Common:** 網格裡的日期數字會重複（下個月的頭幾天也會顯示出來）。<br>**Common:** 日曆打開時停在今天，所以點哪一天取決於當天日期。<br>**Specific**（沒有 `value-format`，時區在 UTC 以東）：日期會被序列化成前一天。<br>**Specific**（手動輸入，2.14.4+）：解析很寬鬆：`3/4/2026` 變成 3 月 4 日，`31/02/2026` 變成 3 月 3 日，`15/3/2026` 會被拒絕，舊值保留。 | 依顯示格式輸入，然後同時檢查 input 和 model。用 `page.clock` 凍結時鐘。只點 `td.available` 儲存格。在應用程式裡設定 `value-format`。 | [04-date-picker](tests/04-date-picker.spec.ts) |
| 05 | `el-dialog` / `el-drawer` / `ElMessageBox` | **Common:** 關閉的對話框仍留在 DOM 裡。<br>**Common:** 訊息框渲染在 `#app` 之外。<br>**Specific**（斷言捲動鎖定）：鎖定是 `<body>` 上的一個 class，對話框關閉後才移除。 | 用 `getByRole('dialog', { name })` 限定範圍。斷言 `toBeHidden()`，不要用 `toHaveCount(0)`。用會自動重試的 `expect` 檢查 body 的 class。 | [05-dialog-drawer-messagebox](tests/05-dialog-drawer-messagebox.spec.ts) |
| 06 | `el-table` | **Common:** `getByRole('row')` 會把表頭列也算進去。表頭還是一個獨立的 `<table>`。<br>**Common:** 空資料文字在載入遮罩底下就已經可見了。<br>**Specific**（可排序欄位，2.13.0+）："Sort by X" 按鈕會直接跳到遞減排序，再點一次會清除排序。 | 等待 `.el-loading-mask` 隱藏。計算 `tbody tr.el-table__row`。為欄位設定你自己的 `class-name`，透過儲存格找出列。點擊表頭儲存格循環切換，或點擊箭頭直接設定，並檢查 `aria-sort`。 | [06-table](tests/06-table.spec.ts) |
| 07 | `el-form` | **Common:** `trigger: 'blur'` 規則在欄位失焦之前什麼都不做。<br>**Common:** 必填星號是無障礙名稱的一部分（`"* Username"`）。<br>**Specific**（非同步驗證器）：驗證器還沒給出結果，「沒有錯誤」的斷言就已經通過了。 | 按 Tab 觸發失焦。等待 `is-success` / `is-validating`。用加上錨點的正規表示式比對名稱（`/Username$/`）。 | [07-form-validation](tests/07-form-validation.spec.ts) |
| 08 | `el-input` | **Specific**（`maxlength`）：瀏覽器會截斷 `fill()` 輸入的內容。<br>**Specific**（`clearable`）：滑鼠移到 input 上之前，清除圖示點不了。<br>**Specific**（`@clear`）：`fill('')` 不會觸發 `clear`。 | 斷言截斷後的值和計數器。點擊清除前先 hover。當應用程式依賴 `@clear` 時，點擊這個圖示。 | [08-input](tests/08-input.spec.ts) |
| 09 | 彈出層與視埠 | **Common:** 下方空間不夠時，下拉選單會在觸發元素上方打開，所以結果取決於視窗高度。 | 在設定裡固定視埠，用 locator 而不是座標，在意彈出方向時檢查 `data-popper-placement`。 | [09-viewport-popper](tests/09-viewport-popper.spec.ts) |
| 10 | `el-cascader` | **Common:** input 是 `textbox`，不是 combobox，也沒有 `aria-controls`。面板只透過外層 wrapper 的 `aria-describedby` 關聯，而且只在展開時才有。<br>**Common:** 點擊父層會打開下一欄，但不會改變 model；點擊葉節點才會，並且會關閉面板。<br>**Common:** input 顯示的是 label（`Fruit / Citrus / Lemon`），model 存的是 value。<br>**Specific**（`checkStrictly`）：點擊父層的 label 只會展開它；要點它的 radio。<br>**Specific**（`filterable`）：結果是完整路徑組成的普通清單，不是選單項目。<br>**Specific**（`multiple`）：面板保持展開，勾選父層會把它的所有葉節點都加進來。 | 用 `openCascader()` / `pickCascaderPath()`。同時斷言 input 和 model。 | [10-cascader](tests/10-cascader.spec.ts) |
| 11 | `el-tree` / `el-tree-select` | **Common:** 父節點第一次展開之前，子節點不會渲染。<br>**Common:** 在 tree-select 裡，點擊父節點是展開它，而不是選取它。<br>**Specific**（`show-checkbox`）：點擊節點文字是展開它，不是勾選它。<br>**Specific**（`show-checkbox`，部分子節點已勾選）：父層 treeitem 顯示 `aria-checked="false"`；只有它的 checkbox 是半選狀態，而且它不在 `getCheckedKeys()` 裡。<br>**Specific**（帶 checkbox 的 `multiple` tree-select）：model 裡只有葉節點的 key。 | 先展開（`expandTreeNode()`），透過 checkbox 的 label 勾選（`setTreeChecked()`），並對 checkbox 斷言 `toBeChecked({ indeterminate: true })`。 | [11-tree](tests/11-tree.spec.ts) |
| 12 | `el-autocomplete` | **Common:** 有名稱的元素是 `textbox`；`combobox` role 在一個沒有名稱的 wrapper 上。<br>**Common:** debounce 執行之前，上一次的建議還留在畫面上，所以等待 "option X" 可能在舊清單上就通過了。<br>**Common:** 沒有反白任何項目時按 Enter，什麼也選不到：model 就是輸入的文字，`select` 也不會觸發。<br>**Common:** 輸入一條完整的建議，不等於選取了它。 | 透過 textbox 的 `aria-controls` 找到 listbox（2.13.1+）。用 `toHaveText([...])` 等整個新清單出現，再點擊。檢查 `select` 確實觸發了，也檢查一下 input。 | [12-autocomplete](tests/12-autocomplete.spec.ts) |
| 13 | `el-input-number` | **Common:** model 跟著輸入即時變化，但 `change` 只在失焦或按 Enter 時觸發。<br>**Common:** 每個欄位都有名為 "increase number" / "decrease number" 的按鈕，到達上下限時它們只是多了一個 `is-disabled` class，所以 `toBeDisabled()` 會失敗。<br>**Specific**（`min` / `max`）：在最大值為 10 的欄位裡輸入 25，顯示的是 "25"，而 model 已經是 10。<br>**Specific**（清空欄位）：model 變成空值，而不是 `min`。<br>**Specific**（`precision` / `step-strictly`）：送出時值會被四捨五入（2.345 變成 2.35，step 為 6 時 10 變成 12）。 | 用 Tab 送出（`setInputNumber()`），然後斷言欄位此時顯示的值。把按鈕限定在欄位內（`inputNumberButton()`），並檢查 class。 | [13-input-number](tests/13-input-number.spec.ts) |
| 14 | `el-time-picker` / `el-time-select` | **Common:** 打開選擇器會把目前時間寫進 input 和 model。按 Escape 或點擊外部都會保留它；只有 Cancel 會恢復舊值。<br>**Common:** 某一欄裡不在可見範圍內的捲動項目點不到：目前啟用的項目會攔截點擊。<br>**Common:** `el-time-select` 是一個 `el-select`，不是時間選擇器。<br>**Specific**（手動輸入）：解析很寬鬆：`7:5` 變成 07:05，`25:99` 變成 02:39。 | 凍結時鐘。輸入時間後按 Enter（`typeTime()`）。time-select 用 select 的 helper。 | [14-time-picker](tests/14-time-picker.spec.ts) |
| 15 | `el-upload` | **Common:** 真正的 `<input type="file">` 是 `display: none`；直接對它呼叫 `setInputFiles()`。<br>**Common:** `accept` 擋不住 `setInputFiles()`，所以只有 `before-upload` 會檢查類型。<br>**Common:** 沒有伺服器時請求會失敗，檔案會從清單裡消失。<br>**Common:** 每個清單項目裡還有一個隱藏的 "press delete to remove" 提示，`toHaveText()` 會把它算進去。<br>**Specific**（2.11.7+）：觸發按鈕的名稱會比對到兩個按鈕。<br>**Specific**（記憶體中的檔案）：你傳入的 `mimeType` 就是 `before-upload` 看到的 `file.type`。<br>**Specific**（`limit`）：多出來的檔案會進入 `on-exceed`，不會拋出錯誤。<br>**Specific**（沒有 `multiple`）：用 `setInputFiles()` 一次傳多個檔案會拋出錯誤。 | 用 `uploadInput()` 和 `fakeUploadEndpoint()`。用 `uploadedFileNames()` 斷言檔名。大檔案在測試裡用 buffer 建立。 | [15-upload](tests/15-upload.spec.ts) |
| 16 | `el-tabs` | **Common:** 未啟用的面板也在 DOM 裡，只是隱藏了。<br>**Specific**（`lazy`）：對應的 tab 打開之前，面板不在 DOM 裡；打開之後就一直留著。<br>**Specific**（停用的 tab）：只有一個 `is-disabled` class；點擊不會報錯，但什麼也不會發生。 | 對 `getByRole('tabpanel', { name })` 和 `aria-selected` 做斷言。停用的 tab 檢查 class。 | [16-tabs](tests/16-tabs.spec.ts) |
| 17 | `el-pagination` | **Common:** 頁碼是標示為 "page N" 的清單項目，不是按鈕，而且 "page 1" 也會比對到 "page 10"。<br>**Specific**（`jumper`）：輸入的時候 "Go to" 什麼都不做；按 Enter 或失焦時才生效，而且最多只跳到最後一頁。<br>**Specific**（`sizes`）：每頁筆數的 select 沒有無障礙名稱，調大每頁筆數可能會讓你跳到另一頁。 | 用 `pageButton()` / `currentPage()` / `jumpToPage()`。透過分頁元件的根元素找到筆數 select。 | [17-pagination](tests/17-pagination.spec.ts) |
| 18 | `el-dropdown` | **Common:** 選單被 teleport 出去了；觸發元素的 `aria-controls` 指向它。關閉的選單仍留在 DOM 裡。<br>**Common:** hover 選單在滑鼠移到別處時馬上關閉。<br>**Specific**（`trigger="click"`）：hover 沒有任何效果。<br>**Specific**（停用的選單項目）：點擊會一直等到逾時；改為斷言 `toBeDisabled()`。<br>**Specific**（`split-button`）：選單要從另一個 "Toggle Dropdown" 按鈕打開。 | 用 `openDropdown()` / `dropdownCommand()`，打開和選取之間不要移動滑鼠。 | [18-dropdown](tests/18-dropdown.spec.ts) |
| 19 | `el-popconfirm` / `el-tooltip` | **Common:** popconfirm 是 `role="tooltip"`，不是 `dialog`。<br>**Common:** popconfirm 的內容只在它打開時才在 DOM 裡，tooltip 也一樣（hover 之後）。<br>**Specific**（在取消時有動作的應用程式）：只有取消按鈕會觸發 `cancel`。點擊外部會關閉它，但不觸發 `cancel`。按 Escape 也會關閉它，同樣不觸發 `cancel`，但前提是焦點在 popconfirm 裡面；焦點在觸發按鈕上時，Escape 什麼都不做。 | 順著觸發元素（reference）的 `aria-describedby` 找（`answerPopconfirm()`）。斷言 tooltip 之前先 hover，並檢查 `toHaveAccessibleDescription()`。 | [19-popconfirm-tooltip](tests/19-popconfirm-tooltip.spec.ts) |
| 20 | `ElNotification` | **Common:** 通知和訊息提示一樣是 `role="alert"`，也會堆疊。<br>**Common:** 關閉用的 x 是一個沒有 role 的 `<i>`。<br>**Common:** 滑鼠停在通知上會暫停它的計時器。<br>**Specific**（依標題層級查詢 heading 的頁面）：標題是一個 `<h2>`。<br>**Specific**（斷言類型）：類型 class 在圖示上，不在外框上。 | 依標題比對（`notification()`），用 `closeNotification()` 關閉，並用 `drainNotifications()`，它會先把滑鼠移開。 | [20-notification](tests/20-notification.spec.ts) |
| 21 | `el-collapse` | **Common:** 收合的項目仍把內容留在 DOM 裡。<br>**Common:** 點擊標題是切換，所以「打開它」這一步會把已經打開的項目關掉。<br>**Specific**（打開後立刻截圖或點擊）：從動畫的第一格開始，內容就算可見了。 | 點擊前先檢查 `aria-expanded`（`setCollapseItem()`），並等待動畫結束。 | [21-collapse](tests/21-collapse.spec.ts) |

## 測試過的版本

Vue 3.5.43、@playwright/test 1.63.0（Chromium headless shell）、Vite 8.3.3、Node.js 24。

下面每個 Element Plus 版本都單獨安裝，並用它跑了整套測試（111 個測試）。如果某個行為在版本之間有變化，spec 要嘛跳過並在原因裡寫明版本，要嘛針對每個版本斷言對應的正確值。CI 會跑三個支援的版本。

| Element Plus | 結果 | 說明 |
|---|---|---|
| 2.14.7 | 111 個通過 | 所有範例都適用。 |
| 2.13.7 | 109 個通過，2 個跳過 | 還沒有寬鬆的日期解析（04），input 計數器上沒有 `role="status"`（08）。 |
| 2.9.11 | 104 個通過，7 個跳過 | 另外：表格裡沒有 "Sort by" 按鈕和 `aria-sort`（06），autocomplete 的 `aria-controls` 不指向它的 listbox（12）。 |
| 2.7.8 | 不支援：13 個失敗，7 個跳過 | 日期和時間選擇器的 input 沒有 `combobox` role，所以對應的 helper 什麼也找不到。另外，可篩選的 select 的 placeholder 還是會擋住對 input 的點擊（01），點擊外部也不會關閉 popconfirm（19）。 |
| 2.4.4 | 不支援：19 個失敗，7 個跳過 | 日期選擇器、時間選擇器和 popconfirm 的失敗和 2.7.8 一樣，另外 select、checkbox / radio、dialog、tree-select 和分頁還有 7 個失敗（例如 select 的 placeholder 根本不會擋住對 input 的點擊）。 |

每個變化是從哪個版本開始的，方便你判斷哪些說明適用於你的版本：

| 起始版本 | 變化 | 範例 |
|---|---|---|
| 2.11.7 | 上傳觸發元素的 wrapper 加上了 `role="button"`，所以觸發按鈕的名稱會比對到兩個按鈕。 | 15 |
| 2.12.0 | 多選 select 裡 tag 的關閉圖示變成了一個名為 "Close this tag" 的按鈕。spec 用的是 `.el-tag__close`，所有版本都能用。 | 01 |
| 2.13.0 | 可排序的表頭加上了 `aria-sort` 和一個 "Sort by X" 按鈕。 | 06 |
| 2.13.1 | autocomplete textbox 的 `aria-controls` 指向 listbox。之前它是字面字串 `"id"`。 | 12 |
| 2.13.3–2.14.1 | 可篩選的 select 的 input 也會被 placeholder 攔截。2.14.2 修好了。 | 01 |
| 2.13.4 | 在空的時間選擇器上點 Cancel，model 裡留下的是 `null`。之前是空字串。 | 14 |
| 2.14.0 | input 的清除圖示在隱藏時也留在 DOM 裡。之前只在 hover 時才渲染。不管哪種，都先 hover。 | 08 |
| 2.14.4 | 手動輸入的日期依寬鬆方式解析（`3/4/2026` 變成 3 月 4 日）。之前 `3/4/2026` 會被拒絕。 | 04 |
| 2.14.5 | 字數計數器加上了 `role="status"`。之前請用 `.el-input__count`。 | 08 |

## 限制與已知差異

- 只測了 Chromium。這些範例沒有在 Firefox 或 WebKit 上跑過。
- 這些行為大多是 Element Plus 的實作細節，不是文件裡寫明的 API。如果升級後某個範例開始失敗，代表有東西變了。改寫你自己的測試之前，先看看這個範例。
- helper 比對的是示範應用程式顯示的英文文字（"increase number"、"page N"、"Yes" / "No"）。如果你的應用程式用的是別的語系，就傳入你自己的名稱，或者改一下 helper。
- 示範頁面故意做得很小。真實的應用程式會有自己的時序（API 呼叫、你自己的轉場動畫），所以要繼續等結果，而不是等時間。

## 參與貢獻

請見 [CONTRIBUTING.md](CONTRIBUTING.md)。主要規則：只有能用測試在真實的函式庫上重現的陷阱，才會被收進來。

## 授權條款

[MIT](LICENSE) © 2026 Paul Gao

## 翻譯

以英文 README 為準。翻譯有問題的話，歡迎發 pull request 修正。
