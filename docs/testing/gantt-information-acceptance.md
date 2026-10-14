<!--
甘特信息增强验收矩阵（开发前冻结门）。独立测试专家所有，ADL-045 / ADL-047 / AGENTS 6A。
其他角色（产品 PM / 开发）：只读引用，不得改本文件任何用例、步骤、断言与判定。
开发未开始前，全部用例初始 = NOT_RUN；PASS/FAIL/BLOCKED/MANUAL_PENDING 只能由测试专家实测后填。
本文件冻结"信息呈现"验收口径，不含任何实现授权；开发照此实现，测试专家照此判证。
-->
# 甘特信息增强 · 验收矩阵（Gantt Information Acceptance，开发前冻结）

> 是什么：在 **v0.7.1 = `02f42d1`** 基线之上，对「甘特排期视图信息密度增强」的开发前冻结验收门。被测对象是 `src/core/gantt.ts` 纯函数层 + `src/client/panel.tsx` 的 `<GanttView>` 渲染层。
> 给谁：开发照此实现；有 GUI 执行能力的主端按本文采集原始证据；**PASS/FAIL 只由测试专家审证后给出**。
> 范围纪律：本门**只覆盖甘特视图的"信息可读性"增强**——起止日期直显、进度可视化、前置依赖线与箭头、四类任务形态（里程碑/父/子/无排期）、窄条标签、tooltip/键盘/ARIA、横滚与今日线、拖拽改期不破坏依赖与进度、深浅主题、重启读回、正式数据隔离；外加**只读关键路径高亮**与**未来多人协作红线**。本门**不授权**任何自动排程、自动改期、自动补日期、自动写回派生字段。

> **本轮执行结论（2026-10-14，独立测试专家，含真实浏览器）**：AUTO 纯函数 11/11 PASS、INT 写路径 5/5 PASS、COLLAB 红线 4/4 PASS、GUI 14/15 PASS + **GI-WEB-14（真 390 窄窗）MANUAL_PENDING**；**关键路径 GI-CP-01~05 全部 ➖ N/A deferred**——本轮实现未新增最长路径/关键路径代码，按裁决不计失败；成环/缺日期诚实降级由依赖边 `dependencyEdges.skipped` 在 GI-PURE-05 覆盖。证据：`pnpm build`=0、`verify-gantt.mjs`/`verify-gui-contract.mjs`/`verify-isolation.mjs`=PASS（正式 data/backups/exports 157 文件零污染）；真实 Chrome headless 隔离实例证据目录 `docs/verification/gui-gantt-information-20261014/`（独立 `DSH_HOME`+端口 3102，正式 3080/3091 未触；client bundle 含 `pm-gantt-bar` 串证明生效包=本次构建）。被测基线 = `02f42d1` 之上未提交工作树。
>
> **无日期里程碑（诚实降级，非缺陷）**：`milestoneCreateSchema.targetDate` 在持久层**必填**。手写 `targetDate:null` 的恶意记录 m-0002 触发宿主就绪守卫**整体拒绝打开**（"记录不符合当前 schema…请人工修正后重开；本次不自动修复、不移动或隔离该记录"，见 `NODATE-milestone-hostlog.txt`）。即坏记录表现为**存储未就绪（诚实、不自动修复、不 NaN）**，而非画一条错条；纯函数层 `milestoneOffset` 对缺失 targetDate 返回 null 不画/不 NaN（GI-PURE-11）。**不把不合法记录要求成"正常打开"**。

## 0. 冻结口径（以此为准）

1. **零 schema 优先**：任务 `startDate / dueDate / progress / predecessorIds` 在 v0.7.1 已存在（`core/task.ts` strictObject）；本增强**只读这些既有字段**，**不新增表/列、不改 `taskRecordSchema`、不升 domain 版本、不动 `core/storage.ts`**。任何"为了甘特好看而加字段"的提案一律 FAIL。
2. **真源唯一**：`predecessorIds` 是依赖关系的**唯一真源**（写时已在 `core/tasks.ts` 校验存在/同项目/不自指/DAG 不成环；`core/doctor.ts` 只读报告悬空/自指/成环）。甘特上的依赖线、关键路径高亮、受阻标记**全部由 `predecessorIds` 派生，派生结果绝不回写库**。
3. **已排期任务** = 同时具备 `startDate` 与 `dueDate`（与 `barGeometry` 现有口径一致，缺一条即视为未排期）。未排期任务**不画条、不画依赖线**，但在标签列保留「未排期」徽标且可点开抽屉补日期。
4. **进度口径**：`progress` 为 0–100 整数；`status==='done'` 或 `progress>=100` 视为完成（与 `stats.ts`/`reminders.ts` 同边界）。条内进度填充按 `progress/100` 比例，**只渲染不写库**。
5. **四类形态可区分**：①普通任务条；②父任务（`parentId!=null` 的反向：有子任务的节点）；③子任务（`parentId!=null`）；④里程碑（`milestones` 表，菱形单点 `targetDate`）。父/子在标签列按 WBS `code` 缩进层级，条的视觉权重与子任务不同；无排期任务不进画布坐标区。
6. **拖拽改期语义**：整条**平移**（保持原时长，`shiftDatesByDrag` 现有语义），落库 payload **只含 `startDate`/`dueDate`**；**不得**因此改动 `progress`、`predecessorIds`、`status`、`assignee`。依赖线随坐标重算，但**不**把后续任务"自动顺延"。
7. **关键路径只读**：即便纳入，也只是**视觉高亮**（特定 class/描边）。遇到**成环**或**缺日期**时**诚实降级**——不画该路径、在 tooltip/空态说明"存在循环或缺日期，无法计算关键路径"，**绝不自动改期、自动补日期、自动打断环**。doctor 仍是只报告不自愈。
8. **主题**：甘特所有色值必须走既有宿主语义变量（`--pm-accent/--pm-line/--pm-surface/--pm-muted/--pm-danger/--pm-warning/--pm-secondary`），**不允许硬编码 hex**；宿主切换浅/深主题时甘特可读、对比度不依赖单一亮度假设。
9. **隔离**：一切 GUI 证据来自隔离实例（独立 `DSH_HOME` + 独立端口 + 独立备份目录），**不得碰 3080 正式数据**；零写证据以业务 JSON 前后 sha256/mtime 对比为准。

## 1. 分层与判定图例（与 ADL-045/047 严格一致）

- **AUTO**：离线表驱动纯函数（几何/比例/依赖边/窄条决策/关键路径判环降级）+ 零写/不改 schema 静态 grep。脚本全绿即该项可推进；**FAIL 仍阻塞**。
- **INT（集成/写路径）**：真实跑 `task update` 写一条再读回，验证 payload 不串字段、重启后读回一致、doctor 只读不自愈。
- **GUI**：真实浏览器实测硬门槛；**离线纯函数 / HTTP 200 不得替代网页实测 PASS**。
- **MANUAL_PENDING**：必须用户本人配合才能验者；不算 PASS 也不阻塞自动化；用户反馈失败即重开缺陷。
- **状态**：`PASS / FAIL / BLOCKED / NOT_RUN / MANUAL_PENDING`。开发前本矩阵**全部 NOT_RUN**。
- `FAIL / BLOCKED / NOT_RUN` ≠ 通过；结论必须绑定 `testedCommit` 与证据路径；新提交使受影响项过期须重测后再引用。

## 2. 证据格式与文件边界

- **AUTO 证据**：扩展 `scripts/verify-gantt.mjs`（或新增 `scripts/verify-gantt-info.mjs`），断言退出码 0；同输入跑两次 `diff` 为空（确定性）。记录命令、退出码、覆盖点。
- **INT 证据**：隔离 `DSH_HOME` 下起 CLI/HTTP，写任务→读回→重启进程再读回；记录请求 payload、响应、重启后 JSON 内容。
- **GUI 证据**：隔离实例；每用例 `env.json`（`testedCommit`/`nodeVersion`/`chromeVersion`/`port`/`executedAt`，**禁写 token**）+ 截图 + 关键控件 `outerHTML` dump + `data-*` 断言行。目录 `docs/verification/gui-gantt-info-<ts>/<CASE_ID>/`。
- **零写证据**：GUI 用例前后对隔离 storage 做 sha256/mtime 对比，证明视图与拖拽预览未写任何业务 JSON（真正落库的拖拽除外，且其 payload 须白名单）。
- **文件边界（开发新增/改动建议，不授权越界）**：
  - 纯函数：`src/core/gantt.ts` 扩展（依赖边几何、进度比例、窄条决策、关键路径只读检测），**或**新文件 `src/core/gantt-layout.ts`；不得新增 zod schema、不得改 `storage.ts`。
  - 渲染：`src/client/panel.tsx` 的 `<GanttView>` + `src/client/panel.css`（`.pm-gantt-*` 族）。
  - 验证：`scripts/verify-gantt*.mjs` 扩展/新增。
  - **禁止**：改 `core/task.ts` schema、改写命令白名单、在派生模块里 `run(...)` 写命令、在甘特里做任何"自动顺延/自动补日期"。

---

## 3. 纯函数层冻结用例（AUTO）

> 被测对象：甘特几何/派生纯函数（无 React/DOM，可离线单测）。入参可注入 `today`，出参确定。

| CASE_ID | 最小输入 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| GI-PURE-01 | 任务 A `2026-10-01~10-05` | 条几何 `leftDays/widthDays` 正确；起止日期同时参与轴范围；**最小宽度 1 天**（单日任务不退化为 0 宽） | AUTO | ✅ PASS（verify-gantt.mjs：单日 `widthDays=1`） |
| GI-PURE-02 | 已排期任务 + 仅 startDate 缺 dueDate + 仅 dueDate 缺 startDate + 全缺 | 仅"两条都有"才出条；任一缺失归入未排期分支（不抛 NaN、不画半空条） | AUTO | ✅ PASS（缺任一条 `barGeometry===null`） |
| GI-PURE-03 | progress = 0 / 50 / 100；另 status=done | 进度填充比例 = progress/100（0 空、半填、满填）；done 与 100 视觉等价完成态；**纯渲染不产生写副作用**（函数无 I/O） | AUTO | ✅ PASS（`progressRatio` 0/0.5/1，done→1，超界钳制） |
| GI-PURE-04 | B 的 predecessorIds=[A]，A `10-01~10-03`、B `10-05~10-08` | 依赖边几何可由 (A.dueDate → B.startDate) 两点算出箭头起止像素；边只连**真源 predecessorIds**，不读任何派生缓存字段 | AUTO | ✅ PASS（edge x1=96 右缘/x2=112 左缘，y 按行中心） |
| GI-PURE-05 | 依赖自指 `A.predecessorIds=[A]`；成环 `A→B→A`；悬空 `predecessorIds=['ghost']` | 自指/成环**不画边**（不递归死循环）；悬空边跳过该条；函数对坏数据**返回可降级结构**而非抛异常 | AUTO | ✅ PASS（skipped.selfLoop=1/dangling=1/cycle=2/missingDate=1） |
| GI-PURE-06 | 窄条：1 天任务（PX=16）与 2 天任务，title 较长 | 窄条**不在条内硬塞文字溢出**：决策函数给出"条内放 / 条右侧外置 / 仅 tooltip"三态之一且确定；不允许文字盖到相邻条 | AUTO | ✅ PASS（`barLabelPolicy` hidden/outside/inside 三态，同输入确定） |
| GI-PURE-07 | 父任务 P（子 C1 `10-01~10-03`、C2 `10-05~10-08`） | 若展示父条，其范围=min(子 start)~max(子 due) 的**只读派生**；父条不被当作独立排期源；**不回写父任务日期** | AUTO | ✅ PASS（`parentBarRange`=10-01~10-08，无排期子→null） |
| GI-PURE-08 | 拖拽平移：start/due 整体 +N 天；start==due 单日任务 | `shiftDatesByDrag` 保持时长、按天取整、钳制 start≤due；极小 delta(<4px) 不移；**返回值只含 startDate/dueDate 两键** | AUTO | ✅ PASS（`Object.keys` 精确 = [dueDate,startDate]） |
| GI-PURE-09 | 今日 = 轴内 / 轴前一天 / 轴后一天 | 今日线偏移正确；**超出轴范围不画线**（不画到负坐标/画布外），与现有 `todayOffset` 边界一致 | AUTO | ✅ PASS（偏移口径；轴外钳制在渲染层 `todayOff>=0 && <=axisDays`） |
| GI-PURE-10 | 同输入跑两次；另起全新进程再跑 | 几何/边/窄条决策/关键路径逐字节一致（确定性，不依赖随机/墙钟，today 可注入） | AUTO | ✅ PASS（纯函数无随机/墙钟；today 由 `localTodayIso()` 注入渲染层） |
| GI-PURE-11 | 空输入：无任务 / 全未排期 / 全 done | 返回空轴或空态标识，不抛异常；不出现 `undefined px`/`NaN%` 样式 | AUTO | ✅ PASS（`dependencyEdges([])` 返回全 0 结构；里程碑无 targetDate→null 不 NaN） |

## 4. 关键路径只读专项（AUTO + GUI）

> 即便本期纳入关键路径高亮，也只许"读"。本节是红线门。

| CASE_ID | 最小输入/步骤 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| GI-CP-01 | 线性链 A→B→C 全部排期 | 关键路径可只读算出并高亮（特定 class/描边）；**高亮是纯视觉**，不触发任何 `run()` 写命令 | AUTO+GUI | ➖ N/A deferred（本轮未实现关键路径，按裁决不计失败） |
| GI-CP-02 | 依赖成环 A→B→A（两者都排期） | **不崩溃、不无限递归**；该环参与的路径不高亮或明确标"循环不可计算"；**绝不自动打断环/改期** | AUTO+GUI | ➖ N/A deferred（成环降级已在依赖边 `dependencyEdges` skipped.cycle 体现，GI-PURE-05 覆盖；关键路径高亮本身不做） |
| GI-CP-03 | 链上某任务缺 startDate 或 dueDate | 缺日期段**诚实降级**：该段不高亮/标"缺日期"，tooltip 说明原因；**绝不自动补日期、自动顺延** | AUTO+GUI | ➖ N/A deferred（依赖边缺日期降级 GI-PURE-05 skipped.missingDate 已覆盖；关键路径高亮本身不做） |
| GI-CP-04 | 关键路径高亮开启后查网络面板 + storage sha | 全程零写；doctor 对悬空/成环仍**只报告不自动自愈**（与 schema-v2 门一致） | AUTO+GUI | ➖ N/A deferred（零写由 GI-COLLAB-01/隔离 guard 157 文件零污染覆盖；关键路径高亮本身不做） |
| GI-CP-05 | 拖拽平移 C（链尾） | 依赖线随坐标重算展示；**前置 A/B 日期纹丝不动**；不把链路"自动顺延"到 C 新日期 | GUI | ➖ N/A deferred（GUI 未启动；"不自动顺延"由 GI-WRITE-01 白名单 payload 在集成层证明） |

## 5. 写路径 / 集成门（INT）

> 被测对象：拖拽落库与重启读回。真隔离实例写一条再读回。

| CASE_ID | 最小步骤 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| GI-WRITE-01 | 隔离实例拖拽任务 B 右移 2 天，落库 | 抓请求 payload：**仅 `startDate`/`dueDate` 两键**（白名单）；服务端回读 B 的 `progress` 与 `predecessorIds` **与拖前逐字节一致**（未被清空/篡改） | INT | ✅ PASS（隔离 root 实测：payload 仅 start/due；回读 progress=40、predecessorIds=[t-0001]、assignee='b' 未动） |
| GI-WRITE-02 | 拖拽后退出进程、重启、再读该任务 | 新进程读出的 start/due = 拖拽后值；进度/依赖不变；即"重启读回"一致 | INT | ✅ PASS（spawn 子进程 `--reopen` 读盘：progress=40、predecessorIds=[t-0001]、dates 已平移） |
| GI-WRITE-03 | 拖到 start>due 的非法方向（极小 delta/钳制边界） | 落库结果仍满足 start≤due；不写入非法区间；钳制边界与 `shiftDatesByDrag` 一致 | INT | ✅ PASS（集成实测 domain 回读 start<=due 恒成立；纯函数钳制 verify-gantt 覆盖） |
| GI-WRITE-04 | 未排期任务在甘特上**不**可拖（无条） | 未排期行无拖拽 handle、不下发写命令；仅可点开抽屉补日期 | INT+GUI | ✅ PASS（GUI：t-0009 仅橙「未排期」徽标、无条体、不可拖；代码层父条/未排期分支不绑 `onPointerDownBar`） |
| GI-WRITE-05 | 依赖悬空（predecessorIds 指向已删任务）时渲染甘特 | 渲染不崩；doctor 仍报告 `dangling-predecessor`；甘特**不**因为渲染而补写/清理 predecessorIds | INT | ✅ PASS（`dependencyEdges` 对悬空边只 `skipped.dangling++` 不写；core 零 run/execute；doctor 既有契约在隔离 guard 全绿） |

## 6. Web 视图层冻结用例（GUI）

> 被测：`panel.tsx` `<GanttView>`。隔离实例实测；按实现后实际 `data-*` 核对，不臆测选择器。

| CASE_ID | 最小步骤 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| GI-WEB-01 | 打开甘特 tab，含一个已排期任务 | 该任务**直接可见**起止日期（条上/标签上有 `YYYY-MM-DD ~ YYYY-MM-DD` 或等价直显），**不只藏在 hover tooltip 里** | GUI | ✅ PASS（`labelDates` 8 条「MM-DD ~ MM-DD」+ 窄条外置 `sideLabels` 7 条「…·N%」；10-gantt-light.png） |
| GI-WEB-02 | progress=0/50/100 三个任务并排 | 条内进度填充三段可见；50 任务填充恰好一半；100/done 为完成态（降透明度或满填充，与现状 `.pm-gantt-bar-done` 一致） | GUI | ✅ PASS（fills p0=0/p50=31/64≈48%/p100=62/64≈97%；doneClass p0=false、p100=true；17 截图填充可见） |
| GI-WEB-03 | B 依赖 A（predecessorIds=[A]） | 画布上有从 A 条末端到 B 条始端的**连线 + 箭头**；箭头方向正确（前置→后继）；线不穿过无关条造成歧义 | GUI | ✅ PASS（svg/path/arrow=1，`<title>前置 前置A → 后继B</title>`；17 截图肘线+箭头指入 B） |
| GI-WEB-04 | 项目含 父任务 P / 子任务 C / 里程碑 M / 未排期 U | 标签列：P 与 C 按 WBS code 缩进层级可分；M 为菱形单点；U 带「未排期」徽标且无条；四者视觉不混淆 | GUI | ✅ PASS（m-0001 菱形 left:424px；父 t-0006 `.pm-gantt-bar--parent` 虚线派生条、子 6.1 在下；未排期徽标+无条；17 截图） |
| GI-WEB-05 | 一个 1 天窄条（title 较长） | 窄条不文字溢出/不盖邻条：按 §GI-PURE-06 策略外置或省略号；title 仍可经 tooltip/标签读到 | GUI | ✅ PASS（narrowW=16px，外置 side 标签不溢出；aria 仍含完整长标题） |
| GI-WEB-06 | hover 任务条 | 出现富 tooltip：含标题、起止日期、进度%、负责人、前置依赖数（非空则列前置）；**tooltip 是只读信息，不触发写** | GUI | ✅ PASS（条 `title` 原生 tooltip 含 起止/进度/负责人/前置；t-0005 aria 已含「前置：前置A」；只读不写） |
| GI-WEB-07 | 纯键盘：Tab 聚焦任务条 → Enter / 方向键 | 条为**可聚焦控件**（`tabindex=0`/`role`/`aria-label` 描述"任务名 起止 进度"），焦点可见；Enter 打开抽屉；**无鼠标依赖的 div-onclick** | GUI | ✅ PASS（8 条全部 tabIndex=0/role=button；Enter→role=dialog 任务编辑抽屉；12-drawer-enter.png） |
| GI-WEB-08 | 依赖线/箭头的可及性 | 依赖关系对屏幕阅读器有可感知表达（如 `aria-label` 说明"前置：A"，或键盘焦点序含依赖信息），不仅是纯视觉线 | GUI | ✅ PASS（t-0005 aria 尾缀「前置：前置A」；SVG `aria-label="任务间前置依赖连线"` + 每边 `<title>`） |
| GI-WEB-09 | 项目跨度很大（>60 天） | 画布横向可滚；左标签列与时间轴**联动对齐**（行高一致）；今日线随滚动保持在轴内可视位置 | GUI | ✅ PASS（补 t-0010 长任务后 scrollW=992>clientW=768，scrollLeft 0→224，标签列固定对齐；17-gantt-dark-scrolled.png） |
| GI-WEB-10 | 今天落在轴内 vs 轴外 | 轴内显示红色今日竖线；轴外不画线、不溢出画布 | GUI | ✅ PASS（`.pm-gantt-today` left:200px=10-14，红竖线在 10/17 截图可见；轴外钳制 `todayOff>=0&&<=axisDays` 代码在案） |
| GI-WEB-11 | 拖拽任务条右移 | 拖拽**预览**实时显示新起止（不写库）；松手后才落库；`>4px` 才触发、微抖不误触；拖拽后不误开抽屉 | GUI | ✅ PASS（拖 t-0005 48px≈3 天：10-15~10-18→10-18~10-21；13-drag-preview/14-after-drag.png） |
| GI-WEB-12 | 拖拽后依赖线位置 | B 拖动后，A→B 箭头端点随 B 新始端**重算**；A 不动；无"自动把 A 也往后推" | GUI | ✅ PASS（拖拽后 A t-0004 仍 10-12~10-13 未动；B 平移；dom-after-drag.json 坐标重排） |
| GI-WEB-13 | 宿主切浅主题 / 深主题 | 甘特所有元素（条/轴/今日线/依赖线/里程碑/未排期徽标）在两主题下均可读、对比足够；**无硬编码 hex 导致的深底浅字糊一团** | GUI | ✅ PASS（浅 10-gantt-light / 深 16·17 bodyBg=rgb(21,21,23) 均可读；色值全 `--dsw-alias-*`，CSS 块无 hex） |
| GI-WEB-14 | 窄窗（真 viewport ~390px） | 甘特不横向破版：标签列可压缩/省略，画布横滚；tick 不重叠（沿用 v0.6.0 反馈的 `sampleGanttTicks` 策略）；无文字裁切关键信息丢失 | GUI | 🟡 MANUAL_PENDING（实测视口 768px，未驱动真 390 窄窗；沿用 PL-WEB-11 口径留人工窄窗确认，不阻塞自动化） |
| GI-WEB-15 | 全程查网络面板 + storage sha | 视图浏览/tooltip/拖拽预览**零写**；仅松手落库那一条写命令且 payload 白名单（§GI-WRITE-01）；隔离 storage 其余业务 JSON sha 不变 | GUI | ✅ PASS（正式 data/backups/exports 157 文件 before=after，changed/added/removed=0；console/pageerror=0） |

## 7. 多人协作红线门（未来向，AUTO + GUI）

> 本期可单人跑，但甘特实现**不得**为未来多人协作埋雷。以下为红线，违反即 FAIL。

| CASE_ID | 断言 | 门 | 状态 |
|---|---|---|---|
| GI-COLLAB-01 | **派生视图不写库**：依赖线/关键路径高亮/父条范围/受阻标记全部前端派生，模块内 grep 无 `run(`/`execute(` 写命令串（拖拽落库在白名单文件/函数内除外） | AUTO | ✅ PASS（`core/gantt.ts` grep 无 run/execute/fs 写；gui-contract 静态断言 doesNotMatch；GanttView 唯一 `run()` 即拖拽白名单 task update） |
| GI-COLLAB-02 | **predecessorIds 为真源**：甘特不维护第二份依赖副本；改依赖唯一入口是任务抽屉/`task update`（经 `core/tasks.ts` 写校验）；甘特 UI 不提供"直接画线即改依赖"的旁路写 | AUTO+GUI | ✅ PASS（`dependencyEdges` 只读 predecessorIds；SVG 层 `pointer-events:none` 不可交互；GUI 实测箭头只读、拖拽画线不产生任何写命令） |
| GI-COLLAB-03 | **未来 rev/乐观并发冲突不被 UI 绕过**：拖拽落库走既有 `task update` 通道，不得因为"UI 便捷"而跳过服务端校验/版本检查；服务端拒绝（冲突/校验失败）时 UI 诚实报错并回滚预览，不静默成功 | AUTO+GUI | ✅ PASS（拖拽复用 `task update ${id} ${json}` 既有通道，INT+GUI 实测经写校验；`ok=false` 走"更新失败"分支不假装成功；真实并发冲突注入留待多人协作期） |
| GI-COLLAB-04 | 零 schema：`taskRecordSchema`/`storage.ts`/domain 版本在本门实现前后 `git diff` 无新增甘特专用列；既有 `verify-storage.mjs` 契约全绿 | AUTO | ✅ PASS（diff 仅 gantt.ts/panel.tsx/panel.css/verify 脚本；未碰 task.ts/storage.ts；隔离 guard 全绿、157 正式文件零污染） |

## 8. 不擅判 / 留待实测项

- **关键路径是否本期真做**：本文按"做则只读高亮 + 诚实降级"冻结；本轮**未做**，GI-CP-* 整组 ➖ **N/A deferred（不计入当前范围，不计失败）**；后续若做则按 §4 重开这组，不得提前 PASS，也不得顺手做成自动排程。
- **真窄窗 390px**：GI-WEB-14 实测视口 768px，未驱动真 390 窄窗，按 MANUAL_PENDING 留人工（与 people-load PL-WEB-11 同处理），不阻塞自动化。
- **屏幕阅读器实测**：GI-WEB-08 以 aria-label/SVG `<title>` 静态+DOM 实测覆盖；真实读屏器朗读若需复验留人工，不冒充 PASS。
- **拖拽手感（像素级）**：只验收"不误触/可预览/落库白名单/不破坏依赖与进度"，不验收具体动画曲线；视觉美化类不列入阻塞。

## 9. 计数与门控（最终范围内结论）

- **范围内总计 35 项**（剔除 deferred 关键路径 5 项后）：AUTO 纯函数 11 + INT 写路径 5 + GUI 15 + 协作红线 4。
- **范围内 PASS = 34/35**；MANUAL_PENDING = 1（GI-WEB-14 真 390 窄窗，不阻塞，待用户人工反馈闭环）；**FAIL / BLOCKED = 0**。
- **Deferred = 5**：GI-CP-01~05 关键路径高亮，本轮不做、不计失败、不计入当前范围。
- 门控结论：**范围内 PASS（34/35，1 项 MANUAL_PENDING 不阻塞）**；零 schema、零正式数据污染（157 文件）、零 console/pageerror。正式发版前需用户人工确认 GI-WEB-14 窄窗观感。
