# #25 真 390px 窄窗响应式正式修复 · 隔离实测证据（2026-10-16/17）

> 任务 #25（GI-WEB-14 / PROD-07 遗留，原 MANUAL_PENDING）。仅在隔离 worktree
> `.tmp/p0-narrow390`（分支 `p0/narrow-390`，基线 3ad7f15）内工作；不碰主树并行 WIP，
> 不 merge、不 push、不改 package.json version、不打 tag。

## 环境隔离（不碰正式 3080/3091）

- 宿主只读克隆 `/Users/bytedance/Projects/dsh-pm/deepseek-harness`（未改上游）。
- 独立 DSH_HOME=`…/.tmp/narrow390-20261016/home`，独立 data/backups；端口 **3155**（避开正式 3080=PID 66364、3091 及历史端口）。
- profile `node_modules/dsh-pm-tool` 软链与 `package.json` 的 `link:` 均指向 **worktree 包**
  `.tmp/p0-narrow390/packages/dsh-pm-tool`（非主树包），避免截到旧 bundle。
- 停服按 ISS-027：lsof 查端口 → 核 cwd(=deepseek-harness)/argv → 单 PID `kill -TERM`，未用 pkill/killall。
  旧实例 PID 47218 TERM 后确认 DEAD、3155 DOWN；重启新实例 PID 58984。

## served bundle 生效证明（真实启动回读，非仅看代码）

- 浏览器真实加载后，监听全部响应体，定位到聚合插件包
  `/plugins/??…,dsh-pm-tool/client.js,…&rev=<hash>`：
  - 含 `#25 真 390px` 标记串（marker=true）
  - 含 `max-width: 560px` 收窄断点（bp=true）
- 重建后聚合包 rev 指纹随之变化（`rev=2325e4d88631`），证明下发的是 worktree 新 bundle。

## 390px 溢出扫描（真实 Chrome headless，视口 390×844，deviceScaleFactor=2）

- 扫描口径：`.pm-shell` 内任一元素 `right - shell.right > 3px` 即外壳溢出；
  有意内部滚动容器（`.pm-table-scroll` / `.pt-scroll` / `.pm-gantt-scroll` / `.pm-view-tabs`）豁免。
- 结果：浅/深两套 × 9 视图 + 新建任务抽屉，**20/20 PASS，无外壳水平溢出**（shellW=334，即 390 窗口扣除宿主左栏后的实际面板宽）。
- 天然宽内容（任务表、甘特时间轴）在各自内部滚动容器横滚，外壳不溢出；单元格内日期/标题 ellipsis 属内部省略，非外壳裁切。

## 截图清单（浅 light-* / 深 dark-*，各 10 张）

- 01-overview 项目概览 / 02-tasks 全部任务 / 03-milestones 里程碑 / 04-risk-issues 风险与问题 /
  05-meetings 会议纪要 / 06-deliverables 交付物 / 07-reports 进度汇报 / 08-gantt 甘特排期 /
  09-people 人员负载 / 10-drawer-new-task 新建任务抽屉（表单骨架）。
- 深色趟：`body[data-ds-dark-theme]` 原生注入，token 自动解析为深色值，浅深均清晰。

## 桌面未回归

- 全部窄屏规则只写在 `@media (max-width: 560px)` 内，≥1024 桌面不命中；未改既有桌面选择器几何。
- 构建 `pnpm run build`=0 error；`verify-isolation.mjs` 71 脚本 / 70 通过 / 1 失败（仅 verify-export.mjs
  硬编码路径须以 `/pm-tool/exports/` 结尾，worktree 在 `.tmp/p0-narrow390` 下不匹配，属已知环境假象，非回归），资产污染 0。
