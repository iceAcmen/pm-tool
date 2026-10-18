# P2 开发规格 · 深度融合（对外+长寿）

> 性质：真实代码开发，P1（8e7b7b0，326/326 绿）验收通过后的第三阶段。P2 = 对外+长寿层，对应效果图 S4 分受众分享（K18/X5）与 S5 档案与目标连通（K16/X2/X3/X7）。
> 依据：`docs/design/deep-integration-v2-p1-dev.md`（P1 规格，已交付）、`docs/design/deep-integration-v2-designs-rework/SPEC.md`（三栏壳/token/禁用词）、S4/S5 效果图（`scenes/s4-outbound-share/`、`scenes/s5-archive-goal/`）、P1 验证记录。
> 硬约束：延续 P0/P1——不动 3172 运行实例、H6 常驻推送 P3 悬置、K2 窄集口径不变、写操作人确认+可撤销、UI 不注入示例数据、浅深双态 token。

---

## 一、P2 六项能力 → 文件级契约

| 能力 | 技术落点 | 涉及文件 |
|---|---|---|
| K18 单向出站（核心） | 现有 `/pm export` 扩展为三档分受众（技术 MD / 非技术在线增强 HTML 静态快照 / 离线纯文本兜底）；出站日志两类：**审计只增流**（长期保留，append-only）与**动作已发日志**（TTL/归档）；任务卡静态出站关联位只显示不回写；不预设 GitHub（本期仅本地导出+快照文件） | 改 `core/export.ts`、`core/task-export.ts`、`commands/export.ts`（分片A 独占） |
| X7 愿景/OKR 层 | 新表 `okrs`（独立实体：单父 primaryOkrId 主归属 + 软关联「关联目标」行可见不计权重）；agent 代起草归属建议→人确认/忽略，未确认进收件区、季度回访集中清空；周期触发归 K11 仅预留接线点；草稿/定稿复用 X6 机制；习惯层（每日补记/66 天窗口/streak）不在本期 | 新 `core/okr.ts`、`commands/okr.ts`、`okr.test.ts`（分片B 独占；storage 表由契约层注册） |
| X2 收尾标记 | task status 枚举加 `wrapped`（已收尾），deliverable 枚举加 `wrapped`；区别于 done/achieved 正式完成；呈现层标注「已收尾·非正式完成」不越界裁决；逾期/队列/统计/检查的 wrapped 口径统一（收尾不催办、不计 done、不计 open）；AI 直写不得写 wrapped（收尾是人显式决策） | 契约层：`core/status.ts`、`core/deliverable.ts`、`core/labels.ts`；分片C：`core/derived.ts`、`core/check.ts`、`core/queue.ts`、`core/stats.ts`、`core/people-load.ts`、`core/load-stance.ts`、`core/progress-derivation.ts`、`core/reminders.ts`、`core/reflect.ts`（done 钩子不触发）、`core/copilot.ts`（AI 禁写 wrapped）、`core/tasks.ts`/`commands/task.ts`、`core/deliverables.ts`/`commands/deliverable.ts` |
| X3 失败经验 | 新表 `lessons`（失败/烂尾条目的经验沉淀：原因/教训/避免方法，句级 known/pending/blank，留白不编造——复用 X6 草稿纪律）；`lesson add|list|final|edit` | 新 `core/lessons.ts`、`commands/lesson.ts`、`lessons.test.ts`（分片C；storage 表由契约层注册） |
| K16 档案最小保存包 | `archive <项目ID> [目录]`：结项/归档时生成最小可重放数据集（任务/交付物/证据/复盘草稿通用字段 + 字段说明 README），面向自己重放；只读打包不改原数据；区别于 K18（K16=结项归档包，K18=日常分受众分享） | 新 `core/archive.ts`、`commands/archive.ts`、`archive.test.ts`（分片C） |
| X5 述职素材 | `review <项目ID> [起始日期] [结束日期]`：从任务/里程碑/复盘草稿汇总述职素材（做了什么/量化结果/关键产出），JSON + Markdown 双输出，只读聚合 | 新 `core/review-materials.ts`、`commands/review.ts`、`review.test.ts`（分片D） |

## 二、K18 单向出站契约（分片A）

1. **三档分受众**（`/pm export markdown|web|plain <项目ID> [目录] [confirm]` 扩展子命令，兼容既有 markdown 档）：
   - `markdown`（技术读者，既有档保留+补 evidence/deliverable/reflection 引用行）；
   - `web`（非技术在线增强档：自包含单文件 HTML 静态快照，三栏壳 token、浅深双态、无外部依赖、标注「只读快照 · 非实时数据」+ 生成时间 + 示例数据非真实业务的声明位）；
   - `plain`（离线纯文本兜底：无 markdown 符号的纯文本，含生成时间戳）。
2. **出站写=显式触发、单向只增、不级联不镜像**：导出是瞬时快照，导出后外部文件为唯一事实源；工具不做后续同步/镜像；任务状态后续变化不影响已导出文件。
3. **出站日志两类**：
   - 审计只增流（append-only，长期保留）：settings 表条目 `pmExportAudit`（数组只增不删）：`{ at, projectId, format, targetPath, itemCount }`——每次导出追加一条，永不清理（长期保留）；
   - 动作已发日志（TTL/归档）：`pmExportSent`（数组，条目含 `{ at, projectId, format, targetPath }`，TTL=30 天；过期条目在下次导出时自动归档到 `pmExportSentArchive`（同名结构），不再出现在活跃日志；归档也长期保留）。
4. **任务卡静态出站关联位**：任务卡显示「已导出 · 最近 YYYY-MM-DD HH:MM · 外部为唯一事实源」静态标识（从 pmExportAudit 按 projectId 读最近导出时间派生，只显示不回写任务、不触发任何写）；无导出记录则显示「未导出」。
5. **边界**：不预设 GitHub、不写外部平台、不撤持续状态页/实时移动页（用户拍板：先本地导出+只读快照）；快照 HTML 内不嵌入真实业务数据样例（空数据用「暂无数据」占位）。

## 三、X7 愿景/OKR 层契约（分片B）

1. **数据模型**（新表 `okrs`，record schema 由契约层注册）：
   - `id`（`okr-[a-zA-Z0-9_-]+`）、`projectId`、`title`、`kind: 'objective'|'key-result'`、`primaryOkrId: string|null`（单父主归属：KR 的父 OKR，权重归属只认这一条）、`relatedOkrIds: string[]`（软关联「关联目标」行：可见不计权重）、`owner?`、`targetDate?`、`status: 'draft'|'confirmed'|'ignored'`（草稿/定稿复用 X6 机制：draft→confirmed 由人触发）、`createdAt/updatedAt`。
2. **agent 代起草归属建议**：命令 `okr suggest <项目ID> <提案JSON>`（agent 或人从对话/材料提出 OKR/KR 归属建议，纯追加不收修改）：写入 `okr-suggestion` 收件区（settings 条目 `pmOkrInbox`，数组只增；每条 `{ id, at, projectId, title, kind, primaryOkrId, rationale }`）；**未确认不自动生效**（不创建 okr 记录）。
3. **收件区**：`okr inbox <项目ID>` 列出未处理建议；`okr confirm <建议ID>`（人确认 → 创建 okr 记录并标记建议已处理）、`okr ignore <建议ID>`（忽略，建议保留在收件区但标 ignored）；`okr inbox --clear`（季度回访集中清空：人显式触发，清空已处理/已忽略条目）。
4. **CRUD/查询**：`okr add <项目ID> <JSON>`（人直接录入，须 kind + title + primaryOkrId 存在性校验（同项目）+ relatedOkrIds 存在性校验（同项目））、`okr update <okrID> <JSON>`、`okr list <项目ID>`（JSON 树形：按 primaryOkrId 归属、related 行软关联标注 `related:true` 不计权重）、`okr tree <项目ID>`（人类可读缩进视图，软关联行标注「关联」）。
5. **权重语义**：权重只按 primaryOkrId 归属计算（单父）；软关联行可见不计权重——派生纯函数输出每条带 `weightGroup: primaryOkrId` 与 `related: boolean`。
6. **周期触发**：`cycleDue?: string` 字段类型预留（K11 接线点），本期不实现周期调度；习惯层（每日补记/续接/66 天窗口/streak）明确不在本期（P3）。
7. **草稿/定稿**：okr 记录 `status: draft|confirmed`——draft 由人 `okr update {status:'confirmed'}` 定稿；无自动定稿；ignored 仅用于收件区建议。

## 四、X2 收尾标记契约（契约层状态枚举 + 分片C 波及）

1. **状态枚举**（契约层改）：`TASK_STATUSES` 加 `'wrapped'`（标签「已收尾」）；`deliverableStatusSchema` 加 `'wrapped'`；新增谓词 `isWrappedStatus`（status.ts）。
2. **语义**：wrapped = 未完成但已收尾（弃置/停办/不再推进），**不等于 done/achieved**；呈现层标「已收尾·非正式完成」徽章，不越界裁决（不判定成败）。
3. **波及口径（分片C 统一，全仓谓词优先）**：
   - 逾期/催办（derived.isTaskOverdue、reminders、queue）：wrapped **不催办**（已收尾）；
   - 统计（stats/people-load/load-stance）：wrapped **不计 done、不计 open**（单列 wrappedCount 可选）；
   - 进度派生（progress-derivation）：wrapped 不参与 done 派生；
   - 检查（check）：done 类规则不命中 wrapped；
   - X6 done 钩子（reflect）：wrapped **不触发**复盘草稿；
   - **AI 直写禁 wrapped**（copilot.ts status 校验收紧：ask-apply 不得写 wrapped——收尾是人显式决策）；
   - 状态机（命令层）：`task update {status:'wrapped'}` 人显式触发，转换记录历史/溯源。
4. **呈现**（分片D 前端）：tasks/milestones 视图 wrapped 条目徽章「已收尾 · 非正式完成」（灰/中性色，不进入 done 视觉体系）。

## 五、X3 失败经验契约（分片C）

- 新表 `lessons`（record schema 由契约层注册）：`{ id: 'lesson-[...]', projectId, taskId (关联失败/烂尾任务，可空), status: 'draft'|'final', lines: [{text, mark: 'known'|'pending'|'blank'}], gaps: string[], createdAt, updatedAt }`。
- 命令：`lesson add <项目ID> <JSON>`（人录入，来源任务可空）、`lesson list <项目ID>`（只读）、`lesson final <lessonId>`（人定稿）、`lesson edit <lessonId> "<markdown>"`（补材料，句级保守标注）。
- 纪律（复用 X6）：句级 known/pending/blank；证据不足留白不编造；无积分/徽章；仅人触发定稿；草稿可从不自动定稿。
- 失败/烂尾入口：从 wrapped 任务或 K19 烂尾标签任务引导沉淀（呈现层提示入口，不自动建）。

## 六、K16 档案最小保存包契约（分片C）

- `archive <项目ID> [目录] [confirm]`：只读打包——收集任务/交付物/证据（evidenceUrl/repoUrl）/复盘草稿（reflections known 行）/里程碑（achieved）的**通用字段**（id/title/status/progress/dueDate/evidence/deliverableId/复盘摘要等），外加一份 `README-字段说明.md`（每个字段一句话说明）；输出到目录（默认 `exports/archive-<项目ID>-<YYYYMMDD>/`，含 `package.json` 数据集 + `README-字段说明.md`）；文件已存在默认拒绝覆盖（confirm 覆盖）。
- **只读打包**：不修改原数据、不删除原表、不迁移记录；包内数据集带 `exportedAt` 与 `origin: 'pm-tool'` 标注。
- **区别声明**：K16=结项归档包（面向自己重放：最小可重放数据集+字段说明），K18=日常分受众分享（三档格式+出站日志）；`archive` 不写 K18 的审计日志（归档非出站），单独在包内记录 `archivedAt`。

## 七、X5 述职素材契约（分片D）

- `review <项目ID> [起始日期] [结束日期]`：只读聚合——`{ period, tasks: [{id,title,done,progress,dueDate,evidence}]（done 或 wrapped 条目）, milestones: [{title,achieved,actualDate}], reflections: [{title,sourceEvent,known 行}] }` → 返回 JSON + 同一数据渲染的 Markdown 述职稿（做了什么/量化结果/关键产出三段结构），供周报/季报/晋升材料；零写。
- 前端（分片D）：述职素材卡（可折叠，展示最近周期摘要 + 「导出素材」入口走 export 通道）；OKR 视图 `views/okrs.tsx`（树形+收件区入口）；任务卡收尾徽章与出站关联位。

## 八、契约层（组织者先行，分片不重复做）

1. `core/status.ts`：TASK_STATUSES + 'wrapped'、isWrappedStatus 谓词。
2. `core/deliverable.ts`：deliverableStatusSchema + 'wrapped'。
3. `core/labels.ts`：taskStatusLabels + wrapped: '已收尾'。
4. `core/storage.ts`：注册新表 `okrs`（okrRecordSchema）、`lessons`（lessonRecordSchema）。
5. `src/index.ts`：注册 `okr/lesson/review/archive` 路由（骨架命令）+ `web snapshot` 加 `okrs`/`lessons` 字段（读时全量快照，零写）；help 输出。
6. 骨架命令：`commands/okr.ts`、`commands/lesson.ts`、`commands/review.ts`、`commands/archive.ts`。
7. 契约层完成后先跑 build+test 确认基线 326 不回退（含 status 枚举扩展对既有测试的影响）。

## 九、分片职责（文件级互斥）

| 分片 | 范围 | 独占文件 |
|---|---|---|
| A | K18 单向出站 | `core/export.ts`、`core/task-export.ts`、`commands/export.ts` + 新测试（出站日志两类） |
| B | X7 愿景/OKR 层 | 新 `core/okr.ts`、`commands/okr.ts`、`okr.test.ts`（okr 表/收件区/树形/权重） |
| C | X2 波及 + X3 失败经验 + K16 归档包 | `core/derived.ts`、`check.ts`、`queue.ts`、`stats.ts`、`people-load.ts`、`load-stance.ts`、`progress-derivation.ts`、`reminders.ts`、`reflect.ts`、`copilot.ts`、`tasks.ts`/`commands/task.ts`、`deliverables.ts`/`commands/deliverable.ts`；新 `core/lessons.ts`、`commands/lesson.ts`、`core/archive.ts`、`commands/archive.ts` + 测试 |
| D | X5 述职素材 + 前端整合 | 新 `core/review-materials.ts`、`commands/review.ts` + 测试；`src/client/views/okrs.tsx`（新视图）、`src/client/views/tasks.tsx`（收尾徽章+出站关联位）、`src/client/views/milestones.tsx`（如涉及）、`src/client/panel.css`（追加 .pm-okr-*/.pm-export-*/.pm-wrapped-*/.pm-lesson-* 区块） |

**共享文件纪律**：`core/status.ts`/`deliverable.ts`/`labels.ts`/`storage.ts`/`src/index.ts` 仅契约层改（分片不得动）；`panel.css` 分片D 只追加前缀区块；`tasks.tsx` 分片D 独占；`core/copilot.ts`（K2 白名单）分片C 只收紧 wrapped 禁写。

## 十、验收与纪律（延续 P0/P1）

1. 每个分片：`pnpm run build`=0 + `pnpm test` 全量无回归（基线 326）+ 新增测试覆盖。
2. 关键链路真实数据验证（组织者统一）：`verify-p2-*.mjs` 真实命令+真实 JSON 落盘（三档导出文件真实生成、出站日志两类落盘与 TTL 归档、okr 建议→确认/忽略→收件区、wrapped 状态转换与波及口径、lesson 草稿/定稿、archive 包生成、review 聚合）+ 溯源/幂等无破坏；独立临时根，不动 3172。
3. 不夸大：K18 出站只读非双向同步、导出后外部为唯一事实源；X7 agent 只提建议人确认、未确认进收件区不自动生效；X2 收尾≠done；X3/X5 句级标注、留白不编造；K16 最小保存包非全量镜像。
4. 写操作纪律：export/archive 写文件系统（出站写=显式触发，默认拒覆盖 confirm 才覆盖）；okr/lesson 写全可逆（update/ignore 可再确认）；wrapped 人显式；全部走既有领域写路径。
5. 执行纪律：caffeinate；commit 后直接 push；不做 send_message 中途汇报；完成交回（改动清单+验证证据+3172 体验+遗留）。
