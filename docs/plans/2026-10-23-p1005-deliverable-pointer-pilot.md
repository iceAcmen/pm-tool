# P1L2-F02 vendor 试点记录

> 记录本子单的自动路由、方法增量、越权检查与未签独立门，供 Main/专家复核；只写本授权前缀，不改共享试点/testing目录。平台 trae，2026-10-23。

## 0. 基本信息

- vendor：mattpocock；manifest `vendor/agent-skills/mattpocock/manifest.json`。
- 来源commit：`49dd158d1076134a641b33efb035946536778336`；未联网升级、未复制或修改vendor正文。
- 本批任务：P1L2-F02交付物指针选择/主save；原候选基线引用专家 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，本开发delta另绑定源码/新test SHA，未执行Git，不冒HEAD/运行实例。
- `vendorIntegrityVerified=true`：使用前真实静态门退出0，manifest全部13文件hash/bytes相符；目标skill逐次shasum相符；末次 [receipt](2026-10-23-p1005-deliverable-pointer-vendor-final-receipt.json) 附13文件实SHA及完整命令。完整运行结果在 [report](2026-10-23-p1005-deliverable-pointer-report.md)。

## 1. 路由与实际决定

| 时段/taskKind | skill / 校验 | 方法增量及边界 |
| --- | --- | --- |
| rootCause | 仅 diagnosing-bugs；正文SHA `849198df88cdb65fd0d97236604c1fca7ff2f22d2f705f9724a800d0266b118d`，yaml也相符 | 建立真实生产React DOM反馈环，先留D04红，再最小label/div控制；原option指针链DOM正确不盲改，不因原ASSERT/截图判因果；未叠review/grill/tdd |
| feature（可测缺陷修复） | tdd；正文SHA `5505d25bbaa8fc14a79e4d20163936958992a2995b7f1dd1d6197edc9ed722e0`；tests.md/mocking.md/yaml全相符 | 根因最小化后，保留真实生产listbox红，只取消backdrop click默认动作，原测试字节两轮绿；收尾补两个fixture显式null后用最终test再跑冻结旧源码红及候选两轮绿 |
| delivery | code-review；正文SHA `09eb147f793e4647949edd32dbad278f0554dfb56e0d46b699cd4c2c55bf0357`，yaml相符 | Standards/Spec分开自查；点出原GUI指针完整链仍缺证，不把开发绿冒F02完成；发现样本缺dueDate/achievedDate，补测试显式null，未改业务或源码 |

未加载grill-me/grilling：授权、范围、真实DOM目标已明确，不再常规询问。公开入口与声明依赖纪律保持。GLOSSARY/CODING_STANDARDS/CONTRIBUTING不存在，按可选跳过。

## 2. 冲突/偏差处理

- 项目规则与本子单优先：不执行skill的Git/build、setup/installer、全局/home写入、原GUI脚本、private导入和HITL脚本；不补写未vendor的HITL或codebase-design。
- diagnosing-bugs的源码探索严格服从用户先读真实组件要求；方法上未在反馈环建立前宣布根因。确证的只是backdrop默认激活，原选项GUI根因仍未知，不继续猜测改代码。
- tdd要求确认测试边界：采用用户已明确授权的真实React DOM form/listbox边界，不再重复问；callback边界是生产公开契约，不是mock内部helper或独立业务写库。
- code-review的Git三点diff/commit-list不执行，以dom-r2冻结源SHA、当前源码unified diff和新test全文件替代，不冒提交列表。本轮未启动两个review子代理，采用本开发顺序双轴自查，**不声称完成上游双独立review流程**；此降级不能替代项目独立测试。
- vendor试点目录按本子单特定写面改在本前缀留痕；不改testing/verification/livingdocs。专家结论仅引用原F02有限GUI FAIL，待专家对新候选审证，不替其填签字。

## 3. 越权检查

| 检查项 | 结果/证据 |
| --- | --- |
| 自动setup/installer/init | 否；只读vendor、无安装命令 |
| home/全局配置写 | 否；独立配置/缓存/输入输出仅本tmp，已有依赖只读链接 |
| data/业务数据修改 | 否；表单回调只收集参数，不发RPC/写库 |
| 修改上游 | 否；未访问上游文件 |
| 替代独立门或自签GUI/PASS | 否；原GUI红与DOM绿分开，专家签字未填 |
| 未报备删除/覆盖/推送 | 否；本轮新增wx输出，只修改授权listbox/新test及自有脚本/文档，不删除他人成果/不Git |
| 联网抓vendor新内容 | 否；锁定commit不变 |
| 复制/改vendor正文 | 否；只读原件 |
| 将exposed:false依赖当入口 | 否；未加载grilling |
| 调未vendor skill/因缺失而停红绿 | 否；未调codebase-design，直接按本合同实现 |
| 重建/执行HITL与setup脚本 | 否；走自有DOM与Main最小诊断步骤 |

## 4. 验证与专家边界

全部命令/exit/原输入输出SHA见report及同前缀receipt。静态门0、dom-r1与dom-r2各1、green-r1/r2各0；最终样本补齐后red-final1（冻结原始生产源码）、green-final-r1/r2各0；4旧专项28例0。old与candidate均真实DOM，不mutation造红、不helpermirror；Main专属GUI/build/原B8本轮NOT_RUN。

封存首轮输入保护0；首版文档check1来自本输出尚未写出的自引用链接，失败原件保留。只修自有检查器延后本轮自引用，另生成seal-r2/final-check-r2，其他链接/字节仍照常核；生产源码/test没有再改。

**测试专家结论：本开发不填写。** 原专家F02有限GUI FAIL保留；新候选尚未独立审签，无本批PASS、MANUAL_PENDING、毕业或ordinary commit结论。原反思事件/键盘成功不由本试点重签。

## 5. 后续与停止

- 来源无升级/回滚；无需修改manifest/ADL。
- 保留试点方法与原红收据，下一步仅Main候选认领、真实pointer/bbox/事件链采证及专家复验，不开始新功能。
- 本子单交付后释放写面，STOP；无builder/服务/端口/profile/业务锁，无长运行子进程。
