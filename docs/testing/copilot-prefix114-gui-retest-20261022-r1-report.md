# 副驾前缀114修后有限 GUI 独立审证 R1

> 2026-10-22，平台 trae，CopilotPrefix114GuiRetestR1。不同独立 GUI 审证专家，非开发、非 GUI 执行、非 Main builder。证据执行截至 `2026-10-22T15:17:00.479Z`；只新增本前缀 reader/audit/report。

## 有限裁决

**PASS_LIMITED_GUI：修后原21/22的401与429完整中文提示各保留单前缀，正常回答原文及同副驾恢复成立。S112-PREFIX-01 在本114候选、原21/22完整文本范围内关闭。**

| 子门 | 本轮裁决 | 限定 |
| --- | --- | --- |
| 原21 AUTH完整提示 | **PASS_LIMITED_GUI** | 真实隔离网关401链，中文凭据无效/失效完整保留，页面恰一个场景前缀；不是未检测到Key |
| 原22 RATE完整提示 | **PASS_LIMITED_GUI** | 真实隔离网关429链，限流完整正文恰一个前缀；RPC的HTTP200不是模型成功 |
| 原22正常恢复 | **PASS_LIMITED_GUI** | 同页、同agent、同副驾保留两次错误后继续请求成功；回答不加错误前缀，无可执行步骤，原GUI输出inputDisabled=false |
| 业务/files/backups不变量 | **PASS_LIMITED** | 4态各21份业务JSON，共84份实核；仅明确prod点击的updatedAt例外，其他settings与files/backups精确同 |
| 旧112双前缀FAIL/必要红 | **历史原判保留** | 747件及旧测试原件未改；修前R2仍2绿3红/exit1，不倒改、不豁免，不声称旧112装载新修 |
| 整RA-AI06、取消、realmodel、B8、父目标/ordinarycommit | **NOT_SIGNED_THIS_ROLE** | 本件不授整项PASS、不授提交或发布 |

本门 **remaining=[]**。不把“原112仍FAIL”误解为新114缺陷未闭，也不把新有限PASS扩成全部错误/页面/模型矩阵。ASCII冒号、未带前缀传输和换行控制只保留先行独立SOURCE/AUTO的原范围，本轮没有追加真实GUI场景。

## 授权与依据

负责人原句关键范围：

> 父持续多角色验全部授权，你不同独立GUI审证非执行非开发，只docs/testing/copilot-prefix114-gui-retest-20261022-r1*新reader/audit/report。
>
> 限修后旧21/22原401/429/normal全文单前缀。你实际PNG目视+frames/RPC/gateway-slice/原packfingerprints/byte审；不重执行Mainhelper/测试，不source/oldtesting/livingdocs/Git/service/key/browser/build/install。
>
> 旧112双前缀FAIL/必要红保，不倒改；修后S112-PREFIX01是否关闭按完整文本。新114整回归专家另审，不代签，只当前GUI有限。尚无完整firstloadcache/hostGitbundle声明，明示边界不要替本门增前置。路径正档privatehelpers，index后新文件追加不误污染原。审结releaseSTOP并仅真实remaining Main继续。

依据：[AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md#十一深度复盘后的执行合同与证据规则adl-0572026-10-21)、[前缀最小闭环](../plans/2026-10-22-copilot-error-prefix-closure.md)、[114续验计划](../plans/2026-10-22-successor114-prefix-regression.md)、[旧112原GUI/RED报告](successor112-auth-gui-prefix-20261022-r1-report.md)、[独立SOURCE/AUTO5/250/noEmit](copilot-error-prefix-independent-retest-20261022-r1-report.md)。本轮明确限定覆盖通用fetch/pull、install/build、全回归、livingdocs及Git流程，不扩权。

## 原包与运行归属

本角色自行读字节、解析原RPC、比对原pack索引、直接目视原PNG/JPEG；Main的raw-report与executor-observations仅作定位，不能代独立判定。详见[首轮审计](copilot-prefix114-gui-retest-20261022-r1-audit.json)、[终核审计](copilot-prefix114-gui-retest-20261022-r1-audit-r2.json)。

| 对象 | 实际核验 |
| --- | --- |
| `Successor114GuiR1/index-r1.json` | **166/166** bytes/SHA同；27054字节，SHA `556127531637e1f4bfde0899cafe7c1186b2caa79368dc9f86d4d95cf4edd47a` |
| 旧112原包 | **747/747** bytes/SHA同；index126487字节，SHA `111a838096c657b19203b7cd16c440d7d4cf4b69c52a5c0e2c6c7100119ae322` |
| 基线/候选 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，version0.7.4；冻结 `/private/tmp/pmtool-combined-successor114-20261022-r1`，不是以HEAD/version替dirty全集 |
| 声明/输入 | **114声明（99包路径/15 launcher）/521包输入**，逐bytes/SHA核新冻结，与先行独立认领逐键同 |
| 新产物 | 冻结lib **455** 件集合及bytes/SHA精确同built-artifacts；不是本角色构建或整回归签字 |
| 实例 | 归档host **3264/PID10975**、gateway **3261/PID60386**；不探活、不操作服务 |
| runtime/profile | `/private/tmp/pmtool-successor114-gui-runtime-20261022-r1`；原setup将profile `home/profiles/pm/node_modules/dsh-pm-tool`软链指新冻结包，配置root同runtime，gateway合法本地依赖 |
| 浏览器/开关 | 原EGO taskSpace13/p3，DSH_PM_E2E=0，pilot={}，生产车道prod；身份来自原脚本/RPC/页面，不是本角色浏览器操作 |
| 原helpers | 归档helper/setup/round01..05与对应 `/private/tmp/pmtool-successor114-*-r1.mjs`/round原件逐bytes同；只读、不import或重执行 |

实际归档路径以 `helper-source.mjs`、`host-setup-source.mjs`、`execution-scripts/pmtool-successor114-round0N.mjs` 为准，不猜不存在的setup/seal路径。runtime私有entry-url与Key不读取；profile只核归档配置与setup绑定，不冒本角色现场解析软链。

### 响应内字节定位

下表均由reader实际Buffer字节复算，**不是抄原row的offset/bytes**：

| 对象 | bytes | SHA256 / 实测位置 |
| --- | ---: | --- |
| `04-loaded-0.js`整个响应 | 2597889 | `ac391abd549e31bab3118c4ad2e7aa918422ec1fe01f22472408d05794a662ac` |
| 新完整`lib/client.js` | 1719089 | `e4bda1dba6cd0d0110fa8eafb9f60e58b8a5cef9c6e1390b2016317b31b5c2d3`；整段匹配offset=-1，保留 |
| 仅去末尾sourceMappingURL的可执行段 | 1719055 | `aabe6a0eb9b3545522478b76af057c7c3d2843b619dcafb6aac00fa3b504e4af` |
| 唯一可执行段位置 | 875361 | 第二匹配offset=-1；与归档row逐字段核同 |

只去末尾 **34字节** `//# sourceMappingURL=client.js.map`；无trim/全局replace/源码重写。完整client与host-start声明SHA一致，final-source-binding与Combined114 source-files完整同。

**first-load/cache资格未完整声明，不签；宿主Git/bundle身份未完整声明，不以插件基线代表宿主身份。两项如实作为边界，不新增本原21/22有限门的阻塞前置。** 归档candidate.runtimeLoaded=false与fixture.restored=false是准备时状态，不用于否定后续装载/真实restore。

## 合法F5与精确请求

原标准F5备份16761字节，SHA `bf685cd0eec617a8d6f01c1de1b5fd69bb83fbd921c062915b8b8effe672a489`，fileBundleId=`69ba8b57a76af04c`。本角色核原备份、预检RPC、第一确认无写RPC、第二确认真实restore成功、snapshot和21份raw record；全部record与原备份精确同。file_assets内部relPath与原备份完整同，公开snapshot按既有投影不含relPath，两件附件摘要与files根一致。

原预检request `24317.2049`/rpc `1c749c1a-ed69-4826-92fd-15d8687d3d18`；实际confirm `24317.2050`/rpc `1f49d46d-5f3b-4085-a767-28529321c976`；随后的snapshot `24317.2051`/rpc `eaca42e4-f107-42d3-afd0-b16802e63ece`。恢复前库为空，实际返回“当前库为空，未生成安全快照”，不伪称本轮生成安全快照。这里只证合法种子与动作归属，不签F5/恢复整域样式、UX或新功能。

| 原动作 | requestId / rpcId | 结果 |
| --- | --- | --- |
| 显式点生产Key | `24317.2055` / `d4219827-758c-4efa-9de5-a5560c0cfc1a` | `/pm model mode prod` success，检测到Key、生产车道就绪 |
| 04 AUTH | `24317.2056` / `f1f7ebb2-6923-4a46-8aa6-2f252846f543` | gateway seq11/auth/flash，command.kind=error |
| 05 RATE | `24317.2057` / `84657981-4485-4eab-8676-4e74025331fe` | seq12/rate_limit/flash，command.kind=error |
| 05 NORMAL | `24317.2058` / `92b49e2f-6ba7-4af2-b9cf-7f8212c4e3a4` | seq13/success/flash，command.kind=success |

逐requestId/rpcId配对，网关原slice每一原行在原owner requests日志中存在，prompt问题与RPC问题同，每问仅一个请求。原网关源码auth/rate分支 `writeHead(401/429)` 后error JSON/end，正常分支message_stop完整；不是自编Error假装真实网页失败。**没有模型HTTP wire/status/body抓包、没有本GUI绑定finish.enum独立探针**，不冒这些边界，也不重开已签下层terminal。

三态同timeOrigin=`1792681866374.8`、同agent=`session-12f8f016-688e-44c5-ad07-d622077dc049`，同深色1458×734/DPR2。完整页面回答段分别与原command文本逐字相等：

```text
副驾暂不可用：模型 ark-plan/deepseek-v4-1-flash-260910 凭据无效或已失效，请检查 API Key。
副驾暂不可用：模型服务限流，请稍后再试。
修后副驾正常恢复：这是只读回答，不修改项目。
```

三张终态PNG实际可读完整正文；原04生产Key选中，05-rate保留前次AUTH，05-normal保留两次错误及新健康正文。无双前缀、不按substring/count洗绿。正常页面同时显示“模型未给出可执行步骤”和“暂无 AI 确认落库的处理结果”；原round05 GUI直接输出inputDisabled=false。没有把画面下方未入镜的输入框冒称终态PNG已展示；解锁由原GUI输出与成功续问共同支持。无自动计划执行或确认写RPC。

## 目视与写边界

**实际打开全部6张PNG及18张原JPEG**。03/04/05的页面终态依对应PNG、页面状态与RPC共同支持；原JPEG不是完整连续终态录像：

- 04三帧是发问前空副驾，不含最终401结果。
- 05-rate三帧主要呈先前AUTH；05-normal三帧主要呈已存在的AUTH/RATE，尚不含新健康结果。
- F5九帧含入场/菜单、预检后与确认中的前段；恢复成功以03 PNG/RPC/raw补足，不把文件名当帧内容。

18帧均核events文件名/SHA/index；第一normal帧metadata为729×367，其余该组1458×734，normal组三张原JPEG均为1500×754。不拿此元数据缩放差异签原生zoom/另视口。捕获窗口Runtime.exceptionThrown=0；helper不保存consoleAPICalled，不签全Runtime/console零错。浅色、200%、键盘/读屏、全响应式/样式矩阵不在本门。

`03-f5-restored -> 04-auth-single -> 05-rate-single -> 05-normal`：各21份pmtool rawJSON，**84份集合/bytes/SHA均与roots逐项同**。18件非settings业务JSON（含file_assets）均精确不变；settings不全排除：

| 字段/写面 | 真实变化 |
| --- | --- |
| `aiModelMode.version` / `record.value` | 全程2/prod不变 |
| `aiModelMode.record.updatedAt` | 03→04从`2026-10-22T12:31:43.291Z`到`2026-10-22T15:15:07.681Z`；唯一字段变化，由明确click+mode RPC绑定 |
| mode后续 | 04→rate→normal该文件bytes/SHA精确同 |
| `pmExportAudit` / `pmExportSent` | 全程bytes/SHA精确同，不作settings豁免 |
| files/backups | 2件files及备份JSON/两件侧车/manifest共4件backups，根清单全程同 |
| 宿主sessionJSON | 03→04、04→rate有变化；rate→normal无变化，另列不称全data零写 |

上述限已保存根清单，不签exports/private/cache/正式资产/全盘或mtime零污染。没有为“清树”删除旧包/旧实例/在途成果；原索引声明未改，索引后新文件按additionsAfterIndex单列，不自动认定污染。两次本轮审计截点additionsAfterIndex=[]。

## 原退出与自有审计

原6份actual执行均exited/outputComplete=true/exit0，与execution-receipts的UUID/PID逐项同，原stdout/stderr指纹保留：

| 原实际执行 | 工具PID | exit |
| --- | ---: | ---: |
| bootstrap | 10965 | 0 |
| round01 | 11241 | 0 |
| round02 | 11385 | 0 |
| round03 | 11607 | 0 |
| round04 | 11912 | 0 |
| round05 | 12158 | 0 |

这是原GUI采证命令的退出，非本角色执行或产品回归结论。host PID10975不是bootstrap工具PID10965。

本角色环境macOS/bash、既有Node **v22.23.3**；pnpm11.28.5仅引用原依赖环境，未调用。仅实际执行自有只读reader：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/copilot-prefix114-gui-retest-20261022-r1-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/copilot-prefix114-gui-retest-20261022-r1-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/copilot-prefix114-gui-retest-20261022-r1-reader.mjs audit-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/copilot-prefix114-gui-retest-20261022-r1-reader.mjs close
```

syntax两次实际exit0；首audit **exit1**：自有reader将公开snapshot与file_assets内部record直接全等，错把内部relPath视作差异。不是产品FAIL，不修改产品/oracle/原证；首失败审计完整保留。仅reader改为公开投影精确比snapshot、完整record再精确比标准备份，追加audit-r2 **9组通过、errors=[]、exit0**，保护1997份明列输入无漂移。close退出与report/reader/audit指纹由[关闭审计](copilot-prefix114-gui-retest-20261022-r1-audit-close.json)记录，不把文件存在当命令已退出。

准备时误做一次只读`git status --short`，超本子单最小动作面，未用于裁决、无Git写，随后不再调用Git。`rg`不可用127、指定memory缺文件1是探索工具事实，改用find/grep及仓库原档，不计产品失败。未执行任何Mainhelper/旧测试/产品测试、build/install、浏览器、服务或Key操作；只写本新前缀，不改产品、oldtesting、livingdocs、原证、配置或共享lib。

## Release / STOP

**本角色released/STOP，release STOP；当前前缀GUI有限门无remaining。** 旧112FAIL与必要红原件保留；修后114原21/22闭环只在本报告新增结论，不回写旧报告。

[另一专家的新114整回归有限PASS](combined-successor114-regression-review-20261022-r1-report.md)已落，其161/1691、DOM17、special7、默认95/noEmit属于该专家独立门。本件只引用其范围与候选，不代签、不要求重跑。独立5/250/noEmit也不重跑或冒GUI。

Main仅继续真实余项：按[OP专家§5](op-growth-remaining-gui-review-20261022-r1-report.md#5-反证疑点与最小剩余)补todo正确board/必要L8标签、两份既有报告66全值、已有工时/错误/日期字段稳定曝光，以及原精确客观40甘特/有排期无信号/合法旧bare browse与原native门。先复用正确既有原件，不重move/stats/check、不重生成报告或已签保存。原P0/P1/P2/P3六组、B8及父总出口仅按各自最新合同/审证的未闭项推进，不用本门未签边界额外重开已签内容。取消、realmodel、整RA-AI06、父ordinarycommit仍非本角色签字；父全部适用门汇合后才由Main处理其原授权ordinarycommit。

不push/tag/release/正式切换，不停止父持续验全部任务，不持源码/builder/端口/业务根锁。Main无需将本角色新文档补进原166件索引。
