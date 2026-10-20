# B4 总览 / 项目概览 · 混合卡片组件契约（前端 owner 冻结）

> 适用：GlobalBoard 总览看板（BoardBento 16 卡）与项目概览（Overview）。
> 参照（用户已授权，直接 Read）：
> - 基线：`混合卡片工作台设计-20261019/混合卡片工作台.html` + screenshots/01..04（浅深 1440）。
> - 终版：`全页面混合设计-20261019/统一图集.html` + shots/01-dash-light、02-dash-dark、03-overview-light、04-overview-dark、16-board-default（编辑态机制，文案不抄）。
> 边界：只改视图/配置/布局/scope 映射；**保留** RGL 拖缩、持久化、source config、公式 schema、filter/sort、≤5 版历史、min/minW/minH 约束、旧用户 layout；**不自动 reset/迁移**已有布局，新默认只给全新用户；不改领域算法。

## 1. 卡片统一解剖（所有卡复用）

- 卡壳 `.pm-bento-card`：表面 `--pm-surface`、描边 `--pm-line`、圆角、内 padding；内滚不外溢（min-width:0 链路）。
- 卡头 `.pm-bento-label`：左标题（首字重 600），右 meta（计数/口径说明，`--pm-muted` 小字号），右侧更多菜单仅编辑态出现。
- 状态语义色一律 `--pm-st-*` / `--pm-success|warning|danger|accent`，禁用裸 hex/rgb；深浅跟随 `body[data-ds-dark-theme]`，color-scheme 由壳层提供。
- 空态：每张卡必须给「无数据」白话空态，不画假数据、不沉默留白。
- 失败/陈旧：随壳层 busy/stale/error 原语，卡内不自造重试闭环。

## 2. 已迁移卡（本批）

### milestoneDeliverable 里程碑·交付物（时间线）
- 里程碑按 targetDate 升序：dot（achieved 绿 / at_risk 琥珀 / missed 红 / planned 灰）+ 标题 + MM/DD + 状态 pill（milestoneStatusLabels 中文）。
- 下一节点横幅 `.pm-ms-next`：首个未达成且未错过、targetDate≥今天的里程碑；at_risk 追加「有风险，需优先跟进外部依赖」。
- 分隔线后列交付物（dueDate 升序）：dot（accepted 绿 / in_progress 蓝 / 其余灰）+ 名称 + 日期 + deliverableStatusLabels pill。
- 空态：暂无里程碑与交付物。

## 3. 待迁移卡（后续批次，形态照参照，引擎不动）

- completionHero 任务完成率：完成环（done/total）+ 五态横向分布条（完成/进行/待办/受阻/收尾）+ 需要关注≤4（逾期 chip/临期 chip + 标题 + 负责人·日期）+ 无主计数脚注。
- projectScale 项目状态·规模：逐项目状态 pill + 名称 + 完成率%（跨项目对比），点击进项目。
- objectiveProgress 客观进度·清单：仅按清单完成项派生，无清单不估算；进度条 + % + 负责人。
- peopleLoad 成员负载：同刻度 MAX 四态堆叠条 + 人数 + 图例；未分配单列。
- overdueSoon 逾期/临期：≤8 条按日期升序，chip + 标题 + 状态·负责人·日期。
- riskMatrix 风险矩阵：仅未关闭风险进入 3×3；weeklyPlan 未来 7 周未完成截止计数；recordList/kpiMetric/formulaCard/statusRing/completionTrend/textNote/divider/queueCard 维持真实能力，仅对齐卡片语言。

## 4. 项目概览（project-scoped card board，非 WBS 树）

- 卡片：项目健康（只读·算法不改；lamp dot + 一句「有受阻项，需关注」+ 开放/完成/完成率）、阶段与里程碑（时间线 + 下一节点横幅）、需要处理（项目内逾期/临期）、执行人·日程·提醒（只读块：负责人/开始/目标/仓库链接 + 打开/复制）。
- 复用健康/下一节点/阻塞/上下文口径，不重算；不渲染 WBS 树。

## 5. 防护（b4-guard.test.ts）

16 卡注册无 disabled；用户布局优先、不 reset；board/overview CSS 零裸色；overview 复用 core 纯函数；里程碑卡时间线形态且无旧 SegRow。GUI（1440/390 浅深/200%、拖缩、保存重启持久、console 0）由 Main 采证。
