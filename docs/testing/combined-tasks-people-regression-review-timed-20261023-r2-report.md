# 合并任务与人员有限独立审证 R2

2026-10-23，trae，独立 SOURCE/AUTO 原证审查；给 Main 接续使用，不是产品测试重执行、GUI 或父 commit 签字。

## 有限结论

**SOURCE：PASS_LIMITED_COMBINED_SOURCE_BINDING。AUTO：PASS_LIMITED_CURRENT_APPLICABLE_REGRESSION_EVIDENCE。**

唯一对象 `CombinedTasksPeopleRepairR1`，baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，source **129** / complete **528**。七组独立审计有效，`audit-final.json actualSelfExit=0 / errors=[]`；原解析器失败 exit1 保留，不冒从未失败。本结论以封存声明、既有独立源签与新执行原证为依据，不声称现场重新审全源码/依赖实体。

**GUI、整原 ID、宿主装载、样式/UX、父 ordinarycommit：NOT_SIGNED_THIS_ROLE。** 原首读/O4/stale/人员 FD/图轴及 F02 等 GUI 红、旧 error 恢复缺口和原未验边界保持。Main 最新确认仍旧3270、无新宿主/新GUI；本角色未探活，不将 AUTO 当 GUI。

## 封件与来源

index：346450 B / `fdcf43ae94c9efed2463adf7b4ce488c77e9c0c8ce6583c50031b516a89d5ba7`。seal：1184 B / `0999eba99aea0dd253558d814d9b107fae57afa4a44a2ad59841a518e9128af1`。

1869索引中 **158非runtime封件逐bytes/SHA实核**；**1711 runtime成员只审索引元数据并继承 Main 全量readback**，未访问实体。Main readback子PID73712/exit0、seal/index/checked1869/stdout一致；Main outer `243e96ac exit0`来自正式封交，不冒内部宿主原件实读。没有重hash旧千件。

525→528：**仅八 delta，五修改、三新增、520不变、无删除**，完整source/source-sha清单、parent并集与changed/new清单一致；launcher15个声明路径与保护manifest交叉一致。delta只含 panel、首读新test、confirm新test、transport、gantt、gantt新status test、people.tsx/css。13份来源报告实核与封交指纹一致。

L8 r7签当前gantt/test；O4/stale r1签当前panel/transport/confirm；首读r1的中间panel经已签O4/stale最小差异接续，当前首读9项在新DOM真实完成。姓名旧审只签前CSS，后继人员轴r2签当前两源，不借旧姓名审扩大范围。四份源审readback/released及seal的必要元数据已实读，未重核其原全量成员。

## 原执行实核

环境为 Main 封存 macOS、绝对 nvm Node22.23.3，Vitest2.1.9/TypeScript5.9.3/React18.3.1/JSDOM25.0.1 沿已签设施；pnpm11.28.5只是既有口径，本角色未调用。每条完整argv/cwd/白名单env/PID/UTC/exit/stdout/stderr指纹见 `audit-final.json` 的 commands；不是本角色重新运行。

| 原命令 | 产品child PID / exit | 独立核到的结果 |
| --- | --- | --- |
| tsc / bundle / noEmit | 71012/0，71087/0，71151/0 | 原配置；noEmit `--incremental false` |
| full + coverage | 71152/0 | 163文件/1721断言全绿；原四模块coverage 89.40/83.65/85.89/89.40，非全包coverage |
| DOM 初次 | 71150/1 | 六文件41绿；另两文件collector失败 `Cannot find module 'jsdom'`，未执行断言 |
| DOM 两未执行文件补执行 | 71885/0 | 首读9 + confirm11 =20绿；有效DOM61，原exit1保留 |
| special | 71949/0 | 2文件7绿；实际开始后于full结束，原专项oracle沿已签SHA |
| 全95verify初次 | 71161/1 | 94绿，唯一P0 `x6.gapsOnBareDone` 红 |
| P0 唯一串行补执行 | 72188/0 | 同脚本/同env/原80ms未改，28/28绿；有效95项各有真实通过执行 |
| guard | 71950/0 | 原增改删/缺根语义绿；WATCH五个缺失标记只属新freeze |
| close executor | 72488/0 | 真实supervisor收据及`CLOSE exit=0`；不把executor当产品child |

full + 有效DOM恰覆盖528输入中的 **171产品test文件/1782实例**，无重叠遗漏；special7另列。新full包含人员原两文件五例，本件签的是这次新完整执行，不把旧五例开发记录冒独立 AUTO。

DOM新配置全文与独立重建文本完全相同：仅两精确test ID、单个createRequire anchor替换、单独cache，保base插件/oracle；两原test指纹与SOURCE报告一致。transformed SHA来自封存Main声明，本角色不读取产品文本重新算它。scheduler/checklist/C02/special沿旧→新路径逐字一致，专项三SHA不变。

**P0只签结果恢复，不签永久修复/超时根因/并发稳定。** 原full/DOM/noEmit/verify实际重叠，与计划顺序有偏差；noEmit不输出、两suite独立cache，保护原证无漂移。当前适用门为每个默认脚本具有一次有效完成执行，非“同一聚合从未红”或并发压力门。close仍保存dom1/verify1，effective独立补记，不改旧红、不宣称原95聚合exit0。

保护声明 main528、mainlib463、旧lib455、launcher26、三依赖复制无共享inode/外链/变化；旧依赖内容manifest与新保护manifest全等。新455产物由Main close/seal实核，client1723200 B / `d262561e6bae3f8acbf3e64be34d6b9431040eeef8017209e27dc451cb8497ac`。本角色只核声明/真实执行器原件及收据，不读活lib/runtime/主源、依赖实体或正式根，不称全机零污染。

## 实际审证与停止

自有 reader仅内置fs/path/crypto/assert，无产品import/eval/spawn。首audit PID74913，`03:43:07.139Z→03:43:07.682Z`，exit1：六组有效，verify解析误限单空格。唯一verify reconcile PID74983，`03:43:49.470Z→03:43:49.490Z`，真实exit0，七组有效；不重复已绿组。补充source-chain reader误取人员readback顶层seal，实际exit1保留；未生成有效新审计，Main要求尽快封后停止该非必要展开，不重跑。准备rg127/memory1/login参数拒绝同样保留，均非产品FAIL。

Main11阶段supervisor区间去重并集183.292秒，父子不双计；不是全回归墙钟或本审人工作业净时。首实际UTC采样03:40:35Z，正文前检查点03:45:28Z；更早读取仅工具耗时，无完整UTC不倒填。逐步命令原结果见 `command-receipts.json`；seal/readback实际结果另件，不预填。

**Remaining：Main可继续原新host/首读/stale/O4/人员FD合同采证，交原独立GUI专家审签；不新增矩阵、不重派已签两保存。** 当前有限SOURCE/AUTO无需重跑1869或产品全绿项目。整原ID/父ordinarycommit仍待全部原适用独立门齐，本件不签父完成、不git/push/release/正式切。

仓库只写本r2前缀，自有tmp保留reader；R1仍计划准备finished，不冒旧角色running。无send工具，正文与实际末封落盘供Main回读，不声称发送成功。**仅实际seal/readback0、工具exit0收据写入并最终reread后 released / STOP**；状态以本前缀实际收据为准，不以本句代真实终码。
