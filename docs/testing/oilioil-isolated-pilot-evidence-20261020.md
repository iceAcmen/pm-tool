<!--
OilOil UI/UX Guide 项目级隔离试点：官方来源证据 / owner / blocker（独立测试专家只读调研，2026-10-20）。
本文件只做来源锁定与审查点登记，不执行安装/script、不 home/global 写、不 vendoring 落盘、不替代独立测试门。
引入新 vendor 须走 docs/external-skills.md §8.2 双审 + manifest 锁 commit/sha256 + verify-external-skills.mjs 全绿后才可使用；本批无 final PASS。
-->
# OilOil UI/UX Guide 隔离试点 · 官方来源证据 / Owner / Blocker（2026-10-20 只读调研）

## 1. 官方来源锁定（只用官方，不混 OilOil 其它包/镜像）

| 项 | 值（只读官方 GitHub 实测） |
|---|---|
| 官方仓库 | `https://github.com/oil-oil/ui-ux-guide`（旧名 `oil-oil/oiloil-ui-ux-guide` 现重定向到此，以现名为准） |
| 锁定 commit | `f32bc2bd210a6693f86841816a531ab511b258b4`（committer 2026-09-10T12:48:14Z，msg「明确 Skill 功能、首次使用与执行边界 (#1)」） |
| License | Apache-2.0（`LICENSE.txt`，11358B，官方根目录）；无 license/不明者禁止引入，此条满足 |
| 允许 package 范围 | **仅** `skills/oiloil-ui-ux-guide/` 子树（SKILL.md + evals.json + references/）；根 AGENTS.md/CLAUDE.md/.cursor/agents/openai.yaml/index.html 属桥接/介绍页，不纳入引用入口 |
| 已读文件 sha256（只读缓存） | SKILL.md = `19a5435b9f1cd0c6832f536a8e509a63f2947c1f862d3910b59ecf90d63ad88b`（14968B/220 行，commit f32bc2b）；全子树逐文件 sha256 待导入方双审时重算入 manifest |
| 脚本/安装器扫描 | 子树无 `.sh/.js/.ts/.py/.exe/package.json/postinstall/setup/install`；仅 md/json/html/yaml 文本与一个 evals.json 数据文件，**无可执行脚本** |
| 明确排除的镜像/改名包（不混用） | `davepoon/buildwithclaude` 收录副本、`opendcai`/agentskill.sh 改名、agskills.dev、claudskills、lobehub、agent-skills.jp、happycapy 均为第三方镜像/聚合，**不作来源、不采信其版本** |

### 1.1 上游安装方式与本项目处置（红线对齐 ADL-048 / external-skills.md §5）
- 上游 README 给两种：`npx skills add oil-oil/ui-ux-guide [-g]`（全局/多 Agent）与 `git clone … ~/.codex/skills/…`（写 home）。
- **本项目一律不执行**：不跑 npx/skills CLI、不 `-g`、不 clone 到 home、不跑任何 setup/installer；如最终引入，由导入方**手动只读 fetch 官方子树到项目内隔离目录**（新 vendor 目录，不覆现有 `vendor/agent-skills/{mattpocock,product-os,ux-ui-skills,ui-ux-pro-max}`），双审后写 manifest。
- 纯文本规则 + config 驱动 HTML 预览模板；无账号/API Key/出网探测；不联网抓取对齐上游（试点期冻结 commit）。

## 2. Oil 实际改变了什么决策（不只报名字）—— baseline-vs-B1 审查点

> 用法边界：Oil `review` 只作 B1/B4 界面评审的**第二意见清单**，PASS/FAIL 仍由独立测试门给出；真实像素证据只由 Main 主端采集，QA 不驱 GUI。下列为对照基线后 Oil 相对现有 `ux-ui-audit` / `design-system-review` / `verify-product-outcomes` 的增量。

| # | Oil 机制（官方 SKILL.md 原文要点） | 对 B1/B2 的实际审查点（baseline 对照） | 是否新增/改变 |
|---|---|---|---|
| O1 | **10 条 style-independent UX Hard Rules**（非审美）：任务优先<3s、状态覆盖、Affordance+signifier、错误预防+可恢复、反馈闭环、一致性、CRAP、间距刻度、提示分层 L0–L3、文案纪律 | B1 六态（空/加载/陈旧/局部失败/错误重试/无结果）之外，Oil 明确把 **success / permission-denied** 也列为状态覆盖缺项=真 bug；B2「did it work/what changed/what's next」反馈闭环进 G05/G06 验收 | **新增补项**：success、permission-denied 两态须在 B1/B2 矩阵显式登记（现计划缺 permission-denied） |
| O2 | **项目五档成熟度 A空白/B半成品/C成熟/D复杂遗留/E不确定**，Phase0 先扫代码 token/框架/真实 UI 文件再开口 | 本项目=C 成熟（已有 token 2.0、RGL/公式/filter 成熟引擎），Oil 不应诱导重定方向；review 模式应对现有设计语言，**不得套 modern-minimal 家族偏好打分** | 改变评审立场：从「按理想现代极简挑刺」改为「核对现有 token 失真」 |
| O3 | **8 个 Style Lens 非默认、互不套用**（modern-minimal/editorial/brutal/playful/premium-luxury/tech-cyberpunk/warm-content/brand-driven） | 现网 dark/tech 取向不等于选定家族；禁止把某家族「禁 Inter/圆角上限」当全局硬规则批评另一取向 | 改变：评审分 Hard Rule（硬）vs Style Lens（可选）两层，后者不阻塞 |
| O4 | `review` 输出 P0/P1/P2 + 一行证据 + 可执行修复 + 结尾 verification checklist；附 design-psych 诊断（slips vs mistakes、gulfs）与 HCI 定律 | 与 ux-ui-audit S0–S3 互补：Oil 用 P0/P1/P2 优先级、心理诊断词汇；本项目仍用 S0–S3 严重度落 defect-format，两套映射不混用 | 方法互补，不替换严重度 |
| O5 | `design` 默认、`guide`/`review` 显式触发；轻量问题不启动全流程；Phase4b 业务化真实页 mockup 点头后才出 design-spec.md | B1 是既有页 Migrate 视觉，**不进 design 定新系统**；只在需要评审时显式 `review` | 约束：本试点不产出 design-spec.md、不定新 token |
| O6 | 错误预防优先约束/默认/内联校验；破坏性操作可逆或显式确认；错误信息须说「发生了什么+怎么修」 | 直接对应 B2-A06 非法协议拦截保输入、B2-A12 取消零写、B1-G04 陈旧可重试；Oil 补「错误信息须含修复方向」可观测点 | 强化既有项的文案验收 |

### 2.1 待 Main 真实像素证据后回填（QA 不代填）
- B1-G01~G12、B2-G01~G07 的 observed 证据到齐后，用 O1/O4 清单逐条对照；Oil 发现只作候选缺陷，经独立测试专家定级，不由 Oil 结论直接 PASS。

## 3. Owner / Blocker

| 角色 | 归属 | 状态（2026-10-20 QA 独立双审后） |
|---|---|---|
| 本证据调研 owner | 独立测试专家（只读，不改码、不安装、不驱 GUI） | 进行中（只读引用，不另起方向） |
| manifest 官方 vendor 导入（拉子树、重算 sha256、写 manifest、核 license） | **策略伙伴另一 owner**（与安全审查不同人） | **已完成**：`vendor/agent-skills/oil-oil/manifest.json` schema3 / commit f32bc2b / Apache-2.0 / 23 文件 |
| 独立安全/越权双审（哈希逐位比对 + 八红线 + 类型/出网/可执行） | 本独立测试专家（非导入方） | **PASS（见 §3.1）** |
| GUI 真实采证 | 唯一主端 Main；前端 client `s_000E60G3Zfb`、data core `s_000E60ePRfA` | NOT_RUN（本批无 GUI） |

### 3.1 QA 独立双审结论（2026-10-20，非导入方执行）

**结论：INDEPENDENT-AUDIT PASS（静态/只读层）；静态绿 ≠ 产品验收 PASS。** 不执行任何 vendored JS、不联网、不改 vendor/产品代码。

- **完整性（复算，非引用导入方自报）**：声明 23 = 磁盘 23；逐文件 sha256 + bytes 与 manifest **零 mismatch**；无缺失、无额外、无 symlink、无路径穿越；全部 0644、无 +x。
- **来源/许可/政策**：schemaVersion=3；source.commit 精确 40-hex = `f32bc2bd210a6693f86841816a531ab511b258b4`；license.spdx=Apache-2.0（LICENSE.txt 11358B 头部核验为 Apache License 2.0）；policy `projectRulesPrecedence/noInstallerRun/noHomeOrGlobalWrites=true`；entrySkillIds=`[oiloil-ui-ux-guide]`；declaredDependencies=`[]`。
- **类型/可执行红线**：仅 .md / 1 个 evals.json / 1 个本地预览 .html / LICENSE.txt / manifest.json；无 .sh/.py/.js/.mjs/二进制、无 shebang、无 eval/new Function/require/child_process。
- **出网静态扫描**：无 fetch/XMLHttpRequest/WebSocket/sendBeacon/document.write/远程 script src；Google Fonts 仅 passive preconnect + 用户在预览内选 webfont 后动态拼 css2（本地探索，非自动出网）；w3.org SVG 命名空间不发起请求；无凭据/密钥/installation 指令。
- **evals.json**：合法 JSON dict，纯行为测试数据，不含可执行代码。
- **残留提示（非阻断，使用纪律）**：① 预览模板 `design-preview-template.html` 的 `design-config.js`（/tmp 会话配置）**未 vendored**，直接打开仅显示缺配置提示；② `business-mockup-contract.md` 建议 /tmp 会话临时预览 + macOS `open`，属 advisory 文本，输出位置仍由项目规则管辖；③ style-families 禁/推清单仅限所选家族，不得当全局规则。
- **独立可执行门（QA 自写，保留）**：`docs/testing/oil-audit/verify-oil-oil.mjs`（真实 vendor PASS；`--selftest` 6 负例 tamper/extra/traversal/exec-shebang/policy-false/html-fetch 全部被拒）。

### 3.2 导入方 validator freeze 后 QA 独立复跑（2026-10-20）

- `verify-external-skills.mjs` 已显式注册双 profile：mattpocock（MIT/LICENSE/固定 4 entry/仅 md+yaml，strict 未放宽）、oil-oil（Apache-2.0/LICENSE.txt/单 entry/仅 md+json+html）。QA 独立复跑：
  - 主 scan：**PASS（2 注册 vendor）**——mattpocock commit=49dd158d… 文件13/entry4/依赖1；oil-oil commit=f32bc2b… 文件23/entry1/依赖0。
  - `--selftest`：**18/18 负例通过**（含 html fetch/eval 载荷 HTML_EXEC 拒、缺失文件 MISSING_FILE、注册缺失 MISSING_VENDOR、未注册同级仅 SKIPPED_UNREGISTERED 留痕不阻断）。
  - `scripts/test-verify-external-skills.mjs`：**19 组断言全过**（license 误用双向拒、穿越/entry 注入/缺失/exec 位拒、远程 script/内联 fetch-eval 拒、mattpocock 出 .html 拒、多 vendor 扫描、真实两 vendor 指纹一致）。
- **skipped 不冒称 verified**：`product-os` / `ui-ux-pro-max` / `ux-ui-skills` 未注册，仅 `SKIPPED_UNREGISTERED` 留痕，本门不审计、不读其指纹；其原有 manifest 与读取不受影响（mattpocock 独立 PASS 证明 strict 门未回归）。
- QA 独立二次复算 oil 23 文件 sha256/bytes/0644：**零 mismatch、零 extra**；先前 2 条 REF_UNRESOLVED（design-spec-template/extended-dimensions）已在 manifest 登记，主 scan 转绿。
- HTML 门：远程 `<script src=https>` 与内联 fetch/eval 拒；真实模板仅 passive preconnect + 按需 Google Fonts css2，未被判为可执行；evals.json 纯数据。
- 结论：**official gate 静态层 PASS，oil 满足加载前置**；**同 task 页 actual GUI data review = NOT_RUN**（需 Main 真证据，当前无同页实际数据/渲染核验，不冒 GUI PASS）；静态绿 ≠ 验收 PASS。

> 产品闸门归属 B2（见测试计划），不混入本 skill blocker：**P1–P3 已用户批准；U1 方案 A（task 可选 arrays）已批准**，待 data owner 补 schema 合同。

## 4. Ego 工具状态（单列，与 Oil 无关，QA 只记录事实，不重装/不操作 Ego）

> 事实由主端 Main CU 同步，QA 不代判、不重装、不首次设置、不驱 native CLI、不用 web/JS 驱动。

| 维度 | 真状态（2026-10-20 最新主端同步） |
|---|---|
| 安装 | **安装 PASS**：`/Applications/ego lite.app`；codesign deep strict + spctl 通过，Notarized Developer ID |
| 首次设置 / CU | **SETUP_READY · CU 可用**：onboarding 欢迎页已过、不再阻塞；Main 在 Ego 独立窗口完成 CU 浏览（本地统一图集 → 深色 task 抽屉 → 独立旧 wb-harness → 原生五态 `<select>` 展开 → ESC 关闭并焦点回归）。首次设置未做登录/密码导入/默认设置，无 native CLI 自动化 |
| CU 已观察到的事实（仅记录，不定论） | ① 地址栏 setvalue+Enter 首次未跳转，需 click 后再 Enter；② 图集 AX 长文本截断/单页可完整；③ 输入后 cancel，抽屉仍在——**不得据此标「取消零写」PASS**（未做快照零写比对） |
| 证据边界 | 本次 harness 是**旧共享壳**，不是最新生产/认可 design 验收；Ego app 仅用于 CU 浏览原生 select，**native engine 性能/效率对照 = NOT_RUN**，不承诺速度、不以其它浏览器证据冒充 Ego |
| 运行环境 | 此刻 **3172 无监听，旧 PID 不得复用**；不向正式 data 保存；无 CLI/web JS 驱动、无默认设置、无登录迁移 |
| 门控口径 | 安装 PASS + CU 可用 ≠ 验收 PASS；效率 NOT_RUN 不阻塞主线也不计入 PASS；startup 隔离方法为最高优先级独立审（见 `isolated-candidate-launch-audit-20261020.md`），front 修稿未到前主动对接、不占 panel 代码 |

- QA 边界：严禁 egoCLI/CDP/JS 驱 GUI、不重复 install/setup；真实 GUI 仅 Main 采证。

## 5. 本批声明与 QA 当前姿态
本文件为只读来源证据与审查点，**无 final PASS**；Oil 未 vendoring、未使用。manifest 由 owner 另分片制作，QA 负责独立双审（哈希+红线）与 verify-external-skills 静态绿，通过后才加载 official 同页 review。
QA 不做业务实现、只 own testplans 文档；等待 B1 实代码后先做 AUTO 离线验证，再向 Main 出 GUI 采证清单。
