# G4-1「200% 缩放 / 320px」补证 manifest

- 任务：G4-1 200% 缩放 / 320 CSS px 回流——内容不丢失、无非合法双向滚动、不破版（规范 §8.6；checklist G.4 G4-1）。
- 被测实例：隔离只读实例 `http://127.0.0.1:3172/?token=…`（未改代码、未重启服务、未改数据）。
- 采集方式：Playwright（channel=chrome, headless），每视口×主题全新 `newContext({viewport, colorScheme})`；`fullPage=false` 视口截图 + `documentElement.scrollWidth/clientWidth` 横溢测量 + 越界元素扫描（`right > shell.right+3`，排除已裁决内部横滑容器）+ `elementFromPoint` 绘制溢出探针 + 目视破版复核。
- 测量原始数据：`measurements.json`（同目录）。

## 环境与方法局限（必读）

1. **实例嵌入 DSH 启动框架**：3172 实例中 PM 工作台嵌在启动器面板内，320 视口下左侧 DSH 图标轨占 56px，PM 内容区仅 **264px**（非独立 320 全宽）。本批证据反映「该隔离实例实测」，独立 320 全宽未在本实例复测。
2. **zoom 档为 CSS zoom 模拟法，非原生 200% 缩放实测**：Chromium 无原生文本缩放 CDP 接口，采用 `document.documentElement.style.zoom='200%'` 近似浏览器缩放。局限：CSS zoom 等比放大整体布局而不触发原生文本放大的回流重排，与浏览器原生「设置→缩放 200%」行为不等价；且本实例嵌入框架在放大后右栏被框架裁切。**不得将本批 zoom 帧写成原生 200% 缩放实测**，仅作近似参考。
3. 纵向滚动属合法（内容在下方折叠区可滚动到达，不算丢失）；横向滚动仅甘特时间轴/表体内部横滑为已裁决例外。
4. 截图中悬浮的深色「项目管理」标签为 DSH 启动器 tooltip（框架 chrome），非 PM 破版。

## 320px 档（320×844）

### 浅色全量 10 视图

#### 1. 总览看板 dashboard —— **FAIL**
- 补证前状态：G4-1 未测（§12-10 待验证项）。
- 动作：320 视口打开实例→进入 PM；窄轨已隐藏，扁平下拉 `.pm-view-switcher` 中**无「总览看板」项**（菜单仅 9 项：全部任务/里程碑/风险与问题/会议纪要/进度汇报/交付物/项目概览/甘特排期/人员负载），可见按钮中无该入口；经隐藏 rail 项 JS 点击进入视图取证。
- 结果证据：doc 320/320 无文档级横溢；painted=0；但 bento 网格卡片 `.pm-bento-card` 仅 65px、`.pm-bento-label` 31px，「项目状态规模」「客观进度清单」卡片文字逐字竖排挤压（截图 `G4-1-320-dashboard-light.png`）；成员负载行测量 right=439/486（rawBeyond=6，被启动框架裁切未绘制）。
- 结论：**FAIL**——① 窄模式入口缺失（rail 隐藏后跨项目总览看板不可达，导航内容丢失）；② bento 卡片挤压逐字竖排=破版/不可读。

#### 2. 项目概览 overview —— **PASS**
- 补证前状态：未测。
- 动作：switcher/rail 进入，截图+测量。
- 结果证据：doc 320/320；shell 264/264；painted=0；rawBeyond=0；标题卡、90 健康环、元信息网格、统计卡片完整换行无重叠（`G4-1-320-overview-light.png`）。
- 结论：**PASS**。

#### 3. 全部任务 tasks —— **PASS（附注）**
- 补证前状态：未测。
- 动作：switcher 进入，截图+测量。
- 结果证据：doc 320/320；painted=0；工具条按钮多行换行全部可见（保存视图/按状态分组/按 WBS 编号/导入/导出/分享），筛选 chip 换行，CTA 全宽；shell 测量 338/264（最小宽 338 > 嵌入 264，被框架裁切未绘制，rawBeyond=6 均为未绘制盒）；密度行「全部视图生效」chip 右缘轻微裁切（非关键全局偏好标签）。
- 结论：**PASS**（无绘制溢出、无破版；附注：嵌入宽度下工具条最小宽 338 未绘制溢出，独立 320 全宽未复测）。

#### 4. 甘特排期 gantt —— **PASS**
- 补证前状态：未测（390 档此前未采甘特）。
- 动作：switcher 进入，截图+测量。
- 结果证据：doc 320/320；shell 264/264；painted=0；rawBeyond=0；任务/WBS 身份列保留在左、不进横滑；右侧时间轴内部横滑=已裁决例外（`G4-1-320-gantt-light.png`）。
- 结论：**PASS**。

#### 5. 里程碑 milestones —— **PASS**
- 补证前状态：未测。
- 动作：switcher 进入，截图+测量。
- 结果证据：doc 320/320；shell 264/264；painted=0；rawBeyond=0；统计网格、Beta 交付里程碑卡（有风险 chip/目标日期/距目标天数）完整换行（`G4-1-320-milestones-light.png`）。
- 结论：**PASS**。

#### 6. 风险与问题 risk —— **FAIL**
- 补证前状态：未测。
- 动作：switcher 进入，截图+测量；定向 DOM 复核 `.ri-mtx` 矩阵。
- 结果证据：doc 320/320；painted=0；但风险矩阵 `.ri-mtx` `overflowX=visible`、scrollWidth 260 > clientWidth 190，**无内部横滑**；4 个影响列（低/中/高/严重）中「严重」列被启动框架裁切、不可见（`G4-1-320-risk-light.png`，右缘仅见列残片）；非甘特轴/表体例外。
- 结论：**FAIL**——非合法横向溢出 + 矩阵第 4 列内容被裁切丢失，无替代、无内部横滑。

#### 7. 人员负载 people —— **PASS**
- 补证前状态：未测。
- 动作：switcher 进入，截图+测量。
- 结果证据：doc 320/320；painted=0；成员卡（史冰冰/张三/王五/李四，open 数/日期/状态 chip/负载条）完整换行；rawBeyond=1 为折叠区「排期负载」月份标签（下方纵向滚动可达）（`G4-1-320-people-light.png`）。
- 结论：**PASS**。

#### 8. 会议纪要 meetings —— **PASS**
- 补证前状态：未测。
- 动作：switcher 进入，截图+测量。
- 结果证据：doc 320/320；shell 264/264；painted=0；空态图标+说明+「新增会议」CTA 居中完整（`G4-1-320-meetings-light.png`）。
- 结论：**PASS**。

#### 9. 进度汇报 reports —— **PASS**
- 补证前状态：未测。
- 动作：switcher 进入，截图+测量。
- 结果证据：doc 320/320；shell 264/264；painted=0；空态卡+「生成快照」CTA 完整（`G4-1-320-reports-light.png`）。
- 结论：**PASS**。

#### 10. 交付物 deliverables —— **FAIL**
- 补证前状态：未测。
- 动作：switcher 进入，截图+测量；定向 DOM 复核 `.dv-ov-cell`。
- 结果证据：doc 320/320；painted=0；但概览漏斗 `.dv-ov-cell` 仅 22–33px 宽，「总数1项需求→上线全流程/已验收0项封存归档/进行中0项制作打磨中/已提交0项等待验收评审/待开始1项排期在后续阶段/验收通过率0%」全部逐字竖排断裂、不可读（`G4-1-320-deliverables-light.png`）；筛选 chip/搜索/分组空态本身换行正常。
- 结论：**FAIL**——统计漏斗破版（文字逐字竖排断裂），非溢出但属不破版判据违反。

### 深色抽查 4 视图（任务/甘特/看板/概览）

| 视图 | 文件 | 测量 | 结论 |
|---|---|---|---|
| 全部任务 | `G4-1-320-tasks-dark.png` | doc 320/320，painted=0，工具条换行（同浅色附注） | PASS |
| 甘特排期 | `G4-1-320-gantt-dark.png` | doc 320/320，shell 264/264，painted=0，身份列保留/轴内滚 | PASS |
| 总览看板 | `G4-1-320-dashboard-dark.png` | doc 320/320，painted=0；同浅色：入口缺失+bento 挤压 | FAIL（同浅色） |
| 项目概览 | `G4-1-320-overview-dark.png` | doc 320/320，shell 264/264，painted=0 | PASS |

深色覆盖说明：按要求仅抽查关键 4 视图（任务/甘特/看板/概览），其余 6 视图深色未采。

## zoom 200% 档（768×1024，CSS zoom 模拟法，浅色 4 视图）

> **模拟法声明**：以下为 `documentElement.style.zoom='200%'` 模拟，**非原生 200% 缩放实测**；CSS zoom 等比放大布局、不触发原生文本放大回流，且嵌入框架右栏被裁切，结果仅近似参考。

| 视图 | 文件 | 测量（doc/shell sw/cw） | 可见区目视 | 结论（模拟） |
|---|---|---|---|---|
| 全部任务 | `G4-1-zoom200-tasks-light.png` | doc 768/768；shell 1313/328；painted=0 | 导航轨完整，右栏被框架裁切，无重叠/错位 | SIM-PASS（模拟，非原生） |
| 甘特排期 | `G4-1-zoom200-gantt-light.png` | doc 768/768；shell 421/328；painted=0 | 导航轨完整，右栏裁切，无重叠 | SIM-PASS（模拟，非原生） |
| 总览看板 | `G4-1-zoom200-dashboard-light.png` | doc 768/768；shell 421/328；painted=0 | 导航轨完整，右栏裁切，无重叠 | SIM-PASS（模拟，非原生） |
| 项目概览 | `G4-1-zoom200-overview-light.png` | doc 768/768；shell 449/328；painted=0 | 导航轨完整，右栏裁切，无重叠 | SIM-PASS（模拟，非原生） |

zoom 档 doc 均 768/768 无文档级横溢；shell sw>cw 为嵌入框架裁切下的测量值，未绘制溢出（painted=0）。

## 汇总结论

**320 档（10 浅 + 4 深）**
- PASS：项目概览、全部任务(附注)、甘特排期、里程碑、人员负载、会议纪要、进度汇报（浅色 7）；深色抽查 任务/甘特/概览 PASS。
- **FAIL：总览看板（入口缺失+bento 挤压）、风险与问题（矩阵「严重」列裁切、无内滚）、交付物（漏斗文字逐字竖排断裂）**；深色看板同 FAIL。

**zoom 200% 档（模拟法，4 视图）**：SIM-PASS（模拟近似，非原生 200% 实测，不可据此勾达标）。

## 证据文件绝对路径

320 浅色：
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-dashboard-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-overview-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-tasks-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-gantt-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-milestones-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-risk-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-people-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-meetings-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-reports-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-deliverables-light.png

320 深色抽查：
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-tasks-dark.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-gantt-dark.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-dashboard-dark.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-320-overview-dark.png

zoom200 模拟：
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-zoom200-tasks-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-zoom200-gantt-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-zoom200-dashboard-light.png
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/G4-1-zoom200-overview-light.png

测量数据：
- /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/legacy-clearance-20261018/g4-1/measurements.json
