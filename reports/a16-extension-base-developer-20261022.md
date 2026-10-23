# A16 四扩展初始基线开发交回

> 2026-10-22，trae 开发角色。给 Main 和不同独立专家核源码与原始证据使用；不签 PASS，不构建、不执行 GUI，不扩大原 A15 限定 PASS。

## 状态与停止边界

修复候选已写回指定两文件。原 EXT-BASE 四例在自有完整源码冻结中由 **0通过/4失败、原exit1** 变为 **4通过/0失败、原exit0**。开发新增23项真实父层测试、原独立23项、作者9文件87项、完整产品noEmit均退出0。

**不能宣称全部自动化通过。** 原 PC-C01/C02/A01/A02 不改 expect/输入重跑，两轮均 `1/1/1/1`：旧 Oracle 将整个 base 精确等于仅两个 task 的字典，而原 fixture 实际还含当前项目四扩展各两条。授权补收五类后实际 base 有10键，两个 task 的原值没有改变，新增八键均为同项目已有记录的原updatedAt。四例分别失败于原件 L150/L163/L195/L204 的整表 `toEqual(selectedBase())`。这是需要独立专家裁定的 Oracle 与扩展合同冲突，**开发不改专家原件/expect，不过滤原fixture、不按测试文件特判，不把FAIL签成PASS**。

原始传输审计另证：PC-C01 首发三个action/needs正确；PC-C02发送s1/s2/s3；PC-A01正常TaskForm外改后首发仍送原task值；PC-A02应用0后只发送s1/s3。原PC-C02时间倒序fixture仍不作时间单调证明。新EB07/EB08在合法新初态、单调内存传输替身及丰富真实父层中分别验证成功链与0应用依赖行为。此补证不替代原四FAIL或独立判定。

开发按派单在交回后停止并释放 `panel.tsx` baseline构造、新测试及本报告前缀写权。由 Main 安排不同专家 SOURCE/AUTO 复验及 Oracle 裁定；此前不新A16输出、不借旧A14lib宣称已激活，不commit。Main独占builder/GUI，非重叠F02/导入工作不受本写域影响。

## 授权与改动

负责人原句：

> 限定开发关闭EXT-BASE四P1必要红，用户持续已授权全部既有未验功能收口/确证修复/独立分工/最后统一commit，不另审批、不push。读AGENTS/collab及docs/plans/2026-10-22-copilot-extension-base-closure.md、docs/testing/a15-preconfirm-independent-retest-20261022{.md,-plan.md,-parent-cases.test.tsx,-parent-run.mjs}与parent-r1原报告实际路径自行核。独占packages/dsh-pm-tool/src/client/panel.tsx仅baselineMap构造和新client/copilot-extension-baseline.test.tsx，reports/a16-extension-base-developer-20261022*；不sidecar/backend/TaskForm/schema/model/CSS/其他testing/livingdocs/build/install/GUI/services/credentials/commit/sharedlib/cache。Main唯一builder/GUI，当前main sidecar7cf48821...已独立PC01/02限定PASS，保原A14 lib/源/FAIL不覆盖。先自有完整src freeze及指纹、原parent四例不改expect复现4红，控制/schema合法。只将当前项目tasks/milestones/riskIssues/deliverables/meetings existing updatedAt收baselineMap，create不造旧基线，生成快照由sidecar沿已有openedAt保存。真实父层tests覆盖四扩展初发与正常props外改原base/取消再生成/项目边界，受影响原PC四/独立23/作者87/noEmit既有依赖--no-cache单fork白名单env自有HOME/TMP/cache全部跑。精确commands/reporters原exit、所有失败保留、保护oldlibs/source/专家原件hash+mtime。新源报告交回后释放，不自签PASS；Main不同专家复验才新A16输出。Main同时F02补证/导入，非重叠。

依据：AGENTS、collaboration §9/§11、[已批准计划](../docs/plans/2026-10-22-copilot-extension-base-closure.md)、A15报告/计划/parent-run及真实parent-r1。脏树在途，不fetch/pull，不install/build/full verify、不写livingdocs/其他testing，最后统一commit属于Main后续动作，不是本开发动作。

- `packages/dsh-pm-tool/src/client/panel.tsx`：唯一原行扩为五类已按selected过滤的数组合并，再取原id/updatedAt。保留既有视图类型断言及缺省空字符串兼容，不改schema/model。没有为create造ID/时点。
- `packages/dsh-pm-tool/src/client/copilot-extension-baseline.test.tsx`：真实PmPanel/CopilotPanel及生产parse/validate/schema；仅设施/传输替身。
- `reports/a16-extension-base-developer-20261022-run.mjs`、`-check.mjs`、`-selftmp/`及本报告：自有完整冻结、命令/reporter、保护和交回。无其他业务改动。

sidecar仍在生成回答时沿原 `setOpenedAt({...baselineMap})` 保存，最新props供只读投影；确认不自动洗白原基线。未修扩展独立stale提示、后端/schema/模型或任何其他功能。

## 候选与指纹

HEAD=origin/main=`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不以HEAD代表脏候选。before-r1直接冻结完整386个src文件及scripts/package/lock/tsconfig/vitest；after-r1/after-r2均从真实主树重新完整复制，不叠overlay。before→after-r2仅以下两source路径变化，386→387；运行前后冻结hash/bytes/mtime一致。

| 输入 | after-r2 SHA256 |
| --- | --- |
| panel.tsx | `fe58fff88560141bf6d6886c93b6e8a38b82f2ee5c1c6a23bb4059116f3d71ac` |
| 新测试 | `cef2f64f80a47f46be29a74357937547c783cb326d2aa14dc44f4e88ad74298e` |
| sidecar未改 | `7cf48821e7e6ee570288c385b59897fd33f8ab0ec32da42ef87111c2c016a269` |
| commands/ask.ts未改 | `3db897be1275cbbc2473f73e8eb71bb061365a2ddd882008b33698972905bf26` |
| core/copilot.ts未改 | `9059ab4de0c46398c180f24a9928f4b2de670fee5a2cdc5d317ea26e5a389c25` |
| candidate.json | `a6cf5640f35a3df1fc2b6c5c878a921834954dee854ef0264e84a9507b4af9a9` |
| tracked binary patch | `be49baaee1850b169933cce31fb27cf51675805fe9aeaa1a14a683f70e851360` |
| 新增输入指纹清单 | `7f8f675d53825b4c74e8a1b4ee9a1a14a557dc8a1ce619f4f76f693a73be79d2` |
| 完整冻结输入manifest | `a16f30fbd20df21cdd9d5d8c1084223922f28eb8ba743a0de0f576ed48fa7a4d` |
| 全部子commands.json | `a36d86830abf2b31b30bf90a24f03ed7017634ba3160d5b69a5d21539090e081` |
| before/after保护manifest | `91c8e4c18eeb8b5c2296985959f43d22f3818cda0f36f461c17f7b8852862f0d` |

原PC cases SHA=`18093da170e61c626ee434abe1fb467fc7b68da0727e7b6edfdb0b8de149c0da`，每副本原字节相同。指令中的`-parent-cases.test.tsx`不存在：实际parent-run读取`docs/testing/a15-preconfirm-independent-retest-20261022-expansion.test.tsx`；已与真实`-selftmp/parent-r1/frozen/docs/testing/`副本逐字节核一致，并核原command exit1、reporter四失败。不替换原parent-r1。

## 验证记录

环境：macOS Darwin24.6.0 arm64，nvm Node22.23.3，项目既有pnpm11.28.5（未调用）；既有React/renderer18.3.1、Vitest2.1.9、Vite5.4.21、TypeScript5.9.3、Zod4.6.5。依赖只读链接A14依赖入口，七实际包路径/版本见candidate.json，无install。自有HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME，白名单PATH/CI/LANG/TZ/NODE_DISABLE_COMPILE_CACHE，测试仅额外PC_INPUT/PC_OBSERVATIONS。不继承key/token。

每次Vitest均 `--no-cache`、自有cacheDir、单fork、min/maxWorkers=1、verbose+JSON reporter。每子命令精确argv/cwd/env/start/end/原exit/signal/PID/stdout/stderr保存；不以父runner预期红复现exit0替代产品exit1。

| 实际命令组 | 原exit及执行结果 |
| --- | --- |
| before-r1 parent原四例 | `1`；0通过/4失败，均最后`undefined`基线断言；schema/计划/非空props/生成零apply/显式一次apply控制均到达 |
| after-r1、after-r2 parent原四例 | 各`0`；4/4通过 |
| after-r1开发新增 | `0`；21/21；原记录保留 |
| after-r2开发新增 | `0`；23/23，EB01五类首发、EB02生成后正常刷新原base、EB03取消再生成、EB04四create空base、EB05项目过滤、EB06生成前刷新、EB07/08丰富父层任务链 |
| 两轮原PC-C01/C02/A01/A02，各单例 | 各`1/1/1/1`，每次1失败/3skipped；旧整表task-only Oracle冲突，skipped不算通过 |
| 两轮原独立23项 | 各`0`；23/23通过，不冒充本开发独立审签 |
| 两轮作者回归 | 各`0`；9文件87/87通过 |
| 两轮完整产品noEmit | 各`0`；`--noEmit --incremental false`，无产物；原tsconfig排除test，不声称测试文件全量类型检查 |
| 两轮冻结内vendor-static | 各`1`；冻结无vendor目录的设施路径失败，未篡改vendor，原日志保留 |
| check-r1原仓库只读vendor-static纠正 | `0`；原仓库同一静态脚本认领实际vendor，详精确command/log |
| check-r1原证/候选审计 | 父exit`0`；原四FAIL/丰富首base/task值/两发送序列保留，不等全测试绿 |
| 两脚本node --check、指定文件git diff --check | 各`0` |

9文件完整名单：`client/shared/drawers/copilot-preconfirm.test.tsx`、`client/sidecar-minimize-retention.test.tsx`、`client/panel-checklist-toggle.test.tsx`、`client/panel-launch-handshake.test.tsx`、`client/provenance-panel.test.tsx`、`client/shared/task-draft-materials-stage.test.tsx`、`core/copilot-validate.test.ts`、`core/copilot-task-fields.test.ts`、`core/ask-projection.test.ts`。

实际入口（仓库根；重跑必须新rN/check-rN/final-rN，禁止覆盖）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check reports/a16-extension-base-developer-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a16-extension-base-developer-20261022-run.mjs before r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a16-extension-base-developer-20261022-run.mjs after r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a16-extension-base-developer-20261022-run.mjs after r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check reports/a16-extension-base-developer-20261022-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a16-extension-base-developer-20261022-check.mjs check-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a16-extension-base-developer-20261022-run.mjs final r1
git diff --check -- packages/dsh-pm-tool/src/client/panel.tsx packages/dsh-pm-tool/src/client/copilot-extension-baseline.test.tsx reports/a16-extension-base-developer-20261022-run.mjs
```

before/after三父runner工具返回execution ID，未取得工具末态码，登记`NOT_CAPTURED`，不推定0。全部同步子命令原码/信号/summary已落盘；两after的`executionExpected=false`真实保留。run脚本后续只纠正静态校验入口、终检映射类型断言及终检字段，未重写先前任何日志/reporter。check-r1工具父exit0已捕获。

原始证据入口：[before-r1](a16-extension-base-developer-20261022-selftmp/before-r1/summary.json)、[after-r1](a16-extension-base-developer-20261022-selftmp/after-r1/summary.json)、[after-r2](a16-extension-base-developer-20261022-selftmp/after-r2/summary.json)、[23项开发reporter](a16-extension-base-developer-20261022-selftmp/after-r2/developer.result.json)、[23项原独立reporter](a16-extension-base-developer-20261022-selftmp/after-r2/independent.result.json)、[87项reporter](a16-extension-base-developer-20261022-selftmp/after-r2/regression.result.json)、[完整commands](a16-extension-base-developer-20261022-selftmp/after-r2/commands.json)、[纠正与原传输审计](a16-extension-base-developer-20261022-selftmp/check-r1/check.json)。

## 保护与未覆盖

三轮运行前后，主包全部输入/lib、A11/A12/A13/A14 lib hash/bytes/mtime漂移0；A14完整src、全部A14原证根（含原FAIL/loaded/events/conflict等）、专家原件及原r1/parent-r1/final-r1/final-r2/delivery-r1漂移0。原A14声明515source+453产物=968项hash仍一致。七实际依赖包、主/A14三类共享cache、mattpocock vendor原件漂移0。每轮冻结全部输入漂移0；最终延长核验以本前缀final.json为准。

最终交回索引：[final-r1/final.json](a16-extension-base-developer-20261022-selftmp/final-r1/final.json)。终检重新比较原位hash/mtime、实际主树与after-r2全部冻结输入、panel除baseline构造外全文一致，并锁本报告/两脚本交回hash。逐个核三轮记录的精确子PID；`ps`无此PID时原exit1是终检空列表，不是产品失败；详同目录`process-check.command.json`。终检的`released`只表示写域/证据可交回，不是测试PASS或发布放行。

保护仅限列明根，不声称全机/所有间接依赖/正式资产/profile/服务健康零污染。未访问凭据、正式数据、服务/GUI；无新lib/bundle/实例/端口/浏览器上下文。本轮不能证明真实后端冲突拒写、GUI清洁对照、undo落盘、RA整门或发布；原A14 FAIL/原产物和A15限定结论仍保留。

所有失败/警告保留：不存在的parent-cases及两个记忆路径读取exit1；rg缺失exit127后改grep/find；一次定位未到达的PC-A02标记grep无命中exit1，不当产品结论。原TaskTable key警告、MaxListeners及清单回归requestAnimationFrame设施警告均留stderr，不顺手改其他模块。静态vendor缺目录两次exit1及四Oracle红两轮未删除。

Skills：阅读brainstorming/writing-plans，仅采用已批准有限方案与原红绿顺序，不新审批/计划/commit。mattpocock锁定`49dd158d1076134a641b33efb035946536778336`，全部manifest文件SHA一致；trivial模式补集合不强行加载grill/tdd，delivery只读code-review参考并按标准/合同自查，无setup/installer或全局写。没有可用子代理编排，不伪称该参考为独立双角色审签；不同专家复验仍交Main。

## Main 接续

1. 不同专家只读真实完整新候选，在自有新冻结复验原parent四、新父层23、独立23、87及noEmit，裁定原PC四整表Oracle是否需更新合同；由专家落新测试原件/理由并保留旧FAIL，开发不自行变更Oracle。
2. 适用SOURCE/AUTO独立放行后，Main唯一构建新A16输出/全回归及新实例、完整uncached client绑定；随后按原PC-G01..04和四扩展update确认前外改/clean对照采GUI原证，另专家审签。
3. F02/导入非重叠继续；全部既有积压适用门闭合后由Main最后统一普通commit，不push。本开发不以局部修复撤销停止条件或提前提交。
