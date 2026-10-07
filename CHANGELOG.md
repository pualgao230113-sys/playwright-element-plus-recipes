# Changelog

## 0.1.0 - 2026-10-07

First version.

### npm package

- `playwright-element-plus`: Playwright helpers for Element Plus, installed with `npm i -D playwright-element-plus`. ESM and CommonJS builds with types. The package contains only `dist`, `README.md` and `LICENSE`.
- Every helper is documented with an example in `docs/helpers.md`. The source is `packages/playwright-element-plus/src/index.ts`, an npm workspace that the specs import through `tests/helpers/element-plus.ts`.
- The repo can also be installed from GitHub. That works with npm, and with pnpm 10 and 11 once the package is allowed to run its build script.

### Recipes

- 21 recipes, each a demo page and a Playwright spec: select, message, checkbox / radio / switch, date picker, dialog / drawer / message box, table, form validation, input, popper placement, cascader, tree / tree-select, autocomplete, input number, time picker / time select, upload, tabs, pagination, dropdown, popconfirm / tooltip, notification, collapse.
- Specs that depend on the Element Plus version skip with the version in the reason, or assert the right value for each version. Tested against Element Plus 2.9.11, 2.13.7 and 2.14.7.

### Demo app

- Home page at `/`: what the site is, links to the repository and the README, and all 21 recipes grouped by component family, each with its main pitfall and its Common / Specific counts.
- Every recipe page starts with a "Try this" list: numbered steps you can do by hand to see the pitfall, each one asserted in the spec. Steps can be ticked off; the ticks are kept per page in the browser. Links to the spec on GitHub and to the README sit under the list.
- Shown vs stored readout next to the date picker, time picker, input number, cascader, autocomplete, tree-select and select fields: what the field displays next to what v-model holds, marked "different" when they disagree.
- "Use in your test" block on every recipe page: the main helper call for that page, with a copy button.
- Quick search: press `/` or Ctrl/Cmd+K to find a recipe by component or pitfall.
- Sidebar grouped by component family with "N of 21 seen", light and dark themes (follows the system until you pick one; Element Plus's own dark variables are used), self-hosted Recursive font, the Element Plus version the demo was built with, and a compact top bar on phones.
- A "Skip to content" link, and the page title as the page's `<h1>`.
- Recipe data (titles, steps, snippets, pitfall lines) lives in one list, `src/recipes.ts`.
- The built demo includes `third-party-licenses.md` (licence texts of the bundled packages), linked from the sidebar.

### GitHub Actions

- `test.yml`: typecheck, build and the Playwright suite on Element Plus 2.9.11, 2.13.7 and 2.14.7.
- `pages.yml`: deploys the demo app to GitHub Pages.
- `release.yml`: on a version tag, checks the tag against the package version, runs typecheck, build and the tests, and publishes the package with npm Trusted Publishing.
