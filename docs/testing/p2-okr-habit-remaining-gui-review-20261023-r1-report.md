# P2 OKR 与习惯剩余 GUI 独立审证 R1

> 2026-10-23，平台 trae，独立 GUI 审证专家，非开发、非 GUI 执行端。只审 `P2OkrRemainingR1/index-r1.json` 封存件及本单允许的原合同、114 元数据和原独立报告。Main 唯一 builder/GUI。本角色只新增本文件同名前缀，不签当前组合、父全部门或 ordinarycommit。

## 1. 有限裁决

**RA-P2004 的 KR 软关联树中可见性 FAIL；其他已证切片有限 PASS；RA-P3004 原精确“失败表单保输入”仍 BLOCKED。** 不能将后三项的有限通过合成第 6 组全部通过。

| 原 ID / 本轮断言 | 裁决 | 精确边界 |
| --- | --- | --- |
| RA-P2003：B 动态隔离、clear 反例、已处理拒绝正文 | PASS_LIMITED_GUI | B 页不露 A，clear 只删除 B ignored，A/B pending 保留；重进同。此次是对 ignored 再 confirm 被拒，不伪称再次确认一个 confirmed 成功记录 |
| RA-P2004：单主父、草稿保存、切软关联、人 confirmed、非法保输入 | PASS_LIMITED_GUI | 主父 A 未变；missing/B 在前端拒绝，精确 self 经真实 RPC 拒绝；失败均零业务写 |
| RA-P2004：KR related 可见不计权重 | **FAIL** | 合法 related 第二同项目目标已落盘并读回，新增、恢复、reload 后树中均不显示。仅“不计权重”的原 AUTO 可有限继承，不能拿它洗掉可见性 FAIL |
| RA-P3004：第二同项目目标保存/重开、missing/B 命令拒绝、只读身份集合 | PASS_LIMITED_GUI / READ | 合法表单保存、重开/reload 关联行成立；两命令错误正文真实可见且零写；只读 filter 匹配 1 个真实习惯，不冒聚合页面 |
| RA-P3004：原“失败表单保输入” | **BLOCKED，非产品 FAIL** | 当前控件只有白名单选择，没有 raw-ID 输入。命令发送时表单已关闭，合法字段重开不是失败草稿保留。原断言未证明，也不因没有新按钮判产品缺陷 |
| RA-P3005：cycleDue 读出口与 disabled hook 占位 | PASS_LIMITED_READ + 原 AUTO 有限继承 | 实际设置并读回的是第二目标的 `okr.cycleDue`；不是给 habit 写 cycleDue，没有执行 hook/定时器，不称 scheduler 已触发 |

原收件同项目 confirm/ignore/clear、习惯 final、原 F7 历史等只保留 [原继承合同 §4/§5 第6组](op-growth-final-inheritance-20261022-r1.md#4-p0p3-逐-id-继承) 中已签范围；本件不重新签或重派。原 [P2003/4、P3004/5](remaining-governance-cases-20261021.md) 不改写。

## 2. 授权、候选与完整性

负责人本单关键原句：

> 父授权继续全部已实现未验/修确证缺陷至ordinarycommit，无push/release。你独立GUI审证专家，非开发/执行端。只审Main新 reports/all-pending-evidence-20261021/P2OkrRemainingR1/index-r1.json 封2372件，原合同 docs/testing/op-growth-final-inheritance-20261022-r1.md §4/§5第6组、remaining-governance-cases-20261021.md 的P2003/4、P3004/5。唯一写 docs/testing/p2-okr-habit-remaining-gui-review-20261023-r1* 新文件及/tmpreader。禁产品执行/GUI/build/install/service/Git/凭据/privatefreeze/runtime/原testing/封件/livingdocs/plans写。

本单限定覆盖通用开工拉取、安装/构建/回归、livingdocs 更新及提交流程。依据 [AGENTS](../../AGENTS.md)、[协作 §9/§11](../collaboration.md#十一深度复盘后的执行合同与证据规则adl-0572026-10-21)，不将父普通提交授权下放成本角色提交权限。

| 对象 | 独立实核 |
| --- | --- |
| [新 index](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/index-r1.json) | **2372/2372** bytes/SHA 相符；SHA `8451130fee227512dd540ef8b8d42a7fb5e46d8c37997e1277c2d5cd4a8e83a5` |
| 封存完整性 | 目录仅 `index-r1.json`、`seal-r1.json` 两个封装文件不在 index；seal 的件数、index SHA 与实读一致，无其余漏件 |
| [source-binding](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/candidate-source-binding.json) | 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；114 声明 / 521 完整输入，非功能数 |
| 10 份 actual frozen source | 全部 bytes/SHA 与 binding、其 declared、[原114 complete-inputs](../../reports/all-pending-evidence-20261021/CombinedSuccessor114R1/complete-inputs.json) 精确相同；未访问 private freeze 或 runtime |
| 原114变更清单 | 只核原元数据，count=114、baseline 同；10副本中 panel/habits 在 changed-source 清单，其他8不在。**不在 changed 清单不等于没有源码**，完整输入表10项均有 |
| 实例/开关 | 3264 / PID10975、e2e=0、pilot=OFF，按封件与原独立报告绑定；不探活、不重解析 profile、不接管 GUI |
| 页面连续性 | 实核46态。reload 前 timeOrigin=`1792704304085.6`，reload 后=`1792705801395.2`；origin 均为 `http://127.0.0.1:3264`，未伪称 reload 前后同 timeOrigin |
| 目视环境 | 1440×718 / DPR2，深色；仅签指定断言，不签浅色、200%、四视口/全键盘矩阵 |
| 原114整回归/GUI | 有限引用 [整回归报告](combined-successor114-regression-review-20261022-r1-report.md) 和 [原前缀GUI报告](copilot-prefix114-gui-retest-20261022-r1-report.md)，不执行其 reader、不重新审其旧封包 |

Main 新 P1004/P1005/Listbox/K16/P2002 未安装到114；本件 **不核当前主树、不签当前组合**。原114整回归161/1691、DOM17、专项7、默认95等保持原专家范围；既不扩成本 KR 可见性通过，也不要求 Main 为本次纯审证重跑。宿主 Git、首装缓存与整宿主 bundle 资格沿原报告边界，不用插件 baseline 代宿主身份。

本次10副本中关键 SHA：`views/okrs.tsx=2408f42a166060596cd7d72462fe34ffcba5c7a69f2f0233da17a102c4926b8f`；`core/okr.ts=5855f5af46657dad2642ff0c2789f92d210401f13198e5472803792533392c7d`；`core/habits.ts=641254ae50c5aee99be7f6be23300ccc89d022807d8bd5ee2689fedd9e1db684`；`cycle-hooks.ts=d629d57eb4ad90b440ca08911155e7c6ab064dd2d5120723aeb478b6078600a6`。全10项见 [有效审计 r2](p2-okr-habit-remaining-gui-review-20261023-r1-audit-r2.json)。

## 3. RPC 与全部 root 连续写边界

独立 reader 复算 **46个 root快照 / 45段连续差分 / 1594份业务 rawJSON**，每份 raw 的 bytes/SHA 对齐当态 roots。误命名 `round13-after-clear-roots.json` 实为 UI origin 对象，只跳过该 UI 对象；真正 root 是 `round13-after-clear-roots-roots.json`，未漏 clear 前后比较。

17轮 events 共 **35对请求/响应**，按 rpcId 一对一配对，0孤儿/0缺失；**24份 command/result** 逐完整响应体和 status 与 events 配对。HTTP200 不代表成功，实际35对中4个 kind=error（self、ignored再次confirm、habit missing、habit B），其余31个success，不由 status 判绿。events 捕获 Runtime.exceptionThrown=0，不签未采 console 全零。

以下 **8个发生变化的动作组** 是 root 差分口径；round11 内含5条真实成功写命令，因此全部成功写 RPC 实数 **12**，不能把8组说成仅8次请求。

| 组 / 前后 | 明确提交与唯一写面 | 字段/保护结果 |
| --- | --- | --- |
| round04 before-save→saved | 真实表单 add 第二同项目 objective `okr-mvk2hl7d-refwvh` | 新 draft，primary=null、related=[]；未存其他对象 |
| round08 before-save→tree | 真实表单 add KR `okr-mvk2jwys-vxyg3c` | primary=`okr-mvi5z847-33y3xk`、related=[第二同项目目标]、status=draft |
| round10 cut→confirmed-tree | 真实表单 update 同 KR | 仅 relatedOkrIds→[]、status→confirmed、updatedAt；id/主父/创建时间等保留 |
| round10 tree→round11 fixture-after | 宿主 add B objective `okr-mvk2mw6p-xiusuv`、suggest A pending/B pending/B候选、ignore B候选 | 仅新 B objective 与新 `settings/pmOkrInbox.json`；三建议真实来源于命令，不手 seed |
| round13 repeat-error→after-clear | 宿主 `okr inbox p-0002 clear` | 只移除 B ignored `okrsug-mvk2mx22-ptmfq2`；A pending `okrsug-mvk2mwhs-spn7nq` 与 B pending `okrsug-mvk2mwrg-6j7pff` 每个字段保留 |
| round14 restore-before→tree | 表单恢复同 KR related 第二同项目目标 | 仅 relatedOkrIds、updatedAt，primaryA/status confirmed不变 |
| round16 habit-before-save→saved | 表单 update `habit-mvi5z84q-32ztau` | 仅 okrId 从原A目标切为第二同项目目标、updatedAt |
| round16 cross-error→after-command-reads | 宿主 update 第二同项目目标 cycleDue | 仅 cycleDue=`2026-10-23`、updatedAt；habit list/snapshot均只读 |

其余 **37段连续差分全部零变化**，包括错误保留、读取、重进、取消及 reload。最终差异严格为 **3个OKR + 1个habit + pmOkrInbox**，其余保存的业务/settings/files/backups不变；不豁免全部 settings，不签宿主session、exports、私有缓存、正式根或全盘零污染。连续快照不是原子全时监控，未逐命令快照的round11五写按真实RPC与组末状态绑定，不臆造中间逐写原件。

## 4. 实际目视与逐断言裁定

本角色实际打开 **23张原PNG + 19张原JPEG帧**；未生成/替换图片，未重执行浏览器。555帧均作文件/SHA/index回核，但**没有声称逐一目视555帧**。目视图名、帧序号与用途见 [人工裁决映射](p2-okr-habit-remaining-gui-review-20261023-r1-verdict.json)；raw/DOM只辅助定位，不替目视。

### 4.1 P2004 确证缺陷与成功边界

实际目视 `round04-objective-before-save/saved`：原表单目标O/草稿/保存与新增第二目标吻合。`round08-kr-before-save` 实际呈现合法 KR、主父F5目标和软关联第二目标ID；真实 add RPC `ee8507d5-21d5-456e-bd81-bc0d6777b9b3` 成功，raw record同。

`round08-kr-tree` 中 KR 仅挂 A 下，第二目标仍是独立根，**没有 KR 的关联行**。恢复软联的 RPC `11863d6d-b37f-4594-931b-877f7b2b0b2f` success/raw related恢复后，`round14-related-not-visible-tree` 仍不显示。`round17-okr-after-reload` 再次不显示。三阶段真实页面与 `relatedRows=[]` 辅助观察一致，排除未save、错误ID、草稿取消、陈旧表单状态等解释。

冻 [views/okrs.tsx](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/frozen-source/src/client/views/okrs.tsx) 的 child 分支 L105–124 渲染KR标题/主父/状态/编辑，**未消费 kr.related**；L129–139只消费 `root.related`。core/okr L234–252 明确将合法 relatedTargets独立列示、不进children/权重组。原合同及页面副题均承诺“软关联可见不计权重”。因此本缺陷为 **P2OKR-R1-01 / RA-P2004 / FAIL（展示遗漏）**，不是需求追加、不是产品数据层丢失。严重度只用于排序，不授豁免。

精确负例：

- `round10-missing-exact-error`：triple-click的 selectionStart=0/selectionEnd=len及完整input值实录；原missing ID留在输入，红字提示未在本项目目标列表找到、主归属不受影响。前端拒绝，**没有 missing RPC**，不能写成后端该例实测。
- `round10-self-exact-error`：related恰为自身ID，RPC `d18eea84-e5a9-4997-a407-a7528bb9c157` kind=error、正文“不能把自己列入软关联”；表单仍开、输入/主父/人选择的confirmed保留，root零写。
- `round14-cross-project-error-retained`：related恰为B项目目标ID，表单红字同项目白名单拒绝，原值留存；**没有 cross-OKR RPC**。此GUI只签前端拒绝，后台跨项目校验沿原AUTO。
- `round10-cut-related-confirmed/confirmed-tree`：实际清空软联后点击保存，成功RPC/raw把KR设confirmed，主A不变。round09仅在人控件中选confirmed未写，不能当成功提交。

### 4.2 P2003 项目隔离与 clear

真实host先准备B objective、A/B pending和B ignored。`round13-b-project-pending` 与 `round13-b-reentry` 真呈B项目目标和B pending，不露A目标/KR/建议；回A的 `round13-a-reentry-preserved` 仍呈A pending。帧round13-0记录项目选择，不能把该过渡帧当B终态。

对B ignored再次confirm的 RPC `e8620b2b-7e28-407f-8286-86e073cc7879` kind=error，`round13-repeat-error-visible` / 帧50实际可读“该建议已被忽略，如需采纳请重新建议或直接录入”，root零写。clear RPC `63abd967-5ec1-4473-b6c4-6d0ce297015c` 成功仅删1已处理，前后完整inbox与A/B命令复读一致。**此轮未再次做同项目confirm/ignore完整旅程，按原已签链复用；不另开动作。**

### 4.3 P3004 合法更换、非法命令与原未证边界

帧round16-1实际展开关联菜单：原目标、第二同项目目标、同项目KR，三项均在真实snapshot p-0001集合中；不含B/missing。“筛选”是菜单搜索，不是 raw-ID 写入口。`round16-habit-second-target-before-save/saved`、`round16-habit-reopen-fields`、`round17-habit-after-reload` 都实际可见第二目标关联，真实保存RPC `aae1a3dd-5bbd-4655-a7d7-ec389ba09fe0` 与 raw同。

初末 `id/projectId/title/status/createdAt/checkIns/streak` 完整相同，仅okrId/updatedAt改。**该habit原史就是checkIns=[]、streak三项0**；只能签其现有空史保全，不能冒F7多月非空史、原打卡重跑或habit final本轮通过。

missing命令RPC `8c2f4488-2d9d-4e91-a56c-6ab7009bfedc` error，页面/帧40完整可读“未找到关联目标：okr-not-found-20261023”；B命令RPC `6531f516-aaad-43b6-84b3-4568add11a47` error，页面/帧60可读“关联目标不属于指定项目”。两失败root均零写。之后重开显示合法原保存字段，但**发送命令前表单已关闭**，不能据此称“非法表单missingID保稿”。

snapshot真实读出口 `1b673ec1-cd93-47ba-9365-d9c91a35ea01` 的 `habits.filter(h => h.okrId === 第二目标ID)` 只匹配 `habit-mvi5z84q-32ztau` 1项，projectId=p-0001；命令list、习惯页关联行、raw同。不增聚合按钮，也不将filter重新包装成产品聚合UI。

**最小边界裁定**：合法菜单防止用户输入missing/B，与后端命令拒绝是两层成立的已有能力。原“失败表单保输入”精确断言仍未证，记BLOCKED，不变成新功能FAIL、不自动MANUAL_PENDING。不派raw-ID新控件/删除关联目标/改库坏种子/新错误按钮，也不重复已完成的missing/B命令。最小处置先交同候选已有、真实可达的关联失败且草稿仍开的原证；如无此原证，保留该界限交原合同范围裁定，不要求开发发明入口来凑证。此件不授权新增用例或以“合法重开”替换原失败保稿PASS。

### 4.4 P3005 占位而非调度

真实 `okr update 第二目标 {"cycleDue":"2026-10-23"}` RPC `ec4eb58f-edb4-4c50-8569-354b1dd4dddf` success；随后snapshot、raw读回同字段且只该目标写。页面/帧未呈伪“已提醒”。

冻cycle-hooks原调用点L28–38仅返回enabled:false；SHA与原独立合同相同，沿原 `cycle-hook-disabled-real-return-no-timer-registration` AUTO有限继承。**本轮没有调用cycleHookPoint，没有触发scheduler、后台回调或通知；设置cycleDue不注册调度。** 原合同提到habit占位，不据此给habit写其update schema禁止的系统字段，也不声称本轮读到habit.cycleDue。

## 5. 原失败、退出和证据校正保真

| 原执行 | 实录/独立解释 |
| --- | --- |
| round02 exit1 | script点击旧标签“愿景/OKR”，实际导航为“目标（OKR）”；未执行到okr页采集，不当产品FAIL |
| round06 exit1 | `round06-related-options=[]`，choose未找到选项；两帧呈原草稿和主父菜单，不是成功软关联菜单/保存。原错误不洗绿 |
| round07 exit1 | recovery前无菜单，Escape关闭未保存抽屉；帧2是回到树、KR未创建。不是“菜单ESC保稿”缺陷 |
| round09 terminal NOT_COLLECTED | executionId=`64411795dfe32201bdde3fcf3fb38919`；events闭合、0RPC、无save-response。帧10原ID/帧20拼接ID与PNG吻合；Meta/KeyA未选择成功，原missing/self命名均不是exact oracle |
| round10 exit0 | triple-click原3份selection范围覆盖全值，独立见精确missing/self/cut；只纠正对应观察，不覆盖round09原件或伪造round09退出 |
| round01 terminal NOT_COLLECTED | executionId=`4ba1bb9afae81d3a7caf938b96e868df`；已有snapshot请求/响应和completedArtifacts，不据文件存在推造exit0 |
| 首seal exit1 | 把命名带roots的UI origin对象误当root map；原错误保留。r2封件脚本仅核既有10份副本、跳UI对象再排时序，不覆盖部分源件或重GUI |
| r2封件 | 用户提供真实exit0，seal/index一致；[receipts](../../reports/all-pending-evidence-20261021/P2OkrRemainingR1/execution-receipts.json) 未记录r2终端码，封件也不含原tool stderr/metadata，故本角色只核其封装结果，不伪造独立终端回执 |

receipts其他实录：round03/04/05/08/10/11/12/13/14/15/16/17各exit0，round02/06/07各exit1、sealFirst1。这些是Main收据记录，不是本角色执行结果，也不声称每个0轮都产品PASS。

## 6. P2OKR-R1-01 最小红 / 修 / 复验合同

此合同只落实原RA-P2004“related可见不计权重”，不是下一功能。**Main继续执行；本角色无产品写锁。**

| 阶段 | 文件/对象 | 最小要求 |
| --- | --- | --- |
| RED先行 | 建议 `packages/dsh-pm-tool/src/client/views/okrs-related.test.tsx`，先读现有本地DOM测试模式 | 用原同项目A、第二目标、合法KR三记录挂实际OkrsView；断言KR自己声明的关联标题/标记可见且邻接KR、只呈一次，不把第二目标收进主children；旧114应在关联行断言实际红。保真实命令、exit、失败正文及candidate/test指纹 |
| 最小产品修复 | **仅 `src/client/views/okrs.tsx`**，必要测试同上 | 在KR呈现分支消费自身合法related数据，复用既有 `.pm-okr-related-row`/标记和“只展示，不参与权重”措辞；不改变primary/schema/存储/权重算法/确认动作。不是给父root拷一行假装KR关联 |
| 范围不足处理 | `okr-model.ts`仅在确证需要时另报 | 本封件未含client/okr-model源码副本，不能由metadata推定`kr.related`具体类型/供给已实现。Main先读其实际新候选；若仅views无法修，交原模型/source证据及最小追加范围给专家后再扩，不擅动index/panel/tasks |
| 修后AUTO | 同RED test + 原受影响OKR测试 | 同fixture绿；rerender清空related行消失、恢复再现、主父/主children不变、view零写。必要回归由Main唯一builder组织；旧114全回归不能覆盖新修后候选 |
| 修后真实GUI | 原KR已恢复related的合法fixture | Main认领新候选diff/新增test指纹、产物/实例/开关，按原第6组开树→相关KR和第二目标→真实可见关联标签且不改主父→重进/reload再见；保PNG/帧、RPC、连续root。优先复用合法现有数据，不重同项目suggest/习惯/三次非法负例 |
| 独立复验停止条件 | 不同审证专家 | RED确实红、修后AUTO绿且GUI可见、相关回归及字节界限充分才定向关P2OKR-R1-01。源/core关系守卫未改可有限继承；index/panel/tasks及Main在途锁不碰，本合同不ordinarycommit/发布 |

冻views orphan分支也未呈related，但本轮没有该GUI fixture，**不另开一个产品FAIL或新增完整D12矩阵**。若同一小呈现复用能覆盖原合法全集可由Main说明影响；否则如上先声明范围不足，不将本单扩成树模型重写。禁止新增聚合/调度/删除/确认按钮。

## 7. 原 exactRemaining 与释放

| 原 exactRemaining 原句 | 本件消解 / 保留 |
| --- | --- |
| P2003：“异项目动态隔离/clear反例及原错误正文可见缺证” | 指定切片有限关闭，**本项本轮remaining=[]**；不重旧同项目处理 |
| P2004：“同项目primaryA＋relatedB真实树/切关联/人确认，非法保输入” | 仅 **related真实树可见性FAIL** 留给Main最小红/修/复验；其余已证，不重复负例/确认 |
| P3004：“第二合法同项目目标/missing/失败表单保输入、按OKR只读聚合” | 第二目标、missing/B命令拒绝及只读集合已证；**失败表单保输入BLOCKED** 如§4.3最小裁定，不假PASS、不造新入口 |
| P3005：“原snapshot/cycleDue占位读出口尚缺” | 指定读出口有限关闭，**remaining=[]**；disabled只沿原AUTO，不要求触发后台 |

F7收起/刷新/非空历史保全、其他P0–P3/OP原余件、B8、父全部适用门及ordinarycommit不是本子单，继续归原合同/对应专家，不能被本表的两项remaining自动覆盖或判全部PASS。

实际审证环境macOS/bash、既有Node **v22.23.3**，pnpm **11.28.5**仅引用被测环境未调用。本角色执行命令（仓库根、独立运行）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2-okr-habit-remaining-gui-review-20261023-r1-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2-okr-habit-remaining-gui-review-20261023-r1-reader.mjs audit-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/p2-okr-habit-remaining-gui-review-20261023-r1-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p2-okr-habit-remaining-gui-review-20261023-r1-reader.mjs seal
```

首audit实际exit0，但自有reader把version2 envelope当record，字段保全比较实际比undefined；**首版habit字段断言无效、不用于签字**，原2372件/RPC/root字节核可核但此轮统一采用r2。只改自有reader解包record，追加r2实际exit0，checkIns/streak真实全等、changedKeys恰okrId/updatedAt；不覆盖首audit、不改产品/oracle/原证。语法与seal真实结果见 [seal](p2-okr-habit-remaining-gui-review-20261023-r1-seal.json)。

追加纯只读 `node -e` 结构断言实际exit0：source清单实数114、complete521、RPC错误4/成功写12、人工目视列表23PNG/19JPEG均属于已核输入，正文无尾随空白；语法检查实际exit0。均不执行产品。负责人最新接续“请完成保护/seal后回报精确结论和原KR软关联最小修合同/允许files，Main随后派开发；不必扩新矩阵。暂不重build，保2372原件”按本§6/§7执行，不扩矩阵、不重build。

`rg`不可用exit127、指定memory两入口缺失exit1是探索设施事实，不当产品FAIL。没有执行产品build/install/verify/vitest、Main采证脚本、任何旧reader/GUI/服务/Git；privatefreeze/runtime/凭据/原testing/封件/livingdocs/plans写入0。保护仅本reader明确2383个输入，seal复读不变，不声称全盘冻结。

**本角色审结，resources released / STOP。** 不持源码、builder、GUI、端口、profile或业务根锁；不停止Main/PID10975或父持续任务。无普通提交、push/tag/release/正式切换。Main只接§6确证缺陷与§7原精确未证边界，按父授权继续当前闭环；本件不代签父全门。
