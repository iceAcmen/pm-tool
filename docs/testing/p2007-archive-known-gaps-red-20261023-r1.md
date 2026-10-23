# P2007 archive known/gaps 独立红项审证 R1

> 2026-10-23，平台 trae，角色独立测试专家。只审指定封包，不开发、不执行产品或 GUI。**原 K16 真实缺陷确证，RA-P2007 本切片 FAIL；X5 仅本次已返回 known 来源逐句一致断言 PASS；P2007 整项及总门未通过，不裁 ordinarycommit。**

## 1. 派单与边界

负责人原句：“父已授权验完已实现未验、修确证缺陷直到ordinarycommit，无push/release。你为独立测试专家非开发/GUI。”本角色不继承开发/提交动作。“审结输入seal+released/STOP，独立PASS仅本断言，不ordinarycommit。”

本批对象：[P2ArchiveReviewR1/index-r1.json](../../reports/all-pending-evidence-20261021/P2ArchiveReviewR1/index-r1.json)，192 件封包；只读引用仓库内 binding、原 DB 复制快照、RPC、package/README 原字节复制件及截图。只新增本 `p2007-archive-known-gaps-red-20261023-r1*` 前缀文件与自有 `/tmp` reader 输出。没有 fetch/pull、Git、build/install、产品脚本、网络、GUI/service、凭据、private frozen/runtime 访问或产品修改；没有修改原封包、其他 testing、living docs。P1004/P1005 在途成果未触碰。

依据：[AGENTS](../../AGENTS.md) 第 6A 节、[collaboration](../collaboration.md) §9/11、[remaining-governance-cases](remaining-governance-cases-20261021.md) §4 RA-P2007、[op-growth-final-inheritance](op-growth-final-inheritance-20261022-r1.md) §5 第5组、[原 P2 设计](../design/deep-integration-v2-p2-dev.md) §六/七。原设计要求 K16 最小包保留反思 known 行，非全量 backup；原产品 [README 字段说明](../../reports/all-pending-evidence-20261021/P2ArchiveReviewR1/exported-originals/README-字段说明.md) 也明确保留 gaps。不是新增能力或迁移要求。

## 2. 独立 reader 与绑定

独立 reader 只 import `node:fs/path/crypto`，不 import 产品、原采证器或旧审计器。按结构化 JSON 读取，拒绝越界/软链，核大小与 SHA256，保存逐件结果：[audit](p2007-archive-known-gaps-red-20261023-r1-audit.json)、[reader](p2007-archive-known-gaps-red-20261023-r1-reader.mjs)、[终审 seal](p2007-archive-known-gaps-red-20261023-r1-seal.json)。只保护 214 个明确输入，不声称全库/全盘冻结。

| 核验对象 | 独立结果 | 边界 |
| --- | --- | --- |
| 192 件 index 大小/SHA、物理清单及原 seal | 192/192 一致，无缺件/多件；原 seal `NOT_JUDGED` | reader 绿不是 archive 产品绿 |
| 原 index SHA256 | `26587ab70218a12fe9670dc1c8a693533dc71dc1d01bd066710a29ee42f454ac` | 输入 seal 另核，不冒称第193件 |
| binding 12 项 | 6份声明元数据、6份相关当前源码均一致；源码与 `complete-inputs` 冻结指纹相同 | 不遍历 private frozen，不签 521 件当前全同 |
| 候选 | baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；source 114、完整输入521；version 0.7.4 | 未运行 Git；不是用 HEAD 代表候选 |
| 宿主元数据 | PID10975/3264、E2E=0、pilot OFF；candidate/source SHA 回绑一致 | 不查实时服务，不操控进程 |
| bundle 元数据 | `client.js` 1719089 bytes，SHA `e4bda1dba6cd0d0110fa8eafb9f60e58b8a5cef9c6e1390b2016317b31b5c2d3` | 只核 built-artifacts 与 host-start 声明，不重读运行字节 |
| 原根前/后 archive/后 review/后 file | 每轮28份 DB 原复制字节核大小/SHA；三次对前清单均34项零差异 | 另6项 files/backups 仅封存元数据；exports 不在此根清单 |

旧 candidate 的 `runtimeLoaded:false` 是建候选时状态，后续 host-start 与 RPC 是不同时间证据，不能互相替代。fixture-binding 的 `restored:false` 同理，不单凭这个历史字段否认本轮已有 DB，也不据此签标准恢复流程已验。

相关当前源码指纹：[core/archive](../../packages/dsh-pm-tool/src/core/archive.ts) `097f1860da2ee67a29b59f7f1047743e538acfab8856b93b344afb9c88badd55`；[commands/archive](../../packages/dsh-pm-tool/src/commands/archive.ts) `30bc6b35b8c78213ee6306ddab015aa606332a7923736d215993e0ce73c140aa`；[core/reflect](../../packages/dsh-pm-tool/src/core/reflect.ts) `3423fef5553c3314577698439022310e463ab28c2f42c7476f4886d101cf433b`；[review-materials](../../packages/dsh-pm-tool/src/core/review-materials.ts) `0706608d405ae380244a36f0fdc392a391f14caef24f388a583e0960f19305c4`。其余完整大小/指纹见 audit。

## 3. RPC 与导出原件

[真实事件](../../reports/all-pending-evidence-20261021/P2ArchiveReviewR1/round01-archive-review-events.json) 中两组 `commands/execute` request/response 各唯一、rpcId 同一；封存 command 文件与原事件返回对象完全相同，agent/session 同一。

| 真实 composer 输入 | rpcId | commandId |
| --- | --- | --- |
| `/pm archive p-0001 p2-archive-review-r1` | `8f1ea7e1-dde8-45c2-b604-eaa5a93b3c0d` | `cmd-f5f1efdc-76` |
| `/pm review p-0001 2026-10-16 2026-10-23` | `03b77f88-dd48-4ba9-832a-8985f54879d0` | `cmd-f5f1efdc-77` |

archive 生成时刻 `2026-10-22T21:09:32.204Z` 位于 request `.138Z` 与 response `.247Z` 之间；projectId、origin、kind 与原件相符。HTTP200 只作回绑，不作产品语义通过。时间为原证 UTC；本报告日期为本地审结日期，不改时钟或周期。

导出 package 7303 bytes，SHA `e34f1fc12b9b78436ab96af92b6ac51f1062612ffc67c61fc953453e9c21cc3b`；README 1290 bytes，SHA `3f5b60e6d3e60775e5c1c9ff02c8337cd4a473c1b419aadecc8898d5e2e95f02`。独立读取仓库 `exported-originals` 与 [原复制清单](../../reports/all-pending-evidence-20261021/P2ArchiveReviewR1/round02-export-originals.json) 大小/SHA一致；`round02-file-0/1.json` 的完整文件正文与复制件逐字节一致，URL 指向原隔离 exports 的真实 `file://`。没有为了对照再访问 private runtime；“原件一致”限定于封包中的复制指纹、完整 body 与采证脚本/截图交叉链，不声称本角色重新打开运行原件。

44帧 composer 和6帧 file 事件指纹均回核，事件内异常记录0；不把“无异常记录”扩为整宿主无错误。

## 4. K16 红项与 X5 有限断言

[实际 schema](../../packages/dsh-pm-tool/src/core/storage.ts#L38-L59) 是 `ReflectionRecord.draft.lines/draft.gaps`。本轮原 DB envelope 为 `{version, record}`，独立 reader 取 `record`，按稳定 ID/projectId/sourceEvent 对照 archive/review，不用 Main 的观察结果代判。

| 反思 ID / sourceEvent | 源 known 行 | 源 gaps | archive known/gaps | review known |
| --- | --- | --- | --- | --- |
| `ref-mvi5z85j-yk04ji` / task-done | 4 | 0 | `[] / []` | 4，逐句相同 |
| `ref-mvk0iiij-42f7xa` / milestone-achieved | 1 | 1 | `[] / []` | 1，逐句相同 |
| `ref-mvk0n0me-25tmos` / deliverable-accepted | 2 | 1 | `[] / []` | 2，逐句相同 |

**缺陷 P2007-K16-KNOWN-GAPS：FAIL。** 三条合法嵌套草稿共7条源 known 行、2个源 gap，archive 的三条记录都保留了 ID/sourceEvent，却把 knownLines/gaps 输出为空。里程碑/交付物各1条“关联任务尚未闭环”gap丢失；task-done 原gap本为空，不称第三条也发生gap丢失。这是真实打包数据丢失，不是 GUI 没露出、错误 fixture、时钟、模型或采证摘要问题。

根因：[core/archive.ts](../../packages/dsh-pm-tool/src/core/archive.ts#L94-L108) 的 `pickReflection` 读 `r.lines/r.gaps` 顶层，而这3份原记录顶层无此字段；[reflect](../../packages/dsh-pm-tool/src/core/reflect.ts) 与 [review-materials](../../packages/dsh-pm-tool/src/core/review-materials.ts) 都产/读嵌套 draft。无需改存储 schema、重建源草稿或迁移数据。

[旧 archive.test.ts](../../packages/dsh-pm-tool/src/core/archive.test.ts#L54-L63) 将 `r-0001`、`task.done`、顶层 `lines/gaps` 直接塞 fake domain，既不是真实 ID/枚举，也绕过真实 schema；它可能漏检此问题。这里只读检查测试代码，没有运行旧用例，不能据此撤销所有旧测试或宣称全部失效。

**PASS 限定断言**：X5 本窗口已经返回的3条反思7条 known 文本，JSON 中按ID/sourceEvent/title对应源记录，Markdown 中逐句存在，`reflectionKnownLines=7` 为实际行数总和。仅证明这些已返回素材的来源/计数，不证明人工验收7句内容质量、反思生成/幂等/定稿、周期边界或整个 review 契约。

archive 成功提示的“复盘 known 行 3”实际来自 `snapshot.reflections.length`（[commands/archive:46](../../packages/dsh-pm-tool/src/commands/archive.ts#L46)），是3条反思记录数，**不是3条正确已核句，更不能说已核7句**；包内实际known行0。本合同只修核心投影，不借此扩成命令文案或新统计功能改造。

## 5. 目视与未覆盖

独立专家通过 `view_image` 目视以下4件原截图，不操作浏览器：

- [after-archive](../../reports/all-pending-evidence-20261021/P2ArchiveReviewR1/round01-after-archive.png)：真实composer反馈包含隔离路径、任务/交付物/证据/反思记录计数及“非全量镜像/未写K18”文案。文案声明本身不证明内容完整。
- [after-review](../../reports/all-pending-evidence-20261021/P2ArchiveReviewR1/round01-after-review.png)：composer反馈可见周期、7条known文本、JSON；这是现有命令输出，不冒称新素材页面或完整样式/UX通过。
- [file-0](../../reports/all-pending-evidence-20261021/P2ArchiveReviewR1/round02-file-0.png)：真实文件JSON视图可见 origin/kind/时间/p-0001及任务字段。截图只露出上部，空known/gaps的断言来自完整JSON字节，不冒称目视到页面下部。
- [file-1](../../reports/all-pending-evidence-20261021/P2ArchiveReviewR1/round02-file-1.png)：字段README完整可见，含known/gaps和非全量镜像边界。file URL由对应原状态JSON回绑，截图无地址栏不伪称目视地址栏。

源6任务（p-0001五条、p-0002一条）全部当前todo；review `tasks=[]`、done0/wrapped0、avgDoneProgress=null。旧 task-done 草稿存在不证明当前task为done，反思素材7句不能代替done/wrapped正例。

**P2007 整项仍欠原余链**：done与wrapped的真实 archive/review 项目/周期/正式完成口径、周期边界和重进/复读。四轮状态 `timeOrigin` 相同，不能把“after”快照当真实重进；本包没有证明这些已验，保持未签/NOT_RUN，不伪记PASS。原第5组恶意web与31/29出站历史也是其他未签链，本轮不验、不继承绿，不用本FAIL代替其结论。未全域核资料/日志、覆盖拒绝/confirm或其他目标；总门仍欠原余链。

## 6. 最小修复与复验合同

此处是交开发/Main的既有缺陷修复/采证合同，不是本角色执行授权。修复后新候选绑定必须重建，不修改本封包或覆盖红证。

| 范围 | 最小动作 | 必要复验 |
| --- | --- | --- |
| 产品 source：仅 `src/core/archive.ts` 的 `pickReflection` | 读取真实 `r.draft.lines` 筛选known及 `r.draft.gaps`；保原ID/sourceEvent/字段与只读语义 | 同一源下4+1+2行、0+1+1gap逐句完整；pending/blank不进入known；不伪造文本 |
| 必要专项：`src/core/archive.test.ts` | 改/补真实 `reflectionRecordSchema.parse` 合法 fixture；三种实际sourceEvent，嵌套draft；含known/pending/blank、空行集与非空gaps | 先证明旧实现对此红、修后绿；断言真实ID、事件、顺序/内容、原对象零变、不同项目不串；不再用顶层假记录遮掩 |
| 主chain：原RA-P2007 archive/review | Main/开发按既有合同从合法保存/标准恢复的同等fixture采新composer请求→RPC→原包+README→真实file打开→前后DB/原根清单→重进复读 | 原7行/2gap的source→archive完整回绑；review7行不退化；实际done/wrapped及周期语义仍按原余链补，不新增页面 |
| 候选与回归 | 唯一builder或隔离输出；登记baseline/diff/新增指纹、产物、宿主、PID/端口/flags；构建和当前全部verify及受影响专项由执行端完成 | 新原证独立审签；本红证保留，受影响结果不得直接继承；不跑本角色产品测试来代门 |

不改 `commands/archive.ts`、`core/reflect.ts`、`core/review-materials.ts`、存储模型/业务记录；不增迁移、兼容历史伪schema、AI生成、页面、后台功能；不碰P1004/P1005。如确需扩大修复范围，须单列证据/原因与授权，不借本合同扩范围。

## 7. 实际验证与释放

实际环境 macOS/darwin、仓库根、现有 Node `v22.23.3`；pnpm未调用。指定 memory入口不存在，`rg` exit127后改用find/grep；定位中不存在的 `schemas.ts/tests/archive.test.ts` 与新前缀尚不存在导致非0，不是产品失败。遵循本次明确只读审证授权，不执行通用SOP中的Git/install/build或living docs更新。

macOS终端、仓库根，实际执行的 reader 命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --version
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/p2007-archive-known-gaps-red-20261023-r1-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p2007-archive-known-gaps-red-20261023-r1-reader.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p2007-archive-known-gaps-red-20261023-r1-reader.mjs seal
```

`--version/--check` exit0。capture首轮exit1：自有reader误按source-files包装对象计数，原失败输出留在 `/tmp/p2007-archive-known-gaps-red-20261023-r1-audit.json`；只修reader解析为 `sourceFiles.source/count/baseline`，第二轮capture exit0，20项核验满足，214输入指纹，192封件一致。**20绿包含“确证archive红”检查，不是20产品用例PASS。** 正确输出为 `/tmp/...-audit-corrected.json`，原字节复制为本前缀audit。终审seal核214输入漂移/封包物理清单/输出复制一致及语法和正文检查，具体退出结果见seal；没有Git diff。

本轮产品执行 NOT_RUN，GUI执行 NOT_RUN，原截图目视已完成；独立结论仅第4节两项，不签整P2007、P0–P3、总候选、ordinarycommit、push或release。无产品源码/builder/端口/profile/业务根/GUI锁，无长运行子进程；自有审证输出已交。**released，STOP。**
