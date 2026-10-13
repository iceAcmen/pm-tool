# Schema v2 验收矩阵（开发前冻结，只读基线 `80d42b8`）

> 目的：在 **schema v2 开发动手前**，由独立测试专家冻结验收矩阵与最小可判口径。本文件**只冻结用例与必含断言，不改产品代码、不改产品行为、不产生提交**；开发据此实现，测试专家据此独立逐格判 PASS/FAIL/BLOCKED/NOT_RUN。
> 权威流程：ADL-045（独立测试门控）+ ADL-047（自动化门 / 人工协作门 MANUAL_PENDING 分层）+ AGENTS 6A。本目录为测试专家独占，其他角色只读引用、不得改动。
>
> **被测基线（冻结时点）**：HEAD = `80d42b8`（`[doubao-work][evidence] 归档Web体验独立验收与主线状态`）。此基线 **不是** 未来被测提交；未来每条用例执行时必须另记真实 `testedCommit`，不得把本冻结时点当作任何 PASS 证据。
> **当前 v1 现状（冻结基线观测，供对口径，非 PASS）**：
> - 领域 `pmDomainSpec` version=1、`layout:'per-record'`，9 表（checks/settings/projects/tasks/milestones/risk_issues/meetings/reports/deliverables）。
> - `taskRecordSchema` / `projectRecordSchema` 均为 `z.strictObject`；**当前尚无** `predecessorIds`、`repoUrl`、`branch`、健康分、schemaVersion 任何字段。
> - 备份 `PmBackup`：`format:'pm-tool-backup'`、`formatVersion:1` 硬校验（`validateBackup` 拒 `!==1`）；`applyBackup` = 预检 `precheckBackup` → 有数据则写安全快照 → 逐表先 `delete` 全量再逐条 `put`；**当前无「中途失败回滚」、备份文件直写最终路径（无临时文件 + 原子 rename）**——这两点是本矩阵重点冻结缺口，**现状观测不等于合格**。
> - 门：`build` = `tsc -p && cp panel.css && tsdown`；`pnpm verify` = `build` + `verify-isolation.mjs` 串跑全部 `verify-*.mjs`（正式 guard 当前约 150 个文件）。
>
> **裁决冻结目标口径（开发须对齐，本矩阵据此验收）**：
> - 领域升 **v2，但 `compatibleVersions` 仍含 1**：旧 v1 记录可被读取；**对某条 v1 记录做一次更新后，该记录落盘迁移为 v2**（其余未触碰的 v1 记录不被强制批量改写）。
> - `predecessorIds` 属任务级；`repoUrl`/`branch` 属**项目级**；健康分**纯离线派生**（不新表、不写库，对齐 ADL-039）。
> - **备份文件 `formatVersion` 仍为 1、不随领域升级**：v2 运行库内带新字段的记录仍打进 `formatVersion:1` 备份并可往返；新增/受影响只体现在记录内容，不抬备份格式版本号。
> - `createBackup` 须**先写临时文件再 `rename` 到最终路径**，中断/失败清理残留；`restore` 中途失败须**自动回滚**（用例以**进程内故障注入**验证），**本门不声称跨进程 / 强杀级事务原子性**。
> - 悬空依赖由 **doctor 只报告、不自动自愈**；坏记录须 **clean fail 并点名记录 id/字段，禁止「旁路备份后跳过」式静默降级**。

## 0. 通用前置纪律（每条用例必带，缺一不判）

- 每条用例证据目录必须记录：`testedCommit`（实际运行的提交 40-hex）、`dirtyProductFiles=false`、运行环境（macOS arm64 / Node 版本 / pnpm 版本）。
- **隔离**：一切写库/写备份用例必须设 `DSH_PM_BACKUP_DIR` 指向 `mkdtemp` 隔离目录；断言默认 `packages/backups/` 在测试前后 `hashSet` 不变（对齐 `verify-backup.mjs` 既有口径），**不得污染正式数据**。
- 逻辑别名（如 `t-pre-01` / `p-v2-01`）仅为用例书写方便；真实 ID 由系统生成，**证据里必须记录实际 ID**，不得伪造别名。
- **「零写 / clean fail」口径**：凡是「被拒绝」的动作，除断言报错文案外，必须断言 **磁盘记录未被部分写入、未被改坏、计数前后相等**（对齐既有 `verify-*` 中「缺 confirm 不落盘」口径）。禁止只用「抛错了」当 PASS。
- **重启读回口径**：凡涉及持久化，必须「写 → 关闭域 → 重新 open → 读回」后再断言，不得只断言内存对象。
- 状态取值严格对齐 ADL-045：`PASS / FAIL / BLOCKED / NOT_RUN`，`FAIL·BLOCKED·NOT_RUN` 一律 ≠ 通过。

## 1. 状态与分层图例（与 ADL-047 严格一致）

- 层 `AUTO`：可离线、确定性、纯函数 / node core / `verify-*.mjs` 执行；**全绿即算自动化门通过**。
- 层 `GUI`：真实浏览器面板交互（字段可见、可编辑、错误可读、取消保护两段证据）；离线全绿 ≠ GUI PASS。
- 层 `MANUAL_PENDING`：受系统能力 / 认证所限、**必须用户本人配合动作**才能验的项；登记在此，**既不算 PASS 也不阻塞自动化门与当前交付**；用户反馈失败即重开对应缺陷与发布门（ADL-047 第 2/4 条）。
- **本矩阵初始全部 `NOT_RUN`**（开发前冻结，尚未实现、未执行）。
- **人工项不重复阻塞**：已被既有报告登记的 GUI / 旧版人工项（如旧 H1–H6、真 390 窄窗等）不在本矩阵重复造阻塞；本矩阵只列 schema v2 **新增/受影响** 的 GUI 断言。

---

## A. v1 旧 JSON 兼容读取（无新字段也能读）

| CASE_ID | 场景 | 最小触发 | 必含断言（缺一不可 PASS） | 层 | 状态 |
|---|---|---|---|---|---|
| V2-A1 | 旧任务记录缺 `predecessorIds` 仍可读 | 造一条 v1 形状任务（不含 `predecessorIds` 键）写入 v2 运行库并重启读回 | 读回成功、不抛 unrecognized/missing；`predecessorIds` 读回为「空」语义（缺省空数组），其余 v1 字段值零漂移 | AUTO | NOT_RUN |
| V2-A2 | 旧项目记录缺 `repoUrl`/`branch` 仍可读 | 造一条 v1 形状项目（无两键）重启读回 | 读回成功；两字段读回为「空」语义；`name/status/dates/tags` 零漂移 | AUTO | NOT_RUN |
| V2-A3 | v1 备份（`formatVersion:1`）可被 v2 读取恢复 | 取一份真实 v1 备份 JSON，在 v2 运行时 `readBackupFile`/`restoreBackupFromContent` | 通过 `validateBackup`，不抛「formatVersion 不符」；恢复后七实体计数与原备份一致；新字段按空缺省 | AUTO | NOT_RUN |
| V2-A4 | 读 v1 备份后写回，旧记录不被「补全」成坏形 | v1 记录读入 → 不做任何编辑 → 再备份导出 | 导出记录不得丢失既有 v1 字段；可选新字段仅在有值时出现，空值不污染语义 | AUTO | NOT_RUN |
| V2-A5 | v1 strictObject 对「多余未知键」的既有行为不被 v2 放松 | 向 v2 写入对象塞入一个未定义键（如 `fooBar:1`） | 仍按既有 `unrecognized_keys` 拒绝，中文提示可读；不得因 v2 放宽成静默吞键 | AUTO | NOT_RUN |
| V2-A6 | 域升 v2 仍兼容读 v1；更新即迁移到 v2 | 域以 v2 打开且 `compatibleVersions` 含 1；载入纯 v1 记录库，对其中**一条**记录做一次合法更新后重启读回 | 纯 v1 库可打开、不强制迁移即可读；被更新的那一条落盘为 v2 形态；**其余未触碰 v1 记录不被批量改写**；迁移幂等（重复更新不再漂移） | AUTO | NOT_RUN |

## B. v2 可选字段写回与重启读回

| CASE_ID | 场景 | 最小触发 | 必含断言 | 层 | 状态 |
|---|---|---|---|---|---|
| V2-B1 | `predecessorIds` 写入并重启读回 | 任务 A、B；给 A 写 `predecessorIds:[B]`；关闭域重开读 A | 读回 `predecessorIds` 精确等于 `[B]`（顺序/去重口径与冻结契约一致，记录实际 ID） | AUTO | NOT_RUN |
| V2-B2 | `repoUrl`/`branch` 写入并重启读回 | 项目写合法 git URL + branch；重开读回 | 两字段原值落盘、读回相等；`updatedAt` 正常推进 | AUTO | NOT_RUN |
| V2-B3 | 不填新字段 = 合法可选 | 新建任务/项目完全不带新字段 | 创建成功、写回不报错；读回为缺省空语义 | AUTO | NOT_RUN |
| V2-B4 | 更新可单独改新字段、不动其它 | 只更新 `branch`；其它字段 JSON diff 应只含 `branch`/`updatedAt` | diff 最小、不误触归属/父/编号/时间戳（对齐 `taskUpdateSchema` 白名单口径） | AUTO | NOT_RUN |
| V2-B5 | 面板可编辑新字段（GUI） | 打开任务抽屉/项目编辑表单 | 新字段控件存在、可键入、保存后刷新持久（两段证据：编辑前/后记录 JSON） | GUI | NOT_RUN |

## C. 人为坏字段 clean fail（写一半要不得）

| CASE_ID | 场景 | 最小触发 | 必含断言（缺一不可） | 层 | 状态 |
|---|---|---|---|---|---|
| V2-C1 | `predecessorIds` 含非任务 ID 串 | 写 `predecessorIds:["not-a-task"]` | clean 拒绝 + 中文字段提示；该任务记录**未写入/未改坏**，库计数前后相等 | AUTO | NOT_RUN |
| V2-C2 | `repoUrl` 非法格式 | 写 `repoUrl:"not a url"` | clean 拒绝 + 可读错误；项目未部分写入 | AUTO | NOT_RUN |
| V2-C3 | `branch` 非法 ref | 写含空格 / 路径穿越符号的 branch | clean 拒绝；磁盘零变更 | AUTO | NOT_RUN |
| V2-C4 | 字段类型错误（数组/标量串台） | `predecessorIds:"A"`（应为数组）或 `repoUrl:123` | zod 级类型拒绝，非静默 coercion；错误文案映射到中文标签 | AUTO | NOT_RUN |
| V2-C5 | 手改磁盘 JSON 制造坏记录后重启 | 直接编辑某记录 JSON 改坏一字段 → 重开域 | **clean fail 并明确点名记录 id 与出错字段**；**不得整体崩、不得静默丢整表**；**明确禁止「把坏记录旁路备份后跳过、其余照常加载」式静默降级**——坏记录必须让调用方看到，而不是被悄悄隔离放行 | AUTO | NOT_RUN |
| V2-C6 | 面板坏输入的用户可见反馈（GUI） | 表单填非法 URL / branch 保存 | 内联错误文案可读、非仅变色；提交被拦截、表单不丢已填其它内容 | GUI | NOT_RUN |

## D. predecessorIds 关系语义（存在 / 同项目 / 自指 / 成环 / 删除保护 / 重启读回 / 预检兜底 / 悬空只报告）

> 关系校验应在 **写入路径** 与 **备份恢复预检 `precheckBackup`** 两处都生效；两处都要断言。

| CASE_ID | 场景 | 最小触发 | 必含断言（缺一不可） | 层 | 状态 |
|---|---|---|---|---|---|
| V2-D1 | 被指 predecessor 存在 | A→B，B 真实存在 | 合法接受、落盘、重启读回关系成立 | AUTO | NOT_RUN |
| V2-D2 | 跨项目引用拒绝 | A 在项目 P1，predecessor 指向 P2 的任务 | clean 拒绝 + 「同项目」中文提示；A 零写 | AUTO | NOT_RUN |
| V2-D3 | 指向自身拒绝 | A.predecessorIds 包含 A 自己 | clean 拒绝；不得自引用落盘 | AUTO | NOT_RUN |
| V2-D4 | 成环拒绝 | A→B、B→C、C→A（或 A→B→A） | 环检测拒绝成环那一步；报错可读；已合法部分不被连带清空 | AUTO | NOT_RUN |
| V2-D5 | 删除被引用 predecessor 的保护 | B 是 A 的 predecessor；尝试删 B | 按冻结契约：要么级联确认（对齐 `batchDeleteCascade` 二次确认口径），要么显式拒绝并提示引用方；**禁止静默删 B 留悬空**。两段证据：取消→关系仍在；确认/拒绝→结果符合契约 | AUTO+GUI | NOT_RUN |
| V2-D6 | 重启读回整组依赖链 | 建 A→B→C 合法链 → 重启 → 依次读回 | 三条记录 predecessorIds 完整、方向正确、无反转/丢边 | AUTO | NOT_RUN |
| V2-D7 | 预检兜底：备份里带环/悬空 predecessor | 手工构造含 A→B→C→环 + 一条悬空的 v2 备份，走 `precheckBackup`/restore | 在**触碰现有数据前**整份拒绝；现有库零变更（对齐 `applyBackup` 先预检后动表） | AUTO | NOT_RUN |
| V2-D8 | 悬空依赖 doctor 只报告、不自动自愈 | 构造 A.predecessorIds 指向一个已被删除的 ID，跑体检/doctor | doctor **报告**该悬空边（点名 A 与悬空 ID），但**不自动删除、不自动改写** predecessorIds；库记录零变更，等待人工处置 | AUTO | NOT_RUN |

## E. repoUrl / branch 格式与旧项目兼容

| CASE_ID | 场景 | 最小触发 | 必含断言 | 层 | 状态 |
|---|---|---|---|---|---|
| V2-E1 | 合法 git URL 通过 | `https://host/org/repo.git` 与 `git@host:org/repo.git` 两类 | 均接受、原样落盘读回 | AUTO | NOT_RUN |
| V2-E2 | 非法 URL 拒绝 | 空后空格、含协议外垃圾、相对路径 | clean 拒绝 + 中文提示；项目零写 | AUTO | NOT_RUN |
| V2-E3 | branch 合法 / 非法边界 | `main`、`feature/x-1` 接受；`-x`（斜杠/连字符边界）与含 `~ : ? * [ ]` 拒绝 | 白名单字符口径与冻结契约一致；拒绝项零写 | AUTO | NOT_RUN |
| V2-E4 | 旧项目无此两字段完全正常 | 取基线已存在的旧项目 | 不强制补两字段、不报错、展示为空态而非「字段缺失异常」 | AUTO | NOT_RUN |
| V2-E5 | 面板仓库信息展示/编辑（GUI） | 项目详情显示 repoUrl/branch；编辑往返 | 有值显示可辨、无值空态不报错；编辑保存持久 | GUI | NOT_RUN |

## F. 健康分（确定性 / 因子可解释 / 边界）

> 健康分应是**纯离线派生**（对齐 ADL-039「打开即派生、不新表、不入持久化」基调）：同一数据 → 同一分数；不写库、不带时钟/随机。

| CASE_ID | 场景 | 最小触发 | 必含断言（缺一不可） | 层 | 状态 |
|---|---|---|---|---|---|
| V2-F1 | 确定性 | 对同一数据集连算两次 / 两进程 | 两次分数逐因子相等；不依赖 `Date.now()`、随机、遍历顺序（排序后再聚合） | AUTO | NOT_RUN |
| V2-F2 | 因子可解释 | 取一份样本，请求「分数 + 因子分解」 | 返回总分且可拆到各因子（如完成度/逾期/受阻/临近），每因子贡献可复算回总分；不含黑箱单值 | AUTO | NOT_RUN |
| V2-F3 | 边界：空项目 | 0 任务的项目 | 不除零、不 NaN/Infinity；返回定义良好的边界分与空因子说明 | AUTO | NOT_RUN |
| V2-F4 | 边界：满分 / 全受阻 | 全 done → 上限分；全 blocked → 下限分 | 分被 clamp 在 [0,100]；不越界、不出现 101/-1 | AUTO | NOT_RUN |
| V2-F5 | 边界：日期未来/已过期 | dueDate 今天 / 昨天 / 明天各一 | 边界口径与既有 `computeReminders`（逾期=dueDate<今天）一致；不得两处口径打架 | AUTO | NOT_RUN |
| V2-F6 | 只读派生、零写 | 计算健康分后断言库未变 | 计算前后任一表 `hashSet` 不变；不新表、不写 settings | AUTO | NOT_RUN |
| V2-F7 | 面板健康分展示（GUI） | 项目视图展示健康分 + 因子 | 分数与因子在面板可读、与 AUTO 算值一致；hover/可展开因子说明（MANUAL 留用户确认观感） | GUI | NOT_RUN |

## G. 备份 v1/v2 兼容 与 restore 预检 / 失败回滚 / 中途故障 / 崩溃清理

| CASE_ID | 场景 | 最小触发 | 必含断言（缺一不可） | 层 | 状态 |
|---|---|---|---|---|---|
| V2-G1 | 备份 `formatVersion` 仍为 1（不随域升 v2） | v2 运行库 createBackup | 备份 `format:'pm-tool-backup'`、**`formatVersion` 仍为 1**（不抬版本号）、七实体齐全、**不含** checks/宿主会话/任何密钥；新字段随记录内容带入而非靠格式版本区分 | AUTO | NOT_RUN |
| V2-G2 | `formatVersion:1` 备份往返兼容 | G1 的备份（带新字段）→ restore 回隔离空库；再与 v1 旧备份互读 | 七实体 + 新字段（predecessorIds/repoUrl/branch）往返无损；v2 库可读 v1 旧 `formatVersion:1` 备份、v1 旧运行库形态可被 v2 读入 | AUTO | NOT_RUN |
| V2-G3 | 预检在动表前拦截坏记录 | 构造一条坏 task（坏 predecessorIds 或非法 repoUrl）放入备份后 restore | 在 `delete` 任何现有记录**之前**抛错；现有库逐表计数前后完全相等（对齐 `precheckBackup` 先行） | AUTO | NOT_RUN |
| V2-G4 | restore 中途失败自动回滚（进程内故障注入） | **进程内注入**「预检通过但写表中途 put 抛错」后 restore | 现有数据自动回滚到恢复前（安全快照兜底），**不得留一半新一半旧撕裂库**；返回 safetySnapshot 可定位。**边界声明：本用例仅验证进程内可注入故障的回滚，不声称跨进程 / 强杀级事务原子性** | AUTO | NOT_RUN |
| V2-G5 | 恢复前自动安全快照仍生效 | 当前库已有数据时触发 restore | 先写时间戳安全快照再动表；快照文件存在、落在 `DSH_PM_BACKUP_DIR` | AUTO | NOT_RUN |
| V2-G6 | createBackup 原子写、中断不留半成品/残留 | 注入写临时文件途中抛错 / 写后 rename 前中断 | 实现须**先写临时文件再 `rename` 到最终路径**；中断后**最终路径无损坏/半截 JSON**、目录无残留 `.tmp`/`.part`；下次 createBackup 正常 | AUTO | NOT_RUN |
| V2-G7 | 拒绝格式不符的伪备份 | `formatVersion:99` 或篡改 `format` 字段的文件 | `validateBackup` 干净拒绝、中文提示；不碰现有库 | AUTO | NOT_RUN |
| V2-G8 | GUI 备份/恢复按钮（人工不可逆确认） | 面板触发备份 + 一次恢复 | 恢复属不可逆动作，仍弹显式确认（ADL-047 第 5 条不受分层豁免）；确认前零写。**此步须用户本人执行/确认 → MANUAL_PENDING** | MANUAL_PENDING | NOT_RUN |

## H. build / full guard / GUI 总门

| CASE_ID | 场景 | 最小触发 | 必含断言 | 层 | 状态 |
|---|---|---|---|---|---|
| V2-H1 | `build` 通过 | `pnpm run build`（tsc + css + tsdown） | 退出码 0；client bundle **不得残留** server-only zod/域 require（对齐 `9b15baa` 教训：离线绿≠bundle 不炸） | AUTO | NOT_RUN |
| V2-H2 | full guard 全绿含新增 verify | `pnpm verify`（`verify-isolation` 串跑全部 `verify-*.mjs`，含新增 `verify-schema-v2.mjs`） | 既有全部用例不回归（基线约 150 文件）；新增 schema-v2 用例随此纳入、退出码 0 | AUTO | NOT_RUN |
| V2-H3 | 隔离默认 backups 不变 | 跑完整套 guard 前后 `hashSet(packages/backups)` | 前后一致（对齐 `verify-backup` 收尾断言） | AUTO | NOT_RUN |
| V2-H4 | 真实浏览器 GUI 冒烟（受能力限） | 真实 Chrome 打开面板，走 A 类旧记录渲染 + B/E 新字段控件 + F 健康分展示 | 页面无 console 报错、新字段可用、错误文案可读。若测试专家受环境/认证所限无法执行 → 诚实标 `BLOCKED` 并写明原因，或可委托执行端只采证据、专家判证（ADL-045 第 8 条） | GUI | NOT_RUN |
| V2-H5 | 不可逆动作人工确认 | 面板删除被引用 predecessor / 恢复备份 | 必须用户本人确认动作；登记 MANUAL_PENDING，不阻塞自动化门 | MANUAL_PENDING | NOT_RUN |

---

## 2. 交付与判门口径

- **自动化门（AUTO 全绿）**：A–H 中全部 `AUTO` 用例 PASS，即视为可推进当前交付（ADL-047）。
- **GUI 门**：`GUI` 用例须真实浏览器证据；离线/纯函数绿不得替代。执行端只采证据、判定权在测试专家。
- **人工协作门**：`V2-G8 / V2-H5` 等必须用户本人动作者登记 MANUAL_PENDING，**不阻塞**自动化门；用户反馈失败即重开缺陷与发布门。
- **FAIL 一律阻塞**；`BLOCKED/NOT_RUN` ≠ 通过；历史结论在新提交使受影响面变动后**过期作废、须重测**。
- **总门结论**：当前为**开发前冻结，全部 NOT_RUN，总门 NOT PASS**。本文件不预设任何通过，待实现完成后逐格填 `PASS/FAIL/BLOCKED/MANUAL_PENDING` 并绑定 `testedCommit` + 证据目录。

## 3. 冻结期明确不做（只读）

- 不改 `src/` 任何产品代码、不改数据、不产生 git 提交。
- 不替代开发实现 `predecessorIds` / `repoUrl` / `branch` / 健康分 / schemaVersion，也不修改既有 `verify-*.mjs`（那是开发交付物；本矩阵仅指定「应被新增/受影响」的验收面）。
- 与本矩阵冲突的既有历史结论，以新提交重测后为准，不在此预销。
