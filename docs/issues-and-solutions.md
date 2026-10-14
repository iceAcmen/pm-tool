# 踩坑与解决方案档案 issues-and-solutions.md

> 本文件记录搭建与开发过程中遇到的「问题现象、根因、解决办法（含可复制命令）」；给维护者与迁移者排错使用，避免同一个坑踩两次。

运行环境默认：macOS（Apple Silicon）+ zsh + nvm Node 22 + pnpm（corepack）。

---

## ISS-027 ｜ 隔离 GUI 收尾用 `pkill -f` 模糊匹配，误杀正式 `--profile pm` 的 3080/3091（2026-10-14，doubao-work）

- **现象**：为停掉隔离 GUI 验收起的临时 dsh 进程，按命令行子串做了 `pkill -f`（命中 `--profile pm` / CLI 路径），结果把**正式在跑的两个 dsh 实例一并杀掉**——`127.0.0.1:3080` 与 `127.0.0.1:3091` 同时掉线，Web 工作台打不开。
- **根因**：正式与隔离进程**命令行几乎相同**——两者都是 `node --import tsx/esm apps/cli/src/bin.ts --profile pm --no-open --host 127.0.0.1`，仅 `--port` 不同（正式 3080/3091），且 cwd 都在上游 `~/Projects/dsh-pm/deepseek-harness`。任何按 `--profile pm`、`dsh`、CLI 路径做的模糊 `pkill -f` / `killall` 都会**无差别命中正式进程**——按"正式和隔离共有的部分"杀，必然误伤。
- **恢复（已执行，业务零损）**：从发布 tag `v0.7.1` 建隔离 worktree（`.tmp/v0.7.1-restore`，detach 在 `02f42d1`），在该隔离树内 `install/build`，把 pm profile 的插件软链 `~/.dsh/profiles/pm/node_modules/dsh-pm-tool` 指向该隔离包，再按精确端口重启正式实例。业务数据在 `data/`（未入库、未被触碰），重启后 22 任务/里程碑/会议/汇报均完好（恢复后 Web 截图佐证）。
- **永久红线（同步写入 `AGENTS.md` §6 与 `docs/collaboration.md` 第十节）**：
  1. **禁止**按 `--profile` / `dsh` / CLI 路径等"正式与隔离共有子串"做 `pkill -f`、`killall`。
  2. 隔离/临时进程**启动即记录精确 PID**；停止前固定流程：`lsof -nP -iTCP:<port> -sTCP:LISTEN` 取 PID → 核对该 PID 的 cwd/argv/端口确为目标（不是正式 3080/3091）→ `kill -TERM <单PID>` → 等待退出 → 必要时对**同一 PID** `kill -KILL`。全程只对拿到的那一个 PID 发信号。
  3. 正式服务恢复必须**版本隔离构建**：从 git tag 建 detached worktree、在隔离树内 build 再起服；**主工作树的未提交候选（如 v0.7.2 甘特改动）不得直接承载正式服务**。
  4. **`lib/` 不入库、bundle 哈希不可复现**：`packages/dsh-pm-tool/.gitignore` 忽略 `lib/`，bundle 不进 git；运行态插件身份绑定 profile 的**绝对软链目标**，不同 worktree 构建出的 `lib/client.js` 哈希不可复现（实测同插件两 worktree 的 sha256 不同）。故**版本身份以 git tag + `package.json` version 为准，不以 bundle 哈希为准**。
- **避坑要点**：①"按子串杀进程"在多实例同 argv 场景是高危动作；②正式与隔离靠**端口 + 精确 PID** 区分，**不靠 cwd**（两者 cwd 相同）；③恢复用的包来自 tag 的隔离 worktree，不来自主工作树脏状态。
- **状态**：已恢复（v0.7.1 隔离 worktree），业务零损；流程红线已入库（2026-10-14）。

## ISS-026 ｜ 首页/欢迎页用 `/pm`「没反应」：宿主斜杠补全截获 + 发送后主区不自动跳转（2026-10-11，doubao-work / 豆包工作）

- **现象**：所有者在 dsh 首页对话框输入 `/pm` 类命令看似无效。
- **根因**：输入「/」触发宿主斜杠命令补全弹窗并截获 Enter（回车不直接执行）；点蓝色发送按钮可执行，但欢迎页发送后新建会话而主区不自动跳转，故像没反应。`/pm` 注册本身与内置命令一致、无问题（详见 KB-037 / ADL-038）。
- **解法（用户侧）**：斜杠命令点蓝色发送按钮提交，发送后到侧栏点最新会话查看结果；日常增删改与三 AI 功能优先用「项目管理」Web 面板按钮。
- **避坑**：插件无扩展点改回车放行/主区跳转，不要假装修好；以 Web 面板为稳定入口。残留宿主行为已如实记录。
- **【深挖补充】2026-10-11**：为何内置 goal 在补全里、pm 不在——补全候选直接来自 host `commands.list(agent)`（不过滤内置/外部）；pm 已全局注册（点发送可执行）。想新增补全行只能用浏览器侧 `commandUi.register(contribution)`，但它与已存在的 host 命令同名会抛 collision 错误，而 pm 正是 host 命令，故**无插件侧办法**让 pm 进欢迎页补全（详见 KB-037 源码路径）。维持文档说明 + 用左侧 GUI 面板。

## ISS-025 ｜ 已知限制：任务删除不级联，需叶子→根逐层删（2026-10-11，doubao-work / 豆包工作）

- **现象**：删根/父任务报「仍有子任务」；项目在有子任务时拒绝删除。
- **根因/设计**：为避免误删整棵子树（删除安全），R 系列刻意**不级联删除**——必须先删全部叶子子任务，再删其父任务，逐层上溯。
- **处置**：按 叶子→根 顺序逐个 `/pm task delete <id> confirm`。
- **【已增强】2026-10-11（A2 / ADL-037）**：已新增**显式、两步、防误删**的级联删除——`/pm task delete <id>` 无 confirm 先 dry-run 列出整棵子树；`<id> confirm` 有子任务仍拒绝并引导；`<id> cascade confirm` 才真删整棵（旁支不动）。老的无子任务单删命令不变。会议行动项跨表引用保护仍保留。

## ISS-024 ｜ dsh 应用内选免费模型报 MISSING_CREDENTIAL：旧进程没继承新环境变量（2026-10-11，doubao-work / 豆包工作）

- **现象**：在 dsh 网页底部模型选择器选 Free Models Router（openrouter-free）发消息，报错 `llm-pi-ai: no credential for provider route "openrouter-free"; its profile resolves OPENROUTER_API_KEY, which is not set`（错误码 `MISSING_CREDENTIAL`）。但 key 本身有效——同一 key 直连 `curl .../chat/completions` 已 `$0` 成功。
- **根因**：pi-ai 的 `apiKeyEnv` 读的是**启动该 dsh 进程时的进程环境变量**（见 KB-033/KB-035）。这次 dsh 是在「往 `~/.zshrc` 写入 key **之前**就开着的旧终端」里启动的，进程环境里根本没有 `OPENROUTER_API_KEY`；之后 shell source 与否、新终端能否 `echo` 到，都不影响这个已运行的旧进程。**不是 key 错、不是网络问题**。
- **解决办法**（二选一）：① 停掉旧 dsh，用已 `source ~/.zshrc`（能 `echo $OPENROUTER_API_KEY`）的**全新终端**重启（等价 `pnpm dsh --profile pm`）；② **推荐、且与启动终端无关**：在 dsh Web「设置→模型（Models）」页直接为该 provider 录密钥，写入 dsh credentials service（正是报错提示的目标），此后任何终端启动的 dsh 都取得到。
- **诊断命令**（`<dsh pid>` 换成实际进程号）：`ps eww -p <dsh pid> | tr ' ' '\n' | grep OPENROUTER_API_KEY`——无输出即旧进程没继承到该变量（实测新 zsh 能读到、长度 73）。
- **避坑要点**：改完 `~/.zshrc` 加 key 后，**必须新开终端或重启 dsh**才生效；想一劳永逸就把密钥录进 dsh Web 的 Models 页（credentials service），别依赖 shell 环境。
- **适用场景**：任何「改了环境变量但运行中的 dsh/Node 进程没生效」的 MISSING_CREDENTIAL / 类似报错。
- **状态**：已解决——重启到新环境后，Free Models Router 发「你好」第 1 次即成功，无 MISSING_CREDENTIAL/401/429。

## ISS-023 ｜ 汇报异常测试错误依赖具体排序（2026-10-10，trae / TRAE）

- **现象**：R9 首次专项验证中，五类异常均被正确收集，但测试因期待固定类型顺序而失败。
- **根因**：业务按严重级别、截止日期和 ID 稳定排序；测试却按编写用例的创建顺序断言。
- **解决办法**：异常覆盖断言改为比较排序后的类型集合，排序行为由独立字段断言和实际输出验证。
- **避坑要点**：聚合测试应把“包含哪些记录”和“如何排序”拆开验证，不以造数顺序替代业务排序规则。
- **适用场景**：多来源聚合列表、异常台账和跨表时间线测试。
- **状态**：已修正，R9 专项及完整回归通过。

## ISS-001 ｜ 系统「终端」里没有 node / pnpm

- **现象**：在 Doubao 执行环境中 `node -v` 有版本（v22.x），但路径指向 Doubao 自带运行时；系统里没有独立 Node（无 /usr/local、/opt/homebrew、nvm），自己打开「终端」App 将没有 node/pnpm。
- **根因**：Doubao 运行时注入了自带 Node，仅在其执行环境的 PATH 中生效，并非系统级安装。
- **解决办法**：用 nvm 安装用户级 Node，并用 corepack 启用 pnpm（无需 sudo）：
  ```sh
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  source ~/.zshrc
  nvm install 22 && nvm alias default 22
  corepack enable
  ```
- **状态**：已解决（2026-10-10）。

## ISS-002 ｜ 存在多个同名/仿冒「DeepSeek Harness」站点

- **现象**：检索到 deepseekharness.online、deepseekharness.dev、dshai.org 等站点，部分宣传数据（如「99.93% KV 命中率」「539K stars」）与官方不符。
- **根因**：热门开源项目易出现第三方营销/仿冒站点。
- **解决办法**：只以三方交叉口径判定官方——`deepseek.com` 官网域名 + GitHub `github.com/deepseek-ai` 组织 + npm `@deepseek-ai` scope；其余站点信息一律不采信。
- **状态**：已识别并规避（2026-10-10）。

## ISS-003 ｜ pnpm 版本与仓库锁定不一致

- **现象**：早期通过网页抓取看到 `packageManager` 为 pnpm@11.7.0，但克隆到的最新 master（v0.2.1-alpha.2）锁定 pnpm@11.28.5。
- **根因**：dsh 在开发者预览期迭代极快，锁定版本随提交变化；应以**当前克隆内 `package.json` 的 `packageManager` 字段**为准。
- **解决办法**：在仓库内让 corepack 按锁定版准备 pnpm：
  ```sh
  corepack prepare pnpm@11.28.5 --activate
  pnpm -v   # 应输出 11.28.5
  ```
  通常在仓库目录直接运行 pnpm 时，corepack 也会依据 `packageManager` 自动切换。
- **状态**：已解决（2026-10-10）。

## ISS-004 ｜ 非交互 shell 中 nvm/pnpm 不生效

- **现象**：每个新的命令行会话都是全新 shell，不会自动带有 nvm 的 Node/pnpm。
- **根因**：nvm 通过 shell 启动脚本注入环境变量，非交互新会话需显式加载。
- **解决办法**：在每条需要 Node 的命令前先加载 nvm：
  ```sh
  export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null
  ```
  交互式终端因 `~/.zshrc` 已配置，打开即自动生效。
- **状态**：已记录约定（2026-10-10）。

---

## ISS-005 ｜ storage-domain 的 `table.put()` 是异步写盘，漏 await 导致读不到、文件不落地

- **现象**：第 0 步校验脚本里调用 `table.put('selftest', 记录)` 后立刻 `table.get('selftest')` 返回 `undefined`，磁盘上也没有文件。
- **根因**：storage-domain 的 `put()` 先持久化再发 `domain/changed` 事件，是**异步**操作（官方 README 示例写作 `await domain.table(...).put(...)`）；只有 `get()` 是同步读内存。漏 `await` 时写入尚未刷新，进程可能已结束。
- **解决办法**：所有写操作都 `await`：
  ```ts
  await table.put('selftest', { ok: true, at, note })
  const back = table.get('selftest') // get 才是同步
  ```
  已把插件命令处理器改为 `async handler` 并 `await put`，再 `pnpm run build`。
- **状态**：已解决（2026-10-10）。

## ISS-006 ｜ 独立脚本里裸 `new Context()` 不触发 `ctx.effect`，存储后端没注册上

- **现象**：校验脚本用 `await ctx.plugin(StorageJson, {root})` 后，`ctx.storageDomain.open(...)` 仍无后端、不落盘。
- **根因**：storage-json 在插件 `apply` 内通过 `ctx.effect(...)` 注册后端；脱离完整宿主生命周期的裸 Context 不会执行该 effect。官方 storage-domain 测试因此采用「手动 new 后端并 register、再挂载 DomainFacility」的惯用法。
- **解决办法**（独立脚本，非宿主内）：
  ```js
  const ctx = new Context()
  await ctx.plugin(Storage)
  const backend = new JsonStorageBackend(root)
  ctx.storage.backend.register('json', backend)
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.provide('storageDomain', facility)
  ```
  宿主内（`pnpm dsh`）生命周期正常，无需此 workaround。
- **状态**：已解决（2026-10-10）。

## ISS-007 ｜ 指定 `--profile` 后 dsh CLI 参数顺序/动词容易写错

- **现象**：`pnpm dsh web --profile pm` 报 “select a profile only once”；`pnpm dsh --profile pm web` 报 “too many arguments”。
- **根因**：profile 一旦指定，运行的 app 由模板隐含，不能再写 app 动词；且 `--profile` 必须出现在对应位置。
- **解决办法**：
  - 首次从 web 模板派生（会顺带启动，Ctrl-C 即可）：`pnpm dsh --profile pm --from-default-profile web`
  - 之后日常启动：`pnpm dsh --profile pm --no-open`（**不再加 web 动词**）
  - 装插件：`pnpm dsh plugin --profile pm add link:<插件绝对路径>`
  - 只看配置不启动：`pnpm dsh --profile pm --dump-config`
- **状态**：已解决（2026-10-10）。

## ISS-008 ｜ `link:` 本地插件提示「不从目标 node_modules 解析 peer」

- **现象**：`dsh plugin add link:...` 时 pnpm 警告链接包的对等依赖不会从插件目录解析，建议改用 `file:`。
- **根因/判定**：pnpm 对工作区外 link 包的 peer 解析策略提示。对本插件**实测无副作用**：运行时服务（commands/storageDomain）全部来自宿主注入的 `ctx`，`@deepseek-ai/cordis` 仅 `import type`（编译后无运行时导入），zod schema 为普通对象，不存在「第二份 cordis/服务身份不一致」。插件成功加载、存储领域成功打开、命令注册正常。
- **解决办法**：开发期继续用 `link:`（改代码→重新 build→重启即生效，最方便）；若日后发布或遇到身份类问题，再按官方建议改用 `file:` 或发布 npm 包。
- **状态**：已判定可接受（2026-10-10）。

## ISS-009 ｜ Web 富文本输入框对自动化合成事件不稳定（演示注意）

- **现象**：用页面自动化点选斜杠命令 chip 后再逐字/点击输入参数时，参数偶发被拆成同级普通文本，导致整句被当成普通消息发给模型（无 Key 时报 MISSING_CREDENTIAL）。
- **根因**：dsh Web 输入框是 contenteditable 富文本 + 命令 chip 组件，合成点击/逐字事件与真人连续键入的分词行为不一致；属**自动化测试限制，不是产品缺陷**。官方命令类型也明确单条命令行「log-only，no turn wraps them」，不会触发模型。
- **解决办法**：① 真人演示时正常整行键入 `/pm selftest` 回车即可（自然输入会正确分词）；② 自动化/回归用包内确定性脚本 `node scripts/verify-command.mjs` 直接跑已构建插件的处理器，不依赖页面输入。
- **状态**：已规避（2026-10-10）。

## ISS-010 ｜ 非本机浏览器访问 dsh Web 被 503 拦截 / 部分 Agent 无法驱动本机 Chrome（2026-10-10，doubao-work）

- **现象**：① 在隔离/远端运行时的浏览器里打开 `http://127.0.0.1:3080` 报 `ERR_CONNECTION_REFUSED`（其 loopback 不指向宿主机）；② 改用 `--host <本机LAN IP>` 让端口可达后，浏览器主文档返回 **HTTP ERROR 503**（页面"该网页无法正常运作"），即便已用 token 换 cookie、用 CDP 注入认证 cookie 仍 503；③ 尝试 `--host 0.0.0.0` 直接被 dsh 拒绝启动。
- **根因**：dsh Web 默认仅绑定 loopback，且明确禁止通配地址（防止把远程代码执行暴露到网络）；对非本机浏览器，`/api` browser-trust 围栏返回 503（防 DNS-rebinding / 远程访问）。宿主机本机 `curl -L` 带 cookie 可 200，说明服务本身正常，拦截是**有意的安全设计**。另：某些 Agent 角色（如 OrganizeAgent）调用 Mac 本机 GUI 自动化会返回"Subagent 暂不支持，请在 MainAgent 完成"，属工具权限边界。
- **解决办法**：
  1. **不要绕过信任围栏、不要绑定 0.0.0.0**；真实浏览器演示一律在宿主机本机 Chrome 打开终端打印的 `http://127.0.0.1:3080/?token=...` URL。
  2. 自动化/回归用包内确定性脚本 `node scripts/verify-{command,storage,projects}.mjs`（真实 Cordis + 真实 storage-json + 真实命令处理器）。
  3. 不具备本机 GUI 能力的 Agent，用"确定性脚本 + 真实宿主启动日志（`[pm-tool] 存储领域 pmtool 已打开`）+ 真实 Web 落盘文件核验（`data/pmtool/projects/*.json`，目录 0700/文件 0600）+ 全新进程读回"组成证据链，并把"本机浏览器点击"明确标注为由具备 GUI 能力的一方执行，不伪造结论。
  4. 临时用 `--host` 绑定过 LAN 做测试的，结束后务必停服；该绑定是命令行临时参数、不写入 profile（可 `grep -r host ~/.dsh/profiles/pm` 确认无残留）。
- **状态**：已定性为安全设计 + 工具权限边界，非产品缺陷（2026-10-10）。详见 KB-014。

## ISS-011 ｜ 已确认重名的项目更新非名称字段被再次拦截（2026-10-10，trae / TRAE）

- **现象**：测试先用 `confirm` 创建/改出同名项目，再更新其中一个项目的负责人和状态时，初版实现仍按最终名称扫描全表，返回“已存在同名项目”，导致合法记录无法维护。
- **根因**：把“更新后的记录名称是否重复”误当成每次更新都要检查，未区分本次是否实际修改名称。
- **解决办法**：仅当更新片段包含 `name` 且规范化后的名称与当前名称不同时执行同名检查；更新其他字段直接保留现有名称状态。实际改名撞到其他项目仍默认阻止，末尾 `confirm` 放行。
- **避坑要点**：防重是对“创建新名称占用关系”的约束，不是对已有数据每次写入的全量重新授权。测试须覆盖“确认重名后更新非名称字段”。
- **状态**：已修复并由 `scripts/verify-projects.mjs` 回归通过（2026-10-10）。

## ISS-012 ｜ DomainTable 没有 values() 枚举方法（2026-10-10，trae / TRAE）

- **现象**：实现任务列表时按原生 Map 习惯调用 `domain.table('tasks').values()`，TypeScript 构建报 `KvTable ... 不存在属性 values`。
- **根因**：当前 dsh storage-domain 的 `DomainTable` 公开 `keys()` 与 `entries()`，但不公开 `values()`。
- **解决办法**：使用 `[...table.entries()].map(([, value]) => value)`，再做过滤和排序。
- **避坑要点**：表枚举严格以 KB-011 和类型声明为准，不假设拥有完整 Map API。
- **状态**：已修复，构建及 `verify-tasks.mjs` 通过。

## ISS-013 ｜ 里程碑重启测试错误假设并发记录不会插入时间线中间（2026-10-10，trae / TRAE）

- **现象**：`verify-milestones.mjs` 首次重启验证失败，预期 12 月 31 日记录排第三，实际并发新增的 12 月中旬记录正确排在其前。
- **根因**：测试只考虑前三条初始记录，忽略后续并发记录同样参与按日期排序；业务实现无误。
- **解决办法**：断言改为分别验证同日记录按 ID 稳定排序，以及最晚日期记录排在末尾。
- **避坑要点**：测试排序时只断言业务不变量，不依赖后续测试数据会不会插入固定下标。
- **状态**：测试修正后专项构建与全新进程读回通过。

## ISS-014 ｜ 状态一致性负例误用已达成里程碑（2026-10-10，trae / TRAE）

- **现象**：里程碑编辑专项测试期望“只更新 achievedDate”失败，但选中的记录原本就是 `achieved`，实现正确返回成功。
- **根因**：测试对象状态选择错误，不是业务实现缺陷。
- **解决办法**：改用 `planned` 记录单独填写 achievedDate，验证“非 achieved 状态必须为 null”确实拒绝。
- **避坑要点**：状态机负例必须同时明确初始状态与变更字段，不能只看 patch 本身。
- **状态**：用例修正后 tasks/milestones 专项验证通过。

## ISS-015 ｜ 导出测试使用原始文本比较转义输出并误判帮助命令（2026-10-10，trae / TRAE）

- **现象**：`verify-export.mjs` 首次用原始含 `|` 标题定位 Markdown，因输出已转义而失败；随后又把裸 `/pm export` 帮助结果错误预期为失败。
- **根因**：测试没有按最终输出格式和项目现有“空子命令返回帮助”的约定断言，业务实现无误。
- **解决办法**：排序改比较不受转义影响的日期/ID 片段；裸 export 单独断言成功帮助，其余非法格式继续断言错误。
- **避坑要点**：渲染测试应区分原始领域值与序列化文本；命令测试须沿用同族命令的帮助语义。
- **状态**：修正后 Markdown 专项验证通过。

## ISS-016 ｜ 外部 clientBundle 入口误指向声明目录，且宿主主题覆盖控件颜色（2026-10-10，trae / TRAE）

- **现象**：首次 `tsdown` 报无法解析 `lib/types/client/index.js`；真实页面加载后，刷新按钮文字不可见，输入框和项目项对比度不足。
- **根因**：本包 `tsc` 把可执行 JS 输出到 `lib/client/index.js`，`lib/types/` 只有声明文件；同时 dsh 全局主题会给原生 button/input 设置颜色，未显式指定前景色的内联控件继承结果不稳定。
- **解决办法**：将 bundle entry 改为 `lib/client/index.js`；输入、按钮和项目项显式设置背景与文字颜色。项目详情组件按项目 ID 设置 React `key`，避免切换项目时 `defaultValue` 保留旧记录。
- **避坑要点**：先核对编译器真实输出目录再配置 bundler；外部面板须在真实宿主主题中做截图与交互验证，不能只看 TypeScript 构建。
- **状态**：已修复；真实浏览器截图、CRUD、控制台/网络检查和完整回归均通过。

## ISS-017 ｜ 新版面板空白：Lucide 被外部化但不在 dsh 模块表中（2026-10-10，trae / TRAE）

- **现象**：新版 bundle 可下载，但 dsh 页面空白并报 `web boot: 1 entry did not activate`；产物含 `require("lucide-react")`。CSS `?raw` 初次也因 `tsc` 不复制静态文件而无法构建。
- **根因**：`tsdown` 默认把 dependency 外部化，而 dsh 动态模块加载器只认识 roster 已注册模块；同时本包先运行 `tsc`、再以 `lib/client/index.js` 打包，CSS 不会自动进入 `lib/`。
- **解决办法**：构建时复制 `panel.css`，通过本地 raw CSS 插件内嵌文本；Lucide 改用单图标 ESM 入口，并用 `noExternal` 正则把全部子路径打入 bundle。最终外部依赖只剩宿主提供的 React。
- **避坑要点**：每次增加客户端依赖后检查 `rg -o 'require\\(\"[^\"]+\"\\)' lib/client.js`，确保动态模块表之外的包没有残留；真实宿主启动是必做验证。
- **状态**：已修复；bundle 约 60 kB，真实页面正常激活，控制台无当前构建错误。

## ISS-018 ｜ Web 结构重构后专项验证仍断言旧 CSS 选择器（2026-10-10，trae / TRAE）

- **现象**：高密度表格版 `pnpm run build` 成功，但 `verify-web.mjs` 因继续匹配旧 `.pm-tabs` 选择器而失败。
- **根因**：专项脚本把关键界面契约固化到 bundle 文本；组件结构变更时没有同步更新断言。
- **解决办法**：将契约改为 `.pm-view-tabs`、`.pm-data-table`、`.pm-drawer`、搜索和分组控件，并保留 manifest、模块包装和无额外 Lucide `require()` 断言。
- **避坑要点**：界面重构后必须同步检查结构契约测试；构建通过不等于专项验证通过，也不能直接删除失败断言。
- **状态**：已修复，`verify-web.mjs` 退出码 0。

## ISS-019 ｜ TRAE 沙箱不允许 dsh 重写真实 profile 的 cordis.yml（2026-10-10，trae / TRAE）

- **现象**：阶段 4 在工具终端执行 `pnpm dsh --profile pm --no-open --port 0` 时，CLI 准备 profile 需要重写 `~/.dsh/profiles/pm/cordis.yml`，被沙箱以 `EACCES` 拒绝；用户自己的终端不受该沙箱规则影响。
- **根因**：TRAE 当前只允许写工作区，`~/.dsh` 在工作区外。dsh 每次启动会根据 bundles 和 patch 重新组合 `cordis.yml`，即使 profile 已存在也需要写权限。
- **解决办法**：交付自动验证时把现有 `~/.dsh/profiles/pm` 复制到 `/tmp`，设置临时 `DSH_HOME` 后启动。注意 profile 内 `node_modules/dsh-pm-tool` 原本是相对软链接，复制后须改为指向产品包的绝对软链接，否则会跳过插件：
  ```sh
  export DSH_HOME="$(mktemp -d /tmp/dsh-pm-stage4.XXXXXX)"
  mkdir -p "$DSH_HOME/profiles"
  cp -R "$HOME/.dsh/profiles/pm" "$DSH_HOME/profiles/pm"
  ln -sfn /Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool \
    "$DSH_HOME/profiles/pm/node_modules/dsh-pm-tool"
  pnpm dsh --profile pm --no-open --port 0
  ```
- **验证**：隔离 profile 成功打印 `[pm-tool] 存储领域 pmtool 已打开` 和随机端口 URL；带 token 请求返回 HTTP 200，boot roster 包含 `dsh-pm-tool/client.js`。
- **适用场景**：Agent 沙箱内做真实 dsh 启动验证；日常用户终端仍直接使用 `~/.dsh/profiles/pm`。
- **状态**：已规避并沉淀（2026-10-10）。

## ISS-020 ｜ storage-domain 表名不接受连字符（2026-10-10，trae / TRAE）

- **现象**：R7 初次把表名写为 `risk-issues`，打开领域时报错：`table name 'risk-issues' must match /^[a-z][a-z0-9_]*$/`。
- **根因**：记录 key 可使用连字符，但 storage-domain 的 table name 规则更严格，只允许小写字母开头，后续使用小写字母、数字或下划线。
- **解决办法**：表名改为 `risk_issues`，物理路径同步为 `data/pmtool/risk_issues/<id>.json`；命令名称仍可使用用户更易读的 `risk-issue`。
- **避坑要点**：设计存储表时区分“表名规则”和“记录键规则”，新增表先用真实领域声明执行最小构建/打开验证。
- **适用场景**：所有基于 `domainTable()` 新增表的插件开发。
- **状态**：已修复，R7 专项与完整回归通过。

## ISS-021 ｜ 带 default 的 create schema 直接 partial 会破坏 patch 语义（2026-10-10，trae / TRAE）

- **现象**：只更新行动项 `status` 后，原有 `taskId/riskIssueId` 被静默重置为 `null`，删除关联问题时未触发保护。
- **根因**：`meetingActionCreateSchema.partial()` 保留了各字段的 `default()` 行为，解析 patch 时为未提交字段补默认值，合并后覆盖原记录。
- **解决办法**：为 update 单独定义全部字段仅 `optional()`、不含默认值的 strict schema；创建 schema 继续负责默认值。专项测试增加“状态更新后关联仍存在”和删除保护断言。
- **避坑要点**：create 与 update schema 不能机械复用；patch schema 的缺省必须表示“不修改”，不能表示“写入默认值”。
- **适用场景**：所有 Zod patch/update 输入，尤其是 create 字段使用 `default()` 时。
- **状态**：已修复，R8 专项与九项完整回归通过。

## ISS-022 ｜ 行动项固定列宽溢出抽屉且会议保存未提交子表单（2026-10-10，trae / TRAE）

- **现象**：520px 抽屉内的行动项状态框超出容器；用户修改或填写行动项后直接点击“保存会议”，行动项未写盘。
- **根因**：行动项网格五列固定最小宽度总和超过抽屉内容区；会议基础字段和行动项分别属于多个独立表单，会议 submit 只处理自己的 `FormData`。
- **解决办法**：行动项改为两列 `minmax(0, 1fr)` 自适应网格，窄屏改单列；行动项表单增加稳定 data 标识，“保存会议”成功后依次读取并提交已有行动项和已填写的新行动项，全部成功才关闭抽屉。
- **验证**：真实浏览器检查所有控件边界均在容器内；新增和编辑行动项均只点击“保存会议”，重开抽屉后数据完整，控制台与网络无错误。
- **适用场景**：固定宽度抽屉内的多字段子记录，以及父表单需要统一保存多个独立子表单的交互。
- **状态**：已修复。

---

## 待补充（占位）

> 后续在依赖安装、构建、运行、插件开发中遇到的新问题，按上述格式持续追加（ISS-011、ISS-012……）。
