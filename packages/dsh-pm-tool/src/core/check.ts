/**
 * K6 交付检查：纯函数规则提示（只读，不下完成裁决）。
 *
 * 能力边界（勿越界）：
 * - 只指出「未回应要求 / 日期 / 材料缺口 / 进度与状态不符」，不替人判定任务是否完成；
 *   「未覆盖 ≠ 未完成」，最终验收由人判断。
 * - 不写库、不自动改状态/进度；today 由调用方注入（零墙钟、可单测）。
 * - 逾期/临期日期口径与 core/reminders.ts / core/derived.ts 同源（字符串日历日比较 + addDaysIso）。
 *
 * 契约见 docs/design/deep-integration-v2-p0-dev.md §三（K6）。
 */
import { addDaysIso, localTodayIso } from './derived.js'
import { isWrappedStatus } from './status.js'
import { taskHasMaterials } from './task-materials.js'
import type { PmDomain } from './storage.js'

/** 检查规则编号（与命令输出 JSON 的 rule 字段一一对应）。 */
export type CheckRule =
  | 'overdue-untouched'        // a 逾期未动
  | 'due-soon-untouched'       // b 临期未动（≤2 天，仍 todo）
  | 'done-open-checklist'      // c 完成却有未完成清单项
  | 'done-missing-materials'   // d 完成但缺交付/证据材料
  | 'progress-100-not-done'   // e 进度 100 但状态非 done

export interface CheckFinding {
  rule: CheckRule
  taskId: string
  title: string
  /** 命中原因（客观陈述，不含裁决）。 */
  reason: string
  /** 建议措辞（提示补什么；明确「最终验收由人判断」）。 */
  suggestion: string
}

/** 纯函数消费的任务最小形状（不依赖 zod 记录，便于离线单测）。 */
export interface CheckableTask {
  id: string
  title: string
  status?: string
  progress?: number | null
  dueDate?: string | null
  evidenceUrl?: string | null
  deliverableId?: string | null
  checklist?: { done: boolean }[] | null
  /** B2：新资料区（link/deliverable），双读口径计入完成材料。 */
  attachments?: unknown[] | null
}

/** 临期窗口（天）：与规格固定 2 天一致，不读项目设置（本命令只做固定提示）。 */
export const DUE_SOON_WINDOW_DAYS = 2

/**
 * 五类规则逐条评估（纯函数，today 注入）。同一任务可命中多条，互不替代。
 * 只读不写；不做完成裁决。
 */
export function evaluateChecks(tasks: CheckableTask[], today: string): CheckFinding[] {
  const findings: CheckFinding[] = []
  const soonLimit = addDaysIso(today, DUE_SOON_WINDOW_DAYS)

  for (const task of tasks) {
    const isDone = task.status === 'done'
    // wrapped 已收尾：done 类规则（c/d）本就不命中；逾期(a)/满进度(e)也不提示，收尾不催办。
    const isWrapped = isWrappedStatus(task.status)

    // a) 逾期未动：dueDate < today 且 status != done、非 wrapped（字面口径；进度 100 的另由 e 提示）。
    if (!isDone && !isWrapped && task.dueDate && task.dueDate < today) {
      findings.push({
        rule: 'overdue-untouched',
        taskId: task.id,
        title: task.title,
        reason: `截止日期 ${task.dueDate} 已早于今天 ${today}，状态仍为 ${task.status ?? '未知'}。`,
        suggestion: '请核对是否已完成并更新状态，或调整截止日期；是否完成由人判断。',
      })
    }

    // b) 临期未动：dueDate 落在 [今天, 今天+2 天] 且 status == todo（已逾期的由 a 覆盖）。
    if (task.status === 'todo' && task.dueDate && task.dueDate >= today && task.dueDate <= soonLimit) {
      findings.push({
        rule: 'due-soon-untouched',
        taskId: task.id,
        title: task.title,
        reason: `截止日期 ${task.dueDate}（${DUE_SOON_WINDOW_DAYS} 天内），状态仍为 todo。`,
        suggestion: '请评估是否启动或调整排期；临期提示不等于逾期违约，最终由人判断。',
      })
    }

    // c) 完成却有未完成清单项：status=done 且清单存在且任一 done=false。
    if (isDone && Array.isArray(task.checklist) && task.checklist.some(item => !item.done)) {
      const open = task.checklist.filter(item => !item.done).length
      findings.push({
        rule: 'done-open-checklist',
        taskId: task.id,
        title: task.title,
        reason: `状态为 done，但清单仍有 ${open} 项未勾选。`,
        suggestion: '请核对未勾选项是否真的完成；清单未覆盖不等于任务未完成，最终验收由人判断。',
      })
    }

    // d) 完成但缺材料：done 且无 evidenceUrl、无清单、无 deliverableId、无新资料项（双读）。
    if (isDone && !taskHasMaterials(task)) {
      findings.push({
        rule: 'done-missing-materials',
        taskId: task.id,
        title: task.title,
        reason: '状态为 done，但未登记证据链接、无客观清单、未关联交付物，资料区也无链接或交付物。',
        suggestion: '缺交付/证据材料（未覆盖≠未完成，最终验收由人判断）；可补 evidenceUrl、清单、关联交付物，或在资料区挂链接/交付物。',
      })
    }

    // e) 进度与状态不符：progress=100 且 status != done、非 wrapped（已收尾不提示口径不符）。
    if (!isDone && !isWrapped && (task.progress ?? 0) === 100) {
      findings.push({
        rule: 'progress-100-not-done',
        taskId: task.id,
        title: task.title,
        reason: `进度为 100%，但状态仍为 ${task.status ?? '未知'}。`,
        suggestion: '请核对是否应标记 done；进度数值不自动等于完成，最终验收由人判断。',
      })
    }
  }

  // 稳定排序：规则编号 → 任务 id，便于测试与输出可复现。
  return findings.sort((a, b) => a.rule.localeCompare(b.rule) || a.taskId.localeCompare(b.taskId))
}

/** 从领域读取任务并评估；projectId 缺省即全部项目。只读。 */
export function collectChecks(
  domain: PmDomain,
  options: { today?: string, projectId?: string, taskId?: string } = {},
): CheckFinding[] {
  const today = options.today ?? localTodayIso()
  const tasks: CheckableTask[] = []
  for (const [, record] of domain.table('tasks').entries()) {
    const t = record as CheckableTask
    if (options.taskId && t.id !== options.taskId) continue
    if (options.projectId && (t as { projectId?: string }).projectId !== options.projectId) continue
    tasks.push(t)
  }
  return evaluateChecks(tasks, today)
}
