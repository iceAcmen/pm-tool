# 副驾错误前缀独立复验 R1 报告

> 2026-10-22，trae，CopilotPrefixRetestR1。不同独立 SOURCE/AUTO 专家，非开发、非 GUI 执行。仅判本窄修与指定受影响集合，不签父任务结项。

## 裁决

**PASS_LIMITED_SOURCE_AUTO：S112-PREFIX-01 的两行业务窄修符合原完整文本 oracle；独立实跑原五例 5/5、affected 17 文件 250/250、原 tsconfig noEmit exit0。**

五例和 affected 均无失败、跳过或 todo。新 GUI/实际装载 **NOT_RUN/NOT_SIGNED**；旧 112 的双前缀 GUI FAIL 不被本签字升级或豁免。B8、整 RA-AI06、取消/realmodel、父 goal/ordinarycommit 均不签。

依据：[本次授权与执行计划](copilot-error-prefix-independent-retest-20261022-r1-plan.md)、AGENTS、collaboration §9/§11、父 closure 计划、开发 R1 plan/report 与完整 seal、先行独立 R2 原件。父持续多角色验全部/修确证缺陷/最后 ordinarycommit 的授权保留，子单不重复审批，也不执行 Git。

## 独立认领

证据根：`reports/all-pending-evidence-20261021/CopilotPrefixRetestR1/`。独占新冻结：`/private/tmp/pmtool-copilot-prefix-independent-retest-20261022-r1/packages/dsh-pm-tool`。

基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；version `0.7.4` 只作身份字段，不当完整 dirty 候选。独立逐 bytes/SHA 校开发 `handoff-seal.json` 全部 evidence/ownDocs，并确认开发已 released/STOP、原测试 PID 均退出；未执行开发 executor 或引用开发绿作为本门 PASS。

| 对象 | bytes | SHA256 |
| --- | ---: | --- |
| 修后 `src/client/shared/drawers/sidecar-portal.tsx` | 45837 | `e2e9054e9ad0d7a7e9f3c0020760a2c48a8c477ae44af6b01c2a509e8e4204dc` |
| 旧 112 同文件 | 45842 | `7cf48821e7e6ee570288c385b59897fd33f8ab0ec32da42ef87111c2c016a269` |
| 新 `src/client/copilot-error-prefix.test.tsx` | 4319 | `40aab2a19f34bb82a97cd1e7510ccbc187c8a9218bd03c47e0ab0b133f118e90` |
| 新 `src/client/copilot-error-prefix-fixture.json` | 403 | `54386e800c3262e5bcfd67ef325ab32a3ec11f7ad8fc59c0f3a075d03169fb97` |
| `source-files.json` | 14600 | `0500f00c43f037f4a2b2ea7146b51ef62e3de5a81fcad022e516b1f0d3c5ba8b` |
| `complete-inputs.json` | 74963 | `916040b65c910488a7552b6caf5b7c39e354a592e59510658135c66588722eec` |
| `round-exact.patch` | 6241 | `30910cf5898dea570ef5b1db64d6a98c963d2b2e2dcd4b894c5f358df08cb987` |

独立反推旧 **112 声明/519 输入**：只替换已认领 sidecar 指纹，新增 test/fixture 两项，实核 **114 声明/521 完整包输入**。114 中的 15 launcher 逐 SHA 校主原件，无本轮 launcher 用例，不复制或执行 launcher。旧冻结目录实有 522 输入，其中三个原专项设施额外文件不属于旧 519 产品全集；未把它们混进新产品候选，旧 522 全部保护。

本轮完整复制 521 后，主包、开发冻结、新冻结逐字节等同。保留父 `parent-tracked-product.diff`、`parent-new-product-files.txt` 与本轮 `round-exact.patch`，共同绑定基线后候选；本角色没有调用 Git 获取或改变状态。详见 `source-audit.json`、`before.json` 和原样认领文件。

## 源码与 Oracle

独立全文计算并核 `/usr/bin/diff`，业务文件恰为旧 112 仅两处替换：

```tsx
import { parseActiveModelLane, prefixFeedbackOnce } from '../../../core/ui-feedback.js'
setMsgs(m => [...m, { role: 'ai', text: prefixFeedbackOnce('副驾暂不可用', e) }])
```

不改命令/传输/分类器/共享 helper、成功/取消/计划/写链路。必要只读检查现有 helper 对 `prefix：`、`prefix:` 原样保留，否则补一次；未新增抽象、产品 hook、trim/global replace 或自编 AUTH classifier。

新五例全文恰等先行 `-r2-component.fixture.tsx`，仅允许 transcript 相对 fixture 读取与 observations 可选两处设施差异。**AUTH/RATE/normal fixture 与先行 transcript 403 字节精确相同**；完整 oracle、真实 `CopilotPanel`/`MarkdownView`、取文本器的 `br -> \n`、健康后续和零写断言不变。新冻结 test/fixture 原样复制，无受测源码或 oracle 变换。

原 R2 真执行 `exit1`、五例 **2 绿 3 必要红** 的结果/命令/完整 observations 已独立解析并保护，未覆盖或重跑；首轮自有 `<br>` 取文本设施失败也完整保留，不改产品迁就旧设施。

| 原五例 | R2 修前 | 本轮修后全文与边界 |
| --- | --- | --- |
| P-AUTH | RED | `副驾暂不可用：模型 ark-plan/deepseek-v4-1-flash-260910 凭据无效或已失效，请检查 API Key。` 精确不再重复 |
| P-RATE-PREFIX | RED | `副驾暂不可用：模型服务限流，请稍后再试。` 精确单前缀 |
| C-RAW | GREEN | `副驾暂不可用：Failed to fetch\n完整传输原因` 全文保留换行，恰补一次 |
| C-COLON | RED | `副驾暂不可用:完整传输原因` ASCII 冒号原样保留 |
| C-SUCCESS | GREEN | `修后副驾正常恢复：这是只读回答，不修改项目。` 原样，不加错误前缀 |

每例 input/expected/recovered/calls/writes/savedCalls/unlocked/placeholderRemoved 与原 R2 完全一致，修后 actual 全文等 expected；不是 substring 或前缀计数洗绿。五例均 `writes=[]`、`savedCalls=0`、已解锁、占位清除、同组件健康后续成功。仅是组件 AUTO 边界，不冒真实后端零写、真实模型 terminal 或 GUI。

## 环境与独占设施

macOS/bash、既有 Node **v22.23.3**、Vitest **2.1.9**、React **18.3.1**，沿 pnpm **11.28.5** 依赖产物；本轮不调用 pnpm、nvm install 或 builder。

开发已释放依赖普通复制：**13579 文件、1030 软链，bytes/SHA 差异0、与开发及旧112共享 inode0、外链0、软链目标相对归属差异0**。原/开发/本轮逐文件 bytes/SHA/dev/ino 与各软链 link/real、检查错误列表全存 `dependency-files.json`。521 输入复制也核 bytes/SHA 和不同 inode；无依赖安装、hardlink 或外部依赖入口补造。

HOME/TMPDIR/TMP/TEMP/XDG cache/config/data/state 全指 selftmp；无缓存、singleFork、无并行文件执行，正式五例禁 fetch，白名单 env 不含 Key。Vitest config 与原 tsconfig 全程保护，noEmit 不生成 lib/full bundle。只写本次前缀 docs、证据根和 selftmp。

## 完整命令与实测

仓库根入口、macOS/bash、Node22 既有二进制：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/copilot-error-prefix-independent-retest-20261022-r1-runner.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/copilot-error-prefix-independent-retest-20261022-r1-runner.mjs execute
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/copilot-error-prefix-independent-retest-20261022-r1-runner.mjs seal
```

以下真实测试 cwd 为新冻结包；完整 argv、cwd、白名单 env、父子 PID、起止、status/signal/error 与原 stdout/stderr 保存对应 `.command.json/.stdout.txt/.stderr.txt`。原五例与 affected JSON/完整 observations 另存，不执行或改旧 executor。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node node_modules/vitest/vitest.mjs run src/client/copilot-error-prefix.test.tsx --config /private/tmp/pmtool-copilot-prefix-independent-retest-20261022-r1/vitest.config.mjs --no-cache --reporter=verbose --reporter=json --outputFile=/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CopilotPrefixRetestR1/prefix-five.result.json
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
  --config /private/tmp/pmtool-copilot-prefix-independent-retest-20261022-r1/vitest.config.mjs --no-cache --reporter=verbose --reporter=json --outputFile=/Users/bytedance/Projects/dsh-pm/pm-tool/reports/all-pending-evidence-20261021/CopilotPrefixRetestR1/affected.result.json
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false
```

| 动作 | 实际 PID | status / signal | 结果 |
| --- | ---: | --- | --- |
| execute 总执行 | 工具7180 / Node7182 | 0 / null | 2026-10-22 14:58:15–15:00:15 UTC，完整原工具收据 exited/outputComplete |
| freeze | 7183 | 0 / null | 源码 exact、521/114 与依赖独占检查 |
| sidecar exact diff | 7238 | 1 / null | 预期差异返回1，不是产品 FAIL；两处替换原 diff 留存 |
| test 调度 | 7307 | 0 / null | 原5、affected、noEmit 顺序执行 |
| prefix-five | 7321 | 0 / null | 1 文件5/5，0失败/跳过；stderr 空 |
| affected | 7341 | 0 / null | exact17文件250/250，全部 actual fullName 与开发列明集合一致 |
| noemit | 7405 | 0 / null | 原 tsconfig，不改配置；stdout/stderr 空 |
| close | 7443 | 0 / null | 原件/冻结/依赖/lib/config 保护、全部测试子 PID 退出、有限独立判定 |

`noEmit` 仍按原 tsconfig 排除 `*.test.ts/tsx`，不称新测试全部静态类型检查。没有 coverage、verify 全集、整包 build 或旧112全回归，未签其本轮结果。

**Warnings 保真**：affected 原 stderr 有 `TaskTable` 唯一 key 警告，以及 worker **PID7353** 的 `MaxListenersExceededWarning`（11 keydown listeners，limit10）；同类别已存在旧112 `full-r2.stderr.txt`。本轮不修、不压制、不作发布豁免，不写“零警告”；Main 在父范围接续。五例及 noEmit stderr 空。本次无产品 FAIL、无自有测试设施重试；探索 `rg` 不可用127、缺省 memory路径读取1、确认新根不存在的 `ls`1 如实列为工具事实，不算产品失败。

## 原件保护与封存

`before.json`/`close.json` 实核 **94 份归档保护文件**不变：先行前缀全部 test/fixture/result/observations/报告、开发证据/文档/seal、父认领原件与15 launcher。另独立完整保护主包521、旧112全522、开发包521输入与主/旧/开发lib、旧与开发依赖；不能把94误读为只查94个源码/依赖。

新冻结521、依赖/config不变，无新lib/fullbundle；prefix/affected/noEmit及 freeze/test/close 调度进程已退出。临时设施和所有原件保留，不删除或覆盖。只有本次允许写面发生本角色写入；不扫描业务data、Key、正式资产、全盘或服务，未覆盖根不称零污染。

Main 其他并行 livingdocs 明确允许，不锁、不以其变化判污染。Main 唯一 GUI 当前3263旧112原F2OP、EGO p3 未探测或操作；旧服务、旧封包、微信成果、上游与 vendor 全不写。本轮未 build/install/browser/service/Git/发布。

`execution-receipts.json` 绑定各真实执行命令和原工具执行收据，工具PID与Node/testPID分列；`handoff-seal.json` 绑定本计划/runner/报告、114声明、521输入、exact patch、原件保护及全部证据 SHA。seal 后另核全文指纹和进程退出，不用仅摘要代替完整输入。

## Release / STOP

**本角色 released/STOP，仅 PASS_LIMITED_SOURCE_AUTO。** SOURCE/AUTO 的重复前缀修复门可交 Main 后继 builder；不签新GUI、不关闭旧双前缀GUI FAIL、不称原112已加载新源。

Main 后继动作：完整认领114/521与两行窄改/新增test/fixture，唯一新冻结 build/必要完整回归；新实例采原21真实401、22真实429/正常恢复的完整提示，交不同 GUI 专家审签。原112已签证据按影响继承，原未签取消/realmodel/B8/RA-AI06和父全部出口继续。最后 ordinarycommit MAIN_ONLY，push/tag/release/正式切换不在本子单授权内。
