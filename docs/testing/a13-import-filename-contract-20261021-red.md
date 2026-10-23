# A13 导入文件名先行红证与最小合同交回

> 给 Main、开发及独立复验者使用：确证既有导入入口文件名缺陷，纠正 quote 协议前提；本单只交 plan/cases/red，不实现、不签修复 PASS。2026-10-22，平台 trae，独立测试专家。

## 1. 结论

**SOURCE/AUTO 确证 FAIL：两处组件模板未序列化文件名，且实际生产 `import-content` 分词不支持 JSON quote 协议。** 本单的独立先行合同与红证已完成交回；缺陷尚未关闭，GUI/整体/发布均未放行。

| 证据组 | r2 与 r3 原退出码/结果 | 判定边界 |
| --- | --- | --- |
| 原 fixture | 两轮 exit0，各1绿 | A11 四原文件 hash/长度一致；生产 CSV/XLSX 解析和全行预检，合法2行、非法后行真实 dueDate 拒绝 |
| ASCII/既有控制 | 两轮 exit0，各10绿 | 同字节原 CSV/XLSX、真实组件/客户端桥/handler、preview取消零写、confirm后缀/两层字段/重开、busy锁、失败保稿重试、原非法后行两次直接confirm零写 |
| 文件名/模板/协议 | 两轮 exit1，各22红/4绿 | AUTO-NAME 8红4绿；AUTO-TEMPLATE 2红；PROTOCOL-QUOTE 12红。不是安装/加载失败 |
| r1 | exit1，未启动产品用例 | 发布依赖不含src导致runner参考路径ENOENT，设施BLOCKED，原证保留；仅改自有runner，不冒充产品红 |

37个不同用例在 fixture/base/red 三次筛选中全部执行一次；每次报告的 skipped/filteredOut 是其余分组，并非遗漏37例或将未运行项算通过。r2/r3重复执行不计为74个不同用例。r3仅加强自有协议探针，将 preview/confirm 分别 soft assert，并在拒绝后核全库零写；产品源码与fixture两轮相同。

## 2. 缺陷与实际证据

### IFN-F01：文件名含空格被拆，预检/确认两模板均未 quote

实际链：**生产客户端 apply→PmPanel→TaskTable→FileReader 设施→remote.commands.execute 捕获 `/pm ...`→已安装生产 parseCommand→真实插件注册 pm handler→handleTaskCommand→生产领域/JSON**。remote传输设施不做文件名/tokenizer预处理；capture 包括 session=`a13-session`、attachments=`[]`、完整原line与rawInput。没有实际 fetch/HTTP 请求，仓内无 `fetchExecute` 符号；实际上传执行入口是该 remote bridge，不能把设施称真实网络/宿主/GUI。

原合法 CSV 的真实捕获（内容在 observations 原证中完整保留）：

```text
/pm task import-content p-0002 QA 原生导入.csv "<原169字节CSV的JSON编码>"
rawInput = " task import-content p-0002 QA 原生导入.csv ..."
result.kind = error
result.text = 不支持的文件类型：QA（仅 .csv / .xlsx）
```

CSV/XLSX 各四种含空格名均同因红；无空格 `原生导入.csv/.xlsx` 和字面 `QA\原生导入.csv/.xlsx` 共4例绿，完整原名、两层树字段、旁路和JSON重开一致。**不泛称“中文或反斜杠本身不支持”。**

生产拒绝后没有确认按钮，不强点不存在的控件。另两条 AUTO-TEMPLATE 以**同字节 ASCII 实际生产 preview 返回值**作为明确传输控制，让真实组件产生第二模板；捕获确认=`preview + " confirm"`，但两个模板仍直接裸插 file.name，JSON quote 断言红。该控制返回值/false不证明该空格名生产接受或落盘；后端协议另测，不混证。

### IFN-F02：单改两模板的 JSON.stringify 方案仍会失败

实际 `commands/task.ts:539` 用 `argument.split(/\s+/)`，filename=`tokens[1]`；没有 quote-aware tokenizer。已安装生产 `parseCommand` 仅匹配 `/pm` 并原样保留 rawInput，执行入口hash见下节；不是使用测试自写tokenizer。

直接生产 preview 与confirm 各12种 JSON引号文件名，两阶段全部 error/全部JSON不变：

```text
/pm task import-content p-0002 "QA 原生导入.csv" "<原CSV JSON>" [confirm]
不支持的文件类型："QA（仅 .csv / .xlsx）

/pm task import-content p-0002 "原生导入.csv" "<原CSV JSON>" [confirm]
不支持的文件类型："原生导入.csv"（仅 .csv / .xlsx）
```

无空格名加JSON双引号也红，因为扩展检查拿到带末尾引号的 token，证明不能声称现有handler会解quote。

**最小开发合同交 Main 核定**：两处模板用 `JSON.stringify(file.name)` 或经真实生产验证的同等单参数quote协议；若选JSON协议，需要额外批准**只在 `commands/task.ts` 的 `import-content` 文件名读取接缝**支持该协议、保旧无引号ASCII。不改上游、不另造通用tokenizer、不扩路径/文件名安全新合同；不放宽CSV/XLSX内容/映射/schema/日期/全行preflight/confirm/busy/取消/失败保稿。当前方案仅批准两模板时不足以闭环，Main须明确必要接缝范围后开发；专家本轮没有改产品或副本产品自修自签。

## 3. 原件、候选与环境

A11原图已只读审阅：chooser明确选中 `QA 原生导入.csv`、169字节；错误页为“解析失败：不支持的文件类型：QA”。其 `csv-preview.json`、`before.json`、`source-hashes.json`及两PNG冻结保留，不将before单一快照扩大为原GUI全程零写或修后PASS。

- 原合法CSV SHA256：`9ff4d80a312a90a2f09c3c31805aad7796341ade44e2944fa5c690cb07010501`，169 bytes。
- 原合法XLSX SHA256：`1181f20b5bfe4400608bc85415b8ffeeadd70f51ac4035099fc4dfc1ed0ff4a8`，16561 bytes。未重写/重新生成其内容。
- 基线HEAD：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，仅基线，不代表dirty候选。
- r3冻结时刻：`2026-10-21T21:05:23.197Z`（本机2026-10-22 05:05:23）。
- 完整插件src 382文件，清单hash：`d0cee04092a1cb08edba27f9edd2c5ea9f16783f2888d9db27fe139aa03a123c`。
- tracked.patch hash：`eef1005332997b50687493e58e64fcc90d5c179e000bdc593f37f0402c6adba6`；新文件清单与源码hash、合同、依赖入口hash见 `r3/candidate.json`，不认领无关在途成果为本合同PASS。
- 环境：macOS darwin/arm64、OS release24.6.0，Node22.23.3；React/renderer18.3.1、Vitest2.1.9、XLSX0.18.5、TypeScript5.9.3，已有依赖只读链接，未执行pnpm/install/build。

关键冻结源码SHA256（前缀 `packages/dsh-pm-tool/src/`）：

| 文件 | SHA256 |
| --- | --- |
| `client/views/tasks.tsx` | `9789e5811ab09dcbc1c561ccec463e905795b34da1eb7f996bab73d8d21ef91e` |
| `commands/task.ts` | `7f02fbd6daaac985958cb3ea789c7597c7b9e4f72307eeee72efa4713af4f63e` |
| `core/csv-import.ts` | `389c127aefb81fb08215512a168fd978928ec41e814faca2b6e6e26d066dabe5` |
| `client/index.tsx` | `e5702c69f788e4513a78f2e2861ef87d08f1bfa7ea2dce3807ed600505340f89` |
| `client/panel.tsx` | `8618d9091d3544a4236e9ae92fa0225e3914ea065b910ff1f3cb55013d0bc506` |

已安装 `@deepseek-ai/dsh-commands@0.2.1-alpha.2/lib/index.js` hash：
`88909a0915e4e3b2148c72a912987c3e29ba025b5dea589a0f4543040dc34750`。
上游只读源码仅作参考，实际执行不用它替换发布入口。自有r3探针hash：`5177acef59bcc8eae4df823ae3e6017ba59ca0ce14037ec523ff4677ce58bfb3`。

## 4. 完整执行与索引

所有实际命令在仓库根、macOS/bash：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a13-import-filename-contract-20261021-run.mjs r1
node docs/testing/a13-import-filename-contract-20261021-run.mjs r2
node docs/testing/a13-import-filename-contract-20261021-run.mjs r3
node docs/testing/a13-import-filename-contract-20261021-index.mjs
```

r1/r2/r3原外层exit均1：r1为设施阻塞，r2/r3如表为真实产品红。每轮fixture/base/red实际Node argv、cwd、private env、开始/结束时间、原exit/signal（均null）保存于各 `*.command.json`，stdout/stderr/result/observations与临时JSON全部保留；不把外层归档exit0当产品绿。

自有索引命令只归档与核漂移，exit0表示归档完成，不是产品通过。完整索引：[evidence-index.json](a13-import-filename-contract-20261021-selftmp/evidence-index.json)。

r3关键原证：

| 文件 | SHA256 |
| --- | --- |
| `candidate.json` | `8bb6930eb18ea5a001ed66fc9103801c3ceececb4056991d064d97f1339aa69e` |
| `red.result.json` | `6db28574cf70a8ebd21b85287a6fac3fd08be98dc81fe9044b6d926d224511cf` |
| `observations.jsonl` | `ae57d50beb876f1032d3efe6db929bdceaf240f4c9c0661d646881cfd1bac6dd` |
| `audit.json` | `26c46ea200a78449a2ce941abc8ffb516daeeee1b737a12733cc7bcf18087529` |

## 5. 保护、未覆盖与释放

r2/r3冻结src/主src/四原输入/固定合同/A11原证/十依赖物理文件均零漂移；主lib及主/依赖 `.vite/.cache/.vite-temp` 内容+mtime无变化。private HOME/TMP/cache/DSH_HOME/file root均在本前缀selftmp，Vitest `cache:false/--no-cache`；只证明列出的监测根，不声称全机零写。自有收尾plan状态和red/index是测试文档，不改冻结输入/红日志；其他在途成果保留。

没有运行GUI、启动/停止/探测服务、读取凭据、build/install/noEmit/全包verify，没有改 `tasks.tsx`/U4/产品/其他testing/livingdocs，没有commit/push。未覆盖新build/下发/实际chooser/样式/UX完整旅程，均NOT_RUN，不转MANUAL_PENDING、不签整体。

全部自有runner/Vitest进程已退出；索引再次核剩余进程。本角色只写指定前缀，**已释放独立先行任务，不继续开发或等待占用tasks.tsx**。Main接 [plan](a13-import-filename-contract-20261021-plan.md) 与 [cases](a13-import-filename-contract-20261021-cases.md)，核定必要生产quote接缝→限定开发→新候选独立复验→唯一隔离构建与原GUI补采→另审；原FAIL保留，不带入U4实施或发布授权。
