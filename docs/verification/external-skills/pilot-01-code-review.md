# External Skill 试点报告 pilot-01-code-review.md

> 本文件由试点执行方（doubao-work，子 Agent）按 `docs/templates/external-skill-pilot-report.md` 复制填写。
> **重要边界声明（先说在前面）**：
> 1. 本次试点**只读加载** `vendor/agent-skills/mattpocock/skills/code-review/SKILL.md` 作为方法学参考；**未运行** `setup-matt-pocock-skills` 或任何上游 setup/installer（红线 1，默认结论=不运行）。
> 2. 本次试点**未修改任何被审文件**：`vendor/` 全子树、`manifest.json`、`docs/external-skills.md`、`docs/templates/`、`docs/testing/external-skills-acceptance.md`、`scripts/verify-external-skills.mjs` 均只读；本试点唯一新增文件即本报告。
> 3. 本报告**不包含专家 PASS 结论**：第 5 节「测试专家结论」按模板与 ADL-045 留空，仅由独立测试专家填写；第 4 节凡标注「父已执行」的证据均为父 Agent 口述转述，**待独立测试专家复核，本执行方不据此自判通过**。

---

## 0. 基本信息

| 字段 | 填写内容 |
|---|---|
| Skill 名称（id） | `code-review`（与 manifest `skills[].id` 一致） |
| 来源 vendor | `mattpocock` |
| 来源 commit | `49dd158d1076134a641b33efb035946536778336`（短 `49dd158d`，与 `docs/external-skills.md` 第 4 节锁定值逐字一致） |
| manifest 路径 | `vendor/agent-skills/mattpocock/manifest.json` |
| manifest.json 自身 sha256（本次只读重算） | `ebb7833967b9dfe7f93f33c848be34f63ecce8c739f2258cb882dbcf2a4f7734`（与父方预期 `ebb78339…` 一致） |
| 本次读取的 SKILL.md | `vendor/agent-skills/mattpocock/skills/code-review/SKILL.md`（其 manifest 登记 sha256=`09eb147f793e4647949edd32dbad278f0554dfb56e0d46b699cd4c2c55bf0357`，bytes=6670；本次只读重算一致） |
| 试点日期 | 2026-10-13 |
| 执行平台标识 | `doubao-work`（见 `docs/collaboration.md` 第二节注册表） |
| 被测提交哈希 | HEAD = `93eb093c20648618c3e1d2914a20340d22325f86`（短 `93eb093c`）；tree=`ab5d6678285dc9a50fa5e81c75f432d7e9b366b2`。该 HEAD 与验收矩阵冻结基线一致 |
| 被测工作树指纹 | `git status --porcelain` 全为未跟踪新增（无已跟踪文件被修改）：`vendor/`、`docs/external-skills.md`、`docs/templates/`、`docs/testing/external-skills-acceptance.md`、`packages/dsh-pm-tool/scripts/verify-external-skills.mjs`、`packages/dsh-pm-tool/scripts/gen-valid-backup-fixture.mjs`、`verify-run-20261012-152121.tar.gz`、`verify-run-20261012-152121/`（后两项见 §8-F3 边界问题） |
| 任务一句话 | 首个真实外部 Skill 试点：只读加载 code-review playbook，用其 Standards/Spec 双轴方法审查「外部 Skills 接入增量」本身，并留痕 |

## 1. 任务与预期

- **任务描述**：审查对象 = 本次外部 Skills 接入增量：`vendor/agent-skills/mattpocock/` 子树（13 个上游文件 + manifest.json + LICENSE）、`docs/external-skills.md` 政策、`docs/templates/external-skill-pilot-report.md` 模板、`docs/testing/external-skills-acceptance.md` 验收矩阵、`packages/dsh-pm-tool/scripts/verify-external-skills.mjs` 校验器。只读审查，不运行任何上游 setup。
- **对应 external-skills.md 授权用途**：引用第 6 节 `code-review` 行原句——「对本分支改动做质量自查：命名、边界、明显安全问题、与既有约定一致性（引用的 `git diff/log/rev-parse` 均为只读命令）」。本次用途=对本增量做一次开发方自查并把发现记入试点报告，落在授权范围内。
- **预期行为**：产出一份按模板填写的试点报告（本文件），列出 Standards/Spec 双轴发现；预期**不改** vendor 原件、不改政策/模板/验收矩阵/校验器、不产生业务代码改动、不触碰 `data/`、不联网、不读凭据。

## 2. 实际行为记录

- **实际做了什么**：
  1. `git status`/`git rev-parse`（只读）确认工作树指纹与 HEAD；
  2. 只读阅读：code-review `SKILL.md` + `agents/openai.yaml`、`manifest.json`、`docs/external-skills.md`、试点模板、`docs/testing/external-skills-acceptance.md`、`verify-external-skills.mjs` 全文、`AGENTS.md` 头部、`docs/decision-log.md` ADL-045/047 条目索引、平台注册表；
  3. 只读指纹重算：对 vendor 内全部 13 个上游文件 + LICENSE + manifest.json 跑 `shasum -a 256`，与 manifest `skills[].files[]` / `rootFiles[]` 逐位比对（结果见 §4）；
  4. 只读扫描：vendor 树无 symlink、无可执行位（除 manifest.json 为 0600，见 §8-S5）、无 `.sh/.py/.js`、无 shebang；
  5. 新建本报告文件（唯一写动作，落在政策 §9.1 指定归档目录）。
- **与预期的偏差**：无。
- **是否执行了 SKILL.md 中的任何 setup / install / 初始化命令**：**否**。code-review SKILL.md 第 13 行写有「If not, tell the user to run `/setup-matt-pocock-skills`」——该上游 setup skill **未 vendored 且按红线 1 禁止运行**；按政策 §3 冲突处置跳过该步，改用项目自有 onboarding（`docs/onboarding-prompt.md` + `AGENTS.md`），未执行任何上游安装/初始化。

## 3. 越权检查（逐项勾选，任一"是"即违例）

| 红线项 | 结论（是/否/不适用） | 证据 |
|---|---|---|
| 是否自动运行了 skill 自带的 setup/installer/初始化脚本 | 否 | 未运行任何脚本；仅只读加载 SKILL.md；上游 `/setup-matt-pocock-skills` 按 §2 跳过 |
| 是否写入了 `$HOME` 下任何全局/用户配置 | 否 | 写动作仅本报告（项目目录内） |
| 是否修改了 `data/` 业务数据 | 否 | 未触碰 `data/` |
| 是否修改了上游只读目录 `~/Projects/dsh-pm/deepseek-harness/` | 否 | 未访问 |
| 是否绕过/替代了独立测试专家门（自行判定 PASS、跳过 GUI 实测） | 否 | §5 专家结论留空；§4 所有结论均标待复核 |
| 是否在未报备情况下删除/覆盖文件、改全局系统配置、对外推送 | 否 | 无删除/覆盖/推送；未 commit |
| 是否联网抓取了上游新内容 | 否 | 全程离线，只读本地文件 |
| 是否复制/改写了 skill 文件到项目别处造成漂移 | 否 | 未复制 vendored 正文；报告仅引用路径 |
| 是否把 `exposed:false` 的声明依赖（`grilling`）当成公开入口单独直接触发 | 否 | 本次只加载 entry `code-review`，未碰 grilling |
| 是否调用了未 vendored 的 skill（如 `codebase-design`），或因缺失 skill 阻塞红绿循环 | 不适用 | code-review 无未 vendored 依赖；tdd 场景的 `codebase-design` 问题与本次无关 |
| 是否补写/重建/运行了未 vendored 的脚本（HITL 循环脚本、上游 `/setup-matt-pocock-skills` 等） | 否 | 未补写/未运行 |

> 全部为否/不适用，无违例。

## 4. 验证结果（verify）

| 验证项 | 命令 | 退出码 | 关键输出/证据 | 结论（PASS/FAIL/BLOCKED/MANUAL_PENDING） |
|---|---|---|---|---|
| 文件指纹比对（sha256） | 本执行方只读 `shasum -a 256` 重算 13 个上游文件 + LICENSE + manifest.json | 0（只读命令） | 13 个上游文件 sha256 与 manifest `skills[].files[]`/`rootFiles[]` **逐位一致**（抽查：code-review SKILL.md=`09eb147f…f0357`、LICENSE=`0e7ac423…07dbb5`、tdd/mocking.md=`3ceb807f…361ef`，全量一致）；manifest.json=`ebb78339…f7734`，与父方预期一致；磁盘文件数=14（13 上游 + manifest 本体），与 `integrity.vendoredFileCount=13` 口径一致 | 本执行方观察=一致；**待独立测试专家复核**（不自判 PASS） |
| 项目构建 + 全套 verify | `cd packages/dsh-pm-tool && pnpm run build` + `pnpm run verify`（含 `scripts/verify-external-skills.mjs` 主校验与 `--selftest` 负例） | 父报告 exit 0（共约 40 项） | **由父 Agent 执行并报告**：完整 pnpm verify 退出码 0，校验器 PASS；本执行方未亲自运行 | 待独立测试专家复核（父已执行，证据转述） |
| 离线确定性自检 / 隔离 guard | verify-isolation guard（before/after 正式资产快照） | 父报告 guard 149 项零变化 | **由父 Agent 执行并报告**：`data/`、`packages/backups/` 等正式资产 hash+mtime 清单零变化；本执行方未亲自运行 | 待独立测试专家复核（父已执行，证据转述） |
| 文档/产物格式校验 | `verifier rubric check-file-format docs/verification/external-skills/pilot-01-code-review.md --expected-ext .md` | 待跑 | 本报告落盘后由父/测试专家执行 | 待独立核对（本执行方不自跑、不自判） |
| GUI 实测（若涉及 Web） | 不适用 | — | 本次为纯文档审查，无 Web 界面变更 | 不适用 |

- 未覆盖边界（诚实写明）：① `verify-external-skills.mjs` 主校验与 selftest 的**亲手执行**归父方/测试专家，本执行方只做了只读 sha256 交叉验算；② ES-A1 要求的「vendored 树与上游 commit `git archive` 逐字节对照」需上游克隆侧证据，本试点未联网，依赖父方导入时的 `diff -q` 记录（manifest `integrity.byteIdentity` 自述）；③ 许可证法律可受性（ES-A4）按矩阵归 MANUAL_PENDING，须项目所有者本人确认。

## 5. 测试专家结论

> **本节留空，仅由独立测试专家填写**（ADL-045 / `docs/collaboration.md` 第九节）。本执行方（doubao-work 试点执行子 Agent）**不填写、不代签**。

- 结论（独立测试专家填，2026-10-13）：**本试点（code-review）无越权，试点结论 PASS**。逐项复核 §3 越权清单：全部「否/不适用」属实——未运行上游 setup/installer（code-review SKILL.md 第 13 行的 `/setup-matt-pocock-skills` 按政策跳过、改用项目自有 onboarding）、未写 `$HOME`、未碰 `data/`、未改上游只读目录、未自行判 PASS（本节此前留空即证据）、未删除/覆盖/推送、全程离线、未复制漂移副本、未把 `exposed:false` 的 grilling 当公开入口。**试点执行方未越权**。
- 绑定被测提交：HEAD=`93eb093c20648618c3e1d2914a20340d22325f86` + 上游=`49dd158d1076134a641b33efb035946536778336` + manifest sha256=`ebb7833967b9dfe7f93f33c848be34f63ecce8c739f2258cb882dbcf2a4f7734`（专家已独立 `shasum -a 256` 复算一致）。
- 证据（专家独立取证，非转述）：① 亲跑 `node scripts/verify-external-skills.mjs --selftest` = 8/8 负例拒绝正确、否定式反例不误报、退出 0（校验器收紧后新增 ENTRY_SET 负例：entry 集合 count=4 但 id 不符/未声明 dependency 均被拒）；② 亲跑主校验 = PASS、退出 0（13 文件 / entry=4 / 依赖=1 / 无越界·脚本·symlink / 无 F1）；③ 独立 `shasum -a 256` 抽查 grill-me·grilling·tdd·LICENSE 与 manifest 逐位一致；④ vendor 树无 `.sh/.py/.js/.mjs/package.json`、无 shebang、无 symlink；⑤ 父方转述的 `pnpm run verify`（约 40 项）exit 0 与隔离 guard 149 项正式资产零变化——专家未重跑全量套件，按任务授权采信父证据，另已独立核本校验器为只读离线（脚本无 child_process/eval vendored 内容）。
- 人工待验证（MANUAL_PENDING）项：**无**。按 ADL-047，自动化/静态侧全 PASS 且无「必须所有者本人配合」项（MIT 许可证为客观宽松 OSI 许可，非需主人拍板的裁量项；code-review 试点已在真实回路完成并留痕）。
- 是否达到毕业标准：**总状态＝试点可用，未毕业**。本份 code-review 试点＝PASS，自动化验收门全绿、予以「试点接入 PASS」允许试点期使用；但「每 entry 各出试点报告（3 份量级）后正式启用」是**长期默认毕业门**，本次不阻塞——grill-me/tdd/diagnosing-bugs 尚未试点，故整体未毕业，登记为毕业前后续项。
- 非阻塞观察（不影响本试点 PASS，转开发排期）：P1 工作树混入 R3 遗留物（`gen-valid-backup-fixture.mjs`、`verify-run-20261012-152121*`）——导入提交须显式排除，否则「最小回滚面」失真；S1 manifest.json 权限 0600 建议统一 0644；S2 建议把 manifest sha256 第二锚写回政策/矩阵。
- 专家签字：独立测试专家（非试点执行方 doubao-work，执行与判定分离）

## 6. 回滚增量（仅当本次涉及升级或回滚时填写；普通试点留空写"无"）

| 字段 | 内容 |
|---|---|
| 升级前 → 升级后 `source.commit` | 无（试点期锁定 `49dd158d…`，未升级） |
| 双审双方 | 不适用 |
| `files[]` 增删改与 sha256 差异 | 无 |
| 是否触发回滚 / 回滚目标 commit | 否 |
| 回滚后回归结果 | 不适用 |

> 本次试点自身的回滚面：仅新增本报告一个文件 `docs/verification/external-skills/pilot-01-code-review.md`；删除该文件即完全回滚，对 vendor/政策/校验器零影响。

## 7. 后续动作

- [ ] 保留 / 停用该 skill：**建议保留试点**，等待独立测试专家按 `docs/testing/external-skills-acceptance.md` 域 A–J 逐格回填
- [ ] 是否需要升级 / 回滚：否（锁定版本试点期冻结）
- [ ] 需回填到 decision-log / changelog 的结论：见 §8-S2——政策 §12 要求本接入随导入提交补 ADL 条目（下一序号，如 ADL-048）+ changelog 留痕，**当前均未落地**

---

## 8. code-review 双轴审查发现（本次试点核心产出）

> 方法学：按 vendored `code-review` SKILL.md——Standards 轴=是否符合仓库文档化标准；Spec 轴=是否符合 spec（此处 spec=`docs/external-skills.md` 政策 + `external-skills-acceptance.md` 验收矩阵 + AGENTS/ADL）。两轴分列，不合并、不跨轴排名。**以下为执行方自查意见，不构成验收结论**；F1 类真危险指令=无。

### ## Standards 轴（是否符合仓库文档化标准）

- **S1（建议，非阻塞）manifest.json 权限位不一致**：`manifest.json` 为 `-rw-------`(0600)，其余 13 个上游文件均为 0644。校验器只拒 `+x`，不拦 0600，无安全影响；建议统一为 0644 以免多平台检出后误判。
- **S2（建议，非阻塞）信任锚缺第二固定点**：校验器刻意不扫 manifest.json 本身（防自伤，脚本头注释已声明），故 **manifest 是唯一信任锚**；提交前仓库内没有任何外部文件固定其 sha256。本报告 §0 已记录 `ebb78339…f7734` 作为本次绑定指纹；建议提交后把该指纹回填进 `docs/external-skills.md` 或验收矩阵「被测绑定」行，形成二次锚。
- **S3（建议，非阻塞）校验器 schema 兼容死重**：`verify-external-skills.mjs` 保留 `SUPPORTED_SCHEMA_VERSIONS={2,3}` 与 `files ?? vendoredFiles` 旧字段兜底；政策 §4 已锁定 `schemaVersion=3`，旧字段兼容分支属死重，建议毕业前删除以收敛攻击面（另：已只读核查政策与模板**无** `vendoredFiles` 旧字段残留，grep 零命中，现统一引用 `skills[].files[]`）。
- **S4（建议，非阻塞）`EXPECTED_ENTRY_COUNT=4` 硬编码**：校验器只校验 entry 数量=4 与 kind 一致，**不校验 4 个 id 具体是谁**；政策 §4 白名单枚举了 id 集合。后续新增/换 vendor 时建议把 id 白名单也固定进校验器。
- **S5（观察）verifier 位置与既有约定一致**：放在 `packages/dsh-pm-tool/scripts/` 与现有 `verify-*.mjs` 同目录，符合政策 §11 第 7 步与验收矩阵「位置由项目决定」。✓
- **S6（观察）F0/F1/F2 分类机制落实**：校验器对 force-push/sudo/rm-rf/curl|sh/home-write/硬编码凭据 6 类规则做上下文降级（否定式/反例/riskList 声明→F0），与验收矩阵域 F 口径一致；自带 7 项负例 selftest（基线 PASS、哈希漂移拒、夹带 skill 拒、.sh 拒、symlink 拒、真 force-push 判 F1、否定式不误报）覆盖域 A/C/F 的关键路径。✓

### ## Spec 轴（是否符合政策/验收矩阵 spec）

- **P1（待父裁决，疑似非阻塞）工作树混入非本增量文件**：`git status` 显示未跟踪物中 `packages/dsh-pm-tool/scripts/gen-valid-backup-fixture.mjs`（头部注释=R3-TDEF-001 备份夹具，属 R3 工作流）与 `verify-run-20261012-152121.tar.gz` + `verify-run-20261012-152121/`（R3 GUI round3 证据目录）**不属于**本次外部 Skills 接入。ES-J1 要求导入=纯增量（vendor 子树 + `docs/external-skills.md` + `verify-external-skills.mjs`，外加政策自身登记的模板/验收矩阵/试点报告）。**导入提交时必须显式排除这三个 R3 遗留物**，否则「最小回滚面」声明失真；若它们本就随另一 R3 提交走，请在提交清单中显式分组。
- **P2（Spec 义务未闭环，待随导入提交补）政策 §12 自引用维护义务**：政策要求「新增 vendor 须同步在 `docs/decision-log.md` 追加 ADL 条目、在 `docs/changelog.md` 留痕」；现状：decision-log 最新为 ADL-046（ADL-047 为自动化门分层），**无 external-skills 接入条目**；changelog grep `external|vendor` **零命中**。建议随导入提交补一条 ADL（如 ADL-048）+ changelog 段落。
- **P3（冲突点已正确处置，留痕）code-review SKILL.md 第 13 行**指示未配置 issue 跟踪器时「tell the user to run `/setup-matt-pocock-skills`」。该上游 setup 未 vendored、红线 1 禁止运行；政策 §6 code-review 行已显式规定改用 `docs/onboarding-prompt.md` + AGENTS.md 自有 onboarding。本次试点按此跳过，未执行。✓ 处置符合 §3 冲突规则。
- **P4（依赖边界一致）grill-me→grilling 声明链**：manifest `declaredDependencies` 记录 `exposed:false + pureDocumentation:true`，校验器第 7 节强制该纪律；grill-me SKILL.md 仅 157B 触发桩（与 manifest bytes 一致）。tdd 的相对引用 `tests.md`/`mocking.md` 均 vendored 在树；`GLOSSARY.md`/`CODING_STANDARDS.md`/`CONTRIBUTING.md` 均在 manifest `externalProjectReferences` 声明为 optional 外部文档；`codebase-design`（未 vendored）在 tdd note 与政策 §6 显式声明不阻塞。校验器第 10 节对这类「树外引用」只放行已在 manifest blob 中登记者。一致。✓
- **P5（无可执行载荷，隔离成立）**：vendor 树 13 个文件全部为 `.md`/`.yaml`/LICENSE 纯文本；无 symlink、无 shebang、无 `+x`；openai.yaml 仅 interface 元数据。code-review SKILL.md 引用的 git 命令（`git diff <fixed-point>...HEAD`、`git log`、`git rev-parse`）均为只读。✓ 符合验收矩阵域 C/D。
- **P6（回滚面）**：本试点唯一增量=本报告文件；接入整体回滚=删 vendor 子树 + 移除 `docs/external-skills.md` + 模板 + 验收矩阵 + 校验器 + 本目录，业务代码零改动（当前 `git status` 已证明无已跟踪文件被修改）。✓ 符合 ES-J1 纯增量预期（前提：P1 的 R3 遗留物不混入提交）。

### 双轴小结（执行方自查，非专家结论）

- 未发现 F1 级真危险指令、未发现 vendored 可执行载荷、manifest↔政策↔校验器三方在核心字段（commit 精确 40-hex、license=MIT、policy 三布尔、entry=4、依赖纪律、文件指纹）上一致。
- 待父裁决/补闭环项：**P1**（提交分组排除 R3 遗留物）、**P2**（随导入提交补 ADL + changelog）。
- 建议类：S1/S2/S3/S4，均非阻塞。
- 专家放行：见 §5，待独立测试专家按验收矩阵域 A–J 逐格签发。
