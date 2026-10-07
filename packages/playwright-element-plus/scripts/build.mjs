// Builds src/index.ts into dist/ as ESM and CommonJS, each with .d.ts.
//
// tsc runs through the current Node binary, not through `npx`: Node cannot
// spawn `npx.cmd` without a shell on Windows.
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const tscBin = require.resolve('typescript/bin/tsc')

rmSync(join(root, 'dist'), { recursive: true, force: true })
for (const project of ['tsconfig.json', 'tsconfig.cjs.json']) {
  execFileSync(process.execPath, [tscBin, '-p', join(root, project)], { stdio: 'inherit' })
}
// The package is "type": "module"; mark the CommonJS folder so Node reads it as CJS.
mkdirSync(join(root, 'dist/cjs'), { recursive: true })
writeFileSync(join(root, 'dist/cjs/package.json'), '{ "type": "commonjs" }\n')
