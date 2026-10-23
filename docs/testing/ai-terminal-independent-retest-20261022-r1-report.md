# AI 终止错误独立 SOURCE/AUTO 复验 r1

> 给 Main、开发与后续独立专家使用：只判断 AI terminal 修复的源码和确定性自动化边界，不判断 GUI、RA-AI06 整项或发布。2026-10-22，平台 trae；角色独立 SOURCE/AUTO 复验专家，与 `ai_terminal_minimal_development` 不同，不兼开发或 GUI。

## 当前结论

**PASS_LIMITED_SOURCE_AUTO**：独立执行 8 + 10 + 43 + 175 = 236 项全绿，legacy-source/noEmit 退出 0；窄 SOURCE 审查未发现本增量的新阻断，最终 close 退出 0、910 个列明保护对象零漂移、所用进程退出并释放。仅签本轮冻结字节下三项 terminal 缺陷；GUI、RA-AI06 整项、父总门未签，**release STOP**。历史审查器自身的格式设施失败及修正原件保留，不伪报所有命令从未失败。

| 原缺陷 | 本轮有限判定 | 修复面与对应证据 |
| --- | --- | --- |
| ATF-01 部分失败正文误成功 | 源码/确定性 AUTO 已关闭 | `ai-client.ts:117–124`；N02、N08-partial 与新测试不返回失败正文 |
| ATF-02 硬码误 EMPTY / 继续候选 | 源码/确定性 AUTO 已关闭 | `:140–188,202–215`；N01、N03–N07、N09 中文分型与候选调用 |
| ATF-03 模型取消仍请求下一候选 | 源码/确定性 AUTO 已关闭 | `:119–120,140–143,210`；N08-empty/partial 仅 first，均 ABORTED |

## 授权与对象

负责人本子任务原句的边界为：“你是与ai_terminal_minimal_development不同独立SOURCE/AUTO复验专家，唯一写docs/testing/ai-terminal-independent-retest-20261022-r1*，非开发非GUI，禁止改产品/原用例/他人testing/livingdocs/services/Git”；“独立自有完整冻结+独占既有deps/内部重定位，原8/10+开发43+affected175+legacy-source/noEmit复验及窄SOURCE审查”；“GUI待Main，release STOP”。

父持续授权允许多角色验余项和确证修复后的普通 commit，但**本角色禁止 Git，不继承父 commit 动作**。依据 AGENTS、collaboration §9、§11.1–11.6 和本次范围明确的限制，只读核文档与交接；不 fetch/pull、install/build、全 verify、覆盖率、服务或 living docs 写。一般接手 SOP 不扩大本子任务权限。

- 修复合同：[计划](../plans/2026-10-22-ai-terminal-failure-closure.md)、[原必要红报告](ai-terminal-failure-20261022-report.md)、[原 cases](ai-terminal-failure-20261022-cases.test.ts)。原 r2 cases 未改字节，SHA256 `f5d9f47a8e007f206e2c0534bb0ded4c2b9c686fd949d37b1d74ff27b8413ed9`。
- 开发交回：[delivery.json](../../reports/all-pending-evidence-20261021/AiTerminalDevR1/handoff/delivery.json)，`released=true / stop=true / developerSelfTestOnly=true`。本轮不是转述其自验结果。
- 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 只读来自原 r2 候选与开发交接，未执行 Git；不能用 HEAD 代表未提交候选。
- 父声明 104 原样保留，后继 106 仅加本次两个文件声明。本轮认领此冻结的 973 个完整插件输入，不签整个 106 的功能总门。
- 唯一产品增量：`src/core/ai-client.ts`；唯一新测试：`src/core/ai-client-terminal.test.ts`。旧 U4r2、3257/3258、原 230/506 封包不替换、不认为已加载 106。

## 冻结与输入口径

[候选原件](ai-terminal-independent-retest-20261022-r1-evidence/candidate.json)、[统计对账](ai-terminal-independent-retest-20261022-r1-evidence/input-count-reconciliation.json)、[完整输入指纹](ai-terminal-independent-retest-20261022-r1-evidence/frozen-before.json)：

| 口径 | 数量与事实 |
| --- | --- |
| Cycle 不含 lib 的完整输入 | 509 |
| 本次不含 lib 的完整输入 | 510；新增 1 个测试，已有文件只有 ai-client 产品字节变化，无删除 |
| 本次完整冻结 | **973 = 510 + 463 个原 lib 文件**；不是新增 464 个产品文件 |
| 根统计 | src 397、scripts 105、lib 463、6 个根配置/清单文件、locale 2；src 中包含全部 158 个测试文件 |
| 产品增量与旧冻结比较 | 仅上述 2 个路径，lib 原样未 build |

生产源码 SHA256：`b0348f33a6a38202147819d9d8128f12c46f024fde08cb94258508faefcd0448`；新测试 SHA256：`3403fbf72e5db73dd788d94f64a42bad386a4092711dfd7abce511507f14ceed`；增量 patch SHA256：`5fb4136a00899f5379304c96fa5e2fea910f3b929243e4c7a21d7082680720a2`。三者与交回及主树对应两文件逐字节匹配。

所有执行从本专家自有 `ai-terminal-independent-retest-20261022-r1-evidence/frozen/` 消费。完整普通复制已释放开发 r3 既有依赖，内部软链重定位，**14,394 文件 / 1,031 内部链接 / 外链 0 / 共享 inode 0**。源码、原用例、上游生产协议副本、依赖分别留前后指纹；没有安装、构建或改共享依赖。

## 环境与执行

macOS，Node v22.23.3，Vitest 2.1.9，TypeScript 5.9.3，Cordis 4.0.5-alpha.1，dsh-llm 0.2.1-alpha.2，pi-ai 1.0.2。沿既有 pnpm 11.28.5 依赖冻结，未执行 pnpm/install。

Vitest 显式 `--no-cache`，`singleFork=true`，min/maxWorkers=1，六组顺序独占同一自有依赖；不继承调用 shell 的凭据环境。命令原件逐项包含实际 argv、cwd、白名单 env、PID、起止时间、原退出码、signal、stdout/stderr 和 JSON 用例结果。

所有可写运行根均在自有 evidence 下：HOME、TMPDIR/TMP/TEMP、XDG cache/config/data、DSH_HOME、PM_GOVERNANCE_TMP、PM_FILE_ATOMIC_TMP、附件/备份/导出根，以及 ATF_OBSERVATIONS。尤其 `PM_GOVERNANCE_TMP=<本轮>/tmp`，不使用 `/private/tmp` 缺省。原治理用例自身建立的真实 JSON/附件记录只落此自有 tmp。

运行环境为 macOS + nvm Node 22，从仓库根执行：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/ai-terminal-independent-retest-20261022-r1-runner.mjs freeze
node docs/testing/ai-terminal-independent-retest-20261022-r1-runner.mjs test controls
node docs/testing/ai-terminal-independent-retest-20261022-r1-runner.mjs test original-red
node docs/testing/ai-terminal-independent-retest-20261022-r1-runner.mjs test new
node docs/testing/ai-terminal-independent-retest-20261022-r1-runner.mjs test affected
node docs/testing/ai-terminal-independent-retest-20261022-r1-runner.mjs test legacy-source
node docs/testing/ai-terminal-independent-retest-20261022-r1-runner.mjs test noemit
node docs/testing/ai-terminal-independent-retest-20261022-r1-history-review.mjs
node docs/testing/ai-terminal-independent-retest-20261022-r1-runner.mjs close
node docs/testing/ai-terminal-independent-retest-20261022-r1-seal.mjs
```

freeze 和命令原件使用 exclusive-create；已存在的本轮不能重复执行或覆盖，重验另派新前缀。实际执行六组由 Node 顺序调用上述同一命令，并检查每个 runner 的实际退出码；不是 shell 吞失败后继续。

| 本轮命令 | 实际退出码 | 执行结果 | 原证 |
| --- | --- | --- | --- |
| freeze | 0 | 973 输入、独占依赖及保护匹配 | [freeze-check](ai-terminal-independent-retest-20261022-r1-evidence/freeze-check.json) |
| controls | 0 | 8/8，全绿；10 pending 是另一组 | [summary](ai-terminal-independent-retest-20261022-r1-evidence/controls.summary.json) |
| original-red | 0 | 原 10 必要红修后 10/10 绿；8 pending 是控制组 | [summary](ai-terminal-independent-retest-20261022-r1-evidence/original-red.summary.json) |
| new | 0 | 43/43 全绿，pending 0 | [summary](ai-terminal-independent-retest-20261022-r1-evidence/new.summary.json) |
| affected | 0 | 原 13 文件 / 175 全绿，pending 0 | [summary](ai-terminal-independent-retest-20261022-r1-evidence/affected.summary.json) |
| legacy-source | 0 | 仅重新定位旧脚本 import；原断言全部通过 | [summary](ai-terminal-independent-retest-20261022-r1-evidence/legacy-source.summary.json) |
| noemit | 0 | 原 tsconfig 产品源码检查，stdout/stderr 空 | [summary](ai-terminal-independent-retest-20261022-r1-evidence/noemit.summary.json) |
| history-review 首次/同字节留证复现 | 1 / 1 | 审查器误认 JSON 含完整 diff，非产品失败 | [复现命令](ai-terminal-independent-retest-20261022-r1-evidence/history-review-facility-replay.command.json) |
| history-review 第二版 | 1 | 未消除 ANSI 着色，源码字符串比较设施误断言 | [原失败命令](ai-terminal-independent-retest-20261022-r1-evidence/history-review.command.json) |
| history-review 最终 | 0 | 16 次开发执行原件、757 保护和 13 越界原件核实 | [结果](ai-terminal-independent-retest-20261022-r1-evidence/history-review.json) |
| close | 0 | 最终保护全绿，六组测试 PID 全部退出，released/stop=true | [close](ai-terminal-independent-retest-20261022-r1-evidence/close.json) |

controls 和 original-red 的 name filter 互补，10/8 pending 不计 PASS。开发 43 和 affected 175 无跳过才算本合同通过；不能将 DOM 自动化称为真实 GUI。

必要红的[实际返回与候选调用原件](ai-terminal-independent-retest-20261022-r1-evidence/original-red.observations.ndjson)确认：N01/N09 一般失败不再报正常空正文；N02 部分计划不返回，first→second 后仅返回 HEALTHY_ONLY；N03–N06 的 AUTH/RATE_LIMIT/CONTEXT/QUOTA 分型且仅调用 first；N07 全候选 TIMEOUT 最终中文超时；N08-empty/partial 均 ABORTED、仅 first、不返回正文。

## 窄源码审查

源码只审交回增量与现有调用接缝，不改产品或扩大需求：

1. `ai-client.ts:117–124` 在读取 blocks 之前判断真正 `assembler.finish`。真实 assembler 在失败后保留部分正文，不意味着成功；此修复把可解析部分计划也拒掉。原用例的 C08 仍用生产 parser/validator 验合法计划，不把合法文本伪装乱码。
2. `:140–181` 将 AUTH、CONTEXT_WINDOW_EXCEEDED、QUOTA 映射到既有内部稳定别名；RATE_LIMIT 保留，ABORTED 加入停链。aborted finish 优先取消，不受其携带其他码覆盖。凭据、限流、容量与取消不会继续下一候选。
3. `:176–188,202–215` 结构化 TIMEOUT 保留中文超时；PI_AI_ERROR/UNKNOWN 等一般失败不伪 EMPTY，允许有界候选兜底但绝不返回其部分正文。EMPTY_RESPONSE 和正常空 stop 沿原空结果语义重试，正常正文原样返回。
4. 原 prepareCall controls、配置透传、候选去重/high-off、稳定 system/user 和 120000ms 参数保持。直接无稳定码 TimeoutError/AbortError 保持既有兼容，不等于已实测 UI 取消或真实墙钟超时。
5. 原 8/10 运行 `pi toStreamChunks → LlmRuntime → BlockAssembler → generateDraft`；开发新测试只提供合法 adapter chunk/throw/prepare 输入，真实 runtime 和 assembler 执行。没有 mock finish、正文组装、错误归类或 parser。新测试的 spy 仅观察 timeout 参数；旧 legacy mock 只用于既有兼容控制，不用作生产协议证明。

`legacy-source` 只把旧脚本的 import 从 `../lib/core/ai-client.js` 改为自有冻结 TS 源，断言完全不变，另存 adapter 原件，原脚本不写。原脚本不含合法 index/terminal finish 的盲区保留；该兼容结果不能证明终止处理。`noEmit` 采用原 tsconfig，其 exclude 排除 tests，**不宣称全测试 TypeScript 严格类型检查**。

## 原失败与设施历史

必须分别保留以下事实，不用修后绿改写修前红：

- 原独立 r2：8 控制绿，10 必要红全红，原必要红命令退出 1。
- 开发 red：8 控制绿，10 必要红全红；testred 新 43 为 **3 绿 / 40 红，退出 1**。
- 开发首修：**42 绿 / 1 失败，退出 1**。失败原件显示两次 `createUserMessage` 随机 UUID 不同；后续只排除不应一致的 message id，仍核两次完整 system、user content、role/source、候选/high-off/maxTokens 和 120000ms。原失败及测试字节不覆盖。
- 开发 r2：各产品断言虽绿，affected 执行器缺 PM_GOVERNANCE_TMP，原用例落 `/private/tmp`。13 个可定位设施越界根原样保留，**不是完整自有输出通过，也不称整个开发批次零污染**；13 不代表全盘穷尽归因。
- 开发 r3：设自有 PM_GOVERNANCE_TMP，全部指定命令重跑绿，仅开发自验。本轮另独立冻结并执行，不将 r3 重跑倒写成 r2 合法。

历史逐项 JSON/日志/命令/测试字节及设施回填已由本轮 [history-review](ai-terminal-independent-retest-20261022-r1-evidence/history-review.json) 核查。开发 16 次执行的实际 command.originalExit、summary 与 JSON 逐项相符；原保护 757 与本轮开始逐对象匹配，原独立 r2 红仍在。13 个可定位外部 observations 字节/hash 与 facility-followup 相同，未删除、移动或覆盖。

本轮历史审查器首次误认 JSON failureMessages 含 diff，首次 exit 1；同字节封存复现 exit 1。第二版改读 stderr 后未去 ANSI，字符串匹配又 exit 1；最后采用 Node 标准 `stripVTControlCharacters` 仅为断言读视图去色，原 stderr 不改，最终 exit 0。两版审查器源码、复现及第二版 command/stdout/stderr 原件均在本轮 evidence。**这三次设施失败不算产品红，也不洗成全命令零失败**；未为此重跑、修改产品测试。

## 保护、并行与交接

继承原 757 个保护对象，独立扩至 910 个列明对象，含开发交回、各轮原失败/命令/测试字节、原 cases 和封包、主 lib/旧 U4r2 lib、已冻结生产协议和依赖。每组前后及最终 close 零漂移。所用冻结及依赖是硬保护；主树全输入和其他 testing 顶层增删仅观察登记，不把合法 J03 新 testing 或后继源码误判污染，不锁其合法写面。

2026-10-22T11:31:18.891Z close：controls 48338、original-red 48510、new 48678、affected 48766、legacy-source 48872、noemit 49034 全部退出，`released=true / stop=true`。自有 tmp 内有 13 个治理用例输出根；共享 governance 根前后无变化。其他 testing 新增的 J03 audit 两件及报告一件明确登记为合法并行，不计污染。所谓零漂移仅限列明对象和专门共享 governance 根，不等全盘零写；没有读取正式 data、credentials、全磁盘或 live 服务。

交付入口：[结构化结论](ai-terminal-independent-retest-20261022-r1-delivery.json)、[本前缀全部文件指纹索引](ai-terminal-independent-retest-20261022-r1-index.json)、[冻结/顺序执行/close 父进程与审查器退出凭证](ai-terminal-independent-retest-20261022-r1-evidence/execution-receipts.json)。索引包括自有完整冻结、依赖、全部验证原件及设施失败，不覆盖或挪走旧失败证据；索引不含自身，防止循环哈希。

下一 owner：Main 在 AI 与 Cycle 各自独立 SOURCE/AUTO 结果齐备、最新产品输入统一认领后，作为唯一 builder 构建隔离输出并采原合同 GUI13 所需修后证据；独立 GUI 专家审证，不能以此报告替代。原 gateway 认证/限流/部分失败/取消/正常恢复、busy、零业务写、完整用户旅程与真实模型条件另验。J03 缺陷由其另前缀专家和开发处理，本轮不签。

**STOP：不 push/tag/release，不普通 commit，不启动、停止、探测或替换服务。** SOURCE/AUTO 有限结论不代表 RA-AI06、全部余项或发布总门；旧运行实例未加载 106 的边界保留。
