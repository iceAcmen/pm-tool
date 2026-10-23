# A9 既有入口独立复验

> 给 Main 与后续独立专家使用：按冻结 SOURCE/真实组件/生产命令/JSON 回读判定既有入口；列确证失败、最小修复合同及未验边界。2026-10-21，平台 trae，独立测试专家；不签 GUI、新构建或整包放行。

## 1. 结论

**冻结候选整体 FAIL，不能用 317 条回归绿抵销六条组合红。** 六红合并为两类缺陷；不是六个互不相关问题。

| 对象 | 本冻结 SOURCE/AUTO 结论 | 独立证据与范围 | 新 GUI |
| --- | --- | --- | --- |
| LG-01 关联入口 | 有限 PASS | 真 PmPanel→MeetingsView→RecordsMeetingForm；按会议项目筛选 task+type=issue，跨项目/risk 排除与非法选择不改稿；主保存关联、clear、取消、重进、稳定 ai-ID/来源和 JSON 重开 | NOT_RUN |
| LG-01b 主保存 | 普通内容/受控失败恢复有限 PASS；**合法错误词组合 FAIL** | 两行普通标题、状态、会议笔记一并主保存及重试通过；标题含“失败”时第一行动项真实 success 被面板判 false，第二行动项未发写命令，仍旧值。`A9-I03 keyword=true` 两例红 | NOT_RUN |
| LG-04 清单入口 | **SOURCE/AUTO PASS** | 真实生产 handler/JSON 种子→TaskForm 显式 true/重复true/false→全新生产 web snapshot→同一实态；stable item ID、幂等文件零变化、50→100→50、manual30/status todo/legacy40 不变、父/项目同源；parent/empty/busy/失败保实态及重试 | NOT_RUN |
| LG-05 合法导入确认 | 有限 PASS | CSV/XLSX 真 PmPanel/TaskTable→FileReader设施→注册 pm handler→解析/JSON；preview/cancel0、confirm2、树/编号/负责人/字段、snapshot/WBS及存储重开。作者 busy/false/reject 原例独立复跑 | NOT_RUN |
| LG-05 非法日期/后行 | **FAIL** | CSV/XLSX 后行 `2026-02-30` preview 返回 success；confirm 返回 error，但第一行已写；原内容重试再写第一行。关存储重开仍两条，不是内存或等待误差 | NOT_RUN |
| LG-02 / LG-03 | 原边界保留，不加新需求 | 原副本分命令新建会议→重开增行动项及普通 owner 字段控制绿；不要求未存会议原子行动项、owner popup 或新自由清单设计器 | NOT_RUN / popup NOT_APPLICABLE |

只有本报告明确列出的 SOURCE/AUTO 子项通过。没有浏览器、样式、焦点、原生菜单、真实宿主下发或完整用户旅程证据，均 NOT_RUN；不是 MANUAL_PENDING。继续沿 A8 §5 LG-G01/01b/04/05，由 Main 新构建/采证、专家审证。

## 2. 授权与冻结

负责人本次原句：“新独立测试专家，只写docs/testing/a9-existing-entries-independent-retest-20261021*和selftmp，产品只读，禁其他testing/livingdocs/build/sharedcache/GUI/service/credentials/commit。”父持续授权验完在途修确证最后 Main commit，仅作父任务背景，不继承为本角色产品写权/提交权。

已读 AGENTS/collaboration、A8 report/probes §4/5、已有入口收口 plan、两个 A9 开发报告及 Main checklist 红绿。主树是多角色 dirty 候选；本角色没有 fetch/pull/install/build，未动其他 testing/livingdocs、上游、正式配置或凭据。

- 基线 HEAD：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，**仅基线**。
- 冻结根：`docs/testing/a9-existing-entries-independent-retest-20261021-selftmp/frozen/`。完整插件包源码/脚本/配置复制，排除 node_modules/lib/cache/data/coverage/.tmp；保持真实仓库层级，复制引用合同与 F2/f2-backup fixture。
- 源378文件逐字节一致。源清单 SHA256：`2e9cea57bf36661c48f70d16640d5284efb5a0e39b7dbb5c4f074e7ea75a9205`。
- `selftmp/freeze.json` SHA256：`11501b7dba1c7fdebfef48d8b871fec36fd485d894c0465b65b1d08c2240aca3`；同根 `tracked.patch`、`new-files.json` 认领 dirty diff 与新增文件，完整源 hash/依赖/合同/WATCH 前后均在该 manifest。
- 只读链接 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`；macOS/bash、nvm Node `v22.23.3`、pnpm `11.28.5`、React/renderer `18.3.1`、Vitest `2.1.9`。没有安装依赖。
- 每轮 cacheDir/TMPDIR/XDG_CACHE_HOME/NODE_COMPILE_CACHE 及 DSH_HOME/隔离文件根均在本角色 selftmp，`cache:false`+`--no-cache`。没有使用主树 lib。

包内路径前缀 `packages/dsh-pm-tool/src/`，实际冻结 SHA256：

| 文件 | SHA256 |
| --- | --- |
| `client/views/records/records-meeting-form.tsx` | `80315b722efe83d0508a407e2cab3496ac175191fa3ca1bf2ce65d6c1aa9edcf` |
| `client/views/meetings.tsx` | `19a6af2eff6c42a290b9f6102e5a88c0e080703a564b3f30ca89fef3633147c4` |
| `client/views/tasks.tsx` | `9789e5811ab09dcbc1c561ccec463e905795b34da1eb7f996bab73d8d21ef91e` |
| `client/panel.tsx` | `8618d9091d3544a4236e9ae92fa0225e3914ea065b910ff1f3cb55013d0bc506` |
| `client/panel.css` | `42f1222456948542464e22de87340c64dd443089183602a6d6a9baf9f25e2063` |
| `client/views/records/records-meeting-entry.test.tsx` | `fea8f4f164d1d1b174f28aa03e6c1f692d2a2abbfa5bc18de4068ad0d436254d` |
| `client/views/tasks-import-confirm.test.tsx` | `6abe9c211e2e38f5b4cfd5ab9c1b184263547d0609441c4d1357ac2ad6f1ea86` |
| `client/panel-checklist-toggle.test.tsx` | `986a92ff011f4e0e47d287cffdd625e44a8832ec004f0a6304e4d0b9f7dc73c6` |
| `core/csv-import.ts` | `ebeb028f84e73b3a8c2637a703754a14f80f49effd0f00005f7ea25af989b430` |
| `commands/task.ts` | `7f02fbd6daaac985958cb3ea789c7597c7b9e4f72307eeee72efa4713af4f63e` |
| `core/ui-feedback.ts` | `f43615f324d71dd7dd31e5c1a264cc3467f9b95bf6f8518d90c90e983d6f4cba` |
| `index.ts` | `c6c50f831f15f049b7833852d2dd013fa8b61b18f40f8008cbf506189e1afb56` |

**后续主树漂移不隐藏，继承按实际行为判定**：r3/r4 时 `client/panel-restore-path.test.ts`、`core/ui-feedback.test.ts` 被 Main 修改；整理证据时 `core/ui-feedback.ts` 也变为 `11efe6218cac82da0aef5fc239f19d697a186d0f3c86633d5b4095cfd5295d43`。负责人随即澄清这仅是备份/恢复组合prefix三行及合法项目测试fixture。本专家只读no-index diff核实：变化仅在 `prefixFeedbackOnce` 对prefix=`恢复失败/备份失败`且raw以`备份/恢复失败`开头时原样返回；`commandAccepted`未变，会议/清单/导入接受判定未受该三行影响。因此**原冻结LG证据继续有效，无需重新全LG**，A9-F01并未被该prefix补丁修复。新prefix用例不属于本任务，不重签其PASS。五个指定产品文件仍与冻结hash一致，`panel.tsx` production未变；本角色未替换或污染冻结源。

只读核Main的 `reports/all-pending-evidence-20261021/A9/build/`：sync认领上述8文件hash一致，post-source drift=[]；noemit/build/coverage原exit均0，coverage原stdout为139files/1294tests全绿。Main A9的 `lib/client.js` SHA256=`9724598ef429da8bdcdeefe15c00aaa3f4350e2fe08e5ba8c8dd986ee205e152`。这些是Main独占构建原证，不是本专家执行或GUI结论；A9/build早于后续三行prefix，不把源码后改当该bundle已含新改动，亦不称A10。原冻LG结论仍绑定本报告源，不漂移到另一次产物。

## 3. 原命令与逐轮原 exit

全部命令从仓库根运行，前置为 macOS/bash：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a9-existing-entries-independent-retest-20261021-run.mjs freeze
node docs/testing/a9-existing-entries-independent-retest-20261021-run.mjs original-r1 -t 'LG-01 contract|LG-01b contract|LG-04 contract|LG-02 control|LG-03 control'
node docs/testing/a9-existing-entries-independent-retest-20261021-run.mjs original-lg05-r1 -t 'LG-05 contract'
node docs/testing/a9-existing-entries-independent-retest-20261021-run.mjs original-r2 -t 'LG-01 contract|LG-01b contract|LG-04 contract|LG-02 control|LG-03 control|LG-05 contract'
node docs/testing/a9-existing-entries-independent-retest-20261021-run.mjs independent-r1
node docs/testing/a9-existing-entries-independent-retest-20261021-run.mjs regression-r1
node docs/testing/a9-existing-entries-independent-retest-20261021-run.mjs independent-r2
node docs/testing/a9-existing-entries-independent-retest-20261021-run.mjs typecheck-r1
node docs/testing/a9-existing-entries-independent-retest-20261021-run.mjs independent-r3
node docs/testing/a9-existing-entries-independent-retest-20261021-run.mjs independent-r4
node docs/testing/a9-existing-entries-independent-retest-20261021-summarize.mjs
```

| 轮次 | 原 exit / 结果 | 独立判定 |
| --- | --- | --- |
| freeze | 0 | 复制源一致；非测试 PASS |
| original-r1 | 0；5绿/2SKIP | 原入口与控制断言，不把只数 checkbox 当真实 toggle 通过 |
| original-lg05-r1 | 1；1红/6SKIP | **旧控制组失效**：修后确认已建2，再往同库控制导入建2，旧断言期望总2实为4；非产品失败 |
| original-r2 | 0；6绿/1SKIP | 只在自有副本隔离 LG05 控制库；真实按钮创建2断言不变。跳过“主保存不写action”的旧缺陷观察控制 |
| independent-r1 | 1；16红 | 自有观察器误将需projectId的listTasks用于全库；设施错误，非产品失败，保原证 |
| independent-r2 | 1；16红 | 自有观察器误用真实DomainTable不存在的list()；改为生产entries()，设施错误保原证 |
| independent-r3 | 1；7绿/9红 | 6条真实合同红；另2条把snapshot只许一次、1条要求后端已删清单仍留checkbox，均过度oracle，保原证 |
| independent-r4 | **1；12绿/6红** | 最终完整组合；撤去多余oracle后，真实失败原样保留；新增不含错误词的同流程正向控制 |
| regression-r1 | **0；32文件/317绿** | 作者11会议+9导入+2清单以及受影响旧测试，冻结源独立复跑 |
| typecheck-r1 | 0 | 全复制src `--noEmit --incremental false`；非build/产物/GUI |
| summarize | 0 | 归档实际round/calls/原exit/hash/漂移；不是测试绿 |

每轮 `selftmp/<轮次>/execution.json` 有实际完整 argv、cwd、原 exit、signal、时间与保护前后；同目录 stdout/stderr/vitest.json/observations.jsonl 为原证，不覆盖失败轮。runner 外层退出码等于实际测试子进程，未把采证完成0混成测试绿。

子进程采用：

```sh
node /private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run \
  --config /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/a9-existing-entries-independent-retest-20261021-selftmp/independent-r4/vitest.config.mjs --no-cache
node /private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/typescript/bin/tsc \
  --noEmit --incremental false \
  -p /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/a9-existing-entries-independent-retest-20261021-selftmp/frozen/packages/dsh-pm-tool/tsconfig.json
```

32文件的逐文件/逐断言清单与hash在 [evidence-index](a9-existing-entries-independent-retest-20261021-evidence-index.json)。覆盖 records callbacks/payload/options/entry、表单校验/dirty、TaskForm/launch/restore、任务编号/工具栏/剪贴板/树/可见层、OP四消费、task ops/inline/views、进度派生/人工双轨、反馈/协议等。没有重签其他领域、整包、OP/AI全门。

原 A8 probe 始终只读，SHA256 `cb37005799132933870da6366c5bf10f3fbfb6355c5c0740a93b5165ac95eb8a`；自有控制库隔离后副本为 `c4f48bc8782d0cac4cfb52f689d1ca5e7ec678f5967f4943bd04e4cd32e1e4bc`。最终独立 probe `selftmp/frozen/packages/dsh-pm-tool/a9-independent.test.tsx` SHA256 `b324c45277badad8b01f7e90d59f4cf4ae936b979c1d6d2fe239a61c1e8b4f81`；r4目录保同字节副本。

## 4. 确证缺陷与最小修复合同

### A9-F01：会议主save被合法标题的错误词截断（P1）

`A9-I03 keyword=true` 两种前序故障（传输 throw、合法候选选后被真实删除导致领域拒绝）恢复后：

1. `meeting update mtg-0001 ...` 成功。
2. `meeting action update mtg-0001 ai-001 {"title":"失败待重试一",...}` 生产返回 `kind=success`，正文为 `[pm:summary]行动项已更新｜ai-001 失败待重试一 ...`。
3. `panel.tsx` 的 `run`→冻结 `core/ui-feedback.ts:127-129 commandAccepted` 仍以整个文本中文错误词判断，返回false；RecordsMeetingForm停止顺序提交，`ai-002` 仍“原二”、表单不关闭。

这是合法种子/生产success，**不能删“失败”标题把用例转绿**。已增不含错误词的同流程控制，两行都更新并关表单，排除单纯JSON等待或故障未解除。r4两条 keyword=true 的完整命令、实体、result、实态和formOpen均归档。

依据：LG01b主保存必要草稿全部成功才关闭、AGENTS/collaboration §11.4 字段语义与失败边界，及仓内既有结构化成功信封合同。范围是既有回告/主save接缝，不新增功能。

最小修复文件合同：`core/ui-feedback.ts` 的命令接受判定与同目录测试，以及必要的现有生产组件组合测试。复用既有成功信封解析/判定，与 classifyFeedback 已批准语义一致，真实未结构化拒绝仍false；不新造协议、不更改meeting schema/事务、不改良性标题。Main后改仅修备份/恢复prefix，不影响此处 `commandAccepted`，本缺陷仍需有界修复；本专家不改产品或追认其新hash通过。

受影响复验：本I03四组合、LG01/01b、清单真实toggle失败/成功、导入preview/confirm接受判定、受影响UI反馈/恢复/任务反馈、真实GUI主保存。结构化success含“失败/错误/未找到”可按已有信封合同加组合；不能把裸真实error误接受。

### A9-F02：非法日期预览成功，后行非法已半写，重试重复前行（P1）

真实两行CSV（XLSX首表相同字段值）：

```csv
层级,标题,负责人,优先级,开始,截止,进度
1,"父,带逗号",张三,P1,2026-10-21,2026-11-10,20
2,子任务,李四,P2,2026-10-22,2026-02-30,30
```

真实命令为 `task import-content p-0002 independent.csv <JSON原文>` / XLSX base64，confirm仅末尾附 ` confirm`，不是测试手写任务：

- preview：`kind=success`、“将创建2个任务。当前未写入。”；任务0。
- 第一次confirm：`kind=error`、`导入失败`，原Zod `path=["dueDate"]`、`日期须为有效的 YYYY-MM-DD`/`截止日期不得早于开始日期`；但 `t-0001/code=1` 父行已存。
- 原preview保留，第二次原样confirm仍error，却新增 `t-0002/code=2` 同标题父行；JSON设施close/reopen仍两条。
- CSV/XLSX两种格式均真实复现。r4 `A9-I10/I11` 原证完整；没有将首行非法0写扩大为全集0写。

**合同范围判定**：

- ADL043只明确表头、纯JS离线、dry-run→confirm、复用addTask树。**它自身没有承诺全文件磁盘事务、断电回滚、未知提交结果幂等或exactly-once**，不据半写现象创造新原子协议。
- 已生效 RA-IM01 指定非法列/日期 preview、预览/确认/行错误与导入schema一致；A8 §4 LG05最低明确“cancel/非法样例0写”，collaboration §11.4同等级写校验。合法 addTask拒绝该日期，而preview称可导入、confirm在发现可预先校验的非法行前已写，**属于既有校验/拒绝边界缺陷**，不是新功能。
- 原GUI单中“非法日期→preview”与真实旧行为冲突，不能替它把success签PASS。本轮签SOURCE/AUTO FAIL；GUI仍NOT_RUN。

最小修复文件合同：`core/csv-import.ts` 的共享网格计划/行验证及对应测试；仅必要时 `commands/task.ts` 行错误呈现。`planGridCsvImport` 目前只解析标题/层级，`importTasksFromGrid`逐行addTask（约行141-185），网页及路径导入共用它们。先按**现有 `taskCreateSchema` 与现有导入字段映射**完整预检所有候选行，再开始第一条addTask；preview与confirm共用同级预检、保现层级/编号/默认值/CSV百分号/XLSX行为，错误提供可定位行与字段。合法confirm仍复用既有addTask，不改变schema或序列协议。

不纳入本最小合同：I/O失败全文件原子回滚、提交已成功但回包丢失的去重协议、通用事务框架、历史半写自动删除、模板/新文件格式/U4。上述若要做需另有明确需求/测试合同；本次preflight不能假称解决它们。

受影响复验：CSV/XLSX首行及后行非法日期preview/confirm0写、合法两层/已有项目编号、路径与网页共用入口、取消、busy/失败保preview、原CSV/XLSX/import-content专项及LG05/I09-11。新代码需新冻结、Main唯一build，再采原GUI合同；本角色没有改解析器或自修自验。

## 5. 证据与保护

- r4共有 **287 次生产 pm handler 返回调用**，含合法种子、snapshot与失败结果；精确逐调用 `selftmp/independent-r4/observations.jsonl`，没有把种子计成用户点击。I03受控传输故障在handler前拒绝，不冒称生产result。
- 存储使用真实Context/Storage/JsonStorageBackend/DomainFacility/openPmDomain；生产`apply`注册真实pm描述器，host仅提供commands/storage设施、effect与缺省可选服务。没有预注册业务模块，没有监听端口、web服务或GUI。生产组件、回调工厂、handler、领域函数未mock；DOM/FileReader、受控传输失败为测试设施。
- 每轮 frozen/src漂移0。WATCH仅主包lib、主/指定父依赖node_modules的.vite/.cache五根，内容与mtime前后一致；**只证明这些根**，没有访问正式业务数据/凭据/服务，未宣称全机零变更。
- 所有失败轮、设施更正、失效控制组均保留。r4无未处理拒绝；TaskTable既有React缺key warning原样存stderr，未借机改产品。
- 所有写入仅本前缀文件与selftmp；未编辑冻结src中的产品/tests（只包根新增独立probe、改自有A8控制副本），未修改原专家文件。
- 未运行build、全部verify、真实模型、服务/宿主/下发bundle、GUI/样式/UX、commit/push。专项SOURCE结果不是全包功能放行。

## 6. 释放与交回

本专家执行结束，所有测试/类型检查子进程已退出，不等待GUI；不再写产品或本轮冻结源。五个指定产品文件冻结等待已在采证前解除；本角色只持有自己的证据，不阻塞Main新冻结/唯一构建。

Main继续父在途任务：按本报告确证范围处理反馈新源与导入预检，保留原FAIL → 交新精确候选/源diff/新增文件与产物认领 → 独立SOURCE/AUTO复验及原LG-G01/01b/04/05采证 → 受影响与最终全集回归/全部verify → 最后统一commit。这里不新增commit/push/发布授权，不替其他专家或其他门签字。
