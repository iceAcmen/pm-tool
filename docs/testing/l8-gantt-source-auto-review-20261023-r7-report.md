# L8 甘特修复独立 SOURCE/AUTO 审证 R7

本文给 Main 提供 L8 两文件修复的独立源码、原始红绿证据及隔离窄复验结论；不作 GUI、B8、整包或父 commit 放行。2026-10-23，平台 trae，固定独立 SOURCE/AUTO 专家。

## 1. 有限结论

**SOURCE：PASS；AUTO：PASS，均仅限 L8 最小两文件修复及下表组件/窄测范围。** 没有发现本修复的产品缺陷或 oracle 追绿。原 wrapped 红测和旧 GUI 失败保留，不改原报告；新结论不回写原件、不泛化为全部 L8/父批次完成。

| 合同 | 本次独立结论 | 明确未签范围 |
| --- | --- | --- |
| T01 | PASS：真实 GanttView 五态左列；旧四态不变，wrapped→已收尾 · 非正式完成 | 真实页面字形目视 |
| T02 组件层 | PASS：五态对应 DIV role=button/data-task-id 条体；aria 与左列一致，日期/工期/进度/操作提示保留，wrapped 无 is-done/st-done | 原合同真实 GUI 仍 BLOCKED：本角色未执行且未收到修后原件 |
| T03 组件不变量 | PASS：同原 L8 条件无排期仅左列、无该条体，客观100/legacy0/清单1/1/wrapped 不改，run 未调用 | 重进/刷新、同 rpcId 请求返回、业务落盘及始末根：本次未执行/未签 |
| T04 窄范围 | PASS：L5 2/5/null→40，L3 无证据/null/legacy40→空填充；同实例 manual70→clear 各回落40/null；邻接46项原证可继承于此 L8 delta | 父63/覆盖、两报告66、完整统计/逾期、日期写、全部 verify/受影响 GUI 未签 |

GUI 缺口不是 MANUAL_PENDING；由 Main 执行原合同。B8、全 OP、父 ordinarycommit、发布和正式切换均 **未签**。Main 源门齐后才认领新候选并唯一 freeze/build；不要求重跑原旧候选已有效完整回归，不拿本次窄测当新整包门。

## 2. 授权与角色边界

本次负责人原句：

> 父明确授权全已实现未验持续独立审/采证/修复至普通commit，Main唯一整builder/GUI/桌面。不push/release/正式切。原L8r3killed、r4/r5/r6启动limitfailed，均没有SOURCE/AUTO产物。本新r7替补非重复在途。你固定L8独立SOURCE/AUTO专家，禁止开发/GUI/整build/服务/原testing/其他产品/livingdocs/Git/活runtime/正式，唯一新docs/testing/l8-gantt-source-auto-review-20261023-r7*和自有/tmp必要隔离窄test。通用fetch/install/build SOP被本单明确替代。

停止条件原句：“真实seal/readback/toolreceipts后STOP/released。”已读 AGENTS、collaboration §9/§11、原独立缺陷报告与 T01–T04、批准设计和开发 handoff。本单不是开发，不运行开发 runner/Main executor，不改测试 oracle，不操作 Git/GUI/桌面/服务/网络/活 runtime/正式数据，不写其他报告或 livingdocs。原 r3/r4/r5/r6 状态来自派单，未新增探活或重派。

唯一仓库写面为本 r7 前缀。辅助程序、复制源、依赖软链、缓存、原输出和计时均在自有 `/private/tmp/l8-gantt-source-auto-review-20261023-r7-bqHBkM`；依赖既有只读，无 install/pnpm/build。

## 3. 身份与封件核验

开发证据根 `/private/tmp/l8-gantt-developer-20261023-Pes2Ba` 只读。实际逐件核 **1321/1321**：普通文件 bytes/SHA 相同，软链逐字目标相同；seal SHA 为 `dd8a400dc36e96ea6398f92464059ac8ee5fc344c93f8b8ad7f7510ea96b4bff`。handoff、seal、readback 的原 outer status 均0；readback.checkedEntries=1321、seal SHA 正确；released.status=0、state=released/STOP、readback SHA 链相同。开发文件和 handoff 当前字节均与 seal.productAndDocument 相同。

| 文件身份 | SHA256 |
| --- | --- |
| 原 gantt/red | `838a43451e037fdff363ce73e00570512d785f09f45688bf17afdb08ebc730bf` |
| 新 gantt/green/type/当前源码 | `06f0188c9185ec8e3444fa9d2665fcb716a1381f2c84bde3afc7f591177386e7` |
| red/green/type/独立窄测同一测试 | `28e6f478fd6d16d78707d4976ea88981d0cce838c2be38ff50dd5804ddc6690c` |

由原文件施加合同两处精确文本补丁，与新文件全字节相等：只新增 wrapped 分支、renderBar 复用 ganttStatusText。done===done、class、进度/聚合/日期写等其余字节未改，未知值仍兜底待办。测试实际 import GanttView 与 taskWriteSchema.parse，无替换产品映射、无写命令，断言文案来自独立合同。

开发每轮输入413件均实核；red/green 源差异仅 gantt，测试 SHA 同。另一个输入差异是 vitest.owned.config.ts 中各轮缓存根，已逐字验证只有 red/green/type 路径不同；base config 相同。green/type 其余412件相同。开发审计同样记录409源的 treeDelta 仅 gantt、typeDelta/liveDelta 空。

封件内实核 source 清单125键、complete清单526键及各 SHA，与 parent-input-delta.json 同；唯一声明增量为 gantt 修改和测试新增，原124/525、基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 来源为开发封件。**未直接读取父运行树/父原冻结输入或重新独立枚举父全包，不把开发 parent delta 声明升格为父完整 SOURCE 门。** 新 source 清单 SHA `de2b4ea63e87e0be8470b85a91c785ef0d6e04ed71f590f6f1ffea75c979987b`；complete SHA `74688fa9395589a11efb09f568fac352b73ff4ea0687da537e3bf5c308a0d3fa`。新整包所有输入仍由 Main 统一认领。

## 4. 原证与独立执行

原 red stdout/stderr、child/outer 真实1：13项中3失败10通过，失败仅 wrapped 左列、有排期 aria、无排期 L8 左列。原 green child/outer0：6文件46项；新测试13、criticalPath8、routeEdge5、milestoneLink4、progress-meta5、progress-clamp11。原 type child/outer0、narrow noEmit 无输出。保留 ANSI 原输出和初始空解码；独立从原 stdout 解码17项，与保存观察逐字段相同。

红绿17组按顺序配对，不用重复 caseId 覆盖：输入内容/SHA 全同；14个非wrapped观察全字节同；3个wrapped只副行和条体aria文案变，class/tag/role/taskId/日期/标题/填充等相同。L5/L3 各 objective→manual70→objective 的两个 objective 原件均保留。

运行环境 macOS darwin arm64，绝对 Node22.23.3；Vitest2.1.9、TypeScript5.9.3、React/react-test-renderer18.3.1、Zod4.6.5。依赖 realpath/package字节/version 与开发记录一致，只读复用。独立新目录复制409源及3个原配置共412件；新缓存 wrapper 仅迁移缓存根，真实组件/测试/strict NodeNext/react-jsx 类型配置不改。运行前后412件指纹同。

以下实际命令在仓库根运行；helper 只运行自有 reader 与允许的窄测，不执行开发 helper：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/l8-gantt-source-auto-review-20261023-r7-bqHBkM/review.mjs audit-r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/l8-gantt-source-auto-review-20261023-r7-bqHBkM/review.mjs retest-r2
```

实际展开 child argv/cwd 及完整输出在自有 `independent-vitest-r2.*` / `independent-type-r2.*`；cwd 为 `narrow-r2`：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node node_modules/vitest/vitest.mjs run src/client/views/gantt-status.test.tsx --config vitest.owned.config.ts --pool=forks --maxWorkers=1 --minWorkers=1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node node_modules/typescript/bin/tsc -p tsconfig.narrow.json --noEmit --incremental false
```

独立结果：Vitest **13/13、exit0**，17观察与开发green完全相同；type **exit0**。audit-r3 exit0，retest-r2 exit0。46项邻接只独立审原证，不再执行一次；不声称本次实际跑46项。未运行全部 verify、日期写或GUI。

自有失败如实保留：audit exit1（误将各轮cache配置视为禁止输入差异）；audit-r2 exit1（complete字典值无path，误与带path的delta比较）；只修 reader 结构比较，audit-r3实际0。retest/independent-vitest exit1 因 `CACError: Unknown option --cacheDir`，用例尚未运行；新 narrow-r2 采用已核配置模式，不复用失败目录，实际通过。原失败回执、stderr、计时保留。读取时 rg缺失127、四次误文件名读取1也记入工具计时，不归为产品失败。

## 5. Main 原 T02/T03 确切 GUI 余项

1. 先待适用 SOURCE 门齐，新 freeze/build/候选认领完成后，在合法隔离实例按原合同恢复/重建 fixture；不能沿旧包签修后GUI。
2. T03 原对象 QA-OP/p-0001/t-0010/F2-L8/code6/parent=t-0001，wrapped、legacy0、due2026-10-20、无start/completedDate、原清单UUID `90156246-014f-4ba3-9693-e34edd29871c` 1/1=true。正常任务页进入甘特并点原刷新数据，配对同 rpcId 的 `/pm web snapshot` 请求成功返回、随后行及任务落盘；仍无该条体，任务页 wrapped 保留，甘特左列状态完整曝光为“已收尾 · 非正式完成”。采实际PNG/帧和完整原行，不以DOM代目视、不改CSS/tooltip/矩阵。
3. T02 用正常任务日期保存入口在合法隔离 fixture 准备有排期 L8，再进入甘特并正常刷新；命中 DIV role=button/data-task-id 的真实条体，采完整aria/行/图片帧/请求返回/业务记录。状态仍wrapped，无is-done/st-done，日期/工期/进度/提示保留。原封件不可写则合法重建，不触碰原件或正式数据。
4. T03 按原始末业务/files/backups清单及复制字节核对；全data宿主session cache另列，新增/变化和真实失败原样保留，不删cache、不把业务零写称全盘零写。T02正常日期保存造成的允许日期/更新时间变化，与T03未写实验分开比较。T04 原日期verify及受影响回读/GUI/完整回归交Main后继，不加新矩阵。

## 6. 计时、效率与停止

每个实际 reader/child 步骤的真实 start/end/elapsedMs、argv、PID、退出码在自有 `timing.jsonl` 与对应 tool-receipt/status；早期读证在 `read-tool-timing.jsonl` 记录工具返回耗时，无时间戳能力者明列null，不造始末/估值。手动patch/工具发现未返回耗时者明列未知。嵌套 child 与 outer 不相加当总成本；整体百分比交Main统一基线，本角色不猜。

本功能效率反思：固定单专家完成源码、原证和一次窄复验，没有按步骤额外派报告，也未重复全回归。可避免成本来自错误文件名、两个reader数据结构假设和未经验证的CLI参数；后继先列原文件名/清单形状，再沿已核缓存wrapper模式，每次失败新目录新回执，不改oracle。audit-r3实际约0.884秒；成功窄测outer10.439秒（含Vitest3.156秒/type6.266秒与复制核验），只是本机该次工具实测，不宣称整体提速倍数。

后继封件命令仅针对自有产物，实际状态须读本前缀 seal/readback/released 及自有 `seal.tool-receipt.json`、`readback.tool-receipt.json`：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/l8-gantt-source-auto-review-20261023-r7-bqHBkM/review.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/l8-gantt-source-auto-review-20261023-r7-bqHBkM/review.mjs readback
```

不预签这两命令成功。实际seal/readback0、真实工具回执落盘、最终released指纹链一致后 **STOP/released**，不再扩项或操作任何产品/运行资源。所有窄测child已同步返回，未启动服务；只说明自己的写面和已核对象，不作全盘零污染声明。
