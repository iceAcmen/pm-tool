# 最小迁移交接清单 handoff.md

> 本文件是「换一个人或换一个软件接续本项目所需的最小信息集」；在每个阶段收尾或项目所有者要求时刷新。接手者按本清单即可恢复环境、定位进度、知道下一步做什么。

最后更新：2026-10-17（doubao-work **#24 测试框架 + CI 已核验**：vitest 离线纯函数单测 4 文件 29 用例（criticalPath/settings/resolveTaskProgressMeta/validateActions），v8 子集覆盖率门，确定性 E2E=`pnpm e2e` 隔离 DSH_HOME/非生产端口/不出网，`.github/workflows/ci.yml` 分 core/e2e；只加 devDeps、版本仍 0.7.4。build=0、guard 73/73/0 失败/0 污染、vitest 29/29、e2e 本机可重复 PASS；本机无 gh 未观测 Actions 实跑。先前：#23 客观进度 73/73 隔离 3162；#22 副驾写扩展 72/72 隔离 3161；#25 窄窗已并入 main；#21 口径配置化 71/71；GI-CP CPM 70/70；发布基线仍 v0.7.3=`eb41b30`）

---

## 0. 移交说明（给接手方：TRAE 或其他 IDE / Agent / 同事）

> 接手第一步：项目所有者把 **`docs/onboarding-prompt.md`** 的「标准启动提示词」整段发给新 Agent；Agent 先读该文件（含文末「当前交接快照」）与仓库根 **`AGENTS.md`**（入职说明与强制准则），再按 `docs/collaboration.md` 完成「新平台首次接入自检」并登记平台标识；本节为其补充。

- **当前状态（最新，2026-10-17 doubao-work，已 commit+push main）**：**#24 测试框架 + CI 已完成并核验**。在不推翻 verify-isolation 的前提下：① vitest 离线确定性纯函数单测（`src/core/*.test.ts`，4 文件 29 用例：gantt.criticalPath 线性链/成环/缺日期/多分量/确定性、settings 默认值锁原硬编码/归一化/非法回落/灯号倒挂、resolveTaskProgressMeta 客观人工双轨/无信号 none 不伪造/清除回落、validateActions 四实体 create/update 白名单/枚举/交叉约束/未知拒绝）；② v8 覆盖率门，`vitest.config.ts` include 收窄本批四模块，阈值 lines40/branches80/functions35/statements40（实跑 45.02/86.25/42.37 留余量）；③ `scripts/e2e.mjs` 固化为 `pnpm e2e`，自建隔离 DSH_HOME/临时存储备份/非生产端口 3171，`DSH_PM_E2E=1` 确定性缝不调模型不出网，puppeteer-core 真实 Chrome 断言项目/任务渲染+0 console error，缺 harness/Chrome SKIP exit 0；④ `.github/workflows/ci.yml`：core job（Node22+pnpm 11.28.5，frozen-lockfile → build → verify-isolation → test:coverage），e2e 独立 job（headless chromium，缺 harness SKIP），verify-real-model.mjs 真实出网 smoke 不进必经。devDeps 仅加 vitest@2.1.9/@vitest/coverage-v8@2.1.9/puppeteer-core@23.11.1；tsconfig exclude 测试不进 lib；版本仍 0.7.4、不打 tag。验收：`pnpm build`=0；`verify-isolation.mjs` **73 脚本 / 73 通过 / 失败 0 / 污染 0**（before=after=165）；vitest **29/29** 过覆盖率门；`pnpm e2e` 本机可重复 PASS（3171 用完即 DOWN，正式 3080=PID 66364 未变、3091 未监听，ISS-027 单 PID TERM）。**限制**：本机无 `gh` 登录，未在 GitHub 端观测 Actions 实跑，CI 已配置且本地等价命令全绿。**由谁继续（下一步）**：看板 P2 → 9 视图重设计；prod 真实 Key 仍 MANUAL_PENDING；CI 端 e2e 因缺仓库外宿主为 SKIP，待有 gh 环境复核 Actions。
- **上一状态（2026-10-17 doubao-work，#23 已 push main）**：**#23 客观进度补全已完成并核验**。补 v0.7.4 deferred 四件事——doneAt 完成日期（复用既有 `completedDate`：done 自动记当天/显式值采纳/revert 清除，本项只在表单只读展示）、`effortHours` 实际工时（非估算、可缺省）、`evidenceUrl` 客观佐证链接（可缺省）、`manualProgress` 人工 override（显式「人工设定」标记，与清单客观派生并存、互不污染，清除回落客观）。实现：`core/task.ts` 加法式新增可选 `effortHours/evidenceUrl/manualProgress/manualProgressNote`（create/update schema + 校验标签，旧记录无键照常 parse、无需迁移）；`core/progress-derivation.ts` 纯函数 `resolveTaskProgressMeta` 返回 objective/manual/display/mode/manualNote，`deriveProgressMap` 客观派生零改动；`core/tasks.ts` `manualProgress===null` 时连带清备注；`client/panel.tsx` TaskForm 只读客观块（清单 fraction + 客观值/「证据不足」+ 完成日期）+ 工时/证据/人工设定输入 + 橙色「人工设定 n%」徽标/清除按钮/备注；`client/panel.css` `.pm-meta-*`/`.pm-manual-*` 消费 `--pm-*`（底层 `--dsw-*`）零 hex、跟随 `body[data-ds-dark-theme]`。验收：`pnpm build`=0；`verify-isolation.mjs` **73 脚本 / 73 通过 / 失败 0 / 污染 0**（before=after=165）；新增 `verify-task-meta.mjs`（effort/evidence 读写缺省、人工标记不污染客观、清除回落、旧记录安全 parse、done↔completedDate，离线确定性）。隔离真实 Chrome headless（独立 DSH_HOME/存储/备份/端口 **3162**，正式 3080=PID 66364 全程未变、3091 未监听，ISS-027 单 PID TERM）：浅/深两趟人工态（证据不足+3.5h+证据链接+人工 30% 徽标）与客观态（2/4=50%、无徽标）逐项 OK、0 console error。证据 `docs/verification/progress-meta-20261017/`。**由谁继续（下一步）**：看板 P2 → 9 视图重设计；#24 vitest/E2E/CI 未做，prod 真实 Key 仍 MANUAL_PENDING。
- **上一状态（2026-10-17 doubao-work，#22 已 push main）**：**#22 AI 副驾写操作扩展已完成并核验**。副驾写从仅 `task.update` 扩到里程碑、风险、交付物、会议四类实体，每类支持创建+更新；保持 HITL（确认草稿卡，确认才落库、取消零写），复用既有 ask-apply 后端守卫，零存储 schema 改动，乐观锁冲突跳过、重复 apply 幂等。实现：`core/copilot.ts` `ALLOWED_OPS` 扩到 8 个实体 op + 四类字段白名单/枚举/交叉约束校验（risk 必须 probability、禁 solution；issue 必须 probability=null、禁 responsePlan；deliverable 用 `name`；meeting 校验 meetingDate/startTime/durationMinutes/数组），`validateActions` snapshot 扩为可选四实体 id 集合、`task.update` 逐字节不变；`commands/ask.ts` `applyCore` 按 op 分发（create 注入 projectId 调 `add*`，update 核 projectId+比基线 `updatedAt` 不一致 `DispatchSkip` 跳过不覆盖后调 `update*`，`task.update` 仍走 `updateTask`），幂等键 SHA-256 命中拦截；`core/ask-copilot.ts` `COPILOT_SYSTEM` 放开四类实体并写明字段口径；`client/panel.tsx` `CopilotPanel` 收四实体清单传 id 集合，`task.update` 保留行内编辑、其余 op 渲染只读实体摘要卡（新建=新值、更新=旧值删除线→新值、「新建X/更新X · id」徽标）；`client/panel.css` 实体徽标/摘要/行样式复用 `--pm-*`（底层 `--dsw-*`）零 hex、跟随 `body[data-ds-dark-theme]`。验收：`pnpm build`=0；`verify-isolation.mjs` **72 脚本 / 72 通过 / 失败 0 / 污染 0**（before=after=165）；新增 `verify-copilot-writes.mjs`（四类 create/update 解析、确认落库、取消零写、冲突跳过、幂等、非法/未知忽略、跨项目拒绝，离线确定性）。隔离真实 Chrome headless（独立 DSH_HOME/存储/备份/端口 **3161**，正式 3080=PID 66364 全程未变、3091 未监听，ISS-027 单 PID TERM）：浅/深两趟均 8 步草稿（4 新建/4 更新）、整批应用 8 步、取消零写、served bundle 含实体卡、0 console error。证据 `docs/verification/copilot-writes-20261017/`。**由谁继续（下一步）**：看板 P2 → 9 视图重设计；#23 客观进度/#24 vitest·E2E·CI 未做，prod 真实 Key 仍 MANUAL_PENDING。
- **上一状态（2026-10-17 doubao-work，#25 已并入 main）**：**#25 真 390px 窄窗响应式正式修复已核验**。纯 CSS/视图响应式，零 schema/零新增依赖/零业务逻辑，未改 tsx DOM 契约；窄屏规则全隔离在 `@media (max-width:560px)`，≥1024 桌面几何零改动。骨架（顶栏换行/抽屉单列表单/move-picker 不锁宽/副驾编辑行 6→2/矩阵 3→2/图例换行）+ 9 视图（tasks 搜索通栏/工具条换行/主按钮通栏；people 固定 6 列网格→可换行卡片；meetings 行动项 4 固定列→单列堆叠；milestones 概览条换行；risk 内距收敛/矩阵首列 44/第二行换行；deliverables 双栏→单列；gantt 工具栏换行/左标签 150px/时间轴内部横滚；overview/reports 补 560，快照 7→3 列）；任务表 `.pt-scroll`、甘特 `.pm-gantt-scroll`、数据表 `.pm-table-scroll` 容器内部横滚，外壳不溢出；顺手去两处硬编码白（`.pt-primary` `#fff`、`.pm-chip-primary` `rgb(255,255,255)` → `--dsw-alias-label-primary-foreground`）。验收：`pnpm build`=0；`verify-isolation.mjs` **71 脚本 / 70 通过 / 1 失败（仅 verify-export.mjs 硬编码 `/pm-tool/exports/` 路径在 worktree `.tmp/p0-narrow390` 下不匹配，已知环境假象，非回归）/ 污染 0**；`verify-gui-contract.mjs` 补 #25 静态契约（每视图+骨架含 560 断点、零 hex、内部横滚容器）。隔离真实 Chrome headless（独立 DSH_HOME/存储/备份/端口 **3155**，profile 软链指 worktree 包，正式 3080=PID 66364 全程未变、3091 未监听，ISS-027 单 PID TERM）：真实响应体证明聚合包 `dsh-pm-tool/client.js` 含 `#25 真 390px` 标记+560 断点（重建后 rev 变化），浅/深 ×9 视图+新建任务抽屉 20/20 无外壳溢出。证据 `docs/verification/narrow390-20261016/`（README + 浅/深各 10 张）。**由谁继续（下一步）**：协调者在主树恢复全绿后统一 rebase/合并到 main（本分支不 push）；之后看板 P2 → 9 视图重设计；#22 副驾写扩展/#23 客观进度/#24 vitest·E2E·CI 未做，prod 真实 Key 仍 MANUAL_PENDING。
- **上一状态（2026-10-16 doubao-work）**：**#21 口径配置化已完成并核验**。把健康分权重/封顶/灯号线（每逾期 3/受阻 4/高风险 6/严重 10/逾期里程碑 8，封顶 15/12/20/16，绿 80/黄 60）、临期窗口 7、过载阈值 5 做成项目级设置；新增 `core/settings.ts`（默认值=原硬编码现值、`SETTING_FIELDS` 元数据、`normalizeProjectSettings` 整数/区间/灯号倒挂校验、`sameSettings`）；`scoreFromInputs/computeProjectHealth/computeReminders/groupOpenTasksByAssignee/computeKPI/buildAgenda` 可注入 settings、不传=默认（默认等价），纯函数/确定性/零写；`commands/settings.ts`（`/pm settings` 查看 / `put <json>` 局部合并+整份校验 / `reset` 回落默认）经 settings 表透明存取+原子写，`web snapshot` 透传 `settings`；顶部「更多」→「口径设置」抽屉（13 字段分组、整数/区间/绿灯≥黄灯内联校验、保存/恢复默认），配色 `--pm-*`（`--dsw-*` 重映射）零 hex、跟随 `body[data-ds-dark-theme]`。验收：`pnpm build`=0、`verify-isolation.mjs` **71/71、失败 0、污染 0**（162 资产）；新增 `verify-settings.mjs`（默认等价/覆盖/非法/局部合并/reset/--reopen 读回/UI 契约/零写 grep），`verify-health.mjs` 补自定义覆盖，`verify-gui-contract.mjs` 补 #21 钩子；隔离 Chrome **3141**（正式 3080=PID 66364 全程未变、3091/3141 无残留，ISS-027 单 PID TERM）浅趟默认抽屉→改绿灯线 80→60 保存→概览灯号黄→绿，深趟原生 dark 抽屉。证据 `docs/verification/settings-20261016/`（10-light/11-after-change/12-dark）。**由谁继续（下一步）**：看板 P2 → 9 页面重设计；GI-WEB-14 真 390 窄窗目视、prod 真实 Key MANUAL_PENDING；#22 副驾写扩展/#23 客观进度/#24 vitest/#25 窄窗未做。
- **上一状态（2026-10-16 doubao-work）**：**GI-CP 关键路径只读高亮（CPM）已实现并通过 GI-CP-01~05**。core `src/core/gantt.ts` 新增纯函数 `criticalPath(tasks)`：基于 predecessorIds 依赖图 AON 正/反向遍历算 ES/EF/LS/LF/slack（相对组件起点天偏移、FS 零间隔、不建模 lag），**slack=LS−ES=0 即关键路径**；按连通分量（并查集）各自取组件最大 EF 反向，短分量无假正时差；成环（3 色迭代 DFS）inCycle 不高亮/不打断、缺日期 missingDate 不补/顺延、自指悬空计数、空输入不抛；确定性零写、不调用 run/execute、零 schema、不动 storage.ts、不回写派生字段。甘特（gantt.tsx/gantt.css）关键条 2px 强调环 + 关键边加粗强调箭头 + 图例「关键路径 N」+「循环不可计算」「缺日期段已跳过」徽标 tooltip，配色全走 dsw 别名 token（底层 `--dsw-*`）零 hex、跟随 `body[data-ds-dark-theme]`。验收：`pnpm build`=0；`verify-isolation.mjs` **70/70、失败 0、污染 0**（before/after=162/162）；新增 `verify-critical-path.mjs`、`verify-gui-contract.mjs` 补静态钩子；真实 Chrome headless 隔离实例独立 DSH_HOME+存储+备份+端口 **3131**（正式 3080=PID 66364 全程未变、3091/3131 无残留，ISS-027 单 PID TERM），浅/深/拖链尾实测 GI-CP-01~05（拖 t-0003 前置 t1/t2 逐字节不变、progress/pred 不动、不顺延）。证据 `docs/verification/gui-critical-path-20261016/`（10-light/11-after-drag/12-dark）；client sha256=`c829fb4a…`。不改 package.json version、不打 tag。**由谁继续（下一步）**：看板 P2 → 9 页面重设计；GI-WEB-14 真 390 窄窗目视、prod 真实 Key 仍 MANUAL_PENDING；关键路径自动排期（甘特B 长期观望）、vitest/E2E/CI（#24）未做。
- **当前状态（最新，2026-10-14 doubao-work）**：**稳定性地基 S4 批次 19/19 PASS（独立测试专家实测）+ war-room「进行中」KPI 热修真实 Chrome 隔离实例 PASS**。v0.7.3=`eb41b30`（注解 tag `v0.7.3`）之后的稳定性补丁，**全程零 schema**（domain 仍 v1、表集合未变，`taskStatusSchema=z.enum([todo,in_progress,blocked,done])` 拒收 `doing`）。**A1 fs-atomic**：`atomicWriteFile` 钉死「rename 之前 open/write/sync/close/rename 任一失败只清 tmp、绝不碰目标」，rename 为唯一切换点，`open(tmp,'wx',0o600)` EEXIST 排他闭环；新增可选 `tmpNameFactory` **仅测试注入**（生产默认 `randomUUID` 行为不变）。**A2 LLM optional 真实 Context**：`llm` 不列入 inject，运行期 `ctx.reflect.get('llm',false)` 懒读真实 Context、命令被调时才取并透传三条 AI 命令；缺 provider 时 `generateDraft` 抛中文 `NO_LLM` 降级、核心台账离线可用业务零写，有 fake llm 走 generateDraft+兜底路由。**A3 verify runner**：`verify-isolation.mjs` 跑完全部 **62** 个 `verify-*.mjs` 并**聚合全部失败（不 break）**，超时（`ETIMEDOUT`/`killed`）单独分类不误落 spawn 异常，正式资产 before/after sha256+mtime manifest 零污染、退出码无歧义。**war-room KPI 热修**：根因 `computeKPI` 误判 `status==='doing'`（真枚举 `in_progress`）致「进行中」KPI 恒为 0；`status.ts` 新增纯谓词 `isDoneStatus/isInProgressStatus`、`war-room.ts` 的 inProgress 改用谓词（done/overdue 抽闭包语义不变）、`verify-war-room.mjs` 补五态回归守卫。验收 = S4 **19/19 PASS**、全量 guard **62/62** 全绿、权威资产 **before=160/after=160 零污染**（证据 `docs/verification/stability-s4-20261014/full-guard.txt`，矩阵 `docs/testing/stability-s4-acceptance.md`）；war-room 真实 Chrome v139 headless（puppeteer-core，无 Key）独立 `DSH_HOME`+端口 **3122** 逐项 PASS（KPI 进行中=1、blocked 不计、修复前渲染 0）、正式 **before=159/after=159 零污染**（证据 `docs/verification/gui-war-room-status-20261014/`）。**计数差异如实分开**：S4 guard=**160**、war-room 轮=**159**，差异为**跨轮 session / 缓存文件自然轮转**所致（每轮内部均 before=after、污染 0，非资产漂移）。**ISS-027**：隔离 PID 8436（首轮 patch root 误指上一轮 scratch）→修正重启 PID **9859**，均 `--port 3122`/`--no-open`，仅对 8436/9859 分别 `kill -TERM` 一次验 3122=DOWN；正式 3080=PID 93536/3091=PID 93537 启动前后均 LISTEN、PID 未变。client sha256 已实测锁定 **`9d0b118c6f469856c5c7caee52175a88b0a2082fc4333daf2b2a45bc2302aa8b`**（332510 B / 332.51 kB）。本批仅回写版本/living docs 口径（package.json 0.7.4 + releases/README/changelog/progress/handoff/onboarding），**未改产品 src、未改测试专家 docs、未改证据、未提交**。**由谁继续（下一步）**：待用户授权执行最终 commit/注解 tag `v0.7.4`/push（client sha256 已锁定）；v0.8 客观进度实现、GI-WEB-14 真 390 窄窗目视、GI-CP 关键路径、M-01 prod 真实 Key 仍为后续/人工项。
- **上一批状态（2026-10-14 doubao-work，v0.7.3 已发布 tag `v0.7.3`→`eb41b30`）**：**甘特拖拽手感与成功提示热修（v0.7.3）代码审查 APPROVE、真实 Chrome 隔离实例 22 项采证全绿**。用户在 v0.7.2=`310c768`（注解 tag `5d1c8591`）实测反馈拖拽成功后弹出全字段深色大卡 Notice（13 行 dump 盖住甘特工作台）。热修——**根因修复 `.pm-gantt` 无 `flex-wrap`**：hint(`flex-basis:100%`) 与 labels/scroll 挤同一 flex 行竞争致 scroll 被 shrink 到宽 0（画布消失），加 `flex-wrap:wrap` 后 hint 独占下一行、首行宽度不随 hint 变化；拖拽走 `run(...,{quiet:true})` **单 refresh 即时更新无需 F5**（移除 `onSaved()` 二次刷新）；**quiet 成功不弹全字段大 Notice**，改条下 inline `role=status`/`aria-live=polite`「已更新：起 ~ 止」约 3s 自清除；**`saving` inflight 锁**保存中禁连拖、finally 解锁防 ghost；**失败回落**条体从未本地改动自然回拖前坐标无残影、内联「更新失败，请重试」6s，且 quiet **不吞错**（run catch 仍 `setMessage` 保留全局错误红框 Notice）；unmount `clearTimeout` 清定时器。**零 schema**（只读既有 startDate/dueDate/progress/predecessorIds，不升 domain、不动 storage.ts），payload 白名单仍仅 startDate/dueDate。验收 = 真实 Chrome v139 headless（puppeteer-core，无 Key）独立 `DSH_HOME`+独立端口 **3120** **22 项全绿**；静态契约 `verify-gantt-drag.mjs` 退出 0；证据 `docs/verification/gui-gantt-drag-hotfix-20261014/`；回归新增 7 项（GI-WRITE-06/07+GI-WEB-16~20）独立测试专家最终签 **7/7 PASS**；正式 `data/`/`backups`/`exports` **156 资产本轮零变化**；`shasum -a 256 packages/dsh-pm-tool/lib/client.js` = `68238d1a37c4eccfe16ff1699b91310e304d47eddc01466ac19b5193892131d8`（332139 B / 332.14 kB，bundle 含 `pm-gantt-bar`，已实测锁定）。**ISS-027 精确 PID 流程继续遵守**：隔离监听 PID=86864/`--port 3120`/`--no-open`，仅对 86864 `kill -TERM` 一次验 EXITED/3120=DOWN；正式 3080=PID 69064/3091=PID 69065 启动前后均 LISTEN、PID 未变。本批仅回写版本/living docs 口径（package.json 0.7.3 + releases/README/changelog/progress/handoff/onboarding），**未改产品 src、未改测试专家 docs、未改证据、未提交**。**由谁继续（下一步）**：待用户授权执行最终 commit/注解 tag `v0.7.3`/push；GI-WEB-14 真 390 窄窗目视、GI-CP 关键路径、M-01 prod 真实 Key 仍为后续/人工项。
- **上一批状态（2026-10-14 doubao-work）**：**甘特排期视图信息增强（v0.7.2）已实现并通过独立测试专家最终签 PASS**。在 v0.7.1=`02f42d1` 基线上，对甘特「信息可读性」做增强：**根因修复 `--pm-accent` 从未定义致甘特条 `color-mix` 退化为透明**（正式定义 `--pm-accent: var(--dsw-alias-state-business-primary)`，全色值走宿主语义变量、不写死 hex）；起止日期直显（`labelDates` MM-DD~MM-DD + 窄条外置 sideLabel，不只藏 tooltip）；0/部分/100 进度条内实心层按 `progress/100` 填充（done/≥100=完成态，纯渲染不写库）；`predecessorIds` 为唯一真源的只读 SVG 依赖箭头（`pointer-events:none`，自指/成环/悬空/缺日期诚实 skipped 降级，不画第二份依赖副本）；父子 effectiveRange 只读派生（`min(子 start)~max(子 due)` 虚线派生条，不回写父日期）；ARIA + `localTodayIso()` 本地今日线轴外钳制 + 里程碑缺 targetDate 返回 null 防 NaN；拖拽整条平移、落库 payload 白名单仅 `startDate`/`dueDate`，不动 progress/predecessorIds/status/assignee、不自动顺延后继。**零 schema**（只读 v0.7.1 既有 startDate/dueDate/progress/predecessorIds，不新增表列、不改 taskRecordSchema、不升 domain、不动 storage.ts）；**关键路径 deferred**（GI-CP-01~05 未新增最长路径/高亮代码，按裁决 N/A 不计失败）。验收 = 范围内 **34/35 PASS**（纯函数 11/11 + 写路径 5/5 + 协作红线 4/4 + GUI 14/15）+ **父 effectiveRange 聚焦 GUI 复验 PASS**；🟡 **GI-WEB-14 真 390 窄窗 = MANUAL_PENDING**（实测视口 768px，沿用 PL-WEB-11，不阻塞）；真实 Chrome headless 隔离实例端口 **3102**（独立 DSH_HOME，正式 3080/3091 未触），正式 `data/`/`backups`/`exports` **157 资产零污染**；证据 `docs/verification/gui-gantt-information-20261014/`、验收矩阵 `docs/testing/gantt-information-acceptance.md`；client bundle 完整哈希 `dcf44a4a…`（`shasum -a 256 packages/dsh-pm-tool/lib/client.js` 实测）。本批仅回写版本/living docs 口径（package.json 0.7.2 + releases/README/changelog/progress/handoff/onboarding），**未改产品 src、未改测试专家 docs、未改证据、未提交**。**由谁继续（下一步）**：聚焦父日期 GUI 复验（父 effectiveRange 拖拽边界）**已 PASS**；待用户授权执行最终 commit/注解 tag `v0.7.2`/push；关键路径高亮、真 390 窄窗目视、M-01 prod 真实 Key 为后续/人工项。
- **上一批状态（2026-10-13 doubao-work）**：**Web polish 三件套（PROD-10 任务来源会议直达 / PROD-09 汇报相邻对比徽标 / PROD-04 Web 改父+原子重编号）已实现并通过独立验收总门 PASS**。**零 schema**（domain 仍 v1、9 表）：PROD-10 任务抽屉只读显示「来自会议 mtg-xxxx」并 `openRecord` 直达（前端反查 `meetings.actions[].taskId`，多来源按会议日期倒序取确定第一 +「另 N 场」）；PROD-09 汇报表对全量 periodEnd/id 排序的相邻固定快照 diff 三指标（averageProgress / overdue_task / exceptions 总数），首份无徽标、零差「持平0」、文字+箭头非仅色；PROD-04 任务行「⋯ 移动到…」树选择器排除自身/后代，一次确认＝原子改父+项目全量 renumber、失败整树回滚、取消零写。验收 = **27/27 PASS、0 FAIL/BLOCKED/NOT_RUN/MANUAL_PENDING**（testedCommit `85cb651`；真 390 窄窗沿用 PL-WEB-11）；AUTO build/full guard=0、3 新专项 verify 全绿、GUI 隔离实例端口 3095 逐用例过证、正式 data/ 149 文件零污染。本批仅回写产品/living docs，未改 `src/`、未改 `docs/testing/`、未提交。**下一步（主线）＝schema v2：PROD-11 任务 `predecessorIds[]` 依赖 / PROD-21 repoUrl·branch / PROD-23 项目健康分 + 崩溃原子恢复**。
- **上一批状态（2026-10-13 doubao-work）**：**PROD-24 副驾多步规划（PROD-20 增量）已实现并通过独立验收总门 PASS**。模型可输出 `{"plan":[…]}`（stepId/title/reason/action/needs[]/riskNote?），前端 DAG 拓扑计划卡：checkbox 勾选跳过、行内 5 标量编辑（非法标红禁用确认）、3 条确定性软风险琥珀提示、整批/逐步两种确认、拒绝红行不可勾选；执行仍复用 ask-apply。**契约兑现**：domain 仍 v1、零新表、不写 settings、计划只在前端内存；唯一写 `task.update`；DAG 坏步局部拒（>8 步整拒）；同任务链式 baseline；旧 `{"actions":[…]}` 兼容；取消/降级零写。验收 = **49 项 AUTO/GUI 全绿、0 NOT_RUN/0 FAIL/0 BLOCKED**，2 项 MANUAL_PENDING＝CMP-DEG-05（真实免费模型限流/乱码/无 Key 实机）+ CMP-GUI-11（真 390px 窄窗目视），待所有者反馈。
- **上一批状态（2026-10-13 doubao-work）**：**PROD-07 顶层「人员与负载」视图（v0.5.1）已实现并通过独立验收**。跨项目按 `task.assignee` 归一化聚合未完成任务，风险排序、未分配置顶、点任务 `openRecord` 直达；纯前端派生、**不建人员表、不动 schema**。验收 = **28 PASS / 0 NOT_RUN / 0 FAIL**，唯一遗留 **1 项 MANUAL_PENDING＝真实 390px 窄屏目视**（须所有者本人在真浏览器确认）。
- **上一批状态（2026-10-13 doubao-work）**：无新增业务功能，做的是**外部 vendor Agent Skills 的长期规范接线**。按 **ADL-048** 只读 vendoring 首批 `mattpocock/skills`（锁上游 commit `49dd158d1076134a641b33efb035946536778336`；仅 grill-me/tdd/code-review/diagnosing-bugs 为公开 entry，grilling 为纯文档依赖）。落地物已由实施方落盘、**未提交**：`vendor/agent-skills/mattpocock/`（只读正文 + manifest.json）、政策 `docs/external-skills.md`、独立验收门 `docs/testing/external-skills-acceptance.md`、离线静态校验器 `packages/dsh-pm-tool/scripts/verify-external-skills.mjs`、试点模板 `docs/templates/external-skill-pilot-report.md`。本批接线方只改了规范/索引文件（ADL-048、AGENTS、README、KB-038、testing-README 索引、changelog/progress/handoff），**未碰上述落地物正文**。**状态（2026-10-13 独立测试专家签发）：试点可用，未毕业。** 自动化验收门 = **PASS**（域 A–H、J 全 PASS，无 FAIL/BLOCKED/F1，MANUAL_PENDING 无）；**`code-review` 试点 = PASS**（`docs/verification/external-skills/pilot-01-code-review.md`）；其余 3 entry（`grill-me`/`tdd`/`diagnosing-bugs`）尚未出试点报告（NOT_RUN），各补 1 份后方可毕业。绑定：HEAD=`93eb093c20648618c3e1d2914a20340d22325f86`、上游 commit=`49dd158d1076134a641b33efb035946536778336`。**ADL-049（自动路由）**：vendored skill 由纯函数 `src/core/external-skill-router.ts` 按结构化信号确定性路由、无需用户点名——缺阻塞信息→`interaction` 追问 route=none（**全拦**）；`vendorIntegrityVerified` 必须 **true**（安全门硬前置）；根因未明→仅 `diagnosing-bugs`（抑制 grill/tdd、不叠 review）；实质歧义非 trivial→`grill-me`；新功能/可测修复非 trivial→`tdd`；交付边界→追加 `code-review`（trivial 也保留）；`taskKind` 留痕。**实现已独立复核 APPROVE、`verify-external-skill-router.mjs` 41 组断言全绿、K 域专家 = PASS**；自动加载仍须先校静态校验 PASS + sha256、逐次留试点报告，受「项目规则 > 追问澄清 > 独立测试门」约束；**自动路由 ≠ 毕业**。**由谁继续（下一步）**：为其余 3 entry 各补 1 份试点报告推进毕业；在此之前任何平台使用 vendor skill 都须先读 `docs/external-skills.md` 并遵守 8 条红线。
- **上一批状态（2026-10-11 doubao-work）**：无新增业务功能，做的是**零成本模型通道就绪**。按 ADL-035 用已随 base bundle 装载的 `@deepseek-ai/dsh-llm-pi-ai`，在仓库外 `~/.dsh/profiles/pm/cordis.patch.yml` 按 id 追加 `providers.openrouter-free` → OpenRouter 免费自动路由模型 `openrouter/free`（OpenAI 兼容端点，`apiKeyEnv=OPENROUTER_API_KEY`，key 不入库）。新增可移植文档 `docs/model-providers.md`（含 9 家预留但不启用的官方厂商模板、开通验证 curl）。12 项 verify + build + `--dump-config` + 无 Key 真实宿主 bundle 断言全绿。**key 已由所有者配置在本机 `~/.zshrc`（仓库外、不入库），openrouter/free 直连与 dsh 应用内对话均已于 2026-10-11 实测成功**（应用内底部模型选择器选 Free Models Router 发「你好」第 1 次即通、无 MISSING_CREDENTIAL/401/429；详见 KB-034）。期间踩过一次 `MISSING_CREDENTIAL`——旧 dsh 进程未继承新环境变量，重启即解（KB-035 / ISS-024，永久做法是在 Web「设置→模型」页把密钥录进 credentials service）。**至此模型通道（配置+直连+应用内）全部打通**；生成型业务功能（智能 WBS/纪要/周报）仍按 ADL-032 暂缓、是否立项待所有者决定。
- **上一批状态**：R1–R12 已完成。此前一批（doubao-work）做的是**验收手段升级**：按 KB-032 用 puppeteer-core 驱动本机已装 Chrome 139（headless、不另装 Chromium、不要辅助功能授权），在隔离 DSH_HOME + 富种子 + 随机端口 + 无 Key 的真实宿主上对 R5/R7–R12 做了**真实点击/截图/浅深色/786/390 窄屏/控制台网络**自动目视，27/27 通过、0 console error/pageerror/失败请求。仅一处 CSS 微调（窄屏视图标签单行横滚）。12 项 verify + build + git diff --check 全绿。浏览器兼容按 ADL-033 仅承诺 Chrome；上游 dsh 新版本按 ADL-034 的 peer 锁定 + 升级冒烟处理。R11 里程碑提醒与生成型能力、多人实时协作、Excel 导入仍按决策暂缓/裁剪。
- **协作模式**：仓库是唯一事实来源，TRAE、豆包工作等多平台**地位平等、去中心化**；开工前先 `git pull --ff-only` 并扫描最新档案，改动后在 `changelog.md` 标注平台标识并同步知识/决策（细则见 `docs/collaboration.md`）。
- **建议阅读顺序**（均为本仓库标准中文 Markdown，自解释）：
  0. `docs/onboarding-prompt.md`（**启动提示词 + 当前交接快照**）、根 `AGENTS.md` 与 `docs/collaboration.md`（**接手准则与同步规则，最先读**）
  1. `README.md`（总览、目录、启动方式）
  2. `docs/requirements.md` **v0.8**（**做什么、验收标准、当前实体模型（含 4.7 交付物）、§5.1 落盘布局**——开发主依据）
  3. `docs/feasibility-map.md`（dsh 哪些能力复用/新建）
  4. `docs/tech-plugin-scaffold.md`（**怎么挂插件、真实 API、第 0 步实测结论**——开发主依据，重点读文末附节）
  5. `docs/knowledge-base.md`（已验证 API/模式/约定，当前至 KB-031）与 `docs/issues-and-solutions.md`（当前至 ISS-023）
  6. `docs/decision-log.md`（当前至 ADL-032；ADL-029 为 R12 只读派生方案，ADL-030/031/032 为 Excel 导入/多人协作/R11 生成型暂缓决策）
  7. `docs/handover-archive-doubao.md`（豆包工作阶段完整来龙去脉，需要背景时读）
  8. 本文件（环境恢复、装载/验证命令、下一步）
- **硬约束（来自项目所有者，务必遵守）**：
  - 上游 `~/Projects/dsh-pm/deepseek-harness/` **只读**，所有功能以独立仓库 `pm-tool/packages/` 内的外挂插件实现，不改上游一行；
  - 离线优先：核心增删改查走 `ctx.commands`（无 Key 可用），生成型能力一期仅预留接口；
  - 数据落人类可读 JSON（storage-domain + storage-json，root=`pm-tool/data`，**`data/` 不入库**）；
  - 里程碑到期提醒 R11 **第一版不做**；
  - 每次改代码前先说明「改哪个文件/为什么/影响范围」，删除、全局配置、对外推送先征得同意；每阶段更新 docs 并做清晰提交。
- **起步动作**：按第 3 节运行构建与全部 verify 脚本；启动 pm profile 后手动验收侧栏“项目管理”及项目/WBS/里程碑/风险问题操作。
- 第三方插件**独立顶级 Web 页面**已按 ADL-022 验证，不再是遗留技术项。

---

## 1. 仓库地址与分支

| 项 | 值 |
|---|---|
| 本产品仓库（核心成果）远程地址 | **`git@github.com:iceAcmen/pm-tool.git`**（GitHub，SSH，分支 `main`） |
| 本产品仓库本地路径 | `~/Projects/dsh-pm/pm-tool/`（main 工作区；正常情况下与 origin/main 一致，`git pull --ff-only` 后开工） |
| 首次提交 | `12bcad3` —— "chore: 阶段1 环境搭建与项目档案初始化" |
| 阶段 2 提交 | `70815a0`（需求 v0.2 + 可行性地图）、`54767e1`（需求 v0.3 + ADL-009）、`e7211c1`（阶段 2 收尾） |
| 阶段 3/4 发布 | R5 主功能 `9bce006`，原生主题工作台 `9487c24`，测试交付 `71b4212`；正式版本以 tag `v0.1.0` 为准 |
| dsh 专属 profile | `~/.dsh/profiles/pm/`（由 web 模板派生；以 `link:` 挂载本插件；补丁把存储 root 指向 `pm-tool/data`） |
| 上游框架源码本地路径 | `~/Projects/dsh-pm/deepseek-harness/`（只读，勿改） |
| 上游仓库 | <https://github.com/deepseek-ai/deepseek-harness>（分支 `master`） |
| 上游基线版本 | **v0.2.1-alpha.2** |
| 上游基线提交哈希 | `d743267388641bc76f17c45ce8b4c231aed1d32c`（2026-10-09 17:31 +0800，浅克隆 depth=1） |

> 说明：上游为浅克隆（`--depth 1`）。如需完整历史可在该目录执行 `git fetch --unshallow`。

## 2. 当前进度快照

### 已完成（阶段 1，全部完成）
- 核实 dsh 官方身份、技术栈、安装要求与插件架构（见 `docs/decision-log.md` ADL-001）。
- 安装用户级工具链：nvm + Node v22.23.3（npm 10.9.9）+ corepack/pnpm **11.28.5**，并写入 `~/.zshrc`。
- 浅克隆上游源码，`pnpm install` 成功（354 个工作区项目，约 1m17s，原生模块 postinstall 正常）。
- `pnpm run build` 成功（原生 addon + host + 357 个 client 产物，退出码 0）。
- 运行验证通过：`pnpm dsh web --no-open` 在 `http://127.0.0.1:3080` 启动；带一次性令牌 URL 完成认证后根路径返回 **HTTP 200**，页面标题 `DSH Local Build`、含 `id="root"` 与构建产物 `/assets/index-*.js`。验证后已关闭服务。
- 建立本产品独立 git 仓库与完整标准档案（README / docs / skills / packages）。
- SSH 认证打通并首次推送 main 到 GitHub（身份 Ice \<835687152@qq.com\>，仅仓库级配置）。

### 已完成（阶段 2 需求分析，已定稿 v0.3 并获项目所有者确认）
- 完成 dsh 能力可行性地图 `docs/feasibility-map.md`（本地源码 + 官方 cookbook/包 README 双路印证）。
- 四项产品决策（ADL-007）：离线优先混合模型、人类可读 JSON+Markdown 存储、先做 dsh Web 界面、最小闭环 MVP。
- 技术架构（ADL-008）：`storage-domain` + `storage-json` 落盘、用户命令（离线）/模型工具（在线）双入口、独立插件包 + 专属 profile。
- 三项补充决策（ADL-009）：业务数据目录 `data/` 暂不入库（已 gitignore）、里程碑提醒 R11 暂缓（P2）、生成型能力 MVP 仅预留接口不实现。
- MVP 范围：R1 项目计划 / R2 WBS 任务拆解 / R3 里程碑 / R4 持久化与导出 / R5 Web 界面 / R6 离线斜杠命令；数据模型与验收标准见 `docs/requirements.md`。

### 已完成（阶段 3 第 0 步「打通验证」，2026-10-10）
- 新建最小插件包 `packages/dsh-pm-tool/`：`/pm` 离线命令（ping/selftest）+ 存储领域 `pmtool`（per-record，表 `checks`，zod 校验）；包内 `tsc` 独立构建通过。
- 由 web 模板派生 profile `pm`，`link:` 绝对路径装入插件并自动激活；`--dump-config` 可见插件与存储三件套。
- profile 补丁将 storage-json `root` 覆盖到 `pm-tool/data`；宿主启动日志 `[pm-tool] 存储领域 pmtool 已打开`。
- Web 无 Key 执行 `/pm ping` 返回中文 pong（截图为证）；`scripts/verify-command.mjs` 跑通已构建插件的 selftest，落盘 `pm-tool/data/pmtool/checks/selftest.json`（可读、0700）。
- 修复真实 bug：`table.put()` 异步写盘漏 `await`（见 ISS-005）。
- 原遗留的第三方独立顶级 Web 页面已在 R5 按 ADL-022 验证完成。

### 已完成（首个业务增量，trae / TRAE，2026-10-10）
- 同一插件包内部增加 core/commands 模块，pmtool 版本 1 保留 checks，新增 projects；路径 `data/pmtool/projects/<id>.json`。
- 新增离线 `/pm project add {JSON}`、`list`、`get <ID>`；完整示例与必填字段见 `packages/dsh-pm-tool/README.md`。无新增插件包、Skill、依赖或 profile 改动。
- `pnpm run build` 与三个 `scripts/verify-*.mjs` 通过（退出码 0），验证增查、非法输入不落盘、10 次并发新增不覆盖、失败后恢复、旧 checks 兼容、0700、全新进程读回。项目测试独立临时库，保留结果路径供查看。
- 已用真实 dsh Web 无 API Key 执行 add/list/get：p-0001/p-0002 页面字段与 JSON 一致，目录 0700、文件 0600；服务已停止。新增仍为单进程队列，不支持多个宿主共享目录写入，R5 仍未开始。
- 提交主题：`feat(项目): 实现离线项目新增与查询及持久化验证 [trae]`（`b2ca50f`），连同 `0128203`、`9dbb3f9` **均已推送 origin/main（2026-10-10，HEAD `9dbb3f9`）**。

### 已完成（R1 离线项目 CRUD 收尾，trae / TRAE，2026-10-10）
- 新增 `/pm project update <id> {JSON片段} [confirm]` 与 `/pm project delete <id> confirm`；删除不带 confirm 只返回预览提示。
- 新增/更新校验 `targetDate >= startDate`；新增或实际改名撞到同名项目时默认阻止、末尾 confirm 放行（ADL-015）。
- 项目业务写操作统一排队，避免跨记录同名检查与编号分配的并发竞态；仍仅保证单宿主。
- 构建及 `verify-command/storage/projects.mjs` 全部退出码 0；项目脚本验证更新/删除重启读回、0700/0600、并发和写盘失败恢复。

### 已完成（doubao-work 独立复核 + 五项决策，2026-10-10）
- 独立复核结论：首批功能合格、建议验收（构建 + 三 verify 脚本退出 0；真实宿主加载插件；真实浏览器落盘 p-0001/p-0002 权限/内容正确；全新进程读回成功、无 Key 可用）。
- 复核边界：doubao-work 当前角色无 Mac 本机 GUI 权限、隔离浏览器被 browser-trust 503 拦截（安全设计），本机浏览器点击以 trae 已执行 + 落盘/进程级证据佐证（KB-014 / ISS-010）。
- 所有者五项决策已固化：删除 `confirm` 关键字、`targetDate>=startDate`、同名默认阻止+confirm 放行（ADL-012）；R5 排序与降级（ADL-013）；Node 口径 v22.23.3（ADL-014 / KB-015）。

### 当前交付点（R7 已验收）
- **存储布局（ADL-011/024/025/026 / requirements v0.7 §5.1）**：单领域 `pmtool` 下业务实体分表 per-record，用表 `keys()/entries()` 枚举，不建 index.json；当前含 projects/tasks/milestones/risk_issues/meetings/reports。
- **R7 结果**：统一风险问题台账、离线命令和 Web 工作台已完成；R4 已发布导出格式暂不包含 R7。
- **下一步（R1–R12 已全部完成）**：仓库定义的 R1–R12 已全部实现、验证并推送（HEAD `cbd50b6`）。后续仅余：① 项目所有者在本机对 R7–R12 Web 做最终目视确认（KB-014）；② 被裁剪/暂缓项（R11 里程碑到期提醒、智能 WBS/纪要/周报等生成型能力、多人实时协作、Excel 导入）需在具备 API Key/常驻调度或改变单用户离线定位后，按 ADL-030/031/032 重新评估，不属当前待开发。
- 接手平台须先提交该增量的**新增/修改文件清单**报备，获项目所有者确认后再写码；改动按 `docs/collaboration.md` 标平台标识并留痕。
- 里程碑提醒 R11 暂缓；生成型能力一期仅预留接口（ADL-009）。
- 第 0 步、首个业务增量及全部档案提交**均已推送 origin/main**（2026-10-10 经项目所有者确认）。

## 3. 环境依赖清单

- 操作系统：macOS 15.6.1，Apple Silicon（arm64），shell 为 zsh。
- Git：2.39.5（macOS 自带）。
- Node.js：v22.23.3，经 **nvm** 安装于 `~/.nvm`、`nvm alias default 22` 指向它（dsh 要求 `^22.19.0 || >=24`）。注意：在豆包工作沙箱命令行里可能显示其自带的 v22.23.2（PATH 遮蔽 nvm），不影响使用，标准口径仍为 v22.23.3（见 ADL-014 / KB-015）。
- pnpm：**11.28.5**，经 Node 自带 **corepack** 启用（版本以上游 `packageManager` 字段为准）。
- GitHub 认证：本机 ed25519 SSH 私钥 `~/.ssh/id_ed25519`（无密码，仅本机留存），公钥已登记在 GitHub 账户 iceAcmen，指纹 `SHA256:ajsc0fagRHsCMz1C0aEUUKYmny4EC9TeY6PwKTHY3pk`。
- 磁盘：工作区位于 `~/Projects/dsh-pm/`；上游含 `node_modules` 与构建产物，占用数 GB。
- API Key：阶段 1 不需要；后续如需真实模型，在 Web UI「设置 → 模型」填入 DeepSeek Key（环境变量 `DEEPSEEK_API_KEY`），**密钥不得写入仓库**。

新机器恢复命令（macOS）：

```sh
# 基础工具链
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc
nvm install 22 && nvm alias default 22
corepack enable

# 取本产品仓库（需把本机 SSH 公钥登记到 GitHub）
git clone git@github.com:iceAcmen/pm-tool.git ~/Projects/dsh-pm/pm-tool

# 取上游源码并跑起来（只读参考/运行）
git clone --depth 1 https://github.com/deepseek-ai/deepseek-harness.git ~/Projects/dsh-pm/deepseek-harness
cd ~/Projects/dsh-pm/deepseek-harness
corepack prepare pnpm@11.28.5 --activate   # 或直接 pnpm install，corepack 会按 packageManager 自动切换
pnpm install
pnpm run build
pnpm dsh web        # 终端会打印带 token 的本地访问 URL（token 每次启动变化）
```

在产品仓库构建插件并挂到本地 dsh（第 0 步已验证，均在上游目录 `~/Projects/dsh-pm/deepseek-harness` 执行）：

```sh
# 1) 构建自研插件
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm install && pnpm run build
node scripts/verify-command.mjs     # 离线确定性自检（应退出码 0，落盘 pm-tool/data/.../selftest.json）
node scripts/verify-storage.mjs     # 统一领域声明与旧自检记录
node scripts/verify-projects.mjs    # 系统临时库，项目完整回归
node scripts/verify-tasks.mjs       # WBS 完整回归
node scripts/verify-milestones.mjs  # 里程碑增查、排序与重启读回
node scripts/verify-risk-issues.mjs # 风险问题 CRUD、筛选与重启读回
node scripts/verify-meetings.mjs    # 会议、行动项、关联保护与重启读回
node scripts/verify-reports.mjs     # 固定快照、异常汇总、Markdown 与重启读回
node scripts/verify-deliverables.mjs # 交付物台账、版本/状态留痕、删除保护与重启读回
node scripts/verify-r12.mjs         # 关键字检索、统计看板、Markdown 任务表导入与重启读回
node scripts/verify-export.mjs      # Markdown 内容、路径与覆盖保护
node scripts/verify-web.mjs         # Web 快照、manifest 与动态 bundle 契约

# 2) 首次：由 web 模板派生 pm profile（会启动，Ctrl-C 即可），再 link 装入插件
cd ~/Projects/dsh-pm/deepseek-harness
pnpm dsh --profile pm --from-default-profile web
pnpm dsh plugin --profile pm add link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool

# 3) 把存储根目录指到产品目录（写 ~/.dsh/profiles/pm/cordis.patch.yml，内容见 docs/tech-plugin-scaffold.md）
#    然后查看配置 / 日常启动
pnpm dsh --profile pm --dump-config
pnpm dsh --profile pm --no-open     # 终端打印带 token 的 http://127.0.0.1:3080 URL；浏览器打开后输 /pm ping
```

> 注：插件改代码后需在包目录重新 `pnpm run build`，再重启 dsh（link 包不会热更新）。

## 4. 下一步从哪里继续

1. 阶段 2 已完成；当前开发依据 v0.7，落盘布局见 ADL-011/024/025/026。
2. **阶段 3 第 0 步「打通验证」已完成**：最小插件 `packages/dsh-pm-tool/` 已被本地源码版 dsh 装载，离线 `/pm ping` 与可读 JSON 落盘（`pm-tool/data`，0700）均验证通过；结论见 `docs/tech-plugin-scaffold.md` 文末附节、ADL-010、ISS-005～009。
3. **R1–R6 MVP 已完成**；R5 高密度表格、右侧抽屉和原生主题切换通过自动验证，所有者于 2026-10-10 确认手动验收通过。
4. **阶段 4 MVP 已完成并发布 v0.1.0**：冻结锁文件安装、构建、七项回归、profile 配置和隔离 profile 真实启动均通过。
5. **R7 已完成并验收**：八项回归及隔离 profile 真实浏览器 CRUD、筛选、主题、窄屏和重启读回通过；项目所有者已确认手动验证通过并授权提交推送。
6. **R8 已完成并验收**：首版手工结构化录入，不调用模型；行动项内嵌并使用稳定 ID，可关联任务/问题。九项回归、隔离浏览器和项目所有者手动验收均通过。
7. **R9 已完成并推送**：自定义周期固定快照、精简 Markdown、离线命令和 Web 通过十项回归；trae 实现后由 doubao-work 独立复核（隔离真实宿主启动 + 运行中下发 bundle 断言）通过并提交推送，未改业务代码；首版不接 schedule、模型或 PDF。本机浏览器目视项待所有者抽空确认（KB-014）。
8. **R10 交付物台账已完成（doubao-work）**：pmtool 领域新增 `deliverables` 表与 `/pm deliverable` 离线命令、Web「交付物」标签，版本/状态变化自动只增留痕，有交付物禁删项目；dsh 原生 deliverables 绑定 agent 轮次不适用离线台账，按 ADL-028 复用概念、数据层自研；11 项 verify 与隔离真实宿主 bundle 断言通过。
9. **R12 检索/看板/导入已完成（doubao-work）**：只读 `/pm search`（跨七类实体、`--type` 过滤）、只读 `/pm stats`（全项目/单项目聚合）、`/pm task import <项目ID> <清单.md> [confirm]`（缩进勾选清单→WBS，dry-run 不写盘）；Web 顶部「总览看板」基于 snapshot 派生跨项目统计卡片与全局搜索，不新增宿主路由、无硬编码色。12 项 verify（含新增 verify-r12.mjs）与隔离真实宿主 bundle 断言通过。
10. **剩余需求均已决策**：R11 里程碑提醒与智能 WBS/纪要/周报等生成型能力（ADL-032）、多人实时协作（ADL-031）、Excel 导入（ADL-030）暂缓/裁剪；待项目所有者提供可用 Key 或改变离线定位后再评估。本机浏览器目视（看板/全局搜索/窄屏）以所有者确认为准。
11. **R13/R14/R15 + A1/A2 已完成（doubao-work，2026-10-11）**：生成型三功能（`/pm task wbs`、`/pm report narrate`、`/pm meeting summarize`）已用真实 openrouter/free 端到端跑通并重启读回；随后 A1 在项目工作台加「AI 助手」面板（复用同一 core 草稿→confirm，未另写 LLM 层），A2 实现任务显式级联删除（dry-run/缺 cascade 拒绝/cascade confirm，旁支不动、跨表引用保护保留）。全 16 个 verify + build + frozen lockfile + `git diff --check` 绿。首页 `/pm` 问题已定位为宿主 composer 行为（ADL-038/KB-037/ISS-026），以 Web 面板为稳定入口。v0.2.0 发布说明已起草但**未打 tag**，待组织者独立验收。

## 5. SSH 密钥（已配置，备查）

- 私钥：`~/.ssh/id_ed25519`（本机留存，勿外传）；公钥：`~/.ssh/id_ed25519.pub`。
- 公钥已由项目所有者添加到 GitHub 账户 iceAcmen；`ssh -T git@github.com` 返回 `Hi iceAcmen! You've successfully authenticated...` 即正常（该命令退出码 1 是 GitHub 不提供 shell 的正常现象）。
- 公钥指纹：`SHA256:ajsc0fagRHsCMz1C0aEUUKYmny4EC9TeY6PwKTHY3pk`。
- 换新机器时：重新生成密钥并把新公钥登记到 GitHub，再执行上面的 clone 即可。

# 持久交接（TRAE 不必重梳理，版本事实统一线 @ 217d8ae；v0.7.1 最终可发布，tag 将在最终提交创建）
## 仓库
- 插件：packages/dsh-pm-tool；上游 deepseek-harness 只读。
- **版本口径（2026-10-14 v0.7.1 最终可发布）**：`package.json` = `0.7.1`；已发布 tag `v0.1.0`–`v0.7.0`（均注解 tag）。**v0.7.0 已发布**：tag 对象 `b6ba06ac` → 提交 `217d8ae`。**v0.7.1 独立测试专家已最终签 PASS、可发布**：S1/S2/S3 28/28 PASS、59 verify scripts 全绿、157 资产 guard 零变化、client bundle `dd66be29…`；注解 tag 将在最终提交时创建（当前 HEAD `217d8ae`，最终 release commit SHA 待定）。v0.5.0 tag 对象 `c8d3da52` → 提交 `81c5a112`；tag 对象与剥离提交是两个 SHA，勿混为"对不上"。
## 运行
- 构建：`cd packages/dsh-pm-tool && pnpm run build`。
- 全量非GUI回归：`node scripts/verify-integration.mjs`（已含 spawn 子进程 reopen 读盘）；再 `for f in scripts/verify-*.mjs; do node $f; done`。
- 隔离 GUI 实例（勿动所有者 3080）：DSH_HOME=项目内 .tmp/e2e-home、storage root=.tmp/e2e-data、DSH_PM_E2E=1、端口 3082、--no-open；token 从启动日志取，勿入库。
## 关键边界
- ask-apply 去重为内存 60s，重启不持久；写库走 updateTask 领域校验；--base 必带且格式校验。
- backup 默认目录 = 仓库 `packages/backups/`（源码 `BUILTIN_DEFAULT = '../../../backups/'`，相对 `packages/dsh-pm-tool/lib/core/backup.js` 解析即 `packages/backups/`；**不是** `packages/dsh-pm-tool/backups/`、也不是仓库根 `backups/`）。取值优先级：**显式 directory 参数 > 环境变量 `DSH_PM_BACKUP_DIR` > builtin**；测试用注入 directory 隔离。v0.6.1 起恢复队列化、失败自动回滚。
## 未覆盖
- **v0.7.1 已最终签 PASS、待最终提交打 tag**：S1/S2/S3 28/28 PASS、59 verify scripts 全绿、157 资产 guard 零变化、client bundle `dd66be29…`。用户已授权最终发布/提交/正常 push/正式升级，但**暂不 commit/tag/push**，等用户最终通知执行最终提交并打注解 tag。
- 已确认：深色错误对比度用户目视已通过。**PoC 车道 `our-free-model`/`kilo-auto/free` 免费免 Key**；**仅生产（prod）真实 Key 缺配（M-01），MANUAL_PENDING，不阻塞 v0.7.1 发布**。G8/H5 不可逆人工动作仍 MANUAL_PENDING。
