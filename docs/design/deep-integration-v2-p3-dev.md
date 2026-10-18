# P3 深度融合：纵向+宿主（X7 习惯层 / K11 周期接线 / H6 立项调研）

> 日期：2026-10-18 · 状态：开发中 · 上游：P2=07c23e0 验收通过（399/399、隔离 84/84、集成 56/56）
> 定位：P0 底座+采集闭环 → P1 呈现+交互 → P2 对外+长寿 → **P3 纵向（习惯/周期）+ 宿主（H6 调研拍板）**
> 设计对齐：`docs/design/deep-integration-v2-designs-rework/SPEC.md` 与 `scenes/s5-archive-goal/`（S5 档案与目标连通）；H6 场景 `scenes/h6-proactive-vision/说明.md`（期望示意，当前未实现）
> 决策不变项：H6 按「调研→结论→用户拍板」执行，**不得直接开发常驻推送**；习惯层不引入激励动效（无积分/连胜动效/徽章）；周期触发仅占位不启用

## 一、范围与性质

P3 含**两类性质不同的任务**：

| 项 | 性质 | 交付 |
|---|---|---|
| X7 习惯层 | 可开发 | 后端+前端+测试 |
| K11 周期触发接线 | 可开发（占位） | 数据结构+钩子占位+注释说明 |
| H6 常驻推送 | **立项调研（不开发）** | 结论文档（证据分级 E1-E6）→ 用户拍板后再决定 |

## 二、X7 习惯层（可开发）契约

### 2.1 能力清单
1. **会话派生习惯（只提建议，轻确认）**：从对话/任务规律提炼习惯建议——只读观察（如任务时间模式、复盘已知行、OKR 周期），产出建议条目进收件区（复用 P2 X7 `pmOkrInbox` 模式：未确认不生效）。建议字段：`{ id, at, kind:'session-derived', title, rationale, status:'pending' }`。
2. **轻确认/会话外轻补记（2 天补记窗回填）**：习惯打卡支持「当天+过去 2 天」回填（补记窗=2 天）；补记标记 `backfilled:true` 与日期可见；**空日如实留空**（不自动补、不伪造）。
3. **streak 连续段档案**：连续签断签超窗（>2 天缺口）→ 当前 streak 重置 0；**累计档案永久保留**：`longestStreak`（最长连续段）、`totalDays`（累计天数）存表不随断签清零；克制清单延续：**无积分/连胜动效/徽章**，仅文本归档（streak 以「当前连续 N 天 · 历史最长 M 天 · 累计 X 天」纯文本呈现）。
4. **依赖 P2 愿景/OKR 层实体**：习惯条目可关联 `okrId`（同项目存在性校验，复用 okr 校验模式）；习惯统计可按 OKR 维度聚合（只读派生）。
5. **草稿/定稿复用 X6 机制**：习惯条目/习惯档案的正式化走 draft→final 由人定稿（复用 reflect 的 finalize 模式：幂等、仅人触发）。
6. **周期触发归 K11 仅预留接线**：习惯的每日归档/回访触发点只留类型与钩子占位（见 §三），不实现调度器。

### 2.2 数据模型（契约层新增，`src/core/storage.ts`）

```
habitRecordSchema（表 habits）:
  id: habit-[a-zA-Z0-9_-]+
  projectId: string
  okrId?: string            # 可选关联 P2 OKR（同项目校验）
  title: string             # 习惯名（人录入或建议确认后落）
  status: 'draft'|'confirmed'|'final'   # draft 建议/录入 → confirmed 人确认 → final 人定稿
  checkIns: [{ at: ISO, backfilled: boolean, note?: string }]   # 打卡记录；回填标 backfilled
  streak: { current: number, lastDate?: string, longest: number, totalDays: number }
  createdAt/updatedAt: ISO
```

```
habitSuggestionSchema（settings 键 pmHabitInbox，信封 { entries: [...] } 复用 pmOkrInbox 模式）:
  { id, at, projectId, title, rationale, okrId?, status: 'pending'|'confirmed'|'ignored' }
```

### 2.3 命令（`commands/habit.ts`，8 子命令）
```
/pm habit add <项目ID> <JSON>         人录入习惯（draft）
/pm habit checkin <habitID> [YYYY-MM-DD] [note]   打卡；缺省今天；允许过去 2 天回填（backfilled:true）
/pm habit list <项目ID>               只读列出（含 streak 文本档案）
/pm habit suggest <项目ID> <JSON>     agent 代起草习惯建议 → 只进收件区（未确认不生效）
/pm habit inbox <项目ID>              列出未处理建议
/pm habit confirm <建议ID>            人确认 → 建 habit draft 记录（复用 P2 confirmOkrSuggestion 模式）
/pm habit ignore <建议ID>             忽略（保留标 ignored）
/pm habit final <habitID>             人定稿（draft/confirmed → final，幂等）
```

### 2.4 派生规则（`core/habits.ts` 纯函数，today 注入）
- `deriveHabitStreak(record, today)`：按 checkIns 日期计算当前连续（断签判定：缺口 > 2 天 → 当前重置 0，**longest/totalDays 永久保留**；窗口内补记算连续）。
- `buildHabitArchive(records)`：文本归档——「当前连续 N 天 · 历史最长 M 天 · 累计 X 天」，空日（无打卡日期）如实留空不补。
- `listHabitSuggestions(domain, projectId)`：收件区过滤（复用 readOkrInbox 模式）。

### 2.5 前端（`client/views/habits.tsx`，只读呈现+命令通道）
- 建议卡（收件区入口：待确认数；confirm/ignore 走 runCommand 通道，同 okrs 视图模式）。
- streak 文本档案（纯文本，无动效/徽章）；空日留空占位。
- 打卡入口走命令通道（checkin 今天/回填过去 2 天）。
- 浅深双态 token、无 emoji；snapshot 未携带数据时空态不伪造。
- panel.tsx 视图切换器接线「习惯」+ Snapshot.habits/pmHabitInbox 字段（集成步完成，参照 P2 okrs 接线）。

## 三、K11 周期触发接线（可开发占位）

- **数据结构预留**（契约层）：`habitRecordSchema.cycleDue?`（ISO，预留）+ `cycleHook?: 'daily-archive'|'quarterly-review'` 类型占位。
- **钩子占位**（`core/cycle-hooks.ts` 新建）：导出 `CYCLE_HOOKS = ['daily-archive','quarterly-review'] as const` 与 `cycleHookPoint(hook, domain, today)` 空实现——**不注册定时器/不调度**；文件头注释：`H6 宿主通知能力未实现前不启用；调度器实现待用户拍板后立项`。
- 不得：setInterval/setTimeout/后台进程/宿主 schedule API 调用。

## 四、H6 常驻推送立项调研（调研+结论，不开发）

### 4.1 调研问题
1. 宿主 deepseek-harness 是否具备**外部通知渠道**（系统通知/邮件/webhook/长连接推送）——查宿主进程、依赖包（@deepseek-ai/cordis、dsh-api-session-controller 的 `notification` frame 消费端、dsh-client-ui-*）、运行实例能力。
2. 若无外部渠道，**宿主侧可扩展点**是什么（改宿主代码的代价与风险：插件协议能否承载、UI slot 能否实现应用内提醒条、改宿主源码的维护代价）。
3. **C7 约束**（ADL-011「离线优先、无后台常驻是项目基调」、ADL-039「打开面板即派生，不做后台常驻/调度」）是否可解除：评估三种路线——**宿主级通知 vs 应用内轮询 vs 不做**，各自代价/收益/风险。

### 4.2 产出
`docs/design/deep-integration-v2-h6-research.md`：结论 + 推荐方案 + 代价；
**证据分级标注**：E1（本机可复现实测）/E2（源码/文档可引用）/E3（历史日志/记录）/E4（推理推断）/E5（外部不可验证）/E6（未验证）。
关键结论必须标注证据级；不得把推断写成实测；**不开发任何常驻推送/后台进程代码**。

## 五、硬性验收标准（延续 P0-P3 标准）

1. 真实可运行：习惯层命令与接线点在 3172 实例可见；关键链路真实请求+真实数据验证（参照 P2 集成模式：真实 HTTP/真实落盘）；新增测试覆盖，**基线 399 全绿不回退**。
2. 设计对齐 SPEC.md 与 s5 效果图：三栏 shell、dsh token、浅深双态；示例数据标注虚构，禁止真实业务数据进 UI。
3. 不夸大：习惯建议不自动生效（轻确认）；streak 是文本档案非激励动效；周期接线是占位不启用；**H6 未实现不标注为已实现**（调研文档必须区分「期望示意」与「现状」）。
4. 写操作纪律：任何写保留人确认与可撤销；未拍板前不动宿主常驻通知能力；不影响运行中服务。
5. 执行纪律：每执行者开始前 `pgrep -x caffeinate`；commit 后直接 push（[doubao-work]，已授权）；不做 send_message 中途汇报，最终交回完整结果。

## 六、分片职责（文件级互斥）

| 分片 | 独占文件 | 禁碰 |
|---|---|---|
| A（后端） | `src/core/habits.ts`、`src/core/cycle-hooks.ts`（新）、`src/commands/habit.ts`（填充）、`src/core/habits.test.ts`（新）、`scripts/verify-p3a.mjs`（新） | storage/index/status/labels（契约层）、client/*（B）、H6 文档（C） |
| B（前端） | `src/client/views/habits.tsx`（新）、`src/client/panel.css`（只追加 .pm-habit-*）、`src/client/views/okrs.tsx`（如需习惯关联位，最小追加） | panel.tsx（集成步）、core/*（A）、H6 文档（C） |
| C（H6 调研） | `docs/design/deep-integration-v2-h6-research.md`（新） | 一切代码文件（只调研不开发） |

集成步（组织者）：`src/client/panel.tsx`（habit 视图切换器 + Snapshot.habits 字段接线）、`src/index.ts` 路由补 habit（契约层）、verify-p3-integration.mjs、证据、档案、commit+push。
