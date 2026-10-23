# 明确传输异常的结果卡反馈修复

> 2026-10-22，trae；既有持续验收/确证修复授权。先行合同与必要红由独立专家落盘；不新增审批、功能或英文正文关键词政策。

目标：关闭[A15-IM-GUI-01 / A17五必要红](../testing/a17-transport-feedback-contract-20261022.md)。明确catch已返回false，但原英文原因被全局卡按成功绘制；仅修错误呈现，保持原预览/输入/重试。

限定文件：`packages/dsh-pm-tool/src/client/panel.tsx`的run catch；新同域`client/panel-transport-error-feedback.test.tsx`。复用已导入`prefixFeedbackOnce`给“执行失败”场景，保Error.message/String(error)全文；不改分类器、ResultCard、CSS、宿主协议、刷新错误或成功信封策略。panel其余全文尤其A16扩展baseline保持字节。

1. 开发自有完整当前源码冻结，原TF-C控制绿/TF-F五红复现，禁止改专家expect；记录源码/原A16已冻结lib保护。
2. 最小catch前缀修复，原五红转绿。成功标题含失败/Failed/Error仍成功；false/busy/inflight/quiet/复制原文/局部CSV-XLSX同预览重试及原65回归不退化。
3. 自有no-cache单fork白名单HOME/TMP/cache跑原组/必要新同域测试、受影响回归与完整noEmit。所有失败原件保留，不build/install/GUI/服务/凭据/共享缓存/commit。
4. 开发`reports/a17-transport-feedback-developer-20261022*`交回释放；不同专家SOURCE/AUTO复验。Main继续A16原candidate确认守卫/四扩展GUI采证，该旧实例不倒签新catch。
5. 独立通过后Main另建新输出，完整回归/新实例/实际下发和原故障重试GUI审证；不覆盖A16lib/原导入FAIL。全适用积压整门闭合后最后统一普通commit，无push/tag/发布/正式切换。

运行环境macOS、nvm Node22.23.3、pnpm11.28.5；实际argv/exit/hash必须落盘，不把占位或作者绿写成独立PASS。
