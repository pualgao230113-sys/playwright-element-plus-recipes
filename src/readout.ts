// Small formatters for the "shown vs stored" readouts: given what v-model
// holds, what should the field display?

const pad = (n: number) => String(n).padStart(2, '0')

/** "2026-03-15" -> "15/03/2026" (the date pickers' display format). */
export function dayFirst(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** The calendar day a Date (or a date-time string) gets when it is sent as JSON. */
export function jsonDay(value: unknown): string {
  return JSON.stringify(value).slice(1, 11)
}

/** A Date as the time picker shows it by default (HH:mm:ss, local time). */
export function localTime(value: Date): string {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}

interface Node {
  value?: string
  id?: string
  label: string
  children?: Node[]
}

/** Labels along a path of values, joined like el-cascader shows them. */
export function pathLabels(options: Node[], path: string[]): string {
  const labels: string[] = []
  let level: Node[] | undefined = options
  for (const v of path) {
    const node: Node | undefined = level?.find((n) => n.value === v)
    if (!node) break
    labels.push(node.label)
    level = node.children
  }
  return labels.join(' / ')
}

/** The label of a tree node by its key. */
export function labelOf(nodes: Node[], id: string): string {
  for (const n of nodes) {
    if (n.id === id) return n.label
    const found = n.children ? labelOf(n.children, id) : ''
    if (found) return found
  }
  return ''
}
