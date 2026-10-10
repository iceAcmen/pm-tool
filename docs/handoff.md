# 最小迁移交接清单 handoff.md

> 本文件是「换一个人或换一个软件接续本项目所需的最小信息集」；在每个阶段收尾或项目所有者要求时刷新。接手者按本清单即可恢复环境、定位进度、知道下一步做什么。

最后更新：2026-10-10（trae / TRAE 完成首个项目增查业务增量并本地提交，待所有者验收，未推送；后续由 trae 或所有者指定平台接续）

---

## 0. 移交说明（给接手方：TRAE 或其他 IDE / Agent / 同事）

> 接手第一步：项目所有者把 **`docs/onboarding-prompt.md`** 的「标准启动提示词」整段发给新 Agent；Agent 先读该文件（含文末「当前交接快照」）与仓库根 **`AGENTS.md`**（入职说明与强制准则），再按 `docs/collaboration.md` 完成「新平台首次接入自检」并登记平台标识；本节为其补充。

- **当前状态**：阶段 1、阶段 2 已完成，开发依据 v0.4；阶段 3 第 0 步已验收。首批文件清单已获确认，trae 已完成 projects 表、Project zod schema、离线 `/pm project add/list/get` 与确定性校验。R1/R4/R6 进行中；R2/R3/R5 待办，本批未做 Web、编辑或导出。
- **协作模式**：仓库是唯一事实来源，TRAE、豆包工作等多平台**地位平等、去中心化**；开工前先 `git pull --ff-only` 并扫描最新档案，改动后在 `changelog.md` 标注平台标识并同步知识/决策（细则见 `docs/collaboration.md`）。
- **建议阅读顺序**（均为本仓库标准中文 Markdown，自解释）：
  0. `docs/onboarding-prompt.md`（**启动提示词 + 当前交接快照**）、根 `AGENTS.md` 与 `docs/collaboration.md`（**接手准则与同步规则，最先读**）
  1. `README.md`（总览、目录、启动方式）
  2. `docs/requirements.md` **v0.4**（**做什么、验收标准、Project/Task/Milestone 数据模型、§5.1 已定稿落盘布局**——开发主依据）
  3. `docs/feasibility-map.md`（dsh 哪些能力复用/新建）
  4. `docs/tech-plugin-scaffold.md`（**怎么挂插件、真实 API、第 0 步实测结论**——开发主依据，重点读文末附节）
  5. `docs/knowledge-base.md`（已验证 API/模式/约定，KB-001～013）与 `docs/issues-and-solutions.md`（ISS-001～009）
  6. `docs/decision-log.md`（ADL-001～ADL-011，所有已定决策与约束；ADL-011 为落盘布局定稿）
  7. `docs/handover-archive-doubao.md`（豆包工作阶段完整来龙去脉，需要背景时读）
  8. 本文件（环境恢复、装载/验证命令、下一步）
- **硬约束（来自项目所有者，务必遵守）**：
  - 上游 `~/Projects/dsh-pm/deepseek-harness/` **只读**，所有功能以独立仓库 `pm-tool/packages/` 内的外挂插件实现，不改上游一行；
  - 离线优先：核心增删改查走 `ctx.commands`（无 Key 可用），生成型能力一期仅预留接口；
  - 数据落人类可读 JSON（storage-domain + storage-json，root=`pm-tool/data`，**`data/` 不入库**）；
  - 里程碑到期提醒 R11 **第一版不做**；
  - 每次改代码前先说明「改哪个文件/为什么/影响范围」，删除、全局配置、对外推送先征得同意；每阶段更新 docs 并做清晰提交。
- **起步动作**：按第 3 节确认环境，运行构建与三个 verify 脚本，均应退出码 0；按包 README 可演示项目增查，下一批先报备文件清单。
- 唯一遗留技术【待验证】：第三方插件**独立顶级 Web 页面**接入方式（做 R5 Web 界面时验证；内置先例 `packages/client/ui-schedule`，稳妥路径先走设置卡片/插件详情区块）。

---

## 1. 仓库地址与分支

| 项 | 值 |
|---|---|
| 本产品仓库（核心成果）远程地址 | **`git@github.com:iceAcmen/pm-tool.git`**（GitHub，SSH，分支 `main`） |
| 本产品仓库本地路径 | `~/Projects/dsh-pm/pm-tool/`（main 工作区；阶段 3 起本地领先 origin/main） |
| 首次提交 | `12bcad3` —— "chore: 阶段1 环境搭建与项目档案初始化" |
| 阶段 2 提交 | `70815a0`（需求 v0.2 + 可行性地图）、`54767e1`（需求 v0.3 + ADL-009）、`e7211c1`（阶段 2 收尾，**= origin/main**） |
| 阶段 3 提交 | `186fb34`（技术骨架方案报备文档）、`9e5d539`（第 0 步最小插件 + 档案同步）、最新一条 `docs(移交)` 为第 0 步验收/推送/移交 Trae 说明；**以上均已推送 origin/main（2026-10-10）** |
| dsh 专属 profile | `~/.dsh/profiles/pm/`（由 web 模板派生；以 `link:` 挂载本插件；补丁把存储 root 指向 `pm-tool/data`） |
| 上游框架源码本地路径 | `~/Projects/dsh-pm/deepseek-harness/`（只读，勿改） |
| 上游仓库 | <https://github.com/deepseek-ai/deepseek-harness>（分支 `master`） |
| 上游基线版本 | **v0.2.1-alpha.2** |
| 上游基线提交哈希 | `d743267388641bc76f17c45ce8b4c231aed1d32c`（2026-10-09 17:31 +0800，浅克隆 depth=1） |

> 说明：上游为浅克隆（`--depth 1`）。如需完整历史可在该目录执行 `git fetch --unshallow`。

## 2. 当前进度快照

### 已完成（阶段 1，全部完成）
- 核实 dsh 官方身份、技术栈、安装要求与插件架构（见 `docs/decision-log.md` ADL-001）。
- 安装用户级工具链：nvm + Node v22.23.3（npm 10.9.9）+ corepack/pnpm **11.28.5**，并写入 `~/.zshrc`。
- 浅克隆上游源码，`pnpm install` 成功（354 个工作区项目，约 1m17s，原生模块 postinstall 正常）。
- `pnpm run build` 成功（原生 addon + host + 357 个 client 产物，退出码 0）。
- 运行验证通过：`pnpm dsh web --no-open` 在 `http://127.0.0.1:3080` 启动；带一次性令牌 URL 完成认证后根路径返回 **HTTP 200**，页面标题 `DSH Local Build`、含 `id="root"` 与构建产物 `/assets/index-*.js`。验证后已关闭服务。
- 建立本产品独立 git 仓库与完整标准档案（README / docs / skills / packages）。
- SSH 认证打通并首次推送 main 到 GitHub（身份 Ice \<835687152@qq.com\>，仅仓库级配置）。

### 已完成（阶段 2 需求分析，已定稿 v0.3 并获项目所有者确认）
- 完成 dsh 能力可行性地图 `docs/feasibility-map.md`（本地源码 + 官方 cookbook/包 README 双路印证）。
- 四项产品决策（ADL-007）：离线优先混合模型、人类可读 JSON+Markdown 存储、先做 dsh Web 界面、最小闭环 MVP。
- 技术架构（ADL-008）：`storage-domain` + `storage-json` 落盘、用户命令（离线）/模型工具（在线）双入口、独立插件包 + 专属 profile。
- 三项补充决策（ADL-009）：业务数据目录 `data/` 暂不入库（已 gitignore）、里程碑提醒 R11 暂缓（P2）、生成型能力 MVP 仅预留接口不实现。
- MVP 范围：R1 项目计划 / R2 WBS 任务拆解 / R3 里程碑 / R4 持久化与导出 / R5 Web 界面 / R6 离线斜杠命令；数据模型与验收标准见 `docs/requirements.md`。

### 已完成（阶段 3 第 0 步「打通验证」，2026-10-10）
- 新建最小插件包 `packages/dsh-pm-tool/`：`/pm` 离线命令（ping/selftest）+ 存储领域 `pmtool`（per-record，表 `checks`，zod 校验）；包内 `tsc` 独立构建通过。
- 由 web 模板派生 profile `pm`，`link:` 绝对路径装入插件并自动激活；`--dump-config` 可见插件与存储三件套。
- profile 补丁将 storage-json `root` 覆盖到 `pm-tool/data`；宿主启动日志 `[pm-tool] 存储领域 pmtool 已打开`。
- Web 无 Key 执行 `/pm ping` 返回中文 pong（截图为证）；`scripts/verify-command.mjs` 跑通已构建插件的 selftest，落盘 `pm-tool/data/pmtool/checks/selftest.json`（可读、0700）。
- 修复真实 bug：`table.put()` 异步写盘漏 `await`（见 ISS-005）。
- 唯一遗留【待验证】：第三方独立顶级 Web 页面（业务功能阶段再验）。

### 已完成（首个业务增量，trae / TRAE，2026-10-10）
- 同一插件包内部增加 core/commands 模块，pmtool 版本 1 保留 checks，新增 projects；路径 `data/pmtool/projects/<id>.json`。
- 新增离线 `/pm project add {JSON}`、`list`、`get <ID>`；完整示例与必填字段见 `packages/dsh-pm-tool/README.md`。无新增插件包、Skill、依赖或 profile 改动。
- `pnpm run build` 与三个 `scripts/verify-*.mjs` 通过（退出码 0），验证增查、非法输入不落盘、10 次并发新增不覆盖、失败后恢复、旧 checks 兼容、0700、全新进程读回。项目测试独立临时库，保留结果路径供查看。
- 本批只做 Host 确定性验证，未重跑浏览器交互及完整 dsh 重启验收；R5 仍未开始。新增为单进程队列，暂不支持多个宿主共享目录写入。
- 本地提交主题：`feat(项目): 实现离线项目新增与查询及持久化验证 [trae]`，未推送。实际提交号用 `git log -1 --oneline` 查看。

### 下一步（由 trae 或所有者指定平台接续；新一批先报备）
- **存储布局已定稿（ADL-011 / requirements v0.4 §5.1）**：单领域 `pmtool` 下 `projects`/`tasks`/`milestones` 三表 per-record（`data/pmtool/<表>/<id>.json`），用表 `keys()/entries()` 枚举、不建 index.json；直接照此实现，不要再用旧的嵌套目录设想。
- **下一批**：报备 R2 任务树；之后 R3 里程碑、R4 导出，补齐 R1 编辑及 R6 其余命令；R5 Web 最后，先设置卡片/区块再顶级页面验证。未获新批次授权前不扩展范围。
- 接手平台须先提交该增量的**新增/修改文件清单**报备，获项目所有者确认后再写码；改动按 `docs/collaboration.md` 标平台标识并留痕。
- 里程碑提醒 R11 暂缓；生成型能力一期仅预留接口（ADL-009）。
- 第 0 步及全部档案提交**已推送 origin/main**（2026-10-10 经项目所有者确认）。

## 3. 环境依赖清单

- 操作系统：macOS 15.6.1，Apple Silicon（arm64），shell 为 zsh。
- Git：2.39.5（macOS 自带）。
- Node.js：v22.23.3，经 **nvm** 安装于 `~/.nvm`（dsh 要求 `^22.19.0 || >=24`）。
- pnpm：**11.28.5**，经 Node 自带 **corepack** 启用（版本以上游 `packageManager` 字段为准）。
- GitHub 认证：本机 ed25519 SSH 私钥 `~/.ssh/id_ed25519`（无密码，仅本机留存），公钥已登记在 GitHub 账户 iceAcmen，指纹 `SHA256:ajsc0fagRHsCMz1C0aEUUKYmny4EC9TeY6PwKTHY3pk`。
- 磁盘：工作区位于 `~/Projects/dsh-pm/`；上游含 `node_modules` 与构建产物，占用数 GB。
- API Key：阶段 1 不需要；后续如需真实模型，在 Web UI「设置 → 模型」填入 DeepSeek Key（环境变量 `DEEPSEEK_API_KEY`），**密钥不得写入仓库**。

新机器恢复命令（macOS）：

```sh
# 基础工具链
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc
nvm install 22 && nvm alias default 22
corepack enable

# 取本产品仓库（需把本机 SSH 公钥登记到 GitHub）
git clone git@github.com:iceAcmen/pm-tool.git ~/Projects/dsh-pm/pm-tool

# 取上游源码并跑起来（只读参考/运行）
git clone --depth 1 https://github.com/deepseek-ai/deepseek-harness.git ~/Projects/dsh-pm/deepseek-harness
cd ~/Projects/dsh-pm/deepseek-harness
corepack prepare pnpm@11.28.5 --activate   # 或直接 pnpm install，corepack 会按 packageManager 自动切换
pnpm install
pnpm run build
pnpm dsh web        # 终端会打印带 token 的本地访问 URL（token 每次启动变化）
```

在产品仓库构建插件并挂到本地 dsh（第 0 步已验证，均在上游目录 `~/Projects/dsh-pm/deepseek-harness` 执行）：

```sh
# 1) 构建自研插件
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm install && pnpm run build
node scripts/verify-command.mjs     # 离线确定性自检（应退出码 0，落盘 pm-tool/data/.../selftest.json）
node scripts/verify-storage.mjs     # 统一领域声明与旧自检记录
node scripts/verify-projects.mjs    # 系统临时库，项目增查及全新进程读回

# 2) 首次：由 web 模板派生 pm profile（会启动，Ctrl-C 即可），再 link 装入插件
cd ~/Projects/dsh-pm/deepseek-harness
pnpm dsh --profile pm --from-default-profile web
pnpm dsh plugin --profile pm add link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool

# 3) 把存储根目录指到产品目录（写 ~/.dsh/profiles/pm/cordis.patch.yml，内容见 docs/tech-plugin-scaffold.md）
#    然后查看配置 / 日常启动
pnpm dsh --profile pm --dump-config
pnpm dsh --profile pm --no-open     # 终端打印带 token 的 http://127.0.0.1:3080 URL；浏览器打开后输 /pm ping
```

> 注：插件改代码后需在包目录重新 `pnpm run build`，再重启 dsh（link 包不会热更新）。

## 4. 下一步从哪里继续

1. 阶段 2 已完成；当前开发依据 v0.4，落盘布局见 ADL-011。
2. **阶段 3 第 0 步「打通验证」已完成**：最小插件 `packages/dsh-pm-tool/` 已被本地源码版 dsh 装载，离线 `/pm ping` 与可读 JSON 落盘（`pm-tool/data`，0700）均验证通过；结论见 `docs/tech-plugin-scaffold.md` 文末附节、ADL-010、ISS-005～009。
3. **首个项目增查增量已完成，待验收**。由 trae 或指定平台报备下一批 R2，之后 R3/R4，补齐项目编辑与其余命令；R5 收尾，浏览器半侧需实测（KB-010）。现有插件仅需重新 build 并重启，无须修改 profile 或上游。
4. 阶段 4 测试交付：本地运行验证、现场演示、版本迭代与发布。

## 5. SSH 密钥（已配置，备查）

- 私钥：`~/.ssh/id_ed25519`（本机留存，勿外传）；公钥：`~/.ssh/id_ed25519.pub`。
- 公钥已由项目所有者添加到 GitHub 账户 iceAcmen；`ssh -T git@github.com` 返回 `Hi iceAcmen! You've successfully authenticated...` 即正常（该命令退出码 1 是 GitHub 不提供 shell 的正常现象）。
- 公钥指纹：`SHA256:ajsc0fagRHsCMz1C0aEUUKYmny4EC9TeY6PwKTHY3pk`。
- 换新机器时：重新生成密钥并把新公钥登记到 GitHub，再执行上面的 clone 即可。
