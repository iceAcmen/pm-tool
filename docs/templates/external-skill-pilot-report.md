# External Skill 试点报告（模板）external-skill-pilot-report.md

> **本文件是什么 / 给谁 / 怎么用**：本文件是**每一次试用 vendor Agent Skill 时必须填写的记录模板**，用于把"用了哪个外部 skill、基于哪个来源版本、做了什么任务、预期 vs 实际行为、有没有越权、验证结果如何、测试专家结论"一次性归档。它是 `docs/external-skills.md` 的配套证据文件，是试点期毕业评审与升级/回滚决策的依据。
> **用法**：每次试点复制本文件，另存为 `docs/verification/external-skills/<skill-id>-<YYYYMMDD>-<平台标识>.md`，逐项填写，不留空；无法判断的项写 `【待确认】` 并注明原因，**不要编造**。结论绑定来源 commit 与验证证据，禁止只写"通过"。

---

## 0. 基本信息

| 字段 | 填写内容 |
|---|---|
| Skill 名称（id） | 例如 `tdd`（须与 `vendor/agent-skills/mattpocock/manifest.json` 的 `skills[].id` 完全一致） |
| 来源 vendor | `mattpocock` |
| 来源 commit | 以 manifest 的 `source.commit` 为准，逐字抄写（短 hash 即可，但需可回溯到完整值） |
| manifest 路径 | `vendor/agent-skills/mattpocock/manifest.json` |
| 本次读取的 SKILL.md | `vendor/agent-skills/mattpocock/skills/<id>/SKILL.md` |
| 试点日期 | YYYY-MM-DD |
| 执行平台标识 | 见 `docs/collaboration.md` 第二节注册表（如 `doubao-work` / `trae` / `human`） |
| 被测提交哈希 | 本次任务期间仓库 HEAD 的短 hash（`git rev-parse --short HEAD`） |
| 任务一句话 | 本次用该 skill 想完成什么 |
| 触发方式 / taskKind | **自动路由**（Agent 按 `docs/external-skills.md` 6.1 自主判定，非用户指定）。结构化填写：`taskKind=`（`requirement`/`feature`/`rootCause`/`delivery`/`trivial`）；命中路由规则；预计质量增益理由；`rootCause` 是否仅 diagnosing 未叠 review、`trivial` 是否正确抑制 grill/tdd |
| vendor 安全门结果 | `vendorIntegrityVerified=`（`true`=manifest `files[]` sha256 校验通过 / `false`=不符即停用）；安全门是否过（第 5 节 8 条）；有无阻塞条件（指纹不符 / 越界 / 测试门 FAIL·BLOCKED）拦截 |

## 1. 任务与预期

- **任务描述**：（要解决的问题、涉及的文件范围）
- **对应 external-skills.md 授权用途**：（引用 `docs/external-skills.md` 第 6 节该 skill 的"项目授权用途"原句，说明本次用途落在授权范围内）
- **预期行为**：（按 SKILL.md 应产生什么输出/改动；预期不改哪些东西）

## 2. 实际行为记录

- **实际做了什么**：（执行的步骤、读写了哪些路径、产生了哪些文件/改动）
- **与预期的偏差**：（无则写"无"；有则说明偏差点与原因）
- **是否执行了 SKILL.md 中的任何 setup / install / 初始化命令**：（是 / 否。若"是"，必须说明为何属于授权例外——默认应为"否"，见 external-skills.md 第 5 节红线）

## 3. 越权检查（逐项勾选，任一"是"即违例）

| 红线项 | 结论（是/否/不适用） | 证据 |
|---|---|---|
| 是否自动运行了 skill 自带的 setup/installer/初始化脚本 | | |
| 是否写入了 `$HOME` 下任何全局/用户配置（如 `~/.config`、`~/.npmrc`、shell rc、全局工具配置） | | |
| 是否修改了 `data/` 业务数据（应为只读） | | |
| 是否修改了上游只读目录 `~/Projects/dsh-pm/deepseek-harness/` | | |
| 是否绕过/替代了独立测试专家门（自行判定 PASS、跳过 GUI 实测） | | |
| 是否在未报备情况下删除/覆盖文件、改全局系统配置、对外推送 | | |
| 是否联网抓取了上游新内容（试点期应仅用已 vendored 锁定版本） | | |
| 是否复制/改写了 skill 文件到项目别处造成漂移（应只读 vendored 原件） | | |
| 是否把 `exposed:false` 的声明依赖（如 `grilling`）当成公开入口单独直接触发 | | |
| 是否调用了未 vendored 的 skill（如 `codebase-design`），或因缺失 skill 阻塞红绿循环 | | |
| 是否补写/重建/运行了未 vendored 的脚本（HITL 循环脚本、上游 `/setup-matt-pocock-skills` 等） | | |

> 任一项为"是"：立即停止，按 `docs/external-skills.md` 第 12 节违例处置，并在下方"专家结论"中记录。

## 4. 验证结果（verify）

| 验证项 | 命令 | 退出码 | 关键输出/证据 | 结论（PASS/FAIL/BLOCKED/MANUAL_PENDING） |
|---|---|---|---|---|
| 文件指纹比对（sha256） | `shasum -a 256` 逐项比对（按 manifest `skills[].files[]`，基于 `vendoredPath`） | | | |
| 项目构建 | `cd packages/dsh-pm-tool && pnpm run build` | | | |
| 离线确定性自检 | `node scripts/verify-command.mjs` 等受影响项 | | | |
| 受影响范围回归 | 受影响的 `scripts/verify-*.mjs` 清单 | | | |
| 文档/产物格式校验 | `verifier rubric check-file-format ...` | | | |
| GUI 实测（若涉及 Web） | 录屏/截图说明 | | | |

- 未覆盖边界：（哪些项受能力所限未能验证，诚实写明，不得伪装通过）

## 5. 测试专家结论

> 本节**只能由测试专家角色填写**（见 `docs/collaboration.md` 第九节），执行/开发方不得自判。

- **结论**：`PASS` / `FAIL` / `BLOCKED` / `MANUAL_PENDING`（四选一）
- **绑定被测提交**：（与第 0 节被测提交哈希一致）
- **证据**：（用例号 / 截图 / 日志 / 命令输出位置）
- **人工待验证（MANUAL_PENDING）项**：（因系统能力/认证须项目所有者本人配合才能验的项，逐条列出；用户反馈失败即重开）
- **是否达到毕业标准**：（是 / 否；对照 `docs/external-skills.md` 第 9 节）
- **专家签字（平台标识 + 日期）**：

## 6. 回滚增量（仅当本次涉及升级或回滚时填写；普通试点留空写"无"）

| 字段 | 内容 |
|---|---|
| 升级前 → 升级后 `source.commit` | 例 `49dd158d… → <新 commit 短 hash>`（对应 external-skills.md 第 8.2 节双审） |
| 双审双方 | 导入/技术审（平台标识+日期）：____；安全/越权审（平台标识+日期）：____ |
| `files[]` 增删改与 sha256 差异 | 逐文件列出 `vendoredPath` 下 path / 新旧 sha256 |
| 是否触发回滚 / 回滚目标 commit | 未触发写"否"；触发则写明指回的上一已验证 `source.commit` |
| 回滚后回归结果 | 受影响 `scripts/verify-*.mjs` 退出码 + `verifier rubric check-file-format` 结论 |

## 7. 后续动作

- [ ] 保留 / 停用该 skill：
- [ ] 是否需要升级 / 回滚：（关联 external-skills.md 第 8 节双审流程；增量填第 6 节）
- [ ] 需回填到 decision-log / changelog 的结论：
