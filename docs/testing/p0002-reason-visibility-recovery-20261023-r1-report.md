# P0002 拒因可见性恢复审查与最小重新采证合同 R1

> 2026-10-23，trae，独立测试专家；只读审证与修订既定采证步骤，不开发、不操作 GUI。输入为原 P0RejectedRemainingR1、新 P0RejectedReasonSupplementR1、前专家报告及必要公开源码。

## 1. 裁决

**历史 `BLOCKED_FINAL_SCHEMA_REASON_VISUAL` 保留。** 新包不能补签旧 apply 的拒因可见性；当前已经重开、重建的副驾没有该次临时结果，正常切 tab 或滚动不能恢复已销毁的消息状态。不是“产品永远不能显示拒因”，也不是新增产品 FAIL。

**恢复尝试审查成立，未关闭 RA-P0002 整项。** 175 件新原件与 457 件旧原件大小、SHA256 全部相符；新包所存三个事件段只有三条只读请求，无新 ask/apply。原重开截图确实显示旧成功台账摘要和空草稿，不是本次 badbranch 拒绝结果。

本专家以本次明确授权修订[前专家精确 §6](p0-rejected-remaining-gui-review-20261023-r1-report.md#6-exact-remaining-与释放)：其“若结果丢失，先 BLOCKED，不盲重调用”仍是历史判断；本合同另行规定**一次确定性 badbranch 真实 ask/apply，立即在仍挂载的同一副驾内滚到最终拒因**，只补原断言，不先要求开发或确证产品 FAIL。Main 不得自行改本合同步骤。

原八拒绝、wrapped 保护、最终 schema/data 的有限 PASS 不撤销、不重签；不重合法字段/title/context/metric/capture/cleanundo，不扩完整 B8、P0 整域或模型能力。没有依据据本件放行 ordinary commit、push 或 release；父授权与父全部适用独立门仍由 Main 汇合。

## 2. 授权与输入保护

负责人原句：“父持续全部已实现未验至ordinarycommit授权，无push/release”“独立测试专家，只读审+最小原P0002拒因复验合同，不开发/GUI”“你可修订专家既定用例，Main不可自改步骤”“唯一写docs/testing/p0002-reason-visibility-recovery-20261023-r1*新文件及自有/tmp reader”“审结seal与released/STOP”。

本子任务只写该前缀新报告/审计/seal 和 `/tmp/p0002-reason-visibility-recovery-20261023-r1-reader.mjs`；不改旧 testing、产品、livingdocs、原证或上游，不执行 Git、install、build、产品 verify、服务/端口操作或 GUI，不访问凭据/private 活根。此次明确范围替代通用开工 fetch/pull/install/build、livingdocs 同步与提交动作，不将父 ordinary commit 权限转移给本角色。

依据：[AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md#九独立测试门控adl-0452026-10-12-起长期硬规则)、[前专家报告](p0-rejected-remaining-gui-review-20261023-r1-report.md)。研究指导仅用于原证优先、反证与不确定性界定，不联网、不执行归档采证脚本、不制造图或模拟成功。

| 输入 | 实核 |
| --- | --- |
| [新 index](../../reports/all-pending-evidence-20261021/P0RejectedReasonSupplementR1/index-r1.json) | 175/175；28946 bytes；SHA256 `eeac1a5103bf9442310a2fd3c82d7f65bd4dd33cca78afb56e5ca06460a2e740` |
| [旧 index](../../reports/all-pending-evidence-20261021/P0RejectedRemainingR1/index-r1.json) | 457/457；76510 bytes；SHA256 `aaf8747eecd856f06394c9f5e14b35c74a57ac805181397c28489abe06d04a47` |
| [新 seal](../../reports/all-pending-evidence-20261021/P0RejectedReasonSupplementR1/seal-r1.json) | 数量、index SHA 均一致；`NOT_JUDGED` 是采证者状态，不代专家结论 |
| 包完整性 | 旧包仅 index 不自索引；新包仅 index/seal 不在175清单。没有其他未索引文件，未跟随软链 |
| [binding-observations](../../reports/all-pending-evidence-20261021/P0RejectedReasonSupplementR1/binding-observations.json) | 原 apply 返回与旧原件逐结构相同；3264/PID10975、114 声明/521输入、e2e=0、pilot=OFF，均为归档绑定，不声称重探运行实例 |
| 明列输入 | 最终 audit-r2 保护648项，包括两包、规则、前专家同前缀六件、四份公开源码、此次 reader 首失败审计；收工 seal 再核，不修改旧件 |

冻结/装载资格沿前专家归档绑定限定继承；本角色没有重读521个 private 冻结实体、探端口或读取 profile。HEAD/version 不替代未提交候选身份。

## 3. 原重开页面与零写核查

**本次实际 `view_image`：** 新包 `round00-resume.png`、`round01-project-return.png`、`round02-sidecar-reopen.png`、`round03-draft-tab.png` 四张；旧包 `round05-diagnosis-after-rejection.png`、`round05-exit.png` 两张。41张新 JPEG 仅核事件引用与 SHA，不称全部目视或连续录屏。

| 原件 | 所见与证明边界 |
| --- | --- |
| [旧诊断图](../../reports/all-pending-evidence-20261021/P0RejectedRemainingR1/round05-diagnosis-after-rejection.png) | 保留原两次问答，上方内容到“相关任务”开头；没有拍到最终0/1与中文schema拒因 |
| [旧退出图](../../reports/all-pending-evidence-20261021/P0RejectedRemainingR1/round05-exit.png) | 副驾已关闭；原round05脚本随后点“新建会话”，再发只读 snapshot。未执行该脚本 |
| [重开图](../../reports/all-pending-evidence-20261021/P0RejectedReasonSupplementR1/round02-sidecar-reopen.png) | 只有初始化提示及“已应用1条AI建议（该批次已撤销）”，落库于20:35，t6当前进度47%；这不是21:00 badbranch写入或拒绝结果 |
| [草稿tab图](../../reports/all-pending-evidence-20261021/P0RejectedReasonSupplementR1/round03-draft-tab.png) | “暂无草稿”，不存在可继续确认/恢复的旧badbranch草稿；不是成功落库证明 |

原 apply `36f6dc54-d6aa-4d46-9c59-23e1a73adbdc` 于 `2026-10-22T21:00:39.329Z`，agentId=`session-2f0749ec-1ce2-4746-849c-244c285b5076`。原round05新会话 snapshot 与新包三次只读请求均为 `session-003c8251-e4cf-4c49-a468-0e3913370f94`。因此“同实例、同 timeOrigin”不等“原副驾组件/旧消息仍在”；相同旧会话条件没有被恢复。

新事件实核：round01 `/pm web snapshot`；round02 `/pm model status`、`/pm ask-provenance p-0001`；round03无RPC。三请求都有匹配返回；其中 provenance 只有20:35的一个 ask-apply 条目且 `undo.used=true`，没有21:00拒绝条目。`round03-existing-results.json` 的 results/scrolls 均为空，只作辅助定位，不凭 DOM 空数组证明全页面永远不可达。

新包四保存态的 **34项 WATCH** 与旧 `round05-snapshot-visible-roots.json` 逐键相同，changed=[]；**112份业务原payload**（4×28）与原末态逐字节同，含全部settings；t6均为502 bytes，SHA256 `ad40276d005e767fd056c348acbf474eb30b10c48052dd2693901c9ecbeb8731`。六项 files/backups仅实核归档指纹，未读活根字节。范围不含宿主会话/profile/cache/正式根，不声称全机零写。

**计数纠正，不改历史原件：** 前报告正文“36项”是笔误；其[原audit-r2](p0-rejected-remaining-gui-review-20261023-r1-audit-r2.json) `rootItems=34` 与原JSON一致：28业务＋2files＋4backups=34。零变化结论不受影响，不补造两项覆盖。

## 4. 可恢复性与公开源码边界

1. [sidecar-portal.tsx:219-223](../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx#L219-L223) 的 msgs/steps/rejected 是组件本地 `useState`；[runApply:445-449](../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx#L445-L449) 将真实返回追加到 msgs；[后续clearPlan:482-484](../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx#L482-L484) 清草稿、读快照和成功台账，不把拒因持久化。
2. [loadApplied:303-315](../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx#L303-L315) 重开读 `ask-provenance`，不是旧拒绝消息；[diagnosis:596-660](../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx#L596-L660) 分别渲染当次msgs与持久摘要。[ask.ts:479-508](../../packages/dsh-pm-tool/src/commands/ask.ts#L479-L508) 只对真正已应用且有undo的改动登记成功来源。零应用拒绝不产生可重读成功条目；不能为补图添加拒绝持久化或按钮。
3. 当前公开 [panel.tsx:713-718](../../packages/dsh-pm-tool/src/client/panel.tsx#L713-L718) close置 `copilotLayer=false`；[1476-1495](../../packages/dsh-pm-tool/src/client/panel.tsx#L1476-L1495) 是条件挂载。**关闭不等最小化**：最小化hidden保同一子树，关闭卸载。现在重开生成新msgs，滚动不能重建旧msgs。
4. sidecar源码 SHA=`e2e9054e9ad0d7a7e9f3c0020760a2c48a8c477ae44af6b01c2a509e8e4204dc`、ask命令 SHA=`084efb5b33e7cda7368b87c4708f87f460d28588f3e7476cadfad2de0fd35884`，都与旧114声明相同。**当前panel不同**（现 `a58e2165…`，旧 `581f2882…`），只作现合法入口生命周期定位，不能把它冒作旧114全源或运行身份；当前ask-projection不在114差异声明内，亦不据此宣称重核全量冻结。

结论由原关闭/会话变更、新原帧、真实provenance及明确匹配的消息/命令源码共同支持：**本次合法重开路径已没有原拒因，前§6只读恢复分支无法完成。** 不推断存在未声明的历史消息回放入口，不尝试注入React状态、DOM补字、DevTools历史还原或伪造画面；若未来发现真正未入包旧原帧，仍可另交专家审，但当前不能假定其存在。

## 5. 最小重新采证合同

**合同ID `RA-P0002-REASON-RECAP-R1`；状态 `READY_FOR_MAIN_CAPTURE / NOT_RUN`。** 本节是专家对前§6剩余采证步骤的显式修订，不是新增功能。父已授权范围内由 Main 采证，独立专家审签。下面必须按序执行，Main不得自改fixture、重试次数、对象或停止条件。

1. **认领新观察而非恢复旧成功。** Main在父已批准、已冻结且独占的当前候选实例上绑定基线+diff/新文件指纹、完整输入/产物、宿主归属、PID/port、浏览器/agentId、开关及确定性依赖。可以仍用旧114实例；也可用父当前已批准候选，但必须明确其ID，不能静默拿114/521标签代新候选。e2e=0、pilot=OFF；不为了本图开发、build、换服务/模型/凭据或改开关。若没有已认领可用实例或合法确定性依赖，记录BLOCKED交专家，不临时扩范围。
2. **初态与WATCH。** 使用p-0001/t-0006，证明目标存在、同项目、未软删，记录全record、updatedAt与真实snapshot。保持当前合法初态，不手改/重建业务种子，不假定它仍是旧502字节。在ask前保存同一完整WATCH（原34项及该候选已声明的实际业务/settings、files/backups写根），新增合法历史一并保留；没有合法同对象或写根无法认领即STOP。暂停其他写者，前后增删/size/SHA都可回读。宿主会话与确定性依赖日志仅作采证设施，分层登记，不混称全盘零写。
3. **仅一次真实ask。** 正常GUI打开副驾、只读诊断输入并发送下面问题；禁用精确 `fixture` 后门，不直接运行离线校验或手写ask-apply代真实旅程。继续用父已批准确定性网关，只预置下面单一返回，不改产品、不伪造RPC。保存网关请求/序列及真实ask请求、返回和画面，逐字配对。ask前/后、确认前WATCH均须不变。返回不符、超时或出现额外步骤则保原红/BLOCKED并STOP，不自动重ask。

问题：

```text
P0002原拒因补证：给t-0006建议一个含空格的非法branch，确认前不落库；由最终任务校验拒绝。
```

确定性返回正文（JSON围栏属于返回正文）：

````text
P0002原拒因补证：非法分支应由最终任务校验拒绝。
```json
{"plan":[{"stepId":"s1","title":"非法分支由最终task schema拒绝","reason":"空格分支通过窄集字符串闸，但不得绕最终白名单落库","action":{"op":"task.update","id":"t-0006","patch":{"branch":"bad branch"}},"needs":[]}]}
```
````

4. **一次明确GUI确认。** 正常切“草稿待确认 (1)”，只保原s1，不编辑字段、不添repo、不添wrapped，不逐步重放。拍到branch原值、目标、单步和确认控件；正常点一次“整批执行（1）”。实际仅一次ask-apply，action=`task.update t-0006`、patch严格仅 `{"branch":"bad branch"}`，s1/title/needs保原语义；`--base`由这次计划打开时真实snapshot生成，不能复制旧base或绕过冲突。返回须是最终task schema的**0应用/1未执行**及“分支名需 ≤64 字符、不含空白与特殊符号（如 main、feature/x-1）”，不能以success envelope、前置拒绝、stale拒绝、协议失败或其他schema错误替代。
5. **立刻补目视，禁止先退出。** 收到这一次真实apply结果后，不关闭/ESC、不新会话、不刷新/重载、不切项目/宿主、不打开任务或发第二ask/apply。草稿空态不是出口；正常切同一仍挂载组件的“只读诊断”，用真实滚轮/触控/键盘滚动实际内滚容器到**该次系统结果气泡**，拍到“已应用0步；未执行1步”与完整中文分支名拒因。正文过长允许相邻连续原帧，但须证明同气泡/同rpcId、全句可读且未裁切；保留原视口/主题/缩放，勿为补图增加矩阵。保存从确认、返回、切tab到滚动的原帧/事件，结果节点bbox、滚动位置及祖先裁剪范围只作辅助，不代`view_image`。
6. **末态与封包。** 结果出现及完成滚动后各回读同一WATCH；必须全键增删/size/SHA零变化，target/settings/来源台账/幂等记录无新增成功。真实只读snapshot回读target全record与初态相同；不执行undo、清理历史、重试写入。保存raw请求返回、ask/网关配对、前中末根清单/业务payload、真实PNG/JPEG、时序与候选认领、执行脚本，另开新证据目录逐件size/SHA封包。明确链接旧457、新175、前报告和本合同，标记“新观察补原断言，旧拒因不可见仍保留”，不覆盖旧index、失败、图或审计。
7. **停止与判定。** 不变量变化、应用数>0、返回语义错误或真实可见误示本次成功：保最小expected/observed及原证立即STOP交专家，Main不自修/撤销/洗数据。同一组件正常滚到仍不能取得拒因：记录实际步骤与可见性BLOCKED，STOP，不凭raw/DOM补签，不盲重或新增功能。执行端只标采证事实/NOT_JUDGED；独立专家核封包、零写、原校验语义及`view_image`后才能签该有限拒因断言。新候选影响索引与其他既有门的继承由专家另外审，不把本单扩为重八拒/wrapped/context/metric。

```json
{
  "originalId": "RA-P0002",
  "historicalApply": "36f6dc54-d6aa-4d46-9c59-23e1a73adbdc",
  "historicalReasonVisual": "BLOCKED_NOT_RECOVERED",
  "confirmedNewProductDefects": [],
  "newCaptureContract": "RA-P0002-REASON-RECAP-R1",
  "newCaptureStatus": "NOT_RUN",
  "maximumNewAsk": 1,
  "maximumNewApply": 1,
  "remainingGuiSlice": ["0应用/1未执行及原最终schema中文分支名限制的真实可读目视"],
  "overall": "BLOCKED"
}
```

## 6. 验证与释放

环境macOS/bash，已有nvm Node v22.23.3；pnpm11.28.5仅沿仓库环境注明，未调用。自有reader只用Node内置fs/path/crypto/assert，未import产品或执行归档脚本。

在仓库根实际执行：

```sh
node --check /tmp/p0002-reason-visibility-recovery-20261023-r1-reader.mjs
node /tmp/p0002-reason-visibility-recovery-20261023-r1-reader.mjs audit
node --check /tmp/p0002-reason-visibility-recovery-20261023-r1-reader.mjs
node /tmp/p0002-reason-visibility-recovery-20261023-r1-reader.mjs audit-r2
node --check /tmp/p0002-reason-visibility-recovery-20261023-r1-reader.mjs
node /tmp/p0002-reason-visibility-recovery-20261023-r1-reader.mjs seal
```

三次syntax exit0；首[audit](p0002-reason-visibility-recovery-20261023-r1-audit.json) exit1，原因是自有reader沿前报告文字误设WATCH=36，实值34；其他三组成功。保首失败，只改reader计数；[audit-r2](p0002-reason-visibility-recovery-20261023-r1-audit-r2.json) exit0、四组成立、errors=[]、648输入保护。不是产品FAIL，亦非GUI通过率。最后[seal](p0002-reason-visibility-recovery-20261023-r1-seal.json)是收工实际结果权威件：回核输入/包完整性、报告链接/空白，并绑定report、两次audit、reader指纹；报告唯一尚未生成的self-link由本次seal创建，seal本身不循环自hash。

定位辅助：rg缺失exit127、指定memory文件不存在exit1、错误猜测观察/源码路径的读命令exit1/2保留为定位事实；未安装工具。为确认初次find定位是否结束，曾额外做一次全进程命令行枚举（exit0），超出本单最小reader需求；未用于服务/凭据判断，未读取private文件或发送信号。后续精确pgrep未命中（exit1），无待处理长运行命令。

**released/STOP。** 仅上述本前缀新成果与自有/tmp reader；不持有源码、builder、GUI、实例/profile或业务写根锁，不等待、不接续Main，不执行ordinary commit/push/tag/release。下一步仅Main按§5采一份新原证，再交独立专家审签；本审查没有宣布父目标完成。
