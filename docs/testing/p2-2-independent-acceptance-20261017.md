# P2-2 Token 2.0 独立验收报告（2026-10-17，含修复复验轮）

> 独立测试与视觉审查负责人执行；生产者自测结果未被直接采信，全部关键项独立复跑/复核。
> 判定图例：PASS / FAIL / BLOCKED / NOT_RUN / MANUAL_PENDING；BLOCKED≠通过；真实与模拟分开。
> 本轮为开发修复 7 项 verify-isolation 失败后的独立复验；上一轮结论（7 项基线债归类）保留于 §1.2。

## 0. 证据绑定（复验轮）

- HEAD（未提交，测试前不提交）：`21cdc94ba57ce7efb473e62373036b4b7ce6cd04`
- 跟踪产品 src diff SHA256（工作树，复验轮）：`f5baf318f97876ed4eb2167102fbc0def80b9edc73b56c9100e4edebf0b83108`
- 新增产品文件哈希（未变）：
  - `src/core/design-tokens.ts` `b8983eebe0de3c42b9a84bdd1e4b86051406bcfa359c2692b87dd49ef71e4024`
  - `src/core/design-tokens.test.ts` `c16ef39190a4f8d0a94ad1474e18656ad5e1805963ff412d55fe57b4cd9f2248`
- 版本：package.json `0.7.4`（未升版、未打 tag）；changelog `## P2-2 Token 2.0 视觉基准（候选进行中 · 未提交 · 未放行）` 与 `docs/progress.md` 进行中候选段均已登记本批自测/独立结果，待 G3 放行后转正式（非阻塞观察项）。
- 确定性日志证据：`docs/testing/evidence-p2-2-20261017/`（build/vitest/coverage/e2e/verify-isolation 原始输出 + 索引 README）。
- 本轮产品 src 改动：`panel.css`（fallback 改 rgb、移除 S4 写死 hex）、`views/tasks.css`、`nav-rail.tsx`（仅类名）、`core/task-export.ts`（仅快照样式）；另修 7 个 verify 脚本（测试工具，非产品逻辑）。业务逻辑/schema/甘特看板行为未改。

## 1. G1 构建与全量回归（复验轮独立复跑）

| 项 | 命令 | 独立结果 | 判定 |
|---|---|---|---|
| T2-A01 build | `pnpm run build` | 退出 0；tsc 无错；tsdown 6 产物完成 | PASS |
| T2-A02 单元测试 | `pnpm test` | 14 文件 / 164 例全绿（含 design-tokens 10 例） | PASS |
| T2-A02 覆盖率 | `pnpm test:coverage` | 退出 0，无阈值失败（stmts 52.84 / branch 85.32） | PASS |
| T2-A04 e2e | `pnpm e2e` | project/task rendered，console errors=0 | PASS |
| T2-A03 verify-isolation | `node scripts/verify-isolation.mjs` | **73 脚本过 73、失败 0**；资产 before=after=169、污染 0；退出 0 | **PASS** |

### 1.1 七项修复是否弱化门（逐条独立核对，非采信自测）

| # | 脚本 | 修复后断言 | 独立核对（对照源码，非凑绿） | 判定 |
|---|---|---|---|---|
| 1 | verify-gantt | 删陈旧 `progressRatio`，改测 `progressFill` 真源契约：null→无填充、0≠null、100→实心，并加**反例**（legacyProgress/coverage/pendingAcceptance 不得伪造填充）；gap 案例改 16→tight、21→normal | 反例为真实负向不变量；gap 阈值对照源码 `stubA=6 + cornerR=6`，几何分支 `gap-6-6≥arrowClear9`：16→4<9 tight、21→9≥9 normal，与源码一致 | PASS（增强非弱化） |
| 2 | verify-task-inline | 删陈旧 `nextStatus`，改测 `parseProgressInput` 边界：null/undefined/空串/空白/NaN/Infinity→undefined；0/55/'33'→原值；150→100、-5→0 钳制 | 覆盖空值语义与钳制，正向真实，非空转 | PASS |
| 3 | verify-gantt-drag | 抽取 `commitDates` 块，断言 quiet `task update`、**payload 类型白名单仅 startDate/dueDate**、saving 在封装内 finally 翻转、并发 guard 保留 | 白名单断言比旧版更强；与 gantt.tsx:137-147 一致 | PASS（增强） |
| 4 | verify-gui-contract | 断言 `commitDates` 封装定义 + quiet task update；hex 改注释剥离后窄白名单（mask #000 / rail-logo #fff） | 通道断言保留；白名单带语义上下文，非全跳 | PASS |
| 5 | verify-ai-client | 改在 prepareCall 阶段断言 high/off；并断言 **stream 不重复传 reasoningEffort**、携带 system/messages | 与 ai-client.ts prepared call config + callConfigEquals 设计一致；补了"不重复传"负向 | PASS（修正层级） |
| 6 | verify-model-route | 删 env-Key 切换旧断言，改确定性 ark-plan 候选链：copilot[flash high, pro high, glm off]、wbs[flash,glm,doubao]、meeting[glm]、narrative/title[doubao]；prod 不抛错只断言可解析；PROD_KEY_MISSING_TEXT 常量仍校验 | 逐链对照 model-route.ts:76-105 模型/顺序/档位一致；prod 恒 ark-plan、**不静默回退免费**；未丢安全语义 | PASS（按现设计重写） |
| 7 | verify-web | 注释剥离后窄白名单：mask-image #000（alpha 遮罩非填充）、rail-logo #fff（on-primary 等价）；其余 hex 一律失败 | panel.css 现存声明 hex 仅 mask #000；fallback 已改 rgb()，白名单非全跳 | PASS |

### 1.2 上一轮 7 项基线债归类（保留，已全部修复）

1 verify-gantt 陈旧导入 progressRatio；2 verify-task-inline 陈旧导入 nextStatus；3/4 drag/gui-contract 陈旧源码模式 grep（通道未变）；5 ai-client 陈旧契约（prepared call 非 stream 顶层）；6 model-route 陈旧/路由设计漂移（非缺 Key）；7 verify-web 过宽 hex 断言（非"需在线 3080"）。均非本批回归，本轮已按上表修复并复验。

## 2. G2 Token 静态门（复验轮独立复核）

| 项 | 复核结果 | 判定 |
|---|---|---|
| 零 unresolved `var()` | 独立扫描：本地未定义引用全部为宿主/注入前缀（dsw-/dsh-/ds-）；`--c-link` 仅存注释、已闭合到 `--pm-link` | PASS |
| 12 项闭合映射可解析 | `--c-link/--hover-bg/--line-soft/--pm-border/--pm-bg/--pm-text/--pm-line-strong/--pm-accent-soft/--pm-faint/--pm-ink-muted/--pm-surface-muted/--pm-progress` 均定义或指宿主别名 | PASS |
| 旧 token 同值别名保留 / 不粗替换 | PRESERVED_OLD_ALIASES 全部定义；项目内零重定义任何 `--dsw-alias-*`（宿主别名优先） | PASS |
| 宿主别名优先 → fallback 链路 | muted/faint/link 为 `var(--hostAlias, rgb(105,110,116))` 形式的真实链路；主按钮填充 `--dsw-alias-button-primary-fill`（中性），未用业务蓝填 CTA | PASS |
| AA 独立实算（白底，rgb 同值） | muted rgb(105,110,116)=5.143、faint rgb(113,118,124)=4.581（落 surface-2=4.233<4.5 已文档化禁用）、link rgb(72,104,178)=5.387、on-primary 白/近黑=18.896 | PASS |
| 禁项 | 零暖黄、零新品牌色、零品牌蓝填充 CTA；本批新增渐变 0；glass 为基线既有未新增；现存声明 hex 仅 mask #000 | PASS |
| 板卡/宿主保护 | `--pm-st-*`(6) 未触碰；宿主别名未覆写；未对宿主/自定义板卡粗替换 | PASS |
| TS 契约 ↔ CSS | SEMANTIC_ROLES hostAlias 与 CSS fallback 一致；design-tokens.test.ts 10 例实质断言非空转 | PASS |

### 2.1 S4 是否契约漂移（专项）

- 结论：**无 TS 契约漂移**。`design-tokens.ts` CHART_SERIES s4 仅标 `enabled:false` + reason，**从不钉 hex**；panel.css 本轮移除写死的 `#7c5cf0`、S1–S3 改指既有状态 token，S4 不定义，与合同"禁用、未来再定"一致，未删任何启用项。
- **DOC-1 已闭环（复查通过）**：开发已对齐非 testing 文档，独立复核 `p2-2-token-migration-map.md:63/77` 与 `p2-2-visual-token-baseline-20261017.md` §18/§57/§102/§156 均改为「`--pm-chart-s4` 不定义、不启用，未来有真实多序列需求再定」，与 CSS/合同一致；无残留 `#7c5cf0` 槽位声明。

**G2 结论：PASS（静态范围）。** fallback 在宿主缺失时的真实渲染属 G3 目视，静态门不代替。

## 3. G4 非回归（静态 + 既有自动化覆盖，非真实 GUI）

| 保护项 | 独立核对 | 判定 |
|---|---|---|
| 主按钮中性、浅色对比不退 | 走宿主中性填充；AA 已实算 | PASS |
| 甘特三态路由/关键路径/拖拽白名单 | routeEdge/criticalPath/shiftDatesByDrag 在；拖拽 quiet task update、白名单 startDate/dueDate | PASS |
| 抽屉校验/Notice、看板互斥、空态/AI 草稿不落库 | 既有 164 例单测覆盖，本批未改逻辑 | PASS（自动化，非目视） |
| P2-1 导航功能不坏 | nav-rail 仅类名碰撞修复，逻辑零改 | PASS（静态+单测） |
| P2-5 导出 MD/CSV/JSON + 离线快照纯本地 | tasks.tsx 全走本地 downloadText/Blob，无 fetch/出网；快照零外链/零脚本 | PASS（静态） |

**G4 结论：PASS（静态 + 既有自动化范围）。** 本门为静态核对与既有单测/e2e，**不代表真实 GUI 已走查通过**。

## 4. G3 真实 GUI 目视门

- **BLOCKED（通道）**：当前执行通道无法采集真实浏览器视觉证据；T2-G01~G12 全部 BLOCKED，不填 PASS。
- 静态/计算/截图数量不代替目视；待具备真实浏览器通道后按 `gui-capability-probe-20261017.md` §4（MA-01~MA-13）取证，测试专家独立审证回填。
- 已常驻隔离实例 `http://127.0.0.1:3172/`（种子：1 项目 / 5 任务 / 1 里程碑 / 1 风险）供主 Agent 公共 GUI 采证；独立测试不自行访问、不认证、不截图。
- **G3 BLOCKED 期间不得推进 P2-6。**（2026-10-17 更正：此为旧顺序门口径，已被并行例外取代，见下注。）

> **2026-10-17 口径更正（并行例外，不改变本报告 G1/G2/G4 结论）**：P2-6 核心/治理/UI 候选可与 P2-2 **并行开发与离线确定性测试**，不必等 G3 视觉 PASS；但**最终验收/合入发布仍按门顺序、P2-6 不继承本批或原型旧 PASS**，须在自身新 HEAD+diff 独立复验；UI 静态/自动不当视觉 PASS。G3 口径同时更正：先前 3172 提示为导航未带 URL token（非实例不可达/非主端无 GUI），主端带链接导航重建采证。详见 `p2-batch-test-plan.md` §1.3/§1.5 与 `p2-6-implementation-test-plan-20261017.md`。

## 5. 总门状态（复验轮）

| 门 | 状态 | 说明 |
|---|---|---|
| G1 构建/单测/coverage/e2e | PASS | build=0、164/164、coverage 退出0、e2e PASS、零污染 |
| G1-A03 verify-isolation | PASS（73/73） | 7 项修复逐条核对为增强/按现设计重写，非弱化、非凑绿 |
| G2 | PASS | 静态 Token 门全过；S4 无契约漂移；DOC-1 已闭环 |
| G4 | PASS | 静态非回归 + 既有自动化（非真实 GUI） |
| G3 | BLOCKED | 通道受限，待主 Agent 公共 GUI 采证后独立审证 |
| P2-6 | 并行开发/离线测试允许（旧「禁止启动」已被 2026-10-17 并行例外取代；发布仍按门序、不继承旧 PASS） | 候选可并行，最终合入独立复验；仅预留 `--pm-ai-*` 槽位不启用 |

**总体**：G1/G2/G4 静态与自动化范围全部 PASS，7 项基线债已修复且未弱化门，DOC-1 已闭环；**批次仍不得整体 PASS**——唯一未决项为 G3 真实目视门 BLOCKED。独立测试不自行访问/认证隔离实例、不截图，待主 Agent 采证后审证。本报告不宣称审美获用户认可（G3 未证）。
