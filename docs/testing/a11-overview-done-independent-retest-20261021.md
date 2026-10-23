# A11 总览状态完成卡有限独立 SOURCE/AUTO 复验

> 给 Main、负责人和接手专家使用：绑定本次冻结候选，只签 A10-OP-G01 本地状态完成卡源码与自动化；不签 GUI、整项 OP 或发布门。平台 trae，独立测试角色。按20261021派单命名，实际执行2026-10-21 16:12–16:15Z，macOS本地已跨日。

## 1 结论

**SOURCE / AUTO：PASS_LIMITED。** 在指定范围内未发现新的产品缺陷。原F2的上方真实 `Overview` 完成卡、同页下方真实 `completionHero` 模板及真实 `collectStats` 同集合均为 **done2/10=20%、wrapped1独列、open7/10**。人工30/0/null及清单100/50均不改变状态完成率。

**原 A10-OP-G01 GUI FAIL 保持开放，本报告不关闭它。** 新源码/组件自动通过不是新build/实例/原图，更不是OP、B8全门或发布通过。

| 范围 | 本轮结果 | 边界 |
| --- | --- | --- |
| 局部状态卡源码、实际根因、war-room保持 | PASS_LIMITED | 新旧真实源码及局部hunk匹配；不全改共享语义 |
| 作者原10项复跑 | PASS_LIMITED | 真实Overview和原F2，不以作者口述代实跑 |
| 独立追加17项r2 | PASS_LIMITED | 真实上下卡、统计、合法subset/父子/状态/逆反 |
| 受影响回归11文件78项 | PASS_LIMITED | 包含前27项，不能相加称105个独立用例；既有测试警告保留 |
| GUI / 页面样式 / UX / 持久化旅程 | NOT_RUN | 本单明确不执行、不签字；Main随后补采 |
| 整包build / 全部verify / 宿主与实例 | NOT_RUN | Main唯一builder，不继承作者旧轮为本专家门 |

## 2 根因更正，保留历史和缺陷 ID

保留 **A10-OP-G01** 和原期望20%；未修改原专家文件。原报告“错误包含wrapped”是历史归因，本轮以真实源码/原F2补充更正：

- 旧谓词：`status === 'done' || (progress ?? 0) >= 100`，旧卡计数与`kpi.doneRate`均沿该口径。
- 原F2旧完成ID实际是 `t-0001 / t-0007 / t-0008`。额外项为 **t-0001 / F2-P / status=todo / legacy progress100**；原wrapped是` t-0010 / F2-L8 / progress0`，不是这次额外完成。
- 新卡只认`status === 'done'`，分母为当前传入tasks长度，整数四舍五入，空分母0；计数、文案和条宽同源本地`doneRate`，不再消费`kpi.doneRate`。
- 独立逆反没有避开P：只将P legacy100→99，真实旧KPI30→20，新上下卡均20；只将原wrapped legacy0→100，真实旧KPI30→40，新上下卡仍20、wrapped1。后者是反证，不是原F2根因。
- `war-room`旧KPI/议程、团队历史谓词、无主提示不在该卡合同内，保持原样。不能用它们旧口径继续存在否定本卡修复，也不扩为其全局质量通过。

[独立源码审计](a11-overview-done-independent-retest-20261021-selftmp/source-review.json)记录旧源码、真实ID、作者红/绿/回归原argv与逐用例结果。本专家从原红源码→本次冻结Overview重新生成的[局部patch](a11-overview-done-independent-retest-20261021-selftmp/independently-derived-local.patch)与作者owned patch去除两行路径头后完全一致；作者完整src红→回归只有overview变化，原作者OP阶段改动不混入本次局部hunk。

## 3 候选认领与隔离

基线 `HEAD=origin/main=9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，只作基线，不代表dirty候选。未fetch/pull或清树，未提交/推送。当前完整380个src、18个新增src清单、171546字节tracked fullsrc patch、依赖声明/lock/tsconfig和原F2已冻结；完整见[candidate.json](a11-overview-done-independent-retest-20261021-selftmp/candidate.json)。

| 输入 | SHA256 |
| --- | --- |
| 修后Overview | `7b5076ec60f667bc0190eea5d055e055c6cd3d40d266065943b7c227a339266d` |
| 作者新增真实组件测试 | `8ed1ca262d6f9ccf586636da39515e6acef59fe235d05a5bb51d1471005d06a7` |
| war-room | `9fd95d54e68aed0b25463a66cbee879f389b705768269912df80aaa23dd16db2` |
| 原F2备份 | `451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b` |
| 原F2消费fixture | `ec25f42d12190f509c32a78f760c21fcc817afcedb45ea33039436c17b03c22f` |
| 全src内容manifest摘要 | `961b32f236e5ea60f79d85ccaf85cb0c1b81169521e34e08222775a568e2d791` |
| tracked fullsrc patch | `8df02524cd32fe9c8aa3a9c066226e0aea4d081e7f1353e095fc677d5311bf31` |
| 独立r2测试 | `c7d075168fb3ec8ea319aee83e162d0147522078b231fe5d8c57e2fb09804a60` |

war-room与HEAD原字节、作者red/regression manifest、本冻结副本一致，未改core。主树当前Overview与作者修后SHA一致。原专家A10报告SHA`706d24fa46ba211d9048a1f51c9434ada0f4374d8ad1d0e69e1639dbc2560773`未变化。

运行环境：macOS/darwin arm64，Node v22.23.3；React/renderer18.3.1、Vitest2.1.9、TypeScript5.9.3、zod4.6.5。pnpm11.28.5是项目约定，本单不调用pnpm。依赖仅只读链接 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`；未读该树runtime/credentials，未安装或写共享缓存。

唯一实际业务写根为本前缀 selftmp，HOME/TMPDIR/XDG_CACHE_HOME/Vite/Node/npm cache全部独占。测试启动环境用显式allowlist，不继承凭据变量。依赖物理目录14611文件/链接前后内容与mtime均无漂移；未递归核软链外部目标，不把有限观察域扩大为系统全根零污染。

## 4 自动执行与原证

计划先行见[复验计划](a11-overview-done-independent-retest-20261021-plan.md)。作者原用例原样复制，不修改产品/作者测试；新增专家用例只写本前缀并复制到自有冻结src中。真实Overview、completionHero、stats、query、scope和派生函数不mock；domain仅内存只读表，无业务落盘。

在仓库根，以下均使用同一绝对Node；每轮完整executable/argv/cwd/start/end/exit/env/stdout/stderr/逐用例JSON在[selftmp](a11-overview-done-independent-retest-20261021-selftmp/)对应目录。freeze候选时点及末次audit独立记录。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-done-independent-retest-20261021-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-done-independent-retest-20261021-run.mjs author
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-done-independent-retest-20261021-run.mjs independent
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-done-independent-retest-20261021-run.mjs independent-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-done-independent-retest-20261021-run.mjs regression
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-done-independent-retest-20261021-run.mjs vendor
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-done-independent-retest-20261021-run.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-done-independent-retest-20261021-run.mjs audit-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-overview-done-independent-retest-20261021-source-audit.mjs
git diff --check -- 'docs/testing/a11-overview-done-independent-retest-20261021*'
```

| 命令 | 实际结果 |
| --- | --- |
| freeze | 完成独占冻结，380src、14611依赖文件/链接；复制前后源内容一致 |
| author | exit0，1文件10/10 |
| independent r1 | exit1，17项中8通过/9失败，失败全部是专家误要求wrapped0文案；不是产品缺陷 |
| independent-r2 | exit0，17/17；只更正零值断言，保留r1测试、失败JSON和日志 |
| regression | exit0，11文件78/78；含作者10、独立17、objective-consumers13、overview-contract4、panel-checklist2、meta5、clamp11、registry4、scope4、默认项目模板6、Markdown来源2 |
| vendor | exit0，两个注册vendor指纹校验通过；未注册目录不计入 |
| audit r1 | exit1，审计器相对路径错把登记的自有r2测试当漂移；主树/固定输入/依赖均0漂移。保留`audit.json`原证 |
| audit-r2 | exit0，精确核r2登记SHA；主树src、冻结产品src、固定输入、依赖内容与mtime均0漂移 |
| source-audit | exit0；作者red确为1失败/9未选，green27、regression45；局部patch与war-room不变证明成立 |

r1/r2测试差异仅零wrapped文案条件。源码审计r1的路径笔误只影响设施漂移报告，未修改被冻结产品；新审计不覆盖旧失败。初环境`rg`不可用、平台memory不存在，采用find/grep及仓库权威文档，不当产品失败。

**警告保留**：regression的既有TaskTable key警告、11 keydown listener警告、panel测试卸载缺requestAnimationFrame的React警告与作者回归一致。78项exit0不证明这些警告在GUI无害，不签panel全体验；本地Overview新增17项无stderr警告。未偷偷stub/抑制或修改其他作者测试。

## 5 独立覆盖与影响索引

- 原F2含真正根因P，不避开todo100；done progress0仍计完成，wrapped及非done legacy100/人工100不计完成。
- 合法原子集：完整P/M/三叶、根级done/空清单/wrapped、1/3=33与2/3=67；真实query筛done/wrapped得到3项，新卡和下卡仅同一3项比较。完整项目另断言20，不伪称完整页面有子集筛选入口。
- 父done/子todo按每条状态计数，不强推子完成；wrapped合法迁P（parentId/code/order一致）63覆盖2/3，改回todo75覆盖3/4，完成2/10始终20。这是合法props消费反证，不是Web迁父落盘旅程。
- 同实例todo100→done0→wrapped100→todo100，同步完成日期设置/清除；全五态互斥，wrapped为0时上卡原文不显示零桶、下卡真实分布仍明确0。
- 人工30/0/null × 清单100/50均与两卡及stats匹配，父客观88/63保真；空分母、合法缺/空清单已覆盖。malformed仅原schema拒绝，不传入组件、不改变schema/生产兼容边界。
- `overview.tsx`卡hunk → 作者10/独立17/overview-contract4重测；OP阶段/任务/甘特消费 → objective-consumers13 + meta/clamp重测，不直接继承旧候选全门。
- 同页权威展示实际是`panel.tsx`按项目`scopeSnapshot`给BoardBento，再走widgets的completionHero，不是直接调用collectStats。真实模板及scope/默认模板/registry重测；只核上述受影响模板，不签全部模板/布局/联动旅程。
- 健康/风险/KPI/团队/议程保持局部修复前hunk不变；war-room另核源码不变。报告Markdown的两项仅来源输出回归，不声称完整快照/历史/delta重验。

## 6 自查与释放

已校验manifest锁定`49dd158d1076134a641b33efb035946536778336`后只读code-review，按标准/合同两轴审查。标准轴：限定写根、真实源冻结、无产品修复、无setup/global/服务动作；合同轴：真实根因P反证、20%保留、桶互斥、局部scope、旧GUI不继承。本单不具子代理工具，不声称完成其并行子代理步骤；以项目规则覆盖setup/commit/全门要求，试点记录并入本文，不写其他目录。brainstorming/writing-plans已读，仅承接已批准复验合同，不创建功能、living plan或提交。

本专家有限任务完成并释放，测试子进程已退出，无本单服务或GUI实例。selftmp和失败原证保留，不清他人成果。只写本前缀文件与selftmp；未product/build/install/sharedcache/private-runtime/credentials/其他docs/commit/push。

**Main下一步**：以本Overview/newtest和完整当前候选重新冻结A11，唯一build、产物/依赖/功能开关认领、新实例argv/PID/cwd/下发绑定；按原A10最小合同原F2 fresh空目标、manual30/0/clear、checklist100/50采同页上下两卡可见原图/帧和完整盘记录，应始终done2/10=20、wrapped1、客观63↔88。另按RA-OP03原合同补wrapped迁父/改回todo完整旅程。交独立专家审证后再判GUI，Main更新living docs/协作记录及最终统一commit；不由本文授权push/tag/切正式。
