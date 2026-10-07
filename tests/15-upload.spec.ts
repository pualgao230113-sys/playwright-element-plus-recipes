/**
 * Recipe 15 - el-upload
 *
 * Pitfalls:
 *  1. The real <input type="file"> has `display: none`. Call setInputFiles()
 *     on it directly; Playwright allows that on a hidden file input.
 *  2. Since 2.11.7 the trigger is a button inside a wrapper that also has
 *     role="button" with the same name, so getByRole('button', { name })
 *     hits two elements.
 *  3. `accept` only filters the OS file dialog. setInputFiles() ignores it,
 *     so a .txt file reaches `before-upload` (and your server, if
 *     before-upload does not check).
 *  4. With an in-memory file, `mimeType` is what before-upload sees as
 *     `file.type`. A wrong mimeType makes a valid .png fail a type check.
 *  5. Without a server, the POST fails and the file is removed from the
 *     list. Fake the endpoint with page.route().
 *  6. Each list item also contains a hidden "press delete to remove" hint.
 *     toHaveText() on the item includes it; assert on the file-name span.
 *  7. `limit` does not block a pick: an extra file calls `on-exceed`.
 *  8. Without `multiple`, setInputFiles() with several files throws.
 */
import { expect, test } from '@playwright/test'
import { fakeUploadEndpoint, message, uploadedFileNames, uploadInput } from './helpers/element-plus'
import { epAtLeast } from './support/version'

const png = (name: string, size = 3) => ({ name, mimeType: 'image/png', buffer: Buffer.alloc(size, 1) })

test.beforeEach(async ({ page }) => {
  await page.goto('/upload')
})

test('the file input is hidden; set files on it anyway', async ({ page }) => {
  await fakeUploadEndpoint(page, '**/api/upload')
  const upload = page.locator('.el-upload')
  await expect(uploadInput(upload)).toBeHidden()

  await uploadInput(upload).setInputFiles(png('cover.png'))
  const item = page.locator('.el-upload-list__item.is-success')
  // Naive: the item text includes a hidden keyboard hint.
  await expect(item).toHaveText('cover.pngpress delete to remove')
  await expect(uploadedFileNames(page.getByRole('main'))).toHaveText(['cover.png'])
  await expect(page.getByTestId('uploaded')).toHaveText('cover.png')
})

test('the trigger name matches two buttons', async ({ page }) => {
  // The wrapper got role="button" in Element Plus 2.11.7.
  await expect(page.getByRole('button', { name: 'Choose cover' })).toHaveCount(epAtLeast('2.11.7') ? 2 : 1)

  // The file chooser route works too, if you click one of them.
  await fakeUploadEndpoint(page, '**/api/upload')
  const chooser = page.waitForEvent('filechooser')
  await page.locator('.el-upload > button').click()
  await (await chooser).setFiles({ name: 'chosen.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('jpg') })
  await expect(page.getByTestId('uploaded')).toHaveText('chosen.jpg')
})

test('accept does not stop setInputFiles; before-upload has to', async ({ page }) => {
  let requests = 0
  await page.route('**/api/upload', (route) => {
    requests++
    return route.fulfill({ json: { ok: true } })
  })
  await expect(uploadInput(page.locator('.el-upload'))).toHaveAttribute('accept', '.png,.jpg,.jpeg')

  await uploadInput(page.locator('.el-upload')).setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') })
  await expect(message(page, 'notes.txt is not a PNG or JPEG')).toBeVisible()
  await expect(page.getByTestId('rejected')).toHaveText('notes.txt')
  expect(requests).toBe(0)
})

test('mimeType is what before-upload checks', async ({ page }) => {
  await fakeUploadEndpoint(page, '**/api/upload')
  await uploadInput(page.locator('.el-upload')).setInputFiles({
    name: 'photo.png',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('png'),
  })
  await expect(page.getByTestId('rejected')).toHaveText('photo.png')
  // A rejected file can show in the list for a moment; wait for it to go.
  await expect(page.locator('.el-upload-list__item')).toHaveCount(0)
})

test('size checks: build a big buffer in the test', async ({ page }) => {
  await fakeUploadEndpoint(page, '**/api/upload')
  await uploadInput(page.locator('.el-upload')).setInputFiles(png('huge.png', 2 * 1024 * 1024))
  await expect(message(page, 'huge.png is larger than 1 MB')).toBeVisible()
  await expect(page.locator('.el-upload-list__item')).toHaveCount(0)
})

test('without a fake endpoint the file disappears from the list', async ({ page }) => {
  // The dev server answers POST /api/upload with an error.
  await uploadInput(page.locator('.el-upload')).setInputFiles(png('cover.png'))
  await expect(page.locator('.el-upload-list__item')).toHaveCount(0)
  await expect(page.getByTestId('uploaded')).toHaveText('(none)')
})

test('limit: extra files go to on-exceed', async ({ page }) => {
  await fakeUploadEndpoint(page, '**/api/upload')
  const input = uploadInput(page.locator('.el-upload'))

  await expect(input.setInputFiles([png('a.png'), png('b.png')])).rejects.toThrow(/Non-multiple file input can only accept single file/)

  await input.setInputFiles(png('a.png'))
  await expect(page.getByTestId('uploaded')).toHaveText('a.png')
  await input.setInputFiles(png('b.png'))
  await expect(page.getByTestId('uploaded')).toHaveText('a.png, b.png')
  await input.setInputFiles(png('c.png'))
  await expect(page.getByTestId('exceeded')).toHaveText('1')
  await expect(uploadedFileNames(page.getByRole('main'))).toHaveText(['a.png', 'b.png'])
})
