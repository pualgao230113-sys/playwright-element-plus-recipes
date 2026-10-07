# playwright-element-plus

Playwright helpers for Vue apps built with [Element Plus](https://element-plus.org). They deal with the things that trip up tests: dropdowns rendered outside the component, hidden checkbox inputs, toasts that stack, values that only commit on blur.

Not affiliated with Element Plus or Playwright.

## Install

```bash
npm i -D playwright-element-plus
```

`@playwright/test` is a peer dependency. Install it in your project if you haven't.

## Use

```ts
import { expect, test } from '@playwright/test'
import { message, selectOption } from 'playwright-element-plus'

test('pick a fruit', async ({ page }) => {
  await page.goto('/fruits')
  await selectOption(page, 'Fruit', 'Apple')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(message(page, 'Saved')).toBeVisible()
})
```

It works in ESM and CommonJS projects, and the types are included.

## More

- Every helper, with an example: [docs/helpers.md](https://github.com/pualgao230113-sys/playwright-element-plus-recipes/blob/main/docs/helpers.md)
- The pitfalls behind each helper, each one reproduced in a test: [recipe table](https://github.com/pualgao230113-sys/playwright-element-plus-recipes#recipes)
- Live demo app: <https://pualgao230113-sys.github.io/playwright-element-plus-recipes/>

## Supported versions

- Element Plus 2.9 and later. Tested with 2.9.11, 2.13.7 and 2.14.7. A few behaviours differ between these; the [tested versions table](https://github.com/pualgao230113-sys/playwright-element-plus-recipes#tested-versions) lists where.
- @playwright/test: tested with 1.63.
- Node.js 20.19+ or 22.12+.

## License

MIT
