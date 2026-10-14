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
| [`external-skills-acceptance.md`](external-skills-acceptance.md) | **外部（vendor）Agent Skills 集成验收门**（域 A–J，ADL-048 / AGENTS 6 / `docs/external-skills.md`）；导入方实现后由独立测试专家逐格给 PASS/FAIL/MANUAL_PENDING，其他角色只读引用、不改本文件 |
| [`release-closeout-acceptance.md`](release-closeout-acceptance.md) | **发布收尾验收冻结门**（ADL-045/047）：冻结四块验收——provider ID 统一/poc-prod 路由、3080 最新 HEAD 且零写、历史残留不误删用户文件、版本号/路线图/发布说明一致；含自动化用例、MANUAL_PENDING（旧 H1–H6 不升级为阻塞）、证据格式与 PASS 门；独立测试专家所有 |
| [`people-load-acceptance.md`](people-load-acceptance.md) | **人员与负载视图验收矩阵（开发前冻结，v0.5.1）**（PROD-07/08，契约 `product/07-people-load-view-design.md`）：纯函数归一/分组/未分配置顶/done/逾期临期(7天边界)/风险排序(含受阻与最近截止)/确定性/多负责人不拆multiOwner + 顶层「人员」tab跨项目/项目过滤/搜索/只看风险/排序下拉/4类空态/aria-expanded/只读openRecord直达/零写不改schema/窄窗堆叠与键盘标准按钮；29 项全部初始 NOT_RUN；P1 与旧 H1–H6 不重复阻塞；独立测试专家所有 |
| [`web-polish-acceptance.md`](web-polish-acceptance.md) | **Web Polish 体验增量验收矩阵（开发前冻结，基线 `fc94d93`）**（PROD-04 Web 任务移动/改父 / PROD-09 汇报趋势对比徽标 / PROD-10 会议↔任务反向链接，契约 `product/03-incremental-proposals.md`）：候选列表排除自身与后代/自身·后代·跨项目三拒+父不存在零写/确认移动=改父+整项目 renumber 原子动作+失败回滚+code 与树缩进一致/重启读回/取消零写 + 树选器·错误文案非仅色 + 相邻快照确定 diff(固定 averageProgress/overdue_task/exceptions 三项)/首行空态/正负零·零差显持平 0·文字箭头非仅颜色/乱序先排 + 从 meetings.actions.taskId 只读派生/多来源按 meeting 日期·id·action 稳定次序取确定第一/任务抽屉只读链接/悬空·会议删除安全 + 零 schema 优先/build·full guard·隔离 GUI 证据；27 项初始全 NOT_RUN（AUTO 19 / GUI 8）；真 390 窄窗沿用 PL-WEB-11 不重复阻塞；独立测试专家所有 |
| [`v060-manual-feedback-regression.md`](v060-manual-feedback-regression.md) | **v0.6.0 人工验收反馈回归矩阵（最终 PASS，冻结 client `d43353ea…`）**：备份成功 Notice 全文+复制路径/恢复从 backups 列表可发现、级联删除长 Notice 可滚动不截断、j·k 行移动 active 高亮/Space 门控焦点行/输入框不劫持、390 顶栏文字尺寸不溢出、任务行「移动到…」可见文字入口+会议行动项「转为任务」、甘特 tick 不重叠/planned·unplanned/条可点、副驾 loading 态+poc/prod 模型车道可见、前置依赖紧凑树(WBS 缩进/checkbox↔正文 4–8px/code·title·status/整行可点/max-height 滚动/390 不溢出)；**14 项全 PASS + 生产 Key 单列 MANUAL_PENDING（不阻塞）**；R3/R4 由用户本人 2026-10-14 手动验收闭环；独立测试专家所有 |
| [`schema-v2-acceptance.md`](schema-v2-acceptance.md) | **Schema v2 验收矩阵（开发前冻结，只读基线 `80d42b8`）**（ADL-045/047，独立测试专家前置冻结、不改代码/提交）：**域升 v2 且 compatibleVersions 仍含 1、旧 v1 读、更新一条即迁移到 v2（其余不批量改写）**；v2 可选字段写回·重启读回；人为坏字段 clean fail 点名 id/字段、**禁止旁路备份后跳过**、零写；predecessorIds 存在·同项目·自指·成环·删除保护·重启读回·预检兜底，**悬空依赖 doctor 只报告不自动自愈**；**项目级** repoUrl/branch 格式与旧项目兼容；健康分纯离线派生·确定性·因子可解释·空/满分/全受阻/日期边界·只读零写；**备份 formatVersion 仍为 1 不抬版本、v1/v2 往返兼容**；createBackup 原子 tmp+rename/残留清理；restore 预检先于动表、**中途失败进程内故障注入自动回滚（不声称跨进程事务）**、拒伪格式；build 无残留 server require / full guard 约 150 文件不回归·隔离 backups 不变 / 真浏览器 GUI 冒烟 + 不可逆动作人工确认；**50 项初始全 NOT_RUN**（AUTO / GUI / AUTO+GUI / MANUAL_PENDING 分层），人工项不重复阻塞既有 H1–H6；独立测试专家所有 |
| [`copilot-multistep-acceptance.md`](copilot-multistep-acceptance.md) | **副驾多步规划验收矩阵（开发前冻结，PROD-24，P0 基线 `3b20850`）**（契约 `product/08-copilot-multistep-design.md` + P0 裁决）：旧 `actions` 兼容平凡计划 / 新 `steps{stepId,title,reason,action,needs}` 契约 / DAG 环·缺依赖·自指坏步局部拒+级联（不拖全部）/ >8 步或 >10 任务整拒 / 同目标隐式串行+链式 baseline 防误冲突 / 真实外部冲突仅拒相关步+依赖级联 / task.update 五标量白名单 / 整批·逐步·勾选·标量编辑·取消零写 / 幂等键含 baseline / 部分成功不自动补偿 / 无 Key·限流·乱码·超长降级零写 / GUI 计划卡·拒绝红行·3条软风险·确认按钮·结果逐步 / 计划不持久化(不写settings不新表) / 正式数据零污染；51 项初始全 NOT_RUN（AUTO 37 / GUI 11 / AUTO+GUI 1 / MANUAL_PENDING 2），AUTO/GUI/MANUAL_PENDING 分层，旧 H1–H6 不阻塞；独立测试专家所有 |

| [`repo-link-assignee-completion-acceptance.md`](repo-link-assignee-completion-acceptance.md) | **v0.7.0 仓库链接+人员补全验收矩阵（全部 PASS，冻结 client `e75ee229…`）**：T7 = task/deliverable 可选 `repoUrl`/`branch`；T8 = assignee 候选补全；**30/30 全 PASS**；build=0、专项 verify 全绿、full guard 157 文件零污染；独立测试专家所有 |
| [`stability-batch-acceptance.md`](stability-batch-acceptance.md) | **稳定性地基批次验收矩阵（全部 28/28 PASS，冻结 client `dd66be29…`）**：S1 = AggregateError 复合失败聚合；S2 = ask-apply 幂等键短 TTL 持久化 settings 跨进程去重；S3 = 项目级 repo CLI/client 与 core/repo.ts 真源一致；build=0、专项 verify 全绿、full guard 157 文件零污染；独立测试专家所有 |

## 判定图例（与 ADL-045 严格一致）

- **PASS**：被测行为经真实执行/代码证据验证满足验收；**离线纯函数/HTTP200 不算网页实测 PASS**。
- **FAIL**：已实测且与验收不符；阻塞开发。
- **BLOCKED**：受能力/环境限制无法实测，诚实标注原因；**不等于通过**，阻塞继续开发。
- **NOT_RUN**：计划内但本轮未执行（排入后续）。

> 硬规则：`FAIL / BLOCKED / NOT_RUN` 一律 ≠ 通过；GUI 实测是硬门槛；严重度只排修复先后，不自动豁免；任何新提交使受影响历史结论过期，须重测后方可再引用。
