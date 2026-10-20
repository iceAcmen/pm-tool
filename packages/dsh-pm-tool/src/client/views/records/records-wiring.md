# B6 records 组件接线说明（前端 owner 挂载，分片不并写 panel）

> 类型与命令对账以 `src/client/shared/records-props.ts` / `records-props.md` 为准。
> 分片只调回调，不拼命令、不 localmock、不写 core。

## 两种挂载方式（等价，任选其一）

### A. 视图内可选 `records` slot（三视图已内置，缺省回退原 onCreate/onEdit）
三视图已加可选 prop，panel 注入即视图内开抽屉式表单，不注入时行为与现状完全一致：

```tsx
<MeetingsView meetings={...} onCreate={...} onEdit={...}
  records={{ projectId, callbacks: meetingCallbacks }} />
<ReportsView reports={...} onCreate={...} onEdit={...}
  records={{ projectId, callbacks: reportCallbacks, previewSource }} />
<Deliverables deliverables={...} milestones={...} tasks={...} onCreate={...} onEdit={...}
  records={{ projectId, callbacks: deliverableCallbacks }} />
```
- 视图内已复用全局 `.pm-drawer-*`，无需自造遮罩；成功 onSaved 后自动关层。
- `records.css` 位于 `src/client/views/records.css`（build 的 `cp views/*.css` 覆盖；子目录 css 不会被拷贝）。

### B. 直接在 panel 抽屉挂表单

出口 `src/client/views/records/index.ts` 统一导出三个表单、`RecordsListbox`、`RecordsOverlay` 与纯逻辑。

#### RecordsMeetingForm
```tsx
<RecordsMeetingForm
  projectId={project.id}
  meeting={drawer.meeting}            // 编辑态传入；新建省略
  callbacks={{
    onSaveMeeting,                     // meeting add / meeting update
    onDeleteMeeting,                   // meeting delete <id> confirm（panel 包确认框）
    onSaveAction,                      // meeting action add / update
    onPromoteAction,                   // meeting action promote <mid> <aid> confirm
    onDeleteAction,                    // meeting action delete <mid> <aid> confirm
    onSaved,
  }}
  disabled={busy}
  onCancel={closeDrawer}
/>
```

### RecordsReportForm
```tsx
<RecordsReportForm
  projectId={project.id}
  report={drawer.report}              // 编辑态周期锁定不可改
  callbacks={{
    onGeneratePeriod,                  // report generate <pid> <start> <end> <json>
    onUpdateReport,                    // report update <id> <json>（不带 source，来源不可改）
    onDeleteReport,                    // report delete <id> confirm
    onExportReport,                    // report export <id>（fire-and-forget）
    onPreviewPeriod,                   // 权威 dry-run（webServer JSON route，零写，返回候选三元组）；缺失回退本地只读预览
    onSaved,
  }}
  disabled={busy}
  onCancel={closeDrawer}
  previewSource={{                     // 本地只读预览原始 revision（非权威、不落盘）
    today, tasks, milestones, meetings, riskIssues,
  }}
/>
```

U5 汇报来源：新建可选 `sourceType`（manual 默认 / session），选 session 必填 `sourceSessionId`；仅 `onGeneratePeriod` 带（manual→`sourceSessionId=null`），`onUpdateReport` 剥离 source（来源不可改），编辑态只读展示。

### RecordsDeliverableForm
```tsx
<RecordsDeliverableForm
  projectId={project.id}
  deliverable={drawer.deliverable}
  milestones={milestones}             // U5 同项目里程碑；空 = 不关联/解除
  callbacks={{
    onSaveDeliverable,                // deliverable add / update（status+changeNote 写留痕；milestoneId/note 同 payload）
    onViewStatusHistory,              // 只读 history 展开
    onDeleteDeliverable,              // deliverable delete <id> confirm（不删本地文件）
    onSaved,
  }}
  disabled={busy}
  onCancel={closeDrawer}
/>
```
U5：`milestoneId` 空串归一 `null`（解除关联，须同项目）；`note` 非空才带、空省略，区别于 description。

## 权威预览与冻结（data verify 8 cases PASS；shared/records-props 已并入）

命令：`/pm report preview <project> <start> <end>` → `{candidates:[{taskId,entryId,revisionId?,author,date,content,refs}]}`，零写；不传 selector = 周期内全部未删条目。

### 已在 `shared/records-props.ts`（front 唯写）
```ts
export interface ReportPreviewRef { taskId: string; entryId: string; revisionId?: string }
export interface ReportPreviewCandidate {
  taskId: string; entryId: string; revisionId?: string
  author: string; date: string; content: string; refs: ReportPreviewRef[]; taskTitle?: string
}
onPreviewPeriod?: (projectId, periodStart, periodEnd) => Promise<ReportPreviewCandidate[]>
onGeneratePeriod: (projectId, periodStart, periodEnd, payload: ReportPayload,
  selectedRefs: ReportPreviewRef[]) => Promise<boolean>
```

### generate 精确冻结（panel 接线）
- selectedRefs 作为 `onGeneratePeriod` 的独立第 5 参数原样透传（不塞进 ReportPayload）；后端按 taskId+entryId+revisionId 复核真实存在且为当前修订，stale/伪造即零写，回“源已更新，请重新预览”。
- 不同 task 各自的 pl-1 可同时多选（复合 key 区分），不做全局重复拦截；每报告 50 上限前端先拦。
- 后端自核 content/author/date 真实，前端不自写 summary 冒 source；stale 由后端判定，UI 不做本地 seen/latest 冲突。
- update：不传 `excerpts` = 保留旧冻结摘录；传 = 整组替换；周期/snapshot/snapshotAt 不可改。
- 失败不关层、保留输入与勾选；重预览保勾选策略（首次全选，后续只留仍存在项，不自动勾新）。
- 编辑态已存摘录只读展示（P2 旧快照保护）；不实现 report revisions/restore。

### onPreviewPeriod 实现提示（给 panel owner，只读结论，分片不改 core/command）
- 决定：B6 preview 走 B 侧 webServer JSON route（与 B3 上传同机制），`onPreviewPeriod` 由前端 fetch 该 route 拿结构化 `ReportPreviewCandidate[]`；**不**在 client 重复算法，**不**解析 CLI `report preview` 纯文本（CLI 返回 `kind:'success',text`，每行 `taskId/entryId/revisionId｜date｜author｜content`，非 JSON 数组）。
- 表单侧无需改动：`onPreviewPeriod(projectId,start,end) => Promise<ReportPreviewCandidate[]>` 已就绪，只消费返回数组；route 已由 data 提供，panel 前端 fetch 该 JSON route 完成 integration（分片不重复算法、不解析 CLI 纯文本）。
- generate：`onGeneratePeriod(projectId,start,end,ReportPayload,selectedRefs)`，selectedRefs 独立第 5 参数；由 panel 并入 generate JSON options（与 excerpts 互斥）。stale/伪造后端零写回错，表单保留输入不关层。




