# playwright-element-plus-recipes

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | **한국어** | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md) | [Bahasa Melayu](README.ms.md) | [हिन्दी](README.hi.md)

[![Tests](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml/badge.svg)](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://pualgao230113-sys.github.io/playwright-element-plus-recipes/) [![npm](https://img.shields.io/npm/v/playwright-element-plus)](https://www.npmjs.com/package/playwright-element-plus)

Element Plus 컴포넌트에는 Playwright 테스트를 헷갈리는 방식으로 깨뜨리는 동작이 있습니다. 드롭다운이 페이지의 다른 곳에 렌더링되고, input이 숨겨져 있고, 토스트가 쌓이고, 값이 blur 때만 반영되는 식입니다. 이 저장소에는 컴포넌트마다 페이지가 하나씩 있는 작은 데모 앱, 컴포넌트마다 그 문제가 실제로 일어나는 걸 보여 주는 Playwright spec, 그리고 여러분의 테스트에서 쓸 수 있는 헬퍼가 들어 있습니다. 헬퍼는 npm에 [`playwright-element-plus`](https://www.npmjs.com/package/playwright-element-plus)로 공개되어 있습니다.

<p align="center"><img src="docs/demo.gif" alt="데모 앱을 조작하는 Playwright: select에서 고르기, 토스트 쌓기, 날짜 고르기" width="720"></p>

라이브 데모: <https://pualgao230113-sys.github.io/playwright-element-plus-recipes/>

Element Plus, Playwright와는 관련이 없습니다. 이름은 이 프로젝트가 무엇을 테스트하는지 설명하는 데만 씁니다.

## 빠른 시작

```bash
git clone https://github.com/pualgao230113-sys/playwright-element-plus-recipes.git
cd playwright-element-plus-recipes
npm ci
npx playwright install chromium   # first time only
npm test                          # starts the demo app on :5179 and runs every recipe
```

| 스크립트 | 하는 일 |
|---|---|
| `npm run dev` | <http://localhost:5179>에서 데모 앱 실행, 레시피마다 페이지 하나 |
| `npm test` | 전체 Playwright 스위트 (headless Chromium, worker 1개) |
| `npm run test:ui` | Playwright UI 모드, 레시피 하나를 단계별로 실행해 볼 때 사용 |
| `npm run typecheck` | 앱, spec, 헬퍼의 타입 검사 |
| `npm run build` | 데모 앱을 `dist/`에 빌드 |
| `npm run build:helpers` | `playwright-element-plus` 패키지를 `packages/playwright-element-plus/dist/`에 빌드 |

## 내 프로젝트에서 헬퍼 쓰기

```bash
npm i -D playwright-element-plus
```

프로젝트에 `@playwright/test`가 이미 있어야 합니다. peer dependency이고, 1.63으로 테스트했습니다.

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

ESM과 CommonJS 테스트 프로젝트 둘 다에서 쓸 수 있고, 타입도 함께 들어 있습니다. 모든 헬퍼는 [docs/helpers.md](docs/helpers.md)에 예제와 함께 정리돼 있습니다. 패키지 자체의 README는 [packages/playwright-element-plus/README.md](packages/playwright-element-plus/README.md)입니다. 의존성을 추가하고 싶지 않다면 [`packages/playwright-element-plus/src/index.ts`](packages/playwright-element-plus/src/index.ts)를 프로젝트에 복사하세요. 이 파일은 `@playwright/test`만 import합니다.

### GitHub에서 최신 코드 설치하기

`main`에는 들어갔지만 아직 npm에 배포되지 않은 변경을 쓰고 싶을 때만 필요합니다.

```bash
npm i -D github:pualgao230113-sys/playwright-element-plus-recipes
```

이렇게 하면 저장소가 `playwright-element-plus-recipes`라는 이름으로 설치되므로, import도 `'playwright-element-plus-recipes'`에서 하세요. 설치할 때 npm이 헬퍼를 빌드하기 때문에(저장소의 `prepare` 스크립트) 첫 설치는 1분 정도 걸립니다.

pnpm은 의존성의 빌드 스크립트를 막기 때문에, 먼저 `pnpm-workspace.yaml`에서 이 패키지를 허용해야 합니다. pnpm 11에서는 이렇게 합니다:

```yaml
allowBuilds:
  playwright-element-plus-recipes: true
```

pnpm 10에서는 pnpm이 `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` 오류에 출력하는 항목을 `onlyBuiltDependencies`에 추가합니다. git 의존성이면 이 항목에 커밋이 들어가기 때문에, 업데이트할 때마다 바뀝니다.

## 레시피

각 함정에는 **Common**(흔함: 그 컴포넌트를 쓰는 앱 대부분에서 겪음) 또는 **Specific**(특정 조건: 괄호 안의 옵션이나 버전일 때만 생김) 표시가 붙어 있습니다. 모두 링크된 spec의 테스트로 재현됩니다.

거의 모든 페이지에서 나오는 문제가 하나 있는데, Element Plus가 아니라 Playwright 쪽 동작입니다: accessible name은 기본적으로 부분 문자열로 매칭됩니다. `getByRole('option', { name: 'Apple' })`은 "Pineapple"도 찾고, `getByRole('button', { name: 'Delete' })`는 "Delete book" 버튼도 찾습니다. `exact: true`나 앵커를 붙인 RegExp를 넘기고, 같은 텍스트가 두 번 나오면 범위를 그룹, dialog, 메뉴로 좁히세요. spec에서는 select([01](tests/01-select.spec.ts)), 라디오 그룹([03](tests/03-checkbox-radio-switch.spec.ts)), dialog([05](tests/05-dialog-drawer-messagebox.spec.ts)), 트리([11](tests/11-tree.spec.ts)), 탭([16](tests/16-tabs.spec.ts)), 메뉴([18](tests/18-dropdown.spec.ts)), collapse 항목([21](tests/21-collapse.spec.ts))에서 이걸 보여 줍니다. 헬퍼는 정확한 이름을 씁니다.

| # | 컴포넌트 | 함정 | 대처 | Spec |
|---|---|---|---|---|
| 01 | `el-select` | **Common:** 옵션이 select 안이 아니라 `<body>`로 teleport됩니다.<br>**Common:** filterable이 아닌 select(기본값)에서는 combobox `<input>`을 클릭하면 placeholder가 클릭을 가로챕니다. filterable select의 input은 클릭할 수 있습니다. 단, 2.13.3–2.14.1에서는 이것도 placeholder가 가로챕니다.<br>**Common:** `multiple` select는 하나 고를 때마다 열린 채로 있습니다.<br>**Specific** (`remote`): 첫 결과가 올 때까지 드롭다운이 숨겨져 있습니다. | `.el-select` 루트를 클릭합니다. `aria-controls`를 따라가 그 select의 listbox를 찾습니다. 여러 개를 고른 뒤에는 Escape를 누릅니다. 고정된 시간이 아니라 옵션이 나타나기를 기다립니다. | [01-select](tests/01-select.spec.ts) |
| 02 | `ElMessage` | **Common:** 토스트가 쌓이기 때문에 `getByRole('alert')`가 이전 토스트까지 잡습니다.<br>**Common:** `toHaveCount(0)`은 나타났다가 사라진 토스트에도 통과합니다. | 토스트는 정확한 텍스트로 매칭합니다. 같은 동작을 반복하기 전에 `drainMessages()`를 호출합니다. "토스트 없음"을 증명하려면 동작 전에 `recordMessages()`를 시작합니다. | [02-message](tests/02-message.spec.ts) |
| 03 | `el-checkbox` / `el-radio` / `el-switch` | **Common:** 실제 input이 숨겨져 있습니다: `check()`는 타임아웃되고, `force`는 "outside of the viewport"로 실패합니다.<br>**Specific** (`active-text` / `inactive-text`): 스위치 텍스트는 값을 설정하지 않고 토글합니다.<br>**Specific** (`el-form-item` 안의 스위치를 label로 클릭): 네이티브 `checked`와 `aria-checked`가 서로 다릅니다. | `setChecked()` 헬퍼를 씁니다. 이 헬퍼는 체크박스의 `label.el-checkbox`에 Playwright의 `setChecked()`를 호출합니다(일반 체크박스만, `el-checkbox-button`은 제외). 라디오는 `radiogroup` 안의 `<label>`에 Playwright의 `check()`를 호출합니다. 스위치 상태는 `toBeChecked()`가 아니라 `aria-checked`에서 읽습니다. | [03-checkbox-radio-switch](tests/03-checkbox-radio-switch.spec.ts) |
| 04 | `el-date-picker` | **Common:** `format`(표시)과 `value-format`(저장)은 서로 다른 것입니다.<br>**Common:** 입력한 텍스트는 Enter나 blur 때만 model에 들어갑니다.<br>**Common:** 그리드에 날짜 숫자가 중복됩니다(다음 달 첫 며칠도 보이기 때문).<br>**Common:** 달력이 오늘 날짜로 열리기 때문에, 날짜 클릭 결과가 실행한 날에 따라 달라집니다.<br>**Specific** (`value-format` 없음, UTC보다 동쪽 시간대): 날짜가 전날로 직렬화됩니다.<br>**Specific** (직접 입력, 2.14.4+): 파싱이 느슨합니다: `3/4/2026`은 3월 4일, `31/02/2026`은 3월 3일이 되고, `15/3/2026`은 거부되며 이전 값이 남습니다. | 표시 형식대로 입력한 다음 input과 model을 둘 다 확인합니다. `page.clock`으로 시계를 고정합니다. `td.available` 셀만 고릅니다. 앱에서 `value-format`을 설정합니다. | [04-date-picker](tests/04-date-picker.spec.ts) |
| 05 | `el-dialog` / `el-drawer` / `ElMessageBox` | **Common:** 닫힌 dialog도 DOM에 남아 있습니다.<br>**Common:** 메시지 박스는 `#app` 바깥에 렌더링됩니다.<br>**Specific** (스크롤 잠금을 검증할 때): 잠금은 `<body>`의 class이고, dialog가 다 닫힌 뒤에 제거됩니다. | `getByRole('dialog', { name })`으로 범위를 좁힙니다. `toHaveCount(0)`이 아니라 `toBeHidden()`으로 검증합니다. body class는 재시도하는 `expect`로 확인합니다. | [05-dialog-drawer-messagebox](tests/05-dialog-drawer-messagebox.spec.ts) |
| 06 | `el-table` | **Common:** `getByRole('row')`가 헤더 행도 셉니다. 헤더는 별개의 `<table>`이기도 합니다.<br>**Common:** 빈 데이터 텍스트가 로딩 마스크 아래에서 이미 보입니다.<br>**Specific** (정렬 가능한 컬럼, 2.13.0+): "Sort by X" 버튼은 바로 내림차순으로 가고, 한 번 더 클릭하면 정렬이 해제됩니다. | `.el-loading-mask`가 사라질 때까지 기다립니다. `tbody tr.el-table__row`를 셉니다. 컬럼에 직접 `class-name`을 붙이고, 셀로 행을 찾습니다. 헤더 셀을 클릭해 순환하거나 caret을 클릭해 직접 지정하고, `aria-sort`를 확인합니다. | [06-table](tests/06-table.spec.ts) |
| 07 | `el-form` | **Common:** `trigger: 'blur'` 규칙은 필드가 포커스를 잃기 전까지 아무것도 하지 않습니다.<br>**Common:** 필수 표시 별표가 accessible name에 포함됩니다(`"* Username"`).<br>**Specific** (비동기 validator): validator가 응답하기 전에 "오류 없음"이 통과합니다. | Tab을 눌러 blur시킵니다. `is-success` / `is-validating`을 기다립니다. 이름은 앵커를 붙인 RegExp로 매칭합니다(`/Username$/`). | [07-form-validation](tests/07-form-validation.spec.ts) |
| 08 | `el-input` | **Specific** (`maxlength`): `fill()`로 입력한 내용을 브라우저가 잘라냅니다.<br>**Specific** (`clearable`): input에 hover하기 전에는 지우기 아이콘을 클릭할 수 없습니다.<br>**Specific** (`@clear`): `fill('')`은 `clear`를 emit하지 않습니다. | 잘린 값과 카운터를 검증합니다. 지우기를 클릭하기 전에 hover합니다. 앱이 `@clear`에 의존한다면 아이콘을 클릭합니다. | [08-input](tests/08-input.spec.ts) |
| 09 | 팝퍼와 뷰포트 | **Common:** 아래쪽에 공간이 없으면 드롭다운이 트리거 위쪽으로 열리기 때문에, 결과가 창 높이에 따라 달라집니다. | 설정에서 뷰포트를 고정하고, 좌표 대신 locator를 쓰고, 어느 쪽에 열리는지가 중요하면 `data-popper-placement`를 확인합니다. | [09-viewport-popper](tests/09-viewport-popper.spec.ts) |
| 10 | `el-cascader` | **Common:** input은 combobox가 아니라 `textbox`이고, `aria-controls`도 없습니다. 패널은 wrapper의 `aria-describedby`로만 연결되고, 그것도 열려 있을 때뿐입니다.<br>**Common:** 부모를 클릭하면 다음 컬럼이 열리지만 model은 바뀌지 않습니다. model은 leaf를 클릭할 때 바뀌고, 그때 패널도 닫힙니다.<br>**Common:** input에는 label(`Fruit / Citrus / Lemon`)이 보이고, model에는 value가 들어 있습니다.<br>**Specific** (`checkStrictly`): 부모 label을 클릭하면 펼쳐지기만 합니다. 라디오를 클릭해야 합니다.<br>**Specific** (`filterable`): 결과는 메뉴 항목이 아니라 전체 경로가 나열된 단순한 목록입니다.<br>**Specific** (`multiple`): 패널이 열린 채로 있고, 부모를 체크하면 그 아래 leaf가 모두 추가됩니다. | `openCascader()` / `pickCascaderPath()`를 씁니다. input과 model을 둘 다 검증합니다. | [10-cascader](tests/10-cascader.spec.ts) |
| 11 | `el-tree` / `el-tree-select` | **Common:** 자식 노드는 부모를 한 번 펼치기 전까지 렌더링되지 않습니다.<br>**Common:** tree-select에서 부모를 클릭하면 선택되지 않고 펼쳐집니다.<br>**Specific** (`show-checkbox`): 노드 텍스트를 클릭하면 펼쳐질 뿐, 체크되지 않습니다.<br>**Specific** (`show-checkbox`, 자식 일부만 체크됨): 부모 treeitem은 `aria-checked="false"`입니다. indeterminate 상태는 체크박스에만 있고, `getCheckedKeys()`에도 들어가지 않습니다.<br>**Specific** (체크박스가 있는 `multiple` tree-select): model에는 leaf 키만 들어갑니다. | 먼저 펼치고(`expandTreeNode()`), 체크는 체크박스 label로 하고(`setTreeChecked()`), 체크박스에 `toBeChecked({ indeterminate: true })`로 검증합니다. | [11-tree](tests/11-tree.spec.ts) |
| 12 | `el-autocomplete` | **Common:** 이름이 붙은 요소는 `textbox`이고, `combobox` role은 이름 없는 wrapper에 있습니다.<br>**Common:** debounce가 돌 때까지 이전 추천 목록이 화면에 남아 있어서, "option X"를 기다리면 옛 목록으로 통과할 수 있습니다.<br>**Common:** 아무것도 하이라이트되지 않은 상태에서 Enter를 누르면 아무것도 선택되지 않습니다: model은 입력한 텍스트이고 `select`는 발생하지 않습니다.<br>**Common:** 추천 항목을 끝까지 입력하는 것과 그 항목을 고르는 것은 다릅니다. | textbox의 `aria-controls`로 listbox를 찾습니다(2.13.1+). `toHaveText([...])`로 새 목록 전체를 기다린 뒤 클릭합니다. `select`가 발생했는지 확인하고, input도 확인합니다. | [12-autocomplete](tests/12-autocomplete.spec.ts) |
| 13 | `el-input-number` | **Common:** model은 입력을 따라가지만, `change`는 blur나 Enter 때만 발생합니다.<br>**Common:** 모든 필드에 "increase number" / "decrease number"라는 이름의 버튼이 있고, 한계값에 닿으면 `is-disabled` class만 붙기 때문에 `toBeDisabled()`가 실패합니다.<br>**Specific** (`min` / `max`): 최대 10인 필드에 25를 입력하면, model은 이미 10인데 화면에는 "25"가 보입니다.<br>**Specific** (필드 비우기): model은 `min`이 아니라 빈 값이 됩니다.<br>**Specific** (`precision` / `step-strictly`): 값은 확정될 때 반올림됩니다(2.345는 2.35로, step 6이면 10은 12로). | Tab으로 확정하고(`setInputNumber()`) 그 뒤에 필드에 보이는 값을 검증합니다. 버튼은 해당 필드로 범위를 좁히고(`inputNumberButton()`) class를 확인합니다. | [13-input-number](tests/13-input-number.spec.ts) |
| 14 | `el-time-picker` / `el-time-select` | **Common:** picker를 열면 현재 시각이 input과 model에 들어갑니다. Escape나 바깥 클릭으로는 그 값이 유지되고, 이전 값으로 돌아가는 건 Cancel뿐입니다.<br>**Common:** 컬럼에서 보이는 범위 밖에 있는 spinner 항목은 클릭할 수 없습니다: 활성 항목이 클릭을 가로챕니다.<br>**Common:** `el-time-select`는 time picker가 아니라 `el-select`입니다.<br>**Specific** (직접 입력): 파싱이 느슨합니다: `7:5`는 07:05, `25:99`는 02:39가 됩니다. | 시계를 고정합니다. 시각을 입력하고 Enter를 누릅니다(`typeTime()`). time-select에는 select 헬퍼를 씁니다. | [14-time-picker](tests/14-time-picker.spec.ts) |
| 15 | `el-upload` | **Common:** 실제 `<input type="file">`은 `display: none`입니다. 여기에 직접 `setInputFiles()`를 호출합니다.<br>**Common:** `accept`는 `setInputFiles()`를 막지 않으므로, 파일 형식은 `before-upload`에서만 검사됩니다.<br>**Common:** 서버가 없으면 요청이 실패하고 파일이 목록에서 빠집니다.<br>**Common:** 목록 항목마다 숨겨진 "press delete to remove" 안내가 들어 있고, `toHaveText()`는 이것까지 포함합니다.<br>**Specific** (2.11.7+): 트리거 이름이 버튼 두 개에 매칭됩니다.<br>**Specific** (메모리 상의 파일): 넘긴 `mimeType`이 그대로 `before-upload`에서 `file.type`으로 보입니다.<br>**Specific** (`limit`): 초과한 파일은 `on-exceed`로 가고, 예외는 나지 않습니다.<br>**Specific** (`multiple` 없음): 여러 파일로 `setInputFiles()`를 호출하면 예외가 납니다. | `uploadInput()`과 `fakeUploadEndpoint()`를 씁니다. 파일 이름은 `uploadedFileNames()`로 검증합니다. 큰 파일은 테스트 안에서 buffer로 만듭니다. | [15-upload](tests/15-upload.spec.ts) |
| 16 | `el-tabs` | **Common:** 비활성 pane도 DOM에 있고, 숨겨져 있을 뿐입니다.<br>**Specific** (`lazy`): 탭을 열기 전까지 pane이 DOM에 없고, 한 번 열면 남아 있습니다.<br>**Specific** (비활성화된 탭): `is-disabled` class만 붙습니다. 클릭은 그대로 전달되고 아무 일도 일어나지 않습니다. | `getByRole('tabpanel', { name })`과 `aria-selected`로 검증합니다. 비활성화된 탭은 class를 확인합니다. | [16-tabs](tests/16-tabs.spec.ts) |
| 17 | `el-pagination` | **Common:** 페이지 번호는 버튼이 아니라 "page N" label이 붙은 목록 항목이고, "page 1"은 "page 10"에도 매칭됩니다.<br>**Specific** (`jumper`): "Go to"는 입력하는 동안에는 아무것도 하지 않습니다. Enter나 blur 때 적용되고, 마지막 페이지를 넘는 값은 마지막 페이지로 맞춰집니다.<br>**Specific** (`sizes`): 페이지 크기 select에는 accessible name이 없고, 페이지 크기를 키우면 다른 페이지로 이동할 수 있습니다. | `pageButton()` / `currentPage()` / `jumpToPage()`를 씁니다. 크기 select는 pagination 루트를 통해 찾습니다. | [17-pagination](tests/17-pagination.spec.ts) |
| 18 | `el-dropdown` | **Common:** 메뉴는 teleport되고, 트리거의 `aria-controls`가 메뉴를 가리킵니다. 닫힌 메뉴도 DOM에 남아 있습니다.<br>**Common:** hover 메뉴는 마우스가 다른 곳으로 가는 순간 닫힙니다.<br>**Specific** (`trigger="click"`): hover해도 아무 일도 없습니다.<br>**Specific** (비활성화된 항목): 클릭이 기다리다 타임아웃됩니다. 대신 `toBeDisabled()`로 검증합니다.<br>**Specific** (`split-button`): 메뉴는 별도의 "Toggle Dropdown" 버튼으로 열립니다. | `openDropdown()` / `dropdownCommand()`를 쓰고, 열고 나서 고를 때까지 마우스를 움직이지 않습니다. | [18-dropdown](tests/18-dropdown.spec.ts) |
| 19 | `el-popconfirm` / `el-tooltip` | **Common:** popconfirm은 `dialog`가 아니라 `role="tooltip"`입니다.<br>**Common:** popconfirm의 내용은 열려 있는 동안에만 DOM에 있고, tooltip의 내용도 마찬가지입니다(hover한 뒤).<br>**Specific** (취소 시 동작하는 앱): `cancel`은 취소 버튼으로만 발생합니다. 바깥을 클릭하면 `cancel` 없이 닫힙니다. Escape도 닫지만 역시 `cancel`은 없고, 포커스가 popconfirm 안에 있을 때만 그렇습니다. 포커스가 기준 버튼에 있으면 Escape는 아무것도 하지 않습니다. | 기준 요소의 `aria-describedby`를 따라갑니다(`answerPopconfirm()`). tooltip을 검증하기 전에 hover하고, `toHaveAccessibleDescription()`을 확인합니다. | [19-popconfirm-tooltip](tests/19-popconfirm-tooltip.spec.ts) |
| 20 | `ElNotification` | **Common:** 알림은 토스트처럼 `role="alert"`이고, 쌓입니다.<br>**Common:** 닫기 x는 role이 없는 `<i>`입니다.<br>**Common:** 알림에 hover하면 타이머가 멈춥니다.<br>**Specific** (heading을 레벨로 찾는 페이지): 제목은 `<h2>`입니다.<br>**Specific** (type을 검증할 때): type class는 박스가 아니라 아이콘에 붙어 있습니다. | 제목으로 매칭하고(`notification()`), `closeNotification()`으로 닫고, `drainNotifications()`를 씁니다. 이 헬퍼는 먼저 마우스를 치워 줍니다. | [20-notification](tests/20-notification.spec.ts) |
| 21 | `el-collapse` | **Common:** 닫힌 항목도 내용이 DOM에 남아 있습니다.<br>**Common:** 헤더 클릭은 토글이라서, "열기" 단계가 이미 열려 있는 항목을 닫아 버립니다.<br>**Specific** (열자마자 찍는 스크린샷이나 클릭): 애니메이션 첫 픽셀부터 내용이 보이는 것으로 처리됩니다. | 클릭하기 전에 `aria-expanded`를 확인하고(`setCollapseItem()`), 애니메이션이 끝나기를 기다립니다. | [21-collapse](tests/21-collapse.spec.ts) |

## 테스트한 버전

Vue 3.5.43, @playwright/test 1.63.0 (Chromium headless shell), Vite 8.3.3, Node.js 24.

아래 Element Plus 버전을 하나씩 따로 설치하고, 각각에 대해 전체 스위트(111개 테스트)를 돌렸습니다. 버전에 따라 동작이 바뀐 곳에서는 spec이 이유에 버전을 적고 skip하거나, 버전별로 맞는 값을 검증합니다. CI는 지원하는 세 버전을 돌립니다.

| Element Plus | 결과 | 비고 |
|---|---|---|
| 2.14.7 | 111개 통과 | 모든 레시피가 해당됩니다. |
| 2.13.7 | 109개 통과, 2개 skip | 느슨한 날짜 파싱이 아직 없음(04), input 카운터에 `role="status"` 없음(08). |
| 2.9.11 | 104개 통과, 7개 skip | 추가로 테이블에 "Sort by" 버튼과 `aria-sort`가 없고(06), autocomplete의 `aria-controls`가 listbox를 가리키지 않음(12). |
| 2.7.8 | 지원 안 함: 13개 실패, 7개 skip | 날짜/시간 picker input에 `combobox` role이 없어서 헬퍼가 아무것도 찾지 못합니다. 또한 filterable select의 placeholder가 아직 input 클릭을 막고(01), 바깥을 클릭해도 popconfirm이 닫히지 않습니다(19). |
| 2.4.4 | 지원 안 함: 19개 실패, 7개 skip | 2.7.8과 같은 날짜 picker, 시간 picker, popconfirm 실패에 더해 select, checkbox / radio, dialog, tree-select, pagination에서 7개가 더 실패합니다(예를 들어 select의 placeholder가 input 클릭을 전혀 막지 않습니다). |

각 변경이 어느 버전에서 생겼는지 정리했습니다. 내 버전에 어떤 비고가 해당되는지 판단할 때 쓰세요.

| 버전 | 변경 | 레시피 |
|---|---|---|
| 2.11.7 | upload 트리거의 wrapper에 `role="button"`이 붙어서, 트리거 이름이 버튼 두 개에 매칭됩니다. | 15 |
| 2.12.0 | multiple select의 태그 닫기 아이콘이 "Close this tag"라는 이름의 버튼이 됩니다. spec은 모든 버전에서 동작하는 `.el-tag__close`를 씁니다. | 01 |
| 2.13.0 | 정렬 가능한 헤더에 `aria-sort`와 "Sort by X" 버튼이 생깁니다. | 06 |
| 2.13.1 | autocomplete textbox의 `aria-controls`가 listbox를 가리킵니다. 그 전에는 문자열 그대로 `"id"`입니다. | 12 |
| 2.13.3–2.14.1 | filterable select의 input도 placeholder가 클릭을 가로챕니다. 2.14.2에서 고쳐졌습니다. | 01 |
| 2.13.4 | 빈 time picker에서 Cancel하면 model에 `null`이 남습니다. 그 전에는 빈 문자열입니다. | 14 |
| 2.14.0 | input 지우기 아이콘이 숨겨져 있는 동안에도 DOM에 남습니다. 그 전에는 hover할 때만 렌더링됩니다. 어느 쪽이든 먼저 hover하세요. | 08 |
| 2.14.4 | 입력한 날짜를 느슨하게 파싱합니다(`3/4/2026`은 3월 4일이 됨). 그 전에는 `3/4/2026`이 거부됩니다. | 04 |
| 2.14.5 | 글자 수 카운터에 `role="status"`가 붙습니다. 그 전에는 `.el-input__count`를 쓰세요. | 08 |

## 한계와 알려진 차이

- Chromium만 지원합니다. Firefox나 WebKit에서는 레시피를 돌려 보지 않았습니다.
- 이 동작들은 대부분 문서화된 API가 아니라 Element Plus의 구현 세부 사항입니다. 업그레이드 후 레시피가 실패하기 시작했다면 뭔가 바뀐 것입니다. 내 테스트를 다시 쓰기 전에 레시피부터 확인하세요.
- 헬퍼는 데모 앱에 표시되는 영어 텍스트("increase number", "page N", "Yes" / "No")로 매칭합니다. 앱이 다른 locale을 쓴다면 이름을 직접 넘기거나 헬퍼를 고치세요.
- 데모 페이지는 일부러 작게 만들었습니다. 실제 앱에는 앱 나름의 타이밍(API 호출, 직접 만든 트랜지션)이 더해지니, 시간이 아니라 결과를 기다리는 방식을 계속 유지하세요.

## 기여하기

[CONTRIBUTING.md](CONTRIBUTING.md)를 보세요. 핵심 규칙은 하나입니다: 실제 라이브러리를 대상으로 테스트로 재현된 함정만 추가합니다.

## 라이선스

[MIT](LICENSE) © 2026 Paul Gao

## 번역

기준은 영어 README입니다. 번역 수정은 pull request로 보내 주시면 환영합니다.
