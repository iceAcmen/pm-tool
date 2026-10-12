<!--
产出角色：资深产品经理
日期：2026-10-12
基于提交：882fda4
变更摘要：给编码 Agent（TRAE/Cursor/豆包）的接手说明——不用再读一遍产品评估，照此即可开工。
-->

# handoff-for-coding-agents.md · 给编码 Agent 的产品侧交接

> 本文让任何编码 Agent **不依赖本次对话**就能接手产品迭代。读完这份 + `docs/product/05-roadmap-and-tasks.md` 即可开工，不必重复做用户调研。

## 一、这次（2026-10-12，doubao-work 产品角色）新增/修改了什么

**只新增** `docs/product/` 下 8 份文档，未改任何 `src/`、`package.json`、脚本。新增清单：
- `README.md`、`01-current-state-personas.md`、`02-ux-evaluation.md`、`03-incremental-proposals.md`、`04-disruptive-concepts.md`、`05-roadmap-and-tasks.md`（PROD 任务表）、`06-tradeoffs-and-risks.md`、`handoff-for-coding-agents.md`（本文件）。

> **状态校正（2026-10-12，覆盖第三节旧排期）**：下文第三节列的 `PROD-01/02/03/05/22`（任务树 / 记录直达 / 行内编辑 / 概览作战室 / 甘特）**均已实现**；`PROD-20` 是**对话式 AI 项目副驾**，不是早先三个固定 AI 按钮。当前版本保持 **v0.4.0**，下一版本号未定、不得擅定 v0.4.1。这些 PROD 是否还欠收尾，以 `docs/changelog.md` 与最新代码为准。

## 二、开工前必须知道的术语与事实

- **【最高优先级】测试门控（ADL-045）**：当前处于测试稳定阶段。任何新增功能必须走「需求→测试用例→开发→独立测试(功能/集成/网页实测/样式/UX)→修复→复验与受影响回归→专家 PASS」才能开下一功能/进发布候选。`FAIL/BLOCKED/NOT_RUN≠通过`；阻塞期只做修复/补测/文档；完整浏览器实测是硬门槛，不能用 HTTP200/离线 verify 替代；轻微问题不默认豁免。**执行与判定分离**：有 GUI 能力的执行端只按专家用例采集原始证据、不判 PASS；PASS 只能由测试专家审证给出；开发不得既执行又自验收；证据须与被测提交一致、不得自行改用例或把口述当证据；GUI 受阻期间门仍 BLOCKED。**自动化/人工分层（ADL-047）**：可自动化用例全绿即算通过、可推进交付；可自动化项 FAIL 仍阻塞；确实必须用户本人配合（受系统能力/认证所限）的项转 `MANUAL_PENDING`，不算 PASS 也不阻塞；用户反馈失败即重开门；高风险/不可逆仍须人工确认。注意：不是把所有 BLOCKED 自动豁免。测试产物归 `docs/testing/`（测试专家所有，**不要动该目录**）。细则见 `docs/collaboration.md` 第九节。
- **面板是唯一真实界面**：宿主斜杠补全不显示 `/pm`、发送后主区不跳转（ADL-038/KB-037）。所有产品改动默认改 Web 面板 `packages/dsh-pm-tool/src/client/panel.tsx`。
- **通信模型**：面板只有 `execute(line)` 写（翻译成 `/pm 子命令`）和 `web snapshot` 全量读。**新增前端交互优先复用既有后端命令**，别轻易加后端命令。
- **派生都在前端做**：提醒、总览、全局搜索、概览全部基于 snapshot 在浏览器算。新视图照此惯例。
- **数据实体**：projects/tasks/milestones/risk_issues/meetings/reports/deliverables 七表 + checks/settings。schema 在 `src/core/*.ts`（zod）。
- **三条红线**：离线优先 / AI 草稿确认制 / 单用户本地。别引入常驻进程、别做自动写库。

## 三、当前该做什么（2026-10-12 更新）

- **当前主线不是排新功能，而是把现有改动（含 PROD-20 对话副驾）在真实浏览器里测稳、闭环缺陷、由测试专家 PASS**。
- 离线 `verify-*.mjs` 全绿（36 项）**不代表**真面板可用——曾出现离线全绿、真浏览器因 bundle 残留 zod require 崩溃（见 `9b15baa`）。GUI 实测是硬门槛。
- 下一步候选功能（仅建议、须等测试门放行后再议）：先对照 `docs/changelog.md` 核实哪些 PROD 真已落地，再从 `05-roadmap-and-tasks.md` 挑尚未实现且未受阻塞者；**不要凭本文旧排期直接开工**。

## 四、不要重复调研 / 不要踩的坑

- **不要**重新做用户调研或需求分析——01/02 已把现状与问题、证据行号列好。
- **不要**在测试阻塞期开新功能；不要自改产品后自己验收；不要用 HTTP200/纯函数测试冒充 GUI 通过。
- 新控件务必加稳定 `data-*`/class 选择器（verify-web 依赖契约），并补或扩展 `scripts/verify-*.mjs`。
- 开发/测试认领后按仓库惯例在 `decision-log.md` 记 ADL、在 `changelog.md` 留痕（平台标识），并回写 05 任务表状态。

## 五、与既有编号体系的映射

- 本目录 `PROD-xx` 是**产品需求**；流程门控见 `ADL-045`。UX 问题溯源见 `02-ux-evaluation.md`；取舍理由见 `06-tradeoffs-and-risks.md`。
