# 循环原因修复独立复验报告

> 2026-10-22，平台 trae，不同独立 SOURCE/AUTO 复验角色，非开发、非 GUI。本件给 Main 接续修后 GUI 使用；不签整反馈域、父任务完成、commit 或发布。授权、原句和先行顺序见[本轮计划](cycle-feedback-independent-retest-20261022-r1-plan.md)。

## 1. 有限结论

**有限 SOURCE/AUTO PASS。** CF-R01/R02 在开发交回的五文件修复候选上独立复验通过，原专家同字节 **10/10**、开发同域 **29/29**、既有受影响 **134/134**，每组失败0、pending0、原退出码0。完整插件 noEmit 退出码0，源码窄增量审查通过，890 个列明保护对象无漂移。

**GUI BLOCKED。** 本角色未构建、未加载新宿主、未操作浏览器或服务；原 U4r2/3257 仍是旧 bundle，不能代表新修已激活。错误卡可见性、完整 O3 用户旅程、O4 ESC 等未签门保留，由 Main 在新候选补证后交独立审签，不转 MANUAL_PENDING。本 SOURCE/AUTO 结论不等 GUI、整反馈域或父目标通过。

本轮未发现新产品缺陷，无设施失败、signal 或超时。原先行8绿2红、先行审计首次失败、开发红轮/绿轮均未覆盖，不把本次绿追写到旧证据。

## 2. 候选与来源

- 基线 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 加原 dirty 候选，不以 HEAD/version 单独认领。
- 开发来源：[delivery](../../reports/all-pending-evidence-20261021/CycleFeedbackDevR1/handoff/delivery.json)、[五文件增量](../../reports/all-pending-evidence-20261021/CycleFeedbackDevR1/handoff/increment-files.json)。开发已释放；本角色另建完整自有冻结，不在主树或 developerfreeze 运行测试。
- 被测根：`docs/testing/cycle-feedback-independent-retest-20261022-r1-selftmp/r1/frozen`；完整 src/scripts/locale 和六项包/配置输入合计 **509 文件**，与开发 complete-input-files 逐项 SHA/文件集合相等；**104 项**继任声明与当前对应字节相等。
- 原 U4r2 `/private/tmp/pmtool-u4-closure-20261022-r2` 的旧102声明全部仍符合旧字节；三个产品变更已使旧102不代表新修。两个新增测试不在旧冻结中。
- [本轮候选](cycle-feedback-independent-retest-20261022-r1-selftmp/r1/candidate.json)、[完整绑定](cycle-feedback-independent-retest-20261022-r1-selftmp/r1/binding.json)、[完整输入](cycle-feedback-independent-retest-20261022-r1-selftmp/r1/complete-input-files.json)、[tracked diff](cycle-feedback-independent-retest-20261022-r1-selftmp/r1/tracked-product.diff)、[新增文件清单](cycle-feedback-independent-retest-20261022-r1-selftmp/r1/untracked-product-files.txt)、[仅五文件修复 patch](cycle-feedback-independent-retest-20261022-r1-selftmp/r1/increment.patch)均保留；不将全部 dirty 变化归为本修复。

五文件相对 `packages/dsh-pm-tool/`，SHA256：

| 文件 | 修后 SHA256 |
| --- | --- |
| `src/core/tasks.ts` | `b1282115dc204d61241477d67a16a05496b364a688f1223eb773765454461b29` |
| `src/commands/task.ts` | `1af8ac22df8d5876c4738e5c44fe8ec019d34678a3868e5c90c37197bc88863b` |
| `src/client/result-card.tsx` | `b6955651b80894832dc3b508c3dbbd5cdbd514f01b325ac9e62d39d38b36decf` |
| `src/commands/task-predecessor-feedback.test.ts` | `cc7bab8b673c3cbbf6e58fa3ab68f47343aaba98c2c883e6c476bed6332ed792` |
| `src/client/result-card-permission.test.ts` | `ff32f9024d4896b2a18fee8ff5e28b87d2e87fac81a51388db8e9086329ae4a9` |

修复 patch SHA `2ab3267ea09dff1fbd72b7e3ad8b75bcf20318f9f154e1e1931caee74ce66ed2`；tracked diff SHA `e4c66db0f8a34f3c02e864e95b21e46f02528cf14fbcfee2b2fb88fb91d57dde`。开发 successor104 清单 SHA `4553c22f68fa217319742233bd6c0c9c269d00d10aec06a0bf385a80b1f5641f`，complete509 清单 SHA `d150b20db01f317c7d52819b2f029cc914b28324a4e2bfd927ae5617dd8e4c9d`。

## 3. SOURCE 审查

已手读原合同、生产链与五文件 patch；[结构化审计](cycle-feedback-independent-retest-20261022-r1-audit.json)另用既有 TypeScript5.9.3 AST 定位增量，移除限定新增节点/还原四 constructor 和权限调用后，三个产品文件分别**逐字等于旧 U4r2 文件**，不是仅用行数推断无旁改。

- `core/tasks.ts` 只增加空 `PredecessorRelationError extends Error`，自身/不存在/跨项目/循环四处改窄类型，中文原因完全保留。DAG BFS/去重/schema/队列/写前校验/持久化均无旁改。
- `commands/task.ts` 只增加该类 import 和现有 `instanceof` 已知业务分支；不是 `instanceof Error` 全透。未知异常仍保守兜底；空 AggregateError 兜底、原非空 AggregateError 的原始错误/回滚摘要保持原处理。
- `result-card.tsx` 只增加局部原因 helper 和权限判定调用。只在开头剥除四个已知场景前缀和可选 Error 前缀，认权限不足/无权/EACCES/EPERM/完整 permission denied；不扫整段“权限/denied/not allowed”。没有删除全部权限标签，没有改全局 classifier。
- explicit context、错误全文、复制、messageGeneration、成功信封和3秒策略的产品实现字节不变；行为再由下列原例与受影响回归验证。

## 4. AUTO 原例与回归

环境 **macOS/bash，Node v22.23.3，Vitest2.1.9，TypeScript5.9.3，React/react-test-renderer18.3.1**；pnpm11.28.5 仅背景未调用。冻结复制既有 U4r2 依赖13579文件/1030内部软链，重定位内链；外链/共享 inode/依赖字节漂移均0。不使用主树 node_modules 执行。

Vitest 实际 cwd 为本轮 frozen；`--no-cache`，单 fork、minWorkers=maxWorkers=1；白名单 PATH/HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME/PM_FILE_ATOMIC_TMP/CI/LANG/TZ/NODE_DISABLE_COMPILE_CACHE/CF_INPUT/CF_OBSERVATIONS，所有可写设施根均在本轮 selftmp。不继承密钥或网络配置。

| 组 | 独立结果与核心事实 |
| --- | --- |
| 原专家10项 | 原 cases SHA `2eafe15ca37ab6768ee429a6a165e057cb823a313f6274883dea33f8ea6a783a`，复制前后相同，原 oracle 未改。CF-C01/C02/C03×2/C04×2/C05/C06 八控制与 CF-R01/R02 全通过。 |
| CF-R01 | 生产 API 建合法两项目九任务，真实 command 建 t8→t9 再反选；返回 `{kind:"error",text:"前置依赖存在循环：任务不能间接地依赖自己"}`，全域内容相等/newWrites=[]；持久 error/alert/全文/无动作/无权限标签断言全部执行通过。 |
| CF-R02 | 从封存45真实RPC提取输入并与先行输入逐结构相等；原通用排查文字→生产 ResultCard，kinds=[]，alert/assertive/全文/无动作保持。不是仅检查返回字符串或 mock 新组件。 |
| 八控制 | core循环原因/零put、解除后同稿 retry 一次tasks/t-0009 put、合法标题含失败/Error/Failed/权限/permission成功不误红、明确权限两正例、未知存储不泄露输出、既有里程碑 typed 原因/零写。 |
| 开发同域29项 | command11项：四update/三add拒绝，窄类型、全域零写、稳定ID、去重/retry、未知Error/空Aggregate兜底和既有回滚摘要；ResultCard18项：九建议/非权限/引用正文反例、八明确权限正例、一成功信封控制。九反例同时全文复制/无动作；全部通过。 |

既有受影响134项原文件不改，结果来自本轮 JSON reporter：

| 既有文件（相对产品根） | 通过数 |
| --- | ---: |
| `src/commands/task-feedback.test.ts` | 3 |
| `src/core/ui-feedback.test.ts` | 32 |
| `src/client/result-card.test.ts` | 7 |
| `src/client/result-card-copy.test.ts` | 3 |
| `src/client/index-command-feedback.test.tsx` | 9 |
| `src/client/panel-transport-error-feedback.test.tsx` | 23 |
| `src/core/tasks-files-atomic.test.ts` | 31 |
| `src/core/task-ops.test.ts` | 7 |
| `src/core/task-materials.test.ts` | 12 |
| `src/client/shared/task-relation-projection.test.ts` | 7 |

包括真实命令通知映射、transport/context/quiet错误全文、标记正文不成动作、成功清context、旧copy/同值代际/排队timer、资料/历史/软删/引用、原子补偿及关系展示。JSON原子31项使用真实 Context/JSON/domain；全部 `file-atomic-case-*` 数据、文件、逐例 observations 留在本轮 `selftmp/r1/tmp`，没有主树或正式业务落盘。

**计数只分别写10/29/134**，三个测试文件集合互斥，每组仅运行一次；不累计开发自测、旧先行或历史绿。不将 memory domain、注入依赖异常、mock transport、组件 renderer 或手调计时器称为真实浏览器/真实磁盘权限实测。original/new stderr保留预期未知异常控制的console.error栈，不向command结果透出；affected stderr为空，不洗成所有日志均空。

## 5. 全部执行与原证

macOS/bash，在仓库根执行下列设施命令；原 argv/env/cwd/起止/PID/exit/signal 在各 `*.command.json`。三个 Vitest 均 verbose＋JSON 双 reporter；日志与观察值在[自有原证根](cycle-feedback-independent-retest-20261022-r1-selftmp/r1/)。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs test original
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs test new
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs test affected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs noemit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs close
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-independent-retest-20261022-r1-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/cycle-feedback-independent-retest-20261022-r1-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/cycle-feedback-independent-retest-20261022-r1-audit.mjs
```

| 动作 | 原退出码 | 结果 |
| --- | ---: | --- |
| freeze | 0 | 五增量/104/509/依赖/890保护认领通过 |
| test original | 0 | 1文件10 PASS，0 FAIL/pending，PID34042 |
| test new | 0 | 2文件29 PASS，0 FAIL/pending，PID34567 |
| test affected | 0 | 10文件134 PASS，0 FAIL/pending，PID35079 |
| noemit | 0 | 完整插件配置 `tsc --noEmit --project tsconfig.json`，PID35434，stdout/stderr为空；配置按原规则排除test文件，不假称测试类型也被完整检查 |
| close | 0 | 上述四PID已退出，remaining=[]，保护全同，released=true |
| AST/证据audit | 0 | 窄增量字节还原/三组全assertion passed/文件不重叠/自有seal SHA核对通过 |
| 两项设施 `--check` | 各0 | 语法检查，不计产品测试 |

reporter SHA256：

- `original.result.json`：`6a744b8ba951a92a7d861b4b7cbc9a8de38bbdcd60e9398d1fb168189687b08d`
- `new.result.json`：`8b552140e1fe657c134ce6d097ed513241409a4c8c969b9a719b06e2581d9a01`
- `affected.result.json`：`68a0c7f26c1f71322315e777b5a3874e43fb9ddd7bdf0ef33b38e0f00b02fa8a`

[审计JSON](cycle-feedback-independent-retest-20261022-r1-audit.json)SHA `d268ceb7f0f7c89282e81202889649b7bebc4c74d645e2e2f047f81c95905d0f`，含全部用例名/状态、原命令和证据bytes/SHA；[close](cycle-feedback-independent-retest-20261022-r1-selftmp/r1/close.json)SHA `a5da5db4a35fa519b47b59d5685208857fc950c1c6dd981f2e5f4841e8d74f60`。

## 6. 保护、停止与 Main 接续

冻结、三个测试、noEmit和close均核 bytes/SHA/mtime：**890列明保护对象，drift/mainDrift/frozenDrift为空，caseDrift/bindingDrift/dependencyDrift=false**。包含当前完整插件/对应104、主树已有lib、原U4r2输入/依赖/lib、A20V3 lib/Launcher声明、旧Feedback230全包、先行全前缀与原必要红/首败、开发全根含red/repaired/frozen/handoff、既有其他专家顶层原件、指定A17/A18原失败、vendor、Git index/HEAD。保护清单SHA `a833bcfdbd99dddb3ae8cb9a23617c8a83f79c8363c3e116df7ed846ddd2a7ef`。

并行其他角色合法 testing 新增不纳为污染；仅保护冻结时列明已有文件，不监视其新目录集合。保护结果不是全磁盘零写证明，也不重新签旧封包全部行为。未手改产品、旧冻结、原oracle或developerfreeze；未清理任何根、未install/build/全verify/覆盖率/GUI/服务/Git写，未加载vendor。`rg`缺失exit127及不存在记忆路径读取exit1是探索失败，不是设施或产品测试失败。

**Main 下一步只补新候选 GUI**：在新隔离输出构建并认领104/完整输入及实际bundle/宿主/开关；按既定 O3/R2 真合法种子→反选→真实拒绝→可见具体原因/无权限误导/保稿→业务零写→解除→真实retry采证，再交独立专家审签。不要用旧3257/U4r2代表新修，不扩新控件/后台穿透modal。本角色不写livingdocs，后续由Main同步。

**释放 STOP**：SOURCE/AUTO有限PASS已交回；GUI BLOCKED。3257旧U4r2、3258 AI、3259 gateway、旧3256/3248/3249/3255及正式均未探活或操作；无待运行测试/类型检查进程，不再扩范围，不签整域/父目标/commit/发布。
