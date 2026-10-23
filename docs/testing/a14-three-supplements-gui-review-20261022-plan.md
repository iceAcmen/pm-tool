# A14 三组最小补证有限独立审证计划

> 2026-10-22，平台 trae，独立测试专家；给 Main 和接续专家按原合同核补证使用。只审原件，不执行 GUI，不是整功能或发布计划。

## 1. 父派单与范围

负责人本轮原句：

> 独立三组最小补证审证，既有持续授权/GUI与判定分离。先AGENTS/collab、a14-fresh-file-gui-review、a13-native-import-gui-review、a14-sm01-clean-mixed-gui-review原报告合同，只写docs/testing/a14-three-supplements-gui-review-20261022*；不product/其他testing/livingdocs/build/GUI/services/credentials/commit。
>
> Main新增A14/fresh-file-supplement/{loaded,download,headers}:实际A13产品3243/PID8391，new uncached完整client sourceSHA7f037f... unique段/timeOrigin target6D041...，保新reload不倒造旧load；download0刷新→重开新fa1→actualdownload22SHA87ef...→cancel卸载→重开finalasset仍在，before/after根，只session可能变；anonymous-body.txt实际401/73字节完整JSON；headers0用CDP Fetch.responseStage原响应暂停立即continueRequest不replace，没有保存鉴权headers，actualGET200 contenttypeMarkdown length22 no-store nosniff dispositionUTF8正确+下载源hash。一开始NetworkExtra两轮没收到事件，result空数组仍保，不造原件。补RA-F01/F04精确缺口。
>
> 第二组A14/import-supplement/observer ready28155 time22:32Z,target2ED...实际A13materials3242/source原A13lib未变；csv-trace/xlsx-trace/两invalid-trace/csv-header/xlsx-header原nativechooser AXpath图/Main看图Open→current观测+before/after roots；observer真实commands seq41..52/console/frames，六路径预览/拒绝，未confirm，不替先前confirmtrace。缺标题列fixture只在/tmp/pmtool-a14-native-import改原两行标题表头未知字，header-fixture完整byteshash，不要求未知额外列拒绝。原require读xlsx现依赖，没改product；observer28155核argv/cwd→TERM/end正在收尾。补trace/非法列子项，不签busy失败重试。
>
> 第三组A14/final/clean/visible-supplement，实际A14product3245/timeOriginF3D7...，只读滚动同原clean“已撤销3项”消息bbox y400.7 h19.9、真正原PNG/frames/resultbeforeafter根零变；随后stepwise/conflict已经改变业务，补图不冒充clean结束raw，仅消息真实可见，不能再undo/reapply。PC01/02已独立FAIL在dev，不签RA-AI04all/发布。请有限逐缺口PASS/FAIL/BLOCKED+sourceartifact实核、原exit/frame目视量/hash/保护，原BLOCKED/失败留不改其他专家原件。只读各tmp执行scripts可用，Main继续现有任务。

本批目标：补签原报告的精确缺证切片；新观测与历史缺失事件分开。非目标：重跑产品、改旧专家结论、整门 PASS、再 undo/reapply、停服务或替 Main 最终提交。具体授权优先于通用开工构建、拉取、livingdocs 与提交步骤，本轮不执行这些动作。

## 2. 合同与输入

- [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)：采证与判断分离，dirty 候选、运行实例、子项结论分别认领。
- [fresh 原报告](a14-fresh-file-gui-review-20261022.md)、[import 原报告](a13-native-import-gui-review-20261022.md)、[SM01 原报告](a14-sm01-clean-mixed-gui-review-20261022.md)及其引用合同。
- [RA-F01/F04/IM01](remaining-journey-cases-20261021.md)、[RA-AI04](remaining-governance-cases-20261021.md)：不新增未知额外列严格拒绝或新设计矩阵。
- 原证在 `reports/all-pending-evidence-20261021/A14/{fresh-file-supplement,import-supplement,final/clean/visible-supplement}`。第一、二组产品仍 A13，第三组才是 A14；目录标签不是产品身份。

## 3. 分步核验

| 步骤 | 本前缀产物 / 方法 | 完成条件 |
| --- | --- | --- |
| 1. 边界与合同 | 本计划 | 原合同、写域、历史阻塞和父任务对齐 |
| 2. 身份及保护 | `*-audit.mjs`、`*-audit-r1.json` | A13/A14 全源、全产物、patch/hash 逐项核验，固定原证及原专家文件前后指纹 |
| 3. fresh 补证 | 新 loaded 唯一完整段、原下载/匿名 body、响应头、根差异 | 不倒推旧 load；只签本次刷新/重开/下载/卸载保留与同资源拒绝 |
| 4. import 补证 | 六对 run/done、原名/字节、AX/图、roots、fixture 表头/全行 | 新 preview 不冒充旧 confirm 相邻 trace；非法标题列按既有合同判；无 busy/重试放行 |
| 5. clean 补证 | 原 PNG/帧、bbox/state、原 command48、前后根 | 同原成功句真正可见；后续业务不冒充 clean 原末态，不再执行业务操作 |
| 6. 有限结论与封存 | `*.md`、`*-seal-r1.json` | 明列 PASS/FAIL/BLOCKED、原退出码、机器帧数与实际目视量；原件/源码/产物无新增写；释放给 Main |

## 4. 状态

- 已完成：规则、三份原报告及关键合同读取，三组原证定位，执行脚本只读检查。
- 已完成：逐文件指纹、根差异、六对命令载荷与50帧hash核验；A13的514源/453产物、A14的515源/453产物一致。首轮审计CSV编码设施exit1保留，第二轮16项断言全成立exit0。
- 已完成：15个PNG路径（13种内容hash）、8个帧路径（6种内容hash）目视，有限报告已写；不签历史trace、busy/失败重试或整门。
- 已完成：首轮终核exit0，918输入及两个候选源/产物/mtime零漂移；本报告链接与自有脚本语法已查。仅自有文档收尾补记后另存最终seal-r2，不覆盖seal-r1；有限审证完成并释放，无GUI/builder/服务资源占用。

遇到原件缺失/漂移时不重采或重构原件，精确标 BLOCKED 并继续不受影响切片。Main 保留 GUI/builder/服务资源，本角色无共享资源写权。
