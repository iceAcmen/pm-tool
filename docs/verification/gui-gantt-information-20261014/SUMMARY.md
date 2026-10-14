# GUI 甘特信息验收记录（真实浏览器，隔离宿主）

- **日期**：2026-10-14
- **被测基线**：HEAD `02f42d1` 之上的未提交工作树（gantt.ts / panel.tsx / panel.css / verify-gantt / verify-gui-contract 改动）。**未提交、未改产品代码、未改冻结矩阵** `docs/testing/gantt-information-acceptance.md`。
- **模式**：独立 `DSH_HOME` + 独立 storage root + 独立备份目录 + 空闲端口 `3102`，真实 Chrome headless（v139）经 puppeteer-core 驱动。
- **官方服务未触**：`3080`(owner PID 38512) / `3091`(PID 38513) 全程存活、PID 未变。

## 严格核 client hash
- 构建产物 `packages/dsh-pm-tool/lib/client.js`：
  - sha256 = `434a08fa44fcaf8376022cea212463c403e3ca1bb7bff327ed875ad5a9adb06d`（331820 B）
  - `lib/index.js` = `9afaf5c4…`；`lib/client/panel.css` = `1f47343a…`
- 运行中宿主实际下发（`GET /plugins/??…dsh-pm-tool/client.js&rev=f014bd9b3f2d`，HTTP 200，合并 bundle 1210620 B）：
  - sha256 = `96358426c5344a677b0eb9440b33fac9d26d04d14bfe8d85baaecf53c546f28f`
  - **含 `pm-gantt-bar` 甘特串 = true**（确认浏览器加载的是本次 link: 构建，非旧包）。
- 说明：下发 bundle 为多插件合并 + 宿主 module-loader 包裹，故与裸 `lib/client.js` 不同字节；已用「含本批甘特渲染串」证明实际生效包 = 本次构建。

## 隔离拓扑（全部落在项目内 .tmp，不进正式数据）
- `DSH_HOME=.tmp/gi-gui-20261014/home`（独立 profile，link 到本包）
- storage root = `.tmp/gi-gui-20261014/data`
- `DSH_PM_BACKUP_DIR=.tmp/gi-gui-20261014/backups`
- 无任何 API key；welcomeNotice 已由宿主自身持久化到隔离 patch。

## 最小数据（项目 p-0001「GI甘特验收」）
- 进度三任务：t-0001=0% / t-0002=50% / t-0003=100%(done)，同区间 10-05~10-08
- A→B 依赖：t-0004 前置A(10-12~10-13,20%) → t-0005 后继B(10-15~10-18,40%, predecessorIds=[t-0004])
- 父/子：t-0006 父阶段P(10-20~10-24) + t-0007 子任务C(6.1, parentId=t-0006, 10-21~10-22)
- 1 天窄条：t-0008（10-12~10-12，长标题）
- 无排期：t-0009（无 start/due）
- 里程碑：m-0001 正常里程碑发布（targetDate 10-28，菱形）
- 横滚驱动：t-0010 跨期长任务（09-18~11-12，55 天，使轴宽 992px>面板 768px）

## 矩阵结果（真实浏览器实测）
| 项 | 结果 | 证据 |
|---|---|---|
| 条体渲染 / 0% 可辨 | ✅ 8 条；0% 条 fillW=0 但条体 64px 描边可见 | dom-gantt.json |
| 50% 填充比例 | ✅ 31/64≈48% | dom-gantt.json |
| 100% done 等价 | ✅ done class + fill 62/64≈97% | dom-gantt.json |
| 0% 不误判 done | ✅ p0 done=false | dom-gantt.json |
| 每条直显起止日期 | ✅ side 标签 7 条「MM-DD ~ MM-DD · N%」（窄条走外置策略） | 10-gantt-light.png |
| 百分比直显 | ✅ side 标签含 % | 10-gantt-light.png |
| 今日线 | ✅ `.pm-gantt-today` left:200px（10-14） | 10/17 截图 |
| 依赖箭头方向 | ✅ svg 1 / path 1 / arrow 1；title「前置 前置A → 后继B」 | dom-gantt.json |
| 依赖随画布横滚对齐 | ✅ svg 在 canvas 内，scrollLeft 0→224 后箭头随行 | 17-gantt-dark-scrolled.png |
| focus / ARIA | ✅ 每条形 tabIndex=0 role=button aria-label「任务 X：start~due，工期 N 天，进度 P%…按回车打开详情」 | dom-gantt.json |
| Enter 打开抽屉 | ✅ Enter → role=dialog 任务编辑抽屉打开 | 12-drawer-enter.png |
| 浅/深主题 | ✅ 浅(10-gantt-light) / 深(16/17, bodyBg=rgb(21,21,23)) 均可读；甘特色值全走 --dsw-alias-* 无硬编码 hex | 10/16/17 |
| 横滚 | ✅ scrollW=992 > clientW=768；scrollLeft 0→224；左标签列固定对齐 | 17-gantt-dark-scrolled.png |
| 无 NaN | ✅ body 无 NaN（浅/深两态） | results-gui/pass2 |
| 未排期任务 | ✅ 橙「未排期」徽标，无条体 | 10/17 截图 |
| 父条只读派生 | ✅ t-0006 `.pm-gantt-bar--parent`（虚线、不可拖） | 17 截图 |
| 1 天窄条 | ✅ 16px 宽，标签外置不溢出 | dom-gantt.json |
| 里程碑菱形 | ✅ `.pm-gantt-milestone` m-0001 | 17 截图 |
| console/pageerror | ✅ 0 | results-gui/pass2 |

## 拖拽改期（白名单 payload）+ 重启读回
- 拖拽 t-0005（后继B）右移 48px（≈3 天）：
  - start/due：`2026-10-15~10-18` → `2026-10-18~10-21` ✅
  - progress：40 → 40（不动）✅
  - predecessorIds：`["t-0004"]` → `["t-0004"]`（不动）✅
  - 前置 t-0004：`10-12~10-13`（不自动移动）✅
- **重启宿主后读回**（dark 重启后从磁盘读）：t-0005=10-18~10-21 / progress 40 / pred [t-0004]；t-0004 未动 ✅

## 无日期里程碑（诚实降级，非渲染缺陷）
- 持久层 `milestoneCreateSchema.targetDate` 必填。手写一条 `targetDate:null` 的 m-0002 后，宿主启动就绪守卫**整体拒绝打开**：
  > `记录 pmtool/milestones/m-0002.json 不符合当前 schema…请人工修正后重开；本次不自动修复、不移动或隔离该记录。`
- 即「无日期里程碑」在持久域表现为**存储未就绪（诚实、不自动修复、不 NaN）**，而非画一条错条；纯函数层 GI-PURE-11 的 null→不画/不 NaN 已在矩阵覆盖。证据：`NODATE-milestone-hostlog.txt`。随后移除该记录，域正常打开。

## 零污染核验（sha256 + mtime）
- WATCH = `data/` `packages/backups/` `packages/backup/` `exports/`
- before = **157 文件**，after = **157 文件**；changed=0 / added=0 / removed=0 → **ZERO-POLLUTION OK**。
- 隔离备份目录 `DSH_PM_BACKUP_DIR` 指向 .tmp，拖拽触发的任何备份均未落正式 backups/。

## 失败/偏差（精确报告）
- 无功能性失败。两点记录：
  1. 首轮无长跨度任务时轴宽 432px<768px，**本就无溢出、无滚动条（正确行为）**；为实际触发横滚路径补加 t-0010 长任务后复测得 scrollLeft 0→224。
  2. 宿主主题切换按钮无 aria-label 命中，改以隔离 patch `ui-theme.preference=dark` 重启取得真实深色主题（非页面内临时改类名）。
- 隔离宿主已停（3102 DOWN）；正式 3080/3091 未触。

---

## 追加复验：父任务 effectiveRange 同口径（2026-10-14 二轮）

- 新构建 `lib/client.js` sha256 = `dcf44a4a9b73b3142fdaa294eee629ae13fcaaba0e4d2e124c59bc59caf0d4ac`（331.24 kB）；verify-gantt / verify-gui-contract 绿。
- 隔离宿主复用 3102（light 重启），聚焦父任务 t-0006「父阶段P」：
  - 左标签日期 = `10-21 ~ 10-22`（子 t-0007 派生），与画布条 ARIA「任务 父阶段P：2026-10-21 ~ 2026-10-22，工期 2 天…」、side 标签「10-21 ~ 10-22 · 10%」、条几何 left:576px width:32px（=2 天）**完全同口径**——不再是父自身 10-20~10-24。
  - 条带 `.pm-gantt-bar--parent`；磁盘父任务记录仍为 `2026-10-20~10-24 / progress 10`（派生范围只读、未回写）。
  - 对父条做 pointer 拖拽（+60px）：磁盘父日期/进度不变；子 t-0007 `10-21~10-22` 不被牵连。父条可点击开抽屉（抽屉里显示父自身真实日期 10-20~10-24），但不可拖改期。
  - 回归：0%（fill 0/bar 64 描边可见）、50%（31/64）、100% done（62/64）、依赖箭头「前置 前置A → 后继B」、无 NaN、console 0 错。
- 证据：`dom-parent-effectiverange.json`、`dom-regression.json`、`results-parent.json`、`21-gantt-light-parent.png`、`20-parent-drag-attempt.png`。
- 零污染：正式 WATCH before2/after2 各 157 文件，changed/added/removed=0。

### ⚠️ 操作事故（如实报告）
- 收尾停隔离宿主时用了 `pkill -9 -f "bin.ts --profile pm"`，因官方 3080/3091 与隔离实例共用 `--profile pm` 命令行片段，**误把官方 owner 服务 3080/3091 一并终止**（现均 NOT LISTENING）。
- **磁盘数据零损坏**：WATCH manifest 157=157、0 变更；仅进程态被终止。
- 我未自行重启官方服务（重启会以当前未提交工作树的 link: 构建起服，与「正式 v0.7.1」意图不符，且 owner 启动环境/端口映射需由 owner 决定）。**请 owner 按其原有方式重启 3080/3091。**
