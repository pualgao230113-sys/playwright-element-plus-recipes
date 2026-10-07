// Builds tests/helpers/element-plus.ts into dist-helpers/ as ESM and CommonJS
// (with .d.ts), so the package can be imported from either kind of project.
//
// tsc runs through the current Node binary, not through `npx`: Node cannot
// spawn `npx.cmd` without a shell on Windows, which would break `prepare`.
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const tscBin = require.resolve('typescript/bin/tsc')

rmSync('dist-helpers', { recursive: true, force: true })
for (const project of ['tsconfig.helpers.json', 'tsconfig.helpers.cjs.json']) {
  execFileSync(process.execPath, [tscBin, '-p', project], { stdio: 'inherit' })
}
// The repo is "type": "module"; mark the CommonJS folder so Node reads it as CJS.
mkdirSync('dist-helpers/cjs', { recursive: true })
writeFileSync('dist-helpers/cjs/package.json', '{ "type": "commonjs" }\n')
