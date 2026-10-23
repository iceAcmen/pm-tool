# 本轮命令与设施审计

> 2026-10-23，trae 独立专家。macOS/bash，cwd `/Users/bytedance/Projects/dsh-pm/pm-tool`。这是实际调用记录，不是要求重放；所有写出采取 wx，不覆盖旧收据。完整测试 argv/cwd/env/start/end/exit/signal/error及 stdout/stderr 在自有两隔离根与 execution/recovery JSON 内。

## 1. 独立执行

以下命令 Node 均为 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`。没有执行开发 runner；原开发报告中的命令只读，不计本轮执行。

| 本轮实际命令 | exit / 审计结果 |
| --- | --- |
| `node --check docs/testing/p1005-listbox-backdrop-source-auto-20261023-r1-runner.mjs` | 0，初版自有设施语法 |
| `node docs/testing/p1005-listbox-backdrop-source-auto-20261023-r1-runner.mjs capture` | 0，1102声明、1077原件、225开发输出、精确delta、17输入快照、641依赖 |
| `node docs/testing/p1005-listbox-backdrop-source-auto-20261023-r1-runner.mjs run` | 0，初DOM7断言绿但stderr污染，**该7拒签**；四旧专项28有效绿 |
| `node --check docs/testing/p1005-listbox-backdrop-source-auto-20261023-r1-recovery.mjs` | 0，独立设施纠正器语法 |
| `node docs/testing/p1005-listbox-backdrop-source-auto-20261023-r1-recovery.mjs run` | 0，只恢复污染DOM7；同SHA7绿、runtime identity true、stderr空；28不重复 |
| `/usr/bin/diff -u <原dom-r2冻结listbox> <当前listbox>` | 1，正常差异；完整两绝对路径在 capture.diff.argv 和首根 output/delta-command.json；精确1行变5行 |
| 首轮 Vitest `run --config /tmp/p1005-listbox-backdrop-source-auto-20261023-r1-jXA2wI/config/dom.mjs` | 0，7断言；10次Uncaught attachEvent/detachEvent，事件设施污染 |
| 首轮 Vitest `run --config /tmp/p1005-listbox-backdrop-source-auto-20261023-r1-jXA2wI/config/affected.mjs` | 0，8+11+3+6=28、stderr空 |
| 纠正 Vitest `run --config /tmp/p1005-listbox-backdrop-source-auto-20261023-r1-recovery-BvvKqY/config/vitest.mjs` | 0，7、stderr空、identity与事件事实核对真 |

Vitest 三次真实入口均 `node <既有vitest绝对路径>/vitest.mjs run --config <上表配置>`，入口、cwd、环境白名单的确切值随 command.json/receipt 留存。没有 build/install/noEmit/全verify、默认包测试配置、服务或GUI；没有调用pnpm。设施纠正不是产品修复，未清/改原输入或失败产物。

最终执行的 `node docs/testing/p1005-listbox-backdrop-source-auto-20261023-r1-recovery.mjs seal` 末码与逐项失败列表以本前缀最终 seal.json 为准；本文在该命令之前落档，不预造其末码。本 seal 不自指纹；本审计在 seal.outputs 内。

## 2. 只读探索

每一行列一次真实工具调用或同一组独立读取；未把读取 exit0当产品测试PASS。下列 `node -e` 为只读 JSON/依赖结构提取，不import产品、不跑开发脚本；相同内容后由 capture/recovery/输出指纹复核。

| 实际读取/检索 | exit |
| --- | --- |
| `cat AGENTS.md` | 0 |
| `sed -n '1,260p' docs/plans/2026-10-23-p1005-deliverable-pointer-report.md` | 0 |
| `rg --files docs/testing` 管道检索 p1-l2/p1005/1077/1102 | 127，rg不存在；未以无结果判缺文件 |
| `rg -n '^##\|^###\|ADL-045\|ADL-057\|11\\.7' docs/collaboration.md` | 127，同设施缺失 |
| `pwd` | 0，repo根 |
| `sed -n '230,540p' docs/collaboration.md` | 0 |
| `cat docs/testing/p1-l2-events-gui-review-20261023-r1.md` | 0，全文含§5/§7 |
| `cat docs/plans/2026-10-23-p1005-deliverable-pointer-plan.md` | 0 |
| `cat docs/plans/2026-10-23-p1005-deliverable-pointer-baseline.json` | 0，工具截断大输出；随后用结构化Node取需要字段 |
| `sed -n '1,280p' docs/plans/2026-10-23-p1005-deliverable-pointer-run.mjs` | 0，只读 |
| `sed -n '130,240p' docs/collaboration.md` | 0，§9/§11补齐 |
| `cat packages/dsh-pm-tool/src/client/views/records/records-deliverable-pointer-dom.test.tsx` | 0 |
| `cat` records-listbox.tsx、records-deliverable-form.tsx、records-overlay.tsx | 0，同一次调用，实际生产实现 |
| `node -e` 解析 baseline/seal-r2/final-check-r2/green-final-r2-receipt/red-final-receipt/affected-receipt | 0，结构化摘要 |
| `grep -R -n -E` RecordsListbox/records测试引用，限定 records、scripts、原remaining-governance | 0 |
| `cat` records-options.test.ts、records-payloads.test.ts、records-history.test.ts、form-validation.test.ts | 0，同一次调用，确切28用例源码 |
| `grep -R -n -E 'B6\|B8\|deliverable-status\|report-status\|action-status\|listbox\|records-meeting-(entry\|layout)' docs/testing --include='*.md'` | **NOT_CAPTURED**，工具返回正在运行及大量输出，但未返最终末码；不补造0 |
| `sed -n '180,207p'` records-meeting-form.tsx | 0 |
| `sed -n '270,297p'` records-meeting-form.tsx | 0 |
| `sed -n '223,319p'` records-report-form.tsx | 0 |
| `grep -n -E 'B6\|B8\|P1005\|records\|listbox'` remaining-governance、op-growth-final-inheritance、remaining-acceptance-delta | 0 |
| `grep -n -E 'B6\|B8\|会议\|交付物\|汇报\|listbox' docs/testing/system-ui-b0-b8-test-plan-20261017.md` | 2，猜测可选文件不存在，不是合同缺失/产品FAIL |
| `grep -R -n 'RecordsListbox' packages/dsh-pm-tool/src/client --include='*.tsx' --include='*.ts'` | 0，最终五consumer/十三JSX；test/export不计 |
| `node -e` realpath/version读4依赖，同时spawn pgrep | 0；内部 `pgrep -fl '^grep -R -n -E B6'` exit1，无前述grep运行进程，stdout/stderr空；不据此补原末码 |
| `sed -n '1,160p'` remaining-governance-cases-20261021.md | 0 |
| `sed -n '100,142p'` remaining-acceptance-delta-20261022.md | 0 |
| `cat` habit-form.tsx | 0 |
| `sed -n '78,176p'` okr-form.tsx | 0 |
| `find docs/testing -maxdepth 1 -type f -iname '*b*test*'` | 0，输出偏宽；未访问private输出副本 |
| `sed -n '28,48p'` 自有runner | 0，执行前审代码；Buffer写入问题尚未执行，apply_patch补齐 |
| `node -e` 摘自有capture/execution facts、保护数量、分文件测试数 | 0 |
| `node -e` 首次核历史阶段及D04/D06 | **1，SyntaxError: Unexpected token ')'**；解释器未运行读取逻辑，不是产品失败；改为两个较小只读调用 |
| `find docs/testing -maxdepth 1 -name 'remaining-*.md'` | 0 |
| `cat` 自有首根 dom/affected stderr和delta stdout | 0，发现10次Uncaught；不隐藏计数绿后的设施错 |
| `grep -n -E 'Error:\|Uncaught\|Warning:\|Tests\|test'` 首根DOM stderr | 0，焦点错误明细 |
| `grep -n -E` 既有 RA-J02/J04/D10/D12/DR/MENU等，remaining-journey/objective | 0 |
| `node -e` 缩小历史 dom-r2/red-final/green-final-r1/r2 核对 | 0，红5/2、绿7/0和真实source/test SHA |
| `sed -n '1,150p'` remaining-layer-map-20261021.md | 0，原DR/MENU确切ID |
| `sed -n '65,80p'` remaining-journey-cases-20261021.md | 0，原R01..05 |
| `node -e` dom-r2/red-final/green-final-r2 的 D04/D06 click/calls/defaultPrevented 提取 | 0，原两红第二trigger detail1；绿无第二click |
| `sed -n '66,100p'` 本前缀报告 | 0，按逐行列表纠正13而非14 |

所有文件手动新增/编辑使用 apply_patch，作用域仅本前缀；结构化runner输出使用wx。未访问平台private输出日志、项目外记忆/凭据；memory工具发现未产生相关资源读取。未查Git/服务/业务库。

## 3. 准确解释

原宽域grep末码缺失是只读探索审计缺口，**NOT_CAPTURED不是成功码**；进程后续已无匹配，不持有任务。独立判定依赖的 capture/Vitest/纠正/最终seal各有完整末码和原输出，不能用宽域grep末码缺口假称产品FAIL，也不能称“所有探索命令均已0”。

所有产品/声明输入漂移在 capture、每次执行及seal重核；当前有限PASS只绑定最终干净DOM7与原干净28。原开发红/首轮污染保留，未使用开发runner代独立执行，没有将GUI/人工项降为MANUAL_PENDING。
