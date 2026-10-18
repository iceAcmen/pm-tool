# P1 深度融合（呈现+交互）验证记录

> 日期：2026-10-18 · 平台：doubao-work（组织者集成验证）· 范围：P1 五项（K11 补记队列/K13 对话内投影/K6 完整版呈现/X6-L2 完整复盘草稿流/K19 保护面组件）
> 依据：`docs/design/deep-integration-v2-p1-dev.md`（P1 规格）；不动 3172、未触碰正式 data/（verify-isolation 污染 0）

## 一、门禁汇总

| 门 | 命令 | 结果 |
|---|---|---|
| 构建 | `pnpm run build`（tsc 严格 + tsdown） | exit 0 |
| 全量单测 | `pnpm test`（vitest） | **30 文件 / 326 用例全绿**（基线 282 → 326，新增 44） |
| 隔离门禁 | `node scripts/verify-isolation.mjs` | **80 脚本 / 80 通过 / 失败 0 / 污染 0**（176 资产 before=after） |
| P1 集成链 | `node scripts/verify-p1-integration.mjs`（本批新增） | **45/45 PASS**（真实命令 + 真实 JSON 落盘 + 幂等） |
| 分片自验 | verify-reflect.mjs（修正 P1 语义后）PASS；verify-p1a-queue.mjs 22/22、verify-p1c-integration.mjs 22/22（分片自验） | PASS |

修正说明：
1. `scripts/verify-p1-integration.mjs` 初版断言按实现口径修正 4 处（settings 记录带 value 信封、里程碑字段为 targetDate/achievedDate、reflections/tasks 表 entries() 元组形态、check 输出带中文前缀+json 围栏需剥围栏）——均为脚本口径问题，非实现缺陷，修正后 45/45。
2. `scripts/verify-reflect.mjs`（P0 脚本）1 处断言升级：P0 时 deliverableId 可写任意值（无存在性校验），P1 补齐校验后不存在交付物被拒——按新语义改为「先真实创建交付物再挂接 + 负例断言被拒」，意图不变。

## 二、P1 集成链（verify-p1-integration.mjs 45 项，真实 Context + 临时 JSON 根 + 真实命令 handler）

### K11 补记队列（后端 25 项全过）
- open 打卡：settings 落盘 `pmQueueOpened`（value 信封 + per-project at），队列派生 `{top, rest, quietMode, openedAt}`。
- 排序与筛选：blocked > P0 > 逾期天数 > 到期日；未来到期/done 排除；今日到期 lateDays=0 不豁免。
- 迟到标识：blocked 逾期 10 天 top 项 lateDays=10（LATE_DAYS=3 积压档）。
- mute 二态：静音 blocked 后仍进 top（关键项豁免）；静音普通条目后 top 排除、rest 可见且标 muted + mutedUntil（TTL 7 天）；unmute 清除键可逆。
- quiet 时段：00:00-23:59 命中 → quietMode=true、top 置空、rest 保留；quiet off 清除键恢复。
- K9 缺席：session 绑定后任务零更新 → rest 条目 `absent:true`。
- snapshot：携带 `queue[projectId]`（形状 `{top,rest,quietMode,openedAt}`），既有字段零破坏。

### X6-L2 完整复盘草稿流（后端 8 项全过）
- milestone achieved（含 achievedDate）→ reflections 落盘：sourceEvent=milestone-achieved、milestoneId 字段、status=draft、taskId 不写；草稿含「关联任务」清单行（已完成+证据→known、未完成→pending）；gaps 含未完成留白；重复 achieved 幂等 1 条。
- deliverable accepted → reflections 落盘：sourceEvent=deliverable-accepted、deliverableId 字段、标题「交付验收复盘（草稿）」、关联任务行；重复 accepted 幂等。
- deliverableId 校验负例：dlv-9999 →「未找到交付物：dlv-9999」；跨项目 →「交付物不属于指定项目」（中文文案）。

### K19 / K13 / K6
- loadFacts/stanceSuggestions/staleStanceTags 真实输出形状正确；stance 建议 reason 全部含「建议供人决策」措辞；烂尾倾向标签带天数。
- ask-projection 引用解析（词边界）真实命中 t-0001/t-0002；空台账 → 空批次列表。
- `/pm check` 真实命中 overdue-untouched 等规则（只读，任务状态未改）。

## 三、前端呈现（分片自检，非伪造）

- K13 投影（分片B）：投影数据渲染时从最新 tasks 快照现取（防过时硬要求）；「数据截至 HH:MM:SS」+ 刷新入口；ask 旧会话卡片渲染时刷新。静态样式浅/深 sanity 通过；build 通过。
- K11 队列卡（分片D）：真实组件 SSR 分支渲染 13/13（空态/Top1/迟到徽标/静音可见/quiet 降级/无通道不渲染按钮）；30 个 pm-queue-* 类与 CSS 1:1；runCommand/refreshBoard 接线已由分片B 补入（PmPanel run/refresh）。
- K19 负载卡 + K6 检查卡（分片E）：直接消费 core 纯函数（单一真源）；「建议供人决策，不自动执行」与「提示不代替人验收」措辞在位；类名与 CSS 1:1；token 双态。

## 四、能力边界（验收口径核对）

- K11 打开时呈现 ≠ 常驻推送（H6 悬置 P3，卡脚注明示「不替代常驻通知」）；mute 只压主动投递、不隐藏打开视图；X7 cycleDue/X8 backfill 仅类型预留不产出数据。
- K6 提示 ≠ 人验收（「未覆盖≠未完成」）；X6-L2 完整草稿 ≠ 定稿（final 只能人触发；复盘会由人组织）；K19 仅事实陈列+建议文案，无 WIP 硬上限/拒单闸、无自动执行。
- 写操作全部可逆（unmute/quiet off）；钩子 best-effort 不阻断落库；未改上游宿主、未动 3172。

## 五、遗留与下一步

- P2：X7 愿景/OKR 层（K11 周期触发接线点已在类型层预留）；H6 常驻推送 P3 单独立项（先调研宿主通知能力）。
- K2 窄集跑通后用户复核再扩界（第 3 项 approved-pending + H5）。
- 真实宿主渲染（3172 重载后的像素级目视/交互）与真实 LLM 草稿质量留待用户真实实例复核。
