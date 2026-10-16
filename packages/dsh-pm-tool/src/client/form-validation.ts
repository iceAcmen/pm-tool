/**
 * R3-UX-001：项目 / 里程碑表单的「受控内联校验」纯函数。
 *
 * 设计约束（见 ADL-046 / S3）：
 * - 本模块**不依赖 React / DOM**，可在 Node 下直接 import 做行为测试；
 *   panel.tsx 在浏览器表单里调用它，scripts/verify-form-validation.mjs 在 Node 里断言它。
 * - repoUrl/branch 的正则与中文文案**唯一真源在 core/repo-format.js**（零依赖纯模块）；
 *   本文件只做委托，禁止再抄第二份正则/文案（S3-A1 静态断言守此红线）。
 * - 只负责「必填 / 真实日历日期 / 起止先后」三类可在前端即时定位的错误；
 *   重名、删除保护、服务端 run 失败等仍由命令层返回，经全局 Notice 展示，不在此掩盖。
 */
import { repoFieldErrorsPure } from '../core/repo-format.js'

/** 项目表单需要即时校验的字段。 */
export interface ProjectFormValues {
  name: string
  startDate: string
  targetDate: string
  repoUrl?: string
  branch?: string
}

/**
 * 共享「仓库地址 / 分支名」一对可选字段的内联校验（T7 扩到 task / deliverable 两级）。
 * 留空合法（可选字段）；任一填写即按宽松 git/URL 白名单校验。中文文案与服务端
 * core/repo.ts validateRepoRelation 逐字一致（同一真源 core/repo-format.js），三级复用。
 * 通过返回 `{}`。键固定为 'repoUrl' / 'branch'，便于 <input name> 与 aria-describedby 关联。
 */
export function repoFieldErrors(repoUrl: string | undefined, branch: string | undefined): FormFieldErrors {
  return repoFieldErrorsPure(repoUrl, branch)
}

/**
 * T7/S3：拼装「更新」时的 repoUrl/branch 落盘字段。
 * **始终带上 trim 后的值（可为空串 ''）**——core `...current, ...fields` 合并后由
 * `omitEmptyRepoKeys` 把空串删键；若这里 omit（undefined），core 会回退成 current 旧值，
 * 导致「表单清空却没删掉旧仓库」。填写时原值往返，清空时显式传空串。
 */
export function repoFieldsForUpdate(repoUrl: string | undefined, branch: string | undefined): { repoUrl: string, branch: string } {
  return { repoUrl: (repoUrl ?? '').trim(), branch: (branch ?? '').trim() }
}

/**
 * 拼装「创建」时的 repoUrl/branch 落盘字段：空（trim 后）即省略该键，不写空串。
 * 创建无旧值需要回退，省略即可；与项目创建既有口径一致。
 */
export function repoFieldsForCreate(repoUrl: string | undefined, branch: string | undefined): { repoUrl?: string, branch?: string } {
  const url = (repoUrl ?? '').trim()
  const br = (branch ?? '').trim()
  return {
    ...(url ? { repoUrl: url } : {}),
    ...(br ? { branch: br } : {}),
  }
}

/** 里程碑表单需要即时校验的字段。 */
export interface MilestoneFormValues {
  title: string
  targetDate: string
}

/** 字段名 → 中文错误文案；空对象表示通过。键与 <input name> 对应，便于 aria-describedby 关联。 */
export type FormFieldErrors = Record<string, string>

/**
 * 校验是否为真实存在的 `YYYY-MM-DD`（对齐 zod `z.iso.date`）。
 * 拒绝 `2026-02-30`、`2026-13-01`、`2026-1-5`（未补零）等。空串交给必填规则处理。
 */
export function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (month < 1 || month > 12 || day < 1) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

/**
 * 校验项目表单，返回「字段 → 错误」。通过返回 `{}`。
 * 错误定位到具体字段：名称缺失、开始/目标日期缺失、日期非法、目标早于开始（挂到 targetDate）。
 */
export function validateProjectForm(values: ProjectFormValues): FormFieldErrors {
  const errors: FormFieldErrors = {}
  const name = values.name.trim()
  if (!name) errors.name = '项目名称不能为空'

  const startDate = values.startDate.trim()
  const targetDate = values.targetDate.trim()
  if (!startDate) errors.startDate = '请选择开始日期'
  else if (!isRealIsoDate(startDate)) errors.startDate = '日期须为有效的 YYYY-MM-DD'
  if (!targetDate) errors.targetDate = '请选择目标日期'
  else if (!isRealIsoDate(targetDate)) errors.targetDate = '日期须为有效的 YYYY-MM-DD'

  // 起止先后：两端都合法时才比较，对齐服务端 validateDateOrder。
  if (startDate && targetDate && isRealIsoDate(startDate) && isRealIsoDate(targetDate)
    && targetDate < startDate) {
    errors.targetDate = '完成日期不得早于开始日期'
  }

  // 仓库地址/分支：留空合法（可选字段），填写即须符合宽松 git/URL 格式（三级共享口径）。
  Object.assign(errors, repoFieldErrors(values.repoUrl, values.branch))
  return errors
}

/**
 * 校验里程碑表单，返回「字段 → 错误」。通过返回 `{}`。
 */
export function validateMilestoneForm(values: MilestoneFormValues): FormFieldErrors {
  const errors: FormFieldErrors = {}
  if (!values.title.trim()) errors.title = '里程碑标题不能为空'
  const targetDate = values.targetDate.trim()
  if (!targetDate) errors.targetDate = '请选择目标日期'
  else if (!isRealIsoDate(targetDate)) errors.targetDate = '日期须为有效的 YYYY-MM-DD'
  return errors
}

/** 宽松 http(s) 链接谓词（证据链接等可选字段；留空合法，填写即须 http/https）。 */
export function isHttpUrl(value: string | undefined): boolean {
  const v = (value ?? '').trim()
  if (v === '') return true
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v)
}

/** 可选数字区间校验：留空合法；填写须为有限数且落在 [min, max]。 */
function optionalNumberInRange(raw: string | undefined, min: number, max: number): boolean {
  const v = (raw ?? '').trim()
  if (v === '') return true
  const n = Number(v)
  return Number.isFinite(n) && n >= min && n <= max
}

// ---------- 任务 ----------

/** 任务表单需要即时校验的字段（其余描述/选择项由服务端兜底）。 */
export interface TaskFormValues {
  title: string
  startDate?: string
  dueDate?: string
  progress?: string
  effortHours?: string
  evidenceUrl?: string
  manualProgress?: string
  repoUrl?: string
  branch?: string
}

/**
 * 校验任务表单：标题必填；起止日期选填但须为真实日历日，截止不得早于开始；
 * 完成进度 / 实际工时 / 人工进度区间；证据链接 http(s)；仓库走三级共享口径。
 */
export function validateTaskForm(values: TaskFormValues): FormFieldErrors {
  const errors: FormFieldErrors = {}
  if (!values.title.trim()) errors.title = '任务名称不能为空'

  const startDate = (values.startDate ?? '').trim()
  const dueDate = (values.dueDate ?? '').trim()
  if (startDate && !isRealIsoDate(startDate)) errors.startDate = '开始日期须为有效的 YYYY-MM-DD'
  if (dueDate) {
    if (!isRealIsoDate(dueDate)) {
      errors.dueDate = '截止日期须为有效的 YYYY-MM-DD'
    } else if (startDate && isRealIsoDate(startDate) && dueDate < startDate) {
      errors.dueDate = '截止日期不得早于开始日期'
    }
  }
  if (!optionalNumberInRange(values.progress, 0, 100)) errors.progress = '完成进度需为 0-100 的数字'
  if (!optionalNumberInRange(values.effortHours, 0, Number.MAX_SAFE_INTEGER)) {
    errors.effortHours = '实际工时需为不小于 0 的数字'
  }
  if (!isHttpUrl(values.evidenceUrl)) errors.evidenceUrl = '证据链接需为 http(s):// 形式'
  if (!optionalNumberInRange(values.manualProgress, 0, 100)) {
    errors.manualProgress = '人工设定进度需为 0-100 的数字'
  }
  Object.assign(errors, repoFieldErrors(values.repoUrl, values.branch))
  return errors
}

// ---------- 风险 / 问题 ----------

/** 风险 / 问题表单需要即时校验的字段。 */
export interface RiskIssueFormValues {
  title: string
  dueDate?: string
}

/** 标题必填；截止日期选填但须为真实日历日。 */
export function validateRiskIssueForm(values: RiskIssueFormValues): FormFieldErrors {
  const errors: FormFieldErrors = {}
  if (!values.title.trim()) errors.title = '标题不能为空'
  const dueDate = (values.dueDate ?? '').trim()
  if (dueDate && !isRealIsoDate(dueDate)) errors.dueDate = '截止日期须为有效的 YYYY-MM-DD'
  return errors
}

// ---------- 会议 ----------

/** 会议表单需要即时校验的字段。 */
export interface MeetingFormValues {
  title: string
  meetingDate: string
  durationMinutes?: string
}

/** 标题 / 会议日期必填；时长选填，须为 1-1440 的整数分钟。 */
export function validateMeetingForm(values: MeetingFormValues): FormFieldErrors {
  const errors: FormFieldErrors = {}
  if (!values.title.trim()) errors.title = '会议标题不能为空'
  const meetingDate = values.meetingDate.trim()
  if (!meetingDate) errors.meetingDate = '请选择会议日期'
  else if (!isRealIsoDate(meetingDate)) errors.meetingDate = '会议日期须为有效的 YYYY-MM-DD'
  const duration = (values.durationMinutes ?? '').trim()
  if (duration !== '') {
    const n = Number(duration)
    if (!Number.isInteger(n) || n < 1 || n > 1440) errors.durationMinutes = '时长需为 1-1440 的整数分钟'
  }
  return errors
}

// ---------- 进度汇报（创建快照） ----------

/** 汇报创建表单需要即时校验的字段（编辑态周期已固定、禁用，不走此校验）。 */
export interface ReportFormValues {
  periodStart: string
  periodEnd: string
}

/** 周期起止必填且为真实日历日，结束不得早于开始。 */
export function validateReportForm(values: ReportFormValues): FormFieldErrors {
  const errors: FormFieldErrors = {}
  const periodStart = values.periodStart.trim()
  const periodEnd = values.periodEnd.trim()
  if (!periodStart) errors.periodStart = '请选择周期开始日期'
  else if (!isRealIsoDate(periodStart)) errors.periodStart = '开始日期须为有效的 YYYY-MM-DD'
  if (!periodEnd) errors.periodEnd = '请选择周期结束日期'
  else if (!isRealIsoDate(periodEnd)) errors.periodEnd = '结束日期须为有效的 YYYY-MM-DD'
  if (periodStart && periodEnd && isRealIsoDate(periodStart) && isRealIsoDate(periodEnd)
    && periodEnd < periodStart) {
    errors.periodEnd = '周期结束日期不得早于开始日期'
  }
  return errors
}

// ---------- 交付物 ----------

/** 交付物表单需要即时校验的字段。 */
export interface DeliverableFormValues {
  name: string
  dueDate?: string
  repoUrl?: string
  branch?: string
}

/** 名称必填；计划交付日期选填但须为真实日历日；仓库走三级共享口径。 */
export function validateDeliverableForm(values: DeliverableFormValues): FormFieldErrors {
  const errors: FormFieldErrors = {}
  if (!values.name.trim()) errors.name = '交付物名称不能为空'
  const dueDate = (values.dueDate ?? '').trim()
  if (dueDate && !isRealIsoDate(dueDate)) errors.dueDate = '计划交付日期须为有效的 YYYY-MM-DD'
  Object.assign(errors, repoFieldErrors(values.repoUrl, values.branch))
  return errors
}

/**
 * 按字段展示顺序取第一个出错的字段，供提交失败后把焦点移到该字段。
 * 顺序即用户从上到下填表的顺序；返回 `undefined` 表示无错误。
 */
export function firstInvalidField(order: string[], errors: FormFieldErrors): string | undefined {
  for (const field of order) {
    if (errors[field]) return field
  }
  return undefined
}
