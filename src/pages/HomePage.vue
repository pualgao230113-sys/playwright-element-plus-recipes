<script setup lang="ts">
import { README_URL, REPO_URL, families, recipes } from '../recipes'
import { seen } from '../prefs'

const groups = families.map((family) => ({ family, items: recipes.filter((r) => r.family === family) }))
</script>

<template>
  <div class="home chrome">
    <h1 class="page-title">Playwright recipes for Element Plus</h1>
    <p class="home__intro">
      Each page has the Element Plus components the tests use. Follow the steps to see the problem yourself, then open
      the spec to see how the test handles it.
    </p>
    <p class="home__install">
      Use the same helpers in your own tests: <code>npm i -D playwright-element-plus</code>
    </p>
    <p class="head-links">
      <a :href="REPO_URL" target="_blank" rel="noopener">Repository on GitHub</a>
      <a href="https://www.npmjs.com/package/playwright-element-plus" target="_blank" rel="noopener">Package on npm</a>
      <a :href="README_URL" target="_blank" rel="noopener">README: the pitfalls in one table</a>
    </p>
    <p class="home__legend">
      Common: most apps that use the component hit it. Specific: only with a certain option or version.
    </p>

    <div v-for="g in groups" :key="g.family" class="home__group">
      <h3>{{ g.family }}</h3>
      <ul class="cards">
        <li v-for="r in g.items" :key="r.path">
          <RouterLink :to="r.path" class="card">
            <span class="card__top">
              <span class="card__num">{{ r.num }}</span>
              <span class="card__title">{{ r.title }}</span>
              <span v-if="seen.includes(r.path)" class="card__seen">seen</span>
            </span>
            <span class="card__pitfall">{{ r.pitfall }}</span>
            <span class="card__counts">{{ r.common }} common · {{ r.specific }} specific</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
.home {
  font-family: var(--sans);
}
.home__install {
  margin: 0 0 12px;
  color: var(--muted);
}
.home__install code {
  font-family: var(--mono);
  color: var(--ink);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 2px 8px;
  white-space: nowrap;
}
.home__intro {
  margin: 0 0 12px;
  max-width: 62ch;
  font-size: 17px;
  line-height: 1.55;
}
.home__legend {
  margin: 14px 0 0;
  font-size: 13px;
  color: var(--muted);
}
.home__group {
  margin-top: 32px;
}
.home__group h3 {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.cards li {
  display: flex;
}
.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  color: var(--ink);
  text-decoration: none;
  transition: border-color var(--fast) ease-out;
}
.card:hover {
  border-color: var(--accent);
}
.card__top {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.card__num {
  font-family: var(--mono);
  font-variation-settings: 'MONO' 1;
  font-size: 12px;
  color: var(--muted);
}
.card__title {
  font-weight: 700;
  font-variation-settings: 'CASL' 0.4;
  font-size: 16px;
  color: var(--ink);
}
.card__seen {
  margin-left: auto;
  font-size: 11px;
  color: var(--accent);
}
.card__pitfall {
  font-size: 14px;
  line-height: 1.45;
  color: var(--ink);
}
.card__counts {
  margin-top: auto;
  font-size: 12px;
  color: var(--muted);
}
</style>
