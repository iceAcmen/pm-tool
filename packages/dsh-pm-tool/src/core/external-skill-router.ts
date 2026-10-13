/**
 * Vendored（外部）Agent Skill 自动路由（ADL-049，项目级、IDE 无关、纯函数）。
 *
 * 它是什么 / 不是什么：
 *  - 是：把**结构化任务信号**（不是原始隐私文本）确定性地映射成「要不要加载 / 加载哪几个
 *    vendored 公开入口 skill」，并给出可复述的触发理由（K6 留痕）。
 *  - 不是：它**不读文件、不跑命令、不 import/eval 任何 vendor 内容、不做 sha256 指纹校验、
 *    不真正加载 skill**。加载动作本身仍由执行 Agent 在按 manifest 校验 + 校 sha256 之后、
 *    遵守 docs/external-skills.md 8 条红线时自行完成。本函数只给「决策 + 理由」。
 *
 * 只允许 4 个 vendored 公开入口（与 vendor/agent-skills/mattpocock/manifest.json 的
 * entrySkillIds 对齐）：grill-me / tdd / code-review / diagnosing-bugs。
 *  - `grilling` 是 grill-me 的 exposed:false 纯文档依赖，**不是公开入口**，永不作为 entry 返回；
 *  - `interaction`（缺关键阻塞信息时直接向用户追问）是 Agent 内建动作，**不是 vendored skill**，
 *    也不进 entrySkillIds。
 *
 * 路由优先级（高位覆盖低位，结果顺序固定、确定性、输出数组冻结去重）：
 *  0. needsBlockingUserInput          → 先走内建 interaction 直接追问，**不加载任何 vendored skill**
 *                                        （尤其不为此套 grill-me）；route='none'、interactionFirst=true。
 *  0b. !vendorIntegrityVerified       → vendor 安全门（manifest/指纹静态校验）未通过，
 *                                        **返回任何 skill 之前的硬前置**；route='none'。
 *  A. isRootCauseUnknown              → diagnosing-bugs（先根因定位）；**抑制 grill/tdd**，
 *                                        且**不追加 code-review**（根因未明不可交付/不可自评提交）。
 *  B. hasMaterialAmbiguity（非阻塞）  → grill-me（先澄清歧义、出待拍板清单，再动手编码）。
 *  C. isNewFeature || isTestableFix   → tdd（新功能/可测修复实现阶段，组织红→绿→重构）。
 *  D. isDeliveryBoundary             → **追加** code-review（交付/报备提交前自查，排在最后；
 *                                        仅在非「根因未明」分支追加）。
 *  E. 无任何命中                       → route='none'（简单/无增益，避免为用而用）。
 *
 * 信号修正（REQUEST CHANGES）：
 *  - isTrivial：抑制 grill-me 与 tdd（简单任务无需澄清/红绿仪式）；但 deliveryBoundary 仍可 code-review。
 *  - rootCauseUnknown：抑制 grill/tdd，且不追加 code-review（根因未明不可交付）。
 *  - blocking：全拦（含 code-review）。
 *
 * 约束：
 *  - 不得让用户挑 skill / 念口令（K4）；不得自动触发 grilling（grilling 只随 grill-me 运行时生效）。
 *  - 自动路由 ≠ 放行：不豁免 8 条红线、不替代独立测试门（ADL-045/047）；理由中已写明边界。
 */

/** vendored 公开入口 id 的精确白名单（编译期即约束；运行期与 manifest.entrySkillIds 对齐由测试校验）。 */
export type VendoredEntryId = 'grill-me' | 'tdd' | 'code-review' | 'diagnosing-bugs'

/** 与白名单同序导出，供测试/适配层只读比对 manifest。 */
export const VENDORED_ENTRY_IDS: readonly VendoredEntryId[] = [
  'grill-me',
  'tdd',
  'code-review',
  'diagnosing-bugs',
] as const

/** 粗粒度任务类别（用于可解释留痕：输出 decision.taskKind 原样回带）。 */
export type TaskKind =
  | 'new-feature'
  | 'bug-investigation'
  | 'bug-fix'
  | 'delivery-self-check'
  | 'docs'
  | 'query'
  | 'other'

/** 结构化任务信号（调用方据任务语义填写；绝不含原始隐私文本 / 凭据）。 */
export interface TaskSignals {
  /** 粗粒度类别（原样回带进 decision.taskKind，供留痕检索）。 */
  taskKind: TaskKind
  /** 需求/方案存在实质歧义、多个后果差异较大的选项、关键条件不明确（且非「缺阻塞信息」）。 */
  hasMaterialAmbiguity: boolean
  /** 进入新功能的编码实现阶段。 */
  isNewFeature: boolean
  /** 可测的缺陷修复（根因已明、有明确测试可走红→绿）。 */
  isTestableFix: boolean
  /** 复现到异常/回归未过，但根因尚未定位。 */
  isRootCauseUnknown: boolean
  /** 处于一次改动闭环 / 报备提交 / 交付前边界。 */
  isDeliveryBoundary: boolean
  /** 简单、机械、套用既有模式：抑制 grill/tdd（无澄清/红绿增益）。 */
  isTrivial: boolean
  /** 缺关键阻塞信息，必须先直接向用户追问才能解锁（而非系统性 grill）。 */
  needsBlockingUserInput: boolean
  /**
   * vendor 安全门是否已通过（manifest schema / commit / license / 精确 entry 白名单 / 逐文件 sha256）。
   * **返回任何 vendored skill 之前必须为 true**；false 则 route='none' 且理由为「安全门未通过」。
   * 本纯函数不自己校指纹——它只消费执行 Agent 已完成的静态校验结果。
   */
  vendorIntegrityVerified: boolean
}

/** 触发理由的结构化编号（便于测试精确断言与留痕检索）。 */
export type RouteCode =
  | 'needs-blocking-user-input'
  | 'vendor-integrity-unverified'
  | 'root-cause-unknown'
  | 'material-ambiguity'
  | 'implementation'
  | 'delivery-boundary'
  | 'trivial-no-gain'

/** 一条可解释的触发理由（K6）。对应 vendored entry 时带 entry；interaction/安全门/trivial 类不带。 */
export interface RouteReason {
  code: RouteCode
  /** 中文说明：命中哪条场景、为何选该 entry、边界是什么。 */
  message: string
  /** 该理由触发的 vendored 公开入口；无对应入口（interaction/安全门/trivial）时省略。 */
  entry?: VendoredEntryId
}

/** 路由决策结果。数组均已冻结（Object.freeze）并按插入序去重，不可外部增删改。 */
export interface RouteDecision {
  /** 'none' = 不加载任何 vendored skill；'skills' = 按下述 entrySkillIds 顺序加载。 */
  route: 'none' | 'skills'
  /** 原样回带任务类别（可解释留痕）。 */
  taskKind: TaskKind
  /** 有序、去重、冻结、严格属于 VENDORED_ENTRY_IDS 的子集；'none' 时为空冻结数组。 */
  entrySkillIds: readonly VendoredEntryId[]
  /** 与决策对应的可解释理由（加载了哪个、为什么、边界）；阻塞/安全门路径下恰为单条。 */
  reasons: readonly RouteReason[]
  /** 缺关键阻塞信息时为 true：先走内建 interaction 直接追问，不加载任何 vendored skill。 */
  interactionFirst: boolean
}

/** 类型守卫：判断某字符串是否为合法 vendored 公开入口 id。 */
export function isVendoredEntryId(id: string): id is VendoredEntryId {
  return (VENDORED_ENTRY_IDS as readonly string[]).includes(id)
}

/** 按插入序去重并冻结，返回不可变数组（防御调用方事后增删改）。 */
function freezeList<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(items)])
}

/**
 * 纯函数：根据结构化任务信号，确定性地给出 vendored skill 自动路由决策。
 *
 * 无 IO、无时序、无随机、无环境读取——相同输入永远得到相同输出。
 */
export function routeExternalSkill(signals: TaskSignals): RouteDecision {
  // Rule 0（最高优先）：缺关键阻塞信息 → 先走内建 interaction 直接追问解锁。
  // 全拦：不加载任何 vendored skill——尤其不为此套 grill-me，也不追加 code-review。
  if (signals.needsBlockingUserInput) {
    return {
      route: 'none',
      taskKind: signals.taskKind,
      entrySkillIds: freezeList<VendoredEntryId>([]),
      reasons: freezeList<RouteReason>([{
        code: 'needs-blocking-user-input',
        message:
          '缺关键阻塞信息，先走内建 interaction 直接向用户追问解锁；不加载任何 vendored skill（不为此套 grill-me、不进入交付自查）。',
      }]),
      interactionFirst: true,
    }
  }

  // Rule 0b：vendor 安全门是「返回任何 vendored skill 之前」的硬前置。未通过则一律 none。
  if (!signals.vendorIntegrityVerified) {
    return {
      route: 'none',
      taskKind: signals.taskKind,
      entrySkillIds: freezeList<VendoredEntryId>([]),
      reasons: freezeList<RouteReason>([{
        code: 'vendor-integrity-unverified',
        message:
          'vendor 安全门（manifest schema / 锁定 commit / license / 精确 entry 白名单 / 逐文件 sha256）未通过，按 K3 拦截：在静态校验 PASS 前不得加载任何 vendored skill。',
      }]),
      interactionFirst: false,
    }
  }

  const entries: VendoredEntryId[] = []
  const reasons: RouteReason[] = []

  // Rule A：复现到异常/回归未过但根因未明 → 先结构化根因定位。
  // 抑制 grill/tdd（根因未明先不澄清/不红绿）；且**不追加 code-review**（根因未明不可交付/不可自评提交）。
  if (signals.isRootCauseUnknown) {
    entries.push('diagnosing-bugs')
    reasons.push({
      code: 'root-cause-unknown',
      entry: 'diagnosing-bugs',
      message:
        '复现异常/回归未过但根因未明 → 先按「现象→假设→验证→根因」定位（diagnosing-bugs）；诊断中不静默改代码；根因未明本批不可交付，故不进入 code-review 自查，修复仍走正常开发+独立测试门（ADL-045）。',
    })
  } else {
    // Rule B（非阻塞、非根因排查）：需求/方案有实质歧义 → 先苏格拉底式澄清，再动手编码。
    // isTrivial 抑制：简单任务无澄清增益。
    if (signals.hasMaterialAmbiguity && !signals.isTrivial) {
      entries.push('grill-me')
      reasons.push({
        code: 'material-ambiguity',
        entry: 'grill-me',
        message:
          '需求/方案有实质歧义且非阻塞信息 → 先 grill-me 产出待拍板清单（其纯文档依赖 grilling 随之生效）；不替所有者拍板、不把追问输出当已定方案直接实施。',
      })
    }
    // Rule C：新功能 / 可测修复的编码实现阶段 → 组织红→绿→重构。isTrivial 抑制。
    if ((signals.isNewFeature || signals.isTestableFix) && !signals.isTrivial) {
      entries.push('tdd')
      reasons.push({
        code: 'implementation',
        entry: 'tdd',
        message:
          '新功能/可测修复进入编码实现 → 用 tdd 组织红→绿→重构；其自测绿≠独立测试专家 PASS，GUI 实测与回归不可省。',
      })
    }
    // Rule D：一次改动闭环 / 报备提交 / 交付前 → **追加**一次只读质量自查（永远排在最后）。
    // 即使 isTrivial 也保留（交付门不因简单而免自查）；根因未明分支已在 Rule A 提前 return 此处之外。
    if (signals.isDeliveryBoundary) {
      entries.push('code-review')
      reasons.push({
        code: 'delivery-boundary',
        entry: 'code-review',
        message:
          '本批改动闭环、报备提交/交付前 → 追加 code-review 做命名/边界/明显安全/约定一致性自查；不自动批准/合并、不 git push，review 结论≠验收通过。',
      })
    }
  }

  // Rule E：没有任何命中 → 不加载任何 vendored skill（简单/无增益，避免为用而用）。
  if (entries.length === 0) {
    reasons.push({
      code: 'trivial-no-gain',
      message: signals.isTrivial
        ? '任务简单/机械/套用既有模式，grill/tdd 无明显增益 → 不加载，按项目常规流程完成即可。'
        : '无歧义、无根因排查、无新实现、非交付边界，加载 vendored skill 无明显增益 → 不加载。',
    })
  }

  return {
    route: entries.length === 0 ? 'none' : 'skills',
    taskKind: signals.taskKind,
    entrySkillIds: freezeList<VendoredEntryId>(entries),
    reasons: freezeList<RouteReason>(reasons),
    interactionFirst: false,
  }
}
