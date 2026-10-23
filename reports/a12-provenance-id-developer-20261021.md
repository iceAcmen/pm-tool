# A12 来源行 ID 有界修复交件

> 给 Main 与独立测试专家接续：本报告只认领 AGUI-01 的开发修复及开发自验，不判 GUI/整 ID PASS。平台 trae；本地 2026-10-22 凌晨，文件名沿父批次 20261021。

## 1. 授权与范围

负责人原句：

> 开发有界修确证AGUI-01来源行缺ID。用户持续授权所有在途验修最后Main普通commit，无push。先读AGENTS/collaboration/独立docs/testing/a11-governance-source-gui-review-20261021.md §4与docs/plans/2026-10-21-provenance-source-id-closure.md。你独占仅packages/dsh-pm-tool/src/client/provenance-panel.tsx和同组件newtest，报告reports/a12-provenance-id-developer-20261021前缀。有label同时可见label+id，无label避免ID重复；保meta表/角色/版本、正常ref.id跳转/失效无jump、旧数据/history。无需改style如inline既有meta够用；不改provenance-view/ask/store/panel/globalCSS。自有冻结tmp/已有node_modules只读/无cache，真实组件test旧红新绿+相关回归/noemit，禁止install/sharedbuild/mainlib/GUI/服务/凭据/其他livingdocs/commit。不扩冻结时间等未确证范围。Main仍在A11GUI，改源不会立即build，报告哈希并释放后Main唯一A12冻建。

- 已读 AGENTS、collaboration §9/11、独立 A11 §4 和指定计划，并核当前接续及相关模型/测试。现存 dirty 成果保留；未 fetch/pull、install、shared build、改 lib、GUI、服务、凭据、其他 living docs、commit/push。
- 唯一产品改动：`packages/dsh-pm-tool/src/client/provenance-panel.tsx` 的既有 `pm-prov-ref-meta` 前加一行 `{ref.label ? \`${ref.id} · \` : ''}`。标题仍在原按钮/文本中，表/角色/版本、跳转 `ref.id`、失效守卫、历史渲染均未改。
- 唯一新增产品测试：`packages/dsh-pm-tool/src/client/provenance-panel.test.tsx`。取证脚本、禁缓存配置、原始日志/清单均限定本报告前缀。
- 不改 invalid 单列或历史行呈现，不追加冻结时间精度、样式、字段或新页面。测试中 reports/unknown 表只是既有正常/无映射分支回归，不扩导航能力。

## 2. 候选认领

基线 HEAD：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不将 HEAD 当完整 dirty 候选。

| 文件 | SHA256 |
| --- | --- |
| 修前组件，匹配 A11 确证原源码 | `ff319e4e7d9fc47cf3c8b34b56f4b260901c0039841a054837b7b2cf93779ca6` |
| 修后组件，11559 bytes | `039b7d47a9fc39df0913d38d102eb54e526023c3c49eb260278f59c3de4c973b` |
| 新旧共用测试，8787 bytes | `5c484781fe1609360e34359ccecb667f98101de458ddc267141671f488ac8584` |

- 自有冻结根：`/private/tmp/pmtool-a12-provenance-id-developer-20261021-7xBZU9`，red/green 各自 `packages/dsh-pm-tool`。旧副本不覆写，绿副本来自同一次旧冻结，仅替换组件；[源码差异](a12-provenance-id-developer-20261021-evidence/red-green-source-diff.json)仅 `client/provenance-panel.tsx` changed1、added0/missing0。
- 已有依赖仅软链只读使用：`/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，React/renderer18.3.1、Vitest2.1.9、Node22.23.3。`cache:false`、`--no-cache`、两类 optimizer disabled；没有安装或依赖写入。
- [冻结](a12-provenance-id-developer-20261021-evidence/freeze.json)及 red/green 全部输入清单归档；[最终 patch](a12-provenance-id-developer-20261021-evidence/owned-final.patch)只含上述一行。终核 `2026-10-21T16:46:52.787Z`，主树组件和测试均精确等于绿副本。

## 3. 开发验证

环境：macOS + nvm Node `v22.23.3`；pnpm11.28.5 为项目规定版本，本批未运行 pnpm。命令运行 cwd/参数/隔离环境变量/开始结束时刻/退出码/输出 SHA 均在 `*-exit.json`，不是口述结果。

| 验证 | 实际结果 |
| --- | --- |
| 同测试旧真实组件 | exit1，11 failed / 5 passed；11项均为来源行缺 ID 的断言，非装载或依赖失败 |
| 同测试新真实组件 | exit0，16/16 |
| `provenance.test.ts` | exit0，15/15 |
| `provenance-view.test.ts` | exit0，10/10 |
| `provenance-store.test.ts` | exit0，14/14 |
| `ask-governance.test.ts` | exit0，13/13，真实命令与 JSON 领域，写入仅自有 tmp |
| 相关回归合计 | exit0，4文件52/52 |
| 原 tsconfig 全产品 `--noEmit --incremental false` | exit0，无输出 |
| 新组件测试 noEmit 首次 | exit2，4个既有图标 deep import TS7016；窄 include 漏既有 `src/client/assets.d.ts`，原日志保留 |
| 新组件测试 noEmit 补正 r2 | exit0，仅本前缀配置纳入冻结副本的既有 `src/**/*.d.ts`，不改产品/依赖/声明 |
| 外部 skills 只读静态门 | exit0，注册2 vendor完整性通过，未注册树明确跳过；非产品独立门 |
| 取证脚本 `node --check` / 限定 `git diff --check` | exit0 |
| 最终隔离/哈希核对 | exit0，依赖/Main主树lib/Main隔离lib changed/added/missing全0，red/green无cache或lib |

原始命令（仓库根；脚本各阶段仅一次，已执行的原证禁止重跑覆写）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a12-provenance-id-developer-20261021-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a12-provenance-id-developer-20261021-run.mjs red
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a12-provenance-id-developer-20261021-run.mjs green
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a12-provenance-id-developer-20261021-run.mjs test-types-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a12-provenance-id-developer-20261021-run.mjs finish
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check reports/a12-provenance-id-developer-20261021-run.mjs
git diff --check -- packages/dsh-pm-tool/src/client/provenance-panel.tsx packages/dsh-pm-tool/src/client/provenance-panel.test.tsx 'reports/a12-provenance-id-developer-20261021*'
```

脚本 green 汇总保留首次测试 noEmit exit2，不能改写成首次全绿；有效补正原件为 [r2 exit](a12-provenance-id-developer-20261021-evidence/green-test-noemit-r2.exit.json)。产品及测试红绿均无漂移。

真实组件覆盖：六个已映射表有标题时同一行包含标题/ID/表/角色/快照及口径版本；同表同名各自稳定 ID 与 callback；空/缺失 label ID不重复；changed/missing/cross-project 和 invalid-only 无跳转、旧引用保留；unknown 表不造跳转；旧 history 两结论、旧原因/版本原样刷新，无 ask-recheck；空 refs/缺 history 不造数据。没有用源码字符串替代组件 mount。

## 4. 自查与边界

- 规范轴：只增加既有 meta 文本，零新 CSS/抽象/接口/运行依赖；源码一行差异，测试依照既有 React renderer + async act 模式；未碰他人文件。
- 合同轴：label+id 同行、无 label 不重复；元信息/跳转和失效/旧数据/history 保持，16项真实组件及52相关项与 noEmit 支持这些有限判断。零超范围发现，不声称真实视觉/持久化全旅程已验。
- skills 留痕：trivial 已确证一行既有模式修复，抑制 grill/tdd；delivery code-review 指纹静态验证为 true，锁定 `49dd158d1076134a641b33efb035946536778336`。只用规范/合同双轴作作者自查；本执行端无 subagent 工具，未伪称两独立代理评审；禁止 setup、HEAD-only 代 dirty、本批自动 commit 等步骤均不执行。仍为试点，未毕业、未替代独立专家。
- 未运行 build、全量 vitest、verify 全集、GUI、浏览器/服务或模型；用户限定本角色只做相关回归/noEmit，全集与 A12 实际装载由 Main 唯一执行。终核只覆盖登记依赖及两个 lib，不扩大为全机/所有 living docs 零漂移声明。
- 自动绿不关闭 A11 的 RA-AI01 FAIL、RA-AI02/03 BLOCKED，也不替 Main 旧 A11 GUI。旧冻结时间/缺失 result 等未确证或补证范围不由本补丁扩展/补造。

## 5. 释放与 Main 下一步

本组件与同组件测试写入权已释放，无存活自有取证/测试进程，无 GUI/端口/build占用；tmp和原证保留供复核。Main 可按上面两文件 SHA 接件后唯一冻结/构建 A12；本次源码改动没有触发 build 或改变 A11 在用产物。

Main 依原 RA-AI01..03 合同补新候选/产物/实例/完整 uncached 下发绑定，原十来源逐跳返回、changed/missing 与历史原件，交独立专家判定；最终全集/门闭合后由 Main 普通 commit，无 push/tag/正式切换。本角色不提前 commit，不修改测试专家/其他 living docs，也不接下一功能。
