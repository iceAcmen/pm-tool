# RA-F07 中途文件提升失败 GUI 回滚用例 R1

> 2026-10-22，trae，独立 case author，非开发、非执行。仅冻结 Main 的制作与采证步骤，未执行测试、GUI、故障或修复，不给 PASS。唯一可写文件为本文件。**release STOP**。

## 1. 授权与合同

本角色负责人原句，按本次对象生效：

> “父多角色/持续全部既有验收/隔离受控故障授权无正式/push。你独立case author非执行非开发，唯一docs/testing/restore-midpromotion-gui-case-20261022-r1.md（只计划不测试/GUI/fix）。”
>
> “Main当前107host3260/71922，files/runtime纯tmp。”
>
> “最新before用80 Shared raw（别用旧54当当前）。”
>
> “最小source separate tmp标准restore原完整F5后用production file register两新增安全txt A/B(prefix各!=87且不同且target暂无)，A在B前、另projecttitle差异；标准createBackup整json+sidecar。”
>
> “目标仅放<Bprefix>普通文件造成路径ENOTDIR（不是mkdirEEXIST），safety备份仅原资产87 byte不会触此文件，precheck只source通过→DBreplace→A提升→B失败→rollback+删A；Bprefix file留，13表/原byteexact，safety完整。”
>
> “如果实际precheck提前拒即停confirm保反证。”
>
> “No Gitwrite/services/browse/key/vendor/正式data/livingdocs/other testing。releaseSTOP。”

完整本次派单以负责人消息为准；上述为关键原句节录，不扩写为本角色执行授权。

从属原 [RA-F07](remaining-journey-cases-20261021.md#4-真文件与恢复)、[总登记 F5](remaining-acceptance-register-20261021.md)及 [final reconcile §7 第5项](final-remaining-acceptance-reconcile-20261022.md#7-最小剩余动作与交回-main)。本例只补真实 promotion failure 的 GUI 回滚子分支，不改 RA-F07 其他 hash/缺字节/越界用例，不新增空源/空目标恢复门、表、期限或全新功能。

Main 可按本冻结版继续制作和采证，无需另等本角色执行。用例变更交 case author，不由 Main 自改；结果交不同独立专家审签。本角色不执行 Git 写、fetch/pull/install/build/verify、服务、浏览器、密钥或 vendor 操作，不写 livingdocs、产品或其他 testing。父全门后的普通 commit 授权不移交本角色。

负责人最新补充：“当前源码已有非相关renderer/ask/panel开发后新dirty，仍实例107；不要被主输入变化锁住计划/要求再审批。”本例沿用107既有运行绑定和已确认的恢复接缝，不要求整源扫描/重新冻结、旧测试重跑或再审批；非相关主树dirty不是本例停止条件。Main可立即按下列既定小步继续。

## 2. 继承与当前对象

| 对象 | 冻结依据与边界 |
| --- | --- |
| 已有有限 GUI PASS | [ui-backup R1](ui-backup-nonempty-reentry-gui-review-20261022-r1.md)：真实 UI backup、非空恢复、预检取消、两层确认、安全快照、13 表/双字节、新 host 回读已经有限独立 PASS；不是本次 promotion failure GUI |
| SOURCE/AUTO | [backup-web 旧审证](backup-web-independent-retest-20261021.md)及107候选的既有受影响继承链保留各自范围；不重跑旧 backuprun、不把其 hooks/内存测试当本次真实 GUI |
| 候选 | 107，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 加已认领 dirty 候选；原 [source-binding](../../reports/all-pending-evidence-20261021/CombinedGuiR1/j03-source-binding.json)。不是只以 HEAD/version 代表源码 |
| 生产包 | `/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool`；沿用该包已构建 `lib/`，不新 build，不借并行 renderer/taskpred/askauth 新源码冒107装载 |
| 当前目标 | `http://127.0.0.1:3260`，PID `71922`；runtime `/private/tmp/pmtool-combined-gui-runtime-20261022-r1`，files 为其 `/files`；沿用 Main 已合法浏览器上下文 EGO space13/p3 |
| 当前 before 锚点 | [80 Shared raw](../../reports/all-pending-evidence-20261021/CombinedGuiR1/80-shared-gc-empty-applied-raw/)、[80 roots](../../reports/all-pending-evidence-20261021/CombinedGuiR1/80-shared-gc-empty-applied-roots.json)、[80 页面状态](../../reports/all-pending-evidence-20261021/CombinedGuiR1/80-shared-gc-empty-applied.json)。54仅为历史成功恢复，不作为本次当前库 |
| 共享断联后的目标 | t-0001/t-0003/t-0004 已断 fa-0001；taskrefs 为0，但 fa-0001 元数据及原字节保留。不得因零taskrefs删 asset/跑新GC；原生产 metadata 保护语义保留 |

原两文件都在 `87/`，不是两个不同 prefix：

- fa-0001：22 byte，SHA `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`，relPath `87/<该完整SHA>.md`。
- fa-0002：22 byte，SHA `875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`，relPath `87/<该完整SHA>.md`。

Main 开始时重采当前 target-before，并与80的 **pmtool 表及原资产**逐项对照；若其间有后续业务写，停止本例确认，交回新的初态差异，不静默仍称80。宿主 workspace/session 活动单列，不把宿主会话新增为备份表。

## 3. 故障路径与合法种子

只读核对107冻结源码的相关窄段：

- `src/core/backup.ts:343-382`：collect before → 非空 safety → replaceAll → restoreAssetBytes；catch 重放 before，再 rollbackAssetBytes。
- `src/core/file-backup.ts:195-209`：依 `extra.file_assets` 的原数组顺序，await storeAssetBuffer 后记录新字节，再处理下一行；回滚只 unlink 本次新写 relPath。
- `src/core/file-assets.ts:135-170`：现存 prefix 普通文件不作为 symlink 拒绝；检查其下一层文件路径时可出现 `lstat ... ENOTDIR`，早于 mkdir。
- `src/core/file-asset-store.ts:129-171`：生产 `registerFileAsset` 负责安全校验、落字节、续号、元数据；不是虚构 `/pm file register` 命令。
- `src/client/panel.tsx:987-1022,1179-1199`：路径预检区不是 dialog；预检区按钮再开危险确认，最终按钮才发送带 `confirm` 的 restore；失败走错误反馈，保留预检区。

这只是源码路径依据，不是“已触发”证据。Main 实际必须核 source 通过、确认请求、B路径 ENOTDIR、回滚错误文本、存储及 GUI 回读；预检提前拒绝即保持反证，不绕过。

### 3.1 Source 制作约束

1. Main 另建自有纯tmp source，data/files/backups/home/private 与 target 全部不重叠，不使用正式 profile、默认目录或正式业务数据。制作只有一个写者，不并行改 target。
2. 用107包的实际 Cordis/storage-domain/storage-json 和 `openPmDomain` 建立真实 sourceDomain，复用已合法初始化方式并记录其配置路径。不得用 Map/memoryDomain、手写 JSON 信封、表 put 拼造记录或额外注册生产不存在的模块。
3. 原完整 F5 选已有合法源包，不取80 raw冒成标准备份：
   `reports/all-pending-evidence-20261021/CombinedGuiR1/backup-packages/pmtool-backup-2026-10-22T12-41-19-715Z.json`
   连同 `.files.69ba8b57a76af04c/` 全包只读复制到 source 输入区。原JSON SHA `bf685cd0eec617a8d6f01c1de1b5fd69bb83fbd921c062915b8b8effe672a489`；原件不修改。
4. 调生产 `restoreBackup(sourceDomain, copiedF5JsonPath, sourceBackups)` 标准导入完整 F5。只在 source 实例执行；保完整13表、历史、软删、共享refs及双文件，不删metadata简化种子。
5. 在 source 用标准项目更新命令提交：
   `/pm project update p-0001 {"name":"RA-F07-source-midpromotion"}`
   记录真实返回和源表回读；这改的是 project.name，即项目标题，不是 task.title。target p-0001 原名 `QA-A-fixture-F5` 不改。
6. 用生产 validator 制作非空、无脚本/NUL的 `.txt`、`text/plain` 两份不同字节 A/B；SHA prefix 均非87、互异，目标相应 prefix 当前均不存在。内容后缀调整只用于达成 hash guard，不改时间/生产校验。
7. 依次 await `registerFileAsset(sourceDomain, A)`、`registerFileAsset(sourceDomain, B)`，随后生产 `createBackup(sourceDomain, sourceBackups)`；不手造或编辑 JSON/manifest、fileBundleId、relPath、asset ID、表顺序。
8. 对新标准包只读检查：source A/B asset ID、大小、SHA、relPath与实字节相符；两原资产保全；`extra.file_assets` 中 A 的位置严格在 B 前。顺序以实际包为准，不以 manifest 排序或“注册口述”代替。若不成立，停制作交回，不手调数组。

Main source helper 中的新增资产步骤可按以下生产调用展开；`sourceDomain` 必须是上面真实域，`targetPrefixes` 取目标 before 的实际一级目录/文件名称，不是手填“87”。本片段供 Main 制作，case author 未运行：

```js
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
// 从107已构建包的 lib/core/file-assets.js 导入：
// validateUploadedFile、FILE_ASSET_DEFAULTS
// 从 lib/core/file-asset-store.js 导入 registerFileAsset
// 从 lib/core/backup.js 导入 createBackup
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const used = new Set(['87', ...targetPrefixes])
function inputFor(label) {
  for (let n = 0; n < 4096; n++) {
    const bytes = Buffer.from(`RA-F07-${label}-safe-text-${n}\n`, 'utf8')
    const prefix = sha(bytes).slice(0, 2)
    if (used.has(prefix)) continue
    const input = {
      projectId: 'p-0001',
      originalName: `ra-f07-${label}.txt`,
      declaredMediaType: 'text/plain',
      bytes,
    }
    const validated = validateUploadedFile(input)
    assert(bytes.length > 0 && bytes.length <= FILE_ASSET_DEFAULTS.maxBytes)
    assert.equal(validated.sha256, sha(bytes))
    used.add(prefix)
    return input
  }
  throw new Error('未找到符合prefix guard的合法文本；停止，不修改生产规则')
}
const inputA = inputFor('A')
const inputB = inputFor('B')
const assetA = await registerFileAsset(sourceDomain, inputA)
const assetB = await registerFileAsset(sourceDomain, inputB)
assert.equal(assetA.alreadyExisted, false)
assert.equal(assetB.alreadyExisted, false)
const summary = await createBackup(sourceDomain, sourceBackups)
// Main保存输入字节、A/B真实返回、summary.path及整包原件。
// 下一步只读解析该标准包，核A在B前及所有字节，不改包。
```

这是 fixture 制作，不增加新测试脚本门或用户功能。source 预期仅 project.name/合法更新戳及两新增资产不同；原21行加两资产为23行，表仍13个。若实际不同，保真实差异，先交回而非删记录凑数。A/B只登记资产即可，不要求另建 taskrefs。

### 3.2 Target 故障约束

目标 **不标准恢复 source、不导入新资产、不先改项目标题**。只在 targetFiles 下创建一个一级普通文件 `<Bprefix>`，非目录、非软链，使用独占创建避免覆盖；B的完整 asset 路径不创建。记录文件内容、大小、SHA、lstat类型。

Main 创建前最后核：A/B prefix 均不存在、原87两字节可读且相等、target仍80语义；任一冲突停制作，不删除/覆盖现存项。创建后新 before 必须包含这个 blocker：

- `before0`：80语义的目标、无故障文件。
- `beforeFault`：只新增 `<Bprefix>` 普通文件；业务13表及原字节与 before0 相同。后续失败回滚比较此 beforeFault，不把人为故障文件算产品污染。

safety 收集的是 target 原 file_assets 两行，所需字节只有87；blocker 无资产元数据，不在其侧车清单，不会触发 safety 的B路径访问。若实际 safety 制作先失败，本例未达 promotion，保原证停，不改成另一故障。

## 4. Main 冻结小步

每步只记 actual、原件路径、时间、退出码和差异，不填 PASS。环境 macOS + nvm Node v22.23.3 + pnpm11.28.5；不要求本批重装或重构建。

| 步骤 | 动作与明确提交点 | 预期与必须采集 |
| --- | --- | --- |
| P01 | 引用107既有包/3260-PID71922/profile/浏览器绑定，仅记录当时实例及本例实际写根；重采 target-before0 | 不扫整源、不重build/旧测试；页面状态/原PNG、13表原JSON、files/backups清单及大小/SHA与80 pmtool/原字节对照。没有新业务写 |
| P02 | 在 separate tmp 按§3.1标准 restore 原完整F5 | source-only标准命令/API、实际schema/storage配置、返回、原F5/复制指纹；不是本次 target GUI恢复 |
| P03 | source标准 project update，明确提交项目name | 真返回、source p-0001新name；target不变。用该差异辨别回滚，不新造项目 |
| P04 | source验证安全A/B，按A→B生产register后createBackup | A/B实输入与返回、标准整JSON+侧车、实际数组顺序/字节guard/target暂无。原F5不变 |
| P05 | target独占创建唯一 `<Bprefix>` 普通文件，重采 beforeFault | 仅这一人为新增；lstat普通文件、内容SHA。原13表/87字节不变；A完整路径仍不存在 |
| P06 | 开始连续 GUI 原证；更多→填“本机备份完整路径”新source包→点“预检本机备份” | 真请求 `/pm restore "<source完整JSON路径>"` **无confirm**；业务kind success；平面预检区显示完整源计数/额外表、尚未恢复。beforeFault data/files/backups不写 |
| P07 | 核预检结果及roots；仅通过才点预检区“确认恢复” | 第一确认动作只打开“确认整体恢复？”危险层；采警告、覆盖对象/source路径、安全快照说明；无带confirm请求、无DB/字节写 |
| P08 | 危险层中再次点“确认恢复” | **唯一 target破坏性提交点**：真 `/pm restore "<同一source路径>" confirm` 请求/对应业务响应。等待settled，不双击、不改source/target、不点新重试 |
| P09 | 保持故障文件，采真实错误全文与页面状态 | response业务kind error，包含“恢复中途失败，但已自动回滚到恢复前状态”、实际安全路径及B完整路径 **ENOTDIR**；GUI可见错误而非成功toast。危险层/预检区真实状态原样保存 |
| P10 | 立即只读采 afterFailure：13表原JSON、全部files/backups roots及原字节 | 13表逐字段/ID/历史等于beforeFault；project原name/三task断联仍在，A/B元数据不留；A新文件已删除，B完整文件未产生，blocker普通文件原SHA保留；两87字节exact |
| P11 | 封存本次自动safety整JSON+侧车，核全部13表/原双文件 | 安全包业务逐字段等于beforeFault，而非source；file_assets两原行，JSON/manifest绑定、两实字节完整；不得以“出现一个json”代安全完整 |
| P12 | GUI取消保留的恢复预检区，再正常导航/重进任务、records、growth和项目切换 | 实际点取消，不重复restore；原项目/任务仍可读、断联任务无fa1 refs；会议/固定汇报/交付物/习惯/OKR原内容可见，页面无半库/白屏 |
| P13 | Main按既有精确PID合同结束此隔离旧host并从同107包/同roots起新host，回读 | 单PID核端口/cwd/argv→TERM→listener消失→记录新PID/ready/profile/开关；原进程身份需当时重核，不照抄71922杀进程。不动正式3080/3091及其他隔离服务 |
| P14 | 新host实际进入项目/任务/records/growth；走现有资产入口下载原文件 | 新host页面状态/timeOrigin/真实内容与末库13表同beforeFault；原资产下载实副本大小/SHA/字节相等。fa1已无taskrefs，不为下载重新挂接或伪造UI按钮 |
| P15 | 封存本次新原件及所有失败/超时，交不同专家 | 交步骤-原件-候选索引、执行metadata/完整log/console/业务RPC、roots diff与新host链；旧封包不覆盖，不以执行作者判断替专家签字 |

P06不重复旧已签 precheck→cancel→reprecheck 成功分支；本例仍须自己走一次真实source路径预检及两次确认。若 Main确需取消本次预检以收证，记录取消零写，再按同一合法包重入；不把重复取消设为新门。

## 5. 精确证据与判定边界

### 5.1 时间链

交一个贯穿 P06–P12 的原录屏时间段及各步原PNG/页面JSON；截图不替连续动作。命令证据要请求ID、完整脱敏command、响应配对、业务kind/text/error；HTTP200不等恢复成功。drain读取时间不冒请求发生时间。

中途路径的证据组合必须包含：确认前A/B不存在、source A→B真实顺序及字节、绑定107生产await循环、带confirm真执行、错误指向B完整路径、自动回滚文本与安全包、末库和A清理。**单张error图或最终A不存在不能单独证明A曾提升/DB曾替换。**

Main可在confirm前加纯外部只读文件事件观察，记录A创建/删除及能及时读到的实字节，作为补强；不加产品hooks、monkeypatch、人工抛错、延时或再故障。未抓到瞬态如实记录“未观测”，不能冒成实拍DBreplace/A提升，也不新加必须hooks门。源码顺序推导和实际观测分别标明，交专家审证其充分性。

### 5.2 全表与根差异

必须解析全部行及键，而非只比counts：

| 七core | 六extra |
| --- | --- |
| projects、tasks、milestones、risk_issues、meetings、reports、deliverables | settings、reflections、okrs、lessons、habits、file_assets |

settings/extra 保原 `[key,value]` 语义，不误当全部id主键；稳定ID、task三处断联、历史/软删、报告固定内容/来源、成长关联均核。宿主sessions/checks不加为第14/15表；其运行写单列设施diff。

根清单分别交 before0→beforeFault、beforeFault→precheck、beforeFault→afterFailure、afterFailure→newHost：

- data/pmtool：原JSON信封和行值全量保留，逐文件新增/删除/内容SHA diff；语义与原始文件比较分开，不能抹掉重序列化或未知差异。
- files：两87原实字节逐byte相等；A/B完整新文件不存在，Bprefix普通文件SHA/类型不变。生产rollback只unlink A文件，**A prefix空目录可能留下**；若有，单列允许的空目录，不新增“删除所有目录”门。
- backups：P06/P07不得新增；P08失败后仅实际自动安全包及生产真实副产物逐件记账。安全JSON+manifest+原两文件应完整，共4普通文件；新source包有四资产，共JSON+manifest+四字节6普通文件，分别指纹，不能混为本次safety。
- source/helper输出/下载/profile/tmp/runtime：列各自实际写根及新增/删除/SHA；不覆盖 WATCH未采根而称全机零污染。原证复制在自有证据区，不写旧1537/1799声明原件。

新host回读不是复用旧60r3–67：须在本次失败后新PID中实际采网页入口、原行和下载；不称两个asset都GUI下载，除非本次确实各自下载。fa1可用既有授权资产路由下载，记录真实入口/副本；不能把无refs任务上的不存在下载按钮写成已点。新host原字节清单仍须覆盖两asset。

### 5.3 立即停止条件

1. 候选/target roots不属107纯tmp、目标业务不再匹配80、prefix已占用、源包不合法/字节不全/顺序不符：停制作/confirm，交实际反证。
2. P06实际提前拒绝（无论source或target原因）：**不点任何confirm**。保GUI全文、请求响应、root不写/实际diff；本例未进入promotion，NOT_RUN/受阻原因交专家，不绕预检或改错成成功。
3. 错误是safety阶段、mkdir EEXIST、其他路径或恢复竟成功：不是冻结的B路径ENOTDIR；立即保原件和实际库，不自动改fault再跑，不人工标准restore掩盖结果，交专家/父协调者。
4. 回滚未恢复、原字节变化、A残留、blocker丢失、安全包不完整、GUI误成功/不可用：保真实缺陷；Main只采证，不自fix/自判PASS，修复由父派单走原独立门。
5. 工具超时/选择器不符/新host无法起：保原execution非零和真实状态，按实际BLOCKED/NOT_RUN交回；不说“用户必须配合”来自动豁免，不自行增加新期限。

故障文件在失败核对和新host回读期间保留。该计划不授权 GC、删除source/旧证据、再成功恢复target或正式清理；后续自有tmp收尾由Main在父范围单独记账，不在本例先清掉回滚证据。

## 6. 交回状态

本文件已冻结，供 Main 按 P01–P15 制作/采证；本角色没有制作source、访问活库/服务、浏览GUI、运行产品/旧测试或故障，不新增产品修改。只读依据来自原合同、已有有限审签、80原证和107相关窄源码；不将计划写成执行结果。

本例当前 **NOT_RUN（计划）**。独立专家只能对实际受测107/fixture/原件给有限 promotion rollback GUI 裁决；不由本例签整RA-F07/F06/J06、全部恢复门、父全部余项、commit/push/tag/release。其他既有验收及合法并行工作继续，**release STOP**。

## 7. P14 最小澄清（2026-10-22，独立 case author）

本次仅追加澄清 P14 与 §5.2 的下载口径，不覆盖原计划。只读依据：[asset-route.ts](../../packages/dsh-pm-tool/src/core/http/asset-route.ts) 的 `download`：宿主认证通过仍须合法 `taskId`、任务挂接同一 `assetId` 及同项目；认证不替代关联校验。§5.2“fa1可用既有授权资产路由下载”不适用于当前零 taskrefs 初态，以本澄清为准。

- P14：新 host GUI 进入 `t-0001`，通过原 `at-0004` 挂接入口下载 `fa-0002`；采真实入口、请求/响应及下载实副本，大小为22 byte，SHA `875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`，逐byte等于原字节。
- `fa-0001` 在 `t-0001/t-0003/t-0004` 均已断联、taskrefs为0，不要求 GUI 下载；仅保留原 disk/safety/source byte exact 核对。若实际发生宿主认证通过且携带上述合法 `taskId` 的 fa1 请求，只预期 `403 forbidden`、“该资产未挂接到此任务”，不是成功下载；不新增该请求为必测步骤。
- 不造按钮、不复挂业务、不要求双 asset GUI download。新 host 整体回读、13表及双资产原字节等其余原步骤照用，不加新 gate、不重测 P01–P12。Main 可继续 P13，无需再审批；本角色仅澄清计划、不判执行结果或 PASS，**release STOP**。
