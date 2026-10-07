# Changelog

## 0.1.0 - unreleased

First version.

- 21 recipes, each a demo page and a Playwright spec: select, message, checkbox / radio / switch, date picker, dialog / drawer / message box, table, form validation, input, popper placement, cascader, tree / tree-select, autocomplete, input number, time picker / time select, upload, tabs, pagination, dropdown, popconfirm / tooltip, notification, collapse.
- Helpers in `tests/helpers/element-plus.ts`, documented in `docs/helpers.md`, installable from GitHub as `playwright-element-plus-recipes` (ESM and CommonJS builds with types).
- Specs that depend on the Element Plus version skip with the version in the reason. Tested against Element Plus 2.9.11, 2.13.7 and 2.14.7.
- GitHub Actions: tests on an Element Plus version matrix, and a Pages deploy of the demo app.
- The built demo includes `third-party-licenses.md` (licence texts of the bundled packages), linked from the sidebar.
- Installing from GitHub works with npm, and with pnpm 10 and 11 once the package is allowed to run its build script.
