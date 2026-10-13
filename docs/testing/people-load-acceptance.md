<!--
人员与负载视图验收矩阵（开发前冻结门）。独立测试专家所有，ADL-045 / ADL-047 / AGENTS 6A。
其他角色（产品 PM / 开发）：只读引用，不得改本文件任何用例、步骤、断言与判定。
开发未开始前，全部用例初始 = NOT_RUN；PASS/FAIL/BLOCKED/MANUAL_PENDING 只能由测试专家实测后填。
-->
# 人员与负载视图 · 验收矩阵（People-Load Acceptance，开发前冻结）

> 是什么：PROD-07/08「跨项目按人负载视图」升级定稿（产品契约见 `docs/product/07-people-load-view-design.md`）在 **v0.5.0 = `81c5a11`** 基线之上的开发前冻结验收门，归属 **v0.5.1 体验增量**。
> 给谁：开发照此实现；有 GUI 执行能力的主端按本文采集原始证据；**PASS/FAIL 只由测试专家审证后给出**。
> 范围纪律：本门**只覆盖人员与负载视图 P0 范围**；旧 H1–H6（v0.5.0 发布收尾四块门）已在 `release-closeout-acceptance.md` 闭环，**不在本门重复、不作为本门阻塞项**；P1（相似名软提示 / j-k 卡片导航 / localStorage 记忆 / owner 涉众）**不在本门验收范围**。

## 0. 冻结口径（对齐 `07-people-load-view-design.md` 契约 + P0 决策；以此为准）

1. **顶层「人员」tab**：与既有 8 个 tab（全部任务/里程碑/风险问题/会议/汇报/交付物/项目概览/甘特）**同级并列**；进入即聚合**全部项目**，不要求先选项目；不藏在 GlobalBoard 弹层里。
2. **数据源 = 全量 `data.tasks` + `data.projects`，仅统计未完成任务**（`status!=='done' && (progress??0)<100`）。**不**计里程碑/交付物/风险（无 task assignee）；不统计 `project.owner`/`riskIssues.owner`/`meetings.participants`（P1）。仅列出有 **≥1 个 open 任务**的人。
3. **不改 schema**：纯前端 / 纯函数从 snapshot 派生；**不建人员表、不持久花名册、不新增表/列、不升 domain、不动 `core/task.ts`/`core/storage.ts`**。
4. **归一化分组键**：`trim()` → 折叠内部连续空白为单空格 → `casefold()`（大小写不敏感；中文无副作用）。**展示名 = 组内出现次数最多的原始写法，并列取最先出现（首见）**；不自动合并「张三/张 三/zhangsan」——按归一化精确串分组。
5. **多负责人不拆**：`"张三,李四"` 这类串按**原样整体入一个桶**，不做逗号/顿号切分；该组合组打 `multiOwner` 标，任务只计入这一桶，**不得重复计入拆分后的个人组**。
6. **done 判定**：`status==='done'` 或 `progress>=100` → 完成，**不计入负载**（与 `core/reminders.ts`/`stats.ts` 同边界）。
7. **未分配桶固定置顶**：归一后仍为空的 open 任务收入「⚠ 未分配」，作为一等风险区**固定排在人员列表第一位**，不参与人名风险排序。
8. **默认风险排序**：逾期数 desc → **受阻数(=blocked) desc** → 临期数 desc → **最近截止 asc** → 未完成总数 desc；同级以归一化键字典序兜底保证确定。另给排序下拉（按风险 / 按未完成数 / 按姓名）。
9. **临期/逾期窗口**：逾期 = open 且 `dueDate<今天`；临期 = open 且 `0≤daysUntil≤7`、未逾期；注入固定 `today` 可复算（第 7/8 天边界正确）。
10. **只读直达**：点任务行复用既有 `openRecord(projectId,'task',id)`——切项目→切「全部任务」tab→打开任务抽屉；**本视图零写库**，不下发任何 `execute()` 写命令；不在本视图内改派负责人。
11. **受阻口径**：`blocked` 是独立风险信号；`'只看有风险'` = 隐藏 逾期=0 且 **受阻=0** 且 临期=0 的人。**不得复抄 `war-room.ts` 的 `'doing'` 笔误，真实枚举为 `in_progress`**。

## 1. 分层与判定图例（与 ADL-045/047 严格一致）

- **自动化门（AUTO）**：离线表驱动（纯函数 + 零写/不碰 schema 静态检查）。脚本全绿即该项 PASS 可推进；**FAIL 仍阻塞**。
- **GUI 门（GUI）**：真实浏览器实测硬门槛；**离线纯函数 / HTTP 200 不得替代网页实测 PASS**。
- **人工协作门（MANUAL_PENDING）**：必须用户本人配合才能验者，既不算 PASS 也不阻塞自动化；用户反馈失败即重开缺陷。
- **状态**：`PASS` / `FAIL` / `BLOCKED` / `NOT_RUN` / `MANUAL_PENDING`。开发前本矩阵**全部 NOT_RUN**。
- `FAIL / BLOCKED / NOT_RUN` ≠ 通过；结论必须绑定 `testedCommit` 与证据路径；新提交使受影响项过期须重测后再引用。

## 2. 证据格式

- **自动化证据**：`node scripts/verify-people-load.mjs`（开发新增，断言分组数/各计数/排序首位/固定 today 边界）退出码 `0`；同输入跑两次 `diff` 为空（确定性）。记录命令、退出码、覆盖点。
- **GUI 证据**：隔离实例（独立 `DSH_HOME` + 独立端口 + `DSH_PM_BACKUP_DIR`，**不碰 3080 正式数据**）；每用例 `env.json`（`testedCommit`/`nodeVersion`/`chromeVersion`/`port`/`executedAt`，**禁写 token**）+ 截图 + 关键控件 `outerHTML` dump + `data-*` 断言行。目录 `docs/verification/gui-people-load-<ts>/<CASE_ID>/`。
- **零写证据**：GUI 用例前后对隔离 storage 做 mtime/sha 对比，证明视图操作未写任何业务 JSON；网络面板仅 `web snapshot` 读。

---

## 3. 纯函数层冻结用例（自动化门 AUTO）

> 被测对象：`groupOpenTasksByAssignee(tasks, projects, today?)`（建议 `src/core/people-load.ts`）。入参可注入 `today`，出参确定。

| CASE_ID | 最小步骤 / 输入 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| PL-PURE-01 | tasks: `张三 `（尾空格）与 `张三` | trim+折叠+casefold 后同键、合并一组；不计 done | AUTO | NOT_RUN |
| PL-PURE-02 | 组内多条原始写法：`Zhang San`×2、`zhang san`×1（同归一键） | 同组合并；**展示名 = 出现次数最多者 `Zhang San`**；若次数并列则取最先出现 | AUTO | NOT_RUN |
| PL-PURE-03 | `李四` 与 `李四`（全角空格） | 全角/半角内部空白均折叠为单空格，归同组 | AUTO | NOT_RUN |
| PL-PURE-04 | 多人 open 任务混合状态/优先级/跨项目 | 每卡产出完整指标：未完成总数、待办/进行中/受阻分段、逾期数、临期数、**受阻数**、**P0 未完成数(priority==='P0')**、**跨项目数(distinct projectId)**、**最近截止(无则—)**；计数仅来自 open `tasks.assignee` | AUTO | NOT_RUN |
| PL-PURE-05 | open 任务 assignee='' 与 '   '（纯空白） | 二者归一后空 → 同入「未分配」桶；**固定排在人员列表第一位**，不参与风险排序 | AUTO | NOT_RUN |
| PL-PURE-06 | A `status=done`；B `progress=100`；C `progress=100&&status=todo`；D 仅 done 任务者 | 四者**都不计负载**；只有 ≥1 open 任务的人才成卡；D 不出现在列表 | AUTO | NOT_RUN |
| PL-PURE-07 | 注入固定 today：dueDate=昨天 / 今天 / 今天+7 / 今天+8（withinDays=7） | 正确分级 逾期 / 临期(0≤d≤7) / 远期(d>7)；**第 7 天仍临期、第 8 天转远期**（边界正确）；与 R16 同口径 | AUTO | NOT_RUN |
| PL-PURE-08 | 同输入跑两次；另起全新进程再跑 | 分组数/计数/展示名/排序首位逐字节一致；跨进程重启读回不变（确定性） | AUTO | NOT_RUN |
| PL-PURE-09 | P1(逾期2受阻1)、P2(逾期0受阻3临期1)、P3(逾期0受阻0临期5)、P4(全0但open9)、未分配 | 顺序：**未分配置顶 → P1 → P2 → P3 → P4**（逾期 desc → 受阻 desc → 临期 desc → 最近截止 asc → 总数 desc）；同级归一化键字典序兜底 | AUTO | NOT_RUN |
| PL-PURE-10 | open 任务 assignee=`张三,李四`（含分隔符） | **不切分**：整体入单一组合组一次，带 `multiOwner=true`；**不得**在 `张三`/`李四` 个人组重复计入该任务 | AUTO | NOT_RUN |
| PL-PURE-11 | `张三,李四` 与 `张三 和 李四` | 各自独立成组合组；**不得**与单人组 `张三` 合并 | AUTO | NOT_RUN |
| PL-PURE-12 | 同一 assignee 在 p-A、p-B 各有 open 任务 | 跨项目合并到人组；**跨项目数=2**；任务条目各自带来源项目名 | AUTO | NOT_RUN |
| PL-PURE-13 | 空输入：无 task / 全部任务 done | 返回空人员列表（无 NaN/undefined 计数、不抛异常）；仅 open 任务空 assignee 时才有「未分配」桶 | AUTO | NOT_RUN |
| PL-PURE-14 | 含 `blocked` 状态 open 任务 | 受阻数正确累加；受阻参与默认排序与「只看有风险」判定；枚举用 `in_progress` 非 `doing` | AUTO | NOT_RUN |

## 4. Web 视图层冻结用例（GUI 门）

> 被测：`panel.tsx` 新增顶层「人员」tab + `<PeopleView>`。隔离实例实测；主端按实现后实际 `data-*` 核对，不臆测选择器。

| CASE_ID | 最小步骤 | 必含断言（缺一不可 PASS） | 门 | 状态 |
|---|---|---|---|---|
| PL-WEB-01 | 打开面板 → 点顶层 tab「人员」 | 「人员」与既有 8 tab **同级并列**；**不先选项目**即显示跨项目聚合全量；不藏在 GlobalBoard 弹层 | GUI | NOT_RUN |
| PL-WEB-02 | 进入人员视图 | 人员卡跨项目合并：同人多项目 open 任务合一，条目带 `[项目名]` chip；每卡显示 §四全部指标（逾期/受阻/临期/P0/跨项目数/最近截止） | GUI | NOT_RUN |
| PL-WEB-03 | 顶栏项目选择器在本视图为「项目:全部▾」过滤器，选某项目 | 默认「全部项目」；选定后仅聚合该项目 open 任务；切回全部恢复；过滤不改变风险排序相对位 | GUI | NOT_RUN |
| PL-WEB-04 | 搜索框输入负责人子串 | 实时过滤人员卡；大小写/首尾空格漂移仍命中（同归一化口径）；清空恢复全量 | GUI | NOT_RUN |
| PL-WEB-05 | 勾选「只看有风险」 | 仅保留 逾期>0 或 **受阻>0** 或 临期>0 的人；三者皆 0 的人隐藏；取消恢复 | GUI | NOT_RUN |
| PL-WEB-06 | 排序下拉切「按风险 / 按未完成数 / 按姓名」 | 默认按风险；切「按未完成数」「按姓名」列表顺序相应变化且确定；回归默认仍是风险序 | GUI | NOT_RUN |
| PL-WEB-07 | 4 类空态：①无任务/无项目 ②全完成 ③筛选后无人 ④有 open 但空 assignee | ①②③ 分别显示 §八对应文案；④ 空 assignee 常显「⚠ 未分配」置顶卡；无报错、console 无未捕获异常 | GUI | NOT_RUN |
| PL-WEB-08 | 人员卡 `<button>` 展开/收起 | 卡片为可聚焦 `<button aria-expanded>`，`outerHTML` dump 证明属性随 true/false 同步翻转（不以目测为准）；展开显示跨项目 open 任务、逾期置顶 | GUI | NOT_RUN |
| PL-WEB-09 | 点某任务行 `›` | 复用 `openRecord`：切到该任务 projectId、切「全部任务」tab、打开任务抽屉（断言行 `data-*`）；找不到记录安全回退不崩溃 | GUI | NOT_RUN |
| PL-WEB-10 | 全程查网络面板 + storage mtime/sha | 本视图**零写**：仅 `web snapshot` 读，无写命令；隔离 storage 业务 JSON 前后 mtime/sha 不变；不在本视图改派负责人 | GUI | NOT_RUN |
| PL-WEB-11 | 收窄窄窗（真 viewport ~390px 或窄侧栏） | 优雅降级：人员卡**纵向堆叠**、任务表可**横滚**；无横向溢出/文字重叠/裁切，关键数字可读（不要求独立移动布局） | GUI | NOT_RUN |
| PL-WEB-12 | 纯键盘：Tab 聚焦顶层 tab → Enter/Space 激活「人员」→ Tab 到过滤器/搜索/只看风险/排序 → Enter/Space 展开人员卡 → Tab+Enter 打开任务 | 全为**标准原生控件**（button/input/select，可 Tab 聚焦、Enter/Space 触发），无鼠标依赖自定义 div-onclick；焦点可见；`aria-expanded` 键盘翻转正确（j/k 卡片导航属 P1，本门不要求） | GUI | NOT_RUN |

## 5. 非功能门（AUTO + GUI）

| CASE_ID | 断言 | 门 | 状态 |
|---|---|---|---|
| PL-NF-01 | **零写**：派生纯函数化，视图只读 snapshot，不调任何 task create/update/delete 写命令；自动化 grep 该模块无写命令串；GUI 见 PL-WEB-10 | AUTO+GUI | NOT_RUN |
| PL-NF-02 | **不改 schema**：不新增/改任何 record schema、domain table、存储列；`taskRecordSchema`/`storage.ts` domain 版本未动；`verify-storage.mjs`/`verify-web.mjs` 既有契约全绿 | AUTO | NOT_RUN |
| PL-NF-03 | 既有回归不破：`pnpm run build` + 包内全部 `scripts/verify-*.mjs` 退出码 0（含新增 `verify-people-load.mjs`）；新控件带稳定 `data-*`/语义 class 供 verify-web 断言行 | AUTO | NOT_RUN |

## 6. 不擅判 / 留待实测项

- 真实「过载体感」、是否需要可调风险阈值属产品偏好；需用户主观确认者登记 `MANUAL_PENDING`，**不阻塞**自动化门。
- 窄窗以真 viewport 复测为准；容器人工拉宽不算 viewport（沿用 Round3 口径）。
- `multiOwner` 分隔符集合落地后由主端在证据列出实际识别字符，专家核对是否覆盖 `,，、；;/／和及`，不达标转 FAIL。
- P1 项（相似名软提示、j/k、localStorage 记忆、owner 涉众）不在本门；若开发顺手改了 `war-room.ts` 的 `'doing'→'in_progress'`，另起独立验证，不混入本门判定。

## 7. 当前判定（开发前）

- 纯函数 14 项 / Web 12 项 / 非功能 3 项 = **29 项，全部 NOT_RUN**。
- 被测参考基线：`81c5a11`（v0.5.0 已发布态）；**实际被测提交以执行时 `testedCommit` 为准**。
- **总门：NOT_PASS（开发前冻结，等待 v0.5.1 实现后逐项实测）。**
