# #22 AI 副驾写操作扩展 — 隔离 GUI 验收证据（2026-10-17）

## 范围
副驾写操作从仅 `task.update` 扩展到**里程碑、风险、交付物、会议**四类实体，每类支持「创建 + 更新」；保持 HITL（确认草稿卡，确认才落库、取消零写），复用既有 ask-apply 后端守卫，零存储 schema 改动，乐观锁冲突跳过、重复 apply 幂等。

## 环境隔离（不碰正式实例）
- 宿主只读克隆：`/Users/bytedance/Projects/dsh-pm/deepseek-harness`（上游零改动）。
- 隔离 `DSH_HOME`：`.tmp/copilot-writes-20261017/home`；隔离存储/备份：`.tmp/copilot-writes-20261017/data`、`.tmp/copilot-writes-20261017/backups`；cordis.patch.yml 的 storage root 指向隔离 data，无任何 LLM provider/key。
- 隔离端口 **3161**（非生产）；正式 **3080=PID 66364** 全程 LISTEN 且 PID 未变，**3091** 未监听。
- 停服严守 ISS-027：`lsof -iTCP:3161 -sTCP:LISTEN` 查端口 → 核 argv（`--port 3161 --no-open`）/cwd → 单 PID `kill -TERM`；未用 pkill -f / killall。

## served bundle 生效证明
页面加载聚合包 `dsh-pm-tool/client.js`，响应体包含实体卡样式标记 `pm-copilot-entity-badge`（`results-*.json → servedBundles`：两趟均 `200/1724436B/entity=true`），证明 served 的是本次 build 后的 bundle，而非旧包。

## 三态截图（浅/深各一套）
| 状态 | 浅色 | 深色 |
|---|---|---|
| 确认草稿卡（8 步：4 新建 / 4 更新） | `10-draft-light.png` | `10-draft-dark.png` |
| 整批确认落库后（已应用 8 步；顶部里程碑/风险计数自增） | `11-after-apply-light.png` | `11-after-apply-dark.png` |
| 取消零写（草稿清空、无新建） | `12-cancel-light.png` | `12-cancel-dark.png` |

- `dom-draft-light.json` / `dom-draft-dark.json`：草稿步计数=8、实体徽标 8 枚（新建里程碑 / 更新里程碑·m-0001 / 新建风险/问题 / 更新风险/问题·ri-0001 / 新建交付物 / 更新交付物·dlv-0001 / 新建会议 / 更新会议·mtg-0001）。
- `results-light.json` / `results-dark.json`：逐项断言结果（draft.stepCount / entityBadges / apply.batchApplied / cancel.clearsDraft / cancel.zeroWrite / bundle.servesEntityCard / console.clean），两趟全 OK、0 console error。

## 离线确定性验证
- `pnpm run build` = 0 error。
- `node scripts/verify-isolation.mjs`：**72 脚本 / 72 通过 / 0 失败 / 污染 0**（before=after=165）。
- 新增 `scripts/verify-copilot-writes.mjs`（离线、确定性、mock/表驱动）：四类实体 create/update 解析校验、确认落库、取消零写、updatedAt 冲突跳过、幂等、非法/未知动作安全忽略、跨项目拒绝。
- `verify-real-model.mjs` 为真实出网 smoke，已移出默认确定性门，本批未将任何真实网络/真实模型依赖测试加回。

## 边界
- 零存储 schema（不改 types、不新增字段、不迁移）；零新增外部依赖；模型路由层（c78e6a4 三档路由）只读不改、不绕过、不回退。
- E2E 演示缝仅在 `DSH_PM_E2E=1` 且 ask 参数含 `entities` 时返回固定实体计划，不调模型，生产/所有者实例不注册。
