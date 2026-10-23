# 技术知识库 knowledge-base.md

> **本文件记录什么 / 给谁 / 怎么用**：本文件沉淀本项目在 dsh 二次开发中**经实测验证的架构认知、真实 API 用法、有效模式、编码约定与经验结论**；给所有平台的开发者复用，避免重复踩坑、重复试错。踩坑的「现象/根因/解法」放在 `docs/issues-and-solutions.md`（ISS），本文件偏「正确做法与可复制模式」（KB）。每条注明沉淀平台、时间、适用场景与来源；未证实的标【待确认】，不臆造 API。

上游基线：dsh **v0.2.1-alpha.2**（master，只读克隆于 `~/Projects/dsh-pm/deepseek-harness`）。运行环境：macOS + nvm Node v22.23.3 + pnpm 11.28.5。

---

## KB-049 ｜ 隔离DOM依赖须覆盖ESM与createRequire，回归补跑只接未执行或失败项（沉淀：trae，2026-10-23）

- **已实测**：新组合[回归原件](plans/2026-10-23-combined-tasks-people-regression.md#1140实际回归封交)ESM alias能完成原6文件41例，但两新测试的Node `createRequire`仍从主包寻jsdom/react-dom；仅自有transform重锚到现冻结dom-deps，原oracle不改，9/11例实际退出0。不往主包安装依赖或为测试扩产品代码。
- **有效结果与历史分开**：保原collector exit1/原41绿，补执行20绿，机器effective记录61；95verify初94绿和单P0串行补绿同理保原exit1。close不篡改原commands终码，补链必须有准确未执行/失败集合、同候选/原oracle/真实后继收据，放行由独立专家审。
- **计时和效率**：阶段监督后置记录真实childargv/exit，不以“排队成功”当测试成功；full与DOM分cache并行，full夹具生成后才跑报告专项。固定80ms异步脚本串行，不重跑已绿94项；父/command/child计时重叠不加总。

## KB-048 ｜ 长密与历史fixture先走真实写API，再标准预检恢复并分开计数口径（沉淀：trae，2026-10-23）

- **已实测路径**：[F1/FL准备](plans/2026-10-23-f1-fl-fixture-r3-plan.md)及`F1FLFixtureR3`的base/fl/fd真实outer均0。真实addProject/addTask/各领域add/update返回系统ID；collectBackup的新合法历史内容→precheckBackupContent→restoreBackupFromContent→createBackup→precheckBackupFile。隔离无file_assets仍产标准空侧车；带真资产须原路径/侧车链，不能用JSON-only绕字节检查。
- **长度保全**：新FL task title240/description2000、link title200/note500、progress content2000/author80均生产写读回保持；E1三版、E2两版软删、E3独立ID保持。同A四类各20实record，不用建议条目/文字段数充数。新FD另20长姓名负责人，仍A24平面五态；当前运行47根未变。
- **口径分开**：基线甲13任务/open8、乙9/open6、未分配2；people页阈值5与open值产生maxX10，board四段全部已分配任务共享MAX13。FD重新求实值maxX8，不沿用两人轴。源定位见[生产API报告](plans/2026-10-23-f1-fl-production-schema-r3.md)，准备oracle是真函数输出与工程期望，不是GUI/独立功能PASS。
- **边界**：合法历史仅新标准包createdAt/updatedAt连贯值，普通update不能写历史时间；完成材料后再恢复D-8，避免后续资料写刷掉历史。新对象以新别名/ID认领，不伪称找到了缺失原包。独立fixture审证/人员和长密GUI仍后继。

## KB-047 ｜ React DOM诊断先建立JSDOM环境，默认动作与坐标命中分别取证（沉淀：trae，2026-10-23）

- **结论**：JSDOM globals必须先安装再import ReactDOM；React/ReactDOM同来源identity检查放suite后afterAll，避免在setup提前加载ReactDOM改变输入事件特性判断。真实DOM默认动作取消可观察document bubble的defaultPrevented，但不能据JSDOM闭合推定浏览器label默认激活时序相同。
- **适用场景**：实际form/overlay/listbox option及子span测试；原布局中的pointer主save。浏览器先采可信事件顺序及实际elementFromPoint命中，分开判“选择未闭”“submit未到达”“后台返回失败”。
- **实证**：[F02开发包与命令](plans/2026-10-23-f02-option-default-development.md) red7+2红/同test9绿/原28绿，两identity同来源、无attachEvent错误；[原GUI审证](testing/six-repairs-pointer-gui-review-20261023-r1-report.md)首save命中遮罩。独立新源门/修后GUI尚待，不以开发绿补验收。
- **隔离**：每轮新inputs/config/cache/home/tmp/output，四声明依赖只读链接并核前后SHA；记录原stdout/stderr/argv/cwd/实际子exit。外层异步工具终码未收须单列，不从文件存在推零。

## KB-041 ｜ 负责人指令检查要有具体触发，澄清不能转嫁工程责任（沉淀：trae，2026-10-21；ADL-058）

- **已授权做法**：执行前核有效范围、授权、候选和测试门；能从上下文补齐的直接补齐。遇实质冲突，引用原句和具体规则，说明受影响动作与后果，问最小问题并继续不受影响工作。完整操作以 collaboration §11.7 为准。
- **反例边界**：高目标、粗略想法、审美偏好、不填模板、反对 Agent 推荐不等于无效指令；“更多 Agent”也不能自动成为拒绝理由。不可把静默、催促或一般实施授权解释为独立 PASS、取消门或全量批准。
- **修改方式**：负责人可以明确改变本人制定的约定或指定范围的特批；原失败仍保留，不能伪造证据。规则检查错误由 Agent 自行纠正，不用复盘给开发缺陷免责。
- **来源与效果**：负责人本次授权、复盘 §7、ADL-058。这里只记录协作方法和授权，尚无“两批效果改善”统计，也没有程序化拦截器。

## KB-040 ｜ Launcher S4 真实验收必须由同一启动器实例建立当前认证、snapshot ready 与 nonce 回告链（沉淀：trae，2026-10-21）

- **正确旅程**：隔离端口先确认未监听；Finder 真实双击 `.app`；控制页从 S0/S1 点击打开；若由 launcher 自拉起，使用它捕获的本次 authenticated URL 完成首次配置；进入 PM 面板并等 `web snapshot` 成功；随后核控制端 S4，同时核目标 URL 已移除 `pm-launch`。两项缺一不可。
- **为什么不能拆证据替代**：页面壳可见不证明命令通道已认证，curl POST 成功只证明 receiver/CORS，单测只证明协议逻辑；只有同一 nonce、同一当前服务、真实 PM snapshot ready 后的浏览器 POST 才能证明完整链路。
- **隔离配置**：测试 App 的 `DSH_HOME` 必须指向真实存在且含 `profiles/pm` 的目录；目录名、软链目标、端口和 PID逐项核对。由 launcher 自拉起时不要先手工启动同端口服务，否则会走“复用已有服务”路径并依赖浏览器现有登录态。
- **来源/佐证**：`client/launch-handshake.ts`、`launcher/src/{launcher-app,loopback,dsh-controller}.mjs`；2026-10-21 Finder 实测 S0→S2→snapshot→S4，地址栏 hash 清除。原始索引 `reports/batch1-closure-raw-evidence-20261021.md`。

## KB-039 ｜ 复盘验证出的边界：真实对象、合法历史、候选身份与完成范围（沉淀：trae，2026-10-21；ADL-057）

- **证据结论**：创建默认值不能侵入 patch；原子写成功不能证明稳定 ID、软删和多修订保全；后端合法状态全集须可读，写选项可以是获批子集；测试提前预载真实宿主未提供的业务 factory 会产生假阳性；网格坐标不相交不保证实际卡体不越 slot；父按钮保存语义须覆盖其承诺的子内容。这些是不同直接机制，不能统称“测试不仔细”。
- **正确用法**：使用真实接口/装载时序、富历史种子、逐项更新合同与完整旅程；分别核 canonical/draft/显示投影/DOM；声明资源、语法、模块表、真实宿主、GUI 各自验证。未提交候选可测试，但须基线提交+dirty补丁+新文件指纹，绑定产物/运行/开关与审签范围。
- **协作模式**：父派单保留原句与对象；源码分片外另设共享资源 owner，整包 build唯一写者或隔离输出；证据按影响索引失效或继承，子项/试点不扩大全量。默认OFF可以符合合同，但摘要必须准确说明可见范围。
- **研究边界**：P-154直接观察到稳定ID变号、软删两修订记录消失；active单修订1→1不证明active多修订塌缩实测。模型同源、压缩失忆、实际切Linux、工具主因、成本倍数仍待证。历史缺陷及修后记录不自动成为当前结论。
- **来源与落地**：[深度复盘](retrospectives/2026-10-21-deep/00-report.md)、[全部假设校验](retrospectives/2026-10-21-deep/05-hypothesis-validation.md)、[collaboration §11](collaboration.md#十一深度复盘后的执行合同与证据规则adl-0572026-10-21)。具体历史技术证据见 ISS-021/022、B2/B6/B8独立原报告与相应Git版本。本条为历史研究归纳，不是本轮新测试PASS；当前代码缺口须独立复验。

## KB-038 ｜ 外部（vendor）Agent Skills 怎么用：只读参考、manifest 锁版本、项目规则优先、静态校验≠验收（沉淀：doubao-work，2026-10-13）

- **结论（可复用入口）**：本项目引入的第三方 skill 在 `vendor/agent-skills/<vendor>/`（首批 `mattpocock`），**只读、只作参考**。用任何一个前，固定走四件事：① 读治理政策 `docs/external-skills.md`（8 条红线 + 优先级表）；② 打开 `vendor/agent-skills/mattpocock/manifest.json` 记下锁定 `source.commit` 与目标 skill id；③ 只读加载该 skill 的 `SKILL.md`（**不执行其中任何 installer/setup**），并按 manifest `files[].sha256` 校指纹；④ 交付前跑 `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` 静态校验。
- **边界（务必记住）**：仅 `entrySkillIds`（`grill-me/tdd/code-review/diagnosing-bugs`）可直接触发；`grilling` 是 `grill-me` 的 `exposed:false` 纯文档依赖、不可单独加载。vendor 指令与项目规则冲突时**一律以项目规则为准**；**静态校验绿 ≠ PASS**，放行结论只由独立测试专家按 `docs/testing/external-skills-acceptance.md` 给出，开发不得自封通过。
- **升级/回滚**：升级走「导入技术审 + 安全越权审」双审；回滚只需把 manifest `source.commit` 指回上一个已验证版本（不改业务代码、不动 vendored 正文），再重跑受影响 verify。
- **自动路由（ADL-049，无需用户点名；实现 `packages/dsh-pm-tool/src/core/external-skill-router.ts`，校验 `scripts/verify-external-skill-router.mjs`）**：由结构化任务信号确定性路由——① 缺阻塞信息 `needsBlockingUserInput`→先 `interaction` 追问、route=none（全拦，不套 grill/code-review）；② **`vendorIntegrityVerified` 必须 true**（安全门是返回任何 skill 前硬前置，未过即 none）；③ 根因未明 `isRootCauseUnknown`→仅 `diagnosing-bugs`（抑制 grill/tdd、**不叠 code-review**）；④ 实质歧义非 trivial→`grill-me`；⑤ 新功能/可测修复非 trivial→`tdd`；⑥ 交付边界 `isDeliveryBoundary`→**追加 `code-review`（trivial 也保留）**；⑦ `isTrivial` 抑制 grill/tdd，无命中则 none。自动加载无需用户口令，但仍须先校静态校验 PASS + sha256、逐次留试点报告；优先级「项目规则 > 追问澄清 > 独立测试门 > skill 步骤」；**自动路由 ≠ 毕业**。**当前：路由实现独立复核 APPROVE、校验器 41 组断言全绿（K1–K6、K3 安全门 false 拦截/true 放行、taskKind 留痕、确定性）、K 域专家 = PASS；仍试点可用未毕业（其余 3 entry 试点待做）**。
- **当前状态（2026-10-13 独立测试专家签发）**：**试点可用，未毕业**。自动化验收门 = PASS（静态/校验用例 A–H、J 全 PASS，无 FAIL/BLOCKED/F1，MANUAL_PENDING 无）；`code-review` 试点 = PASS；其余 3 个 entry（`grill-me`/`tdd`/`diagnosing-bugs`）尚未出试点报告（NOT_RUN），各补 1 份试点报告后方可毕业。绑定：HEAD=`93eb093c20648618c3e1d2914a20340d22325f86`、上游 commit=`49dd158d1076134a641b33efb035946536778336`、manifest.json sha256=`ebb7833967b9dfe7f93f33c848be34f63ecce8c739f2258cb882dbcf2a4f7734`。
- **来源/佐证**：ADL-048、ADL-049；`docs/external-skills.md`；验收结论见 `docs/testing/external-skills-acceptance.md` §7；code-review 试点见 `docs/verification/external-skills/pilot-01-code-review.md`；`vendor/agent-skills/mattpocock/manifest.json`。

## KB-037 ｜ 首页/欢迎页用 `/pm`「没反应」：根因是宿主 composer 斜杠补全截获 + 发送后主区不自动跳转（沉淀：doubao-work，2026-10-11）

- **现象**：所有者反馈在 dsh「首页/欢迎页」对话框里用不了 `/pm`；实际斜杠命令经蓝色发送按钮**是能执行的**，但发送后看起来「没反应」。
- **根因（上游只读证实，【官方明确】）**：`/pm` 注册结构与内置 `command-goal` 一致（`packages/goal/command-goal/src/index.ts`：`name:'goal'` + `input:{hint,attachments}`）；`CommandDescriptor`（`packages/interaction/commands/lib/types/types.d.ts`）只有 `name/description/input`，**插件无法控制**「回车放行」与「发送后主区跳转」。输入「/」触发宿主斜杠命令补全弹窗并**截获 Enter**（KB-036），回车不会直接执行；点蓝色发送按钮可执行，但欢迎页发送后**新建了会话而主区不自动切过去**，故像没反应。
- **正确做法（插件侧可复用）**：（1）斜杠命令一律**点蓝色发送按钮**、发送后到**侧栏点最新会话**查看结果；（2）日常操作优先用常驻可见的「项目管理」Web 面板（本项目已把三 AI 功能 + 增删改全部做成面板按钮），绕开首页 composer 的不确定性。
- **边界**：回车放行、主区自动跳转属宿主行为，插件无扩展点，**不要试图在插件侧伪造修复**；如实记录残留限制（见 ISS-026 / ADL-038）。
- **深挖：为什么斜杠补全里有内置 goal、却没有 pm（上游只读结论）**：补全候选直接来自 host `commands.list(agent)`（`packages/client/ui-commands/src/client/service.ts` 的 `candidates()` 把 list 返回的每个 `CommandDescriptor` 都列成行，**本身不按内置/外部过滤**）。host 侧 `list(agent)` = `layers.merge(agent, layer.commands)`（`packages/interaction/commands/src/index.ts` 的 `view()`），全局注册的命令对任意 agent 生效——我们的 pm 确已全局注册（点蓝色发送可执行即证明）。要在补全里**新增**一行，唯一客户端钩子是 `ctx.commandUi.register(contribution)`，但其与 host 重名时 `candidates()` 会直接抛「contribution collides with a host command」；而 pm 本就是 host 命令，故**无法**用 contribution 让 pm 出现在欢迎页补全。结论：无受支持的插件侧做法，补全列表由宿主按会话/预置缓存决定，保持文档说明即可，左侧「项目管理」GUI 面板是不依赖首页斜杠框的稳定入口。

## KB-036 ｜ 免费池偶发 `This operation was aborted`/超时：现象、根因与中文归一（沉淀：doubao-work，2026-10-11）

- **现象**：真实 openrouter/free 端到端跑 R13/R14/R15 时偶发命令直接抛英文 `This operation was aborted`（或 dsh 步骤超时）。
- **历史解释与边界（2026-10-21复核）**：随机免费池、模型延迟或 dsh 超时可以解释当时中断；同 key 重试成功支持临时性，但不能单独排除并发、网络、配置和凭据状态变化。没有逐调用链时不把该机制作为所有 AbortError 的已证唯一根因，亦不将用户“约80%失败”估计当请求统计。
- **处置**：直接重试一次通常恢复；代码侧已在 `src/core/ai-client.ts` 的 `normalize()` 识别 `name==='AbortError'`、code∈{ABORTED,TIMEOUT,ETIMEDOUT}、或 message 命中 /abort|timeout|timed out/i，归一为 `AiDraftError('MODEL_TIMEOUT', '免费模型响应超时或被中断…请重试一次')`，命令层返回 `{kind:'error', 中文 text}` 且不落库。verify-wbs 已覆盖（stream reject AbortError → 友好中文、不写盘）。
- **Web 自动化经验（斜杠命令提交方式，puppeteer-core）**：dsh 输入框是 **contenteditable `<div>`** 而非 `<textarea>`；输入「/」会触发斜杠命令自动补全并**截获 Enter**，故斜杠命令**必须点蓝色发送按钮提交、不能用回车**；发送后需点侧栏最新会话以加载线程；**不要点「新会话」**。（接 KB-032 的真实 Chrome 驱动法）

## KB-035 ｜ MISSING_CREDENTIAL 排查：dsh 进程环境 vs credentials service（沉淀：doubao-work，2026-10-11）

- **现象**：dsh 网页选 Free Models Router（openrouter-free）发消息报 `llm-pi-ai: no credential for provider route "openrouter-free"; its profile resolves OPENROUTER_API_KEY, which is not set`（`MISSING_CREDENTIAL`）；但 key 本身有效、直连 curl 已 `$0` 成功。
- **根因**：pi-ai 的 `apiKeyEnv` 读的是**启动该 dsh 进程时的进程环境变量**（KB-033）。dsh 是在「往 `~/.zshrc` 写 key **之前**就开着的旧终端」启动的，进程环境里没有 `OPENROUTER_API_KEY`；shell 后来 source 与否、新终端能否 `echo` 到，都不影响这个已运行的旧进程。**不是 key 错、不是网络问题**。
- **诊断边界（2026-10-21修订）**：先确认真实服务 PID、provider 路由和报错所指凭据来源，再比较配置生效时点与进程启动时点；需要查存在性时只输出布尔结果。**不运行输出整个进程环境或真实 key 的命令，不把凭据值带到工具日志、截图或仓库**。新 shell存在key不证明旧进程有key；同一值直连成功也不证明宿主取到正确路由凭据。
- **两种修复**：① 停旧 dsh，用已 `source ~/.zshrc` 的全新终端重启（等价 `pnpm dsh --profile pm`）；② **推荐、且与启动终端无关**：在 dsh Web「设置→模型（Models）」页直接为该 provider 录密钥，写入 dsh **credentials service**（即报错提示的目标），此后任何终端启动的 dsh 都取得到。
- **应用内复测结论**：重启后底部模型选择器选 Free Models Router 发「你好…」**第 1 次即成功**（puppeteer-core + 系统 Chrome 139 无头，KB-032），无 MISSING_CREDENTIAL/401/429。
- **附带观察**：dsh 单轮带较大系统提示/工具 schema，简单问候也约 **9.5K tok**（152 tok/s）；但 OpenRouter 免费档按**请求次数**计（50 次/天）、不按 token 计费，故单轮 token 大对免费额度无影响——只是次数敏感，别让 agent 空转刷屏。
- **来源/佐证**：ISS-024；`docs/model-providers.md` 第 4.2 节；截图 `.tmp/ui-verify/llm-04-result-1.png`（gitignored）。

## KB-034 ｜ openrouter/free 免费自动路由实测行为（随机模型 / 推理型吃满 reasoning tokens / 每日 50 次 / 工具调用不保证）（沉淀：doubao-work，2026-10-11）

- **结论**：OpenRouter 免费自动路由 `openrouter/free` 直连已于 2026-10-11 实测打通（`cost=$0`、`finish_reason=stop`）。它**不是固定模型**，每次请求由免费池**随机分配**一个 `:free` 模型——同一批两次调用就可能落到不同模型（实测：第 1 次 `liquid/lfm-2.5-2.6b:free`、第 2 次 `nvidia/nemotron-3-ultra-550b-a55b:free`）。
- **推理型模型的坑（重要）**：随机落到推理型小模型时，它会先把 `max_tokens` 预算**全部计入 `reasoning_tokens`**，导致 `max_tokens=60` 时**正文为空**。**对策：把 `max_tokens` 给足（实测提到 400 后正常返回正文）**。做生成型功能时这是默认要设的参数，别让默认小值把正文全挤没。
- **免费档限额（已实测 `/key` 返回）**：`is_free_tier: true`、`free_model_daily_requests.limit = 50`（配合官方文档的 20 次/分；key 到期 2027-04-09）。数值会变，以 `/key` 与官网为准。
- **能力边界（维持 ADL-035）**：纯文本问答 `$0` 可用；但模型每次随机、能力参差，**稳定驱动 agent 的 function calling 不保证**。因此核心台账（项目/任务/里程碑/纪要/汇报/交付物）必须保持离线、不依赖此通道；接它的生成型功能按「能跑就跑、失败优雅降级」设计。
- **配置侧回顾**：key 由所有者写在本机 `~/.zshrc`（仓库外、不入库）；启动 dsh 的终端须是已加载 `~/.zshrc` 的全新 zsh，否则 pi-ai 按进程环境取不到 `OPENROUTER_API_KEY`（见 KB-033）。
- **来源/佐证**：`curl https://openrouter.ai/api/v1/key` 与 `.../chat/completions`（`model=openrouter/free`）两次真实调用；ADL-035、`docs/model-providers.md` 第 4 节。

## KB-033 ｜ 第三方 OpenAI 兼容模型走 llm-pi-ai 的 providers 字典，按 id 外挂 config；apiKeyEnv 密钥不入库、也不自动读 .env（沉淀：doubao-work，2026-10-11）

- **结论**：dsh 要接第三方 / OpenAI 兼容模型，用的是**已随 base bundle 装载但默认零路由休眠**的 `@deepseek-ai/dsh-llm-pi-ai`（`id: llm-pi-ai`），**无需额外安装**。在 profile 的 `cordis.patch.yml` 里加一条 `- id: llm-pi-ai, name: '@deepseek-ai/dsh-llm-pi-ai', config: { providers: { <路由名>: {...} } }` 即按 id **整体替换**其 config（app boot 不做深度合并）。
- **providers 条目真实字段**（以上游 `src/config.ts` / `README.zh.md` 为准，勿臆造）：`apiKeyEnv`(环境变量名)、`displayName`、`api`(仅 `openai-completions`/`openai-responses`/`anthropic-messages` 三选一)、`baseURL`、`models[]`(每项 `id` 必填，`name`/`contextWindow`/`maxTokens` 选填)、`compat`、`defaultContextWindow`(缺省 262144)、`defaultMaxTokens`(缺省 32768)、`headers`、`reasoning`、`retryPolicy`。**pi-ai 目录不认识的自建网关**必须同时给 `api`+`baseURL`+非空 `models[]`，否则组合时报校验错。
- **密钥怎么解析 / 放哪**：`apiKeyEnv: OPENROUTER_API_KEY` 经 `ctx.credentials` 先查 dsh 凭据存储记录，查不到再回落到**启动进程环境变量**（`src/auth.ts` 的 `authContextFrom`）。**dsh 不自动加载 `.env`**（上游无 dotenv 依赖），所以 key 必须在启动 dsh 的 shell 里 `export`，或由用户自己写进 `~/.zshrc`（Agent 不代改）。key 绝不入任何入库文件。
- **免费随机模型的能力边界**：OpenRouter 免费自动路由 `openrouter/free`（实测 $0/$0、200k ctx）每次在免费池随机落一个模型——纯文本生成可用，**稳定驱动 agent 工具调用（function calling）不保证**；定位「尽力而为」，核心台账始终离线不依赖它。
- **验证姿势**：改完 patch 用 `DSH_HOME=~/.dsh pnpm dsh --profile pm --dump-config`（上游目录跑）确认 provider 出现、无 `PiAiCatalogError`；无 key 时真实宿主照常启动（configured-but-keyless 只在真正发请求时才 `MISSING_CREDENTIAL`），不会阻塞启动。
- **来源/佐证**：`deepseek-harness/packages/llm/llm-pi-ai/{README.zh.md,src/config.ts,src/provider.ts,src/auth.ts}`；`docs/model-providers.md`（含 9 家预留厂商模板与开通验证 curl）；ADL-035。

## KB-032 ｜ 无 GUI 权限时用 puppeteer-core 驱动本机已装 Chrome（headless=new）做真实点击/截图/主题/窄屏/控制台网络断言（沉淀：doubao-work，2026-10-11）

- **结论**：本角色此前因无本机 GUI 权限，浏览器目视只能依赖所有者手动或退化为 HTTP bundle 探测（KB-028/KB-014）。实测**可以不下载 Chromium、不申请系统辅助功能授权**：在 gitignored 的 `.tmp/ui-verify/work/` 下 `npm i puppeteer-core`（25.13），launch 时 `executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`、`headless:true`（v23+ 即 new headless）、`args:['--no-first-run','--disable-default-apps','--no-sandbox']`，由 puppeteer 托管 `--remote-debugging-port`。这样能**真实点击、输入、处理 `window.confirm` 对话框、全页截图、读 DOM 断言**，不再是只抓 HTML。
- **关键做法**：① goto 带 `?token=` 的 URL（303 自动种 cookie）；② 首次会弹「添加 API Key」引导弹窗，先点「稍后配置」关掉再点侧栏；③ 侧栏条目按 `title/aria-label/textContent` 匹配「项目管理」点击；④ 主题用 `page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'|'dark'}])`；⑤ 窄屏 `page.setViewport({width:786|390})` 后断言 `documentElement.scrollWidth - clientWidth <= 1`（整页不溢出即合格，表格内部 `.pm-table-scroll` 局部横滚是既有约定）；⑥ 全程监听 `console`(error)/`pageerror`/`requestfailed`/`response(>=400)`，并过滤 favicon/fonts/第三方噪音。
- **种子数据**：按 ISS-019 复制 `~/.dsh/profiles/pm` 到隔离 `DSH_HOME`、把 `node_modules/dsh-pm-tool` 软链改指产品包绝对路径、改 `cordis.patch.yml` 的 storage root 到临时目录；再用与 verify-web 相同的 harness（真实 Context + JsonStorageBackend(临时 root) + DomainFacility + apply）跑一个 node 种子脚本，覆盖每类实体后 `closeAll`，再由隔离 dsh 读同一目录——**绝不写真实 `pm-tool/data/`**。
- **适用场景**：以后任何 R* 的 Web 回归都能自动做「逐屏截图 + 控制台/网络零错误 + 看板数值断言 + 浅深色 + 窄屏」，截图存 `.tmp/ui-verify/shots/`（gitignored，不入库）。
- **踩坑**：① 「删除确认」断言要把范围限定到 `.pm-table-frame`，否则成功 toast（含被删记录名）会被误判为「没删掉」；② 全局搜索是子串匹配，造种子时要用标题里**真的包含**的关键字（如「原型」），不要想当然用「风险/交付」这种记录标题里没有的词。
- **来源/佐证**：`.tmp/ui-verify/work/verify-ui.mjs`（本批 27/27 通过、0 console error/0 pageerror/0 failed request）；Chrome 139.0.7258.155 + dsh v0.2.1-alpha.2。

## KB-031 ｜ GitHub 缩进勾选清单 → WBS 树：以「观测到的最小正缩进」为一层，用缩进栈还原父子（沉淀：doubao-work，R12）

- **结论**：解析 `- [ ]`/`- [x]` 清单时，先收集所有清单项的前导空格数，取**最小的正缩进**作为一层（兼容 2 空格/4 空格风格），`depth = round(indent / unit)`；再按文档顺序维护 `栈{depth,id}`，新项深度更浅时弹出对应层级、栈顶即父任务。逐项复用既有的 `addTask`（它自带编号/父级校验/落盘），无需自建编号。
- **适用场景**：把外部任务清单、需求 backlog 批量导入既有 WBS；dry-run 时用 `counters[]` 投影 1/1.1/1.2 结构即可预览，确认后再真正写盘。
- **来源/佐证**：`core/task-import.ts`、`scripts/verify-r12.mjs`（dry-run 不写盘、confirm 落盘、全新进程读回）。

## KB-030 ｜ 跨项目看板/全局搜索优先做成「浏览器端基于 snapshot 的派生」，不新增宿主路由（沉淀：doubao-work，R12）

- **结论**：当 `web snapshot` 已包含全部实体表时，跨项目统计卡片与全局检索**先在 React 端基于 snapshot 做等价过滤/聚合**（与离线只读命令同口径），避免新增宿主路由或索引表；离线侧再提供同名只读命令（`/pm stats`、`/pm search`）。配色一律用宿主 token/既有 `.pm-summary` 卡片，不引入 hex。
- **适用场景**：任何只读的汇总/检索类需求；「写操作」才走命令与领域写队列，只读派生不写盘。
- **来源/佐证**：ADL-029、`client/panel.tsx` 的 `GlobalBoard`/`collectBoardMatches`、`verify-web.mjs` 契约断言。

## KB-029 ｜ storage-domain 内嵌「只增留痕数组」做法（沉淀：doubao-work，2026-10-10）

- **场景**：需要在一条记录内保留版本/状态变更历史（R10 交付物 `history[]`），但 storage-domain 无跨表事务、无二级索引，不想为此单开一张表。
- **做法**：在记录 schema（zod strictObject）里声明 `history: z.array(changeSchema)`，`changeSchema` 也是 strictObject（at/field/from/to/by/note）；更新时在 `enqueueDomainWrite` 内取出 `current.history` 展开为新数组、`push` 新条目后随整条 `put` 回去——**只增不改、不接受用户直接传入 history**（create/update schema 不含 history 字段，strictObject 会拒绝越权字段）。
- **要点**：① 是否追加由「新值 !== 旧值」判定，值未变不追加，避免噪声；② 多个字段同批变化按固定顺序（先 status 后 version）各追加一条；③ 留痕的操作人/说明用独立的瞬态参数 `operator/changeNote`，它们进 update schema 但不进 record schema，不会被持久化为业务列（update schema 的 refine 要排除这两个键再判断「至少一个业务字段」）。
- **适用/边界**：适合条目数量可控、随记录一起读取的审计轨迹；若留痕量大、需跨记录查询/分页，应升级为独立表。同类「内嵌稳定子项」先例：会议纪要行动项（KB 相关 meeting 设计）。

## KB-028 ｜ 无 GUI 时用 HTTP 探测 dsh web：插件 client 资源走合并路由且只认 cookie（沉淀：doubao-work，2026-10-10）

- **结论**：`pnpm dsh --profile pm --no-open --port 0` 随机端口启动后，首页 `http://127.0.0.1:<port>/?token=<t>` 返回 **303** 并种下 HttpOnly 鉴权 cookie，需 `curl -L -c jar -b jar` 跟随；不带凭证访问 `/` 返回 **401**。
- **插件浏览器半侧不是单文件路径**：`/plugins/<pkg>/client.js` 直接请求会 404；客户端 JS 以合并路由下发，形如 `plugins/??<pkgA>/client.js,<pkgB>/client.js,dsh-pm-tool/client.js&rev=<hash>`（首页 HTML 中为**相对路径**、无前导 `/`，且以 `&amp;` 转义，抓取时需补前导 `/` 并 unescape）。
- **想只抓本插件 bundle，用单插件合并路由**：首页 HTML 里另有一条独立条目 `plugins/??dsh-pm-tool/client.js&rev=<hash>`，请求 `http://127.0.0.1:<port>/plugins/??dsh-pm-tool/client.js&rev=<hash>`（带 cookie）即只返回本插件浏览器半侧，R10 实测 200、字节数与 `lib/client.js` 构建产物一致，是断言「跑的是新构建」最省事的抓取目标。
- **合并路由只认 cookie、不认 query token**：对该路由追加 `&token=` 仍 404；必须用 `-b <cookie-jar>` 携带 303 种下的 cookie 才返回 200。
- **用途**：在无法驱动本机浏览器时，用「启动日志确认存储领域打开 + 首页鉴权码 + 抓取运行中实际下发的合并 bundle 并 grep 新功能界面串」证明跑的是新构建、插件已装载（配合 ADL-027 证据组合）。
- **来源/佐证**：R9 独立复核实测（端口 55111）；ISS-019（隔离 DSH_HOME 启动法）、KB-014（loopback/browser-trust 边界）。

## KB-027 ｜ 固定快照报告应存聚合结果而非重新查询源数据（沉淀：trae / TRAE，2026-10-10）

- **结论**：需要历史追溯的进度汇报在生成时把聚合指标、周期事件和异常明细作为不可变快照写入报告记录；Web 和 Markdown 都读取该快照，不能在展示或导出时重新查询当前业务表。
- **实现模式**：生成操作在领域统一写队列内读取项目相关表，计算任务/里程碑/会议摘要和异常项，与人工摘要一起原子写入 `reports`；更新 schema 只暴露人工字段。源数据变化后旧报告不变，再生成一份新报告反映最新状态。
- **适用场景**：周报、月报、阶段复盘、审计留痕等必须保留历史口径的产物。
- **限制**：没有状态事件历史时不能仅凭 `updatedAt` 宣称某任务“本周期完成”；应明确输出“生成时当前状态”，待未来增加事件日志后再扩展周期变更分析。
- **来源/佐证**：ADL-026；`core/progress-reports.ts`、`verify-reports.mjs` 和隔离浏览器前后快照验证。

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

## KB-010 ｜ Web 浏览器半侧（设置卡片/页面）初始调研（沉淀：doubao-work，2026-10-10）

- **结论**：
  - 浏览器半侧包在 `package.json` 声明 `"dsh": { "client": { "inject": [...], "platform": "web" } }`，并导出 `"./client"`（默认 `./lib/client.js`，须为 lazy-CJS factory）；内置先例 `packages/client/ui-schedule`（node 半侧 `src/index.ts` 是空 `apply(){}`，行为全在 `src/client/`）。
  - 设置卡片用 Config schema（schemastery `z.object`，敏感字段 `.volatile()`/`role('secret')`）配合 `form.state` / `form.mutate`；向他人插件详情页贡献区块用 `ctx.slots.inject('plugins.detail.actions'|'badge'|'section', ...)`。
  - **clientBundle 的 tsdown preset 不在发布的 npm 包内**，仓库外的包要自己复刻这一步构建（cookbook 原话）。
- **后续实测结论**：第三方插件新增独立顶级页面已经 R5 验证可行，最终模式与复现证据见 KB-022 / ADL-022。
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
- **对验证方式的指导（可复用结论；能力范围于2026-10-21修订）**：
  - **离线功能回归以包内 `scripts/verify-*.mjs` 确定性脚本为准**——它们装载真实 Cordis + 真实 storage-json + 已构建插件的真实命令处理器，覆盖增查/校验/并发/权限/全新进程重启读回，可重复、可进 CI。
  - **真实浏览器验收需要与宿主可达且受信任的真实浏览器上下文**，Chrome是已约定兼容范围；具体驱动与Main/Sub能力按当时最小探测，不从历史角色限制推断永久能力。不可达的隔离/远端浏览器不冒充本机GUI。离线脚本+宿主日志+产物+读回仅覆盖对应层，**不能替代ADL-045的真实GUI与独立审证**；角色受限时转交具备能力者，确需本人协作的部分按ADL-047单列。
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

## KB-021 ｜ 可再生报告应纯渲染并使用同目录原子写（沉淀：trae / TRAE，2026-10-10）

- **结论**：报告先从 domain 同步快照聚合 Project/Task/Milestone，再由纯函数渲染 Markdown；文件层不回写存储域。默认目录通过 `import.meta.url` 从插件安装位置反推产品仓库，不能依赖宿主 cwd。
- **适用场景**：R4 Markdown、后续 JSON 打包和其他可再生交付物。
- **实现要点**：Markdown 表格内容转义反斜杠/管道/换行；未确认覆盖用临时文件后 `link()` 原子创建目标，确认覆盖用 `rename()` 原子替换；临时文件与目标处于同目录。
- **来源/佐证**：ADL-020；`core/report.ts`、`core/export.ts` 和 `verify-export.mjs`。

## KB-022 ｜ 仓库外 dsh 插件可用动态 bundle 注册顶级 Web 面板（沉淀：trae / TRAE，2026-10-10）

- **结论**：独立插件包只要声明 `dsh.client.platform=web`、导出 `./client`，并把产物包装为 `window.__ModuleLoader__.load({ id, factory })`，就会被 Web Host 扫描进 `__DSH_BOOT__` roster；无需进入上游 monorepo或修改上游源码。
- **实现模式**：客户端向 `main` 注册面板、向 `sidebar.panellist` 注册入口；通过 `remote.commands.execute(sessionId, "/pm ...", [])` 调用 Host。若当前没有会话，可先用 `sessions.create()` 创建，核心业务规则继续只维护在 Host。
- **构建要点**：本包 `tsc` 的 JS 输出是 `lib/client/index.js`，声明输出才在 `lib/types/client/index.d.ts`；`tsdown` 应以前者为 entry，且 `clean:false` 避免清除 Host 构建产物。React 由 dsh 模块系统作为默认 external 提供。
- **验证**：`scripts/verify-web.mjs` 固化 snapshot/manifest/bundle 契约；真实 pm profile roster 包含 `dsh-pm-tool/client.js`，本机浏览器无 Key 完成项目、任务、里程碑 CRUD，控制台和网络无错误。
- **适用场景**：后续给风险、问题、交付物等模块增加 dsh Web 顶级工作台。

## KB-023 ｜ 外部 clientBundle 的样式与图标须内嵌或显式注册（沉淀：trae / TRAE，2026-10-10）

- **结论**：dsh 动态客户端 roster 只加载 `./client` 的 JS；仓库外包不能假设额外 CSS 文件会自动加载。可在 bundle 阶段将 CSS 作为文本读入，并由 React 根组件输出 `<style>`，从而保持单 bundle 交付。
- **图标边界**：`tsdown` 默认把普通 dependency 外部化；dsh 模块表只提供已注册模块，不能直接 `require("lucide-react")`。使用 Lucide 单图标 ESM 入口，并用 `noExternal: [/^lucide-react(?:\/|$)/]` 打入 bundle，可将产物控制在约 60 kB，同时保留 React 为宿主 external。
- **响应式模式**：嵌入 dsh 主布局后，面板右侧宽度可能远小于浏览器视口。表单与统计区优先使用 CSS container query 按工作区自身宽度重排，不能只依赖 viewport media query。
- **来源/佐证**：`src/client/panel.css`、`tsdown.config.ts`、`verify-web.mjs`；真实页面右侧 453px 宽度无横向溢出。

## KB-024 ｜ 嵌入式项目工作台优先让表格局部滚动，编辑放右侧抽屉（沉淀：trae / TRAE，2026-10-10）

- **结论**：dsh 自带全局侧栏会显著压缩插件主面板；项目管理的多字段任务不应在窄宽度下退化成卡片。保持固定表格列语义，让 `.pm-table-scroll` 局部横向滚动，页面根容器不溢出，项目经理仍可横向比较记录。
- **交互模式**：顶部选择器承担项目切换，任务/里程碑以 38–39px 行高呈现；搜索、状态筛选与分组放在紧凑工具栏。新增和编辑统一在右侧抽屉完成，避免表单长期占据工作区，也避免复杂单元格编辑的焦点与校验成本。
- **来源/佐证**：`src/client/panel.tsx`、`panel.css`；真实 dsh 725px 工作区验证表格 1200px 局部滚动、根容器宽度一致，任务创建/删除和抽屉开关正常。

## KB-025 ｜ 同生命周期实体可用单表加类型判别，并在 schema 层约束专有字段（沉淀：trae / TRAE，2026-10-10）

- **结论**：风险与问题共享项目归属、负责人、截止日期、状态、影响和审计时间，适合存入同一 `risk_issues` 表并用 `type` 判别；专有字段保持稳定 JSON 形状，由 Zod `superRefine` 拒绝跨类型字段混用。
- **实现模式**：风险要求 `probability` 非空、`solution` 为空；问题要求 `probability=null`、`responsePlan` 为空。更新时先合并现有记录与 patch，再用完整 record schema 校验最终状态；`projectId`、`type`、ID 和时间戳禁止通过普通更新修改。
- **适用场景**：字段和生命周期高度重合、需要统一列表筛选，但仍有少量类型专有约束的业务实体。
- **边界**：该模式不适合专有字段远多于通用字段或生命周期明显不同的实体；storage-domain 表名须匹配 `^[a-z][a-z0-9_]*$`。
- **来源/佐证**：ADL-024；`src/core/risk-issue.ts`、`src/core/risk-issues.ts`、`scripts/verify-risk-issues.mjs`。

## KB-026 ｜ 内嵌子实体使用稳定 ID 可兼顾首版简洁与后续转化（沉淀：trae / TRAE，2026-10-10）

- **结论**：行动项随会议读取和保存，适合内嵌在 meeting 记录中；但必须使用稳定 `ai-NNN` ID，并通过 `meetingId + actionId` 操作，不能依赖数组下标。
- **实现模式**：新增行动项按当前会议最大编号加一，删除后不复用；关联任务/问题、更新和删除均进入领域业务队列。任务/问题删除扫描会议引用并拒绝悬空关系。
- **未来演进**：显式 promote 可根据行动项创建 WBS 任务并回写 `taskId`；已有 `taskId` 时拒绝重复创建。现有标题、负责人、截止日期和状态可直接映射，无需迁移 meetings 表。
- **适用场景**：子实体主要依附父记录，但未来需要被单独引用、转换或审计的场景。
- **来源/佐证**：ADL-025；`src/core/meeting.ts`、`src/core/meetings.ts`、`scripts/verify-meetings.mjs`。

## KB-042 ｜ macOS 授权、应用控件可读与真实消息采集须分开验证（trae，2026-10-21）

- **结论**：`AXIsProcessTrusted=true`、录屏true与`AXUIElementCopyAttributeValue(...AXWindows)`返回0只证明权限/窗口层，不证明聊天列表或消息控件可读。Computer Use服务、Terminal和TRAE是不同运行身份，应在实际采集进程复查。
- **已验证实例**：微信4.1.15本机修复Terminal/TRAΕ辅助功能及Terminal录屏后doctor退出0，窗口1；原读取器仍侧栏0、标题null。单独本机Vision从消息区域截图识别5条真实消息，须保留来源、置信度、可见窗口范围，不能扩大成完整群历史。
- **诊断策略**：权限拒绝与空控件树分别报告；空树暂停定时采集。原文、截图放Git忽略的私有data，报告不伪造平台消息ID、发出日期或完成率。
- **后续兼容实测**：本机Vision适配后r13/r14同源码连续两轮四群均采到，末轮16条完整文本消息，25/25开发自验；报告 `reports/wechat-pilot-20261021/四群OCR兼容修复与实测.md` 及最终指纹索引。单窗口截图漏搜索子窗口，区域截图才包含实际弹层；本地结果分类可能为“最常使用”。输入OCR只作辅助，唯一候选与切入后完整标题/群人数才是对象核验。
- **CLI 前台读取**：NSWorkspace前台缓存依赖NSRunLoop，`sleep`后可能仍返回激活前的旧应用。本机从TRAE→`open -b`微信实验中，缓存仍TRAE、刷新事件循环后才读到微信；不据缓存误判真实失焦，也不取消失焦保护。
- **OCR 覆盖/去重**：相同正文窗口可能因时间分隔漏识而不能按全部行对齐。本轮一群被记gap、三群unchanged，不能把gap条目自认真实新消息；原始批次保留，当前画面稿和逐批派生稿分开。正文/图片/引用/时间各须独立证据，截图媒体文字不可按位置猜成引用。
- **证据与边界**：ISS-038；权限初验保留在原25211记录。完整历史、增量完整率、无人值守及独立审签未通过，OCR的watch仍拒绝，不依本条宣布可生产运行。

## KB-043 ｜ React复选事件先取值，提交集合用完整受控状态（trae，2026-10-22）

- React事件回调结束后`currentTarget`可为null；函数式updater延后执行/重算不得读取事件对象。同步取checked，updater只闭包布尔值、稳定ID与prev。初次eager更新成功不证明下一次安全。
- 搜索可从DOM移除已选行；footer/受控Set保留不代表FormData仍完整。主保存应提交完整受控集合，空集合显式[]仍遵后端清空合同。
- 证据与当前边界见ISS-039，真实DOM四崩红/真实handler提交两红与开发绿分开。原裸FormData子断言由独立专家裁，不删原红或为测试添加产品伪字段；新GUI未完成不冒全部通过。

## KB-044 ｜ 固定摘录导出、结构化错误和共享资产保护的核对点（trae，2026-10-22）

- 固定报告输出只消费已存摘录六字段，不能读当前源或因源软删过滤；JSON不变和导出内容完整是两条不同断言。复杂正文可用字面围栏安全保留，最长匹配用迭代求值，避免可变长spread栈溢出。ISS-040与独立RED/R1报告保已确认根因，R2仍待独立门。
- 凭据错误按结构化码区分，不按正文出现Key就推导“未配置”；真实request到网关401可反证缺配置假说。ISS-041与独立11项明确层次，底层和command错误须分别验。
- 文件task引用断为0不自动删`file_assets`元数据；现有GC扫描被asset元数据引用的内容寻址路径，故metadata仍在时dryrun/apply均0，不能为制造孤儿而删源。共享下载、末断保字节与真实孤儿apply是不同断言，旧孤儿AUTO不冒新GUI执行。
- 标准含附件备份需JSON+同名sidecar一起预检；成功GUI备份→非空恢复前安全快照→13表/字节→新进程回读已由[独立有限审证](testing/ui-backup-nonempty-reentry-gui-review-20261022-r1.md)签，回滚失败路径仍另待，不以此单件签整个恢复域。

## KB-045 ｜ EGO设施恢复、宿主串包和显式模式设置的核验（trae，2026-10-22）

- ISS-042的八环境变量组合清除后同space恢复已实测；未逐项隔离，根因不能缩成一个变量。默认env最小console/直接安装路径也挂，不凭`help`成功说Node连接成功。
- 宿主合并plugin响应去掉最终`//# sourceMappingURL=client.js.map`；新112完整client1719114byte与合并响应不是全字节包含，可执行1719080byte去此唯一尾注后在offset875361唯一精确。保原false检查，仅此非执行注释可归一，不删除业务代码/任意空白。运行身份仍需源/产物/profile/PID/flags串联，归一不证明首载cacheeligible。
- 用户明确点prod模式会更新时间戳，即使模式value前后均prod；副驾只读AI调用前后可保业务/files，不能把设置时间戳变化说成全领域零写。先读差异字段，再按原合同记录例外，原seal失败保。
- 最新SOURCE/AUTO及112整回归分别已有独立有限签字；三修新GUI747审在途。固定MD1468byte实际出口含两六字段旧摘录、源rv4软删后reportRAW不变，只是Main原件，不由本知识条目签GUI。

## KB-046 ｜ 真实schema投影、合法历史备份和临时反馈采证（trae，2026-10-23）

- 反思内容嵌套在 `ReflectionRecord.draft`；archive与review应从同一真实schema取known/gaps，不能用顶层假fixture证明内容完整。ISS-043的7句/2gap红与独立修后源码子门分别保存，源码绿不自动补新宿主文件主链。
- 合法历史测试包可从真实标准备份仅追加明确的历史settings行，再通过原precheck/confirm导入；含附件必须保整侧车字节，并为新测试JSON重绑manifest摘要，原备份/manifest不覆盖。P2实际只变两settings与自动安全包，31天sent归档/29天active和audit4→5→6已由独立专家限定签字；不宣称这些测试历史是曾真实发送。
- 副驾系统结果是当前React组件临时消息，关闭后正常重开不能恢复该条拒因；来源台账的旧applied摘要不代本次失败。原缺图保BLOCKED，经专家显式修订后一次新真实ask/apply并立即正常内滚采可见结果，前中末全部实际写根零变；Main新439原件在独立目视审，不凭DOM或success envelope自签。
- 任务静态出站标识应沿现snapshot→selected项目→当前实际行消费真实项目audit最大时间；不只复用旧不可达leaf占位、不从其他项目借时间。当前接线缺陷在修，保原U4排序、状态/编号及读出口零写。
