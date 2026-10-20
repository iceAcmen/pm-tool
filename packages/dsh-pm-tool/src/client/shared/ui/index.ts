/**
 * S0 共享设计系统闸门 · 共享控件合同统一出口。
 * 并行片只允许从这里取控件/基座，不得各自私造令牌与控件（避免返工）。
 * 主题跟随宿主（body[data-ds-dark-theme]），本层不做独立主题持久化。
 */
export { useSubmitGuard } from './use-submit-guard.js'
export type { SubmitGuard } from './use-submit-guard.js'
export { Field, FormSection } from './field.js'
export type { FieldProps, FormSectionProps } from './field.js'
export { PmButton, IconButton } from './button.js'
export type { PmButtonProps, PmButtonVariant, IconButtonProps } from './button.js'
export { DrawerFrame } from './drawer-frame.js'
export type { DrawerFrameProps } from './drawer-frame.js'
export { ConfirmDialog } from './confirm-dialog.js'
export type { ConfirmDialogProps } from './confirm-dialog.js'
export { EmptyState } from './empty-state.js'
export type { EmptyStateProps, EmptyVariant } from './empty-state.js'
export { ErrorBlock } from './error-block.js'
export type { ErrorBlockProps } from './error-block.js'
export { MenuPop, MenuGroup, MenuItem, MenuSeparator } from './menu-pop.js'
export type { MenuPopProps, MenuItemProps } from './menu-pop.js'
export { Receipt } from './receipt.js'
export type { ReceiptProps } from './receipt.js'
