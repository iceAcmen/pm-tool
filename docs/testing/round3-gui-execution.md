<!--
Round3 真实 Chrome GUI 执行包。由独立测试专家维护，随本轮证据提交；其他角色不得改判定。
主执行端按本文逐条执行；测试专家据原始证据判定，不采信口述 PASS。
-->
# Round3 真实 Chrome GUI 执行包（pm-tool）

> 给谁：具备真实 Chrome 驱动能力的主执行端（puppeteer-core 驱动本机 Chrome，headless 或带界面均可）。
> 是什么：一套**可直接照做**的真实浏览器 GUI 验收用例。选择器、预期、证据命名、前后数据校验全部给定，**主端不要自行臆测选择器**。
> 判定权：测试专家据原始证据（截图/日志/网络）独立判定；主端口述"通过"不算数。

## 0. 版本纪律（最高优先级，先做）

- **代码基线**：仓库最新 HEAD = `01ecf4c`（本执行包基于此）。**但当前正在运行的正式 3080 服务仍是旧版 `a8e8ea4`**（未热更新）。
- **禁止混版本**：主执行端**必须先部署/构建被测版本**并记录实际被测 commit，再开测。步骤：
  1. 记录被测 commit：`git rev-parse HEAD` → 写入证据 `env.json` 的 `testedCommit`。
  2. 隔离实例先 `pnpm run build`（packages/dsh-pm-tool），用新 `lib/` 启动；确认被测 commit 与运行 bundle 一致。
  3. 若无法重建，只能对**已明确标注 commit** 的实例观测；不得用 3080 旧 a8e8ea4 的观测结果冒充 01ecf4c。
- `env.json` 必含：`testedCommit`、`nodeVersion`、`chromeVersion`、`profile`、`port`、`executedAt`、`mode=isolated|formal-smoke`。**严禁写入 token / API key / 任何 Authorization 头。**

## 1. 环境与隔离硬规则

- **正式实例（3080，p-0001~p-0004 真实数据）**：只跑 §3「S0 只读冒烟」，**禁止任何写/删/导入/恢复/导出落盘覆盖**。
- **写操作全量（§4 S1）**：必须另起**隔离实例**：
  - 独立 `DSH_HOME`（指向项目内隔离目录，如 `packages/dsh-pm-tool/.tmp/gui-e2e-home`）；
  - 独立端口（如 3082），不碰 3080；
  - 隔离 storage root、**隔离 backups 目录**：必须显式设环境变量 `DSH_PM_BACKUP_DIR=<隔离绝对路径>`（含空格亦可）。**注意**：`resolveBackupDirectory()`（core/backup.ts:22）仅在 `DSH_HOME` 之外独立解析；默认值硬编码为仓库级 `packages/backups/`，**设了 DSH_HOME 不等于隔离了 backups**。b2c8da3 起 web restore-content / CLI restore 未传 directory 时即回落到该 env；未设或空串/纯空白时回写共享 `packages/backups/`（隔离失败）。隔离实例启动时必须 export 此变量，且含空格路径勿靠 shell 拼接。
  - PoC 模型车道 + 测试 fixture（不触发生产 Key）。
- **fixture 数据**：在隔离 DSH_HOME 内预置 p-e2e 项目 + 若干任务/里程碑/风险/会议；**正式 p-0001~p-0004 不得有任何新增/改动/删除**。
- 每个用例执行前后，按 §6 做数据校验并落证据。

## 2. 通用通过标准（所有用例共同）

- 整轮：**0 console error、0 pageerror、0 失败请求、0 同源 4xx/5xx**（预期的负例/演练拒绝除外，需在该用例证据里标注"预期拒绝"）。
- 每个交互：DOM 变化 + **落盘读回**双确认（不能只看界面闪了一下）。
- 截图：每个用例至少 1 张关键截图；命名见 §5。

## 3. S0 只读冒烟子集（正式 3080，只观察不写）

| ID | 优先级 | 步骤（选择器给定） | 精确预期 | 证据 |
|---|---|---|---|---|
| S0-01 | P0 | 侧栏点击含"项目管理"的 panelRow（文本"PM"/"项目管理"） | 面板展开，七类实体表格渲染，无白屏 | `s0-01-panel.png` |
| S0-02 | P0 | 顶栏存在 `总览看板`/`新建项目`/`更多`/`刷新` | 4 个主按钮；备份/恢复/导出收在`更多`菜单内 | `s0-02-topbar.png` |
| S0-03 | P0 | `select[aria-label="切换项目"]` 下拉 | 列出 p-0001~p-0004；切换后项目条刷新 | `s0-03-projects.png` |
| S0-04 | P0 | 逐一点 `.pm-tab`：全部任务/里程碑/风险与问题/会议纪要/进度汇报/交付物/项目概览 | 七页均渲染、无 console error | `s0-04-tabs-*.png`(7) |
| S0-05 | P1 | `.pm-war-room` 出现，`[data-kpi]` 有 6 个数字卡 | KPI 数字与正式数据一致 | `s0-05-warroom.png` |
| S0-06 | P1 | `.pm-gantt` 出现：`.pm-gantt-bar`/`.pm-gantt-milestone`/`.pm-gantt-today` | 任务条、里程碑菱形、今日线都在轴上 | `s0-06-gantt.png` |
| S0-07 | P1 | 浅/深主题各切一次 | 全部表格/标签/抽屉跟随，可读不串色 | `s0-07-light.png`/`s0-07-dark.png` |
| S0-08 | P1 | 窗口收窄 390px | 页面根无横向溢出；表格区内部横滚；`.pm-tab` 不中文断行 | `s0-08-390.png` |

## 4. S1 隔离实例写操作全量（新建 DSH_HOME/3082）

> 前置：隔离实例 + fixture（p-e2e，含任务树 3 层、1 里程碑、1 风险、1 会议、1 汇报、1 交付物）。

### 4.1 项目记忆与七实体 CRUD / 直达
| ID | 优先级 | 步骤 | 精确预期 | 证据/前后校验 |
|---|---|---|---|---|
| S1-01 | P0 | 切到 p-e2e → 刷新页面 → 读 `select[aria-label="切换项目"]` 值 | 刷新后仍回填 p-e2e（项目记忆） | `s1-01-mem.png`；前后 localStorage 快照 |
| S1-02 | P0 | 全部任务页新建根任务/子任务/三级任务 | WBS 编号 1/1.1/1.1.1 正确；重启读回仍在 | `s1-02-wbs.png`；前后 tasks/*.json 数量差=新增数 |
| S1-03 | P0 | 提醒条点一条逾期项 `[data-open-record][data-open-type][data-open-id]` | **切项目 + 切"全部任务"tab + 右侧打开该任务抽屉**（非只切项目） | `s1-03-reminder-direct.png`；抽屉标题=该任务 |
| S1-04 | P0 | 总览看板全局搜索输入关键字 → 点一条里程碑命中 | 切项目 + 切"里程碑"tab + 打开该里程碑抽屉 | `s1-04-search-direct.png` |
| S1-05 | P0 | 里程碑/风险/会议/交付物各做一次新增+编辑+删除(confirm) | 状态/筛选正确；删除 confirm 后记录消失；取消 confirm 记录仍在 | 各 `s1-05-*.png`；前后对应表 json 数 |

### 4.2 任务树 / 键盘 / 行内编辑
| ID | 优先级 | 步骤 | 精确预期 | 证据 |
|---|---|---|---|---|
| S1-06 | P0 | 任务页"树"视图：父节点折叠/展开 | 子行隐藏/显示；状态看板可切回 | `s1-06-tree.png`/`s1-06-collapse.png` |
| S1-07 | P0 | 树内键盘：j/k 移动、空格勾选、Del 删除、Enter 打开 | 焦点行正确移动；勾选状态落库；Del 需 confirm；输入框聚焦时键盘不触发 | `s1-07-kbd.png` |
| S1-08 | P0 | 行内编辑：任务行状态下拉改 done、进度步进、日期改 due | **立即落盘**：表格刷新 + 重启读回一致；不与 j/k 冲突 | `s1-08-inline.png`；前后 tasks/*.json 该字段 diff |

### 4.3 作战室 / 甘特
| ID | 优先级 | 步骤 | 精确预期 | 证据 |
|---|---|---|---|---|
| S1-09 | P1 | 作战室：6 个 `[data-kpi]`、议程按日期升序逾期在前、`[data-risk-cell]` 高概率高风险落红格、closed 风险不入格 | 数字与 fixture 一致；矩阵归格正确 | `s1-09-warroom.png` |
| S1-10 | P0 | 甘特：拖一条 `.pm-gantt-bar` 平移 2 天 | **读盘验证**：该任务 start/due 落库为 +2 天；刷新后条位置移动；start≤due | `s1-10-drag-before.png`/`s1-10-drag-after.png`；前后 tasks json 日期 diff |

### 4.4 AI 副驾（隔离 PoC 车道，正式实例不开）
| ID | 优先级 | 步骤 | 精确预期 | 证据 |
|---|---|---|---|---|
| S1-11 | P0 | AI 助手抽屉：问"这项目哪要炸"（PoC 只读） | 返回中文诊断；**不写库**（前后 tasks/*.json 数量不变） | `s1-11-ask-ro.png`；写计数=0 |
| S1-12 | P0 | 让它改某任务负责人 → 出草稿卡 → 点**取消** | 草稿丢弃；**领域无新增/变更**；assignee 不变 | `s1-12-ask-cancel.png`；前后 domain deepEqual |
| S1-13 | P0 | 同一草稿卡点**确认入库** | assignee 落库；再点一次=幂等拦截（不重复写） | `s1-13-ask-confirm.png` |
| S1-14 | P1 | 危险拒绝：草稿含非法日期/跨项目改他人记录 | 后端拒绝，合法项仍落、非法项被拒，台账不脏 | `s1-14-danger-reject.png` |
| S1-15 | P1 | WBS/汇报叙述/会议纪要三模式：生成草稿→**编辑草稿文本**→确认入库 | 草稿可编辑；入库内容=编辑后文本；重启读回 | `s1-15-draft-edit.png` |

### 4.5 导入 / 导出 / 备份恢复
| ID | 优先级 | 步骤 | 精确预期 | 证据 |
|---|---|---|---|---|
| S1-16 | P0 | `.pm-import-dropzone` 上传 CSV（含空格/父子）→ `.pm-import-preview` → `.pm-import-confirm` | 预览显示父子树；confirm 落库；重启读回层级正确 | `s1-16-csv.png`；前后 tasks 数 |
| S1-17 | P0 | 同上传 XLSX | 同上 | `s1-17-xlsx.png` |
| S1-18 | P1 | 顶栏更多菜单：导出 MD / 导出 JSON | 文件下载成功；MD 含摘要/异常、JSON 含七实体不含 checks | `s1-18-export.png`；下载文件入证据 |
| S1-19 | P0 | `.pm-backup-btn` 备份 → `.pm-restore-btn` 选备份先**取消** | 取消不恢复，数据不变 | `s1-19-restore-cancel.png` |
| S1-20 | P0 | 再 restore **confirm**（先往库里加一条制造漂移）。**前置**：实例已 export `DSH_PM_BACKUP_DIR=<隔离绝对路径>` | 恢复后回到备份快照；**恢复前自动安全快照必须落在 `DSH_PM_BACKUP_DIR` 隔离目录**（证据：该目录出现新快照文件）；坏文件选择被拒；**跑完后仓库共享 `packages/backups/` 文件数仍 81、无新增 mtime**（证明安全快照未回写共享目录） | `s1-20-restore-confirm.png`；前后 tasks 数；隔离目录新快照文件证据；`packages/backups` 前后清单 hash 比对 |

> **S1-20 状态（R3 复测 648a7aa）**：演练已通（R3-DEF-001 关闭），但网页**无确认/取消按钮**（DOM confirms=[]/dialogs=0，panel.tsx onChange 仅 dry-run）——判 **R3-DEF-003 P0/FAIL**，S1-20 confirm 仍不可达，待开发补页面内 restorePreview+确认/取消后端到端重测。R3-DEF-002 为休眠网络瞬断观察项、非产品 FAIL。

### 4.6 更多菜单 / 空态 / 加载 / 文案 / 主题 / 尺寸
| ID | 优先级 | 步骤 | 精确预期 | 证据 |
|---|---|---|---|---|
| S1-21 | P1 | 打开`更多`菜单 | 备份/从备份恢复/导出MD/导出JSON 均在菜单内可用 | `s1-21-more.png` |
| S1-22 | P1 | 空项目/空表：各 tab | 显示空态提示（"暂无…"）非白屏/非报错 | `s1-22-empty.png` |
| S1-23 | P1 | 触发 AI/导出时观察 loading | 有加载反馈；失败有中文 error 提示，无未处理异常 | `s1-23-loading.png`/`s1-23-error.png` |
| S1-24 | P1 | 全界面抽查文案 | 简体中文、无英文残留/undefined | `s1-24-copy.png` |
| S1-25 | P0 | 桌面宽屏(≥1280) + 390 窄屏各过一遍七 tab | 宽屏不破版；窄屏无横向溢出、tab 不换行断字 | `s1-25-*.png` |
| S1-26 | P0 | 浅/暗主题各过七 tab + 抽屉 | 跟随 dsh 主题、可读、无对比度失效 | `s1-26-*.png` |
| S1-27 | P1 | 抽屉打开→关闭后焦点与页面状态 | 无残留焦点陷阱；无数据误写 | `s1-27-focus.png` |

## 5. 证据结构（入仓库，禁含 token/key）

```
docs/verification/gui-round3-<UTC时间戳>/
├── env.json              # testedCommit/node/chrome/port/mode；严禁 token/key
├── console.log           # 整轮 console/pageerror/failed-request 汇总
├── before/ after/        # 关键实体 json 前后快照（隔离实例）
├── s0-*.png s1-*.png     # 按上表命名
└── SUMMARY.md           # 主端自填每用例实际结果+证据链接（仅参考，非判定）
```

- 截图必须真实可交付（非占位）。
- `env.json`/`console.log` 里**不得**出现 token、API key、Authorization 头、`?token=` 的完整值（URL 可脱敏为 `?token=***`）。
- 主端跑完把证据目录交测试专家；专家**逐张截图 + console.log + 前后 json diff** 判定，不看主端 SUMMARY 口述即可下结论。

## 6. 前后数据校验（每个写用例必做）

- 写操作前：导出该实体表文件清单（数 + 关键 json 内容）→ `before/`。
- 写操作后：同清单 → `after/`。
- 断言：增量=预期新增数；被删记录消失；被改记录字段=界面值；**正式 p-0001~p-0004 的任何文件 mtime 不得改变**（证明未污染正式库）。

## 7. 判定（测试专家）

- 全部 P0/P1 用例证据齐全且符合精确预期、console/network 干净 → 该类 PASS。
- 任一未实测 / 实测不符 / 无原始证据 → FAIL 或 BLOCKED，不放行。
- 解除历史 BLOCKED：仅当本包真实证据齐全，测试专家才把 网页实测/页面样式/用户体验 三类由 BLOCKED 改为 PASS，并据 ADL-045 给出总门结论。

---

## 8. 剩余清单（按最新审证，2026-10-12 收尾）

已 PASS（证据在 docs/verification/gui-round3-*）：插件加载/项目记忆/作战室/甘特拖拽+1天/提醒直达/搜索里程碑直达/行内编辑/副驾取消字节一致+确认落盘+拒非法/CSV·XLSX 父子/空态/备份隔离/恢复完整链/树折叠+勾选/WBS·汇报·纪要 AI 草稿编辑与 notes 可读可编辑。

**仍待执行/复测（未完成不放行）：**
1. **CTA 对比度**：真浅色（白底）+ 真深色各 1 张截图，量测文字≥4.5、组件≥3；3091 误判已回退，需重测。
2. **逐实体 GUI 全 CRUD**：projects（含删除保护）、milestones（达成/日期）、risk_issues（矩阵归格/闭环）、meetings（结构化）、deliverables（版本历史）、tasks（新建+删除级联）、reports（渲染/编辑/删除，snapshot 只读）。每实体至少新建落盘+删除落盘。
3. **键盘全量**：k 反向、Escape 关闭、Space 勾选、Del 删除流（j/Enter 已证）。
4. **390 窄屏**（此前 session 失效未测）。
5. **桌面宽屏完整遍历 + 焦点陷阱**。
6. **正式 3080 只读冒烟**：先把 3080 升级到被测提交再观测。
7. 观察项：favicon 404、网络瞬断（非核心，仅记录）。
