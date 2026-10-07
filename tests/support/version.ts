/**
 * The installed Element Plus version, for the few recipes whose behaviour
 * changed between releases. Not part of the published helpers.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const elementPlusVersion: string = require('element-plus/package.json').version

function parse(v: string): number[] {
  return v.split('-')[0].split('.').map(Number)
}

/** True when the installed Element Plus is `min` or newer. */
export function epAtLeast(min: string): boolean {
  const [a, b] = [parse(elementPlusVersion), parse(min)]
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i]
  }
  return true
}
