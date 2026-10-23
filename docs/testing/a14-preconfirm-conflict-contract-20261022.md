# A14 确认前冲突独立核定

> 2026-10-22；平台 trae；独立测试专家。给 Main/开发与后续复验使用；授权、冻结 Oracle 与修后用例见[先行合同](a14-preconfirm-conflict-contract-20261022-plan.md)。只写本前缀，不开发，不改产品/副本后自签。

## 1. 有限结论

**PC01：P1 有效产品缺陷，SOURCE/AUTO FAIL，原 GUI 确认前冲突分支 FAIL。** 原计划生成后正常 TaskForm 保存负责人，原草稿确认却送最新 baseline，覆盖刚保存的外改；不是正常行为，也不是新需求。

**PC02：P1 既有逐步依赖守卫缺陷，SOURCE/AUTO FAIL；该失败分支 GUI NOT_RUN。** 真实 React 在第一步返回 `kind=success` 但 `已应用 0 步` 后，仍把依赖 s2 以 `needs=[]` 发送。这是明确标注的 transport 故障注入，不把原 stepwise 全成功旅程冒充失败 GUI 实测。剥 needs 本身不能独立证明缺陷；缺陷是同时没有前置成功判断、仍推进依赖并重盖基线。

两项均已有合同要求，不凭猜测扩修。**不签完整 RA-AI04、修后 GUI、其他原生/矩阵或整包 PASS；不发布/提交。** Main 可继续不受影响的既有采证，开发仅按已授权确证修复及[先行合同 §5](a14-preconfirm-conflict-contract-20261022-plan.md#5-最小修复建议与停止条件)有限处理，测试与开发继续分离。

## 2. Oracle 有效性

- [RA-AI04](remaining-governance-cases-20261021.md#1-ai来源失效与确认守卫) 原句：“同目标链式baseline正确、外部改动拒相关步及依赖、独立继续”。
- [CMP 冻结口径 §0.6/0.7/0.8](copilot-multistep-acceptance.md#0-冻结口径设计契约--p0-裁决以此为准开发不得越线)：原始 baseline 比较、真实外改拒相关及下游，覆盖整批/逐步；CMP-CONFLICT-01 重申。其旧 PASS 绑定旧对象，不证明 A14 GUI 当前送 base 正确。
- [产品合同 §六](../product/08-copilot-multistep-design.md#六冲突重读链式-baseline)：计划生成快照原样透传；stale 只提示、不自动重发模型。K13 最新状态只读投影不是执行基线。
- `decision-log.md` ADL（v0.4.1-integration）要求确认时后端重读/检测 updatedAt；ADL-054.2/.4 扩实体仍要求跳过、不覆盖外改。后续 #22/K2 只扩有效写面，没有撤销冲突守卫。

未发现允许确认时静默接受外改、或“陈旧提示+整批确认”即特批覆盖的有效决定。未用待表决设计矩阵或新的冲突明细页要求倒推 FAIL。取消、无自动补偿、合法同目标成功链式执行继续沿原合同。

## 3. 原 GUI 证据链

原根为 `reports/all-pending-evidence-20261021/A14/final/conflict/`；Main 是采证者，本专家只读审证。原 `exit.json exit0` 仅表示采集完成，不是 Main 自签 PASS/FAIL。

| 原时点/事件 | 原始事实 |
| --- | --- |
| draft，seq75/76 | 新正常 ask 经隔离 production gateway 返回3步：s1 t1 status=in_progress/progress73；s2 t1 assignee=新句柄撤销甲、needs[s1]；s3 t2 progress44独立 |
| `draft-t1.json` | 生成时 updatedAt=`2026-10-21T22:29:06.929Z`；与 initial 字节事实一致 |
| actions `minimize-before-external-save`、`normal-main-save`，seq77/78 | 正常用户 TaskForm 保存 assignee=确认前外部改派保留；更新时间=`2026-10-21T22:29:16.692Z`；不是手改库/RPC旁路 |
| external-saved，seq79/80 | 原 snapshot、raw t1 与保存结果一致；主表正常显示外改；t2未外改 |
| expanded-stale-plan | 原3步仍在、s2旧建议仍在，出现“你打开草稿后台账有变化，确认时将逐行重新核对” |
| explicit-conflict，seq81 | 整批命令却送 t1 base=`2026-10-21T22:29:16.692Z`，等于外改后当前值，不是生成原值 |
| seq82、seq85/86、result-visible/raw/ledger | 返回“已应用 3 步”；t1负责人变回新句柄撤销甲；原新账本 postimages 依次记录外改后负责人→建议负责人，真实覆盖；t2真实dispatch |

完整原 events/actions/raw/ledger 相互校验见[original-audit.json](a14-preconfirm-conflict-contract-20261022-selftmp/r1/original-audit.json)。独立目视原 `external-saved.png`、`expanded-stale-plan.png`、`result-visible.png`；同时校验 conflict/stepwise **76/76 原帧 hash**。未逐帧给样式/焦点/全旅程 PASS，不新开浏览器、不重新操作服务。

三个关键状态与原 loaded 同 `origin=http://127.0.0.1:3245`、`timeOrigin=1792621414936.9`；原 loaded target=`F3D7C0806992644F07EFE3B011B7C604`，viewport1440×900、pilot=off。完整 uncached combo **2581698 bytes**、SHA256 `b30de32c9e74f28e0fb1213e71476eeffa8a719c32e036c5b176b9ed8bcc773f`；缓存标记false。独立从冻结 lib按原载入规则复算完整唯一 client段（移除末尾调试URL、补换行分号），不是只搜源码子串。client原字节SHA256 `8e245e9da8a5a720617f305f5875c343662b4727513e2a21474902ee7d53d056`，segmentSHA `59b27555e5516020fba3cce8ae5b63937d77e66f0be77b680f9657d5cfbec658`。

gateway 原 request BODY含该问题、behavior=success，ready仅登记pid25060/port3244；不读 headers/key，不探测当前服务。原 s1/s3 的状态/进度初态已同值，不能凭最终73/44说未执行；命令结果、updatedAt推进和账本证明应用。外改后到最终 t1仅 assignee、updatedAt 改变，附件/进展多修订及软删历史均保留；这不减轻负责人被覆盖的缺陷。

## 4. SOURCE 因果与限定范围

`src/client/shared/drawers/sidecar-portal.tsx` L380 在生成时保存 openedAt；L415仅供staleHint；[L419–449](../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx#L419-L449) 执行初值却为 `let base = { ...baselineMap }`，该 props由 `panel.tsx` L1483 根据当前 tasks生成。真实正常保存触发snapshot刷新后，确认前外改被洗进新base；后端与它比较当然放行。

逐步 L441–449 无已应用集合或前置成功判断，`forStepwiseApply` 清needs后每步都发；随后整项目snapshot重盖base。原 stepwise seq53/59/65确实都 `needs=[]`，但原三次都“已应用1步”，**仅证明成功路径，不证明失败级联正确或失败 GUI已测**。PC-A02专门隔离此分支，不提议后端跨调用永久保存计划，不锁死成功后合法同目标链式推进。

后端 `commands/ask.ts` L392 已比提供的base，L457–470按appliedStepIds拒依赖、成功后只推进成功目标base。此轮没有证明后端在正确base下失守，因此不要求改后端/schema/模型/TaskForm/其他页面。追加文件须说明必要性，不因本报告扩成新产品能力或重做最小化结构。

## 5. 独立最小红

签字测试对象：A14 原冻结树完整385个 src文件，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 加原 tracked patch SHA256 `1746ea63883466106ed8c33a6c6aeecf43dee887b780b026efeee3e8564a8041`；A14 manifest SHA256 `f89160400a28ba78af722303c01fe9caf3f596657b3d9767f4984a3569d85284`。全部 **515声明输入/453产物**核验一致，不以 HEAD/包version代替dirty候选。宿主原提交 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`另记，不修改或代授上游权限。

自有 src清单SHA256（排序文件对象含hash/size/mtime）`2644838c9b29eb5f943f0530201652bb636c75743abfc5eb922ef74116e42bef`；真实完整 src复制并逐字节相同，无产品补丁。关键文件：

| 文件 | SHA256 |
| --- | --- |
| sidecar-portal.tsx | `a3a5e70e459fd74b3454757bcd419e7a2e44b8adce41685dc522dcc494c0ab5d` |
| panel.tsx | `0d2a4560e74adb137084d2e37b34625e4b2e5b1801ec76e72fce5b689ccffe03` |
| core/copilot.ts | `9059ab4de0c46398c180f24a9928f4b2de670fee5a2cdc5d317ea26e5a389c25` |
| commands/ask.ts | `3db897be1275cbbc2473f73e8eb71bb061365a2ddd882008b33698972905bf26` |

| 用例 | 原exit | 独立结果/失败点 |
| --- | --- | --- |
| PC-C01 | 0 | 控制PASS：真实PmPanel/CopilotPanel合法三步，首次整批传原base和needs；生成前无apply |
| PC-C02 | 0 | 控制PASS：同真实组件能完成逐步三次发送；只判设施/前端，不判桩后的落盘 |
| PC-A01 | 1 | AUTO FAIL：真实最小化/正常TaskForm主保存/展开保同子实例、保原草稿与stale；最后发送base为`.692Z`，应为`06.929Z` |
| PC-A02 | 1 | AUTO FAIL：首步“应用0步”后实际发送[s1,s2,s3]，应[s1,s3]；独立s3路径确实可执行 |

失败仅发生在最后的既定行为断言，非装载/selector/合法性异常。expect未降低；真实生产schema验证原初态/外改记录、parse/validatePlan原ask，非手拼计划。只mock浏览器设施和transport，网络fetch明确拒绝；没有host/RPC/模型/业务写、没有真实undo调用。PC-A02只注入返回和后续真实形状snapshot；不能拿它证明真实服务失败/落盘，也不能拿控制的假成功返回自签后端PASS。

## 6. 命令与保护

环境 macOS Darwin24.6.0 arm64，既有 nvm **Node v22.23.3**；React/renderer18.3.1、Vitest2.1.9、Vite5.4.21、Zod4.6.5。无pnpm/install/build/noEmit/full verify/GUI服务动作。单fork、`--no-cache`、白名单环境无凭据，HOME/TMPDIR/cache/runtime全部本前缀。每个命令精确argv/cwd/env/start/end/原exit/signal与stdout/stderr/reporter见[commands.json](a14-preconfirm-conflict-contract-20261022-selftmp/r1/commands.json)及对应 `PC-*.command.json`；每次只跑一项，其余3项skipped不当PASS。实际测试区间UTC `2026-10-21T22:34:47.872Z`–`22:34:55.893Z`，本地2026-10-22。

实际入口（macOS、仓库根，保留r1原证，重跑必须新rN）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a14-preconfirm-conflict-contract-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-preconfirm-conflict-contract-20261022-run.mjs r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-preconfirm-conflict-contract-20261022-check.mjs r1
```

语法检查exit0。父运行工具返回execution ID后未取得原末态码，登记 **NOT_CAPTURED**；不能推定父exit0。实际四个同步子命令原码0/0/1/1、末次summary与保护审计完整落盘；后续精确进程查询无本测试进程（grep无匹配exit1是查询结果，非产品失败）。父 `controlsGreenRedsReproduced=true`仅表示预期控制绿/产品红对照，不把两红转PASS。

只读前置查Vite顶级链接ENOENT exit1，随即定位Vitest实际传递依赖后复用，未安装；不计产品失败。后置报告只读摘要首查误加`src/`键前缀exit1，改成相对src键后查询exit0；不改测试/源/失败记录。

自有交付check首轮exit1：L40 `4 !== 1`，因为reporter未执行项实际是`skipped`，仅排除`pending`把它们错计为已执行。只将自有check过滤限定为`passed/failed`，原四测试/原reporter/全部expect不改；设施失败保留于本段，不作为产品FAIL。修正后的末检结果、原子命令退出码复核、无测试进程、两脚本语法检查、四种生成前后raw字节一致及延长保护见[delivery-check.json](a14-preconfirm-conflict-contract-20261022-selftmp/r1/delivery-check.json)，不替代产品两红；文档状态更新不改冻结内先行计划。

[audit.json](a14-preconfirm-conflict-contract-20261022-selftmp/r1/audit.json)及[protected-manifests.json](a14-preconfirm-conflict-contract-20261022-selftmp/r1/protected-manifests.json)：main src/lib、A11/A12/A13/A14 lib、A14 src、loaded/conflict/stepwise/gateway原证、六个实际依赖包及六处共享缓存hash/mtime漂移0；自有冻结与合同输入漂移0、A14声明漂移0。主树额外tracked patch/新文件清单单列，不重冻旧失败；未检查正式data/profile/上游/全机资产，不声称全机零污染。

证据SHA256：commands `33116bd8860b4bf035977f7daeba2193574d32a601680554135ef9441c81df1a`；audit `dc345ccb380ef7ea5e65a2498ee1b3c22a601fdc34dadd9eaed0d90f201a99c6`；protected `945f0995bfdaf2bcc3a050e4a59e5a97def0e79356782fb0cc931bf375cb1551`；original-audit `c5c02b2d2660d40f1ff0a0cd40d0a6fffaa50d181bd49409d3c4843034da2762`。

## 7. 交回

本专家未占产品文件、builder、GUI、端口/profile或服务；测试进程已退出，原失败/原测试/原冻结全部保留。合同PC-G01..04是修复前已冻结的后续复验步骤：新源码/产物/真实实例认领，先控制和原两红转绿，再Main按原合同采新GUI、专家审证。Main不得用旧后端PASS、旧SM01有限PASS或本次已采截图替代新确认守卫GUI；不RPC补旧undo。无关原生/矩阵可继续，当前FAIL不得扩大或洗成整项PASS。
