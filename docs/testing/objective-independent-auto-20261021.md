# OP 独立 AUTO 有限审签

> 给 Main、负责人和接手专家使用：已有 OP/RA-OP 的独立领域执行、缺陷与 GUI 最小交接。2026-10-21，trae 独立测试专家；不修改产品，不替原计划回填，不是 OP 整门 PASS。

## 1. 结论

**AUTO/领域/源码子项：52 PASS、3 FAIL；OP 整门未通过。** 57 个原精确 OP ID 和 RA-OP01..06 均已在 [逐 ID 签字索引](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/case-disposition.md) 登记，JSON 附执行时间、原始动作区间及最小未验边界。数字仅为本次独立断言行，绝不等于 57 个原 ID 全过，不含作者 verify 总数。

- 领域可闭部分有限 PASS：清单三键/旧库兼容、父子互斥、真实命令单项 CRUD、目标态重试零写、分歧并发、真实 JSON 发布 EIO 失败、叶子/父/项目派生、100/1000/10000 深树计数、环/缺 ID/跨项目防御、doctor 零写、新旧 report/diff、备份/JSON 内容往返、新 Node 进程重开。
- ADL-055 双轨有限 PASS：人工 30 与 0 不污染 objective，清除后有清单回落 50、无清单回落 null；工时 3.5 不变成权重；completedDate 本地当天/显式值/revert；wrapped 不入覆盖/pending/done/open/queue/check/复盘，改回 todo 后重新纳入。
- GUI 未执行：OP-SRC-06、OP-GUI-01..03、RA-OP01..05 的实际表单/取消/四消费点及其相关原 ID GUI 断言均未签 PASS。Main 有执行能力，不能自动转 MANUAL_PENDING。
- OP-BD-01 仅新 Node 领域进程读回 PASS，仍缺真实 dsh 宿主精确 PID 停起。OP-BD-05 正式根保护清单、OP-BD-06 Main build/full guard 本轮未执行/未代审，保持 NOT_RUN。

## 2. 三项缺陷

| 缺陷 / 严重度 | 独立事实与依据 | 最小修复 / 受影响复验 |
| --- | --- | --- |
| OP-AUTO-DEF-01 / P1；OP-SRC-01 SOURCE FAIL | `src/client/panel.tsx:808-812` 只筛选/排序原始 task，直接传 TaskTable/Overview。`src/client/views/tasks.tsx:769-783` 直接用 legacy `t.progress` 画条/编辑值，非空旧 `progress` 令无清单任务也不显证据不足；`overview.tsx:171-179` 对含中间层/无清单的 kids 另算 legacy 平均并对 done 阶段写 100，未接客观真源。F2 L1 客观50/旧手填40；P客观63，而当前 overview 的 P kids legacy 平均 `(0+40+0+40)/4=20`。依据原 OP-SRC-01/06 与当前补充 §1/§2。 | 已有列表/树/总览接回 objective+coverage 与明确人工 mode，不新增 U4。重验 OP-LEG/DV/RU 的展示、OP-SRC-01/06、RA-OP01/02；四页 GUI 原证仍须 Main。 |
| OP-AUTO-DEF-02 / P1；OP-SRC-05 SOURCE-manual FAIL | `src/client/views/gantt.tsx:109,324-330` 仅 `progressFill(progressMap.get(t.id))`，没有读取人工 meta/display/mode。纯函数已证明清单40 + 人工70时 objective40/display70/manual；渲染路径却仍填40，不区分人工。依据 ADL-055 display 规则与补充 OP-SRC-05 明确三 fixture。 | 甘特现有显示按双轨合同接线，客观值仍保真，不改完成语义。重验 OP-SRC-05/06、RA-OP01/02 与日期拖动零无关写。 |
| OP-AUTO-DEF-03 / P1；RA-OP04 AUTO-protocol FAIL | 新独立合法 leaf 经真实 `handleTaskCommand` 执行 `update <id> {"evidenceUrl":"javascript:alert(1)"}` 返回 `kind=success`，原 task 的 evidenceUrl 从缺键变成该值，已落盘。`src/core/task.ts` evidenceUrl 仅 string/trim/max2048；`client/form-validation.ts:170` 却要求 http(s)。依据 RA-OP04 非法协议负例与 collaboration §11.4 输入通道同等级校验。 | 统一既有写入口的协议校验，保旧记录读兼容；本项不是历史旧键迁移或 Git 自动同步需求。复验 RA-OP04 合法/负数/非法协议/超长与零写、OP-BD 旧记录备份兼容；不声称已证明 XSS 执行。 |

实际来源指纹与行段在 [source-consumers.json](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/source-consumers.json)。失败堆栈在 stderr，非法协议前后 record 在 [domain-results.json](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/domain-results.json) 对应动作行。本专家未修产品；轻微/严重度不自动豁免。

## 3. 候选与隔离

- 候选：`reports/all-pending-evidence-20261021/A3/candidate.json`；baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，product base `2a7603023bc54ef13d788e50069ee3fde4671bf3`，包 0.7.4 + dirty 差异；不拿 HEAD/version 代替候选。
- A3 的 23 个声明文件在 Main 隔离树逐项 sha256 相符，tracked patch SHA 相符；A0 `all-built-files.json` 453 个产物逐项相符。执行的是这些字节的自有副本，不 build，不写共享 lib。完整 binding 在同级 `candidate-binding.json`。
- 输入 1979 文件（合同、候选、全部隔离 src/scripts/lib/locale/声明、实际运行依赖闭包 14 包、执行器，含命令静态导入的 dsh-llm 类型接口闭包）前后 sha256/大小/mtime 全同；副本冻结文件也无变更。审签 audit 再核所有输入当前 sha256，未用 bundle mtime 推断装载。
- macOS Darwin 24.6.0 arm64，Node v22.23.3。pnpm 未运行，项目约定 11.28.5；无安装/构建/宿主/浏览器步骤，不读认证、不启服务、不改 clock。
- 自有根 `/private/tmp/objective-independent-auto-20261021-9dg1J5`。HOME/TMPDIR/DSH_HOME/PM_STORAGE_ROOT/备份/文件/导出隔离开关均显式指向该根，子进程采用新环境白名单，不继承 API Key/认证变量。生产 domain 直接 `facility.open(pmDomainSpec)`，不是模拟业务表；命令走真实 task/doctor handler。
- 测试子进程写根保护按 realpath 检查，并禁网络/listen/fetch；1367 条写操作审计 outside-own=0。它是测试设施保护，不冒充 OS sandbox，也不声称读取了正式资产 before/after。正式 data/profile/服务未操作。
- F2 每条 task 通过生产 schema；L7 `[]` 经标准备份预检/applyBackup 导入自有库。异常环/缺 ID/跨项目仅进纯函数，未导入生产 domain。所有破坏性恢复仅自有 disposable 库。

## 4. 命令与原证

环境 macOS + Node 22.23.3；完整 argv/cwd/白名单 env/stdout/stderr/exit 与各日志 SHA 在 [commands.json](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/commands.json)，逐行 payload/返回/读回在 domain/reopen-results；测试证据 SHA 在同级 `sha256-index.json`。最终审证命令另存 `audit-command.json`、`audit.stdout.txt`、`audit.stderr.txt`；包含这些原始输出的最终封存指纹是 `closure-sha256-index.json`。

| 命令（所有 child 的 cwd 是自有 `packages/dsh-pm-tool`） | exit / 结果 |
| --- | --- |
| `node --import <自有包>/guard.mjs worker.mjs domain` | 1；51 PASS、三项上述 FAIL；EIO 警告为已断言的预期负例，不是第四项缺陷 |
| `node --import <自有包>/guard.mjs worker.mjs reopen` | 0；新 Node PID 与原 PID 不同，task 全字段及 derive Map 一致，1 PASS |
| `node --import <自有包>/guard.mjs scripts/verify-objective-progress.mjs` | 0；作者既有27组仅辅助回归，未用于逐 ID 签字计数 |
| `node docs/testing/objective-independent-auto-20261021-audit.mjs objective-independent-auto-20261021-9dg1J5` | 0；输入/日志 SHA、行级结果、F2 包、写根审计及57+6 ID登记一致；非产品 PASS |

仓库根复现入口（不依赖 nvm shell加载，不安装）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/objective-independent-auto-20261021-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/objective-independent-auto-20261021-audit.mjs objective-independent-auto-20261021-9dg1J5
```

第一条会另建自有 tmp，确认 frozen 字节后运行；当前缺陷存在时总 exit1 是正确结果。再次执行后审签第二条应改为新证据目录名。没有执行未知全 verify、verify-task-meta、full guard、vitest、build/install。

五轮历史保留：`1KQQJu` 的自有 guard 日志递归造成设施失败，不能判产品 FAIL；`Rhq82s` 领域51/3、table.put前故障有限证据；`JID1P6` 改为真实 JSON publish EIO 与 summary/check；`5003Yo` 再补真实 renumber 后结果确定。前四轮依赖指纹仅8包，未覆盖命令静态导入的 dsh-llm 接口依赖；最终 `9dg1J5` 完整14包再跑，产品结论仍51/3加新进程1 PASS。以最终逐 ID 签字，不累加重复用例、不补造前轮完整指纹。

## 5. Main 的 F2 最小交接

推荐 Main 在**另一个确认空的自有隔离库**用现有标准恢复入口恢复 [f2-backup.json](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json)，同目录保留 `f2-backup.json.files.<bundleId>/manifest.json`。已生产预检 + restore 成功，无 file_assets；GUI 内容恢复也已通过同数据通道。**不能覆盖 Main 当前 QA-A 或其他在途库，更不能恢复正式库。** 不复制旧认证；候选/合法入场/快照/开关由 Main 另行认领。

完整真实 ID、日期和逐条生成命令见 [f2.json](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2.json)、同级 `f2-commands.json`。后者 ID 为该空库返回值，不可向已有库盲重放；不用备份时按相同 add/checklist 流程另建 QA-OP 并保存新 ID 对照。

| 对象 | 初态 / expected |
| --- | --- |
| `p-0001 QA-OP` | 10任务；todo7/done2/wrapped1；open7；状态完成率20%；客观项目66、覆盖4/7、pending1。两种百分比不可混为一谈。 |
| P=`t-0001`、M=`t-0002` | P客观63、覆盖2/3，标题“已覆盖任务清单完成度”；M63、覆盖2/2。P legacy100不进客观。 |
| L1=`t-0003`、L2=`t-0004` | L1清单1/2=50、legacy40；L2清单3/4=75。L1有合法今日起/后两日截止，可直接验证甘特。 |
| L3=`t-0005` | 无清单 legacy40，objective/display=null；必须证据不足，原手填40旁注。 |
| L4=`t-0006`、L5=`t-0007` | L4 todo清单4/4=100且pending；L5 done清单2/5=40、软告警，无自动补勾。 |
| L6=`t-0008`、L7=`t-0009`、L8=`t-0010` | L6 done无清单legacy80仍null；L7合法[]仍null；L8 wrapped1/1自身100、不入项目覆盖/pending/催办。 |

GUI 按原计划执行，每个变体用 fresh 恢复副本或真实动作还原，分别留 payload、主提交点、截图/录像、快照及磁盘回读：

1. 打开项目“任务”→L1“编辑”；人工设定30 + 来源备注→主“保存”→重进。客观块50（1/2）、人工徽标30；人工0仍须可见。四消费点 mode/display 应按合同一致，项目客观始终66。
2. 同抽屉“清除人工设定”→主“保存”：回落50；L3人工40→清除→保存后证据不足。另独立执行清除后“取消”，确认库零写；不能把 draft 变化当已保存。
3. L1勾第二项（UUID见 f2.json），按实际入口提交：客观100/status仍todo；P88、项目79、pending2；只修改目标清单及其合法updatedAt，不改legacy/status。原计划四页即时一致需真实采证。
4. RA-OP03 独立分支先真实 `/pm task move t-0010 t-0001 confirm` 把 wrapped L8挂P：P仍63、覆盖2/3。再 L8 status→todo 提交：P75/覆盖3/4；项目73/覆盖5/8、pending2；todo8/open8/wrapped0/done2，不自动验收。
5. RA-OP04 工时3.5/合法链接→保存/重进/JSON导出；负工时、非法协议分别提交看中文拒绝及零写。RA-OP05 L1→done显本地当天→revert清除，旧L6不补历史完成日期；日期展示只读。不得用修改 clock 造完成日期。
6. 四页/390、甘特三 fixture（40/null/manual70）、旧库只浏览、真实宿主重启由 Main 继续。原证齐备后专家审签；当前源码/领域 FAIL 必须先修复、重新认领受影响候选与回归，不能因本报告 AUTO 多数通过开 U4/新功能或发布。

## 6. 写入边界

仅新增/更新 `docs/testing/objective-independent-auto-20261021*` 与自有 tmp；原 OP计划、总登记、他人 testing、living docs、产品/依赖/共享lib未更改，无 commit/push。Main 负责将本报告引用到其协调记录；本专家不越权修改。
