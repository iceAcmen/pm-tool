# A11 会议布局 GUI 独立有界审证

> 给 Main、负责人与独立测试接续者使用：判定 A10-MGUI-F01 修后布局及 E01 原命令/原文件/新增行取消补证，不签会议整项。平台 trae，独立测试专家；任务日期 2026-10-21，实际审证 2026-10-22。Main 为原 GUI 采集者与唯一 builder，本专家只读审证。

## 1. 结论与未闭项

**A10-MGUI-F01 在 A11 本批局部行动项布局范围关闭，有限 GUI PASS；A10 旧 FAIL 原件和结论保留。E01 三项新增补证有限 PASS，但不倒补旧轮缺证。完整会议 GUI/样式/UX 门仍 BLOCKED，不是 R8/B8、父总门或提交准入 PASS。**

| 对象 | 独立结果 | 有效范围 |
| --- | --- | --- |
| A10-MGUI-F01 修后行溢出/重叠 | **有限 GUI PASS，局部关闭** | 0/1/2 行真实流程；两行各自全宽、标签/控件不横向越出抽屉、行操作/添加/取消/主保存分离并可经内滚到达。原生100%后续两行八场景佐证，未扩大到长内容/200% |
| E01 原磁盘文件 | **A11 当前样本有限 PASS** | 原 before/一行/两行/clear/再次主save/新行cancel 文件；wrapper 字段、稳定ID/来源与原文件 SHA 交叉核对，不重序列化冒原字节 |
| E01 实际命令/回包 | **再次主save有限 PASS** | 20 原 WS 事件、10 成对 run/done；3 会议写命令 + 7 snapshot，均 success，最终3 snapshot record 与 after raw 一致。不是旧 A10 或 A11 早期创建/clear 的 payload |
| E01 新第三行填稿取消 | **有限 GUI/data PASS** | 两已存行后添加第三行、填“新行取消不得落盘”、显式取消；原 before/after 文件同 SHA、21项 data manifest 等值，无 ai-003 |
| task 关联/clear | **单项非空关联有限 PASS** | ai-001→t-0001→null；ai-002 实际一直 taskId=null。两个控件被清空，不是“两成功关联解除” |
| r3 浅/深四档 | **行动项局部有限 GUI/data PASS** | 1440/1024/768/390 × 浅/深，first→last-select→显式cancel；每步原记录和21项完整data manifest相等，command-events=[] |
| r1/r2 错误路径 | **不用于零写 PASS** | r1 ESC关drawer后缺cancel；r2 Enter提交parent form，meeting/session hash变；原件保留，r3仅重证自己的路径 |
| 合法 issue 正关联/解除、原生长菜单、200%、故障恢复等 | **NOT_RUN，完整门 BLOCKED** | F5仅risk、没有issue；未采项不得改 MANUAL_PENDING 或由本批局部绿代替 |

未发现本批局部修后重叠复发；同时原件存在背景外壳1024宽 `scrollWidth=792/clientWidth=739`（浅深均同）、768宽 `709/707`。这不是行动项横向越界的反证，亦不能签“整个页面无横滚”。窄屏设置面板/背景样式不属本次修复合同，不在此追加产品实现或豁免。

## 2. 授权与证据方法

负责人限定：“独立限定A10-MGUI-F01修后A11 GUI审证+E01补证”，以及“仅写docs/testing/a11-meeting-layout-gui-review-20261021前缀，禁止产品/GUI/build/services/credentials/commit”。父 goalcontinue 恢复持续收口，Main 唯一 GUI/build、最后普通 commit 无 push，不转成本专家权限。

已读 AGENTS、collaboration §9/11、[A10原报告§5](a10-meeting-gui-independent-review-20261021.md#5-缺陷与-main-最小合同)、[原计划](../plans/2026-10-21-meeting-action-layout-closure.md)、[独立A11 SOURCE/AUTO](a11-meeting-layout-independent-retest-20261021.md)、其计划与本轮[审证计划](a11-meeting-layout-gui-review-20261021-plan.md)。仅写本前缀；不更新 livingdocs、其他专家文件，不 fetch/pull/install、产品测试/build/verify、GUI、服务、业务数据、凭据、commit/push。

只读 `reports/all-pending-evidence-20261021/A11/` 指定原件、原专家F5 fixture、冻结 worktree 的 candidate 已列明源和453产物；实际 start 仅读明确允许的 `/private/tmp/pmtool-a11-materials-runtime-20261021/artifacts/start.json`，不读取其余活跃运行私有文件。Node 标准库核字段/字节，Swift/AppKit只解码本地图片，不操作应用UI。

像素原件与连续帧为 GUI 判断依据；hash/DOM/bbox/HTTP只辅助身份与边界。三分支378原帧全部经20张[联系表](a11-meeting-layout-gui-review-20261021-selftmp/contact/)逐格查看，另9张状态联系表覆盖actions九张状态图及r3全部24张状态图；关键原PNG/JPG直接放大查看。联系表仅是原图缩放索引，不是重新执行或合成实测。

## 3. A11 候选、产物与运行身份

完整指纹见[2482输入冻结](a11-meeting-layout-gui-review-20261021-selftmp/inputs.json)、[独立机械审计](a11-meeting-layout-gui-review-20261021-selftmp/audit.json)与[终核](a11-meeting-layout-gui-review-20261021-selftmp/final.json)。

| 身份层 | 独立核对 |
| --- | --- |
| Git基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不单独代表dirty候选 |
| 宿主 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，candidate与actual start同；不重签上游授权 |
| tracked patch | `6e09d16e991120ec21a3e88bf26bd4a3e93e6d432e5c1941e53c79ce9d5312fd`，与原patch字节同 |
| candidate/build/source | candidate.sourceHashes与build/sync一致；冻结树511文件匹配，453产物匹配，postDrift/sync.drift/本轮前后漂移均空 |
| materials实例 | port3226/PID32661；start=`2026-10-21T16:30:44.777Z`，cwd上游；plugin指向`/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool`。environment只有setups，本轮实际从允许start核PID，不凭摘要补PID |
| client原产物 | `279d952a9652eb2dd075c9b449bb0201184c90fe27da3dde94e86efbd8d62219` |
| loaded-r2完整响应 | 2575876bytes、200/fromDiskCache=false，SHA=`47d0dda7ee578570218b6890b7bbaeca887ad936bf36a075db9548074602f7c2` |
| 唯一完整client片段 | 1697044bytes、first875361/second=-1，SHA=`7c4818aef0d6132a3157fcb2c2f4879edc72234e8c678ccb93187bbe0bff87f4`。实际归一化原client字节唯一匹配；不是整个combo等于client，非仅关键词命中 |
| actual CSS | 从完整响应结构化解码 `records_default`，与A11冻结records.css逐字节同 |
| 后续页身份 | loaded-r2/network-newcancel/r3：origin3226、timeOrigin=`1792600688705.2`，pilot=off、PM mounted |
| 早期actions身份 | origin3226、timeOrigin=`1792600365427.8`；其loaded-r1完整combo也唯一匹配同一A11client，但无result sidecar，不补造该轮status/cache字段、不把r2后续timeOrigin倒填 |
| 当前主树 | 仅 `packages/dsh-pm-tool/src/client/provenance-panel.tsx` 与candidate不同，为A12接缝；本专家不build、不用当前主src替A11、不签A12 GUI |

修后源SHA与独立SOURCE/AUTO释放一致：表单 `d88c9bee1d2571f7ada3551bc8b7b5f1e7c98d7c2417f78a80a06f4766bb9388`；局部CSS `9cc498a0771c109a779b0b2eb073c675ba7f27c46c75a3b4efb9e45f8a984ce6`；布局测试 `6c7a15bc744675af0fda91dcb289366a41491e0f8107bef8c4f7d0ffd6f00344`。版本/HEAD/存在源码不代替actual身份。

F5原fixture会议 mtg-0001/p-0001、actions=[]、sourceType=manual/sourceSessionId=null、createdAt=`2026-10-21T13:44:55.241Z`。未手改fixture。seed前/预检后只宿主session hash变化，files/backups不变；不能称seed/precheck全根零写，亦不影响后续分段取消实证。

## 4. 原画面与布局复验

### 4.1 0/1/2 行与八态主流程

actions实际viewport **1440×718/DPR2**，不是1440×900/native100。九张观察状态包括zero/one-draft/one-saved/two-draft/two-reopened/two-clear/clear-reopened/cancel-draft/cancelled；八个开表/草稿/保存状态另加取消结果，不能用“八态”抹掉实际检查点。

全部159帧SHA与原frames.json吻合。原000003.jpg显示零行、添加按钮和底部取消/保存分离；随后一行标题/负责人/截止/状态/task/issue自成全宽行。连续主提交、关闭、真实重开后第二行在第一行下方，不再并列挤入父两列；每个行按钮及添加按钮经实际滚动可达。之后clear主保存→关闭→重开→改旧行标题→取消，原字段恢复。

[one-row-draft.png](../../reports/all-pending-evidence-20261021/A11/meeting/actions/one-row-draft.png)、[two-row-draft.png](../../reports/all-pending-evidence-20261021/A11/meeting/actions/two-row-draft.png)与相关bbox支持修后行全宽；其截图下方被viewport/固定footer暂遮的第二行不是“横向裁切消失”，不能仅用这一张截图签全部按钮。后续滚动连续帧和r3 last-select原图显示第二行全部控件、行保存/转任务/删除、添加、取消/主保存。

### 4.2 r3 四宽浅深与 native100

r3 outer-exit=0，记录8场景，完整150帧逐格查看；每场景 first/last-select/cancelled 共24原PNG有同origin/timeOrigin、width与theme观察。first聚焦首标题、内滚到末task select，ArrowDown/Tab后焦点到issue select，再点可见“取消”，页面关闭；没有把Enter当取消。原帧可能按screencast缩放成195×450等，观察viewport仍390×900，不据帧像素或DPR倒推200%。

| 场景 | 行动项实际布局/可达性 | 取消边界 |
| --- | --- | --- |
| 浅/深1440 | drawer x880/w560；两行x909/w498，各高276.09px、间隔12px；第二行通过内滚完整出现 | 各21项manifest/raw相等，最终关闭 |
| 浅/深1024 | drawer x464/w560；行动项仍完整全宽、行/添加/底部按钮分离 | 同上；不签背景外壳横滚 |
| 浅/深768 | drawer x208/w560；首行/末行与焦点环可见，内滚到末控件再取消 | 同上 |
| 浅/深390 | drawer x0/w390；行x17/w352，各高495.88px、间隔12px；字段单列，行按钮/添加/取消经内滚可达 | 同上；不要求所有内容同时装进一屏 |

全部LABEL/INPUT/SELECT/行BUTTON bbox落在实际drawer横向边界内；此辅助断言与真实画面一致，不以它单独签GUI。[浅1440末控件](../../reports/all-pending-evidence-20261021/A11/meeting/widths100-r3/light-1440-last-select.png)、[深390末控件](../../reports/all-pending-evidence-20261021/A11/meeting/widths100-r3/dark-390-last-select.png)直接显示两行/底部操作分离。

[menu100.png](../../reports/all-pending-evidence-20261021/A11/meeting/native-zoom/menu100.png)是真实origin3226浏览器chrome菜单“100%”，**不是task/issue下拉菜单展开图**。仅证明该时点原生缩放；不签长选项菜单或逐场景独立原生缩放核对。r3为nominal100、DPR1的已有补充采证，不将待表决四宽×200%矩阵追溯为本批硬规则。

## 5. E01 原文件、命令与新行取消

### 5.1 原字段与字节

原文件都为 `{version:2,record:{...}}`，meeting除actions/updatedAt外全部与合法F5初态同，包括标题、排期、participants、summary/topics/decisions/notes、来源与createdAt。按stable ID核，不按count判。

| 原检查点 | 精确字段/原文件SHA256 |
| --- | --- |
| before | actions=[]；`77e987a9b01eaf0b1f414ce5c40db64bd7a26dc67e97d1aa4d7b5fbafd655b06` |
| one-row saved | ai-001=`失败待重试一`/todo/owner空/dueDate=null/taskId=t-0001/issue=null；`d74ce97b2d9819da7fc07d29c6af626324efcc74a0b5f6cd79cf9db6281abd11` |
| two-row saved | ai-001全部保留；ai-002=`第二行动项`/todo/owner空/dueDate=null/taskId=null/issue=null；`1e67a885bd3b60350dd64024f4e67e34b52630b0b06872d90384a2331e18c007` |
| cleared saved / next before-save | 两taskId=null、其余action字段保留；两个原文件同SHA=`1f2d4c7a67b495e87e2920b6ac4830ddde3b82468b2f9d60d75b90a873c392f3` |
| next after-save / after-newcancel | ai-001标题=`失败待重试一已复核`，ai-002不变、ID/来源保留；两个原文件同SHA=`73a5004323ce6637c4ea44a2c0a0fd3fd6f3cab5dd160adceb720a421f78fbd4` |
| r3每步before/after | 8对原文件均同SHA=`a85994f7c158e2af82a633fc82b6585bb6e3233ed419b7c39ebf77ca8e410d4c`，与该步manifest会议项同 |

one-row draft完整manifest=actions.before；actions.cancelBefore=after；new-row beforeCancel=afterCancel（各21键）。这些是data字典含宿主session/workspace，不是data/files/backups三根。“两个控件clear”实际仅ai-001从非空解除，ai-002原为空；原A10两非空task关联局部证按未变业务接缝有界继承，但不能冒充本A11两非空GUI实测。riskIssueId全null不等issue正关联/解除。

### 5.2 原 WS 传输而非源码推算

[transport.json](../../reports/all-pending-evidence-20261021/A11/meeting/network-newcancel/transport.json)20条原received事件、seq73–92，commandId逐个run/done成对、kind=success；原始完整data.text回包留在原件中。

| 写命令 | 原commandId | 实际payload与回包链 |
| --- | --- | --- |
| `pm meeting update mtg-0001` | cmd-3b5c165c-36 | 会议原13字段，无actions；run73/done74成功，随后两个snapshot仍保两原标题 |
| `pm meeting action update mtg-0001 ai-001` | cmd-3b5c165c-39 | title=`失败待重试一已复核`/owner空/dueDate=null/status=todo/taskId=null/riskIssueId=null；run79/done80成功 |
| `pm meeting action update mtg-0001 ai-002` | cmd-3b5c165c-42 | title=`第二行动项`，其余同上；run85/done86成功，最后三个snapshot record与after raw完全同 |

其余7命令均 `pm web snapshot`；完整args与7个record见[audit](a11-meeting-layout-gui-review-20261021-selftmp/audit.json)、[snapshot链接](a11-meeting-layout-gui-review-20261021-selftmp/snapshot-link.json)。不是原请求体被源码重建，也不是首次创建两新行一次原子提交；原帧显示再次主save→关闭→重开。没有故障注入、retry或同次修改两旧行状态实证。

随后第三新行填稿→显式cancel的69帧末尾和[new-row-draft.png](../../reports/all-pending-evidence-20261021/A11/meeting/network-newcancel/new-row-draft.png)确认动作；原cancel后仍仅两个stable ID，raw/manifest不变。20条WS事件发生在此前主save，不能把它们当独立“cancel窗口传输零事件”记录；r3另有自己的command-events=[]。

### 5.3 旧错误轮与缺证不覆盖

r1 widths100仅10帧；按负责人派单及r2 outer-exit边界记录，ESC关闭整个drawer后missing cancel设施错误，没有完整终态，保留不判产品FAIL。未找到r1原错误日志，不补造报错文本。r2有700帧/outer-exit0，但before/after会议和session hash变，r3首raw与network after raw仅updatedAt不同（16:46:05.705Z→16:51:04.683Z）；**r2原“cancel zero-write”说明错误，不可用于PASS**。r3原outer-exit在20:08:02.056Z为0，总boundary/8分步boundary/raw完整、command-events=[]，只覆盖ArrowDown/Tab后显式取消的新路径。

E01对本次A11 raw、再次主save传输和新增行cancel补证成立；原A10缺payload/raw、A11早期0→1→2/clear每次写命令未归档的部分仍缺证，不追溯改写旧BLOCKED。不新增atomic、owner popup、issue fixture、200%或长内容用例。

## 6. 继承、未覆盖与终核

| 接缝/旧证 | 本轮处理 | 范围限制 |
| --- | --- | --- |
| A10-F01旧GUI样式FAIL | 原报告/PNG/帧保留；A11新源→冻结产物→实际片段→原图/连续帧重新审，局部关闭 | 不擦旧红，不扩成records/会议全页PASS |
| 独立A11 SOURCE/AUTO及A10成功接受语义 | 三释放hash与actual匹配，按原报告不变业务/callback/domain有界继承 | 本专家未重跑103项，不用内存/组件绿替新GUI |
| 字段/来源/取消 | A11原文件/WS/逐步manifest重证所列路径 | 不签全部kinds、非法引用守卫、富历史/故障全集 |
| 新A12主源 | 单列provenance接缝，冻结A11 511/453始终不变 | 不以主src签A11，不以A11 GUI倒签A12 |
| 完整会议/父总门 | **BLOCKED** | issue菜单/正向关联、长内容/原生长菜单、200%、失败retry/网络恢复、来源跳转、转任务/重复转、危险删除、真实restart、完整键盘/读屏与全部出口未覆盖 |

运行环境macOS arm64/bash，nvm Node `v22.23.3`，项目约定pnpm `11.28.5`（本专家未运行pnpm）；系统Swift/AppKit，无依赖安装。仓库根实际审证命令：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a11-meeting-layout-gui-review-20261021-audit.mjs audit
swift -Onone \
  -module-cache-path docs/testing/a11-meeting-layout-gui-review-20261021-selftmp/swift-cache \
  docs/testing/a11-meeting-layout-gui-review-20261021-contact.swift
node docs/testing/a11-meeting-layout-gui-review-20261021-audit.mjs final
```

| 执行 | exit/证据 | 结果 |
| --- | --- | --- |
| audit首轮 | 1，[保留失败](a11-meeting-layout-gui-review-20261021-selftmp/audit-r1-failure.json) | 专家过宽断言seed前/预检后全部data等值，被原session变化反证；修审计假设，不改产品/原证 |
| audit纠正后 | 0，[audit.json](a11-meeting-layout-gui-review-20261021-selftmp/audit.json) | 511源/453产物一致、1088归档帧SHA全部核对、原文件/WS/r3分步边界成立；机械绿不是GUI签字 |
| Swift联系表 | 0，execution c252803bf684c9001dfa2523a31a2e49实际exited/outputComplete | 29联系表，仅本地解码；378有效路径帧全目视。旧r1/r2另710帧只校hash，不声称全部目视或用其取消判PASS |
| final终核 | 0，[final.json](a11-meeting-layout-gui-review-20261021-selftmp/final.json) | 2482输入前后内容/mtime零漂移，冻结源/产物零漂移，主src仅A12差异；29图指纹及snapshot原record链接保存 |
| Main既有noEmit/build/coverage | 只读原exit均0 | `pnpm exec tsc --noEmit`、`pnpm run build`、`pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache`，原142files/1329tests；非本专家执行或新判全回归 |

辅助一次只读Node字段摘要因多余括号exit1，纠正后exit0、无写入，不是产品测试失败。没有执行产品完整回归/所有verify，不把未跑出口或未采GUI记绿。终核只覆盖明确列入WATCH的归档、冻结源/产物与允许start，不称全机/所有业务资产零污染。

本角色退出检查 `pgrep -f '[a]11-meeting-layout-gui-review-20261021-(audit.mjs|contact.swift)'` 实际exit1/空输出，未留下审计或Swift进程；文档本地链接检查exit0、missingLinks=[]。本轮有限审证完成并释放，不持有GUI/build/服务/测试进程、不commit/push。Main继续既定在途补证与独立门收口、同步档案及最终普通commit；本报告不给发布、正式切换、push或跳过剩余门授权。
