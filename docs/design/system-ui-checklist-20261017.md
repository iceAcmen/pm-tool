# #50 系统 UI 验收清单（2026-10-17）

> 配套主规范：`docs/design/system-ui-spec-20261017.md`；事实底座：`system-ui-spec-facts-20261017.md`。
> 用法：新功能/改版 PR 勾选对应域；每条 = 检查项 + 可客观判定的通过标准 + 最低证据等级 + 所属门。
> 证据等级（由高到低）：**observed**（实见动作/状态）> **measured**（computedStyle/探针实测数值）> **DOM**（源码/token 直读）> **截图**（仅线索，单独不成立）。
> 门：**G1** 构建与全量回归（AUTO）｜**G2** Token 静态门（AUTO）｜**G3** 真实 GUI 目视门（浅/深 × 1440/768/390）｜**G4** 非回归门｜**G5** 证据与绑定 SHA。
> 不适用项写 N/A + 理由，不留空勾；勾选时填证据定位（文件:行 / 批次编号 / 视口 / 主题）。

---

## A. Token 与主题（主规范 §2）

- [ ] **A1 单层语义 token 真源** — 同语义角色（主/次/危险/选中/禁用/成功/警告）全产品取同一 `--pm-*` token，新增组件无裸 hex、无绕过语义层直取 `--dsw-*` 别名｜最低证据：DOM｜门：G2
- [ ] **A2 宿主别名优先 → fallback** — 每个 token 解析顺序为宿主别名缺失才落项目 fallback，fallback 未覆盖宿主主题｜最低证据：DOM｜门：G2
- [ ] **A3 浅深成对不机械反色** — 深色跟随 `body[data-ds-dark-theme]`，无本地第二套 dark 开关、无手写机械反色；阴影走宿主暗色覆写｜最低证据：DOM｜门：G2
- [ ] **A4 角色表无新造** — 新增色只从冻结角色表（canvas/surface/surface-2/text/text-2/muted/faint/accent/link/success/warning/danger/line/line-soft/hover/`--pm-button-primary`）取，未自造新角色；`--pm-surface-2` 待 DOM 核真（见规范 §2.4）｜最低证据：DOM｜门：G2
- [ ] **A5 浅深背景实测一致** — 浅 body/pm-shell `rgb(255,255,255)`、深 `rgb(21,21,23)`；rail 浅白/深深逐值相等、非硬编码暗色｜最低证据：measured｜门：G3
- [ ] **A6 选中/悬停浅底走 color-mix** — tint-accent/success/warning 12%、danger 10%，无手写百分比底色、无自创 chip 底色｜最低证据：DOM｜门：G2
- [ ] **A7 图表 S4 不启用** — 未定义/未启用第 4 图表序列；`--pm-ai-*` 三槽位只定义不启用、无紫色品牌色｜最低证据：DOM｜门：G2
- [ ] **A8 禁止项零命中** — 无暖黄/偏黄底、新品牌色、品牌蓝大面积填充 CTA、渐变、玻璃拟态、光晕、彩色投影｜最低证据：DOM｜门：G2
- [ ] **A9 菜单/弹窗浮层实测** — 命名视图菜单浅 `#fff`/深 `#232324`、双层菜单阴影；遮罩浅 `rgba(0,0,0,.24)`/深 `rgba(0,0,0,.5)` 主题感知｜最低证据：measured｜门：G3

## B. 间距 / 圆角 / 密度（主规范 §3）

- [ ] **B1 内边距取自 `--sp-*` 阶** — 组件内边距绑定 4/8/12/16/20/24/32/40/48/64，无页内自创大留白、无「里程碑式大内边距撑场面」｜最低证据：DOM｜门：G2
- [ ] **B2 控件/菜单圆角 sm8** — `.pt-ghost`/`.pm-chip`/`.pt-vmenu` 等控件与菜单 computed `border-radius=8px`｜最低证据：measured｜门：G3
- [ ] **B3 弹窗圆角 md12** — 弹窗 `.pt-vm`/管理视图面板 `border-radius=12px`，未混用 8px｜最低证据：measured｜门：G3
- [ ] **B4 同工具条圆角不分叉** — 同一工具条上 ghost/primary/icon computed 圆角一致（均 8px）｜最低证据：measured｜门：G3
- [ ] **B5 抽屉内边距/gap/宽** — 抽屉体 `24px 28px 28px`、表单纵向 gap 18px、宽 `min(560px,94vw)`｜最低证据：DOM｜门：G2
- [ ] **B6 密度贴合内容** — 行/卡高度贴合内容，单行卡未被 stretch 等高拉伸，无无意义大片留白｜最低证据：observed｜门：G3
- [ ] **B7 边框与阴影不同时上** — 平面视图仅白/深底 + hairline 无边框阴影叠加；仅浮层用 menu/modal 阴影｜最低证据：observed｜门：G3
- [ ] **B8 动效 token 合规** — hover/选中 120ms、展开/面板 180ms，只动 transform/opacity，`prefers-reduced-motion` 降级块存在｜最低证据：DOM｜门：G2

## C. 排版字阶（主规范 §4）

- [ ] **C1 页面标题 16/700** — 视图页题字号/字重符合角色表（设计约束值，computed 抽测登记）｜最低证据：measured｜门：G3
- [ ] **C2 区块标题 13.5/650** — 卡片/抽屉分区 h3 符合角色表｜最低证据：measured｜门：G3
- [ ] **C3 正文 13–14/400** — 段落、表单正文落在 13–14px/400，无离阶放大｜最低证据：measured｜门：G3
- [ ] **C4 标签/元信息 11–12/600** — chip、按钮、分段、辅助说明落在 11–12px/600｜最低证据：measured｜门：G3
- [ ] **C5 数据列 tnum** — 计数、KPI、日期、进度、编号列 `font-variant-numeric: tabular-nums`，列宽不抖动｜最低证据：DOM｜门：G2
- [ ] **C6 系统栈无远程字体** — 沿用宿主 `--pm-font-sans`，未打包新字体、未引远程 Google 字体、未用等宽字体替代正文｜最低证据：DOM｜门：G2
- [ ] **C7 截断给全名路径** — ellipsis 截断处提供可获知全名（title/展开路径），title 未被当作编程可访问名｜最低证据：observed｜门：G3
- [ ] **C8 层级不靠全放大** — 层级竞争先减颜色/字重/位置强调，未把所有标题一起放大｜最低证据：observed｜门：G3
- [ ] **C9 字阶 drift 登记** — 新增/改版处未引入新的离阶字号；存量碎片化字号已逐条登记 drift 或有意例外（待治理项，不冒充达标）｜最低证据：DOM｜门：G2

## D. 颜色语义与对比度（主规范 §5）

- [ ] **D1 正文/链接 ≥4.5:1（白底静态）** — `--pm-text-2` 5.80:1、muted 5.14:1、link #4868b2 5.39:1 静态计算值未被改动｜最低证据：DOM｜门：G2
- [ ] **D2 faint 不落 surface-2** — `--pm-faint` #71767c 仅用于画布/表面元信息，未落 surface-2（4.23:1 禁用组合），该处改用 muted｜最低证据：DOM｜门：G2
- [ ] **D3 #4176e6 未作文字色** — 4.23:1 的 #4176e6 未用于任何文字，仅可作大面/图形｜最低证据：DOM｜门：G2
- [ ] **D4 主按钮 on-primary 18.9:1** — 白字 on 近黑/反白填充对比维持 18.90:1 静态值｜最低证据：DOM｜门：G2
- [ ] **D5 状态=图标+文字+色** — 所有状态 chip 三者并列，无 color-only 红绿区分（前置依赖 5 项均带「已完成/进行中/未开始/受阻」文字）｜最低证据：observed｜门：G3
- [ ] **D6 语义色边界** — 蓝=进行/链接/选中/焦点；绿=完成；琥珀=阻塞/临期；红=逾期/删除/错误；中性灰=待办，未越界混用｜最低证据：observed｜门：G3
- [ ] **D7 深色独立复测（待验证项）** — 深底逐角色对比 computed 抽测 ≥4.5:1（当前无证据，补证前不得勾达标）｜最低证据：measured｜门：G3
- [ ] **D8 状态色文字单独实测（待验证项）** — success/warning/danger 文字用法在各自表面 ≥4.5:1｜最低证据：measured｜门：G3

## E. 表单（主规范 §6）

- [ ] **E1 可见 label 禁 placeholder 替代** — 每个字段有可编程关联的可见 label（for/id 或包裹），placeholder 仅作输入提示｜最低证据：DOM｜门：G3
- [ ] **E2 内联错误贴字段** — 错误文案显示在该字段正下方，`aria-describedby` 绑定控件（绑定关系现状未取证，待验证，见规范 §12-19，补证前不得勾达标）｜最低证据：observed｜门：G3
- [ ] **E3 错误说因+修法** — 错误文案写明原因与怎么修，不写「Invalid input」类无信息文案；错误态=危险色文字+危险色边框/outline｜最低证据：observed｜门：G3
- [ ] **E4 受控校验弃原生气泡** — 无原生 required 气泡与受控错误双轨混用（存量双轨已登记待统一）｜最低证据：DOM｜门：G2
- [ ] **E5 必填标记一致** — 必填项统一危险色 `*`（`.pm-field-required`）｜最低证据：DOM｜门：G2
- [ ] **E6 出错保留输入** — 提交失败不清空已填内容，给重试/编辑路径（如空名提交后输入保留、未创建任务、零污染）｜最低证据：observed｜门：G3
- [ ] **E7 取消零写** — 取消操作不产生任何写（关闭后记录数不变）｜最低证据：observed｜门：G3
- [ ] **E8 提交模式一致** — 空名走「禁用按钮」或「提交后内联报错」二选一，语义明确不混用；禁用态 `disabled=true`/降透明度/`cursor:not-allowed` 浅深镜像｜最低证据：measured｜门：G3
- [ ] **E9 disabled≠read-only** — disabled 有语义属性+降透明度+not-allowed；read-only 可看可复制不可改，两者视觉语义均区分｜最低证据：DOM｜门：G3
- [ ] **E10 异步提交即禁用防重（待验证，见 §12-3）** — 异步提交 pending 时按钮禁用+加载态，二次提交不可能；本地秒开未触发，补证前不得勾达标｜最低证据：observed｜门：G3
- [ ] **E11 保存返回上下文** — 保存成功后返回原视图/筛选/滚动位置，不重置列表（待验证项）｜最低证据：observed｜门：G3

## F. 状态覆盖（主规范 §7）

- [ ] **F1 状态矩阵无遗漏** — 每个可交互控件覆盖适用子集：normal/hover/focus-visible/active/selected/disabled/loading/empty/error/success｜最低证据：observed｜门：G3
- [ ] **F2 hover 不靠独占信息** — 行/项 hover 底 `--pm-hover`，120ms 反馈；hover 未独占信息或动作，键盘 focus 常显｜最低证据：observed｜门：G3
- [ ] **F3 focus-visible 可见且取 token** — 键盘焦点 2px `--pm-accent`+1px offset，无组件内硬编码蓝 hex；鼠标点击不强制显示｜最低证据：measured｜门：G3
- [ ] **F4 selected 可编程** — 选中态有 `aria-pressed`/`aria-selected`，不靠 class alone；tint-accent 浅底+文字/图标区分｜最低证据：DOM｜门：G3
- [ ] **F5 disabled 样式语义** — 降透明度+`cursor:not-allowed`+`disabled` 属性，不承担只读语义｜最低证据：measured｜门：G3
- [ ] **F6 loading 仅异步路径** — 仅 AI generate/整批/逐步/慢保存出现禁用+加载；常规本地视图无骨架屏/shimmer｜最低证据：observed｜门：G3
- [ ] **F7 空态诚实+去重 CTA** — 「尚无 X」诚实说明、不伪装零值；CTA 与页头主 CTA 去重；空过滤结果与真空分开｜最低证据：observed｜门：G3
- [ ] **F8 错误 Notice 不自动消失** — 全局错误 `role=alert`、停留至用户处理、可复制路径；未设置 3–5s 自动消失｜最低证据：observed｜门：G3
- [ ] **F9 成功反馈可编程（待验证，见 §12-3/§12-8）** — 成功 Notice `role=status`、不抢焦点；本地秒开未触发，补证前不得勾达标｜最低证据：observed｜门：G3
- [ ] **F10 stale 不替换旧数据（待验证项，见 §12-21）** — 刷新中保留旧数据并标「更新中/陈旧」+最后更新时间，不用空白替换；面向未来远程/AI 路径，补证前不得勾达标｜最低证据：observed｜门：G3
- [ ] **F11 单行 input 横滚口径** — 标题/执行人/URL 单行 input 超长横向滚动（T-DEF-003 已拍板口径），不要求换行；高度固定 36｜最低证据：measured｜门：G3
- [ ] **F12 textarea 换行增高** — 说明 textarea 自动换行、高度随内容增长、无横向滚动、无叠印｜最低证据：measured｜门：G3

## G. 响应式三档（主规范 §8）

### G.1 1440 档
- [ ] **G1-1 无外壳横向溢出** — doc 宽=1440，无外壳横向溢出｜最低证据：measured｜门：G3
- [ ] **G1-2 浅深成对镜像** — 全视图浅深间距/圆角/边框一致，无视觉漂移｜最低证据：observed｜门：G3
- [ ] **G1-3 主 CTA 唯一** — 每视图唯一中性 primary，无蓝填充 CTA｜最低证据：observed｜门：G3

### G.2 768 档（真 768×1024）
- [ ] **G2-1 工具条换行** — `.pt-toolbar` `flexWrap=wrap`，多行换行成立、浅深一致｜最低证据：measured｜门：G3
- [ ] **G2-2 身份列保留** — 「编号」身份列表头 visible，比较关系未被单列堆叠破坏｜最低证据：measured｜门：G3
- [ ] **G2-3 无叠印无外壳溢出** — 任务行 rowOverlap=false；doc 768=768；表体内部横滚属已裁决例外、非外壳溢出｜最低证据：measured｜门：G3
- [ ] **G2-4 看板抽样无破版** — 搜索/完成率环/里程碑/状态规模/客观进度/成员负载/风险矩阵/周计划无贴边错位｜最低证据：observed｜门：G3

### G.3 390 档（真 390×844）
- [ ] **G3-1 表格→卡片不删字段** — thead 隐藏、卡片堆叠，字段完整、标题完整不截断｜最低证据：observed｜门：G3
- [ ] **G3-2 抽屉单列全宽** — 新建任务抽屉全宽单列纵向堆叠、`overflowX=false`｜最低证据：measured｜门：G3
- [ ] **G3-3 按钮 nowrap** — 底部「取消」「添加任务」`white-space:nowrap` 不折行｜最低证据：measured｜门：G3
- [ ] **G3-4 无外壳溢出** — doc/body 390=390，shell 宽小于视口，无外壳横向溢出｜最低证据：measured｜门：G3
- [ ] **G3-5 rail 设计性隐藏走扁平下拉** — ≤560 rail 整栏隐藏，导航由 ViewSwitcher 扁平下拉承接（9 项+真实计数+选中带勾，不渲染分组标签属设计）｜最低证据：observed｜门：G3
- [ ] **G3-6 甘特轴内部横滑例外** — 甘特时间轴允许内部横滑，身份信息不进横滑区｜最低证据：observed｜门：G3
- [ ] **G3-7 全视图补证（待验证项）** — 里程碑/风险/人员/会议/汇报/交付物/概览 768/390 逐张清验；390 甘特采证｜最低证据：observed｜门：G3

### G.4 回流
- [ ] **G4-1 200% 缩放/320px（待验证项）** — 内容不丢失、无非合法双向滚动；文本放大 200% 不破版｜最低证据：measured｜门：G3

## H. 控件（主规范 §9）

- [ ] **H1 Primary 中性填充** — 浅近黑底白字/深反白近黑，每视图唯一主 CTA，无蓝填充｜最低证据：observed｜门：G3
- [ ] **H2 Ghost 型可辨** — 透明底+`--pm-line` 边+`--pm-text` 字，圆角 8px｜最低证据：observed｜门：G3
- [ ] **H3 Danger 不填充红** — 透明底+危险色字，与主操作视觉/空间分离，无填充红 CTA｜最低证据：observed｜门：G3
- [ ] **H4 Icon 按钮 32px 可访问名** — 32px 方、hover 浅底；有编程可访问名（aria-label/可见文本），title 不计｜最低证据：DOM｜门：G3
- [ ] **H5 下拉三态齐** — 展开/Esc 闭/点外部闭；关闭 measured open=false 无残留浮层；锚定 trigger 下方｜最低证据：observed｜门：G3
- [ ] **H6 弹窗语义与关闭** — `role=dialog`；Esc/点遮罩关闭；遮罩走宿主 mask；圆角 md12/中阴影｜最低证据：DOM｜门：G3
- [ ] **H7 抽屉焦点流转** — 打开焦点落第一字段（title），Esc/遮罩关闭后焦点归还 opener｜最低证据：observed｜门：G3
- [ ] **H8 chip 集合** — 文字标签+实色字，底色按规范 §2.5 取对应 tint 比例（accent/success/warning 12%、danger 10%），不自创比例；换行或 +n 披露，不压成一行裁切；nowrap，截断给可及全名｜最低证据：observed｜门：G3
- [ ] **H9 按钮全局 nowrap** — `.pm-shell button` `white-space:nowrap`，窄窗 @container 540 处例外恢复 normal｜最低证据：DOM｜门：G2
- [ ] **H10 z 层阶** — 使用既有 z-sticky20/z-pop40/z-modal60，无随手大 z 值｜最低证据：DOM｜门：G2

## I. 键盘与无障碍（主规范 §9.7 / §11）

- [ ] **I1 纯键盘关键路径** — Tab/Enter/Esc 完成进 PM→切视图→开抽屉→填写→取消全流程，无鼠标｜最低证据：observed｜门：G3
- [ ] **I2 Tab 序=视觉序** — Tab 顺序无跳号（宿主 rail→PM 搜索→PM 导航项）｜最低证据：observed｜门：G3
- [ ] **I3 浮层 Esc 关闭+归还焦点** — 命名视图菜单/导出菜单/宿主设置对话框 Esc 关闭并归还 trigger｜最低证据：observed｜门：G3
- [ ] **I4 无焦点陷阱（待验证，见 §12-18）** — 浮层内 Tab 不逃逸被困；焦点不被 sticky/浮层遮挡；待 AT 确认，补证前不得勾达标｜最低证据：observed｜门：G3
- [ ] **I5 裸可点件改原生或补角色** — 裸 div/span 可点件改为 button，或补 role=button+tabIndex=0+Enter/Space+可访问名（D-01～D-06 逐项核销）｜最低证据：DOM｜门：G3
- [ ] **I6 自定义 tab 模式完整（待验证，见 §12-18）** — tablist/tab/tabpanel/aria-selected/方向键齐全；待 AT 复验，补证前不得勾达标｜最低证据：DOM｜门：G3
- [ ] **I7 拖拽有键盘/单指针替代** — 看板拖拽、甘特 move/resize 提供非指针替代路径（待验证项）｜最低证据：observed｜门：G3
- [ ] **I8 读屏名称与状态（待验证项）** — AT 实测控件名/角色/状态播报正确｜最低证据：observed｜门：G3

## J. 验收证据与门（主规范 §11）

- [ ] **J1 G1 构建回归过** — build/test(+coverage)/verify-isolation/e2e 全绿，SKIP 项 exit 0 诚实标注｜最低证据：确定性日志｜门：G1
- [ ] **J2 G2 静态门零命中** — token 迁移全覆盖、旧别名同值可解析、零未定义 var、计算 AA、零暖色/新品牌/渐变/光晕/硬编码蓝｜最低证据：DOM｜门：G2
- [ ] **J3 G3 目视非替代** — DOM 断言/计算色值/mockup 标注未代替真实 GUI 目视；关键路径证据为 observed/measured｜最低证据：observed｜门：G3
- [ ] **J4 G4 非回归零回退** — 已 PASS 项（主按钮中性、浅色对比、甘特关键路径、抽屉校验/Notice、看板互斥、空态诚实、AI 草稿不落库、390 回流、项目下拉消歧）无回退｜最低证据：observed｜门：G4
- [ ] **J5 G5 证据绑定 SHA** — 结论绑定被测 commit SHA+工作树指纹；真实/模拟分开；MANUAL_PENDING 仅限需真实凭据/在线模型项｜最低证据：确定性记录｜门：G5
- [ ] **J6 缺陷走生命周期** — 新缺陷按 S1–S4 登记全字段，走 OPEN→FIXED→RE-VERIFIED；WONTFIX 有所有者特批留痕｜最低证据：缺陷台账｜门：G3
- [ ] **J7 有意例外登记** — 偏离规范的分叉登记为有意例外（owner/理由/到期日），无声 drift 视为 FAIL｜最低证据：DOM｜门：G2
- [ ] **J8 截图不单独成立** — 每条勾选附 observed/measured/DOM 定位，仅截图的项判不成立｜最低证据：对应等级｜门：G3

---

## 统计

- A Token 与主题：9 条
- B 间距/圆角/密度：8 条
- C 排版字阶：9 条
- D 颜色与对比度：8 条
- E 表单：11 条
- F 状态覆盖：12 条
- G 响应式三档：15 条（G.1×3 / G.2×4 / G.3×7 / G.4×1）
- H 控件：10 条
- I 键盘与无障碍：8 条
- J 验收证据与门：8 条
- **合计：98 条**。其中显式标「（待验证项）」**8 条**（D7、D8、E11、F10、G3-7、G4-1、I7、I8）；另有 5 条「待验证，见 §12-#」引导条（E2、E10、F9、I4、I6），补证前均不得勾达标。
