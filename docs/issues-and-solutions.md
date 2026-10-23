# 踩坑与解决方案档案 issues-and-solutions.md

> 本文件记录搭建与开发过程中遇到的「问题现象、根因、解决办法（含可复制命令）」；给维护者与迁移者排错使用，避免同一个坑踩两次。

运行环境默认：macOS（Apple Silicon）+ zsh + nvm Node 22 + pnpm（corepack）。

---

## ISS-046 ｜ 新DOM用例的CommonJS解析绕过ESM alias、80ms异步断言在并发回归下未就绪（2026-10-23，trae）

- **实际失败**：[任务/人员组合回归](plans/2026-10-23-combined-tasks-people-regression.md#1140实际回归封交)DOM原41绿，但首读/confirm两组`createRequire(import.meta.url)`找不到jsdom、collect为0，整阶段exit1。原95verify另唯一P0 `x6.gapsOnBareDone`在固定80ms等待后只读到“暂无复盘草稿”、整聚合exit1；其余94与五保护根零变化。
- **设施修复**：ESM alias不作用于Node `createRequire`。仅自有Vitest变换该两测试的require锚为已冻结dom-deps位置，不改源码、oracle或依赖；续9+11=20绿，原41不重跑。负例测试临时软链封件按link文本登记，不随链读外域、不删原负例。原所有失败收据保留。
- **异步限制**：P0全并发结束后同原脚本/同env、无改80ms等待串行复验28/28退出0。只证实两轮真实不同结果，负载造成钩子延迟的因果尚未独立签，不据此改产品或断言。后继此脚本串行安排；若再次失败按原失败门调查，不以再试多次凑绿。
- **当前门**：组合1869件真实封回0；独立完整回归审在途、GUI未签。DOM/verify原exit1保在close及effective补链文件，不能写成“一次全绿”或项目已完成。

## ISS-045 ｜ 甘特 wrapped 原记录正确而状态显示兜底成待办（2026-10-23，trae）

- **确证**：[L8独立报告](testing/l8-gantt-refresh-defect-20261023-r3-report.md)判语义FAIL；原QA-OP/t-0010确为wrapped，PM任务页正确，重进及真实snapshot刷新后甘特仍生成“待办”。不是旧快照或需要再次wrapped写。
- **根因**：`gantt.tsx`左列`ganttStatusText`与条体两套状态分支只覆盖四态；遗漏wrapped落入待办。PNG副行末尾省略仍单列字形BLOCKED，原未排期L8条体aria为NOT_RUN，源码语义FAIL不替这两项GUI证据。
- **最小修复**：依[独立先行合同](testing/l8-gantt-refresh-defect-20261023-r3-test-plan.md)与[设计](plans/2026-10-23-l8-gantt-repair-design.md)，补“已收尾 · 非正式完成”、条体复用同映射，done仍仅done。开发两文件修复/46窄测已声明，真实交付封件/独立SOURCE-AUTO及新整包/GUI尚待，不标缺陷关闭。
- **避坑**：新枚举必须核每个消费点；后端返回五态不证明页面五态齐。刷新产生宿主会话缓存可单列，不机械要求全data相同、不删cache“修”业务零写；原gantt保护断言真实1保留。

## ISS-044 ｜ 状态选项已更新却菜单再开，首次保存实际被遮罩挡住（2026-10-23，trae）

- **现象与证据**：[F02原独立GUI审证](testing/six-repairs-pointer-gui-review-20261023-r1-report.md)确认选planned/accepted后菜单持续，首save中心实际命中backdrop，后台保存NOT_REACHED。不能因脚本目标是button而称submit已触发。
- **诊断**：后补443原生被动trace中，真实option span detail1可信click先closed；随即无Main输入的trigger button detail0可信click再open，defaultPrevented均false。外label默认激活为Main工程诊断，独立因果审证在途，不回填旧报告为当时已证。
- **最小修**：仅option onClick先preventDefault再原choose。真实DOM D08/D09从defaultPrevented=false两必要红→同test9绿，原28专项绿；原7不变、其余523输入同。[开发交付及命令](plans/2026-10-23-f02-option-default-development.md)。独立新SOURCE/AUTO与新候选GUI未完成前不标缺陷关闭。
- **避坑**：关闭React状态不证明浏览器默认动作后仍闭合；stopPropagation不能替代取消默认动作。JSDOM公开事件标志与真实浏览器时序分层验证；首save先记录实际坐标命中，不能第二点/键盘绕路洗首点失败。

## ISS-034 ｜ Finder 启动器复验停 S3 或启动超时：预启动实例旧认证与临时 App 的 DSH_HOME 拼写混用（2026-10-21，trae）

- **现象**：手工重启 3199 后再让 launcher 复用服务，页面壳可见但 PM `web snapshot` 长时间等待，按契约不应回告 S4；改由 launcher 自拉起时又超时进入 S6。
- **根因**：前者是浏览器保留旧实例认证而当前服务命令通道未完成鉴权，不能用“页面壳可见”代替 snapshot ready；后者是临时 `.app` 烤入不存在的 `isolated/dsh-home`，实际隔离 profile 在 `isolated/dshhome`，子进程因缺 profile 退出。
- **解决**：释放隔离端口后，用正确 `--dsh-home` 重制临时 App，再由 Finder 双击→控制页点击打开，让 launcher 自拉起 dsh、捕获本次 authenticated URL、首次配置后打开 PM 面板。真实 snapshot 完成后自动 POST，控制端 S4，地址栏 hash 清除。
- **边界**：手工 curl/控制台 POST 只能定位 CORS/receiver，不能计作真实 S4 旅程；临时 PID/端口和 App 路径不是稳定配置，接续必须重核。正式 3172 不参与该旅程。
- **状态**：已按正确隔离环境复验闭环，待独立专家审证。

## ISS-033 ｜ Launcher 控制页只有标题和页脚：服务端 helper 未注入浏览器内联脚本（2026-10-21，trae）

- **现象**：Finder 真实双击 `.app` 后 launcher 进程和 loopback 控制端都已启动，`/api/state` 为 S1，但窗口正文为空，只剩标题栏与“仅在这台 Mac 上运行”，无法点击“打开 PM 工作台”。
- **根因**：`renderControlHtml()` 返回的浏览器脚本调用 `esc()` 和 `svg()`；这两个函数原先只定义在 Node 模块作用域，不会自动进入生成 HTML 的浏览器作用域。首轮 `render()` 抛 `ReferenceError`，既有测试只查 HTML 字符串，未真正执行内联脚本，因此漏出。
- **修复**：把既有 `ICONS` 安全序列化进客户端脚本，并在脚本内定义 `esc/svg`；`control-html.test.mjs` 用 `node:vm` + 最小 DOM stub 真执行生成脚本，断言 S1 正文出现“工作台已在运行”和“打开 PM 工作台”。
- **验证/边界**：专项 5/5、launcher 全套 43/43、Finder 二次双击正文恢复。该修复只解决空白页；真实 PM mount 后 S4 回告仍未闭环，单列待独立判定，不用本条冒充完整启动旅程通过。

## ISS-032 ｜ 本人协作包扩大、候选身份与局部完成摘要错位（事后补记：2026-10-21，trae）

- **现象**：八组用户验证实际6组失败/1组通过/1组未测；原人工包含备份路径、长删除文、认证后全页、模式入口等；另一批主端回报主要验收完成，用户觉得没改，随后撤回全页面落地。事实 P-100/119/120/146/149。
- **校验结论**：本人认证与全轮GUI是不同责任；可信J/K不证明当时Space/390全链可用。B1默认OFF本来符合试点合同，强证据是摘要扩大范围，不能以OFF单独判开发违约。HEAD/version不代表未提交候选或浏览器页面；错对象、漏提交的旧测试判定已撤回。
- **规避**：逐用例写候选、对象、提交点、能力与本人必要性；源码/产物/运行/开关认领；底座、试点、子项PASS与全量分别回报，按影响继承证据。禁止用更严未生效提议追溯违规。
- **状态/边界**：仅补记历史机制，不新增产品PASS/FAIL；本轮未执行GUI。来源：[原消息与交叉校验](retrospectives/2026-10-21-deep/05-hypothesis-validation.md)、历史独立报告及B1合同；执行规则见collaboration §11。

## ISS-031 ｜ 测试隔离遗漏安全备份根，业务往返成功仍写共享目录（事后补记：2026-10-21，trae）

- **现象**：独立首轮报告记录恢复测试向共享 `packages/backups/` 写50个测试快照，产品恢复往返正确，真实data未被同样证明污染（P-160）。
- **根因与修复证据**：domain隔离而恢复前安全备份回落默认目录；历史后续已补显式backupDir，专家复验共享目录仍81文件且hash不变。50是历史泄漏子集，81是后续总基线，不是再次污染数。
- **规避**：分别列数据、备份、导出、附件字节、缓存、profile和构建写根；WATCH覆盖实际根的新增/删除/内容；不以一个DSH_HOME当所有路径隔离。专家不擅删混合目录。
- **状态/边界**：历史设施缺陷已有修后不新增记录；当前残留是否清理未知，本轮未清点/删除、不新签PASS。来源 `docs/testing/acceptance-report-round1.md` §1/3/4及round2；复盘QA14/OPS09。

## ISS-030 ｜ 看板坐标、显示投影、卡体高度和编辑回写分别失配（事后补记：2026-10-21，trae）

- **现象**：卡型跳过、卡片靠左或重叠、数据撑出slot、数字宽高无法编辑、连续拖动下推；相似措辞出现在不同批次（P-056/079/085/101/102/107）。
- **已校机制**：Map被Object.keys误枚举；响应式投影丢信息却被动反算写draft；slot只设minHeight而卡体自然高度越界；编辑面板挤压触断点与立即夹紧输入。历史修复 `bb5ff2a`、`889f7a9`、`7f44c46`、`ee52d9e` 分别涉及不同层。
- **规避**：canonical/draft/显示投影/DOM分开；被动渲染不写持久布局；显式应用/拖缩完成提交；slot与卡体边界闭合；连续动作、开编辑、切宽、保存/刷新/重启分别验证，长内容内滚还需体验审证。
- **状态/边界**：M01982明确堆叠已解但宽高未解，不能当同一bug未修；后续P107须新复现，不用旧根因代替。各专项结果不扩大为所有卡型/全系统。详见复盘DEV09/10。

## ISS-029 ｜ B8冻结漏声明资源、预载假阳性和内联替换语法回归（事后补记：2026-10-21，trae）

- **现象**：冻结包缺声明的包内 `cordis.patch.yml`，宿主ENOENT；修后同步schemas块未注册，入口不激活；再内联用replace替换串 `$&` 损坏字面量，node语法检查失败（P-157/158/159）。
- **根因与漏出**：profile补丁≠package-local声明资源；真实模块表未注册schemas，但旧验证器提前注入factory替产品补能力；`$&`是替换字符串占位，局部生成代码回归。三个直接机制分案，旧绿在新转换前不能继承。
- **规避**：声明运行时资源与冻结manifest完整匹配；entry-only禁预赠业务factory，允许真实平台依赖及真实async时序；语法→装载图→真实宿主→GUI分层；唯一builder/隔离输出与证据失效索引。
- **状态/边界**：B8文首fix2记录静态闭环，末态保留editor/formula两个async块；不是永久取消懒加载，也不是GUI PASS。本轮未新测，不以中途OPEN宣称当前仍坏。来源 `docs/testing/b8-packaging-fail-20261020.md` 各RUN、复盘DEV06/07/08与QA02。

## ISS-028 ｜ 编辑已有任务整区重建，稳定ID与软删历史被覆盖（事后补记：2026-10-21，trae）

- **现象**：隔离富种子at-1/at-2变at-3/at-4；软删pl-1及两修订消失；active pl-2/rev1变pl-3/rev1（P-154）。
- **根因与漏测**：normalize将existing只用于编号上界，从空out遍历草稿新发ID、固定rv-1，整区覆盖已有事实；此前atomic只测空数组新建，未测已有富历史。active1→1直接证明改号，active多修订塌缩是代码推断，须另验。
- **规避**：编辑按项ops保稳定ID、未提交区/软删/全部修订与引用；新建raw和编辑分别合同；失败零写与历史保全分别测。原QA §7“整批零写/已成功项不回滚”文字归属待专家澄清，执行者不自改用例。
- **状态/边界**：后续B8源码快审记录编辑改ops、raw限create；本轮未复验当前修复。不证明正式数据已损、不得新签PASS。来源 `docs/testing/b2-p3-destructive-draft-qa-20261020.md`、B8快审及复盘DEV12/QA13。

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
- **事务边界（2026-10-21复盘增补）**：父写成功再串行子写不天然构成整批事务；“全部成功才关闭”不等“任一失败整体零写”。本次没有历史中途失败证据，不补造事故；后续涉及统一保存时须明确失败状态与恢复合同。
- **验证**：真实浏览器检查所有控件边界均在容器内；新增和编辑行动项均只点击“保存会议”，重开抽屉后数据完整，控制台与网络无错误。
- **适用场景**：固定宽度抽屉内的多字段子记录，以及父表单需要统一保存多个独立子表单的交互。
- **状态**：已修复。

---

## 待补充（占位）

> 后续按现有最大编号继续追加；历史补记注明当时事实、来源、修后范围与本轮未测边界，不把归纳当新的验收。

## ISS-038 ｜ 微信本机试点 AX -25211 与调用身份权限不一致（2026-10-21，trae）

- **现象**：电脑操作服务报告辅助功能/录屏已授权，但独立 Python 访问微信仍 `AXIsProcessTrusted=false`、AX=-25211。旧试点因此未读取消息。
- **根因证据**：系统设置中的 Terminal、TRAE CN 辅助功能开关为0，而 Computer Use为1；Terminal录屏也未授权。权限按实际运行应用区分，服务获权不替代终端。
- **修复/实测**：开启相关辅助功能；为Terminal触发系统录屏请求，开启开关并按系统提示退出重开。Terminal实际doctor退出0、两权限true、AX0、窗口1（18:52:32+08:00）。不修改TCC/SIP/微信二进制。
- **兼容后续**：微信4.1.15聊天树仍空；本机OCR补齐真实可见画面读取，处理搜索弹层、常用分类、前台事件循环缓存、剪贴板异步、标题图标与图片引用。r13/r14同源码均四群采到，末轮16完整文本消息，25项开发自验符合预期，非独立PASS；初验单群样本保留作历史。
- **剩余边界**：一群重复窗口正文相同但时间分隔漏读，5个窗口条目记gap，不认作真实新增。完整历史、时间上下文/增量完整率、无人值守未验；OCR的watch拒绝，定时关闭。原权限过程 `reports/wechat-pilot-20261021/25211定位修复与实测.md`，最新报告 `reports/wechat-pilot-20261021/四群OCR兼容修复与实测.md`；后续只在独立本机工具核历史与时间缺口，不改PM正式台账。

## ISS-039 ｜ 前置选择的事件生命周期与搜索后提交集合分离（2026-10-22，trae）

- **现象与根因**：真实TaskForm编辑已有任务，改标题后勾前置，`panel.tsx`在函数式updater晚读`event.currentTarget.checked`抛null，宿主卸载PM区域。搜索隐藏已选行时，footer仍1，但DOM FormData为空，原主save真实handler/core按[]正确清空关系。两缺陷相互独立。
- **证据**：[复选必要红](testing/task-predecessor-checkbox-red-20261022-r1-report.md)7项2控绿/1控制失败/4崩红；[真实提交必要红](testing/hidden-predecessor-submit-red-20261022-r1-report.md)5项3控绿/2必要红。GUI107实例完整console/bundle49299栈与前后业务根在CombinedGuiR1。关系丢失的后端证明限内存领域，不夸正式JSON丢失。
- **最小修复**：同步取checked再给updater，主保存用完整checkedIds；搜索只过滤显示，不改后端[]清空合同。[开发交回](plans/task-predecessor-selection-dev-20261022-r1-report.md)四崩目标与真实5提交已绿、受影响182与材料5绿，原C02裸FormData红保留供不同专家裁定。独立修后SOURCE/AUTO/新GUI在途，不能据开发绿签整门。

## ISS-040 ｜ 固定汇报JSON冻结正确，MD遗漏摘录与新围栏展开溢出（2026-10-22，trae）

- **现象与根因**：原renderer只枚举摘要/快照/异常，未消费`report.excerpts`；实际MD1415byte缺两条冻结正文/来源，而源变/软删后报告JSON保全。首次最小修新增六字段字面围栏，用`Math.max(...匹配长度数组)`计算围栏；合法300024字符作者的150000匹配段触发RangeError。
- **证据与修复**：[原13项7控绿6红](testing/fixed-report-export-excerpt-red-20261022-r1-report.md)；[不同复验](testing/fixed-report-export-excerpts-independent-retest-20261022-r1-report.md)原13/54/probes6绿但stress1红。R2只迭代最大段，保作者/正文不截断，[开发74/74/noEmit0](../reports/all-pending-evidence-20261021/ReportExportFenceDevR2/report.md)，另一独立复验及新GUI待；初noEmit设施失败保。
- **避免复发**：输出以已存摘录为准；安全不能通过丢正文实现。可变长集合不展开成函数参数；冻结声明需新增renderer路径，原107+test为108子集，加renderer完整109，不假身份数量。

## ISS-041 ｜ 上层按“Key”文字将AUTH失效原因重写成未配置（2026-10-22，trae）

- **真实链**：修后AIclient将terminal AUTH归一INVALID_CREDENTIAL，提示包含API Key；`commands/ask.ts`的`/Key|密钥/`宽判断又替换PROD_KEY_MISSING。3260本地网关已实际401，Main先误诊环境gate后精确隔离重启仍一样，网关原请求推翻误诊，未需要用户真实Key。
- **证据与修复**：[独立11项8控绿3鉴权红](testing/ask-auth-feedback-red-20261022-r1-report.md)，真实handleAsk→generateDraft→LlmRuntime/pi链；[开发](../reports/all-pending-evidence-20261021/AskAuthDevR1/delivery.md)只按MISSING_CREDENTIAL code/原精确哨兵，原11/相关199绿。不同专家SOURCE/AUTO、新GUI仍待，底层ATF已签的其他断言不撤。
- **避坑**：缺配置、失效凭据、限流用结构化码分别处理；人话中提到Key不构成缺Key事实。先核真实request/terminalcode，再决定环境修复，设施误诊/旧失败保真。

## ISS-042 ｜ EGO连接挂起与日期工具仅改DOM值（2026-10-22，trae）

- **现象**：`ego-browser nodejs`无输出挂起，最小console探针也挂；原PID93439及两探针只挂CLI，服务与浏览器仍在。sample显示CLI在AppKit等待，lsof误读到TRAE Electron资源；不据此断言具体单一变量根因。
- **有界恢复**：只核自有CLI精确PID93439/94075/94303后TERM，未停EGO浏览器25363或任何dsh；清除 `__CFBundleIdentifier / ICUBE_ELECTRON_PATH / ELECTRON_FORCE_IS_PACKAGED / VSCODE_CWD / VSCODE_PID / VSCODE_IPC_HOOK / XPC_SERVICE_NAME / XPC_FLAGS` 后同space13/p3成功。这是八变量组合恢复实测，没有逐一反证哪个变量必要；不改全局配置、不升级/清profile。
- **日期**：RecordsReportForm原生date工具fill显示值，但权威候选仍0/0，后续状态重渲染清空。已有日期兼容问题复现；真实HTMLInputElement原型setter并冒泡input/change后实际生产preview返回3候选。没有React内部setter/伪返回/手造摘录；该辅助是执行设施，不冒已完成原生键盘或chooser门。
- **原证**：`reports/all-pending-evidence-20261021/Successor112GuiR1/`的02/32/33、blocked-cli-exact-stop、真实日期preview事件与747索引；CLI挂起终止、date/locator/snapshot/等待错误保。对外口径须说“组合环境恢复”，不能说“已证明单个应用身份变量”。

## ISS-043 ｜ 档案读取假顶层字段与任务出站真源未接通（2026-10-23，trae）

- **档案已确证根因**：真实反思记录使用 `draft.lines/draft.gaps`；旧 `pickReflection` 读顶层 `lines/gaps`，三种事件的7条known和2条gap全部遗漏。原假顶层测试绿不能证明生产schema可用。独立[红证与合同](testing/p2007-archive-known-gaps-red-20261023-r1.md)绑定192原件，review同源7句正确。
- **档案最小修复**：只读真实嵌套draft，保持身份/事件/原顺序，只选known并保gap；用真实 `reflectionRecordSchema.parse` 三事件补原专项。开发旧5有效红→9/9；[独立SOURCE/AUTO](testing/p2007-archive-projection-source-auto-20261023-r1-report.md)四专项35/35＋字节3/3有限PASS，新宿主archive主链尚未复验，旧FAIL不抹。
- **另一个接线缺陷**：P2历史曾记latestExport待P3接入；当前有效P2002原合同仍要求真实项目audit最近出站位。1690件[独立审](testing/p2-outbound-history-review-20261023-r1.md)已签31/29分流，但任务顶层groupRow无slot、panel未传latestExport、现snapshot无audit投影；不是后端导出失败，也无证归因U4删除。Main已核index现分支，限定index→panel→tasks真源只读接线在途，不改TTL/backup、不新增路由，不提前签修好。
- **避坑**：导出文件完整性逐句回绑真实record；UI prop或旧分支中存在标记不等当前入口能显示。历史deferred与当前生效余链分别记，不自动N/A。以上两个缺陷独立，不用一个绿代另一个门。
