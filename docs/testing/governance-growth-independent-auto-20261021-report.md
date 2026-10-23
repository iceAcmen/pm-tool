# 治理与成长独立有限 AUTO 报告

> 独立测试专家，trae，2026-10-21。父授权及子任务禁止范围见本专家 plan。只写本前缀产物和自有 tmp。没有改产品/他人 testing/living docs，没有安装、共享构建、GUI、服务、凭据/正式根操作或提交。

## 1. 判定先行

**冻结候选有限 AUTO：FAIL，四个真实缺陷，三个 ID 有红。** 独立领域 55 PASS / 7 FAIL / 0 BLOCKED，55中含1项fixture验证，故ID子断言54绿。其余29个ID仅签下表列出的有限AUTO子断言，不签完整功能门。相关既有unit独立复跑283/283；既有15类verify中14类原件/仅路径适配成功，P0原件设施错误保留，最终自有两处oracle纠正副本28/28成功；真实新进程回读2/2。

**全部32个GUI = NOT_RUN，真实网络模型 = MAIN_NOT_RUN。** 尚未收到Main同候选原证，不伪判GUI FAIL或PASS，也不统称本人MANUAL_PENDING。只有确实需所有者本人认证者才条件登记。P2-6 r8/F13深故障/分歧并发/新冲突明细等非前置保持原边界，未表决设计提议不升硬门。

即时发现及有界修复合同：[findings](governance-growth-independent-auto-20261021-findings.md)、[fix-contract](governance-growth-independent-auto-20261021-fix-contract.md)。GG-01/02/03为P1，GG-04为P2，严重度不授权豁免。其余AUTO已独立执行，不等Main新代码。

## 2. 被测对象与方法

主证据根：[soAcAa](governance-growth-independent-auto-20261021-evidence/governance-growth-independent-auto-20261021-soAcAa/)。自有根 `/private/tmp/governance-growth-independent-auto-20261021-soAcAa`。

- HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`；实际是基线后的主树瞬时源码 + tracked patch + 新文件，不假称仅测HEAD。
- tracked patch SHA256 `78f069c50d41a9d75641ac93774fe977d79d983e5905aa4f6752f6c2d64b8726`；新文件清单SHA256 `975249db932073de1214291ccdffbfb164e0ba036d36c974bbf406c4504b054b`。源码及测试原件在`frozen-package/`，原编排在`runner.mjs`，独立worker/guard均冻结。
- Node v22.23.3、macOS Darwin24.6.0、arm64；Vitest2.1.9。只读已装依赖 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，78包递归生产/测试依赖、7111个输入文件指纹；没有install。
- 生产tsc仅自有输出，复制前后源码零漂移、初始指纹与复制内容零不一致。领域生产ESM实际运行依赖经TypeScript AST解析为102个源码文件；不是只凭package version/HEAD判断身份。
- 真实Context、Storage、DomainFacility、JSON backend及生产command。LLM仅通过生产gateway的隔离确定性adapter，真实流→生产parse→parsed深相等→ask-apply明确确认→真实provenance；不读真实key、不网络请求、不seed已apply refs。
- 命令原证`commands-domain.json`含逐次参数/返回/完整前后库及hash；`domain-results.json`含逐子断言与AssertionError；`expected.json`/`commands-reopen.json`另记新进程回读，不用父进程内存充当持久验证。

第一轮保留其设施/oracle问题及冻结证据；第二轮编排被中止、没有完整最终exit，只作问题线索。第三轮`execution.json`完整逐子进程exit；总runner按红/设施错误退出1，不存在“整轮全绿”。补充finalizer退出1是收尾发现真实依赖漂移，不是P0产品失败：其P0子进程exit0。

## 3. 四项真实红

| 缺陷 / ID | 现象 | 真实证据 |
| --- | --- | --- |
| GG-01 / RA-AI05 | 确认10步成功，四create已落库/undo有新ID，refs只含6个update | milestones/m-0002、risk_issues/ri-0002、deliverables/dlv-0002、meetings/mtg-0002各一红；`F6-created-records.json`、`F6-nonempty-ledger.json` |
| GG-02 / RA-AI04 | 同目标s1改派/s2进度成功，无人外改却逆序仅撤1项 | `clean-undo-restores-two-step-original`、`commands-domain.json`；t-0004最初assignee未恢复 |
| GG-03 / RA-AI04 | mixed保人值并撤clean目标，但账本used=true而运行句柄仍可重试 | `mixed-undo.json`；第二次仍进入冲突处理，不是句柄已烧毁 |
| GG-04 / RA-P1001 | 无dueDate的absence-only真实session任务抢占Top1 | `queue-absence-only.json`；top=t-0022、rest=[] |

全部冻结源码hash、真实rawInput、红返回、修复边界及必须保绿负例已在fix-contract。尤其保全对象外部冲突校验；create新ID只从实际dispatch带回；不扫库补造refs，不为mixed一致性烧毁合法重试。

## 4. 逐 ID 状态

下表AUTO均绑定冻结soAcAa，PASS仅指列出的子断言。GUI列逐项NOT_RUN；本人列N=不要求本人参与，C=真实模型认证条件尚未请求。最新主树受影响结果另见§7，不是下表自动PASS。机器逐项结果见`id-status.json`，保每个实际probe名称。

继承码：H1=P2-6 r8原冻结治理范围保留，当前这里独立新测；H2=CMP原解析/DAG/草稿守卫保留其旧范围，only5限制已被#22/K2替代，新实体/来源/撤销不继承；H3=P0-P3旧organizer数不是独立PASS，本轮全为新独立验证；H4=非前置周期占位边界，无后台调度不是缺陷。所有码都不把旧GUI或认证结论搬到当前候选。

| ID | AUTO | 通过子断言或失败点 | GUI | 本人 | 旧证据口径 |
| --- | --- | --- | --- | --- | --- |
| RA-AI01 | PASS有限 | gateway草稿零业务写、parsed绑定、10步真实确认、非空6 refs/五表与版本 | NOT_RUN | N | H1+H2；四create来源归AI05红，不冒充全来源齐全 |
| RA-AI02 | PASS有限 | 正常标题/正文改→changed/needs-regen，refs不改/history追加；真实ref跨项目/版本纯函数防御 | NOT_RUN | N | H1；新真实失效链不从旧空refs继承 |
| RA-AI03 | PASS有限 | 真实delete confirm→missing/manual-review，两次history追加、原refs保留 | NOT_RUN | N | H1；首轮漏confirm撤为oracle错误 |
| RA-AI04 | FAIL | 两步baseline/外部冲突依赖/独立继续/逐步/changed-only绿；clean逆序和mixed ledger红 | NOT_RUN | N | H1+H2；r8 m-4只核runtime、不覆盖mixed ledger |
| RA-AI05 | FAIL | 四create refs各红；白名单/跨项目/unknown/wrapped/资料数组拒与资料历史保留绿 | NOT_RUN | N | H2；#22扩实体不能用旧only5测试代替 |
| RA-AI06 | PASS有限 | gateway鉴权/限流/无adapter/无key/overflow/abort/乱码中文降级、零业务写、恢复；无LLM生产报错 | NOT_RUN | C | H2；真实网络/GUI busy/cancel/120s实测未执行 |
| RA-P0001 | PASS有限 | 生产上下文真实描述/链接/三版进展、软删不投影、零业务写 | NOT_RUN | N | H3；无材料措辞由P0007/8交叉，GUI不继承 |
| RA-P0002 | PASS有限 | 窄集/旧5标量、非法字段URL长度日期拒零写、branch单独合法/非法格式拒 | NOT_RUN | N | H2+H3；纠正采证单branch依赖笔误，不新加规则 |
| RA-P0003 | PASS有限 | capture生产草稿handle/同项目确认/新任务及kind=capture、坏候选整体拒 | NOT_RUN | N | H3；pending非业务写，撤销路径用原支持说明 |
| RA-P0004 | PASS有限 | attach https落库/来源，不自动done；javascript拒；capture evidence落库 | NOT_RUN | N | H3 |
| RA-P0005 | PASS有限 | 同task/session单行note合并/list/notes、跨项目隔离、schema及新进程回读 | NOT_RUN | N | H3；session不由F5备份恢复 |
| RA-P0006 | PASS有限 | total/byKind/basis refs/last逐库核、空项目0/null、只读；既有unit undo/pending | NOT_RUN | N | H3；metric与缺refs账本一致不说明GG01正确 |
| RA-P0007 | PASS有限 | task-done单点幂等、草稿缺口/edit/人final；真实reflections put故障不阻断task保存 | NOT_RUN | N | H3；有界等真实异步落盘，非固定20ms误判 |
| RA-P0008 | PASS有限 | 五规则D-1/D+2/done2of5/无材料/100非done，叙事不充材料、最终由人、只读 | NOT_RUN | N | H3 |
| RA-P1001 | FAIL | 正常严重度/late5/rest/snapshot只读/open设置绿；absence-only top红 | NOT_RUN | N | H3；既有queue19绿漏此真实命令负例 |
| RA-P1002 | PASS有限 | 普通mute/rest/unmute、blocked关键豁免、标准恢复8天/7天TTL过期派生 | NOT_RUN | N | H3；TTL证据在P2002真实生产命令 |
| RA-P1003 | PASS有限 | 实际本地quiet/off、top空rest保留；跨午夜边界纯函数 | NOT_RUN | N | H3；未改墙钟 |
| RA-P1004 | PASS有限 | 正常update后snapshot当前progress刷新、读取零业务写/零新模型调用 | NOT_RUN | N | H3；旧历史卡呈现/入口留GUI |
| RA-P1005 | PASS有限 | achieved/accepted分别L2草稿、sourceEvent/关联/幂等；跨项目/不存在deliverable拒 | NOT_RUN | N | H3；人edit/final与best-effort其他分支参考既有reflect-l2 unit，GUI另验 |
| RA-P1006 | PASS有限 | 标准备份预检恢复D-31/D-8合法历史、负载/建议/烂尾阈值、无burnout/WIP、只读 | NOT_RUN | N | H3 |
| RA-P2001 | PASS有限 | markdown/web/plain真实导出、转义注入/自含静态、源改不跟随、默认拒覆盖confirm成功 | NOT_RUN | N | H3；本地打开web留GUI |
| RA-P2002 | PASS有限 | 标准历史31/29天真实export归档、audit前缀保留只增、业务零改、TTL恢复 | NOT_RUN | N | H3 |
| RA-P2003 | PASS有限 | suggest不建OKR、confirm draft/ignore/重复拒、clear保pending及异项目、跨项目确认拒 | NOT_RUN | N | H3 |
| RA-P2004 | PASS有限 | KR单主父/related软联不计主权重、人confirmed、自指跨项目不存在关系拒零写 | NOT_RUN | N | H3；全kind其他关联仅原29unit实际范围，不声称本probe全D12 |
| RA-P2005 | PASS有限 | 人wrapped不触发done反思、不抹清单；queue/check/load非done/open、stats中性、AI拒 | NOT_RUN | N | H3；board/客观聚合属Main原证及OP分工，不以此签整口径 |
| RA-P2006 | PASS有限 | lesson真实wrapped来源、known/pending/blank、edit/人final/持久 | NOT_RUN | N | H3 |
| RA-P2007 | PASS有限 | archive最小包/字段说明、review周期JSON/素材、wrapped非done、只读不写K18 audit | NOT_RUN | N | H3 |
| RA-P3001 | PASS有限 | habit建议不建档、confirm draft/ignore保留/重复拒、同项目OKR与rationale | NOT_RUN | N | H3 |
| RA-P3002 | PASS有限 | 真实D/D-1/D-2/backfilled、同日幂等、D+1/D-3拒零写/streak不改 | NOT_RUN | N | H3 |
| RA-P3003 | PASS有限 | 合法多月schema/derive/标准预检恢复与回读，D-13/D-14、D+3断签current0保longest/total | NOT_RUN | N | H3；14天/月折叠可用性留GUI |
| RA-P3004 | PASS有限 | 合法OKR切换/跨项目及missing拒、snapshot只读关联聚合、人final幂等 | NOT_RUN | N | H3 |
| RA-P3005 | PASS有限 | 两cycleHookPoint真实enabled=false、无调度注册调用、snapshot零写 | NOT_RUN | N | H4；不要求实现未批准后台提醒 |

## 5. 完整命令与结果

第三轮从仓库运行以下编排命令；编排逐子进程实际argv/cwd/时间/exit及stdout/stderr hash在`commands.json`，HOME/TMPDIR/DSH与文件根均自有。每个`node`子进程前带`--import <自有包>/guard.mjs`。表中路径相对自有包，不建议直接在旧root复跑业务：runner每次分配新root。

运行环境：macOS + nvm Node22；只读既有pnpm11.28.5环境，没有执行pnpm安装或shared build。

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
cd /Users/bytedance/Projects/dsh-pm/pm-tool
node docs/testing/governance-growth-independent-auto-20261021-run.mjs
node docs/testing/governance-growth-independent-auto-20261021-finalize.mjs
node docs/testing/governance-growth-independent-auto-20261021-audit.mjs
```

磁盘现行runner已纠正P0两处new；被测第三轮旧runner仍独立冻结，不能按现行脚本内容改写第三轮失败历史。finalize仅复验冻结soAcAa的P0副本/生成依赖漂移证据，不重新生产业务包。

| 实际子命令 | exit | 结果/覆盖 |
| --- | --- | --- |
| `node <只读deps>/typescript/bin/tsc -p tsconfig.json` | 0 | 生产编译自有lib |
| `node worker.mjs domain` | 1 | 55绿/7红/0阻塞；真实32 ID调用 |
| `node worker.mjs reopen` | 0 | 2/2：全备份字段与session原库内容、新进程undo不持久 |
| `node scripts/verify-p0-integration.mjs` | 1 | 25子断言后首处构造器设施错误，1/26 FAIL |
| `node scripts/qa-verify-p0-integration.mjs` | 1 | 第三轮只改首处，26子断言后第二处同类错误，1/27 FAIL |
| `node scripts/qa-verify-p0-integration-final.mjs` | 0 | 补充两处new纠正、28/28；`p0-final-execution.json` |
| `node scripts/verify-p1-integration.mjs` | 0 | 45/45 |
| `node scripts/verify-p2-integration.mjs` | 0 | 56/56 |
| `node scripts/verify-p3-integration.mjs` | 0 | 29/29 |
| `node scripts/verify-ask-apply.mjs` | 0 | 归属/冲突/幂等/部分成功/链式baseline/逐步持久 |
| `node scripts/verify-provenance.mjs` | 0 | 四链/补偿/并发/脏行/恶意文本/审计 |
| `node scripts/verify-provenance-disk.mjs` | 0 | 真实四链处理器/重启/补偿/审计/幂等 |
| `node scripts/verify-ai-client.mjs` | 0 | 降级换模/鉴权/限流/显式prod与中文 |
| `node scripts/verify-copilot-plan.mjs` | 0 | 解析/兼容/DAG/真环/悬空/预算/同目标/白名单 |
| `node scripts/verify-copilot-plan-cancel.mjs` | 0 | 多步草稿/取消零业务写/仅确认apply |
| `node scripts/verify-copilot-cancel.mjs` | 0 | 草稿/取消零业务写 |
| `node scripts/verify-p2a-export.mjs` | 0 | 26/26 |
| `node scripts/verify-p2b-okr.mjs` | 0 | 26/26 |
| `node scripts/verify-p2c.mjs` | 0 | 28/28 |
| `node scripts/qa-verify-p3a.mjs` | 0 | 22/22；仅固定日志改自有tmp，原件hash及差异冻结 |
| `node <只读deps>/vitest/vitest.mjs run --config qa-vitest.config.mjs` | 0 | 23文件283/283，cache关闭，fork单进程 |
| `node <仓库>/docs/testing/governance-growth-independent-auto-20261021-audit.mjs` | 0 | 630第三轮/640补充原证hash一致，三包hash/32 ID映射核对，自有tmp进程全部退出 |

23个unit文件完整列表在`qa-vitest.config.mjs`及`dependency-scope-final.json.unitFiles`，分别为provenance/store/view、copilot validate/task-fields、ask context/projection/B7、queue/session/capture/evidence/metric/reflect/L2/check/load/OKR/habit/lesson/archive/review/export。它们是真实本轮独立复验，不是复制组织者总数，也不是整个插件全回归/GUI门。

## 6. 合法 fixture 与交件

三包都经生产createBackup、生产precheck；F5另由生产restore到空target，完整备份范围深相等。JSON与包内文件已归档；`*-fixture.json`原path指向自有根，归档副本按同basename取值，不能误把路径本身当内容。各包hash：

| 包 | SHA256 / 实际内容 |
| --- | --- |
| F6 | `34ffafca245edf48f16a1d0b22da532bbb53e5374327c7bdc6c551aaa1affe3d`；2项目/3任务/四扩展各2/3 settings，真实确认非空ledger，旧source尚未改删，保GG-01真实缺refs |
| F5 | `f58bc05c5c95e262eceda4cedd108488e35f3b98d346c8fe39833dd8c2acf56a`；6项目/23任务/四扩展各2/10 settings/4反思/5 OKR/1 lesson/2habit |
| F7 | `96f081c846459539a18cb416527a3092137d73a6e9b7d56d7a35ad099db22011`；与末态F5同领域内容，含14日跨两旧月、多连续段与断签期望 |

F5生产EXTRA_BACKUP_TABLES不含sessions，file_assets为空且没有F4共享字节；不是总register“全表/字节”验收的替代。session真实bind/notes/schema与原库新进程回读另交；不能seed sessions到标准包绕白名单。报告表为空，不声称汇报生成/私有session来源门已验。合法历史经过schema和标准恢复，不绕checkin两天写窗，不改系统Date。

`F6-gateway-draft.json`、`F6-nonempty-ledger.json`、`F6-created-records.json`、changed/missing重校原证，`ids.json`、`expected.json`、`F7-expected.json`以及[Main GUI最小采证单](governance-growth-independent-auto-20261021-gui-handoff.md)均齐全。Main按原32ID步骤采证，不新增页面/用例，不人工补来源。

## 7. 漂移、继承与复验范围

本轮执行时主树仅`client/shared/task-draft-materials-stage.test.tsx`漂移，冻结副本和生产输出不变。收尾13:33:57Z再查发现三个**实际领域依赖**漂移：`core/tasks.ts`、`core/task-materials.ts`、`core/file-asset-store.ts`；客户端draft材料组件/测试也变，但本专家没跑GUI，不能签其正确。`dependency-scope-final.json`逐文件含被测与收尾hash，78只读deps无漂移。

封存审计13:39:10Z另见`core/file-assets.ts`及其test漂移；生产资产校验也在实际运行依赖链。后续观察完整hash与相对冻结包diff另保在`source-final-observation.json/.patch`，审计元数据在同前缀`audit-result.json`。这是Main已授权在途修复观察，不伪称已经测试新代码；资产/附件范围需对应分工复验。

| 变化/边界 | 受影响范围 / 继承处理 |
| --- | --- |
| task add/update统一prepare/publish与持久写补偿 | 新候选任务创建/修改/确认/capture/attach/reflection触发及业务fixture写旅程需要复验；AI01..05、P0002..04/P0007、P1004..05、P2005的当前集成结论不从旧包继承 |
| material ops alias、addFile与最终ref解析；file事务补偿 | P0001/AI05资料投影/保留及任务material写接缝、附件分工F4/F5字节测试受影响；本专家F5无file资产不充字节门 |
| queue/provenance/copilot/OKR/habit/check/load/export等叶模块未变 | 其有限纯函数/既有unit断言可保冻结结果，依赖一致者可用于复验缩围；生产命令/完整旅程仍需按新产物绑定，不笼统把整32ID标当前PASS |
| r8 m-1/m-2/m-3/m-5 | 原冻结代码/单测结论保留；此处独立复验四链与unit，不因GG-01缺createID推翻“不收未applied”方向。完整历史diff无法由本轮HEAD替代，不整门继承 |
| r8 m-4与CMP旧门 | 只保已覆盖runtime烧句柄/解析/DAG/取消范围；mixed ledger、链式clean undo现已红，受影响断言重开。旧only5被有效后续合同替代 |
| 旧GUI、Token/G3终审与本人条件 | 保它们原冻结对象，不重开无关终审，也不推导当前新卡/来源/四消费点全PASS；待Main同候选证据 |

收尾finalizer因此exit1，`id-status.json.currentInheritance=REVIEW_REQUIRED`不掩饰新依赖变动。这不是要求Main停所有修复；它明确继续有界修GG和已授权文件接缝，稳定新快照后重跑受影响AUTO与四红，再由Main交GUI。源代码存在/作者绿数/Main bundle与本专家冻结tsc均不能互相代替。

## 8. 写根与证据审计

第三轮guard记录3838次文件写操作，全部自有root，拒绝外写尝试0；P0补充guard另有逐PID写审计且外写0。首轮P3固定`/tmp/p3a-verify.log`尝试被拒、未实际写；后续仅路径适配，不以“尝试拒绝”说成污染。guard是进程级辅助，不宣称OS全盘sandbox；parent归档仅写授权前缀evidence。

`evidence-files.json`锁第三轮归档，`supplement-evidence-files.json`锁补充原证及finalizer，不互相覆盖旧失败。同前缀`deliverable-index.json`锁全部本专家交件（索引自身除外），含最终报告、合同、GUI步骤、脚本和证据；`audit-result.json`记检查退出0及自有运行进程为空。源码/脚本/标准包都有hash；没有改产品、停止/重启正式进程或读取认证材料。后续仅允许本任务范围内复验与审Main原证；未获独立结论前GG仍开，禁止借本报告发布/提交或宣布全积压验完。
