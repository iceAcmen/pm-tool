/**
 * B3 暂存门控与关闭回收的纯决策函数（无 DOM、无 fetch，便于单测）。
 *
 * - A20 暂存上传门控：必须同时具备 assetUpload（直传/路由就绪）与 stageCancel（暂存路由已注册），
 *   单 flag 不开放文件暂存输入。
 * - A21 关闭/卸载回收决策：已提交成功（后端 prepareStage/finalizeStage 已消费）不 DELETE；
 *   未提交的暂存 best-effort 回收，失败由 TTL sweep 兜底。
 */

export interface StageGateFlags {
  assetUpload?: boolean
  stageCancel?: boolean
}

/** A20：两个 flag 同时为真才开放暂存上传。 */
export function stageUploadGate(flags: StageGateFlags | undefined): boolean {
  return Boolean(flags?.assetUpload && flags?.stageCancel)
}

/** B3：资产下载门控（capabilities.assetDownload），仅真才渲染已存文件下载链接。 */
export function downloadGate(assetDownload?: boolean): boolean {
  return Boolean(assetDownload)
}

export interface StagedStageRef {
  stageId: string
  clientId?: string
}

export interface CleanupPlan {
  /** 需要 best-effort DELETE 的 stageId 列表（已提交为空）。 */
  cancel: string[]
}

/**
 * A21：按提交状态决定关闭回收计划。
 * - submitted=true：后端已消费/已 finalize，不再 DELETE（幂等也不必发），返回空。
 * - submitted=false：未提交暂存全部进入 cancel 列表（best-effort，失败 TTL 兜底）。
 * 纯决策，不发请求、不改状态。
 */
export function reconcileStagedCleanup(stages: StagedStageRef[], submitted: boolean): CleanupPlan {
  if (submitted) return { cancel: [] }
  return { cancel: (stages ?? []).map(s => s.stageId).filter(Boolean) }
}
