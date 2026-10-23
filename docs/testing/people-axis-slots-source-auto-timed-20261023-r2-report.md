# 人员轴文字槽与容量有限 SOURCE/AUTO 独立报告

供 Main 合 freeze 前核两源有限门；2026-10-23，`trae`，独立源码审阅角色，非开发、非 Main GUI。[计划](people-axis-slots-source-auto-timed-20261023-r2-plan.md)先落，收到 Main 正式 released handoff 后才实审。

## 结论

**有限 SOURCE：PASS。** 独立审完冻结两源 before→after 的全部差异和 after 原上下文，未发现本合同范围内新缺陷。此结论仅覆盖下表两源及本次最小 delta，不代全候选、GUI、无障碍实测、整 `RA-P1006` / P功能或 ordinary commit。

**开发 AUTO 记录：ADMISSIBLE_DEVELOPER_AUTO_RECORD。** 原2文件5例、窄type0/CSS解析绿的原配置、oracle、冻结指纹、完整输出及真实exit0可采纳；本角色**未另执行**5例/type，**不签独立 AUTO PASS**。当前 delta 未改派生，重复这5例不能验证布局，故按父授权不重复低价值运行。

**GUI：NOT_RUN / WAIT_MAIN；旧真实四宽 FAIL 保留。** 字符串进入 DOM、CSS不省略数字及容量算术是 SOURCE 证据，不是实际数字可见、无相叠、无外滚或可访问树结论。Main 新合包/整回归/原 GUI 采证后须另独立总审。

## 候选与收据

仅读 `/tmp/people-axis-slots-capacity-developer-20261023/` 的冻结源与有限证据，没有读取活产品源、复制依赖或核全树。

| 冻结对象 | before SHA-256 → after SHA-256 | bytes |
| --- | --- | ---: |
| `people.css` | `8665e0874b0995a77bcd119fbcd892eaeb853593ce4014bce33100d270a995f4` → `7fa9e31329595f05fe846999eafc21208ec7ee011e86883e44afd223743c1594` | 14066 → 14862 |
| `people.tsx` | `e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6` → `d32a316ab25b958fc1bd93f14b157e8da1f75556f419ea72f72ab708f85c107b` | 26112 → 26546 |

开发 seal-manifest SHA `a998d44cec5e90ce08ae068a0925caabcc46722fde64f8bb0f79675344290bbc`。开发实际 readback：`2026-10-23T03:12:24.067Z → 03:12:24.163Z`，PID69051、status0，stdout声明114件；timing-summary实际 `STOP / released`、receiptReread=true。本角色独立核 **38/114 件必要封条**（含两源before/after、差异、15有限冻结输入、原测试与配置/输出、冻结plan/handoff），另核8个后生成封/回读收据身份；**不是独立114/114重核**。after副本与有限测试输入两源实际字节一致。最终完整结果在自有 `finite-integrity-result.json`，原首次输出仍在 `finite-integrity.json` 收据的stdout。

Main 后续528件 draft与旧525的8delta为父认领事实，本角色未读 draft、不背书其件数/差异或全候选。旧姓名 SOURCE仅前CSS；Main通知前序FD最终actualStatus0/PID68704，仅记录通知，本角色不另认领原FD最终封件。

## 全部差异审阅

行号基于冻结 after，完整 original before→after 原文保存在自有 `css-delta.json` / `tsx-delta.json` 的 stdout，不以开发自审代独立差异。

| hunk | 原 before → after | 有限独立判断 |
| --- | --- | --- |
| CSS106 / after109–126 | `7fr 5fr`→`minmax(0,7fr) minmax(0,5fr)`；两卡/卡头/说明收缩换行；排期body内部overflow-x:auto、姓名span局部ellipsis、plot最小160 | 保7:5、原两卡、原112/84姓名列；未裁切外壳或给图卡新横滚，排期内滚在原body。实际宽度/外滚待GUI。 |
| CSS142 / after150 | dist-body增min-width:0 | 人员现图卡内部收缩，无新卡或全局裁切。 |
| CSS155 / after161–175 | 点line-height1.2；新增label/name/value槽，name局部ellipsis，value `flex:0 0 auto` | 字号未缩小；数字没有ellipsis/overflow隐藏；原flip规则未改，label自身为普通row，不继承row-reverse。 |
| CSS184 / after194–195 | 原1100单列 `1fr`→`minmax(0,1fr)` | 同一既有断点，未新断点；前姓名CSS74原修复及其他既有规则保持。 |
| TSX406 / after409 | 直接姓名条件→span/title，内容仍相同条件全文 | 不截断row.display，不改未分配文本、row序/key/事件；title补悬停，不作为唯一accessible保证。 |
| TSX445 / after448 | 原固定图容器→`Math.max(124,(dots.at(-1)?.top??0)+24)` | 空/少行下限124；15行原末中心224→高248；保dots `14+i*15`、点序，未删行或改事实迁就高度。 |
| TSX464 / after467–471 | 原left/top保留，增原图百分比maxWidth；原直接name/value→label内独立span与显式空格 | `v.name`、`v.value`全文原表达式不变、顺序仍姓名空格数字；无新aria/隐藏读屏副本。maxWidth参照外点原图宽，不错套子姓名百分比。 |

**完整文本与行为边界：** after TSX199–200原name/value/top来源、460–462原xPct/flip>=82、449–457轴刻度表达式保持；191–196原scale/median/avg、477–481原统计保持。TSX275展开、299/357/375打开任务、347筛选等事件在全差异之外未动；原主姓名281的 `{row.display}` 不变。新增span无DOM字符串截断或副作用，CSS省略仅作用姓名槽，完整数字span未省略。无core/schema写权，未全树审其状态，不声称全仓零变更。

## AUTO 记录审证

环境：macOS，既有Node v22.23.3；开发Vitest2.1.9、TypeScript5.9.3，无安装。原 oracle 实读：

1. wrapped不进open：openTotal=1、tasks仅o-1、unassigned=null。
2. 空分配/阈值0/未分配0：maxX=8、ticks=[0,2,4,6,8]。
3. 未分配9/已分配3,2/阈值5：maxX=12。
4. 过滤仅1/阈值20：maxX=22。
5. 原7及8负载均maxX=10，向上2倍数+2。

开发 five-cases：`03:09:00.824Z → 03:09:02.434Z`，PID68367，真实exit0，2文件5/5；完整stderr原 `cache.dir deprecated` 保留。配置仅include原2文件、单worker、node环境、自有cache，未削弱/改写原oracle。窄type：`03:09:01.355Z → 03:09:04.171Z`，PID68377，exit0、0诊断、CSS解析成功、noEmit；其生成脚本只读审查，**没有执行开发脚本**。原完整argv、stdout/stderr见audit与自有 `auto-receipts.json`、`auto-oracles.json`。

## 本角色实际执行

所有完整argv/cwd/PID/exit/UTC/完整stdout/stderr在同前缀 audit及自有计时收据。耗时取自有outer含child区间，二者不双计；人工审阅/编辑不当子命令耗时。正式释放后首次工具起点 `03:14:46.356Z`，通知接收无工具绝对时间不补造；report写前检查点 `03:17:21Z`。

| 实际命令步骤 | 2026-10-23 UTC起止 | exit |
| --- | --- | ---: |
| 自有plan读回子检查 | 03:14:46.356 → 03:14:46.403 | 0，receiptReread=true |
| handoff / seal收据 / external-policy读取 | 03:15:16.314 → 03:15:16.505（并行区间） | 各0 |
| 独立CSS / TSX `diff -u` | 03:15:30.820 → 03:15:30.899 | 各1，真实有差异，非测试失败 |
| AUTO收据读取 | 03:15:30.819 → 03:15:30.985 | 0 |
| `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` | 03:15:31.239 → 03:15:31.348 | 0，注册13+23静态绿，未注册SKIPPED |
| 自立有限38件/附加收据/注册13 SHA核验 | 03:16:27.010 → 03:16:27.139 | 0 |
| 冻结CSS/TSX完整 `nl -ba` | 03:16:27.008 → 03:16:27.169（并行区间） | 各0 |
| 原oracle/type生成脚本只读 | 03:16:27.664 → 03:16:27.729 | 0 |
| 校指纹后code-review只读 | 03:16:54.158 → 03:16:54.165 | 0 |
| 自有首次final-seal | 03:20:00.399 → 03:20:00.464 | 1，结果/收据同名冲突，非产品失败 |
| 修正结果命名后同有限证据回核 | 03:21:04.667 → 03:21:04.748 | 0，不扩源/依赖，未重复产品测试 |

**规范轴：** 0个新问题；限定现人员scope，既有token/两列/断点/前姓名规则保持，无新抽象或事实副作用。

**合同轴：** 0个源码范围新问题；允许的收缩/两卡/排期span/点span/容量均实现，禁改公式/事件未入diff。视觉消红不是源码结论，仍待原GUI。

Vendor试点：taskKind=delivery；外部policy先读、static0、注册13独立SHA/bytes相同后加载锁定 `code-review`（commit49dd158d1076134a641b33efb035946536778336），仅规范/合同两轴；setup/Git/worktree/子代理/外部跟踪器步骤按父边界跳过，不引入外部Skill替代独立门。

## 封件与 Main 接续

当前报告内容先落，最终 `seal.json` / `readback.json` 由自有finalize工具产生；**只在独立check子实际0、receipt真实reread后为 STOP / released**。最终exit/PID/UTC以真实readback为准，不在报告内预填。封条不含自己或后生成收据，避免循环。

保留准备期设施错误：login=false工具拒绝未执行、rg127、memory入口ls1；早期工具无绝对UTC不回造。当前实审没有产品测试FAIL；两次diff1不洗成0。无产品/他测试/livingdocs写、git/fetch/install/fullbuild/lib/browser/desktop/runtime/profile/正式/业务动作，没有全树hash或依赖copy。

首次自有seal失败是计时receipt与结果同名，导致审计生成后读到错误对象；修正自有命名并回核同38件。保留失败 `final-seal.json` 完整stderr/实际1及首次不完整audit另存，不把它当封件成功。纠正时直接工具读回自有文件只有工具wall time，无绝对UTC；这几步明确不补造。最终封件/回读另取真实记录。

Main可据有限SOURCE门及本角色实际释放收据统一freeze；唯一整build、完整回归与原F1/FL、FD四宽/轴wheel横滚实采仍归Main，F1/FL真实MAX10缺口、FD MAX8及旧四宽FAIL维持。GUI未验不代通过、不提交、不push/release/正式切。
