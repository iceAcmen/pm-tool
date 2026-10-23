# 资料进展引用崩溃必要红最小合同

> 2026-10-22，trae，独立必要红专家，非开发、非 GUI。采用 writing-plans 的先合同后执行顺序；本件只在派单前缀写入，不执行其通用开发/提交流程。

## 授权与对象

负责人本批原句：

> 父授权多角色持续验余项/确证缺陷修复已生效。你是独立必要红专家，非开发非GUI，唯一写docs/testing/material-progress-ref-crash-20261022-r1*，不改产品/他人报告/服务/Git。
>
> Test优先render真实TaskDraftMaterials与生产TaskDraftSession，真React事件currentTarget生命周期，不能把e.currentTarget永活mock掩盖问题。
>
> 不新增全球dirty/UX/样式要求，现RA-M06/J03必须能选c2+file refs并一次主save，当前崩是确证疑点。
>
> 交根因/有限SOURCE/AUTO结论/必要红原件/最小开发面/控制，停止STOP。

- Main 补充事实：旧 U4r2/3257 的 J03 新建，两链接 c1/c2、22 byte qa-note.md 暂存 c3、作者/正文后真实点击第二 refs checkbox，两次 PM shell 消失并清 stage。不是本专家 GUI 观察或审签。
- Main 原证 `reports/all-pending-evidence-20261021/MaterialRemainingR1/20-j03r3-file-ready*`、`21-j03-before-reference*`、`22-j03-after-reference*`、`22-j03-reference-events.json` 仍在途；本专家不冻结、不写、不审该目录。
- 有效 Oracle：`remaining-journey-cases-20261021.md` RA-M06/RA-J03 与 materials 原 GUI handoff。只测合法 refs 选择和单信封提交；不新增 dirty、样式或全局 UX 合同。
- 本地真实生产会话名是 `createOpsSession()`/`OpsSession`，文件 `src/client/shared/b2-ops.ts`；没有 `TaskDraftSession` 命名导出。不自造同名替身。

## 冻结与设施

- 先完整复制旧 `/private/tmp/pmtool-u4-closure-20261022-r2/packages/dsh-pm-tool` 的 src/scripts/locale/配置及完整 node_modules 到本前缀 selftmp，保存逐文件 SHA、内部链接和独占 inode 核验。不复制或使用 lib/coverage/artifacts。
- 补充既有兼容 DOM 依赖仅从 Main 先前准备的 `/private/tmp/pmtool-f02-dom-deps-20261022` 完整复制，依据 `a15-f02-strict-effects-dom-retest-20261022-plan.md` 既有设施授权，锁 SHA `15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973`。不运行 install/setup，不改两处原依赖。
- 原 U4r2 React18/ReactDOM19 import 兼容性单独探测，设施失败保原退出码，不算产品红。DOM 测试显式 alias 全部 React/JSX/ReactDOM 到同一复制的 React18 实例。
- 真实 JSDOM + createRoot + 原组件 + 原 OpsSession + 原 stage-client + 原 asset-route/JSON领域；传输只在进程内调用生产路由，零 HTTP/网络。真实 `.click()`/原生冒泡 input 事件，不直接给产品 onChange 传永活 currentTarget。
- 文件 FileList 注入仅模拟 chooser 交付，File 为真实 JSDOM File；本专家不做原生 chooser/GUI 结论。
- Vitest `--no-cache`，singleFork、min/maxWorkers=1、fileParallelism=false；白名单环境、自有 HOME/TMPDIR/cache/DSH_HOME/files/data，不继承 key/模型/正式根。无 build/install/共享 lib/cache/上游/Git/服务/全回归。
- 比较冻结所用材料/会话/路由依赖与主树当前字节；Cycle 三产品/两 tests、ATF 在途文件不锁、不作为本次门对象。基线引用 U4 原认领文件，未运行 Git，不以基线单独代表候选。

## 用例

| ID | 步骤 | 有限预期 |
| --- | --- | --- |
| C01 | 真实 ReactDOM Probe 输入、checkbox `.click()`，记录事件内部/返回后 currentTarget；两次点击 | 内部是真 input，返回后 null，第二次选中；证明设施而非产品 |
| C02 | 原 OpsSession 两 link + file + progress refs=[c-2,c-3]，build/validate | 合法单信封保精确 refs；非 UI 通过 |
| C03 | 原组件两 link + 22 byte 真 stage，不选 refs→追加进展→一次 addTask 主保存 | 控制无 refs 路径可保存，submissionRef=true 卸载不 DELETE |
| N01 | 编辑合法既有资料，正常作者/正文，依次真实 click 两 refs→追加进展 | 不崩、refs 精确两既有 ID |
| N02 | 新建两 link，正常作者/正文，click c-2→追加进展 | 不崩、refs 精确 c-2 |
| N03 | 新建两 link + 真文件 c-3，正常作者/正文，click c-2 再 c-3→追加→一次主保存 | shell 保留，单信封 refs 精确 c-2/c-3、落库解析真实 at-ID、文件字节保留 |
| N04 | 同 N03，但先 click 文件再 c-2 | 排除特定资料类型/次序单因；refs 精确 c-3/c-2 |

对每个必要红保原断言：不因崩溃改为期待抛错。ErrorBoundary 仅外层记录真实 render 错误/组件卸载，不替换产品逻辑；console/stack、事件 before/after、stage/data/DB、envelope、删除请求均留原件。崩后未能执行主保存如实 NOT_REACHED，不伪造 refs 或补命令绕过。

## 判定与停止

- 先 C01/C02/C03，再 N01..04。设施失败 BLOCKED；只修自有设施另轮，不改产品和 Oracle，不覆盖失败轮。
- 必要红须绑定复制候选/测试文件 SHA、真实错误栈和实际 DOM/路由/领域状态；SOURCE 只用于解释已经执行的 AUTO，不凭源码签红。
- 发现红仅交最小开发面：候选 `task-draft-materials.tsx` 引用 onChange 事件读取边界及必要同域回归；不自修、不签修后 PASS。
- GUI、真实宿主 shell、native chooser、RA-M06/J03整项、Cycle/ATF、发布不在本结论。
- 自有封存/保护终核、有限报告交付后 STOP；不规划或启动下一功能。

## 执行命令与状态

运行环境 macOS + nvm Node22，项目 pnpm11.28.5，本批不执行 pnpm。

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/material-progress-ref-crash-20261022-r1-run.mjs r1
```

- [x] 只读上下文/既有合同核对，计划先行。
- [x] 完整冻结511输入、两套独占依赖复制；原 React18/DOM19 import 设施 exit1 保留。
- [x] 七项全部执行：三控制绿、四必要红；三个 currentTarget 崩溃与一 refs 选项缺失分开记录，原 Vitest exit1 保留。
- [x] 根因/同组件最小开发面/有限报告交付；终核原依赖/输入/产物无漂移，审计 exit0 不替产品 PASS，进程已退出，STOP。
