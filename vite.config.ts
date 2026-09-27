import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  // Bits UI ships Svelte source. Keep it in Vite's transform pipeline so
  // Cloudflare/SvelteKit builds never hand raw .svelte files to Node SSR.
  ssr: {
    noExternal: ['bits-ui'],
  },
  build: {
    sourcemap: true,
  },
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  server: {
    watch: {
      ignored: ['!**/node_modules/mono-svelte/**'],
    },
  },
})
