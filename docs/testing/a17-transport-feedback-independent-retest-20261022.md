# A17 明确 catch 修后独立 SOURCE/AUTO 复验

> 2026-10-22，trae 独立测试专家，非开发。给 Main/开发/接续专家核候选与残余缺陷；仅审签本次完整 SOURCE/AUTO，不签新故障 GUI、整门或 commit。原失败与新失败均保留。

## 1. 结论与残余缺陷

**原 TF-F 五红已独立转五绿；本批完整 SOURCE/AUTO 结论仍为 FAIL。** SOURCE 文件范围与完整候选认领 PASS，原控制/回归有限 AUTO PASS；新增独立反例 20 项为 **19 PASS / 1 FAIL**。GUI **BLOCKED / 未审签**，整门未放行。独立执行已终检释放，不修改产品补绿。

### A17-TF-X08：明确 catch 的原因内容仍可反转为成功

严重度 **P2**，属于既有“明确 catch 必须错误呈现、保原因全文”的未闭合边界，不是新增英文关键词政策，也不是要求刷新失败改变写入结论。

最小合法 fixture 是普通 `Error`，其 message 为收到的正文记录，正文内成功片段由生产 `buildSuccessEnvelope` 构造：

```text
Response parsing failed; received text follows:
[pm:summary]任务｜t-0001｜Failed delivery
[pm:detail]
{"id":"t-0001","title":"Error register"}
```

真实 `PmPanel` → `TaskTable.run(line, { quiet: true })`，先 pending、重复提交返回 false，再 reject 此 Error：

- 已验证：实际 catch 返回 false、busy 解锁、只有 `web snapshot` 与一次 `task update t-0001 {}`，没有 refresh/重发；`ResultCard.message` 仍为完整 `执行失败：` + 原全文。
- 实际生产分类：`structured=true`、`isError=false`、`autoDismissMs=3000`，摘要仅保成功片段；真实 JSX 树 **结果卡节点为 null**，没有预期的持久 alert。
- 原失败为 **`expected undefined to be 'alert'`**，不是导入/编译/fixture 缺失；原 exit1、失败 reporter 和失败前完整状态保留。
- 失败在第一个错误卡断言停下，后续全文显示/复制断言 **未执行**，不能将其记 PASS。已观测无错误卡入口，但不伪称执行过不存在的复制按钮、不伪称浏览器 toast/颜色或真实网络发生了该报错。

原因索引（只读分析，不是改动授权）：`panel.tsx:824` 仍把原因转成字符串；`ui-feedback.ts:91` 任一行 summary 标记即可判结构化，`:169` 将所有结构化串直接判成功；`:185-190` 与 `result-card.tsx:24` 在无 action/path 时不呈现卡。中文前缀没有带独立于正文的错误上下文，故不能覆盖这个接缝。

这不改变原 TF-F 五个 expect，也不否认合法成功信封的“失败 / Failed / Error”应保持成功。本反例仅把同样的内容放进**已确定失败的 catch 原因**，要求失败原因不被正文标记反转。没有要求扫成功标题、清洗/删掉原因标记、改 backend/API/refresh。

原始证据：[独立反例](a17-transport-feedback-independent-retest-20261022-cases.test.tsx)、[失败 stderr](a17-transport-feedback-independent-retest-20261022-selftmp/r1/independent-counterexamples.stderr.log)、[完整 reporter](a17-transport-feedback-independent-retest-20261022-selftmp/r1/independent-counterexamples.result.json)、[观测](a17-transport-feedback-independent-retest-20261022-selftmp/r1/independent-counterexamples.observations.jsonl) 中 `TF-X08-before-assertion`。

## 2. 授权、候选与 SOURCE 审证

负责人原句完整保存在[先落计划](a17-transport-feedback-independent-retest-20261022-plan.md#授权)。已读 AGENTS、collaboration §9/§11、原 A17 合同/plan/cases/run/r2 原五红、批准的 transport-error-feedback-closure 计划、开发报告/run/check/close-check 与完整 selftmp。只写本 testing 前缀，未 fetch/pull 在途脏树、未 install/build/full verify、未写 livingdocs/其他 testing、未 vendor/installer、未 GUI/services/credentials/commit。

不同于开发自验，本轮另建自有 **完整当前主树** 冻结，不借 A16 freeze 执行测试：

```text
/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/a17-transport-feedback-independent-retest-20261022-selftmp/r1/frozen
```

HEAD/origin 均 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不单独代表 dirty 候选。冻结完整 `src/scripts/package.json/pnpm-lock.yaml/tsconfig.json/vitest.config.ts`，388 源文件；与开发 after-r2 **全部产品输入逐文件内容一致**。tracked diff/new-input 清单包含他人在途成果，仅认领候选、不夺取归属。

| 对象 | SHA256 |
| --- | --- |
| 原 panel / A16 panel | `fe58fff88560141bf6d6886c93b6e8a38b82f2ee5c1c6a23bb4059116f3d71ac` |
| 当前修后 panel | `e0918704df4a308028a0a89c742c11421b787d3e18655c830d9b887213fa34fc` |
| 开发新测试，6629 bytes | `24fc128f15f27417baf8b4b3d04718f237fa77a08a91569c44464cb447ca371c` |
| 完整 frozen-inputs manifest | `7abc537324d531a58a75bc1bbae26b8b1b7886cd52b8519c54bbd71a33babc29` |
| tracked binary diff | `3c16463427f3c55aed147075efb800ee0c9eec7cb645ae61c5118cbef6519744` |
| 新产品输入清单/指纹 | `3db993fd88b0a12ef02aefdbb0f54fe4d5229eb2c76e6828a86f7ac5041277a2` |
| 新独立反例，11523 bytes | `81aa3fc67b117824572039f33c1e4c0f8727b1869a24cb6bf5a55580f19b4bf1` |

认领细节：[candidate](a17-transport-feedback-independent-retest-20261022-selftmp/r1/candidate.json)、同目录 `candidate-tracked.patch` / `candidate-new-inputs.json` / `frozen-inputs.json` / `source-at-freeze.json`。

独立整份文本替换校验：旧 panel 仅 run catch 原 `setMessage(error instanceof Error ? error.message : String(error))` 换为 `setMessage(prefixFeedbackOnce('执行失败', error))`；**其他全部字节不变**，尤其 A16 五类 extension baseline、refresh、ResultCard/classifier/CSS/API 未改。旧完整输入与修后完整输入只有此 panel 和新增开发测试两项差异；原专家 TF 测试与原 r2 冻结逐字同一 SHA，开发三轮复制件也相同。

## 3. 独立实际执行结果

环境：macOS Darwin 24.6.0 arm64，Node 22.23.3；既有 pnpm 11.28.5 依赖但未运行 pnpm。React/react-test-renderer 18.3.1，Vitest 2.1.9，Vite 5.4.21，TypeScript 5.9.3。依赖实际解析到既有 `/private/tmp/pmtool-all-closure-20261021/.../.pnpm`，只读使用。

所有 Vitest：node 环境、`--no-cache`、`cache:false`、单 fork/1 worker；每条 HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME 与 cacheDir 独立在自有 r1。白名单 env 为 PATH/HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME/CI/LANG/TZ/NODE_DISABLE_COMPILE_CACHE，测试额外仅 TF_INPUT/TF_OBSERVATIONS/PC_INPUT/PC_OBSERVATIONS，不继承凭据；fixture 禁 fetch。只提供宿主 execute/clipboard/FileReader/最小 browser globals，未 mock PmPanel/TaskTable/ResultCard/classifier，不自建状态模型。

| 命令 ID | 原 exit | passed / failed | 有限判定 |
| --- | --- | --- | --- |
| `success-control` TF-C01/02 | 0 | 5 / 0 | PASS，成功含失败/Failed/Error 不误红 |
| `explicit-context-control` TF-C03 | 0 | 5 / 0 | PASS，原五错误原因前缀能力控制 |
| `original-five-retest` TF-F01 | 0 | 5 / 0 | PASS，原 r2 exit1/五红 → 同原 expect 新五绿 |
| `recovery-control` TF-C04 | 0 | 2 / 0 | PASS，CSV/XLSX busy/失败保同预览/明确 retry |
| `existing-regression65` | 0 | 65 / 0 | PASS，原六文件原样复跑 |
| `developer-transport14` | 0 | 14 / 0 | PASS，开发同域原件独立执行 |
| `independent-counterexamples` | **1** | **19 / 1** | **FAIL，TF-X08** |
| `revised-pc4` | 0 | 4 / 0 | PASS，已修订 PC oracle，不倒签旧 A14 oracle |
| `expert-extension28` | 0 | 28 / 0 | PASS，真实父层扩展 |
| `parent-extension4` | 0 | 4 / 0 | PASS，原父层四必要用例 |
| `independent23` | 0 | 23 / 0 | PASS，A15 原独立组 |
| `developer-extension23` | 0 | 23 / 0 | PASS，既有同域扩展 |
| `affected-regression87` | 0 | 87 / 0 | PASS，九文件受影响回归 |
| `panel-and-import-regression53` | 0 | 53 / 0 | PASS，八文件额外回归，合法 board fixture 已复制 |
| `noemit` | 0 | 编译无诊断 | PASS，完整原 tsconfig，不 emit |

TF 四过滤组 pending 为 12/12/12/15，分别是同一文件其他组未执行，**不是 PASS**；四组均已分别执行。非过滤组 pending0。多个组有重叠用例，不把表内 passed 相加当独立用例总数。新反例组 failedSuites1 来自 TF-X08 断言失败，非 import 设施失败。

19 个新绿覆盖：五类 unknown × 普通/quiet 的原转换/全文复制/持久/false/解锁/重复阻止/同命令 retry，长多行 Error 全文及关闭不重发，两种旧复制 resolve/reject 晚到不污染新 catch，当前复制拒绝不假成功，catch→成功信封→catch 的 role/详情/复制代际，纯成功短提示 3 秒与错误持久，三种已有场景前缀不重复。quiet 成功保持既有 quiet 策略，未新增“清旧全局消息”的政策。

TF-C04 原 CSV/XLSX replay 取原 r2/A15 输入，真实父子组件仍同帧双点只一请求、三控件禁用、失败保同预览/局部 alert、解锁、无提前 refresh/重复执行，明确 retry 同一 confirmLine 后才收起；只证明 SOURCE/AUTO 链，不证明真实后端事务/落盘/原生 chooser。

## 4. 原失败、命令与哈希保真

独立审证原专家 r1/r2 与开发 before-r1/after-r1/after-r2 **所有原 commands/reporter/stdout/stderr**；每个原冻结完整输入 bytes/hash/mtime 再核一致，原 A15 索引 604 文件 bytes/hash 再核一致。原必要红的五个 fullName 与新五绿逐项一致，原失败全为 `expected 'status' to be 'alert'`。没有在修后树回改 catch 来制造旧红。

保留且未豁免：原专家 r1 成功 fixture 三红；原专家 r1/r2 五必要红；开发 after-r1 额外组 exit1/44绿/套件失败1（board fixture ENOENT）；开发原跨主树/复制树 mtime 错比较工具失败及更正原件。既有 after-r2 绿不是独立结论，本次另执行得到表内结果。原 A14 tasks-only oracle、A15 P2/漏 trace/实际故障窗口结论未覆盖。

完整审证：[original-audit.json](a17-transport-feedback-independent-retest-20261022-selftmp/r1/original-audit.json)，SHA256 `c36f0d09cc17c5643400bc4a50e81055be13c0d087f9b2f009429676cfbd5f42`；终检又读全部原件到 `final-r1/original-audit-final.json`。

本轮每条精确 argv/cwd/env/start/end/PID/原 exit/signal 在[commands.json](a17-transport-feedback-independent-retest-20261022-selftmp/r1/commands.json) 与各 `<id>.command.json`；stdout/stderr/JSON reporter/观测全原样保留。SHA256：

| 证据 | SHA256 |
| --- | --- |
| commands.json | `fa4bf2a83cdd49d4a4d1a60e237ce70cdcc937f24ea977cb3a1bdf5a0b5205c6` |
| summary.json | `051d3d0fd50b730a4f14d9ecd589d8dd16b92900b0f8158dcc6a74c8641392c2` |
| 独立反例完整 reporter | `5df8abf47b2c873f774e1415052b240d53022b7f216fccfd02d5d4a9ae702e5d` |
| 独立反例 stderr | `5dbf2946cc77c135dbc2d44af6ecc34e32f88a6fcaba213727fb3e91fc4e663c` |
| 独立反例观测 | `5a5fdda753105d75a79291f0beb01d608d9ba82e1d9b43b0d74b94f027b8d729` |

实际入口，仓库根、macOS + 上述 Node：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a17-transport-feedback-independent-retest-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-independent-retest-20261022-run.mjs freeze r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-independent-retest-20261022-run.mjs run r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-independent-retest-20261022-run.mjs final r1
```

上述原 exit 分别 **0 / 0 / 1 / 0**。run 原1保留新增失败；final 原0仅表示终检/释放成功，不覆盖 AUTO FAIL。执行器拒绝覆盖旧轮次，接续不得原地覆盖这些证据。

noEmit 原 argv 的真实工具为 Node + 既有 `typescript/bin/tsc --project <完整冻结包>/tsconfig.json --noEmit --incremental false`，见 `noemit.command.json`。按原 tsconfig 完整生产源编译，原测试 exclude 不变；不是 build、未写 lib。

## 5. 保护与释放

[final-r1/final.json](a17-transport-feedback-independent-retest-20261022-selftmp/final-r1/final.json)：

- `protectionOk=true`、`sourceMatches=true`、`noRecordedChildren=true`、`released=true`；`automaticPass=false`。释放不等验收通过。
- 290 个声明保护根有重叠，不当作独立文件数。保护当前完整产品输入/主 lib、A11..A14 lib、A16 原完整 tree 输入/lib/声明 artifacts、相关 A11..A17 原专家产物、自有 plan/run/cases、完整开发报告与 selftmp、实际两处 node_modules 全树及既有声明共享 cache。前后无新增/删除/内容/mtime 漂移；自有完整冻结和复制测试也无漂移。
- 主树与 `source-at-freeze` 同域 mtime 核，自有冻结与其自身 manifest 同域 mtime 核，不把复制时精度差当产品变化。完整保护清单/前后指纹在 `protected-before.json` / `protected-after.json` / `final-r1/protected-after.json`；只对已列根下结论，不宣称全盘零写。
- A16 实际 tree `/private/tmp/pmtool-a16-closure-20261022` 的 panel 仍 fe58、原 lib 和声明 sourceHashes/artifacts 无漂移。**3247 原实例未访问/重启/操作**，正式/旧服务、profile、上游、业务数据与凭据未动。
- Main 持续增加的 A16/新 extensions GUI 原证及 runtime 不列零写根，不复制或覆盖，不把 Main 合法追加证据误记本角色污染。该旧实例不能证明新 catch 生效。
- 所有测试与采集子 PID 精确查询已不存在；`process-check.command.json` 原 exit1/stdout 空为 ps 的“无这些 PID”，不是产品失败。未杀服务或其他进程。

## 6. 交回与下一步

本角色仅新增本前缀 plan/run/cases/完整 selftmp/报告，非开发，没有修改产品或独立原 expect，没有 build/install/GUI/服务/凭据/共享输出/commit。资源交回 Main；本轮 SOURCE/AUTO 的失败审签已完成，不等待或自修产品。

**Main 先将 TF-X08 交限定开发修复或作明确范围处理，再由不同独立专家复验。** 修复约束仍是明确 catch 的错误上下文不能被原因正文标记反转，保 Error.message/String(error) 原文、合法成功信封/原五绿/quiet/复制/重试，不广扫成功关键词、不改 refresh/backend/API。本报告不自动授权改共享 classifier/ResultCard/CSS；若确需扩大产品接缝，由 Main 明确新文件范围与受影响测试合同。

原五绿与无退化回归只能有限保留，**不能据此把当前完整 AUTO 失败候选放行给新故障 GUI/整门**。Main 当前 A16 原 candidate/四扩展 GUI 可继续，不倒签修后 catch。独立修后通过后 Main 再作为唯一 builder 另建新 A17 输出，不覆盖 A16/lib；认领新实例与实际下发，按原 A15/TF GUI 合同补原 CSV/XLSX actual fail/retry、完整 argv/原文/落盘与失败窗口证据。

本轮未新浏览器实测、computed style/颜色/读屏、原生 chooser、真实故障后端或事务验证；这些仍未审签，不能以 JSX/离线绿或旧 A16/3247 页面替代。旧 A15 失败/证据缺口、全适用积压整门、最后统一 commit 门保留；无 commit/push/tag/发布/正式切换。
