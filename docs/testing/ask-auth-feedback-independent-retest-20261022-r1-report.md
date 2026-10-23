# 副驾鉴权修复独立 SOURCE/AUTO 复验 r1

> 2026-10-22，trae，AskAuthRetestR1；不同于 AskAuthDevR1 的独立专家，非开发、非 GUI。只签精确冻结候选的 SOURCE/AUTO 子集，不签 GUI、RA-AI06 整项、父 goal 或 commit；release STOP。

## 结论

**PASS_LIMITED_SOURCE_AUTO：ASK-AUTH-01 在本轮 SOURCE/AUTO 范围关闭。**

窄源码审查未发现该单行增量的新阻断。独立执行原11项与受影响12文件199项，合计**13文件210项、0失败、0跳过**；`tsc --noEmit`退出0。close退出0，30个列明保护对象及全部冻结源/配置/上游/依赖无漂移，四个自有子进程均已退出，released/stop=true。

原先行8绿3红及其真实exit1保留；原AI client有限SOURCE/AUTO PASS保留，不撤ATF其他控制。此次不是转述开发210绿，不代表新GUI、整个反馈系统或父总门通过。原TaskTable React key warning仍在，未修改/豁免其其他归属门。

## 授权与身份

本角色原句、原合同、写面和停止条件见[计划](ask-auth-feedback-independent-retest-20261022-r1-plan.md)。依据AGENTS、collaboration §9/§11及本次明确授权，仅写本前缀和自有 `reports/all-pending-evidence-20261021/AskAuthRetestR1/`。不写业务、原tests/oracle、他人testing/living docs，不操作共享lib、Git写、build/install、服务、浏览器、凭据、vendor、正式data或实时上游。

[candidate](../../reports/all-pending-evidence-20261021/AskAuthRetestR1/candidate.json) 与 [frozen-before](../../reports/all-pending-evidence-20261021/AskAuthRetestR1/frozen-before.json) 绑定实际输入：

| 字段 | 精确对象 |
| --- | --- |
| 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，只读开发交付/父107原件；不是dirty候选身份 |
| 独立冻结 | `reports/all-pending-evidence-20261021/AskAuthRetestR1/frozen/` |
| 输入子集 | 完整当前src **402文件** + package.json/pnpm-lock.yaml/tsconfig.json/vitest.config.ts/cordis.patch.yml **5文件 = 407** |
| 包版本 | 0.7.4，仅源清单口径，不代表新发布或运行版本 |
| 冻结输入清单SHA256 | `c673d9a0a55ab4107a145adb70cc55d6b0e83ff4df5007e72be3c8a78681150a` |
| 独立配置SHA256 | `ff75eef086984a6f9dd7277dbd32291abdc842283b500568a3fdb649dc92ed19` |
| 实际执行 | 原11 + 指定12文件199，完整argv/白名单env见各command.json |
| 运行实例 | 本角色不认领实例；3260仍旧107的派单边界保留，未访问、不冒新源装载 |

完整逐文件清单为[source-files](../../reports/all-pending-evidence-20261021/AskAuthRetestR1/source-files.json)。此407是本SOURCE/AUTO输入子集，不含scripts/lib/locale全包，不宣称完整113变更声明、整包构建或完整回归。父107 tracked diff/原新增清单只作基线沿革，其原件SHA绑定在candidate；不能当完整src清单。

对父107冻结src实际398文件作只读对账，本轮402多4个测试：`client/task-predecessor-hidden-submit-dom.test.tsx`、`client/task-predecessor-refs-dom.test.tsx`、`commands/ask-auth-feedback.test.ts`、`core/report-export-excerpts.test.ts`。各归原owner，只消费ask-auth原11；其余三项不执行、不改写、不计本门。已有产品差异仅panel.tsx/ask.ts/progress-report-markdown.ts；相对开发已释放冻结，则**只有panel.tsx字节不同**，明确是合法并行输入。本轮冻结后到close主源无新差异；不锁全主、不签rendererR2/panel独立门。

## 窄 SOURCE 审查

独立核先行原ask全文，仅允许指定条件替换；冻结与主树、开发修后字节一致。独立 `/usr/bin/diff -u` 的原exit **1**及完整patch保留，与开发ask.patch全文相等：

```diff
-    if (error instanceof AiDraftError && (error.message === 'PROD_KEY_MISSING' || /Key|密钥/.test(error.message))) {
+    if (error instanceof AiDraftError && (error.code === 'MISSING_CREDENTIAL' || error.message === 'PROD_KEY_MISSING')) {
```

| 对象 | SHA256 |
| --- | --- |
| 原ask（34,928字节） | `3db897be1275cbbc2473f73e8eb71bb061365a2ddd882008b33698972905bf26` |
| 修后ask（34,931字节） | `084efb5b33e7cda7368b87c4708f87f460d28588f3e7476cadfad2de0fd35884` |
| 精确ask.patch | `e606aaf43be5eb03fbea8b34a052c2ca70b4b11f8d0ad42662589a99489dca83` |
| 未改原ask-auth测试 | `26ad8a8e72afd266d756a23dd36db7841a07d9f03050374d9158557a5dfaed29` |
| 未改AI client | `b0348f33a6a38202147819d9d8128f12c46f024fde08cb94258508faefcd0448` |
| 未改model-route | `493073e180c2d8e883e1c1347384cc6cb210624bae1b32187a0c5dfbd01ccac9` |

实际接缝为[ask.ts:126–129](../../packages/dsh-pm-tool/src/commands/ask.ts#L126-L129)。删除消息宽匹配后，AUTH归一中文仍含“API Key”也不会进入缺码分支；`INVALID_CREDENTIAL`走原中文兜底。真正`MISSING_CREDENTIAL`精确code及原`PROD_KEY_MISSING`精确兼容哨兵保留。成功then路径不变，没有全schema、handler、AI client或模型路由改动。本专家没有产品修改。

原哨兵兼容与“健康正文含Key不改成功”按全文相等/分支结构保留，**不冒新增动态用例**。缺码、AUTH/INVALID、429与正常正文的动态证明来自以下真实原11。

## AUTO 与实际返回

原11使用合法prod路由、生产addProject/addTask、Storage/JsonStorageBackend/DomainFacility/openPmDomain建真实JSON。Adapter仅提供合法pi事件或真实LlmError；未mock生成、prepareCall、classifier、assembler或命令返回。链路为：

`handleAskCommand → generateDraft → LlmRuntime.prepareCall/stream → 原生产pi toStreamChunks → 原BlockAssembler → 原AiDraftError → ask catch`。

[original11.observations](../../reports/all-pending-evidence-20261021/AskAuthRetestR1/original11.observations.ndjson) 与 [独立逐例核对](../../reports/all-pending-evidence-20261021/AskAuthRetestR1/observations-review.json)：

- R-auth401/R-auth403真实terminal为AUTH，command为“副驾暂不可用：模型 ark-plan/deepseek-v4-1-flash-260910 凭据无效或已失效，请检查 API Key。”，不含PROD_KEY_MISSING/未检测到/凭据缺失。
- R-invalid由真实resolveModel抛INVALID_CREDENTIAL，经生产prepare拒绝，零stream；同样保上述中文无效原因。
- C-MISSING/C-ASK-MISSING为真实MISSING_CREDENTIAL，零stream，后者给原缺失配置指引；不是设置dummy Key或沿Main旧误诊改gate。
- C-RATE/C-ASK-RATE保RATE_LIMIT与中文“模型服务限流，请稍后再试。”；正常client/command原文成功。
- 11例全领域表/真实JSON文件SHA前后及恢复后相等；首尝试仅一个候选，硬故障不换池，同runtime后续真实command健康恢复，均dispose。不是付费模型或真实网络请求实测。

受影响结果逐条来自[affected.result](../../reports/all-pending-evidence-20261021/AskAuthRetestR1/affected.result.json)，无filter/skip：

| `packages/dsh-pm-tool/src/` 下文件 | 实际通过项数 |
| --- | --- |
| commands/ask-governance.test.ts | 13 |
| core/ai-client-terminal.test.ts | 43 |
| core/ask-context.test.ts | 4 |
| core/ask-copilot-b7.test.ts | 4 |
| core/ask-projection.test.ts | 11 |
| core/copilot-task-fields.test.ts | 6 |
| core/copilot-validate.test.ts | 11 |
| core/ui-feedback.test.ts | 32 |
| client/shared/drawers/copilot-preconfirm.test.tsx | 20 |
| client/copilot-extension-baseline.test.tsx | 23 |
| client/index-command-feedback.test.tsx | 9 |
| client/panel-transport-error-feedback.test.tsx | 23 |
| 合计12文件 | **199** |

范围包含既有治理/零写、终止分型/候选控制、上下文与白名单、预确认/基线、命令反馈接收和传输失败；不是无意义重跑或沿旧绿签新源。DOM和React renderer用例仅算AUTO，不替真实GUI/样式/UX。`tsc`采用原配置exclude排除tests，不宣称全部测试严格类型检查。

## 命令与退出

运行环境macOS，nvm Node **v22.23.3**、Vitest **2.1.9**、TypeScript **5.9.3**、Cordis **4.0.5-alpha.1**、dsh-llm **0.2.1-alpha.2**、pi-ai **1.0.2**。普通复制原pnpm **11.28.5**已释放依赖成果；本次无pnpm/install/build。依赖14,394文件/1,031内部软链，外链0、共享inode0。

仓库根复现命令（每轮exclusive-create，重验须另新前缀，不能覆写本原件）：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-runner.mjs freeze
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-runner.mjs test original11
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-runner.mjs test affected
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-runner.mjs type
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-runner.mjs close
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-seal.mjs 36c7ae601627d84eac81a5e85c2f68d6 ff99a883025aab2998878763ed73ae52 fdcb540b1f437a5dd8c75e23ae3507a7 5d3420da96f5e1ff8403d21d0a0a77c5 dbd547340c55aa0e88abc092f7ed32d6
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-finalize.mjs 4d3f58ff4f6229448d444fc80b97e116
```

| 命令 | 真实退出码 | 原件/覆盖 |
| --- | --- | --- |
| freeze | 0 | candidate/407输入/依赖/原件保护 |
| 独立diff | **1** | patch.command/stdout/ask.patch，精确+1/-1，非测试失败 |
| test original11 | 0 | original11.command/result/summary/stdout/stderr/observations，11/0/0 |
| test affected | 0 | affected.command/result/summary/stdout/stderr，199/0/0 |
| type | 0 | type.command/summary/stdout/stderr，原tsconfig --noEmit、输出空 |
| close | 0 | close/owned-runtime-roots/evidence-index，保护与进程退出；不是额外测试 |
| seal | 0 | 五工具真实退出0/0/0/0/0，工具父进程全部退出；初始交付索引 |

各命令保存实际argv/cwd/白名单env/start/end/PID/signal/原exit；工具父执行收据另存[execution-receipts](../../reports/all-pending-evidence-20261021/AskAuthRetestR1/execution-receipts.json)，不混测试PID。初始[delivery-index](../../reports/all-pending-evidence-20261021/AskAuthRetestR1/delivery-index.json)保存seal前计划状态；最终[final-index](../../reports/all-pending-evidence-20261021/AskAuthRetestR1/final-index.json)另绑定完成态计划和seal实际退出收据，二者均不自含自身或当次归档工具收据。finalize只读seal工具exit0/父PID退出并生成最终索引，其工具返回另实时核实；seal/finalize归档不构成额外产品PASS。

原先行控制exit0/必要红exit1、开发自测与旧ATF失败夹具/原件未覆盖删除。此次 `affected.stderr.log` 明确保留TaskTable child key warning及栈。准备时rg缺失exit127、memory路径缺失exit1、定位临时目录遇权限exit1保留为工具准备事实，不是产品红；未据此修改或重跑洗掉测试。

## 保护与后继

[close](../../reports/all-pending-evidence-20261021/AskAuthRetestR1/close.json) 时间 `2026-10-22T13:18:26.781Z`：patch PID81305/原11 PID82319/affected PID83244/type PID84503均已退出；30个列明保护对象、407冻结输入、上游原样副本、独占依赖全程无漂移。主ask仍匹配候选，其他并行主源只观察，freeze→close无新增变化。保护含原RED整轮/原docs、开发交付整轮、旧ATF失败夹具、本影响sources/tests；**不触碰或锁共享lib、不声称全盘零污染**。11个ask及13个治理fixture根全部在自有tmp，保留不删除。

后继Main：汇合所有在途独立门后唯一新候选build/完整回归，绑定新产物与3260实例/开关，按原RA-AI06采401/403/真正缺码/429/正常恢复/零业务写/busy等修后GUI证据，交不同GUI专家。任何相关源或运行输入变化按影响范围重验；不能用旧107、旧GUI、SOURCE存在或本AUTO绿替代新加载与完整旅程。rendererR2/paneldev合法继续，本报告不代签其门。

**本角色released/STOP；GUI NOT_RUN_THIS_ROLE，RA-AI06整项/父goal NOT_SIGNED，普通commit MAIN_ONLY，release STOP。** 不push/tag/发布/切正式，不执行父commit；父全部逐域总出口齐后普通commit仍由Main处理。
