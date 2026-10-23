# A14 SM01 clean/mixed 有限 GUI 审证计划

> 2026-10-22，平台 trae，独立测试专家。只读审查 Main 已采原证，供 Main 接续；不是整 RA-AI04 或发布审签。采用 writing-plans 的分步方法，用户限定写域优先于其通用实施/提交模板。

## 1. 派单与边界

本轮负责人原句：

> 独立SM01有限GUI审证（非整RA-AI04）：用户已持续授权全部未验/修复/独立分离/提交，无push。先AGENTS/collab、a14-sidecar-minimize-contract及independent-retest、remaining-governance AI04。只写docs/testing/a14-sm01-clean-mixed-gui-review-20261022*，不product/其他testing/livingdocs/build/install/GUI/services/credentials/commit。Main新/private/tmp/pmtool-a14-closure-20261022，A14/candidate.json与product-tracked.patch、build+full-verify原证；实际newruntime/private/tmp/pmtool-a14-governance-runtime-20261022，gateway3244（ready自有pid）、host3245/PID25245，prodE2E0。原A14/final/{environment,host-start-r2,loaded,result,seed,mixed,mixed-r2,clean}：loaded完整uncachedcombo唯一client片段，先于ask。UI真F6标准backup恢复成功，seed首mouseleave菜单设施失败保，无fakeledger。mixed首真实ask3step成功后在draftmode误找diagnosisinput exit1；mixed-r2从同一未确认plan继续→diagnosis填未发送文本→draft→min/expand→文本仍在→batchapply newhandle→min→normalTaskFormt1assignee 外部人工改派保留 主保存→expand原undo/input仍在→freshmixedundo，原件exit0。t1两步因外改保留、t2恢复35，command34实际success中文。clean第二新prodask/newhandle→apply→min/expand→freshcleanundo后真实command done success已撤销3项；runner仍draftmode等隐藏diagnosis文案timeout exit1保，clean/supplement真实点击只读诊断后原undo消息显现/raw/roots result0，没有reundo/reapply。clean初态已含前一mixed人工改派，clean后应保该初态。不要把设施失败当产品失败，不造原exit0；GUI连续frames/actions/console（mixed两轮）、rawtasks/ledger全保，请独立目视/scopes/hash/commandstep/TTLused/state与payload对证。本轮不签stepwise/conflict/allentity/fault/voiceover/final发布；未跑GUI keyboard全面。开发修后三源SHA参independent报告。审有限SM-G01/02、AI04clean/mixed子项及min/input/draft/mainsave可达，给PASS/FAIL/BLOCKED精确缺证，保全部历史。不捞A12旧handle、不RPC任何runtime。Main继续其他剩余，释放后通知。

补充事实与解释：A14 原证在 `reports/all-pending-evidence-20261021/A14/`，冻结产品树在上述 `/private/tmp/`，不是该树下存在 `A14/`。只关联归档实例，不探活、不读配置/认证内容、不执行任何原 GUI 脚本。dirty 并发成果原样保留；本轮不 fetch/pull、不 install/build/verify，不改 livingdocs、不 commit/push。

## 2. 对象与先行合同

- [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)：开发采证与专家判断分离，候选/运行/子项范围分别绑定。
- [SM01 原合同](a14-sidecar-minimize-contract-20261022-plan.md)、[缺陷与修复合同](a14-sidecar-minimize-contract-20261022.md)、[独立 SOURCE/AUTO 复验](a14-sidecar-minimize-independent-retest-20261022.md)。
- [RA-AI04](remaining-governance-cases-20261021.md)：有限审 clean 与 mixed 实际已采分支；不签整项。

## 3. 审证步骤与停止条件

| 步骤 | 输入/本前缀产物 | 判断与停止条件 |
| --- | --- | --- |
| 1. 认领 | candidate/patch、build/full-verify、独立 new 源清单；`*-audit.mjs`、`*-audit-r1.json` | 全源/产物指纹；三修复文件与独立 new 对齐；差异单列，不用 HEAD 代表 dirty 候选 |
| 2. 装载与 fixture | environment/host-start-r2/gateway ready、loaded 原 combo、seed 标准恢复原件 | 完整唯一 uncached client 段先于 ask；实际 runtime/端口/PID/开关绑定；不把旧账本恢复当 fresh handle |
| 3. 原命令与状态 | mixed、mixed-r2、clean/supplement：events/actions/raw tasks/ledger/roots | commandId 配对、明确 apply/undo、正确基线、任务全对象/历史、refs/postimages/audit、TTL/used 与实际命令结果一致 |
| 4. 独立目视 | 原 PNG、连续 compositor 帧；本前缀联系图与目视清单 | 原件 hash 全核，实际目视范围逐项记录；图/状态/动作相互对应；缺可见状态只签有证子项 |
| 5. 对抗检查 | 原失败、console、模式、时间线、写根变化 | 保 exit1，区分设施失败/产品 FAIL/缺证 BLOCKED；补件不得掩盖原失败或再调用旧 handle |
| 6. 有限报告与释放 | `*.md` 与最终只读复核 | 仅 SM-G01/02 已采子项、min/input/draft/main save；其他分支 NOT_RUN/整体 BLOCKED，告知 Main 接续 |

## 4. 写域与方法

仅创建 `docs/testing/a14-sm01-clean-mixed-gui-review-20261022*`。读文件、结构化 JSON、SHA256/mtime、生成已有图片的联系图；不访问网络、GUI、RPC、runtime 数据根或凭据。既有原证只读，禁止删改；Main 在途新增原证与本次固定输入分开记录。报告必须列原命令 argv/退出码、核验命令、候选身份、证据路径和未覆盖边界。

## 5. 状态

- 已完成：规则、原合同、独立复验与 RA-AI04 范围核对。
- 已完成：候选/完整下发/fixture/命令/落盘/118帧指纹核验，13张PNG与7张原帧目视。
- 已完成：有限审签、末次保护复核exit0；原件零漂移、链接和语法检查无错误。无GUI/builder/服务资源占用，释放供Main接续。
- 保留缺证：clean成功句实际视口可见BLOCKED；其他未跑分支NOT_RUN，不签整RA-AI04或发布。
