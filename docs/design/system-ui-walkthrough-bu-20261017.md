# #51 全系统 UI 走查记录（bu 通道，2026-10-17）

> 执行：独立补采执行者（bu / aha_browser_use，plane=bu，675×745 物理帧）。
> 被测：隔离实例 3172（token 3tVPe0C…），种子 G3 验收项目（5 任务 / 1 里程碑 / 1 风险 / 1 交付物）。
> 口径：本记录只给 **PASS / DEVIATE / 无法取证** 观察结论，**不下门 PASS/FAIL**；证据等级 observed > measured > DOM > 截图。
> 边界：只读实例，未改代码、未 commit；除 P2-6 草稿未确认入库外零写，结束复核「全部任务 5」不变。
> 证据目录：`/private/tmp/g3-shots/`（F101–F135）；清单 `manifest-bu.md` F 段。
> 说明：G2 静态门（token/色值/未定义 var/AA 静态计算）属 AUTO DOM 扫描，bu GUI 侧**无法取证**，不在本记录冒充；标「待验证/待 AT」项沿用规范 §12。

## 0. 环境与基线
- 进入：宿主点「项目管理」；主题经设置对话框「浅色/深色」切换，关闭按钮 X。
- 基线：全部任务 5、里程碑 1、风险 1、交付物 1；走查全程取消/关闭，结束 count=5、无抽屉/弹窗残留。
- 帧限制：bu 物理帧恒 675×745；CDP 768/390 仅在 E 批使用，本批默认 675。
- 已知环境现象：主题在浮层 Esc 后偶发持久切到深色（非操作触发），本记录以探针 `getComputedStyle(body).backgroundColor` 为准标注实际主题，帧色与 computed 不一致处如实注明。

---

## A. Token 与主题（A1–A9）

| 项 | 结论 | 证据 / 实测 |
|---|---|---|
| A1 单层语义 token 真源 | 无法取证（G2 DOM 静态） | bu 不扫源码 token 表；GUI 侧仅见取色结果 |
| A2 宿主别名优先→fallback | 无法取证（G2 DOM） | 同上 |
| A3 浅深成对不机械反色 | PASS(observed) | 浅 body/rail `rgb(255,255,255)`、深 `rgb(21,21,23)`，跟随 `body[data-ds-dark-theme]`，无本地第二开关（F132 浅 / F126 深对照） |
| A4 角色表无新造 | 无法取证（G2 DOM） | — |
| A5 浅深背景实测一致 | PASS(measured) | 浅 body/rail=#fff；深 body=#151517；rail 随主题走 --pm-surface（探针），非硬编码暗色 |
| A6 选中/悬停走 color-mix | PASS(measured,部分) | rail 选中项 bg=`color(srgb 0.255 0.463 0.902 / 0.12)`（accent 12% mix）；筛选 chip 选中为深描边白底，非自创底色 |
| A7 图表 S4 不启用 | 无法取证（G2 DOM） | — |
| A8 禁止项零命中 | 无法取证（G2 DOM） | GUI 目视未见渐变/玻璃/光晕/品牌蓝大面 CTA（observed 线索，不替代静态扫描） |
| A9 菜单/弹窗浮层实测 | PASS(measured) | 命名视图/导出菜单浅 #fff 深 #232324、圆角 8px、双层阴影；遮罩浅 rgba(0,0,0,.24)/深 .5（F104/F107/F133；承 B54–B57） |

## B. 间距/圆角/密度（B1–B8）

| 项 | 结论 | 证据 / 实测 |
|---|---|---|
| B1 内边距取 --sp-* 阶 | 无法取证（G2 DOM） | — |
| B2 控件/菜单圆角 sm8 | DEVIATE(measured) | ghost 按钮实测 **8px**（保存视图/按状态分组/导入/导出，探针 6 元素全 8）；但**筛选 chip 圆角 999px 胶囊**（非 8），与 sm8 分叉 |
| B3 弹窗圆角 md12 | PASS(measured) | 保存视图/新增里程碑/新增风险 dialog `border-radius=12px`（F106/F118/F120/F133） |
| B4 同工具条圆角不分叉 | DEVIATE(measured) | ghost=8px，主 CTA「新建任务」=**12px**，同工具条圆角不一致（primary 用 md12） |
| B5 抽屉内边距/gap/宽 | 无法取证（G2 DOM） | 抽屉单列全宽可见（F114），具体 padding/gap 未测 |
| B6 密度贴合内容 | PASS(observed,部分) | 行/卡贴合，无 stretch 等高；紧凑档可切换（F110，dataset.density=compact），像素差未测 |
| B7 边框阴影不同时上 | PASS(observed) | 平面视图白/深底+hairline，仅浮层用阴影（F132/F126） |
| B8 动效 token 合规 | 无法取证（G2 DOM） | — |

## C. 排版字阶（C1–C9）

| 项 | 结论 | 证据 / 实测 |
|---|---|---|
| C1 页面标题 16/700 | DEVIATE(measured) | 任务页大标题「任务」实测 **20px/700**（非 16/700），记 drift |
| C2 区块标题 13.5/650 | 无法取证(measured 未抽中) | 抽屉分区「01 基础信息」可见，未逐角色取字号 |
| C3 正文 13–14/400 | PASS(measured,部分) | 列表/说明正文落在 14px/400；rail 辅助 10.5px 属 sub 角色 |
| C4 标签/元信息 11–12/600 | PASS(measured) | 筛选 chip 12px/600、rail 计数 11px/600 |
| C5 数据列 tnum | PASS(measured) | 计数/KPI `font-variant-numeric:tabular-nums`（rail-count 探针） |
| C6 系统栈无远程字体 | 无法取证（G2 DOM） | — |
| C7 截断给全名路径 | PASS(observed,部分) | 长名单行横滚（F114），未逐一核 title 披露 |
| C8 层级不靠全放大 | PASS(observed) | 层级靠字重/颜色/位置，未见全标题放大 |
| C9 字阶 drift 登记 | DEVIATE(登记) | 实测 20/14/12/11/10.5 多档并存，C1 的 20px 记 drift，余待逐条核 |

## D. 颜色语义与对比度（D1–D8）

| 项 | 结论 | 证据 / 实测 |
|---|---|---|
| D1 正文/链接 ≥4.5:1 白底 | 无法取证（G2 静态计算） | bu 未重算 AA |
| D2 faint 不落 surface-2 | 无法取证（G2 DOM） | — |
| D3 #4176e6 未作文字色 | 无法取证（G2 DOM） | 焦点环用 accent 蓝，未见蓝作文字 |
| D4 主按钮 on-primary 18.9:1 | 无法取证（G2 静态） | 主按钮近黑底白字目视成立（F132） |
| D5 状态=图标+文字+色 | PASS(observed) | 前置依赖 5 项均带「已完成/进行中/未开始/受阻」文字（F114 抽屉）；里程碑「有风险」文字+琥珀（F117） |
| D6 语义色边界 | PASS(observed) | 蓝=进行/选中/焦点，绿=完成，琥珀=阻塞/临期，红=逾期，灰=待办，未见越界 |
| D7 深色独立复测 | 无法取证(部分 measured) | 深底文本/状态色未完成全量 AA 抽测，待专项 |
| D8 状态色文字单独实测 | 无法取证(待验证) | 沿用规范 §12-1，未补 |

## E. 表单（E1–E11）

| 项 | 结论 | 证据 / 实测 |
|---|---|---|
| E1 可见 label 禁 placeholder 替代 | PASS(observed) | 抽屉 22 控件均有可见 label（任务名称*/任务说明/状态/优先级/执行人/父任务/开始日期/截止日期/完成进度/实际工时/证据链接/人工进度/人工备注/关联里程碑/仓库地址/分支/前置依赖，F114 枚举） |
| E2 内联错误贴字段+describedby | PASS(observed) | 空名提交→「任务名称不能为空」贴字段下方、红框 data-invalid（F113） |
| E3 错误说因+修法 | PASS(observed) | 文案「任务名称不能为空」指明字段；未给额外修法，记部分 |
| E4 受控校验弃原生气泡 | 无法取证（G2 DOM） | 未见原生气泡弹出（observed 线索） |
| E5 必填标记一致 | PASS(observed) | 必填项统一红色 *（任务名称*、目标日期*、标题*） |
| E6 出错保留输入 | PASS(observed) | 空名报错不清空；长文填入后 Esc 保留（F114） |
| E7 取消零写 | PASS(observed) | 抽屉 Esc 后 count 仍 5；里程碑/风险弹窗 Esc 无新增 |
| E8 提交模式一致 | PASS(measured) | 新建任务空名**不禁用**（提交后内联报错，F113）；保存视图空名 **disabled=true/opacity.5/not-allowed**（F106 深 / F133 浅，浅深镜像），两种模式各守其义不混用 |
| E9 disabled≠read-only | PASS(measured) | disabled 有属性+降透明+not-allowed（F106/F133） |
| E10 异步提交即禁用防重 | 无法取证(未触发) | 本地秒开，pending 加载态未触发（§12-3） |
| E11 保存返回上下文 | 无法取证(未触发成功保存) | 未真正保存视图，待验证 |

## F. 状态覆盖（F1–F12）

| 项 | 结论 | 证据 / 实测 |
|---|---|---|
| F1 状态矩阵无遗漏 | PASS(observed,部分) | normal/hover/focus-visible/disabled/error/empty/长文已采；active/loading/success 未触发 |
| F2 hover 不靠独占信息 | PASS(observed) | 按钮 hover 浅底（承 B48）；键盘 focus 常显 |
| F3 focus-visible 取 token | PASS(measured) | Tab 落「甘特排期」`:focus-visible=true`，outline=`rgb(65,118,230) solid 2px`（F135），无组件硬编码蓝 |
| F4 selected 可编程 | DEVIATE(measured,部分) | 筛选 chip 选中 `aria-pressed=null`（未见 aria-pressed/aria-selected），靠 class/描边；rail 选中有 tint 底 |
| F5 disabled 样式语义 | PASS(measured) | disabled=true+opacity.5+not-allowed（F106/F133） |
| F6 loading 仅异步路径 | 无法取证(未触发) | 常规视图无骨架屏（observed） |
| F7 空态诚实+去重 CTA | PASS(observed) | 会议「尚无会议纪要」+新增会议（F122）；汇报「暂无进度汇报…生成第一份」+生成快照（F123）；CTA 与页头「新建项目」不重复 |
| F8 错误 Notice 不自动消失 | 无法取证(未触发全局 alert) | 内联错误停留可见（F113），全局 role=alert 未触发 |
| F9 成功反馈可编程 | 无法取证(未触发) | §12-3 |
| F10 stale 不替换旧数据 | 无法取证(待验证) | 离线本地无 stale 路径 |
| F11 单行 input 横滚口径 | PASS(measured) | 标题 142 字 `overflowX=true`、h=36（F114，T-DEF-003） |
| F12 textarea 换行增高 | PASS(measured) | 说明 `overflowX=false`、h=97 随内容增长、无叠印（F114） |

## G. 响应式（G1–G4，本批 675；768/390 见 E 批 B59–B66）

| 项 | 结论 | 证据 |
|---|---|---|
| G1-1/2/3（1440） | 无法取证(本批 675) | 承 facts F.1；主 CTA 唯一中性 observed（F132） |
| G2-1 工具条换行 | PASS(measured) | 承 B59/B60（768 flexWrap，chip 换行） |
| G2-2 身份列保留 | PASS(measured) | 承 B59/B60（编号列 visible） |
| G2-3 无叠印无外壳溢出 | PASS(measured) | 承 B59/B60（rowOverlap=false） |
| G2-4 看板抽样无破版 | PASS(observed) | F126/F134 看板各卡无贴边错位 |
| G3-1 表格→卡片不删字段 | PASS(observed) | 承 B61/B64 |
| G3-2 抽屉单列全宽 | PASS(measured) | 承 B62/B65（overflowX=false） |
| G3-3 按钮 nowrap | 无法取证(未在 390 复测) | 承 facts F.3 |
| G3-4 无外壳溢出 | PASS(measured) | 承 B61–B66 |
| G3-5 rail 隐藏走扁平下拉 | PASS(observed) | 承 facts F.3 |
| G3-6 甘特轴内部横滑例外 | PASS(observed) | F115/F116 时间轴内部缩放，身份列不进横滑 |
| G3-7 全视图补证 | 部分 PASS | 本批 dark 逐视图浏览（F117–F126）；390 仅任务/抽屉/看板，余视图 390 未采 |
| G4-1 200%/320px | 无法取证(待验证) | §12-10 |

## H. 控件（H1–H10）

| 项 | 结论 | 证据 / 实测 |
|---|---|---|
| H1 Primary 中性填充 | PASS(observed) | 新建任务近黑底白字，无蓝填充 CTA（F132） |
| H2 Ghost 可辨 | PASS(observed/measured) | 透明底+line 边+text 字，8px（F132 工具条） |
| H3 Danger 不填充红 | PASS(observed) | 未见填充红 CTA；删除类未在本批触发 |
| H4 Icon 按钮 32px+可访问名 | 无法取证(待核) | §12-17，未逐条核 aria-label |
| H5 下拉三态齐 | PASS(observed) | 导出菜单展开(F107)→Esc 闭(F108,open=false)→外点闭(F109,open=false)；命名视图 F104/F105 |
| H6 弹窗语义与关闭 | PASS(DOM/observed) | role=dialog、Esc 关闭、遮罩 mask、圆角 12（F106/F118/F120） |
| H7 抽屉焦点流转 | PASS(observed) | 承 B41/B42（开落 title、Esc 归还） |
| H8 chip 集合 | DEVIATE(observed) | 文字+色、nowrap、换行成立；但胶囊 999px 圆角与 sm8 分叉；selected 缺 aria（见 F4） |
| H9 按钮全局 nowrap | 无法取证（G2 DOM） | — |
| H10 z 层阶 | 无法取证（G2 DOM） | — |

## I. 键盘与无障碍（I1–I8）

| 项 | 结论 | 证据 |
|---|---|---|
| I1 纯键盘关键路径 | PASS(observed) | 承 B46/B47；本批 F135 Tab 可达 rail 项 |
| I2 Tab 序=视觉序 | PASS(observed) | 承 B40（宿主 rail→PM 搜索→PM 导航无跳号） |
| I3 浮层 Esc 关闭+归还 | PASS(observed) | 命名视图 F105 归还「未命名视图」；导出 F108 关闭（焦点落保存视图，归还非精确 trigger，记小偏差）；设置承 B45 |
| I4 无焦点陷阱 | 无法取证(待 AT) | §12-4 |
| I5 裸可点件改原生/补角色 | 无法取证(待 DOM/AT) | D-01～D-06 未逐条核销 |
| I6 自定义 tab 完整 | 无法取证(待 AT) | 风险 风险/问题 tab 目视切换，aria 未核 |
| I7 拖拽键盘替代 | 无法取证(待验证) | §12-5，甘特 move/resize 未实际微调（避免改种子日期） |
| I8 读屏名称状态 | 无法取证(待 AT) | 未接屏幕阅读器 |

## J. 验收证据与门（J1–J8）
- J1/J2/J5 属 G1/G2/G5 确定性日志与静态扫描，bu GUI 侧**无法取证**；J3 PASS（关键路径 observed/measured，非截图替代）；J4 已 PASS 项零回退（本批未见回退）；J6/J7 缺陷/例外登记非本执行者职责；J8 每条附 observed/measured 定位（本记录）。

---

## 逐视图功能走查记录（dark 为主，light 抽拍）

### 任务页（F101–F114, F132/F133/F135）
- 搜索：输入「需求」→1 条记录，清空恢复（F101）。
- 筛选 chip：进行中 2 条，选中描边，回全部 5（F102）。
- 排序：按截止日期切换生效（按钮标签变「按截止日期」，F103），回 WBS。
- 命名视图菜单：6 内置+自定义「走查测试视图」+管理视图，内置带「内置」标与口径副行（F104）；Esc 闭归还（F105）。
- 保存视图空名：disabled=true/opacity.5/not-allowed，浅深镜像（F106 深 / F133 浅）。
- 密度：舒适/紧凑可切，dataset.density=compact（F110），像素差未测。
- 导入：唤起隐藏 file input，未选文件零写（F112）。
- 导出：MD/CSV/JSON 三项，展开/Esc/外点三态（F107/F108/F109）。
- 分享只读快照：点击未弹 dialog（F111，行为待核）。
- 新建任务抽屉：22 控件全字段可见 label；空名内联报错（F113）；长标题横滚 h36、长说明换行 h97（F114）；Esc 取消 count=5 零写。

### 甘特（F115/F116）
- 日/周/月缩放切换，时间轴密度随档变化；依赖线 checkbox 勾选、关键路径 4；键盘微调面板说明（←/→ 移 1 天、Shift 调工期、Enter 改期、Esc 取消拖拽）；**未实际微调以免改种子日期**。

### 里程碑（F117/F118）
- 列表：统计（总数1/已达成0/有风险1/已延期0/计划中0）+ Beta交付 m-g3 目标 2026-11-30 距44天+有风险 chip+达成率条（F117）。
- 新增里程碑 dialog：01 基础信息（名称*/说明/状态四态）02 排期（目标日期*/实际达成），Esc 取消零写（F118）。

### 风险与问题（F119/F120）
- 风险1/问题0 tab；概率×影响 3×3 矩阵，ri-0001 落中概率/影响高中危，图例低/中/高危，点圆点定位列表（F119）。
- 登记风险 dialog：记录类型/标题*/说明/状态/影响程度/发生概率/负责人/应对措施/截止日期；矩阵点选打开的是**既有记录编辑**（预填），Esc 未保存（F120）。

### 人员负载（F121）
- 负载明细（负责人/角色/负载构成/open）+ 排期负载时间轴（史冰冰/张三/王五/李四），分段=逾期/临期7d/进行中/待办；未见显式「切换」按钮，负载构成直接呈现。

### 会议纪要（F122）/ 进度汇报（F123）/ 交付物（F124）
- 会议：空态「尚无会议纪要」+新增会议 CTA。
- 汇报：空态「暂无进度汇报…生成第一份周期汇报」+生成快照 CTA。
- 交付物：统计+筛选 chip（全部1/已验收0/已提交0/进行中0/待开始1）+分组（已验收/已提交/进行中/待开始）+搜索+新增交付物。

### 项目概览（F125）/ 总览看板（F126/F134）
- 概览：健康环 90 健康、状态进行中、元信息网格（负责人/日期/任务5/里程碑1/风险1/会议0/汇报0/交付物1）、完成 1/5 20%。
- 看板：项目总数1/完成率20%/未关闭风险1、任务完成率分布、里程碑·交付物、项目状态规模、客观进度清单、成员负载、布局编辑、跨项目搜索；浅深成对（F126 深/F134 浅）。

---

## P2-6 真实条目复测段（专用）

- 入口：更多→AI 助手（F127）。面板含 PoC免费/生产Key、WBS任务拆解/进度汇报叙述/会议纪要归纳三能力、**AI 溯源台账**（刷新/立即重校）。
- 动作：WBS 拆解输入目标「G3 视觉验收走查复测目标」→生成草稿，产出**未确认草稿**（草稿条+确认入库按钮，F129）；**未点确认入库**。
- 立即重校（空台账）：「上次重校：共 0 条·一致 0·待处理 0（仅一致计入有效）」（F130）。
- 结果：**F06 失效/警告条与 F12 历史链未能自然复现**——台账 0 条已确认记录，无对象可校、无指纹可漂移。
- 复现所需条件（如实记录，不造假）：①至少 1 条经「确认入库」的 AI 溯源记录（带来源 typed refs/内容指纹/口径版本）；②其后该来源内容或口径版本发生漂移/失效，再触发重校才会出现 F06 失效/警告条与 F12 不可变重校历史链。当前离线/PoC 环境无已确认记录，属 MANUAL_PENDING（需真实入库条目+后续漂移），不伪造数据路径。
- 零写核验：关闭 AI 面板后 count=5、台账未新增（F131）。

## 未取证/待办汇总
- G2 静态门全部（A1/A2/A4/A7/A8、B1/B8、C6、D1–D4、E4、H9/H10、J1/J2/J5）：bu GUI 不替代静态扫描。
- 待 AT：I4/I5/I6/I8、H4、D7/D8 全量 AA。
- 未触发：E10/F6/F8/F9/F10/E11（异步/慢路径/成功/全局 Notice）。
- 偏差登记：B2 chip 胶囊 999px、B4 primary 12px vs ghost 8、C1 标题 20px、F4 选中缺 aria-pressed、H8 chip 圆角分叉。
