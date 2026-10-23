# 六修组合独立审证 R1 命令审计

运行环境：macOS，仓库根 `/Users/bytedance/Projects/dsh-pm/pm-tool`，bash；自有解析使用绝对 Node22.23.3。仅新增本报告前缀文件及 `/tmp/combined-six-repairs-regression-review-20261023-r1-reader.mjs`。不执行产品、Main脚本、Git或GUI。

## Main 原命令

全部完整实际argv/cwd/env/PID/start/end/exit/signal/stdout/stderr指纹，见 [最终审计](combined-six-repairs-regression-review-20261023-r1-audit-final.json) 的 `groups.commands_outer_child_stdout_stderr.result.commands`。默认95实际子命令及每项exit0，见同件 `groups.default95_verify_guard_watch_boundary.result.targets/exitCodes`；不是只引用汇总。

| 原动作 | 已核child exit | 已封spawnSync调用层exit |
| --- | --- | --- |
| freeze | 0 | 0 |
| tsc | 0 | 0 |
| bundle | 0 | 0 |
| noemit | 0 | 0 |
| full | 0，162/1707 | 0 |
| DOM | 0，6/39 | 0 |
| special首轮 | **1，7失败** | **1** |
| special-r2 | 0，2/7 | 未单列outer metadata；负责人明确实际脚本0，不伪造 |
| verify默认95 | 0；95项各0 | 0 |
| guard | 0 | 0 |
| close | 0 | 0 |
| Main seal | 负责人明确实际0 | 本索引未单列，不补造UUID/PID/metadata |

## 自有执行

下面三个命令实际执行，各只读核原证，末尾以wx创建对应新审计，不重跑产品。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/combined-six-repairs-regression-review-20261023-r1-reader.mjs attempt1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/combined-six-repairs-regression-review-20261023-r1-reader.mjs facility-check
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/combined-six-repairs-regression-review-20261023-r1-reader.mjs final
```

| 自有阶段 | 实际exit与保真 |
| --- | --- |
| attempt1 | **1**，9/10组。包装器误比executor；失败stack、input reader SHA与所有已通过组保留在audit-attempt1.json |
| facility-check | **0**，仅设施1组；独立字面量解析完整重建派生。不eval/import/执行Main。单组绿不冒整回归PASS |
| final | **0**，11组；errors=[]，audit-final.json。实际工具exited/outputComplete=true/PID9200/exit0 |
| seal内置fs/hash | 执行实际终码及自有产物指纹由seal.json与最终工具回传绑定；不是产品seal或父准入 |

attempt1 reader SHA：`7483948b0049d5ac7ba8a95fd700c10cbaee56d3a2bc44d7e3e393f2d5ecb712`。修正设施 reader SHA：`afd20e3e4561fcf5c825e01c9dab430bc99708496d34f026ffd3d48ab6b61ebd`。最终 reader SHA：`6b1bb87cd06299722671bba9d9b6a8a59dd97bf7f017593b9bc4b215394cb34d`。各阶段审计不可覆盖。

## 全部只读准备命令的结果

只读终端调用逐类列明；Node查询只使用 `--input-type=module -e` 内置fs/JSON/hash，未import产品或spawn测试。简写的查询说明是读证动作描述，不是声称另有完整产品测试命令。

| 命令/读取对象 | 实际exit | 范围与说明 |
| --- | --- | --- |
| `pwd` | 0 | 确认仓库根 |
| `cat AGENTS.md` | 0 | 规则入口 |
| `cat docs/plans/2026-10-23-six-repairs-regression.md` | 0 | 指定计划 |
| `ls -l reports/all-pending-evidence-20261021/CombinedSixRepairsR1` | 0 | 指定封件顶层 |
| `rg -n '^## \|^### ' docs/collaboration.md` | **127** | rg不可用，改用sed；不安装工具 |
| `cat docs/testing/combined-successor114-regression-review-20261022-r1-report.md` | 0 | 仅设施继承 |
| `head -n 65 <out>/index-r1.json` | 0 | 索引schema，不是只核前65行；后续reader逐1822核 |
| `cat research-guide/SKILL.md`及其`references/research-report.md` | 各0 | 原证/来源/报告方法；没有网络、安装或额外产品要求 |
| `sed -n '/^## 九/,/^## 十、/p' docs/collaboration.md` | 0 | §9 |
| `sed -n '/^## 十一/,$p' docs/collaboration.md` | 0 | §11 |
| Node初始candidate/source/inputs/protection/deps/summary schema查询 | 0 | 输出过大但命令完成；不读其他角色private产物 |
| Node紧缩inputs/protection/deps/lib/close schema查询 | 0 | 改输出摘要，无修改 |
| `cat <out>/executor-source.mjs` | 0 | 全文审执行语义，不执行 |
| Node summary/六报告/12delta/config/receipts/prerequisites查询 | 0 | 原件只读 |
| Node index link/result schema及execution-scripts清单查询 | 0 | 仅指定根 |
| `cat <out>/execution-scripts/2026-10-23-six-repairs-special-after-full.mjs` | 0 | 全文审r2，不执行 |
| `cat <freeze-pkg>/scripts/verify-isolation.mjs` | 0 | 审原默认95与WATCH/退出机制，不执行 |
| Node读取六份明列SOURCE/AUTO报告及SHA/边界行 | 0 | 不扫描其他testing |
| `cat <out>/execution-scripts/2026-10-23-six-repairs-close.mjs` | 0 | 全文审close/seal算法，不执行 |
| `cat <freeze-pkg>/vitest.config.ts` | 0 | 原coverage合同 |
| `cat <freeze-pkg>/retest-probes.test.ts` | 0 | 原7oracle与fixture来源 |
| Node原freeze/tsc/bundle/noEmit/DOM/special/verify/guard/close收据和warnings查询 | 0 | 实际并行时序，不以计划替实际 |
| Node初次读自有attempt1审计 | 0 | 明确not-yet-written，不自填成功 |
| `grep -nE 'handoff\|outbound\|audit\|openRecord\|onCancel\|latestTask' <freeze-pkg>/src/client/panel.tsx` | 0 | 必要实际接缝定位 |
| `cat <freeze-pkg>/src/commands/reflect.ts` | 0 | 指定变更源码 |
| `grep -nE 'freeze\|frozen-before\|REPORT_EXPORT_RED_TMP' <freeze-pkg>/src/core/report-export-excerpts.test.ts` | 0 | 原fixture生成点 |
| `ls -l docs/testing/combined-six-repairs-regression-review-20261023-r1-audit-attempt1.json` | **1** | 异步reader未写完，缺文件保留，不计产品FAIL |
| Node等待并读attempt1审计 | 0 | 审计实际exit1，不改写为0 |
| `cat <out>/execution-scripts/2026-10-23-six-repairs-execute.mjs` | 0 | 包装器全文，发现与executor对象不同 |
| `sed -n '265,320p' /tmp/combined-six-repairs-regression-review-20261023-r1-reader.mjs` | 0 | 编辑前读自有reader |
| Node handoff/pointer/OKR/supplemental原记录及初审结果查询 | 0 | 有些查询输出很大，随后限字段；不据截断摘要替reader全量核 |
| Node读取自有attempt1 `execution.json/output.log/stderr.log` | 0 | 仅自有工具ID，实际outer1；不是其他private runtime |
| Node紧缩观测schema/labels/index/query | 0 | 只读原记录 |
| Node pointer D01/D04/D05/D06及handoff/OKR查询 | 0 | 原HTML/事件较大，改字段摘要，不重执行 |
| Node pointer save/submit/phase、handoff labels及OKR零写查询 | 0 | 只读对应原记录 |
| Node等待并读final审计和自有final `execution.json` | 0 | 11组0、真实exited/outputComplete/outer0，无未决reader |
| Node终报告数量/readerSHA/12replacement查询 | 0 | 实核replace为12，报告已纠正口径 |
| `grep -nE '13次\|真实外层\|原失败审计\|seal' <本前缀-report.md>` | 0 | 修改前读自有报告 |

工具发现memory读取接口未提供可用项目资源，仅发现工具，不访问猜测路径、不拿平台记忆替仓库；execution轮询发现无匹配工具，未调用无关返回工具。所有apply_patch只写本前缀新文件和自有/tmp reader，成功；没有产品、旧testing、plans、livingdocs、原封件修改或删除。

## 资源与停止

attempt1工具ID `fb4c7dca76774ebfb11ce771b357fe89`，PID8242，实际exited/exit1；final工具ID `73e01bd0c0705e658b7cd72ac578a463`，PID9200，实际exited/exit0。string ID与integer轮询接口不兼容，未虚构poll、未重复产品执行，仅读自有真实metadata证结束。seal后本角色released/STOP，不停Main、不操作任何服务/正式进程。
