/**
 * B6 records 分片对外出口（供前端 owner 在 panel.tsx 统一接线）。
 *
 * 接线方式：panel 在对应抽屉挂载处注入 shared/records-props.ts 的回调，
 * 分片只调回调，不拼命令、不 localmock、不并写 panel/core/shared。
 *
 * ```tsx
 * import { RecordsMeetingForm, RecordsReportForm, RecordsDeliverableForm } from './views/records/index.js'
 * ```
 */
export { RecordsOverlay } from './records-overlay.js'
export type { RecordsOverlayProps } from './records-overlay.js'

export { RecordsListbox } from './records-listbox.js'
export type { RecordsListboxProps } from './records-listbox.js'

export { RecordsMeetingForm } from './records-meeting-form.js'
export type { RecordsMeetingFormProps } from './records-meeting-form.js'

export { RecordsReportForm } from './records-report-form.js'
export type { RecordsReportFormProps } from './records-report-form.js'

export { RecordsDeliverableForm } from './records-deliverable-form.js'
export type { RecordsDeliverableFormProps } from './records-deliverable-form.js'

// 纯逻辑（测试覆盖，供视图/组件复用）
export {
  normalizeMeetingPayload,
  normalizeMeetingActionPayload,
  normalizeReportPayload,
  normalizeDeliverablePayload,
  parseTextList,
} from './records-payloads.js'
export {
  MEETING_STATUS_OPTIONS,
  MEETING_ACTION_STATUS_OPTIONS,
  REPORT_STATUS_OPTIONS,
  DELIVERABLE_STATUS_OPTIONS,
  filterOptions,
  moveHighlight,
  optionLabel,
  indexOfValue,
} from './records-options.js'
export { buildLocalPreview, freezeSelection, isFrozenFor } from './records-preview.js'
export { periodPresets, periodKind, validatePeriod, PERIOD_KIND_LABEL } from './records-period.js'
export { projectDeliverableHistory } from './records-history.js'
export {
  FROZEN_EXCERPTS_MAX,
  candidateKey,
  defaultCheckedKeys,
  preserveChecked,
  toggleKey,
  setAllKeys,
  buildSelectedRefs,
  withinFrozenLimit,
} from './records-preview-authoritative.js'
export type { ReportPreviewCandidate, ReportPreviewRef } from '../../shared/records-props.js'
