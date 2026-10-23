# A15 确认前守卫独立复验

> 2026-10-22；trae 独立测试专家，非开发。给 Main 接续构建/GUI及缺陷派单使用；以本报告和原始命令/reporter认领有限 SOURCE/AUTO，不能替代全门或发布。授权原句、有效 Oracle、步骤见[先行计划](a15-preconfirm-independent-retest-20261022-plan.md)。

## 1. 结论与剩余缺口

**PC01/PC02 原限定修复：SOURCE/AUTO 有限 PASS。** 真实主树完整386文件冻结，原 PC-C01/C02/A01/A02 未改任何 expect，独立重跑 old=`0/0/1/1`，new=`0/0/0/0`。原 task 确认前外改仍传生成 base，0应用不发送依赖且独立继续；已提供的五类目标 baseline keys 不丢、只推进实际成功 target。新增23项真实 React反例、作者9文件87项受影响回归和完整产品 noEmit 均通过。

**EXT-BASE：P1 既有父层扩展初始基线缺口，SOURCE/AUTO FAIL。** 补跑真实 `PmPanel → CopilotPanel` 四扩展首次确认，`m-0001 / ri-0001 / dlv-0001 / mtg-0001` 的生成基线均应为 `2026-10-22T02:00:00.000Z`，实际发送只有两个 task keys，四项均在末尾 `expect(base[id]).toBe(at)` 失败。此前开发20项及本专家23项中的“扩展键保留”只证明**已传入的键**保留，不能证明真实父层已收集这些键。

源码因果：`panel.tsx` L1483 `baselineMap=Object.fromEntries(tasks.map(...))`，只收 tasks；`sidecar-portal.tsx` 保存/发送它；`commands/ask.ts` 四类 update 的冲突比较都以 `if (base && ... !== base)` 为条件，缺键不进行该比较。**这里只证实首发缺基线和源码条件，不冒充真实后端覆盖/新GUI实测。** panel/backend均与原A14同hash，该缺口不是本两文件修复引入；不得以“原已存在”将其豁免或把原修复 PASS 扩成四扩展闭环 PASS。

**没有全项放行。** 新 PC-G01..04 GUI仍 NOT_RUN；原 PC01 GUI FAIL、原 PC02失败分支GUI NOT_RUN全部保留。扩展初始基线四红仍有效；RA-AI04/AI05适用范围、后端真实落盘、undo clean/changed/mixed、全部 GUI/样式/UX、RA整门及发布均不签。Main可继续不受影响的既有F02上传故障/重试采证。

## 2. 独立性与候选

本角色未参与产品开发，未修改产品或其冻结副本。只写 `docs/testing/a15-preconfirm-independent-retest-20261022*`；没有build/install/sharedlib/cache/GUI/服务/profile/正式数据/凭据/commit/push。未拉取合并在途脏树，未写其他testing/livingdocs。Main唯一builder/GUI，不继承开发自验结论。

被测基线 HEAD=origin/main=`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；不以HEAD代替dirty候选。直接复制当前主树完整 `src/scripts/package.json/pnpm-lock.yaml/tsconfig.json/vitest.config.ts`，非开发r4 overlay；r1 old/new与补证parent-r1均自有冻结。new与开发最终完整源码清单内容差异0；old→new仅 sidecar修改、copilot-preconfirm测试新增，385→386，无产品删文件。跨副本字节比较与原位mtime保护分开。

| 认领输入 | SHA256 |
| --- | --- |
| 全部包输入manifest（含hash/bytes/mtime） | `7085b33e71a3a23530cef91ee9b35df43cca349e829d15fa0f4040b4314f62ed` |
| 包+launcher tracked binary diff | `89c856d9ad95ae22713e0a0940732cfb3d2356ed1504977e1c6664655f84398e` |
| 全部候选新增输入清单/指纹 | `d9140cfb1c09c2af1f1613a22709143a1e6bee7644ae7834ae3bb03faa7b4da9` |
| sidecar-portal.tsx | `7cf48821e7e6ee570288c385b59897fd33f8ab0ec32da42ef87111c2c016a269` |
| copilot-preconfirm.test.tsx | `26c214236164b60b11a795cfa675f64ae886ec7003de1bb01d337439b8118041` |
| panel.tsx（未改） | `0d2a4560e74adb137084d2e37b34625e4b2e5b1801ec76e72fce5b689ccffe03` |
| commands/ask.ts（未改） | `3db897be1275cbbc2473f73e8eb71bb061365a2ddd882008b33698972905bf26` |
| core/copilot.ts（未改） | `9059ab4de0c46398c180f24a9928f4b2de670fee5a2cdc5d317ea26e5a389c25` |

完整输入见[r1候选](a15-preconfirm-independent-retest-20261022-selftmp/r1/candidate.json)、[tracked diff](a15-preconfirm-independent-retest-20261022-selftmp/r1/candidate-tracked.patch)、[新文件](a15-preconfirm-independent-retest-20261022-selftmp/r1/candidate-new-inputs.json)、[冻结清单](a15-preconfirm-independent-retest-20261022-selftmp/r1/frozen-inputs.json)。parent-r1复制同一完整主树输入并逐字节比对r1，无新增产品差异、无需把r1 noEmit扩大为另一源码候选。

## 3. fixture 与原失败

原PC四例文件SHA256=`18093da170e61c626ee434abe1fb467fc7b68da0727e7b6edfdb0b8de149c0da`；旧/新冻结拷贝一致，原件不修改。old两红精确停在既定base/依赖断言，未发生装载/selector/schema控制失败，原0/0/1/1及专家原r1保留。

原 PC-C02 initial t1 `.929Z`，s1 snapshot t1 `.853Z`（同秒），来自更早逐步旅程，**不能作为本轮真实成功的时间单调证据**。核作者after r1..r4该例原reporter均1 passed/0 failed，没有找到“作者首次PC-C02 FAIL”原记录，不补造一次红或历史纠正。原控制仅判发送序列和首base，保持原expect并重跑；本专家另建 IR-C01，在合法新初态、单调snapshot及明确核base的内存传输double上验证三次实际接受和同目标链式推进。这是独立修正fixture证明范围，不改原失败/原测试。

新增用例使用生产record/write schema、真实parse/validatePlan和真实组件，只替浏览器设施/transport。IR-A01含成功目标之外全部键外改，末独立任务确被double拒；IR-A02五种非确证成功含0/错误/幂等/未知/异常10步，前置及传递下游不发，独立s3发送。IR-A04重读抛错/错项目/缺目标保原base；IR-A05/06取消/再生成/最新投影/勾选编辑及非法禁用；IR-A07..09 old/future/无时点/读取错误/mixed/delayed-fresh/应用0撤销。显式undo只调用惰性测试句柄，无真实后端/落盘含义。

父层扩展补证先验证四类合法record和合法计划、真实props非空、生成零apply、真实整批按钮只一次发送正确action；transport故意返回0，避免制造实际成功。四红都发生于最后缺base断言，并非非法fixture/错选择器/缺提交。原 report/23绿/87绿没有删除或改expect来适应新发现。

## 4. 命令与结果

环境 macOS Darwin24.6.0 arm64，既有 nvm Node22.23.3、React/renderer18.3.1、Vitest2.1.9、Vite5.4.21、TypeScript5.9.3、Zod4.6.5。项目既有pnpm11.28.5，本轮未调用。依赖链接最终指向原all-closure的既有pnpm依赖，七包只读，不install。不加载vendor正文或installer。

白名单env：Node22 PATH、自有 HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME、CI/LANG/TZ/NODE_DISABLE_COMPILE_CACHE；测试额外只带自有PC_INPUT/PC_OBSERVATIONS，无继承key/token。Vitest单fork（singleFork=true、min/maxWorkers=1）、`--no-cache`、自有cacheDir。所有子命令精确argv/cwd/env/start/end/原exit/signal及stdout/stderr/reporter保存，不用父runner“预期失败复现”将产品红转换为PASS。

| 独立实际命令组 | 原exit / 结果 |
| --- | --- |
| old PC-C01/C02/A01/A02，各单例 | `0/0/1/1`；控制绿/原两红 |
| new PC-C01/C02/A01/A02，各单例 | `0/0/0/0`；各执行1、skipped3，不把skipped算通过 |
| new-independent | `0`；23/23 passed |
| new-regression | `0`；9文件87/87 passed，含作者新增20项 |
| new-noemit（完整冻结产品tsconfig） | `0`；`--noEmit --incremental false`，无lib输出；原配置排除test文件，非全测试类型检查 |
| parent真实PmPanel四扩展 | `1`；0 passed/4 failed，缺m/ri/dlv/mtg基线；原失败保留 |
| r1 delivery-r1 checker | `0`；reporter/保护/原A14审计一致，不等全产品绿 |
| final-r1父终检与四脚本语法检查 | 各 `0`；保护漂移0、测试进程0，四扩展FAIL仍保留 |
| node --check run/check/parent-run | 各 `0` |
| git diff --check 包范围 | `0`；只读 |

9文件：`client/shared/drawers/copilot-preconfirm.test.tsx`、`client/sidecar-minimize-retention.test.tsx`、`client/panel-checklist-toggle.test.tsx`、`client/panel-launch-handshake.test.tsx`、`client/provenance-panel.test.tsx`、`client/shared/task-draft-materials-stage.test.tsx`、`core/copilot-validate.test.ts`、`core/copilot-task-fields.test.ts`、`core/ask-projection.test.ts`。最小化真实父子/正常TaskForm外改/取消/未发送输入/freshundo保留由原四例和原SM01回归重跑覆盖，不凭23个子组件测试代替父层。

实际入口（macOS、仓库根，重跑用新rN/parent-rN，绝不覆盖）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a15-preconfirm-independent-retest-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-preconfirm-independent-retest-20261022-run.mjs r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-preconfirm-independent-retest-20261022-check.mjs r1 delivery-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-preconfirm-independent-retest-20261022-parent-run.mjs parent-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-preconfirm-independent-retest-20261022-final-check.mjs final-r1
```

原子命令见[r1 commands](a15-preconfirm-independent-retest-20261022-selftmp/r1/commands.json)、[23项reporter](a15-preconfirm-independent-retest-20261022-selftmp/r1/new-independent.result.json)、[87项reporter](a15-preconfirm-independent-retest-20261022-selftmp/r1/new-regression.result.json)、[parent原命令](a15-preconfirm-independent-retest-20261022-selftmp/parent-r1/command.json)、[四红reporter](a15-preconfirm-independent-retest-20261022-selftmp/parent-r1/parent.result.json)、[parent summary](a15-preconfirm-independent-retest-20261022-selftmp/parent-r1/summary.json)。

终检原件见[final-r1](a15-preconfirm-independent-retest-20261022-selftmp/final-r1/final.json)；本段补记后，再以同入口参数 `final-r2` 只读认领最新报告指纹，结果见[final-r2](a15-preconfirm-independent-retest-20261022-selftmp/final-r2/final.json)。不重跑/覆盖产品测试，不将audit绿转为扩展产品PASS。

r1测试UTC `2026-10-21T22:54:17.458Z`–`22:54:51.666Z`，本地2026-10-22。两个父runner工具返回execution ID后未取得末态码，登记 `NOT_CAPTURED`，不推定父0；全部同步子命令原码/信号、summary及后置无测试进程可复核。checker父exit0已实际捕获。

全部错误诚实保留：只读中途先查summary，noEmit尚未结束导致ENOENT、exit1（设施状态查询，非产品FAIL）；`rg`不可用exit127后改用grep/find，两个记忆路径不存在，不以平台记忆替仓库。原TaskTable key警告、MaxListeners以及清单回归卸载requestAnimationFrame设施警告仍在原stderr，reporter无新增失败；没有顺手修不属本批的页面/测试，也不声明无警告。没有其他新测试fixture失败或为转绿改业务expect。

## 5. 保护与证据

r1前后、delivery-r1延长、parent-r1延长：main完整输入/lib、A11/A12/A13/A14 lib hash+bytes+mtime漂移0；A14 src/全部原证根（含FAIL/loaded/conflict/stepwise/events/gateway）漂移0；A14专家plan/cases/run/check/report/原r1冻结与所有开发证据漂移0；七个实际依赖包及主/A14各三处共享cache漂移0。parent还保护完整本专家r1原证，漂移0。三个自有完整产品冻结运行前后漂移0，与主候选内容一致；仅自有测试/日志/cache/HOME/TMPDIR增加。

只读复核原A14 **515 source声明+453产物=968** 逐项hash，原loaded完整uncached combo SHA、唯一client段位置与SHA正确；原seq81仍送外改后base、seq82仍“已应用3步”，外改负责人仍被建议覆盖，原PC01 GUIFAIL没有洗掉。原GUI采集exit0不是产品PASS。此轮没有新build/bundle/宿主/PID/端口/浏览器上下文认领。

| 原始证据 | SHA256 |
| --- | --- |
| r1 commands.json | `c3e2055b19ebe724cad8ed18d09250616cbd26a767baad6cff13c13811220004` |
| r1 audit.json | `68202ec4a471471c2a39b610c95fec0060c6ec20a421d24fb07ed7d7ac4bf01f` |
| r1 protected-manifests.json | `5d59fd42dc89ddaf1f84e4f80adcc4bd389f58ec691a094f21a7ac822a879462` |
| r1 frozen-inputs.json | `922b136b280893b09219b6a569c23ad399a81e23d8577f8b479203491b70c671` |
| fixture-audit.json | `86391a88b01203d3b7eaa606d718db659ba273008f1c04b526254ed5a23058bc` |
| delivery-r1/delivery.json | `d5302f37e3e26b6d1630906850a0144542d3530aaa2b3a6c21eab870004772f7` |

保护仅限所列根，没有核全机/全间接依赖/正式资产/profile/上游或服务健康，不声称全机零污染；Main并行F02原证不在本专家写域，不改变其结论。

## 6. 交回与释放

本专家释放全部测试执行/自有冻结写锁；无产品写权、builder、GUI、端口/服务所有权，无在跑测试，不停Main/正式进程。原A14专家原件/两红/旧GUI、开发所有失败、新parent四红均保留。最终延长审计另存本前缀final-check，不覆盖旧记录。

由Main继续：

1. 按已授权确证修复流程派开发处理 EXT-BASE 父层四扩展初始收集，预计仅 `panel.tsx` baselineMap构造及同域真实父层测试；沿现有四类props收生成时updatedAt，不改schema/backend/model/数据，不新功能。本报告仅缺陷/建议，不替用户扩大开发文件ownership；新开发报备与独立复验继续按父任务授权处理。原四红必须转绿并重跑受影响回归，不能删断言。
2. Main唯一builder在新独立输出构建/全回归/noEmit/coverage及guard，通过后新实例+完整uncached下发；按原PC-G01..04采真实确认/冲突/四扩展/undo原证，另由专家审签。原PC01/PC02task限定SOURCE/AUTO结果可按输入和影响索引引用，但不签新GUI或整门。
3. 无关既有F02/治理/成长/矩阵可继续；EXT-BASE未闭、适用GUI/整门未签，不进入发布或以本报告统一commit。本专家未commit/push。
