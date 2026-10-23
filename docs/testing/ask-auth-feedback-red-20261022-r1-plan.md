# 副驾鉴权反馈先行合同与 RED 计划

> 记录给 Main、修复开发和独立复验专家的窄化合同；本角色仅先行测试，非开发、非 GUI。2026-10-22，平台 trae。

## 授权与范围

负责人原句：“父授权持续多角色/确证修复/全部验完最后普通commit，无push/tag/services。你独立先行测试非开发非GUI。”

本子任务原句：“唯一test packages/dsh-pm-tool/src/commands/ask-auth-feedback.test.ts；唯一docs/testing/ask-auth-feedback-red-20261022-r1*及自有AskAuthRedR1”；“自有config/tmp/cache依赖，不build/install/GUI/服务/Git/key/正式data/vendor，原src/test oracle不覆，所有exit/bind/保护保”；“最后给必要RED/最小commands/ask.ts修改建议，与AIclientSOURCE PASS分层不撤整ATF其他控制，不签总门，releaseSTOP”。

权威依据为 AGENTS、collaboration §9、§11 与 onboarding 的当前持续任务、`reports/all-pending-acceptance-execution-20261021.md`。父普通 commit 是全部验完后的 Main 动作，不移交给本角色。一般 fetch/pull、install/build、全 verify 与 living docs 同步由本次明确写面限制收窄。本轮仅开工只读 status，之后不执行 Git。不读真实密钥，不设 dummy Key，不访问任何服务，不碰正式 data/vendor。

允许写面：

- 唯一新测试：`packages/dsh-pm-tool/src/commands/ask-auth-feedback.test.ts`。
- 本前缀的新计划、执行器、报告及交接文件。
- `reports/all-pending-evidence-20261021/AskAuthRedR1/`：独占冻结源/旧依赖普通副本/上游生产 pi 映射副本/config/tmp/cache/home/命令/原结果/指纹。已存在原件一律 exclusive-create，不覆盖失败。

Main 唯一 build，主 renderer 后继 108 与 taskpred DOM test 等在途合法。不锁全主树或共享 lib；仅认领本轮消费的生产接缝和冻结字节，观察并记录其他源变化，不据此判污染。

## 合同与证据分层

- 继承原 `remaining-governance-cases-20261021.md` RA-AI06 的中文降级/诊断、故障零业务写、无假成功及正常后续请求，不新增返回格式或产品接口。
- Main `CombinedGuiR1/gateway-requests.ndjson` seq1/2 实际 auth401、32/34 命令/UI 为 PROD_KEY_MISSING 是派单事实；本轮只读核相关原件，不操作 GUI、不倒证 live 服务健康。原“gate missing”误诊已纠正，不沿此误诊加 Key 或改模型路由。
- 原 `ai-terminal-independent-retest-20261022-r1-report.md` 的 AI client 有限 SOURCE/AUTO PASS 保留。该报告未签命令层反馈或 GUI，本轮新红不撤销其 ATF-01/02/03 既有控制结论，也不升格其范围。
- 生产 `commands/ask.ts` 必须显示真实 AUTH 的中文凭据无效/失效诊断，不能根据出现 “API Key” 把它改成“未检测到”。真正 MISSING_CREDENTIAL 仍应给缺凭据配置指引；限流仍中文限流；健康结果原文返回。

## 用例

| 组 | 输入与执行点 | 预期 |
| --- | --- | --- |
| C-AUTH401 / C-AUTH403 | 合法 pi error 事件，实际生产映射、LlmRuntime、BlockAssembler、generateDraft | INVALID_CREDENTIAL，中文凭据无效/失效；真实 terminal AUTH；只尝试首候选 |
| C-MISSING | adapter resolveModel 抛真实 LlmError(MISSING_CREDENTIAL)，生产 prepareCall | MISSING_CREDENTIAL，中文缺失指引；未 stream，未换候选 |
| C-RATE | 合法 pi 429 error terminal，经全部生产链 | RATE_LIMIT，中文限流；只首候选 |
| C-NORMAL | 合法 pi text + done/stop，经生产链 | 正常正文原样返回 |
| R-AUTH401 / R-AUTH403 | 合法生产 prod 路由、真实 JSON 领域，经 handleAskCommand 调生产 generateDraft 和以上 terminal 链 | error 文本中文无效/失效，不含 PROD_KEY_MISSING/未检测到；随后同 runtime 正常请求恢复 |
| R-PREPARE-AUTH | resolveModel 抛真实 LlmError(INVALID_CREDENTIAL)，同 handleAskCommand 链 | 同上，首请求未 stream，不换候选；随后正常恢复 |
| C-ASK-MISSING / C-ASK-RATE / C-ASK-NORMAL | 同真实 handleAskCommand 路径，缺失/429/健康 | 缺失配置指引、中文限流、原文成功分别正确；失败后健康请求 |

控制组与必要红分开执行，共 8 控制与 3 必要红；name filter 排除的 pending 不计通过。唯一脚本 adapter 提供合法 pi 事件/真实 LlmError，不 mock generateDraft、prepareCall、assembler、错误分类器或命令结果。不把自编中文 AiDraftError 当生产证明。

真实领域通过 Storage + JsonStorageBackend + DomainFacility + openPmDomain 创建合法项目/任务并 setModelMode(prod)，不继承密钥环境。各次调用前后记录全部领域表快照与真实 JSON 文件 SHA256，要求零业务变；文本诊断断言失败前也须先完成零写/调用链/恢复断言，并保存实际结果。

## 顺序与停止条件

1. 计划先落盘，新增唯一测试，不改原 src/tests/oracle。
2. 冻结完整当前 src 与配置，认领 baseline + source 指纹及原件；只读保存 ask.ts 相对既有 ATF 冻结的 diff。普通复制已释放旧 ATF 依赖，上游 stream/replay/schema 原样复用。外部链接或共享 inode 非零即设施 BLOCKED，先不跑测试。
3. 使用自有配置、白名单 env、singleFork、no-cache，仅指定新测试。独立保存控制与必要红 argv/cwd/env/PID/start/end/真实 exit/stdout/stderr/JSON/实际 observations；控制 exit0，必要红预期 exit1，不能洗成0。
4. 核完整冻结输入、依赖、原 cases/oracle/ATF旧失败/既有相关GUI原件保护；主源在途只观察，不锁 lib，不作全盘零污染声明。核已使用全部子进程退出，封指纹索引和 released/stop。
5. 只报告必要 RED 与最小 ask.ts 修改建议，交不同开发角色。修后由另一独立专家复验，再由 Main 唯一构建、采原 RA-AI06 GUI 证据；本角色不修复、不签修后门或总门。

运行环境：macOS + nvm Node 22，旧依赖来自 pnpm 11.28.5 安装成果，本次不运行 pnpm 或安装。

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/ask-auth-feedback-red-20261022-r1-runner.mjs freeze
node docs/testing/ask-auth-feedback-red-20261022-r1-runner.mjs test controls
node docs/testing/ask-auth-feedback-red-20261022-r1-runner.mjs test red
node docs/testing/ask-auth-feedback-red-20261022-r1-runner.mjs close
```

**停止：本轮 RED 交回后停止本角色，不普通 commit，不 push/tag/release，不启动、停止、探测或替换服务。父总目标仍由 Main 持续；release STOP。**
