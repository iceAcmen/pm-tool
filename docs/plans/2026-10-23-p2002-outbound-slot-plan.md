# P2002 出站位修复执行计划

> 给 Main 与独立 SOURCE/AUTO 复验角色使用：本计划记录已授权的原缺陷修复，不是验收结论。
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. 当前按已授权子单直接执行；不可用子技能不替代项目合同。

**Goal:** 修复 RA-P2002-OUTBOUND-SLOT 的真实 snapshot→selected project→实际任务行只读连接。

**Architecture:** 现有 index snapshot 分支沿 readExportAudit 派生 `latestExports` 项目窄 map，按可解析 at 最大值选择，只投影 at/format，无记录 null。panel 按真实 project.id 传 latestExport；tasks 复用静态文本于 groupRow/leafRow，含状态分组实际行，文本放标题格不占 72px 编辑操作格。旧历史 deferred 事实保留，不改 TTL、backup、schema 或其他已修逻辑。

**Tech Stack:** macOS、既有 nvm Node22、TypeScript、真实 Cordis/JSON domain、React18/react-dom、jsdom、既有 Vitest。pnpm 不调用。

## 授权与边界

- 原句：“父授权持续验完所有已实现未验/修确证缺陷至ordinarycommit，无push/release。你开发限定刚独立确证RA-P2002-OUTBOUND-SLOT，非验收/GUI。”
- 依据：`docs/testing/p2-outbound-history-review-20261023-r1.md` 全文，特别 §5.1；AGENTS；collaboration §9/11；vendorpolicy/manifest。
- 产品仅写 `packages/dsh-pm-tool/src/index.ts`、`src/client/panel.tsx`、`src/client/views/tasks.tsx`。本角色普通提交也不执行，Git 全禁，归 Main。
- 新专项、runner、计划、结果、收据、seal 仅 `docs/plans/2026-10-23-p2002-outbound-slot-*` 新文件；不会改 livingdocs、testing、1690 封包、vendor。
- Main 唯一整 builder/GUI；本角色禁止 install/build/noEmit/整 verify/GUI/service/凭据/private freeze 或 runtime。自有 `/tmp` inputs/config/cache/home/output；只读现有 node_modules 链接。
- 三 source 写锁归本子单，交回后 released/STOP。独立 PASS、组合 freeze/fullregression/newhostGUI 归其他角色/Main。

## 步骤

1. [x] 阅读合同，确认两个断点；brainstorming 沿已明确合同收敛，不重新扩大方案/常规询问。writing-plans 记录执行顺序。
2. [x] runner capture：认领真实源输入、保护文档/原封包/依赖，vendor 静态 exit0 + manifest SHA/bytes 后才读 vendor skill。首次误扫历史缓存的过宽基线保留，后续收窄。
3. [x] diagnosing-bugs 仅确认现象/假设/真实源码根因；转 tdd 做真 schema、生产 apply 注册的 command snapshot、真实 PmPanel/TaskTable React DOM 有效红。设施失败原样保留，不充产品红。
4. [x] 只改三源最小绿，测试 A 最大 at 非数组末、B null 隔离、非法 audit 防御、refresh/reentry、每个实际行 slot、原排序/编号/状态/清单与零业务写。
5. [x] 自有隔离最终 8/8 与原 U4/出站相邻 54/54；code-review 自查，vendor final exit0；selfcheck 字节绑定/依赖/零写满足。diff/影响索引已安排封存，seal 以独立新文件为准。
6. [x] 结果/原门影响索引交回 Main；三 source 锁 released，封存收据后 STOP，不 self PASS，不提前 build/合并。

## 验证命令

环境 macOS + 已有 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`，仓库根；每条单独执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2002-outbound-slot-runner.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2002-outbound-slot-runner.mjs vendor-initial
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2002-outbound-slot-runner.mjs red
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2002-outbound-slot-runner.mjs green
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2002-outbound-slot-runner.mjs affected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2002-outbound-slot-runner.mjs vendor-final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2002-outbound-slot-runner.mjs collect
```

红预期为明确缺投影/顶层 slot/真项目传值断言失败；不得以 mock/helpermirror/testfactory 实现替代源连接。GUI 布局目视、组合构建与整回归 NOT_RUN，保持原 FAIL，等待独立复验。
