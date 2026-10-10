# 豆包工作阶段交接存档 handover-archive-doubao.md

> **本文件记录什么 / 给谁 / 怎么用**：本文件是「豆包工作（doubao-work）」平台在本项目从立项到阶段 3 第 0 步期间**全部关键对话与结论的忠实归档**，给后续接手的任何平台/个人了解「这件事的来龙去脉、当初为什么这么定」。日常开发以 `README.md`、`requirements.md`、`handoff.md`、`knowledge-base.md` 为准；本文件用于追溯背景。内容据当时对话与实测整理，**不编造**；无法确证处明确标注【待确认】。

- 归档时间：2026-10-10
- 归档平台：doubao-work（豆包工作）
- 覆盖范围：立项与角色设定 → 官方框架核实 → 阶段 1 环境搭建 → 伙伴档案插曲 → 阶段 2 需求分析与技术调研 → 阶段 3 第 0 步打通验证 → 移交多平台协作

---

## 0. 时间线总览

| 时间（2026-10-10） | 事项 | 产物 / 结果 |
|---|---|---|
| 起步 | 确立「dsh 项目管理工具开发者」伙伴角色与四阶段门禁、可移植档案机制 | 角色与准则（后固化于云端配置 + 仓库 `AGENTS.md`） |
| 阶段 1 前 | 公开渠道核实 dsh 真实性，辨别仿冒站 | 官方仓库/技术栈/License 确认 |
| 阶段 1 | 装工具链、浅克隆上游、install/build/web 验证、建独立仓库、配 SSH 并首推 | 提交 `12bcad3` 等，main 推送 GitHub |
| 插曲 | 「伙伴档案/行为准则」应存何处的厘清 | 只存云端配置页；误入库副本已撤销；**不进仓库** |
| 阶段 2 | 可行性地图、需求 v0.3（R1–R12、数据模型）、技术骨架方案 | 飞书文档 2 份 + 仓库 docs；ADL-007~009 |
| 阶段 3 前 | 源码级只读技术验证（外部插件骨架与装载规格） | `docs/tech-plugin-scaffold.md`（提交 `186fb34`） |
| 阶段 3 第 0 步 | 最小插件端到端打通：装载、离线命令、可读 JSON 落盘 | 插件包 `packages/dsh-pm-tool/`；提交 `9e5d539` |
| 收尾 | 验收通过、推送；确立跨平台协作基座并移交 | `AGENTS.md` + `collaboration.md` + `knowledge-base.md` + 本存档 |

---

## 1. 立项：角色、工作方式与可移植要求

项目所有者要求工作伙伴定位为「DeepSeek Harness 项目管理工具开发者」，使命是基于 dsh 在其本地 macOS 从零搭建并持续迭代一款面向项目经理的项目管理工具，并长期维护。

**强制工作方式（后固化为行为准则，现以仓库 `AGENTS.md` / `docs/collaboration.md` 为准）**：

1. 严格分阶段、顺序固定：**环境搭建 → 需求分析 → 源码开发 → 测试交付**；每阶段先汇报、获明确确认后才进入下一阶段，禁止一次做完。
2. 改代码前先说明「改哪个文件、为什么、影响范围」，确认后再动手。
3. 删除文件、改全局配置、对外推送等高风险操作先征得同意。
4. 需求/方案有歧义先问，不替所有者拍板。
5. 交付必须「能跑起来、能演示」，不只给代码或说明；不破坏上游能力。
6. 每次迭代说明：改了哪些文件、新增哪些插件/Skill、如何启动、已知限制、git 提交说明。
7. 从第一天起用「标准 Markdown + 独立 git 仓库」沉淀成果，main 干净、clone 即可接续；每阶段更新固定档案并产出最小交接清单。

所有者背景（影响协作风格）：史冰冰，ByteDance 创造力服务平台-技术服务-行业交付，商业产品运营（火山引擎方向），工作地深圳，非纯技术研发——因此要求少术语、术语必给白话解释、命令完整可复制并注明环境、分步说明、每阶段可当场演示。

## 2. 官方框架核实结论（阶段 1 前，公开渠道交叉验证）

- **框架真实存在，确为 DeepSeek AI 官方开源**：仓库 <https://github.com/deepseek-ai/deepseek-harness>，组织 `deepseek-ai`，默认分支 **`master`**（非 main），主语言 TypeScript，Topics 含 `cordis`/`dsh`/`dsh-plugin`；当时查询 star 约 **24.6 万**、fork 约 2.96 万，创建于 2026-08-13、查询前一日仍有推送，处于高频迭代的**开发者预览期**。
- **官方身份三方交叉口径**：`deepseek.com` 官网域名（公告页 <https://www.deepseek.com/harness/> 与 GitHub 互链）+ GitHub `deepseek-ai` 组织 + npm scope `@deepseek-ai`（包 `@deepseek-ai/dsh`，维护者含 deepseek.com 员工邮箱）；官方文档站 <https://deepseek-harness.github.io/deepseek-harness/>。
- **辨别出的非官方站点（勿采信）**：`deepseekharness.online`、`deepseekharness.dev`（其「99.93% KV 命中率/省 80% token」等数字官方材料中没有）、`dshai.org`（宣称 star 数与实测不符）。
- **技术栈/安装要求**：Node `^22.19.0 || >=24`（CI 覆盖 22.19/24/26，需 TS 类型剥离）；包管理器 **pnpm 11.28.5**（`packageManager` 字段，corepack）；Git 2.26+；内核为 Cordis（依赖 `@deepseek-ai/cordis`）；`DEEPSEEK_API_KEY` 可选（不设也能构建/测试，真实 API 的 e2e 跳过；Web 在「设置→模型」填 Key，支持自定义 OpenAI 兼容端点）。
- **架构**：一切皆插件（models/tools/skills/sessions/storage/loops/UI 均可替换）；包按能力域分组在 `packages/`，`apps/` 为 cli/desktop/web 壳，`packages/bundle/` + profile 提供 web/headless/sdk/sdk-minimal/acp 预置组合。仓库已含 plan/todo/goal/jobs/schedule/deliverables/storage/skill 等能力包。
- **License：MIT**（GitHub API、LICENSE、README 三方一致；npm 极早期版本曾标 BSD-3-Clause，0.1.0-rc.2 起为 MIT）。
- 备注：官方仓库关闭了 GitHub Issues（`has_issues=false`），反馈走 Discussions。【待确认：star 等数字为查询时点值，会变动】

## 3. 阶段 1 环境搭建（已完成并推送）

- **本机摸底**：macOS 15.6.1（Apple Silicon/arm64）、zsh、git 2.39.5；原系统无独立 Node/pnpm（仅有 Doubao 自带运行时）。
- **工具链**：nvm 安装于 `~/.nvm`，Node **v22.23.3**（npm 10.9.9），`nvm alias default 22`；corepack 启用 pnpm **11.28.5**；nvm 初始化追加到 `~/.zshrc`（未改全局 Node 之外的系统配置）。
- **工作区**：`~/Projects/dsh-pm/`；上游浅克隆 `deepseek-harness/`（`--depth 1`，分支 master，基线 **v0.2.1-alpha.2**，HEAD 哈希 `d743267388641bc76f17c45ce8b4c231aed1d32c`），**只读**。
- **上游构建验证**：`pnpm install`（约 354 个工作区项目，原生模块 postinstall 正常）、`pnpm run build`（原生 addon + host + 数百 client 产物）均退出码 0；`pnpm dsh web` 在 http://127.0.0.1:3080 启动，带一次性 token URL 根路径返回 HTTP 200、页面标题 `DSH Local Build`。
- **独立产品仓库**：`~/Projects/dsh-pm/pm-tool/`（默认分支 main），初始化 README/docs/skills/packages 与 `.gitignore`。
- **远程与身份**：远程 `git@github.com:iceAcmen/pm-tool.git`（SSH）；生成 ed25519 密钥，提交身份 `Ice <835687152@qq.com>` **仅配置在本仓库**（非全局）；公钥由所有者添加到 GitHub 账户 iceAcmen，`ssh -T git@github.com` 认证通过；首次提交 `12bcad3` 并 `git push -u origin main` 成功。公钥指纹 `SHA256:ajsc0fagRHsCMz1C0aEUUKYmny4EC9TeY6PwKTHY3pk`。

## 4. 插曲：「伙伴档案 / 行为准则」存放位置的厘清（重要边界）

- 所有者最初要求「基于用户档案和对话修改伙伴档案与行为准则」。执行中一度把 `docs/partner-profile.md`、`docs/code-of-conduct.md` 写进了产品仓库，并尝试套用个人画像生成能力（后确认该能力只存 3 个超短「用户本人特质」字段，语义与容量都不匹配）。
- **最终厘清的结论**：
  - 「伙伴档案 / 用户档案 / 行为准则」属于**豆包工作云端伙伴配置页**（对应工作区内 `IDENTITY.md` / `USER.md` / `AGENTS.md` 等私有配置），**不应放进产品 git 仓库**；
  - 误提交到仓库的副本已用 `git reset --hard origin/main` 撤销；
  - **禁区（后续平台也应知晓，避免再犯）**：不要把任何平台的「伙伴人设/系统级行为准则」写进 pm-tool 仓库；不要改动 `~/.workbuddy/` 等其他产品的旧人设目录。
  - 仓库内只保留**与项目开发相关、对所有平台通用**的协作约定，即本次新增的根 `AGENTS.md` 与 `docs/collaboration.md`（这是项目工程约定，不是某个平台的私有伙伴人设）。

## 5. 阶段 2 需求分析（定稿 v0.3）

- 所有者交互确认四项关键决策（ADL-007，需求文档 D1–D4）：① **离线优先混合模型**（结构化 CRUD 离线可用，生成型功能按需配 Key）；② **人类可读 Markdown/JSON 存储**；③ **先做 dsh Web 可视化界面**，斜杠命令作离线入口；④ **最小闭环 MVP**（项目计划→WBS→里程碑→保存/导出）。
- 技术架构决策（ADL-008）：业务实体建在 `dsh-storage-domain`（类型化、schema 校验）+ `dsh-storage-json`（可读 JSON 落盘，root 指产品目录）；「用户命令（ctx.commands，离线）+ Web 表单」承载 CRUD，「模型工具（ctx.tools，在线）」留给 P1 生成能力；能力以独立仓库插件 + 专属 profile 外挂，不改上游。
- 三项补充决策（ADL-009，所有者拍板）：**业务数据目录 `data/` 暂不入库**（写 `.gitignore`，首次写入自动建目录、0700）；**里程碑到期提醒 R11 第一版不做（降 P2）**；**生成型能力（智能 WBS、会议纪要归纳、周报）MVP 仅预留接口不实现**。
- **需求模块（v0.3 完整验收标准/数据模型见 `docs/requirements.md`）**：
  - P0（MVP）：R1 项目计划、R2 WBS 任务拆解（≥3 层、自动编号）、R3 里程碑、R4 持久化与 Markdown/JSON 导出、R5 Web 可视化界面、R6 离线斜杠命令；
  - P1：R7 风险与问题管理、R8 会议纪要、R9 进度汇报、R10 交付物管理；
  - P2：R11 里程碑到期提醒（暂缓）、R12 多项目/导入/协作。
  - 核心实体：Project / Task（WBS 树）/ Milestone，字段与落盘布局在需求文档数据模型小节。
- 可行性地图结论：7 个候选功能无「拿来即用成品」，但框架层都可实现——交付物管理/周期触发/存储/技能/PDF 可直接复用或强复用；项目计划/WBS/里程碑借鉴 plan-mode/todo/goal 后重建；风险问题、会议纪要、进度汇报的业务实体与生成流程需自研，但所需地基（存储、命令、工具、UI 卡片、调度）均有官方背书，符合「上游只读、外挂扩展」。

> 阶段 2 的两份长篇调研曾写入飞书云文档（见第 13 节）；**权威内容以仓库内 `docs/feasibility-map.md`、`docs/tech-plugin-scaffold.md` 为准**（其中技术骨架的飞书版本曾报格式/权限问题）。

## 6. 阶段 3 开工前的源码级技术验证

- 不满足于 README 层，直接拉取上游约 20 个真实源码/文档取证（cookbook 4 篇、apps/cli 源码与 README、storage 三件套源码、command-goal、ui-schedule、base/web-app bundle 的 package.json、plugin-manager README、profile-plugins.ts 等）。
- 产出《外部插件骨架与装载规格》，给出可照做的：最小文件树与每文件内容、storage-domain 真实 API、离线命令骨架、Web 界面路径、独立仓库 `link:` + 专属 profile 的六步装载命令，并把不确定点列为【待验证】。仓库权威版本：`docs/tech-plugin-scaffold.md`（提交 `186fb34`）。

## 7. 阶段 3 第 0 步「打通验证」（已验收）

**目标**：先让独立仓库里的最小插件被本地源码版 dsh 成功装载、离线 `/pm ping` 可用、可读 JSON 存储自检通过，再写业务功能。

过程与结论：

1. **取包版本核实**：各独立包 `0.2.1-alpha.2` 确有发布（peer `@deepseek-ai/cordis ~4.0.5-alpha.1`）；注意单包 `npm view <pkg> version` 的 latest 会显示旧版，必须显式 `@0.2.1-alpha.2`（详见 KB-009）。
2. **建最小插件包** `packages/dsh-pm-tool/`（8+ 文件）：`package.json`/`tsconfig.json`/`src/index.ts`/`cordis.patch.yml`/`locale(en,zh)`/`README.md`/`.gitignore`，后又补两个验证脚本与 `pnpm-lock.yaml`、`pnpm-workspace.yaml`。`pnpm install`（cordis 4.0.5-alpha.1、typescript 5.9.3、@types/node 22.x、zod ^4.4.3）与 `pnpm run build`（tsc）一次通过。
3. **派生 profile 并装载**：`pnpm dsh --profile pm --from-default-profile web` 从 web 模板派生（base+web-app，已含 dsh-commands 与存储三件套）；`pnpm dsh plugin --profile pm add link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool` 成功；`--dump-config` 显示 pm-tool 因声明 `dsh.bundle.patch` 自动激活。
4. **离线命令**：Web 斜杠命令目录列出 `pm`（与 goal/plan/model 等并列），执行 `/pm ping` 返回中文「pong：…当前未使用任何模型或 API Key」（有界面截图）。
5. **存储链路 + 真实 bug 修复**：初版校验脚本读不到记录、文件不落地，定位到两个根因——① 裸 `new Context()` 不触发插件 `ctx.effect`（storage-json 靠 effect 注册后端），独立脚本需手动挂载（ISS-006）；② **`table.put()` 异步写盘漏 `await`**（ISS-005），同步把插件命令处理器改为 `async` 并补 await、重新构建。修复后写入/读回成功。
6. **确定性验证脚本**：`scripts/verify-storage.mjs`（真实存储栈 open/put/get）与 `scripts/verify-command.mjs`（导入已构建 `lib/index.js`，跑真实 apply 与 ping/selftest 处理器），均退出码 0；落盘 `pm-tool/data/pmtool/checks/selftest.json`，内容 `{version, record}`、目录 0700。
7. **存储根目录重定向**：把 `~/.dsh/profiles/pm/cordis.patch.yml` 由空 `[]` 改为按 id `storage-json` 覆盖 `config.root=/Users/bytedance/Projects/dsh-pm/pm-tool/data`；`--dump-config` 确认，重启后宿主自身的 `workspace.json`、会话缓存也写入该目录，证明宿主层 root 生效。
8. **CLI 参数顺序坑**：正确为 `pnpm dsh --profile pm [--no-open]`；`dsh web --profile pm` 报 "select a profile only once"、`dsh --profile pm web` 报 "too many arguments"（ISS-007）。
9. **Web 自动化限制**：contenteditable 命令 chip 的参数段在合成事件下不稳定，偶发把参数拆成同级文本而触发模型轮次（无 Key 报 MISSING_CREDENTIAL）；源码确认单条命令不触发模型，判定为自动化限制而非产品缺陷（ISS-009、KB-008）。`/pm selftest` 的干净界面卡片未截到，但由运行发货插件本体的确定性脚本等价证明；真人整行输入可正常执行。

**验收**：所有者确认第 0 步验收通过；插件与档案提交 `9e5d539`，连同 `186fb34` 与移交文档 `41b9db5` 一并推送 origin/main。

## 8. 关键命令速查（环境：macOS + zsh；非交互 shell 先加载 nvm）

```sh
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null

# 插件包：安装 / 构建 / 离线自检
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm install && pnpm run build
node scripts/verify-command.mjs

# 上游目录：派生 profile（首次）/ link 装插件 / 看配置 / 启动
cd ~/Projects/dsh-pm/deepseek-harness
pnpm dsh --profile pm --from-default-profile web            # 首次，Ctrl-C 即可
pnpm dsh plugin --profile pm add link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm dsh --profile pm --dump-config
pnpm dsh --profile pm --no-open                              # 启动，终端打印带 token 的 127.0.0.1:3080 URL
```

## 9. 决策索引（详见 `docs/decision-log.md`）

- ADL-001 官方信息口径与基线；ADL-002~005 目录/独立仓库/工具链/版本等阶段 1 决策；ADL-006 SSH 远程接入。
- ADL-007 需求四项产品决策（离线优先/可读文件/先做 Web/最小 MVP）；ADL-008 MVP 技术架构；ADL-009 数据不入库/R11 暂缓/生成能力仅预留接口；ADL-010 第 0 步 link 外挂、存储 root 落点、确定性验证策略。

## 10. 踩坑索引（详见 `docs/issues-and-solutions.md`）

- ISS-001 系统终端无独立 Node（nvm 解决）；ISS-002 同名仿冒站辨别；ISS-003 pnpm 版本以仓库锁定为准；ISS-004 非交互 shell 需显式加载 nvm。
- ISS-005 `put()` 异步必须 await；ISS-006 裸 Context 不触发 effect 需手动挂载；ISS-007 profile CLI 参数顺序；ISS-008 link peer 警告判定无副作用；ISS-009 Web 富文本 chip 自动化限制。

## 11. 提交链（截至归档）

```
41b9db5  docs(移交): 第0步验收通过并推送，阶段3业务编码与阶段4测试移交 Trae
9e5d539  feat(阶段3): 第0步打通——最小 dsh 插件被本地源码版装载，离线命令与可读 JSON 落盘
186fb34  docs(阶段3): 外部插件骨架与装载技术方案（第0步报备）
e7211c1  docs(阶段2) 收尾（= 当时 origin/main）
54767e1 / 70815a0 / f5d625f / 12bcad3 …  阶段 1/2 更早提交
```

## 12. 遗留与待确认

- 【待确认-技术】第三方插件**独立顶级 Web 页面/路由**接入方式（官方无第三方示例；做 R5 时验证，内置先例 `packages/client/ui-schedule`；稳妥路径先走设置卡片/插件详情区块）。
- 【待确认-环境】外部包浏览器半侧的 clientBundle 构建需在仓库外复刻（第 0 步未做浏览器半侧，未实测）。
- 业务功能 R1–R6 全部未开始；R7–R10 为 P1；R11 暂缓；R12 为 P2。
- 本机专属状态（不在 git）：`~/.dsh/profiles/pm/`（profile、link、root 补丁）、`pm-tool/data/`（业务数据）、上游只读克隆；换机按 `handoff.md` 第 3 节重建。

## 13. 外部调研产物（飞书云文档，仅备查；权威以仓库 docs 为准）

- 可行性地图：<https://bytedance.larkoffice.com/docx/Xv73d04Kco8ppJxrrhfcYdNLn5g>
- 外部插件骨架与装载规格：<https://bytedance.larkoffice.com/docx/Mqp0dssV1oOIcrxJkWfchAk7nKe>（曾报格式/权限异常，**以 `docs/tech-plugin-scaffold.md` 为准**）

> 以上链接可能受飞书权限影响；仓库内 Markdown 为不依赖任何账号的权威版本。
