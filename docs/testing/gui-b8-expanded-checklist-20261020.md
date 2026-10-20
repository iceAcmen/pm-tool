# Main GUI 扩展采证清单（B8 全路由 + B2/B3/B4/U5/Oil）· 2026-10-20

> **状态（2026-10-20）：B8 打包历史 FAIL1/FAIL2 均闭环；当前无权威启动候选（fix3/084528 已被 Main 后续 B4 源码改动取代，**不发布其启动命令、勿启动**）；GUI 其余路由 NOT_RUN 归 Main 采证。**
> - FAIL1（已修）：冻结包漏交付 `dsh.bundle.patch` 包内补丁 → ENOENT。
> - FAIL2（已修）：宿主入口 `require('./client.schemas.js')` missed module table；内联同步 zod 块后仅留 editor/formula-expr 的 `require.async`。
> - 候选状态：fix2/083110、fix3/084528 均为历史记录，均被后续改动取代；fix3 --check 虽 exit0 但不具发布效力，**不在此给出启动命令**。
>
> **Main 已采证 GUI 事实（权威记录，非 QA 自证）**
> - **B4（run-20261020-083515:3191）**：resize handle 为 20×20 块；卡片高度 468→372；刷新重启后持久化为 canonical h8；原生 200% 视口 450、scrollWidth=450、按钮可用。
> - **B6（run-20261020-082503:3190）：GUI PASS**（rpt-0002，excerpts 含 t-0001/pl-1/rv-2 冻结正文，详情安全 Markdown/作者日期/复合来源）。
>
> **QA 立场**：业务静态门独立转绿（U5 12/12、records 37/37、B7 投影 3/3）；QA **不启服务/不开浏览器、不冒 GUI PASS**。本清单待新权威 frozen candidate 后再由 Main 执行、QA 独立判证。
> 环境：待新权威固定 RUN（当前无；fix2/fix3 均勿启动）；新建空测试项目 P，不写正式数据；每条记录 route→state→input→存储 diff→截图→console。

## 0. 前置记录（Main）
- beforeRun 记录 `lib/client.js` sha256（frozen `2238c1d9…`，1411684B）与 `lib/index.js`（`4cfd4421…`，23125B）；after 另存。
- 全程 console 0 error；失败保留输入、不清空白屏；成功有可见 toast（did it work / what changed / next）。

## 1. B8 全路由冒烟（12 路由，逐个进入）
| # | 路由 | 必见 | 记录 |
|---|---|---|---|
| R1 | dash（BoardBento 16 卡） | 16 卡全渲染、无空白卡、RGL 可拖缩、历史/响应式不报错 | route/截图/console |
| R2 | overview | 总览统计/里程碑·交付物时间线、下一节点横幅 | 同上 |
| R3 | tasks | 任务列表、新建/编辑抽屉、筛选切换项目不串数据 | 同上 |
| R4 | gantt | 条形按日期排、依赖/日期不重叠断裂、390 无横滚 | 同上 |
| R5 | milestones | 里程碑按日期升序、dot 状态色、中文 pill、at_risk 风险提示 | 同上 |
| R6 | risk-issues | 风险/问题列表、矩阵、新建可保存 | 同上 |
| R7 | people | 人员负载视图、负载分布可读 | 同上 |
| R8 | meetings | 会议列表、决策/行动项、新建保存 | 同上 |
| R9 | reports | 汇报列表、周期选择、预览→存独立摘录、源日志改动不改已存 | 同上 |
| R10 | deliverables | 交付物列表、状态分组、搜索命中 note/milestoneId（见 §5） | 同上 |
| R11 | okrs | OKR 表单注入、命令精确、busy/取消零写 | 同上 |
| R12 | habits | 习惯表单注入、共享 listbox 键盘、取消零写 | 同上 |
- 响应式抽测：390 窄屏无外壳二维横滚、标签不裁切；200% 原生缩放控件不断裂。

## 2. B2 统一 ops 面板（tasks 抽屉）
- **E1 信封单层**：提交网络负载为 `draft:{attachmentOps,progressOps}` 单层，非双层 `envelope.draft`；edit basic + ops 合并为**单条** task update。
- **E2 create 别名**：新建任务 add 携 `c-n` 别名；noops 时省略 draft 键。
- **E3 dirty 基线**：未改字段按 ESC/scrim/X 直接关层不弹确认；dirty 取消弹 `confirmDanger`，确认放弃/取消保留（O4 同口径）。
- **E4 成功重置**：成功提交后 onSaved 关层、组件重置；失败 `commandAccepted=false` **不关层、保留输入**、错误就近可见。
- **E5 隔离**：既有 repo 分支不受 ops 影响；旧即时编辑器无挂载点、无双写。

## 3. B3 暂存上传 / 下载
- **S1 双 flag 门**：`stageEnabled = assetUpload && stageCancel`，缺一不显示上传入口。
- **S2 取消零写**：选文件后取消（cancel）→ 临时目录与 DB 均零残留（无文件、无记录）。
- **S3 成功提交**：服务成功返回后才置 submitted；reconcile 对已 finalize 暂存**不再发 DELETE**；不产生破坏性最终资产。
- **S4 卸载/StrictMode**：组件卸载 abort 在途上传；async catch 不在已卸载组件 setState；StrictMode 首次清理在交互前（rowsRef 空）零 DELETE。
- **S5 下载**：下载带鉴权（401/403 不泄）、`nosniff`、`no-store`，RFC5987 文件名 disposition。
- 注：当前 helper 为 direct attach quickmanage；staging/finalize UI 待后续，本批不审。

## 4. B4 项目看板（dash 项目级）
- **P1 范围隔离**：切换项目，tasks/milestones/riskIssues/meetings/reports/deliverables/okrs/habits 全按 projectId 过滤；`fileAssets:{}` 清空，无跨项目泄漏。
- **P2 回退链**：byProject > legacy（只读）> PROJECT_DEFAULT（7 卡）；不读个人 user、绝不写/重置 legacy。
- **P3 项目隔离保存/重置**：项目级 save/reset 只写/删项目 scope；全局 dashboard_user 与 legacy 不受影响。
- **P4 旧布局不重置**：既有用户布局保留，仅全新用户落新默认；sanitizeLayout 归一不白屏。

## 5. U5 汇报 / 交付物
- **U5-1 report 来源条件**：新建可选 manual/session；session 必填非空会话 ID，manual 不校验；编辑态只读、update 不带 source（不可改）。
- **U5-2 导出三档**：Markdown/Web HTML/plain 均带关联里程碑 + 备注；恶意 note 转义（`&lt;img`，无裸 `<img src=x>`）；plain 无 HTML 标签。
- **U5-3 交付物 milestone 清空**：表单清空 milestoneId → payload `milestoneId=null` 解除关联；note 持久化。
- **U5-4 列表搜索**：deliverables 主列表 query 命中 note 与 milestoneId（haystack 含 name/version/owner/location/description/msTitle/milestoneId/note），与 listbox 选项过滤无关。
- **U5-5 note 安全渲染**：note 经 MarkdownView（AST→纯 React，无 innerHTML/eval，safeHref 过滤协议），无注入。

## 6. Oil O3/O4/O5（task 抽屉，同页采证）
- O3 失败保留：业务拒绝抽屉保持打开、输入保留、不 onSaved 关层；成功正常关层 + 3s 成功提示。
- O4 dirty 确认：干净直接关；dirty 取消/ESC/scrim 弹 `confirmDanger`；焦点在「放弃修改」，Enter 确认/ESC 取消，关后焦点归还；保存成功不再误弹；description 非控识别 dirty；多选顺序抖动不算 dirty。
- O5 陈旧标注：stale 进入抽屉，客观进度只读附弱标注「数据陈旧，重试后更新」，不进提交；重试成功标注消失。
- 详见 `main-o3-o5-samepage-assertions-20261020.md`。

## 7. 打包回归门（B8 新增，每次新候选 --check 必查）
- R0-1 冻结包根携带 `dsh.bundle.patch` 声明的 `./cordis.patch.yml`，SHA 与 live 一致；扫描无 provider/apiKey/secret/token；无 `../`/绝对/`~/` 逃逸路径。
- R0-2 package.json `files[]` 含该补丁；resolver 经 profile overlay 落冻结包（非 live src/lib）；包运行时文件完整（package.json/lib/index.js/lib/client.js/locale/补丁）。
- R0-3 live 必交付包根文件逐项比对无缺；manifest 全 hash/bytes 匹配；STALE=none（src 不新于 lib）。
- R0-4 客户端模块表门（entry-only）：禁预载兄弟块/禁 requireMap 手动注入；入口仅平台 require materialize；入口**不得**出现同步相对 `require('./client.*.js')`（宿主模块表 missed）；`require.async` 异步块（editor/formula-expr）按需登记可达；所有可达块在场、无未登记依赖；单 bundle 分支仅 client.js(+map)。冻结包上离线复跑 `verify-client-module-table` + `verify-client-bundle`（apply 注册 main/sidebar、board 16 卡）。
- 回归教训：旧 `candidate-final/run-062626` 仅验 lib 解析与 profile patch，漏验包内 bundle.patch，静态 --check 绿却运行 ENOENT；此后静态门必须含打包回归断言，不得仅靠 --check。

## 回填表（Main）
| 段 | 用例 | PASS/FAIL | 实际路由 | 截图 | console 错误 | 备注 |
|---|---|---|---|---|---|---|
| §1 | R1–R12 | | | | | |
| §2 | E1–E5 | | | | | |
| §3 | S1–S5 | | | | | |
| §4 | P1–P4 | | | | | |
| §5 | U5-1–U5-5 | | | | | |
| §6 | O3/O4/O5 | | | | | |
| §7 | R0-1–R0-3 打包回归 | | | | | |
