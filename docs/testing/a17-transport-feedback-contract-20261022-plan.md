# A17 传输反馈先行最小合同与必要红计划

> 2026-10-22，trae 独立测试专家，非开发。给 Main/开发及接续专家核对 A15-IM-GUI-01 的最小修复边界；不签新 GUI、发布或提交。

## 1. 授权与范围

负责人原句：

> 独立先行最小合同/必要红，非开发，A15-IM-GUI-01 P2反馈FAIL。只docs/testing/a17-transport-feedback-contract-20261022*；不产品/其他testing/livingdocs/build/GUI/install/services/credentials/commit。读AGENTS/collab、a15-import-fault-gui-review原实际csv/xlsx-failedPNG/commands/observations、core/ui-feedback/classify、client/result-card/PmPanel run catch/refresh/executeRaw。原英文 Failed to fetch被字符串classifier当success/status，不能用新增英文关键词广扫正文误判成功标题含失败/error；建议更小在已知catch边界带中文执行失败前缀/结构或已有错误信封，ui-feedback同生产ResultCard尊重原因，保原全文/局部preview/busyretry。先核有效合同O3/RA-N01，不预定implementation。真实PmPanel/生产ResultCard先控制成功合法标题含失败/Failed/Error不误红，transport throw Error('Failed to fetch')/AbortError/unknown至少明确catch失败的必要红；刷新错误另按现合同界线不扩。自有完整当前源冻结，真实组件既有reacttest/Vitestno-cache单forkenv白名单HOME/TMP/cache，计划先落，原necessaryred/exits/reporter/图范围保。明确推荐限定product files panel run catch与必要samearea helper/test是否足够，不改产品自验。A16开发已释放但独立retest在跑、main独builderGUI；不覆盖其freeze。终报告PASScontrol/FAILproduct及先行repaircontract交回释放；不签新GUI/发布/commit。用户持续既有验/缺陷修/独立分工授权，Main继续不相关PC/成长采证。

本次具体范围优先于通用 SOP：不 fetch/pull 脏树，不 install/build/full verify，不写 livingdocs，不 commit/push。只加载既有只读依赖，不执行 vendor skill/installer。A16 在途独立输出不借用、不重冻、不覆盖；Main 保持唯一 builder/GUI。

## 2. 有效 Oracle

- 依据 AGENTS §6A、collaboration §9/§11、remaining-journey RA-N01/RA-IM01 与 main-o3-o5-samepage-assertions 的 O3。失败不能显示成功语义；失败不关闭输入/预览，busy 结束后允许明确重试；既有成功信封的合法标题包含“失败/Failed/Error”仍成功。
- A15 原 GUI 是旧 A13 页面：原 CSV failed 图上全局成功 Check + 英文错误全文；XLSX failed 图局部重试提示可见、全局卡在视口外。仅读原件，不倒签当前源码的新 GUI。
- `PmPanel.run` 接收 `execute: Promise<string>`；catch 已确定异常，返回 false，但只把 Error.message/String(error) 交给生产 ResultCard。`classifyFeedback` 只在非结构化文本兜底中文关键词，结构化成功不扫描正文。本合同不新增英文关键词表、不把裸成功正文中的合法英文 Failed/Error 判失败。
- `executeRaw` 是既有副驾 kind/text 通道，`run` 不走它；不借本缺陷改变宿主协议、所有 commandAccepted 调用或副驾成功/撤销语义。
- `refresh catch` 是 O5/B1-C2 的读取失败保旧数据/stale/retry 接缝。本轮记录其现状、做既有回归，不新增“写成功但刷新失败必定失败”的 Oracle，不扩大修复到刷新。

## 3. 先行用例

| ID | 对象/步骤 | 必须观察/预期 |
| --- | --- | --- |
| TF-C01 | 真实 PmPanel 的 TaskTable.run，成功信封标题分别含失败/Failed/Error，带已有 action 使真实 ResultCard 常驻 | 返回 true；分类非 error；卡 status/polite/Check、无 error class；摘要/完整 detail/复制原文不丢 |
| TF-C02 | 真实 PmPanel，合法无信封英文 Failed/Error 标题 | 返回 true；卡不误红；原文完整 |
| TF-C03 | 生产 prefixFeedbackOnce + classifyFeedback + ResultCard，显式执行失败场景控制 | 五类异常加场景前缀后 alert/assertive/AlertTriangle、持久且复制全文；这是既有能力控制，不是修改 PmPanel 修复 |
| TF-F01 | 真实 PmPanel TaskTable.run：pending 后 reject Error('Failed to fetch')、A15 原完整英文、AbortError、unknown 字符串、unknown 对象 | catch 返回 false、busy 解锁、无刷新/重复 execute；原原因保留；生产卡必须 error/alert/assertive/AlertTriangle，不得 Check/status。原必要红不得改 expect 补绿 |
| TF-C04 | 真实 PmPanel + TaskTable，原 CSV/XLSX FileReader 宿主边界，preview→同帧双点确认→reject→同预览 retry | in-flight 一请求/三控件禁用；失败保同一预览及局部 alert；解锁；明确 retry 仅同一确认行、成功后收起。只证明组件链，不声称真实网络/后端落盘/原生 chooser GUI |
| TF-R01 | 当前冻结源的既有 ui-feedback、result-card、result-card-copy、panel-checklist-toggle、panel-launch-handshake、launch-handshake 测试 | 独立原样复跑，不改测试原件；原 exit/stdout/stderr/reporter 留存 |

所有产品 import 指向完整自有当前冻结。只 mock 宿主 execute 返回/异常、FileReader 和最小 browser globals，不 mock PmPanel/TaskTable/ResultCard/classifier 或复制错误政策；禁 fetch。成功标题直接复用生产 buildSuccessEnvelope，无非法 fixture 绕过守卫。

## 4. 最小修复建议与停止条件

**推荐最小产品域：`packages/dsh-pm-tool/src/client/panel.tsx` 的 `run catch`，加必要同域测试。** 已导入 `prefixFeedbackOnce`，中文“执行失败”场景可复用当前 helper，并保 Error.message/String(error) 全文。若开发选择该方案，当前生产 classifier/ResultCard 已能尊重中文失败原因，通常不需改 `ui-feedback.ts`、`result-card.tsx`、CSS 或 API。这只是文件级建议，不预定 implementation。

如选择结构化原因，须同时证明现有 classifyFeedback 与生产 ResultCard 同源尊重原因、成功信封不被误红、原文/复制不丢；必要 helper/test 可限定同域，但需另说明额外文件的必要性。不能只改调用方 return false、把错误文本清洗/截断或新增英文正文 regex。

本专家不改产品、不做修后自验。结果只签控制 PASS / 当前产品必要红 FAIL；交回开发后由新独立复验绑定修后候选，Main 再按既有 GUI 合同补受影响实际页。原 A15 有限恢复性 PASS、P2 FAIL、同帧 GUI/真实事务/全矩阵缺口保留，不用本 AUTO 替 GUI。

## 5. 执行与保护

macOS + nvm Node 22.23.3；既有 pnpm 11.28.5 依赖，实际不运行 pnpm/install。自有 `*-selftmp/r1` 完整复制 `src/scripts/package.json/pnpm-lock.yaml/tsconfig.json/vitest.config.ts`，保存基线 HEAD/origin、tracked binary diff、新文件指纹、全输入 hash/bytes/mtime。借用已有 A14 依赖只读软链，源与产物不借 A16 冻结。

Vitest `--no-cache`、单 fork、1 worker；env 白名单、独立 HOME/TMPDIR/cache/DSH_HOME、禁止继承凭据。每次保存 argv/cwd/env/start/end/PID/exit/signal、stdout/stderr、JSON reporter、测试观测。保护当前产品输入/lib、A11..A14 lib、A15 整原包/报告、既有实际依赖/共享 cache；A16 仅保护静态计划/执行器和已存在冻结产品输入，不把其持续新增日志误报成本角色污染。

先落本计划，再冻结，再先控制、必要红、恢复控制、既有回归；不因红调整 Oracle。冻结/终检比较全输入，记录与主树差异；保护失败单列设施问题。完成报告和精确子 PID 查询后释放，本角色没有服务/GUI/builder占用。
