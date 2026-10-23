# A14 SM01 clean/mixed 有限 GUI 独立审证

> 2026-10-22，平台 trae，独立测试专家。供 Main 接续已授权剩余验收使用；父派单全文、写域和停止条件见[计划](a14-sm01-clean-mixed-gui-review-20261022-plan.md)。本角色没有实现产品修复或执行 GUI，只审 Main 原件。不是整 RA-AI04、全键盘/读屏或发布审签。

## 1. 有限结论

**SM-G01 已采保上下文/主保存可达子项 PASS；SM-G02 的本次 fresh mixed 撤销与 clean 明确点击、业务还原子项 PASS。** 本次没有确证新的 SM01 产品 FAIL。保留原 SM01 产品 FAIL 和所有历史失败，不改成当时已通过。

**clean 成功文案“进入实际视口可目视”子断言 BLOCKED（缺证，不是产品 FAIL）。** 原命令 success、消息已存在于诊断状态、完整落盘和账本均成立，但补件 PNG 的实际视口仍在消息上方，不能以整层 `innerText` 证明该句已被看见。不签完整 SM-G02、整 RA-AI04 或最终发布。

| 用例/有限子项 | 独立判断 | 覆盖与不能扩大的边界 |
| --- | --- | --- |
| SM-G01：未确认三步草稿最小化/展开 | PASS | 原三步、s1 progress73、s2 assignee、s3 progress44 保留；原全勾选状态可见；零业务写。没有 GUI 改勾选/编辑后再往返 |
| SM-G01：未发送输入/模式往返 | PASS | 实际诊断输入“未发送文本：最小化保留”经 draft→min→expand→diagnosis 保留；主保存后再回诊断仍同值，零第二 ask |
| SM-G01：应用后最小化、普通 TaskForm 主保存、展开 | PASS | 主“保存更改”实际可达且提交成功；原 fresh 撤销入口仍可见，最新 t1 外改保留；仅本视口指针流程，不代表真实全键盘/无障碍 |
| SM-G02 / RA-AI04 mixed 首次撤销子项 | PASS | 新 handle，两条 t1 步骤因外改/链式守卫保留；独立 t2 恢复35；中文结果目视可见，账本 audit 对齐、used=false |
| SM-G02 / RA-AI04 clean 点击与业务还原子项 | PASS | 第二新 ask/handle，明确 batch→min/expand→明确 undo，command48 success；两个任务全对象（含 updatedAt）恢复本轮初态，used=true |
| clean 诊断消息存在/结果与业务对齐 | PASS，状态层 | 原 success 文本存在于补件诊断 `pm.text`，不是从失败 runner 伪造结果；不能升级为视口目视 PASS |
| clean 成功句实际视口可见 | BLOCKED | 仅补件 PNG 顶部投影可见；缺滚到该句的原图/连续帧与对应动作，不改原退出码、不要求再次 undo/apply |
| 完整 SM-G01/02、RA-AI04、全门/发布 | 未签，整体 BLOCKED | mixed 重试、逐步、确认前 conflict、取消/再生成、全实体、故障、全键盘/VoiceOver/完整矩阵等本轮 NOT_RUN |

独立 [SOURCE/AUTO 复验](a14-sidecar-minimize-independent-retest-20261022.md)仍只按原范围继承。本报告将其中新 GUI 已采的有限子项补签，不将“源码全绿”或帧数量当全门通过。

## 2. 候选与实际装载

实核结果在[只读核验 r1](a14-sm01-clean-mixed-gui-review-20261022-audit-r1.json)，可重建脚本为[本前缀 audit](a14-sm01-clean-mixed-gui-review-20261022-audit.mjs)。

| 身份 | 实核值 |
| --- | --- |
| 基线 / 宿主归档提交 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` / `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；HEAD 不是完整 dirty 身份 |
| 冻结产品树 | `/private/tmp/pmtool-a14-closure-20261022`；515 源输入、453 产物逐项一致 |
| A14 candidate.json SHA256 | `f89160400a28ba78af722303c01fe9caf3f596657b3d9767f4984a3569d85284` |
| tracked patch SHA256 | `1746ea63883466106ed8c33a6c6aeecf43dee887b780b026efeee3e8564a8041`，实字节等于 manifest |
| panel.tsx / panel.css | `0d2a4560e74adb137084d2e37b34625e4b2e5b1801ec76e72fce5b689ccffe03` / `87ca4fc9f0899d87b3103fcc279a791839a23e921de6511a81086d85d9e54246` |
| sidecar-minimize-retention.test.tsx | `95e4396e2be961e58aaca045299e45ed339e9b883063479d0066e3953e9eee61` |
| 未改 sidecar-portal.tsx | `a3a5e70e459fd74b3454757bcd419e7a2e44b8adce41685dc522dcc494c0ab5d` |
| 与独立 new 的源域比较 | 385 src 文件逐项相同，added/removed/changed 均0；不是仅三文件相同就继承全部 |
| 实际 runtime | `/private/tmp/pmtool-a14-governance-runtime-20261022`；归档 host3245/PID25245，gateway3244/PID25060 |
| 浏览器 | default context，target `F3D7C0806992644F07EFE3B011B7C604`，origin3245，timeOrigin `1792621414936.9` |
| 本轮 GUI 尺度 | 深色1440×900，DPR2；seed 恢复发生在先前1440×718 页面，loaded 明确 reload 后再开始 ask |
| client.js SHA256 | `8e245e9da8a5a720617f305f5875c343662b4727513e2a21474902ee7d53d056` |
| 完整 combo SHA256 | `b30de32c9e74f28e0fb1213e71476eeffa8a719c32e036c5b176b9ed8bcc773f`，2581698字节 |
| 唯一完整 client loader 段 | `59b27555e5516020fba3cce8ae5b63937d77e66f0be77b680f9657d5cfbec658`，1702866字节，offset875361，第二次出现=-1 |

[loaded](../../reports/all-pending-evidence-20261021/A14/final/loaded/result.json)记录 uncached200、fromDiskCache=false，完整响应另保存 `combo-1.txt`；审证重新从冻结 client 去调试尾标记构造 loader 段并校核，**整个 combo 不等于 client.js**。loaded 时刻22:23:36.269Z早于 mixed ask22:25:06.248Z及 clean ask22:27:13.088Z。未捕获 editor chunk，不签编辑器装载。

[environment](../../reports/all-pending-evidence-20261021/A14/final/environment.json)、[host-start-r2](../../reports/all-pending-evidence-20261021/A14/final/host-start-r2.json)、[gateway ready](../../reports/all-pending-evidence-20261021/A14/final/gateway/ready.json)分开绑定产品、宿主与模型设施。只读审了 Main 非凭据启动脚本：`DSH_PM_E2E='0'`、隔离 HOME/DSH_HOME/data/files/backups，生产 ask 管线指向确定性 loopback gateway；未读运行 profile/密钥/entry-url/browser-ws。该脚本和模型请求 BODY 是配置/链路佐证，不等当前进程环境探测或真实云模型质量。

## 3. 合法 fixture 与跨轮接续

F6 使用既有[标准备份](governance-fix-independent-retest-20261021-evidence/run-2ACog5/green-corrected/F6-ui-standard/pmtool-backup-2026-10-21T14-08-30-668Z.json)经真网页路径预检和两层确认恢复。[seed](../../reports/all-pending-evidence-20261021/A14/final/seed/)有 precheck-r2、confirm-r2、restored-r2 原 PNG/JSON；restored-r2目视“已恢复备份”。确认前 data manifest 只有 session/workspace，无 pmtool 业务表；恢复后任务/账本完整对象与标准备份逐项一致。先前实际 dispatch 的十来源历史账本是 fixture，不是本轮生成或人工拼假成功账本。

恢复的历史 handle `undo-mvi6srwd-whr5h1` 未在本轮 list/undo 中使用。mixed 和 clean 均新生成本进程 handle，createdAt晚于新 host启动；旧 entry 全量保留，fresh entry 各另追加。没有捞 A12 遗留 handle、恢复旧 handle 或专家 RPC。

mixed 首轮已经实际 ask 返回三步，随后 runner 在 draft 模式错误查 diagnosis input而退出1。mixed-r2在**同页同未确认计划**继续，初始完整 t1/t2/ledger与首轮相同；只切诊断填未发送文本，不再生成新计划。确认前的多次模式/最小化往返 roots 完全不变。独立核验的 gateway 前两次 request/result与两个 ask相符；后续 attempts 属 Main其他在途范围，不能用于本轮签字。

## 4. 明确提交、完整任务与账本

以下均为 UTC，原 websocket `command/run` / `command/done`按同 commandId 配对；完整参数、原 text、snapshot、原事件时刻保存在 audit `commands`。数字是 event seq，**34是 success，不是 error**。

| 原步骤 | run/done | 真实结果 |
| --- | --- | --- |
| mixed model mode prod / 新 ask | 17/18、19/20 | prod就绪；新三步建议成功，尚未业务写 |
| mixed batch apply | 21/22 | s1 t1 status=in_progress/progress73；s2 t1 assignee=新句柄撤销甲 needs=[s1]；s3独立t2 progress44；按原两任务 updatedAt 的 `--base`，已应用3步 |
| mixed fresh list / snapshot / provenance | 23/24、25/26、27/28 | list唯一 fresh handle `undo-mviol03n-b862oa`；新 entry `prv-mviol03o-9302aq`；refs两任务非空，postimages顺序t1/t1/t2 |
| 普通 TaskForm 主保存 | 29/30、31/32 | 对t-0001明确提交assignee=外部人工改派保留；success中文；完整snapshot等于saved原JSON |
| mixed fresh undo / snapshot | 33/34、35/36 | `已撤销 1 项（tasks/t-0002）；2 项因确认后已被人工修改而保留未动`；第二t1因assignee外改拒覆盖，第一t1因后续未撤销而保留 |
| clean 第二新 ask / batch | 37/38、39/40 | 同三步，但 `--base` 是mixed结束态t1/t2，不沿用原todo基线 |
| clean fresh list / snapshot / provenance | 41/42、43/44、45/46 | list首项 `undo-mviomwsb-cjwlqe`；新 entry `prv-mviomwsb-bgh8os`，不是 list 中第二个 mixed handle |
| clean fresh undo / snapshot | 47/48、49/50 | success `已撤销 3 项（tasks/t-0002；tasks/t-0001；tasks/t-0001）`，逆序同目标链式还原 |

mixed显式主保存 payload来自实际 TaskForm：title/description/status/priority/progress/dueDate等保持，assignee唯一有意义变更；manualProgress=null等表单规范化按raw/snapshot真实记录，**不声称保存只改一个字段**。三个进展修订、另一个软删日志的全部修订、attachments、稳定ID与既有 createdAt 都保留。主保存时完整 data manifest仅 `/pmtool/tasks/t-0001.json` 改字节。

mixed undo之后 t1 **全对象且全字节等于外改保存后**；t2 **全对象且全字节等于初态**（progress35/原updatedAt）。manifest仅 t2与ledger改变；entry旧refs/history/postimages不洗白，只追加 undone audit“撤销1项，冲突保留2项”。`used=false`实核，不把此观察扩大成已跑mixed重试。

clean initial **完整等于mixed final**：t1已经in_progress73、assignee“外部人工改派保留”，t2 progress35。clean s1的status/progress是既有值，不能声称本对照实测了todo0→in_progress73→todo0；本次证明链式逆序保持clean初态，t1改派还原，t2 44→35。clean undo后t1/t2完整对象、updatedAt和JSON字节均精确回该初态，旧两条账本完整保留，新entry追加“撤销3项”、`used=true`。

fresh handle有效期均10分钟：mixed expires1792622144388，真实undo run时余 **598769ms**；clean expires1792622233403，余 **599518ms**。没有用TTL过期解释本轮入口，也不声称验证了真实到期/重启失效。确认前、applied min、普通表单未保存、主保存后expand、clean min/expand各自data roots均不变；业务写只发生在明确apply/main save/undo。clean最终相对initial任务全零漂移，另有idempotency/ledger/pending/session变化，不能称所有存储零写。

## 5. 独立目视与缺证

**118/118 compositor帧SHA一致，不是118帧逐帧全目视。** seed7、mixed40、mixed-r2 43、clean28。帧时间/action最近帧及全部原hash索引在audit `frames`；本次实际目视 **13张PNG、7张原帧**：

| 原件（相对 A14/final） | 目视内容 |
| --- | --- |
| `seed/confirm-r2.png`、`seed/restored-r2.png` | 确认恢复对象/显式按钮、恢复成功；不签恢复确认页完整样式，确认页有未纳本SM01范围的排版异常 |
| `mixed/failure-state.png` | 三步draft已存在、无diagnosis输入；首轮input missing属设施选错模式 |
| `mixed-r2/diagnosis-input-before-min.png` | 原未发送文本有值与可见焦点环 |
| `mixed-r2/draft-before-min.png`、`draft-retained.png` | 相同三步/字段/勾选、标题、依赖；第三卡由页面内部滚动承载 |
| `mixed-r2/save-visible.png` | 真实TaskForm assignee，主底部保存更改按钮可见且未被副驾层挡住 |
| `mixed-r2/expanded-after-save.png` | 主保存成功通知、原“撤销·整批3步”与mode保留 |
| `mixed-r2/mixed-undone.png` | 原撤销中文结果完整可见、最新t1人工改派、t2进度35、未发送文本仍在 |
| `clean/draft.png` | 第二新计划三步与待确认模式，基于前轮人工改派的最新任务 |
| `clean/hidden.png`、`clean/expanded.png` | 真侧边标签/主区恢复、展开后新撤销按钮可见 |
| `clean/supplement/undone-visible.png` | 切到诊断，当前投影为t1人工改派73/t2 35；**截图视口没有“已撤销3项”那一行** |
| `mixed-r2/frames/{000011,000013,000020,000034,000037}.jpg` | 草稿min→expand、应用后min、普通主提交中、展开保原undo；与action时间及raw对应 |
| `clean/frames/{000025,000027}.jpg` | undo真实提交中→原undo按钮移除；仍draft模式，不是success消息图 |

`mixed/frames/000009.jpg`仅在时间索引定位，未实际目视，不计入上述数量。缺clean补件连续frames/actions/console和消息可见bbox；诊断mode已切、文本已出现于状态可证明，但“进入视口显现”不能据口述签。补件 `result.exit=0` 是补采完成码，不是clean原runner exit0。

当前证据足以签本次main save指针可达、min标签与保入口/输入。真实 Tab顺序、activeElement归还、隐藏无障碍树、VoiceOver、四视口浅深/200%、主操作全面滚动/焦点未跑，保持NOT_RUN。pure React/focus mock和scrollWidth=clientWidth不是完整GUI门。

## 6. 原退出码与设施归因

| 原设施/采集 | 原结果 | 独立解释 |
| --- | --- | --- |
| host-start首轮 PID25062 | host-exit code1 | `FiberState` export缺失，错误cwd/tsx导入设施轮；后续相对tsx+上游cwd新PID25245另认领，不改旧失败 |
| seed 首菜单轮 | failure-state保留；未见独立exit文件 | mouseleave后设施没有保持恢复菜单，未成功预检；不能补造原exit0/exit1。r2实际标准恢复另有原图/状态 |
| mixed 首轮 | exit1 | `input missing`，ask已成功但模式不含诊断输入；不是产品丢草稿或丢输入 |
| mixed-r2 | exit0 | 真实最小化/主保存/展开/明确fresh mixed undo已采完整 |
| clean | exit1 | `TimeoutError: Waiting failed: 15000ms exceeded`，在command48成功之后仍draft模式等diagnosis-only消息；不判业务失败、不改原码 |
| clean/supplement | result.exit0 | 实际切诊断，raw/state/roots补件；新ledger仅一次undone audit，原49/50 snapshot已是还原态；没有证据支持重undo/reapply |

mixed和mixed-r2的console原件均`[]`，限定监听区间内无console/pageerror；clean没有独立console原件，不宣称clean console零错误。补件没有另存操作脚本/事件流，本报告以原命令结果、完整对象、单次undo audit和当前状态判断已采业务结果，不以补件摘要证明全时段“绝无RPC/额外操作”。

## 7. 验证命令与保护

环境macOS、arm64、nvm Node **v22.23.3**；Main使用pnpm11.28.5环境，build原件未单独留pnpm版本探针，不将约定版本当本轮另测。专家未执行产品构建/安装/测试/GUI/服务，不读runtime数据/凭据，不commit/push。

Main原命令（冻结包cwd `.../pmtool-a14-closure-20261022/packages/dsh-pm-tool`）全部原件审读：

```sh
pnpm exec tsc --noEmit
pnpm run build
pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node scripts/verify-isolation.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node scripts/test-isolation-guard.mjs
```

前三条退出码均0，146文件1479项通过，coverage门0（总体88.6%/82.27%/84.61%/88.6%）；95条guard内`node scripts/verify-*.mjs`逐条原退出码0，脚本名称及exit完整索引在audit `guardRows`，原命令/覆盖中文见[guard stdout](../../reports/all-pending-evidence-20261021/A14/full-verify/guard.stdout.txt)。verify-real-model按合同不在guard自动门，不能称其已验。guard-selftest0，冻结`launcher` cwd的`pnpm test`（56/56）与`pnpm run verify`均0；不是独立GUI PASS的替代。

本角色新命令（仓库根；只读归档+本前缀新文件）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-sm01-clean-mixed-gui-review-20261022-audit.mjs r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a14-sm01-clean-mixed-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-sm01-clean-mixed-gui-review-20261022-finalize.mjs r1
```

三命令原退出码0；28条结构/身份/事件/对象相关断言全成立，另记录TTL余量，515源/453产物一致，385src域零差异；核验过程所列build/full-verify/seed/loaded/mixed/mixed-r2/clean **290份原文件hash+mtime前后零漂移**。Main src在本次采样亦与candidate逐项相同；不代表后续并发变更自动继承。[末次核验r1](a14-sm01-clean-mixed-gui-review-20261022-final-r1.json)再次确认原件/515源/453产物/manifest/patch零漂移、本报告与计划链接无缺失、自有两脚本语法exit0；其后仅自有文档状态与命令补记，未改产品或原证。

本轮只读调查曾因把原证误定位冻结树下而ENOENT，未写文件；图片联系图依赖PIL/Imagemagick不可用，未安装，直接逐张原图审查，没有生成联系图。它们是专家设施检查，不是产品失败。原证以本前缀JSON保存指纹而不覆盖任何原件；未扫描全机/正式data/profile/其他专家所有文件，不扩称全机零污染。

## 8. 释放与 Main 接续

本专家已完成有限审证，不持有builder、GUI、产品文件、运行实例/端口或profile，没有运行中测试子进程。Main继续其他已授权剩余验收/修复，livingdocs和最终提交由Main按有效门处理；本轮不commit、不push。

可补最小缺证：在**同一clean既有结果**切到diagnosis后，仅只读滚动至“已撤销3项”，保存真正可见原图/连续帧及action/state（含消息bbox、视口与滚动位置），前后raw/ledger/roots对照。不要重undo/reapply、不要RPC补旧handle。原模板/全键盘/其他RA-AI04分支另按原合同、freshfixture/handle采证，本报告不替这些分支签字。
