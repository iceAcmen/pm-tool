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

- **产品**：离线优先、单用户、本地文件持久化的 PM 工作台插件（dsh 之上，七实体台账已闭环：项目/任务WBS/里程碑/风险问题/会议/汇报/交付物）。
- **一句话诊断**：**台账骨架很扎实，短板集中在「看」和「连」**——① WBS 树在 Web 上被状态分组打散了；② 没有排期/甘特视图；③ 没有跨人负载视角；④ 与代码仓库零联动；⑤ AI 是三个固定按钮而非副驾。
- **最该先做（v0.4.0 速赢）**：`PROD-02` 提醒/搜索命中直达记录、`PROD-01` 任务树视图。
- **最值得押注的两个颠覆方向**：`PROD-20` AI 项目副驾（发挥 dsh+结构化台账独有优势）、`PROD-22` 甘特排期台（补最核心的「排期」缺失）。
- **三条红线不可破**：离线优先 / AI 草稿确认制 / 单用户本地。

## 文档索引

| 文件 | 对应工作流段落 | 内容 |
|---|---|---|
| [01-current-state-personas.md](01-current-state-personas.md) | ① | 产品现状、技术骨架、七实体、版本能力、4 类用户画像 |
| [02-ux-evaluation.md](02-ux-evaluation.md) | ② | 16 条 UX 问题清单，按 S1/S2/S3 分级，每条定位到 panel.tsx 行号 |
| [03-incremental-proposals.md](03-incremental-proposals.md) | ③ | 10 个增量方案，含线框、收益/成本/风险/优先级 |
| [04-disruptive-concepts.md](04-disruptive-concepts.md) | ④ | 4 个颠覆方向，重大分支给 A/B 对比与推荐 |
| [05-roadmap-and-tasks.md](05-roadmap-and-tasks.md) | ⑤ | **权威 PROD 任务表**：15 项需求、迭代划分、验收标准、编码提示 |
| [06-tradeoffs-and-risks.md](06-tradeoffs-and-risks.md) | ⑥ | 取舍记录、风险登记、明确不做什么 |
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
