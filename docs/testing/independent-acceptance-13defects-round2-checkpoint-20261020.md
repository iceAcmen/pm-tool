# PM 工作台 13 项缺陷独立验收 · R2 检查点（隔离实例实测，非定论）

- 验收人：独立验收代理（非作者）；时间 2026-10-20 晚；本机实机 macOS，非云 VM。
- 被测基线（声明）：HEAD `06a131cd5fdc4486dd74afe89cc4c5630f0a4c98`。
- 状态口径：PASS / FAIL / BLOCKED / NOT_RUN 严格分列；本检查点仅记录已获实机证据项，未测项不预判。
- 安全边界：正式 3172（PID 44388）全程未重启、未改 pm profile 软链、未改真实 data/11 卡/配置/凭据；仅在本代理 scratch 隔离实例与隔离存储根内写最小脱敏 fixture。

## 0. 隔离实例身份（已核验）

| 项 | 值 | 证据 |
|---|---|---|
| 隔离端口 / 监听 PID | 3199 / node PID 77548（pnpm 父 77505） | `lsof -nP -iTCP:3199 -sTCP:LISTEN` |
| cwd | `/Users/bytedance/Projects/dsh-pm/deepseek-harness`（上游只读） | `lsof -p 77548` cwd 列 |
| argv | `node --import tsx/esm apps/cli/src/bin.ts --profile pm --patch <scratch>/storage-override.yml --host 127.0.0.1 --port 3199 --no-open` | `ps -o command -p 77548` |
| 存储根覆盖 | scratch `…/agents/s_000ElkeZqJ2/isolated/data`（`--patch` 在 `--host/--port` 前才被启动器识别；置于内层参数后会报 `unknown option '--patch'`） | `--dump-config` 输出 storage-json root=scratch |
| 磁盘隔离 | scratch 生成 `workspace.json`；真实 `pm-tool/data/pmtool` 在测试窗口内零新增写（`find -newermt` 空） | bash 核验 |
| 构建 | `pnpm run build`（tsc+tsdown）exit 0，产物含 `pt-code-val`×4 | 见 §3 |

## 1. 关键阻塞（必须先解决，否则不给干净 PASS）

### B-1 工作树正被实时改动，3199 测的是移动 WIP，非干净 HEAD（BLOCKED · 干净定论）
- `git status` 显示被测包 `packages/dsh-pm-tool` 存在未提交修改，且正是设计者在修的 P1 区域：
  - `src/core/ui-feedback.ts`（反馈双轨：裸 setMessage 常驻大卡 / 中文关键词误判）
  - `src/client/views/okr-form.tsx`（objective 选择器仅 objective，后端/payload 支持 KR）
  - 另 `tasks.tsx / tasks.css / panel.tsx / growth-form-props.ts` 等同步改动。
- 后果：23:12 构建、23:15 启动的 3199 加载的是「脏工作树某一刻」，不是提交态 06a131c；设计者后续编辑可能在我测量后继续变化，证据不可冻结。
- 解锁建议（不在本轮擅自执行）：在本代理 scratch 建 detached HEAD 06a131c 独立 worktree + 干净构建，并用独立 profile/patch 把插件解析到该 worktree，避免复用 pm 软链；待设计者两处修完、基线冻结后再复测得干净 PASS/FAIL。

### B-2 3172 加载版本仍未证实（BLOCKED · 版本证据）
- 前端标记计数一致 ≠ 精确版本一致；后端 16:57 启动时刻 ≠ 证明未热加载。
- 本轮仅在隔离 3199 实测，未对 3172 下版本结论；3172 行为不得等同 HEAD。需真实 RPC 功能签名 / 加载机制 / 无秘密日志证实，不能仅凭启动时刻。

### B-3 无继承用户截图（证据缺口，持续成立）
- session/workspace `/attachments/` 为空；按 IMG hash（7b7f2a84/d25fbc01/20e89e1d/fe3eeaa5/caee650f/a45200c7/3c7d3724/d802d2ef/24a3ec3d/105a33af/cc9227ea）检索交付区与仓内零命中。无法与 IMG-1…IMG-11 逐图对照，报告不做「与某图一致/不再复现某图」断言。

## 2. 13 项首轮（R2 增量）状态矩阵

| # | 缺陷（合同） | 状态 | 实机证据（隔离 3199，WIP 基线，待干净复测） |
|---|---|---|---|
| D-01 | 看板×删除/撤销/压实 | NOT_RUN | 真实数据只读；隔离内未执行删除撤销写 |
| D-02 | 卡库/配置面板遮挡+双主按钮（渐进披露留高级） | NOT_RUN | R1 仅观察卡库侧 scrim/「已在画布·定位」/空搜索；配置面板未核 |
| D-03 | 概览顶条贴压层级 | NOT_RUN（R1 观察 16px，未 PASS） | 缺浅深×四视口独立目视 |
| D-04 | 任务工具条分组/新建任务主位 | NOT_RUN（R1 观察分段，未 PASS） | 缺浅深×四视口；窄视口 675px 见行内文字叠压（观察，非定论） |
| D-05 | 编号列非空、可复制（R1 FAIL 已撤销） | **PARTIAL（倾向 PASS，待干净复测）** | 见 §3；code 列渲染 handle=1、复制按钮、点击→「已复制」copied/aria；短 ID 回退子情形（无 WBS 存量→t-xxxx）未覆盖 |
| D-06 | 任务抽屉骨架/唯一主按钮 | PARTIAL（结构观察，未深验） | 新增任务抽屉 footer 仅「添加任务」一个 primary；「追加进展（草稿）」为次级；资料/交付物/里程碑/进展日志分区块在位；草稿作者/排序/附件/资料重复未深验 |
| D-07 | 甘特键盘微调/点按阈值/里程碑可及 | NOT_RUN | 只读选中/键盘导航部分验未做 |
| D-08 | 任务↔里程碑双向关联 | NOT_RUN | 抽屉见「关联里程碑」选择器，写关联未做 |
| D-09 | 通知分级/短摘要可追溯 | PARTIAL（观察） | 新增项目/任务均出短摘要回执：「项目已新增｜p-0001 …」「任务已新增｜1｜t-0001 …」；分级/错误态未验 |
| D-10 | 执行摘要 Markdown 源编辑/实时预览/落库 | NOT_RUN | 未打开摘要编辑器 |
| D-11 | 任务↔交付物双向关联 | NOT_RUN | 抽屉见「交付物选择」，写关联未做 |
| D-12 | OKR 错误层级/软关联通俗解释 | NOT_RUN | R1 仅观察页面导语讲「主归属计权重/软关联不计权重」；表单错误层级未测（设计者正修 KR 选择器） |
| D-13 | 习惯同日幂等/长日志折叠 | NOT_RUN | 源码旁证 core/habits.ts 同日幂等（already-exists 零写），GUI 写未测 |

## 3. D-05 实测证据（隔离 3199，WIP 基线）

- 进入「全部任务」后 DOM（`bu.js` 直读，非 nth-child 推断）：
  - `.pt-cell.pt-code` 存在；`.pt-code-val` 文本 `1`；按钮 `title=复制编号 1`、`aria-label=复制编号 1`、`cls=pt-code-btn`。
- 复制交互：点击 `.pt-code-btn` 后，`.pt-code-val` 变 `已复制`，按钮 `cls=pt-code-btn copied`，`aria-label=已复制`（1.6s 反馈，源码 `copyHandle` 路径）。
- 下发 chunk 核查：3199 `/plugins/??dsh-pm-tool/client.js&rev=0c98115e5055` 含 `pt-code-val`×4（`bu.http_get` 计数）；故前端并非缺该列，R1「空白列」由①误取占位列 cells[2]、②seed 后 SPA 未重入叠加造成。
- 证据图：`…/agents/s_000ElkeZqJ2/artifacts/shots/d05-code-column-copy-3199.png`（675×745 RGB PNG，`file` 核验）。
- 未覆盖子情形：无 WBS 存量记录的短 ID（t-xxxx）弱化回退未构造；200% 截断未测。

## 4. 复现/命令记录（关键）

- 隔离起服（`--patch` 必须在 `--host/--port` 等内层参数前）：
  `pnpm dsh --profile pm --patch <scratch>/storage-override.yml --host 127.0.0.1 --port 3199 --no-open`（cwd 上游，nvm node 22.23.2 / pnpm 11.28.5）。
- 配置合并预检（不起服）：`pnpm dsh --profile pm --patch <file> --dump-config`，exit 0，storage-json root=scratch。
- 构建：`cd packages/dsh-pm-tool && pnpm run build`，BUILD_EXIT=0。

## 5. 待续（下一检查点）
- 干净 detached worktree 冻结 06a131c 后复测 D-05，并补短 ID 回退、200% 截断。
- 在隔离内推进 D-01 删除撤销、D-06 深验、D-07 只读导航、D-08/D-11 双向关联、D-10 摘要、D-13 幂等写；浅/深主题与四视口逐步扩。
