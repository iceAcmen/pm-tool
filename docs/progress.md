# 工作进度流水账 progress.md

> 本文件记录项目「每个阶段已完成、进行中、待办」的最新状态；给维护者与迁移者快速判断进度使用。每次有进展即更新，最新内容置顶。

最后更新：2026-10-10

## 当前阶段：阶段 2 需求分析（🔄 需求评审稿已完成，待项目所有者评审确认）

### 🔄 阶段 2 已完成 / 进行中
- 完成 dsh 能力可行性调研（本地官方源码 + 官方 cookbook/包 README 双路印证），沉淀 `docs/feasibility-map.md`。
- 经项目所有者交互确认四项关键决策（见 ADL-007）：离线优先混合模型、人类可读 JSON+Markdown 存储、先做 dsh Web 界面、最小闭环 MVP。
- 确定 MVP 技术架构（见 ADL-008）：`storage-domain` + `storage-json` 落盘、用户命令（离线）/模型工具（在线）双入口、独立插件包 + 专属 profile。
- 产出需求评审稿 v0.3：R1–R12 模块与可测试验收标准、Project/Task/Milestone 数据模型、数据落盘目录约定与业务规则、非功能需求。
- 项目所有者确认三项补充决策（ADL-009）：`data/` 暂不入库（已写入 `.gitignore`）、里程碑到期提醒暂缓（R11→P2）、生成型能力一期仅预留接口不实现。

### ⬜ 阶段 2 待办
- 项目所有者对需求 v0.3 做最终确认；确认后刷新 `docs/handoff.md` 收尾阶段 2，再进入阶段 3（开发前会先就插件包结构与具体改动文件报备）。

---

## 阶段 1 环境搭建（✅ 已完成）

### ✅ 已完成
- 核实 dsh 官方仓库、技术栈、安装要求与插件架构（官方来源交叉验证，见 ADL-001）。
- 本机只读环境摸底：macOS 15.6.1 arm64、git 2.39.5；原仅 Doubao 自带 Node、无 pnpm/Homebrew。
- 经项目所有者确认 4 项关键决策：目录、独立仓库策略、nvm 安装方式、第一阶段接远程。
- 安装 nvm + Node v22.23.3 + corepack/pnpm 11.28.5，配置 `~/.zshrc`（见 ISS-001/ISS-004）。
- 创建工作区 `~/Projects/dsh-pm/`；浅克隆上游 dsh **v0.2.1-alpha.2**（基线哈希 `d743267388641bc76f17c45ce8b4c231aed1d32c`，分支 master）。
- `pnpm install` 成功（354 个工作区项目，约 1m17s，原生模块正常）。
- `pnpm run build` 成功（原生 addon + host + 357 个 client 产物，退出码 0）。
- 运行验证通过：`pnpm dsh web` 在 http://127.0.0.1:3080 启动，带令牌认证后根路径 HTTP 200、页面 `DSH Local Build` 正常返回；验证后已关闭服务。
- 初始化本产品独立 git 仓库 `pm-tool`（默认分支 main），建立完整标准档案（README/docs/skills/packages）。
- 生成 GitHub SSH 密钥并由项目所有者添加到账户 iceAcmen，`ssh -T git@github.com` 认证通过。
- 配置仓库级提交身份 Ice \<835687152@qq.com\>（未改全局）；首次提交 `12bcad3` 并推送 main 到 `git@github.com:iceAcmen/pm-tool.git`，跟踪 origin/main。

## 后续阶段（未开始）
- 阶段 3 源码开发：先验证「第三方 Web 界面形态」与「独立仓库插件包被本地 profile 装载」两个技术点，再按定稿需求新增自研 PM 插件包（MVP：项目计划 / WBS / 里程碑 / 持久化导出 + Web 界面 + 离线命令）。
- 阶段 4 测试交付：本地运行验证、现场演示、版本迭代与发布。
