/**
 * #21 口径配置化：项目级「口径设置」纯模型（无 I/O、无随机、无墙钟、零写）。
 *
 * 设计原则：
 * - 默认值 100% 等于配置化前的硬编码现值；无设置记录（或字段缺失/非法）时自动回落默认，
 *   派生结果与今天逐值一致（默认等价），老数据零迁移。
 * - 只增加「设置」，不改业务实体既有字段语义；本模块不读盘不写盘，存取由 commands/settings.ts
 *   经 settings 表透明完成。
 * - 全部数值为整数；校验失败的字段回落默认并在 `invalid` 中诚实列出，绝不静默改写后假装合法。
 */

/** 项目口径设置（全部整数；缺省即 DEFAULT_PROJECT_SETTINGS）。 */
export interface ProjectSettings {
  // ---- 健康分：基础 100，逐项扣分、各项封顶，下限 0（core/derived.ts scoreFromInputs）----
  /** 每个逾期任务扣分（原硬编码 3）。 */
  healthOverduePer: number
  /** 每个受阻任务扣分（原硬编码 4）。 */
  healthBlockedPer: number
  /** 每个未闭环高影响风险扣分（原硬编码 6）。 */
  healthHighRiskPer: number
  /** 每个未闭环严重风险扣分（原硬编码 10）。 */
  healthCriticalRiskPer: number
  /** 每个逾期里程碑扣分（原硬编码 8）。 */
  healthOverdueMilestonePer: number
  /** 逾期任务扣分封顶（原硬编码 15）。 */
  healthCapOverdueTasks: number
  /** 受阻任务扣分封顶（原硬编码 12）。 */
  healthCapBlockedTasks: number
  /** 未闭环风险扣分封顶（原硬编码 20）。 */
  healthCapOpenRisk: number
  /** 逾期里程碑扣分封顶（原硬编码 16）。 */
  healthCapOverdueMilestones: number
  /** 绿灯分数线：score >= 该值为绿灯（原硬编码 80）。 */
  healthGreenAt: number
  /** 黄灯分数线：score >= 该值为黄灯，否则红灯；须 <= healthGreenAt（原硬编码 60）。 */
  healthYellowAt: number

  // ---- 临期窗口：提醒 / 人员负载临期桶 / 作战室近期议程共用（原硬编码 7）----
  /** 临期/近期窗口天数（原硬编码 7）。 */
  reminderWithinDays: number

  // ---- 人员负载：open 任务数达到即视为过载（原硬编码 5，原 client OVERLOAD_THRESHOLD）----
  /** 过载阈值：open 任务数达到该值即过载（原硬编码 5）。 */
  loadOverloadThreshold: number
}

/** 默认口径：与配置化前硬编码现值逐值相等。 */
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  healthOverduePer: 3,
  healthBlockedPer: 4,
  healthHighRiskPer: 6,
  healthCriticalRiskPer: 10,
  healthOverdueMilestonePer: 8,
  healthCapOverdueTasks: 15,
  healthCapBlockedTasks: 12,
  healthCapOpenRisk: 20,
  healthCapOverdueMilestones: 16,
  healthGreenAt: 80,
  healthYellowAt: 60,
  reminderWithinDays: 7,
  loadOverloadThreshold: 5,
}

/** 单个字段的取值约束（UI 渲染与命令校验共用同一份，避免两处口径漂移）。 */
export interface SettingFieldMeta {
  key: keyof ProjectSettings
  /** 分组标题（UI 分节）。 */
  group: '健康分' | '临期窗口' | '人员负载'
  label: string
  hint: string
  min: number
  max: number
  step: number
  unit: string
}

export const SETTING_FIELDS: SettingFieldMeta[] = [
  { key: 'healthOverduePer', group: '健康分', label: '逾期任务 · 每个扣分', hint: '每个未完成逾期任务从 100 分扣多少', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'healthBlockedPer', group: '健康分', label: '受阻任务 · 每个扣分', hint: '每个受阻（blocked）任务扣多少', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'healthHighRiskPer', group: '健康分', label: '高影响风险 · 每个扣分', hint: '每个未闭环 high 影响风险扣多少', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'healthCriticalRiskPer', group: '健康分', label: '严重风险 · 每个扣分', hint: '每个未闭环 critical 风险扣多少', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'healthOverdueMilestonePer', group: '健康分', label: '逾期里程碑 · 每个扣分', hint: '每个未达成逾期里程碑扣多少', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'healthCapOverdueTasks', group: '健康分', label: '逾期任务扣分封顶', hint: '逾期任务这一项最多扣多少', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'healthCapBlockedTasks', group: '健康分', label: '受阻任务扣分封顶', hint: '受阻任务这一项最多扣多少', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'healthCapOpenRisk', group: '健康分', label: '未闭环风险扣分封顶', hint: '高+严重风险合计最多扣多少', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'healthCapOverdueMilestones', group: '健康分', label: '逾期里程碑扣分封顶', hint: '逾期里程碑这一项最多扣多少', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'healthGreenAt', group: '健康分', label: '绿灯分数线', hint: '得分 ≥ 该值为绿灯（须 ≥ 黄灯线）', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'healthYellowAt', group: '健康分', label: '黄灯分数线', hint: '得分 ≥ 该值为黄灯，否则红灯（须 ≤ 绿灯线）', min: 0, max: 100, step: 1, unit: '分' },
  { key: 'reminderWithinDays', group: '临期窗口', label: '临期窗口天数', hint: '未来 N 天内到期计入临期（提醒/负载/作战室共用）', min: 1, max: 365, step: 1, unit: '天' },
  { key: 'loadOverloadThreshold', group: '人员负载', label: '过载阈值', hint: '单人 open 任务数达到即标为过载', min: 1, max: 100, step: 1, unit: '项' },
]

function isIntInRange(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v >= min && v <= max
}

export interface NormalizeResult {
  settings: ProjectSettings
  /** 被拒绝/回落默认的字段及中文原因（空数组 = 全部合法）。 */
  invalid: string[]
}

/**
 * 把任意未知 JSON 收窄成合法 ProjectSettings：
 * - 缺省/非对象 → 全默认；
 * - 已知字段逐个校验整数与区间，非法则回落默认并记录原因；
 * - 未知键忽略（不报错、不入库）；
 * - 交叉约束：healthGreenAt >= healthYellowAt，违反则两者回落默认并记录。
 * 纯函数、确定性，不抛异常。
 */
export function normalizeProjectSettings(raw: unknown): NormalizeResult {
  const settings = { ...DEFAULT_PROJECT_SETTINGS }
  const invalid: string[] = []
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    if (raw !== null && raw !== undefined) invalid.push('设置必须是 JSON 对象，已全部回落默认。')
    return { settings, invalid }
  }
  const obj = raw as Record<string, unknown>
  for (const field of SETTING_FIELDS) {
    if (!(field.key in obj)) continue
    const v = obj[field.key]
    if (isIntInRange(v, field.min, field.max)) {
      settings[field.key] = v
    } else {
      invalid.push(`${field.label}（${field.key}）须为 ${field.min}~${field.max} 的整数，已回落默认 ${DEFAULT_PROJECT_SETTINGS[field.key]}。`)
    }
  }
  // 交叉约束：绿灯线不得低于黄灯线；违反则两者一起回落默认，避免灯号倒挂。
  if (settings.healthGreenAt < settings.healthYellowAt) {
    invalid.push(`绿灯分数线（${settings.healthGreenAt}）不得低于黄灯分数线（${settings.healthYellowAt}），两者已回落默认。`)
    settings.healthGreenAt = DEFAULT_PROJECT_SETTINGS.healthGreenAt
    settings.healthYellowAt = DEFAULT_PROJECT_SETTINGS.healthYellowAt
  }
  return { settings, invalid }
}

/** 两个设置是否逐值相等（确定性比较，供「是否自定义/恢复默认」判断）。 */
export function sameSettings(a: ProjectSettings, b: ProjectSettings): boolean {
  for (const field of SETTING_FIELDS) {
    if (a[field.key] !== b[field.key]) return false
  }
  return true
}
