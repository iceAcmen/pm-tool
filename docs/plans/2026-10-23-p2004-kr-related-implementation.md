# P2OKR-R1-01 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> 本机未提供该子 skill；按本单明确授权就地逐步执行，不找安装、不建 Git worktree、不提交。

**Goal:** 修复实际 OkrsView 的 KR 自有软关联展示遗漏，保留单父归属、零写及独立门。

**Architecture:** 模型供给已存在，产品只改 `okrs.tsx`。将既有 root 关联 markup 抽成文件内只读呈现，在对应 KR/orphan 内复用；根 markup 不变。测试运行只在自有 `/tmp` source 副本，借用现有离线依赖。

**Tech Stack:** TypeScript、React、JSDOM、Vitest、Node 22；macOS。

---

原授权和不写边界见同前缀 `design.md`；测试合同只读 `docs/testing/p2-okr-habit-remaining-gui-review-20261023-r1-report.md` §6。本计划是开发分解，不更改专家 oracle 或新增独立门。

执行记录：任务1采用 capture-r2（首capture设施中止保留），任务2真实红已收exit1，任务3最小修已写，任务4专项8/8和邻测59/59均exit0。任务5自查结果见pilot，最终封存及释放以result/seal为准，非独立验收结论。

### 任务 1：捕获输入和 vendor 前置

文件：新同前缀 `runner.mjs`、机械生成 baseline/receipts/指纹；不写其他文件。

1. runner 记录 HEAD、完整 status（不 fetch/pull）、主树 src 和明确保护文档/vendor/包配置 SHA，复制原 src 到自有 `/tmp`。
2. 按 manifest 对所有锁定文件 SHA/bytes 比对。
3. 执行既有 `verify-external-skills.mjs`，保真实终码与 stdout/stderr，成功后才读取 TDD。

### 任务 2：先写真实 DOM 红测

文件：新 `packages/dsh-pm-tool/src/client/views/okrs-related.test.tsx`。

1. 参考现有 JSDOM/createRoot/act 测试，不 mock OkrsView 或 buildOkrTree；静态依赖使用匹配 React/ReactDOM。
2. fixture 为同项目 A、第二目标 B、合法 KR(primary=A, related=[B])。断言 `.pm-okr-related-row` 在该 KR 节点内，精确 `关联：第二目标 B（okr-b · 只展示，不参与权重）` 且一次；不把 B 当 A.children。
3. 加入同 oracle 的清空/恢复 rerender、输入及主父/children/状态守卫、root 自身关系和兄弟 KR 不串用、orphan 同复用窄覆盖；记录只读 callbacks/fetch 零调用。
4. 隔离执行旧视图，预期非零且失败正文明确 KR 关联行长度为0，不把依赖/设施失败当真红。原测试指纹固定后再产品修复。

### 任务 3：最小产品修复

文件：仅 `packages/dsh-pm-tool/src/client/views/okrs.tsx`。

1. 文件内呈现函数输入 `related: OkrViewRecord[]`，空返回 null。
2. 保持原 `.pm-okr-related` 外壳和 `.pm-okr-related-row` span/Link2/key/文案。
3. 原 root map 改为该呈现函数；对应 KR 的 li 内传 `kr.related`；orphan 内传 `o.related`。
4. 不改 primary/schema、存储、权重、确认和编辑动作，不加 CSS 或入口。

### 任务 4：原受影响邻测

1. 同源同 test 跑 green；确认 RED/GREEN oracle SHA 相同，隔离 source 仅视图增量。
2. 邻测限定新 test、`src/client/views/okr-model.test.ts`、`src/client/views/growth-form-props.test.ts`、`src/core/okr.test.ts`。不执行整回归/build/verify 业务脚本；已有邻测失败保原件，不改 oracle。
3. 每轮保存命令、exit/signal/error、正文、输入清单/指纹、隔离源与依赖前后差分、主树保护变化。并发他人变更独立列示，不恢复或认领。

### 任务 5：开发自查、封存和释放

1. 重新静态校 vendor，读取 code-review；按规范/原合同两轴只读自查，pilot 留痕。
2. `git diff --check` 仅两产品路径；生成相对接手 source delta，不把 HEAD 等同全部候选。
3. 封 source/test 和全部实际终码、日志、依赖、输入保护与 source delta；无挂起 executionID 被推定为 exit0。
4. 新同前缀 `result.md` 说明 fullbuild/GUI 未运行、独立门未签；交 Main 及另一独立 SOURCE/AUTO 角色。
5. 交付后释放 `okrs.tsx` 和 `okrs-related.test.tsx` 写锁，STOP；不 Git add/commit/push、不写 livingdocs/testing。

### 执行命令

环境：macOS，现有 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`；pnpm 不调用。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs capture-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs vendor-initial
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs red
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs green
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs affected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs vendor-final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2004-kr-related-runner.mjs seal
```

首capture已中止、NOT_COLLECTED，禁止再运行以覆盖首记录。有效capture-r2/vendor/green/affected预期0，red 因关联展示缺失为1；实际终码必须以工具与 receipt 双核。每个 stage 文件只增不覆盖；本单已有stage不原地重复，重试需新stage并另写有效绑定。
