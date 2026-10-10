# AGENTS.md —— 给任何接手 Agent / IDE 的入职说明与协作准则

> **本文件是什么 / 给谁 / 怎么用**：本文件是所有编码平台（TRAE、Cursor、Copilot、豆包工作、其他 AI Agent 或人类同事）接手 **pm-tool** 仓库时的**第一入口与强制行为准则**。任何平台在动手写代码前，必须先通读本文件并按「第 4 节 接手 SOP」执行；细节规则见 `docs/collaboration.md`。本文件与 `docs/` 内文档共同构成项目的唯一事实来源。

---

## 1. 这是什么项目

- **pm-tool**：基于 DeepSeek 官方开源框架 **DeepSeek Harness（dsh，TypeScript + Cordis「一切皆插件」）** 二次开发的、面向**项目经理**的项目管理工具。
- 目标能力：项目计划、任务拆解（WBS）、里程碑、风险与问题管理、会议纪要、进度汇报、交付物管理。
- **形态**：不修改上游源码，在**独立 git 仓库**（本仓库）内以**外挂 dsh 插件包**方式扩展；上游只读克隆放在本机另一并列目录。
- 项目所有者：史冰冰（GitHub: `iceAcmen`，提交身份 `Ice <835687152@qq.com>`），非纯技术背景——**沟通与文档请少术语、命令完整可复制、每步可演示**。

## 2. 第一原则：仓库即唯一事实来源

1. **本仓库是唯一且权威的状态与知识载体**。需求、决策、变更、进展、约定、踩坑、经验，一律持久化在本仓库的标准 Markdown 文档中；**不依赖任何平台的对话记录、私有格式或账号**。
2. **去中心化、多平台平等**：TRAE、豆包工作、Cursor、任何 IDE/Agent 地位平等，均可读写本仓库。任何平台 clone 本仓库后，都应能仅凭仓库内容无缝接续，**无需任何人口头重新交代背景**。
3. 任何平台内部的对话、草稿、缓存都**不是权威依据**。若仓库文档与你的平台记忆冲突，**以仓库最新状态为准**。

## 3. 当前进展快照（细节以 `docs/progress.md`、`docs/handoff.md` 为准）

- 阶段 1 环境搭建：✅ 完成并推送。
- 阶段 2 需求分析：✅ 完成，当前开发依据 `docs/requirements.md` **v0.4**（含 ADL-011 定稿落盘布局）。
- 阶段 3 源码开发：🔄 **第 0 步「打通验证」已验收并推送**——最小插件 `packages/dsh-pm-tool/` 已被本地源码版 dsh 装载，离线 `/pm ping` 可用、可读 JSON 落盘 `pm-tool/data`（0700）。
- **阶段 3 业务开发进行中（trae，2026-10-10）**：R1–R4/R6 离线 MVP 已完成并回归通过；下一步 R5 Web，完成后通知所有者手动验收。
- 阶段 4 测试交付：未开始。

> 每次开工都不要轻信本节快照，必须按第 4 节拉取并核对最新文档。

## 4. 接手 / 开工 SOP（强制顺序，不可跳过）

1. **拉取最新**：`git fetch && git pull --ff-only origin main`（若本地有未提交改动，先按第 7 节处理，禁止 force push / 改写历史）。
2. **扫描全部最新档案**，至少读：
   - `docs/onboarding-prompt.md`（**标准启动提示词 + 文末「当前交接快照」**；新平台由项目所有者把该文件提示词整段发给你，开工前必读）
   - `docs/handoff.md`（**第 0 节是专门的移交说明**：当前状态、硬约束、起步动作）
   - `docs/progress.md`（已完成/进行中/待办、下一步）
   - `docs/changelog.md`（**最近的变更，尤其看其他平台刚改了什么**；每条末尾标注改动平台）
   - `docs/requirements.md`（做什么、数据模型、验收标准）
   - `docs/decision-log.md`（已定决策，不要推翻已定案的选择）
   - `docs/knowledge-base.md` 与 `docs/issues-and-solutions.md`（已验证的 API/模式与踩坑，避免重复踩坑）
3. **确认地基可用**（阶段 3 起）：
   ```sh
   cd packages/dsh-pm-tool && pnpm install && pnpm run build && node scripts/verify-command.mjs
   ```
   预期退出码 0、打印中文 pong 与 selftest 落盘信息。失败则先修复环境再谈业务开发。
4. **动手前先报备**：说明「要改/新增哪些文件、为什么、影响范围」，经项目所有者确认后再写代码；需求或方案有歧义先提问，不替所有者拍板。
5. **执行改动**：遵守第 6 节硬约束；优先复用 `docs/knowledge-base.md` 中已验证的 API 与模式。
6. **收工前同步档案并提交**（第 7 节）：更新对应文档 → **更新 `docs/onboarding-prompt.md` 文末「当前交接快照」**（最新提交、平台、下一步、待确认项）→ 自检可运行 → 一次清晰提交。**未经项目所有者同意不要 `git push`**（除非所有者已对该批次明确授权）。

## 5. 文档地图（仓库内路径）

| 文档 | 作用 | 何时读 / 更新 |
|---|---|---|
| `README.md` | 总入口、目录、环境与启动 | 新人/新 Agent 先读；结构变化时更新 |
| **`AGENTS.md`**（本文件） | 跨平台入职说明与强制准则 | 每次开工先读；协作规则变化时更新 |
| `docs/collaboration.md` | **多方协作与同步规则、平台标识、冲突处理**（权威细则） | 开工前读；协作机制变化时更新 |
| **`docs/onboarding-prompt.md`** | **标准启动提示词 + 当前交接快照（接入 SOP）** | **开工前必读；每次任务完成后必更新快照** |
| `docs/doubao-validation-prompt.md` | 豆包独立功能复核 + 下一步规划提示词 | 需要跨平台复核时整段发送；具体状态由豆包从仓库读取 |
| `docs/handoff.md` | 最小迁移交接清单（第 0 节为移交说明） | 每阶段收尾刷新 |
| `docs/progress.md` | 进度流水（已完成/进行中/待办） | 有进展即更新 |
| `docs/requirements.md` | 需求：模块/优先级/验收/数据模型（v0.4，含 §5.1 落盘布局） | 需求变更时更新并在 `decision-log.md` 记原因 |
| `docs/feasibility-map.md` | dsh 能力「复用 vs 新建」地图与来源 | 技术选型时读 |
| `docs/tech-plugin-scaffold.md` | 插件骨架/装载规格 + **第 0 步实测结论** | 写插件前必读 |
| `docs/decision-log.md` | 技术决策（时间/决策/理由/替代/结果，ADL-xxx） | 每做一个决策立即追加 |
| `docs/changelog.md` | 变更记录（文件/内容/原因/影响/日期/**平台**） | **每次改动必写** |
| `docs/knowledge-base.md` | 架构认知/API 用法/有效模式/约定/经验 | 一旦总结出可复用知识立即写 |
| `docs/issues-and-solutions.md` | 踩坑：现象/根因/解法/避坑（ISS-xxx） | 一踩坑立即写 |
| `docs/handover-archive-doubao.md` | 豆包工作阶段完整交接存档（来龙去脉） | 了解历史背景时读 |
| `skills/` | 可复用 Skill 定义 | 沉淀可复用流程时补充 |

## 6. 必须遵守的硬约束（红线）

- **上游只读**：绝不修改 `~/Projects/dsh-pm/deepseek-harness/` 内任何文件；所有功能在本仓库 `packages/` 下以外挂插件实现。
- **密钥不入库**：`DEEPSEEK_API_KEY` 等一律走环境变量或本地未跟踪配置；`.gitignore` 已覆盖密钥、`data/`、`node_modules/`、构建产物 `lib/`。
- **业务数据 `data/` 不纳入 git**（ADL-009），由存储后端首次写入时自动创建。
- **离线优先**：核心增删改查走 `ctx.commands`（无 API Key 可用）；会议纪要/智能 WBS/周报等生成型能力一期**仅预留接口、不实现**。
- **里程碑到期提醒（R11）第一版不做**。
- **数据落人类可读 JSON**：`storage-domain` + `storage-json`，root 指向 `pm-tool/data`；Markdown 报告由 JSON 渲染导出。
- **不破坏 dsh 原有能力**；命名规范、关键逻辑加注释、不引入明显安全问题。
- **`main` 保持干净、可克隆即接续**；禁止 `git push --force`、禁止改写已推送历史。
- 删除文件、覆盖他人成果、改全局/系统配置、对外推送/发布，**必须先征得项目所有者同意**。
- 沟通与文档一律**简体中文 + 通用 Markdown**；命令/配置/代码片段完整可复制并注明运行环境（macOS + nvm Node 22 + pnpm 11.28.5）。

## 7. 改动后必须同步的内容（一次改动的最小闭环）

1. 在 `docs/changelog.md` 顶部追加一条：**改了哪些文件、做了什么、为什么、影响范围、日期、改动平台标识**（平台标识见 `docs/collaboration.md`）。
2. 涉及需求/决策变化：同步更新 `docs/requirements.md` 并在 `docs/decision-log.md` 追加 ADL 条目（时间/决策/理由/替代/结果）。
3. 踩到坑：追加 `docs/issues-and-solutions.md`（ISS 条目）；总结出可复用知识：追加 `docs/knowledge-base.md`。
4. 进度变化：更新 `docs/progress.md`；阶段收尾：刷新 `docs/handoff.md`（当前进度、环境依赖、下一步、**由谁继续**）。
5. **每个任务完成后必须做完整回归**：先构建，再运行当前插件包内全部 `scripts/verify-*.mjs`，同时执行本批新增功能的专项验证；逐项记录命令、退出码、关键覆盖和失败情况。任一验证未通过，不得标记任务完成或提交。
6. 本地验证「能跑、能演示」且完整回归全部通过后，按当前授权状态决定版本控制动作。**项目所有者已授权：自 2026-10-10 起至 R5 实现完成前，每批全量回归通过后可自动 `git commit` 并普通 `git push origin main`，无需逐批询问**；任一验证失败时不得提交或推送。R5 完成后该临时授权自动终止，必须通知所有者进行真实界面手动验证，并恢复逐次询问。
7. 最终回报必须包含完整测试验证结果：运行环境、全部验证命令、各项结果、关键证据及未覆盖边界；不得只写“测试通过”。
8. **任务通过验证后主动规划下一步**：基于仓库最新需求优先级、进度和交接档案，主动输出下一批文件级改动计划（文件、用途、原因、影响、验证方式和待确认项）；项目所有者确认后立即继续实施，无需等待其再次指定下一步。
9. 除上述有明确起止范围的临时授权外，提交和推送仍是两个独立授权项；只获准提交不代表可以推送。每次推送后确保本地与 `origin/main` 一致。

## 8. 环境与常用命令（运行环境：macOS + zsh + nvm Node 22 + pnpm 11.28.5）

> 非交互 shell 每条命令前先加载 nvm：
> `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null`

```sh
# 自研插件：构建 + 离线确定性自检（在 packages/dsh-pm-tool 目录）
pnpm install
pnpm run build
node scripts/verify-command.mjs      # 应退出码 0：中文 pong + selftest 落盘可读 JSON
node scripts/verify-storage.mjs      # 存储后端写入读回与权限
node scripts/verify-projects.mjs     # 项目增查、校验、并发、全新进程读回；使用独立临时目录
node scripts/verify-tasks.mjs        # WBS 完整命令、关系、编号与重启读回
node scripts/verify-milestones.mjs   # 里程碑增查、排序、并发与重启读回
node scripts/verify-export.mjs       # Markdown 内容、路径、覆盖与失败清理

# 启动 dsh（在上游目录 ~/Projects/dsh-pm/deepseek-harness；指定 --profile 后不再加 web 动词）
pnpm dsh --profile pm --no-open     # 终端打印带一次性 token 的 http://127.0.0.1:3080 URL
pnpm dsh --profile pm --dump-config # 只看组合后的配置树，不启动

# 插件改代码后：在包目录重新 build，再重启 dsh（link 包不热更新）
```

完整的环境恢复、profile 派生与 `link:` 装载步骤见 `docs/handoff.md` 第 3 节；真实 API 用法见 `docs/knowledge-base.md` 与 `docs/tech-plugin-scaffold.md`。

## 9. 遇到不确定怎么办

- 需求/方案有歧义、存在多个后果差异较大的选项：**先向项目所有者提问**，可给推荐项与利弊，但不替其拍板；结论记入 `docs/decision-log.md`。
- 对 dsh API 没把握：先查上游只读源码 / `docs/knowledge-base.md`，需要实测就写最小验证脚本，**不要臆造 API**；结论回填知识库。
- 发现其他平台留下了未在文档中说明的改动或异常文件：先在 `changelog.md` / `progress.md` 找依据，仍不清楚就先问，不要擅自删除或覆盖。
