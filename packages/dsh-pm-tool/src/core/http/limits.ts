/**
 * PM 内部 HTTP 路由共享边界常量（preview 与后续 asset 路由共用，避免跨模块循环引用）。
 */
/** preview JSON 请求体上限（流式预检，超限 413 drain）。 */
export const PREVIEW_MAX_BODY_BYTES = 64 * 1024
/** 上传资产硬上限 10MiB（与 file-assets 安全模块对齐）。 */
export const ASSET_MAX_BYTES = 10 * 1024 * 1024
