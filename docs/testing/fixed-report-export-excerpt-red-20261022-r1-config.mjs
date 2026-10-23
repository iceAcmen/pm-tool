import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const cache = process.env.REPORT_EXPORT_RED_CACHE
const result = process.env.REPORT_EXPORT_RED_RESULT
if (!cache || !result) throw new Error('必须由自有 RED 执行器提供 cache/result 路径')

export default {
  root: path.join(repo, 'packages/dsh-pm-tool'),
  cacheDir: path.join(cache, 'vite'),
  test: {
    environment: 'node',
    include: ['src/core/report-export-excerpts.test.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    coverage: { enabled: false },
    reporters: ['verbose', 'json'],
    outputFile: { json: result },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
}
