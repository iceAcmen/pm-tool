# 最小迁移交接清单 handoff.md

> 本文件是「换一个人或换一个软件接续本项目所需的最小信息集」；在每个阶段收尾或项目所有者要求时刷新。接手者按本清单即可恢复环境、定位进度、知道下一步做什么。

最后更新：2026-10-10（阶段 2 需求分析已定稿 v0.3 并推送；即将进入阶段 3 源码开发）

## 1. 仓库地址与分支

| 项 | 值 |
|---|---|
| 本产品仓库（核心成果）远程地址 | **`git@github.com:iceAcmen/pm-tool.git`**（GitHub，SSH，分支 `main`） |
| 本产品仓库本地路径 | `~/Projects/dsh-pm/pm-tool/`（main 干净、已与 origin/main 同步） |
| 首次提交 | `12bcad3` —— "chore: 阶段1 环境搭建与项目档案初始化" |
| 阶段 2 提交 | `70815a0`（需求 v0.2 + 可行性地图）、`54767e1`（需求 v0.3 + ADL-009） |
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

### 下一步（项目所有者已确认进入阶段 3）
- 先做两个**只读**技术验证：① 第三方插件在 dsh Web 的界面形态；② 独立仓库插件包被本地 dsh profile 装载的链路。
- 就插件包目录结构与首批新建文件向项目所有者报备，获确认后再写代码。

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
pnpm dsh web        # 终端会打印带 token 的本地访问 URL
```

## 4. 下一步从哪里继续

1. 阶段 2 已定稿并获确认（`docs/requirements.md` v0.3，决策见 ADL-007/008/009）。
2. **阶段 3 源码开发（即将开始）**：先做两个只读技术验证（Web 界面形态、本地插件包装载链路），随后就 `packages/` 下插件包骨架（pm-core / pm-commands / pm-web）与首批新建文件报备，获确认后实现 MVP（项目计划 / WBS / 里程碑 / JSON 持久化 + Markdown 导出 / Web 界面 / 离线命令），全程不改上游源码、不依赖 API Key。
3. 阶段 4 测试交付：本地运行验证、现场演示、版本迭代与发布。

## 5. SSH 密钥（已配置，备查）

- 私钥：`~/.ssh/id_ed25519`（本机留存，勿外传）；公钥：`~/.ssh/id_ed25519.pub`。
- 公钥已由项目所有者添加到 GitHub 账户 iceAcmen；`ssh -T git@github.com` 返回 `Hi iceAcmen! You've successfully authenticated...` 即正常（该命令退出码 1 是 GitHub 不提供 shell 的正常现象）。
- 公钥指纹：`SHA256:ajsc0fagRHsCMz1C0aEUUKYmny4EC9TeY6PwKTHY3pk`。
- 换新机器时：重新生成密钥并把新公钥登记到 GitHub，再执行上面的 clone 即可。
