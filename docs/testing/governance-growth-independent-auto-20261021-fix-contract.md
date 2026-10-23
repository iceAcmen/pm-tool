# GG-01..04 最小修复复验合同

> 独立测试专家，trae，2026-10-21。只约束已承诺守卫，不新增功能或设计门。Main 已知四缺陷并负责产品修复；本专家不改产品/他人 testing，不 build 共享 lib，不启服务/碰 GUI/commit。严重度只用于排序，不默示豁免或放行。

## 1. 冻结与真实红证

冻结候选 `governance-growth-independent-auto-20261021-soAcAa`；HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`。tracked patch SHA256 `78f069c50d41a9d75641ac93774fe977d79d983e5905aa4f6752f6c2d64b8726`。生产源码复制到本专家自有 tmp，生产 tsc exit0；真实 Context + JSON backend + command handler，不是自造业务 mock。

证据根：[soAcAa evidence](governance-growth-independent-auto-20261021-evidence/governance-growth-independent-auto-20261021-soAcAa/)。`commands-domain.json` 每次含 rawInput、result、前后完整备份及 hash；`domain-results.json` 含真实 AssertionError。以下源 hash 均为**被测冻结源码**，不是正在改动的 Main 新源码。

| 缺陷 | 严重度 / 依据 | 源文件 SHA256 | 真实红证 |
| --- | --- | --- | --- |
| GG-01 / RA-AI05 | P1：确认已成功但创建来源缺失，来源/重校承诺不完整 | `src/commands/ask.ts` = `81d38ad25f9ce24e2f9dddb19e76359c37475600719c755a4af86dc0aa8c8a17`；`src/core/provenance.ts` = `0ae70ce81ac6b0ac744824c647746754ef9ee8dc981462731ff14ece5025335d` | `applied-create-provenance-*` 四项红；10步成功，四create已落库且undo postimages含新ID，但refs仅6个update来源 |
| GG-02 / RA-AI04 | P1：无人外改的合法两步链不能恢复原值 | `src/commands/ask.ts` 同上；`src/core/provenance.ts` 同上 | `clean-undo-restores-two-step-original` 红；t-0004只撤1项，assignee中间值被自己的过渡状态误判人工冲突 |
| GG-03 / RA-AI04 | P1：账本used与可重试句柄不同，误报撤销耗尽 | `src/commands/ask.ts` 同上；`src/core/provenance-store.ts` = `53aa3ecb1bb91e00b8563fce508bb14b768f3232a15c35c8504b02fceb2aa413` | `mixed-undo-conflict-not-burn-runtime-or-ledger` 红；`mixed-undo.json` used=true，但第二次命令仍进入冲突处理 |
| GG-04 / RA-P1001 | P2：仅缺席记录抢占Top1，违反仅折叠列示 | `src/core/queue.ts` = `0fc8b1c28e9c96dd539a09f9be34c3569d93f82c1cc2d5d2f6ee2d9a592a3405` | `absence-only-folded-not-top` 红；`queue-absence-only.json` top=t-0022、rest=[] |

## 2. GG-01 四类创建的真实新 ID

生产 gateway 的固定流输出保存在 `F6-gateway-draft.json`；`parsed` 与原actions深相等，生产 ask-apply 输入就是 parsed。确认详情见 `commands-domain.json` 的 RA-AI01 项与 `F6-nonempty-ledger.json`：

```text
/pm ask p-0001 整理两任务与四类来源
/pm ask-apply p-0001 <F6-gateway-draft.json 的 parsed JSON，完整10步>
/pm ask-provenance p-0001
```

上面的 JSON 占位必须由该文件实际 parsed 取值，不人工另拼计划；完整 rawInput 已冻结在 `commands-domain.json`。仅在同初态隔离上下文运行，不能照抄 ID 到正式库。历史 undo handle 是红证记录，不保证在新进程可使用。

| 已 applied step/op | 实际新记录 | 目前refs | 修后断言 |
| --- | --- | --- | --- |
| s7 / milestone.create | milestones/m-0002 | 缺失 | 成功dispatch返回的新ID进入appliedActions并构成对应basis ref |
| s8 / risk.create | risk_issues/ri-0002 | 缺失 | 同上，table映射真实，无另造risk表 |
| s9 / deliverable.create | deliverables/dlv-0002 | 缺失 | 同上，不用旧dlv-0001代替 |
| s10 / meeting.create | meetings/mtg-0002 | 缺失 | 同上，不用旧mtg-0001代替 |

修复边界：仅对**实际 applied** 的 create action 带回 dispatch 新 ID，保原create op/stepId；保持 whitelist、项目归属、预算/拓扑/部分成功。SourceRef 当前schema本身没有op字段，测试不发明`ref.op`。本例应有6个update + 4个create对应的10个真实来源，各有project/label/role/version/fingerprint；无重复错误归属。拒绝/跳过/失败行不得进refs；不扫全库、不能把预存但未applied的旁路同项目记录补成来源。

复验最小集：四项 `applied-create-provenance-*` 各转绿；保 `negative-whitelist-cross-project-wrapped-arrays-zero-write`、资料/日志保留；RA-AI02/03真实 changed/missing 两次重校和旧history追加不退。新 ID 不预写死为 m-0002 等，应按本次dispatch返回映射；上述 ID 仅为冻结红证。

## 3. GG-02 同目标链式逆序

真实初态t-0004 progress=0/assignee缺省。冻结调用：

```text
/pm ask-apply p-0003 [{"op":"task.update","id":"t-0004","patch":{"assignee":"甲"},"stepId":"s1","needs":[]},{"op":"task.update","id":"t-0004","patch":{"progress":62},"stepId":"s2","needs":["s1"]}] --base {"t-0004":"2026-10-21T13:30:51.495Z"}
/pm ask-undo undo-mvi5h54r-3z1onp
```

真实红返回：`已撤销 1 项（tasks/t-0004）；1 项因确认后已被人工修改而保留未动`。这个case没有外部修改；timestamp/handle在新运行须读取实际baseline与apply返回，不能复用过期值。

修后：应用2步→按s2/s1逆序恢复到**首步前完整原值**，不是仅清progress；每次逆序的内部过渡来自该批可信postimage/original链。外部全对象守卫保留，包括非关键字段updatedAt/full fingerprint变化；不能只检查progress/assignee、关闭比较或将当前值充当postimage。

必须保绿：`same-target-chain-baseline-two-steps`、`external-update-rejects-related-dependent-keeps-independent`（外改s1目标，s1/s2拒而s3成功）、`changed-only-undo-refuses-overwrite-runtime-retryable`、逐步两次确认、新进程句柄不存在。如果同目标末态有正常人修改，整条相关逆序不得覆盖人值；与独立目标的合法撤销分开处理。

## 4. GG-03 mixed used 与重试一致

真实独立目标初态：t-0004 progress=0，t-0005 progress=22。冻结调用：

```text
/pm ask-apply p-0003 [{"op":"task.update","id":"t-0004","patch":{"progress":44}},{"op":"task.update","id":"t-0005","patch":{"progress":66}}]
/pm task update t-0004 {"description":"确认后人改"}
/pm ask-undo undo-mvi5h5ag-5skm7l
/pm ask-provenance p-0003
/pm ask-undo undo-mvi5h5ag-5skm7l
```

第一撤销确实还原clean t-0005至22，并保人改t-0004 progress44/description；账本 `prv-mvi5h5ag-0be0az.undo.used=true` 为红，运行句柄仍可重试。红证 `mixed-undo.json` 连同audit保留。冻结第二次返回是冲突处理，不是“已撤销过/不存在”。

修后：partial/mixed有冲突或失败时，账本与运行句柄均used=false；冲突值原封不动，已合法撤销项不重写/不被重复算作新成功。合法再次调用能进入剩余处理；保既有冲突/失败审计历史，只追加不覆盖。clean全批完成时二者一致used=true、重复调用拒；changed-only仍一致false并拒覆盖。不得为修账本而烧毁mixed句柄，也不得恢复人改值来制造“全绿”。

m-4历史r8只核过runtime used时机，无mixed ledger自动断言；本红是新增精确核真，不重开其他r8未受影响断言，不把F13深故障/分歧并发观察升前置。

## 5. GG-04 absent 仅 rest

真实初态：p-0005仅t-0022 todo，无dueDate/关键blocked/P0，只有真实session绑定：

```text
/pm session bind t-0022 absence-only
/pm queue list p-0005
```

真实红：quietMode=false、top为`{taskId:"t-0022",absent:true,severity:"due"}`、rest=[]。修后top=null，rest仍含该absent记录，不隐藏结存。不将absent改成常驻通知，也不改open/list/snapshot职责。

保绿：普通due、blocked、P0严重度/迟到稳定，mute普通/rest/unmute、关键豁免、7天过期历史派生，quiet top空/rest保留/off恢复；list/snapshot不写业务，open仅写设置。具体真实命令/返回见 RA-P1001..03 与 RA-P2002 的 `commands-domain.json`，不能以queue单测19绿替代本absence-only生产命令。

## 6. 复验与其余 AUTO

本轮独立领域 **55 PASS / 7 FAIL / 0 BLOCKED**（55中1项是fixture，54为ID子断言）；7红归上述四缺陷、三个ID。其余29 ID有有限AUTO绿；不是整项/GUI PASS。相关既有unit独立复跑283/283，P0原件设施错误保留，纠正两处new的自有副本28/28；新进程内容/session回读2/2。不等Main修复才交这些原证。

Main并行文件事务修复已使`tasks.ts/task-materials.ts/file-asset-store.ts`在本轮后漂移。原被测包/红证完整冻结；新修复候选必须再认领sourcehash、实际依赖、确认dispatch与产物。重测四红及上述保绿、受影响任务/material集成；没有本专家签字前，不把作者verify总数或代码存在当GG关闭。GUI仍待Main同候选原证。
