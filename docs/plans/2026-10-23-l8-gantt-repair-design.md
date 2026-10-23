# L8 甘特五态映射最小修复设计与实施计划

2026-10-23，trae。目标：落实 [独立先行合同 T01–T04](../testing/l8-gantt-refresh-defect-20261023-r3-test-plan.md)，使甘特左列和条体状态描述正确显示 wrapped，保持其非正式完成语义。

## 设计

只保留 `ganttStatusText` 一个状态映射，新增 wrapped→“已收尾 · 非正式完成”，条体调用此映射。沿现有函数签名与未知值兜底，旧 todo/in_progress/blocked/done 文案不变；`done=t.status==='done'`、状态 class、progressFill/deriveProgressMap、日期写通道不变。两处分别补分支会保留重复规则；抽取新的通用状态模块会扩大受影响源。本批选择在既有单文件复用。

brainstorming / writing-plans 按已授权缺陷修复与独立明确合同应用；没有未决产品选择，不重复请求授权。vendor静态完整性已实际校验0、13文件逐SHA同；本次两行固定映射为 trivial，路由抑制 grill/tdd，独立先行测试仍执行，不把静态绿/自测当PASS。交付边界另按治理留review记录。

## 文件与次序

1. **新增** `packages/dsh-pm-tool/src/client/views/gantt-status.test.tsx`：真实 React GanttView 表驱动五态渲染；使用生产 taskWriteSchema 合法fixture，先证原 wrapped 红。分别核左列/有排期条体DIV role=button的aria同文案，非done class不变；无排期wrapped仅左列且无该条体。沿原L5/L3清单40/null控制，不复制映射实现、不单用源码字符串。
2. **修改** `packages/dsh-pm-tool/src/client/views/gantt.tsx`：只追加 wrapped 分支并复用函数。先行用例同输入修后绿，再受影响纯gantt/进度邻接；不改原testing规范、CSS、业务schema/fixture状态。
3. **新增** `docs/plans/2026-10-23-l8-gantt-developer-*`与自有tmp红/绿/输入差异/真实outer：开发唯一写两产品文件，窄测隔离src/cache/output，现有依赖只读；Main保builder唯一，不整包build、不启服务。
4. **独立复验** 两文件与红绿原证，真实组件必要窄测；通过后Main认领125 changed source/526完整输入（准确数由实际枚举），唯一新隔离build/完整回归/全verify/guard/close，不补拷主lib。其后新实例以原OP完整标准包合法恢复，按T02/T03正常GUI采未排期/正常日期保存有排期，独立审证。

## 验证与边界

环境macOS + Node22.23.3 + 既有pnpm11.28.5。窄測命令：在新隔离包用绝对Node运行既有Vitest `run src/client/views/gantt-status.test.tsx --pool=forks --maxWorkers=1 --minWorkers=1`；配置/源码/依赖/argv/终码/观察一并保存，red与green不得重用同wx目录。完整回归由Main后继实际执行；普通commit等待父全适用门，不以本修先commit。

原L8报告FAIL、PNG尾部省略BLOCKED、有排期aria原NOT_RUN保留；修后证据定向替接。所有原业务、已采P2002TreeR3/其他封件、正式3080/3091与旧实例不变。无新功能/push/release/正式切。
