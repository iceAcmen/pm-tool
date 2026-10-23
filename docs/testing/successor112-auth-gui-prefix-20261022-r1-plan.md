# 后继112鉴权有限审证与重复前缀先行 RED 计划

> 2026-10-22，trae，Successor112AuthGuiPrefixR1。独立 GUI 审证及必要先行合同专家；非产品开发、非 GUI 执行。本计划不启动实施，交不同 developer 和后续独立复验角色。

**Goal:** 审签既有401原因/429/正常恢复的有限 GUI 证据，确证并只闭环重复场景前缀。

**Architecture:** 命令层保留原单前缀及中文原因，客户端传输将业务 error 原文抛出，副驾展示层不得再添加同一前缀。优先复用已有 `prefixFeedbackOnce`，不另造通用错误框架。

**Tech Stack:** macOS、nvm Node22.23.3、已有 pnpm11.28.5 依赖的独占副本、Vitest2.1.9、React18.3.1/react-test-renderer；本轮无 install/build、无浏览器或网络。

## 授权与停止

负责人原句：

> 父授权持续多角色验全部/确证缺陷闭环后ordinarycommit。你不同独立GUI审证+必要红合同专家，非开发非执行；唯一docs/testing/successor112-auth-gui-prefix-20261022-r1*。
>
> limitedAUTH原因可签但整提示若原单前缀合同FAIL不能豁免。只读source定位重复层并写最小先行red计划/用例(可自身新test)给不同developer，不要修改产品。
>
> 必要测试只独占tmp deps产出，不build/install/sharedlib/browser/service/key/Git/livingdocs/其他testing。未签取消/realmodel保，不再旧rate/partialerror修。主source112不锁；若红fixture充分可独占真实component受测预失败（不跑旧executor，noEmit不是GUI）。
>
> 交最小允许文件/原因/影响/停条件，限定重复前缀合约无新feature不整B8。原已signd SOURCE/AUTO不能冒新GUI；limited审结后STOP，Main另开发/另复验。

依据 AGENTS、collaboration §9/§11、三修112构建计划、ask-auth独立210报告、ATF combined旧GUI有限报告。本次具体授权收窄通用 fetch/pull、install/build、livingdocs、Git 与全回归 SOP。父普通commit属于Main全部闭环后的动作，不移交本角色。

- 唯一可写：本前缀新计划、审计/报告、先行测试/执行器/结果；存在原件一律不覆盖。
- 设施：`/private/tmp/successor112-auth-gui-prefix-20261022-r1-*` 独占创建，只复制已释放冻结源码和依赖，写自己的 config/tmp/cache/home/log。不生成共享 lib、不锁主source112。
- 审证对象：`Successor112GuiR1/index-r1.json` 747声明及21/22原件；`CombinedSuccessor112R1` 的112声明、519输入和原产物。其余GUI只校身份，不给功能结论。
- 终点：有限审结、必要RED及最小派单交回即 released/STOP；不继续开发、GUI、整B8、旧rate/partial_error修复、取消或真实模型补测。

## 既有合同与缺陷

`core/ui-feedback.ts:132-142` 已规定：下层含同场景前缀时原样保留，其他原因只补一次，不清洗正文。RA-AI06原中文诊断/失败不冒成功与健康恢复不变；本轮把该既有单前缀合同绑定真实副驾接缝，不新增feature或全页面矩阵。

链路：`ask.ts:129` 返回单前缀 -> `index.tsx:49-60` 对业务error抛 `Error(command.text)` -> `sidecar-portal.tsx:384-386` 再拼同前缀 -> `MarkdownView` 展示双前缀。归档401和429截图/RPC交叉确证；AUTH原因正确不豁免整提示FAIL。

### 任务1：只读审证

逐 bytes/SHA 核747索引、112声明/519冻结输入、产物与loaded唯一执行段；仅剥离原末尾sourceMappingURL注释。不将first-load/cache或宿主Git身份冒充已证。核helper、真实RPC请求/响应配对、gateway-slice与原gateway401/429代码。直接目视21/22 PNG及已存相关帧。

逐表/逐JSON核业务/files/backups无变化；**settings不可全排除**：只准已证 `aiModelMode.record.updatedAt` 因明确生产Key点击及真实 `/pm model mode prod` 改变，value仍prod；其他settings须精确相等。宿主session写另列，不称全data零写。

### 任务2：先行真实组件用例

新测试仅本前缀 `-component.test.tsx`。受测为原112真实 `CopilotPanel` 与真实 `MarkdownView`，传输替身只提供归档合法 command error 文本，匹配生产边界抛原文 `Error`；不自编AUTH classifier或伪造终态证据。空业务列表是合法无任务展示fixture；不构造计划/写实体。

| 用例 | 预期 | 修前性质 |
| --- | --- | --- |
| P-AUTH | 21真实RPC单前缀原文 -> send -> AI气泡全文等于原文，AUTH中文无效/失效保留 | 必要RED：真实组件重复前缀 |
| P-RATE-PREFIX | 22真实RPC单前缀原文 -> send -> 气泡全文等于原文 | 必要RED，仅同一前缀合同，不重修旧rate终态 |
| C-RAW | 不含场景前缀的传输Error | 恰补一次，完整原因保留 |
| C-COLON | 已带ASCII冒号同场景原文 | 原样保留，按既有helper合同 |
| C-SUCCESS | 22真实RPC正常正文 | 原文保留，不加错误前缀 |

每例先记录actual全文、sending/占位清除、命令清单、零apply/零capture、同实例健康后续请求；然后做全文oracle，不以substring通过洗掉重复。结构安全控制属于组件AUTO，不冒真实后端零写或GUI。

独占复制须核普通文件字节/不同inode、软链全部解析在本tmp内；任何外链、冻结漂移或设施错误先BLOCKED，不按设施失败修产品。singleFork、无缓存，只跑自身新test；不运行旧executor/旧tests、不跑noEmit冒GUI。原exit1、stdout/stderr、JSON和observations保真。

### 任务3：交不同开发的最小文件级派单

| 最小允许文件 | 原因/动作 | 影响与验证 |
| --- | --- | --- |
| `src/client/shared/drawers/sidecar-portal.tsx` | 仅导入已有 `prefixFeedbackOnce`，send catch 调 `prefixFeedbackOnce('副驾暂不可用', e)` | 只改错误展示包装；不改send成功、状态、计划、车道、取消和任何写行为 |
| 一个新副驾前缀专项产品测试（由Main明确其owner/path） | 可迁移本先行test及精确oracle，不修改旧tests | 修前必要红、修后所有专项绿；独立复验不能由developer自签 |

禁止改 `ask.ts`、`ai-client.ts`、model-route、`index.tsx`、共享helper实现、错误终态、网关、Key、schema或全B8。无须移动命令前缀，无须全局replace/trim。若已有helper不能满足上述边界，停止并交Main补方案，不扩范围。

开发自验 -> 不同独立SOURCE/AUTO复验 -> Main唯一新候选/产物绑定 -> Main按既有21/22旅程只补去重后的真实GUI -> 不同GUI专家审完整提示。旧210及terminal SOURCE/AUTO门只保原范围；受影响GUI不能沿旧证升级。

**STOP：本轮不签修后、不签RA-AI06整项、取消/realmodel/整矩阵/父goal/ordinarycommit。Main另派开发与复验；release STOP。**
