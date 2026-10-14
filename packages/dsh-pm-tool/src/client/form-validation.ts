/**
 * R3-UX-001：项目 / 里程碑表单的「受控内联校验」纯函数。
 *
 * 设计约束（见 ADL-046）：
 * - 本模块**不依赖 React / DOM**，可在 Node 下直接 import 做行为测试；
 *   panel.tsx 在浏览器表单里调用它，scripts/verify-form-validation.mjs 在 Node 里断言它。
 * - 文案与服务端 zod（core/project.ts、core/milestone.ts）保持一致，避免前后端两套提示。
 * - 只负责「必填 / 真实日历日期 / 起止先后」三类可在前端即时定位的错误；
 *   重名、删除保护、服务端 run 失败等仍由命令层返回，经全局 Notice 展示，不在此掩盖。
 */

/** 项目表单需要即时校验的字段。 */
export interface ProjectFormValues {
  name: string
  startDate: string
  targetDate: string
  repoUrl?: string
  branch?: string
}

// 与服务端 core/project.ts / core/repo.ts 保持一致的宽松正则（离线、不联网探测）。
// project / task / deliverable 三级共用下方 repoFieldErrors，禁止各抄一份文案/正则，避免前后端漂移。
const repoUrlPattern = /^(https?:\/\/[^\s/$.?#].[^\s]*|git:\/\/[^\s/$.?#].[^\s]*|git@[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+(?:\/[^\s]*))$/
const branchPattern = /^[A-Za-z0-9._][A-Za-z0-9._/-]{0,63}$/

/**
 * 共享「仓库地址 / 分支名」一对可选字段的内联校验（T7 扩到 task / deliverable 两级）。
 * 留空合法（可选字段）；任一填写即按宽松 git/URL 白名单校验。中文文案与服务端
 * core/repo.ts validateRepoRelation 逐字一致，三级复用、不得改写。
 * 通过返回 `{}`。键固定为 'repoUrl' / 'branch'，便于 <input name> 与 aria-describedby 关联。
 */
export function repoFieldErrors(repoUrl: string | undefined, branch: string | undefined): FormFieldErrors {
  const errors: FormFieldErrors = {}
  const url = (repoUrl ?? '').trim()
  if (url && !repoUrlPattern.test(url)) {
    errors.repoUrl = '仓库地址需为 http(s)://、git:// 或 git@host:org/repo.git 形式'
  }
  const br = (branch ?? '').trim()
  if (br && !branchPattern.test(br)) {
    errors.branch = '分支名需 ≤64 字符、不含空白与特殊符号（如 main、feature/x-1）'
  }
  return errors
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
