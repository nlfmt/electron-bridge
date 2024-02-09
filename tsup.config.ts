import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', "src/preload.ts", "src/renderer.ts", "src/types.ts"],
  splitting: false,
  format: ['esm'],
  dts: true,
  minify: true,
  clean: true,
})