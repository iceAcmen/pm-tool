# A11 总览完成卡 GUI 原证限定审证计划

> 给 Main、负责人和接手专家使用。trae 独立审证角色，只审现有原件，不操作 GUI、不修产品；按 20261021 派单命名，实际时点记录 UTC。

## 授权与边界

负责人原句：

> 独立限定A10-OP-G01修后A11 GUI审证。仅写docs/testing/a11-overview-done-gui-review-20261021前缀，禁止产品/GUI/build/services/credentials/commit。

补充事实来自同一派单：A11 原件位于 `reports/all-pending-evidence-20261021/A11/`；objective 3225/PID32660 的启动原件只读 `/private/tmp/pmtool-a11-objective-runtime-20261021/artifacts/start.json`，不访问 runtime 的 private/凭据目录。Chrome PID29351/window23677 原生100%以原菜单截图核验。当前开发仅改 provenance-panel、未 build，不以当前源替 A11。

AGENTS/collaboration §9、§11.3–11.5为依据。已读原 A10 审签、A11 独立 SOURCE/AUTO 复验及其计划。writing-plans 仅用于有序审证；本单不实施功能、不另建 living plan/worktree、不提交，优先遵守上述限定写根。

## 步骤与状态

- [x] 核授权、原缺陷、根因更正、原 F2 oracle；不将本机跨日改作 F2 的 D。
- [x] 目视 menu100、observed-current、upper/lower/tasks 原 PNG 和 native100 五个原帧。
- [x] 登记原件 size/SHA256/mtime；复制同 A11 声明的隔离源码/产物及非私有启动原件，仅作静态归档。
- [x] 核完整 uncached 200 响应、唯一完整 client 段、source-map 尾注差异、候选/source/build/environment/start/页面同文档绑定。
- [x] 核 F2 原项目与十任务完整记录对应 hash、done/legacy/wrapped 独立统计、seed 首确认零写与浏览 before/after 零写。
- [x] 分列原下卡离屏、人工/清单多态未采、首 seed/toggle/selector 设施失败及外层原日志缺项，不以失败轮签 PASS。
- [x] 终核已登记输入漂移、当前源码适用性和报告链接；限定报告完成，独立G01关闭仍BLOCKED，任务释放。

## 判定原则

原图可见、DOM 原文、盘记录、作者测试、实际字节绑定分别判。上卡及 tasks 汇总可单独有限 PASS；下卡 DOM20不能代替目视。原合同要求的同页上下卡及人工30/0/clear、清单100/50原图未齐时，OP-G01关闭判定为 BLOCKED，旧 FAIL 不改写；不因补采缺口制造新产品 FAIL，也不签全 OP/B8。

其他显现潜在问题只记原观察与待证，不扩范围强判。完整源码/产物归档声明与缺项、原失败及终核均由本前缀承载，living docs/协调记录由 Main 接续。

## 续审新增输入（原冻结状态不覆盖）

负责人在原终核前追加 manual-r2、checklist-r2 审证授权：两段 outer exit0；人工15态与清单9态均有目标任务原 wrapper，清单另有逐态 root；按原合同审真实滚动后的上下卡图/帧，不以退出码或文件名关闭有限 G01。本专家仍只审原件，不执行 GUI/helper，不访问 private，不改产品或其他文档。

- [x] 新冻结 `supplement-inputs-r1.json`：objective共557原件，新增390；原191输入零漂移，partial保真。新增根只有manual-r2与checklist-r2，没有首helper失败的原外层日志。
- [x] `supplement-observations-r1.json`：24完整wrapper、34状态、288帧SHA；人工30/0/null与备注、清单稳定UUID100/50、status/progress保真、跨页与根hash边界已核。
- [x] 使用新增raw的version2编码静态重算原F2十一record，全部唯一匹配已登记盘hash；不是重新读取runtime。
- [x] 单独目视五组upper/lower原PNG：下环20%、2/10、收尾1可见；标upper的五图也在中下部，上方小完成卡仍离屏。
- [x] 逐帧目视新增288帧及必要放大：19页全部逐格检查，五态均无上方小完成卡可见补证；不得用旧初态上卡代五态。
- [x] 更新有限结论、终核新旧输入/静态/partial/链接/空白，记录命令退出与未覆盖边界后释放。

## 终核与释放记录

`supplement-drift-r1.json`核557原件及6份partial零漂移；`drift-pre-report-r1.json`核191原输入、966静态、966快照零漂移，新增390件全部已另冻结。当前唯一主树指纹差仍provenance-panel，A11隔离source/lib未变，按局部影响保留历史限定结论。

`supplement-observations-r2.json`为追加严格断言后的成功复跑：24wrapper、34状态、288帧、十一原F2wrapper唯一匹配；明确标签顺序、raw逐SHA一致、updatedAt时序、重开manual与备注、清单逐态非目标/root边界，exit0。r1与原partial/失败不覆盖。

`node --check`原audit、resume-audit、supplement-audit、final-check四文件均exit0；`final-check-r1.json`核7个本前缀文本、21本地链接零缺失、12个JSON可解析、19联系页指纹及6份partial保真，exit0。`git diff --check -- 'docs/testing/a11-overview-done-gui-review-20261021*'` exit0；untracked文本另由final-check逐行检查，不能只凭git未报错。

离线Swift联系页执行原工具metadata为`812097d2ae6c8d6e5bd927bcb7efc949`、父PID75814/子75816，exit0且outputComplete；两PID后续`ps -p 75814,75816 -o pid=,etime=,stat=`无输出、exit1（已退出，不是测试失败）。仅为本专家离线子进程结束检查；不以此描述3225服务。其stdout为manual197/checklist91原帧，不执行GUI。早先两次联系页`ls`在编译尚未完成时exit1，随后19页齐备，非产品失败。

交付前在相同仓库根再跑`supplement-audit finish supplement-drift-final-r2`、`audit finish drift-final-r2`及`final-check final-check-r2`，仅新增唯一命名终核产物，不覆r1。产物记录实际UTC、环境、结果和最终文档SHA。最终判定仍是下卡/记录PASS_LIMITED、五态上卡及G01关闭BLOCKED；不授权整OP/B8、新功能、发布、commit/push。
