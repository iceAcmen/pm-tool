# A11 r3 原图与动作帧独立目视记录

> 给 Main 和复核专家使用；trae 独立逐图/逐格目视，实际本机 2026-10-22。这里只审原图，不操作 GUI；联系页仅由原 JPG 离线派生，不构成新增执行证据。

## 五态上下原图

五组上图均完整露出小完成卡，读到 `2/10、20% 已完成`，相邻未完成为 `7/10、7待办、0进行中、1已收尾`。五组下图均完整露出 completionHero 的 `20%、2/10、完成2、进行0、待办7、受阻0、收尾1`。下图时上卡离屏是滚动位置，不拼接成两卡同时同屏；两幅来自同一文档、同一保存态。上图原PNG才是本次旧阻塞的补证，文件名和DOM不是目视替代。

| 保存态 | 原上图 | 原下图 | 原完整目标记录 | 上图父客观值 |
| --- | --- | --- | --- | --- |
| 人工30 | [上](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/manual30-overview.png) | [下](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/manual30-overview-lower.png) | [wrapper](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/manual30-overview-original-task.json) | 63%，覆盖2/3 |
| 人工0 | [上](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/manual0-overview.png) | [下](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/manual0-overview-lower.png) | [wrapper](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/manual0-overview-original-task.json) | 63%，覆盖2/3 |
| 清除人工 | [上](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/clear-overview.png) | [下](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/clear-overview-lower.png) | [wrapper](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/clear-overview-original-task.json) | 63%，覆盖2/3 |
| 清单100 | [上](../../reports/all-pending-evidence-20261021/A11/objective/checklist-visible-r3/checked-overview.png) | [下](../../reports/all-pending-evidence-20261021/A11/objective/checklist-visible-r3/checked-overview-lower.png) | [wrapper](../../reports/all-pending-evidence-20261021/A11/objective/checklist-visible-r3/checked-overview-original-task.json) | 88%，覆盖2/3 |
| 清单还原50 | [上](../../reports/all-pending-evidence-20261021/A11/objective/checklist-visible-r3/unchecked-overview.png) | [下](../../reports/all-pending-evidence-20261021/A11/objective/checklist-visible-r3/unchecked-overview-lower.png) | [wrapper](../../reports/all-pending-evidence-20261021/A11/objective/checklist-visible-r3/unchecked-overview-original-task.json) | 63%，覆盖2/3 |

下卡清单小卡的L1读数前三态为50%、清单全勾为100%、还原为50%。原上图标题、数字、条形完整可见；本审证未对图片重新绘制内容或注入DOM。执行原件的`.ov-row-stats.scrollIntoView()`和`top>=0 && bottom<=innerHeight`是静态动作证据；页面JSON未单独保存此行bbox，不伪造一份实测bbox。实际可见性由十张原PNG及以下原帧独立目视确认。

## 全帧逐格复核

[联系页索引](a11-overview-visible-final-review-20261021-selftmp/contact/index.json)完整列页名与原帧范围。以下十一页全部逐格看过，共manual93帧/checklist71帧；指纹逐帧重算见[实质审计](a11-overview-visible-final-review-20261021-selftmp/observations-r3.json)。动画、重复画面和尾页空格不计新场景。

| 原段 | 已目视联系页与原帧范围 | 动作观察 |
| --- | --- | --- |
| manual | [0](a11-overview-visible-final-review-20261021-selftmp/contact/manual-visible-r3-0.png)：000000–000015 | 打开F2-L1，滚到人工输入、值30和来源备注；客观50/1/2不变。 |
| manual | [1](a11-overview-visible-final-review-20261021-selftmp/contact/manual-visible-r3-1.png)：000016–000031 | 主保存反馈；上卡2/10/20及下环20可见；下卡L1仍50。 |
| manual | [2](a11-overview-visible-final-review-20261021-selftmp/contact/manual-visible-r3-2.png)：000032–000047 | 甘特人工30、重开、输入0；表单人工0可辨。 |
| manual | [3](a11-overview-visible-final-review-20261021-selftmp/contact/manual-visible-r3-3.png)：000048–000063 | 主保存人工0、上卡2/10/20、父63、重开。该页没有捕到人工0下卡停留帧；下卡依据对应完整原PNG，不用帧填补。 |
| manual | [4](a11-overview-visible-final-review-20261021-selftmp/contact/manual-visible-r3-4.png)：000064–000079 | 清空人工值/备注、主保存、上卡及下卡滚动；客观50。 |
| manual | [5](a11-overview-visible-final-review-20261021-selftmp/contact/manual-visible-r3-5.png)：000080–000092 | 下环20及L1=50、甘特客观50、重开；尾页三空格非原帧。 |
| checklist | [0](a11-overview-visible-final-review-20261021-selftmp/contact/checklist-visible-r3-0.png)：000000–000015 | 先50/1/2，第二项焦点；即时变100/2/2。键名Space由原execution核，不从图像猜。 |
| checklist | [1](a11-overview-visible-final-review-20261021-selftmp/contact/checklist-visible-r3-1.png)：000016–000031 | 全勾留存、取消抽屉后反馈和跨页；上卡2/10/20、父88。 |
| checklist | [2](a11-overview-visible-final-review-20261021-selftmp/contact/checklist-visible-r3-2.png)：000032–000047 | 下环20/收尾1、L1=100、甘特100、重开2/2。 |
| checklist | [3](a11-overview-visible-final-review-20261021-selftmp/contact/checklist-visible-r3-3.png)：000048–000063 | 第二项取消，100→50、1/2；跨页上卡2/10/20/父63及下环20。 |
| checklist | [4](a11-overview-visible-final-review-20261021-selftmp/contact/checklist-visible-r3-4.png)：000064–000070 | 下环20、重开1/2/50；尾页九空格非原帧。 |

截图及帧显示的取消只关闭表单，不撤销已完成的清单即时写入。人工清除从已保存0执行，不声称30直接清除或取消清除零写。观察到快速页面切换/动画，不据此另判全页面样式或UX。

## 其他原图与限定

重新单独目视[menu100](../../reports/all-pending-evidence-20261021/A11/objective/native-zoom/menu100.png)：地址3225、Chrome原生100%、QA-OP与2/10/20可见。该菜单来自同一文档的旧采证，不声称r3另采菜单；DPR1、截图尺寸或pageScaleFactor不能单独认证原生缩放，尤其不签200%。

五张甘特原PNG另行单独目视：[人工30](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/manual30-gantt.png)、[人工0](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/manual0-gantt.png)、[清除](../../reports/all-pending-evidence-20261021/A11/objective/manual-visible-r3/clear-gantt.png)、[清单100](../../reports/all-pending-evidence-20261021/A11/objective/checklist-visible-r3/checked-gantt.png)、[还原50](../../reports/all-pending-evidence-20261021/A11/objective/checklist-visible-r3/unchecked-gantt.png)。分别可见人工30%、人工0%、客观50%、客观100%、客观50%，父63/88符合完整记录。左侧辅助长标签部分省略，不签其所有文字可读性。

任务页L1行不都在视口内、人工重开截图不都露出人工字段；字段保留由原JSON及完整wrapper证明，动画帧仅补实际可见部分。不扩报告快照、所有消费点目视、wrapped完整旅程、A12、全OP/B8或发布。
