# dsh 项目经理工具箱（pm-tool）

> 本文件是项目的总入口：记录「这是什么、当前做到哪、如何在本机或新机器上跑起来、目录怎么找」；给项目维护者本人和任何接手的软件/同事使用，从本文件开始阅读即可上手。

## 一、项目简介

基于 DeepSeek 官方开源框架 **DeepSeek Harness（简称 dsh，一切皆插件的 Cordis 架构）** 二次开发的、面向**项目经理（PM）**的项目管理工具。目标覆盖：项目计划、任务拆解（WBS）、里程碑、风险与问题管理、会议纪要、进度汇报、交付物管理。

- 上游框架仓库：<https://github.com/deepseek-ai/deepseek-harness>（组织 `deepseek-ai`，分支 `master`，MIT 协议，开发者预览期）
- 上游官方文档：<https://deepseek-harness.github.io/deepseek-harness/>
- 本产品定位：**不修改上游源码**，以独立插件包 + 配置组合的方式扩展 dsh，保持上游可随时升级。

## 二、当前进度（阶段导航）

项目严格按「**环境搭建 → 需求分析 → 源码开发 → 测试交付**」分阶段推进，每阶段经确认后才进入下一阶段。

| 阶段 | 状态 | 说明 |
|---|---|---|
| 阶段 1 环境搭建 | ✅ 已完成（已推送 GitHub） | 工具链/克隆/构建/运行验证均通过；main 已推送至 git@github.com:iceAcmen/pm-tool.git |
| 阶段 2 需求分析 | ⬜ 未开始 | 产出并评审 `docs/requirements.md` |
| 阶段 3 源码开发 | ⬜ 未开始 | 在 `packages/` 内开发 PM 插件 |
| 阶段 4 测试交付 | ⬜ 未开始 | 本地运行验证、可演示、发布 |

实时流水见 [`docs/progress.md`](docs/progress.md)。

## 三、目录结构与工作区布局

本机工作区根目录：`~/Projects/dsh-pm/`

```
~/Projects/dsh-pm/
├── deepseek-harness/        # 上游 dsh 源码（克隆，只读参考 + 源码运行验证，不作为我们的成果提交）
└── pm-tool/                 # ★本产品独立 git 仓库（所有核心成果都在这里）
    ├── README.md            # 本文件：总入口
    ├── docs/
    │   ├── requirements.md          # 需求：功能模块 / 优先级 / 验收标准 / 数据模型
    │   ├── feasibility-map.md       # dsh 能力可行性地图（复用 vs 新建 + 来源）
    │   ├── decision-log.md          # 技术决策日志（时间/决策/理由/替代/结果）
    │   ├── changelog.md             # 版本更新记录（改了哪些文件/内容/原因）
    │   ├── progress.md              # 工作进度流水账（已完成/进行中/待办）
    │   ├── issues-and-solutions.md  # 踩坑与解决方案档案
    │   └── handoff.md               # 最小迁移交接清单（每阶段收尾更新）
    ├── skills/              # 沉淀为可复用 Skill 的项目知识（阶段 3 起填充）
    ├── packages/            # 自研 PM 插件包（阶段 3 起填充）
    └── data/                # 业务数据：项目/任务/里程碑 JSON 与渲染的 Markdown（运行时生成，已 gitignore 不入库，见 ADL-009）
```

## 四、环境依赖与启动方式

运行环境：**macOS 15.6.1（Apple Silicon / arm64）**，zsh。

| 依赖 | 版本 | 安装方式 |
|---|---|---|
| Node.js | v22.23.3（满足 dsh 要求 `^22.19.0 \|\| >=24`） | nvm 安装在 `~/.nvm` |
| 包管理器 pnpm | 11.28.5（与上游 `packageManager` 字段一致） | Node 自带 corepack 启用 |
| Git | 2.39.5 | macOS 自带 |

新机器一次性准备（已在本机执行过，命令可复制）：

```sh
# 1) 安装 nvm（会向 ~/.zshrc 追加初始化脚本）
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc
# 2) 安装并启用 Node 22
nvm install 22 && nvm alias default 22
# 3) 启用 pnpm（版本以上游仓库 packageManager 字段为准，corepack 会自动切换）
corepack enable
```

从源码运行**上游框架**（验证框架可用，Web UI 默认地址 http://127.0.0.1:3080）：

```sh
cd ~/Projects/dsh-pm/deepseek-harness
pnpm install        # 安装依赖（含少量原生模块编译）
pnpm run build      # 构建仓库产物
pnpm dsh web        # 启动 Web UI；加 --no-open 可只起服务不弹浏览器
```

免克隆快速体验官方版（不用于开发）：`npx @deepseek-ai/dsh web`

> 本产品自身的启动命令将在阶段 3 插件落地后补充于此。

## 五、文档使用约定（自解释 / 可迁移）

- 全部文档为**简体中文 + 通用 Markdown**，不依赖任何私有格式或工具标记。
- 每个文档开头用一句话说明「记录什么、给谁用、怎么用」。
- 关键命令、配置、代码片段均完整可复制，并注明运行环境。
- 所有核心成果（代码、文档、Skill 定义）都在本仓库内；`main` 分支保持干净，clone 后即可接续。
- 每完成一个阶段：同步更新 `docs/` 全部档案，并在 `docs/handoff.md` 刷新交接清单，然后提交一次 git。

## 六、安全与边界

- 不删除、不覆盖上游 `deepseek-harness/` 内任何文件；对上游的本地改动一律视为禁止操作。
- 涉及删除文件、修改全局配置、推送/发布等动作，事先征得项目所有者同意。
- 真实 API Key 等密钥不得写入仓库（使用环境变量或本地未跟踪配置）。
