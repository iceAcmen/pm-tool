# P1005 事件反思入口开发交付

> 给 Main 和独立测试专家接续 P1L2-F01；记录本次未提交源码增量、真实命令红绿和未覆盖边界。平台 trae，2026-10-23。开发专项结果不是独立 PASS，不关闭父出口。

## 实现与范围

- 修改 `packages/dsh-pm-tool/src/commands/reflect.ts`，新增 `src/commands/reflect-l2-entry.test.ts`；其余本任务写面只在 `docs/plans/2026-10-23-p1005-event-reflect-entry-*`。
- 命令确认语法：`/pm reflect <真实反思ID>`、`/pm reflect <真实反思ID> edit "<markdown>"`、`/pm reflect <真实反思ID> final`。反思 ID 从 `/pm reflect list <项目ID>` 获取；不是 milestone/deliverable ID，也不是关联任务 ID。
- `ref-` 目标精确 get reflections；旧 taskId 保留 getTask → getReflection，仍指向旧 task-done。view 显示 sourceEvent/sourceId、完整句级内容、gaps 和原记录 JSON；list 增加真实来源字段。
- 复用核心 updateReflectionDraft/finalizeReflection；edit 不自动 final、final 幂等、来源和稳定 ID 不改。final 后 edit 沿旧语义保持 final，提示按真实状态生成。
- 未知/坏 ID、未知项目、空编辑、不支持动词和无草稿任务写明确返回 error，零业务写；存在任务无草稿的旧只读返回仍 success。
- 没有修改 core/reflect、index、panel、CSS、Listbox 或 P1004；没有新页面/业务 feature、事件 taskId 迁移、会议模拟、手 seed 成功反思。

## 输入认领

父专家报告引用基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`、版本 `0.7.4`；本子单不运行 Git，不用该 HEAD 冒充当前 dirty 候选。以开工436项输入字节清单、真实源码 delta、新文件指纹和逐轮输入声明认领本次增量。Main 必须另认领整包。

| 文件 | 开工 SHA256 / bytes | 交付 SHA256 / bytes |
| --- | --- | --- |
| commands/reflect.ts | `69be050f31870274fcb831e935dd791f1903b031f20b1d0917c2665bda62f07c` / 6015 | `7198072968f7ae02cd145ba97ee690870406918f3d036d191de27d196bb2a951` / 7461 |
| commands/reflect-l2-entry.test.ts | 不存在 | `779b12ac9e99f3ab5b2ddeb06d6be86f81cd29ec8415adb0c83a6aa165dfdd78` / 16059 |
| core/reflect.ts（只读） | `3423fef5553c3314577698439022310e463ab28c2f42c7476f4886d101cf433b` / 17084 | 不变 |

逐轮 `*.inputs.json` 完整声明源码输入、配置、Node 二进制与依赖真实路径/文件指纹；已归入本前缀 evidence.json。node_modules 仅在自有输入根建只读依赖链接，Vite 配置/缓存、HOME/TMPDIR/XDG_CACHE_HOME 与临时 JSON 输出全部定向自有 `/tmp/pm-p1005-event-reflect-entry-6iR2yc`，子进程不继承凭据。Vitest 转译，不是 tsc/noEmit 或整包构建。

| 逐轮输入声明 | SHA256 |
| --- | --- |
| red-view.inputs.json | `3ff09ce3ad9fea82f35ad7475405f73f419b53b61dde530154063b79e0db4576` |
| red-contract.inputs.json | `f6aa80d485bbb605557ac9d9ce1a1cd98f814034f70a3f4b4986784317e0b231` |
| green.inputs.json | `47b1e2310cf18d64ec0e5d5cfd5d5ddaa9ad429a27448a87bff2293b4e63caf5` |
| green-r2.inputs.json | `c3312aa8305541dd13be382830148c416ab851471364416e346b77c89e22aabe` |
| regression.inputs.json | `425ad64843fed4444cfe59f6e003a0a51bade85fec265352a98799072943eddd` |
| green-final.inputs.json | `8eacedc5b259b3792112c491ca9daaaa90ff937b6365577088ae7ba2444dc3a0` |

观察到两处非自有并行 Listbox 变化，完整 before/after SHA/size 在 seal.nonOwnedDelta；本子单未写、未回退、未作测试结论：

- `src/client/views/records/records-listbox.tsx`：`790533aed66fa35a6258e8a37c345058b8204d9d91cb86684e48453218f9cf7d` → `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2`。
- `src/client/views/records/records-deliverable-pointer-dom.test.tsx`：`d2e1c8685e2f49c71c5ddda951400b0a3e73e2c2a6601378da9b64a95fa7e38a` → `7319b70546ed58e135ab677a15670535e99314fea99b90bb8c9bdd2e0dc56258`。

保护范围为声明源码、指定合同/livingdocs与 mattpocock 原件，不声称全机或未监测根零污染；并行后续变化以最终 seal 为准。

## 真实红绿

环境：macOS / bash / Node `v22.23.3` / Vitest `2.1.9` / 真实 Cordis + Storage + DomainFacility + JsonStorageBackend。pnpm11.28.5仅沿父环境口径，本子单没有调用。

| 阶段 | exit | 结果与准确含义 |
| --- | --- | --- |
| vendor 初验 | 0 | 13/13 mattpocock 文件 SHA/bytes；2注册vendor静态绿，不是产品验收 |
| capture | 0 | 开工436项、原 reflect 输入字节与 vendor 指纹 |
| red-view | 1 | 1有效产品红、9未执行：真实事件反思 `ref-mvk198vr-c3sc1m` 查看误回“未找到任务” |
| red-contract | 1 | 10红：原完整入口/来源/list/拒绝与实际状态提示合同，真实 handler，不是 core-only |
| green 首轮 | 1 | 7绿/3自有断言失败：JSON 省略 optional 键不等于显式 undefined；仅改测试期待，原件保留 |
| green-r2 | 0 | 10/10命令专项绿 |
| regression | 0 | reflect.test 10、reflect-l2.test 9、reflect-file-count.test 5，共3文件24项；各仅一次 |
| green-final | 0 | 11/11命令专项绿，补同库两事件依次定稿互保；产品代码与前轮相同 |
| vendor-final | 0 | 静态校验仍绿 |
| collect / seal | 0 | 自有输入、raw/handler输出、收据、delta与指纹归档；不是独立产品签字 |

没有 Vitest/存储设施失败。探索 `rg` 不可用 exit127、缺失 verify-p1-l2 路径 exit1、缺失可选 GLOSSARY/standards/记忆路径 exit1；都不是产品红。真实 `diff -u` exit1 意为源码确有差异，不是验证失败。所有历史失败原件未覆盖。

实际完整命令（cwd 仓库根；命令里的逐轮绝对 Vitest argv/cwd/环境/exit/stdout/stderr 在 evidence.runs[].receipt 中）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs red-view
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs red-contract
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs green
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs green-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs regression
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs green-final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs vendor-final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs collect
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p1005-event-reflect-entry-runner.mjs seal
```

执行器拒绝覆盖既有阶段。上述为历史收据索引，不要求重放；Main 新候选必须使用新隔离根与自身整包流程。

## 命令与落盘证据

新增专项每用例真实创建项目、里程碑、交付物、关联todo任务、旧task-done；仅正常 update 触发 ensure，用队列屏障等待落盘，没有 fake 域或 seed 反思。两新事件 taskId 缺键是合法模型。人 edit/final 的含义是显式调用生产命令 handler，**不是 GUI 人工执行已完成**。

同库连续旅程实际 fixture：`output/fixtures/p1005-json-ZnOGST`，旧反思 `ref-mvk1df2m-j9lb6x`；milestone `ref-mvk1df31-3sd37x / m-0001`；deliverable `ref-mvk1df3i-s2k30z / dlv-0001`。两者分别完整view → 三行 known/pending/blank edit → final → repeat → domain关闭重开，第二条不改第一条定稿字节。所有操作的 argument/result/delta、初末 SHA 与真实 v2 信封原文已归 evidence.audits；这是自有新临时数据，不冒原 F5 已续验。

- 两次 edit/final 每一步只变本目标 JSON；重复final、view、list、reload、拒绝都零业务字节变化。
- 稳定 id/projectId/sourceEvent/milestoneId/deliverableId/createdAt/draft.title/draft.at 保留；edit 不自动 final；已 final 的重复final不变 updatedAt。
- 已核行中的双空格、待核、待补、gaps保真；关联 t-0001 仍todo，没有给业务完成编造定稿。
- 同库旧task-done前后 SHA `05e9c056d0aed4ee4fb68f03050568cd56cd6bc936d0531dfc7db10b4102028d`；t-0001前后 `f17d106864298afd5b1e94980046de5ef83ffed0b3c39b1d5af8f424ea00e96c`；t-0002前后 `313442a9402dbf1ca31c63ea28cfe153d44364c7920b9fd51c6efe61e9aae833`。项目/milestone/deliverable亦不变。
- 业务同状态再保存、合法退回planned后再次进入事件，不新增或更写既有draft/final反思。该业务幂等另用例，不称业务保存零写。

## 审查、边界与接续

code-review 开发自查：规范轴无剩余发现，写面/来源纯派生/核心复用符合合同；需求轴无剩余实现发现，额外同库互保测试已补。错误 optional 断言已纠正且保首失败。没有可用子代理审查执行，本次两轴由开发自查，不伪装双独立审查或专家PASS。Skill试点详情见本前缀 pilot.md。

构建、tsc/noEmit、整verify、原verify-reflect/p1c（需lib/index）、GUI/宿主composer/RPC/装载/页面样式与UX均 **NOT_RUN（本子单边界，待Main和专家）**。未安装、操作服务/端口/profile、Git/worktree/commit/push/tag/release、上游/home/正式data、原testing/原证/livingdocs。原 P1L2-F01 FAIL 与父门不能由此开发结果自行关闭，P1L2-F02/P1004另单不重叠。

Main下一步仅按既有授权：认领当前整包dirty输入及两源码SHA、唯一builder重建/受影响回归；按专家原报告 §4.1 从合法原标准包恢复或实读真实反思ID，在宿主原composer用上述语法查看/人edit/final/repeat/reload，采raw/RPC/正文/过程帧并交独立专家审签。GUI原F5 ID不可直接换成本报告新临时ID。全部父出口齐后才 ordinary commit；无push/release。

本子单源码不再写，全部短运行子进程已返回并关闭domain，未占builder/服务资源。完成字节封存后释放 `commands/reflect.ts` 与新专项测试的本角色写锁。**released / STOP。**
