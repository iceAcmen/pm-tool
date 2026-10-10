# 踩坑与解决方案档案 issues-and-solutions.md

> 本文件记录搭建与开发过程中遇到的「问题现象、根因、解决办法（含可复制命令）」；给维护者与迁移者排错使用，避免同一个坑踩两次。

运行环境默认：macOS（Apple Silicon）+ zsh + nvm Node 22 + pnpm（corepack）。

---

## ISS-001 ｜ 系统「终端」里没有 node / pnpm

- **现象**：在 Doubao 执行环境中 `node -v` 有版本（v22.x），但路径指向 Doubao 自带运行时；系统里没有独立 Node（无 /usr/local、/opt/homebrew、nvm），自己打开「终端」App 将没有 node/pnpm。
- **根因**：Doubao 运行时注入了自带 Node，仅在其执行环境的 PATH 中生效，并非系统级安装。
- **解决办法**：用 nvm 安装用户级 Node，并用 corepack 启用 pnpm（无需 sudo）：
  ```sh
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  source ~/.zshrc
  nvm install 22 && nvm alias default 22
  corepack enable
  ```
- **状态**：已解决（2026-10-10）。

## ISS-002 ｜ 存在多个同名/仿冒「DeepSeek Harness」站点

- **现象**：检索到 deepseekharness.online、deepseekharness.dev、dshai.org 等站点，部分宣传数据（如「99.93% KV 命中率」「539K stars」）与官方不符。
- **根因**：热门开源项目易出现第三方营销/仿冒站点。
- **解决办法**：只以三方交叉口径判定官方——`deepseek.com` 官网域名 + GitHub `github.com/deepseek-ai` 组织 + npm `@deepseek-ai` scope；其余站点信息一律不采信。
- **状态**：已识别并规避（2026-10-10）。

## ISS-003 ｜ pnpm 版本与仓库锁定不一致

- **现象**：早期通过网页抓取看到 `packageManager` 为 pnpm@11.7.0，但克隆到的最新 master（v0.2.1-alpha.2）锁定 pnpm@11.28.5。
- **根因**：dsh 在开发者预览期迭代极快，锁定版本随提交变化；应以**当前克隆内 `package.json` 的 `packageManager` 字段**为准。
- **解决办法**：在仓库内让 corepack 按锁定版准备 pnpm：
  ```sh
  corepack prepare pnpm@11.28.5 --activate
  pnpm -v   # 应输出 11.28.5
  ```
  通常在仓库目录直接运行 pnpm 时，corepack 也会依据 `packageManager` 自动切换。
- **状态**：已解决（2026-10-10）。

## ISS-004 ｜ 非交互 shell 中 nvm/pnpm 不生效

- **现象**：每个新的命令行会话都是全新 shell，不会自动带有 nvm 的 Node/pnpm。
- **根因**：nvm 通过 shell 启动脚本注入环境变量，非交互新会话需显式加载。
- **解决办法**：在每条需要 Node 的命令前先加载 nvm：
  ```sh
  export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null
  ```
  交互式终端因 `~/.zshrc` 已配置，打开即自动生效。
- **状态**：已记录约定（2026-10-10）。

---

## 待补充（占位）

> 后续在依赖安装、构建、运行、插件开发中遇到的新问题，按上述格式持续追加（ISS-005、ISS-006……）。
