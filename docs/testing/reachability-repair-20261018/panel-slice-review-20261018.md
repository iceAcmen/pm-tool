# Panel/nav/index 切片独立评审（OKR·习惯 nav/inbox/K13）— 2026-10-18

> 独立测试专家只读审证 + 独立跑门禁；未改生产源码、未 commit/push、未碰 3172。
> 范围：`core/nav.ts`、`core/nav.test.ts`、`client/nav-rail.tsx`、`client/panel.tsx`、`index.ts` snapshot 透传。
> 组织者已退两项（copilot 仍在 dashOpen 三元后未挂载；窄屏 ViewSwitcher 硬编码非同源），本文件**不重复**，只记独立新发现与已核通过项。

## 1. 独立执行的自动化门禁（本层复跑，实数）

| 门 | 结果 |
|---|---|
| `pnpm run build`（tsc + tsdown 三 chunk） | **PASS**，退出 0，类型检查无错 |
| `npx vitest run` | **39 文件 / 445 tests 全绿**（本层独立复跑，未沿用作者口径；旧基线 399/427 仅作参照） |
| `node scripts/verify-isolation.mjs` | **86 脚本全过 / 0 失败 / 0 污染**（before=after=176 资产，hash+mtime 零变化） |
| `queue-aggregate.test.ts` 定向 | 17/17 绿（M-1 修复后复跑） |

## 2. 已核通过（静态 + 门禁）

### 2.1 导航可达（对 A1/B1 代码层）
- `core/nav.ts` 新增折叠组 `growth`（目标与习惯），含 okrs/habits 条目、计数挂载、`projectDisabled` 置灰、搜索关键词（okr/目标/愿景/objective/key result/kr；habit/习惯/打卡/streak/连续）。
- `VIEW_LABELS` 补两键；`nav-rail.tsx` ICONS 补 Target/Repeat；rail 通用渲染折叠组、count 徽标、aria-current、搜索过滤均复用既有机制，无特例。
- `View` 联合类型与 `changeView` 守卫均含 okrs/habits；面包屑走 VIEW_LABELS。
- nav.test.ts：五组顺序、growth 计数、11 键 VIEW_LABELS、过滤空组计数同步更新。

### 2.2 inbox 透传（对 A4/B4）
- `index.ts` web snapshot 经 `readOkrInbox/readHabitInbox` 透传；坏行/非数组诚实回落 `[]`，不伪造。
- panel：`undefined`（旧档/未携带）原样下传，视图只显命令提示；`[]` 落「暂无待处理建议」；两种空态不串味。
- habitInbox 原样下传；HabitsView 仅列 pending 并对 confirmed/ignored 显「已采纳/已忽略」标签（246-250），按钮仅 pending 出现。
- confirm/ignore 走 `run` 命令通道，成功 `onSaved=refresh` 重读快照；失败全局消息，不静默。

### 2.3 K13 投影时钟（组织者提醒项，已核）
- `asOf` 为本地时钟 state；`useEffect(() => setAsOf(new Date()), [tasks])` 在最新快照到达时重盖，手动 `refreshProjection` 成功后重盖；卡片状态始终渲染时现取 tasks props，不缓存 ask 发起时刻旧值。**无提前/滞后错盖问题。**

### 2.4 边界
- 副驾文案改为「PM 插件内副驾，只读本插件项目台账；非宿主全局聊天」；未向宿主原生聊天注入任何投影（反向断言代码层成立）。

## 3. 独立新发现缺陷（交作者修，本层不改）

### N1（S2）OKR `confirmed` 建议未映射，重复渲染操作按钮且虚增待确认计数
**位置**：`panel.tsx` okrInbox 映射（仅 `status==='ignored' → state:'ignored'`）；`okr-model.ts` countPendingInbox/filterInbox；`okrs.tsx:147-164`。
**事实**：`confirmOkrSuggestion`（core/okr.ts:418-427）确认后把条目**保留**在 inbox 并标 `status:'confirmed'`；panel 只映射 ignored，confirmed 落 `state=undefined` →
- `countPendingInbox` 与 nav 徽标把 confirmed 计为待确认（虚增）；
- `filterInbox` 列出 confirmed，视图再次渲染「采纳并写入归属 / 忽略」按钮；用户再点才被后端「该建议已确认过」拒绝（事后报错，非前置拦截）。
**对照**：HabitsView 对 confirmed/ignored 已有标签分支，OKR 缺同构处理。
**建议**：映射 confirmed → processed 态并显「已采纳」标签，countPendingInbox/nav 计数排除 confirmed；按钮仅 pending 出现。

### N2（S3）partial + 有效空 同屏仍写「暂无到期未达条目」，易被读成「无待办」
**位置**：`queue-card.tsx:160-168`。partial banner 与扁平空态标题同屏出现；坏项被跳过时「暂无到期未达条目」断言过满。
**建议**：partial 且 all.length===0 时改限定文案（如「部分数据无效已跳过；当前未展示有效条目」），不单独断言「暂无」。

### N3（S4）`.pm-queue-partial-banner` 修改类无 CSS 规则
**位置**：`panel.css` 仅定义 `.pm-queue-quiet-banner`；partial banner 复用之但附带的 modifier 类是死类。视觉不破损，补规则或删类即可。

### N4（S3 硬化）verify-web 契约未覆盖新透传字段
**位置**：`scripts/verify-web.mjs` 对 okrInbox/habitInbox/queue 形状零断言；未来回归丢失透传字段，guard 仍全绿。建议补快照契约断言（字段存在/数组/坏行回落）。

### R1（仍开放 · 刷新失败假盖时钟）刷新布尔只做了一半
**路径全链复查（非只看 useEffect(tasks)）**：
- `refresh()`（panel.tsx:714-731）已改为返回 `Promise<boolean>`：成功 `return true`，catch 置消息并 `return false`、不抛。
- `CopilotPanel.refreshProjection`（2376-2388）`await onSaved()` **未取返回值**即继续 `loadApplied()` + `setAsOf(new Date())`；refresh 失败 resolve(false) 不抛，catch 不触发 → 仍假盖时钟，且失败时也没有「刷新失败」系统提示。
**要求**：`const ok = await onSaved(); if (!ok) { 追加失败系统消息; return }` 成功才 `loadApplied()` + `setAsOf`；onSaved 类型已支持 boolean，无需改契约。
**旁证**：`useEffect(() => setAsOf(new Date()), [tasks])` 在失败（tasks 未变）时不重盖，本身正确；问题只在手动刷新路径。

### N2/N3（队列侧，已修，跨引 board 评审）
N2 partial+有效空独立文案、N3 死类删除均已闭环。

### N5（已撤回 · 误报，不修）
复核证据：`panel.tsx:647-657` 确有 `localStorage.getItem('pm-view')`（649，合法枚举含 okrs/habits）与 `setItem('pm-view', v)`（656，changeView 时写）。changelog 表述属实，**非缺陷，文档不改**。本层首轮 grep 漏看该段，特此更正。

## 4. 组织者已退项（登记，不重复开）

- P1：副驾按钮在 dashOpen 不再 disabled，但 `copilotLayer && project` 的 aside 仍在 dashOpen 三元 false 分支（panel.tsx:1238），总览下点击不挂载；要求明确「退出总览开当前项目副驾」或共同挂载。
- P2：窄屏 ViewSwitcher（panel.tsx:1132-1145）全硬编码 items/labels，「与 buildNavModel 同源」不实；要求由模型派生并加防漏测试。

## 5. 缺陷状态台账（终审 2026-10-18 晚：全部闭环，详见 final-review）

| 项 | 级别 | 终审状态 |
|---|---|---|
| N1 OKR confirmed 建议未映射、重复按钮+虚增计数 | S2 | **闭环**（confirmed 态标签/不计待确认/无写按钮） |
| R1 刷新失败假盖时钟（refreshProjection 未取 boolean） | S2 | **闭环**（refreshSucceeded 门控，失败保留旧时钟） |
| N2 partial 空态文案 / N3 死 CSS 类 | S3/S4 | **闭环**（board 评审） |
| N5 pm-view localStorage | — | **撤回误报**，不修 |
| P1 副驾 dashOpen 不挂载 / P2 ViewSwitcher 非同源 | S1/S2 | **闭环**（先退总览再开层 / buildNarrowSwitcher 同源+防漏测试） |

## 6. 未覆盖 / 待后续

- GUI：A/B/C/D/E 各项主端 3172 采证后专家审；当前 PENDING，**不盖全局 PASS**。
- streak 读时新鲜度：非本轮范围，未扩。
- 真实模型车道 D4 闭环 MANUAL_PENDING。
- 收口后：再审修后 diff、全量 build/vitest/guard 完整回归与实际脚本数。
