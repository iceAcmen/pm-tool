# A10 成功信封与导入预检独立复验

> 给 Main 与后续独立专家使用：绑定冻结源码、原命令与零写/重开证据，判定 A9-F01/F02 最小合同；不替构建、GUI、整包或发布签字。2026-10-21，平台 trae，独立测试专家。

## 1. 有限结论

**A9-F01 / A9-F02 本冻结 SOURCE/AUTO 最小合同 PASS。新 GUI 全部 NOT_RUN。** 原 A9 FAIL、开发红轮和本轮旧步骤两红均保留；不是以新绿覆盖旧证据。

| 对象 | 本轮判定 | 原始证据与边界 |
| --- | --- | --- |
| A9-F01 / I03 | 有限 SOURCE/AUTO PASS | 真 PmPanel→MeetingsView→RecordsMeetingForm→生产 pm handler→JSON；throw/domain × 普通/含“失败”标题四组合；前序拒绝保两行稿、不关闭、不写 actions；移除故障/清除已删引用后，两个 stable ai-ID 均真实 success、状态/笔记/归属/来源保真、表单关闭、JSON 重开一致 |
| A9-F02 / I10-I11 | 有限 SOURCE/AUTO PASS | CSV/XLSX 非法后行 `2026-02-30` preview error/0写/无确认；另发原同字节输入的生产 confirm 两次均 error/0写；不是点击不存在按钮 |
| 合法 CSV/XLSX / path/content | 有限 SOURCE/AUTO PASS | 四组合已有任务/跨项目控制、重复 preview 不写、单 confirm 创建4；旧记录不重建、续号 `2/2.1/2.1.1/3`、三级父 ID、percent/default/负责人/日期、全 JSON 字节重开 |
| schema / 首后行 / 未知列 | 有限 SOURCE/AUTO PASS | 与真实 taskCreateSchema 同字段/同错误；首后 startDate/dueDate、日期倒置、两行多字段汇总、跳过空标题后网格行号；任意 addTask 前拒绝、全库字节不变。未知表头缺标题拒绝；额外未知列按原映射忽略，不新加严格表头合同 |
| LG01/01b/04/05 受影响入口 | 有限 SOURCE/AUTO PASS | 原合法关联/取消/clear、清单 true/true/false/并发锁/两失败恢复、合法导入取消与 snapshot/WBS 重开重新实跑；不扩大为全页面旅程 |
| A8-TW01 | 仅局部 SOURCE PASS | 冻结 tasks.css:78 一行 `.pt-seg-data { flex-wrap: wrap; max-width: 100%; box-sizing: border-box; }` 存在；没有删标签/动作。390 浅深、长 preview 可达、视觉/滚动均 NOT_RUN |

两轮独立各 **33/33**，受影响作者回归 **34文件/348项** 全绿；四个原导入 verify 的 SOURCE 运行均 exit0，no-emit exit0。没有产品确证 FAIL 留在本最小合同；完整包、其他领域及父任务剩余门未由本角色放行。

## 2. 授权与方法

负责人本次原句（本角色边界）：

> 新独立专家只写docs/testing/a10-preflight-success-independent-retest-20261021*及selftmp，不product/other testing/livingdocs/build/sharedcache/GUI/service/credentials/commit。父持续修确证验完所有在途授权。

其余具体步骤按负责人同条派单执行：读 AGENTS/collab、A9 §4、A10 开发报告与最小收口 plan；冻结主树 source/diff/tests；私有完整源码与原 fixture/repo 层级；只读依赖 link、私有 cache/no-cache；I03 保含“失败”标题四组合，I10/I11 UI 拒绝与生产命令确认守卫分证；合法 CSV/XLSX/path/content、编号/percent/default、未知列/首后日期/同级 schema 字段、受影响导入/R12；不纳 I/O 事务或未知提交幂等；TW01 只 SOURCE；结束释放。

已读指定四文档及当前接续。依照本次明确、范围有限授权，没有 fetch/pull/install/build，也不更新 livingdocs 或其他 testing，不继承父产品写权/commit 权。已核 brainstorming/writing-plans 的目的/边界，沿已批准 plan 执行，不另开功能、写禁止目录计划或执行其中通用提交动作；未加载/执行 vendor skill。

设施仅提供真实宿主预置 commands/storage、effect 与缺省可选服务；生产 apply 注册真实 pm 描述器，生产组件/回调/handler/领域函数不 mock。真实 Context/Storage/JsonStorageBackend/DomainFacility/openPmDomain，JSON 在 selftmp 内。DOM/FileReader 与 handler 前传输拒绝是明确测试设施，不声称真实浏览器或真实网络失败；删除引用模式使用真实生产 delete 命令，不注入坏正式库。`addTask` spy 只观察真实实现，不替换。

## 3. 冻结身份

- 基线 HEAD：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，仅基线，不代表 dirty 候选。
- 冻结时刻：`2026-10-21T15:32:57.487Z`（本机 UTC+8 23:32:57）。
- 根：`docs/testing/a10-preflight-success-independent-retest-20261021-selftmp/frozen/`，完整插件源/脚本/配置、原 F2/f2-backup 与引用合同，保仓库层级，排除 node_modules/lib/cache/data/coverage/.tmp/.verify-tmp。
- `src` 379文件复制前后逐字节一致。全 src 清单 SHA256：`951f29ac57deaedbcdf91dbf35d2927bbe8b2906e227137789964000f8cdfb2e`。
- `freeze.json` SHA256：`5f12748424ec1d8e29ce425f38888b69bf8437f78c3dd248b3a495d9689c6340`，含完整文件/依赖/fixture/合同/保护清单。
- 全 tracked diff `tracked.patch` SHA256：`34b138c6e56a3927306ffb79044572e6171aecedfdbbebe7cad727a665db28f2`；包内未跟踪文件清单/指纹 `new-files.json` SHA256：`83173242a1b35561f42385063529ac88b3283dd086b912a690111f9b7437ca39`。全 diff 含其他在途成果，仅认领不替它们签字。
- 依赖只读软链：`/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`；macOS/bash、Node `v22.23.3`、pnpm `11.28.5`、React/renderer `18.3.1`、Vitest `2.1.9`、XLSX `0.18.5`、TypeScript `5.9.3`。

下表路径前缀为 `packages/dsh-pm-tool/src/`：

| 冻结文件 | SHA256 |
| --- | --- |
| `core/csv-import.ts` | `389c127aefb81fb08215512a168fd978928ec41e814faca2b6e6e26d066dabe5` |
| `core/csv-import.test.ts` | `d31c5587c590aa01cab2efc550384c9c97b1577175861d7b5e05a98176d95d92` |
| `core/ui-feedback.ts` | `3808eef79e34595754ea9d8970d62c5c5da87feb1f42722eba593a061f1bbde7` |
| `core/ui-feedback.test.ts` | `a5e7ff8b13cecb6d0fcbcb6f8f214a61c5aec0ea54152af91af4dc1490a5c805` |
| `core/task.ts` | `ad71b6d1b26e386e297c8f3c6a555252772c5247ab94b3ceec89c787eb21646b` |
| `commands/task.ts` | `7f02fbd6daaac985958cb3ea789c7597c7b9e4f72307eeee72efa4713af4f63e` |
| `client/panel.tsx` | `8618d9091d3544a4236e9ae92fa0225e3914ea065b910ff1f3cb55013d0bc506` |
| `client/views/tasks.tsx` | `9789e5811ab09dcbc1c561ccec463e905795b34da1eb7f996bab73d8d21ef91e` |
| `client/views/tasks.css` | `101a5f01bbd77dd8f234bbe2145df143cbc35682841f8317f5f18d8247d961b4` |
| `client/views/tasks-import-confirm.test.tsx` | `eeb6e71ec5f7908119a05a6fb7f92c34f92c9f49117da335210041bcb8f88539` |
| `client/views/records/records-meeting-form.tsx` | `80315b722efe83d0508a407e2cab3496ac175191fa3ca1bf2ce65d6c1aa9edcf` |

Main 的首行非法例新 hash 已作为冻结作者测试实跑9项全绿；日期仍 `2026-02-30`、零写不放宽。本角色没有修改任何冻结 `src` 或作者测试。

## 4. 专家步骤核定与红证保留

原 A9 probe SHA256 始终为 `b324c45277badad8b01f7e90d59f4cf4ae936b979c1d6d2fe239a61c1e8b4f81`。本轮先将它逐字节复制为自有包根 `a9-original.test.tsx` 复跑 I03/I10/I11：**exit1，6绿/2红/10未运行**。四 I03 和两 I11 绿；两 I10 均原报 `确认落盘: expected undefined to be truthy`。失败发生在非法 preview 已 error 后，尚未执行 confirm，不能把它当新半写再现或把整轮称绿。

专家核定只在自有包根 `a10-adapted.test.tsx` 适配 I10：

1. 原非法后行日期和 CSV/XLSX 内容不变，走真实 PmPanel preview。
2. 断言生产 preview `kind=error`、行3/dueDate、0条任务，错误区仍在且无“确认落盘”按钮。
3. **不用 UI 点击确认**；独立直接调用生产注册 handler，原 preview 命令只追加 ` confirm`，重复两次。
4. 两次均 error、同原错误、首次/重试/JSON重开均0；其他专项逐字节对比全库（含项目/序列文件）不变。

这是新预检后对旧动作步骤的必要核定，不删日期、不减零写 oracle、不要求为非法计划保假确认入口、不改原专家文件。I11 另保原 schema 一致断言并补无确认。原红证/原步骤和自有修订副本都归档。

I03 未改变原失败标题、传输/删除拒绝与修正动作；仅加强必要保存结果：第二行状态、主笔记、两真实 action update success、表单关闭、来源和重开。四组合两轮均证实；`A10-I03-rejected/closed` 逐例原观察器归档。未把只测 commandAccepted 的新接受例当真实 meeting I03。

自有适配 probe SHA256：`76dffc208dcf0797da0111219a62214b35a115839e8c48d1d30fe7ac4cf66909`；自有补充 probe `a10-extra.test.ts` SHA256：`c92fa84a91111a3b659b5a58e48b6787bf9d8b9e3f8b4cc76ca2d18b1597b801`。r1/r2 同字节，不覆盖任何红轮。

## 5. 命令与原退出码

全部实际命令从仓库根运行，macOS/bash：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a10-preflight-success-independent-retest-20261021-run.mjs freeze
node docs/testing/a10-preflight-success-independent-retest-20261021-run.mjs original-r1 -t 'A9-I03|A9-I10|A9-I11'
node docs/testing/a10-preflight-success-independent-retest-20261021-run.mjs independent-r1
node docs/testing/a10-preflight-success-independent-retest-20261021-run.mjs regression-r1
node docs/testing/a10-preflight-success-independent-retest-20261021-run.mjs noemit-r1
node docs/testing/a10-preflight-success-independent-retest-20261021-run.mjs verify-csv
node docs/testing/a10-preflight-success-independent-retest-20261021-run.mjs verify-import-content
node docs/testing/a10-preflight-success-independent-retest-20261021-run.mjs verify-r12
node docs/testing/a10-preflight-success-independent-retest-20261021-run.mjs verify-importmd
node docs/testing/a10-preflight-success-independent-retest-20261021-run.mjs independent-r2
node docs/testing/a10-preflight-success-independent-retest-20261021-summarize.mjs
```

| 轮次 | 原 exit / 结果 | 范围 |
| --- | --- | --- |
| freeze | 0 | 379源字节一致；不是测试绿 |
| original-r1 | **1，6绿/2红/10未运行** | 原I10步骤失效；真实错误和日志保留 |
| independent-r1 / independent-r2 | **0 / 0，各2文件33绿，无跳过** | 18条适配原组合+15条独立补充；每轮379次生产handler返回（含合法种子/snapshot，不冒称379次用户动作） |
| regression-r1 | **0，34文件348绿，无跳过** | 作者 csv11/meeting11/import9/ui-feedback28/清单及LG/反馈/恢复/任务/派生等受影响测试；逐文件逐断言见索引 |
| noemit-r1 | **0** | 冻结 tsconfig `--noEmit --incremental false`；该配置排除测试文件，不称所有探针静态类型检查，不产 lib |
| verify-csv | **0** | 原 CSV 解析/字段/树、preview零写、坏表头、全新进程读回 |
| verify-import-content | **0** | 原 CSV/XLSX 内容/坏类型/内容、preview/树、全新进程读回 |
| verify-r12 | **0** | 原 Markdown导入/层级/编号/勾选/负例及检索/统计控制、全新进程读回 |
| verify-importmd | **0** | 原编辑清单导入/层级/勾选、全新进程读回 |
| summarize | 0 | 索引归档，不是产品测试结论 |

每轮 `selftmp/<轮次>/execution.json` 记录完整实际 Node argv/cwd/时间/原exit/signal/source hash/漂移/WATCH；stdout/stderr/vitest.json/observations.jsonl 原证，不把外层采证完成当测试exit0。

四 verify 原脚本逐字节不变。自有 `source-loader.mjs`（SHA256 `8d2458b78343cc15bbe4ce2353423cd60ea7716ab49eb55caeee6d02e5bcb984`）仅将该冻结包 `lib/*.js` 引用解析为 `src/*.ts[x]`，内存 transpile；重开进程由 NODE_OPTIONS 继承同设施。**这是 SOURCE 脚本回归，不是 build/bundle/宿主下发复验。** 全部 script hash 在各 execution 与索引。

## 6. 证据、保护与失效

总索引：[selftmp/evidence-index.json](a10-preflight-success-independent-retest-20261021-selftmp/evidence-index.json)，含完整逐断言、各原日志指纹、argv/exit、I03四组合关闭与I10确认守卫原观察、相关源hash和合同指纹。真实临时JSON、输入CSV/XLSX与重开记录均保留于每轮 runtime。

- 每轮 cacheDir/TMPDIR/XDG_CACHE_HOME/NODE_COMPILE_CACHE/DSH_HOME/文件根均在本 selftmp；Vitest `cache:false` 与 `--no-cache`。没有安装依赖、共享缓存写入或读取主树 lib 作为执行对象。
- 冻结 src 每轮及归档前漂移 `[]`，主树 src 每轮及归档前漂移 `[]`，全部引用合同/fixture 当前 hash 与冻结一致。
- WATCH 主包 lib，以及主/指定父依赖的 `.vite/.cache/.vite-temp` 七根，内容+mtime 前后均一致。只证明这些受监测根，不称全机零变更；没有探测正式服务/凭据/业务库。
- 原 TaskTable React key warning、Node loader ExperimentalWarning 原样保留；不借此扩修产品。无未处理拒绝或测试超时。
- 后续 source/相关tests/映射或接受判定改变须按实际接缝重验；本 PASS 只绑定上述 source+diff+newfiles，不自动转移给 Main 后续 build、实例、开关或新GUI。
- 后端 I/O 失败全文件回滚、成功回包丢失的未知提交幂等/去重、历史半写删除、通用事务/schema/U4均不纳入本最小合同；合法单confirm不证明重复confirm exactly-once。

## 7. 释放与交回

本专家执行完成，所有测试/类型检查子进程已有原 exit/signal 记录且均退出；不等待 GUI，不再持有共享源写权或冻结等待。写入仅本轮指定前缀脚本/报告与 selftmp；产品、原专家用例/其他 testing、livingdocs、共享构建/缓存、服务/凭据、commit/push均未操作。

**释放本轮 SOURCE/AUTO 复验。** Main 沿既有父授权继续：认领本源与后续唯一隔离构建→按原 LG-G01/01b/04/05（非法 preview 后不点不存在confirm）、TW01 390浅深/长preview合同采 GUI 原证→专家另审 GUI→受影响与最终在途全部回归/verify，最后父范围允许时 Main 统一 commit。这里没有增加 push/tag/正式切换、新功能或整包放行授权。
