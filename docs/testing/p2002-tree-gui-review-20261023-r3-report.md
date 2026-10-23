# P2002 父子树出站位独立 GUI 原证审查 R3

2026-10-23，平台 `trae`，独立 GUI 原证专家，非开发、非 GUI/桌面/产品测试执行端。Main 唯一 builder/GUI/桌面。本件仅接 [R2 §7.1](p2-display-repair-gui-review-20261023-r2-report.md#7-最小原余项与释放) 的原父/子/折叠缺口。

## 1. 有限裁决

| 原缺口小段 | 独立裁决 | 精确覆盖 |
| --- | --- | --- |
| 真实有子任务父行、真实两子行，各一出站位 | **PASS_LIMITED_GUI_TREE** | p-0001，t-0009 / t-0010 / t-0011；展开、再展开、取消后、后续重进及真实 reload 后的已采同屏范围 |
| 父折叠/展开 | **PASS_LIMITED_GUI_TREE** | 父行保留，两个真实子行消失，再展开恢复相同 ID、归属、原编号与出站时刻 |
| 子编辑可达/取消 | **PASS_LIMITED_GUI_TREE_EDIT_CANCEL** | 仅子甲 t-0010 的既有编辑按钮打开 TaskForm；标题焦点可见，原生 Escape 退出并归焦编辑入口，未保存、零写 |
| 刷新读取同源、后续重进及真实 reload 后三行可见 | **PASS_LIMITED_GUI_TREE_READ_REENTRY_RELOAD** | 四次真实 snapshot 与 sealed raw 同；后续重进与 reload 原 PNG 中三行同屏 |
| “刷新完成当态父/两子三行已目视可见”的表述 | **BLOCKED，仅该原图缺证** | `round03-tree-refreshed.png` 和该段末帧停在页首，三行在视口下方；DOM、RPC 同源不替该当态目视 |

充分已采范围未发现新增产品 FAIL。**不签整 P2002、整 P2、B8 或父 ordinarycommit。** 原 FAIL、R2 子层未采记录和 Main 首次准备失败均保留；本件以新证据有限替接，不改旧档案，不按轻重豁免。

## 2. 授权、角色与方法

负责人本单原句：

> 父原授权所有已实现未验独立收口至本批ordinarycommit，Main唯一builder/GUI/桌面；无push/release/正式切。你独立GUI原证专家非开发/GUI执行/产品test执行。唯一新 docs/testing/p2002-tree-gui-review-20261023-r3*和自有/tmp内置reader/真实outer，其他只读。本单替代通用fetch/install/build/livingdocs/git。
>
> 按 docs/testing/p2-display-repair-gui-review-20261023-r2-report.md §7仅原P2002父/子/折叠GUI缺口审。
>
> 只读核708/roots/raw、独立RPC配对、view_image实际PNG/帧；禁止运行Main脚本/helper或产品/浏览器/网络/端口、读取runtime/private/profile/正式数据。
>
> 仅裁此原缺口有限PASS/FAIL/BLOCKED，不能签整P2002/P2/B8/父commit，不重原TTL/导出/顶层/B/状态group/KR/ask。若仅能签已采范围请精确剩余不加新oracle/矩阵。真实seal/readback收据后STOP/released，父持续。

依据 [AGENTS §6A](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[P2002 SOURCE/AUTO R2 §6](p2002-outbound-slot-source-auto-20261023-r2-report.md#6-原门继承与-main-尚欠) 和上述 R2 §7。

只用自有 `/tmp/p2002-tree-gui-review-20261023-r3-expert-3YvzRR/reader.mjs`，import 仅内置 fs/path/crypto/assert；实际外层收据来自 `exec_command` 观察到的终码，未 spawn 子进程。Main executor/harness/seal 原件仅文本阅读和字节核验，未 import/eval/run。没有产品、浏览器、网络、端口、桌面、Git、install/build/verify/vitest 操作。`runtime/private/profile` 路径和 PID 只作为封存元数据，不访问或探活；仅核仓库封包内 `*-raw/data/pmtool` 副本。

研究技能仅采用原证优先、冲突明示方法；没有联网检索、第三方依赖或 vendor 执行。同 Main 来源的多个原件不冒独立来源数量；独立性是执行端与本审签者分离。

## 3. 708 封包与候选绑定

唯一新封包：[P2002TreeR3/index-r1.json](../../reports/all-pending-evidence-20261021/P2002TreeR3/index-r1.json)。

| 对象 | 独立实核 |
| --- | --- |
| index | 118235 B，SHA256 `605af75dc633eef8215e9c96eec94cd3852f74f392b89f729390117c1ffad64c` |
| 成员集合 | 708 普通成员逐 bytes/SHA 全同；物理 711 = 708 + index/seal/随后 outer；无软链、越界或未列成员 |
| Main 实际 seal outer | status **0**，signal=null，stderr 空；parent37002 / child37003，原 stdout 也绑定708/上述SHA |
| 候选 | `CombinedF02RepairR2`，baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，source124 / complete525 / version0.7.4 |
| 同候选继承 | candidate/source-files/complete-inputs/built-artifacts 四 manifest 与封存原组合逐字节一致；activation 与原 R2 GUI 逐字节一致 |
| 实例元数据 | 3269 / PID22463，E2E=`0`，pilot 默认 OFF；不是本角色现场探活 |
| 当前必要源 | frozen-tasks.tsx，77665 B / `5639b455c452d69686355e8b4e65daa1d91b82ef9965a5f085074d044a7771e6`；等 complete manifest 及原 R2 封存任务源 |
| 实际下发继承 | activation 绑定 client1720393 B / `3be9d4a0bbc595bb0038e50787d33d38d47120237f7ab93fba40d1dc624f8159`；沿原 R2 已审下发链，不重读私有冻结或探测浏览器 |

original-bindings 九项本地副本全核；其中七个仓库原件逐字节实比。harness/frozen-tasks 的 private 原路径不读取；任务源另由仓库 R2 frozen-source 及 complete 指纹交叉核对。source-files 是 `{baseline,count,source}`，真实条目数取 `source`，不是顶层键数。

[原组合回归报告](f02-combined-regression-review-20261023-r2-report.md)、其 seal 和 [真实 seal 工具收据](f02-combined-regression-review-20261023-r2-seal-tool-receipt.json) 指纹互相一致。仅继承原有限 SOURCE/AUTO：full162文件/1707、DOM6文件/41、special2文件/7、95 verify、guard/close；**本角色未重跑，不扩大成当前全项或 GUI 通过**。候选未变依封存 manifest、已签原候选及本单事实认领；不冒现场核525份主树或 private 实体。

## 4. 准备写与只读阶段分账

原合同允许 Main 通过既有命令/表单准备合法层级并单列写面。本包真实请求、完整响应、任务 raw 与前后 roots 交叉一致：

| 阶段 | 原命令/实际结果 | 落盘边界 |
| --- | --- | --- |
| prepare | 一次 `/pm task add`，父 t-0009 / code8 / p-0001 / parentId=null；产品嵌套 result.kind=success | 44→45，只新增父任务；随后 executor 错读响应顶层 `.kind` 得 undefined，真实 outer1 |
| preparefollow | 仅两次 `/pm task add`，子 t-0010 / 8.1、t-0011 / 8.2，parentId=t-0009；各嵌套 success | 45→47，只新增缺失两子；不重放父请求，真实 outer0 |
| 准备完成后读取 | 展开、折叠、再展开、子甲编辑/取消、refresh、重进、reload | 9 态各47根全同，8段相邻差分0；原44根均保持同字节 |

**整批有三次真实准备写，不能称整轮零写。** 子甲编辑仅打开后 Escape，未改字段/保存。audit/sent/archive/tasks/settings 等41份业务 raw 和6个附件/备份指纹均受每态保护；不读附件实体、不声称正式根/全机/两快照之间任意瞬间原子零写。

Main“12态”实际是 **12份 roots manifest = 11个 R3 新页面态 + 1份 historical original-r2-final-roots**。新态 raw **446 = 38 + 39 + 9×41**；每份逐 bytes/SHA 与其 roots 相符。准备完成后 raw369份、9×47根全同。原采证时间窗 UTC `00:53:59.134Z` 至 `00:55:27.923Z`，北京时间为同日08时段。

## 5. RPC、同源、真实重进

[独立 audit](p2002-tree-gui-review-20261023-r3-audit.json) 重配四份 events：**7对唯一 rpcId、完整请求/响应，缺失/孤儿/重复/exception均0**；不是仅采 Main summary。

| 真实命令 | 次数 | 独立观察 |
| --- | --- | --- |
| `/pm task add` | 3 | 恰父一次、两子各一次；请求 project/parent/title、响应 ID/编号/正文、raw 全一致 |
| `/pm web snapshot` | 4 | 准备后进入PM及刷新2次、树refresh1次、reload重入PM1次；嵌套 success、全部11条任务逐结构等raw |
| ask / export / task.update / save 等其他命令 | 0 | 仅对本封包采证窗，未重原 TTL/导出/B/KR/ask |

sealed `pmExportAudit.record.value` 的 A 六条原记录按真实绝对时间取最大，精确 `2026-10-22T21:23:08.315Z / plain`，原 audit itemCount7未随新建三任务伪造改为10。四次 snapshot 的 A latestExports 均同；各被采实际父/子行恰一 slot，time/title ISO精确同，显示字面21:23。不借 sent/archive/准备时刻，不重裁历史TTL。

视图切离甘特再回任务是重进，不声称 timeOrigin 改变。真正 reload：`1792716675807.1` → `1792716927215.7`，原 loader 帧、reload脚本原文本、页面态及完整RPC一致。refresh本身也没有 timeOrigin 改变。

## 6. 实际目视与覆盖边界

实际 `view_image` 查看 **8张不同原PNG + 12张不同原JPEG帧**。182帧全部核指纹及事件引用；**未逐帧目视182张或声称完整录屏观看**。逐文件指纹/观察见 [目视映射](p2002-tree-gui-review-20261023-r3-visual-review.json)。

稳定11页面态均 inner1440×718、outer1440×857、DPR2、深色。182帧原metadata中177帧1440×718、5帧reload加载过渡1440×770，scale1；保留真实差异，不称新矩阵、200%文本缩放或浅色验收。

展开、再展开、取消后及重进/reload后PNG：父与两子各自完整出站文案可读，与右侧编辑入口无重叠；父0/2完成、子真实层级由raw/DOM证实，不把诊断卡或状态行冒树子层。子编号格实际省略为“8...”，不冒8.1/8.2编号格全文目视；完整编号由raw/DOM及既有诊断引用核验。本单不新开编号格设计/矩阵门。

折叠原PNG和帧10：箭头向右，父出站位保留，两子行消失；再展开原PNG和帧17恢复相同实体。子甲真实编辑抽屉完整标题可见，标题蓝焦点环；Escape后抽屉消失，原编辑按钮蓝焦点环归还。只签子甲动作，不称父/子乙均打开过或save过，不因此追加两轮编辑。

**刷新当态缺证精确到三行目视。** `round03-tree-refreshed-rows.json` 父/子顶部为1123.38 / 1180.27 / 1357.91，均超过718；原PNG及帧50/57确实页首，不用DOM“存在”冒视口可见。随后 `round04-tree-reentry.png` 和 `round04-tree-after-reload.png` 已真实滚到三行、同源同文案；这些支持“刷新后后续重进/reload可见”，但不改称“刷新完成当态三行同屏”。

## 7. 实际工具结果与封存

环境 macOS/darwin/arm64，已存在 nvm Node **v22.23.3**；pnpm未调用。仓库根运行的自有reader：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p2002-tree-gui-review-20261023-r3-expert-3YvzRR/reader.mjs index
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p2002-tree-gui-review-20261023-r3-expert-3YvzRR/reader.mjs inspect
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p2002-tree-gui-review-20261023-r3-expert-3YvzRR/reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p2002-tree-gui-review-20261023-r3-expert-3YvzRR/reader.mjs visual
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p2002-tree-gui-review-20261023-r3-expert-3YvzRR/reader.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p2002-tree-gui-review-20261023-r3-expert-3YvzRR/reader.mjs readback
```

index真实0；inspect真实0。audit **1、1、0**：自有reader先误数manifest顶层键 `3≠124`，再误强求加载过渡帧高度 `770≠718`。只更正自有解析与描述记录；两次原失败全文/断言/真实工具收据保留在自有tmp，终封绑定。不修改产品、原件、测试oracle，不把设施错误算产品FAIL。最终audit实际0、PID38318、inputDrift=[]。

Main原外层 prepare1、preparefollow0、tree0、reload0、seal0 完整argv/PID/UTC/stdout/stderr在audit.mainCommands；本角色没有执行它们。只读命令曾两次输出过大，随后改有限字段读取自有inspect；未读取工具私有输出存放路径。辅助误选 collaboration 空行段返回0，后按真实287行定位，不补造内容。

visual/seal/readback 终码以执行后 [工具收据](p2002-tree-gui-review-20261023-r3-tool-receipts.json)、[seal实际收据](p2002-tree-gui-review-20261023-r3-seal-tool-receipt.json)、[readback实际收据](p2002-tree-gui-review-20261023-r3-readback-tool-receipt.json) 为准，未预填成功。seal自身及后续收据不循环自指纹；readback重新读取明列原件/报告/audit/目视/自有失败件。

## 8. 精确余项与释放

1. 只将已采主体原树缺口有限替接为PASS：父/两子出站位、真实折叠再展开、子甲编辑取消、后续重进/reload。没有新的fixture、产品修复或完整回归待重跑。
2. 若父汇总要包含“refresh完成当态父/两子三行已目视”的完整表述，**本包只欠这三个同ID行在该刷新后的视口原图**。Main仅沿原refresh合同滚入视口采小段，绑定同候选、原snapshot/RPC和47根零写；不得重prepare、追加save/ask/导出、发明新oracle/矩阵。此项BLOCKED是精确覆盖边界，不判产品FAIL、不扩成整P2002失败，也不停止父已授权工作。
3. 不重原 TTL/导出/顶层/B/状态group/KR/ask；它们按原独立有限签字保留，本件不替相关门重裁。父ordinarycommit仍由父协调原门汇总，不由本专家代签。
4. 仅写本R3前缀及自有tmp；保留全部原失败、不删他人成果。真实seal/readback与其工具收据完成后 **released / STOP**；无自有未决进程，不持有builder/GUI/桌面/端口/profile/业务数据锁。无commit/push/release/正式切，父持续。
