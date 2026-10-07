import { ref } from 'vue'

// True on phone-width screens. Forms put their labels on top there, so the
// field and its readout get the whole width.
const query = typeof matchMedia === 'function' ? matchMedia('(max-width: 760px)') : null
export const narrow = ref(query?.matches ?? false)
query?.addEventListener('change', (e) => (narrow.value = e.matches))
