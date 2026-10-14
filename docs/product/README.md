<!--
产出角色：资深产品经理
日期：2026-10-12
基于提交：882fda4
变更摘要：docs/product/ 索引入口——PM 工作台评估体系首页。
-->

# docs/product/ · PM 工作台产品评估与路线图

> 本目录是 **pm-tool（项目经理工作台）的产品视角沉淀**：站在国内一线 PM 的真实工作流上，评估现状、挖问题、出方案、排版本。
> 与 `docs/` 下既有的工程档案（requirements/decision-log/knowledge-base/optimization-backlog）互补：那些记录「**已经做了什么、为什么这么做**」，本目录记录「**接下来该做什么、按什么顺序做**」。
> 新增需求统一编号 **PROD-xx**（与 R## / ADL-### / KB-### / OPT-## 不冲突）。

## 接手先读我（30 秒结论）

> **状态校正（2026-10-12，覆盖本文档早期判断）**：本目录最初基于 `882fda4`，其后开发线已推进——任务树视图、记录直达、行内快速编辑、概览作战室、甘特排期等此前列为「待做」的能力**均已实现**；`PROD-20` 是**对话式 AI 项目副驾**（并非早先三个固定 AI 按钮）。下文凡涉及「某能力待做」的判断，**一律以仓库最新代码与 `docs/changelog.md` 为准**，勿凭本目录早期文字排期。

- **产品**：离线优先、单用户、本地文件持久化的 PM 工作台插件（dsh 之上，七实体台账已闭环：项目/任务WBS/里程碑/风险问题/会议/汇报/交付物）。
- **当前阶段**：测试稳定阶段。**下一优先级是测试质量、冻结新功能堆砌**——所有新增功能须经独立测试专家 PASS 才可继续（见下「测试门控」）。
- **版本**：当前 `v0.4.0`；下一版本号未定，**不得擅自命名为 v0.4.1**。
- **三条红线不可破**：离线优先 / AI 草稿确认制 / 单用户本地。

### 测试门控（ADL-045，长期硬规则）
任何新增功能：需求 → 测试用例 → 开发 → 独立测试（功能/集成/网页实测/样式/UX）→ 修复 → 复验与受影响回归 → **专家 PASS** → 才可开下一功能/进入发布候选。`FAIL/BLOCKED/NOT_RUN≠通过`；阻塞期只做修复/补测/文档；完整浏览器实测是硬门槛，不能用 HTTP200/离线 verify 替代；轻微问题不默认豁免。细则见 `docs/collaboration.md` 第九节；测试产物归 `docs/testing/`（测试专家所有，本目录不触碰）。

## 文档索引

| 文件 | 对应工作流段落 | 内容 |
|---|---|---|
| [01-current-state-personas.md](01-current-state-personas.md) | ① | 产品现状、技术骨架、七实体、版本能力、4 类用户画像 |
| [02-ux-evaluation.md](02-ux-evaluation.md) | ② | 16 条 UX 问题清单，按 S1/S2/S3 分级，每条定位到 panel.tsx 行号 |
| [03-incremental-proposals.md](03-incremental-proposals.md) | ③ | 10 个增量方案，含线框、收益/成本/风险/优先级 |
| [04-disruptive-concepts.md](04-disruptive-concepts.md) | ④ | 4 个颠覆方向，重大分支给 A/B 对比与推荐 |
| [05-roadmap-and-tasks.md](05-roadmap-and-tasks.md) | ⑤ | **权威 PROD 任务表**：15 项需求、迭代划分、验收标准、编码提示 |
| [06-tradeoffs-and-risks.md](06-tradeoffs-and-risks.md) | ⑥ | 取舍记录、风险登记、明确不做什么 |
| [07-people-load-view-design.md](07-people-load-view-design.md) | ⑤延伸 | PROD-07 升级为顶层「人员与负载」tab（v0.5.1，零 schema，**已实现·独立验收 PASS，仅余真 390px 窄屏 MANUAL_PENDING**） |
| [08-copilot-multistep-design.md](08-copilot-multistep-design.md) | ⑤延伸 | PROD-24 副驾多步规划（PROD-20 增量，零 schema；**已实现·独立验收 PASS，49 项全绿 + 2 项 MANUAL_PENDING**：计划卡/拓扑/整批逐步/链式 baseline，执行仍 ask-apply） |
| [09-web-polish-design.md](09-web-polish-design.md) | ⑤延伸 | v0.5.2 Web polish 三件套（PROD-10 任务来源会议直达 / PROD-09 汇报相邻对比徽标 / PROD-04 Web 改父+原子重编号；零 schema；**已实现·独立验收 27/27 PASS**，落地顺序 10→09→04） |
| [10-schema-v2-design.md](10-schema-v2-design.md) | ⑤延伸 | v0.6.0 schema v2 批（PROD-11 任务 predecessorIds 依赖 / PROD-21 项目 repoUrl·branch / PROD-23 概览健康分 / 崩溃原子恢复；domain v2 兼容[1]、新字段 optional；**已实现·独立验收总门 PASS（48/50，G8/H5 人工待验，绑定 17ccc82+4b533ad）**） |
| [11-collaboration-ready-architecture.md](11-collaboration-ready-architecture.md) | ⑥延伸 | v0.7.0 后「协作就绪」最小架构契约（单用户优先、多人可演进）：actor/tenant/project scope、乐观并发 rev、幂等键命名与 TTL、审计事件、冲突拒绝不合并、纯派生视图、远程 KvUnit 适配层。协作阶段代号 **C1/C2/C3**（刻意区别于稳定性批用例编号 S1/S2/S3）；成功幂等标记按稳定性 S2 短 TTL 落本地 settings（非台账/非授权、in-flight 仍内存）。附 10 条开发验收红线。**docs-only 契约稿，未改代码** |
| [handoff-for-coding-agents.md](handoff-for-coding-agents.md) | — | 给 TRAE/编码 Agent 的接手说明：术语、实施顺序、别重复调研 |

## 编号约定（与仓库既有体系关系）

- `R##`：需求文档里的功能模块需求（已完成 R1–R18）。
- `ADL-###`：技术决策日志。
- `KB-###`：技术知识库条目。
- `OPT-##`：体验优化待办（OPT-01~12 已在 v0.3.0 后全部落地）。
- **`PROD-xx`（本目录新增）**：本次产品评估产出的待开发需求。开发认领时，建议同步在 decision-log 记 ADL、在 changelog 留痕，并把对应 PROD 标为「已开发/认领中」。

## 元信息

- 产出角色：资深产品经理（评估/迭代）
- 日期：2026-10-12
- 基于提交：`882fda4`（main，v0.3.0=4b33b84 之后）
- 边界：本目录只新增产品文档，不改 src/；真实项目数据（p-0001~p-0004）不写入任何文档。
