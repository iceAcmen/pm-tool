# 反馈剩余 GUI 原合同澄清与先行审证

> 2026-10-22，平台 trae，独立测试专家，非开发、非 GUI 执行端。给 Main 执行原余项、交独立审证；本文只裁方法与现有证据边界，不签全部 commit。先行计划见[本次计划](feedback-remaining-gui-20261022-r1-plan.md)。

## 1. 当前裁决

**Main 的精确请求阶段明确错误注入有条件符合 TF-X08/A18 错误 context 合同；仅延迟/拒绝 clipboard Promise 的 adapter 有条件符合原 copy 竞争合同。方法可接受不等用例 PASS。**

截至本轮审证，标记 catch、同值代际/迟到 copy/timer、原保稿关闭分支、O3/O5 完整同页 GUI 仍缺足够原证，保持 **GUI BLOCKED**。原 A18 已签的正常特殊标题、普通传输错误保输入、明确 discard→关闭卡→新编辑成功只按原有限范围保留；不重复采相同切片，不扩大为本次新实例全部通过。

本次不能签全部既有未验功能、全部代码普通 commit、整页矩阵、BF-G02..04、工具毕业、push/release/正式切换。Main 已有验完后普通 commit 的持续授权，不需本角色重新索要，但须由总范围专家关闭父出口。

## 2. 候选与可继承接缝

派单指定：HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 加 dirty 候选，Main 唯一 builder/GUI，EGO `space13/p1`，3257，冻结树 `/private/tmp/pmtool-u4-closure-20261022-r2`。本角色没有运行 Git 或探活；HEAD/上下文来自派单及现有 manifest，不伪称现场查询。

只读核对时间 **2026-10-22 18:12:52 +0800**：

| 核对对象 | 实读结果 |
| --- | --- |
| A20V3 `source-files.sha256` 95项 + U4 `increment-files.sha256` 10项覆盖去重 | 102项；主树逐项相等，missing=0、mismatch=0 |
| 冻结归属 | 87项插件在 U4r2；15项 Launcher 在 A20V3 父树 `/private/tmp/pmtool-a20v3-closure-20261022-r1`，全部相等 |
| U4 candidate-evidence-manifest SHA256 | `26f093c3f8fbc243a28cb736f452b6fc8aa1ed90ec7403bc14a94fac4948fba9` |
| U4 `lib/client.js` SHA256 | `51234141fa6b34182492dbd294b60cb62320aa68aa8004111d6e5b12a6eee055` |
| panel / ResultCard / classifier | 主树、U4、旧 A18 三方字节相同，见下表 |
| form-dirty / confirm-dialog | 主树、U4、旧 A18 三方相同 |
| client/index.tsx / 全局 panel.css | 当前/U4 相同，但相对旧 A18 均已变；真实接线/视觉须新实例证据，不能只借旧 GUI |

| 反馈文件 | 当前/U4 SHA256 |
| --- | --- |
| `src/client/panel.tsx` | `fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947` |
| `src/client/result-card.tsx` | `3bf14c4de117ce5e9577f7db0ed8e4bf81196492fd794be95f6df40310dca352` |
| `src/core/ui-feedback.ts` | `94bab4055958c6abb22caf6343173b8e643c58c9da85a28e421b5ef7f86d35d7` |
| `src/client/index.tsx` | `61f927ed6773b22c2894368a7865ef8ecc719a8e684d3b9c1599517f392d339a` |
| `src/client/panel.css` | `3cc0b0ed08ea34462ded8154b05f394a46f02c6577dea5da12c495aafa0f700b` |
| `src/client/shared/form-dirty.ts` | `98ded61689c7d3b43b7f2d6609c6e0184990f18f930d998c0893b25d2a7ad5e3` |
| `src/client/confirm-dialog.tsx` | `20ac37fb455e783f44bd539349bb4f8dd65c7b3e8334d5960f68380bde51fdcd` |

旧 A18 index 的 SHA 为 `e5702c69f788e4513a78f2e2861ef87d08f1bfa7ea2dce3807ed600505340f89`，panel.css 为 `87ca4fc9f0899d87b3103fcc279a791839a23e921de6511a81086d85d9e54246`。同源码的 SOURCE/AUTO 与旧功能子断言可依原专家限定继承；源码相同不补未采 GUI，样式/入口改变也不自动证明旧断言失败。

## 3. 先查已有原证

| 原件/原结论 | 已能证明 | 不能补的余项 |
| --- | --- | --- |
| [A18 context 独立报告](a18-feedback-context-independent-retest-20261022.md)及[原16反例](a18-feedback-context-independent-retest-20261022-cases.test.tsx) | 真实生产组件的有限 SOURCE/AUTO，原20为19绿1红保留，自有 context adapter20与16反例通过 | 不是浏览器 GUI；不拿复制/timer AUTO 外推实测 |
| [A18 反馈控制 GUI](a18-feedback-controls-gui-review-20261022.md)，原证[feedback-controls](../../reports/all-pending-evidence-20261021/A18/feedback-controls/) | 正常失败词标题成功；预host普通传输错误保输入/零写；明确 discard 后关闭卡，再新编辑成功 | 原因只有 Failed to fetch，无 summary/detail/action 原因；不同正文，无迟到 copy/timer；丢弃后重输不是原草稿穿越关闭 |
| 原 `error-close-1792630785648/execution.json` | exit1，等待卡 hidden 30000ms 超时，原失败真实保存 | 无 closed/success/after-roots；不能用后轮成功补造原关闭成功 |
| 原 `error-close-continued-1792630886239` | 明确“放弃修改”，closed 无输入/alert；前根=closed根；后续一次真实 update+snapshot | 原未提交草稿已丢弃；不签保稿，不把 BODY 焦点推成 O4 opener 焦点通过 |
| [A0 copy-A-B-steps](../../reports/all-pending-evidence-20261021/A0/gui/copy-A-B-steps.json)及[boundary](../../reports/all-pending-evidence-20261021/A0/gui/copy-A-B-boundary.json) | A即时系统复制75byte→不同B清已复制→B即时复制43byte→当前拒绝；业务根相同 | A已完成才换B；不同字符串，没有悬挂旧 Promise、同值代际或 timer，不补 X03..07 |
| [O3/O4/O5 原18 AUTO](oil-o3-o4-o5-patch-qa-20261020.md)、[工具盘点](../../reports/ego-oil-pilot-status-20261021.md) | O4仅TaskForm；历史标题dirty取消/留稿/放弃的有限主端描述 | 18是静态/AUTO；O3/O5当时明确 NOT_RUN。描述不是本次独立原证 |
| 本机历史 `新版实施-20261020/最终验收报告-20261020.md` | 记有标题dirty确认取消/放弃/重启原值描述；仍明确 O3/O5 NOT_RUN | 未找到对应完整步骤/绑定日志；`after-40-cancel-closed.png`、`after-41-cancel-count.png` 仅定位，未本轮目视，不签非控说明/多选/全部关闭路径 |

本轮独立回读 A18 `index.json` 声明 **162件** bytes/SHA，全部相等；其 index SHA `82eec647fb29e976d0ced8a66295e096d525d5b25846b853277ea1c3134d3019`。A0 steps SHA `b6006a367fd3d0304cd58d2f97dae889458c9d424fab9bd2073c0cb52dd908ff`；原失败 execution SHA `93aaf6da9a421a346b04c671bdfb3e52acdfa7586f15361d46d754389bbd7ad4`。

“未找到”限于指定报告、上述原索引、父执行记录与历史候选/视觉目录的定向检索，不声称全盘不存在。若 Main 已有其他原件，先交路径与原 ID、候选/时间段，无需重采。

## 4. 原反馈用例的最小准确步骤

下表将原 [TF-X08](a17-transport-feedback-independent-retest-20261022-cases.test.tsx)与 [A18-X01..10](a18-feedback-context-independent-retest-20261022-cases.test.tsx)按原顺序展开，不另编 ID 或改变 oracle。新实例固定同 page/route/合法隔离实体，记录真实提交点；所用控件必须实际走相应 `run`，尤其 quiet 不能只改 adapter 标签。

| 原 ID | 最小步骤 | 必须保留的原预期 |
| --- | --- | --- |
| TF-X08 / X01（普通、quiet） | 合法 pending 请求→明确 reject 原正文→观察解锁→复制全文→20秒后观察 | catch false，不重复 execute/不自动 refresh；卡 error/alert/assertive/警告、无Check/成功toast；全文逐字及单次前缀，持久、无动作 |
| X02（普通、quiet） | 同原标记原因加原 action 行及尾部空白→reject→复制→60秒后观察 | 只关闭/复制，不把原因解析为详情/执行按钮；原文字节不删不裁，20/60秒沿原AUTO时长，不另设耐久要求 |
| X03（resolve、reject） | error M→旧copy pending→**同一完整字符串M真实普通success**→展开详情→quiet error M→释放旧copy→当前copy | 正常消息清context；新error恢复error、清详情；旧copy不能留下成功/失败反馈，当前复制能独立成功 |
| X04（resolve、reject） | error M→旧copy pending→同值quiet error M（新通知）→释放旧copy→当前copy | 相同正文的新代际仍隔离旧copy，当前保持完整error；不以不同正文A→B替代 |
| X05（resolve、reject） | error M→copy pending→实际可达关闭卡→同值真实success→释放旧copy→同值error | close清旧context/卡；旧copy不污染新卡；保留close与后续新消息的真实身份链 |
| X06 | **同值完整成功信封**第一次显示→真实到期消失→第二次真实出现→第二轮到期前/后观察 | 第二通知重新完整3秒，不以摘要相同代替整个message相同；记录实际时间与采样延迟，不机械要求GUI正好2999ms截图 |
| X07 | 保留第一success已排队timer→error→旧timer晚到→close→旧timer晚到→同值新success→多次旧timer晚到→当前timer到期→再同值success/前timer晚到 | 旧timer不隐藏新toast、不改变error；只自然等3秒不能证明已排队旧callback实际晚到 |
| X08 | error后真实quiet成功并refresh | 沿原策略不发新全局消息、不主动清旧error/context；不另加“quiet成功必须清错” |
| X09 | 当前复制拒绝→保持error及全文→明确重试复制 | 只更新复制失败/成功状态，不重发写命令；当前拒绝不当旧竞争 |
| X10（resolve、reject） | error→copy pending→真实面板卸载→重挂同error→释放旧copy | 旧Promise不污染重挂卡；reload若销毁旧执行世界不能冒称同一个旧Promise已晚到 |

原 TF-X08 `raw` 精确正文如下，原 X01 与它同值：

```text
Response parsing failed; received text follows:
[pm:summary]任务｜t-0001｜Failed delivery
[pm:detail]
{"id":"t-0001","title":"Error register"}
```

原 X02 在上述正文后原样追加：

```text
[pm:action]Never execute reason：task remove t-0001 confirm
\n \t尾部  \n\n
```

第二行是追加后缀的转义展示记法，不是字面第二行正文：action行后恰有一个LF、一个空格、实际TAB、`尾部`、两个空格及两个末尾LF。实证须绑定原测试字符串实际字节，不能复制本展示中的反斜杠。正文可逐字从原测试读取，不调用产品builder生成。未知长原因若另追加，应单列为扩展控制，不能替代原精确正文；不规定新的长度/视口矩阵。

**可执行边界**：X03/X05 所需“同值真实success”和 X06 的同值整信封须有合法生产返回链；没有时保缺证，不能用 `ok:true/kind:success` 假响应、手改message/context/generation 或同标题代替。同值字段若只有只读 React 观测可作辅助，不能改变其值。X07 的人为旧timer回调控制不在本次 clipboard-only adapter 许可内；本报告不自动批准全局 fake timers、替换 clearTimeout 或手动运行产品callback。先交已有原证/最小方法说明，不能用 X06 自然到期覆盖 X07。X10 同理须真实卸载/同世界晚到链，不能另造卸载按钮。

## 5. O3/O4/O5 与原关闭保稿

以[原同页断言](main-o3-o5-samepage-assertions-20261020.md)为准，不扩至全部抽屉或所有删除 undo。

| 原切片 | 最小准确动作 | 预期/证据边界 |
| --- | --- | --- |
| O3-1→O3-2 | 同TaskForm合法草稿提交→真实业务拒绝→同草稿修正必要字段/明确retry→真实合法成功 | 拒后抽屉仍开、原输入保留、错误可见/解锁；retry才真实写，成功关闭/3秒提示。原业务拒绝和传输注入分别记录 |
| O3接受控制 | 沿原结构化成功/无信封成功/只读预览实际适用入口 | 不误当失败；只读不是写成功证据，不要求假造接口返回完成全组 |
| O4-1 | 干净新TaskForm分别 ESC/scrim/X | 直接关闭、无确认；每条实际入口/focus/零写，footer cancel既有切片可映射但不能代三入口 |
| O4-2/3/4 | 原标题dirty、description-only、predecessor内容增减，按原cancel/ESC/scrim；X沿总对账所列相同guard边界记录 | 同“放弃未保存修改？”；确认里的取消/ESC仅关确认、原抽屉和输入保留；确认放弃/Enter才关闭，零写 |
| O4-5 | 弹确认→观察焦点→ESC取消确认/Enter确认放弃→观察实际归还 | 初始在“放弃修改”；取消回关闭触发控件，最终关抽屉回opener/合法fallback。不同层归还分别记录，不拿DOM属性或BODY代可见焦点 |
| O4-6/7/8 | dirty成功save；description-only；同一predecessor集合只换勾选顺序、再实际增减 | save不再弹放弃确认；非控说明算dirty；集合相同顺序抖动不dirty、内容变化才dirty；合法同项目非自引用fixture |
| O5-1/2 | 先真实snapshot S0→精确旧snapshot读取失败→打开同task，观察stale只读→真实retry取合法更新S1 | 陈旧标注出现，值来自S0且不进入提交；retry后标注消失、值更新。必须有权威S0/S1变化/实际读取，不能回伪snapshot或仅证明“重复原值” |

**“原关闭保稿”必须分三件**：拒后同草稿留存并重试（O3）、dirty关闭请求后取消确认留稿（O4）、在模态抽屉仍开时关闭背后ResultCard。前两件可按原合法控件补采；第三件原已超时 BLOCKED，普通模态 scrim/focus 边界下后台卡不可达。不能删除scrim、改pointer-events/z-index、直接调后台onClose来伪装物理关闭，也不能把discard→close→重输同值签成保稿穿越关闭。

本角色不新增“后台卡必须可穿透点击”需求、不从旧超时判新handler坏。若原owner需要调整该不可达步骤，应独立另存最小澄清及取代范围；未澄清前保留原缺证，不由Main静默换用例。

## 6. Main 拟用控制的准确边界

### 6.1 精确 CDP Fetch 错误注入

**可接受的是受控依赖故障后真实产品 GUI，不是自然网络/真实宿主业务事务失败。** 必须限制 3257 当前 page 的 POST `/api/commands/execute`、`requestStage=Request`，并核 body 的 `type=client-request`、`method=commands/execute`、`payload.args.line` 与指定实体/提交命令逐字相等；匹配 sessionId/本轮rpcId、次数。其余请求原样continue，尤其snapshot不能误拦。

只读核真实宿主 `packages/client/connection/src/client/rpc.ts` 与 `rpc-schema.ts`、Gateway client invoke、插件 `client/index.tsx`：浏览器期望外层 `server-response`，相关rpcId必须一致；Remote error应有code/message/details。仅回裸 `{ok:false,error:...}` 会被Connection拒为信封错误，不能证明标记正文进catch。

符合接口的返回形状：

```json
{
  "type": "server-response",
  "rpcId": "<原请求rpcId>",
  "result": {
    "ok": false,
    "error": {
      "code": "gateway/internal",
      "message": "<原TF-X08或X02逐字原因>",
      "details": {}
    }
  }
}
```

HTTP 200 + `Content-Type: application/json`在此只是RPC失败载体，**不是伪造业务成功**；result必须ok=false、不得夹带value/result.kind=success。用真实JSON序列化/base64保持LF/TAB/空格，不用字符串拼JSON。`error.message`直接由生产executeRaw变为Error.message，再由run catch加单次“执行失败”；真实DOM/复制应与这条完整文本一致。

`Fetch.failRequest(ConnectionFailed)`同样只准精确请求，但只能获得普通传输原因，不能注入TF-X08标记正文。HTTP500/错误rpcId/坏JSON会引出HTTP/协议错误，不算原标记原因控制。

Request阶段截断证明请求未到host；预host零写须实际前后根互证，不可推成“host收件后回滚”。不得把命令日志无记录单独当零写。Main须在finally恢复自己的Fetch规则/释放暂停请求，记录恢复；**不停止3257或其他服务**。

O3另须真实业务拒绝证据：本方法的Remote明确error可覆盖受控catch保稿，但不等宿主实际业务验证拒绝，也不覆盖原未throw文本判定分支。合法真实业务拒绝由宿主kind=error进入executeRaw catch并不矛盾，须保真实command/done/原因与零写；不为凑分支回假success。O5只准精确 `web snapshot` 原读取故障，不扩修refresh。

### 6.2 Clipboard 延迟 adapter

原X03/04/05/10已用宿主clipboard deferred依赖。可有条件对**当前页真实“复制原文”触发的writeText**做一次Promise延迟/拒绝，记录精确value及调用号；仍由生产ResultCard/copyResultText等待，按原顺序通知新消息，再resolve/reject旧Promise，最后真实当前复制。安装/恢复原描述符与finally须记录，不写全局系统权限。

不得直接改copyState、ResultCard props、context/generation、DOM；不得把尚未调用的writeText造为pending。resolve adapter只能称“受控复制完成”，不称系统剪贴板已真实写；要称系统复制成功须实际native writer成功且合法回读逐字相等。reject旧copy与当前reject分开，不能只跑一个。

ResultCard在modal背后复制同样受可达性限制，不能用后台handler调用假装原生点击。U4专家对checkbox/save的有限React回调接受不自动授予反馈控件相同绕行许可。

## 7. 每条证据必须绑定

以下字段来自ADL-057与原记录要求，不要求新模板或重复全回归：

| 层 | 必需绑定 |
| --- | --- |
| 原合同 | 原ID/原断言/普通或quiet/resolve或reject/步骤起止；不可执行或adapter原因 |
| 候选 | baseline、dirty patch/新增清单/102声明及当轮SHA；冻结root、package/lock、宿主提交/批准补丁归属 |
| 运行 | profile解析目标、service PID/3257及runtime根；EGO space13/p1、真实target、origin/path/hash、timeOrigin/挂载段；禁入库token |
| 装载 | 实际完整loaded响应及SHA、冻结client及唯一完整执行段；sourceURL normalization，不以短哨兵/200代替 |
| fixture | project/task稳定ID、合法初态、S0/S1及相关集合；实际填写值/显式提交点/草稿实例是否持续 |
| 请求故障 | 精确URL/method/RequestStage/body.args/rpcId/session映射、requestId、次数、pause/fulfill/continue时间，error原文字节/SHA；无认证headers/cookie |
| copy/代际/timer | 当前真实点击、复制value/byte/SHA、调用号、pending→新消息→晚到顺序与时间；可只读观测真实generation；timer旧/当前真实callback归属，不自建计数冒充产品 |
| GUI | 连续关键状态PNG/录屏、真实text/role/live/class/图标/详情/动作/控件解锁、viewport/theme/缩放；hit/focus/抽屉与确认层状态；DOM仅辅助，独立目视实存原图 |
| 存储/恢复 | 原tasks/reports及data/files/backups等实际写根前后SHA/新增删除；host session单列；真实retry run/done/snapshot/raw，零写/合法写/未覆盖根分开 |
| 执行/审签 | 原脚本/argv/exit/stderr/console、失败原件不覆盖、adapter恢复/最终产品字节；Main仅事实，独立专家给有限结论及继承/缺证 |

## 8. 新原件接收截点

Main 在本角色只读核查期间新增[FeedbackRemainingR1](../../reports/all-pending-evidence-20261021/FeedbackRemainingR1/)；这是Main在途原证，不由本角色写/封存/当污染。

已读完整 `loaded-complete.js` **2597521byte**，SHA `7d4312dae04a9e979246a6cd241fc51e2312c4b15b8ed3361ff2212e67d8b0e1`。仅去末尾sourceURL/sourceMappingURL并补宿主换行分号的U4完整执行段 **1718689byte**，SHA `a0e29f76337ed9c509134e520e436bd866848f320ccc5cedd0fe6a4ec84d62c7`，offset875361、second=-1，唯一匹配；不是短标记。

`00-before.json`记录时间10:12:42.050Z、origin3257、timeOrigin1792663660887.6、inner1470×746/outer1470×857/DPR2，SHA `5f16720050f7c4bb9c795ce7887a30247eb7c6aa532a82c88b977bd7f38e34ef`。DPR2不当200%文本缩放；当前初态未填独立page/route/target绑定。目录还见 `00-before.png`、`01-before-roots.json`；未本轮目视/解读根内容，不签它们的视觉或零写结论。

**本截点没有该包完整执行索引、标记错误/复制竞争/O3/O4/O5的结果链，尚不审签GUI。** 后续原件可在本前缀补审，不覆盖本截点、旧失败或Main原证。

报告落盘后的定向目录回读又见 `02-filled-before-submit.json/png`、`02-pre-events-events.json`、`03-paused-events.json` 与三张 paused JPG；本轮未解读/目视这些在途状态，不把“请求暂停”签成错误已呈现、复制完成或执行结束。

## 9. 实际核验与交回

本轮运行环境macOS/bash、Node `v22.23.3`，pnpm11.28.5仅引用被测环境、未调用。本角色产品测试/GUI **NOT_RUN（派单禁止）**。

实际命令为 `cat/sed/grep/find/ls/date` 只读定位，以及以下Node内置文件审计，不导入产品、不执行原run/check/audit或测试器：

1. 102声明按主树及U4树初核：exit1。主树102全部相等；U4树缺15个Launcher路径、drift=[]。这是自有归属假设过宽，不是产品候选缺失；未创建/补复制任何文件。
2. 回读A20V3 candidate.tree，按U4插件87 + A20V3父树Launcher15重核：exit0，两方mismatch=[]；102声明完整成立。
3. 七反馈/dirty/confirm接缝三方SHA、U4manifest/client、A0/A18原件SHA：文件回读成功，具体值见§2/§3。
4. A18 index162件完整bytes/SHA及新loaded完整执行段唯一匹配：exit0、mismatch=[]、second=-1。
5. 新00-before metadata只读JSON解析：exit0；只证明已存初态元数据，不签GUI。

18:15:42 +0800，Node内置fs/path/crypto终核exit0：新增两文档相对链接missing=[]、尾随空白=[]；主树102项productDrift=[]，旧A18 index SHA仍相同。首次文档自检发现原文展示行尾两个空格，仅改本前缀报告为明确转义展示后消除，未动原测试字符串或证据。终核未导入产品，不是产品测试或GUI。

探索失败如实保留：rg不可用exit127，改find/grep；memory指定本地文件不存在，未创建或访问其他项目记忆；宽目录搜索输出过大、后限深度/扩展名；组合读取不存在U4 `instance.json`及A18 import-fault根目录mjs各exit1/2，后按实际manifest/执行子目录定位。没有重复跑产品、修改原件或把探索错误说成产品FAIL。

仅新增本前缀计划与本文；不写其他testing/产品/livingdocs/原证，不Git写、不build/test/GUI/服务/凭据。3248/3249/3255及3256/3257均不操作/不停止，未占builder或浏览器连接。真实证据、有限继承和未采缺口已分开；本角色可继续接收新原证路径审签，但不自行补采。

交回 Main：先按§4/§5原步骤采可执行余段，按§6精确控制并保存§7字段；同值success、排队旧timer及后台关闭不可达的缺口先交合法原链/方法澄清。局部报告不能被用作全部代码commit准入；总出口仍由最终范围专家裁决。
