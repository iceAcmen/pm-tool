# 踩坑与解决方案档案 issues-and-solutions.md

> 本文件记录搭建与开发过程中遇到的「问题现象、根因、解决办法（含可复制命令）」；给维护者与迁移者排错使用，避免同一个坑踩两次。

运行环境默认：macOS（Apple Silicon）+ zsh + nvm Node 22 + pnpm（corepack）。

---

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

---

## 待补充（占位）

> 后续在依赖安装、构建、运行、插件开发中遇到的新问题，按上述格式持续追加（ISS-010、ISS-011……）。
