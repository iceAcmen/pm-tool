# A18 OKR 建议处理旅程有限 GUI 独立审证

> 2026-10-22，trae 独立测试专家，非开发、非 GUI 执行端。供 Main 和接续专家核对原 RA-P2003 有限切片；只审已有 PNG、真实帧、请求和落盘原件，不执行产品或采集脚本。本报告及同前缀 audit 是唯一写面。

## 1. 有限结论

**PASS：本次同项目三建议进入收件区、页面一次采纳创建 draft KR、页面一次忽略不建档、重进、重复确认拒绝零业务写、明确 clear 两条 processed 保第三条 pending，以及最终导航/重进保留 draft KR。** 已独立目视 PNG 与选定真实连续帧，并与真实请求、响应、原 JSON 和四根指纹交叉核对。Main 只采证，没有判定。

**不签原 RA-P2003 整项、全 OKR、全成长、全矩阵或总目标 PASS。** 本批没有跨项目建议或 clear 保其他项目 processed 的动态反例，不延伸 P2004、自指/跨项目关系门，也不把本报告转为新候选、A19、commit 或发布批准。重复确认的实际 error 响应成立，但宿主空 hero 无可见错误结果，**error visual 仍 BLOCKED，不借本次业务守卫 PASS 签绿**。

唯一原采集设施 FAIL 保留：`nav-1792633053707/exit.json=1`。其后纠正 first-line 导航标签匹配完成新步骤，不倒写原失败为0。未发现本有限旅程新增产品 FAIL；这不撤销其他报告已开 FAIL/BLOCKED。

负责人原派单范围为“独立A18 OKR建议旅程GUI审证，非开发/GUI”“只写docs/testing/a18-okr-journey-gui-review-20261022*自有audit”“只原P2003有限切片”。持续全部验完、最后普通 commit 与分工授权保持，由协调者继续；本专家明确禁 commit。未 fetch/pull 脏树、build/install、运行 verify、操作 GUI/服务、读取凭据或修改 livingdocs/其他 testing。

依据 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[原 P2003 合同](remaining-governance-cases-20261021.md)、[原 GUI handoff](governance-growth-independent-auto-20261021-gui-handoff.md) 和 [修后交件](governance-fix-independent-retest-20261021-gui-handoff.md)。不追溯增加待表决设计矩阵。

## 2. 被测对象与原件完整性

证据根：`reports/all-pending-evidence-20261021/A18/okr-journey/`。下文步骤路径均相对该根。不是用当前 Main 的源码、HEAD 或目录名代替实际被测对象。

| 对象 | 实核结果 |
| --- | --- |
| 插件基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，另有 dirty tracked patch 和完整输入清单 |
| 原冻结树 | `/private/tmp/pmtool-a18-closure-20261022` |
| 原 candidate SHA256 | `2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9` |
| 原 tracked patch SHA256 | `1b2becbaa4c910d0d7052ec42127bd3856e57cf49d30c72ec4d3ad55a6921fd4` |
| 源码与产物 | 原520声明输入、453件lib逐项实读同hash；包内src/scripts/四配置及lib完整发现集吻合 |
| 宿主提交声明 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，不以插件基线代宿主 |
| 实例原件 | `final/host-start.json`：PID63429、端口3248、上游cwd、插件指原A18；ready原件相同PID/端口 |
| 原运行根声明 | `/private/tmp/pmtool-a18-feedback-runtime-20261022`；本专家不访问活跃根/profile或服务 |
| 浏览器绑定 | default context、target/frame `BA817F66FCE81BD58357C4B50BFFDF2C`、origin `http://127.0.0.1:3248`、timeOrigin `1792629512672.7` |
| 实际加载 | 2584301 bytes完整响应、status200、fromDiskCache=false；归一化client段1705469 bytes，offset875361唯一出现一次 |
| client.js SHA256 | `9ab0c3e0d94751870a53507530d899d4a711bda4fbe5c2b474ebd66127cc06bb` |
| loaded/result SHA256 | `50aa8e550d0c32b02ebf32004ec64c206ca58b10cc40ef370548b679e5bff10f` |
| 原index SHA256 | `8cffbf2474645452970d99847444458f81772548bf5c2d197dfacbdc28ad63eb`，797/797件bytes/SHA同值、无未列文件 |
| 原observations SHA256 | `4eb931457534c37d8a64d2ffcb0b8ea51693ed9d7a260a2b552c8ddb8d1568a7`，14动作的exit/events/requests/可用rootDiff逐项重算 |
| 原帧 | 14个frames.json共522帧，全部逐件SHA核对；不是522张全部目视 |
| raw绑定 | 13个成功动作的okrs/settings/habits/projects共98份raw文件，逐件hash等于各自after-roots |

加载身份不只依赖 `uniqueComplete` 字段：本专家对原client去除末尾source-map注释并加宿主分隔符，实际重算响应中的完整唯一段与对应SHA。各动作 before/actual/view 的origin/timeOrigin相同；失败步骤没有actual，不捏造其后状态。此身份检查不代替真实GUI。

原520清单包括24份Launcher声明输入。物理Launcher/test另有五份 `fc-a2-additional/fc-a2-followup/fc-a3-probes/fc-a4-probes/fc-independent-probes.test.mjs`，**未纳520**，本单单列实际指纹，不称其“已被候选声明”或继承其测试结果。它们仅在最终审计至补核间确认稳定；不冒称自开工即受1885件保护，也不签完整Launcher输入门。

## 3. 三建议、记录与历史指针

标准F5备份路径由 `final/seed/exit.json.file` 得到，其实际文件为材料专家 `fixtures/F5/backup.json`。该文件 `extra.okrs` 的原目标与本次最早raw完整同值，ID=`okr-mvi5z847-33y3xk`、标题=`F5目标`、projectId=`p-0001`、kind=`objective`、status=`draft`。seed原退出0、原预检/两次确认/恢复图保留。seed boundary中的“original F6 backup”是设施标签笔误，实际file、备份内容及目标回读均为F5；不按文案换fixture。

| 建议ID | 原标题与理由 | 本次末处理状态 |
| --- | --- | --- |
| `okrsug-mvivdffc-rd040g` | QA OKR 采纳草稿；“由人确认后建立草稿；本条用于建议处理闭环。” | clear前confirmed，指向新draft KR `okr-mvivhbaq-sonewn` |
| `okrsug-mvivevtw-58ry3u` | QA OKR 忽略留痕；“只忽略并保留理由，不能生成正式目标。” | clear前ignored，含ignoredAt，无对应新OKR |
| `okrsug-mvivfgj1-oef5vd` | QA OKR 保留待确认；“清理已处理项时必须保留本条pending。” | clear后仍pending，ID/at/理由/字段完整同值 |

新KR `okr-mvivhbaq-sonewn` 的projectId仍p-0001、kind为key-result、primaryOkrId为**原F5目标**、relatedOkrIds为空、status为draft、createdAt/updatedAt均`2026-10-22T01:38:49.586Z`。原F5目标和全部其他已存OKR未改。建议的confirmedOkrId及processedAt与新记录ID/createdAt吻合；最终raw同值，无自动定稿。

历史理由没有假装写入KR记录：理由和confirmedOkrId保留在clear前的收件记录及原请求/响应中。明确clear按合同删本项目两条processed收件条目，并非承诺活动inbox永久保留。历史原件指针为 `confirm-1792633127005/raw/settings/pmOkrInbox.json`、`ignore-1792633142753/raw/settings/pmOkrInbox.json`、`reenter-1792633159657/raw/settings/pmOkrInbox.json`；新业务记录始终在各后续 `raw/okrs/okr-mvivhbaq-sonewn.json`。clear不删这些历史证据或KR记录。

## 4. 实际旅程与有限判定

| 步骤 | 独立有限判定 |
| --- | --- |
| `command-1792632937978/3009125/3036545` | **PASS：suggest三次**。实际POST/run/done后分别新增/更新pmOkrInbox；三ID依次pending，okrs完整等于最早初态，未自动建档 |
| `nav-1792633111064` | **PASS：页面真实收件区**。三条ID/标题/理由/kind、3待确认、各采纳/忽略按钮，与raw相符；不是旧空inbox导航 |
| `confirm-1792633127005` | **PASS：实际页面“采纳并写入归属”一次**。一次confirm命令，新建一个draft KR，树上位于F5目标下；对应建议已采纳，剩2待确认 |
| `ignore-1792633142753` | **PASS：实际页面“忽略”一次**。仅settings改，原确认指针/全部理由保留；ignored可见，剩1待确认，不建新档 |
| `reenter-1792633159657` | **PASS：全部任务→OKR重进**。原draft KR/主归属、confirmed/ignored/pending和全部理由重新可见，raw四表同值 |
| `command-1792633199812` | **PASS：重复confirm拒绝及零业务写**。实际done.kind=error，原文“该建议已确认过”；四根本步无增删改，新KR/建议原值同前。**BLOCKED：空hero错误视觉** |
| `command-1792633237373` | **PASS：本人显式clear processed命令**。实际done明确清p-0001两条已处理/已忽略，pending保留；只settings改，全部OKR/其他业务原值保留 |
| `nav-1792633257090`、`reenter-1792633271342` | **PASS：clear后真实导航及再次重进**。活动inbox只余原第三pending，draft KR仍在原F5目标下；raw/页面一致 |

14总动作另外包含两次host-open和一次原失败导航。原13个exit0是采证退出状态，不是“13项产品PASS”。本表省略步骤前缀处的数字尾码仅指对应 `command-<完整时间戳>` 原目录，具体完整路径、原命令与根差异见audit.steps。

真实 `/api/commands/execute` 请求共13条，与13个user `command/run`及13个同commandId `command/done`一一对应，26个event。session为 `session-04548dcf-b6ba-4259-a7ad-e7957eb0593f`；命令为7条业务意图（含拒绝重复confirm）加6条只读snapshot，不凭采证脚本exit0推断业务成功。

confirm和ignore各真实请求 **1条变更命令+2条`/pm web snapshot`**；对应commandId分别43/44/45及46/47/48，不能把三个请求当重复confirm/ignore。原失败首次开PM另发snapshot42，clear后开PM发snapshot51。六个snapshot的完整okrs及okrInbox分别与对应raw完全相等；初失败导航snapshot对照第三suggest后的raw。没有隐匿实际多发的snapshot或声称“每次仅一HTTP请求”。

## 5. 设施失败、零写边界与目视

原失败 `nav-1792633053707` 的错误为 `Error: visible target missing: 目标（OKR）`，exit1永久保留。失败末帧已有PM全部任务页和“目标（OKR）”旁badge3；后续成功步骤before的按钮文本为`目标（OKR）\n3`。原exact text匹配受badge换行影响，归为采证设施定位失败，不开无依据产品导航缺陷。

归档execution脚本后版采用 `innerText.trim().split('\n')[0]`，沿实际控件标签纠正。它是续采版本，不冒充失败时的脚本字节；旧exact匹配版本未另归档，只保留原exit、原帧与请求，不补造旧执行源码。原失败没有after-roots；以其before→后续纠正before核间隔，只有session cache变化，业务/files/backups/exports无增删改，不称失败当刻拥有完整after样本。

所有有前后样本的步骤：三suggest/ignore/clear只改pmOkrInbox，confirm另外新增该一个KR；其他业务、files、backups、exports不变。13个相邻采样桥接中9处有同session_projcache内容变化，其余为空；不把缓存写误判为业务写，也不宣称整个data根绝对零写。**零额外业务写只覆盖原采证声明的data/files/backups/exports四根**，不扩大为全机、未WATCH根或运行时瞬时内存无变化。

独立目视11份原件：成功收件区PNG、confirm/ignore结果PNG、最终重进PNG；confirm首/末帧、ignore末帧、最终重进末帧、失败导航末帧，以及repeat提交前/提交后PNG。精确路径/指纹在audit.visual。可见三理由/ID、3→2→1待确认、已采纳/已忽略、KR主归属及草稿徽标；正常采纳/忽略toast可见。repeat提交后则只有空hero，没有可见error卡或结果；不以输入清空、WebSocket结果或旧AUTO补error visual。

实际旅程1440×718 dark/dpr2，帧1440×718；loaded原采样1440×900 dark/dpr1独立记录。图片工具显示缩放不当成原CSS视口。不签浅色、文本缩放、读屏、纯键盘、loading/error六态或全视口矩阵。

## 6. SOURCE/AUTO有限继承

[原A18独立SOURCE/AUTO报告](a18-feedback-context-independent-retest-20261022.md) 的签字文件SHA与source-auto-handoff完全同值。该报告已准原错误context设计和独立adapter，旧20原19绿1红仍保留，不在本单重跑或洗绿。原A18的520/453字节保持，且本次真正加载完整client，所以只承认它作为本轮候选建造/加载前提的**原范围有限继承**。

[接口完整回归原证报告](a18-interface-full-regression-review-20261022.md) 的两verify脚本/helper变化不改产品src或453产物，原95新绿与93/95旧FAIL按其原范围保留；本GUI仍绑定**原A18 candidate**，不偷换成521接口输入。旧SOURCE/AUTO不证明本旅程GUI，GUI判定来自本次新原件。Main后续habits A19及其他批次未纳保护或判定，不因其继续合法开发使本轮原件失效，也不自动覆盖新候选。

## 7. 自有验证与释放

本专家环境macOS darwin/arm64、Node v22.23.3；仅Node内置文件API、无产品import/网络/子进程。未调用pnpm，原项目pnpm11.28.5要求不改。全部实际审计命令在仓库根，非产品回归或重新采集：

```sh
# macOS，仓库根；各命令单独执行
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a18-okr-journey-gui-review-20261022-audit.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-okr-journey-gui-review-20261022-audit.mjs freeze
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-okr-journey-gui-review-20261022-audit.mjs audit
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-okr-journey-gui-review-20261022-audit.mjs supplement
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-okr-journey-gui-review-20261022-audit.mjs seal
```

语法检查exit0；freeze exit0/PID83013，1885件原证/声明输入产物/固定参考hash、bytes、mtime、inode纳保护。audit首两次exit1完整保留事实：第一次检查第95行发现器只列包输入、漏Launcher24声明件；第二次第98行机械要求520等于全部发现集，遇五个未声明旧Launcher测试。工具原输出ID分别`91804fd2e821160ab27f30424b15c654`和`be8535571c7b33631e3e060302fd1c0b`；无原PID单独记录，不补造。

只纠正自有发现器并明确五额外文件边界，未改产品/原件或清旧FAIL。终轮audit **exit0/PID83284，18组核对成立**；[audit](a18-okr-journey-gui-review-20261022-audit.json) SHA256=`8c98cc534b26e77c780ed00ba536e1dff81b31a4e66c809db544dd3a0ca6c468`。随后限定补核 **exit0/PID83499，4组成立、98份raw/6snapshot对齐**，见 [supplement](a18-okr-journey-gui-review-20261022-supplement.json)。22组文件审计不冒充22个产品用例PASS。最初缺rg已改用系统find/grep，误定位不存在`views/okr.tsx`退出2，不冒充读取成功；实际核心审读为冻结`src/core/okr.ts`。

所有文件审计及目视完成；最终seal重新检查1885件、F5备份指纹并封本报告/脚本/audit/before/supplement，实际退出及SHA见 [seal](a18-okr-journey-gui-review-20261022-seal.json)。保护从本次freeze起，先前只读检查不冒称受其覆盖；五额外测试和F5文件的补核时段另明记。未监控或冻结Main主树、A19、其他在途testing/livingdocs、依赖、活跃runtime或凭据。

**释放、STOP：本专家无build/GUI/服务/依赖/数据/Main源写锁，不重跑采集或持有运行子进程，不commit/push。** Main按已授权分工继续全部适用独立验收与最后普通commit；本单只可引用上表有限结果。未签范围保留，不能用本次完成替代全积压终审。
