# 循环原因修复独立 SOURCE/AUTO 复验计划

> 2026-10-22，平台 trae，独立复验角色，非开发、非 GUI。本件给 Main 和开发核对复验对象、命令及有限判定边界，不是整域或发布放行。

## 授权与依据

负责人本次原句：

> 不同独立SOURCE/AUTO复验角色，非开发/GUI。用户持续缺陷修复独立分工授权。只写docs/testing/cycle-feedback-independent-retest-20261022-r1*新面。
> 主树5增量三产品+两tests104认领，原U4r2不改，不build/install/GUI/services/Git写。
> 你用独占完整自有冻结及现有依赖copy/internal links/no-cache单forkenv白名单，复验原专家两红+8控制不可改、开发同域29、受影响134或精准全现相关。
> source/errors只有窄typed四关系、handler/权限明确拒，检查unknown不全透/成功含失败词不误红。
> 最终只能有限SOURCE/AUTO PASS/FAIL，GUI BLOCKED由Main后新候选补。交回后释放STOP，不因自有设施首fail覆旧绿。

上述限定覆盖通用 fetch/pull、install/build、全 verify、livingdocs 和 Git 写 SOP。只写本前缀新文件，不改其他 testing、原 oracle、产品、开发冻结或原证；合法并行 ai-terminal 自有 testing 新增不判污染。不操作或探活 3257、3258、3259、3256、3248、3249、3255、正式服务。

已读 AGENTS、collaboration §9/§11、最新 progress/handoff/onboarding/changelog 接续、先行 `cycle-feedback-reason-20261022-plan.md` / 报告 / cases / 设施首败记录、`docs/plans/2026-10-22-cycle-feedback-reason-closure.md`、开发 `CycleFeedbackDevR1/developer-report.md` 与 handoff delivery/increment/successor104/completeInputs509。以仓库字节为准，开发 10/29/134 绿仅作交回背景，不继承为本轮 PASS。

## 对象与写面

- 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 加 dirty 候选，不以 HEAD/version 代替候选。
- 原 U4r2 `/private/tmp/pmtool-u4-closure-20261022-r2` 保留。主树三产品修复及两新增测试与开发五文件交回 SHA 逐项比对；successor104 全声明和完整插件 509 输入逐项核对。
- 五文件：`src/core/tasks.ts`、`src/commands/task.ts`、`src/client/result-card.tsx`、`src/commands/task-predecessor-feedback.test.ts`、`src/client/result-card-permission.test.ts`，均相对 `packages/dsh-pm-tool/`。
- 新增本计划、`-run.mjs`、`-selftmp/r1/` 原始冻结/命令/日志/JSON reporter/保护清单、`-audit.mjs` / `-audit.json` 源码结构与证据指纹审计，以及 `-report.md`。只用 apply_patch 手工编辑设施；设施生成证据以独占新建方式写本前缀自有根，禁止覆盖。

## 顺序与判据

1. 先落本计划，再准备自有完整冻结。完整复制 src/scripts/locale 与 package、lock、tsconfig、vitest、tsdown、cordis 配置，不复制 lib。仅复制旧 U4r2 既有依赖，内部链接重定位；拒绝外链及共享 inode。
2. 源码审查仅五文件增量：四关系 throw 的窄类型与已有 handler；BFS/队列/schema/落盘不变；unknown 不全透，既有 errorAggregate 不变；ResultCard 明确原因前缀而非全文泛词匹配，explicit context/原文/复制/代际不变。
3. **original**：原专家同字节 cases，共 10 项，其中 CF-R01/R02 两原红和 8 控制。保真实 command/core/生产组件，不改 oracle，不复用旧绿。CF_INPUT 从封存 45 RPC 提取并与先行输入核对。
4. **new**：开发同域两测试文件，共 29 项，四 update/三 add/稳定 ID/解除重试/未知与 AggregateError、建议非权限/明确权限/复制/成功信封，逐项独立执行。
5. **affected**：原既有 10 文件 134 项，分别 task-feedback、ui-feedback、result-card、result-card-copy、index-command-feedback、panel-transport-error-feedback、tasks-files-atomic、task-ops、task-materials、task-relation-projection。与 original/new 文件集合互斥，不累计重复测试次数。
6. 完整包 `tsc --noEmit --project tsconfig.json` 仅在自有冻结执行，维持现有配置排除测试；不是 build，不生成 lib。与 Vitest 白名单一致。
7. 每次运行前后检查保护，保 stdout/stderr/reporter/argv/env/cwd/PID/原 exit/signal；失败立即报 Main，不改产品。设施失败另留原日志，必要自有新轮次纠正设施，绝不覆先行红或开发绿。
8. close 核本角色精确测试 PID 已退出、候选与保护无漂移，报告有限 SOURCE/AUTO PASS 或 FAIL；GUI BLOCKED，交回 Main 后释放 STOP。

## 命令与保护

运行环境 macOS/bash，Node22.23.3，Vitest2.1.9，React/react-test-renderer18.3.1；pnpm11.28.5 仅背景不调用。仓库根执行设施，下列测试真实 cwd 为自有 frozen（noEmit 为该 frozen 内插件包）。单 fork/单 worker、`--no-cache`，白名单 PATH/HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME/PM_FILE_ATOMIC_TMP/CI/LANG/TZ/NODE_DISABLE_COMPILE_CACHE/CF_INPUT/CF_OBSERVATIONS，不继承密钥/网络配置。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs test original
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs test new
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs test affected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs noemit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs close
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-audit.mjs
```

保护主树当前完整插件输入/104 声明/已有 lib，原 U4r2 完整输入/依赖/lib，旧 A20V3 lib 与 Launcher 声明，旧 FeedbackRemainingR1 全 230 封包、先行全前缀含必要红、自有审计首败、开发 CycleFeedbackDevR1 全根含 handoff/红/修后冻结，已存在其他 testing 顶层原件、指定 A17/A18 原失败，vendor、Git index/HEAD。仅冻结时列明已有原件；并行其他角色新文件不算污染，不以未 WATCH 根声称全磁盘零写。

## 进度

- [x] 只读合同与交回范围。
- [x] 计划先行落盘。
- [x] 独占冻结、509/104/五增量及保护认领：freeze exit0；890 列明保护对象漂移0；13579 依赖文件/1030 内链，外链/共享 inode0。
- [x] 原专家同字节 10 项独立复跑：exit0，10 PASS/0 FAIL/0 pending，前后保护无漂移。
- [x] 开发 29 项独立复跑：exit0，29 PASS/0 FAIL/0 pending，前后保护无漂移。
- [x] 受影响 134 项独立复跑：exit0，10 文件134 PASS/0 FAIL/0 pending，前后保护无漂移。
- [x] 完整 noEmit：exit0，stdout/stderr为空，前后保护无漂移；源审手读及 AST 窄增量字节还原均通过。
- [x] 终检、有限结论、Main 接续与释放 STOP：close/audit均exit0，四PID已退出，无残留；[报告](cycle-feedback-independent-retest-20261022-r1-report.md)仅签SOURCE/AUTO有限PASS，GUI BLOCKED交Main新候选补证。
