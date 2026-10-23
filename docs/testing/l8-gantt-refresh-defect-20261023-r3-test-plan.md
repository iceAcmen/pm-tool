# L8 甘特状态最小修复先行测试合同 R3

> 2026-10-23，平台 trae，独立原证审签及缺陷合同角色。此为先行用例规范，不是产品实现、执行记录或修后 PASS。Main 为唯一 builder / GUI / 桌面执行端；开发负责修复，独立专家审证。本角色不改业务、不执行这些产品用例。

## 1. 对象与最小修复

只修 `packages/dsh-pm-tool/src/client/views/gantt.tsx` 的状态显示语义。封包原/当前源码 SHA 均为 `838a43451e037fdff363ce73e00570512d785f09f45688bf17afdb08ebc730bf`；原 `ganttStatusText` 第 40-43 行与 `renderBar` 第 349-355 行都遗漏 `wrapped`。

开发最小动作：补齐 `ganttStatusText` 的五态映射，条体 `statusText` 复用同一映射，消除左列与条体 aria 的重复分支。继续保留 `done = t.status === 'done'`；不把 wrapped 加进 done，不新建状态颜色、组件或样式矩阵。文案沿既有任务页“已收尾 · 非正式完成”，不引入新的产品语义。

| 合法状态 | 甘特左列状态文案 / 条体 aria 状态片段 | done 判定 |
| --- | --- | --- |
| todo | 待办 | false |
| in_progress | 进行中 | false |
| blocked | 阻塞 | false |
| done | 已完成 | true |
| wrapped | 已收尾 · 非正式完成 | false |

冻结不变项：旧四态映射、进度解析/填充、清单客观进度、pendingAcceptance、聚合/逾期算法、父范围带、所有存储写语义、日期拖拽/键盘写通道。不得为让本用例绿而改 L8 为 done、清洗 cache 原失败、手改业务 JSON、补造原 PNG 或改写原候选。

## 2. 先行用例

以下四组仅展开本单指定语义与不变项，没有新增设计矩阵、整 OP 或其他域用例。当前均为 **NOT_RUN（修复前合同）**；原缺陷仍 **FAIL**。

### L8-R3-T01 五态显示与共享映射

- 前置：用既有合法 task fixture/factory 构造五态；保持同一套 ID/标题/父关系/清单/进度输入。包含原 L8 条件：wrapped、legacy progress=0、清单 1/1=true、无 startDate。
- 执行：由开发/Main 在隔离候选中运行真实甘特组件的表驱动测试，逐态读取左列副行；不能以源码关键字扫描或测试内复制一个映射函数替代产品渲染断言。
- 预期：五态逐项等于上表；wrapped 不含作为状态的“待办”或“已完成”；旧四态逐项不变。原源码应在 wrapped 项失败，修后才可通过。
- 回读/证据：fixture 合法来源、被测产品文件指纹、五态实际渲染输出与真实测试命令/退出码。若需增加产品测试文件，由开发在 Main 授权的修复写面安排；本专家只交此规范。

### L8-R3-T02 左列与有排期条体 aria 一致

- 前置：同 T01 五态的隔离合法 fixture，使用既有合法日期输入补齐 startDate/dueDate。原封件 L8 未排期，不能拿它的无条体结果当此测试通过。
- 执行：真实组件测试逐态定位左列及 `data-task-id` 对应条体，读取完整 aria-label，不按 `button` 标签猜选（现有条体是 DIV role=button）。
- 预期：aria 中状态片段与左列同映射；原日期、工期、进度文本与操作提示保留。wrapped 行无 `is-done`、非派生条无 `st-done`，状态不被改写为 done；不要求新增 wrapped 色类。
- Main 后继合法 GUI：在已认领隔离候选，先按原未排期 L8 浏览/刷新，再用正常任务日期保存入口准备有排期 L8，进入甘特并正常刷新。采原请求/返回、完整行/aria、实际 PNG/帧及业务记录。原 L8 若需保持不可写，则在合法重建的隔离 fixture 上执行，不触碰原封件或正式数据。
- 限签：未排期部分只验证左列；有排期部分必须命中真实条体并有真实 GUI 原件。DOM/自动测试不冒充目视状态字形；按原合同正常可达呈现采证，不改 CSS、不追加 tooltip 或视口矩阵。

### L8-R3-T03 原 L8 重进/刷新与业务不变

- 原对象：QA-OP / p-0001 / t-0010 / F2-L8 / code=6 / parent=t-0001；wrapped，dueDate=2026-10-20，无 startDate，legacy progress=0，清单 UUID `90156246-014f-4ba3-9693-e34edd29871c`、1/1=true，无 completedDate。
- 执行：Main 在修后认领的隔离实例，正常任务页进入甘特、点击原“刷新数据”。配对同 rpcId 的 `/pm web snapshot` 请求与成功返回，绑定随后原行和任务落盘回读，不只检查 HTTP 200。
- 预期：任务页既有 wrapped 表达保留；甘特左列显示上表 wrapped 文案，不再落入待办。snapshot 与任务记录同对象且仍 wrapped；ID/父关系/清单 UUID/勾选/legacy progress/日期/完成日期均不变。原未排期 L8 仍无条体。
- 证据：按原 R3 的始末业务/files/backups 清单及复制字节核对；另单列全 data 的宿主 session cache 变动。若 cache 新增，保留全 data 不同及真实执行失败，不把业务零写泛化为全盘零写，不为该缺陷删除 cache。

### L8-R3-T04 既有进度/聚合/日期写回归

- 进度控制沿原例，不新做生成报告旅程：L8 客观100而 legacy0/非done；L5 清单2/5、manual=null、条体40；L3 无客观证据、manual=null、legacy40、空填充。父 F2-P/F2-M 原客观63、覆盖2/3与2/2保持；原两固定报告 snapshot.averageProgress=66 不被展示修复重算。
- `done`/completedDate/统计/逾期等行为沿原获批测试；不把任务页命名视图“已完成3”与正式完成2混作同一统计，不用客观100断言正式完成。
- 日期写不新增操作矩阵：Main 运行原既有 `scripts/verify-gantt-drag.mjs` 与现有相关日期回读用例。成功写仍只改变原日期字段及既有更新时间元数据，不改变状态/清单/进度；不新增/删除完成日期。
- 产品修复后：Main 唯一 builder 重建并运行当前包全部 `scripts/verify-*.mjs`、本合同专项及受影响既有 GUI 回归，逐条交原证；独立专家重新审受影响门。失败不洗绿，不以完整离线回归替代 T02/T03 真 GUI。

## 3. 证据继承与停止

仅本次报告/测试规范/reader 不改变产品，不使 Main 当前有效完整回归整体失效，不要求现在重跑。产品修复发生后，旧五态/左列/条体 aria 的受影响证据过期；全回归及受影响 GUI 按上节执行，其他原证由专家按文件影响审继承，不无差别重开全 OP。

本合同不签 OP/B8/父 ordinarycommit，不授予新功能、push、release 或正式切换。原父批次 ordinarycommit 授权由 Main 处理；本 L8 专家不作父批次放行结论。Main 可继续独立 F1/FL/MAX 准备，本合同不占其 builder/GUI/桌面资源。

报告和合同真实封印/回读完成后，本角色 **STOP/released**。后续修复、产品测试及 Main GUI 是后继工作，不在本轮执行。
