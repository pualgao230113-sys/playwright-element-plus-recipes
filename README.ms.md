# playwright-element-plus-recipes

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md) | **Bahasa Melayu** | [हिन्दी](README.hi.md)

[![Tests](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml/badge.svg)](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/actions/workflows/test.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://pualgao230113-sys.github.io/playwright-element-plus-recipes/)

Komponen Element Plus buat beberapa perkara yang merosakkan ujian Playwright dengan cara yang mengelirukan: dropdown dipaparkan di tempat lain dalam halaman, input tersembunyi, toast yang bertindan, nilai yang hanya disimpan semasa blur. Repo ini ada aplikasi demo kecil dengan satu halaman bagi setiap komponen, satu spec Playwright bagi setiap komponen yang menunjukkan masalah itu berlaku, dan satu fail helper yang boleh anda guna dalam ujian anda sendiri.

<p align="center"><img src="docs/demo.gif" alt="Playwright menggerakkan aplikasi demo: memilih daripada select, toast bertindan, memilih tarikh" width="720"></p>

Demo langsung: <https://pualgao230113-sys.github.io/playwright-element-plus-recipes/>

Tidak bergabung dengan Element Plus atau Playwright. Nama-nama ini digunakan hanya untuk menerangkan apa yang diuji oleh projek ini.

## Mula pantas

```bash
git clone https://github.com/pualgao230113-sys/playwright-element-plus-recipes.git
cd playwright-element-plus-recipes
npm ci
npx playwright install chromium   # first time only
npm test                          # starts the demo app on :5179 and runs every recipe
```

| Skrip | Fungsi |
|---|---|
| `npm run dev` | Aplikasi demo di <http://localhost:5179>, satu halaman bagi setiap resipi |
| `npm test` | Suite Playwright penuh (headless Chromium, 1 worker) |
| `npm run test:ui` | Mod UI Playwright, untuk meneliti satu resipi langkah demi langkah |
| `npm run typecheck` | Menyemak jenis (type-check) aplikasi, spec dan helper |
| `npm run build` | Membina aplikasi demo ke dalam `dist/` |
| `npm run build:helpers` | Membina pakej `playwright-element-plus` ke dalam `packages/playwright-element-plus/dist/` |

## Guna helper dalam projek anda sendiri

```bash
npm i -D playwright-element-plus
```

Projek anda perlu sudah ada `@playwright/test`; ia ialah peer dependency, diuji dengan 1.63.

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

Ia berfungsi dalam projek ujian ESM dan CommonJS, dan type disertakan sekali. Setiap helper disenaraikan bersama contoh dalam [docs/helpers.md](docs/helpers.md). README pakej itu sendiri ialah [packages/playwright-element-plus/README.md](packages/playwright-element-plus/README.md). Jika anda tidak mahu menambah dependency, salin [`packages/playwright-element-plus/src/index.ts`](packages/playwright-element-plus/src/index.ts) ke dalam projek anda. Fail itu hanya mengimport `@playwright/test`.

### Pasang dari GitHub sebagai ganti

```bash
npm i -D github:pualgao230113-sys/playwright-element-plus-recipes
```

Ini memasang repo di bawah nama `playwright-element-plus-recipes`, jadi import daripada `'playwright-element-plus-recipes'` sebagai ganti. npm membina helper semasa pemasangan (skrip `prepare` repo ini), jadi pemasangan kali pertama ambil masa kira-kira seminit.

pnpm menyekat skrip build bagi dependency, jadi benarkan yang ini dalam `pnpm-workspace.yaml` dahulu. Dengan pnpm 11:

```yaml
allowBuilds:
  playwright-element-plus-recipes: true
```

Dengan pnpm 10, tambah entri yang dicetak oleh pnpm dalam ralat `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` ke dalam `onlyBuiltDependencies`. Bagi git dependency, entri itu termasuk commit, jadi ia berubah apabila anda mengemas kini.

## Resipi

Setiap perangkap ditanda **Common** (biasa: kebanyakan aplikasi yang menggunakan komponen itu akan terkena) atau **Specific** (khusus: hanya dengan pilihan atau versi dalam kurungan). Setiap satu dihasilkan semula oleh ujian dalam spec yang dipautkan.

Satu perkara muncul hampir di setiap halaman, dan ia datang daripada Playwright, bukan Element Plus: accessible name dipadankan mengikut substring secara lalai. `getByRole('option', { name: 'Apple' })` turut menemui "Pineapple", dan `getByRole('button', { name: 'Delete' })` turut menemui butang "Delete book". Beri `exact: true` atau RegExp berlabuh, dan hadkan skop kepada kumpulan, dialog atau menu apabila teks yang sama muncul dua kali. Spec menunjukkannya untuk select ([01](tests/01-select.spec.ts)), kumpulan radio ([03](tests/03-checkbox-radio-switch.spec.ts)), dialog ([05](tests/05-dialog-drawer-messagebox.spec.ts)), tree ([11](tests/11-tree.spec.ts)), tab ([16](tests/16-tabs.spec.ts)), menu ([18](tests/18-dropdown.spec.ts)) dan item collapse ([21](tests/21-collapse.spec.ts)). Helper menggunakan nama yang tepat.

| # | Komponen | Perangkap | Apa yang perlu dibuat | Spec |
|---|---|---|---|---|
| 01 | `el-select` | **Common:** pilihan di-teleport ke `<body>`, bukan dipaparkan di dalam select.<br>**Common:** pada select yang tidak filterable (lalai), klik pada `<input>` combobox dipintas oleh placeholder. Input select yang filterable boleh diklik, kecuali dalam 2.13.3–2.14.1, di mana ia juga dipintas oleh placeholder.<br>**Common:** select `multiple` kekal terbuka selepas setiap pilihan.<br>**Specific** (`remote`): dropdown kekal tersembunyi sehingga hasil pertama tiba. | Klik akar `.el-select`. Ikut `aria-controls` ke listbox milik select itu. Tekan Escape selepas memilih beberapa pilihan. Tunggu pilihan itu, bukan masa yang tetap. | [01-select](tests/01-select.spec.ts) |
| 02 | `ElMessage` | **Common:** toast bertindan, jadi `getByRole('alert')` turut terkena toast yang lebih lama.<br>**Common:** `toHaveCount(0)` juga lulus bagi toast yang sempat muncul lalu pudar. | Padankan toast dengan teks yang tepat. Panggil `drainMessages()` sebelum mengulangi tindakan. Untuk membuktikan "tiada toast", mulakan `recordMessages()` sebelum tindakan. | [02-message](tests/02-message.spec.ts) |
| 03 | `el-checkbox` / `el-radio` / `el-switch` | **Common:** input sebenar disembunyikan: `check()` tamat masa dan `force` gagal dengan "outside of the viewport".<br>**Specific** (`active-text` / `inactive-text`): teks switch menogol, bukan menetapkan nilai.<br>**Specific** (switch dalam `el-form-item`, diklik melalui labelnya): `checked` asli tidak sepadan dengan `aria-checked`. | Guna helper `setChecked()`. Ia memanggil `setChecked()` Playwright pada `label.el-checkbox` milik checkbox itu (checkbox biasa, bukan `el-checkbox-button`). Untuk radio, panggil `check()` Playwright pada `<label>`-nya di dalam `radiogroup`. Baca keadaan switch daripada `aria-checked`, bukan `toBeChecked()`. | [03-checkbox-radio-switch](tests/03-checkbox-radio-switch.spec.ts) |
| 04 | `el-date-picker` | **Common:** `format` (yang dipaparkan) dan `value-format` (yang disimpan) ialah dua perkara berbeza.<br>**Common:** teks yang ditaip hanya sampai ke model semasa Enter atau blur.<br>**Common:** nombor hari berulang dalam grid (hari-hari awal bulan berikutnya turut dipaparkan).<br>**Common:** kalendar dibuka pada hari ini, jadi klik hari bergantung pada tarikh.<br>**Specific** (tanpa `value-format`, zon waktu di timur UTC): tarikh disirikan sebagai hari sebelumnya.<br>**Specific** (menaip, 2.14.4+): penghuraian longgar: `3/4/2026` menjadi 4 Mac, `31/02/2026` menjadi 3 Mac, dan `15/3/2026` ditolak manakala nilai lama kekal. | Taip dalam format paparan, kemudian semak input dan model. Bekukan jam dengan `page.clock`. Pilih sel `td.available` sahaja. Tetapkan `value-format` dalam aplikasi. | [04-date-picker](tests/04-date-picker.spec.ts) |
| 05 | `el-dialog` / `el-drawer` / `ElMessageBox` | **Common:** dialog yang sudah ditutup kekal dalam DOM.<br>**Common:** kotak mesej dipaparkan di luar `#app`.<br>**Specific** (assert kunci tatal): kunci itu ialah class pada `<body>`, dibuang sebaik dialog selesai ditutup. | Hadkan skop dengan `getByRole('dialog', { name })`. Assert `toBeHidden()`, bukan `toHaveCount(0)`. Semak class pada body dengan `expect` yang mencuba semula. | [05-dialog-drawer-messagebox](tests/05-dialog-drawer-messagebox.spec.ts) |
| 06 | `el-table` | **Common:** `getByRole('row')` turut mengira baris header. Header juga ialah `<table>` yang berasingan.<br>**Common:** teks kosong sudah kelihatan di bawah loading mask.<br>**Specific** (lajur boleh isih, 2.13.0+): butang "Sort by X" terus melompat ke menurun, dan klik kedua mengosongkan isihan. | Tunggu `.el-loading-mask` tersembunyi. Kira `tbody tr.el-table__row`. Beri lajur `class-name` anda sendiri dan cari baris melalui sel. Klik sel header untuk berkitar, atau caret untuk menetapkan, dan semak `aria-sort`. | [06-table](tests/06-table.spec.ts) |
| 07 | `el-form` | **Common:** peraturan `trigger: 'blur'` tidak buat apa-apa sehingga medan hilang fokus.<br>**Common:** tanda bintang wajib ialah sebahagian daripada accessible name (`"* Username"`).<br>**Specific** (validator async): "tiada ralat" lulus sebelum validator memberi jawapan. | Tekan Tab untuk blur. Tunggu `is-success` / `is-validating`. Padankan nama dengan RegExp berlabuh (`/Username$/`). | [07-form-validation](tests/07-form-validation.spec.ts) |
| 08 | `el-input` | **Specific** (`maxlength`): pelayar memotong apa yang ditaip oleh `fill()`.<br>**Specific** (`clearable`): ikon clear tidak boleh diklik sehingga input di-hover.<br>**Specific** (`@clear`): `fill('')` tidak meng-emit `clear`. | Assert nilai yang dipotong dan pembilang. Hover sebelum klik clear. Klik ikon itu apabila aplikasi bergantung pada `@clear`. | [08-input](tests/08-input.spec.ts) |
| 09 | Popper dan viewport | **Common:** dropdown dibuka di atas pencetus apabila tiada ruang di bawah, jadi keputusan bergantung pada ketinggian tetingkap. | Tetapkan viewport dalam config, guna locator dan bukan koordinat, dan semak `data-popper-placement` apabila sisi itu penting. | [09-viewport-popper](tests/09-viewport-popper.spec.ts) |
| 10 | `el-cascader` | **Common:** input ialah `textbox`, bukan combobox, dan tiada `aria-controls`. Panel hanya dipautkan melalui `aria-describedby` pada pembalut, dan hanya semasa terbuka.<br>**Common:** klik pada induk membuka lajur seterusnya tetapi tidak mengubah model; klik pada daun yang mengubahnya, dan menutup panel.<br>**Common:** input memaparkan label (`Fruit / Citrus / Lemon`), model menyimpan nilai.<br>**Specific** (`checkStrictly`): klik label induk hanya mengembangkannya; klik radionya.<br>**Specific** (`filterable`): hasil ialah senarai biasa laluan penuh, bukan item menu.<br>**Specific** (`multiple`): panel kekal terbuka, dan menanda induk menambah semua daunnya. | Guna `openCascader()` / `pickCascaderPath()`. Assert input dan model. | [10-cascader](tests/10-cascader.spec.ts) |
| 11 | `el-tree` / `el-tree-select` | **Common:** nod anak tidak dipaparkan sehingga induk dikembangkan sekurang-kurangnya sekali.<br>**Common:** dalam tree-select, klik induk mengembangkannya dan bukan memilihnya.<br>**Specific** (`show-checkbox`): klik teks nod mengembangkannya, bukan menandanya.<br>**Specific** (`show-checkbox`, sebahagian anak ditanda): treeitem induk menyatakan `aria-checked="false"`; hanya checkbox-nya yang indeterminate, dan ia tiada dalam `getCheckedKeys()`.<br>**Specific** (tree-select `multiple` dengan checkbox): model hanya menyimpan key daun. | Kembangkan dahulu (`expandTreeNode()`), tanda melalui label checkbox (`setTreeChecked()`), dan assert `toBeChecked({ indeterminate: true })` pada checkbox. | [11-tree](tests/11-tree.spec.ts) |
| 12 | `el-autocomplete` | **Common:** elemen yang bernama ialah `textbox`; role `combobox` berada pada pembalut tanpa nama.<br>**Common:** cadangan sebelumnya kekal di skrin sehingga debounce berjalan, jadi menunggu "option X" boleh lulus pada senarai lama.<br>**Common:** Enter tanpa apa-apa yang diserlahkan tidak memilih apa-apa: model ialah teks yang ditaip dan `select` tidak pernah dicetuskan.<br>**Common:** menaip cadangan penuh tidak sama dengan memilihnya. | Cari listbox melalui `aria-controls` pada textbox (2.13.1+). Tunggu seluruh senarai baharu dengan `toHaveText([...])`, kemudian klik. Semak bahawa `select` dicetuskan, dan semak input juga. | [12-autocomplete](tests/12-autocomplete.spec.ts) |
| 13 | `el-input-number` | **Common:** model mengikut apa yang ditaip, tetapi `change` hanya dicetuskan semasa blur atau Enter.<br>**Common:** setiap medan ada butang bernama "increase number" / "decrease number", dan pada had ia hanya dapat class `is-disabled`, jadi `toBeDisabled()` gagal.<br>**Specific** (`min` / `max`): menaip 25 dalam medan max-10 memaparkan "25" sedangkan model sudah 10.<br>**Specific** (mengosongkan medan): model menjadi kosong, bukan `min`.<br>**Specific** (`precision` / `step-strictly`): nilai dibundarkan semasa disimpan (2.345 menjadi 2.35, 10 menjadi 12 dengan step 6). | Simpan dengan Tab (`setInputNumber()`) dan assert apa yang dipaparkan medan selepas itu. Hadkan skop butang kepada medan (`inputNumberButton()`) dan semak class. | [13-input-number](tests/13-input-number.spec.ts) |
| 14 | `el-time-picker` / `el-time-select` | **Common:** membuka picker menulis masa semasa ke dalam input dan model. Escape dan klik di luar mengekalkannya; hanya Cancel memulihkan nilai lama.<br>**Common:** item spinner di luar bahagian lajur yang kelihatan tidak boleh diklik: item aktif memintas klik.<br>**Common:** `el-time-select` ialah `el-select`, bukan time picker.<br>**Specific** (menaip): penghuraian longgar: `7:5` menjadi 07:05, `25:99` menjadi 02:39. | Bekukan jam. Taip masa dan tekan Enter (`typeTime()`). Guna helper select untuk time-select. | [14-time-picker](tests/14-time-picker.spec.ts) |
| 15 | `el-upload` | **Common:** `<input type="file">` sebenar ialah `display: none`; panggil `setInputFiles()` terus padanya.<br>**Common:** `accept` tidak menghalang `setInputFiles()`, jadi hanya `before-upload` yang menyemak jenis.<br>**Common:** tanpa pelayan, request gagal dan fail tercicir daripada senarai.<br>**Common:** setiap item senarai turut mengandungi petunjuk tersembunyi "press delete to remove", yang termasuk dalam `toHaveText()`.<br>**Specific** (2.11.7+): nama pencetus sepadan dengan dua butang.<br>**Specific** (fail dalam memori): `mimeType` yang anda beri ialah apa yang `before-upload` nampak sebagai `file.type`.<br>**Specific** (`limit`): fail berlebihan pergi ke `on-exceed`; tiada ralat dilempar.<br>**Specific** (tanpa `multiple`): `setInputFiles()` dengan beberapa fail melempar ralat. | Guna `uploadInput()` dan `fakeUploadEndpoint()`. Assert nama fail dengan `uploadedFileNames()`. Bina fail besar sebagai buffer dalam ujian. | [15-upload](tests/15-upload.spec.ts) |
| 16 | `el-tabs` | **Common:** pane yang tidak aktif ada dalam DOM, cuma tersembunyi.<br>**Specific** (`lazy`): pane tiada dalam DOM sehingga tab-nya dibuka, kemudian ia kekal.<br>**Specific** (tab dinyahdayakan): hanya ada class `is-disabled`; klik tetap berlaku dan tidak buat apa-apa. | Assert pada `getByRole('tabpanel', { name })` dan `aria-selected`. Semak class untuk tab yang dinyahdayakan. | [16-tabs](tests/16-tabs.spec.ts) |
| 17 | `el-pagination` | **Common:** nombor halaman ialah item senarai berlabel "page N", bukan butang, dan "page 1" turut sepadan dengan "page 10".<br>**Specific** (`jumper`): "Go to" tidak buat apa-apa semasa anda menaip; ia digunakan semasa Enter atau blur, dan dihadkan ke halaman terakhir.<br>**Specific** (`sizes`): select saiz halaman tiada accessible name, dan saiz halaman yang lebih besar boleh membawa anda ke halaman lain. | Guna `pageButton()` / `currentPage()` / `jumpToPage()`. Capai select saiz melalui akar pagination. | [17-pagination](tests/17-pagination.spec.ts) |
| 18 | `el-dropdown` | **Common:** menu di-teleport; `aria-controls` pada pencetus menunjuk kepadanya. Menu yang tertutup kekal dalam DOM.<br>**Common:** menu hover tertutup sebaik tetikus bergerak ke tempat lain.<br>**Specific** (`trigger="click"`): hover tidak buat apa-apa.<br>**Specific** (item dinyahdayakan): klik menunggu dan tamat masa; assert `toBeDisabled()` sebaliknya.<br>**Specific** (`split-button`): menu dibuka daripada butang "Toggle Dropdown" yang berasingan. | Guna `openDropdown()` / `dropdownCommand()`, dan jangan gerakkan tetikus antara membuka dan memilih. | [18-dropdown](tests/18-dropdown.spec.ts) |
| 19 | `el-popconfirm` / `el-tooltip` | **Common:** popconfirm ialah `role="tooltip"`, bukan `dialog`.<br>**Common:** kandungan popconfirm hanya ada dalam DOM semasa ia terbuka, begitu juga kandungan tooltip (selepas hover).<br>**Specific** (aplikasi yang bertindak semasa cancel): hanya butang cancel yang mencetuskan `cancel`. Klik di luar menutupnya tanpa `cancel`. Escape menutupnya, juga tanpa `cancel`, hanya apabila fokus berada di dalam popconfirm; dengan fokus pada butang rujukan, Escape tidak buat apa-apa. | Ikut `aria-describedby` pada rujukan (`answerPopconfirm()`). Hover sebelum assert tooltip, dan semak `toHaveAccessibleDescription()`. | [19-popconfirm-tooltip](tests/19-popconfirm-tooltip.spec.ts) |
| 20 | `ElNotification` | **Common:** notifikasi ialah `role="alert"` seperti toast, dan ia bertindan.<br>**Common:** x penutup ialah `<i>` tanpa role.<br>**Common:** hover pada notifikasi menjeda pemasanya.<br>**Specific** (halaman yang mencari heading mengikut tahap): tajuk ialah `<h2>`.<br>**Specific** (assert jenis): class jenis berada pada ikon, bukan kotak. | Padankan mengikut tajuk (`notification()`), tutup dengan `closeNotification()`, dan guna `drainNotifications()`, yang menggerakkan tetikus menjauh dahulu. | [20-notification](tests/20-notification.spec.ts) |
| 21 | `el-collapse` | **Common:** item yang tertutup mengekalkan kandungannya dalam DOM.<br>**Common:** klik header menogol, jadi langkah "buka" menutup item yang sudah terbuka.<br>**Specific** (screenshot atau klik sejurus selepas dibuka): kandungan dikira kelihatan dari piksel pertama animasi. | Semak `aria-expanded` sebelum klik (`setCollapseItem()`), dan tunggu animasi tamat. | [21-collapse](tests/21-collapse.spec.ts) |

## Versi yang diuji

Vue 3.5.43, @playwright/test 1.63.0 (Chromium headless shell), Vite 8.3.3, Node.js 24.

Setiap versi Element Plus di bawah dipasang secara berasingan dan seluruh suite dijalankan terhadapnya (111 ujian). Apabila sesuatu tingkah laku berubah antara versi, spec itu di-skip dengan versi dinyatakan dalam sebabnya, atau assert nilai yang betul bagi setiap versi. CI menjalankan tiga versi yang disokong.

| Element Plus | Keputusan | Nota |
|---|---|---|
| 2.14.7 | 111 lulus | Semua resipi terpakai. |
| 2.13.7 | 109 lulus, 2 di-skip | Belum ada penghuraian tarikh longgar (04), tiada `role="status"` pada pembilang input (08). |
| 2.9.11 | 104 lulus, 7 di-skip | Juga: tiada butang "Sort by" atau `aria-sort` dalam jadual (06), dan `aria-controls` autocomplete tidak menunjuk kepada listbox-nya (12). |
| 2.7.8 | Tidak disokong: 13 gagal, 7 di-skip | Input date picker dan time picker tiada role `combobox`, jadi helper-nya tidak menemui apa-apa. Selain itu, placeholder select yang filterable masih menghalang klik pada inputnya (01), dan klik di luar tidak menutup popconfirm (19). |
| 2.4.4 | Tidak disokong: 19 gagal, 7 di-skip | Kegagalan date picker, time picker dan popconfirm yang sama seperti 2.7.8, ditambah 7 lagi pada select, checkbox / radio, dialog, tree-select dan pagination (contohnya, placeholder select langsung tidak menghalang klik pada inputnya). |

Di mana setiap perubahan berlaku, supaya anda tahu nota mana yang terpakai pada versi anda:

| Dari | Perubahan | Resipi |
|---|---|---|
| 2.11.7 | Pembalut pencetus upload mendapat `role="button"`, jadi nama pencetus sepadan dengan dua butang. | 15 |
| 2.12.0 | Ikon tutup tag dalam select multiple menjadi butang bernama "Close this tag". Spec menggunakan `.el-tag__close`, yang berfungsi dalam setiap versi. | 01 |
| 2.13.0 | Header boleh isih mendapat `aria-sort` dan butang "Sort by X". | 06 |
| 2.13.1 | `aria-controls` pada textbox autocomplete menunjuk kepada listbox. Sebelum ini, ia ialah rentetan literal `"id"`. | 12 |
| 2.13.3–2.14.1 | Input select yang filterable juga dipintas oleh placeholder. Dibaiki dalam 2.14.2. | 01 |
| 2.13.4 | Cancel pada time picker kosong meninggalkan `null` dalam model. Sebelum ini, rentetan kosong. | 14 |
| 2.14.0 | Ikon clear input kekal dalam DOM semasa tersembunyi. Sebelum ini, ia hanya dipaparkan semasa hover. Walau apa pun, hover dahulu. | 08 |
| 2.14.4 | Tarikh yang ditaip dihuraikan secara longgar (`3/4/2026` menjadi 4 Mac). Sebelum ini, `3/4/2026` ditolak. | 04 |
| 2.14.5 | Pembilang had perkataan mendapat `role="status"`. Sebelum ini, guna `.el-input__count`. | 08 |

## Had dan perbezaan yang diketahui

- Chromium sahaja. Resipi ini tidak dijalankan dalam Firefox atau WebKit.
- Kebanyakan tingkah laku ini ialah butiran pelaksanaan Element Plus, bukan API yang didokumenkan. Jika sesuatu resipi mula gagal selepas naik taraf, ada sesuatu yang berubah. Semak resipi itu sebelum menulis semula ujian anda sendiri.
- Helper memadankan teks bahasa Inggeris yang dipaparkan oleh aplikasi demo ("increase number", "page N", "Yes" / "No"). Jika aplikasi anda guna locale lain, beri nama anda sendiri atau ubah helper itu.
- Halaman demo sengaja dibuat kecil. Aplikasi sebenar menambah masanya sendiri (panggilan API, peralihan anda sendiri), jadi teruskan menunggu hasil, bukan masa.

## Menyumbang

Lihat [CONTRIBUTING.md](CONTRIBUTING.md). Peraturan utama: sesuatu perangkap hanya dimasukkan jika ada ujian yang menghasilkannya semula terhadap library sebenar.

## Lesen

[MIT](LICENSE) © 2026 Paul Gao

## Terjemahan

README bahasa Inggeris ialah rujukan. Pembetulan pada terjemahan dialu-alukan sebagai pull request.
