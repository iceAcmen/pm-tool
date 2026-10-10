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

> 后续平台在开发中验证的新 API、模式与约定，按现有编号递增追加（模板见 `docs/collaboration.md` 第 5.2 节）；更正既有条目时同步在 changelog 留痕，不要制造相互矛盾的条目。

## KB-012 ｜ 写盘前显式校验，新增编号与写入一起串行化（沉淀：trae / TRAE，2026-10-10）

- **结论**：基线 v0.2.1-alpha.2 的 `DomainFacility.open()` 会校验读盘记录，但 `KvTableImpl.put()` / `update()` 不执行 zod 校验；不能把 TypeScript 类型约束当成运行时输入校验。业务入口必须先 `schema.parse(input)`，再 `await table.put(id, record)`。
- **结论**：`put()` 是插入或覆盖，没有“仅当不存在时新增”接口；其写入队列不包含调用方提前执行的编号分配。短编号的“枚举已有键 → 分配下一编号 → 写入”须在同一领域的业务队列中执行，避免并发新增覆盖记录。失败后队列须可继续执行。
- **适用场景**：项目新增，以及后续任务、里程碑的用户输入与短编号分配。仅保证单宿主进程，不支持多进程共同写同一数据根目录。
- **可复现实例**：上游 `packages/storage/storage-domain/src/domain.ts` 的 `KvTableImpl.put()`、`update()`；`src/index.ts` 的 `DomainFacility.open()`。本包 `src/core/projects.ts` 已落实校验和新增队列；在包目录运行 `pnpm run build && node scripts/verify-projects.mjs`，非法输入无写入、10 次并发新增不覆盖、写入失败后恢复均验证通过（退出码 0）。
- **来源/更正范围**：本次只读核对上游源码；KB-002 中“schema 校验”特指打开领域的读盘边界，不能理解为任意写调用自动校验。

## KB-013 ｜ 逐条记录布局增加表可保留旧自检数据（沉淀：trae / TRAE，2026-10-10）

- **结论**：在 `pmtool` 的 per-record 版本 1 声明中新增 `projects` 表、保留 `checks` 及其 schema，可读取旧 checks 记录；新增表从空表开始。本次不提高数据版本、不迁移旧记录。
- **适用场景**：仅新增表且旧记录格式不变的兼容扩展；不能推广为任意 schema 修改都免迁移。
- **可复现实例**：macOS + nvm Node v22.23.3 + pnpm 11.28.5，在包目录执行 `pnpm run build && node scripts/verify-projects.mjs`。脚本先用只有 checks 的旧声明写入记录，再用新插件打开并验证旧记录；随后在全新 Node 进程读回 13 个项目并新增第 14 个，退出码 0。
- **来源/佐证**：本包 `src/core/storage.ts`、`scripts/verify-projects.mjs` 的真实 JSON 后端实测。项目验证数据使用系统临时目录，真实 `data/` 中仅原有自检记录被自检脚本更新。

## KB-014 ｜ dsh Web 只信任本机 loopback：网络绑定、browser-trust 围栏与真实验证边界（沉淀：doubao-work，2026-10-10）

- **结论**：
  - dsh Web 默认只监听 `127.0.0.1:3080`；`--host` **只接受具体 IP，明确拒绝 `0.0.0.0`（通配地址）**，报错原文大意为"绑定所有接口会把远程代码执行暴露到网络"。
  - 即使 `--host <本机LAN IP> --trusted-host <该IP>` 让端口可达，**非本机浏览器**打开根路径仍被 `/api` **browser-trust 围栏以 HTTP 503 拦截**（带 token 走完 303、用 CDP 注入认证 cookie 后依然 503）；而宿主机 `curl -L` 带 cookie 可得 200。这是框架**有意的防 DNS-rebinding / 远程访问安全控制，不要尝试绕过**。
  - `dsh headless "<任务>"` 是**独立的 shipped profile**（`--profile headless`），不含本项目 pm profile 的插件与存储；要在 headless 里跑 pm 命令需另建 headless 派生 profile 并 link 插件、配存储，且无模型时斜杠命令是否被 headless 直接派发未证实。
  - 聊天/命令在 Web 端走控制器 + WebSocket（前端为 SPA，主 bundle 里没有简单的 REST 发消息路由），不适合用 curl 脚本化。
- **对验证方式的指导（可复用结论）**：
  - **离线功能回归以包内 `scripts/verify-*.mjs` 确定性脚本为准**——它们装载真实 Cordis + 真实 storage-json + 已构建插件的真实命令处理器，覆盖增查/校验/并发/权限/全新进程重启读回，可重复、可进 CI。
  - **"真实浏览器点击"必须在宿主机本机 GUI 的 Chrome 上完成**（打开终端打印的 `127.0.0.1:3080/?token=...` URL）；隔离/远端浏览器、容器内浏览器都到不了或会被围栏拦截。部分 Agent 角色（如 OrganizeAgent）拿不到 Mac 本机 GUI 自动化能力时，应以"确定性脚本 + 真实宿主启动日志加载插件 + 本机浏览器产物落盘核验 + 全新进程读回"作为证据链，并如实标注"本机浏览器点击由具备 GUI 能力的一方执行"，**不得把该工具权限边界误判为产品缺陷，也不得伪造点击结论**。
  - 真实 Web 会话写出的记录是可信旁证：`data/pmtool/projects/*.json`（目录 0700、文件 0600、内容 `{version,record}`）只能由真实运行宿主的命令派发写出（确定性脚本写的是系统临时目录，仅 checks/selftest 写产品 data）。
- **适用场景**：所有"在真实 dsh Web 验证 / 远程或容器访问 dsh / 无界面执行"相关任务。
- **来源**：本机实测（macOS，dsh v0.2.1-alpha.2，profile pm）；`pnpm dsh web --help`、`pnpm dsh headless --help`；对应踩坑见 ISS-010。

## KB-015 ｜ Doubao 沙箱自带 node 会遮蔽 nvm 的 node（判断版本时注意）（沉淀：doubao-work，2026-10-10；决策 ADL-014）

- **结论**：在豆包工作的命令行沙箱里，即使执行了 `nvm use 22`，`which node` 仍可能指向 Doubao 自带运行时 `~/Library/Application Support/DoubaoWork/sandbox_runtime/bases/<id>/bin/node`，其版本为 **v22.23.2**，会遮蔽 nvm 安装的 node。本机 nvm 实际安装且 `nvm alias default 22` 指向的是 **v22.23.3**（用 `nvm ls`、`nvm alias default` 可核实；用户自己的终端与 TRAE 等本机环境用的是 v22.23.3）。
- **影响**：两者都满足 dsh 引擎要求 `^22.19.0 || >=24`，构建/测试/运行不受影响；但文档与交接的标准 Node 口径以 **nvm 的 v22.23.3** 为准，不要据沙箱里的 `node -v` 误改文档。
- **适用场景**：在豆包沙箱内排查 Node 版本、或发现 `node -v` 与文档不一致时；以 `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22` 后再结合 `nvm ls` 判断真实安装版本。
- **来源**：本机 `nvm ls` / `nvm alias default` / `which node` 实测，2026-10-10。

## KB-016 ｜ 跨记录业务约束与写入必须共享业务队列（沉淀：trae / TRAE，2026-10-10）

- **结论**：storage-domain 只串行化已经提交给表的 `put/update/delete`，不会把调用方提前执行的“枚举其他记录 → 校验唯一性 → 写入”纳入同一原子步骤。项目同名检查、短 ID 分配、更新和删除须共享同一个按领域 `WeakMap<PmDomain, Promise<void>>` 业务队列；失败分支要吞掉队列尾部拒绝，保证后续操作可继续。
- **兼容做法**：数据版本未升级且没有迁移器时，不要把新增业务规则直接收紧到读盘 schema，避免旧记录令整个领域无法打开。本批保留 v1 Project 结构 schema，新增/更新在写盘前另用完整业务 schema 校验日期关系；旧倒置日期记录可读，但下次更新时必须一并修正。
- **适用场景**：项目名称防重，以及后续任务同级 WBS 编号、里程碑关联等需要“先读多条记录再写”的单宿主业务约束。
- **可复现实例**：`packages/dsh-pm-tool/src/core/projects.ts` 的 `enqueueWrite()`；运行 `pnpm run build && node scripts/verify-projects.mjs`，可验证同名/编号检查、并发新增、写盘失败恢复、更新和删除后的全新进程读回。
- **边界**：仅保证单宿主进程；多个 dsh 宿主共享同一数据目录不在 MVP 支持范围。已有合法重名记录更新非名称字段时不应重新触发同名拦截。
- **来源/佐证**：ADL-015；storage-domain README 的“每领域一条写入链”只覆盖表写操作，本项目确定性脚本实测通过。

## KB-017 ｜ WBS 编号按同级最大顺序追加并共享领域业务队列（沉淀：trae / TRAE，2026-10-10）

- **结论**：新增任务在同一领域业务队列内依次校验项目/父任务、计算全局任务 ID、取同级最大 `order + 1`，再生成根编号或 `${parent.code}.${order}` 并写盘。项目删除也走该队列并检查 tasks 表，可避免与任务新增并发时产生孤儿记录。
- **适用场景**：R2 单宿主 WBS 新增；移动/删除后不自动复用空洞编号，后续由显式重新编号动作处理。
- **可复现实例**：`src/core/tasks.ts`、`scripts/verify-tasks.mjs`；并发新增 6 个同级任务得到连续且唯一的 `1.2`～`1.7`。
- **来源/佐证**：ADL-016、requirements §5.3，真实 JSON 后端与全新进程读回验证。

## KB-018 ｜ 任务结构与 WBS 编号分离，树展示以 parentId/order 为准（沉淀：trae / TRAE，2026-10-10）

- **结论**：移动任务时只更新 `parentId` 和目标同级追加 `order`，保留原 `code`；任务列表依据真实 `parentId/order` 深度优先展开，不能用 code 段数推断层级。只有显式 `renumber` 才同步压缩同级 order 并重建 code。
- **适用场景**：WBS 任务移动、删除后存在暂时编号空洞或编号与新层级不一致时；界面和导出也应以关系字段构树。
- **实现要点**：移动前沿目标父链向上遍历，拒绝自身/子孙循环和跨项目父任务；重新编号先完整规划并校验树，再依次写入。storage-domain 没有多记录事务，因此中途失败时对已写记录反向恢复，并由故障注入验证常见单次失败不会留下部分新编号。
- **来源/佐证**：ADL-017；`src/core/tasks.ts` 与 `scripts/verify-tasks.mjs`，全新进程读回验证通过。

## KB-019 ｜ 里程碑时间线直接由 milestones 表稳定排序（沉淀：trae / TRAE，2026-10-10）

- **结论**：里程碑不维护额外索引；从 milestones 表枚举后按 `projectId` 过滤，再按 `targetDate` 升序、同日按 ID 自然序排序，可直接形成确定性时间线。
- **适用场景**：R3 离线列表、后续 R4 报告和 R5 时间线视图。
- **实现要点**：新增、项目存在校验、全局短 ID 和写盘复用领域业务队列；返回记录均做副本隔离。有里程碑的项目禁止删除。
- **来源/佐证**：`src/core/milestones.ts`、`scripts/verify-milestones.mjs`；并发新增、权限和全新进程读回验证通过。

## KB-020 ｜ 跨表引用校验与删除保护须进入同一领域业务队列（沉淀：trae / TRAE，2026-10-10）

- **结论**：Task 新增/更新 `milestoneId` 时，在写入前检查里程碑存在且 `projectId` 一致；里程碑删除时扫描 tasks 表拒绝仍被引用的记录。两类操作共享项目、任务和里程碑的领域业务队列，避免关联与删除并发产生悬空引用。
- **适用场景**：任何跨表外键式关系，例如后续风险关联任务、交付物关联项目。
- **实现要点**：更新校验最终合并记录；解除关联使用明确 `null`；删除只拒绝并返回操作建议，不做隐式批量清理。
- **来源/佐证**：ADL-018；`src/core/tasks.ts`、`src/core/milestones.ts` 和两个专项验证脚本。
