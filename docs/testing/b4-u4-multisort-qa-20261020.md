# U4 多规则排序（multisort）独立 QA · 2026-10-20

> 独立源码核 + 复跑作者 11 例 + QA 补 8 项，全 PASS；core tsc EXIT0。不信作者全量计数，本轮只复测 targeted；GUI 排序配置/重启持久化归 Main later。

## 定位
- 引擎 `query.ts applySort`（:98）：sorts 非空按规则数组优先级链式比较（首条非零决定，并列落下一条，Array.sort 稳定兜底）；空/缺省回退 legacy 单规则 sort（dualread，旧布局零迁移零重置）。
- 类型 `types.ts SortRule{field,dir}`，`WidgetConfig.sorts?: SortRule[]`（:60），legacy `sort` 保留。
- 编辑器 `editor.tsx` ConfigPanel :626-662：最多 3 条（按钮 `length>=3` disabled，标签 n/3）、白名单下拉、↑↓ 优先级、✕ 移除、追加默认白名单首字段。
- 白名单 `query.ts FIELD_WHITELIST`（:9-17，按实体）；persist parseWidget 原样透传 config（含 sorts），history 整布局快照 bounded 5。

## 独立结果（作者 11 例 QA 复跑 PASS = 8 基础 + 3 P2 实填充/截断）
- 作者 `query.multisort.test.ts` 11 例复跑 PASS（legacy 3 + chain 5：主序/独立方向/三级全并列稳定/sorts 覆盖 legacy/date 空值；P2 3：priority 实际比较破并列、milestoneId 实际 desc、>3 防御截断前 3）。
- QA 补 8 项 PASS：
  - M1 sorts 覆盖 legacy 且不 mutate legacy rule 对象（noreset）；
  - M2 未知/非投影字段不崩溃、并列落回；
  - M3 引擎与 UI 均限条数（见下）；
  - M4 priority/milestoneId **已实填充可排**（非缺口，见更正）；
  - M5 每规则独立方向 status desc+assignee asc；
  - M6 null/空值并列稳定原序；
  - M7 全并列 Array.sort stable 稳定兜底；
  - M8 空 sorts 回退 legacy。

## 口径更正（QA 第二读，推翻上一版两处 P2）
1. **max3 三层闸门，非仅 UI**：UI disabled（editor.tsx:625/648）+ zod save 闸门 `.max(3)`（recordList:71、kpi:76）+ 引擎 `sorts.slice(0,3)`（query.ts:109）。P2 截断作者已测（109-122 例）。
2. **priority/milestoneId 可排，非缺口**：QueryRow 已声明 `priority?:string`/`milestoneId?:string|null`（query.ts:29-30），selectEntity tasks 行实填充（:37），FIELD_WHITELIST.tasks 含两者（:11）；作者 P2 两例实测比较通过。上一版「QueryRow 无列不可排」判断错误，撤销。

## 残留 minor（非阻塞）
- 引擎/zod 不校验 `rule.field ∈ FIELD_WHITELIST`；UI 下拉由白名单驱动（editor.tsx:522/633）用户选不到未知字段，仅手写/导入配置的未知字段会静默并列 tie（无任意表达式/注入风险）。

## 边界
- 前端曾越过 widgets ownership 一次，已协调，本轮不做内容 fail；GUI 排序配置交互、重启后 persist、history 回滚 Main later。
