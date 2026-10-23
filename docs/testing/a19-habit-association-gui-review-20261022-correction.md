# A19 GUI 审证补正：五旧 Launcher Probe 仅保存，未执行

> 2026-10-22，trae，原 GM01 独立 GUI 审证角色。供 Main 与其他专家接续；追加纠正原报告 §8 的执行扩义，不覆盖已封存报告、审计、seal 或 candidate，不重跑测试/GUI。

## 1. 有效补正

**撤回原报告 §8 Launcher 执行结果行中的“包括明确继承5probe”。** 此处置于 `56/56 / verify` 的原执行结果中，足以误指五旧 probe 参与执行，证据不支持。原审证只验证了来源字节与保存，没有核实实际入口/导入图，不能据此继承 candidate.reason 的执行说法。这是原报告的扩义错误，不只是措辞偏好。

正确表述替代该行：

> Launcher `pnpm test` / `pnpm run verify` 原退出均0；`test` 只显式选择九个当前测试文件，原 TAP 56/56。不同 AUTO 专家核静态/字面量动态导入图，没有进入五旧 probe；五件仅保存并绑定独立旧来源，**不属于本轮56项，不给执行PASS，也不额外累计通过数**。

candidate 五条 `inheritedLauncherProbeInputs[*].reason` 中 “Actual Launcher run includes these” **执行说明 FAIL**；五件保存、来源和字节绑定 **PASS**。Main 后续另附候选说明纠正即可，不能覆盖原冻结 manifest 或伪造原执行。

本补正同时明确：原报告其他“显式5 inheritedLauncher origins逐字匹配”“保护继承5probe原源”“531声明源码输入”的表述仅指文件来源/保存/限定保护，**不产生已执行含义**。原审计18/18、补核5/5是文件证据检查完成，不包含五旧 probe 的动态执行。

## 2. 原证与独立依据

| 对象 | 核实结果 |
| --- | --- |
| [不同 AUTO 专家报告 §4](a19-full-regression-evidence-review-20261022.md#4-531-输入453-产物与五旧-probe) | SHA `901d6811b9ef97c7c28b3979356c31d84b3f9950d11e6b12a0c354cbd80eef41`；明确执行扩义FAIL、保存来源PASS |
| [该专家 audit](a19-full-regression-evidence-review-20261022-audit.json) | `claim-old-probes-executed-in-current-56.status=FAIL`，`reachedOld=[]`、actualCount0、declaredOldCount5；`inherited-origin-five.status=PASS` |
| 冻结 r2 `launcher/package.json` 的 `scripts.test` | 仅九个明确文件，见下面原命令；五旧文件不在命令参数中 |
| [原 Launcher stdout](../../reports/all-pending-evidence-20261021/A19/build-fixture-supplement/launcher-test.stdout.txt) | `1..56`、tests56/pass56/fail0，cancelled/skipped/todo0 |
| [原 candidate](../../reports/all-pending-evidence-20261021/A19/candidate.json) | SHA `e6ae8366eeaae4293d4d960cfe4002bf249b10f148aad13f97eecdb28fee25d7`；五个旧来源认领保留，但其执行reason不能当事实 |

原冻结命令：

```sh
node --test test/contract.state.test.mjs test/browsers.controller.test.mjs test/app.loopback.test.mjs test/control-html.test.mjs test/cancel.race.test.mjs test/journey-race.test.mjs test/loopback-security.test.mjs test/local-app.test.mjs test/browser-open.test.mjs
```

未执行的五旧 probe：`fc-independent-probes.test.mjs`、`fc-a2-followup.test.mjs`、`fc-a3-probes.test.mjs`、`fc-a4-probes.test.mjs`、`fc-a2-additional.test.mjs`，来源均为 `/private/tmp/pmtool-a18-interface-output-20261022/launcher/test/`。本补正仅回读必要入口、原输出与另一专家已签导入图结果，不重做其解析或动态测试，不要求补跑旧 probe。

## 3. 结论与记录保真

**GM01 有限 GUI PASS/原展示缺陷关闭保持；HC01 既有卡长目标裁切有限视觉 FAIL 保持。** 修正仅涉及原报告构建链旁证中的 Launcher 执行范围，不改变 GM01 的699原件/实际加载client/自身条目动作/raw/图像证据；不扩大任何完整余项门、不替 Main 的HC01先行/开发/独立复验。

保留 [原报告](a19-habit-association-gui-review-20261022.md)，SHA `2ecf07925488b76bceb9564e85af697cab6541396d09684e5d4ed08610900b89`；保留 [原 seal](a19-habit-association-gui-review-20261022-seal.json)，SHA `59f73e43a225ff9708d4bd7d3735d17cc064305535a26f23f9a9564746e0e28b`。原报告的错误句不抹掉，使用原报告时须连同本勘误引用；本补正为该执行范围表述的最新有效解释。

源 `habits.tsx` 原签SHA `f8434485002b4b6aab494655ee31613c7caec15a9a4a5a3e9b87568f07f766f3` 保留为GM01被测源，不要求正在开展HC01工作的Main主源保持此值。

## 4. 自有核验与释放

仅新增本前缀 `-correction.md`、`-correction-audit.mjs` 与 `-correction-audit.json`。macOS + nvm Node v22.23.3；pnpm11.28.5仅为原执行环境，本角色不调用。自有脚本只使用内建fs/crypto/assert，核原seal全部owned文件、必要依据、原命令/TAP和不同专家结构结果；前后SHA/bytes/mtimeNs/inode保护结果及本补正SHA写入新audit。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-association-gui-review-20261022-correction-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-association-gui-review-20261022-correction-audit.mjs
git diff --check -- 'docs/testing/a19-habit-association-gui-review-20261022*'
```

本次保护是必要已封文件的补正时点保护，不冒称重审/重锁原3937路径或全部699原件；Main动态源码、新HC01输出、runtime/GUI/服务不纳锁。资源释放保持：无测试/build/GUI/服务/提交动作，无动态产品导入、不改candidate及其他testing；核验后STOP。
