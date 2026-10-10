# 技术决策日志 decision-log.md

> 本文件按时间记录每个重要技术/方案决策「决定了什么、为什么、有哪些替代方案、最终结果」；给后续维护与迁移者使用，遇到「为什么当初这么做」时来这里查。每条决策不可删改，只可被新决策 supersede（取代）。

记录格式：`编号 | 日期 | 标题 | 决策 | 理由 | 替代方案 | 最终结果/状态`

---

## ADL-001 ｜ 2026-10-10 ｜ 选定基础框架为 DeepSeek Harness（dsh）

- **决策**：以 DeepSeek 官方开源框架 DeepSeek Harness（dsh）作为二次开发底座。
- **理由**：官方组织 `deepseek-ai` 出品，MIT 协议可商用；Cordis「一切皆插件」架构与需求高度契合；已自带 plan/todo/goal/jobs/schedule 等可复用能力。
- **辨别过程**：官方仓库与官网 deepseek.com/harness 双向互链、npm scope 为 `@deepseek-ai`，三方交叉验证；排除了 deepseekharness.online / .dev / dshai.org 等非官方站点。
- **替代方案**：从零自研 Agent 框架（成本高、重复造轮子）；选用其他 Agent 框架（与既定要求不符）。
- **最终结果**：确认仓库 <https://github.com/deepseek-ai/deepseek-harness>，采纳。

## ADL-002 ｜ 2026-10-10 ｜ 本地工作区目录布局

- **决策**：工作区固定在 `~/Projects/dsh-pm/`，其下并列 `deepseek-harness/`（上游源码）与 `pm-tool/`（本产品仓库）。
- **理由**：路径长期稳定、与聊天会话目录解耦，便于长期维护与迁移；上游源码与自有成果物理分离。
- **替代方案**：放在聊天项目目录（路径深、不易长期维护）；直接放 `~/dsh-pm`（更短但归类弱）。经项目所有者确认选择 `~/Projects/dsh-pm`。
- **最终结果**：已创建目录并完成上游克隆。

## ADL-003 ｜ 2026-10-10 ｜ 采用「独立产品仓库 + 上游并列」，不 fork monorepo

- **决策**：本产品为独立 git 仓库，dsh 作为依赖/配置被挂载；上游源码仅只读克隆用于运行验证与查阅，不在其 `packages/` 内直接改。
- **理由**：保持上游干净、升级成本低、自有仓库小而清晰、最符合「clone 即可接续」的迁移目标；也符合 dsh 官方推荐的外挂插件扩展模式（`dsh plugin add` / Cordis 挂载）。
- **替代方案**：fork 整个 dsh monorepo 在内部开发（与上游强耦合、升级合并困难、仓库庞大）。
- **最终结果**：经确认采纳；阶段 3 以独立插件包形式落地。

## ADL-004 ｜ 2026-10-10 ｜ 使用 nvm 安装用户级 Node，corepack 提供 pnpm

- **决策**：通过 nvm 在 `~/.nvm` 安装 Node 22，使用 Node 自带 corepack 启用 pnpm；向 `~/.zshrc` 追加 nvm 初始化。
- **理由**：本机原本只有 Doubao 自带运行时 Node，系统终端无独立 Node/pnpm，不满足「可演示、可迁移」；nvm 装在用户目录、无需 sudo、可复现、可多版本切换。
- **替代方案**：直接用 Doubao 自带 Node（系统终端不可用、不可迁移）；先装 Homebrew 再装（更重）。
- **最终结果**：已装 Node v22.23.3、pnpm 11.28.5；重开终端自动生效。

## ADL-005 ｜ 2026-10-10 ｜ 锁定上游版本与包管理器版本

- **决策**：以克隆时点 master HEAD（**v0.2.1-alpha.2**）为开发基线；pnpm 以上游 `packageManager` 字段锁定的 **11.28.5** 为准。
- **理由**：dsh 处于开发者预览期、存在破坏性变更，必须记录基线以便复现；corepack 依据 `packageManager` 自动选择对应 pnpm。
- **替代方案**：不锁版本、始终追最新（易因破坏性变更导致不可复现）。
- **最终结果**：基线提交哈希记录于 `docs/handoff.md`；后续升级需在本日志新增决策。

## ADL-006 ｜ 2026-10-10 ｜ 远程仓库接入方式

- **决策**：第一阶段即接入 GitHub 远程 `git@github.com:iceAcmen/pm-tool.git`，使用本机生成的 ed25519 SSH 密钥认证；提交身份 Ice \<835687152@qq.com\> 仅配置在本仓库（不写全局）。
- **理由**：项目所有者选择尽早接入远程以满足备份与可迁移；SSH 免密、私钥仅留存本机，比 HTTPS+Token 更适合长期使用。
- **替代方案**：先纯本地 git、稍后再接远程；HTTPS + Personal Access Token。
- **最终结果**：已完成。公钥由项目所有者添加到 GitHub 账户 iceAcmen（公钥指纹 `SHA256:ajsc0fagRHsCMz1C0aEUUKYmny4EC9TeY6PwKTHY3pk`），`ssh -T git@github.com` 返回认证成功；main 首次推送成功并跟踪 origin/main（首次提交 `12bcad3`）。
