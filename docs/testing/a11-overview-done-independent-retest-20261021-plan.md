# A11 总览状态完成卡有限独立复验计划

> 给 Main 和接手专家使用：只核 A10-OP-G01 的本地源码与自动化，不修产品、不审签 GUI。平台 trae，20261021 派单；实际时点由命令原证记录。

## 授权与停止条件

负责人原句：“新独立专家有限source/auto只写docs/testing/a11-overview-done-independent-retest-20261021*和selftmp，不product/gui/service/build/sharedcache/private-runtime/credentials/otherdocs/commit。”

后续更正原句：“旧额外完成是F2-P todo/legacy100，不是wrapped本身（旧isTaskDone=done或legacy>=100）。原expertA10OPG01误归wrapped保历史报告……全局warroom untouched，scope只localdone card。”

- 可写仅本前缀文件及 selftmp；Main 是唯一 builder、GUI 执行者与最终提交者。本专家独立于本次开发者，不修改产品后自验。
- 脏主树为在途候选，不 fetch/pull/install/build/清树；不写 living docs、其他 testing、共享依赖/缓存、业务数据、服务或凭据。
- 冻结当前完整 src、overview、新作者测试、依赖声明/lock/tsconfig、原 F2 两文件；node_modules 只链接已批准 worktree 的依赖。HOME/TMPDIR/XDG/Vite/Node cache 均为自有 selftmp。
- 缺输入或测试失败保留原证；不改产品或原 schema。源码漂移需分文件判断受影响证据，不以 HEAD 代表 dirty 候选。
- 完成有限源码/自动复验报告后释放。GUI、build、实例和整项门不在本单范围。

## 逐项合同

| 用例 | 执行与显式预期 |
| --- | --- |
| A11-S01 根因 | 原 F2 schema 合法；旧归档真实 Overview 的谓词和真实 computeKPI 多计 t-0001/F2-P，旧3/10=30；wrapped/t-0010 progress0不是额外完成。当前上卡不读 kpi.doneRate，war-room 不改。 |
| A11-A01 作者复跑 | 原样复制作者10项真实 Overview 测试，F2 done2/10=20、wrapped1、manual30/0/null、清单100/50、空与全零。 |
| A11-A02 同页真实模板 | 独立真实 Overview 与真实 WIDGET_REGISTRY completionHero 对同一合法 Snapshot；数字、比率、条宽/环值、wrapped及open桶与 collectStats一致，输入不变。 |
| A11-A03 matched subset | 仅构造无悬空父/前置引用、同项目唯一ID的合法子集；原F2完整子树、根级done/wrapped/零done组合，分母仅匹配集合，含1/3四舍五入33与2/3=67。完整项目与子集各比较，不偷换统计对象。 |
| A11-A04 父子反证 | 原 P/M/三叶结构，保todo/legacy100的P；将无清单合法父设done仍按记录计数，不自动推导子状态；恢复后0done。wrapped迁P并按合法WBS改code/order，改回todo改变覆盖63→75而完成卡仍20，非GUI写入旅程。 |
| A11-A05 done/wrapped互斥 | 同实例合法todo→done→wrapped→todo、完成日期同步设置/清除；全wrapped、全done、done progress0、非done legacy100/人工100，status完成率独立于清单值。 |
| A11-A06 原因逆反 | 保原P不避开；仅P legacy100→99令旧KPI30→20，新卡均20；仅原wrapped legacy0→100令旧KPI30→40，新卡仍20且wrapped1。不得因此改全局KPI。 |
| A11-A07 合法边界 | 零任务、合法无/空清单；非法字段仅调用未改schema证明拒绝，不给真实组件传malformed、不扩大为脏值兼容合同。 |
| A11-R01 受影响回归 | 原 objective-consumers、overview-contract、panel-checklist-toggle、progress-meta/clamp；真实模板 registry、scope-snapshot、project-default-layout及进度报告Markdown测试。按实际文件/测试数记录，不声称全包回归。 |

## 证据与剩余门

记录基线 HEAD、tracked diff、新文件清单、完整冻结 src/依赖/fixture指纹、作者原红绿原证审阅、各轮 executable/argv/cwd/start/end/exit/stdout/stderr/逐用例JSON及前后 source drift。原专家文件只读且不更正。

当前源码/自动 PASS_LIMITED 不关闭 A10 GUI FAIL。Main 随后 A11 新冻结、唯一 build、重新实例认领，按原 A10合同采原F2人工三态和清单两态同页上下卡原图及完整盘记录；wrapped完整旅程和 OP/B8其余门仍另验。
