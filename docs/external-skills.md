# External（Vendor）Agent Skills 使用政策 external-skills.md

> **本文件是什么 / 给谁 / 怎么用**：本文件是 pm-tool 对**外部第三方 Agent Skill**（vendored Agent Skills）的**项目级强制治理政策**——任何编码平台（TRAE、豆包工作、Cursor、Copilot、其他 IDE/Agent 或人类）在**加载、执行、升级、回滚** `vendor/` 下任何第三方 skill 之前，必须先读本文件并遵守。它只规定"能怎么用、不能怎么用、谁优先、如何试点与毕业"，**不复制、不改写第三方 skill 的正文**。根 `AGENTS.md` 与 `docs/collaboration.md` 是项目既有硬规则；本文件与它们冲突时，**以更严格者为准**。

---

## 1. 目的与适用范围

- **目的**：在引入外部社区 Agent Skill 提升效率的同时，保证它们**不破坏仓库即唯一事实来源、不越权写全局配置、不碰只读边界、不替代独立测试门**，且在任何 IDE 下行为一致、可追溯、可回滚。
- **适用范围**：本仓库 `vendor/` 目录下所有第三方 Agent Skill；首批目标 vendor 为 `mattpocock`，落盘位置 `vendor/agent-skills/mattpocock/`。
- **不在本文件管辖**：项目自有 skill（见第 2 节）、上游 dsh 源码、业务代码本身。
- **本文件不做的事**：不联网抓取第三方内容、不复制第三方 skill 正文、不替所有者拍板引入新 vendor。第三方文件与 manifest 由专门的导入流程落盘，本文件只引用其结果。

## 2. 两类 Skill 的差异（必须分清）

| 维度 | 项目自有 Skill（`skills/`） | Vendor Agent Skill（`vendor/agent-skills/<vendor>/`） |
|---|---|---|
| 归属 | 本项目团队编写、维护 | 外部社区作者编写，本项目**只读引入（vendoring）** |
| 可否修改 | 可按项目需求改写、提交入库 | **只读**；任何改写只能在"适配层"做（第 7 节），**不得改动 vendored 原件** |
| 权威来源 | 仓库 `skills/` + `docs/requirements.md` | 第三方上游；本项目以 `manifest.json` 锁定版本与文件指纹 |
| 与项目规则冲突时 | 本来就是项目规则的一部分 | **一律以项目规则为准**，冲突即暂停该 skill |
| 安全信任度 | 项目自有，低风险 | 默认**半信任（试点期）**：每用一次都要留试点记录（第 9 节） |
| 典型例子 | `R2-wbs-task-breakdown`（规划中） | `grill-me` / `tdd` / `code-review` / `diagnosing-bugs`（首批） |

**一句话区分**：`skills/` 是"我们自己的操作手册"；`vendor/` 是"借来的外部流程，只能照着做、还得全程被本文件管着"。

## 3. 权威优先级（冲突时谁为准）

当多条指令要求不一致时，**自上而下，高位覆盖低位**：

| 优先级 | 来源 | 说明 |
|---|---|---|
| 1（最高） | 项目所有者人工特批 / 不可逆动作的人工确认 | 删除、覆盖、对外推送、改全局配置等高风险动作永远需人工确认 |
| 2 | 仓库项目硬规则：`AGENTS.md` 第 6/6A 节 + `docs/collaboration.md` + **本文件** | 三者冲突时以更严格者为准 |
| 3 | `vendor/agent-skills/<vendor>/manifest.json` | 锁定来源、版本、文件指纹、license、策略开关 |
| 4 | 各 vendor skill 自带的 `SKILL.md` 上游指令 | 仅在不违反 1–3 的前提下执行 |
| 5（最低） | 任何 IDE/平台的私有默认行为、平台内记忆 | 与以上冲突一律作废 |

**冲突处置规则**：
- vendor skill 的 `SKILL.md` 要求与第 2–4 节高位规则冲突时，**立即停止执行该 skill**，跳过冲突步骤，在试点报告中记录冲突点，并向项目所有者报备；**不得为了"跑完 skill"而放宽项目红线**。
- 任何平台内旧记忆、缓存与仓库/manifest 不一致时，以仓库最新状态为准（重申 `docs/collaboration.md` 第一节）。

## 4. 锁定来源：Vendor Manifest 契约

每个 vendor 的权威注册表是它的 manifest；首批权威路径固定为：

```
vendor/agent-skills/mattpocock/manifest.json
```

**manifest 必填字段**（导入 Agent 实现；本政策要求至少包含）：

| 字段 | 用途（以落盘的 `manifest.json` 实际契约为准） |
|---|---|
| `schemaVersion` | manifest 自身版本（当前为 `3`），便于格式演进 |
| `source.repo` / `source.commit` / `source.fetchedAtUtc` | 上游仓库地址、**锁定的 commit**、导入时间；"来源可追溯"的权威值 |
| `entrySkillIds[]` | 公开入口 skill 白名单（当前为 `grill-me`、`tdd`、`code-review`、`diagnosing-bugs`）；**只有其中的 id 可被直接触发** |
| `declaredDependencies[]` | 声明的运行时依赖（如 `grill-me → grilling`），含 `exposed`、`pureDocumentation`；**`exposed:false` 的依赖不是公开入口，不可被用户/Agent 单独直接加载** |
| `license.spdx` / `license.file` | 许可证 SPDX 标识（当前 `MIT`）与许可证文件位置（`license.file`，当前 `LICENSE`）；**无 license 或许可证不明者禁止引入** |
| `policy.projectRulesPrecedence` / `policy.noInstallerRun` / `policy.noHomeOrGlobalWrites` | 固定为 `true`：项目规则优先、不得自动运行安装/初始化脚本、不得写 home/全局配置（第 5 节） |
| `skills[]` | 每个 skill 一项，含：`id`、`kind`（`entry`/`dependency`）、`upstreamPath`、`vendoredPath`、`files[{path, sha256, bytes}]`、`riskNotes[]`、`externalProjectReferences[]`、`reviewStatus`、`reviewNotes` |

**使用前强制校验**：执行任一 vendor skill 前，按 manifest `skills[].files[]` 的 `sha256` 比对本地文件指纹（命令见第 11 节）。指纹不一致 = 文件被改过 = **立即停用并报障**，不得带病运行。

> **当前锁定来源**：`source.commit` = `49dd158d1076134a641b33efb035946536778336`（上游 `mattpocock/skills`，导入于 2026-10-13）。本政策不臆造 commit；升级时只改 manifest 的 `source.commit` 与 `skills[].files[]` 指纹，本文件同步一行更新即可，保证单一事实来源、不留悬空待办标记。

## 5. 通用红线（所有 vendor skill 一律遵守，逐字执行）

这 8 条对**首批 4 个 skill 与未来新增 vendor 全部适用**，无例外：

1. **不自动运行 setup / installer**：vendor skill 自带的任何安装、初始化、配置脚本（installer、setup、postinstall、首次运行向导等）**不得自动执行**；确有必要运行某一步，须先向项目所有者报备并记入试点报告，默认结论应为"不运行"。
2. **不写 home / 全局配置**：禁止任何 vendor skill 写入 `$HOME` 下全局/用户配置（如 `~/.config`、`~/.npmrc`、shell rc、全局工具配置、全局 PATH、全局缓存安装）。需要依赖时，只允许用项目内或 `$HOME/.local` 下**本会话临时**方式，且不持久化全局状态。
3. **业务数据 `data/` 只读**：对 `pm-tool/data/` 业务数据，vendor skill **只读不写**；任何写入业务数据的动作一律禁止（写数据只能走插件自身的 `ctx.commands`）。
4. **上游只读**：绝不修改 `~/Projects/dsh-pm/deepseek-harness/` 内任何文件（重申 `AGENTS.md` 第 6 节）。
5. **不替代独立测试专家门**：vendor skill（尤其 `tdd`、`code-review`）**不得**自封 PASS、不得替代 `docs/collaboration.md` 第九节的独立测试专家门；开发/执行方不得既执行又自验收，GUI 实测与 `verify-*.mjs` 通过**不能互相替代**。
6. **不可逆动作须人工确认**：删除文件、覆盖他人成果、改全局/系统配置、对外推送/发布，必须先征得项目所有者同意（重申 `AGENTS.md` 第 6 节）。
7. **试点期不联网抓新内容**：试点与毕业阶段只用已 vendored、已锁定的版本；**不得**为了"对齐上游最新"临时联网拉取（联网抓取属于升级流程，走第 8 节双审）。
8. **只读 vendored 原件**：执行 vendor skill 时只读 `vendor/` 下原件，**不得把它复制到项目别处再改**，避免产生漂移副本（第 7 节）。

## 6. 首批 4 个 Skill 登记表

> 以下"项目授权用途 / 禁止事项 / 触发方式"是**本项目治理层面对每个 skill 的授权边界**。**触发方式为 Agent 自动路由（见 6.1），不需要也不允许用户显式指定或挑选 skill**。各 skill 的**具体步骤、命令、提示词以其 vendored `SKILL.md` 原文为准**——本文件不复制第三方正文，也不臆造其内部实现。执行时若 `SKILL.md` 步骤越界，按第 3 节冲突处置跳过。

| Skill id | 项目授权用途（允许做什么） | 禁止事项（在通用红线上的具体化） | 触发方式（IDE 无关） | 来源版本 |
|---|---|---|---|---|
| `grill-me` | 在需求/方案有歧义时，以**苏格拉底式追问**帮项目所有者把问题问清楚、暴露未决假设，产出"待拍板清单" | 禁止替所有者做技术/产品决策；禁止在追问未结束就动手写代码；禁止把追问输出写成"已定方案"直接实施。**它本身只是触发桩**（其唯一指令是"调用 grilling"）：`grilling` 是它的**声明式纯文档依赖**（manifest `declaredDependencies`，`exposed:false`、`pureDocumentation:true`），**不是公开入口、不可被单独直接触发/加载**，只在 `grill-me` 被调用时作为运行时正文随之生效 | **Agent 自动路由**：需求/方案存在歧义、关键条件不明确时自动加载 `grill-me`（而非直接加载 `grilling`）进入提问环节；`grilling` 随之生效 | manifest `source.commit` |
| `tdd` | 指导"先写测试再写实现"的开发节奏，作为开发侧编码方法参考（其配套 `tests.md`、`mocking.md` 已一并 vendored） | **不得**绕过/替代独立测试专家门（ADL-045）；其自测通过**不等于**专家 PASS；不得因 TDD 绿了就跳过 GUI 实测与回归。**当其 SKILL.md 引用未 vendored 的 `codebase-design`（超出固定 4 个入口范围）时，不得去调用/寻找该缺失 skill**——就"接口 seam 如何切、实现到多深"与项目所有者/项目规范**就地拍板**，**不得因缺这个 skill 而阻塞红绿（红→绿→重构）循环**；其提到的项目根 `GLOSSARY.md` 属"若存在则用"的项目文件，不存在即跳过、不阻塞 | **Agent 自动路由**：进入新功能或可测缺陷实现时，自动加载组织红绿重构；测试判定仍归测试专家 | manifest `source.commit` |
| `code-review` | 对本分支改动做质量自查：命名、边界、明显安全问题、与既有约定一致性（引用的 `git diff/log/rev-parse` 均为只读命令） | 禁止**自动批准/合并**；禁止直接 `git push`；禁止把 review 结论当验收通过；不得修改上游。**当其 SKILL.md 提示"未配置 issue 跟踪器时运行 `/setup-matt-pocock-skills`"——该上游 setup skill 未 vendored 且明确禁止运行**；改用**项目自有 onboarding**（`docs/onboarding-prompt.md` + `AGENTS.md`），不执行任何上游安装/初始化 | **Agent 自动路由**：每次改动闭环、报备提交/交付前，自动加载做一次自查并把发现记入试点报告 | manifest `source.commit` |
| `diagnosing-bugs` | 对复现的缺陷做结构化根因定位（现象→假设→验证→根因），产出诊断记录（其"密钥脱敏为占位符"指引与项目规则一致） | 禁止在诊断过程中**静默改代码**；禁止改 `data/` 或上游；诊断结论不等于修复，修复仍走正常开发+测试门。**其末位兜底的 HITL 循环脚本 `scripts/hitl-loop.template.sh` 被有意排除、未 vendored（本 vendor 内不可用）——不得补写、重建或运行该脚本**；改走**人工终端清单**：在人工终端里按其方法学逐条确认假设、手动记录 `KEY=VALUE` 观测即可 | **Agent 自动路由**：出现复现异常、回归未过、根因未明时，自动加载做根因分析，再开缺陷交开发修复 | manifest `source.commit` |

**公开入口 vs 声明依赖**：`entrySkillIds` 的 4 个是唯一可被直接触发的 skill；`grilling` 是 `grill-me` 的 `exposed:false` 纯文档依赖，只随 `grill-me` 生效，**任何 IDE 不得把它注册成独立入口**。

**共同点**：四者都只在**项目目录内、只读 `vendor/`、遵守第 5 节 8 条红线**的前提下被调用；任何"帮你自动装好、配好全局、直接提交推送"的倾向一律拒绝。

### 6.1 自动路由规则（Agent 自主判断，无需用户指定）

**核心原则**：**不要求用户显式指定/念口令/挑选 skill**。Agent 在接到任务后，按任务语义**自动判断**是否加载某个 vendored skill；**仅当预计有明确质量增益时才加载**，否则按项目常规流程直接做。

| taskKind（任务类别） | 自动加载 | 边界语义 |
|---|---|---|
| `requirement`（需求/方案有歧义、多个后果差异较大选项、关键条件不明确） | `grill-me` | 若已触发"缺关键阻塞信息"的交互确认规则（直接向用户追问即可解锁），**该规则优先**；grill-me 用于系统性暴露假设，不替代正常的阻塞信息确认 |
| `feature`（新功能 / 可测缺陷的编码实现） | `tdd` | 组织红绿重构；测试判定仍归独立测试专家；**trivial 小改不套 tdd** |
| `rootCause`（复现异常 / 回归未过 / 根因未明） | **仅** `diagnosing-bugs` | **只加载 diagnosing-bugs，不叠加 `code-review`**；HITL 脚本不可用，走人工终端清单 |
| `delivery`（一次改动闭环、报备提交/交付之前） | `code-review` | **即使是 trivial 改动，交付前仍允许 review**；不自动批准、不推送 |
| `trivial`（简单问答、小修小改、套用既有模式、加载无明显增益） | **不加载任何 vendored skill** | **抑制 `grill-me` 与 `tdd`**；唯一例外：进入 `delivery` 阶段时仍允许 `code-review` |

**自动调用的硬性前置（每次都要做，不因"自动"而省）**：
1. **先过完整性校验并置标记**：按 manifest `skills[].files[]` 核对 `sha256`，**verify 通过才置 `vendorIntegrityVerified=true`**；任一阻塞条件（指纹不符、安全门越界、测试门 `FAIL/BLOCKED`）一律**拦截、不放行自动调用**，按第 3/12 节处置。
2. **过安全门**：遵守第 5 节 8 条红线，越界步骤按第 3 节跳过。
3. **taskKind + 理由留痕**：把 `taskKind`（`requirement`/`feature`/`rootCause`/`delivery`/`trivial`）、加载了哪个 skill、路由理由、`vendorIntegrityVerified` 结果、行为、越权检查、verify、专家结论记入试点报告（`docs/templates/external-skill-pilot-report.md`）；常规小任务可并入任务证据，但不得完全无记录。

**禁止**：为走形式而强行加载 skill；要求用户说出 skill 名、在多个 skill 中做选择，或把"是否用某 skill"抛回给用户。

## 7. 跨 IDE 加载适配规则（只适配、不复制漂移）

不同 IDE/Agent 加载 skill 的方式不同，但**适配层必须极薄**：

1. **只做"加载/读取"适配**：某 IDE 若需要把 `vendor/agent-skills/<vendor>/skills/<id>/SKILL.md` 注册成它能识别的指令入口，只能写一份**指向 vendored 原件的引用/索引**（路径、id、一句话用途），**不得复制其正文**。
2. **禁止复制漂移**：不得在 `vendor/` 之外另存一份该 skill 的拷贝并各自演化；任何 IDE 看到的都应是 `vendor/agent-skills/mattpocock/skills/<id>/SKILL.md` **同一个文件**。
3. **适配配置随仓库走**：若某 IDE 需要私有配置文件才能加载，该配置必须放进仓库、用通用 Markdown/JSON 描述，并在本文件登记；**禁止**写进 IDE 的用户级全局设置。
4. **IDE 私有标记不入正文**：skill 正文与本政策均用通用 Markdown，不使用仅某工具识别的私有标签（重申 `docs/collaboration.md` 第七节）。
5. **适配层本身要过 verifier**：新增的加载索引/适配文件，交付前按第 11 节流程跑一次格式与指纹校验。

## 8. 升级双审 / 版本锁定 / 回滚

### 8.1 版本锁定
- vendor skill 一经引入即**锁定在 manifest 的 `source.commit`**；试点期内**冻结升级**，所有平台跑的都是同一锁定版本。
- 任何"悄悄换成最新版"都视为违反锁定，按第 12 节处置。

### 8.2 升级双审（不可单人完成）
升级（换 commit / 加新 skill）必须过**双审**：
1. **导入/技术审**：一方负责拉取上游新版本、更新 manifest、重算 `files[].sha256`、核对 license，并产出变更 diff；
2. **安全/越权审**：另一方（非导入方）对照本文件第 5 节红线，审阅新版 `SKILL.md` 是否新增了写全局、联网、自动安装、提权等行为，给出放行/驳回。
- 两审均通过、且在试点报告中留痕后，方可更新 manifest；任一审驳回即维持旧版本。

### 8.3 回滚
- 升级后若出现越权、行为不符或破坏既有验证：**立即把 manifest 的 `source.commit` 指回上一个已验证版本**（manifest 是唯一开关，回滚不改业务代码），并在试点报告记录触发原因。
- 回滚后须重跑受影响的 `scripts/verify-*.mjs` 与文档 verifier，确认恢复到可演示状态。

## 9. 试点与毕业标准

### 9.1 试点期
- 每个新引入的 vendor skill 先进入**试点**：每用一次填一份 `docs/templates/external-skill-pilot-report.md`，归档到 `docs/verification/external-skills/`。
- 试点期默认：锁定版本、红线全开、逐次留痕、测试专家结论独立给出。

### 9.2 毕业标准（全部满足才算"可常规使用"）
1. 至少 **3 份**不同任务场景的试点报告，且测试专家结论均为 `PASS`（或 `MANUAL_PENDING` 项已由用户反馈闭环）；
2. 每份报告"越权检查"8 项**全部为否/不适用**，无违例；
3. 文件指纹（sha256）与 manifest 全程一致；
4. 未触发任何第 3 节冲突，或冲突已记录并经所有者确认；
5. 项目所有者人工确认毕业。
- 毕业不等于解除红线：第 5 节 8 条红线**长期有效**，仅免除"逐次必填试点报告"的留痕强度（仍保留异常上报）。

## 10. 人工待验证（MANUAL_PENDING）规则

沿用 `docs/collaboration.md` 第九节 ADL-047 的分层口径：

- 因**系统能力或认证所限、必须项目所有者本人配合**才能验证的项（如真实 GUI 目视、账号授权、手动确认类），在试点报告登记为 `MANUAL_PENDING`；
- `MANUAL_PENDING` **既不算 PASS、也不阻塞当前自动化验收**；但**不得**据此标记该 skill"毕业"，毕业仍需所有者确认；
- 用户反馈某 `MANUAL_PENDING` 项失败 → **立即重开**对应缺陷与该 skill 的放行门；
- **高风险/不可逆动作不受此分层豁免**：删除、覆盖、恢复、对外推送仍须人工确认，不得登记为 `MANUAL_PENDING` 后自动执行。

## 11. 跨 IDE 调用示例表（不绑定任何特定 IDE）

> 任何 IDE/Agent 对 vendor skill 的"调用"本质上只有两件事：**(a) 只读加载 vendored `SKILL.md` 作为指令；(b) 在遵守本文件红线的前提下执行其中不越界的步骤**。下表是一套与具体 IDE 无关的标准动作序列（命令为通用 shell，运行环境 macOS + zsh + nvm Node 22 + pnpm 11.28.5）。

| 步骤 | 动作 | IDE 无关的操作 / 命令 | 通过标准（检查点） |
|---|---|---|---|
| 0 预检 | 确认工作区干净、已同步 | `git status -sb` | 无未提交改动、不落后于 `origin/main` |
| 1 定位 | 读 manifest 锁定版本 | 打开 `vendor/agent-skills/mattpocock/manifest.json` | 记下 `source.commit` 与目标 `skill id` |
| 2 读指令 | 只读加载该 skill | 打开 `skills/<id>/SKILL.md` | 只读取，**不执行其中任何 installer/setup** |
| 3 校指纹 | 比对文件未被改动 | 按 manifest `files[]`：`shasum -a 256 <vendoredPath>/SKILL.md` | 与 manifest `sha256` 逐位一致 |
| 4 自动路由 | 按任务语义选定是否/加载哪个 skill | 按 6.1 规则自动判定：是否有质量增益、命中哪条路由；**不向用户索取 skill 名或让其挑选** | 路由理由可复述给用户，但选择由 Agent 做出；无增益则不加载 |
| 5 执行 | 按 SKILL.md 做不越界步骤 | 仅在项目目录内读写；不碰 `data/` 写、不碰上游、不写 `$HOME` | 无第 5 节 8 条红线触发 |
| 6 越权自检 | 逐项勾试点报告第 3 节 | 对照 8 条红线打勾 | 无"是"项 |
| 7 验证 | 跑项目验证 + verifier | `cd packages/dsh-pm-tool && pnpm run build`；受影响 `node scripts/verify-*.mjs`；`verifier rubric check-file-format <产物> --expected-ext .md` | 退出码 0；文档格式校验 PASS |
| 8 留痕 | 填试点报告 | 复制 `docs/templates/external-skill-pilot-report.md` 另存归档 | 测试专家结论已填、绑定被测提交哈希 |

**不同 IDE 的唯一差别**只是"如何把 `SKILL.md` 喂给当前 Agent"（第 7 节薄适配）；上表第 1→8 步对所有 IDE 完全一致，保证跨平台行为可复现。

## 12. 违例处置与本文件维护

- **违例即停**：一旦触发第 5 节任一红线或第 3 节冲突，立即中止该 skill 执行，在试点报告记录，并向项目所有者报备；是否恢复由所有者决定。
- **本文件维护**：新增 vendor、新增首批外的 skill、调整红线或毕业标准时，须同步在 `docs/decision-log.md` 追加 ADL 条目、在 `docs/changelog.md` 留痕（平台标识见 `docs/collaboration.md` 第二节）。
- **与既有文档关系**：本文件是 `AGENTS.md` 第 6 节硬约束在"外部 skill"场景的细化；本文件不修改 `AGENTS.md` / `decision-log` / `packages` / `scripts` / `vendor` 本体，只做治理与适配说明。
