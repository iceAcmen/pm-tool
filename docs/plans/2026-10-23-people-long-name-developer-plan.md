# 人员长姓名最小修复实施计划

日期：2026-10-23；平台：trae；角色：唯一人员开发。使用 brainstorming / writing-plans 收敛已批准合同；不另开审批，不创建 worktree、不提交。

**目标：** 只阻止负载明细姓名越槽横穿负载条、OPEN、日期、状态，保留完整姓名与原操作。

**架构：** 复用 `.pp-who > .pp-who-txt > .pp-name`，仅给姓名槽收缩与单行省略。保留既有网格、头像、事实列、390 响应式 flex。技术为既有 React/TypeScript/CSS，不新增依赖。

## 1. 派单与依据

父派单原句（本角色边界）：
> 唯一写people.css，只有姓名没有可约束独立container才people.tsx最小容器/语义；自有docs/plans/2026-10-23-people-long-name-developer-{plan,handoff}.md。
> 仅name槽收缩/内部换行或省略，完整存储和accessible name不丢，其他事实列/行expand/任务入口不变；不整row裁切，不MAX/阈值/core/schema/fixtures/事件/其他卡/新浮层。
> 不整build/GUI/service/主lib/正式/git。

依据：[Main 计划](2026-10-23-people-long-name-repair.md)、[独立先行合同](../testing/people-f1-fl-gui-timed-20261023-r1-minimal-repair-contract.md)、[原报告](../testing/people-f1-fl-gui-timed-20261023-r1-report.md)、[原实际 status0 回读](../testing/people-f1-fl-gui-timed-20261023-r1-readback.json)。

后继补充原句：
> 实际390 FD姓名也横跨open/日期（与FL姓名槽相同机制）；请最小CSS规则考虑现有responsive name槽/既有minwidth，勿为此另加新设计或事件。

补充事实由 Main 提供，本开发不冒充目视旧 FD。原四 viewport 的受影响复验由 Main/专家负责，不改变最小源码边界。

## 2. 选择与认领

1. 采用：`.pp-name` 增 `min-width: 0; overflow: hidden; text-overflow: ellipsis`，保留现有 `white-space: nowrap`。只裁姓名文字，不裁行、文字父槽、头像或事实列。DOM `{row.display}` 原文仍参与原按钮可访问名称。
2. 不采用槽内换行：虽获合同允许，但会改变原行高；本轮无需。
3. 不采用整行 overflow、新断点或浮层：越过合同或会隐藏事实/入口。

当前实核 02:48:26.034Z → 02:48:26.042Z（UTC），不是抄旧：

| 文件 | 字节 | 修改前 SHA-256 |
| --- | ---: | --- |
| `packages/dsh-pm-tool/src/client/views/people.css` | 14009 | `60925a4083ce8740b610c7949038bafda823fe48b483a55d3e3f16d1163514ba` |
| `packages/dsh-pm-tool/src/client/views/people.tsx` | 26112 | `e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6` |

TSX 已有独立姓名 span，不满足条件性写授权，本轮不写。`.pp-who`、`.pp-who-txt` 已有 `min-width: 0`；≤560 的 `.pp-who { flex: 1 1 55% }` 沿用，仅内层姓名约束。

Main 首读声明为源126/输入527；旧 CombinedF02RepairR2 报告为124/525。两者仅引用，不当本角色实核全树；本角色仅认领上述2文件及新增自有2文档。task 后继新增 test 不属于本 delta，不抢 Main 总分母、冻结或合建声明。

## 3. 步骤

1. 已完成：读合同/报告/回读；现状定位；vendor 只读静态校验 status0。
2. 已完成：只改 `people.css` 的 `.pp-name` 一处，02:49:51.515Z 开始检查点至 02:50:16.695Z 修改后认领，净增57字节；TSX字节不变。
3. 已完成：隔离运行已有 `src/core/people-load.test.ts`、`src/client/views/people-scale.test.ts`，2文件5用例、status0，02:51:28.428Z → 02:51:30.045Z。依赖只读；配置/缓存/TMPDIR/HOME 自有，未 coverage/整 build。
4. 已完成源自查：02:51:29.275Z → 02:51:29.385Z，status0；准确 diff 一处、原 diff1表示有差异。最小 handoff 已交；seal/check/readback实际收据指向交接，收据实际0且回读后才 STOP / released，不事先签结果。

## 4. 方法与门

trivial 最小 CSS 修复：无实质歧义、已证根因；不路由 grill-me/tdd/diagnosing-bugs，不伪造红绿 CSS 测试。vendorIntegrityVerified=true；02:48:26.022Z → 02:48:26.142Z，静态校验 status0，mattpocock13/oil-oil23文件全部 hash/bytes一致。交付按 code-review 两轴自查；其 git/setup/派子代理步骤与本单冲突，跳过并保留边界，不充当独立审源。

完整命令及真 start/end/status/stdout/stderr 保存到自有 runner 收据。前期读档工具只提供耗时、不提供绝对时间，不补造。已发生设施失败：`rg` 不存在（127），改用 find/grep；指定记忆入口不存在（ls1），仓库优先；PeopleView 测试搜索 grep1 代表未找到而非产品失败。初次 living docs head 输出过宽，不扩读树。

CSS-only，TSX/type接口未变，不作整包或窄 type 自证。已有测试不覆盖布局、可访问树或 GUI；GUI NOT_RUN（本角色未执行），独立结论待专家。Main 汇合 task/人员独立审源后唯一合 build、全部回归，F1/FL 原 dark1440×900 CSS100及真实图轴补缺、原 FD 四 viewport 受影响复验；开发不签 PASS、不提交/push/release/正式切。

Main 最后补充 FDaxis595件及 dist x1581宽149、外壳client1155/scroll3637、前向排期撑宽，仅作 nonowned 观察，不冒充独立确证。本轮先封释放姓名槽；未加载尚在审的追加合同，不改 gantt/dist，不并入本候选修复结论。若专家后给有效追加合同，由 Main 顺序重新认领同文件，不继续占写。
