# 工作进度流水账 progress.md

> 本文件记录项目「每个阶段已完成、进行中、待办」的最新状态；给维护者与迁移者快速判断进度使用。每次有进展即更新，最新内容置顶。

最后更新：2026-10-10（doubao-work 独立复核通过、推送并固化五项开发决策）

## 当前阶段：阶段 3 进行中；首个业务增量已通过独立复核并推送，下一批待 trae 报备（2026-10-10）

- **独立复核结论（doubao-work）**：trae 首批「项目新增 / 列表 / 详情」**质量合格、建议验收通过**。构建与三个 verify 脚本全部退出码 0（含约 20 类非法输入不落盘、10 并发不覆盖、写盘失败恢复、全新子进程重启读回与编号续增）；真实 dsh Web 宿主启动确认加载插件；核验真实浏览器写出的 `data/pmtool/projects/p-0001.json`、`p-0002.json`（目录 0700、文件 0600、符合 schema）；全新真实进程经同一命令处理器读回成功、无 Key 可用。
- **已推送**：所有者授权后，trae 的 3 个本地提交（`b2ca50f`、`0128203`、`9dbb3f9`）已推送 origin/main（`f9bda6e..9dbb3f9`），`origin/main` HEAD = **9dbb3f9**，本地与远程一致。
- **已固化决策（ADL-012/013/014）**：① 删除用 `/pm project delete <id> confirm` 关键字二次确认；② 新增/更新校验 `targetDate>=startDate`；③ 同名项目默认阻止、末尾加 `confirm` 才放行（此解释待所有者最终认可）；④ R5 排在 R2/R3/R4 之后，顶级页面 spike 不可行则降级为「卡片/区块 + 离线命令」；⑤ Node 标准口径维持 nvm v22.23.3（沙箱 v22.23.2 为遮蔽现象，KB-015）。
- **进行中**：R1（增查已完成并复核；编辑/删除 confirm、日期与同名校验待办，界面待办）、R4（项目持久化已完成，完整导出待办）、R6（项目增查已完成，其余命令待办）。
- **待办（建议顺序，每批先报备文件清单）**：第 1 步 R1 收尾（update/delete + confirm + 日期/同名校验）→ R2 WBS 任务树 → R3 里程碑 → R4 Markdown/JSON 导出 → 最后 R5 Web（先卡片/区块、后顶级页面 spike）。里程碑到期提醒 R11 维持第一版不做。
- **验证边界（如实记录）**：豆包工作当前角色无 Mac 本机 GUI 自动化权限、隔离浏览器被 dsh browser-trust 围栏 503 拦截（安全设计），故"本机浏览器点击"由 trae 已执行、豆包以落盘产物 + 全新进程读回 + 确定性脚本独立佐证；详见 KB-014 / ISS-010。测试服务已停止，产品仓库与上游无意外改动。

### 🧭 跨平台协作基座（2026-10-10 新增，已就绪）
- 根 `AGENTS.md`（任何 AI/IDE 接手先读）、`docs/collaboration.md`（多方同步规则 + 平台标识）、`docs/knowledge-base.md`（KB-001～010 已验证知识）、`docs/handover-archive-doubao.md`（豆包阶段完整存档）。
- 约定：仓库即唯一事实来源；任何平台开工前先 pull + 扫描 `docs/` 最新档案，改动后在 `changelog.md` 标注平台标识并同步需求/决策/踩坑/知识；禁 force push。
- 接手平台不局限于 TRAE：新平台首次接入按 `docs/collaboration.md` 第八节自检并登记平台标识。

### ✅ 阶段 3 第 0 步已完成（最小插件端到端打通）
- 在独立仓库新建最小插件包 `packages/dsh-pm-tool/`（`/pm` 离线命令 + 存储领域 `pmtool`），`pnpm install` 与 `tsc` 构建一次通过。
- 基于 web 模板派生专属 profile `pm`，以 `link:` 绝对路径装入插件并自动激活；`--dump-config` 可见插件与存储三件套。
- profile 补丁把 storage-json 的 `root` 覆盖到产品目录 `pm-tool/data`（已 gitignore）；启动日志打印 `[pm-tool] 存储领域 pmtool 已打开`，宿主自身数据也写入该目录。
- Web 斜杠命令目录列出 `pm`，无 API Key 执行 `/pm ping` 返回中文 pong（有截图）。
- 两个确定性脚本（`scripts/verify-storage.mjs`、`scripts/verify-command.mjs`）直接运行已构建插件的真实代码：selftest 写入并读回 `pm-tool/data/pmtool/checks/selftest.json`（人类可读、目录 0700）。
- 实测发现并修复真实 bug：`table.put()` 异步写盘漏 `await`（处理器改为 async）。
- 已提交（`9e5d539`）并经项目所有者**验收通过、推送 origin/main**；随后补 `41b9db5` 说明验收/推送与移交。
- **后续阶段 3 业务编码与阶段 4 测试移交 TRAE 或其他 IDE/Agent 执行，本侧暂停**；接手导引见根 `AGENTS.md` 与 `docs/handoff.md` 第 0 节。

### 🔄 阶段 3 业务功能（第 1 步起，进行中，由 trae 接续）
- 按需求 **v0.4** 实现 MVP：项目计划 R1 / WBS R2 / 里程碑 R3 / 持久化与 Markdown 导出 R4 / Web 界面 R5 / 离线命令 R6。
- **落盘布局已定稿（ADL-011）**：单领域 `pmtool` 三张业务表 per-record、不建 index.json；本批已实现 projects，tasks/milestones 按后续批次加入，checks 保留。首批文件清单已获所有者确认并完成实现。
- 仍待业务阶段验证：第三方独立顶级 Web 页面与外部包浏览器构建（第 0 步只做了 Host 侧，R5 未打通；建议 R5 排在 R1/R2/R3/R6 之后并先做设置卡片/区块、再做顶级页面 spike）。

---

## 阶段 2 需求分析（✅ 已定稿 v0.3 并获确认、已推送）

### ✅ 已完成
- 完成 dsh 能力可行性调研（本地官方源码 + 官方 cookbook/包 README 双路印证），沉淀 `docs/feasibility-map.md`。
- 经项目所有者交互确认四项关键决策（见 ADL-007）：离线优先混合模型、人类可读 JSON+Markdown 存储、先做 dsh Web 界面、最小闭环 MVP。
- 确定 MVP 技术架构（见 ADL-008）：`storage-domain` + `storage-json` 落盘、用户命令（离线）/模型工具（在线）双入口、独立插件包 + 专属 profile。
- 产出需求评审稿 v0.3：R1–R12 模块与可测试验收标准、Project/Task/Milestone 数据模型、数据落盘目录约定与业务规则、非功能需求。
- 项目所有者确认三项补充决策（ADL-009）：`data/` 暂不入库（已写入 `.gitignore`）、里程碑到期提醒暂缓（R11→P2）、生成型能力一期仅预留接口不实现。
- 需求 v0.3 经项目所有者确认定稿；`docs/handoff.md` 已刷新；阶段 2 文档提交并推送 GitHub。

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

## 后续任务
- 阶段 3 源码开发：在已完成的项目增查上接续 R2/R3/R4，补齐项目编辑与其余离线命令；R5 最后处理，浏览器半侧须实测。
- 阶段 4 测试交付：本地运行验证、现场演示、版本迭代与发布。
