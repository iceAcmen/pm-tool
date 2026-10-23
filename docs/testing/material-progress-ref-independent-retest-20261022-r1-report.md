# 资料进展引用独立复验报告

> 2026-10-22，trae，MaterialRefIndependentR1，与 MaterialRefDev 不同的独立 SOURCE/AUTO 专家；非开发、非 GUI。父授权、对象、非目标和步骤见[本轮合同](material-progress-ref-independent-retest-20261022-r1-plan.md)。已释放，STOP。

## 有限结论

**PASS_SOURCE_AUTO_LIMITED**。批准最小范围内未发现阻断问题：MPRC-01 事件引用崩溃与 MPRC-02 新链接候选不刷新均通过独立修后复验。原 **7/7**、新增 **5/5**、affected **14 文件/194 项**全部通过，共 **16 文件/206 项**，无跳过；包 noEmit exit **0**。

本签字仅认下述冻结候选和本缺陷 SOURCE/AUTO；不签 GUI、真实 PM shell、native chooser、parent TaskForm 主提交、RA-M06/J03 整旅程、整域、父目标或普通 commit。Main 唯一 builder/GUI；旧3257不冒加载新修。Cycle104/ATF106既有独立结果不锁、不改、不重新签；在途 MaterialRemainingR1/J02/Rcurrent 未读取或冻结审签。

## 候选与源码

- [完整候选 manifest](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/candidate.json)：从开发已 released/STOP 的 `repaired/frozen/packages/dsh-pm-tool` 独占复制 **516 输入**（515 包输入 + 1 份原七用例），全部逐字核对；冻结时与主树515包输入相等。未复制/使用 lib、coverage、artifacts。
- 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅引用既有开发/U4认领，不运行 Git；[原 U4 provenance](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/history/developer/provenance/U4/)和[相对原冻结 patch](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/history/developer/red/u4-relative.patch)保留。
- 独立重算[增量 patch](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/source-increment.patch)，SHA256=`41756b409d7937fd836c88cc1c0587d8ef396b0259ecc15059bca1a40898fa8d`，与开发原件逐字一致；只改组件、新增一测试，无其他输入差异。

| 精确冻结文件 | SHA256 |
| --- | --- |
| [task-draft-materials.tsx](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/frozen/packages/dsh-pm-tool/src/client/shared/task-draft-materials.tsx) | `b7ecc42640705c61a8aa38630ce773c178674cf20b09477f0f5267422e2cf90c` |
| [新 refs-dom 测试](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/frozen/packages/dsh-pm-tool/src/client/shared/task-draft-materials-refs-dom.test.tsx) | `73f5d1abc30d92e80b4e12156bbdbd99d422bfb0890b8cbd02b69148b4735a98` |
| [原七用例逐字副本](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/frozen/packages/dsh-pm-tool/material-progress-ref-crash-20261022-r1-cases.test.tsx) | `61b99507dfd39a7a09388e7c71ba616d8b1cc925bc0dbdd0979bfe9737e14894` |

**Standards 窄审：** 组件186–199行直接读取当前journal，429–432行同步取checked，updater只用布尔快照与prev/r.value；保既有命名、类型和局部会话，无新依赖/全局状态/不安全渲染。未改OpsSession/core/tasks/路由/CSS/dirty。cleanup及submissionRef边界在patch中逐字未变，无阻断发现。

**Spec 窄审：** 两处实现符合批准最小计划；真实addLink的push加rerender现在即可出现refs，不靠stagedRows偶然刷新；没有persist、永久currentTarget、吞异常或绕保存逻辑。原7及新5不弱化Oracle，无阻断发现。限定之外的旅程不补造覆盖。

[源码增量与全部16测试原件指纹](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/source-audit.json)记录双轴审查。本角色只用vendored code-review双轴方法，不冒称两个并行review专家；Git/setup/另派角色/写他人路径等冲突步骤跳过。manifest锁定 `49dd158d1076134a641b33efb035946536778336`，逐文件完整性与静态校验均通过；方法不替代独立门。

## 独立实测

| 执行 | 原exit | 结果与原件 |
| --- | --- | --- |
| runner语法检查/prepare | 0/0 | 完整输入及两套依赖独占冻结 |
| 同实例探针 | 0 | [DOM同React/JSX实例，renderer同原React实例](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/runs/instance-probe/stdout.txt) |
| 原七逐字用例 | 0 | [7/7原JSON](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/runs/original-seven/result.json)，C01–03与N01–04全部执行 |
| 新真实DOM五项 | 0 | [5/5原JSON](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/runs/new-dom/result.json)，选择/取消选择、保存、取消、移除file |
| affected原14文件 | 0 | [194/194原JSON](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/runs/affected/result.json)，[完整清单](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/affected-list.json) |
| `tsc -p tsconfig.json --noEmit --incremental false` | 0 | [原命令/环境/PID](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/runs/noEmit/command.json)，完整包生产源码；tsconfig原本排除测试，不称测试静态类型检查 |
| vendor只读静态校验 | 0 | [原stdout](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/runs/vendor-static/stdout.txt)，非fullverify/非产品门替代 |
| 原件审计/source增量审计/close | 0/0/0 | [审计](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/audit.json)、[SOURCE](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/source-audit.json)、[保护终核](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/close.json) |

- C01真实click内部currentTarget为input、返回后null；安全Probe两次checked真/假，证明事件设施。C02原OpsSession验证/build保c-2/c-3，仅会话控制，不冒真实上传。
- C03不选refs：两link+真实22 byte stage、进展追加、一次addTask及成功卸载无DELETE。N01既有资料真实click/追加保两既有ID；新增第1项选择/取消选择后refs=[at-2]，既有任务不提前改写。
- N02只加两link实际出现候选、click c-2及追加；新增第2项反复select/unselect后一次真实addTask，重读最终at-2，无网络请求。
- [N03原观察](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/runs/original-seven/observations/6-N03/observations.json)：c-2再file，追加refs=[c-2,c-3]，一次addTask，最终refs=`[at-2,at-3]`。
- [N04原观察](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/runs/original-seven/observations/7-N04/observations.json)：file再c-2，追加refs=[c-3,c-2]，一次addTask，最终refs=`[at-3,at-2]`。两项均无render异常，点击后外层采证标记保留；各一个file_asset，实际资产与raw-stage逐字相等，**22 byte**，SHA256=`c44d6f2896223ee70903417978469badd27e4825a2bf1a81e0f5b476600a8494`；请求仅POST201，成功卸载零DELETE。
- 新增第3项同时反复取消/选择file与c-2，持久化回读精确refs/assetId/22 byte且卸载后字节仍在；第4项有refs未提交卸载，POST201→DELETE200、stage不可再读且staging空、task/file_asset零写；第5项移除file剔除c-3但保c-2，仅一次DELETE。这是组件卸载/移除语义，不是真TaskForm取消按钮GUI实测。
- affected覆盖draft/alias/commands/mirror/stage/lifecycle/asset/任务资料/原子文件保存、失败补偿与文件路由；每文件原断言及结果完整保留，不外推全包回归。

## 设施、原失败与保护

- macOS、Node **v22.23.3**、Vitest **2.1.9**；项目pnpm **11.28.5**仅约定，本批未执行。DOM React/ReactDOM **18.3.1**同实例、JSDOM **25.0.1**；两个DOM suite分别独立进程。affected不施加DOM alias，原React/test-renderer18.3.1配套。
- [包依赖](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/package-deps-ownership.json) **13579文件/1030内部链接**、[DOM依赖](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/dom-deps-ownership.json) **1595文件/2内部链接**，普通复制，零共享inode、零外链；DOM锁SHA=`15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973`。
- no-cache/singleFork/min-maxWorkers=1/fileParallelism=false；全部子进程白名单环境与自有HOME/TMP/cache/DSH_HOME/data/files，含PM_GOVERNANCE_TMP/PM_FILE_ATOMIC_TMP/PM_BACKUP_WEB_TMP。[每轮目录](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/runs/)保存完整argv/cwd/env/PID/exit/stdout/stderr/result。
- File是真JSDOM File；FileList仅chooser交付；fetch仅adapter调用真实asset-route/Cordis/JsonStorage/DomainFacility，零网络，无产品事件/状态/updater/保存/回收mock。affected原A11固定原件只读，另列前后SHA保护，未改测试硬编码路径；所有临时写根均自有。
- [历史原件副本](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/history/)保开发修前3绿/4红exit1、首affected190/194四双React设施失败exit1、r2 194绿exit0、原ReactDOM19不兼容exit1及栈；没有重跑、覆盖、删除或洗绿。独立修后结果与这些历史出口分开。
- [保护终核](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/close.json)：开发STOP全树、原独立r1/cases/report、DOM来源、U4 src/deps/lib、主lib、vendor与A11原件前后文件/字节/链接/inode差异均零；自有冻结全树也零漂移；主树本项两文件仍与被测SHA一致。只对列明根作结论，不宣称全盘/他人在途成果零变化。
- [封存索引](material-progress-ref-independent-retest-20261022-r1-selftmp/r1/sealed-evidence.json)覆盖本轮原件；本报告/合同/运行器在轮外，由[最终校验](material-progress-ref-independent-retest-20261022-r1-finalcheck.json)另认指纹，不回写原封包。

## 命令与停止

从仓库根、macOS执行的完整外层命令见[合同命令块](material-progress-ref-independent-retest-20261022-r1-plan.md)；运行器[run.mjs](material-progress-ref-independent-retest-20261022-r1-run.mjs)与[source-audit.mjs](material-progress-ref-independent-retest-20261022-r1-source-audit.mjs)原件保留。内部实际Vitest为 `node <自有冻结>/node_modules/vitest/vitest.mjs run --config <自有轮>/config.mjs --no-cache --reporter=default --reporter=json --outputFile=<自有轮>/result.json`，完整绝对路径/白名单env以各`command.json`为准；旧轮禁止覆盖重跑。

语法检查、prepare、test、audit、source-audit、close实际exit依次 **0/0/0/0/0/0**；source审计内部diff exit1仅表示预期增量差异，不是产品失败。test runner PID53021，三Vitest父PID53024/53045/53099，tsc PID53188，静态校验PID53406，均已等待返回；未停止任何服务。

本角色只写指定前缀，无fetch/pull/install/build/fullverify/coverage/GUI/模型/credentials/服务/Git/上游/产品/他人文档写入。有限结果交Main汇合统一候选后唯一build和新实例原GUI旅程；不冒整项放行或父goalcommit。**释放，STOP。**
