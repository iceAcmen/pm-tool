# 磁盘基线快照（本任务动作前，2026-10-18 00:33 采样）

> 本隔离实例被多个并行任务共享。本任务（P2-6 复测）自身动作零业务写入；
> 本任务结束后（00:49）观察到另一并行任务手工新增 `tasks/t-0001.json`（「O2 链接补证任务」），
> 非本任务所写，本任务未改动、未删除它。下方为 00:33 本任务开始时的基线。

## 目录与计数（00:33 基线）
- tasks/: 5 条（t-g3-1..t-g3-5）
- deliverables/: 1 条（dlv-0001）
- ledger entries: []（updatedAt 2026-10-17T15:04:04.535Z，本任务全程未变）

## 既有任务样例 t-g3-1（未改动）
{
  "version": 2,
  "record": {
    "id": "t-g3-1",
    "projectId": "p-g3",
    "parentId": null,
    "code": "1",
    "order": 1,
    "title": "需求梳理",
    "description": "",
    "assignee": "史冰冰",
    "status": "done",
    "priority": "P0",
    "progress": 100,
    "startDate": "2026-10-01",
    "dueDate": "2026-10-08",
    "milestoneId": null,
    "predecessorIds": [],
    "createdAt": "2026-10-01T00:00:00.000Z",
    "updatedAt": "2026-10-01T00:00:00.000Z"
  }
}

## 既有交付物 dlv-0001（未改动）
{
  "version": 2,
  "record": {
    "id": "dlv-0001",
    "projectId": "p-g3",
    "name": "123",
    "version": "",
    "owner": "",
    "status": "planned",
    "location": "",
    "description": "",
    "dueDate": "2026-10-17",
    "history": [
      {
        "at": "2026-10-17T14:42:25.562Z",
        "field": "created",
        "from": "",
        "to": "planned",
        "by": "",
        "note": "创建交付物"
      }
    ],
    "createdAt": "2026-10-17T14:42:25.562Z",
    "updatedAt": "2026-10-17T14:42:25.562Z"
  }
}

## aiModelMode（复测中切车道仅改此设置项，非业务记录；末次落盘 prod）
{
  "version": 2,
  "record": {
    "value": "prod",
    "updatedAt": "2026-10-17T16:45:50.126Z"
  }
}

## 溯源台账（空）
{
  "version": 2,
  "record": {
    "value": {
      "entries": []
    },
    "updatedAt": "2026-10-17T15:04:04.535Z"
  }
}
