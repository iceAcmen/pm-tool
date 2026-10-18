# P0 深度融合（底座+采集闭环）验证记录

> 日期：2026-10-18 · 平台：doubao-work（组织者集成验证）· 范围：P0 八项能力（K1/K2 窄集/K4/K3/K9/K12/X6-L1/K6）
> 绑定：HEAD 见 git log（本批提交 `deep-integration-v2-p0`）· 不动 3172、未触碰正式 `data/`（verify-isolation 污染 0）
> 依据：`docs/design/deep-integration-v2-p0-dev.md`（P0 规格）

## 一、门禁汇总

| 门 | 命令 | 结果 |
|---|---|---|
| 构建 | `pnpm run build`（tsc 严格 + tsdown） | exit 0 |
| 全量单测 | `pnpm test`（vitest） | **26 文件 / 282 用例全绿** |
| 隔离门禁 | `node scripts/verify-isolation.mjs` | **76 脚本 / 76 通过 / 失败 0 / 污染 0**（176 资产 before=after） |
| P0 集成链 | `node scripts/verify-p0-integration.mjs`（本批新增） | **28/28 PASS**（真实命令 + 真实 JSON 落盘 + 溯源核验） |
| X6 落盘 | `node scripts/verify-reflect.mjs`（本批新增，分片C） | PASS（真实文件系统 done 钩子 + final/edit） |

说明：verify-isolation 曾报 verify-ui-feedback.mjs 失败——根因为 f2109a5（标签单一来源重构）后 tasks.tsx 不再含内联 `const taskStatus: Record<string,string> = {...}` 字面量，脚本断言陈旧（非 P0 回归，HEAD 上即失败）。已按当前契约最小修正该脚本断言（改从 `core/status.js` 导入 taskStatusLabels 校验键序），意图不变，重跑 76/76 全绿。

## 二、P0 集成链（verify-p0-integration.mjs 28 项，真实 Context + JsonStorageBackend 临时根 + 真实命令 handler）

种子：项目 p-0001 + 任务 t-0001~（需求梳理/原型设计/联调测试）+ 交付物；capture 观察模式用 `DSH_PM_E2E=1 capture-fixture` 确定性缝（不调模型、不落库，走真实命令路径）；无 LLM 环境验证的是命令层真实降级文案。

1. **K2 受限直写窄集**：`ask-apply` 写 `description`（备注）+ `evidenceUrl`（证据链接）→ 真实入库；`title` 仍被白名单拒（未知字段）；状态/进度未被 AI 直写改动（窄集只放纯文本/备注与证据链接，不扩状态/排期）。
2. **K4 对话补档**：`capture` 观察模式返回草稿且 **tasks 表零写入**；`capture-apply` 确认后 2 个任务真实落库（t-0004/t-0005），首个证据候选真实挂到 `evidenceUrl`，撤销路径=`/pm task delete` + 溯源留痕（不建第二 undo 体系）。
3. **K3 证据闭环**：`attach-evidence t-0003 <url>` 真实更新 `evidenceUrl`，返回文本明示「仅更新 evidenceUrl，未改动状态/进度/排期；操作已记入溯源账本」。
4. **X6-L1 即时复盘草稿**：`task update {status:done}` 后 reflections 表自动出现草稿（真实 JSON 落盘）；裸完成（无证据/清单/交付物）草稿含留白「待补：交付验收材料与证据链接」不编造；`final` 人定稿、`edit` 补材料（句级保守标注）；`reflect-list` 列出项目记录。
5. **K6 交付检查**：五类规则全命中（overdue-untouched / due-soon-untouched / done-open-checklist / done-missing-materials / progress-100-not-done），缺材料文案含「未覆盖≠未完成，最终验收由人判断」；只读不写。
6. **K12 自我计量**：`metric` 真实汇总 `{"total":3,"byKind":{"capture":2,"ask-apply":1},"undoOutcomes":{"undone":0,...},"appliedSteps":4,"pendingCount":0,...}`；只读小样本计数，不下结论。
7. **K9 会话结存**：`session bind` 真实写 sessions 表；同 task+session 重复 bind 合并 note、刷新 updatedAt 不建重复记录；`notes`/`list` 只读列出。
8. **溯源**：`ask-provenance` 账本含 `kind=capture` 与 `kind=ask-apply` 条目、状态 `confirmed`、pendingCount=0；磁盘核验 `tasks/t-0001.json` 含证据链接、sessions/reflections 目录有记录、ledger 含 capture 条目。

## 三、能力边界（验收口径核对）

- K2 仅备注/证据链接类受限直写（字段级白名单 + 类型闸），关键变化经 ask-apply 草稿确认后落库、ask-undo 可撤销；未开通第 3 项（approved-pending 队列）与 H5 扩界（状态/排期类不新增 AI 自动语义；既有 5 字段白名单保持现状）。
- K6 呈现层提示不代替人验收；X6 轻量草稿不进定稿流、业务完成（done）≠ 复盘定稿（final，只有人定稿）、证据不足留白不编造、无积分/连胜/动效/徽章、仅事件触发（updateTask done 钩子 best-effort，失败不阻断落库）。
- K9 单向结存非双向镜像；K3 只收会话内痕迹/单条确认挂接；K4 观察模式先行只展示不落库、人逐条确认才落库。
- H6 常驻推送本期不实现（P3 立项）；未改前端视图（P1：K11/K13）；未改上游宿主；未重启/未写 3172。

## 四、遗留与下一步（P1/P2 衔接）

- P1：K11 补记队列、K13 对话内投影（前端呈现层 + 现有数据基础已就绪）。
- deliverableId 的存在性/同项目校验（TaskDeliverableNotFound 类）本期未做（连接字段已可用），P1 补。
- K2 窄集跑通后由用户复核再扩界（第 3 项 + H5）。
- 真实 LLM 草稿质量（有 prod key 时 `capture`/`ask` 真实生成）留待用户真实实例复核。
