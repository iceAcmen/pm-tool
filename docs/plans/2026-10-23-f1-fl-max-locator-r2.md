# F1 / FL / MAX 纯文件定位 r2

> 2026-10-23；角色：纯只读 fixture 定位专家。本文是事实性定位结果，不是测试 PASS，不是新测试计划，不改变父任务出口。状态：STOP / released。

## 1. 授权与结论

负责人本次原句要点：“父已明确授权独立专家/Main持续所有已实现未验至ordinarycommit，无新增功能/push/release；你纯只读fixture定位专家，不开发/GUI/产品执行。”“不重复在途派单。”“写唯一新docs/plans/2026-10-23-f1-fl-max-locator-r2.md事实性定位结果（不是测试PASS）。”

- 原 `p1_f7_remaining_fixture_locator_r1 / arun_6ada86477cfef4f845ad5624` 与 `parent_remaining_exit_locator / arun_6ada9b3e7cfef4f845ad6034` finished 是负责人提供的事实；本角色没有重派，也没有据此推定报告已落盘。
- 已读 `AGENTS.md` 全文、`docs/collaboration.md` §9/§11及原 remaining 合同。本次明确纯文件授权替代通用 fetch/build/install/回归/档案同步/提交 SOP。
- 本次范围内**未定位到原 F1 平面 A24+B2 的标准恢复包、真实 ids.json 或完整生成脚本；未定位到其生产合法 FL/FD 长密 variant 或原 RA-P1006 同 MAX fixture 实物**。这是有界查找结果，不宣称全机不存在，不宣布父任务阻塞或需要新增功能。
- 定位到原治理 AUTO 的合法历史生成来源、`load-history.json`、F5 标准包及 ids；它们是 QA-G 小尺度，明确不能代替 F1/FL/MAX。
- 定位到原 U4 schema 校验树 fixture 的源码、原排序/折叠 oracle、既有 GUI 父子原证和 manifest；不因此签当前 P2002 子层/折叠。

## 2. 原合同位置与 F1 的 24 状态

| 原件 | 精确位置 | 已冻结事实 |
| --- | --- | --- |
| `docs/testing/remaining-acceptance-register-20261021.md` | §4，F1 行（L44） | QA-A 平面 24：todo 8 / in_progress 6 / blocked 2 / done 7 / wrapped 1；QA-B 另 2；合法 code；A 两负责人+未分配；今日/逾期/将来；open16、29%；不得叠 OP 树 |
| 同上 | §4，FL/FD 行 | F1/F3 长密 variant：task title240 / description2000；link title200 / note500；progress content2000 / author80、E1三版；同项目会议/交付物/OKR/habit 各20合法记录；超生产允许值须交实际上限差异 |
| `docs/testing/remaining-governance-cases-20261021.md` | §3 RA-P1006（L44；不是文档 §4） | F1+FL 人员 MAX；合法历史 start D-31 / update D-8，标准恢复；blocked3天以上；事实/建议/标签筛选→目标→返回，浏览零业务写 |
| `docs/testing/remaining-journey-cases-20261021.md` | §6 people 行（L94） | F1同MAX刻度、未分配列、建议→筛选/目标；FD20负责人、FL姓名；浏览/筛选零业务写 |
| `docs/testing/p1-history-remaining-gui-review-20261023-r1.md` | §5 RA-P1006（L83）及 L44 | 原包未采 FL/MAX；23/6 与 smallMAX3 不替代。保留其已签有限历史切片，不扩大 |

这里的 A24 五态是**原合同值，不是本次读到的 24 行实物计数**。本次未获得这 24 行的真实 ID、code、负责人分配、日期分配、关联 ID 与 oracle 对照，不能造一张 `t-0001..t-0024` 表认领它。B2 的状态及负责人分配也未由总账行完整指定。

原登记的“所有写使用候选真实命令/领域动作；ids.json 保存别名→真实ID；不得假设 t-0001 属测试项目”继续有效。

## 3. 已存在历史样本：路径、ID 和范围

以下仓库前缀记为 `G`：

`docs/testing/governance-growth-independent-auto-20261021-evidence/governance-growth-independent-auto-20261021-soAcAa/`

以下既有 tmp 前缀记为 `T`：

`/tmp/governance-growth-independent-auto-20261021-soAcAa/`

四个文件在 G 与 T 均存在，逐字节相同；本次读取的是既有 fixture/报告文件，不读取该目录的 domain 或其他业务 runtime。

| 文件（相对 G/T） | 字节 | SHA256 |
| --- | ---: | --- |
| `F5-fixture.json` | 2081 | `ba043f787bfad04e66a975aec3029253a9001cc0285368a0aa1ec91426c051c3` |
| `F5-backup/pmtool-backup-2026-10-21T13-31-09-520Z.json` | 94712 | `f58bc05c5c95e262eceda4cedd108488e35f3b98d346c8fe39833dd8c2acf56a` |
| `load-history.json` | 10766 | `03eeaf1afadae5bf9ff05c27db786504402344f5a38f1e36cce949e764e8deb5` |
| `ids.json` | 1442 | `b0437248596664d21e5ec2eb42f5c4ff567bdb71b73352902efb61569b1368be` |

`F5-fixture.json` 保存历史 `precheck:"PASS"` 及上述备份 SHA；本次只核文件字节，不重跑 schema/precheck，不把历史字段改写为本次测试结论。

### 3.1 F5 包实际归属

包内 projects=6、tasks=23。任务实际分布：

| 项目ID / 名称 | 任务ID | 已存五态 |
| --- | --- | --- |
| p-0001 / QA-G A | t-0001、t-0006..t-0017、t-0023、t-0024 | todo7 / in_progress2 / blocked0 / done5 / wrapped1，共15 |
| p-0002 / QA-G B | t-0003 | todo1 |
| p-0003 / QA-G 确认撤销 | t-0004、t-0005 | todo2 |
| p-0004 / QA-G 队列 | t-0018..t-0021 | todo3 / blocked1 |
| p-0005 / QA-G 仅缺席 | t-0022 | todo1 |
| p-0006 / QA-G 习惯多月档案 | 无任务 | 0 |

这些已存任务 parentId 均为 null。A code=1..15，其中 t-0001=1、t-0006=2、t-0023=14、t-0024=15；B 的 t-0003 code=1。不能把全包23补一条当 A24，也不能把独立确认项目的2条冒充 QA-B2。

已存关联别名：`milestone=m-0001`、`risk=ri-0001`、`deliverable=dlv-0001`、`meeting=mtg-0001`、`attachment=at-1`、`progress=pl-1`；`长时低进度=t-0023`、`wrapped/人工收尾非完成=t-0024`。它们属于 G 的 QA-G 生成上下文，非原 F1 的 ID 认领。

F5 实存 milestones2 / risk_issues2 / meetings2 / reports0 / deliverables2；extra okrs5 / habits2 / reflections4 / lessons1 / settings10 / file_assets0。task title 最大11、description最大15字符，显然不能证明 FL 长值或 FD 每类20条。

### 3.2 原 RA-P1006 历史 oracle 的小尺度实物

`G/load-history.json` 保存 A 的14条任务，五态 todo7 / in_progress2 / done5，尚无 wrapped；其中：

- t-0023 / p-0001 / code14 / parentId null / todo / 测试甲 / progress20；
- startDate `2026-09-20`、dueDate `2026-10-16`、updatedAt `2026-10-13T00:00:00.000Z`；
- 原 D=`2026-10-21`，保存 tags 为启动31天、未更新8天；
- 保存 facts：未分配 taskCount11/open6/overdue1/done4；测试甲2/open1/overdue1/done1；测试乙1/open1/overdue0/done0；
- 保存 suggestions 指向 t-0023、t-0013，tags 指向 t-0023。

原生成/断言位置：`docs/testing/governance-growth-independent-auto-20261021-worker.mjs:687-710`，suite `RA-P1006`。它用真实 addTask、collectBackup→改合法历史 updatedAt→precheck→restoreBackupFromContent，再核 loadFacts/stanceSuggestions/staleStanceTags 与业务前后相等；**本次只读代码，不运行**。

这个历史 D 的值不能在 10/23 无说明改称精确 D-31/D-8；也没有 F1+FL 或共享 MAX 的完整期望数组。

## 4. MAX / 合法长密的 oracle 定位

| 文件位置 | 能定位到什么 | 不能据此推定什么 |
| --- | --- | --- |
| `packages/dsh-pm-tool/src/client/board/widgets.tsx:271-332` | peopleLoad：同一 people 数组的状态总数共享 max；分段 n/max；未分配 open 单列；截取6成员 | 不是原 FL/MAX fixture，也不是 people 页的独立 open-only 口径 |
| `packages/dsh-pm-tool/src/client/board/b4-guard.test.ts:152` | “同刻度 MAX 四态堆叠 + 图例 + 未分配单列”静态契约 | 不是生产合法长密库、实际页面计数或 MAX fixture 参数表 |
| `packages/dsh-pm-tool/src/client/views/people.tsx:119-121,191,449-460` | 现有事实/建议/标签消费，loadScale 共享轴、median/threshold 展示 | 不产生原 MAX 值、20负责人分配或合法 FL |
| `packages/dsh-pm-tool/src/core/load-stance.ts:92,132,183-186` | 原事实/建议/烂尾规则；后者说明 start>30天/update>7天/progress<50 | 不给新的 WIP/倦怠评分或允许任意 fixture 参数 |
| `packages/dsh-pm-tool/scripts/gen-valid-backup-fixture.mjs` | 通用生产 createBackup 生成来源，一项目/一任务 | 不是 F1/FL/MAX 生成器 |

`/tmp/build_fixture.py` 确实存在（4842字节，SHA256 `4929aa2097779d3fe235edae6fed3886c97e795556fbb6966722083974d2fac7`），但其 meta 自称“合成示例，非生产”、`references/progressEntries` 为提案 schema。脚本中的 SRC/OUT 字符串指向仓库外 Documents 设计文件，不在本次 repo/tmp 读取范围；未继续读取这些目标。它不走生产 schema/标准备份，不作为 F1/FL/FD 合法生成器。仓库的旧 redesign 设计资料也不是原 F1，排除后不继续追其真实数据来源。

### 原合同最小可重建输入，尚缺的实物

这不是追加参数、oracle 或生成任务，仅列恢复原合同对象需要的原输入：

1. F1：原 A24/B2 的完整行定义或真实命令清单、别名→ID/code映射、固定本地 D、两负责人/未分配逐行归属、今日/逾期/将来逐行日期。总账只给计数，不能反推这些值。
2. FL/FD：依原合同字段长度的生产合法 payload、超限时**原已校验**上限/差异记录、E1三版的真实引用关系、每类20条的同项目归属，以及 people 的20负责人/长姓名原输入。本次未找到这些 payload/校验原证，不替其自选缩短值。
3. MAX：原 fixture 的人员逐状态计数、未分配计数、实际共享轴/阈值及对应真实 task ID 的期望对照；不得从文字 MAX3、现有小尺度或纯静态公式另造参数。
4. 历史：与该 F1+FL 同对象的 start D-31/update D-8、blocked3天以上合法记录、标准包/预检/恢复原证及 SHA。G 的历史小样本只能定位旧阈值断言，不能自动映射到缺失的 F1。

原合同已规定这些写链由 Main 使用候选真实命令/领域动作并保存 ids、标准包及合法性原证；本定位专家没有运行或新增生成链。缺实物不等于产品缺功能，不暂停父的其他不重叠工作。

## 5. U4 树与 P2002 的有限继承

### 已有原树 fixture

`docs/testing/a13-u4-preplan-20261021-cases.test.tsx:25-47` 的 `record()`/`hierarchy`，项目常量 `qa-a13-a`：

| ID | code | parentId | priority / dueDate |
| --- | --- | --- | --- |
| qa-root-1 | 1 | null | P1 / 未设 |
| qa-child-a | 1.1 | qa-root-1 | P1 / 2026-11-10 |
| qa-child-b | 1.2 | qa-root-1 | P1 / 2026-11-20 |
| qa-root-2 | 2 | null | P0 / 未设 |
| qa-child-c | 2.1 | qa-root-2 | P2 / 未设 |

所有行由原 `record()` 走 taskWriteSchema.parse；原 FIXTURE 用例验证同项目、唯一性、父引用/无环/无清单。本次仅读源码及 `...-selftmp/r3/fixture.result.json`，其已存结果 total53 / passed2 / failed0，其他51为阶段过滤，不能算53通过。

原 oracle：同文件 L247-254 新链根/兄弟排序为 `root2,c,root1,b,a`；折叠 root1 留 `root2,c,root1`；L388-393 旧 WBS 为 `root1,a,b,root2,c`，折叠后 `root1,root2,c`。完整前缀均为上表 qa ID。它是 schema 合法 React fixture **源码**，不是已生成的标准恢复包，更不是给现 A7 手动换 parentId 的许可。

### 原 GUI 树实物索引

- `reports/all-pending-evidence-20261021/U4/gui-raw-report.md` §3/§5：QA-A-fixture-F5 的 t-0007/8/9 排序三任务；父 t-0010/code9，子 t-0011/code9.1/parentId=t-0010。
- `.../U4/gui-r2/15-tree-parent-leaf-due-hidden.json`：父/子实际 DOM 行及8 cell/grid原记录；不是完整业务任务 JSON，也没有单凭这一文件证明折叠交互。
- `.../U4/candidate-evidence-manifest.json`：原9个U4源/测试文件及 GUI 原证 SHA。不要读取其 runtimeRoot 下业务库来补本定位单。

### 当前受影响源继承范围

本次将主树9个U4文件与原 manifest SHA 逐一只读比较：8个相同，仅 `src/client/views/tasks.tsx` 不同。并只读 diff 原 `/tmp/pmtool-u4-closure-20261022-r2/packages/dsh-pm-tool/src/client/views/tasks.tsx`：

- 新增共用 exportSlot，在普通/子层 `.pt-task` 和父/状态组 `.pt-gname` 标题格追加，增加 flexWrap；旧 `.pt-acts` 出站文字移除；补完整 time/title。
- 任务树、sort/columns 状态与持久化源码、tasks.css 及原U4测试文件指纹未变。旧排序/存储/树算法的**未变接缝**是有限继承候选，是否继承由独立专家审证。
- 父行、子行、状态分组的出站文字/标题换行/操作格布局均受 TaskTable 变更影响；旧U4截图不证明新出站位。当前 A7 parentnull 没有覆盖子层/折叠，不能借此抹掉父已登记缺口。
- 不追加 GUI/测试矩阵，不把旧 U4 PASS 换签当前 P2002；原树 fixture 与 oracle 仅交 Main 定位引用。

## 6. 关键原件指纹

以下均为本次 fs 读得的大小/SHA，不是运行产物认证：

| 文件 | 字节 | SHA256 |
| --- | ---: | --- |
| `docs/testing/remaining-acceptance-register-20261021.md` | 15023 | `1ac19a6efacb5316fdd6ca74da47751b0ef55eee8a5897e819ea51db464f430d` |
| `docs/testing/remaining-governance-cases-20261021.md` | 13892 | `7ed381f0fc5d0807722b9f1197e188b6705f6fa674ea85266d2b98dba989bade` |
| `docs/testing/remaining-journey-cases-20261021.md` | 23525 | `ae44705d3bde794b0f349381f10218ba20b77a8ff55d12d81623fc426eb60ab2` |
| `docs/testing/p1-history-remaining-gui-review-20261023-r1.md` | 13184 | `f62e4b453177934ca2adabb2a00e68695f9b05f310a36dfa920ddbd50cae8ed7` |
| `docs/testing/governance-growth-independent-auto-20261021-worker.mjs` | 57462 | `8626dcbed6d982b03c9da8157bdc8fb0cd516ef55bd0ddeaa034eeb65f6a8e6f` |
| `packages/dsh-pm-tool/src/client/board/widgets.tsx` | 40248 | `0b4b2a6b85432a705e2f2e39cc97660f8df450cb82ec1abb8776e4c6301ce95a` |
| `packages/dsh-pm-tool/src/client/board/b4-guard.test.ts` | 9772 | `d0205d4b2cd46782c5d23d0c6d19ffee3d096fbdfcaeb3ec4e9b57ce608a9e59` |
| `packages/dsh-pm-tool/src/client/views/people.tsx` | 26112 | `e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6` |
| `packages/dsh-pm-tool/src/core/load-stance.ts` | 8270 | `ea3fd0aae076621dca045c64e784bf0c02b11ff87437dd210f853861ad58131c` |
| `packages/dsh-pm-tool/scripts/gen-valid-backup-fixture.mjs` | 1480 | `6afaabe66b9c26eb83e56c305943bc0bc4eda8b98f54e22e45cc1140eda655b2` |
| `docs/testing/a13-u4-preplan-20261021-cases.test.tsx` | 22057 | `1bfc069d2c40a93a15003ce055d7535a4b05b0fb8c00b6f1f44c7390c9f79f8e` |
| `docs/testing/a13-u4-preplan-20261021-selftmp/r3/fixture.result.json` | 19252 | `53d2a1f0fe81697b009768a6ee27ecb5960d0468940f4251eac4487b6ff85034` |
| `reports/all-pending-evidence-20261021/U4/candidate-evidence-manifest.json` | 8485 | `26f093c3f8fbc243a28cb736f452b6fc8aa1ed90ec7403bc14a94fac4948fba9` |
| `reports/all-pending-evidence-20261021/U4/gui-raw-report.md` | 7289 | `19dd93578139f564c610c7d6279db99333a9daabddb4682bb744a62561a0a485` |
| `reports/all-pending-evidence-20261021/U4/gui-r2/15-tree-parent-leaf-due-hidden.json` | 1311 | `1baaece083ddc1ef1b2666b57c0dc16972aa9a53b414ab2f331581501854f63e` |
| `packages/dsh-pm-tool/src/client/views/tasks.tsx`（当前） | 77665 | `5639b455c452d69686355e8b4e65daa1d91b82ef9965a5f085074d044a7771e6` |

## 7. 查找边界、验证和停止

- 环境：macOS；只读 JSON/字节核验使用既有 Node v22.23.3 内置 fs/crypto，无产品 import；未调用 pnpm。
- 首次 `rg` 返回 command not found（exit127），随后使用窄 `find -maxdepth`、grep/sed、结构化 JSON 读取和 SHA；未递归巨大 selftmp。
- 搜索覆盖 docs/testing、docs/plans、reports 顶层名称，指定 remaining/people/B4/U4 原件、插件 scripts/board 测试，reports/all-pending-evidence 指定层级，tmp 顶层 fixture/locator 名称及由原件识别出的 G/T 四文件；没有全机穷举。
- `docs/plans`/`reports` 顶层未发现两个前 finished locator 的对应命名报告；不推定它们未曾完成、不重复派单。未知临时 reader、日志、entry-url、private/profile 和业务 runtime 均不是继续搜索入口。
- 本次 Node JSON 读取、计数、G/T 字节比对、9文件指纹比较均 exit0；`diff -u` exit1 表示 tasks.tsx 存在上述差异，不是产品测试失败。没有运行 schema、helper、旧reader、生成器、build/install/git/fetch/网络/GUI/服务/端口检查或正式配置操作。
- 新报告目标在新增前 `test -e` exit1（不存在），因此新建本文件；没有覆盖既有报告，没有修改产品/原 testing/封件/living docs，也没有创建 tmp reader。
- 文档落盘回读后停止并释放。本报告不授予 commit/push/release，不签任何用例 PASS。Main 在等待及接收本定位期间继续原其他不重叠工作；未定位到的原实物及最小输入见 §4，不扩大父任务范围。
