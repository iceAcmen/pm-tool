# A9 会议既有入口缺陷开发交接

> 给 Main 与独立测试专家使用：仅认领 LG-01/LG-01b 修复、真实组件红绿原证和 panel 透传接口；不是独立 PASS、GUI 或整包放行。2026-10-21，平台 trae，开发角色。

## 1. 授权与执行范围

- 本次原句：“开发角色有界修既有LG-01/LG-01b；父持续授权验完在途及修确证缺陷，最后Main统一commit，不push。”
- 先读 AGENTS、collaboration、A8 报告 §4/5、probes/plan、`docs/plans/2026-10-21-existing-entry-gaps-closure.md`，沿已批准目的/接口执行，不再次索取授权。
- 只改两个组件，新增同范围测试；未改必要但实际无需变更的 `records-props.ts`。报告/runner/原证均为本文件同前缀；没有写 panel、其他业务、testing、livingdocs、vendor、上游。
- 本角色未 fetch/pull/install/build/GUI/服务/凭据/commit/push。没有使用主 lib 或共享缓存跑测试。提交与全量回归仍由 Main 统一执行。
- 基线 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅基线，不代表 dirty 候选。每轮独立复制全 src，保存源码 SHA、tracked diff、原 argv/exit/stdout/stderr；新增测试最终另存全文与 new-file patch。

## 2. 精确文件与最终 SHA256

包前缀均为 `packages/dsh-pm-tool/`：

| 文件 | 操作 | 最终 SHA256 |
| --- | --- | --- |
| `src/client/views/records/records-meeting-form.tsx` | 修改，+141/-43 | `80315b722efe83d0508a407e2cab3496ac175191fa3ca1bf2ce65d6c1aa9edcf` |
| `src/client/views/meetings.tsx` | 修改，+8/-1 | `19a6af2eff6c42a290b9f6102e5a88c0e080703a564b3f30ca89fef3633147c4` |
| `src/client/views/records/records-meeting-entry.test.tsx` | 新增，11 条组件/真实命令用例 | `fea8f4f164d1d1b174f28aa03e6c1f692d2a2abbfa5bc18de4068ad0d436254d` |
| `src/client/shared/records-props.ts` | **未修改** | `e21646bcd0445d00e6aa18120fe43736eabc8ffdf3bdc4812ba0a0504bf5cc1f` |

最终差异见 `a9-meeting-entry-developer-20261021-final-green-r2-tracked.patch`；新增文件见同轮 `-new-test.patch` / `-new-test.tsx`。此轮源冻结 `/private/tmp/pmtool-a9-meeting-3PepkG/src`。旧源码仍保留在 `/private/tmp/pmtool-a9-meeting-20rk2x/src`，原红证不覆盖。

## 3. 实现与写入边界

- 已存会议主保存：先调用原 meeting save，成功后顺序调用必要 action save，全部成功才 `onSaved`；任何 false/throw 不关闭，保输入并显示中文可重试错误。meeting payload **不含 actions**，不改 schema/domain/事务。
- 每条既有行持有 `actionId`，更新字段/行内保存/删除/转任务按稳定 ID，不以 `meeting.actions[idx]` 认领。props 数组重排回归覆盖。
- 两个原生 select 按**被编辑会议 projectId**过滤 task、type=issue。各含空值解除，外来 task/risk/issue 选择不写草稿；已存关联但候选缺失时显示 disabled 的已存 ID 选项，绝不自动置空。最终合法性仍交后端原保护。
- 空新行跳过；填了其他字段却无标题或既有空标题先提示，未发主保存。未存会议仍无 action 入口，按先创建会议、再编辑新增的既有分命令语义。
- 同步 ref 写锁覆盖主保存/行内保存/删除/转任务，防同一事件轮重复提交；busy/disabled 控件禁用，取消不写。保留原行内保存成功关闭行为。
- **已确认成功的新行**：布尔回调不返回真实新 ID；组件记录该行已成功并锁定，保留内容且提示重开后编辑。后续行失败重试时跳过已成功新行，不重复 add。既有行更新可幂等重试。未新增回调、读取命令或跨 action 事务。
- **有限保证**：仅对回调明确返回 true 的新行去重。不声称“后端已写但传输结果未知/抛错”有 exactly-once 保证；此种结果需 Main 按真实回读审证，不扩大原布尔接口承诺。已成功的会议字段/前序 action 不回滚。

## 4. Main 必须透传的接口

`panel.tsx` 当前 `MeetingsView as MeetingTable`（import 约第77行），现有 meeting 分支约第1376行。Main 只在现有 `<MeetingTable>` 增加两个**顶层 props**：

```tsx
<MeetingTable
  meetings={meetings}
  tasks={tasks}
  riskIssues={riskIssues}
  onCreate={() => setDrawer({ kind: 'meeting' })}
  onEdit={meeting => setDrawer({ kind: 'meeting', meeting })}
  records={meetingRecords}
  createRequest={meetingCreateRequest}
/>
```

```ts
tasks?: readonly Pick<Task, 'id' | 'projectId' | 'code' | 'title'>[]
riskIssues?: readonly Pick<RiskIssue, 'id' | 'projectId' | 'type' | 'title'>[]
```

`Task` / `RiskIssue` 来自 `src/client/views/types.ts`，现有完整 snapshot 数组结构兼容，不需转换。允许传完整数组，表单再次按 meeting projectId/type 过滤。`MeetingsRecordsSlot`、`meetingRecords` useMemo、`MeetingCallbacks` 与 `records-props.ts` 不需要改动。MeetingsView 空态/正常 overlay 均透传。**本角色没写 panel；未透传前只有已存 ID 与解除入口，没有真实候选列表，不能称默认接线全部完成。**

## 5. 原命令与逐轮结果

运行环境：macOS，bash，nvm Node `v22.23.3`，pnpm `11.28.5`，实际 React/renderer `18.3.1`、Vitest `2.1.9`。仅只读链接 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，每轮 cacheDir/TMPDIR/XDG_CACHE_HOME 均自有 tmp，`cache:false` + `--no-cache`。

下表每轮实际执行 `node reports/a9-meeting-entry-developer-20261021-run.mjs <轮次>`，前置相同：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
```

| 轮次 | 原 exit | 结果/分类 |
| --- | --- | --- |
| `probe-red` | 1 | A8 原 LG-01/01b 两合同红，其余5条定点排除；未修改 probe |
| `main-red` | 1 | fixture 缺必填 impact，设施/种子错误，**不是产品失败证据**；保留 |
| `main-red-valid` | 1 | 合法 seed，两条既有草稿主保存缺失，1合同红 |
| `main-green` | 0 | 修主保存后1/1 |
| `select-red` | 1 | 1绿/2红，缺关联 select |
| `select-green` | 0 | 3/3 |
| `retry-red` | 1 | 3绿/4红，含原异步抛错未处理；保留原日志 |
| `retry-green` | 0 | 7/7，无未处理异常 |
| `final-green` / `final-green-r2` | 0 / 0 | 11/11，两次；r2 是最终组件字节 |
| `probe-green` / `probe-green-r2` | 0 / 0 | A8 同一未改probe，2/2，其余5条 SKIP，非A8全门 |
| `regression-final` / `regression-final-r2` | 0 / 0 | 5 files / 37 tests，见下 |
| `noemit-final` / `noemit-final-r2` | 0 / 0 | 全复制src TypeScript `--noEmit --incremental false`，无输出 |

另执行 `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` exit0（只读静态）；限定两组件 `git diff --check` exit0。

每轮 `*-execution.json` 的 `argv` 记录**原子进程完整命令**、source/owned SHA、依赖版本、时间、signal、保护前后。Vitest 原命令形式如下（实际路径见对应 JSON，不是主树测试）：

```sh
node /private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run \
  --config /private/tmp/pmtool-a9-meeting-3PepkG/vitest.config.mjs --no-cache \
  src/client/views/records/records-meeting-entry.test.tsx
```

r2 noEmit 原 argv：

```sh
node /private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/typescript/bin/tsc \
  --noEmit --incremental false -p /private/tmp/pmtool-a9-meeting-wShfZb/tsconfig.json
```

37条受影响旧测试：`src/client/shared/records-callbacks.test.ts`、`src/client/views/records/records-payloads.test.ts`、`records-options.test.ts`、`src/client/views/records-entry-guard.test.ts`、`src/client/form-validation.test.ts`。真实会议 handler/领域正向与非法关系在11条新组件测试中执行，业务组件/工厂/handler/领域函数不mock；内存domain与受控传输/DOM环境为设施，不代替真实 JSON 重启验证。

原 probe SHA 始终 `cb37005799132933870da6366c5bf10f3fbfb6355c5c0740a93b5165ac95eb8a`。刻意不执行其“control 主保存不提交 action”旧观察断言，它是缺陷旧行为正向观察而非修后合同；保留原件不更改。

## 6. 保护、技能与剩余门

- 每轮 WATCH：主包 lib、主包 node_modules/.vite/.cache、父依赖 node_modules/.vite/.cache；全部前后字节/mtime 相同。只证明这些根，不声称正式资产/其他缓存全部被扫描。
- 全轮 owned drift=0。`select-green` 时他人 `client/views/tasks-import-confirm.test.tsx` 漂移1，独立冻结照常有效，不改他人文件；最终四轮 r2 全源漂移0。
- brainstorming/writing-plans沿既有批准计划与接口；vendor integrity静态验通过、锁commit `49dd158d1076134a641b33efb035946536778336`；tdd用于真实组件逐接缝红绿，delivery code-review用于本批 diff/标准与 A8 合同作者自查。没有运行setup/install或缺失skill，没让用户选择skill；review未另派审签者，不称独立review/PASS。
- 自查未发现本范围新增明显 domain/schema/命令污染；选择器未做全新UI设计，fieldset沿原表单间距。GUI布局/原生菜单/长内容/焦点/主题仍须实测，不能以renderer证明视觉。
- **NOT_RUN**：build、95/全部 verify、真实宿主与下发 bundle、新实例/开关、真实 JSON 重启、GUI/样式/UX、独立专家新候选审签。本角色禁 build，`verify-meetings.mjs` 依赖 lib 故未用旧 lib 执行；由 Main 唯一builder在最新冻结包完成。
- Main 下一步：写上述 panel 两 props → 重新冻结候选并唯一隔离构建 → 执行R8命令专项与受影响回归 → 严格按 A8 §5 LG-G01/01b/02 采证，包括主保存、清空/重进、取消与失败、稳定新ID只建一次 → 独立专家判定。最后 Main 统一commit，不push；本报告不提前放行。
- 本角色运行进程已退出；自有 tmp 保留原证，不删除。**认领的三个产品/测试文件已释放给 Main，本角色不再写入。**
