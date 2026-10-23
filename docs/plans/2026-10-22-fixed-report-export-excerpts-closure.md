# 固定汇报摘录导出缺陷修复计划

> 给独立开发与另一复验角色逐步执行。父负责人持续授权确证修复；普通 commit 须全部验完，不 push/tag/发布/切正式。项目 SOP 和 ADL-045 优先于外部工作流的中途提交/再询问步骤。

**目标：** 固定汇报 Markdown 导出保留已保存的冻结摘录正文与 task/entry/revision、作者、日期来源。

**架构：** 仅在现有 `renderProgressReportMarkdown` 消费 `report.excerpts`；不查询当前任务，不过滤后来软删的源。缺键/空数组沿用原无摘录输出；现有安全 Markdown 路径仍负责安全呈现。

**技术：** TypeScript、现有 renderer/export command、Vitest 2.1.9；macOS + nvm Node22.23.3 + pnpm11.28.5。

## 已确认依据与选择

- [有限 GUI FAIL](../testing/material-meeting-report-gui-review-20261022-r1.md)实际1415byte导出缺两摘录。
- [独立 RED](../testing/fixed-report-export-excerpt-red-20261022-r1-report.md)：13项实际7控制通过/6必要红，真实生产函数和命令都未带摘录；生成/冻结链正常。
- 唯一必要业务修改：`packages/dsh-pm-tool/src/core/progress-report-markdown.ts`；既定测试 `src/core/report-export-excerpts.test.ts`归独立专家，不由开发改。
- 导出时重读当前源会破坏冻结语义；修改schema/新出口没有必要。选择现有renderer读取已存摘录。

## 执行

1. 开发只读当前源与独立13项，认领107父候选加独立test，准备自有tmp/cache/result，不build共享lib。
2. 仅修改上述renderer，以清晰小节带每条冻结来源/正文；延续转义纪律，复杂正文不得整体丢弃，不要求新的格式或UI。
3. 自有隔离执行原13项及受影响原Markdown/report/export专项，记录命令、exit、源和产物指纹；原6红不得覆盖。
4. 开发释放后由**另一独立专家**复验SOURCE/AUTO；不以开发绿自判验收。Main唯一后继build并新GUI导出回读，旧107实例不冒新renderer。
5. Main同步livingdocs/变更/已确认根因与后继身份；全部逐域总出口齐再普通commit，不提前stage。

## 影响与边界

仅固定报告MD内容补全；无摘录旧报告/来源字段/冻结JSON/覆盖路径/文件权限维持现有合同。不新增报告格式、不改资料/会议/存储/上游、不删除原失败证据。当前3260的J03/O3/ATF采证继续，开发不启停服务或覆盖封存产物。

## R2 确证边界修复

[不同独立R1复验](../testing/fixed-report-export-excerpts-independent-retest-20261022-r1-report.md)原13/54与补充6项通过、noEmit0，但合法300024字符作者使新renderer85行把150000匹配段spread给Math.max，抛RangeError，有限FAIL。后继应为原107+新test+首次新增认领renderer共109声明，不用先前108继承子集冒完整后继；其他并行tests另认领。

R2仍仅改renderer：迭代所有反引号匹配求最长段，不展开可变长参数，不截断合法作者/正文，不新加schema上限。原stress、补充6项和原13及必要旧54需开发自测与另一专家复验；原红/初设施失败不覆盖。新构建须等待此门通过。
