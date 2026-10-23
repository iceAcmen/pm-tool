# A13 来源治理剩余 GUI 独立补审

> 给 Main 按原 RA-AI01..03 接续与引用；trae，独立测试专家审签。实际审证日期 2026-10-22，文件日期沿父批次 20261021。仅核原件与声明字节，不操作 GUI、产品、构建、服务、凭据或 Git 提交。

## 1. 逐 ID 审签

| ID | 本轮合并结论 | 证据与有效范围 |
| --- | --- | --- |
| RA-AI01 | **PASS，原合同限定的来源 GUI 门关闭** | 有界继承 A12 生产 F6 十来源逐跳、返回、重进及零业务写；新增真实同名两任务的新生产 refs、可见 ID → 正确目标字段 → 返回台账。完整客户端字节与实际实例绑定补齐；现有时间/版本呈现按澄清合同核对，不追加秒/毫秒门 |
| RA-AI02 | **PASS，原合同限定的失效/重校与四链消费 GUI 门关闭** | 有界继承正常 TaskForm 修改 t-0001、changed/needs-regen、不计 supported、history 0→1→2；新增三个实际能力 mode 的共用台账读取/刷新、原 refs/history4 保留及新 PID 下发/解析绑定。不声称四类新生成或所有网络零调用 |
| RA-AI03 | **PASS，原合同限定的缺失来源 GUI 门关闭** | 有界继承合法删 t-0002、missing/manual-review、缺失标签不跳错、history 2→3→4、旧字段/历史不变和真实新进程回读；新增同候选实例绑定，不为补证再删源、重校或重启 |

**以上是被认领 A12 候选上的这三个原 ID，不是治理全 32 项、当前主树 A13 产品、真实模型、全视口/样式/读屏、发布或提交 PASS。** AGUI-01 保留原 A12 修后有限 PASS，未扩其范围。A10/A11 的原 FAIL/BLOCKED、A12 首报告及设施错误原件全部保留；本报告是新证据下的补审，不倒改历史。

本次所派同名/四链/当前实例绑定已无功能性剩件。历史停止安全原输出仍为**缺档未审签**，见 §6；不写成“安全停止已通过”，也不追溯升级为原来源功能 ID 的新 logger/exit-code 硬门。

## 2. 授权与合同

负责人本次原句要点：

> 独立补审原RAAI01..03剩余同名/四链/实例缺件，仅docs/testing/a13-source-remaining-gui-review-20261021前缀可写，不GUI/产品/build/install/services/credentials/commit。读AGENTS/collab/原a12governancesourceGUI+新a13-governance-consumer-contract-clarify（四链不是4面板、timestamp粒度无新硬门）。

> 请freeze目视/bind并逐ID够否PASS或具体剩件，原A12子PASS有界继承。不扩全32/真实模型/四kind新生成。expert only审签。……consumer-readA12无可配置外网，因此sourcechain+events限范围不自言所有网无调。报告终核释放。

依据 `AGENTS.md` §6A、`collaboration.md` §9/§11.3-11.5、[原采证单](remaining-governance-cases-20261021.md) §1/§6、[A12 原审证](a12-governance-source-gui-retest-20261021.md)、[A13 澄清](a13-governance-consumer-contract-clarify-20261021.md) §2/4/6/7。只读原件；只在本前缀新增报告、输入清单和文档审计。未 fetch/pull、install/build、跑产品测试、GUI/浏览器连接、模型或网络调用、启动/停服务、读正式 profile/private URL/认证头/令牌、commit/push/tag。通用 SOP 的构建、living docs 更新和提交动作受本次明确范围限制，由 Main 另接续。

四链是 WBS AI confirm / report narrate confirm / meeting summarize confirm / ask apply 的生产挂点，不是四个治理面板，更不是 OP 四页面。三能力 mode 共用 `ProvenancePanel`；已有 ask-apply 行不因此变成四种 kind。名义时间采用现有 ISO 日期与 HH:mm 切片，entry.createdAt、ref.updatedAt、history.at 分层；不存在本次必须新增的 frozenAt/actor/毫秒字段。

## 3. 冻结与候选继承

初冻 [inputs](a13-source-remaining-gui-review-20261021-inputs.json)：`2026-10-21T21:14:57.287Z`，3169 文件，missing0；后补 [三个原非私有采证脚本指纹](a13-source-remaining-gui-review-20261021-inputs-supplement.json)，仅读脚本，不执行、不读其连接 helper 或私有日志。合计3172个原输入。

| 层 | 独立核验 |
| --- | --- |
| 候选 | 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，dirty A12；树 `/private/tmp/pmtool-a12-closure-20261021`，包 version `0.7.4`，不等历史 tag/正式服务 |
| 源码/补丁 | A12 树512源码逐文件相符；tracked patch SHA `29d9a389ef1f7f178dba50f5cff813672f0ea7c5ebf6dc7ad74aebd38269a596` 相符；澄清合同所读17个生产调用链源码均精确等 A12 |
| 产物 | 453产物逐文件相符；`lib/client.js` SHA `3bc4a1723f10e8f0393eceb48841007e52e9ebafdc4b37f98dc0a970151bc3b7` |
| 旧证继承 | A12 原 inputs-r2 登记的355份 governance 原件字节全部未变。十跳、源改删、四次重校、新进程回读继承原专家已签子范围，不把作者测试数重新包装为 GUI PASS |
| 主树区别 | 初冻时主树8文件已异于 A12：file-staging、asset-route及其test、task命令、stage-client及其test、tasks-import-confirm test、tasks视图。它们不在实际运行 A12 产物中；本报告不签这些新改动 |
| 宿主 | 原候选宿主提交 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；插件与宿主分层认领，不以插件版本代表全部宿主 |

不是因主树变脏而使隔离 A12 自动失效。继承依据是具体 A12 源/补丁/产物/原证未变；任何后续受影响实现、入口、导航、样式或实例变化仍须重新绑定。

## 4. 新 PID / 下发 / 真实解析

`A12/governance/resolver/` 的原 JSON 与 `process.txt/listener.txt/cwd.txt`、对应三个 exit0：

- PID `79214`，监听 `127.0.0.1:3229`；实际 argv 为 Node22、tsx/esm、`--profile pm --no-open --host 127.0.0.1 --port 3229`；cwd 为只读上游。
- 实际 link 为隔离 runtime 下 `home/profiles/pm/node_modules/dsh-pm-tool`，`isSymlink=true`；literalTarget 与 resolved 都指 A12 独立包，不是仅抄候选声明。
- package SHA `c50ccd376a46dbf8ae9c05e9425edcecc4e052e79e748e172780137276848d66` 精确等 A12 包字节；cordisPatchSHA `8c8dd327495eb25743bdebed3ec8e6e0ec6e5dfc807291facd60e69af04c09ba` 等原 setup；runtimePatchSHA另存，不混成产品 tracked patch，也未为此读取私有配置。

| 下发原件 | A12 governance loaded-r4 | A13 gateway loaded-r1 |
| --- | --- | --- |
| 原采证 at | `20:48:32.112Z` | `21:07:51.285Z` |
| origin / page timeOrigin | `3229` / `1792615708785.7` | `3241` / `1792616867623` |
| context / target=frame | default / `17B6BB72544F35C01C79EDF21AC39871` | default / `1BBF621A62D3BD5C2F6DA939DFDC7B64` |
| requestId | `78162.578` | `90700.137` |
| requestTimestamp / wallTime | `314046.7127` / `1792615708.817421` | `315205.42007` / `1792616867.738332` |
| status / cache | 200 / fromDiskCache=false | 200 / fromDiskCache=false |

两份原 combo 均2581368 bytes，SHA `e10bf9b3fd69e2c0a8d744c146362a2e1c235e38a0cb5d6059f74cc692c76cda`，精确等各自结果。完整 A12 模块与宿主实际追加尾缀共1702536 bytes，起点875361、第二起点-1；规范化完整客户端后精确逐字节命中，不以字符串局部命中或 responseExact=false 误判。原采证脚本 `Network.enable`、cacheDisabled、实际 getResponseBody 与 reload 可读，本专家未执行。

default context 的 id=null 是默认上下文实际表示，不等缺上下文；requestId 前段不是宿主 PID，不能与79214混比。loaded-r4 的 responseTimestamp另有原值；两个页面都 pmMounted=true、pilot=off、editor=false。

consumer-read 六状态与 loaded-r4 origin/timeOrigin 一致；同名 ref/target/return 与 gateway loaded-r1 一致。原 restart 回读是更早的新页面 timeOrigin `1792614826282.4`，不是 loaded-r4 后续 reload 的同一页面时钟；原 before/after task/ledger及新 PID回读有界继承，不把后续响应伪称当时首次启动响应。

`loaded-r3/outer-exit.json` 的 `isIncognito is not a function`、exit1 原样保留；r4 更正默认 context 取法后 exit0。它是采证 API 设施错误，不是来源产品 FAIL。

## 5. 四链消费与同名新 refs

### 5.1 A12 共享消费读取

`consumer-read` 中三能力各有 ledger/refreshed 原 PNG/JSON，实际页面文本分别只含对应 mode；WBS有一句话目标输入，meeting有速记输入，report进入对应叙述能力。原脚本实际点击 `.pm-ai-cap`、保存页面状态、只点台账刷新，再返回能力选择。不是三个文件名冒充三次进入。

四对原 command/run/done，seq74..81，均 `pm / ask-provenance p-0001`、success；四条原 POST `/api/commands/execute` 的 origin均3229。第一对是打开读取，随后三对是各能力显式刷新；切 mode 共用组件并不保证再发一次读取，不虚记六次请求。

六状态均显示同一 `prv-mvi6srwe-mwn8sn`、refs10、依据10/context0、changed t-0001、missing t-0002、失效2、需人工复核、history4。四个回包去掉派生 `recheck` 后均精确等旧 raw entry；当前 recheck 为 manual-review，rows为changed/missing/8consistent；pendingCount0。`ledger-after` 原字节等 A12 最后一次重校后 raw；登记17个 data键 before=after，不洗旧结论、不追加重校。

源码 `ProvenancePanel load/runRecheck → ask-provenance/ask-recheck → evaluateStale/recordRecheck` 没有生成器/llm参数，不按四 kind 分叉；原 A12 改删重校命令链亦没有 ask/generate。**据这条 SOURCE + 实际命令/页面链签“该已认领消费区间无自动生成”**。不拿另一个3240 gateway日志替3229消费记录做provider零计数，不宣称所有网络/后台/真实模型零调用；不追加四轮新生成、四个专用面板或 meeting非空refs。

### 5.2 同名准备与明确应用

`A13/gateway` 仅是采证标签，`source-binding.json`、environment和完整下发均确认实际插件仍 A12。宿主 PID90027/3241、上游cwd；本地mock PID89884/3240、自有runtime。原 gateway启动 argv含确定性正文，原 `artifacts/plan.json` SHA `14ef235d6023c7f9a497b69d7ffafec7515136cd74f85357cfe147fada11a9ea` 精确匹配。不是实际商业模型。

原 F6标准包经正常 precheck/确认恢复使用；没有改标准包或seed新refs。正常 TaskForm分别保存 t-0001/t-0002 为“同名来源核验”；两条成功提示有实际ID，raw保持稳定ID/项目/材料与历史，原缺字段manualProgress正常写null，updatedAt分别为 `21:11:37.771Z` / `21:11:38.107Z`。title-boundary仅这两个任务键变化，账本未变；不是先改旧 refs.label。

原采证脚本在两次正常保存后实际发送新问题；现有HTTP生产ask车道调用3240本地mock。原正文是 s1/t-0001 status+progress → s2/t-0001 assignee（needs s1），s3/t-0002 progress独立；无需把最小同名用例限制为恰好两步。原 gateway stdout三对 request/result 均 `/v1/messages`、success/completed，范围只在本地生成stage。

同名原计划PNG可见生产Key、三步与依赖、整批执行(3)；明确apply原请求seq49及成功seq50精确等原plan的实际动作数组，base精确等上述正常改名后的两条updatedAt。原snapshot回包seq54给真实已应用任务；旧entries保留，仅追加：

`prv-mvilyxw9-5m1x3j`，ask-apply/confirmed，createdAt=`2026-10-21T21:12:35.865Z`，refs为两个真实tasks ID，同label、同p-0001、basis、v1/v1、captured updatedAt/两个指纹齐全且匹配实际后态；三postimages顺序为t1/t1/t2。不是手写新账本，三步对同任务合并为两个来源身份。

### 5.3 逐可见 ID 导航

| 可见来源 ID | 同名目标表单与原快照对应 | 原 ref → target → return 时刻（Z） |
| --- | --- | --- |
| t-0001 | 同名来源核验；负责人治理采证甲；description确认后描述；in_progress、progress62 | `21:12:36.153` → `21:12:36.513` → `21:12:36.712` |
| t-0002 | 同名来源核验；负责人空/未指派；description空；todo、progress22 | `21:12:36.905` → `21:12:37.119` → `21:12:37.273` |

ref原PNG实际可见两个相同label与各自ID/表/角色/版本；原脚本先用 `.pm-prov-ref` 的可见ID+同名label选中那一行按钮，不按全页同名文本取第一个。目标fields与真实snapshot同ID记录逐字段相等，仍属QA-G A；负责人空如实保留，不为区分而人工新增字段。每次return原页面都含同一新账本和两ID。

两次导航登记19个data键 beforeJump=afterJump，原 after-apply/after-jump ledger完整字节相等，未写业务或改旧历史。这只签导航区间零写；前面改名/apply当然实际写库。

## 6. 保留的缺档与非本轮结论

- **旧 TERM/port-free 原输出缺档**：原 restart目录没有当时精确TERM/端口释放的输出，父执行记录是陈述而非原工具输出。本次没有明确可读的父工具非私有原日志路径，因此留缺、不搜私有平台日志、不重造退出码、不再执行停止。当前PID/端口/软链/客户端绑定已补齐，但“历史安全停止完整审计PASS”仍未签；这不否认原真实换PID/新页/落盘回读，不增加历史logger的新硬门。
- **第三次HTTP响应唯一归属未单独归档**：same-name-prepare未录command events；其等待条件可能命中已有的同内容草稿，所以 `same-name-plan` 不单独证明“第三次新响应已完成并替换旧计划”。原真实发送、三次local HTTP completed、生产已解析三步、明确apply实际载荷/新base/新refs足以签本次来源身份/同名导航；不据此签RA-AI04完整重新生成旅程或单请求HTTP body/timestamp对应。不同内容的替换/取消原用例仍由其专家另审，不追加为RA-AI01新门。
- 原 ask-three早期steps[]/暂无草稿与cancel容器等待timeout/exit1全部保留；后续有效生产应用不会把它们倒改为成功，也不将它们误归同名来源导航FAIL。
- 几张return与mode转场原截图有叠影；用原连续帧、页面状态/命令回包交叉确认功能返回，不据此签全部动画、透明度、样式或UX矩阵PASS。
- 真实模型、四kind生成、其他29治理ID、K13旧投影完整旅程、全宽档/缩放/读屏不在本任务；没有转MANUAL_PENDING或发布豁免。

## 7. 核验、终核与释放

macOS，Node `v22.23.3`；产品约定pnpm11.28.5，本专家未调用pnpm。实际目视17份PNG：consumer三能力各ledger/refreshed共6；same-name两renamed、plan、applied、两ref、两target、两return共10；原restart/history-after-restart共1。另目视7个原JPG：consumer `000004/000017/000029`，prepare `000012`，apply-jump `000018/000030/000036`。不是全部116新帧逐帧目视；116帧哈希全部核对，原355文件继承另有字节核对。

以下命令在仓库根执行，均exit0；其中review为34/34机械观察相符，不等34个产品用例或独立GUI裁定：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a13-source-remaining-gui-review-20261021-audit.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a13-source-remaining-gui-review-20261021-audit.mjs inspect
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a13-source-remaining-gui-review-20261021-audit.mjs supplement
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a13-source-remaining-gui-review-20261021-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a13-source-remaining-gui-review-20261021-audit.mjs review
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a13-source-remaining-gui-review-20261021-audit.mjs finish drift-pre-report
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a13-source-remaining-gui-review-20261021-audit.mjs finish
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a13-source-remaining-gui-review-20261021-audit.mjs documents
git diff --check -- 'docs/testing/a13-source-remaining-gui-review-20261021*'
```

结构化绑定详见 [observations](a13-source-remaining-gui-review-20261021-observations.json)。报告前 [终核](a13-source-remaining-gui-review-20261021-drift-pre-report.json) `21:47:55.122Z`：3172→3175，missing0，仅Main另一路 `mixed-gateway/start.json/stderr.txt/stdout.txt` 三新增；不在本次同名/consumer/loaded/resolver/继承范围，未拿这些新增文件签字，旧受审文件与源码/产物变化0。

交件 [最终终核](a13-source-remaining-gui-review-20261021-drift-final.json) `21:50:31.579Z`：仍3172→3175、missing0，差异仍只为上述三个新增，较报告前无新增漂移；本次同名/consumer/loaded/resolver、继承原件及A12源/产物变化0。`finish`的exit0表示完成差异记录，不表示所有扫描根零变。`git diff --check`不完整覆盖未跟踪文件；另用原生Node对本前缀全部7个文件核JSON可解析、最终换行、空白及报告相对链接，错误0。旧审计和原证没有被覆写。

Main可引用§1三个原ID结论接回总登记，保留§6限界；不能把它们扩到当前新源码、全32、真实模型或发布。终核清单只代表登记输入，不声称全机零漂移。本专家未创建任何服务或后台进程，没有GUI/builder/端口所有权；交件后此前缀写入权释放，living docs及其他候选由Main继续。
