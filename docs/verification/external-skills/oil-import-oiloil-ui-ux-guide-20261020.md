# OilOil UI/UX Guide 项目级隔离导入记录 oil-import-oiloil-ui-ux-guide-20261020.md

> 本文件由导入方（`doubao-work`，非 GUI、非业务代码）按 `docs/external-skills.md` §4/§8.2 制作，只登记来源锁定、落盘指纹与红线自审。
> **边界声明**：本记录是导入方自查，**不是独立安全/越权双审结论**；双审须由与导入方不同的独立测试/安全 owner 完成（§6）。本批**未运行**任何上游 installer/setup、未写 home/全局、未改 core/client/旧 vendor/data/配置、未 commit/push、未加 DSH remote/fork。root 级 `decision-log`(ADL) / `changelog` 由父级最后统一同步，本文件不代写。

## 0. 基本信息

| 字段 | 值 |
|---|---|
| Skill id | `oiloil-ui-ux-guide`（frontmatter `name` === id === 目录名） |
| vendor 目录 | `vendor/agent-skills/oil-oil/`（项目级隔离，与旧 vendor 并列，未覆写） |
| manifest | `vendor/agent-skills/oil-oil/manifest.json`（schemaVersion=3） |
| 上游仓库 | https://github.com/oil-oil/ui-ux-guide（默认分支 main，commit 锁定，不浮动） |
| 锁定 commit | `f32bc2bd210a6693f86841816a531ab511b258b4`（2026-09-10T12:48:14Z，明确 Skill 功能、首次使用与执行边界 (#1)，作者 Zhihuang Lin） |
| 许可证 | Apache-2.0，`LICENSE.txt`（上游根目录，11358B，逐字复制） |
| 抓取时间 | 2026-10-19T18:42:02Z / 2026-10-20 02:42:02 CST (+0800) |
| 抓取方式 | Public read-only codeload tarball of the locked commit (https://codeload.github.com/oil-oil/ui-ux-guide/tar.gz/f32bc2bd210a6693f86841816a531ab511b258b4) extracted to .tmp; only the allowed subtree and LICENSE.txt copied into vendor. No git remote added, no fork, no write/push to upstream, no npx/skills CLI, no home clone. |
| 导入平台 | `doubao-work` |
| 落盘文件数 | 23（1 LICENSE.txt + 22 skill 文件；manifest.json 不计入上游文件） |
| 独立安全双审 | **pending（非导入方）** |

## 1. 任务与授权

- 用户已明确授权 Oil 试点：仅做项目级隔离的只读文档导入（non-GUI、非业务代码），官方独立 QA 已确认来源与 commit。
- 允许范围**仅**上游子树 `skills/oiloil-ui-ux-guide/`（SKILL.md + evals/evals.json + references/）与根 `LICENSE.txt`；上游根 AGENTS.md/CLAUDE.md/README.md/index.html/agents/.cursor 属桥接/介绍页，**不纳入**。
- 不执行上游 `npx skills add`、不 `-g`、不 clone 到 home、不跑 setup/installer；不安装 Ego；不联网对齐上游（试点期冻结 commit）。

## 2. 来源锁定与镜像排除

- 官方唯一来源：`https://github.com/oil-oil/ui-ux-guide` @ `f32bc2bd210a6693f86841816a531ab511b258b4`；旧名 `oil-oil/oiloil-ui-ux-guide` 现重定向到此，以现名为准。
- 明确排除第三方镜像/改名包：`davepoon/buildwithclaude`、`opendcai`、agentskill.sh、agskills.dev、claudskills、lobehub、agent-skills.jp、happycapy —— 不作来源、不采信其版本。
- 抓取为 codeload 只读 tarball（锁定 commit），提取到 gitignored `.tmp/` 后仅复制允许子树；未向上游加 remote、未 fork、未 push。

## 3. 落盘清单与指纹（与 manifest 逐位一致，独立重算零漂移）

| 归属 | vendored 路径 | sha256 | bytes |
|---|---|---|---|
| `rootFiles` | `LICENSE.txt` | `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` | 11358 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/SKILL.md` | `19a5435b9f1cd0c6832f536a8e509a63f2947c1f862d3910b59ecf90d63ad88b` | 14968 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/evals/evals.json` | `404af752e6cd35c2b742e629180e6cbbf6f6be4d3b7caf04f349436c9ef77dd2` | 13583 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/business-mockup-contract.md` | `3cfe00efbb9e21af09c5246daf85665c7e7adc2f5623c761f6e43d0237cb9f4a` | 9082 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/checklists.md` | `7177c0a6445d582ab64f884a73b06f558d9196843e0525cb47b50d966ea38312` | 4638 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/design-interview.md` | `121dbd0ca469e80b8fc6c800435284d6d054db9abd804c64c8901c2f85f8ca5b` | 21559 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/design-preview-template.html` | `e9d4e2605b7d690faf08986cb5b3f0eaec1ebb880b654d80cef406dc86c6f6fb` | 105864 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/design-psych.md` | `62945c76991627ec682072a09369f192b29c3b7d1c034fe8e3e18c42b33023eb` | 3716 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/design-spec-template.md` | `a83a78f6aec7befeaf18e69e453458b2bec50832f0fbbd23bd5c09fb72694bc8` | 6635 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/extended-dimensions.md` | `aa49da32e163dbda2b76f19b06f6f6e0e778b913ae14865772bdc57cd1d9271c` | 10529 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/icons.md` | `825a1c4d5fce67eccb99b6d700ff330fb6a5000c7273e8dda605a2de740a0108` | 1630 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/interaction-psychology.md` | `7f69bb8fc0f4c0d3b9098970c57f6696e68b1b711f53c0f6e80ed308436bc89f` | 7811 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/review-template.md` | `7062e3d594761cce9065e1e9b56a5d51bea46fdac2bf4a3b462a99d7f9108543` | 1855 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/style-families/brand-driven.md` | `fb1a2c5d16697eed32f0cb7f17bd0150b7c58eaa82bb5fdf0f241c520b8d0423` | 3885 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/style-families/brutal.md` | `fc4c119d696c3299e46b6cf37acec6bed9844151871d615ea035755316847949` | 2437 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/style-families/editorial.md` | `48c74ac167faead1d65c3e01315035a46ee4c31aa12ddd615ac7a7eced61cfdb` | 2337 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/style-families/index.md` | `a6e7ef9505533376b17fbbdbf43ede9ae713b1e5f27c4d33a00a966ed63e3aff` | 3136 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/style-families/modern-minimal.md` | `a4b4abe1fc1f0b9b06ce6441df2923e725b35565d0f54b150be18c0c8182350c` | 2556 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/style-families/playful.md` | `d9b8acbda8e79e1bc4fe589edfb3e8193c2131df9dd11bbb0c0a293b1793a937` | 2676 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/style-families/premium-luxury.md` | `c8c7dca0b739cf6dec736e04dad01edadc77861fa7df06b4401d7535558a17e3` | 2739 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/style-families/tech-cyberpunk.md` | `8dc7261a39978779cba2ea79692dae1862fde1fdd398baa71a31148611d3e2e7` | 2958 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/style-families/warm-content.md` | `b4594c87e5547c0d1584482758e9adaee8b290ba8a0bc8930945affe582fb5c2` | 2349 |
| `oiloil-ui-ux-guide` | `skills/oiloil-ui-ux-guide/references/system-principles.md` | `80c84881c5f903da2d82eceb3e4ff9d7d89926278986bcde7188759f1f6f5162` | 5332 |

字节一致性：子树 `diff -rq` 与上游 tarball 为空、`LICENSE.txt` `diff -q` 为空；独立脚本重算 sha256/bytes，declared=23 / disk=23，无 EXTRA/MISSING/HASH/BYTES_MISMATCH。

## 4. 八条红线逐项自审（导入方视角，独立双审复核）

| # | 红线 | 本批 | 证据 |
|---|---|---|---|
| 1 | 不自动运行 setup/installer | 否（未运行） | 子树无 .sh/.js/.ts/.py/package.json/postinstall；未调用 npx/skills CLI |
| 2 | 不写 home/全局配置 | 否 | 仅写入项目 `vendor/agent-skills/oil-oil/`；无 `$HOME`/`~`/IDE/shell rc 写 |
| 3 | 业务数据 `data/` 只读 | 否（未触碰） | 未读写 `data/`、fixture、配置 |
| 4 | 上游 deepseek-harness 只读 | 否（未触碰） | 未访问并列 `~/Projects/dsh-pm/deepseek-harness/` |
| 5 | 不替代独立测试门 | 是（遵守） | Oil `review` 仅作第二意见清单，PASS/FAIL 仍归独立测试门；本记录不自判 PASS |
| 6 | 不可逆动作人工确认 | 是（遵守） | 无删除/覆盖/推送；仅新增隔离目录 |
| 7 | 试点期不联网抓新内容 | 是（遵守） | 仅一次性按锁定 commit 抓取来源用于落盘；使用时离线、不联网对齐 |
| 8 | 只读 vendored 原件 | 是（遵守） | 上游正文逐字复制，未改写、未复制漂移到别处 |

## 5. 内容自审（导入方）

- 相对引用闭环：SKILL.md §References 列出的 12 个内部配套文件（design-interview / extended-dimensions / business-mockup-contract / style-families/index + 8 family / design-preview-template.html / design-spec-template / system-principles / interaction-psychology / design-psych / icons / review-template / checklists）均在 vendored 子树内。
- 非 vendored 且已在 manifest 声明：agent 生成产物 `design-spec.md`、`design-spec-components.md`、会话临时 `business-mockup-N.html`；预览用 agent 生成的 `/tmp/design-config.js`；Phase 0 只读的项目输入文件 `package.json`/`tailwind.config`/`theme.ts`/`globals.css`/`DESIGN.md`/`AGENT.md`。
- `references/design-preview-template.html`：含内联客户端演示 JS，仅在本地 Phase 4a 预览且用户选 webfont 时才拼接 Google Fonts CSS；引用未 vendored 的 `/tmp/design-config.js`；无凭据、无安装、无外泄，落盘过程不执行它。
- `evals/evals.json`：静态上游行为测试数据，本项目不执行。
- 危险指令扫描：无真·force push / sudo / rm -rf / curl|sh / home 写 / 硬编码凭据字面量；无 shebang、无可执行位、无 symlink。
- 立场约束：8 个 Style Lens 非默认、互不套用；不得把某家族（如 modern-minimal）的字体禁令当全局硬规则；本项目=C 成熟，review 应对现有 token 失真，不套现代极简偏好打分。

## 6. 静态校验器范围说明（校验器专项已扩展，非导入方在本批改动）

- 导入当时（2026-10-19/20 凌晨）原校验器硬编码 mattpocock、不识别 oil-oil，列过 5 条缺口（单目录写死 / entry 集合写死 4 / 仅 MIT / license.file 必须 LICENSE / 仅 md+yaml）。
- 随后经**专门授权的校验器扩展任务**（仅改 `scripts/verify-external-skills.mjs` 与专属 `scripts/test-verify-external-skills.mjs`，不碰 core/client/旧 vendor/data）已关闭上述 5 条缺口：
  1. 改为 `VENDOR_PROFILES` 显式注册表 + `scanVendorRoots` 多 vendor 遍历，oil-oil 独立 profile 注册，不再写死单目录；
  2. entry 集合按 profile 注册值校验（oil-oil 单 entry `oiloil-ui-ux-guide`），mattpocock 仍固定 4 entry 不放宽；
  3. license.spdx 按 profile：mattpocock=MIT、oil-oil=Apache-2.0，不全局放行任意 license；
  4. license.file 按 profile：mattpocock=`LICENSE`、oil-oil=`LICENSE.txt`；
  5. 扩展名按 profile：oil-oil 额外放行 `.json`（须合法 JSON 静态数据）与 `.html`（静态模板，拒远程 script src、fetch/XHR/eval/new Function/document.write/动态 import）；mattpocock 仍仅 `.md/.yaml/.yml`，html/json 不放行。
- 安全门未因扩展放宽：SHA256+bytes 逐位相等、EXTRA_FILE/MISSING_FILE、symlink、+x、shebang、路径穿越（`..`/绝对/反斜杠）、entry 注入、危险指令 F1 全部保留；未注册同级目录仅 `SKIPPED_UNREGISTERED` 留痕，不越权审计也不据此 FAIL。
- 当前实跑结果（只读离线）：主校验 PASS（mattpocock 13 文件/4 entry/1 依赖；oil-oil 23 文件/1 entry/0 依赖）；`--selftest` 18/18；专属 test 19 组断言全过；`verify-isolation` guard 201 资产零污染。
- **注意**：静态门绿 ≠ 独立安全/越权双审通过；§7 的独立双审仍 pending（不同 owner）。

## 7. 待独立安全/越权双审（不同 owner，不得与导入方同人）

1. 逐文件 sha256/bytes 与 manifest 复算一致（§3 表）；
2. 对照 `docs/external-skills.md` §5 八红线查新增联网/写全局/安装/提权；
3. 复核 html 内联 JS 与字体外链、evals.json 数据无可执行载荷；
4. 双审通过并留痕后，方可在同页 `review` 中只读引用；结论仍归独立测试门。

## 8. 回滚

- 本批为纯新增隔离目录，无业务代码/数据/配置改动；回滚 = 删除 `vendor/agent-skills/oil-oil/` 目录与本导入记录即可，不影响 mattpocock 及其余 vendor，无需恢复业务状态。
- 未来升级/回滚以 manifest `source.commit` 为唯一开关（§8.3），锁定期内冻结升级。

## 9. 使用边界（试点期）

- 仅在需要界面评审第二意见时显式 `review`；默认 `design`/`guide` 不主动启动；本试点不产出 `design-spec.md`、不定新 token。
- Oil 发现只作候选缺陷，经独立测试专家定级，不由 Oil 结论直接 PASS。
