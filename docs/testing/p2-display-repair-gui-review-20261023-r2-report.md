# P2 出站位与 KR 展示修复独立 GUI 审证 R2

2026-10-23，平台 `trae`；独立 GUI 原证审证专家，非开发、非 GUI/产品测试执行端。Main 唯一 builder/GUI/桌面执行端。本轮审结后 `released / STOP`，不停止父持续工作。

## 1. 有限裁决

| 原接缝 | 本轮裁决 | 精确范围 |
| --- | --- | --- |
| P2002：真实 audit → A 顶层/状态分组出站位、B 隔离、编辑取消、刷新/重进/reload | **PASS_LIMITED_GUI** | A 七个真实顶层任务及状态分组七行各一 slot；B t-0002 未导出、不借 A；当前长标题原编辑可达 |
| P2002：真实任务子层及有子任务父行折叠/展开 | **BLOCKED，未采证** | A 七项 `parentId` 全为 null；状态分组 `.pt-row` 不等于树子层，不把此项改绿或判产品 FAIL |
| P2004 / P2OKR-R1-01：KR 自身 related 树中可见 | **PASS_LIMITED_GUI_REPAIR，定向关闭展示遗漏** | 合法既有 KR 仅挂 F5 主 A，已定稿，自己的第二目标关联精确 ID 恰一行邻接；第二目标独立；切离重进及真实 reload 后同 |
| P1004：恢复旧撤销批次处理卡，自然前一控件 → native Tab 到 opener | **PASS_LIMITED_GUI_CURRENT_RESTORED_CARD** | 本轮确有“刷新”→一次原生 Tab→“打开任务”，蓝焦点环可见、零 RPC/根变化；只签当前恢复的处理卡 |
| P1004 原 §7 同原 ask 卡/上下文的继承 | **BLOCKED（对象连续性未证），不冒同链关闭** | 原 ask 正文跨此前 reload 未恢复；当前是旧撤销批次处理卡，不是原 ask 卡。相同任务/值/源码不证明相同问答上下文 |

当前充分接缝未发现新增产品 FAIL；原 P2002 GUI FAIL、P2OKR-R1-01 历史 FAIL 和 P1004 原失败原件全部保留。P2OKR-R1-01 由新证据定向替接，不改写历史。**不签整 P2002、整 P2004、第 6 组、完整 B8、父组合全部门或 ordinarycommit。**

## 2. 授权与方法

负责人本单原句的角色、写面与停止范围：

> 父持续原授权所有已实现未验独立收口到本批ordinarycommit，无新增暂停功能/push/tag/release/正式切，Main唯一builder/GUI/桌面。你独立GUI原证专家非开发/GUI执行/产品测试执行。唯一新写 docs/testing/p2-display-repair-gui-review-20261023-r2* 与自有/tmp内置fs/path/crypto/assert reader及真实outer；其余只读。
>
> 只裁当前充分接缝有限PASS/FAIL/BLOCKED和最小原余项，不签整P2002/P2004/B8/父commit。原失败保、不发明新oracle/局部严重度豁免、不迫重已有有效全回归。完成独立report/audit/seal/真实tool收据/readback后STOP/released；可以具体指出原缺口但不得停父工作。通用SOP fetch/build/livingdocs收尾被本限单替代。

依据 [AGENTS](../../AGENTS.md) §6A、[collaboration](../collaboration.md) §9/§11，仅落实 [P2002 SOURCE/AUTO R2 §6](p2002-outbound-slot-source-auto-20261023-r2-report.md#6-原门继承与-main-尚欠)、[P2004 SOURCE/AUTO R2 §5](p2004-kr-related-source-auto-20261023-r2-report.md#5-main-新-host-gui-清单)、[原 KR GUI R1 §6](p2-okr-habit-remaining-gui-review-20261023-r1-report.md#6-p2okr-r1-01-最小红--修--复验合同) 和 [P1004 原 §7](p1004-repair-gui-review-20261023-r2-report.md#7-exact-remaining-与-released--stop) 的小段。

本角色只执行自有 `/tmp/p2-display-repair-gui-review-20261023-r2-expert-*` 内置模块读字节/解析/哈希与封存回读，`view_image` 查看原 PNG/JPEG。封包内 Main helper/harness/executor/outer 仅文本及哈希，未 import/eval/run；没有产品测试、浏览器探测、端口探测、build/install/verify/vitest、Git/fetch、服务/桌面操作、子进程 spawn、凭据或活 runtime/privatefreeze/正式根读取。父 commit 授权不下放给本专家。

## 3. 封包、候选与实际下发

唯一新 GUI 封包为 [P2DisplayRepairGuiR2](../../reports/all-pending-evidence-20261021/P2DisplayRepairGuiR2/index-r1.json)。

| 核验对象 | 独立实核 |
| --- | --- |
| index | 312387 B，SHA256 `99dd2f8dc70237b661c6302fce011723dc7c9a8925429dbaad402409b5b0d852` |
| 1761 普通成员 | 全部 bytes/SHA 一致；物理成员集合一致、无软链/越界；另有 index、seal、随后真实 seal2 outer 三件 |
| Main seal / actual outer | seal 保持 GUI 待审；首 seal 真实 **1**，seal2 真实 **0**，parent31847/child31848，不由 summary 推造终码 |
| 候选 | `CombinedF02RepairR2`，baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，source124 / complete525 / version0.7.4 |
| 五 binding/manifest | combined-candidate、source-files、complete-inputs、built-artifacts、activation 全部原字节；另有525项 complete-inputs-binding，逐条与 complete manifest 一致 |
| 宿主实例 | 封存 activation 为3269 / PID22463，E2E=`0`、pilot默认OFF；profile/运行路径仅作为元数据，不访问 |
| GUI 35态 | origin均 `http://127.0.0.1:3269`；1440×718、outer1440×857、DPR2、深色；不冒200%文本缩放或新矩阵 |
| 真实 reload | `1792714727263.3` → `1792715591439`；同源但 timeOrigin 真改变。视图切离重进本身没有声称 timeOrigin 改变 |

六份实际 frozen-source 与 complete 输入逐 bytes/SHA 相符；其中五份也在 source124 的变更清单，未改 `okr-model.ts` 不在该变更清单，但在525完整输入中。**不在 changed-source 不等于缺源码。**

| `frozen-source/` 下文件 | B / SHA256 |
| --- | --- |
| `src/index.ts` | 21961 / `43d9c3f0ef754143f2082357695b708be048b8bcaf6975205dd9b9ce58e3f299` |
| `src/client/panel.tsx` | 191954 / `341675c4dd31b87d05264de520a4c198edbb3c3476f2f87d8f38cc80ba1d83d6` |
| `src/client/views/tasks.tsx` | 77665 / `5639b455c452d69686355e8b4e65daa1d91b82ef9965a5f085074d044a7771e6` |
| `src/client/views/tasks.css` | 46510 / `369019753cdb985016afa17c21c5bc96dd5f1ae19b7bca3a2641246c117d2583` |
| `src/client/views/okrs.tsx` | 9854 / `122516a490b80da4a2fc9da0da66fb1283062efb3c54827c8a8399e3a28bc128` |
| `src/client/views/okr-model.ts` | 6463 / `1fb062b742aa6eed6c2c4db8ab834aa192114e8d03cc5162be6fe9ab947c4c1a` |

只额外读取必要 F02RepairGuiR2 的 activation/browser-script-binding 和 `browser-script-2.js`，**未重审其1457包**。两个 activation 逐结构/原字节同。真实合并响应2599193 B、SHA `b3366523782e3caf167ea5173b0a2a79765a01f8b8b68a922cd2b1f074164312`；offset875361提取1720359 B、SHA `682647fb67cafca6e97e8d80bce0bae983b46da135873ebe316c86e758a44058`。补实际34 B无新增换行的 sourceMap 尾注，重建1720393 B、SHA `3be9d4a0bbc595bb0038e50787d33d38d47120237f7ab93fba40d1dc624f8159`，等封存 built client。

[原组合回归独立报告](f02-combined-regression-review-20261023-r2-report.md) 的 SOURCE/AUTO 与 [真实 seal 工具收据](f02-combined-regression-review-20261023-r2-seal-tool-receipt.json) 只沿原有效范围继承：full162文件/1707、DOM6文件/41、special2文件/7、95 verify、guard/close有效；本轮未重跑，不以其绿替 GUI。本角色没有读525份主树/私有冻结实体，只核封包携带的 Main 主冻完整核验和六份必要源。

## 4. 真实 RPC 与零写

[独立字节审计](p2-display-repair-gui-review-20261023-r2-audit.json) 重新配对10份 events 中 **10对请求/完整响应**，rpcId唯一、无缺失/孤儿，捕获 exception0：

| 原真实命令 | 次数 | 结果/边界 |
| --- | --- | --- |
| `/pm web snapshot` | 4 | 进入PM、A刷新、B刷新、真实reload；`kind=success`，A最新at/format、B=null均精确同raw |
| `/pm ask-provenance p-0001` | 2 | 既有处理卡恢复/回A只读；不是调用ask模型 |
| `/pm ask-provenance p-0002` | 1 | B项目只读，不借A |
| `/pm model status` | 3 | 能力读；不是新问答 |
| 原 ask / task.update / OKR写 / export / archive | **0** | 本包没有重ask/save/confirm或fixture新写 |

35态时间窗 `2026-10-23T00:25:10.154Z` 至 `00:33:12.809Z`，每态44 roots，其中38业务raw全部实读：**1330份逐bytes/SHA与当态root一致，全部35态与初态同，34段相邻差分0**。任务、audit/sent/archive、OKR、provenance及全部保存的settings均在保护中。其余6个files/backups仅收到指纹，未读附件实体；不扩大成全盘/正式/全时原子零写证明。

所有四次 snapshot 的任务原记录与sealed raw逐结构同，KR primary/related/status也同。真刷新读取与客户端项目/视图切换分开，不把每次导航说成另发RPC。

## 5. 原图目视与逐接缝理由

实际 `view_image` 观看 **19张不同原PNG、13张原JPEG帧**，其中同一编辑PNG另以original分辨率复看一次。245帧全部核SHA，**未声称逐一目视全部245帧或完整录屏**。文件、原图哈希及观察在 [目视映射](p2-display-repair-gui-review-20261023-r2-visual-review.json)。

### 5.1 P2002 已证范围

sealed `pmExportAudit` 真有A六条，按绝对时间最大取 `2026-10-22T21:23:08.315Z/plain`，不是数组名称、sent/archive或计划断言代替真源。四次真实 snapshot 均返回此值，B无audit返回null。

原顶层行 `t-0001/t-0003/.../t-0008` 恰七项；状态分组同七ID、每行一slot，非分组头。目视滚到长行时，出站文案“已导出 · 最近21:23 · 外部为唯一事实源”完整可读，与右侧独立编辑入口不重叠。长标题在表格按既有设计省略，打开真实TaskForm后完整恶意文本标题/描述作为文本可见，标题蓝焦点环可见；不因表格省略另造新FAIL。

`round05-a-long-title-edit-visible` 与 `round06-grouped-edit-visible` 是实际打开原t7表单；源脚本实录点击既有编辑按钮并按Escape取消，随后原PNG表单退出、RPC零、roots同。不将它说成点击底部“取消”按钮、成功save或全键盘旅程。B原t2编辑亦可达。

`round08-b-tasks/b-refresh`、`round10-b-slot-after-reload` 实际可见“未导出”，没有A时刻；A重进与reload后七行仍同21:23。此支持有限GUI/样式/UX接缝PASS，**真实子层/折叠父不在该fixture**。

### 5.2 P2004 定向修复

sealed KR `okr-mvk2jwys-vxyg3c` 为既有confirmed，primary=`okr-mvi5z847-33y3xk`，related只含 `okr-mvk2hl7d-refwvh`，本包未重确认/保存。原新增/确认/非法输入等已有效结果不重派。

`round09-related-neighbor-visible/reentry`、`round10-related-after-reload` 及原帧清楚呈现：KR仍只在“F5目标”下，自己的关联行显示“P2同项目第二目标20261023（okr-mvk2hl7d-refwvh · 只展示，不参与权重）”，恰一行在KR框内；第二目标是独立root、没有该KR子项。源 `okrs.tsx:129` 消费 `kr.related`，不是给父root拷行；未改model:80–88将软联与主children分开。

原 SOURCE/AUTO 的同oracle RED/修后绿、相关回归和未改关系守卫沿原签字范围继承，再结合本新候选实际下发、原图、snapshot、root零写，**P2OKR-R1-01 展示遗漏定向关闭**。未新增orphan GUI矩阵、权重功能或整个RA-P2004签字。

### 5.3 P1004 小段与上下文继承

`round03-native-tab-steps` 原18次Tab只到“舒适”，`reached=false`，保留，不能称它已达opener，也不能以有限遍历未达判产品键盘陷阱。

follow实录从**现有空question input指针定位**，六次Shift-Tab逆向至opener，再一次Shift-Tab到自然前一“刷新”，**不点击刷新**，最后一次native Tab到opener。`round04-natural-previous-visible` 真蓝焦点在刷新；`round04-natural-tab-opener-visible` 与帧8真蓝焦点在打开任务，outline2px/solid/rgb(122,170,255)。该段0RPC/0root，无输入发送、ask或save；不是预先focus opener。

原卡恢复后明确为“最近处理结果（AI已落库）/该批次已撤销”的旧处理卡、t6/负责人/47。**原ask正文未恢复，不冒“同原卡/原问已恢复”。** panel191954和openCopilotRecord接口未变，可支持当前相同副驾任务入口的有限动作判断；但同任务/源码不足以证明原问答卡及其邻接/焦点上下文同一，故不继承为原P1004 §7同ask卡全链。跨reload恢复ask不是本单获批新功能，不开新产品FAIL来填证。

## 6. 实际收据、reader错误与保护

环境macOS/darwin/arm64，既有nvm Node `v22.23.3`；pnpm未调用。所有自有reader仅内置fs/path/crypto/assert；没有运行任何Main脚本或产品模块。

| 实际验证 | 真实终码与原错误处理 |
| --- | --- |
| 自有index核验 | **1→0**：首轮禁读规则误拦本封包`*-raw/data`，只修自有规则限放本包副本；原失败receipt不覆盖。复核1761件全部一致 |
| 自有audit | **1、1、1、1、0**：B ask-provenance漏列、SHA字符串误当bytes/SHA对象、把source124变更集误当完整输入、sourceMap尾注误加换行35≠34；均仅修自有reader，不改证据/oracle/产品 |
| 最终audit | 实际0，PID34333；1767明列输入、漂移0、35/1330/245、10对RPC、exact ask0/写0 |
| 自有summary | 实际0，仅回读审计、原outer和自有四份失败 |
| Main 11轮原GUI outer | inspect/entry/card/tab/tabfollow/tasks/group/projectmenu/projects/okr/reload各0；完整argv/PID/始末/stdout/stderr在audit.commands，不冒本专家执行 |
| Main原seal | **1**；错误正则将`ask-provenance`误匹配为`ask`，正文保留；真实exact ask为0 |
| Main seal2 | **0**；parent31847/child31848，signal=null、stderr空、1761/245/35/变化[] |
| 本角色seal/readback | 以执行后新增真实工具收据及readback为准，不预填或由文件存在倒推外层0 |

精确命令、真实工具返回及自有失败文件指纹见 [工具收据](p2-display-repair-gui-review-20261023-r2-tool-receipts.json)。只读探索曾误读不存在`source-binding.json`，实际1；随后按真实索引定位五manifest/完整binding。首`pwd`工具login=false不支持，未启动命令、无终码。输出过大仅改为有限字段阅读，不把工具暂存输出当新获准证据。

主核证命令均在仓库根，以 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node` 执行自有 `expert-audit.mjs` / `expert-summary.mjs` / `expert-outer.mjs`；index命令为自有`expert-reader.mjs index`加上述index路径及99dd完整SHA。只读text/lines/match/json/names查询完整路径在自有reads journal，不称产品验证。

## 7. 最小原余项与释放

1. **P2002只保原子层/折叠父GUI缺证。** Main优先交同候选已有合法层级原证；若需准备合法fixture，由Main按原合同用既有命令/表单、单列其写面，只补真实子层/父折叠展开、每实际行一slot/同源与读取零写的小段。不增新功能/四视口矩阵，不以状态leaf冒子层，不要求重做历史TTL/三档导出或已有效完整回归。
2. **P2004本展示缺陷无剩余；仅定向关闭P2OKR-R1-01。** 不重做确认、非法反例、inbox/习惯或orphan矩阵，不扩大为整P2004通过。
3. **P1004当前恢复旧卡nativeTab动作有限已证；原ask卡上下文继承仍未证。** 若已有同已认领字节/原卡的小段原证可补交；没有则按原合同对象边界保BLOCKED交原门裁定。本单不派重ask/save/prepare，不发明“ask跨reload持久化”新需求，不重跑已绿Enter/表单Tab/ESC/归焦。
4. 本前缀report/audit/目视映射/真实工具收据/seal/readback是唯一仓库新写面；终封核明列输入及原件不变。全部私有输出只在自有/tmp，保留失败，不删除任何旧成果。

**released / STOP。** 本专家无builder、GUI、桌面、端口、profile、产品源码或业务根锁，无自有未决执行进程；不commit/push/tag/release/正式切。上述两个未证边界只归对应原门，不停止Main已授权父持续工作，也不代签父ordinarycommit。
