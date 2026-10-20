/**
 * S0 共享提交防重守卫（自 panel.tsx 提升，行为零变更）。
 * begin() 在途时重复调用返回 false（二次提交直接忽略）；end() 释放。
 * 配合父级 busy 禁用：pending 期间主按钮 disabled + 「提交中…」可见文案 + aria-busy，防重复提交。
 */
import { useRef, useState } from 'react'

export type SubmitGuard = [submitting: boolean, begin: () => boolean, end: () => void]

export function useSubmitGuard(): SubmitGuard {
  const [submitting, setSubmitting] = useState(false)
  const inFlight = useRef(false)
  const begin = () => {
    if (inFlight.current) return false
    inFlight.current = true
    setSubmitting(true)
    return true
  }
  const end = () => {
    inFlight.current = false
    setSubmitting(false)
  }
  return [submitting, begin, end]
}
