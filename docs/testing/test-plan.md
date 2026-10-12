<!--
独立测试方案（test-plan）。对应 ADL-045 流程门控的「测试计划与用例」环节。
本文件由独立测试专家所有；结论绑定被测提交 a8e8ea4。
-->
# 独立测试方案（pm-tool）

> 给谁：开发、产品 PM、后续接手平台。
> 是什么：把「测试通过」从口号变成可追溯、可阻断的门。本方案定义测什么、怎么判、什么算通过、不能实测怎么办。
> 被测提交：`a8e8ea4`。

## 1. 测试目标与边界

**目标**：对 dsh-pm-tool（dsh 插件，本地文件持久化、离线优先、单写通道 `execute(/pm …)`、单读通道 `web snapshot`）给出可追溯的质量结论，决定是否允许进入下一功能 / 发布候选。

**测试专家自我边界（硬约束）**：
- 只读产品代码与既有测试脚本；可实施**无需额外权限的非破坏性检查**。
- **不改产品代码**、不改真实 `data/` 与线上服务、不安装依赖、不启动 GUI、不调网络模型、不发布。
- **不**用 shell / puppeteer / 任何方式绕过 GUI 实测能力去「假装」点过页面；做不到就标 BLOCKED。
- 不自行 commit / push（由项目所有者统一安排）；不读/复制任何密钥。

## 2. 被测能力清单（以代码核实，不凭旧路线图）

经 `packages/dsh-pm-tool/src/` 核实，a8e8ea4 已实现（非「未做」）：

| 能力域 | 代码证据 |
|---|---|
| 七实体台账 | `core/{projects,tasks,milestones,risk-issues,meetings,progress-reports,deliverables}.ts`；表名与产品文档一致 |
| 命令面 | `commands/{project,task,milestone,risk-issue,meeting,progress-report,deliverable,search,stats,export,backup,model,due,ask}.ts` |
| 备份/恢复 | `core/backup.ts`：`collectBackup/createBackup/readBackupFile/restoreBackup/precheckBackup`，恢复前自动安全快照 |
| 导入导出 | `core/{export,task-import,csv-import}.ts`；csv/xlsx/markdown/整库 JSON |
| 任务树 | `core/task-tree.ts`；面板 `TaskTree`、折叠（collapse×11） |
| 行内编辑 | `core/task-inline.ts`：nextStatus/clampProgress/cleanDate/buildUpdate |
| 移动/级联 | `core/tasks.ts` moveTask 环保护；`verify-cascade/batch` |
| 作战室/KPI | `core/war-room.ts`：computeKPI/buildAgenda/groupRiskMatrix/matrixCell |
| 甘特 | `core/gantt.ts`：dateRange/barGeometry/shiftDatesByDrag/todayOffset |
| AI 副驾 | `core/{ask-copilot,copilot,ai-client,model-route,wbs-ai,report-narrate,meeting-summarize}.ts`；`commands/ask.ts` |
| 直达 | 面板 `onOpenRecord`（×8）、`data-open-record/data-open-type/data-open-id` |
| 键盘/项目记忆 | `core/panel-kbd.ts`；`verify-keyboard`（reducer）；localStorage 项目记忆 |
| 提醒/到期 | `core/{reminders}.ts`、`commands/due.ts`；`verify-reminders/record-location` |
| 前端 bundle | `client/panel.tsx`(3048行) + `panel.css`(868行)；a8e8ea4 后 `lib/client.js` 仅 `require("react")`、`require("react/jsx-runtime")`，client 源码无 zod |

## 3. 五类判定（与 ADL-045 一致）

| 类别 | 测什么 | 通过标准 | 本轮方法 |
|---|---|---|---|
| **功能** | 域逻辑、命令面、状态机、枚举校验、编号、环保护、留痕 | 真断言（值/行为/负例）成立，退出码 0 | 审计既有 `verify-*.mjs` 断言强度 + 读取隔离回归日志；**不**把纯函数 PASS 当网页 PASS |
| **集成** | 存储往返、并发、重启读回、备份恢复往返、导入解析、原子写/失败清理、项目隔离 | 跨模块真实落盘读回正确，安全门（confirm/快照/预检）生效 | 审计 `verify-integration/backup/csv/xlsx/importmd/cascade/batch/storage/export` |
| **网页实测 GUI** | 真实浏览器：面板加载、七 Tab 渲染、树折叠、直达抽屉、行内编辑落库、甘特拖拽改期、作战室渲染、ask 抽屉、网页恢复 | 真实点击后 DOM 与落库均符合预期，0 console error | **BLOCKED**：本角色无可用 GUI 驱动，禁止 puppeteer/shell 绕过 |
| **页面样式** | 亮/暗主题、390 窄屏、横向溢出、焦点态、空态、加载反馈 | 目视/截图确认无破版、无溢出、可读 | **BLOCKED**：无真实渲染目视手段（旧 27/27 仅覆盖 R5–R12，不含新视图） |
| **用户体验** | j/k/空格/Del/Enter 键盘在树下行为、项目记忆回填、中文文案、确认/取消成本、恢复成本 | 高频操作流畅、取消不写库、成本可预期 | reducer 级已测；**真实键盘事件/流程体验 BLOCKED** |

## 4. 用例设计原则

1. **负例优先于正例**：非法日期（如 2026-02-30）、跨项目改他人记录、缺 confirm 覆盖、重复确认、基线过期（updatedAt 冲突）、坏备份文件、空清单/坏路径。
2. **写动作必须带确认/幂等语义**：AI 草稿、删除、覆盖导出、restore 一律 confirm 才落库；取消即不得写库。
3. **项目隔离**：A 项目的数据不得被 B 项目命令读取/修改/统计串扰。
4. **持久化**：任何写操作跨「新进程重启」读回一致；编号续增不重复。
5. **GUI 不达标不算功能达标**：域函数对了 ≠ 页面能用（ zod bundle 教训，`9b15baa`）。

## 5. 执行与证据规范

- 每条结论绑定：被测提交哈希 + 证据（日志路径 / 断言行 / 代码行）。
- 回归 agent 并行产物（如 `verify-run-*/`、`docs/verification/*.log`）由本专家**独立复核断言**，不直接照搬 PASS。
- 本专家自留审计日志于：
  `/Users/bytedance/Library/Application Support/DoubaoWork/Default/.doubaowork/agent_mode/workspace/.sessions/38446250805701122/agents/s_000EgMVDudw/artifacts/logs/`
- 新提交使任一历史结论受影响 → 该结论标记「过期」，须重测后才能引用。

## 6. 门控结论

- 五类全部 PASS（含 GUI 实测与样式/UX 实测）→ 测试专家签 **PASS**，放行下一功能/发布候选。
- 任一 FAIL/BLOCKED/NOT_RUN → **不放行**；阻塞期只允许缺陷修复、补测、文档，不开新功能。
