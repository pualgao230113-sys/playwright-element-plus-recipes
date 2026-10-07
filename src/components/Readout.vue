<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// "Shown vs stored": puts what the field displays next to what v-model holds.
// The stored side comes from the page through the #stored slot (the specs
// read those elements, so their text stays exactly as before). The shown side
// is read from the field's DOM, because that is what the user actually sees.

const props = defineProps<{
  /** What the field should show for the current v-model value. */
  expected: string
  /** The field's placeholder, so it is not mistaken for a value. */
  placeholder?: string
  /** Changes whenever v-model changes; used for the short highlight. */
  storedKey?: unknown
  /**
   * No highlight. For the time pickers: their spinner rewrites v-model on
   * every scroll step, so a flash per step is noise (and it competes with
   * the spinner's own scroll handling).
   */
  quiet?: boolean
}>()

const field = ref<HTMLElement>()
const shown = ref('')

function readShown(root: HTMLElement): string {
  // Tags of a multiple select / cascader / tree-select.
  const tags = [...root.querySelectorAll('.el-tag')].map((t) => t.textContent?.trim() ?? '').filter(Boolean)
  if (tags.length) return tags.join(', ')
  // Text inputs (two for a range picker).
  const typed = [...root.querySelectorAll('input')]
    .filter((i) => !['hidden', 'file', 'checkbox', 'radio'].includes(i.type))
    .map((i) => i.value)
    .filter((v) => v !== '')
  if (typed.length) return typed.join(' to ')
  // A closed el-select shows its label in a span, not in the input.
  const label = root.querySelector('.el-select__placeholder')?.textContent?.trim() ?? ''
  return label && label !== props.placeholder ? label : ''
}

let timer: ReturnType<typeof setInterval> | undefined
function read() {
  if (field.value) shown.value = readShown(field.value)
}
onMounted(() => {
  read()
  // Polling is the simple way to catch every kind of change: typing,
  // programmatic updates by the component, values reverted on blur.
  timer = setInterval(read, 150)
})
onBeforeUnmount(() => clearInterval(timer))

const differs = computed(() => shown.value !== props.expected)

// One short highlight when the stored value changes, or when the field and
// v-model stop matching.
const flash = ref(false)
async function highlight() {
  if (props.quiet) return
  flash.value = false
  await nextTick()
  requestAnimationFrame(() => (flash.value = true))
}
watch(() => props.storedKey, highlight, { deep: true })
watch(differs, (now) => now && highlight())
</script>

<template>
  <div class="field-row">
    <div ref="field" class="field-row__field"><slot /></div>
    <div class="readout" :class="{ 'is-different': differs }" aria-live="polite">
      <div class="readout__pair">
        <div class="readout__cell">
          <span class="readout__label">Shown in the field</span>
          <span class="readout__value">{{ shown || '(empty)' }}</span>
        </div>
        <div class="readout__cell readout__cell--stored" :class="{ 'is-flash': flash }" @animationend="flash = false">
          <span class="readout__label">
            Stored in v-model
            <span v-if="differs" class="readout__flag">different</span>
          </span>
          <span class="readout__value"><slot name="stored" /></span>
        </div>
      </div>
      <div v-if="$slots.extra" class="readout__extra"><slot name="extra" /></div>
    </div>
  </div>
</template>
