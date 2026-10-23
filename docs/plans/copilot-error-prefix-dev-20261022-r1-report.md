# 副驾前缀开发自测与移交 R1

> 本文件记录不同开发对 S112-PREFIX-01 的窄改、自测、输入认领与 STOP，供 Main 及不同独立专家复验；不是独立 PASS，也不是父任务结项。

## 本轮结果

已实施获批的唯一两行业务变更，新增两个测试输入。原独立 R2 五例逐字迁移，仅相对 fixture 读取及 observations 可选不同；五例全文 oracle、真实 CopilotPanel/MarkdownView、成功恢复、解锁/占位清除、零 apply/capture 命令与 onSaved 断言不变。开发自测 **5/5 + 250/250，noEmit exit0，无失败/跳过**。构建、运行激活、GUI、独立审签、提交均 **NOT_RUN/NOT_SIGNED**。

授权与角色按[本子单计划](copilot-error-prefix-dev-20261022-r1-plan.md)、[父窄修计划](2026-10-22-copilot-error-prefix-closure.md)、[独立先行计划](../testing/successor112-auth-gui-prefix-20261022-r1-plan.md)及[原独立报告](../testing/successor112-auth-gui-prefix-20261022-r1-report.md)。原同五例 2 绿 3 必要红及首轮 oracle 设施失败原件保留，不原地重跑覆盖。

**负责人原句/边界**：“你不同开发非独立验收”“唯一业务写面…仅导入prefixFeedbackOnce并sendcatch调用”“不build/install/service/GUI/Git/key/其他testing/livingdocs/旧src tests/sharedlib/vendor/data”“开发自验不自PASS，交exactpatch/SHA/source/full inputs/测试与STOP给Main另独立复验，不commit、不把父goal结束”。父“持续多角色验全部修确证缺陷后ordinarycommit已授权”仍为 Main 后续全部闭环的授权，不移交本子单。

## 精确改动

业务仅 `src/client/shared/drawers/sidecar-portal.tsx:21,386`：

```tsx
import { parseActiveModelLane, prefixFeedbackOnce } from '../../../core/ui-feedback.js'
setMsgs(m => [...m, { role: 'ai', text: prefixFeedbackOnce('副驾暂不可用', e) }])
```

没有修改命令层、index 原文 throw 边界、AUTH/rate 分类、共享 helper、取消、成功、车道、计划或写流程；没有 product hook/classifier replacement/global replace/trim。完整文件自动比对等于旧 112 仅这两处替换的结果。

新增 `src/client/copilot-error-prefix.test.tsx` 对独立 `-r2-component.fixture.tsx` 自动逐字校验仅两处设施变化；`src/client/copilot-error-prefix-fixture.json` 与独立 `-transcript.json` **403 字节精确相同**，AUTH/RATE/normal 原文未改。

## 候选与指纹

以下包路径相对 `packages/dsh-pm-tool/`，证据相对 `reports/all-pending-evidence-20261021/CopilotPrefixDevR1/`。

| 对象 | bytes | SHA256 |
| --- | ---: | --- |
| `src/client/shared/drawers/sidecar-portal.tsx` 修后 | 45837 | `e2e9054e9ad0d7a7e9f3c0020760a2c48a8c477ae44af6b01c2a509e8e4204dc` |
| 同文件旧 112 | 45842 | `7cf48821e7e6ee570288c385b59897fd33f8ab0ec32da42ef87111c2c016a269` |
| `src/client/copilot-error-prefix.test.tsx` | 4319 | `40aab2a19f34bb82a97cd1e7510ccbc187c8a9218bd03c47e0ab0b133f118e90` |
| `src/client/copilot-error-prefix-fixture.json` | 403 | `54386e800c3262e5bcfd67ef325ab32a3ec11f7ad8fc59c0f3a075d03169fb97` |
| `round-exact.patch` | 6241 | `30910cf5898dea570ef5b1db64d6a98c963d2b2e2dcd4b894c5f358df08cb987` |
| `source-files.json` | 14600 | `0500f00c43f037f4a2b2ea7146b51ef62e3de5a81fcad022e516b1f0d3c5ba8b` |
| `complete-inputs.json` | 74963 | `916040b65c910488a7552b6caf5b7c39e354a592e59510658135c66588722eec` |

父基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，version `0.7.4` 仅身份字段，不充当完整 dirty 候选。主包旧 **519** 全集先核与父声明一致；本轮只替换已认领 sidecar 指纹、新增 test/fixture，完整包实数 **521**。原 **112** 声明（含 15 launcher）逐项核对，只替换 sidecar hash、新增 2 项，去重实核 **114**，不是猜 113 或用 HEAD 代替新源。

新独占冻结 `/private/tmp/pmtool-copilot-prefix-dev-20261022-r1/packages/dsh-pm-tool`；完整 521 输入与主树逐字节一致。`parent-tracked-product.diff` 和 `parent-new-product-files.txt` 精确保留原 112 已认领差异，`round-exact.patch` 补足本轮 3 文件全部差异，合起来供 Main 认领父基线后的候选；本角色没有调用 Git。没有生成新 lib/产物或装载实例。

## 隔离设施

普通复制旧 112 已有依赖：**13579 文件、1030 软链、bytes/SHA 差异0、共享 inode0、外链0**。逐文件原/副本 bytes/SHA/dev/ino 与全部 link/real 见 `dependency-files.json`；原和副本内容 digest 均 `7ba52311e038882c655e044c200fdb7a75d1fd6c4b5e296accdc46f4a2f0f692`。

所有 HOME/TMPDIR/TMP/TEMP/XDG cache/config/state 都指向唯一自有 tmp；单 fork、无缓存、只有原组件传输替身，fetch 禁网。测试不消费 `PREFIX_TRANSCRIPT`，确实相对读取新 fixture；仅 observations 输出到自有证据根。没有 install、builder、service、GUI、Key 或业务数据访问。具体环境白名单见三个 `.command.json`。

旧冻结含原专项设施额外三项 `retest-probes.test.ts`、`retest-stress.test.ts`、`src/core/retest-legacy-renderer.ts`，目录输入实数522；它们并非主包519产品输入，本轮未复制到新产品候选，全部旧522输入仍完整保护。

## 完整命令与结果

运行环境 macOS/bash、Node **v22.23.3**；沿已有 pnpm **11.28.5** 产物，本轮不调用 pnpm。Vitest **2.1.9**、React **18.3.1**。仓库根执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/copilot-error-prefix-dev-20261022-r1-runner.mjs before
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/copilot-error-prefix-dev-20261022-r1-runner.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/copilot-error-prefix-dev-20261022-r1-runner.mjs test
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/copilot-error-prefix-dev-20261022-r1-runner.mjs close
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/copilot-error-prefix-dev-20261022-r1-runner.mjs receipts
```

这些是本轮一次性归档动作，`wx` 不允许覆盖重跑；复验须另建独立 owner/root。首次 before **exit1**（`522 !== 519`，在任何业务修改及副本建立前），修正自有输入分类后 before **exit0/PID5462**；freeze **exit0/PID5534**；test **exit0/PID5722**；close **exit0/PID6137**。首失败及原工具执行收据保留在 `executions/`，工具 PID 与上述 Node/test 子 PID 分开。

测试 runner 实际完整命令如下，cwd 为新冻结包，Node 二进制同上；全部 env、起止、PID、原 stdout/stderr、signal、exit 见对应 `.command.json/.stdout.txt/.stderr.txt`：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node node_modules/vitest/vitest.mjs run src/client/copilot-error-prefix.test.tsx --config /private/tmp/pmtool-copilot-prefix-dev-20261022-r1/vitest.config.mjs --no-cache --reporter=verbose --reporter=json --outputFile=/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CopilotPrefixDevR1/prefix-five.result.json
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node node_modules/vitest/vitest.mjs run \
  src/client/copilot-extension-baseline.test.tsx \
  src/client/shared/drawers/copilot-preconfirm.test.tsx \
  src/client/sidecar-minimize-retention.test.tsx \
  src/client/shared/drawers/gd-overlay-contract.test.ts \
  src/client/index-command-feedback.test.tsx \
  src/client/panel-transport-error-feedback.test.tsx \
  src/client/provenance-panel.test.tsx \
  src/client/shared/markdown.test.ts \
  src/core/ui-feedback.test.ts \
  src/core/copilot-validate.test.ts \
  src/core/copilot-task-fields.test.ts \
  src/core/ask-copilot-b7.test.ts \
  src/core/ask-projection.test.ts \
  src/core/ask-context.test.ts \
  src/core/stale-placeholder.test.ts \
  src/core/derived.test.ts \
  src/core/progress-clamp.test.ts \
  --config /private/tmp/pmtool-copilot-prefix-dev-20261022-r1/vitest.config.mjs --no-cache --reporter=verbose --reporter=json --outputFile=/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CopilotPrefixDevR1/affected.result.json
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false
```

| 命令 | 子PID | exit/signal | 实测范围 |
| --- | ---: | --- | --- |
| `prefix-five` | 5751 | 0/null | 1 文件 5/5，0失败、0跳过；AUTH/RATE/C-COLON 全文单前缀，RAW 多行完整补一次，SUCCESS 正常原文 |
| `affected` | 5778 | 0/null | 17 文件 250/250，0失败、0跳过；sidecar基线/预确认/最小化、传输反馈、投影、Markdown与helper |
| `noemit` | 5793 | 0/null | 原 tsconfig 未改；stdout/stderr 空，不生成产物 |

五份 `observations.ndjson` 实际完整原文、健康后续、calls/writes、savedCalls、unlocked/placeholderRemoved 全部保留。每例 `writes=[]/savedCalls=0` 仅组件 AUTO 边界，不冒充后端零写/GUI/模型终态证明。noEmit 按原 tsconfig 排除 tests，不能称新测试 TypeScript 全量静态检查或 GUI。

**Warnings 原样保留**：`affected.stderr.txt` 有 `TaskTable` 列表缺唯一 key，以及 worker PID5786 的 `MaxListenersExceededWarning`（11 keydown listeners，limit10）。父原 `full-r2.stderr.txt:2,15,83` 已有相同类别警告，本轮未修/抑制/豁免；交 Main 在父范围处理，不影响这里如实记录 exit0。新五例 stderr 空。

**探索/设施失败不隐藏**：本环境 `rg` 不可用127、未提供 memory 路径读取1、首次猜测 R2 test 文件名读取1；冻结/测试正在运行时提前读取 candidate/noemit 输出的 `cat` 返回1，等待原进程完成后实际结果已齐。这些不按产品失败修代码；没有覆盖任何产品测试 RED 或原报告。宽 find 探索已退出，不再运行。

## 自查与保护

按项目自动路由 trivial 抑制 grill/tdd；交付加载只读 `code-review`，mattpocock 锁 `49dd158d1076134a641b33efb035946536778336`，静态门 exit0/13文件逐 bytes/SHA 校验一致。无 installer/setup/global 写。brainstorming/writing-plans 按已批准方案执行，不重复审批/commit/worktree。无子代理派发能力，不冒称双代理独立审查；以下仅开发两轴自查：

- 标准轴：复用既有 helper 与现有 import/catch 模式，无新抽象、schema、分类器或产品 hook。新文件中文来自精确原件，不清洗旧正文。
- 规格轴：业务仅两行，测试仅两个允许设施差异；AUTH/RATE/normal fixture exact。其他 success/cancel/写链路保持原字节。
- `close.json` 已核原112全部输入/依赖/旧lib、主共享lib、前缀独立原件/父认领原件/vendor文件/launcher保护对象不变；主产品输入仅本轮三文件差异，新冻结输入/依赖/config不变，三个自有测试PID均退出。未扫描业务数据、全盘或服务健康，不声称这些根“零污染”或已加载。

## 交 Main 与 STOP

自有证据目录中的 `candidate.json`、`source-files.json/.sha256`、`complete-inputs.json`、父 patch/new文件清单、本轮 `round-exact.patch`、依赖逐文件审计、三条执行命令/结果/原日志、五条 observations、`close.json`、`execution-receipts.json`、`handoff-seal.json` 为可复核交接。最终 seal 同时绑定自有计划/runner/本报告 SHA，避免只交摘要。

**本角色 released/STOP，开发自测不是独立 PASS。** 请 Main 另派不同 SOURCE/AUTO 专家只在新独占冻结复验原五例及受影响集合；之后 Main 唯一新候选 builder 完整认领 114/521、必要 build/完整回归、新实例原21/22 GUI完整提示采证，再交不同 GUI 专家审签。Main 同步 livingdocs，本角色不写。并行 OP3263/F2 工作不改派、不操作。

原112运行实例未操作，不假称已载修后源；747固定门/前置门只保原签字范围。取消/realmodel/整RA-AI06/B8/全部父出口不签，ordinarycommit MAIN_ONLY、push/tag/release/正式切换未执行；父持续验全部任务继续。
