# dsh 项目经理工具箱（pm-tool）

> 本文件是项目的总入口：记录「这是什么、当前做到哪、如何在本机或新机器上跑起来、目录怎么找」；给项目维护者本人和任何接手的软件/同事使用，从本文件开始阅读即可上手。

## 一、项目简介

基于 DeepSeek 官方开源框架 **DeepSeek Harness（简称 dsh，一切皆插件的 Cordis 架构）** 二次开发的、面向**项目经理（PM）**的项目管理工具。目标覆盖：项目计划、任务拆解（WBS）、里程碑、风险与问题管理、会议纪要、进度汇报、交付物管理。

- 上游框架仓库：<https://github.com/deepseek-ai/deepseek-harness>（组织 `deepseek-ai`，分支 `master`，MIT 协议，开发者预览期）
- 上游官方文档：<https://deepseek-harness.github.io/deepseek-harness/>
- 本产品定位：**不修改上游源码**，以独立插件包 + 配置组合的方式扩展 dsh，保持上游可随时升级。

> 🤖 **任何 AI 编码助手 / IDE（TRAE、Cursor、豆包工作、Copilot 等）接手前**：项目所有者可直接把 [`docs/onboarding-prompt.md`](docs/onboarding-prompt.md) 里的「标准启动提示词」整段发给它；Agent 开工前必读根 [`AGENTS.md`](AGENTS.md) 与该文件，并遵守 [`docs/collaboration.md`](docs/collaboration.md) 的多方协作规则（任务完成后须更新 onboarding-prompt 文末快照）。
>
> **仓库即唯一事实来源**：需求、决策、变更、进展、经验只以本仓库 Markdown 为准，不依赖任何平台的对话记录或私有格式；各平台地位平等、去中心化协作，clone 本仓库即可无缝接续。

## 二、当前进度（阶段导航）

项目严格按「**环境搭建 → 需求分析 → 源码开发 → 测试交付**」分阶段推进，每阶段经确认后才进入下一阶段。

| 阶段 | 状态 | 说明 |
|---|---|---|
| 阶段 1 环境搭建 | ✅ 已完成（已推送 GitHub） | 工具链/克隆/构建/运行验证均通过；main 已推送至 git@github.com:iceAcmen/pm-tool.git |
| 阶段 2 需求分析 | ✅ 已完成，开发依据 v0.7 | 含 ADL-026 R9 固定快照模型 |
| 阶段 3 源码开发 | 🔄 v0.1.0 后续迭代 | R1–R9 已完成并推送（R9 经 doubao-work 独立复核）；下一步 R10 交付物管理 |
| 阶段 4 测试交付 | ✅ MVP 已完成并发布 v0.1.0 | 测试矩阵、交付说明、完整回归与真实启动验证通过 |

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
    │   ├── onboarding-prompt.md     # ★跨平台 Agent 标准启动提示词 + 当前交接快照（开工前必读、收工后必更新）
    │   ├── doubao-validation-prompt.md # 豆包独立功能复核 + 下一步规划提示词
    │   ├── knowledge-base.md        # ★技术知识库（已验证 API/模式/约定/经验，KB 条目）
    │   ├── decision-log.md          # 技术决策日志（时间/决策/理由/替代/结果，ADL）
    │   ├── changelog.md             # 变更记录（文件/内容/原因/影响/日期/平台）
    │   ├── progress.md              # 工作进度流水账（已完成/进行中/待办）
    │   ├── issues-and-solutions.md  # 踩坑与解决方案档案（ISS）
    │   ├── handoff.md               # 最小迁移交接清单（第0节为移交说明）
    │   ├── test-cases.md            # R1–R9 自动化矩阵与手动验收用例
    │   ├── delivery.md              # MVP 安装、启动、演示、备份和限制
    │   ├── releases/                # 版本发布说明、验收证据与已知限制
    │   └── handover-archive-doubao.md # 豆包工作阶段完整交接存档（来龙去脉）
    ├── skills/              # 沉淀为可复用 Skill 的项目知识（阶段 3 起填充）
    ├── packages/
    │   └── dsh-pm-tool/     # ★自研插件包：项目、WBS、里程碑、风险问题管理 + 自检
    │       ├── src/index.ts          # Host 入口：注册 /pm、打开存储领域
    │       ├── src/client/           # Web 顶级项目管理面板与侧栏入口
    │       ├── src/core/             # Project/Task schema、统一领域与业务逻辑
    │       ├── src/commands/         # 项目与 WBS 命令解析、中文输出
    │       ├── cordis.patch.yml      # 组合包补丁（安装后自动激活本插件）
    │       ├── locale/               # 中英文标题/描述
    │       ├── scripts/              # command/storage/projects/tasks 全量确定性验证
    │       ├── package.json / tsconfig.json / README.md
    │       └── lib/（构建产物，不入库）
    └── data/                # pmtool 下 checks/projects/tasks/milestones/risk_issues 数据；不入库
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

日常使用本产品（本机已有 pm profile，macOS + nvm Node v22.23.3 + pnpm 11.28.5）：

```sh
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm run build
node scripts/verify-command.mjs
node scripts/verify-storage.mjs
node scripts/verify-projects.mjs
node scripts/verify-tasks.mjs
node scripts/verify-milestones.mjs
node scripts/verify-risk-issues.mjs
node scripts/verify-meetings.mjs
node scripts/verify-reports.mjs
node scripts/verify-export.mjs
node scripts/verify-web.mjs
cd ~/Projects/dsh-pm/deepseek-harness
pnpm dsh --profile pm --no-open
```

打开终端打印的带 token URL，点击左侧“项目管理”即可使用 Web 面板；也可在对话框整行输入：

```text
/pm project add {"name":"首版交付","startDate":"2026-10-10","targetDate":"2026-10-31"}
/pm project list
/pm project get p-0001
/pm project update p-0001 {"status":"active"}
/pm project delete p-0001 confirm
/pm task add {"projectId":"p-0001","title":"需求确认"}
/pm task list p-0001
/pm milestone add {"projectId":"p-0001","title":"首版发布","targetDate":"2026-10-31"}
/pm risk-issue add {"projectId":"p-0001","type":"risk","title":"供应商延期","impact":"high","probability":"medium","responsePlan":"准备备选供应商"}
/pm risk-issue list p-0001 all open

# 会议纪要与内嵌行动项
/pm meeting add {"projectId":"p-0001","title":"项目周会","meetingDate":"2026-10-10"}
/pm meeting action add mtg-0001 {"title":"完成验收","owner":"Ice","taskId":"t-0001"}
/pm meeting action update mtg-0001 ai-001 {"status":"done"}

# 固定快照进度汇报
/pm report generate p-0001 2026-10-01 2026-10-31 {"title":"十月进度汇报"}
/pm report update rpt-0001 {"status":"final","executiveSummary":"总体按计划"}
/pm report export rpt-0001
/pm export markdown p-0001
```

详情、更新和删除使用新增返回的实际 ID。字段、同名/日期/确认规则、全部验证命令与限制见[插件使用说明](packages/dsh-pm-tool/README.md)。

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
