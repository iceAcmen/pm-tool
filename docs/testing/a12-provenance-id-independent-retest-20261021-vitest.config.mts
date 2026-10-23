import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  cacheDir: resolve(process.cwd(), 'disabled-vite-cache'),
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    cache: false,
    deps: { optimizer: { ssr: { enabled: false }, web: { enabled: false } } },
  },
})
