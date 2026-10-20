# B3 独立全审就绪清单（待 data 报 complete，现 NOT_AUDITED）· 2026-10-20

> 现状：routes + staging UI + backup bundle/roundtrip 作者 green，**仅两项 fault injection 待落地**；QA 现 HOLD，不 partial PASS，不启服务/浏览器，当前无 GUI。full build author0 非 QA 独立，不沿用。data 报 complete（两项 fault 落地）后按本清单独立 targeted 跑测。
> **2026-10-20 更新：data 报 fullready 后已完成独立审计 → `b3-audit-qa-20261020.md`（39 例 PASS，core/full tsc 0，build 0；A13-A19/A23/A24 PASS，A25 PARTIAL；A20-A22 前端待核；整体未 PASS，GUI NOT_RUN）。本清单保留为复跑索引。**

## 触发条件（全部满足才开审）
1. data 两项 pending fault injection 落地（作者标注）。
2. core build 修复、backup bundle/roundtrip 定稿。
3. QA 复跑下列 targeted 文件 + core `tsc -p tsconfig.core.json --noEmit`；full `tsc`+`verify` 仍 HELD，待 front 错误清后独立跑。

## 独立复跑目标（命令从 package 根，npx vitest run <file>）
| 文件 | 作者例 | 覆盖 |
|---|---|---|
| `src/core/file-assets.test.ts` | 11 | magic/类型/可执行拒/白名单/10MiB/空/NUL·脚本/sha256 幂等/穿越/symlink/上限白名单 |
| `src/core/file-staging.test.ts` | 6 | stageUpload 隔离暂存不写终资产/cancel deleteStage 零残留/consumeStage 提升/过期 StageExpired+sweep/prepare 保留可 retry/exe·空暂存入口拒 |
| `src/core/file-backup.test.ts` | 6 | bundle→预检→manifest(sha/size/count/bundleId)/损坏 sha 拒零写/缺目录拒不清空/bundleId 不符/legacy no-op/伪造 relPath 拒 |
| `src/core/http/asset-route.test.ts` | 15 | 401 fail-closed/gate 403·401/503 不泄/405 Allow/非法 taskId 400/413/download 400·403·405/暂存 201 opaque/cancel 401·405/直挂 attach 契约+disposition/projectId 不符 403/恶意 filename basename/aborted 400 不调 attach |

## 计划用例 → 证据映射（A13-A25）
| 计划 | 对应测试/源码 |
|---|---|
| A13 staging noDB | file-staging stageUpload 不写终资产；asset-route 无 taskId 201 opaque stageId 不挂任务 |
| A14 新建 finalize 挂文件 | consumeStage 提升为内容寻址资产；直挂 attachFile 响应契约 |
| A15 失败保留暂存可 retry | staging prepare 保留暂存（DB 失败可重试），finalize 才清 |
| A16 abort 全零 | aborted 中断 400 request_aborted，不调 attach |
| A17 filename 净化 | 恶意 filename 取 basename、剥控制字符/换行，不出路径 |
| A18 project cross 隔离 | projectId 头与任务项目不符 → 403 不挂接 |
| A19 cancelDELETE | cancel deleteStage 清字节，再读 StageNotFound 零残留 |
| A20 stageEnabled=assetUpload&stageCancel | 前端 staged UI 静态双条件门（缺任一不暴露入口） |
| A21 StrictMode/unmount 不误删 | 前端 effect cleanup 静态核，不删 committed/正式资产 |
| A22 remove alias refs | 前端摘除别名仅去待挂引用，不碰已绑定资产 |
| A23 取消失败 TTL | StageExpired 过期清理 + sweep 孤儿 bin（网络失败兜底） |
| A24 成功不伤正式资产 | 直挂/consume 只新增绑定，不改写/删/截断已有资产 |
| A25 abort 竞态唯一落库 | aborted 中断 + consumeStage 唯一提升，无半截/重复 finalize |

## 判定纪律
- 两项 fault injection 未覆盖前，B3 维持 partial，不出 PASS；路由/backup 单测绿 ≠ 发布。
- GUI（上传闭环/拒绝可读/取消零挂载/开关门/重挂载）NOT_RUN，归 Main 采证。
