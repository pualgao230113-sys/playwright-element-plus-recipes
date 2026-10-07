# playwright-element-plus-recipes

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Tiếng Việt](README.vi.md) | **Bahasa Indonesia** | [Bahasa Melayu](README.ms.md) | [हिन्दी](README.hi.md)

Komponen Element Plus melakukan hal-hal yang membuat tes Playwright rusak dengan cara yang membingungkan: dropdown di-render di tempat lain di halaman, input tersembunyi, toast yang menumpuk, nilai yang baru tersimpan saat blur. Repo ini berisi aplikasi demo kecil dengan satu halaman per komponen, satu spec Playwright untuk tiap komponen yang memperlihatkan masalahnya terjadi, dan satu file helper yang bisa Anda pakai di tes Anda sendiri.

<p align="center"><img src="docs/demo.gif" alt="Playwright menjalankan aplikasi demo: memilih dari select, toast yang menumpuk, memilih tanggal" width="720"></p>

Demo langsung: <https://pualgao230113-sys.github.io/playwright-element-plus-recipes/> (belum aktif: akan tayang setelah repo dibuat publik dan GitHub Pages dinyalakan).

Tidak berafiliasi dengan Element Plus atau Playwright. Nama-nama tersebut hanya dipakai untuk menjelaskan apa yang diuji oleh proyek ini.

## Mulai cepat

```bash
git clone https://github.com/pualgao230113-sys/playwright-element-plus-recipes.git
cd playwright-element-plus-recipes
npm install
npx playwright install chromium   # first time only
npm test                          # starts the demo app on :5179 and runs every recipe
```

| Script | Fungsi |
|---|---|
| `npm run dev` | Aplikasi demo di <http://localhost:5179>, satu halaman per resep |
| `npm test` | Seluruh suite Playwright (headless Chromium, 1 worker) |
| `npm run test:ui` | Mode UI Playwright, praktis untuk menelusuri satu resep langkah demi langkah |
| `npm run typecheck` | Memeriksa tipe untuk aplikasi, spec, dan helper |
| `npm run build` | Mem-build aplikasi demo ke `dist/` |
| `npm run build:helpers` | Mem-build helper ke `dist-helpers/` |

## Pakai helper di proyek Anda sendiri

Instal dari GitHub. Paket ini tidak ada di npm.

```bash
npm i -D github:pualgao230113-sys/playwright-element-plus-recipes
```

npm mem-build helper saat instalasi (lewat script `prepare` milik paket), jadi instalasi pertama butuh sekitar satu menit. Proyek Anda harus sudah punya `@playwright/test`; paket itu adalah peer dependency, diuji dengan 1.63.

pnpm memblokir build script milik dependency, jadi izinkan paket ini dulu di `pnpm-workspace.yaml`. Dengan pnpm 11:

```yaml
allowBuilds:
  playwright-element-plus-recipes: true
```

Dengan pnpm 10, tambahkan entri yang dicetak pnpm di error `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` ke `onlyBuiltDependencies`. Untuk git dependency, entri itu menyertakan commit-nya, jadi entrinya berubah setiap kali Anda update.

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

Paket ini bisa dipakai dari proyek tes ESM maupun CommonJS, dan tipenya sudah disertakan. Semua helper tercantum beserta contohnya di [docs/helpers.md](docs/helpers.md). Jika tidak ingin menambah dependency, salin [`tests/helpers/element-plus.ts`](tests/helpers/element-plus.ts) ke proyek Anda. File itu hanya meng-import `@playwright/test`.

## Resep

Setiap jebakan ditandai **Common** (umum: sebagian besar aplikasi yang memakai komponen tersebut akan mengalaminya) atau **Specific** (khusus: hanya dengan opsi atau versi di dalam kurung). Masing-masing direproduksi oleh sebuah tes di spec yang ditautkan.

Ada satu hal yang muncul di hampir setiap halaman, dan itu dari Playwright, bukan Element Plus: secara default, accessible name dicocokkan sebagai substring. `getByRole('option', { name: 'Apple' })` juga menemukan "Pineapple", dan `getByRole('button', { name: 'Delete' })` juga menemukan tombol "Delete book". Berikan `exact: true` atau RegExp yang memakai anchor, dan batasi cakupan ke grup, dialog, atau menu jika teks yang sama muncul dua kali. Spec-spec ini memperlihatkannya untuk select ([01](tests/01-select.spec.ts)), radio group ([03](tests/03-checkbox-radio-switch.spec.ts)), dialog ([05](tests/05-dialog-drawer-messagebox.spec.ts)), tree ([11](tests/11-tree.spec.ts)), tab ([16](tests/16-tabs.spec.ts)), menu ([18](tests/18-dropdown.spec.ts)), dan collapse item ([21](tests/21-collapse.spec.ts)). Helper-nya memakai nama yang persis.

| # | Komponen | Jebakan | Yang perlu dilakukan | Spec |
|---|---|---|---|---|
| 01 | `el-select` | **Common:** opsi di-teleport ke `<body>`, tidak di-render di dalam select.<br>**Common:** pada select yang tidak filterable (default), klik pada `<input>` combobox dicegat oleh placeholder. Input pada select yang filterable bisa diklik.<br>**Common:** select `multiple` tetap terbuka setelah setiap pilihan.<br>**Specific** (`remote`): dropdown tetap tersembunyi sampai hasil pertama datang. | Klik root `.el-select`. Ikuti `aria-controls` ke listbox milik select tersebut. Tekan Escape setelah memilih beberapa opsi. Tunggu opsinya, bukan waktu tetap. | [01-select](tests/01-select.spec.ts) |
| 02 | `ElMessage` | **Common:** toast menumpuk, sehingga `getByRole('alert')` juga mengenai toast lama.<br>**Common:** `toHaveCount(0)` juga lulus untuk toast yang sempat muncul lalu memudar. | Cocokkan toast dengan teks yang persis. Panggil `drainMessages()` sebelum mengulang sebuah aksi. Untuk membuktikan "tidak ada toast", jalankan `recordMessages()` sebelum aksi. | [02-message](tests/02-message.spec.ts) |
| 03 | `el-checkbox` / `el-radio` / `el-switch` | **Common:** input aslinya tersembunyi: `check()` timeout dan `force` gagal dengan "outside of the viewport".<br>**Specific** (`active-text` / `inactive-text`): teks switch melakukan toggle, bukan mengatur nilai.<br>**Specific** (switch di dalam `el-form-item`, diklik lewat label-nya): `checked` native tidak sesuai dengan `aria-checked`. | Gunakan helper `setChecked()`. Helper ini memanggil `setChecked()` milik Playwright pada `label.el-checkbox` milik checkbox (checkbox biasa, bukan `el-checkbox-button`). Untuk radio, panggil `check()` milik Playwright pada `<label>`-nya di dalam `radiogroup`. Baca status switch dari `aria-checked`, bukan dengan `toBeChecked()`. | [03-checkbox-radio-switch](tests/03-checkbox-radio-switch.spec.ts) |
| 04 | `el-date-picker` | **Common:** `format` (yang ditampilkan) dan `value-format` (yang disimpan) adalah dua hal berbeda.<br>**Common:** teks yang diketik baru sampai ke model saat Enter atau blur.<br>**Common:** angka hari berulang di grid (hari-hari pertama bulan berikutnya juga ditampilkan).<br>**Common:** kalender terbuka di hari ini, jadi klik pada hari bergantung pada tanggal saat tes berjalan.<br>**Specific** (tanpa `value-format`, zona waktu di timur UTC): tanggal diserialisasi menjadi hari sebelumnya.<br>**Specific** (mengetik, 2.14.4+): parsing-nya longgar: `3/4/2026` menjadi 4 Maret, `31/02/2026` menjadi 3 Maret, dan `15/3/2026` ditolak sementara nilai lama tetap. | Ketik dalam format tampilan, lalu periksa input dan model-nya. Bekukan jam dengan `page.clock`. Pilih hanya sel `td.available`. Atur `value-format` di aplikasi. | [04-date-picker](tests/04-date-picker.spec.ts) |
| 05 | `el-dialog` / `el-drawer` / `ElMessageBox` | **Common:** dialog yang sudah ditutup tetap ada di DOM.<br>**Common:** message box di-render di luar `#app`.<br>**Specific** (saat meng-assert scroll lock): lock-nya berupa class pada `<body>`, yang dihapus setelah dialog selesai tertutup. | Batasi cakupan dengan `getByRole('dialog', { name })`. Assert `toBeHidden()`, bukan `toHaveCount(0)`. Periksa class body dengan `expect` yang melakukan retry. | [05-dialog-drawer-messagebox](tests/05-dialog-drawer-messagebox.spec.ts) |
| 06 | `el-table` | **Common:** `getByRole('row')` ikut menghitung baris header. Header-nya juga berupa `<table>` terpisah.<br>**Common:** teks data kosong sudah terlihat di bawah loading mask.<br>**Specific** (kolom yang bisa diurutkan, 2.13.0+): tombol "Sort by X" langsung melompat ke urutan menurun, dan klik kedua menghapus pengurutan. | Tunggu `.el-loading-mask` tersembunyi. Hitung `tbody tr.el-table__row`. Beri kolom `class-name` sendiri dan cari baris berdasarkan sel. Klik sel header untuk berganti urutan, atau klik caret untuk mengaturnya langsung, lalu periksa `aria-sort`. | [06-table](tests/06-table.spec.ts) |
| 07 | `el-form` | **Common:** aturan `trigger: 'blur'` tidak melakukan apa-apa sampai field kehilangan fokus.<br>**Common:** tanda bintang wajib ikut menjadi bagian dari accessible name (`"* Username"`).<br>**Specific** (validator async): pengecekan "tidak ada error" lulus sebelum validator memberi jawaban. | Tekan Tab untuk blur. Tunggu `is-success` / `is-validating`. Cocokkan nama dengan RegExp yang memakai anchor (`/Username$/`). | [07-form-validation](tests/07-form-validation.spec.ts) |
| 08 | `el-input` | **Specific** (`maxlength`): browser memotong apa yang diketik oleh `fill()`.<br>**Specific** (`clearable`): ikon clear tidak bisa diklik sampai input di-hover.<br>**Specific** (`@clear`): `fill('')` tidak meng-emit `clear`. | Assert nilai yang terpotong dan penghitungnya. Hover sebelum mengklik clear. Klik ikonnya jika aplikasi bergantung pada `@clear`. | [08-input](tests/08-input.spec.ts) |
| 09 | Popper dan viewport | **Common:** dropdown terbuka di atas pemicunya ketika ruang di bawah tidak cukup, sehingga hasilnya bergantung pada tinggi jendela. | Tetapkan viewport di config, gunakan locator alih-alih koordinat, dan periksa `data-popper-placement` ketika sisi bukaannya penting. | [09-viewport-popper](tests/09-viewport-popper.spec.ts) |
| 10 | `el-cascader` | **Common:** input-nya berupa `textbox`, bukan combobox, dan tidak punya `aria-controls`. Panel-nya hanya ditautkan lewat `aria-describedby` milik wrapper, dan hanya selama terbuka.<br>**Common:** klik pada parent membuka kolom berikutnya tetapi tidak mengubah model; klik pada leaf yang mengubahnya, dan menutup panel.<br>**Common:** input menampilkan label (`Fruit / Citrus / Lemon`), sedangkan model menyimpan value.<br>**Specific** (`checkStrictly`): klik pada label parent hanya membukanya; klik radio-nya.<br>**Specific** (`filterable`): hasilnya berupa daftar biasa berisi path lengkap, bukan menu item.<br>**Specific** (`multiple`): panel tetap terbuka, dan mencentang parent menambahkan semua leaf-nya. | Gunakan `openCascader()` / `pickCascaderPath()`. Assert input dan model-nya. | [10-cascader](tests/10-cascader.spec.ts) |
| 11 | `el-tree` / `el-tree-select` | **Common:** node anak tidak di-render sampai parent-nya pernah dibuka sekali.<br>**Common:** di tree-select, klik pada parent membukanya, bukan memilihnya.<br>**Specific** (`show-checkbox`): klik pada teks node akan membukanya, bukan mencentangnya.<br>**Specific** (`show-checkbox`, sebagian anak dicentang): treeitem parent bernilai `aria-checked="false"`; hanya checkbox-nya yang indeterminate, dan parent itu tidak ada di `getCheckedKeys()`.<br>**Specific** (tree-select `multiple` dengan checkbox): model hanya menyimpan key leaf. | Buka dulu (`expandTreeNode()`), centang lewat label checkbox (`setTreeChecked()`), dan assert `toBeChecked({ indeterminate: true })` pada checkbox. | [11-tree](tests/11-tree.spec.ts) |
| 12 | `el-autocomplete` | **Common:** elemen yang punya nama adalah `textbox`; role `combobox` ada di wrapper tanpa nama.<br>**Common:** saran sebelumnya tetap tampil sampai debounce berjalan, jadi menunggu "option X" bisa lulus pada daftar lama.<br>**Common:** Enter tanpa item yang di-highlight tidak memilih apa pun: model berisi teks yang diketik dan `select` tidak pernah terpicu.<br>**Common:** mengetik saran secara lengkap tidak sama dengan memilihnya. | Cari listbox lewat `aria-controls` milik textbox (2.13.1+). Tunggu seluruh daftar baru dengan `toHaveText([...])`, lalu klik. Periksa bahwa `select` terpicu, dan periksa juga input-nya. | [12-autocomplete](tests/12-autocomplete.spec.ts) |
| 13 | `el-input-number` | **Common:** model mengikuti ketikan, tetapi `change` hanya terpicu saat blur atau Enter.<br>**Common:** setiap field punya tombol bernama "increase number" / "decrease number", dan di batas nilai tombol itu hanya mendapat class `is-disabled`, sehingga `toBeDisabled()` gagal.<br>**Specific** (`min` / `max`): mengetik 25 ke field dengan max 10 menampilkan "25" padahal model sudah 10.<br>**Specific** (mengosongkan field): model menjadi kosong, bukan `min`.<br>**Specific** (`precision` / `step-strictly`): nilai dibulatkan saat commit (2.345 menjadi 2.35, 10 menjadi 12 dengan step 6). | Commit dengan Tab (`setInputNumber()`) dan assert apa yang ditampilkan field sesudahnya. Batasi tombol ke field-nya (`inputNumberButton()`) dan periksa class-nya. | [13-input-number](tests/13-input-number.spec.ts) |
| 14 | `el-time-picker` / `el-time-select` | **Common:** membuka picker menulis waktu saat ini ke input dan model. Escape dan klik di luar tetap mempertahankannya; hanya Cancel yang mengembalikan nilai lama.<br>**Common:** item spinner di luar bagian kolom yang terlihat tidak bisa diklik: item yang aktif mencegat kliknya.<br>**Common:** `el-time-select` adalah `el-select`, bukan time picker.<br>**Specific** (mengetik): parsing-nya longgar: `7:5` menjadi 07:05, `25:99` menjadi 02:39. | Bekukan jam. Ketik waktunya lalu tekan Enter (`typeTime()`). Gunakan helper select untuk time-select. | [14-time-picker](tests/14-time-picker.spec.ts) |
| 15 | `el-upload` | **Common:** `<input type="file">` yang asli bernilai `display: none`; panggil `setInputFiles()` langsung padanya.<br>**Common:** `accept` tidak menghentikan `setInputFiles()`, jadi hanya `before-upload` yang memeriksa tipe file.<br>**Common:** tanpa server, request gagal dan file hilang dari daftar.<br>**Common:** setiap item daftar juga berisi petunjuk tersembunyi "press delete to remove", yang ikut dihitung oleh `toHaveText()`.<br>**Specific** (2.11.7+): nama trigger cocok dengan dua tombol.<br>**Specific** (file di memori): `mimeType` yang Anda berikan adalah yang dilihat `before-upload` sebagai `file.type`.<br>**Specific** (`limit`): file berlebih masuk ke `on-exceed`; tidak ada yang throw.<br>**Specific** (tanpa `multiple`): `setInputFiles()` dengan beberapa file akan throw. | Gunakan `uploadInput()` dan `fakeUploadEndpoint()`. Assert nama file dengan `uploadedFileNames()`. Buat file besar sebagai buffer di dalam tes. | [15-upload](tests/15-upload.spec.ts) |
| 16 | `el-tabs` | **Common:** pane yang tidak aktif ada di DOM, hanya tersembunyi.<br>**Specific** (`lazy`): pane tidak ada di DOM sampai tab-nya dibuka, lalu tetap ada.<br>**Specific** (tab yang disabled): hanya berupa class `is-disabled`; kliknya tetap masuk dan tidak melakukan apa-apa. | Assert pada `getByRole('tabpanel', { name })` dan `aria-selected`. Periksa class untuk tab yang disabled. | [16-tabs](tests/16-tabs.spec.ts) |
| 17 | `el-pagination` | **Common:** nomor halaman berupa list item berlabel "page N", bukan tombol, dan "page 1" juga cocok dengan "page 10".<br>**Specific** (`jumper`): "Go to" tidak melakukan apa-apa selama Anda mengetik; nilainya diterapkan saat Enter atau blur, dan dibatasi ke halaman terakhir.<br>**Specific** (`sizes`): select ukuran halaman tidak punya accessible name, dan ukuran halaman yang lebih besar bisa memindahkan Anda ke halaman lain. | Gunakan `pageButton()` / `currentPage()` / `jumpToPage()`. Jangkau select ukuran lewat root pagination. | [17-pagination](tests/17-pagination.spec.ts) |
| 18 | `el-dropdown` | **Common:** menu di-teleport; `aria-controls` milik trigger menunjuk ke menu itu. Menu yang tertutup tetap ada di DOM.<br>**Common:** menu hover langsung tertutup begitu mouse pindah ke tempat lain.<br>**Specific** (`trigger="click"`): hover tidak melakukan apa-apa.<br>**Specific** (item yang disabled): klik akan menunggu lalu timeout; assert `toBeDisabled()` sebagai gantinya.<br>**Specific** (`split-button`): menu terbuka dari tombol "Toggle Dropdown" yang terpisah. | Gunakan `openDropdown()` / `dropdownCommand()`, dan jangan gerakkan mouse di antara membuka dan memilih. | [18-dropdown](tests/18-dropdown.spec.ts) |
| 19 | `el-popconfirm` / `el-tooltip` | **Common:** popconfirm adalah `role="tooltip"`, bukan `dialog`.<br>**Common:** isi popconfirm hanya ada di DOM selama terbuka, begitu juga isi tooltip (setelah di-hover).<br>**Specific** (aplikasi yang bereaksi pada cancel): hanya tombol cancel yang memicu `cancel`. Klik di luar menutupnya tanpa `cancel`. Escape menutupnya, juga tanpa `cancel`, hanya jika fokus ada di dalam popconfirm; jika fokus ada di tombol referensi, Escape tidak melakukan apa-apa. | Ikuti `aria-describedby` milik elemen referensi (`answerPopconfirm()`). Hover sebelum meng-assert tooltip, dan periksa `toHaveAccessibleDescription()`. | [19-popconfirm-tooltip](tests/19-popconfirm-tooltip.spec.ts) |
| 20 | `ElNotification` | **Common:** notifikasi adalah `role="alert"` seperti toast, dan menumpuk.<br>**Common:** tombol tutup x adalah `<i>` tanpa role.<br>**Common:** hover pada notifikasi menjeda timer-nya.<br>**Specific** (halaman yang mencari heading berdasarkan level): judulnya adalah `<h2>`.<br>**Specific** (saat meng-assert tipe): class tipe ada di ikon, bukan di kotaknya. | Cocokkan berdasarkan judul (`notification()`), tutup dengan `closeNotification()`, dan gunakan `drainNotifications()`, yang lebih dulu memindahkan mouse menjauh. | [20-notification](tests/20-notification.spec.ts) |
| 21 | `el-collapse` | **Common:** item yang tertutup tetap menyimpan isinya di DOM.<br>**Common:** klik pada header melakukan toggle, jadi langkah "buka item" justru menutup item yang sudah terbuka.<br>**Specific** (screenshot atau klik tepat setelah membuka): isinya dianggap visible sejak piksel pertama animasi. | Periksa `aria-expanded` sebelum mengklik (`setCollapseItem()`), dan tunggu animasinya selesai. | [21-collapse](tests/21-collapse.spec.ts) |

## Versi yang diuji

Vue 3.5.43, @playwright/test 1.63.0 (Chromium headless shell), Vite 8.3.3, Node.js 24.

Setiap versi Element Plus di bawah ini diinstal sendiri-sendiri dan seluruh suite dijalankan terhadapnya (109 tes). Jika suatu perilaku berubah antarversi, spec melakukan skip dengan versi disebut di alasannya, atau meng-assert nilai yang benar untuk tiap versi. CI menjalankan tiga versi yang didukung.

| Element Plus | Hasil | Catatan |
|---|---|---|
| 2.14.7 | 109 lulus | Terbaru saat tulisan ini dibuat. Semua resep berlaku. |
| 2.13.7 | 107 lulus, 2 di-skip | Belum ada parsing tanggal yang longgar (04), belum ada `role="status"` pada penghitung input (08). |
| 2.9.11 | 102 lulus, 7 di-skip | Selain itu: belum ada tombol "Sort by" atau `aria-sort` di tabel (06), dan `aria-controls` milik autocomplete tidak menunjuk ke listbox-nya (12). |
| 2.7.8 | Tidak didukung: 10 gagal | Input date picker dan time picker tidak punya role `combobox`, jadi helper-nya tidak menemukan apa pun. |
| 2.4.4 | Tidak didukung: 16 gagal | Sama seperti 2.7.8, ditambah 6 kegagalan lain di select, checkbox / radio, dialog, dan tree-select (misalnya placeholder select tidak menghalangi klik ke input). |

Kapan setiap perubahan terjadi, supaya Anda tahu catatan mana yang berlaku untuk versi Anda:

| Sejak | Perubahan | Resep |
|---|---|---|
| 2.11.7 | Wrapper trigger upload mendapat `role="button"`, jadi nama trigger cocok dengan dua tombol. | 15 |
| 2.12.0 | Ikon tutup tag di select multiple menjadi tombol bernama "Close this tag". Spec memakai `.el-tag__close`, yang berfungsi di semua versi. | 01 |
| 2.13.0 | Header yang bisa diurutkan mendapat `aria-sort` dan tombol "Sort by X". | 06 |
| 2.13.1 | `aria-controls` milik textbox autocomplete menunjuk ke listbox. Sebelumnya, nilainya string literal `"id"`. | 12 |
| 2.13.4 | Cancel pada time picker kosong meninggalkan `null` di model. Sebelumnya, string kosong. | 14 |
| 2.14.0 | Ikon clear pada input tetap ada di DOM saat tersembunyi. Sebelumnya, ikon itu hanya di-render saat hover. Apa pun versinya, hover dulu. | 08 |
| 2.14.4 | Tanggal yang diketik di-parse secara longgar (`3/4/2026` menjadi 4 Maret). Sebelumnya, `3/4/2026` ditolak. | 04 |
| 2.14.5 | Penghitung word-limit mendapat `role="status"`. Sebelumnya, gunakan `.el-input__count`. | 08 |

## Batasan dan perbedaan yang diketahui

- Hanya Chromium. Resep-resep ini belum dijalankan di Firefox atau WebKit.
- Sebagian besar perilaku ini adalah detail implementasi Element Plus, bukan API yang terdokumentasi. Jika sebuah resep mulai gagal setelah upgrade, berarti ada yang berubah. Periksa resepnya sebelum menulis ulang tes Anda sendiri.
- Helper mencocokkan teks bahasa Inggris yang ditampilkan aplikasi demo ("increase number", "page N", "Yes" / "No"). Jika aplikasi Anda memakai locale lain, berikan nama Anda sendiri atau sesuaikan helper-nya.
- Halaman demo sengaja dibuat kecil. Aplikasi sungguhan punya timing sendiri (panggilan API, transisi Anda sendiri), jadi tetap tunggu hasilnya, bukan waktunya.

## Kontribusi

Lihat [CONTRIBUTING.md](CONTRIBUTING.md). Aturan utamanya: sebuah jebakan hanya dimasukkan jika ada tes yang mereproduksinya pada library yang asli.

## Lisensi

[MIT](LICENSE) © 2026 Paul Gao

## Terjemahan

README selain bahasa Inggris dibuat dengan bantuan mesin. README bahasa Inggris adalah acuannya. Perbaikan dipersilakan lewat pull request.
