# B8 打包 FAIL 独立取证（FINAL 插件 abnormal · overlay ENOENT）· 2026-10-20

> QA 只读取证：未启服务/浏览器，未改业务/包/脚本源码。Main 启动 FINAL 插件报 abnormal，精确报错：冻结 profile overlay `node_modules/dsh-pm-tool/cordis.patch.yml` ENOENT。

## 闭环（2026-10-20 · candidate-b8-fix2/run-20261020-083110，QA 独立 --check）
- FAIL1/FAIL2 均闭环；静态 READY（非 GUI PASS）。
- QA 独立 `--check` exit0：RESOLVE_OK specs=11、B8_BUNDLE_PATCH_OK（./cordis.patch.yml sha=6586d489…，frozen=live）、module-table chunks=2（client.editor.js + client.formula-expr.js，无 client.schemas.js 同步块）、bundle smoke PASS（apply 注册 main/sidebar、board 16 卡）、B82_CLIENT_MODULE_SMOKE_OK、CHECK_OK。
- 独立复核：入口无同步相对 `require('./client.*.js')`；仅 2 处 `require.async`（formula-expr/editor）；manifest 430+；client.js sha=4687f977108ce73950338b8451066447e20f6be5f460377019204eb300ebdeee（1,590,314B）。
- 完整 94/94 isolation 待 Main 新证据（旧 94/94 为 worktree 快照，不记当前）。

## 构建回归（2026-10-20 · 已被 fix2 修复，历史记录）
- 方向已 resolved（单 bundle inlineDynamicImports，无兄弟块），但**实现回归未修，打包 BLOCKER 仍 OPEN**。
- 最新 `lib/client.js` 在 :227 语法非法：owner 新增 inlineSync 类插件的替换串误用 `$&`（RegExp 替换占位），把 zod `escapeRegex` 的 `"\$&"` 字面量替换破坏，并把旧同步 require 文本 `const require_schemas = require('./client.schemas.js');` 误注入字符串内 → `SyntaxError: Invalid or unexpected token`（`node --check` 复现）。
- 此前 module-table PASS 发生在 owner 最终 inlineSync 插件落地**之前**，**不得记作当前模块门通过**；待 owner 修复后 QA 再独立过 §QA-GATE + 复算 + isolation。

## 根因（已定位）
1. `packages/dsh-pm-tool/package.json` 声明 `dsh.bundle.patch = "./cordis.patch.yml"`（bundle.patch 相对包根）。
2. 工作树 live 包根**自带** `cordis.patch.yml`（`- insert: id: pm-tool, name: 'dsh-pm-tool'`）。
3. 冻结包 `freeze/dsh-pm-tool/` 根**仅含** exports/lib/locale/node_modules/package.json，**漏掉 cordis.patch.yml**（FREEZE MISSING）。
4. 宿主按 `package.json → dsh.bundle.patch` 解析到 overlay 目标包根 `node_modules/dsh-pm-tool/cordis.patch.yml`，文件缺失 → ENOENT，插件 abnormal。
5. bootstrap 另向 profile 根写 `$prof/cordis.patch.yml`（storage-json root + ui-theme light），`check_assertions` 仅校验该 profile 文件存在且无密钥；它**不满足** package-local `dsh.bundle.patch` 声明，二者不是同一文件。

## 为何静态 --check 绿却运行 FAIL（打包回归缺口）
- `--check` resolver 仅校验 `lib/index.js` 经 overlay 解析落冻结包；`check_assertions` 只查 profile `cordis.yml`/`cordis.patch.yml` 存在+无 secret。
- 静态门**从不校验冻结包是否交付 `dsh.bundle.patch` 声明的包内补丁文件**，也未比对 live 包根必交付运行时文件、未校验 manifest 全匹配。故静态 --check 无法捕获本打包缺陷。

## 修复要求（交 front/owner，QA 不改）
- 新候选 freeze 必须把 `cordis.patch.yml` 随包根交付；保留 `package.json` 的 `dsh.bundle.patch` 声明一致。
- bootstrap/prepare 增加打包回归断言（见下），不得仅靠静态 --check。

## 新 RUN 就绪后 QA 必须独立 --check 追加项
1. overlay 包内 `cordis.patch.yml` 存在、sha256 与 live 源一致、无 provider/apiKey/secret/token。
2. resolver 落冻结包（非 live）；包运行时文件完整（package.json/lib/locale/声明补丁）。
3. live 必交付包根文件逐项比对（patch/package.json 等），无缺项；manifest 全 hash/bytes 匹配。
4. STALE=none（src 不新于 lib）。

## 状态
- 旧 `candidate-final/run-062626` 与过期 `candidate-f2-u5/run-061824` 均标记 expired，证据保留不删。
- 待 front owner 出新固定 RUN 后，QA 再独立 --check 复验；本次不启动、不复用旧候选。

## 修复闭环复验（2026-10-20 · candidate-b8-fix/run-064105，独立静态）
- `--check` exit0：`RESOLVE_OK specs=11`、`B8_BUNDLE_PATCH_OK=./cordis.patch.yml` sha=`6586d489b2311457b03b0247e91f0fbab541ae40e9f7c4b23cd88464a1015d9a`、`CHECK_OK`。
- 独立复核：冻结包根已携带 `cordis.patch.yml`（sha 与 live 一致，403B，`- insert: id: pm-tool, name:'dsh-pm-tool'`）；无 secret、无 `../`/绝对/`~/` 逃逸；package.json `files[]` 含补丁、`dsh.bundle.patch` 声明一致；422 manifest 全 hash/bytes 匹配；lib index/client hash 不变（`4cfd4421…`/`2238c1d9…`）；无 symlink 回指 live src/lib；STALE=none。
- 结论（**已被第二次真实 FAIL 推翻，见下**）：bundle patch 闭环成立，但 client 模块表问题未覆盖，静态 READY 不成立。

## 修复进展（2026-10-20 · owner 单 bundle 方向，QA 独立复跑）
> ⚠ 以下为 owner 最终 inlineSync 插件落地**之前**的快照，**非当前通过证据**；最新 build 已回归（见文首「构建回归」），模块门不得记作当前 PASS，待修复后重跑。
- 方向：`inlineDynamicImports` 单包内联，产物仅 `lib/client.js`（1,850,142B），无 schemas/editor/formula 兄弟块；入口无同步相对 `require('./client.*.js')`。
- QA 独立复跑（当时 worktree）：
  - `verify-client-module-table.mjs` PASS：chunks=0，入口仅平台 require materialize、无预载块、静态扫描无同步相对块 require。
  - `verify-client-bundle.mjs` PASS：factory 激活、apply 注册 main/sidebar、仅 react 外部依赖、board registry 16 卡运行时全保留。
  - 全量隔离：94/94 通过、失败 0、污染 0（before=after=228）。
  - `tsc --noEmit` EXIT0。
- 状态：方向 resolved（非 unresolved）；实现回归未修，打包 BLOCKER 仍 OPEN；待 `candidate-b8-fix2` 新候选就绪后 QA 再过 §QA-GATE + --check(B8_BUNDLE_PATCH_OK) + bundle 复算 + isolation，再更新 checklist refs；旧 b8-fix 保持 expired。

## FAIL2（第二次真实 FAIL，2026-10-20）· host entry require ./client.schemas.js missed module table
### 事实根因（只读取证，未改代码）
1. 入口 `lib/client.js:72` 同步 `const require_schemas = require('./client.schemas.js')`。
2. zod（主块与编辑器块共用）被 rolldown 拆为同步共享块 `client.schemas.js`；该块以 `{id,chunk,factory}` 注册，但宿主模块表既不在 seed 登记、也不按需 materialize。
3. 编辑器/公式块经 `require.async("./client.editor.js"|"./client.formula-expr.js")` 异步拉取注册，可解析；**唯独入口对 schemas 的同步兄弟 require 落到宿主模块表，表内无该模块 → 抛「require ./client.schemas.js missed module table」，插件不激活。**
4. `verify-client-bundle.mjs` 假阳性：它先手动 `loadChunkFactory('client.schemas.js')` 并经 `requireMap` 手动注入 schemasFactory，绕过宿主模块表；只模拟 react 平台模块，未复现宿主表对同步兄弟 require 的解析，故绿。
### 修复方向（owner 决策，QA 不改）
- 单 bundle：把 zod/schemas 内联进 client.js，消除入口一切同步兄弟 require；或
- 改 schemas 为 `require.async` 懒加载并返回 Promise；宿主 seed 登记属宿主侧，非包侧可解。
### QA 新门（owner build 修复后独立跑，见 §QA-GATE）

## §QA-GATE：entry-only 模块表冒烟（替代旧 verify-client-bundle 假阳性）
owner 新候选就绪后，QA 独立执行；**禁手动预载 schemas/editor/formula，禁 requireMap 手动注入 factory**。

### 忠实 makeRequire 模型（最小且等价，不造宿主简化表）
1. **入口单文件 eval**：只 eval `lib/client.js`；假 `__ModuleLoader__` 仅在文件 eval 完成后登记 factory（不在 eval 前塞任何块）。
2. **立即调用入口 factory**：以 makeRequire 立即执行；require 仅放行平台模块（react/react-jsx-runtime/react-dom/react-dom-client）+ 已登记 factory 表；入口执行必须成功返回。
3. **同步相对 require 即红**：入口或任一可达块出现同步 `require('./client.*.js')`（schemas/editor/formula/chunk 兄弟块）→ 冒烟直接 FAIL（宿主模块表无该模块，等价真实 ENOENT）。
4. **require.async 递归 materialize**：遇 `require.async('./client.<name>.js')`，从 emitted 产物读该块 → eval 登记 factory → 递归调用其 factory；每个 async 块各自自包含（外部仅 react 系）。
5. **图完整性**：所有可达块在场；require 命中平台模块或已登记块，否则 FAIL；块均以 `{id,chunk,factory}` 正确注册。
6. **单 bundle 分支**：若采单 bundle，断言产物仅 `client.js`(+`.map`)、无相对 `./client.*.js` require；`apply(ctx)` 注册 main 与 sidebar.panellist 两 slot → 必过。
7. 通过后独立跑：`--check`（含 B8_BUNDLE_PATCH_OK）→ full bundle 复算 → full isolation（93/93 污染0）→ 再更新 checklist 活跃候选 refs；旧候选保持 expired。
8. **宿主序列比对**：尽量对照宿主真实 client-modules 装载顺序（seed→loadCache/factories→async chunk 拉取登记）；宿主私有 require 不可直接 import 时，用公开 ClientModuleSystem/测试 bench 模式复刻注册行为并如实标注，不冒充真实宿主。
9. **移交建议**：请 front 在构建侧新增 `verify-client-module-table`（entry-only、禁预载、async 递归、图完整）；QA 独立复审该门，不替代其实现。

### 宿主真实序列对照（门设计须贴合，不自造简化表）
1. seed：宿主把平台模块（react 系）与已登记块 factory 放入模块表；入口 factory 被以 makeRequire 调用。
2. makeRequire 仅解析：平台模块 + 表内已登记 factory；同步 `require('./client.*.js')` 不在表内 → 直接 miss（等价真实 ENOENT），不得手动注入。
3. `require.async('./client.<name>.js')`：宿主按 CLIENT_CHUNK 拉取同级 emitted 块 URL → eval 登记 factory → 递归调用其 factory；每个 async 块自包含（外部仅 react 系）。
4. 单 bundle 修复：无任何相对 `./client.*.js` require，入口 apply 注册 main + sidebar.panellist 即过。
5. 宿主私有 require 不可直接 import 时，用公开 ClientModuleSystem/测试 bench 模式复刻注册行为并如实标注，不冒充真实宿主。

## 状态
- `candidate-b8-fix/run-064105` 标 FAIL2/expired（bundle patch 已修，但 client 模块表未过）；`candidate-final/run-062626`、`candidate-f2-u5/run-061824`、R4 `run-034827` 均 expired/基线保留，证据不删。
- QA 不启服务/不开浏览器/不改产品代码；待 owner 新候选后独立复跑。

## 源码快审（2026-10-20，非旧总结，仅本次实读）
### 已接线（源码可见）
- **B3 暂存 UI**：`panel.tsx:1501` `stageUploadGate(capabilities)` 传 `stageEnabled` 给 `TaskDraftMaterials`；`:1502` `downloadGate(assetDownload)`；`staged-lifecycle.ts` 双 flag 门（assetUpload&&stageCancel）；`stage-client.ts` stageAsset/cancelStagedAsset 已接。
- **面板 slot**：`lib/client/index.js:24/29` inject `main` + `sidebar.panellist`。
- **备份字节测试**：`file-backup.test.ts` 覆盖 roundtrip（manifest sha/size/count/bundleId）、损坏 sha 零写拒绝、bundleId 不符拒绝、legacy 无 file_assets no-op、提升中途故障回滚（仅删本次新写字节、源既有字节不动）、relPath 穿越拒绝。
- **能力门控**：client 侧消费 httpAvailable/previewApi/assetUpload/assetDownload/stageCancel/limits（panel.tsx:346-354、staged-lifecycle.ts）。

### 真实剩余缺口（仅当前实读，不复述旧摘要）
1. **B8 打包 BLOCKER OPEN（FAIL2）**：入口同步 require schemas 块，宿主模块表 missed；未修前插件不激活，GUI 采证无从谈起。
2. 非代码阻塞：G-B 无 render/unmount 自动化工具（manual 手测，归 Main 计划）；source error UI 待补。
3. 已完成（旧缺口已关闭，勿再列）：selectedRefs panel+preview 已集成（records-callbacks/records-props/报表表单）；material commit 已改 raw=create-only 整体重建、编辑走 ops 信封且 update 拒 raw（task-materials.ts:153/277/278，client b2-ops 统一 ops）；deliverable wrapped 分组已修（deliverables.tsx STATUS_ORDER/分组筛选）；B5/B7 外部表单（ExtOkrForm/ExtHabitForm 等）已注入 panel，QA 静态 PASS；records 集成测试 37/37 已过；#41（备份 extra 表 + file_assets）实现+测试已完成，非仓内字面字符串。
