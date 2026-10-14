<!--
产出角色：资深产品经理 / 架构契约落档
日期：2026-10-14（docs-only，未改 src/requirements/decision-log/testing，未提交）
变更摘要：v0.7.0 发布后「协作就绪」最小架构契约。只读审计现有存储/写队列/updatedAt·baseline/settings/ask-apply/审计 history/ID 生成/snapshot API 后，定义一份「单用户优先、多人协作可演进」的稳定边界：actor/tenant/project scope、乐观并发 revision、幂等键命名与 TTL、审计事件、冲突响应、纯派生视图、远程 storage 适配层。核心裁决——本协作批 C1 只预留字段位与接口缝、零行为变化；C2/C3 才逐步落地。幂等成功标记按稳定性批 S2 裁决短 TTL 落本地 settings（in-flight 仍内存），不落业务台账。协作阶段代号 C1/C2/C3，刻意区别于稳定性批用例编号 S1/S2/S3。附开发验收红线。
-->

# 11 · 协作就绪架构契约（单用户优先 · 多人协作可演进）· 契约已定 · docs-only

> 本文是 pm-tool 从「离线单用户本地插件」走向「未来多人协作」的**唯一架构契约**。它不承诺现在就支持多人——三条红线（**离线优先 / 单用户本地 / 所有写动作经统一写通道**）一条不破；它只规定：**现在哪些字段位、接口缝必须预留下来，使得将来接远程存储时不必推翻重写；同时明确哪些事现在坚决不做，避免过早引入网络、账号、合并逻辑。**
>
> **状态（2026-10-14）：契约稿，docs-only。** 本批不改 `src/`、不改 `docs/requirements.md`、不改 `docs/decision-log.md`、不改 `docs/testing/`、不提交。落地时按本文 §十的 C1 清单执行，并在 decision-log 记 ADL、changelog 留痕（届时另行授权）。
>
> **基线代码事实（只读核查结论，勿重复调研）：**
> - 单 domain `pmtool`（`src/core/storage.ts`，version 2，compatibleVersions `[1]`，layout `per-record`），9 表：`checks / settings / projects / tasks / milestones / risk_issues / meetings / reports / deliverables`。**未声明也未使用 `global` 单例槽。**
> - 磁盘布局 `data/pmtool/<table>/<key>.json`，信封 `{ "version": n, "record": {...} }`；单记录写入由 `dsh-storage-json` 保证（同目录临时文件 → fsync → rename → 目录 fsync）。
> - **双层写链**：① 平台层 `dsh-storage-domain` 每条域一条写链——先 await 后端持久化成功，再改内存，最后发 `domain/changed`；读是同步内存快照，`entries()/keys()` 是写序列稳定的快照视图。② 业务层 `enqueueDomainWrite`（`core/projects.ts`，WeakMap 单飞队列）——为跨记录不变量（同名查重、成环检测、引用保护）把「读检查 + 落盘」绑在同一串行段。
> - 记录都有 `id`（字符集 `[a-zA-Z0-9_-]+`，正好等于 per-record key 路径约束）、`createdAt`、`updatedAt`（ISO 墙钟）。**全库没有 revision/etag、没有 actor、没有 tenant 字段。**
> - ID 分配是**全局 scan max+1**：`p-0001`（projects.ts）、`t-0001`（tasks.ts），跨所有项目取最大序号 +1。这是单写者假设下的便利写法，多写者会撞号（本文 §十登记为 C3 已知风险，现在不修）。
> - `ask-apply`（`src/commands/ask.ts`）已自带一套**客户端乐观并发雏形**：草稿生成时拍 `baseline = { [taskId]: updatedAt }`；应用时若 `rec.updatedAt !== baseline[id]` 则判「内容已被他人更新，为避免覆盖未执行」并跳过；同次调用内链式刷新 baseline。幂等现状：成功标记在进程内 `recentDrafts` Map，键 = `projectId + JSON(actions) + JSON(baseline)`，**TTL 60s，仅成功应用后才登记**；另有 in-flight Promise 去重。**稳定性批 S2 已冻结裁决**：把这条「成功标记」以短 TTL 持久化进本地 `settings` 表（跨重启/跨进程去重），in-flight Promise 仍只在内存——本文 §五据此修正口径。
> - 审计留痕**只有一处**：deliverables 内嵌追加式 `history: [{at, field, from, to, by, note}]`（`core/deliverable.ts`），`by` 是自由文本操作人；repoUrl/branch 变更刻意不记 history。**没有全局审计表，task/project 等变更不发审计事件。**
> - 派生视图范式：`core/derived.ts / health.ts / stats.ts` 全是读时纯函数、永不落盘。spec 预留了 `invalidRecords: 'backup-and-skip'`（给可丢弃的派生缓存用），v0.6 批裁决**不启用**、坏记录 clean-fail。
> - 远程接缝已存在：后端契约是 `StorageBackend.kv → KvFacet.open(descriptor) → KvUnit`（`KvUnit.loadAll/putRecord/deleteRecord/setGlobal/close`）。`KvUnit.putRecord` **是纯覆盖写、无 compare-and-swap**；平台注释明确「unit 不串行并发写，序列化责任在域层的写链」。`domain/changed` 事件注释写明「是后续跨进程推送（RPC frame）的事件源」。

---

## 一、一句话模型与总原则

**现在：一个本地用户、一个隐式租户、一个数据目录；所有写在一条进程内写链上串行，冲突在物理上不可能发生。**
**未来：同一个 domain 接口后接一个远程 `KvUnit`；多客户端各自写，靠「记录级 revision + 幂等键 + 冲突拒绝」收敛，绝不靠自动合并。**

五条总原则：

1. **域接口是唯一边界**：业务代码只允许碰 `PmDomain`（`table().get/entries/put/update/delete`）与 `enqueueDomainWrite`；**永远不允许直接 import / 调用 `KvUnit`**。远程化=换一个后端注入 `PmDomain`，业务代码零改动。
2. **单写者串行是今天的正确性来源，不要提前假设多写者**：本批不为并发加锁、不加事务、不加队列持久化；现有 `enqueueDomainWrite` 已足够。
3. **新元数据一律 optional、缺省即今天的行为**：像 v0.6 批的 `predecessorIds?` 一样——旧记录没有新字段也能被 schema 接受，不做批量迁移重写。
4. **显示时间 ≠ 并发令牌**：`updatedAt` 是给人看的墙钟；并发判定将来用单调 `rev`（整数），不是字符串相等。
5. **冲突一律「拒绝 + 报现状」，不自动合并**：人来决定重试/重编/强制。这条从 ask-apply 的现有行为上升为契约。

## 二、现状能力对账（审计结论）

| 能力 | 现状 | 距协作的差距 |
|---|---|---|
| 写串行 | 双层写链，进程内强串行 | 跨进程/跨机未定义（C3） |
| 记录版本 | 仅 `updatedAt`（墙钟 ms） | 无单调 `rev`；字符串相等在跨机时钟偏移下脆弱 |
| 操作人 | `project.owner`/`deliverable.by` 等自由文本，非身份 | 无统一 `actor`；但也**不是授权令牌** |
| 租户 | 隐式：一个本地数据目录 = 一个租户 | 无 `tenantId`；现在单租户不需要 |
| 项目边界 | 子记录都带 `projectId`，是真实归属边界 | 保持，未来项目=共享单元 |
| 幂等 | ask-apply 成功标记在进程内 Map，60s TTL，成功才登记；in-flight Promise 内存去重 | 稳定性批 S2 裁决：成功标记短 TTL 落 `settings` 跨重启；in-flight 仍内存；接口形态可复用 |
| 审计 | 仅 deliverables 内嵌 history | 无全局事件流；`domain/changed` 是现成原料 |
| 派生视图 | 纯函数读时算，不落盘 | 范式正确，固化即可 |
| 远程存储 | 仅本地 json 后端 | `KvUnit` 是预留接缝，未实现远端 |
| ID 生成 | 全局 scan max+1（`p-/t-`） | 多写者会撞号（C3 已知风险） |

## 三、范围模型：actor / tenant / project scope

三级范围，**从大到小**：

```
tenant（租户，隐式=本机数据目录）
└─ project（项目，projectId，唯一真实的归属/共享边界）
   └─ record（记录，id，带自己的 rev / actor / updatedAt）
```

- **tenant（不预留字段）**：现在物理上就是一个数据目录，**契约里不引入 `tenantId`**。理由：单租户加租户键只会污染所有记录 key 路径（per-record key 要进文件名），却零收益。未来真要多租户，正确做法是**每个租户开一个同名 domain 的独立后端实例**（或独立数据目录），而不是在记录里塞 tenant 列。→ C3 再议，现在连 optional 位都不占。
- **project（保持现状）**：`projectId` 已是 task/milestone/risk/meeting/report/deliverable 的强制归属键。它是将来「按项目共享给协作方」的天然单元。**不新增 project 成员表/权限表。**
- **actor（预留 optional 字符串）**：记录将来可带 `actor?: string`（最后写入者）。语义=**留痕标签，不是授权**。缺省=「本地当前用户」。它只回答「这条最后是谁改的」，不回答「能不能改」——权限属于 C3 的登录态，本批不碰。
  - 预留的写入口缝：写函数将来是 `addTask(domain, input, ctx?: WriteCtx)`，`WriteCtx = { actor?: string, idempotencyKey?: string, baseRev?: number }`。**新参数一律放最后、全 optional**，现有所有 callsite 一个字不改。

## 四、乐观并发与 revision

- **预留记录字段 `rev?: integer`**：记录的单调修订号，每次成功写 +1（由写链持有，不是客户端填）。缺省=旧记录，按 `rev=0`/未知对待，单写者下行为与今天完全一致。
- **为什么不用 updatedAt**：ask-apply 现在拿 `updatedAt` 字符串比相等，在单机是巧合可行；跨机时钟不同步 / 同毫秒两次写都会误判或漏判。`rev` 是整数单调、与时钟无关。
- **compare-and-enforce 放在哪**：`KvUnit.putRecord` 没有 CAS，所以**乐观并发校验必须在业务写链里做**——在 `enqueueDomainWrite` 段内：若请求带了 `baseRev`，先读当前 `rev`，不等即抛 `record-conflict`（见 §七），再落盘。远程后端将来可在 `KvUnit` 层做原生 CAS，但业务侧契约不依赖它。
- **C1 现在做什么**：**只是把 `rev?` 这个字段位和「写链内 compare」这个缝写进契约**；本批不真的在每次写时维护 rev、不在 schema 里加它（那是 C2）。原因：单写者下 rev 无消费者，提前写它只会动 schema/迁移口径。

## 五、幂等键命名与 TTL

把 ask-apply 现有雏形 + 稳定性批 S2 裁决固化为契约：

- **键的构成（正式定型，四段）**：`<projectId>:<actorSegment>:<有序动作指纹>:<基线指纹>`。语义=「某操作者在某份草稿基线、勾了某批动作」。重新生成草稿（基线变）或改勾选子集 → 天然是不同键，互不误拦。
- **actorSegment 现在就是四段之一，不是「将来才加的段」**：当前单用户下 `actorSegment = "local-anonymous"` 占位常量；将来接入真实身份时，**只替换这个段的取值、不改键的四段结构**。这样「不同人对同一计划的确认」从一开始就落在不同键上，不会被互相去重（对齐验收矩阵 R3）。禁止把当前 projectId 级键悄悄当成全局键。
- **TTL：60 秒**，集中常量可查。**只在一次真正成功的应用（appliedCount>0）之后才登记**；失败/冲突不登记，允许用户改完重试。**懒清理**：读时发现过期即视为无标记、不跑后台清扫器。
- **存储位置（本契约纠正点）**：
  - **成功标记 → 本地 `settings` 表持久化**（稳定性批 S2 已冻结，照 `model-route.ts` 的 `{ value, updatedAt }` 形态、固定键名、内嵌过期时间）。它的职责是**顺序重放防护**：重启/跨进程后同一确认再进来，返回「已执行」而非二次写库、更不会因 baseline updatedAt 不一致而误报冲突。它**不是业务台账、不是授权、不含动作正文等敏感内容**，只是「哪把键在何时成功过」的短 TTL 索引；写走 `enqueueDomainWrite`，不新表。
  - **in-flight 并发去重 → 仍只在内存**（Promise 无法、也无需持久化）。它负责**进程内并发互斥**（两路同请求共享一个 in-flight Promise，不双写）；重启后 in-flight 自然清空，由 settings 成功标记兜底防重放。
  - **二者职责切分**：settings 成功标记 = 跨重启/跨进程的「别再重放」；in-flight = 单进程内的「别双写」。**settings 标记不是跨进程互斥锁**——它不锁、不阻塞并发写，只做成功后的短 TTL 去重。
- **预留接口名**：抽象成 `IdempotencyRegistry` 接口（`checkAndClaim(key)`、`commit(key)`、in-flight Promise 去重）。**当前实现 = 本地 settings 表**；未来 remote 实现按键里既有的 `projectId + actorSegment` 作用域落到服务端键值表（结构不变，只是换后端），调用点不变。**幂等键绝不充当授权凭证。**

## 六、审计事件

- **现在：不建全局审计表。** 保留 deliverables 内嵌 history 的范式——**只有当某个变更本身有业务意义时（交付物状态/版本流转），才把变更追加在记录内**。repoUrl/branch 这类机械改动刻意不入史。
- **事件形状预留（复用 DeliverableChange 为模板）**：将来若要通用审计，事件体长这样：
  `{ at: ISO, actor?: string, table, key, op: 'put'|'delete', baseRev?: number, rev?: number, fields?: {field, from, to}[] }`。
- **现成原料**：平台层 `domain/changed` 已经在「持久化成功后、按写序」发 `{domain, table, key, operation, value}`（只带新值、不带旧值）。它就是未来的审计/同步事件流，**业务侧现在不需要自己再发一套**。要留痕时订阅它即可。
- **C1 现在做什么**：只登记事件字段名（上表）为预留；不加审计表、不订阅 `domain/changed` 落审计、不把 task/project 变更写进 history。

## 七、冲突响应

冲突判定树（未来写请求带 `baseRev` 时）：

| 情况 | 响应 |
|---|---|
| 记录不存在 | `not-found`，中文提示，零写 |
| 带了 `baseRev` 且 ≠ 当前 `rev` | **`record-conflict`**：拒绝覆盖，把当前记录与当前 rev 一并返回给调用方 |
| 未带 `baseRev`（今天的所有写） | 照现在直接写，无冲突概念 |
| 复合写（move+renumber / 级联删）中途失败 | 沿用现有「内存快照 + 尽力回滚」；**不承诺跨记录事务**（v0.6 已诚实声明） |

- **冲突后谁来裁决**：人。产品侧行为=「这步被跳过，告诉你现在那条长什么样」（正是 ask-apply 今天的 blocked 文案）。**禁止自动三方合并、禁止 silently take theirs/ours。**
- **预留错误码 `record-conflict`**：与现有 `DomainError`（`already-open/invalid-record/missing-key/closed`）和后端 `StorageError`（`version-mismatch` 等）并列，成为可 switch 的稳定判别码。C1 不抛它，只定名。

## 八、纯派生视图

- **铁律**：统计、健康分、WBS 缩进、阻塞前置、人员负载等，一律读时纯函数算（`derived.ts/health.ts/stats.ts/people-load.ts` 范式），**不落盘、不进 settings、不进备份计算口径清单的漂移面**。
- **为什么**：派生值可从权威记录重算，存下来只会产生「权威 vs 派生」不一致，多写者下更甚。
- **将来真要缓存派生结果**（C3 后）：用 spec 已预留的 `invalidRecords: 'backup-and-skip'` 开一个**独立的派生 domain/表**，坏了就移走重算——**绝不**把派生混进 9 张权威表。本批连这个缓存都不开。

## 九、远程 storage 适配层（未来接缝）

- **扩展点就是平台后端契约**：`StorageBackend.kv: KvFacet`，`KvFacet.open(descriptor) → KvUnit`，`KvUnit` 提供 `loadAll()/putRecord()/deleteRecord()/setGlobal()/close()`。今天注入的是本地 `dsh-storage-json`；将来写一个 `RemoteHttpKvFacet` 指向服务端即可。
- **为了将来能接上，现在必须守住的四条（已是现状，列为红线）**：
  1. 记录全是 opaque JSON，业务不假设文件格式；
  2. 所有记录 id 满足 `[a-zA-Z0-9_-]+`（per-record key 路径安全）——现状如此，**未来新表/新 ID 前缀必须继续遵守**；
  3. 业务只经 `PmDomain`，不碰 `KvUnit`；
  4. `domain/changed` 是唯一跨进程推送源，业务不要自建一套推送。
- **远程化会暴露、现在要记账的两个缝**：① `putRecord` 无 CAS → §四的写链内 compare 必须成立；② `loadAll()` 是全量快照 → 远端要能做增量/ETag，那是 C3，本批不设计。

## 十、协作阶段 C1 / C2 / C3：现在预留什么、坚决不做什么

> **命名消歧（重要）**：本文把未来协作演进分成 **C1 / C2 / C3** 三阶段——**这与稳定性地基批次自己的用例编号 S1/S2/S3（move 回滚聚合 / ask-apply 幂等落 settings / repo 真源收敛）是两套独立序列，切勿混淆**。其中 repo 真源指：正则/纯谓词/中文文案的真源在零依赖纯模块 `repo-format.ts`，`repo.ts` 仅为其上的 zod wrapper re-export，client 直引 `repo-format`（禁引 repo.ts，避免 zod 进浏览器 bundle）——本文不另立口径。稳定性批的 S2（成功幂等标记落 settings）是**现在就做**的加固，本文 §五已把它作为既定裁决纳入，不算在下面的 C 阶段里。
>
> C1 = 本契约批（现在，docs→预留守界）；C2 = 近未来「单人多端/局域网共享预览」；C3 = 完整远程多人协作。**箭头是演进方向，不是承诺排期。**

### 10.1 C1（现在）只做「预留 + 守界」，零行为变化

| 项 | C1 动作 |
|---|---|
| `rev?: integer` 字段位 | **定名预留**，本批不加进 schema、不维护 |
| `actor?: string` / `WriteCtx` 可选末位参数 | **定名预留**，本批不改函数签名 |
| 错误码 `record-conflict` | **定名预留**，本批不抛 |
| `IdempotencyRegistry` 接口 | **接口命名预留**；本地实现 = 稳定性批 S2 的 settings 持久化（成功标记短 TTL、in-flight 内存），本契约不另造实现 |
| 审计事件字段名（§六） | **登记为保留字**，不加表、不发事件 |
| 远程 `KvUnit` 边界 | 守住「业务不碰 KvUnit」这条红线即可 |

### 10.2 C2（近未来，需另行裁决才动工）

- 把 `rev?` 真正加进各记录 schema（optional，缺省兼容），写链维护 rev、请求带 `baseRev` 时做 compare、冲突抛 `record-conflict`。
- ask-apply 的 updatedAt 比较迁移到 `rev`（旧记录无 rev 时回退现状）；**冲突检测不得因重启而被降级成静默覆盖**（对齐验收矩阵 R2）。
- `WriteCtx.actor` 串写入入口，deliverable.history.by 与它对齐；幂等键正式四段含 `actorSegment`（现为 `local-anonymous` 占位，对齐 R3）。
- IdempotencyRegistry 的本地 settings 实现稳定后，remote 实现按 `project + actor` 作用域落地。

### 10.3 C3（完整多人，现在连 optional 位都不占）

- `RemoteHttpKvFacet`/服务端、登录态与真正的 actor 身份、权限。
- 多租户（每租户独立 domain 实例，**不**在记录塞 tenantId）。
- 跨进程 `domain/changed` 推送、`loadAll` 增量/ETag 同步。
- 全局审计事件流落地。
- **ID 生成改造**：当前全局 scan max+1 多写者会撞号；届时改为带写者/会话前缀或服务端发号。**现在不动。**

### 10.4 本批坚决不做（明确清单）

- 不写任何网络请求、不引入远程后端/HTTP/WebSocket/登录。
- 不加 `tenantId`、不加项目成员表/权限表。
- 不建全局审计表、不订阅 `domain/changed` 落库。
- 不做自动合并 / 三方 merge / silently take side。
- 不在每次写时维护 rev；**不把 in-flight Promise 持久化**（它是内存态）。成功标记按稳定性 S2 落 settings 是允许的、短 TTL 懒清理，二者不要混为一谈。
- 不改 ID 分配算法（撞号风险记账不修）。
- 不开 `backup-and-skip` 派生缓存、不把任何派生值落盘。
- 不做跨记录/跨进程事务、不做 WAL（沿用 v0.6 口径）。

## 十一、验收红线（开发用）

> C1 落地时（届时另起任务）逐条核对；任何一条不过即不通过。本批与 `docs/testing/stability-batch-acceptance.md` §5 的 R1–R4 架构红线同向，不另立冲突口径。

1. **边界红线**：`grep -rn "KvUnit\|dsh-storage-json\|dsh-storage'" packages/dsh-pm-tool/src` 必须为空——`src/` 下业务代码零直接引用后端类，只经 `PmDomain`。
2. **兼容红线**：本批新增的任何 optional 元数据字段，旧记录（无该键）读回必须行为与今天逐字节一致；不触发任何迁移重写；`compatibleVersions` 仍含 `[1]`。
3. **零行为变化红线**：单用户跑既有 9 表增删改查 + ask-apply，对外可观察行为与本批前一致——同样的输入得到同样的输出，只是契约里多了「预留字段名」。
4. **写通道红线（R1）**：所有写（含 settings 幂等标记、repo 更新）仍走 `enqueueDomainWrite` + `table.put/update`；不允许任何业务路径 `table.put` 绕过校验、不允许直接改内存记录。
5. **冲突红线（R2）**：C1 阶段不得出现任何「自动合并/取对方版本/静默覆盖」逻辑；冲突判定路径在 C1 不得被触发（因为还没有 baseRev）。**禁止**为「重启误报冲突」而放宽 baseline 不一致即拒绝覆盖——正确解法是幂等标记避免重放，不是弱化冲突检测。
6. **幂等红线**：成功标记 60s、仅成功后登记、落本地 `settings` 表（短 TTL、懒清理、非台账/非授权/不含敏感正文），职责是顺序重放防护；**in-flight Promise 仍只在内存、负责进程内并发互斥、不持久化**；settings 标记**不是跨进程互斥锁**；键正式为 `projectId:actorSegment:actions:baseline` 四段，`actorSegment` 现为 `local-anonymous` 占位（R3）。
7. **离线红线**：本批全程零出站网络请求（verify 可断言无 fetch/探测）。
8. **派生红线**：健康分/统计/负载等仍纯函数读时算；`grep` 确认它们不写业务 settings、不写新表（幂等标记占用的 settings 行是系统短 TTL 索引，不算业务派生）。
9. **key 字符集红线**：未来任何新记录 id 仍须匹配 `[a-zA-Z0-9_-]+`，保证 per-record 路径安全。
10. **范围红线**：本批只新增本文档与 product/README 索引行；不改 `requirements.md`/`decision-log.md`/`src/`/`docs/testing/`，不 `git commit/push`（提交推送按 collaboration.md 逐次授权）。

## 十二、状态与门控

- 本文为 docs-only 契约稿，**未改任何代码**，不触发测试门控（ADL-045 针对功能改动）。
- 后续 C1 落地、C2 动工均需项目所有者另行裁决；动工才按「需求 → 测试用例 → 开发 → 独立测试 → PASS」走门控。
- 与稳定性地基批 `docs/testing/stability-batch-acceptance.md` 的关系：本契约 §5 R1–R4 红线与该矩阵 §5 逐条同向；其中稳定性批 S2（成功幂等标记落 settings）是本批内已冻结的加固项，本文 §五已采纳，不重复定义。
- 与既有文档关系：承 `10-schema-v2-design.md` 的「optional 新字段 + 不做跨记录事务 + 纯派生不落盘」口径；不重复 `docs/collaboration.md`（那是多平台**开发流程**协作，本文是产品运行时**多人数据**协作，两层不同）。
