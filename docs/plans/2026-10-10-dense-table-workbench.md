# 高密度表格工作台 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use frontend-design to implement this plan task-by-task.

**Goal:** 将 R5 Web 面板重构为参考飞书多维表格的高密度项目工作台，并使用右侧抽屉完成编辑。

**Architecture:** 保持 Host 命令、快照接口和 JSON 数据模型不变。客户端改为顶部项目选择器、视图标签、紧凑工具栏和任务/里程碑数据表；新增与编辑复用右侧抽屉，通过现有 `/pm` 命令保存。

**Tech Stack:** React 18、TypeScript、Lucide、CSS container queries、dsh clientBundle。

---

### Task 1: 重构工作台结构

**Files:**
- Modify: `packages/dsh-pm-tool/src/client/panel.tsx`
- Modify: `packages/dsh-pm-tool/src/client/panel.css`

1. 将内部项目侧栏替换为顶部项目选择器。
2. 将默认视图改为任务表格，保留概览和里程碑视图。
3. 增加紧凑工具栏、状态筛选和刷新操作。
4. 构建并修正类型错误。

### Task 2: 实现表格和右侧抽屉

**Files:**
- Modify: `packages/dsh-pm-tool/src/client/panel.tsx`
- Modify: `packages/dsh-pm-tool/src/client/panel.css`
- Modify: `packages/dsh-pm-tool/scripts/verify-web.mjs`

1. 任务表显示 WBS 编号、标题、状态、优先级、负责人、进度、日期和里程碑。
2. 里程碑表显示标题、目标日期、状态和达成日期。
3. 点击行打开右侧抽屉；新增和编辑均通过现有命令保存。
4. 验证抽屉焦点、关闭按钮、状态标签和表格横向滚动。

### Task 3: 浏览器与完整回归

**Files:**
- Modify: `docs/changelog.md`
- Modify: `docs/progress.md`
- Modify: `docs/handoff.md`
- Modify: `docs/onboarding-prompt.md`

1. 运行 `pnpm run build` 和全部 `scripts/verify-*.mjs`。
2. 在真实 dsh 页面验证项目切换、三类视图、任务与里程碑抽屉。
3. 检查桌面/窄屏溢出、控制台和网络错误。
4. 更新项目档案；未经项目所有者授权不提交、不推送。
