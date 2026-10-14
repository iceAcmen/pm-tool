<!--
下一批两个低风险功能验收矩阵（独立测试专家所有，ADL-045/047；开发前冻结，不写产品代码）。
其他角色只读引用，不得改本文件用例/断言/判定。状态只能由测试专家实测回填。
冻结日期：2026-10-14。冻结基线：v0.6.1 release commit `38f3512`（annotated tag `v0.6.1`）。
T7 = 任务/交付物级 repoUrl·branch（PROD-21 P1 扩展）；T8 = assignee 候选补全（PROD-06 复活）。
-->
# 任务·交付物仓库链接 + 负责人候选补全 · 验收矩阵（repo-link-assignee-completion）

> 是什么：为下一批两个低风险功能**先冻结独立验收计划**——本文件只有用例与口径，不含任何产品实现。
> 两个功能：**T7** = task/deliverable 可选 `repoUrl`/`branch` 并在 Web 详情可点；**T8** = assignee 输入候选补全（从现有 owner/assignee/participants 归一化去重，仍允许自由输入）。
> 判定纪律：`FAIL / BLOCKED / NOT_RUN` 一律 ≠ 通过；GUI 实测是硬门槛（离线纯函数/HTTP200 不算网页实测 PASS）；严重度只排修复先后，不自动豁免。

## 0. 冻结决策（开发必须对齐，本矩阵据此验收）

### 0.1 版本归属：同一版本 v0.7.0，两个小批次 T7/T8 同批交付（不拆两个 tag）

- **不进 v0.6.1**：v0.6.1 已由 release commit `38f3512` 与 annotated tag `v0.6.1` 发布，范围为 v0.6.0 UX 人工反馈补丁 + 后端数据安全加固；本两个功能是**新功能**，必须从该发布基线继续开发。
- **不拆 v0.7.0 / v0.8.0**：T8 是纯前端派生（零 schema、零写命令），T7 是追加 optional 字段（小而独立）；两者合为一个「体验增量批」只打一次 tag，拆分两次发版无收益。
- **domain 不升版**：`core/storage.ts` 维持 `version: 2`、`compatibleVersions: [1]` 不变。新字段在各自 record schema 声明 optional（沿用 `task.predecessorIds` / `project.repoUrl·branch` 先例，storage.ts L28 既有注释口径）；**不触发任何存量记录迁移重写**。
- **backup `formatVersion` 保持 1**：新备份照旧打 formatVersion=1，v1/v2 备份往返兼容（承接 V2-G 门结论，不另起新门，仅在 T7-C8 回归断言一次）。

### 0.2 T7 口径冻结

1. **字段**：task 与 deliverable 各加 `repoUrl?: string`、`branch?: string`，optional，缺省即空。create/update 白名单（`taskCreateSchema/taskUpdateSchema`、`deliverableCreateSchema/deliverableUpdateSchema`）必须同步显式声明；`describeTaskValidation/describeDeliverableValidation` 补中文标签。
2. **正则共享、禁止漂移**：复用项目级口径（`core/project.ts` 的 `repoUrlPattern` = http(s)://、git://、`git@host:org/repo.git` 三形宽松正则；`branchPattern` = ≤64 字符、首字符字母/数字/点/下划线、禁空白与危险符）。**必须从 project.ts 抽出共享（导出或新建 `core/repo.ts`），task/deliverable 两处不得各抄一份正则**。
3. **空值落盘省略**：trim 后为空的 `repoUrl`/`branch` 在落盘前从记录删除该键（沿用 `core/projects.ts:92` `if (nextInput.repoUrl === '') delete nextInput.repoUrl` 先例），不写空串、不更新无关字段。
4. **deliverable `history[]` 不动**：仅 status/version 变化追加留痕（ADL-028 既有规则）；**只改 repoUrl/branch 不得追加 history、不得改变 history 条数**。
5. **离线优先**：全程不联网探测仓库可访问性（与 PROD-21 同红线）。
6. **Web 展示**：任务详情/交付物详情出现只读链接行（复用 `pm-repo-row` 样式，anchor `href=repoUrl target=_blank rel=noopener noreferrer`，branch 渲染为 `@branch`）；任一为空则该行不渲染（不渲染空 anchor）。表单两个可选输入，编辑时预填。
7. **与既有门的关系**：项目级 repoUrl 用例（V2-A2/B2/B4/C2/C3/C4/C6/E3/E5/G3）**不重复列**，本批只验收「同口径扩到 task/deliverable 两级」。

### 0.3 T8 口径冻结

1. **候选纯函数**：新增纯函数（复用已导出的 `core/people-load.ts` `normalizePerson`，禁另写第二套归一），输入为 snapshot 切片、输出为有序候选串列表；可离线 verify、浏览器端同函数复算。
2. **来源冻结（P0）**：`project.owner` + `task.assignee` + `riskIssue.owner` + `deliverable.owner` + `meeting.participants[]`。**跨项目聚合**（snapshot 本就全量加载，与 PeopleView 同口径）。
3. **分组键** = `trim()` → 折叠内部连续空白为单空格 → `toLowerCase()`（即 `normalizePerson`）；**展示名** = 组内出现次数最多的原始写法、并列取首见（与 people-load 选举规则一致）。
4. **不切分多负责人串**：「张三,李四」整体一个候选，不按逗号/顿号拆（同 people-load `MULTI_OWNER_RE` 打标不拆分规则）。
5. **空值剔除**：归一后为空（纯空白/未填）的来源一律不入候选。
6. **datalist 仅建议、自由输入优先**：assignee 输入绑 `<datalist>`（本项目首个 datalist）；候选只作下拉建议，**不改写、不预填、不限制**输入框已有/新输的值；全新人名照存。
7. **零持久化**：候选只在前端内存按当前 snapshot 派生；**不写 settings、不新表、不下发任何 execute() 写命令**；打开/关闭表单、浏览候选本身零副作用。
8. **P1 扩展（不入门）**：`meeting.facilitator`/`recorder`/`meeting.actions[].owner` 入候选池、owner 类输入（ProjectForm/RiskIssueForm/DeliverableForm）同款 datalist——本批冻结为 P1，列参考行不阻塞。

## 1. T7 用例（task/deliverable repoUrl·branch）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| T7-C1 | core | task 合法值写回 + 空值省略落盘 | `task add` 带合法 repoUrl+branch；再各写一个仅 repoUrl、仅 branch、两者空白的任务 | 合法值原值落盘且重启读回相等；空白值落盘 JSON **不含该键**（非空串）；updatedAt 正常推进 | NOT_RUN |
| T7-C2 | core | task 局部更新不误触其它字段 | 只 update `branch: main→develop` | 磁盘 diff 仅含 `branch`/`updatedAt`；parentId/code/order/时间戳/assignee 零漂移（对齐 V2-B4 口径） | NOT_RUN |
| T7-C3 | core | task 非法 repoUrl clean 拒绝 | 写 `repoUrl: "not a url"` / `repoUrl: "中文仓库"` | clean 拒绝 + 中文错误文案（经 describeTaskValidation 映射）；记录未部分写入、磁盘零变更（对齐 V2-C2 口径） | NOT_RUN |
| T7-C4 | core | task 非法 branch 白名单 | 写 `branch: "bad~branch"`、`"x y"`（含空白）、65 字符超长 | 全部 clean 拒绝、磁盘零变更；合法 `main`/`feature/x-1` 接受（对齐 V2-E3 口径） | NOT_RUN |
| T7-C5 | core | deliverable 合法值写回 | `addDeliverable` 带 repoUrl+branch；重启读回 | 两字段原值读回；仅改 repoUrl 时 history[] **条数不变、内容不变**（ADL-028 红线） | NOT_RUN |
| T7-C6 | core | deliverable 更新门不被新字段绊倒 | 只 update `{"repoUrl":"..."}`（无 operator/changeNote） | 被判定为业务更新并落盘（不被「仅 operator/changeNote」refine 误拒）；非法值同 T7-C3/C4 中文拒绝零写 | NOT_RUN |
| T7-C7 | core | 旧记录兼容（v1 + v0.6.0 时代 v2） | 手工放 v1 形状 task（无 repoUrl/branch/predecessorIds 键）与 v0.6.0 形状 deliverable（无两键）进隔离库 | 读回成功、按空语义处理；**open 后磁盘文件零改写**（无迁移重写）；既有字段零漂移 | NOT_RUN |
| T7-C8 | core | schema/信封/备份版本不抬 | 跑一轮 createBackup + 读 storage spec | `storage.ts` version 仍 2、compatibleVersions 仍含 1；新备份 `formatVersion` 仍 1；旧 v1 备份照常 restore（回归 V2-G 口径一次） | NOT_RUN |
| T7-C9 | core | 类型错误 zod 级拒绝 | `repoUrl: 123`、`branch: {}` | zod 类型拒绝而非静默 coercion；错误文案映射中文标签（对齐 V2-C4 口径） | NOT_RUN |
| T7-C10 | core | 全程离线不联网探测 | 写合法仓库地址后断言无 fetch/dns/探测 | verify 可断言写路径无任何出站网络（对齐 PROD-21 红线） | NOT_RUN |
| T7-X1 | commands | `/pm task` 透传两字段 | `task add '{...,"repoUrl":"https://github.com/org/r.git","branch":"main"}'` 后 `task update t-x '{"branch":"develop"}'`，再 list/get 读回 | 命令行可写可读、值往返一致；空值省略落盘 | NOT_RUN |
| T7-X2 | commands | `/pm deliverable` 透传 + 非法中文报错 | `deliverable add/update` 带非法 repoUrl | 中文错误输出、非零退出、磁盘零变更 | NOT_RUN |
| T7-X3 | commands | 严格 schema 不吞未知键 | payload 写错键 `repoURL`（大小写错）或加 `foo:"bar"` | 报 unrecognized_keys 中文提示、不落盘（strictObject 不静默吞） | NOT_RUN |
| T7-W1 | web | 任务表单两可选输入往返 | 隔离 GUI 3096 打开任务抽屉编辑：填两值保存；再打开 | 表单预填正确、保存后读回持久；合法值可清空（清空后落盘省略该键） | NOT_RUN |
| T7-W2 | web | 任务详情只读链接行 | 打开带 repoUrl+branch 的任务详情 | 渲染只读链接行（稳定 `data-repo-link`/语义 class）：anchor href 正确、`target=_blank rel=noopener noreferrer`、branch 显 `@branch`；空字段时该行不存在 | NOT_RUN |
| T7-W3 | web | 交付物详情只读链接行 | 打开带 repoUrl 的交付物抽屉/详情 | 同 T7-W2 渲染口径；空值不渲染空 anchor | NOT_RUN |
| T7-W4 | web | 表单非法 URL 内联拦截 | 任务表单填 `not a url` 保存 | 内联中文错误（role=alert、aria-invalid）、提交被拦截、磁盘零写、已填其它内容保留（对齐 V2-C6/E5 GUI 口径） | NOT_RUN |
| T7-W5 | GUI | 真实浏览器端到端冒烟 | 真 Chrome 3096 隔离 DSH_HOME：建任务→填仓库→详情点链接（断言 anchor href）→交付物同样一步→重启宿主读回 | 链接可开新窗口、两实体往返一致；**正式 data/ 与 3080/3091 零触碰**（sha256+mtime diff） | NOT_RUN |

## 2. T8 用例（assignee 候选补全）

| CASE_ID | 层 | 用例 | 步骤/输入 | 通过门槛（断言） | 状态 |
|---|---|---|---|---|---|
| T8-C1 | core | 候选纯函数确定性输出 | 固定 fixture：2 项目，owner/assignee/riskIssue.owner/deliverable.owner/participants 各有写法 | 输出候选串列表可复算；同输入两次运行逐字节一致；次序确定（排序键冻结：分组键字典序或首见序，二选一在实现中固定并写注释） | NOT_RUN |
| T8-C2 | core | 归一化去重 + trim | 同一人三种写法：`"张三"`、`" 张三 "`（首尾空白）、`"张  三"`（内部双空格）、`"ZHANG San"`、`"zhang san"` | 归一后合并为**一个**候选；展示名 = 组内频次最高写法（并列首见）；normalizePerson 复用、无第二套归一函数（源码 grep 断言） | NOT_RUN |
| T8-C3 | core | 多负责人串不切分 + 空值剔除 | 来源含 `"张三,李四"`、`""`、`"   "`、null | 逗号串整体一个候选不拆分；空/纯空白/null 全部剔除不出现在候选 | NOT_RUN |
| T8-C4 | core | 零持久化副作用 | 调候选纯函数前后 diff 隔离库目录 + settings | 候选计算纯内存、**零写盘**；函数不触 domain 写通道、不读 settings | NOT_RUN |
| T8-C5 | core | 自由输入不被候选限制 | 候选池为空（全空 assignee）时任务 update assignee `"全新人名"` | 照存照读；候选补全是建议层，写路径仍接受任意串（对齐 PROD-06「新人员可手填」） | NOT_RUN |
| T8-C6 | core | 来源覆盖冻结五处 | fixture 分别只放 project.owner / task.assignee / riskIssue.owner / deliverable.owner / meeting.participants[] 单来源 | 五处来源各自独立入池；缺任一来源不报错（空表安全） | NOT_RUN |
| T8-W1 | web | assignee 输入绑定 datalist | 隔离 GUI 打开任务抽屉 | 执行人 input 有 `list=` 绑定、存在对应 `<datalist>`，候选 `<option>` 渲染正确（稳定选择器）；输入框已有值不被候选改写 | NOT_RUN |
| T8-W2 | web | 点选候选回填 | 从下拉选一个候选 | 输入框回填该候选的**展示写法**（含其原始大小写/空白形态） | NOT_RUN |
| T8-W3 | web | 自由输入新人名落盘 | 输入候选外的 `"新人王五"` 保存任务 | 落盘 = `"新人王五"`、重启读回；候选列表本身不因此持久化任何东西（重开表单候选不出现「花名册」残留机制） | NOT_RUN |
| T8-W4 | web | 候选随最新 snapshot 刷新 | 改一个任务 assignee 后重开表单 | 新候选出现、被删写法消失；不缓存过期候选 | NOT_RUN |
| T8-W5 | web | 浏览候选零写 | 打开表单、展开 datalist、点选又改回（不提交），抓 execute 调用 | **全程零 execute() 写下发**；仅最终提交触发既有 task add/update（对齐 PL-WEB 零写口径） | NOT_RUN |
| T8-W6 | GUI | 真实浏览器端到端 | 真 Chrome 3096：种子数据含同三人多写法分散在 owner/assignee/participants → 开任务抽屉 → 展开候选 | 候选区**只有 1 个**该人条目（trim/casefold 合并生效）；自由输新人保存成功；正式 data/ 零污染 | NOT_RUN |

> P1 参考行（meeting.facilitator/recorder/actions[].owner 入池、owner 类输入同款 datalist）：本批不入门、不阻塞，待后续批另列。

## 3. 开发文件边界与并行冲突建议（冻结基线：v0.6.1 release commit `38f3512`）

### 3.1 工作树与发布基线

v0.6.1 UX 补丁及数据安全加固已在 release commit `38f3512` 发布并打 annotated tag `v0.6.1`；T7/T8 从该干净发布基线继续，不与补丁工作树混改。

### 3.2 边界裁定（v0.7.0 同批两模块，core/commands 真并行、panel 接线串行）

- **T7/T8 必须在 v0.6.1 tag 落地后**，从其最终 release commit 切分支开工；严禁直接叠在当前脏工作树上开发（否则 panel.tsx/commands/task.ts/verify-web.mjs 三处必然三方冲突）。
- **可完全并行（文件零重叠）**：
  - T7 后端：`src/core/task.ts`、`src/core/deliverable.ts`、共享 repo 正则（从 `core/project.ts` 抽出）、`src/commands/task.ts`、`src/commands/deliverable.ts`（透传）、新建 `scripts/verify-task-repo.mjs`。
  - T8 后端：纯函数（`core/people-candidates.ts` 新建或 `people-load.ts` 内追加导出，仅复用 `normalizePerson`）、新建 `scripts/verify-person-candidates.mjs`；**不写任何 command / schema**。
  - 两条线改的 core/commands/verify 文件互不相交，可同时开工、各自跑专项 verify。
- **串行接线闸门（唯一强制串行点）**：`src/client/panel.tsx`。两模块都要碰 TaskForm——T8 仅一行 `list=` + 一个 `<datalist>`（约 L3270）；T7 随后在 TaskForm 末尾插两输入、改 DeliverableForm（~L3854）、加 client type（L91 Task / L195 Deliverable）。**同一时刻只允许一个 executor 改 panel.tsx**：先合 T8 接线（hunk 最小），再由 T7 rebase 后接线；禁止两人同时改 panel.tsx。T8 与 v0.6.1 R8-01（前置依赖紧凑树，同在 TaskForm L3090–3160 区）相邻——rebase 时重点核该区。
- **verify 脚本一律新增文件**：T7 新建 `scripts/verify-task-repo.mjs`、T8 新建 `scripts/verify-person-candidates.mjs`；`scripts/verify-web.mjs` 两模块各只追加自己的选择器行（T7 追加在 T8 后），不重排既有断言。
- **T7 不得碰**：`core/storage.ts`（不升版）、`core/backup.ts`、`core/doctor.ts`、`core/people-load.ts` 归一函数本体。
- **T8 不得碰**：任何 schema/command 写路径、`core/people-load.ts` 的分组逻辑本体（只 import 复用 `normalizePerson`）。

## 4. 证据与判定要求

- AUTO：新增两个 verify 专项 + build=0 + full guard 零污染（口径同 V2 批）；正式 `data/` 与 `backups/` 隔离目录前后 sha256+mtime diff。
- GUI：隔离宿主 `http://127.0.0.1:3096`（独立 DSH_HOME/DSH_PM_BACKUP_DIR），证据按 `docs/verification/gui-repo-assignee-20261014/` 命名存档；3080/3091/正式 data 全程不碰。
- 初始状态：全部 **NOT_RUN**。开发完成后由测试专家逐格实测回填 PASS/FAIL/BLOCKED/MANUAL_PENDING。
