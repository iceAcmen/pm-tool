# P2-6 r9 磁盘与网络取证（2026-10-18，实例 3172 / PID 10819）

> 说明：旧轮（00:3x–00:48）BLOCKED 报告基于旧隔离实例旧数据根，其 mtime 口径已作废；本文件为 r9（实例 03:35 重启后）实测磁盘与网络证据。

## 1. 数据根定位（进程级证据，写入前核验）

- 进程：`PID 10819`，`cwd=/Users/bytedance/Projects/dsh-pm/deepseek-harness`。
- profile 补丁 `~/.dsh/profiles/pm/cordis.patch.yml` 第 3–5 行：`storage-json` 的 `root=/Users/bytedance/Projects/dsh-pm/pm-tool/data`，故实际读写根 = `/Users/bytedance/Projects/dsh-pm/pm-tool/data/pmtool/`。
- 一致性：UI「全部任务 22」与磁盘 `tasks/t-0001.json … t-0022.json` 数量一致；03:35 重启后写入前仅 `settings/aiModelMode.json` 被动过，业务记录零变动。
- 归属判定：该根位于产品仓库内、已被 `.gitignore` 忽略的开发/测试数据（非用户业务数据、无用户私有内容）；前几轮测试写入交错落在此根。O2 锚点任务不在此根（`grep O2` 为空，位于其他实例/根），本任务不触碰、不清理任何既有记录。

## 2. provider 真实注册与网络响应（非配置文件推断）

### 2.1 直连方舟最小调用（真实网络）

- `POST https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions`
- model=`deepseek-v4-1-flash-260910`，`thinking.type=disabled`，`max_tokens=16`，消息「只回复两个字：正常」。
- 结果：**HTTP 200**，`choices[0].message.content="正常"`，`usage={prompt_tokens:9, completion_tokens:1, total_tokens:10}`，`finish_reason=stop`；Key 取自 `~/.dsh/.credentials.yaml` 的 `refs.CODING_PLAN_API_KEY`（46 位，不落盘回显）。
- 结论：Key 有效、端点通、模型真实补全。

### 2.2 宿主 UI 侧真实调用（生产 Key 车道）

- 副驾 ask 在「生产 Key」车道真实返回可执行计划，无 NO_ADAPTER / 错误气泡（`shots/01-ask-diag.png`、`02-ask-draft.png`），证明宿主 ark-plan 适配器已注册且路由成功。
- 设计事实：ask-apply `ALLOWED_OPS`（core/copilot.ts）仅含 task.update、milestone/risk/deliverable/meeting 的 create/update，**不含 task.create**；模型提议的「新建任务」步被校验器剔除属预期，本轮真实入库仅 1 条交付物 + 1 条 ask-apply 台账条目。

## 3. 确认入库后磁盘记录（03:58 CST = 19:58:21Z）

### 3.1 交付物 `deliverables/dlv-0001.json`（完整摘录）

```json
{
  "version": 2,
  "record": {
    "id": "dlv-0001",
    "projectId": "p-0001",
    "name": "P2-6 复测：AI 溯源验证报告",
    "version": "",
    "owner": "",
    "status": "planned",
    "location": "",
    "description": "",
    "dueDate": "2026-10-25",
    "history": [
      {
        "at": "2026-10-17T19:58:21.696Z",
        "field": "created",
        "from": "",
        "to": "planned",
        "by": "",
        "note": "创建交付物"
      }
    ],
    "createdAt": "2026-10-17T19:58:21.696Z",
    "updatedAt": "2026-10-17T19:58:21.696Z"
  }
}
```

- 落盘路径：`/Users/bytedance/Projects/dsh-pm/pm-tool/data/pmtool/deliverables/dlv-0001.json`
- 归属：测试归属记录（前缀「P2-6 复测：」），按协调方要求保留不清，供溯源持久引用。

### 3.2 溯源台账 `settings/pmProvenanceLedger.json`（entry 逐字段摘录）

```json
{
  "id": "prv-mvctk2dq-8ws70u",
  "projectId": "p-0001",
  "kind": "ask-apply",
  "createdAt": "2026-10-17T19:58:21.710Z",
  "status": "confirmed",
  "schemaVersion": 1,
  "confidence": "未提供",
  "summary": "已应用 1 条 AI 建议",
  "refs": [],
  "history": [
    { "at": "2026-10-17T20:02:00.937Z", "conclusion": "consistent", "snapshotVersion": 1, "ruleRevision": 1, "rows": [] }
  ],
  "undo": {
    "handle": "undo-mvctk2dq-4l9kcp",
    "expiresAt": 1792267701710,
    "used": false,
    "postimages": [
      {
        "table": "deliverables",
        "id": "dlv-0001",
        "kind": "create",
        "postimage": {
          "exists": true,
          "updatedAt": "2026-10-17T19:58:21.696Z",
          "basisFingerprint": "816fa12bc67a0a30",
          "fullFingerprint": "0d0be82acc215890",
          "fields": { "name": "P2-6 复测：AI 溯源验证报告", "status": "planned", "owner": "", "dueDate": "2026-10-25" }
        }
      }
    ]
  },
  "audit": [
    { "at": "2026-10-17T19:58:21.710Z", "kind": "applied", "object": "ask-apply", "result": "业务已落库，溯源已登记" }
  ]
}
```

字段说明：
- `kind=ask-apply`（副驾 AI 建议确认应用）；`status=confirmed`；`confidence=未提供`（不按来源数量评分，设计内）。
- `refs=[]`：本条为「新建交付物」动作，无被引依据记录，故无 basis/context 引用（设计内，非缺失）。
- `undo.handle=undo-mvctk2dq-4l9kcp`，`used=false`，TTL 10 分钟；按协调方要求**不执行撤销**（撤销 create 会删除 dlv-0001 并破坏持久溯源证据）；F09「撤销」步由离线 L2（F04）覆盖，本轮不实做。
- `history[0]`：04:02 CST 真实「立即重校」追加，`conclusion=consistent`，snapshot/rule 版本 1，rows=[]（无失效来源）。

## 4. 警告条（F06）触发条件实测结论

- 触发条件（provenance-view / provenance-panel）：已确认条目存在 basis 引用记录，且被引记录被删除（missing）/口径变更（changed）/移出本项目（cross-project）后，行置灰 + 「需重新生成 / 需人工复核」警告条。
- 本条 `refs=[]`（纯新建、无依据记录），无对象可失效，故重校结果「共 1 条 · 一致 1 · 待处理 0」，**不出现警告条属设计内正确表现**（非漏测）；截图 `06-recheck.png`。

## 5. UI ↔ 磁盘一致性

- UI 交付物视图「待开始 1 项：P2-6 复测：AI 溯源验证报告，交付 10-25」（`04-deliverable-list.png`）= 磁盘 `dlv-0001` 字段。
- AI 助手抽屉「AI 溯源台账」条目：AI 询问应用 · 与来源一致 · 已应用 1 条 AI 建议 · 置信度未提供 · 记录号 prv-mvctk2dq-8ws70u · 来源 0 条（`05-provenance-ledger.png`、`06-recheck.png`）= 磁盘台账 entry。
