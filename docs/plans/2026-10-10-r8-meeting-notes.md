# R8 Meeting Notes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在现有 dsh 插件内实现离线会议纪要、内嵌行动项、任务/问题关联和 Web 工作台，并为行动项转 WBS 任务保留兼容接口。

**Architecture:** 在 `pmtool` version 1 领域新增 `meetings` per-record 表。Host 统一维护会议、行动项和跨表关联规则，命令与 Web 只调用 Host；行动项内嵌于会议但使用稳定 ID，未来可新增 promote 命令而不迁移数据。

**Tech Stack:** TypeScript、Zod、Cordis、dsh storage-domain/storage-json、React 18、tsdown、Node 确定性验证脚本。

---

### Task 1: 先定义会议与行动项 schema

**Files:**
- Create: `packages/dsh-pm-tool/src/core/meeting.ts`
- Modify: `packages/dsh-pm-tool/src/core/storage.ts`
- Test: `packages/dsh-pm-tool/scripts/verify-meetings.mjs`

1. 在专项脚本写失败用例，覆盖日期、时间、时长、状态、来源字段、行动项状态及未知字段。
2. 运行 `pnpm run build` 或专项脚本，确认因模块/表缺失失败。
3. 实现 Meeting/MeetingAction strict schema、默认值、中文标签和错误描述。
4. 新增 `meetings` 表，领域版本保持 1。
5. 构建并运行 schema 用例，预期通过。

### Task 2: 实现会议 CRUD 和项目删除保护

**Files:**
- Create: `packages/dsh-pm-tool/src/core/meetings.ts`
- Create: `packages/dsh-pm-tool/src/commands/meeting.ts`
- Modify: `packages/dsh-pm-tool/src/core/projects.ts`
- Modify: `packages/dsh-pm-tool/src/commands/project.ts`
- Modify: `packages/dsh-pm-tool/src/index.ts`
- Test: `packages/dsh-pm-tool/scripts/verify-meetings.mjs`

1. 增加会议新增、列表、详情、更新、确认删除的失败测试。
2. 实现 `mtg-NNNN` 分配、项目存在校验、日期降序列表和副本隔离，复用 `enqueueDomainWrite()`。
3. 实现 `/pm meeting add/list/get/update/delete` 中文命令；会议更新禁止直接替换 `actions`。
4. 项目删除扫描 `meetings` 表并给出中文处理建议。
5. 运行专项脚本，确认 CRUD、并发 ID、故障恢复、0700/0600 和重启读回通过。

### Task 3: 实现行动项 CRUD 与跨表关联

**Files:**
- Modify: `packages/dsh-pm-tool/src/core/meetings.ts`
- Modify: `packages/dsh-pm-tool/src/commands/meeting.ts`
- Modify: `packages/dsh-pm-tool/src/core/tasks.ts`
- Modify: `packages/dsh-pm-tool/src/commands/task.ts`
- Modify: `packages/dsh-pm-tool/src/core/risk-issues.ts`
- Modify: `packages/dsh-pm-tool/src/commands/risk-issue.ts`
- Test: `packages/dsh-pm-tool/scripts/verify-meetings.mjs`
- Test: `packages/dsh-pm-tool/scripts/verify-tasks.mjs`
- Test: `packages/dsh-pm-tool/scripts/verify-risk-issues.mjs`

1. 写行动项增改删、稳定编号、完成状态、关联任务/问题的失败测试。
2. 实现 `ai-NNN` 按会议内最大编号追加，删除后不复用。
3. 新增 `meeting action add/update/delete`；删除必须带 `confirm`。
4. 校验任务和问题存在、同项目，且 `riskIssueId` 仅接受 `type=issue`。
5. 任务/问题删除前扫描 meetings，存在引用则阻止；所有检查进入领域业务队列。
6. 预留纯内部 `promote` 所需字段和映射说明，但不注册命令、不创建任务。
7. 运行三个专项脚本，确认关联与删除保护通过。

### Task 4: 接入 Web snapshot 与会议工作台

**Files:**
- Modify: `packages/dsh-pm-tool/src/index.ts`
- Modify: `packages/dsh-pm-tool/src/client/panel.tsx`
- Modify: `packages/dsh-pm-tool/src/client/panel.css`
- Modify: `packages/dsh-pm-tool/scripts/verify-web.mjs`

1. Web fixture 新增会议、行动项及关联对象，断言 snapshot 包含 `meetings`。
2. 扩展客户端类型、View、Drawer 和项目顶部会议数。
3. 增加会议表格、状态筛选、搜索、日期排序和行动项完成统计。
4. 增加会议抽屉；议题/决议使用可增删文本列表，行动项使用独立编辑区和任务/问题下拉。
5. 所有写操作通过 `/pm meeting` Host 命令，删除使用确认。
6. 扩展 bundle/主题契约，运行构建与 `verify-web.mjs`。

### Task 5: 完整回归与真实浏览器验收

**Files:**
- Modify: `docs/test-cases.md`

1. 执行 `pnpm install --offline --frozen-lockfile` 和 `pnpm run build`。
2. 运行 command/export/meetings/milestones/projects/risk-issues/storage/tasks/web 九个脚本。
3. 使用隔离 `DSH_HOME` 和隔离数据目录启动真实 pm profile。
4. 浏览器验证会议/行动项 CRUD、任务/问题关联、筛选、删除保护和重启读回。
5. 检查浅色/深色、786px 窄屏、表格局部滚动、控制台和网络。
6. 停止服务并清理隔离目录，执行 `git diff --check`。

### Task 6: 同步权威档案并等待版本控制授权

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `packages/dsh-pm-tool/README.md`
- Modify: `docs/requirements.md`
- Modify: `docs/decision-log.md`
- Modify: `docs/knowledge-base.md`
- Modify: `docs/issues-and-solutions.md`（仅实际踩坑时）
- Modify: `docs/changelog.md`
- Modify: `docs/progress.md`
- Modify: `docs/handoff.md`
- Modify: `docs/onboarding-prompt.md`
- Modify: `docs/test-cases.md`
- Modify: `docs/delivery.md`

1. 记录 R8 字段、命令、Web 能力、未来 promote 边界和验证证据。
2. 需求版本从 v0.5 升为 v0.6，新增 ADL-025；经验证的模式写入 KB。
3. 完整回归全部通过后回报改动、命令、退出码、关键证据和未覆盖边界。
4. 分别询问是否提交、是否推送；未经授权不执行版本控制动作。
