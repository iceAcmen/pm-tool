# P1005 backdrop 有限 SOURCE/AUTO 独立审签

> 2026-10-23，trae 独立 SOURCE/AUTO 专家；非开发、非 GUI 执行端。只签本单锁定字节，不签 B8、P1005 整项、父出口或 ordinary commit。

## 1. 判定与授权

**PASS_LIMITED：当前 backdrop delta 的 SOURCE 与下列 35 条有效独立 AUTO。原 P1L2-F02 有限 GUI FAIL 保留，根因仍无证；不能说此修已关闭 F02。**

负责人原句：“父授权持续验已实现未验/修确证缺陷至ordinarycommit，无push/release。你独立SOURCE/AUTO专家非开发/GUI。只审P1005开发backdrop delta+新真实ReactDOMtest……你自己runner独立运行一次新DOM专项及原records-options/payloads/history/form-validation确切28例……只有限SOURCE/AUTO签当前锁字节，不GUI/B8/父出口。”

已读 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md#九独立测试门控adl-0452026-10-12-起长期硬规则)、[原专家 §5/§7](p1-l2-events-gui-review-20261023-r1.md#5-p1l2-f02-与失败收据)、[开发报告](../plans/2026-10-23-p1005-deliverable-pointer-report.md)、开发 plan/baseline/runner/receipts/seal-r2/final-check-r2。只读取开发 runner，不执行、不 import；独立编写本前缀 [runner](p1005-listbox-backdrop-source-auto-20261023-r1-runner.mjs) 与 [设施纠正器](p1005-listbox-backdrop-source-auto-20261023-r1-recovery.mjs)。

本单明确授权覆盖通用 Git 拉取、install/build、全 verify、livingdocs 同步动作；这些均未执行。未改产品、旧 testing/plans、原封件、P1004/P1005 reflect/K16 在途成果；未访问 private 冻结路径、凭据、服务或 GUI，未清共享 dirty。ordinary commit 留父 Main，push/release 不在授权内。

## 2. 独立字节核对

[capture](p1005-listbox-backdrop-source-auto-20261023-r1-capture.json) 为本角色逐字节读取与计算，不接受开发 green 作为独立 green：

| 核对对象 | 结果 |
| --- | --- |
| baseline 声明 | 1102 个去重输入；仅 1 个已认领变化为 listbox，其他 1101 与原声明 size/SHA 相符 |
| 原 P1L2EventsR1 | 1077/1077 原字节相符；index 单列，SHA `bcd70eb34ec33b4c1cec4d88e86eba30d3fc0488e939725cd191de82557c2180` |
| 开发 seal-r2 输出 | 39 个 plans 输出 + 186 个 tmp 文件共 225 个逐 size/SHA 相符；另核 seal-r2 SHA 与 final-check-r2 绑定 |
| 原 listbox | 4737 bytes，SHA `790533aed66fa35a6258e8a37c345058b8204d9d91cb86684e48453218f9cf7d` |
| 当前 listbox | 4886 bytes，SHA `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2` |
| 新 test 实际名 | `records-deliverable-pointer-dom.test.tsx`，9159 bytes，SHA `6de116ba10c320a162f1c465958f428ca9023e328b67827581db9ea23df42aec` |

基线提交 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅引用原封存声明，不称本轮 Git 实核或用 HEAD 代 dirty 候选。字节签署以本节候选/test SHA 与 capture/execution/recovery/seal 为准，不代表新 bundle/宿主身份。

独立对比冻结旧 listbox：仅第 109 行 backdrop click handler 从 `setOpen(false)` 扩为原因注释、`event.preventDefault()`、`setOpen(false)`，1 行变 5 行。源码字符串精确重建与 `diff -u` 双核相符；diff exit 1 是正常差异，不是产品失败。未改 option choose、span、trigger toggle、键盘、disabled、save、form、overlay、CSS、业务/反思代码。没有全局 preventDefault/stopPropagation。

## 3. 真实 DOM 与稳定红

真实生产 `RecordsDeliverableForm`、`RecordsListbox`、`RecordsOverlay` 从锁定字节复制到隔离 inputs；只在公开 callbacks 边界记录参数，无业务写入口、无 helper mirror。fixture 是同项目 p-0001/dlv-0001/m-0001、planned、null 日期与合法备注，保真实表单校验和 payload 归一逻辑。

事件模型为 native `MouseEvent` 名称 pointerdown/mousedown → 显式 button focus → pointerup/mouseup → HTMLElement.click，进入实际 ReactDOM 的捕获/冒泡/submit 链。**这不是真实用户指针、坐标命中或浏览器 layout；JSDOM 的 isTrusted/default label click 不能冒 GUI。**

本角色独立读开发原收据、原源码快照、测试结果和 observations（不运行旧红脚本）：dom-r2 旧源码 5绿2红，最终 9159-byte test 在 red-final 同一原 listbox 上仍 5绿2红，均为 D04 实际 form+overlay 与 D06 最小 label 红，D01/D02 option/button/span、D03 trigger、D05 false-save、D07 div 绿。red-final receipt 的 `inputs` 是调用前主树，不混为实际旧源码；实际来源按 `actualSourceInputs/originalFrozenSource` 核原 4737 bytes/SHA。两次最终开发 green 均为本节候选与同一 9159-byte test，各 7/7，仍只是开发证据。

红 D04/D06 原链均为 `trigger(detail0) → backdrop(detail0) → trigger(detail1)`，backdrop bubble defaultPrevented=false，calls=[]；div 控制不出现额外 trigger。独立有效绿仅 `trigger → backdrop`、defaultPrevented=true、expanded=false、无 menu/backdrop、零 submit/零 callbacks。这支持**局部 backdrop 的 label 默认激活因果**，不支持将原 round09 option 点击也归于同因。

## 4. 有效独立 AUTO

macOS/bash，绝对路径 nvm Node `v22.23.3`、Vitest `2.1.9`、React/ReactDOM `18.3.1`、JSDOM `25.0.1`；pnpm 11.28.5 仅项目环境口径，未调用。有效结果见 [recovery](p1005-listbox-backdrop-source-auto-20261023-r1-recovery.json)，原执行及保留日志见 [execution](p1005-listbox-backdrop-source-auto-20261023-r1-execution.json)。

| 实际专项 | 有效结果 / 覆盖 |
| --- | --- |
| 新 DOM D01/D02 | 2/2；button/span 两路径 accepted 后 popup 关、未 save 零调用；明确 submit click 各一次 save(p1,dlv1,accepted payload)+saved，native submit capture=1、bubble preventDefault=true |
| D03 | 1/1；重复 trigger 一次关闭、零 submit/调用 |
| D04/D06/D07 | 3/3；真实 form+overlay、最小 label、div 三境 backdrop 关；无第二 trigger、零 submit/调用 |
| D05 | 1/1；false-save 不调用 saved，accepted 与合法备注保留、按钮重新可用；再次 save 参数完全相同后才 saved，两次 native submit |
| records-options.test.ts | 8/8；选项/中文回显/过滤副本/环形定位，含 wrapped 与 manual/session |
| records-payloads.test.ts | 11/11；会议/行动项/汇报/交付物归一、可空字段、来源/关联/备注、状态保留/回落 |
| records-history.test.ts | 3/3；只读历史投影、中文/未知 field/空历史/wrapped。数组保全断言仅现有测试强度，不冒多历史深比较 |
| form-validation.test.ts | 6/6；实际是 OKR/习惯长度、日期、归属格式、parseIdList，不冒“六个交付物负例” |

有效分母 **7 + 8 + 11 + 3 + 6 = 35**，不是含首轮污染的 42，也不是整包/全候选回归。四旧专项只执行一次；新 DOM 首轮设施污染拒签后，仅在新隔离根恢复一次，不额外跑新产品专项。

readonly 边界：历史投影与相关生产源码未改，纯只读/未提交例零 callback；控件 disabled 传递及 submit 只读/禁用实现保持原字节。**本轮没有 disabled/read-only DOM fixture、pending-save 并发、键盘 DOM、异常 reject 或完整业务失败落盘用例，不据源码未改扩大 AUTO PASS。** D05 只证 callback=false 恢复，不证 RPC/rawDB 失败原子性。

## 5. 设施失败与隔离

首轮我的 identity setup 在 JSDOM 安装 globals 前 import ReactDOM，改变 canUseDOM/input-event 检测。Vitest 仍 exit0、7断言绿，但 stderr 有 **10 次 Uncaught attachEvent/detachEvent TypeError**；不能据计数绿签事件设施干净。初版 execution 的 allPassed/exit0 仅是当时断言结果，**独立审签明确不接受其 DOM 7 例**。未给 HTMLElement 加空 attachEvent/屏蔽错误，也未改产品/test 造绿。

纠正器在 afterAll、实际生产 DOM suite 之后才 import ReactDOM 做对象 identity：React === ReactDOM 来源 require('react') 为 true，两者18.3.1，保原加载序列。新 DOM 7/7、exit0、stderr **0 bytes**。原四专项28的 stderr也是0 bytes、无设施污染，输入未变所以不重复执行。

写根只有本前缀新 docs/testing 文件及：

- 首轮 `/tmp/p1005-listbox-backdrop-source-auto-20261023-r1-jXA2wI`。
- 纠正轮 `/tmp/p1005-listbox-backdrop-source-auto-20261023-r1-recovery-BvvKqY`。

两根各自 inputs/config/cache/home/output/tmp；仅四个既有 node_modules 只读链接，无 install/copy 依赖，无共享 lib/cache 输出。env 采用 PATH/HOME/TMPDIR/XDG/VITE/CI/QA 明确白名单，不继承凭据。采证与声明依赖前后保护 **641 文件**，ReactDOM react resolve 与 alias/root 同源，运行时再核同一对象。不冒全 node_modules/全磁盘保护。

探索设施另有 rg exit127×2、猜错可选测试计划路径 grep exit2、历史核对 node -e 括号错误 exit1（未执行读取逻辑）；均保留于 [命令审计](p1005-listbox-backdrop-source-auto-20261023-r1-command-audit.md)。宽域只读 grep 终端未返回末码，记录 NOT_CAPTURED，随后 pgrep exit1确认无该运行进程；不补造末码，不把它当产品 FAIL/PASS。原工具输出过大未访问其 private 产物路径。

## 6. 实际调用点与原门

全 `src/client` 只读调用检索：**五个生产 consumer、十三处 JSX**，另有 records index export 与两个会议 test 引用；不是开发报告只列的七个 records 调用。下表只映实际共享接点的原门，**本单未执行/签这些 GUI 或 B8 格，不新增全局矩阵**。

| 源码实际调用点 | 受影响原门 / 处理 |
| --- | --- |
| records-deliverable-form.tsx:103/108，status/milestone，均嵌 label | F02 原 §5指针+键盘对照；RA-MENU-13/15、RA-DR-05..07、RA-J02 中交付物提交。当前仅本节 DOM 7覆盖status；milestone GUI不签 |
| records-meeting-form.tsx:194/283，meeting-status/action-status-${draft.key}，均嵌 label | RA-MENU-17/10、RA-DR-08..10、RA-J02。旧会议 entry/layout test通过 onChange或renderer，不覆盖 backdrop click；本单未重跑或重签它们 |
| records-report-form.tsx:237/250/298，report-status/source/preset，均嵌 label；editMode 来源/周期另只读 | RA-MENU-20、RA-DR-12..14、RA-D10、RA-J04/RA-R01/04 对应选择/明确保存/来源只读切片。选项与payload AUTO有效；GUI默认激活与search不签 |
| okr-form.tsx:92/103/129/149/162，kind/owner/primary/related-pick/status，共5处，不嵌关联 label | RA-DR-23/24/26/27、RA-D12/RA-P2004中现有选择、显式提交、失败输入保留；RA-AT02已有OKR listbox读屏不签。没有 label 默认激活同因，但共享 backdrop 字节变化不能当旧 GUI 自动继承 |
| habit-form.tsx:68，gf-habit-okr，共1处，不嵌 label | RA-DR-17/18/20、RA-P3004现有OKR关联/取消/主保存。fallback输入分支非listbox；checkIns、周期/建议后台不因本delta盲重跑 |

勘误：实际合计为 records 7 + OKR 5 + habit 1 = **13**，不是探索口头计算的十四；以上逐行列出的十三处为最终分母。两个会议 test、export不计生产控件。原 DR/MENU ID来自 [既有映射](remaining-layer-map-20261021.md)，不因为原型有条目就声称生产已经装载/可见。consumer map 未把命令/反思在途字节纳为修复对象。

继承裁决：未变 normalize/history/form-validation 与原事件 backend/合法关联 AUTO不因纯 backdrop 改动重开；其原签限原候选/原对象，本单仅独立重签明确运行的28条。共享 popup 的打开/关闭、焦点、实际 pointer hit、主保存与消费者只读状态由 Main 按上述既有切片重绑定/采证，专家再审，不由35绿替代。全包 build/全 verify/GUI/style/UX均本轮 NOT_RUN。

## 7. 仍待证与释放

原 round09 acceptedpointer 显示 accepted 后仍 open、主save零RPC/timeout/DB零变，没有实际命中/composedPath/坐标证据；原专家 FAIL 不改签。**本单不是“此修已关F02”，也不是后台保存失败诊断。** Main唯一 builder/GUI 绑定新候选、产物、实例、flags后，沿原专家 §5/§7采真实 pointer打开→accepted→稳定closed→明确主save，并对照原键盘切片；诊断补 bbox/elementsFromPoint/事件链时不以程序click绕过真实命中。未证前保持原 F02红；F01/reflect/P1004/K16不属本单。

本角色最终只用 [有效纠正结果](p1005-listbox-backdrop-source-auto-20261023-r1-recovery.json) 与首轮干净28签当前锁字节。seal在正文完成后独立核 **1341保护输入、641声明依赖、两根输出、链接与尾空白**；本文件不自引用尚未生成的seal，防自引用封存失败。输出指纹含首轮污染/纠正设施与原失败，不覆盖、删除或洗白；seal不自指纹。

所有同步 Vitest 已退出，无本单长运行子进程，无builder/端口/profile/数据锁。未停改任何服务；只释放本测试写面。**released / STOP；无 Git/ordinary commit/push/release。**
