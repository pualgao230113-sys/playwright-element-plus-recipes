# playwright-element-plus-recipes

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md) | [Bahasa Melayu](README.ms.md) | **हिन्दी**

[![Tests](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml/badge.svg)](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://pualgao230113-sys.github.io/playwright-element-plus-recipes/)

Element Plus components कुछ ऐसी चीज़ें करते हैं जिनसे Playwright tests उलझाने वाले तरीक़ों से टूटते हैं: dropdowns page में कहीं और render होते हैं, inputs छिपे रहते हैं, toasts एक के ऊपर एक जमा होते हैं, values सिर्फ़ blur पर commit होती हैं। इस repo में एक छोटा demo app है जिसमें हर component का एक page है, हर component के लिए एक Playwright spec है जो problem को होते हुए दिखाता है, और एक helper file है जिसे आप अपने tests में इस्तेमाल कर सकते हैं।

<p align="center"><img src="docs/demo.gif" alt="Playwright demo app चला रहा है: select से option चुनना, toasts का जमा होना, date चुनना" width="720"></p>

Live demo: <https://pualgao230113-sys.github.io/playwright-element-plus-recipes/> (अभी live नहीं है: repo public होने और GitHub Pages चालू होने के बाद यह चालू होगा)।

Element Plus या Playwright से इसका कोई संबंध नहीं है। ये नाम सिर्फ़ यह बताने के लिए इस्तेमाल हुए हैं कि project क्या test करता है।

## जल्दी शुरू करें

```bash
git clone https://github.com/pualgao230113-sys/playwright-element-plus-recipes.git
cd playwright-element-plus-recipes
npm install
npx playwright install chromium   # first time only
npm test                          # starts the demo app on :5179 and runs every recipe
```

| Script | क्या करता है |
|---|---|
| `npm run dev` | <http://localhost:5179> पर demo app, हर recipe के लिए एक page |
| `npm test` | पूरा Playwright suite (headless Chromium, 1 worker) |
| `npm run test:ui` | Playwright UI mode, किसी एक recipe को step-by-step देखने के लिए अच्छा |
| `npm run typecheck` | App, specs और helpers को type-check करता है |
| `npm run build` | Demo app को `dist/` में build करता है |
| `npm run build:helpers` | Helpers को `dist-helpers/` में build करता है |

## Helpers को अपने project में इस्तेमाल करें

GitHub से install करें। यह npm पर नहीं है।

```bash
npm i -D github:pualgao230113-sys/playwright-element-plus-recipes
```

npm install के दौरान helpers build करता है (package की `prepare` script), इसलिए पहली बार install में लगभग एक मिनट लगता है। आपके project में `@playwright/test` पहले से होना चाहिए; यह peer dependency है, 1.63 के साथ test किया गया है।

pnpm dependencies की build scripts को block करता है, इसलिए पहले `pnpm-workspace.yaml` में इसे allow करें। pnpm 11 के साथ:

```yaml
allowBuilds:
  playwright-element-plus-recipes: true
```

pnpm 10 के साथ, pnpm अपनी `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` error में जो entry print करता है, उसे `onlyBuiltDependencies` में जोड़ें। Git dependency के लिए इसमें commit शामिल होता है, इसलिए update करने पर यह बदल जाती है।

```ts
import { expect, test } from '@playwright/test'
import { drainMessages, message, selectOption } from 'playwright-element-plus-recipes'

test('save a fruit', async ({ page }) => {
  await page.goto('/fruits')
  await selectOption(page, 'Fruit', 'Apple')
  await drainMessages(page)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(message(page, 'Saved')).toBeVisible()
})
```

यह ESM और CommonJS दोनों तरह के test projects में चलता है, और types साथ में आते हैं। हर helper एक example के साथ [docs/helpers.md](docs/helpers.md) में दिया गया है। अगर आप dependency नहीं जोड़ना चाहते, तो [`tests/helpers/element-plus.ts`](tests/helpers/element-plus.ts) को अपने project में copy कर लें। यह सिर्फ़ `@playwright/test` import करता है।

## Recipes

हर pitfall पर **Common** (आम: component इस्तेमाल करने वाले ज़्यादातर apps में यह आएगा) या **Specific** (ख़ास: सिर्फ़ brackets में दिए option या version के साथ) लिखा है। हर एक को linked spec का एक test reproduce करता है।

एक चीज़ लगभग हर page पर सामने आती है, और यह Playwright की है, Element Plus की नहीं: accessible names default रूप से substring से match होते हैं। `getByRole('option', { name: 'Apple' })` "Pineapple" को भी ढूँढ लेता है, और `getByRole('button', { name: 'Delete' })` "Delete book" button को भी। `exact: true` या anchored RegExp दें, और जब एक ही text दो बार आए तो group, dialog या menu तक scope करें। Specs इसे selects ([01](tests/01-select.spec.ts)), radio groups ([03](tests/03-checkbox-radio-switch.spec.ts)), dialogs ([05](tests/05-dialog-drawer-messagebox.spec.ts)), trees ([11](tests/11-tree.spec.ts)), tabs ([16](tests/16-tabs.spec.ts)), menus ([18](tests/18-dropdown.spec.ts)) और collapse items ([21](tests/21-collapse.spec.ts)) के लिए दिखाते हैं। Helpers exact names इस्तेमाल करते हैं।

| # | Component | Pitfalls | क्या करें | Spec |
|---|---|---|---|---|
| 01 | `el-select` | **Common:** options `<body>` में teleport होते हैं, select के अंदर render नहीं होते।<br>**Common:** non-filterable select (default) पर, combobox के `<input>` पर click को placeholder बीच में रोक लेता है। Filterable select के input पर click हो सकता है, सिवाय 2.13.3–2.14.1 के, जहाँ placeholder उसे भी रोक लेता है।<br>**Common:** `multiple` select हर pick के बाद खुला रहता है।<br>**Specific** (`remote`): पहले results आने तक dropdown छिपा रहता है। | `.el-select` root पर click करें। `aria-controls` से उसी select की listbox तक जाएँ। Multi-pick के बाद Escape दबाएँ। Option का इंतज़ार करें, तय समय का नहीं। | [01-select](tests/01-select.spec.ts) |
| 02 | `ElMessage` | **Common:** toasts जमा होते हैं, इसलिए `getByRole('alert')` पुराने toasts को भी पकड़ता है।<br>**Common:** जो toast दिखा और fade हो गया, उसके लिए भी `toHaveCount(0)` pass हो जाता है। | Toasts को exact text से match करें। किसी action को दोहराने से पहले `drainMessages()` call करें। "कोई toast नहीं" साबित करने के लिए action से पहले `recordMessages()` शुरू करें। | [02-message](tests/02-message.spec.ts) |
| 03 | `el-checkbox` / `el-radio` / `el-switch` | **Common:** असली input छिपा होता है: `check()` का timeout हो जाता है और `force` "outside of the viewport" के साथ fail होता है।<br>**Specific** (`active-text` / `inactive-text`): switch के texts toggle करते हैं, set नहीं करते।<br>**Specific** (`el-form-item` में switch, उसके label से click किया गया): native `checked` और `aria-checked` मेल नहीं खाते। | `setChecked()` helper इस्तेमाल करें। यह checkbox के `label.el-checkbox` पर Playwright का `setChecked()` call करता है (सादे checkboxes, `el-checkbox-button` नहीं)। Radio के लिए, `radiogroup` के अंदर उसके `<label>` पर Playwright का `check()` call करें। Switch की state `aria-checked` से पढ़ें, `toBeChecked()` से नहीं। | [03-checkbox-radio-switch](tests/03-checkbox-radio-switch.spec.ts) |
| 04 | `el-date-picker` | **Common:** `format` (जो दिखता है) और `value-format` (जो store होता है) अलग चीज़ें हैं।<br>**Common:** type किया गया text model तक सिर्फ़ Enter या blur पर पहुँचता है।<br>**Common:** grid में दिन की संख्याएँ दोहराई जाती हैं (अगले महीने के शुरुआती दिन भी दिखते हैं)।<br>**Common:** calendar आज की तारीख़ पर खुलता है, इसलिए दिन पर click तारीख़ पर निर्भर करते हैं।<br>**Specific** (`value-format` नहीं, UTC के पूर्व का timezone): date पिछले दिन के रूप में serialise होती है।<br>**Specific** (typing, 2.14.4+): parsing ढीली है: `3/4/2026` 4 मार्च बन जाता है, `31/02/2026` 3 मार्च बन जाता है, और `15/3/2026` reject होता है जबकि पुरानी value बनी रहती है। | Display format में type करें, फिर input और model दोनों check करें। `page.clock` से clock freeze करें। सिर्फ़ `td.available` cells चुनें। App में `value-format` set करें। | [04-date-picker](tests/04-date-picker.spec.ts) |
| 05 | `el-dialog` / `el-drawer` / `ElMessageBox` | **Common:** बंद dialog DOM में बना रहता है।<br>**Common:** message box `#app` के बाहर render होता है।<br>**Specific** (scroll lock पर assert करना): lock `<body>` पर एक class है, जो dialog पूरी तरह बंद होने के बाद हटती है। | `getByRole('dialog', { name })` से scope करें। `toBeHidden()` assert करें, `toHaveCount(0)` नहीं। Body class को retry करने वाले `expect` से check करें। | [05-dialog-drawer-messagebox](tests/05-dialog-drawer-messagebox.spec.ts) |
| 06 | `el-table` | **Common:** `getByRole('row')` header row को भी गिनता है। Header एक अलग `<table>` भी है।<br>**Common:** empty text loading mask के नीचे पहले से दिख रहा होता है।<br>**Specific** (sortable columns, 2.13.0+): "Sort by X" button सीधे descending पर जाता है, और दूसरा click sort हटा देता है। | `.el-loading-mask` के छिपने का इंतज़ार करें। `tbody tr.el-table__row` गिनें। Columns को अपना `class-name` दें और rows को cell से ढूँढें। Cycle करने के लिए header cell पर, या set करने के लिए caret पर click करें, और `aria-sort` check करें। | [06-table](tests/06-table.spec.ts) |
| 07 | `el-form` | **Common:** `trigger: 'blur'` वाले rules field से focus हटने तक कुछ नहीं करते।<br>**Common:** required asterisk accessible name का हिस्सा है (`"* Username"`)।<br>**Specific** (async validators): validator के जवाब देने से पहले ही "कोई error नहीं" pass हो जाता है। | Blur के लिए Tab दबाएँ। `is-success` / `is-validating` का इंतज़ार करें। Names को anchored RegExp से match करें (`/Username$/`)। | [07-form-validation](tests/07-form-validation.spec.ts) |
| 08 | `el-input` | **Specific** (`maxlength`): `fill()` जो type करता है, browser उसे काट देता है।<br>**Specific** (`clearable`): input पर hover होने तक clear icon पर click नहीं हो सकता।<br>**Specific** (`@clear`): `fill('')` से `clear` emit नहीं होता। | कटी हुई value और counter assert करें। Clear पर click से पहले hover करें। जब app `@clear` पर निर्भर हो, तो icon पर click करें। | [08-input](tests/08-input.spec.ts) |
| 09 | Poppers और viewport | **Common:** नीचे जगह न होने पर dropdowns trigger के ऊपर खुलते हैं, इसलिए नतीजे window की ऊँचाई पर निर्भर करते हैं। | Config में viewport fix करें, coordinates की जगह locators इस्तेमाल करें, और जब side मायने रखती हो तो `data-popper-placement` check करें। | [09-viewport-popper](tests/09-viewport-popper.spec.ts) |
| 10 | `el-cascader` | **Common:** input एक `textbox` है, combobox नहीं, और इसमें `aria-controls` नहीं है। Panel सिर्फ़ wrapper के `aria-describedby` से जुड़ा है, और वह भी सिर्फ़ खुले रहने पर।<br>**Common:** parent पर click अगला column खोलता है पर model नहीं बदलता; leaf पर click model बदलता है, और panel बंद कर देता है।<br>**Common:** input labels दिखाता है (`Fruit / Citrus / Lemon`), model values रखता है।<br>**Specific** (`checkStrictly`): parent label पर click सिर्फ़ उसे expand करता है; उसके radio पर click करें।<br>**Specific** (`filterable`): results पूरे paths की एक सादी list होते हैं, menu items नहीं।<br>**Specific** (`multiple`): panel खुला रहता है, और parent को check करने से उसके सारे leaves जुड़ जाते हैं। | `openCascader()` / `pickCascaderPath()` इस्तेमाल करें। Input और model दोनों assert करें। | [10-cascader](tests/10-cascader.spec.ts) |
| 11 | `el-tree` / `el-tree-select` | **Common:** parent को एक बार expand किए बिना child nodes render नहीं होते।<br>**Common:** tree-select में parent पर click उसे pick करने की जगह expand करता है।<br>**Specific** (`show-checkbox`): node text पर click उसे expand करता है, check नहीं करता।<br>**Specific** (`show-checkbox`, कुछ children checked): parent treeitem `aria-checked="false"` बताता है; सिर्फ़ उसका checkbox indeterminate होता है, और वह `getCheckedKeys()` में नहीं होता।<br>**Specific** (checkboxes वाला `multiple` tree-select): model में सिर्फ़ leaf keys होती हैं। | पहले expand करें (`expandTreeNode()`), checkbox label से check करें (`setTreeChecked()`), और checkbox पर `toBeChecked({ indeterminate: true })` assert करें। | [11-tree](tests/11-tree.spec.ts) |
| 12 | `el-autocomplete` | **Common:** नाम वाला element एक `textbox` है; `combobox` role बिना नाम वाले wrapper पर है।<br>**Common:** debounce चलने तक पिछले suggestions screen पर रहते हैं, इसलिए "option X" का इंतज़ार पुरानी list पर pass हो सकता है।<br>**Common:** कुछ highlight न हो तो Enter कुछ pick नहीं करता: model type किया गया text होता है और `select` कभी fire नहीं होता।<br>**Common:** पूरा suggestion type करना उसे pick करने जैसा नहीं है। | Listbox को textbox के `aria-controls` से ढूँढें (2.13.1+)। पूरी नई list का `toHaveText([...])` से इंतज़ार करें, फिर click करें। Check करें कि `select` fire हुआ, और input भी check करें। | [12-autocomplete](tests/12-autocomplete.spec.ts) |
| 13 | `el-input-number` | **Common:** model typing के साथ बदलता है, पर `change` सिर्फ़ blur या Enter पर fire होता है।<br>**Common:** हर field में "increase number" / "decrease number" नाम के buttons होते हैं, और limit पर उन्हें सिर्फ़ `is-disabled` class मिलती है, इसलिए `toBeDisabled()` fail होता है।<br>**Specific** (`min` / `max`): max-10 field में 25 type करने पर "25" दिखता है जबकि model पहले से 10 है।<br>**Specific** (field खाली करना): model खाली हो जाता है, `min` नहीं।<br>**Specific** (`precision` / `step-strictly`): commit पर values round होती हैं (2.345 से 2.35, step 6 के साथ 10 से 12)। | Tab से commit करें (`setInputNumber()`) और उसके बाद field जो दिखाता है उसे assert करें। Buttons को field तक scope करें (`inputNumberButton()`) और class check करें। | [13-input-number](tests/13-input-number.spec.ts) |
| 14 | `el-time-picker` / `el-time-select` | **Common:** picker खोलते ही current time input और model में लिख दिया जाता है। Escape और बाहर click करने पर वह बना रहता है; सिर्फ़ Cancel पुरानी value वापस लाता है।<br>**Common:** column के दिखने वाले हिस्से से बाहर के spinner items पर click नहीं हो सकता: active item click को रोक लेता है।<br>**Common:** `el-time-select` एक `el-select` है, time picker नहीं।<br>**Specific** (typing): parsing ढीली है: `7:5` 07:05 बन जाता है, `25:99` 02:39 बन जाता है। | Clock freeze करें। Time type करके Enter दबाएँ (`typeTime()`)। Time-select के लिए select helpers इस्तेमाल करें। | [14-time-picker](tests/14-time-picker.spec.ts) |
| 15 | `el-upload` | **Common:** असली `<input type="file">` `display: none` है; उस पर सीधे `setInputFiles()` call करें।<br>**Common:** `accept` से `setInputFiles()` नहीं रुकता, इसलिए type सिर्फ़ `before-upload` check करता है।<br>**Common:** server के बिना request fail होती है और file list से निकल जाती है।<br>**Common:** हर list item में एक छिपा "press delete to remove" hint भी होता है, जिसे `toHaveText()` शामिल कर लेता है।<br>**Specific** (2.11.7+): trigger का नाम दो buttons से match होता है।<br>**Specific** (in-memory files): आप जो `mimeType` देते हैं, `before-upload` को वही `file.type` के रूप में दिखता है।<br>**Specific** (`limit`): extra file `on-exceed` में जाती है; कुछ throw नहीं होता।<br>**Specific** (`multiple` नहीं): कई files के साथ `setInputFiles()` throw करता है। | `uploadInput()` और `fakeUploadEndpoint()` इस्तेमाल करें। File names को `uploadedFileNames()` से assert करें। बड़ी files test में buffers के रूप में बनाएँ। | [15-upload](tests/15-upload.spec.ts) |
| 16 | `el-tabs` | **Common:** inactive panes DOM में होते हैं, बस छिपे रहते हैं।<br>**Specific** (`lazy`): tab खुलने तक pane DOM में नहीं होता, फिर बना रहता है।<br>**Specific** (disabled tabs): सिर्फ़ एक `is-disabled` class होती है; click हो जाता है और कुछ नहीं करता। | `getByRole('tabpanel', { name })` और `aria-selected` पर assert करें। Disabled tabs के लिए class check करें। | [16-tabs](tests/16-tabs.spec.ts) |
| 17 | `el-pagination` | **Common:** page numbers "page N" label वाले list items हैं, buttons नहीं, और "page 1" से "page 10" भी match हो जाता है।<br>**Specific** (`jumper`): type करते समय "Go to" कुछ नहीं करता; यह Enter या blur पर लागू होता है, और आख़िरी page पर रुक जाता है।<br>**Specific** (`sizes`): page-size select का कोई accessible name नहीं है, और बड़ा page size आपको दूसरे page पर ले जा सकता है। | `pageButton()` / `currentPage()` / `jumpToPage()` इस्तेमाल करें। Size select तक pagination root से पहुँचें। | [17-pagination](tests/17-pagination.spec.ts) |
| 18 | `el-dropdown` | **Common:** menu teleport होता है; trigger का `aria-controls` उसकी ओर point करता है। बंद menus DOM में बने रहते हैं।<br>**Common:** hover menu, mouse कहीं और जाते ही बंद हो जाता है।<br>**Specific** (`trigger="click"`): hover करने से कुछ नहीं होता।<br>**Specific** (disabled items): click इंतज़ार करता है और timeout हो जाता है; इसकी जगह `toBeDisabled()` assert करें।<br>**Specific** (`split-button`): menu एक अलग "Toggle Dropdown" button से खुलता है। | `openDropdown()` / `dropdownCommand()` इस्तेमाल करें, और खोलने और pick करने के बीच mouse न हिलाएँ। | [18-dropdown](tests/18-dropdown.spec.ts) |
| 19 | `el-popconfirm` / `el-tooltip` | **Common:** popconfirm `role="tooltip"` है, `dialog` नहीं।<br>**Common:** popconfirm का content सिर्फ़ उसके खुले रहने तक DOM में होता है, और tooltip का भी (hover के बाद)।<br>**Specific** (cancel पर action लेने वाले apps): सिर्फ़ cancel button `cancel` fire करता है। बाहर click करने से वह `cancel` के बिना बंद हो जाता है। Escape उसे बंद करता है, वह भी `cancel` के बिना, लेकिन सिर्फ़ तब जब focus popconfirm के अंदर हो; reference button पर focus हो तो Escape कुछ नहीं करता। | Reference के `aria-describedby` को follow करें (`answerPopconfirm()`)। Tooltip assert करने से पहले hover करें, और `toHaveAccessibleDescription()` check करें। | [19-popconfirm-tooltip](tests/19-popconfirm-tooltip.spec.ts) |
| 20 | `ElNotification` | **Common:** notifications toasts की तरह `role="alert"` होते हैं, और जमा होते हैं।<br>**Common:** close x एक `<i>` है जिसका कोई role नहीं।<br>**Common:** notification पर hover करने से उसका timer रुक जाता है।<br>**Specific** (level से headings ढूँढने वाले pages): title एक `<h2>` है।<br>**Specific** (type assert करना): type class icon पर है, box पर नहीं। | Title से match करें (`notification()`), `closeNotification()` से बंद करें, और `drainNotifications()` इस्तेमाल करें, जो पहले mouse को हटा देता है। | [20-notification](tests/20-notification.spec.ts) |
| 21 | `el-collapse` | **Common:** बंद items अपना content DOM में रखते हैं।<br>**Common:** header पर click toggle करता है, इसलिए "इसे खोलो" वाला step पहले से खुले item को बंद कर देता है।<br>**Specific** (खुलने के तुरंत बाद screenshots या clicks): content animation के पहले pixel से ही visible माना जाता है। | Click से पहले `aria-expanded` check करें (`setCollapseItem()`), और animation ख़त्म होने का इंतज़ार करें। | [21-collapse](tests/21-collapse.spec.ts) |

## टेस्ट किए गए versions

Vue 3.5.43, @playwright/test 1.63.0 (Chromium headless shell), Vite 8.3.3, Node.js 24.

नीचे दिया हर Element Plus version अलग से install किया गया और उस पर पूरा suite चलाया गया (109 tests)। जहाँ versions के बीच कोई behaviour बदला, वहाँ spec reason में version लिखकर skip होता है, या हर version के लिए सही value assert करता है। CI तीनों supported versions चलाता है।

| Element Plus | नतीजा | Notes |
|---|---|---|
| 2.14.7 | 109 passed | लिखते समय latest। सभी recipes लागू होती हैं। |
| 2.13.7 | 107 passed, 2 skipped | अभी ढीली date parsing नहीं (04), input counter पर `role="status"` नहीं (08)। |
| 2.9.11 | 102 passed, 7 skipped | साथ ही: tables में "Sort by" button या `aria-sort` नहीं (06), और autocomplete का `aria-controls` उसकी listbox की ओर point नहीं करता (12)। |
| 2.7.8 | Supported नहीं: 10 failed | Date और time picker inputs का कोई `combobox` role नहीं है, इसलिए उनके helpers को कुछ नहीं मिलता। |
| 2.4.4 | Supported नहीं: 16 failed | 2.7.8 जैसा ही, साथ में select, checkbox / radio, dialog और tree-select में 6 और failures (जैसे select का placeholder input पर click को नहीं रोकता)। |

हर बदलाव कहाँ हुआ, ताकि आप जान सकें कि आपके version पर कौन से notes लागू होते हैं:

| From | बदलाव | Recipe |
|---|---|---|
| 2.11.7 | Upload trigger के wrapper को `role="button"` मिलता है, इसलिए trigger का नाम दो buttons से match होता है। | 15 |
| 2.12.0 | Multiple select में tag का close icon "Close this tag" नाम का button बन जाता है। Spec `.el-tag__close` इस्तेमाल करता है, जो हर version में चलता है। | 01 |
| 2.13.0 | Sortable headers को `aria-sort` और एक "Sort by X" button मिलता है। | 06 |
| 2.13.1 | Autocomplete textbox का `aria-controls` listbox की ओर point करता है। पहले यह literal string `"id"` था। | 12 |
| 2.13.3–2.14.1 | Filterable select के input पर click भी placeholder रोक लेता है। 2.14.2 में ठीक हुआ। | 01 |
| 2.13.4 | खाली time picker पर Cancel model में `null` छोड़ता है। पहले, एक empty string। | 14 |
| 2.14.0 | Input का clear icon छिपे रहने पर भी DOM में रहता है। पहले यह सिर्फ़ hover पर render होता था। दोनों हालात में, पहले hover करें। | 08 |
| 2.14.4 | Type की गई dates ढीले ढंग से parse होती हैं (`3/4/2026` 4 मार्च बन जाता है)। पहले `3/4/2026` reject होता था। | 04 |
| 2.14.5 | Word-limit counter को `role="status"` मिलता है। पहले, `.el-input__count` इस्तेमाल करें। | 08 |

## सीमाएँ और ज्ञात अंतर

- सिर्फ़ Chromium। Recipes Firefox या WebKit में नहीं चलाई गईं।
- इनमें से ज़्यादातर behaviours Element Plus की implementation details हैं, documented API नहीं। अगर upgrade के बाद कोई recipe fail होने लगे, तो कुछ बदला है। अपने tests दोबारा लिखने से पहले recipe check करें।
- Helpers वही English texts match करते हैं जो demo app दिखाता है ("increase number", "page N", "Yes" / "No")। अगर आपका app कोई और locale इस्तेमाल करता है, तो अपने names दें या helper बदल लें।
- Demo pages जानबूझकर छोटे रखे गए हैं। असली app अपनी timing जोड़ता है (API calls, आपके अपने transitions), इसलिए results का इंतज़ार करते रहें, समय का नहीं।

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) देखें। मुख्य नियम: कोई pitfall तभी जोड़ा जाता है जब कोई test उसे असली library पर reproduce करे।

## License

[MIT](LICENSE) © 2026 Paul Gao

## अनुवाद

English के अलावा बाकी READMEs मशीन की मदद से अनुवादित हैं। English README ही reference है। सुधार pull requests के रूप में भेजे जा सकते हैं।
