# P0–P3 体验修复 · 设计系统可执行契约（角色 A：产品/UX 总审）

> 日期：2026-10-18　状态：**待实现方 B/C/D 签收的硬合同（Proposal for implementation）**
> 作者：角色 A（产品/UX 总审 + 设计系统）。本文件**只写合同，不改生产源码、不写测试数据、不启停 3172、不 commit/push**。
> 基线：pm-tool HEAD `6b0d2a3c853cfe5a089c802959228bc8cfa56e85`（工作树净）；上游 DSH HEAD `d743267388641bc76f17c45ce8b4c231aed1d32c`（只读，仅 untracked 残留，严禁触碰）。
> vendor 完整性门：`node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` 退出 0 / PASS；ux-ui-skills 7 skills·64 files、product-os 45 skills·90 files、ui-ux-pro-max 1 skill·47 files，bad=0 missing=0（内联 node 手工复核）。
> 依据原始材料：`P0-P3用户验收测试用例.md`（S01–S08 / P0-01…P3-07 / B01–B08）、`AGENTS.md`、`docs/external-skills.md`、`docs/design/deep-integration-v2-designs-rework/SPEC.md`、`docs/design/system-ui-spec-20261017.md`、六张现场截图、两仓 tracked 源码只读核查。
> 专家方法（已读 SKILL.md + refs）：ux-ui-audit、dashboard-redesign、ai-product-design、design-system-review、handoff-to-dev、ui-ux-pro-max、design-human-ai-workflow。

## 0. 口径与硬边界

1. **证据分级**：`observed`（截图/源码直接可见）、`inferred`（由 observed 推得，需实现方复核）、`unknown`（证据不足，禁止写成缺陷，转待验证）。
2. **每条验收必须可观测**：Given/When/Then 或数值/DOM 断言；禁止「好看/一致/适配移动端」类弱验收（handoff-to-dev 口径）。
3. **自动绿 ≠ GUI**：build/vitest/verify 全绿只证明静态与契约，不替代四视口×浅深×200% 的独立目视验收（详见 §8）。
4. **产品边界不变**：capture 永远「草稿→人确认→落库」，模型不自动建任务；删除/落库的破坏性动作必须有意义审查（ai-product-design：通用 Continue/原生 confirm 不算有意义审查）。
5. **不改上游模型/凭据/账本**；宿主 DSH 改造项只提合同，由宿主责任方实现，pm-tool 侧不越权。

---

## 1. 六张截图 Evidence Map

> 截图编号 S1–S6 与附件顺序一致。所有「根因」除非源码已证，否则标 inferred/unknown。

### S1 `b5abeb3c-…png`｜全部任务页 + 内嵌 AI 副驾（桌面，约 1440）

| 级别 | 事实 |
|---|---|
| observed | ① 右侧「AI 副驾·建议层」以固定 340px 内嵌列占宽，主列（任务表/交付前核对卡）被压缩，右侧出现留白与挤压；② 底部任务表两行「未指派任务」标签与行内文字叠印（负责人列文字压到标题/编号上）；③ 左 rail「目标与习惯」组重复出现多次「目标（OKR）0」带折叠箭头的同款条目，且「目标与习惯」组头本身重复两次；④ 副驾内部：只读诊断/草稿待确认(4) tab、PoC 免费/生产 Key 车道、蓝色回答气泡、相关任务投影卡、最近处理结果空态、输入框；⑤ 页面外壳无横向滚动条。 |
| inferred | 340px 固定 flex 列（`panel.css .pm-suggest-layer{flex:0 0 340px;width:340px}`，源码已证）在桌面与主区抢宽；表格叠印与行高/定位或投影卡下沉有关，需 bbox 探针定位；rail 重复条目疑似导航模型重复渲染（待核 `buildNavModel`）。 |
| unknown | rail 重复条目的数据来源（OKR 树被误铺进 rail？分组重复挂载？）；表格叠印是否仅在副驾展开时出现。**禁止在未复现前把 rail 重复写成已成立缺陷。** |

### S2 `22da58e4-…png`｜总览看板（桌面，约 1440）

| 级别 | 事实 |
|---|---|
| observed | ① 底部「完成历史趋势（近 8 周）」柱状图卡与「任务 25 条」列表卡**重叠**：柱状图压在列表卡上沿/行上；② 成员负载（张三/ice 同刻度 MAX 1）、风险矩阵（只 risk，空 3×3）、未来按周计划（W1=1/W2=2）、项目状态·规模（5 个项目，项目名截断「浏览器…」）、客观进度·清单（空态文案）；③ 编辑入口「布局编辑」；④ 左 rail 同样重复 OKR 条目。 |
| inferred | 浏览态为静态 CSS grid 按持久化 x/y/w/h 放置，**无碰撞检测、无压实**；卡片内容超出分配高度时 `.pm-bento-card{overflow:hidden}` 裁切而非内滚；编辑态 RGL `compactType=vertical` 的排布与浏览态静态放置口径不一致，导致同一布局两处结果。 |
| unknown | 重叠来自持久化坐标冲突，还是单卡内容超高把下方卡顶开被裁切；需导出该用户布局 JSON + bbox 探针判定。 |

### S3 `f8f5f331-…png`｜成功反馈深色可滚卡（桌面）

| 级别 | 事实 |
|---|---|
| observed | 深色居中结果卡：✓ 任务已更新并保存，随后**全字段 dump**（任务 ID t-0023 / WBS 1 / 项目 ID p-0005 / 父任务 无 / 标题 / 说明 / 负责人 未填写 / 状态 进行中 / 优先级 P1 / 开始 2026-10-18 / 截止 2026-10-25 / 完成日期 未填写 / 进度 30%），卡内纵向滚动条，右上 × 关闭。 |
| inferred | 成功文本 = `任务已更新并保存。${wrappedNote}\n${renderTask(task)}`（`commands/task.ts:278`，源码已证），把全字段转储塞进成功反馈；缺「只报变更字段 + 稳定句柄」的摘要契约；深色卡是宿主结果卡还是 pm 自有 overlay，**宿主侧 unknown**（apps/web 为薄壳，UI 在 packages，本合同不深查）。 |
| unknown | 宿主结果卡是否原生支持折叠/复制；pm 侧可独立先做「短摘要 + 可展开详情」。 |

### S4 `af5f1c29-…png`｜宿主 Greeting 聊天（命令回声 + 未渲染 plan 块）

| 级别 | 事实 |
|---|---|
| observed | ① 折叠命令回声行平铺原始 JSON：`> pm · {"entries":[],"pendingCount":0}`、`> pm · {"projects":[{"id":"p-0001","name":"浏览器功能验收","description":"真实 Web 端到端验证","owner":"史冰冰","statu..."}]}`；② 车道状态回声重复出现两次；③ AI 回答以普通列表渲染（状态/进度/截止/起始/说明/证据）；④ 末尾 ```json plan 块以**字面围栏 + 原始 JSON 文本**平铺在浅色卡内，未渲染为等宽代码块、不可折叠；⑤ 成功更新回声同样截断平铺。 |
| inferred | 宿主聊天对命令输出未做结构分型；GFM 围栏代码块未走代码渲染；plan/原始 JSON 与人类摘要混排。 |
| unknown | 宿主渲染管线（packages 内 markdown 支持度）由 C 方核；pm 侧可先把命令输出改成「人类摘要为主、原始 JSON 折叠为附属」。 |

### S5 `feffb13f-…png`｜误把 plan 贴进 capture-apply（P0-04 旅程事故）

| 级别 | 事实 |
|---|---|
| observed | ① 用户把 ask 生成的 `{"plan":[{"stepId":"s1","action":{"op":"risk.create",...}}]}` 贴进 capture-apply；② 红色错误**出现两处**：时间线折叠行 `^ pm · 草稿校验未通过，未写入任何任务：- 草稿须包含 candidates 数组`，下方红色描边卡重复同一句；③ **零写入**（安全成立，`capture-apply` 整批预校验拒绝，源码已证）；④ 错误未指引「回到哪个块、复制哪段、怎么重试」；无保留上一草稿、无一键重试。 |
| inferred | 校验错误只报「缺 candidates」，缺形态识别（贴的是 plan）与恢复路径；错误双发（命令行 + 卡片）造成冗余。 |
| unknown | 宿主能否在会话内保留上一草稿（C 方核）；pm 侧可经 draftId 句柄在命令层解决（§7）。 |

### S6 `4e014244-…png`｜K6 长结果 + metric 原始 JSON + reflect 截断

| 级别 | 事实 |
|---|---|
| observed | ① K6 交付检查：先嵌 ```json 原始 rule 数组（rule/ruleLabel/taskId/title/reason/suggestion），下方才是「逐条」中文人读摘要；② `/pm metric` 返回扁平原始 JSON `{"projectId":"p-0005","total":1,"byKind":{"capture":1},"undoOutcomes":{"undone":0,"conflict":0,"failed":0},"applie...}`，**命令回声重复两次、末尾截断、无表格、不可展开**；③ reflect 草稿 JSON 块顶部截断、字面围栏平铺。 |
| inferred | `commands/metric.ts:28` 直接 `JSON.stringify(metric)`（源码已证）；长结果无折叠/展开/等宽样式；命令回声重复。 |
| unknown | 宿主折叠条对长文本的现有能力（C 方核）。 |

---

## 2. 固定产品决策 → 组件 / 响应式 / 交互 / 状态 / 失败验收条款（总表）

> 每条均为固定决策（不再开放选型），实现方只可在数字范围内收紧。

| # | 固定产品决策 | 组件落点 | 响应式 | 交互 | 必覆盖状态 | 失败验收（FAIL 条件） |
|---|---|---|---|---|---|---|
| D1 | AI 副驾是**建议层**，永远不挤压主工作区；桌面可缩放、可最小化、可 ESC 退出，窄屏转 sheet（§3） | SidecarPortal（新） | 1440/1024 浮层可调 420–560；768 抽屉式；390 全屏 sheet | 拖拽调宽（仅右缘手柄）、最小化为 tab、ESC 归还焦点、内部滚动 | empty/loading/typical/long/error | 主区可用宽度被压缩到 <640px；ESC 后焦点丢失；窄屏出现双指/外壳横滚 |
| D2 | 看板布局必须防碰撞、可压实、按断点换列、内容内滚、可撤销可重置、旧布局可迁移（§4） | BoardEditor/BoardBento（改） | lg≥1200=12 列 / md≥996=8 / sm≥768=4；<768 单列堆叠 | 拖拽/调整尺寸、Undo(≤20 步)/Reset、ResizeObserver | empty/typical/dense/long/error/loading | 两卡 bbox 相交；内容溢出裁切丢失；重置抹掉合法自定义；旧版本整份拒绝 |
| D3 | 反馈六分型：toast / banner / confirm / result / card / chat，各自独立状态轴（§5） | 六个组件（§5 表） | 全视口；toast 最大宽 min(560px,100%-32px) | toast 自动消逝；confirm 阻断且展示变更对象；result 短摘要+可展开详情 | empty/typical/dense/long/error/loading | 成功吐全字段；错误只在顶部一句；loading 无占位；空态伪造零 |
| D4 | 宿主聊天安全渲染 GFM：围栏代码块等宽展示、长块折叠、命令回声单行、历史保留（§6） | HostChatRenderer（C 方） | 390 卡内换行不溢出 | 长块展开/收起、复制按钮、原始 HTML 不注入 | typical/long/error/loading | 字面 ``` 外泄；原始 HTML 执行；长 JSON 无折叠；刷新丢历史 |
| D5 | P0-04 capture 旅程配**稳定 draftId 句柄 + 一键确认**；误贴 plan 给定向恢复文案（§7） | CaptureDraftCard + capture/capture-apply 命令（改） | 全视口，draft 卡内滚 | 点按「确认落库」免复述 JSON；失败保留草稿可重试 | typical/long/error/empty | 再要求用户手抄整段 JSON；误贴后无指路；失败后草稿蒸发 |
| D6 | 长期门禁：四视口(1440/1024/768/390)×浅深×100%/200%，自动探针 + 独立目视签字，自动绿≠GUI（§8） | verify-gui-matrix.mjs（新探针，D 方） | 矩阵定义见 §8 | 探针测 scrollWidth/scrollHeight/bbox 相交；目视走 G3 | — | 仅跑 vitest 即报 PASS；漏任一视口/主题/缩放 |

---

## 3. AI Sidecar Overlay 契约（D1）

### 3.1 布局不变量（Portal 不挤主区）

- **R-S1**：副驾经 Portal 挂载到插件根层（`position:fixed; top/bottom/right`），**不得作为主内容 flex 行的兄弟列参与分宽**；主工作区在副驾展开时保持自身全宽与内部分栏，禁止 `flex:0 0 Npx` 从主列抢宽。
  - 替代方案（若实现方选择 splitter）：必须保证主区 `min-width:640px` 可用，超出则副驾转浮层，不得压缩主列。
- **R-S2 桌面（≥980px，含 1440/1024）**：宽度 420–560px 可调，默认 480；右缘拖拽手柄（hit area ≥8px 可视 + ≥12px 热区）；宽度写入 `localStorage`（key 建议 `pm.sidecar.width`），会话内生效，非法值回退 480。
- **R-S3 最小化**：头部「—/收起」把副驾收成右侧 40px 竖 tab（仅图标 + aria-label「展开 AI 副驾」），再点展开恢复上次宽度与滚动位置；最小化态不拦截主区点击。
- **R-S4 ESC 与焦点**：ESC（或最小化按钮）关闭/最小化副驾，**焦点归还触发元素**（打开它的按钮，如顶栏「AI 副驾·内嵌」）；打开时焦点进入输入框；tab 在副驾内循环，不陷入死循环（最后一个控件 Shift+Tab 回首，最后一个 Tab 出副驾归还主区）。`role="dialog"` 仅在阻断态使用；内嵌建议层保持 `role="region"` + `aria-label="AI 副驾建议层"`，不设 `aria-modal`。
- **R-S5 内部滚动**：副驾自身 `max-height: calc(100vh - 110px)`，消息/草稿/投影卡**各自内部滚动**，副驾根层只在总高超限时滚动；禁止撑高页面外壳产生二级纵向滚动。
- **R-S6 窄屏 sheet**：980px>w≥560 → 底部抽屉（max-height 45vh，上缘拖拽手柄，内部滚动）；w<560（含 390）→ 全屏 sheet（标题栏 + 关闭按钮，内容区独立滚动）。两种 sheet 都不保留桌面浮层阴影。

### 3.2 交互与状态

- 打开/最小化/ESC 三态都要保留：当前 tab（只读诊断/草稿待确认）、车道选择、已输入未发送文本、草稿步骤勾选状态。
- 状态（与 §5 对齐）：
  - `empty`：无诊断、无草稿 → 如实留白文案「当前口径下没有阻塞、逾期、过载或未指派任务」，不造数字。
  - `loading`：请求中显示 typing 三点 + `aria-busy="true"`，保留已读消息不清空。
  - `typical`：诊断摘要 + 回答气泡 + 投影卡。
  - `long`：回答/计划超过面板高度 → 内部滚动 + 长块折叠（§6 同款），不撑破。
  - `error`：模型/车道失败 → 错误 banner 贴在消息区顶部，保留提问文本，给「重试」「改用手工 /pm 命令」退路。

### 3.3 验收（Given/When/Then）

- Given 1440 浅/深，当副驾以 480 展开，Then 主内容容器 `scrollWidth <= clientWidth`（无外壳横滚），主区可见宽度 ≥640px，副驾 `offsetWidth∈[420,560]`。
- Given 焦点在「AI 副驾」触发按钮，当按 ESC，Then 副驾最小化且活动焦点回到该按钮（`document.activeElement` 断言）。
- Given 390 窄屏，当展开副驾，Then 副驾为全屏 sheet，页面外壳 `scrollWidth === clientWidth`，sheet 内容区独立滚动。
- Given 请求失败，当用户重试，Then 原提问文本保留、不被清空，错误以 banner 呈现且可读对比度 ≥4.5:1。

---

## 4. react-grid-layout 看板契约（D2）

### 4.1 网格与断点（接线已声明未用的 GRID）

现状（源码已证）：`board/types.ts` 已声明 `GRID={cols:12,rowHeight:36,margin:[12,12],breakpoints:{lg:1200,md:996,sm:768},colsByBreakpoint:{lg:12,md:8,sm:4}}`，但 `board/editor.tsx` 只传固定 `cols=12`，断点未接线；浏览态 `BoardBento.tsx` 用 `repeat(12,minmax(0,1fr))` 静态放置。

- **R-B1 断点接线**：编辑态 RGL 必须消费 `breakpoints` + `colsByBreakpoint`：≥1200→12 列、996–1199→8 列、768–995→4 列、<768→单列堆叠（auto rows）。布局按 x/y/w/h 在断点间做安全重排，不允许溢出最后一列。
- **R-B2 minmax**：浏览态轨道用 `repeat(N,minmax(0,1fr))`（已部分满足），**禁止 `minmax(xxpx,1fr)` 导致外壳横滚**；卡片 `gridColumn/gridRow` 必须落在轨道内。
- **R-B3 碰撞检测（持久化前）**：保存前遍历所有 widget，两两做 bbox 相交判定（同 §8 探针口径）；相交则拒绝写入并把冲突卡自动向 `compactType="vertical"` 下一空行下沉，或在编辑器内标红让用户先解决；**禁止静默覆盖另一卡坐标**。
- **R-B4 压实**：`compactType="vertical"` 保留；删除/下沉卡后上方不留空洞；浏览态与编辑态使用同一套坐标→轨道换算，保证「编辑看到的 = 刷新看到的」。
- **R-B5 ResizeObserver**：现有自写 ResizeObserver 包装解决初次宽 0 的做法保留；断点切换、侧栏折叠、200% 缩放时必须触发重测，禁止首帧宽 0 导致卡片塌缩。
- **R-B6 手柄**：默认 SE 调整手柄（`react-resizable-handle-se`）保留；允许追加 E/S 手柄；手柄热区 ≥12px，键盘可调整（方向键以网格为步长移动/缩放，替代拖拽，WCAG 拖拽替代）。

### 4.2 保存 / 撤销 / 重置

- **R-B7 撤销栈**：编辑态内存栈保留最近 20 步布局变更（拖拽、缩放、加卡、删卡、移动），Ctrl/Cmd+Z 回退、Shift+Z 重做；撤销只影响布局，不回滚业务数据。
- **R-B8 保存**：两步门控（沿用 reachability 终审口径）：`persistence.onSave('user',next)` 落盘成功 → `refreshBoard()` 返回 true → 才 `setLayout(next)` + 成功 toast；任一步失败 → 失败 banner，不做乐观声明，不写成功态。
- **R-B9 重置**：「恢复默认布局」必须二次确认（自定义将丢失），重置回到内置默认网格，不触碰卡片业务内容；提供「撤销本次重置」。

### 4.3 内容 overflow 与旧布局迁移

- **R-B10 卡内容不撑破**：卡头固定，卡体 `overflow-y:auto; min-height:0`；卡片高度由网格格数决定，**禁止内容把卡撑高到与邻卡重叠**（现状 `overflow:hidden` 裁切丢失内容，必须改为内滚）；长标题/长列表/图表在卡内可滚，图表提供等价数据表（dashboard-redesign：图表不靠 hover 传达）。
- **R-B11 旧布局迁移**：`persist.ts` 迁移链补 `LAYOUT_VERSION` 升级函数：坐标超出当前网格 → 夹紧到边界并标 warning；未知类型 widget → 跳过并在结果里列名，**不得整份拒绝**；version>1 的旧档按链逐级迁移，迁移失败回退默认且给出说明，不抛白屏。
- **R-B12 导入/导出 JSON** 保留；导入同样过 R-B3 碰撞 + R-B11 迁移校验。

### 4.4 验收

- Given 1440 编辑两卡上下叠放，当触发保存，Then 无两卡 bbox 相交（探针 `rectA`/`rectB` 相交面积=0），落盘 JSON 无越界坐标。
- Given 窗口 996，Then 网格为 8 列且无卡溢出第 8 列；390 下单列堆叠。
- Given 卡体超出分配高度，Then 卡体内部出现滚动条、卡片外边界不变、不与邻卡重叠。
- Given 一份 version=1 旧布局，当新版本读取，Then 迁移成功、越界坐标被夹紧、未知卡被跳过并在结果中列名，页面不白屏。

---

## 5. 反馈六分型组件状态表（D3）

> 状态轴统一：`empty / typical / dense / long / error / loading`（disabled/read-only 另算，不混入）。组件沿用 `--pm-*` 单层 token（system-ui-spec §2），禁止新造裸色值。

### 5.1 Toast（页面级瞬时反馈，fixed 顶部居中）

现状：`.pm-notice` 仅 error 变体、240px 内滚、带复制按钮；无 success/info/warn、无自动消逝契约。

| 状态 | 内容契约 | 行为 |
|---|---|---|
| empty | 不渲染（无成功/失败不弹空 toast） | — |
| typical | 单行短句：「已保存 2 个任务」「已挂载证据链接」 | success/info/warn/error 四变体；success 3s、warn 5s、error 不自动消逝需手动关；`role="status"`（error 用 `role="alert"`） |
| dense | 多条成功 → 汇总「已保存 N 项：+1 新建 / 1 更新」，不逐条堆叠 | 汇总一行，可展开明细 |
| long | 文本超 2 行 → 最多 2 行 + 「详情」展开，禁止全字段 dump（S3 问题） | 展开走 result 卡，不在 toast 里滚全字段 |
| error | 一句可执行原因 + 一个主操作（重试/手工命令） | 不自动消逝、贴字段定位、保留上下文 |
| loading | 不用 toast 表达 loading（loading 归原位区域） | — |

FAIL：成功 toast 出现全字段任务 dump；error 只有「失败了」无原因无操作；toast 堆叠超过 3 条不汇总。

### 5.2 Banner（页内常驻/区块级提示，非阻断）

| 状态 | 内容 |
|---|---|
| empty | 无（不报「暂无问题」时不占位） |
| typical | 区块顶部：stale 时间戳、部分成功、1 条提示（沿用「交付前核对」卡样式） |
| dense | 多条 → 计数汇总「N 条提示」+ 可展开列表，逐条可点定位 |
| long | 列表内部滚动，不撑高整页 |
| error | 红边 + 原因 + 重试；**禁止同一错误同时在命令行和 banner 双发**（S5 问题：去重，一处呈现） |
| loading | 骨架行（ shimmer，尊重 reduced-motion），不清空旧数据（dashboard-redesign：刷新时保留旧数据+stale 标） |

### 5.3 Confirm（破坏性动作阻断确认，替代原生 `window.confirm`）

现状（源码已证）：删项目/任务/里程碑/风险/会议全部用原生 `window.confirm`，无自定义组件。

| 状态 | 内容契约 |
|---|---|
| empty | 不弹 |
| typical | 展示**将被改变的确切对象**：类型+标题+ID+影响范围（级联删除要列出下级数）；主操作（删除）danger 样式，次操作取消 |
| dense | 批量删除 → 列清单（可全选/单项保留），显示将删 N 项 |
| long | 清单超 8 行内部滚动，底部固定操作栏 |
| error | 对象已被并发改动 → 「记录已变化，请刷新后重试」，不执行 |
| loading | 主按钮禁用 + 进行中态，防重复提交；成功后 toast + 关闭并归还焦点 |

不变量：ESC/取消关闭且焦点归还触发按钮；确认前不执行；通用「确定」不算有意义审查（必须看到改了什么）。

### 5.4 Result（命令 outcome 卡，短摘要 + 可展开详情）

| 状态 | 内容 |
|---|---|
| empty | 不渲染 |
| typical | 一行结论 + 变更对象清单（ID｜标题）+ 稳定句柄（撤销/再查） |
| dense | 批量：汇总行（成功 N / 失败 M）+ 分项折叠 |
| long | 全字段/原始 JSON 收进「详情 ▾」默认折叠，首屏只给结论 |
| error | 分项成功/失败分开列（部分成功：已建项不回滚，失败项给原因与补救命令） |
| loading | 进行中状态 + 可取消（长任务），不阻塞页面其余操作 |

FAIL（对应 S3）：成功卡首屏全字段 dump；部分成功整卡报错；无撤销/句柄出口。

### 5.5 Card（数据容器，看板卡/投影卡/草稿卡）

| 状态 | 内容 |
|---|---|
| empty | 合法零（完成 0）与「无数据/无权限/加载失败」分开，不互相冒充 |
| typical | 标题 + 单行主指标 + 必要辅助 |
| dense | 多记录 → 卡内列表滚动，头部显示计数 |
| long | 内容内滚（R-B10），不溢出不裁切 |
| error | 卡内错误态 + 重试，不把整卡变白 |
| loading | 骨架占位，保留卡框尺寸防 CLS |

### 5.6 Chat（副驾/宿主消息气泡）

| 状态 | 内容（详见 §6） |
|---|---|
| empty | 系统首条能力边界说明 |
| typical | 人读摘要为主，结构化结论先行 |
| dense | 多轮短问连续，气泡分组不淹没 |
| long | 长文/JSON 折叠（≥12 行）+ 展开 |
| error | 失败说明 + 退路，保留提问 |
| loading | typing 指示 + `aria-busy` |

---

## 6. DSH 聊天安全：GFM + 历史 + 长结果（D4，宿主责任方 C）

### 6.1 渲染安全

- **R-C1 GFM 子集**：支持标题/无序有序列表/加粗/行内 code/**围栏代码块（```lang）**/引用/分隔线；围栏块渲染为 `<pre><code>` 等宽样式、语言标签、复制按钮；**原始 HTML 一律转义，不注入**（untrusted content：模型输出与工具结果都是不可信数据）。
- **R-C2 长块折叠**：围栏块或单条消息 ≥12 行默认折叠（显示前 3 行 + 「展开 N 行」），展开/收起不丢内容；metric/原始 JSON 一律走折叠块，不在首屏平铺（S6 问题）。
- **R-C3 命令回声单行化**：`> pm ·` 折叠条只显示人类摘要（如「已保存 2 个任务」「命中 2 条提示」），原始 JSON 收进折叠块；同一命令不重复回声（S4/S6 重复问题）；折叠条 `aria-expanded` 可键盘切换。
- **R-C4 结构优先**：命令输出（check/metric/capture 等）默认输出人类摘要；原始 JSON 作为附属折叠「原始数据」，不靠用户读 JSON 判断结果。
- **R-C5 历史保留**：刷新/重进会话保留已渲染历史，不重新请求、不丢已确认草稿；草稿与消息来源区分（用户/AI/系统/工具结果），不只靠颜色区分（Distinction 门）。

### 6.2 pm 侧可独立先做的输出改造（不依赖宿主）

- `metric.ts`：先输出人读汇总（按 kind 计数、撤销结果、采纳步数、小样本不下结论），原始 JSON 放末尾折叠块。
- `task.ts:278` 成功：短摘要「已更新 t-0023｜标题｜变更字段：状态→进行中，进度 30%」，全字段进详情。
- `check`：先「逐条」人读结论，规则原始数组进折叠块。

### 6.3 验收

- Given 一段含 ```json plan 的回答，When 渲染，Then 出现带语言标签的等宽代码块、无字面 ``` 外泄、≥12 行默认折叠。
- Given `/pm metric`，Then 首屏为计数摘要，原始 JSON 在折叠块内，无重复回声。
- Given 注入文本 `<img onerror=...>`，Then 转义为纯文本不执行。

---

## 7. P0-04 稳定句柄 / 一键确认旅程 + 误贴 plan 恢复文案（D5）

### 7.1 旅程（Entry→Draft→Review→Confirm→Complete→Recovery）

1. **Entry**：用户 `/pm capture <项目> "<会话文本>"` → 观察模式草稿（零写入，现状保留）。
2. **稳定句柄（R-P1）**：capture 返回分配稳定 `draftId`（会话内/短期有效，建议 10 分钟，与既有撤销句柄同口径），草稿内容服务端/会话暂存；返回文本与草稿卡同时展示 `draftId`。
3. **一键确认（R-P2）**：草稿卡（副驾或结果卡）提供「确认落库」按钮，点击等价于 `capture-apply <项目> <draftId>`，**用户不再手抄整段 JSON**；命令行仍保留 `capture-apply <项目> "<json>"` 作为高级路径。
4. **Review**：确认前列出每个候选（标题/截止/负责人/证据条数）供勾选/编辑，整批预校验任一失败零写入（现状保留）。
5. **Complete**：成功 result 卡：`已确认落库 N 个任务：- <id>｜<标题>` + 证据挂载 + 撤销出口（沿用 `/pm task delete <id>` 溯源，不建第二套 undo）。
6. **Recovery**：见 7.2。

### 7.2 误贴 plan 恢复文案（固定文案，可润色不得改变指路）

**触发识别（R-P3）**：capture-apply 解析成功但对象含 `plan` 键、无 `candidates` 键（即贴的是 ask 计划块，S5 形态）→ 走定向错误，区别于「JSON 无法解析」「真缺 candidates」。

**固定恢复文案（error，零写入声明前置）**：

> 未写入任何任务（零写入）。
> 你贴的是 AI 的**计划块（plan）**，不是「对话补档草稿」。capture-apply 需要含 `candidates` 数组的补档草稿。
> 正确做法二选一：
> 1. 回到 `/pm capture` 输出的【对话补档草稿 · 观察模式（未写入）】块，复制其中含 `candidates` 的整段 JSON；
> 2. 直接点草稿卡上的「确认落库」（免复述）。
> 若这是你想要的多步计划，请改用 ask-apply 对应入口，不要贴进 capture-apply。

**其他错误分支文案**：
- JSON 无法解析：「草稿 JSON 无法解析：请复制 capture 输出的完整 ```json 块（含首尾花括号）；上一份草稿未丢失，可点重试。」
- candidates 为空：「草稿里没有可落库的候选（candidates 为空）：回 capture 重新整理，或手工 /pm task add。」
- **R-P4 草稿保留**：校验失败不清除会话内草稿（draftId 仍在），提供「重试该草稿」「放弃草稿」；错误单处呈现（不双发，见 5.2）。

### 7.3 与 UAT 用例对齐（不得削弱既有预期）

| UAT | 既有预期（固定，不可改） | 本合同增补 |
|---|---|---|
| P0-03 观察模式不落库 | 返回「对话补档草稿·观察模式（未写入）」+ 候选与 capture-apply JSON；`task list` 无新增 | 增补稳定 draftId（R-P1），仍零写入 |
| P0-04 确认后落库 | 候选一次性落库；首个适用证据挂 evidenceUrl；任一候选非法→整批拒绝零写入 | 增补一键确认（R-P2）、误贴 plan 定向恢复（R-P3）、失败保留草稿（R-P4） |
| P0-05 证据轻挂接 | 仅 evidenceUrl 更新，状态/进度/排期不变，返回溯源说明 | 不改；成功走 §5.4 result 短摘要 |

### 7.4 验收

- Given capture 刚产出草稿，When 用户点「确认落库」，Then 无需粘贴 JSON 即整批落库并返回创建清单（兼容 P0-04 手抄 JSON 高级路径）。
- Given 用户误贴 `{"plan":[...]}`，When capture-apply，Then 零写入、出现 7.2 定向文案、draftId 草稿保留、可一键重试。
- Given 整批预校验任一候选非法，Then 零写入并逐条列错，不产生半套任务（P0-04 预期 3）。
- Given 草稿含证据，When 落库，Then 首个适用证据挂到 evidenceUrl 且状态/进度/排期不变（P0-04 预期 2 / P0-05）。

---

## 8. 长期门禁 + 自动/半自动截图矩阵（D6）

### 8.1 视口 × 主题 × 缩放矩阵（自动探针 + 独立目视）

| 维度 | 取值 |
|---|---|
| 视口宽 | **1440 / 1024 / 768 / 390**（高取 900/800/760/844 即可） |
| 主题 | 浅 / 深 |
| 缩放 | 100% / **200% 文本缩放**（200% 下标签换行不裁切、控件仍贴全标签） |
| 路由 | 总览看板、全部任务、里程碑、风险与问题、会议、进度汇报、交付物、人员负载、甘特、OKR、习惯、副驾展开/最小化 |
| 旅程 | S01–S08 冒烟 + P0-04 capture 全旅程 + 删除确认 + 看板保存/撤销/重置 |

矩阵全组合由 D 方登记为用例清单；自动探针跑结构性断言，**目视签字走 G3 独立门，自动绿≠GUI**。

### 8.2 自动探针（新增 `verify-gui-matrix.mjs` 类，只读 DOM，不写业务数据）

- **P-1 外壳横滚**：对每个视口/主题断言 `document.documentElement.scrollWidth <= clientWidth + 1`（允许 1px 抗锯齿）；插件容器同理，表体内部滚动属已裁决例外但不得溢出外壳。
- **P-2 垂直溢出/撑破**：`scrollHeight > clientHeight` 的卡片必须自身可滚（`overflow-y:auto` 且内容可滚到），禁止 `overflow:hidden` 裁切丢失。
- **P-3 卡包围盒相交**：同层兄弟卡/行元素两两 `getBoundingClientRect()`，重叠面积 >0（除合法悬浮层/tooltip）即 FAIL；覆盖 S1 表格叠印、S2 看板重叠。
- **P-4 200% 缩放**：控件文本不被截断（`scrollWidth<=clientWidth` on label）、标签与控件关联不断裂。
- **P-5 键盘**：关键旅程可纯键盘完成（Tab/Enter/ESC），焦点环可见，无焦点陷阱。
- 探针只产报告（route/视口/主题/失败项/rect 数据），不替代人工目视；截图留存矩阵目录，命名 `{route}-{w}-{theme}-{zoom}.png`。

### 8.3 独立验收门（写进长期门禁）

1. 设计专家对每条组件契约（§3–§7）签字；
2. 六状态（empty/typical/dense/long/error/loading）每状态有 fixture 与证据；
3. 四视口 × 浅深 × 200% 全过探针 + 目视；
4. 键盘 + 长内容 + 完整旅程（含 recovery）实测；
5. 独立测试专家（非实现者）签 PASS/FAIL/BLOCKED；
6. build/vitest/verify 全绿只是前置，**不得单独作为 GUI 通过依据**。

---

## 9. Handoff 给 B / C / D 的接口

> 角色映射由组织者确认；默认 B=pm-tool 前端实现（web 面板/看板/反馈组件/命令文案），C=DSH 宿主聊天渲染，D=独立测试与门禁探针。以下为文件/行为/验收接口。

### 9.1 给 B（pm-tool 前端 + 命令层）

| 项 | 内容 |
|---|---|
| 必读文件 | 本契约 §3/§4/§5/§7；`system-ui-spec-20261017.md` token/状态轴；`deep-integration-v2-p0-dev.md` K4/K12 |
| 涉及文件（只列接缝，不改数据） | `src/client/panel.tsx`（sidecar Portal/result/confirm）、`src/client/panel.css`（六分型样式）、`src/client/board/editor.tsx`、`board/BoardBento.tsx`、`board/persist.ts`、`board/types.ts`（断点接线）、`src/commands/capture.ts`（draftId/一键确认/恢复文案）、`src/commands/metric.ts`（摘要+折叠）、`src/commands/task.ts:278`（短摘要） |
| 行为 | D1 sidecar、D2 看板、D3 反馈组件、D5 P0-04 旅程；遵守两步保存门、零写入预校验、不改 DSH 上游 |
| 验收接口 | 逐条对 §3.3/§4.4/§5 各 FAIL 行/§7.3 自测；交付状态 fixture 清单；不 commit/push，交 D 独立验收 |

### 9.2 给 C（DSH 宿主聊天渲染）

| 项 | 内容 |
|---|---|
| 必读文件 | 本契约 §6；宿主现有渲染管线源码（packages 内，C 方自核） |
| 行为 | GFM 围栏代码块渲染、长块折叠、命令回声单行去重、历史保留、HTML 转义；不改 pm-tool 业务命令 |
| 验收接口 | §6.3 三条 Given/When/Then；注入转义用例；390 不溢出；历史刷新保留 |
| 边界 | 只读/改宿主 UI，不动模型/凭据/账本；pm-tool 输出改造（6.2）由 B 并行 |

### 9.3 给 D（独立测试 + 门禁）

| 项 | 内容 |
|---|---|
| 必读文件 | 本契约 §8；`P0-P3用户验收测试用例.md` 全量；`AGENTS.md` 独立测试门（ADL-045） |
| 行为 | 建四视口×浅深×200% 矩阵用例；实现 §8.2 探针（scrollWidth/scrollHeight/bbox 相交/200%/键盘）；独立跑 S01–S08 + P0-04 旅程 + 看板保存/撤销/重置；登记截图与证据 |
| 验收接口 | PASS/FAIL/BLOCKED 逐条约制；自动绿≠GUI 书面声明；不得复用实现者自测结果当独立结论 |

### 9.4 Open Decisions（需组织者/产品拍板，不阻塞 B/C 先行）

| 问题 | 为何重要 | Owner | 阻塞？ |
|---|---|---|---|
| draftId 会话内暂存放内存还是服务端短期表 | 重启后草稿是否可恢复 | 组织者+B | 否（先内存 10 分钟） |
| sidecar 默认宽 480 是否符合常用密度 | 宽屏阅读效率 | 设计专家签字 | 否（420–560 内可调） |
| 原生 window.confirm 是否全量替换为自定义 confirm | 删除动作一致性 | 组织者 | 否（破坏性动作先换） |
| rail OKR 重复条目根因（S1 unknown） | 是否独立缺陷 | B 复现后定级 | 否（先探针取证） |

---

## 附：本合同与冻结规范的关系

- 本合同不改动 `system-ui-spec-20261017.md` 已冻结的 token/状态轴/三档采证；只在其长期门禁层追加本次四视口（补 1024）、200%、六状态、独立签字要求（见该文件 2026-10-18 追加节）。
- 所有数字（420/560/480、12 行折叠、20 步撤销、10 分钟句柄）为实现约束值，实现方可在合同范围内收紧，不得放宽。
