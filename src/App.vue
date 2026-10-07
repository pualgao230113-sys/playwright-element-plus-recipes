<script setup lang="ts">
import { recipeRoutes } from './router'
</script>

<template>
  <div class="layout">
    <nav class="sidebar" aria-label="Recipes">
      <h1>EP recipes</h1>
      <RouterLink v-for="r in recipeRoutes" :key="r.path" :to="r.path">{{ r.meta.title }}</RouterLink>
    </nav>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style>
body { margin: 0; font-family: system-ui, sans-serif; background: #fff; color: #1f2329; }
.layout { display: flex; min-height: 100vh; }
.sidebar { width: 220px; flex-shrink: 0; padding: 16px; border-right: 1px solid #e4e7ed; display: flex; flex-direction: column; gap: 6px; }
.sidebar h1 { font-size: 16px; margin: 0 0 8px; }
.sidebar a { color: #409eff; text-decoration: none; font-size: 14px; }
.sidebar a.router-link-active { font-weight: 600; }
.content { flex: 1; padding: 24px; min-width: 0; }
.content section { margin-bottom: 32px; }
.content h2 { font-size: 18px; margin: 0 0 12px; }
.content h3 { font-size: 15px; margin: 0 0 8px; }
.out { margin-top: 8px; font-family: ui-monospace, monospace; font-size: 13px; color: #606266; }
</style>
