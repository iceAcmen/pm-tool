export default {
  test: {
    environment: 'node',
    include: [
      '/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/a20v2-source-auto-independent-retest-20261022-evidence/independent-cases.test.tsx',
    ],
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,
  },
}
