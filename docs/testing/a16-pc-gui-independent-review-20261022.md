# A16 PC-G01/02/03 修后独立 GUI 有限审证

> 2026-10-22，平台 trae，独立测试专家，非开发、非 GUI 执行端。供 Main 接续既有 G04/扩展采证；只对本报告绑定的封存分支签有限结论，不签整项 AI04、提交或发布。

## 1. 有限结论

| 用例 | 本轮独立结论 | 精确覆盖 |
| --- | --- | --- |
| PC-G01 | **有限 PASS** | 新真实三步计划→最小化→正常 TaskForm 改派、主保存→展开陈旧草稿→明确整批；原 base，s1 冲突、s2 依赖拒、s3 独立真实写入；t1 外改后原 JSON 字节保全 |
| PC-G02 | **有限 PASS** | clean-r2 新计划，初态 t1.progress=11/t2.progress=35；同目标 s1/s2 链式成功，独立 s3 成功，真实 3 步落盘 |
| PC-G03 | **有限 PASS** | 新草稿→正常外改→明确逐步；s1 返回 kind=success 但应用0，s2 不发送，s3 独立真实应用；原 base、文案、账本与原 JSON 一致 |
| G04 相关 min/clean undo 子项 | **有限 PASS** | clean-r2 本轮新 handle 应用后最小化/展开保入口，真实点击撤销3项，t1/t2 原 JSON（含 updatedAt/资料/修订/软删历史）逐字节还原 |
| clean 首轮采集 | **BLOCKED（设施，保原 exit1）** | 旧展开标签选择器失败、尚未新 ask/apply；不判产品 FAIL，不洗成 exit0；独立 clean-r2 补采另签上述结论 |
| G04 其余/四扩展 GUI、整 RA-AI04/AI05 | **NOT_RUN（本审证范围外，整门不放行）** | 勾选/编辑/取消/再生成、四扩展 update 实际冲突/clean、changed/mixed undo 等未在本 sealed 包采证；Main 后续新 branch 不纳入本结论 |

历史 A14 PC01 GUI FAIL、PC02 失败分支 GUI NOT_RUN、A15 parent 四红及原严格 task-only 整表 FAIL 全部保持原候选归属。上述是新 A16 对象的有限修后结论，不覆盖/撤销原报告，不把 Main 原 ROLE/boundary 当成 Main 的 PASS/FAIL 裁决。

## 2. 授权与有效合同

负责人本次原句要点：

> 独立PC-G01/02/03修后GUI有限审证，非开发GUI端。用户持续全未验/独立分工授权。只docs/testing/a16-pc-gui-independent-review-20261022*；禁产品/其他testing/livingdocs/build/install/GUI/services/credentials/commit。
>
> Main继续后续G04/扩展新branch，gatewayrequests可能append；仅本sealed请求读/保护，不因新append冒原文件篡改，不stop。不要操作实例/新调用。原ROLE只是raw采不是Main verdict；原工具parents未捕final不造0。报告精确原exit证据边界/保护后释放。

本角色只写本前缀报告、两份只读审计脚本及自有审计 JSON。不 fetch/pull 合并在途树，不运行产品、build/install/测试套件、GUI/网络/模型/服务，不读取 private 入场 URL、浏览器连接文件、profile/认证头/密钥，不 commit/push，不同步 livingdocs。通用 SOP 中会越过本批边界的动作未执行。

依据：[AGENTS §6A](../../AGENTS.md)、[collaboration §9/§11.3–11.5](../collaboration.md)、[RA-AI04/05](remaining-governance-cases-20261021.md#1-ai来源失效与确认守卫)、[A14 原合同 §4](a14-preconfirm-conflict-contract-20261022-plan.md#4-main-修后复验合同本次-not_run)、[A14 原 FAIL](a14-preconfirm-conflict-contract-20261022.md)、[A15 SOURCE/AUTO](a15-preconfirm-independent-retest-20261022.md)、[A16 SOURCE/AUTO 与新版 Oracle](a16-extension-base-independent-retest-20261022.md)。

生成快照原 base、确认前外改拒相关及依赖、应用0不算前置成功、独立继续、成功同目标链式推进要求未改。新版 PC 自有用例仅 `selectedBase` 补八个合法 m/ri/dlv/mtg 键；本轮独立复算其余全文相同，原专家文件 SHA=`18093da170e61c626ee434abe1fb467fc7b68da0727e7b6edfdb0b8de149c0da`。不删原 expect、不改 fixture、不借新期望豁免真实守卫退化。本轮未重跑旧/新 AUTO，继承的是同源码独立 A16 的有限结果。

## 3. 候选、来源与真实装载

证据根：[A16](../../reports/all-pending-evidence-20261021/A16/pc-index/inputs.json)，Main 封存索引 **989 项**，全部 bytes/hash 复算一致。gateway 活跃文件仅校 sealed 前缀，后续追加不是篡改。

| 身份 | 实际值 |
| --- | --- |
| 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，dirty 集合另认领，不以 HEAD/version 代表候选 |
| 唯一构建树 | `/private/tmp/pmtool-a16-closure-20261022` |
| runtime（只从非密原证认领，未操作） | `/private/tmp/pmtool-a16-governance-runtime-20261022` |
| 宿主（manifest 认领，非本轮上游审计/授权） | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2` |
| gateway/host | `3246 / PID43579`；`3247 / PID44014`，来自 ready/host-start-r2，非本轮存活探测 |
| candidate SHA256 | `284dfbf509bcb286a935d60f3d6dc07161c1fbc3dcbfb6e6165f91f29fdadadb` |
| tracked patch SHA256 | `be49baaee1850b169933cce31fb27cf51675805fe9aeaa1a14a683f70e851360` |
| sealed inputs SHA256 | `2551c6bcb942957dd4d8f9651ee4475be272be4a07eacf96f1162a702919827d` |

独立核 **519 声明输入、453 产物**全部匹配；其中 **495 个插件输入/完整387个 src**与 A16 独立 SOURCE/AUTO `r1/new/frozen` 逐文件字节一致，路径集合相同，patch SHA 同一。其余24个声明输入按本轮 candidate 单独核，不冒充独立插件测试覆盖全部 launcher 输入。

[loaded/result](../../reports/all-pending-evidence-20261021/A16/final/loaded/result.json) 与 actual 原状态相同。按原宿主载入规则从实际 lib 归一化尾部调试 URL、补换行及分号后，完整唯一 client 段复算：

| 字节/上下文 | 独立复算 |
| --- | --- |
| 完整 uncached combo | **2,583,245 bytes**，SHA `0fab03b720bceadceae2204a5916bf826bb1bb03eabbe94865a1c31d57cfb3aa` |
| 原 lib/client.js | SHA `32ba861cde983dedeeaf171ae45da9a5f57dfb2bab9d506fd22dba492b50c738` |
| 完整 client 段 | **1,704,413 bytes**，SHA `e7db7986c05575ed46815d6b153411028d9ce447f6df5c00c3cdc38f42185a0a` |
| 段位置 | `first=875361, second=-1`；不是源码关键词命中或 HTTP200 替代 |
| request/frame/target | `44174.126` / `3712802793249D4D6625CB0247CD2A86`，frame=target；`fromDiskCache=false` |
| 实际页面 | `origin=http://127.0.0.1:3247`，context=`default`，`timeOrigin=1792625471494.4` |
| 首 loaded 时点 | `2026-10-21T23:31:13.586Z`，早于本三条实际 ask；所有本轮状态 origin/timeOrigin 相同 |
| 视口/主题 | 1440×900、body 深色=true；首 loaded DPR1，后分支原状态 DPR2，不冒充浅深/缩放矩阵 |
| pilot 实际采集边界 | **NOT_CAPTURED**：原 actual/分支 JSON 未序列化 pilot DOM 属性；原 `observe` 源码亦不采该属性。缺字段不等 OFF/false，不凭默认/source补造运行值 |

PC 原合同没有 pilot 专属要求，缺 pilot 属性不否认该实际经典副驾路径；但本报告不给 pilot 开关、pilot专属 UI 或全矩阵 PASS。没有独立 editor chunk 新请求/入口认领，也不扩大为编辑器装载 PASS。

## 4. 合法初态与写入链

seed 使用原 F6 标准备份，生产 UI precheck→两次显式确认；原 seed exit0仅为采集退出码。独立目视 precheck/first-confirm PNG，核 before/precheck/first-confirm 根清单相同（data2/files0/backups0），恢复后 data18。原备份中 11 个五类实体与 normalize.initial-raw 逐 record 相同；原旧账本1条、refs10保留，不是假 refs 或新生成来源认领。

之后 `normalize` 与 `normalize-clean` 真实正常 TaskForm 主保存：t1.progress11、assignee=`A16 原始执行人`，t2.progress35。两组各两条真实 `task update` run/done、草稿/保存 PNG、raw/roots齐全；未保存草稿零业务写。不是手改 JSON 或调用隐藏业务 RPC 改初态。

模型采证走 production 车道、隔离确定性 gateway，非真实云模型质量测试。sealed requests 原 **14,400 bytes，SHA=`58a6c8e2839a829ac9b92be8a9a82f09c3539525bff9635468c80e36be7047e5`**，恰3条对应 conflict/clean-r2/stepwise-conflict；原 BODY 含实际11/35/负责人/资料与五类实体，`model=deepseek-v4-1-flash-260910, stream=true, behavior=success`。ask done 返回原 plan，不人工拼页面计划；不读 headers/key，未用追加请求为本批签证。

29 个 raw 快照共 **429 文件**，每个文件 SHA 与该时点 roots `/pmtool/<table>/<id>.json` 一一相同；六表含 settings，非只看任务最终值。所有生成→草稿、未提交外改草稿、仅展开/最小化的业务写边界分别核对；模型车道设置/宿主 session 与合法 ledger/idempotency/pending 写不混成“全 data 零写”。

## 5. 三个 GUI 分支与 min/undo

### PC-G01：整批确认前冲突

原 conflict events：ask seq27/28、正常主保存 seq29/30、snapshot31/32、整批33/34、undo-list35/36、snapshot37/38、provenance39/40；每个 run 的 commandId 只有一个对应 done，顺序一致。

- 草稿十键 base 中 t1=`2026-10-21T23:31:42.021Z`、t2=`2026-10-21T23:31:42.846Z`，与生成 raw 完全相同。
- 正常外改后 t1=`2026-10-21T23:32:07.421Z`、负责人=`A16 确认前人工改派保留`；主保存仅 assignee/updatedAt 变化，展开仍原草稿且有陈旧提示。
- seq33 仍传原十键 base，needs=`[]/["s1"]/[]`；seq34 明确“应用1、未执行2”，原因是 s1 外改、s2 依赖未执行。
- external-saved→expanded-stale→result 的 **t1 完整原 JSON bytes 相同**；包括附件、pl-1三修订、pl-2两修订/deletedAt、所有字段与 updatedAt。
- t2 真实35→44，updatedAt→`2026-10-21T23:32:07.850Z`；只改变 progress/updatedAt。新 ledger 恰1条、ref/postimage仅 t2，无 s1/s2 假落库来源；旧 entries/历史相同。

### PC-G02：无外改三步链式成功

原 clean-r2：新 ask49/50、整批51/52；初态 t1/t2=`11/35`，十键 base=`2026-10-21T23:33:06.167Z / 2026-10-21T23:33:07.335Z`及原八扩展键。一次明确整批、原 needs不变。

seq52真实“应用3步”；t1到 in_progress/73/确认守卫建议甲，只有 status/progress/assignee/updatedAt改变；t2到44、updatedAt=`2026-10-21T23:34:00.760Z`。新账本 postimages=`t1,t1,t2`，第二 t1 时间严格晚于第一，证明同目标链式成功，不是固定旧 base 把 s2误拒。旧 ledger entries 原样保留，资料/修订历史未变化。

### PC-G03：逐步0应用、依赖不发、独立继续

原 stepwise-conflict：新 ask63/64、正常 TaskForm 保存65/66、snapshot67/68；t1外改=`2026-10-21T23:34:23.810Z`。

seq69/70只发送 s1、原生成十键；返回 kind=success但“应用0/外改未执行”。**没有 s2 ask-apply**。seq71/72只发送 s3，仍原全部十键，真实“应用1”；不是重读全部目标后洗白基线。

t1 external-saved→result整文件相同；t2真实35→44、updatedAt=`2026-10-21T23:34:24.991Z`。new ledger恰1条、refs/postimages仅t2；可见原消息逐项“s1应用0/s2依赖跳过/s3应用1”，与命令和落盘对应。没有把原成功 kind 当前置已应用，也没有伪造跨调用后端依赖记忆。

### 本轮 fresh clean undo 最小化保留

clean-r2 result→applied-hidden→retained-undo业务/files/backups不变，hidden侧边标签真实存在。展开后原可见按钮“撤销 · 整批 3 步”可用；PNG停在消息位置时按钮在内滚下方，**不是凭 DOM 存在就判可见**：原 compositor帧 `000032.jpg` 实际完整显示按钮并可点击。

本轮新 handle=`undo-mvir0swb-za1v5g`，来自刚完成的 ask-undo list/新ledger；seq59/60真实只调用它并“撤销3项”，非调用历史旧handle或RPC捞句柄。t1/t2 undone bytes与draft bytes **完全一致**，不是只还原11/35；包括原 updatedAt、全部资料/多修订/软删历史。五类业务其余及files/backups不变；settings合法保留ledger/idempotency/pending痕迹，新ledger audit追加undone、undo.used=true，旧 entries仍保留。

不证明 changed/mixed undo、旧handle过期/跨重启、重复undo、全部历史句柄行为。

## 6. 实际图像与原帧

六分支 compositor帧总 **309/309 SHA匹配**：normalize46、normalize-clean48、conflict107、clean3、clean-r2 36、stepwise-conflict69。仅声明全部hash校验，**没有宣称309张均逐帧目视验全样式**。

独立直接打开原 PNG：loaded.actual；seed.precheck/first-confirm；conflict.external-saved/expanded-stale/result；clean.failure；clean-r2.result/applied-hidden/retained-undo/undone；stepwise-conflict.expanded-stale/result。

独立直接打开代表动作的原 JPEG：conflict `000093/000101`（真实编辑主保存/明确整批）；clean-r2 `000029/000031/000032`（hidden/展开消息/内滚后真实undo控件）；stepwise-conflict `000061/000062`（原草稿/执行前控制）。结合 actions 时间、全部帧索引及完整run/done回读，不能只以单截图或口述证明旅程。

原 `visibleResult` 只切“只读诊断”，对原消息 `scrollIntoView`；未改text/DOM/结果样式或注入假消息。六分支原 console arrays均空，只有本次监听时段零捕获，不等 loaded之前或全机无警告。限定1440深色鼠标旅程，未给键盘/读屏/其他主题/200%/四视口或全页面样式、UX独立PASS。

## 7. 原命令退出码及环境边界

本轮只读审计执行环境：macOS，既有 nvm Node **22.23.3**。本角色未执行pnpm。原 build脚本环境指向同Node22、隔离HOME/TMPDIR/cache；原日志实际出现 **Corepack下载pnpm12.14.0**，不能据通用项目说明补称本批实际pnpm11.28.5。

| 原采集命令/分支 | 原证结果 | 边界 |
| --- | --- | --- |
| `pnpm exec tsc --noEmit` | exit0 | 完整产品配置类型检查，不等全部测试类型检查 |
| `pnpm run build` | exit0 | 本轮A16产物另核453项；旧lib保护另核 |
| `pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` | exit0；148 files/1522 tests passed | 原suite结果，不替代GUI |
| `node scripts/verify-isolation.mjs` | exit0；95条原stdout逐项“退出码0”、失败0；WATCH before5/after5、污染0 | 95条完整原行已保存在本审audit.originalCommands.guardRows；非全机零污染 |
| `node scripts/test-isolation-guard.mjs` | exit0 | guard设施自检 |
| launcher `pnpm test` / `pnpm run verify` | 0/0；56 passed/0 failed/0 skipped | 不扩大launcher GUI |
| seed | exit0 | 原标准备份两确认采集，未另造restore command event序列 |
| normalize / conflict / normalize-clean | 0 / 0 / 0 | 原分支落盘退出码，不是Main verdict |
| clean / clean-r2 / stepwise-conflict | **1 / 0 / 0** | clean失败=`TypeError: Cannot read properties of null (reading 'click')`，命令事件空；补采单独归属 |

**重要保真**：build/noEmit stderr含pnpm自动运行前依赖验证失败：“workspace hoist directory is not a real directory”，随后警告依赖可能不同步，业务脚本仍实际exit0。原日志/错误均保留，不称“install通过”或“环境无警告”，本角色不修安装、不build。当前输入/实际产物与独立冻结逐字节匹配，因此上述有限GUI证据有身份链；安装复现/包管理器环境仍不是本报告PASS范围。

guard源码明确排除自身与 `verify-real-model.mjs`；本批95条不能写成“含真实模型全部97验证通过”。真实授权模型 smoke本包未运行/未签，不自动改成MANUAL_PENDING。原coverage stderr保留的React key/监听器/设施警告不被六分支console空洗掉。

原build/full-verify `.exit.json`保存精确argv/cwd/env/start/end；本audit保留全部原对象与95行。原GUI命令不是OS进程退出码，按seq/commandId/kind/text独立核。**原工具parents未取得末态码仍NOT_CAPTURED**，不由子exit0/文件落盘推定父exit0；本报告不制造新父历史。

## 8. 本轮验证、保护与释放

只读入口（macOS，仓库根；输出存在即拒绝覆盖，重审应另建本前缀新审计路径）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a16-pc-gui-independent-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a16-pc-gui-independent-review-20261022-audit.mjs before
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a16-pc-gui-independent-review-20261022-audit.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a16-pc-gui-independent-review-20261022-supplement.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a16-pc-gui-independent-review-20261022-supplement.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a16-pc-gui-independent-review-20261022-audit.mjs final
```

两语法检查、audit、supplement均工具实际exit0。before工具返回execution ID后未取得工具末态，记 **NOT_CAPTURED**；已实际回读before完整8366文件保护清单，不拿此回读补造父0。final原码以实际工具结果及[final.json](a16-pc-gui-independent-review-20261022-selftmp/final.json)为准，`released=true`是本审证释放记录。

[audit.json](a16-pc-gui-independent-review-20261022-selftmp/audit.json)保存989/519/453、完整client复算、每分支实际退出码、全部run/done/actions/console/帧索引、原base/plan/新增ledger/任务全字段/原根变化及全部原命令；[supplement.json](a16-pc-gui-independent-review-20261022-selftmp/supplement.json)保存495输入继承、29快照/429raw对根、合法种子继承、原Oracle全文比较及pilot未采字段；[before.json](a16-pc-gui-independent-review-20261022-selftmp/before.json)及final是hash/bytes/mtime原位保护，不是只看产品最终状态。

保护包含：main旧lib、A12/A13/A14旧lib、A14全部原证/失败；A16声明输入/产物与sealed989原件（活动gateway分开）；A14/A15/A16相关专家原件/旧冻结/原失败，AGENTS/collab/治理合同。本轮未覆写任何这些文件。**A11旧lib路径不在盘上**，错误猜测的20261022路径不存在，随后按旧专家脚本核真实20261021路径亦不存在；不补造删除原因，不称保护了缺失目录，不因此判本轮产品污染。未核所有全局cache/间接依赖/正式data/profile/上游或全机，不声明全机零污染。

gateway保护区分两层：sealed请求前14400字节按索引hash；开审时已增长到24017字节，将**当时已有24017字节**及events已有1510字节纳入前缀延长保护。final只要求已有前缀不变、允许新增后缀，新增branch不进入本签证、不得以全文件hash不同冒称原证篡改。

本轮设施错误均未隐藏：`rg`不可用127后使用find/grep；两个既定记忆路径不存在1；误查frames.ndjson不存在1后使用实际frames.json；旧A11路径查询不存在1；只读查pilot无匹配grep1不是产品FAIL；临时find遇挂载目录permission denied返回1未提权/重试操作挂载。审计主断言和supplement无失败，不降期望。

本专家没有产品/builder/GUI/端口或runtime写锁，没有新起服务或模型调用，不停止Main/正式进程；完成后释放本前缀审证执行。后续由Main按**原G04/四扩展用例**继续新branch采证，独立专家另审；本报告不让未采证项变绿，不授commit/push/发布，不要求Main先停实例。
