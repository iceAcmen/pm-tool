# A20 完整回归独立审证

> 2026-10-22，A20 独立审证专家。仅审查既有 SOURCE/AUTO 证据；未开发、未重跑测试、未运行 GUI、未修改产品。本报告不替代 RA-P0007 真实旅程，也不签署 A20 总门、提交或发布。

## 1. 结论

| 范围 | 结论 | 审证结果 |
| --- | --- | --- |
| 候选绑定与继承 | **有限 PASS** | A20 `candidate.json` SHA256 与派单一致；基线、patch、新文件清单、两文件 SHA、A19HC 依赖继承及三类 drift 均可闭合 |
| 完整构建与 AUTO 回归 | **有限 PASS** | 8 个记录步骤退出码均为 0；152 files / 1570 tests 全绿；coverage 为 89.4 / 82.41 / 85.89 / 89.4 |
| 隔离 guard | **有限 PASS** | 95/95，通过 guard selftest；正式 `data/`、共享 backups/exports 的 5 个受保护文件污染为 0 |
| Launcher 本轮自动化 | **有限 PASS** | 指定 9 个测试文件共 56/56；`verify-launcher` PASS |
| 本轮已证 FAIL | **无** | 已审的退出码、stdout/stderr 与候选清单中未出现执行失败；stderr 中的既有 warning 和预期失败路径日志不予抹除 |
| RA-P0007 真实持久化/命令重读/重进 GUI | **NOT_RUN（范围外）** | 本轮没有对应真实服务、业务落盘和 GUI 原始证据，AUTO 不得替代该旅程 |
| A20 总门 | **BLOCKED** | 当前证据只能支持 SOURCE/AUTO 有限 PASS，不能支持 A20 总门 PASS |

**最终判定：绑定候选的 A20 完整自动化回归有限 PASS；A20 总门仍为 BLOCKED。**

## 2. 候选绑定

- 基线提交：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`
- A20 候选：`reports/all-pending-evidence-20261021/A20/candidate.json`
- A20 候选 SHA256：`1bc7b72472e24f5ab3b193c3da87a5d76a175e081191be55cc2c4b6b66de6995`
- tracked patch SHA256：`50e38fc0f689b542c2f5796e66bef19d90593c9c099e40de4c3e160709769205`
- new inputs SHA256：`fc6bc042dabedac82c02093507caa33f6dac0e2d7a87fe0fb7801bb3e395a7b6`
- 先行两文件独立复验报告 SHA256：`3b658f87b3b9234df94fec5537b7bda3d0cc3fb8ce970e59e6f8143af656920a`
- 继承 A19HC 候选 SHA256：`03efd7b68efc22247c677b48fed66cdcb1746c9275b66b1d8d071f8f329f5bb2`

A20 两文件字节与候选登记一致：

| 文件 | SHA256 |
| --- | --- |
| `packages/dsh-pm-tool/src/core/reflect.ts` | `3423fef5553c3314577698439022310e463ab28c2f42c7476f4886d101cf433b` |
| `packages/dsh-pm-tool/src/core/reflect-file-count.test.ts` | `059a67a3dbeda0ab72284564fc627b52b3ca57bb57e7f405d489b09c4f9da16a` |

相对 A19HC：

- source 从 527 项增至 528 项；仅新增 `reflect-file-count.test.ts`，并将 `reflect.ts` 从 `5ee9a9...ffd` 更新为上表 SHA。
- artifacts 路径集合保持 453 项；仅 `lib/core/reflect.js` 和 `lib/types/core/reflect.d.ts` 的产物哈希变化。
- `new-inputs.json` 从 33 项增至 34 项，新增项仅为 `reflect-file-count.test.ts`。
- A20 累积 patch 共 57 个 tracked 文件，不能把整个候选误写成只有两文件变化；两文件是相对已继承 A19HC 候选的 A20 增量。
- `sourceDrift=[]`、`protectedDrift=[]`、`dependencySourceDrift=[]`。
- 依赖由已独立接受的 A19HC closure 以 clonefile copy-on-write 继承；TypeScript、Vitest、tsdown 探针哈希与 A19HC 登记一致，`externalLinks=[]`。

## 3. 完整回归结果

环境由 exit 记录绑定：macOS，Node `v22.23.3`，隔离树 `/private/tmp/pmtool-a20-closure-20261022-r1`，直接调用 owned Node 工具；未使用 pnpm shim/install。

| 步骤 | 退出码 | 关键结果 |
| --- | ---: | --- |
| `tsc -p tsconfig.json --noEmit` | 0 | stdout/stderr 均空 |
| `tsc -p tsconfig.json` | 0 | stdout/stderr 均空 |
| `tsdown --config tsdown.config.ts` | 0 | 6 个 bundle 文件构建完成；stderr 空 |
| `vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` | 0 | 152 files / 1570 tests；coverage 89.4 / 82.41 / 85.89 / 89.4 |
| `scripts/verify-isolation.mjs` | 0 | 95/95；受保护资产 before=5、after=5、污染 0 |
| `scripts/test-isolation-guard.mjs` | 0 | 增、改、删、缺失 root 与整体删除检测 selftest PASS |
| Launcher 9 文件 Node test | 0 | 56/56，fail/cancelled/skipped/todo 均为 0 |
| `launcher/scripts/verify-launcher.mjs` | 0 | 隔离假监听者 PASS；未碰 3172、未读 cookie/凭证 |

`outer-exit.json` 同步记录 `exit=0`、`rows=8`、`artifacts=453`。候选清单登记 528 个 source 与 453 个 artifacts，和上述构建结果一致。

## 4. stderr 与保留边界

coverage stderr 的既有输出必须保留，不得写成“零告警”：

- 多处 `TaskTable` 子项缺少唯一 `key` 的 React warning。
- 两次 `MaxListenersExceededWarning`。
- preview 路由冲突用例输出“路由注册跳过”。
- checklist 用例出现 detached tree 的 React internal warning，并伴随 `requestAnimationFrame is not defined`。

这些输出未使 152/1570 或 coverage 命令失败，本报告因此不将其判为本轮 AUTO FAIL；同时也不豁免、修复或关闭这些 warning。

guard stderr 含非法证据 URL、缺失交付物、空作者、模拟写入失败、导出路径冲突等负向用例日志；结合对应脚本 95/95、总退出码 0 与污染 0，只能判定为既有失败路径被执行，不能删除这些原始记录或宣称 stderr 为空。

以下范围没有本轮新执行证据：

1. 候选声明所述历史五个 Launcher probes 本轮未执行，仅保留为 source-only 边界；9 文件 / 56 项不得扩称覆盖这五个 probes。
2. 未启动真实宿主，未执行 done → 真实落盘 → 命令重读 → 重进 GUI 的 RA-P0007 旅程。
3. 未采集真实浏览器页面、样式、交互或用户体验证据。
4. 未签署实际下发、默认可见、提交、发布或 A20 总门。

因此，AUTO 有限 PASS 不得改写成 RA-P0007 PASS，也不得用来解除 A20 总门 BLOCKED。
