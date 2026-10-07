# Contributing

## The rule: reproduce it first

A pitfall only goes in if a test shows it against the real library. Write the naive version of the test and watch it fail (or pass for the wrong reason) before you write the fix. If you can't make it happen, it doesn't go in.

## Adding a recipe

1. Add a small page under `src/pages/` and a route in `src/router.ts`. Use neutral demo data: fruits, books, todos. Show the model value on the page (`data-testid="...-value"`) so the test can check what the component actually stored.
2. Add `tests/NN-<component>.spec.ts`. Start it with a doc comment that lists the pitfalls, numbered. Each pitfall needs a test that proves it, ideally showing the naive approach next to the one that works.
3. If a pattern shows up in more than one spec, move it into `packages/playwright-element-plus/src/index.ts` (the npm package; the specs import it through `tests/helpers/element-plus.ts`) and document it in `docs/helpers.md`.
4. Add a row to the recipe table in `README.md`, marked Common or Specific.
5. Run the checks:

```bash
npm run typecheck
npm run build
npm run build:helpers
npx playwright test tests/NN-*.spec.ts --repeat-each=3
```

A recipe that fails one run in three is not done.

## Version-specific behaviour

If a behaviour differs between Element Plus versions, keep the test and make it version-aware with `test.skip(condition, reason)` and the versions in the reason. Add the versions to the "Tested versions" table.

## Writing style

Write like you're explaining it to a colleague. Short sentences, concrete examples, no marketing words. Code comments in English.

## Translations

The English README is the reference. If you change it, a translation can lag behind; say so in the PR and someone can update it.

## The live demo

`.github/workflows/pages.yml` builds the demo and deploys it to <https://pualgao230113-sys.github.io/playwright-element-plus-recipes/> on every push to `main`.

## Cutting a release

1. Bump `version` in `packages/playwright-element-plus/package.json` and move the CHANGELOG entries under that version.
2. Tag the commit with the same version and push the tag, for example `git tag v0.2.0 && git push origin v0.2.0`.
3. `.github/workflows/release.yml` checks that the tag matches the version, runs the tests and publishes to npm with Trusted Publishing.

The first version is published by hand: Trusted Publishing is set up in the package's settings on npmjs.com, so the package has to exist first. Publish 0.1.0 once from `packages/playwright-element-plus`: `npm publish --access public`. Then set up Trusted Publishing on npmjs.com (package settings: this repository, workflow `release.yml`). Do not tag `v0.1.0`; the workflow would try to publish 0.1.0 a second time. Releases through the workflow start at 0.2.0.
