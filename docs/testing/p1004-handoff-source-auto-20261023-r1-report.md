# P1004 任务交接独立 SOURCE/AUTO r1

> 2026-10-23，平台 `trae`；角色为独立 SOURCE/AUTO 测试专家，非开发、非 Main、非 GUI 执行者。只验本次 P1004 开发交付，不修改产品或原证。

## 1. 有限裁决

**PASS：仅绑定下列交付字节的 P1004 SOURCE/AUTO 和真实 React DOM 接缝。** 独立运行新专项 **7/7**、实际受影响三文件 **22/22**，两组各执行一次，均 exit 0、零失败、零 pending。独立复核原始 DOM/命令记录，不以开发脚本的绿代替独立运行。

**收尾并行漂移补记：** seal 首次 exit1，发现 P1005 的 listbox/reflect 两源码在测试后改变；未生成 seal、不计产品测试失败。只保本轮两份未变隔离输入的有限 PASS，**不签当前组合候选**。具体前后字节、接缝与继承限制见第7节，不重跑7/22或扩大门。

| 层 | 裁决 | 边界 |
| --- | --- | --- |
| 交付输入、精确 delta、原证完整性 | PASS（原隔离输入） | audit/执行时407个声明输入匹配交付seal；49件开发原证匹配；实际原未修panel与交付panel的diff恰为+15/-5；收尾2件并行漂移另绑 |
| SOURCE | 有限 PASS | 仅当前副驾有效 task 入口引入让层；未改通用 openRecord、DrawerPanel、TaskForm、业务/模型写、全局 CSS/z-index |
| 新接缝 AUTO | PASS，7/7 | 真实 PmPanel/CopilotPanel/DrawerPanel/TaskForm，取消/顶关闭/ESC、dirty、主 save、同子树/旧答/最新投影/归焦 |
| 受影响 AUTO | PASS，22/22 | SM01 retention 12、error-prefix 5、cancel-close 静态合同 5；不是 22 项全部真实 DOM |
| 新候选构建、宿主激活、GUI/样式/UX | NOT_RUN（本角色） | Main 唯一 builder/GUI；DOM 不证明真实布局、pointer 命中或可见焦点 |
| 原 RA-P1004 首次打开/直接退出 GUI | **原 FAIL 保留** | 等 Main 新候选同链真实采证及独立审证，不能据本件自动关门 |
| B8、全 P1、父总出口、ordinary commit | **不签** | 不抵销其他原门，不提交、不推送、不发布 |

未发现本次精确 delta 在已运行有限范围内的新确证缺陷；保留既有警告和未覆盖边界，不宣称整包或完整用户旅程通过。

## 2. 授权与候选绑定

负责人本轮原句：

> pm-tool父授权分工验完已实现/修确证缺陷至ordinarycommit（无push/release）。你为独立SOURCE/AUTO测试专家，非开发/GUI，只测P1004开发交付。

本轮明确限制：不 build/noEmit/GUI/install/service/Git/凭据；不改产品、docs/plans、原 testing、原证、livingdocs。唯一仓库写面为本报告同前缀新文件，自有 `/tmp` 仅放隔离 inputs/cache/config/output。Main 保留整包 builder/GUI，ordinary commit 父出口不由本角色签字。P1005 cmd reflect/listbox 在途接缝不测试、不冻结、不改写。

先读 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md)、[原专家合同 §6](p1-projection-refresh-gui-review-20261023-r1.md#6-exact-remaining--最小修复复验合同)、开发 [plan](../plans/2026-10-23-p1004-sidecar-handoff-plan.md)、[report](../plans/2026-10-23-p1004-sidecar-handoff-report.md)、[seal](../plans/2026-10-23-p1004-sidecar-handoff-seal.json)。本次明确分工覆盖通用 SOP 的 fetch/pull、install/build、全 verify、livingdocs/Git 收尾；本角色均未执行，不扩大授权。

| 对象 | 实际绑定 |
| --- | --- |
| 基线提交声明 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，来自封存元数据；未执行 Git，不把 HEAD 代作 dirty 候选 |
| 产品 panel | `packages/dsh-pm-tool/src/client/panel.tsx`，191668 B，SHA256 `a58e21657daa79d41255a4e1fd929b8d084101fdf8b7a236eaf9c0205d08247d` |
| 新 7 项 test | `packages/dsh-pm-tool/src/client/panel-sidecar-task-handoff.test.tsx`，12325 B，SHA256 `1e1e6bf1586ff32f3dc8526e904707b7159bb5b4c27b9f67e299161231e6e64b` |
| 只读 sidecar-portal | SHA256 `e2e9054e9ad0d7a7e9f3c0020760a2c48a8c477ae44af6b01c2a509e8e4204dc`，45837 B |
| package/lock | seal 对应字节匹配；package version `0.7.4` 仅为声明，不是新构建或部署身份 |
| 独立 DOM 根 | `/tmp/pmtool-p1004-independent-source-auto-eTiFFN` |
| 独立 affected 根 | `/tmp/pmtool-p1004-independent-source-auto-GsOUAc` |

audit/执行/inspection 时，封存 source 中407个明确对象均与读入一致；当时 red-r4 source map 对测试输入仅 `src/client/panel.tsx` 不同。最终保护发现两件 P1005 并行漂移，已具体另绑而非忽略。不把未列明新增 P1005 文件或任何全盘对象纳入结论。

## 3. 独立方法与依赖声明

[自有执行器](p1004-handoff-source-auto-20261023-r1-run.mjs)自建 audit、复制、配置、执行和 inspection，不 import/执行开发 `run.mjs`，不执行 Main 断言或产品构建脚本。开发脚本只作为原件读取/哈希。测试源码原样复制，不变换私有导出、不镜像 helper、不改产品造红。

每组从 407 个锁定输入逐件复制到不同新 `/tmp`，逐件核副本 SHA；预先检查 4 个实际 test 路径存在，明确 include，不列不存在的 drawer-focus.test.ts。只运行本轮 7+22，不做全套或重复刷绿。

依赖只读解析现有包，具体 realpath、package/入口指纹及 peer 声明在 [audit](p1004-handoff-source-auto-20261023-r1-audit.json)：

- React/ReactDOM/renderer 均 `18.3.1`；Vitest `2.1.9`；jsdom `25.0.1`；lucide-react `1.55.0`；zod 实际 `4.6.5`，package 声明 `^4.4.3`。
- 插件声明 React、renderer、Vitest、lucide；插件未直接声明 ReactDOM/jsdom，二者来自既有 `.tmp/widget-poc` 声明，未安装或改声明。此运行不能冒普通整包 test 已能直接跑该 DOM 文件。
- DOM 组统一到 widget React；旧 renderer 组统一到插件 React；lucide 在 Vitest 内联变换并 dedupe React，避免其原包 native React 与 DOM 第二身份冲突。真实解析路径如实记录，不宣称依赖全字节锁定。
- 新 test 已有限定 fixture ID 的 CSS.escape 和 scrollIntoView 设施、matchMedia/RAF；设施只支持实验环境，不声称浏览器滚动/Tab 默认行为实测。
- 两组 HOME/TMP/XDG config/cache/output 均在自有根；不继承凭据环境，传输/fetch 按原 test 限制。只读业务 snapshot 与显式命令替身，不触活库、宿主、模型或服务。

## 4. SOURCE 与实际 DOM 接缝

源码定位：[入口/交接/ESC](../../packages/dsh-pm-tool/src/client/panel.tsx#L628-L726)、[保持挂载/标签/传递回调](../../packages/dsh-pm-tool/src/client/panel.tsx#L1476-L1527)、[原抽屉守卫/归焦](../../packages/dsh-pm-tool/src/client/panel.tsx#L2208-L2280)、[TaskForm dirty](../../packages/dsh-pm-tool/src/client/panel.tsx#L2500-L2524)、[原主提交](../../packages/dsh-pm-tool/src/client/panel.tsx#L2610-L2720)、[实时投影](../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.tsx#L596-L638)。

`copilotTaskHandoff && drawer != null` 仅参与现有 aside hidden、最小化标签和副驾 ESC 监听；不改挂载条件/key，不清 Copilot 消息或未发送输入。有效副驾 task 回调才 set handoff，通用 openRecord 仍供普通任务/其他入口使用，抽屉最终关闭后清 handoff。当前非 task 入口不新增让层；不宣称所有嵌套抽屉旅程都被本用例实测。

取消/X/ESC 继续走原 TaskForm tryClose/DrawerPanel capture 守卫和既有 opener 机制。主 save 路径不在 delta；无新增 RPC、模型调用、schema 或数据策略。原 CSS `sidecar z60 / drawer z30` 保留，hidden 复用 `.pm-sidecar[hidden] { display: none; }`，并非全局调层。

新专项实际步骤：schema parse 合法 `p-0001/t-0006`，WBS5，初始未指派/0、有一附件/一条一修订进展；旧 ask → 内存最新 snapshot 负责人/47 → 点刷新 → 输入未发送内容 → 同卡打开真实 TaskForm。它不模拟真实 DB 保存形成该最新状态，不能拿 fixture 替 GUI 的完整旧 ask→人保存数据链。

[独立 inspection](p1004-handoff-source-auto-20261023-r1-inspection.json)逐态读取新运行 [28 条原始 observations](p1004-handoff-source-auto-20261023-r1-observations.json)，7 条首次打开都为正确任务/标题 focus、sidecar hidden=true/display=none、原旧答/负责人47最新卡/未发送文本；7 条 direct-return 记录抽屉消失、副驾恢复、focus 为“打开任务”。同 DOM 节点身份由实际测试引用相等断言证明，不把 HTML 相同当重挂载证明。

7 项分别为取消、顶关闭、ESC、ESC 不同时销毁副驾、dirty 确认取消保稿再明确放弃、主保存、重复交接后最小化/展开/显式关闭。打开/退出/dirty 放弃不增命令；主保存仅新增 `task update t-0006 {...}` 后接 `web snapshot`，旧 ask 每 fixture 一次、历史附件/进展保留、归同 opener。主保存 payload 原有 `manualProgress:null`、空 repo/branch 等仍传出；**不是“只改负责人两个字段”或真实后端归一化证据**。

受影响 22 项按实际结果数：

| 文件 | 实际项数 | 层与重点 |
| --- | --- | --- |
| sidecar-minimize-retention.test.tsx | 12 | 真实父子 renderer；上下文/本地撤销/未发送输入/最新 props、主表单取消与保存失败、快照失败重试、项目切换等 |
| copilot-error-prefix.test.tsx | 5 | 真实 Copilot renderer；完整错误原因、前缀一次、后续健康发送、禁写；[本轮原始记录](p1004-handoff-source-auto-20261023-r1-prefix-observations.ndjson) |
| panel-cancel-close.test.ts | 5 | 源码静态合同；取消返回值、dirty/ESC/X/scrim 注册、原保存能力，不冒渲染或 GUI |

TaskTable 的旧 key 警告在两组 stderr 保留；affected 另保 MaxListenersExceededWarning。没有 invalid hook/CSS 设施失败、pending 或未处理测试错误；警告不证明本 delta 新增缺陷，也不宣称整包无警告或无内存风险。

## 5. 原开发红绿审证

49 件开发证据按 seal 全部核 bytes/SHA，实际原未修 `red-r4` baseline-panel 字节也核 SHA，并用独立 `/usr/bin/diff` 比对当前 panel，stdout 与封存 green-r2 delta 完全相等。未执行开发 runner，未重跑红或开发绿。

| 原标签 | 原实际 exit / 项数 | 本轮审证解释 |
| --- | --- | --- |
| red | 1 / 7 失败 | 原 stderr 为 Invalid hook/useContext：lucide native React 与 DOM React 不同；设施失败，不计产品红 |
| red-r2 | 1 / 7 失败 | 原错误明确 `ReferenceError: CSS is not defined`；开发同时补 scrollIntoView 设施，但不补造第二个已实际发生的异常 |
| red-r3 / red-r4 | 各 1 / 6 红 1 绿 | test SHA 与交付一致、panel 为未修 SHA `581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d`；各 7 次 first-open hidden=false/display=flex、正确 title focus；ESC 原控制项绿 |
| green / green-r2 | 各 0 / 7 绿 | panel 为本轮交付 SHA；各 7 次首次状态 hidden=true/display=none；开发证只佐证红绿，不代独立签字 |
| affected / affected-r2 | 各 0 / 22 绿 | 实际三个文件12/5/5；不存在的 drawer-focus 未执行、不计数，r2清单纠正保留 |

不洗前两轮设施失败、不删除失败原证、不把“开发7绿”冒本轮独立7绿，也不把 ESC 原控制绿说成新增确证根因。

## 6. 本轮全部验证命令与退出码

运行环境 macOS/bash，直接 nvm Node `v22.23.3`；项目 pnpm 约定 `11.28.5`，本轮未调用。以下从 `/Users/bytedance/Projects/dsh-pm/pm-tool` 执行，各条独立运行；不执行开发 report 中列的历史命令。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/p1004-handoff-source-auto-20261023-r1-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1004-handoff-source-auto-20261023-r1-run.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1004-handoff-source-auto-20261023-r1-run.mjs dom
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1004-handoff-source-auto-20261023-r1-run.mjs affected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1004-handoff-source-auto-20261023-r1-run.mjs inspect
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1004-handoff-source-auto-20261023-r1-run.mjs seal
```

| 命令 | exit | 实际结果/原证 |
| --- | --- | --- |
| node --check（开工及收尾） | 各 0 | 仅自有执行器语法，不是 noEmit/产品类型检查 |
| audit | 0 | 483 声明对象、407输入、49开发原证；delta+15/-5；零漂移 |
| audit 内 `/usr/bin/diff -u --label input/panel.tsx <red-r4 baseline-panel> --label output/panel.tsx <当前panel>` | 1（预期） | 表示确有差异；argv在 audit.delta，stdout 与封存 delta 完全相同，不是失败测试 |
| dom 内 Node Vitest run --config | 0 | 1文件7/7，Vitest duration11.42s；[receipt](p1004-handoff-source-auto-20261023-r1-dom-receipt.json)、[stdout](p1004-handoff-source-auto-20261023-r1-dom-stdout.log)、[stderr](p1004-handoff-source-auto-20261023-r1-dom-stderr.log)、[原Vitest JSON](p1004-handoff-source-auto-20261023-r1-dom-vitest.json) |
| affected 内 Node Vitest run --config | 0 | 3文件22/22，duration5.00s；[receipt](p1004-handoff-source-auto-20261023-r1-affected-receipt.json)、[stdout](p1004-handoff-source-auto-20261023-r1-affected-stdout.log)、[stderr](p1004-handoff-source-auto-20261023-r1-affected-stderr.log)、[原Vitest JSON](p1004-handoff-source-auto-20261023-r1-affected-vitest.json) |
| inspect | 0 | 28记录、7首次/7direct-return，实际12/5/5分母，保护对象零漂移 |
| seal 首次 | 1 | 两件 P1005 收尾漂移，未生成seal；[原失败记录](p1004-handoff-source-auto-20261023-r1-seal-attempt1.json) |
| seal 具体绑定后收尾 | 见 [seal](p1004-handoff-source-auto-20261023-r1-seal.json) 的 `exit`/`ok` 及最终工具终码 | 再核483对象、481未变/2并行漂移、两隔离副本各407未变，不签当前组合候选 |
| 收尾两次 `/usr/bin/diff -u <自有隔离旧源码> <当前P1005源码>` | 各 1（预期） | listbox+5/-1、reflect实质delta；完整argv/stdout见[close binding](p1004-handoff-source-auto-20261023-r1-source-binding-close.json)，不是P1005测试 |
| `/usr/bin/pgrep -fl 'p1004-handoff-source-auto-20261023-r1-run.mjs (dom\|affected)\|pmtool-p1004-independent-source-auto-(eTiFFN\|GsOUAc)'` | 1（预期无匹配） | 本轮两执行器/隔离 Vitest 已退出；只查自有 argv，不操作服务或任何 PID |

两组完整实际 Node/Vitest argv、隔离 cwd/config SHA、开始/结束时间在各 receipt。exec工具先返回异步 execution ID（其 string ID 与 write_stdin 的 integer schema 不兼容）；本轮未伪造 poll 或重跑测试，通过落盘收据/原JSON/自有进程无匹配核结束。没有未决执行进程。

收尾漂移补记前，另用 `node --input-type=module -e` 配合内置 fs/path/assert 只读检查报告：exit0，当时26个本地链接仅待最终seal、零尾空白；不检查产品类型。漂移补记后的链接/行尾由最终seal再核，不作产品用例计数。

只读探索用 pwd、cat、sed、find、grep、Node 内置解析/哈希：正常 exit0；`rg` 不可用 exit127后改grep/find；指定记忆两入口不存在 cat exit1，不拿平台记忆裁决。测试进行中首次读取未落盘的 dom/affected 收据及dom日志 cat exit1，只是时序缺文件；随后完整落盘读取 exit0，不计测试FAIL。漂移定位中误列不存在的 `shared/record-picker.tsx` 使一次grep exit2，下一轮grep递归定位实际导入exit0；一次预估组件名grep无匹配exit1，随后读真实panel imports纠正。两次初步源码diff各exit1（预期有差异）、Node前后SHA/28态无listbox-markup且无reflect调用核验exit0。不执行任何 Git 命令、vendor脚本或技能安装，不把开发vendor静态绿代本轮门。

## 7. 保护、继承、released / STOP

输入前后保护**仅483个明列对象**：407源码/package/lock、49开发证、6合同/配置/seal、10依赖包的20个manifest/入口、1原未修baseline。audit、两次执行、inspection逐件核无变；最终首次seal发现2件并行变化，不能再说483零漂移。收尾具体绑定481未变对象、2件P1005变化和两副本各407未变。没有全盘/全部依赖字节保护、活库零写实测或未声明目录扫描结论。

| P1005 明确漂移对象 | 原测试 SHA256 | 首次收尾定位 SHA256 |
| --- | --- | --- |
| `src/client/views/records/records-listbox.tsx`，4737→4886 B | `790533aed66fa35a6258e8a37c345058b8204d9d91cb86684e48453218f9cf7d` | `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2` |
| `src/commands/reflect.ts`，6015→7461 B | `69be050f31870274fcb831e935dd791f1903b031f20b1d0917c2665bda62f07c` | `7198072968f7ae02cd145ba97ee690870406918f3d036d191de27d196bb2a951` |

Listbox变更是backdrop click的preventDefault，真实导入包括OKR/habit/记录表单，不改本TaskForm；本轮28态均无 `rb-lb-menu/backdrop`。reflect是后端命令来源/反思ID定位等变更，本轮未执行该命令、28态reflectCalls=0。这里只定位相关性，**不审签P1005修复正确或对当前组合自动继承**；原两隔离源码仍与audit一致。[close binding](p1004-handoff-source-auto-20261023-r1-source-binding-close.json)及[两](p1004-handoff-source-auto-20261023-r1-source-binding-close-listbox-delta.patch)[份diff](p1004-handoff-source-auto-20261023-r1-source-binding-close-reflect-delta.patch)保留实际新字节，若再漂移需重新认领。

唯一新增仓库文件为本前缀 runner/audit/两组receipt与日志/原JSON/observations/inspection/report/seal、首次seal失败记录与close绑定/diff。自有两个 `/tmp` 的 inputs、node_modules只读链接、config、HOME/cache/TMP/output 保留；不清理、不删除、不覆盖他人成果。本角色未改源码、原 testing、docs/plans、原开发证、livingdocs、vendor、上游、lib、profile、端口或数据；两件源码变化属于并行写者，不谎称全树无改。未探旧114/521 private冻结目录、服务或凭据。stack 的 `/private/tmp/pmtool-p1004-independent-*` 是本轮 `/tmp` 的 macOS 实路径，不是旧运行根。

本 SOURCE/AUTO 结论只继承本轮锁定字节。Main 合并 P1005 或任何相关依赖/接缝变更后，须具体认领变化并裁受影响结果，不从本件推出整个新组合候选 PASS；也不因无关在途新增而自动扩大全门。

Main 下一步依**原专家 §6**重新认领 delta+新test+实际组合输入，唯一整包 build 并绑定产物/实例，再同链采首次无遮挡、真实 pointer/bbox、可见目标焦点、直接取消/顶关闭、旧答/最新值及原 B8 Tab/Enter/ESC/归焦、dirty/主save/RPC/DB 保护。原 GUI FAIL 不自动变 PASS 或 MANUAL_PENDING；本角色不签 B8、总出口或 ordinarycommit，不提出新功能/新全球矩阵。

**released / STOP：本轮有限 SOURCE/AUTO 审结，最终 seal 后释放本前缀自有写面；不持产品源码、builder、GUI、lib、服务/PID/端口/profile/data或Git锁。Main继续父授权；不提交、不push/tag/release，不冒父任务完成。**
