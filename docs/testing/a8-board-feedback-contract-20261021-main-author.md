# A8 Main 真实组件作者例设施

> 2026-10-21，trae 独立测试专家。给 Main 编写本人产品测试用例参考：这些文件仍由专家维护，只读取法，不修改或原地重跑专家红证。Main 的显式 `{kind,text}`/reset catch 修复按既有合同；不改 scope、onSave 或 refresh 调用。

## 1. 旧字节已冻结

冻结时点 `2026-10-21T14:41:37.320Z`（本机22:41:37），早于 Main 本轮新源交件。

- [旧 BoardBento.tsx](a8-board-feedback-contract-20261021-selftmp/frozen/packages/dsh-pm-tool/src/client/board/BoardBento.tsx)：sha256 `53fd597bb305ad3f969fe31b2c28d4abf46e2a39a30c4fc48ff80ce2411721bd`。
- [旧 board.css](a8-board-feedback-contract-20261021-selftmp/frozen/packages/dsh-pm-tool/src/client/board/board.css)：sha256 `7be41947c6f3239ebd10eaae4a833279d1fb024f2585f6132b66e50f82e48c63`。
- [旧 panel.css](a8-board-feedback-contract-20261021-selftmp/frozen/packages/dsh-pm-tool/src/client/panel.css)：sha256 `ac1186c558a4550896fbc1036603d23c53ec4f68a5becabce331fbf9275c4500`；原错误色规则在这里，不在 board.css。
- [freeze.json](a8-board-feedback-contract-20261021-selftmp/freeze.json) 保存20输入、基线、diff及只读依赖；[r3](a8-board-feedback-contract-20261021-selftmp/run-r3.json) 为旧字节27项17通过10失败。专家不以即将修改的主树回填旧冻结，不重新冻结或复验新源，等待 Main 交件。

## 2. 可复用路径与边界

| 路径 | Main 可参考的内容 |
| --- | --- |
| `docs/testing/a8-board-feedback-contract-20261021-selftmp/feedback.test.tsx` | 真实父组件挂载；合法fixture、props桥、deferred、scope/calls/layout核对、queue点击、关闭/重试/加载优先级。 |
| 同目录 `feedback-r3.test.tsx.txt` | 绑定旧红结果的精确r3测试副本，只读保留；不是已修后产品用例。 |
| 同目录 `vitest.config.mjs` | 私有 root/cacheDir、Node环境、单worker、关闭watch/coverage。 |
| `docs/testing/a8-board-feedback-contract-20261021-freeze.mjs` | 机械冻结/hash、逐轮独立日志、Node/TMP缓存隔离；不用它重跑覆盖专家目录。 |
| 同目录 selftmp `source-audit.mjs` | TypeScript parser只读枚举 setter 与反馈标签；不是编译/构建。 |

Main 新测试可命名 `packages/dsh-pm-tool/src/client/board/BoardBento-feedback.test.tsx`（Main 本人写），并同步至本人已有隔离候选。它应导入真实 `./BoardBento.js`、`./persist.js`、`./layout-append.js`，适配测试路径到 Main 源/原合法fixture，不依赖专家 frozen 作为修后测试对象。

保留真实父组件，不 mock banner/render/state，也不复制反馈表达式。仅 mock UI展示、动态 editor 捕获、宿主保存/刷新等外部通道；用例若要签真实 editor 双确认，另用真实 BoardEditor，不拿 stub 签。`vi.doMock` factory reject 提供 import失败；点击后必须在 `act` 内等待 `vi.dynamicImportSettled()`，否则会出现 r2 设施假空态。Vitest2断言用 `toHaveBeenCalledTimes(1)` + `toHaveBeenCalledWith(...)`，没有 `toHaveBeenCalledExactlyOnceWith`。

**作者例适配注意：** 专家r3的 BF-S01-CSS-old 是“原 validation 仍红”的观察，不是“成功应红”的产品期望。Main 改写成功/错误 CSS 回归时要断言显式 kind/status/现有 success token、error/alert/原validation及 editorError 优先，不能只跑该旧观察当修复通过。pending旧态只检查时序，必须和末成功语义一起跑。失败文案可以按操作结果校正，不把“未落盘”当盘证。各观察器JSON仅是专家证据设施，Main 作者例不在产品目录生成它们。

## 3. Main 私有缓存运行示例

环境：macOS，已有 nvm Node v22.23.3；pnpm11.28.5为项目口径，不需 install。已授权可只读解析/链接的依赖根：
`/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，实解析 React/test-renderer18.3.1、Vitest2.1.9。主树依赖不含 renderer，不能误用默认主树解析。

Main 使用本人新作者例根 `/private/tmp/pmtool-a8-board-feedback-author-20261021/`，不要使用专家 selftmp/cache/output。下面 config 存在 **Main 本人根**，不是本专家创建产品测试或写 Main 根：

```js
export default {
  root: '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool',
  cacheDir: '/private/tmp/pmtool-a8-board-feedback-author-20261021/cache',
  test: {
    environment: 'node',
    include: ['src/client/board/BoardBento-feedback.test.tsx'],
    minWorkers: 1, maxWorkers: 1, fileParallelism: false,
    watch: false, coverage: { enabled: false },
  },
}
```

Main 确认本人测试与新源已同步、上述 config已用 apply_patch写到本人根后：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
TMPDIR=/private/tmp/pmtool-a8-board-feedback-author-20261021 TEMP=/private/tmp/pmtool-a8-board-feedback-author-20261021 TMP=/private/tmp/pmtool-a8-board-feedback-author-20261021 NODE_COMPILE_CACHE=/private/tmp/pmtool-a8-board-feedback-author-20261021/node-cache /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /private/tmp/pmtool-a8-board-feedback-author-20261021/vitest.config.mjs --reporter=verbose --reporter=json --outputFile.json=/private/tmp/pmtool-a8-board-feedback-author-20261021/result.json
```

此命令是 **供 Main 的示例，本专家没有执行**。root须仍是Main所认领的候选，不在专家目录生成结果，不写共享 `.vite`/`.vitest`。若实际候选根不同，Main只更换root及对应CLI依赖路径，保持cache/output为本人根并交精确argv。

## 4. 最新补充与等待边界

Main 补充事实（非本专家新审签）：restore旧A7同新long组件1红5绿；修结构/CSS后原path6+launch5=11绿，长原文全等；A8 GUI待唯一build。此事实不改变本专家旧Board冻结，不扩成本单restore PASS。

本专家下一输入是Main显式kind/text及reset catch的 **新源交件**（文件/hash/diff、作者例红绿日志），再按同先行合同独立另根冻结复验。Main不改本前缀；专家不改Main产品/测试/缓存，不执行 build/GUI/service/credentials/commit。
