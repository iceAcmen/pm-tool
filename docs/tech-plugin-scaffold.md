# 插件骨架与装载技术方案 tech-plugin-scaffold.md

> 本文件记录第三阶段「第一个插件长什么样、放在哪、怎么被本地 dsh 装载运行」的实施方案与开工前报备；给项目所有者评审、给开发阶段照做。结论来自上游官方仓库 v0.2.1-alpha.2 的**源码级**核对（cookbook、apps/cli 源码、storage 三件套、command-goal、ui-schedule 等真实文件），并标注置信度。
>
> 同名飞书排版版（含 16 个完整代码块，仅便于阅读，**迁移以本 Markdown 为准**）：<https://bytedance.larkoffice.com/docx/Mqp0dssV1oOIcrxJkWfchAk7nKe>

- 文档状态：阶段 3 开工前报备稿（2026-10-10），待项目所有者确认后据以创建文件
- 置信度：**【官方明确】** 源码/README 直接可证；**【推断】** 据源码合理推断；**【待验证】** 需在「打通验证」中实测确认

## 一、实施策略：先打通"最小插件"，再做功能

dsh 处于开发者预览期，外部独立插件的**装载链路**是最大不确定点。因此阶段 3 不直接写业务功能，而是分两步：

- **第 0 步（打通验证，本报备请求授权的范围）**：在独立仓库建一个**最小插件**，只做一件可感知的事——在 dsh Web 里输入 `/pm ping` 返回一句中文，并在配置树里能看到它、确认存储后端能初始化。目标是**端到端跑通"独立仓库插件 → 被本地 dsh 装载 → Web 可见可用"**，顺带把所有【待验证】项变成确定结论。
- **第 1 步起（第 0 步成功后另行报备）**：在同一插件内逐步实现 MVP 业务（项目 / WBS / 里程碑 / 持久化导出 / Web 界面）。

这样能最快看到"我们的插件真的跑在 dsh 里"，避免在不确定装载方式时写一堆功能却跑不起来。

## 二、包形态：先做单一插件包

- 官方建议「单一用途的插件保持为一个包」。MVP 先建**一个**自包含插件包，Host 侧（存储 + 命令）先行，Web 浏览器半侧作为同一包的 `./client` 导出后续加入；确有必要再拆包。
- 位置：`pm-tool/packages/dsh-pm-tool/`
- 包名（npm/Cordis）：`dsh-pm-tool`（本地 `link:` 装载，无需发布、无需 npm scope）；版本 `0.1.0`；界面显示名「项目管理工作台」。
- 上游 `deepseek-harness/` **全程只读**，所有代码只落在 pm-tool 仓库。

## 三、第 0 步将创建的文件（最小打通版）

```
pm-tool/packages/dsh-pm-tool/
├── package.json        # 插件清单：name/version/type/exports、cordis 与 dsh 对等依赖、dsh.bundle 声明、build 脚本
├── tsconfig.json       # 独立编译配置（不能 extends monorepo 的 tsconfig.base，需自建最小版）
├── cordis.patch.yml    # 激活本插件所需的配置：挂载 storage/storage-json(root)/storage-domain 与本插件
├── src/
│   └── index.ts        # 插件入口：name/inject/apply；注册一个离线命令 /pm ping；启动时打印一次自检日志
├── locale/
│   ├── en.json         # meta.title / meta.description（英文回退）
│   └── zh.json         # 中文标题/描述
└── README.md           # 这个插件做什么、如何构建与装载（自解释）
```

每个文件的作用与关键写法（官方范本）：

- **src/index.ts**：Cordis 插件导出 `name` / `inject` / `apply(ctx, config)`。离线命令用 `ctx.commands.register({ definitionId, name, description, input:{hint}, handler })`，handler 返回 `{ kind:'success'|'error', text }`，**不经模型**。范本：上游 `packages/goal/command-goal/src/index.ts`【官方明确】。
- **package.json**：`"type":"module"`、`"main":"lib/index.js"`、`types`/`exports`；`@deepseek-ai/cordis` 同时在 peerDependencies/devDependencies；用到的 dsh 包（如 `@deepseek-ai/dsh-commands`、存储三件套）同样在 peer + dev 镜像；声明 `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }` 以便装入后**自动激活**【官方明确，见 `packages/bundle/base/package.json` 与 app-boot/profile-plugins.ts】。
- **tsconfig.json**：独立仓库无法引用 monorepo 的 `tsconfig.base.json` 与 `vendor/*` references，需自建最小 NodeNext/ESM 配置，源码相对导入带 `.ts` 后缀【推断 + 待验证】。
- **cordis.patch.yml**：用 `- insert: - id:..., name:'包名', config:{...}` 形式挂载存储三件套与本插件；存储 root 指向 `pm-tool/data`。范本：上游 `config/examples/*/*.cordis.yml`【官方明确】。
- **locale/*.json**：`{ "meta": { "title": "...", "description": "..." } }`，并在 package.json 的 `exports`/`files` 暴露【官方明确】。

> 构建产物 `lib/` 不入库（加入本包 `.gitignore` 或仓库根忽略）。链接方式装载的包，**改代码后需重新 build 并重启 dsh**【官方明确】。

## 四、业务数据怎么存（第 1 步用到，此处先定 API）

- 高层服务是 **`ctx.storageDomain`**（注意不是 `ctx.storage.domain`）【官方明确，源码模块声明合并】。
- 定义领域：`defineDomain({ name, version, layout:'single'|'per-record', tables: { <表>: domainTable(zodSchema) } })`；记录结构校验用 **zod**（不是 schemastery）。
- 使用：`const domain = await ctx.storageDomain.open(spec)`；`domain.table('tasks').put(id, value)` / `.get(id)`（同步、内存）/ `.update(id, fn)` / `.delete(id)`；用完 `domain.close()`。范本：`packages/storage/storage-domain/README.zh.md` 与 `src/spec.ts`【官方明确】。
- 后端：`@deepseek-ai/dsh-storage-json`，配置仅一个必填 `root`；`single`=每单元一份美化 JSON，`per-record`=每条记录一文件（`<root>/<unit>/<table>/<key>.json`，原子写、目录 `0o700`、键名 `[a-zA-Z0-9_-]+`）。**MVP 选 per-record**（任务/里程碑逐条增删，定点写、不整文件重写）。
- 最小挂载组合（写进 cordis.patch.yml）：

  ```yaml
  - name: '@deepseek-ai/dsh-storage'
  - name: '@deepseek-ai/dsh-storage-json'
    config:
      root: /Users/bytedance/Projects/dsh-pm/pm-tool/data
  - name: '@deepseek-ai/dsh-storage-domain'
    config:
      backend: json
  ```

- Markdown 概览/报告由 JSON 渲染导出（JSON 为数据真源，Markdown 为可读视图）。

## 五、装载与运行（macOS、上游源码运行；六步）

> 以下为据官方源码与 plugin-manager README 整理的步骤；个别参数格式在第 0 步实测确认（见第七节）。

```sh
# 0) 进入上游源码目录（dsh 从源码运行）
cd ~/Projects/dsh-pm/deepseek-harness
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null

# 1) 先构建我们的插件（链接包需先 build）
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool && pnpm install && pnpm run build

# 2) 基于 web 模板派生一个专属 profile（名：pm）
cd ~/Projects/dsh-pm/deepseek-harness
pnpm dsh --profile pm --from-default-profile web   # 首次会生成 profile 后启动；启动后可 Ctrl-C 退出

# 3) 把独立仓库插件以 link 方式装入该 profile（官方源码 checkout 自用 link:<绝对目录>）
pnpm dsh plugin --profile pm add link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool

# 4) 不启动、检查组合后的配置树，确认存储三件套与本插件都在
pnpm dsh --profile pm --dump-config

# 5) 启动 Web 并在浏览器用终端打印的带 token 的 URL 打开
pnpm dsh web --profile pm
# 6) 在对话里输入：/pm ping   —— 期望返回一句中文；即打通成功
```

- `file:` / `link:` 本地路径官方明确支持，按 profile 目录解析为绝对路径、`~` 会展开；源码运行官方自用 `link:`【官方明确，plugin-manager README】。
- 「装上 ≠ 激活」：声明 `dsh.bundle.patch` 的包装入后自动加入 bundles 激活；普通包需手动在 profile 的 `cordis.patch.yml` 加 insert 条目。我们采用前者减少手工步骤【官方明确，app-boot/profile-plugins.ts】。
- profile 目录（`$DSH_HOME/profiles/pm/`）含 `package.json`（树外插件依赖）、`dsh.profile`（bundles 列表）、`cordis.patch.yml`（用户 patch 层）；配置叠加顺序：bundles → profile patch → home patch → `--patch`【官方明确，apps/cli/README.zh.md】。

## 六、影响范围与安全边界（报备）

- **新增**：仅在 `pm-tool/packages/dsh-pm-tool/` 内新增上述文件；在 `pm-tool/data/`（运行时才生成，已 gitignore）写演示数据。
- **不修改**：上游 `deepseek-harness/` 任何文件；dsh 的 profile 目录由 dsh 命令自行管理（第 2/3 步是 dsh 官方支持的装载操作，不手改系统全局配置）。
- **不入库**：`lib/` 构建产物、`data/` 业务数据、任何密钥；`.env`/Key 不写入仓库。
- **可回滚**：第 0 步仅新增一个独立目录，删除该目录并在 profile 中移除插件即可完全回退（删除动作会另行征求同意）。

## 七、第 0 步需实测确认的【待验证】项（只读/构建级，不写业务功能）

1. 独立包 `tsconfig`/构建方式：`tsc` 单独构建是否足够，还是需复刻 dsh 的 clientBundle 构建（仅 Web 半侧需要；纯 Host 命令预计 tsc 即可）。
2. `link:` 后对等依赖（`@deepseek-ai/cordis`、dsh-* 包）从源码 checkout 解析是否正常；若报版本不兼容，按官方 `allow-version` 流程处理并记录。
3. `dsh plugin add` 对 `link:<绝对路径>` 的确切参数形式（必要时用 `pnpm` 等价写法在 profile 目录安装）。
4. `dsh.bundle.patch` 自动激活是否让本插件与存储三件套一并生效（否则手动补 cordis.patch.yml）。
5. `--dump-config` 中能看到本插件与 storage-json 的 root 配置。
6. `/pm ping` 在 Web 中无 API Key 条件下是否可用（验证离线命令路径）。
7. Web 第三方**独立顶级页面**可行性（无官方第三方示例；内置先例 `packages/client/ui-schedule`）。MVP 先采用官方稳妥的「插件详情区块/设置卡片」，独立页面在业务功能阶段再验证。

> 上述每项的实测结果都会回填本文件并记入 `docs/issues-and-solutions.md` / `docs/decision-log.md`。

## 八、第 0 步验收标准（可演示）

1. `pnpm dsh --profile pm --dump-config` 输出中能看到 `dsh-pm-tool` 与存储三件套、root 指向 `pm-tool/data`。
2. `pnpm dsh web --profile pm` 启动后，带 token URL 打开页面，输入 `/pm ping` 返回约定中文，且**全程未配置 API Key**。
3. 触发一次存储自检后，`pm-tool/data/` 下出现人能直接阅读的 JSON 文件（权限 `0o700`）。
4. 以上有命令输出/截图作为验证证据；改动仅限本方案所列新增文件。

## 九、主要来源（上游只读路径 / URL）

- `docs/cookbook/adding-a-package.zh.md`、`adding-a-tool.zh.md`、`adding-a-settings-card.zh.md`、`extension-cookbook.zh.md`
- `apps/cli/README.zh.md`、`apps/cli/src/plugin.ts`、`app-boot/src/profile-plugins.ts`、`packages/boot/plugin-manager/README.zh.md`
- `packages/storage/storage-domain/README.zh.md` 与 `src/spec.ts`、`packages/storage/storage-json/README.zh.md`
- `packages/goal/command-goal/src/index.ts`（离线命令范本）、`packages/client/ui-schedule/package.json` 与 `src/index.ts`（Web 半侧范本）
- 在线：<https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/cookbook>
