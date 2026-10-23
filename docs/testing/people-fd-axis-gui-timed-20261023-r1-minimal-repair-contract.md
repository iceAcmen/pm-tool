# 人员 FD 图轴与外壳最小追加修复合同

日期：2026-10-23；独立 GUI 原证审证：trae。本单依负责人明确追加授权生效，仅交 Main 合入当前未封人员 CSS 批次，不授本角色产品读写、GUI、build 或提交权限。

## 1. 已独立确证的红项

原 `RA-V-people-1440-dark-100-dense` 的图轴文案不重叠与外壳无二维横滚子断言：**FAIL**，非整格执行完成。

原件 `TimedPeopleFDAxisR1/index-r1.json`，595/595 件实际大小/SHA 核对一致，索引 SHA `c2c3f6c4d0115967a85d76510006901f1e43ad85dd7021442d639758a79f9309`。独立目视 `fd-axis-final-visible-r2.png`，页面态时间 `2026-10-23T02:49:45.835Z`：真实横滚后团队分布图所在卡仍是极窄列，标题逐字纵排；负责人长姓名及其数值越出图卡，刻度与文字相叠，窗口底部可见外层横向滚条。这不是合理时间轴内滚的单独现象，也不是只据 Main 的 bbox/scrollWidth 作判。

原旅程单 `remaining-journey-cases-20261021.md` §6.1 people 及共同预期已有此要求，无新矩阵。这里只证明 FD 实际 MAX8 样本的呈现失败，**不补签 F1/FL MAX10、RA-P1006 整体、AUTO、浅色或原生200%**。

## 2. 可合入的最小文件范围

唯一人员开发 `arun_6adaca7b7cfef4f845ad73b7` 经 Main 转交后，仅可追加：

- `packages/dsh-pm-tool/src/client/views/people.css`：现有人员图轴卡、相邻排期容器、包住二者的人员局部布局 wrapper，以及该图轴中既有标题/姓名/数值文字槽。按当前真实源码定位可收缩、宽度分配与文字约束，阻止长内容撑出人员外壳，保证图轴不被挤成无法读数的列。保留原列与内容；排期轴需要的内滚仍限其内部，不能用整页裁切掩盖溢出。

这是一份**独立于旧 `.pp-name` 行姓名槽合同的追加呈现合同**；不宣称旧合同当然包含图轴 wrapper。封存 CSS 输入 SHA `60925a4083ce8740b610c7949038bafda823fe48b483a55d3e3f16d1163514ba` 来自旧候选登记，仅作原对象锚，不代表当前在途 CSS。本角色没有读取当前产品源码，**尚未确证具体 CSS 根因或选择器**，不得把“min-width/flex”等猜测写成已定位根因。

不授权修改 `people.tsx`、gantt/dist 事件或逻辑、`people-scale.ts`、core、schema、MAX/阈值、任务事实或 fixture；不删列/删姓名，不缩短存储值或完整 accessible 名，不改任务打开/返回事件，不新增浮层、卡片或断点设计，不改宿主/全局 CSS。若开发定位发现 CSS 局部范围无法修复、需要不同文件/逻辑或不同根因的权限，先交 Main 最小定位证据；本合同只保持独立红证，不自动扩大开发权限。

## 3. 原有限复验与停止边界

Main 唯一整 build/GUI，先由唯一人员开发确认可写范围稳定，修后合任务认领新候选、一次整 build，再沿已封原 FD 四个真实宽度 `1440/1024/768/390 × 900` 深色 CSS100 的 top/展开未分配/scroll 以及原1440图轴真实wheel/横滚段采证，不增状态、主题或缩放。

复验应证明：既有姓名、负载事实列、展开入口仍可达；图轴标题/姓名/数字不串槽或相叠；完整名称保留原 accessible 语义；合理排期内滚不撑出外壳；开放14人各1加未分配2、合计16、实际MAX8不变，浏览RPC零业务写与初末字节一致。恢复标准包的合法准备写另列，不混成浏览零写。

受影响旧 GUI 不自动继承到新候选，修复与回归由独立专家审新原证。未跑全格、其余状态/浅格/native200、AUTO、F1/FL MAX10、父ordinary commit均不放行。本合同先发，最终同前缀 report/audit/seal/readback 实际收据完成后 STOP / released。

## 4. 发送后实际状态纠正

负责人后续明确：姓名唯一开发已实际封件、readback status0、released。上文“当前未封批次”和旧开发 ID 仅是合同发送时依据先前消息的假设，不再作为现时写权。**不得改姓名原封件、不得复活旧 finished 开发。** Main 按同人员唯一继任顺序另认领 `people.css` 轴续修新批，具体继任 ID 和授权由 Main 另交，不由本专家猜测。文件/行为边界维持 §2；新轴源另经独立审证，姓名有限 SOURCE/AUTO 审证不自动覆盖后继轴 CSS。

## 5. 精确追加允许范围（负责人后续明确授权）

Main 已读唯一 CSS 继任的 handoff/plan 及 `/tmp/people-axis-overflow-developer-20261023/readback` 实际0、STOP / released；该继任源码零改，CSS仍 `8665e0874b0995a77bcd119fbcd892eaeb853593ce4014bce33100d270a995f4`，TSX仍 `e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6`。**这些为 Main 移交事实，本角色未读该后继产品源码或独立核其收据。** 移交定位：TSX464-468 点姓名/数值直接同节点；CSS147为124px，dots TSX199-200保 `top=14+i*15`，FD15行末中心224。定位不是本角色独立确证的 CSS/TSX 根因。

依据本次负责人明确指令，在父既有确证缺陷修复授权内，由 Main 顺序另派唯一新继任，不复活任一 released 开发。以下精确范围**替代 §2 中 TSX 禁改及仅 CSS 可写限制**，其余边界仍有效：

- `packages/dsh-pm-tool/src/client/views/people.tsx`：仅既有 dots 容器高度适配，保原 `top=14+i*15`；点姓名和数值拆成独立文本槽，保原顺序、完整可访问 name/value、现 `xPct/flip` 及事件；必要排期姓名 span 槽。不得删行、截存储姓名或改数值来迁就高度。
- `packages/dsh-pm-tool/src/client/views/people.css`：仅现有 wrapper/卡、排期内部收缩、姓名槽、点文字槽及高度适配。排期合理内滚与外壳布局隔离，不用全局裁切遮盖问题。

不改公式、MAX、core、schema、事件、点位算法、来源、fixture；不新增卡/断点/全局设计，不扩大其他页面。本角色不选择具体实现、不运行产品、不修改当前源码。新继任完成后须另认领新源及独立审证；当前姓名 SOURCE 结论不能借到轴 TSX 变更。

原有限复验仍为 F1/FL原段、FD四真实宽度及原轴wheel/横滚动作，F1/FL MAX10原缺证仍须实采，FD为MAX8；不新矩阵、不借旧图当修后证据。Main唯一合build/GUI，独立专家审受影响回归；父ordinary commit不由本合同签放行。
