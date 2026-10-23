# 前置选择器独立复验 R1 报告

> 2026-10-22，trae，TaskPredSelectionRetestR1。不同独立 SOURCE/AUTO 专家，非开发、非 GUI。**SOURCE=PASS_LIMITED，AUTO=PASS_LIMITED**，仅 panel 两处修复及明列正式子集；始终 **RELEASE_STOP**。不签 GUI/整父任务/父 commit，不默认豁免剩余警告。

## 对象与结论范围

- [授权原句](task-predecessor-selection-independent-retest-20261022-r1-authority.md)、[复验计划](task-predecessor-selection-independent-retest-20261022-r1-plan.md)、[开发交回](../plans/task-predecessor-selection-dev-20261022-r1-report.md)均明确最小两处修复；不追加审批，不修改产品/旧测试/其他 testing/livingdocs。
- 精确 panel SHA：`581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d`。基线提交 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，version0.7.4 只是输入，不代表发布或运行装载。
- [独立 candidate](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r1/candidate.json)绑定开发 r1 整份输入的独占副本，实际 **519 包输入 / 402 src 输入**，含作者 tracked diff/new files/旧源合并清单。不是519业务修改，不按旧107整体PASS继承。
- 只审两处 panel 修复及明列受影响子集。主树 renderer/ask/新增 tests 是合法并行输入，不锁、不回退；本轮结束时主 src 与冻结 src 一致是该时点观察，不是后续 writer 锁或父全包签名。
- [最终审计](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/final-audit-r1.json)于13:28:31Z核源、三轮封存与实际失败口径，exit0；正式子集21文件/199实例无实际FAIL或未捕获错误。C02仅校正隐藏FormData子断言的测试前提，原红不改色。

## SOURCE 独立审查

[独立两段产品差异](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r1/independent-product.diff)为 +10/-7。将两处逆向移除后，整份 panel SHA 精确回到原红 `fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947`；未把已有历史 panel 改动认领成此次开发。

- checkbox `panel.tsx:2936–2945` 在真实事件 handler 内同步读 `e.currentTarget.checked`；updater 仅布尔值、稳定 row ID、prev，不晚读事件、不 persist、不吞异常。C01 真实 React18 SyntheticEvent 控制证实同步 true/false、dispatch 后 currentTarget=null；实际 TaskForm 原四目标均真实 DOM click/input，不复制组件体或自建状态模型。
- submit `panel.tsx:2633` 用 `Array.from(checkedIds)`，无过滤丢项；空 Set 仍发显式[]，create 非空才带字段。search 在 :2899–2925 只过滤可见行，不改集合。
- 原 command/task update→core/tasks 整体替换/显式[]清空、自身/跨项目/不存在/环拒绝语义未改。后端/schema/资料 refs/history/renderer 不属此次产品差异；相关拒绝/解除重试、JSON/文件原子和资料历史用例纳入受影响子集，但不冒选择器完整持久化旅程。

## C02 精确处置

**原隐藏 FormData 完整性子断言属于旧 oracle 前提，不是当前产品未修的关系丢失，也不是默认豁免。**

原 TPC01 [合同](task-predecessor-checkbox-red-20261022-r1-plan.md)要求初值与 FormData 一致、隐藏选择保留、恢复和干净取消；原 panel 既有 :2527–2530/:2899 与 TPC02 [合同](hidden-predecessor-submit-red-20261022-r1-plan.md)明确“搜索仅过滤视图，隐藏已选仍提交”。合同没有要求给隐藏项补原生控件或 dummy hidden 字段。原测试却把隐藏后的原生 FormData 也当完整提交集合。

1. **原七例原样重跑仍 6绿/1红/exit1**。[原结果](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r1/original-seven/vitest.result.json)及 [C02 原证](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r1/original-seven/observations/2-C02/observations.json)保隐藏 FormData=[]、footer1，恢复/取消仍 NOT_REACHED；没有把旧测试改绿或删除红。
2. [独立 C02 adapter diff](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r1/C02-adapter.diff)只替换原测试 C02 正文；其他六例及共享helper/fixture字节不变，C02断言变化按diff明列。原 test SHA `06b0de03361b8003f101595be145e1c645b5b02666e08a0ffa093e6d00246e4f`，独立 adapted SHA `e60c433287bcac5d658dd0448e852f153dfd33b787529e6218e754292b640fab`。Vitest 在自有配置中适配，不写旧 src test。
3. [新 C02 原证](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r1/adapted-seven/observations/2-C02/observations.json)：隐藏只见未选 t1、FormData=[]/footer1，存活/零命令/fixture不变；恢复后原 assertSelection(t2)成立，再干净取消一次 onCancel。然后**独立重新挂载**，隐藏 t2、点击真实“保存更改”，submit一次、真实 run payload=[t2]。此阶段 run=false 仅捕获，不冒 handler/core，与先前零写取消阶段分开。
4. 原五真实提交测试完全不改，另证 payload=[t2]、原 handler/core 内存写后/回读=[t2]，两必要红目标“只剩t1”“无匹配全部隐藏”均成立。若此处有实际清除则仍 FAIL；本轮未出现。因此仅将原 C02 的隐藏 FormData 完整性前提纠正为“可见 DOM 集合 vs 完整实际 payload”，不是将整个旧失败消音。

## AUTO 实测

所有用例使用精确冻结源；真实 TaskForm/全部子组件保留。生产虚拟 transform **仅追加 export { TaskForm }**，[diff](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r1/virtual-panel.diff)，虚拟 SHA `8f41891477bd3d78fa959782ce632c140aeb008eb5998fa14ea8354850f29ccc`；原 lucide inline、同 React18 alias，无 hook/组件 mock。

| 执行 | 实际结果 | 审签范围 |
| --- | --- | --- |
| 原七，不改 oracle | 1文件/7例，6绿1红，0 skipped，exit1 | 原 C02 红保留，不称原七全PASS |
| 独立适配七 | 1文件/7例全绿，0 skipped，exit0 | 原六完整复验 + C02 合同校正/完整取消与另次 payload |
| 原真实提交五 | 1文件/5例全绿，0 skipped，exit0 | 原三控制与两隐藏目标；原 handler/core 内存链 |
| 原受影响子集 | 18文件/182例全绿，0 skipped，exit0 | assertion绿；原设施警告单列，不签日志零错 |
| 资料引用原 DOM | 1文件/5例全绿，0 skipped，exit0 | 切换引用/取消/合法字节与stage，不扩GUI |
| r2 调度设施 | 18文件/182例全绿，Vitest/runner exit0 | **设施不通过**：新增异步 document.querySelector TypeError，原 stderr保真 |
| r3 调度+完整document设施 | 18文件/182例全绿，Vitest/runner exit0 | 原断言不改，无未捕获/RAF/detached错误；正式 affected 取本轮 |

正式有限子集为 **21个不同测试文件 / 199个用例实例，实际FAIL=0、skipped=0**，不是加总重复运行次数或单个 expect 数；原裸 FormData 红和 r2设施错误不伪计为正式绿。JSON没有 runtime-error 计数，审计核 retained stdout/stderr/exit/success，而不是捏造该字段为0。

原四目标 N01改标题选反向t1、N02改标题取消t2均未提交且存活；N03首选t2→rapid→选t1→取消t2→取消t1四click全到；N04已有t2→rapid→选t1→取消t2→重选t2三click全到，各步精确集合/计数/fixture/零调用成立，不冒 N01 已保存成环关系。原五例各一次主 submit→一次原 task handler success→一次 tasks/t4 put→一次 onSaved，其他实体不变；隐藏两例 DOM FormData仍[]/footer1但 payload/core均[t2]。证据为 [四目标审计](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/audit-r1.json)、[五例原结果](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r1/real-submit-five/vitest.result.json)与逐例 observations。

### 警告与设施

原 affected stderr 含两个预置 Error/AggregateError 拒绝控制日志、TaskTable key警告、Node EventTarget 11 keydown listeners警告、两条旧fixture缺RAF的detached-tree清理warning。r2补实际jsdom RAF后，旧test document只有activeElement，出现 `document.querySelector is not a function`；尽管Vitest182绿/exit0也不认设施PASS。

r3只在测试配置中把该test的 document替身接真实空jsdom document，native RAF/cancelRAF与完整document在恢复globals后仍可供callback用；[fixture diff](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r3-facility/fixture-adapter.diff)仅一行测试设施，所有产品/原断言不变，未替换产品callback/组件/hook。原fixture、r2错误与各轮输出均保留。r3不再出现未捕获/RAF/detached错误；[完整 stderr](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r3-facility/vitest.stderr.txt)仍保 TaskTable key 与Node listener警告、两个注入拒绝日志。**本选择器有限门不签整页/焦点/泄漏/零console，也不默认豁免父门这些风险**，由Main纳入其总门；三组独立DOM（适配七、提交五、资料五）stderr为空。

## 隔离与保护

- macOS、nvm Node22.23.3、React/ReactDOM18.3.1、jsdom25.0.1、Vitest2.1.9；pnpm11.28.5仅项目约定，本角色未调用。DOM lock SHA `15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973`。
- 项目依赖独占13579文件/1030内部软链、DOM依赖1595文件/2内部软链，字节相等、共享inode/外链均0；全部执行HOME/TMP/cache/DSH_HOME/文件/备份根归本角色。后续借本角色自有r1只读依赖，不借主cache。
- [r1 close](../../reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r1/close.json)核旧红checkbox r2/r3、旧submit r1、开发r1、旧tests/原计划报告、主lib/package/lock及自身冻结输入/依赖均零增删改；独立审计重核17003条封存指纹。r2/r3继续核这些资产与本角色前轮不变；不外推整盘/正式data已扫描。
- r1 runner85075，子85372/85426/85451/85520/85617均结束，exits1/0/0/0/0、signal/error空。r2 runner86725/子86860已结束，exit0，原异步设施错误仍单列。r3 runner87193/子87226均结束，exit0、signal/error空。最终重核r1/r2/r3各17003/206/209条封存指纹，零漂移；主panel在最终审计时仍为候选SHA，仅时点观察。

## 命令与交接

仓库根、macOS执行。下列 runner 均防覆盖，不应在既有证据根再次运行：

```sh
NODE22=/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node
QA_HOME=/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1/r1/home
QA_PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin
env -i HOME=/Users/bytedance PATH="$QA_PATH" "$NODE22" --check docs/testing/task-predecessor-selection-independent-retest-20261022-r1-adapter.mjs
env -i HOME=/Users/bytedance PATH="$QA_PATH" "$NODE22" --check docs/testing/task-predecessor-selection-independent-retest-20261022-r1-run.mjs
env -i HOME=/Users/bytedance PATH="$QA_PATH" "$NODE22" docs/testing/task-predecessor-selection-independent-retest-20261022-r1-run.mjs
env -i HOME=/Users/bytedance PATH="$QA_PATH" "$NODE22" --check docs/testing/task-predecessor-selection-independent-retest-20261022-r1-audit.mjs
env -i HOME="$QA_HOME" PATH="$QA_PATH" "$NODE22" docs/testing/task-predecessor-selection-independent-retest-20261022-r1-audit.mjs
env -i HOME=/Users/bytedance PATH="$QA_PATH" "$NODE22" --check docs/testing/task-predecessor-selection-independent-retest-20261022-r1-facility.mjs
env -i HOME=/Users/bytedance PATH="$QA_PATH" "$NODE22" docs/testing/task-predecessor-selection-independent-retest-20261022-r1-facility.mjs
env -i HOME=/Users/bytedance PATH="$QA_PATH" "$NODE22" docs/testing/task-predecessor-selection-independent-retest-20261022-r1-facility.mjs r3-facility
env -i HOME=/Users/bytedance PATH="$QA_PATH" "$NODE22" --check docs/testing/task-predecessor-selection-independent-retest-20261022-r1-final-audit.mjs
env -i HOME="$QA_HOME" PATH="$QA_PATH" "$NODE22" docs/testing/task-predecessor-selection-independent-retest-20261022-r1-final-audit.mjs
```

十条命令实际exits **0/0/1/0/0/0/0/0/0/0**。原runner的exit1保C02红；r2原exit0不等设施PASS，独立原证检出异步TypeError后已单列不通过，r3补设施再复验。语法检查曾重复，均0；未有Vitest设施启动失败重跑。每组vitest.command.json保完整argv/cwd/白名单env/PID/时间/exit，stdout/stderr/JSON原样保真。接手只读Git status，rg不可用exit127后改限定find/grep；记忆给定路径不存在exit1，未以平台记忆替仓库。轮询工具首次参数不兼容后按实际execution_id观察结束，未停服务。

未build/type/install/pnpm/default verify/业务或旧src test写/Gitwrite/browser/service/key/vendor/正式data/上游操作。隐藏前置五例只证明原handler/core的**内存领域关系保持**，不冒其JSON落盘/重启/宿主run全链或GUI。原四例只是submit前交互，不冒循环保存成功。

**Main后继**：汇总本精确源有限门及其他不同专家门后，唯一新冻结/build/完整回归，绑定新产物和实际装载实例，再按既定GUI合同采选/取消/重选/rapid/隐藏save、循环拒绝保稿→解除retry及关系实际回读；GUI审签另端承担。不认3260旧107/PID71922已加载本修复。父全部余项/最终普通commit仍由Main收口，本角色STOP、RELEASE_STOP。
