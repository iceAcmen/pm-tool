# 技术知识库 knowledge-base.md

> **本文件记录什么 / 给谁 / 怎么用**：本文件沉淀本项目在 dsh 二次开发中**经实测验证的架构认知、真实 API 用法、有效模式、编码约定与经验结论**；给所有平台的开发者复用，避免重复踩坑、重复试错。踩坑的「现象/根因/解法」放在 `docs/issues-and-solutions.md`（ISS），本文件偏「正确做法与可复制模式」（KB）。每条注明沉淀平台、时间、适用场景与来源；未证实的标【待确认】，不臆造 API。

上游基线：dsh **v0.2.1-alpha.2**（master，只读克隆于 `~/Projects/dsh-pm/deepseek-harness`）。运行环境：macOS + nvm Node v22.23.3 + pnpm 11.28.5。

---

## KB-001 ｜ 纯 Host 侧外部插件用包内 `tsc` 独立构建即可（沉淀：doubao-work，2026-10-10）

- **结论**：只注册命令/存储/后台逻辑（不做浏览器界面）的 dsh 插件，在独立仓库用一份最小 `tsconfig.json`（`module/moduleResolution: NodeNext`、ESM、`rootDir src`、`outDir lib`、`declarationDir lib/types`、`strict`、`skipLibCheck`、`types: ["node"]`）跑 `tsc` 即可产出可加载的 `lib/`，**无需**复刻 dsh monorepo 的 `tsconfig.base.json`/references，也无需 clientBundle。
- **适用场景**：阶段 3 的 pm-core / pm-commands 等 Host 侧包。
- **可复现实例**：见 `packages/dsh-pm-tool/tsconfig.json` 与 `package.json` 的 `"build": "tsc -p tsconfig.json"`；`pnpm run build` 零报错。
- **注意**：只有做 **Web 浏览器半侧**（设置卡片/页面）时才需要 clientBundle 构建（见 KB-010）。
- **来源**：实测通过；参照上游 `docs/cookbook/adding-a-package.zh.md`。

## KB-002 ｜ storage-domain 真实 API 与「put 异步 / get 同步」（沉淀：doubao-work，2026-10-10）

- **结论**（已在发货插件与验证脚本中跑通）：
  ```ts
  import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
  import type { ZodType } from 'zod'

  const spec = defineDomain({
    name: 'pmtool',                 // 单元名需匹配 [a-zA-Z0-9_-]+
    version: 1,
    layout: 'per-record',           // 每记录一个 JSON 文件；'single' 为每单元一个整文件
    tables: { checks: domainTable(recordSchema) }, // 记录 schema 用 zod，不是 schemastery
  })
  const domain = await ctx.storageDomain.open(spec)
  const table = domain.table('checks')
  await table.put('selftest', value)   // ★put 是异步写盘，必须 await
  const back = table.get('selftest')   // get 同步读内存
  table.update(id, (r) => ({ ...r }))  // 另有 delete(id)、domain.close()
  ```
- **落盘布局（per-record + storage-json）**：`<root>/<unit>/<table>/<key>.json`，文件内容 `{ "version": n, "record": <值> }`，目录权限 `0o700`、原子写；记录键限 `[a-zA-Z0-9_-]+`。
- **适用场景**：所有业务实体（Project/Task/Milestone/Risk…）的持久化，统一走 storage-domain。
- **避坑**：漏 `await put` 会读不到、文件不落地（见 ISS-005）；storage-domain 无跨表事务/二级索引/数据迁移，建模时注意。
- **来源**：上游 `packages/storage/storage-domain/src/spec.ts`、`README.zh.md`；本项目 `packages/dsh-pm-tool/src/index.ts`。

## KB-003 ｜ 存储三件套最小配置与 root 覆盖（沉淀：doubao-work，2026-10-10）

- **结论**：最小可用组合 = `dsh-storage` + `dsh-storage-json`（必填 config `root`）+ `dsh-storage-domain`（config `{ backend: 'json', routes?: {} }`，backend 是默认后端名，routes 按领域覆盖）。web/base 组合包已默认挂载这三件套。
- **把数据根目录指到产品目录**：编辑专属 profile 的用户补丁 `~/.dsh/profiles/pm/cordis.patch.yml`，按 **id** 覆盖：
  ```yaml
  - id: storage-json
    name: '@deepseek-ai/dsh-storage-json'
    config:
      root: /Users/bytedance/Projects/dsh-pm/pm-tool/data
  ```
  用 `pnpm dsh --profile pm --dump-config` 确认 root 生效（storage-domain 默认 backend 已是 json，无需改）。
- **适用场景**：让业务数据落在产品仓库 `pm-tool/data`（已 gitignore），而非 dsh 默认的 `~/.dsh/storages`。
- **来源**：上游 `packages/storage/storage/README.zh.md`、`storage-json/README.zh.md`；本项目实测（宿主自身的 workspace/会话缓存也随之写入该 root）。

## KB-004 ｜ 离线斜杠命令 `ctx.commands.register` 写法（沉淀：doubao-work，2026-10-10）

- **结论**（对照上游 command-goal 真实源码）：
  ```ts
  export const name = 'pm-tool'
  export const inject = ['commands', 'storageDomain']
  export async function apply(ctx: Context) {
    ctx.commands.register({
      definitionId: CommandDefinitionId('dsh-pm-tool'),
      name: 'pm',                              // 调用时为 /pm
      description: '项目管理工作台：/pm ping、/pm selftest',
      input: { hint: '[ping|selftest]', attachments: false },
      handler: async (invocation): Promise<CommandResult> => {
        const sub = invocation.rawInput.trim().toLowerCase()
        // …返回 { kind: 'success' | 'error', text: '中文输出' }
      },
    })
  }
  ```
- **关键认知**：用户命令**不经过模型、不消耗模型轮次**（官方命令类型注明事件 "log-only, no turn wraps them"），因此无 API Key 也能执行结构化 CRUD——这是「离线优先」的主入口；需要模型的智能能力才用 `ctx.tools.register(defineTool(...))`。
- **适用场景**：R6 离线命令、以及所有无 Key 也要可用的增查改操作。
- **来源**：上游 `packages/goal/command-goal/src/index.ts`、`packages/interaction/commands/src/types.ts`；本项目 `src/index.ts`。

## KB-005 ｜ 独立仓库插件以 `link:` 外挂到专属 profile，bundle 声明即自动激活（沉淀：doubao-work，2026-10-10）

- **结论**（在上游目录执行）：
  ```sh
  # 首次：由 web 模板派生 profile（会启动，Ctrl-C 即可）
  pnpm dsh --profile pm --from-default-profile web
  # 以绝对路径 link 装入独立仓库插件
  pnpm dsh plugin --profile pm add link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
  ```
  插件包 `package.json` 声明 `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }` 后，安装即**自动激活**（无需手动 insert）；包内 `cordis.patch.yml` 写 `- insert: - id: pm-tool, name: 'dsh-pm-tool'`。
- **CLI 参数顺序坑**：`--profile` 必须在 app 动词位置；指定 profile 后**不再写 app 动词**——日常启动是 `pnpm dsh --profile pm --no-open`（写 `web --profile pm` 报 "select a profile only once"，写 `--profile pm web` 报 "too many arguments"）。见 ISS-007。
- **link peer 警告**：pnpm 提示链接包不从目标目录解析 peer；对本插件实测无副作用（服务靠 `ctx` 注入、cordis 仅 `import type`、zod schema 为普通对象），见 ISS-008。发布期可改 `file:` 或发 npm 包。
- **改代码生效方式**：包目录 `pnpm run build` → 重启 dsh（link 不热更新）。
- **来源**：上游 `packages/boot/plugin-manager/README.zh.md`、`packages/boot/app-boot/src/profile-plugins.ts`、`apps/cli/README.zh.md`。

## KB-006 ｜ profile 目录结构与配置叠加顺序（沉淀：doubao-work，2026-10-10）

- **结论**：`~/.dsh/profiles/<name>/` 含 `package.json`（记录树外插件依赖 + `dsh.profile.bundles` 列表）、`pnpm-workspace.yaml`、自动生成的 `cordis.yml`、用户补丁 `cordis.patch.yml`。配置叠加顺序：各 bundle 的 patch → profile 自身 `cordis.patch.yml` → home 级 `~/.dsh/cordis.patch.yml` → `--patch` 覆盖层。
- pm profile 由 web 模板派生，bundles 为 `@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-web-app`（已含 dsh-commands 与存储三件套）。
- **适用场景**：调整插件启停、存储 root、任何本地配置；优先改 profile 补丁层，不动全局。
- **来源**：上游 `apps/cli/README.zh.md`、`apps/cli/src/profile-boot.ts`。

## KB-007 ｜ 脱离宿主做确定性验证：裸 Cordis 手动挂载存储（沉淀：doubao-work，2026-10-10）

- **结论**：回归测试不要依赖手点 Web（富文本输入对自动化不稳定，见 KB-008）。在独立 `.mjs` 脚本里用真实包装配：
  ```js
  import { Context } from '@deepseek-ai/cordis'
  import Storage from '@deepseek-ai/dsh-storage'
  import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
  import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'

  const ctx = new Context()
  await ctx.plugin(Storage)
  const backend = new JsonStorageBackend(root)
  ctx.storage.backend.register('json', backend)              // 裸上下文不触发 effect，需手动注册
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.provide('storageDomain', facility)
  // 再 import 已构建的 ../lib/index.js，await pm.apply(ctx)，直接调用捕获到的 handler
  ```
  命令分发可用仅捕获注册项的轻量桩 `{ register(def){ captured = def; return ()=>{} } }`，经 `ctx.provide('commands', stub)` 注入，再直接 `await captured.handler({ rawInput: 'selftest', attachments: [] })`——这会运行**发货插件本体**的 apply 与处理器。
- **适用场景**：所有不依赖会话/模型的插件逻辑回归；脚本退出码随结果而定，可进 CI。
- **避坑**：裸 `new Context()` 不执行插件 `apply` 内的 `ctx.effect`（storage-json 靠 effect 注册后端），必须手动 register/mount（见 ISS-006）。
- **来源**：本项目 `packages/dsh-pm-tool/scripts/verify-storage.mjs`、`verify-command.mjs`；写法对照上游 `packages/storage/storage-domain/tests/domain.spec.ts`。

## KB-008 ｜ Web 斜杠命令的界面形态与自动化边界（沉淀：doubao-work，2026-10-10）

- **结论**：dsh Web 输入框是 contenteditable 富文本 + 命令 chip；输入 `/` 弹出的选项元素 id 形如 `dsh-slash-option-command-N`（第 0 步 pm 为 N=8）。每个新会话可能弹「输入 API 密钥」框，点**稍后配置**即可离线继续；另有「继续」引导遮罩需先关闭。
- **自动化边界**：合成点击/逐字输入命令 chip 的**参数段不稳定**，偶发把参数拆成同级普通文本从而触发模型轮次（无 Key 报 MISSING_CREDENTIAL）；这是自动化限制而非产品缺陷——**真人正常整行键入 `/pm selftest` 会正确分词执行**。自动化回归请走 KB-007 的确定性脚本。
- **适用场景**：Web 演示与端到端验证时设置预期；不要把 chip 输入 flaky 误判为插件 bug。
- **来源**：本项目第 0 步实测；上游 `packages/interaction/commands/src/index.ts`（命令不触发模型）。

## KB-009 ｜ 锁版本取包：alpha 版本必须显式指定（沉淀：doubao-work，2026-10-10）

- **结论**：dsh 各独立包的 `latest/next` dist-tag 是较旧的 `0.2.0-rc.2`，本项目基线 `0.2.1-alpha.2` 在 `alpha` dist-tag 上；安装/查询时必须**显式写版本**（`npm view @deepseek-ai/dsh-storage-domain@0.2.1-alpha.2`），否则会拿到旧版。peer 依赖：`@deepseek-ai/cordis: ~4.0.5-alpha.1`，dsh 系包 `0.2.1-alpha.2`。
- pnpm 11 供应链策略可能拦截 alpha 包；本插件包用 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 白名单收录所需 alpha 包，保证可复现安装（已随包提交）。
- **适用场景**：新增任何 dsh 系列依赖、升级基线版本时。
- **来源**：npm registry 实测；本项目 `packages/dsh-pm-tool/{package.json,pnpm-workspace.yaml}`。

## KB-010 ｜ Web 浏览器半侧（设置卡片/页面）怎么做、什么仍待验证（沉淀：doubao-work，2026-10-10）

- **结论**：
  - 浏览器半侧包在 `package.json` 声明 `"dsh": { "client": { "inject": [...], "platform": "web" } }`，并导出 `"./client"`（默认 `./lib/client.js`，须为 lazy-CJS factory）；内置先例 `packages/client/ui-schedule`（node 半侧 `src/index.ts` 是空 `apply(){}`，行为全在 `src/client/`）。
  - 设置卡片用 Config schema（schemastery `z.object`，敏感字段 `.volatile()`/`role('secret')`）配合 `form.state` / `form.mutate`；向他人插件详情页贡献区块用 `ctx.slots.inject('plugins.detail.actions'|'badge'|'section', ...)`。
  - **clientBundle 的 tsdown preset 不在发布的 npm 包内**，仓库外的包要自己复刻这一步构建（cookbook 原话）。
- **【待确认】**：第三方插件新增**独立顶级路由/页面**的接入方式，官方无第三方示例；最接近先例是 ui-schedule 的侧边栏页面。做 R5 时先做官方明确支持的「设置卡片/插件详情区块」，再实测独立页面。
- **来源**：上游 `docs/cookbook/adding-a-settings-card.zh.md`、`extension-cookbook.zh.md`、`packages/client/ui-schedule/{package.json,src/index.ts}`。

## KB-011 ｜ 业务实体布局：单领域分表 + 表枚举，无需自建索引（沉淀：doubao-work，2026-10-10；决策 ADL-011）

- **结论**：
  - 表支持**同步枚举**：`[...table.keys()]` 列出全部键、`[...table.entries()]` 列出 `[键, 值]`（上游 `storage-domain/src/domain.ts`，`DomainTable` 暴露 `keys()`/`entries()` 迭代器）。因此「项目列表」「某项目下任务/里程碑」直接遍历表按 `projectId` 过滤即可，**不要手工维护 index.json**（双写易不一致）。
  - Project/Task/Milestone 落在单一领域 `pmtool` 的三张表（per-record）：
    - 表 `projects`，键 `projectId` → `data/pmtool/projects/<projectId>.json`
    - 表 `tasks`，键 `taskId`（记录含 `projectId`/`parentId`/同级顺序/WBS 编号）→ `data/pmtool/tasks/<taskId>.json`
    - 表 `milestones`，键 `milestoneId`（记录含 `projectId`）→ `data/pmtool/milestones/<milestoneId>.json`
  - 键名只能用 `[a-zA-Z0-9_-]+`，建议短 id（`p-0001`/`t-0001`/`m-0001`）；Markdown 概览是 R4 导出产物，不进存储域。
- **适用场景**：R1–R3、R6 的存储层实现与一切「列出/按项目筛选」需求。
- **可复现实例**：
  ```ts
  const allProjects = [...domain.table('projects').entries()]      // [id, project][]
  const tasksOf = (pid: string) =>
    [...domain.table('tasks').entries()]
      .filter(([, t]) => t.projectId === pid)
      .sort((a, b) => a[1].order - b[1].order)
  ```
- **来源**：上游 `packages/storage/storage-domain/src/domain.ts`；本项目 `docs/requirements.md` v0.4 §5.1、ADL-011。

---

## 待补充

> 后续平台在开发中验证的新 API、模式与约定，按 KB-011、KB-012…… 持续追加（模板见 `docs/collaboration.md` 第 5.2 节）；更正既有条目时同步在 changelog 留痕，不要制造相互矛盾的条目。
