# A13 导入文件名最小确证计划

> 给 Main、开发与独立复验者使用：先交测试计划、用例和真实 SOURCE/AUTO 红证，不开发产品、不签修复 PASS。前缀沿用 20261021，实际执行日期 2026-10-22；平台 trae，独立测试专家。

## 1. 父派单与授权

负责人本单原句：

> 独立先行最小确证合同：A11原生chooser选合法169byte 'QA 原生导入.csv'后拒不支持typeQA，tasks.tsx预检/confirm模板 file.name未quote。docs/plans/2026-10-21-import-filename-closure.md，A11/materials/native-import原chooser/csv-preview/before/sourcehash；源/private/tmp/pmtool-a11-native-import。只写docs/testing/a13-import-filename-contract-20261021前缀，禁止产品/GUI/build/install/services/credentials/commit。读AGENTS/collab/原A9A10import合同及tokenizer，真实组件fetchexecute捕获+实际production tokenizer/handler断言空格/中文/引号/backslash文件名被一个参数、扩展正确；可自有副本红/合法ascii对照/no-cache。明确最小2template JSON.stringify(file.name)或真实tokenizer支持quote协议、confirm后缀/busy/全行preflight保，ASCII和CSV/XLSX内容不改；不扩路径文件名安全新合同。先plan/cases/red交Main再开发，不动tasks.tsx与U4。完成释放。

可写对象仅 `docs/testing/a13-import-filename-contract-20261021*`，包括其 `-selftmp/`。已读 AGENTS、collaboration §9/§11、当前接续、A8 LG05、A9 §4/§6、A10 导入复验、ADL-043 和指定收口方案。主树在途改动保留；依本单特定授权不 fetch/pull、不运行通用 install/build/全包回归、不改 livingdocs 或其他 testing、不提交。未执行 vendor skill；writing-plans/brainstorming 的通用产品实现、目录和提交步骤不适用于本单。

## 2. 最小目标与纠正前提

目标：已支持 CSV/XLSX 的上传入口，应将 chooser 的 `file.name` 作为一个完整文件名传给既有导入处理器，保空格、中文、单双引号、字面反斜杠和正确扩展名；确认只是同一预览命令末尾加一个独立 ` confirm`。

只读发现：

1. `client/views/tasks.tsx` 两处 `task import-content` 模板直接插入 `${file.name}`。
2. 实际 `commands/task.ts` 的 `import-content` 分支用 `argument.split(/\s+/)`，`tokens[1]` 是 filename，其余重新拼成内容；并无 quote-aware tokenizer。
3. 上游生产 `parseCommand` 只取 `/pm` 名称，原样保留 `rawInput`；不会替插件解析/去掉文件名的 JSON 引号。真实客户端 `client/index.tsx` 也仅加 `/pm `。
4. 因此不能把“两模板加 `JSON.stringify(file.name)`”单独当成闭环。需要以真实 handler 接受 JSON 引号协议为前提；当前生产是否支持，必须用独立直接命令红例证实，而非自写一个测试 tokenizer。

开发最小方向交 Main 核定：两模板序列化文件名；若实际解析器不支持，须同步批准仅 `commands/task.ts` 的 `import-content` 文件名参数读取接缝支持同一 JSON-string quote 协议，并保旧无引号 ASCII 入口。不扩为通用 shell/parser 重写，不修改上游。测试专家不实施该变更，也不在副本修产品后自签。

## 3. 不变量与非目标

- CSV 原文继续 `JSON.stringify(content)`；XLSX 继续 ArrayBuffer→原 base64→JSON 字符串。文件内容、导入字段、schema、日期规则、层级、续号和默认值不变。
- preview/取消零写；合法明确 confirm 才写；`importInFlight` 同帧锁、busy 禁确认/取消/重选、false/reject 保原预览和重试不变。
- 全行 preflight 仍须在第一条 addTask 前完成；后行非法日期须 preview/直接 confirm/原命令重试均拒绝，全部 JSON 字节不变。
- ASCII 可继续使用旧无引号命令；新增 quote 协议不得破坏既有 ASCII 行为。不能因旧测试精确比较无引号字符串而放弃兼容性 oracle；修后如序列化字符串变化，仅独立专家可核定其自有旧用例副本。
- 不新增路径导入、路径/文件名安全、文件限制、通用转义、schema、事务或重复 confirm exactly-once 合同；不改 U4、原业务数据、原专家证据。

## 4. 方法与证据层级

1. 冻结完整插件 `src`、package/config、tracked diff、新源文件清单、所引用合同和 A11 四文件；与主树逐字节核对。
2. A11 原 chooser/错误截图仅只读审图；JSON/before/source-hashes 认领原证，不能当本轮新增 GUI 或修后 PASS。
3. 先校四原文件长度/hash；用原 CSV 和原 XLSX **同字节**内容、仅测试 File.name 的 ASCII 元数据对照，调用真实 pm handler 证明合法与两层树可落盘重开。
4. 真实客户端 `apply` 生成 execute/executeRaw，真实 `PmPanel→TaskTable` 选择回调和 FileReader 设施。只在 remote transport 边界捕获 `/pm ...`，调用已安装生产 `parseCommand` 和真实插件注册 handler；不提供假分词器、假导入实现。
5. 文件名实际进入一个参数的 oracle：真实 preview 必须返回**完整原名**及正确文件类型、未改内容的两行 outline；原捕获命令仅追加 confirm 必须创建同一两层任务；JSON 重开、旁路项目不变。不把测试侧 split 结果当产品证明。
6. confirm 模板单独采样：生产 preview 拒绝时不能点击不存在按钮。必要的采样用同内容 ASCII 生产 preview 返回值作为明确标注的 transport 成功响应，让真实组件生成 confirm 模板；此项只证明模板/锁/传输，不证明被拒文件名已被后端接受。真实 handler 测试另行独立执行。
7. JSON.stringify 文件名协议直接调用实际生产 handler，分 preview/confirm 验证完整名称、扩展和内容。不以模板字符串看似正确代替协议兼容。
8. 只读链接已安装依赖；private HOME/TMPDIR/cacheDir/XDG_CACHE_HOME/NODE_COMPILE_CACHE/DSH_HOME/文件根均在自有 selftmp，Vitest `cache:false/--no-cache`，不安装、不产 lib、不接网络/服务/凭据。

## 5. 执行顺序

- [x] 查规则、原 A9/A10 合同、A11 原证与真实解析入口。
- [x] 先写本 plan 和 [cases](a13-import-filename-contract-20261021-cases.md)，冻结可执行探针。
- [x] 校原 fixture/hash，r2/r3各1绿，合法 ASCII 与既有 import/preflight 控制各10绿。
- [x] 跑真实组件文件名矩阵、两模板采样与 JSON quote 协议红例，r2/r3各22红4绿，保各原 exit/输出。
- [x] 写 [red](a13-import-filename-contract-20261021-red.md)，核 source/依赖/cache/证据零漂移，交 Main 并释放；不是修复完成或PASS。

运行环境为 macOS/bash + nvm Node 22，复用既有 Vitest/React/XLSX，无 build/install：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a13-import-filename-contract-20261021-run.mjs r1
```

runner 保留 fixture/base/red 原退出码；预期 fixture/base 为 0、red 在未修源码上为 1。新一轮用 `r2`，禁止覆盖 `r1`。fixture/base 加载失败记 BLOCKED，不称产品红。

实际r1为参考源码路径设施BLOCKED，未启动产品用例；r2完成红证，r3仅加强自有preview/confirm分别断言与拒绝零写，两轮产品源码相同、结果一致。现有r1/r2/r3均保留，后续用r4或新专家批次，不覆盖原件。

## 6. 交给 Main 的停止点

本轮只交先行 plan/cases/red 与待核最小解析接缝，不宣布修复完成。Main 先认领两模板及必要解析器范围、保证 tasks.tsx 与 U4 不并发写，再开发；开发后新冻结→独立 SOURCE/AUTO 复验→Main 唯一隔离 build→按原合同补实际 chooser 原 CSV/XLSX、preview取消、confirm、非法日期零写 GUI 原证→独立审证。新 GUI NOT_RUN；本轮不授权 build、GUI、commit/push/发布或下一功能。
