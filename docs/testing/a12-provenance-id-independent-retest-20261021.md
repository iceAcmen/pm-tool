# A12 来源行 ID 独立有限复验

> 给 Main 和后续独立专家接续。trae，独立测试角色；本地 2026-10-22 04:10 至 04:13 执行，文件名前缀沿父批次 20261021。只签 AGUI01（原报告 AGUI-01）的 SOURCE/AUTO 修复子范围，不签实际 GUI、RA-AI01 整 ID 或治理整门。

## 1. 结论

| 对象 | 独立结论 | 边界 |
| --- | --- | --- |
| 指定组件的一行来源 ID 修复 SOURCE | **有限 PASS** | 有 label 时原标题之外添加 ref.id；空/缺失 label 不在 meta 重复 ID；原表/角色/版本、callback ref.id、失效无跳转、历史代码不改 |
| 同真实组件测试及相关 AUTO | **有限 PASS** | 独立旧组件 11 红/5 绿，新组件 16/16，相关四文件 52/52，追加有限守卫最终 5/5；产品与测试 noEmit exit0 |
| A12 实际 GUI / AGUI-01 视觉关闭 | **NOT_RUN，未签** | 本任务禁止 GUI/build/服务；没有 A12 下发、实例、可见性或实际跳转旅程新证据 |
| RA-AI01 整 ID / RA-AI01..03 整门 | **未签，不能放行** | A11 对 A10 的 RA-AI01 FAIL 与 RA-AI02/03 BLOCKED 不覆盖；装载绑定、逐跳返回/重进、持久化等旧缺口仍依原合同另补 |

原独立角色 `arun_6ad8ed067...` 已 killed 属于负责人提供的接续事实。本轮开始时指定独立前缀无产物，也没有发现该角色前缀的 testing 文件；不存在可继承的该角色 PASS。本报告结论来自本角色新执行及原件核验，不将开发自验或已终止角色当独立证据。

## 2. 授权与合同

负责人原句：

> 用户/goal continue恢复。原独立角色arun_6ad8ed067...已killed，docs/testing无该前缀产物，勿假PASS。接续独立SOURCE/AUTO复验AGUI01仅docs/testing/a12-provenance-id-independent-retest-20261021前缀。先读AGENTS/collab、docs/testing/a11-governance-source-gui-review-20261021.md合同、docs/plans/2026-10-21-provenance-source-id-closure.md、reports/a12-provenance-id-developer-20261021.md/原件。组件hash039b7d47a9fc39df0913d38d102eb54e526023c3c49eb260278f59c3de4c973b一行补ID无label不重复。自有冻结副本原真实组件+相关52/noemit+追加有限守卫验证，不改产品/sharedcache/build/install/GUI/服务/credentials/commit。依赖只读复用隔离node_modules。原旧11红新16绿待你独立复验。Main当前A11lib不变在GUI。完成释放，不能签A12实际GUI/RAAI01整門。

- 已读 `AGENTS.md`、`docs/collaboration.md` §9/11、A11 审证 §4、指定收口计划、开发报告和原脚本/源码/日志；另核 `remaining-governance-cases-20261021.md` RA-AI01..03 与当前接续档案。
- 本批只新增/维护本 testing 前缀，未改产品、其他 testing、living docs 或旧报告；未 fetch/pull、安装、build、GUI、服务、真实模型、凭据、commit/push/tag。
- dirty 主树在途成果保留；通用安装/构建和整包验证不在本角色授权内。不能将本次相关 AUTO 当全部 verify、Main 整候选或发布回归。

## 3. 候选与独立冻结

基线 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，只是基线，不代表 dirty 全候选。源码身份：

| 输入 | SHA256 |
| --- | --- |
| 修前真实组件 | `ff319e4e7d9fc47cf3c8b34b56f4b260901c0039841a054837b7b2cf93779ca6` |
| 修后真实组件，11559 bytes | `039b7d47a9fc39df0913d38d102eb54e526023c3c49eb260278f59c3de4c973b` |
| 新旧共用产品组件测试，8787 bytes | `5c484781fe1609360e34359ccecb667f98101de458ddc267141671f488ac8584` |
| 最终独立守卫，7012 bytes | `9b9419f237ed8bf9634013c2483b07a34115b465b33dcc4afe988ece0de8695a` |

- 独立根 `/private/tmp/pmtool-a12-provenance-id-independent-retest-20261021-QSDZAQ`；red/green/green-r2 各有自有 `packages/dsh-pm-tool`。不是在开发目录或 Main 主树执行。
- 先按开发原 `red-inputs.json` / `green-inputs.json` 实核各 382 源码与 package/lock/tsconfig，再复制到自有目录；原件未改。原红绿源码仅 `client/provenance-panel.tsx` changed1、added0/missing0；严格删除新增一行后绿组件全文等于红组件。
- 新增行是 `{ref.label ? \`${ref.id} · \` : ''}`，位于既有 `pm-prov-ref-meta`；无新字段/CSS/接口/依赖。不是另一个页面 ID 或 raw JSON 替代来源行文本。
- 冻结时主树组件/组件测试及四个相关测试与被测副本相符。没有声称主树全部源码等于开发冻结或 Main 最新整包。
- 依赖只读软链 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`；React/renderer 18.3.1、Vitest 2.1.9、TypeScript 5.9.3，macOS darwin arm64、Node v22.23.3。项目 pnpm 11.28.5，本批未执行 pnpm。
- 无 cache：`cache:false`、`--no-cache`、ssr/web optimizer disabled；白名单子进程环境不继承模型凭据，HOME/TMPDIR/DSH_HOME/files/backups/PM_GOVERNANCE_TMP 全在自有根。相关命令/JSON 领域 fixture 写在自有 tmp，不写正式 data。

身份、原件日志 SHA 和冻结清单见 [freeze](a12-provenance-id-independent-retest-20261021-evidence/freeze.json)、[原件审计](a12-provenance-id-independent-retest-20261021-evidence/author-original-audit.json)、[单文件差异](a12-provenance-id-independent-retest-20261021-evidence/source-diff.json)。开发全部六份 exit 对应 stdout/stderr SHA 均相符；开发首次测试 noEmit exit2 的四个 TS7016 原件保留，补正 r2 include 既有声明后 exit0，未倒改成首次全绿。

## 4. 独立执行结果

所有原始 cwd、参数、开始/结束时间、隔离环境、退出码、输出 SHA 在本前缀 evidence 的 `*.exit.json` 及 `*.stdout.log` / `*.stderr.log`。

| 命令子项 | 退出码 / 结果 | 覆盖或解释 |
| --- | --- | --- |
| red-component | 1；11 failed / 5 passed | 11 个失败全为来源 ID 缺失断言，非导入/依赖失败；六映射表、同名、三失效、unknown 分支 |
| green-component | 0；16/16 | 同真实组件 mount，原共用测试未改，ID/表/角色/版本/callback/无标题/旧历史等 |
| green-related | 0；52/52 | provenance 15、provenance-view 10、provenance-store 14、ask-governance 13 |
| green-product-noemit | 0；无输出 | 原 tsconfig，`--noEmit --incremental false`，不产生 lib |
| green-tests-noemit | 0；无输出 | 产品组件测试与首轮独立守卫，include 既有 `src/**/*.d.ts` |
| green-guards 首轮 | 1；4/5 | 测试设施误比较重建的函数对象，非产品 FAIL；原件保留 |
| green-guards-r2 | 0；5/5 | 仅修改独立守卫的可序列化渲染比较，产品字节不变 |
| green-tests-noemit-r2 | 0；无输出 | 最终两类组件测试及既有声明均 typecheck |

首轮守卫刷新比较 `renderer.toJSON()` 含重建的 onClick 函数；失败日志明确 `Compared values have no visual difference`。r2 用 `JSON.stringify(renderer.toJSON())` 排除非渲染函数身份，保留文本/结构比较、原 JSON/refs/history、旧原因/版本和执行命令次数断言，没有删减刷新要求。仅独立守卫文件 changed1；旧 green 不覆写，另建 green-r2。原 r1 测试副本及独立 evidence `guards-r1.test.tsx` 保留，首轮汇总仍记 guards=false；有效补正见 [r2](a12-provenance-id-independent-retest-20261021-evidence/guards-r2-summary.json)，不改原日志。

追加五项守卫：同名十来源跨依据/上下文各显稳定 ID 并正确 callback；空/缺失 label 的 changed/missing/cross-project 不重复 ID、不跳转；HTML 样式标题仍纯文本、无 img/innerHTML；失效条目刷新后保完整旧 refs/history/版本/JSON，不自动 ask-recheck。十来源是独立组件合成 fixture，不冒称重新生产 dispatch 的 F6、真实 DOM/浏览器或十次实际导航。

完整执行入口（macOS，仓库根；已执行，各阶段一次，禁止重跑覆写本轮证据）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a12-provenance-id-independent-retest-20261021-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a12-provenance-id-independent-retest-20261021-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a12-provenance-id-independent-retest-20261021-run.mjs retest
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a12-provenance-id-independent-retest-20261021-run.mjs guards-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a12-provenance-id-independent-retest-20261021-run.mjs finish
git diff --check -- 'docs/testing/a12-provenance-id-independent-retest-20261021*'
```

`retest` 总入口 exit1 正确保留首轮守卫失败；其他入口 exit0。底层测试命令为已有 `vitest/vitest.mjs run --config vitest.config.mts --no-cache <指定测试路径>`；类型命令为已有 `typescript/bin/tsc -p tsconfig.json` / `-p test-tsconfig.json --noEmit --incremental false`，完整展开参数见 exit 原件。`git diff --check` 对 untracked 正文不构成检查，新增正文另只读回看。

## 5. 终核与释放

冻结完成 `2026-10-21T20:10:44.174Z`，终核 `20:13:21.169Z`：

- 只读依赖 14611 项、主树 lib 463 项、Main 隔离 lib 453 项，前后 changed/added/missing 全0。
- 开发证据29项、原红/绿源码各382项、主树登记组件及相关测试6项、合同8项，全0漂移；自有红/绿/r2 全目录同各自清单相符，无新增 cache/lib/类型产物。
- 此为登记根内核验，不宣称全机或全部 living docs 零污染。不读取正式 profile、入口、凭据，不执行/停止任何 GUI 或宿主服务。Main 在用 lib 原字节不变。
- [终核原件](a12-provenance-id-independent-retest-20261021-evidence/finish.json)。测试子进程精确 PID 已逐次输出；执行结束后核登记 PID 均不存在，无存活本前缀 runner。未用 pkill/killall 或操作其他进程。

**本独立任务和本前缀写入权已释放**，副本与证据保留。Main 按指定组件 SHA 接件，作为唯一 builder 另冻/建 A12，按原 RA-AI01..03 补实际装载绑定、十来源逐跳返回/重进、changed/missing 和重校原件，再交独立专家审签。此报告不启动新功能、不批准 commit/发布，也不为任何旧 GUI 缺件倒填证据。
