# P1 开发规格 · 深度融合（呈现+交互）

> 性质：真实代码开发，P0（73037f7，282/282 绿）验收通过后的第二阶段。P1 = 呈现+交互层，对应效果图 S1 完整化（K11 补记队列+K13 投影）与 S3 深化（K6 完整版+X6-L2 完整复盘草稿流），另含 K19 保护面组件并入呈现层。
> 依据：`docs/design/deep-integration-v2-p0-dev.md`（P0 规格，已交付）、`docs/design/deep-integration-v2-designs-rework/SPEC.md`（三栏壳/token/五问/禁用词）、S1/S3 效果图（`scenes/s1-morning-queue/`、`scenes/s3-completion/`）、`docs/design/deep-integration-v2-p0-verify.md`（P0 验证记录）。
> 硬约束：延续 P0——不动 3172 运行实例、H6 常驻推送本期不实现（P3）、K2/H5 窄集口径不变、写操作人确认+可撤销、UI 不注入示例数据、前端新组件遵循 SPEC.md token 与浅深双态。

---

## 一、P1 五项能力 → 文件级契约

| 能力 | 技术落点 | 涉及文件 |
|---|---|---|
| K11 补记队列（核心，读时派生） | settings 条目存打开打卡/mute/静默时段；core/queue.ts 纯函数派生（到期未达/严重度>到期排序/积压迟到标识/Top1+折叠/mute 二态/关键项豁免/K9 缺席/时段静默降级）；命令 queue open/list/mute/unmute/quiet；web snapshot 扩展 queue 字段 | 新 `core/queue.ts`、`commands/queue.ts`、`queue.test.ts`；改 `src/index.ts`（路由 + snapshot queue 段）；前端消费方在分片D |
| K13 对话内只读投影 | CopilotPanel AI 回答旁投影相关任务卡/处理结果/下一步入口；**防过时：投影渲染时重新读最新任务状态（非 ask 时刻快照），标注「数据截至」+ 刷新** | 改 `src/client/panel.tsx`、`panel.css`；必要时 `src/commands/ask.ts`（投影数据透传，最小改动） |
| K6 完整版（呈现） | P0 check 命令已覆盖五类规则（未回应/日期冲突/缺依据口径在），P1 主体=前端把检查结果可视化（S3 场景卡），规则仅在有明确缺口时补 | 改 `src/client/views/tasks.tsx` + `tasks.css`（分片E） |
| X6-L2 完整复盘草稿流 | sourceEvent 枚举扩 'milestone-achieved'/'deliverable-accepted'；milestones.ts update 状态变 achieved 钩子、deliverables.ts update 状态变 accepted 钩子（参照 tasks.ts done 钩子单点模式）→ 完整草稿（含关联任务/交付物清单行、证据留白）；reflect 查看/final/edit 复用；**P0 遗留补齐：task.deliverableId 存在性/同项目校验** | 改 `src/core/storage.ts`（枚举，契约层）、`src/core/milestones.ts`、`src/core/deliverables.ts`、`src/core/reflect.ts`、`src/core/task.ts`+`tasks.ts`（deliverableId 校验）；新 `reflect-l2.test.ts` |
| K19 保护面组件 | 后端派生：负载纯事实陈列数据 + 「建议砍/缓」文案 + 烂尾立场过滤标签（startDate 久远且 progress 长期不变）+ 时段静默并入 K11；不做 WIP 硬上限/拒单闸 | 新 `core/load-stance.ts` + 单测（分片C）；前端 people.tsx 负载卡（分片E） |

---

## 二、K11 补记队列（核心，读时派生）详细契约

### 2.1 数据（settings 表条目，均为单条记录 value 对象）
- `pmQueueOpened`：`{ [projectId]: { at: ISO } }` —— 每次 `/pm queue open <pid>` 或 snapshot 携带 queue 时刷新为 now（打开打卡；lastOpenedAt 用于「自上次以来到期未达」）。
- `pmQueueMute`：`{ [taskId]: { mutedAt: ISO, ttlDays: number } }` —— 二态静音：mute 压制「主动投递」（首屏 Top1 高亮/打扰），**不隐藏打开视图的折叠列表**（折叠区仍可见，标注「已静音」）；`ttlDays` 到期自动失效（派生时清理）。
- `pmQueueQuiet`：`{ from: 'HH:MM', to: 'HH:MM' }` 或 `{ off: true }` —— 时段静默（K19 并入）：当前本地时间在静默时段内 → 队列卡降级为不打扰样式（不首屏高亮 Top1，仅折叠列示），条目仍可见。

### 2.2 派生规则（core/queue.ts 纯函数，today 注入，零墙钟零写）
输入：tasks（含 dueDate/status/progress/priority/updatedAt/description）、sessions（K9 绑定）、openedAt、mute 表、quiet 时段、today。
1. **到期未达**：`dueDate <= today`（或 `lastOpenedAt 之后到期且已逾期`）且 `status !== done` 且 `progress < 100`。
2. **排序**：先按严重度（blocked > P0 > 逾期天数 > 到期日），再按到期时间升序（严重度>到期时间排序口径）。
3. **积压迟到标识**：`dueDate < today - LATE_DAYS(默认3)` → 条目带 `lateDays`（迟到 N 天标签）。
4. **Top1+折叠**：返回 `{ top: item|null, rest: item[] }`；top 仅在非静默时段且非 mute 或关键项豁免时取；关键项豁免= blocked 或 lateDays>0 的条目即使 mute 也进 top。
5. **mute 二态**：muted 且未过期 → 从主动投递（top）排除，折叠列表可见并标「已静音」；过期自动失效。
6. **K9 缺席队列**：sessions 表有该任务绑定，且任务 `updatedAt === createdAt`（绑定后无任何更新）→ 缺席条目「会话有结存，任务未跟进」。
7. **时段静默**：当前 HH:MM 在 quiet 内 → `quietMode: true`，top 置空、rest 保留。
8. **预留接线点**：`cycleDue?: boolean`（X7 周期触发）、`backfill?: string[]`（X8 待回填提醒）字段本期不产出数据，仅类型预留。

### 2.3 命令（commands/queue.ts）
- `/pm queue open <项目ID>`：打卡（写 pmQueueOpened）→ 返回队列 JSON（同 list）。
- `/pm queue list <项目ID>`：只读返回队列 JSON（`{top, rest, quietMode, openedAt}`）。
- `/pm queue mute <任务ID> [天数=7]`：写 pmQueueMute（可撤销=unmute）。
- `/pm queue unmute <任务ID>`：清除。
- `/pm queue quiet <HH:MM> <HH:MM>` / `/pm queue quiet off`：写/清静默时段。
- web snapshot 的 `queue` 字段：按当前项目列表逐个派生（供前端打开视图直接消费，读时派生、零写）。

---

## 三、K13 对话内只读投影契约（分片B）

- 位置：CopilotPanel（panel.tsx）AI 回答正文之后；投影卡组件（只读）。
- 内容：相关任务卡（标题/状态/进度/截止/证据有无）+ 处理结果（ask-apply 落库后的任务变化摘要）+ 下一步入口（打开任务/继续追问等入口，入口动作复用既有命令，不做新写路径）。
- **防过时（用户明确反感点）**：投影渲染时用**最新**任务状态（从面板当前持有的最新领域数据/快照读取，而非 ask 发起时刻的数据）；卡片标注「数据截至 HH:MM:SS」；提供「刷新」入口（重新读取）；ask 旧会话的历史卡片同样适用（渲染时刷新）。
- 与既有视图关系：投影是对话内只读卡片，不改甘特/任务列表等原视图；浅深双态 token 走 SPEC.md。
- ask.ts 最小改动：若现有返回已含任务 id 引用（文本/refs），投影数据由前端从最新快照自行关联；后端不改或最小透传。

## 四、X6-L2 完整复盘草稿流契约（分片C）

- `storage.ts`（契约层已改）：reflectionRecordSchema 的 `sourceEvent` 枚举 `['task-done','milestone-achieved','deliverable-accepted']`。
- 钩子（参照 P0 tasks.ts done 钩子，best-effort 不阻断落库，幂等不重复建）：
  - `milestones.ts` updateMilestone：`current.status !== 'achieved' && fields.status === 'achieved'` → ensureReflectionOnMilestone。
  - `deliverables.ts` updateDeliverable：`current.status !== 'accepted' && fields.status === 'accepted'` → ensureReflectionOnDeliverable。
- 草稿模板（reflect.ts 扩展 buildReflectionDraft）：
  - milestone：title=`${title} · 里程碑达成复盘（草稿）`；known 行=达成日期+摘要；**关联任务清单行**（task.milestoneId 反查，未完成/无证据任务标 pending）；gaps=未达成的关联任务/缺证据清单（留白不编造）。
  - deliverable：title=`${name} · 交付验收复盘（草稿）`；known 行=验收状态+验收材料摘要；**关联任务行**（task.deliverableId 反查）；gaps=验收证据缺失清单。
  - 克制清单不变：无积分/连胜/动效/徽章；句级已核/待核/留白；仅事件触发。
- 定稿流：reflect final（人定稿）、edit（补材料）复用；「正式复盘会」由人组织（工具只提供草稿承载，不模拟会议）。
- **P0 遗留补齐**：task.deliverableId 存在性/同项目校验——`tasks.ts` updateTask 加 `validateDeliverableRelation`（参照 validateMilestoneRelation），新增 `TaskDeliverableNotFoundError`/`TaskDeliverableProjectMismatchError`。

## 五、K19 保护面组件契约（分片C 后端 + 分片E 前端）

- `core/load-stance.ts` 纯函数（today 注入，输出形状固定供分片E 前端消费，零写零墙钟）：
  - `loadFacts(people 派生输入)`：`{ personId, name, taskCount, openCount, overdueCount, doneCount }[]` 纯事实陈列（人员/任务数/未完成数/逾期数/已完成数），不换算倦怠、不做裁决。
  - `stanceSuggestions(tasks)`：`{ taskId, title, stance: 'cut'|'slow', reason, dueDate? }[]`——拖期（dueDate 逾期且未 done）或 blocked 长时（>3 天）→ 建议砍（cut）/缓（slow）条目，措辞含「建议供人决策，不自动执行」。
  - `staleStanceTags(tasks)`：`{ taskId, title, tag: '烂尾倾向', daysSinceStart, daysSinceUpdate }[]`——startDate 距今 >30 天且 progress 长期未变（updatedAt 距今 >7 天且 progress<50）→ 「烂尾倾向」过滤标签（供前端筛选，非裁决）。
  - 时段静默数据来自 K11 quiet（分片A 的 settings 条目），K19 前端复用。
- 前端 people.tsx：负载卡加建议文案与烂尾标签（纯事实呈现、可筛选）。

## 六、分片职责（文件级互斥）

| 分片 | 范围 | 独占文件 |
|---|---|---|
| A | K11 后端（core/queue.ts + commands/queue.ts + queue.test.ts + index.ts 路由/snapshot queue 段） | core/queue.ts、commands/queue.ts、index.ts（本批唯一改动方） |
| B | K13 投影（panel.tsx + panel.css 投影区块 + ask.ts 最小透传） | panel.tsx、panel.css（投影区块）、ask.ts |
| C | X6-L2 后端 + K19 派生（milestones/deliverables/reflect/tasks/task.ts + core/load-stance.ts + 单测） | 上述 core 文件（不含 storage.ts 枚举，已由契约层改） |
| D | K11 前端队列卡（board/ 看板卡 + panel.css 队列区块 + 交互） | src/client/board/（widgets.tsx/BoardBento.tsx/对应 css） |
| E | K19 负载卡 + K6 检查卡（people.tsx + tasks.tsx + 各自 css） | views/people.tsx、views/tasks.tsx、people.css、tasks.css |

**共享文件纪律**：panel.css 是共享样式文件——分片 B（投影区块 .pm-proj-*）、D（队列区块 .pm-queue-*）、E（负载/检查区块 .pm-stance-*/.pm-check-*）各自**只追加自己前缀的区块**，不得改动他人区块；改动后各自跑 `pnpm build` + `pnpm test` 无回归。

## 七、验收与纪律（延续 P0）

1. 每个分片：`pnpm run build`=0 + `pnpm test` 全量无回归（基线 282）+ 新增测试覆盖；前端分片渲染自检（浅深两态桌面 + 390 移动，可用既有 html skill 截图机制或构建后人工核验说明）。
2. 关键链路真实数据验证（组织者统一）：`verify-p1-*.mjs` 真实命令 + 真实 JSON 落盘（queue open/mute/quiet 写读、X6-L2 钩子真实落盘、deliverableId 校验负例、K19 派生输出）+ 溯源/幂等无破坏；独立临时根，不动 3172。
3. 不夸大：K11 打开时呈现≠常驻推送（H6 悬置标注保持）；K6 提示≠人验收；X6-L2 完整草稿≠定稿（复盘会/人确认）；K19 仅建议无裁决。
4. 写操作纪律：queue mute/unmute/quiet 均可逆；X6-L2 钩子 best-effort 不阻断落库；全部走既有领域写路径。
5. 执行纪律：caffeinate 检查；commit 后直接 push（用户已授权）；不做 send_message 中途汇报；完成交回最终结果（改动清单+验证证据+3172 体验+遗留）。
