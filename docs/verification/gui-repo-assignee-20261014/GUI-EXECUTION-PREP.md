# v0.7 T7/T8 GUI 执行准备包（待新 hash 后启动）

> 独立测试专家准备，**不启动服务、不改产品**。
> 冻结基线：开发补两个低风险加固后新 client hash 待确认。
> 隔离端口：3096（独立 DSH_HOME/DSH_PM_BACKUP_DIR，不碰 3080/3091/正式 data）。

## 0. 启动前检查清单（pre-flight）

- [ ] 新 client `lib/client.js` SHA 已确认并记录
- [ ] `pnpm build`=0
- [ ] `verify-task-repo.mjs` / `verify-person-candidates.mjs` 重跑受影响项全绿
- [ ] `verify-isolation.mjs` 正式 data/backups/exports 零污染
- [ ] 隔离 DSH_HOME 目录已建（空目录，不碰正式 `~/Library/Application Support/pm-tool`）
- [ ] 启动命令：`DSH_HOME=<isolated> DSH_PM_BACKUP_DIR=<isolated>/backups node packages/dsh-pm-tool/bin.js --port 3096`

## 1. 隔离种子数据（seed）

启动后通过 `pm-cli` 或 HTTP API 写入以下种子：

- 项目 A（`proj-a`）：owner=`Alice`
- 项目 B（`proj-b`）：owner=`Bob`
- 任务 t1（项目 A）：assignee=`alice`（小写，与 Alice 归一合并）
- 任务 t2（项目 B）：assignee=`张三,李四`（多负责人串不切分）
- 风险问题 r1（项目 A）：owner=`ALICE`（全大写，与 Alice 归一合并）
- 交付物 d1（项目 B）：owner=`Bob`
- 会议 m1（项目 A）：participants=`["Alice", "  alice  ", "张三"]`
- 任务 t3（项目 A）：repoUrl=`https://github.com/org/r.git`、branch=`main`（用于 T7-W5 链接点击）
- 交付物 d2（项目 B）：repoUrl=`https://gitlab.com/org/d.git`、branch=`develop`

## 2. 4 项 GUI NOT_RUN 用例

### T7-W5：真实浏览器端到端冒烟

**步骤**：
1. 打开 `http://127.0.0.1:3096`，进入项目 A
2. 打开任务 t3 详情，断言只读链接行存在：`data-repo-link`、anchor href=`https://github.com/org/r.git`、`target=_blank`、`rel=noopener noreferrer`、branch 显 `@main`
3. 点击 anchor，断言新窗口打开
4. 进入项目 B，打开交付物 d2 详情，断言链接行存在且 branch=`@develop`
5. 重启宿主进程，重新打开 t3 详情，断言链接值未变

**证据**：
- `T7-W5-task-detail-link.png` — 任务详情链接行截图
- `T7-W5-deliverable-detail-link.png` — 交付物详情链接行截图
- `T7-W5-restart-readback.txt` — 重启后读回值

**通过门槛**：链接可开新窗口、两实体往返一致、正式 data/ 与 3080/3091 零触碰。

---

### T8-W2：点选候选回填

**步骤**：
1. 打开项目 A 任务抽屉（新建或编辑）
2. 执行人 input 展开 datalist 下拉
3. 点击候选 `Alice`
4. 断言 input 值回填为 `Alice`（原始大小写形态）

**证据**：
- `T8-W2-datalist-open.png` — datalist 展开截图
- `T8-W2-after-select.png` — 点选后 input 值截图

**通过门槛**：回填展示写法（含原始大小写/空白形态），不被归一化值覆盖。

---

### T8-W4：候选随最新 snapshot 刷新

**步骤**：
1. 打开项目 A 任务抽屉，记录 datalist 候选列表
2. 关闭表单
3. 通过 API 或 CLI 把任务 t1 的 assignee 从 `alice` 改为 `全新人名`
4. 重新打开任务抽屉，展开 datalist
5. 断言 `Alice` 候选仍在（来自 project.owner/riskIssue.owner/participants），`alice` 写法已合并

**证据**：
- `T8-W4-before-change.png` — 修改前候选列表
- `T8-W4-after-change.png` — 修改后候选列表

**通过门槛**：新候选出现、被删写法消失，不缓存过期候选。

---

### T8-W6：真实浏览器端到端

**步骤**：
1. 打开项目 A 任务抽屉
2. 展开执行人 datalist
3. 断言候选区只有 **1 个** Alice 条目（`Alice`/`alice`/`ALICE`/`  alice  ` 全部合并）
4. 在 input 手动输入 `新人王五`，保存任务
5. 重启宿主，重新打开该任务，断言 assignee=`新人王五`
6. 断言正式 data/ 目录零污染（sha256+mtime 对比启动前）

**证据**：
- `T8-W6-candidates-merged.png` — 合并后候选截图（只有 1 个 Alice）
- `T8-W6-free-input-saved.png` — 自由输入保存后读回
- `T8-W6-formal-data-clean.txt` — 正式 data 零污染对比

**通过门槛**：trim/casefold 合并生效、自由输新人保存成功、正式 data/ 零污染。

## 3. 证据命名约定

- 截图：`<CASE_ID>-<描述>.png`（如 `T8-W6-candidates-merged.png`）
- 文本证据：`<CASE_ID>-<描述>.txt`
- 汇总：`SUMMARY-findings.md`（逐项 PASS/FAIL/BLOCKED + 证据链接 + 失败复现步骤）

## 4. 完成后回填

- 矩阵 `docs/testing/repo-link-assignee-completion-acceptance.md` 对应 CASE 状态改为 PASS/FAIL/BLOCKED
- 更新 §0.0 汇总计数
- 跑敏感扫描 + git status 确认只改 docs/testing/ 与 docs/verification/
