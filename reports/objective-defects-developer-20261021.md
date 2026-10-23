# 客观进度缺陷开发交接

> 2026-10-21，平台 trae，开发角色。给 Main/独立专家复验使用；只记录限定修复、开发红绿测、候选指纹和遗留，不判独立 PASS。后续同子单编号反馈补修另节登记，不扩大 OP 范围。

## 1. 授权与范围

父持续授权用户原句：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”

本子单是开发，不是验收：独占 `packages/dsh-pm-tool/src/client/views/tasks.tsx`、`overview.tsx`、`gantt.tsx`、`src/core/task.ts` 和必要对应 tests。禁止 panel/board/其他产品/docs/testing/living docs/lib、install/build/服务/private/凭据/commit；Main 唯一隔离 builder。已批准最小修无需重问。方案依据 `docs/plans/2026-10-21-bridge-board-objective-closure.md` §3、专家完整 `objective-independent-auto-20261021.md`、`remaining-objective-cases-20261021.md` 和 ADL-055。

主树有他人在途改动，未 pull、未清树，未修改其成果。Main 已扩 vitest include 至 `.test.ts`/`.test.tsx`，本子单未改配置。新增测试直接消费专家 `9dg1J5/f2.json` 和合法 `f2-backup.json`，不是另造不同预期的假 F2；副本须带该两文件相同相对路径。

## 2. OP 修复与交接

- DEF-01：列表/树用全量 `deriveProgressMap(tasks)`，展示 objective/coverage/checklist、display/manualmode、备注、证据不足与 legacy 旁注。进度格只读，人工修改仍走现有编辑入口，不用行内 legacy 输入伪装客观值。已有“按进度”排序跟随 display，null 排末；筛选/折叠不改变聚合。总览阶段不再平均中间层 legacy 或因 done 强填100，保留 WBS 顶层入口，用同一派生和人工解析。只修展示，不改完成动作或 U4。
- DEF-02：甘特条体填充/标题/ARIA/左标签用 display+明确人工模式，objective 原派生保真。父日期范围带保持只读不填；所有改期处理器未改。保留两行固定行高，详细口径 title 可读；真实视觉待 Main。
- DEF-03：create/update evidenceUrl 复用 `isValidEvidenceUrl`，只允许 trim 后合法 http(s) 且≤2048。record/write 保持旧兼容，旧值读取/标准备份预检恢复/不相关更新不被新输入约束阻塞。非法请求在业务写前拒绝，含基本字段与资料 draft 同传也零写。
- 新增 `objective-consumers.test.tsx`：真实 TaskTable/Overview/GanttView+react-test-renderer，不 mock 派生或业务组件；只提供 window 事件边界。覆盖人工30/0/clear、无清单、P63覆盖2/3、pending、wrapped排除/还原、筛选保完整聚合与甘特改期白名单。
- 新增 `task-evidence-protocol.test.ts`：真实生产 schema+JSON Storage+DomainFacility+handleTaskCommand，合法/非法 add/update、混合draft零写、工时3.5、人工0/clear、旧非法协议record与标准备份兼容。测试只写 disposable 自有根，结束 `closeAll()`，不删现场。

无需 Main 新增 panel props：运行时 task 已含 manual 字段，各 view 局部结构型扩展 `TaskProgressMetaInput`，不改共享类型文件。Main 请精确同步下列四产品/两测试，重新认领总候选；OP 及本节源码不是独立签字。

## 3. OP 冻结指纹

基线 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`；包0.7.4+dirty，HEAD 不代替候选。OP 冻结时产品四文件原先均无在途改动；以下为本子单当前字节 sha256，新文件单独登记。`tasks.tsx` 后续编号修复会变更，最终整合以第6节后续指纹为准，不能沿本节旧字节当修后候选。

| 文件（根 packages/dsh-pm-tool） | sha256 |
| --- | --- |
| src/client/views/tasks.tsx | ebd763d30ff13448236bf8d03f41c93774d0963bfeebdb719ccbdd99010b2cc4 |
| src/client/views/overview.tsx | 17391f8a308926b0d559a1a346b9e4946f7c2054ba251458ffeb0c44b5c4c67e |
| src/client/views/gantt.tsx | 838a43451e037fdff363ce73e00570512d785f09f45688bf17afdb08ebc730bf |
| src/core/task.ts | ad71b6d1b26e386e297c8f3c6a555252772c5247ab94b3ceec89c787eb21646b |
| src/client/views/objective-consumers.test.tsx（新增） | 92aa22c5f8ad77dc6e7ac25fca2733115f7f4e908072c40572aca31b4adb0a48 |
| src/core/task-evidence-protocol.test.ts（新增） | 550f9cc21d4ea2c0603155ea96afe827da1b002817a59c717b2e4c277d997f35 |

## 4. 开发验证

环境 macOS Darwin，Node v22.23.3，既有 Vitest2.1.9/react18.3.1；未运行 pnpm（项目约定11.28.5）。主树 react-test-renderer 不可解析，按 Main 更正复制源码/package/config至自有 tmp：

`/var/folders/hk/r3xm2t6x7b9c_g_rg7cbw55w0000gn/T/pm-objective-developer-20261021-aLCdqK`

其 `packages/dsh-pm-tool/node_modules` 仅链接 Main 既有完整候选依赖。测试子进程采用新白名单环境 HOME/TMPDIR/DSH_HOME/DSH_PM_ISOLATED_ROOT/DSH_PM_FILE_ROOT/PM_STORAGE_ROOT 全部指向自有根；不继承认证/Key。未执行共享树 install/build/服务。

| 轮次/命令 | 结果 | 原始输出 |
| --- | --- | --- |
| `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` | exit0，两个注册vendor静态校验+sha/bytes一致；不等独立验收 | 工具执行输出；mattpocock锁49dd158，采用tdd+code-review |
| 新两文件 vitest 初轮 | exit1；18红/1绿，其中3个失败另含错误清理API `dispose()` | 工具完整输出保留；不是产品额外缺陷 |
| 修设施 `closeAll()` 后同两文件红测 | exit1；16红/3绿，总19 | 自有根 `red.stdout.txt`/`red.stderr.txt` |
| 四产品最小修后同两文件 | exit0；19/19 | `green-r1.stdout.txt`/`green-r1.stderr.txt` |
| 补wrapped/筛选/改期回归后13文件 | exit0；106/106 | `green-r2.stdout.txt`/`green-r2.stderr.txt` |
| 同13文件 `--no-cache` 最终复跑 | exit0；106/106 | `green-final.stdout.txt`/`green-final.stderr.txt`；完整argv/env/cwd/exit与cache前后在`green-final-command.json` |
| 四产品 `git diff --check` | exit0 | 无空白差异错误 |

原红测关键输出：

```text
F2 列表：expected '未开始' to contain '客观 50%'
F2 总览：expected 'F2-P20%' to contain '客观 63%'
甘特人工70：实际 aria 仍为进度40%，无人工设定
真实JSON命令非法add：expected 'success' to be 'error'
Test Files 2 failed；Tests 16 failed | 3 passed (19)；EXIT 1
```

最终绿测：

```text
objective-consumers.test.tsx 13
task-evidence-protocol.test.ts 9
task-inline 18；tasks-responsive 18；task-feedback 3
gantt.criticalPath 8；progress-clamp 11；gantt.milestoneLink 4
progress-meta 5；overview-contract 4；tasks-contract 4；gantt.routeEdge 5；tasks-tally 4
Test Files 13 passed；Tests 106 passed (106)；CACHE_UNCHANGED true；EXIT 0
```

完整复跑（在上述自有包 cwd；不build/install）：

```sh
env -i PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  HOME="$PWD/../.." TMPDIR="$PWD/../.." DSH_HOME="$PWD/../../dsh-home" \
  DSH_PM_ISOLATED_ROOT="$PWD/../.." DSH_PM_FILE_ROOT="$PWD/../../files" \
  PM_STORAGE_ROOT="$PWD/../../storage" NODE_ENV=test \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node node_modules/vitest/vitest.mjs run \
  src/client/views/objective-consumers.test.tsx src/core/task-evidence-protocol.test.ts \
  src/core/progress-meta.test.ts src/core/progress-clamp.test.ts \
  src/core/gantt.criticalPath.test.ts src/core/gantt.routeEdge.test.ts src/core/gantt.milestoneLink.test.ts \
  src/core/task-inline.test.ts src/commands/task-feedback.test.ts \
  src/client/views/tasks-contract.test.ts src/client/views/overview-contract.test.ts \
  src/client/views/tasks-tally.test.ts src/client/views/tasks-responsive.test.ts \
  --maxWorkers=1 --minWorkers=1 --no-cache
```

## 5. 设施异常、Review与遗留

**共享缓存写入**：早期未加 `--no-cache`，Vitest默认通过node_modules软链写 Main 共享树 `node_modules/.vite/vitest/results.json`，最终该轮mtime=2026-10-21 21:20:34，1162bytes，内容是本批13文件耗时。这违反“不写共享wt”边界；已即时告知Main，不擅自删/恢复覆盖别人缓存，不以“只缓存”声明零写。后续最终复跑 `--no-cache`，该缓存 sha256/mtime before=after。没有证明整个依赖树全量前后零变；未写共享src/lib/配置。

开发Review逐标准/合同自查：仅四产品/两test，不新增模型/完成语义/数据迁移或通用设计。窄屏旧CSS隐藏父进度格，限定格 inline display与父行wrap保留内容；总览口径放阶段下方整行，不塞110px省略名；甘特保原两行高度。无可用并行独立review工具，本次仅开发自查，不能冒充独立双Agent review。剩余真实390/长备注/浅深色/键盘旅程由Main按专家计划新build采证。

原 TaskTable 渲染仍有已存在 unique-key warning（红绿均有），未在本子单顺手修 unrelated列表结构。辅助 `tsc --noEmit` 首次长调用未返回完整exit，后续用spawnSync捕获重跑，`node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` exit0、stdout/stderr空；原始`typecheck-result.json`/`typecheck.stdout.txt`/`typecheck.stderr.txt`在自有根。未写lib或其他构建输出。

Main继续：新总包唯一隔离build/全vitest/全verify/guard，合法新实例与下发绑定，F2四消费点人工30/0/clear、wrapped/完成日期/真实宿主重启等原GUI证据。独立专家复验DEF-01/02/03及OP/RA-OP受影响项；本子单不签OP整门PASS、不commit。

## 6. 编号反馈追加

负责人后续补充：独立原证 `docs/testing/gui-numbers-habit-dark-review-20261021.md` §4 GNHD-01/P2，62px代码按钮的成功/失败字串被padding/icon/ellipsis裁切；系统复制值正确不替视觉PASS。持续授权覆盖同子单最小 `tasks.tsx`+必要`tasks.css`+真实组件结构/原clipboard契约回归。Main不抢文件，等待最终整合交接再build。

状态：开发修复+专项自验可Review，真实GUI仍待Main采、专家判。编号始终保原code/短ID，按钮下方同列独立 `role=status` 反馈“已复制/复制失败”，无图标/padding挤压，允许列内换行、不hidden/ellipsis；失败value允许 `user-select:text` 且提示手动取编号。62px列与所有其他列宽原样；复制处理器/1600ms复位代码未改，不改业务。

编号原接口与真实组件结构新增5例红测+原clipboard3例：exit1，5红/3绿，原件`number-red.stdout.txt`/`number-red.stderr.txt`。关键原输出：

```text
成功：expected '已复制' to be '1'
失败：expected '复制失败' to be '1'
独立反馈：No instances found with props: {"role":"status"}
列内反馈样式：expected undefined to be defined
Tests 5 failed | 3 passed (8)；EXIT 1
```

最小呈现修复后与OP组合：15文件114/114 exit0。最后去除新CSS未定义字体token再按最终字节重跑，仍114/114 exit0；`integrated-final.stdout.txt`/`integrated-final.stderr.txt`/`integrated-final-command.json`记录完整argv/env/cwd/exit和共享cache前后相同。新增8项=编号结构/计时5+原clipboard3，原OP106未变，不将结构/CSS断言当真实视觉PASS。

在§4复跑命令的 `--maxWorkers` 前另加以下两个参数即可复跑最终15文件；其余命令相同：

```sh
src/client/views/tasks-number-feedback.test.tsx src/client/views/tasks-clipboard.test.ts
```

最终Review：编号修仅tasks.tsx+tasks.css+新增test，显示在编号格内，不用top toast/不遮任务列。已有key warning保留。失败编号手动选择、全文真实可读、两行Tab/Enter/系统pbpaste/拒绝权限/1600ms/前后manifest按专家GNHD-M03由Main新候选实测；本开发不操作GUI。Main可开始唯一隔离build，受影响OP+GNHD旧结果须按新字节复验。

## 7. 最终整合指纹与出口

本子单最终仅五产品+三新增tests+本报告；禁止目录及panel未编辑，未install/build/commit/服务操作。八文件主树字节与自有最终测试副本逐项相同。五tracked产品的 `git diff -- <以下五产品路径>` UTF-8输出sha256：`e0395ce1bb2807440ed36d1cc4e08b9cf516a4317e4d39f45d8b4c134f14ee73`。后续新写需重新认领，不能只引用HEAD/包版本。

| 文件（根 packages/dsh-pm-tool） | 最终sha256 |
| --- | --- |
| src/client/views/tasks.tsx | c6b84a4ab5a711addc06c0de38b9d0d7af1f40df162d3462a04079b98e92c5e2 |
| src/client/views/tasks.css | 35f1123e41ae0cce98c00f6ab5eb64f05ddf86fa491603b6cb8f7c17ad5be161 |
| src/client/views/overview.tsx | 17391f8a308926b0d559a1a346b9e4946f7c2054ba251458ffeb0c44b5c4c67e |
| src/client/views/gantt.tsx | 838a43451e037fdff363ce73e00570512d785f09f45688bf17afdb08ebc730bf |
| src/core/task.ts | ad71b6d1b26e386e297c8f3c6a555252772c5247ab94b3ceec89c787eb21646b |
| src/client/views/objective-consumers.test.tsx（新增） | 92aa22c5f8ad77dc6e7ac25fca2733115f7f4e908072c40572aca31b4adb0a48 |
| src/core/task-evidence-protocol.test.ts（新增） | 550f9cc21d4ea2c0603155ea96afe827da1b002817a59c717b2e4c277d997f35 |
| src/client/views/tasks-number-feedback.test.tsx（新增） | bace029fc20f46cc8e65b075879966d97e2cd5e4e24a4d1673af3a528a157e1f |

关键原证SHA（自有根，不进专家testing、不删除）：

| 文件 | sha256 |
| --- | --- |
| red.stdout.txt | 414d7caa3edd0a044a69eb6c3329c80d88140ef90004c5ae07537e88807a4afc |
| green-final.stdout.txt | c57f7d8ebd9c0614874f29e31768b58cad7e35ae04aa23c1260da3216a29f899 |
| number-red.stdout.txt | 9cc076663a4113f89b0e73c3df634c43417ec0a64d6c9c896185cac91390cc2e |
| integrated-final.stdout.txt | 44d28e7fbf1675c087d3efff1df454923bcd68bc052b3b4b46c50ef6c870b193 |
| integrated-final-command.json | 7f5c23e965217ac1627cecae6340010b658e3b2607e07d7cd64bfc2896afbac1 |

出口：Main精确同步八文件并统一认领/build/完整回归/新实例GUI采证，独立专家审签。**无需任何新增panel props。开发自验114/114、noEmit0、diff-check0不等整包build、真实GUI或独立PASS；本子单没有普通commit权限。** Living docs/changelog/交接档案由Main在最终协调收口同步，本角色只写本报告。
