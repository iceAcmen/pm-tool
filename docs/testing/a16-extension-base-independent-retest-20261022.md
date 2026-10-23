# A16 EXT-BASE 独立 SOURCE/AUTO 复验报告

> 2026-10-22，trae 独立测试专家，非开发。供 Main 接续新 A16 构建与独立 GUI 审证；只认领本报告冻结候选的有限 SOURCE/AUTO，不签全 RA、GUI、提交或发布。负责人原句与先行 Oracle 见[本次计划](a16-extension-base-independent-retest-20261022-plan.md)。

## 1. 有限结论

**EXT-BASE 修后 SOURCE/AUTO：有限 PASS。** 独立直接复制当前完整主树387个 src 文件及 scripts/package/lock/tsconfig/vitest，与开发 after-r2 全输入字节差异0。原 parent 四例不改 expect 重跑，完整修前386文件候选 **原exit1、0通过/4失败 → 新原exit0、4通过/0失败**。失败均是四扩展生成 base 缺键，控制/schema/显式提交已到达；新四绿不是删断言或更改产品。

**原 PC 四例严格 task-only 整表断言：原 FAIL 保留，Oracle 按有效扩展合同修订，不是产品缺陷豁免。** 新源码原件四例仍 `1/1/1/1`，均只因10键对象与2键对象不相等。独立核原 fixture 四扩展各两条均生产 schema 合法、属于 p-0001、初态/外改时原 updatedAt 不变。已批准收口计划与 RA-AI04/05 要求补收五类 existing base，历史 task-only 描述没有禁止扩展键。任务两键原值、原 needs、生成零 apply、TaskForm 外改、前置跳过和独立继续要求全部仍有效。

自有[新版 PC 用例](a16-extension-base-independent-retest-20261022-pc-cases.test.tsx) **只在 selectedBase 中逐项加入 m-0001/m-0002、ri-0001/ri-0002、dlv-0001/dlv-0002、mtg-0001/mtg-0002 的原 updatedAt**。其余全文与专家原件字节一致，既未删除/改写任何 expect，也未过滤 fixture、松成 contains 或测试文件特判。新版完整 A14旧源码四例均原exit1；修前A15四例亦均原exit1；新源码四例均原exit0。旧源码必要红仍在，原专家原件/reporter/失败和开发原失败从未覆盖。

独立新28项真实 PmPanel 父层反例、作者新23、A15独立23、作者9文件87、完整产品noEmit及原扩展fixture合法性1项均绿。未发现本有限接缝的实质业务守卫退化；不以旧 Oracle FAIL 冒充全自动绿。

**未签范围**：真实浏览器/宿主装载/新bundle、后端冲突拒写/业务落盘/undo clean-changed-mixed、RA-AI04/05整门及全部RA、提交/发布。原A14 PC01 GUI FAIL、PC02失败分支GUI NOT_RUN及历史产物保持原归属。本次没有新A16 lib/实例，不能借旧A13/A14产物宣称修复激活。Main并行无关F02不在本角色写域、不因本报告改变其结论。

## 2. 独立性与候选身份

本角色不参与开发、不改产品或产品冻结副本，只写本测试前缀及自有冻结/cache/HOME/TMPDIR/runtime。Main唯一builder/GUI；未fetch/pull在途脏树，未build/install/full verify，未写其他testing/livingdocs，未读凭据/profile/正式数据、未操作网络/GUI/服务，未commit/push。仅链接既有依赖，未加载vendor正文/installer。

HEAD=origin/main=`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不能代替脏候选。new完整直接主树冻结；old完整来自A15 parent-r1原冻结；另A14完整旧源码来自A15原独立old冻结，各自独立复制并逐文件字节核。old→new仅 `client/panel.tsx` 与新 `client/copilot-extension-baseline.test.tsx`，386→387；panel与开发修前相比，除baseline集合构造外全文一致。sidecar PC01/02源码未变，ask/core未变。

| 身份/证据 | SHA256 |
| --- | --- |
| 新panel | `fe58fff88560141bf6d6886c93b6e8a38b82f2ee5c1c6a23bb4059116f3d71ac` |
| 作者新测试 | `cef2f64f80a47f46be29a74357937547c783cb326d2aa14dc44f4e88ad74298e` |
| sidecar保留 | `7cf48821e7e6ee570288c385b59897fd33f8ab0ec32da42ef87111c2c016a269` |
| ask.ts保留 | `3db897be1275cbbc2473f73e8eb71bb061365a2ddd882008b33698972905bf26` |
| core/copilot保留 | `9059ab4de0c46398c180f24a9928f4b2de670fee5a2cdc5d317ea26e5a389c25` |
| 完整新输入manifest | `a16f30fbd20df21cdd9d5d8c1084223922f28eb8ba743a0de0f576ed48fa7a4d` |
| 本次candidate.json | `d953c012623a4f05a8e1e43c683d1705ef6f0d899c1056d1f84655961830d760` |
| tracked binary patch | `be49baaee1850b169933cce31fb27cf51675805fe9aeaa1a14a683f70e851360` |
| 新文件清单/指纹 | `7f8f675d53825b4c74e8a1b4ee9a1a14a557dc8a1ce619f4f76f693a73be79d2` |
| 32条原commands.json | `f3b1f813d2cbea01504618bd92bebb55d9ddd02d281681e97257fb39212d8efe` |
| before/after保护manifest（相同） | `ccf40a6e97621881538648fd88f8712f8ce0f4991e4945d6571f4e57e4794e5e` |
| 原PC专家原件 | `18093da170e61c626ee434abe1fb467fc7b68da0727e7b6edfdb0b8de149c0da` |
| 新版仅八键补入证明 | `25990b3f0617d2fcd89cd79e731a33b0a73929dcb1516b6aac911f065723e58d` |

各文件bytes/mtime见[完整新输入](a16-extension-base-independent-retest-20261022-selftmp/r1/new-inputs.json)；原位hash/bytes/mtime保护与复制跨目录时间表示分开。[候选](a16-extension-base-independent-retest-20261022-selftmp/r1/candidate.json)、[tracked patch](a16-extension-base-independent-retest-20261022-selftmp/r1/candidate-tracked.patch)、[新增输入](a16-extension-base-independent-retest-20261022-selftmp/r1/candidate-new-inputs.json)均实际落盘，不以HEAD/version代表未提交集合。

## 3. 运行与完整结果

环境macOS Darwin24.6.0 arm64，nvm Node22.23.3；既有pnpm11.28.5未调用。React/renderer18.3.1、Vitest2.1.9、Vite5.4.21、TypeScript5.9.3、Zod4.6.5。七包实际realpath及版本在candidate；既有依赖只读，单fork、min/maxWorkers=1、`--no-cache`、自有cacheDir。白名单PATH/HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME/CI/LANG/TZ/NODE_DISABLE_COMPILE_CACHE，测试另PC_INPUT/PC_OBSERVATIONS，不继承key/token。

主32子命令UTC `2026-10-21T23:21:21.404Z`–`23:23:09.265Z`（本地2026-10-22）。每子命令原exit/signal/精确argv/cwd/env/start/end/PID/stdout/stderr/reporter均保存于[r1 commands](a16-extension-base-independent-retest-20261022-selftmp/r1/commands.json)及同目录各command/result/log。额外第33条原扩展合法性命令见[oracle command](a16-extension-base-independent-retest-20261022-selftmp/check-r1/oracle.command.json)。skipped不算PASS。

| 命令组 | 原exit、实际执行项 |
| --- | --- |
| old-parent | `1`；0 passed/4 failed，原末尾undefined base断言 |
| new-parent | `0`；4 passed/0 failed，原expect不变 |
| A14 original PC-C01/C02/A01/A02，各单例 | `0/0/1/1`，原task两红；每次1 executed/3 skipped |
| 修前A15 original 四例，各单例 | `0/0/0/0`，PC01/02修复控制保留 |
| 新A16 original 四例，各单例 | `1/1/1/1`，每次1 failed/3 skipped，旧整表Oracle FAIL原样保留 |
| A14 revised 四例，各单例 | `1/1/1/1`，旧源码必要红保留 |
| 修前A15 revised 四例，各单例 | `1/1/1/1`，扩展缺键红 |
| 新A16 revised 四例，各单例 | `0/0/0/0`，全部原业务期望继续执行 |
| new-expert-parent | `0`；28/28，四扩展×两项目的初发/正常刷新原base/取消再生各8，以及四create既有base不造ID |
| old-expert-parent | `1`；0/28、28 failed，均断言性base差异，非装载/设施控制失败 |
| new-developer | `0`；作者23/23 |
| new-independent23 | `0`；A15独立23/23 |
| new-regression87 | `0`；9文件87/87 |
| new-noemit | `0`；完整冻结产品tsconfig `--noEmit --incremental false`，无产物；原tsconfig排除test，非全部测试类型检查 |
| OX01原扩展fixture合法性 | `0`；1/1，初态/外改八扩展schema/归属/原updatedAt、任务schema及外改时间差 |
| checker父命令、两脚本语法、git diff --check | 各`0`；审证通过不等GUI/整门 |

作者9文件完整名单：`client/shared/drawers/copilot-preconfirm.test.tsx`、`client/sidecar-minimize-retention.test.tsx`、`client/panel-checklist-toggle.test.tsx`、`client/panel-launch-handshake.test.tsx`、`client/provenance-panel.test.tsx`、`client/shared/task-draft-materials-stage.test.tsx`、`core/copilot-validate.test.ts`、`core/copilot-task-fields.test.ts`、`core/ask-projection.test.ts`。

实际入口（仓库根、macOS，重跑必须新rN，禁止覆盖原证）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a16-extension-base-independent-retest-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a16-extension-base-independent-retest-20261022-run.mjs freeze r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a16-extension-base-independent-retest-20261022-run.mjs run r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a16-extension-base-independent-retest-20261022-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a16-extension-base-independent-retest-20261022-check.mjs r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a16-extension-base-independent-retest-20261022-run.mjs final r1
git diff --check -- packages/dsh-pm-tool docs/testing/a16-extension-base-independent-retest-20261022-plan.md docs/testing/a16-extension-base-independent-retest-20261022-run.mjs docs/testing/a16-extension-base-independent-retest-20261022-cases.test.tsx docs/testing/a16-extension-base-independent-retest-20261022-pc-cases.test.tsx docs/testing/a16-extension-base-independent-retest-20261022-check.mjs
```

两个freeze/run父工具返回execution ID，未取得工具末态码，登记`NOT_CAPTURED`，不推定父exit0；32条同步子命令原码/信号完整保存、summary已完成。checker父exit0实际捕获；交回final父原码以实际工具结果为准。

## 4. 有效证明与失败保真

独立28项使用真实PmPanel/CopilotPanel、生产parse/validate/schema，设施与传输明确替身且apply固定0；既有五类各两条、每记录不同原时间，两项目都有完整合法数据。只通过真实刷新按钮传最新snapshot、父子props保持同实例；未给副驾直接塞base。四扩展在生成后最小化/正常刷新/展开仍传原10键，取消零apply/无undo请求，明确再生成才采新10键。正常更新时间/标题已出现在最新props，不用改产品副本或假自动再生成。此证明是SOURCE/AUTO传输合同，不是真后端/GUI接受。

原PC传输审计：C01一次三action且needs为 `[]/["s1"]/[]`；C02发送s1/s2/s3；A01正常TaskForm保存、同一子树与一次ask、首base保原task值；A02应用0只发送s1/s3且二次仍原base。完整原四件和新版原始传输/断言见[独立check](a16-extension-base-independent-retest-20261022-selftmp/check-r1/check.json)。

C02原fixture s1回放timestamp早于初态，未改原fixture；只判发送控制，不冒充本轮单调真实成功。独立23的IR-C01以及作者23中EB07/08用合法新初态、明确内存base比较和单调时间补证成功链/0应用依赖。23项亦覆盖五类只推进成功target、不洗白其他键、五种非确证应用/异常/重读错项目或缺目标、未勾选/编辑非法、取消再生/投影、旧/未来/无时点/延迟undo等；不扩大为后端落盘。

开发全部before-r1/after-r1/after-r2 reporter/commands/log、check-r1及final-r1均只读审计；after-r1作者21与after-r2作者23分别保留，旧原四Oracle两轮FAIL、vendor设施缺目录exit1及后续纠正0没有删除/覆盖。本专家不继承开发自验PASS。

工具/设施错误全部诚实保留：`rg`不可用exit127后改find/grep；两个既定记忆路径不存在exit1，以仓库为准；一次新文件patch不完整被工具拒绝、未落文件，随后完整重发。原TaskTable key/MaxListeners/requestAnimationFrame测试设施警告保持stderr，不顺手改其他模块。没有新增合法性/装载失败被改expect掩盖，也没有以父runner正常结束将产品必要红变绿。

## 5. 保护、交回与后续

主执行前后46个列明保护根hash/bytes/mtime漂移0，before/after manifest SHA相同；main全部包输入/lib、A11/A12/A13/A14 lib、A14完整src/全部原证、A14/A15专家原件及旧冻结、A16开发全部证据、七实际依赖与主/A14各共享`.vite/.cache/.vite-temp`、vendor锁件均保留。A14声明515source+453产物=968逐项hash一致，旧patch指纹/原FAIL未覆盖；三份完整冻结输入运行前后漂移0，新源与开发全字节仍一致。

最终延长保护、当前主树对新freeze字节、冻结原位mtime、33条精确子PID无残留、本报告/脚本/测试交回hash见[final-r1](a16-extension-base-independent-retest-20261022-selftmp/final-r1/final.json)，该文件的`released`才是最终资源释放记录。只核列明根，不声称全机/所有间接依赖/正式服务健康零污染；未停止Main或正式进程。

本角色交回后停止并释放本前缀测试执行/自有冻结写权，无产品写权、builder/GUI或服务端口ownership。有限SOURCE/AUTO签字只允许Main按既有父授权继续**另建新A16独立输出**，不是本专家替Main执行或签构建门。

Main下一步：唯一builder新A16输出构建/全回归/实例/uncached完整client绑定；按原PC-G01..04及四扩展update确认前正常外改/clean对照采证，另由独立专家审GUI、样式/UX及真实落盘。适用整门闭合前不借本局部PASS统一commit或发布；无关F02继续原派单，本报告不混旧A13归属。
