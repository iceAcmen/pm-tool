# A15 确认前守卫独立复验计划

> 2026-10-22；trae 独立测试专家，非开发。给 Main 按原合同接续使用；只认领 SOURCE/AUTO，不签新 GUI、RA-AI04 整门或发布。

## 授权与对象

负责人本次原句：

> 独立SOURCE/AUTO复验PC01/PC02限定修复；非开发。用户已持续授权全部未验收口及既定独立分工，Main唯一GUI/builder。只写docs/testing/a15-preconfirm-independent-retest-20261022*及该前缀自有freeze/cache/HOME/TMPDIR；不可产品/其他testing/livingdocs/build/install/GUI/services/credentials/commit。开发已交报告reports/a15-copilot-preconfirm-developer-20261022.md、run/check/selftmp，释放sidecar/newcopilot-preconfirm.test.tsx；读AGENTS/collab §9/§11、docs/plans/2026-10-22-copilot-preconfirm-closure.md、docs/testing/a14-preconfirm-conflict-contract-20261022{-plan.md,.md,-cases.test.tsx,-run.mjs,-check.mjs}、remaining-governance AI04/copilot原合同。必须不同角色独立判定真实完整新主树src在自有freeze，原PC-C01/C02/A01/A02不降低expect；核修前0/0/1/1→新0/0/0/0及作者首次PC-C02错误snapshot fixture纠正，原失败不删除。新增真实React控制/反例覆盖同目标成功链式、0应用不发依赖且独立继续、仅成功target推进base不洗白其余target外改、四扩展base keys、勾选编辑取消再生成/min/undo相关。原新测试及87作者回归/noEmit应独立跑受影响回归/noEmit，既有依赖--no-cache单fork白名单env，不build不共享lib/cache。保护main/A11/A12/A13/A14lib hash+mtime、原A14FAIL/loaded/events及专家原件。签有限SOURCE/AUTO不签新GUI/RA-AI04整门/发布。结果含候选全部输入diff/新文件指纹、命令原exit/reporter与保护；明确释放。Main同时采F02真实上传故障/重试，不动你的冻结或产品。

执行合同：AGENTS 6A、collaboration §9/§11、既定修复计划、A14 先行合同及报告、RA-AI04、CMP §0.6/0.7/0.8/0.9/0.10。不 fetch/pull 在途脏树，不 install/build/full verify，不写公共档案，不读取凭据/正式数据/profile，不操作 GUI/服务，不 commit。Main 保留全部 builder/GUI 权限。

新对象必须从当前主树直接复制完整 src/config/scripts/lock 输入，不复用开发 r4 的“两文件 overlay”作为新候选。开发报告仅参考，独立核原 reporter 与源码；旧 A14 完整 src 另复制到自有 old freeze，原专家 cases 原字节复制，所有 expect 不改。跨复制 mtime 舍入与原位 hash+mtime 保护分开。

## 执行步骤

1. 建本前缀新 rN：记录 HEAD/origin/main、全部包输入 hash/bytes/mtime、tracked binary diff、新文件清单及指纹，开发最终清单差异和 A14 声明。保护 main/A11/A12/A13/A14 lib、A14 src/FAIL/loaded/events、专家原件/原 r1、开发报告和证据、既有依赖/共享缓存。
2. 原 cases 在自有 old/new 完整冻结各跑四个单例，保原 exit/reporter。old 预期 0/0/1/1；new 预期 0/0/0/0。控制失败仍保红例采集，不用其结论冒充有效产品红。
3. 独立新增真实 CopilotPanel 测试：传输 double 在内存明确模拟 base 比较、成功更新与外改，使用生产 schema/parse/validatePlan；不是后端/落盘 PASS。修正控制不回放更早旅程 snapshot，以本轮合法初态和单调更新验证真实发送链。
4. 覆盖同目标成功、0/错误/幂等/未知回复、前置未勾选、行内合法/非法编辑、取消再生成、仅成功 target 推进、其余目标外改/四扩展 keys、projectId 错目标、snapshot/undo 读取失败、fresh/mixed/stale/future/无时点 undo。原 PmPanel 最小化及主表单旅程由原四例和原最小化回归覆盖。
5. 独立重跑作者 9 文件 87 项及完整冻结 tsconfig `--noEmit --incremental false`；既有依赖只读、Vitest `--no-cache` 单 fork、白名单 env 的 HOME/TMPDIR/cache/runtime 均自有。不加载 vendor 正文，不执行 installer。
6. 后置 check 核 reporter 实际执行项、不算 skipped，通过数/原码/信号/命令，保护延长检查、冻结内容和来源仍一致、精确无本 runner/worker。保所有失败与设施纠正。
7. 独立有限报告与释放：未新 build/装载/下发/GUI，原 PC01 GUI FAIL 与 PC02 失败分支 GUI NOT_RUN 不被新 AUTO 覆盖；Main 后续按原 PC-G01..04 采新证。

## 先行 fixture 核定

原 A14 PC-C02 只测发送序列和首 base，并不证明后端成功或时间正确。原 replay 的 initial t1=`2026-10-21T22:29:06.929Z`，s1 snapshot t1=`2026-10-21T22:29:06.853Z`，来自更早逐步旅程；不能作为本轮成功时间单调控制。开发 r1..r4 的该原例 reporter 均 passed，未查到作者首次 PC-C02 FAIL 的原报告，不补造失败或纠正历史。原件不动；新增独立控制用合法新初态、逐次成功后新时间和 base 校验，纠正实验范围，而非降低原 expect。实际证据与审签结果待 runner/check。
