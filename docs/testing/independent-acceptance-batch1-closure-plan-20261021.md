# 第一批现有候选验收收口执行计划

> **执行角色：** Main 仅按本文采集原始证据；独立测试专家另行审证并给出 PASS / FAIL / BLOCKED。  
> **当前状态：** `NOT_RUN`。本文只定义计划，不代表已执行 GUI、已复验脚本或已给出放行结论。

**目标：** 补齐看板连续拖动、宽屏编号、深色与错误反馈、合法长历史、Finder 真实双击，并用路径配对实验核清 `verify-export.mjs` / `verify-settings.mjs` 的失败属于测试设施还是产品行为。

**方法：** 所有证据先绑定同一冻结候选、隔离构建、隔离数据根和隔离服务。Main 不增改步骤、不自行判定；任一候选文件、bundle、fixture、服务身份变化，受影响证据立即失效并重新采集。

**环境：** macOS、Finder、真实浏览器、nvm Node 22、pnpm 11.28.5、隔离 dsh profile / DSH_HOME / storage root。

---

## 1. 范围、角色与停止条件

### 1.1 本批必须完成

| 用例 | 对象 | 初始状态 |
| --- | --- | --- |
| B1-GUI-01 | 看板连续拖动、压实、撤销、保存重进、取消不落盘 | NOT_RUN |
| B1-GUI-02 | 1440px 宽屏任务编号、复制成功与失败反馈 | NOT_RUN |
| B1-GUI-03 | 深色主题下长错误、顶层错误、表单保留与单处反馈 | NOT_RUN |
| B1-GUI-04 | 合法隔离长历史、14 天分界、按月折叠与重进 | NOT_RUN |
| B1-DESK-01 | Finder 指针真实双击 `.app` 的启动闭环 | NOT_RUN |
| B1-DESK-02 | nonce / Origin / 认证 / cancel 安全负例 | NOT_RUN |
| B1-PATH-01 | `verify-export.mjs` 普通路径与含空格 detached 路径配对 | NOT_RUN |
| B1-PATH-02 | `verify-settings.mjs` 普通路径与含空格 detached 路径配对 | NOT_RUN |

### 1.2 角色边界

- **独立测试专家：** 维护本文、核候选绑定、审原始证据、给逐项与最终结论；不得修改产品代码、launcher、配置、服务或 `docs/testing/` 外文档。
- **Main 采证者：** 只执行本文既定步骤，保存原始截图、录屏、DOM/落盘回读、命令 stdout/stderr/exit；不得判 PASS，不得临场改用例。
- **开发者：** 仅在出现已绑定的 FAIL 后另批修复；不得代替独立专家验收。
- **项目所有者：** 仅处理确实需要本人权限或认证的步骤。具备 Main 能力的 Finder / 浏览器操作不得转嫁为 `MANUAL_PENDING`。

### 1.3 立即停止并记 `BLOCKED`

- 无法复现 §2 的候选指纹，或采证期间候选、bundle、fixture 被改动。
- 无法证明运行实例使用冻结候选，或隔离实例与正式服务/数据根混用。
- Finder、浏览器或桌面录屏能力不可用，且没有具备该能力的 Main 接手。
- 合法长历史 fixture 未经 schema 构造和产品恢复入口导入。
- 任何步骤要求输出 token、cookie、nonce 原文或修改正式数据。

已经实际运行并得到错误结果的用例不得写成 `BLOCKED`；应按 §10 判 `FAIL` 并注明失败对象。

## 2. 候选绑定

### 2.1 本计划编写时的只读快照

- 仓库：`/Users/bytedance/Projects/dsh-pm/pm-tool`
- 基线 HEAD：`06a131cd5fdc4486dd74afe89cc4c5630f0a4c98`
- Client 七个 tracked 文件 diff sha256：`d4558c19abf95b8e9420bdf1b6171721c3ec6c41b6e224e6fc610403a2cd24d1`
- Client 文件 sha256：
  - `src/client/panel.tsx`：`ff284377adc2c3ce72bb348d5eccc2bfcba32fa5d1d8009b94b27f8af52199d8`
  - `src/client/views/growth-form-props.ts`：`0e07ee09757ad74b75076b5007b43b4c5781f2de9a3f2e01529db6c03a54a8e4`
  - `src/client/views/okr-form.tsx`：`0b9bd1b13abf89b6eeb53fd7cec0eabe5aeeca9df538b28de0862fbedc3b6092`
  - `src/client/views/reports-entry-guard.test.ts`：`8bbea28a5275ef22007227ff3d755503fecfcd129948f120fd00d6ab0bac64f8`
  - `src/client/views/reports.tsx`：`6a6bae4c4e5c59a9212605e00cb9a4f5c3530b2e35436ceb8608c4fbf6beb79b`
  - `src/core/ui-feedback.test.ts`：`c5eea9acca37121bd478a00842c7f5fb09cd43705761a67b4aacc8ecc284e648`
  - `src/core/ui-feedback.ts`：`02fd446aa9a956ce32c3004cb8e79225d711a8f20fcc974306fb8aa6599db8c7`
- Client 新文件：
  - `src/client/launch-handshake.ts`：`1b6aa212b8647f7f3ec99c680696ad5847ba9fb136452a77f5302d61b88a5b9a`
  - `src/client/launch-handshake.test.ts`：`4fe25dc158771c652d326b35369ce7951a86fddc8d7bc49f0f6cb5e669123ca2`
- Launcher tracked diff sha256：`633ff5ef5a6bd18ed2cf978e1f5deffba54b1a5deb90c3a647b23cbde35b19ce`
- Launcher 新文件：
  - `launcher/scripts/make-app.mjs`：`37dd96cc3acbab7aa67bab324b13cb914d23e18cc4b2c140357c2a3f38831512`
  - `launcher/src/local-app.mjs`：`334032cc4a0f5b86fac002b2b0e8f6f406b725ae27cdfc959c2056588c0099dd`
  - `launcher/test/local-app.test.mjs`：`d0f0e0a770d7f9a56693849048ae415ee6dfbcf7a132199f5f6b07c69ad0bc04`
- 既有隔离 app：
  - 路径：`/Users/bytedance/Documents/dsh-pm-tool/本地启动器候选-20261021/PM工作台-隔离验收.app`
  - `Contents/MacOS/launch`：`a7289c013284416f2a5c6289fdbf717099507722d9a230a1344a4c7f0604a3a5`
  - `Contents/Info.plist`：`24048be9a4cdc1f8f6c0b053f3b53752052b61f0a0e1e9a3f3dde87e47ce4063`

### 2.2 每次采证前必须重新冻结

Main 建立只读候选清单，至少记录：

1. 基线 commit、tracked diff 二进制补丁 sha256、新文件路径与逐文件 sha256。
2. 冻结树绝对路径、`package.json` version、构建命令、构建 exit、`lib/client.js` sha256。
3. Launcher diff、新文件和 `.app` 两个文件的 sha256。
4. dsh 宿主 commit、实际 argv、cwd、PID、监听 host/port、profile、DSH_HOME、storage / backup / export 根。
5. 浏览器名称与版本、视口、缩放、宿主主题状态。
6. fixture 文件 sha256、导入前后隔离数据 manifest。

上述任一值与本节快照不符时，不沿用旧证据；先由协调者确认新候选，再执行。

## 3. 数据与服务保护

1. 正式服务、正式 profile、正式数据全程只读。历史记录中的 `3172`、`3199` 和 PID 只作背景，执行前必须重新核验，不直接复用旧 PID。
2. 隔离服务使用新的空闲端口；启动即记录精确 PID。不得使用 `pkill -f`、`killall` 或共有 argv 子串停进程。
3. 停隔离实例只能按：`lsof` 查监听 PID → 核 cwd/argv/端口/DSH_HOME → `kill -TERM <单PID>` → 等待退出；必要时只对同一 PID `kill -KILL`。
4. 隔离实例必须使用独立 `DSH_HOME`、storage root、backup root、export root；目录放在本批临时根，不指向仓库 `data/`、`packages/backups/`、`exports/` 或 `~/.dsh/profiles/pm`。
5. GUI 写操作仅作用于本批 fixture。每项前保存隔离数据 manifest，项后保存新 manifest；正式资产也记录前后 hash+mtime 清单，必须零变化。
6. 不记录或传播启动 URL token、cookie、nonce。截图/录屏出现敏感值时当场停止，删除该证据并重新采集脱敏版本。
7. 不修改系统时间，不改宿主全局配置，不切正式软链，不重启正式服务。

## 4. 通用证据格式

每个用例单独目录，建议：

```text
artifacts/batch1-closure/<case-id>/
  candidate.txt
  environment.txt
  steps.txt
  before.png
  after.png
  journey.mov
  dom.json
  storage-before.sha256
  storage-after.sha256
  stdout.log
  stderr.log
  exit.txt
  evidence.sha256
```

`steps.txt` 逐步写本地时间、动作、可见结果；`candidate.txt` 写 §2.2 绑定。截图只作视觉证据，关键持久化项还要有导出布局、快照或隔离落盘回读。Main 最后只写“步骤完成/受阻”和原始现象，不写 PASS / FAIL。

## 5. B1-GUI-01 看板连续拖动

### 候选绑定

- 产品：§2 冻结 client 候选及同次构建 `lib/client.js`。
- 直接行为文件：基线中的 `src/client/board/editor.tsx`、`editor-ops.ts`、`projection.ts`、`board.css`。
- 服务：加载上述 bundle 的隔离实例；正式实例不得作为证据对象。

### 前置 fixture

- 隔离空根中创建一个项目。
- 看板至少有 6 张可区分卡片，初始 canonical 布局无相交，前三张位于连续行，底部保留可观察空区。
- 通过产品“保存布局”落盘一次；导出布局 JSON 作为 `layout-before.json`。
- 浏览器视口 `1440×900`、100% 缩放、浅主题；关闭卡库/配置面板。

### Main 采证步骤

1. 开始连续录屏，打开总览看板 → 布局编辑；记录卡片数、各卡 `data-widget-id`、bbox、画布 `scrollHeight` 和导出布局坐标。
2. 将卡 A 从首行拖到卡 D 下方，松手；立即记录 bbox、空白行和画布高度。
3. 不退出编辑，将卡 B 拖到卡 A 原位置附近，松手；再次记录。
4. 将卡 A 再拖回上半区，松手；这是同一会话第三次连续拖动，再次记录。
5. 每次松手后检查：卡片没有相交、没有丢失、没有突然远推到不可见空白、撤销按钮可用。
6. 连续点三次“撤销”，逐次记录布局；应按第三、第二、第一次拖动逆序恢复。
7. 再完成两次拖动并点“保存布局”；等待“布局已保存并刷新”，刷新页面并重进布局编辑，导出 `layout-after-reload.json`。
8. 另做一次拖动后点“取消”；刷新并重进，确认取消动作未落盘。

### 可观测结果

- 每次 `onDragStop` 后只产生一个稳定布局；卡数和卡 ID 不变，bbox 零相交。
- 垂直压实仅消除洞，不把无关卡连续下推到远离内容的空白区；画布高度与最后一张卡底边相符。
- 三次撤销严格逆序恢复三次离散拖动。
- 保存后的 canonical 坐标重进一致；取消后的临时坐标不出现。
- 全程无错误横幅、无卡片消失、无二维外壳横滚。

### 保护与判定

- 只写隔离 dashboard 记录；保存前后回读该记录，不触碰其他实体。
- **PASS：** 上述全部结果满足，录屏、三阶段 bbox、保存重进和取消回读齐全。
- **FAIL：** 任一卡远推空白、相交、丢失、撤销顺序错误、保存重进漂移或取消落盘。
- **BLOCKED：** 真实指针拖拽能力不可用、冻结候选未装载或 fixture 无法建立；不得用纯函数测试代替。

## 6. B1-GUI-02 宽屏编号与复制

### 候选绑定

- 产品：§2 冻结 client 候选。
- 直接行为文件：基线中的 `src/client/views/tasks.tsx`、`tasks.css`、`tasks-clipboard.ts`。
- 视口固定 `1440×900`、100% 缩放；本项不接受窄屏卡片证据替代。

### 前置 fixture

- 同一项目至少两条任务：
  - 一条有 WBS code，例如 `1.2`。
  - 一条为合法存量缺 code 记录，显示短 ID，不在测试中重新编号。
- 浏览器剪贴板权限正常；另准备一个新浏览器上下文，在权限面板中拒绝剪贴板，用于失败反馈。

### Main 采证步骤

1. 宽屏打开任务列表，截图包含表头“编号”和两行编号单元格。
2. 读取 `.pt-code`、`.pt-code-val`、任务标题 bbox；记录编号非空、编号列未覆盖任务列。
3. 键盘 Tab 到有 code 的复制按钮，记录可见焦点环，按 Enter。
4. 在允许剪贴板的上下文读取粘贴板，确认值严格等于 code；记录按钮短暂显示“已复制”，约 1.6 秒后恢复原值。
5. 对缺 code 记录执行同样步骤；剪贴板值严格等于该任务 ID，页面不生成新 WBS code。
6. 在拒绝剪贴板的上下文点击复制；记录“复制失败”及可手动选择提示，确认没有“已复制”假成功。

### 可观测结果

- 宽屏每行编号格非空；有 code 显 code，无 code 显原 ID。
- 编号可键盘聚焦，焦点环清楚；复制图标/文字不遮挡相邻列。
- 成功与失败状态分别对应真实 Clipboard API 结果；失败不改数据、不报成功。

### 保护与判定

- 本项只读业务数据，仅写浏览器剪贴板和瞬时 UI 状态。
- **PASS：** 两类编号均可见，成功复制值正确，拒绝权限时诚实失败，布局无裁切/覆盖。
- **FAIL：** 空编号、列错位、复制值错误、失败假成功、点击导致行打开或业务数据变化。
- **BLOCKED：** 无法提供 1440px 真实浏览器或无法控制/核验剪贴板权限。

## 7. B1-GUI-03 深色与错误反馈

### 候选绑定

- 产品：§2 冻结 client 候选。
- 直接行为文件：`src/core/ui-feedback.ts`、`src/client/panel.tsx`、`src/client/panel.css`、`src/client/views/okr-form.tsx`。
- 深色必须通过宿主真实主题控制切换，并以 `body[data-ds-dark-theme]` 的实际状态作辅证；不得只在 DevTools 临时加属性。

### 前置 fixture

- 一个项目、一条可编辑任务、一个 OKR。
- 一份 JSON 格式合法但 `format` 不受支持的本地备份文件，用于触发产品恢复预检错误；不得包含敏感信息，也不得通过预检落盘。
- 一条不存在的 OKR ID，例如 `okr-zzz-notexist`，用于触发表单就近错误。
- 视口 `1440×900`、100% 缩放。

### Main 采证步骤

1. 用宿主主题入口切到深色，记录主题控件状态和 `body[data-ds-dark-theme]`。
2. 浏览任务、OKR、设置、看板各一屏，记录文字、边框、输入框、下拉、焦点环是否可辨。
3. 编辑 OKR，填入不存在的关联 ID 并保存；记录抽屉不关闭、输入值保留、就近错误可见且只有一处。
4. 关闭就近错误后，使用产品“恢复备份”入口选择不受支持的 fixture，走到预检失败；不得确认任何可通过预检的恢复。
5. 记录顶层 ResultCard：`role=alert`、长错误完整换行、无横向溢出、错误不在 3 秒后消失、没有同时出现成功 toast。
6. 点击“复制原文”，在允许剪贴板的上下文核对原文完整；关闭结果卡后确认焦点和页面仍可继续操作。
7. 切回浅色再切深色一次，确认错误组件随主题 token 变化，不残留浅色白块或不可读文字。

### 可观测结果

- 深色由宿主控制，原生输入/选择器及自定义组件均可读。
- 表单业务拒绝保留抽屉和输入，错误就近呈现。
- 顶层长错误持久、单处、完整换行、可复制；不被成功 toast 截断或重复。
- 错误后仍可关闭、修正并继续工作，页面无卡死。

### 保护与判定

- 恢复 fixture 必须在预检阶段被拒，隔离数据 manifest 前后完全一致。
- **PASS：** 深色可读性、就近错误、顶层长错误、持久/单处/可恢复全部满足。
- **FAIL：** 主题未跟随宿主、错误不可读/被截断/自动消失/重复、表单丢输入、错误后无法继续，或预检失败仍写数据。
- **BLOCKED：** 宿主无真实主题入口、无法触发既定错误路径或无法证明数据零写。

## 8. B1-GUI-04 合法隔离长历史

### 候选绑定

- 产品：§2 冻结 client 候选。
- 直接行为文件：基线中的 `src/core/habits.ts`、`src/client/views/habit-model.ts`、`src/client/views/habits.tsx`。
- fixture 与运行 bundle 必须来自同一冻结候选。

### 前置 fixture：唯一允许方案

1. 在独立临时数据根启动离线 fixture 生成上下文，不连接正式 profile。
2. 用当前候选的 `habitRecordSchema.parse` 构造一条合法习惯记录；用 `deriveHabitStreak(record, fixtureToday)` 生成 streak，禁止手写不一致累计值。
3. `checkIns` 使用唯一日期，覆盖：
   - 今天及最近 13 天内至少 4 条。
   - 14 天窗口之前至少 8 条。
   - 至少跨两个更早自然月。
4. 用当前候选 `collectBackup` / `createBackup` 生成标准 `pm-tool-backup`；项目记录与 habit 的 `projectId` 一致。
5. Main 先通过产品 `/pm restore ...` 演练，再在**空的隔离实例**执行 `confirm`；记录预检、自动安全快照路径和恢复后 snapshot。
6. fixture 文件、生成日志和 sha256 入证据目录；恢复后只通过产品 snapshot / 只读落盘回读核验。

明确禁止：

- 用 `/pm habit checkin` 写入超过两天的日期。
- 修改系统时间、注入假墙钟或把未来日期伪装成今天。
- 直接编辑隔离或正式 `habits/*.json`。
- 从正式数据复制个人历史。
- 在 DevTools 中改 React props / DOM 冒充历史。

本方案导入的是一份经当前 schema 构造、经产品恢复入口预检的“既有历史档案”，不是超窗补记，因此不绕生产两天回填限制。

### Main 采证步骤

1. 导入后打开习惯页，记录 streak 文本与 snapshot/落盘值一致。
2. 记录最近 14 天内条目平铺显示；14 天之前的条目不平铺。
3. 记录至少两个按 `YYYY 年 M 月` 命名的折叠组，默认 `aria-expanded=false`，数量与 fixture 一致。
4. 展开一个月组，记录日期倒序、备注与“补记”标记原样显示；再收起。
5. 刷新并重进习惯页：历史仍在，月份恢复默认折叠，业务数据 manifest 不变。
6. 点击“今天打卡”两次，验证既有 D-13 同日幂等仍成立；只允许今天新增一条或返回已存在，不影响旧月份数量。
7. 用产品命令尝试三天前日期，记录被“超出补记窗”拒绝且数据零写。

### 可观测结果

- 14 天分界准确；更早历史按自然月分组并默认折叠。
- 展开/收起仅为本地显示状态，不改历史数据。
- 日期、备注、backfilled 标记、streak 与 fixture 一致。
- 生产打卡入口仍严格执行两天窗口和同日幂等。

### 保护与判定

- fixture 仅导入新建隔离根；结束后销毁整个临时根，不逐文件改写。
- **PASS：** 合法 fixture 链、分组折叠、重进、幂等和超窗拒绝全部有证。
- **FAIL：** 分界错误、旧历史平铺失控、月份数量/排序错误、展开改数据、超窗打卡被接受或同日重复。
- **BLOCKED：** 无法由当前 schema 生成并经产品恢复入口导入；不得改用手工 JSON。

## 9. B1-DESK-01 / 02 Finder 真实双击与安全闭环

### 候选绑定

- Launcher：§2 的 `633ff5e…` tracked diff及三个新文件。
- `.app`：§2 两个文件 hash 必须逐字节一致。
- app 路径固定为：
  `/Users/bytedance/Documents/dsh-pm-tool/本地启动器候选-20261021/PM工作台-隔离验收.app`
- 隔离服务必须装载 §2 同一 client bridge。正式服务只作“不受影响”保护对象。

### 前置 fixture

- Finder 可见上述 `.app`；Main 有桌面指针控制与全屏录屏能力。
- 重新核验 app 壳内 `PM_HOST` / `PM_PORT` / `DSH_HOME` 绑定；目标端口只属于本批隔离实例。
- 记录正式服务和其他隔离服务的 PID/端口/argv/cwd；建立“不杀”清单。
- 准备两个真实浏览器上下文：已认证浏览器 A、无该 authority cookie 的浏览器 B。
- 清空 `~/Library/Logs/pm-launcher/launcher.log` 不是允许动作；只记录测试起始 offset，结束后读取新增段并核无敏感值。

### B1-DESK-01 Main 采证步骤

1. 开始全屏录屏，画面先显示 Finder 路径栏和 app 名称。
2. 用鼠标指针在 Finder 中对 `.app` 图标执行真实双击。**禁止**使用终端 `open`、`exec`、LaunchServices 命令、脚本点击、Dock 最近项目或浏览器书签代替。
3. 记录控制窗出现及初始 S0/S1；点击“打开 PM 工作台”。
4. 若端口未启动，记录 S2 三步进度；若已有已识别隔离服务，记录“打开现有服务，不重复启动”。
5. 记录浏览器 A 收到工作台页面；URL 截图不得暴露 token/nonce。
6. 待受认证工作台真实 mount 和 snapshot ready，记录控制窗由 S3 进入 S4。不得点任何“我已进入”类替代按钮。
7. 关闭控制窗或 tab，确认已 ready 的隔离服务仍在；正式“不杀”清单中的 PID/端口全部不变。

### B1-DESK-02 Main 采证步骤

1. 在同一次真实 Finder 启动形成的 control 实例上测试回告负例；nonce 仅在内存/受控请求中使用，不写日志和报告。
2. 依次记录：
   - 错 Origin → `403 origin-not-allowed`
   - 非 JSON → `415 unsupported-media-type`
   - 坏 JSON → `400 bad-request`
   - 缺失/错误 nonce → `403 invalid-nonce`
   - 合法 nonce 首次回告 → `200` 且 S4
   - 同 nonce replay → `403 invalid-nonce`
3. 新开一次 Finder 启动但不提交合法回告，等待超过 120 秒，再提交该 nonce → `403 invalid-nonce`，状态不得进 S4。
4. `/api/action`：错浏览器 Origin → 403；无 Origin 且无 CSRF nonce → 403；control 自身 Origin 的合法动作可执行。GET `/api/state` 只读，不触发动作。
5. 浏览器 B 首访工作台 authority：记录真实 401/认证门，不得显示 S4 或伪称已登录；浏览器 A 的认证状态不得复制给 B。
6. 在另一次端口未 ready 的 Finder 启动中，控制窗一出现立即点“取消打开”；记录只回收该 launcher 自己拉起且尚未 ready 的精确 PID。
7. 对已 ready 实例再点取消/关闭控制窗，确认不杀 ready 服务；正式“不杀”清单仍全部存活。

安全负例可用浏览器开发工具或受控本地请求发送，但**启动动作本身仍必须来自 Finder 指针真实双击**；不得用 `open` 命令先启动再补录 Finder 画面。

### 可观测结果

- Finder 双击确实启动 `.app`；S4 只由受认证 mount 的有效 single-use nonce 回告触发。
- 错 Origin、格式、nonce、replay、TTL 和跨浏览器未认证均诚实拒绝。
- cancel 只回收自有未 ready PID；已 ready、正式和未知 PID 不受影响。
- launcher 新增日志不含 token、cookie、nonce 或完整认证 URL。

### 保护与判定

- **PASS：** Finder 原始录屏、S0/S1→S3→S4、全部安全负例、跨浏览器认证和 cancel PID 证据齐全。
- **FAIL：** 用命令冒充 Finder、无有效回告进 S4、任一负例被接受、认证被跨浏览器复制、cancel 杀错/杀 ready 服务或日志泄密。
- **BLOCKED：** Main 无桌面指针/录屏能力、app hash 不符、隔离 client bridge 未装载或无法建立安全的双浏览器上下文。

## 10. B1-PATH-01 / 02 export 与 settings 路径配对

### 10.1 候选与四格路径

从同一冻结候选复制出四个独立树并各自构建；不得共享 `lib/`：

| 格 | 仓根示例 | 目的 |
| --- | --- | --- |
| P0 | `/tmp/pmtool-batch1/plain/pm-tool` | 普通路径、仓名为 `pm-tool` |
| P1 | `/tmp/pmtool-batch1/with space/pm-tool` | 只增加父目录空格 |
| P2 | `/tmp/pmtool-batch1/plain/wt-candidate` | 只改变仓目录名 |
| P3 | `/tmp/pmtool-batch1/with space/wt candidate` | 含空格 detached/改名路径，复现最严条件 |

P0/P1 是用户要求的必跑配对；P2/P3 用于把“空格”与“硬编码 `pm-tool` 路径段”拆开。四格必须有相同基线、补丁、新文件、依赖锁和源码 sha256。

### 10.2 通用前置与保护

1. 每格设置独立临时 `TMPDIR`，并清除 `PM_DATA_ROOT`、`DSH_PM_BACKUP_DIR`、`DSH_PM_FILE_ROOT`、`DSH_PM_ISOLATED_ROOT`、`DSH_HOME`、`DSH_DEV`。
2. 每格构建前后记录 `git diff --check`、build exit、`lib/index.js` / `lib/core/export.js` sha256。
3. 对正式 `data/`、`packages/backups/`、`packages/backup/`、`exports/`、`assets/` 建 before manifest；四格全部结束后建 after manifest，必须零变化。
4. 每次命令记录 `pwd -P`、Node/pnpm 版本、stdout、stderr、exit 和临时根文件清单。
5. 不因某格失败而停止后续格；四格全部跑完再分类。

### 10.3 B1-PATH-01 `verify-export.mjs`

每格在其 `packages/dsh-pm-tool` 目录执行：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node scripts/verify-export.mjs
```

额外记录：

- `defaultExportDirectory` 的实际绝对值。
- 脚本自建的含空格输出目录、报告和备份文件权限。
- Markdown / JSON 导出、覆盖保护、confirm 覆盖、失败清理是否完成。
- 失败若只来自 `assert.match(defaultExportDirectory, /\/pm-tool\/exports/)`，单列为“测试设施的路径名假定”；不得据此宣称导出产品失败。

### 10.4 B1-PATH-02 `verify-settings.mjs`

每格在其 `packages/dsh-pm-tool` 目录执行：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node scripts/verify-settings.mjs
```

额外记录：

- 父进程 D 段写入后的临时 root。
- `spawnSync(process.execPath, [script, '--reopen', root])` 的 argv、status、stdout、stderr。
- 子进程是否读回 `reminderWithinDays=14`、`loadOverloadThreshold=6`。
- E 段读取 `src/index.ts` 等源码时解析出的绝对路径。
- 若业务读回已成功而静态源码读取失败，单列为“测试设施路径解析”；若全新进程无法持久化读回，则列为产品行为失败。

### 10.5 配对分类与判定

| 观测 | 分类 |
| --- | --- |
| P0/P1/P2/P3 全部 exit 0，正式资产零变化 | 当前候选路径收口 PASS；R4 两项旧失败由旧冻结布局造成，不沿作产品失败 |
| P0 通过、P1 失败，且失败发生在业务操作/持久化 | 产品可移植性 FAIL（空格路径） |
| P0/P1 通过、P2/P3 仅静态路径断言或源码读取失败 | 测试设施 FAIL（仓名硬编码），产品行为不得据此判 FAIL；独立完整回归门仍未关闭 |
| P0/P2 通过、P1/P3 仅静态路径读取失败 | 测试设施 FAIL（空格处理） |
| 任一格实际导出、权限、覆盖保护、重启读回失败 | 对应产品行为 FAIL |
| P0 也失败 | 先判当前候选/共同环境 FAIL；不得把 P1/P3 的路径差异当唯一根因 |
| 任一正式资产变化 | 隔离保护 FAIL，立即停止后续写操作并保全现场 |

单项 **BLOCKED** 只用于候选无法冻结、依赖无法安装或四格目录无法安全建立；脚本 exit 1 是 FAIL，不是 BLOCKED。

## 11. 总体收口口径

### 11.1 单项结论

- **PASS：** 候选、fixture、服务、步骤和原始证据完整，且该项所有可观测结果满足。
- **FAIL：** 在绑定候选上完成步骤后出现与预期不符的可复现结果；必须写清“产品行为 / 测试设施 / 隔离保护”对象。
- **BLOCKED：** 用例未能执行或证据无法绑定；不得暗示产品好坏。
- **NOT_RUN：** 尚未开始。本文发布时所有项均为 `NOT_RUN`。

### 11.2 批次结论

- 所有必跑项 PASS，且路径设施问题已关闭，方可给“第一批现有候选验收收口 PASS”。
- 任一产品行为 FAIL、测试设施 FAIL、隔离保护 FAIL 或一般 BLOCKED，批次不得 PASS。
- 仅确实需要项目所有者本人权限的步骤可按 ADL-047 记 `MANUAL_PENDING`；本计划中的 Finder Main 能力、普通浏览器和本地路径实验不默认属于本人项。
- 任何修复都会使对应项及受影响相邻项证据过期；重新冻结后复验。

## 12. 执行顺序与交付

1. 冻结候选并完成 §2.2、§3 的身份与保护清单。
2. 先跑 B1-PATH-01/02，确认冻结树和隔离设施可用。
3. 生成并导入合法长历史 fixture；执行 B1-GUI-04。
4. 执行 B1-GUI-01、B1-GUI-02、B1-GUI-03。
5. 最后执行 Finder B1-DESK-01/02，避免桌面状态影响前述浏览器证据。
6. Main 提交原始证据清单和 sha256，不给结论。
7. 独立测试专家核证，另写执行报告，逐项给 PASS / FAIL / BLOCKED 及批次结论。

本计划不授权修复、提交、推送、正式切换或发布。

## 13. 接续审证纠正：Finder 隔离 artifact（2026-10-21）

> 本节保留 §2、§3、§9 的原始条款与旧对象，记录前置核验发现及修复后重冻结决定。仅本节对后续 B1-DESK-01/02 的 artifact 路径和哈希作替代绑定；其他候选、步骤、保护与判定条款不变。本节不是 GUI 执行记录，也不给最终 PASS。

### 13.1 只读核验事实

独立审证者只读核对了原计划、两个 app 壳、`launcher/scripts/make-app.mjs`、`launcher/src/local-app.mjs` 及其启动链。未双击 app，未启动或停止服务，未执行 GUI。

| 对象 | 核验结果 |
| --- | --- |
| 旧 app | `/Users/bytedance/Documents/dsh-pm-tool/本地启动器候选-20261021/PM工作台-隔离验收.app` |
| 旧 `launch` sha256 | `a7289c013284416f2a5c6289fdbf717099507722d9a230a1344a4c7f0604a3a5`，与 §2 一致 |
| 旧 `Info.plist` sha256 | `24048be9a4cdc1f8f6c0b053f3b53752052b61f0a0e1e9a3f3dde87e47ce4063`，与 §2 一致 |
| 旧壳绑定 | 仅有 `PM_HOST=127.0.0.1`、`PM_PORT=3199`，没有 `DSH_HOME` |
| 新 safe app | `/tmp/pm-batch1-closure-20261021/isolated/app/PM工作台-隔离验收-safe.app` |
| 新 `launch` sha256 | `320e31ce42ac9aa9542b8b1191d8d0d0e58c22d5c383175c2b55e41b97ae941a` |
| 新 `Info.plist` sha256 | `10c93d8514c81e0f237826e53a841da0101e4d97f3a95305b0d827be3b08079e` |
| 新壳绑定 | `PM_HOST=127.0.0.1`、`PM_PORT=3199`、`DSH_HOME=/tmp/pm-batch1-closure-20261021/isolated/dshhome` |
| 临时 profile | `profiles/pm/cordis.patch.yml` 的 `storage-json.root` 为 `/tmp/pm-batch1-closure-20261021/isolated/data` |
| 临时 profile 指纹 | `cordis.yml` `c300dcf2ebc5f02062d6591268d29d3db6fe45e0cb138f5467276fe2ba06076e`；`cordis.patch.yml` `264242efd144de9c9613da2d43b25b571c146787d5862e47b06d29f8c11a1e37`；`package.json` `25ce3ebd942758bf85b557cd4fa1e7e7a5bdb8ac931fde2b98e491786906af6f` |
| 生成源码 | `make-app.mjs` `37dd96cc3acbab7aa67bab324b13cb914d23e18cc4b2c140357c2a3f38831512`；`local-app.mjs` `334032cc4a0f5b86fac002b2b0e8f6f406b725ae27cdfc959c2056588c0099dd`，均与 §2 一致 |
| Launcher tracked diff | `633ff5ef5a6bd18ed2cf978e1f5deffba54b1a5deb90c3a647b23cbde35b19ce`，与 §2 一致 |

源码链的可观察合同是：`make-app.mjs --dsh-home` 把值交给 `buildLocalAppBundle`；`local-app.mjs` 经白名单校验后写成壳内 `export DSH_HOME=...`；壳再执行同一 launcher。因而在目标端口未运行、launcher 自拉起 dsh 时，子进程可继承该独立 `DSH_HOME`。这不替代执行前对真实 argv、环境、profile、storage 根和 PID 的核验。

### 13.2 裁决

1. **旧 artifact 对 B1-DESK-01/02 均记 `BLOCKED`，对象为“隔离前置 / 候选绑定失败”，不记产品行为 `FAIL`。**
   - §3.4 与 §9 前置要求独立 `DSH_HOME`，旧壳没有该绑定。
   - 当 3199 未运行时，旧壳会让 launcher 沿默认用户环境启动 `profile pm`，无法证明不会落到 `~/.dsh` 和正式数据。
   - Main 在发现前置不成立后没有双击，故用例尚未在该对象上执行，没有可据以判产品行为 `FAIL` 的运行结果。
   - 旧路径和哈希保留为纠正历史，自本裁决起禁止再作为 Finder 采证对象。
2. **新 safe artifact 允许作为修复后的重冻结对象。**它由 §2 已绑定的现有生成源码产生，没有覆盖旧 app，壳内增加了独立 `DSH_HOME`，临时 profile 的 storage root 也已隔离。
3. “允许重冻结”不等于该对象已 PASS，也不表示 §3 全部前置自然满足。Main 必须完成 §13.3 的重新冻结和现场核验；任一值不符或无法证明实例隔离，B1-DESK-01/02 继续记 `BLOCKED`，不得双击后再补绑定。
4. 旧对象的 `BLOCKED` 是历史裁决；新对象完成重新冻结后，B1-DESK-01/02 作为修复后新执行轮从 `NOT_RUN` 开始。最终结论只能由独立测试专家依据新一轮原始证据另行给出。

### 13.3 新 Finder 绑定与执行前置

后续 §9 中的 app 路径与两个 app 文件哈希替换为：

```text
/tmp/pm-batch1-closure-20261021/isolated/app/PM工作台-隔离验收-safe.app
Contents/MacOS/launch:
  320e31ce42ac9aa9542b8b1191d8d0d0e58c22d5c383175c2b55e41b97ae941a
Contents/Info.plist:
  10c93d8514c81e0f237826e53a841da0101e4d97f3a95305b0d827be3b08079e
DSH_HOME:
  /tmp/pm-batch1-closure-20261021/isolated/dshhome
storage-json.root:
  /tmp/pm-batch1-closure-20261021/isolated/data
```

Main 在开始录屏和双击前必须逐项记录：

1. 重新计算 safe app 两个文件、临时 profile 三个文件、§2 launcher diff 与新文件 sha256，必须与 §13.1 一致；同时按 §2.2 重核 client bridge 和本次 bundle。
2. 核验 `launch` 中仅绑定预期的 `PM_HOST`、`PM_PORT`、`DSH_HOME`，且 launcher、Node 绝对路径仍属于本次冻结候选。
3. 核验临时 `profiles/pm` 实际由上述 `DSH_HOME` 解析，`dsh-pm-tool` 链接指向本次冻结候选，storage、backup、export 根全部位于 `/tmp/pm-batch1-closure-20261021/isolated/`；任一根指向正式位置即停止。
4. 对 3199 做现场身份核验：
   - 若未监听，记录未占用证据；双击后的 owned dsh 必须记录精确 PID、argv、cwd、`DSH_HOME` 与 storage root。
   - 若已监听，只允许在 PID、argv、cwd、`DSH_HOME`、profile、bundle 和 storage root 全部证明属于本批同一冻结隔离实例时继续；否则停止并记 `BLOCKED`，不得让 launcher 打开未知服务。
5. 建立正式服务、正式 profile、正式数据的 before hash+mtime 与“不杀”清单；完成后按 §3、§9 采 after 清单。不得清空 launcher 日志，只记起始 offset。

### 13.4 修复后 Finder 步骤绑定

满足 §13.3 后，B1-DESK-01/02 沿用 §9 的全部步骤、负例、证据和判定，仅作以下路径纠正：

1. Finder 路径栏必须显示 `/tmp/pm-batch1-closure-20261021/isolated/app/`，图标名必须为 `PM工作台-隔离验收-safe.app`。
2. 鼠标真实双击该 safe app；禁止双击旧 Documents app，也禁止用 `open`、终端、脚本点击或 Dock 项目代替。
3. 若 3199 未运行，必须观察并记录由 safe app 自拉起的隔离实例；运行身份须与 §13.3 记录一致后，才继续 S2→S3→S4 与安全负例。
4. 若 3199 已有经 §13.3 证明的同批隔离实例，记录“打开现有隔离服务”；不得把其他 3199 实例当作同一对象。
5. 证据目录的 `candidate.txt` 同时写入旧对象 `BLOCKED` 裁决引用和新 safe 对象完整绑定，防止两轮对象混淆。

截至本节写入时，新 safe artifact 仅获准进入重冻结与采证，B1-DESK-01/02 尚未执行，批次状态不得写为 PASS。

## 14. 接续审证纠正：B1-GUI-02 缺 code 前置不可合法构造（2026-10-21）

> 本节保留 §6 原始条款作为纠正历史，仅替代 B1-GUI-02 的 fixture、步骤、可观测结果与判定口径。此次只读核验未执行测试、未启动服务、未采 GUI 证据，也不给 PASS / FAIL / BLOCKED 结论。

### 14.1 只读核验事实

独立测试专家只读核对了当前 `src/core/task.ts`、`src/core/backup.ts`、`src/client/views/tasks.tsx`、`tasks-clipboard.ts`、`tasks-clipboard.test.ts` 和既有 D-05 组件契约测试，并回看任务 schema 最初引入提交 `323967ea9b3d0390d299da941911ea378938e552`：

1. 当前 `taskRecordSchema` 是 `z.strictObject`，`code` 为必填字符串，且必须匹配 `^\d+(?:\.\d+)*$`；最初引入任务 schema 时也是同一必填约束，不存在“早期合法无 code 任务”版本证据。
2. `backup.ts` 的标准恢复只接受 `formatVersion: 1`。恢复写入前，`precheckBackup` 会把 `backup.tasks` 每一条交给当前 `taskRecordSchema.parse`；缺 `code` 的任务会在任何恢复写入前被拒绝。
3. 当前恢复兼容只覆盖备份 envelope 的旧可选段、白名单 extra 表和明确归一化的旧汇报字段；没有任务缺 `code` 的迁移器、归一化器或受支持旧版 fixture 入口。
4. `tasks.tsx` 确实保留 `const handle = wbs || t.id`、`pt-code-btn-missing` 和缺 code 提示文案，属于防御性组件 fallback；但当前产品强 schema 与标准恢复入口不能合法形成该运行态。
5. 既有契约已分别覆盖：
   - D-05 组件静态契约：WBS code 优先、缺省回退 `t.id`、missing 样式、固定列宽、焦点样式和失败提示接线。
   - `tasks-clipboard.test.ts` 纯函数契约：`writeText` resolve 返回成功，reject 或 Clipboard API 缺失返回失败，不抛错、不假成功。

### 14.2 裁决

1. **撤销 §6“合法存量缺 code 记录”的 GUI fixture 要求。**该前置在当前候选及可追溯初始任务 schema 下不可合法构造；继续要求会迫使执行者手改 JSON、绕过强 schema、改 DOM/React props，均违反本计划的数据与证据规则。
2. **没有可替代的合法旧版本迁移 fixture。**除非未来产品代码新增并冻结一条明确的任务迁移入口，否则不得以“legacy”名义注入缺 `code` 任务。
3. **B1-GUI-02 的真实 GUI 范围改为两条合法、不同 code 的任务。**用于同时观察宽屏编号列多行布局、键盘复制成功态及拒绝权限失败态；不再把缺 code fallback 作为可达 GUI 行为验收。
4. **缺 code fallback 仅保留为现有纯函数 / 组件契约验证项。**Main 不在本轮补跑、改写或扩展这些测试；后续执行完整自动化门时可引用其原始输出，但静态/纯函数结果不替代本项真实宽屏 GUI 证据。
5. 本裁决是测试计划前置纠错，不是产品缺陷判定，也不表示 B1-GUI-02 已执行或已通过。

### 14.3 替代 §6 的前置 fixture

- 同一项目通过产品正常入口创建至少两条任务，两条都必须通过当前 `taskRecordSchema`，例如 WBS code 分别为 `1`、`2`，标题长度明显不同。
- 禁止删除、置空或伪造任一任务的 `code`；禁止直接编辑 JSON、storage、snapshot、DOM、React props 或网络响应。
- 浏览器剪贴板权限正常；另准备一个新浏览器上下文，在权限面板中拒绝剪贴板，用于失败反馈。
- 视口固定 `1440×900`、100% 缩放；不接受窄屏卡片证据替代。

### 14.4 替代 §6 的 Main 采证步骤

1. 宽屏打开任务列表，截图须同时包含表头“编号”、两条合法任务的编号单元格和任务标题列。
2. 对两行分别读取 `.pt-code`、`.pt-code-val`、任务标题 bbox；记录两个 code 均非空、各自与产品数据一致，编号列未覆盖任务列，长短标题均未被编号按钮叠压。
3. 键盘 Tab 到第一条任务的复制按钮，记录可见焦点环，按 Enter。
4. 在允许剪贴板的上下文读取粘贴板，确认值严格等于第一条任务 code；记录按钮显示“已复制”，约 1.6 秒后恢复 code。
5. 对第二条合法任务重复键盘复制，确认剪贴板值严格等于第二条任务 code，且两行反馈状态不串行、不改任务数据。
6. 在拒绝剪贴板的上下文对其中一条合法任务点击复制；记录“复制失败”及可手动选择提示，确认没有“已复制”假成功。
7. 保存本项自动化契约引用清单：D-05 组件契约测试与 `tasks-clipboard.test.ts`。只引用执行者在完整自动化门中产生的原始日志；本 GUI 步骤不临时运行测试，也不据此判断 fallback 的真实可达性。

### 14.5 替代 §6 的可观测结果与判定边界

- 宽屏两行编号格均显示各自合法 code；列宽、标题列、复制按钮和焦点环无裁切、覆盖或误触行打开。
- 两条任务成功复制值分别正确，瞬时反馈不串行；拒绝权限时诚实失败，不改任何业务数据。
- **PASS 条件（供后续审证使用）：**上述真实 GUI 结果和原始证据齐全，且同一冻结候选的既有 D-05 组件契约、剪贴板纯函数契约在完整自动化门中有可绑定的通过日志。
- **FAIL 条件（供后续审证使用）：**合法 code 显示为空/错位、复制值错误、行间状态串扰、失败假成功、点击导致行打开或业务数据变化；自动化契约若实际运行失败，也按其对应对象记 FAIL。
- **BLOCKED 条件（供后续审证使用）：**无法提供 1440px 真实浏览器、无法控制/核验剪贴板权限，或无法通过产品正常入口形成两条合法 code 任务。
- 缺 code fallback 不属于本轮真实 GUI PASS / FAIL 对象；不得因为无法合法形成该状态而把 B1-GUI-02 记为 BLOCKED，也不得用静态契约声称该 fallback 已获真实 GUI PASS。

### 14.6 执行顺序更新

§12 第 4 步中的 B1-GUI-02 按 §14.3～§14.5 执行。Main 在 `steps.txt` 明确写入“缺 code GUI 分支依 §14 撤销，未注入非法记录”，并将 §6 原 fixture 标为历史纠正对象；其余执行顺序、候选冻结、证据格式及角色边界不变。
