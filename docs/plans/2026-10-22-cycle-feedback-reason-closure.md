# 前置依赖原因与权限误导修复计划

> 2026-10-22，trae，沿父任务持续既有缺陷修复授权。独立先行依据：[两项必要红及最小合同](../testing/cycle-feedback-reason-20261022.md)。开发与独立复验分离，Main唯一GUI/builder；不提前commit、不push/tag/发布。

**目标：** 合法关系反例失败时保留具体中文原因，结果卡不将“检查目录权限”建议误判为权限不足。

**方案：** 采用窄业务错误类＋已有handler。备选全Error原文透传会暴露未知存储信息，备选仅改通用文案不能修分类根因；采用窄类保守返回。权限标签用本地明确拒绝原因判断，避免通用关键词扫描，原显式反馈context/原文/复制/代际/成功信封不变。

**运行环境：** macOS，nvm Node22.23.3，pnpm11.28.5；实际开发使用独立源副本和现有依赖，不install/build、不写共享lib。用户已授权持续确证修复与独立分工，原先行8绿2红保留，不再索要本批例行实施确认。

1. 开发先读原合同及3个产品文件；仅 `packages/dsh-pm-tool/src/core/tasks.ts`、`src/commands/task.ts`、`src/client/result-card.tsx` 与必要同域测试可写。原testing/封存FeedbackRemainingR1/U4r2禁止写。
2. 在自有冻结复现原两红和8控制；新增必要同域测试覆盖四种前置关系拒绝、未知异常兜底、成功标题不误红、明确权限拒绝及建议非权限。
3. `tasks.ts`增加窄PredecessorRelationError并替换现有关系拒绝的throw；不改BFS/去重/schema/队列/落盘/界面。`commands/task.ts`导入并纳已有业务handler，仅已知业务原因可透传。
4. `result-card.tsx`权限标签仅认可信前缀之后的明确原因或明确拒绝表述，保留原权限正例。小helper可同文件，必要另文件先说明；不改全局classifier关键词或一概删除标签。
5. 开发自有测试后交回候选diff/sha/退出记录，不能自己验收。不同独立专家用自有冻结复验原专家cases与受影响既有tests，不改原oracle。
6. Main在新隔离候选构建，绑定当前全产品输入及新增文件；新GUI仅补O3真实拒绝→可见具体原因/无权限误导/保稿→零写→修正重试。原U4r2旧bundle继续采无关余项，不冒新修已生效。
7. 必要完整回归与独立GUI审签后同步livingdocs；最终总范围门关闭才按父授权普通commit。未过门期间继续已有采证/缺陷修复，不开新功能。
