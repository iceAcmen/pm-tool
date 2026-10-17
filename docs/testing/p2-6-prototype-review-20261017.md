# P2-6 scratch 纯函数原型 · 独立挑战审查（2026-10-17，v3 复验，11/11）

> 性质：**仅原型审查，不是 P2-6 正式 PASS、不是实现验收**。对象：开发 scratch 原型 `provenance.mjs / provenance.test.mjs / README.md`（非仓库、非候选产品）。独立测试只读引用、未改原型；自写探针 `p26-probe.mjs`（v1）、`p26-probe-v2.mjs`（v2）构造反例。正式放行后须按真实 `PmDomain`/zod 迁入并由独立测试复验。

## 1. 独立复跑（v2 最新原型）

- `node --test provenance.test.mjs` → `# tests 11 / # pass 11 / # fail 0`（node v22，零依赖），与开发声明一致，未采信生产者判定。
- 独立测试另用 v2 探针构造反例（非 basis 未 bump、仅时间戳变、原样、basis 改、typed 非 tasks 上下文、跨项目、错表、history 三连、缺失 postimage、create 原样），并单独补验 R-N5c 深克隆/冻结隔离，结果见 §2/§3。

## 2. 复验通过项（原型层成立）

- **N2 已修（全业务指纹，不靠 updatedAt 单一假设）**：clean 双判 = `updatedAt` 一致 **且** `fullFingerprint`（全业务对象，排除 updatedAt/createdAt）一致。探针：非 basis 改动且**未刷 updatedAt** → `refuse`（旧版会误判 clean 覆盖）；仅时间戳变（无业务改动）→ `refuse`；原样 → `clean/restore`。
- **N1 已修**：basis 改（status）→ `refuse` 且 `diffs=['status']` 非空；非 basis 改 → `refuse` 且 `note` 非空（说明"非关键字段/updatedAt 已变更"），不无解释拒绝。
- **N6 已修（typed table + scope）**：context 显式传 `{table,id,projectId?}`，里程碑/会议按自己表取，不错归 tasks；探针：非 tasks 上下文解析为 milestones/meetings；跨项目 → `cross-project` invalid；错表 tasks 取 m1 → 0 refs（不硬编码归并）。
- **N5 已修（不可变 history 链）**：连校 3 次 `history.length=3`、前条不被覆盖、`previous` 链逐环保留（r3.previous===r2、r2.previous===r1）、refs 原样回带；删除→manual-review、改→needs-regen 不升 fresh；输出 refs/rows/history 深克隆+递归冻结（见 §3 R-N5c）。
- **N7 已修**：跨项目单列 `cross-project`，与 missing（删除）区分，均归 manual-review 但留痕原因不同。
- **N8 已修**：`capturePostimage(undefined)` → `exists=false`、指纹 null，不硬编码 true；缺失 postimage → `absent/skip`。
- 仍成立：missing create 不误删（已消失→skip、同 id 重建→refuse）；批量 clean 执行/冲突单列/不整体回滚；used 一次性外部维护。

## 3. 复验与残留（R-N5c 已关闭）

### R-N5c 已修复验（深克隆 + 递归冻结）
- 最新 11 例全过（例 6 即「事后改旧 refs/source/history 不污染已产出，输出深克隆+冻结」反例）。独立补验：旧 history 塞入污染被 `TypeError` 拒绝；连校结果 history 长度正确、ref.label 保持原值；输出 `rows/refs/history/result` 全部 `Object.isFrozen=true`，写冻结输出被拒。`recheckProvenance` 对 refs 先 `structuredClone` 再递归 `Object.freeze`，不与 prev 浅共享。

### 观察（非缺陷，登记口径）
- 来源级 `classifyStale` 仍按 basis 子集 + updatedAt 判 `changed`，未用 fullFingerprint；全业务指纹用于 undo 守卫，不用于来源失效判定。正式实现保持该分工即可。
- N2b 仅时间戳变更（无业务改动）也会 `refuse`，属保守安全取舍，不是缺陷。

## 4. 边界（N3 / F13 不变，不宣称已覆盖）

- **N3**：本层**无写时 CAS**，postimage 仅 undo 时点乐观比对；写时并发仍由正式 `applyCore` baseline updatedAt 守卫承担，不得宣称纯函数已拒并发。
- **F13** 半成功 pending→confirmed 状态机与幂等补记、**F15** 四确认入口挂钩、**F07/F16** UI 降级均为正式实现项，原型未覆盖。
- 本审查不含真实模型生成（L3 MANUAL_PENDING）、不含 GUI；不修改原型与产品。
