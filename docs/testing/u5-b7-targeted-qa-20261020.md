# U5 / B7 targeted 独立 QA · 2026-10-20

> 后端 U5/B7 stable exact；QA 独立 targeted（不信作者计数），未跑 full isolation（待 front final 后再全量）。GUI NOT_RUN。

## 1. 复跑结果（独立）
- 新增 U5/B7 后端 5 文件 **12/12 PASS**：u5-help 2 / deliverable-u5 2 / deliverable-export-u5 3 / progress-report-markdown-u5 2 / ask-copilot-b7 3。
- records 前端 6 文件 **37/37 PASS**（history 3/payloads 11/preview-authoritative 6/options 7/period 4/preview 6）。
- full tsc 0、core tsc 0、`pnpm build` exit0（8 文件，client.js 1411.68 kB）。

## 2. U5 逐项源码 + 测试核对
| 项 | 证据 | 判定 |
|---|---|---|
| legacy reports 缺 source 只读归一 | `normalizeProgressReportRecord`（progress-report.ts:192-198）：旧记录缺 sourceType/sessionId → 归一 manual/null，非法 sourceType 回落 manual，session 缺 sid → manual/null；只读不回写物理存储 | PASS |
| exports 携带 source/milestone/note | deliverable-export-u5：Markdown/Web HTML/plain 三档均带「关联里程碑 m-ok」+「备注」；note 恶意 `<img onerror>` 转义为 `&lt;img`，无裸 `<img src=x>`；plain 无 HTML 标签 | PASS |
| help 披露合同 | u5-help：report help 含 `"sourceType":"session"`/sourceSessionId/「生成后不可改」；deliverable help 含 milestoneId/note/「必须存在且同项目」 | PASS |
| deliverable.milestoneId 跨项目/不存在拒绝零写 | deliverable-u5：同项目 m-ok 关联持久化；m-other(跨项目)/m-missing(不存在) 抛 DeliverableMilestoneNotFoundError，零写 | PASS |
| note 持久化 + milestone 清空 | addDeliverable 存 note；updateDeliverable `milestoneId:null` 解除关联、note 可改；前端 deliverable-form「清空即解除」→ payload.milestoneId=null | PASS |
| report source 条件（front） | records-report-form：新建可选 manual/session，session 必填非空会话 ID，manual 不校验；编辑态只读、update 不带 source（不可改） | PASS |

## 3. B7 AI 只读投影裁剪（ask-copilot-b7）
- `trimAskAttachments`：资料项仅留白名单字段（deliverable→frozenName/frozenVersion；link→title；file→basename），丢弃 url/assetId/note/内部 id；缺 asset 的 file 仅 `{kind:file,domain:文件}`。
- `trimAskProgressLog`：排除软删（deletedAt），仅取末条修订（最新 5 条），正文截 80 字 + `…`，不含被覆盖旧稿。
- `buildAskContext`：以 `<<<UNTRUSTED_PROJECT_DATA data-only=true` … `>>>END_UNTRUSTED_PROJECT_DATA` 包裹；不泄露 url；COPILOT_SYSTEM 标注不可信外部数据。
- ask-copilot.ts 仅构造上下文/system prompt，**不执行 op、不写库**；执行白名单仍由 copilot.ts ALLOWED_OPS 把关，**未变**（无 okr/habit/delete/asset 写）。

## 4. 边界 / 残留
- note 安全 markdown：导出三档转义已测；前端 history 以文本节点渲染 row.note（无 innerHTML/dangerouslySet），无注入面；交付物 note 经共享 `MarkdownView`（AST→纯 React 元素，无 innerHTML/eval，safeHref 过滤协议，null href 降级文本），无注入面。
- **列表搜索（澄清，关闭残留）**：deliverables.tsx:89-95 主列表 query 的 matches() haystack = `name version owner location description msTitle milestoneId note`（小写 includes），**列表检索命中 note 与 milestoneId**，与 records-listbox 选项过滤无关；即列表搜索应找 note，非 listbox。源码核通过（无单测覆盖该 haystack，属视图层静态核）。
- GUI（表单条件显隐、清空交互、下拉键盘、busy/取消）NOT_RUN，归 Main native 采证。
- full isolation：独立复跑 **93/93 通过、失败 0、污染 0**（before=after=228）；verify-client-bundle / verify-external-skills / verify-ai-client / external-skill-router 均随全量 ok；自动化静态门冻结。

## 最终独立复跑（2026-10-20 紧急复核）
- full tsc 0、core tsc 0、`pnpm build` exit0（8 文件，client.js 1411.68 kB）。
- targeted：U5/B7 后端 12 + records front 37 = **49/49 PASS**（11 文件）。
- full isolation **93/93、失败 0、污染 0**（before=after=228）。
- 本地重建 lib 与旧候选 bundle 同 hash：`lib/index.js=4cfd4421…`(23125B)、`lib/client.js=2238c1d9…`(1411684B)；本地 src newest 06:10:31 < lib newest 06:14:28（STALE=none）。
- 结论：旧 `candidate-f2-u5/run-061824` 系最终 gaps/front forms 落地前准备，**已 stale，不得原地更新**；需 front 按当前 worktree 重新冻结 **NEW candidate**，Main 待新候选再启动。
