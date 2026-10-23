# F1 / FL 生产 API 与 schema 准备定位 r3

> 2026-10-23，trae；纯只读生产 API/schema 准备定位专家。唯一新增本文件；不是开发、产品执行、GUI 执行或验收。状态：STOP / released（落盘读回后生效）。

## 1. 授权、来源与对象

负责人原句：

> 父原授权Main持续所有已实现未验至ordinarycommit，Main唯一builder/GUI/桌面。你纯只读生产API/schema准备定位专家，非开发/GUI/产品执行。唯一新 docs/plans/2026-10-23-f1-fl-production-schema-r3.md，其余只读；本单替代通用fetch/install/build/livingdocs/git。原locator已完成 docs/plans/2026-10-23-f1-fl-max-locator-r2.md，不重复搜索缺失原包。

> 现在准备依总登记§4可重建F1/FL：A平面24(todo8/inprogress6/blocked2/done7/wrapped1)B2，两负责人未分配、今日逾期将来、共享MAX；FL title240/des2000若生产max较小则交实际差异，不自缩对象。

> 不要运行schema/产品、旧worker/helper、tests、bundle、读取runtime/private/profile/正式根。另只读列会议/交付物/OKR/habit字段长度与现有command add形状，F3 link/progress字段max；用于Main按原FL/FD每类20真实合法生成。不能判PASS不能用GG/smallMAX替，没有原行细节时例行分配工程值可明确Main新F1R3认领而非伪造历史原包。完成读back后STOP/released。

- [原总登记 §4](../testing/remaining-acceptance-register-20261021.md#4-fixture-总账) 是对象定义；[原 locator r2](2026-10-23-f1-fl-max-locator-r2.md) 是已完成的有界定位，不重复搜索缺失原包。
- 已读 `AGENTS.md`、`docs/collaboration.md` §11 和当前接续定位信息。Main 父授权不移交给本角色；本单不同步 living docs，不提交、不推送、不改原 testing/封件。
- 当前包根：`/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool`。
- 对比冻结包根：`/private/tmp/pmtool-combined-f02-repair-20261023-r2/packages/dsh-pm-tool`。仅读其指定生产源码与 `package.json`，不读 `lib`、依赖、运行库或配置。
- 包两处均为 `dsh-pm-tool` / `0.7.4`。`package.json` 公开 exports 为根、`./client`、`./package.json`、`./locale/*.json`，**没有公开 `./core/*` 子路径**。下文是内部源码模块的真实命名导出，不是臆造 `dsh-pm-tool/core/...` 公共 API。
- [Combined 输入登记](../../reports/all-pending-evidence-20261021/CombinedF02RepairR2/complete-inputs.json) 有 525 个键，键相对包根，例如 `src/core/tasks.ts`。本次指定 33 个文件：主/冻字节相同 33/33，大小/SHA 与登记匹配 33/33。只认这 33 个源码输入，不声称核了全部 525、更不声称当前 host/bundle 已装载。

下面长度与行为均为**静态生产源码事实**；本角色未执行 parse、领域写或备份预检。Main 必须以实际生产校验、真实返回 ID、标准备份及回读原证证明最终 fixture 合法。

## 2. addProject / addTask / updateTask

下文所有 `src/...` 均相对上述两个包根。调用中的 `domain` 类型来自 `src/core/storage.ts` 的 `PmDomain`，是宿主 `openPmDomain(ctx)` 的返回类型，**不是路径字符串或普通 JSON 对象**；本角色不打开 domain。

| 模块 / 精确导出 | 合法入参 / 返回 |
| --- | --- |
| `src/core/projects.ts:37`，`addProject(domain: PmDomain, input: unknown, allowDuplicateName = false): Promise<Project>` | 必填 `name,startDate,targetDate`；`description=''`、`owner=''`、`status='planning'` 默认；可选 `tags:string[]`、`repoUrl,branch`。status 为 planning/active/paused/done/archived；有效 YYYY-MM-DD 且 targetDate 不早于 startDate。同名默认拒绝，第三参 true 才允许。返回深拷贝 Project，不是 `{project:...}` 包装。 |
| `src/core/tasks.ts:123`，`addTask(domain: PmDomain, input: unknown): Promise<Task>` | 必填 `projectId,title`；默认 `parentId=null,description='',assignee='',status='todo',priority='P1',progress=0,milestoneId=null`。可选字段详见下表；真实生成 Task 返回深拷贝。 |
| `src/core/tasks.ts:254`，`updateTask(domain: PmDomain, id: string, input: unknown): Promise<Task \| undefined>` | 必须已有真实任务 ID；接受非空业务片段，或仅含合法 draft ops；不存在返回 undefined。合并后 taskWriteSchema 校验，返回深拷贝完整 Task。不是 boolean、计数或 patch。 |

生成值：项目 ID 按现存 `p-N` 最大值续号；任务 ID 按全 tasks 表 `t-N` 最大值续号。任务 order 按同项目/同 parent 最大值+1，code 根为 order，子为 parent.code + "." + order。ID/code/order/createdAt/updatedAt 都不能在普通 create/update 中指定。不得根据示例猜真实 ID。

### 2.1 task 基本字段、上限与 normalize

生产定义：`src/core/task.ts:109-245`（字段/create/update）；`src/core/tasks.ts:123-205,254-392`（写入）。

| 字段 | 生产写 shape / normalize | 长度或数值限制 |
| --- | --- | --- |
| `title` | 字符串 trim 后非空；create 必填、update 可选 | **没有 `.max`**。FL 240 可保持，不截短。 |
| `description` | 字符串，不 trim、不截断；create 默认空 | **没有 `.max`**。FL 2000 可保持。 |
| `assignee` | 字符串，不 trim、不折叠空白、不分人；create 默认 `''` | **没有 `.max`**；姓名长值不需按虚构 80 上限缩短。null 非合法基本字段。 |
| `status` | todo / in_progress / blocked / done / wrapped | 真实值是 **in_progress**，不是 inprogress。五态枚举真源 `src/core/status.ts:4`。 |
| `priority` | P0/P1/P2 | 默认 P1。 |
| `progress` | 整数 0..100 | 不由 status 自动改为100；要使 F1 open16，16条开放状态记录都须 `<100`。 |
| `startDate,dueDate` | 有效 YYYY-MM-DD；create 可省，不能 null；update null 清键 | 合并写时 dueDate 不早于 startDate。 |
| `completedDate` | create 不接受；update 可给有效 YYYY-MM-DD 或 null | 非 done→done 自动记本地今天，显式合法日期优先；done→其他状态清键；其余显式 null 清键。 |
| `milestoneId,deliverableId` | null 或真实同项目 ID；milestone 默认 null，deliverable 可省 | 存在/同项目校验，不能猜关联 ID。 |
| `predecessorIds` | 可选真实任务 ID 数组；存在、同项目、不自指、无环 | update 去重，空数组清键；不要为 F1 引入依赖/OP 树。 |
| `effortHours` | 可选非负 number | 无文本长度概念。 |
| `evidenceUrl` | 可选 trim 后合法 http/https URL | 最大 2048；不是任意长说明。 |
| `manualProgress` | 可选 null 或整数0..100 | null 清除设定并移除 manualProgressNote。 |
| `manualProgressNote` | 可选字符串，不 trim | 最大500。 |
| `repoUrl,branch` | 可选 trim 字符串；非空分别通过共享白名单；空白清键 | schema 无 `.max`，不是用于 FL 的 description 字段。 |

普通 update 不接受 `projectId,parentId,id,code,order,createdAt,updatedAt,checklist,attachments,progressLog`。需要资料/日志走专用动作或 draft ops；移父另有动作，不在本次 F1 平面对象内。

`addTask` 会先剥离顶层 `draft`，其余走 strict create。新建 raw draft 支持 `attachments:[{kind:'link'|'deliverable',...}]`、`progressLog:[{date?,author,content,refs?}]`；或 ops 信封。update draft **仅**接受 `attachmentOps/progressOps`，不能用 raw 数组替换富历史。相关 normalize 真源 `src/core/task-materials.ts:137-274,323`，不是假定普通 schema 支持顶层数组。

### 2.2 真实人命令形状

以下是语法示例，**未执行**；其中 `<实际ID>` 必须由 Main 使用 API 返回值或命令成功结果登记后替换，不能直接把示例 ID 当测试实体：

```text
/pm project add {"name":"QA-A-F1R3","startDate":"2026-09-22","targetDate":"2026-11-30"}
/pm task add {"projectId":"<实际A项目ID>","parentId":null,"title":"F1R3-A-T01","assignee":"测试甲","status":"todo","progress":20,"startDate":"2026-09-22","dueDate":"2026-10-22"}
/pm task update <实际任务ID> {"status":"wrapped"}
```

入口：`src/commands/project.ts:84-105`、`src/commands/task.ts:242-266,294-317`。wrapped 人命令直接调用 updateTask，没有额外“wrap”子命令、没有 confirm 后缀；成功文案明确“已收尾≠正式完成，不计 done/open”。AI 不得代人决定收尾；本角色不执行该命令。`describeTaskValidation` 旧提示只列四态，不能用旧提示否认真实五态枚举。

副作用要单列：updateTask 非done→done 成功后 best-effort 异步 `ensureReflectionOnDone` 可能新增复盘；addTask 直接 status=done 的路径没有同一转态钩子。资料/日志专用动作也会更新任务 updatedAt；**所有正常资料/日志准备完成后**再准备历史包，否则 D-8 会被后续写刷新。不把合法副作用误报零写。

## 3. 标准备份、预检、历史 updatedAt

全部真实命名导出在 **`src/core/backup.ts`**，不是 `file-backup.ts` 或旧 worker 的自制包装：

| 精确位置 / API | 定义 / 返回 |
| --- | --- |
| L88 `collectBackup(domain, exportedAt = new Date().toISOString()): PmBackup` | 同步深拷贝七表+白名单 extra；不写文件，不做预检。 |
| L153 `createBackup(domain, directory?: string): Promise<BackupSummary>` | BackupSummary=`{path:string,counts:Record<string,number>}`，**不是备份内容**。生成时间戳 JSON+`.files.<fileBundleId>`侧车；无资产也有空 bundle。 |
| L157 `validateBackup(value: unknown): PmBackup` | envelope/extra shape 初验；**不等于完整 schema/关系/字节预检**。 |
| L395 `precheckBackup(backup: PmBackup): Promise<void>` | 对七表 record schema、白名单 extra 的 domain schema、任务归属/父链/依赖/里程碑/交付物/file引用等做预检；返回 void，不是 `"PASS"`。这个底层函数单独不核文件侧车字节。 |
| L231 `precheckBackupContent(jsonText: string): Promise<PmBackup>` | JSON内容完整结构/关系预检，并拒绝非空 file_assets；返回备份对象，不写安全快照。 |
| L218 `restoreBackupFromContent(domain, jsonText: string, directory?: string): Promise<{safetySnapshot?:string,backup:PmBackup}>` | 内部重复完整预检；有现存数据先写安全快照，再串行替换；失败回滚。directory 是**安全快照输出目录**，不是目标 domain 数据目录。 |
| L202 `precheckBackupFile(path: string): Promise<PmBackup>` | 标准路径预检，包括侧车 manifest/字节/媒体/大小/内容寻址关系；只演练不生成安全快照。 |
| L212 `restoreBackup(domain, path: string, directory?: string)` | 同上恢复结果形状；带真实文件资产必须走路径链，侧车要与 JSON 字节 SHA 匹配。 |

PmBackup 的关键 shape（`src/core/backup.ts:31-60`）：

```typescript
{
  format: 'pm-tool-backup',
  formatVersion: 1,
  exportedAt: string,
  projects: Project[],
  tasks: Task[],
  milestones: Milestone[],
  riskIssues: RiskIssue[], // 不是 risk_issues
  meetings: Meeting[],
  reports: ProgressReport[],
  deliverables: Deliverable[],
  extra?: Record<string, [string, unknown][]>,
  fileBundleId?: string
}
```

extra 白名单：settings/reflections/okrs/lessons/habits/file_assets；每项为 `[真实key,row]` 元组数组，不是裸 record 数组。宿主 sessions/checks 不进此备份。旧包无 extra 保留当前额外表；提供 extra 时只替换显式出现的表，显式空数组会清空该表。恢复不是“只追加F1”，而是七表整体替换，Main 要按原隔离合同保持完整准备对象。

### 3.1 合法历史形状与禁止误用

- `taskRecordSchema` 的 `createdAt,updatedAt` 是必填 **`z.iso.datetime()` 字符串**（`src/core/task.ts:171-179`）；保守使用 UTC `YYYY-MM-DDTHH:mm:ss.sssZ`，例如 `2026-10-15T00:00:00.000Z`。不要传 Date对象、数字时间戳、YYYY-MM-DD日期、null、未知的 `updated_at`，或未开启 offset 的 `+08:00` 字符串。
- 此 record schema 没有“updatedAt必须为今天”、无墙钟/两天写窗、无 createdAt≤updatedAt 的额外 refine；`precheckBackup` 对任务用 record schema 而不是 create/update。**静态定位到历史可恢复入口，不是已执行合法性结论**。Main仍应保留连贯的创建/更新时间，避免自己造反常历史。
- 普通 addTask/updateTask 禁止提供 updatedAt；不能用 `updateTask(...,{updatedAt:历史})`，不能直接 put/runtime改库。原登记允许在完整标准备份内容中准备合法历史，再通过生产预检/confirm恢复。
- JSON-only链只有 `extra.file_assets` 为空/缺省且没有 file 引用时适用；link/deliverable 软引用不是字节资产。已有真实附件的完整 F5 不能删掉附件来迁就 content API；应保留资产/侧车走路径链。手改一个带资产 JSON 的 updatedAt 会改变 JSON SHA，不能继续沿用旧侧车 manifest 冒合格。
- 建议 Main 正常创建并完成资料/日志→collectBackup 得全对象→仅在新历史备份内容认领目标历史值→`precheckBackupContent`→`restoreBackupFromContent`（均由 Main 执行；无文件资产时）→真实 `createBackup` 再封标准包并回读。已有资产则走原标准路径/侧车设施，**不运行旧 worker/helper**。
- `createBackup` 自身不调用完整 precheck；有 JSON路径不等于预检通过。Main 要分别保留生成、实际预检、确认恢复、恢复后标准备份及 IDs 证据。

历史日期锚：D取 Main 实际执行时本地日期，GUI不改墙钟。若D=`2026-10-23`，D-31=`2026-09-22`，D-8=`2026-10-15`，D-4=`2026-10-19`。startDate为日期，updatedAt为完整ISO datetime。`staleStanceTags` 取ISO字符串前10位做日差，因此用上述午夜Z形状避免跨时区歧义；执行跨日由Main如实重认领D，不能把10/21历史数字照搬冒当天。

## 4. F1 新认领工程值与双口径 oracle

原合同必须保持 A24 平面、B另2；A五态8/6/2/7/1，done仅7，完成率 `round(7/24*100)=29%`，开放状态合计16（且progress均<100）。OP树单独F2，不增父子节点污染24。`completionHero` 真源 `src/client/board/widgets.tsx:45-60`，分母是输入 `data.tasks.length`，所以Main须绑定A项目scope，不能把B2或OP并入该分母。

原 locator 未找到原26行细节，本单**不补造历史原包**。下面只是一组可由Main明确采用为**新 F1R3 工程分配**的候选值，别名不是数据库ID；不改变专家动作/用例。Main采用时自行保存新对象名称、D、逐行payload、实际ID/code、实际返回及预期数组：

| 人员 | 新A任务别名分配 | 全部 / open / done |
| --- | --- | --- |
| 测试甲 | T01..T04 todo；I01..I03 in_progress；B01 blocked；D01..D04 done；W01 wrapped | 13 / 8 / 4 |
| 测试乙 | T05..T06 todo；I04..I06 in_progress；B02 blocked；D05..D07 done | 9 / 6 / 3 |
| 未分配 `assignee:''` | T07..T08 todo | 2 / 2 / 0 |

可用日期工程值：T01 start D-31/due D-1/progress20/历史update D-8，作为逾期+烂尾标签对象；T02和未分配T07 due D；其他普通开放项 due D+7；B01 start D-31/due D+7/update D-4，避免逾期优先掩盖 slow；B02 due D-1；done/wrapped due D-1（不应催办）。其余start可统一D-31，open progress0，done progress100，wrapped progress20。B2的状态未由原行完整指定，可新认领两条todo/未分配，分别due D/D+7；只观察A时不得串入A24。以上不是已执行payload，不宣称是原作者的人员/日期分配。

### 4.1 人员 page 的导出与预期定义

| 真源 / 导出 | 输入、输出和 oracle |
| --- | --- |
| `src/core/people-load.ts:92` `normalizePerson(raw:unknown):string` | trim→内部连续空白折成单空格→拉丁小写；空串=未分配。仅分组派生，不回写task.assignee。 |
| 同L102 `displayForm(raw:unknown):string` | trim/折叠空白、保留大小写；显示名按组内最常见写法，并列首见。多负责人分隔符只打multiOwner，不拆成多人。 |
| 同L236 `groupOpenTasksByAssignee(tasks,projects,options={}):PeopleLoadReport` | options支持today/withinDays/settings；open为非done、非wrapped且progress<100；返回`{today,withinDays,unassigned:PersonRow|null,people:PersonRow[]}`，row有openTotal/todo/inProgress/blocked/overdue/dueSoon/p0/projectCount/nextDue/tasks。不是board四段全量计数。 |
| `src/client/views/people-scale.ts:18` `loadScale(assigned:number[],unassigned:number,overloadThreshold:number):LoadScale` | rawMax=`max(threshold,...assigned,unassigned,1)`；maxX=`max(8,ceil((rawMax+2)/2)*2)`；ticks=0,2,...,maxX。返回`{maxX,ticks}`，没有名为MAX的返回键。 |
| `src/core/load-stance.ts:92` `loadFacts(tasks,options={today?}):StanceFactPerson[]` | 按normalizePerson计taskCount（包括done/wrapped）、openCount（非done/wrapped且progress<100）、overdueCount、doneCount（仅done）。显示名首见，不等于groupOpen的频次选举。 |
| 同L132 `stanceSuggestions(tasks,options={today?}):StanceSuggestion[]` | 逾期先cut；未先命中逾期且blocked/update日差**>3**才slow；wrapped跳过；一任务一建议，逾期按due升/ID，blocked按日差降/ID。D-3不满足>3，D-4可达。 |
| 同L186 `staleStanceTags(tasks,options={today?}):StaleStanceTag[]` | start日差>30且update日差>7且progress<50；wrapped跳过。代码没有额外status!==done过滤，不将注释愿景补成生产谓词。D-31/D-8/progress20可达。 |
| `src/core/derived.ts:111` `isTaskOverdue(task,today):boolean` | 非done、非wrapped、progress<100、有due且due<D；今日/将来/缺due都不是逾期。 |

`PeopleView` 是 `src/client/views/people.tsx:67` 命名导出 React组件；`report` 是其L98局部useMemo变量，**没有可import的report函数**。L88-101先剔除被其他记录parentId引用的父节点，仅leafTasks进入groupOpen；L119-121消费loadFacts/suggestions/tags（props可优先注入，否则同源派生）。

L186-199用**全部已分配openTotal**与未分配open、settings阈值算loadScale；不是从当前过滤可见人数重算轴。中位/均值仅已分配人员，未分配不是一个人。默认设置在 `src/core/settings.ts:60-61`：reminderWithinDays=7、loadOverloadThreshold=5，实际Main须认领设置值，不能读取本机private配置来猜。

按上表**新工程分配**，若A scope/阈值5/全部open<100：page peopleValues=[8,6]（数组顺序由风险序决定）、unassigned=2、openSum16、maxX10、ticks[0,2,4,6,8,10]、median7、avg7。facts为甲13/open8/done4、乙9/open6/done3、未分配2/open2/done0；不能拿page maxX10写成board MAX10。

### 4.2 board 共享 MAX 的精确入口与差异

真源 `src/client/board/widgets.tsx:271-332`：

- `peopleLoad` 是**局部const WidgetDescriptor**，没有独立 `export function peopleLoad`、也没有 `computeSharedMax` 导出。可达导出为L750 `WIDGET_REGISTRY`（Map），`WIDGET_REGISTRY.get('peopleLoad')` 对应 descriptor，其 `.render({data,onLink,linkage,...})` 生成卡片；本角色不调用render。
- 分组键是 `(t.assignee||'').trim()`，**没有内部空白折叠/小写归一**。无负责人跳过成员条；不同大小写在board可能成两人但在page合一。
- 按全部已分配任务分四段：done→done；in_progress→progress；blocked→blocked；**其余→todo（包括wrapped）**。不按progress100过滤。
- 按总任务数降序取前6，再共享max=`max(1,...该6成员的四段总数)`；每段宽`n/max*100%`，不是每个人自己的100%轴，不包含未分配计数和过载阈值。
- `unassignedOpen` 单独用非done/非wrapped/trim后空assignee的任务数；该处**没有progress<100过滤**，与page不能完全等同。
- 所以新工程分配下board MAX13：甲四段done4/进行3/阻塞1/待办5（todo4+wrapped1），总13；乙3/3/1/2，总9；未分配开放2单列。page仍open8/6、maxX10。
- 这是生产实际差异，**不是建议把wrapped改todo、删wrapped或换GG/smallMAX**。Main须保留五态事实与两种原口径分别采证，由独立专家判断受影响范围。本定位不判BUG严重度/PASS、不修改产品。

FD20负责人/FL长姓名若用于人员页，是另外明确认领的长密variant；不静默把本F1两负责人的24行改成20人后沿用MAX13/maxX10。同项目其他四类各20不必增加F1任务数；人员分组来源仍task.assignee，不是OKR owner或会议participants。

## 5. F3 / FL 链接与多修订日志

schema真源 `src/core/task.ts:43-107`；领域normalize/写真源 `src/core/task-materials.ts:176-260,553-766`。

| 字段 | 实际上限 / normalize |
| --- | --- |
| link `url` | trim后合法http/https、非空、≤2048；`normalizeEvidenceUrl`在`src/core/evidence.ts:18`，返回trim后的原字符串，不对URL重新serialize、不联网。 |
| link `title` | trim，optional，≤200；空白不存title，无截断。原FL200保留。 |
| link/deliverable/file `note` | trim，optional，≤500；空白不存，无截断。原FL500保留。 |
| progress revision `content` | trim后非空，≤2000。原FL2000保留，不截断。 |
| entry/revision `author` | trim后非空，**没有max**。原FL80保留；没有`AUTHOR_MAX=80`生产常量。 |
| progress `date` | 有效YYYY-MM-DD；缺省本地今天，edit缺省最新revision日期；没有打卡的两天限制。 |
| attachments / progressLog | 每任务最多50资料项/100条entry，含软删entry；ID各自唯一。revisions至少1、同entry revision ID唯一，**无revision数量max**。 |
| deliverable冻结 `frozenVersion/frozenName` | ≤120 / ≤200，关联时复制交付物version/name，不截断；即使交付物本体无max，挂到task仍可能因冻结快照超限被拒。F3被引用V1需同时满足此shape。 |

真实导出/返回：

```typescript
// src/core/task-materials.ts
addLinkAttachment(domain, taskId, { url, title?, note? }, nowIso?)
// Promise<Record<string, unknown>>，新增的at-N资料项，不是整个Task
addDeliverableAttachment(domain, taskId, { deliverableId, note? }, nowIso?)
// 同上，返回含冻结version/name的at-N
progressAppend(domain, taskId, { date?, author, content, refs? }, nowIso?)
// Promise<ProgressEntry>，新增pl-N首版rv-1
progressEditRevision(domain, taskId, entryId, { date?, author?, content, refs? }, nowIso?)
// Promise<ProgressEntry>，追加rv-N，不覆盖首版entry.date/author
progressSoftDelete(domain, taskId, entryId, nowIso?)
// Promise<ProgressEntry>，deletedAt落盘，全部revisions保留
progressRestore(domain, taskId, entryId)
// Promise<ProgressEntry>，清deletedAt
```

定位行号分别L575/L602/L651/L690/L724/L738；refs必须引用**本任务当前资料区**真实at-N，去重，不能用交付物ID或其他任务at-N。追加/编辑返回实际entry.id/revision.id，不在脚本中硬猜pl-1/rv-3。相同date允许不同entry ID，不按日期合并。重复link/同任务重复deliverable被拒。

现有command形状（`src/commands/material.ts:42-54`、`src/commands/progress.ts:24-32,97-111`）：

```text
/pm material link <实际T> {"url":"https://example.com/qa-spec","title":"按FL生成的200字符","note":"按FL生成的500字符"}
/pm material deliverable <实际T> {"deliverableId":"<实际V1>","note":"关联V1"}
/pm progress add <实际T> {"date":"<D-2>","author":"测试甲","content":"E1首版","refs":["<实际at-N>"]}
/pm progress edit <实际T> <实际E1> {"date":"<D-1>","author":"测试乙","content":"E1二版","refs":["<实际at-N>"]}
/pm progress edit <实际T> <实际E1> {"date":"<D>","author":"测试甲","content":"E1三版","refs":["<实际at-N>"]}
/pm progress delete <实际T> <实际E2>
```

示例中的“按FL生成的...”不是长值实物；Main须真实构造并记录trim后长度，不把这段短说明当FL长证。原F3另有E2两版软删、E3同日异ID首版，必须保存而不是只保E1三版。原contract作者测试甲/乙与FL author80分别明确为基线/长值variant，不能把80短化。

注意命令`material/progress`先split空白再join JSON串；JSON字符串内连续字面空白可能被折叠。Main要精确长度时用无首尾/无连续空白的确定文本，或JSON转义保留有意空白，并记录生产返回的实际长度；不要依输入字符串长度冒落盘长度。

## 6. 同项目会议 / 交付物 / OKR / habit 各20

以下仅列现有合法接口与长度；不运行生成、不增加实体类型或新功能。20是每类同项目真实record数，不是20段文字、20个行动项或20条建议。建议/inbox未经confirm不是正式record，不能充数。

| 类别 / 内部API、schema位置 | 文本字段 / max / normalize | add形状与默认 |
| --- | --- | --- |
| 会议：`src/core/meetings.ts:60` `addMeeting(domain,input):Promise<Meeting>`；`src/core/meeting.ts:76` meetingCreateSchema | title trim非空；location/facilitator/recorder/summary/notes为字符串；participants/topics/decisions为非空trim字符串数组，`normalizeTextList` trim/去空/去重。**以上文本/数组项无max、数组无数量max**。行动项title trim非空、owner文本也无max，但actions不在create body。 | body必填projectId/title/meetingDate；startTime有效HH:mm或null默认null，durationMinutes整数1..1440或null默认null；文本默认''、数组默认[]、status draft/final默认draft。系统生成mtg-N/actions=[]/sourceType manual/sourceSessionId null/时间戳。 |
| 交付物：`src/core/deliverables.ts:30` `addDeliverable(domain,input):Promise<Deliverable>`；`src/core/deliverable.ts:57` deliverableCreateSchema | name trim非空；version/owner/location/description/note/operator/changeNote字符串不trim；**这些文本无max**。repoUrl/branch沿共享normalize。不要误用title字段。 | body必填projectId/name；version/owner/location/description/note/operator/changeNote默认''；status planned/in_progress/submitted/accepted/wrapped默认planned；dueDate有效日期或null默认null；milestoneId有效同项目ID或null默认null。系统生成dlv-N、history创建留痕与时间戳；operator/changeNote只生成history，不存独立业务列。 |
| OKR：`src/core/okr.ts:337` `addOkr(domain,projectId,input):Promise<OkrRecord>`；同L39 okrCreateSchema，`src/core/storage.ts:62` okrRecordSchema | title trim非空；description trim；owner不trim，空串不落可选键；cycleDue字符串仅预留。**上述文本无max**；relatedOkrIds trim/去空/去重/存在/同项目/不自指，主父同项目存在。 | projectId为API第二位置参，**不进body**；body必填title/kind（objective/key-result）；primaryOkrId可选nullable默认null，relatedOkrIds默认[]；owner/targetDate/description/status/cycleDue可选；status默认draft，可人指定confirmed。ID随机okr-...、时间戳系统维护。 |
| habit：`src/core/habits.ts:254` `addHabit(domain,projectId,input):Promise<HabitRecord>`；同L38 habitCreateSchema，`src/core/storage.ts:107` habitRecordSchema | title trim非空、goal/notes trim，无max；**frequency trim后≤40**。okrId可选真实同项目目标；空值不落可选键。record里的frequency本身没有max，不能用恢复宽读上限绕过写入口40。 | projectId为API第二位置参，**不进body**；body必填title，可选okrId/goal/frequency/notes；不接受status/checkIns/streak/cycleDue/id/时间戳。系统生成habit-...、draft、checkIns=[]、streak全0。 |

OKR/habit落盘schema是`z.object`，但create是`z.strictObject`，不能以record可读取额外形状代替add合法body。habit不使用description/assignee字段，交付物不使用title；会议日期叫meetingDate，OKR日期叫targetDate。

现有真实command add（语法模板未执行；文本长度由Main按原FL/FD生产校验记录）：

```text
/pm meeting add {"projectId":"<实际A>","title":"FL会议01","meetingDate":"<D>","summary":"会议长正文","notes":"长备注","participants":["测试甲","测试乙"]}
/pm deliverable add {"projectId":"<实际A>","name":"FL交付物01","version":"V1","owner":"测试甲","description":"交付物长说明","location":"https://example.com/qa-dlv-01"}
/pm okr add <实际A> {"title":"FL目标01","kind":"objective","owner":"测试甲","description":"目标长说明","targetDate":"<D+7>"}
/pm habit add <实际A> {"title":"FL习惯01","goal":"习惯长目标","frequency":"每天","notes":"习惯长备注"}
```

入口精确行：`src/commands/meeting.ts:307-318`、`deliverable.ts:109-124`、`okr.ts:143-158`、`habit.ts:129-144`。命令结果是CommandResult的kind/text，不等于领域函数record；Main按真实command结果/正常快照回读登记ID，不能用标题别名替ID。

原总登记没有给这四类每一文本字段的统一240/2000长度：**不要把task title240直接说成四类历史原值**。Main可新认领无max字段的240/2000工程长值，frequency若选40就明确为写入口实际40，而非静默把2000缩成40。若用于F3任务资料冻结，选择的那一条交付物name≤200/version≤120；其他长交付物本体可长于200，关联失败差异应如实交，不能截其原对象。

## 7. 输入指纹、核验与释放

下面是本次读得的核心源码SHA，主包和冻结包相同且匹配Combined输入登记；用于Main复查定位范围，不是运行认证：

| 相对包根 | 字节 | SHA256 |
| --- | ---: | --- |
| package.json | 3160 | 8098dfa788025596ee1e4664969e4ffd4a69dee664950931313ac0d648cd55a9 |
| src/core/project.ts | 3758 | 37d25f439d68639d7ecf279f1c45d58543dffc141adc0b905ec49aca2d706993 |
| src/core/projects.ts | 6356 | ed89fd16c9f0b499ccac7d572acf0583bc873e15a18311ffe8a8a9a712c01453 |
| src/core/task.ts | 13669 | ad71b6d1b26e386e297c8f3c6a555252772c5247ab94b3ceec89c787eb21646b |
| src/core/tasks.ts | 33404 | b1282115dc204d61241477d67a16a05496b364a688f1223eb773765454461b29 |
| src/core/backup.ts | 26049 | a4c302bd7646478deb56a61070b4a50262c1b220805f2013a036c2d5b0870295 |
| src/core/storage.ts | 8840 | 79018f0bf6fc4d957e018304a184dd02b7b79a4bf0c987f34332939cc1c1fd5e |
| src/core/task-materials.ts | 32638 | 6188f2bf92910c39ca9933dbdc91af00c597564838a712bd9f3c342ca63289f2 |
| src/core/people-load.ts | 8915 | 758bbddf2c4e49bbdc9923542ce614fae226b19db10a7b8e378562911971cdd2 |
| src/core/load-stance.ts | 8270 | ea3fd0aae076621dca045c64e784bf0c02b11ff87437dd210f853861ad58131c |
| src/client/views/people-scale.ts | 967 | 5a45ec6d2e24cb7d054ee7d25c70b4a22afd32e9e195660efec938223b8670d6 |
| src/client/views/people.tsx | 26112 | e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6 |
| src/client/board/widgets.tsx | 40248 | 0b4b2a6b85432a705e2f2e39cc97660f8df450cb82ec1abb8776e4c6301ce95a |

33文件集合除上表外还包含：`src/core/status.ts,evidence.ts,repo.ts,meeting.ts,meetings.ts,deliverable.ts,deliverables.ts,okr.ts,habits.ts,settings.ts,derived.ts`；`src/commands/project.ts,task.ts,meeting.ts,deliverable.ts,okr.ts,habit.ts,material.ts,progress.ts,backup.ts`。这些相对路径中逗号后文件均沿各自目录展开。

- 环境：macOS；只读字节/JSON/SHA核验用既有 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`（v22.23.3）内置fs/crypto，不import生产模块，不加载schema，不用pnpm，不新建reader脚本。
- 初始rg不可用（exit127），改窄grep/sed/find；ctx-cli首次错误使用read子命令（exit2）后改cat只读记忆，记忆不替仓库事实。目标文件新增前test-e exit1，表示不存在，没有覆盖旧文件。
- 入场时误调用一次**只读 `git status --short`（exit0）**，非本单要求，明确记录此流程偏差；没有git写操作，之后不再运行git，也未fetch/pull/install/build/测试/产品/helper/worker/bundle/GUI/桌面/网络/服务操作。
- 未读取runtime/private/profile/正式数据或正式根；冻结src按本单点名范围读取。未重复搜索缺失F1原包，未读取旧worker/helper/tests正文，未创建新fixture或生产数据。
- 字节比对与正确包相对键的登记复核均exit0，结论仅“指定33输入相符”。首次用仓库相对键查询登记显示null，已更正为包相对键并复核33/33，不把null误当未登记或缺包。
- 本文件是唯一人工写入，落盘后读回，并核所引本地模块/行号与Markdown路径；没有完整回归，因为本单明确禁止运行测试/构建。schema/实际生成/预检/恢复/GUI均**本角色未执行**，不能称PASS。
- Main按原父授权继续其他不重叠工作；接收本单后由Main认领新F1R3/FL/FD真实准备及原证，再交独立专家判断。本单不暂停父目标、不缩成GG/smallMAX、不签父ordinarycommit、不授予push/release。
- **读回完成即STOP / released**；不续派、不实施、不追加文件。
