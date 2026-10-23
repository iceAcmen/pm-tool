# catch错误类别独立于正文的最小收口

> 2026-10-22，trae；沿持续既有验收/确证修复授权，不新增功能。先行[A17-TF-X08必要红](../testing/a17-transport-feedback-independent-retest-20261022.md)已独立冻结，原A17五红已绿但完整门FAIL；不得构建原A17候选。

目标：明确catch保持错误类别，正文含`[pm:summary]/[pm:detail]/[pm:action]`也不反转成成功、不自动消失、不从错误原因生成可执行动作，原文全部显示/复制。正常成功信封及含失败/Failed/Error成功标题仍按现规则。

有限写面：`src/client/panel.tsx`结果状态/明确run catch/FeedbackToast与ResultCard透传；`src/client/result-card.tsx`可选错误上下文；`src/core/ui-feedback.ts`现classifyFeedback可选显式错误上下文；必要`src/client/panel-transport-error-feedback.test.tsx`补真实原因标记反例及同域分类/结果卡测试。所有旧字符串调用缺省行为保持，刷新/恢复/导出不主动扩修；新正常消息/关闭须清显式错误类别，状态与正文原子对应，旧timer/复制代际不影响新消息。

设计选择：类别由已知catch给出，生产共享分类函数在显式error时将正文完整当非结构化原因显示、error=true、TTL=null、action=null；不扫英文关键词，不删除正文标记，不靠前缀覆盖成功信封。错误原文仍可复制。新增参数为内存呈现上下文，不改宿主/存储/业务API。

执行顺序：

1. 不同开发完整冻结当前主源，原TF-X08红、五TF-F控制绿复现；原专家expect/失败只读。
2. 最小实施上下文，真实PmPanel/ResultCard/Toast错误常驻、原全文/复制；错误正文动作标记不可执行，成功后的错误上下文清除，timer/旧复制不串；PC/扩展与原恢复预览行为不退化。
3. 自有no-cache单fork白名单HOME/TMP/cache跑原五组/20独立反例/14开发/65及受影响PC/扩展、类型检查；原失败保。不build/install/GUI/共享lib/cache/服务/凭据/commit，报告`reports/a18-feedback-error-context-developer-20261022*`释放。
4. 不同专家独立复验后Main新A18输出/完整回归/新宿主/完整下发/原实际导入故障与恢复GUI。A16原实例/产物仍归旧守卫证据，A17预备runtime未启动，旧FAIL不抹除。

环境macOS + Node22.23.3/pnpm11.28.5。最终全部适用积压门閉合后普通commit，无push/tag/发布/正式切换。
