# GUI 作战室「进行中」KPI 热修独立验证记录（真实浏览器，隔离宿主）

- **日期**：2026-10-14
- **对象**：war-room「进行中」KPI 热修（TDD 已完成，3 文件：`src/core/status.ts`、`src/core/war-room.ts`、`scripts/verify-war-room.mjs`）。根因 `computeKPI` 误判 `status==='doing'`（真枚举为 `in_progress`），导致进行中恒为 0。
- **被测**：主工作树未提交热修（`git status` 7 个 M + 若干未跟踪文件，均为 S4 批次既有改动）。**未改产品、未改冻结矩阵、未提交。**
- **模式**：独立 `DSH_HOME` + cordis patch 指定 storage root + 独立备份目录 + 空闲端口 **3122**，真实 Chrome（v139）headless 经 puppeteer-core 驱动，无任何 API key。

## 源码/专项审查结论
- `status.ts`：新增纯谓词 `isDoneStatus`/`isInProgressStatus`（单一来源，仅判状态字段）；`TASK_STATUSES = [todo, in_progress, blocked, done]` 未变。
- `war-room.ts`：
  - `inProgress` 由 `status==='doing'` 改为 `isInProgressStatus(t.status)` → **修复点**。
  - done 口径抽闭包 `isTaskDone = isDoneStatus(s) || progress>=100`，KPI 与议程复用同一份，**语义不变**。
  - overdue 口径 `!isTaskDone(t) && dueDate<today`，**语义不变**；buildAgenda 同步改用 `isTaskDone`。
- 数据层 `taskStatusSchema = z.enum(TASK_STATUSES)` 拒收 `doing`；真实数据 22 任务零 `doing`（todo 20/done 1/in_progress 1）。
- 旁证（非本热修范围）：任务行内联下拉仍有 `<option value="doing">`（panel.tsx:1988），经真实表单提交会被 zod 拒收落错误，不污染数据；面板新建任务表单 status 下拉已是真枚举四态。

## 单元断言（Node，隔离运行）
- `node scripts/verify-war-room.mjs` → **OK（退出 0）**：含新增回归守卫——真枚举五态下 total=7、doneRate=29%、inProgress=2（`doing` 假值不计入）。
- `node scripts/verify-web.mjs` → **通过（退出 0）**：Web 快照/client bundle 契约不变。

## 进程红线（ISS-027 严格遵守）
- 隔离实例：监听 PID **8436**（首轮）→ 修正 patch root 后重启为 PID **9859**，均 `--port 3122`、cwd=`~/Projects/dsh-pm/deepseek-harness`、`--no-open`，启动即记 PID。
- 收尾：仅对 8436、9859 分别 `kill -TERM`（一次优雅退出，未 KILL、未 pkill）；验 3122 = DOWN。
- 正式服务全程未触：**3080=PID 93536 / 3091=PID 93537** 启动前后均 LISTEN、PID 未变。

## 隔离拓扑（全在项目 .tmp，不碰正式数据）
- `DSH_HOME=.tmp/warroom-20261014/home`（克隆自上一轮隔离 home；其 `profiles/pm/cordis.patch.yml` 硬编码 storage root，已改为指向本次隔离 data）
- storage root = `.tmp/warroom-20261014/data`（空起步）；`DSH_PM_BACKUP_DIR=.tmp/warroom-20261014/backups`
- profile 软链相对路径 `../../../../../../packages/dsh-pm-tool` 指向主工作树被测包。

## 真实浏览器逐项结果
经面板 GUI「新建项目」+「添加记录」表单（非聊天框）构造项目 p-0001「热修验证项目」与 5 任务：

| 任务 | 状态 | 进度 | 截止 | 设计意图 |
|---|---|---|---|---|
| V-未开始 | todo | 0 | 2026-12-20 | 纯 todo |
| V-进行中且逾期 | in_progress | 50 | 2026-10-10 | 唯一 in_progress，且逾期（今天 2026-10-14） |
| V-受阻 | blocked | 50 | 2026-12-20 | 关键回归：不得计入「进行中」 |
| V-已完成 | done | 100 | 2026-10-10 | done 不计逾期 |
| V-进度满格 | todo | 100 | 2026-12-20 | progress>=100 即 done（含边界） |

「项目概览」（作战室，`.pm-overview.pm-war-room`）实测 DOM 与逐项断言：

| 项 | 预期 | 实测 | 证据 |
|---|---|---|---|
| KPI 任务总数 | 5 | **5** | warroom-dom.json / 60 截图 |
| KPI 完成率 | 40%（2/5） | **40%** | 同上 |
| **KPI 进行中** | **1**（仅真枚举 in_progress；blocked 不计） | **1** ✅ 修复生效 | 同上 |
| KPI 逾期 | 1（仅 V-进行中且逾期；done 豁免） | **1** | 同上 |
| KPI 近期里程碑/未闭环风险 | 0 / 0 | 0 / 0 | 同上 |
| 摘要「总任务数」note | 1 项进行中 | **1 项进行中** | 60 截图 |
| 摘要「已完成」 | 1（仅 status=done，完成率 20%） | **1 / 20%** 口径未变 | 同上 |
| 摘要「已延期」 | 1 | **1**（红色「需要优先处理」） | 同上 |
| 状态分布 | 未开始2/进行中1/受阻1/已完成1 | **2/1/1/1** | 同上 |
| 议程 | 逾期 4 天·任务到期 2026-10-10 | ✅ 仅一条（V-进行中且逾期） | 60 截图 |
| 磁盘落盘 | 5 条 v2 信封 JSON，状态全为真枚举 | ✅ t-0001..t-0005 逐一核对 | 隔离 data 目录 |
| console / pageerror | 0 | 0 | — |

> 修复前同款数据下 KPI 进行中会渲染 **0**（`status==='doing'` 无匹配）；本次实测 **1**，回归成立。

## 零污染核验（sha256 + size + mtime 三元组）
- WATCH = `data/` `packages/backups/` `exports/`：before **159** 文件 = after **159** 文件，**added=0 / removed=0 / changed=0** → **ZERO-POLLUTION OK**。
- 正式任务目录 22 条任务记录前后一致；`git status` 无新增产品改动（仅既有未提交批次 + 本证据目录）。

## 偏差（如实）
1. **首轮实例误指上一轮 scratch**：克隆 home 的 `cordis.patch.yml` 硬编码上一轮 storage root，首次启动（PID 8436）把聊天框误发的 5 个 `V-*` 任务写进了 `.tmp/drag-hotfix-20261014/data`（.tmp 隔离 scratch，非正式资产）。已 TERM 8436、删除那 5 条文件（该 scratch 恢复 10 任务）、改 patch root 后重启（PID 9859）。正式 `data/` 全程未受影响。
2. dsh web 聊天框 `/pm ...` 在本版本不触发命令执行（无斜杠面板、发送即普通消息）；改用面板自身「新建项目/添加记录」表单完成真实浏览器构造，路径更贴近用户 GUI。
3. 零污染首跑比对脚本报假阳性 150 项变化（JSON list vs Python tuple 三元组恒不等）；规范化类型后复核为 0 变化。

## 收尾
- 隔离宿主 3122 已停（8436/9859 均 EXITED）；正式 3080/3091 未触。
- 本批仅采集证据，**未改产品 src、未改 docs/testing 矩阵、未 commit**。
