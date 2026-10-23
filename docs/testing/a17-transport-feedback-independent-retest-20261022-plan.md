# A17 明确 catch 独立 SOURCE/AUTO 复验计划

> 2026-10-22，trae 独立测试专家，非开发。给 Main 与接续专家使用；仅审签本次完整冻结源码及自动化，不签新故障 GUI、整门或提交。

## 授权

负责人原句：

> 独立A17明确catch错误反馈修后SOURCE/AUTO复验，非开发；只docs/testing/a17-transport-feedback-independent-retest-20261022*。禁product/其他testing/livingdocs/build/install/GUI/services/credentials/commit/sharedlib/cache。读AGENTS/collab/先行a17-transport-feedback-contract报告/plan/cases/run及r2五红、docs/plans/2026-10-22-transport-error-feedback-closure.md、reports/a17-transport-feedback-developer-20261022.md与selftmp完整交回。开发仅panel run catch一行prefixFeedbackOnce及newpanel-transport-error-feedback.test.tsx14项释放；A16panelfe58其他全文尤其baseline保，A16tree/lib/3247原实例Main正在四扩展GUI绝不动。独立完整current主源freeze/no-cache单fork白名单自有HOME/TMP/cache，同原TF-F五expect不改：旧五红→新五绿，TF-C成功含失败/Failed/Error保success/错误control/CSVXLSXbusyfailure同previewretry2/原65+new14及PC/扩展/额外53/noEmit适当独立跑。新增必要反例quietcatch/unknown/Error原因全文/复制代际/状态语义，用真实PmPanel/ResultCard不自建模型；原成功正文不广扫关键词、不修refresh/backend/API。保护主oldlibs/A11/12/13/14/A16lib+冻结/source/原全部开发专家/依赖cachehashmtime，Main新extensions原证非写域可增加不误盖。完整argv原exit/reporter/hash/所有失败保，有限SOURCE/AUTO PASS/FAIL/BLOCKED独立报告后释放，不签故障GUI/整门/commit，Main据此新A17输出再补原实际fail/retry。

明确范围优先于通用工作流：不 fetch/pull 在途脏树，不 install/build/全 verify，不写 livingdocs，不 commit；不加载 vendor/installer。记忆文件入口不存在，以本仓库合同为准。

## 步骤与停止条件

1. 只读审证原 A17 r1/r2 及开发 before-r1/after-r1/after-r2、check、close-check、final 原件。核命令/退出/reporter/日志哈希、原五红失败原因、设施失败保留和开发释放。
2. 自有完整复制当前 `src/scripts/package.json/pnpm-lock.yaml/tsconfig.json/vitest.config.ts`，认领 HEAD/origin、tracked binary diff、新输入清单与完整 hash/bytes/mtime；不借 A16 freeze 执行测试。与开发修后完整输入逐文件核一致，旧 panel fe58 全文只替换明确 catch 一行。
3. 原专家 TF 测试原样复制，保五个 expect 和 A15 CSV/XLSX replay；先成功控制 5、显式错误控制 5、原五 catch 5、恢复控制 2、原回归 65、开发同域 14。修前五红用原历史证据审证，不人为回改产品或冻结生成旧红。
4. 新独立反例使用真实 PmPanel/TaskTable/ResultCard：quiet pending/拒绝/重试；unknown null/undefined/number/custom String；长多行 Error 全文与复制；晚到旧复制成功/失败不污染新错误；当前复制失败不假成功；成功关键字信封保 status/全文/详情/动作；3 秒成功与错误持久语义。
5. 独立跑修订 PC 4、真实父层扩展 28、原四必要父层 4、A15 23、同域扩展 23、受影响 87、导入/面板额外 53，复制原合法 board fixture。完整原 tsconfig `tsc --noEmit --incremental false`，不 emit。
6. 前后核主源与自有冻结、原专家/开发全文和证据、主 lib/A11..A16 lib/冻结、实际依赖和声明共享 cache hash/bytes/mtime。Main 可持续增加 GUI 日志与 extensions 原证，不作为零写根，不改或覆盖。每条原 argv/cwd/env/PID/exit/signal/stdout/stderr/reporter/观测保留，任何失败单列，不用外层 0 替代子退出。
7. 写有限 SOURCE/AUTO 结论，终检精确自有子 PID 已退出、保护和冻结无漂移后释放。任何漂移/依赖缺口先保原失败，不改产品或降低 expect；GUI 与整门保持 BLOCKED/未审签，交 Main 另建新 A17 输出和原实际 fail/retry 采证。

## 执行文件与环境

新增仅本前缀 `-plan.md`、`-run.mjs`、`-cases.test.tsx`、`-selftmp/`、最终 `.md`。macOS + nvm Node 22.23.3；只读使用既有 pnpm 11.28.5 依赖，不运行 pnpm。

仓库根执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a17-transport-feedback-independent-retest-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-independent-retest-20261022-run.mjs freeze r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-independent-retest-20261022-run.mjs run r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a17-transport-feedback-independent-retest-20261022-run.mjs final r1
```

单 fork/1 worker/node/no-cache；HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME 与 cacheDir 全在自有前缀，env 白名单，禁网络/凭据继承。freeze/run/final 拒绝覆盖已有轮次；原失败必须另轮保留。

进度：计划已落盘；审证、冻结、执行、终检结果见最终独立报告及原始 selftmp，不提前标 PASS。
