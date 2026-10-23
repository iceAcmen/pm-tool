# HC01 旧习惯卡长 OKR SOURCE/AUTO 独立复验

> 2026-10-22，平台 trae，独立测试专家。仅复验 HC01 当前三文件候选；不开发、不 GUI、不重验 GM01 完整建议旅程。

## 1. 结论

| 层 | 结论 | 边界 |
| --- | --- | --- |
| SOURCE | **有限 PASS** | 相对 HC01 原红冻结基线，差异仅为旧 `.pm-habit-okr` 的宽度/换行、直属图标不压缩、必要文本节点，以及旧卡 Link2/text 包装；未观察到标题解析、建议行、core、控件、历史语义改动 |
| AUTO | **有限 PASS** | 专家 HC-R01..04、HC-C01..07、新作者 2、`habits-suggestion-okr` 11、`habit-model` 10、受影响测试 131 均通过；完整 `tsc --noEmit` 通过 |
| GUI | **NOT_RUN** | 本任务明确禁止 GUI；DOM/CSS 机制断言不签视觉，不关闭 1440/390 真实页面门 |

本结论只覆盖绑定候选的 SOURCE/AUTO，不代表 HC01 视觉 PASS、全习惯页、GM01、完整建议旅程、发布或提交放行。

## 2. 候选绑定

基线 HEAD 仅作观察，不单独代表 dirty 候选。严格绑定：

| 文件 | SHA256 |
| --- | --- |
| `packages/dsh-pm-tool/src/client/panel.css` | `3cc0b0ed08ea34462ded8154b05f394a46f02c6577dea5da12c495aafa0f700b` |
| `packages/dsh-pm-tool/src/client/views/habits.tsx` | `ab7e625808b6c4308068c26376c02d7fae9b59fc812ab9b77484c29633bd4964` |
| `packages/dsh-pm-tool/src/client/views/habits-card-wrap.test.tsx` | `071c2b0488e88078d15f6436c1798cced495706c15bf8ecbfcf435c343459d0d` |

静态差异原文见 `-evidence/commands/source-audit-*.stdout.log`。`panel.css` 仅增加 badge `min/max-width`、`box-sizing`、`overflow-wrap/white-space`、直属 SVG 不压缩及文本规则；`habits.tsx` 仅给旧卡 Link2 明示 `flexShrink:0` 并加入 `.pm-habit-okr-text`。建议行、标题解析、历史和控制不在 HC01 差异内。

## 3. 历史失败保留

开发交接中的原失败未覆盖、未改写：

- 主树首轮：缺 `react-test-renderer`，模型 10 绿，两个组件套件加载失败，**exit 1**。
- 开发隔离首轮：**34 绿 2 红**；HC-R04 在测试树组件层看不到 DOM 直属 CSS，作者 fixture 漏 `streak`。
- 开发修正：Link2 自身明示 `flexShrink:0`，作者 fixture 补 `streak`；原失败仍保留在开发交接。

本次独立首轮也原样保留：

- HC-R01..04：runner 未预建 observations 父目录，4 项均 ENOENT，**exit 1**；这是自有设施失败，不是产品断言失败。
- 受影响组：122 个断言通过，但缺既定 Board fixture，套件 **exit 1**。
- 修正仅在自有冻结树补 `board-fixture-clarification-20261021-fixture.json`，并预建 observations 目录；未改产品或原测试。详见 `-evidence/supplement/correction.json`。

## 4. 环境与依赖保护

- macOS darwin/arm64；Node `v22.23.3` 直达 Vitest `2.1.9` / TypeScript `5.9.3`。
- 未执行 pnpm、shim、install、build、服务、GUI、credentials、commit 或 push。
- `HOME/TMPDIR/DSH_HOME/XDG_CACHE_HOME` 全部指向 `/private/tmp/pmtool-a19-habit-card-wrap-independent-retest-20261022/`。
- Vitest：`cache:false`、`--no-cache`、single fork、`minWorkers=maxWorkers=1`；禁 Node compile cache。
- 从 `/private/tmp/pmtool-a19-owned-deps-20261022/node_modules` 完整复制：13613 普通文件、1030 links；内部链接外逸 0、共享普通 inode 0、内容漂移 0、来源漂移 0。
- 主包源在首轮前后漂移 0；补件后三个候选 SHA 仍与目标一致。

## 5. 命令与结果

运行环境：仓库根，macOS。

```sh
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-card-wrap-independent-retest-20261022-run.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-card-wrap-independent-retest-20261022-run.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-card-wrap-independent-retest-20261022-supplement.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-card-wrap-independent-retest-20261022-supplement.mjs
git diff --check -- 'docs/testing/a19-habit-card-wrap-independent-retest-20261022*'
```

首轮 runner 总退出 1，原因见第 3 节；其原命令、stdout/stderr、reporter 和 seal 均保留。补件 runner 总退出 0：

| 组 | 结果 |
| --- | --- |
| HC-R01..04 | 4/4 通过，exit 0 |
| HC-C01..07 | 9/9 通过，exit 0 |
| 新作者测试 | 2/2 通过，exit 0 |
| `habits-suggestion-okr.test.tsx` | 11/11 通过，exit 0 |
| `habit-model.test.ts` | 10/10 通过，exit 0 |
| 必要受影响测试 | 131/131 通过，exit 0 |
| 完整 `tsc -p tsconfig.json --noEmit --incremental false` | exit 0 |
| 本前缀 `git diff --check` | exit 0 |

HC-C02 覆盖短标题及原四按钮；HC-C03 覆盖 missing ID 回退与无关联整行省略；HC-C05/C06/C07 覆盖历史折叠、补记字段、编辑/打卡命令、标题刷新、重排和禁用控制。HC-C04 只控制建议行未回归，不扩大为 GM01 完整旅程。

## 6. 证据与释放

- 候选、依赖复制证明、首轮结果、静态差异：`docs/testing/a19-habit-card-wrap-independent-retest-20261022-evidence/`
- 修正说明、补件命令、结果与 seal：同目录 `supplement/`
- 补件 PID `11395/11409/11432/11438/11445/11451/11467` 均经精确 `ps` 返回 exit 1 且空输出，已释放。
- 未启动 builder、浏览器、dsh 或其他服务；未停止 Main/正式实例。
- 自有 `/private/tmp` 保留供复核，不删除。

**STOP：SOURCE/AUTO 有限 PASS；GUI NOT_RUN。**
