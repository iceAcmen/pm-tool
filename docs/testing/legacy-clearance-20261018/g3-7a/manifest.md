# G3-7 全视图补证（前半：里程碑 / 风险与问题 / 人员负载 / 会议纪要）

- 采证日期：2026-10-18
- 被测实例（只读，未改代码/未改数据/未重启）：`http://127.0.0.1:3172/?token=…`（隔离实例）
- 采证档：768×1024、390×844 × 浅/深；每视口×主题全新临时 context（`colorScheme: light|dark`），不碰用户会话
- 判据（system-ui-spec §8 / checklist G3-7）：零外壳横向溢出（`document.scrollingElement.scrollWidth ≤ clientWidth`）、零裁切（无截断/遮挡/重叠）、无破版；表体/时间轴在 `.pm-shell` 内部横滚属已裁决例外
- 导航走真实点击：768 点左侧 `.pm-rail-item`；390 rail 整栏隐藏（railW=0, display:none），点 `.pm-view-switcher-btn` 展开 `.pm-view-menu` 扁平下拉（9 项 + 计数 + 选中带勾）后点目标项

## 补证前状态

- checklist G3-7 标注「（待验证项）」：里程碑/风险/人员/会议/汇报/交付物/概览 768/390 未逐张清验；facts F.4 记录抽样边界——768/390 仅任务页/抽屉/看板抽样，本前半 4 视图为缺口。

## 动作

1. 新 context → 进入实例 → 点外壳「项目管理」载入 PM 工作台。
2. 768：rail 点目标视图；390：ViewSwitcher 下拉点目标项；等待 h1 匹配目标视图名。
3. 每帧 `fullPage=false` 视口截图；记录 `scrollingElement.scrollWidth/clientWidth/innerWidth`；`page.evaluate` 扫描可见元素 `getBoundingClientRect().right > innerWidth+1.5`，摘录 class/文本/right，并标注内部横滚祖先。
4. 目视 + 测量双判。

## 证据表（16 帧）

| 文件 | 视图 | 视口 | 主题 | doc scrollW/clientW（innerW） | 越界/遮挡证据 | 结论 |
|---|---|---|---|---|---|---|
| G3-7-milestones-768-light.png | 里程碑 | 768 | light | 768/768（768） | 无越界元素 | PASS |
| G3-7-risks-768-light.png | 风险与问题 | 768 | light | 768/768（768） | 无越界元素 | PASS |
| G3-7-people-768-light.png | 人员负载 | 768 | light | 768/768（768） | 19 元素 right 787–935，祖先均为 `.pm-shell`（overflowX=auto 内部横滚）：`pp-due`「12-31/10-20/11-22/12-01」、`pp-badge`「正常/临期1/P0 1」、`pp-th-num`「状态」、`pp-g-month`「1月」；负责人身份列无需横滚可见（内部横滚例外） | PASS（内部横滚例外） |
| G3-7-meetings-768-light.png | 会议纪要 | 768 | light | 768/768（768） | 无越界元素；空态诚实居中 | PASS |
| G3-7-milestones-768-dark.png | 里程碑 | 768 | dark | 768/768（768） | 无越界元素 | PASS |
| G3-7-risks-768-dark.png | 风险与问题 | 768 | dark | 768/768（768） | 无越界元素 | PASS |
| G3-7-people-768-dark.png | 人员负载 | 768 | dark | 768/768（768） | 同 768-light，19 元素内部横滚（`.pm-shell`），身份列可见 | PASS（内部横滚例外） |
| G3-7-meetings-768-dark.png | 会议纪要 | 768 | dark | 768/768（768） | 无越界元素；空态诚实居中 | PASS |
| G3-7-milestones-390-light.png | 里程碑 | 390 | light | 390/390（390） | 无越界元素；统计卡 2 列堆叠、节点卡全宽；操作按钮可见 | PASS |
| G3-7-risks-390-light.png | 风险与问题 | 390 | light | 390/390（390） | 无横溢；**遮挡**：`.pm-view-switcher`（top=64,h=47,白底）压住 `.pm-top-actions`（top=56,h=32），重叠 23.8px；`elementFromPoint` 命中「新建项目」按钮中心返回 `pm-view-switcher-btn`（非自身），新建项目/更多/刷新被遮 | **FAIL（遮挡/叠印）** |
| G3-7-people-390-light.png | 人员负载 | 390 | light | 390/390（390） | `pp-g-month`「1月」right=421（排期负载时间轴内部横滚，例外）；**遮挡**：同上，switcher 压住操作按钮 23.8px，elementFromPoint 返回 `pm-view-switcher-btn` | **FAIL（遮挡/叠印）** |
| G3-7-meetings-390-light.png | 会议纪要 | 390 | light | 390/390（390） | 无越界元素；操作按钮可见；空态居中 | PASS |
| G3-7-milestones-390-dark.png | 里程碑 | 390 | dark | 390/390（390） | 无越界元素；操作按钮可见，switcher 栏 top=99 不重叠 | PASS |
| G3-7-risks-390-dark.png | 风险与问题 | 390 | dark | 390/390（390） | 无横溢；**遮挡**：同 light，switcher（top=64,深底 #151517）压住操作按钮 23.8px，elementFromPoint 返回 `pm-view-switcher-btn` | **FAIL（遮挡/叠印）** |
| G3-7-people-390-dark.png | 人员负载 | 390 | dark | 390/390（390） | `pp-g-month`「1月」right=421（内部横滚例外）；**遮挡**：同上 23.8px，elementFromPoint 返回 `pm-view-switcher-btn` | **FAIL（遮挡/叠印）** |
| G3-7-meetings-390-dark.png | 会议纪要 | 390 | dark | 390/390（390） | 无越界元素；操作按钮可见；空态居中 | PASS |

> 备注：里程碑/会议纪要在 390 下 `.pm-view-switcher` 栏 top=99（位于操作条 56–88 下方），overlap=0、elementFromPoint 命中按钮自身；风险/人员两视图 switcher 栏上移至 top=64 与操作条重叠，浅深同现。

## 逐视图结论

- **里程碑 milestones — PASS（4/4）**：768/390 × 浅/深 doc=视口宽、零越界、零遮挡；统计列/节点时间线完整。
- **风险与问题 risks — 部分 PASS**：768 浅/深 PASS（矩阵 4×3、清单完整、无溢出）；**390 浅/深 FAIL**：顶部「新建项目/更多/刷新」操作按钮被上移的 `.pm-view-switcher` 栏遮挡（重叠 23.8px，elementFromPoint 命中 switcher 按钮），属遮挡/叠印；矩阵与清单本体无破版、doc=390 无横溢。
- **人员负载 people — 部分 PASS**：768 浅/深 PASS（doc=768；负载明细右列与排期负载月份轴在 `.pm-shell` 内部横滚，属已裁决例外；负责人身份列免横滚可见）；**390 浅/深 FAIL**：同一 switcher 遮挡（23.8px）；卡片堆叠/负载条/身份完整，月份轴「1月」right=421 为内部横滚例外。
- **会议纪要 meetings — PASS（4/4）**：768/390 × 浅/深 doc=视口宽、空态诚实居中、操作按钮可见、零越界。

## 汇总

- 16 帧：**12 PASS / 4 FAIL**（FAIL 均为 390 风险与问题、人员负载的操作条遮挡，浅深成对）。
- 全部 16 帧外壳横向溢出 = 0（scrollWidth 恒等于 clientWidth：768 帧 768/768，390 帧 390/390）。
- 附件测量明细：`measurements.json`（scrollWidth/clientWidth/innerWidth/h1/越界元素全量）。
