# A11 会议行动项布局开发交接

> 给 Main 与独立测试专家使用：记录 A10-MGUI-F01 的限定源码修复、作者红绿、完整指纹和未验边界。任务日期 2026-10-21，平台 trae，开发角色；不是独立 PASS。

## 1. 授权与释放

父派单原句：

> 开发有界修A10MGUIF01行动项重叠/裁切。父持续在途验修确证最后Maincommit无push。

限定可写：`packages/dsh-pm-tool/src/client/views/records/records-meeting-form.tsx`、`src/client/views/records.css`、同范围 tests 和本报告前缀。只读 AGENTS/collaboration、独立 A10 报告 §5、既定 closure plan 和原 PNG/frames。没有 fetch/pull/install/build/GUI/service/credentials/commit/push；不写 panel/global CSS/schema/domain/callback、其他产品、testing 或 livingdocs。工作树原有改动全部保留。

Main 后续原句：

> Main继续收口。请尽快释放限定源文件并报告红绿/完整指纹，我不会动你的records form/css。收到后将A11唯一build+GUI。无需扩范围。

**三份限定源文件已释放，不再写入；本角色命令全部同步退出。** Main 可冻结 A11、唯一隔离 build、认领 actual 下发并继续真实 GUI。父任务、总门、最终 commit 准入不由此报告判断；无 push。

## 2. 修复与保留

- 原 `pm-form-section-grid` 两列保留；新增 `.rb-meeting-actions` 单列全宽容器，行动项与末尾添加按钮不再直接争占父两列。
- 每项 `.rb-action-row` 全宽；标题、关联区、行操作与已保存提示分别全宽。字段增加可见标签，全部 input/select/listbox `min-width:0`、限宽及 border-box。
- 默认单列；命名容器实际达到 `24rem` 后字段/关联区两列，达到 `30rem` 后负责人/截止/状态三列。不是 viewport 540/720 分支；不支持容器查询时保持可用单列。
- 行按钮 flex-wrap；状态值正常换行，不用 overflow hidden/clip 遮问题。不删控件、不缩小字体，不增加 tokens；非行动项 records CSS 原样保留。
- 稳定 ID/new-row key、原标题、retry、主保存顺序、行保存/转任务/删除、同项目 task/issue 过滤与取消链未改。源码审计核表单 render 前整段完全一致，27 个 input/select/option/listbox/button 的属性 AST 完全一致。

增量以开工 dirty 源字节为基准，**不是把 HEAD 到工作树的他人改动算作本角色修复**：

- [表单增量](a11-meeting-action-layout-developer-20261021-selftmp/meeting-form-developer.patch)，SHA256 `ddab8fe9fb1ff01a6a0ca0fe817879fde3e36d252e85b17af85174738a792ba7`。
- [CSS 增量](a11-meeting-action-layout-developer-20261021-selftmp/records-css-developer.patch)，SHA256 `9a1495280a89443c2d40e8d010e21d62b955f1bdceb76dd38e80d9f516e035c1`。

## 3. 候选指纹

`HEAD=origin/main=9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅为基线，不代替 dirty 候选。修前表单 `80315b722efe83d0508a407e2cab3496ac175191fa3ca1bf2ce65d6c1aa9edcf`、CSS `5c6e93e1f19f75efd228657842e5ac278f839497d4c224331c5735838beac7a7`。

以下路径均相对 `packages/dsh-pm-tool/`，SHA256 为完整值：

| 文件 | bytes | SHA256 |
| --- | ---: | --- |
| `src/client/views/records/records-meeting-form.tsx` | 18126 | `d88c9bee1d2571f7ada3551bc8b7b5f1e7c98d7c2417f78a80a06f4766bb9388` |
| `src/client/views/records.css` | 6842 | `9cc498a0771c109a779b0b2eb073c675ba7f27c46c75a3b4efb9e45f8a984ce6` |
| `src/client/views/records/records-meeting-layout.test.tsx` | 9242 | `6c7a15bc744675af0fda91dcb289366a41491e0f8107bef8c4f7d0ffd6f00344` |

[audit.json](a11-meeting-action-layout-developer-20261021-selftmp/audit.json) 含原图输入 hash、全部 argv/exit、控制属性核验及限定主树/被测副本指纹相等；[完整被测源码索引](a11-meeting-action-layout-developer-20261021-selftmp/frozen-source-fingerprints.json) 381 文件。此索引只认领开发侧私有副本，不代表 Main 全包构建或当前其他在途源文件。

## 4. 红绿与命令

环境：macOS arm64、nvm Node `v22.23.3`，项目约定 pnpm `11.28.5`；没有调用 pnpm install/build。依赖只读复用 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`；React/react-test-renderer `18.3.1`、Vitest `2.1.9`、TypeScript `5.9.3`。私有副本和 Vite/TMP/XDG 缓存均在本前缀 selftmp；未声称全机零污染。

在仓库根执行：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node reports/a11-meeting-action-layout-developer-20261021-run.mjs red
node reports/a11-meeting-action-layout-developer-20261021-run.mjs red-r2
node reports/a11-meeting-action-layout-developer-20261021-run.mjs green
node reports/a11-meeting-action-layout-developer-20261021-run.mjs red-r3
node reports/a11-meeting-action-layout-developer-20261021-run.mjs green-r2
node reports/a11-meeting-action-layout-developer-20261021-audit.mjs
node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
git diff --check -- packages/dsh-pm-tool/src/client/views/records/records-meeting-form.tsx packages/dsh-pm-tool/src/client/views/records.css
```

| 轮次/命令 | 实际退出码与结果 | 原证 |
| --- | --- | --- |
| `red` Vitest | 1，0 tests，主树缺 react-test-renderer；设施失败，不认有效红 | `selftmp/red-vitest.log`、`red.json` |
| `red-r2` Vitest | 1，6/6 红；真实组件已加载。后续发现两个 CSS 检查读取 raw 空文本 | `selftmp/red-r2-vitest.log`、`red-r2.json` |
| `green` Vitest / noEmit | 1，24 绿/2 CSS 设施红；noEmit 0。保原件，不伪报全绿 | `selftmp/green*.log`、`green.json` |
| `red-r3` Vitest | 1，最终同版测试对开工原表单/CSS，6/6 红 | `selftmp/red-r3-vitest.log`、`red-r3.json` |
| `green-r2` Vitest | 0，7 文件、54/54：新布局 6，旧行动项 11，callback/受影响合同 37 | `selftmp/green-r2-vitest.log`、`green-r2.json` |
| `green-r2` noEmit | 0，`tsc --noEmit -p tsconfig.json --incremental false` | `selftmp/green-r2-tsc-noemit.log` |
| audit / vendor / diff-check | 各 0；源码与 AST 保留/同版红绿/静态完整性/空白检查 | `selftmp/audit.json`；vendor 输出为只读静态门 |

runner 对预期红 exit1 记录后自身退出0；这不是把红测签绿。最终 CSS 测试用 PostCSS 解析私有副本真实文件，不 mock 组件、不把 `?raw` 空值当实际 CSS。最终 `red-r3` 与 `green-r2` 的 test SHA 完全相同。

最终 Vitest argv：Node 执行既有依赖 `vitest/vitest.mjs run`，依次指定 `records-meeting-layout.test.tsx`、`records-meeting-entry.test.tsx`、`records-callbacks.test.ts`、`records-payloads.test.ts`、`records-options.test.ts`、`records-entry-guard.test.ts`、`form-validation.test.ts`，再传本前缀 `vitest.config.mjs --maxWorkers=1 --minWorkers=1 --no-cache`。精确绝对路径与 cwd 在 `green-r2.json`；不调用共享产品 vitest config/cache。

## 5. 自查与边界

vendor policy/manifest 先读，静态 verifier exit0 且全部 sha256/bytes 匹配，`vendorIntegrityVerified=true`。锁来源 `49dd158d1076134a641b33efb035946536778336`；`feature→tdd` 指导真实组件红绿，`delivery→code-review` 做作者规范/合同自查。无 installer/setup、联网更新、home/global 写或 vendor 原件复制/改写；不调用缺失 codebase-design。未提供子代理工具，不伪称独立双代理 review。按本次明示边界只在本报告留痕，不写其他 livingdocs。Skill 绿不替独立测试门或毕业。

规范自查：局部 token/容器规则，业务处理与控件属性保留，无越界产品改动。合同自查：全宽容器、独立行、添加动作分离与容器宽度适配已实现；**未实测浏览器 bbox、原生关联菜单、长选项实际显示、窄/深、200%、键盘/滚动或完整保存旅程**。源码/作者自动结果不等 GUI PASS。

Main 按原 A10 §5/closure plan 重采 1440 浅色 0/1/2 行、关联/clear/取消完整可视流程，新候选/产物/actual 下发分别认领；其余父既定用例及原 payload/rawdisk 缺证继续，不扩本次修复。独立专家审证后判定，旧 A10-MGUI-F01 GUI FAIL 未由作者关闭。没有产品 build、全部 verify 回归、服务或发布动作。
