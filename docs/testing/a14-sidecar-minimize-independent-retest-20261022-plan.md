# SM01 独立复验计划

> 2026-10-22；平台 trae；独立测试专家。采用 writing-plans 的文件级步骤和原证优先核验，不实施产品修复。具体派单优先于通用 install/build/livingdocs/commit SOP。

## 目标与授权

负责人原句：

> 独立复验SM01，先读AGENTS/collab §9/11、docs/testing/a14-sidecar-minimize-contract-20261022.md及原r3测试/原证、docs/plans/2026-10-22-sidecar-minimize-closure.md、reports/a14-sidecar-minimize-developer-20261022.md。开发已释放panel.tsx/panel.css/newsidecar-minimize-retention.test.tsx。你不改产品、不build/install/GUI/services/credentials/commit，不写共享livingdocs，仅docs/testing/a14-sidecar-minimize-independent-retest-20261022*自有freeze/no-cache。核同源旧control绿三红复现→新三绿、隐藏aside不占位/不拦焦点/真实父子保持undo/未发送/勾选编辑与实时props，关闭/切项目旧语义回归。dev报告A03原测试抓旧nodeprops导致预期读值误判，开发只自有副本调整采样；请自行审是否有效设施纠正，保原测试/失败，不偷改期望，不以dev121自签。原专家r3可逐项复验，需适配则自有副本明确diff。相关panel/bridge/确认/capture回归+noemit及源/旧原证/依赖/主与A11/A12/A13 lib hash+mtime保护；主src后有并发变化须scope分开，不重冻旧失败。给有限SOURCE/AUTO PASS/FAIL/具体hash和完整argv/exits，GUI NOT_RUN待Main新builder/新freshgatewayhandle。不用当前A12遗留undohandle做RPC补测。A13实际3242旧freeze继续原生GUI，不碰。

补充事实：计划/开发释放实际测试文件名为 `sidecar-minimize-retention.test.tsx`，不把原句中的 new 前缀解释为另建产品文件。本角色只持有本前缀，不持有产品、builder、GUI、服务、端口或凭据。

## 步骤与文件

| 步骤 | 自有文件/输入 | 验证与停止条件 |
| --- | --- | --- |
| 1. 只读认领 | `*-run.mjs`、`*-selftmp/rN/start.json`；原 r3、A12 manifest、开发 before/after、主树 | SHA256/mtime；旧冻结/旧原证不匹配则停止相关实验，不重新冻结洗掉失败 |
| 2. 旧版控制 | 同源 `old/frozen`，原专家测试副本 | 原 BASE exit0，A01/A02/A03 各 exit1；单 fork/no-cache，不执行 RPC |
| 3. 新版原例 | `new/frozen` 仅替换本批三文件，原测试副本 | 保留原 A03 失败；不为迎合测试修改产品 |
| 4. 设施适配 | 自有 `sampling-cases.test.tsx` 与 `sampling-only.patch` | 原时点复制 checkbox props；严格整文件一处替换，动作/期望不改；同一副本旧红与新绿 |
| 5. 独立补充/受影响回归 | `*-boundary-cases.test.tsx`；真实父子、panel/bridge/确认/capture | 关闭/ESC/切项目与旧版对照；隐藏结构/CSS及无自动写；真实 DOM 焦点/布局仍 GUI NOT_RUN |
| 6. 类型与保护 | 自有 `new` 与并发 `current` 分域；`tsc --noEmit --incremental false` | 不产出 lib；登记 src/原证/物理依赖/缓存/main+A11+A12+A13 lib 前后差异 |
| 7. 有限审签 | `*.md`、`*-selftmp/rN/summary.json`、每命令 argv/exits/logs | SOURCE/AUTO 按实际冻结范围判；GUI/真实 fresh handle 旅程 NOT_RUN，由 Main 新 builder/新 gateway 后续采证 |

## 当前状态

- 已完成：规则、合同、原 r3/开发测试、补丁和原 A03 失败审读。
- 已完成：独立冻结；原 r3/同源控制绿三红、新版原 A03 设施失败及单行采样适配旧红新绿。
- 已完成：独立边界 3 项旧版对照/6 项新版；18 文件188项受影响回归，两份 noEmit 均0；源/原证/依赖/lib保护。
- 已完成：完整命令索引40条、最终交付报告与末次只读保护exit0；自有测试进程已退出。A13并发原证13项+后续3项另列，不影响SM01冻结审签。
- 待 Main：新 builder/新实例/新 fresh gateway handle 的 GUI 采证，当前 GUI NOT_RUN。

所有运行输出、HOME/TMPDIR/cache/runtime/frozen 均限本前缀。保留原失败；未覆盖根不声明全机零污染；A13 并发原生 GUI 原证仅见证变化，不拿来签 SM01。
