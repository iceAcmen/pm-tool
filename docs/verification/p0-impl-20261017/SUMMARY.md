# P0 批次实施验证报告（2026-10-17）

> 对应设计方案 `docs/design/forward-design-proposal-20261017.md` §11.1 P0、§12.1 验收；走查证据见 `docs/verification/full-regression-20261017/walkthrough-report.md`。
> 运行环境：macOS（Darwin），dsh profile `pm`，服务 `127.0.0.1:3080`，插件 link 挂载，改源码后 `pnpm run build` + 重启服务。

## 0. 构建与单测门槛

| 项 | 结果 |
|---|---|
| `pnpm run build`（tsc 类型检查 + 复制 CSS + tsdown） | 退出 0，6 个产物打包成功，无类型错误 |
| `pnpm test`（vitest） | 5 文件 / **36 用例全绿**（新增 `milestone.test.ts` 7 例） |
| 服务重启 | `node --import tsx/esm apps/cli/src/bin.ts --profile pm --no-open`，日志无 error，新 token URL 正常打开 |
| 硬编码扫描 | 新增色值仅方案指定中性灰 `#696e74`/`#71767c`，无品牌蓝/暖黄硬编码，无密钥入库 |

## 1. 逐项 P0 验收

### P0-1 任务表 ≤560 卡片式重排 + tabs 滚入/渐隐（S1 / S2-5）
- **改动文件**：`client/views/tasks.css`（≤560 弃用 9 列 grid，每条任务一张卡片：行1 勾选+完整标题+状态，行2 编号·负责人·优先级，行3 日期/进度；阶段父行收为可折叠标题条）、`client/views/tasks.tsx`（优先级单元格加 `pt-pri-cell` 钩子类）、`client/panel.tsx`（`ViewTab` 切换 `scrollIntoView({inline:'nearest'})`）、`client/panel.css`（窄档 `.pm-view-tabs` 两端 mask 渐隐）。
- **证据**：
  - `screenshots/10-tasks-390-light.png`（卡片态浅色，标题完整两行不截断、无列叠印）
  - `screenshots/11-tasks-390-light-collapsed.png`（点三角折叠：行数 15→12，aria「展开 需求分析阶段」，分组保留可折叠）
  - `screenshots/12-tasks-390-dark.png`（深色卡片态）
  - `screenshots/17-tabs-390-fade.png`（scrollWidth 939 > clientWidth 334，mask 渐隐生效）
  - 桌面 `screenshots/01-tasks-light-1440.png` / `90-tasks-dark-1440.png`：≥561 表格态保持不变。
- **结论**：✅ 通过。

### P0-2 里程碑延期口径同源 `isMilestoneMissed`（S2-2）
- **改动文件**：`core/derived.ts`（新增纯谓词 `isMilestoneMissed(m, today)`，zod-free 可浏览器/服务端共用）、`core/milestone.ts`（再导出）、`core/stats.ts`（`milestoneOverdue` 复用）、`client/views/milestones.tsx`（概览带 missed 计数 + 卡片判定复用）、`client/views/overview.tsx`（health 输入复用）、`core/milestone.test.ts`（新增 7 例）。
- **证据**：单测覆盖 planned 已过目标日→延期、at_risk 过日→延期、未来不延期、当天不延期、achieved 永不、无目标日诚实降级、显式 missed。运行时概览带「已延期 1 项」与卡片「已延期」chip 一致（`02-milestones-light-1440.png`）。
- **结论**：✅ 通过（单测 + 运行时双佐证）。

### P0-3 会议过滤收敛（S2-4）
- **改动文件**：`client/views/meetings.tsx`（`selected` 绑定 `filtered` 而非 `sorted`；filtered 为空右侧渲染「无匹配的会议」空态）、`client/views/meetings.css`（`.mt-detail-empty` 空态卡）。
- **证据**：`screenshots/20-meetings-nomatch-light.png`（搜索 `zzz-no-such-meeting-xyz`，列表 0 条，右侧空态，不残留上一条详情；清空即恢复）。
- **结论**：✅ 通过。

### P0-4 甘特粒度控件裁切（S2-1）
- **改动文件**：`client/views/gantt.css`（`.pm-gantt-root .pm-seg{height:auto;overflow:visible}`，重置 panel.css 通用进度条 `.pm-seg{height:10px;overflow:hidden}` 的碰撞）。
- **证据**：`screenshots/15-gantt-seg-light.png`、`16-gantt-seg-dark.png`（日/周/月三字完整可见不被垂直裁切）；运行时 `height:30px;overflow:visible;items=[日,周,月]`。
- **结论**：✅ 通过。

### P0-5 主按钮 token 统一 + 浅色对比度 + 别名（S2-3）
- **改动文件**：`client/panel.css`（浅色强制 `--muted:#696e74`/`--faint:#71767c` AA，补 `--pm-on-primary`、`--pm-link`）；8 处 CTA 改宿主 `--dsw-alias-button-primary-fill`：`meetings.css`、`reports.css`、`gantt.css`、`tasks.css`、`deliverables.css`、`milestones.css`、`risk-issues.css`、`overview.css`；`people.css` 未定义 `--on-primary` 改 `--pm-on-primary`；`reports.css:123` 未定义 `--c-link` 改 `--pm-link`。
- **证据（8 处 CTA 计算底色均为宿主中性 primary `rgb(15,17,21)` 浅色，无蓝填充）**：
  - 任务 `01-tasks-light-1440.png`（pt-primary）｜里程碑 `02-…`（ms-btn-primary）｜会议 `03-…`（mt-btn-primary）｜风险 `04-…`（ri-btn-primary）｜汇报 `05-…`（rp-btn）｜交付物 `06-…`（dv-btn-primary）｜概览 `07-…`（ov-btn.primary）｜甘特 `08-…`（pm-chip-primary）。
  - 深色反白见 `12/14/90/91/92` 与 `41-gantt-bar-hover-dark.png`。
  - 对比度实测（白底）：`--muted` **5.14:1**、`--faint` **4.58:1**，均达 AA 4.5。
- **结论**：✅ 通过。

### P0-6 汇报三卡贴合内容（S3-4）
- **改动文件**：`client/views/reports.css`（`.rp-cols{align-items:start}`）。
- **证据**：`screenshots/05-reports-light-1440.png`（已完成/下步计划/阻塞三卡顶对齐，单行内容不被 stretch 拉高）；运行时 `align-items: start`。
- **结论**：✅ 通过。

### P0-7 看板卡片库/配置面板互斥（S3-3）
- **改动文件**：`client/board/editor.tsx`（点选卡片 `setSelectedId` 同时 `setDrawerOpen(false)`）。
- **证据**：`screenshots/30-board-drawer-open.png`（卡片库开、无配置面板：`{drawer:true,cfg:false}`）→ `screenshots/31-board-cfg-open.png`（选中任务完成率卡后卡片库收起、右侧「配置·completionHero」开：`{drawer:false,cfg:true,selected:true}`）。
- **结论**：✅ 通过。

### P0-8 甘特任务条 hover 高亮（S3-7）
- **改动文件**：`client/views/gantt.css`（`st-done/st-prog` hover 底 14%→22%、边 45%→70%；`st-todo` 16%→22%/60%；`:focus-visible` 环保留；overdue/blocked 语义边不被覆盖）。
- **证据**：实测 st-done critical 条 before `bg α0.14 / border 0.45` → hover `α0.22 / 0.70`，深色一致；`screenshots/40-gantt-bar-hover-light.png`、`41-gantt-bar-hover-dark.png`。
- **结论**：✅ 通过。

### P0-9 项目下拉同名消歧（S3-5）
- **改动文件**：`client/panel.tsx`（菜单项补副标 id·开始日期·负责人）、`client/panel.css`（`.pm-project-menu-text/.pm-project-menu-meta`）。
- **证据**：`screenshots/50-project-menu-light.png`——两个同名「浏览器功能验收」由 `p-0001`/`p-0002` 区分，其余项 `p-0003 · 2026-10-10 · 验收负责人`、`p-0004 · 2026-01-01 · ice`。
- **结论**：✅ 通过。

## 2. 附带小修

| 小修 | 改动 | 证据 | 结论 |
|---|---|---|---|
| 按钮不折行（新增里程碑/交付物） | `panel.css` 全局 `.pm-shell button{white-space:nowrap}`，各 CTA 显式 nowrap | 02/06 等 CTA 单行完整 | ✅ |
| 概览日期格窄窗换行 + title | `overview.tsx` 补 `title={c.value}`；`overview.css` ≤560 允许换行 | `07-overview-light-1440.png` | ✅ |
| 交付物空态仅一个 CTA | `deliverables.tsx` 无数据时隐藏页头 CTA | `06-deliverables-light-1440.png`（仅空态「新增交付物」） | ✅ |
| 看板超长项目名 hover 全名 | 既有 `title={p.name}` + ellipsis，复核保留 | 看板视图 | ✅ |

## 3. 桌面 1440 抽测（无回归）

- `90-tasks-dark-1440.png` 任务表格态完整、分组/进度/批量保留。
- `91-gantt-dark-1440.png` 依赖三态箭头、关键路径只读、今天线、WBS 树保留。
- `92-milestones-dark-1440.png` 概览带/卡片延期口径一致，空态诚实。

## 4. 截图清单（25 张，`screenshots/`）

```
01-tasks-light-1440.png        02-milestones-light-1440.png   03-meetings-light-1440.png
04-risk-light-1440.png         05-reports-light-1440.png      06-deliverables-light-1440.png
07-overview-light-1440.png     08-gantt-light-1440.png
10-tasks-390-light.png         11-tasks-390-light-collapsed.png 12-tasks-390-dark.png
13-gantt-390-light.png         14-gantt-390-dark.png          15-gantt-seg-light.png
16-gantt-seg-dark.png          17-tabs-390-fade.png
20-meetings-nomatch-light.png
30-board-drawer-open.png       31-board-cfg-open.png
40-gantt-bar-hover-light.png   41-gantt-bar-hover-dark.png
50-project-menu-light.png
90-tasks-dark-1440.png         91-gantt-dark-1440.png         92-milestones-dark-1440.png
```

## 5. 遗留 / 未验证项

- P1/P2 项（优先级批量、模板库、AI 规则库、自动化轮询、多语言、命令面板等）本次未实施，按方案排期留待后续批次。
- 浅色对比度依赖本次强制中性值；若未来宿主别名恢复可用，可回退为别名优先（已在 CSS 注释标注）。
- 未改动任何业务数据；延期口径全部由单测/派生验证，未为截图改日期。
- `docs/design/mockups/` 为其他会话产物，未纳入本次提交。
