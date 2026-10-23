# 旧包兼容与只浏览独立 GUI 审证

> 2026-10-22，trae，独立 GUI 审证专家；非开发、非 GUI 执行 Main。唯一新增为 `docs/testing/op-legacy-browse-gui-review-20261022-r1*` 自有 reader/audit/report/seal。只读封存原件，不运行产品、Main 脚本或 tests，不操作 Git、浏览器、服务、凭据、构建、安装、其他 testing 或 livingdocs。

## 1. 裁决与范围

**限定 PASS：本包合法旧格式 JSON 的标准预检、两次确认、真实恢复，以及恢复后项目概览/任务列表退出重进的业务零写。仍有一条原视觉余证 BLOCKED：40% 旁注未进入本包 PNG 的可见区域。** 不能称本旧包全部 GUI 已闭，也不据此判断产品 FAIL。

本子单原句边界为“限这一旧包compat/browse，不native/P0–P3/B8/父ordinarycommit”“旧OP112R2另审，别误污染”“审结精准remaining/released STOP”。持续父授权不移交 builder、GUI 或普通 commit 权限。上述特定授权覆盖通用 SOP；未 fetch/pull/install/build/test、未更新进度或交接档案。

依据为 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[原 OP 合同](remaining-objective-cases-20261021.md)及[有限继承 §3/§5](op-growth-final-inheritance-20261022-r1.md)。只裁本轮所交旧包；不扩新的产品门、不重采已证步骤。

| 原断言 | 本轮独立结果 | 准确范围 |
| --- | --- | --- |
| OP-LEG-04 | PASS | 本转换旧包恢复后，仅浏览概览/list、退出重进；11 业务文件 byte/SHA/mtime/ctime/inode 完全一致，无首载补键 |
| OP-BD-02 | 限定 PASS | 当前支持的 JSON 恢复通道保存本旧包实际存在的全部项目/任务字段；不是 Markdown 往返，不签完整备份导出往返或已删清单 ID 保全 |
| OP-GUI-02 的本旧包可读与退出零写切片 | PASS | 实际 PNG 有预检/确认/恢复/概览/列表/重进，RPC 与 rows 一致；80% 旁注实际可见且不充当客观80% |
| 本旧包列表40%旁注实际可见、与客观证据不足分离 | BLOCKED | DOM 文本、两次 RPC、五阶段 rows 均保真；七张 PNG 未覆盖该行，不能由 DOM/哈希代签目视 |

这是原断言切片，不把 OP-LEG-01/02/03、OP-BD-03/04、整 OP 域或整个备份域一并签绿。没有新产品执行；本角色实际工作为原件目视及自有 reader 审证，不能登记成 Main 之外的第二次 GUI 实测。

## 2. 候选与封件认领

本轮自有 reader 截点为 **2026-10-22 23:48:01 +0800**。源声明 baseline 为 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不通过 Git 另读 HEAD，更不以 HEAD 代 dirty 候选。

| 对象 | 独立实读结果 |
| --- | --- |
| [127 封件索引](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/index-r1.json) | 20048 bytes，SHA256 `478e107080540bb25a32f250f5662c61399d0c9c166d858cd167becacf897ac2`；实际文件集合与索引一致，127/127 byte/SHA 相符 |
| [114 源声明](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/source-files.json) | 格式真实为 `{baseline,count,source}`；`count=114`，内层 `source` 114 个路径→SHA 字符串，全在冻结树相符 |
| [Main source-binding](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/source-binding.json) | `source` 确为上述结构的完整未改复制；`sourceCount=3` 数了外层三个键，不是三文件。**纠正为内层114，不判产品 FAIL，不新增门** |
| [完整输入](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/complete-inputs.json) | 521/521 byte/SHA 与冻结包相符，不以114替代完整包 |
| [candidate](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/candidate.json) | version `0.7.4`、Main builder、114/521，与 source-binding 及 host-start 的声明 SHA 对应 |
| 冻结 client bundle | SHA256 `e4bda1dba6cd0d0110fa8eafb9f60e58b8a5cef9c6e1390b2016317b31b5c2d3`，与本轮 host-start 相符 |
| [host-start/ready](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/host-start.json) | 元数据 PID16671/3265、隔离根 `/private/tmp/pmtool-op-legacy-runtime-20261022-r1`、profileTarget 指向114冻结包；不探活、不读运行业务库、不重查软链或操作 PID |

冻结树为 `/private/tmp/pmtool-combined-successor114-20261022-r1`。114及521按原结构解析，完整保存在 [audit](op-legacy-browse-gui-review-20261022-r1-audit.json) 的 `sourceRows/completeRows`。不声称宿主源码或当前服务被另一次验证；PID、cwd、argv、profile、flags 是归档认领，页面同 origin 与 RPC 是当时运行证据。gateway-binding 仅声明复用3261确定性网关；本单无模型生成质量签字。

## 3. 来源与合法转换

[原独立 F2](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json)实际存在，6961 bytes，SHA256 `451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b`，与 [fixture-binding](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/fixture-binding.json)完全相符。

独立 reader 自行解析原 JSON，只在内存删除根 `extra/fileBundleId` 和 task `checklist/manualProgress/manualProgressNote/effortHours/evidenceUrl/attachments/progressLog`，按原序列化规则重建结果。其字节与 [legacy-f2.json](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy-f2.json) **4502 bytes 完全相同**，SHA256 `abb086772fde51f0e96dff4d5a7e9d444b887e1acdca0180cce11631ba1473ee`。

转换保持 `format=pm-tool-backup/formatVersion=1`、一个项目、十个 task、稳定 ID/父子/projectId、状态、原 progress 与时间字段。**这是现有独立 F2 显式构造的旧格式兼容 fixture，不是从历史版本新取出的原始导出，也不是模型新生成来源。** 所删 checklist 本轮不能反称恢复保全；原自动清单往返只沿其他已签报告，不在本单重签。

[setup 与转换脚本](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/execution-scripts/pmtool-legacy-setup-r1.mjs)、[完整宿主脚本](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/host-setup-source.mjs)、[采证 helper](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/helper-source.mjs)及四个 round/seal 均纳127指纹。脚本只读审查，未 import 或执行；旧基础脚本引用不把旧OP112R2候选或结论移植到本轮。

预检与第一次确认的 `roots` 都只有宿主会话/workspace及备份，`data/pmtool` 条目为0；真正恢复 RPC 后才出现11业务记录。恢复脚本通过 UI 的标准入口，不直接 seed domain。恢复返回明确“当前库为空，未生成安全快照”，所以不写“本次真实生成了安全快照”；预检危险提示只说明非空恢复的一般规则。

## 4. 实际目视与 RPC

**七张 PNG 均由本角色实际打开目视。** 不是凭 Main raw-report、executor-observations 或图片存在自判。前3张1458×734、后4张1440×900，全部深色；不签浅色、390、native zoom、VoiceOver或全页面样式矩阵。

| 实际目视 PNG | 可签事实与画面限制 |
| --- | --- |
| [02 precheck](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/02-legacy-precheck.png) | 完整预检成功、项目1/任务10、旧额外表未提供、尚未恢复；确认与取消入口可见 |
| [02 first-confirm](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/02-legacy-first-confirm.png) | “确认整体恢复？”、七类实体、隔离包路径、确认/取消可辨；内容与背景有叠显，不扩大签成整确认组件样式合格 |
| [03 restored](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/03-legacy-restored.png) | “已恢复备份”、任务10、原事实核对卡和 F2-P行可见；其他任务行在下方 |
| [03 task-list](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/03-legacy-task-list.png) | 真列表及 F2-P/F2-M客观证据不足、原手填旁注可见；F2-L1/L3的40%未入镜 |
| [04 project-browse](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/04-legacy-project-browse.png) | 项目概览实际激活；F2-L6“客观证据不足·覆盖0/1·原手填80%”可见，阶段条为无客观值，不把80画为客观完成度 |
| [04 task-browse](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/04-legacy-task-browse.png) | 返回列表、事实核对卡、F2-P/M等可见；40%仍未入镜 |
| [04 list-reentry](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/04-legacy-list-reentry.png) | 重进列表、10任务、原事实卡/F2-P可见；40%仍在画面下方，不宣称重进后该旁注已目视 |

归档脚本记录两次真实 UI 确认：先预检结果的“确认恢复”打开确认框，再点框内“确认恢复”才发送写 RPC。第一确认事件没有 command request，不能把其图等同于已经恢复。

| 事件原件/请求 ID | 真 RPC 与返回审证 |
| --- | --- |
| [02 precheck-events](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/02-legacy-precheck-events.json) `24317.2365` | `/pm restore <隔离旧包>`，`cmd-4510e490-2`：成功且明确“演练，尚未恢复” |
| [03 restored-events](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/03-legacy-restored-events.json) `24317.2366` | 同包 `confirm`，`cmd-4510e490-3`：已恢复、项目1/任务10，空库未存安全快照 |
| 同原件 `24317.2367` | 自动 `/pm web snapshot`，`cmd-4510e490-4`：项目与十个task逐字段等于旧包 |
| [04 browse-events](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/04-browse-only-events.json) `24317.2373` | 重进自动 `/pm web snapshot`，`cmd-4510e490-5`：项目/task再逐字段相同，session ID已变，`queue.openedAt=null` |

四条均按 requestId/rpcId 配对，再解析 `result.ok` 与 `kind=success`；不是凭HTTP200。记录事件无Runtime异常、没有queue open或额外写 command。七态同origin3265、同timeOrigin；退出重进为同一浏览器文档中新会话，不冒称新宿主 PID 重启。

## 5. 业务与时间戳独立回读

[before](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/03-browse-before-mtime.json)与[after](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/04-browse-after-mtime.json)都是11文件，内容完全相同，SHA256均为 `7ea828ba63fca9a80002fef8bd9fe8c8f6ad73e90f6fea4b8c33e05c4972e8f4`。每文件 byte/SHA/mtimeMs/ctimeMs/ino逐值exact。

reader不接受 `beforeAfterExact=true` 自判作证，而读取五阶段各11原始副本，共 **55/55**，检查索引、roots、before指纹，并解析 `version=2/record`。一个项目、十个task各阶段与转换包的记录逐字段完全一致；十task均缺上述七个新键，未补 `checklist:[]` 或人工字段。

`t-0003/F2-L1=40`、`t-0005/F2-L3=40`、`t-0008/F2-L6=80` 原 progress 不变；status、createdAt/updatedAt、其他业务字段同样保持。两snapshot及列表DOM仍有相应40/80旁注和客观证据不足，**只签字段/DOM保真，不能替代40%实际入镜**。

业务零写范围为 **`data/pmtool`**。归档 roots 如实显示旧 session cache变化、新session文件增加、`data/workspace.json`变化；这些是退出重进的宿主记录，未混进11业务文件，不声称整个runtime/data或全机零写。备份文件保持4502字节不变，未发现本包roots中的业务外额外文件/备份改动。

reader对685个明确输入实际取 byte/SHA及纳秒mtime/ctime/inode，捕获过程复核读前后稳定；这些是归档/冻结输入的本角色实读元数据。11运行库的前后mtime来自Main封存快照并由55副本/RPC印证，**本角色没有越权stat运行库**。最终输入漂移检查见 [seal](op-legacy-browse-gui-review-20261022-r1-seal.json)，不把当前封件mtime误写成运行时业务mtime。

## 6. 真实执行收据

[Main五实际收据](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/execution-receipts.json)均逐件回读归档 `execution.json/output.log` 与工具private原件：元数据和输出byte相同，status exited、outputComplete=true、exitCode=0。

| 实际 executionId | 工具进程 PID | exitCode |
| --- | --- | --- |
| `d25a13771d288ef5a1c246753fe9eb16` | 16668 | 0 |
| `357dd3c3d048fa959e31b39c773f14ee` | 16860 | 0 |
| `444f2a41affe08ab0c74308e5ea64359` | 17202 | 0 |
| `21eab28497c1183a8338d3d216b51c07` | 17645 | 0 |
| `80b7706c78d5fdc6801ed271cbe09837` | 17736 | 0 |

另找到**本轮实际封存收据** `969ee28667643f6b15073c7a9e35fdce`：PID17844、23:44:18.758至23:44:19.074 +0800、exited/outputComplete=true/exitCode=0。private `execution.json` SHA256 `ced6af738e7e71ae417c6484c9bdcd0e99d983b0e8f80d4182cdf5d529fe0be7`；62 bytes输出SHA256 `f02a68fc1425316a0b2e61a94079090a042b89e34a9f69beb98f081fddd763e2`，实际输出：

```text
{ sealed: 127, businessFileCount: 11, exactBytesMtime: true }
```

它与封件索引生成时点及本轮唯一输出一致，不只有结构化转述。完整metadata、真实private路径、指纹均纳audit；工具metadata没有完整stdin/命令参数，所以不声称由metadata单独证明全部脚本内容执行。五收据all0、封存exit0是执行事实，不是GUI PASS，不能替代上述独立目视与reader。

## 7. 自检、余证与释放

运行环境：macOS/darwin，仓库根，现有Node `v22.23.3`，bash调用；未调用pnpm。实际执行只有下列本前缀审证命令，无产品测试或探活：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/op-legacy-browse-gui-review-20261022-r1-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-legacy-browse-gui-review-20261022-r1-reader.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-legacy-browse-gui-review-20261022-r1-reader.mjs seal
```

语法与capture实际exit0；capture共1158项原件审证检查、failed=0、685输入，127封件/114源/521完整输入/55原始副本/4RPC/5实际收据/封存exit0。首次自有seal实际exit1：正文的自身seal链接尚未生成，被reader当作一条坏链；输入漂移和空白均0。仅修reader精确识别自身即将独占生成的seal路径，再查语法并重跑；其他链接不豁免。最终seal实际结果、reader/audit/report指纹、归档输入byte/mtime/ctime/inode漂移、链接/空白检查存入seal；seal文件本身不自哈希，seal不是产品test。探索时`rg`不可用改find/grep；首个Main封存输出搜索按JSON格式未命中，改实际Node输出格式后定位成功；不存在的本前缀是新增前确认，不当产品失败。

**remaining：仅本包列表40%旁注实际入镜的既有视觉断言 BLOCKED。** 数据、转换、恢复、浏览零写及80%概览可见无需重复执行；缺口不是MANUAL_PENDING，不增加新功能、矩阵、失败链或另轮旧包。其余native/P0–P3/B8/父ordinarycommit由原负责角色继续，本单不裁；旧OP112R2完全另审。

**released=true，STOP。** 本角色唯一新增自有reader/audit/report/seal，未改任何既有文件；无builder/GUI/源代码/业务根/端口/profile锁，无后台审证进程。没有停止Main的16671服务，不把本角色STOP等同宿主STOP。不发布、不提交、不推动父任务准入。
