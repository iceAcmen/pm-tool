# F02 option 默认动作独立 SOURCE/AUTO R2

> 2026-10-23，trae 独立 SOURCE/AUTO 专家。给 Main 核两文件与原 9+28 专项；非开发、非 GUI，不审父整门。

## 1. 有限结论

**SOURCE：PASS_LIMITED。DOM9：PASS_LIMITED_AUTO。related28 与合并 AUTO37：BLOCKED_INFRASTRUCTURE。**

本角色没有发现本两文件中的产品缺陷。独立执行的 37 条产品断言全绿，但真实终码 **1**、四个 related suite 失败，不能以计数绿签合并 AUTO PASS。失败由本角色 runner 的重复 identity 输出造成，不是产品 FAIL；未改产品或抹去失败，未重跑。

原 F02 **FAIL_LIMITED_GUI** 保留；修后 GUI **NOT_RUN**，原后台保存链 **NOT_REACHED**。本报告不关闭 F02，不签全 P1005、六修、B8、父普通 commit、push、release 或正式切换。

## 2. 任务与依据

负责人本次原句：

> 你是pm-tool独立SOURCE/AUTO专家，非开发/GUI。父goal全部已实现未验独立收口到普通commit，无新增暂停功能/push/release/正式切；Main唯一builder/GUI。
> 你的子单只审本两文件和9+28，不冒GUI/父整门。
> 唯一仓库新写docs/testing/f02-option-default-source-auto-20261023-r2*，自有/tmp其余输出。
> 本显式子单替通用fetch/pull/build及git收尾SOP。
> 一次必要核和测试后停止，不为整包新增回归。完成资源released/STOP通知Main。

已读 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md#九独立测试门控adl-0452026-10-12-起长期硬规则)、[vendor policy](../external-skills.md)。按原 [F02 最小合同 §6](six-repairs-pointer-gui-review-20261023-r1-report.md#6-原默认-label-场景最小红--修--复验合同)、[repair](../plans/2026-10-23-f02-option-default-repair.md)、[开发交付](../plans/2026-10-23-f02-option-default-development.md)执行。未加载 vendor：范围已定，独立测试不借开发自查流程签门；不运行 installer、vendor verifier 或 Main runner/seal。

本子单覆盖通用拉取、构建、全回归、livingdocs 与 Git 收尾默认动作。未执行 build/install/noEmit/full/allverify、GUI、服务、Git、private freeze/runtime、凭据访问、子角色派发或 `child_process/spawn`。

## 3. 独立输入核对

[审计](f02-option-default-source-auto-20261023-r2-audit.json)包含逐文件结果、原红绿收据、断言与 DOM 观察摘要。开发包为 [F02OptionDefaultDevelopmentR2](../../reports/all-pending-evidence-20261021/F02OptionDefaultDevelopmentR2/index-r2.json)。

| 对象 | 独立结果 |
| --- | --- |
| index | 18102 bytes，SHA `e9c9e524aac3f63ccc32c4618994d0c9979b68dcd18a3a8f018b44a4520b34c5` |
| index 成员 | **109/109** 普通文件 bytes/SHA 相同；物理成员集合相同。加 index/seal 共 **111** 文件，非漏算或追加成员 |
| 开发 seal | index bytes/SHA 与 109 数量绑定相符；开发 seal 真实工具0来自派单，封件没有另存外层 raw，本角色不补造其外层收据 |
| 完整原输入 | **525** 逐文件核真实包源码，仅下述两变，其余 **523** 相同；不是只信 development-check |
| 阶段副本 | baseline/red/green/related 各 **17** 份逐 SHA；red 只 test 变化，green/related 只两变；各阶段实际收据 before/after 同 |
| 候选来源 | 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅引用封存声明，未执行 Git，不用 HEAD 代表 dirty 候选 |

| 文件 | 修前 bytes / SHA256 | 本轮实核 bytes / SHA256 |
| --- | --- | --- |
| `records-listbox.tsx` | 4886 / `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2` | **5059 / `aeb3d15125ad311f335cfb09d348c0402b9925da9d4979df8b2ceb402725275f`** |
| `records-deliverable-pointer-dom.test.tsx` | 9159 / `6de116ba10c320a162f1c465958f428ca9023e328b67827581db9ea23df42aec` | **10641 / `841e3fa0591c7a83213572650a73d7c63cf277e50e1ecf56197e8c0e58cc6057`** |

生产源码用原字串单次精确替换重建后与真实源码完全相同：仅 option onClick 接收 event、取消默认动作、调用原 `choose(option)`，另加原因注释。外 label、button/span、backdrop、keyboard、DOM、disabled、表单及保存通道未改；没有 stopPropagation、全局拦截或程序保存。

原 test 除最终 ASCII `})\n` 闭合符外 **9156 bytes 前缀完全保留**，新文件尾闭合符也相同；D01..D07 未删改，追加 D08/D09 共1482 bytes。实际生产 form/overlay/默认外 label/option button 与 span 均保留；只在公开 DOM/回调边界观测，不 mock choose 或手动重放 label 激活。

## 4. 必要红与开发绿

封件 red：真实 Vitest 子终码 **1 / signal=null**，原7绿、新2红；两处唯一断言失败均为公开 document bubble option click `defaultPrevented=false`。D08/D09 各一次 option bubble、选值正确、closed、零额外 trigger、零 submit/callback；因此红证证明“默认动作未取消”，**不冒充 JSDOM 已复现浏览器再次打开**。

red/green 同一 test SHA；green9、related28 封件子终码各0，stderr空；D08/D09 bubble 改为true、零保存。red stderr只有必要断言失败，无 attachEvent/detachEvent/Uncaught/Unhandled。原每阶段 identity 均同 React18.3.1，afterAll 时序正确。

开发 red 外层异步工具终码 **NOT_CAPTURED**，按派单原样保留；不从子exit1推造外层。开发 green/related 工具0来源派单，独立核其封存 argv/cwd/env、子exit、结果/观察，不执行 Main 脚本。

## 5. 本角色一次独立执行

环境为 macOS/bash、绝对路径 nvm Node **22.23.3**、既有 Vitest **2.1.9**、React/ReactDOM **18.3.1**、JSDOM **25.0.1**；pnpm11.28.5仅项目口径，未调用。自编 reader/runner，17份真实源码复制，四个声明依赖只读软链；config/cache/home/tmp/output 全位于 `/tmp/f02-option-default-source-auto-20261023-r2-independent-eeSeQV`。

实际 argv/env/cwd/开始时间、真实exit1、原stdout/stderr、完整Vitest JSON与逐例观察见 [执行审计](f02-option-default-source-auto-20261023-r2-execution.json)；完整命令见 [命令审计](f02-option-default-source-auto-20261023-r2-command-audit.md)。

| 本轮专项 | 原始结果 / 独立裁决 |
| --- | --- |
| DOM D01..D07 | 7断言及所在文件suite通过；真实生产DOM中button/span选accepted后close、显式submit调用、重复trigger/backdrop关闭及callback=false恢复均保原覆盖 |
| DOM D08/D09 | 2断言及所在suite通过；各一次公开option bubble defaultPrevented=true，初始打开以外零trigger，closed、零submit、calls=[]。**DOM9有限PASS** |
| options8 / payloads11 / history3 / form-validation6 | **28断言绿，但四文件suite均在afterAll失败，BLOCKED设施**；不是28独立有效PASS |
| 合并执行 | 37断言绿/0断言红；1文件suite通过、4失败，`success=false`，真实工具终码1，**AUTO37 BLOCKED** |

本角色设施原因：singleThread 下 DOM suite 的 globals 在后续 suite 仍可见，identity setup 用 `typeof document` 区分 suite 不足；四个 related suite 的 afterAll 再写同一个 `identity.json`，`flag:wx` 触发 **EEXIST**。没有提前 require ReactDOM、没有 attachEvent 污染或空stub；DOM后identity确为同源18.3.1。不能把这个 afterAll 错误隐去或根据37绿宣称全AUTO通过。

按“一次必要测试后停止”未修runner或再跑产品专项；失效收据/日志全部保留。没有产品FAIL，无产品修复建议；原28的独立设施补证留 Main 协调，不另设产品门或扩大整包回归。

前后核 **17副本、641声明依赖文件、1286去重保护输入** 全同，软链仍指原四依赖。保护范围含525包输入、111封件、规则/合同/本角色工具，非全机/全node_modules或未声明runtime零污染证明。仓库仅新写本前缀审计/报告；其他输出全自有 `/tmp`，无共享lib/cache写入。

## 6. 原映射与 Remaining

共享选择/close接点影响原 **5 consumer / 13 JSX**，直接引用 [原 P1005 §6](p1005-listbox-backdrop-source-auto-20261023-r1.md#6-实际调用点与原门)：交付物2、会议2、汇报3均嵌label；OKR5、习惯1不嵌关联label。本轮只重签实际运行且suite通过的DOM9；不把其他消费者旧GUI自动继承或另加全B8矩阵。

remaining 为：本子单原related28的有效独立设施补证；原F02修后默认label真实指针稳定闭合、闭合后唯一首点主save完整RPC/raw/重进、同字节一次原键盘对照。GUI合同与父所有已实现未验到普通commit范围保持，不因本单缩成两文件；Main仍唯一builder/GUI，其他独立原门按父汇合。

本角色未持有builder、GUI、端口、profile、数据锁或服务；测试命令已终止。**released / STOP，交 Main；不要求暂停无关已授权父工作，不新增功能/push/release/正式切。**
