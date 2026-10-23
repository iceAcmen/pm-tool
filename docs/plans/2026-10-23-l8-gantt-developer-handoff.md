# L8 甘特修复开发交接

本文记录开发侧两文件修复与自测原证，供 Main 和独立专家接续；不签独立 PASS。2026-10-23，平台 trae。最终释放状态以自有证据根的 `released.json` 和 `outer-readback.status.json` 为准。

## 授权与范围

父派单原句：

> 父授权确证修复/完整验收至普通commit，Main唯一整包builder/GUI/桌面。你开发，唯一产品写 packages/dsh-pm-tool/src/client/views/gantt.tsx 与新增 gantt-status.test.tsx；唯一开发文档 docs/plans/2026-10-23-l8-gantt-developer-*及自有/tmp证据，不能写docs/testing/其他产品/livingdocs，不能整build/服务/GUI/git/push。

本单明确替代 AGENTS 的通用 fetch/pull、install、整包 build、完整回归、livingdocs 同步及 commit 收尾。已读 AGENTS、collaboration §9/§11、[已批准设计](2026-10-23-l8-gantt-repair-design.md)与[独立先行 T01–T04](../testing/l8-gantt-refresh-defect-20261023-r3-test-plan.md)。授权已清楚，不重复 brainstorming/writing-plans 的方案确认；不启新功能、不操作服务/GUI/桌面/git、不执行 Main 脚本，不进入活 runtime/private/正式树。

## 实际改动

唯一产品写面：

- `packages/dsh-pm-tool/src/client/views/gantt.tsx`：原 `ganttStatusText` 补 wrapped→“已收尾 · 非正式完成”；条体 `statusText` 调用该函数。
- 新增 `packages/dsh-pm-tool/src/client/views/gantt-status.test.tsx`：真实 React `GanttView` 的五态左列/条体及必要进度窄测。

精确允许补丁与原文件逐字比较已实际核对。`done=t.status==='done'`、状态 class、进度解析/填充、聚合/逾期、父范围带、日期写白名单与回调均未改。未知值兜底仍“待办”，未新增颜色/组件/状态或改业务 schema。

| 身份 | SHA256 |
| --- | --- |
| 原 gantt / red | `838a43451e037fdff363ce73e00570512d785f09f45688bf17afdb08ebc730bf` |
| 修后 gantt / green / type /交接源码 | `06f0188c9185ec8e3444fa9d2665fcb716a1381f2c84bde3afc7f591177386e7` |
| 同一个 red/green/type 测试文件 | `28e6f478fd6d16d78707d4976ea88981d0cce838c2be38ff50dd5804ddc6690c` |

Git/HEAD 未查询：本单禁止 git。上述 SHA 是真实文件字节，不声称代表父候选完整版本或任何已装载 runtime。

Main 输入实际增量已核：封存 `CombinedF02RepairR2/source-files.json` 为124，`complete-inputs.json`为525，基线提交记录 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。本单当前实枚举 **source125/complete526**，不是从数字推断：已有 gantt 字节改变（不新增 source 条数），新增测试一条；其余完整包输入和124原声明中非 gantt 的字节 SHA 全同。`main-source125.json`、`main-complete526.json` 与 `parent-input-delta.json` 保存新清单、原清单 SHA 和精确两文件 delta。仅只读封存 manifest 和静态源码，不读取其活 runtime、不执行 Main executor；这不是新候选的 build/装载/独立门。

新 source125 清单 SHA：`de2b4ea63e87e0be8470b85a91c785ef0d6e04ed71f590f6f1ffea75c979987b`；新 complete526 清单 SHA：`74688fa9395589a11efb09f568fac352b73ff4ea0687da537e3bf5c308a0d3fa`。

## 测试与证据

自有证据根：`/tmp/l8-gantt-developer-20261023-Pes2Ba`；macOS 真实路径为 `/private/tmp/l8-gantt-developer-20261023-Pes2Ba`。新建互不重用的 `red/green/type`，分别复制全部 409 个 src 文件和配置，输入清单各 413 条。不是 Main 的 526 完整输入或整包候选。各轮源码、配置、依赖版本/realpath、input、observations、stdout/stderr、child status 与 outer status 都留原件，最终 seal 逐文件 SHA。

实际运行：macOS arm64，Node `v22.23.3`，绝对入口 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`；Vitest `2.1.9`、TypeScript `5.9.3`、React/react-test-renderer `18.3.1`、Zod `4.6.5`。现有 pnpm 环境只读复用，未调用 pnpm/install。`node_modules` 仅在自有新目录建指向既有依赖的符号链接；HOME/TMPDIR/XDG_CACHE_HOME/Vite/Vitest cache 均指向各轮自有目录。没有宿主、端口、profile、GUI 或正式 runtime 认领。

实际验证命令（以下 Node 均用上述绝对入口；cwd/展开 argv 见对应 status JSON）：

| 命令 | 真实结果与覆盖 |
| --- | --- |
| `node /tmp/l8-gantt-developer-20261023-Pes2Ba/outer.mjs baseline` | outer 0，原 gantt SHA 相同，写面基线保存 |
| `node /tmp/l8-gantt-developer-20261023-Pes2Ba/outer.mjs red` | child/outer 1；13 项中 3 项失败、10 项通过，失败仅 wrapped 左列/有排期 aria/无排期 L8 左列 |
| `node /tmp/l8-gantt-developer-20261023-Pes2Ba/outer.mjs green` | child/outer 0；6 文件 46/46：本单 13、criticalPath 8、routeEdge 5、milestoneLink 4、progress-meta 5、progress-clamp 11 |
| `node /tmp/l8-gantt-developer-20261023-Pes2Ba/outer.mjs type` | child/outer 0；以原 strict/NodeNext/react-jsx 配置，只 include 新测试及 d.ts，`tsc -p tsconfig.narrow.json --noEmit --incremental false`，覆盖真实导入链，无整包 emit/build |
| `node /tmp/l8-gantt-developer-20261023-Pes2Ba/outer.mjs decode-red` | outer 0，恢复 ANSI 后的 17 个结构化观察；初始空解码及原 stdout 保留 |
| `node /tmp/l8-gantt-developer-20261023-Pes2Ba/outer.mjs audit` | outer 0；17 组红绿 input SHA 同，非 wrapped 全观察字节同；wrapped 仅副行/aria 状态文案变，class/日期/填充/标题/输入均同 |
| `node /tmp/l8-gantt-developer-20261023-Pes2Ba/outer.mjs parent-inputs` | outer 0；封存父124/525→当前实枚举source125/complete526，唯一完整包增量是 gantt 改和测试新增 |
| `node /tmp/l8-gantt-developer-20261023-Pes2Ba/outer.mjs vendor` | outer 0；manifest 13/13 文件 SHA/bytes 同锁定来源，不运行 Main verifier |
| `node /tmp/l8-gantt-developer-20261023-Pes2Ba/outer.mjs delta delta-pre-doc.json` | outer 0；两产品 ownedDelta、12 项并行 nonownedDelta，逐项 SHA 在 JSON |

Vitest 展开命令为每轮包中：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  node_modules/vitest/vitest.mjs run src/client/views/gantt-status.test.tsx \
  --config vitest.owned.config.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

green 同命令另加上表五个现有 core 测试文件。`vitest.owned.config.ts` 只指定自有 cache 根，不替换产品组件、派生函数或测试 oracle。缓存参数有弃用警告，原 stderr 保留；实际缓存仍在自有根。

fixture 逐次由生产 `taskWriteSchema.parse` 返回。原 L8 条件保持 `p-0001/t-0010/F2-L8/code6/parent=t-0001`、wrapped、legacy0、清单 UUID `90156246-014f-4ba3-9693-e34edd29871c`、1/1=true、due=2026-10-20，无 start/completedDate。另有合法独立排期任务形成 axis。无排期 L8 真实条体数 0；五态有排期时命中 DIV、role=button、data-task-id，原日期/工期/客观进度/键盘提示保留，wrapped 无 done class。L5 2/5/null→40、L3 无信号/null/legacy40→空填充，各自同实例 manual70→clear 后回落40/null，未调用写命令。

src 红绿差异仅 gantt；green/type/live src 一致。同一测试 SHA 未变，不修改 oracle 追绿。`audit.json` 保存完整配对，包括父/目标输入及实际 class/aria。既有两个报告 snapshot=66、父63/覆盖、拖拽日期落盘与完整 GUI 没有在本单重新执行或签通过。

## 写面与失败保留

成功基线与 delta 只监测：src/scripts/vendor/skills 递归、root/docs/docs-plans/docs-testing/package root 的直接静态文件。不监测证据子目录/活 runtime/private/正式/data/lib/node_modules；不把此范围零写扩为全盘零污染。

截至 `delta-pre-doc.json`：owned 两产品；nonowned 新增 12 项，分别是 F1/FL 的 fd/seal 两个 mjs、final-remaining reconcile 的 audit/queue/reader/table 四项、P2002Tree 审证的 readback/tool-receipt/seal/tool-receipt/tool-receipts/visual-review 六项。均未由开发写入、删除或回退，未据此判定污染或父门通过。封件前的最终清单见 `delta-final.json`，可能含并行角色后续变化；开发文档仅本文件。

本单取证准备错误照实保留：首次直接执行 helper 因缺括号 SyntaxError，真实终码1；修正后首次宽范围基线扫描过长，精确停止自有 Node PID38642（不是服务），无基线产物，随后收窄为上述静态写面并实际取得 outer0。该两次仅有工具现场记录，不伪造补录 stdout。红测 stdout 初次 ANSI 解码为空，另新建 decoded 原证，未覆盖红日志。差异命令真实1表示文件不同，audit 外层在精确核对允许补丁后真实0。没有洗掉任何产品红测。

## 方法自查

已读 vendor 治理；Main `verify-external-skills` 实际0的事实继承派单/设计，本单另自有逐13文件校SHA实际0。锁定来源 `49dd158d1076134a641b33efb035946536778336`。trivial 抑制 grill/tdd，不免独立先行门。

交付边界只读加载 code-review，按 Standards/Spec 两轴自查：Standards 未发现本单产品越界/重复映射/多余抽象；Spec 与两处最小补丁一致，T01/T02 组件层和 T04 必要控制有原证，T02/T03 GUI 与 T04 完整回归仍交 Main。未提供并行审查子代理工具，故只报告开发自查，不冒充独立 review。固定点用给定原源码 SHA，不运行其 git/setup/installer/额外提问，也不把零发现视为 PASS。8 条 vendor 红线未触发产品写之外的操作。

## Main 接续与停止

1. 读取 `handoff.json`、`seal.json`、`readback.json`、`released.json`及对应 outer status；验证两产品 SHA 与输入范围，接独立 SOURCE/AUTO 审证。
2. Main 独占认领父候选全部输入，唯一整包构建/完整测试/全部 verify，不能拿本单 src409/窄测46当整包通过。
3. 按原独立合同在合法隔离实例采 T02/T03 原 GUI：原无排期 L8 进入/刷新，配对 snapshot 请求返回/业务回读；正常日期保存后再采真实有排期条体，保留完整原件。T04 日期写及其他受影响回归用既有合同。
4. 父完整适用门由独立专家判定后，Main 才处理已授权普通 commit；本单无 commit/push/release/正式切。

开发不自 PASS；独立验收/GUI/完整构建为后继 NOT_RUN，不擅转 MANUAL_PENDING。自有 handoff/seal/readback 全部真实0后释放两产品写权，**released/STOP**，不继续改产品或抢占 Main 资源。

封件命令由开发实际执行，终码以 `outer-handoff/outer-seal/outer-readback.status.json` 回读为准；不是在本文预签0：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/l8-gantt-developer-20261023-Pes2Ba/outer.mjs delta delta-final.json
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/l8-gantt-developer-20261023-Pes2Ba/close-outer.mjs handoff
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/l8-gantt-developer-20261023-Pes2Ba/close-outer.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/l8-gantt-developer-20261023-Pes2Ba/close-outer.mjs readback
```

handoff 另做四个自有 mjs 的 `node --check`，新 tsx 的类型验证见上表实际 narrow noEmit0。seal 包括自有缓存、输出、全部冻结源、输入/观察/outer 原件；readback 核这些字节、两产品/本文 SHA、实际终码和最终 ownedDelta，再输出 `released.json`，不签专家 PASS。
