/**
 * assignee 候选补全纯派生（T8 / v0.7.0，PROD-06 复活）。
 *
 * 从 web snapshot 五来源跨项目聚合「负责人候选串」：
 *   project.owner → task.assignee → riskIssue.owner → deliverable.owner → meeting.participants[]
 * （P0 冻结五处；meeting.facilitator/recorder/actions[].owner 为 P1，本批不入池）。
 *
 * 口径冻结见 docs/testing/repo-link-assignee-completion-acceptance.md §0.3：
 * - 归一化分组键**复用** `people-load.ts` 的 `normalizePerson`（trim → 折叠内部连续空白
 *   为单空格 → toLowerCase），本模块不另写第二套归一；展示写法复用 `displayForm`。
 * - 展示名选举规则与 people-load `finalizeDisplay` 一致：组内出现次数最多的原始写法，
 *   并列取首见。
 * - 多负责人串不切分（`张三,李四` 整体一个候选，同 MULTI_OWNER_RE 打标不拆分口径）。
 * - 归一后为空（纯空白/null/undefined/未填）的来源一律剔除，不入候选。
 * - 纯内存、零写盘、零 schema、不读 settings；同一函数可在浏览器端 / 离线 verify 复算。
 */

import { displayForm, normalizePerson } from './people-load.js'

/**
 * 五来源 snapshot 切片（结构类型，按列取所需字段，兼容 web snapshot 全量记录形状）。
 * 各来源缺省/空数组均安全跳过，不抛异常。
 */
export interface PersonCandidatesInput {
  projects?: ReadonlyArray<{ owner?: unknown }> | undefined
  tasks?: ReadonlyArray<{ assignee?: unknown }> | undefined
  riskIssues?: ReadonlyArray<{ owner?: unknown }> | undefined
  deliverables?: ReadonlyArray<{ owner?: unknown }> | undefined
  meetings?: ReadonlyArray<{ participants?: ReadonlyArray<unknown> }> | undefined
}

interface CandidateGroup {
  /** 归一化分组键（normalizePerson 输出）。 */
  key: string
  /** 展示写法计数（保留大小写）；value = 出现次数。 */
  displayCounts: Map<string, number>
  /** 组内首见展示写法（并列时的胜出口径）。 */
  firstDisplay: string
}

/**
 * 聚合 assignee 候选，返回**有序候选展示串列表**。
 *
 * 输出次序（冻结）：**组首见序**——按上方固定扫描序（projects → tasks → riskIssues
 * → deliverables → meetings.participants 数组序）逐来源收集，新组首次出现时追加在尾。
 * 不按频次/字典序重排：snapshot 固定扫描序下即确定性输出（同输入两次逐字节一致）。
 */
export function listAssigneeCandidates(input: PersonCandidatesInput = {}): string[] {
  const groups = new Map<string, CandidateGroup>()
  /** 组键的首见序（冻结输出次序）。 */
  const order: string[] = []

  const push = (raw: unknown): void => {
    const key = normalizePerson(raw)
    if (!key) return // 空值剔除：归一后为空（纯空白/null/undefined）不入候选
    const display = displayForm(raw)
    let group = groups.get(key)
    if (!group) {
      group = { key, displayCounts: new Map([[display, 1]]), firstDisplay: display }
      groups.set(key, group)
      order.push(key)
    } else {
      group.displayCounts.set(display, (group.displayCounts.get(display) ?? 0) + 1)
    }
  }

  // 固定扫描序（与 snapshot 装配顺序一致）。
  for (const project of input.projects ?? []) push(project?.owner)
  for (const task of input.tasks ?? []) push(task?.assignee)
  for (const riskIssue of input.riskIssues ?? []) push(riskIssue?.owner)
  for (const deliverable of input.deliverables ?? []) push(deliverable?.owner)
  for (const meeting of input.meetings ?? []) {
    for (const participant of meeting?.participants ?? []) push(participant)
  }

  return order.map((key) => {
    const group = groups.get(key)!
    // 展示名选举（people-load.finalizeDisplay 同规则）：频次最高写法；并列取首见。
    let best = group.firstDisplay
    let bestCount = -1
    for (const [form, count] of group.displayCounts) {
      if (count > bestCount) {
        bestCount = count
        best = form
      }
    }
    return best
  })
}
