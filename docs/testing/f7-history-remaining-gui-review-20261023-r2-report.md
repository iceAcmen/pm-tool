# F7 原历史剩余 GUI 独立审证 r2

> 2026-10-23，trae，独立 GUI 审证专家，非开发、非 GUI 执行端。Main 执行；本专家只读封件、实际目视已存截图/帧并判定。原审证 r1 已中断、send finished 且无 report，不声称仍在跑，也不继承不存在的签字。

## 1. 有限结论

**PASS，仅限原 F7 尚缺的收起、数据刷新、浏览器 reload、离开任务页后重进、8 月纵滚及历史字段/原落盘字节保全。没有发现这些指定切片的确证产品 FAIL。**

本结论绑定 [F7RemainderR1/index-r1.json](../../reports/all-pending-evidence-20261021/F7RemainderR1/index-r1.json) 的 **231 件**、冻结 114 候选声明和本报告第 2 节的实际字节绑定。文件数不是用例数或通过率。[verdict](f7-history-remaining-gui-review-20261023-r2-verdict.json) 为独立裁决；[有效 audit-r2](f7-history-remaining-gui-review-20261023-r2-audit-r2.json) 为字节/元数据核对；[seal](f7-history-remaining-gui-review-20261023-r2-seal.json) 为收尾防漂移，不替代目视。

不签原 B1-GUI-04/F7 整门、RA-P3003 整项、习惯整页、组合回归、14 日旧窗口、父普通 commit、push/release 或正式服务切换。旧已签内容保留原签，不重复执行或重新签成当前候选整项。

依据已读：[AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[原 F7 合同 §8](independent-acceptance-batch1-closure-plan-20261021.md)、[成长合同 RA-P3003](remaining-governance-cases-20261021.md)、[继承单 §5 第6组](op-growth-final-inheritance-20261022-r1.md)、[A0 原签](a0-gui-raw-review-20261021.md)、[原习惯签 §6/7](gui-numbers-habit-dark-review-20261021.md)、[06:11 接续](../plans/2026-10-23-0611-continuation.md)。采用已批准原门，不增加待表决设计矩阵。

## 2. 对象、合法历史与绑定

有效审计截点 `2026-10-22T22:21:17.285Z`，即本地 **2026-10-23 06:21:17 +0800**。不运行 Git，也不拿 HEAD 代候选。

| 对象 | 实核结果与限定 |
| --- | --- |
| Main index / seal | 231/231 大小和 SHA256 全等；index SHA `dd17a326a318e8f76988d98cfa76bfdbb31a0d807737078ec50789df521c5cc7` 与 seal 相符 |
| 冻结候选 | 基线声明 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，0.7.4，114 source / 521 complete-input / 455 built 元数据；4 份 original114 与仓库 CombinedSuccessor114R1 对应元数据逐字节相同 |
| 六源码副本 | habits.tsx、habit-model.ts、panel.css、core/habits.ts、storage.ts、backup.ts 与 complete-input/declared 的大小与 SHA 全等；114 dirty 清单中实际包含的三项也相符。其余三项由完整输入清单绑定，不能说114 dirty清单含全部六项 |
| 浏览器执行段 | 仅 script3 含唯一 `id: "dsh-pm-tool"`。字符区间 `[849342,2474564)`，排除宿主末尾 `;\n`，补回不执行的 `//# sourceMappingURL=client.js.map`，得到 **1719089 字节**，SHA `e4bda1dba6cd0d0110fa8eafb9f60e58b8a5cef9c6e1390b2016317b31b5c2d3`，精确等于 built `client.js` 和 host-start 声明 |
| sourceMap/全包 | map 仅元数据 2254508 字节、SHA `5f780e82b1a843b760df04bdb710ed20f96e89c922bab93a186aa635fa2bd137`；**未交 map 字节**，不签 sourcesContent 到源码的独立一致性，不签其余114/521/455文件实际内容、全部五脚本或宿主模块图 |
| 隔离实例 | host-start/ready 声明 **3266/PID98161**，上游 cwd/argv、冻结包、e2e=0；candidate/source/bundle hash 对应。状态原件同 origin `http://127.0.0.1:3266`；不探活、不跟读 profile/runtime |
| 本轮显示环境 | 原状态 CSS viewport **1440×718**，outer 1440×857，dpr2；原PNG为2880×1436，工具显示时缩小。深色目视成立；不以dpr/pageScaleFactor=1代原生100%，不签390/200%/键盘或整套环境门 |
| 原历史备份 | QA-H / `p-0001`、`habit-qa-history-20261021`；原备份3272字节，SHA `842759ed3bb840baceda73bb3dddef201eaa56803f38569a3ed7f3735a1470ce`，与 A0/habit fixture 声明全等 |

旧 A0 总 index 未含后来交入的 `habit/fixture.json`，本次按原签 result 的显式 `hashes` 索引定位：2942字节、SHA `fa4c7263bc4c1f14a2eb8acc69a872d12eac3afbe3a6e96f17698d4bddb53d52`，实核相符。标准备份 `extra.habits` 的稳定 ID/record 与 fixture.habit 全字段一致，project 也一致，不重造fixture。

本次新隔离前置可核：round06预检横幅、round08原生产品确认 dialog、round09点击确认/RPC成功和页面恢复。恢复响应为“当前库为空，未生成安全快照”，与空库相符；不补造安全快照文件或取消链。fixture-binding 的 `restored:false` 是准备时字段，不代表恢复后仍失败。未执行或重签旧fixture生成/取消/幂等/超窗门。

script0..4 的存在本身不证明一致；上述执行段精确匹配才支持封件内的插件字节绑定。没有原CDP scriptId/URL逐项采集索引、sourceMap正文或完整宿主提交复核，不宣称全链独立重建。冻结114不包含后续修复切片，此PASS不自动迁到后继freeze。

## 3. 实际目视与逐项裁决

专家实际打开 **10 张原PNG**：round06-current、round08-current-confirm、round09-restored、round11-all-expanded/august-visible/all-collapsed/after-refresh、round12-reload-history/left-history/reentry-history。另实际打开原帧 round11-7、round11-11、round12-34、round12-35，并打开三张自有联系表看 round11 全20帧、round12 全36帧。不是只读DOM，也不是声称已观看未交录像或每帧原尺寸细读。

联系表只缩放已封 JPEG 并加文件名，未改原片、未生成新GUI。原尺寸帧/PNG用于备注和折叠细查，DOM和RPC仅辅助。56帧为同轮快速采样，不等连续桌面录像或所有加载样式验收。

| 原断言/指定切片 | 判定 | 原证与目视事实 |
| --- | --- | --- |
| F7 收起 / 原§8步骤4余段 | PASS | round11从三月展开到逐月收起。帧7可见全历史，帧11可见10/9已收、8仍展，后帧13..19与all-collapsed图均三月“展开”。没有把初态默认折叠冒成实际收起 |
| 多月纵滚 / 原签GNHD-M06余段 | PASS | august-visible图与帧7/8明确可见8月倒序 **08-31、08-18、08-03、08-01**；18/01有“补记”，四条备注可辨。截图前后内容纵向移动，原round11脚本hover八月后wheel deltaY440，未改DOM制造可见 |
| 数据刷新 | PASS | round11-after-refresh图仍为原习惯，10/9/8组均“展开”；原month-states全false。刷新RPC `/pm web snapshot` 请求/响应同rpcId，snapshot原habit全等。该按钮刷新不是浏览器reload |
| 浏览器 reload | PASS | round12帧1..18为加载，随后恢复PM并出现历史；reload-history图三组折叠且14条历史未丢。timeOrigin由 **1792706596851.3 → 1792706880171.9**，同3266 origin，不能把同timeOrigin数据刷新说成reload |
| 离开/重进 | PASS | left-history图与帧34确为“全部任务”，不是原习惯页别名；reentry图与帧35回“习惯”，10/9/8全false，14条原历史仍可回读 |
| 历史全字段/落盘字节 | PASS | 11份封存habit envelope各2012字节，SHA均 `8edc1bfa099be2ef1fc0e63872173d36e6877dc9f434828f3c035749aed1a5e0`；各`.record`与原备份/fixture全部键值一致，14次日期/note/backfilled及streak/createdAt/updatedAt不改 |
| 指定业务根保护 | PASS，有限 | 11份恢复后root清单均含habit/project/原备份三项，完整键集和大小/hash全等。Main采样范围为data/pmtool、files、backups；不声称目录/空根、exports、宿主缓存、全盘零写 |
| 原3264 F5保护 | PASS，清单限定 | protected-F5-before/after均9232字节、SHA `5a038f1947f87cedf933fd9b55fec1c944046f703dd1139fe2a0699a66ce7709`，逐字节相同；不访问3264、不签F5关系功能、不扩大到正式保护 |

round11帧时间 `22:07:24.107Z..22:07:24.866Z`，round12 `22:08:00.200Z..22:08:01.307Z`，均本地10/23。round11原脚本从全收后才刷新，round12也从全收后reload；**未实测“保留展开态直接刷新/reset”**，不把这个未执行变体纳入PASS，也不追加为新原门。

原fixture D=10/21时近期5条、旧10月1条；本轮真实D=10/23近期4条、旧10月2条，9/8各4条。这个日期差异如实记录，**不拿本日画面重新签旧10/21的D-13/D-14窗口**。显示streak3/3/14与原存档一致，不在本单冒签D+3派生或新增打卡动作。

## 4. 原执行失败与审证工具历史

Main原件保留，不更正原退出码：

- bootstrap0；round01介绍遮挡，终码 **NOT_COLLECTED**，不推exit0。
- round02/03/04/06/08/09/10/11/12记录0；round05误等dialog而实际预检为banner，exit1；round07误等alertdialog而实际为dialog，exit1。后续画面/RPC仅证明继续后的指定结果，不洗前两次runner红。
- firstSeal误读不存在的 `src/core/habit.ts`，exit1；正确模块为`habits.ts`。r2以copyOrCompare比较已有副本、不覆盖，最终补齐六份；Main接续记录r2实际0，execution-receipts的sealR2仍是“由Main记录终码”文字，不冒成封件内的数值0终码。
- 原首seal脚本错路径处之前的写入与r2声明分层；最终六份当前指纹相符，不据一段note还原所有中间文件写入史。

本专家工具历史也保留：

1. `rg`不可用exit127；记忆入口两次sed不存在exit1，未扩大搜索，仓库为权威。
2. 首capture exit1，误以为A0旧总index包含后来habit fixture；按原签result显式hash定位，并修正备份结构，不改原件。
3. 随后capture exit0产出[首audit](f7-history-remaining-gui-review-20261023-r2-audit.json)，但误按两项筛root得到0项，该root核对**无效**。首文件不覆盖；有效capture-r2核11份三项清单，并绑定首audit指纹。
4. 初次Swift联系表有输出但终码未收；repeat只向自有tmp写不同文件名，实际exit0，三张重复图逐字节同。不能由输出存在倒填初次终码。辅助临时任务不冒原r1仍运行。
5. 一次自有Swift进程诊断误列全机进程摘要，随后停止扩大诊断；没有跟读其输出存档、任何runtime/profile/凭据路径，也未控制服务。此操作不提供被测实例证据。

## 5. 验证、写面与 STOP

运行环境 macOS/darwin、既有Node **v22.23.3**；pnpm11.28.5仅引用原环境，未调用。产品测试/GUI执行 **NOT_RUN**；本轮GUI是实际原证目视审签，不冒重新执行全集回归。

在仓库根执行的自有验证：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/f7-history-remaining-gui-review-20261023-r2-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/f7-history-remaining-gui-review-20261023-r2-reader.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/f7-history-remaining-gui-review-20261023-r2-reader.mjs capture-r2
env CLANG_MODULE_CACHE_PATH=/tmp/f7-history-remaining-gui-review-20261023-r2-reader.Uq1hG1/clang-cache SWIFT_MODULECACHE_PATH=/tmp/f7-history-remaining-gui-review-20261023-r2-reader.Uq1hG1/swift-cache swift /tmp/f7-history-remaining-gui-review-20261023-r2-reader.Uq1hG1/contact.swift repeat
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/f7-history-remaining-gui-review-20261023-r2-reader.mjs seal
```

语法exit0；capture历史见§4；有效capture-r2 exit0，231件/6源码/11habit/11root/脚本执行段一致；Swift repeat exit0；seal实际退出码与漂移结果见seal，输入250项，未变化才封存。Markdown末尾换行/尾空白由reader检查，不调用Git。

唯一新增仓库写面为本前缀 reader、首audit、有效audit-r2、report、verdict、seal；另有自有 `/tmp/f7-history-remaining-gui-review-20261023-r2-reader.Uq1hG1` 的图片解码脚本/联系表/编译缓存。未写Main封件、livingdocs/plans、产品、他人testing；未运行浏览器/GUI、build/install、服务、Git或读取privatefreeze/runtime/凭据。封件中的私有路径只作执行声明，不沿路径访问。

Main可引用本次**限定余项PASS**，无需再采这些已足证动作；其他未闭门仍沿原独立报告/父总出口，不因本签字转绿。本专家不提出新功能或父commit计划，不负责父普通commit。无GUI/builder/端口/业务根占用；自有辅助进程已完成，**有限独立审结，STOP**。
