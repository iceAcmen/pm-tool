# 版本更新记录 changelog.md

> 本文件按时间倒序记录「每次改动动了哪些文件、新增/修改了什么、为什么」；给维护者与迁移者使用，配合 git 提交历史一起阅读。格式参考 Keep a Changelog，版本号在阶段 3 产出可用功能后启用语义化版本。

日期格式：YYYY-MM-DD。类型：新增 / 变更 / 修复 / 环境 / 文档。

---

## [未发布] — 阶段 1 环境搭建（2026-10-10）

### 环境
- 新增：安装 nvm（`~/.nvm`）、Node.js v22.23.3、npm 10.9.9；通过 corepack 启用 pnpm 11.28.5；向 `~/.zshrc` 追加 nvm 初始化。
- 新增：在 `~/Projects/dsh-pm/deepseek-harness` 浅克隆（depth=1，分支 master）dsh 上游源码，基线版本 v0.2.1-alpha.2（提交 `d743267388641bc76f17c45ce8b4c231aed1d32c`）。
- 完成：上游依赖 `pnpm install`（354 个工作区项目，约 1m17s，原生模块 postinstall 正常，退出码 0）。
- 完成：`pnpm run build`（原生 addon + host + 357 个 client 产物，退出码 0）。
- 完成：运行验证 `pnpm dsh web --no-open`，http://127.0.0.1:3080 启动；带一次性令牌认证后根路径 HTTP 200，页面标题 `DSH Local Build`、含 `id="root"` 与 `/assets/index-*.js`；验证后已关闭服务。
- 新增：生成 GitHub SSH ed25519 密钥；配置仓库级提交身份 Ice \<835687152@qq.com\>（不改全局）；配置远程 `git@github.com:iceAcmen/pm-tool.git`。

### 文档（本仓库 pm-tool）
- 新增：`README.md`（项目总入口、目录结构、环境依赖与启动方式）。
- 新增：`.gitignore`（忽略依赖、构建产物、密钥与系统文件）。
- 新增：`docs/requirements.md`（功能模块清单 / 优先级 / 验收标准，阶段 1 草稿）。
- 新增：`docs/decision-log.md`（ADL-001 ~ ADL-006 技术决策）。
- 新增：`docs/changelog.md`（本文件）。
- 新增：`docs/progress.md`（阶段进度流水）。
- 新增：`docs/issues-and-solutions.md`（踩坑与解决方案）。
- 新增：`docs/handoff.md`（最小迁移交接清单）。
- 新增：`skills/README.md`（Skill 沉淀目录说明）。
- 新增：`packages/.gitkeep`（占位，保留自研插件目录）。

### 原因
- 落实「从第一天起建立独立、通用、可迁移的标准 Markdown + git 成果档案」要求，档案与环境搭建同步建立。

### 尚未完成 / 已知限制
- 远程推送尚未完成：等待项目所有者把 SSH 公钥添加到 GitHub（`ssh -T git@github.com` 当前为 Permission denied），生效后首次提交并推送 main。
- dsh 处于开发者预览期（v0.2.1-alpha.2），后续升级可能有破坏性变更，已记录基线以便复现。
- 上游为浅克隆（depth=1），如需完整历史需 `git fetch --unshallow`。
- 尚未产生任何自研插件代码（属阶段 3）。
