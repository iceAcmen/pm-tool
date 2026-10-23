# OP 与编号有限独立复验

> 给 Main、负责人及接手专家使用。2026-10-21，平台 trae，独立测试角色；只写本前缀与同前缀 evidence/selftmp。复验 SOURCE/AUTO，不操作 Main GUI、不修改产品、不签完整 OP/编号门。

## 1 结论与即时缺陷

**三项 OP 原缺陷的冻结 SOURCE/AUTO 有限 PASS，GNHD-01 结构/AUTO 有限 PASS；整体候选仍 BLOCKED。** 编号历史视觉 FAIL 不由组件结构或测试总数关闭。

| 对象 | 本次判定 | 证据与边界 |
| --- | --- | --- |
| OP-AUTO-DEF-01 / OP-SRC-01 | PASS_LIMITED | 真实 TaskTable/树/Overview 原 F2 P63、覆盖2/3，L1客观50、legacy仅旁注，无清单null；人工30/0/clear独立，项目66不变。非浏览器表单或完整跨页旅程。 |
| OP-AUTO-DEF-02 / OP-SRC-05 | PASS_LIMITED | 真实 GanttView 40/null/manual70/manual0条体/ARIA/title/左标签；人工70填70且客观40保真。键盘动作调用真实命令仅日期与合法updatedAt变化；pointer拖动/实际视觉未验。 |
| OP-AUTO-DEF-03 / RA-OP04 | PASS_LIMITED | 生产schema、真实handleTaskCommand、JSON Storage/DomainFacility；非法add/update含其他字段和draft拒绝且完整文件hash/mtime零变化。http(s)/trim/3.5合法，旧非法协议record读取/标准备份/无关更新兼容。 |
| GNHD-01 / 结构与AUTO | PASS_LIMITED | 原code常驻、同62px编号格独立role=status，全文状态不塞按钮、不进入任务cell；CSS允许换行，无hidden/ellipsis。模拟clipboard成功/拒绝/缺失及fake1599/1600ms通过。不是视觉可读/真实系统复制验收。 |
| GNHD-01 / 真实视觉 | **FAIL_OPEN** | 原截图“已…”/“复…”保留；新bundle、同段真实Tab/Enter/pbpaste/拒绝权限/手动选择/布局与保护manifest待Main交专家审证。 |
| ON-DEP-COMPILE-01 / 文件依赖类型 | **历史FAIL，修后有限复验关闭** | 旧 `src/core/file-assets.ts:144` 的 `let ancestor = sep` 字面量联合赋值TS2322；Main仅改为 `let ancestor: string = sep`。新轮相关闭包compile0、原包tsconfig完整自有副本noEmit0；不列为OP缺陷、不声称实际package build。 |

编译原报错：

```text
src/core/file-assets.ts(144,5): error TS2322: Type 'string' is not assignable to type '"\\" | "/"'.
```

[旧编译stdout](objective-number-independent-retest-20261021-evidence/run-BgYW1S/related-production-compile.stdout.txt)、[旧stderr（空）](objective-number-independent-retest-20261021-evidence/run-BgYW1S/related-production-compile.stderr.txt)、[旧完整命令](objective-number-independent-retest-20261021-evidence/run-BgYW1S/commands.json)保留。旧自有闭包配置仅继承原tsconfig、收窄include并改自有输出，不改strict/types。Main修复后，新[compile stdout（空）](objective-number-independent-retest-20261021-evidence/run-qCokWR/related-production-compile.stdout.txt)/[stderr（空）](objective-number-independent-retest-20261021-evidence/run-qCokWR/related-production-compile.stderr.txt)均exit0。新轮不是以drift/hash消除故障，而是重新实际编译通过。

**原包配置对照：** [current-package-noEmit stdout](objective-number-independent-retest-20261021-evidence/typecheck-MvbEmD/current-package-noEmit.stdout.txt)/[stderr](objective-number-independent-retest-20261021-evidence/typecheck-MvbEmD/current-package-noEmit.stderr.txt)均空、exit0；[原配置showConfig](objective-number-independent-retest-20261021-evidence/typecheck-MvbEmD/current-package-showConfig.stdout.txt)、[命令/env/exit](objective-number-independent-retest-20261021-evidence/typecheck-MvbEmD/commands.json)。这是完整主树源码的自有复制、逐文件输入快照，执行 `tsc -p tsconfig.json --noEmit`，没有整包build或共享树输出。开发报告更早noEmit0不被本次旧失败推翻；两者字节时点不同。将旧相关闭包叠加到新全包的诊断副本虽复现TS2322，但额外有 `ask.ts:290 TS2554`（新ask与旧provenance接口混合），明确为混合设施、不列为当前产品缺陷或历史整包证据。

## 2 授权、候选与依赖

父持续收口原句和分工见 [父记录](../../reports/all-pending-acceptance-execution-20261021.md)。本子单按用户原句限定“只写docs/testing/objective-number-independent-retest-20261021*及同前缀evidence/selftmp”，不pull、不install/build共享包、不改living docs/其他testing/服务/认证/private/commit。读取的 `/private/tmp/pmtool-all-closure-20261021/.../node_modules` 仅是明确授权的公开安装依赖；未跟读任何runtime/private/profile或凭据。

- 文档HEAD/baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；product base `2a7603023bc54ef13d788e50069ee3fde4671bf3`；包0.7.4+dirty。只认领五产品+三新tests，不拿HEAD/版本代表dirty。
- 最终冻结 `run-qCokWR`，2026-10-21T13:45:12.053Z；完整[候选](objective-number-independent-retest-20261021-evidence/run-qCokWR/candidate.json)、[五文件diff](objective-number-independent-retest-20261021-evidence/run-qCokWR/five-products.patch) SHA `e0395ce1bb2807440ed36d1cc4e08b9cf516a4317e4d39f45d8b4c134f14ee73`。
- 93个相关源码/测试/CSS/声明/config输入，经TypeScript静态导入解析冻结至自有副本；不复制panel、不新增panel props。源码存在不代表运行宿主已经装载。
- 四配置package/lock/vitest/tsconfig另列候选；主树renderer缺失，用已有完整依赖链接自有copy。完整node_modules 14611条文件/软链，before/after全部hash/size/mtime/链接解析相同；审证时再次核当前字节与链接，未变。包含共享`.vite/vitest/results.json`，本次未写缓存。
- 完整[相关依赖前后](objective-number-independent-retest-20261021-evidence/run-qCokWR/inputs-before.json)及[导入边](objective-number-independent-retest-20261021-evidence/run-qCokWR/import-edges.json)供按hash失效；不认领其他在途文件。

| 文件（根packages/dsh-pm-tool） | 冻结SHA256 |
| --- | --- |
| src/client/views/tasks.tsx | c6b84a4ab5a711addc06c0de38b9d0d7af1f40df162d3462a04079b98e92c5e2 |
| src/client/views/tasks.css | 35f1123e41ae0cce98c00f6ab5eb64f05ddf86fa491603b6cb8f7c17ad5be161 |
| src/client/views/overview.tsx | 17391f8a308926b0d559a1a346b9e4946f7c2054ba251458ffeb0c44b5c4c67e |
| src/client/views/gantt.tsx | 838a43451e037fdff363ce73e00570512d785f09f45688bf17afdb08ebc730bf |
| src/core/task.ts | ad71b6d1b26e386e297c8f3c6a555252772c5247ab94b3ceec89c787eb21646b |
| src/client/views/objective-consumers.test.tsx | 92aa22c5f8ad77dc6e7ac25fca2733115f7f4e908072c40572aca31b4adb0a48 |
| src/core/task-evidence-protocol.test.ts | 550f9cc21d4ea2c0603155ea96afe827da1b002817a59c717b2e4c277d997f35 |
| src/client/views/tasks-number-feedback.test.tsx | bace029fc20f46cc8e65b075879966d97e2cd5e4e24a4d1673af3a528a157e1f |

领域依赖当前 `core/tasks.ts=c3e0d8a379b5dbbe41331ba42df265711c90a12dbcb8a47955ee70c4d4723fe3`、`file-asset-store.ts=b961bf1f20cb92cc887e36b7a80bbd1b58606840e91e6ae7742c5fa8ab833ac1`、`file-assets.ts=56e98ea6a8943468e69f7bc1a5e89ae6223b0f6d9ff010dee9c1a1a1b8853fc4`。后者仅Main类型修复，OP八文件不变；旧 `file-assets.ts=7e6c3c3705e6d1b89732f5c6b404f5930d004b99bf6ab282c11401242a07f5ef` 失败保留。前两轮曾因Main修文件发生drift，旧字节的DOMAIN结果不适用于新字节，不误判污染/回退他人改动。

## 3 原fixture与逐ID审签

原F2直接来自专家`9dg1J5/f2.json`与`f2-backup.json`，SHA分别 `ec25f42d12190f509c32a78f760c21fcc817afcedb45ea33039436c17b03c22f`、`451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b`。副本保持相同相对路径。所有F2记录经生产taskRecordSchema，备份经validate/precheck/apply至自有空库；不导入非法code或异常树。

expected严格引用原报告§5：P63/覆盖2/3、L1清单1/2=50、L5 done2/5=40、L3/L6/L7无清单null、项目66/覆盖4/7/pending1。补测人工30/0/clear只比较显式常量与生产读回，不以当前算法反算oracle。甘特L5仅通过真实命令补合法排期/人工70，清单2/5保留。

**57原OP + 6 RA + GNHD-01逐行索引：** [Markdown](objective-number-independent-retest-20261021-evidence/run-qCokWR/case-disposition.md)、[JSON断言名/命令/序号](objective-number-independent-retest-20261021-evidence/run-qCokWR/case-disposition.json)。每行明确PASS_LIMITED或NOT_RUN/N/A以及GUI缺口；不回填原计划，不将原52局部PASS机械继承为当前整项。

- 本次签清单真源消费、人工显示/清除、legacy/null/覆盖、wrapped组件边界、新写协议与旧读、日期唯一写、完成日期/显式修正/revert等已列断言。
- checklist CRUD/真实toggle幂等、分歧并发/EIO、10000深树、报告/diff/doctor、queue/stats/check、真实宿主停起、旧format包完整兼容等原步骤本次未重跑，NOT_RUN或仅所列子项PASS；原证保留历史适用范围。
- OP-SRC-06/OP-GUI-01..03、RA-OP01..05表单提交/取消/重进/390/真实跨页，及GNHD-M03真实视觉均未执行。本方有GUI职责分工限制，不转MANUAL_PENDING。BD05正式保护/BD06Main全build/full guard亦未代签。

## 4 实际运行与完整命令

运行环境Darwin24.6.0 arm64、Node22.23.3、已装Vitest2.1.9/React18.3.1；pnpm未运行，约定11.28.5。所有子进程新白名单env；HOME/TMPDIR/DSH_HOME/文件/备份/storage均自有根，NODE_OPTIONS加载自有guard，禁网络/listen/fetch。写操作数仅作设施审计，不能代表门。

最终[commands.json](objective-number-independent-retest-20261021-evidence/run-qCokWR/commands.json)保存完整executable/argv/cwd/白名单env/时间/exit/signal/error及stdout/stderr SHA；[原始事件](objective-number-independent-retest-20261021-evidence/run-qCokWR/current-independent-boundary.events.ndjson)保存实际payload/响应/record/零写清单。

| 命令标识 | 实际exit / 覆盖 |
| --- | --- |
| current-developer-15：`node node_modules/vitest/vitest.mjs run <原15文件> --maxWorkers=1 --minWorkers=1 --no-cache --reporter=verbose --reporter=json --outputFile=<own>` | 0；114/114。原开发测试独立重跑，不引用开发日志冒充本次执行。 |
| old-same-new-tests：同argv、同三个新tests+原clipboard，五产品换基线字节 | 1；24红/6绿。consumer13红、protocol6红3绿、number5红、clipboard3绿。相关其他依赖保持同当前副本，因此是五产品对照，不称基线整包历史运行。 |
| current-independent-boundary：同Vitest argv、独立专家新boundary文件 | 0；17/17。真实JSON旧读零写、人工父30/0/clear、null与0、八非法输入、合法/旧证据往返、真实甘特日期命令、合法code结构、完成日期/revert。 |
| related-production-compile：`node node_modules/typescript/bin/tsc -p independent-compile.json` | **修后0**；旧BgYW1S为2/TS2322。include仅五生产TS/TSX入口、真实task命令与必要声明，自动跟静态依赖；122输出指纹在自有compile，未整包build、未写共享lib。 |
| audit：`node docs/testing/objective-number-independent-retest-20261021-audit.mjs` | **修后0**；旧BgYW1S为1/compile FAIL。原日志/断言/八文件/完整依赖/零写审计核对完成，无漂移；不改expected转绿。 |
| current-package-noEmit：`node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` | **0**，完整原包配置自有副本，非实际共享树build。showConfig0；混合旧相关接口副本noEmit2仅诊断，不签产品。 |

仓库根可复制执行入口（macOS已有nvm Node22；不安装/构建/GUI）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/objective-number-independent-retest-20261021-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/objective-number-independent-retest-20261021-audit.mjs
```

runner生成独立新目录并保留旧轮；旧编译故障时整体exit1正确，新qCokWR整体exit0。审证不能用新轮的hash/结果覆写旧轮原证。

## 5 漂移、设施错误与保护

| 历史轮 | 实际结果与处理 |
| --- | --- |
| 最早准备失败 | 本地import`./gantt`未带扩展名，设施解析缺候选；执行准备exit1，未产品测试。补扩展名解析，不改产品。空自有目录保留。 |
| run-B0TOqc | 114绿、旧24红6绿、boundary15绿1设施红、compile0；错误将缺code当合法taskRecord被schema拒绝，撤销此非法fixture。Main tasks/file-asset-store漂移，旧DOMAIN不继承新字节。 |
| run-5dSUl6 | 114绿、旧24红6绿、boundary15绿1设施红、compile0；父行taskcell选择器误按leaf结构，纠正设施匹配，保失败日志。输入/deps未变。 |
| run-Jf7jWf | 114绿、旧24红6绿、独立17绿、compile0；执行前后源未变，但之后审证发现file-asset-store/file-assets新修复，受影响当前DOMAIN适用性失效。父记录正常更新另列，非产品污染。 |
| run-BgYW1S | 114绿、旧24红6绿、独立17绿、**compile2**；93相关输入与完整依赖执行前后/审证时均相同，新稳定文件修复字节存在类型故障。停止追赶，交Main修该失败。 |
| typecheck-MvbEmD | Main新类型修复后完整原包tsconfig自有副本noEmit0；showConfig0。混合旧闭包诊断noEmit2含TS2322与ask接口混合错误，不当当前产品失败。 |
| run-qCokWR | Main明确类型修复后新冻结：114绿、旧24红6绿、独立17绿、compile0、audit0；93相关输入/完整依赖无变更，OP八文件/原oracle不变。 |

最终写审计1527条、根外拒绝0；完整依赖before=after，所有93冻结相关副本逐hash一致。只断言受guard覆盖路径与所列读写根，不冒充OS沙箱、不声称正式全资产before/after零变化。未读正式资产、未停服务、未改共享cache/lib/config、未清历史现场。

唯一key warning为TaskTable历史红绿均存在、无key的既有React警告，原stderr完整保留；本轮未据此顺手改 unrelated列表或伪装console全洁净。生产schema拒绝非法fixture是正确保护，不登记为产品缺陷。

## 6 Main 下一动作

Main类型修复已有限复验关闭，按唯一builder规则完成隔离整包build/full guard；本轮不签其build或新bundle。随后新bundle绑定合法实例/实际下发，执行原OP四消费点表单/取消/零写/390与GNHD-M03两合法code的真实反馈/系统值/键盘/手动取值/保护证据。Main同步living docs与最后Git；本专家没有commit/服务/MainGUI授权，不开新功能或接手其他测试任务。

## 7 最后封存检查

[closure.json](objective-number-independent-retest-20261021-closure.json)记录旧/new file-assets SHA、Main唯一差异 `let ancestor = sep` → `let ancestor: string = sep`、同ES2022/ESNext转译JS逐字节相同、OP八文件/五文件patch未变、compile0/原包配置noEmit0。JS相同只证明类型修复无运行行为差异，不把路径防软链全部功能升级为本报告验收。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/objective-number-independent-retest-20261021-close.mjs
git diff --check -- 'docs/testing/objective-number-independent-retest-20261021*'
```

两命令exit0；封存核28份最终原件SHA、报告本地链接/尾换行/行尾空白，0问题。最终原件指纹索引在run-qCokWR/sha256-index.json；旧原证分轮保留。未修改产品/其他testing/living docs/共享build或install/service/MainGUI/credentials/private，未commit。有限审签完成，Main继续完整GUI与总包收口。
