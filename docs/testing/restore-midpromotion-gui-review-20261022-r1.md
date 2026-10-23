# F07 中途提升失败有限 GUI 审证 R1

> 给 Main、原合同 owner 与接续专家使用。2026-10-22，trae，不同独立 GUI 审证角色，非开发、非执行。只写本前缀自有 reader/audit/报告/终核，不写业务、Git、服务、浏览器、其他 testing 或 livingdocs。**release STOP**。

## 1. 有限裁决

**PASS_GUI_LIMITED / PASS_ROLLBACK_DATA_LIMITED**：本次 107 实例在合法完整源包预检通过、两层明确确认后，实际发生 B 路径 `ENOTDIR`；GUI 显示恢复失败、已自动回滚及安全快照路径，没有冒成功。只读外部采样实际观测项目原值→源值→原值、A 不存在→21 byte 创建→删除；全部 13 表、原双字节及故障 blocker 恢复/保持 beforeFault，安全包完整，新 PID 回读及 fa-0002 后续有效下载成立。

本签字**只关闭 RA-F07 的本次真实中途提升失败/自动回滚 GUI 子门**，不是整 F07、F06、J06、完整恢复门、父全部余项、Main AUTO 或普通 commit 的放行。首次空下载副本与封存失败不撤销、不洗零；未捕获的 HTTP/全程录屏边界不冒通过。没有本有限回滚子断言的新产品阻断 FAIL。

## 2. 授权与有效合同

负责人本次原句节录：

> “你不同独立GUI审证非执行非开发，只docs/testing/restore-midpromotion-gui-review-20261022-r1*自有audit，不业务/Git/browser/service/其他testing/livingdocs。”
>
> “签有限F07中途回滚子门，不签整F07/F06/J06父totalcommit，也不要求重做已签正常恢复/共享。”
>
> “firstseal原失败/空copy保，执行9不包含firstsealouterexit不要谎零设施失败。”
>
> “不加新B8global门，资源releaseSTOP给有限结论和只真正剩余，Main父继续。”

原步骤及 P14 最新澄清以[独立用例](restore-midpromotion-gui-case-20261022-r1.md)为准；对应[原旅程 §4](remaining-journey-cases-20261021.md#4-真文件与恢复)、[总登记](remaining-acceptance-register-20261021.md)和[父最终对账](final-remaining-acceptance-reconcile-20261022.md)。P14 仅要求新 host 从 t-0001 原挂接入口下载 fa-0002；fa-0001 taskrefs=0，只核 disk/safety/source bytes，不复挂、不造按钮、不新增其下载门。

已只读 AGENTS、collaboration §9/§11、最新 progress/handoff/onboarding/changelog、需求/决策/知识/问题档案。本次明确授权不包含通用 fetch/pull/install/build/全回归/Git 或 livingdocs 收尾动作。源码、自动回归与[正常恢复已签结果](ui-backup-nonempty-reentry-gui-review-20261022-r1.md)按原范围继承，不重跑、不扩签；共享另门的既有裁决不由本件重开。

## 3. 原件、候选与运行绑定

以下数字前缀相对 `reports/all-pending-evidence-20261021/F07RemainingR1/`；原件指纹、全体行值、RPC 配对、逐图清单、原外层失败日志及根差异保存在[自有 audit](restore-midpromotion-gui-review-20261022-r1-audit.json)。

| 对象 | 本次独立核对与限制 |
| --- | --- |
| [封存 index](../../reports/all-pending-evidence-20261021/F07RemainingR1/index.json) | `2026-10-22T13:33:00.108Z`；101999 byte；SHA `b18c77445de3f1d281d0a51ec9627c6e5551b60f328bc1f4afb594700eb61168`。**573/573**声明普通文件逐大小/SHA相同；index 自身另核，不要求未来目录无新件，不更新旧 closed index |
| 原包保护 | CombinedGuiR1 的 J03 **468**、continuation **1537**、shared **1799**声明全部逐件同；三者有包含关系，不能相加为测试数。完整各 index SHA 见 audit |
| 107 来源 | 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + 已认领 dirty；CombinedRepairR1/r2/source-files.json 与本包 final-source-binding 的107声明相同。本角色重核冻结树 **92**包路径 SHA，15 Launcher 仅保声明/原继承，不签新 Launcher 执行或主树全集 |
| 实际包 | `/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool`；冻结 `lib/client.js` **1719054 byte**，SHA `09219cf81820294161dbdbdced09e73094b000a7d7e1d2e5b8c42f399fabb0db`，与新 host 原启动记录同。不以 version/HEAD 代 dirty 候选；未重新 build |
| 目标/来源 | target `/private/tmp/pmtool-combined-gui-runtime-20261022-r1`；source `/private/tmp/pmtool-f07-source-20261022-r1`，各 data/files/backups/home/private 分离。只读原 helper/原件，不读活业务库或执行 helper |
| 71922→87385 | [stop](../../reports/all-pending-evidence-20261021/F07RemainingR1/host-exact-stop.json) `13:28:19.290Z`核71922/3260 argv/cwd后单PID TERM；[gone](../../reports/all-pending-evidence-20261021/F07RemainingR1/host-listener-gone.json) `13:28:19.777Z`；[start](../../reports/all-pending-evidence-20261021/F07RemainingR1/host-reentry-start.json) `13:28:19.781Z`新87385/3260；ready `13:28:31.748Z`。原 executor-reentry 的环境指向同107/同roots，DSH_PM_E2E=0，不触正式或其他隔离服务；本角色不探活/启停 |
| 网页原环境 | Main EGO space13/p3，同origin3260；00–11 timeOrigin `1792673515397.8`，13–21新host `1792675741850.9`。21状态实际1458×734、outer1470×857、DPR2、深色。未签原生200%、四视口浅深、读屏或键盘全矩阵 |
| 后继边界 | 主 renderer/ask/panel 新独立门及后续 build 属合法父工作；本实例始终107旧字节，本签字不冒新修装载、不锁 Main 后继构建。没有真实模型调用/真实模型门结论 |

本包没有新宿主 commit/补丁全集及重启后另抓的整组合 bundle；沿用已认领宿主/107关系，只签同包重启链、实际新进程页面和数据回读，不说每次请求都重新抓包、绝无缓存或整个宿主通过。

## 4. P01–P15 实际核对

| 步骤 | 原件与有限判断 |
| --- | --- |
| P01 | 00原表与 Shared80 全部13表逐字段同，原两87文件清单同。当前 before 取80，而不是历史54；GUI是原项目三任务 |
| P02–P04 | 原 executor-source 用实际 Cordis Context、JsonStorageBackend、DomainFacility.open(pmDomainSpec)，标准 restore 原完整F5→项目 update→生产 validate/register A→B→createBackup。原execution510b…exit0/真实返回/source-binding/标准包同向，不是 Map、手造信封或GUI制作source；源相对原F5只改项目name/合法updatedAt及新增两资产，原历史/共享refs/13表全部保留 |
| P05 | 01相对00业务及files清单只增 `files/ae`普通文件，54byte、SHA `ab481c2740ec8334abcfb59140d9e19e27da0d8b015e34beb57ab46825673192`。A/B prefix此前都不存在；beforeFault包含人为blocker，不能把它算回滚污染 |
| P06 | 02平面预检区可见：结构/关系/侧车字节完整、演练尚未恢复，七core及六extra计数含file_assets4。请求 `24317.1178`、RPC `b74d9072-69c2-44b8-904f-5eb2bc82f1a7`无confirm；业务kind success，不是仅HTTP200 |
| P07 | 03危险层实际“确认整体恢复？”、完整source标题、覆盖与先存安全快照警告。03事件没有confirm请求；业务/files/backups未写。确认层背景透叠真实保留，不洗成完整样式PASS |
| P08–P09 | 04-drain-0 的唯一confirm请求 `24317.1179`、RPC `54e286ac-f9dd-4c5e-b3ad-202d54433e62`与04-drain-3响应配对；传输ok=true但业务kind **error**，不是恢复成功。04/05原PNG红卡全文显示“恢复中途失败，但已自动回滚到恢复前状态”、安全路径13:23:44.808及B完整路径lstat ENOTDIR；危险层关闭、平面预检保留 |
| P10–P11 | 04末库及12观察另重算：全部13表/21行与beforeFault逐字段及原信封字节同；项目原name、三task断fa1状态保留，fa3/fa4元数据不留。A已删、B完整路径未生成、blocker同SHA/类型、原双87字节不变；安全包是beforeFault而非source |
| P12 | 06预检区取消后消失，失败卡仍在；07会议、08汇报、09交付物、10习惯、11OKR原内容可读，无白屏/半库。未重新restore；未把页面可读当全部历史都展开 |
| P13 | 精确旧停/消失/新起/ready原链与原execution59bf…exit0一致；同107包/目标roots，87385新进程，不是沿用旧60r3–67 |
| P14 | 13新host原三任务、14资料/原E3正文及E1三版入口、16–20 records/growth原内容均可见；新host封存业务13表原字节同beforeFault。实际attachment ID是 **at-4**（计划别名at-0004），未改ID；fa2同项目挂接，21同入口后22有效下载22byte/SHA同原源。15空副本不能作成功下载 |
| P15 | 573声明、九份execution、所有事件/原观察/截图已独立核对，首次封存外层非零另保自有audit，不改旧包。仅有限事实裁决；不签连续全程录屏或整个P01–15合同/父门总PASS |

P06/P07 的 **pmtool业务/files/backups**未变，但同一宿主 `session-ed2499c1-…` 的4527byte文件SHA从 `e43398…`变`ab98a8…`；已单列，不能声称全data零写。settings按原 `[key,value]`键语义比较；sessions/checks不加为第14/15表。事件drain与文件名时间不冒请求实际发生时刻。

## 5. 中途过程、全表与安全字节

[watch-events](../../reports/all-pending-evidence-20261021/F07RemainingR1/watch-events.ndjson)与12观察相同，原外部watcher每1ms请求采样、45秒结束，仅读项目/A/B路径，不改产品、不加hooks/monkeypatch/人工抛错；写的是自有证据。

- `13:23:44.829Z`：项目实际读到 `RA-F07-source-midpromotion`，318byte、SHA `ade06223…`，不是只从源码推导DB写发生。
- `13:23:45.024Z`：A实际存在，21byte、SHA `3738e658…`；[observed-A-bytes](../../reports/all-pending-evidence-20261021/F07RemainingR1/observed-A-bytes.txt)逐byte等于合法input-A及源侧车。
- `13:23:45.030Z`：项目原 `QA-A-fixture-F5`回来，307byte、原SHA `4f8c12b6…`；`13:23:45.182Z` A不存在。中间项目短暂ENOENT如实保留。B观察始终ENOTDIR。

冻结backup接缝是 safety→replaceAll→按asset原数组await提升→catch重放before→unlink本次新文件；file-backup按真实数组A先B后。**源码顺序与上述实采相互佐证**，不以最终A不存在单独冒A曾提升；也不把抽样频率称严格1ms采样精度或全13表瞬态逐笔观察。

| 表 | beforeFault / 失败后 / 新host / safety行数 |
| --- | --- |
| projects / tasks / milestones / risk_issues | 2 / 4 / 1 / 1 |
| meetings / reports / deliverables | 1 / 1 / 2 |
| settings / reflections / okrs / lessons / habits / file_assets | 3 / 1 / 1 / 1 / 1 / 2 |

**21个原raw状态全部13表深比较和信封大小/SHA同beforeFault**；包含B项目、稳定ID、关系、修订数组、软删、固定report snapshot/来源、成长关联。不是只比counts，也不声称B项目每条都逐个GUI展开。

| 标准包 | JSON大小/SHA、侧车与实际资产 |
| --- | --- |
| 原完整F5 12:41:19.715 | 16761byte，`bf685cd0eec617a8d6f01c1de1b5fd69bb83fbd921c062915b8b8effe672a489`，bundle69ba8b57a76af04c；原件保全 |
| source 13:20:09.542 | 17662byte，`d8b1348e690a8ea5d906d5c70bba545310d425cc647524938cdcf6de488403f2`，bundle18ff796574f9419e；JSON+manifest+四资产，共6普通文件、13表23行 |
| safety 13:23:44.808 | 16302byte，`80e7b92042d09c30eccf769f6672e6aa12825f2df4548fb796d3afc59c5a952f`，bundle895b10c8dd74022f；JSON+manifest+双原资产，共4普通文件、13表21行，全字段同beforeFault |

每份manifest的jsonSha/bundleId/count/relPath/size/SHA与相应JSON、真实侧车字节逐项相符：

- fa-0001：22byte，SHA `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`。
- fa-0002：22byte，SHA `875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`。
- A/fa-0003：21byte，SHA `3738e6580bc26062378b677326483e7086d477389b32605e29ca0147b0a19471`，prefix37。
- B/fa-0004：21byte，SHA `aed3cd57ccf0bb18a932f3977d42a9ee538fa9a515bae4e76d1c9147934998d1`，prefixae，合法安全text/plain。原数组顺序fa1/fa2/A/B，不手调manifest排序代替。

失败后新增普通文件仅安全包4件；宿主session变化单列，新host另增一个session。目录新增 `files/37`空目录、自动safety `.staging-…`空目录及正式侧车两目录；空37符合原rollback只unlink文件合同，staging空目录作为真实副产物保，不称所有目录清零、不新增目录删除门。blocker保留，未清fixture/GC/覆盖失败证据。

本角色独立读字节来自原包/source/safety/observed-A/下载副本；活files双原字节由Main原读取链和各态roots清单证明，**不冒本角色另打开活disk**。source/helper/home/private/下载等有原写根说明，但非全部根连续WATCH，不签全机或正式资产零污染。

## 6. 下载、原失败与目视边界

15原副本确为 **0byte**，空SHA `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。首次seal外层execution **fd92fb1bb5d27a28426411cf1ed32551**、PID87719、exit1、outputComplete=true，原日志946byte/SHA `a60b45457849f265d58c9052bcda339623765791d83db40be0bd9d6d62bc96bf`，实际断言为空SHA!=fa2SHA。原日志与530byte元数据全文保存在自有audit；不改573索引、不把它塞进“九次全0”。

九份原execution metadata均exited/outputComplete=true/exit0，分别是510b…、5853…、a597…、1390…、fb39…、5d5b…、59bf…、2999…、dbf0…。它们证明各自执行结束，**不代表九个用例PASS或零设施失败**。source/预检/watcher/失败回读/导航/新host/下载分母与封存外层不同。原captureStderr=false不能声称stderr完备。

后续[22 receipt](../../reports/all-pending-evidence-20261021/F07RemainingR1/22-download-receipt.json)是真入口 `/api/pm/v1/assets/fa-0002?taskId=t-0001`、filename version-two.md、failure=null；实际22副本22byte，逐byte及SHA同源/safety。**只签这一后续有效下载**，不溯改15失败，不定空副本根因。22-download-network原 `[]`未捕asset HTTP/status/安全头，既有F04已签头门保持原范围，不重复扩签或要求新增HTTP门。fa1零taskrefs未下载，disk/source/safety字节保真。

本角色实际 `view_image`逐图查看**全部21PNG+9JPEG**，完整路径/SHA见audit。04/05错误全文可见；06取消后反馈保留；13任务行、14/15资料及历史入口、16会议mtg-0001与“保留标准来源”、17固定snapshot total2/来源qa-f5-session、18交付物V1/关联/备注、19习惯零打卡、20目标草稿可见。07会议决议在图底部，完整正文由页面JSON与新16佐证，不冒07全部可见。

JPEG只有预检前3帧、危险层前/打开3帧、首次下载入口3帧，**没有P06–P12连续全程影像**；不能称完整录屏审签。中途回滚有限裁决以真实RPC、原PNG/页面状态、外部只读瞬态、全表/字节及新PID链组合为证，不把稀疏帧或截图数折成全旅程覆盖。Runtime/console原捕获为0仅表示所采数组没有该类条目，不等整程全console零异常。

03背景文字透叠，14/21抽屉过渡背景透叠，08/17快照右栏在当前截屏边缘部分截断等实际观测保留，不洗成完整样式/UX通过。只保既有层/界面owner边界，不加B8global门、不用本功能有限PASS替代父矩阵裁决。

## 7. 自有核验与交回

审证环境macOS/bash、已有Node **v22.23.3**；pnpm11.28.5仅原环境口径，未调用。仅fs/path/crypto/assert证据reader、文本读取和本地图片目视；没有产品import、原executor重放、业务测试/build/verify/浏览器/Git/服务操作。

仓库根命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/restore-midpromotion-gui-review-20261022-r1-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/restore-midpromotion-gui-review-20261022-r1-audit.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/restore-midpromotion-gui-review-20261022-r1-audit.mjs check
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/restore-midpromotion-gui-review-20261022-r1-audit.mjs close
```

语法检查exit0；首次audit **exit1**，自有reader旧L199误把宿主session缓存纳入预检零写，只有该session SHA不同，未写出audit.json。只修自有reader按原合同单列宿主变化；第二audit **exit0**，完整573/旧468/1537/1799、21态13表、3合法包、A瞬态、2RPC、九执行及额外首seal失败、新host/后续下载核实。再加强原两asset元数据及prefix原不存在校验，`check` **exit0**，保存audit内容相同；不覆audit或原件。rg缺失exit127、记忆路径不存在exit1为读取探索失败，不计产品FAIL。

报告写定后顺序执行`close`终核原声明、报告/reader/audit指纹及相对链接，只新增自有close，不更新旧index。证据reader绿只证明一致性，本报告的有限PASS来自独立逐图和业务/数据审证，不能当Main AUTO/父PASS。

**只真正剩余**：本有限中途回滚子门无需再采或重做。Main登记此有限签字，维持旧正常恢复/共享各自已签范围；F07其他hash/缺字节/越界子断言及F06/J06父整项，只在原owner尚未签的具体范围继续，不因本报告重新跑已签动作。连续全程影像、asset HTTP、全页样式/UX、真实模型、新候选装载均是本件未签边界，不擅自增设为本有限门前置。

父余项/最终范围对账及全门后的普通commit仍由Main继续；本角色不签父完成、不stage/commit/push/tag/release，不追加新global门、不锁后继renderer/ask/panel或Main build。只新增本前缀自有产物，原fixture/blocker/source/safety/旧包/新host不清理、不改服务。无本角色运行中的执行/测试/服务任务，审证资源交回、角色STOP；**Main父继续，release STOP**。
