# A19HC 完整回归证据独立审查

> 2026-10-22，平台 trae，独立测试专家。仅审查既有原始证据，不开发、不改产品代码、不运行 GUI。

## 1. 结论

| 层 | 结论 | 边界 |
| --- | --- | --- |
| 候选绑定与来源 | **有限 PASS** | A19HC 三文件 SHA 与当前主工作树、冻结树 527 项源码清单一致；基线为 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不得用 HEAD 单独代表 dirty 候选 |
| 构建与 AUTO 完整回归 | **有限 PASS** | `noEmit`、构建、151 files/1565 tests、coverage、95 guard、自检、Launcher 9 文件/56 项及 launcher verify 均 exit 0 |
| 保护与依赖 | **有限 PASS** | 候选记录的源码、保护资产、依赖来源漂移均为空；guard 前后 5 个受保护文件污染 0；继承依赖的三个实际工具哈希与声明一致 |
| GUI / HC01 视觉 | **BLOCKED** | 本任务禁止且未运行 GUI；DOM/CSS/组件测试、构建和 coverage 均不能替代 1440/390 真实页面视觉审签 |
| A19 总门 | **不予 PASS** | 本报告只关闭 A19HC 绑定候选的完整自动回归证据审查，不把 HC01 局部门扩大成 A19、GM01、全习惯页、发布或提交总门 |

未发现本轮证据中的失败退出或失败断言。上述有限 PASS 只对本文绑定的 A19HC 候选和自动化范围有效。

## 2. 候选绑定

证据候选：`reports/all-pending-evidence-20261021/A19HC/candidate.json`。

| 文件 | SHA256 |
| --- | --- |
| `packages/dsh-pm-tool/src/client/panel.css` | `3cc0b0ed08ea34462ded8154b05f394a46f02c6577dea5da12c495aafa0f700b` |
| `packages/dsh-pm-tool/src/client/views/habits.tsx` | `ab7e625808b6c4308068c26376c02d7fae9b59fc812ab9b77484c29633bd4964` |
| `packages/dsh-pm-tool/src/client/views/habits-card-wrap.test.tsx` | `071c2b0488e88078d15f6436c1798cced495706c15bf8ecbfcf435c343459d0d` |

独立复核结果：

- 当前主工作树三文件 SHA 与上表完全一致。
- 冻结树 `/private/tmp/pmtool-a19hc-closure-20261022-r1` 的 527 项 `sourceHashes` 逐文件复算，差异 0。
- `product-tracked.patch` 共 56 个 tracked 文件，SHA `ac9b310cf7394a0c6542a156b6e2fb81c680027f1c3dbe4e327ac2acbbfef9f5`。
- `new-inputs.json` 共 33 项，SHA `e7d604b590490a6dcf1bd01682f4f61d68508e0a3a70af5f9ad34f88940aa606`。
- `candidate.json` SHA `03efd7b68efc22247c677b48fed66cdcb1746c9275b66b1d8d071f8f329f5bb2`。

## 3. A19 继承边界

继承来源为 `reports/all-pending-evidence-20261021/A19/candidate.json`，其 SHA 为 `e6ae8366eeaae4293d4d960cfe4002bf249b10f148aad13f97eecdb28fee25d7`，与 A19HC 的声明一致。

A19HC 与 A19 的源码哈希映射交叉比较：

- 共享源码除预期的 `panel.css`、`habits.tsx` 外全部逐哈希一致。
- A19HC 只新增 `habits-card-wrap.test.tsx`；`new-inputs.json` 由 A19 的 32 项增为 33 项，其余项及哈希不变。
- A19HC 不继承 A19 的构建产物哈希；本轮重新执行 noEmit、构建、coverage、guard 和 Launcher。
- A19 的 SOURCE/AUTO 有限 PASS 可作为未变化输入的来源证明；A19 的 GUI、GM01、整页及总门结论不随本报告转绿。
- A19HC 使用 A19 closure 的隔离 `node_modules` clonefile 副本；`typescript/bin/tsc`、`vitest/vitest.mjs`、`tsdown/dist/run.mjs` 实际 SHA 与候选声明一致，`externalLinks=[]`、`dependencySourceDrift=[]`。

## 4. 完整回归审证

`reports/all-pending-evidence-20261021/A19HC/build-r1/` 中 `outer-exit.json` 及八个阶段退出记录全部为 0：

| 阶段 | 原始结果 |
| --- | --- |
| `tsc --noEmit` | exit 0，stdout/stderr 为空 |
| `tsc -p tsconfig.json` | exit 0，stdout/stderr 为空 |
| `tsdown --config tsdown.config.ts` | exit 0，构建完成，stderr 为空 |
| Vitest coverage | exit 0；**151 files / 1565 tests** 全通过 |
| Coverage | statements **89.4%**、branches **82.41%**、functions **85.89%**、lines **89.4%** |
| `verify-isolation.mjs` | exit 0；**95/95** guard，通过 95、失败 0 |
| guard selftest | exit 0；覆盖 exports 增/改/删、缺失根出现、整根删除，fixture 已清理 |
| Launcher tests | exit 0；明确运行 9 个测试文件，**56/56**，fail/skipped/todo 均 0 |
| Launcher verify | exit 0；隔离假监听者，未碰 3172、cookie 或凭据 |

guard 同时证明 before=5、after=5、污染 0；`sourceDrift=[]`、`protectedDrift=[]`、`dependencySourceDrift=[]`。`/pm ping` 与 `/pm selftest` 在 95 guard 内实际通过，selftest 使用隔离临时根，读回可读 JSON 且目录权限为 0700。

coverage stderr 非空，但没有失败断言：包含既有 React list key、MaxListeners、detached tree/requestAnimationFrame 警告及 preview 冲突负例日志。guard stderr 也包含验证脚本主动制造的非法输入、写入失败和回滚负例；各对应脚本及总 guard 均 exit 0。本报告保留这些告警，不把“测试全绿”扩大成 GUI 或无告警结论。

## 5. Launcher 五个历史 probe

以下五个 probe 只存在于 A19 继承记录，**不在 A19HC 的 527 项源码清单，也未进入本轮 9 文件/56 项 Launcher 命令**：

| 历史文件 | SHA256 |
| --- | --- |
| `launcher/test/fc-independent-probes.test.mjs` | `4599aa376bbc2d349da9956fec48c85f50593e66fbf90dfe96a5c661143de740` |
| `launcher/test/fc-a2-followup.test.mjs` | `16fbea00c69bdb56bff9df48833eabce946e697c39a95f8bebc41d58e882bdc8` |
| `launcher/test/fc-a3-probes.test.mjs` | `6c092c58c26d0e4c8ec88937e9299f55d19be85334e15fd331104232045afec4` |
| `launcher/test/fc-a4-probes.test.mjs` | `9a3e015baecea113a415f778299a16266a525044e03395c911422d8ba3af7ab6` |
| `launcher/test/fc-a2-additional.test.mjs` | `dd033590aae6b11aab1b54bd35f89b4d3825fa2d2955b18f268c312f6a5b66b0` |

因此，本轮只能签 9 个明确列入命令的 Launcher 文件及其 56 项测试；不得表述为这五个历史 probe 已在 A19HC 重跑或获得当前候选 PASS。该缺口不扩大为 HC01 自动回归失败，但继续作为 A19/Launcher 更大范围门的未执行边界。

## 6. 证据路径

- 候选认领：`reports/all-pending-evidence-20261021/A19HC/candidate.json`
- 完整 tracked patch：`reports/all-pending-evidence-20261021/A19HC/product-tracked.patch`
- 新输入清单：`reports/all-pending-evidence-20261021/A19HC/new-inputs.json`
- 全部阶段退出与 stdout/stderr：`reports/all-pending-evidence-20261021/A19HC/build-r1/`
- A19 继承来源：`reports/all-pending-evidence-20261021/A19/candidate.json`
- HC01 既有局部独立复验：`docs/testing/a19-habit-card-wrap-independent-retest-20261022.md`
- A19 既有局部独立复验：`docs/testing/a19-habit-suggestion-okr-independent-retest-20261022.md`

**STOP：A19HC 绑定候选的构建/AUTO/保护证据有限 PASS；GUI BLOCKED；A19 总门不予 PASS。**
