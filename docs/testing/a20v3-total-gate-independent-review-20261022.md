# A20V3 后继候选总门独立审证

> 2026-10-22，角色：A20V3 总门独立测试专家。本文只读核验冻结候选、原始证据与前序独立报告；未修改产品源码、测试 Oracle、reports 证据、旧报告或服务，未启动或停止任何进程。本报告只裁决 A20 总门及 U4 准入，不授权提交、推送、tag、发布或正式服务切换。

## 1. 总结论

| 裁决对象 | 状态 | 独立结论 |
| --- | --- | --- |
| A20V3 候选绑定 | **PASS** | 父链、完整 patch、新文件清单、95 个源码指纹、453 个产物指纹及证据哈希闭合 |
| 两项 verify 修正 | **PASS** | 相对 A20V2 只修改 `verify-web.mjs` 与 `verify-client-bundle.mjs`，修正范围与前序报告第 6 节一致，未改产品行为 |
| 完整构建与 AUTO 回归 | **PASS** | 成功构建、`noEmit=0`、153 files / 1579 tests 全绿，JSON reporter 同样全绿 |
| 默认 isolation guard | **PASS** | 95/95；两项修正后的 verify 均在完整 guard 内 GREEN；保护资产 before=5、after=5、污染 0；guard selftest PASS |
| Launcher 继承 | **PASS（继承）** | A20 与 A20V3 的 26 个 Launcher 文件逐字节一致，可继承 A20 的 56/56 与 `verify-launcher` PASS |
| A20V2 GUI / RA-P0007 | **PASS_LIMITED（继承）** | A20V3 未改产品源码、产物或运行接缝；A20V2 GUI PASS 与前序 RA-P0007 限定结论可按未受影响范围继承，无 GUI 新证据 |
| A20 总门 | **PASS** | 前序总门报告第 6 节的全部解除条件均已满足 |
| U4 | **允许进入** | 仅允许以本文绑定的 A20V3 身份进入 U4；不等于发布或正式服务切换授权 |

**最终裁决：A20 总门 PASS，解除前序 BLOCKED；允许进入 U4。**

## 2. 候选链与身份

- 基线提交：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，本地 `HEAD` 与 `origin/main` 一致。
- A20V3 manifest：`reports/all-pending-evidence-20261021/A20V3/candidate.json`
- A20V3 manifest SHA256：`6409de168a76a72d8ad691cf96a44ac7d0b4f9f2dae0f43886326ef63f23bec2`
- 父 A20V2 manifest SHA256：`c0e678055ee2dee6be40f99ebe52f88843a7de9933a26c87007d1678f834946b`
- 冻结树：`/private/tmp/pmtool-a20v3-closure-20261022-r1`
- `product-tracked.patch`：5377 行、60 个 tracked 文件，SHA256 `de3b27...afc03`
- `product-new-files.txt`：35 项，SHA256 `ae102e...268d`
- 上述 60 + 35 项与 `source-files.sha256` 的 95 个路径集合完全相同；95 项在冻结树逐项校验全部 `OK`。
- `artifact-files.sha256` 共 453 项，冻结树逐项校验全部 `OK`。
- `evidence-files.sha256` 登记的 42 份候选、身份、回归与漂移证据逐项校验全部 `OK`。

产品身份相对 A20V2 保持：

| 文件 | SHA256 |
| --- | --- |
| `src/client/index.tsx` | `61f927ed6773b22c2894368a7865ef8ecc719a8e684d3b9c1599517f392d339a` |
| `src/client/index-command-feedback.test.tsx` | `9c43bf4655e302eb235fd3b736e2b9397c35ec6f1df9ddbf7c8682faa10257af` |
| `package.json` | `8098dfa788025596ee1e4664969e4ffd4a69dee664950931313ac0d648cd55a9` |
| `lib/client.js` | `a5e3586bfbd641c59bdb4978c29d8489c94f0eb0711a9c6e2ba2992aa235ea39` |
| `lib/core/reflect.js` | `6b53e4534de33f327978fcebe7886a1571febecf6945f2fac4910b53852703c5` |

对 A20V2 与 A20V3 冻结树的 `src/`、`scripts/`、package/lock/config 和 Launcher 逐目录比较，唯一差异是下节两份验证设施；`parentUnexpectedSourceDiff=[]` 成立。

## 3. 两项 verify 修正合理性

### 3.1 `verify-web.mjs`

只在 manifest inject 精确预期中加入产品已声明的 `@deepseek-ai/dsh-client-ui-conversation`。这是对 A20V2 package composition 的验证 Oracle 同步，没有放宽断言或新增产品能力。

### 3.2 `verify-client-bundle.mjs`

只给最小宿主 mock 补入现有 `apply()` 所需的公开接缝：

- `ctx.on('command/executed', ...)`
- `sessions.scope(sessionId)`
- `ctx.get('conversation').input.for(scope).notify(...)`
- 与当前 remote/session 最小形状一致的能力

同时新增断言：bundle 注册监听后，`pm` 成功正文只向事件所属 session 产生一次 `info` 通知。原有 bundle factory 激活、main/sidebar slot 注册、外部依赖限制、相对块泄漏和 board registry 断言均保留。

两文件 SHA256 分别为 `c230b4...50c75`、`ec7f95...bfb1a`。父增量清单和 patch 只含这两项，符合前序总门报告第 6 节的最小修正范围，未修改反思业务、存储、schema、命令、客户端产品源码或 GUI。

## 4. 完整回归逐项审查

环境：macOS，Node `v22.23.3`；成功构建直接调用缓存的 pnpm `11.28.5` 入口。

| 步骤 | 结果 | 关键证据 |
| --- | --- | --- |
| `pnpm run build` 首次尝试 | **ENVIRONMENT_FAIL_RETAINED** | exit 1；私有 `HOME` 触发 Corepack 下载 pnpm 12.14.0，30 秒超时；日志没有进入 `tsc` 或 tsdown |
| 缓存 pnpm 11.28.5 构建 | **PASS** | exit 0；依赖策略检查完成，`tsc` 与 tsdown 完成，6 个 bundle 文件生成 |
| `tsc -p tsconfig.json --noEmit` | **PASS** | exit 0；stdout/stderr 均空 |
| Vitest coverage | **PASS** | 153/153 files、1579/1579 tests，失败 0 |
| Vitest JSON reporter | **PASS** | 543 suites、1579 tests 全绿，失败/待定均为 0 |
| Coverage | **PASS** | statements 89.4%、branches 82.41%、functions 85.89%、lines 89.4% |
| 默认 `verify-isolation.mjs` | **PASS** | 95/95；失败 0；保护资产 before=5、after=5、污染 0 |
| `test-isolation-guard.mjs` | **PASS** | 新增、修改、删除、缺失 root 与整体删除检测均通过 |
| `verify-web.mjs` | **PASS** | 独立点跑 GREEN，且在默认 95 项 guard 内 GREEN |
| `verify-client-bundle.mjs` | **PASS** | 独立点跑 GREEN，且在默认 95 项 guard 内 GREEN；新反馈断言实际执行 |

原始 exit、stdout/stderr、JSON reporter 与 coverage summary 均由 `evidence-files.sha256` 锁定。前序报告要求的完整构建、类型检查、全量 coverage、默认全部 verify 和 guard selftest 已全部补齐。

## 5. Launcher、GUI 与 RA-P0007 继承

### Launcher

`launcher-files.sha256` 含 26 项，manifest SHA256 为 `e16afb64c6408d349519bc1d6ed3235ffd49d13911e386c761d063b364eb2d87`。以同一清单分别核验 A20 与 A20V3 冻结树，26 项均 `OK`，两棵树重算的清单内容 SHA 也均为上述值。

因此 Launcher 未进入受影响范围，可合法继承 A20 已独立审证的 9 文件、56/56 Node tests 与 `verify-launcher` PASS。继承仍受原报告边界约束，不扩称覆盖当时未执行的五个历史 probes。

### GUI 与 RA-P0007

A20V2 已对同一产品身份取得 SOURCE S01-S07、AUTO A01-A10、GUI G01-G06 PASS；G07 因宿主无合法卸载 UI 为 NOT_APPLICABLE，生命周期由 AUTO A06 覆盖。前序总门报告已据此把 RA-P0007 判为 `PASS_LIMITED`。

A20V3 只修改两个非产品 verify，`index.tsx`、同域测试、package、`lib/client.js`、`lib/core/reflect.js` 均与 A20V2 逐字节相同。因此 A20V2 GUI 与 RA-P0007 不在受影响范围，可按原限定继承。本轮没有采集或伪造任何 GUI 新证据，也不扩大原 GUI 覆盖面。

## 6. 依赖、漂移与资产保护

- A20V2/A20V3 的 `package.json` 与 `pnpm-lock.yaml` 分别逐字节相同；lockfile SHA256 为 `646a1a...63caa`。
- `node_modules/.modules.yaml` SHA 不同，内容差异来自 pnpm 在 A20V3 隔离树 relink 后写入候选本地绝对路径。
- 父/候选完整依赖图原始 JSON 仅路径字段不同；移除路径字段后内容一致。候选登记的规范化图 SHA256 同为 `8b8e1c...33aa`，独立内容比较支持 `dependencyGraphDrift=[]`，不存在 package/lock 或解析版本漂移。
- `source-drift.txt` 为 0 字节，SHA256 为标准空文件值；95 项源码冻结指纹复算全绿，支持 `sourceDrift=[]`。
- guard 对五个受保护根执行前后均为 5 个登记项，hash+mtime 污染为 0，支持 `protectedDrift=[]`。
- 当前只读 `lsof` 核验：3248/PID 63429、3249/PID 86987、3255/PID 44229 均仍处于 LISTEN；与 manifest 一致，本轮未停止任何服务。

## 7. 警告与首次环境失败

首次 build 失败不得掩盖：原始 stderr 明确为 Corepack 在私有 `HOME` 下载 pnpm 12.14.0 超时，编译没有开始。后续使用 Node 22.23.3 下已缓存的 pnpm 11.28.5 成功完成构建；这属于保留原证后的环境恢复，不是把失败改写成成功。

Coverage stderr 仍含既有 React list key、`requestAnimationFrame is not defined` 清理、detached tree 与 `MaxListenersExceededWarning`；guard stderr 仍含负向用例故意触发的错误日志。它们均完整保留：

- 153/1579、JSON reporter 与总退出码仍全绿；
- 警告不来自本批两项 verify 修正，未改变 A20V2 已审 GUI 行为；
- guard 的对应负向路径均以脚本 exit 0 收束，95/95 且污染 0。

因此这些既有 warning 不构成本次 A20 总门阻塞项，但本报告不宣称“零告警”，也不豁免或关闭其后续治理。

## 8. 总门裁决、U4 许可与失效规则

前序报告第 6 节要求：

1. 仅修正两个受影响 verify；
2. 冻结绑定父候选、完整 patch、新文件、源码/产物指纹与漂移；
3. 执行成功构建、`noEmit`、全量 coverage、默认全部 verify 与 guard selftest；
4. Launcher 逐字节不变才允许继承；
5. 由未修改产品的独立专家审证签字。

A20V3 已逐项满足。故前序 A20 总门 `BLOCKED` 在本候选上解除，现判 **PASS**，允许进入 U4。

许可边界与失效规则：

- U4 必须继承本文绑定的 A20V3 manifest、冻结身份及产品/产物指纹；本结论不授权提交、推送、tag、发布或服务切换。
- 两份 verify、产品源码、测试 Oracle、package/lock、构建产物、profile 目标或运行实例发生变化时，按变更影响范围使本结论失效，并须重新回归、审证。
- `lib/core/reflect.js`、命令后端、存储或 schema 变化时，RA-P0007 继承立即失效。
- 客户端事件路由、conversation inject、session 定位、通知级别或面板执行链变化时，A20V2 SOURCE/AUTO/GUI 继承立即失效，须重做受影响 GUI 旅程。
- 任一 Launcher 文件变化时，56/56 与 `verify-launcher` 的继承失效。
- 依赖图、lockfile 或 `.modules.yaml` 出现非隔离路径元数据变化时，`dependencyGraphDrift=[]` 失效，须重新解析依赖图。
- 纯文档变化不自动使行为证据失效，但后续总门应记录继承理由；不得把本次 A20 PASS 外推为 U4 PASS 或发布 PASS。

## 9. 证据引用

- [前序 A20 总门报告](a20-total-gate-independent-review-20261022.md)
- [A20V2 SOURCE/AUTO 独立复验](a20v2-source-auto-independent-retest-20261022.md)
- [A20V2 GUI 独立复核](a20v2-gui-independent-review-20261022.md)
- [A20 完整回归独立审证](a20-full-regression-independent-review-20261022.md)
- `reports/all-pending-evidence-20261021/A20V3/candidate.json`
- `reports/all-pending-evidence-20261021/A20V3/evidence-files.sha256`
- `reports/all-pending-evidence-20261021/A20V3/source-files.sha256`
- `reports/all-pending-evidence-20261021/A20V3/artifact-files.sha256`
- `reports/all-pending-evidence-20261021/A20V3/launcher-files.sha256`
- `reports/all-pending-evidence-20261021/A20V3/parent-increment.patch`
- `reports/all-pending-evidence-20261021/A20V3/full-regression/`
