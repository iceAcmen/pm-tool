# A18 五类交付检查 GUI 补证有限独立审证

> 2026-10-22，平台 trae，独立测试专家，非开发、非 GUI 执行端。供 Main 与项目所有者核对本次五类规则、目标往返、写入边界和剩余补件；只写本报告同前缀自有审计，不修改产品、原证、其他 testing 或 livingdocs。

## 1. 限定结论

**RA-P0008 有限 PASS：本次项目检查的五条规则各命中准确任务；真实任务表检查卡显示同五条原因与建议；逐条从检查项按 ID 点击，打开对应 TaskForm，核对原字段后取消；检查、导航和打开/取消不改业务。** 五类命令结果和 GUI 往返分别审签，见 §5。本切片无产品 FAIL、无必须重跑或重采的补件。

**不是完整 RA-P0008、全部 check 阈值/负例、wrapped 全消费点、失败恢复、视口/主题/缩放矩阵、读屏、人 final、整包或发布 PASS。** 不回改旧报告结论。旧 [A18-IM-01 文件类型/数量声明 FAIL](a18-integration-more-gui-review-20261022.md#文件资料反思输出缺陷) 和 P20/A20 原红保留，本批不复测、不签修复；Main 的 A19 habit 开发是另批，未纳本候选或不可变保护。

依据 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[remaining 原 RA-P0008](remaining-governance-cases-20261021.md#2-p0底座与采集闭环)、[原 GUI handoff](governance-growth-independent-auto-20261021-gui-handoff.md#2-每组最小动作) 和 [真无材料有限 PASS](a18-true-no-material-gui-review-20261022.md)。本轮只消除原五类实际检查旅程的缺证，不用采集退出码替代独立结论。

## 2. 授权与被测身份

负责人本轮原句：

> 独立A18检查五类GUI补证，非开发/GUI。只docs/testing/a18-check-five-gui-review-20261022*自有audit；禁产品/other testing/livingdocs/build/install/GUIservicecredentialcommit。读AGENTS/collab、remainingP0008/原guihandoff、a18-true-no-material有限PASS、reports/all-pending-evidence-20261021/A18/check-five/index1628/observations25exit0steps/execution/fullcommandsPOSTrun-done/rawroots/PNGframes。实际A18candidate/signedSOURCEAUTO/fullloadedBA817 timeOrigin1792629512672.7 host3248/PID63429冻结453/520source不变，MainsrcA19habit开发另批不纳保护。Main真实command四taskadd t9overdue10/21,t10duesoon10/24,t11progress100todo,t12checklist5/explicit2true/done，加既有t8真正no-material已另独立；check返回five rules exactIDs/PMtablecard同5提示→逐5实际checkitem byID click→同TaskFormid/title字段/原清单状态/模式/evidence→cancel。各25step 0仅采证非PASS，五类命令/界面结果分别判；核原业务字段/material/checklist/covered2/5进度100口径/不自动status。只读card/open/cancel零业务写(允许hostsessionprojcache)与新增/两toggle/status写完全分开，禁止把创建/clear副作用零写。观察25step includes4add5checklistadd2toggle1done/check1/5open5cancel/hostnav+table，实际数按原件核不猜。原schema合法业务today本机10/22没有改Date。仅原五rule/P0008 actual有限PASSFAILBLOCKED，不全checkthresholds/failure/矩阵/readscreen/人final；旧A18P20filecount原FAIL/本批不触。独立目视必要PNGJPG/完整raw哈希保护；候选onlyfreeze oldlibs/index原件/Mainsrcdynamic不纳零写。报告后释放不执行脚本。

收尾补充原句：

> Main接续。继续原五类检查GUI审证，请完成限定结论及必要补件清单后通知。A18/check-five原件25步1628文件；勿修改产品与原证，不重复采证。

本明确限定覆盖通用 fetch/pull、install/build、全 verify、共享档案同步和提交动作；未执行这些动作。只读原归档、已声明隔离候选及必要图片，不访问活业务根、认证、profile 或服务，不启动浏览器，不重放归档执行器。

| 身份项 | 独立核对 |
| --- | --- |
| 插件基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，只是 dirty 候选基线 |
| A18 candidate | `reports/all-pending-evidence-20261021/A18/candidate.json`，SHA256 `2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9` |
| 实际隔离树 | `/private/tmp/pmtool-a18-closure-20261022` |
| 源码与产物 | **520 sourceHashes、453 artifacts** 逐文件实读吻合；不是把 453 当源码数 |
| tracked patch | SHA256 `1b2becbaa4c910d0d7052ec42127bd3856e57cf49d30c72ec4d3ad55a6921fd4`，与原 patch 实字节相同 |
| SOURCE/AUTO | `A18/source-auto-handoff.json` 引用的 [独立报告](a18-feedback-context-independent-retest-20261022.md) SHA256 `78f560e26a14c180d6e38f3d9d7eebbebb17ef11ed1a6532c66c54c43176b9ee` 吻合；只继承其有限签署，原 20 的 FAIL 不洗绿 |
| 源码关联 | candidate 的 panel/result-card/ui-feedback 三源码哈希与上述签署表相同；当前 A19 Main 源码不替代它们 |
| 宿主声明 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，插件基线不代宿主 |
| 运行原证 | `A18/final/host-start.json`、`host-ready.json`，3248/PID63429，plugin 指向上述 A18；只核归档身份，不声称本专家重新检查服务存活 |
| 完整装载 | `A18/final/loaded/result.json`，target/frame=`BA817F66FCE81BD58357C4B50BFFDF2C`，origin=`http://127.0.0.1:3248`，timeOrigin=`1792629512672.7` |
| 完整响应 | combo 2584301 bytes，SHA256 `b4a54301e085753ab4193ae1284156ac779064ec097d7e775970a3d6a9e9f708`；非缓存、完整 client 段 1705469 bytes，仅在 offset875361 出现一次 |
| client 原字节 | SHA256 `9ab0c3e0d94751870a53507530d899d4a711bda4fbe5c2b474ebd66127cc06bb`，归一化段 SHA256 `21d941ca10d41935a5416b58f6da29f2b5520e8bf93396e850de526a68eea343` |
| 本次 25 步 | actual 与 host-state 均同 origin/timeOrigin，与完整装载绑定；逐步没有单独 targetId 采样，不伪造该字段 |

归档执行器 boundary 尚写 `actual A13`，这是旧标签，不更改原件；实际候选、装载、端口和 timeOrigin 共同绑定 A18，不能因目录名或旧标签换候选。完整装载时记录的是 1440×900/dpr1；本次 actual 是 **1440×718、outer1440×857、dpr2、深色**，不把两个时点的 viewport 混成同一采样或缩放矩阵。

## 3. 原件与真实执行链

原根：[A18/check-five](../../reports/all-pending-evidence-20261021/A18/check-five/)。以下步骤短路径均相对此根。

- `index.json` **1628/1628 文件 bytes/SHA256 相同**，无缺件或未列新增；index 自身 SHA256 `ed106f4c5f23a8479ccb857758aeae2ef3c39cf048067fe68c1f8f5a4fecbb4a`。
- `observations.json` SHA256 `985d273f7e10a496eeac6b912b2399d545a758a83610c6d7a15bae75a753adcf`；25 步 exit/events/四根差异独立重算吻合，25 个 exit0 只是采集事实。
- 索引含 **38 PNG、796 JPG、792 JSON、1 mjs、1 py**；796 原帧与逐步 frames.json 的 hash 全部吻合，完整哈希校验不等于逐帧目视。
- `execution/pmtool-a18-check-five-20261022.mjs` 原件实际输入已有宿主 composer、Enter，监听 run/done；点击 `.pm-check-card .pm-check-item` 中含指定 `id + " · "` 的实际元素，再点抽屉“取消”。不是另点任务行编辑。原 seal 脚本只生成采集索引，不签 PASS；本专家未运行这两个原执行器。
- **13 次显式命令 + 1 次导航 snapshot = 14 对** `/api/commands/execute` POST → user `command/run` → 同 commandId 成功 `command/done`，参数和顺序吻合，submittedAttachments=[]。
- 会话为 `session-04548dcf-b6ba-4259-a7ad-e7957eb0593f`。每步 raw 包装文件的实际 hash 与本步 after-roots 中 `/pmtool/<table>/<id>.json` 相同；不只相信 observations 摘要。

实际动作计数是 **4 add + 5 checklist add + 2 toggle + 1 status done + 1 check + 5 open + 5 cancel + 1 host-open + 1 PM 导航 = 25**，不凭描述猜数。

## 4. 合法种子、材料与不同进度口径

四次新增均是真实 `/pm task add`，新增 ID 由产品返回；不是手写库。普通字段 projectId=`p-0001`、parentId=null、description/assignee 空、priority=P1、milestoneId=null；系统生成 code/order、createdAt/updatedAt 保全。真实输入：

```text
/pm task add {"projectId":"p-0001","title":"QA 检查 逾期未动","startDate":"2026-10-20","dueDate":"2026-10-21"}
/pm task add {"projectId":"p-0001","title":"QA 检查 两天临期","startDate":"2026-10-22","dueDate":"2026-10-24"}
/pm task add {"projectId":"p-0001","title":"QA 检查 进度满未完成","progress":100}
/pm task add {"projectId":"p-0001","title":"QA 检查 清单部分完成"}
/pm task checklist add t-0012 需求核对
/pm task checklist add t-0012 方案核对
/pm task checklist add t-0012 实现核对
/pm task checklist add t-0012 测试核对
/pm task checklist add t-0012 交付核对
/pm task checklist toggle t-0012 20fad6ab-b230-4ddd-af30-cfba18780168 true
/pm task checklist toggle t-0012 55c2c18d-42f9-436d-a019-4344a719027b true
/pm task update t-0012 {"status":"done"}
/pm check p-0001
```

这是原宿主命令记录，不是本专家运行的命令。对应新增步骤依次为 `command-1792631897232/1906500/1916605/1923904`；清单追加为 `...1945236/1950316/1956554/1964567/1973363`；显式 true 为 `...2051618/2057999`；done 为 `...2063665`；check 为 `...2069800`。

| 任务 | 原记录与检查前状态 |
| --- | --- |
| t-0008 | `QA 真无材料复盘`，既有 done/progress0，start10/22、due10/23；全文与先前真无材料末态相同，本次 25 份 raw 不变 |
| t-0009 | `QA 检查 逾期未动`，todo/progress0，start10/20、due10/21，code6 |
| t-0010 | `QA 检查 两天临期`，todo/progress0，start10/22、due10/24，code7 |
| t-0011 | `QA 检查 进度满未完成`，todo/**原手填 progress100**，无日期，code8；没有自动 done |
| t-0012 | `QA 检查 清单部分完成`，显式 done、completedDate10/22、**原 progress0**，code9；原清单 2/5，不自动改为全勾 |

五项清单稳定 ID 与最终状态：

| ID | 原文字 | done |
| --- | --- | --- |
| `20fad6ab-b230-4ddd-af30-cfba18780168` | 需求核对 | true |
| `55c2c18d-42f9-436d-a019-4344a719027b` | 方案核对 | true |
| `17de8423-4ac2-409d-bf94-f66ac6ab48d7` | 实现核对 | false |
| `ec0eb4b0-4770-4768-b1da-1d9397e02178` | 测试核对 | false |
| `d45e1c6b-04c0-4c94-93fd-3f5e19308f3b` | 交付核对 | false |

追加只增清单、保旧 ID/文字；两次 toggle 各只改指定项 done 与 updatedAt，status 仍 todo/progress0。显式 done 只改 status/completedDate/updatedAt，原清单和 progress0 不变。

**2/5 是清单完成度，不是任务覆盖率 2/5。** 真实表格原文本为 `客观 40% / 清单 2/5 · 覆盖 1/1`，t12 抽屉为 `40%（2/5）`；t11 则 `客观 证据不足 / 覆盖 0/1 / 原手填 100%`。t12 清单构成客观来源，所以不额外误报缺材料；t11 手填100不构成客观证据，也不自动变 done。本批只核这两种实际口径，不签所有 progress mode。

t8 的 attachments/progressLog/checklist/deliverableId/evidenceUrl 原键仍缺省；四个新增任务 attachments/progressLog/evidenceUrl/deliverableId/manualProgress 均缺省，只有 t12 经真实命令新增 checklist。没有把项目全局交付物、其他任务文件或叙事当作这些任务的已关联材料。旧 t3 的 file/at-1/fa-0001 和旧反思未变，不再当空材料。

日期按本机真实 **D=2026-10-22** 解释：t9 是 D-1、t10 是 D+2，生产响应成功、普通 schema 记录合法。原执行器没有 Date 替换，候选 check 使用 localTodayIso；本专家不改 Date、系统时钟或业务库，不用注入日期伪造 GUI。

## 5. 五类命令与实际界面分别审签

项目 check 原 JSON 按 rule/taskId 排序如下；GUI 按分组显示，**顺序不同不是规则或目标不同**。每条 title/reason/suggestion 与原 check 完成事件一致，命令注记与真实卡含“未覆盖≠未完成”“最终由人”“系统不自动改状态、不自动标记完成”。

| 原规则 / 精确 ID | 命令结果 | GUI 卡→同目标→取消 |
| --- | --- | --- |
| `done-missing-materials` / t-0008 | **有限 PASS**：done 真无材料，准确留缺口，不改状态 | **有限 PASS**：`check-target-1792632184037` → `task-close-1792632188942`，同 title/done/progress0/start10/22/due10/23 |
| `done-open-checklist` / t-0012 | **有限 PASS**：done 且 3 项未勾，提示核对，不否定人完成裁决 | **有限 PASS**：`check-target-1792632175401` → `task-close-1792632179943`，同 title/done/progress0，原2/5和客观40%文本保留 |
| `due-soon-untouched` / t-0010 | **有限 PASS**：10/24 为2天内，todo，提示不等逾期违约 | **有限 PASS**：`check-target-1792632157442` → `task-close-1792632162506`，同 title/todo/progress0/start10/22/due10/24 |
| `overdue-untouched` / t-0009 | **有限 PASS**：10/21 早于真实10/22，todo，完成由人判断 | **有限 PASS**：`check-target-1792632166691` → `task-close-1792632171176`，同 title/todo/progress0/start10/20/due10/21 |
| `progress-100-not-done` / t-0011 | **有限 PASS**：原progress100但todo，数值不自动等于完成 | **有限 PASS**：`check-target-1792632192656` → `task-close-1792632195724`，同 title/todo/原progress100、空日期 |

实际 `pm-nav-1792632076499` snapshot 包含各任务完整原记录，与该步 raw 相同；PM 当前项目为 QA-A-fixture-F5，本项目11任务，检查头记录5提示。五次打开实际存在 title/description/status/priority/assignee/startDate/dueDate/progress 字段，全部与对应原 task 对齐；证据输入为空，不伪填链接。五次取消 title 表单消失、编辑抽屉关闭、原五条卡仍在。

目标 ID 不是从同名猜测：执行器在真实 check item 上按 ID 点击；冻结源码 `byId.get(f.taskId) → onEdit(target)`，panel 以 `task-${drawer.task.id}` 重挂 TaskForm 并传 `drawer.task`；对应 title、状态、日期、progress 和原 record 一起核对。actual 未单独采 hidden id 字段，不声称存在该字段。

**独立目视为 11 PNG + 11 JPG**，逐件路径和 hash 见 [终轮 audit.visual](a18-check-five-gui-review-20261022-audit-r2.json)。包括导航后五条卡、五个不同 title 的真实打开状态、五个取消状态及各对应 compositor 原帧。五次取消与导航的 PNG 本来同 hash；对应6个 JPG也同 hash，原样保留，不充作独立场景数量。目视支持本有限往返，不签整屏/全矩阵。

**清单视觉边界**：原 fields 只记 checkbox.value=`on`，没有 checked；本次顶端截图下方清单折页未逐项滚屏采集。因此原2true/3false由完整 raw、真实两次 toggle、冻结 `checked={item.done}` 渲染来源核验，不冒称“逐个复选框独立目视通过”。同样，下折证据字段为空由 actual.fields 与 raw 核验，不冒称已把下折所有控件逐个目视。无需为本次五条提示→目标→取消有限切片重新采证。

宿主命令阶段仍是 hero、command cards 未呈现返回正文；本报告命令判定来自真实 POST/run/done/raw，**不签宿主命令结果文字已可见、宿主反馈恢复或反思 UI 阅读**，不借后台成功扩大 GUI 结论。

## 6. 写段与只读段严格分离

| 动作段 | 真实写入边界 |
| --- | --- |
| 4 次新增 | 各新增对应 task，不是零写；t11/t12 所在步另有同会话 session_projcache 变化 |
| 5 次清单追加 | 只改 t12 清单及更新时间，不是零写；保完整增量与旧项 |
| 2 次 explicit true | 只改 t12 指定清单项和更新时间，不是零写、不自动 status |
| 1 次 explicit done | 改 t12 status/completedDate/updatedAt；另真实新增 `ref-mviuuk58-6z5qvo` draft/sourceEvent=task-done，不把反思副作用称零写或本批新反思验收 |
| `/pm check p-0001` | **业务零写**；本步允许且实际保留同会话 session_projcache hash 变化 |
| PM 导航 snapshot | **业务零写**；本步有同会话 cache 变化，不声称整个 data 不变 |
| 5 open + 5 cancel | 无命令 POST/run/done；四根本步均零新增/删除/内容变化；原任务/材料/清单/状态全文不变 |
| host-open | 四根本步零写 |

首末业务差异只有 **四个新 task + 一个新反思**，没有既有业务记录改写或删除。所有步骤的 files/backups/exports 不变；既有两份22-byte文件 hash 保持 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a` 和 `875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`。这是原 manifest 的归档证据，不是本专家重新下载或重查活文件根。

24 个相邻快照桥接：**6 个仅该 session_projcache 内容 hash 变化，18 个全零**；桥接业务/文件/备份/导出均零变。7 个步骤内另有该 cache 变化，完整差异保在 audit.steps/bridges。允许该确定缓存路径不等允许其他表写入。没有本批 clear 操作，不把其他批次 clear 或创建/反思副作用归进只读零写。

## 7. 必要补件清单与停止边界

| 范围 | 处置 |
| --- | --- |
| 本次五个实际 rule/ID 的命令、卡、打开、取消、业务不变量 | **无必要补件，有限 PASS 已签；不重复这25步、不改原证** |
| 完整 RA-P0008 原 `check task/project` 双入口 | 本批实际只执行 project check；task 单项入口尚未由本报告签署。如总出口仍需完整ID，Main先映射其他已有独立证据；仅缺证时另交原 task 入口命令与只读回读，不重采本批五项 |
| 完整 RA-P0008 原 wrapped 不催办、叙事不冒充材料 | 本批五种 fixture 没有单独覆盖这些分支；旧 wrapped 命令切片见原 integration-more/RA-P2005，不能从本报告扩成全部消费者。先复用已签范围，真正缺口按原剩余登记另批，不新增规则/页面 |
| 阈值全集、负例/失败态、缩放/读屏/全部字段视觉、人 final | **本批非目标，不为本有限 PASS 追加前置**；原已登记的其他门由原分工继续，不凭本报告转 PASS 或 MANUAL_PENDING |
| A18-IM-01 / P20 file-count 原 FAIL | **保持 FAIL，必须由其修复候选和独立复验另闭**；本报告不提供豁免或修复结论 |
| Main src / A19 habit 与最终统一提交 | 独立另批；不纳本冻结、不给默认继承，不以本切片开启发布或提交 |

这里没有新增用例、设计矩阵、产品需求或 GUI 页面；未覆盖不能伪造成产品 FAIL，有限通过也不等整项。Main 的最后统一普通 commit 仍依总门与持续授权，由 Main 收尾，本专家不 commit/push。

## 8. 自有审计、字节保护与释放

自有 [before](a18-check-five-gui-review-20261022-before.json)、[终轮 audit](a18-check-five-gui-review-20261022-audit-r2.json) 与 [报告前 seal](a18-check-five-gui-review-20261022-seal.json) 保护 **4470 个去重文件**：本批全原证及 index、旧 no-material 全原件/原报告与审计、相关原 testing 合同/报告、A18完整装载/非密身份/候选patch、A18全部声明source/artifacts与完整src/lib，以及 A13/A14/A16旧隔离lib与候选manifest。旧候选仅保护，不重新验收。

**不冻结 Main 当前 src/scripts/livingdocs、A19/A20在途产物、活数据/profile、凭据、服务、共享依赖/缓存。** 自有完整指纹前后 bytes/SHA256/mtime 无新增、删除或漂移，seal untouched=true、auditOk=true。未称全盘零污染，没有旧lib或Main源码写占用。

环境为 macOS/darwin arm64，Node v22.23.3；本次仅 builtin fs/crypto/path 审计归档，未调用 pnpm、安装、构建、产品 verify/test 或 GUI。执行命令及结果如下，均在仓库根：

| 命令 | 退出码 / 意义 |
| --- | --- |
| `node --check docs/testing/a18-check-five-gui-review-20261022-audit.mjs` | 0，初版及更正版语法检查 |
| `node docs/testing/a18-check-five-gui-review-20261022-audit.mjs freeze` | 0，4470个文件完整指纹 |
| `node docs/testing/a18-check-five-gui-review-20261022-audit.mjs audit` | **1，35/36审计断言**；原输出完整保留 |
| `node docs/testing/a18-check-five-gui-review-20261022-audit.mjs audit r2` | **0，36/36审计断言**，1628件/796帧/25步/14事件对/4470保护吻合；不是产品36项PASS |
| `git diff --check -- 'docs/testing/a18-check-five-gui-review-20261022*'` | 0，报告前自有文件差异检查；未提交 |
| `node docs/testing/a18-check-five-gui-review-20261022-audit.mjs seal r2` | 0，报告前最终字节检查，无漂移 |

首轮审计误把创建之前不存在的四个新任务也要求等于最终记录，所以 `fiveCancelNoBusinessCommandNoRewrite` 为false；原目标匹配、取消、四根零写检查均已成立。更正只将“检查之后不变”限制到实际检查→导航→打开/取消时间段，不放宽业务零写、不改产品或原证。首轮 [audit.json](a18-check-five-gui-review-20261022-audit.json) SHA256 `9e80928c73a0cd8623a14e33b64da114617fb96e137b71b2101d191b2cab352d`；终轮 SHA256 `2244753973edf24a9d458a87c2f82e797f76ac3e1339fbc21108c2d83324559e`，两轮均保留。

seal 在最终报告写入前完成，只封其明列的原件/候选/自有审计，不伪称已包含随后报告的 hash。报告后只落同前缀释放记录并通知 Main，**不再执行脚本、不再采证**。本专家限定审证完成、资源释放；无产品/GUI/lib/服务占用，无部署/tag/push/正式切换或专家 commit。
