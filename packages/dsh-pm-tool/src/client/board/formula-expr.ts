/**
 * 安全公式求值器（expr-eval 真实实现）——【异步块 client.formula.js】。
 * 仅在此模块静态 import expr-eval；主包 formula.ts 经动态 import 惰性加载本模块。
 * 基于 expr-eval AST 解释路径（Parser.parse().evaluate()），绝不走 .compile()（那会用 new Function/with）。
 * 只产出标量 number/string；聚合函数白名单；字段白名单；长度/规模/耗时 guard；
 * 一切错误返回结构化 {ok:false,error}，不抛到渲染层。
 */
import { Parser } from 'expr-eval'

export type FormulaResult =
  | { ok: true; value: number | string }
  | { ok: false; error: { kind: 'syntax' | 'unsafe' | 'runtime' | 'too_long' | 'too_many_rows' | 'bad_field'; message: string } }

export interface FormulaContext {
  rows: Record<string, unknown>[]
  today: string // YYYY-MM-DD
}

const parser = new Parser()
const MAX_LEN = 200
const MAX_ROWS = 5000

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : NaN
}

/** 校验聚合字段是否在该实体白名单内（rows 行本身带的字段都算合法）。 */
function assertField(rows: Record<string, unknown>[], field: string) {
  // rows 第一行存在该字段即视为合法；空数组退化为允许（聚合结果为 0/NaN）。
  if (rows.length === 0) return
  if (!(field in rows[0])) throw new Error(`非白名单字段: ${field}`)
}

export function evaluateFormula(expr: string, ctx: FormulaContext): FormulaResult {
  if (typeof expr !== 'string' || expr.trim() === '') {
    return { ok: false, error: { kind: 'syntax', message: '公式为空' } }
  }
  if (expr.length > MAX_LEN) {
    return { ok: false, error: { kind: 'too_long', message: `公式超过 ${MAX_LEN} 字符` } }
  }
  if (ctx.rows.length > MAX_ROWS) {
    return { ok: false, error: { kind: 'too_many_rows', message: `行数超过 ${MAX_ROWS}` } }
  }
  // 拒绝危险成员访问
  if (/constructor|prototype|__proto__|Function|globalThis|window|document/.test(expr)) {
    return { ok: false, error: { kind: 'unsafe', message: '检测到危险成员访问' } }
  }

  const t0 = Date.now()
  try {
    const ast = parser.parse(expr)
    // 自定义聚合函数（白名单）。
    const count = (rows: unknown[]) => rows.length
    const sum = (rows: Record<string, unknown>[], field: string) => {
      assertField(rows, field)
      return rows.reduce((a, r) => a + num(r[field]), 0)
    }
    const avg = (rows: Record<string, unknown>[], field: string) => {
      assertField(rows, field)
      return rows.length ? rows.reduce((a, r) => a + num(r[field]), 0) / rows.length : 0
    }
    // 注：expr-eval 内置 min/max 是多数字参数函数，会屏蔽自定义；故用 rowMin/rowMax。
    const rowMin = (rows: Record<string, unknown>[], field: string) => {
      assertField(rows, field)
      if (!rows.length) return 0
      return rows.reduce((a, r) => Math.min(a, num(r[field])), Infinity)
    }
    const rowMax = (rows: Record<string, unknown>[], field: string) => {
      assertField(rows, field)
      if (!rows.length) return 0
      return rows.reduce((a, r) => Math.max(a, num(r[field])), -Infinity)
    }
    const countIf = (rows: Record<string, unknown>[], field: string, value: unknown) => {
      assertField(rows, field)
      return rows.filter(r => String(r[field]) === String(value)).length
    }
    const pct = (part: number, all: number) => {
      const a = num(all)
      if (!a) return 0
      return Math.round(num(part) / a * 1000) / 10
    }
    const value = (ast.evaluate as (ctx: Record<string, unknown>) => unknown)({
      rows: ctx.rows,
      today: ctx.today,
      count, sum, avg, rowMin, rowMax, countIf, pct,
    })
    if (Date.now() - t0 > 200) {
      return { ok: false, error: { kind: 'runtime', message: '公式求值超时' } }
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return { ok: false, error: { kind: 'runtime', message: '结果非有限数' } }
      return { ok: true, value }
    }
    if (typeof value === 'string') return { ok: true, value }
    return { ok: false, error: { kind: 'runtime', message: '公式必须返回标量' } }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/非白名单字段/.test(msg)) return { ok: false, error: { kind: 'bad_field', message: msg } }
    if (/parse|unexpected|undefined/i.test(msg)) return { ok: false, error: { kind: 'syntax', message: msg } }
    return { ok: false, error: { kind: 'runtime', message: msg } }
  }
}
