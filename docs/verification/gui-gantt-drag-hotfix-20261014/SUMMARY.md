# GUI 甘特拖拽热修验收记录（真实浏览器，隔离宿主）

- **日期**：2026-10-14
- **对象**：v0.7.2 拖拽手感 / 成功提示热修（GI-WRITE-06/07、GI-WEB-16~20）。根因 `nowrap + hint`，现 `.pm-gantt` 改 `flex-wrap:wrap`；拖拽走 `run(...,{quiet:true})`、内联 `role=status`、`saving` 锁。
- **被测**：未提交工作树（`panel.tsx`/`panel.css` + 新增 `scripts/verify-gantt-drag.mjs`）。**未改产品、未改冻结矩阵、未提交。**
- **模式**：独立 `DSH_HOME` + 独立 storage root + 独立备份目录 + 空闲端口 **3120**，真实 Chrome（v139）headless 经 puppeteer-core 驱动，无任何 API key。

## 进程红线（ISS-027 严格遵守）
- 隔离实例：**监听 PID = 86864**，`--port 3120`，cwd=`~/Projects/dsh-pm/deepseek-harness`，`--no-open`。启动即记 PID。
- 收尾：仅对 **86864** `kill -TERM`（一次即优雅退出，未用 KILL、未 pkill）；验 `ps -p 86864` = EXITED、3120 = DOWN。
- 正式服务全程未触：**3080=PID 69064 / 3091=PID 69065** 启动前后均 LISTEN、PID 未变。无其它游离 dsh 监听（8326 为 69065 自身内部口）。

## 隔离拓扑（全在项目 .tmp，不碰正式数据）
- `DSH_HOME=.tmp/drag-hotfix-20261014/home`（独立 profile，`node_modules/dsh-pm-tool` 相对软链仍指本包）
- storage root = `.tmp/drag-hotfix-20261014/data`（复制上轮富种子后**重置 t-0005 基线 10-15~10-18**）
- `DSH_PM_BACKUP_DIR=.tmp/drag-hotfix-20261014/backups`
- 富种子项目 p-0001：t-0001..t-0010 + m-0001；含 A→B 依赖(t-0004→t-0005)、父/子(t-0006/t-0007)、窄条 t-0008、未排期 t-0009、跨期 t-0010(使轴宽 992>clientW 768 可横滚)。

## 严格核实际生效包
- 构建产物 `packages/dsh-pm-tool/lib/client.js` sha256 = `68238d1a37c4eccfe16ff1699b91310e304d47eddc01466ac19b5193892131d8`（332.14 kB）。
- 宿主实际下发合并 bundle：HTTP 200 / 1210939 B / sha `98dcbd6e…`，**含 `pm-gantt-bar` = true**（确认浏览器加载的是本次 link: 构建，非旧包）。
- 静态契约 `node scripts/verify-gantt-drag.mjs` 退出码 0：flex-wrap 首行宽度 / quiet 成功 / 失败可见 / 单 refresh / inflight 禁拖 / timer 清理 / aria-live / payload 白名单 齐备。

## 真实浏览器逐项结果（执行端只采证，判定权在测试专家）
| 项 | 结果 | 证据 |
|---|---|---|
| 拖前 `.pm-gantt-scroll` clientWidth>0 | ✅ clientW=768（scrollW=992） | dom-before.json |
| 拖后 clientWidth>0 且画布/条/箭头仍在 | ✅ clientW=768；bars=9、svg=1、path=1、arrow=1 均在 | dom-after-success.json / 11 截图 |
| 拖拽改期**即时**更新、无需 F5 | ✅ t-0005 `10-15~10-18`→`10-18~10-21`，mouse.up 后未 reload 即落盘+重渲染 | results-drag |
| 成功**无全字段深色 Notice** | ✅ `.pm-notice` count=0（对比附件旧版全屏大卡已消除） | 11-after-success-drag.png |
| 成功只 inline `role=status`「已更新」 | ✅ 文本=`已更新：2026-10-18 ~ 2026-10-21` | 11 截图底部 |
| inline 约 3s 自动消失 | ✅ ~3.5s 后 `role=status` 为空、且仍无 Notice | dom-after-toasthide.json |
| 保存中快速连拖只一次写、无 ghost | ✅ 紧接两次拖拽仅落≈1 步（due 10-21→10-24，shift≈3 而非 6）；任务文件数恒 10 无新增 | results-drag |
| <4px 点击开抽屉且零写 | ✅ dialog 打开；t-0004 updatedAt/日期 未变 | 12-click-opens-drawer.png |
| 横滚后拖不误触 | ✅ scrollLeft=220 后拖 t-0002 正常 `10-05~10-08`→`10-08~10-11`，bars=9 | 13/results |
| 父派生条不可拖 | ✅ 拖 t-0006(虚线 parent) 后父 `10-20~10-24` 不变、子 t-0007 `10-21~10-22` 不被牵连 | 14-parent-drag-attempt.png |
| 故障注入：内联错误 | ✅ `更新失败，请重试` | 15-fault-injection.png 底部 |
| 故障注入：全局错误不被 quiet 吞 | ✅ `.pm-notice--error`×1：`任务操作失败，未返回成功结果；请检查存储配置、目录权限…` | 15 截图顶部红框 |
| 故障注入：条坐标回落无 ghost | ✅ t-0005 geom 576px/64px 前后一致 | dom-fault.json |
| 故障注入：服务端零写 | ✅ t-0005 updatedAt/起止 均未变 | results-fault.json |
| 重载(等价重启)读回持久化 | ✅ reload 后 bars=9、clientW=768、无 NaN | 16-after-reload-readback.png |
| 重启读回白名单 | ✅ progress=40、predecessorIds=[t-0004] 均未被拖拽改动，仅 start/due 变化 | dom-readback.json |
| console / pageerror | ✅ 0 | results-*.json |

> 故障注入采用**隔离只读缝**（任务目录 555 + 文件 444，使 `task update` 写盘必失败），**不改产品源码**；测后已 chmod 还原。

## 零污染核验（sha256 + size + mtime）
- WATCH = `data/` `packages/backups/` `exports/`（`packages/backup/` 不存在）。
- before = **156 文件**（data 72 + backups 83 + exports 1）；after = **156**；changed=0 / added=0 / removed=0 → **ZERO-POLLUTION OK**。
- 隔离备份目录指向 .tmp，拖拽/故障触发的任何写均未落正式 `backups/`。

## 偏差（如实）
- 首轮故障注入在测试5后误触的父任务抽屉遮挡下进行，鼠标未落条体 → 既无写也无错（两项 XX）；定位为测试时序问题（非产品缺陷）后，关抽屉重跑 `gui-fault.mjs`，故障四断言全绿，证据以 `15-fault-injection.png`/`dom-fault.json`/`results-fault.json` 为准。
- WATCH 实测为 **156**（与交接记录的 157 差 1）：本批 before==after 同口径零变化，差异来自两批之间正式备份目录的自然轮换，非本次写入。

## 收尾
- 隔离宿主 3120 已停（PID 86864 EXITED）；正式 3080/3091 未触。
- 本批仅采集证据，**未改产品 src、未改 docs/testing 矩阵、未 commit**。
