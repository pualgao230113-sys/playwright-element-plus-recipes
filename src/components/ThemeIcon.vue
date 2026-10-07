<script setup lang="ts">
defineProps<{ dark: boolean }>()
</script>

<template>
  <!-- Sun while dark (the way back), moon while light. -->
  <svg v-if="dark" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="3.2" fill="currentColor" />
    <path
      d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
  <svg v-else width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M13.5 9.8A6 6 0 0 1 6.2 2.5a6 6 0 1 0 7.3 7.3Z" fill="currentColor" />
  </svg>
</template>
