# R9 Progress Report Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现自定义日期范围、固定快照、默认摘要与异常项 Markdown 的离线进度汇报闭环。

**Architecture:** 在 `pmtool` 领域新增 `reports` per-record 表。Host 在生成时聚合当前业务表并固化快照，后续只允许编辑人工叙述；Web 和 Markdown 均消费已保存快照。

**Tech Stack:** TypeScript、Zod、Cordis、storage-domain/storage-json、React 18、Node 确定性脚本。

---

### Task 1: Schema 与固定快照

**Files:**
- Create: `packages/dsh-pm-tool/src/core/progress-report.ts`
- Create: `packages/dsh-pm-tool/src/core/progress-reports.ts`
- Modify: `packages/dsh-pm-tool/src/core/storage.ts`
- Test: `packages/dsh-pm-tool/scripts/verify-reports.mjs`

实现 strict schema、日期范围校验、`rpt-NNNN`、聚合指标、周期事件、异常项、固定快照及领域写队列。

### Task 2: 命令、删除保护与 Markdown

**Files:**
- Create: `packages/dsh-pm-tool/src/commands/progress-report.ts`
- Create: `packages/dsh-pm-tool/src/core/progress-report-markdown.ts`
- Modify: `packages/dsh-pm-tool/src/core/export.ts`
- Modify: `packages/dsh-pm-tool/src/core/projects.ts`
- Modify: `packages/dsh-pm-tool/src/commands/project.ts`
- Modify: `packages/dsh-pm-tool/src/index.ts`
- Test: `packages/dsh-pm-tool/scripts/verify-reports.mjs`

实现 generate/list/get/update/delete/export、confirm 保护、项目删除保护及摘要/异常项 Markdown 原子导出。

### Task 3: Web 工作台

**Files:**
- Modify: `packages/dsh-pm-tool/src/client/panel.tsx`
- Modify: `packages/dsh-pm-tool/src/client/panel.css`
- Modify: `packages/dsh-pm-tool/scripts/verify-web.mjs`

增加报告标签页、表格、筛选、搜索、快照抽屉、异常展示和导出入口。

### Task 4: 回归与档案

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `packages/dsh-pm-tool/README.md`
- Modify: `docs/{requirements,decision-log,changelog,knowledge-base,issues-and-solutions,progress,handoff,onboarding-prompt,test-cases,delivery}.md`

执行冻结安装、构建、全部十个验证脚本、隔离 profile 真实浏览器、重启读回和 `git diff --check`；更新 v0.7、ADL-026 和交接状态，完成后分别询问提交与推送授权。
