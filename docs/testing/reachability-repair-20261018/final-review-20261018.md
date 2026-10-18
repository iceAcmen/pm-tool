# 可达性热修 · 最终独立评审（终审）2026-10-18

> 独立测试专家只读审证 + 独立全量回归；未改生产源码、未 commit/push、未碰 3172、无业务数据变动。
> 范围：nav/panel/index/OKR·习惯 inbox/K13 副驾 + board 队列卡/聚合/显式加卡。
> **自动化层 PASS；GUI 层 PASS（主端 3172 675×745 终测全过，2026-10-18）；整体验收通过。**

## 1. 自动化门禁（本层独立复跑，实数）

| 门 | 结果 |
|---|---|
| `pnpm run build`（tsc 类型检查 + tsdown 三 chunk） | **PASS / 退出 0**（持久化补丁后复跑） |
| `npx vitest run` | **41 文件 / 458 tests 全绿**（较前 449 +9，含 layout-append 与 refresh-confirm；最终复跑） |
| `node scripts/verify-isolation.mjs` | **87 脚本全过 / 0 失败 / 0 污染**（较前 86 +verify-p1b-adopt；176 资产 hash+mtime 零变化） |
| `verify-p1b-adopt.mjs`（adopt 落盘读回/旧卡深等/新 Context 重进/非法写入拒绝） | **PASS**（guard 内执行，209ms 退出 0） |
| `verify-web.mjs`（真实种子收件区 + queue 形状契约） | **PASS** |

## 2. 缺陷闭环核验（逐条对 diff 取证）

| 项 | 级别 | 闭环证据 | 结论 |
|---|---|---|---|
| **P1** 副驾 dashOpen 不挂载 | S1 | panel.tsx 按钮 onClick：`if (dashOpen) setDashOpen(false)` 再 toggle `copilotLayer`；顶栏菜单项同法；aside 在项目分支（1243），退出总览后项目分支重挂载即显层 | 闭环 |
| **P2** ViewSwitcher 非同源 | S2 | 删除硬编码 12 项；`buildNarrowSwitcher(counts)` 由 `buildNavModel` 扁平派生，标签/计数同源；`NARROW_VIEW_ORDER` + 兜底追加；nav.test.ts 防漏测试（VIEW_LABELS 每键必须入序） | 闭环 |
| **N1** OKR confirmed 重复按钮+虚增计数 | S2 | panel 映射补 `confirmed → state:'confirmed'`；`countPendingInbox` 仅计 `state===undefined`；okrs.tsx confirmed 显「已采纳」标签、无写按钮；nav/switcher 计数只计未处理 | 闭环 |
| **R1** 刷新失败假盖时钟 | S2 | `refresh()` 返 `Promise<boolean>`；`refreshProjection` 用 `refreshSucceeded(result)` 门控，false/undefined 兼容失败时保留旧时钟+系统提示，成功才 `loadApplied()+setAsOf`；ask-projection 单测 | 闭环 |
| **N2** partial+空态误导文案 | S3 | 独立文案「有效数据中暂无条目 / 仍有部分异常未能读取，无效部分已跳过」；非 partial 空态保留「暂无到期未达条目」 | 闭环 |
| **N3** 死 CSS 修改类 | S4 | `.pm-queue-partial-banner` 已从卡片与 CSS 全删，复用 quiet-banner（0 残留） | 闭环 |
| **N4** verify-web 无收件区/queue 契约 | S3 | 真实 okr/habit suggest 种子透传断言（数组+id/at/projectId/title/status 形状+种子在列）；queue 存在即校 Record/rest 数组，缺失不失败 | 闭环 |
| **M-1** 子项目坏数据假空 | S1 | 全坏 malformed / 混合 partial 保留好项 / 合法空；aggregate 17/17 | 闭环 |
| **N5** pm-view localStorage | — | 撤回误报：649 读/656 写真实存在，文档属实，不修 | 撤回 |

## 3. 代码层已核通过（静态）

- nav growth 组（目标与习惯）：模型计数/图标 Target·Repeat/搜索关键词/无项目置灰/折叠/aria-current/面包屑 VIEW_LABELS。
- inbox 三态：undefined 命令提示 / [] 暂无待处理 / pending 列表+采纳·忽略；confirm/ignore 走 run 通道，成功 onSaved=refresh 重读。
- 习惯 confirmed/ignored 标签分支、pending 计数；与 OKR 同构。
- K13：投影状态渲染时现取 tasks props；asOf 随快照到达/手动成功刷新重盖；打开任务走 openRecord；ask-apply 后 await onSaved 再重挂台账。
- 边界：副驾文案标明 PM 插件内只读、非宿主全局聊天；宿主原生聊天无注入（反向断言）。
- board：显式加卡追加末尾不重排旧卡、失败不乐观改写、单实例防重、user 作用域保存语义；聚合跨项目合并/静默降级/静音豁免/排序。

## 4. 非阻塞观察（S4，作者自校，不要求改）

- changelog「未改 board/*、queue 核心」与实际含 queue-card/aggregate 改动不符，建议改为「未改队列后端派生核心」；非阻塞。

## 5. commit 前状态

- 工作树未提交：作者 WIP（src + 3 份 docs）+ 本层测试文档；**本轮未 commit/push**，等主端 3172 实测回信。
- 未启停 3172；未读写真实用户库；隔离种子仅 verify-web 临时域。

## 6. GUI 实测结果（主端 3172，2026-10-18；原始登记见 gui-results-20261018.md）

**终测全 PASS（675×745）**：OKR/习惯桌面导航/页面/真实空态/两 inbox；补记队列三持久化路径（离板返回/全局刷新/浏览器 reload 重进）卡仍在、合法空态无伪造；PM 副驾 MORE 入口、真实问 t-0008、K13 卡（数据截至/真实状态/0%/证据无）、打开抽屉直达；边界成立（PM 插件副驾非宿主全局聊天）。详见 §6.5。

**历史 FAIL（C5 持久化，已闭环）**：初测加卡离板返回消失；根因为写盘成功但未重取父 snapshot，remount 读旧快照回落 fallback。作者修后经 §6.5 三路径实测闭环。

**未测保持 PENDING（非阻塞）**：A3/B3 confirm/ignore 点按闭环、C3 填充种子态、C6 网格、D3 手动刷新、D4 台账、F1 浅深/F2 键盘/F3 刷新一致性。

### 修复后复审要点（持久化链，已全部核验）
1. 保存命令业务 error reject，不误当 Promise 成功 ✓（executeRaw 对 kind=error 抛错）。
2. re-entry / snapshot / reload 三路径卡仍在 ✓（主端 675×745 实测 + verify-p1b-adopt 新 Context 读回）。
3. 旧布局深等：仅末尾追加，既有卡片位置/尺寸/config 不动 ✓（layout-append.test + verify deepEqual）。
4. 新增持久化测试/verify 已纳入 guard（87 脚本）✓。

### 持久化合同审计（对组织者处方的独立核对）

**已核成立**：
- 命令不假成功：`dashboard put` 业务错（非法 scope/JSON/version/widgets）返回 kind='error'，`executeRaw` 对 error 抛错（index.tsx:28），`onSave` 的 `await execute` reject → adopt catch 显失败，不会 `setLayout`。
- 根因与处方一致：put 写盘成功后未重取父 snapshot；BoardBento 卸载后重进基于旧 `data.dashboards` 初始化 → 回落 fallback → 卡消失。处方「put 成功后 `await refreshBoard(true)`，false 当失败，成功提示仅两步成功」方向正确。

**合同落地点（供作者实现，非本层改）**：
- 两步成功才提示：`await persistence.onSave('user', next)`（put 成功）→ `await actions.refreshBoard?.()`（重取 snapshot）；两步皆成才 `setLayout(next)`+成功 banner；任一步失败 → 失败 banner，不做乐观声明。建议把 `setLayout(next)` 移到 refresh 成功之后。
- 类型：`WidgetActions.refreshBoard` 现为 `() => Promise<void> | void`（types.ts:93），需放宽为可返 `Promise<boolean> | boolean | void`；GlobalBoard 2926 行当前把 refreshBoard 吞成 fire-and-forget（`() => { void refreshBoard() }`），需把 boolean 透传。
- 复用：PmPanel 已注入 `refreshBoard={() => refresh()}`，`refresh()` 返 `Promise<boolean>`，可直接用。

**持久化补丁复审（本层实际读接缝，未信作者报告）**：
- 接缝成立：PmPanel 注入 `refreshBoard={() => refresh()}`（panel.tsx:1131，返 boolean）；GlobalBoard:2926 改为 `() => refreshBoard()` 透传 Promise，不再 void 吞；WidgetActions 类型已放宽 `Promise<boolean>|boolean|void`（types.ts:93）。
- 两步门控：adopt 先 `await persistence.onSave('user', next)` 落盘，再经 `refreshAndConfirm(actions.refreshBoard)` 等待父快照刷新；缺失/无效通道或返回 false 均抛错；成功后才 `setLayout(next)`+成功 banner。
- verify-p1b-adopt.mjs：落盘读回 w-queue、旧两卡 deepEqual、新 Context（等价重进/reload）磁盘读回仍在、非法 put 被拒且不改已存布局 ✓；layout-append.test.ts 覆盖末尾追加/幂等/空布局 y=0，旧卡深等 ✓。

**F-1 已闭环**：缺失、undefined、null、非函数刷新通道及返回 false 均拒绝成功态；对应 refresh-confirm 测试已覆盖。
**一致性观察（非阻塞）**：编辑器 onSave/onReset 仍未重取 snapshot，同型旧快照缺口，留待后续。

## 6.5 GUI 终测（主端 3172 · 675×745，2026-10-18，全 PASS）

原始现象登记见 `gui-results-20261018.md`。

- **A/B OKR·习惯**：桌面导航见「目标（OKR）」「习惯」并可进页面；真实空态无杜撰；两 inbox 正确呈现。
- **C5 补记队列三持久化路径全过**：①离开总览→进 OKR→回总览，卡仍在，页面只 find「补记队列」、无「＋添加」；②全局刷新后卡仍在、合法空态无伪造；③浏览器 reload→重进 PM→总览，磁盘持久卡仍在。当场加卡成功、合法空态。
- **D/E 副驾 K13**：MORE 入口打开 PM 插件内副驾；真实提问 t-0008，模型回答下 K13 卡含数据截至/真实状态/0%/证据无；打开 t-0008 抽屉直达；边界成立——仅 PM 插件副驾，非宿主全局聊天。
- 业务数据未改；个人看板布局为用户明确触发的可逆写入，不入 git。

未测子项（非本轮阻塞）：A3/B3 confirm/ignore 点按闭环、C3 填充种子态、C6 网格、D3 手动刷新、D4 台账、F1/F2/F3 横切，保持 PENDING/MANUAL。

## 7. 结论

**整体验收通过：自动化层 PASS（build 0 / 41 文件·458 绿 / guard 87·0 失败·0 污染）+ GUI 层 PASS（主端 3172 675×745 终测）。** 唯一历史 FAIL（C5 持久化）已由三路径实测闭环；F-1 已闭环，编辑器 onSave/onReset 旧快照缺口为非阻塞观察，不影响本轮验收。未 commit/push，待组织者决定提交时机。
