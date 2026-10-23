# 隐藏前置关系真实保存独立必要红计划

> 2026-10-22，trae，独立测试先行，非开发、非 GUI；角色 HiddenPredRedR1。使用 writing-plans 与 brainstorming 核对既定意图，服从本次唯一可写范围，不创建额外 worktree、通用 plans 或 Git 提交。

**目标**：只补 TPC02 原 C02 未达到的真实 TaskForm 主保存，检验搜索隐藏既有前置关系后，仅改标题是否错误清除关系。

**架构**：复用 TaskPredCheckboxRedR1/r3 的 React18/jsdom/inline 原 lucide 配置；冻结原 r2 产品源码，Vitest transform 仅追加 `export { TaskForm }`。run 薄接线捕获完整原命令及 JSON，再调用真实 `handleTaskCommand` 和合法内存 PmDomain；生产组件、hooks、task update handler/core 均不 mock。

**技术栈**：macOS、Node22.23.3、React/ReactDOM18.3.1、jsdom25.0.1、Vitest2.1.9，既有依赖独占复制，无安装。

## 授权与边界

负责人本次原句：

> 父多角色/持续缺陷修复授权，验全部后普通commit，无push/tag/services。你独立测试先行非开发非GUI，唯一docs/testing/hidden-predecessor-submit-red-20261022-r1*、自有HiddenPredRedR1，唯一test src/client/task-predecessor-hidden-submit-dom.test.tsx。依据 docs/testing/task-predecessor-checkbox-red-20261022-r1-report.md TPC02控制失败：已有t4前置t2，搜索只剩t1 footer1但FormData丢t2，未submit；需独立最小真实TaskForm生产submit→run捕获payload，确认是否真的原保存清隐藏关系（若只是payload未影响backend不夸持久损失）；run用真实taskupdate handler/合法memory domain可，若虚拟adapter callbacks仅payload边界明确。原TPC01 null.checked不碰checkbox绕该缺陷，用已有selected+搜索+只改title主save，对照无搜索/恢复搜索/隐藏已选保等，源原panel107 fa07.. unchanged，renderer改后108合法不锁。真实DOM配置复用TaskPredCheckboxRedR1/r3 inline lucide原设施，不mock hook组件，adapter仅export TaskForm。计划先落，独立业务合同保既有前置关系（搜索是只读过滤不取消），最小panel.tsx submit/filtered checkbox面。不改产品/旧tests/原报告，不build/install/noemit/sharedlib/browser/service/Git/key/vendor/正式data。输入冻结/sha/selftmp/exit/error保，RED交Main后开发统一panel一次最小修TPC01+TPC02，另一专家复验。当前TPL红7=2控绿1controlred4crash，别重复7全部/广搜，只补C02未达到submit。结束releaseSTOP。

- 新增唯一源测试：`packages/dsh-pm-tool/src/client/task-predecessor-hidden-submit-dom.test.tsx`。
- 新增文档/运行器/审计：仅 `docs/testing/hidden-predecessor-submit-red-20261022-r1*`。
- 自有证据与隔离 HOME/TMP/cache/DSH_HOME：`reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/`，不覆盖旧轮。
- 原测试、原报告、产品、shared lib、vendor、业务 data、服务、浏览器、key、Git 均不写或执行。父普通 commit 在全验后由 Main 处理，本角色无 Git 动作。
- 本角色终点是原源必要红/控制与原证交 Main，不修后自验，不签 GUI、整项或发布 PASS；`RELEASE_STOP`。

## 输入与独立业务合同

- 原候选：CombinedRepairR1/r2，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，107 声明、515 包输入、version0.7.4；继承原 tracked diff/new files/source hashes，仅认领原件，不用当前 HEAD 代替。
- 被测原 panel SHA256：`fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947`。父 renderer 后继108声明合法且不锁、不回退；本轮结果不签后继。
- 原 C02：真实已有 t4 前置 t2，搜索候选任务1后 footer1、FormData=[]，但没有 submit。原7项2控绿/1控制失败/4崩红不重跑、不改写。
- 原 panel:2527–2530 与 :2899 已有“搜索只过滤视图，被过滤已选仍保留、照常提交”合同；submit:2633 取 FormData，:2925 过滤 checkbox。独立预期来自保既有关系的业务合同，不以旧实现自身输出定义正确。
- fixture 通过原 `addProject`/`addTask` 创建 p1/t1–t4，t4.predecessorIds=[t2]，同项目、无自身、无初始环；原 schema 再校验。不冒原 GUI/正式数据副本。
- 未点击任何前置 checkbox，不触发 TPC01；仅真实 input 搜索/标题和主按钮保存。搜索本身零 run/零内存写。
- 显式提交后必须有一次 `task update t-0004 ...`、真实 handler 成功、一次 tasks/t4 put、一次 onSaved，其他实体不变；payload 和真实 getTask 回读都必须仍含 t2。
- 内存 domain 仅替代存储接口，证据可证明真实 handler/core 的内存关系清除，不能据此声称 JSON 落盘、重启回读或正式数据已经丢失。

## 用例

| ID | 动作（全部已有 t4 选 t2、只改 title） | 独立预期 |
| --- | --- | --- |
| HPS-C01 | 不搜索，主保存 | payload=[t2]，core 回读仍[t2] |
| HPS-C02 | 搜索只剩 t1，清空搜索恢复，主保存 | 搜索前后零写，恢复后保存仍[t2] |
| HPS-C03 | 搜索 t2，已选项可见，主保存 | payload/core 均保[t2] |
| HPS-N01 | 搜索只剩 t1、footer1，直接主保存 | t2 不因隐藏而取消；必要红目标 |
| HPS-N02 | 搜索无匹配、footer1，直接主保存 | 所有项隐藏也必须保[t2]；同一过滤面边界 |

不得在错误 FormData 阶段提前终止 N01/N02；先记录 DOM/集合/计数，再达到生产 submit/run/handler，最后独立断言 payload 与内存回读。控制及必要红每例独立初始化，不靠上一例绿色放行。

## 执行步骤

1. [x] 只读核对原报告、r3 配置、冻结源 TaskForm/submit/filtered checkbox 和原 handler/内存领域模式，先落本计划。
2. [x] 新增唯一测试及自有运行器；仅 export adapter，复制既有源码与依赖，核 SHA/无共享 inode/无外链，记录输入 manifest 与 fixture。
3. [x] 仅运行本文件五例；实际3控制绿/2必要红、exit1，全部触达真实主submit/handler；完整 DOM、payload、内存写/回读及错误原件已保存。
4. [x] 保存 argv、cwd、白名单环境、PID、开始/结束、exit/signal/error；原 r2/r3、旧 test/report、主 lib/package/lock 与自有源/依赖保护全零变。当前 panel 前后仅观察，不锁并行 writer。
5. [x] 已形成[独立必要红报告](hidden-predecessor-submit-red-20261022-r1-report.md)交 Main：真实 handler/core 内存关系清除确证，非磁盘持久化损失证明；原证审计exit0。非本角色开发统一panel最小修TPC01+TPC02，另一专家复验；本角色 RELEASE_STOP。

运行环境：macOS + nvm Node22.23.3；从仓库根执行：

```sh
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/hidden-predecessor-submit-red-20261022-r1-run.mjs
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/hidden-predecessor-submit-red-20261022-r1-run.mjs
```

预期设施语法exit0；若必要红成立，Vitest/runner exit1，控制绿与完整提交证据保留，不将 exit1 伪称 PASS。设施失败单列且保原 stderr/stack，禁止改产品“排障”。
