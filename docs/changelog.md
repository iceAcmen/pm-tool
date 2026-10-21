# 版本更新记录 changelog.md

> 本文件按时间倒序记录「每次改动动了哪些文件、新增/修改了什么、为什么」；给维护者与迁移者使用，配合 git 提交历史一起阅读。格式参考 Keep a Changelog，版本号在阶段 3 产出可用功能后启用语义化版本。

日期格式：YYYY-MM-DD。类型：新增 / 变更 / 修复 / 环境 / 文档。

> **多方协作约定**：每条变更必须标注**改动平台标识**（如 `doubao-work`、`trae`，注册表见 `docs/collaboration.md` 第二节），并写清「改了哪些文件 / 做了什么 / 为什么 / 影响范围 / 验证」。完整条目模板见 `docs/collaboration.md` 第 4.1 节。

---

## 候选提交与推送准备（2026-10-21，平台：trae，待专家审签）

- **授权**：所有者明确“提交代码并推送，准备进入专家审签流程”。本次冻结并推送审查候选，不是发布或独立 PASS；取代本批此前“未获 commit/push 授权”的状态，不修改长期测试门。
- **文件/范围**：现有 13 类体验及 launcher 收口代码、测试、同期复盘和交接文档；新增 `reports/batch1-expert-signoff-20261021.md`、候选源码指纹与 97 项退出码清单；专家原稿只原样纳入 Git，不修改正文。`.preview/` 临时产物不纳入。
- **验证**：上一轮插件 1130/1130、build exit0、97/97 verify、launcher 44/44+verify；本轮核原始 97 项退出码、vendor 指纹与差异空白。未改产品行为，未重复调用真实模型。
- **自查与风险**：code-review 两轴发现 App 路径单引号转义、旧 nonce 旅程绑定、ResultCard 新消息复制状态三个待核问题；最终 GUI 磁盘原证不足和 TTL 120 秒/10 分钟差异已明确交专家核定。自动化绿不扩大为 GUI PASS。
- **接续**：专家按推送后候选及审签包核计划/证据、开缺陷或补采；正式 3172/PID44388 未变化，不正式部署、不打 tag。

## 修复/验收 · 第一批现有候选遗留四项修复与最终复验（2026-10-21，平台：trae，待独立专家判定）

- **文件**：在此前编号、路径和控制页修复基础上，补 `launch-handshake.ts/panel.tsx` 成功后清 hash 与失败补试、`editor-ops.ts/editor.tsx` 基于 RGL `oldItem` 记录真实操作前快照、`ui-feedback.ts` 单次前缀、`result-card-copy.ts` 可验证复制结果；同步测试、launcher nonce 10 分钟边界、原始证据和 living docs。
- **原因/影响**：收口 Finder S4、连续拖动撤销缺态、错误前缀重复和复制值未核四项。正式 3172/PID 44388、正式数据、profile 软链和上游源码未动；临时 3199 由 Finder 启动器自拉起。无 commit/push。
- **GUI 原始结果**：Finder 真实双击后 S0→S2→首次配置→PM snapshot→S4，地址栏 `pm-launch` 已清；三次真实拖动后三次撤销严格逆序且末态按钮禁用；非法备份只显示一个“恢复失败：”；注入 `writeText` 捕获值与错误卡原文逐字一致并显示“已复制”。这些是 Main 采证，不代替独立专家结论。
- **验证**：launcher 44/44 + verify PASS；插件 Vitest 124 文件/1130 项、build exit0；最终全部 97 个 verify 97/97 exit0（历史真实模型首轮失败仍保留）；`git diff --check` exit0。原始索引见 `reports/batch1-closure-raw-evidence-20261021.md`。

## 文档 · 复盘后分批工作规划（2026-10-21，平台：trae，建议/未实施产品改动）

- **文件**：新增 `docs/plans/2026-10-21-post-retrospective-roadmap.md`，同步progress/handoff/onboarding链接，保留其他执行者在途内容。
- **内容/原因**：回应负责人“下一步工作与规划”，依据复盘06-actions及最新R4/R5独立报告排序：当前13类/launcher验收收口→同期接续/授权/宿主来源对齐→确认共性工程缺口→完整旅程设计落实→真实使用与新能力选择；微信已部署试点按原授权单列。
- **影响**：只规划与交接；历史问题不全当当前缺陷，子项通过不扩大整项，不自动重开暂停功能或修改上游。未build/verify/GUI、未改产品或正式服务、未commit/push。
- **验证**：本机Python核计划中路径/链接与行尾空白，`git diff --check` 检查上述交接文档退出0；没有新产品验收结论。

## 本机部署 · 微信 Mac 桌面采集试点（2026-10-21，平台：trae，未提交/推送）

- **授权**：所有者明确“我已确认方案，请开始部署 Mac 桌面采集试点”；本批是独立本地工具，不是现有 pm-tool 新功能发布。
- **文件**：新增 `docs/plans/2026-10-21-wechat-desktop-pilot.md`、`reports/wechat-pilot-20261021/部署说明.md` 与双击终端入口；同步 progress/handoff/onboarding。本机运行代码在 `~/.local/share/wechat-project-pilot/app/`、venv 独立，读取库 0.3.1 锁提交 `c6c600ae…0164`；配置与真实数据仅在已忽略 `data/wechat-pilot/`。
- **行为/影响**：群白名单默认空；只读窗口采集、群标题核对、连续窗口对齐/缺口记录、本地规则动态草稿与原文索引。未导入发送/加好友/朋友圈入口、不调用云模型、不自动写正式台账、不配置登录自启。现有产品代码/lib/profile/正式服务/他人在途未动。
- **验证**：Python 3.12.15 与读取库/四模块指纹核对；20/20 开发自验（临时数据、非独立验收）；两入口 `bash -n` exit0；Git 忽略确认。`doctor` exit2：辅助功能 false、屏幕录制 false、微信运行 true、锁屏 false、AX=-25211，无法读取窗口。
- **状态/接续**：本机工具部署已完成，真实采集与定时运行未启用；本人需开启实际运行应用的系统权限并指定完整群名，之后执行端继续采证。没有独立验收 PASS，不改变其他产品候选的门状态。

## 文档 · 从立项至今的开放式深度复盘与跨平台执行合同（2026-10-21，平台：trae，未提交/推送）

- **改动文件**：新增 `docs/retrospectives/2026-10-21-deep/`（总报告、164现象、360主消息+60追加、来源覆盖/指纹、五角色R1/R2与两份R3裁决、73假设交叉校验、整改和文档验证）；更新AGENTS、collaboration §11、KB-039/既有诊断边界、ISS-028～032/ISS-022事务边界、ADL-057、progress/handoff/onboarding入口。旧简版复盘保留，分析口径以新稿为准。
- **原因**：负责人反馈原复盘过简，要求原始事实先行、多角色相互质疑、逐假设反证与负责人侧客观反馈，并保存所有Agent可用的规则。本轮找到豆包真实轨迹与可访问TRAE历史；覆盖不是全部聊天完整证明。
- **影响**：仅研究与规范文档；修订旧确认/历史生成能力口径，细化原句转译、共享资源、dirty候选、合法fixture、证据失效、分层完成与权限。既有代码/launcher/testing在途成果保留，不修改testing、不新签产品PASS、不升格待表决设计矩阵、不切服务。
- **收尾补审**：只读发现本机上游UI提交 `1142fb74f2`，与只读入口的实际依赖描述需对齐；新增08-late-boundary-evidence.md与独立研究稿，P-ADD-01/H-ADD-01单列，不混首轮冻结。明确首页需求与直接修改路径许可分别核，未回退/清理上游。
- **验证**：本机macOS/Python3/Git只读与文档一致性检查；ID/来源/链接/角色原稿/脱敏/差异空白检查及命令退出码见 `docs/retrospectives/2026-10-21-deep/07-validation.md`。本轮未install/build/verify/GUI、未commit/push；当前产品未测项仍按独立报告。

## 修复 · 13 类体验修复候选（P1-1 反馈双轨 / P1-2 OKR 语义对齐 / launcher ready bridge）（2026-10-21，平台：doubao-work，未提交 / 未放行 / 非独立 GUI PASS）

- 改文件（共 9 = 基线 7 + D-10 新增 2，跨 core/client，未提交；HEAD `06a131c`，本地领先 origin/main 17）：
  - P1-1：`packages/dsh-pm-tool/src/core/ui-feedback.ts`（`classifyFeedback` 结构化成功信封直接判 `isError=false`，中文错误关键词正则只兜底非结构化裸返回，消除「已修复错误清单/失败项已清零」等成功串被误判红）+ `core/ui-feedback.test.ts`；`client/panel.tsx` 恢复成功、备份摘要、导出 MD、导出 JSON 四处本地成功改走 `buildSuccessEnvelope`，错误站点不动，备份路径常驻复制位。
  - P1-2：`client/views/growth-form-props.ts`（新增 `relatedOptions` 全量 OKR）、`client/views/okr-form.tsx`（父主归属 KR-only 计入权重单选；软关联块全 kind 恒显、仅展示不计权重）、`client/panel.tsx`（构造并注入 `relatedOptions`，objective 主归属置 null）。不砍 kind、不加 schema、不动权重/进度裁决。
  - bridge：新增 `client/launch-handshake.ts`(+test)，仅 PM 面板挂载且首次 web snapshot 成功后解析 `#pm-launch=<port>.<nonce>`（port 1..65535、nonce 非空、拒畸形串）、replaceState 清参数保业务 hash、POST `http://127.0.0.1:<port>/api/entered` JSON{nonce}、credentials omit（无 cookie/token）、2xx 即止、无参静默、失败不假成功不重试；index apply 注册不算就绪。launcher receiver 由 launcher 执行者另写，本批不碰。
  - D-10：`client/views/reports.tsx`（空态提前 return 前提取 formOverlay，空/非空分支共用 RecordsOverlay/RecordsReportForm）+ `client/views/reports-entry-guard.test.ts`（静态合同）。
- 为什么：成功反馈被中文错误关键词误判红；OKR 软关联被 kind 过滤致目标不可见且与权重归属混淆；启动器「已进入」按钮被误当 mounted+snapshot ready 成功。
- 影响：跨 core/client（core/ui-feedback + client）；不改 schema、真实 data、11 张个人卡、全部配置、3172 进程；上游只读。
- 验证（开发自验 + 独立 R4 子用例 + D-10 manual 子项，均非全量 GUI PASS）：作者主根 vitest 1118/1118 exit0、build0、verify-isolation 95/95/污染0 exit0（作者主根 guard）；独立 R4 bridge 14/14、verify-ui-feedback OK、p2b-okr 26/26、form-validation 通过、build0、records 域 61/61；launcher 候选（执行者另写）42/42、verify0。13 项 GUI（R4/R5 窄视口 675×745 浅主题，权威 §7 见 `docs/testing/independent-acceptance-r4-firstfindings-20261021.md` sha `986d190d…1e726f`；子项 PASS≠整项，宽视口/深主题未测）：D-01 PASS 子项（看板卡点×移除→↶撤销、自动排版压实可撤销）/NOT_RUN 连续拖卡（旧删任务 t-0001 误判已撤回，不新增任务撤销）；D-02 PASS 子项（配置模态仅1 primary、卡片库分组渐进、备份菜单0 primary）/NOT_RUN 宽档互斥；D-03 PASS 子项（概览 header static 不压卡）/NOT_RUN sticky 叠层；D-04 PASS（工具条四组分组+新建 primary）；D-05 PARTIAL（编号格待宽视口）；D-06 PASS 子项（唯一 primary）/NOT_RUN 危险确认级联；D-07 PASS 子项（←→平移1天持久化、Shift→延长工期持久化、里程碑可达、单击选中）/NOT_RUN 点按阈值；D-08 PASS（T1↔M1 双向闭环）；D-09 PARTIAL（短 advisory）/NOT_RUN 分级色/顶层横幅；D-10 PASS 子项（R5 manual 源编辑/预览/探针转义/rpt0001 重开留存，无 AI/key，独立重建 lib/client.js sha `1b3f05d7…02733`）/未测 AI session+宽深；D-11 PASS（草稿 select→「关联交付物」→保存，任务 chip+D1 反查双向；即时写路径未单独复测，旧 select-only 误判已撤回）；D-12 PASS 子项（软关联通俗解释+伪造 ID 内联拒绝）/NOT_RUN 顶层横幅；D-13 PASS 子项（同日幂等）/BLOCKED 长历史折叠（后端仅2天回填窗、不绕校验，非BUG）。运行：新隔离 3199=PID 66544 iso3（旧 33859 已 TERM），正式 3172=PID 44388 未动；Finder 双击 E2E BLOCKED 待 Main 采证。launcher 已交付两 bundle 在 `/Users/bytedance/Documents/dsh-pm-tool/本地启动器候选-20261021/`（`PM工作台.app` 默认 3172、`PM工作台-隔离验收.app` 烤 3199），最终根 `/Users/bytedance/Documents/dsh-pm-tool/PM工作台.app` 未放仅因独立未过；隔离 worktree verify-export 目录名正则、verify-settings 子进程 `--reopen` cwd/空格路径阻塞（非缺树），主根 95/95 已过、独立规范 cwd 待复验。未 commit/push。

## SH-1 D-02 单面板互斥/让位/按钮层级 + D-03 顶条留白（2026-10-20，平台：doubao-work）

- D-02 改文件：`editor.tsx`（卡库抽屉与配置面板单态互斥；≥1024 侧轨让位、<1024 sheet+scrim+Esc；「应用位置与尺寸/应用公式」降为次按钮，删除双主「完成」大按钮；「已添加」改「已在画布·定位」滚动定位+高亮；空搜索「无匹配卡片」；面板标题「·未保存改动」）、`editor-ops.ts`（`filterCatalogItems`/`locateWidgetByType` 纯函数）、`board.css`（scrim/侧轨/定位高亮/空态样式，全走 token 无裸色值）、新增 `panel-library.test.ts`。
- D-03 改文件：`board.css`（`.pm-bento-head` margin-bottom 16px 覆盖 panel.css 12px；≤768 工具条允许换行）、新增 `head-spacing.test.ts`。
- 为什么：原两 fixed 浮层同坐标叠放无 scrim；双等权主 CTA；已添加禁用无定位出口；搜索无空态；顶条与卡群贴压。
- 影响：仅 board 作用域；不改 panel.css/global shared、16 类注册表、旧 11 layout、全部 config、storage schema；canonical 12 列与外层横滚保留。
- 验证：全包 117 文件 1037 单测绿，tsc 0，build 成功；live 401 未目视，记 R 未验。

## SH-1 D-01 移除可逆反馈 + 编辑态压实（2026-10-20，平台：doubao-work）

- 改文件：`src/client/board/editor-ops.ts`（新增 `compactVertical`/`removeWidgetAndCompact` 纯函数）、`src/client/board/editor.tsx`（删除走压实+1.5s 轻反馈条「已移除·撤销」进既有20步栈；dragStop/resizeStop/几何应用后稳定压实；RGL `draggableHandle`+`cancel` 排除按钮/输入，不再靠逐处 stopPropagation）、`board.css`（反馈条样式）、新增 `editor-compact.test.ts`。
- 为什么：原 × 仅 filter 删除、`compactType=null` 留空行；无删除反馈；整卡 mousedown 均可起拖拽，×/控件易被拖拽捕获。
- 影响：仅 board 编辑态；被动宽度/断点变化不压实写 canonical；16 类注册表、旧 layout、config 数据、storage schema 零改动。
- 验证：board 150 单测绿，tsc --noEmit 0；live 401 未目视，记 R 未验。

## 总览宽高编辑与多列排版专项（2026-10-20，平台：doubao-work）

- 仅修改 `src/client/board/` 五个源码文件，新增 `editor-geometry.test.ts`：字符串尺寸草稿+显式应用、canonical 12 列固定编辑画布（最小960px）、配置/卡库浮层、不再被动 onLayoutChange 回写、拖缩结束才保存草稿、显式可撤销自动排版、按实际工作区宽度使用12/8/1列、窄卡内容分行。
- 根因：即时 Number/最小值夹紧打断宽高输入；配置面板把实际编辑画布压窄至66px；被动断点投影/自动压缩回写使布局漂移；浏览态把879px内容预算按4列处理导致左堆。
- 正式3172代表链：数值6/10=462×468px→真实拖缩7/11=541×516px→保存JSON→reload→重启→重入配置均保持；画布960px；真实位置0/0→1/1，尺寸4/7保持；空输入拒绝/撤销/取消SHA零变化。
- 推荐多列已通过UI显式保存，原布局备份在主交付目录。完整11卡id/type/config与备份一致，未删卡或改数据源/公式/筛选/排序；不是“本轮未改布局”。8场景每场11卡实际卡体碰撞/超出slot四边均0。
- 最终门禁：build/tsc退出0，114文件/1025单测通过，isolation94/94，228正式文件hash+mtime该轮零污染，diff --check=0。独立代码审查和原始GUI证据专项审证PASS，无阻断项；不外推全系统PASS。报告在交付目录`独立专项验收.md`。
- 本轮交付目录：`/Users/bytedance/Documents/dsh-pm-tool/看板宽高与排版修复-20261020/`。代表写入链不外推全部16卡型；未测原生200%缩放；其他业务页未整改。代码基线7f44c46，冻结指纹见目录内JSON；提交定位按本条标题。

## 总览卡片覆盖邻卡专项修复（2026-10-20，平台：doubao-work）

- 范围仅看板：`BoardBento.tsx` 明确浏览态格子高度；`board.css` 闭合卡体高度链、超长内容内滚、成员条弹性列；`panel.css` 删除旧窄屏两列 auto/important 覆盖；新增 `board/static-size.test.ts` 3 项红绿回归。
- 根因：正式卡体自然高度超过栅格预留高度（首卡 276→392.48px，规模卡 180→398.41px）；此前仅检查网格坐标不足以证明真实无叠压。
- 验证：113 文件 / 1020 单测通过、TypeScript / build 通过、isolation 94/94，228 个正式文件 hash+mtime 零变化。正式 3172 四档宽度×浅深 8 场景，11 卡实际二维碰撞/四边越界均为 0；取消前后原布局 SHA 相同。
- 独立审查：Standards / Spec PASS，仅“卡体覆盖邻卡”专项收口。真实 resize 保存和刷新前后逐卡坐标未覆盖，不声称全系统或全部看板交互通过；未重置/重排原 x=0 布局。
- 原始证据与运行截图：主交付目录 `总览卡片专项修复-20261020/`，包含 raw-bbox / raw-scroll / raw-editor / raw-cancel-sha / 候选指纹。

## 可达性修复：OKR/习惯导航与页面、两收件区、K13 副驾（2026-10-18，平台：doubao-work，3172 真实 GUI PASS · 675×745，未 commit/push）

> 状态：**主端 3172 真实实例 GUI 全 PASS（窗口 675×745）**；自动化门（build=0、vitest 41 文件 / 458 全绿、verify-p1b-adopt、verify-web、isolation 87/87）为代码层证据。个人看板布局为用户明确触发的可逆写，正式业务数据未改、不入 git；H6 常驻推送仍暂停（未实现）。

- **GUI 实测 PASS（675×745）**：OKR/习惯桌面左导航「目标与习惯」组与窄屏切换器同源可达；两收件区（pmOkrInbox/pmHabitInbox）由 snapshot 透传到页面，confirmed=已采纳不计待确认/不显写按钮，confirm/ignore 成功后刷新；K13 副驾真实问 t-0008 出现投影卡并可打开抽屉；队列离板回总览、全局刷新、浏览器 reload 三持久化路径均 PASS，只见队列卡、无「＋」新增入口；副驾仅 PM 插件内只读，非宿主全局聊天。
- **实际根因**：① 桌面左导航（`core/nav.ts` NavTarget/VIEW_LABELS/buildNavModel + `client/nav-rail.tsx` ICONS）未含 okrs/habits，仅窄屏 ViewSwitcher 有这两项，桌面无入口；② `pmOkrInbox`/`pmHabitInbox` 收件区未由 snapshot 暴露、panel 未把 `inbox` 注入视图，视图只能显示命令提示空态；③ K13 副驾按钮在总览看板（dashOpen）只切状态不挂载层，且未文案区分「PM 插件内副驾」与宿主全局聊天。
- **新入口（同源）**：导航新增「目标与习惯」折叠组（okrs 目标（OKR）/habits 习惯），窄屏由 `buildNarrowSwitcher` 从同一导航模型派生（防漏测试），类型/标签/选中/面包屑 VIEW_LABELS 一致；面包屑经 VIEW_LABELS 解析，`pm-view` 视图持久化已含两键。
- **inbox 接线（snapshot→panel→视图）**：`web snapshot` 透传 `okrInbox`/`habitInbox`（复用后端 readOkrInbox/readHabitInbox，坏行/非数组诚实回落空，不伪造建议）；panel 把后端 `status` 映射为前端 state：pending=未处理、confirmed=已采纳（显「已采纳」标签、不计待确认、不显示写按钮）、ignored=已忽略；confirm/ignore/checkin 走既有 `run` 命令通道，成功后 `onSaved=refresh` 重读快照；snapshot 未携带（undefined）时视图只显示命令提示，不编造。verify-web 已对两收件区做真实种子 + 字段形状契约断言。
- **K13 边界**：副驾为 PM 插件内只读诊断，只读本插件项目台账，**非宿主全局聊天、不扩原生聊天嵌入**；「打开任务」复用既有 openRecord 开抽屉；「刷新」await 父级重读快照，仅真实成功（返回 true）才重挂号并盖「数据截至」，失败保留旧时钟并提示（父 refresh 失败只 setMessage 吞错、会 resolve，故用返回值门控）。
- **改动文件**：`core/nav.ts`、`core/nav.test.ts`、`client/nav-rail.tsx`、`client/panel.tsx`、`client/views/okr-model.ts`/测试、`client/views/okrs.tsx`、`client/panel.css`、`core/ask-projection.ts`/测试、`src/index.ts`、`scripts/verify-web.mjs`；队列侧 `client/board/queue-aggregate.ts`/测试、`queue-card.tsx`、`BoardBento.tsx` 由队列分片修复并一并纳入实测；未碰 3172 进程。

## P2 深度融合：对外+长寿层（K18 单向出站/X7 愿景/OKR 层/X2 收尾标记/X3 失败经验/K16 档案最小保存包/X5 述职素材）（已 push main，2026-10-18，平台：doubao-work）

> P1（8e7b7b0）验收通过后的对外+长寿阶段，对应效果图 S4 分受众分享与 S5 档案与目标连通。规格 `docs/design/deep-integration-v2-p2-dev.md`、验证 `docs/design/deep-integration-v2-p2-verify.md`、证据 `docs/verification/p2-20261018/`。4 分片并行（文件级互斥）+ 契约层；build=0、vitest 37 文件 / **399/399**、guard **84/84/0 失败/0 污染**（176 资产 before=after）、集成链 **56/56**（真实命令+真实 JSON 落盘）、分片自验 a 26/26、b 26/26、c 28/28、d 通过。

- **K18 单向出站（核心）**：`core/export.ts` 三档——markdown（既有档+证据/交付物/复盘引用附录）、web（自包含单文件 HTML：无脚本无外链、`@media (prefers-color-scheme: dark)` 浅深双态、页首「只读快照·非实时数据」+生成时间、空项「暂无数据」占位）、plain（纯文本无 markdown 符号）；**出站日志两类**（settings 键）——`pmExportAudit`（append-only 长期保留：{at,projectId,format,targetPath,itemCount}）+ `pmExportSent`（TTL=30 天，过期在下次导出时自动归档 `pmExportSentArchive` 长期保留，partitionSentEntries 纯函数 nowIso 可注入）；命令 `export markdown|web|plain <项目ID> [目录] [confirm]` + `export audit|sent` 只读；默认拒覆盖 confirm 才覆盖；成功返回含「外部文件为唯一事实源」声明。**只读分发非双向同步**：导出是瞬时快照、外部为唯一事实源、不级联不镜像不回写；不预设 GitHub/不写外部平台；撤持续状态页/实时移动页。
- **X7 愿景/OKR 层**：新表 `okrs`（okrRecordSchema：kind objective|key-result、单父 primaryOkrId 权重归属、relatedOkrIds 软关联可见不计权重、status draft|confirmed、cycleDue 仅 K11 类型预留）+ `core/okr.ts` 纯函数（buildOkrTree 树形/孤儿单列/环保护）+ 命令 8 子命令（add/update/list/tree/suggest/inbox/confirm/ignore/inbox clear）；**收件区保证点**：suggest 只追加 settings `pmOkrInbox`（信封 {entries}）、okrs 表零写入，confirm 才建 draft 记录，ignore 保留标 ignored，clear 只清已处理/已忽略保留 pending；draft→confirmed 仅人 update；**习惯层（每日补记/续接/66 天/streak）明确未做（P3）**。
- **X2 收尾标记（wrapped 口径波及 11+ 处）**：TASK_STATUSES +`wrapped`（契约层谓词 isWrappedStatus 收口）——逾期/催办（derived/reminders/queue）不催办、不计 done/open（stats taskWrapped 单列、people-load/load-stance isOpen 排除）、进度派生不参与、check done 类规则不命中、reflect done 钩子不触发、**copilot AI 直写 wrapped 一律中文拒因**（收尾是人显式决策）、命令层人显式 `task|deliverable update {status:'wrapped'}` + 文案「已收尾≠正式完成」；前端中性灰徽章「已收尾·非正式完成」不进入 done 视觉体系。
- **X3 失败经验**：新表 `lessons`（lessonRecordSchema：taskId 可空、status draft|final、lines 句级 known/pending/blank、gaps）+ `core/lessons.ts` + 命令 add/list/final/edit；**草稿纪律复用 X6**：句级已核/待核/留白、证据不足留白不编造、仅人定稿。
- **K16 档案最小保存包**：`core/archive.ts` 只读打包（package.json：origin=pm-tool、exportedAt/archivedAt、任务/交付物/证据/复盘 known 行/里程碑通用字段 + `README-字段说明.md` 每字段一句话）；命令 `archive <项目ID> [目录] [confirm]`；默认拒覆盖；**非全量镜像**（不含评论/活动流/OKR/积分）；**不写 K18 出站日志**。
- **X5 述职素材**：`core/review-materials.ts` 只读聚合（done/wrapped 任务 done 标记区分、milestone achieved、复盘 known 行，周期 [起] [止] 过滤缺省近 30 天）+ 命令 `review <项目ID> [起] [止]`（Markdown 三段「做了什么/量化结果/关键产出」+ 同数据 JSON；wrapped 计 done=false 不计完成数；无完成条目 avgDoneProgress=null 不伪造）。
- **前端整合**：新视图 `views/okrs.tsx` + `okr-model.ts`（树形/软关联「关联」行/草稿定稿徽章/收件区入口走命令通道 confirm|ignore；snapshot 未携带收件区只显示命令提示不伪造）；`panel.tsx` 接线视图切换器「目标（OKR）」+ Snapshot.okrs 字段；tasks.tsx wrapped 徽章 + 出站关联位（latestExport 有值「已导出·最近 HH:MM·外部为唯一事实源」、无值「未导出」占位，**只显示不回写**）；panel.css 仅追加 `.pm-okr-*`/`.pm-wrapped-*`/`.pm-export-*` 区块（浅深 token、无 emoji）。
- **写操作纪律延续**：所有写走 enqueueDomainWrite；导出/归档默认拒覆盖 confirm 才覆盖；suggest 未确认不生效；未触碰宿主常驻通知能力；未影响运行中服务；不写外部平台。

## P3 深度融合：纵向+宿主层（X7 习惯层/K11 周期接线占位/H6 常驻推送立项调研）（已 push main，2026-10-18，平台：doubao-work）

> P2（07c23e0）验收通过后的纵向+宿主阶段。规格 `docs/design/deep-integration-v2-p3-dev.md`、验证 `docs/design/deep-integration-v2-p3-verify.md`、证据 `docs/verification/p3-20261018/`、H6 调研 `docs/design/deep-integration-v2-h6-research.md`。3 分片并行（后端/前端/调研）+ 契约层；build=0、vitest 38 文件 / **427/427**、guard 全通过/0 污染（176 资产 before=after）、集成链 **29/29**、分片自验 p3a 22/22。

- **X7 习惯层（可开发）**：新表 `habits`（habitRecordSchema：checkIns[{at,backfilled,note?}]、streak{current,lastDate,longest,totalDays}、okrId? 关联 P2 OKR、status draft|confirmed|final、cycleDue 预留）+ `core/habits.ts`（deriveHabitStreak 纯函数 today 注入：**断签缺口>2 天 → current 重置 0，longest/totalDays 累计档案永久保留**；2 天补记窗内回填算连续；buildHabitArchive 纯文本归档「当前连续 N 天 · 历史最长 M 天 · 累计 X 天」；收件区 pmHabitInbox 信封复用 P2 模式）+ 命令 8 子命令 add/checkin/list/suggest/inbox/confirm/ignore/final（checkin 只允许今天+过去 2 天，超窗中文拒，回填标 backfilled:true；suggest 只进收件区零写入；confirm 建 draft；finalize 幂等）；**克制清单延续：无积分/连胜动效/徽章，仅文本归档；空日如实留空不伪造**。
- **K11 周期触发接线（占位）**：新 `core/cycle-hooks.ts`——`CYCLE_HOOKS=['daily-archive','quarterly-review']` + `cycleHookPoint` 恒返回 `enabled:false`（reason「H6 宿主通知能力未实现前不启用」）；**无 setInterval/后台进程/宿主 schedule 调用**，文件头注明调度器待用户拍板后立项。
- **H6 常驻推送立项调研（调研+结论，零代码）**：`docs/design/deep-integration-v2-h6-research.md`（证据分级 E1-E6）——宿主 Web/Chrome 形态**无任何外部通知渠道**（cordis 无定时器 API、notification 帧为助手流式输出、UI 插槽全在窗口内、宿主 schedule 到期只投回原会话、Desktop Electron 未对插件暴露通知通道）；**推荐：维持路线 B（应用内打开面板即派生，ADL-039 现状），不立项路线 A，H6 保持未实现**；路线 A 拍板条件四则（书面接受常驻常开+新 ADL、通道可达、接受改上游维护成本、提供凭据真实验收）；簿记修正：离线基调实际锚在 ADL-009+ADL-039（ADL-011 实为落盘布局）。
- **前端**：新 `client/views/habits.tsx`（习惯列表：status 徽章三档 + streak 纯文本档案 + 打卡记录含「补记」标注 + OKR 关联标题；收件区 confirm/ignore 命令通道、snapshot 未携带时仅命令提示不伪造；打卡今天/回填按钮；空态与空日留白）+ `panel.tsx` 接线「习惯」视图切换器 + Snapshot.habits 字段 + `panel.css` 仅追加 `.pm-habit-*`（浅深 token、无 emoji、零硬编码）。
- **写操作纪律延续**：所有写走 enqueueDomainWrite；补记窗超窗拒写；定稿仅人触发；未触碰宿主常驻通知能力（调研未拍板）；未影响运行中服务。

## P1 深度融合：呈现+交互层（K11 补记队列/K13 对话内投影/K6 完整版/X6-L2 完整复盘草稿流/K19 保护面组件）（已 push main，2026-10-18，平台：doubao-work）

> P0（73037f7）验收通过后的呈现+交互阶段，对应效果图 S1 完整化与 S3 深化。规格 `docs/design/deep-integration-v2-p1-dev.md`、验证 `docs/design/deep-integration-v2-p1-verify.md`、证据 `docs/verification/p1-20261018/`。

- **K11 补记队列（核心，读时派生）**：新 `core/queue.ts` 纯函数（到期未达/严重度>到期排序/积压迟到 LATE_DAYS=3 标识/Top1+折叠 rest/mute 二态与 TTL/关键项豁免 blocked 或 lateDays>0/K9 缺席/时段静默 quietMode 降级/X7 cycleDue·X8 backfill 仅类型预留）+ 命令 `queue open|list|mute|unmute|quiet`（写操作全可逆）+ web snapshot 携带 `queue[projectId]`（读时派生零写）。前端：新 `board/queue-card.tsx` 总览看板卡（Top1 醒目+rest 折叠、迟到徽标、静音条目折叠可见、quiet 降级、mute/unmute 走 runCommand 接缝可逆）+ `.pm-queue-*` 样式。
- **K13 对话内只读投影**：CopilotPanel AI 回答旁投影相关任务卡/最近处理结果/下一步入口；新 `core/ask-projection.ts` 纯函数（引用解析/批次归并）；**防过时硬要求**——投影渲染时从最新 tasks 快照现取状态、标注「数据截至 HH:MM:SS」+刷新入口，ask 旧会话卡片渲染时刷新，不显示过期状态。
- **K6 完整版（呈现）**：tasks 视图交付前核对卡，消费 P0 check 规则分三组呈现（日期排期/未回应要求/缺依据与状态不符），卡片含「提示不代替人验收」「未覆盖≠未完成」。
- **X6-L2 完整复盘草稿流**：milestone achieved / deliverable accepted 触发完整草稿（sourceEvent 扩展、milestoneId/deliverableId 字段、关联任务清单行、gaps 留白不编造）；`reflect final/edit` 人定稿复用；**P0 遗留补齐**——task.deliverableId 存在性/同项目校验（TaskDeliverableNotFoundError/TaskDeliverableProjectMismatchError，中文文案）。
- **K19 保护面组件**：新 `core/load-stance.ts` 纯函数（loadFacts 纯事实陈列/stanceSuggestions「建议砍/缓」含「建议供人决策，不自动执行」/staleStanceTags「烂尾倾向」过滤标签）；people 视图负载卡呈现；无 WIP 硬上限/拒单闸。
- **改动文件**：新建 `src/core/queue.ts`、`src/commands/queue.ts`、`src/core/ask-projection.ts`、`src/core/load-stance.ts`、`src/client/board/queue-card.tsx`、测试 queue/ask-projection/reflect-l2/load-stance 4 文件（+44 例）；改 `src/index.ts`（snapshot queue 段）、`src/core/reflect.ts`/`milestones.ts`/`deliverables.ts`/`tasks.ts`/`task.ts`（commands/task.ts 错误透传）、`src/client/panel.tsx`/`panel.css`（投影 + 接线 runCommand/refreshBoard）、`src/client/board/types.ts`/`widgets.tsx`、`src/client/views/people.tsx`/`tasks.tsx`、`src/core/storage.ts`（契约层 sourceEvent 枚举扩展）；新建 `scripts/verify-p1-integration.mjs`；修正 `scripts/verify-reflect.mjs`（deliverableId 校验语义升级）。
- **验证**：`pnpm build`=0；`pnpm test` **30 文件 / 326 用例全绿**（基线 282→326）；`verify-isolation.mjs` **80 脚本 / 80 通过 / 失败 0 / 污染 0**；`verify-p1-integration.mjs` **45/45**（真实命令+真实 JSON 落盘+幂等+负例）；分片自验 p1a 22/22、p1c 22/22、队列卡 SSR 13/13。
- **能力边界（未夸大）**：K11 打开时呈现≠常驻推送（H6 悬置 P3，卡脚注明）；mute 不隐藏打开视图；X6-L2 草稿≠定稿（人定稿/复盘会）；K19 无裁决无硬上限；K6 只提示；写操作全可逆；未改上游宿主、未动 3172。
- **遗留/下一步**：P2 X7 愿景/OKR 层（周期触发接线点已预留）；H6 P3 立项；K2 窄集复核后扩界；真实宿主渲染与真实 LLM 草稿质量留待用户真实实例复核。已 commit+push main。

---

> 用户已对「PM工作台 × DeepSeek Harness 深度融合」推荐组合主线拍板「按推荐执行」，进入真实开发阶段。P0 = 第 0 层底座 + 第 1 层采集闭环，对应返工效果图 S1/S2；规格与验证记录见 `docs/design/deep-integration-v2-p0-dev.md`、`docs/design/deep-integration-v2-p0-verify.md`；证据 `docs/verification/p0-20261018/`。

- **范围**（8 项能力，文件级互斥三分片并行 + 组织者契约层）：
  - **K1 上下文读取增强**：`ask` 上下文补 description/证据有无/交付物连接三字段透传；`buildAskContext` 任务行如实标注备注/证据/交付物（无则标「无」不编造）。
  - **K2 受限直写窄集**：`core/copilot.ts` task.update 白名单由 5 字段扩为 9——新增 `description`（≤2000）、`evidenceUrl`/`repoUrl`（http(s)/相对路径、≤2048）、`branch`（≤128），类型闸+未知字段拒绝纪律不变；title/priority 等仍拒；COPILOT_SYSTEM 同步口径。不扩状态/排期类（用户拍板第 3 项+H5 扩界本期不开通）。
  - **K4 对话补档**：新命令 `capture`（观察模式：LLM 提待办候选，只展示不落库，无 key 中文降级）/ `capture-apply`（人确认后逐条 addTask 落库 + 证据挂接 + provenance kind=capture）/ E2E 缝 `capture-fixture`。
  - **K3 证据闭环**：`attach-evidence <任务ID> <url>` 单条轻确认直挂 evidenceUrl（仅更新该字段，明示不改状态/排期）。
  - **K9 会话结存**：新表 `sessions`（taskId↔sessionId 绑定 + 结存 note，重复 bind 合并刷新）；`session bind/list/notes`。
  - **K12 自我计量**：`metric <项目ID>` 只读汇总（total/byKind/undoOutcomes/appliedSteps/pendingCount），小样本不下结论。
  - **X6-L1 即时复盘草稿**：task 加 `deliverableId` 连接字段；新表 `reflections`；`updateTask` done 钩子 best-effort 自动建轻量草稿（句级已核/待核/留白，证据不足留白不编造，无积分/徽章）；`reflect 查看/final 人定稿/edit 补材料/reflect-list`。
  - **K6 交付检查**：`check <任务ID|项目ID>` 五类规则（逾期未动/临期未动/完成有未勾清单/完成缺材料/满进度未收尾），复用 reminders 口径，只读、文案含「未覆盖≠未完成，最终验收由人判断」。
- **改动文件**：改 `src/core/copilot.ts`、`src/core/ask-copilot.ts`、`src/commands/ask.ts`、`src/core/tasks.ts`（done 钩子）、`src/core/task.ts`（deliverableId 字段）、`src/core/storage.ts`（sessions/reflections 表）、`src/core/provenance-store.ts`（kind 加 capture）、`src/index.ts`（6 个新命令路由：capture/capture-apply/attach-evidence/session/reflect(-list)/check/metric）、`scripts/verify-ui-feedback.mjs`（修正 f2109a5 后陈旧的 taskStatus 字面量断言，改从 status.js 校验键序，非业务回归）；新建 `src/core/capture.ts`/`evidence.ts`/`session-bind.ts`/`reflect.ts`/`check.ts`/`metric.ts` + 对应 `commands/*.ts` + 测试文件（capture/evidence/session-bind/reflect/check/metric/copilot-task-fields/ask-context）+ `scripts/verify-reflect.mjs`、`scripts/verify-p0-integration.mjs`。
- **验证**：`pnpm build`=0；`pnpm test` **26 文件 / 282 用例全绿**；`verify-isolation.mjs` **77 脚本 / 77 通过 / 失败 0 / 污染 0**（176 资产 before=after）；`verify-p0-integration.mjs` **28/28**（真实命令 + 真实 JSON 落盘 + 溯源 confirmed，临时根，未碰 3172/正式 data）；`verify-reflect.mjs` PASS（真实 FS done 钩子）。
- **能力边界（未夸大）**：K2 仅备注/证据链接类受限直写+草稿确认+ask-undo 可撤销；K6 只提示不下完成裁决；X6 草稿≠定稿、业务完成≠复盘定稿、证据不足留白；K9 单向结存非双向同步；capture 观察模式不自动建任务；H6 常驻推送 P3 立项本期不实现；未改前端视图（P1：K11/K13）、未改上游宿主。
- **遗留/下一步**：P1 补 K11/K13 前端呈现层（数据基础已就绪）+ deliverableId 存在性校验；K2 窄集跑通后用户复核再扩界；真实 LLM 草稿质量留待用户真实实例复核。已 commit+push main（提交信息标 `[doubao-work]`）。

---

## P2-2 Token 2.0 视觉基准（候选进行中 · 未提交 · 未放行，2026-10-17，平台：doubao-work）

> 状态：**进行中候选，非发布、未 commit/push/部署**。本条目只记录当前候选状态，待独立测试 PASS + 协调人放行后再补正式登记。
> 开发自测（未提交候选）：`pnpm build`=0；vitest **164/164**（14 文件）；`pnpm test:coverage` 退出 0；`node scripts/verify-isolation.mjs` **73/73 通过 / 失败 0 / 污染 0**（before=after=169）；`pnpm e2e` PASS（console errors=0）；`git diff --check` 干净。**G3 真实浏览器目视门 BLOCKED（当前执行通道无法采集视觉证据），未发布；P2-6 AI 溯源治理零实现、顺序门未到。**

- **范围**：冻结视觉规范（`docs/design/p2-2-visual-token-baseline-20261017.md`，唯一视觉真源）+ 迁移映射（`docs/design/p2-2-token-migration-map.md`）；新增纯契约模块 `src/core/design-tokens.ts`（AA 计算、语义角色、闭合映射、保留别名、图表/AI 槽位）与 `design-tokens.test.ts`（10 例）；对已实现的 P2-1 左导航、P2-5 命名视图/复合过滤/导出/只读快照做视觉校准。不另造功能、不改业务逻辑、零 schema、不改交互行为。
- **本批脚本修正（不改生产业务行为、不删断言、不用 NOT_RUN 掩盖可测项）**：独立测试 G2 静态/受影响 G4 通过、G1 七项阻塞；开发仅按当前契约修正 7 个 `scripts/verify-*.mjs` 陈旧断言并补边界/反例——
  - `verify-gantt.mjs`：移除已删除的 legacy `progressRatio` 导入/断言，改测当前 `progressFill`；补反例（旁字段 legacyProgress/coverage/pendingAcceptance 不伪造填充、0 填充≠null 无填充、value=100→1）。
  - `verify-task-inline.mjs`：移除已删除的 `nextStatus` 状态轮转断言，新增 `parseProgressInput` 当前契约（null/undefined/''/空白/NaN/Infinity→undefined；合法→0..100 四舍五入；150→100、-5→0）。
  - `verify-gantt-drag.mjs`：旧 `next` 模式 grep 改为 `commitDates(id,payload)` 块内 quiet `task update` + payload 白名单仅 startDate/dueDate；saving 翻转改挂 commitDates。
  - `verify-gui-contract.mjs`：改断言 GanttView 定义 `commitDates` 且内部 quiet 落库。
  - `verify-ai-client.mjs`：6b 重写——记录 `prepareCall` 的 `reasoningEffort`(high/off)，断言 stream 不重复传（prepared 已给齐、callConfigEquals 一致性）、携带 system/messages。
  - `verify-model-route.mjs`：删除「prod 无 Key 抛 PROD_KEY_MISSING」两处 throw（当前凭据由 dsh 请求时从凭据服务解析，prod 不再抛错），按确定性路由/候选链/失败回退重写。
  - `verify-web.mjs`：全局 hex 禁用改有限语义白名单（先剥离注释，仅放行 mask-image 的 `#000` 遮罩与 `.pm-rail-logo` 白字 `#fff`；状态色硬编码仍失败）。
- **待独立测试审证的开放点（不在飞改代码）**：panel.css 中保留图表槽位 `--pm-chart-s4: #7c5cf0` 已被移除；冻结规范/迁移映射/`design-tokens.ts` 仍称「S4 仅定义不启用」，与当前 CSS 存在表述差异，待独立测试审证后统一（恢复定义槽位并放宽白名单，或删除 S4 预留并同步改规范/契约），不得为测试绿偷删设计契约。
- **影响范围 / 如何手动跑**：`pnpm run build`、`pnpm run test`、`pnpm run test:coverage`、`node scripts/verify-isolation.mjs`、`pnpm e2e`（隔离 DSH_HOME/临时存储备份/非生产端口 3171，DSH_PM_E2E=1 不出网，正式 3080/3091 不触碰）。

---

## #24 测试框架 + CI：vitest 离线单测 + v8 覆盖率门 + 确定性 E2E + GitHub Actions（2026-10-17，平台：doubao-work）

> 状态：**已完成并核验**。`pnpm build`=0；`verify-isolation.mjs` **73 脚本 / 73 通过 / 失败 0 / 污染 0**（before=after=165）；vitest **4 文件 / 29 用例全过**，v8 子集覆盖率门绿。只加 devDependencies，不改 package.json version（仍 0.7.4）、不打 tag；`verify-real-model.mjs` 真实出网 smoke 不进任何必经 job。

- **改了哪些文件**
  - 新增 `packages/dsh-pm-tool/vitest.config.ts`：environment=node，`include: src/**/*.test.ts`；v8 coverage `include` 收窄到本批针对的 4 个纯模块（settings/copilot/progress-derivation/gantt），阈值取子集真实实跑（lines 45.02 / branches 86.25 / functions 42.37）略降留余量：lines 40 / branches 80 / functions 35 / statements 40。
  - 新增 4 个离线确定性单测（与源码同级、`*.test.ts`，被 tsconfig exclude 不进 lib，不会被 verify-isolation 的 `scripts/verify-*.mjs` 发现规则误抓）：
    - `src/core/gantt.criticalPath.test.ts`（8）：线性链 A→B→C 全 slack0 关键 + 关键边、确定性逐字段一致、成环 X↔Y 不崩溃/inCycle/不高亮/不打断、缺日期 missingDate 不补不顺延、悬空计数、多连通分量各自关键、空输入。
    - `src/core/settings.test.ts`（6）：13 项默认值锁原硬编码现值、非对象全默认、合法覆盖、非法回落记 invalid、绿灯<黄灯倒挂回落、sameSettings。
    - `src/core/progress-meta.test.ts`（5）：objective/manual 双轨、manual 不污染 objective、无信号 none 不伪造、清除回落、仅人工。
    - `src/core/copilot-validate.test.ts`（10）：task.update 合法/不存在/空 patch/非法 status/未知字段/progress 越界/start>due；milestone create 必填+achieved 交叉/update 存在；risk/issue 交叉约束（risk 必 probability 禁 solution、issue probability=null 禁 responsePlan）；deliverable/meeting 必填与时长区间；未知 op 拒。
  - `packages/dsh-pm-tool/tsconfig.json`：`exclude: ["src/**/*.test.ts","src/**/*.test.tsx"]`（测试不进 tsc 产物 lib，避免单测文件被打进交付 bundle）。
  - `packages/dsh-pm-tool/package.json`：devDependencies 新增 `vitest@2.1.9`、`@vitest/coverage-v8@2.1.9`、`puppeteer-core@23.11.1`（仅 dev，不进运行时依赖）；scripts 新增 `test`=`vitest run`、`test:coverage`=`vitest run --coverage`、`e2e`=`node scripts/e2e.mjs`。
  - 新增 `packages/dsh-pm-tool/scripts/e2e.mjs`：自建隔离 DSH_HOME / 临时存储 / 临时备份 / 非生产端口，`DSH_PM_E2E=1` 确定性缝（不调模型、不出网），puppeteer-core 驱动真实 Chrome headless 断言项目名/种子任务渲染/0 console error；缺 harness 目录/Chrome/已注册 profile 时打印 SKIP 并以 0 退出（非阻断，便于无宿主的 CI 不硬失败）；ISS-027 单 PID TERM 停服、临时目录清理，正式 3080/3091 不触碰。
  - 新增 `.github/workflows/ci.yml`：push/PR 触发；`core` job（Node 22 + pnpm 11.28.5，`pnpm install --frozen-lockfile` → `pnpm run build` → `node scripts/verify-isolation.mjs` → `pnpm run test:coverage`）；`e2e` 独立 job（装 headless chromium，缺本地 harness 时 SKIP exit 0）；真实出网 smoke 不在必经 job。
  - `packages/dsh-pm-tool/pnpm-workspace.yaml`：新增 pnpm 11.28.5 原生 `allowBuilds: { esbuild: true }`（旧名 onlyBuiltDependencies 兼容），批准 esbuild（vite@5.4.21→vitest@2.1.9 依赖链）的 postinstall 构建脚本，**确保 CI 全新环境 `pnpm install --frozen-lockfile` 退出 0、不再报 ERR_PNPM_IGNORED_BUILDS**（本机 node_modules 已存在时不暴露，CI 干净环境必挂，故以包内 workspace 配置固化、可复现，不用只写本机的 `pnpm approve-builds`）。
  - `.gitignore`：补 `coverage/`（v8 报告产物不入库）。
- **做了什么 / 为什么**：在不推翻、不破坏现有 verify-isolation（继续承担存储/隔离/集成门）的前提下引入正式单测层——vitest 只覆盖 core 纯函数、离线零网络；v8 覆盖率门槛针对本批模块按真实实跑值设定，不造假大面积 exclude、不设必挂高门槛；把已有确定性 E2E 固化为可重复 `pnpm e2e`；GitHub Actions 把 build/隔离门/单测覆盖率串成必经，E2E 独立 job。
- **影响范围 / 如何手动跑**：`pnpm run test`（单测）、`pnpm run test:coverage`（覆盖率门）、`pnpm run e2e`（真实宿主可跑，否则 SKIP exit 0）、`node scripts/verify-isolation.mjs`（既有确定性门，73/73 不变）。未改任何业务 src 逻辑、未改存储 schema、未动模型路由层。
- **验证**：`pnpm build`=0；`verify-isolation.mjs` 73/73、污染 0；vitest 29/29、子集 All files lines 45.02 / branches 86.25 / functions 42.37 / statements 45.02 过门槛；`pnpm e2e` 本机可重复 PASS（项目/任务渲染、0 console error，端口 3171 用完即 DOWN，正式 3080=PID 66364 未变、3091 未监听）。**洁净安装证据**：临时目录仅放 package.json/pnpm-lock.yaml/pnpm-workspace.yaml 跑 `pnpm install --frozen-lockfile` 退出 0、无 ERR_PNPM_IGNORED_BUILDS、`pnpm ignored-builds`=None；主工作树 `pnpm install --frozen-lockfile` 亦退出 0、esbuild postinstall Done。本机无 `gh` 登录，未在 GitHub 端观测到 Actions 实跑（CI 流程已配置、本地等价命令全绿）。



> 状态：**已完成并核验**。`pnpm build`=0；`verify-isolation.mjs` **73 脚本 / 73 通过 / 失败 0 / 污染 0**（before=after=165）。加法式 schema（仅新增可选字段），客观派生纯函数逻辑零改动；零新增外部依赖。

- **改了哪些文件**
  - `packages/dsh-pm-tool/src/core/task.ts`：`taskFields`/`taskCreateSchema`/`taskUpdateSchema` 加法式新增可选 `effortHours`（number ≥0，实际投入工时、非估算）、`evidenceUrl`（trim 字符串 ≤2048，客观佐证链接）、`manualProgress`（int 0..100，可传 `null` 清除）、`manualProgressNote`（string ≤500，人工设定来源/口径备注）；`describeTaskValidation` 补中文标签。
  - `packages/dsh-pm-tool/src/core/progress-derivation.ts`：新增纯函数 `resolveTaskProgressMeta(task, derived)` 与类型 `TaskProgressMeta/TaskProgressMetaInput`，返回 `objective`（清单派生值）/`manual`（人工值）/`display`（`manual ?? objective`）/`mode`（`manual`/`objective`/`none`）/`manualNote`；纯函数、无 I/O、不读墙钟、不修改入参，客观派生（`deriveProgressMap`）零改动。
  - `packages/dsh-pm-tool/src/core/tasks.ts`：`updateTask` 在 `manualProgress===null`（显式清除人工）时一并 `delete manualProgressNote`，避免旧口径备注残留。
  - `packages/dsh-pm-tool/src/client/panel.tsx`：本地 `Task` 类型补可选新字段（含既有 `completedDate`）；`TaskForm` 增加 effort/evidence/manual/manualNote 受控状态与 payload（manual 空串→`null` 清除，否则 clamp 0..100）；新增只读客观块（清单完成度 fraction + 客观值/「证据不足」+ 完成日期只读行）与可编辑项，人工设定附橙色「人工设定 n%」徽标 + 清除按钮；引入 `resolveTaskProgressMeta`。
  - `packages/dsh-pm-tool/src/client/panel.css`：追加 `.pm-meta-block/.pm-meta-objective/.pm-meta-label/.pm-meta-value/.pm-meta-row/.pm-manual-row/.pm-manual-badge/.pm-manual-clear`，颜色全部消费 `--pm-*`（底层 `--dsw-*` token），零硬编码 hex，跟随 `body[data-ds-dark-theme]`。
  - 新增 `packages/dsh-pm-tool/scripts/verify-task-meta.mjs`（离线确定性表驱动）。
- **做了什么 / 为什么**：补 v0.7.4 deferred 的客观进度四件事——doneAt（完成日期，沿用既有 `completedDate`：done 自动记当天、显式值采纳、revert 清除，本项只在 UI 展示）、effort 实际工时、evidence 证据链接、人工 override（显式「人工设定」标记，与清单客观派生并存、互不污染，清除后回落客观）。无信号（无清单/无证据）显「证据不足」，绝不伪造精确百分比。
- **影响范围 / 如何手动跑**：`node scripts/verify-task-meta.mjs`；全量 `node scripts/verify-isolation.mjs`。新字段可选缺省，旧记录无这些键照常 parse、无需迁移；不改既有字段语义。
- **验证**：`pnpm build`=0；`verify-isolation.mjs` 共 73 脚本、通过 73、失败 0、污染 0；隔离真实 Chrome headless（独立 DSH_HOME/存储/备份/端口 **3162**，正式 3080=PID 66364 全程未变、3091 未监听，ISS-027 单 PID TERM）：浅/深两趟，人工态（证据不足+工时 3.5+证据链接+人工 30% 徽标）与客观态（清单 2/4=50%、无徽标）逐项断言全 OK、0 console error。证据 `docs/verification/progress-meta-20261017/`。



> 状态：**已完成并核验**。`pnpm build`=0；`verify-isolation.mjs` **72 脚本 / 72 通过 / 失败 0 / 污染 0**（before=after=165）。零存储 schema 改动、零新增外部依赖；模型路由层（c78e6a4 三档路由）只读不改、不绕过、不回退。

- **改了哪些文件**
  - `packages/dsh-pm-tool/src/core/copilot.ts`：`ALLOWED_OPS` 从仅 `task.update` 扩到 `milestone.create/milestone.update`、`risk.create/risk.update`、`deliverable.create/deliverable.update`、`meeting.create/meeting.update`；新增四类实体字段白名单与枚举/交叉约束校验（milestone status；risk type/status/probability/impact 及 risk 必须 probability、禁 solution，issue 必须 probability=null、禁 responsePlan；deliverable status；meeting status/meetingDate/startTime/durationMinutes/participants/topics/decisions）；`validateActions` snapshot 从 `{taskIds}` 扩为可选 `milestoneIds/riskIds/deliverableIds/meetingIds`，`task.update` 分支逐字节保持原样。
  - `packages/dsh-pm-tool/src/commands/ask.ts`：`applyCore` 按 op 分发——create 注入 projectId 后调 `addMilestone/addRiskIssue/addDeliverable/addMeeting`；update 查记录、核 projectId、比基线 `updatedAt`（不一致抛 `DispatchSkip` 跳过、不覆盖）后调 `updateMilestone/updateRiskIssue/updateDeliverable/updateMeeting`；`task.update` 仍走 `updateTask`；新增内部 `DispatchSkip` 区分「跳过/拒绝」与真正写库失败；幂等键（projectId+actorSegment+JSON(actions)+JSON(baseline) 的 SHA-256）命中即拦截重复 apply。
  - `packages/dsh-pm-tool/src/core/ask-copilot.ts`：`COPILOT_SYSTEM` 从「唯一允许 task.update、禁止新建/改其他实体」改为允许四类实体 create/update 并写明各字段口径。
  - `packages/dsh-pm-tool/src/client/panel.tsx`：`CopilotPanel` 接收 milestones/riskIssues/deliverables/meetings，`validatePlan`/行内校验传入实体 id 集合；`task.update` 保留原行内编辑（status/progress/assignee/起止日期），其余 op 渲染只读实体摘要卡（新建=新值；更新=旧值删除线→新值），顶部徽标区分「新建X/更新X · id」。
  - `packages/dsh-pm-tool/src/client/panel.css`：新增 `.pm-copilot-entity-badge/.pm-copilot-entity-summary/.pm-copilot-entity-row` 等样式，颜色全部复用 `--pm-*`（底层 `--dsw-*` token），零硬编码 hex，跟随 `body[data-ds-dark-theme]`。
  - 新增 `packages/dsh-pm-tool/scripts/verify-copilot-writes.mjs`（离线确定性表驱动 + 真实 repo 经 `handleAskApplyCommand`）。
- **做了什么 / 为什么**：副驾写操作从仅「任务更新」扩到里程碑、风险、交付物、会议四类，每类支持创建+更新；每个写动作仍渲染为 HITL 确认草稿卡（按实体分组、展示新建/改了哪些字段、旧值→新值），用户确认才落库、取消=零写；复用既有 ask-apply 后端守卫，不开无校验写路径；零 schema（不改 types 存储结构、不新增字段、不迁移）。
- **影响范围 / 如何手动跑**：`node scripts/verify-copilot-writes.mjs`；全量 `node scripts/verify-isolation.mjs`。E2E 演示缝仅在 `DSH_PM_E2E=1` 且 ask 参数含 `entities` 时返回固定实体计划，不调模型，生产/所有者实例不注册。
- **验证**：`pnpm build`=0；`verify-isolation.mjs` 共 72 脚本、通过 72、失败 0、污染 0；隔离真实 Chrome headless（独立 DSH_HOME/存储/备份/端口 **3161**，正式 3080=PID 66364 全程未变、3091 未监听，ISS-027 单 PID TERM）：浅/深两趟均 8 步草稿（4 新建/4 更新）、整批应用 8 步、取消零写、served bundle 含实体卡、0 console error。证据 `docs/verification/copilot-writes-20261017/`。



- **改了哪些文件**：`packages/dsh-pm-tool/scripts/verify-isolation.mjs`（默认自动发现清单剔除 `verify-real-model.mjs`，仅影响默认扫描，显式 argv 仍可纳入）、`docs/changelog.md`（本条）。
- **做了什么 / 为什么**：c78e6a4（三档模型路由）新增的 `scripts/verify-real-model.mjs` 是**非 mock 的真实出网 smoke**（真实调用外部免费网关、依赖模型当次输出）。实测同机连跑 3 次为 通过/失败/通过，失败点不固定（偶发过度思考、不吐约定 JSON 计划或 WBS 勾选清单），属外部免费模型非确定性。它被自动纳入「离线、确定性」的 `verify-isolation` 后，会让隔离门无规律变红，违背隔离门零出网/可复现的定位。故将其移出默认扫描；离线确定性逻辑仍由 `verify-model-route.mjs`、`verify-ai-client.mjs` 覆盖（两者均通过）。
- **影响范围 / 如何手动跑**：`verify-real-model.mjs` 不删除、断言不改，发布前可手动 `node scripts/verify-real-model.mjs`，或经显式参数 `node scripts/verify-isolation.mjs scripts/verify-real-model.mjs` 纳入；后续 #24 若要把它纳入 CI，应单独成「真实网络/允许重试」的非阻塞 job，不进确定性门。
- **#25 集成**：分支 `p0/narrow-390`（#25）已 rebase 到 `c78e6a4` 之上（无冲突）并快进并入 main，合并提交 `cf09581`；主树标准路径 `pnpm build`=0，`verify-isolation` 确定性门 **71/71 全绿、资产污染 0**（before=after=165）。
- **验证**：主树重跑 `verify-isolation.mjs` 共 71 脚本、通过 71、失败 0、污染 0；`verify-real-model.mjs` 连跑 3 次 P/F/P 证实非确定性；显式 argv 仍能单独运行该 smoke。

## #25 真 390px 窄窗响应式正式修复（GI-WEB-14 / PROD-07 遗留，原 MANUAL_PENDING）（2026-10-17，平台：doubao-work）

> 状态：**隔离 worktree 内完成，真实 Chrome 390px 浅/深实测 20/20 无外壳溢出，已核验**。`pnpm build`=0；`verify-isolation.mjs` **71 脚本 / 70 通过 / 1 失败**（唯一失败 `verify-export.mjs` 为硬编码路径须以 `/pm-tool/exports/` 结尾、worktree 在 `.tmp/p0-narrow390` 下不匹配的已知环境假象，非回归），资产污染 **0**。本项**只做 CSS/视图响应式，零新增依赖、零 schema、零业务逻辑改动**；分支 `p0/narrow-390`（开发阶段在隔离 worktree、不 merge 不 push；**已在 2026-10-17 rebase 到 `c78e6a4` 之上并入 main，见上一条**），不改 package.json version、不打 tag。

- **范围**：面板骨架（顶栏/抽屉/弹窗/表单/按钮组）+ 全部 9 视图（全部任务、里程碑、风险与问题、会议纪要、交付物、进度汇报、甘特排期、项目概览、人员负载）在 390px 视口无重叠/无裁切/无横向外壳溢出；≥1024 桌面布局不变（窄屏规则全部隔离在 `@media (max-width:560px)` 内，不命中桌面）。
- **改了哪些文件**
  - `src/client/panel.css`：末尾新增 #25 窄屏块——顶栏内距收敛+允许换行、项目菜单钳到 92vw、抽屉宽度 `min(560px,100vw)` 且 header/body 内距收敛、抽屉表单/设置栅格单列、move-picker 不锁 320px、副驾编辑行 6 列→2 列、风险矩阵 3→2 列、健康环图例允许换行、旧版人员姓名列不锁 130px。
  - `src/client/views/tasks.css`：搜索框通栏、筛选/工具条换行、主按钮通栏居中、卡片侧距收敛；任务表在 `.pt-scroll` 内部横滚；顺手把 `.pt-primary` 硬编码 `#fff` 改为 `var(--dsw-alias-label-primary-foreground)`。
  - `src/client/views/people.css`：隐藏固定列表头，负载明细行由固定 6 列网格（240px/1fr/64px/110px/110px/20px）改为可换行 flex 卡片（负责人/色条/计数/到期/状态徽章/箭头自然换行），卡片头纵向、说明行可换行。
  - `src/client/views/meetings.css`：行动项 4 固定列（1fr/130px/110px/92px）改单列堆叠、隐藏表头行。
  - `src/client/views/milestones.css`：概览统计条允许换行、达成率单元格不锁 180px、空态内距收敛。
  - `src/client/views/risk-issues.css`：卡片内距收敛、矩阵首列 56→44px、列表第二行允许换行、处置措施整行。
  - `src/client/views/deliverables.css`：双栏卡片改单列。
  - `src/client/views/gantt.css`：工具栏换行收敛、左标签列 220→150px，时间轴在 `.pm-gantt-scroll` 内部横滚；`.pm-chip-primary` 硬编码 `rgb(255,255,255)` 改 token。
  - `src/client/views/overview.css` / `reports.css`：补 ≤560 断点（概览边距/栅格内距收敛；汇报快照 7→3 列、元信息换行）。
  - `scripts/verify-gui-contract.mjs`：新增 #25 静态契约——骨架+9 视图均须含 `@media (max-width:560px)` 断点、骨架与全部视图 CSS 零硬编码 hex、天然宽内容（`.pm-table-scroll`/`.pt-scroll`/`.pm-gantt-scroll`）必须内部横滚。
- **为什么 / 口径**：天然宽内容（任务表、甘特时间轴）允许在各自**容器内部**横向滚动，外壳/页面不整体溢出；导航与主要操作在 390 下可达。配色一律走 `--dsw-*` / `--pm-*` 别名 token，零硬编码 hex，跟随 `body[data-ds-dark-theme]`，浅深两态清晰。
- **验证**：隔离真实 Chrome headless（视口 390×844，dpr=2，独立 DSH_HOME + 独立存储/备份 + 端口 **3155**，profile `node_modules/dsh-pm-tool` 软链指向 worktree 包；正式 3080=PID 66364 全程未变、3091 未监听；ISS-027 单 PID TERM）。监听真实响应体证明下发聚合包 `dsh-pm-tool/client.js` 含 `#25 真 390px` 标记与 `max-width:560px` 断点（重建后 rev 指纹变化）；浅/深 × 9 视图 + 新建任务抽屉共 20 项扫描无外壳水平溢出。证据 `docs/verification/narrow390-20261016/`。
- **边界**：本项不做 #22 副驾写扩展、#23 客观进度、#24 vitest/E2E/CI；未改任何 tsx DOM 契约/锚点 class；未新增外部依赖。

## #21 口径配置化：项目级设置（健康分权重/封顶/灯号线、临期窗口、过载阈值）（2026-10-16，平台：doubao-work）

> 状态：**默认等价锁定 + 覆盖/非法/重启读回 + 隔离真实 Chrome 浅/深实测，已核验**。`pnpm build`=0；全量 guard **71/71、失败 0、资产污染 0**（before/after=162/162）；只新增设置、不改业务实体字段语义、不引入 vitest、不新增外部依赖（纯 TS）。

- **口径清单（原值 → 设置键，现值即默认值，逐项可追溯到原硬编码）**
  - 健康分（`core/derived.ts scoreFromInputs`）：每逾期任务扣分 `healthOverduePer=3`、每受阻任务 `healthBlockedPer=4`、每高影响风险 `healthHighRiskPer=6`、每严重风险 `healthCriticalRiskPer=10`、每逾期里程碑 `healthOverdueMilestonePer=8`；封顶 `healthCapOverdueTasks=15`/`healthCapBlockedTasks=12`/`healthCapOpenRisk=20`/`healthCapOverdueMilestones=16`；灯号线 `healthGreenAt=80`/`healthYellowAt=60`。
  - 临期窗口 `reminderWithinDays=7`（`reminders.computeReminders`/`people-load.groupOpenTasksByAssignee`/`war-room.computeKPI·buildAgenda`/概览里程碑临近共用）。
  - 人员负载过载阈值 `loadOverloadThreshold=5`（原 client `people.tsx` 硬编码 `OVERLOAD_THRESHOLD=5`，移入设置）。
  - 说明：`core/stats.ts` 的逾期判定为严格 `dueDate < today`（今天/明天不逾期），**本就无数字阈值**，故不杜撰宽限/阈值键；逾期计数口径不变。
- **core 纯函数可注入 settings、缺省回落默认（默认等价）**
  - 新增 `core/settings.ts`：`DEFAULT_PROJECT_SETTINGS`（与硬编码逐值相等）、`SETTING_FIELDS`（分组/区间/步长/单位元数据，UI 与命令共用同一份，避免两处口径漂移）、`normalizeProjectSettings(raw)`（整数+区间校验、未知键忽略、灯号倒挂 green<yellow 两者回落默认并给中文原因，纯函数不抛）、`sameSettings`。
  - `scoreFromInputs(inputs, settings?)`、`healthFromStats/collectStats→computeProjectHealth(...,settings?)`、`computeReminders(domain,{...,settings?})`、`groupOpenTasksByAssignee(tasks,projects,{...,settings?})`、`computeKPI/buildAgenda(...,settings?)` 均接受可选 settings；**不传时与配置化前逐值一致**；命令行显式参数（如 `/pm due 14`）优先于设置。确定性：today 可注入、无随机、无墙钟、零写。
- **持久化 + 命令 + snapshot 透传**
  - 新增 `commands/settings.ts`：`/pm settings`（查看生效口径/是否自定义）、`/pm settings put <json>`（局部合并到既有原始记录、整份校验、非法整份拒绝不落盘）、`/pm settings reset`（清除自定义全回落默认）；经既有 `settings` 表透明存取、原子写沿用领域表，人类可读 JSON 落盘、重启读回。`index.ts` `web snapshot` 增 `settings: readProjectSettings(domain)` 透传归一化生效口径；`/pm health`、`/pm due` 读持久化口径传入纯函数。
- **设置 UI（项目设置抽屉）**
  - 顶部「更多」菜单新增「口径设置」入口；`SettingsPanel` 按分组渲染 13 个数值字段，内联区间/整数校验、交叉约束（绿灯线≥黄灯线）提示，「保存口径」写库、「恢复默认」走 `settings reset`；空态/非法输入诚实显示。配色全走 `--pm-*`（由 `--dsw-*` 重映射）别名 token，**零硬编码 hex**，跟随 `body[data-ds-dark-theme]`，浅/深两态清晰。
- **验证**
  - 新增 `scripts/verify-settings.mjs`：默认等价（缺省=显式默认、健康分 69/yellow 基线锁定）、覆盖生效（零扣分 100/green、灯号线、临期窗口、作战室窗口）、非法值校验（越界/非整数/灯号倒挂回落默认+中文原因、未知键忽略、非对象不抛）、命令持久化局部合并保留/非法整份拒绝/reset 回落默认/snapshot 透传/全新进程 `--reopen` 读回、UI 契约、core 零写静态 grep。`verify-health.mjs` 补自定义口径覆盖断言（63/yellow → 78/green）；`verify-gui-contract.mjs` 补 #21 静态钩子（snapshot 透传、SettingsPanel、菜单、视图 props、默认值锁定、零写、设置 CSS 无 hex）。
  - 隔离真实 Chrome headless（独立 DSH_HOME + 独立存储/备份 + 端口 **3141**，正式 3080=PID 66364 全程未变、3091/3141 无残留，ISS-027 单 PID TERM）：浅趟默认抽屉截图 → 改 `healthGreenAt=60` 保存 → 概览灯号黄→绿（派生随口径变化）；深趟原生 dark 抽屉截图。证据 `docs/verification/settings-20261016/`。
- **边界**：本项只做「可读口径可调+持久化+设置 UI」；不做副驾写操作扩展（#22）、客观进度（#23）、vitest/E2E/CI（#24）、390 窄窗（#25）；不配置生产 Key。

## GI-CP 关键路径只读高亮（CPM，零 schema/零写派生）（2026-10-16，平台：doubao-work）

> 状态：**确定性纯函数 + 真实 dsh 宿主 Chrome 隔离实例均通过，已核验**。`pnpm build`=0；全量 guard **70/70、失败 0、资产污染 0**（before/after=162/162）；不新增 zod schema、不改 storage.ts、不回写派生字段、不引入 vitest。

- **core 纯函数（`src/core/gantt.ts` 新增 `criticalPath`）**
  - 基于 `predecessorIds` 依赖图（唯一真源）做 AON 正向/反向遍历，算 ES/EF/LS/LF 与总时差 slack（天偏移，工期取既有 startDate/dueDate 含端点、FS 零间隔、不建模 lag）；**slack=0 即关键路径**。确定性纯函数：无随机、无墙钟、无 I/O、不调用 run/execute。
  - 诚实降级：成环（3 色迭代 DFS，不死循环/不栈溢出）环上节点标 `inCycle`、跳过正/反遍历、不高亮、**不自动打断/改期**；缺 startDate/dueDate 标 `missingDate`、不参与、**不补日期/不顺延**；自指/悬空边计数剔除；多连通分量（并查集）各自取组件最大 EF 做反向，短分量不被全局终点挤出假正时差；多结束任务汇点 LF=组件最大 EF、内部取 min 传播；空输入不抛。
- **甘特只读高亮（`src/client/views/gantt.tsx` + `gantt.css`）**
  - 关键任务条加 `pm-gantt-bar--critical`（2px 强调色描边环 + 淡衬底，box-shadow ring 不被 overdue/blocked border-color 覆盖）；关键依赖边 `pm-gantt-link-path--critical` 加粗强调色描边 + 独立强调色箭头；工具条图例「关键路径 N」；成环徽标「循环不可计算」、缺日期徽标「缺日期段已跳过」（均带 tooltip 说明原因）；条 tooltip 追加「关键路径（总时差 0 天）」；左标签「关键」小徽标。
  - 配色全走 dsw 别名 token（`--c-prog`/`--c-late`/`--c-block`，底层映射 `--dsw-*`），**零硬编码 hex**；跟随 `body[data-ds-dark-theme]`，浅/深两态均清晰。高亮纯视觉，不触发任何 run/execute 写命令。
- **验证**
  - 新增 `scripts/verify-critical-path.mjs`：线性链 A→B→C 全排期 ES/EF/LS/LF/slack 与关键边、并行时差分支非关键、成环不崩/不高亮、缺日期降级、多分量、自指/悬空、空输入、同输入两次逐字节一致、core/gantt.ts 零写静态 grep（无 run(/execute(/fs 写）；`verify-gui-contract.mjs` 补关键路径静态钩子。
  - 真实 Chrome headless 隔离实例（独立 DSH_HOME + 独立 storage/备份 + 端口 **3131**，正式 3080=PID 66364 全程未变、3091/3131 无残留）：GI-CP-01 链三条高亮/关键边 2/3/图例/tooltip；GI-CP-02 成环不高亮+「循环不可计算」；GI-CP-03 缺日期无条+「未排期」+徽标；GI-CP-04 深色趟零写哈希逐字节一致、静态零写；GI-CP-05 拖链尾 t-0003（10-10~10-14→10-13~10-17）前置 t-0001/t-0002 全记录逐字节不变、progress/predecessorIds 不动、不自动顺延。浅/深/拖后截图见 `docs/verification/gui-critical-path-20261016/`。
- **边界**：仅只读显示；关键路径**自动排期/压缩/改期**属产品「甘特B 长期观望」，本批不做；vitest/E2E/CI 留 #24；不配置生产 Key。

## 看板 P1：拖拽像素落列 / 筛选二次级联 / 迁移链补全 / 窄卡省略（2026-10-16，平台：doubao-work）

> 状态：**确定性验收 + 真实 dsh 宿主验证均通过，已核验**。`pnpm build`=0；全量 guard 68/68、0 污染；各块外部 require 仅 react/react-dom/jsx-runtime。

- **P1-① 卡片库拖入按像素落列（非追加末尾）**
  - 编辑器（`src/client/board/editor.tsx`）`GridLayout` 启用 `isDroppable` + `onDrop(layout, layoutItem, e)`：从 `e.dataTransfer.getData('widget-type')` 取新卡类型，按 RGL 由松手像素换算的 `layoutItem.x/y` 落位（addWidgetAt），约束在栅格内；点「＋」按钮仍追加末尾作为兜底；拖入即选中。
  - 真实浏览器原生拖拽（dragstart→dragover→drop）验证：把「任务状态环」拖到栅格中部松手，新卡落在中部而非末尾；RGL 碰撞正常。onDrop 增加防御：RGL 异常给 undefined layoutItem 时按事件 clientX/Y 相对栅格换算坐标，避免 crash。
  - **修复阻断性布局缺陷**：卡片库面板原是 in-flow flex 兄弟，打开时把 RGL 栅格挤压到约 7px、colWidth 算错、卡片全部推出视口右侧。`panel.css` 改为 `.pm-bento-body { flex-wrap:wrap }` 且工具条 `.pm-bento-tools` 独占一行（flex-basis:100%），卡片库为左侧窄抽屉、栅格在右侧保持真实宽度；宽度恢复后 RGL 重新正确布局，关抽屉后栅格回满宽。
- **P1-② 切换实体后筛选字段二次级联**
  - 配置面板切换数据源实体时，`onPatch({ entity, filters: [], sort:{field:'date',dir:'asc'} })`：字段下拉选项换为新实体字段，已选筛选字段/操作符/值整体清空（旧实体筛选不残留）；「字段→操作符」按数值/文本/日期/枚举联动；保存 zod 闸门不把旧实体筛选存进去。
- **P1-③ 版本迁移链补全（v2+，保留 v1 迁移）**
  - `persist.ts` 将单步迁移升级为按版本有序迁移链：`MIGRATIONS` 为 `{from,to,apply}[]`，`stepMigrations` 从旧 version 逐级 1→2→…→LAYOUT_VERSION，强制每步 `to===from+1`、缺级/跳步抛错；保留 v1 迁移（v1 老配置照样升到最新）。当前 LAYOUT_VERSION 仍为 1（无真实 v2 结构变更），后续插入 v2 只需追加一条。
  - 新增 `scripts/verify-migration.mjs`：v1 老配置解析保留、跳级/过低版本拒绝、合成链 v1→v2→v3 逐级经过且字段规整保留、链不连续/跳步抛错。
- **P1-④ 窄卡项目名省略的优雅处理**
  - 卡片项目名统一 `flex` + `min-width:0` + `.pm-board-project-text` 单行 ellipsis，并 `title={项目全名}` hover 显示；窄卡（1~2 列）项目名不溢出、不撑破布局（截图见「浏览器功能验…」「手动验收…」）。
- **验证**
  - `pnpm build`=0；`node scripts/verify-isolation.mjs` 68/68 通过、0 污染（before/after=160/160）；新增 verify-migration；块结构仍为 client.js（gzip≈202KB）+ client.editor.js（≈76KB）+ client.formula-expr.js（≈11.6KB），编辑器块自包含。
  - 深色+浅色截图：p1-drop-dark（像素落点）、p1-grid-restored（栅格塌缩修复）、p1-config-dark（窄卡省略）、p1-edit-light / p1-cards-light，见 `docs/verification/p1-*.png`。

## 看板 P0：编辑态异步拆分 + 布局持久化迁移 dsh-storage（含提前落地的 P2 后端地基 completedDate）（2026-10-16，平台：doubao-work）

> 状态：**确定性验收 + 真实 dsh 宿主验证均通过，已核验**。`pnpm build`=0；全量 guard 67/67、0 污染；各块外部 require 仅 react 系。浏览态首屏 gzip 由 288.77KB 降到约 **202KB（净回收约 86.6KB / -30%，超出“约41KB”预期）**；看板布局不再用 localStorage，改经 dsh-storage（settings 表）跨设备持久化。

- **P0-① 编辑态异步拆分（浏览态不加载 RGL/zod/expr/编辑器）**
  - 新增编辑态异步块 `src/client/board/editor.tsx`（产物 `lib/client.editor.js`，gzip 约 75.75KB）：仅在点「布局编辑」时经 `require.async` 加载；内含 react-grid-layout + WidthProvider、卡片库抽屉、配置面板、zod 保存闸门、导入/导出/恢复默认。
  - 新增公式异步块 `src/client/board/formula-expr.ts`（产物 `lib/client.formula-expr.js`，gzip 约 11.58KB）：仅当布局含公式卡时惰性加载 expr-eval 真实实现。
  - `formula.ts` 改为主包惰性加载器（不静态 import expr-eval）；`widgets.tsx` 移除顶层 zod/expr 引用、descriptor 不再在浏览态挂 configSchema，卡片渲染组件与 schema 定义解耦（新增 WIDGET_CATALOG 供编辑器块使用）。
  - 浏览态 `BoardBento.tsx` 用纯 CSS 静态栅格（与 RGL 同列/行高/间距）渲染卡片，不再挂 RGL；进入/退出编辑有加载态，卡片口径与拆分前一致。
  - `tsdown.config.ts` 复刻宿主分块机制：chunkFileNames=client.[name].js、非入口块 banner 带 `chunk` 字段、动态 import 改写为 `require.async`；并新增插件清理 CJS 块内对入口的死引用、把 `__toESM` 等运行时 helper 内联进每个自包含块（实测宿主要求异步块完全自包含、块间无同步兄弟 require）。
- **P0-② 持久化 localStorage→dsh-storage（跨设备不丢）**
  - 新增后端命令 `src/commands/dashboard.ts`：`dashboard put <user|project> <JSON>`（轻校验：version 整数、widgets 数组）、`dashboard reset <user|project>`；落 pmtool 领域 settings 表。
  - `web snapshot` 新增 `dashboards:{user,project}` 字段（透明存取，读不到为 null）；前端 `persist.ts` 移除 localStorage/zod，改为结构校验 + 迁移（parseLayout），初始布局从 snapshot.dashboards 读取（user>project>默认），保存/重置走 `execute('dashboard put/reset…')`；`panel.tsx` 经 GlobalBoard 透传 execute 为持久化回调，处理保存中/失败、失败不落盘。
  - 内部落盘键因后端 per-record 路径安全约束（`^[a-zA-Z0-9_-]+$`，不接受冒号）用下划线 `dashboard_user`/`dashboard_project`，对外命令与 snapshot 契约不变。
- **提前落地的 P2 后端地基（P2 前端 UI 后续再做）**
  - `core/task.ts` 新增可选 `completedDate`（taskRecordSchema；taskUpdateSchema 可显式设置/纠正/清除）；`core/tasks.ts` 状态流转自动维护：非 done→done 记当天（或显式日期）、done→其它清除、已 done 改字段不覆盖；`core/completion-history.ts` 新增纯函数 `buildCompletionHistory`，只统计真实 completedDate、零数据显式空态（不造假）；新增 `task backfill-completed`（旧 done 任务据 dueDate 显式推断并标注、无据不编造）。
- **验证**
  - `pnpm build`=0；`node scripts/verify-isolation.mjs`：67/67 脚本通过、0 污染（before/after=160/160）；新增 `scripts/verify-dashboard.mjs`、`scripts/verify-completed-date.mjs`；扩展 `verify-client-bundle.mjs`（加载 editor/formula 块并断言外部 require 仅 react/react-dom/jsx-runtime）；`verify-formula.mjs` 改指 formula-expr。
  - 真实 dsh 宿主（dev 实例重启后 PID 70706/3080）：点「布局编辑」`client.editor.js` 返回 200（无 404）；加卡→保存（dashboard put）→整页刷新后仍在；恢复默认→刷新后回默认。深+浅、浏览态+编辑态截图见 `docs/verification/p0-bento-perf-20261016/`。
- **影响范围 / 边界**：不改跨项目看板视觉；不重设计其它页面（后续）；新增字段为可选、不破坏旧记录与既有能力；本提交即此条。

## [v0.7.4] 最终可发布：稳定性地基 S4 + war-room「进行中」KPI 热修（零 schema）（2026-10-14，平台：doubao-work）

> 状态：**S4 稳定性批次 19/19 PASS（独立测试专家实测）+ war-room KPI 热修真实 Chrome 隔离实例 PASS，本补丁可发布**。暂不 commit/tag/push，待用户最终通知执行最终提交并打 tag（注解 tag 指向最终 release commit）。历史 tag `v0.1.0`–`v0.7.3` 不移动。

- **改动文件（版本事实/文档口径，不改产品 src、测试专家 docs、证据、vendor、scripts、服务）**：
  - `packages/dsh-pm-tool/package.json`：`version` `0.7.3` → **`0.7.4`**。
  - `docs/releases/v0.7.4.md`：**新建（最终可发布）**，列 S4 三项地基（fs-atomic 契约/tmpNameFactory 测试缝、LLM optional 真实 Context、runner 聚合+timeout 分类+资产 manifest）+ war-room doing→in_progress KPI 热修，验收按独立测试专家 19/19 + 真实 Chrome 采证口径回填。
  - `README.md`：版本导航表 v0.7.3 改标已发布（tag `v0.7.3`→`eb41b30`）、新增 v0.7.4 可发布行；阶段导航对齐 S4 19/19 + war-room 热修 PASS。
- **补丁范围（v0.7.3 `eb41b30` 之后，零 schema）**：A1——`fs-atomic.ts` 的 `atomicWriteFile` 钉死「rename 之前任一阶段失败只清 tmp、绝不碰目标」，rename 为唯一切换点，`open(tmp,'wx',0o600)` EEXIST 排他闭环；新增可选 `tmpNameFactory` 仅测试注入（生产默认 `randomUUID` 行为不变，测试缝非产品变更）。A2——`index.ts` 不再把 `llm` 列入 inject、懒读真实 Context `ctx.reflect.get('llm',false)`，缺 provider 时 `generateDraft` 抛中文 `NO_LLM` 降级、核心台账离线可用业务零写，有 fake llm 走 generateDraft+兜底路由。A3——`verify-isolation.mjs` runner 改为跑完全部 62 个专项脚本并**聚合全部失败（不 break）**、超时（`ETIMEDOUT`/`killed`）单独分类不误落 spawn 异常、正式资产 before/after sha256+mtime manifest 零污染，`walk/buildManifest/diff/WATCH/runOne` 导出供 fixture 测试复用。war-room 热修——`computeKPI` 误判 `status==='doing'`（真枚举 `in_progress`）致「进行中」KPI 恒为 0；`status.ts` 新增纯谓词 `isDoneStatus/isInProgressStatus`、`war-room.ts` 的 inProgress 改用谓词（done/overdue 抽闭包语义不变）、`verify-war-room.mjs` 补五态回归守卫。
- **范围纪律**：**零 schema**（domain 仍 v1、表集合未变，`taskStatusSchema=z.enum([todo,in_progress,blocked,done])` 拒收 `doing`；不新增表列、不升 domain、不改落盘布局）；不自动排程/改期/顺延，doctor 仍只读不自愈。v0.8「客观进度」（checklist/progress-derivation/汇报 calcVersion）矩阵已冻结但**未实现（NOT_RUN/deferred）**，本批只携带其前置 war-room 热修。
- **验收（S4 独立测试专家实测 2026-10-14）**：总门 **✅ PASS——19/19**；`pnpm build`=0；全量 guard **62/62** 专项 verify 脚本全绿；受守护正式资产 **before=160/after=160、污染 0**、退出码 0；三专项 `verify-fs-atomic`/`verify-llm-optional`/`test-verify-runner-aggregate` 退出 0。矩阵 `docs/testing/stability-s4-acceptance.md`，证据 `docs/verification/stability-s4-20261014/full-guard.txt`。
- **验收（war-room KPI 热修，真实 Chrome 隔离实例）**：真实 Chrome v139 headless（puppeteer-core，无 Key）独立 `DSH_HOME`+独立 storage root+独立备份目录+空闲端口 **3122**；面板表单构造 p-0001+5 任务，作战室 KPI 实测 总数5/完成率40%/**进行中=1（仅真枚举 in_progress；blocked 不计，修复前渲染 0）**/逾期1/状态分布2·1·1·1/议程仅一条逾期/磁盘 5 条全真枚举/console·pageerror=0；`verify-war-room.mjs` 与 `verify-web.mjs` 退出 0。证据 `docs/verification/gui-war-room-status-20261014/`。
- **计数差异（不同轮次如实分开，非矛盾）**：S4 全量 guard = **160**、war-room 真实 Chrome 轮次 = **159**——两轮计数差异为**跨轮 session / 缓存文件自然轮转**所致；每轮内部均严格 before=after、污染 0（added/removed/changed 全 0），属各自独立零污染结论，**非正式资产漂移**。
- **ISS-027 精确 PID 流程（继续遵守）**：隔离监听 PID 8436（首轮 patch root 误指上一轮 scratch）→修正重启 PID **9859**，均 `--port 3122`、`--no-open`；仅对 8436/9859 分别 `kill -TERM` 一次验 EXITED、3122=DOWN；正式 3080=PID 93536 / 3091=PID 93537 启动前后均 LISTEN、PID 未变。
- **零污染**：S4 guard **160** 资产、war-room 正式 **159** 资产均 before=after、changed/added/removed=0（两轮独立结论，见上）。
- **client 完整哈希（已实测锁定）**：`shasum -a 256 packages/dsh-pm-tool/lib/client.js` = `9d0b118c6f469856c5c7caee52175a88b0a2082fc4333daf2b2a45bc2302aa8b`（**332510 B / 332.51 kB**，最终 build 已稳定、实测锁定）。
- **人工项 / 降级项（均不阻塞）**：v0.8 客观进度 NOT_RUN/deferred（含 override/effort/evidence/doneAt/跨端合并）；GI-WEB-14 真 390 窄窗仍 MANUAL_PENDING；GI-CP-01~05 关键路径仍 deferred；M-01 prod 真实 Key 仍 MANUAL_PENDING（PoC 免费车道免 Key）。旁证：任务行内联下拉残留 `<option value="doing">` 经表单提交会被 zod 拒收、不污染数据（非本热修范围）。
- **影响范围 / 状态**：纯版本事实与文档口径；注解 tag 将在最终提交时创建。
- **验证**：`node -e "JSON.parse(require('./packages/dsh-pm-tool/package.json'))"` 通过；`git diff --check` 干净；未改产品 src / testing 矩阵 / 证据、未 commit。

## [v0.7.3] 最终可发布：甘特拖拽手感与成功提示热修（零 schema）（2026-10-14，平台：doubao-work）

> 状态：**v0.7.2 拖拽热修代码审查 APPROVE；真实 Chrome 隔离实例 22 项全绿；回归新增 7 项（GI-WRITE-06/07+GI-WEB-16~20）独立测试专家最终签 7/7 PASS，本补丁可发布**。暂不 commit/tag/push，待用户最终通知执行最终提交并打 tag（注解 tag 指向最终 release commit）。历史 tag `v0.1.0`–`v0.7.2` 不移动。

- **改动文件（版本事实/文档口径，不改产品 src、测试专家 docs、证据、vendor、scripts、服务）**：
  - `packages/dsh-pm-tool/package.json`：`version` `0.7.2` → **`0.7.3`**。
  - `docs/releases/v0.7.3.md`：**新建（最终可发布）**，列甘特拖拽手感/成功提示热修，验收按真实 Chrome 采证口径回填。
  - `README.md`：版本导航表 v0.7.2 改标已发布（`5d1c8591`→`310c768`）、新增 v0.7.3 可发布行；阶段导航对齐热修 APPROVE。
- **补丁范围（v0.7.2 `310c768` 之后）**：用户实测反馈拖拽成功后弹出**全字段深色大卡 Notice**（13 行 dump 盖住甘特工作台）。热修——①根因修复 `.pm-gantt` 无 `flex-wrap` 时 hint(`flex-basis:100%`) 与 labels/scroll 挤同一 flex 行竞争，致 `scroll` 被 shrink 到宽 0（画布消失）；改 `flex-wrap:wrap`，hint 独占下一行，首行恒 labels(230px)+scroll(flex:1,min-width:0)。②拖拽走 `run(...,{quiet:true})`、单 refresh：松手即落盘+就地重渲染、日期即时更新无需 F5，移除 `onSaved()` 二次刷新。③quiet 成功不弹全字段大 Notice，改条下 inline `role=status`/`aria-live=polite`「已更新：起 ~ 止」约 3s 自清除。④`saving` inflight 锁：保存中禁连拖、`finally` 解锁，防并发覆盖/ghost。⑤失败回落：条体从未本地改动、未 refresh 自然回落拖前坐标无残影，内联「更新失败，请重试」6s；quiet 不吞错（run catch 仍 `setMessage`，全局错误红框 Notice 保留）。⑥unmount `clearTimeout` 清状态定时器；payload 白名单仍仅 `startDate`/`dueDate`。
- **范围纪律**：**零 schema**（只读既有 startDate/dueDate/progress/predecessorIds，不新增表列、不改 taskRecordSchema、不升 domain、不动 storage.ts）；不自动顺延后继。
- **验收（真实 Chrome 隔离实例，执行端采证）**：真实 Chrome v139 headless（puppeteer-core，无 API key），独立 `DSH_HOME`+独立 storage root+独立备份目录+空闲端口 **3120**；**22 项全绿**（拖前 clientWidth>0 / 拖后 DOM 在 / 即时更新无需 F5 / 无全字段 Notice / inline role=status / ~3s 自消 / 连拖只一次写 / <4px 点开抽屉零写 / 横滚不误触 / 父派生条不可拖 / 故障内联错误 / 故障全局错误不被 quiet 吞 / 故障条回落无 ghost / 故障服务端零写 / 重载读回 / 重启读回白名单 / console·pageerror=0）；静态契约 `verify-gantt-drag.mjs` 退出 0（A flex-wrap / B quiet 单次 refresh / C catch 不吞错 / D saving 锁+unmount timer / E aria-live / F payload 两键）。证据 `docs/verification/gui-gantt-drag-hotfix-20261014/`。
- **回归新增 7 项（独立测试专家最终签 7/7 PASS）**：GI-WRITE-06/07 + GI-WEB-16~20；证据 `docs/verification/gui-gantt-drag-hotfix-20261014/`，判定权已由测试专家回填为 7/7 PASS。
- **ISS-027 精确 PID 流程（继续遵守）**：隔离监听 PID=86864 / `--port 3120` / `--no-open`；仅对 86864 `kill -TERM` 一次、验 EXITED、3120=DOWN；正式 3080=PID 69064 / 3091=PID 69065 启动前后均 LISTEN、PID 未变。
- **零污染**：正式 `data/`/`backups`/`exports` **156 资产文件本轮零变化**（before=after，changed/added/removed=0）。
- **client 完整哈希（已实测锁定）**：`shasum -a 256 packages/dsh-pm-tool/lib/client.js` = `68238d1a37c4eccfe16ff1699b91310e304d47eddc01466ac19b5193892131d8`（332139 B / 332.14 kB），bundle 含 `pm-gantt-bar`、宿主合并 bundle HTTP 200（证明生效包=本次构建）。
- **人工项 / 降级项（均不阻塞）**：GI-WEB-14 真 390 窄窗仍 MANUAL_PENDING；GI-CP-01~05 关键路径仍 deferred；M-01 prod 真实 Key 仍 MANUAL_PENDING（PoC 免费车道免 Key）。
- **影响范围 / 状态**：纯版本事实与文档口径；注解 tag 将在最终提交时创建。
- **验证**：`node -e "JSON.parse(require('./packages/dsh-pm-tool/package.json'))"` 通过；`git diff --check` 干净；未改产品 src / testing 矩阵 / 证据、未 commit。

## [v0.7.2] 最终可发布：甘特排期视图信息增强（零 schema）（2026-10-14，平台：doubao-work）

> 状态：**独立测试专家已最终签 PASS（范围内 34/35），本版本可发布**。用户授权最终发布/提交/正常 push/正式升级，但**暂不 commit/tag/push**，待用户最终通知执行最终提交并打 tag（注解 tag 指向最终 release commit）。历史 tag `v0.1.0`–`v0.7.1` 不移动。

- **改动文件（版本事实/文档口径，不改产品 src、测试专家 docs、证据、vendor、scripts、服务）**：
  - `packages/dsh-pm-tool/package.json`：`version` `0.7.1` → **`0.7.2`**。
  - `docs/releases/v0.7.2.md`：**新建（最终可发布）**，列甘特信息增强，验收绿数按测试专家最终签门回填。
  - `README.md`：版本导航表 v0.7.1 改标已发布（`d5cfa5aa`→`02f42d1`）、新增 v0.7.2 可发布行；阶段导航对齐最终签 PASS。
- **补丁范围（v0.7.1 之后）**：甘特排期视图「信息可读性」增强——①根因修复 `--pm-accent` 变量从未定义致 `color-mix` 退化为透明（条体不可见），正式定义 `--pm-accent: var(--dsw-alias-state-business-primary)`、全色值走宿主语义变量不写死 hex；②起止日期直显（`labelDates` + 窄条外置 sideLabel，不只藏 tooltip）；③0/部分/100 进度可视化（条内进度层 `progress/100` 填充，纯渲染不写库）；④`predecessorIds` 为唯一真源的只读 SVG 依赖箭头（`pointer-events:none`，自指/成环/悬空/缺日期诚实 skipped 降级，不画第二份依赖副本）；⑤父子 effectiveRange 只读派生（`min(子 start)~max(子 due)` 虚线派生条，不回写父日期）；⑥ARIA/`localTodayIso()` 本地今日线轴外钳制/里程碑缺 targetDate 返回 null 防 NaN；⑦拖拽整条平移、落库 payload 白名单仅 `startDate`/`dueDate`，不动 progress/predecessorIds/status/assignee、不自动顺延后继。
- **范围纪律**：**零 schema**（只读 v0.7.1 既有 startDate/dueDate/progress/predecessorIds，不新增表列、不改 taskRecordSchema、不升 domain、不动 storage.ts）；**关键路径 deferred**（GI-CP-01~05 本轮未新增最长路径/高亮代码，按裁决 N/A 不计失败，成环/缺日期降级已由 GI-PURE-05 `dependencyEdges.skipped` 覆盖）。
- **验收（测试专家最终签 PASS）**：范围内 **34/35 PASS**——AUTO 纯函数 11/11 + INT 写路径 5/5 + COLLAB 红线 4/4 + GUI 14/15；**父 effectiveRange 聚焦 GUI 复验 PASS**；真实 Chrome headless 隔离实例（独立 `DSH_HOME` + 端口 3102，正式 3080/3091 未触）；正式 `data/`/`backups`/`exports` **157 资产文件零污染**。
- **人工项 / 降级项（均不阻塞）**：**GI-WEB-14 真 390px 窄窗 = MANUAL_PENDING**（实测视口 768px，沿用 PL-WEB-11 留所有者本人目视）；GI-CP-01~05 关键路径 = ➖ deferred；**M-01 生产（prod）真实 Key 仍 MANUAL_PENDING**（PoC `our-free-model`/`kilo-auto/free` 免费免 Key）。
- **client bundle 哈希**：`dcf44a4a9b73b3142fdaa294eee629ae13fcaaba0e4d2e124c59bc59caf0d4ac`（`shasum -a 256 packages/dsh-pm-tool/lib/client.js` 实测；bundle 含 `pm-gantt-bar` 串证明生效包=本次构建）。
- **影响范围 / 状态**：纯版本事实与文档口径；注解 tag 将在最终提交时创建。
- **验证**：`node -e "JSON.parse(require('./packages/dsh-pm-tool/package.json'))"` 通过；`git diff --check` 干净；格式校验通过。

## [v0.7.1] 最终可发布：稳定性补丁 S1/S2/S3 + 协作演进契约（2026-10-14，平台：doubao-work）

> 状态：**独立测试专家已最终签 PASS，本版本可发布**。用户授权最终发布/提交/正常 push/正式升级，但**暂不 commit/tag/push**，待用户最终通知执行最终提交并打 tag（注解 tag 指向最终 release commit）。历史 tag `v0.1.0`–`v0.7.0` 不移动。

- **改动文件（版本事实/文档口径，不改产品 src、测试专家 docs、vendor、scripts、服务）**：
  - `packages/dsh-pm-tool/package.json`：`version` `0.7.0` → **`0.7.1`**。
  - `docs/releases/v0.7.1.md`：**新建（最终可发布）**，列 S1/S2/S3 稳定性补丁 + 协作演进契约，验收绿数按测试专家最终签门回填。
  - `README.md`：版本导航表 v0.7.0 改标已发布（`b6ba06ac`→`217d8ae`）、新增 v0.7.1 可发布行；阶段导航对齐最终签 PASS。
- **补丁范围（v0.7.0 之后）**：S1——move+renumber 回滚 AggregateError 及用户安全摘要；S2——ask-apply settings 60s 顺序重放幂等 + 真实新进程测试（非跨进程互斥）；S3——repo-format browser-safe 唯一真源 + 三级 CLI；协作演进契约 `docs/product/11-collaboration-ready-architecture.md`（当前不实现账号权限实时）。
- **验收（测试专家最终签 PASS）**：S1/S2/S3 **28/28 全 PASS**；**59 个 verify scripts 全绿**；隔离 guard **157 个资产文件零变化**；client bundle 完整哈希 `dd66be290d2d1568742821b10713243f0790edf78fdc8c43ce703de3550f1397`。
- **人工项**：**M-01 生产（prod）真实 Key 仍 MANUAL_PENDING（不阻塞发布）**；PoC `our-free-model`/`kilo-auto/free` 免费免 Key。G8/H5 不可逆动作维持 MANUAL_PENDING。
- **影响范围 / 状态**：纯版本事实与文档口径；注解 tag 将在最终提交时创建。
- **验证**：`node -e JSON.parse(package.json)` 通过；`git diff --check` 干净；verifier `check-file-format` 通过。

## [v0.7.0] 最终可发布：仓库链接（T7）+ 跨项目负责人补全（T8）（2026-10-14，平台：doubao-work）

> 状态：**独立测试专家已最终签 PASS，本版本可发布**。用户授权最终发布/提交/正常 push/正式升级，但**暂不 commit/tag/push**，待用户最终通知执行最终提交并打 tag（注解 tag 指向最终 release commit）。历史 tag `v0.1.0`–`v0.6.1` 不移动。

- **改动文件（版本事实/文档口径，不改产品 src、测试专家 docs、vendor、scripts、服务）**：
  - `packages/dsh-pm-tool/package.json`：`version` `0.6.1` → **`0.7.0`**。
  - `docs/releases/v0.7.0.md`：**新建（最终可发布）**，列 T7 仓库链接 + T8 人员补全，验收绿数按测试专家最终签门回填。
  - `README.md`：版本导航表 v0.6.1 改标已发布（`94657fe2`→`38f3512d`）、新增 v0.7.0 可发布行；阶段导航对齐最终签 PASS。
- **功能范围（v0.6.1 之后）**：T7——task/deliverable 可选 repoUrl/branch 共享验证、表单可编辑/只读链接、ProjectForm repo 清空；T8——跨项目负责人候选 datalist 五来源归一去重/自由输入/零持久化；另含表单 key 加固。
- **验收（测试专家最终签 PASS）**：T7/T8 **30/30 全 PASS**（T7=18、T8=12）；client bundle 完整哈希 `e75ee229a067b64f8c8d546410ec50ba19f723acfca405ceeb1111a62135cfbd`；全量 verify scripts 全绿、隔离 guard 零污染。
- **人工项**：**M-01 生产（prod）真实 Key 仍 MANUAL_PENDING（不阻塞发布）**；PoC `our-free-model`/`kilo-auto/free` 免费免 Key。G8/H5 不可逆动作维持 MANUAL_PENDING。
- **影响范围 / 状态**：纯版本事实与文档口径；注解 tag 将在最终提交时创建。
- **验证**：`node -e JSON.parse(package.json)` 通过；`git diff --check` 干净；verifier `check-file-format` 通过。

## [v0.6.1] 最终可发布：v0.6.0 UX 反馈补丁 + 后端数据安全（2026-10-14，平台：doubao-work）

> 状态：**独立测试专家已最终签 PASS，本版本可发布**。用户已授权最终发布/提交/正常 push/正式升级，但**暂不 commit/tag/push**，待用户最终通知执行最终提交并打 tag（注解 tag 指向最终 release commit）。历史 tag `v0.1.0`–`v0.6.0` 不移动。

- **改动文件（版本事实/文档口径，不改产品 src、测试专家 docs、vendor、scripts、服务）**：
  - `packages/dsh-pm-tool/package.json`：`version` `0.6.0` → **`0.6.1`**。
  - `docs/releases/v0.6.1.md`：**新建（最终可发布）**，列 UX 反馈补丁 R1–R8 + 后端数据安全，验收绿数已按测试专家最终签门回填。
  - `README.md`：版本导航表 v0.6.0 改标已发布（`32659c40`→`23873fcb`）、v0.6.1 改标可发布；阶段导航对齐最终签 PASS。
- **补丁范围（v0.6.0 之后）**：UX 反馈——备份确认/路径恢复(R1)、长 Notice 可滚动(R2)、键盘 j/k/Space/门控(R3)、390 顶栏(R4)、移动/promote 入口(R5)、甘特 tick/unplanned/可点(R6)、副驾 loading/poc-prod lane(R7)、前置依赖紧凑树(R8)；后端数据安全——恢复队列化、批删全预检、exports guard、模型状态往返。
- **验收（测试专家最终签 PASS）**：UX 反馈回归 **14/14 全 PASS**；后端安全 **53 个 verify scripts 全绿**；隔离 guard **157 个资产文件零变化**；client bundle 哈希 `d43353ea`。
- **人工项**：**M-01 生产（prod）真实 Key 仍 MANUAL_PENDING（不阻塞发布）**；PoC `our-free-model`/`kilo-auto/free` 免费免 Key，本轮 UX 验证已走通。G8/H5 不可逆动作维持 MANUAL_PENDING。
- **影响范围 / 状态**：纯版本事实与文档口径；注解 tag 将在最终提交时创建。
- **验证**：`node -e JSON.parse(package.json)` 通过；`git diff --check` 干净；verifier `check-file-format` 通过。

## [文档纠错] v0.6.0 备份路径更正 + UX 人工反馈回归在修（2026-10-14，平台：doubao-work）

> 目的：仅修正我负责版本文档的两处当下口径错误；不提前发布、不打 tag、不提交。历史条目不搬运、不改写。

- **改动文件（仅我负责的 living docs）**：`docs/handoff.md` / `docs/progress.md` / `docs/onboarding-prompt.md`。
- **① 默认备份目录更正**：实测源码 `BUILTIN_DEFAULT = '../../../backups/'`（相对 `packages/dsh-pm-tool/lib/core/backup.js`）解析即仓库 **`packages/backups/`**；此前 handoff 写成 `packages/dsh-pm-tool/backups/` 系笔误。取值优先级：**显式 directory 参数 > `DSH_PM_BACKUP_DIR` > builtin**。
- **② UX 状态更正（不再声称全部交付）**：HEAD 已到 `4a8ff63`（冻结 v0.6 人工反馈回归矩阵）；**v0.6.0 已正式发布**（注解 tag 对象 `32659c40` → 提交 `23873fcb`，2026-10-13 19:38:02），当前 `4a8ff63` 在该 tag 之后、属**尚未发布的 UX 补丁线**。用户反馈的 **14 项真实 GUI 体验缺陷（R1-01…R8-01）初始全 FAIL，UX 补丁在修、真实 GUI 未全部通过**（3098 实测 R5-01 通过、R3-01 真实按键不触发未过、R5-02 promote 未达落盘，余多 NOT_RUN/部分通过）。深色错误对比度用户目视**已通过**；**模型车道口径更正：PoC 车道 `our-free-model`/`kilo-auto/free` 免费免 Key，不存在"免费车道真实 Key"，PoC 真实请求待本轮 UX 验证；仅生产（prod）真实 Key 缺配，保持 MANUAL_PENDING**。
- **影响范围**：纯文档口径；等最终 GUI 测试结果后再继续版本同步。

## [v0.6.0] 归档摘要 + 版本对账（2026-10-13，平台：doubao-work）

> 目的：主线 schema v2 完成、总门 PASS 后，把版本事实统一到 v0.6.0。本批**只新增归档摘要与对账，不搬运/重排既有条目历史**。

- **改动文件（版本事实/文档口径，不改产品 src、测试专家 docs、vendor、scripts、服务）**：
  - `packages/dsh-pm-tool/package.json`：`version` `0.5.0` → **`0.6.0`**。
  - `docs/releases/v0.6.0.md`：**新建（预览）**，诚实列 schema v2 / 跨项目人员负载 / 副驾多步规划 / Web 体验补齐 / 备份原子回滚，自动化 **52 functional 绿** + guard **151 文件零变化**，G8/H5 不可逆人工动作 `MANUAL_PENDING`，并标注待打 tag。
  - `README.md`：版本导航表新增 v0.6.0 预览行、v0.5.0 改标已发布；阶段导航口径对齐「主线完成·进入维护」。
  - `docs/progress.md` / `docs/handoff.md` / `docs/onboarding-prompt.md`：HEAD 候选 `4b533ad`、主线完成进入维护/P1 backlog 口径同步。
- **历史版本对账（tag ↔ 发布说明 ↔ package.json）**：
  | 版本 | tag（注解）对象 → 指向提交 | 发布说明 | package.json |
  |---|---|---|---|
  | v0.5.0 | `c8d3da52` → `81c5a112`（2026-10-13 11:46:43） | `docs/releases/v0.5.0.md` ✅ | — |
  | v0.6.0 | **待打 tag**（基线 `4b533ad`） | `docs/releases/v0.6.0.md`（预览） | **0.6.0（本批前置）** |
  > 历史 tag `v0.1.0`–`v0.5.0` **一律未移动/未重打**。
- **影响范围 / 状态**：纯版本事实与文档口径；不打 tag、不提交。自动化证据沿用独立测试专家冻结基线 `17ccc82`+`4b533ad`（52 绿 + guard 151），本批未改产品代码。
- **验证**：`node -e JSON.parse(package.json)` 通过；`git diff --check` 干净；verifier `check-file-format` + `placeholder-audit` 通过。

## [未发布] Web polish 三件套 PROD-04/09/10 v0.5.2 实现状态回写（2026-10-13，平台：doubao-work）

- **背景**：Web polish 三件套（PROD-10 任务来源会议直达 / PROD-09 汇报相邻对比徽标 / PROD-04 Web 改父+原子重编号）已由实施线实现，并经独立测试矩阵验收。本批**只回写产品/living docs 状态**，不改 `docs/testing/`、不提交。
- **改动文件（仅文档口径）**：
  - `docs/product/09-web-polish-design.md`：状态由「契约定稿·未开发待测试门」→「已实现·独立验收 27/27 PASS」；标题行、状态块、§六同步落地口径。
  - `docs/product/05-roadmap-and-tasks.md`：PROD-04/09/10 三行与页脚勘误标记 ✅ 已实现·27/27 PASS；下一步主线＝schema v2。
  - `docs/product/README.md`、`docs/requirements.md`（变更提案段）：索引与需求接口状态同步翻转。
  - `docs/progress.md` / `docs/handoff.md` / `docs/onboarding-prompt.md`：主线状态与下一步统一为 **schema v2（PROD-11 predecessorIds + PROD-21 repoUrl + PROD-23 健康分/原子恢复）**。
- **验收结论（独立测试矩阵签发）**：总门 **PASS——27 / FAIL = 0 / BLOCKED = 0 / NOT_RUN = 0 / MANUAL_PENDING = 0**（testedCommit `85cb651`；真 390 窄窗沿用 PL-WEB-11，不在本门重复）。AUTO 门 `pnpm run build`=0、full isolation guard=0、3 个新专项 verify（`verify-meeting-source.mjs` / `verify-report-diff.mjs` / `verify-task-move-renumber.mjs`）全退出 0；GUI 门在隔离实例（端口 3095 独立 DSH_HOME，未碰 3080/3091 与仓库 data）真实 Chrome 逐用例过证，证据 `docs/verification/gui-web-polish-20261013/`；正式 data/ 与 backups 149 文件 hash+mtime 零污染、敏感扫描无 token/cookie。
- **契约兑现**：零 schema（domain 仍 v1、9 表）；PROD-10 纯前端反查 `meetings.actions[].taskId`（多来源按会议日期倒序取确定第一 +「另 N 场」）；PROD-09 全量按 periodEnd/id 排序相邻固定快照 diff 三指标（averageProgress / overdue_task / exceptions 总数，首份无徽标、零差「持平0」、文字+箭头非仅色）；PROD-04 一次确认＝原子改父+项目全量 renumber、失败整树回滚、取消零写。
- **影响范围**：仅文档；不打 tag、不提交（按要求）。

## [未发布] PROD-24 副驾多步规划 v0.6 体验增量实现状态回写（2026-10-13，平台：doubao-work）

- **背景**：PROD-24（PROD-20 AI 项目副驾的多步规划增量）已由实施线实现，并经独立测试矩阵验收。本批**只回写产品/living docs 状态**，不改 `src/`、不改 `docs/testing/`、不提交（多步候选仍在工作树）。
- **改动文件（仅文档口径）**：
  - `docs/product/08-copilot-multistep-design.md`：状态由「设计定稿·未开发」→「已实现」；标题行、状态块、§十五由"落地计划"改为"落地对照"。
  - `docs/product/05-roadmap-and-tasks.md`：PROD-24 行标记 ✅ 已实现·独立验收 PASS；追加 2026-10-13 验收结论与下一步主线。
  - `docs/product/README.md`、`docs/requirements.md`（变更提案段）：索引与需求接口状态同步翻转。
  - `docs/progress.md` / `docs/handoff.md` / `docs/onboarding-prompt.md`：主线状态与下一步统一为 **Web 体验补齐（PROD-04 任务改父 Web / PROD-09 汇报相邻对比徽标 / PROD-10 任务来源会议直达），其后才进 schema v2（PROD-11 依赖 / 甘特B / 健康分）**。
- **验收结论（独立测试矩阵签发）**：总门 **PASS——49 项 AUTO/GUI 可自动项全绿，0 NOT_RUN / 0 FAIL / 0 BLOCKED**；自动化门 `build` 退出 0、44 个 verify 脚本全绿（含新增 `verify-copilot-plan.mjs`、`verify-copilot-plan-cancel.mjs`）、正式 `data/` 与 backups 149 个文件 hash+mtime 零污染；GUI 门在隔离实例（127.0.0.1:3093 真实 Chrome headless，未碰 3080/3091/data）逐用例过证。**2 项 MANUAL_PENDING（不阻塞）**：CMP-DEG-05（真实免费模型限流/乱码/无 Key 实机降级）、CMP-GUI-11（真 390px 窄窗目视）。
- **契约兑现**：domain 仍 v1、零新表、不写 settings、计划只在前端内存；唯一写动作 `task.update`（patch 5 标量）；DAG 坏步局部拒（>8 步整拒）；同任务链式 baseline；整批+逐步确认；旧 `{"actions":[...]}` 输出兼容；取消/降级零写。
- **影响范围**：仅文档；不打 tag、不提交（按要求）。

## [未发布] PROD-07 人员与负载视图 v0.5.1 实现状态回写（2026-10-13，平台：doubao-work）

- **背景**：PROD-07（复用并升级为顶层「人员与负载」tab）已由实施线实现，并经独立测试矩阵验收。本批**只回写产品/living docs 状态**，不改 `src/`、不改 `docs/testing/`、不提交。
- **改动文件（仅文档口径）**：
  - `docs/product/07-people-load-view-design.md`：状态由「待测试门/未编码」→「已实现·独立验收 PASS」；§一/§十三同步落地口径。
  - `docs/product/05-roadmap-and-tasks.md`：迭代总览 v0.5.1 行与 PROD-07 行标记 ✅ 已实现·PASS；追加 2026-10-13 验收结论与下一步主线。
  - `docs/product/README.md`、`docs/requirements.md`（变更提案段）：索引与需求接口状态同步翻转。
  - `docs/progress.md` / `docs/handoff.md` / `docs/onboarding-prompt.md`：主线状态与下一步统一为 **AI 副驾多步规划**。
- **验收结论（独立测试矩阵签发）**：**28 PASS / 0 NOT_RUN / 0 FAIL**；唯一遗留 = **1 项 MANUAL_PENDING（真实 390px 窄屏目视，须所有者本人在真浏览器确认）**。
- **边界**：纯前端 snapshot 派生、`task.assignee` 归一化（trim+空白折叠+casefold）聚合、不建人员表、不动 domain/schema；P1（相似名软提示/j·k 导航+记忆/涉众提示）后续做。
- **影响范围**：仅文档；不打 tag、不提交（按要求）。

## [v0.5.0] 归档摘要 + 历史版本对账说明（2026-10-13，平台：doubao-work）

> 目的：发布收尾前把「版本事实」统一到 v0.5.0。本批**只新增归档摘要与对账说明，不搬运、不重排、不改写下列既有 `[未发布]` 条目的历史归属**（避免把历史提交错误归类到新版本）。

- **改动文件（版本事实/文档口径，不改产品 src、测试专家 docs、vendor、scripts、服务）**：
  - `packages/dsh-pm-tool/package.json`：`version` `0.1.0` → **`0.5.0`**（前置到当前开发线；产品 src 由另一 Agent 负责，未改）。
  - `docs/releases/v0.4.0.md`：**新建（事后补记）**，严格按真实 tag 回填——注解 tag 对象 `ca02969` → 指向提交 `1af5490`（2026-10-12），内容取 `git log v0.3.0..v0.4.0`（PoC 跨池降级链 + OPT-01~12 + PROD-01/02/03/05/08）。
  - `docs/releases/v0.5.0.md`：**新建（预览）**，诚实列已完成 / 预览、自动化 **41 绿** / guard **149 文件零变化**、H1–H6 与真实 Key（M1/A5）`MANUAL_PENDING`，并标注待打 tag 与发布前置条件。
  - `README.md`：新增「版本导航」表（v0.1.0–v0.4.0 已发布 tag + v0.5.0 预览），刷新阶段导航，去除 stale 的「已发布 v0.1.0」口径。
  - `docs/optimization-backlog.md`（roadmap）：对账确认 OPT-01~12 已随 v0.4.0 交付，移入「已消化」；待排期区清空，保留结构性长期项。
  - `docs/progress.md` / `docs/handoff.md`：把「当前状态（v0.4.1-integration，未 tag）」「v0.4.0 tag=1af5490」等混乱口径统一到 v0.5.0 预览线，并澄清 tag 对象(`ca02969`)与剥离提交(`1af5490`)是两个 SHA。
  - `AGENTS.md`：新增「自 v0.5.0 起版本/tag 一致」硬规则；`docs/onboarding-prompt.md`：更新文末易变快照。
- **历史版本对账说明（tag ↔ 发布说明 ↔ package.json）**：
  | 版本 | tag（注解）对象 → 指向提交 | 发布说明 | package.json |
  |---|---|---|---|
  | v0.1.0 | `ebd14a1` → `56b27c8`（2026-10-10） | `docs/releases/v0.1.0.md` ✅ | 历史为 0.1.0 |
  | v0.2.0 | `2f0ecab` → `2c2e039`（2026-10-11） | `docs/releases/v0.2.0.md` ✅ | — |
  | v0.3.0 | `41e515e` → `4b33b84`（2026-10-11） | `docs/releases/v0.3.0.md` ✅ | — |
  | v0.4.0 | `ca02969` → `1af5490`（2026-10-12） | 本批补 `docs/releases/v0.4.0.md` ✅ | — |
  | v0.5.0 | **待打 tag**（基线 `2682fc7`） | `docs/releases/v0.5.0.md`（预览） | **0.5.0（本批前置）** |
  > 历史 tag `v0.1.0`–`v0.4.0` **一律未移动/未重打**。此前漂移根因：package.json 长期停留 `0.1.0`、漏写 v0.4.0 发布说明、handoff 把注解 tag 对象与剥离提交混为「对不上」；本批逐项对齐。
- **影响范围 / 状态**：纯版本事实与文档口径；不打 tag、不提交（按要求）。自动化证据沿用独立测试专家冻结基线 `2682fc7`（41 绿 + guard 149），本批未改产品代码，不重跑自动化。
- **验证**：`node -e JSON.parse(package.json)` 通过；各 Markdown 结构与 `git diff --check` 干净；用 vendored `code-review`（只读）自查改动，发现写入本 Agent 自身 artifacts，不新增试点报告（code-review 已毕业试点）。

## [未发布] — 外部 Skill 自动路由治理：ADL-049 + AGENTS 自动选择要求（2026-10-13，平台：doubao-work）

- **改动文件（仅长期规范/索引）**：
  - `docs/decision-log.md`：置顶新增 **ADL-049**（vendored skill 由执行 Agent 按任务自动路由、无需用户点名）。
  - `AGENTS.md`：第 6 节在 vendor 治理条下追加一条简短**自动选择**规则（映射 grill-me/tdd/diagnosing-bugs/code-review + 简单任务可不加载 + 优先级 + 加载前验证/留痕）。
  - `docs/knowledge-base.md`（KB-038）/ `docs/progress.md` / `docs/handoff.md` / `docs/onboarding-prompt.md` 快照：同步自动路由规则与当前状态。
- **为什么**：项目所有者更新长期治理——vendored skill 不再要求用户显式指定，由 Agent 按上下文自动判断；需把映射、边界与优先级固化为长期规范。
- **自动路由精确语义（ADL-049，按 REQUEST CHANGES 修订后的实现 `src/core/external-skill-router.ts`）**：缺阻塞信息→`interaction` 追问、route=none（**全拦**）；`vendorIntegrityVerified` 必须 **true**（安全门硬前置，未过即 none）；根因未明→仅 `diagnosing-bugs`（**抑制 grill/tdd、不叠 code-review**）；实质歧义非 trivial→`grill-me`；新功能/可测修复非 trivial→`tdd`；交付边界→**追加 `code-review`（trivial 也保留）**；`isTrivial` 抑制 grill/tdd。优先级：项目规则 > 追问澄清 > 独立测试门 > skill 步骤；自动加载无需用户口令，但须先校 `verify-external-skills.mjs` 静态校验 PASS + sha256、逐次填试点报告。配套纯函数 + 校验脚本 `scripts/verify-external-skill-router.mjs` 由实现方落地。
- **影响范围 / 状态**：本批仅改规范/索引文档；**不改** vendor、政策正文（`docs/external-skills.md`，另一 Agent 维护）、验收矩阵、试点报告、路由代码。**自动路由实现已独立复核 APPROVE**：`scripts/verify-external-skill-router.mjs` **41 组断言全绿**（K1–K6、K3 安全门 false 拦截/true 放行、taskKind 留痕、冻结去重、确定性），**K 域专家 = PASS**。**自动路由 ≠ 毕业**——仍「试点可用，未毕业」：`code-review` 试点 PASS，其余 3 entry（grill-me/tdd/diagnosing-bugs）试点待做。
- **验证**：`git diff --check` 干净；`node scripts/verify-external-skills.mjs`（vendor 安全门）exit 0；`node scripts/verify-external-skill-router.mjs` **41 组断言全绿、exit 0**；路由实现结论由独立专家签发，本接线批不自判。**未提交（按要求）**。

## [未发布] — 外部（vendor）Agent Skills 长期规范接线：ADL-048 + AGENTS/索引（2026-10-13，平台：doubao-work）

- **改动文件（仅规范/索引，不碰落地物正文）**：
  - `docs/decision-log.md`：置顶新增 **ADL-048**（选择性 vendoring：锁上游 commit、仅 4 公开 entry + 声明依赖、项目规则优先、不跑 installer、安全静态校验 + 独立试点门、升级双审/回滚）。
  - `AGENTS.md`：第 6 节红线新增一条 vendor skill 治理规则（指向 `docs/external-skills.md` + `vendor/agent-skills/mattpocock/manifest.json` + `verify-external-skills.mjs`）；第 5 节文档地图补 `external-skills.md` / `docs/testing/` / `vendor/` 三行。
  - `README.md`：目录树补 `docs/external-skills.md`、`docs/testing/`、`vendor/` 入口。
  - `docs/knowledge-base.md`：置顶新增 **KB-038**（外部 skill 使用四步法与边界，指向政策/manifest/校验器）。
  - `docs/testing/README.md`：文档清单索引一行 `external-skills-acceptance.md`（仅索引，不改验收矩阵正文/结论）。
  - `docs/progress.md` / `docs/handoff.md`：补本批现状快照。
- **为什么**：外部 skills 落地物（`vendor/agent-skills/mattpocock/`、`docs/external-skills.md`、`docs/testing/external-skills-acceptance.md`、`packages/dsh-pm-tool/scripts/verify-external-skills.mjs`、试点模板）已由实施方落盘但未提交；需把它们接入长期规范与索引，让后续平台能发现并遵守，同时不与实施方争抢这些文件。
- **影响范围 / 状态（2026-10-13 独立测试专家签发后更新）**：纯文档接线，不改任何业务代码、vendor 正文、政策正文、验收矩阵正文、试点报告、package 校验器。**当前状态：试点可用，未毕业。** 自动化验收门 = **PASS**（静态/校验域 A–H、J 全 PASS，无 FAIL/BLOCKED/F1，MANUAL_PENDING 无）；**`code-review` 试点 = PASS**；其余 3 entry（`grill-me`/`tdd`/`diagnosing-bugs`）尚未出试点报告（NOT_RUN），各补 1 份后方可毕业。绑定：HEAD=`93eb093c20648618c3e1d2914a20340d22325f86`、上游 commit=`49dd158d1076134a641b33efb035946536778336`。
- **验证**：`git diff --check` 无空白/冲突标记；`node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` 只读静态校验真实 vendor（PASS，只读、不执行 vendor 内容）；验收结论由独立测试专家按 `docs/testing/external-skills-acceptance.md` §7 逐域签发（本批接线方不自判）；未提交（按要求）。

- 修复：`/pm due [天数] [YYYY-MM-DD]` 新增可选 today 参数（日期粒度与时辰无关，computeReminders 已按本地日历日零点比较），verify-reminders 固化 today 并补「下午 15:30 仍稳定」用例，消除墙钟时刻边界抖动；连跑两遍 27/27 全绿。

## [未发布] — OPT-01~12 体验优化全量落地（2026-10-11，平台：doubao-work）

- OPT-01/02 提醒可点击切项目、3/7/14/30 天范围切换、按项目分组；OPT-03 记住上次选中项目（localStorage）。
- OPT-04 导出 Markdown 改前端 Blob 直接下载（文件名带项目名/时间戳）；OPT-05 批量改负责人/优先级/截止（走 `task batch update`）。
- OPT-06 网页选备份 JSON 按内容恢复（`restore-content`，两步确认+恢复前安全快照）；OPT-07 批量条淡入动画（尊重 reduced-motion）。
- OPT-08 narrate 可编辑落盘（`report narrateuse`）；OPT-11 空状态 AI CTA。
- OPT-09 面板纯键盘导航（`core/panel-kbd.ts` reducer：j/k/空格/Del/Enter，输入框与修饰键守卫）+ verify-keyboard.mjs。
- OPT-12 网页 csv/xlsx 按内容导入（`task import-content <pid> <文件名> <JSON内容>`，xlsx 仍 node 侧 SheetJS，不进 client bundle）+ verify-import-content.mjs。
- 验证：build 绿、新增 2 个 verify 共 27 个；`git diff --check` 干净。注：verify-reminders 在「当天下午时分」存在 Date 取整边界抖动（core 未改动，非本批回归）。

## [未发布] — 双模型车道（PoC 免费网关 / 生产官方 API，2026-10-11，平台：doubao-work）

- 新增 `core/model-route.ts` 统一选路：默认 `poc`（provider `our-free-model` / `openrouter/free`，第三方免费插件 dsh-our-free-model v2.1.0，免 Key，仅概念验证）；`prod` 按 Key 优先 DeepSeek 官方、其次 Kimi 官方（休眠，待所有者给 Key）。
- 新命令 `/pm model mode poc|prod`、`/pm model status`；模式持久化于 pmtool checks 表；Web AI 助手加 PoC/生产分段开关与 PoC 警示。
- 生产车道无 Key 时中文友好提示，**不回退免费车道**；verify-model-route 新增。全 24 项 verify 绿。
- 详见 ADL-044。

## [未发布] — 可达性修复 + 导出/打磨（2026-10-11，平台：doubao-work）

- **必修**：会议表整行可点击打开详情抽屉（`.pm-meeting-row`），行末新增「详情/右箭头」按钮（`.pm-meeting-detail-btn[data-id]`），hover 高亮+可点击光标；行动项「转任务」按钮补 `.pm-action-promote[data-meeting][data-action]`、已转换 `.pm-action-promoted`。
- 导出 JSON 文件名加时间戳 `pmtool-snapshot-YYYYMMDD-HHmm.json`；导出/备份成功改为顶部 Notice 反馈（含路径/计数）。
- 顶栏备份/导出按钮补 tooltip；会议行动项计数补「已转任务 x / 共 y」tooltip。
- 第二档控件补稳定选择器并在 verify-web 加契约：`.pm-ai-wbs-raw`、`.pm-ai-confirm`、`.pm-row-select`、`.pm-batch-bar`、`.pm-batch-complete`、`.pm-batch-delete`、`.pm-sort-select`。
- 验证：全 23 项 verify + build 退出 0。

## [未发布] — 第二档补齐（T2-A 可编辑/T2-B 批量/T2-C XLSX/T2-D 导出，2026-10-11，平台：doubao-work）

- **T2-A**：WBS 预览改为可编辑 Markdown textarea，`task wbs --raw` 取草稿、`task importmd` 按编辑后文本落盘（不调模型）。
- **T2-B**：任务多选复选框 + 批量工具条（标为完成/批量删除级联二次确认）+ 排序下拉（截止/优先级/进度）；core `task batch update|delete`。
- **T2-C**：`.xlsx` 离线导入（SheetJS 0.18.5 Apache-2.0，动态 import 不进 client bundle）。
- **T2-D**：导出 JSON 经浏览器 Blob 直接下载；导出 Markdown 运行命令弹窗路径（双分支）。
- 验证：新增 verify-importmd / verify-batch / verify-xlsx；全 **23** 项 verify + build + frozen-lockfile 退出 0。裁剪见 ADL-042（narrate/summarize 可编辑、批量改负责人表单、快捷键）。

## [未发布] — 第二档体验增强 T2-A/T2-C（2026-10-11，平台：doubao-work / 豆包工作）

- **T2-A**：AI 助手内置 WBS 模板一键填入 + localStorage 记忆上次模式/目标（不入库）。
- **T2-C**：`core/csv-import.ts` 纯 JS 离线解析 CSV（引号/转义/CRLF），`/pm task import *.csv [confirm]` 按表头「层级/标题/负责人/优先级/开始/截止/进度」还原父子树，复用 `addTask`；替代被裁的 LibreOffice，零新增依赖。
- 裁剪（ADL-042）：XLSX 导入、WBS 可编辑预览二次落盘、任务多选批量删除/列排序本期不做。
- 验证：新增 `verify-csv.mjs`；修复 R4 export 不覆盖报错语义回归；全 20 项 verify + build + frozen-lockfile 退出 0。

## [未发布] — 第一档离线增强 R16/R17/R18（2026-10-11，平台：doubao-work / 豆包工作）

- **R16 临期/逾期提醒**：新增 `core/reminders.ts`、`commands/due.ts`（`/pm due [天数] [项目ID?]`）、Web `ReminderStrip`；纯读时派生、不新增表、不做常驻调度（ADL-039）。验证：`verify-reminders.mjs`。
- **R17 会议行动项转任务**：`core/meetings.promoteActionToTask`（幂等回写 `action.taskId`）+ `meeting action promote` 命令 + Web 「转任务」按钮（ADL-040）。验证：`verify-promote.mjs`。
- **R18 备份/恢复**：`core/backup.ts` 扩到七实体、`commands/backup.ts`（`/pm backup` / `/pm restore ... confirm` 两步且恢复前自动安全快照）+ Web 一键备份按钮 + 新增 `docs/backup-sync.md`（云同步单写者指引）（ADL-041）。验证：`verify-backup.mjs`。
- 影响：均离线、不依赖 LLM、不新增宿主路由、配色仅用宿主 token；`backups/` 已加入 `.gitignore`。全量 build + verify（含新增 3 个专项）退出 0。

## [未发布] — A1 修复：AI 助手命令误带 /pm 前缀导致「不支持的命令」 + 补全不可发现深挖（2026-10-11，平台：doubao-work / 豆包工作）

- **改动文件**：`src/client/panel.tsx`、`scripts/verify-web.mjs`，及 KB-037 / ISS-026 / 本 changelog / 发布说明。
- **做了什么**：
  - **必修 bug（真实 Chrome 验收发现）**：`AiAssistant.lines()` 三条命令误拼了 `/pm ` 前缀（`/pm task wbs …`、`/pm report narrate …`、`/pm meeting summarize …`），而面板 execute 桥把整行直接喂给 `pm` handler、handler 只匹配裸子命令（`task`/`report`/`meeting`…），故三条都落空走到「不支持的命令」、根本没调模型。已改为裸子命令（`task wbs …` / `report narrate …` / `meeting summarize …` 及其 confirm 变体），与面板其它调用一致。
  - **Web 级联删除链路自查**：任务表单删除按钮现按 `data.tasks` 现场计算该任务子树大小——有子任务时弹窗明确「将同时删除 N 个子任务…不可撤销」并走 `task delete <id> cascade confirm`；无子任务维持原 `task delete <id> confirm`。
  - **补全调研结论**：欢迎页斜杠补全无 pm，经上游只读确认为宿主 `commands.list(agent)` 与会话/预置缓存决定，且插件侧 `commandUi.register` contribution 与 host 重名会抛 collision，**无受支持的插件侧做法**让 pm 进补全（详见 KB-037 源码路径）。
- **验证**：`pnpm run build` 绿；**全部 16 个 verify-*.mjs 退出 0**（verify-web 新增「裸子命令串 + 禁止 `/pm ` 前缀回归」断言）；`git diff --check` 干净。
- **影响范围**：A1 三按钮现在能真正调起模型草稿；Web 删除父任务走级联确认。

## [未发布] — A1 AI 助手 Web 面板 + A2 任务级联删除 + 首页 /pm 根因定位（2026-10-11，平台：doubao-work / 豆包工作）

- **改动文件**：`src/core/tasks.ts`、`src/commands/task.ts`、`scripts/verify-cascade.mjs`、`src/client/panel.tsx`、`src/client/panel.css`、`scripts/verify-web.mjs`，及 docs（ADL-037/038、KB-037、ISS-025/026、本 changelog、release v0.2.0 草稿）。
- **做了什么**：
  - **A2 级联删除**（ADL-037）：新增 `collectTaskSubtree`/`deleteTaskCascade`；`/pm task delete <id>` 无 confirm 先 dry-run 列出整棵子树；`confirm` 有子任务仍拒绝并引导；`cascade confirm` 才真删整棵、旁支不动；保留会议行动项跨表引用保护。新增 verify-cascade（dry-run 不落盘/拒绝不写盘/删3留旁支/重启读回）。
  - **A1 AI 助手 Web 面板**：项目工作台顶栏新增「AI 助手」按钮，三模式（拆解 WBS/汇报叙述/会议纪要）弹窗——「生成草稿」发一次预览命令（调一次模型），「确认入库」发 confirm 命令（复用进程内草稿缓存、不再调模型）；含 loading/按钮禁用防重复/中文错误/结果先预览显式确认才入库。**完全复用既有 core 与斜杠命令，未另写 LLM 调用层**。
  - **首页 /pm 根因**（ADL-038 / KB-037 / ISS-026）：注册结构与内置 command-goal 一致，问题属宿主 composer（斜杠补全截获 Enter、发送后主区不自动跳转）；插件无扩展点改宿主行为，以「点发送按钮+侧栏点最新会话」用法与 Web 面板为稳定入口，不假装修好。
- **验证**：`pnpm run build` 绿；**全部 16 个 verify-*.mjs 退出 0**（含新增 verify-cascade 与 verify-web 的 AI 面板契约）；`pnpm install --frozen-lockfile` 通过；`git diff --check` 干净。
- **影响范围**：新增 Web 入口与显式级联删除；旧命令行为与离线/确定性能力不变；配色仅用宿主 token。

## [未发布] — R13/R14/R15 真实 openrouter/free 端到端验证通过 + 超时中文归一加固（2026-10-11，平台：doubao-work / 豆包工作）

- **真实端到端（凭据库启动、无环境变量）**：
  - R13 `/pm task wbs p-0005 <企业官网改版目标>` → AI 产出 5 级 WBS，confirm 落盘 25 个任务（t-0003~t-0027，需求梳理/视觉设计/前后端开发/测试验收/上线 及 1.1~5.4 子任务）。
  - R14 `/pm report narrate p-0005` confirm → rpt-0002，executiveSummary 为依据确定性数字（0/25 完成、0%）撰写的真实中文叙述，**数字未被改动**。
  - R15 `/pm meeting summarize p-0005 <周会速记>` confirm → mtg-0001，解析出 议题3/决议2/行动项3（ai-001~003：张三/李四/王二）。
  - 无环境变量重启后 list 均读回；验证后临时项目 p-0005 及关联数据已删净。约 4~5 次真实模型调用。
- **加固**：`core/ai-client.ts` 的 `normalize()` 增加超时/中断识别（AbortError/ABORTED/TIMEOUT/ETIMEDOUT/匹配 abort|timeout 文案），归一为中文 `MODEL_TIMEOUT` 提示，不再把英文 `This operation was aborted` 直抛界面、不落库；verify-wbs 新增对应降级断言（stream reject AbortError → 中文提示、不写盘）。
- 新增档案：KB-036（免费池偶发超时 + Web 斜杠命令须点发送按钮、不能回车）、ISS-025（任务删除不级联，叶子→根逐层删）。

## [未发布] — R15 会议纪要归纳（2026-10-11，平台：doubao-work / 豆包工作）

- 新增能力：`/pm meeting summarize <项目ID> <粘贴速记> [confirm]`——AI 把原始速记归纳为 标题/摘要/议题/决议/行动项(负责人·截止日)，先预览草稿不落盘，confirm 才建 draft 会议并逐条挂行动项（复用既有 `addMeeting`/`addMeetingAction`）。
- 新增文件：`src/core/meeting-summarize.ts`（```json ``` 围栏剥取 + 防御性归一 + 草稿缓存）、`scripts/verify-meeting-ai.mjs`。
- 修改文件：`src/commands/meeting.ts`（summarize 子命令）、`src/index.ts`（meeting 分发传入 llm）。
- 降级：模型返回非 JSON / 失败 → 中文提示并引导手工 `/pm meeting add`；既有会议 CRUD 不受影响。
- 至此三功能（R13/R14/R15）代码完成，共 15 项 verify 全过。

## [未发布] — R14 进度汇报 AI 叙述（2026-10-11，平台：doubao-work / 豆包工作）

- 新增能力：`/pm report narrate <项目ID> [confirm]`——基于确定性采集（任务/里程碑/逾期统计）让 AI 只写「本周进展/风险/下周计划」段落，先预览不落盘，confirm 才把叙述写入既有进度快照的 `executiveSummary` 字段（**零 schema 改动**，复用 R9 `generateProgressReport`）。
- 新增文件：`src/core/report-narrate.ts`（确定性 brief 构造 + 叙述生成 + 草稿缓存）、`scripts/verify-report-ai.mjs`。
- 修改文件：`src/commands/progress-report.ts`（narrate 子命令）、`src/index.ts`（report 分发传入 llm）。
- 降级：模型失败（QUOTA/RATE_LIMIT…）→ 中文提示并引导 `/pm report generate` 确定性快照，台账不受影响。
- 安全：AI 只用我方给的数字，不编造、不碰台账；叙述为草稿，confirm 才落库。

## [未发布] — R13 智能 WBS 任务拆解（AI 草稿）（2026-10-11，平台：doubao-work / 豆包工作）

- 新增能力：`/pm task wbs <项目ID> <一句话目标> [confirm]`——AI 把目标拆解为 GitHub 缩进勾选清单，先 dry-run 预览（WBS 投影编号、不落盘），confirm 才复用草稿落盘为任务树（父子/编号沿用 `task import` 链路，confirm 不重复调模型）。
- 新增文件：`packages/dsh-pm-tool/src/core/ai-client.ts`（一次性文本生成封装：`ctx.llm.prepareCall`+`BlockAssembler`，按 `error.code` 归一为中文降级提示）、`src/core/wbs-ai.ts`（WBS 提示词 + 草稿缓存）、`scripts/verify-wbs.mjs`。
- 修改文件：`src/commands/task.ts`（wbs 子命令）、`src/index.ts`（inject 加 `llm`）、`package.json`（peer+dev 加 `@deepseek-ai/dsh-llm@0.2.1-alpha.2`）。
- 降级：无 key / 限流 / 空正文 → 中文提示并引导手工 `/pm task add`；核心任务台账离线可用（inject 缺 llm 时插件照常加载，13 项 verify 全过）。
- 技术依据：一次性调用范本 `deepseek-harness/packages/session/session-title-llm/src/index.ts`；默认路由 `openrouter-free`/`openrouter/free`。

## [未发布] — 生成型功能（智能 WBS/会议纪要/进度汇报叙述）正式立项：设计评审稿 + ADL-036（2026-10-11，平台：doubao-work / 豆包工作）

- 新增文件：`docs/generative-features-plan.md`——三功能立项设计与技术依据（一次性 LLM 调用真实 API 骨架、落点复用、降级策略、推荐开发顺序、文件级改动计划、待所有者拍板的决策点）。
- 修改文件：`docs/decision-log.md`（新增 ADL-036）、`docs/requirements.md`（新增 R13/R14/R15 评审稿，标注待编码）。
- 核心设计原则（ADL-036）：LLM 只做一次性文本生成、不依赖 function calling；确定性采集/校验/落盘全在我方代码；AI 输出一律草稿、confirm 才入库；无 key/失败优雅降级；每次生成只发一次模型请求省免费额度。
- 技术依据（已核实上游源码）：一次性调用范本 `packages/session/session-title-llm/src/index.ts`（`ctx.llm.prepareCall` + `BlockAssembler`）；错误按 `error.code`（RATE_LIMIT/QUOTA/INVALID_CREDENTIAL…）归一；智能 WBS 复用 `core/task-import.ts`、纪要复用 meeting 实体、汇报叙述叠加 `collectProjectReport` 确定性数字。
- 状态：本批为**立项设计 + 档案**，尚未编码；随后按里程碑逐个实现（智能 WBS → 进度汇报叙述 → 会议纪要归纳）。

## [未发布] — dsh 应用内 openrouter/free 实测打通 + MISSING_CREDENTIAL 排查沉淀（仅文档）（2026-10-11，平台：doubao-work / 豆包工作）

- 修改文件（**仅 docs，无业务代码、无 key 本体、无临时 PID/端口**）：
  - `docs/model-providers.md`：第 4.1 节状态推进为「dsh 应用内对话已实测通过（Free Models Router 一次成功）」；新增 **4.2 故障排查小节**（应用内报 `MISSING_CREDENTIAL`/“OPENROUTER_API_KEY which is not set” 的现象、根因、两种解法与诊断命令）。
  - `docs/knowledge-base.md`：新增 KB-035（MISSING_CREDENTIAL 排查：dsh 进程环境 vs credentials service；含「dsh 单轮约 9.5K tok、免费档按次计费不按 token」观察）。
  - `docs/issues-and-solutions.md`：新增 ISS-024（对应 MISSING_CREDENTIAL：现象/根因/解法/避坑）。
  - `docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`：把「仅剩 Web 点选确认」刷新为「模型通道（含 dsh 应用内对话）已全部实测打通；下一步仅待所有者决定是否立项生成型功能」。
- 实测事实（2026-10-11）：所有者首次在 dsh 网页选 Free Models Router 发「你好」报 `MISSING_CREDENTIAL`——根因是当时运行的 dsh 进程由「写 key 之前的旧终端」启动、进程环境无 `OPENROUTER_API_KEY`（key 本身有效，直连已 $0）；`ps eww -p <dsh pid>` 核实旧进程无该变量、全新 zsh 能读到（长度 73）。停旧 dsh、用已 `source ~/.zshrc` 的环境重启后，底部模型选择器选 Free Models Router 发「你好，用一句话介绍你自己」**第 1 次即成功**（puppeteer-core + 系统 Chrome 139 无头，KB-032）：助手正常回复、状态「已完成」、无 MISSING_CREDENTIAL/401/429，页脚约 9.5K tok（免费档按次计费，不按 token）。截图 `.tmp/ui-verify/llm-04-result-1.png`（gitignored，不入库）。
- 影响范围：仅文档口径同步；业务代码、数据、上游、profile 配置零改动。

## [未发布] — 修正一处残留错误启动命令并实测正确启动（2026-10-11，平台：doubao-work / 豆包工作）

- 修改文件（仅 docs）：`docs/progress.md` 第 103 行把错误的 `pnpm dsh --profile pm web` 改为 `pnpm dsh --profile pm`（指定 profile 后再加 `web` 会被当成 Web 应用的多余位置参数，报 "too many arguments. Expected 0 arguments but got 1: web"，即 ISS-007 记录的坑）；并把生成型能力前置条件刷新为「模型通道已就绪（ADL-035/KB-034），是否立项待所有者决定」。
- 为什么 / 影响范围：所有者照该命令启动时实际踩到该报错；仓库其余位置（tech-plugin-scaffold、knowledge-base、issues-and-solutions）口径本就正确，仅此一处残留。仅文档，无业务代码改动。
- 验证（2026-10-11，本机）：在上游目录用修正后的命令（等价 `node --import tsx/esm apps/cli/src/bin.ts --profile pm --no-open --port 0`，继承 ~/.zshrc 的 key）启动成功——日志出现 `[pm-tool] 存储领域 pmtool 已打开` 并打印带 token 的 `http://127.0.0.1:<port>/?token=...`，首页 HTTP 303（loopback cookie 鉴权正常），无 pi-ai/openrouter 报错；验证后已结束该测试进程、端口释放。

## [未发布] — OpenRouter key 已本机配置、openrouter/free 直连实测成功（仅文档状态同步）（2026-10-11，平台：doubao-work / 豆包工作）

- 修改文件（**仅 docs，无业务代码、无 key 本体**）：
  - `docs/model-providers.md`：第 4.1 节「尚未获得 key / 直连 401 属预期」改写为「key 已在所有者本机 `~/.zshrc` 配置（不入库）、openrouter/free 直连已于 2026-10-11 实测成功（$0、随机模型示例见 KB-034）」；并补一条经验——推理型免费模型会先吃满 `reasoning_tokens`，`max_tokens` 要给足（建议 ≥400），否则正文为空。
  - `docs/knowledge-base.md`：新增 KB-034（openrouter/free 免费自动路由实测行为：随机分配模型、纯文本 $0 可用、推理型吃满 reasoning tokens、每日 50 次、稳定 function-calling 不保证、核心台账保持离线）。
  - `docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`、`docs/requirements.md`：把「待所有者给 key / 当前无 key / 直连 401 属预期」统一刷新为「key 已本机配置、端点实测通过，仅剩所有者在 dsh Web 设置→模型点选 openrouter-free 发一句做应用内确认」。
- 实测事实（2026-10-11，所有者授权本机直连）：`GET /v1/key` 返回 `is_free_tier: true`、`free_model_daily_requests.limit = 50`、key 到期 2027-04-09；`POST /v1/chat/completions`（`model=openrouter/free`）两次真实调用均成功、`cost=$0`、`finish_reason=stop`（随机落到 `liquid/lfm-2.5-2.6b:free` 与 `nvidia/nemotron-3-ultra-550b-a55b:free`）。key 本体只在所有者本机 `~/.zshrc`（改前已备份 `~/.zshrc.bak-20261011-130537`），**不入库、不写入任何仓库文件**。
- 为什么：模型通道已从「待给 key」推进到「端点实测打通」，需同步档案口径，避免后续接手者误以为还在等 key。
- 影响范围：仅文档；业务代码、数据、上游、profile 配置零改动；下一步是否立项做生成型功能（智能 WBS/纪要/周报）仍待所有者决定。

## [未发布] — 配置零成本 OpenRouter 免费 LLM 通道（openrouter/free）+ 预留其他官方厂商接入位（2026-10-11，平台：doubao-work / 豆包工作）

- 新增文件：
  - `docs/model-providers.md`：模型接入通道可移植文档。记录工作原理（第三方 OpenAI 兼容模型走 `@deepseek-ai/dsh-llm-pi-ai` 的 `providers` 字典，不改 `DEEPSEEK_BASE_URL`）、当前启用的 OpenRouter 免费自动路由完整配置、key 从哪取/放哪（只放进程环境变量、dsh 不自动读 `.env`、绝不入库）、9 家预留但不启用的官方端点（DeepSeek 官方/OpenAI/Anthropic/Gemini/Groq/硅基流动/智谱 GLM/阿里百炼/本地 Ollama）注释 YAML 模板、切换/停用/升级上游复查点，以及所有者「约 3 分钟开通+验证」步骤与不依赖 dsh 的直连自检 curl。
- 修改文件：
  - `docs/decision-log.md`：新增 ADL-035（采用 OpenRouter 免费自动路由作零成本尽力而为 LLM 通道、核心保持离线、其他官方厂商以预留模板保留、免费随机模型不保证工具调用）。
  - `docs/knowledge-base.md`：新增 KB-033（llm-pi-ai 第三方 OpenAI 兼容端点配置 + profile 按 id 外挂 + apiKeyEnv 密钥不入库、不自动读 .env）。
  - `docs/requirements.md`、`README.md`、`docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`：生成型能力注记（**通道已就绪、具体功能仍待立项**）、文档地图加 `model-providers.md`、交接快照刷新。
- **仓库外改动（不入库，仅记录便于他机复现）**：`~/.dsh/profiles/pm/cordis.patch.yml` 在原有 `storage-json`、`ui-settings-general` 之外追加 `- id: llm-pi-ai ... providers.openrouter-free`（改前已备份为同目录 `cordis.patch.yml.bak-before-openrouter`）。`@deepseek-ai/dsh-llm-pi-ai` 本就随 base bundle 装载（原本零路由休眠），**未新装任何插件、未写任何 key**。
- 为什么：项目所有者拍板方案 B——先把零成本 OpenRouter 免费通道配好用于未来生成型能力，同时预留其他官方模型接入位但暂不启用；本批只做「模型通道配置 + 可移植文档 + 加载验证」，不实现具体 AI 业务功能（智能 WBS/纪要/周报仍按 ADL-032 暂缓）。
- 验证：`pnpm install --frozen-lockfile` 干净；`pnpm run build` 退出码 0（client bundle 153.00 kB）；**12 个** `verify-*.mjs` 全部退出码 0；`DSH_HOME=~/.dsh pnpm dsh --profile pm --dump-config` 退出码 0、组合中出现 `providers.openrouter-free` 且 `storage-json` root / `dsh-pm-tool` 完好；无 Key 真实宿主启动（随机端口、`[pm-tool] 存储领域 pmtool 已打开`、无 pi-ai/openrouter 启动报错），运行中下发的 `plugins/??dsh-pm-tool/client.js` 合并 bundle HTTP 200（153033 B、含 70 处 pm 界面串；无 cookie 访问根路径 401）。
- 边界与待办：当前**无 `OPENROUTER_API_KEY`**，真实对话未测（无 key 时 OpenRouter 直连返回 401 属预期）；待所有者填入 key 后按 `docs/model-providers.md` 第 4 节做一次真实对话即可最终确认。OpenRouter 免费限额（约 20 次/分、充值 <$10 时 50 次/天）与 slug 均以官网为准、可能变动。
- 影响范围：仅新增通道配置文档与档案；业务代码、数据、上游零改动；核心离线台账能力不受影响。

## [未发布] — Chrome 真实浏览器自动目视闭环 + 窄屏标签修复 + 浏览器/上游兼容决策（2026-10-11，平台：doubao-work / 豆包工作）

- 修改文件：
  - `packages/dsh-pm-tool/src/client/panel.css`：`.pm-view-tab` 增加 `white-space:nowrap; flex:0 0 auto`。为什么：390px 窄屏下视图标签此前被压到中文逐字断行（「全部任务」折成「部/任」），不美观；改为标签保持单行、标签条在 `≤760px` 容器查询下已有的 `overflow-x:auto` 内局部横滚，整页仍无横向溢出。
- 为什么：项目所有者要求「在请他本机抽检前，先用真实 Google Chrome 把 R5/R7–R12 面板完整自验一遍」。本角色此前无 GUI 权限，浏览器目视只能退化为 HTTP bundle 探测（KB-028）或等所有者手动。本批按 KB-032 首次做到了**无辅助功能授权、不另装 Chromium** 的真实 Chrome 自动点击/截图/主题/窄屏/控制台网络断言。
- 验证：`pnpm install --frozen-lockfile` 干净；`pnpm run build` 退出码 0（client bundle 153.00 kB）；**12 个** `verify-*.mjs` 全部退出码 0；`git diff --check` 干净。隔离 DSH_HOME（ISS-019）+ 富种子 + 随机端口 + 无 Key 启动真实宿主后，puppeteer-core 驱动本机 Chrome 139 逐屏操作：**27/27 用例通过，0 console error / 0 pageerror / 0 失败请求 / 0 同源 4xx-5xx**；看板统计数值与种子一致；浅/深色可读；786px 与 390px 整页无溢出。
- 决策沉淀：ADL-033（浏览器兼容仅 Chrome，Safari/Firefox 本期不支持）、ADL-034（上游 dsh 新版本兼容策略：peer 锁 v0.2.1-alpha.2 + profile link 装载 + 升级冒烟流程）；新增 KB-032（puppeteer-core + 系统 Chrome headless 自动目视法）。
- 影响范围：仅一处 CSS 窄屏体验微调 + 文档；业务逻辑、数据、上游零改动。截图存 `.tmp/ui-verify/shots/`（gitignored，不入库）。

## [未发布] — R12 关键字检索 / 统计看板 / Markdown 任务表导入（2026-10-11，平台：doubao-work / 豆包工作）

- 新增文件：
  - `packages/dsh-pm-tool/src/core/search.ts`：全库关键字检索（只读、不写盘）。对项目/任务/里程碑/风险问题/会议/汇报/交付物的关键文本做不区分大小写子串匹配，按类型分组稳定排序；`--type` 可选七类之一，非法类型中文报错。
  - `packages/dsh-pm-tool/src/core/stats.ts`：统计看板聚合（只读）。全项目或单项目：项目按状态计数、任务完成率、逾期任务/里程碑、未关闭风险按严重度、会议/汇报计数、交付物四态计数；`today` 可注入以保证验证确定性。
  - `packages/dsh-pm-tool/src/core/task-import.ts`：Markdown 任务表离线导入。解析 GitHub 风格缩进勾选清单（`- [ ]`/`- [x]`），按观测到的最小缩进步长归一化为 WBS 层级，缩进栈还原父子关系，复用 `addTask` 的编号/父级校验；`[x]` 记为已完成（progress=100）。dry-run 只投影预览不落盘。
  - `packages/dsh-pm-tool/src/commands/search.ts`、`src/commands/stats.ts`：`/pm search`、`/pm stats` 离线命令，全中文输出。
  - `packages/dsh-pm-tool/scripts/verify-r12.mjs`：专项验证（检索跨类与类型过滤、统计口径与逾期/风险聚合、导入 dry-run 不写盘与 confirm 落盘、缩进→WBS、[x] 已完成、负例与全新子进程读回）。
- 修改文件：
  - `commands/task.ts`：新增 `task import <projectId> <filePath> [confirm]` 子命令与帮助、错误类接线。
  - `index.ts`：注册 `search`/`stats` 路由与帮助、命令描述/hint；snapshot 已含全部表，无需扩。
  - `client/panel.tsx`：顶部新增「总览看板」开关，浏览器端基于 snapshot 派生跨项目统计卡片（项目总数/任务完成率/逾期项/未关闭风险）、逐项目明细与全局搜索框（与离线 `/pm search` 同口径）；颜色全部复用宿主 token。
  - `client/panel.css`：`.pm-board*` 样式（统计卡片、逐项目卡片、命中列表），容器查询窄屏单列，无硬编码 hex。
  - `scripts/verify-web.mjs`：bundle/css 契约增加 R12 界面串与 `.pm-board-projects` 断言。
- 为什么：实现需求 R12「关键字检索 + 统计看板 + 外部任务表导入」。检索/看板为只读派生视图，数据始终以各表现状为准；Web 看板与全局搜索做成浏览器端基于现有 snapshot 的派生，不新增宿主路由、不引入硬编码色（ADL-029）。Excel 导入（依赖 skill-office/LibreOffice、重）与多人实时协作（与 ADL-009 单用户本地离线定位冲突）本期裁剪（ADL-030/ADL-031）。
- 验证：`pnpm install --frozen-lockfile` 干净；`pnpm run build` 退出码 0（tsc 零错误，client bundle 152.96 kB）；**12 个** `verify-*.mjs` 全部退出码 0（新增 verify-r12.mjs）；`git diff --check` 干净；隔离 DSH_HOME + 隔离临时数据 + 随机端口 + 无 Key 真实宿主启动，存储领域打开、首页 303 种 cookie 鉴权，抓取含 `dsh-pm-tool/client.js` 的合并路由（HTTP 200，578732 B）断言含「总览看板/跨项目搜索/项目总数/任务完成率/逐项目明细」。
- 影响范围：仅新增检索/统计/导入能力与对应界面/测试，不改既有实体字段；业务数据与上游零改动。本机浏览器目视（看板卡片、全局搜索交互、窄屏）以项目所有者手动确认为准（KB-014/ADL-027）。

## [未发布] — R10 项目维度交付物台账（2026-10-10，平台：doubao-work / 豆包工作）

- 新增文件：
  - `packages/dsh-pm-tool/src/core/deliverable.ts`：交付物字段与 zod 校验（四态状态机、内嵌 `history[]` 变更留痕 schema、create/update 校验与中文错误描述）。
  - `packages/dsh-pm-tool/src/core/deliverables.ts`：离线 CRUD；创建写 `created` 留痕，状态/版本实际变化时按序追加只增留痕（支持 operator/changeNote），编号 `dlv-NNNN` 扫表续号，写操作走 `enqueueDomainWrite`。
  - `packages/dsh-pm-tool/src/commands/deliverable.ts`：`/pm deliverable add/list/get/update/delete` 五子命令，全中文输出与删除二次确认，详情倒序展示变更留痕（状态显示中文标签）。
  - `packages/dsh-pm-tool/scripts/verify-deliverables.mjs`：专项验证（CRUD、状态筛选、留痕追加规则、并发编号、写盘失败恢复、项目删除保护、0600/0700 权限、全新子进程 `--reopen` 读回续号）。
- 修改文件：
  - `core/storage.ts`：pmtool 领域注册新表 `deliverables`（**领域版本仍为 1**，KB-013）。
  - `core/projects.ts` + `commands/project.ts`：新增 `ProjectHasDeliverablesError`，有交付物的项目禁止删除并给中文提示。
  - `index.ts`：注册 deliverable 路由与帮助、命令描述/hint，`web snapshot` 增加 `deliverables`。
  - `client/panel.tsx`：新增「交付物」视图标签、交付物表格（状态筛选/搜索/变更次数列）、新增/编辑抽屉与只读变更留痕时间线、项目栏交付物计数，状态标签配色复用宿主 token。
  - `client/panel.css`：`.pm-deliverable-table` 与 `.pm-deliverable-history` 样式，submitted/accepted 状态色，无硬编码色值。
  - `scripts/verify-web.mjs`：种子数据、快照断言与 bundle/css 契约增加交付物项。
- 为什么：实现需求 R10「项目维度交付物台账，记录版本与状态变更」。dsh 原生 deliverables 绑定 agent 轮次/git 快照、不适合无 Key 离线手工台账，故复用其概念、数据层按 R7–R9 同款模式自研（ADL-028）。
- 验证：`pnpm install --frozen-lockfile` 干净；`pnpm run build` 退出码 0（tsc 零错误，client bundle 140.47 kB）；**11 个** `verify-*.mjs` 全部退出码 0；`git diff --check` 干净；隔离 DSH_HOME + 临时数据 + 随机端口 + 无 Key 真实宿主启动，存储领域打开、首页带 cookie 200，经单插件合并路由 `/plugins/??dsh-pm-tool/client.js&rev=` 抓到运行中 bundle（140500 B）断言含「交付物/筛选交付物状态/deliverable add/变更留痕/新增交付物」。
- 影响范围：仅新增交付物实体与其界面/测试，不改既有实体；业务数据与上游零改动，隔离临时数据仅含宿主 `workspace.json`。本机浏览器目视项以项目所有者手动确认为准（KB-014/ADL-027）。

## [未发布] — R9 独立复核通过并提交推送（2026-10-10，平台：doubao-work / 豆包工作）

- 改动文件：仅文档（本条及需求/进度/交接/决策/知识库等档案）；**未改动任何 R9 业务代码**——独立复核未发现缺陷，按 TRAE 交付原样接收。
- 做了什么：接手 TRAE 未提交的 R9 增量，先 `git status` 保护现场（未 pull、未覆盖、未重做），完成独立复核后随本提交一并推送 origin/main。
- 独立验证证据（命令与结果均在本机实测）：
  - 冻结安装 `pnpm install --frozen-lockfile` → Already up to date，退出码 0；
  - 构建 `pnpm run build`（tsc + 复制 css + tsdown client bundle）→ 退出码 0，无类型错误，产出 `lib/core/progress-report*.js` 与 `lib/client.js`；
  - 十个 `scripts/verify-*.mjs` 全部退出码 0，其中 `verify-reports.mjs` 覆盖自定义周期、五类异常聚合与排序、旧快照不回写/新快照更新、人工字段更新、8 类非法输入、Markdown 内容与 0600/拒覆盖/confirm、写盘失败恢复、4 并发编号、删除提示与 confirm、有报告禁删项目、全新子进程 `--reopen` 读回 5 份并续增 rpt-0007；
  - `git diff --check` 与新增文件行尾检查无空白错误；
  - 隔离 `DSH_HOME`（仓库内 `.tmp/r9-verify/`，已 gitignore）+ 隔离数据目录 + 随机端口 + 无 API Key 启动真实 `pnpm dsh --profile pm --no-open --port 0`：日志出现 `[pm-tool] 存储领域 pmtool 已打开`；带 token 首页跟随重定向 HTTP 200、无 token 401；启动清单含 `dsh-pm-tool/client.js`；抓取运行中服务实际下发的合并 client bundle（cookie 鉴权）断言含「进度汇报/筛选汇报状态/report generate/report export/固定快照/异常项/pm-report-table」。
- 边界（如实记录）：doubao-work 当前角色无 Mac 本机 GUI 驱动权限（`mac_computer_use_tool` 不支持、`computer_use_tool` 的 `cu` 不支持、`bu` 为隔离 Linux 且 loopback 不通），浅/深主题点击、786px 窄屏点击、控制台/网络的**人工目视**项无法由本侧独立复现；这些项由 ① `verify-web.mjs` 主题 token/无硬编码色/响应式契约、② 真实宿主下发新 bundle、③ TRAE 已完成的隔离真实浏览器记录（见下条与 test-cases）共同覆盖，最终以项目所有者本机手动确认为准（KB-014 / ISS-010）。
- 收尾：隔离测试服务已停止、随机端口已释放、隔离数据仅含宿主 `workspace.json`；真实 `data/` 与上游 `deepseek-harness` 无改动。
- 影响范围：R9 状态由「待验收」推进为「独立复核通过并推送」；不改变 R9 功能与数据模型。

## [未发布] — R9 固定快照进度汇报（2026-10-10，平台：trae / TRAE）

- 新增 `progress-report.ts`、`progress-reports.ts`、`progress-report-markdown.ts` 和 `commands/progress-report.ts`：实现自定义周期、固定快照、异常聚合、离线 CRUD 和精简 Markdown 导出。
- 修改 `storage.ts`、`projects.ts`、`commands/project.ts`、`index.ts`：增加 `reports` 表、项目删除保护、命令路由和 Web snapshot。
- 修改 `client/panel.tsx`、`panel.css`：新增“进度汇报”高密度表格、状态筛选、搜索、固定快照抽屉、异常列表和导出入口。
- 新增 `verify-reports.mjs`，扩展 `verify-web.mjs`；新增两份 R9 设计/实施计划，并同步需求、决策、测试、交付和接续档案。
- 原因与影响：按项目所有者确认的“自定义日期范围 + 固定快照 + 默认只含摘要和异常项”实现 R9；新增 `data/pmtool/reports/`，不修改上游。
- 验证：冻结安装、构建和十个验证脚本全部退出码 0；隔离 profile 真实浏览器验证旧快照不随任务变化、新快照反映最新状态、编辑、Markdown 导出、筛选、深色主题、786px 窄屏及重启读回。

## [未发布] — R8 会议纪要管理（2026-10-10，平台：trae / TRAE）

- 修复行动项表单固定列宽超过抽屉内容区的问题，改为两列自适应网格，窄屏退化为单列。
- 修复“保存会议”只保存会议基础字段的问题：现在会顺序保存所有已有行动项，并保存已填写但未单独点击“添加”的新行动项；任一步失败均保持抽屉打开。
- 新增 `docs/plans/2026-10-10-r8-meeting-notes-design.md`：固化完整字段、业务规则、离线命令、Web 交互、错误处理和验收标准。
- 新增 `docs/plans/2026-10-10-r8-meeting-notes.md`：给出 schema、CRUD、行动项关联、Web、回归和档案同步的文件级实施步骤。
- 新增 `src/core/meeting.ts`、`src/core/meetings.ts`、`src/commands/meeting.ts`：实现会议与稳定行动项 schema、离线 CRUD、排序、任务/问题关联和删除保护。
- 修改 `storage.ts`、`projects.ts`、`tasks.ts`、`risk-issues.ts` 及对应命令：增加 `meetings` 表、项目删除保护和被会议引用对象的删除保护。
- 修改 `index.ts`、`client/panel.tsx`、`client/panel.css`：接入 Web 快照、会议高密度表格、筛选搜索和会议/行动项右侧抽屉。
- 新增 `scripts/verify-meetings.mjs` 并扩展 `verify-web.mjs`；同步 README、测试、交付、进度、交接和知识档案。
- 更新 `docs/requirements.md` 至 v0.6，并新增 ADL-025：首版采用内嵌稳定行动项，未来通过幂等 promote 操作转 WBS 任务。
- 原因与影响：落实项目所有者选择的方案 1，并为方案 3 保持数据兼容；新增 `data/pmtool/meetings/`，不修改上游和已发布导出格式。
- 验证：冻结锁文件安装、构建和九个 `verify-*.mjs` 全部退出码 0；隔离 profile 真实浏览器 CRUD、关联、筛选、深色主题、786px 窄屏及重启读回通过。

## [未发布] — R7 风险与问题管理（2026-10-10，平台：trae / TRAE）

### 改动文件与内容
- 新增 `src/core/risk-issue.ts`、`risk-issues.ts` 和 `src/commands/risk-issue.ts`：实现 strict schema、类型专有字段约束、统一业务队列、`ri-NNNN` 编号及 `/pm risk-issue` 离线 CRUD/筛选/确认删除。
- 修改 `storage.ts`、`projects.ts`、`commands/project.ts`、`index.ts`：增加 `risk_issues` 表、项目删除保护、命令路由和 Web snapshot。
- 修改 `src/client/panel.tsx`、`panel.css`：增加风险与问题标签页、高密度表格、搜索、类型/状态筛选及右侧新增/编辑抽屉，继续跟随 dsh 原生主题。
- 新增 `scripts/verify-risk-issues.mjs`，扩展 `verify-web.mjs`；新增两份 R7 设计/实施计划。
- 更新根/包 README、AGENTS 及 requirements、decision-log、knowledge-base、issues、test-cases、delivery、progress、handoff、onboarding 等权威档案。

### 原因与影响
- 按项目所有者确认的单表模型完成 P1 的 R7；不新增插件包、不修改上游、不依赖 API Key。
- `pmtool` 领域版本保持 1，只新增 `risk_issues` 表；现有项目数据无需迁移。R4 Markdown 和整库 JSON 格式本批不升级。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm install --offline --frozen-lockfile`、`pnpm run build` 和 command/export/milestones/projects/risk-issues/storage/tasks/web 八个脚本全部退出码 0；风险问题专项覆盖 CRUD、筛选、字段组合、并发编号、失败恢复、权限、项目删除保护和全新进程读回。
- 隔离 `DSH_HOME` 和隔离数据目录真实浏览器验证：新增风险/问题、编辑关闭、类型/状态筛选、搜索、确认删除、重启读回均通过；786px 窄屏表格局部滚动，浅色/深色随宿主切换，控制台和网络无错误；临时服务已停止。
- 项目所有者随后使用真实 `pm-tool/data` 手动验证通过，并明确授权本批提交和推送。
- 首次表名使用连字符失败，已按 ISS-020 改为 `risk_issues`。

## [0.1.0] — MVP 首个可用版本（2026-10-10，平台：trae / TRAE）

- 发布 R1–R6 MVP：项目计划、三级 WBS、里程碑、可读 JSON 持久化、Markdown/整库 JSON 导出、离线命令和 dsh 顶级 Web 工作台。
- R5 Web 跟随 dsh 原生主题，项目所有者已完成手动验收；阶段 4 测试矩阵、交付说明、完整回归和真实宿主启动验证全部通过。
- 新增 `docs/releases/v0.1.0.md` 作为版本发布记录；版本边界、安装方式、验收证据和已知限制均可从仓库独立获取。
- 发布基线：包版本 `0.1.0`，Git tag `v0.1.0`；数据格式保持 `pmtool` per-record version 1。

## [未发布] — 阶段 4 测试与交付首批（2026-10-10，平台：trae / TRAE）

- 新增 `docs/test-cases.md`：建立 R1–R6 发布门禁、自动化覆盖矩阵、Web 手动用例、命令冒烟、数据迁移检查和未覆盖边界。
- 新增 `docs/delivery.md`：整理交付范围、文件清单、环境要求、构建装载、演示、备份恢复、已知限制和常见问题。
- 修改根/包 README、AGENTS、requirements、progress、handoff、onboarding：同步 R5 已验收、`9487c24` 已推送及阶段 4 MVP 测试交付完成状态。
- 原因与影响：让 MVP 可由新环境独立恢复、验证和演示；本批不改变业务代码、数据模型或上游源码。
- 验证：Node v22.23.3 / pnpm 11.28.5；冻结锁文件离线安装、构建、全部七个 verify 脚本和 profile 配置检查均退出码 0。因 TRAE 沙箱不能写真实 `~/.dsh`，按 ISS-019 复制到隔离 `DSH_HOME` 启动：插件存储领域打开，随机端口页面 HTTP 200，boot roster 包含 `dsh-pm-tool/client.js`；服务已停止。

## [未发布] — R5 所有者手动验收通过（2026-10-10，平台：trae / TRAE）

- 修改 `AGENTS.md`、`docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md` 和本档案：记录项目所有者确认 R5 手动验收通过，阶段 3 MVP 完成，阶段 4 待启动。
- 原因与影响：同步真实验收结论和下一步接续点；无代码、需求或数据结构变更。
- 验证：沿用本批已通过的构建、七项回归和真实主题切换证据；本次仅文档状态更新，执行 `git diff --check`。提交和推送仍未授权。

## [未发布] — Web 工作台跟随 dsh 原生主题（2026-10-10，平台：trae / TRAE）

- 修改 `packages/dsh-pm-tool/src/client/panel.css`：移除固定白底、飞书蓝和独立字体，读取宿主 `--dsw-alias-*`、字体、字号和圆角变量；表格、按钮、标签、输入框、概览与抽屉随宿主主题即时更新。
- 修改 `scripts/verify-web.mjs`：增加主题变量契约与禁止固定十六进制配色检查；同步进度、交接、启动快照和包 README。
- 原因：项目所有者要求与 dsh 外壳统一视觉。影响仅限客户端呈现，业务命令和 JSON 结构未变。
- 验证：macOS + Node v22.23.3 + pnpm 11.28.5；构建及 command/export/milestones/projects/storage/tasks/web 七个脚本退出码均为 0。真实浏览器从“跟随系统”切到浅色再恢复，表格与抽屉无固定白底残留，730px 根容器无横向溢出，无当前实例控制台错误。
- 未覆盖：第三方主题逐一视觉验收及其他浏览器；尚未提交、未推送。

## [未发布] — R5 Web 高密度表格工作台重设计（2026-10-10，平台：trae / TRAE）

### 改动文件
- `src/client/panel.tsx`、`panel.css`、`assets.d.ts`：参考飞书多维表格重构为顶部项目切换 + 任务/里程碑高密度表格 + 项目概览；新增状态筛选、搜索、状态分组、彩色字段标签和右侧编辑抽屉。
- `package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`：增加 `lucide-react@1.55.0`。
- `tsdown.config.ts`：增加 CSS 文本内嵌插件，并把 Lucide 图标打入动态 bundle，避免浏览器运行时找不到外部模块。
- `verify-web.mjs`：增加表格、视图标签、右侧抽屉、内嵌样式与 Lucide 无外部依赖断言。
- 新增 `docs/plans/2026-10-10-dense-table-workbench.md`，记录确认方案与实施步骤。

### 为什么 / 影响范围
- 前两版卡片式仪表盘不符合项目经理高频录入与扫描场景；新版以表格为主界面，编辑表单只在右侧抽屉出现。
- Host 命令、业务规则、JSON 数据结构均未改变，仅重构 Web 客户端呈现与局部交互状态。

### 验证
- Node v22.23.3 / pnpm 11.28.5；构建和全部七个 `scripts/verify-*.mjs` 均退出码 0。
- 真实 dsh 页面验证顶部项目切换、任务/里程碑/概览视图、任务新增与清理、右侧抽屉和 725px 工作区；表格自身横向滚动，整页无横向溢出。
- 当前构建控制台无错误；临时服务在验证结束后关闭。
- 当前改动未提交、未推送，等待项目所有者分别授权。

## [未发布] — R5 顶级 Web 项目管理面板（2026-10-10，平台：trae / TRAE）

### 改动文件
- `package.json`、`pnpm-lock.yaml`、`tsconfig.json`、`tsdown.config.ts`：增加 React 客户端类型与动态 bundle 构建、`dsh.client` manifest 和 `./client` 导出。
- `src/client/index.tsx`、`src/client/panel.tsx`：注册侧栏“项目管理”和顶级主面板，提供项目、WBS、里程碑基础操作及响应式布局。
- `src/index.ts`：新增只读 `/pm web snapshot`；所有写操作继续复用既有 Host 命令。
- `scripts/verify-web.mjs`：验证无 Key 快照、manifest 与动态 bundle 契约。
- 更新 README/AGENTS 及 requirements、decision-log、knowledge-base、issues、progress、handoff、onboarding 快照。

### 为什么 / 影响范围
- 完成 R5 MVP，并实证独立外挂包可新增 dsh 顶级 Web 页面，无需修改上游或降级到设置卡片。
- Web 端不另建业务规则，继续以 Host 命令和 JSON 存储为唯一写入路径。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build` 与全部七个 `scripts/verify-*.mjs` 均退出码 0；`git diff --check` 通过后提交。
- 临时 pm profile 的 boot roster 包含 `dsh-pm-tool/client.js`；真实浏览器无 Key完成项目新建/编辑/删除、任务新建/完成/删除、里程碑新建/达成/删除并清理数据。
- 786px 窄屏截图无横向溢出，控件对比度正常；浏览器控制台和网络检查无错误。独立本地 Playwright npm 包未安装，浏览器验证使用 TRAE 集成自动化。

## [未发布] — R4 整库 JSON 数据包（2026-10-10，平台：trae / TRAE）

- 新增 `core/backup.ts`，扩展 `core/export.ts` / `commands/export.ts` / `verify-export.mjs`，支持 `/pm export json [目录] [confirm]`。
- 数据包格式版本 1，稳定排序，不含 checks；复用 0700/0600、覆盖拒绝和原子替换。
- 环境 Node v22.23.3 / pnpm 11.28.5；构建和 command/export/milestones/projects/storage/tasks 六个 verify 脚本全部退出码 0。
- JSON 专项覆盖格式版本、稳定排序、不含 checks、可读缩进、权限、覆盖保护与源数据不变；错误日志为主动负例/故障注入。

## [未发布] — R4 单项目 Markdown 报告导出（2026-10-10，平台：trae / TRAE）

### 改动文件
- 新增 `core/report.ts`、`core/export.ts`、`commands/export.ts`：聚合三类实体、渲染 Markdown、安全写入与覆盖保护。
- 修改 `src/index.ts`：接入 `/pm export markdown`；修改 `.gitignore` 忽略默认 `exports/`。
- 新增 `scripts/verify-export.mjs`：验证内容/顺序/转义、路径、权限、覆盖拒绝、confirm 原子覆盖、空项目和失败清理。
- 更新 README/AGENTS 及 requirements、decision-log、knowledge-base、issues、progress、handoff、onboarding 快照。

### 为什么 / 影响范围
- 落实 R4 单项目可读报告；报告不进入 storage-domain，JSON 继续作为唯一数据源。
- 默认导出目录稳定定位产品仓库，不受 dsh 启动目录影响；已有文件默认不覆盖。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs`、`verify-milestones.mjs`、`verify-export.mjs` 全部退出码 0。
- 导出专项覆盖内容/顺序/转义、默认路径定位、带空格目录、0700/0600、覆盖拒绝、confirm 原子覆盖、空项目和失败清理。
- 两次测试预期错误已按 ISS-015 修正；业务错误日志均为主动负例。Web 管理界面不在本批验证范围。

## [未发布] — 固化 R5 完成前自动提交推送授权（2026-10-10，平台：trae / TRAE）

### 改动文件
- `AGENTS.md`、`docs/collaboration.md`、`docs/onboarding-prompt.md`：记录临时授权起止范围、测试门槛和 R5 手动验收要求。
- `docs/decision-log.md`：新增 ADL-019。

### 为什么 / 影响范围
- 项目所有者授权 R5 完成前在每批全量回归通过后自动提交推送；R5 完成后自动终止并通知所有者手动验证。
- 不改变功能方案确认门槛、禁止 force push 等红线。

### 验证
- 与当前 R3 收尾一起执行构建和全部 verify 脚本，全部通过后自动提交推送。

## [未发布] — R3 里程碑编辑、确认删除与任务关联收尾（2026-10-10，平台：trae / TRAE）

### 改动文件
- 修改 `core/milestone.ts`、`core/milestones.ts`、`commands/milestone.ts`：增加状态一致性、更新和 confirm 删除。
- 修改 `core/task.ts`、`core/tasks.ts`、`commands/task.ts`：支持任务关联/解除同项目里程碑，并拒绝不存在或跨项目引用。
- 扩展 `verify-milestones.mjs`、`verify-tasks.mjs`：覆盖编辑、删除保护、关联、跨项目拒绝和重启读回。
- 更新 README/AGENTS 及 requirements、decision-log、knowledge-base、issues、progress、handoff、onboarding 快照。

### 为什么 / 影响范围
- 完成 R3/R6 离线闭环；防止里程碑状态与达成日期矛盾，以及删除产生任务悬空引用。
- 数据版本与布局不变；旧记录在读盘边界保持兼容，新增/更新按新规则校验最终记录。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs`、`verify-milestones.mjs` 全部退出码 0。
- tasks/milestones 专项覆盖同项目关联、跨项目/不存在引用拒绝、状态与达成日期一致性、更新、删除预览/确认、关联删除保护和重启读回。
- 首次负例对象选择错误已按 ISS-014 修正；四条错误日志为主动故障注入。Web 界面尚未实现，不在本批验证范围。

## [未发布] — R3 里程碑增查首个纵切（2026-10-10，平台：trae / TRAE）

### 改动文件
- 新增 `src/core/milestone.ts`、`src/core/milestones.ts`、`src/commands/milestone.ts`：Milestone schema、增查业务与 `/pm milestone add/list/get`。
- 修改 `src/core/storage.ts`、`src/core/projects.ts`、`src/commands/project.ts`、`src/index.ts`：增加 milestones 表、项目删除保护与命令分发。
- 新增 `scripts/verify-milestones.mjs`：覆盖时间线排序、字段/状态/日期校验、默认值、并发编号、失败恢复、权限和重启读回。
- 更新 README/AGENTS 及 requirements、knowledge-base、issues、progress、handoff、onboarding 快照。

### 为什么 / 影响范围
- 按 R3 最窄纵切先完成里程碑新增与查询；状态继续由用户手动维护，R11 自动提醒仍不做。
- pmtool 仍为 per-record 版本 1，仅增加 milestones 表，无数据迁移；有里程碑的项目禁止删除。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs`、`verify-milestones.mjs` 全部退出码 0。
- 里程碑专项覆盖增查、时间线排序、全部状态、日期/字段校验、默认值、并发编号、写入失败恢复、项目删除保护、0700/0600 和全新进程读回。
- 首次测试断言错误已按 ISS-013 修正；四条失败日志均为主动故障注入。真实 Web 管理界面尚未实现，不在本批验证范围。

## [未发布] — R2 WBS 任务编辑、删除、移动与重新编号收尾（2026-10-10，平台：trae / TRAE）

### 改动文件
- `src/core/task.ts`、`src/core/tasks.ts`：增加更新片段校验、任务更新/删除/移动/整树重新编号及循环保护。
- `src/commands/task.ts`、`src/index.ts`：接入 `/pm task update/delete/move/renumber`、confirm 预览与中文结果；树展示改用真实关系计算缩进。
- `scripts/verify-tasks.mjs`：覆盖更新合并校验、日期清空、父任务删除保护、root/跨项目/循环移动、编号保留、显式重编号、空洞与重启读回。
- 更新根/包 README、AGENTS 及 requirements、decision-log、knowledge-base、progress、handoff、onboarding 快照。

### 为什么 / 影响范围
- 完成 R2 离线 WBS 验收闭环；结构移动与编号重建分离，避免未确认的大范围编号改写。
- 不改变数据版本和落盘布局；现有任务记录无需迁移。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs` 全部退出码 0。
- 任务专项覆盖更新合并校验、日期清空、删除预览/确认、父任务保护、root/跨项目/循环移动、移动后编号保留、显式重编号、编号空洞、并发新增、0700/0600 和全新进程读回。
- 三条写入失败日志是主动故障注入；新增的重新编号中途失败验证确认已写记录可恢复、整棵树保持原编号。真实 Web 管理界面尚未实现，不在本批验证范围。

## [未发布] — 固化任务完成后分别确认提交与推送（2026-10-10，平台：trae / TRAE）

### 改动文件
- `AGENTS.md`、`docs/collaboration.md`：把任务完成后的 `git commit` 和 `git push` 改为两个独立的显式授权项。
- `docs/onboarding-prompt.md`：将“验证后主动询问是否提交、是否推送”接入标准启动提示词和交接快照。

### 为什么 / 影响范围
- 项目所有者要求每个任务完成后由执行平台主动询问是否提交和推送代码。
- 后续任何平台在完整回归通过后也必须先停下来询问；未明确授权时保留工作区改动，不自行提交或推送。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs` 全部退出码 0。
- 覆盖命令/存储、项目 CRUD、三级 WBS、并发编号、主动故障恢复、权限和全新进程读回。
- `git diff --check` 通过；本批仅改协作规则，未执行 Web 手动交互。

## [未发布] — 固化验证后主动规划并连续推进规则（2026-10-10，平台：trae / TRAE）

### 改动文件
- `AGENTS.md`、`docs/collaboration.md`：规定任务通过完整回归后，执行平台必须主动提出下一批文件级计划，所有者确认后立即继续实施。
- `docs/onboarding-prompt.md`：把连续推进规则接入标准启动提示词和当前交接快照。

### 为什么 / 影响范围
- 项目所有者要求每个任务完成并验证后由执行平台主动规划下一步，减少重复分派和等待。
- 仅调整协作流程，不改变业务代码；后续所有平台均须遵守。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs` 全部退出码 0。
- 覆盖命令/存储、项目 CRUD、三级 WBS、并发编号、故障恢复、权限与全新进程读回；故障日志为主动注入且恢复通过。
- 未执行真实 Web 手动交互：本批仅改协作规则，无业务行为变化。

## [未发布] — 固化每个任务完成后的完整回归与结果回报要求（2026-10-10，平台：trae / TRAE）

### 改动文件
- `AGENTS.md`、`docs/collaboration.md`：新增强制规则，每个任务完成后必须执行构建、全部既有 verify 脚本及本批专项验证。
- `docs/onboarding-prompt.md`：把完整回归和逐项结果回报要求接入标准启动提示词。

### 为什么 / 影响范围
- 项目所有者要求每个任务完成后都做相关功能的完整回归测试，并输出完整验证结果。
- 后续任何平台均须遵守；任一测试失败不得标记完成或提交，最终回报不能只写笼统的“测试通过”。

### 验证
- 环境：macOS 15.6.1 arm64、Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`verify-command.mjs`、`verify-storage.mjs`、`verify-projects.mjs`、`verify-tasks.mjs` 均退出码 0。
- 回归覆盖命令与存储自检、项目 CRUD/校验/并发/重启读回、三级 WBS/关系/并发编号/项目删除保护/重启读回；两条“验证用写入失败”均为主动故障注入且恢复验证通过。
- 文档差异检查 `git diff --check` 通过；本条不改变业务代码。

## [未发布] — R2 WBS 任务增查首个纵切（2026-10-10，平台：trae / TRAE）

### 改动文件
- 新增 `src/core/task.ts`、`src/core/tasks.ts`、`src/commands/task.ts`：Task schema、三级 WBS 业务逻辑与 `/pm task add/list/get`。
- 修改 `src/core/storage.ts`、`src/core/projects.ts`、`src/commands/project.ts`、`src/index.ts`：增加 tasks 表、共享领域写队列、项目删除保护与 task 命令分发。
- 新增 `scripts/verify-tasks.mjs`：验证三级树、关系、默认值、并发编号、故障恢复、权限和重启读回。
- 更新 README/AGENTS 及 requirements、decision-log、knowledge-base、progress、handoff、onboarding 快照。
- `docs/issues-and-solutions.md`：新增 ISS-012，记录 DomainTable 无 `values()`、须用 `entries()` 的 API 边界。

### 为什么 / 影响范围
- 按 R2 最窄纵切先完成任务新增与查询，不同时引入编辑、删除、移动和重新编号。
- pmtool 仍为 per-record 版本 1，仅增加 tasks 表，无迁移；有任务的项目现在禁止删除。
- 项目所有者已手动验证 R1 update/delete 与日期/同名/confirm 功能通过。

### 验证
- `pnpm run build` 及 `verify-command/storage/projects/tasks.mjs` 全部退出码 0。
- 任务脚本覆盖至少三级 WBS、跨项目父任务拒绝、并发同级编号唯一、写盘故障恢复、0700/0600 和全新进程读回。

## [未发布] — R1 离线项目编辑、确认删除与输入防呆收尾（2026-10-10，平台：trae / TRAE）

### 改动文件
- `packages/dsh-pm-tool/src/core/project.ts`：增加更新片段 schema 与 `targetDate >= startDate` 联合校验。
- `packages/dsh-pm-tool/src/core/projects.ts`：统一写队列，增加同名检查、项目更新与删除。
- `packages/dsh-pm-tool/src/commands/project.ts`、`src/index.ts`：接入 `update` / `delete`、add/update 同名 `confirm`、删除预览及中文帮助。
- `packages/dsh-pm-tool/scripts/verify-projects.mjs`：覆盖日期、同名、更新、删除确认、权限、失败恢复和全新进程读回。
- `packages/dsh-pm-tool/README.md`、根 `README.md`、`AGENTS.md`：同步命令、规则、限制和当前状态。
- `docs/requirements.md`、`docs/decision-log.md`：更新 R1/R6 状态并新增 ADL-015 落地语义。
- `docs/knowledge-base.md`、`docs/issues-and-solutions.md`：新增 KB-016 统一业务队列模式、ISS-011 已确认重名项目更新边界。
- `docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`：同步验证结果和下一步 R2 接续点。

### 为什么 / 影响范围
- 按 ADL-012 与 requirements §5.3 收尾 R1 离线项目能力；无新增依赖、插件包、profile、数据版本或迁移，不修改上游。
- 名称 `trim` 后区分大小写精确比较；新增或实际改名同名时默认阻止，末尾 `confirm` 放行。删除不带 `confirm` 只提示，不写盘。
- 当前删除仅涉及 projects 记录；任务和里程碑加入后需补关联删除约束。仍仅支持单宿主进程写入。
- 数据版本保持 1；读盘 schema 不因新增日期业务规则而拒绝旧记录，日期关系在新增/更新写盘前校验，无需本批数据迁移。

### 验证
- macOS 15.6.1 arm64、nvm Node v22.23.3、pnpm 11.28.5。
- `pnpm run build`、`node scripts/verify-command.mjs`、`node scripts/verify-storage.mjs`、`node scripts/verify-projects.mjs` 全部退出码 0。
- 项目脚本验证增删改查、日期倒置拒绝、同名默认阻止/confirm 放行、删除预览不落盘、确认删除文件消失、0600 文件/0700 目录、并发写入、主动故障后恢复及全新进程读回更新/删除状态。

## [未发布] — 首批功能独立复核通过、推送并固化五项开发决策（2026-10-10，平台：doubao-work）

### 改动文件
- `docs/decision-log.md`：新增 ADL-012（删除 `confirm` 关键字、日期先后校验、同名默认阻止+confirm 放行）、ADL-013（R5 排在 R2/R3/R4 之后 + 顶级页面不可行时降级为卡片/区块+离线命令）、ADL-014（Node 版本口径澄清：以 nvm v22.23.3 为准）。
- `docs/requirements.md`：头部加复核后同步注记；R1 验收标准补编辑/删除 confirm、日期先后、同名规则并更新状态；R5 行补排序与降级形态；§5.3 增补项目删除/日期/同名/开发顺序四条业务规则。字段模型仍为 v0.4，未改字段。
- `docs/knowledge-base.md`：新增 KB-014（dsh Web 仅信任 loopback、拒绝 0.0.0.0、browser-trust 503、headless 为独立 profile、确定性脚本为离线回归准、真实浏览器点击须宿主机本机 GUI）、KB-015（Doubao 沙箱自带 node v22.23.2 遮蔽 nvm v22.23.3）。
- `docs/issues-and-solutions.md`：新增 ISS-010（非本机浏览器 503 / 0.0.0.0 被拒 / 部分 Agent 无本机 GUI 权限的定性与处理）。
- `docs/changelog.md`、`docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`：本条及进度/交接快照同步为「复核通过、已推送 origin/main、下一步交 trae 做 R1 收尾」。

### 做了什么 / 为什么
- 所有者授权后，把 trae 的 3 个本地提交（`b2ca50f`、`0128203`、`9dbb3f9`）**推送 origin/main**（`f9bda6e..9dbb3f9`），仓库与远程一致。
- 豆包工作对首批「项目新增/列表/详情」做了独立复核：构建与三个 verify 脚本全部退出码 0；真实 dsh Web 宿主启动确认加载插件；核验真实浏览器写出的 `p-0001/p-0002`（目录 0700、文件 0600）；用全新真实进程经同一命令处理器读回成功、无 Key 可用。结论：功能合格、建议验收。
- 所有者就复核报告的 5 个待确认项拍板（决定 2/3/4/5），按"仓库即唯一事实来源"要求立即固化，供 trae 克隆后直接照做。
- 关于决定 5（Node 版本）：复核时沙箱报告 v22.23.2，经 `nvm ls` 核实是 Doubao 沙箱自带 node 遮蔽，本机 nvm 默认实为 v22.23.3，故文档**维持 v22.23.3**（ADL-014 / KB-015）。

### 影响范围
- **仅文档与 git 推送，无任何业务代码/依赖/profile/上游改动**；不改变已推送的 3 个提交内容。
- 复核期间曾临时用 `--host 192.168.10.53` 绑定 LAN 做连通测试，服务已停止、未写入 profile；为安全 dsh 拒绝了 `--host 0.0.0.0`。
- 清理了仓库根 `.tmp/` 探测 scratch（含一个可按包 README 五条命令重建的一次性功能验证 DSH_HOME，本就 gitignore）；产品 `data/` 与受跟踪文件未受影响。
- 上游 `deepseek-harness` 工作区干净、HEAD 仍为基线 `d7432673`。

### 验证
- 推送后 `git status -sb` 显示本地与 origin/main 一致，`origin/main` HEAD = `9dbb3f9`。
- 复核证据：`pnpm run build` 退出 0；`verify-command/storage/projects.mjs` 退出 0（含约 20 类非法输入不落盘、10 并发不覆盖、写盘失败恢复、全新子进程重启读回与编号续增）；真实宿主日志 `[pm-tool] 存储领域 pmtool 已打开`；`p-0001/p-0002` 内容符合 schema、权限正确。
- 测试服务已停止，3080 端口空闲；产品仓库与上游均无意外改动。

## [未发布] — 精简豆包独立复核提示词（2026-10-10，平台：trae / TRAE）

### 改动文件
- `docs/doubao-validation-prompt.md`：删除重复的提交号、命令、验收细节和下一步技术预设，只保留复核目标、报告结构与禁止改动边界。
- `docs/changelog.md`、`docs/onboarding-prompt.md`：记录提示词改为由豆包按仓库 SOP 自行读取最新状态，避免双份信息失效。

### 为什么 / 影响范围
- 项目所有者确认豆包工作可直接读取项目文件，无需在提示词中重复仓库已有内容。
- 仅调整协作提示词，不改变代码、测试、需求或既有验证结论。

## [未发布] — 补齐真实 Web 功能验收与豆包独立复核提示词（2026-10-10，平台：trae / TRAE）

### 改动文件
- `docs/changelog.md`：补记真实宿主、浏览器 add/list/get、落盘与权限验证证据。
- `docs/progress.md`、`docs/handoff.md`、`docs/onboarding-prompt.md`：把首个项目增查增量更新为已通过真实 Web 功能验证，明确待豆包独立复核与下一步 R2 规划。
- 新增 `docs/doubao-validation-prompt.md`：可直接发送给豆包工作的完整提示词，要求独立执行自动化与 Web 验收、只读代码复核，并提交 R2 WBS 文件级计划；未经确认不编码。

### 为什么 / 背景
- 项目所有者要求不能只验证构建和脚本，还需验证真实功能；随后要求提交现有代码，并让豆包工作再做一次独立功能复核和下一步规划。

### 影响范围
- 仅新增/更新文档，不改变插件行为、依赖、profile 或数据模型。
- 浏览器验收产生 `data/pmtool/projects/p-0001.json`、`p-0002.json` 两条“浏览器功能验收”数据，位于已 gitignore 的 data 目录，按项目规则保留且不入库。
- 测试使用仓库内 `.tmp/dsh-home-functional` 作为一次性 DSH_HOME，未修改真实 `~/.dsh` 或上游文件；`.tmp/` 已被 Git 忽略。

### 验证
- 用临时 DSH_HOME 执行 `pnpm dsh --profile pm --dump-config`：可见 pm-tool、storage-domain、storage-json，root 指向 `pm-tool/data`。
- 启动真实 `pnpm dsh --profile pm --no-open`，浏览器无 API Key 验证：命令候选出现 pm；add 两次落盘为 p-0001/p-0002；list 显示 2 个项目；get p-0001 返回完整中文字段。
- 两个 JSON 与页面字段一致，projects 目录权限 0700、文件权限 0600；服务已停止，产品仓库除本次文档外无受跟踪运行产物，上游工作区干净。
- 初次自动化把参数拆成普通消息时复现 `MISSING_CREDENTIAL`，随后按 ISS-009 通过“候选中选择 pm → 同一命令后追加参数”完成验证；该现象不影响 pm 命令功能。

## [未发布] — 离线项目新增、列表与详情及持久化验证（2026-10-10，平台：trae / TRAE）

### 改动文件
- 新增 `packages/dsh-pm-tool/src/core/project.ts`：Project zod schema、类型、中文校验提示。
- 新增 `packages/dsh-pm-tool/src/core/storage.ts`：统一 pmtool 版本 1 声明，保留 checks、新增 projects 表。
- 新增 `packages/dsh-pm-tool/src/core/projects.ts`：项目增查、短 ID、同领域新增队列、读取返回副本。
- 新增 `packages/dsh-pm-tool/src/commands/project.ts`：`/pm project add {JSON}`、`list`、`get <ID>` 解析与中文结果。
- 修改 `packages/dsh-pm-tool/src/index.ts`：接入统一领域与项目命令、帮助、句柄释放，保留参数正文大小写及 ping/selftest。
- 新增 `packages/dsh-pm-tool/scripts/verify-projects.mjs`：真实插件处理器与后端的项目增查/异常/并发/全新进程读回验证。
- 修改 `packages/dsh-pm-tool/scripts/verify-command.mjs`：强化原有自检断言并关闭领域。
- 修改 `packages/dsh-pm-tool/scripts/verify-storage.mjs`：复用统一领域定义、增加落盘断言并关闭句柄。
- 修改 `packages/dsh-pm-tool/README.md`：项目命令、字段、启动和验证说明、边界及源文件目录。
- 修改根 `README.md`、`AGENTS.md`：同步当前能力、使用入口、目录和进度。
- 修改 `docs/progress.md`、`docs/requirements.md`：R1/R4/R6 标为进行中，区分本批完成与整体待办，不改变 v0.4 验收标准。
- 修改 `docs/collaboration.md`：登记 trae 首次参与日期。
- 修改 `docs/handoff.md`、`docs/onboarding-prompt.md` 文末快照：本批结果、验证边界、接续点及提交定位。
- 修改 `docs/knowledge-base.md`：新增 KB-012（写盘前显式校验、编号与新增一起排队）、KB-013（加表兼容旧记录实测）。

### 为什么 / 背景
- 项目所有者已确认最窄纵切与逐文件清单，先落实 R1/R4/R6 的项目新增和查询部分。复用 ADL-011 定稿的 per-record 布局，不建索引，不手写业务 JSON。
- 原生 put 为插入或覆盖且写盘前不调用 zod，因此业务层显式校验，并串行执行编号分配与写入，防止并发新增覆盖。结论及源码依据立即沉淀至 KB-012。

### 影响范围
- 仅现有 dsh-pm-tool 插件增加 Host 业务能力；没有新增插件包、Skill、依赖、profile 配置或上游改动。重建插件并重启 dsh 即可生效。
- 落盘 `data/pmtool/projects/<id>.json`，保留版本 1 与旧 checks 记录，无需迁移；data/lib/node_modules 不入库。
- add 使用 JSON 参数，必填名称和两个日历日期，默认描述/负责人为空、状态 planning；系统生成 ID/时间戳。同名新增产生新项目，不提供覆盖、编辑、删除。日期不自动推算，日期间业务关系未作额外限制。
- 当前仅支持单宿主进程写入；R1 编辑、R2/R3、R4 导出与 R5 Web 后续实现。首个增量完成不代表 R1/R4/R6 整体完成。

### 验证
- 环境：macOS 15.6.1 arm64、nvm Node v22.23.3、pnpm 11.28.5；同步基线 `f9bda6e`。
- 包目录 `pnpm install`、`pnpm run build`、`node scripts/verify-projects.mjs`、`node scripts/verify-command.mjs`、`node scripts/verify-storage.mjs` 全部退出码 0。
- 项目脚本：真实命令处理器新增/列表/详情、中文输出及大小写保留、22 项错误输入拒绝且已有文件不变、默认字段、10 次并发新增不覆盖、主动模拟一次写盘失败并恢复、读取副本隔离、旧 checks 兼容、可读 JSON 与目录 0700；全新 Node 进程读回 13 个项目并继续新增第 14 个。
- 项目脚本验证使用独立系统临时目录（脚本打印路径并保留），原有脚本更新 data 下自检记录；真实浏览器功能验收随后完成，证据见上方独立条目。项目命令可在 Web 执行不代表 R5 项目管理面板完成。
- 提交主题：`feat(项目): 实现离线项目新增与查询及持久化验证 [trae]`。仅本地提交，未推送。

## [未发布] — 新增跨平台启动提示词 SOP（onboarding-prompt）并接线强制读写（2026-10-10，平台：doubao-work）

- **背景**：项目所有者要求把「给 TRAE/其他 IDE·Agent 的启动提示词」固化进仓库，并作为所有协作平台的 SOP——开工前必读、任务完成后必更新。
- **改了哪些文件 / 做了什么**：
  - 新增 `docs/onboarding-prompt.md`：含强制 SOP、可整段复制的「标准启动提示词」（已对齐 requirements v0.4 / ADL-011 落盘布局与首个增量）、给所有者的使用说明、以及文末易变区「当前交接快照」。
  - 根 `AGENTS.md`：开工扫描清单加入该文件（必读）、收工步骤加入「更新交接快照」、文档地图新增行并把需求版本改为 v0.4。
  - `docs/collaboration.md`：第三节开工扫描、4.3 收工闭环、第八节新平台自检三处加入「开工前必读 / 收工后必更新快照 / 由所有者发送提示词」。
  - `README.md`：顶部 AI 接手提示与目录树加入该文件。
  - `docs/handoff.md`：第 0 节接手第一步与阅读顺序改为由所有者发送并先读该文件，KB 范围更新为 011。
- **为什么改**：让任意新平台无需口头交代即可无歧义接手，并把「最新交接上下文」固化为每次任务后强制维护的单一入口，落实仓库即唯一事实来源。
- **影响范围**：仅文档（新增 1 份 + 接线 4 份），不改插件代码与运行行为。

## [未发布] — 定稿业务实体落盘布局（ADL-011）并收敛过时文档（2026-10-10，平台：doubao-work）

- **背景**：trae 只读接手、停在开工报备（符合根 `AGENTS.md` 第 4 节），报告 3 处过时文档与存储路径待确认；项目所有者确认采用「单领域 per-record 扁平分表」布局并授权直接修正文档。
- **改了哪些文件 / 做了什么**：
  - `docs/requirements.md`：§5.1 落盘布局**定稿**——单一领域 `pmtool` 下 `projects`/`tasks`/`milestones` 三表、一条记录一个 JSON；**取消手工 index.json**（表可枚举）；项目 README 仅作 R4 导出；文档版本 v0.3 → v0.4，变更追溯补 ADL-011。
  - `docs/decision-log.md`：新增 **ADL-011**（落盘布局定稿，含理由与被否替代方案）。
  - `docs/knowledge-base.md`：新增 **KB-011**（`DomainTable.keys()/entries()` 同步枚举、业务实体布局与示例）。
  - `docs/feasibility-map.md`：旧服务名 `ctx.storage.domain` → **`ctx.storageDomain`**。
  - `docs/tech-plugin-scaffold.md`：修正 2 处错误启动命令 `pnpm dsh web --profile pm` → **`pnpm dsh --profile pm`**（第 94、124 行）。
  - `packages/dsh-pm-tool/README.md`：修正 1 处同样的启动命令（第 38 行），并补充「指定 profile 后不加 web 动词、token URL、`--no-open`」说明。
- **为什么改**：让接手平台拉到的文档与上游真实 API 一致、消除同一文档自相矛盾；存储布局在写业务代码前定稿，避免返工。
- **影响范围**：**仅文档**，不改插件代码与运行行为；R1–R6 业务功能仍未开始。（注：issues/knowledge-base/handover-archive 及 tech-scaffold 第 176 行中出现的错误命令是在**记录/讲解该错误**，按存档原则保留。）

## [未发布] — 建立跨平台可移植协作基座（2026-10-10，平台：doubao-work）

### 改动文件（新增）
- `AGENTS.md`（仓库根）：任何 AI/IDE 接手先读的入职说明与强制准则——项目是什么、仓库即唯一事实来源、多平台平等、当前进展、开工 SOP、文档地图、红线、环境命令、收工留痕。
- `docs/collaboration.md`：多方协作与同步权威规则——平台标识注册表、开工前 pull+扫描、改动后留痕闭环、需求/决策联动、知识沉淀模板、并发冲突处理（禁 force push）、新平台接入自检清单。
- `docs/knowledge-base.md`：技术知识库，播种 KB-001～KB-010（独立 tsc 构建、storage-domain 真实 API、存储三件套配置、离线命令注册、link 装载与自动激活、profile 叠加、裸 Cordis 确定性验证、Web 自动化边界、alpha 锁版本、Web 浏览器半侧）。
- `docs/handover-archive-doubao.md`：豆包工作阶段（立项→阶段 1→阶段 2→阶段 3 第 0 步）完整交接存档，含命令速查、ADL/ISS/提交索引、遗留待确认。

### 变更
- `README.md`：新增 Agent 入口提示与「仓库即唯一事实来源」声明；目录树补 4 份新文档；文档约定补多方协作条款。
- `docs/changelog.md`：头部增加平台标识与条目模板约定；`docs/progress.md`、`docs/handoff.md`：补协作基座与接手入口指引。

### 为什么 / 背景
- 所有者明确后续可能用 TRAE 或其他 IDE/Agent 共同修改仓库；需保证任何平台 clone 后仅凭仓库即可获得最新完整上下文、平等协作、知识可复用，不依赖任何平台私有对话或格式。

### 影响范围
- 仅新增文档与更新文档索引/约定，**不改任何代码与插件行为**；不影响已验收的第 0 步产物。后续所有平台开工/收工须遵循 `AGENTS.md` 与 `collaboration.md`。

### 验证
- 文档为纯 Markdown；链接均为仓库内相对路径；与现有六件套、决策/踩坑编号交叉一致。

---

## [未发布] — 第 0 步验收 / 推送 / 移交 Trae（2026-10-10，平台：doubao-work）

### 变更（文档）
- 第 0 步「打通验证」经项目所有者**验收通过**；`186fb34`、`9e5d539` 及本档案提交**推送至 origin/main**。
- `docs/handoff.md`：新增第 0 节「移交说明（给接手方 Trae）」——当前状态、阅读顺序、硬约束、起步动作、遗留待验证项；刷新提交与进度状态。
- `docs/progress.md`、`README.md`：状态改为第 0 步已验收并推送；阶段 3 业务编码与阶段 4 测试**移交 Trae、本侧暂停**。

### 原因
- 项目所有者决定后续编码/测试交由 Trae 执行；按「成果可迁移、自解释」约定，确保 clone 仓库即可无缝接续。

---

## [未发布] — 阶段 3 第 0 步「打通验证」（2026-10-10）

### 新增（最小可加载插件包 `packages/dsh-pm-tool/`，12 个入库文件）
- `package.json`：插件清单 `dsh-pm-tool@0.1.0`（private、ESM、`tsc` 构建、声明 `dsh.bundle.patch`）；peer 依赖固定 cordis `~4.0.5-alpha.1`、dsh-* `0.2.1-alpha.2`，运行时依赖 `zod`。
- `tsconfig.json`：独立 NodeNext/ESM 编译配置（不依赖 monorepo 的 tsconfig）。
- `src/index.ts`：插件入口——打开存储领域 `pmtool`（per-record，表 `checks`，zod 校验），注册离线斜杠命令 `/pm`（无参帮助 / `ping` 连通性自检 / `selftest` 写入并读回一条 JSON 记录）。
- `cordis.patch.yml`：组合包补丁，激活本插件（存储三件套由 base 组合包默认提供）。
- `locale/en.json`、`locale/zh.json`：插件标题/描述（中文「项目管理工作台」）。
- `README.md`：包用途、构建与 `link:` 装载命令、目录说明。
- `.gitignore`：忽略构建产物 `lib/` 与 `node_modules/`。
- `scripts/verify-storage.mjs`、`scripts/verify-command.mjs`：可重复的离线验证脚本（真实 Cordis + 真实 storage-json，直接运行已构建插件的 apply 与命令处理器）。
- `pnpm-lock.yaml`、`pnpm-workspace.yaml`：锁定依赖版本与 pnpm11 供应链策略（`minimumReleaseAgeExclude` 收录 alpha 包），保证可复现安装。

### 环境/配置（本机，不入库）
- 基于 web 模板派生专属 profile `pm`（`~/.dsh/profiles/pm`）；以 `link:` 绝对路径装入本插件并自动激活。
- 在 `~/.dsh/profiles/pm/cordis.patch.yml` 按 id `storage-json` 覆盖 `root` 为 `/Users/bytedance/Projects/dsh-pm/pm-tool/data`（业务数据目录，已被仓库 `.gitignore` 忽略）。

### 变更（文档）
- `docs/tech-plugin-scaffold.md`：回填第 0 步实测结果，7 项【待验证】给出结论（仅剩「第三方独立顶级 Web 页面」留待业务阶段）。
- `docs/decision-log.md`：新增 ADL-010（第 0 步装载/存储实测结论）。
- `docs/issues-and-solutions.md`：新增 ISS-005～ISS-008（put 异步需 await、裸上下文 effect 不触发、CLI 参数顺序、link peer 警告的判定）。
- `docs/progress.md`、`docs/handoff.md`、`README.md`：同步第 0 步进度、交接信息与目录树。

### 修复
- `src/index.ts`：`table.put()` 为异步写盘，命令处理器改为 `async` 并 `await put` 后再读回（初版漏 await 导致记录不落地）。

### 验证证据
- `pnpm dsh --profile pm --dump-config` 可见 `pm-tool` 与存储三件套，root 指向 `pm-tool/data`。
- 启动日志出现 `[pm-tool] 存储领域 pmtool 已打开`；Web 斜杠命令目录列出 `pm`，`/pm ping` 无 Key 返回中文 pong（有截图）。
- `node scripts/verify-command.mjs` 退出码 0：真实插件处理器跑通 ping 与 selftest，生成 `pm-tool/data/pmtool/checks/selftest.json`（人类可读、目录 0700）。

### 原因
- 开发者预览期外部插件装载链路有不确定点，先用最小插件端到端打通「独立仓库插件 → 被本地源码版 dsh 装载 → 离线命令可用 → 可读 JSON 落盘到产品目录」，再写业务功能，确保后续每步可跑可演示。

---

## [未发布] — 阶段 3 源码开发（启动，2026-10-10）

### 新增
- `docs/tech-plugin-scaffold.md`：阶段 3 开工前报备的「外部插件骨架与装载方案」——单一插件包 `packages/dsh-pm-tool/` 的文件树、storage-domain 真实 API、`link:` + 专属 profile 装载六步、影响范围、待验证清单与第 0 步验收标准。

### 原因
- 开发者预览期外部插件装载链路存在不确定点，先打通"最小插件（/pm ping + 存储自检）"再写业务功能，确保每步可跑可演示；本提交仅为方案文档，未写代码。

---

## [未发布] — 阶段 2 需求分析（2026-10-10）

### 新增
- `docs/feasibility-map.md`：dsh 现有能力 → PM 工具需求的「复用 vs 新建」可行性地图（含存储、Web UI、工具/命令、离线能力、插件装载、来源与置信度）。
- `docs/requirements.md` 升级为阶段 2 评审稿 v0.2：纳入四项已确认决策（离线优先混合模型 / 可读 JSON+Markdown 存储 / 先做 Web / 最小闭环 MVP）、R1–R12 模块与可测试验收标准、Project/Task/Milestone 数据模型、数据落盘目录约定与业务规则、非功能需求、插件分包设想。
- `docs/decision-log.md`：新增 ADL-007（需求四项产品决策）、ADL-008（MVP 技术架构路线）。

### 变更
- `docs/progress.md`：进入阶段 2，记录需求关键决策与可行性调研结论。
- `README.md`：文档索引/目录树补充 `docs/feasibility-map.md`。

### 补充（评审 v0.3，同日，依据 ADL-009）
- `.gitignore`：忽略业务数据目录 `data/`（暂不纳入 git，首次写入时自动创建）。
- `docs/requirements.md`：升级 v0.3——`data/` 不入库；里程碑提醒 R11 降为 P2（暂缓）；生成型能力 MVP 仅预留接口不实现；第九节改为「补充决策」。
- `docs/decision-log.md`：新增 ADL-009（三项补充决策）。

### 原因
- 阶段 2 需在写代码前定稿「做什么、怎么验收、站在 dsh 哪些能力上做」，并把决策与依据沉淀为可迁移档案；本阶段不产生代码。

---

## [未发布] — 阶段 1 环境搭建（2026-10-10）

### 环境
- 新增：安装 nvm（`~/.nvm`）、Node.js v22.23.3、npm 10.9.9；通过 corepack 启用 pnpm 11.28.5；向 `~/.zshrc` 追加 nvm 初始化。
- 新增：在 `~/Projects/dsh-pm/deepseek-harness` 浅克隆（depth=1，分支 master）dsh 上游源码，基线版本 v0.2.1-alpha.2（提交 `d743267388641bc76f17c45ce8b4c231aed1d32c`）。
- 完成：上游依赖 `pnpm install`（354 个工作区项目，约 1m17s，原生模块 postinstall 正常，退出码 0）。
- 完成：`pnpm run build`（原生 addon + host + 357 个 client 产物，退出码 0）。
- 完成：运行验证 `pnpm dsh web --no-open`，http://127.0.0.1:3080 启动；带一次性令牌认证后根路径 HTTP 200，页面标题 `DSH Local Build`、含 `id="root"` 与 `/assets/index-*.js`；验证后已关闭服务。
- 新增：生成 GitHub SSH ed25519 密钥；配置仓库级提交身份 Ice \<835687152@qq.com\>（不改全局）；配置远程 `git@github.com:iceAcmen/pm-tool.git`。
- 完成：项目所有者将公钥添加到 GitHub 账户 iceAcmen，`ssh -T git@github.com` 认证通过；首次提交 `12bcad3` 并 `git push -u origin main` 成功，main 跟踪 origin/main。

### 文档（本仓库 pm-tool）
- 新增：`README.md`（项目总入口、目录结构、环境依赖与启动方式）。
- 新增：`.gitignore`（忽略依赖、构建产物、密钥与系统文件）。
- 新增：`docs/requirements.md`（功能模块清单 / 优先级 / 验收标准，阶段 1 草稿）。
- 新增：`docs/decision-log.md`（ADL-001 ~ ADL-006 技术决策）。
- 新增：`docs/changelog.md`（本文件）。
- 新增：`docs/progress.md`（阶段进度流水）。
- 新增：`docs/issues-and-solutions.md`（踩坑与解决方案）。
- 新增：`docs/handoff.md`（最小迁移交接清单）。
- 新增：`skills/README.md`（Skill 沉淀目录说明）。
- 新增：`packages/.gitkeep`（占位，保留自研插件目录）。

### 原因
- 落实「从第一天起建立独立、通用、可迁移的标准 Markdown + git 成果档案」要求，档案与环境搭建同步建立。

### 尚未完成 / 已知限制
- 阶段 1 已全部完成并推送；仅待项目所有者确认后进入阶段 2 需求分析。
- dsh 处于开发者预览期（v0.2.1-alpha.2），后续升级可能有破坏性变更，已记录基线以便复现。
- 上游为浅克隆（depth=1），如需完整历史需 `git fetch --unshallow`。
- 尚未产生任何自研插件代码（属阶段 3）。

## v0.4.1-integration（未打 tag，HEAD=main）
- 副驾（PROD-20）写路径加固：ask-apply 后端守卫（重读 domain 归属/允许字段/真实日期、updatedAt 冲突检测）、in-flight 并发去重（60s TTL，**内存态重启不持久**）、写库改走既有 updateTask 领域校验；--base malformed 直接报错。
- ask 上下文补齐：当前日历锚点 today/时区、会议行动项真实字段 title/owner/dueDate、汇报/交付物/风险状态摘要；缺实体明确标「暂无」，不臆断。
- 备份恢复：applyBackup 删除前全量 record schema + 关系（projectId/parentId/milestoneId）预检，坏备份不破坏已有 domain；restoreBackup(FromContent) 新增可注入 directory（默认不变），测试备份目录隔离。
- 新增非GUI集成回归 scripts/verify-integration.mjs（真实 storage 临时目录 + spawn 子进程 reopen 读盘）。
- 状态勘误：本轮 35 个 verify + 非GUI集成通过；**真实浏览器 GUI 端到端本轮被工具能力限制未运行**（独立 GUI 工具报"SubAgent 不支持电脑操作"，未用 shell/puppeteer 绕过）；历史临时截图不等于入库可复跑；原 e2e-web-real.mjs 仅 CSV/项目记忆，关键 GUI 清单待独立验收。
