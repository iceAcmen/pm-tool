# GG 四缺陷与受影响治理独立复验报告

> 2026-10-21，trae，独立测试专家。父授权见 `reports/all-pending-acceptance-execution-20261021.md`，本子任务授权/禁写范围见同前缀 plan。只写本前缀文档、evidence/selftmp；未开发、安装、共享构建、操作服务/GUI/私有配置/凭据或提交。

## 1. 独立判定

**GG-01..04 修后有限 SOURCE/AUTO PASS。** 逐旧 32 ID 仅本报告列出的 AUTO 子断言当前有限 PASS；不是整个 dirty 候选、完整功能门、GUI、真实模型或发布 PASS。Main 的 A6copy/build0、1229/95 作者结果没有用于替代本专家执行或判定。

- 原 expert 冻结源码 + 原 worker 独立复现 **55绿/7产品红/0阻塞**；同最终 13 例 **3绿/10产品红**，外层真实 exit1。四 create 漏来源、clean 链式撤销、mixed used、absence-only Top1 均重现。
- 新源最终轮 `run-2ACog5`：真实领域 **62/62**（含1个 F5 fixture 子断言，故 ID 子断言61），新进程 **2/2**，最终同 hash **13/13**，独立追加副本 **17/17**（13原例+4新负例），23文件 **283/283**，生产 tsc/test 类型/新增类型均 exit0。
- 原15类 verify 的14类原件或仅固定路径适配绿；P0 原件构造器设施 exit1 保留，两处 oracle 纠正自有副本 **28/28**。最终编排外层真实 exit0，全部子命令 exit/argv/stdout/stderr 有原件，未将原设施 exit1 抹除。
- 修后 F6 **10个真实 refs**，四个 create 各真实 dispatch postimage/new ID；标准路径预检、空目标领域完整恢复、生产命令演练零写/非法 schema 拒零写/confirm恢复均 exit0。合法资料/三版进展/两版软删历史保留。
- **32个 GUI 全部 NOT_RUN；真实模型 MAIN_NOT_RUN。** 本人认证条件未请求，不标 MANUAL_PENDING。本轮无新确证产品 FAIL；历史产品红仍保留。

## 2. 冻结身份与独立性

最终候选原证：[run-2ACog5](governance-fix-independent-retest-20261021-evidence/run-2ACog5/)。自有根 `docs/testing/governance-fix-independent-retest-20261021-selftmp/run-2ACog5`。HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`；实际对象是当轮主树源码复制、tracked.patch、新文件清单/指纹，不用 HEAD 替代 dirty。

`candidate.json`、`source-before/after.json`、`tracked.patch`、`new-files.txt`、`production-output.json` 认领输入和自有 tsc 输出。生产源码复制与输入零不一致；自有新增测试是显式设施适配，未写主树源码。`dependency-scope-final.json` 由编译后 ESM 的 TypeScript AST 建102源闭包，并列外部 imports；不把所有可达 import 分支冒称已经执行。

依赖仅只读 `/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`（realpath `/private/tmp/...`）；递归78包/7111输入文件指纹。macOS Darwin24.6.0 arm64、Node v22.23.3、Vitest2.1.9；pnpm11.28.5既有依赖，不 install。环境白名单列在 candidate，HOME/TMPDIR/DSH/文件/备份/缓存均自有根，Vitest `--no-cache --maxWorkers=1 --minWorkers=1`。guard 原件 hash 一致，禁止外写与网络，不是 OS 全盘 sandbox。

最终生产指纹（相对 `packages/dsh-pm-tool/src/`）：

| 文件 | SHA256 |
| --- | --- |
| `commands/ask.ts` | `3db897be1275cbbc2473f73e8eb71bb061365a2ddd882008b33698972905bf26` |
| `core/provenance-store.ts` | `ee3a5051126bc14073beef540627fa2faf5d5585dab8c6d12ddeba4833f3cc00` |
| `core/queue.ts` | `ea816b70b725da12c165ee935f0e311272efd858db2f03f526d169ecf88a8144` |
| `commands/ask-governance.test.ts` | `8d7a71f2b89d1414649caad8e541e350c203cc043816cc91bde89279a50cd7be` |
| `core/tasks.ts` | `c3e0d8a379b5dbbe41331ba42df265711c90a12dbcb8a47955ee70c4d4723fe3` |
| `core/task-materials.ts` | `6188f2bf92910c39ca9933dbdc91af00c597564838a712bd9f3c342ca63289f2` |
| `core/file-asset-store.ts` | `b961bf1f20cb92cc887e36b7a80bbd1b58606840e91e6ae7742c5fa8ab833ac1` |
| `core/file-assets.ts` | `56e98ea6a8943468e69f7bc1a5e89ae6223b0f6d9ff010dee9c1a1a1b8853fc4` |
| `core/backup.ts` | `a4c302bd7646478deb56a61070b4a50262c1b220805f2013a036c2d5b0870295` |
| `commands/backup.ts` | `48369dafe70023bce1ebdf5a82d7b2475627ea6d6b58036187c8845491cf8cdd` |

## 3. 原红、oracle 与漂移处理

首轮 [run-yKDVQA](governance-fix-independent-retest-20261021-evidence/run-yKDVQA/) 原worker完全不改。旧源7红、新源原worker61绿/1 oracle红；新源 clean 命令真实返回“已撤销2项”，但旧断言写死 assignee=undefined，新 addTask schema 的真实首态为 `""`。不要求开发改产品、不把空串当缺陷。最终 `owned-worker.mjs` 只加捕获 originalX，并将该字段断言改为**完整首态深相等**；完整 diff、原/副本hash在 `worker-adaptation.patch` / `adaptations.json`。其余 worker/步骤保留。

首轮 F6路径预检已过，但本专家补充空目标设施漏 `apply(ctx)`，domain未注册，TypeError/exit1。纠正自有 fixture 为真实宿主 commands 注册 + 生产 apply，不手工注册业务领域；首轮失败脚本与 stderr保留。P0两处 `new readdirSync` 原设施失败亦保；P3只将固定 `/tmp/p3a-verify.log` 改自有路径，业务断言不变。

两轮间 Main 的 `core/backup.ts` 从 `8c1342d6...` 变为 `a4c302bd...`：去掉 file_assets 缺段时绕过 task 文件关系校验的条件；`commands/backup-web.test.ts` 同时变动。第二轮重新冻结并完整重测治理、合法历史恢复及 F6新路径/命令，不继承首轮相关恢复结论。`commands/backup.ts` 两轮hash相同，最终补测其路径命令。第二轮全源/依赖零漂移；收尾102源闭包和78包仍零漂移。两轮差异全文在 scope，未修改 Main 成果。

为取得原红外层 observed exit，另用 supervisor跑只读旧 expert 包 [run-Prpg80](governance-fix-independent-retest-20261021-evidence/run-Prpg80/)：原worker55绿7红、same13三绿十红，所有编译类型0，外层真实1。首轮未由 supervisor采外层exit，只保逐子进程exit与已观察执行结果，不事后补造。旧 expert source/worker hash与原 soAcAa一一核对。

## 4. 四缺陷实际覆盖

| 缺陷 | 新源独立断言与原证 |
| --- | --- |
| GG-01 | 四create各从本次已创建实体与dispatch postimage取得实际ID，basis role/版本/fingerprint/项目齐全；F6六update+四create=10唯一refs。旁路任务/里程碑不入账；跨项目、拒步、依赖跳步、四create非法/跳步均零create、只保独立成功任务ref。`F6-created-records/F6-nonempty-ledger/F6-command-observations.json`及same13/extra cases。 |
| GG-02 | 两步与三步同目标逆序，完整JSON含updatedAt/attachments/progressLog精确回首态，磁盘version2.record相等；全clean used=true、重复拒且无task重写/审计追加。仅description外改且不bump时间、仅updatedAt外改均拦全目标链；独立clean目标仍可撤，完整人值不覆盖。 |
| GG-03 | mixed runtime可retry与ledger.used=false一致；重复只处理剩余冲突、已撤clean不重写，audit前缀保持只增。操作者明确恢复完整postimage后合法retry，不由产品覆盖人值；成功后used=true。单次真实JSON写失败、同目标前段失败、末段失败阻前段三分支均保partial、独立可撤、retry只撤剩余并完整回首态。 |
| GG-04 | 真实session absence-only top=null/rest保留；P0仅缺席不抢due，普通mute/critical豁免/quiet/off、迟到5天/rest排序、7天TTL合法历史恢复派生均不退；list/snapshot只读，open仅settings写。 |

`commands-domain.json`每条真实 rawInput/result/完整前后 collectBackup/hash，same13/extra每用例 `cases/governance-case-*/observations.json`及磁盘JSON。没有以mock代替command/repo/JSON；仅故障adapter和单次持久层失败注入受控。新 refs 不扫库补造；产品保全对象postimage比较、同目标阻断与已撤进度，独立负例实际测到未覆盖人值。真实网络、并发CAS窗口、重启undo/TTL外新语义、F13深故障均不扩大。

## 5. 逐旧32 ID

机器逐项 exact probe名称、候选、旧/新状态、未验项见 [id-status.json](governance-fix-independent-retest-20261021-id-status.json)。下面“绿”仅指该行真实AUTO子断言。A=旧受影响集成由本轮新测替代；L=原叶模块冻结范围保留但本轮命令也新测，不凭旧绿搬结果。全行GUI均NOT_RUN。

| ID | 继承 | 本轮 exact green / 未验边界 |
| --- | --- | --- |
| RA-AI01 | A | gateway草稿零业务写/生产parse绑定/10步确认、10refs；台账GUI未验 |
| RA-AI02 | A | 正常标题正文改→changed/needs-regen、history追加/refs不改、跨项目版本防御；GUI未验 |
| RA-AI03 | A | 真实delete confirm/missing两次重校/history原前缀；GUI未验 |
| RA-AI04 | A | baseline/外改依赖拒独立继续/完整链clean/changed/mixed/逐步/13+4负例；GUI未验 |
| RA-AI05 | A | 四actual create refs/白名单/跨项目/unknown/wrapped/资料数组拒、富资料保留；GUI未验 |
| RA-AI06 | L | adapter五故障/abort/乱码/恢复零业务写、无LLM中文错误；真实模型MAIN_NOT_RUN、GUI忙/取消/120s未验 |
| RA-P0001 | A | 真实描述链接/三版进展投影、软删不投、零写；GUI未验 |
| RA-P0002 | A | 窄集/旧标量/branch单独合法/非法字段URL长度日期拒零写；GUI未验 |
| RA-P0003 | A | capture真实草稿/同项目handle确认/新任务来源/坏候选整体拒；GUI未验 |
| RA-P0004 | A | https attach落库与来源、不自动done/javascript拒；GUI未验 |
| RA-P0005 | L | session同对note合并/隔离/schema、新进程原库回读；session不入F5标准包、GUI未验 |
| RA-P0006 | L | metric total/byKind/basis10refs/last/空库0-null及只读；GUI未验 |
| RA-P0007 | A | done单点幂等/有无材料gap/edit/人final/真实反思写失败不阻task；GUI未验 |
| RA-P0008 | L | 五规则边界/叙事非材料/人裁决/只读；GUI未验 |
| RA-P1001 | A | blocked/late5/rest/open设置/absence-only不top；GUI未验 |
| RA-P1002 | A | mute普通/rest/unmute、关键豁免及P2002过期TTL；GUI未验 |
| RA-P1003 | A | 真实本地quiet/off/top空rest保、跨午夜纯函数；GUI未验 |
| RA-P1004 | A | update后snapshot当前progress/零模型调用/只读；旧卡呈现GUI未验 |
| RA-P1005 | A | achieved/accepted L2反思幂等/关联任务、非法交付物拒；GUI未验 |
| RA-P1006 | A | 合法历史标准预检恢复/真实load建议阈值/无伪burnout-WIP；GUI未验 |
| RA-P2001 | L | 三档导出/注入转义/自含静态/源改不随/覆盖confirm；本地打开GUI未验 |
| RA-P2002 | A | 31/29天标准历史恢复/归档/sent/audit只增/TTL；GUI未验 |
| RA-P2003 | L | suggest不建OKR/confirm draft/ignore/repeat/clear保pending异项目；GUI未验 |
| RA-P2004 | L | 单主父/软联不计权重/人confirmed/非法关系拒；全kind关联GUI未验 |
| RA-P2005 | A | 人wrapped不done/不open/不反思/保清单/AI拒；board/people/客观消费链归Main/OP未验 |
| RA-P2006 | L | wrapped真实lesson来源/known-pending-blank/edit/人final；GUI未验 |
| RA-P2007 | L | archive最小包字段/review素材/不写K18 audit/wrapped非done；GUI未验 |
| RA-P3001 | L | habit建议不建档/confirm draft/ignore/repeat/OKR-rationale；GUI未验 |
| RA-P3002 | L | D/D-1/D-2真实checkin/幂等/D+1-D-3拒零写；GUI未验 |
| RA-P3003 | A | 合法14日跨月schema/derive/标准恢复、D-13/-14及D+3断签；折叠GUI未验 |
| RA-P3004 | L | 合法OKR切换/跨项目missing拒/只读聚合/人final幂等；GUI未验 |
| RA-P3005 | L | 两cycleHook disabled/无注册调用/snapshot只读；不要求未批准后台调度，GUI未验 |

原r8/CMP仅保其原冻结解析/DAG/草稿/runtime范围；only5已被后续#22/K2替代，不借旧门签新create/ledger。非前置深故障/分歧并发/设计提议不升本轮门槛；旧GUI终审保原对象，不推当前所有UI PASS。

## 6. 全部命令与结果

macOS + Node22，仓库根执行下列**会新建自有根**的编排；既有证据勿原地重跑业务。最终原执行脚本也在evidence中冻结。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/governance-fix-independent-retest-20261021-supervise.mjs red-only
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/governance-fix-independent-retest-20261021-supervise.mjs corrected
```

外层真实exit：红1，[supervisor-WVUji5](governance-fix-independent-retest-20261021-evidence/supervisor-WVUji5/outer-execution.json)；绿0，[supervisor-LCJRpT](governance-fix-independent-retest-20261021-evidence/supervisor-LCJRpT/outer-execution.json)。补充 `node ...-finalize.mjs` 实exit0；其子命令在 `supplement-commands.json`。每个实际node均附 `--import <selfpkg>/guard.mjs`；完整绝对argv/cwd/环境/起止/exit/signal/hash见各轮 `commands.json`，不凭摘要计数。

| 最终子命令（相对自有package；tsc/vitest为只读deps绝对路径） | exit | 结果 |
| --- | --- | --- |
| `typescript/bin/tsc -p tsconfig.json` | 0 | 生产自有输出 |
| `owned-worker.mjs domain` / `owned-worker.mjs reopen` | 0/0 | 62/62、2/2真实新进程 |
| `typescript/bin/tsc -p governance-typecheck.json` | 0 | 最终原13类型 |
| `vitest/vitest.mjs run --config same13.config.mjs --no-cache --maxWorkers=1 --minWorkers=1` | 0 | 13/13，test hash8d7a... |
| 同vitest `--config extra.config.mjs` | 0 | 17/17 |
| 同vitest `--config units.config.mjs` | 0 | 23文件283/283，完整名单在config |
| `scripts/verify-p0-integration.mjs` / `scripts/owned-verify-p0-integration.mjs` | 1/0 | 原构造器设施保留；副本28/28 |
| `scripts/verify-p1-integration.mjs` | 0 | 45/45 |
| `scripts/verify-p2-integration.mjs` | 0 | 56/56 |
| `scripts/verify-p3-integration.mjs` | 0 | 29/29 |
| `scripts/verify-ask-apply.mjs` | 0 | 归属/幂等/partial/链baseline/逐步 |
| `scripts/verify-provenance.mjs` | 0 | 四链/补偿/并发/脏行/审计 |
| `scripts/verify-provenance-disk.mjs` | 0 | 真实处理器/重启/补偿/审计 |
| `scripts/verify-ai-client.mjs` | 0 | 故障降级/鉴权/限流/中文 |
| `scripts/verify-copilot-plan.mjs` | 0 | 解析/DAG/预算/同目标白名单 |
| `scripts/verify-copilot-plan-cancel.mjs` | 0 | 多步草稿/cancel零业务写 |
| `scripts/verify-copilot-cancel.mjs` | 0 | 草稿/cancel零业务写 |
| `scripts/verify-p2a-export.mjs` | 0 | 26/26 |
| `scripts/verify-p2b-okr.mjs` | 0 | 26/26 |
| `scripts/verify-p2c.mjs` | 0 | 28/28 |
| `scripts/owned-verify-p3a.mjs` | 0 | 22/22，仅固定日志路径 |
| `fixture.mjs` | 0 | F6新标准包、路径预检/空目标恢复 |
| `backup-probe.mjs` | 0 | 生产restore演练/非法schema/confirm、10refs与create postimages |
| `typescript/bin/tsc -p extra-typecheck.json` | 0 | 独立4负例类型 |

不是完整插件95 verify/整包browser bundle/GUI回归；本授权禁止shared build，完整门仍由Main协调与相关专家判定。

## 7. F6交件与收尾

标准UI包hash `c786212c1a5b0023d4a5b8e75b32ed4f4c3dde192b9b0e3901eeb857c1490035`。完整路径、新增字段/ids/expected/合法保留范围见 [GUI handoff](governance-fix-independent-retest-20261021-gui-handoff.md)。包2项目/3任务、四扩展各2、3settings，10refs、file_assets0/reports0；只保合法link/history，不充文件共享字节门或session恢复门。旧缺create F6是历史红证，绝不能用于修后GUI PASS。

最终自有guard写操作与拒外写0、依赖/源码/drift和自有进程为空在 [audit-result](governance-fix-independent-retest-20261021-audit-result.json)。guard是辅助证据，parent只归档授权前缀，不宣称全盘资产扫描。完整索引/终审校验由同前缀 seal追加，不覆盖旧失败。下一步Main将新候选源与fixture hash绑定其运行实例，按原32 ID GUI步骤采原证；本专家不操作GUI、不提交。
