# 副驾鉴权修复独立复验计划

> 2026-10-22，trae，独立 SOURCE/AUTO 专家，非开发、非 GUI；自有角色 AskAuthRetestR1。采用 writing-plans 的文件级分步方式，当前明确授权优先，不创建 worktree，不写其他计划目录，不提交。

**目标：** 独立检查 AskAuthDevR1 单行修复及原 11 项、受影响 12 文件 199 项，给精确冻结候选的有限 SOURCE/AUTO 结论。

**架构：** 沿原先行合同的真实 handleAskCommand → generateDraft → LlmRuntime → 原 pi → BlockAssembler 链；不 mock 生成或改测试 oracle。完整冻结当前 src 和五项配置只是输入认领，不代表完整构建、宿主激活或 GUI。

**技术栈：** macOS、nvm Node 22、旧 pnpm 11.28.5 依赖成果、Vitest 2.1.9；不 install/build。

## 原句与写面

负责人本批原句：

> 父多角色持续授权确证修复/全验后普通commit无push/service。你不同独立SOURCE/AUTO专家非开发非GUI，唯docs/testing/ask-auth-feedback-independent-retest-20261022-r1*自有AskAuthRetestR1。
>
> 请独立自有freeze/deps/tmp/cache执行原11+有意义affected12files199/必要TYPE、sourceexactpatch检查；AiClient/模型路由未改，AUTH/INVALID保中文credential-invalid不得写PROD_KEY_MISSING/MISSING只真实缺码，率限等也保，不增加全schema/handler改。
>
> 主rendererR2与paneldev合法并行，不锁全主/误污染，认实际子集声明完整不要预设113。源另新tests4所有owner保护仅本影响。
>
> 禁业务/testoracle/他人testing/livingdocs/Gitwrite/build/install/sharedlib/services/browse/key/vendor/正式data操作。原Reactkeywarning/failedfixtures/所有exit保。
>
> SOURCE/AUTO only newGUI待Main新build3260旧107不冒新修。releaseSTOP给有限PASS/FAIL/精确候选与后继，不签GUI父goalcommit，别重复其他agent。

仅新增本前缀 plan/runner/report/delivery；证据、冻结输入、普通复制依赖、自有 HOME/TMP/cache/DSH_HOME/files/backups/exports 均在 `reports/all-pending-evidence-20261021/AskAuthRetestR1/`。所有原件 exclusive-create，失败保留，不删除夹具。不改业务、tests/oracle、他人 testing、living docs，不使用共享 lib，不执行 Git 写操作、build/install/服务/浏览器/凭据/vendor/正式数据操作。

只读仓库 status 已执行；缺失 rg 的退出 127、轻量 memory 路径查询退出 1、临时目录定位遇权限退出 1 均属于准备过程，不当作测试红或抹除。后续使用明确仓库内交付路径，不重复扫描无关临时目录。

依据：AGENTS、collaboration §9/§11、当前接续；原 `ask-auth-feedback-red-20261022-r1-{plan,report,delivery}`、`AskAuthDevR1/delivery.md` / `ask.patch`、`docs/plans/2026-10-22-ask-auth-feedback-closure.md`。原先行 8 绿 3 红与原 AI client 有限 PASS 保留，开发 210 绿不等独立结论。

## 执行步骤

1. [已完成] 读取原合同/原测试/开发交付/实际 catch；核定唯一业务文件与写面。
2. [已完成] 自有 freeze：402源文件 + 五项配置 = 407输入，exit0；SHA/唯一单行替换与开发patch全等，独立diff原exit1。核34,931字节和`084efb5b33e7cda7368b87c4708f87f460d28588f3e7476cadfad2de0fd35884`；原测试、AI client、model-route等消费接缝与开发冻结一致。14,394依赖文件/1,031内部软链/外链0/共享inode0，保护无漂移；相对开发冻结仅并行panel.tsx不同。不认完整113声明或新实例。
3. [已完成] 原11项无filter、exit0、11绿0失败0跳过；8原控制与3原鉴权逐例中文分型正确。真实AUTH/INVALID不写MISSING、MISSING真缺码/429/正文保持；首候选/同runtime恢复、全部表及JSON零业务变、dispose成立。observations原件保留。
4. [已完成] 原12受影响文件无filter、exit0；实际assertionResults=199，199绿0失败0跳过，完整文件级结果与stderr保留。TaskTable React key warning仍存在，不写零警告。父旧398源→本轮402源多4个其他owner新tests，仅ask-auth计本门；不签其余三tests/门。
5. [已完成] 必要TYPE：冻结包`tsc -p tsconfig.json --noEmit`，exit0、stdout/stderr空；无lib产物，原配置排除tests，不称全部test严格类型检查，不外推GUI。
6. [已完成] close：exit0；30列明保护对象、407冻结输入、依赖/上游无漂移，主ask匹配，freeze→close无新主源差异。patch81305/original11 82319/affected83244/type84503均已退出，released/stop=true，有限SOURCE/AUTO PASS；report/delivery落本前缀，11ask+13治理夹具及旧失败保留。
7. [已完成] seal：实际freeze/原11/affected/type/close工具退出均0，工具父PID全部退出；seal自身工具exit0已回读，初始delivery-index保原“执行中”计划状态。最终final-index由finalize按本完成态与seal收据另行exclusive-create归档，不覆旧索引、不增加产品测试或修改他人原件。

## 覆盖与继承

| 接缝 | 本次重测 | 不外推 |
| --- | --- | --- |
| ask.ts catch126 | 原真实生产链11项；source exact patch | 旧3260/107与旧GUI不能当新修 |
| 原 AiClient / 模型路由 | 原43终止控制 + 原11生产链，字节与开发/原有限对象一致 | 不撤原ATF有限结论，不签付费模型网络 |
| 命令/上下文/投影/验证 | ask-governance、ask-context、ask-copilot-b7、ask-projection、copilot-task-fields、copilot-validate | 不宣称全schema/全handler修改 |
| 反馈接收/预确认 | ui-feedback、copilot-preconfirm、copilot-extension-baseline、index-command-feedback、panel-transport-error-feedback | DOM/AUTO不是真实GUI/样式/UX门 |
| 并行renderer/panel | 认当前冻结字节、记录主树差异；本影响文件变化另判断结果适用 | 不阻断合法并行、不签其新用例/门 |

## 命令与停止

运行环境 macOS + nvm Node 22；在仓库根执行：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-runner.mjs freeze
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-runner.mjs test original11
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-runner.mjs test affected
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-runner.mjs type
node docs/testing/ask-auth-feedback-independent-retest-20261022-r1-runner.mjs close
```

每次命令保存 argv/cwd/白名单 env/start/end/PID/真实 exit/stdout/stderr/result；非零不改成0，不覆写重跑。缺设施标 BLOCKED，产品断言失败标 FAIL。健康正文含 Key、精确兼容哨兵按 source 分支保留检查，不冒新增动态实测。

后继：Main 等在途独立门齐后唯一新候选 build/完整回归/新3260身份认领，采真实401/403/缺失/429/恢复/busy等原合同GUI证据，交不同GUI专家；父逐域全部门齐后普通commit仍是 Main 动作。本角色只签精确 SOURCE/AUTO 子集，GUI/RA-AI06整项/父goal/commit均不签，**release STOP**。
