# B1-GUI-01 有界 fixture 与原动作澄清

> 2026-10-21，trae，独立测试专家。仅澄清原用例并交 Main 采证；没有开发、运行产品测试、操作 GUI 或判定产品 PASS/FAIL。r3 原局部 PASS 保留，完整门仍按原报告登记，不由本附件升级。

## 1. 派单、登记与边界

- 当前负责人原句：“独立测试专家只澄清原B1-GUI-01有界fixture/动作，不开发、不自验。”“只写docs/testing/board-fixture-clarification-20261021*和自有tmp”“不build/install/产品改/启服/读private/操作GUI/commit”。持续分工授权沿用，不扩大为本专家提交权限。
- 本单挂接 [remaining 总登记](remaining-acceptance-register-20261021.md) A1 / 原 B1-GUI-01，补 [A0 原证审查](a0-gui-raw-review-20261021.md) §4.2 / §8 第2项。此处作附件登记，不修改其他专家原件或总登记。
- 依据：`AGENTS.md`、`collaboration.md` §9 / §11；[原收口计划](independent-acceptance-batch1-closure-plan-20261021.md) §5 / §13 / §14。§13 的 Finder 对象纠正、§14 的缺 code GUI 撤销继续有效，本单不接手 numbers/FC，不恢复非法 legacy fixture。
- 可写仅本前缀；Main 仍是唯一产品写者、builder、GUI 执行端。本专家只读仓内源码/合同，不读运行私有文件、业务库内容、凭据，不 pull/install/build/启服/停服/操作 GUI/commit/push。
- 结束条件：真实 schema、目录下限、标准导入、原三拖与逐态保护说明交齐即结束澄清。后续执行事实、原证审签另批完成，不把文档自检当产品验收。

## 2. 最小合法 fixture

文件：[board-fixture-clarification-20261021-fixture.json](board-fixture-clarification-20261021-fixture.json)。

本项目卡种字段为 `type`，不是 `kind`。A/B 沿用 r3 ID；D 现在明确映射为真实 `objectiveProgress`，不是给旧 r3 追补不存在的 D 原证。其余三卡仅满足原“至少6张可区分卡”，不是新增卡种矩阵。

| 别名 | 真实 ID / type | 可见标签 | x,y,w,h | 真实 minW,minH |
| --- | --- | --- | --- | --- |
| A | w-hero / completionHero | 任务完成率 | 0,0,12,6 | 3,6 |
| B | w-ms-deliver / milestoneDeliverable | 里程碑 · 交付物 | 0,6,12,2 | 4,2 |
| C | w-scale / projectScale | 项目状态 · 规模 | 0,8,12,2 | 3,2 |
| D | w-obj / objectiveProgress | 客观进度 · 清单 | 0,10,12,2 | 3,2 |
| E | w-load / peopleLoad | 成员负载 | 0,12,12,2 | 4,2 |
| F | w-risk / riskMatrix | 风险矩阵 | 0,14,12,3 | 3,3 |

全部 `config:{}` 与真实目录默认一致；`i === layout.i`，六个 ID/type 各自唯一。`version:1`、`scope:"user"`；无额外 envelope、假项目 ID、假 updatedAt/revision、保留空卡或假巨高 spacer。前三卡相邻占据 `[0,6)`、`[6,8)`、`[8,10)`，全部六卡连续，无相交，`max(y+h)=17`。

下限来源是 `widgets.tsx` 的各 `WidgetDescriptor` → `WIDGET_CATALOG`，不是臆定统一 `h=1/2`。尤其 A 必须 `h>=6`、F 必须 `h>=3`。`persist.ts:parseWidget` 保留输入的 minW/minH，`clampOne` 尊重已声明下限，**不会从目录自动补回被故意降低的下限**，所以附件显式填真实值。编辑器导入/保存的 `CONFIG_SCHEMAS` 对这六个内置类型没有额外 schema，真实目录默认空对象合法。

全宽的目的只是消除水平空带：`compactVertical` 按当前 y 稳定排序，在同一 x 列带从顶部找无碰撞行。`w=12` 时 A 不能像 r3 的局部宽卡一样经水平空带压回首行；它仍可能因垂直填洞移动到比松手 y 更小的合法位置。该说明是源码解释，不是实际 GUI 结果。

## 3. 标准导入与初态落盘

运行环境沿原合同：macOS，真实浏览器 CSS viewport `1440×900`、100% 缩放、浅主题；Node 22 / pnpm 11.28.5 仅为候选环境口径，本专家不构建。

1. Main 复用当前已认领的隔离服务，不重启或覆盖正在执行 numbers/FC 的对象。按原 §2.2 绑定候选、实际下发 bundle、PID/端口、开关和隔离写根；本专家看到的仓 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 不是 dirty 候选的完整身份。
2. 原要求“隔离空根创建一个项目”保持：使用此前合法创建的该隔离 QA 项目，或 Main 已分配的空隔离测试范围；不得清库、从正式库拷贝或重建覆盖别人的在途数据。若当前服务含其他 QA 项，只保护它们，不偷偷把 fixture 导入业务实体表。
3. 测试对象固定为**跨项目“总览看板”**，搜索框为空；不要误开某项目“概览”。编辑器作用域保留“我的（个人）”。`BoardBento` 无 projectId 时真实写路由为 `user`；下拉 scope 只改变布局标记/前端历史，不改 activeScope 路由。
4. 在该隔离总览点“布局编辑” → “导入布局” → “选择 JSON 文件”，选择附件。真实链为 FileReader → `BoardBento.onImportText` 的 JSON/`parseLayout`/registry 校验 → 编辑器 config 校验 → 草稿。**标准导入允许替换此测试草稿；不允许手改 DB、React props、DOM 或网络业务响应。**
5. 核六卡与附件一致，关闭“导入布局”面板，点“保存布局”，等“布局已保存并刷新”。这一笔是前置初始化写，不计三拖。再点“布局编辑”，导出 `layout-before.json`；关闭导出/卡库/配置/历史面板，确保撤销栈初态为空。导入本身入撤销栈，所以必须保存退出后重新进入，不能把导入撤销算成三拖撤销。
6. 比较全部 widgets/config/layout 与附件一致，核前置导入只改隔离 `settings/dashboard_user`。若被跳卡、夹紧或出现相交，先交专家前置差异，不绕校验或改产品。初态与实际文件 sha256 入证据索引。

合法命令语法另供 Main 回读定位：

```text
/pm dashboard get user
/pm dashboard put user <完整布局JSON对象，不是文件路径>
```

本轮选择 UI 标准导入+保存，不需要 `put` 种库；后端 `put` 只有 version/widgets 轻校验，不等于通过前端目录/config/碰撞闸门。不得用该命令塞非法 fixture。

## 4. 原三拖的可执行目标

**原句不变：A 首行→D 下方，B→初始 A 位置附近，A→上半区。** 不以任意三个 delta、数字位置输入、键盘 nudge、自动排版、删除卡片替代真实指针三拖。坐标仅用于帮助命中，不能把 drop 坐标等同最终 canonical。

### 4.1 第一拖 A 到 D 下方

- 初始 A 顶端在 y=0，D 占 y=10..12；抓住 A 的非交互标题/边缘，避开 ×、button/input/select/link/`[data-nodrag]` 与右下缩放柄。卡体空白/标签属于 `.pm-rgl-item-wrap` 真拖动柄。
- 一行步距为 `36+12=48px`；RGL 默认内 padding 为12，卡顶约 `grid.top+12+48*y`，A 高约276px。固定 grabOffset（指针到 A 顶边距离），建议约18px。初始计划把 A 顶端拖到 y≈12，即约576px纵移；**以松手前实际 D 底边及占位卡顶为准**，不是硬编码屏幕 y。
- 在 `1440×900` 内抓卡，左键持续按住，向下移动；若目标超出可见范围，配合真实 wheel/触控板沿实际纵向滚动祖先滚动，再继续真实指针移动。先记录滚动的是 `.pm-shell`、宿主祖先还是 document；stage 本身通常内容自撑高，不能假设它是纵向滚动器。横向需要时只滚 stage 到可见卡带。
- 每次指针均在 `0<=clientX<1440, 0<=clientY<900` 的可见画布区，避开系统边界。滚动后重新读取 D/占位卡 bbox，并移动指针使占位卡顶确实在 D 底边下方；**wheel 的滚动量不保证自动成为 RGL 拖动量**，必须以拖动态占位/卡顶和实际 mousemove 为证，不用 `dy=200` 或离屏坐标声称到达。
- 松手前留原帧/只读 DOM：D ID及底边、A/placeholder 顶边、指针坐标、滚动偏移。若指针输入设施不能持按+滚动而到达目标，记录动作未达到并交专家，不伪造 mouseup、不改成数字输入。
- 松手后容许 A 从 drop y≈12 垂直压实到更小 y，例如前方仅 B/C/D 时 A 可到 y=6；D 可填洞到 y=4。该示例表示合法 `A.y >= D.y+D.h`，不是指定唯一终态。完整卡集/config/w/h 保持、无相交、无远推、A 已实际离开初始上部，才能支持后续“返回”。若 A 仍在首行，仅记录事实与目标原证，由专家区分动作未达/碰撞排序/产品行为，不自判。

### 4.2 第二拖 B 到初始 A 位置附近

- “初始 A 位置”固定为 `layout-before` 中 `[x=0,w=12,y=0..6)` 占据的首张卡区域，不随第一拖后 A 的位置更新，也不是旧 r3 的 `(0,10)`。
- 第一拖后 B 可能因填洞已经到 y=0，**不要再无效拖到同一 y=0**。建议在初始 A 覆盖区域内，将 B 顶边落在 y≈4 的下半段附近（`grid.top+12+192px`，加 grabOffset 得指针目标）；这仍是原 A 所占首卡区，不是改成“拖任意位置”。
- 同一编辑会话，用真实指针拖 B，必要时真实滚回顶部；记录 B 原位置、松手目标和压实终态。目标区域与最终 y 分开。y≈4 是种子建议，不冻结邻卡碰撞后的唯一坐标；本次必须形成第二个不同的稳定全布局。若被压回同一布局，保留证据并交专家，不把无变化动作计成第二次离散拖动。

### 4.3 第三拖 A 返回上半区

- 不退出、不保存；将**第一拖已进入 D 下方的同一 A**真实拖回初始首卡区，建议 A 顶端接近 y=0。需要时持按配合真实纵滚，松手前记录目标；不把仍在首行的水平变化当“从下部返回”。
- 上半区按同一初态 canonical 参照，viewport 滚动后的可见屏幕顶不是 canonical 顶。松手后记录 A 已回上部和第三次稳定全布局；各态保留原证，Main 不判 PASS/FAIL。

## 5. Main 小采证单

| 状态 | 原动作与最小原证 |
| --- | --- |
| drag0 | 初始化保存后重进；连续录像起点、六 ID/全部 bbox、layout-before、各层尺寸/scroll、菜单真实100%及浅主题引用 |
| drop1 / drag1 | A→D下方的松手前指针/占位/D帧；稳定后全布局、bbox、空白、stageHeight，撤销可用 |
| drop2 / drag2 | B→初始A区域的松手目标帧；稳定后全布局、bbox、空白、stageHeight；不得仅写delta |
| drop3 / drag3 | 同一A从D下方回上半区目标帧；稳定后全布局、bbox、空白、stageHeight |
| undo1 / undo2 / undo3 | 连续三次“撤销”；全布局依次对照 drag2 / drag1 / drag0，每态同样采尺寸，末态撤销不可用 |
| save-draft / reloaded | 原§5第7步另做两次真实拖动；存稳定草稿后“保存布局”，等刷新提示，刷新重进导出并回读同一dashboard |
| cancel-draft / cancel-reloaded | 原§5第8步另拖一次形成不同草稿，“取消”；刷新重进，导出与保存版本一致，取消窗口保护清单零业务写 |

全程连续三拖/三撤销部分不插数字调整、自动排版、导入、退出或保存；各状态不必为凑数量重做旧 r3。导出预览/下载只作只读证据，可在稳定检查点执行并关闭面板；录像须能看清原操作，不以下载遮挡帧代表 drop。尺寸动画约200ms，稳定采证至少等两个 rAF 后再等约250ms并核两次值一致；这不是产品速度验收阈值。

### 5.1 每态 selector / field

| 观察对象 | 真实 selector / 可读字段 |
| --- | --- |
| 编辑舞台 | `.pm-bento-editing .pm-bento-stage`：bbox.height（明确标 `stageHeight`）、clientHeight、scrollHeight、clientWidth、scrollWidth、scrollTop/Left；computed overflowX/Y、paddingTop/Bottom |
| canonical 画布 | `.pm-bento-stage .pm-bento-grid.pm-rgl-editing` 及其 `.pm-rgl`：bbox、client/scroll尺寸、inline/computed height、实际 cols引用；RGL高不同于stage高 |
| 六卡 | `.pm-rgl [data-widget-id]`：ID、aria-label、bbox全四边/w/h、computed transform/height、×和右下柄bbox；不要把placeholder计成第七张 |
| 正在拖动 | `.pm-rgl .react-grid-placeholder`、`.pm-rgl .react-draggable-dragging`（若实际存在）：松手前bbox；原录像/输入日志记录clientX/Y/buttons=1、mouseup时点，不改DOM造字段 |
| 撤销 | `.pm-edit-tools button` 中文字“↶ 撤销”的 disabled；初态/undo3不可用，三拖后可用 |
| canonical 数据 | 编辑器“导出布局” JSON 的 `widgets[].i/type/config/layout.{i,x,y,w,h,minW,minH}`；草稿不能用后端get冒充，get只读已保存版本 |
| 外壳与滚动祖先 | `.pm-shell`、`.pm-main`、实际 overflowY 且 scrollHeight>clientHeight 的祖先、`document.scrollingElement`、html：bbox、scrollTop/Left及client/scroll尺寸；只读探针不等真实输入 |

所有 bbox 使用同一态 viewport 坐标比较；另记 card.bottom - grid.top / stage.top 形成内容相对边界。滚动造成屏幕 bbox 改变不算 canonical 漂移。

每态派生 `maxBottomRow=max(y+h)`、完整二维碰撞对、按 y 排列的行区间及洞；独立读取真实 `stage.scrollHeight`，**不把 maxBottomRow 当 stageHeight**。当前 RGL 公式为 `maxBottomRow*36+(maxBottomRow-1)*12+2*12 = 48*maxBottomRow+12`，附件初态参考828px；stage另有8px/20px padding，实际高度受布局/面板/宿主CSS影响，以现场字段为准。底部可观察空区是stage padding/内容尾部，不增加业务spacer，不要求预置大洞。异常巨空白需实际高度与最后卡底边配对，不能仅凭行号或截屏猜远推。

## 6. 写入白名单与 before/after

Main为本用例唯一 dashboard 写者；同一隔离总览期间不并行保存布局。正式树/profile/资产仍只读；其他 numbers/FC 可以继续，但不能用它们的时段清单替代本用例。

| 窗口 | 隔离后端允许差异 | 浏览器/证据输出 |
| --- | --- | --- |
| 前置导入→初次保存 | 仅 `settings` 的 `dashboard_user` 记录；新建或修改 `{value:layout, updatedAt}` | 导入草稿、显式保存后的 `pm-dash-layout-history:user`，≤5版本；fixture/导出/截图/录像写分配的证据根 |
| 三拖→三撤销，未保存 | 无业务记录差异 | 内存draft/historyRef、滚动/选中UI可变；不得落后端dashboard |
| 两拖→保存→刷新重进 | 仅同一 `dashboard_user.value` 全布局及该记录的 updatedAt | 同一 localStorage 历史键按真实去重/≤5更新；导出文件只在分配根新增 |
| 取消草稿→刷新重进 | 后端全部业务记录零差异，包括 `dashboard_user` | 原已保存历史不应因取消新增版；浏览器非业务缓存另列，不笼统宣称全部浏览器文件零写 |

每个窗口各有 before/after 全键集+sha256+mtime；不仅核已有六文件，还核新增/删除、实际 storage/backup/export/附件写根。记录具体 command argv/cwd/exit/时间，脱敏差异只交键名/结构/指纹，不泄露个人数据或认证。

**legacy 条：**总览读回链为 user > 旧 `dashboard_project` > 默认；项目概览为 `dashboard_project_<p-id>` > 旧 `dashboard_project` > 项目默认。旧 `dashboard_project` 是只读 fallback，不是本用例允许写项；本轮不 reset/put 旧全局、不制造 legacy 迁移样本。`dashboard_project_<p-id>`、其他 settings键、项目/tasks等全部业务表也零变化。布局JSON的 `scope:"user"`、后端键和前端历史作用域需分别记录，不能仅凭下拉名字推断写键。

`/pm web snapshot` 可能由宿主产生 session/workspace 非业务缓存；若manifest覆盖此类根，列实际键及来源，不把“缓存”当任意写豁免。发现白名单外差异先停止该用例写操作、保原证交专家归因，Main不自判产品失败。并发微信独立试点变化单列真实路径/时段/owner，不回填“全data零变化”也不归罪看板。

## 7. 静态核对、未覆盖与交接

本说明只读源：`types.ts`（GRID）；`widgets.tsx`（目录及默认）；`persist.ts`（parse/clamp）；`editor.tsx`（导入/真实dragStop/作用域）；`editor-ops.ts`（compactVertical/导出）；`BoardBento.tsx`（真实路由/导入）；`commands/dashboard.ts`（落盘键）；`history.ts`（浏览器历史）；`panel.tsx/panel.css/board.css`（接线/selector）；现有依赖 `react-grid-layout@1.4.4` 的 GridItem/ReactGridLayout/utils（源码只读，不调用产品）。

核查时三个关键源sha256：`widgets.tsx=0b4b2a6b85432a705e2f2e39cc97660f8df450cb82ec1abb8776e4c6301ce95a`；`editor.tsx=5ddf057cf5bb0eab59dbb31233b59c586959705f452b56f59bc88d8a885cf6f8`；`editor-ops.ts=ade6c08dd648dc02cb6813c89d159e59116052e0d3701eabd3cef414e7d06601`。这些是澄清依据，不替运行候选绑定。

本次**文档静态检查**环境 `darwin/arm64`、Node `v22.23.3`：只读 Node 内置 JSON/assert/fs/crypto 和已安装 TypeScript 的源码 AST，核6卡ID/type唯一、6/6目录下限与空默认config、整数合法尺寸、连续17行、4/4相对链接及无尾空白，exit0；未编译/执行任何产品模块。`git diff --check -- docs/testing/board-fixture-clarification-20261021.md docs/testing/board-fixture-clarification-20261021-fixture.json` exit0（文件未跟踪，另以上述文本检查覆盖新文件）；收尾只读 sha256 复核三关键源未变。附件 sha256：`41c91b49024270667b5a43e2f927bc43c478b8b69384c95b157aa01643176b87`。本批仅新增本文和附件，没有产品修改或第三方产物覆盖。

未覆盖：真实UI导入/三拖/各态stageHeight/全库保护、无切换完整录像、运行下发与最终审签。本专家未运行 build/install/vitest/verify-*，未启服或GUI；不据源码推算声明 fixture 已在运行实例通过。原 r3 8卡局部布局/撤销/保存结果及右缘局部PASS仍按原报告保留，不扩为本6卡种子或整个 B1-GUI-01 PASS，不新增全球视口/主题/组件矩阵。

交 Main：先核/标准导入附件，再按§4/§5执行原有动作并提交原证。若fixture/输入无法达到目标，交本用例前置差异；专家据原证再澄清或判定，开发不据推算改产品。numbers/FC由原owner继续，不因本说明重开其用例。
