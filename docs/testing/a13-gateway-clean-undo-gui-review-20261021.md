# A13 Gateway 取消与 Clean 三步撤销独立限定审证

> 给 Main 和后续独立专家按原合同接续。平台 trae，角色为独立测试专家；本地日期 2026-10-22，文件名沿父批次 20261021。只审既有实采，不操作产品、GUI、build/install、服务、凭据或 Git 提交。本文不是全门签字。

## 1. 限定结论

**RA-AI04 的取消零业务写、重新生成三步计划、整批明确确认、clean 逆序撤销有限 GUI PASS。** 实际插件候选是 **A12**；A13 只是采集标签。结论限定到下述原件、隔离初态和采集区间，保留事后装载绑定边界；不能扩大为完整 RA-AI04、GG 全门、当前主树、真实模型或发布 PASS。

| 本次对象 | 独立结论 | 原证与边界 |
| --- | --- | --- |
| 出计划与取消 | 有限 PASS | 原取消前任务/账本与 r2 接续原件一致；两帧由三步计划变“暂无草稿”；首 ask 至取消业务 manifest 不变，取消本身无 command 事件 |
| 重新生成与整批明确确认 | 有限 PASS | 正常 gateway ask 返回三步；真实按钮提交原 actions 与实际 `--base`；生产返回已应用 3 步，两个目标任务实际落盘 |
| 同 t1 两步 clean 逆序与独立 t2 | 有限 PASS，补齐 GG-02 本轮 GUI clean 子路径 | undo 返回逆序 t2/t1/t1 三项；两任务完整 JSON 原始字节回到首步前，包括 updatedAt、材料和修订历史 |
| 新来源与历史保留 | 有限 PASS | 新批次仅两个唯一 task refs，三条 applied postimages；旧账本完整保持，新审计只追加；未测拒步，不签“拒步不入 refs”负例 |
| 首 runner 与取消等待失败 | 设施问题，不据其签 PASS，也不当本路径未恢复的产品 FAIL | 初 runner exit0 时计划尚空；取消后计划容器仍在，错误 hidden 等待 exit1。原失败保留，后续真实原件另证业务成功 |
| 完整 RA-AI04 | **未签，仍 BLOCKED** | 冲突、changed/mixed、逐步确认/撤销、编辑/勾选变化、重复/过期/重启句柄等 GUI 分支未在本包采齐 |

依据：[RA-AI04 原用例](remaining-governance-cases-20261021.md)、[GG 原修复合同 §3](governance-growth-independent-auto-20261021-fix-contract.md#3-gg-02-同目标链式逆序)、[执行与判定分离](../collaboration.md#95-测试执行与判定分离方案-a2026-10-12-增补)、[候选与证据规则](../collaboration.md#十一深度复盘后的执行合同与证据规则adl-0572026-10-21)。旧红、旧有限 SOURCE/AUTO 结论不覆盖、不改写。

## 2. 派单与写入范围

父派单明确“独立限定 RAAI04 取消/clean3stepapplyundo 实采，非全门”；仅写 `docs/testing/a13-gateway-clean-undo-gui-review-20261021` 前缀。Main 是唯一 GUI/builder，用户 goal continue 的最后 commit/no push 权限不转给本专家。

本轮仅新增本前缀报告、只读审证脚本与输入/观察/终核 JSON；不更新共享 changelog/progress/handoff/onboarding，不碰其他测试产物。dirty 并发任务继续保留，未 fetch/pull、build、install、跑产品 verify、访问活服务、启动浏览器或 commit/push。工具侧脚本只读取已声明归档、A12 源码/产物及非密钥原计划字节。

## 3. 实际候选与实例

| 对象 | 冻结认领 |
| --- | --- |
| Git 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不是 dirty 候选的全部身份 |
| A12 tracked patch | `29d9a389ef1f7f178dba50f5cff813672f0ea7c5ebf6dc7ad74aebd38269a596`，原 patch 字节实核相符 |
| 实际包 | `/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool`，512 源输入与 453 产物逐项相符 |
| 隔离运行根 | `/private/tmp/pmtool-a13-gateway-runtime-20261021` |
| 宿主记录 | `3241 / PID 90027`；实际 cwd 是只读上游 `/Users/bytedance/Projects/dsh-pm/deepseek-harness`，相对 `tsx/esm` 启动 |
| Gateway 记录 | `3240 / PID 89884`；现有上游 mock CLI，cwd 为隔离 runtime，`/v1/messages` |
| 宿主源码身份 | A12 manifest 登记 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；本轮未重新检查上游 Git/依赖/进程存活 |
| 模型性质 | 确定性网络 gateway，生产 ask 代码路径；不是真实授权模型质量验收 |

证据：[source-binding](../../reports/all-pending-evidence-20261021/A13/gateway/source-binding.json)、[environment](../../reports/all-pending-evidence-20261021/A13/gateway/environment.json)、[host-start-r2](../../reports/all-pending-evidence-20261021/A13/gateway/host-start-r2.json)、[gateway-start](../../reports/all-pending-evidence-20261021/A13/gateway/gateway-start.json)、[A12 manifest](../../reports/all-pending-evidence-20261021/A12/candidate.json)。

实际启动与[接线探索建议](../../reports/a13-governance-gateway-entry-exploration-20261021.md)不同：宿主使用上游 cwd，环境名列表不是 `env -i` 的完整隔离证明，不能据此断言所有 credentials fallback 均禁用，也不能由“检测到 Key”文字证明用了真实模型。本轮不读取凭据求证；成功的本地 HTTP 请求仅支持本轮模拟链路。

## 4. 合法初态与原失败

标准初态来自 [F6-ui-standard 原备份](governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json)，不是手造 refs。原 [GG 独立复验](governance-fix-independent-retest-20261021-report.md)登记了真实 dispatch、标准包与合法历史；本次重新比对原备份任务和 ledger 与实际初始 JSON 完全一致。`seed/boundary` 的目标业务初始为空，预检/第一确认不写，最终明确确认恢复；文件/备份根在该恢复区间为空。两项目、三任务和各两条里程碑/风险/交付物/会议恢复后，当前项目 p-0001 的两任务存在。

原 [seed 截图/记录](../../reports/all-pending-evidence-20261021/A13/gateway/seed/)显示预检通过与恢复成功。该合法种子支持本次旅程，不再给恢复功能另签全门。

- `ask-three/outer-exit` exit0 时，`plan.json` 仍是“暂无草稿”，command events 仅捕到 ask run，没有其 done。不能视作成功计划；接续 `plan-ready.json/png` 才显示三步，`continued.json` 明确保留早退边界。
- `cancel-apply-undo/outer-exit` exit1：等待 `[data-copilot-plan]` hidden 超过 30s。冻结 A12 的 `sidecar-portal.tsx` L676 在草稿 tab 始终保留容器，L417/L772 取消只清 steps。原两帧确实从三步变“暂无草稿”，events=[]；错误等待不是取消业务失败。
- r2 不补造首轮成功文件，直接从已有取消空态接续；原 t1/t2/ledger 与 r2 initial/cancelled/before-apply 全部原字节相同。零写证据跨失败区间接上，原退出 1 保留。

首 ask 的 `model mode prod` 新增 `aiModelMode` 设置，宿主 session 也可能变化；本报告“出草稿零业务写”排除该设置与宿主会话。取消本身 r2 before/afterCancel 全 data manifest 相等。

## 5. 真实确认与撤销链

原计划 `/private/tmp/pmtool-a13-gateway-runtime-20261021/artifacts/plan.json` 为 880 字节，SHA256 `14ef235d6023c7f9a497b69d7ffafec7515136cd74f85357cfe147fada11a9ea`，与 environment.planSHA 相同。gateway success-text、r2 ask done 中的计划与该文件深相等。

| 步 | 真实目标与动作 | 初值至确认值 |
| --- | --- | --- |
| s1，needs=[] | `task.update t-0001`，status/progress | todo/0 → in_progress/62 |
| s2，needs=[s1] | `task.update t-0001`，assignee | 测试甲 → 治理采证甲；可信中间 postimage 保留 s1 新值 |
| s3，needs=[] | `task.update t-0002`，progress | 35 → 22；无 t1 依赖 |

原 [command-events](../../reports/all-pending-evidence-20261021/A13/gateway/cancel-apply-undo-r2/command-events.json)是 7 个真实 run/done 配对，共 14 事件，返回均 success。按原 seq：

| seq | 真实调用/返回 |
| --- | --- |
| 19/20 | ask p-0001 “治理链式三步再次生成”，返回原 gateway 三步文本 |
| 21/22 | ask-apply：原三 actions；`--base {"t-0001":"2026-10-21T14:07:53.825Z","t-0002":"2026-10-21T14:07:53.835Z"}`，与 before-apply 实盘一致；返回已应用 3 步 |
| 23/24 | ask-undo list，真实新 handle `undo-mvilpwj2-9rj0g6`，不是恢复包的历史 handle |
| 25/26、27/28 | web snapshot 与 ask-provenance p-0001；结果与确认后磁盘和新批次相符 |
| 29/30 | 点击新撤销按钮，ask-undo 同一 handle；返回“已撤销 3 项（tasks/t-0002；tasks/t-0001；tasks/t-0001）” |
| 31/32 | web snapshot，两任务完整对象与撤销后原 JSON 相符 |

本次 handle 在当前进程约 252ms 内撤销，expiry 尚未到；clean 后账本 used=true。未再次撤销、等待 TTL 或重启宿主，不把“一次性/重启失效”提示文字当成这些分支的实测。

### 原始字节

| 任务 | initial/cancelled/before-apply/undone 共用 SHA256 | applied SHA256 |
| --- | --- | --- |
| t-0001 | `93ca4434e08553700c72356bd169f81d4807798d3d55083a46c3b3d02135e6f9` | `1540481df9b12acfc7df6656ec9838157ce379d2d7b8f7f2a2e95b19427c2d30` |
| t-0002 | `15f692d2e17d3a32396ae6686fbfde319adc8f5eae19ad403fe8857c821881da` | `ade858910bed7e347382497a2e95845ac37eb14a2d03f395d504bf4a28ca9869` |

版本 2 的完整 envelope 原字节恢复，非仅比较 progress/assignee。t1 的 description、资料链接、三版进展、两版软删历史在 apply 保留，并随 undo 完整保留。r2 最终与初始相比，13 个业务记录不变；变动仅 `askApplyIdempotency`、`pmProvenanceLedger`、`pmProvenancePending` 三设置，不声称整个 data 最终零写。

新批次 `prv-mvilpwj4-kqvjdo`：refs 是实际 applied 的两个唯一任务，不是三步计成三个来源；三 postimages 对应 t1/t1/t2。旧 `prv-mvi6srwe-mwn8sn` 在 applied/undone 原 ledger 中完整不变；新 refs/history 未覆盖，audit 从 applied 一条追加 undo 一条。ask-provenance 的只读 recheck 投影不当成持久 history 追加。没有拒步样例，不继承 RA-AI05/GG-01 负例或 GG-03 mixed used 结论。

## 6. 页面目视与事后装载边界

原 PNG 目视：seed precheck/restored、ask-three plan-ready、r2 cancelled/regenerated-plan/applied/undone，共 7 张。原 compositor 帧目视：首取消 `000000/000001`；r2 `000000/000006/000012/000013/000014/000015/000016/000017/000018/000022`。r2 000015 显示独立 s3、勾选状态与整批按钮，后继帧显示新撤销按钮及任务状态变化，末帧恢复“暂无草稿”。不以 DOM 文本代替这些可见状态。

全部归档帧哈希核验 113/113：seed 69、首 ask 19、首取消 2、r2 23。**哈希全核不是逐帧全目视**；未目视帧不计视觉通过。观察为深色、1440×718，PNG DPR2；seed 1440×900，事后 reload 1440×900。未采全视口、浅色、缩放、键盘或读屏矩阵。

事后 [loaded-r1](../../reports/all-pending-evidence-20261021/A13/gateway/loaded-r1/result.json) 的真实 reload 才具有完整 uncached 200 下发：

- A12 client.js SHA256 `3bc4a1723f10e8f0393eceb48841007e52e9ebafdc4b37f98dc0a970151bc3b7`。
- combo 原响应 2,581,368 字节，SHA256 `e10bf9b3fd69e2c0a8d744c146362a2e1c235e38a0cb5d6059f74cc692c76cda`；去末尾调试标记后的完整 loader 段 1,702,536 字节，独一匹配，不声称原 client 文件直接等于 combo。
- browserContextKind=default，target/frame `1BBF621A62D3BD5C2F6DA939DFDC7B64`；origin 同 3241，PM mounted。
- 初业务页 timeOrigin=`1792616490570.5`；reload 后为 `1792616867623`，记录时间 `2026-10-21T21:07:51.285Z`，晚于本次 apply/undo。

**不能倒推首业务页已在那个时点完成同样下发。** 本轮按 source-binding、A12 独立源/产物一致、同端口和业务页连续 timeOrigin 对限定业务原件作有限关联继承；初 loaded 时点、首业务页 target/context 的完整记录及同时点网络下发仍缺，完整实例门不关闭。本包也没有 editor 懒加载 chunk 的实际网络响应。

gateway stdout 冻结前缀记录两次真实 `/v1/messages` success/completed，各 108 chunks。它没有时间戳、request body 或调用 ID；不能精确网络请求逐一绑定 commandId，也不证明 B7 实际 prompt 中材料/日志投影或真实模型来源质量。

## 7. 冻结、漂移与未签范围

[inputs](a13-gateway-clean-undo-gui-review-20261021-inputs.json) 初冻 1669 文件；[inputs-r2](a13-gateway-clean-undo-gui-review-20261021-inputs-r2.json)仅补原 plan 文件，合计 1670。初冻主树与 A12 相差 5 个 staging/http 源文件，差异逐项记录，不给未装载新改动背书。

首次机械 review 因 live gateway stdout 追加而退出 1，严格结果保留于本文。独立复核证明初冻 **前 514 字节** SHA256 `4bac8127b5270aa286f07e2708e6b95dad127c085f06cd339f72ffcf8b44b0c7` 仍精确相等，故仅继承该前缀，两次原请求之后的新增内容不纳入。下一次 review 33/34、exit1 是把 planSHA 错当外包文本哈希的 oracle 对象误读；[原 observations](a13-gateway-clean-undo-gui-review-20261021-observations.json)保留。补冻实际 plan 后 [observations-r2](a13-gateway-clean-undo-gui-review-20261021-observations-r2.json)34/34、exit0，不改产品、不改采证。

[严格终核](a13-gateway-clean-undo-gui-review-20261021-drift-final.json) exit1：stdout 追加、Main 的 `commands/task.ts`、`views/tasks.tsx`、`views/tasks-import-confirm.test.tsx` 新变动，另有 `same-name/` 新原件。它们是并发在途，**未清理、未覆盖、未偷偷重冻**；主树 tracked diff/new-file 指纹也不再相同。限定 [终核补记](a13-gateway-clean-undo-gui-review-20261021-drift-final-r2.json) exit0：512 A12 源输入、453 产物和原 178 个 gateway 文件（stdout 仅原前缀）及补充计划 scopeDrift=[]；仍保留 strictUnchanged=false、主树变化与新增117件同名原证。同名原证不审不签。

以下不由本报告释放：外改冲突及依赖拒/独立继续、changed/mixed undo 与重试、逐步/用户编辑变化、幂等/重复/TTL/重启、扩展实体白名单、网络请求正文、真实模型、其他消费点及全样式/体验矩阵。不是 MANUAL_PENDING；本轮范围外未执行，无权替 Main 豁免。原 GG-02 产品红历史保留，新 clean 子路径通过不覆盖 GG-03。

## 8. 验证记录与接续

运行环境 macOS Darwin 24.6.0 arm64，既有 nvm Node v22.23.3；只使用内置 fs/crypto/util/child_process 与只读 Git。pnpm 未调用、依赖未安装。以下为本轮真实执行记录，输出均在本前缀；带 `wx` 的归档命令拒绝覆盖已有结果，不应原地重跑去洗掉历史。

| 命令 | 退出码/结果 |
| --- | --- |
| `node docs/testing/a13-gateway-clean-undo-gui-review-20261021-audit.mjs freeze` | 0；1669 输入，无缺失，A12 源/产物一致；主树初始 5 差异保留 |
| 同脚本 `review`，第一次 | 1；stdout 漂移严格中止，没有 observations，不假造计数 |
| 同脚本 `review`，第二次 | 1；33/34，planSHA oracle 对象误读，原 observations 保留 |
| 同脚本 `supplement` | 0；补冻原 plan.json 880 字节，不覆盖 inputs |
| 同脚本 `review observations-r2` | 0；34/34 机械证据核验；原 tasks、ledger、事件、完整下发与 113 帧哈希 |
| 同脚本 `final` | 1；1670 严格全输入未冻结，并发新增/漂移逐项保留 |
| 同脚本 `final drift-final-r2` | 0；1670 再核，限定 scopeIntegrity=true、scopeDrift=[]；严格全输入仍 false |
| `node --check docs/testing/a13-gateway-clean-undo-gui-review-20261021-audit.mjs` | 0；仅本审证脚本语法，不是产品构建 |
| 报告本地链接/空白检查（Node 内置 fs/path） | 首次1：与终核并行，目标终核文件尚未写出；终核后串行复查0，21链接无缺失、无行尾空白、末尾换行 |
| `uname -smr` / `node --version` | 0 / 0；上述环境 |

完整 GUI 操作由 Main 的原采证脚本执行，本专家不再次执行这些脚本；`cancel-apply-undo-r2/outer-exit` 的 0 与首轮 1 均保留。原始工具 stdout 失败错误、JSON 观察、PNG/帧目视和独立判断分层，不把34条机械条件当34个 GUI 用例。

报告本地链接检查命令（macOS + 既有 nvm Node22，仓库根；不访问浏览器或网络）：

```sh
node --input-type=module -e 'import fs from "node:fs";import path from "node:path";const p="docs/testing/a13-gateway-clean-undo-gui-review-20261021.md",t=fs.readFileSync(p,"utf8");const links=[...t.matchAll(/\]\(([^)]+)\)/g)].map(x=>x[1]).filter(x=>!x.startsWith("http"));const missing=links.filter(x=>!fs.existsSync(path.resolve(path.dirname(p),x.split("#")[0])));const trailing=t.split("\n").map((s,i)=>({s,i})).filter(x=>/[ \t]+$/.test(x.s));console.log(JSON.stringify({links:links.length,missing,trailing:trailing.map(x=>x.i+1),newline:t.endsWith("\n")},null,2));if(missing.length||trailing.length||!t.endsWith("\n"))process.exitCode=1;'
```

**接续**：Main 继续原 goal 的其余分支与缺证采集，另交有对应范围的专家；首页面下发/上下文/网络 body 必须新实采，不补造历史。新候选需重新认领包、产物与实例并重测受影响路径。本专家限定报告已交付，不发起产品改动/新功能/构建；最后 commit 仍由 Main 按全门和原授权处理，无 push/发布授权。
