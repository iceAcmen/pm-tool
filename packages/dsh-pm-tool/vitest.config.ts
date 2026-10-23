import { defineConfig } from 'vitest/config'

// #24 单元层：纯函数离线单测（零网络/零随机/零墙钟）。
// 定位：与 verify-isolation（存储/隔离/集成门）互补，只覆盖 core 纯逻辑。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // 纯函数单测不碰文件系统/网络；并发安全。
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        // 本批单元层针对的纯模块（其余 core 由 verify-isolation 集成门覆盖，不摊薄门槛）。
        'src/core/settings.ts',
        'src/core/copilot.ts',
        'src/core/progress-derivation.ts',
        'src/core/gantt.ts',
      ],
      exclude: [
        'src/core/*.test.ts',
      ],
      // 阈值取自子集真实实跑（lines 45.02 / branches 86.25 / functions 42.37），略降留余量。
      thresholds: {
        lines: 40,
        branches: 80,
        functions: 35,
        statements: 40,
      },
    },
  },
})
