# 副驾鉴权反馈独立必要 RED r1

> 供 Main、修复开发与不同独立复验专家接续：只签本轮真实生产命令链的必要 RED，不签修后、GUI、RA-AI06 整项或父总门。2026-10-22，平台 trae；角色独立先行测试，非开发、非 GUI。

## 结论

**FAIL_NECESSARY_RED_CONFIRMED：ASK-AUTH-01 成立。**

8 控制全绿，3 必要红全红，真实测试退出码分别 **0 / 1**。三条失败均发生在新测试第 228 行“应显示中文凭据无效/失效”的断言，而非加载、夹具、存储、换池或恢复断言。401/403 和 prepare INVALID_CREDENTIAL 实际都返回 `PROD_KEY_MISSING：未检测到…`，吞掉生产客户端已归一的真实鉴权原因。

唯一新增测试：[ask-auth-feedback.test.ts](../../packages/dsh-pm-tool/src/commands/ask-auth-feedback.test.ts)。本轮未改产品、原测试或 oracle，未修复后自验。先行合同：[plan](ask-auth-feedback-red-20261022-r1-plan.md)。全部自有原件位于 `reports/all-pending-evidence-20261021/AskAuthRedR1/`，不覆盖旧 ATF、CombinedGuiR1 或其他 Agent 产物。

## 身份与保护

- 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 来自只读 Main `CombinedRepairR1/r2/candidate.json`，不是 dirty 候选身份。原107声明/515输入仅作父参考，不冒当前完整108或运行身份。
- 本轮冻结当前完整 `src` **401 文件**及5项配置/依赖清单，全部逐文件 SHA256 在 [source-files](../../reports/all-pending-evidence-20261021/AskAuthRedR1/source-files.json)、[frozen-before](../../reports/all-pending-evidence-20261021/AskAuthRedR1/frozen-before.json)。不冻结/构建/锁共享 lib，不限制 renderer、taskpred DOM 或其他合法在途。
- 实际 `ask.ts` SHA256 `3db897be1275cbbc2473f73e8eb71bb061365a2ddd882008b33698972905bf26`，与旧 ATF 冻结原样相同；只读 `diff -u` 退出0，[diff/command](../../reports/all-pending-evidence-20261021/AskAuthRedR1/ask-relative-to-atf.command.json) 保留。`ai-client.ts` SHA256 `b0348f33a6a38202147819d9d8128f12c46f024fde08cb94258508faefcd0448`，与独立 ATF SOURCE/AUTO PASS 对象一致。
- 新测试 SHA256 `26ad8a8e72afd266d756a23dd36db7841a07d9f03050374d9158557a5dfaed29`；主树新测试与冻结副本全程未改。
- 旧 ATF 已释放依赖普通独占复制：**14,394 文件 / 1,031 内部软链 / 外链0 / 共享 inode0**。原样复制旧 pi stream/replay 与 llm schema 来源，不自编错误分类器。
- freeze、两组测试前后和 close 核30个列明保护对象、完整冻结源/配置、上游副本及依赖，均无漂移。包括原 ATF 8/10 的失败日志、结果、命令、observations、cases、原 client terminal 与 ask governance oracle。主源后继仅观察登记，本次 close 无源变化；不声称全主树锁定或全盘零污染。
- 白名单环境全落自有 HOME/TMP/cache/DSH_HOME/资料/备份/导出根，不继承 Key 或 E2E，不设 dummy Key，不读正式 data/vendor。仅开工只读 `git status`，无后续 Git 命令、commit、push/tag 或服务操作。

## 真正执行的链路

合法项目/任务由生产 addProject/addTask 创建，Storage + JsonStorageBackend + DomainFacility + openPmDomain 提供真实 JSON 领域；生产 setModelMode(prod) 持久化车道，不由环境 Key 开 gate。Adapter 注册到真实 LlmRuntime 的 `ark-plan` 通道，不替换 prepareCall。

`handleAskCommand → generateDraft → LlmRuntime.prepareCall/stream → 原生产 pi toStreamChunks → 原 BlockAssembler → 生产 AiDraftError → ask catch`。

确定性 adapter 只提供合法 pi start/error/done/text 事件或抛真实 LlmError；401/403 的终止码 **由上游生产映射产生 AUTH**，429 产生 RATE_LIMIT。不是 `new AiDraftError(...自编中文...)` stub，不是重跑旧18项协议测试，也不是付费模型网络实测。

11 个实际用例分别记录初态、project/task ID、完整领域表、实际 JSON 文件路径/内容 SHA、生产返回、真实候选调用、terminal 与同 runtime 后续请求。所有调用前后及恢复后业务表/磁盘文件相同；首尝试仅一个生产候选，硬失败不换池；缺失/prepare拒绝未 stream。每例都在独立 finally 关闭领域、dispose runtime，原 observations 保留。

## 结果

| 用例 | 实际结果 |
| --- | --- |
| C-auth401 / C-auth403 | 生产 client 为 INVALID_CREDENTIAL：“模型 ark-plan/deepseek-v4-1-flash-260910 凭据无效或已失效，请检查 API Key。”；terminal AUTH，控制绿 |
| C-MISSING | prepare MISSING_CREDENTIAL，生产 client 中文“生产模型凭据缺失…”；零 stream，控制绿 |
| C-RATE / C-NORMAL | RATE_LIMIT 中文限流 / 健康正文原样返回，控制绿 |
| C-ASK-MISSING | 实际 command 保真正缺凭据配置指引，控制绿 |
| C-ASK-RATE / C-ASK-NORMAL | command 为“副驾暂不可用：模型服务限流，请稍后再试。” / 原文 success，控制绿 |
| R-auth401 / R-auth403 | 实际 terminal AUTH、只一次 prepare/stream；command 却为 PROD_KEY_MISSING，必要红 |
| R-invalid | 真实 resolveModel 抛 INVALID_CREDENTIAL、生产 prepare拒绝、零 stream；command 同样错误重写，必要红 |

每组互斥 name filter：控制的3 skipped是另组必要红，必要红的8 skipped是控制，不计为通过。合计唯一测试文件11个用例，8绿3红，不累计为18或236。

运行环境：macOS，nvm Node **v22.23.3**，Vitest **2.1.9**，Cordis **4.0.5-alpha.1**，dsh-llm **0.2.1-alpha.2**，pi-ai **1.0.2**；沿旧 pnpm **11.28.5** 依赖成果，本轮不执行 pnpm/install/build。

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/ask-auth-feedback-red-20261022-r1-runner.mjs freeze
node docs/testing/ask-auth-feedback-red-20261022-r1-runner.mjs test controls
node docs/testing/ask-auth-feedback-red-20261022-r1-runner.mjs test red
node docs/testing/ask-auth-feedback-red-20261022-r1-runner.mjs close
```

| 命令 | 真实退出码 | 证据 |
| --- | --- | --- |
| freeze | 0 | [candidate](../../reports/all-pending-evidence-20261021/AskAuthRedR1/candidate.json)、freeze-check、完整输入/依赖指纹 |
| ask 对旧 ATF diff | 0 | 原命令与空 diff；未修改原 source |
| test controls | 0 | [controls.summary](../../reports/all-pending-evidence-20261021/AskAuthRedR1/controls.summary.json)，8/0/3，实际 argv/PID/env/stdout/stderr/result/observations |
| test red | **1** | [red.summary](../../reports/all-pending-evidence-20261021/AskAuthRedR1/red.summary.json)，0/3/8，同样完整原件；失败未覆盖或重跑洗绿 |
| close | 0 | [close](../../reports/all-pending-evidence-20261021/AskAuthRedR1/close.json)，保护全绿、diff/两测试 PID 已退出、released/stop=true；0仅表示封存成功，不表示产品通过 |

freeze/controls/red/close 的 shell 工具原退出码亦已回读为0/0/1/0。测试 PID **68608 / 69167**，close 核对应进程均退出；这两个数字已在封存前以 close/command 原件回读纠正，不沿报告草稿值。精确 PID 以各 command.json 为权威，不借 ps 结果判服务状态。封存程序另核工具父进程退出并保 execution receipt，不终止任何进程。

## 原证与最小修复建议

只读 Main seq1/2 的 `fixture.behavior=auth`，现有 executor gateway 的 auth 分支返回401；32/34 两条 commands/execute 网络请求和匹配 RPC 返回都明确含 PROD_KEY_MISSING。这与本轮独立命令 RED 相互支持，不能再归因“缺环境 Key / gate 未接线”。该引用不等本角色新增 GUI 执行或目视审签；原 Main 误诊更正及 restart r2 事实保留，不重启、不加 Key。

缺陷定位：`commands/ask.ts:126–128` 按 `/Key|密钥/` 扫消息；生产 INVALID_CREDENTIAL 的“API Key”正好命中，错进真正缺凭据分支。

**仅建议不同开发角色改 ask.ts 该条件**：

```ts
if (error instanceof AiDraftError
  && (error.code === 'MISSING_CREDENTIAL' || error.message === 'PROD_KEY_MISSING')) {
  return { kind: 'error' as const, text: PROD_KEY_MISSING_TEXT }
}
```

删除模糊消息正则，保原缺失精确哨兵及 MISSING_CREDENTIAL 控制；INVALID_CREDENTIAL 沿既有“副驾暂不可用：…”中文兜底。无需改 ai-client、模型路由、renderer、原 ATF oracle 或返回格式。这里不是业务修改，也未对尚未发生的修复给 PASS。

下一 owner：Main 派不同开发角色修此单接缝，随后另一独立 SOURCE/AUTO 专家复验本11项与必要受影响范围；Main 唯一统一构建并按原 RA-AI06 采修后 auth/rate/正常恢复、零业务写、busy 等 GUI 原证，再交 GUI 专家。其余已授权余项可继续，不因本轮新红撤销整个旧 ATF 控制。

**原 AI client 有限 SOURCE/AUTO PASS 保留；本轮命令反馈 FAIL；GUI/RA-AI06 整项/父总门 NOT_SIGNED；release STOP。** 本角色已释放测试资源，只交必要红，不普通 commit，不 push/tag/release，不 services；父授权的“全部验完最后普通 commit”仍由 Main 在真正闭门后处理。
