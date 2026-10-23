# 任务首读开发交接

2026-10-23，trae，开发角色。已实现与开发自测，不签独立 PASS；最终释放事实读自有 `released.json` 和 `outer-readback.status.json`。父普通提交授权不转为本单 git 权限。

## 范围与最新指令

原授权及逐步进度见[开发实施记录](2026-10-23-task-firstload-developer-plan.md)。已读 AGENTS、collaboration §9/§11、[Main 方案](2026-10-23-task-firstload-repair.md)、[固定专家先行合同](../testing/tasks-failure-gui-timed-20261023-r3-firstload-plan.md)。本单替代通用 fetch/install/build SOP 和 livingdocs/git 收尾；未做整 build、服务、GUI、桌面、git、push、runtime 或正式树操作。

负责人最新原句：

> 固定专家已独立确认另两红：O4确认ESC仍开，及stale banner挤成左长列导致顶栏导航叠压。Main不让你抢改；你先完成本单首读两文件最小redgreen/封交，若尚未业务patch可先报目前状态以便同panel后继追加，不改scope。

> 将同域后继合并一次整build，原L8源已PASS。

接到补充时首读业务 patch 已写，初次 green9/9、affected30/30 已有原证，正在补测试必填 executeRaw。没有追加 O4/stale 布局修复；它们仍为独立红，不继承本单绿或 L8 有限 PASS。O4 注册顺序根因未签，不按假设抢改 DrawerPanel/ConfirmHost。释放后 Main 统筹同 panel 后继并合并一次整包构建。

## 最小产品增量

- `packages/dsh-pm-tool/src/client/panel.tsx`：新增 hasSnapshot 与 snapshotPending，首次未知/失败不显示假空；只有当前有效 generation 的解析成功才置 hasSnapshot。项目 ID 映射先于 setData，避免其抛错时把未知标成成功。保留通用 busy 与 launcher 原守卫；首次失败现有类 + role=status 显示原原因/重试；已有成功再失败仍保数据和旧陈旧提示。
- 新增 `packages/dsh-pm-tool/src/client/panel-firstload.test.tsx`：真实 PmPanel、createRoot、StrictMode；仅替 DOM 与 transport。9 项覆盖延迟有项目、空成功、首败重试、已有成功后失败重试、成功空后失败、旧 generation 的 empty/project/reject、通用命令 busy 不伪装首 pending。project/task fixture 均由生产 write schema 解析，固定合法 ID/时间，无数据文件写入。

| 对象 | SHA256 |
| --- | --- |
| 原始 panel / 所有红轮 | `341675c4dd31b87d05264de520a4c198edbb3c3476f2f87d8f38cc80ba1d83d6` |
| 修后 panel / green-r2 / affected-r2 / type-r2 / 工作树 | `b83eba55bb0f40e69599af04d95adb9c6f3133ceab645fef3d6f92734ab14cf4` |
| 最终同一个 red-r4 / green-r2 / affected-r2 / type-r2 测试 | `ec0bcc59fb57b925968ba533c2075ef21f39f7c120a252b8935027b280777277` |

`audit.json` 实核 red-r4→green-r2 的 src 差异仅 panel，三个最终修后 src 相同；launchMount effect 与 DrawerPanel 及后续定义逐字不变。没有新 CSS、来源/时间变更、命令/domain/schema 改动。原 stale banner 的布局问题不在本单修复范围，不能因陈旧链组件测试绿而称布局绿。

父输入只读继承 L8 已封静态 `main-source125.json` / `main-complete526.json`，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；未查询 git。逐声明输入核基线无差异，首读仅 panel 改字节 + 新测试一项，得 `main-source126.json` / `main-complete527.json`。这是声明输入 125→126、526→527，不是重新宽扫描的完整候选、整 build 或已装载实例。Main 后继有新变更须重新认领。

## 原证与环境

证据根：`/tmp/task-firstload-developer-20261023-QO7zxE`，真实根 `/private/tmp/task-firstload-developer-20261023-QO7zxE`。每轮独立 src/config/home/tmp/cache/output，复用既有依赖的只读链接，无 install；每轮输入清单 416 项，其中 src410。最终 input/配置 SHA、依赖 package.json realpath/version/SHA 及前后一致核对均在 `audit.json`。

macOS arm64，Node `v22.23.3`，绝对入口 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`；Vitest2.1.9、TypeScript5.9.3、React/react-dom/react-test-renderer18.3.1、jsdom25.0.1、Zod4.6.5。新 DOM 测试复用 `.tmp/widget-poc/node_modules` 的 React/react-dom/jsdom；原 renderer 邻接轮用包自身 React，防止两份 React 混用。所有实际 cache 均在自有根，原 deprecated cache 警告保留。

保留：每轮 `inputs.json`、`dependencies.json`、`vitest.owned.config.mjs`、完整 stdout/stderr、JSON 测试报告、逐阶段原 DOM/calls/handshake/fixture 指纹观察、child status、outer status。StrictMode 确实触发两个首读请求；旧 empty/project/reject 不宣就绪、不回告，当前真实 success 才处理 hash。组件 gate 不靠睡眠，未以此冒充原 GUI 至少 3 秒 hold 的采证。

所有实际验证均由下述外层调用，`<轮次>` 展开值及真实结果见下一表；每次展开 cwd/argv/env/PID 外的状态信息见对应 JSON：

```sh
# macOS，已装 Node 22；不调用 pnpm/install/build
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  /tmp/task-firstload-developer-20261023-QO7zxE/outer.mjs <轮次>
```

测试子命令在各轮自有 cwd 为：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  node_modules/vitest/vitest.mjs run src/client/panel-firstload.test.tsx \
  --config vitest.owned.config.mjs
```

affected/affected-r2 同命令指定 `src/client/panel-transport-error-feedback.test.tsx src/client/panel-launch-handshake.test.tsx src/client/panel-checklist-toggle.test.tsx`，各为23/5/2项；实际 `--pool forks` 等来自隔离配置，worker1，不改 oracle 或业务组件。type/type-r2 用：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  node_modules/typescript/bin/tsc -p tsconfig.narrow.json --noEmit --incremental false
```

narrow include 仅新测试及既有 d.ts，沿真实 panel 导入链，原 strict/NodeNext/react-jsx 不改，不整包 emit/build。只读 vendor 子命令为绝对 `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs`，实际 argv 指仓库脚本，cwd/HOME/TMPDIR/cache 自有；实际0，另 mattpocock13文件 SHA/bytes 逐条核对。

## 真实计时与失败保留

下表起止均为2026-10-23 UTC，耗时取 outer 单调计时；每步真实 child 起止/耗时另在轮内 status，不把二者相加。命令已经执行，非估计。此前首次合同/设施阅读和手动编辑只有工具 wall time，未记录完整起止，不能补造为本表统计。

| outer 轮次 | 开始 Z | 结束 Z | 秒 | 终码 / 结果 |
| --- | --- | --- | --- | --- |
| baseline | 02:08:54.228 | 02:08:55.120 | 0.890 | 0，125/526一致，原 panel 保存 |
| vendor | 02:08:54.228 | 02:08:54.837 | 0.607 | 0，静态校验及锁定指纹 |
| red | 02:10:30.519 | 02:10:42.417 | 11.897 | 1，6产品断言红+3设施错误 |
| red-r2 | 02:11:19.198 | 02:11:32.115 | 12.916 | 1，6产品断言红+2定位错误，1控制绿 |
| red-r3 | 02:13:14.416 | 02:13:26.234 | 11.817 | 1，6红/3控制绿，设施已齐 |
| green | 02:14:10.652 | 02:14:31.669 | 21.016 | 0，首读9/9 |
| affected | 02:14:10.845 | 02:14:34.183 | 23.332 | 0，邻接30/30 |
| type | 02:14:35.095 | 02:15:02.547 | 27.451 | 2，测试漏必填 executeRaw |
| red-r4 | 02:16:06.409 | 02:16:23.161 | 16.751 | 1，最终同指纹原 panel，6红/3绿 |
| type-r2 | 02:16:06.410 | 02:16:35.521 | 29.111 | 0，最终窄类型 |
| green-r2 | 02:16:41.471 | 02:16:55.831 | 14.353 | 0，最终同指纹9/9 |
| affected-r2 | 02:16:41.475 | 02:16:57.362 | 15.886 | 0，最终邻接30/30 |
| audit | 02:18:02.527 | 02:18:03.952 | 1.424 | 0，唯一 panel 红绿差异/声明非自有delta空 |

首轮漏 CSS.escape，第二轮误用 data-task-id 和阶段行的完成按钮，均是开发设施错误，不给产品开缺陷、不洗红。仅补已有 CSS.escape、正确 data-pm-row、按状态分组进入真实任务操作；期望断言和原 fixture 没放宽。type 初轮漏必填 prop，只补禁止 raw 命令的 transport 参数；red-r4 在自有目录从保存的原 panel 覆盖隔离副本，未回退工作树或他人成果。最终红绿9项 oracle 同字节，全部早期日志/观察留存。

效率复盘：基线至 audit 墙钟549.724秒；outer耗时求和187.451秒，按实际区间并集去重134.936秒，不把并行双计。red/red-r2/type 三个含设施问题的轮次合计52.264秒，是明确返工成本，非产品修复耗时。下次应先逐字段核 PmPanelApi、完整复用 DOM CSS.escape、读实际阶段/叶行标识，再冻结测试指纹。隔离双轮并行只缩短当批等待，没有据此宣称倍数提升；未整 build，Main 保持一次合并构建。未宽扫报告全树/活 runtime；`rg` 不可用改限定文件 grep/find。记忆路径不可访问，未让其替代仓库合同。

## 审查与边界

vendor 已实际完整性校验后自动路由 tdd，锁定 `49dd158d1076134a641b33efb035946536778336`；真实组件边界已由负责人/方案指定。单项整套先红与同指纹红绿按本单明确要求执行，不照 vendor 默认再问或拆成多次改 oracle。交付只读加载 code-review，自查 Standards/Spec：无额外产品写、CSS、配置、抽象或业务字段改动；首读四类状态实现与合同一致。未提供双审子代理工具，只有开发自查，不冒充独立审源；不执行 skill 的 git/setup/installer/全局写。独立 SOURCE/AUTO/GUI 判定仍归专家。

写面核查仅原125声明与526包输入、给定合同和本单文件。audit 的 nonownedDelta=[] 只对这些声明路径成立；不监测未声明新增文件、整 docs/testing 树、依赖全树、runtime/private/正式/data/lib，不称全盘零污染。两处 gantt 源/测试与全部声明非自有输入保持原 SHA。CSS/GUI/原生缩放/O4/stale布局/完整验收未在本单执行，不转 MANUAL_PENDING。

## Main 接续与停止

1. 回读 `handoff.json`、`seal.json`、`readback.json`、`released.json` 和全部 outer/child status，核本单两产品及两文档 SHA；不是 HEAD/version/运行实例身份。
2. 固定独立专家审本单最小源差异与自动原证；两文件释放后 Main 另行排同 panel 的 O4/stale 布局已确证修复，勿把根因推断或既有有限 PASS 扩成整项。
3. Main 将本单、L8 及已批准同域后继唯一冻结，认领最新全部输入并一次整包 build/全回归；本单src410/窄测39不是整包放行。
4. Main 按固定原 FE/FS 合同合法 hold 首读至少3秒，真实成功/失败/重试/空库回读与原 GUI 采证；固定专家裁可见有限段。完整适用门合格后 Main 才处理父 ordinarycommit；无本单 git/push/release/正式切。

最后三步真实执行命令如下，起止/耗时/终码保存同名 outer status；本 Markdown 在执行前冻结，不预造这些收据：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/task-firstload-developer-20261023-QO7zxE/outer.mjs handoff
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/task-firstload-developer-20261023-QO7zxE/outer.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/task-firstload-developer-20261023-QO7zxE/outer.mjs readback
```

readback 验全部封件字节、两产品/两文档与实际终码，再写 released/STOP。封后不改 scope、不续开功能、不抢 Main 整 builder/GUI/desktop；开发不自 PASS。
