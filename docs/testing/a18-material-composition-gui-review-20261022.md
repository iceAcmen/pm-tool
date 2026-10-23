# A18 资料组合主保存有限 GUI 审证

> 给负责人、Main 与独立测试接续者使用：仅判 RA-M01 已保存任务的 basic + 原链接备注 + E1 修订组合主保存。2026-10-22，平台 trae，独立审证角色；Main 是原 GUI 采集者，不是本报告审签者。

## 1. 有限结论

**A18-M01-COMPOSITION：有限 PASS。** 原图支持真实编辑输入、主保存提交中/成功关闭、新标题重开及取消关闭；原 POST/run-done/raw 支持同一命令组合保存、历史保全、重开保留与取消零写。本结论只覆盖下表的实证层次，不签 RA-M01 全量视觉、整材料门、整包或发布。

| 已采子范围 | 独立结果 / 证据边界 |
| --- | --- |
| basic 标题 + at-1 备注 + E1 edit 入 draft | 有限 PASS：真实输入帧与 compose 零命令、四根零变、原任务 raw 等值。资料区“保存”与“保存修订”仅入草稿，不是提前业务提交 |
| 一次主「保存更改」 | 有限 GUI/data PASS：一次 task update，单层 draft 同含 updateNote/progressOps edit，后续 snapshot 只读；原图出现提交中、任务已更新及抽屉关闭 |
| E1 rv1..3、E2 两版软删、E3、四 attachments、交付物冻结、file_assets 与字节 | 有限 DATA PASS：逐字段/指纹保全，只有标题、at-1.note、append rv4 及任务 updatedAt 改变；不冒称全部历史已展开目视 |
| 重开同 t-0001 | 标题有限 GUI PASS；备注、作者、日期、rv4 正文与“四版”标记为 DOM/raw 回读 PASS。**重开资料/历史全量目视 BLOCKED**：原 PNG/帧视口在基础区，未滚到这些内容或展开历史 |
| 重开后 clean cancel | 有限 GUI/data PASS：取消后抽屉消失，零 POST/run-done、四根零变，任务包含 updatedAt 与保存后完全相同；不签 dirty 保留/放弃分支 |

本范围未发现确证产品 FAIL。旧 `save-1792633797652` 的 `exit1` 是错误 footer selector 找不到“保存”，不是产品保存失败；原失败完整保留，不将其输出改绿。RA-M02 两种非法组合、RA-J03 新任务/两资料/进展/真文件旅程、RA-M03/04/06/07 及 RA-J04 完整旅程不由本件关闭。Main 未自判 PASS，剩余分工及最终普通 commit 继续由协调者按既有授权与总门执行，本角色不执行 commit。

## 2. 范围与依据

本次负责人限定：“独立A18资料组合主保存GUI有限审证，非开发/GUI”，仅可写 `docs/testing/a18-material-composition-gui-review-20261022*` 自有 audit；禁止产品、其他 testing、livingdocs、build/install、GUI/services/credentials/commit。该明确范围优先于通用接手流程，不 fetch/pull 合并脏树，不更新共用文档，不运行产品回归。

只读依据：[AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[RA-M01 原旅程](remaining-journey-cases-20261021.md#3-资料修订与原子写)、[原 materials AUTO](materials-files-reports-independent-auto-20261021.md)、[Oracle 纠正](materials-files-reports-independent-auto-20261021-oracle-correction.md)、[GUI 交接](materials-files-reports-independent-auto-20261021-gui-handoff.md)、[原余项台账 RA-M01](remaining-acceptance-delta-20261022-ledger.md#3-材料文件与汇报)与[持续执行记录](../../reports/all-pending-acceptance-execution-20261021.md)。不倒签旧 AUTO/GUI，不把同源转述当独立证据。

原件根：[material-composition](../../reports/all-pending-evidence-20261021/A18/material-composition/)；[index](../../reports/all-pending-evidence-20261021/A18/material-composition/index.json) 292 个原文件（不含自身），含 136 个真实 CDP compositor JPEG 帧、11 个 PNG、六段步骤、执行脚本与 observations。全部字节数/SHA256及清单集合独立复核一致；未改原件、未重跑 collector。

## 3. 候选与合法初态

| 层 | 精确认领 |
| --- | --- |
| 基线/未提交候选 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；A18 patch SHA `1b2becbaa4c910d0d7052ec42127bd3856e57cf49d30c72ec4d3ad55a6921fd4`。HEAD 不是 dirty 产品身份 |
| 冻结目录 | `/private/tmp/pmtool-a18-closure-20261022`；candidate SHA `2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9`；520 输入及 453 产物逐个匹配，未构建 |
| 宿主/运行实例原记录 | 宿主 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；3248/PID63429，plugin 指向 A18 冻结包；只读 host-start/ready，不作实时探活或启停 |
| 下发完整绑定 | combo 2584301 bytes，SHA `b4a54301e085753ab4193ae1284156ac779064ec097d7e775970a3d6a9e9f708`；client SHA `9ab0c3e0d94751870a53507530d899d4a711bda4fbe5c2b474ebd66127cc06bb` |
| 唯一完整 client 段 | 1705469 bytes，SHA `21d941ca10d41935a5416b58f6da29f2b5520e8bf93396e850de526a68eea343`，first875361/second=-1；归一化末尾注释后完整匹配，不是关键词或 HTTP200 替代 |
| 浏览器上下文 | target `BA817F66FCE81BD58357C4B50BFFDF2C`，origin3248，timeOrigin `1792629512672.7`；六步同上下文。实际组合采证 1440×718、dark、DPR2；loaded 初始 1440×900，不能把 DPR/帧比例说成原生200% |
| F5 | 原专家标准 backup SHA `8f9bf659a59077af3753900b9fec43dbca752673e59516d025f649a1982f8b4c`；本轮原 t-0001 attachments/progressLog 与其完全同。此前标题已有正常编辑、库已有其他旅程记录，不声称全库仍是初始 F5 |

初态 E1=`pl-1` 三版 active、E2=`pl-2` 两版且 deletedAt 原值、E3=`pl-3` 一版 active；at-1 链接、at-2 冻结交付物 v1、at-3/4 真文件 fa-0001/2。两文件各22字节，hash分别为 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`、`875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`。不混用另一包碰号 task/pl ID。

## 4. 六步原链与写入核对

| 时间顺序 / 原目录 | exit / 命令与落盘 |
| --- | --- |
| open-1792633717128 | 0；原 t-0001 打开，零请求/事件，data/files/backups/exports 全等 |
| compose-1792633754552 | 0；标题 + at-1 note + E1 作者/正文 edit；零请求/事件，四根全等，任务 raw 与 open 完全同 |
| save-1792633797652 | 1；`Error: visible target missing: 保存`；零请求/事件，缺 after 原件不补造。compose after、失败 before、真实 save before 清单相等，支持失败间隔无持久业务写 |
| save-1792633845858 | 0；真实 task update + 只读 snapshot，2 POST/4 run-done 事件；唯一业务变化 t-0001，另宿主 session 日志变；字节/备份/导出零变 |
| open-1792633874373 | 0；同任务重开，零请求/事件，四根全等；原 fields/materials 与保存内容一致 |
| cancel-1792633889539 | 0；clean cancel，零请求/事件，四根全等，raw 保存后完全同 |

真实保存命令 `cmd-2b310026-52` 对应 seq105/106，成功；snapshot `cmd-2b310026-53` 对应 seq107/108，成功。POST 与 run 参数逐字一致，snapshot 的 t-0001 与已存 wrapper.record 完全同。[完整 POST](../../reports/all-pending-evidence-20261021/A18/material-composition/save-1792633845858/requests.json)、[完整 run-done](../../reports/all-pending-evidence-20261021/A18/material-composition/save-1792633845858/commands.json)。

同一 payload 的 `draft.attachmentOps=[updateNote at-1]`、`draft.progressOps=[edit pl-1]`，没有 raw attachments/progressLog 数组覆盖、嵌套第二层 draft 或第二条业务命令。snapshot RPC与宿主日志不是“双业务写”。真正保存点只有主「保存更改」。

原任务文件 SHA 从 `1ee32a0238e89fd618892c56d523ceba000bbc9cc110f6096e9a3354a816971a` 变为 `edd07216aeaa0d3ef5b8aedb1c3def2be5f89d873f2e0f0e7532ef2dafa7aac5`，与自有 audit 中 savedTaskSHA 相同。逐字段变化仅 `title/attachments/progressLog/updatedAt`：标题=`QA 组合保存 基础字段与资料进展`，at-1.note=`QA 组合保存原链接备注`，E1 只追加 rv-4。

rv-4 正文=`QA 组合保存 rv4 正文；既有版本必须保留。`，author=`测试甲组合`，date=`2026-10-21`，revisedAt=`2026-10-22T01:50:49.991Z`。date 沿用 E1 当前 rv3 的日期，不伪称“今天10/22”；entry 外层原 author/date/createdAt/refs 保留。rv1..3 完整原样，E2 两版及 deletedAt、E3 全字段、at-1 其他键、at-2 frozenName/frozenVersion、at-3/4、legacy evidenceUrl/deliverableId、其他任务/所有未涉业务表及两 file_assets/文件根指纹不变。

## 5. 目视范围与缺口

实际只用 `view_image` 查看归档原图，不操作浏览器。已目视原 open/compose/save/reopen/cancel PNG；compose 帧000020新标题、000029备注编辑中、000036完整新备注、000040旧当前rv3、000063修订输入中、000068完整新正文/作者/10/21；save 帧000000/000001旧列表、000006主按钮“提交中…”；reopen 帧000002为动画中，稳定标题以 actual.png 为准。没有把动画重叠当静态布局缺陷。

[修订完整输入帧](../../reports/all-pending-evidence-20261021/A18/material-composition/compose-1792633754552/frames/000068.jpg)、[原保存成功图](../../reports/all-pending-evidence-20261021/A18/material-composition/save-1792633845858/actual.png)、[原重开标题图](../../reports/all-pending-evidence-20261021/A18/material-composition/open-1792633874373/actual.png)、[原取消关闭图](../../reports/all-pending-evidence-20261021/A18/material-composition/cancel-1792633889539/actual.png)支持有限操作与可见终态。

compose 末图仍显示旧链接备注/旧rv3，details 标“待提交2项变更”；不把它说成已持久回显。重开 details/actual.json 已含新 note、测试甲组合/10/21/新正文/历史4版，但这些位于原截图视口外，本件只签 DOM/raw 回读，不签重开全部材料文字独立目视，更不签逐版历史/软删列表展开。未建立完整宽深缩放/键盘/UX矩阵。上述缺口保为有限 BLOCKED，不是产品 FAIL，也不借此重跑采集或改产品。

如原分工需要关闭重开文字目视缺口，必要最小补件只是在明确绑定的同候选/目标/初态上 clean 重开同任务，正常滚到资料与进展区域，采新 note、新作者/date/rv4/四版标记真实原图及页面状态，再 cancel 并交前后四根与原命令。不得重保存、重播整旅程或覆盖本轮；逐版历史未展开不自动成为本 RA-M01 组合 PASS 的新前置。本角色不执行补采；若实例/候选已变，先登记差异与当前合法回读，不能用 A19 新上下文冒充原 A18。

## 6. 自有审计、保护与释放

运行环境 macOS/darwin + bash + Node `v22.23.3`；项目约定 pnpm11.28.5，本角色未执行 pnpm/install/build/产品verify。仓库根实际命令与结果：

```sh
node docs/testing/a18-material-composition-gui-review-20261022-audit.mjs freeze
# exit0，1285个限定保护文件，-before.json
node docs/testing/a18-material-composition-gui-review-20261022-audit.mjs audit
# exit1，38/40；自有额外严格帧时间单调断言两项失败，-audit.json完整保留
node docs/testing/a18-material-composition-gui-review-20261022-audit.mjs audit-r2
# exit0，40/40；原件/候选/写入不变量一致，-audit-r2.json
node docs/testing/a18-material-composition-gui-review-20261022-audit.mjs seal
# 结果以-seal.json为准；核限定保护与本前缀成果指纹后释放
```

首自有 audit 将 CDP metadata.timestamp 严格单调追加为要求，实际三处倒序如下。数值来自原 frames.json，不凭 Main 口述或 r2 绿反推首红原因：

| 原目录/帧 | 前帧 timestamp | 该帧 timestamp | 差值 |
| --- | --- | --- | --- |
| open-1792633717128/000005.jpg | 1792633721.737042 | 1792633721.725514 | -11.528ms |
| compose-1792633754552/000058.jpg | 1792633762.187523 | 1792633762.172341 | -15.182ms |
| compose-1792633754552/000061.jpg | 1792633762.340294 | 1792633762.325818 | -14.476ms |

首红具体触发项是帧时间单调，不是 origin/timeOrigin 或视口不一致；框架 observe 的滚动位置/截图范围不等于导航重载。loaded 与六步 timeOrigin 相同，支持同实例接续，不扩为浏览器无任何 reload 事件的全程审计。严格帧时间单调不是既有 RA-M01 合同；r2保文件顺序、有限时间戳、逐帧hash及真实compositor身份，另外完整列出倒序，不改排序/原文件/旧失败，也不推测CDP内部倒序原因。136帧均核指纹，但**未声称逐帧全目视**；业务断言首轮也均绿。框架不同滚动与1440×718实际viewport原样单列，不混1440×900初始loaded或宽深缩放矩阵。

[自有 r2 审计](a18-material-composition-gui-review-20261022-audit-r2.json)、[首失败审计](a18-material-composition-gui-review-20261022-audit.json)、[审计脚本](a18-material-composition-gui-review-20261022-audit.mjs)、[释放封签](a18-material-composition-gui-review-20261022-seal.json)为本角色成果。限定保护包括指定原证、A18冻结src/lib与声明输入、原fixture及合同，不包括 Main 当前在途文件、依赖、实时库或全盘；不能据此宣称全盘零变。本角色仅写本前缀，不读取凭据、不操作服务/GUI、不commit/push。

下一步按既有分工由原协调者登记此有限结果，保留重开材料/逐历史目视缺口及 RA-M02/RA-J03 等原余项；受影响候选变更须沿接缝diff重认领。本角色审证释放不停止任何共享进程、不重跑collector、不扩大到新的测试或最终提交。
