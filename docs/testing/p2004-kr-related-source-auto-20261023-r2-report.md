# P2004 KR 软关联最小修复独立 SOURCE/AUTO 审证 R2

2026-10-23，平台 trae，独立 SOURCE/AUTO 审证专家，非开发、非产品测试重执行端、非 GUI 执行端。接续中断 r1，只审原证及必要字节。**本轮定向结论：`PASS_LIMITED_SOURCE_AUTO`；真实 GUI 为 `BLOCKED`，P2OKR-R1-01 整项未关闭。不签整组合、父全部门或 ordinarycommit。**

## 1. 授权与停止条件

负责人本次原句：

> 父goal持续授权独立专家与Main分工，所有已实现未验至ordinarycommit，无push/tag/release/正式切。你独立SOURCE/AUTO审证专家，不开发。
>
> 接续只审现有原证和必要字节核，不重跑已充分的红/绿；唯一写 docs/testing/p2004-kr-related-source-auto-20261023-r2* 新文件及自有/tmp reader。
>
> 不签整组合/GUI/父commit。禁产品写、原testing写、Main plans/livingdocs/封件写、build/install/服务/GUI/Git操作/凭据/正式和privatefreeze/runtime读取。
>
> 实际原红/绿/设施失败保真，原证有效足够就完成独立report/audit/seal STOP。通用开工拉取安装整回归被本限定覆盖。

已读 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[原 GUI 专家报告 §6](p2-okr-habit-remaining-gui-review-20261023-r1-report.md#6-p2okr-r1-01-最小红--修--复验合同)、开发 [result](../plans/2026-10-23-p2004-kr-related-result.md)、[seal](../plans/2026-10-23-p2004-kr-related-seal.json)、[tool-receipts](../plans/2026-10-23-p2004-kr-related-tool-receipts.json)、[seal-tool-receipt](../plans/2026-10-23-p2004-kr-related-seal-tool-receipt.json) 及全部本单 r1 原件。父授权不下放成本角色 Git、builder、GUI 或发布权限；新文件落本 r2 前缀，Main 档案、原测试文件及封件只读。

原 r1 已有 **21 件** audit、RED/AUTO、protection、receipt、runner/facility，**没有 report/seal**。本轮不执行原 runner 的 seal 分支，不回填 r1，直接追加本 r2 独立审结。

## 2. 候选与必要字节

基线提交 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 引自开发有效 capture-r2 与原审计，不是本角色 Git 实查，也不是未提交候选的替代身份。候选以两源 SHA、原开发相对接手补丁及原证绑定：

| 对象 | bytes | SHA256 |
| --- | --- | --- |
| 修前 `views/okrs.tsx`，原 RED | 9707 | `2408f42a166060596cd7d72462fe34ffcba5c7a69f2f0233da17a102c4926b8f` |
| 修后 `views/okrs.tsx`，当前窄源与 AUTO | 9854 | `122516a490b80da4a2fc9da0da66fb1283062efb3c54827c8a8399e3a28bc128` |
| `views/okrs-related.test.tsx`，所有阶段同 oracle | 9654 | `a95e115726bbdd1e08e6793f66a01f9aceaa996ca50cfbd1cb80527bde71c176` |
| 未改 `views/okr-model.ts` | 6463 | `1fb062b742aa6eed6c2c4db8ab834aa192114e8d03cc5162be6fe9ab947c4c1a` |
| 未改 `core/okr.ts` | 22248 | `5855f5af46657dad2642ff0c2789f92d210401f13198e5472803792533392c7d` |

[r2 audit](p2004-kr-related-source-auto-20261023-r2-audit.json) 独立实核：

- 开发 seal 为 **16280326 bytes**，SHA `dfb92a47d290d390e9eb8e4c2f30bd6a0d689e76605c211761ad5494f894d67a`，与原 r1 audit、开发 seal-tool-receipt 相同；其 **32/32 产物**逐字节与 SHA 相符。原 satisfied 只当开发封装事实，不当独立 PASS。
- 开发 baseline.inputs→seal.inputsAfter 重新计算只有新增 test、修改 views 两项；r1 audit 原保护前后 **1839/1839** 元数据差分为 0。开发 RED 的 repoSource 为修前 SHA，GREEN/affected 为修后 SHA，符合原执行时序。
- RED/AUTO 的 **408 项隔离源码元数据**归一后只有 `src/client/views/okrs.tsx` 一项差异；开发 RED/GREEN/affected 的源码清单分别精确对齐相应阶段。408 是源码输入数，不是功能数。
- 实读 r1 自有 `/tmp/pm-p2004-source-auto-r1-hY4mqH/{red,auto}/inputs` 各 **8 份必要 source**，共16份；当前主树只核对应8份窄源，均对齐修后输入。包括 views/test、model/model.test、growth-form-props.test、form-validation、core/okr 与其 test。不扩成当前全部主树、Main 新组合或 runtime 资格。
- 在 reader 内存中按原 source-delta.patch 将原 RED 源转换，结果逐字节恰为修后源；**没有调用 patch、diff、Git，也没有写产品**。原 RED reconstruction 的 patch child exit0 另有原 receipt。
- 两阶段 **8888 项依赖指纹元数据**与 Node 指纹一致，只作原绑定比较，**未重读/扫描这8888份依赖**；必要读取 r1 两份配置、开发三份配置，均仅指向既有 React/ReactDOM DOM 设施、实际 source 与指定 test，无替换业务模块配置。

本轮实际逐路径读取 **87 个输入**，audit 窗口复读差分0；封存再核见本 [seal](p2004-kr-related-source-auto-20261023-r2-seal.json) 与其 [实际终码回执](p2004-kr-related-source-auto-20261023-r2-seal-tool-receipt.json)。这不是全仓、全盘或全时监控；不读旧巨大 testing/selftmp、privatefreeze、runtime、正式根或凭据。

## 3. SOURCE 与原自动证据

SOURCE 实读 [okrs.tsx](../../packages/dsh-pm-tool/src/client/views/okrs.tsx) 的改动恰为 +16/-9：将既有 Link2/关联行抽为局部 `OkrRelatedRows`，空数组返回 null；KR 在自身节点消费 `kr.related`，root 消费 `root.related`，orphan 同一呈现窄复用。保持既有类名和“只展示，不参与权重”文本，没有拷父关系，没有加确认/编辑/链接动作。model 原 `buildOkrTree` 已供给每个 KR/orphan 的独立 related，软联不进入 children，故不需扩模型/core；未改变 primary/schema/存储/权重算法或确认动作。原 source 副本与归一元数据支持此最小范围，不将其他在途改动归给本修复。

| 原实际阶段 | 原真实 child 终码 | 原报告结果 | 独立裁定及边界 |
| --- | --- | --- | --- |
| r1 RED | **1**，signal/error null | 1文件，8案：7失败/1通过 | RED 有判别力；7个失败均“KR内关联行预期1、实际0”，ROOT 原呈现对照通过；不是设施假红 |
| r1 AUTO | **0**，signal/error null | 2文件，**19/19** | `PASS_LIMITED_SOURCE_AUTO`：8案真实 OkrsView/React DOM + 11案既有 model；**外层仍为1**，见 §4 |
| 开发 RED→GREEN | **1→0** | 7失败/1通过→**8/8** | 原证与同 oracle、源码变化、执行时间绑定充分；不是本角色重跑，也不是开发自签 PASS |
| 开发 affected | **0** | 4文件，**59/59** | 8 related + 11 model + 11 growth-form-props + 29 core/okr；只签此候选这些原测试的有限回归，不冒全回归 |
| r1 vendor 静态验证 | **0** | 原收据/日志 | 原先置校验事实；未在本轮执行、加载或升级 vendor skill，不代表产品 PASS |

所有原 output.json 的内嵌原文 bytes/SHA 重新计算，原 Vitest 逐案状态、总数与 receipt start/finish 时间匹配；r1 两阶段各 **8份 DOM 原输出**完整回核。原 r1 测试和开发测试存在重叠，19与59 **不相加为78个独立用例**；重复同 oracle 不当作独立来源倍增。

有限断言审签：

- draft/confirmed 的关联标题与精确ID邻接自己的 KR，恰1行；主A仍是唯一主父，第二目标B仍为独立 root，无 KR 进入其 children。
- rerender 关联行 **1→0→1**，清空不留容器、恢复再现；原序列记录的 primary/status不变，fixture仅KR.related变化，恢复后完整记录同初态。
- ROOT 对照的 HTML 与旧源**逐字相同**，只代表该 ROOT fixture；无关联兄弟不借行，orphan 不伪造父，重排/目标改名仍按ID读新标题，文本作为文本转义而非新动作。
- 全部原DOM观察中 run/onSaved/onCreate/onEdit/fetch 调用均0，测试输入深冻结与原断言一致。仅指该 DOM 测试的渲染/rerender，不冒真实 RPC、业务根写入或全盘零污染。

原 `related可见不计权重` 的 **SOURCE/AUTO 部分充分**。不计权重、同项目校验、主父/存储等原未改源守卫可在既有专家已签范围有限继承；本轮 model11和原 core29只补此接缝证据，不重新签整RA-P2004/第6组。原真实 GUI 的展示 FAIL **不因 DOM 绿而关闭**。

## 4. 原失败与保护保真

原 [r1 facility](p2004-kr-related-source-auto-20261023-r1-facility.md) 保留、不改写：

| 事件 | 本轮处理 |
| --- | --- |
| 开发首 capture 外层 `NOT_COLLECTED`，executionID `b7a07ef0436e86cabe0d358b29c2f8de` | 不由后续成功推造首轮0；误扫历史selftmp属原设施边界，不在本轮重扫 |
| r1 audit 外层 `NOT_COLLECTED`，executionID `8efd0b0f7e3cf6197388b017f4c3eaff` | 原audit产物可回核，vendor child0不补造外层0 |
| r1 RED child1、原失败正文 | 原输出完整保留。本接续未取得单列外层工具回执，**不由child1/产物倒推外层0** |
| r1 AUTO child0/19绿、**外层1** | 原runner L214 `assert.equal(guard.protectedDelta.length,0)` 失败，实际 `1 !== 0`；不是将外层1改0，也不重跑 |
| r2 reader 首/次 audit 各exit1 | 自有计数误填22→实数21、自有RED repoSource错比修后→改为按阶段；仅修/tmp reader，原产品/oracle/证据未改。第三次audit实际0，前两失败不覆盖 |

r1 RED 前后1839份保护输入差分0；AUTO 同1839份中仅 **`docs/progress.md`** 变化：

| 时点 | bytes | SHA256 |
| --- | --- | --- |
| AUTO前 | 133004 | `994ba598c9d0a50193868b59979f9ad3cc376ae7576f5be44b08894f734cfa43` |
| AUTO后 | 133667 | `5498b1f9d503521f17ab1305402326385c88492c0427db567b35b017241e918e` |

本轮从原 before/after 重新算得这一唯一差异，isolatedSourceDelta/dependencyDelta 均0。progress不在所选 source/oracle；8份当前窄源仍与AUTO绑定，故该非产品文档并发变化**不使本两源有限结论失效**。r1 facility记 Main接续变化；本角色不读当前progress定人、不认领其作者、不还原或豁免未来产品变化。**不声称原AUTO所有保护为0，也不声称全部并发写者已查明。**

## 5. Main 新 host GUI 清单

仅落实原专家 §6，**不是新增完整矩阵或重派已完成负例**。`BLOCKED` 原因是本 SOURCE/AUTO 角色没有也不执行新 host GUI；不是 user-only，不转 `MANUAL_PENDING`。

1. **认领新候选/实例**：Main 唯一builder沿父合同组织新freeze、所需构建与组合回归、新host；绑定基线+diff+新增test、两源SHA、产物manifest、实际宿主身份/批准补丁、PID/port/profile解析目标、浏览器上下文及开关。宿主/插件分别认领，不用旧114 bundle/HEAD/version单独代表本修复，也不把本19/59绿代全组合门。没有要求重跑已充分的定向RED/AUTO。
2. **复用原合法fixture**：同项目p-0001，主目标 `okr-mvi5z847-33y3xk`、第二目标 `okr-mvk2hl7d-refwvh`、KR `okr-mvk2jwys-vxyg3c`。若在Main合法隔离新根重建，由既有命令/表单并记录新旧ID映射与成功落盘；不改正式数据或手seed坏记录。
3. **树页真实可见**：进入目标页，KR仍仅挂主A；KR自身邻接“关联：第二目标标题（精确ID · 只展示，不参与权重）”，一次、可读、不误挂父root/兄弟，第二目标仍独立。保存截图/连续帧及实际页面状态；DOM辅助不替目视。复用既有样式位置需此实页确认，不扩浅深/200%/四视口提议矩阵。
4. **重进/reload再见**：切离再回、真实reload后同KR关联仍可见，主父与人confirmed状态不变。绑定每态origin/timeOrigin及截图/帧；仅查看/重进/reload时连续业务root应零写，保相应RPC与完整root证据。无需再次切软联/confirm、同项目suggest/ignore/clear或三次非法负例，原已证切片按原报告范围继承。
5. **交另一GUI专家**：按原合同审新host证据，定向判断P2OKR-R1-01能否关闭；未补充分GUI前仍不能称整项PASS。orphan只有限签本原DOM窄复用，不新开GUI FAIL或强制fixture。P3004原“失败表单保输入”BLOCKED仍归原报告§4.3边界，F7/P2002/B8及父全部适用门不归本单。

## 6. 本轮验证与释放

本轮执行环境：macOS/darwin、bash、既有 Node **v22.23.3**；原测试 Vitest **2.1.9**、React **18.3.1**。pnpm **未调用**、未安装依赖；不拿引用环境版本冒成本轮运行。

本角色实际只读验证命令（仓库根；不执行产品）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/pm-p2004-source-auto-r2-reader-20261023.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/pm-p2004-source-auto-r2-reader-20261023.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/pm-p2004-source-auto-r2-reader-20261023.mjs seal
```

语法检查修正前/后均0；audit顺序 **1、1、0**，最终87输入差分0、21原r1与32开发产物相符。完整关键失败原文与探索设施见 [audit-tool-receipt](p2004-kr-related-source-auto-20261023-r2-audit-tool-receipt.json)。seal终码只由seal之后新增回执记录，不提前推造、不循环封存自身。

本次审的原 child 命令（仅引用原 receipt，**本轮未执行**）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /tmp/pm-p2004-source-auto-r1-hY4mqH/red/vitest.config.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /tmp/pm-p2004-source-auto-r1-hY4mqH/auto/vitest.config.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /tmp/pm-p2004-kr-related-PBNUBC/green/vitest.config.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /tmp/pm-p2004-kr-related-PBNUBC/affected/vitest.config.mjs
```

各命令cwd是相应stage/inputs，原HOME/TMPDIR/cache/DOM输出在其自有stage；没有把这些旧目录当本角色写根。引用原RED/GREEN、AUTO和affected结果，不声称本轮build/install/全verify/全回归/服务/GUI/宿主装载资格。未操作任何Git，未读取正式/privatefreeze/runtime/凭据；无产品、r1原testing、Main plans/livingdocs/封件写入。写入仅本r2四类审证/回执文件及 `/tmp/pm-p2004-source-auto-r2-reader-20261023.mjs`。

**本角色审结，STOP / resources released。** 无源码、builder、GUI、端口、profile或业务根锁；不停止父goal/Main持续任务。Main接本§5清单，另一GUI专家接定向复验；本有限SOURCE/AUTO结论不ordinarycommit，不push/tag/release，不正式切换。
