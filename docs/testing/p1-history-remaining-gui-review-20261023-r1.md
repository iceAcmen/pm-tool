# P1 历史余证独立 GUI 有限审查

> 2026-10-23，平台 trae，角色为独立 GUI 审证者，非开发、非 GUI 执行端。只审 Main 已存 `P1HistoryRemainingR1` 的 2122 件和 `P1HistoryReturnR1`。唯一新增文件为本报告同名前缀；未执行产品、GUI、构建、安装、服务、Git 或包内采证器。

## 1. 有限裁决

**指定有证切片 PASS；RA-P1001、RA-P1002、RA-P1006 整 ID 不签 PASS。** 本包未证明产品 FAIL，但仍有原合同缺口，逐项见第 5 节。不能用字节全符、宿主命令正文或 DOM 行存在代替下部队列卡的独立目视，也不把 23 任务／6 项目冒充 F1 平面 24 或 FL/MAX。

原父 goal 为持续原授权，将全部已实现未验独立收口至 ordinary commit，无 push/release/正式切换。本子单只负责 P1 历史有限审证；**不签父 commit、不签 Main 正在冻结的六修组合，不重复派动作、不重执行、不改原案。** 最新续接确认仅作为本轮边界，Main 已续接的新冻结和统一回归不在输入中。

依据为 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[继承报告 §4 与 §5 第 3 组](op-growth-final-inheritance-20261022-r1.md)、[原治理合同 P1001/2/6](remaining-governance-cases-20261021.md)。已签普通 mute/unmute、quiet/off、queue list/open 历史结论不重签、不重派。

机器产物：[audit](p1-history-remaining-gui-review-20261023-r1-audit.json)、[verdict](p1-history-remaining-gui-review-20261023-r1-verdict.json)、[seal](p1-history-remaining-gui-review-20261023-r1-seal.json)。其中 PASS 只落在明确子断言，`parentCommitPass=false`、`combinedSixFixPass=false`。

## 2. 对象、来源与合法历史

| 对象 | 本次实核／范围 |
| --- | --- |
| [原索引](../../reports/all-pending-evidence-20261021/P1HistoryRemainingR1/index-r1.json) | 2122/2122 件大小与 SHA256 相符；索引 SHA `229946f9f242766b58ecb986c26fbf59fa1e6ffbf554b58dc0e0ba62e6d9a5bc`，与 [原 seal](../../reports/all-pending-evidence-20261021/P1HistoryRemainingR1/seal-r1.json) 相符 |
| 候选 | baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，既有冻结 114 source／521 complete inputs；不是 HEAD 代表 dirty |
| complete 清单 | `f7d918b92b7fa65551d5ba2072b04a8e3273950deeca66dea902790bdcf9871a`；只读仓库清单，12 个包内源码副本逐 SHA／大小相符；不访问原 freeze |
| 宿主绑定 | 原 `host-start`／`host-ready` 一致为 3267、PID3133；bundle SHA `e4bda1dba6cd0d0110fa8eafb9f60e58b8a5cef9c6e1390b2016317b31b5c2d3`；只审记录，不探活、不重启 |
| 开关 | candidate `e2e=0`、`pilot=OFF`；本包只覆盖 existing114，后续 P1004/P1005/Listbox/K16/P2002/KR 六修未装载，不沿本报告签新组合 |
| 标准历史包 | 包内 `original-history-backup.json` 106156 字节，SHA `6de364e671f87c661833110034f1bdf48eefe12b13a75dafda1658835f19c63e`；与 GG 原 F7 声明绑定，6 项目、23 任务，sessions 不在 backup |
| 真实日期 | GUI 当天 `2026-10-23`，采证 UTC `2026-10-22T22:17..22:27Z` 即当地 10/23；未改系统时钟 |
| 历史静音 | t-0018 mutedAt `2026-10-13T00:00:00.000Z`、ttlDays=7，至 10/20；10/23 已过期。实际标题是“导出后改名”，不沿历史别名认错对象 |
| 长时低进度 | t-0023／p-0001，start 9/20、updated 10/13、progress20；10/23 启动 33 天／未更新 10 天；不是精确 D-31/D-8 或 MAX |

实际源与宿主、5 份浏览器下发脚本、所有 raw／frames 的字节认领均封在本包。索引全符证明封存输入一致，不证明全部截图已独立看过、不证明新组合或当前活实例。

## 3. 原旅程与限定签字

| 原 ID／切片 | 实证与有限结论 |
| --- | --- |
| P1001：合法缺席初态 | round02 真实 restore-content 预检、round03 图中“预检通过，尚未恢复”；round04 双确认图及真实成功响应，round04 snapshot、round05 raw 为 6 项目／23 任务。**标准恢复成功 PASS**，不是借脚本终码假设成功 |
| P1001：session 生产写链 | round06 无 composer 且无 dispatch；round08 原生“新会话”后真实 `/pm session bind t-0021 s-absent "待跟进"`、`/pm session bind t-0022 absence-only`，各 RPC success。阶段只新增两 sessions，task 不变。**合法重建两绑定 PASS**，不说 backup 恢复了 sessions |
| P1001：absence-only 真实读出口 | round08 `/pm queue list p-0005` 的宿主正文图与 RPC 为 top=null、rest 唯一 t22／absent=true；p4 rest t21／absent=true。**真实命令面板呈现 PASS**，不是 raw 单独替图 |
| P1001：卡片聚合与正确目标 | round10 新增原 queue 卡仅 dashboard settings 写；round11 DOM 含项目名、两 absence 均在 rest，点击“未跟进会话”打开 p4/t21。图可见正确任务表单与项目。**目标打开与项目身份 PASS**；下部 rest 标签的可见性仍缺，不把 DOM 当图 |
| P1001：正常跟进保存与刷新 | round12 表单图可见跟进描述，真实主 save RPC `de71b3bc-ae36-4ead-98ee-c55d8d9e3c96` 成功，仅一次保存；随后 snapshot 中 t21 消失、t22 rest 留存。round13 当前／refresh 与 round14 reload 后 DOM 队列一致，图中积压总数 9→8。**正常保存、派生刷新与重载回读 PASS**；t22 下部行的视觉留存不随 DOM 升绿 |
| P1002：真实 D 的到期读取 | round08 `/pm queue list p-0004` 真实 RPC 与 frame08-56 宿主正文可见 t18／muted=false／lateDays2；round05 至 round16 的 `pmQueueMute` 完整原记录字节未变。**到期派生＋命令 GUI 正文＋历史保全 PASS**；不补造新 mute，也不沿此证明下部卡片行已入镜 |
| P1006：未分配与零 signal | round15 p4 人员页图为未分配 4 open，展开四正确任务、需指派；筛选后明确“当前没有需要提示的砍/缓建议，也没有烂尾倾向标签”。**未分配／零信号不误判 PASS** |
| P1006：历史标签与过滤 | round15 p1 图中事实列与 raw 对应，t23“烂尾倾向 · 启动33天／未更新10天（过滤标签，非裁决）”；过滤仅 t23，建议供人决策、不自动砍缓。**该历史／过滤切片 PASS** |
| P1006：正确目标与返回 | 点击建议打开 t23 表单图，start 9/20、progress20、负责人测试甲；cancel 后实际在 tasks，不能把 round15 `people-returned` 文件名当人员页。round16 真点“人员负载”返回并 chart wheel 采图；t23 version2／全 record 前后相同。**打开→取消→真返回、浏览历史零写 PASS** |
| P1006：现有尺度图 | round16 图入镜轴 0/2/4/6/8、未分配6／测试甲1／测试乙1、阈值5，属于当前小尺度。**仅本图可读 PASS**；“同刻度 MAX3”标题或本图不能代 FL/MAX |

round10 在 p5 项目页出现跨项目 queue 是该既有聚合源的真实行为：[包内 queue-aggregate 源副本](../../reports/all-pending-evidence-20261021/P1HistoryRemainingR1/frozen-source/src/client/board/queue-aggregate.ts) 明确跨项目合并；round11 全局卡带项目名。**不凭项目页所在位置虚构项目隔离 FAIL，也不称已签所有项目隔离语义。**

round12 真实保存只改 t21 `description`、`updatedAt`，并按当前 schema 新增 `manualProgress:null`；不是“仅说明一个字段”，也不把这个兼容键误判数据丢失。snapshot 与 raw 回读保留状态、排期、标题等已有键。

## 4. 必要图证与失败记录

本次真实目视 **15 幅已存图片／原帧**，没有新截图或 GUI 操作。图证仅覆盖下面明确可见的部分：

| 已目视文件（均在 P1HistoryRemainingR1） | 图中可观察事实／限制 |
| --- | --- |
| `round03-precheck-observed.png`、`round04-explicit-confirm.png` | 标准预检与显式二次确认；不以确认图代最终恢复回读 |
| `round08-after-command-reads.png`、`frames/round08-56.jpg` | 真实宿主命令正文的 p5 absence-only／p4 expired mute |
| `round11-global-queue-expanded.png`、`frames/round11-3.jpg`、`frames/round11-4.jpg` | 顶部 queue 与第一 rest 头部；t18/t21/t22 下部未入镜 |
| `frames/round11-5.jpg` | 目标表单转场；正面开目标由下一行清晰图与 RPC/raw 共同核 |
| `round12-followup-before-save.png`、`frames/round12-14.jpg` | t21 已输入描述，保存后表单关闭；success 与唯一写由真实 RPC/raw 补证 |
| `round14-reloaded-expanded.png` | 重载后积压 8；下部 t22 行仍不在图中，不能签卡片标签 |
| `round15-no-stale-signal.png`、`round15-people-historical-filtered.png` | 零信号、事实／建议、33d/10d 及仅看烂尾筛选 |
| `round15-historical-task-open.png`、`round16-people-chart-visible.png` | 正确历史目标与返回后的人员图／轴 |

保留原终码：round01/03/05/07/08/09/10/11/14/15/16=0；**round02/04/06/12/13=1**。不洗旧失败，也不将这些脚本错误直接认作产品 FAIL：

- round02 等错误 `role=banner`；真实预检已返回，round03 可见尚未恢复。
- round04 恢复成功后等错误项目名；原 RPC 已成功，round05 实际 QA-G A 回读，不再恢复。
- round06 无 `[contenteditable=true]`，RPC rows=[]；round08 经原生入口才 dispatch 两 bind。
- round12 wait 漏 `/pm` 前缀而超时；真实 save 成功与 snapshot 已保留，不重 save。
- round13 reload 回宿主中央页后等 `.pm-shell` 超时；round14 原生点击“项目管理”重进；timeOrigin `1792707484654.6`→`1792707870679.2`，同 origin3267，不重 reload。

bootstrap 终码是 **NOT_COLLECTED**，host-ready／精确 PID 只证明启动记录，不补造 outer terminal 成功码。[ReturnR1](../../reports/all-pending-evidence-20261021/P1HistoryReturnR1/return-receipt.json) 为 origin3264、panel=true、timeOrigin `1792708051130.5`：只接收真实返回观察，不读取 return-url 或凭据；没有该返回的图片，因此不签原 F7 新 GUI 或恢复／服务切换。

## 5. exactRemaining：各唯一原缺口

下面是原断言的剩余证据，不是新增用例或动作派单；已签 mute/quiet/open 不重列。

| 原 ID | 本轮唯一剩余记录／状态 |
| --- | --- |
| **RA-P1001** | **BLOCKED（缺图证）**：原 queue 卡下部 rest 中，两 absence 条目的项目名／缺席标签及跟进刷新后 t21 不在、t22 仍在的可见画面。当前命令正文、真实写链、DOM 和 9→8 已足证，不再重做 session、保存、普通 open |
| **RA-P1002** | **BLOCKED（缺图证）**：同一原 rest 读出口中 t18 到期后的普通行／无“已静音”标记的可见画面。真实 D 命令正文 muted=false、历史保全已签；可与 P1001 同一缺图记录归并，不是新 TTL/mute 矩阵 |
| **RA-P1006** | **NOT_RUN（本包未采原 FL/MAX）**：原人员 MAX 尺度的同 fixture 事实／建议／标签读出口。小尺度历史、未分配、零 signal、筛选、目标返回均已签；23／6 或“MAX3”文字不足，既非自动豁免也非 MANUAL_PENDING |

三个原 ID 均仅签切片，不签整 ID；P1001/P1002 的缺图是同一原下部 rest 出口，可去重为一条缺证记录。P1004 的旧 ask 刷新、P1005 的双 L2 事件以及新六修组合都不在本次指定输入和签字范围，不借此关闭、不另派动作。

## 6. 写入保护、核验与封签

原 raw 阶段差异：round05→06=0；06→08-rebind 仅两 sessions；08-rebind→08-reads=0；08-reads→10-before=0；10-before→10-added 仅 `dashboard_project_p-0005.json`；10-added→12-before=0；12-before→13-current 仅 t21；13-current→16-final=0。t23 与原 `pmQueueMute` 保全。

原保护快照两标签：F5 `/private/tmp/pmtool-successor114-gui-runtime-20261022-r1` **54→54、0 diff**；原 F7 `/private/tmp/pmtool-f7-remainder-runtime-20261023-r1` **3→3、0 diff**。只核包内指纹，不访问这些路径，不声称全机器或未监控根零污染。

审查环境 macOS／darwin，现有 Node `v22.23.3`；pnpm 未调用，包内执行记录为 Main 原采证环境。仅运行以下自有读证审计器，不 import 产品／Puppeteer、不执行任何归档脚本：

```sh
# macOS，pm-tool 仓库根，现有 Node22；不需要 install/build
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/p1-history-remaining-gui-review-20261023-r1-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1-history-remaining-gui-review-20261023-r1-audit.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1-history-remaining-gui-review-20261023-r1-audit.mjs seal
```

语法与 capture 实际 exit0，核 2122 件、12 副本／521 清单、2131 个明确输入指纹；seal 结果以同前缀文件实际输出为准。导出的隔离配置仅不解析的字节核对，不读取运行 profile/privatefreeze/runtime／return-url／凭据；不更新 livingdocs、plans、原 testing 或产品，不运行 Git。最终输入漂移及报告／裁决／审计器指纹封在 seal。

**审证到此停止，释放本前缀写面；无 GUI/builder/端口/profile/业务根锁，无后台产品任务。STOP。**
