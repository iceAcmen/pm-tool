# A20V2 slash 命令结果可见性 SOURCE/AUTO 独立复验

> 2026-10-22，角色：独立 SOURCE/AUTO 复验专家。本文只审查 A20V2 冻结候选，不修改产品、不运行或停止 GUI 服务，不裁决 GUI、RA-P0007、A20 总门、提交或发布。

## 1. 限定结论

| 层级 | 结论 | 独立判定 |
| --- | --- | --- |
| 候选身份与增量 | **PASS** | A20V2 manifest、父 A20V manifest、三份声明源码和两份构建产物指纹闭合；相对 A20V 比较 394 个源码/声明文件，仅 `index.tsx` 与同域测试变化 |
| SOURCE SR-S01..S07 | **PASS** | 原 SR-S04 三个失败分支已有显式能力检查；其余事件、路由、生命周期、面板与范围合同保持 |
| AUTO SR-A01..A10 | **PASS** | 上一轮原 13 条独立断言 `13/13 PASS`；候选 9 条测试 `9/9 PASS`；真实 Cordis 卸载与 `executeRaw` 防双发均通过 |
| 类型检查与候选保护 | **PASS** | `tsc --noEmit` exit 0；五个关键候选文件执行前后 SHA256 一致，`sourceDrift=[]` |
| GUI 准入 | **允许进入 GUI 复验** | SOURCE/AUTO 前置门已闭合；后续必须绑定同一候选执行 SR-G01..G07 |
| GUI / A20 总门 | **保持未关闭** | 本轮未执行 GUI、服务或业务命令，不关闭既有 GUI FAIL、RA-P0007 或 A20 总门 |

**最终结论：A20V2 SOURCE/AUTO 独立复验 PASS，允许进入 GUI 复验。**

上一轮 [A20V SOURCE/AUTO 独立复验](a20v-source-auto-independent-retest-20261022.md) 的三个 `TypeError` FAIL 报告完整保留，不回写、不删除、不改判。该报告只约束 A20V；本报告以新 manifest 和新冻结树审签 A20V2。

## 2. 候选绑定

- 基线提交：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`
- A20V2 manifest：`reports/all-pending-evidence-20261021/A20V2/candidate.json`
- manifest SHA256：`c0e678055ee2dee6be40f99ebe52f88843a7de9933a26c87007d1678f834946b`
- 冻结树：`/private/tmp/pmtool-a20v2-closure-20261022-r1`
- 父 A20V manifest SHA256：`69539bb0bfb2b8774b6b751555fcde9527d5d7089844fc59a7f2721599ecfc6e`

声明值与冻结树实测值一致：

| 文件 | SHA256 |
| --- | --- |
| `src/client/index.tsx` | `61f927ed...2d339a` |
| `src/client/index-command-feedback.test.tsx` | `9c43bf46...257af` |
| `package.json` | `8098dfa7...55a9` |
| `lib/client.js` | `a5e3586b...5ea39` |
| `lib/core/reflect.js` | `6b53e453...703c5` |
| 开发方 `command-feedback-vitest.json` | `45ee3e99...fafd1` |

独立比较 A20V 与 A20V2 的全部 `src/**`、`package.json`、`pnpm-lock.yaml`，共 394 个文件。差异仅有：

1. `src/client/index.tsx`：增加 `input.for`、返回 target、`target.notify` 三层能力检查；
2. `src/client/index-command-feedback.test.tsx`：增加能力缺失安全跳过测试。

`package.json` 与父 A20V 字节一致。完整身份与保护结果见 `...-evidence/candidate-identity.json`。

## 3. SOURCE 逐项结果

| ID | 状态 | 依据 |
| --- | --- | --- |
| SR-S01 | PASS | 精确监听 `command/executed`，仅接受 `commandName === 'pm'` |
| SR-S02 | PASS | `error → error`，其他 kind → `info`；仅过滤 `text === undefined`，已定义正文直接透传 |
| SR-S03 | PASS | 以事件 `sessionId` 解析 scope，再调用该 scope 的 `conversation.input.for` |
| SR-S04 | PASS | scope、conversation、input、`for`、target、`notify` 缺失均安全返回；不创建 session、不回退、不重跑 |
| SR-S05 | PASS | 监听继续使用 `ctx.on`；真实 Cordis Context 卸载/重装断言通过，无旧监听累计 |
| SR-S06 | PASS | `executeRaw` 仍只有一次 `remote.commands.execute(sessionId, '/pm ...', [])`，没有本地 notify 或第二次执行 |
| SR-S07 | PASS | 产品增量只触及 client 回显接缝；未改命令处理器、存储、schema、上游或面板反馈协议 |

修复位于冻结候选 `src/client/index.tsx:34-38`。它直接闭合上一轮 SR-S04 的三个失败点，没有捕获合法 `notify` 自身抛出的异常，也没有扩大业务范围。

## 4. AUTO 逐项结果

上一轮独立用例只把两处 A20V 冻结树绝对路径替换为 A20V2 路径，其他字节不改。转换来源、SHA256 和替换次数见 `test-derivation.json`。

| ID | 状态 | 独立结果 |
| --- | --- | --- |
| SR-A01 | PASS | success 多行原文仅通知事件 session 一次 |
| SR-A02 | PASS | error 原文仅以 `('error', text)` 通知一次 |
| SR-A03 | PASS | `help`、`pmx`、`PM` 均零通知 |
| SR-A04 | PASS | 当前首项为 A、事件属于 B 时只通知 B，未创建 session |
| SR-A05 | PASS | scope、conversation、input、`for()` 返回值、notify 五类缺失均不抛错、无执行、无创建 |
| SR-A06 | PASS | 真实 Cordis Context 卸载后零新增；重装后每事件一次，无累计监听 |
| SR-A07 | PASS | `executeRaw('ping')` remote 严格一次，行是 `/pm ping`，本地 notify 为 0 |
| SR-A08 | PASS | transport error 与 CommandResult error 保持抛错；各 remote 一次、notify 为 0 |
| SR-A09 | PASS | 连续结果顺序、次数、命令隔离与两个 session 隔离正确 |
| SR-A10 | PASS | 候选测试确认 undefined 零通知、空字符串通知一次 |

独立 13 条断言覆盖 SR-A01 至 SR-A09，其中 SR-A05 展开为 5 个独立分支；候选 9 条测试补充 SR-A10 和修复同域回归。两组均使用冻结候选真实 `apply(ctx)`，没有复制监听实现或改写产品分支。

## 5. 执行记录

运行环境：macOS，Node `v22.23.3`，Vitest `2.1.9`。工作目录均为冻结候选 `packages/dsh-pm-tool`；临时 `HOME/TMPDIR` 位于本报告证据目录。

| 命令 | 结果 |
| --- | --- |
| `node docs/testing/a20v2-source-auto-independent-retest-20261022-run.mjs` | exit `0` |
| 独立 Vitest：上一轮 13 条断言绑定 A20V2 | `13/13 PASS`，exit `0` |
| 候选 Vitest：`src/client/index-command-feedback.test.tsx` | `9/9 PASS`，exit `0` |
| 冻结候选 TypeScript：`tsc -p tsconfig.json --noEmit` | exit `0`，stdout/stderr 为空 |

执行前后复算 `index.tsx`、候选测试、`package.json`、`lib/client.js`、`lib/core/reflect.js`，五项全部一致，`sourceDrift=[]`。本轮未重建 `lib/`，避免写入冻结产物；已核对候选登记的构建产物指纹。本轮未运行或停止 GUI 服务，未写上游、正式数据、冻结树产品文件或其他候选。

## 6. 证据与后续边界

- 本报告：`docs/testing/a20v2-source-auto-independent-retest-20261022.md`
- 执行器：`docs/testing/a20v2-source-auto-independent-retest-20261022-run.mjs`
- Vitest 配置：`docs/testing/a20v2-source-auto-independent-retest-20261022-vitest.config.mts`
- 原始证据：`docs/testing/a20v2-source-auto-independent-retest-20261022-evidence/`
- 候选身份：`candidate-identity.json`
- 用例等价转换：`test-derivation.json`、`independent-cases.test.tsx`
- 原始执行元数据：`independent-13-execution.json`、`candidate-9-execution.json`、`tsc-noemit-execution.json`
- JSON reporter：`independent-13-vitest.json`、`candidate-9-vitest.json`
- 标准输出与错误输出：对应 `*-stdout.txt`、`*-stderr.txt`
- 前后指纹与总结果：`summary.json`

后续 GUI 执行端可在不触碰正式服务的隔离实例上，严格按合同 SR-G01 至 SR-G07 为同一 A20V2 候选采集原始证据。GUI 执行与独立判定仍须分离；SOURCE/AUTO PASS 不替代真实页面正文可见、session 归属、非 pm 隔离及面板单双发的 GUI 证据。
