# dsh 项目经理工具箱（pm-tool）

> 本文件是项目的总入口：记录「这是什么、当前做到哪、如何在本机或新机器上跑起来、目录怎么找」；给项目维护者本人和任何接手的软件/同事使用，从本文件开始阅读即可上手。

## 一、项目简介

基于 DeepSeek 官方开源框架 **DeepSeek Harness（简称 dsh，一切皆插件的 Cordis 架构）** 二次开发的、面向**项目经理（PM）**的项目管理工具。目标覆盖：项目计划、任务拆解（WBS）、里程碑、风险与问题管理、会议纪要、进度汇报、交付物管理。

- 上游框架仓库：<https://github.com/deepseek-ai/deepseek-harness>（组织 `deepseek-ai`，分支 `master`，MIT 协议，开发者预览期）
- 上游官方文档：<https://deepseek-harness.github.io/deepseek-harness/>
- 本产品定位：**不修改上游源码**，以独立插件包 + 配置组合的方式扩展 dsh，保持上游可随时升级。

> 🤖 **任何 AI 编码助手 / IDE（TRAE、Cursor、豆包工作、Copilot 等）接手前，请先读根目录 [`AGENTS.md`](AGENTS.md)，并遵守 [`docs/collaboration.md`](docs/collaboration.md) 的多方协作规则。**
>
> **仓库即唯一事实来源**：需求、决策、变更、进展、经验只以本仓库 Markdown 为准，不依赖任何平台的对话记录或私有格式；各平台地位平等、去中心化协作，clone 本仓库即可无缝接续。

## 二、当前进度（阶段导航）

项目严格按「**环境搭建 → 需求分析 → 源码开发 → 测试交付**」分阶段推进，每阶段经确认后才进入下一阶段。

| 阶段 | 状态 | 说明 |
|---|---|---|
| 阶段 1 环境搭建 | ✅ 已完成（已推送 GitHub） | 工具链/克隆/构建/运行验证均通过；main 已推送至 git@github.com:iceAcmen/pm-tool.git |
| 阶段 2 需求分析 | ✅ 已定稿 v0.3（已推送） | 需求 `docs/requirements.md`、可行性地图、技术骨架方案 |
| 阶段 3 源码开发 | 🔄 第 0 步「打通验证」✅ 已验收并推送；业务开发移交 TRAE/其他平台（暂停） | 最小插件 `packages/dsh-pm-tool/` 已被本地 dsh 装载，离线 `/pm ping` 与可读 JSON 落盘验证通过；R1–R6 业务功能待接手平台报备后开发，接手先读根 `AGENTS.md`、再看 `docs/handoff.md` 第 0 节 |
| 阶段 4 测试交付 | ⬜ 未开始 | 本地运行验证、可演示、发布 |

实时流水见 [`docs/progress.md`](docs/progress.md)。

## 三、目录结构与工作区布局

本机工作区根目录：`~/Projects/dsh-pm/`

```
~/Projects/dsh-pm/
├── deepseek-harness/        # 上游 dsh 源码（克隆，只读参考 + 源码运行验证，不作为我们的成果提交）
└── pm-tool/                 # ★本产品独立 git 仓库（所有核心成果都在这里）
    ├── README.md            # 本文件：总入口
    ├── AGENTS.md            # ★任何 AI/IDE 接手先读：入职说明 + 强制协作准则
    ├── docs/
    │   ├── requirements.md          # 需求：功能模块 / 优先级 / 验收标准 / 数据模型
    │   ├── feasibility-map.md       # dsh 能力可行性地图（复用 vs 新建 + 来源）
    │   ├── tech-plugin-scaffold.md  # 阶段3 插件骨架与装载技术方案（含第0步实测结论）
    │   ├── collaboration.md         # ★多方协作与同步规则（平台标识/开工收工 SOP/冲突处理）
    │   ├── knowledge-base.md        # ★技术知识库（已验证 API/模式/约定/经验，KB 条目）
    │   ├── decision-log.md          # 技术决策日志（时间/决策/理由/替代/结果，ADL）
    │   ├── changelog.md             # 变更记录（文件/内容/原因/影响/日期/平台）
    │   ├── progress.md              # 工作进度流水账（已完成/进行中/待办）
    │   ├── issues-and-solutions.md  # 踩坑与解决方案档案（ISS）
    │   ├── handoff.md               # 最小迁移交接清单（第0节为移交说明）
    │   └── handover-archive-doubao.md # 豆包工作阶段完整交接存档（来龙去脉）
    ├── skills/              # 沉淀为可复用 Skill 的项目知识（阶段 3 起填充）
    ├── packages/
    │   └── dsh-pm-tool/     # ★自研 dsh 插件包（阶段3 第0步打通：/pm 离线命令 + 存储领域 pmtool）
    │       ├── src/index.ts          # 插件入口：注册 /pm、打开存储领域
    │       ├── cordis.patch.yml      # 组合包补丁（安装后自动激活本插件）
    │       ├── locale/               # 中英文标题/描述
    │       ├── scripts/              # verify-storage.mjs / verify-command.mjs 离线确定性验证
    │       ├── package.json / tsconfig.json / README.md
    │       └── lib/（构建产物，不入库）
    └── data/                # 业务数据：项目/任务/里程碑 JSON 与渲染的 Markdown（运行时生成，已 gitignore 不入库，见 ADL-009）
```

插件包的构建、装载与验证命令见 [`packages/dsh-pm-tool/README.md`](packages/dsh-pm-tool/README.md)；第 0 步实测结论见 [`docs/tech-plugin-scaffold.md`](docs/tech-plugin-scaffold.md) 文末附节。

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
- **多方协作**：TRAE、豆包工作等任何平台开工前先 pull 并扫描 `docs/` 最新档案，改动后在 `changelog.md` 留痕（标注平台标识），需求/决策/踩坑/经验同步入库；细则见 [`docs/collaboration.md`](docs/collaboration.md)。
- 每完成一个阶段：同步更新 `docs/` 全部档案，并在 `docs/handoff.md` 刷新交接清单（含「由谁继续」），然后提交一次 git。

## 六、安全与边界

- 不删除、不覆盖上游 `deepseek-harness/` 内任何文件；对上游的本地改动一律视为禁止操作。
- 涉及删除文件、修改全局配置、推送/发布等动作，事先征得项目所有者同意。
- 真实 API Key 等密钥不得写入仓库（使用环境变量或本地未跟踪配置）。
