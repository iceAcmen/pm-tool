export default {
  test: {
    environment: 'node',
    include: [
      '/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/a20v-source-auto-independent-retest-20261022-cases.test.tsx',
    ],
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,
  },
}
