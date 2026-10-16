# GI-CP-01~05 关键路径（只读高亮）隔离 GUI 实测证据

> 日期：2026-10-16 ｜ 平台：doubao-work ｜ 基线：main `86d81d7` ｜ 端口：**3131（隔离）**，正式 3080/3091 全程未触。
> 范围：只做关键路径**只读高亮**，不做自动排期/自动改期/自动补日期/自动顺延，不引入 vitest。

## 1. 环境与启动（ISS-027 精确 PID 流程）

- 机器 macOS（Darwin），Node 22 + pnpm 11.28.5；无 Key（our-free-model 免费车道）。
- 隔离根：`.tmp/cp-20261016/`，独立 `DSH_HOME=…/home`、独立 storage root `…/data`、独立备份目录 `…/backups`，`cordis.patch.yml` 把 storage-json root 指到隔离 data、无任何 LLM provider/key。
- 启动（宿主根 `~/Projects/dsh-pm/deepseek-harness`，只读未改上游）：
  `DSH_HOME=<隔离>/home DSH_PM_BACKUP_DIR=<隔离>/backups node --import tsx/esm apps/cli/src/bin.ts --profile pm --port 3131 --no-open`
- 执行轮隔离监听 PID：浅色趟=9896（含 GI-CP-05 白名单拖拽）、深色趟=11120（纯浏览零写）；期间轮换过 98254/951/3110，均仅 `kill -TERM` 单 PID，验 EXITED、3131=DOWN；未用 pkill/killall/KILL。
- 正式端口启动前后核对：**3080=PID 66364 全程 LISTEN、PID 未变；3091 未监听；无 3102/3120/3122/3131 残留监听**。
- 浏览器：系统 Chrome（puppeteer-core 25.13，headless=new，viewport 1280×900）。

## 2. 种子（seed-cp.mjs，仅落隔离 data）

- 关键链（应全高亮）：`t-0001 需求分析 10-01~10-03` → `t-0002 方案设计 10-05~10-08` → `t-0003 开发实现 10-10~10-14`。
- 时差分支（正时差、非关键）：`t-0004 文档编写 10-01~10-02`，前置 t-0001。
- 成环（循环不可计算）：`t-0005 互审甲 ↔ t-0006 互审乙`（互为前置，均排期）。
- 缺日期（缺日期段跳过）：`t-0007 待补排期任务` 仅 startDate、缺 dueDate，前置 t-0003。

## 3. 纯函数口径（core/gantt.ts `criticalPath`）

AON 活动节点、只读纯函数（无 I/O、无随机、无墙钟、不调用 run/execute、不回写派生字段）。
- 工期 `taskDurationDays(start,due)`（含端点，单日=1）；ES/EF/LS/LF 为相对组件起点的整数天偏移，FS 零间隔、不建模 lag。
- 正向 Kahn：根 ES=0，后继 ES=max(前置 EF)，EF=ES+duration；反向按**连通分量**（并查集）各自取组件最大 EF，汇点 LF=组件最大 EF，前驱 LF=min(后继 LS)，LS=LF−duration，slack=LS−ES；**slack=0 → 关键路径**。
- 诚实降级：成环节点（3 色迭代 DFS）标 `inCycle`、跳过正/反遍历、不高亮、不自动打断；缺日期节点标 `missingDate`、不参与、不补日期；自指/悬空边计数剔除；多连通分量各自取组件终点，短分量不被全局终点挤出假正时差。

## 4. 逐项结果（results-light.json 15 项 / results-dark.json 13 项，全 OK；dom-*.json）

| 用例 | 结果 | 证据 |
|---|---|---|
| GI-CP-01 线性链全排期高亮 | PASS | criticalBars=`[t-0001,t-0002,t-0003]`；关键边 2/3（t1→t2、t2→t3）；图例「关键路径 3」；t-0001 tooltip 含「关键路径（总时差 0 天）」；时差分支 t-0004 非关键、边非关键 |
| GI-CP-02 成环不崩溃/不高亮/不打断 | PASS | t-0005/t-0006 均不在关键路径；徽标「循环不可计算」；console/pageerror=0；未改期未打断 |
| GI-CP-03 缺日期诚实降级 | PASS | t-0007 无任务条、列「未排期」；徽标「缺日期段已跳过」；不补日期不顺延 |
| GI-CP-04 零写静态 + 浏览零写 | PASS | core/gantt.ts 无 `run(`/`execute(`/fs 写（verify-critical-path.mjs 静态 grep）；深色趟 before=after 任务哈希逐字节一致（DARK_ZERO_WRITE_OK）；浅色趟任务 sha256 before/after diff 仅 t-0003 一条（白名单拖拽），其余 6 条逐字节不变 |
| GI-CP-05 拖链尾前置纹丝不动/不顺延 | PASS | 拖 t-0003（10-10~10-14 → 10-13~10-17）；t-0001、t-0002 全记录 JSON 逐字节不变（日期/predecessorIds/progress 0）；t-0003 仅日期平移、progress 0→0、predecessorIds 不变；拖后关键链仍 t1/t2/t3 |

## 5. 截图

- `10-gantt-light.png`：浅色，关键链三条蓝环 + 「关键」标签 + 蓝色关键箭头，图例/循环红徽/缺日期琥珀徽清晰。
- `11-after-drag-tail.png`：浅色，拖链尾 t-0003 后前置 t-0001/t-0002 原位、关键边跟随。
- `12-gantt-dark.png`：深色（cordis preference=dark 原生注入，`body[data-ds-dark-theme]` 存在），关键链/关键边/图例/徽标两态均清晰可读。

## 6. 构建与离线门禁

- `pnpm run build` = 0 error（tsc + 拷 css + tsdown）。
- `node scripts/verify-isolation.mjs`：**共 70 脚本 / 通过 70 / 失败 0；资产 before=162 after=162，污染 0**。
- 新增 `scripts/verify-critical-path.mjs`（线性链 ES/EF/LS/LF/slack、并行时差、成环、缺日期、多分量、自指/悬空、空输入、确定性逐字节、零写静态 grep）；`verify-gui-contract.mjs` 补关键路径静态钩子。
- `lib/client.js` sha256=`c829fb4a7ba2afa603f869bf8480902cd260f073a53d4c7e5aee450ce5e58ae9`。
- 说明：宿主对外服务会对 bundle 再处理（minify/hash），故 served body sha 与 lib 源文件不逐字节相等；以「served 200、含关键路径 class、DOM 实测 3 条关键链」为准。

## 7. 边界（未做，留待后续批次）

- 不做关键路径**自动排期/自动压缩/自动改期**（那是产品「甘特B 长期观望」项，与本次只读显示严格区分）；不引入 vitest（#24 范围）；不配置生产 Key；不动 schema/storage.ts/派生字段回写。
