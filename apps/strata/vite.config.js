import {defineConfig} from 'vite'
import {svelte} from '@sveltejs/vite-plugin-svelte'
export default defineConfig({plugins:[svelte()],esbuild:{tsconfigRaw:{}},build:{target:'es2022',sourcemap:false}})
