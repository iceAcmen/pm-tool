# F02 选项默认激活最小修复 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> 上述外部子 skill 在当前环境不可用；本计划按仓库 Main 唯一执行/独立专家门逐步执行，不安装外部 skill、不以缺失引用停住已授权缺陷修复。父全部普通提交授权已存在，不新增确认/提交授权。

**Goal:** 关闭原 P1L2-F02 默认 label 场景中“指针选状态后菜单重新打开，首点主保存被遮罩挡住”的缺陷，完成原独立复验。

**Architecture:** 保留受控 listbox、外 label 语义和已有保存通道；只在选项的 click 默认动作接点取消浏览器再次激活关联 trigger，随后沿原 choose 更新并关闭。Main 编码/采证不自验收；原 F02 专家 §6 为测试计划，独立专家另审源码/自测与新 GUI 封件。

**Tech Stack:** TypeScript/React18.3.1、Vitest2.1.9、JSDOM25.0.1；macOS/nvm Node22.23.3、pnpm11.28.5。无依赖安装，无上游/业务/正式服务改动。

---

## 依据、授权与诊断结论

- 原 [F02 独立最小合同 §6](../testing/six-repairs-pointer-gui-review-20261023-r1-report.md#6-原默认-label-场景最小红--修--复验合同) 已授权红/最小修/GUI复验；不追加全 B8 门。
- [F02OptionNativeTraceR2](../../reports/all-pending-evidence-20261021/F02OptionNativeTraceR2/index-r1.json) 443件，封件 inner/outer0；采证同六修525输入、实际3268字节，未改产品。
- round28 原 option **span** 真实点击：capture/bubble `detail=1/isTrusted=true/defaultPrevented=false`；bubble时 value=planned、expanded=false、popup=false。随后非 Main 指针输入产生 trigger **button** `detail=0/isTrusted=true` 的 capture/bubble，最终 expanded=true/popup=true。4000ms闭合等待失败，7段44项roots全同。
- 五份当前源码与旧实际下发/complete一致；外 label 的关联 trigger 和 option卸载后默认激活链与观测一致。**Main 工程诊断支持默认激活根因，独立因果审证 PENDING；不回填原r1报告为“当时已证”。**
- 浏览器仅临时安装 passive document click观察，无 preventDefault/stopPropagation/DOM/props/store修改；已移除两监听，后续真实backdrop/cancel未再产生日志。原26页面ready失败/0RPC/outer1保留，27正常续接。
- 同时 [P3004NegativeGuiR1](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/index-r1.json) 893件已封，原独立GUI待审。它用既有文本回退，与本option处理差异具体无关；是否继承由专家给，不由Main代签。

本轮继续 applying brainstorming/writing-plans/diagnosing-bugs/tdd，覆盖范围来自既有合同，阻塞信息已足，无重复提问。`verify-external-skills`已实际exit0核两个注册vendor全部指纹；只读锁定mattpocock commit `49dd158d1076134a641b33efb035946536778336`。rootCause阶段仅 diagnosing-bugs，不叠code-review；根因链补齐后进入既有可测修复tdd。缺失codebase-design/HITL/setup均不调用。原test seam已由专家授权（实际生产form/overlay/listbox/nativeDOM+原键盘GUI），不再向负责人索取同一授权。

## 方案比较与选择

1. **选项 onClick 局部 preventDefault（采用）**：拦住原 native label 的附加激活，保选值/close/label/键盘与保存逻辑；与已证backdrop接点方式一致，生产只改一个handler。
2. 改外 label 结构/显式关联：可消除隐式激活但扩大生产form/label及其他consumer布局与读屏范围，本单无需扩改。
3. stopPropagation/全局拦click/程序主save：冒泡停止不能取消native默认激活，全局或程序保存会改变原用户行为；不采用。

## Task 1：先锁输入和必要红

**Files:**
- Modify: `packages/dsh-pm-tool/src/client/views/records/records-deliverable-pointer-dom.test.tsx`
- Create: Main新前缀隔离runner和收据，放 `docs/plans/2026-10-23-f02-option-default-*` / `reports/all-pending-evidence-20261021/F02OptionDefaultDevelopmentR2`。
- Read: 本443件原封件、原7DOM、原35案SOURCE/AUTO报告及当前17份指定source/tests；不运行旧runner/改旧原件。

1. 捕获修前生产listbox（4886B/SHA `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2`）、原DOMtest（9159B/SHA `6de116ba10c320a162f1c465958f428ca9023e328b67827581db9ea23df42aec`）及525完整输入基线，新source原件另存。
2. 保原D01..D07断言不变；在同实际form+overlay增加D08/D09，分别button/span选项接点，观察真实native click在document bubble的 `defaultPrevented=true`、没有额外trigger激活，值正确/菜单关闭/零保存。断言只观察公开DOM事件，不mock choose或手工重放“额外trigger”来造红；JSDOM不能冒浏览器默认时序。
3. 新test在原未修改生产listbox上运行一次，必要预期原7绿、2新红。保实际stdout/stderr/exit、每例事件及同一test SHA；若设施污染/没有必要红先修runner/诊断，不改源码凑绿。

## Task 2：最小实现与开发自测

**Files:**
- Modify: `packages/dsh-pm-tool/src/client/views/records/records-listbox.tsx`，只 option onClick。

Step 1：原handler

```tsx
onClick={() => choose(option)}
```

替换为：

```tsx
onClick={event => {
  // 选项卸载后的外层 label 默认激活会再次点击 trigger。
  event.preventDefault()
  choose(option)
}}
```

Step 2：同一test SHA运行一次green，预期9/9、stderr干净；原records-options8/payloads11/history3/form-validation6一次28/28。若有失败按证据修原缺陷，不扩大门或重跑已签未受影响全套。

Step 3：runner每次新隔离root、17份实际生产输入、副本与4声明依赖只读链接；React与ReactDOM显式同来源alias。JSDOM先安装globals再import ReactDOM，identity只能suite后核，避免旧attachEvent污染；config/cache/home/output/tmp全隔离，不写主lib或共享cache。完整argv/cwd/env白名单/exit/result/observations/前后SHA入新包，无凭据。

Step 4：开发delta只两文件，保护原525输入中其余523、旧443/893/1507/353/1822封件；输出开发报告/文件级影响表/完整收据，标 **独立SOURCE/AUTO/GUI待审**。不自行签PASS、不提交。

## Task 3：独立源门、Main统一后继与原GUI

1. 当前multi_agent `followup_task`对原开发/专家均返回finished；新建工具发现无结果，marketplace也无可用替代，**仅本派单设施受阻**。不由Main接独立验收。下一阶段先恢复原分工可用工具，派独立新SOURCE/AUTO专家：只本两文件及9+28原专项、新诊断/开发封件，自有testing前缀；不重复审F01。
2. Main唯一builder，新freeze绑定完整tracked diff/新文件/SHA；原六修freeze和3268已下发字节保，不能只改其lib冒新候选。源门齐后父既有完整build/noEmit/allverify/DOM回归只对新候选一次，再独立审。
3. 按原专家§6：新实例/真实字节/开关绑定，正常备份及真实侧车恢复当前3268合法F5（含E/H，非手写库）；真实表单主save准备planned并核RPC/raw，单列夹具写。
4. 实际pointer打开→accepted选中→稳定closed/expanded=false/遮罩消失、选中零RPC/零写；主save中心命中button/子节点，**明确唯一首点主save**→完整成功RPC/payload/raw→关层→正常重进。
5. 同字节原键盘选择/Enter主save对照一次；保旧任务/两L2/旧反思/files字节。新图/帧/命中/native事件/roots/outer给独立GUI专家，不用keyboard绕首点失败。
6. 共享13处consumer受影响选择/close/保存按[原索引](../testing/p1005-listbox-backdrop-source-auto-20261023-r1.md#6-实际调用点与原门)裁原已有余项继承/重测，不新增整B8矩阵。父其他原六修/P1history/rest/FL MAX/L8/native/VoiceOver/B8和全部ordinarycommit范围保持，不缩成仅F02。

**提交停止条件：** 所有适用独立门齐才 exactstage 本批全部 ordinarycommit；无push/tag/release/正式服务切换。任何本方案代码/测试仍NOT_RUN时明确留账，不以计划代实现/门。
