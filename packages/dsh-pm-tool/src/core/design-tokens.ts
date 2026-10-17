/**
 * P2-2 Token 2.0 语义契约（纯函数，零 DOM、零 I/O、零墙钟）。
 *
 * CSS 实现见 src/client/panel.css（宿主别名优先 → fallback）；本模块只承载可计算的
 * 语义契约：角色表、AA 基线、历史未定义别名闭合映射、保留旧别名、图表/AI 槽位状态。
 * 设计真源：docs/design/p2-2-visual-token-baseline-20261017.md。
 *
 * 本批规则：旧 token 全部保留为同值别名，不改名、不删除、不全局粗替换。
 */

/** sRGB 0–255 三元组 */
export type Rgb = [number, number, number]

/** WCAG 相对亮度（sRGB 线性化） */
export function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (c: number): number => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG 对比度比（1:1 ～ 21:1） */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

/** 冻结的浅色 fallback 中性板（宿主别名缺失时兜底，不覆盖宿主主题） */
export const FALLBACK_LIGHT = {
  canvas: [255, 255, 255] satisfies Rgb,
  surface2: [245, 246, 247] satisfies Rgb,
  ink: [28, 28, 30] satisfies Rgb,
  secondary: [97, 102, 107] satisfies Rgb,
  muted: [105, 110, 116] satisfies Rgb, // #696e74，白底 5.14:1
  faint: [113, 118, 124] satisfies Rgb, // #71767c，白底 4.58:1
  link: [72, 104, 178] satisfies Rgb, // #4868b2，白底 5.39:1
  onPrimary: [255, 255, 255] satisfies Rgb,
  primaryFill: [15, 17, 21] satisfies Rgb, // 近黑中性主按钮（宿主 button-primary-fill）
} as const

/** 语义角色表：hostAlias 优先，fallback 兜底；minContrast 为该角色在 fallback 面上的 AA 门 */
export interface SemanticRole {
  role: string
  hostAlias: string | null
  fallback: Rgb
  surface: Rgb
  minContrast: number
  note: string
}

export const SEMANTIC_ROLES: SemanticRole[] = [
  { role: 'text', hostAlias: '--dsw-alias-label-primary', fallback: FALLBACK_LIGHT.ink, surface: FALLBACK_LIGHT.canvas, minContrast: 4.5, note: '主文本' },
  { role: 'text-2', hostAlias: '--dsw-alias-label-secondary', fallback: FALLBACK_LIGHT.secondary, surface: FALLBACK_LIGHT.canvas, minContrast: 4.5, note: '次要正文' },
  { role: 'muted', hostAlias: '--dsw-alias-label-tertiary', fallback: FALLBACK_LIGHT.muted, surface: FALLBACK_LIGHT.canvas, minContrast: 4.5, note: '辅助文本，可上 surface-2' },
  { role: 'faint', hostAlias: '--dsw-alias-label-caption', fallback: FALLBACK_LIGHT.faint, surface: FALLBACK_LIGHT.canvas, minContrast: 4.5, note: '仅画布/表面；落 surface-2 不足 AA，禁用' },
  { role: 'link', hostAlias: '--dsw-alias-link', fallback: FALLBACK_LIGHT.link, surface: FALLBACK_LIGHT.canvas, minContrast: 4.5, note: '文本链接，非大面积 CTA' },
  { role: 'on-primary', hostAlias: '--dsw-alias-label-primary-foreground', fallback: FALLBACK_LIGHT.onPrimary, surface: FALLBACK_LIGHT.primaryFill, minContrast: 4.5, note: '中性主按钮文字' },
]

/**
 * 历史未定义 / 无 fallback 别名闭合映射（G2-A07）。
 * key = 历史消费但未定义的旧名；value = 解析目标（既有同值 token，不改视觉）。
 */
export const CLOSURE_ALIASES: Record<string, string> = {
  '--c-link': '--pm-link',
  '--hover-bg': '--pm-hover',
  '--line-soft': '--pm-line-soft',
  '--pm-border': '--pm-line',
  '--pm-bg': '--pm-canvas',
  '--pm-text': '--pm-text',
  '--pm-line-strong': '--dsw-alias-state-idle-primary',
  '--pm-accent-soft': '--dsw-alias-state-business-tertiary',
  '--pm-faint': '--faint',
  '--pm-ink-muted': '--pm-secondary',
  '--pm-surface-muted': '--surface-2',
  '--pm-progress': '--c-prog',
}

/** 本批保留为同值别名的旧 token（不改名、不删除；全量映射见设计文档 §5） */
export const PRESERVED_OLD_ALIASES: string[] = [
  '--pm-accent', '--pm-blue', '--pm-blue-hover', '--pm-blue-soft',
  '--pm-ink', '--pm-secondary', '--pm-muted', '--pm-line', '--pm-line-soft',
  '--pm-hover', '--pm-surface', '--pm-canvas', '--pm-danger', '--pm-success',
  '--pm-warning', '--pm-on-primary', '--pm-link',
  '--ink', '--ink-2', '--muted', '--faint', '--surface', '--surface-2',
  '--surface-3', '--line', '--line-2', '--line-3',
  '--c-done', '--c-prog', '--c-block', '--c-late', '--c-todo',
]

/** 图表序列状态：S1–S3 启用；S4 violet 仅定义不启用（G2-A11） */
export const CHART_SERIES = [
  { id: 's1', enabled: true },
  { id: 's2', enabled: true },
  { id: 's3', enabled: true },
  { id: 's4', enabled: false, reason: '多项目序列未来才用；violet 禁止进 UI 面' },
] as const

/** P2-6 预留槽位：本批只定义不启用 */
export const AI_SLOTS = [
  { id: '--pm-ai-surface', enabled: false },
  { id: '--pm-ai-edge', enabled: false },
  { id: '--pm-ai-mark', enabled: false },
] as const

/** 主按钮必须中性：不得用业务蓝（brand blue）做填充 CTA（T2-G05） */
export const PRIMARY_FILL_RULE = {
  mustBeNeutral: true,
  forbiddenFill: '--dsw-alias-state-business-primary',
}
