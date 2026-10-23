# 四扩展确认初始基线收口

> 2026-10-22，trae。沿负责人持续“全部未验功能验完、修确证、独立分离、最后统一commit”授权；先行必要红已由不同专家落盘，不增加审批或新功能。Main唯一builder/GUI，开发不自签PASS。

目标：关闭[EXT-BASE四红](../testing/a15-preconfirm-independent-retest-20261022.md)，保留PC01/PC02已修行为。实际父层当前仅从tasks收baseline，四扩展update缺键，后端缺键时不进行对应updatedAt比较。本轮只补父层既有数据的收集，不修改后端/schema/模型或新增协议。

文件范围：开发独占`packages/dsh-pm-tool/src/client/panel.tsx`的baselineMap构造及新`packages/dsh-pm-tool/src/client/copilot-extension-baseline.test.tsx`。从现有tasks/milestones/riskIssues/deliverables/meetings收ID与原updatedAt，沿现有当前项目过滤保项目边界；create不需要伪造旧基线。计划生成时保存，显示仍使用最新只读props。不得覆盖sidecar修复/其他panel在途成果，不改CSS/TaskForm/后端/其他测试。

执行顺序：

1. 完整主树src自有冻结，核sidecar已独立签字hash及旧A14/source/lib保护；复制原parent四例不改expect，先复现4红，控制设施和合法record/plan仍可用。旧报告/原件只读。
2. 最小补父层baseline收集；原四例转绿。真实PmPanel回归涵盖task+四扩展初发、生成后正常props外改仍送原base、重生成更新、取消零apply、同项目过滤、不改四扩展创建协议。
3. 自有无缓存单fork、HOME/TMPDIR/cache跑原PC四例、23独立反例、87相关回归及完整冻结noEmit；命令/原exit/reporter/全部失败保留。不得build/install/GUI/服务/共享lib/cache/凭据/commit。
4. 开发报告`reports/a16-extension-base-developer-20261022*`交回释放；另派不同专家SOURCE/AUTO复验。Main其间继续F02/导入故障与已有旅程采证。
5. 独立通过后Main唯一新A16输出构建/全回归/新实例与uncached完整client绑定，再采PC-G01..04及四扩展update确认前外改、clean对照；独立GUI审签后继续全部积压。原A13/A14产物和原FAIL保留，最终适用整门闭合才统一普通commit。

运行环境macOS、nvm Node22.23.3、pnpm11.28.5及既有React18/Vitest2.1.9。精确argv/cwd/env和指纹由执行者落盘；不以占位命令当证据，不push/tag/发布/正式服务切换。
