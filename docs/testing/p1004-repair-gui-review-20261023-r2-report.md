# P1004 修后同链独立 GUI 审证 R2

2026-10-23，平台 `trae`；独立原 P1004 GUI 审证专家，非 Main、非开发、非 GUI/产品测试执行端。

## 1. 有限裁决

**RA-P1004 首次遮层、直接取消/顶部 X 退出缺陷：PASS_LIMITED_GUI_REPAIR，当前同链接缝可关闭。样式/UX：PASS_LIMITED_SEAM。** 原 r1 失败原件和历史裁决不改；本结论绑定新候选、新原证，不将旧失败改写为从未发生。

**原 B8 该接缝键盘：有限 PASS，不签完整链。** 实际 Enter 打开正确 TaskForm、原生 Tab 从 title 到 description、ESC 退出、焦点归还可见 opener 均有原证；**“从其他控件 native Tab 到 opener”实际执行 0 次，仍 NOT_RUN，不冒 PASS**。这不是产品确证失败，也不是 MANUAL_PENDING。精确最小剩余见第 7 节。

| 层 | 独立裁决 | 边界 |
| --- | --- | --- |
| 原封件/身份/实际 outer | PASS（证据层） | 1314 普通成员 + index/seal/真实 seal outer；179 帧；1333 个明列只读输入 |
| SOURCE | PASS_LIMITED_INHERITANCE | 四份 P1004 冻结源码及 manifest，与已签父六修字节相同；不直接继承早期 191668 B panel 到当前 191954 B |
| AUTO | PASS_LIMITED_INHERITANCE | 继承原 P1004 专项/受影响门及当前组合独立审证的原边界；本角色不重执行 |
| 功能/集成数据链 | PASS_LIMITED_SAME_CHAIN | 正常 prepare 一次、ask 一次、正常人修改一次、现有 snapshot refresh；无重 save/重 ask 洗绿 |
| GUI/样式/UX 首次交接与直接退出 | PASS_LIMITED_SEAM | 深色、1440×718 当前上下文，首次目标可见/命中；取消、X 各唯一首点成功，原答与最新投影保留 |
| 原生 Enter/表单内 Tab/ESC/归焦 | PASS_LIMITED_KEYBOARD_SEAM | 真实表单焦点环及归 opener 焦点环；不冒原生 Tab 到 opener 已发生 |
| 原 B8 全链/全 B8/全 P1/父 ordinarycommit | NOT_SIGNED_THIS_ROLE | 不改变原 B8 分母，不替 Main 或其他专家签父门 |

未发现当前已审接缝的新产品缺陷。**不签其他六修、F01、P3004、已闭 F02 GUI、全部已实现未验、父 commit、push/release/正式切。**

## 2. 授权与方法

本轮负责人原句：

> 父持续原授权全部已实现未验独立收口至ordinarycommit，无新增暂停功能/push/release/正式切；Main唯一builder/GUI/桌面。你独立原P1004 GUI审证专家，非开发/非GUI或产品测试执行。限定原docs/testing/p1-projection-refresh-gui-review-20261023-r1.md §6同链缺陷和原B8该接缝Tab/Enter/ESC/归焦，不签全B8/父门。唯一仓库新写docs/testing/p1004-repair-gui-review-20261023-r2*，自有/tmp纯fs/path/crypto/assert reader及实际outer receipts，其他只读。

明确禁项依本次派单执行：不读活 runtime、凭据、正式配置、旧外部 helper，不 probe 浏览器/port，不 build/install/verify/git/fetch，不改 Main/产品/livingdocs/原件，不 spawn。此限定子单替代通用 SOP 的拉取、构建、全回归和 livingdocs/Git 收尾；不另要求所有者重复批准。

已读 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[原专家 §6](p1-projection-refresh-gui-review-20261023-r1.md#6-exact-remaining--最小修复复验合同)、[P1004 SOURCE/AUTO](p1004-handoff-source-auto-20261023-r1-report.md)、[当前组合审证](f02-combined-regression-review-20261023-r2-report.md)及其 [真实 seal 工具收据](f02-combined-regression-review-20261023-r2-seal-tool-receipt.json)、[Main 当前计划](../plans/2026-10-23-p1004-gui-r2-plan.md)。

自有 reader 为 `/tmp/p1004-repair-gui-review-20261023-r2-reader.mjs`，仅 import Node 内置 fs/path/crypto/assert；辅助输出只在自有同名前缀 `/tmp` 目录。**包内 Main helper/harness/outer/executor 仅文本读取/哈希，未 import/eval/执行。** `view_image` 仅查看封存原图/帧，不操作浏览器。限定对象不需要平台私有记忆作事实来源。

## 3. 精确封件、候选与浏览器字节

| 绑定项 | 本轮独立核验 |
| --- | --- |
| 新证据根 | `reports/all-pending-evidence-20261021/P1004RepairGuiR2/` |
| index | [index-r1.json](../../reports/all-pending-evidence-20261021/P1004RepairGuiR2/index-r1.json)，242022 B，SHA256 `65f7f34811efe3d08450961375830f5b2df59ed39b4a2b8077aa6535c5dbd971` |
| 成员集合 | 1314 普通件，逐 size/SHA 全等、实际集合全等；无重复、越界或软链；加 index/seal/之后真实 outer 为 1317 件 |
| Main seal/outer | [seal-r1](../../reports/all-pending-evidence-20261021/P1004RepairGuiR2/seal-r1.json) 与 [实际 outer](../../reports/all-pending-evidence-20261021/P1004RepairGuiR2/seal-outer-receipt.json)均原实 0；parent26799/child26800，未以预填 summary 代终码 |
| 候选 | `CombinedF02RepairR2`，source124 / complete525，version0.7.4；基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 来自封存声明，不执行 Git 或以 HEAD 代 dirty 候选 |
| 宿主身份 | 沿封存 activation：3269 / PID22463，DSH_PM_E2E=`0`，pilot 默认 OFF；运行根/private profile 仅元数据字符串，不访问 |
| 同上下文 | 26 态 origin 全为 `http://127.0.0.1:3269`，timeOrigin 全为 `1792712721380.9`；inner1440×718、outer1440×857、DPR2，原图深色 |
| 实际浏览器合并响应 | 只读原 `F02RepairGuiR2/browser-script-2.js`，2599193 B，SHA `b3366523782e3caf167ea5173b0a2a79765a01f8b8b68a922cd2b1f074164312`；与原 browser-script-binding 全等 |
| 提取/重建 client | offset875361、1720359 B，SHA `682647fb67cafca6e97e8d80bce0bae983b46da135873ebe316c86e758a44058`；补实际声明 34 B 无末换行 sourceMap 尾注，重建1720393 B，SHA `3be9d4a0bbc595bb0038e50787d33d38d47120237f7ab93fba40d1dc624f8159`，等已签 built manifest |

只读必要 `F02RepairGuiR2` 的两个 binding 与一份合并响应，**没有重审其1457全包、F02 GUI 或活下发文件**。本轮 P1004 activation 与原 F02 activation 逐结构相同。DPR2不等200%文本缩放，1440×718不填 B8 的1440×900完整格。

四必要 frozen-source 全核，与当前 source/complete、已签父六修 source 声明对应一致：

| 路径（`frozen-source/`下） | bytes / SHA256 |
| --- | --- |
| `src/client/panel.tsx` | 191954 / `341675c4dd31b87d05264de520a4c198edbb3c3476f2f87d8f38cc80ba1d83d6` |
| `src/client/panel.css` | 326019 / `3cc0b0ed08ea34462ded8154b05f394a46f02c6577dea5da12c495aafa0f700b` |
| `src/client/shared/drawers/sidecar-portal.tsx` | 45837 / `e2e9054e9ad0d7a7e9f3c0020760a2c48a8c477ae44af6b01c2a509e8e4204dc` |
| `src/client/panel-sidecar-task-handoff.test.tsx` | 12325 / `1e1e6bf1586ff32f3dc8526e904707b7159bb5b4c27b9f67e299161231e6e64b` |

当前组合相对父最后仅 listbox/test 两 delta，P1004 生产闭包与新 test 未变，按原组合专家已签继承边界承接。文本可见仅有效 task 副驾入口让层、`hidden={copilotMin || copilotYielding}`、保持副驾挂载及让层时停止副驾 ESC 竞争；不以源码证明真实 GUI。**没有读取525份活/冻结实体，也未重新运行7/22、full/DOM/verify；525仅封存 manifest 身份一致。**

## 4. 原真实动作、RPC 与保护

[独立 audit](p1004-repair-gui-review-20261023-r2-audit.json)逐段请求/响应按 rpcId配对：9 对、无异常/缺响应；ask1、task.update2（prepare1 + 人修改1）、web snapshot3（两次保存后自动 + 手动1）、ask-provenance2、model status1。后两者为读 RPC，**不是又调模型**。

| 原阶段（UTC2026-10-23，对应本地+08） | 实际原件结果 |
| --- | --- |
| prepare `00:00:24.434 / .521`，rpc33334f71-6bf0-4351-b5a6-bba318418a04 | 当前合法F5 t6负责人/47，通过正常 TaskForm 唯一主save准备空字符串/0；真实 `kind=success`，随后表单关闭、toast/DB0 |
| prepare outer1 | 末段 reader错误期待 `assignee null`，实际 `''`；[原错误](../../reports/all-pending-evidence-20261021/P1004RepairGuiR2/p1004prepare-error.json)/stderr保留，不能将成功保存判成产品失败 |
| ask `00:01:29.986 / 00:01:30.550`，rpca56d4ad3-a042-44f3-92c0-b0295a34039a | 新 helper先只读核原success/0/空字符串，不重save；真实副驾发 `/pm ask p-0001`，旧答未指派/0 |
| gateway `00:01:30.533` | appended恰1，sequence23、`/v1/messages`，含当前真实t6 todo0、合法当前项目/日期/accepted交付物上下文；非手写页面快照或写库seed |
| 人修改 `00:03:02.299 / .332`，rpc8a3b4806-1e4c-4f12-b54a-4225ac85b2b1 | 正常最小化副驾→原TaskForm负责人/47草稿→唯一主save实际success；draft态DB仍空/0 |
| 手动refresh `00:03:02.597 / .601`，rpc8f964458-f200-4b4d-947f-38b7d9d170c8 | 仅 `/pm web snapshot`；返回t6逐结构等保存后原raw，未重ask；旧答保留、最新负责人/47/数据截至08:03:02 |
| 首次打开 `00:03:03.089` | 正确t6、title焦点、负责人/47，sidecar hidden=true；真实 elementFromPoint中心命中 title input |
| cancel / X / keys 三段 | request均[]；每段前后44根指纹全同；无修改/未提交退出零写，副驾恢复且原答/最新投影保留 |

正常主修改前的最小化是原旅程的人表单修改步骤，**不是首次从刷新卡打开 TaskForm 后手动最小化洗绿**。第一次打开后 cancel 直接沿该同一表单执行，scrollIntoView使现有底部按钮可见，只点1次；X/keys后轮不为cancel补点。

gateway-before封件394 B，与恢复收据的 bytes/SHA全等；旧批准response与 `P1ProjectionRefreshR1/gateway-old-projection.json`逐结构相同。原helper文本显示本次ask临时使用、finally恢复原字节，actual ask outer0。本角色不读取gateway活文件，不将恢复声明扩成全机/正式零污染。

**数据保护独立实核：26态×38 raw =988份逐bytes/SHA；每态44 roots =38 raw +6 files/backups指纹。** 全窗仅t6 raw变化，其余37（包括dlv1 accepted、两L2 final、旧task-done、资料与元数据/两个provenance设置）逐字同；files/backups6前后指纹同，未交它们raw，不声称实际附件字节读回。

初末t6仅`updatedAt`不同，原负责人`P1004刷新负责人`与progress47已复原；prepare→人修改仅assignee/progress/updatedAt变，manualProgress早已null，本窗不变。最终updatedAt为 `2026-10-23T00:03:02.309Z`。**本窗原raw证明无provenance写，不照搬计划中“正常provenance追加”的预期。** 这些是该次保护，不重新审签旧全部data业务门。

## 5. 独立图帧、可达/退出与样式UX

以下 **12张PNG、13张原帧**实际经 `view_image`观看；179帧全部核SHA，不宣称全179帧目视/完整录屏已看。图帧与原UI/焦点/pointer/roots/RPC合证，未据Mainassert或sourceDOM单独签GUI。

| 原PNG（证据根下） | 独立观察 |
| --- | --- |
| `p1004prepare-zero-actually-saved.png` | 表单已关，实际更新toast明确负责人清空、47→0，t6行未指派/原手填0 |
| `p1004ask-old-zero-projection-visible.png` | 旧答未指派/0，原卡未指派/0，数据截至08:00:24 |
| `p1004update-human-draft-not-saved.png` | 人修改负责人/47可见；正常最小化tab仍在右缘，不冒已保存 |
| `p1004update-refreshed-old-answer-latest-card.png` | 旧答仍0，新卡负责人/47、更新旁注和08:03:02并列可读 |
| `p1004update-first-target-open.png` | 首次进入编辑任务，副驾让位，title蓝焦点环、负责人/47可见；顶部toast在上边，不遮title |
| `p1004exit-cancel-before.png` | 同一首次表单仍开，标题焦点环可见，副驾未重新覆盖 |
| `p1004exit-cancel-returned-original-card.png` | 表单退出，原答0与最新47原卡保留，副驾已自动恢复 |
| `p1004exit-x-first-target-open.png` / `p1004exit-x-returned-original-card.png` | 再开正确表单，顶部X可见；退出回原卡，不需人工展开 |
| `p1004exit-keys-first-target-open.png` | Enter后正确t6表单、title蓝焦点环 |
| `p1004exit-keys-target-native-tab.png` | title不再高亮，description蓝焦点环，未离开表单/落隐藏副驾 |
| `p1004exit-keys-visible-return-focus.png` | ESC后原卡保留，“打开任务”蓝焦点环可见；不只BODY/DOM焦点 |

| 原帧（`frames/`下） | 独立观察 |
| --- | --- |
| `p1004update-40.jpg` | 首次正确任务title/负责人/47无遮层，蓝焦点环；toast不遮title |
| `p1004exit-cancel-0.jpg` / `-2.jpg` | 首次表单标题焦点、负责人/47可见，副驾让位保持 |
| `p1004exit-cancel-4.jpg` | 同表单滚至资料/日志与底部取消，按钮露出，无副驾挡点 |
| `p1004exit-cancel-8.jpg` | 一次取消后原卡与旧答/最新值保留 |
| `p1004exit-x-0.jpg` / `-4.jpg` / `-8.jpg` / `-16.jpg` | 原卡→正确t6进场→回卡→稳定原卡；-4是动画，不能凭其透明态另造持续遮层缺陷 |
| `p1004exit-keys-0.jpg` / `-9.jpg` / `-17.jpg` / `-29.jpg` | 原卡→title蓝焦点→description蓝焦点→ESC回原卡/打开任务蓝焦点 |

首次稳定title bbox为x909/y163.63/498×36.30，dialog x880/y0/560×718；原探针中心命中title且hidden=true。取消按钮中心实命中“取消”；X中心命中其path，由按钮contains判定目标正确。三轮返回opener bbox x1300.875/y550.883/83.125×32.297、centerHitsFocus=true、hidden=false。pointer退出outline为none，**不将其0px吹成键盘可见焦点环**；keyboard返回outline solid2px/rgb(122,170,255)，原PNG/帧确见蓝环。

在这个深色/当前尺寸接缝，操作入口、标题、当前字段、返回卡与更新提示清晰，无旧副驾挡主交互面，支持有限GUI/样式UX PASS。未测新视口、浅色、文本缩放、长内容/其他consumer，不启用待表决矩阵，不新开全局样式门。

## 6. 真实收据与自有验证

运行环境macOS/bash、nvm Node **v22.23.3**；pnpm11.28.5仅既有环境约定，未调用。仓库根各条独立执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/p1004-repair-gui-review-20261023-r2-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p1004-repair-gui-review-20261023-r2-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p1004-repair-gui-review-20261023-r2-reader.mjs format
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p1004-repair-gui-review-20261023-r2-reader.mjs seal
```

| 动作 | 实际结果 |
| --- | --- |
| 自有 `--check` | 0，仅reader语法，非产品检查 |
| 自有audit首次 | 1，parent27899/child27901；误加sourceMap末换行为35 B，声明34 B；未生成成功audit，原失败收据保在自有/tmp |
| 仅修自有reader后audit | **0**，parent27938/child27940；1314/179/26/988、9对RPC、2task.update、1ask、errors=[] |
| format / seal | 实际终码分别见本前缀 `-command-receipts.json` 与 `-seal-tool-receipt.json`，不是本报告预填预计码 |

Main原命令均**只审原收据，未执行**；完整argv、cwd、时间、stdout/stderr在audit.commands。其形式为绝对Node + `docs/plans/2026-10-23-p1004-gui-r2-<action>.mjs`：

| action | 原parent / child PID | 真实status |
| --- | --- | --- |
| prepare | 24712 / 24713 | **1**，实际保存success及后置reader误期望分层保留 |
| ask | 24914 / 24915 | 0 |
| update | 25088 / 25089 | 0 |
| cancel | 25752 / 25753 | 0 |
| x | 25794 / 25795 | 0 |
| keys | 25932 / 25933 | 0 |
| seal | 26799 / 26800 | 0 |

全部原signal=null，时间不重叠，原outer修正按`r.pid`及显式argv实录，不混前F02的缺argv收据，也不要求追证旧timing全部0。封件helper表明退出动作各一次；独立判断结合原图帧与零RPC/roots，不采信其自有成功assert为最终GUI结论。

只读探索cat/sed/grep/ls/Node解析：`rg`实际127不可用后改grep；一次误预估frozen-source前缀的ls为1，随后按index真实`frozen-source/src/...`定位，只读纠正，不要求产品补测。一次结构预览输出过大后改有限字段；未读取工具活runtime/凭据。全部本角色实际核证命令/终码、失败原因见本前缀收据；同步工具未提供的PID不补造，自有reader真实process.pid/ppid另录。

## 7. Exact Remaining 与 released / STOP

1. **当前原P1004首次遮层/直接退出缺陷已有限关闭。** 不重ask、不重save、不重prepare，不因旧prepare设施1或本reader设施1把已绿产品门永久停止。原r1保持历史FAIL，其修复结果由本件替接，不覆盖原件。
2. **唯一该接缝未执行原步：native Tab 到 opener。** 本包keys.observations.tabs只有1条且初态已是“打开任务”；helper先判断reached后break，`keyboard.press('Tab')`在break之后，因此入口Tab实0。Enter、目标内Tab和ESC真实发生且有焦点原证，有限签这些，不签“Tab到opener”或完整B8。
3. **最小补原证，不是重跑全链。** Main若要关闭这一原步，只在同已认领字节/上下文/当前原卡，留自然前一焦点→native Tab到opener的输入/焦点/可见帧及零RPC/roots原证；不用新ask、主save或fixture重建，不加视口/consumer矩阵。若已有同候选原证可补交，专家只审该小段。不把这个NOT_RUN包装成产品FAIL/MANUAL_PENDING或宣布父暂停。
4. 其他六修/F01/P3004/F02/fullP1/B8其余条目及父commit依原专家/原状态汇合，本件不重审、不新增门、不代父总出口；Main继续已授权不受影响工作。

输入保护仅本audit列1333件，终封逐件再核；仓库唯一新增本`p1004-repair-gui-review-20261023-r2*`报告/audit/收据/seal。自有reader/失败/实际进程收据保在/tmp；不删除或覆盖其他成果。不接触builder、GUI、桌面、浏览器、端口/profile、业务活根或Main在途证据，不执行产品测试/GUI/Git/spawn。

**released / STOP：本轮有限审证与终封后通知Main，释放自有写面；不持有任何共享资源锁，无自有未决执行进程。不commit/push/tag/release/正式切，不冒父目标完成。**
