# A10 客观进度 GUI 原证有限独立审签

> 给 Main、负责人和接手专家使用。2026-10-21，trae 独立审证角色；只读仓库归档，不操作 GUI/服务，不修产品。只签实际采得子项，不签 OP 全门或 B8 总门。

## 1 结论与新缺陷

**人工主保存/重开、清单即时写入/跨页/还原、新报告客观快照，按下面边界有限 PASS；完整 OP 仍未通过。另确证总览状态完成卡有限 FAIL。** 视觉、DOM 文本、原盘 record、候选归属分别判断，不互相替代。

| 子项 | 判定 | 已证范围与未证边界 |
| --- | --- | --- |
| RA-OP01：L1 人工30、0 | PASS_LIMITED | 原15态证明草稿未写、主保存后值/备注落盘、重开保留；甘特实际人工30/0且客观50/清单1/2保真。列表 DOM 有人工徽标和来源，但截图中 L1 行在视口下方，未签其完整目视；总览只展示父63与客观清单卡，不冒称看到了 L1 人工徽标。人工30/0时报告未采。 |
| RA-OP02：有清单 L1 清除后回落 | PASS_LIMITED | 实际为人工0→clear draft→主save→null→tasks/overview/gantt→reopen；客观50保留。不是从30直接清除，也未采取消清除零写、无清单L3人工40→clear。 |
| OP-GUI-01、OP-CK-06：L1即时toggle | PASS_LIMITED | 原9态：真实焦点/Space→明确settrue→100→取消抽屉→overview/gantt/reopen→setfalse→50→同三页。取消不是撤销即时命令。只目标第二UUID的done和合法updatedAt变；兄弟项、status=todo、legacy progress40及其他字段保留。未测同目标态重试/失败重试/并发。 |
| OP-SRC-06、OP-SRC-05：当前三消费点 | PASS_LIMITED | 清除人工后的列表/父63、总览父63、甘特L1=50；全勾后父88、甘特L1=100；还原后63/50。列表值为原DOM文字证据，甘特与抽屉值有原帧目视。未签所有fixture/所有页面标签的完整可读性。 |
| OP-SRC-02、OP-EV-02：新report快照 | PASS_LIMITED | r3真实生成rpt-0001，snapshot.tasks.averageProgress=66/calcVersion=1；只新增报告，十任务hash不变。保存后DOM“平均进度66%”确实存在；截图快照区内滚未露出该值，不签66%目视可读。无覆盖null/旧版0/delta/历史不回填未采。 |
| 原F2标准UI种子恢复 | PASS_LIMITED | 本机长路径→预检→两次确认→原十任务空目标恢复；首确认前后hash相同。只作为本批fixture合法入口，不签 B8 恢复总门。第二restore目标F5仅核归档空目标/首确认，不纳入OP业务签字。 |

### A10-OP-G01：总览状态完成卡错误包含 wrapped

- **有限 FAIL / P1**。原盘F2为10任务、done2、wrapped1。`manual30-overview.json/png`、`manual0-overview.json/png`、`clear-overview.json/png` 及清单两轮 overview 都显示上方“任务完成3/10、30%已完成”；同页下方“任务完成率20%、2/10，收尾1”。原帧亦可见上方3/10、30%。
- 依据：[剩余OP合同](remaining-objective-cases-20261021.md) §1及RA-OP03，wrapped不进入done/open/覆盖统计；[原F2标准](objective-independent-auto-20261021.md) §5明确done2、状态完成率20%。不是人工30遗留：manual0、clear和checklist两态同样30%。
- **最小修复合同**：开发仅核对既有总览状态完成卡，将done计数与同页权威统计一致，wrapped独列，保客观清单/人工双轨及其他已授权计数。不得借此改权重、自动完成或扩大为新看板功能。
- **最小复验**：原F2 fresh空目标、同三个人工态和清单100/50态，采同页上下两卡可见原图/帧、完整任务盘记录；应始终done2/10=20%、wrapped1，客观P63↔88不受影响。再按RA-OP03原合同另采wrapped迁父/改回todo，不能用当前静态子项代整条。
- 未修产品，不自行定根因或改源码。其他客观清单卡“已完成均100%”的语义本轮不追加缺陷，避免无合同推断。

## 2 授权与候选身份

父原句与持续任务见[父执行记录](../../reports/all-pending-acceptance-execution-20261021.md) §1；其收尾是“所有没验完的功能全部验完，再把所有代码都提交”。本子单只写`docs/testing/a10-objective-gui-independent-review-20261021*`及selftmp；Main唯一GUI/builder，子单禁commit。不pull/build/install，不写living docs/其他testing。

本次读取父记录的最新条目为23:22 A9/A10，未自写后续协调条目。负责人补充3221/PID9545、3224/PID9641为**原句来源的实例信息**；本次未读进程/启动私有目录证明PID。`environment.json`明确只是启动前骨架，不能把它签成实际服务启动证据。归档页面origin3221/3224分别可核；私有root/plugin路径只当metadata，不追读。

- [A10候选](../../reports/all-pending-evidence-20261021/A10/candidate.json)：基线`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，宿主HEAD`1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；dirty源码清单及453产物在归档声明，不拿HEAD/version代表候选。
- 归档tracked patch SHA实核`caddc276e6b83d6f79850cc8c1490afdc6a1c5f9409cd8d160fa066cc632c715`。源码指纹不从实际private构建树回读，也不签共享树当前仍相同。
- [objective实际下发](../../reports/all-pending-evidence-20261021/A10/objective/loaded-r1/result.json)：uncached200，combo2572530字节、SHA`e16c70d5a75b368794d53754fd1fb8a3aba0f0a0c0f3fe3a3ac7023992ab21a2`。client源SHA`894a515cee081225687ef8ba887f55a51762ecc481c0d3c3613f035e9c202d2f`与归档artifact相符；归一尾注后1693698字节完整执行段SHA`290b15739e68234c86f752bbced448e0e0a61790a2b1c7a46d13ff00563babc4`，offset875361且唯一。combo整件不等于client单件是正常组合，未称二者原字节相同。
- loaded-r1为15:38:58Z新文档timeOrigin1792597136919.7；checklist/report原状态同timeOrigin。manual-r1为较早文档1792596870672.6，直接下发采集在其后：人工动作事实可审，但不将后一次响应倒签为人工原文档的直接网络证据。
- 明确pilot OFF。manual/checklist实际1440×900、浅色；report实际1440×718、DPR2。DPR/pageScaleFactor不等于浏览器原生200%；100%/200%菜单证据须另审，均不倒签本轮。

相关源码声明指纹：tasks.tsx=`9789e5811ab09dcbc1c561ccec463e905795b34da1eb7f996bab73d8d21ef91e`；overview.tsx=`17391f8a308926b0d559a1a346b9e4946f7c2054ba251458ffeb0c44b5c4c67e`；gantt.tsx=`838a43451e037fdff363ce73e00570512d785f09f45688bf17afdb08ebc730bf`；panel.tsx=`8618d9091d3544a4236e9ae92fa0225e3914ea065b910ff1f3cb55013d0bc506`。旧objective-number复验的tasks/panel已变化，不机械继承其SOURCE/AUTO全结果。

## 3 原证与逐步记录

原证根：[A10/objective](../../reports/all-pending-evidence-20261021/A10/objective/)。[原F2备份](objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json)实核SHA`451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b`，不是另造oracle。未改原OP、RA-OP合同或旧审签。

| 归档 | 原状态/记录与帧 | 本轮实核 |
| --- | --- | --- |
| seed | precheck/restored PNG+JSON、boundary、31帧 | 原标准路径、十任务恢复、空目标与首确认零写；未完整重做JSON备份往返合同。 |
| manual-r1 | observations15、对应15组PNG/JSON、boundary、81帧 | 三个draft的record分别仍无manual/30/0；save后为30/0/null；每阶段tasks/overview/gantt/reopened盘记录一致。clear是从0不是30。 |
| checklist-r1 | records9、对应9组PNG/JSON、boundary、62帧 | 初态manual=null；真Space后的反馈“状态已设为已勾选/未勾选”，原帧抽屉50→100→50及焦点/重开一致；全勾取消后仍true，取消不撤销即时保存。 |
| report及report-r2 | 原表单PNG/JSON、各12帧 | r1日期段输入顺序造成0010等错误；r2真实年修正后日期正确但周期dropdown持续展开、抢focus，ESC未关闭drawer的执行失败保留。不将未保存轮判report通过，亦无充分动作链给ESC独立产品FAIL。 |
| report-r3 | filled/saved PNG+JSON、完整boundary.report wrapper、27帧 | 正确year/month/day得到10-19至10-21，未碰dropdown便实际提交成功，rpt-0001新写。失败轮不覆盖。 |

原225帧全部hash核验，并通过16格全帧目视页逐帧检查；放大另核人工30列表/甘特/总览、人工0草稿、清单checked、F2预检、report saved原PNG。派生目视页不新增执行证据，不消除原图离屏范围。时间段、原SHA见[selftmp审计](a10-objective-gui-independent-review-20261021-selftmp/audit.json)；[完整24记录与原文本](a10-objective-gui-independent-review-20261021-selftmp/records.json)保留wrapper.record，不只摘progress数字。

L1稳定UUID为`c98ca278-c928-4938-a4e0-65c9b8e5105c`与`df643bbe-707e-4556-a4d3-3f879c6d4773`。清单分支前已清人工，不得称branch manual30。manual与checklist整段前后各仅`t-0003`的内容hash变化；report-r3整段只新增`rpt-0001`，十任务及其余已登记文件相同。这里只签所列hash观察域：未采mtime/目录/localStorage/全部正式资产保护，不称系统全根零污染。

## 4 作者命令与本专家检查

归档环境macOS、nvm Node22、pnpm11.28.5为项目约定；审计实际Node v22.23.3/darwin。作者四条命令的完整argv/cwd/start/end/exit均在[A10/build](../../reports/all-pending-evidence-20261021/A10/build/)；本方只读日志，不运行产品。

| 作者归档命令 | 原结果 | 审证界限 |
| --- | --- | --- |
| `pnpm exec tsc --noEmit` | exit0 | 归档事实，不是本专家重新编译。 |
| `pnpm run build` | exit0 | 声明产物与下发按上节核，不签独立整包build门。 |
| `pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` | 140files/1313tests、exit0；lines77.91/branches86.09/functions79.22 | 作者数不代GUI/原OP逐ID。 |
| `node scripts/verify-isolation.mjs` | exit0 | 不用该结果签OP-BD05/06或97全verify。 |

本专家实际执行：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a10-objective-gui-independent-review-20261021-audit.mjs
git diff --check -- 'docs/testing/a10-objective-gui-independent-review-20261021*'
```

审计两次exit0，初冻结637份归档/合同/原F2文件，末次640份（Main新增3份其他归档只作指纹登记，不签其业务），原637份逐hash/size/mtime未漂移；225原帧SHA、24完整records、patch、下发片段、report值与各边界断言相符。审计脚本不加载执行采证脚本、产品或网络；Swift/AppKit仅离线生成selftmp联系页，HOME/TMPDIR/module-cache均限定selftmp，exit0。不是浏览器/桌面操作，不安装依赖。原输入指纹见[inputs.json](a10-objective-gui-independent-review-20261021-selftmp/inputs.json)。报告本地链接0缺失、行尾空白0、末尾换行保留；diff-check exit0。

## 5 剩余门与释放

未采保持 **NOT_RUN**：wrapped迁父/改回todo全旅程、负工时/非法链接GUI、status/completedDate/revert、旧库仅浏览与真实宿主精确PID重启、390、原生100%/200%全矩阵、无清单人工clear与取消clear、人工30/0报告、历史快照/diff、原OP全集其余CRUD/队列/失败/深树/备份/全根保护。原独立AUTO历史子项只保其原候选适用性，不迁为当前GUI全PASS。

未采值的可见性应由Main按原用例补滚动后的原图/帧和当时盘记录，不改用例、不把本文部分PASS补成整项PASS。新A10-OP-G01按§1最小合同修复/独立复验；未拿到新证前FAIL仍开。Main继续父任务、living docs与最后commit；本专家有限报告完成即释放，无GUI/service/private-runtime/credentials/build/product/其他testing/livingdocs/commit动作。
