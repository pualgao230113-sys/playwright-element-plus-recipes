# Contributing

## The rule: reproduce it first

A pitfall only goes in if a test shows it against the real library. Write the naive version of the test and watch it fail (or pass for the wrong reason) before you write the fix. If you can't make it happen, it doesn't go in.

## Adding a recipe

1. Add a small page under `src/pages/` and a route in `src/router.ts`. Use neutral demo data: fruits, books, todos. Show the model value on the page (`data-testid="...-value"`) so the test can check what the component actually stored.
2. Add `tests/NN-<component>.spec.ts`. Start it with a doc comment that lists the pitfalls, numbered. Each pitfall needs a test that proves it, ideally showing the naive approach next to the one that works.
3. If a pattern shows up in more than one spec, move it into `tests/helpers/element-plus.ts` and document it in `docs/helpers.md`.
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

## For the maintainer: the live demo

`.github/workflows/pages.yml` builds the demo and deploys it to <https://pualgao230113-sys.github.io/playwright-element-plus-recipes/> on every push to `main`. Before that works:

1. Make the repository public. GitHub Pages on a free plan needs a public repo.
2. In Settings > Pages, set Source to "GitHub Actions". The workflow asks `actions/configure-pages` to turn Pages on (`enablement: true`), but if the first run still fails on that step, set it by hand and re-run.
