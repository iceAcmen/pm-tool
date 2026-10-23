# SM01 副驾最小化开发交接

> 本报告供 Main 与独立测试专家接续，记录限定修复、冻结输入、原始退出码与保护边界。2026-10-22，平台 trae，角色限定开发；不签独立 PASS、GUI PASS 或整项 RA-AI04。

## 1. 派单与范围

负责人原句：

> 限定开发修SM01，先读AGENTS/collab、docs/testing/a14-sidecar-minimize-contract-20261022.md及本批docs/plans/2026-10-22-sidecar-minimize-closure.md。用户持续收口已授权，不再审批。独占src/client/panel.tsx、panel.css、newsidecar-minimize-retention.test.tsx以及reports/a14-sidecar-minimize-developer-20261022*；不可碰sidecar-portal（读即可）、其他product/testing/livingdocs/backend/模型/配置/vendor。根因copilotMin二选一卸载CopilotPanel；稳定aside身份/hidden+独立竖标签，保持本地全部上下文/实时tasksprops/关闭切项目语义，不捞历史handle不autoask/apply/undo。先自有freeze/no-cache复现专家r3 control绿/三红，再同例修后绿、相关组件/bridge/确认/隐藏层可达/noEmit。可复制专家测试至自有tmp但不得改原期望或product副本自签；正式独立复验另派。禁止install/build/共享lib/GUI/services/credentials/commit。Main当前A13冻结文件GUI，不覆盖旧树。完整hash/argv/exit/保护与并发差异报告，释放后回Main，不自签PASS。若最小结构需要不同文件先报告工程事实，不自扩。

实际仅修改 `packages/dsh-pm-tool/src/client/panel.tsx`、`panel.css`，新增计划指定的 `sidecar-minimize-retention.test.tsx`；其余写入全部位于本报告前缀。没有修改 sidecar-portal、其他产品代码、testing 原件、livingdocs、配置、后端、模型或 vendor。旧脏树及他人成果保留；未 fetch/pull、install、build、跑全包 verify、GUI、服务、凭据、commit/push。

依据：[专家合同](../docs/testing/a14-sidecar-minimize-contract-20261022.md)、[已授权计划](../docs/plans/2026-10-22-sidecar-minimize-closure.md)、AGENTS 与 collaboration §11。本批具体禁止事项覆盖通用构建/同步步骤；不另设审批点。

## 2. 最小产品改动

- 同一稳定 Fragment 的首子项始终是同一个 aside/CopilotPanel，`hidden={copilotMin}`；竖标签为独立的后续条件子项。反复最小化不销毁副驾 state，不增加全局状态/缓存/历史句柄恢复。
- `.pm-sidecar[hidden] { display: none; }` 覆盖已有 `.pm-sidecar { display:flex }`；原 fixed 几何、宽度和 body 内滚不变。隐藏不通过 opacity 或移出屏幕实现。
- 子组件 props 仍从最新 tasks/baseline 等派生；关闭、ESC、真正卸载及切项目的原语句、作用域、projectId 接线不变，未新增 project key 或强行重置。不新增 ask/apply/undo/capture-apply。
- 本批独立补丁：[panel](a14-sidecar-minimize-developer-20261022-selftmp/after-r2/sm01-panel.patch)、[CSS](a14-sidecar-minimize-developer-20261022-selftmp/after-r2/sm01-css.patch)。它们相对本批开工字节，不把已有主树改动混成 SM01。

## 3. 候选与完整 SHA256

基线 `HEAD=origin/main=9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，包 version 0.7.4；均非本批 dirty 候选的完整身份。实际验证对象是自有 `before/frozen` 与 `after-r2/frozen`，不是 Main 运行实例或旧 lib。

| 输入/对象 | SHA256 |
| --- | --- |
| panel 修前 | `8618d9091d3544a4236e9ae92fa0225e3914ea065b910ff1f3cb55013d0bc506` |
| panel 修后 | `0d2a4560e74adb137084d2e37b34625e4b2e5b1801ec76e72fce5b689ccffe03` |
| CSS 修前 | `42f1222456948542464e22de87340c64dd443089183602a6d6a9baf9f25e2063` |
| CSS 修后 | `87ca4fc9f0899d87b3103fcc279a791839a23e921de6511a81086d85d9e54246` |
| 新产品回归测试 | `95e4396e2be961e58aaca045299e45ed339e9b883063479d0066e3953e9eee61` |
| 未改 sidecar-portal | `a3a5e70e459fd74b3454757bcd419e7a2e44b8adce41685dc522dcc494c0ab5d` |
| 原专家测试及字节相同副本 | `5c6a6b9df5a00b42a1ee9e8ebf1a8e004065822783fd2faccad6a9418b115821` |
| 自有采样修正副本，修前/修后相同 | `a707115b91dad74bb4d96d8a3d5dc0b5c5719392588045ec74838e0588928d46` |
| 开工整包 tracked patch | `1b9537297c301bed5d3b5ed6e8e70e54bc6709aa8d77f2f807a70d43d2a818cc` |
| 释放整包 tracked patch | `fe8cf7361ba5a1b2084ef3e06355599442be5ca90c84ba34c86c33cff8a40bde` |
| 修前 src manifest，384 文件 | `c28dfb873bb21ed7956f9c56ae970c05a8284cf38e21c8a2dd9df553f98c5d9b` |
| 修后 src manifest，385 文件 | `24e55592a6b573467f8ee5fa7daccc5da24d660fa97f9a63631c07c606af8632` |
| start.json | `92cfd775d38c1ff3ceabea949a81e124c30554a1948e9e24b33a71883952e9ec` |
| release.json | `af0bc34e8fab8fc062fa409df9dbab6a4158b1ebd90b68414bb1a1a41a7157fc` |

src manifest 的 SHA 是有序对象 JSON 的 SHA，不是目录路径/打包产物 SHA；逐文件 SHA 在 [before/source](a14-sidecar-minimize-developer-20261022-selftmp/before/source.json)、[after/source](a14-sidecar-minimize-developer-20261022-selftmp/after-r2/source.json)。[start](a14-sidecar-minimize-developer-20261022-selftmp/start.json)含开工 tracked/untracked 全清单、规则/专家输入指纹、依赖物理根；[release](a14-sidecar-minimize-developer-20261022-selftmp/release.json)含结束字节、保护根前后清单及差异。新文件不在 git diff 内，须与新测试指纹一并认领。

## 4. 执行环境、命令与真实结果

macOS Darwin 24.6.0 arm64；nvm Node **v22.23.3**；React/renderer **18.3.1**、Vitest **2.1.9**、TypeScript **5.9.3**。pnpm 未调用。复用 A12 的只读依赖软链，其物理根落在 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/.pnpm/`；未安装依赖。每次测试为单 fork、`--no-cache`；HOME/TMPDIR/XDG_CACHE_HOME/DSH_HOME 都在本前缀自有目录。环境白名单没有 API Key 或 credentials。

仓库根、macOS + nvm Node22 的实际父命令：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node reports/a14-sidecar-minimize-developer-20261022-run.mjs before
node reports/a14-sidecar-minimize-developer-20261022-run.mjs after after-r2
node reports/a14-sidecar-minimize-developer-20261022-run.mjs sampling-prepare
node reports/a14-sidecar-minimize-developer-20261022-run.mjs sampling-run
node reports/a14-sidecar-minimize-developer-20261022-run.mjs sampling-before-prepare
node reports/a14-sidecar-minimize-developer-20261022-run.mjs sampling-before-run
node reports/a14-sidecar-minimize-developer-20261022-run.mjs release
git diff --check -- packages/dsh-pm-tool/src/client/panel.tsx packages/dsh-pm-tool/src/client/panel.css
```

这是已执行命令索引，不可直接原地重复覆盖既有目录。prepare 与 run 之间仅在对应自有 tmp 专家副本作 §5 的一行采样修改；没有改源专家或产品测试。重建需另认领自有新输出根，保留原失败轮。

| 轮/验证 | 原退出码 | 真实覆盖与边界 |
| --- | --- | --- |
| before，原专家字节副本 | 父 0；控制 0，A01/A02/A03 各 1 | 原 r3 控制绿/三红复现；父 0 表示退出码符合预期，绝非三红通过 |
| after-r2，原专家字节副本 | **父 1**；控制 0，A01 0，A02 0，**A03 1** | A01 undo/挂载、A02 真 TaskForm payload/保存后入口与输入保留；A03 采样设施异常，见 §5 |
| sampling-r1，修后、仅修采样 | 父 0；控制/A01/A02/A03 各 0 | 原动作及原期望不变；不是“原专家字节副本全部绿” |
| sampling-before-r1，同一采样副本、修前 | 父 0；控制 0，A01/A02/A03 各 1 | 采样修正不能掩盖原缺陷，仍为同一期望三红 |
| 相关组件/bridge/确认回归 | 0；14 文件/121 项 | 含自有 12 项新回归，未调用网络/真实模型/真实撤销 |
| `tsc --project <自有after-r2包>/tsconfig.json --noEmit --incremental false` | 0 | 冻结源完整 noEmit；不产生 lib，既有 tsconfig 排除测试源码 |
| `git diff --check` 限定两产品文件 | 0 | 未在共享脏树全量校验或修复他方内容 |
| release 保护/差异记录 | 0 | 记录差异而非断言全部根零漂移；A13 并发差异单列 |
| 最后 `pgrep -fl 'a14-sidecar-minimize-developer-20261022-run.mjs|vitest'` | 1 | 没有匹配进程；未 kill、未启动服务 |

每次子命令的**完整 executable/argv/cwd/环境白名单/开始结束时间/原退出码/signal**在对应 `<标签>.command.json`；原 stdout/stderr/reporter JSON 也分别保留于 [自有根](a14-sidecar-minimize-developer-20261022-selftmp/)。不得把 reporter 因 `testNamePattern` 排除的另三项 skipped 当成通过。

回归逐文件数量：launch-handshake 23；sidecar-minimize-retention 12；gd-overlay-contract 11；form-dirty 7；contract-pilot 11；tasks-import-confirm 9；ask-copilot-b7 4；refresh-confirm 6；panel-cancel-close 5；panel-checklist-toggle 2；panel-launch-handshake 5；panel-restore-path 9；copilot-task-fields 6；copilot-validate 11。合计 **121**；新测试覆盖真实 aside/子组件身份、连续最小化、hidden祖先可达结构、草稿/勾选/编辑/消息/未发送输入、实时 props/baseline 与 openedAt 陈旧提醒、副驾取消/确认失败、补档未确认上下文、最近三条撤销控件身份、主取消/保存成功/保存失败、快照失败重试、关闭/ESC/焦点回调及原切项目接线。

## 5. A03 采样设施异常，不能改产品来迎合

原专家测试在 L229 获取草稿 checkbox 的 `ReactTestInstance[]`，随后 L233 `mode(..., 'diagnosis')` 正常卸载草稿面板，再于 L235/L237 读取旧实例 `.props`。修前草稿已丢，checks=[]，不会触发这处问题；修后实际保留三项，暴露 `Unable to find node on an unmounted component.`。原 after-r2 A03 **退出码 1 原样保留**；没有据此扩大产品修改到 sidecar-portal 或改变模式显隐。

只在自有 sampling 两轮的专家复制文件把原时点取得的 `.props` 保存成普通值：

```ts
const checks = f.m.root.findAll(node => node.type === 'input' && 'data-copilot-check' in node.props).map(node => ({ props: { ...node.props } }))
```

相对原件只多 `.map(node => ({ props: { ...node.props } }))`，采样前后全部操作、值、数量、软断言、record 与零确认检查未改。runner 严格比较**整文件必须恰为原件的一次该字符串替换**。修前/修后相同采样 SHA；差异在 [sampling-only.patch](a14-sidecar-minimize-developer-20261022-selftmp/sampling-r1/sampling-only.patch)。专家原件及计划/runner/报告四项输入指纹未变。此工程事实须独立专家正式审证，开发副本绿不能自签专家门。

设施早期失败也不抹去：首次异步调用只返回执行 ID，没有取得终态，后续确认无对应进程/无冻结根，退出码记未采得；随后 `before` 在保护清单解析直接 `vite` 软链时 ENOENT，exit1、零用例/无冻结根，改为五个实际直接依赖；首个 `after` 冻结后因 `src` 相对路径混用触发断言，exit1、零用例，目录 `after/frozen` 保留，改设施后另建 `after-r2`，不覆盖失败轮。完整记录见 [设施记录](a14-sidecar-minimize-developer-20261022-infrastructure.json)。TaskTable 缺 key warning 原 stderr 保留，未扩范围修复。

## 6. 保护与并发

开工至释放的主树仓库清单**恰三文件变化**，其他产品/testing/livingdocs/配置/launcher 差异 0；自有修后 src 冻结漂移 0，三文件与主树字节匹配。两产品补丁相对开工字节形成，不覆盖原先 dirty 改动。

主树 lib、A12 lib/source、A12 原证、A14 mixed-r4 原证、五个物理依赖根、主树/A12 的六个公共缓存根均 **SHA/mtime 清单差异 0**。上游、正式数据/凭据/profile 未检查也未操作，不能把登记根扩称全机零污染。

**A13 原证目录差异 43**：`final/materials/native-files/save-round/` 22 项、`final/materials/native-import/csv-cancel/` 8 项、`full-verify/` 13 项，符合 Main 同期原生文件 GUI/验证写域；只读见证并发变化，不推断其独立结论。其中新/旧字节与 mtime 全在 release.json 的 protect/start.protect 清单。未覆盖/删改任何 A13 文件，不重用这些新增证据放行本候选；差异归因须 Main 对照其采集日志，本开发写根不含该目录。

## 7. 释放与下一步

本开发写根仅两产品文件、新产品回归测试、本前缀 reports 及隔离 HOME/TMPDIR/cache/runtime/frozen。所有同步测试子进程已返回、末次进程核验无匹配；不持有 builder、GUI、端口/profile 或服务资源。原冻结/失败/采样轮保留，不清理旧树。

**释放三文件回 Main，独立复验另派**。工程源修复与限定开发验证已交接；原字节 A03 仍保留设施失败，采样修正须专家确认，不报 SM01 独立 PASS。GUI/真实键盘焦点、屏幕阅读树、主列实际尺寸与内滚、真实模型及后端 clean/mixed 撤销均未由本开发执行；hidden祖先断言/CSS扫描/焦点回调不替 GUI。

Main 下一步将本报告指纹、新文件与独立补丁认领为新候选，派不同专家复核 SOURCE/AUTO 和 A03 采样事实；通过适用前置门后由 Main 唯一隔离输出构建/新实例认领/完整下发，再按 SM-G01/02 用**新本进程 fresh handle**采 clean/mixed、正常 TaskForm 外改、最小化/展开保输入/草稿/入口及隐藏层可达。不要补救旧 A12 handle，也不要以旧 A13 GUI、源码存在、子项绿或本报告替代独立审签。livingdocs 由 Main 后续统一同步；本开发不另开功能或提交。
