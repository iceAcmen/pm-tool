# 原 F02 原生 trace R2 独立命令审计

本文件给 Main 复核本角色真实执行边界：区分只读准备、自有审计、原封存收据与未执行的产品/GUI。2026-10-23，trae 独立原 F02 诊断审证专家。

## 1. 环境和写范围

全部 shell cwd 为 `/Users/bytedance/Projects/dsh-pm/pm-tool`，macOS/bash。实际 Node 为 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`，版本 v22.23.3。未调用 nvm 初始化、pnpm、安装、build、产品脚本、Git、浏览器/服务或 spawn。

手工写只使用 apply_patch：新增自有 `/tmp/f02-option-native-trace-review-20261023-r2-reader.mjs`、本前缀报告/命令审计；自有 reader 写本前缀 audit/auditseal，用 `wx`，不覆盖旧文件。reader 只用内置 fs/path/crypto/util。首次audit后，仅给reader的seal分支补入round26原只读snapshot/raw核对与自有seal链接处理，audit分支证据检查不重跑。

自有audit的reviewer/boundary/limitations说明经apply_patch中文化，reader说明同步；新增metadataLocalization明确这一说明性改动。checks、原件、指纹、收据、trace和roots不改，不重新执行全量audit。

## 2. 真实自有验证命令

以下不是 Main 的产品验证，不以命令0签 GUI：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-option-native-trace-review-20261023-r2-reader.mjs audit
```

工具实际 exit **0**，无长运行 session；stdout：

```json
{"mode":"audit","indexCount":443,"physicalCount":446,"indexSha256":"9cbb0bf2737874fc0ebcfae5bcc19666fc25563f8b9f1f707a716e9de0033e7b","chainStates":7,"allStates":9,"chainRoots":44,"rawPerState":38,"rawCount":342,"frameCount":40,"clicks":6,"checks":894,"errors":[],"output":"docs/testing/f02-option-native-trace-review-20261023-r2-audit.json"}
```

语法检查初版实际执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/f02-option-native-trace-review-20261023-r2-reader.mjs
```

工具实际 exit **0**、stdout空。seal分支补核后的reader再语法检查，然后首次运行seal：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /private/tmp/f02-option-native-trace-review-20261023-r2-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-option-native-trace-review-20261023-r2-reader.mjs seal
```

第二次语法检查实际exit0。**首次seal实际exit1**：451输入changes=[]，只有`round26-snapshot-raw:fileAssets`断言失败，首封原件保留，不覆盖。该补核额外把fileAssets公开snapshot与存储record整对象相等比较，差异实为两个raw独有`relPath`字段；其他10类整record相同。

随后实际Node `-e`只读自有audit的round26 response和本包fa-0001/fa-0002 raw，打印两者及`rawOnlyKeys`，exit0；输出两条唯一rawOnlyKeys均`["relPath"]`，全部公开字段同。随后`sed -n '245,330p'`自有reader、`sed -n '26,48p'`本命令审计、`sed -n '127,150p'`本报告均exit0，先回读再改自有文件。不读取当前产品源码、不把自有断言错误开给开发。

只给自有reader新增`seal2`纠正这项比较：公开字段全等，额外raw键严格只准relPath并绑本封存files指纹；其余10类仍整record比较。全量audit不重跑，首封失败原件保留并加入新封存outputs指纹。必要二次封存命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/f02-option-native-trace-review-20261023-r2-reader.mjs seal2
```

该命令终态在真实末次工具回报和本前缀 `-seal-command-receipt.json` 追加记录，**不预填它的exit或PASS**。输出为`-auditseal-r2.json`，保全原446封件及五参考输入451件、自有输出与首封失败件、report链接/尾空白，补核原snapshot/raw。它不自指纹，封后真实命令收据亦不纳入seal，避免循环指纹；不是GUI门。

## 3. 准备阶段只读命令及异常

以下为真实 exec_command 调用；多文件cat是同一次只读输入，不执行mjs正文。不写重定向文件。工具输出截断不算执行失败，也不改原件。

| 命令/实际对象 | 工具终码与边界 |
| --- | --- |
| `pwd`；`cat AGENTS.md` | 各0；确认cwd、通读规则 |
| `rg --files reports/all-pending-evidence-20261021/F02OptionNativeTraceR2` | **127**，`rg: command not found`，未安装，改用ls/find/grep/内置fs |
| `rg -n 'ADL-057\|11\.7\|审证\|独立\|原子\|ordinary\|封\|证据\|§6\|remaining' docs/collaboration.md` | **127**，同上 |
| `ls /projects/-Users-bytedance-Projects-dsh-pm-pm-tool--p2-11b908a9362bd421871f /user_profile.md` | **1**，平台记忆路径不存在；以仓库原件为准，不搜索私人目录 |
| `ls -la reports/all-pending-evidence-20261021/F02OptionNativeTraceR2` | 0 |
| `cat docs/testing/six-repairs-pointer-gui-review-20261023-r1-report.md` | 0，只读旧FAIL/原§6 |
| `cat docs/plans/2026-10-23-f02-option-default-repair.md` | 0，只读原方案，不执行其中产品命令 |
| `find docs reports/all-pending-evidence-20261021/F02OptionNativeTraceR2 -name '*0713*' -o -name '*index*' -o -name '*seal*'` | 0；一次目录名检索过宽、约1.6MB输出被工具截断。未读取/执行其他命中的文件正文，随后只读指定接续与本封件 |
| `sed -n '280,640p' docs/collaboration.md`；`cat docs/collaboration.md` | 各0；后者通读§9/§11 |
| `cat docs/plans/2026-10-23-0713-continuation.md` | 0 |
| 本包 `cat round28-source.mjs`、`cat main-seal-source.mjs`、`sed -n '1,105p' index-r1.json` | 各0，只读源码/索引 |
| `cat` research-guide SKILL.md及其references/research-report.md | 各0，只读本地技能；采用原始证据优先和不造数据，不引入网络/额外研究门/第三方数量门 |
| 本包一次 `cat combined-candidate.json host-start.json activation-binding-r2.json seal-r1.json seal-outer-receipt.json`（参数均带本包路径） | 0 |
| 本包一次 `cat harness-source.mjs activation-binding-r2-source.mjs` | 0；原外部helper不在包内，不追读private |
| 本包一次 `cat round27-original-deliverable-list-roots.json round28-after-planned-pointer-selection.json` | 0 |
| 本包一次 `cat round28-events.json round28-planned-pointer-target.json round28-popup-closure-observation.json` | 0 |
| Node `-e`内置fs只读round26/27/28及activation/host收据、combined source/complete/built声明并输出版本 | 0；stdout摘录，不运行原程序。读取后发现round26有snapshot原RPC |
| Node `-e`内置fs只读原trace，输出六条target/path/phase/detail/trusted/defaultPrevented与outer键 | 0；不是浏览器执行/注入 |
| 本包一次 `cat` frozen-source的records-listbox.tsx及records-deliverable-form.tsx | 0 |
| 本包一次 `cat round26-source.mjs round27-source.mjs` | 0，不重放旧轮 |
| `grep -n 'function RecordsListbox\|function RecordsDeliverableForm\|onClick: () => choose\|setOpen' reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/browser-script-3.js` | 0，定位实际下发代码 |
| 本包一次 `cat` frozen overlay、round28移除后计数/cleanup、host-ready | 0 |
| 本包 `cat round27-original-deliverable-list-raw/data/pmtool/deliverables/dlv-0001.json` | 0，只读封存wrapper/record |
| `ls docs/testing/f02-option-native-trace-review-20261023-r2* /tmp/f02-option-native-trace-review-20261023-r2-reader.mjs` | **1**，创建前两目标均不存在；随后新增，不是覆盖他人成果 |
| Node `-e`内置fs只读本角色audit，输出summary/source bindings/round rows/状态及实际bundle两个函数 | 0；发现round26真实1对snapshot而非“零RPC”，原数据未改 |
| `sed -n '235,288p' /tmp/f02-option-native-trace-review-20261023-r2-reader.mjs` | 0，改自有seal分支前读最新reader |

以上 Node `-e` 均为本角色写的只读字段打印程序，仅内置fs，未import/eval原代码；其结果已纳入完整audit或报告，正式可复核审计入口是本节第2部分自有reader。准备命令失败没有导致产品/封件FAIL，也没有被抹去。

封前只读回看：`sed -n '1,22p'`、`tail -n 15`本前缀audit；`sed -n '281,320p'`自有reader；`sed -n '125,150p'`本报告及`sed -n '1,18p'`本命令审计。各真实exit0，用于局部编辑前回读最新内容。补核后的 `/private/tmp` 路径语法检查现已实际exit0、stdout空，封后收据再记录同一结果。

## 4. 原图目视与原收据

真实 `functions.view_image` 对本包8件各调用一次，均成功：round26-error-state.png、round27-original-deliverable-diagnostic-start.png、round28-status-menu-before-selection.png、round28-after-planned-pointer-selection.png、round28-stable-selection-end.png、round28-after-normal-cancel.png、frames/round28-3.jpg、frames/round28-9.jpg。仅显示本地封图，不启动或操纵浏览器；目视内容与局限见报告§6。

原封件 round26 outer1、round27/28 outer0、activation outer0、host setup status0、seal inner receipt0全部只读核对，不冒成本角色执行过的命令。round28捕获4秒关闭超时后正常取消、outer0不代表产品成功；round26 readonly snapshot不等业务写。

## 5. 收尾和未执行

未执行：fetch/pull/status/diff/stage/commit/push、build/install、产品verify/Vitest/GUI/服务控制、Main sealer/原round/privatefreeze/runtime/凭据/spawn。授权允许父ordinarycommit不等本角色可执行Git或提前签父提交。

本前缀 report/audit/command-audit/auditseal及封后真实收据是全部仓库新写；自有reader仅在 `/tmp`。没有本角色长运行会话或任何builder/GUI/端口/数据锁。原子审证结束后 **released / STOP**，父goal继续，仅留原F02 §6 remaining。
