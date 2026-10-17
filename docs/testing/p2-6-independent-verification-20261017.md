# P2-6 AI 溯源治理 · 正式候选独立复验报告（2026-10-17）

> 独立测试专家复验，**不采信开发自测**。只写 `docs/testing` 与自有证据，不改产品、不提交 git、不调收费模型、不绕认证。
> 结论：**纯函数核心与回归自动化 PASS；整体候选 NOT PASS（3 项阻塞未补，补前不得放行）。** 本报告非 P2-6 正式 PASS，UI 视觉与 L3 真实模型另计。

## 1. 绑定（被测对象）

- HEAD（未提交工作树，符合「测试前不提交」）：`21cdc94ba57ce7efb473e62373036b4b7ce6cd04` / short `21cdc94`
- tracked 产品 diff（src+scripts）SHA-256：`7f7ed00f467a4f2ef860c7da72868ba540df7f54b890bf828a26a71d0a9b455f`
- 新增 P2-6 文件 SHA-256：
  - `core/provenance.ts` `36fc8292ac6be5600c2173a576abe867b8c392b5679152d075a59502aa70f2e0`
  - `core/provenance.test.ts` `647c1e00a4496f3c22c9f24a4074f370df282500607cc1dcd0cd6ad2bd11d9b4`
  - `core/provenance-store.ts` `62aaa88a20803583284ee3aae4a351427f0392aec0a927c5ac556e88bddcf66a`
  - `core/provenance-store.test.ts` `cb0a75787b2114be59b079fb860f80704cfb4652bdc0b2795195316a9830c0e4`
- 改动命令文件：`commands/ask.ts`(+71)、`meeting.ts`(+20)、`progress-report.ts`(+23)、`task.ts`(+21)。
- 注：`core/task-export.ts` 本工作树携带 P2-2 只读快照 token 对齐改动（非 P2-6 范围），已随 build/e2e，归属请开发说明。

## 2. 独立回归（证据 `evidence-p2-6-20261017/`）

| 门 | 独立结果 | 开发自报 | 复核 |
|---|---|---|---|
| build | **PASS 退出0**（tsc+css+tsdown） | build=0 | 一致 |
| vitest | **PASS 184/184，16 文件** | 178/178 | 开发计数偏低；独立 3× 复测稳定 184，首跑 178 为一次性未复现；无失败 |
| coverage | **PASS 退出0**，子集阈值满足；All files 52.84 stmts / 85.32 branch，与基线持平无回退 | — | provenance.ts 不在 coverage include 子集 |
| verify-isolation | **PASS 73/73**，资产 169 before=after 零污染 | 73/73 | 一致 |
| e2e | **PASS**（project/task 渲染、console errors=0，隔离 DSH_HOME/非生产端口/不出网不调模型） | PASS | 一致 |

## 3. 源码核真（非仅跑测试）

### 3.1 已成立（PASS 范围）
- **F14 撤销冲突守卫（修复现网 GAP-01）**：`provenance.classifyUndoTarget` 对 update（clean→restore / 冲突→refuse）与 create（clean→delete / 被改→refuse / 已消失→skip）全覆盖；`planBatchUndo` 仅 clean 执行、冲突单列、不整体回滚、`ok=refused 为空`。ask 接入（`ask.ts:227`）落库后抓全对象 postimage（`:384`），撤销结果经 `recordUndoOutcome` 写审计（`:249`）。
- **纯函数**：`buildSourceRefs`（basis+显式表 context、去重、不错表 N6）、`validateSourceRefs`（missing/cross-project 分列 N7）、`classifyStale`（consistent/changed/missing/cross-project）、`recheckProvenance`（删除→manual-review、改→needs-regen、旧证据保留、不可变历史、深克隆+递归冻结 R-N5c）。11 例单测覆盖 N1/N2/N5/N8/批量部分冲突。
- **持久化**：`capEntries` 按项目独立保留最新 20 条、`dedupeById` 按 id 幂等；写走 `enqueueDomainWrite` 串行 FIFO 队列；best-effort 失败转 pending 待补偿；脏行忽略。
- **F08/F11 置信诚实**：`CONFIDENCE_UNAVAILABLE=未提供`，无分数/百分比/按来源数高低分接口。
- **X1**：本批无新增 `dangerouslySetInnerHTML`；数据层原样存文本，转义归 UI（未实现）。

### 3.2 缺陷清单

#### 阻塞（B，补前不得放行）
- **B-1 失效治理纯函数未接入产品，台账只写不可读。** `recheckProvenance/classifyStale/validateSourceRefs/listProvenance` 在 commands/client **零调用点**；无查看台账、无失效置灰/警告条、无重校入口。F05/F06/F12 产品闭环缺失，纯函数绿不代表治理生效。
- **B-2 F13 半成功补偿是死路径，无显式状态机，无故障注入测试。** `sweepPending` 全仓**无调用点**（无启动/重启/下次进入触发），失败转 pending 的条目永不并入；条目仅带 `status: confirmed|pending` 字段，无显式 pending→confirmed 迁移；无「部分步成功+台账写失败」注入与悬挂断言。F13/X2 重启补偿不成立。
- **B-3 四链 L2 集成/故障注入/并发/重启边界测试缺失（开发自报属实）。** 现仅有纯函数单测与 fake-domain 写盘样例（fake 的 `table()` 不分键，非真实 PmDomain）；无并发写竞争、半成功、重启读回、四链端到端断言。纯函数绿≠集成过。

#### 主要（M）
- **M-1 report-narrate 的 basis 未真挂。** `progress-report.ts:110` 把 tasks/milestones 载入 recMap，但 `context` 仅挂 `reports:report.id` 自身，确定性数字依据（任务/里程碑）未进 refs；摘要却称「确定性数字采集」，溯源不支撑叙述。
- **M-2 meeting-summarize 自指。** `meeting.ts:160` basis=[]、context 仅新建会议自身；原始逐字稿不持久（设计内），台账不可追溯到上游来源，须如实标注为「记录生成物」而非「来源溯源」。
- **M-3 四链 `snapshotVersion:1 / ruleRevision:1` 硬编码**（ask:408、report:120、meeting:163、task:616），版本失配比较为死分支；接入层只剩 updatedAt/basis 指纹可检出改动，内容/口径版本变更检测失效。

#### 次要（m）
- **m-1** ask `buildSourceRefs` 取 `v.accepted`（含被 baseline 拒/依赖未满足而跳过的步），未只取已落库 `applied`，refs 可能列入未生效动作。
- **m-2** WBS 新建任务以 `op:'task.update'` 入 basis（`task.ts:613`），实为 create；仅影响 OP_TABLE 查表（仍落 tasks），语义标签不准。
- **m-3** F14 fallback `postimage ?? capturePostimage(当前)`（ask.ts:228/:420）：句柄缺 postimage 时自比 clean，绕过守卫；正常路径有 postimage，仅遗留/异常句柄受影响。
- **m-4** 混合撤销（部分 restore + 部分 conflict）即把句柄 `used=true` 烧毁，冲突项不可重试。
- **m-5** pending 行失败重试条目只去重不 cap，长期失败可无界增长。

## 4. 逐条结论（对应实施计划 §2）

| ID | 本轮 |
|---|---|
| F01 四类可区分 | NOT_RUN（UI 未实现） |
| F02 预览可核对 | NOT_RUN |
| F03 确认前零写/幂等 | PARTIAL（现网幂等未在本批重测） |
| F04 撤销可见/限制/回滚/留痕 | PARTIAL（现网限制未重测；F14 守卫+审计已接入） |
| F05 来源证据可跳转 | NOT_RUN（B-1） |
| F06 失效置灰 | NOT_RUN（B-1） |
| F07 离线降级/失败恢复 | NOT_RUN（本批未注入模型错误） |
| F08 置信诚实 | PASS 静态 |
| F09 真实模型闭环 | MANUAL_PENDING（L3） |
| F10 指纹+scope | 纯函数 PASS / 接入层 PARTIAL（M-3） |
| F11 置信不按来源数量 | PASS 静态 |
| F12 重校不冒充 fresh | 纯函数 PASS / 产品 NOT_RUN（B-1） |
| F13 半成功恢复 | 阻塞（B-2） |
| F14 撤销拒覆盖+审计 | PASS（纯函数+ask 接入；m-3/m-4 弱点） |
| F15 四链全覆盖 | PARTIAL（M-1/M-2/m-2） |
| F16 历史中性+离线不禁CRUD | NOT_RUN |
| X1 安全转义 | PASS 静态 |
| X2 重启读回 | PARTIAL（B-2） |

## 5. 总判定

- **可接受（PASS 候选局部）**：F14 守卫纯函数与 ask 接入、F08/F11 静态置信诚实、X1 无新注入、回归自动化全绿、隔离零污染。
- **整体 NOT PASS**：B-1/B-2/B-3 未补前不得放行；M-1/M-2/M-3 随阻塞项一并修；m 级可列后续。
- **不计入通过**：UI 视觉（F01/F02/F05/F06/F16）待 G3 带链接导航采证后独立审证；L3 真实模型闭环 MANUAL_PENDING，不由离线 mock 顶替；静态/自动结果不当视觉 PASS。
- 修复后受影响项必须在新 HEAD+diff 由独立测试复测，不继承本轮或原型旧 PASS。

## 6. 第二轮补齐复验（2026-10-17，同一 HEAD `21cdc94` 工作树）

### 6.1 绑定
- HEAD 仍 `21cdc94ba57ce7efb473e62373036b4b7ce6cd04`（未提交）。
- 第二轮 tracked diff（src+scripts）SHA-256：`0b7fb29cbcb54368ba9705016df5e8638c92f146a2a11a5e32efeca0c7188435`。
- provenance.ts / provenance-store.ts / 两个测试文件字节未变（SHA 与第一轮相同），本轮改动集中在 tracked 文件（panel.tsx/panel.css/ask.ts/三命令）。

### 6.2 独立复跑（证据 `evidence-p2-6-r2-20261017/`）
| 门 | 结果 |
|---|---|
| build | PASS 退出0 |
| vitest | PASS 184/184，16 文件（与第一轮一致，无新增用例） |
| coverage | PASS 退出0，52.84 stmts / 85.32 branch，无回退 |
| verify-isolation | PASS 73/73，169 资产 before=after 零污染 |
| e2e | PASS，console errors=0 |

### 6.3 本轮声称项核真
- **F14 审计链（recordUndoOutcome）**：成立。ask 撤销后 best-effort 写账本审计（成功/冲突/失败），`recordUndoOutcome` 按 undo.handle 追加事件并置 `undo.used=true`；store 测试断言落盘审计与 used 标记。弱点保留：best-effort 吞错；若原记录本就在 pending，审计找不到目标。
- **F13 sweepPending 幂等补偿**：**部分成立**。新增命令 `/pm ask-provenance <projectId>`（index.ts:185 注册）先 `sweepPending` 再 `listProvenance` 返回；补偿路径幂等并入。**但无启动/重启自动钩子**：sweep 仅在手动调用该命令时触发，重启后 pending 条目不会自动并入；无显式 pending→confirmed 状态机，pending 状态也未向用户暴露。
- **settings 有界淘汰**：成立。`commitInQueue` 每次 `capEntries` 按项目独立保留最新 20 条 + dedupeById，单测覆盖单项目/多项目/空输入。
- **四链挂点仍真**：ask-apply / WBS import / report snapshot / meeting 四链仍均调 `recordProvenance`；但 M-1（report basis 未挂）、M-2（meeting 自指）、M-3（版本硬编码1）本轮**未改**。
- **离线降级文档/静态置信说明**：面板仅静态「置信度：未提供」文字（panel.tsx:1911），无台账视图；F07 离线降级本批未注入模型错误测试。

### 6.4 第二轮后仍未消除的阻塞/缺陷
- **B-1（仍阻塞，部分缓解）**：台账可读路径已新增（ask-provenance 命令），但 `recheckProvenance/classifyStale/validateSourceRefs` 仍零接入；失效置灰、重校不冒充 fresh、按来源展开只读查看（F05/F06/F12）产品闭环仍缺。
- **B-2（仍阻塞）**：sweep 非自动、F13 无显式状态机、pending 未暴露；自动半成功补偿不成立。
- **B-3（仍阻塞）**：四链真实集成/重启/未知版本/恶意文本边界测试仍缺；store「并发双写」并无 Promise.all 并发用例（仅顺序 await 两条），fake-domain 的 `table()` 不分键、非真实 PmDomain。
- **M-1/M-2/M-3（未修，放行前必修）**：report 确定性数字依据未进 refs；meeting 自指；snapshotVersion/ruleRevision 硬编码1。
- 次要 m-1~m-5 保留。

### 6.5 第二轮总判定
自动化回归仍全绿、F14 守卫与审计、有界淘汰、纯函数核心维持 PASS；**整体候选仍 NOT PASS**：B-1 残余/B-2/B-3 未补，M-1/M-2/M-3 未修，补前不得放行。UI（F01/F02/F05/F06/F16）待 G3 采证；L3 真实模型 MANUAL_PENDING。

## 7. 第三轮补齐复验（2026-10-17，同一 HEAD `21cdc94`）

### 7.1 绑定
- HEAD 仍 `21cdc94`；第三轮 tracked diff（src+scripts）SHA-256：`822bf3b90687b9d1d27d6d73b374de5eaa72abed33dc17ef22ccc40687dc14f4`。
- `provenance.ts`/`provenance.test.ts` 字节未变；`provenance-store.ts` 与 `provenance-store.test.ts` 本轮改动（store 由 9 例增至 10 例）。

### 7.2 独立复跑（证据 `evidence-p2-6-r3-20261017/`）
| 门 | 结果 |
|---|---|
| build | PASS 退出0 |
| vitest | PASS 185/185，16 文件（store 10 例，provenance 11 例） |
| coverage | PASS 退出0，52.84 stmts / 85.32 branch，无回退 |
| verify-isolation | PASS 73/73，169 资产 before=after 零污染 |
| e2e | PASS，console errors=0 |

### 7.3 声称项核真
- **F13 只读命令 `/pm ask-provenance <projectId>`**：成立。`handleAskProvenanceCommand`（ask.ts:269）先 `sweepPending` 再 `listProvenance` 返回 `{ entries: ProvenanceLedgerEntry[] }`；index.ts:185 已注册。UI 确认后 best-effort 拉取（panel.tsx:1810）并渲染只读来源列表（summary + refs：table/label/role，basis=依据/context=上下文）。
- **sweepPending 闭环**：成立（局部）。pending 经 sweep 并入时置 `status=confirmed`（store.ts:205），第 10 例断言 pending→confirmed 且可读；但**无启动/重启自动钩子**，仅手动命令/确认后拉取时触发。
- **UI 静态限制提示**：面板保留静态「置信度：未提供」；本轮新增只读来源列表，但**无影响 diff 预览、无撤销冲突明细面板、无失效置灰/重校**。
- **F14/有界淘汰/纯函数**：维持第二轮结论（PASS）。
- **M-1/M-2/M-3 本轮仍未修**：report context 仅 reports 自指、meeting 自指、四链版本硬编码1。

### 7.4 放行前置判断（两项）
1. **#15 完整 UI（来源面板/影响 diff 预览/撤销冲突明细）是否必须：本批非强制阻塞，列后续。**
   - 最小只读来源列表已具备，可满足「可看本次依赖对象」；影响 diff 预览（F02 预览核对）与撤销冲突明细面板属体验完整度，可挂 G3 视觉批后续补，不作为离线放行硬阻塞。但 F14 拒绝时的冲突原因至少需在可见处给出（当前仅命令文本，UI 无明细区）。
2. **四链真实领域命令级集成 + 重启读回是否必须：是，强制阻塞。**
   - 纯函数/fake-domain 单测/headless 命令不能证明 ask/WBS/report/meeting 四链经真实领域落库并可读回；X2 重启读回必须用真实持久化 settings 断言。未补前不得宣称端到端可用。

### 7.5 第三轮总判定
回归全绿、F14/有界淘汰/纯函数/只读来源列表维持 PASS；**整体候选仍 NOT PASS**。

### 7.6 给开发的明确阻断项清单（补前不得放行）
- **B-3（强制）**：补四链真实领域命令级集成测试 + 重启读回（X2）断言；补未知版本/恶意文本边界；补并发双写用例（当前无 Promise.all 并发）。fake-domain 不分键、非真实 PmDomain，不能替代。
- **B-1（强制残余）**：接入 `recheckProvenance/classifyStale/validateSourceRefs`，补失效置灰/警告条与重校不冒充 fresh（F05/F06/F12 产品闭环）。
- **B-2（强制残余）**：补启动/重启自动 sweep 钩子，或明确说明手动补偿；F13 显式状态并向用户暴露 pending 状态。
- **M-1/M-2/M-3（放行前必修）**：report 把任务/里程碑确定性数字依据进 refs；meeting 如实标注自指（不冒充上游溯源）；四链改为真实 snapshotVersion/ruleRevision，消灭版本死分支。
- 次要 m-1~m-5 列后续。
- UI 影响 diff 预览/撤销冲突明细面板挂后续 G3 视觉批，非本批硬阻塞。

## 8. 第四轮复验与放行前置判定（2026-10-17，同一 HEAD `21cdc94`）

### 8.1 绑定
- HEAD `21cdc94`；tracked diff（src+scripts）SHA 仍 `822bf3b9…14f4`（代码相对 r3 无增量）。
- 新增未跟踪脚本 `scripts/verify-provenance.mjs` SHA `95521b41be1268f3335a7aa7faa8f8e7fad0de056ad320382494906a3b12b5f1`。

### 8.2 独立复跑（证据 `evidence-p2-6-r4-20261017/`）
| 门 | 结果 |
|---|---|
| build | PASS 退出0 |
| vitest | PASS 185/185，16 文件 |
| coverage | PASS 退出0，52.84 stmts / 85.32 branch |
| verify-isolation | PASS **74/74**（新增 verify-provenance.mjs），169 资产零污染 |
| e2e | PASS，console errors=0 |
- 注：首轮隔离日志中 verify-provenance.mjs 退出1 为旧草稿（断言文案与现文件不符），重跑后当前版本 74/74 全绿。

### 8.3 verify-provenance.mjs 真实覆盖度核真（关键）
脚本自陈用「对齐表形状的内存假域」，**未驱动四个真实领域命令、非真实磁盘/新进程**。逐项：
- 四链「落库一致」：仅直接调 `recordProvenance` 注册四种 kind，**未走** handleAskApply/WBS导入/汇报快照/会议纪要真实命令 → 不能证明四链命令级挂钩（仍靠代码走读）。
- F13 补偿：预置 pending 行后 sweep 转 confirmed + 幂等，假域成立；**未真实注入账本写失败**，无重启自动并入。
- 并发：Promise.all 两条但各自生成新 id，非同目标冲突/丢失更新断言，**未验证串行队列防丢**。
- 「重启读回」：structuredClone 到新内存域，**非真实磁盘落盘/子进程重开**，不满足 X2 重启读回。
- 脏行忽略、恶意文本数据层原样保留、F14 审计+used：假域成立。
- 仓库已有可复用真实磁盘模式（verify-ask-idempotency-integration.mjs：cordis+JsonStorageBackend(tmpdir)+子进程重开同 root；verify-r12.mjs「全新进程读回」），故「独立脚本无法建真实 domain」非硬约束，只是本脚本的范围选择。

### 8.4 放行前置判定（测试给建议，最终由产品负责人拍板）
**Q1 影响 diff 预览 / 撤销冲突明细是否 P2-6 发布前置？——视觉面板均非前置；守卫行为本身是前置（已 PASS）。**
- 影响 diff 预览（F02 确认前展示将改实体+字段）：属既有 ask 体验增强，非溯源治理核心闭环，建议挂后续批次/G3 视觉批。
- 撤销冲突明细面板：F14「拒绝静默覆盖人工新改」守卫行为必须 PASS（纯函数已单测），已成立；冲突项明细的**视觉面板**非前置，命令文本已列冲突对象，呈现挂 G3 后定。

**Q2 verify-provenance 集成门是否满足 F13/F14 重启/并发/补偿验收？——不满足。**
- 当前为内存假域：重启读回非真实磁盘/新进程、并发非同目标、F13 未真实失败注入、四链未走真实命令。需新增真实磁盘脚本（复用 idempotency-integration 的 openDomain+子进程模式）覆盖：四真实命令落库、X2 重启读回、F13 真实写失败→pending→重启 sweep 并入、F14 冲突守卫+审计落盘读回、同目标并发不丢。

**Q3 UI 视觉相关是否 G3 采证后再定？——是。** 来源面板/限制提示的视觉、对齐、可读性待 G3 真实浏览器采证；静态/自动结果不当视觉 PASS。

### 8.5 第四轮阻断清单与推荐顺序（不替用户拍板，仅推荐）
1. **（强制·最高）真实磁盘集成脚本**：四真实命令落库 + 子进程重启读回(X2) + F13 失败注入/补偿 + F14 守卫审计读回 + 同目标并发。现有内存脚本可保留为假域回归，不能顶替。
2. **（强制·B-1残余）** 接入 recheck/classifyStale/validateSourceRefs，失效置灰/重校不冒充 fresh（F05/F06/F12）。
3. **（强制·B-2）** 启动/重启自动 sweep 钩子或明确手动补偿；pending 状态向用户暴露。
4. **（放行前必修·M-1/M-2/M-3）** report 确定性数字依据进 refs；meeting 如实标注自指；四链真实 snapshotVersion/ruleRevision。
5. **（非前置·后续/G3批）** 影响 diff 预览面板、撤销冲突明细面板。
6. UI 视觉待 G3 采证。

### 8.6 第四轮总判定
回归全绿、假域账本/F14/有界淘汰/只读来源列表维持 PASS；**整体候选仍 NOT PASS**：真实磁盘集成（B-3）未达标，B-1残余/B-2/M-1/M-2/M-3 未消。

## 9. 第五轮复验与候选放行结论（2026-10-17，同一 HEAD `21cdc94`）

### 9.1 绑定
- HEAD `21cdc94`；tracked diff SHA `822bf3b9…14f4`，与 r4 工作树一致（无新增代码 delta）；verify-provenance.mjs SHA `95521b41…b5f1`。

### 9.2 独立复跑（证据 `evidence-p2-6-r5-20261017/`）
| 门 | 结果 |
|---|---|
| build | PASS 退出0 |
| vitest | PASS 185/185，16 文件 |
| coverage | PASS 退出0，52.84 stmts / 85.32 branch |
| verify-isolation | PASS 74/74，169 资产零污染 |
| e2e | PASS，console errors=0（仅渲染种子任务，未触发 AI 确认、未读台账） |

### 9.3 verify-provenance.mjs 核真（真驱动账本 API / 假域形状 / 断言强弱）
- **真驱动真实账本 API**：是。直接调用 `recordProvenance/listProvenance/sweepPending/recordUndoOutcome`，断言 confirmed/置信未提供/refs 保留/幂等/脏行/恶意文本/F14 审计 used。
- **内存假域形状与真实表一致**：是。settings 表固定行 `pmProvenanceLedger/pmProvenancePending`，行形状 `{value:{entries},updatedAt}` 与 store.readRows 解析一致；只实现 get/entries/put，对齐真实 storage-domain。
- **四链挂钩是否真实**：代码挂钩真（ask:420 / task-import:618 / report:122 / meeting:165 均调 recordProvenance），但**脚本未驱动四个真实命令**，只直接注册四种 kind，故不构成命令级集成证明。
- **断言弱点**：①并发 Promise.all 两条各自新 id，非同目标冲突/丢失更新；②「重启读回」=structuredClone 到新内存域，非真实磁盘/新进程；③F13 预置 pending 行而非真实注入账本写失败；④四链仅注册 kind 不验证命令真正落账。

### 9.4 真实宿主 storageDomain 命令级集成如何补充（推荐，最终拍板留用户）
- **现状 e2e 同路径不够**：e2e 走真实宿主+隔离 DSH_HOME+headless Chrome，但只渲染种子任务/console.clean，未触发 AI 确认、未读 settings 台账，不能证明四链命令落账与重启读回。
- **推荐（确定性放行门，首选）**：新增独立真实磁盘脚本（复用 verify-ask-idempotency-integration.mjs 的 cordis Context + JsonStorageBackend(tmpdir) + 子进程重开同 root 模式），不依赖宿主 profile。覆盖：四真实命令落账、X2 子进程重启读回、F13 真实写失败→pending→重启 sweep 并入、F14 冲突守卫+审计落盘读回、同目标并发不丢。理由：仓库已有同模式先例、可离线确定性复现、不引入浏览器/模型不确定性。
- **可选补充（贴近真实）**：扩展 e2e 在隔离 DSH_HOME 内走一次确定性 AI 确认（DSH_PM_E2E 缝），确认后读磁盘 settings 台账行并断言，再重开实例读回；用于覆盖 UI→命令→持久化通路，但不应替代确定性磁盘门。
- **不推荐**：为跑命令单独起常驻隔离实例靠人工/截图验收；确定性行为应由脚本断言，视觉才交 G3。

### 9.5 放行前置最终判定
- **影响 diff 预览 / 撤销冲突明细面板：非 P2-6 发布前置（视觉面板挂后续/G3 批）**；前置的是 F14「拒绝静默覆盖人工新改」守卫行为（已 PASS）。
- **真实磁盘命令级集成 + X2 重启读回：强制阻塞（B-3）**，未补不得放行。
- **UI 视觉相关：G3 采证后再定**，静态/自动不当视觉 PASS。

### 9.6 F01–F16 / X1 / X2 逐条（r5）
- PASS（静态/纯函数/守卫）：F08 置信诚实、F11 置信不按来源数、F14 撤销拒覆盖+审计、X1 安全转义。
- PARTIAL：F03 零写/幂等（现网沿用未重测）、F04 撤销限制/回滚/留痕（TTL/used 沿用+F14接入）、F05 来源证据（只读列表，无跳转/历史）、F10 指纹+scope（纯函数过，版本硬编码 M-3）、F13 半成功（手动 sweep，无自动钩子/失败注入 B-2）、F15 四链（挂钩真，M-1/M-2/m-2 未修，无集成测试 B-3）。
- BLOCKED：F06 失效置灰（未接入）、F12 重校不冒充 fresh（未接入）、X2 重启读回（无真实磁盘）。
- NOT_RUN：F01 四类可区分、F02 预览可核对、F07 离线降级注入、F16 历史中性+离线CRUD。
- MANUAL_PENDING：F09 真实模型闭环（L3，不由 mock 顶替）。

### 9.7 候选放行结论与阻塞项
**候选 NOT PASS，不可放行。**
强制阻塞：①B-3 真实磁盘命令级集成+X2 重启读回（§9.4 推荐脚本）；②B-1残余 接入 recheck/classifyStale/validateSourceRefs（F06/F12）；③B-2 启动/重启自动 sweep 或明确手动补偿+pending 暴露。
放行前必修（主要）：M-1 report basis 进 refs、M-2 meeting 如实自指、M-3 真实版本号。
非前置后续：F02 影响 diff 预览面板、撤销冲突明细面板、F01/F07/F16 补测；UI 视觉待 G3。

## 10. 协调裁定（2026-10-17，独立测试认可）
1. **WBS task import confirm = 人工导入，不记 AI 来源**：不补 hook，按 F16「来源未记录」中性态，磁盘断言改为「import 后不产生 AI 来源条目」（F16 覆盖 import 分支）。
2. **汇报 narrate confirm = AI 叙述确认**：补 recordProvenance hook（修 M-1，任务/里程碑确定性数字依据进 refs）+磁盘/重启断言。
3. **会议 summarize confirm（离线需 llm）**：L2 真实命令+隔离台账+fake gateway 确定性 stub，驱动真实处理器建会落账，离线可复现（修 M-2）。
- 据此 B-3 真实磁盘门的 AI 链为 ask-apply / report narrate / meeting summarize（WBS 移出 AI 链，改 F16 负断言）；验收明细见实施计划 §6.8。此裁定不改变当前候选 NOT PASS 结论。

## 11. 第六轮独立复验（B-3 磁盘集成，2026-10-17）

### 11.1 绑定与独立全门（不采信开发自测）
- HEAD `21cdc94`（未提交工作树）；tracked diff SHA `70d07824…c6eb9`；新增 `verify-provenance-disk.mjs` SHA `c78eb984…c6eb9`（187 行）。
- 独立复跑：build exit0；vitest **187/187**（16 文件）；coverage exit0（52.84 stmts / 85.32 branch，无回退）；verify-isolation **75/75**、169 资产零污染；e2e PASS、console errors=0；磁盘脚本单独直跑 PASS。证据 `evidence-p2-6-r6-20261017/`。

### 11.2 代码核读（真实 hook / 缓存性质）
- **汇报链（M-1 部分修复）**：`progress-report.ts` narrate confirm(:107-131) 与 narrateuse(:149-172) 均建 recMap(reports/tasks/milestones)，项目任务经 `context` 进 refs，recordProvenance best-effort。任务数字已进 refs，但角色标 **context 而非 basis**（buildSourceRefs 仅 actions→basis）；磁盘脚本只断言条目存在/置信/confirmed，**未断言 refs 数字依据存活**。
- **会议链（M-2 修复）**：`meeting.ts:153-175` basis=新建会议，context=行动项真实关联任务，如实声明「原始逐字稿不持久化」，无自指伪引用。离线复用靠进程内 `draftCache = new Map`（`meeting-summarize.ts:94`，**非磁盘**）；confirm 先 `recallSummary(key)` 命中即跳过 llm，key=`projectId\n+transcript` 与脚本预填一致，进程内确定性可复现。
- **WBS 人工导入（F16）**：`task.ts:416` importTasksFromMarkdown 后**无 recordProvenance**，负断言成立；注意 `task.ts:618` 的 `wbs-import` 是 AI WBS 草稿 confirm（应落账，正确），与人工 markdown 导入是两条路径。
- **B-2 基本关闭**：`index.ts:112` 启动/装载自动 sweepPending；`ask.ts:267/287` 查询前 lazy sweep 并响应暴露 pendingCount。

### 11.3 B-3 修订验收逐项回填（§6.8）
| 验收项 | 结论 | 证据/偏差 |
|---|---|---|
| ask-apply 落账→子进程重启读回 | **PASS** | 真实 cordis+JsonStorageBackend(tmpdir)+spawnSync 新进程；child 读账本+任务，断言 kinds+assignee=赵六 |
| report narrate hook→重启读回 | **PARTIAL** | hook 真、条目持久化可读回；refs 数字依据未断言、任务标 context 非 basis |
| meeting summarize 离线 stub→建会落账→重启读回 | **PARTIAL** | 进程内 recall 跳过 llm 确定性成立；draftCache 非磁盘，重启后不重派生（child 仅读已持久化台账）；持久化读回 PASS |
| WBS import 负断言（无 AI 条目） | **PASS** | 导入前后台账条数相等 |
| F13 真实写失败→pending→重启 sweep 并入 | **PARTIAL** | pending 行直接 seed（非真实写失败注入）；sweep 在主进程幂等并入，未测「重启后再 sweep」 |
| F14 冲突守卫+审计落盘读回 | **PARTIAL** | seed 假行后 recordUndoOutcome 标 used+undone 事件；未端到端跑真实 clean→restore/changed→refuse |
| 同目标并发不丢 | **PARTIAL** | Promise.all 相同动作重放幂等、updatedAt 不推进；非两个分歧补丁的真实竞争/丢失更新 |

### 11.4 B-3 关闭判定
**B-3 核心（真实磁盘命令级集成 + X2 重启读回）= PASS，可关闭**：真实处理器、真实磁盘、新进程读回已成立。F13/F14/并发为合成种子与幂等重放，深度不足，降级为次要观察项（F14 守卫纯函数/store 已单测覆盖，不重复阻塞）。

### 11.5 候选整体放行结论（r6）
- **仍 NOT PASS，不可放行。**
- 已消：B-3 核心、B-2（自动 sweep+pendingCount）、M-2（会议如实自指）、M-1 部分（任务进 refs）。
- **仍阻塞**：B-1残余（F06/F12：recheckProvenance/classifyStale/validateSourceRefs 未接入命令/UI，仅 ask.ts:273 注释预留只读视图）。
- **仍放行前必修**：M-3（四链 snapshotVersion/ruleRevision 仍硬编码 1：ask:433、report:124/165、meeting:168、task:616，版本失配比较死分支）。
- 次要：m-1 ask refs 取 accepted 未只取 applied；m-2 wbs-confirm 新任务误标 op=task.update(:613)；m-3 postimage fallback 自比 clean；m-4 混合撤销即烧 used；m-5 pending 重试只去重不 cap。
- 非前置：F02 diff 预览/冲突明细面板、F01/F07/F16 补测；UI 视觉待 G3。

## 12. 第七轮独立复验（M-3 常量 + B-1 ask-recheck，2026-10-17）

### 12.1 绑定与独立全门
- HEAD `21cdc94`（未提交）；tracked diff SHA `1510489d…0439`。
- 独立复跑：build exit0；vitest **190/190**（16 文件）；coverage exit0（52.84/85.32 无回退）；隔离 **75/75**、169 资产零污染；e2e PASS、errors=0；磁盘脚本单独直跑 PASS。证据 `evidence-p2-6-r7-20261017/`。

### 12.2 M-3 核真（已修）
- 常量 `CURRENT_SNAPSHOT_VERSION=1`/`CURRENT_RULE_REVISION=1`（provenance.ts:396-397）；四处生产调用（ask:455、report:124/165、meeting:168、task:616）与 store:244 均改引用；grep 无生产硬编码残留（仅测试夹具保留字面量，合规）。**M-3 关闭。**

### 12.3 B-1 ask-recheck 核真（命令层已接入）
- 路由 `index.ts:190-191` `ask-recheck`→`handleAskRecheckCommand`（ask.ts:295）；真实调 `validateSourceRefs`+`recheckProvenance`（内部 classifyStale），`recordRecheck`（store:231）经串行队列持久化。
- 失效行不删除；汇总仅 `consistent` 计 supported（ask.ts:307）；`recheckProvenance` 在旧 history 末尾追加一条冻结新条目（展开 prev.history 后并入 entry），不可变追加、旧结论不洗白（provenance.ts:303）；磁盘脚本 :152-160 真实驱动命令并断言 history 持久化。
- 单测覆盖 missing→manual-review、changed→needs-regen、二次重校 history 由1→2 旧条目保留、invalid 单列不删。**B-1 命令层关闭。**

### 12.4 r7 候选整体结论
- **核心治理确定性门（F08/F10/F11/F13/F14/F15/F16命令/X1/X2 + B-1/B-2/B-3/M-1部分/M-2/M-3）= PASS 候选。**
- **仍 NOT 整体放行（非阻塞核心、列残余/后续）：**
  - UI 展示层 NOT_RUN：面板无失效置灰/按来源展开/重校结果渲染（F05/F12 产品 UI），命令已可用但界面未呈现；待 G3/后续。
  - 次要未消：m-1 ask refs 取 accepted 未只取 applied；m-2 wbs-confirm 新任务误标 op=task.update；m-3 postimage fallback 自比 clean；m-4 混合撤销即烧 used；m-5 pending 重试只去重不 cap。
  - 深度观察（不阻塞）：F13 非真实写失败注入；F14 磁盘为 seed 行未端到端冲突；并发为相同动作幂等非分歧竞争；report 任务标 context 非 basis；meeting draftCache 非磁盘；F02 diff 预览/冲突明细面板、F01/F07 非前置；F09 L3 真实模型 MANUAL_PENDING。
- **判定：P2-6 核心/治理离线确定性能力达到 PASS 候选；整体合入发布仍需 UI 展示层 + G3 视觉 + 上述次要项收口，不凭本轮绿直接放行。**

## 13. 第八轮独立复验（m-1~m-5 收口，2026-10-17）

### 13.1 绑定与独立全门
- HEAD `21cdc94`（未提交）；tracked diff SHA `5e284636…69e9`。
- 独立复跑：build exit0；vitest **193/193**（16 文件）；coverage exit0（52.84/85.32 无回退）；隔离 **75/75**、169 资产零污染；e2e PASS、errors=0；磁盘脚本单独直跑 PASS。证据 `evidence-p2-6-r8-20261017/`。

### 13.2 m-1~m-5 逐项核真（代码+断言）
| 项 | 修复 | 核真 |
|---|---|---|
| m-1 refs 只取 applied | ask.ts:458 buildSourceRefs actions=`appliedActions`；跳过(:425 continue)/拒绝(:443)/失败(:440 catch)不入 | **PASS** |
| m-2 WBS 新任务 op | task.ts:613 `op:'task.create'`；OP_TABLE(task.create→tasks) provenance.ts:16-27 | **PASS** |
| m-3 缺 postimage 不自比 | ask.ts:228 缺省传 `capturePostimage(table,undefined)`；classifyUndoTarget `!postimage.exists→absent/skip`（provenance.ts:343），不再自比 clean 绕过守卫 | **PASS** |
| m-4 混合撤销不烧 used | ask.ts:248 仅 `conflicts=0 && failed=0` 才 `record.used=true`；冲突/失败保留 used=false 可重试 | **PASS（代码核读）** |
| m-5 pending 有界 cap | store.ts:160 写入前 `capPendingEntries`（dedupeById.slice(-CAP)，:105）；单测 :181-185 | **PASS** |

### 13.3 测试覆盖说明（诚实标注）
- m-2/m-3/m-5 有单测/纯函数覆盖；m-1 refs 只取 applied、m-4 used 烧毁时机在 ask 命令流程内，**无独立自动化断言**（无 ask.test；磁盘脚本驱动 ask-apply 但未跑混合撤销 used 分支），本轮为代码核读确认，建议后续补命令级用例（非阻塞）。

### 13.4 P2-6 最终状态
- **核心 + 治理 + 次要（m-1~m-5）已收口，离线确定性能力 = PASS 候选。**
- **剩余仅 UI 展示层（非核心、排 G3/后续）**：F05 来源分组展开/跳转、F12 重校结果渲染、F06 失效置灰；命令层 ask-provenance/ask-recheck 已可用。
- 非前置/后续：F02 diff 预览/冲突明细面板、F01/F07；F09 L3 真实模型 MANUAL_PENDING；深度观察（F13 真实失败注入、F14 端到端冲突、分歧并发、report basis 角色、meeting 缓存非磁盘）不阻塞放行。
- **整体结论：P2-6 后端/治理离线确定性 PASS 候选；发布合入仍待 UI 展示层实现并随 G3 视觉门验收，不凭自动化绿单独放行。**




