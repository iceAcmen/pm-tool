# 后继112鉴权 GUI 有限独立审证与前缀 RED

> 2026-10-22，trae，Successor112AuthGuiPrefixR1。不同独立 GUI 审证及先行合同专家，非产品开发、非 GUI 执行。只签原112的下列子断言，不签修后、整RA-AI06或父出口。

## 裁决

**401的中文凭据无效/失效原因、429原因及正常恢复有限 GUI PASS；完整错误提示因双前缀 FAIL，不能豁免。**

| 子断言 | 结论 | 实际支持/边界 |
| --- | --- | --- |
| 21 AUTH原因 | **PASS_LIMITED_GUI** | 原prod实际请求已到网关seq8，401终止失败链返回业务error；中文“凭据无效或已失效，请检查 API Key。”真实可见，不再误写PROD_KEY_MISSING/未检测到 |
| 22 rate原因/停链 | **PASS_LIMITED_GUI** | seq9的429，业务error，中文限流可见；不是HTTP200信封当模型成功 |
| 22正常恢复 | **PASS_LIMITED_GUI** | 同页面新请求seq10业务success，原正文可见且提示“模型未给出可执行步骤”；只读诊断，不冒合法计划或真实外网模型 |
| 故障业务/files/backups不变 | **PASS_LIMITED** | 四状态全部业务JSON、文件和备份指纹相等；settings仅明确模式点击timestamp例外，其他settings精确不变 |
| AUTH/rate完整错误提示 | **FAIL：S112-PREFIX-01** | command只有单前缀，页面显示“副驾暂不可用：副驾暂不可用：…”；原因正确不能充当完整文案/UX通过 |
| 取消signal/realmodel/整矩阵/RA-AI06/父goal | **NOT_SIGNED** | 原未签边界保持，不再修旧rate/partial_error，不升格旧SOURCE/AUTO或旧GUI |

依据：[本轮授权及先行合同](successor112-auth-gui-prefix-20261022-r1-plan.md)、collaboration §9/§11、RA-AI06原合同及既有 `prefixFeedbackOnce` 单前缀合同。主持续验全部任务继续，普通commit须等确证缺陷与全部出口闭环；本角色不执行Git动作。

## 独立原件核验

[审计](successor112-auth-gui-prefix-20261022-r1-audit.json)不是转述Main自判：独立解析并核原helper、21/22动作脚本、RPC信封、gateway-slice、原gateway代码、rawJSON、源/产物与loaded-binding；直接打开 **3张PNG + 9张原JPEG** 目视。不运行或改旧执行器，不访问服务或浏览器。

| 认领对象 | 实际核对 |
| --- | --- |
| `Successor112GuiR1/index-r1.json` | **747声明**全bytes/SHA相等；126487字节，SHA `111a838096c657b19203b7cd16c440d7d4cf4b69c52a5c0e2c6c7100119ae322` |
| 基线与冻结 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + `/private/tmp/pmtool-combined-successor112-20261022-r1` 未提交冻结，version0.7.4，不把HEAD/version当完整候选 |
| 原112声明 | source-files与final-source-binding全文相等；97插件项逐SHA匹配冻结，15launcher只核原声明，不称全部在插件freeze |
| 完整包/产物 | **519输入、455 lib产物**全集合与bytes/SHA相等；未重新build或执行其回归 |
| 实例/开关 | 归档host3262/PID92870、gateway3261/PID60386；新独占runtime，EGO13/p3，DSH_PM_E2E=0、pilot={}、prod；host-start所指candidate/source SHA与原件相等，不探活、不启停 |
| compiled client | 1719114字节，SHA `415e24f2fc660370256aa9a186f141aae24064a80cdcd2d6729b7ff28c9fe8d7` |
| loaded响应 | 2597914字节，SHA `a928625c3556242a83bd2bb2aa5ce1367214128594edfc14ba5bed9ab58352b8` |
| loaded唯一段 | 仅剥离最后sourceMappingURL注释，1719080字节，SHA `18c631bcdabedd5082b9c8fee14e896d56b91d7df0179ea5aa0cc85e666b9fde`，offset875361、第二匹配不存在 |

原full-client比较false保留，不将sourceMap注释差异当执行字节污染；没有first-load/cache资格证据，不签该门。宿主cwd/argv归档可核，宿主Git身份未完整认领，不以插件身份代替宿主身份。112主树只观察、不锁；before/audit时无漂移，后续Main合法改源不倒签本原112。

ask SHA `084efb5b33e7cda7368b87c4708f87f460d28588f3e7476cadfad2de0fd35884`，与已签独立210 SOURCE/AUTO对象一致；ai-client SHA `b0348f33a6a38202147819d9d8128f12c46f024fde08cb94258508faefcd0448`，与原terminal子签对象一致。既有签字保原范围，不作为本GUI自动PASS依据。

## 请求、终态与精确零写边界

| 请求 | requestId / rpcId | 实际结果 |
| --- | --- | --- |
| 明确点击生产Key | `24317.1521` / `3595dff4-0a2b-457b-aeb5-f39873e2ef10` | `/pm model mode prod`，success，已切生产车道且检测到Key |
| 21 AUTH | `24317.1522` / `b809dc3b-c575-42c1-aecf-434478be5a5b` | `/pm ask p-0001`只读凭据失效问题；gateway seq8/auth/flash；command error单前缀中文无效 |
| 22 RATE | `24317.1523` / `94da94a8-2e52-4145-b363-89674d43bd7e` | seq9/rate_limit/flash；command error单前缀中文限流 |
| 22 NORMAL | `24317.1524` / `3210ce0b-5606-4e98-bb80-00e923cd1e44` | seq10/success/flash；command success原正文 |

逐requestId/rpcId配对，网关body中的真实问题与RPC问题一致；每问一个首候选请求，未冒多池回退。原gateway代码auth/rate分支真实 `writeHead(401/429)` 后JSON error/end；原112生产 `ai-client.ts:113-124` 先判BlockAssembler.finish.error，`146-161` AUTH归一INVALID_CREDENTIAL，`ask.ts:126-129` 不再宽匹配“API Key”。合法prod选择、真实gateway请求、中文command error及页面可见相互支持本401终止失败原因，不是伪造缺码或拿自编Error当终态。

**本包没有模型HTTP原响应wire/body/status抓包或单独GUI绑定的finish.enum日志**，不宣称完整wire/terminal探针已采；宿主HTTP200只是RPC传输，两个command.kind=error不能称模型200/生成成功。新组件RED只证明展示包装，不证明真实模型终态。原独立210含真实生产pi/assembler的终态证明仍保原SOURCE/AUTO范围。

四状态 `19-cycle-retry-reopened -> 21-auth -> 22-rate -> 22-normal` 各21份pmtool rawJSON，**84份**集合/bytes/SHA逐项等roots。业务、files/backups相等，原t-0004及确认台账无本次写入。**settings没有全部排除**：

- `aiModelMode.version=2`、`record.value=prod`均不变；只因明确click和真实mode命令，`updatedAt` 从 `2026-10-22T12:31:43.291Z` 到 `2026-10-22T14:12:58.750Z`；此后AUTH/RATE/NORMAL相等。
- `pmExportAudit`、`pmExportSent`全程精确不变，不做全settings豁免。
- 19→21及21→22-rate宿主sessionJSON变化另列；22-rate→22-normal扫描根无变化。因此不称全data/全盘零写，未扫描exports/private/cache/正式资产不签零污染。

原executor-observations声明首seal exit1及timestamp理由保留，不把其首错覆盖或称全零写。原RAW/SHA未改变；其他备份/前置/固定导出只校747身份，不给本门功能签字。

## 目视与重复层定位

21-auth.png确见生产Key选中、凭据无效双前缀气泡；22-rate.png同时留旧AUTH和新限流双前缀；22-normal.png留前两错误及新健康原正文、无可执行步骤/暂无确认落库结果。三状态同timeOrigin `1792677670591.4`，深色1458×734/DPR2。

九帧已全部直接目视：21三帧为空副驾/发问前段，rate三帧主要是先前AUTH结果，normal三帧主要是前两错误；**不是完整连续终态录像**。结果依对应PNG/状态/RPC补足。helper只保command网络、screencast及exceptionThrown；三个捕获窗口exceptions=0，不保存consoleAPICalled，不签全Runtime/console零错。不签浅色、其他视口、200%、VoiceOver或完整矩阵。

重复实际发生在展示层：

```text
ask.ts:129 返回“副驾暂不可用：<中文原因>”
index.tsx:49-60 对command.error抛 Error(command.text)，不添加前缀
sidecar-portal.tsx:384-386 catch 再拼“副驾暂不可用：”
MarkdownView 原样展示双前缀
```

原 `sidecar-portal.tsx` 45842字节，SHA `7cf48821e7e6ee570288c385b59897fd33f8ab0ec32da42ef87111c2c016a269`；共享helper SHA `94bab4055958c6abb22caf6343173b8e643c58c9da85a28e421b5ef7f86d35d7`。**S112-PREFIX-01必须修复，非自动豁免轻微问题。** 不要求改AUTH/rate分类或重开partial_error。

## 先行 RED 与原退出

真实原112 `CopilotPanel` + `MarkdownView`，传输替身只消费原RPC文本、照原index边界抛Error；空业务列表合法，不mock组件/分类器/计划。依赖普通复制 **13579文件/1030内部软链，外链0/共享inode0**；只跑本新test，不跑旧executor/tests、不build/install/noEmit、不使用网络/凭据。

首轮 **1文件5项，1绿4红、exit1、0跳过**。必要双前缀三红真实存在；C-RAW多行控制的自有取文本器漏算 `<br>`，不误判为产品丢正文。首test/config/src、结果/observations/exit1全部保留。详见[oracle修正](successor112-auth-gui-prefix-20261022-r1-oracle-correction.md)。

R2仅本新test虚拟取文本器加`br -> \n`，不改原src/test/fixture/断言或真实Markdown组件。**同五例2绿3必要红，exit1、0跳过**：

| 用例 | R2结果 |
| --- | --- |
| P-AUTH、P-RATE-PREFIX | **RED**，actual均是原单前缀再加一次 |
| C-COLON | **RED**，已含ASCII冒号场景也被再添加 |
| C-RAW、C-SUCCESS | PASS，未带前缀原因恰补一次/健康正文原样 |

五例都先证无写命令/无onSaved、占位清除、sending解锁及同组件健康后续，再执行全文oracle；五份真实observations完整保。不是substring洗绿，不将重复执行计成10个新用例。组件AUTO不替后端零写或GUI签字。

运行环境macOS/bash、Node v22.23.3、Vitest2.1.9、React18.3.1，沿现有pnpm11.28.5产物；本角色无pnpm调用。仓库根命令及原码：

```sh
# Node22已存在；以下直接使用该二进制，不更改全局环境。
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/successor112-auth-gui-prefix-20261022-r1-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/successor112-auth-gui-prefix-20261022-r1-runner.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/successor112-auth-gui-prefix-20261022-r1-audit.mjs before
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/successor112-auth-gui-prefix-20261022-r1-audit.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/successor112-auth-gui-prefix-20261022-r1-runner.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/successor112-auth-gui-prefix-20261022-r1-runner.mjs test
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/successor112-auth-gui-prefix-20261022-r1-runner.mjs close
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/successor112-auth-gui-prefix-20261022-r1-runner-r2.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/successor112-auth-gui-prefix-20261022-r1-runner-r2.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/successor112-auth-gui-prefix-20261022-r1-audit.mjs close
```

顺序原码：`0/0/0/0/0/**1**/0/0/**1**/0`；两次1是保留的必要RED，其中首轮另有已说明的自有oracle错误。before/audit/close是文件审计，不是产品全量PASS。实际argv/cwd/白名单env/PID/起止/原status/signal见 `-test-command.json` 和 `-r2-command.json`；工具执行收据另封，不混子PID。探索rg缺失127、memory/不存在缺省settings路径读取1、准备时尚未生成facility读取1保留为工具事实，不是产品FAIL。

## 最小派单与 STOP

仅允许不同developer改 `src/client/shared/drawers/sidecar-portal.tsx` 的 **已有helper导入 + send catch一行**，复用 `prefixFeedbackOnce('副驾暂不可用', e)`；另一个由Main认领owner/path的新前缀专项test可消费本R2 fixture。**原因/影响：只消除重复包装，保留完整错误原因与未带前缀的传输兜底；不改变命令/模型/车道/写行为/成功/取消。**

不允许本窄修修改ask/ai-client/model-route/index/共享helper/schema/网关/Key或旧oracle，不作全局replace/trim。不满足现有helper边界、输入身份改变或要扩B8即停，交Main补范围；本角色不实施。不同developer自验后，由另独立SOURCE/AUTO专家复验，Main唯一新候选/产物绑定，再采去重后的21/22原GUI旅程交不同GUI专家，不沿旧112或原210绿签新提示。

[原件保护/释放](successor112-auth-gui-prefix-20261022-r1-close.json)核 **1734保护对象不变**；本角色主source112仅观察、不锁，独占测试PID3086/3566已退出。原冻结/依赖与自有源/配置/依赖不变，临时设施保留不删除。只写本前缀和专属tmp；产品、他人testing/livingdocs、共享lib、服务/browser/key/Git写未触碰。

**本角色 released/STOP；S112-PREFIX-01仍FAIL，GUI修后NOT_RUN。取消/realmodel/整RA-AI06/父goal仍NOT_SIGNED，ordinarycommit MAIN_ONLY，release STOP。Main另开发、另复验；不终止父持续验全部任务。**
