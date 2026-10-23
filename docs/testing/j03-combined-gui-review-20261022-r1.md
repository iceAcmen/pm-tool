# J03 修后三资料有限 GUI 审证 R1

> 2026-10-22，trae，不同独立 GUI 审证专家，非开发、非执行端。只读 Main 原件，签原合同实际子断言；不签整域、普通 commit 或发布。资源释放，STOP。

## 1. 有限结论

**PASS_GUI_LIMITED：修后两 link 引用可选且点击不卸载 PM、真实文件 c-3 加入、按钮取消确认后保留/再放弃零残留、同输入重建一次主保存、别名正确解析、重开资料与进展正文、22 byte 下载一致。**

没有在这些实际子断言发现新的产品 FAIL。原引用崩溃的必要红与修前 GUI 原件仍保留；本次有限修后 PASS 不改写旧 FAIL。**不签 RA-J03 / RA-M06 整项、MPRC 全部 GUI 分支或 RA-F01 整项。**

必须同时保留的缺证/限制：

- 第一轮进展追加后，08/09/10 的作者/日期/正文输入已清空，计数为待提交 4；没有该轮排队进展全文或第一轮保存载荷。可签确认取消后计数、资料行、标题等保留和实际零写，**不能签第一轮排队进展逐字段无损回读**。这不是证明正文丢失，也不新增一个产品门。
- 本包没有 M06 坏别名取消/提交 GUI 原件；该原合同子断言 **BLOCKED（本封包缺证）**，不以合法 c-2/c-3 成功替代。既有 SOURCE/AUTO 由原专家负责，本角色不重验。
- asset POST201、stage DELETE 和 download HTTP 响应/安全头没有被 helper 捕获；只签实际文件选择交付、状态清单与下载副本字节，不说全请求、全 console、所有取消分支均已捕获。
- 实际视口仅 **1458×734、深色、DPR2**；原帧 pageScaleFactor=1，不冒四视口/浅深/原生200%、完整键盘或读屏矩阵。

## 2. 授权与原合同

本角色父派单要点，保留原句：

> “父授权持续多角色验全部既有未验/确证修复/最后普通commit，无push/tag/release/正式切换。”
>
> “你是不同独立GUI审证专家，非开发非执行。唯一写面 docs/testing/j03-combined-gui-review-20261022-r1*及自有同名前证据，勿写业务/其他testing/livingdocs/Git/服务。”
>
> “请逐图目视真正范围，签原合同有限子断言，不自加更多门、不重SOURCE/AUTO/执行产品或browser；不签整域/commit/O3/ATF/备份/F01所有支路。”
>
> “r2实例冻结107可独立审，不锁Main/build，不再fetch/pull/install/tests……releaseSTOP。”

已读 AGENTS、collaboration §11、onboarding/handoff/progress 最新接续；通用 fetch/build/全回归/livingdocs 写步骤不用于这个明确限定的独立只读审证动作。只写本前缀；不把父任务最终 commit 授权当作本角色 Git 授权。

判断依据为[原旅程 §2 RA-J03 与 §3 RA-M06](remaining-journey-cases-20261021.md)，以及[原引用崩溃报告](material-progress-ref-crash-20261022-r1-report.md)、[不同专家修后 SOURCE/AUTO 报告](material-progress-ref-independent-retest-20261022-r1-report.md)、[旧材料 GUI 报告 §5 J03 余动作](material-meeting-report-gui-review-20261022-r1.md#5-保留缺口与真正余动作)。本报告子标签仅用于映射原断言，不添加测试用例或新门。

## 3. 完整性与运行绑定

原根：`reports/all-pending-evidence-20261021/CombinedGuiR1/`。下表 hash、路径与独立核对详情见[自有审计](j03-combined-gui-review-20261022-r1-audit.json)。

| 对象 | 独立核对与边界 |
| --- | --- |
| [j03-index.json](../../reports/all-pending-evidence-20261021/CombinedGuiR1/j03-index.json) | 封存时间 `2026-10-22T12:26:03.735Z`；81249 byte，SHA256 `e4833192fa8429b89d6a121eb9de1a1b1621f4b67e3b645c2ad77c3e5f455535`。声明 **468** 件，不含索引自身；468普通文件逐 bytes/SHA256全等，无缺件/变件。未来新件不纳入本签字，也不要求清除 |
| [source-binding](../../reports/all-pending-evidence-20261021/CombinedGuiR1/j03-source-binding.json) | 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + 未提交 `CombinedRepairR1/r2`；**107** 声明输入。与父 source-files 对象全等；92包声明文件在r2冻结树逐SHA重核，另15 Launcher仅保原声明，不要求当前Main全树不变 |
| 父候选认领 | [candidate.json](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/candidate.json) SHA=`1c1ba767cd365dc5eea42c31381ffb64b2f8b799238c42934c095997d7fa8156`，[tracked diff](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/tracked-product.diff) SHA=`7f0953f8ee6d8552dc6eb4405d9a7d642dbd9844c1b5971155890435be56d2a9`、[新文件清单](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/new-product-files.txt) SHA=`c694ffc5f3acd80522cb8e5963c410436969daffa261e7c0d5c62462a6752a46`。只认领原件，不运行Git或重做SOURCE审查 |
| 冻结完整输入 | `/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool` 的 [complete-inputs](../../reports/all-pending-evidence-20261021/CombinedRepairR1/r2/complete-inputs.json) **515**件逐bytes/SHA一致，package version=`0.7.4`。不是正式版本/tag放行 |
| 两处缺陷修复接续 | `task-draft-materials.tsx` SHA=`b7ecc42640705c61a8aa38630ce773c178674cf20b09477f0f5267422e2cf90c`；refs DOM测试 SHA=`73f5d1abc30d92e80b4e12156bbdbd99d422bfb0890b8cbd02b69148b4735a98`。r2与不同独立复验冻结原件逐字同SHA；仅核接续身份，不重跑原7/新5/affected194 |
| runtime/profile | `/private/tmp/pmtool-combined-gui-runtime-20261022-r1`；只读真实 `home/profiles/pm/node_modules/dsh-pm-tool` 软链指向上述r2包，实际 `cordis.patch.yml` 与原 `isolated-profile.yml` 逐字一致。仅读配置/软链，没有读live业务库、启动、探活或停服务 |
| 实例与浏览器 | 原 host-start/ready：host **3260/PID60387**，gateway3261/PID60386；上游cwd与显式argv在host-start。j03-source-binding及原执行输出为 **EGO space13/p3**。19状态origin均3260，timeOrigin均`1792671157440.7`；pilot存储记录`{}`，host E2E=0。没有本角色新浏览器执行 |
| 宿主边界 | 本包没有宿主git commit/补丁完整认领，不补造宿主版本。结合软链、配置、下发组合字节与同origin状态签本次PM链，不外推整个宿主审签 |

[loaded-binding](../../reports/all-pending-evidence-20261021/CombinedGuiR1/loaded-binding.json) 与 [loaded-complete.js](../../reports/all-pending-evidence-20261021/CombinedGuiR1/loaded-complete.js) 独立逐字核：

- 组合下发 **2597854 byte**，SHA256 `14414cd388b1c638a4c75863ea1f26972eab88d48f696b3d330d6b48785516f1`；
- r2 compiled `lib/client.js` **1719054 byte**，SHA256 `09219cf81820294161dbdbdced09e73094b000a7d7e1d2e5b8c42f399fabb0db`，与 host-start、built-artifacts认领一致；
- 去 sourceMap 尾后真实片段 **1719019 byte**，SHA256 `a2dccdb9733c4df76f10ef8b6f792e0ad1aa42980f1458ffb8b14e99a16e3da5`，组合原件offset=`875361`、第二处=`-1`，唯一完整匹配；
- 原resource decodedBodySize=2597854/transferSize=830278、deliveryType空。只核这次采集与r2片段，不说每个动作都重新抓取或首载绝无缓存。后继 Main renderer 新修不在此冻结字节内，不锁其build。

## 4. 原合同子断言裁决

以下编号与原根状态前缀一致；每张PNG、对应JSON/roots/raw、原帧均由本角色读取。**截图可见性与落盘事实分开签，不以DOM text或清单指纹代目视。**

| 原断言子范围 | 有限裁决与原件 |
| --- | --- |
| J03/M06：两link后即能选c-2，点击不崩 | **PASS**。04排队两link；05候选c-1/c-2可见，06r2实际c-2勾选、c-1未选，PM工作台及新增任务壳仍在。06状态对应真实checked=true；03→06全部roots等值，未提前建任务。此处进展日期尚空，不冒填写日期已完成 |
| J03：真文件与进展选择追加 | **PASS（已执行动作/暂存/计数有限）**。07文件行`qa-j03-note.md / 22 B / sha87ef7d4f`；07只有一个stage的bin/json新增，原business与final文件不变。08原三帧明确c-2保选、c-3从未选变勾选，作者/日期`2026/10/21`/正文可见；08状态待提交4、输入清空，07→08根等值。不能由计数反推第一轮queued正文全文 |
| J03：cancel→keep | **PASS（按钮路径/可见保留/零写有限）**。09r2真实“放弃未保存修改？”及“放弃修改/取消”；不是猜出的aria-label。10r3确认层消失但新增任务仍在，资料计数4、文件行、title/description状态与09相同，全部roots等值。原图没单独展开queued正文，不签该字段完整回读。无ESC/scrim/X分支或焦点返还裁决 |
| J03：再cancel→discard零残留 | **PASS**。11r3原帧从确认态到任务页，新增层消失、仍A项目两任务。10→11只删stage `0f83954c163c325cd7d215ce924b128a` 的bin/json；**03→11 data/files/backups全清单逐项等值**，没有任务/资料/日志/暂存残留。不是把修前崩溃卸载清理算作正常取消 |
| J03：同输入重建、一次主save | **PASS（实际成功原子链有限）**。12新草稿title/description与原轮相同，原文件同byte、新stage=`c56960437386ebf8b4b8e1870e7cceea`；[13-main-save-events](../../reports/all-pending-evidence-20261021/CombinedGuiR1/13-j03-main-save-events.json)仅一次task add `24317.380`，包含两addLink/client c-1,c-2、addFile/c-3与一个progress add refs=[c-2,c-3]；随后`24317.381`仅snapshot，两响应RPC匹配、kind=success。13成功toast和关闭层真实可见。**12→13仅新增t-0004与消费这一个stage的两文件**，无逐资料或日志独立业务保存；不外推所有故障原子回滚/并发路径 |
| M06：合法别名到稳定真实ID | **PASS**。t4原JSON为version2/record，三附件at-1/link甲、at-2/link乙、at-3/file；pl-1/rv-1和entry.refs均`[at-2,at-3]`。at-2准确指向second，at-3指`fa-0001`，不是误指first。13→14/15全roots等值；后续t4原件与其他业务/文件不变 |
| J03：重开两link/日志可见 | **PASS（本视口内容有限）**。14重开标题/说明；15材料下部可见“J03资料甲”“J03资料乙”“文件fa-0001”；16/17在同编辑任务内真实可见日期`2026-10-21`、作者“修后验收作者”、一版历史入口及正文“J03修后进展，引用第二资料与真实文件。”。不要求一张顶部图包含所有下部内容；不签历史展开、多修订或进展ref跳转 |
| J03：文件去重/下载/保存后关闭 | **PASS（此同byte共享资产限定）**。fa1原record与原final文件清单全保，不新增asset或final文件；t1/t3原fa1引用不改，t4新增同fa1引用。17原下载副本 **22 byte**，与原`MaterialRemainingR1/qa-j03-note.md`逐字相等，也与fa1.sha256、size、12stage bin清单一致。18干净关闭新增层消失，业务/final字节不删。没有断联、末引用、GC、匿名/安全头或F01全支路证明 |

下载SHA256完整值：`87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`。

**原反证保留**：13→16/17/18不是全根等值；只有
`data/session_projcache/sessions/session-be7a8a82-c26f-4292-bcd7-7f023d85c7cb.json`
清单指纹变化。helper没复制宿主session正文，变化原因不猜。**03→11及12→13的限定对照仍成立**；不说全程host或全盘零写。

## 5. 逐图目视账与证据能力

实际逐张查看 **19 PNG + 21 JPEG帧，共40张原图**，非40个用例。没有生成替代图/接触表，没有浏览器或桌面交互。每图路径、SHA见自有audit的`visualOriginals/integrity`；帧和PNG分别看，重复帧不算额外状态覆盖。

| 原图集合 | 实际目视范围 |
| --- | --- |
| PNG 00/01/02 | 宿主空态、真实标准restore预检/confirm输出及恢复后PM；只作为J03合法fixture接续，不签备份旅程 |
| PNG 03/04/05/06r2 | 基础字段、资料区、作者/正文、两链接候选；06c-2选中且shell不消失 |
| PNG 07/08/09r2/10r3/11r3 | 真文件暂存行、待提交计数、确认文案/两按钮、保留层、最终放弃任务页；08后的queued正文不在照片 |
| PNG 12/13/14 | 重建提交前、成功toast/层关闭、重开任务基础字段；不拿14顶部证明材料下部 |
| PNG 15/16/17/18 | 两链接/文件与日志作者日期正文下部、下载后同页、干净关闭任务页；17照片本身不包含下载字节，字节由专门原副本核 |
| JPEG 01-precheck共3、02-confirm共4 | 命令填写/预检输出/confirm/已恢复原画面，非PM完整备份恢复实测 |
| JPEG 04-links共3 | 初始基础字段与资料区域滚动，非三张都能看到链接队列 |
| JPEG 08-progress共3 | 真文件/作者/日期/正文及c-2、c-3勾选变化；后两refs同时选中明确可见 |
| JPEG 11r3-discard共2 | 放弃确认→A项目两任务页 |
| JPEG 12-rebuild共3 | 新空材料区域→两待提交资料；不把这三帧单独当重建全字段证明 |
| JPEG 13-main-save共3 | 最后文件/资料区→“提交中…”；原PNG13另呈成功态 |

helper `state()`只复制 **data/pmtool**：19状态、**329**个业务原JSON副本均按version2/record解析，逐bytes/SHA与当时roots匹配。宿主data、files、backups只有原清单指纹；除源文件和专门下载副本外，不说本角色重新读取了所有原stage/final/host字节。空backups根没有文件，不等完成备份/恢复验收。

原events为 **10**份、21帧：commands过滤器只保`/api/commands/execute`请求/响应和Runtime exception；实际各监听段捕获异常0。06-click/07-picked空events不证明全部请求零。5条失败有些finally没drain，首等待也不在完整console捕获期，不说全程零异常。POST201没有原响应；不能因stage出现就补写HTTP201。下载原执行输出只记saved副本路径，没有HTTP响应头/完整操作argv，签副本与原GUI链的字节结果，不伪造更强网络取证。

## 6. 原失败、自有命令与释放

原封包 **17**份execution metadata均exited/outputComplete=true，其中 **12 exit0、5 exit1**。完整日志与metadata都在声明468内，不删、不合并为一次成功。原5非零：

| 原execution ID | 真实失败与保留口径 |
| --- | --- |
| `269e2d3d5406d28a623bf7ee90eaa2ef` | 首`.pm-shell`等待20秒超时。只保实际未到达，不倒推修后引用仍崩；随后真实入场已另采 |
| `4bd3904dcf9e1e48a3ef2b7263e03e9e` | waitForFileChooser10秒超时，输出另记date=2026-10-21；不是POST成功证据 |
| `76ecb7de9b26e5f2e247c3a9c9d906fa` | 猜HTML `dialog[aria-label="新增任务"]`取消按钮，matched0；不算取消动作完成 |
| `609954a3adcaead0101fc3d08a5111b2` | 猜确认aria-label，matched0；原后观察真实role=dialog、label=null、buttons=[放弃修改,取消]，不据此新增全域aria门 |
| `149b1d8fb365880a89b6e3c35be53c4e` | 中间`:has-text`组合selector工具不支持，Invalid locator；后10r3/11r3真实已到达动作另有原件，原失败不洗绿 |

本角色环境：macOS/bash、已有 Node **v22.23.3**；pnpm11.28.5只引用原约定，未调用。仅fs/crypto/assert读取和本地图查看，不导入产品模块，不执行SOURCE/AUTO、browser、网络、Git、build/install/tests或服务动作。

实际自有命令，仓库根执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check \
  docs/testing/j03-combined-gui-review-20261022-r1-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  docs/testing/j03-combined-gui-review-20261022-r1-audit.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  docs/testing/j03-combined-gui-review-20261022-r1-audit.mjs close
```

语法检查exit0；audit首exit1，**本角色误要求13→18宿主session也全根不变**，真实差异仅上述host session；独立读全部区间后仅对业务/files不变量判断，第二次audit exit0。原首失败不算产品红，未产生audit.json或改变原件；错误与原因在此保留。成功audit核468原件/515冻结输入/329原JSON、准确两个提交区间与21帧；close在[终核](j03-combined-gui-review-20261022-r1-close.json)单独落同前缀，不覆盖原audit或原封包。**审计exit0只是证据一致，不自行等同产品PASS；本报告限定PASS来自独立逐图和真实落盘审证。**

close实际exit0。首次链接检查与close并行，检查时close.json尚未落盘，exit1/missing一条；顺序重核15链接全部存在、exit0。这是本角色设施执行顺序错误，不是原件缺失或产品FAIL。补记本段后不覆盖旧close内的当时报文指纹，以同前缀finalize脚本顺序核最终报告、旧audit/close及声明468原件，生成finalcheck.json；最终证据仅绑定本次有限审证，不新增产品门。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check \
  docs/testing/j03-combined-gui-review-20261022-r1-finalize.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  docs/testing/j03-combined-gui-review-20261022-r1-finalize.mjs
```

## 7. 交回与剩余动作

1. Main/原合同owner登记以上有限签字：合法c-2→c-3引用、按钮取消保留放弃、03→11全根零残留、重建一次主save/refs解析、重开可见内容、22byte下载和此共享fa1去重链。**这些已签动作不需重采**，本角色不增加queued正文展开或全请求捕获为新门。
2. M06坏别名GUI仍查原未签登记及既有证据；确无原件才按原合同最小补采坏别名取消/拒绝零写，合法成功不替代非法断言。第一轮queued全文和缺HTTP响应作为证据能力限制保留，不伪造PASS/FAIL。
3. O3、ATF、固定MD导出新修、完整备份、OP/成长、B8及父最终对账归原owner，**本件不审不签**。新renderer候选由Main独立汇合认领，其原门沿既定流程推进；r2有限签字不得外推新bundle或普通commit放行。

仅创建本前缀audit脚本/audit结果/本报告/close/finalize脚本及finalcheck；没有写业务、其他testing/livingdocs、Git或服务，没有锁Main/build或改468声明原件。初只读广域find已结束；未留本角色后台命令。3260及其他服务不由本角色停止。**交回有限结果，资源释放，release STOP；无push/tag/release/正式切换。**
