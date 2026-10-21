/**
 * B7 growth 表单 props 契约（供 front owner 接入既有 panel 抽屉）。
 *
 * 边界（不重造、不越权）：
 * - okr/habit 的真实 CRUD / checkin / confirm / ignore 已由命令通道实现（panel 持有），
 *   本模块只交付「受控表单」可注入的 props 类型 + 编辑预填纯函数，不复制抽屉 UI、不调用 run()。
 * - 组件本身不得直接发命令；提交值经 onSubmit 交回 panel，由 panel 走既有
 *   `okr add|update` / `habit add|update` 通道；AI copilot 白名单不含 okr/habit 写，
 *   本模块不新增任何 AI 写操作。
 * - 校验复用 ../form-validation.js 的 validateOkrForm / validateHabitForm（只读引用，不改）。
 */
import type { OkrFormValues, HabitFormValues, FormFieldErrors } from '../form-validation.js'
import type { OkrViewRecord } from './okr-model.js'
import type { HabitViewRecord } from './habits.js'
import type { RecordOption } from './records/records-options.js'

// ---------- 编辑预填（纯函数，不修改入参、不泄漏 id/projectId/status 通道字段） ----------

/**
 * 既有 OKR 记录 → 表单初始值。relatedOkrIds 数组拼成逗号串；
 * 旧记录缺 owner/targetDate/description 时留空/undefined，编辑留空合法。
 */
export function prefillOkrForm(record: OkrViewRecord): OkrFormValues {
  return {
    title: record.title,
    kind: record.kind,
    owner: record.owner,
    targetDate: record.targetDate,
    primaryOkrId: record.primaryOkrId ?? '',
    relatedOkrIds: record.relatedOkrIds.join(','),
    status: record.status,
    description: record.description,
  }
}

/**
 * 既有习惯记录 → 表单初始值。只映射可编辑文本字段；
 * status（draft/confirmed/final）由确认/定稿通道决定，checkIns/streak 是档案，均不进表单。
 */
export function prefillHabitForm(record: HabitViewRecord): HabitFormValues {
  return {
    title: record.title,
    goal: record.goal,
    frequency: record.frequency,
    notes: record.notes,
    okrId: record.okrId,
  }
}

// ---------- 受控表单组件 props（front owner 实现时消费；本模块不渲染） ----------

/** 通用受控表单外壳 props：busy/错误/取消保输入由组件自管，提交交回父级。 */
export interface GrowthFormShellProps {
  /** 提交进行中（命令未回）：禁用提交钮、不清空已填。 */
  busy?: boolean
  /** 只读/禁用（权限不足或旧档）：不置灰可编辑后又清空。 */
  disabled?: boolean
  /** 字段级错误（来自 validate*Form），组件就近展示。 */
  errors?: FormFieldErrors
  /** 取消：保留当前输入，仅关闭抽屉，不写盘。 */
  onCancel: () => void
}

/** OKR 受控表单 props（front owner 接入 panel 抽屉）。 */
export interface OkrFormComponentProps extends GrowthFormShellProps {
  initial: OkrFormValues
  /** 本项目既有 objective ID 集合，供 validateOkrForm 主归属校验；缺失时不校验。 */
  objectiveIds?: ReadonlySet<string>
  /** 负责人应用内 listbox 选项（成员名册由 panel 注入）；缺失退回文本输入。 */
  ownerOptions?: readonly RecordOption[]
  /** KR 父目标（主归属）listbox 选项；缺失退回文本/空。仅列 objective（KR 不能作父）。 */
  primaryOptions?: readonly RecordOption[]
  /** 软关联 listbox 选项：本项目全量 OKR（objective + key-result，后端不限 kind）；缺失退回文本 ID 输入。 */
  relatedOptions?: readonly RecordOption[]
  /** 状态 listbox 选项（draft/confirmed）；缺失用内置默认。 */
  statusOptions?: readonly RecordOption[]
  /** 提交值（已通过 validateOkrForm）交回 panel，由 panel 发 `okr add|update`。 */
  onSubmit: (values: OkrFormValues) => void | Promise<void>
}

/** 习惯受控表单 props（front owner 接入 panel 抽屉）。 */
export interface HabitFormComponentProps extends GrowthFormShellProps {
  initial: HabitFormValues
  /** 关联 OKR listbox 选项；缺失退回文本 ID 输入（存在性由后端校验）。 */
  okrOptions?: readonly RecordOption[]
  /** 提交值（已通过 validateHabitForm）交回 panel，由 panel 发 `habit add|update`。 */
  onSubmit: (values: HabitFormValues) => void | Promise<void>
}
