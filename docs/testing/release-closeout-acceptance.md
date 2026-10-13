<!--
发布收尾（release closeout）阶段验收冻结文档。独立测试专家所有，ADL-045 / ADL-047 / AGENTS §6A / collaboration 第九节。
其他角色：只读引用，不改动本文件；不得据此自行增改用例、自判 PASS 或把旧 H1–H6 升级为阻塞。
冻结基线：仓库 HEAD = 2682fc799108b816eb49da8ba13378da7b852f01（main）。
-->
# 发布收尾验收冻结门（release-closeout-acceptance）

> 给谁：开发（导入/修复方）、项目所有者、后续接手平台（TRAE / Cursor / 豆包工作 / 其他 Agent）。
> 是什么：在「pm-tool 进入发布收尾」时，由独立测试专家**预先冻结**的四块验收门。它规定「收尾放行到底凭什么证据、按什么判定、什么算 PASS、人工项如何登记而不阻塞」。
> 怎么用：开发/所有者按本门收尾；**PASS / FAIL / MANUAL_PENDING 只能由独立测试专家审证后给出**（ADL-045 第 8 条：执行与判定分离）。可自动化项全绿即可推进；确须本人配合者转 `MANUAL_PENDING`，**既不算 PASS、也不阻塞自动化门**（ADL-047）。

---

## 0. 独立性与冻结声明（必读）

- **本门由独立测试专家制定并独立审证**。开发方只负责实现、跑脚本采集原始证据、提供构建产物哈希；**无权自判 PASS**。本专家**只读产品代码与既有 verify 脚本、只跑离线只读 verify（落临时目录）**，不改产品、不改其他 docs、不改服务、不 commit/push、不联网调模型、不读密钥。
- **冻结基线**：仓库 HEAD `2682fc7`。本门结论一律绑到此基线；任何新提交使受影响证据过期，须重测后才能引用（ADL-045 第 5 条）。
- **本轮环境实测口径（由回归执行 Agent 采集、本专家独立复核）**：functional verify = **41 个**（`scripts/verify-*.mjs` 共 42 个，减去外层 guard `verify-isolation.mjs`），全绿退出码 0；外层隔离 guard `verify-isolation.mjs` 对正式资产清单（`data/` + `packages/backups/` 历史备份 + `packages/backup/` 遗留目录）做运行前后 sha256+mtime diff，**149 个文件零变化**。以上为本门 A/B/C 三块自动化证据的来源。
- **本门不做、也不替开发拍板**：四块里凡属「要改代码/改文档/改配置才能对齐」的项（如 provider ID 文本残留、版本号对齐、补发布说明），本专家只**冻结判定标准 + 记录现状证据**，改动由开发/所有者完成后回本门重测。
- **旧 H1–H6 明确不升级为阻塞**：见 §5。它们是 ADL-047 人工协作门项，登记在案、等所有者反馈；**不因它们未完成而卡自动化放行**，也**不因为它们曾被观察过就当 PASS**。

## 1. 判定语义（本门专用，与 ADL-045 / ADL-047 对齐）

| 判定 | 本门定义 | 是否阻塞发布收尾 |
|---|---|---|
| **PASS** | 该检查经独立测试专家审证：证据齐全、与冻结基线 `2682fc7` 及产物哈希一致、verify 退出码符合预期。**不得用「脚本存在 / 文档写了 / HTTP 200」代替实测。** | 单格通过 |
| **FAIL** | 已实测且与验收不符；或静态一致性审计发现硬漂移（见 D 块）。 | **阻塞收尾**，只允许缺陷修复/补测/文档 |
| **MANUAL_PENDING** | 受系统能力/认证所限、**必须所有者本人在真实环境配合**才能验的项（真实 Key 对话、3080 已认证页面走查、旧 H1–H6 目视）。按 ADL-047 **既不算 PASS、也不阻塞自动化门**；登记等反馈，**所有者反馈任一失败即重开对应门**。 | 不阻塞自动化门，但不记 PASS |
| **BLOCKED** | 受本专家能力限制、本可补而未补的缺口（非「必须本人配合」）。 | 阻塞（须补测，不自动豁免） |
| **NOT_RUN** | 计划内但本轮未执行。 | 阻塞（须排期执行） |

> 硬规则：`FAIL / BLOCKED / NOT_RUN` 一律 ≠ 通过；GUI 实测是硬门槛（ADL-045 第 7 条）；严重度只排修复先后、不自动豁免；**人工项不自动豁免，只豁免「确实必须用户本人配合」者**（ADL-047 边界）。

## 2. 证据格式（每格必填，缺一不算有效结论）

每格回填以下四行（与 `external-skills-acceptance.md` §3 同一格式）：

```
证据：<仓库相对路径 / sha256 摘录 / 命令输出关键行 / 截图（谁产生、何时）>
绑定：<被测提交哈希 + 产物哈希（如 lib/client.js sha256）>
判定：PASS | FAIL | MANUAL_PENDING | BLOCKED | NOT_RUN
重测条件：<什么新提交/新改动会使本格过期，须重测>
```

- 证据必须与冻结基线**一致、可复核**；执行端**不得把口述/口头汇报当证据**。
- 涉及 3080 / bundle 的格，证据须含 `lib/client.js` 与 `lib/index.js` 的 sha256，且与「3080 实际加载的 bundle」同源（见 B 块）。

---

## 3. 四块冻结验收矩阵

### A 块 ｜ provider ID 统一 + PoC 与 prod 路由隔离

> 权威路由实现：`src/core/model-route.ts`（ADL-044）。目标：运行期只解析到**一套一致的 provider ID**，PoC 免费车道永不顶替生产活，prod 无 Key 时明确报错、**绝不回退免费车道**。

| 用例 | 检查项 | 通过标准 | 自动化方法 | 本轮状态（绑 2682fc7） |
|---|---|---|---|---|
| A1 | PoC 车道 provider/model | poc 模式解析到 `provider='our-free-model'`，模型降级链 `kilo-auto/free → openrouter/free → …` | `verify-model-route.mjs` + `verify-ai-client.mjs` 断言 provider/model 字符串与降级链 | **PASS**（41 全绿内） |
| A2 | prod 车道候选 | prod 按 Key 优先 `deepseek-official/deepseek-chat`，其次 `kimi-official/kimi-k2`；无 Key 抛 `PROD_KEY_MISSING` 中文提示 | `verify-model-route.mjs`（prod 无 Key 抛错不回退、模式持久化、非法模式拒绝） | **PASS** |
| A3 | prod 不回退 PoC | prod 模式下无任何 Key 时**不得**悄悄落到 `our-free-model/kilo-auto/free` | `verify-model-route.mjs`（断言抛错而非返回 poc provider） | **PASS** |
| A4 | provider ID 文本统一 | 运行期实际 import/resolve 的 provider 常量只来自 `model-route.ts` 统一集；旧 ADL-035 通道名 `openrouter-free` 不得成为运行期解析值 | 静态审计 `src/**`：`openrouter-free` 仅允许出现在注释/历史说明，不得出现在运行期 provider 解析分支 | **FAIL→待修复（记录现状）**：`src/core/ai-client.ts:15/54` 仍含旧 `openrouter-free` 字符串；是否影响运行期解析须开发澄清后回本格重测 |
| A5 | 真实车道对话 | 真 Key 下免费/生产车道各跑通一次生成草稿 | 须所有者填 `OPENROUTER_API_KEY`/`DEEPSEEK_API_KEY`/`KIMI_API_KEY` 后实跑 | **MANUAL_PENDING**（无 Key，ADL-035 既定） |

> A 块自动化放行口径：A1/A2/A3 PASS 即自动化门通过；A4 为**文档/代码文本一致性**，本专家不替开发改，改完重测；A5 人工登记不阻塞。

### B 块 ｜ 3080 加载最新 HEAD + 数据零写

> 3080 = 生产 dsh Web 面板端口。目标：面板实际加载的是冻结基线 `2682fc7` 最新构建产物，且「加载/浏览面板」这一动作对正式 `data/` **零写**。

| 用例 | 检查项 | 通过标准 | 自动化方法 | 本轮状态（绑 2682fc7） |
|---|---|---|---|---|
| B1 | client bundle 契约 | `lib/client.js` 可被 vm 执行，`require` 白名单仅 `react`/`react/jsx-runtime`，**无 zod 等外部 require 残留**（修 `9b15baa` 教训） | `verify-client-bundle.mjs`（越界 require 直接 throw；断言注册 `main`+`sidebar.panellist` 两 slot） | **PASS** |
| B2 | web snapshot / manifest 契约 | snapshot 含七表、manifest 与动态 bundle 契约匹配；bundle 文本含关键命令/按钮（`execute("backup")`、`pm-backup-btn` 等） | `verify-web.mjs`（mkdtemp + 读 bundle 文本断言） | **PASS** |
| B3 | 加载即最新构建 | 3080 实际服务的 bundle sha256 == `2682fc7` 重新构建产物 sha256（非历史旧 bundle） | 记录 `lib/client.js` sha256（冻结时快照）；真实 3080 服务 PID 69461 未被本测试触碰 | **PASS（自动化侧）/ 真同源核验 MANUAL_PENDING**：bundle 产物哈希可证；「运行中 3080 进程内存里是否就是这份新 bundle」须所有者在浏览器硬刷新后认一次 |
| B4 | 浏览面板零写 | 跑完整 verify 套件前后，正式 `data/` 文件集合零新增/零删除/零 hash 变化 | `verify-isolation.mjs`（WATCH `data/`，env scrub `PM_DATA_ROOT`） | **PASS**（guard 149 文件零变化） |

> 说明：历史证据（`verify-run-20261012-152121/gui-round3-gap-matrix.md`）已记录 client.js 多次重建、env.json 的旧 sha256（`811728da…`）与现产物不符——**故 B3 必须以冻结基线新 sha256 重绑，旧 bundle 的 PASS 不得沿用到新构建**。

### C 块 ｜ 历史残留处置不误删用户文件

> 目标：清理/迁移/恢复类动作**绝不误删正式用户文件**；历史备份（`packages/backups/` ~81 个）与遗留目录保持完好。

| 用例 | 检查项 | 通过标准 | 自动化方法 | 本轮状态（绑 2682fc7） |
|---|---|---|---|---|
| C1 | 正式资产防污染 guard | 跑全量 verify 前后，`data/` + `packages/backups/`（历史备份）+ `packages/backup/`（遗留目录）sha256+mtime 清单**零增删改** | `verify-isolation.mjs`（before/after manifest diff；任一新增/删除/hash 变/mtime 变即退出 1） | **PASS**（149 文件零变化） |
| C2 | 恢复安全快照 | 恢复前自动生成 preRestore 安全快照，恢复后领域实体与旧备份逐字段 deepEqual、快照与恢复前全量 deepEqual | `verify-integration.mjs`（真实 collectBackup/restoreBackup deepEqual + 子进程读盘断言） | **PASS** |
| C3 | 坏备份拒绝不误删 | schema 非法 / 关系非法两种坏备份各试一次，**领域与文件集合均不变**（不删用户原文件） | `verify-integration.mjs`（坏备份两条负例） | **PASS** |
| C4 | 导出/临时文件失败清理 | 导出失败时临时文件被清理（`unlink(temporary)`），不留垃圾、不覆盖正式产物 | `verify-export.mjs` + `src/core/export.ts` unlink 分支 | **PASS** |
| C5 | 隔离缺口闭环 | 历史 round1 发现的 `verify-backup.mjs` 安全快照写到非隔离 `packages/backups/` 问题，已被 guard WATCH 覆盖 | 若该泄露仍存在，C1 guard 必 FAIL；现 C1=PASS 即证闭环 | **PASS（由 C1 反证）** |

> C 块为全自动化、无 MANUAL_PENDING：guard 转绿即代表「测试与清理动作没有碰用户文件」。

### D 块 ｜ 版本号 / 路线图 / 发布说明一致

> 目标：收尾放行前，**版本三元组对齐**——`package.json` 版本 == 最新 git tag == 存在该 tag 对应的发布说明，且 README/progress 当前状态不 stale。本专家做**只读一致性审计**，不替开发改。

| 用例 | 检查项 | 通过标准 | 自动化/审计方法 | 本轮状态（绑 2682fc7） |
|---|---|---|---|---|
| D1 | package.json 版本 == 最新 tag | `packages/dsh-pm-tool/package.json` 的 `version` == `git tag` 里最大者 | 读 package.json + `git for-each-ref refs/tags` 比对 | **FAIL（硬漂移，阻塞收尾）**：package.json = `0.1.0`；实际 tag 已到 `v0.4.0`（→ca02969） |
| D2 | 每个 tag 都有发布说明 | 最新 tag 对应 `docs/releases/vX.Y.Z.md` 存在且内容对应 | 列 `docs/releases/` vs tag 列表比对 | **FAIL（缺件，阻塞收尾）**：tag `v0.4.0` 存在，但 `docs/releases/` 仅有 v0.1.0/v0.2.0/v0.3.0，**无 v0.4.0 发布说明** |
| D3 | 当前状态/路线图不 stale | README、`docs/progress.md`「当前状态」、`docs/handoff.md` 持久交接的版本口径与实际 tag 链一致 | 静态比对三处版本行 | **FAIL（口径不一，阻塞收尾）**：README 仍写「已发布 v0.1.0」；progress 写「v0.4.1-integration，未 tag」；handoff 写 `v0.4.0 tag=1af5490` 而实际 tag → `ca02969`（commit 也对不上） |

> **D 块定性**：版本三元组漂移是**发布阻塞缺陷（FAIL），不是 MANUAL_PENDING**——不能在 package.json=0.1.0、缺 v0.4.0 发布说明、tag commit 对不上的状态下打收尾/发布。修复（bump version、补 `docs/releases/v0.4.0.md`、对齐 README/progress/handoff、核对 tag 指向）由开发/所有者完成后回本门 D1–D3 重测；本专家不改其他 docs。

---

## 4. 自动化用例清单（可全绿即推进当前交付）

收尾放行前，下列须在冻结基线 `2682fc7` 上全绿（退出码 0），并由 `verify-isolation.mjs` 兜底零污染：

- **路由/车道（A 块）**：`verify-model-route.mjs`、`verify-ai-client.mjs`、`verify-copilot.mjs`、`verify-copilot-cancel.mjs`、`verify-meeting-ai.mjs`、`verify-report-ai.mjs`、`verify-wbs.mjs`
- **3080 / bundle / 快照（B 块）**：`verify-web.mjs`、`verify-client-bundle.mjs`
- **残留/恢复/不误删（C 块）**：`verify-integration.mjs`、`verify-backup.mjs`、`verify-export.mjs`、`verify-promote.mjs`
- **兜底零污染 guard**：`verify-isolation.mjs`（正式 `data/`+历史 `backups/`+遗留 `backup/` 149 文件前后 sha256+mtime 零变化）
- **其余回归（既有用例，不得因收尾而跳过）**：`verify-command/storage/projects/tasks/milestones/risk-issues/meetings/reports/deliverables/r12/record-location/reminders/task-inline/task-tree/keyboard/gantt/war-room/csv/xlsx/import-content/importmd/cascade/batch/drawer-focus/form-validation`、以及外部 skills `verify-external-skills.mjs`、`verify-external-skill-router.mjs`。

> 本轮口径：以上 functional verify 合计 **41 个全绿**（42 个 `verify-*.mjs` 减去 guard）。任一 FAIL 即阻塞收尾。

## 5. MANUAL_PENDING 登记（不阻塞自动化门，但不记 PASS）

| 编号 | 项 | 为什么必须本人配合 | 失败后果 |
|---|---|---|---|
| M1 | 真实 Key 下 PoC/prod 车道对话（=A5） | 须所有者填 Key 并在真实 dsh 会话跑一次生成草稿 | 反馈失败即重开 A 块 |
| M2 | 3080 已认证页面真同源走查（=B3/B 块 S0） | 须所有者带一次性 token 硬刷新浏览器，确认面板加载的就是新 bundle、七 Tab 正常 | 反馈「加载旧 bundle/破版」即重开 B 块 |
| **H1** | 深色主题错误对比度目视 | 受桌面自动化层限制，须人眼确认红错字/边框在暗色下清晰 | 观察不达标即重开样式门 |
| **H2** | 真实 j/k 行导航 | 真实键盘事件，自动化层受限 | 反馈不生效即重开 |
| **H3** | Space 勾选/批量条 | 同上，真实键盘 | 同上 |
| **H4** | 表单 Enter 触发校验/提交 | 同上 | 同上 |
| **H5** | 真 390px 视口横向溢出 | 须真实 DevTools 窄屏目视 | 反馈溢出即重开样式门 |
| **H6** | 3080 已认证七 Tab/树/提醒/搜索/作战室/甘特/抽屉全走查 | 须本人登录 3080 逐项过（与 M2 同源，合并执行） | 任一视图异常即重开 B 块 |

> **明确：旧 H1–H6 不因未完成而阻塞收尾自动化门**（ADL-047）；但也**不得因「之前观察过」就记 PASS**。它们与 M1/M2 一并等所有者反馈，反馈失败才重开门。

## 6. 收尾 PASS 门（总规则）

发布收尾放行须同时满足：

1. **A/B/C 三块自动化格全 PASS**（绑 `2682fc7` + 产物 sha256），且 `verify-isolation.mjs` guard 149 文件零变化。
2. **D 块版本三元组漂移已修复并重测 PASS**（D1 package.json==最新 tag；D2 最新 tag 有发布说明；D3 README/progress/handoff 口径一致、tag commit 对得上）——**这是当前唯一的自动化/一致性阻塞项**。
3. **MANUAL_PENDING（M1/M2 + H1–H6）已登记**，未完成不阻塞；所有者反馈任一失败 → 立即重开对应块。
4. 最终放行须由**独立测试专家**基于「冻结基线哈希 + 产物哈希清单 + 全部证据」一次性签发；任何人不得代签。

## 7. 冻结声明

- 本门于发布收尾前由独立测试专家冻结于 `2682fc7`。A/B/C 自动化证据已绑本轮 41 绿 + guard 149 零变化；D 块现状为**硬漂移 FAIL**（package.json 0.1.0 vs tag v0.4.0、缺 v0.4.0 发布说明、口径/tag commit 不一）。
- 开发/所有者修复 D 块（及 A4 provider ID 文本残留）后通知本专家；本专家在**不改产品/其他 docs/服务、不提交**的前提下，按本门逐格重测并回填 §2 证据四行。
- 本文件仅位于 `docs/testing/`，是测试专家产物；其他角色只读引用，不得据此自判 PASS 或把 H1–H6 升级为阻塞。

---

## 8. 复判轮次 R2（2026-10-13，收尾实施落地后）

> **新冻结基线**：仓库 HEAD 仍为 `2682fc7`；收尾实施改动（provider TDD 修复、`package.json`→`0.5.0`、v0.4.0/v0.5.0 发布说明、`.gitignore` 残留治理、`gen-valid-backup-fixture.mjs`）目前为**未提交工作树**。本轮证据绑到「HEAD `2682fc7` + 该收尾工作树 diff」；**打 tag 前须经所有者授权提交，并复跑一次 guard 把证据重绑到发布提交哈希**。
> **本轮实际执行（独立测试专家实跑，非照搬回归 Agent 结论）**：

| 实跑项 | 命令 | 结果 |
|---|---|---|
| provider 专项·路由 | `node scripts/verify-model-route.mjs` | **exit 0**：poc/prod 路由、无 Key 友好提示、模式持久化、非法模式 |
| provider 专项·A4 回归 | `node scripts/verify-ai-client.mjs` | **exit 0**：含新增断言——兜底解析到 `our-free-model/kilo-auto/free`、鉴权文案**不**匹配 `OPENROUTER_API_KEY`、显式 prod provider/model 原样透传 |
| provider ID 静态 | `grep -rn openrouter-free src scripts` | **零残留**；`AI_PROVIDER='our-free-model'`/`AI_MODEL='kilo-auto/free'` 与 `model-route.ts` `POC_LANE` 逐字一致 |
| gen fixture node check | `node scripts/gen-valid-backup-fixture.mjs <tmpdir>` | **exit 0**：经产品 core `createBackup` 生成，落 `pmtool-backup-<ts>.json`；JSON 顶键 = `format,formatVersion,exportedAt,projects,tasks,milestones,riskIssues,meetings,reports,deliverables`（七实体齐全、可解析） |
| JSON 静态一致性 | `node -e require('./package.json')` | **parse OK**：`name=dsh-pm-tool; version=0.5.0` |
| 全量 verify + 零污染 guard | `node scripts/verify-isolation.mjs` | **exit 0**：after manifest = **149 个文件**；输出「正式 data/共享 backups hash+mtime 清单零变化，共 149 个文件未被污染」（guard 任一脚本非零即中断，跑到此行即全部 41 functional verify exit 0） |

### 8.1 A–D 矩阵逐格复判

| 格 | R1 判定 | R2 复判 | 证据 |
|---|---|---|---|
| A1/A2/A3 | PASS | **PASS（维持）** | `verify-model-route.mjs` exit 0 |
| **A4**（provider ID 统一） | FAIL→待修复 | **PASS（修复闭环）** | `openrouter-free` 运行期引用=0；`ai-client.ts` 与 `model-route.ts` provider/model 常量一致；`verify-ai-client.mjs` 新增 3 条断言 exit 0 |
| A5（真 Key 对话） | MANUAL_PENDING | **MANUAL_PENDING（维持，不阻塞）** | 无 `DEEPSEEK/OPENROUTER/KIMI_API_KEY`，须所有者填 Key 实跑一次 |
| B1/B2/B4 | PASS | **PASS（维持）** | `verify-client-bundle`/`verify-web`/`verify-isolation` 在 guard 内 exit 0 |
| B3（3080 真同源） | MANUAL_PENDING | **MANUAL_PENDING（维持，不阻塞）** | 须所有者浏览器硬刷新后认一次加载的是否新 bundle |
| C1–C5 | PASS | **PASS（维持）** | guard after manifest 149 文件零变化；`.gitignore` 改为 `verify-run-*/` **忽略而非删除**（本地证据留存、不误删） |
| **D1**（package.json==版本口径） | FAIL | **PASS** | `package.json=0.5.0`；README/progress/handoff/onboarding 统一「v0.5.0 预览·待打 tag」 |
| **D2**（每个已发 tag 有发布说明） | FAIL | **PASS** | `docs/releases/` 现有 v0.1.0–v0.5.0 五份；v0.4.0 事后补记到位 |
| **D3**（口径一致、tag commit 对得上） | FAIL | **PASS** | v0.4.0 为**注解 tag**：tag 对象 `ca02969` → 剥离提交 `1af5490`（双 SHA 语义，已在 v0.4.0 说明/handoff 文档化，非真漂移）；README 版本导航表与 tag 链一致 |

### 8.2 观察项（诚实登记，不阻塞，供开发刷新文档）

- `docs/releases/v0.5.0.md` 仍留有一句「**A4 provider ID 文本残留（产品 src，另线修复中）…本发布说明批次不改产品 src/**」——此表述**已落后于当前工作树**（A4 实际已修复并经 `verify-ai-client.mjs` 回归）。本专家不改其他 docs，仅登记：建议开发在打 tag 前把该行从「尚未完成」挪到「已完成」。
- 收尾改动**尚未提交**（HEAD 仍 `2682fc7`）。这是发布动作本身，不是测试门阻塞；但证据须在提交后重绑。

### 8.3 发布结论（v0.5.0）

- **自动化验收门 = PASS，无 FAIL/BLOCKED/NOT_RUN 阻塞项**：A/B/C 自动化格全绿（41 functional verify exit 0），guard 149 文件零变化，D 块版本三元组已对齐为一致的「v0.5.0 预览·待打 tag」状态。
- **结论：可发布 v0.5.0（放行进入打 tag 流程）**，前置条件：
  1. 收尾工作树改动经**项目所有者授权提交**（本专家不提交、不 push）；
  2. 创建 `v0.5.0` 注解 tag（与 v0.1.0–v0.4.0 一致形态）；
  3. **建议打 tag 后复跑一次 `node scripts/verify-isolation.mjs`**，把证据从「HEAD 2682fc7 + 工作树 diff」重绑到「发布提交哈希」；
  4. `MANUAL_PENDING`（M1/A5 真 Key 对话、M2/B3 3080 已认证同源走查、H1–H6 目视）**登记在案、不阻塞发布**（ADL-047）；所有者反馈任一失败即重开对应块。
- **旧 H1–H6 与 prod Key 维持 MANUAL_PENDING**，本轮未因它们未完成而降级自动化门结论，也未把它们记 PASS。

---

## 9. 复判轮次 R3 · 最终签发（2026-10-13）

> **本轮增量**（开发落地，未提交工作树之上）：① `NO_ADAPTER` 并入 `HARD_ERROR_CODES`（缺适配器不跨池换模型），且文案改为**点名本次实际 attempted provider**（`provider ?? AI_PROVIDER`）——显式 prod 缺适配器不再误报 `our-free-model`；② `verify-ai-client.mjs` 新增两条断言（#7 显式 prod NO_ADAPTER 文案须匹配 `deepseek-official` 且不匹配 `our-free-model`；#8 匿名 PoC NO_ADAPTER 文案匹配 `our-free-model`）；③ v0.5.0 发布说明的悬空 commit hash 已修。
> **本专家复跑（绑 HEAD `2682fc7` + 该增量工作树 diff）**：

| 复跑项 | 命令 | 结果 |
|---|---|---|
| provider 路由 | `node scripts/verify-model-route.mjs` | **exit 0** |
| provider NO_ADAPTER 专项 | `node scripts/verify-ai-client.mjs` | **exit 0**：断言串含「NO_ADAPTER 文案按实际 provider」，#7/#8 通过 |
| lib 新鲜度 | `grep HARD_ERROR_CODES lib/core/ai-client.js` | 编译产物已含 `NO_ADAPTER` 与 `provider ?? AI_PROVIDER`，与 src 同步 |
| 发布说明静态 commit 引用 | 抽取 v0.4.0/v0.5.0 说明全部 `[0-9a-f]{7,40}` 逐一 `git cat-file -t` | **repo 内 commit/tag 全部可解析**（2682fc7、ca02969 tag、1af5490、bef3011、bad7d22、55ba468 等）；唯一 `49dd158d…` 经核为**上游 vendored skills 锁定 commit**，在 `vendor/agent-skills/mattpocock/manifest.json` 与 `docs/external-skills.md` 逐字登记，**非悬空、非笔误** |
| 必要 guard | `node scripts/verify-isolation.mjs` | **exit 0**：after manifest = **149 文件零变化** |

### 9.1 对矩阵格的影响

- **A4（provider ID 统一 + 路由隔离）PASS 加强**：除 R2 的「无 `openrouter-free` 运行期残留、兜底常量一致」外，本轮再补「NO_ADAPTER 硬错误不跨池、文案按实际 provider 点名、prod 不误报 PoC」，并由 #7/#8 真断言锁死。
- **D 块静态引用 PASS**：发布说明引用的 repo commit/tag 均可解析，无悬空 hash；上游 vendor 锁定属外部引用、已 manifest 登记。
- **A5 / B3 / H1–H6**：维持 `MANUAL_PENDING`，仍不阻塞发布、不记 PASS。

### 9.2 最终签发结论（独立测试专家）

- **签发：v0.5.0 自动化验收门 = PASS，准予发布。** 无任何 `FAIL / BLOCKED / NOT_RUN` 阻塞项；41 functional verify exit 0、隔离 guard 149 文件零变化、provider 专项与发布说明静态引用均复跑通过。
- **放行动作（属所有者/开发，本专家不代做）**：
  1. 收尾工作树改动经**项目所有者授权提交**；
  2. 创建 `v0.5.0` 注解 tag；
  3. 打 tag 后**复跑一次 `node scripts/verify-isolation.mjs`**，把证据从「HEAD `2682fc7` + 工作树 diff」正式重绑到发布提交哈希；
  4. `MANUAL_PENDING`（M1/A5 真 Key 对话、M2/B3 3080 已认证同源走查、H1–H6 目视）保持登记；所有者反馈任一失败即重开对应块。
- 本专家全程**仅改本矩阵文件**，未改产品 src / 其他 docs / 服务，未提交、未 push。
