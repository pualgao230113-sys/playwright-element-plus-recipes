# playwright-element-plus-recipes

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | **日本語** | [한국어](README.ko.md) | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md) | [Bahasa Melayu](README.ms.md) | [हिन्दी](README.hi.md)

[![Tests](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml/badge.svg)](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://pualgao230113-sys.github.io/playwright-element-plus-recipes/) [![npm](https://img.shields.io/npm/v/playwright-element-plus)](https://www.npmjs.com/package/playwright-element-plus)

Element Plus のコンポーネントには、Playwright のテストをわかりにくい形で壊す挙動があります。ドロップダウンがページの別の場所に描画される、input が隠れている、トーストが積み重なる、値が blur したときにしか確定しない、などです。このリポジトリには、コンポーネントごとに 1 ページの小さなデモアプリと、その問題が実際に起きることを示すコンポーネントごとの Playwright の spec、それに自分のテストで使えるヘルパーが入っています。ヘルパーは npm で [`playwright-element-plus`](https://www.npmjs.com/package/playwright-element-plus) として公開しています。

<p align="center"><img src="docs/demo.gif" alt="Playwright がデモアプリを操作している様子: select から選ぶ、トーストを積み重ねる、日付を選ぶ" width="720"></p>

ライブデモ: <https://pualgao230113-sys.github.io/playwright-element-plus-recipes/>

Element Plus および Playwright とは無関係です。名前は、このプロジェクトが何をテストしているかを説明するためだけに使っています。

## クイックスタート

```bash
git clone https://github.com/pualgao230113-sys/playwright-element-plus-recipes.git
cd playwright-element-plus-recipes
npm ci
npx playwright install chromium   # first time only
npm test                          # starts the demo app on :5179 and runs every recipe
```

| スクリプト | 内容 |
|---|---|
| `npm run dev` | デモアプリ（<http://localhost:5179>）、レシピごとに 1 ページ |
| `npm test` | Playwright のフルスイート（headless Chromium、worker 1 つ） |
| `npm run test:ui` | Playwright の UI モード。1 つのレシピをステップ実行するときに使う |
| `npm run typecheck` | アプリ、spec、ヘルパーを型チェックする |
| `npm run build` | デモアプリを `dist/` にビルドする |
| `npm run build:helpers` | `playwright-element-plus` パッケージを `packages/playwright-element-plus/dist/` にビルドする |

## 自分のプロジェクトでヘルパーを使う

```bash
npm i -D playwright-element-plus
```

プロジェクトには `@playwright/test` が先に入っている必要があります。peer dependency で、1.63 でテストしています。

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

ESM と CommonJS のどちらのテストプロジェクトからでも使えて、型も付いてきます。すべてのヘルパーは例付きで [docs/helpers.md](docs/helpers.md) に載っています。パッケージ自体の README は [packages/playwright-element-plus/README.md](packages/playwright-element-plus/README.md) です。依存を増やしたくない場合は、[`packages/playwright-element-plus/src/index.ts`](packages/playwright-element-plus/src/index.ts) を自分のプロジェクトにコピーしてください。import しているのは `@playwright/test` だけです。

### GitHub から最新版をインストールする

`main` に入っていて、まだ npm に出ていない変更を使いたいときだけ必要です。

```bash
npm i -D github:pualgao230113-sys/playwright-element-plus-recipes
```

この方法ではリポジトリが `playwright-element-plus-recipes` という名前でインストールされるので、import 元も `'playwright-element-plus-recipes'` にしてください。インストール時に npm がヘルパーをビルドする（リポジトリの `prepare` スクリプト）ので、初回のインストールには 1 分ほどかかります。

pnpm は依存パッケージのビルドスクリプトをブロックするので、先に `pnpm-workspace.yaml` でこのパッケージを許可してください。pnpm 11 の場合:

```yaml
allowBuilds:
  playwright-element-plus-recipes: true
```

pnpm 10 の場合は、pnpm が `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` エラーで表示するエントリを `onlyBuiltDependencies` に追加します。git 依存ではエントリにコミットが含まれるので、更新するたびに変わります。

## レシピ

落とし穴にはそれぞれ **Common**（よくある: そのコンポーネントを使うほとんどのアプリで起きる）か **Specific**（特定条件: 括弧内のオプションやバージョンのときだけ起きる）の印を付けています。どれもリンク先の spec のテストで再現しています。

ほぼどのページでも出てくる問題が 1 つあります。これは Element Plus ではなく Playwright の挙動です: アクセシブルネームはデフォルトで部分一致になります。`getByRole('option', { name: 'Apple' })` は "Pineapple" も見つけ、`getByRole('button', { name: 'Delete' })` は "Delete book" ボタンも見つけます。`exact: true` かアンカー付きの RegExp を渡し、同じテキストが 2 回出てくるときはグループ、ダイアログ、メニューにスコープを絞ってください。spec では、select（[01](tests/01-select.spec.ts)）、ラジオグループ（[03](tests/03-checkbox-radio-switch.spec.ts)）、ダイアログ（[05](tests/05-dialog-drawer-messagebox.spec.ts)）、ツリー（[11](tests/11-tree.spec.ts)）、タブ（[16](tests/16-tabs.spec.ts)）、メニュー（[18](tests/18-dropdown.spec.ts)）、collapse の項目（[21](tests/21-collapse.spec.ts)）でこれを示しています。ヘルパーは完全一致の名前を使います。

| # | コンポーネント | 落とし穴 | 対処 | Spec |
|---|---|---|---|---|
| 01 | `el-select` | **Common:** 選択肢は select の中ではなく `<body>` に teleport される。<br>**Common:** filterable でない select（デフォルト）では、combobox の `<input>` をクリックすると placeholder にクリックを奪われる。filterable な select の input はクリックできる。ただし 2.13.3–2.14.1 では、こちらも placeholder にクリックを奪われる。<br>**Common:** `multiple` の select は、選ぶたびに開いたままになる。<br>**Specific** (`remote`): 最初の結果が届くまでドロップダウンは非表示のまま。 | `.el-select` のルートをクリックする。`aria-controls` をたどって、その select の listbox を見つける。複数選択の後は Escape を押す。固定時間ではなく、選択肢が出るのを待つ。 | [01-select](tests/01-select.spec.ts) |
| 02 | `ElMessage` | **Common:** トーストは積み重なるので、`getByRole('alert')` が古いトーストにも当たる。<br>**Common:** `toHaveCount(0)` は、一度表示されてフェードアウトしたトーストでもパスする。 | トーストは完全一致のテキストでマッチさせる。同じ操作を繰り返す前に `drainMessages()` を呼ぶ。「トーストが出ない」ことを証明するには、操作の前に `recordMessages()` を開始する。 | [02-message](tests/02-message.spec.ts) |
| 03 | `el-checkbox` / `el-radio` / `el-switch` | **Common:** 本物の input は非表示: `check()` はタイムアウトし、`force` を付けると "outside of the viewport" で失敗する。<br>**Specific** (`active-text` / `inactive-text`): スイッチのテキストは値をセットせず、トグルする。<br>**Specific** (`el-form-item` 内のスイッチをラベル経由でクリック): ネイティブの `checked` と `aria-checked` が食い違う。 | `setChecked()` ヘルパーを使う。これはチェックボックスの `label.el-checkbox` に対して Playwright の `setChecked()` を呼ぶ（普通のチェックボックスのみで、`el-checkbox-button` は対象外）。ラジオは、`radiogroup` 内の `<label>` に対して Playwright の `check()` を呼ぶ。スイッチの状態は `toBeChecked()` ではなく `aria-checked` から読む。 | [03-checkbox-radio-switch](tests/03-checkbox-radio-switch.spec.ts) |
| 04 | `el-date-picker` | **Common:** `format`（表示）と `value-format`（保存）は別物。<br>**Common:** 入力したテキストは Enter か blur のときにしか model に反映されない。<br>**Common:** グリッド内で日付の数字が重複する（翌月の最初の数日も表示されるため）。<br>**Common:** カレンダーは今日の日付で開くので、日付のクリックは実行日に左右される。<br>**Specific** (`value-format` なし、UTC より東のタイムゾーン): 日付が前日としてシリアライズされる。<br>**Specific** (入力、2.14.4+): 解析が緩い: `3/4/2026` は 3 月 4 日に、`31/02/2026` は 3 月 3 日になり、`15/3/2026` は拒否されて古い値が残る。 | 表示フォーマットで入力し、input と model の両方を確認する。`page.clock` で時計を固定する。`td.available` のセルだけを選ぶ。アプリ側で `value-format` を設定する。 | [04-date-picker](tests/04-date-picker.spec.ts) |
| 05 | `el-dialog` / `el-drawer` / `ElMessageBox` | **Common:** 閉じたダイアログも DOM に残る。<br>**Common:** メッセージボックスは `#app` の外に描画される。<br>**Specific** (スクロールロックをアサートする場合): ロックは `<body>` の class で、ダイアログが閉じ終わってから外される。 | `getByRole('dialog', { name })` でスコープを絞る。`toHaveCount(0)` ではなく `toBeHidden()` をアサートする。body の class はリトライする `expect` で確認する。 | [05-dialog-drawer-messagebox](tests/05-dialog-drawer-messagebox.spec.ts) |
| 06 | `el-table` | **Common:** `getByRole('row')` はヘッダー行も数える。また、ヘッダーは別の `<table>` になっている。<br>**Common:** 空データのテキストは、ローディングマスクの下ですでに表示されている。<br>**Specific** (ソート可能な列、2.13.0+): "Sort by X" ボタンはいきなり降順になり、もう一度クリックするとソートが解除される。 | `.el-loading-mask` が消えるのを待つ。`tbody tr.el-table__row` を数える。列には自分で `class-name` を付け、セルから行を探す。ヘッダーセルをクリックして順に切り替えるか、キャレットをクリックして直接指定し、`aria-sort` を確認する。 | [06-table](tests/06-table.spec.ts) |
| 07 | `el-form` | **Common:** `trigger: 'blur'` のルールは、フィールドがフォーカスを失うまで何もしない。<br>**Common:** 必須のアスタリスクはアクセシブルネームの一部になる（`"* Username"`）。<br>**Specific** (非同期バリデーター): バリデーターが答えを返す前に「エラーなし」がパスしてしまう。 | Tab を押して blur させる。`is-success` / `is-validating` を待つ。名前はアンカー付きの RegExp でマッチさせる（`/Username$/`）。 | [07-form-validation](tests/07-form-validation.spec.ts) |
| 08 | `el-input` | **Specific** (`maxlength`): `fill()` で入力した内容をブラウザが切り詰める。<br>**Specific** (`clearable`): input にホバーするまで、クリアアイコンはクリックできない。<br>**Specific** (`@clear`): `fill('')` では `clear` が emit されない。 | 切り詰められた値とカウンターをアサートする。クリアをクリックする前にホバーする。アプリが `@clear` に依存しているなら、アイコンをクリックする。 | [08-input](tests/08-input.spec.ts) |
| 09 | ポッパーとビューポート | **Common:** 下に余裕がないとドロップダウンはトリガーの上に開くので、結果がウィンドウの高さに左右される。 | 設定でビューポートを固定し、座標ではなく locator を使い、どちら側に出るかが重要なら `data-popper-placement` を確認する。 | [09-viewport-popper](tests/09-viewport-popper.spec.ts) |
| 10 | `el-cascader` | **Common:** input は combobox ではなく `textbox` で、`aria-controls` もない。パネルとは wrapper の `aria-describedby` でしかつながっておらず、それも開いている間だけ。<br>**Common:** 親をクリックすると次の列が開くが、model は変わらない。変わるのは leaf をクリックしたときで、そのときパネルも閉じる。<br>**Common:** input にはラベル（`Fruit / Citrus / Lemon`）が表示され、model には値が入る。<br>**Specific** (`checkStrictly`): 親のラベルをクリックしても展開されるだけ。ラジオの方をクリックする。<br>**Specific** (`filterable`): 結果はメニュー項目ではなく、フルパスが並んだただのリスト。<br>**Specific** (`multiple`): パネルは開いたままで、親をチェックするとその leaf がすべて追加される。 | `openCascader()` / `pickCascaderPath()` を使う。input と model の両方をアサートする。 | [10-cascader](tests/10-cascader.spec.ts) |
| 11 | `el-tree` / `el-tree-select` | **Common:** 子ノードは、親が一度展開されるまで描画されない。<br>**Common:** tree-select では、親をクリックすると選択されずに展開される。<br>**Specific** (`show-checkbox`): ノードのテキストをクリックすると展開されるだけで、チェックはされない。<br>**Specific** (`show-checkbox`、一部の子だけチェック済み): 親の treeitem は `aria-checked="false"` になる。indeterminate になるのはチェックボックスだけで、`getCheckedKeys()` にも含まれない。<br>**Specific** (チェックボックス付きの `multiple` tree-select): model には leaf のキーしか入らない。 | 先に展開し（`expandTreeNode()`）、チェックはチェックボックスのラベル経由で行い（`setTreeChecked()`）、チェックボックスに対して `toBeChecked({ indeterminate: true })` をアサートする。 | [11-tree](tests/11-tree.spec.ts) |
| 12 | `el-autocomplete` | **Common:** 名前の付いた要素は `textbox` で、`combobox` role は名前のない wrapper に付いている。<br>**Common:** debounce が走るまで前の候補が画面に残るので、"option X" を待つと古いリストでパスしてしまうことがある。<br>**Common:** 何もハイライトされていない状態で Enter を押しても何も選ばれない: model は入力したテキストのままで、`select` は発火しない。<br>**Common:** 候補を最後まで入力しても、それを選んだことにはならない。 | listbox は textbox の `aria-controls` からたどる（2.13.1+）。`toHaveText([...])` で新しいリスト全体を待ってからクリックする。`select` が発火したことを確認し、input も確認する。 | [12-autocomplete](tests/12-autocomplete.spec.ts) |
| 13 | `el-input-number` | **Common:** model は入力に追従するが、`change` は blur か Enter のときにしか発火しない。<br>**Common:** どのフィールドにも "increase number" / "decrease number" という名前のボタンがあり、上限・下限では `is-disabled` class が付くだけなので、`toBeDisabled()` は失敗する。<br>**Specific** (`min` / `max`): 上限 10 のフィールドに 25 と入力すると、model はもう 10 なのに表示は "25" のまま。<br>**Specific** (フィールドを空にする): model は `min` ではなく空になる。<br>**Specific** (`precision` / `step-strictly`): 値は確定時に丸められる（2.345 は 2.35 に、step 6 なら 10 は 12 に）。 | Tab で確定させ（`setInputNumber()`）、その後フィールドに表示される値をアサートする。ボタンはそのフィールドにスコープを絞り（`inputNumberButton()`）、class を確認する。 | [13-input-number](tests/13-input-number.spec.ts) |
| 14 | `el-time-picker` / `el-time-select` | **Common:** ピッカーを開くと、現在時刻が input と model に書き込まれる。Escape や外側のクリックではそのまま残り、元の値に戻るのは Cancel だけ。<br>**Common:** 列の見えている範囲の外にあるスピナー項目はクリックできない: アクティブな項目がクリックを奪う。<br>**Common:** `el-time-select` は time picker ではなく `el-select`。<br>**Specific** (入力): 解析が緩い: `7:5` は 07:05 に、`25:99` は 02:39 になる。 | 時計を固定する。時刻を入力して Enter を押す（`typeTime()`）。time-select には select 用のヘルパーを使う。 | [14-time-picker](tests/14-time-picker.spec.ts) |
| 15 | `el-upload` | **Common:** 本物の `<input type="file">` は `display: none`。直接それに `setInputFiles()` を呼ぶ。<br>**Common:** `accept` は `setInputFiles()` を止めないので、種類をチェックするのは `before-upload` だけ。<br>**Common:** サーバーがないとリクエストが失敗し、ファイルがリストから消える。<br>**Common:** リストの各項目には非表示の "press delete to remove" というヒントも入っていて、`toHaveText()` はそれも含める。<br>**Specific** (2.11.7+): トリガーの名前が 2 つのボタンにマッチする。<br>**Specific** (メモリ上のファイル): 渡した `mimeType` が、そのまま `before-upload` で `file.type` として見える。<br>**Specific** (`limit`): 超過分のファイルは `on-exceed` に回る。例外は出ない。<br>**Specific** (`multiple` なし): 複数のファイルを渡して `setInputFiles()` を呼ぶと例外になる。 | `uploadInput()` と `fakeUploadEndpoint()` を使う。ファイル名は `uploadedFileNames()` でアサートする。大きなファイルはテスト内で buffer として作る。 | [15-upload](tests/15-upload.spec.ts) |
| 16 | `el-tabs` | **Common:** 非アクティブなペインも DOM にあり、隠れているだけ。<br>**Specific** (`lazy`): タブを開くまでペインは DOM になく、一度開くと残る。<br>**Specific** (無効なタブ): `is-disabled` class が付くだけ。クリックは通るが何も起きない。 | `getByRole('tabpanel', { name })` と `aria-selected` でアサートする。無効なタブは class を確認する。 | [16-tabs](tests/16-tabs.spec.ts) |
| 17 | `el-pagination` | **Common:** ページ番号はボタンではなく "page N" というラベルのリスト項目で、"page 1" は "page 10" にもマッチする。<br>**Specific** (`jumper`): "Go to" は入力中は何もしない。Enter か blur で適用され、最後のページより大きい値は最後のページに丸められる。<br>**Specific** (`sizes`): ページサイズの select にはアクセシブルネームがなく、ページサイズを大きくすると別のページに移ることがある。 | `pageButton()` / `currentPage()` / `jumpToPage()` を使う。サイズの select には pagination のルートからたどる。 | [17-pagination](tests/17-pagination.spec.ts) |
| 18 | `el-dropdown` | **Common:** メニューは teleport される。トリガーの `aria-controls` がメニューを指している。閉じたメニューも DOM に残る。<br>**Common:** ホバーで開くメニューは、マウスが別の場所に動いた時点で閉じる。<br>**Specific** (`trigger="click"`): ホバーしても何も起きない。<br>**Specific** (無効な項目): クリックは待ち続けてタイムアウトする。代わりに `toBeDisabled()` をアサートする。<br>**Specific** (`split-button`): メニューは別の "Toggle Dropdown" ボタンから開く。 | `openDropdown()` / `dropdownCommand()` を使い、開いてから選ぶまでの間にマウスを動かさない。 | [18-dropdown](tests/18-dropdown.spec.ts) |
| 19 | `el-popconfirm` / `el-tooltip` | **Common:** popconfirm は `dialog` ではなく `role="tooltip"`。<br>**Common:** popconfirm の中身は開いている間だけ DOM にある。tooltip の中身も同じ（ホバーした後）。<br>**Specific** (キャンセル時に処理をするアプリ): `cancel` を発火するのはキャンセルボタンだけ。外側をクリックすると `cancel` なしで閉じる。Escape でも閉じるが、これも `cancel` なしで、フォーカスが popconfirm の中にあるときだけ。フォーカスが参照元のボタンにあるときは、Escape は何もしない。 | 参照元要素の `aria-describedby` をたどる（`answerPopconfirm()`）。tooltip をアサートする前にホバーし、`toHaveAccessibleDescription()` を確認する。 | [19-popconfirm-tooltip](tests/19-popconfirm-tooltip.spec.ts) |
| 20 | `ElNotification` | **Common:** 通知はトーストと同じく `role="alert"` で、積み重なる。<br>**Common:** 閉じる x は role のない `<i>`。<br>**Common:** 通知にホバーするとタイマーが止まる。<br>**Specific** (見出しをレベルで取得するページ): タイトルは `<h2>`。<br>**Specific** (種類をアサートする場合): 種類の class はボックスではなくアイコンに付いている。 | タイトルでマッチさせ（`notification()`）、`closeNotification()` で閉じ、`drainNotifications()` を使う。これは先にマウスをどけてくれる。 | [20-notification](tests/20-notification.spec.ts) |
| 21 | `el-collapse` | **Common:** 閉じた項目も中身が DOM に残る。<br>**Common:** ヘッダーのクリックはトグルなので、「開く」つもりのステップが、すでに開いている項目を閉じてしまう。<br>**Specific** (開いた直後のスクリーンショットやクリック): アニメーションの最初の 1 ピクセルから、中身は表示されている扱いになる。 | クリックする前に `aria-expanded` を確認し（`setCollapseItem()`）、アニメーションが終わるのを待つ。 | [21-collapse](tests/21-collapse.spec.ts) |

## 検証したバージョン

Vue 3.5.43、@playwright/test 1.63.0（Chromium headless shell）、Vite 8.3.3、Node.js 24。

下の各 Element Plus バージョンを個別にインストールし、それぞれでスイート全体（111 テスト）を実行しました。バージョン間で挙動が変わった箇所では、spec は理由にバージョンを書いてスキップするか、バージョンごとに正しい値をアサートします。CI ではサポート対象の 3 バージョンを実行しています。

| Element Plus | 結果 | メモ |
|---|---|---|
| 2.14.7 | 111 件成功 | すべてのレシピが当てはまる。 |
| 2.13.7 | 109 件成功、2 件スキップ | 緩い日付解析はまだない（04）。input のカウンターに `role="status"` がない（08）。 |
| 2.9.11 | 104 件成功、7 件スキップ | 上記に加えて、テーブルに "Sort by" ボタンと `aria-sort` がない（06）。autocomplete の `aria-controls` が listbox を指していない（12）。 |
| 2.7.8 | 非対応: 13 件失敗、7 件スキップ | 日付・時刻ピッカーの input に `combobox` role がないので、ヘルパーが何も見つけられない。また、filterable な select の placeholder がまだ input へのクリックを遮る（01）。外側をクリックしても popconfirm が閉じない（19）。 |
| 2.4.4 | 非対応: 19 件失敗、7 件スキップ | 2.7.8 と同じ日付ピッカー、時刻ピッカー、popconfirm の失敗に加えて、select、checkbox / radio、dialog、tree-select、pagination でさらに 7 件失敗する（例えば、select の placeholder が input へのクリックをまったく遮らない）。 |

それぞれの変更がどのバージョンで入ったかの一覧です。自分のバージョンにどのメモが当てはまるかを判断するのに使ってください。

| バージョン | 変更 | レシピ |
|---|---|---|
| 2.11.7 | upload のトリガーの wrapper に `role="button"` が付き、トリガーの名前が 2 つのボタンにマッチするようになる。 | 15 |
| 2.12.0 | multiple select のタグの閉じるアイコンが "Close this tag" という名前のボタンになる。spec では `.el-tag__close` を使っていて、どのバージョンでも動く。 | 01 |
| 2.13.0 | ソート可能なヘッダーに `aria-sort` と "Sort by X" ボタンが付く。 | 06 |
| 2.13.1 | autocomplete の textbox の `aria-controls` が listbox を指すようになる。それより前は文字列そのままの `"id"`。 | 12 |
| 2.13.3–2.14.1 | filterable な select の input も placeholder にクリックを奪われる。2.14.2 で直った。 | 01 |
| 2.13.4 | 空の time picker で Cancel すると、model に `null` が残る。それより前は空文字列。 | 14 |
| 2.14.0 | input のクリアアイコンが、非表示の間も DOM に残る。それより前はホバー時にだけ描画される。どちらにしても先にホバーする。 | 08 |
| 2.14.4 | 入力した日付が緩く解析される（`3/4/2026` は 3 月 4 日になる）。それより前は `3/4/2026` は拒否される。 | 04 |
| 2.14.5 | 文字数カウンターに `role="status"` が付く。それより前は `.el-input__count` を使う。 | 08 |

## 制限と既知の違い

- Chromium のみです。Firefox や WebKit ではレシピを実行していません。
- これらの挙動のほとんどは Element Plus の実装の詳細で、ドキュメント化された API ではありません。アップグレード後にレシピが失敗し始めたら、何かが変わったということです。自分のテストを書き直す前に、レシピを確認してください。
- ヘルパーは、デモアプリが表示する英語のテキスト（"increase number"、"page N"、"Yes" / "No"）でマッチします。アプリで別のロケールを使っている場合は、自分で名前を渡すか、ヘルパーを調整してください。
- デモページはわざと小さくしてあります。実際のアプリには独自のタイミング（API 呼び出し、自前のトランジション）が加わるので、時間ではなく結果を待つ書き方を続けてください。

## コントリビュート

[CONTRIBUTING.md](CONTRIBUTING.md) を見てください。大事なルールは 1 つです: 落とし穴を追加できるのは、本物のライブラリに対してテストで再現できたものだけです。

## ライセンス

[MIT](LICENSE) © 2026 Paul Gao

## 翻訳について

基準は英語の README です。翻訳の修正は pull request で歓迎します。
