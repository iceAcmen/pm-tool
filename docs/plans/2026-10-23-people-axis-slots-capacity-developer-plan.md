# 人员图轴文字槽与容量最小修复计划

2026-10-23，trae，唯一人员源继任开发。使用 brainstorming / writing-plans 整理已批合同；不重新问用户、不创建 worktree、不提交。

**目标：** 最小修复原 FD 人员外横滚、图卡窄列、姓名/数字叠压及最后点行容量，不改事实口径或原版式。

**架构：** 原下半区比例两列改为零最小值可收缩列，两卡与排期内槽约束宽度；排期保内部合理滚动。点仍取原坐标与 flip，仅姓名、数值独立 span，名称单行局部省略而数字不收缩；图高容纳原最后点行并留轴间距。

**技术：** 既有 React / CSS / Node v22.23.3；既有 Vitest 五例；冻结窄输入，依赖只读映射，自有 `/tmp` 输出。

## 授权与依据

父派单原句：
> 仅写packages/dsh-pm-tool/src/client/views/people.css与people.tsx，及自有docs/plans/2026-10-23-people-axis-slots-capacity-developer-{plan,handoff}.md和/tmp自有输出。
> 不触livingdocs/testing/git/fetch/pull/install/fullbuild/lib/browser/desktop/进程/正式上游。
> Main唯一整build/GUI，自己无PASS。
> 最小修原FD外横滚/图窄列/点文数叠压：.pp-lower可收缩比例列、两卡及排期槽约束，完整name可访问、独立点姓名/数值span槽保数字不省略，现点容器高度适配最后行(保14+i15及原xPct/flip/点序/公式/MAX/core/events/schema)。
> 一次最小实现后封两源before/after/差异/plan/handoff/测试oracle与输出、seal真实子readback0才STOPreleased。

完整父派单只约束本修复到源码释放，不将父 ordinary commit 授权变成本角色 Git 权限。依据：[Main 修复单](2026-10-23-people-axis-overflow-repair.md)、[前继任 plan](2026-10-23-people-axis-overflow-developer-plan.md) / [handoff](2026-10-23-people-axis-overflow-developer-handoff.md)、[独立合同 §5](../testing/people-fd-axis-gui-timed-20261023-r1-minimal-repair-contract.md)、[长姓名 handoff](2026-10-23-people-long-name-developer-handoff.md)。

两前任 readback 已实读实际子退出0，state=STOP / released，不复活或改其封件。原两源已于 `2026-10-23T03:06:01.262Z → 03:06:01.316Z` 实核冻结：
- CSS `8665e0874b0995a77bcd119fbcd892eaeb853593ce4014bce33100d270a995f4`，14066字节，原 `.pp-name` 修复保持。
- TSX `e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6`，26112字节。

## 方案选择与窄文件计划

1. 已比较仅宽度补丁、整点省略/换行、宽度+独立姓名数字槽+容量三条路径。前两条不能保证末数字可见/最后行容量，选择已批第三条；不写 CSS 镜像测试，不扩大新产品行为。
2. `people.css`：仅 `.pp-lower`、其两卡与卡头、排期 body/who/name/plot、分布 body/点文字槽。保7:5与原1100单列断点；不新增断点、不改字体大小、不裁切整页或新设图卡横滚。
3. `people.tsx`：原排期姓名增 span/title；原 dots 容器 height=`Math.max(124, lastTop + 24)`；原点 style 保 left/top，追加 maxWidth=`flip ? xPct : 100-xPct` 百分比。该百分比以原图宽为参照，不在姓名子槽直接套百分比；原 flip 保整块右缘坐标。点里一组 label 内含姓名/数字独立 span，防 row-reverse 反转可见姓名/数值顺序。
4. 名称字符串原样入 DOM；仅姓名槽 CSS ellipsis，title 提供完整悬停文本，不新增重复 aria-label/隐藏读屏副本。完整可访问语义为静态人工审阅，非已跑可访问树。
5. 既有 `people-load.test.ts` 一例与 `people-scale.test.ts` 四例在冻结有限输入中一次运行；TSX/CSS 简单语法和窄 type 在自有输出检查。冻结依赖闭包由精确 import 解析，仅跟随所需文件，不全树 copy/scan、不写 `lib`。
6. 源差异及规范/合同两轴人工自查 → 两源 after 冻结 → handoff → seal → 实际独立子 readback0 → STOP / released。Main 独立源审后唯一合建、全回归与原 F1/FL/FD GUI；本人不签 PASS。

## 状态

- 已完成：合同/前封件只读、原两源核验冻结、vendor verifier 实际0（注册13+23）。
- 已完成：计划先落后一次最小源实现；原五例全绿、窄type0诊断、CSS解析；两源after/原差异、规范/合同人工自查和专属handoff。
- 进行中：封存两源before/after及测试oracle/全部输出；执行真实子readback，不预填成功。
- 释放条件：实际readback child0且receiptReread=true后STOP / released；具体真起止/全部子耗时/实际结果由自有readback.json与timing-summary.json封收。GUI与独立PASS仍待Main/专家。

本批路由：已批无实质歧义，不重新 grill-me；呈现修复不造 tdd 镜像；交付边界校验完整性后只读 code-review，按项目规范/合同两轴自查，跳过 setup/Git/子代理等越界步骤。试点记录并入本计划/handoff；根因呈现实际结果仍须 Main GUI，不将源码几何定位冒充独立红证。
