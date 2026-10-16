# 工作进度流水账 progress.md

> 本文件记录项目「每个阶段已完成、进行中、待办」的最新状态；给维护者与迁移者快速判断进度使用。每次有进展即更新，最新内容置顶。

最后更新：2026-10-17（doubao-work **#25 真 390px 窄窗响应式正式修复**：骨架+9 视图在 390px 无外壳溢出，窄屏规则全隔离在 ≤560px、桌面不变，配色 dsw/pm token 零 hex 跟随浅深。build=0、guard 71 脚本/70 通过/1 失败（verify-export 路径假象）/0 污染；隔离 3155 真实 Chrome 浅/深实测 20/20，证据 docs/verification/narrow390-20261016/。分支 p0/narrow-390，不 merge/不 push）

## 当前阶段：#25 真 390px 窄窗响应式正式修复·已核验（2026-10-17，doubao-work，分支 p0/narrow-390，不 push）

- **目标**：GI-WEB-14 / PROD-07 遗留的真 390px 窄窗从 MANUAL_PENDING 转正式修复；390px 视口下面板骨架（顶栏/抽屉/弹窗/表单/按钮组）+ 9 视图无重叠/裁切/横向外壳溢出，≥1024 桌面不变。
- **做法**：全部窄屏规则隔离在 `@media (max-width:560px)`，不命中桌面；天然宽内容（任务表 `.pt-scroll`、甘特 `.pm-gantt-scroll`、数据表 `.pm-table-scroll`）容器内部横滚，外壳不溢出。
  - `panel.css`：顶栏换行/内距收敛、项目菜单钳 92vw、抽屉 `min(560px,100vw)`+单列表单、move-picker 不锁宽、副驾编辑行 6→2 列、矩阵 3→2、图例换行、旧人员名列不锁 130px。
  - `tasks.css` 搜索通栏/工具条换行/主按钮通栏；`people.css` 固定 6 列网格→可换行卡片（隐藏表头、卡片头纵向、说明可换行）；`meetings.css` 行动项 4 固定列→单列堆叠；`milestones.css` 概览条换行/率格不锁 180；`risk-issues.css` 内距收敛/矩阵首列 44/第二行换行；`deliverables.css` 双栏→单列；`gantt.css` 工具栏换行/左标签 150px/时间轴内部横滚；`overview.css`/`reports.css` 补 ≤560（快照 7→3 列）。
  - 顺手去两处硬编码白：`.pt-primary` `#fff`、`.pm-chip-primary` `rgb(255,255,255)` 均改 `--dsw-alias-label-primary-foreground`。
- **验证**：`pnpm build`=0；`verify-isolation.mjs` **71 脚本 / 70 通过 / 1 失败（仅 verify-export.mjs 硬编码 `/pm-tool/exports/` 路径在 worktree 下不匹配，已知环境假象，非回归）/ 污染 0**；`verify-gui-contract.mjs` 补 #25 静态契约（每视图+骨架含 560 断点、零 hex、内部横滚容器）。隔离真实 Chrome 390px（独立 DSH_HOME/存储/备份/端口 3155，软链指 worktree 包，正式 3080=PID 66364 未变）：真实响应体证明聚合包含 #25 标记+560 断点，浅/深 ×9 视图+新建抽屉 20/20 无外壳溢出。证据 `docs/verification/narrow390-20261016/`。
- **边界**：零新增依赖、零 schema、零业务逻辑、未改 tsx DOM 契约；不做 #22/#23/#24。
- **下一步**：待协调者在主树恢复全绿后统一 rebase/合并到 main；之后看板 P2 → 9 视图重设计。

## 历史阶段：#21 口径配置化·已核验（2026-10-16，doubao-work）

- **口径清单（原值→设置键，现值即默认）**：健康分每逾期任务 3/每受阻 4/每高风险 6/每严重风险 10/每逾期里程碑 8；封顶 15/12/20/16；灯线绿 80/黄 60；临期窗口 7；过载阈值 5。`core/stats.ts` 逾期为严格 `dueDate<today`、本无数字阈值，不杜撰宽限键。
- **core 可注入、缺省回落**：新增 `core/settings.ts`（默认值锁定、`SETTING_FIELDS` 元数据、`normalizeProjectSettings` 整数/区间/灯号倒挂校验、`sameSettings`）；`scoreFromInputs/computeProjectHealth/computeReminders/groupOpenTasksByAssignee/computeKPI/buildAgenda` 接受可选 settings，不传=默认（默认等价），命令行显式参数优先；纯函数/确定性/零写。
- **持久化/命令/UI**：`commands/settings.ts`（`/pm settings` 查看 / `put <json>` 局部合并+整份校验 / `reset` 回落默认），settings 表透明存取+原子写；`web snapshot` 透传 `settings`；顶部「更多」→「口径设置」抽屉，13 字段分组、整数/区间/绿灯≥黄灯内联校验、保存/恢复默认；配色 `--pm-*`（`--dsw-*` 重映射）零 hex，跟随 `body[data-ds-dark-theme]`。
- **验收**：`pnpm build`=0；`verify-isolation.mjs` **71/71 通过、失败 0、污染 0**（before/after=162/162）；新增 `verify-settings.mjs`（默认等价/覆盖/非法/局部合并/reset/全新进程 --reopen 读回/UI 契约/零写 grep），`verify-health.mjs` 补自定义覆盖，`verify-gui-contract.mjs` 补 #21 静态钩子。隔离 Chrome 3141 浅趟默认抽屉→改绿灯线 80→60 保存→概览灯号黄→绿；深趟原生 dark 抽屉。证据 `docs/verification/settings-20261016/`（10-light / 11-after-change / 12-dark）。
- **边界**：不做 #22 副驾写扩展、#23 客观进度、#24 vitest/E2E/CI、#25 390 窄窗；不配生产 Key。
- **下一步**：看板 P2（联动过滤/卡片元素增强/completedDate 历史趋势 UI/markdown 增强）→ 9 页面重设计；GI-WEB-14 真 390 窄窗目视、prod 真实 Key 仍 MANUAL_PENDING。

## 当前阶段：GI-CP 关键路径只读高亮 CPM·已核验（2026-10-16，doubao-work）

- **core 纯函数 `criticalPath(tasks)`（src/core/gantt.ts）**：predecessorIds 依赖图 AON 正/反向遍历，ES/EF/LS/LF（相对组件起点天偏移）、slack=LS−ES，**slack=0 → 关键路径**；确定性、无 I/O、无随机、无墙钟、不调用 run/execute、不回写派生字段、零 schema。
- **诚实降级**：成环 3 色 DFS 标 inCycle、跳过遍历不高亮、不自动打断/改期；缺日期标 missingDate、不补日期/不顺延；自指/悬空计数剔除；多连通分量（并查集）各自取组件最大 EF，短分量无假正时差；多结束汇点 LF=组件最大 EF、内部 min 传播；空输入不抛。
- **甘特只读高亮（gantt.tsx/gantt.css）**：关键条 `pm-gantt-bar--critical`（2px 强调环+淡衬底，ring 不被 overdue/blocked 覆盖）、关键边 `pm-gantt-link-path--critical` 加粗+强调箭头、图例「关键路径 N」、「循环不可计算」「缺日期段已跳过」徽标与 tooltip、条 tooltip「关键路径（总时差 0 天）」、左标签「关键」徽标；配色全走 dsw 别名 token（底层 `--dsw-*`）零 hex，跟随 `body[data-ds-dark-theme]`。
- **验收**：`pnpm build`=0；`verify-isolation.mjs` **70/70 通过、失败 0、污染 0**（before/after=162/162）；新增 `verify-critical-path.mjs`（线性链数值/时差分支/成环/缺日期/多分量/自指悬空/空输入/确定性/零写静态 grep），`verify-gui-contract.mjs` 补静态钩子。真实 Chrome headless 隔离 3131（独立 DSH_HOME/存储/备份，正式 3080=PID 66364 未变）：GI-CP-01 链三条+关键边 2/3+图例+tooltip；CP-02 成环不高亮；CP-03 缺日期无条+未排期；CP-04 深色趟零写哈希一致；CP-05 拖链尾 t-0003 前置 t1/t2 逐字节不变、progress/pred 不动、不顺延。证据 `docs/verification/gui-critical-path-20261016/`（10-light / 11-after-drag / 12-dark）。
- **边界**：只读显示；自动排期/压缩/改期（甘特B 长期观望）本批不做；vitest/E2E/CI 留 #24；不配生产 Key。
- **下一步**：看板 P2（联动过滤/卡片元素增强/completedDate 历史趋势 UI/markdown 增强）→ 9 页面重设计；GI-WEB-14 真 390 窄窗目视、prod 真实 Key 仍 MANUAL_PENDING。

## 历史阶段：看板 P1 拖拽落列/筛选级联/迁移链/窄卡省略·已核验（2026-10-16，doubao-work）

- **P1-① 拖拽像素落列**：编辑器 RGL 启用 isDroppable + onDrop，按松手像素换算的 layoutItem.x/y 落位（点 ＋ 仍追加末尾兜底）；真实浏览器拖拽「任务状态环」落栅格中部、非末尾；onDrop 增加坐标兜底防御。修复阻断缺陷：卡片库原 in-flow 挤压栅格到 7px，改为工具条独占一行、卡片库为左侧窄抽屉、栅格在右侧保持真实宽度并正确重算 colWidth。
- **P1-② 切实体二次级联**：切换数据源实体后，字段选项更新、已选筛选字段/操作符/值整体清空，不残留旧实体筛选；字段→操作符按类型联动。
- **P1-③ 迁移链补全**：persist 迁移改为有序 MIGRATIONS + stepMigrations 逐级 1→…→LAYOUT_VERSION（缺级/跳步抛错，保留 v1）；新增 verify-migration（v1 保留、跳级拒绝、合成链 v1→v2→v3 逐级经过）。
- **P1-④ 窄卡省略**：项目名 flex+min-width:0+单行 ellipsis+title 全名，窄卡不溢出不撑破。
- **验收**：pnpm build=0；verify-isolation 68/68、0 污染（before/after=160/160）；块结构 client.js（gzip≈202KB）+ client.editor.js（≈76KB）+ client.formula-expr.js（≈11.6KB），编辑器块自包含；深+浅截图见 docs/verification/p1-*.png。
- **下一步**：看板 P2（跨卡片联动过滤、卡片自定义元素增强、completedDate 历史趋势真实数据 UI、markdown 富文本增强）→ 9 页面重设计（先出深+浅设计稿待确认）。

## 历史阶段：看板 P0 编辑态异步拆分 + 持久化迁移 dsh-storage·已核验（2026-10-16，doubao-work）

- **成果**：看板浏览态首屏 gzip 由 288.77KB 降到约 **202KB（净回收约 86.6KB / -30%，超出约41KB预期）**；看板布局由 localStorage 改为经 dsh-storage（pmtool 领域 settings 表）跨设备持久化。
- **编辑态异步拆分**：浏览态用纯 CSS 静态栅格渲染、不再静态加载 RGL/zod/expr；编辑器（RGL+卡片库+配置面板+zod 闸门）拆为 `lib/client.editor.js`（gzip≈75.75KB）、公式 expr-eval 拆为 `lib/client.formula-expr.js`（gzip≈11.58KB），均在需要时经 `require.async` 加载；`tsdown.config.ts` 复刻宿主分块机制（client.[name].js + chunk banner + 动态 import 改写）并做运行时 helper 内联与死引用清理，保证异步块自包含。
- **持久化迁移**：新增后端命令 `src/commands/dashboard.ts`（`dashboard put/reset <scope>`）、`web snapshot` 新增 `dashboards:{user,project}`；前端 `persist.ts` 去 localStorage/zod 改结构校验 + 迁移，读写经 execute，`panel.tsx` 经 GlobalBoard 透传；保存中/失败有提示、失败不落盘。
- **提前落地的 P2 后端地基**：Task 新增可选 `completedDate`（状态流转自动采集：非 done→done 记当天/显式日期、done→其它清除）；新增纯函数 `buildCompletionHistory`（只统计真实 completedDate、零数据显式空态、不造假）；新增 `task backfill-completed`（旧 done 据 dueDate 显式推断、无据不编造）。
- **验收**：`pnpm build`=0；`node scripts/verify-isolation.mjs` 67/67 通过、0 污染（before/after=160/160）；新增 verify-dashboard / verify-completed-date，扩展 verify-client-bundle、verify-formula 改指；真实 dsh 宿主（dev 重启 PID 70706/3080）：编辑器块请求 200（无 404）、加卡→保存→整页刷新后仍在、恢复默认→刷新后回默认。深色+浅色、浏览态+编辑态截图与证据见 `docs/verification/p0-bento-perf-20261016/`。
- **下一步**：看板 P1（像素落列/筛选二次级联/迁移链补全/窄卡项目名省略）→ P2（联动过滤/卡片元素增强/completedDate 历史趋势 UI/markdown 增强）→ 9 页面重设计（先出深+浅设计稿待确认）。

## 历史阶段：稳定性地基 S4 + war-room KPI 热修 v0.7.4·19/19 PASS + 真实 Chrome PASS（2026-10-14，doubao-work）

- **背景**：v0.7.3（`eb41b30`）之后的稳定性补丁——不含新业务功能，只做地基加固与一处真实 KPI bug 热修。**全程零 schema**（domain 仍 v1、表集合未变，`taskStatusSchema=z.enum([todo,in_progress,blocked,done])` 拒收 `doing`）。
- **A1 fs-atomic 契约（`src/core/fs-atomic.ts`）**：`atomicWriteFile` 发布协议「同目录 tmp `.{basename}.{uuid}.tmp` → `open(tmp,'wx',0o600)` 排他 → write → fsync → close → `rename` POSIX 原子覆盖 → fsyncDirectory」；rename 前 open/write/sync/close/rename 任一失败，`finally` 仅在 rename 未发生时 `rm(tmp,{force:true})`，**目标文件逐字节不变、tmp 不残留**；rename 后目标即新内容、tmp 已消失。新增可选 `options.tmpNameFactory` **仅测试注入**（制造确定性 tmp 名/真实 EEXIST），生产不传时仍默认 `randomUUID`、对外行为完全不变。专项 `verify-fs-atomic.mjs` 退出 0（含 wx EEXIST 排他闭环 A1-02）。
- **A2 LLM optional 真实 Context（`src/index.ts` + `ai-client`）**：llm **不再列入 inject**（缺 llm 的 profile 仍激活插件），运行期 `ctx.reflect.get('llm',false)` 懒读真实 Context、命令被调时才取并透传 task/meeting/report 三条 AI 命令；缺 provider 时 `generateDraft` 抛中文 `NO_LLM` 降级、核心 domain 与全部非 AI 命令离线可用、业务零写；硬错误码不跨池轮换、英文/stack 不外泄；有 fake llm 走 generateDraft+兜底路由。专项 `verify-llm-optional.mjs` 退出 0。
- **A3 verify runner 聚合 + timeout 分类 + 资产 manifest（`scripts/verify-isolation.mjs`）**：主循环改为任一子进程失败也记录但**不 break**，全部 62 个 `verify-*.mjs` 跑完后聚合「共 N/通过 P/失败 F」；超时（默认 10min/个，`PM_TOOL_ISOLATION_TARGET_TIMEOUT_MS` 可调）经 `describeFailure` 对 `ETIMEDOUT`/`killed` **单独分类为「超时（上限…实际…）」**、不误落 spawn 异常；子进程 env scrub 剔除 `PM_DATA_ROOT`/`DSH_PM_BACKUP_DIR`（只打变量名不打值）；正式数据/备份/导出 root（守护清单见 `verify-isolation.mjs` 的 `WATCH`）跑前跑后各算一次 sha256+mtime manifest 做集合 diff，任一新增/删除/变 hash/变 mtime 即单独计污染失败；退出码无歧义（任一脚本失败或污染→exit 1，全绿 diff 空→exit 0）。`walk/buildManifest/diff/WATCH/runOne/runGuard` 导出供 `test-isolation-guard.mjs`/`test-verify-runner-aggregate.mjs` 复用同一套判定。
- **war-room「进行中」KPI 热修**：根因 `computeKPI` 误判 `status==='doing'`（真枚举 `in_progress`）致「进行中」KPI 恒为 0。`status.ts` 新增纯谓词 `isDoneStatus`/`isInProgressStatus`（`TASK_STATUSES` 未变）；`war-room.ts` 的 inProgress 改用 `isInProgressStatus(t.status)`（修复点），done/overdue 抽闭包 `isTaskDone=isDoneStatus(s)||progress>=100`、KPI 与 buildAgenda 复用、语义不变；`verify-war-room.mjs` 补真枚举五态回归守卫。
- **口径与边界**：**零 schema**（不新增表列、不升 domain、不改落盘布局）；不自动排程/改期/顺延，doctor 仍只读不自愈。**v0.8「客观进度」（checklist/progress-derivation/汇报 calcVersion）矩阵已冻结但未实现（NOT_RUN/deferred）**，本批只携带其前置 war-room 热修，不声称已交付。
- **验收（S4 独立测试专家实测）**：总门 **✅ 19/19 PASS**；`pnpm build`=0；全量 guard **62/62** 专项全绿；权威资产 **before=160/after=160、污染 0**、退出码 0。矩阵 `docs/testing/stability-s4-acceptance.md`，证据 `docs/verification/stability-s4-20261014/full-guard.txt`。
- **验收（war-room 真实 Chrome 隔离实例）**：真实 Chrome v139 headless（puppeteer-core，无 Key）独立 `DSH_HOME`+独立 storage root+独立备份目录+端口 **3122**；面板表单构造 p-0001+5 任务，KPI 实测 总数5/完成率40%/**进行中=1（blocked 不计；修复前渲染 0）**/逾期1/状态分布2·1·1·1/议程仅一条逾期/磁盘 5 条全真枚举/console·pageerror=0；`verify-war-room.mjs`、`verify-web.mjs` 退出 0。证据 `docs/verification/gui-war-room-status-20261014/`。
- **计数差异（如实分开，非矛盾）**：S4 guard = **160**、war-room 轮 = **159**——两轮计数差异为**跨轮 session / 缓存文件自然轮转**所致；每轮内部均严格 before=after、污染 0，属各自独立零污染结论，非正式资产漂移。
- **ISS-027 精确 PID 流程（继续遵守）**：隔离 PID 8436（首轮 patch root 误指上一轮 scratch）→修正重启 PID **9859**，均 `--port 3122`/`--no-open`；仅对 8436/9859 分别 `kill -TERM` 一次验 EXITED、3122=DOWN；正式 3080=PID 93536/3091=PID 93537 启动前后均 LISTEN、PID 未变。首轮 5 条误写仅落 `.tmp` 隔离 scratch、已清，正式 `data/` 未受影响。
- **零污染 / client hash（已实测锁定）**：S4 **160**、war-room **159** 资产均 before=after、changed/added/removed=0；`shasum -a 256 packages/dsh-pm-tool/lib/client.js` = `9d0b118c6f469856c5c7caee52175a88b0a2082fc4333daf2b2a45bc2302aa8b`（**332510 B / 332.51 kB**，最终 build 已稳定、实测锁定）。
- **状态**：本批仅回写版本/living docs 口径（package.json 0.7.4 + releases/README/changelog/progress/handoff/onboarding），**未改产品 src、未改测试专家 docs、未改证据、未提交**。
- **下一步**：待用户授权执行最终 commit/注解 tag `v0.7.4`/push（client sha256 已实测锁定 `9d0b118c…`）；v0.8 客观进度实现、GI-WEB-14 真 390 窄窗目视、GI-CP 关键路径、M-01 prod 真实 Key 仍为后续/人工项。

## 历史阶段：甘特拖拽手感与成功提示热修 v0.7.3·代码审查 APPROVE / Chrome 22 项全绿 + 回归 7/7 PASS（2026-10-14，doubao-work）

- **背景**：用户在 v0.7.2（`310c768`）实测反馈——拖拽成功后弹出**全字段深色大卡 Notice**（任务ID/WBS/项目/父任务/标题/说明/负责人/状态/优先级/起止/进度/里程碑 13 行 dump），盖住甘特工作台（与 `ClipboardTemp/f97c15cd….png` 一致）。
- **功能（热修）**：①根因修复 `.pm-gantt` 无 `flex-wrap` 时，hint(`flex-basis:100%`) 与 labels(230px)/scroll(flex:1) 挤同一 flex 行竞争，致 `scroll` 被 shrink 到宽 0（画布消失）；加 `flex-wrap:wrap`，hint 独占下一行，首行宽度不随 hint 出现/消失变化。②拖拽走 `run(...,{quiet:true})`、单 refresh：松手即落盘+就地重渲染，日期即时更新无需 F5，移除 `onSaved()` 二次刷新。③quiet 成功不弹全字段大 Notice，改条下 inline `role=status`/`aria-live=polite`「已更新：起 ~ 止」约 3s 自清除。④`saving` inflight 锁：保存中禁连拖、`finally` 解锁，防并发覆盖/ghost。⑤失败回落：条体从未本地改动、未 refresh 自然回落拖前坐标无残影，内联「更新失败，请重试」6s；quiet 不吞错（run catch 仍 `setMessage`，全局错误红框 Notice 保留）。⑥unmount `clearTimeout` 清状态定时器；payload 白名单仍仅 `startDate`/`dueDate`。
- **口径与边界**：**零 schema**（只读既有 startDate/dueDate/progress/predecessorIds，不新增表列、不改 taskRecordSchema、不升 domain、不动 storage.ts）；不自动顺延后继；仅动 `src/client/panel.tsx` 交互层 + `panel.css` 一行 flex-wrap（产品代码热修另计，本批只回写文档口径）。
- **验收（真实 Chrome 隔离实例，执行端采证 + 测试专家回填）**：真实 Chrome v139 headless（puppeteer-core，无 API key），独立 `DSH_HOME`+独立 storage root+独立备份目录+空闲端口 **3120**；**22 项全绿**（拖前 clientWidth=768>0 / 拖后 bars=9·svg·arrow 均在 / 拖拽即时更新无需 F5 / `.pm-notice` count=0 无全字段大卡 / inline role=status 文本正确 / ~3.5s 自消 / 连拖只落≈1 步无 ghost / <4px 点开抽屉零写 / 横滚 220px 后拖不误触 / 父虚线派生条不可拖 / 故障内联错误 / 故障全局错误不被 quiet 吞 / 故障条 geom 576px 前后一致回落 / 故障服务端零写 / 重载读回 bars=9 / 重启读回 progress=40·predecessorIds 未动 / console·pageerror=0）；静态契约 `scripts/verify-gantt-drag.mjs` 退出 0（A flex-wrap / B quiet 单次 refresh / C catch 不吞错 / D saving 锁+unmount timer / E aria-live / F payload 两键）。证据 `docs/verification/gui-gantt-drag-hotfix-20261014/`。
- **回归新增 7 项（独立测试专家最终签 7/7 PASS）**：GI-WRITE-06/07 + GI-WEB-16~20，覆盖拖拽后 DOM 在/日期即时更新（GI-WEB-16）、成功 Notice 不替换工作台（GI-WEB-17）、失败回落原图并提示（GI-WEB-18+GI-WRITE-06）、快速连拖/拖后点击/横滚/父条不可拖（GI-WEB-19/20）、白名单+重启读回（GI-WRITE-07）、正式数据隔离（GI-WEB-20）；判定权已由测试专家回填为 **7/7 PASS**。
- **ISS-027 精确 PID 流程（继续严格遵守）**：隔离监听 PID=86864 / `--port 3120` / cwd=`~/Projects/dsh-pm/deepseek-harness` / `--no-open`；仅对 86864 `kill -TERM` 一次（优雅退出，未用 KILL/未 pkill），验 EXITED、3120=DOWN；正式 3080=PID 69064 / 3091=PID 69065 启动前后均 LISTEN、PID 未变（8326=69065 内部口）。
- **零污染 / client hash（已实测锁定）**：正式 `data/`/`backups`/`exports` **156 资产文件本轮零变化**（before=after=156，changed/added/removed=0）；`shasum -a 256 packages/dsh-pm-tool/lib/client.js` = `68238d1a37c4eccfe16ff1699b91310e304d47eddc01466ac19b5193892131d8`（332139 B / 332.14 kB），bundle 含 `pm-gantt-bar`、宿主合并 bundle HTTP 200。
- **状态**：本批仅回写版本/living docs 口径（package.json 0.7.3 + releases/README/changelog/progress/handoff/onboarding），**未改产品 src、未改测试专家 docs、未改证据、未提交**。
- **下一步**：待用户授权执行最终 commit/注解 tag `v0.7.3`/push；GI-WEB-14 真 390 窄窗目视、GI-CP 关键路径、M-01 prod 真实 Key 仍为后续/人工项。

## 历史阶段：甘特排期视图信息增强 v0.7.2·独立测试专家最终签 34/35 PASS（2026-10-14，doubao-work）

- **功能**：在 v0.7.1=`02f42d1` 基线上对甘特「信息可读性」做增强——**根因修复 `--pm-accent` 从未定义致甘特条 `color-mix` 退化为透明**（正式定义 `--pm-accent: var(--dsw-alias-state-business-primary)`，全色值走宿主语义变量不写死 hex）；起止日期直显（`labelDates` MM-DD~MM-DD + 窄条外置 sideLabel，不只藏 tooltip）；0/部分/100 进度条内实心层按 `progress/100` 填充（done/≥100=完成态，纯渲染不写库）；`predecessorIds` 为唯一真源的只读 SVG 依赖箭头（`pointer-events:none`，自指/成环/悬空/缺日期诚实 skipped 降级）；父子 effectiveRange 只读派生（`min(子 start)~max(子 due)` 虚线派生条，不回写父日期）；ARIA + `localTodayIso()` 本地今日线轴外钳制 + 里程碑缺 targetDate 返回 null 防 NaN；拖拽整条平移、落库 payload 白名单仅 `startDate`/`dueDate`，不动 progress/predecessorIds/status/assignee、不自动顺延后继。
- **口径与边界**：**零 schema**（只读 v0.7.1 既有 startDate/dueDate/progress/predecessorIds，不新增表列、不改 taskRecordSchema、不升 domain、不动 storage.ts）；**关键路径 deferred**（GI-CP-01~05 未新增最长路径/高亮代码，按裁决 N/A 不计失败，成环/缺日期降级由 GI-PURE-05 `dependencyEdges.skipped` 覆盖）；不做自动排程/自动改期/自动补日期/自动顺延，doctor 仍只读不自愈。
- **验收（独立测试专家最终签，2026-10-14，含真实浏览器）**：范围内 **34/35 PASS**——AUTO 纯函数 11/11、INT 写路径 5/5、COLLAB 红线 4/4、GUI 14/15；**父 effectiveRange 聚焦 GUI 复验 PASS**（父派生范围 `min(子 start)~max(子 due)` 虚线条、不回写父日期、无排期子→不画父条，浏览器聚焦复验通过）；**🟡 GI-WEB-14 真 390 窄窗 MANUAL_PENDING**（实测视口 768px，沿用 PL-WEB-11 留所有者本人目视，不阻塞）；GI-CP-01~05 全部 ➖ N/A deferred。`pnpm build`=0、`verify-gantt.mjs`/`verify-gui-contract.mjs`/`verify-isolation.mjs`=PASS；真实 Chrome headless 隔离实例（独立 `DSH_HOME` + 端口 3102，正式 3080/3091 未触）证据 `docs/verification/gui-gantt-information-20261014/`；正式 `data/`/`backups`/`exports` **157 资产文件零污染**（before=after）。被测基线 = `02f42d1` 之上未提交工作树；client bundle 完整哈希 `dcf44a4a…`（`shasum -a 256 packages/dsh-pm-tool/lib/client.js` 实测）。验收矩阵 `docs/testing/gantt-information-acceptance.md`。
- **状态**：本批仅回写版本/living docs 口径（package.json 0.7.2 + releases/README/changelog/progress/handoff/onboarding），**未改产品 src、未改测试专家 docs、未改证据、未提交**。
- **下一步**：聚焦父日期 GUI 复验（父 effectiveRange 拖拽边界）**已 PASS**；待用户授权执行最终 commit/tag/push（注解 tag `v0.7.2` 指向最终 release commit）；关键路径高亮、真 390 窄窗目视、M-01 prod 真实 Key 为后续/人工项。

## 历史阶段：Web polish 三件套 PROD-10→09→04 已实现·独立验收 27/27 PASS（2026-10-13，doubao-work）

- **功能**：v0.5.2 Web 侧三缺口一次补齐——PROD-10 任务抽屉顶部只读显示「来自会议 mtg-xxxx · 会议标题」并一键直达该会议（前端反查 `meetings.actions[].taskId`）；PROD-09 进度汇报表每行与时间相邻上一份固定快照 diff 三指标并出「↑5% / ↓1 / 持平0」文字箭头徽标；PROD-04 任务行「⋯ 移动到…」树选择器改父，一次确认＝原子改父+项目全量 renumber。
- **口径与边界**：**零 schema**（domain 仍 v1、9 表）。PROD-10 多来源按会议日期倒序→id 倒序确定性取第一条、附「另 N 场」提示，来源会议删除则安全隐藏；PROD-09 在全量 periodEnd/id 排序列表上求相邻（不受搜索/状态筛选影响），三指标＝averageProgress / overdue_task 异常数 / exceptions 总数，首份无徽标、零差显「持平0」、文字+箭头非仅靠色；PROD-04 选择器排除自身+后代（后端环检测仍为硬门），后端单写队列内原子复合、失败整树回滚、取消零写，P0 不做拖拽/中间插序。
- **验收（独立测试矩阵签发，2026-10-13）**：总门 **PASS——27/27**，0 FAIL/BLOCKED/NOT_RUN；MANUAL_PENDING=0（真 390 窄窗沿用 PL-WEB-11 不在本门重复）。AUTO：`build`=0、full isolation guard=0、3 个新专项 verify（`verify-meeting-source.mjs` / `verify-report-diff.mjs` / `verify-task-move-renumber.mjs`）全退出 0；GUI：隔离实例端口 3095 真实 Chrome 逐用例过证（证据 `docs/verification/gui-web-polish-20261013/`）；正式 data/ 与 backups 149 文件 hash+mtime 零污染。产品契约见 `docs/product/09-web-polish-design.md`；验收矩阵 `docs/testing/web-polish-acceptance.md`。
- **状态**：本批仅回写产品/living docs 状态，**未改 `src/`、未改 `docs/testing/`、未提交**。
- **下一步（主线）＝schema v2**：PROD-11（任务 `predecessorIds[]` 依赖）、PROD-21（repoUrl/branch 仓库联动）、PROD-23（项目健康分 + 崩溃原子恢复）。

## 历史阶段：PROD-24 副驾多步规划已实现·独立验收 PASS（2026-10-13，doubao-work）

- **功能**：把 PROD-20 副驾的扁平动作数组升级为多步计划卡——模型可输出 `{"plan":[…]}`（每步 stepId/title/reason/action/needs[]/riskNote?），前端按 DAG 拓扑渲染、每行 checkbox 默认全选、行内只允许改 5 标量（非法即时标红禁用确认）、3 条确定性软风险琥珀提示（不禁用）；【整批执行】一次 ask-apply，【逐步执行】前端逐步调（每次重读 domain）；拒绝红行（如 task.delete / 环依赖）不可勾选。
- **口径与边界**：domain 仍 v1、零新表、不写 settings、计划只在前端内存（关面板即消散）；唯一写动作 `task.update`（patch：status/progress/assignee/startDate/dueDate）；DAG 环/悬空/自指**只拒该步**（其下游级联拒），整份 >8 步（或 >10 任务）**整份拒绝**；同目标任务隐式串行 + **链式 baseline**（整批内后者用前者落库后的 updatedAt，不误判冲突）；跨调用真实外部冲突仅拒相关步 + 依赖级联；幂等键扩为 `projectId+JSON(selectedOrderedActions)+JSON(baseline)`（60s）；取消/降级零写（27 个业务 JSON sha/mtime/size 全不变）；旧 `{"actions":[…]}` 输出自动包平凡计划、v0.5 链路回归不破。
- **验收（独立测试矩阵签发，2026-10-13）**：总门 **PASS**——49 项 AUTO/GUI 可自动项全绿，0 NOT_RUN/0 FAIL/0 BLOCKED；自动化门 `build` 退出 0、44 个 verify 脚本全绿（新增 `verify-copilot-plan.mjs` / `verify-copilot-plan-cancel.mjs`，扩展 `verify-ask-apply.mjs`）、正式 `data/` 与 backups 149 文件 hash+mtime 零污染；GUI 门在隔离实例 127.0.0.1:3093 真实 Chrome headless（未碰 3080/3091/data）逐用例过证。**2 项 MANUAL_PENDING（不阻塞）**：CMP-DEG-05（真实免费模型限流/乱码/无 Key 实机）、CMP-GUI-11（真 390px 窄窗目视）。产品契约见 `docs/product/08-copilot-multistep-design.md`；验收矩阵 `docs/testing/copilot-multistep-acceptance.md`；GUI 证据 `docs/verification/gui-copilot-multistep-20261013/`。
- **状态**：本批仅回写产品/living docs 状态，**未改 `src/`、未改 `docs/testing/`、未提交**（多步候选在工作树）。
- **下一步（主线）**：**Web 体验补齐 = PROD-04（任务「移动到…」Web 改父）/ PROD-09（汇报表相邻完成率·逾期·异常数对比徽标）/ PROD-10（任务详情显示「来自会议」并直达）**；三者均为纯前端/小改 core、不动 schema。**其后才进 schema v2**：PROD-11（任务 predecessorIds 依赖）、甘特B 关键路径、PROD-23 健康分。

## 历史阶段：PROD-07 人员与负载视图 v0.5.1 已实现·独立验收 PASS（2026-10-13，doubao-work）

- **功能**：新增顶层「人员」tab，跨项目按 `task.assignee` 归一化（trim+空白折叠+casefold）聚合未完成任务；每卡出未完成/待办·进行中·受阻、逾期/临期/P0、跨项目数、最近截止；按风险排序（逾期→受阻→临期→最近截止），「未分配」桶固定置顶；点任务行复用 `openRecord` 切项目+切tab+开抽屉，全程只读派生。
- **口径与边界**：逾期＝`status!=='done' && progress<100 && dueDate<今天`（与 stats/reminders 同口径）；**不拆多负责人字符串、不自动合并相似名、不建人员表、不动 domain/schema、不发写命令**。P1（相似名软提示/j·k 导航+记忆/涉众提示）后续做。
- **验收（独立测试矩阵签发，2026-10-13）**：**28 PASS / 0 NOT_RUN / 0 FAIL**；**1 项 MANUAL_PENDING＝真实 390px 窄屏目视**（工具受限，须所有者本人在真浏览器确认）。产品契约与验收/反例见 `docs/product/07-people-load-view-design.md`。
- **状态**：本批仅回写产品/living docs 状态，**未改 `src/`、未改 `docs/testing/`、未提交**。
- **下一步（主线）**：**AI 副驾多步规划**（PROD-20 升维方向；v0.6 架构演进侧的 PROD-11 关键路径/崩溃原子恢复按需并行）。

## 历史阶段：外部 vendor Agent Skills 引入 + 长期规范接线（2026-10-13，doubao-work）

- **决策（ADL-048）**：以只读 vendoring 引入首批 `mattpocock/skills`（grill-me/tdd/code-review/diagnosing-bugs + 纯文档依赖 grilling），锁上游 commit `49dd158d1076134a641b33efb035946536778336`；项目规则优先、不跑 installer、不写 home/全局、不替代独立测试门；升级走双审、回滚只改 manifest commit。
- **决策（ADL-049 自动路由，实现 `src/core/external-skill-router.ts`）**：vendored skill 不再要求用户显式指定，由纯函数按结构化信号确定性路由——缺阻塞信息→`interaction` 追问 route=none（**全拦**）；`vendorIntegrityVerified` 必须 **true**（安全门硬前置）；根因未明→仅 `diagnosing-bugs`（**抑制 grill/tdd、不叠 code-review**）；实质歧义非 trivial→`grill-me`；新功能/可测修复非 trivial→`tdd`；交付边界→**追加 `code-review`（trivial 也保留）**；`isTrivial` 抑制 grill/tdd。自动加载无需用户口令，但须先校静态校验 PASS + sha256、逐次留试点报告；优先级「项目规则 > 追问澄清 > 独立测试门 > skill 步骤」。
- **落地物**：`vendor/agent-skills/mattpocock/`（只读正文 + manifest.json）、治理政策 `docs/external-skills.md`、独立验收门 `docs/testing/external-skills-acceptance.md`、离线静态校验器 `packages/dsh-pm-tool/scripts/verify-external-skills.mjs`、试点报告模板 `docs/templates/external-skill-pilot-report.md`（本批均未改其正文）。
- **状态（2026-10-13 独立测试专家签发）**：**试点可用，未毕业。** 自动化验收门 = **PASS**（静态/校验域 A–H、J 全 PASS，无 FAIL/BLOCKED/F1，MANUAL_PENDING 无）；**`code-review` 试点 = PASS**（报告 `docs/verification/external-skills/pilot-01-code-review.md`）；其余 3 entry（`grill-me`/`tdd`/`diagnosing-bugs`）尚未出试点报告（NOT_RUN），各补 1 份试点报告后方可毕业。**自动路由实现已独立复核 APPROVE**：`verify-external-skill-router.mjs` **41 组断言全绿**（K1–K6、K3 安全门 false 拦截/true 放行、taskKind 留痕、确定性）、**K 域专家 = PASS**。绑定：上游 commit=`49dd158d1076134a641b33efb035946536778336`。**自动路由 ≠ 毕业**。**下一步**：为其余 3 entry 各补 1 份试点报告以推进毕业；使用 vendor skill 仍须先读 `docs/external-skills.md` 守 8 条红线。

## 历史阶段：第一档离线增强 R16/R17/R18 已实现（2026-10-11，doubao-work）

- **R16 临期/逾期提醒**：`/pm due [天数] [项目ID?]`（默认全部项目 7 天）+ Web 面板提醒条；纯读时派生、不做常驻调度（ADL-039）（commit 1b9bf67）。
- **R17 会议行动项转任务**：`/pm meeting action promote <mtg> <ai> [confirm]`（幂等回写 action.taskId）+ Web 「转任务」按钮（ADL-040）（commit 93a8c71）。
- **R18 备份/恢复**：`/pm backup` / `/pm restore <文件> confirm`（恢复前自动安全快照）+ Web 一键备份按钮 + `docs/backup-sync.md`（ADL-041）（commit 0a27862）。
- **验证**：新增 verify-reminders / verify-promote / verify-backup 三个专项；build + 全量 verify 退出 0；`backups/` 已 gitignore。
- **下一步**：第二档体验增强（AI 助手体验/列表效率/纯 JS CSV·XLSX 导入/导出入口）进行中或待办；生成型功能（R13-15）已端到端跑通。

## 历史阶段：生成型功能（R13/R14/R15）已实现（2026-10-11，doubao-work）

- **R13 智能 WBS**：`/pm task wbs <项目ID> <目标> [confirm]`——AI 拆解为勾选清单草稿→dry-run 预览→confirm 复用草稿落盘为任务树（commit 9775cf3）。
- **R14 进度汇报 AI 叙述**：`/pm report narrate <项目ID> [confirm]`——确定性数字→AI 段落→confirm 写入既有 `executiveSummary`（零 schema 改动）（commit cd07b94）。
- **R15 会议纪要归纳**：`/pm meeting summarize <项目ID> <速记> [confirm]`——AI JSON 草稿（防御解析）→confirm 建 draft 会议并挂行动项（commit 35affa8）。
- **统一落地（ADL-036）**：`core/ai-client.ts` 一次性文本生成封装（`ctx.llm.prepareCall`+`BlockAssembler`，按 `error.code` 中文降级）；AI 一律草稿 confirm 才入库；失败/无 key 优雅降级到手工/确定性路径；confirm 复用草稿不重复调模型省免费额度；核心台账离线可用。
- **验证**：每个功能配 verify-wbs / verify-report-ai / verify-meeting-ai（含成功路径与失败降级）；全 15 项 verify 退出 0、`pnpm run build` 通过。
- **真实端到端已通过（2026-10-11）**：已用真实 openrouter/free（凭据库、无环境变量启动）对三功能跑通——R13 confirm 落盘 25 任务、R14 rpt-0002 executiveSummary 数字未改、R15 mtg-0001 三行动项；无环境变量重启读回正常；临时项目已删净。免费池偶发超时已归一为中文 MODEL_TIMEOUT（重试即恢复）。
- **下一步**：Web 按钮为第二里程碑（v1 先斜杠命令）；「任务删除不级联」「免费池偶发超时重试」为已知限制。

## 上一阶段：生成型功能立项（2026-10-11）

- **零成本 OpenRouter 免费 LLM 通道已配置（doubao-work，ADL-035）**：通过已随 base bundle 装载的 `@deepseek-ai/dsh-llm-pi-ai`（原本零路由休眠、无需新装），在本机 `~/.dsh/profiles/pm/cordis.patch.yml` 按 id 补上 `providers.openrouter-free` → OpenRouter 免费自动路由模型 `openrouter/free`（Free Models Router，OpenAI 兼容 `https://openrouter.ai/api/v1`，`api=openai-completions`，`apiKeyEnv=OPENROUTER_API_KEY`）。**key 不入库、不写 patch**，只引用环境变量。
- **本批不实现任何生成型业务功能**：智能 WBS/纪要/周报仍按 ADL-032 暂缓；本批只做「通道配置 + 可移植文档 `docs/model-providers.md` + 加载验证」。DeepSeek 官方/OpenAI/Anthropic/Gemini/Groq/硅基流动/智谱/百炼/本地 Ollama 以注释 YAML 模板预留，当前全部不启用。
- **本批验证（全部无 Key）**：`pnpm install --frozen-lockfile` 干净、`pnpm run build` 退出码 0（client bundle 153.00 kB）、**12 个** verify 全 0、`git diff --check` 干净；`--dump-config` 退出码 0 且 `providers.openrouter-free` 出现、storage-json root 与 dsh-pm-tool 完好；无 Key 真实宿主启动（随机端口、`[pm-tool] 存储领域 pmtool 已打开`、无 pi-ai/openrouter 报错），运行中下发 `plugins/??dsh-pm-tool/client.js` bundle HTTP 200（153033 B、含 pm 界面串；无 cookie 401）。
- **key 已配置、端点已实测（2026-10-11 更新）**：key 已由所有者写在其本机 `~/.zshrc`（仓库外、不入库；改前已备份 `~/.zshrc.bak-20261011-130537`）。所有者本机直连实测：`GET /v1/key` 返回 `is_free_tier: true`、`free_model_daily_requests.limit=50`；`POST /v1/chat/completions`（`model=openrouter/free`）两次真实调用均成功、`cost=$0`、`finish_reason=stop`（随机落到 `liquid/lfm-2.5-2.6b:free`、`nvidia/nemotron-3-ultra-550b-a55b:free`）。经验沉淀见 KB-034（推理型模型先吃满 reasoning tokens，`max_tokens` 要给足 ≥400）。
- **应用内已实测打通（2026-10-11 更新）**：所有者在 dsh 网页底部模型选择器选 **Free Models Router**（openrouter-free/openrouter/free）发「你好，用一句话介绍你自己」，**第 1 次即成功**（puppeteer-core + 系统 Chrome 139 无头，KB-032）：助手正常回复、状态「已完成」、无 MISSING_CREDENTIAL/401/429（约 9.5K tok；免费档按次计费不按 token）。
- **踩到并已解的坑**：首次发消息曾报 `MISSING_CREDENTIAL`（“OPENROUTER_API_KEY which is not set”）——根因是当时 dsh 进程由「写 key 之前的旧终端」启动、进程环境无该变量；停旧进程、用已 `source ~/.zshrc` 的环境重启即解（详见 KB-035 / ISS-024；永久做法是在 Web「设置→模型」页把密钥录进 credentials service）。
- **本批决策/知识沉淀**：ADL-035、KB-033（llm-pi-ai 第三方 OpenAI 兼容端点配置 + profile 按 id 外挂 + apiKeyEnv 不入库、不自动读 .env）、KB-034（openrouter/free 免费自动路由实测行为）、KB-035/ISS-024（MISSING_CREDENTIAL 排查：进程环境 vs credentials service）。

## 上一批：Chrome 真实浏览器自动目视闭环 + 窄屏标签修复 + 浏览器/上游兼容决策（2026-10-11）

- **Chrome 真实浏览器自动目视闭环（doubao-work）**：按 KB-032 用 puppeteer-core 25.13 驱动本机已装 Google Chrome 139（headless，不另装 Chromium、不要系统辅助功能授权）。隔离 DSH_HOME（ISS-019）+ 覆盖每类实体的富种子 + 随机端口 + 无 Key 启动真实宿主，对 R5 面板/R7/R8/R9/R10/R12 做真实点击：七个 ViewTab 逐屏渲染、项目切换、总览看板统计数值（项目总数 2 / 完成率 40% / 逾期 1 / 未关闭风险 4，与种子一致）、全局搜索跨类分组命中、新增交付物→编辑抽屉→删除确认弹窗取消/confirm 删除、浅色与深色对比可读、786px 与 390px 整页无横向溢出。**27/27 用例通过，0 console error / 0 pageerror / 0 失败请求 / 0 同源 4xx-5xx**。
- **本批唯一代码改动**：`client/panel.css` `.pm-view-tab` 加 `white-space:nowrap; flex:0 0 auto`，修复 390px 窄屏视图标签中文逐字断行，改为标签单行、标签条内部横滚。
- **本批验证**：`pnpm install --frozen-lockfile` 干净、`pnpm run build` 退出码 0（client bundle 153.00 kB）、**12 个** verify 全部退出码 0、`git diff --check` 干净。
- **本批决策/知识沉淀**：ADL-033（浏览器兼容仅 Chrome，Safari/Firefox 本期不支持）、ADL-034（上游 dsh 新版本：peer 锁 v0.2.1-alpha.2 + profile link 装载 + 升级冒烟流程）、KB-032（puppeteer-core + 系统 Chrome headless 自动目视法）。截图存 `.tmp/ui-verify/shots/`（gitignored）。
- **暂缓项仍不变**：R11 里程碑提醒与生成型能力、多人实时协作、Excel 导入继续暂缓/裁剪（ADL-030/031/032）。

- **R12 已实现并通过验证（doubao-work）**：新增只读全库关键字检索 `/pm search <关键字> [--type ...]`（七类实体不区分大小写子串、按类型分组）与只读统计看板 `/pm stats [项目ID]`（项目状态计数、任务完成率、逾期、未关闭风险按严重度、交付物四态）；新增 Markdown 任务表离线导入 `/pm task import <项目ID> <清单.md> [confirm]`（GitHub 缩进勾选清单还原 WBS，`[x]` 记已完成，dry-run 不写盘）。Web 顶部新增「总览看板」，基于最新 snapshot 在浏览器端派生跨项目统计卡片、逐项目明细与全局搜索，不新增宿主路由、配色只用宿主 token。检索/看板不新增表、领域版本仍为 1（ADL-029）。
- **R12 验证通过**：冻结安装干净、构建退出码 0（client bundle 152.96 kB）、**12 个** verify 全部退出码 0（新增 verify-r12.mjs，含跨类/类型过滤、统计口径、导入 dry-run vs confirm、缩进→WBS、负例与全新进程读回；verify-web.mjs 扩展 R12 界面串/`.pm-board` 契约）；`git diff --check` 干净；隔离 DSH_HOME + 隔离数据 + 随机端口 + 无 Key 真实宿主启动，存储领域打开、cookie 鉴权，抓取含 dsh-pm-tool 的合并 bundle（HTTP 200）断言含「总览看板/跨项目搜索/项目总数/任务完成率/逐项目明细」。本机浏览器目视项以所有者手动确认为准（KB-014）。
- **R12 裁剪与暂缓结论**：Excel 导入（依赖 skill-office/LibreOffice，ADL-030）、多人实时协作（与单用户本地定位冲突，ADL-031）本期不做；R11 里程碑提醒与智能 WBS/纪要/周报等生成型能力（依赖常驻调度与 API Key）继续暂缓（ADL-032），需求中如实保留为「暂缓/裁剪」。
- **R10 已实现并通过验证（doubao-work）**：pmtool 领域新增 `deliverables` 表（id `dlv-NNNN`，字段名称/版本/负责人/状态/位置/计划交付日期/说明 + 内嵌只增 `history[]`）；离线 `/pm deliverable add/list/get/update/delete`，状态四态 planned/in_progress/submitted/accepted，状态或版本变化自动留痕（可带操作人与说明），有交付物的项目禁止删除；Web 新增「交付物」标签（筛选/搜索/台账表格/编辑抽屉/变更时间线/项目栏计数）。dsh 原生 deliverables 绑定 agent 轮次不适用离线台账，按 ADL-028 复用概念、数据层自研。
- **R10 验证通过**：冻结安装干净、构建退出码 0（client bundle 140.47 kB）、**11 个** verify 全部退出码 0（新增 verify-deliverables.mjs，含留痕规则、并发、失败恢复、删除保护、权限、全新进程读回续号）；隔离 DSH_HOME + 无 Key 真实宿主启动并抓到运行中 bundle 断言含 R10 界面；业务数据与上游零改动。本机浏览器目视项以所有者手动确认为准（KB-014）。
- **R9 已独立复核并推送（doubao-work）**：冻结安装、构建、十项 verify 全部退出码 0；隔离 DSH_HOME + 隔离数据 + 随机端口 + 无 Key 真实宿主启动成功（存储领域打开、带 token 200/无 token 401、启动清单与运行中下发 bundle 含 R9 界面）；未改业务代码原样接收；本机浏览器目视项边界见 KB-014。
- **R9 已实现（trae）**：自定义日期范围生成固定快照，保存任务/里程碑/会议摘要、周期事件和五类异常；支持人工摘要更新、确认删除及精简 Markdown 导出。
- **R9 Web 已实现**：新增进度汇报表格、筛选、搜索、生成/编辑抽屉、固定快照和异常详情。
- **R9 完整回归通过**：冻结安装、构建和十个验证脚本均退出码 0；隔离 profile 真实浏览器证明旧快照不随任务变化、新快照反映最新状态，编辑、导出、主题、786px 窄屏和重启读回通过。
- **R8 已实现**：会议和稳定行动项离线 CRUD、筛选、排序、任务/问题关联及跨表删除保护完成；未来 promote 所需 `taskId` 和稳定行动项 ID 已保留。
- **R8 Web 已实现**：新增会议表格、状态筛选、搜索、完成统计，以及会议和行动项右侧抽屉。
- **R8 完整回归通过**：冻结安装、构建和九个验证脚本均退出码 0；隔离 profile 真实浏览器新增、关联、完成、筛选、深色主题、786px 窄屏和重启读回通过。
- **R8 手动验收通过**：项目所有者确认行动项布局和“保存会议”联动保存修复有效，并授权本批提交与推送。
- **R7 已实现**：风险与问题共用 `risk_issues` 表，离线命令支持增查改删、关闭及类型/状态筛选；项目仍有记录时禁止删除。
- **R7 Web 已实现**：项目工作台新增“风险与问题”高密度表格、搜索、类型/状态筛选和右侧新增/编辑抽屉，无 API Key 可用。
- **R7 完整回归通过**：冻结锁文件离线安装、构建及八个 `verify-*.mjs` 均退出码 0；专项覆盖并发、故障恢复、权限和全新进程读回。
- **R7 真实浏览器通过**：隔离数据完成风险/问题新增、问题关闭、筛选、搜索、确认删除及重启读回；786px 窄屏局部滚动、浅/深主题和控制台/网络检查均正常。
- **R7 版本控制状态**：项目所有者手动验证通过，并已明确授权本批提交和推送。
- **R5 已实现**：外部 `clientBundle` 注册 dsh 顶级“项目管理”面板和侧栏入口；项目列表/详情、项目新建/编辑/删除、WBS 新建/完成切换/删除、里程碑新建/达成/删除均复用 Host 命令，无 API Key 可用。
- **R5 手动验收已通过**：2026-10-10 项目所有者确认验收通过；保留高密度任务/里程碑表格和右侧编辑抽屉，颜色、字体、字号及主要圆角跟随 dsh 原生主题。
- **主题专项验证**：真实浏览器通过宿主设置切换浅色并恢复跟随系统，表格和抽屉同步变化，730px 根容器无溢出；构建及全部七个验证脚本退出码 0。
- **独立页面 spike 已通过**：pm profile 的 `__DSH_BOOT__` roster 包含 `dsh-pm-tool/client.js`，不需要设置卡片降级，也未修改上游。
- **真实浏览器自动验证通过**：三类视图、任务新增与清理、右侧抽屉和 725px 工作区正常；表格局部横向滚动，整页无横向溢出，控制台无当前构建错误。
- **全量回归通过**：`pnpm run build` 与 command/export/milestones/projects/storage/tasks/web 七个 verify 脚本均退出码 0；故障日志均为既有主动负例。
- **阶段 4 MVP 交付完成**：新增 `docs/test-cases.md` 与 `docs/delivery.md`，整理 R1–R6 测试矩阵、手动验收、安装启动、演示、备份和已知限制。
- **交付级验证通过**：Node v22.23.3 / pnpm 11.28.5；冻结锁文件离线安装、构建、七个验证脚本、profile 配置检查均退出码 0；隔离 profile 真实启动成功，页面 HTTP 200 且 boot roster 包含 `dsh-pm-tool/client.js`。
- **v0.1.0 发布**：项目所有者授权创建 Git tag 与发布记录；发布说明见 `docs/releases/v0.1.0.md`，发布决策见 ADL-023。
- **授权状态**：本次授权仅覆盖 v0.1.0 发布提交、普通推送和 tag 推送；后续版本控制动作恢复分别确认。

### 🧭 跨平台协作基座（2026-10-10 新增，已就绪）
- 根 `AGENTS.md`（任何 AI/IDE 接手先读）、`docs/collaboration.md`（多方同步规则 + 平台标识）、`docs/knowledge-base.md`（KB-001～010 已验证知识）、`docs/handover-archive-doubao.md`（豆包阶段完整存档）。
- 约定：仓库即唯一事实来源；任何平台开工前先 pull + 扫描 `docs/` 最新档案，改动后在 `changelog.md` 标注平台标识并同步需求/决策/踩坑/知识；禁 force push。
- 接手平台不局限于 TRAE：新平台首次接入按 `docs/collaboration.md` 第八节自检并登记平台标识。

### ✅ 阶段 3 第 0 步已完成（最小插件端到端打通）
- 在独立仓库新建最小插件包 `packages/dsh-pm-tool/`（`/pm` 离线命令 + 存储领域 `pmtool`），`pnpm install` 与 `tsc` 构建一次通过。
- 基于 web 模板派生专属 profile `pm`，以 `link:` 绝对路径装入插件并自动激活；`--dump-config` 可见插件与存储三件套。
- profile 补丁把 storage-json 的 `root` 覆盖到产品目录 `pm-tool/data`（已 gitignore）；启动日志打印 `[pm-tool] 存储领域 pmtool 已打开`，宿主自身数据也写入该目录。
- Web 斜杠命令目录列出 `pm`，无 API Key 执行 `/pm ping` 返回中文 pong（有截图）。
- 两个确定性脚本（`scripts/verify-storage.mjs`、`scripts/verify-command.mjs`）直接运行已构建插件的真实代码：selftest 写入并读回 `pm-tool/data/pmtool/checks/selftest.json`（人类可读、目录 0700）。
- 实测发现并修复真实 bug：`table.put()` 异步写盘漏 `await`（处理器改为 async）。
- 已提交（`9e5d539`）并经项目所有者**验收通过、推送 origin/main**；随后补 `41b9db5` 说明验收/推送与移交。
- **后续阶段 3 业务编码与阶段 4 测试移交 TRAE 或其他 IDE/Agent 执行，本侧暂停**；接手导引见根 `AGENTS.md` 与 `docs/handoff.md` 第 0 节。

### ✅ 阶段 3 业务功能（R1–R9 已完成）
- 按需求 **v0.7** 实现项目计划 R1 / WBS R2 / 里程碑 R3 / 持久化与 Markdown 导出 R4 / Web 界面 R5 / 离线命令 R6 / 风险与问题 R7 / 会议纪要 R8 / 进度汇报 R9。
- **落盘布局已定稿并扩展（ADL-011/024）**：单领域 `pmtool` 分表 per-record、不建 index.json；projects/tasks/milestones/risk_issues 均已实现，checks 保留。
- 第三方独立顶级 Web 页面与外部包浏览器构建已按 ADL-022 实测打通。

---

## 阶段 2 需求分析（✅ 已定稿 v0.3 并获确认、已推送）

### ✅ 已完成
- 完成 dsh 能力可行性调研（本地官方源码 + 官方 cookbook/包 README 双路印证），沉淀 `docs/feasibility-map.md`。
- 经项目所有者交互确认四项关键决策（见 ADL-007）：离线优先混合模型、人类可读 JSON+Markdown 存储、先做 dsh Web 界面、最小闭环 MVP。
- 确定 MVP 技术架构（见 ADL-008）：`storage-domain` + `storage-json` 落盘、用户命令（离线）/模型工具（在线）双入口、独立插件包 + 专属 profile。
- 产出需求评审稿 v0.3：R1–R12 模块与可测试验收标准、Project/Task/Milestone 数据模型、数据落盘目录约定与业务规则、非功能需求。
- 项目所有者确认三项补充决策（ADL-009）：`data/` 暂不入库（已写入 `.gitignore`）、里程碑到期提醒暂缓（R11→P2）、生成型能力一期仅预留接口不实现。
- 需求 v0.3 经项目所有者确认定稿；`docs/handoff.md` 已刷新；阶段 2 文档提交并推送 GitHub。

---

## 阶段 1 环境搭建（✅ 已完成）

### ✅ 已完成
- 核实 dsh 官方仓库、技术栈、安装要求与插件架构（官方来源交叉验证，见 ADL-001）。
- 本机只读环境摸底：macOS 15.6.1 arm64、git 2.39.5；原仅 Doubao 自带 Node、无 pnpm/Homebrew。
- 经项目所有者确认 4 项关键决策：目录、独立仓库策略、nvm 安装方式、第一阶段接远程。
- 安装 nvm + Node v22.23.3 + corepack/pnpm 11.28.5，配置 `~/.zshrc`（见 ISS-001/ISS-004）。
- 创建工作区 `~/Projects/dsh-pm/`；浅克隆上游 dsh **v0.2.1-alpha.2**（基线哈希 `d743267388641bc76f17c45ce8b4c231aed1d32c`，分支 master）。
- `pnpm install` 成功（354 个工作区项目，约 1m17s，原生模块正常）。
- `pnpm run build` 成功（原生 addon + host + 357 个 client 产物，退出码 0）。
- 运行验证通过：`pnpm dsh web` 在 http://127.0.0.1:3080 启动，带令牌认证后根路径 HTTP 200、页面 `DSH Local Build` 正常返回；验证后已关闭服务。
- 初始化本产品独立 git 仓库 `pm-tool`（默认分支 main），建立完整标准档案（README/docs/skills/packages）。
- 生成 GitHub SSH 密钥并由项目所有者添加到账户 iceAcmen，`ssh -T git@github.com` 认证通过。
- 配置仓库级提交身份 Ice \<835687152@qq.com\>（未改全局）；首次提交 `12bcad3` 并推送 main 到 `git@github.com:iceAcmen/pm-tool.git`，跟踪 origin/main。

## 后续任务
- R13/R14/R15（智能 WBS/进度汇报叙述/会议纪要归纳）已完成并真实 openrouter/free 端到端验证（含重启读回，临时项目已删净）；随后完成 **A1（Web 端「AI 助手」面板，复用 core 草稿→confirm）** 与 **A2（任务显式级联删除 `/pm task delete <id> [cascade] confirm`）**，全 16 个 verify + build + frozen lockfile 绿。
- 首页 `/pm` 经上游只读核查确认注册正确、问题属宿主斜杠补全/会话跳转（ADL-038/KB-037/ISS-026）；以 Web 面板为稳定入口。v0.2.0 发布说明已起草（`docs/releases/v0.2.0.md`，**未打 tag**，待组织者独立验收）。
- 剩余需求仍暂缓/裁剪：R11 里程碑提醒、多人实时协作（ADL-031）、Excel 导入（ADL-030）。
- 上游 dsh 升级前按 `docs/test-cases.md` 执行完整兼容性回归。

## 当前状态（v0.7.4 最终可发布 · tag 将在最终提交创建；v0.7.3 已发布）
- **版本事实已前置到 v0.7.4（2026-10-14）**：`packages/dsh-pm-tool/package.json` = `0.7.4`。**v0.7.3 已正式发布**：注解 tag `v0.7.3` → 提交 `eb41b30`（甘特拖拽显示热修）。v0.7.4 = 稳定性地基 S4（fs-atomic 契约/tmpNameFactory 测试缝、LLM optional 真实 Context、runner 聚合+timeout 分类+资产 manifest）+ war-room「进行中」KPI 热修，**独立测试专家实测 S4 19/19 PASS、真实 Chrome 隔离端口 3122 PASS，可发布**；注解 tag 将在最终提交时创建（被测基线 = `eb41b30` 之上未提交工作树，最终 release commit SHA 待最终提交后确定）。历史 tag `v0.1.0`–`v0.7.3` 均未移动。
- **v0.7.4 范围（v0.7.3 `eb41b30` 之后，零 schema）**：A1 fs-atomic 钉死 rename 前失败只清 tmp 不碰目标、`wx` EEXIST 排他、tmpNameFactory 仅测试缝生产默认不变；A2 llm 不 inject、懒读 `ctx.reflect.get('llm',false)` 真实 Context、缺 provider 中文 NO_LLM 降级核心离线；A3 runner 跑完全部 62 专项并聚合失败（不 break）、timeout 单独分类、正式资产 before/after sha256+mtime manifest 零污染；war-room `doing`→`in_progress` KPI 热修（修复前进行中恒 0）。详见 `docs/releases/v0.7.4.md`。
- **验收（独立测试专家实测 + 真实 Chrome）**：S4 **19/19 PASS**、全量 guard **62/62** 全绿、权威资产本轮 **before=160/after=160 零污染**；war-room 真实 Chrome **3122** 逐项 PASS、正式 **before=159/after=159 零污染**（160 vs 159 = 跨轮 session/cache 自然轮转、各轮 before==after，如实分开）。client sha256 已实测锁定 `9d0b118c6f469856c5c7caee52175a88b0a2082fc4333daf2b2a45bc2302aa8b`（332510 B）。
- **人工项**：**v0.8 客观进度（checklist/progress-derivation/汇报 calcVersion）= NOT_RUN/deferred**（矩阵已冻结未实现）；**M-01 生产（prod）真实 Key 仍 MANUAL_PENDING（不阻塞 v0.7.4 发布）**，PoC 车道 `our-free-model`/`kilo-auto/free` 免费免 Key；GI-WEB-14 真 390 窄窗、GI-CP 关键路径仍 deferred/MANUAL_PENDING；G8/H5 不可逆动作仍 MANUAL_PENDING。
- **发布动作**：本批**暂不 commit/tag/push**，待用户最终通知执行最终提交、打注解 tag（client sha256 已实测锁定）。
