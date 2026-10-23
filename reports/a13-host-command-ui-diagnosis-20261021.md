# A13：3241 宿主新会话命令提交与结果显示的只读诊断

日期：2026-10-22；按派单保留文件名 20261021。平台：trae。范围：只读源码，只新增本报告；不操作 GUI、server、build、产品、credentials、commit/push，不影响 Main 其他 GUI 采证。

观察输入来自 Main：3241 新会话显示 composer；`[data-phase=plain]` 输入 `/` 后出现真实 pm option，点击变 claimed；再键入 ping/Enter，composer 清空，主区仍“探索未至”，无 pong/普通会话条目，发送按钮禁用；此前直接键入 `/pm ping` 在 plain 状态提交也清空。以上是转述，非本轮采集的 GUI/网络原证。

只读基线：pm-tool HEAD=`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，工作树有并发 dirty 候选；上游 HEAD=`1142fb74f2bbcc54dc9499054c0448c9b876cbf2`。本报告涉及的上游 commands/session/conversation/chat/workspace 源码目录 `git status --short` 无输出。**这不证明 3241 下发的实际 bundle 与源码一致。**

## 1. 结论

**“清空 + 无 pong + 欢迎页 + 无普通会话条目”完全可能是命令已执行、结果被空白会话显示策略隐藏，而非提交被模型门挡住。** 核心证据是：

```ts
// ui-chat: chat-snapshot-builder.ts L1232
isActive: snapshot =>
  snapshot.order.some(key => snapshot.nodes.get(key)?.kind !== 'command')
```

纯 command 节点不让 chat 目标成为活动目标；`command/run`、`command/done` 不生成 `turn/start`；会话 metadata 的 blank 也仅在 `turn/start` 变 false。`DefaultConversationViews` 在 blank + blank phase 时直接 `return null`，所以 command 节点虽然可已投影，实际 ChatView/命令卡仍不挂载。上游 GUI 用例明确写着“command-only session keeps the hero view”，另一个用例先完成普通轮次再验命令卡。[S5][S6][S8]

**执行 `/pm ping` 不要求选择模型，也不要求自然语言请求模型。** 新建普通 session 要有 workspace/目录身份；当前菜单真实 pm 行及 claimed 已表明不是纯“无 session、无输入管线”的状态。`claim.submit` 直接调用 `remote.commands.execute`，宿主 executor 直接调用 pm handler。**选择模型本身也不能让纯命令会话显示 pong**，它不是完成普通轮次，不会自动改变上述显示合同。[S1][S3][S4][S9]

**最短“正确执行并目视显示”路径：打开本实例已有、已非空白的普通主会话，再用同一个 composer 领取 pm、追加 ping、提交。** 不开自然语言 askmodel，不选凭据。如果本实例只有新空白会话，没有已经活动的会话，当前宿主默认主区没有“仅靠 `/pm ping` 就显示结果”的保证；先采 command 执行证据，命令 GUI 可见结果这一段交接为不可达接缝，不能编造已显示。[S5][S6][S8]

## 2. 最短调用链

| 环节 | 实际行为与证据 |
| --- | --- |
| Main 面板 | `AppFrame.MainPanel` 按 activePanelId 渲染 main，null 对应 conversation。新会话导航选择 session，再 `layout.selectPanel(null)`；不是提交后另建一个后台 session。[S9] |
| NewSession | `startSession()` 找明确 workspace、当前 workspace 或最近 workspace；无目标则 `clearMain()`。通常无 draft options 的新建走 `openWorkspaceSession(..., false)` → `sessions.create({workspaceId})` → `retain(...,{source:'mainView'})` → selection。不是等第一次消息才建立 session。[S9] |
| `/` 候选 | `ui-commands` 目录对普通 retained session 等初始 history open，再 `remote.commands.list(sessionId)`；subagent 返回空列表。真实 pm 行来自 host descriptor，不是子命令或 PM 副驾。[S1] |
| 点 pm | `desc.input !== undefined` → `leadingClaim`；claim token 是 `/pm `，提交 canonical 前缀也是 `/pm `。菜单关闭，editor 领取参数；**此刻没有 execute**。[S1][S2] |
| claimed + Enter | keymap 先做菜单仲裁，再 `canSubmit`；通过后 machine 进入 submitting，`argsAfter` 提取 ping，`claim.submit` → `remote.commands.execute(sessionId,'/pm ping',[])`。[S2][S3] |
| plain + 完整 `/pm ping` | 菜单未截获时，machine 进入 adjudicating；`matchEnter` 强等目录，解析 input 命令，返回 claim，machine 在**同一次 Enter**直接 begin-submit。无需先看到 claimed，也无需固定按两次 Enter。[S1][S3] |
| Host Remote | wire 参数的 `agentId` 实际传 sessionId；lookup 解析/恢复该 session 对应的 Agent。execute 解析 pm，写 run，调 handler，再写 done；不是 `session/prompt`、agent followup 或模型请求。[S4][S10] |
| 成功回浏览器 | 无附件时即使 handler 返回 `kind:error`，UI admission 仍可能 `{kind:'success'}`，machine 清空草稿；业务输出不在 composer 回显，依赖持久 command 节点。因此清空不证明 pong 成功。[S1][S3] |
| 事件/投影 | Host `session.append` 发布 `session/event`；history follower 按 sessionId 转发。client eventSource → Conversation assembly → commandDefinition 按 commandId 配 run/done → chat 节点 → CommandNodeView/GenericCommandCard。[S4][S6][S7] |
| 新会话主区 | command-only 不算 chat 活动，blank 保留，views 不挂载，hero 留存。不是“还没等到 NewSession mount”；这是明确条件下的显示选择。[S5][S6][S8] |

这里的“main flow”分为 main slot → ConversationContent → conversation.view/chat → ChatFlow；源码没有另一个必需的名为 MainFlow 的提交入口。不能把 PM 面板里的 execute bridge 或副驾问答框当成宿主 composer。

## 3. Enter、Model Guard 与 Deferred 的具体判别

### 3.1 模型与按钮

`InputBar.tsx` L140 的 disabled 原因：removed、inert、无 live faces、owner `blocked`、continuable 子会话 parent offline。L325 的 primaryDisabled 再加 empty、machineBusy、uploadsPending。`view-binding.ts` L118 的 Enter `canSubmit` 检查同一 locked/machineBusy，**没有直接检查 model.current/provider/credentials**。[S2]

ConversationContent 接受外部 composerBlock；若实例真的 raised block，输入和 Enter 都锁住，模型 seat 保持可用。但本轮当前 `ui-model-selection/src/client/index.ts` 只注册 `/model` popup 与模型 seat，未见向 composer blocks 写入；不能把旧注释“ui-model-selection 会阻止发送”当成本实例已存在的门。实际 bundle/外部插件仍需 Main 原证确认，报告不宣称任何组合永远没有 block。

| Main 可观测状态 | 正确解释 |
| --- | --- |
| `/pm ping` **仍非空**，contenteditable=true，phase=claimed，按钮 enabled | 可提交命令，不要求选 model。 |
| 成功清空后 phase=plain，按钮 disabled | `empty` 足够解释禁用；不能据此诊断“没模型”。 |
| 非空但 contenteditable=false / aria-disabled=true | 检查 inert/workspace/live/block/removed，停止提交；不 force click 或移除 disabled。 |
| phase=submitting 或 adjudicating | 暂时只读/按钮禁用；等 settlement，不重复发。 |
| 无模型时 plain 文本 `ping` 清空 | 可能误走 ordinary default-sink，清空发生在 admission 完成之前；不是 pm command 已运行。[S3] |

### 3.2 claimed 必须保留 token

**在“键入 ping”之后、Enter 之前再确认一次文本和 phase。** `SubmitMachine.onDraftChanged` L92-L96 在草稿不再以 claim token 开头时释放 claim。`fill('ping')`、全选后输入 ping、手动替换 contenteditable 的全文，都会丢 `/pm `，可能转 plain → 普通消息提交。正确是保留 token 并追加 ping，最后完整文本 `/pm ping`，phase 仍 claimed。[S3]

若使用完整 `fill('/pm ping')`，保持 plain 不是错误；目录 adjudication 支持完整参数行。若菜单还有高亮，Enter 先选行，可能只是领取；这时核文本再发下一次 Enter，而不是盲目双发。可先 Escape 关菜单再提交完整行，避免仲裁歧义。[S1][S2][S3]

### 3.3 actionmenu deferred

菜单高亮对应 group 仍 pending 时，`controller.arbitrate('enter')` L287-L295 返回 consumed，既不选 stale 行也不 submit。**这种 deferred/no-op 本身不会成功提交后清空 `/pm ping`。** 所以它不是对“claimed + 完整命令 + 清空”现象的充分解释。[S2]

pm 有 input，菜单 pick 不走 action、popupSelect 或 bare-host 的 runDetached 分支；不能把 bare action 消费 token 的行为套到 pm。点击选项靠 `onMouseDown`，不是 DOM 合成 `.click()` 事件；实际鼠标点击/Playwright locator.click 会发 mousedown，`element.click()` 未必触发领取。[S1][S2]

## 4. 给 Main 的 Selector 与 Action

以下仅为 Main 已授权 GUI 采证的操作建议，本轮不执行；不增加专家验收用例，不自判 PASS。`SID` 必须从本轮 DOM/已认领 session 原证取得，不手造。

| 对象 | 实际 selector/action |
| --- | --- |
| 当前会话身份 | `[data-conversation-content][data-conversation-session]` 的 `data-conversation-session`；先限定到当前 main 中可见的一处，记 SID。 |
| 输入 | 当前 content 内 `[data-composer-input][role="textbox"]`，优先限定 `[contenteditable="true"]`；phase 属性在 **editor div** 上。别用全页 `[data-phase=plain]` 代替定位。 |
| `/` 菜单 | 当前 composer 内 `[data-trigger-menu] [role="listbox"]`。pm 行：`button[role="option"][id^="dsh-slash-option-command-"]` 按显示 name `pm` 精确筛选。序号动态，不写死。 |
| 菜单领取 | 真实 click pm option，等待 editor phase=claimed；核其文本 `/pm `。 |
| 参数 | 在已有 token 后追加 `ping`，不要 `fill('ping')`；核最终 text `/pm ping`、phase=claimed、焦点在同一 editor。 |
| Enter | 对该 editor 按普通 Enter；IME 组合结束的 Enter、Shift+Enter 不是提交。等 phase 回 plain/草稿空，并采本次 execute 原证。 |
| 发送备选 | 当前 `[data-composer-card] button[aria-label="发送"]`，英文 `Send`；**只能在 enabled 且全文仍 `/pm ping` 时点**。与 Enter 进入同一 submit，不是模型绕过按钮。 |
| 主区 phase | 当前 `[data-conversation-content]` 的 `data-content-phase`；hero 不是 command 执行失败标志。 |
| 已有会话 | `[data-row-key="session:SID"][role="treeitem"]` 真实 click，选本实例已非空白、普通且非 archived 的记录；等待 content 的 session 属性与 SID 一致。 |
| 命令结果节点 | 非空白 chat 中 `[data-chat-flow-kind="command"]`，核 pm 标题及 pong 全文；其内部通用卡 `[data-variant="others"][data-state="ok"]`/`error`/`running`。不要只看 body 包含 pong，避免撞旧结果。[S7] |

可复用动作形状（Playwright，**不在本轮执行**；`editor` 已限定当前 SID；`pmOption` 已按上表唯一定位）：

```js
await editor.fill('/');
await pmOption.click(); // 真实 mousedown 领取
// 先等待 data-phase=claimed 并核 token，保持当前光标在 token 后。
await editor.press('End');
await editor.pressSequentially('ping'); // 追加，不替换整段
// 必须核 textContent.trim() === '/pm ping' 且 phase === 'claimed'。
await editor.press('Enter'); // 只提交一次，采 command 返回
```

无菜单路径的最短动作：在同一 live editor `fill('/pm ping')`，若菜单打开先 Escape，再 Enter；进入 plain adjudication 并执行是合法路径，不依赖 Space 缓存预热。**不要向副驾填 `/pm ping`，不要让模型“帮我运行命令”。**

已有非空白会话能显示结果，才继续该会话内其他命令的 GUI 原证。若 3241 没有这样的会话，**不建议为了显 pong 发自然语言或改模型/凭据**，保留以下执行证据与显示接缝即可。

## 5. 可验证的 Command Run/Done 与背景 Session

### 5.1 一次提交应关联的证据

Main 在其既有采集设施中核以下对象，不在本报告用 RPC/curl 代替 GUI 发命令：

1. 提交前：实例 3241、当前 SID、editor 完整 `/pm ping`、phase、contenteditable、菜单开关、按钮 enabled 状态与时间。
2. 浏览器真实 unary：端点 `commands/execute`，生成代理的参数为 `{agentId: SID, line: '/pm ping', submittedAttachments: []}`。默认 Web carrier 是相对文档路径 `api/commands/execute` 的 POST；请求外包是 `{type:'client-request',rpcId,method:'commands/execute',payload:{args:...}}`。部署 mount 前缀不可硬编码。[S10]
3. 执行返回：生成代理解包后 `ok=true` 且 `value={commandId,result:{kind:'success',text:'pong：项目管理工作台插件已加载。这是离线命令，当前未使用任何模型或 API Key。'}}`；保留 rpcId、SID、commandId。传输 JSON 的外层不一定是代理的 `ok/value`，不要误比包层。[S1][S4][S10]
4. 同 SID 的 history live frame / 既有 session 日志里 `command/run.data={commandId,name:'pm',args:'ping',source:{kind:'user'}}` 与 `command/done.data={commandId,kind:'success',text:上述pong}`。两者按同一 commandId 配对，不拿其他 session 的旧 pong 认领本次。
5. 显示侧：该 SID 仍 blank=true、无 `turn/start`，hero 留存；在已有非空白会话中，匹配的新 command 节点会显示 result。**结果原证与 GUI 可见原证分别记录。**

命令 lifecycle 是 log-only append，不强制每条磁盘 flush；Host 会在普通 checkpoint/teardown 落盘。刚提交后某 JSON 文件暂未出现，不等于没有 live run/done，不能为了本单 flush/重启 server。[S4] history follower 已监听 scoped session/event；run/done 不是靠 `command/executed` 的本地回调拼造持久正文。[S1][S6]

### 5.2 分支判据

| 本轮实际原证 | 诊断范围 |
| --- | --- |
| execute 成功 + 同 SID run/done pong；hero 留存 | 执行成功，命令空白会话显示策略；不再排模型/handler。不是完整 GUI 可见结果 PASS。 |
| execute 成功 + run/done error；草稿清空 | handler 返回错误但 UI admission 成功；读 done.text，不把清空当业务成功。 |
| execute 返回 undefined / Remote error | 未匹配或 admission/transport/lookup 失败；正常 claimed 路径应保草稿/报错。清空若仍发生需核 bundle、draft 修改或 teardown。 |
| 无 execute，而有 `session/prompt` | token 被替换/claim 释放、未匹配、inputTriggers 不可用等造成 ordinary fallback；查提交前完整文本，不要求 model 替 pm 执行。 |
| 菜单 pending，Enter 后文本原样不动 | deferred 仲裁 no-op；等真实 ready 后选，不反复 Enter。 |
| Host 返回成功但同 SID live frame 不到 | 事件 follower/连接问题，核 client eventSource 与已有 history 原证；不能仅据 composer 清空证明投影已到。 |
| 非空白会话中 run/done/投影都有，但无新 command DOM | 检查实际 selected conversation view 是否 chat、command renderer/slot 与下发 bundle；已超出单纯新会话 hero 隐藏。 |

### 5.3 “背景 session”准确含义

NewSession 创建并选择的普通 SID 就是命令收件人；claim 闭包捕获的也是它。正常 pm 输入并不提交后换一个 SID，也不会自动替用户选后台“最新会话”。若用户提交后导航，原 session 可以继续拥有 lifecycle，但 Main 当前页面已经不是其视图。[S1][S9]

Host 的 sessionListMetadata.blank 只因 turn/start 变 false；command-only 不更新 lastPromptAt。侧栏 `sessionVisible` 隐藏**非当前** blank session，当前 blank 只作为“新会话”占位行显示；搜索也排除 blank。因而切走后看不到那个命令会话，甚至 workspace 再打开可能复用 blank，**都不能证明命令没执行**。若 Main 明确在同一 SID、展开且无过滤的 workspace 中连当前占位行都没有，单靠这条规则解释不了，需另核 sidebar selection/列表原证。[S8][S9]

## 6. 对旧结论的限域纠正与验证边界

旧 gateway 报告 §4.1 的“普通主会话 → 命令结果 flow”应补上**已非空白**前提；“直接 `/pm `”不能承诺 Space 一定热缓存领取。旧 KB-037/KB-036 把斜杠命令“一律不能回车、必须蓝色发送、去最新会话”作为通用规则，与这份当前源码的 claimed/Enter adjudication 及 command-only hero 行为不一致；这里只纠正本单接线解释，不覆盖历史实测，不修改这些文档。

本轮只运行只读 `git status/rev-parse`、`find/grep/sed/nl/cat` 等源码读取。机器未提供 `rg`，采用 grep/find。按本单禁止 build/server/GUI/product/credentials/commit 及只写一个报告的明确范围，未 fetch/pull、install、build、verify、调用运行实例、读取实际 profile/凭据、启动/停止进程或 GUI 实测。不套用修改产品的完整回归要求，不写独立 PASS。上游既有测试仅作为源码反证，**本轮未运行它们**。

报告静态检查：macOS 内置 Perl 逐个抽取本文件 Markdown 本地链接、去除行号 fragment 后检查路径存在，退出码 0，36 个链接、缺失 0。仅检查文档引用，不证明 3241 装载、业务执行或 GUI 通过。

仍未验证：3241 实际 bundle 对应版本；输入 ping 后是否仍 claimed/保 `/pm `；实际 unary 与 live run/done；当前 sidebar 占位；实例是否有可显示结果的非空白普通会话。下一步是 Main 在原授权和专家步骤内补这几项原证，不扩建新功能、不干扰其他 GUI。

## 7. 源码索引

- <a id="s1"></a>**[S1]** [ui-commands/service.ts](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-commands/src/client/service.ts)：L97-L123 目录/注册；L251-L283 菜单/Space；L302-L348 Enter；L378-L415 claim/execute；L449-L458 detached。
- <a id="s2"></a>**[S2]** [InputBar.tsx](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/skeleton/InputBar.tsx#L132-L157) L132-L157 locked、L323-L341 primary；[view-binding.ts](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/input/editor/view-binding.ts#L106-L144)；[keymap.ts](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/input/editor/keymap.ts#L135-L157)；[MenuView.tsx](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-input-trigger/src/client/MenuView.tsx#L129-L173)；[controller.ts](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-input-trigger/src/client/controller.ts#L265-L295)。
- <a id="s3"></a>**[S3]** [machine.ts](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/input/machine.ts)：L92-L105 保 claim、L145-L182 Enter/adjudication、L193-L223 settlement；[facade.ts](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/input/facade.ts) L341-L387、L813-L870。
- <a id="s4"></a>**[S4]** [commands/index.ts](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/interaction/commands/src/index.ts#L332-L466) 生命周期/handler/落盘；[pm handler](../packages/dsh-pm-tool/src/index.ts) L207-L214 注册，L353-L357 pong；[Agent lookup](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/api/session-controller/src/agent.ts#L139-L171)。
- <a id="s5"></a>**[S5]** [chatViewDefinition](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-chat/src/client/conversation-nodes/chat-snapshot-builder.ts#L1228-L1233) 排除 command；[conversationPhase](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/contract/snapshot.ts#L26-L34)；[DefaultConversationViews](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/skeleton/DefaultConversationViews.tsx#L25-L42)；[ConversationMainPanel](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/skeleton/ConversationMainPanel.tsx#L17-L46)。
- <a id="s6"></a>**[S6]** [history follower](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/api/session-controller/src/history.ts#L120-L164)；[assembly](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/conversation/assembly.ts) L62-L96、L106-L129；[assembler](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/conversation/assembler.ts#L409-L453) 激活和活动判定；[apply.ts](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/apply.ts#L180-L219) restoreView；[commandDefinition](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-chat/src/client/conversation-nodes/command.ts#L174-L224)。
- <a id="s7"></a>**[S7]** [CommandNodeView](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-chat/src/client/chat/CommandNodeView.tsx#L12-L23)；[GenericCommandCard](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-chat/src/client/chat/GenericCommandCard.tsx#L100-L185)；[ChatNodeSeat](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-chat/src/client/chat/ChatNodeSeat.tsx#L151-L159) DOM keys。
- <a id="s8"></a>**[S8]** [list metadata](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/api/session-controller/src/list.ts#L47-L57)；[sidebar blank visibility](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-workspace/src/client/tree.ts#L238-L252)，同文件 L570-L597 搜索排除；[feedback GUI 既有用例](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/apps/web/tests/feedback-command.e2e.ts#L73-L85)；[command-only hero 既有用例](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/apps/web/tests/feedback-release.e2e.ts#L287-L304)。
- <a id="s9"></a>**[S9]** [navigation](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-workspace/src/client/navigation.ts) L179-L213、L254-L285、L432-L461；[session/create](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/api/session-controller/src/commands.ts#L105-L143)；[ConversationContent](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-conversation/src/client/skeleton/ConversationContent.tsx#L136-L160) inert/block；[model-selection 注册](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-model-selection/src/client/index.ts#L115-L190)；[AppFrame.MainPanel](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-layout/src/client/AppFrame.tsx#L40-L43)；[session row selector](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/ui-workspace/src/client/rows/Rows.tsx#L586-L598)。
- <a id="s10"></a>**[S10]** [built composition wire 参数既有用例](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/apps/web/tests/shipped-composition.e2e.ts#L745-L757)；[Gateway client](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/api/gateway/src/client/index.ts#L445)；[Web RPC envelope](file:///Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/client/connection/src/client/rpc.ts#L34-L69)。端点是 commands/execute，非新建产品 HTTP API。
