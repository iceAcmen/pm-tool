# A20V slash 命令结果可见性 SOURCE/AUTO 独立复验

> 2026-10-22，角色：独立 SOURCE/AUTO 复验专家。本文只审查 A20V 冻结候选，不修改产品、不运行或停止 GUI 服务，不裁决 GUI、A20 总门、提交或发布。

## 1. 限定结论

| 层级 | 结论 | 独立判定 |
| --- | --- | --- |
| 候选身份与完整增量 | **PASS** | 候选、父候选、三份增量源码和两份构建产物指纹均闭合；相对父候选完整增量仅两处修改和一份新增测试 |
| `package.json` client inject | **PASS / 必要且最小** | 新实现读取 `conversation` 服务；client composition 必须声明 `@deepseek-ai/dsh-client-ui-conversation`，锁文件无需变化 |
| SOURCE SR-S01..S07 | **FAIL** | SR-S01/S02/S03/S05/S06/S07 PASS；SR-S04 FAIL |
| AUTO SR-A01..A10 | **FAIL** | SR-A01/A02/A03/A04/A06/A07/A08/A09/A10 PASS；SR-A05 FAIL |
| GUI / A20 总门 | **不在本轮结论范围** | 未运行 GUI、服务或业务命令；不关闭旧 GUI FAIL、RA-P0007 或 A20 总门 |

**最终结论：A20V SOURCE/AUTO 复验 FAIL。** `conversation.input`、`input.for()` 返回值或 `notify` 缺失时，监听器没有安全跳过而是抛出 `TypeError`。合同明确把任一未处理异常列为阻塞条件，因此本候选不得进入 GUI 复验或关闭该缺陷。

## 2. 候选绑定与完整 diff

- 基线提交：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`
- 冻结树：`/private/tmp/pmtool-a20v-closure-20261022-r1`
- A20V `candidate.json` SHA256：`69539bb0bfb2b8774b6b751555fcde9527d5d7089844fc59a7f2721599ecfc6e`
- 父 A20 `candidate.json` SHA256：`1bc7b72472e24f5ab3b193c3da87a5d76a175e081191be55cc2c4b6b66de6995`
- 相对父候选重建的完整增量 patch SHA256：`2e3061b3b18057911889d1a56c57f4c9178e7bdd2a47f6f94c4d3698a92708a6`

父候选登记的 528 个源文件在 A20V 冻结树中缺失 0 个，只有以下两个既有文件发生变化：

| 文件 | A20 父候选 SHA256 | A20V SHA256 |
| --- | --- | --- |
| `src/client/index.tsx` | `e5702c69...340f89` | `711d04a3...00453b` |
| `package.json` | `c50ccd37...8d66` | `8098dfa7...55a9` |

新增文件只有 `src/client/index-command-feedback.test.tsx`，SHA256 为 `ff02e35e...5c81`。`pnpm-lock.yaml` 前后均为 `646a1a27...3caa`。冻结树三份增量文件与当前工作区对应文件字节一致；`lib/client.js` 与 `lib/core/reflect.js` 也分别匹配候选声明的 `152e2148...fafe`、`6b53e453...03c5`。

A20V manifest 自身没有新的累计 tracked patch SHA；本轮通过父候选完整清单、逐文件复算和独立重建 patch 补齐该绑定，不把当前 dirty `HEAD` 单独当候选。

## 3. Package Inject 审查

`index.tsx` 同时新增：

1. Cordis 运行依赖 `inject = [..., 'conversation']`；
2. `client.get('conversation')` 的实际服务读取；
3. `package.json` 的 client composition inject：`@deepseek-ai/dsh-client-ui-conversation`。

宿主同类 client 插件也以 package-level client inject 装入 conversation 模块。这里没有直接 import conversation 包，只消费运行时服务，因此新增 client inject 是必要改动；不新增 dev/runtime dependency、不改锁文件是合理的。该改动不构成 SR-S07 越界。

## 4. SOURCE 逐项结果

| ID | 状态 | 依据 |
| --- | --- | --- |
| SR-S01 | PASS | 精确监听 `command/executed`，只接受 `commandName === 'pm'` |
| SR-S02 | PASS | `error → error`、其他 kind → `info`；`text !== undefined`；原文直接作为第二参数 |
| SR-S03 | PASS | 使用事件 `sessionId` 调 `sessions.scope`，再以该 scope 调 `conversation.input.for` |
| SR-S04 | **FAIL** | 仅 `conversation` 和 `scope` 有缺失检查；`input`、`for()` 返回值及 `notify` 均被直接解引用 |
| SR-S05 | PASS | `ctx.on` 由 Cordis fiber 生命周期托管；真实 Context 卸载/重装用例通过 |
| SR-S06 | PASS | `executeRaw` 保持一次 remote execute，未新增本地 notify 或第二次执行 |
| SR-S07 | PASS | 相对父候选仅 client 接缝、必要 manifest inject 和同域测试；未改后端、存储、schema、上游或面板协议 |

关键失败位置为冻结候选 `src/client/index.tsx:34-35`。即使真实 command service 会捕获 observer throw 并记录 warning，这也不是合同要求的“能力缺失时安全跳过”，不能据此洗绿 SR-S04。

## 5. AUTO 逐项结果

独立探针直接 import 冻结候选真实 `apply(ctx)`，仅替换 Cordis/宿主服务为可观察桩；SR-A06 使用真实 Cordis `Context`。

| ID | 状态 | 结果 |
| --- | --- | --- |
| SR-A01 | PASS | success 多行原文仅通知事件 session 一次 |
| SR-A02 | PASS | error 原文精确映射 `('error', text)` |
| SR-A03 | PASS | `help`、`pmx`、`PM` 均零通知 |
| SR-A04 | PASS | 当前首项为 A、事件属于 B 时仅通知 B，未创建 session |
| SR-A05 | **FAIL** | scope/conversation 缺失通过；input 缺失、`for()` 无返回值、notify 缺失三项均抛 `TypeError` |
| SR-A06 | PASS | 卸载后零新增；重装后每事件严格一次，无旧监听累计 |
| SR-A07 | PASS | `/pm ping` remote 严格一次，返回值不变，本地 notify 为 0 |
| SR-A08 | PASS | transport error 与 CommandResult error 均保持抛错；各 remote 一次、notify 为 0 |
| SR-A09 | PASS | 两个 A/pm、一个非 pm、一个 B/pm 的次数、顺序和 session 隔离正确 |
| SR-A10 | PASS | 候选测试独立复跑确认 undefined 零通知、空字符串通知一次 |

独立主探针退出码 `1`，共 `13` 个断言用例：`10 PASS / 3 FAIL`。失败原始 stderr、stdout 和 JSON reporter 均保留，未改 expect、未覆盖或重跑洗绿。

## 6. 执行记录与保护边界

运行环境：macOS，Node `v22.23.3`，Vitest `2.1.9`；工作目录为冻结候选插件包，`HOME/TMPDIR` 指向本报告证据目录。

| 命令 | 结果 |
| --- | --- |
| `node docs/testing/a20v-source-auto-independent-retest-20261022-run.mjs` | exit `1`；独立 AUTO `10/13 PASS`，SR-A05 三项 FAIL |
| 冻结候选 Vitest 执行 `src/client/index-command-feedback.test.tsx` | exit `0`；`8/8 PASS`，但未覆盖上述三项失败 |
| 冻结候选 `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` | exit `0`；stdout/stderr 均空 |

独立主探针执行前后五个候选关键文件 SHA256 完全一致，`sourceDrift=[]`。本轮未执行 build：SOURCE 已不闭合，按合同执行顺序停止后续门；候选原有 build 产物只核指纹，不改写。未运行/停止任何 GUI 服务，未写上游、正式数据、候选树或产品代码。

## 7. 产物

- 本报告：`docs/testing/a20v-source-auto-independent-retest-20261022.md`
- 独立用例：`docs/testing/a20v-source-auto-independent-retest-20261022-cases.test.tsx`
- 执行器：`docs/testing/a20v-source-auto-independent-retest-20261022-run.mjs`
- Vitest 配置：`docs/testing/a20v-source-auto-independent-retest-20261022-vitest.config.mts`
- 原始证据目录：`docs/testing/a20v-source-auto-independent-retest-20261022-evidence/`
- 候选与 diff 身份：`...-evidence/candidate-identity.json`、`increment-from-parent.patch`
- 独立失败原证：`...-evidence/execution.json`、`stdout.txt`、`stderr.txt`、`vitest.json`
- 支撑复跑原证：`...-evidence/candidate-vitest*.{json,txt}`、`tsc-noemit-*.{json,txt}`

后续只能由开发修复 SR-S04/SR-A05 并交付新候选；任何产品源码、测试 Oracle 或构建产物变化后，本报告受影响结论失效，须重新做 SOURCE/AUTO。GUI 与 A20 总门保持原状态。
