# A19 Main 完整回归原证有限独立审证

> 2026-10-22，平台 trae，独立原证审证角色，非开发、GUI、builder。供 Main 按固定候选接续；仅判定本报告列出的 AUTO 原结果、来源继承及保护，不签整功能、GUI、总门、提交或发布。

## 1. 有限结论

**Main 本轮 AUTO 原结果一致性：有限 PASS。A19 已签 SOURCE/AUTO 的产品输入继承：有限 PASS。声明范围内 531 源输入、453 最终产物及限定保护：有限 PASS。**

**一条扩义说明 FAIL**：candidate 的五个 `inheritedLauncherProbeInputs[*].reason` 声称 “Actual Launcher run includes these”，但原 Launcher 命令显式选择九个当前测试文件，静态导入图没有进入五旧 probe，原 TAP 为当前 **56/56**。五件的保存、来源和字节绑定均成立；不得把来源存在写成本轮执行。本审证不修改 candidate，也不据此把当前 56 项实际绿判红。

**历史缺件的扩展证明 BLOCKED / NOT_CAPTURED**：首 build 依赖前后、构建产物前后、父执行退出及原封候选错误完整退出原件，不由最终空漂移数组补造。已有原子阶段退出和最终字节认领可以有限使用，不等这些缺件也已捕获。

本角色不再派单，不重跑 190 项 SOURCE/AUTO，不重审 A18 全件，不操作 Main 3249/PID86987 或另一个专家的 GUI。源码静态、唯一输出不变，最后普通 commit 沿 Main 已获持续授权及其他门另处理；本角色不执行 commit。

## 2. 依据与对象

适用 `AGENTS.md` §6A、`docs/collaboration.md` §9、§11.3/11.5/11.6；具体授权以本次“仅写自身审证前缀，禁 build/测试重跑/GUI/服务/commit”的派单及后续“Main 已接续，保持主源/依赖静态”确认覆盖通用开工流程。本次不 fetch/pull、install/build、更新 livingdocs 或其他 testing。

Main [10:12 执行接续](../../reports/all-pending-acceptance-execution-20261021.md#2026-10-22-1012-a19新候选全回归关联gui交审与材料组合闭门)仅作导航；判定来自原 argv/cwd/env/PID/退出、stdout/stderr、manifest 和实际文件，不以接续摘要增加独立证据。

| 认领对象 | 值 |
| --- | --- |
| 基线，仅基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` |
| 唯一输出 | `/private/tmp/pmtool-a19-closure-20261022-r2` |
| [candidate](../../reports/all-pending-evidence-20261021/A19/candidate.json) SHA256 | `e6ae8366eeaae4293d4d960cfe4002bf249b10f148aad13f97eecdb28fee25d7` |
| [已签独立报告](a19-habit-suggestion-okr-independent-retest-20261022.md) SHA256 | `b3dd111b4e8650858b22c6d94c71eaa759c6fb828b4c081bf9b47ddb24442044` |
| `habits.tsx`，15422 bytes | `f8434485002b4b6aab494655ee31613c7caec15a9a4a5a3e9b87568f07f766f3` |
| 新同域 test，5036 bytes | `8d7220cff8f01ed9d43dd00d1e59584936f4aa7ed68612aa40b56f00ca7cc709` |
| [产品 tracked patch](../../reports/all-pending-evidence-20261021/A19/product-tracked.patch) SHA256 | `f50844acb9a0aa7a74c796a71431bd856d2f1e022fc9dfc117b0c17474dc99e2` |
| [new-inputs](../../reports/all-pending-evidence-20261021/A19/new-inputs.json)，32 件 | `200408c53cc7da4e0c4a5195171967ac75b6158c0212a1f5f683bf6177cee930` |

[source-auto-handoff](../../reports/all-pending-evidence-20261021/A19/source-auto-handoff.json)与 candidate.approval 结构相等，报告 SHA 和两个签署源 SHA 实核一致。作者502输入、独立508输入中的**共同502件**全部与本候选相同；本报告只继承已签有限产品结果，不把两个报告测试数累计成额外执行。

独立508中另六件不在 candidate.sourceHashes：README、.gitignore、workspace、tsconfig.core 四件在 r2 且字节相等，两件说明文档在 r2 缺失。实际 tsconfig 不 extends tsconfig.core，两个说明文档非本次编译/测试输入；不称508全树相同。逐件差异见[自有补充核对](a19-full-regression-evidence-review-20261022-supplement.json)。当前 `git diff --binary -- packages/dsh-pm-tool launcher` 原 exit0，全文 SHA 与 candidate.trackedPatchSHA 相同。

## 3. 原命令与退出

环境：macOS darwin/arm64；执行路径固定 Node `v22.23.3`，pnpm 固定现有 `11.28.5`。白名单 env、独占 HOME/TMPDIR/XDG_CACHE_HOME、`NODE_DISABLE_COMPILE_CACHE=1`；原 Vitest `--no-cache`、单 worker。不把本审证时点当原执行环境重新测试。

下表是**已经发生的原命令**，本角色没有再执行。`NODE=/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`；`PNPM=/Users/bytedance/.cache/node/corepack/v1/pnpm/11.28.5/bin/pnpm.mjs`；`PKG=/private/tmp/pmtool-a19-closure-20261022-r2/packages/dsh-pm-tool`。原完整路径/env/时点及输出指纹保存在[自有 audit 的 nine-original-exits](a19-full-regression-evidence-review-20261022-audit.json)。

| 阶段 | 原 argv，变量展开见上文 | 原 PID / exit | 原结果 |
| --- | --- | --- | --- |
| pnpm 版本 | `$NODE $PNPM --version` | 84829 / 0 | stdout `11.28.5` |
| noEmit | `$NODE $PKG/node_modules/typescript/bin/tsc --noEmit` | 84830 / 0 | 全生产 tsconfig，输出为空 |
| tsc | `$NODE $PKG/node_modules/typescript/bin/tsc -p tsconfig.json` | 84857 / 0 | emit 到新 lib |
| tsdown | `$NODE $PKG/node_modules/tsdown/dist/run.mjs --config tsdown.config.ts` | 84879 / 0 | 六个 bundle/map，Build complete |
| 补夹具后 coverage | `$NODE $PKG/node_modules/vitest/vitest.mjs run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` | 85516 / 0 | 150 文件/1563 测试 |
| guard | `$NODE scripts/verify-isolation.mjs` | 85964 / 0 | 95/95，污染0 |
| guard selftest | `$NODE scripts/test-isolation-guard.mjs` | 86170 / 0 | WATCH/增改删/缺失语义 |
| Launcher test | `$NODE $PNPM test` | 86171 / 0 | 九当前文件，56/56 |
| Launcher verify | `$NODE $PNPM run verify` | 86215 / 0 | 隔离假监听者 verify PASS |

前七条 cwd 为 PKG，最后两条 cwd 为 `/private/tmp/pmtool-a19-closure-20261022-r2/launcher`。构建四项的原件在 [build-r2](../../reports/all-pending-evidence-20261021/A19/build-r2/)，补件后五项在 [build-fixture-supplement](../../reports/all-pending-evidence-20261021/A19/build-fixture-supplement/)；各 `*.running.json` 与 `*.exit.json` 共同字段相等，candidate.rows 与退出原件逐项结构相等，九项原 exit0 不是据 stdout 推算。

### 3.1 构建配方

原 [r2 builder](../../reports/all-pending-evidence-20261021/A19/build-final/pmtool-a19-build-20261022-r2.py)执行 package.json 的完整构建语义：复制 scaffold 时排除 lib，新目录拒绝覆盖；Node 直入 TypeScript tsc；复制 panel.css、views/*.css、board/*.css 到对应 lib；Node 直入 tsdown 原配置。13 个 CSS 源/目标逐件 SHA 相等，[build-css.json](../../reports/all-pending-evidence-20261021/A19/build-r2/build-css.json)与实际配方一致。新树无旧 lib，因此原配方 `rm -f lib/client.*.js lib/client.*.js.map` 的旧块清理无对象，不是遗漏 tsc/CSS/tsdown 的简化构建。

pnpm 仅用于版本和 Launcher 两条脚本；插件 noEmit/build/coverage/guard 全是固定 Node 直达入口，不经旧共享 `.bin`，无 installer/install。tsdown 原 stdout 为0.15.10/rolldown1.0.0-beta.44；本报告认原命令、原成功退出和最终产物，**不声称未捕获的构建前后字节清单已存在**。

### 3.2 coverage 与 guard 范围

逐项解析原 coverage stdout 的测试文件行，与冻结 `src/**/*.test.ts(x)` 实际发现集等集合，150件无遗漏，逐文件测试数合计1563；非只抄总数。coverage-summary 与原文字表一致：lines/statements89.4%、branches82.41%、functions85.89%。coverage **只计 settings/copilot/progress-derivation/gantt 四模块**，不是全产品或新 habits 的全量覆盖率；原阈值40/80/35/40全满足。

95 guard 实际 `>>`发现集、逐目标 `ok ... 退出码=0` 集合，与脚本目录默认发现集完全相等；仅排自身及非确定性 `verify-real-model.mjs`。原累计输出 `95/95/0`，包括更新后两个接口断言与相关 helper，未用旧93/95替换。完整95清单在自有 audit 的 `guard-95-and-five-sentinels`。

**before=5/after=5 是五个缺失根哨兵，不是五个真实文件**：r2 的 data/packages-backups/packages-backup/exports/assets 全缺失，guard 按实现计 `!!MISSING` 五条，污染0只覆盖这五个隔离根。不能据此声称 main 真实业务、home、动态 GUI 根全盘零污染。selftest 的0～6组与原exit0另证 WATCH及增/改/删/缺失检测；原 guard未序列化前后 manifest，本报告不补造原件。

coverage stderr 保留 TaskTable key warning、MaxListenersExceededWarning 及卸载时 `requestAnimationFrame is not defined` 的 React warning。原 reporter仍1563绿/exit0；这是带警告的原 AUTO 成功，不是“日志无错”、无内存问题或浏览器无异常的验收。

## 4. 531 输入、453 产物与五旧 probe

完整扫描声明的七个源码/脚本/locale目录及七个固定配置文件，恰好**531件**，与 candidate.sourceHashes 等集合、逐件 SHA 相等；不是仅取两个签署文件。分母为**526件 Main 当前输入 + 5件独立来源旧 Launcher probe**。Main 同范围526件与声明等集合，逐件一致。453件 lib 最终文件集合与 candidate.artifacts 等集合、逐件一致，不补称前后构建哈希同一。

531不包括依赖、scaffold其他说明文件和外部夹具，故**不能写成“所有构建/测试输入总共531件”**。candidate.fixtureInputs 的 F2/F3/F5为16件，源/副本 SHA、bytes及原记录源mtime相等。另实际 Board夹具：

`docs/testing/board-fixture-clarification-20261021-fixture.json` SHA `41c91b49024270667b5a43e2f927bc43c478b8b69384c95b157aa01643176b87`。

它在 r2 builder明确复制，当前与 Main 原件相等，但不在 sourceHashes 或 fixtureInputs；自有 audit 当前补核不更改原 manifest，不成为“首轮已声明17件夹具”的证据。**声明531完整可 PASS；宣称 candidate已穷尽全部有效输入则不成立。**

五旧probe逐件来源/副本匹配、Main相应路径全不存在，名单及完整SHA/origin见 candidate.inheritedLauncherProbeInputs和自有 audit `inherited-origin-five`：

- `fc-independent-probes.test.mjs`
- `fc-a2-followup.test.mjs`
- `fc-a3-probes.test.mjs`
- `fc-a4-probes.test.mjs`
- `fc-a2-additional.test.mjs`

准确 origin 均在 `/private/tmp/pmtool-a18-interface-output-20261022/launcher/test/`。不能把 Main 缺它们误报源漂移，也不能冒充新 Main 产品输入。

实际 Launcher `scripts.test`为：

```sh
node --test test/contract.state.test.mjs test/browsers.controller.test.mjs test/app.loopback.test.mjs test/control-html.test.mjs test/cancel.race.test.mjs test/journey-race.test.mjs test/loopback-security.test.mjs test/local-app.test.mjs test/browser-open.test.mjs
```

用现有 TypeScript parser读取九文件及递归静态/字面量动态 import/require，未执行任何产品/测试模块；导入图无五旧probe，TAP完整56条均在当前命令范围，fail/cancelled/skipped/todo均0。五probe不在显式参数，当前导入图无引用，不应被写成56的组成或额外通过。candidate五处 reason 的执行说法 **FAIL**；文件保存/来源继承 **PASS**。这不是要求重测旧probe或新开 GUI。

## 5. 原失败、必要差异与缺件

| 原事件 | 原证/核对 | 保持的结论 |
| --- | --- | --- |
| 大量 docs复制中止 | [preparation-interrupted](../../reports/all-pending-evidence-20261021/A19/build/preparation-interrupted.json)记录精确Python84211/TERM/未build/保partial；原脚本读回，partial仍存在且无lib | 中止不是构建成功；实际父wait/signal回执 NOT_CAPTURED |
| r2首coverage失败 | `build-r2/coverage.exit.json` PID84880/exit1；stdout1503绿28红，4文件失败；stderr另列3加载套件缺F2，backup-web28项缺F5 | 原FAIL完整保，不计入后1563或洗成0；F3也由相同原目录补齐 |
| 补夹具 | [fixture-regression 原脚本](../../reports/all-pending-evidence-20261021/A19/build-final/pmtool-a19-fixture-regression-20261022.py)仅原件复制；16件binding核一致，之后原五条全exit0 | 非产品或期望改写；原首失败仍存在 |
| 原封候选失败 | 原 fixture-regression末段以 `sha(repo/n)`比较所有Launcher测试，Main五旧路径缺失会触发FileNotFoundError；[final proof](../../reports/all-pending-evidence-20261021/A19/build-final/proof.json)记录具体fc-independent路径 | 流程/原因与现存文件一致；原完整错误stdout/stderr/父exit未在本目录捕获，不虚报直接看见该退出原件 |
| 后封候选 | [finalize 原脚本](../../reports/all-pending-evidence-20261021/A19/build-final/pmtool-a19-finalize-build-20261022.py)仅分Main与准确old origin，重读原九条exit，再封531/453并复核保护 | 必要来源绑定修正可用；未改产品/断言/fixture。proof不是父退出回执，也不证明五probe已执行 |

两脚本都保留，差异是设施输入补件/来源解析和封存，不是放宽业务断言。来源比对完成后，首复制中止、首coverage FAIL和封候选设施失败仍各自保留；旧共享10bin历史 BLOCKED、原13红与独立设施失败只按原 A19专家报告引用，不重新判定或覆盖。

**NOT_CAPTURED 的精确对象**：

- r2 builder在 `depsBefore`内存采样，但未落盘首 build 依赖-before；原 `build-r2`没有完整依赖副本before/after。`dependencies/source-before.json`属于更早复制阶段，不替代这个缺口。
- 首 tsc/tsdown前后453产物清单。candidate/artifacts在最终封存才取样；原 build成功日志不提供前后内容身份。
- Python84211准备父wait/signal；r2 builder、fixture-regression、finalize三个父执行完整 argv/原工具退出回执。九个**子阶段**exit.json全在，不能冒父exit。
- 原封候选FileNotFoundError的独立stdout/stderr/exit。`build-final/proof.json.originalFinalizerError`是后记录，不是当时原错误全文。
- 首轮 Board夹具在candidate内的SHA绑定；guard两个原根manifest的序列化原件。现存脚本/汇总/当前匹配只能给上述有限证明。

这些缺件只阻塞相应更强的历史命题，未捏造可复现的产品FAIL，不额外要求Main暂停不受影响的已授权工作。

## 6. 依赖与限定保护

原 `build-r2/protected-before.json`2728条精确lib路径，当前 SHA/mtime与前值逐件一致；candidate.protectedDrift空与实际核对相符。保护对象是该原列表，不是A18全件或整个home。

依赖源保护的实际持久化起点是 `build-fixture-supplement/dependency-source-before.json`13613件，其 SHA/mtime现在与前值一致。当前 r2独占副本实核13613普通文件/1030软链，源/副本全SHA相等、链接realpath闭合、外链0、共享inode0。此证明分别是**补件后源保护**和**本次审证时点副本隔离**，不能追溯声称首build前后已全部保护。旧shim绝对前缀只是保存文本，不声称动态执行该shim也闭合。

本审证 [before](a19-full-regression-evidence-review-20261022-before.json)记录固定源、lib、依赖及本次必要AUTO原件共**33630个精确路径**，含Main五旧probe的缺失标记。包括Main/r2声明范围、453产物、旧lib原保护列表、fixture原件和副本、五origin、build三个阶段原证与必要签署/manifest。未纳live业务root、新GUI目录、宿主服务、凭据或其他专家在途输出。审证后逐路径SHA/bytes/mtimeNs/inode/link及源/lib发现集比较见[seal](a19-full-regression-evidence-review-20261022-seal.json)；结果以该原件为准，不泛化为整盘零污染。

## 7. 自有产物与释放

仅创建 `docs/testing/a19-full-regression-evidence-review-20261022*`：本报告、只读audit脚本、before/audit/supplement/seal JSON。audit21项中20项一致、一项明确反证为五probe执行说法；audit命令完成exit0表示**审证运行完成**，不把那项FAIL隐藏成全绿。自有 NOT_CAPTURED表述修正为“原失败退出全文缺件，失败源码流程已保”，没有改任何他方原件。

自有命令（仓库根，macOS；不是产品重测）：

```sh
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-full-regression-evidence-review-20261022-audit.mjs capture
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-full-regression-evidence-review-20261022-audit.mjs audit
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-full-regression-evidence-review-20261022-audit.mjs supplement
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-full-regression-evidence-review-20261022-audit.mjs seal
```

**本角色释放、STOP。** 无本角色产品/构建/测试/GUI/服务进程，不修改或停止Main业务实例，不清partial或原失败，不另build，不commit，不重复派单。最终报告SHA由seal和交回消息给出；其他GUI/总门由对应专家独立处理。
