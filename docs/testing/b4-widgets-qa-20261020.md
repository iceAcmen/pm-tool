# B4 widgets 独立源码 + 测试核验 · 2026-10-20

> QA 离线只读源码 + 复跑本批 board 测试；不信作者 pass，不启服务/浏览器，不代 GUI PASS。
> 现场：`packages/dsh-pm-tool/src/client/board/`（live 工作树为准，checkpoint 快照仅早期参考）。

## 1. 测试复跑（稳定态一次）

`npx vitest run src/client/board` → **9 文件 / 89 例全 PASS，exit0**：

| 文件 | 例 |
|---|---|
| b4-guard.test.ts | 26 |
| queue-aggregate.test.ts | 17 |
| projection.test.ts | 11 |
| persist.test.ts | 8 |
| history.test.ts | 7 |
| migration-banner.test.ts | 7 |
| refresh-confirm.test.ts | 6 |
| registry.test.ts | 4 |
| layout-append.test.ts | 3 |

b4-guard 为静态源码串断言（16 卡注册无 disabled、用户布局优先不 reset、board/overview CSS 零裸色、overview 复用 core、里程碑时间线非旧 SegRow、四批次卡契约），与 QA 独立源码阅读一致。

## 2. 关键事实逐项源码核验（widgets.tsx live）

| # | 要求 | 源码证据 | 判定 |
|---|---|---|---|
| 1 | completionHero：wrapped 中性、不计完成 | `rate=done/total`（L60）；wrapped 仅进五态分布条 `TONE.wrapped` 中性灰（L69），不进环 | PASS |
| 2 | projectScale 真实 % | 逐项目 `doneTasks/tasks` 实算（L209-211），ms/risks 实滤（L212-213），无占位 | PASS |
| 3 | objectiveProgress 无 fake | `deriveProgressMap` 清单派生（L244）；无清单「不估算」（L265），doneChecklist 100% | PASS |
| 4 | peopleLoad 同 MAX 刻度 + 未分配单列 | 共享 `max`（L293），`n/max` 同刻度（L314）；`unassignedOpen` 单列不并入成员（L295/321-326） | PASS |
| 5 | riskMatrix 走 core | `groupRiskMatrix(data.riskIssues.filter(r=>r.type==='risk'))`（L347），closed 排除/归格全交 core，不手算 | PASS |
| 6 | weeklyPlan 空态诚实 | 7 桶全 0 →「未来 7 周无待截止…」（L420），无假柱 | PASS |
| 7 | overdueSoon 逾期 pill | 逾期 `isTaskOverdue` 谓词 + 状态 pill + 临期 7 天（L504-510），≤8 条日期升序 | PASS |
| 8 | recordList filter/sort | `applyFilter`（L440）+ linkage 交集（L442-450）+ `applySort`（L451），复用 query 层 | PASS |
| 9 | 公式错误/空态 | kpiMetric 错误显「公式错误」+ `r.error.message`（L557-558）；formulaCard 空公式「—」+ 引导（L593-598）；无 evaluateFormula 显「…」不造假 | PASS |
| 10 | statusRing 无 wrapped、真实 | order 仅 done/in_progress/blocked/todo（L635-640），标注「不含收尾」（L646），无趋势伪造 | PASS |
| 11 | completionTrend 纯真实 | `buildCompletionHistory(scopedTasks,{weeks:8})` 取真实 completedDate（L683），`hist.empty` 诚实空态（L699-700），projectScope 过滤 | PASS |
| 12 | textNote markdown safe | `MarkdownView`（AST，无 innerHTML/eval/危险 URL，markdown-view.tsx 头注释），无 dangerouslySetInnerHTML | PASS |
| 13 | engine/RGL/layout 未动 | git diff board/ 仅 `board.css`(+46) + `widgets.tsx`(±)；BoardBento/editor/layout-append/persist/projection/history/query/formula 零改动；engine/RGL/用户已存布局未改 | PASS |

## 3. 非完成 / NOTRUN 边界（B4 不得标 complete）

- **overview project-scoped 属 front owner，尚未做**（`views/overview.tsx` 空态），mapping 不标 B4 complete。
- **U4（B4 New）多字段排序 / 列显隐持久化未实现**：现引擎仅单字段 sort；路线内待写，本批不做须显式 out-of-current-route，非用户开放决策。
- GUI：1440/1024/768/390 深浅、200%、鼠标拖缩、跨断点 canonical、save/restart、取消失败保 layout —— **全 NOT_RUN，归 Main CU native 采证**，静态绿不替代。
- 新资料/进展联动依赖 B2，可分两次集成，不因 B3 阻塞视觉迁移。

## 4. 结论

13 项静态事实全 PASS，board 89 例复跑绿；**仅静态 widget 视觉层证据，B4 整体未完成，不 G/PASS**。无 FAIL 需开给 planning。
