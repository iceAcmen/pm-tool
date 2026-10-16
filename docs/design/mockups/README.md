# 设计图总览（P1 / P2 Mockups，2026-10-17）

> 依据前瞻设计方案「冷静的指挥台」：`docs/design/forward-design-proposal-20261017.md`
> 每张图为自包含 HTML（离线可打开），PNG 为 puppeteer 高保真渲染结果。
> 渲染规范：`MOCKUP-SPEC.md`；P0 需求已真实落地（见 `docs/verification/p0-impl-20261017/`）。

## P1 — 高保真设计图（8 项，可随后实施）

| # | 需求 | HTML | 渲染图 |
|---|---|---|---|
| 1 | 看板空卡/空态紧凑重设计（三模式） | [p1-board-empty-states.html](p1/p1-board-empty-states.html) | [浅](p1/png/p1-board-empty-states-light-1440.png) / [深](p1/png/p1-board-empty-states-dark-1440.png) |
| 2 | 人员明细仅叶子任务 | [p1-people-leaf-tasks.html](p1/p1-people-leaf-tasks.html) | [浅](p1/png/p1-people-leaf-tasks-light-1440.png) |
| 3 | 甘特 resize 手柄 + 键盘微调 | [p1-gantt-resize-keyboard.html](p1/p1-gantt-resize-keyboard.html) | [浅](p1/png/p1-gantt-resize-keyboard-light-1440.png) / [深](p1/png/p1-gantt-resize-keyboard-dark-1440.png) |
| 4 | 全视图移动卡片模式（里程碑/甘特/会议） | [p1-mobile-cards.html](p1/p1-mobile-cards.html) | [390](p1/png/p1-mobile-cards-light-390.png) |
| 5 | 抽屉表单分区 + 校验受控内联 | [p1-drawer-sections.html](p1/p1-drawer-sections.html) | [浅](p1/png/p1-drawer-sections-light-1440.png) / [深](p1/png/p1-drawer-sections-dark-1440.png) |
| 6 | 密度模式全局化 | [p1-density-global.html](p1/p1-density-global.html) | [浅](p1/png/p1-density-global-light-1440.png) |
| 7 | 副驾内嵌建议层 | [p1-inline-copilot.html](p1/p1-inline-copilot.html) | [浅](p1/png/p1-inline-copilot-light-1440.png) / [深](p1/png/p1-inline-copilot-dark-1440.png) |
| 8 | 窄窗视图标签下拉折叠 | [p1-tabs-dropdown.html](p1/p1-tabs-dropdown.html) | [390](p1/png/p1-tabs-dropdown-light-390.png) |

## P2 — 前瞻设计图（6 项，远期方向）

| # | 需求 | HTML | 渲染图 |
|---|---|---|---|
| 1 | 指挥驾驶舱（IA + 分组导航 + 异常优先） | [p2-cockpit-ia.html](p2/p2-cockpit-ia.html) | [浅](p2/png/p2-cockpit-ia-light-1440.png) / [深](p2/png/p2-cockpit-ia-dark-1440.png) |
| 2 | Token 2.0 单层语义规范 + 迁移映射 | [p2-token-2.0.html](p2/p2-token-2.0.html) | [浅](p2/png/p2-token-2.0-light-1440.png) |
| 3 | 可交互风险矩阵（点格下钻） | [p2-risk-matrix-interactive.html](p2/p2-risk-matrix-interactive.html) | [浅](p2/png/p2-risk-matrix-interactive-light-1440.png) / [深](p2/png/p2-risk-matrix-interactive-dark-1440.png) |
| 4 | 趋势分析与高级图表 | [p2-trend-charts.html](p2/p2-trend-charts.html) | [浅](p2/png/p2-trend-charts-light-1440.png) / [深](p2/png/p2-trend-charts-dark-1440.png) |
| 5 | 保存视图 / 分享 / 导出 | [p2-saved-views-share-export.html](p2/p2-saved-views-share-export.html) | [浅](p2/png/p2-saved-views-share-export-light-1440.png) |
| 6 | AI 溯源与治理 | [p2-ai-provenance.html](p2/p2-ai-provenance.html) | [浅](p2/png/p2-ai-provenance-light-1440.png) / [深](p2/png/p2-ai-provenance-dark-1440.png) |

## 备注

- 所有 HTML 不依赖网络与外部资源；无渐变/玻璃拟态/暖黄色；卡片贴合内容、状态带文字标签。
- 设计图中涉及的前瞻假设（趋势依赖历史快照、风险矩阵需复评机制、AI 撤销依赖快照能力等）见各 HTML 标注与方案 §11。
