<!--
产出角色：资深产品经理
日期：2026-10-12
基于提交：882fda4
变更摘要：给编码 Agent（TRAE/Cursor/豆包）的接手说明——不用再读一遍产品评估，照此即可开工。
-->

# handoff-for-coding-agents.md · 给编码 Agent 的产品侧交接

> 本文让任何编码 Agent **不依赖本次对话**就能接手产品迭代。读完这份 + `docs/product/05-roadmap-and-tasks.md` 即可开工，不必重复做用户调研。

## 一、这次（2026-10-12，doubao-work 产品角色）新增/修改了什么

**只新增** `docs/product/` 下 8 份文档，未改任何 `src/`、`package.json`、脚本，未动 changelog/requirements/decision-log。新增清单：
- `README.md`（索引 + 30 秒结论）
- `01-current-state-personas.md`（现状+画像）
- `02-ux-evaluation.md`（16 条 UX 问题，定位到 panel.tsx 行号）
- `03-incremental-proposals.md`（增量方案+线框）
- `04-disruptive-concepts.md`（颠覆构想+A/B）
- `05-roadmap-and-tasks.md`（**权威 PROD-01~23 任务表**）
- `06-tradeoffs-and-risks.md`（取舍+风险）
- `handoff-for-coding-agents.md`（本文件）

**核心结论**：产品台账（七实体 CRUD+AI 草稿）已扎实；短板在「可视化排期、跨人透视、记录直达、与代码仓库联动」。路线：v0.4 速赢 → v0.5 核心体验 → v0.6 架构演进(domain v2) → v0.7 AI 副驾。

## 二、开工前必须知道的术语与事实

- **面板是唯一真实界面**：宿主斜杠补全不显示 `/pm`、发送后主区不跳转（ADL-038/KB-037）。所有产品改动默认改 Web 面板 `packages/dsh-pm-tool/src/client/panel.tsx`（2619 行单文件）。
- **通信模型**：面板只有 `execute(line)` 写（翻译成 `/pm 子命令`）和 `web snapshot` 全量读。**新增前端交互优先复用既有后端命令**，别轻易加后端命令。
- **派生都在前端做**：提醒、总览、全局搜索、概览全部基于 snapshot 在浏览器算，不请求后端。新视图照此惯例。
- **数据实体**：projects/tasks/milestones/risk_issues/meetings/reports/deliverables 七表 + checks/settings。schema 在 `src/core/*.ts`（zod）。
- **已有、可直接复用的后端能力**：`task move <id> <newParentId|null>`（改父，带环路保护，core/tasks.ts L271）；`task batch update <ids> {json}`；`task update <id> {json}`。
- **三条红线**：离线优先 / AI 草稿确认制 / 单用户本地。别引入常驻进程、别做自动写库。

## 三、建议实施顺序（从这里开始）

1. **先做 v0.4.0 速赢（纯前端、零 schema，最快见效）**：
   - `PROD-02` 提醒/搜索命中直达记录（最高优先，S 成本）。
   - `PROD-08` 顶栏收进「⋯更多」+ 记住 tab。
   - `PROD-09` 汇报趋势徽标、`PROD-10` 会议↔任务反向链接。
2. **再做 v0.5.0 核心体验**：`PROD-01` 任务树视图 → `PROD-03` 行内编辑 → `PROD-06/07` 人员与按人视图 → `PROD-05` 概览作战室。
3. **v0.6.0 才动 schema（domain v2）**：`PROD-11` 依赖字段 → `PROD-22` 甘特 → `PROD-21` 仓库链接 → `PROD-23` 健康分。
4. **v0.7.0+ 旗舰**：`PROD-20` AI 副驾（依赖生产车道 Key）。

## 四、不要重复调研 / 不要踩的坑

- **不要**重新做用户调研或需求分析——01/02 已经把现状和 16 条问题、证据行号列好了。
- **不要**在 v0.4/v0.5 改 `core/storage.ts` 的 domain version——schema 变更只在 v0.6.0 一批做，避免反复迁移。
- **不要**碰另一开发线正在修的文件（OPT-03 项目记忆持久化、OPT-11 空态 CTA）及其关联代码；提交前 `git pull --rebase`。
- **不要**把 Git 自动桥、常驻推送、关键路径排期排进近期——已在 06 标记为「明确不做/长期观望」。
- 新控件务必加稳定 `data-*`/class 选择器（verify-web 依赖契约），每个 PROD 补或扩展一个 `scripts/verify-*.mjs`。
- 开发认领 PROD 时，按仓库惯例在 `decision-log.md` 记 ADL、在 `changelog.md` 留痕（平台标识 `trae`/`doubao-work`），并回写 05 任务表的状态。

## 五、与既有编号体系的映射

- 本目录 `PROD-xx` 是**新需求**；开发落地后，功能层面若要进 requirements，建议映射为 R19+。
- UX 问题溯源见 `02-ux-evaluation.md`；取舍理由见 `06-tradeoffs-and-risks.md`。
