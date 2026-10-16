# #23 客观进度补全 — 隔离 GUI 验收证据（2026-10-17）

## 范围
补齐 v0.7.4 deferred 的客观进度四件事：`doneAt`（完成日期，沿用既有 completedDate 自动记录/人工修正）、`effortHours`（实际工时，非估算，可缺省）、`evidenceUrl`（客观佐证链接，可缺省）、人工 `manualProgress`（显式「人工设定」标记，与清单客观派生并存、互不污染）。客观进度仍以清单 checked/total 派生，无清单/无信号显「证据不足」，绝不伪造精确百分比；派生为纯函数，新字段全部加法式、可选、向后兼容，旧数据安全读入、无需迁移。

## 环境隔离（不碰正式实例）
- 宿主只读克隆：`/Users/bytedance/Projects/dsh-pm/deepseek-harness`（上游零改动）。
- 隔离 `DSH_HOME`：`.tmp/progress-meta-20261017/home`；隔离存储/备份：`.tmp/progress-meta-20261017/data`、`.tmp/progress-meta-20261017/backups`；cordis.patch.yml 的 storage root 指向隔离 data，无任何 LLM provider/key。
- 隔离端口 **3162**（非生产）；正式 **3080=PID 66364** 全程 LISTEN 且 PID 未变，**3091** 未监听。
- 停服严守 ISS-027：`lsof -iTCP:3162 -sTCP:LISTEN` 查端口 → 核 argv（`--port 3162 --no-open`）/cwd → 单 PID `kill -TERM`；未用 pkill -f / killall。

## served bundle 生效证明
profile `node_modules/dsh-pm-tool` 软链指向主包，页面加载聚合包 `dsh-pm-tool/client.js`；本次新增的 meta 块样式标记 `pm-meta-block` / `pm-manual-badge` 已出现在 build 产物中（截图可见人工徽标与客观只读块，即 served 的是本次 build 后 bundle）。

## 浅 / 深两套截图（任务编辑抽屉）
| 场景 | 浅色 | 深色 |
|---|---|---|
| 人工设定 + 工时 3.5 + 证据链接；客观无清单 →「证据不足」（不伪造）；橙色「人工设定 30%」徽标 + 清除按钮 | `20-manual-light.png` | `20-manual-dark.png` |
| 清单 2/4 → 客观派生 `50%（2/4）`；无人工徽标、人工输入留空 | `21-objective-light.png` | `21-objective-dark.png` |

- `results-light.json` / `results-dark.json`：逐项断言（manual.badge / manual.objective.evidence-gap / manual.effort / manual.evidence / manual.value / manual.note / objective.value / objective.fraction / objective.no-manual-badge / console.clean），两趟全 OK、0 console error。

## 离线确定性验证
- `pnpm run build` = 0 error。
- `node scripts/verify-isolation.mjs`：**73 脚本 / 73 通过 / 0 失败 / 污染 0**（before=after=165）。
- 新增 `scripts/verify-task-meta.mjs`（离线、确定性、表驱动）：effort/evidence 读写与缺省、人工显式标记且不污染客观、清除人工回落客观、旧记录无新字段安全 parse、done↔completedDate 关系。
- `verify-real-model.mjs` 为真实出网 smoke，已移出默认确定性门，本批未将任何真实网络/真实模型依赖测试加回。

## 边界
- 加法式 schema：仅新增可选 `effortHours/evidenceUrl/manualProgress/manualProgressNote`，不改既有字段语义、不破坏性迁移；客观派生逻辑（`deriveProgressMap`）零改动。
- 零新增外部依赖；颜色全部消费 `--dsw-*`/`--pm-*` token，零硬编码 hex，跟随 `body[data-ds-dark-theme]`，浅深两态均清晰。
