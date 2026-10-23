# P2007 K16 draft 投影独立 SOURCE/AUTO R1

> 2026-10-23，平台 trae，角色独立 SOURCE/AUTO 专家，非开发/GUI。**有限 PASS：本轮锁定生产源码的 K16 draft 投影及列明受影响 AUTO 专项；原 GUI/archive 红主chain与 P2007 整项不关闭，不裁 ordinarycommit。** 终审保护与资源释放以本前缀 [seal](p2007-archive-projection-source-auto-20261023-r1-seal.json) 实际结果为准。

## 1. 授权与对象

负责人原句：

> 父授权验所有已实现未验/修确证缺陷直到ordinarycommit，无push/release。你独立SOURCE/AUTO专家非开发/GUI，限定K16 draft投影。开发released交docs/plans/2026-10-23-p2007-archive-draft-projection-result.md/plan/runner/seal：仅src/core/archive.ts pickReflection＋既有src/core/archive.test.ts真实reflectionRecordSchema嵌套draft三sourceEvent/knownpendingblank/gaps/readonly/跨项目。有效旧5红，修后9/9、四受影响35/35，379声明inputs1019deps保护，设施首失败保，不拿开发runnergreen代独立。读AGENTS/collaboration§9/11、独立p2007-archive-known-gaps-red-20261023-r1.md§6、上述devseal等。独立内置reader核指纹/精确delta/真实schema及输入保护；自有新/tmp复制输入与node_modules只读links/HOMEconfigcacheoutput隔离，自有runner直接运行生产archive与原四受影响专项各一次，必要独立7known2gap字节断言（可参考公开原合法records，不过不能执行devrunner/mirrorhelper）。仅新docs/testing/p2007-archive-projection-source-auto-20261023-r1*文件，不产品/旧testing/plans/原封包/livingdocs修改。Main唯一builder/GUI，不install/build/noEmit/全verify/GUI/service/Git/凭据/private frozen/runtime；P1004/P1005/任务出站位在途不碰。仅限SOURCE/AUTO有限PASS或真实FAIL，原GUI/archive红主chain与P2007整项不关闭，不ordinarycommit。列全部命令exit/输入漂移具体归因/边界；seal＋released/STOP。

依据 [AGENTS](../../AGENTS.md) §6A、[collaboration](../collaboration.md) §9/11、[原独立缺陷合同](p2007-archive-known-gaps-red-20261023-r1.md) §6、开发 [result](../plans/2026-10-23-p2007-archive-draft-projection-result.md)/plan/runner/seal。本次明确范围覆盖通用 fetch/pull、构建/全回归、livingdocs同步、提交步骤，未额外获取任何开发权限。

## 2. 独立 SOURCE 审签

内置 [reader](p2007-archive-projection-source-auto-20261023-r1-reader.mjs) 只用 Node 内置模块，不加载产品/开发runner。独立核开发seal全部列明输出大小/SHA、released/stop、379保护输入、1019依赖及192原索引件/194物理成员。具体逐件指纹见 [audit](p2007-archive-projection-source-auto-20261023-r1-audit.json)；不是沿用开发自报零漂移。

| 绑定源码 | 实际修后字节/SHA256 | 独立精确增量 |
| --- | --- | --- |
| `src/core/archive.ts` | 9339；`46ab5017b32443d086712b83c34f63e35982588a045a7e6bc3b5ca54423f7140` | +4/-3；type import、pickReflection读取draft |
| `src/core/archive.test.ts` | 12831；`c53a8bbaf5ad49d84478d667ea3279c1c6be23cc00592254ecc58767e71e730b` | +164/-9；合法fixture及必要专项 |

reader结构化解析unified hunks，从修后实际源逆向恢复原字节；旧SHA分别为 `097f1860da2ee67a29b59f7f1047743e538acfab8856b93b344afb9c88badd55`、`c0648d39c040c11d4f8e36a0744dc5e980eea82f194d6512d6a603ec780e73f6`，与开发baseline及独立旧红证一致。不执行或修改旧源码造红。

生产变更仅使 `draft.lines` 的known筛选与 `draft.gaps` 生效；原ID、sourceEvent、status、三个关联字段、时间、项目过滤和顺序未改。`ReflectionRecord` 是type import，无运行时替代schema、顶层fallback或迁移。合法schema必有draft/lines/gaps，非法缺draft兼容不是本合同要求。

开发三轮94源清单在红→绿之间只有archive.ts指纹变化，archive.test.ts同一SHA；绿→受影响清单一致。独立核已封输出与真实断言失败日志，确认旧实现5红/4有意过滤，未见schema/import错误；不把这份开发日志视为独立产品执行结果。首开发capture ENOENT设施失败仍保存在原开发commands/result，不洗成产品红。

baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` **仅为开发/原专家声明**，本角色不运行Git，未独立核HEAD、完整tracked diff或组合候选。本审签仅绑定上述实际源字节、36件闭包与声明依赖；不能由此声称整个dirty树只有两个改动。

## 3. 独立 AUTO 实际执行

macOS/Darwin 24.6.0 arm64，Node v22.23.3，Vitest 2.1.9，Vite 5.4.21，Zod 4.6.5；已装storage-domain 0.2.1-alpha.2、Cordis 4.0.5-alpha.1。不调用pnpm、install/build/noEmit或全verify。

有效自有根 `/tmp/p2007-archive-projection-source-auto-20261023-r1-PkIBQo`：36件必要生产源/原四测试、package.json/pnpm-lock及4份公开fixture，共42件复制输入逐SHA核对。独立 [runner](p2007-archive-projection-source-auto-20261023-r1-runner.mjs) 用白名单环境和自有HOME/config/cache/output/TMPDIR，既有node_modules只读使用链接。测试直接导入本轮复制的生产 `archive.ts` 与真实 `storage.ts`，不使用lib、原宿主runtime、devrunner或mirrorhelper。

| 命令/文件 | exit | 独立结果 |
| --- | --- | --- |
| `node --check ...-reader.mjs` 首次/修正后/终审 | 各0 | 内置reader语法 |
| `node ...-reader.mjs capture` 首次 | 1 | 本专家设施失败，见§5；不是产品红 |
| `node ...-reader.mjs capture` 修正后 | 0 | 独立输入/输出指纹核验与新隔离复制 |
| `node --check ...-runner.mjs` | 0 | 自有runner语法 |
| `node ...-runner.mjs affected` | 0 | 原四专项各执行一次，35/35，无skipped |
| `archive.test.ts` | 同上0 | 9/9；含三事件/known/pending/blank/gaps/只读/跨项目及4旧例 |
| `review-materials.test.ts` | 同上0 | 9/9；原周期/done/wrapped/null/跨项目/Markdown |
| `export-isolation.test.ts` | 同上0 | 7/7；原目录/越界/软链拒绝 |
| `export-outbound.test.ts` | 同上0 | 10/10；原渲染/审计/TTL/覆盖/Markdown |
| `node ...-runner.mjs bytes` | 0 | 自有独立生产字节专项3/3，无skipped |
| `node ...-reader.mjs seal` | 以实际seal/终端为准 | 当前输入、收据、复制JSON、依赖、原包成员终核及释放 |

命令均使用现有Node完整绝对路径及 `/usr/bin/env -i`；全部具体命令、探索命令及非0在 [命令账](p2007-archive-projection-source-auto-20261023-r1-commands.md)。两执行的完整argv/cwd/env/UTC时刻/exit/流指纹在 [affected receipt](p2007-archive-projection-source-auto-20261023-r1-affected-receipt.json)、[bytes receipt](p2007-archive-projection-source-auto-20261023-r1-bytes-receipt.json)，stdout/stderr与Vitest结构化结果按同标签保存。测试共38例，archive9已包含在35内，不重复累计成47。

## 4. 原7句/2gap独立字节守卫

[自有专项](p2007-archive-projection-source-auto-20261023-r1-bytes.test.ts) 读取公开原包 `round00-resume-raw` 三反思信封的record，经本轮实际 `reflectionRecordSchema.parse`；项目也经真实project schema。预期7句/2gap在独立测试中显式列出，没有复制pickReflection或从生产输出生成预期。

| 真实ID / event | known/gap | 实际审签 |
| --- | --- | --- |
| `ref-mvi5z85j-yk04ji` / task-done | 4/0 | 逐UTF8字节、ID、task关联、status、时间完整 |
| `ref-mvk0iiij-42f7xa` / milestone-achieved | 1/1 | 同上，milestone关联完整 |
| `ref-mvk0n0me-25tmos` / deliverable-accepted | 2/1 | 同上，真实dlv-0001关联完整 |

结果 [original-records-projection](p2007-archive-projection-source-auto-20261023-r1-original-records-projection.json) 留完整snapshot/review与known/gap十六进制字节；两gap文本恰好相同，仍按两记录各保留一条，不去重。另合法跨项目记录插在三事件之间，输出三ID保持源顺序且无串入；同源review仍7句/计数7。

深冻结源记录/嵌套数组、全预置表前后structuredClone、记录引用身份、读域禁止put/delete，均满足；另真实schema空lines/仅pending及blank不造known而保留多gap。真实schema接受原合法嵌套值、拒绝缺draft顶层旧fixture及旧ID/枚举。

这里只用内存读域提供表边界，并非命令保存/标准恢复/真实持久域验收；未把其他原业务表、真实task done/wrapped状态或GUI流程加入本测试。通过原review专项不意味着真实主chain的周期/done/wrapped余链已经通过。

## 5. 保护、设施偏差与归因

开发封存→本轮capture：379保护输入漂移 **0**，1019列明依赖漂移 **0**，36件受影响闭包均与开发绿清单一致；开发seal产物大小/SHA逐件满足。独立当前保护清单为414件，外加1019依赖和42复制输入，终审前后具体漂移以seal为准。发生变化须按具体path/旧新SHA归因，不把共享并行变化自动算本产品失败；受影响闭包/原包/开发封证或实际执行输入漂移则不放行。没有观察到需归因的输入差异。

首自有capture实际exit1：reader错误递归枚举 `docs/testing` 后才过滤，查看了子目录成员元数据，在node_modules软链处拒绝。未读取那些子目录文件正文、未沿软链、未加载或执行private frozen/runtime/helper。**这是不必要元数据枚举的真实设施偏差，不能声明“从未访问任何子目录”。** 仅修改自有reader为顶层枚举明确前缀；保留 [原失败输出逐字转录](p2007-archive-projection-source-auto-20261023-r1-capture-first-error.log) 和首失败根 `...-QSkpxQ`，不冒称原失败有spawn receipt。第二capture才生成有效audit并运行测试，产品/测试源未改。

已列全部实际写根：本轮新 `docs/testing/p2007-archive-projection-source-auto-20261023-r1-*` 文件，以及上述QSkpxQ/PkIBQo两自有tmp根。原四专项清理仅发生自有TMPDIR下；export-isolation留下的隔离临时目录亦仅在该根。不清原日志/原成果。

links非OS强制只读，保护只是明确文件前后指纹；1019文件是五个明确依赖包，不是全依赖图。没有对完整业务根、全库或全盘作零污染保证。未修改产品、旧testing、plans、原封包、livingdocs、上游、依赖、profile/lib/凭据；未执行P1004/P1005或任务出站位的新在途用例/改其锁，必要闭包/保护文件仅只读核验。

## 6. 有限裁定与停止

**SOURCE有限PASS**：绑定源中 `pickReflection` 已读取真实嵌套draft，不扩大修复范围。**AUTO有限PASS**：独立35/35与3/3证明列明投影/受影响单元边界，不拿开发绿代独立。

原 [K16 GUI/archive FAIL](p2007-archive-known-gaps-red-20261023-r1.md) 保留；本轮不修改该报告，不关闭其原主chain或P2007整项。Main唯一builder/GUI须后续认领新组合候选并按原§6合同做构建/全回归、新host composer→RPC→原包/README→真实file→DB/原根→重进复读，以及真实done/wrapped/周期余链，再交独立审签。当前有限PASS不能直接继承给新组合候选。

本角色 build/install/noEmit/全verify/GUI/service/Git/ordinarycommit/push/release 均 **NOT_RUN**，原因是明确权限边界，不伪记MANUAL_PENDING。没有产品/builder/GUI/端口/业务锁；两个同步测试子进程均返回。交付本轮seal后 **released / STOP**，不开始下一项或普通提交。
