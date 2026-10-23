# A13 导入文件名限定开发交回

> 给 Main、独立测试专家与接续开发者使用：记录本批最小源码修复、开发自验原证、失败设施与文件释放。前缀沿用 20261021，实际执行 2026-10-22，平台 trae；开发不自签独立 SOURCE/AUTO。

## 1. 父派单与范围

负责人本单原句：

> 开发限定修A13原生import文件名含space被截QA。先读AGENTS/collab/独立docs/testing/a13-import-filename-contract-20261021-plan/cases/red、更新docs/plans/2026-10-21-import-filename-closure.md。独占client/views/tasks.tsx两template JSON.stringify(file.name)+同域test，commands/task.ts仅import-content分支+同域tests，不动coreCSV/parser/schema/panel/taskviews/U4。专家确证现handler空白split quote不支持，最小解析项目ID后JSON字符串filename(严格JSONescaped)或旧unquotedASCII，完整JSONcontent字符串保空白/末唯一confirm，非法JSON/尾部拒零write；不改其他子命令、不eval/额外decode。原test fixture169csv/16561xlsx含中文引号backslash,真实PmPanelexecute桥+actualhandlerpreview/confirm/busy失败重试/dryzero。自有freeze/no-cache旧22red/newgreen+相关/noemit，禁止install/build/sharedlib/GUI/services/credentials/其他docs/commit。MainA11/A12existinglib保护，U4实施等你释放不抢tasks。报告reports/a13-import-filename-developer-20261021前缀完整hash/exit/原件与边界，结束释放。用户持续验已有最后Maincommit无push，SOURCE不自签独立。

已读 AGENTS、collaboration、当前接续及专家 [plan](../docs/testing/a13-import-filename-contract-20261021-plan.md)/[cases](../docs/testing/a13-import-filename-contract-20261021-cases.md)/[red](../docs/testing/a13-import-filename-contract-20261021-red.md)，更新指定 [闭环计划](../docs/plans/2026-10-21-import-filename-closure.md)。本单授权替代通用 install/build、livingdocs 更新及 Git 动作；脏树不 pull、不清他人成果。Main 原持续验收与最后 commit 授权不转给本开发角色，无 push。

本批产品/测试改动仅四文件：
- `src/client/views/tasks.tsx`：只改 preview/confirm 两模板，file.name 各用 JSON.stringify。
- `src/commands/task.ts`：只改 import-content 分支，不改其他子命令；项目 ID 后读取 JSON-string 文件名或旧无空白 ASCII 名，再读取完整 JSON content 字符串和唯一末尾 confirm。仅识别字符串边界，JSON.parse 严格校验转义且各解一次；内容不 split/join、不额外 decode、不 eval。
- `src/client/views/tasks-import-confirm.test.tsx`：保既有控制断言，只调整两条序列化期望与测试文件名，让 CSV/XLSX、busy、false/reject 重试覆盖中文/空格/引号/反斜杠；既有 ASCII 对照仍由原专家 BASE 保留。
- 新增 `src/commands/task-import-filename.test.ts`：24 个同域例，包含严格 JSON 转义/Unicode、连续空白/Tab/字面反斜杠、旧 ASCII 兼容、非法 JSON/非字符串/额外尾部/重复 confirm 重试零写。

新增测试在修前冻结前写入，产品仍是旧 split 和裸模板；该测试在旧/新冻结中同字节。其他既有在途改动保留，所有源码差异以 old-r1→new-r3 自有 patch 为准，不用 HEAD diff 把他人成果认作本批。

## 2. 执行与原退出码

macOS darwin/arm64、OS release24.6.0，nvm Node22.23.3；只读复用既有 React/renderer18.3.1、Vitest2.1.9、XLSX0.18.5、TypeScript5.9.3。未调用 pnpm/install/build；pnpm11.28.5 为项目约定环境，不冒称本次运行过 pnpm。

在仓库根执行：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node reports/a13-import-filename-developer-20261021-run.mjs old-r1
node reports/a13-import-filename-developer-20261021-run.mjs new-r1
node reports/a13-import-filename-developer-20261021-run.mjs new-r2
node reports/a13-import-filename-developer-20261021-run.mjs new-r3
node reports/a13-import-filename-developer-20261021-index.mjs
```

| 轮次/组 | 原 exit | 实际结果/边界 |
| --- | --- | --- |
| old-r1 / fixture | 0 | 1/1，原四文件长度/hash、合法两层树及非法后行日期预检 |
| old-r1 / base | 0 | 10/10，实际组件/桥/handler，ASCII、取消、busy、失败重试、非法日期零写 |
| old-r1 / names-protocol | 1 | 22 红/4 绿，与专家原红一致；不是设施加载失败 |
| old-r1 / handler | 1 | 已执行24例中4红20绿；另有旧证据协议套件加载 ENOENT，不把该设施错误算产品红 |
| new-r1 / fixture、base、names-protocol | 各0 | 1+10+26，全37例开发绿 |
| new-r1 / handler、related | 各1 | 已执行24/24、108/108，但缺旧 `f2.json` 导致套件加载失败，不算整组绿 |
| new-r1 / noemit | 0 | TypeScript无输出类型检查 |
| new-r2 / fixture、base、names-protocol、handler | 各0 | 1+10+26+24，产品源码与new-r1相同 |
| new-r2 / related | 1 | 116绿1失败，旧套件再缺 `f2-backup.json`；失败原件保留 |
| new-r2 / noemit | 0 | TypeScript无输出类型检查 |
| new-r3 / fixture、base、names-protocol | 各0 | 原专家37/37，同字节原用例未改 |
| new-r3 / handler | 0 | 同域24/24 |
| new-r3 / related | 0 | 12文件117/117，包含同域24与CSV预检、任务反馈/编号/控制/响应式/客观证据协议回归 |
| new-r3 / noemit | 0 | `node <既有typescript>/bin/tsc -p <自有pkg>/tsconfig.json --noEmit --incremental false` |
| index / diff-check、vendor-static | 各0 | 限定diff空白检查、只读外部skill静态完整性校验 |
| index / owned-source-diff | 1 | `git diff --no-index`正常“有差异”退出，不是测试FAIL |
| 外层 old-r1/new-r1/new-r2/new-r3/index | 1/1/1/0/0 | 归档不改写内层原exit；失败轮次全部保留 |

每组完整 Node argv、cwd、私有 env、起止时间、原 exit/signal、stdout/stderr/JSON结果见对应 `*.command.json` 和日志。Vitest全组 `--no-cache`，`cache:false`；私有 HOME/TMPDIR/cache/NODE_COMPILE_CACHE/DSH_HOME/DSH_PM_FILE_ROOT 均位于本前缀 selftmp。组间筛选的 skipped 是其他分组，不计通过；24同域在related中再次执行，不重复累计成新增用例。

设施修复仅改本前缀 runner：原样复制旧证据协议测试实际读取的 `f2.json` 和 `f2-backup.json`，单跑同域时限定到自己的 test。未改产品/专家用例，new-r1/r2/r3产品字节一致。原编号反馈测试 React key warning仍保留，未扩范围修UI。

## 3. 实际链与不变量

生产 `applyClient→PmPanel→TaskTable→FileReader设施→remote.commands.execute→已安装parseCommand→实际pm注册handler→handleTaskCommand→JSON storage`；不提供测试tokenizer或假导入实现。remote 为传输边界设施，没有真实HTTP/宿主/原生chooser，不称GUI。

原169-byte CSV与16561-byte XLSX同字节测试，仅File.name元数据矩阵变化；六种中文/空格/单双引号/backslash名各CSV/XLSX均preview完整回显、confirm创建原字段两层树，旁路项目不变、关闭JSON库重开一致。confirm为同一preview命令仅尾加 `" confirm"`，编码内容完整不变。

原合法预览/取消全库hash不变；同帧双确认只发一次，在途禁确认/取消/重选；false/reject不调用handler写入、保原预览及原命令，重试只在真实成功后关闭。原非法后行日期preview及直接confirm两次均拒绝、全JSON不变并重开一致。新解析负例21种重复执行均中文拒绝/零任务/全库hash不变。内容里的双空格/Tab/引号/字面 `\n` 与字符串内 `confirm` 保留，不被split/join或第二次decode改变。

模板单独采样例依专家原件用ASCII真实preview成功作为明确transport控制，仅证明两模板/后缀，不单独证明落盘；完整名称接受/落盘另由AUTO-NAME与PROTOCOL-QUOTE实际handler证明。

## 4. 候选、原件与完整指纹

基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅是Git基线，不代表dirty候选。完整源/新增文件清单、tracked patch、依赖入口、原件长度及指纹见 [new-r3/candidate.json](a13-import-filename-developer-20261021-selftmp/new-r3/candidate.json)；3131项原证文件的完整SHA256/长度见 [evidence-index.json](a13-import-filename-developer-20261021-selftmp/evidence-index.json)，冻结原件/失败日志不覆盖。

| 对象 | 完整SHA256 |
| --- | --- |
| 原合法169-byte CSV | `9ff4d80a312a90a2f09c3c31805aad7796341ade44e2944fa5c690cb07010501` |
| 原合法16561-byte XLSX | `1181f20b5bfe4400608bc85415b8ffeeadd70f51ac4035099fc4dfc1ed0ff4a8` |
| tasks.tsx 修前 | `9789e5811ab09dcbc1c561ccec463e905795b34da1eb7f996bab73d8d21ef91e` |
| task.ts 修前 | `7f02fbd6daaac985958cb3ea789c7597c7b9e4f72307eeee72efa4713af4f63e` |
| tasks.tsx 修后 | `c37f046188f763486010e9867117ca90899c4983b09fd163f4d004007f6f2dc1` |
| task.ts 修后 | `223472a8580a78ff1aa18468c3d3560ca05eebef0d4d7066d518eabe91901f44` |
| tasks-import-confirm.test.tsx | `1f0241f9514476cd3b62980400eb7e7ef648b7c67cba4a88b99f2c84be91fa00` |
| 新task-import-filename.test.ts | `3575adcb202ca26cab341edee394634f16c69736d9f32fd8b8dc053e38a9b3e7` |
| new-r3完整源清单 | `9ce36f7a3a4968c8bf11b6d309ec3837cd10069d27547e8cd21454805df6d938` |
| new-r3 tracked.patch | `1b9537297c301bed5d3b5ed6e8e70e54bc6709aa8d77f2f807a70d43d2a818cc` |
| 本批old→new源码patch | `404a3781a2451e84abfe125c9823cbff51f7fe72ed8bbbcb5e2d624ecabe40ca` |
| new-r3 candidate.json | `0edb53609aa625c8c4c0277ed32c216bc6230da5039cfbfde3de8934441ae835` |
| new-r3 observations.jsonl | `6d2acde371cb778079645f2d3a50d140895d1a90418fd99320d5dcf4157932a7` |
| new-r3 audit.json | `2a038c7ebd37d4407a477df435454c0c796c5b7578496d9239c347e78f0ed6fb` |
| evidence-index.json | `42bdbe83da4355b3ad01ab750d50da95faa5d112c04d094a1b1c2f5d6f31a652` |

core CSV保持 `389c127aefb81fb08215512a168fd978928ec41e814faca2b6e6e26d066dabe5`；panel保持 `8618d9091d3544a4236e9ae92fa0225e3914ea065b910ff1f3cb55013d0bc506`。其他core/parser/schema/taskviews/U4字节未改，index校old→new仅三已有文件差异，新同域test在两轮已同字节；释放前live全src与new-r3逐hash一致。

## 5. 保护、审签与释放

各轮audit记录冻结src、live src、原四输入、A11原证、固定合同及十依赖零漂移，主树lib/既有Main隔离lib/cache内容+mtime不变；new-r3进一步显式监测A12隔离lib前后不变。索引对原认领逐项比对A11/A12各453产物，全部hash一致。监测仅覆盖列出的根，不称全机零写；未访问正式data/credentials，未操作服务/profile/GUI，未install/build/sharedlib/commit/push/发布，未改其他livingdocs或原docs/testing。

已做限定源码质量自查：两模板一致、后缀严格、JSON各解一次、错误在写前返回、其他分支零差异。外部skill政策先读、静态完整性exit0，但既有独立FAIL未关闭时不加载自动vendor入口，不以静态绿或开发自查替代独立门；brainstorming/writing-plans仅按已批准方案整理本计划，通用新增文档/安装/提交步骤按本单边界不执行。

开发自验交回，**独立SOURCE/AUTO未自签；新构建/激活/GUI/样式/UX/整项审签NOT_RUN**。下一步独立专家认领new-r3源及原证复验；Main唯一隔离构建并按原合同补实际chooser CSV/XLSX、取消/确认/非法日期零写等GUI，再交专家审证。主持续任务仍未结束，最终commit由Main安排，无push。

本开发所有测试/runner已结束，证据与失败原件保留；**释放tasks.tsx、同域test及commands/task.ts文件独占，不继续抢写U4**。U4接手后若修改同文件，须认领新候选并重测受影响证据；本报告新冻结保持不变。
