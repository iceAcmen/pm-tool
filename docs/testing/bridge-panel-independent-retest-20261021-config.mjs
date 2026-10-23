import { defineConfig, mergeConfig } from 'vitest/config'
import original from './vitest.config.ts'
import { fileURLToPath } from 'node:url'

export default mergeConfig(original, defineConfig({
  cacheDir: fileURLToPath(new URL('./cache', import.meta.url)),
  test: {
    cache: false,
    deps: { optimizer: { ssr: { enabled: false }, web: { enabled: false } } },
  },
}))
