---
outline: false
---

<script setup>
import { data as examples } from "./examples.data";
</script>

# Bundled examples

Atomify ships with {{ examples.length }} examples. Open any of them from the **Example library**, Home, or **New project → From example**. This table is generated from the app's own example list, so it is always current.

- **Multithreaded**: the script uses `suffix kk` and runs on 4 threads ([Multithreading](/guide/multithreading)).
- **Notebook**: the example ships its own analysis notebook.

<table class="examples-table">
  <thead>
    <tr><th></th><th>Example</th><th>Input script</th><th>Keywords</th><th>Multithreaded</th><th>Notebook</th></tr>
  </thead>
  <tbody>
    <tr v-for="example in examples" :key="example.id">
      <td><img v-if="example.imageUrl" :src="example.imageUrl" alt="" loading="lazy" width="72" /></td>
      <td><strong>{{ example.title }}</strong><br /><span class="desc">{{ example.description }}</span></td>
      <td><code>{{ example.inputScript }}</code></td>
      <td>{{ example.keywords.join(", ") }}</td>
      <td>{{ example.multithreaded ? "Yes" : "" }}</td>
      <td>{{ example.notebook ? "Yes" : "" }}</td>
    </tr>
  </tbody>
</table>

<style>
.examples-table img { border-radius: 6px; max-width: 72px; }
.examples-table .desc { font-size: 13px; color: var(--vp-c-text-2); line-height: 1.45; }
.examples-table td { vertical-align: top; }
</style>
