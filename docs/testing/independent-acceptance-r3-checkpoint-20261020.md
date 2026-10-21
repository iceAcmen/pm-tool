# R3 首轮检查点：冻结基线 GUI + 候选绑定核验（独立验收，非 PASS）

- 验收人：独立验收代理；本机实机 macOS；被测声明基线 HEAD `06a131cd5fdc4486dd74afe89cc4c5630f0a4c98`。
- 口径：PASS/FAIL/BLOCKED/NOT_RUN 严格分列；源码闭合 ≠ GUI PASS；不以作者报告/单测/HTTP/旧链替代。
- 安全：正式 3172（PID 44388）未重启；pm profile 软链、真实 data/11 卡/配置/凭据未改；仅 scratch 隔离实例与隔离存储根写最小脱敏 fixture。

## 1. 冻结隔离实例（已核验）

| 项 | 值 | 证据 |
|---|---|---|
| 独立 profile | `iso3`（自定义 DSH_HOME=`…/isolated/dshhome`，不继承 pm providers/设置，不复用 pm 软链） | `--dump-config` exit 0，storage root=scratch |
| 监听端口/PID | 3199 / node PID 85444 | `lsof -nP -iTCP:3199 -sTCP:LISTEN` |
| cwd | `/Users/bytedance/Projects/dsh-pm/deepseek-harness`（上游只读） | `lsof -p 85444 -d cwd` |
| argv | `node --import tsx/esm apps/cli/src/bin.ts --profile iso3 --host 127.0.0.1 --port 3199 --no-open` | `ps -o command -p 85444` |
| 插件解析 | iso3 `node_modules/dsh-pm-tool` → detached worktree `freeze/wt-06a131c/packages/dsh-pm-tool`（06a131c 干净检出，`git status` 空） | `readlink` |
| 冻结构建 | worktree 内 `pnpm run build` exit 0；`pt-code-val`×4；lib/client.js sha256 `547c9c0c2a4db0c331fa7c4ca0bc9152d5904edbbfd1d7162ee3ce88190a16ea` | 构建日志/`shasum` |
| 磁盘隔离 | scratch `data/` 干净起建；真实 `data/pmtool` 测试窗内零新增写 | `find -newermt` 空 |

## 2. 冻结基线 GUI 已测（3 项核心，浅色桌面窄视口 675×745）

| # | 项 | 状态 | 实机证据（iso3 / 3199，06a131c） |
|---|---|---|---|
| D-06 | 任务抽屉骨架/唯一主按钮 | **PARTIAL（结构符合，未深验）** | 「新增任务」抽屉 footer 仅 `添加任务` 一个 `pm-button-primary`；次级：`加链接`、`关联交付物`、`追加进展（草稿）`、`取消`；分段 01基础信息/02排期与进度/03关联与仓库；`关联里程碑 不关联/当前关联暂无已保存`、仓库/分支在位。草稿作者/排序/附件/资料重复未深验 |
| D-09 | 通知分级/短摘要可追溯 | **PARTIAL（观察）** | 新增项目/任务均出短摘要回执：`项目已新增`、`任务已新增`（含短 ID/根层级）；分级/错误态未验 |
| D-05 | 编号列非空可复制（R1 FAIL 已撤销） | **PARTIAL（倾向 PASS，冻结复制点击未重抓）** | 冻结构建 bundle 含 `pt-code-val`×4；任务列表见「编号」列；WIP 轮已实证点击→`已复制`/`copied`/`aria=已复制`；冻结轮复制点击因窄视口虚拟化未重抓，短 ID(t-xxxx) 回退子情形未覆盖 |

- 已种最小 fixture（scratch）：项目 `p-0001 冻结验收fixture`，任务 `t-0001 验收任务一`；仅隔离内。

## 3. 候选 P1 绑定核验（独立 hash 复核，非作者自述）

按 `agents/s_000ElkeZfRp/artifacts/candidate/FREEZE.md` 逐项 `shasum -a 256` 复核，**7 文件 + tracked.diff 全部 OK（逐字节一致）**：

| 文件 | 角色 | 复核 |
|---|---|---|
| `core/ui-feedback.ts` | P1-1 分类信封 | OK `02fd446a…db8c7` |
| `core/ui-feedback.test.ts` | P1-1 回归 | OK `c5eea9ac…e648` |
| `client/panel.tsx` | P1-1 成功站点 + P1-2 注入 + 桥接触发 | OK `ff284377…99d8` |
| `client/views/growth-form-props.ts` | P1-2 契约 relatedOptions | OK `0e07ee09…a8e4` |
| `client/views/okr-form.tsx` | P1-2 软关联全 kind | OK `0b9bd1b1…092` |
| `client/launch-handshake.ts`（新增） | 就绪回告桥接 | OK `1b6aa212…5b9a` |
| `client/launch-handshake.test.ts`（新增） | 桥接 14 例 | OK `4fe25dc1…3ca2` |
| `candidate/p1-p12-tracked.diff`（229 行） | tracked 变更 | OK `9092b97c…a73d` |

- 作者自检（仅作者自述，未独立复跑）：`pnpm test` 1117 passed/123 files、`build` exit0、verify-isolation/p2b-okr/ui-feedback/form-validation exit0。**本轮未独立复跑，不据此 PASS。**
- `tasks.tsx/tasks.css/d04-d05-d11-contract.test.ts` 零 diff：D-05 误判补丁已全部回退。

## 4. launch-handshake 独立源码自检（静态，非 PASS）

- `parseLaunchToken`：正则要求 `pm-launch=port.nonce` 后接 `&#/结束`；校验 port 1..65535 整数、nonce 非空；拒绝畸形夹带。
- `stripLaunchHash`：仅移除本参数，保留业务 hash，不清空整条路由。
- `reportEntered`：POST `127.0.0.1:port/api/entered` `{nonce}`，`credentials:'omit'`，仅 `res.ok`；catch→false，不重试、不带 cookie/token。
- `armLaunchHandshake`：无令牌不发请求；先清参数再 POST；失败 false 不假成功。
- **独立观察（风险，非阻断）**：client 侧不校验响应 Origin，防「假 S4」完全依赖 launcher 侧 nonce 内存单次/TTL120s/已用即废（`verifyEntered`）+ 仅 200 止；client 仅硬编码回环 `127.0.0.1`，无任意 origin。receiver（launcher）仍在开发（s_000ElkeZ2Sb），E2E 待 receiver freeze 后做。
- 303：契约用 fragment hash 正是规避上游 303 剥 query；client 不把令牌放 query。
- 真实入口：桥接仅在 PM 面板实际挂载 + web snapshot 成功后 arm 一次；不在 index apply 全局注册触发。

## 5. NOT_RUN（本轮未测，明确不列 PASS）

D-01 看板删除/撤销/压实；D-02 卡库/配置面板遮挡+双主按钮；D-03 概览顶条贴压；D-04 任务工具条分组/新建主位；D-07 甘特键盘微调/点按阈值/里程碑可及；D-08 任务↔里程碑双向；D-10 执行摘要 Markdown 源编辑/实时预览/落库；D-11 任务↔交付物双向；D-12 OKR 错误层级/软关联通俗解释；D-13 习惯同日幂等/长日志折叠。浅/深主题、四视口×100/200% 广矩阵全部未测。

## 6. 下一步（留一步，不阻等 E2E）

1. 把 `p1-p12-tracked.diff` + 2 个新文件应用到独立冻结树（06a131c），构建并按 snapshot 绑定，GUI 验 P1-1（含「错误/失败」成功串不再误红、备份路径非常驻复制位）、P1-2（objective 软关联可见、软关联不计权重、主归属仍仅 KR 单选）。
2. launcher receiver freeze 后再做 loopback hash 合法 200 回告/无参静默/失败不假成功的 E2E；本轮不替 receiver 下结论。

## 7. 接续登记（launcher 已冻结，留下轮 E2E，本轮不开批）

- launcher 第二阶段冻结候选报告：`agents/s_000ElkeZ2Sb/artifacts/PM启动器-第二阶段冻结候选-20261020.md`；`git diff --launcher` sha256 `68b95f05866813b37bd485e69bc5aa3f8e9240c831c742e3bed248e6cc94b0e6`，未提交。
- 作者自述（仅自检，未独立复跑，不 PASS）：nonce=hash `port.nonce` 内存 TTL120s 单次、bound PM_HOST:PORT；`/api/entered` 仅 expected WBOrigin 可确认，无 Origin/control/mismatch/repeated/expired/type 错误→403；action control 同 origin+JSON，无 origin 须 CSRF nonce；删除「我已进入」；`PM工作台.app` 壳 exec node+launcher，`--app` 专用窗非本机原生 app；38/38+8 轮+verify/make-app0。
- 下轮独立待办（真实 PM mounted+snapshot ready→回告 GUI E2E、app 点击、端口/进程回收）。
