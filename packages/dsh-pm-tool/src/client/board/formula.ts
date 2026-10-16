/**
 * 公式求值入口（主包）——不静态 import expr-eval，保持浏览态首屏体积。
 * 真实实现（expr-eval）在异步块 client.formula.js；首次需要公式卡片渲染/试算时才惰性加载。
 * 加载完成后求值器被缓存，后续渲染同步调用，口径与编辑态完全一致（同一份 formula-expr.ts）。
 */
import type { FormulaContext, FormulaResult } from './formula-expr.js'

export type { FormulaContext, FormulaResult }

type EvaluateFn = (expr: string, ctx: FormulaContext) => FormulaResult

let cached: EvaluateFn | null = null
let pending: Promise<EvaluateFn> | null = null

/** 是否已同步可用（渲染期可直接调用）。 */
export function getFormulaEngine(): EvaluateFn | null {
  return cached
}

/** 惰性加载公式引擎（expr-eval 异步块）；重复调用共享同一 promise。 */
export function loadFormulaEngine(): Promise<EvaluateFn> {
  if (cached) return Promise.resolve(cached)
  if (!pending) {
    pending = import('./formula-expr.js')
      .then(m => { cached = m.evaluateFormula; return cached })
      .catch((e) => { pending = null; throw e })
  }
  return pending
}
