# 最小迁移交接清单 handoff.md

> 本文件是「换一个人或换一个软件接续本项目所需的最小信息集」；在每个阶段收尾或项目所有者要求时刷新。接手者按本清单即可恢复环境、定位进度、知道下一步做什么。

最后更新：2026-10-10（阶段 1 环境搭建收尾）

## 1. 仓库地址与分支

| 项 | 值 |
|---|---|
| 本产品仓库（核心成果）本地路径 | `~/Projects/dsh-pm/pm-tool/` |
| 本产品仓库远程地址 | `git@github.com:iceAcmen/pm-tool.git`（GitHub，SSH） |
| 本产品仓库分支 | `main`（保持干净，可直接 clone 上手） |
| 上游框架源码本地路径 | `~/Projects/dsh-pm/deepseek-harness/`（只读，勿改） |
| 上游仓库 | <https://github.com/deepseek-ai/deepseek-harness>（分支 `master`） |
| 上游基线版本 | **v0.2.1-alpha.2** |
| 上游基线提交哈希 | `d743267388641bc76f17c45ce8b4c231aed1d32c`（2026-10-09 17:31 +0800，浅克隆 depth=1） |

> 说明：上游为浅克隆（`--depth 1`）。如需完整历史可在该目录执行 `git fetch --unshallow`。

## 2. 当前进度快照

### 已完成（阶段 1）
- 核实 dsh 官方身份、技术栈、安装要求与插件架构（见 `docs/decision-log.md` ADL-001）。
- 安装用户级工具链：nvm + Node v22.23.3（npm 10.9.9）+ corepack/pnpm **11.28.5**，并写入 `~/.zshrc`。
- 浅克隆上游源码，`pnpm install` 成功（354 个工作区项目，约 1m17s，原生模块 postinstall 正常）。
- `pnpm run build` 成功（原生 addon + host + 357 个 client 产物，退出码 0）。
- 运行验证通过：`pnpm dsh web --no-open` 在 `http://127.0.0.1:3080` 启动；带一次性令牌 URL 完成认证后，根路径返回 **HTTP 200**，页面标题 `DSH Local Build`、含 `id="root"` 与构建产物 `/assets/index-*.js`。验证后已关闭服务。
- 建立本产品独立 git 仓库与完整标准档案（README / docs / skills / packages）。
- 已生成 GitHub 用 SSH 公钥（见第 5 节），已在本仓库配置局部提交身份 Ice \<835687152@qq.com\>。

### 待办（阶段 1 最后一步）
- ⏳ 把 SSH 公钥添加到 GitHub 账户（当前 `ssh -T git@github.com` 返回 Permission denied）。
- ⏳ 公钥生效后：首次提交并 `git push -u origin main`（远程与提交身份已配置好）。
- 随后向项目所有者汇报阶段 1，经确认进入**阶段 2 需求分析**。

## 3. 环境依赖清单

- 操作系统：macOS 15.6.1，Apple Silicon（arm64），shell 为 zsh。
- Git：2.39.5（macOS 自带）。
- Node.js：v22.23.3，经 **nvm** 安装于 `~/.nvm`（dsh 要求 `^22.19.0 || >=24`）。
- pnpm：**11.28.5**，经 Node 自带 **corepack** 启用（版本以上游 `packageManager` 字段为准）。
- 磁盘：工作区位于 `~/Projects/dsh-pm/`；上游含 `node_modules` 与构建产物，占用数 GB。
- API Key：阶段 1 不需要；后续如需真实模型，在 Web UI「设置 → 模型」填入 DeepSeek Key（环境变量 `DEEPSEEK_API_KEY`），**密钥不得写入仓库**。

新机器恢复命令（macOS）：

```sh
# 基础工具链
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc
nvm install 22 && nvm alias default 22
corepack enable

# 取本产品仓库
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

1. 完成远程推送（第 5 节），关闭阶段 1。
2. 进入**阶段 2 需求分析**：与项目所有者逐条评审 `docs/requirements.md`，重点先回答该文件「四、待确认问题」（是否接入真实 LLM、数据存储方案、交互形态、单/多用户、是否导入既有文件）。
3. 阶段 3 再动手写代码：精读上游 `docs/cookbook/`（adding-a-package / adding-a-tool 等），在本仓库 `packages/` 内以独立 Cordis 插件实现，不改上游源码。

## 5. SSH 公钥接入（待项目所有者操作一次）

- 私钥路径：`~/.ssh/id_ed25519`（本机留存，勿外传）；公钥路径：`~/.ssh/id_ed25519.pub`。
- 公钥内容（添加到 GitHub：Settings → SSH and GPG keys → New SSH key）：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIF7YjA0AMMWd61vDreZFcRUPKCrd0CDU8jYdPWvFy9FI 835687152@qq.com
```

- 添加后验证：`ssh -T git@github.com`，出现 `Hi iceAcmen! You've successfully authenticated...` 即成功。
- 成功后在本仓库执行（正常情况下由开发方代为执行）：
  ```sh
  cd ~/Projects/dsh-pm/pm-tool
  git add -A && git commit -m "chore: 阶段1 环境搭建与项目档案初始化"
  git remote add origin git@github.com:iceAcmen/pm-tool.git   # 若尚未添加
  git push -u origin main
  ```
