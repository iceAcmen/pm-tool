# B6 preview-route P0 独立 QA 源码+测试核验 · 2026-10-20

> 独立读源码 + 复跑作者测试 + QA 补充探针（临时文件已删）；不起活服务器、不代 GUI。core-only `tsc -p tsconfig.core.json --noEmit` EXIT0；**full tsc / verify bundle HELD**，待 front 当前错误清后 QA 独立跑。

## 路由定位
- handler：`src/core/http/preview-route.ts`（POST-only `/api/pm/v1/report-preview`）
- 注册/能力：`src/index.ts:164-188`（webServer/connection 可选）、`239-246`（capabilities）
- 限长：`src/core/http/limits.ts`（preview 64KiB / asset 10MiB）

## P0 逐项判定

| # | 要求 | 判定 | 源码/证据 |
|---|---|---|---|
| R-a | auth full req，无 gate fail-closed 401；403 forbidden；gate 异常 503 generic | **PASS** | preview-route.ts:94-111；无 auth→401，403/401 分流，catch→503 `auth_unavailable` 不泄内部；按真实签名传完整 req（非 headers） |
| R-b | invalid json 400 / limit 413 / unknown strict | **PASS** | :131-139；空/非法 JSON→400 `invalid_json`；超限→413 `body_too_large`；`z.strictObject`(:26) 拒未知键→400；声明 Content-Length 预检 + 流式限长双路（:58-82） |
| R-c | headers all responses（no-store/nosniff） | **PASS** | `writeSecurityHeaders`(:34-37)；sendJson/sendError 全带；405(:113-118) 也显式带；415/413/400/404/503/200 全覆盖 |
| R-d | schema selectedRefs max50 | **PASS** | :30 `selectedRefs: z.array(selectedRefSchema).max(50)`；复合 taskId/entryId/revisionId（progress-report.ts:21-25）；QA 补测 51 条→400 |
| R-e | preview read no write | **PASS** | `previewProgressReport` 只读；QA spy domain 无 put/set/delete（mutated=0）；不落盘不写库 |
| R-f | registration capabilities honest（connection/webserver 缺失/冲突） | **PASS（R1 已修复测）** | `registerPreviewRoute`(preview-route.ts:99) 缺失/抛错返回 `ok:false`；index.ts:169/173/229-230 以 `previewRegistered` 快照驱动 httpAvailable/previewApi；QA 3 例复测：缺 ws/缺 conn→false、冲突 catch→false 无 dispose、成功→true+dispose |

## R1（已修复，QA 复测关闭）
- **原现象**：路径冲突/register 抛错时 capabilities.httpAvailable、previewApi 仍报 true，路由实际未注册。
- **修复**：`registerPreviewRoute` 返回 `{ok, dispose}`，index 以 `previewRegistered` 快照为准；缺失/冲突都诚实降级 CLI-only。
- **QA 复测 3 例 PASS**：缺 webServer/缺 connection→ok=false；register 抛冲突→ok=false 无 dispose；成功→ok=true 且 dispose 可调用。

## 测试
- 作者 `preview-route.test.ts` 15 例 QA 复跑 PASS（含 R1 register 3 例：缺失/冲突/成功快照；其余 401/403/无 gate/503/domain 503/405/415/413 声明长/400 非法 JSON/未知键/404/200+安全头）。
- QA 补充 3 例 PASS：selectedRefs>50→400；无 Content-Length 流式 chunk 超限→413；合法预览零写（spy mutated=0）。

## 构建/验收边界
- core-only tsc EXIT0（index.ts 不在 core 范围）；**full `tsc -p tsconfig.json` + `pnpm verify` bundle HELD**：front 当前错误未清，清后 QA 独立跑 full build/verify bundle 才进 candidate，不提前判。
- Main R4 旧冻结 lib 无此路由（034827 RUN），candidate 采证不含本路由；本路由不替代 GUI。
- B3 asset 上传/下载路由（10MiB/content sniff/pathsafe/下载鉴权/Content-Disposition/取消 tmp 清理）未实现，另立 NOTRUN。
