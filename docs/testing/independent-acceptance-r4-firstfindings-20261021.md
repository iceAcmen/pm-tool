# R4 独立验收检查点（2026-10-21，非全量 PASS；内置浏览器 3199，窄视口 675×745，浅主题为主）

- 环境：本机 macOS，每动作前 `caffeinate -disu`；3172 PID44388 全程未动（未杀/未改/未重启）；3199=我的隔离 iso3 PID33859（profile iso3，cwd 上游只读，不指 pm 软链，仅写 iso3 scratch fixture）。
- 口径：源码闭合/作者自检 ≠ GUI PASS；独立复跑记真实 exit；未跑绝不 PASS；不豁免、不删测、不用全矩阵未完拒给可验项结论；每条 FAIL 做「对象+证据」双核再报作者。
- 桌面 cu 链为 Subagent 角色能力门（Main-only），不把该 BLOCKED 传染到可测网页项。

## 1. Client 候选（独立冻结树 06a131c + tracked.diff + 2 新文件）

### 1.1 绑定核验（独立 shasum，7 文件 + diff 全 OK）
- 冻结树 `freeze/wt-06a131c`，`git apply --check`/`apply` 干净；7 文件 sha256 与 FREEZE.md 逐字节一致。
- 独立复跑（实际 exit）：
  - `npx vitest run src/client/launch-handshake.test.ts` → **14/14 passed, BRIDGE_EXIT=0**。
  - `verify-ui-feedback.mjs` → OK **EXIT=0**；`verify-p2b-okr.mjs` → **26/26 EXIT=0**；`verify-form-validation.mjs` → 通过（ARIA/内联留 GUI）**EXIT=0**。
  - `pnpm run build` → Build complete **BUILD_EXIT=0**；新 lib/client.js sha256 `92a0eebfe95c0c2a9d457b3e452afbc464cc5a3f6733316866e138842f45b816`。

### 1.2 verify-isolation 聚合 2 项 exit1 的正确口径（不豁免、不删测、不误判候选）
- 现象：`verify-export.mjs`、`verify-settings.mjs` 在我的 detached worktree 各 exit1，其余聚合项通过。
- 定位（只读源码）：export 硬编码断言目录匹配 `/pm-tool/exports/`，detached 树路径段 `freeze/wt-06a131c/exports/` 无 `pm-tool` 段 → 路径假定失配；settings `--reopen` 子进程在含空格的 detached 路径读 src/index.ts 失败，但 src/index.ts 实际存在（21091B，与主仓同）。
- 结论：**隔离布局阻塞**，非候选回归（两脚本不触碰 7 候选文件）；主仓作者 95/95 全绿、相关独立项已过。**独立门适用用例仍须在规范 package cwd/规范路径复验**，本轮不判绿、不豁免、不删测。

## 2. Launcher 最新冻结（一致性纠偏 633ff5e；静态 + 独立单测，非 GUI E2E）

### 2.1 哈希独立复现
- `git diff -- launcher` 独立复现 = `633ff5ef5a6bd18ed2cf978e1f5deffba54b1a5deb90c3a647b23cbde35b19ce`（本轮最新，取代前序 fda09d0f/c6dbc304，旧计数不沿作新结果）。
- 隔离验收 app 壳未变：launch `a7289c013284416f2a5c6289fdbf717099507722d9a230a1344a4c7f0604a3a5` ✓；plist `24048be9a4cdc1f8f6c0b053f3b53752052b61f0a0e1e9a3f3dde87e47ce4063` ✓；壳内固定 node v22.23.3 + 仓内 `launcher/bin/pm-launcher.mjs` 绝对路径，Host 透传 PM_HOST:PORT，非 system env、不写全局、不读凭据。

### 2.2 独立单测（非作者自述，本轮实跑）
- `npm test`（633ff5e 冻结）→ **42 tests / 42 pass / 0 fail，LAUNCHER_TEST_EXIT=0**。
- `npm run verify` → 隔离假监听者 PASS（未碰 3172、未读 cookie/凭证），**LAUNCHER_VERIFY_EXIT=0**。

### 2.3 源码闭合（证明 nonce/S4 不假成功，逐例真实 HTTP 码）
- Host 白名单仅 `127.0.0.1:<boundPort>`/`localhost:<boundPort>`，未知 Host→403（防 DNS rebinding）。
- `POST /api/entered`：origin 不符→**403 origin-not-allowed**；非 JSON→**415**；坏 JSON→**400 bad-request**；verifyEntered 不过→**403 invalid-nonce**（非“全403”）。
- nonce 内存 Map、TTL120000ms、used 置位 single-use、过期/已用/缺失全 false、onEntered 删除；S4 仅由有效 nonce 回告触发，无回告不进 S4。
- `POST /api/action`：浏览器带 Origin 须=control 自身 origin；无 Origin（CLI）须 timingSafeEqual 内存 CSRF nonce 否则403；CORS 最小无通配，OPTIONS 非白名单405，GET 只读，nosniff/no-referrer。

## 3. BLOCKED（精确根因，非产品缺陷）

- **B-L1 真实 Finder 双击 E2E = BLOCKED（Subagent 角色能力门，非产品缺陷、非 Main 工具失败）**：组织者与独立测试（Subagent）调 cu 原生桌面均复现「Subagent暂不支持操作电脑相关操作，请在MainAgent完成」；Main 本机桌面工具可实际采证，不由本 Subagent 执行。按授权不用终端 `open`/exec 冒充 Finder。待 Main：Finder 双击隔离 app→控制窗→3199 mounted snapshot ready→有效 nonce 回告 S4；逐例验 错Origin(403)/control/无Origin/replay/TTL120过期/无回告 全拒；跨浏览器首访诚实401/认证；cancel 只回收自有未ready、不杀3172。
- **B-L2 3172**：client bridge 未加载（receiver 在 launcher 进程内，非 receiver 缺失），3172 不期待 S4，不得当产品 FAIL。

## 4. 13 类缺陷逐子项状态（窄视口 675×745 浅主题；宽视口/深主题未跑，未跑绝不 PASS）

| 项 | 状态 | 本轮实证（独立 DOM/截图，非作者报告） |
|---|---|---|
| **D-01** 看板×删卡/↶撤销/自动排版压实/连续拖卡 | **PASS(×删卡+撤销+压实子项) + NOT_RUN(连续拖卡)** | **【撤回旧 FAIL 误判】** 旧判把「任务删除 t-0001（横幅“已删除｜1｜t-0001”）」当成看板删卡，对象错误；任务删除属 D-06，且无授权任务删除 undo 新能力，旧 FAIL 作废、不让作者改虚假缺陷。正确对象=总览看板布局编辑卡库：对「成员负载」卡点 ×移除（before aria-label 存在 True → afterRemove False 卡消失）→ 点「↶撤销」恢复（afterUndo True，撤销按钮启用）；「自动排版」点击压实且可撤销、无模态。连续拖卡远推空白 NOT_RUN（675px 虚拟化自由画布 bu.drag 坐标不可靠，不判 FAIL）。证据 shots/r4-d01-kanban-board-after-compact-3199.png（DOM 循环为主要证据） |
| **D-02** 卡库/配置面板遮挡+双主按钮(渐进披露留高级) | **PASS(无双主按钮+分组渐进库子项)** | 卡片配置模态仅 1 个 primary「应用位置与尺寸」（数据源/筛选/排序/显示元素为次级 tab）；「＋卡片库」按 概览/进度/列表/指标/内容 分组渐进；「更多」备份/恢复/导出菜单 0 个 primary。面板为抽屉浮层压暗底（预期），无破损覆盖。宽档互斥细节 NOT_RUN。证据：配置模态见 r4-d01-kanban-board-after-compact-3199.png |
| **D-03** 概览顶条贴卡层级 | **PASS(顶条不压卡子项)** | 项目概览 header `position:static / z-index:auto`，33 卡流式排布在下，顶条未贴压/遮卡；sticky 滚动叠层 NOT_RUN。 |
| **D-04** 任务工具条分组/新建主位 | **PASS(工具条分组+新建主位子项)** | 工具条分四组：筛选(全部1/进行中0/已完成0/已逾期0/我负责的0)、视图(未命名视图/保存视图/按状态分组)、密度(舒适/紧凑)、导出(导出 Markdown/JSON)；「新建任务」为 header primary 主位。 |
| **D-05** 编号列非空可复制 | **PARTIAL** | 窄视口不渲染表格 `.pt-code`（CDP 不可用无法加宽）；仅见交付核对卡句柄，编号格 `.pt-code>.pt-code-val`+复制按钮待宽视口复验，不判 PASS。 |
| **D-06** 任务抽屉唯一主按钮+危险确认级联 | **PASS(唯一主按钮子项) + NOT_RUN(危险确认级联)** | 新增抽屉仅「添加任务」primary；编辑抽屉仅「保存更改」primary，「删除」为 danger 非 primary，取消/加链接/关联交付物/追加进展次级。任务删除二次确认级联 NOT_RUN。 |
| **D-07** 甘特键盘微调/点按阈值/里程碑可及 | **PASS(←→整体平移1天持久化 + Shift→延长1天工期持久化 + 里程碑可达 + 单击选中子项) + NOT_RUN(点按像素阈值)** | ①ArrowRight：T1 排期 21~23→22~24，落库 start22/due24，里程碑关联保留（gantt.tsx ←→整体平移）。②Shift+ArrowRight：start 不变、due 24→25，落库文件 startDate=2026-10-22/dueDate=2026-10-25，条标签 `10-22 ~ 10-25`（Shift←→仅改 dueDate 调工期，gantt.tsx）。里程碑 M1 行可及；单击选中不弹抽屉提示在位。点按像素阈值 NOT_RUN。证据 r4-d07-gantt-arrow-nudge-3199.png、r4-d07-shift-extend-22to25-3199.png + 落库文件双证 |
| **D-08** 任务↔里程碑双向关联 | **PASS** | T1 抽屉「关联里程碑」选 M1 保存并持久化；里程碑页 M1 卡回显「关联任务（1）验收任务T1」，双向闭环（清洁无菜单遮挡）。证据 shots/r4-d08-ms-backref-t1-clean-3199.png |
| **D-09** 通知分级/短摘要/顶层错误 | **PARTIAL** | 交付核对为短 advisory（临期未动≤2天仍待办），只读不下完成裁决；分级配色/顶层错误横幅 NOT_RUN。 |
| **D-10** 执行摘要 Markdown 源编辑/实时预览/安全落库 | **PASS(manual 源编辑/即时预览/安全落库/重开留存子项) — R5 复验** | R4 曾 BLOCKED（空态表单未挂载）；作者修复空态提前 return 未渲染 formOverlay，独立 61 tests/build EXIT0 后 GUI 全链通过：手动撰写、MarkdownEditor 源码/预览、探针转义无活元素、固定快照落库 rpt-0001、重开留存（见 R5 段）。AI session 来源/宽深未测。 |
| **D-11** 任务↔交付物双向关联 | **PASS（草稿路径双向落盘，独立 GUI 双证）** | 正确步骤（非 select-only）：T1 抽屉「任务资料（草稿）」select 选 D1 → 点独立「关联交付物」（待提交 0→1 项变更）→ 点主「保存更改」提交；重开 T1 已提交 chip 出现「验收交付物D1 dlv-0001」、待提交归零；交付物页 D1 卡只读反查「关联任务（1）1 未开始 验收任务T1」，零 schema 不回写。两条写入路径并存（即时写 materialDeliverableCmd / 草稿随主保存 applyTaskDraftOps），本轮实测草稿路径。证据 r4-d11-deliverable-backref-t1-clean-3199.png（D1 反查 T1）；任务侧 chip 由重开 DOM 证实（图被下拉遮不作视觉证据）。注：作者已回退误判直连补丁，panel.tsx sha ff284377…与冻结一致，非修 bug。 |
| **D-12** OKR 错误层级/软关联通俗解释 | **PASS(软关联+无效拒绝子项)** | 类型可选 目标O/关键结果KR；软关联说明「仅展示引用、不计权重、不参与进度裁决；与主归属互不影响」；伪造 `okr-zzz-notexist` 保存被内联拒绝「未在本项目目标列表中找到…请从列表选择存在的目标或移除该ID」，saved=false 弹窗保留。错误是否顶层横幅 NOT_RUN。证据 shots/r4-d12-invalid-relation-3199.png |
| **D-13** 习惯同日幂等/长历史紧凑 | **PASS(同日幂等子项) + BLOCKED(长历史折叠，合法机制受限)** | 同日两次「今天打卡」→连续1·最长1·累计1，仅单条 2026-10-21，未重复计数。长历史折叠：`habit checkin` 仅允许过去 2 天回填（backfilled:true），超窗/未来拒绝（habit.ts:45,168），无法经合法命令造 >14 天历史；不手改存储绕校验，待真实多日或作者提供合法 fixture。证据 r4-d13-habit-idempotent-3199.png |

### 4.1 桌面 Finder/跨浏览器 E2E = BLOCKED（角色能力门，非产品缺陷）
见 §3 B-L1。待 Main 采证有效 nonce S4、错例全拒、跨浏览器401、cancel 回收自有不杀3172。

## 5. 证据清单（675×745 PNG，浅主题，均实际 Read；无用户继承截图，不写“与IMG一致”）
- `artifacts/shots/r4-d07-gantt-arrow-nudge-3199.png`：甘特清洁视图，T1 条 22~24、键盘微调说明（←→移动1天/Shift调工期/单击选中/Enter详情）、M1 关联。
- `artifacts/shots/r4-d07-shift-extend-22to25-3199.png`：Shift+→后条标签 10-22~10-25（落库 start22/due25 文件双证）。
- `artifacts/shots/r4-d08-ms-backref-t1-clean-3199.png`：M1 卡「关联任务（1）验收任务T1」，无菜单遮挡。
- `artifacts/shots/r4-d11-deliverable-backref-t1-clean-3199.png`：D1 卡「关联任务（1）1 未开始 验收任务T1」只读反查，无遮挡。
- `artifacts/shots/r4-d01-kanban-board-after-compact-3199.png`：看板布局编辑/配置模态（D-01 压实、D-02 单 primary）。
- `artifacts/shots/r4-d12-invalid-relation-3199.png`：OKR 类型O/KR、软关联说明、伪造ID内联拒绝。
- `artifacts/shots/r4-d13-habit-idempotent-3199.png`：两次打卡累计/连续/最长=1、单条记录。
- `artifacts/shots/r4-tasks-light-3199.png`：全部任务浅主题、交付核对提示。
- 禁用证据：`r4-d01-delete-no-undo-3199.png`（删任务非删看板卡）、`r4-d11-deliverable-no-task-link-3199.png`（select-only 误操作，不证 FAIL）、旧被菜单遮版 D-08。

## 6. 待 Main（cu Main-only，本轮 Subagent 不可达桌面）采证用例
1. Finder 双击 `/Users/bytedance/Documents/dsh-pm-tool/本地启动器候选-20261021/PM工作台-隔离验收.app`（launch a7289c01…04a3a5 / plist 24048be9…ce4063，绑定 127.0.0.1:3199）→ 控制窗 → 3199 mounted snapshot ready → 有效 nonce 回告 S4 成功。
2. 安全负例全拒：错 Origin→403 origin-not-allowed；非JSON→415；坏JSON→400；invalid/replay/过期(>120s)/缺失 nonce→403；`/api/action` 非 control Origin 或缺 CSRF nonce→403。
3. 跨浏览器：已认证原浏览器可进；新浏览器/无凭据首访诚实 401/认证门，不假成功。
4. cancel 仅回收自有未 ready 进程/端口，不杀 3172(PID44388) 与 3199 已就绪实例。
5. 服务身份核对：3199=PID33859 profile iso3、cwd 上游只读、DSH_HOME/存储根在 isolated/，3172 全程只读未动。

## 7. 收口矩阵（仅列本轮实测到的**子项**；未测子项 NOT_RUN/BLOCKED，不把整项计 PASS）

> 说明：下列 PASS 均为「窄视口 675×745 / 浅主题」下实测到的具体子项；宽视口、深主题、dense 密度、自由画布拖拽、危险确认级联、sticky 叠层、点按像素阈值等未测子项**不计 PASS**。

| 项 | 已实测 PASS 子项 | 未测 / BLOCKED 子项 |
|---|---|---|
| D-01 | 看板卡点 ×移除→↶撤销恢复；自动排版压实且可撤销、无模态 | 连续拖卡远推空白 NOT_RUN |
| D-02 | 配置模态仅 1 primary；卡片库分组渐进；备份菜单 0 primary | 宽档互斥细节 NOT_RUN |
| D-03 | 概览 header static/auto 不压卡 | sticky 滚动叠层 NOT_RUN |
| D-04 | 工具条四组分组；新建任务 header primary | — |
| D-05 | —（PARTIAL） | 编号格+复制按钮待宽视口（CDP 不可用）NOT_RUN |
| D-06 | 新增仅「添加任务」primary；编辑仅「保存更改」primary，删除为 danger | 危险确认级联 NOT_RUN |
| D-07 | ArrowRight 整体平移1天持久化；Shift+→延长1天工期持久化；里程碑可达；单击选中提示 | 点按像素阈值 NOT_RUN |
| D-08 | T1↔M1 里程碑双向关联持久化+回显 | — |
| D-09 | 交付核对短 advisory 只读不下裁决（PARTIAL） | 分级配色/顶层错误横幅 NOT_RUN |
| D-10 | manual 源编辑/即时预览/安全落库/重开留存（R5 PASS） | AI session 来源路径、宽深未测 |
| D-11 | 草稿路径 select→「关联交付物」→保存更改，任务 chip 落盘 + D1 只读反查 T1 | 即时写 materialDeliverableCmd 路径未单独复测 |
| D-12 | 软关联通俗解释；伪造 OKR ID 内联拒绝 | 错误是否顶层横幅 NOT_RUN |
| D-13 | 同日两次打卡幂等（累计/连续/最长=1，单条） | 长历史折叠 BLOCKED（后端仅2天回填窗，不绕校验） |

## 8. 来源冻结 / 服务身份 / 证据哈希（无 token、无凭据）

### 8.1 被测代码来源（不打印运行 token）
- 仓 `/Users/bytedance/Projects/dsh-pm/pm-tool`，基线 HEAD `06a131cd5fdc4486dd74afe89cc4c5630f0a4c98`（17 ahead/0 behind）。
- Client 候选独立冻结树 `freeze/wt-06a131c`，7 文件 sha 与 FREEZE.md 逐字节一致；独立复跑 launch-handshake 14/14、verify-ui-feedback/p2b-okr/form-validation EXIT0、build EXIT0（详见 §1）。
- Launcher 最新冻结 diff `633ff5ef5a6bd18ed2cf978e1f5deffba54b1a5deb90c3a647b23cbde35b19ce`；独立 42/42 EXIT0 + verify0（§2）。隔离 app launch `a7289c01…04a3a5` / plist `24048be9…ce4063`。

### 8.2 服务身份（Main 仅用自己隔离服务合法启动认证；本报告与案例不记录/不转贴任何 token、cookie、凭据）
- 隔离 3199：PID 33859，`--profile iso3 --host 127.0.0.1 --port 3199 --no-open`，DSH_HOME=`…/isolated/dshhome`，存储根=`…/isolated/data`（storage-json override），cwd 上游只读，不指 pm 软链；本轮保留运行供 Main 接管。
- 正式 3172：PID 44388，`--profile pm … --port 3172`，全程只读未动（未杀/未改/未重启）。
- 密钥保护：启动 URL token 属机密，不出现在本报告/截图/案例；Main 须以隔离服务自身合法认证进入，不得复用或转贴 tester token。

### 8.3 证据截图绝对路径 + sha256（均已实际 Read；675×745 浅主题）
- `…/agents/s_000ElkeZqJ2/artifacts/shots/r4-d07-gantt-arrow-nudge-3199.png` — `7380be7707842e3e9af01e1bbdd0f30c4ff3d45d6a3e845491f08d49bd012ef4`（D-07 平移）
- `…/shots/r4-d07-shift-extend-22to25-3199.png` — `f9c4c113fdf3febf7081b8b89f7887e6cd613f12f00375ed90d5bd7003549f80`（D-07 Shift 22~25，落库文件双证）
- `…/shots/r4-d08-ms-backref-t1-clean-3199.png` — `8a5dbf73e9e194d045442cd1ec52bd37a0fbec1eac785618d5b3d85f3bc7d5fe`（D-08 M1 回显 T1）
- `…/shots/r4-d11-deliverable-backref-t1-clean-3199.png` — `4d703475f1e2101feeae785800e702a524193f305f1af601d87863b9e0ef8c49`（D-11 D1 反查 T1）
- `…/shots/r4-d01-kanban-board-after-compact-3199.png` — `5af5f6b7d3dde8803176a485fdbbc0d97c6d1c51c5bce5b3bc138de05be6809f`（D-01 压实/D-02 单 primary）
- `…/shots/r4-d12-invalid-relation-3199.png` — `992879adde303f98021297a9ea123f065a09af83bec8d913f739fdb58868aa8b`（D-12 软关联/拒绝）
- `…/shots/r4-d13-habit-idempotent-3199.png` — `8668de05144460897020a7e38f3470a2f9459844be82b0e63084c81391df638d`（D-13 幂等）
- `…/shots/r4-tasks-light-3199.png` — `379c48b6acd4b46f8f64571cdc02a5c4f9d11d97130991cc6899d41b15c1e240`（浅主题任务列表）
- 禁用证据：r4-d01-delete-no-undo（删任务非看板卡）、r4-d11-deliverable-no-task-link（select-only 误操作）、旧被菜单遮版 D-08。

---

# R5 追加：D-10 空态表单修复独立复验（2026-10-21，不擦除 R4）

## R5.1 修复来源与独立绑定（未改产品、未 commit）
- 作者修复（未提交）2 文件，独立冻结树 `freeze/wt-06a131c` 按 hash 接入并逐字节核对：
  - `src/client/views/reports.tsx` sha256 `6a6bae4c4e5c59a9212605e00cb9a4f5c3530b2e35436ceb8608c4fbf6beb79b`（空态提前 return 前提取 formOverlay，空/非空分支各渲染一次）
  - `src/client/views/reports-entry-guard.test.ts` sha256 `8bbea28a5275ef22007227ff3d755503fecfcd129948f120fd00d6ab0bac64f8`
- 冻结基线其余文件未动：panel `ff284377…`、growth-form-props `0e07ee09…`、okr-form `0b9bd1b1…`、launch-handshake `1b6aa212…`/`4fe25dc1…`。
- 独立复跑 records 域子集（records/* + records-callbacks + report-preview-client + records-entry-guard + reports-entry-guard）：**10 files / 61 tests passed, EXIT=0**。
- 独立 `pnpm run build`：**Build complete EXIT=0**；新 `lib/client.js` sha256 `1b3f05d742d82a4ecb425b4cebd7431e0b0695e3ac85908386fc43e955602733`。

## R5.2 服务重启（仅停自己的旧隔离实例，3172 未动）
- 旧 3199 PID33859（iso3/127.0.0.1:3199）经 cwd=deepseek-harness、argv=`--profile iso3 --port 3199`、DSH_HOME=isolated/dshhome 终核后 TERM。
- 新实例 **PID 66544**，同参同 DSH_HOME/存储根 scratch，加载新 build；3172 PID44388(pm) 全程只读未动。

## R5.3 GUI 实测链（manual，无 AI/无 session/无 API key）= PASS
1. 进度汇报空态点「生成快照」→ RecordsReportForm 覆盖层挂载（非旧 panel 抽屉）：来源「手动撰写」、管理摘要 MarkdownEditor（源码/预览切换、格式辅助：标题/加粗/列表/链接）、周期起止、「生成固定快照」。
2. 源码写入 `## 验收周期摘要` + 列表 + `[验收说明](https://example.com/accept)`，并注入探针 `<script>alert('xss')</script>`、`<img src=x onerror=alert(1)>`、`[jshref](javascript:alert(2))`；切预览：标题/列表/安全 https 链接渲染，探针转义为文本，**无活 `<script>` 元素、无活 `<img onerror>`、无 javascript: 活 href**。
3. 填周期 2026-10-15→2026-10-21，提交「生成固定快照」成功；列表出现 1 份「周报 10-15→10-21 草稿 手动撰写」。
4. 落库 `isolated/data/pmtool/reports/rpt-0001.json`：sourceType=manual、period 10-15/10-21、executiveSummary 留存；磁盘无活 `<script>`/`onerror`（sanitizeMarkdownDraft 清洗）。重开详情安全渲染。
- 证据 `…/shots/r5-d10-manual-report-saved-3199.png`（列表+执行摘要安全渲染，无菜单遮挡）。

## R5.4 D-10 结论更新
D-10 由 R4 BLOCKED（空态表单未挂载）→ **PASS（manual 源编辑/即时预览/安全落库/重开留存子项）**；宽深矩阵、AI session 来源路径未测。
