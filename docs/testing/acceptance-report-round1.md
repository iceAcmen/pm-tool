<!--
首轮验收报告（终版）。独立测试专家所有；被测提交 a8e8ea4。
本报告为门禁结论唯一出处。
-->
# 首轮验收报告（被测提交 a8e8ea4）

> 结论出具：独立测试专家 s_000EgMVDudw（**未改任何产品代码、未删任何测试文件、未自改自验**）。
> 被测提交：`a8e8ea40e7b3add694b053142517369fae3b7a2a`（main）。
> 证据：① 仓库内回归产物 `verify-run-20261012-152121/REPORT.md` + `logs/_summary.tsv`（本专家已复核，非照搬）；② 代码/断言行；③ 测试专家自留审计日志（仅辅助、不可携带，决定性结论已摘要入本仓库）。

---

## 0. 门禁裁决（先给结论）

# 🔴 总门：NOT PASS —— 禁止开始下一功能、禁止进入发布候选

依据 ADL-045：`FAIL / BLOCKED / NOT_RUN` 一律 ≠ 通过；**网页实测（GUI）是硬门槛**。当前网页实测 / 页面样式 / 用户体验三类 **BLOCKED**，外加 1 个测试设施缺陷（T-DEF-008）与 1 个功能缺口（T-DEF-004）。**36/36 离线 verify 全绿不构成放行理由**——历史教训正是「离线全绿、真浏览器因 bundle 残留 zod 崩溃」（9b15baa）。

阻塞期**只允许**：缺陷修复、补测、文档。**不得开新功能、不得堆新需求。**

---

## 1. 五类结论

| 类别 | 结论 | 依据 |
|---|---|---|
| 功能（域/命令/状态机/负例） | ✅ **PASS** | 36/36 退出 0；gantt/tinline/war-room/ask-apply/client-bundle 等断言经本专家代码审计为真断言，非 HTTP200/按钮存在式 |
| 集成（存储/并发/重启读回/导入导出） | ✅ **PASS（附 1 项设施降级）** | 36/36；verify-integration 并发计数/恢复 deepEqual/子进程读盘为强断言。**但 restore 安全快照的测试隔离 FAIL（T-DEF-008），产品逻辑本身正确** |
| 网页实测 GUI | ⛔ **BLOCKED** | 本角色无可用 GUI 驱动；按规则禁止 puppeteer/shell 绕过；e2e-web-real 骨架自述未跑。新视图交互（树折叠/直达抽屉/行内落库/甘特拖拽改期/作战室/ask 抽屉/网页恢复）全部未实测 |
| 页面样式（主题/390窄屏/溢出/焦点/空态/加载） | ⛔ **BLOCKED** | 旧 27/27 仅覆盖 R5–R12；TaskTree/GanttView/WarRoom/AskDrawer 无真实目视 |
| 用户体验（真实键盘/直达流程/取消与恢复成本/中文文案） | ⛔ **BLOCKED** | reducer/契约层已测；真实 DOM 键盘事件、树下导航、项目记忆 reload 回填、流程成本未实测 |

> 因 GUI/样式/UX 三类 BLOCKED，即使功能与集成全绿，整体仍 **NOT PASS**。

## 2. 确认做对、勿改坏的资产

1. 离线优先 + 草稿确认制：AI dry-run、confirm 才落库；无 Key/超时/限流中文降级且台账不写。
2. restore 产品安全逻辑：预检 format/formatVersion、缺 confirm 只演练、替换前先写安全快照、备份排除 checks。
3. ask-apply 后端守卫：跨项目拒绝、updatedAt 冲突拒覆盖、重复确认幂等、非法日期部分成功互不污染。
4. client bundle zod 清零：`lib/client.js` 仅 require react/jsx-runtime，verify-client-bundle 白名单断言通过。

## 3. 缺陷登记（OPEN，交开发修复；测试专家不自行修）

| 编号 | 严重度 | 类别 | 现象 | 证据 | 建议 |
|---|---|---|---|---|---|
| **T-DEF-008** | ~~S2~~ → ✅已关闭 | 测试设施/集成隔离 | round2 复验通过（见 reverification-round2.md §6）：verify-backup 已传 backupDir，亲自跑专项退出0，`packages/backups/` 跑后仍 81 文件、hash 与基线逐位一致，安全快照落隔离目录 | 见 §6 | 关闭；改动保留于 verify-backup.mjs |
| T-DEF-004 | S2 | 功能 | 域级取消不写库（verify-copilot-cancel spy writes=0）**已关闭**；真实 ask 抽屉"取消"按钮不写库的 **GUI 分项仍 BLOCKED** | 脚本域级断言；无浏览器 | GUI 分项待真实浏览器 |
| T-DEF-001 | S1 | 网页实测 | 新功能真实浏览器交互全部未测（树折叠/直达抽屉/行内落库/甘特拖拽改期/作战室/ask 抽屉/网页恢复/网页 csv-xlsx 拖拽导入） | e2e-web-real.mjs L6-7 | 具备 GUI 能力者执行真实浏览器验收，测试专家复核 |
| T-DEF-002 | S1 | 网页实测 | 甘特 DOM 拖拽→`shiftDatesByDrag`→`execute('/pm task update')` 接线与落库未验证 | verify-gantt 仅纯函数 | GUI 拖一条任务条，断言 start/due 落库且刷新保留 |
| T-DEF-003 | S2 | 用户体验 | 行内编辑在真实面板调用 buildUpdate 并落库、不与 j/k 冲突未测 | verify-task-inline 仅纯函数 | GUI 实测行内改状态 + 重启读回 |
| T-DEF-005 | S2 | 页面样式 | 新视图亮/暗主题、390 窄屏溢出、焦点、空态 CTA、加载反馈、中文文案未目视 | 旧 27/27 仅 R5–R12 | 真实浏览器逐新视图截图对比 |
| T-DEF-006 | S3 | 用户体验 | j/k 在树下导航、项目记忆 reload 回填仅 reducer/骨架级 | verify-keyboard=reducer；e2e OPT-03 骨架未跑 | 真实键盘事件 + reload 回填 |
| T-DEF-007 | S4 | 文档 | panel.tsx 实际 3048 行，产品文档 01 写 2619 行 | `wc -l` vs docs/product/01 | 归产品 PM 同步 |
| T-DEF-009 | ~~S4~~ → ✅已关闭 | 健壮性 | round3 复验：tokenizer 无 eval/shell、引号空格路径端到端可用、未闭合引号安全失败；专家含空格 TMPDIR 跑 verify-backup 退出0，默认 backups hash 不变（见 reverification-round2.md §7） | §7 | 关闭；改动保留于 commands/backup.ts、scripts/verify-backup.mjs |

## 4. 测试产物处置（T-DEF-008 关联，测试专家**不擅删**）

- 泄漏位置：`packages/backups/pmtool-backup-2026-10-12T*.json`（**50 个**，均为测试数据「备份项目」，gitignored）。
- 本专家**未删除任何文件**（按指令）。处置建议交开发/所有者：确认无真实备份混入后，由开发清理这批测试快照；清理动作与修复同批提交，测试专家复验「隔离后该目录不再新增测试快照」。
- 真实 `data/` 未被污染：`data/pmtool/projects/*.json` mtime 仍为 2026-10-10，回归报告亦称 data mtime=10-12 10:31 未变。

## 5. 复验范围（新提交后必重测）

- 修 T-DEF-008 → 重跑 verify-backup，断言 `packages/backups/` 不再新增测试快照；隔离目录内安全快照仍正确。
- 动 `client/panel.tsx`/`panel.css` → 全部 GUI/样式/UX 结论（当前全 BLOCKED）。
- 动 gantt 拖拽接线 → T-DEF-002；动行内单元格 → T-DEF-003；动 ask 守卫 → 副驾全套 + T-DEF-004；动 backup.ts → 备份恢复往返 + 安全快照。

## 6. 给开发的下一步（阻塞期）

1. **T-DEF-008**：restoreBackup 调用补显式隔离目录；同批清理 `packages/backups/` 测试快照（测试专家不代删）。
2. **T-DEF-004**：补 ask 取消即弃用例（成本低）。
3. **T-DEF-001/002/005**：在所有者本机 Chrome 跑真实浏览器验收（沿用 e2e-web-real 骨架或人工清单），交测试专家独立复核后出「五类全 PASS」或「新增 FAIL」终签。
