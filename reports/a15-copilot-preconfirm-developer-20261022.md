# PC01 / PC02 限定开发交回

> 2026-10-22，平台 trae，开发角色。给 Main 与另派的独立测试专家接续；本报告记录源码修复、开发自验及保护边界，不自签 PASS，不替代新 GUI 或整体放行。

## 1. 授权、合同与状态

负责人限定原句：

> 限定开发修PC01/PC02已独立确证P1。用户持续验完全部已有/修确证/独立分离/最后统一commit授权，不再审批，不push。
>
> Main A14冻结GUI/3245与A13import3242不覆盖，禁build/install/sharedlib/cache/GUI/services/credentials/commit。
>
> 源码修复仅基于有效合同，不开新功能。若发现重要范围扩大先报，继续最小可行。

最新 Main 接续原句：

> Main补件阶段已完成，当前A14freeze/lib仍未变；PC01/02原合同由专家确认P1，A14/final/conflict原GUI产品FAIL保。请继续限定实现，关键必须只成功target更新base、失败/0应用不捞旧undo、保四扩展source keys。Main后续将上下文接续，不改变你的文件ownership；交报告释放后独立复验另派，不自行build。

已读 `AGENTS.md`、`docs/collaboration.md`、当前 progress/相关交接档案、[已批准修复计划](../docs/plans/2026-10-22-copilot-preconfirm-closure.md)、[先行测试合同](../docs/testing/a14-preconfirm-conflict-contract-20261022-plan.md)、[独立缺陷报告](../docs/testing/a14-preconfirm-conflict-contract-20261022.md)、原 cases/runner，以及现行 RA-AI04、CMP 和相关生产实现。执行已批准方案，不另开设计/审批。

**状态：限定源码修复和开发自验已交回，写域释放；独立修后结论仍待另派专家。** 原 PC01 GUI FAIL、PC02 失败分支 GUI NOT_RUN 均保留。未开展 build/install/full verify/coverage/GUI/服务/profile/凭据/commit/push；未改公共 livingdocs、testing 原件或 vendor。未 pull 合并在途树。

## 2. 实际写面与修复

产品与测试仅两文件，无新增 helper：

| 文件 | 变更 |
| --- | --- |
| `packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx` | `runApply` 使用生成时已保存的 `openedAt`；本轮实际应用集合守依赖；按实际数量识别成功；只推进成功 update 目标；fresh undo 数量/时间窗认领 |
| `packages/dsh-pm-tool/src/client/shared/drawers/copilot-preconfirm.test.tsx` | 新增20项真实 `CopilotPanel` 回归，生产 schema 合法种子及真实 `parseCopilotPlan/validatePlan`，只替换传输与浏览器设施 |

其余自有写入均在 `reports/a15-copilot-preconfirm-developer-20261022*`：本报告、runner/checker、各轮冻结、命令/日志/reporter/manifest/开发补丁。未改 panel/TaskForm/backend/schema/model/其他 product/testing/livingdocs。

- 计划快照与最新只读投影分离。首次确认不再使用刷新后的 props baseline；取消仍零写，明确再生成才建立新执行基线。沿用已有 `openedAt`，不增加新存储或协议。
- 单步返回必须 `kind=success` 且实际“已应用1步/条”，才加入本轮前置成功集合。应用0、错误、幂等命中、未知成功文本均不算成功；未勾选/失败前置的下游不发送，给现有消息区明确跳过文本，独立步骤继续。
- 同目标成功后按 op 对应 `tasks/milestones/riskIssues/deliverables/meetings` 重读，只更新实际成功目标 ID 的 `updatedAt`，并核 projectId。所有其他待目标及已有四扩展 baseline keys 保持生成值。只读重读失败保原 base，不全面刷新洗白外改。
- 不修改 `forStepwiseApply`；只有前端已核前置实际成功后，才沿原单步协议清 needs。整批 needs 原样交后端守卫。
- 失败/0应用不查询 `ask-undo list`。实际成功才 best-effort 查询，只取本次调用开始至列表读取时刻内、有有效 `at`、未被本地认领的新句柄；旧/无时点/读取失败不制造撤销入口。整批标签按实际应用数量，不把 mixed 的3个选择显示为3步已应用。

本修复保留调用者已提供的四扩展键，不新增 panel 的基线收集/新的协议字段。撤销列表仍是既有进程级 `{id, at}`，时间窗认领不是跨客户端全局事务身份证明；本轮未证明多客户端同毫秒并发归属，也不以此扩写后端。

## 3. 候选认领

- Git基线及当前 `origin/main`：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。HEAD不代表脏候选。
- 自有修前冻结：`a15-copilot-preconfirm-developer-20261022-selftmp/r1/before/frozen/`，完整385个src文件及现有配置/scripts；修后最终 `r4/after/frozen/` 完整386个src文件。
- 修后复制修前完整包输入，只覆盖上述两文件。跨副本内容差异恰为产品1修改、测试1新增；没有删文件。复制mtime存在196项精度舍入，单列，不把它们误作源码字节差异。原位保护仍同时比较hash/bytes/mtime。
- 原A14 manifest SHA256：`f89160400a28ba78af722303c01fe9caf3f596657b3d9767f4984a3569d85284`；全部声明 source/artifact逐字节校验未变。保留原A14产物/实例，不构建新产物、不宣称新实例激活。
- 原专家 cases SHA256：`18093da170e61c626ee434abe1fb467fc7b68da0727e7b6edfdb0b8de149c0da`。仅复制到自有冻结执行，所有 oracle/expect不改。

| 最终源码 | SHA256 |
| --- | --- |
| `sidecar-portal.tsx` | `7cf48821e7e6ee570288c385b59897fd33f8ab0ec32da42ef87111c2c016a269` |
| `copilot-preconfirm.test.tsx` | `26c214236164b60b11a795cfa675f64ae886ec7003de1bb01d337439b8118041` |

[精确开发补丁](a15-copilot-preconfirm-developer-20261022-selftmp/delivery-r2/developer-only.patch)只含产品文件修前→修后差异；[新增测试原件副本](a15-copilot-preconfirm-developer-20261022-selftmp/delivery-r2/new-test.tsx)与主树同hash。整候选 tracked patch、新文件清单、依赖及所有src指纹另存每轮 `main-tracked.patch/main-new-sources.json/candidate.json/source-manifest.json`，不把开发补丁扩大为整包身份。

## 4. 命令与结果

环境 macOS Darwin24.6.0 arm64，既有 nvm Node22.23.3、React/renderer18.3.1、Vitest2.1.9、Vite5.4.21、TypeScript5.9.3、Zod4.6.5；pnpm11.28.5为项目既有要求，本轮未调用pnpm。既有依赖只读复用，未安装。

各子命令采用白名单env：`PATH=<Node22目录>:/usr/bin:/bin:/usr/sbin:/sbin`、自有 `HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME`、`CI=true`、`LANG=en_US.UTF-8`、`TZ=UTC`、`NODE_DISABLE_COMPILE_CACHE=1`。原例另带自有 `PC_INPUT/PC_OBSERVATIONS`。没有继承任何key/token。Vitest单fork、`--no-cache`，Vite cacheDir也限定自有前缀。精确 executable/argv/cwd/env/start/end/exit/signal及stdout/stderr/原JSON reporter均见每轮 `commands.json` 与逐命令 `*.command.json`，不是下面命令摘要替代原证。

实际父入口，运行cwd为本仓库（每轮不覆盖）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a15-copilot-preconfirm-developer-20261022-run.mjs before r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a15-copilot-preconfirm-developer-20261022-run.mjs after r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a15-copilot-preconfirm-developer-20261022-run.mjs after r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a15-copilot-preconfirm-developer-20261022-run.mjs after r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a15-copilot-preconfirm-developer-20261022-run.mjs after r4
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a15-copilot-preconfirm-developer-20261022-check.mjs delivery-r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a15-copilot-preconfirm-developer-20261022-check.mjs delivery-r2
```

| 实际命令组 | 结果/原退出码 |
| --- | --- |
| before r1 原 PC-C01/C02 | 0/0，控制可用 |
| before r1 原 PC-A01/A02 | 1/1，确认送最新base、0应用仍发依赖两个必要红；原失败保留 |
| after r4 原 PC-C01/C02/A01/A02，各单例 | 0/0/0/0；每次1项执行、3项skipped，不把未执行项算通过 |
| after r4 regression，9文件87项 | exit0，87/87；新20项+原周边67项 |
| after r4 完整冻结tsconfig `--noEmit --incremental false` | exit0；非局部文件typecheck，无lib输出 |
| delivery-r2 两脚本 `node --check`、`git diff --check` | 各exit0 |
| delivery-r2 `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` | exit0，仅只读静态指纹门，未运行vendor正文/installer/selftest |
| delivery-r2 `git diff --no-index --binary` | 原exit1：文件确有差异的正常diff状态，不算测试失败 |
| delivery-r2 精确runner `pgrep -fl` | 原exit1：无匹配runner；未kill任何进程 |
| after r4 父runner、delivery-r2父checker | exit0/0 |

修前父工具返回执行ID，未取得其末态码，登记 `NOT_CAPTURED`；不推定父exit0。四个同步测试子命令0/0/1/1、summary和保护审计完整留存，检查器已逐项核原reporter。其后每轮父工具末态均实际捕获。

9文件回归完整名单：新 `copilot-preconfirm.test.tsx`、原 `sidecar-minimize-retention.test.tsx`、`panel-checklist-toggle.test.tsx`、`panel-launch-handshake.test.tsx`、`provenance-panel.test.tsx`、`shared/task-draft-materials-stage.test.tsx`、`core/copilot-validate.test.ts`、`core/copilot-task-fields.test.ts`、`core/ask-projection.test.ts`。覆盖成功同目标链、独立目标外改、四扩展同目标基线、失败/0/幂等/未知回复、未勾选前置、编辑、取消再生成、最新只读投影、最小化上下文/输入/主表单、fresh/mixed/旧句柄、只读设施失败及周边来源/材料接缝。

最终测试UTC区间 `2026-10-21T22:47:28.385Z`–`22:47:47.347Z`，本地2026-10-22。核心原证：[修前commands](a15-copilot-preconfirm-developer-20261022-selftmp/r1/before/commands.json)、[最终commands](a15-copilot-preconfirm-developer-20261022-selftmp/r4/after/commands.json)、[87项reporter](a15-copilot-preconfirm-developer-20261022-selftmp/r4/after/regression.result.json)、[交付检查](a15-copilot-preconfirm-developer-20261022-selftmp/delivery-r2/delivery.json)。

## 5. 全部失败与警告保留

- after r1父exit1：原四例全0、noEmit0，但新20项被错误fixture `code=t-0001` 的生产编号schema拒；周边67项正常。仅将自有fixture编号改为合法数字，同时用四扩展生产record/write schema建合法种子，业务expect未降低。
- after r2父exit1：86/87，原最小化“主表单取消后undo仍在”用例偶发缺undo。原因是其现有桩在列表查询时生成at，而首版实现上界截在apply返回；局部改为调用开始至列表读取时间窗，仍拒旧/无时点句柄，原周边测试不改。
- after r3父exit1：全部测试和noEmit0，但A14原证根并行新增27个 `execution-index` 文件使完整保护审计报漂移；没有删除或覆盖既有字节。原audit保留，不洗为0。
- delivery-r1检查器exit1：跨冻结副本完整mtime比较误算196项复制精度差异；未修改任何测试或源码。检查器改为跨副本内容差异/复制时间差异分别记录，原位保护维持完整mtime比较；失败目录保留。失败摘要为 `sourceDelta` 预期2项、实际198项，并非产品回归。
- 所有原日志/reporter/exit保持原文件。原TaskTable key警告、MaxListeners警告与周边卸载 `requestAnimationFrame` 设施警告保留；未因此修改不归本批的页面或测试，不把警告写成已修。

## 6. 保护范围与审证边界

每轮 `protected-manifests.json` 保存完整前后hash/bytes/mtime，包括主src/lib、A11/A12/A13/A14 lib、A14 src、A14原证根、原专家测试/runner/报告/原r1冻结及证据、七个实际依赖包、主与A14各三处共享缓存、mattpocock vendor。最终r4轮内漂移0，交付延长检查current/final漂移0；原A14声明漂移0、自有冻结测试执行前后漂移0。

跨整个开发区间不是“全根零新增”：主src仅授权2文件差异；A14证据根共有46个并行补件新增，含execution-index及clean/fresh-file/import supplement，无原文件覆盖/删除。细项/指纹在交付 `classified`；开发工具不写该根。Main最新消息确认补件完成，原freeze/lib不变；不独立替补件签内容或作者身份。

未检查全机/所有间接依赖/正式data/profile/上游/服务健康，不能声称全机零污染、服务已恢复或GUI通过。没有新bundle/实例/下发认领。SOURCE/AUTO不能替代PC-G01..04新候选真实GUI、后端落盘或全门。

外部Skill：读治理政策/manifest，静态校验exit0，锁commit `49dd158d1076134a641b33efb035946536778336`。依据 `external-skills.md` §6.1 独立门仍FAIL时自动加载拦截，本轮未加载vendor正文；使用既有先行合同组织红绿和本地质量自查，不由vendor自签结论。

关键证据SHA256：最终commands `79a5cb654808d09f2e9d13c949675766b8049faad9e5baeebedf072e4119b3c5`；最终完整source manifest `749dd375398a18aff246b4826d274482d34c41d233fb405efeb4e5a6601bc2e1`；最终保护manifest `7edb05b558808df285e2c9657cd5759b18c4c6050d3f43b39f79f5ee62c06ebb`；交付检查 `da5f2e4f7180ca7adaf026c54f36cc4691b0a1c2294a166914c22e938048118c`；开发补丁 `67ac57fd452463f5bb127a5dccbc64b49cde42420564165e6d10abe68d79c037`。

## 7. 释放与下一步

本开发不再持有两源码/测试文件写锁，没有builder、端口、GUI或服务所有权；同步子进程已退出，精确查询无本runner，未停任何Main/正式服务。

由 Main 接本报告，另派**不同独立专家**按原PC-C/A合同 SOURCE/AUTO复验并审受影响回归，不由开发兼任审签。专家原件继续只读，不在此创建testing报告。

独立源码/自动复验后，由 Main 唯一builder新输出构建/完整回归/新实例/uncached下发，再按原PC-G01..04采GUI，专家判定。其余已有积压继续沿父任务；不新开功能，不用本开发绿替换原GUI FAIL。公共档案和最后统一commit仍由Main在全部适用独立门闭合后收口；本开发不commit、不push。
