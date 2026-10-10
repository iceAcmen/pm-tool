# R7 Risk and Issue Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在现有 dsh 插件内实现风险与问题的离线 CRUD、状态筛选、持久化和 Web 工作台。

**Architecture:** 在 `pmtool` version 1 领域中新增 `risk_issues` per-record 表，Host 侧集中维护 schema 与业务规则，命令和 Web 都复用同一处理器。Web 快照只读聚合新表，客户端沿用现有高密度表格与右侧抽屉。

**Tech Stack:** TypeScript、Zod、Cordis、dsh storage-domain/storage-json、React 18、tsdown、Node 确定性验证脚本。

---

### Task 1: 定义实体与存储表

**Files:**
- Create: `packages/dsh-pm-tool/src/core/risk-issue.ts`
- Modify: `packages/dsh-pm-tool/src/core/storage.ts`

1. 写 strict record/create/update schema 和中文字段错误映射。
2. 固化 type、status、probability、impact 枚举及标签。
3. 对风险/问题专有字段执行交叉校验。
4. 在 version 1 领域新增 `risk_issues` 表，保留旧表和旧记录兼容。
5. 运行 `pnpm run build`，预期类型检查通过。

### Task 2: 实现领域业务与离线命令

**Files:**
- Create: `packages/dsh-pm-tool/src/core/risk-issues.ts`
- Create: `packages/dsh-pm-tool/src/commands/risk-issue.ts`
- Modify: `packages/dsh-pm-tool/src/core/projects.ts`
- Modify: `packages/dsh-pm-tool/src/index.ts`

1. 实现 `add/list/get/update/delete`，复用 `enqueueDomainWrite`。
2. 新增 ID 按 `ri-NNNN` 递增，列表按状态过滤后以 ID 稳定排序。
3. 新增/更新检查项目存在；项目删除扫描新表。
4. 实现 `/pm risk-issue` 帮助、JSON 解析、中文输出和 `confirm` 删除。
5. Web snapshot 增加 `riskIssues`。
6. 运行构建，预期通过。

### Task 3: 先写专项验证再补齐实现

**Files:**
- Create: `packages/dsh-pm-tool/scripts/verify-risk-issues.mjs`
- Modify: `packages/dsh-pm-tool/scripts/verify-projects.mjs`

1. 覆盖风险/问题新增、默认值、更新、关闭、类型/状态筛选和确认删除。
2. 覆盖非法枚举、类型专有字段、不存在项目和未知字段。
3. 覆盖并发 ID、写失败恢复、项目删除保护、0700/0600 和全新进程读回。
4. 扩展项目测试旧表声明兼容。
5. 执行 `pnpm run build && node scripts/verify-risk-issues.mjs`，修复直至退出码 0。

### Task 4: 扩展 Web 工作台

**Files:**
- Modify: `packages/dsh-pm-tool/src/client/panel.tsx`
- Modify: `packages/dsh-pm-tool/src/client/panel.css`
- Modify: `packages/dsh-pm-tool/scripts/verify-web.mjs`

1. 扩展 Snapshot、View 和 Drawer 类型。
2. 增加“风险与问题”标签、记录数和高密度表格。
3. 增加搜索、类型/状态筛选、状态标签和右侧新增/编辑抽屉。
4. 删除走 `window.confirm` + Host `confirm` 命令。
5. 扩展 Web 契约测试，确认 bundle 无额外外部模块。
6. 运行构建和 `verify-web.mjs`，预期退出码 0。

### Task 5: 完整回归与真实浏览器验证

**Files:**
- Modify: `docs/test-cases.md`

1. 运行冻结锁文件安装、构建和全部 `scripts/verify-*.mjs`。
2. 使用隔离 `DSH_HOME` 启动真实 pm profile。
3. 在浏览器验证风险/问题新增、编辑、关闭、筛选、删除和重启读回。
4. 检查浅色/深色、窄工作区、控制台和网络。
5. 清理验证记录并停止临时服务。

### Task 6: 同步权威档案

**Files:**
- Modify: `packages/dsh-pm-tool/README.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/requirements.md`
- Modify: `docs/decision-log.md`
- Modify: `docs/knowledge-base.md`
- Modify: `docs/changelog.md`
- Modify: `docs/progress.md`
- Modify: `docs/handoff.md`
- Modify: `docs/onboarding-prompt.md`
- Modify: `docs/delivery.md`
- Modify: `docs/test-cases.md`

1. 记录 R7 数据模型、命令、Web 能力和验收证据。
2. 新增 ADL 决策和 KB 复用模式；踩坑仅在实际发生时新增 ISS。
3. 执行 `git diff --check`。
4. 回报改动、完整测试结果和未覆盖边界；提交与推送分别等待授权。
