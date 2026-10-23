# F02 related28 独立设施补证 R3

> 2026-10-23，trae 独立 AUTO 补证专家；非开发、非 GUI。最终判定见本报告与 `audit-final`，早先错误汇总原样留存。

## 1. 有限结论

**AUTO28：PASS_LIMITED_AUTO28。原 9+28 自动化子门：可有限关闭。**

本角色仅独立执行原 related28，四个文件 suite 全部通过，原 28 个用例名称、断言及 oracle 不变；真实 Vitest 子终码 **0 / signal=null / error=null**，stderr 空，`success=true`，没有失败、跳过或 todo。仅执行一次产品测试，绿后没有重复。

合并依据为未变字节的 [R2 SOURCE/DOM9 有限 PASS](f02-option-default-source-auto-20261023-r2-report.md) 加本次有效独立 related28，不是重新执行或重签 DOM9/SOURCE，也不是新的合并37运行。**R2 原37断言绿、四文件 afterAll EEXIST、真实exit1与 `success=false` 全部保留**；不能将其历史执行改写为exit0。

原 F02 **FAIL_LIMITED_GUI** 保留；修后 GUI **NOT_RUN**、原后台保存链 **NOT_REACHED**。不签 F02 整项、B8、父整门、普通 commit 或任何发布动作。

## 2. 派单与停止条件

负责人本次原句：

> 你是独立AUTO补证专家，非开发/GUI。父goal全部已实现未验独立收口直到普通commit，无新增暂停功能/push/release/正式切；Main唯一builder/GUI。唯一子单：补原F02 related28有效独立执行，原SOURCE与DOM9已由docs/testing/f02-option-default-source-auto-20261023-r2-report.md有限PASS，不重跑或重签9，也不抹原37exit1。R2原所有37断言绿但identity-afterAll重复wx写同文件导致四relatedsuiteEEXIST；这是自有runner设施，不是产品FAIL。Main prior'一次必要测试后停止'现明确允许修本设施后原28必要补证，失败推动修设施而非无故反复绿。只跑records-options8/records-payloads11/records-history3/form-validation6四test28，同原源；这四为纯函数无需ReactDOM/identityafterAll，切独立纯组不加载DOMsuite/identitysetup即可，不改oracle/产品/依赖。只读新2文件/原17输入和四声明依赖，source5059SHAaeb3d15125ad311f335cfb09d348c0402b9925da9d4979df8b2ceb402725275f、test10641SHA841e3fa0591c7a83213572650a73d7c63cf277e50e1ecf56197e8c0e58cc6057。开发包F02OptionDefaultDevelopmentR2原109/封same，仅引用原SOURCE/DOM9；自己隔离inputs/config/cache/home/tmp/output，四声明现有依赖只读链接，不install/build/noemit/full/allverify/GUI/服务/Git/privatefreeze/runtime/凭据/spawn、不执行Main或旧专家runner。允许自编runner/收据器spawnSync Vitest+语法检查收真实argv/cwd/env/子exit及stdout/stderr/result，源/依赖前后SHA；任何设施失败保原件，诊断并最小补跑受阻项直到原28有效，绿后不重复。唯一仓库新写docs/testing/f02-related28-infrastructure-retest-20261023-r3*及自有/tmp，其他所有路径只读。原R2专家仍封自身报告，不改其所有文件。显式子单替通用fetch/pull/build/livingdocs/git收尾。输出有限AUTO28 PASS/FAIL/BLOCKED与是否结合R2源/DOM9可关闭原9+28门，绑定精确源/原报告SHA及新执行seal；GUI仍旧FAIL/新NOT_RUN。报告/真实命令receipt/audit/seal；完成资源释放STOP通知Main，不追加B8/整包或新门。

本子单替代通用 fetch/pull/build/全回归/livingdocs/Git 收尾。已读 AGENTS；未加载 vendor skill，未执行 Main、开发或旧专家 runner/seal。仓库新写仅本 R3 前缀，其他写入仅自有 `/tmp`。

## 3. 精确绑定

| 对象 | bytes / SHA256 |
| --- | --- |
| 真实 `records-listbox.tsx` | **5059 / `aeb3d15125ad311f335cfb09d348c0402b9925da9d4979df8b2ceb402725275f`** |
| 原 DOM test，仅指纹引用、不执行 | **10641 / `841e3fa0591c7a83213572650a73d7c63cf277e50e1ecf56197e8c0e58cc6057`** |
| R2 SOURCE/DOM9 原报告 | **8882 / `19d6ede7cee232c7ee992a867f3193ac952e44f2a6b0d653a1815854716f3d32`** |
| R2 原37执行及exit1 | 379823 / `1c9cba8b2d3c04c187efa06356aefd89f383dbb9c968f47622a115eb0ac59d57` |
| R2 原 auditseal | 621051 / `ce324cdffd2d3432f9f654881199c67d37cbfe45cad25aed773ac8271860a8d1` |
| 开发原 index109 | 18102 / `e9c9e524aac3f63ccc32c4618994d0c9979b68dcd18a3a8f018b44a4520b34c5` |
| 开发原 seal | 1021 / `d6be7f26220aad8e23befd7cdb0d1143c88fb3d48e9e8936465a8fedfcd4a49f` |
| 本次真实 Vitest 命令收据 | 7121 / `942941de63c92848a17cc7982abc7ed121c9b647f3e64018f12b2f4782b1a049` |
| 本次原始 Vitest JSON | 12297 / `cbf0dad411e76eab1a81c85b5702e2b319c853393f4a785c92d59acb01690162` |

开发包原109/封same仅引用 R2 独立核验，未重审109件或525整包输入；本次实核 index/seal 与 R2 指纹绑定，以及原 related/source 17份与真实17输入、隔离副本同字节。基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅为原封件声明，未执行 Git，不拿 HEAD 代替候选。

## 4. 独立执行

环境：macOS arm64/bash，绝对路径 nvm Node **22.23.3**、既有 Vitest **2.1.9**；pnpm11.28.5仅项目口径，未调用。四项既有依赖为 React18.3.1、ReactDOM18.3.1、JSDOM25.0.1、Vitest2.1.9，只读链接。前三项只作声明依赖指纹，不预加载 ReactDOM/JSDOM。

隔离根为 `/tmp/f02-related28-infrastructure-retest-20261023-r3-independent-7c914a`，inputs/config/cache/home/tmp/output 均独占。只复制原17输入、保留内容只读；新 Node config 精确 include 四个文件，`setupFiles=[]`、`globalSetup=[]`、singleThread、retry0、优化器关闭。不加载 DOM suite 或 identity setup，不改产品/测试/oracle/依赖。

| 原专项 | 用例数 / 文件suite / 子终码 |
| --- | --- |
| records-options | 8/8，passed |
| records-payloads | 11/11，passed |
| records-history | 3/3，passed |
| form-validation | 6/6，passed |
| 唯一 Vitest 执行 | **28/28，4文件passed，exit0，stderr空** |

Vitest JSON 的 `numTotalTestSuites=16` 包含 describe 组，不是16个文件；`testResults` 恰四文件，`numFailedTestSuites=0`。每个原用例 fullName 集合与 R2 相同，无删改/重命名/skip/todo。真实 argv/cwd/env/pid/开始结束时间/子exit/stdout/stderr/result 完整见 [校正执行收据](f02-related28-infrastructure-retest-20261023-r3-execution-reconciled.json)；完整命令与外层真实终码见 [命令审计](f02-related28-infrastructure-retest-20261023-r3-command-audit.md)。

## 5. 自有设施异常与最小修正

R2 的设施问题以纯组隔离消除：不执行 DOM suite，不注册 identity afterAll，无需更改或覆盖 R2 自有脚本。

R3 一次 Vitest 真实通过后，自有 wrapper 将依赖变量 `vitest` 而非 `receipt` 写入 `execution.vitest`，后核读取缺失exit字段，第一次 finish **真实exit1 / BLOCKED_INFRASTRUCTURE**。原始 `vitest-command.json` 已由 spawnSync 单独写入，真实exit0和原始stdout/stderr/JSON完整；不是产品FAIL或测试重跑需求。

原 [错误汇总](f02-related28-infrastructure-retest-20261023-r3-audit.json)、[错误wrapper](f02-related28-infrastructure-retest-20261023-r3-execution.json)、自有 runner 与原/tmp文件均不修改。新增自有收据校正器，仅读取独立原始收据、校验实际argv/cwd/env/exit及原28结果/指纹，保留旧字段为 `vitestDependency`，将原始收据写入新的 `execution-reconciled`。校正器语法检查exit0、reconcile真实exit0；没有再次运行产品测试。

## 6. 审计、封存与交 Main

[最终审计](f02-related28-infrastructure-retest-20261023-r3-audit-final.json)记录 **684** 个保护对象：真实17输入、封件related副本17、四声明依赖641、R2六证据文件、开发index/seal、自有runner；前后全部SHA相同，17隔离副本全同，依赖成员与软链目标全同。不是全仓库/全node_modules/全机/private runtime零污染证明。

[新执行 seal](f02-related28-infrastructure-retest-20261023-r3-seal.json)绑定精确源/原报告、R2 exit1、本次原始子收据/结果、R3旧设施错误与校正后的全部报告/审计/自有输入和工具。seal自身及随后 [真实封存工具收据](f02-related28-infrastructure-retest-20261023-r3-seal-tool-receipt.json)不循环自指纹。

**released / STOP。** Vitest唯一子进程及三次必要语法检查均已同步返回，无遗留本角色执行会话；未持有builder/GUI/服务/端口/profile/数据锁，隔离证据目录保留，不删除原件。通知 Main：原9+28 AUTO子门可按本精确字节组合有限关闭；Main继续父单原有GUI及其余独立门。本角色不追加B8/整包/新门，不commit/push/release/正式切，也不暂停无关已授权父工作。
