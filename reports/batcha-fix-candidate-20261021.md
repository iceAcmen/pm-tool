# batchA三项确证缺陷修复候选

> 给独立专家和Main采证者使用。本文记录开发修复与验证，不给独立PASS。当前候选为9b1a8c5/产品2a76030加本批未提交差异；所有者已批准持续验收及最后commit，未授权push/发布。

## 1 修复范围与方案

依据[独立专家缺陷单](../docs/testing/batcha-independent-findings-and-main-worklist-20261021.md)。既有目标明确，先考虑仅组件key重挂、effect重置、代际保护三方案；采用代际保护并抽取真实ResultCard，覆盖同组件消息更换与异步迟到，样式及成功信封行为沿用。

| 独立缺陷 | 文件 | 实现 |
| --- | --- | --- |
| BA-DEF-01 | `launcher/src/local-app.mjs`、`launcher/test/local-app.test.mjs` | POSIX单引号字面量转义；中文/空格/单引号/特制路径语法与变量值回归，stub不启宿主 |
| BA-DEF-02 | `launcher/src/launcher-app.mjs`、`launcher/test/app.loopback.test.mjs` | 新open/reopen/retry/switch/cancel/back撤销旧句柄；nonce绑定当前旅程/browser；未校验回告不进S4；在途owned启动被替换后弃认证URL、不误投递或杀ready服务 |
| BA-DEF-03 | `packages/dsh-pm-tool/src/client/result-card.tsx`、`result-card.test.ts`、`panel.tsx` | message变化清复制和详情状态；异步复制结果仅当前generation可更新；组件卸载也失效 |
| 测试支撑 | 插件`package.json`、`pnpm-lock.yaml`、`scripts/verify-ui-feedback.mjs` | 测试开发依赖react-test-renderer18.3.1及类型；原静态反馈断言改核真实抽离组件并保面板接线，不降低行为要求 |

Main为唯一产品写者/builder，隔离树`/private/tmp/pmtool-all-closure-20261021`；不重建主树lib，不改正式服务、profile、数据、上游或vendor。专家只写testing，本记录不改其用例。

## 2 作者验证

- 修前两项launcher新增回归：12项中10过、2失败，原证`/private/tmp/pmtool-closure-launcher-red.log`；证实路径拆分及旧nonce被接受。
- 修后同组12/12，原证`/private/tmp/pmtool-closure-launcher-green.log`。
- ResultCard真实React组件4项+copy writer3项：7/7，基于隔离树测试；覆盖复制A→B、迟到resolve/reject、失败提示重置。不是自建状态模型。
- 冻结依赖已在隔离树安装；主树仅lockfile-only，未重建bundle。
- 后续独立复验发现迟到探测/旧启动失败覆盖新状态、重入单flight遗漏。已在编排每次替换先cancel旧在途，探测前认领journey，探测成功/失败与启动成功/失败全程对称核代际；新增`launcher/test/journey-race.test.mjs`。作者launcher49/49，原证`/private/tmp/pmtool-closure-launcher-tests-r2.log`。
- 抽离引起两个源码静态断言仍查panel，已改核真实ResultCard与panel接线。`contract-pilot.test.ts`原11格保持；不降低error role/原文/权限标签断言。
- 首轮pnpm test与guard并行时，file-root默认测试创建空assets使guard污染1。独立专家确认设施根因；改`core/file-root.test.ts`以真实module mock只拦默认mkdir并核mode/路径，explicit/isolated/profile仍真实文件系统。一次spyOn不可配置失败保留，新mock专项20/20，外层assets未创建。
- 当前顺序全量：Vitest125文件/1134项通过；guard95/95污染0且assets仍缺失，日志`/private/tmp/pmtool-closure-plugin-tests-r3.log`、`pmtool-closure-verify-r3.log`。旧首轮污染失败保留。
- 真实GUI/桌面待执行；专家决定独立复验和证据继承。尚未完成、未commit/push。

## 3 下一步

冻结当前diff/新文件指纹→隔离build与地基→完整自动化→按专家新旧用例真实采证。TTL由专家纠正为有限10min，130s接受/601s拒绝须真实计时不改时钟；可以与其他采证并行计时。EGO首次space创建与后续查询无输出，有界恢复后切稳定工具，不凭工具失败暂停其余验收。
