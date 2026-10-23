# P2002 出站位开发交回

> 2026-10-23，trae，开发角色。给 Main 和独立 SOURCE/AUTO 角色复核：这是原确证缺陷的三源修复及开发证据，不是独立 PASS；原 GUI FAIL 不改签。ordinarycommit 父终点尚不由本子单放行，无 Git/push/release。

## 对象与范围

负责人原句及授权见 [plan](2026-10-23-p2002-outbound-slot-plan.md)。完整读过 [独立 R1](../testing/p2-outbound-history-review-20261023-r1.md)，按 §5.1 修 RA-P2002-OUTBOUND-SLOT。历史 P2 “implemented-but-unwired/deferred”保留；不是新功能、不是 N/A，不重裁原 TTL/backup、K16 或其他已独立有限 SOURCE/AUTO PASS。

仅改产品：

| 文件 | 精确接线 | 最终 SHA256 |
| --- | --- | --- |
| `packages/dsh-pm-tool/src/index.ts` | 现有 `web snapshot` 沿真实 `readExportAudit` 派生当前项目 `latestExports`；可解析 at 取最大，跳过无项目/非法日期，null 不造时间；仅 `{at,format}`，不下发路径、全 audit、全 settings | `43d9c3f0ef754143f2082357695b708be048b8bcaf6975205dd9b9ce58e3f299` |
| `packages/dsh-pm-tool/src/client/panel.tsx` | Snapshot 窄字段，真实 `project.id`→既有 TaskTable.latestExport；旧 snapshot 缺值安全 null；浏览器不导入 core/export | `341675c4dd31b87d05264de520a4c198edbb3c3476f2f87d8f38cc80ba1d83d6` |
| `packages/dsh-pm-tool/src/client/views/tasks.tsx` | 共用静态 slot 覆盖实际 groupRow/leafRow/状态分组任务行；`time.datetime/title` 为真实 ISO at，文本延续 HH:MM；放标题格独立换行，操作格只留原编辑；排序/编号/状态/清单逻辑不变 | `5639b455c452d69686355e8b4e65daa1d91b82ef9965a5f085074d044a7771e6` |

精确增量见 [delta.patch](2026-10-23-p2002-outbound-slot-delta.patch)，是接手 dirty 字节→本修复，不冒称相对 HEAD 的整树 diff。原报告 baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅引用；Git 禁止，本角色没有核当前 HEAD。seal 逐项绑定接手字节、真实测试源输入、依赖、配置、Node、输出和收据，Main 仍须统一新候选认领。

## 开发验证

环境：macOS/darwin、既有 nvm Node `v22.23.3`，Vitest `2.1.9`，真实 Cordis+DomainFacility+JsonStorageBackend、React18+react-dom/jsdom。pnpm 未调用。自有根 `/tmp/pm-p2002-outbound-slot-0BVVIe`；每轮自有 inputs/config/cache/home/tmp/output，既有 node_modules 只读链接。

新专项 [test](2026-10-23-p2002-outbound-slot-test.tsx) 原字节复制到隔离 `src/client/p2002-outbound-slot.test.tsx`：真实 schema fixture→真实 apply 注册命令→真实 snapshot JSON→真实 PmPanel/TaskTable DOM；没有业务 helpermirror/testfactory，没有替换产品函数。宿主仅提供真实存储设施与命令注册捕获；注册接口不启动服务。浏览器环境仅补 jsdom 缺 CSS.escape（限定合法 fixture ID）、scrollIntoView、matchMedia；不把这些当 GUI 证据。

| 证据 | 结果与边界 |
| --- | --- |
| 最终 `red-final` 原三源 | 8/8 必要红，exit1；同版最终 test，三源逐字节等于接手基线，不是手改坏产品；无 schema/装配失败 |
| `green-final` 修后三源 | 8/8，exit0；S01 最大at非数组末/B隔离/非法行与路径不泄露；S02 实际顶层/子层；S03 B→A/refresh/面板重挂；S04 U4多规则/编号/清单/原wrapped源值；S05 状态分组实际行；S06 长标题开真实编辑/取消零写；S07 非数组audit；S08 缺audit行 |
| `affected-final` 原相邻 tests | 6文件54/54，exit0：`task-views-u4` 4、`task-tree-u4` 2、`task-views` 29、`tasks-number-feedback` 5、`tasks-contract` 4、`export-outbound` 10；没改这些 tests |
| [selfcheck](2026-10-23-p2002-outbound-slot-selfcheck.json) | exit0；红/绿同版test绑定、三源绑定、每轮源输入/依赖/保护输入 delta0；8个真实JSON fixture 10/11文件各原字节同，0业务put/delete；共13次真实 `web snapshot` command，各前后零写 |
| vendor 初/末 | 静态 exit0；mattpocock 13/13 SHA/bytes，锁 `49dd158d1076134a641b33efb035946536778336`；另注册oil-oil静态校验不等于加载它 |
| 原1690封包 | capture逐件 SHA/bytes回核，后续保护不改；不执行原采证器、不读取其 private freeze/runtime，不用旧宿主替修后 |

现有 React `TaskTable` key warning 在有效原红与修后绿均存在，原 stderr 保留；未越界改该独立问题。HH:MM 为原显示口径，完整真实时刻在 `time.datetime/title`，不虚构本地时区。

## 全部验证命令与失败记录

以下命令均在仓库根独立执行。公共前缀：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2002-outbound-slot-runner.mjs <stage>
```

| stage/命令 | exit | 有效范围 |
| --- | --- | --- |
| `capture` | 终止码未由异步工具回传 | 基线写完并回读，进程已退出；不捏造终止码。首次保护误递归testing历史cache，共213156文件/约5.82GB读指纹，无写或执行；大基线保留，后续保护收窄顶层专家文档 |
| `vendor-initial` | 0 | 子命令收据明确exit0、保护delta0；外层异步会话已退出 |
| `red` | 1 | 收据器找不到顶层vite，测试NOT_RUN，设施失败保 |
| `red-r2` | 1 | symlink-origin createRequire找不到vite，测试NOT_RUN，设施失败保 |
| `red-r3` | 1 | fixture漏必填owner/description，5项schema设施失败，不算产品红 |
| `red-r4` | 1 | 重复open domain、双React实例，5项设施失败，不算产品红 |
| `red-r5` | 1 | S01真实缺投影红；4项jsdom缺CSS设施失败，分开记录 |
| `red-r6` | 1 | S01真实缺投影红；4项jsdom缺scrollIntoView设施失败，分开记录 |
| `red-r7` | 1 | 已到真实5项连接红；另纠正测试缺time需规范成null、顶层无wrapped徽章/父rollup无清单分数的测试假设；不按假设改产品 |
| `red-r8` | 1 | 5项有效连接红，schema/装配已正常 |
| `green` | 0 | 首5项绿 |
| `affected` | 1 | 46绿8失败；7项双React设施失败、1项旧绝对/tmp fixture与候选相对路径围栏冲突；原log全保，非产品修复对象 |
| `affected-r2` | 0 | 原6文件54项绿；仅runner切对应renderer React、旧absolute fixture不启DSH_PM_ISOLATED_ROOT，实际写根仍自有TMPDIR/显式file root |
| `red-final` | 1 | 同版最终8项有效红，明确原三源SHA绑定 |
| `green-final` | 0 | 最终8项绿 |
| `affected-final` | 0 | 最终54项绿及依赖/源input前后0变化 |
| `vendor-final` | 0 | 只读静态 |
| `selfcheck` 首次 | 1 | collector误把assets目录当用例；没有产品执行，设施首败收据保 |
| `selfcheck` 修正后 | 0 | 数字S用例选择/字节绑定/零写/尾空白检查满足 |
| `node --check ...runner.mjs` | 0 | runner语法检查 |
| `collect` | 以seal/终端实际结果为准 | 非Git diff三个命令预期各exit1表示有差异；精确seal，不自PASS |

每轮真实 argv/cwd/env/开始结束时刻/exit/原stdout/stderr/源码依赖fingerprint见同前缀 `*-receipt.json`、`*-inputs.json`、`*-output.json`；未跑成功的收据器例外单列设施receipt。探索性只读检索：`rg`不可用exit127；不存在memory路径ls、未就绪baseline/receipt的ls及轮询exit1；错文件`core/file-root.ts`的grep exit2；其余阅读/定位命令exit0。自身进程精准pgrep无匹配exit1表示已退出，非杀进程。没有安装或全局配置变更来掩盖失败。

## 原门影响索引

| 原门/旧证据 | 本修复影响 | 独立续验处理 |
| --- | --- | --- |
| RA-P2002-OUTBOUND-SLOT，R1 §5/§5.1 | 直接修目标，新增snapshot键与实际行slot | 旧FAIL保；独立SOURCE/AUTO审本八项真源及字节，Main新freeze/产物/宿主GUI补A最新/B无记录/顶层子层状态分组/重进/长slot不遮编辑/零写 |
| U4任务视图/编号/状态/清单 | 仅任务标题格布局/文本，算法源不变 | 54项相邻开发回归与八项DOM供审；旧GUI不能替新slot布局 |
| snapshot原消费/设置/queue与全入口 | 新增最窄只读map，不新route | Main整build/fullregression/web snapshot入口、旧字段回归；本角色不宣称整门通过 |
| P2001恶意web、P2002合法历史恢复/TTL日志、P2007量化 | 原core/export/backup/review/archive未改 | 原有限PASS及deferred事实保留，专家决定可继承；新snapshot读取须补零写，不重做31/29历史标准恢复或三档覆盖 |
| P1004/P1005/K16四修有限SOURCE/AUTO | 不动新逻辑/test；panel只新增字段与prop | 保原局部源码结论范围；Main新组合freeze/fullregression及原GUI不得自动继承旧host |

## Skill试点与移交

- 完整性前置：manifest SHA/bytes + vendor-initial exit0，才读取vendor正文；未跑installer/setup、HITL脚本或未vendored codebase-design。
- `rootCause→diagnosing-bugs`：独立报告已给根因范围，收敛到真实注册命令/DOM反馈环，设施与产品红分层；没有在诊断阶段静默改产品。
- `feature（可测修复）→tdd`：按负责人已经确认的真snapshot/真DOM合同先红后绿；同版最终test反放原三源8红，避免只有测试工厂或mirror helper绿。未重新要求用户念skill或常规批准。
- `delivery→code-review`：规范与规格两轴自查：窄map、Date.parse最大值、非法记录沿read过滤、不写日志/不露路径；三源行位复用、编辑独立、原U4算法保。没有subagent接口，明确为开发自查，不冒称两独立评审或验收；Git/setup/新外部skill/常规再次确认等冲突步骤按本子单跳过。
- brainstorming/writing-plans/UICraft harden仅沿已批准合同与现有token处理静态slot/换行，不做新设计系统/新功能。试点未毕业、专家结论未给。

交回本前缀产物、精确diff、SHA、设施/有效红和开发绿、保护自检及影响索引。产品写锁 `src/index.ts`、`src/client/panel.tsx`、`src/client/views/tasks.tsx` **released**；不再编辑。Main继续分配独立 SOURCE/AUTO，统一新 freeze/fullregression/newhostGUI，按父授权收尾ordinarycommit。build/noEmit/整verify/GUI/service/Git/凭据/privatefreeze/runtime均NOT_RUN；没有推送、发布、版本/tag/正式软链操作。**STOP。**
