<!--
测试专家产物目录（独立测试角色所有，ADL-045 / AGENTS 6A / collaboration 第九节）。
其他角色：只读引用，不改动本目录任何文件。
-->
# docs/testing/ —— 独立测试产物索引

> 本目录是 **独立测试专家** 的唯一权威产物，对应 ADL-045 独立测试门控。其他角色（开发 / 产品 PM）只读引用、**不得修改本目录**。
> 测试专家职责：写测试计划与用例、执行独立测试、给最终 PASS/FAIL/BLOCKED/NOT_RUN 结论；**不改产品代码**，发现问题开给开发修复。

## 被测基线（本轮）

- round1 被测基线：`a8e8ea4` —— fix(client) 抽 status 纯常量、消除 client bundle 残留外部 zod require。
- round2/3 修复（T-DEF-008/009/004 域级）已由开发提交为 `8b81eeb`；本测试文档提交时当前 HEAD = `7a64fe4`。a8e8ea4 是被测基线，**不是**最新 HEAD。
- 上游：`~/Projects/dsh-pm/deepseek-harness`（只读，不改动）。
- 运行环境声明：macOS arm64、Node 22、pnpm 11.28.5（实际能否启动 GUI 见各报告）。

## 文档清单

| 文档 | 作用 |
|---|---|
| [`test-plan.md`](test-plan.md) | 独立测试方案：范围、五类判定、方法、门控、BLOCKED 处理、证据要求 |
| [`requirement-case-matrix.md`](requirement-case-matrix.md) | 需求/能力 → 用例 → 自动化脚本 → 状态 → 证据 的全量矩阵 |
| [`defect-format.md`](defect-format.md) | 缺陷字段、严重度分级、生命周期（仅排修复先后，不自动豁免） |
| [`acceptance-report-round1.md`](acceptance-report-round1.md) | 首轮（a8e8ea4）五类结论、缺陷清单、质量门结论与复验范围 |
| [`reverification-round2.md`](reverification-round2.md) | T-DEF-008/004 修复后复验清单 + 修复前基线 hash（自包含证据） |
| [`round3-gui-execution.md`](round3-gui-execution.md) | Round3 真实 Chrome GUI 执行包（选择器/预期/证据命名，待主端执行后专家判证） |

## 判定图例（与 ADL-045 严格一致）

- **PASS**：被测行为经真实执行/代码证据验证满足验收；**离线纯函数/HTTP200 不算网页实测 PASS**。
- **FAIL**：已实测且与验收不符；阻塞开发。
- **BLOCKED**：受能力/环境限制无法实测，诚实标注原因；**不等于通过**，阻塞继续开发。
- **NOT_RUN**：计划内但本轮未执行（排入后续）。

> 硬规则：`FAIL / BLOCKED / NOT_RUN` 一律 ≠ 通过；GUI 实测是硬门槛；严重度只排修复先后，不自动豁免；任何新提交使受影响历史结论过期，须重测后方可再引用。
