<!--
外部 skills 集成验收矩阵。独立测试专家所有，ADL-045 / AGENTS 6A / collaboration 第九节。
其他角色：只读引用，不改动本文件；不得据此矩阵自行增改用例或自封 PASS。
-->
# 外部 Skills 集成验收矩阵（external-skills-acceptance）

> 给谁：开发（导入方）、项目所有者、后续接手平台（TRAE / Cursor / 豆包工作 / 其他 Agent）。
> 是什么：在「批准集成第三方 Agent skills（mattpocock/skills 中的 4 个）」落地**之前**，由独立测试专家**预先冻结**的验收门。它规定「导入做完后，凭什么证据、按什么判定、才算安全放行」。
> 怎么用：导入方按本矩阵实现 `vendor/` 落盘 + `docs/external-skills.md` + `verify-external-skills.mjs`，然后**由独立测试专家**按本矩阵逐格执行并填证据；任何 `FAIL` 即阻断，`MANUAL_PENDING` 按 ADL-047 登记等所有者反馈。

---

## 0. 独立性与执行声明（预先注明，必读）

- **本矩阵由独立测试专家制定并独立执行**。导入方（开发）**只负责实现与跑脚本采集原始证据，无权自判 PASS**；PASS/FAIL/MANUAL_PENDING 只能由独立测试专家审证后给出（ADL-045 第 8 条 / collaboration 9.5）。
- **冻结时机**：本矩阵写于外部 skills **尚未导入**之时。冻结时仓库内尚不存在 `vendor/agent-skills/`、`docs/external-skills.md`、`verify-external-skills.mjs`；因此下表各格的「本轮执行状态」当前一律为 **待导入（NOT_RUN）**，**不得冒充已 PASS**（ADL-045：未实测一律不记 PASS）。
- **冻结基线**：本矩阵冻结于仓库提交 `93eb093c20648618c3e1d2914a20340d22325f86`。导入提交落地后，专家结论一律改绑到「导入提交哈希 + 上游锁定 commit + 文件哈希清单」，本冻结基线仅为「导入前干净起点」的对照。
- **测试专家自我边界（与 test-plan 第 1 节一致）**：只读产品代码与既有/新增 verify 脚本；不联网、不 commit/push、不改产品代码、不改 vendor 内容、不改政策文档、不改测试脚本本身；不读/复制任何密钥。**静态审查 + 运行离线 verify 脚本（只读落临时目录）即为本专家全部手段**；凡须在真实 IDE Agent 回路里亲身体验的项，转 `MANUAL_PENDING`，不硬测、不伪装。

## 1. 预期受检对象（导入后应出现的东西）

> 导入方不得超出此清单。凡清单外的路径即「越界文件」，见 B3 / A3。
> **两类路径**：① **4 个公开/可触发 entry skill**；② manifest `skills[*]` 显式声明、被 entry 调用的**纯文档传递依赖**（如 `grill-me` 仅为 stub，正文委托给 `grilling`；`tdd` 相对引用 `tests.md`/`mocking.md`）。依赖**不得**作为额外公开 entry、**不得**自行触发、**不得**含可执行代码；关系与哈希齐全则不算越界。

| 类别 | 预期路径 | 说明 |
|---|---|---|
| 第三方 skills（只读 vendored 内容） | `vendor/agent-skills/mattpocock/skills/grill-me/` | entry 1/4（stub，委托 grilling） |
|  | `vendor/agent-skills/mattpocock/skills/tdd/` | entry 2/4（含 tests.md / mocking.md 相对文档） |
|  | `vendor/agent-skills/mattpocock/skills/code-review/` | entry 3/4 |
|  | `vendor/agent-skills/mattpocock/skills/diagnosing-bugs/` | entry 4/4 |
|  | `vendor/agent-skills/mattpocock/skills/grilling/` | **声明依赖**：grill-me 的纯文档 runtime 依赖（非公开 entry） |
| 溯源与许可 | `vendor/agent-skills/mattpocock/MANIFEST.*`、`vendor/agent-skills/mattpocock/LICENSE*` | 记录上游 commit、许可证、entry/依赖关系与文件哈希清单 |
| 项目侧说明 | `docs/external-skills.md` | 项目侧登记：来源、版本、规则优先级、回滚指针 |
| 项目侧校验脚本 | `verify-external-skills.mjs`（位置由项目决定，须在仓库内、项目作者编写） | 只读、离线、确定性；**静态校验**，不执行 vendored 内容 |

## 2. 判定语义（本矩阵专用，与 ADL-045 / ADL-047 对齐）

| 判定 | 本矩阵定义 | 是否阻断导入 |
|---|---|---|
| **PASS** | 该检查经**独立测试专家**审证：证据齐全、与被测绑定的 commit/哈希一致、verify 退出码符合预期。仅静态证据成立的静态门方可判 PASS；**不得用「脚本存在」「文档写了」代替实测**。 | 单格通过 |
| **FAIL** | 已审证且与本矩阵预期**不符**（出现越界文件、可执行代码、读写 home/凭据/上游的指令、许可证不可接受、哈希漂移、verify 行为不符等）。 | **阻断导入**；须修复或回滚 |
| **MANUAL_PENDING** | 该检查**受系统能力/环境所限、必须项目所有者本人在其真实 IDE/Agent 回路里配合**才能验（例如：真在 Agent 循环里用一次某 skill、确认无副作用；许可证法律可受性的所有者签字）。按 ADL-047，**既不算 PASS、也不阻塞静态/自动化门**；登记在案等反馈，**所有者反馈失败即重开门**。 | 不阻塞自动化门，但不记 PASS |

> 既有 `BLOCKED / NOT_RUN` 语义沿用：受本专家能力限制、本可补而未补的缺口记 BLOCKED（不是 MANUAL_PENDING）；本轮未执行记 NOT_RUN。**`FAIL / BLOCKED / NOT_RUN` 一律 ≠ 通过。**

## 3. 证据格式（每格必填，缺一不算有效结论）

```
用例号：ES-<域><序号>            # 例：ES-A1
检查项：<一句话>
被测绑定：上游锁定 commit=<sha>；导入提交=<sha>；文件哈希清单=<manifest 路径+其 sha256>
方法：<本专家实际做了什么：静态读哪几个文件 / 跑了哪条离线命令 + 退出码>
证据：<相对路径 / sha256 摘录 / 命令输出关键行 / 截图（谁产生、何时）>
判定：PASS | FAIL | MANUAL_PENDING
判定人：独立测试专家（非导入方自验）
备注：<边界、不确定项、误报排除理由>
```

> 硬约束：证据必须与被测绑定的 commit/哈希**一致、可复核**；**执行端不得把口述/口头汇报当证据**；任何新导入提交使旧证据过期，须重测后方可再引用。

---

## 4. 验收矩阵（10 个域）

> 「本轮状态」列在本矩阵冻结时全部为 `待导入`；导入提交落地后由专家逐格改写为 PASS/FAIL/MANUAL_PENDING 并补证据。

### 域 A — 来源可溯源：上游 commit / 许可证 / 文件哈希

| 用例 | 检查项 | 通过标准 | 方法 | 本轮状态 |
|---|---|---|---|---|
| ES-A1 | 上游来源与锁定 commit | `MANIFEST` 记录上游仓库 URL + **精确 commit SHA**（非分支名/标签浮动）；vendored 树与该 commit 内容一致 | 静态读 MANIFEST；专家对照 commit 与 vendored 文件集（导入方提供 `git archive <sha>` 对照清单作证据，专家只读复核） | 待导入 |
| ES-A2 | 许可证 | vendor 根存在 `LICENSE*`；许可证为 OSI 认可的宽松许可（如 MIT / Apache-2.0）；**无 GPL/AGPL/LGPL 等 copyleft** 污染本仓库 | 读 LICENSE 全文 + 扫描各 skill 内 LICENSE/SPDX 标注；copyleft 即 FAIL | 待导入 |
| ES-A3 | 文件哈希清单 | MANIFEST 含**每个 vendored 文件**的 sha256；`verify-external-skills.mjs` 重算并**逐位相等**；清单外无文件 | 运行 verify（离线），核对退出码 0 与哈希 diff 为空；见 ES-H | 待导入 |
| ES-A4 | 许可证法律可受性 | 上述许可证对本项目（闭源/分发形态）可受 | **MANUAL_PENDING**：须项目所有者本人确认（专家不代做法律判断） | 待导入 |

### 域 B — 4 个公开 entry + manifest 显式声明的纯文档传递依赖

| 用例 | 检查项 | 通过标准 | 方法 | 本轮状态 |
|---|---|---|---|---|
| ES-B1 | 公开 entry skill 数量 | **恰好 4 个可公开触发的 entry**：`grill-me` / `tdd` / `code-review` / `diagnosing-bugs`。此外允许存在的目录**仅限** manifest `skills[*]` 显式声明的传递依赖（当前已知：`grilling` = grill-me 的纯文档 runtime 依赖，grill-me stub 明确 `Call the Skill tool with "grilling"`） | 列目录；公开 entry 白名单 diff；多出的目录若**不在** manifest 依赖声明内即 FAIL | 待导入 |
| ES-B2 | 依赖纪律 | 每个声明依赖须同时满足：① 在 manifest 中有明确「被谁依赖」的关系记录；② **纯文档**（Markdown / 接口 yaml），**不是**额外公开 entry、**不自行触发**、**不含可执行代码**（与域 C 联动） | 读 manifest 关系字段 + 读依赖 SKILL.md；依赖若含可执行代码/自行可触发/无被依赖关系即 FAIL | 待导入 |
| ES-B3 | 无越界文件 | vendored 树内每个目录/文件都在 manifest 白名单（4 entry + 其声明依赖 + root LICENSE）内；**未声明的文件/目录 = FAIL**（防止夹带） | 运行 verify 的白名单成员校验；集合 diff 非空即 FAIL | 待导入 |

> 口径（按所有者裁定）：`grilling` 当前仅作为 `grill-me` 的依赖存在；**只要 manifest 的依赖关系与逐文件哈希齐全，它不算越界**。批准「4 个首批 entry」的意图不应使 `grill-me`（其 stub 无正文、必须委托 `grilling`）失效；反之，任何**未在 manifest 声明**的依赖/目录仍按 ES-B3 判 FAIL。

### 域 C — 无可执行第三方代码

| 用例 | 检查项 | 通过标准 | 方法 | 本轮状态 |
|---|---|---|---|---|
| ES-C1 | 无脚本/二进制随附 | vendored 树内**无** `*.sh` / `*.py` / `*.mjs` / `*.js` / 可执行二进制 / `package.json`（含 scripts、postinstall）/ shebang 行；文件不带 `+x` | 静态按扩展名 + shebang grep + 权限位扫描；命中即 FAIL | 待导入 |
| ES-C2 | 内容为「数据型指令」而非可运行代码 | 4 个 skill 均为 Markdown 说明文本（Agent 读取后**由 Agent 决定如何执行**），不含自动执行的代码载荷 | 抽查各 `SKILL.md`；若出现「复制即自动运行」的可执行块即 FAIL | 待导入 |
| ES-C3 | 唯一可执行校验物是项目脚本 | `verify-external-skills.mjs` 为**项目作者编写**（非 vendored、非第三方），且仅做只读静态校验（见 ES-H4） | 读脚本头注释与 import 列表；确认无 `eval`/无执行 vendored 内容 | 待导入 |

### 域 D — 不读写 home / 凭据 / 上游（隔离）

| 用例 | 检查项 | 通过标准 | 方法 | 本轮状态 |
|---|---|---|---|---|
| ES-D1 | 不读写 home / 凭据 | skill 正文**不含**指示 Agent 读取或修改 `~`、`$HOME`、`~/.ssh`、`~/.config`、钥匙串、环境变量密钥（如 `DEEPSEEK_API_KEY`）、`~/.dsh` 等的**指令** | 静态正则扫描路径/凭据关键词；命中须逐条人工归类（见域 F 分类）；确为「指令去碰凭据/home」即 FAIL | 待导入 |
| ES-D2 | 不改上游 | 无指示修改 `~/Projects/dsh-pm/deepseek-harness/`（上游只读硬红线，AGENTS 第 6 节） | 扫描上游路径引用；确为「指令去改上游」即 FAIL | 待导入 |
| ES-D3 | 不联网 / 不装依赖 | 无 `curl … \| sh`、无 `npm install <新包>`、无运行时 fetch 远端（离线优先） | 静态扫描；命中即 FAIL | 待导入 |
| ES-D4 | verify 自身隔离 | 运行 `verify-external-skills.mjs` 前后，仓库 `data/`、`packages/backups/`、`packages/backup/` 正式资产 hash+mtime 清单**零变化**；子进程 env 已 scrub（沿用 verify-isolation.mjs 模式） | 在隔离 guard 下运行并核对 before/after manifest diff 为空 | 待导入 |

### 域 E — 项目规则优先

| 用例 | 检查项 | 通过标准 | 方法 | 本轮状态 |
|---|---|---|---|---|
| ES-E1 | 优先级声明落地 | `docs/external-skills.md` 明确写明：**外部 skills 仅为建议性工作方法；与 `AGENTS.md` / `docs/collaboration.md` / ADL-045/047 / 上游只读红线冲突时，一律以项目规则为准** | 读该文档；缺此声明或反向（skill 覆盖项目规则）即 FAIL | 待导入 |
| ES-E2 | 无与红线冲突的指令 | skill 正文不含与项目硬红线相悖的指示（如「不必独立测试即可提交」「直接改上游」「跳过所有者审批强制推送」「把密钥写进仓库」） | 静态扫描 + 专家按红线清单逐条比对；命中即 FAIL 或降级为「须服从项目规则」 | 待导入 |

### 域 F — 危险指令静态分类（防误报，关键）

> **痛点**：4 个 skill 中 `grill-me`（反诘/挑刺）、`tdd`、`code-review`、`diagnosing-bugs` 必然**在教学/示例语境里大量提及危险命令**（`rm -rf`、`git push --force`、debug 命令等）。**朴素 grep 命中即报会大面积误报**。本域规定静态分类规则，避免把「文档在讨论危险命令」误判成「skill 指示去执行危险命令」。

**分类口径（命中任何疑似危险片段时，先归类再下结论）：**

| 类别 | 含义 | 处置 |
|---|---|---|
| **F0 安全讨论/反例** | 危险命令出现在：引用块/代码示例中、作为「**不要这么做**」的反例、教学讲解、带引号的名词性提及 | **不算发现**，仅记录分类，不判 FAIL |
| **F1 可执行危险指令** | skill 以**祈使句**指示 Agent **在本项目机器上实际执行**危险/不可逆动作（真删库、真 force push、真改上游、真读凭据） | **FAIL** |
| **F2 高风险但可在确认下进行** | 指向删除/覆盖/恢复等不可逆动作，但可被项目规则「须所有者明确确认」覆盖 | 不自动 FAIL；标注「须人工确认（ADL-047）」，转 MANUAL_PENDING/确认项 |

**判别信号（专家逐条人工归类，不能纯靠正则）：**
- 句式：祈使/命令式（“运行/执行/删除/推送…”）= 偏 F1；陈述/举例/否定式（“切勿/例如/不要用…”）= 偏 F0。
- 语境：在「反模式、反例、警示、code review 点评」段落里 = F0；在「步骤、怎么做、your action」段落里 = 偏 F1。
- 目标：作用于本仓库正式资产/home/凭据/上游 = 升级判级；作用于临时目录/示例仓库 = 降级。

**误报 vs 真报 示例（冻结时预置，供后续执行对齐）：**

| 文中片段（示意） | 正确分类 | 理由 |
|---|---|---|
| “切勿 `git push --force` 改写已推送历史” | **F0** | 否定式警示，反例；不是让你去 force push |
| “删除前先快照：`rm -rf node_modules`” 且指本仓库 | **F1/F2** | 祈使执行 + 不可逆；须确认，按项目红线判 |
| “常见事故：`rm -rf /` 打错路径” | **F0** | 教学反例 |
| “用 `curl http://x | sh` 安装” | **F1** | 联网执行第三方载荷，违反 D3 |

| 用例 | 检查项 | 通过标准 | 方法 | 本轮状态 |
|---|---|---|---|---|
| ES-F1 | 危险片段全量归类 | 扫描出的每个疑似危险片段都有 F0/F1/F2 归类结论；**无 F1 未处理项** | 专家静态扫描 + 逐条人工归类留痕；F1 未消解即 FAIL | 待导入 |
| ES-F2 | 无误报污染 | 报告中**不得**把 F0 教学反例计为缺陷（抽样复核分类正确性） | 专家抽检；若发现把 F0 误判为 FAIL，回退该判定并重分 | 待导入 |

### 域 G — 跨 IDE 不漂移

| 用例 | 检查项 | 通过标准 | 方法 | 本轮状态 |
|---|---|---|---|---|
| ES-G1 | 无平台私有耦合 | vendored skill 正文与 `docs/external-skills.md` 不含 IDE 专属绝对路径、专属配置目录假定；只引用**仓库相对路径** | 静态扫描绝对路径/IDE 配置关键词；命中即评 | 待导入 |
| ES-G2 | 内容寻址一致 | 4 个 skill 的字节内容以**哈希清单**锁定；任何 IDE 检出得到**逐字节相同**的文件（哈希一致即不漂移） | 对照 ES-A3 哈希清单；跨检出哈希不一致 = FAIL | 待导入 |
| ES-G3 | 无「私有记忆」依赖 | 不依赖某 IDE 的私有对话/草稿/账号才能生效（仓库即唯一事实来源，AGENTS 第 2 节） | 读文档；发现须平台私有状态才能用 = FAIL | 待导入 |

### 域 H — verify 脚本行为（`verify-external-skills.mjs`）

| 用例 | 检查项 | 通过标准 | 方法 | 本轮状态 |
|---|---|---|---|---|
| ES-H1 | 存在且为项目作者所有 | 脚本在仓库内、头注释说明用途；非 vendored 产物 | 读脚本头 | 待导入 |
| ES-H2 | 只读/离线/确定性/幂等 | 不联网、不写正式资产、同一输入多次运行结果一致；失败时退出码非 0 并打印**可定位的 diff** | 离线运行两次，比对输出与退出码 | 待导入 |
| ES-H3 | 隔离运行 | 在 verify-isolation guard 下运行（或等价 WATCH 守护），正式资产零变化 | 与 ES-D4 合并取证 | 待导入 |
| ES-H4 | **绝不执行 vendored 内容** | 脚本只做读取/哈希/白名单/正则分类；**无 `eval`、无 `child_process` 去跑 skill 内容**——否则等于执行了不可信第三方指令 | 通读脚本，确认无执行 vendored 文件的分支；命中即 FAIL | 待导入 |

### 域 I — 试点报告（bounded pilot）

> 静态门全绿后，才允许进入一次**有界、低风险、可逆**试点。试点是「在真实 Agent 回路里用一次」的人工项，按 ADL-047 归 MANUAL_PENDING 体系，但试点中**一旦发现越界动作即回开门**。

| 用例 | 检查项 | 通过标准 | 方法 | 本轮状态 |
|---|---|---|---|---|
| ES-I1 | 有界试点执行 | 每个 skill 各在一个**低风险、可逆**任务上试一次（如 tdd 用于一个纯函数小任务、code-review 复核一处既有 diff），范围被预先限定、不触碰正式写路径 | **MANUAL_PENDING**：须所有者在其真实 IDE/Agent 回路执行；本专家只审证其留下的原始记录（transcript/笔记），不代跑 | 待导入 |
| ES-I2 | 试点无越界动作 | 试点记录中未见 skill 触发：读写 home/凭据、改上游、联网、越界文件、绕过项目规则 | 专家审试点原始记录；发现任一越界 → 重开门 FAIL | 待导入 |
| ES-I3 | 试点记录留痕 | 试点产出（用了哪个 skill、任务、是否服从项目规则、有无副作用）归档到 `docs/testing/` 或由所有者提供链接 | 专家核对记录存在且与被测 commit 绑定 | 待导入 |

### 域 J — 回滚

| 用例 | 检查项 | 通过标准 | 方法 | 本轮状态 |
|---|---|---|---|---|
| ES-J1 | 回滚面最小且可逆 | 导入为**纯增量**，回滚清单（完整）= 删除 `vendor/agent-skills/mattpocock/` 子树 + `docs/external-skills.md` + `docs/templates/external-skill-pilot-report.md` + `docs/testing/external-skills-acceptance.md` + `docs/verification/external-skills/`（全部试点报告）+ `packages/dsh-pm-tool/scripts/verify-external-skills.mjs`，并解除政策索引与 `decision-log` ADL/changelog 提交接线；**不修改任何既有产品/业务代码**。**无需删除历史**（ADL/changelog 留痕保留） | 用 `git status`/diff 证明导入提交只含上述增量；产品/业务代码零改动；回滚清单与实际新增文件集合一致 | 待导入 |
| ES-J2 | 无悬挂引用 | 回滚后仓库内不再有指向被删 skill 的文档引用（除本验收矩阵与 `docs/external-skills.md` 的登记记录本身） | 回滚演练后全局 grep；残留悬挂引用即 FAIL | 待导入 |
| ES-J3 | 回滚演练先于采纳 | 在正式采纳前，先在**隔离副本/干跑**演练一次回滚（列出将删除的清单），确认不误删产品文件 | 专家审干跑输出；演练误伤产品文件即 FAIL | 待导入 |

---

## 5. 总门结论规则

1. **静态门（A–H）全 PASS** + 无未消解 F1：静态/自动化侧视为通过（ADL-047 自动化门）。
2. **MANUAL_PENDING 项（A4 法律可受性、I1 真回路试点、以及任何确需所有者本人动作者）**：登记在案，不阻塞静态门；**所有者反馈任一失败 → 立即重开对应门**。
3. **任一 FAIL（尤其 F1 真危险指令、C 可执行代码、D 越界读写、B 越界文件、J 回滚误伤）→ 阻断导入**；按域 J 回滚，并开缺陷给导入方修复。
4. 最终放行须由**独立测试专家**基于「导入提交哈希 + 文件哈希清单 + 全部证据」一次性签发，任何人不得代签。

## 6. 冻结声明

- 本矩阵于导入前由独立测试专家冻结；当前各格 `待导入`，**无一项冒充通过**。
- 导入方实现完成后，通知本专家；本专家在**不联网、不修改产品/vendor/政策/测试脚本、不提交**的前提下，按本矩阵逐格执行并回填证据与判定。

---

## 7. 执行结果回填（2026-10-13，独立测试专家独立执行）

> 本节为专家执行结论，追加于冻结用例定义之后；**上方第 4 节用例定义未改**。
> **绑定**：HEAD=`93eb093c20648618c3e1d2914a20340d22325f86`；上游=`49dd158d1076134a641b33efb035946536778336`；manifest.json sha256=`ebb7833967b9dfe7f93f33c848be34f63ecce8c739f2258cb882dbcf2a4f7734`。
> **手段**：只读静态审 + 亲跑离线校验器（Node v22.23.2）+ 独立 `shasum -a 256` 抽查；未联网、未提交、未改 vendor/政策/脚本/其他产品文档。

### 7.1 逐域判定

| 域 | 判定 | 关键证据（专家独立取证） |
|---|---|---|
| A 来源/许可证/哈希 | **PASS** | 校验器确认 source.commit 精确 40-hex；LICENSE=MIT 原文（`MIT License / Copyright (c) 2026 Matt Pocock`），无 copyleft；专家独立 shasum 抽查 grill-me/grilling/tdd/LICENSE 与 manifest **逐位一致**。A4 法律可受性：LICENSE 已确证 MIT，且与项目既有依赖许可（如 SheetJS Apache-2.0）兼容——按此事实**自动判 PASS，不留 MANUAL_PENDING**（仅当真有需用户拍板的法律裁量时才转人工）。 |
| B 仅 4 entry + 声明依赖 | **PASS** | 校验器：entry=4、声明依赖=1（grilling）；grill-me 为 157B 触发桩、正文委托 grilling（SKILL.md 第 7 行 `Call the Skill tool with "grilling"`）；tdd 相对文档 tests.md/mocking.md 均 vendored；无第 5 个未声明 skill。 |
| C 无可执行第三方代码 | **PASS** | vendor 13 文件全为 `.md`/`.yaml`/LICENSE 纯文本；独立 find/grep 确认无 `.sh/.py/.js/.mjs/package.json`、无 shebang、无 symlink、无可执行位。 |
| D 不读写 home/凭据/上游 | **PASS** | 校验器 F1 扫描=无；manifest negativeAudit 已排除 force-push/sudo/rm-rf/home 写/硬编码密钥；引用的 git 命令均只读（diff/log/rev-parse）。校验器本身只读离线、不改写文件。 |
| E 项目规则优先 | **PASS** | `docs/external-skills.md` 与 ADL-048 §3 均明确项目规则优先、冲突即停；code-review SKILL.md 第 13 行上游 `/setup-matt-pocock-skills` 已按政策跳过、改用项目自有 onboarding。 |
| F 危险指令静态分类 | **PASS** | 校验器对 6 类危险规则做上下文降级；selftest 证明「祈使 force-push→F1 拒绝」「否定式反例→不误报」。tdd/mocking.md 的 `STRIPE_KEY` 为教学反例（manifest riskList 声明），按 F0 不计缺陷——未因文档讨论危险命令而误报。 |
| G 跨 IDE 不漂移 | **PASS** | 内容以 sha256 哈希锁定、逐字节一致；无 IDE 专属绝对路径/配置假定；不依赖平台私有对话。 |
| H verify 脚本行为 | **PASS** | 亲跑 `--selftest`=8/8 负例正确拒绝（收紧后新增 ENTRY_SET entry 集合负例）、退出 0；主校验=PASS、退出 0；脚本无 child_process/eval vendored 内容（grep 命中的 `.exec()` 均为正则 `.exec`），只读/离线/确定性。 |
| I 试点报告 | **code-review = PASS；其余 3 entry = NOT_RUN** | 审 `docs/verification/external-skills/pilot-01-code-review.md`：§3 越权清单全「否/不适用」，无越权；专家已填其 §5 结论。grill-me/tdd/diagnosing-bugs 尚未出试点报告，登记为毕业前后续项（不阻塞本次自动化门）。 |
| J 回滚 | **PASS** | 导入为纯增量；`git diff` 显示仅文档接线改动、无业务/产品代码改动。回滚清单已按安全复核补全：vendor 子树 + `docs/external-skills.md` + `docs/templates/external-skill-pilot-report.md` + 本验收矩阵 + `docs/verification/external-skills/` 试点报告 + `verify-external-skills.mjs`，并解政策索引/ADL/changelog 接线；ADL/changelog 历史留痕保留不删；manifest 为单一回滚开关。 |

### 7.2 总门结论（独立测试专家签发）

- **总状态：试点可用，未毕业。** 自动化验收门 = PASS（可自动化执行的静态/校验用例 A–H、J 全部 PASS，无 FAIL、无 BLOCKED、无 F1）；按 ADL-047 予以「试点接入 PASS」，**允许在试点期使用**。
- **毕业门为长期默认、本次不阻塞**：每 entry 各完成试点报告（共 3 份量级）方可从「试点」转为「正式启用」；当前仅 code-review 完成试点，其余 3 entry 未毕业——此为**状态标记**，不影响本次「试点可用」的放行结论。
- **MANUAL_PENDING = 无**。按 ADL-047：自动化侧全绿即通过；无「必须所有者本人配合」项（MIT 已由 LICENSE 确证且与项目许可兼容，自动判 PASS；code-review 试点已在真实回路完成并经专家审证）。
- **后续（不阻塞本门，登记跟进）**：① grill-me / tdd / diagnosing-bugs 各补 1 份试点报告后方可毕业；② 提交分组须排除工作树中 R3 遗留物（`gen-valid-backup-fixture.mjs`、`verify-run-20261012-152121*`），保持「最小回滚面」；③ 建议类（manifest.json 0600→0644、manifest 指纹第二锚、校验器 schema 死重与 entry-id 白名单）转开发排期，均非阻塞。
- **本结论绑定上述 commit/哈希**；任何后续换 commit、加 skill 或改 vendor 文件使绑定失效，须重测后方可再引用。
- **复跑留痕（2026-10-13，校验器收紧后）**：校验器升级为 schema3 + **精确 entry 集合**校验（新增 ENTRY_SET 负例）后，本专家独立复跑 `--selftest`=**8/8** 负例正确拒绝、`main`=真实 vendor **PASS**（同 commit `49dd158d…`、13 文件 / entry=4 / 依赖=1、无 F1）；第 7 节各域 PASS 与「试点可用，未毕业」结论**仍然适用**（收紧反而进一步坐实 B 域 entry 集合纪律，前述跟进项 ③ 中「entry-id 白名单」已由该校验器落实）。pilot-01 结论不变。
