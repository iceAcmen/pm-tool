# #24 测试框架 + CI 本地等价命令证据（2026-10-17，doubao-work）

> 本机 macOS / Node 22 / pnpm 11.28.5；全部离线确定性，真实出网 smoke（verify-real-model.mjs）不在必经。

## 命令与结果

| 命令 | 结果 |
|---|---|
| `pnpm run build` | 0 error（tsc + css + tsdown） |
| `node scripts/verify-isolation.mjs` | 73 脚本 / 73 通过 / 失败 0 / 污染 0（before=after=165） |
| `pnpm run test:coverage` | 4 文件 / 29 用例全过；子集 All files lines 45.02 / branches 86.25 / functions 42.37 / statements 45.02，过门槛（lines40/branches80/functions35/statements40） |
| `pnpm run e2e` | PASS：项目名「E2E 验收项目」、种子任务渲染、0 console error；端口 3171 用完即 DOWN，正式 3080=PID 66364 未变、3091 未监听（ISS-027 单 PID TERM） |

## 覆盖率（v8，include 仅本批四模块）

- copilot.ts 53.35% lines / 82.19% branch / 62.5% func
- gantt.ts 48.76% lines / 87.8% branch / 28.57% func（几何/非 CPM 段未测，由集成门覆盖）
- progress-derivation.ts 12.13% lines / 100% branch / 10% func（rollup 段未测）
- settings.ts 97.01% lines / 100% branch / 75% func

## 单测清单（29 用例）

- gantt.criticalPath.test.ts（8）：线性链全关键+关键边、确定性、成环不崩溃不高亮、缺日期不顺延、悬空计数、多分量、空输入。
- settings.test.ts（6）：默认值锁原硬编码、非对象全默认、合法覆盖、非法回落记 invalid、灯号倒挂回落、sameSettings。
- progress-meta.test.ts（5）：客观/人工双轨、manual 不污染 objective、无信号 none 不伪造、清除回落、仅人工。
- copilot-validate.test.ts（10）：task.update 白名单/枚举/日期顺序，milestone/risk/issue/deliverable/meeting create/update 交叉约束，未知 op 拒。

## 限制（如实）

- 本机无 `gh` 登录，未在 GitHub 端观测 Actions 实跑；CI 流程（`.github/workflows/ci.yml`）已配置，本地等价命令全绿。
- e2e 依赖仓库外只读宿主 deepseek-harness；CI 环境缺该宿主时 e2e.mjs SKIP exit 0（非阻断）。
