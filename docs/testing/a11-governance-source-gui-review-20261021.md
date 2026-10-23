# A11 独立审证：A10 来源治理 GUI

> trae，独立测试专家；2026-10-22 本地凌晨审证，文件日期保留父批次 20261021。只审 RA-AI01..03 的 A10 原件，不执行 GUI、产品、构建、服务或真实模型，不读凭据，不改旧报告。最后普通 commit 由 Main 统一处理，本专家未 commit/push。

## 1. 判定

| ID | 本次有限可签范围 | 完整 GUI ID 状态 |
| --- | --- | --- |
| RA-AI01 | 非空十来源与真实生产 F6 对齐、十个目标表单标题/项目一致、归档跳转区间 data 指纹零变化，有限采证 PASS | **FAIL**：AGUI-01 来源行未显示来源 ID；另有装载绑定、逐跳返回/重进及同名场景缺证 |
| RA-AI02 | 正常 TaskForm 主保存后 changed/needs-regen、失效弱化、不计有效；第二次重校 history 1→2、旧前缀与非 history 字段不变，有限采证 PASS | **BLOCKED**：装载完整绑定、首保存原 task 前后字节、刷新/新进程回读及四消费点无自动重调原证未齐 |
| RA-AI03 | 正常删除 t-0002、保旧 ref/台账、missing/人工复核、无该源跳转按钮；两次实际重校 history 2→3→4，有限采证 PASS | **BLOCKED**：完整装载绑定与原命令请求/回包缺证；不把截图中的“不跳转”扩大为全实体导航守卫验收 |

**没有整 ID PASS，也没有三项整门或 32 项整体 PASS。** 其余 29 个治理 GUI ID 未在本次采证/审签，保留 NOT_RUN；真实模型不在本任务范围，不改为 MANUAL_PENDING。作者 1313/95 及旧独立 AUTO 不替代这里的 GUI。

## 2. 授权与冻结

- 父授权原句及 Main/专家分工见 `reports/all-pending-acceptance-execution-20261021.md` §1/2；本次用户明确限定只写本报告同前缀，不同步改 living docs、旧报告、产品或其他专家成果。dirty 主树保留，不 fetch/pull、安装、build 或提交。
- 合同：`AGENTS.md`、`docs/collaboration.md` §9/11、`remaining-governance-cases-20261021.md` §1/6、两份 governance GUI handoff。没有新增用例或追溯启用待表决设计矩阵。
- 首冻结：`2026-10-21T16:30:22.594Z`；第一次终核 `2026-10-21T16:36:37.967Z`，2794 个输入 changed/missing/added 均0。交件前第二次核验 `16:38:48.971Z`：**仅父执行记录变化1；A10 原证、合同及冻结源码/产物变化0**。其中 A10 governance 原件 341 个；不称第二次全输入零漂移。
- 输入指纹、首次已存在的 A11 差异、缺失路径在 [inputs](a11-governance-source-gui-review-20261021-inputs.json)；终核见 [drift](a11-governance-source-gui-review-20261021-drift.json)。冻结时误列的父目录 `run-2ACog5/dependency-scope-final.json` 不存在；实际 `green-corrected/dependency-scope-final.json` 已随完整目录冻结并用于比对，不以不存在文件作结论。
- 首冻结已见主树与隔离树的 overview、records 样式/会议表单、launcher 控制页等 A11 改动；当前隔离 453 产物中 5 项已不是 A10，包括 `client.js`。部分 launcher 独立探针只有隔离树副本，主树缺失。这些是**首次快照中的在途差异**，不是本轮新增漂移，更不是 A10 身份。
- 已只读核最新父执行记录新增 `2026-10-22 00:39` 条目：说明 A11 已另冻/建新实例、会议新原件及本来源任务接件，不修改 A10/本测试合同、不撤销本次授权。该条不作本轮新增验收证据，不继承其作者1329或其他专家结论；本报告的 A10 有限观察保持有效。此为第二次唯一漂移的范围判定，不重写首次冻结或旧报告。

## 3. A10 身份与装载边界

| 层 | 已核原件 / 结论 |
| --- | --- |
| 插件候选 | A10 `candidate.json`：基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + 512 文件指纹 + `product-tracked.patch`；补丁 SHA `caddc276e6b83d6f79850cc8c1490afdc6a1c5f9409cd8d160fa066cc632c715` 实核相符 |
| 构建 | 原 `build.exit.json`：隔离包 `pnpm run build`，15:33:14.386392Z→15:33:22.064247Z，exit 0；453 项 `artifacts.json` 与 candidate 完全相等。这是作者当轮原证，不是专家重建或整个构建链独立 PASS |
| 宿主 / 启动 | 原 `artifacts/start.json`：16:07:00.210Z，governance，3223/PID22135，cwd 上游，实际 argv `--import tsx/esm apps/cli/src/bin.ts --profile pm --no-open --host 127.0.0.1 --port 3223`；宿主 SHA `1142fb74f2bbcc54dc9499054c0448c9b876cbf2` |
| 实例声明 | root `/private/tmp/pmtool-a10-governance-runtime-20261021`，插件声明 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool`；环境骨架及 start 的 `patchSha=fe82dde2…` 对齐，但它不是产品 tracked patch 的 SHA，不混为源码认领 |
| 归档响应字节 | `loaded-r1/combo-1.txt` 2572530 bytes，SHA `e16c70d5a75b368794d53754fd1fb8a3aba0f0a0c0f3fe3a3ac7023992ab21a2`。插件完整段只出现一次，字节区间 `[875361,2569056)`；仅在内存恢复被宿主剥离的 `\n//# sourceMappingURL=client.js.map`（无末尾换行），1693730 bytes 的 SHA **精确等于 A10** `894a515cee081225687ef8ba887f55a51762ecc481c0d3c3613f035e9c202d2f` |
| 页面观察 | 原 JSON 同 Origin `http://127.0.0.1:3223`、同 `timeOrigin=1792599255490.4`、1440×900、浅色、QA-G A；PNG 与合成帧可见挂载及实际页面状态。像素尺寸/设备 DPR 不当作原生缩放菜单证据 |
| 缺证 | governance `loaded-r1` 实际只有 `execution.mjs`、`combo-1.txt`，**没有 result.json**；响应 status/cache、请求 path/time、该响应到此页面/浏览器 context 的绑定缺失。启动插件字段是声明，不替代实际 resolver/软链归属回读；开关实态也没有完整绑定 |

因此：**归档 body 属于 A10 的字节身份可签；完整实际装载链仍 BLOCKED。** 不使用当前 A11 lib 补证，不执行归档脚本，不打开页面、不重放 token。

F6 标准包 SHA 实核 `c786212c1a5b0023d4a5b8e75b32ed4f4c3dde192b9b0e3901eeb857c1490035`；来源为专家 `green-corrected/F6-ui-standard/`。既有生产 dispatch/确认记录、F6-nonempty-ledger、expected 与本轮 refs 精确相同。seed 的真实预检/恢复后原件支持初态；末尾错等项目名 F6、实际 QA-G A 的设施错误保留，缺失 before/first 不补造零写。

## 4. 逐 ID 审证

### RA-AI01

`source-jumps-r3/ledger.json/png`、`source-0..9.json/png`、`boundary.json` 与 100 原帧：

| 顺序 | 原 ref | 实际表单值 |
| --- | --- | --- |
| 0/1 | tasks t-0001 / t-0002 | 来源任务一 / 来源任务二 |
| 2/6 | milestones m-0001 / m-0002 | 来源里程碑 / AI 新里程碑 |
| 3/7 | risk_issues ri-0001 / ri-0002 | 来源风险 / AI 新风险 |
| 4/8 | deliverables dlv-0001 / dlv-0002 | 来源交付物 / AI 新交付物 |
| 5/9 | meetings mtg-0001 / mtg-0002 | 来源会议 / AI 新会议 |

十个标题均实核相符，同 QA-G A。原 refs 都是 basis、快照/口径 v1，旧六 update + 四 create；不是手工 refs，也不是 refs=[] 的旧绿。manifest before/after 共 18 键精确相同，包括业务表、台账与该 session 文件；只签所登记 data 根，未采 files/backups/正式资产根，不称全机零污染。

kind 仅 `ask-apply`，上下文 0；不宣称其他 kind/context 分组已验。边界有 11 个状态，PNG 和抽查帧可证目标表单与返回页面；未逐帧全看，也未收到逐 link 控件 action/request 原日志，不能将执行摘要“each real click and return”独立升级为十次完整 link→返回台账→重进全部 PASS。同名重复 fixture 本包没有，本次不签同名防错。

**AGUI-01 / P2 / 确证 FAIL：来源行未呈现来源 ID。**

依据既定 `remaining-governance-cases` RA-AI01 与旧 GUI handoff 的“标题/表/ID/角色/冻结版本”。原 ledger PNG 可见来源标题、表、basis、快照/口径，但 `AI 溯源台账` 文本段十个来源 ID 全部缺失；唯一“记录号 prv-…”是账本 ID，不能代替来源 ID。原候选 `client/provenance-panel.tsx` SHA `ff319e4e7d9fc47cf3c8b34b56f4b260901c0039841a054837b7b2cf93779ca6` 的 renderRef 使用 `ref.label || ref.id`，有 label 即不展示 id，meta 仅表与版本。标题正常的本 F6 已实证，非仅源码推测。

最小修复合同仅给开发/Main：来源行同时可见 label 与 id（无 label 时不重复显示）；保表/角色/版本、ref.id 跳转与失效守卫、旧 refs/history 不变，不新增页面/字段。不以另一个页面的 ID 或 raw JSON 有 ID 关闭该视觉缺口；候选变化后由 Main 依原步骤采证、独立复验。冻结时间的 UI 粒度另待原合同补证，不将这一点追加为第二个确证缺陷。

### RA-AI02

`changed-recheck-r2` 原 34 帧与 before/after/final PNG/JSON：

- 原 TaskForm 来源任务一 → 主保存，帧 `000023.jpg` 明示生产成功反馈 `任务已更新 | t-0001 来源任务一已修改`，不是编辑后未提交。
- 来源旧标题保留，changed 原因 `updatedAt 已变更`、失效 1、需重新生成，弱化且不再提供此失效 ref 的跳转；重校后 summary 共1/一致0/待处理1。可签该 AI 台账消费点，不签四消费点全覆盖。
- `continued.json` 的原 wrapped ledger 有首次 history，时间 `16:18:16.215Z`、needs-regen。与跳转区间结束 manifest 比，只有 task1、ledger 和 session 文件变化；该区间含主保存与首次重校，不冒称单独重校只写 ledger，也不补造首保存 before。
- `recheck-history/boundary.json` 原前后 wrapper 第二次重校 **1→2**，新时间 `16:21:03.432Z`；旧 history 前缀完全相等，entry 除 history 其余字段完全相等，refs10不变，登记 data 仅 ledger 改。PNG/帧显示 history 数与保留旧结论。
- `raw.history` 才是持久字段，页面的 `recheck` 是 ask-provenance 只读派生，不应与 raw 顶层逐字段混比。与标准包 **raw** 比较，除 history 旧 entry 全字段相同，summary/status/undo/audit 未洗白。首轮分析 JSON 中 view-vs-raw 比较为 false 的结果保留；[r2](a11-governance-source-gui-review-20261021-observations-r2.json) 改为用标准包 raw 同形比较，无产品改动。

缺证：主保存 t-0001 的完整原前后 record（尤其材料/进展字段保留）与首次重校独立边界；刷新/新进程回读，四消费点不自动重调模型的请求链。当前同 timeOrigin 多次打开不当作新进程。`continued` 已诚实说明末尾误读 `pmAskLedger`，不因设施失败否定已有行为，也不把成功叙述当缺失原件。

### RA-AI03

`missing-recheck` + `missing-history-r2`：

- `before-source.json` 是合法 t-0002 完整 version2.record，等于标准包对应任务；before manifest、before ledger、真实表单、危险确认、成功 toast 与 after-delete 原件在。早期 `delete-confirm` 不是实际删除提交，以 `actual-delete-confirm` 后的 `deleted-source`/after-delete 为准。
- before/after-delete 18→17 键差异**只删除 `/pmtool/tasks/t-0002.json`**；sourceExists=false。before-ledger 与 after-delete-ledger 内容及文件 SHA 均完全相同，旧 history2 与 refs10 留存。
- 台账有“需人工复核”“记录已删除”，changed1+missing1 合计失效2；缺失行是灰色文字/状态而非跳转按钮，buttons 数组该标题匹配0。`missing-no-jump` 原截图/页面未导航其他实体，可签此原缺失源，不推广所有实体。
- `missing-history-r2` 两个实际“立即重校”按钮操作的原帧/PNG、每步 manifest 与 before/after **原 ledger 文件字节**连续：2→3→4。四个 ledger SHA 均精确匹配当步 manifest；每步只改 ledger；每步旧 history 前缀、refs 和所有非 history entry 字段不变。
- 新 history 时间分别 `16:26:37.150Z`、`16:26:37.380Z`，均 manual-review；每次 t1=changed、t2=missing、其余8=consistent。页面一致0/待处理1与失效不参与有效相符，旧 needs-regen 不洗白。

原 runner 在删除后误用 `recheckHistory` 触发 TypeError；r2 补采记录使用真实 `history`，且开始仍 history2、与 after-delete ledger 完全相等，证明不是把出错那轮虚记一次重校。无证据证明该 TypeError 是产品异常；原错误/边界保留。missing 两次重校间隔短，但有两条不同原时间、持久 history 追加与独立前后字节，不能只因时长否认或凭时长宣称更广并发门通过。

## 5. 目视与原件校验

实际 `view_image` 目视 **18 PNG + 17 原帧**，不声称全173帧逐帧目视：

- `source-jumps-r3/ledger.png`、`source-0..9.png`；原帧 `000006/000015/000016/000024/000033/000043/000052/000067/000099.jpg`。
- `changed-recheck-r2/changed-after-recheck.png`；原帧 `000009/000023/000027/000033.jpg`。
- `recheck-history/history-before.png`、`history-after.png`；原帧 `000008.jpg`。
- `missing-recheck/actual-delete-confirm.png`、`missing-no-jump.png`；`missing-frames/000014.jpg`。
- `missing-history-r2/missing-recheck-1.png`、`missing-recheck-2.png`；原帧 `000002/000009.jpg`。

六组原合成帧分别100/34/9/4/16/10，**173个原帧 hash 全部相符**。source-jumps 的000022/000030、delete 的000001 metadata timestamp 有轻微乱序；原值未修，按文件序号/采集 at 与页面状态交叉看，不用于严格时间或点击间隔判定。截图可见内容不等于全部长 history 行目视；整链不可变结论依据 raw 文件对比。

专家审证环境：macOS，Node `v22.23.3`；未使用 pnpm 执行产品。完整审证命令（仓库根），真实退出码均0：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-governance-source-gui-review-20261021-audit.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-governance-source-gui-review-20261021-audit.mjs review
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-governance-source-gui-review-20261021-audit.mjs review observations-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-governance-source-gui-review-20261021-audit.mjs finish
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-governance-source-gui-review-20261021-audit.mjs finish drift-final
```

`freeze` 已冻结2794；`review` 做原 JSON/哈希/归档响应分析，不运行产品；r1错误地混比 view 与 raw 的 false 保留在 [observations](a11-governance-source-gui-review-20261021-observations.json)，r2同形比较为true；首次 `finish` 零漂移。交件前再核结果独立另存 [drift-final](a11-governance-source-gui-review-20261021-drift-final.json)：命令exit0表示完成核验，**不表示零漂移**，唯一变更父执行记录按§2限界，不覆盖首次终核。`node --check` 本审证脚本与本前缀 `git diff --check` 均exit0（新增文件正文另经只读复核）。一次只读结构探查误假定标准包 `.data.settings`、自身 TypeError/exit1，下一次读取实际 `.extra.settings` 正确退出0；未写原件、未判产品 FAIL。没有重跑旧 build/verify/GUI，不以分析命令exit0当产品全回归。

## 6. 继承与释放

- 本文是 **A11 专家报告对 A10 原件的审签**，不是 A11 新产品候选验收。同候选/同 fixture/同原件可继承上述精确观察子范围；改变 panel、provenance-view、ask/recheck、导航、相关样式、构建入口或实例后须重新绑定受影响原证。
- 旧专家102 runtime 源闭包与 A10 100项相同，csv-import/ui-feedback 两项不同；这里仅参考与本 ID 有关的同形来源/历史规则，不继承102闭包全 AUTO、更不继承32全门。当前主树/隔离树其他 A11 差异不成为 A10 输入。
- Main 下一动作：按 AGUI-01 最小合同修复并另冻候选；按既定 RA-AI01..03 步骤补缺件、交独立专家。不要生成新摘要去替不存在的旧 result/before/exit，也不要改旧 F6 用例以消除非空来源/材料。
- 本专家已释放任务及本前缀写入权；未启动进程、未占 GUI/端口/build，未改或停止任何旧服务，未读取私有入口/凭据，未 commit/push。未签范围继续由 Main 按原分工推进，不由本报告扩大放行。
