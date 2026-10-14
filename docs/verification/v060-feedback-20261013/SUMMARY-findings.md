# v0.6.0 人工反馈回归 — 独立真实 GUI 采证摘要（2026-10-14，隔离 3098）

> 本文件只采事实证据（真实 Chrome + Browser Use），不代替矩阵判定。
> 被测实例：隔离 DSH_HOME / DSH_PM_BACKUP_DIR，端口 **3098**（正式 3080/3091 未触碰）。
> 被测 client：HEAD 4a8ff63；bundle `lib/client.js` sha256 = 9ea93fbca3987f4667ff2551f3b0ae4b52e8bd84383a6dc2fcea157fb9fc8b76，与冻结口径**完全一致**（先前误把分包 chunk `lib/client/panel.js`=e5bdbb… 当 bundle 比对，已更正；未发生重 build）。
> 证据均为本目录 png / txt 绝对路径。无 token（已 grep 扫描干净）。

## 逐项事实

### R1 备份/恢复 — 全路径采到
- 更多菜单含「备份」「选择备份文件恢复」，后者带说明「备份默认存于内置 packages/backups/…以备份成功提示文件名为准」。
  - 图：`R1-more-menu-backup-restore.png`
- 备份：点「备份」**先弹原生 confirm**「将把当前七类实体备份到内置 packages/backups/（带时间戳 JSON，成功后显示完整路径）。开始？」
  - cancel 后 backups 仍 0 文件（零写）。
  - accept 后 Notice **完整绝对路径+文件名+七类计数+「复制路径」按钮**，长文换行不截断；落盘 `pmtool-backup-2026-10-13T17-51-35-571Z.json`（5305B），无 .tmp 残留。
  - 图：`R1-backup-success-notice-path-copy.png`
- 恢复：恢复 input `accept=.json,application/json`；选文件后先弹**预览弹窗**「已读取备份内容（演练，尚未恢复）…将替换七类实体（恢复前自动存安全快照）…确认恢复/取消」。
  - cancel 后 data 仍 7 条、无额外快照（零写）。
  - confirm 后 Notice「已按所选备份文件恢复。恢复前自动安全快照：…17-54-08-344Z.json」；data 仍 7 条 deep equal，backups 现 2 文件。
  - 图：`R1-restore-preview-dialog.png`、`R1-restore-confirmed-snapshot.png`

### R2 级联删除长提示 + 前置拒删
- 级联：删父任务 t-0001（含子 t-0003）弹原生 confirm「任务「需求梳理」含 1 个子任务。确定删除该任务及其全部 1 个子任务吗？旁支任务不受影响，此操作不可撤销。」——数量完整可读（已 cancel，未真删以保数据）。
- 前置拒删：GUI 中把 t-0001.predecessorIds=[t-0002] 保存（落盘 record.predecessorIds=["t-0002"]），再删 t-0002 → 后端中文拒绝
  **「任务 t-0002 仍被任务 t-0001 作为前置依赖，请先在 t-0001 解除」**（点名引用方+解除指引，换行不截断）。
  - 零写：t-0002.json 仍在，t-0001.predecessorIds 仍 ["t-0002"]。
  - 图：`R2-predecessor-reject-delete.png`

### R3 真实键盘导航 — 环境死路（不签 PASS）
- 本 Browser Use 栈 bu.press_key/hotkey **不向该 renderer 派发 keydown**（window 探针捕获=[]）。
- R3-01/02 真实键盘行移动**无法在本环境实测**；JS dispatch 仅诊断不算通过。
- 详见 `R3-keyboard-delivery-evidence.txt`（含纯函数 nextRowId、门控 shouldHandleGlobalKbd 源码事实+实测 client hash 与冻结口径不一致）。

### R4 真 390px 顶栏 — 环境受限（不伪造）
- CDP `Emulation.setDeviceMetricsOverride` 被本 cdp 桥接拒绝（-32001 session not found）；cu 桌面缩放本子代理不可用；CSS 宽 390 属禁止的冒充。
- 故**真 390 视口未能实测**。最窄可达真实视口 pw=712 时，顶栏无横向溢出（scrollWidth=clientWidth=651），按钮折行不截断。

### R5 移动入口 + 会议行动项 promote
- 移动：行内「移动」按钮 → 弹窗「移动「视觉设计」到…（移动后自动重排 WBS 编号）」含根层级/1需求梳理/1.1登录接口联调选项+取消；cancel 后 t-0002 仍 code=2/parent=null（零写）。
  - 图：`R5-move-picker-visible.png`
- 会议行动项 promote：点 ai-001「转任务」→ confirm「把行动项「确认里程碑范围」转为项目任务？（负责人/截止日一并带入）」→ accept → Notice「已创建任务 t-0004…并回写行动项关联」。
  - 落盘：t-0004.json（title=确认里程碑范围, projectId=p-0001）；mtg-0001 action ai-001.taskId="t-0004"、owner=Ice 带入。**无 Failed to fetch**（旧 3098 问题在稳定实例复现消失）。
  - 反向回链：t-0004 抽屉顶部「来自会议 mtg-0001「需求评审会」」蓝色链接；ai-001 区显示「已转 t-0004」。
  - 图：`R5-meeting-action-promoted.png`、`R5-task-source-from-meeting.png`

### R6 甘特
- 日期 tick 2026-10-02…10-25 均匀分布不重叠；红色今日线在 10-13；未排期任务 t-0004 行显示「未排期」badge；点甘特条(pm-gantt-bar)开对应任务编辑抽屉。
  - 图：`R6-gantt-ticks-today-unplanned.png`、`R6-gantt-bar-opens-drawer.png`

### R7 AI 副驾
- 车道下拉可选「PoC 车道/生产车道」。
  - PoC 引导：「PoC 为公共网关，仅概念验证」；生产引导：「生产车道需已配置自有 API Key」。图 `R7-copilot-prod-lane-nokey.png`
- PoC 真请求：输入「当前项目进度健康吗？」→ 发送钮变「思考中…」（请求中禁用=禁连发）→ 返回诊断结论（点名 t-0001 延期/t-0004 无截止）+ 2 步操作计划（勾选/需确认才落库）+ 模型不确定性内联提示；完成后发送钮恢复「发送」。
  - 图：`R7-copilot-poc-reply-plan-confirm.png`
- prod 真实 Key 对话仍唯一人工项（MANUAL_PENDING）。

### R8 前置依赖树 checkbox（第二轮补测）
- 前置区 checkbox 实测 **15×15px**；label 为 flex、**gap=6px**（在 4–8px 要求内）、padding-left 20px 缩进。
- 标签带 WBS 编号前缀（1.1登录接口联调 / 2视觉设计 / 3确认里程碑范围）；整行 label 文本点击可切换勾选（实测 false→true）。
- 合法前置往返：t-0001.predecessorIds=[t-0002] GUI 勾选→保存→重开抽屉 t-0002 仍勾选（回显）。
- 图：`R8-predecessor-clean.png`、`R8-predecessor-checkboxes-15px.png`
- **未做**：20 任务 3 层长树展开、done 行 label 点击（时间所限，不称全通过）。
- 注：WBS 后代（如 t-0001 的子 t-0003）作为 predecessor 属 DAG 合法语义、不必然成环；本轮未保存/未回测该方向往返，**不判定其非法**。
- **仍未做**：层级 padding 递增（现有 data 仅 2 层 root+1.1，无第 3 层种子）、done 行样式、clear 保存为空、真环拒绝零写。

### R7 aria-busy 复测（新 bundle d43353ea）— 浏览器卡死受阻未完成
- 新 bundle `lib/client.js` sha256=d43353ea9a87fce63c2dd891f25c87c7258e420e097cd2c3da8e0330aedac3e5（与开发交付一致），隔离实例 v6 加载成功（日志「存储领域 pmtool 已打开」、3098 listening、bundle hash 实测一致）。
- 导航到 PM 后做一次 `navigate("reload")` 刷新，随后整个真实 Chrome 对所有 Browser Use 调用（snapshot/page_info/js/resync/list_tabs/new_tab）一律 RuntimeError: timed out，多 tab 悬停；服务端日志仍健康、无 stack。
- **不猜原因**：仅记录现象=reload 后浏览器前端卡死。R7 aria-busy DOM 复测（role=log aria-live=polite aria-busy=true→false）与 R8 上述未做项，交主执行端/下轮接续。

### R6 甘特（第二轮无遮挡重测）
- 关净菜单/通知后实测 `.pm-gantt-tick` 共 12 个：2026-10-02→11-06，两两 left/right 相邻 **零重叠**，间距 22–27px 均匀。
- `.pm-gantt-today` 今日线 left=471，对齐 10-13 tick（当前日 2026-10-13）。
- bar 三行 centerY=415/439/463 与左侧任务行对齐；未排期任务 t-0004 无 bar、行显「未排期」。
- 图：`R6-gantt-clean-ticks-no-overlap.png`（替换此前带菜单遮挡旧图 R6-gantt-ticks-today-unplanned.png，旧图不再作为无重叠证据）。
- 未做：跨年 tick（数据仅 2026-10~11）。

### R7 副驾等待态（第二轮补图）
- 发请求后发送钮变「思考中…」（禁用=禁连发），面板显「思考中…」状态行、问题原文回显；无 aria-busy/loading 节点（实测无该 attr，记为缺项）。
- 图：`R7-copilot-waiting-thinking.png`（PARTIAL：等待态可见，aria 未提供）。

## 未决/环境提示
- 被测 bundle：本轮已切到新 `lib/client.js` sha256=d43353ea9a87fce63c2dd891f25c87c7258e420e097cd2c3da8e0330aedac3e5（aria-busy 候选）；此前冻结值 9ea93fbc… 为上一版。先前误把分包 chunk panel.js=e5bdbb… 当 bundle 比对而误报，已更正；未重 build。
- R3 真实键盘、R4 真 390：本 SubAgent 调 `mac_computer_use_tool(plane="cu")` 工具层返回「子任务暂不支持操作电脑，请在主执行端完成」——需主执行端 cu，非用户手测、不豁免，保留 BLOCKED。CDP Emulation 亦被桥接拒。
