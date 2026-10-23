# HC01 旧习惯卡换行开发交接

> 2026-10-22，trae，有限开发，非验收。记录原红、最小源码修复、开发回归与保护，给 Main 和不同独立专家复验；不签 PASS，不执行构建、GUI、服务或提交。

## 授权与边界

负责人本次原句：

> HC01有限开发（非验收），负责人持续全部未验验完/修确证缺陷/最终普通commit授权，Main认领源锁。读AGENTS/collab、docs/plans/2026-10-22-habit-card-wrap-closure.md和专家docs/testing/a19-habit-card-wrap-contract-20261022.md/plan/cases及evidence/supplement正确补件；原GM01闭。唯一允许产品文件packages/dsh-pm-tool/src/client/panel.css仅.pm-habit-okr/必要直属子规则、src/client/views/habits.tsx仅旧卡必要文本节点，新增同域测试。保原图标/文本/标题解析/短样式/裁决声明/控件/建议行，不新增ID/聚合，不改core。最小CSS max-width100%/min-width0/overflow-wrap:anywhere/必要文本flex可收缩和svg flex-shrink0。先完整独占依赖+冻源跑补件4原RED/9control，再最小源码+同域tests，4+9/既有habit-suggestion/habit/受影响/noEmit；原案例只读不改testing。自己只reports/a19-habit-card-wrap-developer-20261022*及自有tmp+允许产品源码，不livingdocs/testing/其他源/build/GUIservice/commit。读适用brainstorming/writing/frontend skill按已授权具体plan不重复提问，不随skill分段commit，最后统一commit。vendor路由按AGENTS既有治理先verify/指纹如加载原件。依赖只来源/private/tmp/pmtool-a19-owned-deps-20261022/node_modules完整复制/内部links/hash/inode独占，不sharedshim/pnpm/install。Node22.23.3直达Vitest/tsc/no-cache单fork/白名单HOME/TMP/cache；原4红/失败保，必要fixture最小输入，保护当前全src/旧lib/来源deps/指定原件。Main同时A18旧候选3248GUI补P0008，不会动你的源码依赖。交source两hash、diff、完整cmd/exit/report/保护/释放，不自判PASS。

已读 AGENTS、collaboration、当前交接/进度/需求/知识与最近变更、有限计划、专家合同/计划/案例及补件。专项派单明确覆盖通用 fetch/pull、安装、构建、livingdocs、完整 verify 与提交步骤；不对 Main 在途脏树执行同步或清理。原 GM01 有限关闭直接引用，不重验其完整旅程。

brainstorming/writing-plans/frontend-design 已只读加载，使用已批准具体计划，不另行设计、提问、建 worktree 或分段提交。vendor 原件尚不加载；先做只读静态 verify/全 manifest 指纹检查，依据 external-skills §6.1 当前独立 FAIL 未闭仍阻止加载，不以开发自查替代独立门。

## 执行清单

- 已完成：读授权、计划、专家更正及同域模式，核对最小允许范围。
- 进行中：完整独占依赖复制/闭合证明、完整包输入与原件保护冻结。
- 待执行：专家补件必要 4 原红、控制 9。
- 待执行：同域作者测试原红、旧 badge/文本节点最小修复。
- 待执行：4+9、作者、既有 habit-suggestion/habit、受影响测试与完整 noEmit。
- 待执行：只属于本轮的 diff/源码 hashes、完整命令回执、保护与资源释放交接。

自有临时根 `/private/tmp/pmtool-a19-habit-card-wrap-developer-20261022`，证据根 [本轮 evidence](a19-habit-card-wrap-developer-20261022-evidence/)；输出拒绝覆盖，red/author-red/green 冻结分开保留。产品仅 `panel.css`、旧 `habits.tsx` 文本节点与新增 `habits-card-wrap.test.tsx`，不写其他产品或 testing。

## Main 接续补记（中断恢复后）

原开发任务在依赖复制阶段被用户暂停并由系统强制停止；上述“进行中/待执行”没有对应完成证据，原自有临时根和 evidence 目录均不存在。Main 保留这段历史，不把计划当执行完成。

恢复后按已批准计划完成最小实现：

- `habits.tsx`：旧 `.pm-habit-okr` 内增加 `.pm-habit-okr-text`，原全文、Link2、声明与不显示 OKR ID 的语义不变；Link2 明示 `flexShrink: 0`。
- `panel.css`：旧 badge 增加 `min-width:0`、`max-width:100%`、`overflow-wrap:anywhere`、正常换行、图标不压缩；文本节点可收缩换行。未改建议行、核心模型或其他页面。
- 新增 `habits-card-wrap.test.tsx` 两项同域作者测试。

首次主树专项命令因主树 `node_modules` 缺 `react-test-renderer`，结果为模型 10 项通过、两个组件测试套件加载失败，退出 1；完整 `tsc --noEmit` 退出 0。该设施失败保留，不称产品红。

随后在 `/private/tmp/pmtool-hc01-main-retest-20261022` 复制当前包源码并只链接既有完整独立依赖 `/private/tmp/pmtool-a19-owned-deps-20261022/node_modules`。第一轮隔离执行 34 绿 2 红：专家 HC-R04 因测试树组件层看不到 DOM 直属 CSS，新增作者夹具漏 `streak`。按原合同分别改为 Link2 自身明示不压缩、补测试夹具，不放宽期望。

最终同一隔离副本：

- 专家 HC-R01..04 + HC-C01..07、作者新 2 项、建议关联 11 项、习惯模型 10 项，共 **36/36，退出 0**。
- 完整 `tsc -p tsconfig.json --noEmit` 退出 0。
- `git diff --check` 退出 0。

最终 SHA256：

- `panel.css`：`3cc0b0ed08ea34462ded8154b05f394a46f02c6577dea5da12c495aafa0f700b`
- `habits.tsx`：`ab7e625808b6c4308068c26376c02d7fae9b59fc812ab9b77484c29633bd4964`
- `habits-card-wrap.test.tsx`：`071c2b0488e88078d15f6436c1798cced495706c15bf8ecbfcf435c343459d0d`

这是开发自测，不签 SOURCE/AUTO 或 GUI PASS。未 build、启服、操作正式环境、提交或推送；下一步须由不同独立专家复验，之后 Main 才能生成新候选和真实 GUI 原证。
