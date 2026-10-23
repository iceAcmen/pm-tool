# 共享文件断联与保源有限 GUI 审证 R1

> 2026-10-22，平台 trae，不同独立 GUI 审证角色，非开发、非执行端。给父协调者与原合同 owner 领取有限子签；唯一写面为本前缀自有 audit/报告。父 total、普通 commit、整项 F05 均未签，release **STOP**。

## 1. 有限裁决

**PASS_COMMAND_LIMITED + PASS_GUI_REMAINING_DOWNLOAD_LIMITED**：真实宿主 UI composer 提交三次 material remove，仅逐次断对应任务资料、不删共享源；第一条断联后，剩余 t-0003 文件链接可见且原生下载副本 22 byte 等源；最后任务引用归零，fa-0001 元数据与源文件指纹仍保；真实 GC dry-run 0 → 明确 `--apply` 0 未改变业务/file/backups。

以上实际子断言未发现新产品 FAIL。**不签原“直接 UI 控件断联”，不签 RA-F05 整项。** 当前 draft 的 file 行没有 remove button，Main 没造新入口；宿主 UI composer 发命令不等同任务资料区点击断联控件。命令门、剩余 GUI 下载和旧非空孤儿 AUTO 分开登记，不能累计成整项 GUI PASS。

原 [RA-F05](remaining-journey-cases-20261021.md#4-文件暂存字节去重安全与备份) 与 [delta 台账 RA-F05/E05](remaining-acceptance-delta-20261022-ledger.md) 保持原范围。本件只补共享断联/保源的实际有限结果，旧非空孤儿 dry-run/apply AUTO 沿原专家与原候选记录保留，**未重跑、不新签非空删除**。不把 task refs=0 推成 GC orphan，不建议删 metadata，不要求或代执行新 apply。

## 2. 本次授权

负责人原句按本批对象生效：

> “父多角色持续验全部授权，无push/service，普通commit仅全门后。你独立GUI审证非执行非开发，唯一write docs/testing/shared-asset-unlink-gui-review-20261022-r1*自有audit。”
>
> “审CombinedGuiR1/shared-index1799声明（含prior1537已独立备份/ATF、J03468，别重复审全）。only70..80/shared-observation/native-download73/commands71/75/76/77/80。”
>
> “UI当前draft没有file removebutton Main不造新入口，command unlink真实UIcomposer执行可签有限命令+remainingGUIdownload，不冒原直接UI控件断联/wholeF05。”
>
> “GC按file_assets metadata保护并非task refs0自动orphan，不要把0dryrun当bug/建议删metadata/越权补apply。”
>
> “最后有限PASS/缺证给owner，不签父total/commit，releaseSTOP。”
>
> “1799declaredsha核old1537同，新增未来add可；5共享exec全0原资料文件字节sha87ef..，raw/root+RPC truekind与截图目视分开。”

已核 AGENTS、collaboration §9/§11、onboarding/handoff/progress 最新接续和原旅程。通用 fetch/pull/install/build/全回归/livingdocs 改写不扩大本次仅审证授权；不锁 Main 后继 renderer/ask/taskpred、构建或 shared 原件。研究指南仅用于来源、反证与不确定性分层，未联网或增设研究/产品门。

## 3. 完整性与身份

原根：[CombinedGuiR1](../../reports/all-pending-evidence-20261021/CombinedGuiR1/)。结构化核对、全 8 个限定区间、逐态任务引用、RPC、真实目视文件清单见[自有 audit](shared-asset-unlink-gui-review-20261022-r1-audit.json)，终核见[close](shared-asset-unlink-gui-review-20261022-r1-close.json)。

| 对象 | 独立核对与边界 |
| --- | --- |
| [shared-index](../../reports/all-pending-evidence-20261021/CombinedGuiR1/shared-index.json) | **1799/1799** 普通文件逐 bytes/SHA 全匹配；索引自身 317676 byte，SHA `cba4e79542cf50ada54a0dad5749e56cc5432aff010f30a8dc0253d762407c40`，封存 `2026-10-22T13:10:13.667Z`。索引不自包含；未来新增不纳本签、不判污染 |
| prior1537 / J03468 | 旧声明每个键与指纹均为 1799 的同值子集；1537 索引 270825 byte，SHA `2c1dd6628834258893c4ae8a36e656f71006cda455b29f6ab933746fd602ceb9`，在新增声明内另绑定。468 已含于1537，不相加；只保护原件，继承[备份](ui-backup-nonempty-reentry-gui-review-20261022-r1.md)、[ATF](atf-combined-runtime-gui-review-20261022-r1.md)、[J03](j03-combined-gui-review-20261022-r1.md)既有审签，不重判旧产品结论 |
| 源码/实例 | 原 source-binding：基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + dirty `CombinedRepairR1/r2`，107 声明；冻结 `/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool`。原 r3-start **3260/PID71922**，bundle 指此冻结包；同 runtime `/private/tmp/pmtool-combined-gui-runtime-20261022-r1`，EGO space13/p3。不以当前 Main tree/HEAD 冒充被测源 |
| 编译/下发 | 冻结 compiled client 1719054 byte，SHA `09219cf81820294161dbdbdced09e73094b000a7d7e1d2e5b8c42f399fabb0db`，等 r3-start；原组合 2597854 byte，SHA `14414cd388b1c638a4c75863ea1f26972eab88d48f696b3d330d6b48785516f1`。独立核字节，唯一完整片段关系沿 J03；未重新运行构建或首载探针 |
| 实际页面 | 九态同 origin3260、timeOrigin `1792673515397.8`，**1458×734、深色、DPR2**，pilot `{}`。r3 未另抓完整 uncached 下发；本件不冒缓存、宿主 Git、四视口/浅深/原生200%完整门 |
| 原资料/下载 | [73原副本](../../reports/all-pending-evidence-20261021/CombinedGuiR1/73-shared-still-downloadable.md)与原 `MaterialRemainingR1/qa-j03-note.md` 逐字相等，均 **22 byte**，SHA `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`；同 fa1 的 size/sha/relPath |

原 helper 复制的是 `data/pmtool` 正文，其他 roots 是当时读取字节后的清单。九态 **189 份 version2/record 原 JSON**逐件与对应 roots 匹配；本角色没有读活业务/file/backup 目录。保源的活文件证据来自逐态 files 指纹及 Main 原 seal 的实际读字节记录；独立实读字节来自原资料与73下载副本，**不混称本角色重新打开了活源文件**。

## 4. 业务、字节与命令分层

以下编号均指原根前缀；完整 `requestId/rpcId` 存 audit。五组都按 requestId 配对、JSON 解开 server-response、核同 rpcId、`ok=true`、真实 **kind=success**；不是仅 HTTP200。

| 实际动作 | 有限裁决与原证 |
| --- | --- |
| 70 初态 F5+J03 | 原四 task 全扫描：fa1 三引用为 **t1/at3、t3/at1、t4/at3**。fa2 在 t1/at4，与本共享 fa1 区分；70 PNG是宿主空 composer，不拿图冒三条引用可见 |
| 71 断 t4/at3 | **PASS_COMMAND_LIMITED**。`/pm material remove t-0004 at-3`，request `24317.1130`，真实“未删源”成功；71原帧独立见输入与结果。70→72 全 roots 仅 `tasks/t-0004.json` 变，实际只删目标 attachment 与更新 updatedAt；t1/t3、其他业务、files/backups不变 |
| 72→73→74 剩余引用下载 | **PASS_GUI_REMAINING_DOWNLOAD_LIMITED**。72图目视 t3 的“文件 fa-0001”链接，原 raw 保 t3/at1；73副本22byte等源；74仍只有t1/t3引用。72→74业务/file/backups相等，只有宿主会话/workspace清单变化。签此剩余引用的下载结果，不冒完整浏览器下载回执/网络安全头 |
| 75 断 t3/at1 | **PASS_COMMAND_LIMITED**。request `24317.1138`，命令/实际成功正文/75 PNG相符；74→75仅t3变，attachments归空，t1/at3成为最后引用；fa1元数据/file/backups全保 |
| 76 最后断 t1/at3 | **PASS_COMMAND_LIMITED + PASS_DATA_LIMITED**。request `24317.1139`，成功未删源；75→76仅t1目标资料与updatedAt变。全部四 task 当前 attachments 对 **fa1 的 assetId 引用0**；fa1仍完整原record，file的22byte/SHA仍在，fa2也不变 |
| 77 dry-run0 | **PASS_COMMAND_LIMITED**。request `24317.1140`，真实 `/pm material gc`，正文明确dry-run未删、0、加--apply才删除；77/78 PNG目视一致。76→77全 roots相等；76→78仅宿主session指纹变，业务/file/backups不变 |
| 79 任务重开 | **PASS_GUI_LIMITED（空资料行）**。图中t3编辑资料区无file行，原 t3 attachments=[]；不把这张t3图说成四task全部逐个GUI重开。原四task引用0依据全部raw，不依据DOM缺行 |
| 80 明确 apply0 | **PASS_COMMAND_LIMITED（空回收集合）**。request `24317.1162`，真实 `/pm material gc --apply`，kind成功/正文“已清理0”与80 PNG相符；76→80业务/file/backups全等，宿主session/workspace清单可变。不是非空孤儿删除实测，不代签旧AUTO |

三次 task 改动均逐字段 deepEqual“原记录减目标attachment，仅updatedAt更新”，非只比行数。t4 原 progressLog/revision 中的历史 `refs=[at-2,at-3]` **未被改写**；这里“引用0”严格指当前 task attachments 的 fa1 assetId 引用，不冒历史引用已清扫或所有引用语义总门。

[shared-observation](../../reports/all-pending-evidence-20261021/CombinedGuiR1/shared-observation.json)只是 Main 观察，不作为独立 PASS。审计另读全部 raw/roots 和命令原响应，确认其 references=[]、asset与bytes相符；不同来源形态交叉核事实，不把同源多份转述算多个独立执行。

## 5. GC 保护与证据能力

冻结 `core/file-asset-store.ts` 的现有 `gcOrphanAssets` 以 **file_assets 元数据的 relPath 集合**保护内容寻址文件，默认24h宽限、略过staging/symlink，apply仅处理现有孤儿集合；不是按任务引用数自动删元数据。此处仅读原实现解释动作语义，不重做 SOURCE/AUTO 或引入新规则。

因此 task refs0、metadata仍在、dry-run0/apply0 **相容**，不列新产品缺陷。两个22byte资产元数据/源清单始终保；已有非空孤儿 AUTO 不因本次集合为空失效，也不能用本次0证明非空删除路径。未删除metadata、未补制造孤儿、未越权apply；原 RA-F05 owner 继续按既定台账对账。

目视账实际为 **9 PNG + 6 JPEG**，每张原路径/SHA在 audit；另12张共享JPEG只核声明指纹，**未目视、不算已看或完整录像**：

| 实际图片 | 目视范围与限制 |
| --- | --- |
| 70/74 PNG | 宿主空composer，可用命令入口；不是PM文件断联button |
| 72/79 PNG | 同t3资料区，先有file链接、后无file行；抽屉背景透叠真实保留，未签样式/完整UX |
| 75/76 PNG | 中文“移除对应资料项（未删源）”结果实际可见 |
| 77/78/80 PNG | dry-run0未删/明确apply0结果；照片不单独证明文件存在，源保由raw/roots/字节交叉核 |
| 71两JPEG、75一JPEG | t4命令输入与成功输出、t3命令输入 |
| 76/77各一JPEG | 帧尚见前条成功正文与下一命令输入，不谎称该帧已呈本条最终结果；相应PNG另有结果 |
| 80一JPEG | 原帧为空composer，**没有拍到--apply输入**；真实line/动作由80请求原件及结果PNG核，不拿该帧补造输入画面 |

73本包没有独立下载wire/status/headers/完整native调用回执归档；只签实际下载副本、剩余GUI可达链接和源一致链，未签匿名拒绝、中文文件名/安全头或 F04。不为本有限子签自加这些原属别项的门。

helper仅捕 commands请求响应、screencast、exceptionThrown；五段捕获exception均0，**不是全console/全请求/全时段零异常**。drain的`at`是读取时点，不拿其先后推wire时刻。宿主session正文未复制，变化原因不猜；已记录三个根不代表全机/正式零写。

## 6. 原执行与自有验证

五份共享 execution metadata均 **exited / exitCode0 / outputComplete=true**，原log都在1799内逐字保护：

`e316c1e6548be0ad1eea7474eed2bec2`、`9a2889f34db6caafb312c1a5f82fd625`、`de8859cfc29e46b8641326723035977e`、`25f1de6c0673dc0dde0e4390fb69e5b1`、`dbe30f384c24de2433cb1496e0316d45`。

五execution不是五个GUI用例；captureStderr=false不说全部stderr被采。旧1537内25续执行7非零、旧J03失败由原报告保留，本件不洗码、不重审全。

审证环境 **macOS/bash + nvm Node v22.23.3**；pnpm11.28.5为原项目环境，本角色未调用。实际仅fs/path/crypto/assert证据reader、本地图目视和文档核查；没有导入产品模块、重跑原executor、fixture/build/tests/verify/browser/服务或正式业务动作。

仓库根实际自有命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check \
  docs/testing/shared-asset-unlink-gui-review-20261022-r1-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  docs/testing/shared-asset-unlink-gui-review-20261022-r1-audit.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  docs/testing/shared-asset-unlink-gui-review-20261022-r1-audit.mjs close
```

`--check` exit0；`audit`首轮exit0（execution `e19575d70979e4fa970986c53e3f1b7b`，PID84291，exited/outputComplete）。核1799/1537/468、189业务原JSON、9态、5RPC、5执行、3→2→1→0引用及22byte源下载一致。审计绿只表证据一致，有限产品裁决来自以上独立目视/原始业务/命令审证。

本角色启动时误调用一次只读 `git status --short`，未发生 Git写/提交/推送；此后未再调用Git，**不虚报完全未调用Git**。rg缺失两次exit127、无shared文件通配/错误GC文件检索/pgrep无子项等探索非零，不算产品FAIL。广域只读find/grep曾延迟，随后缩到指定根；只读ps核自身81332/81326并以各execution metadata确认均exited/exit0/outputComplete，未发kill、未触服务，不留本角色后台扫描。相关执行偏离不改原件、不扩写产品结论。

## 7. 交回与停止

Main/原合同 owner 可登记本次**有限命令断联、剩余GUI下载、末引用保源、dry/apply空集合0保全**。这些实际已签子动作无需重复采；原直接UI断联保持未签，不能换名字补成PASS，不能要求Main新增入口以凑门。已有非空孤儿AUTO沿原记录保留。

父total/普通commit、F05整项、F04/备份/ATF/J03其余支路、B8矩阵及新候选放行归原owner。本角色只创建本前缀audit脚本/audit结果/报告/close；没有改Main在途shared原件、业务、old manifests、其他testing/livingdocs、服务、正式data或Git状态。终核按声明1799保护旧1537/468，未来增件另归其批次，不要求Main停采或清树。**有限结果交回；资源释放，release STOP。**
