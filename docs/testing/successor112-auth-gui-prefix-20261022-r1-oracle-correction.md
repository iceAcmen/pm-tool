# 自有组件取文本器修正记录

> 独立先行专家补充，2026-10-22；仅本前缀、自有设施。不改变产品或原已签用例，不把首轮失败涂绿。

首轮实际 **1文件5项：1绿4红、exit1、0跳过**。P-AUTH、P-RATE-PREFIX、C-COLON确实重复前缀；C-SUCCESS通过。C-RAW实际保留两段原因，但自有 `visibleText` 把真实 Markdown 的 `<br>` 拼成空串，导致与含 `\n` 的完整oracle不等。这不是新的产品丢正文缺陷；原输入、实际结果、断言失败和exit1保留。

本专家修正自己的设施：只在本新test的文本取器把 `n.type === 'br'` 读为换行，其他节点仍原递归。仅测试虚拟transform，原test文件、原tmp源、真实 `CopilotPanel`、`MarkdownView`、所有oracle/fixture/断言均不改；没有trim/substring/replace正文，也没有mock组件或分类器。

新 `-runner-r2.mjs` 使用已证明独占且不变的同owner依赖和源码，单独创建新config/cache/tmp/home及结果，不复用旧执行器；transform按本test精确绝对ID与原函数全文/次数1校验。生成适配fixture/SHA方便不同developer与复验专家审查。用例计数仍5，不累计为10新用例。

修正后计划：C-RAW、C-SUCCESS绿；P-AUTH、P-RATE-PREFIX、C-COLON保持必要RED、真实exit1。若出现不同失败，单列并停止，不按测试设施失败改产品。

原首轮close已证原112冻结源/原依赖及自有src/deps/config/transcript不变、PID3086退出。R2同样核输入和进程，之后仅完成有限GUI审证报告并STOP；不签修后、不开发或执行GUI。
