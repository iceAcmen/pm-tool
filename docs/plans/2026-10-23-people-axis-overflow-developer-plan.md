# 人员图轴最小续修开发计划

2026-10-23，trae，人员 CSS 唯一顺序继任。使用 brainstorming / writing-plans 整理已批准范围，不重新询问既定方案，不创建 worktree、不运行 Git。

**目标：** 修复已独立确证的 FD 窄图轴、文字叠压及人员外滚，不隐藏数值、完整名称或入口。

**架构：** 优先在既有下半区两列、排期与图卡内部收敛宽度；不更换布局或数据模型。技术为现有 CSS / React；本轮源码写入已因下述越范围定位暂停。

## 授权与前序

父派单关键原句：
> 仅people.css人员局部现wrapper/排期卡/图卡收缩宽度分配与文字槽，当前源码自己精确定位，不把独立合同minwidth猜当根因；保原name修、完整accessible原text/事件/列/数据/MAX8。
> 若确需不同源文件先报Main精确定位/理由暂停相关源写，继续可做审阅。
> 只自有docs/plans/2026-10-23-people-axis-overflow-developer-{plan,handoff}.md与tmp隔离命令输出。
> 不整build/lib/service/browser/git/formal/runtime。

依据：[Main 计划](2026-10-23-people-axis-overflow-repair.md)、[已实际先行生效的独立合同](../testing/people-fd-axis-gui-timed-20261023-r1-minimal-repair-contract.md)。合同最终封件另审，不以旧姓名合同扩大本轮权限。

已读前序姓名 handoff 及 `/tmp/people-long-name-developer-20261023/readback.json`：实际 status0，02:54:10.472Z 至 02:54:10.549Z，STOP / released；不重启旧 finished 角色、不改原件。

## 精确定位与最小选择

1. CSS:109 的 `.pp-lower` 为 `7fr 5fr`；113–116 的排期 body/who/name 无额外收缩约束，姓名为 nowrap；TSX:407–410 在 `.pp-g-name` 中直接放完整姓名。可选最小宽度补丁是零最小值比例列、两卡/排期子槽 `min-width: 0`、排期内滚及局部标题换行。**这是源码支持的待验证路径，未跑 GUI，不称已确证根因或已修复。**
2. TSX:464–468 的点图 `{v.name} {v.value}` 是同一直接文本槽，伪元素是圆点，没有独立数值槽。整体单行省略会使末尾数值不保证可见，普通换行会侵入既有15px行距。不采用隐藏数值、缩小字体、整卡/整页裁切或额外图卡内滚来掩盖。
3. CSS:147 的图容器固定124px；TSX:199–200 的点位为 `14 + i * 15`。原 FD 14 人加未分配共15行，末点中心224px，超过该容器；这是源码几何事实，不是本角色 GUI 目视结论。仅改宽度不能解决这一纵向容量问题。

**交 Main 的最小必要补充定位：** `people.tsx:464–468` 的姓名/数值独立文字槽，以及 `199–200、448` 与 `people.css:147` 的容器容量。如需落地该路径，应由 Main 精确另授权最小呈现容器；保留文本顺序与完整可访问名称、原x/y口径、事件、列、MAX和任务事实。不宣称所有 CSS 解法均不可能，不擅自引入数据驱动高度或改变点图排布。

当前选择是**暂停相关源码写入、封回定位**，不先投一个只修宽度而可能遮住数值/留下叠压的半成品补丁。已向 Main 回报；不把补充授权问题再次抛给所有者。

## 执行状态

- 已读：指定计划/合同/姓名原交接和实际回读；仅认领 CSS 与只读 TSX 两源，不核或背书全树128源。
- 已完成只读定位和 vendor 静态校验，实际命令收据见 handoff。
- 已暂停：产品 CSS/TSX 均零改动，原姓名修复保持。
- 封件步骤：两源前后实核 → 自有文档封存 → 子进程实际 check/readback0 → 释放写权 STOP。封件不是独立 PASS。

brainstorming 已比较局部宽度修复、直接文字省略/换行、最小独立文字槽三条路径；按父停止条件选择回 Main 定位，不套新设计。vendorIntegrityVerified=true，仅注册13+23文件已核；rootCause 参考 diagnosing-bugs，但真实反馈循环属 Main GUI，故停止其需运行循环的步骤，不声称完成该 skill。交付只用 code-review 的规范/合同两轴自查，不叠根因执行，不跑 setup/Git/子代理。无本轮可独立测的 CSS 接口，不路由 tdd/grill-me，不写镜像测试。
