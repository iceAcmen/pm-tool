# 遗留清零与技术债清理总证（2026-10-18）

> 目的：融合脑暴方案启动前，清零 pm-tool 全部遗留问题与技术债，产出可复核证据。
> 基线 SHA：`380802c`；本批 4 个修复提交（未 push 前）：`8d36ea3`（UI 视觉/响应式）、`f2d3d9e`（表单行为）、`21e27f7`（键盘可达性）、`f2109a5`（技术债清理）；修复后 HEAD = `f2109a5`。
> 验证实例：http://127.0.0.1:3172/ （token 以 /tmp/dsh-p2-iso-3172.log 尾行为权威，进程保持运行，供所有者复核）。
> 门禁口径（每轮修复均执行）：`pnpm run build` 退出 0、`pnpm vitest run` 209 全绿（18 文件）、`pnpm run verify:isolation-only` 172 文件 hash+mtime 零污染。
> 证据目录：`docs/testing/legacy-clearance-20261018/`（各子代理分目录）。

---

## 一、闭环项（修复 + 复验 PASS）

| 条目 | 补证前状态 | 动作 | 结果证据 | 结论 |
|---|---|---|---|---|
| D7 深色对比度 | dark 最差 2.33:1（15px w800「P」首字母徽标）；多实例次要文本 3.26:1 | 5 处徽章（rail-logo/ri-ava/ov-avatar/dv-av2/pp-ava）改静态深品牌蓝底 + 显式白字（宿主 `--pm-on-primary` 解析近黑不可用） | P 徽标 2.33→**5.39:1**；浅深两档全视图扫描 **0 FAIL**（f1-visual/manifest.md、measurements.json） | **PASS** |
| D8 状态色文字 | 次要文本 10–11px w600 浅 3.91–4.23:1 / 深 3.26:1 | 可读次要文本 `faint→muted`（密度 chip「全部视图生效·持久保存」「无子任务」、矩阵表头/脚注、概览统计标签） | 全视图浅/深定向扫描 0 FAIL，全部 ≥4.5:1（f1-visual/） | **PASS** |
| G3-7 390 遮挡族（风险/人员/交付物/概览） | 390×844 四视图 switcher 栏 top=64 压操作条 23.8px，新建项目/更多/刷新不可点（8 帧 FAIL） | ≤560 顶栏改两行 grid，操作条与 switcher 纵向堆叠 | 5 视图×浅深 10 帧 `ov_sw=0`、elementFromPoint 按钮中心命中自身（f1-visual/B-390×10） | **PASS** |
| G3-7 768 概览叠印 | 768×1024 概览「新建项目/刷新」与 crumb-bar 重叠 22px（2 帧 FAIL） | 561–960 顶栏两行 grid | 浅深 `ov_cb=0`，按钮可点（f1-visual/C-768×2） | **PASS** |
| G3-7 其余视图（里程碑/会议/汇报 768+390、人员 768、甘特 390） | 清单标「待验证项」 | 逐帧真实导航截图 + 横溢/越界测量 | 16+14 帧中其余全 PASS：doc 宽=视口宽零外壳横溢、零裁切（g3-7a/、g3-7b/ manifest+measurements） | **PASS** |
| G3-6 甘特 390 | 待采证 | 390 浅深采证 | `.pm-gantt-scroll` 内部横滑成立（scrollW 2000/clientW 166）、身份列固定在滚动区外、浅深镜像（g3-7b/） | **PASS** |
| G4-1 320 看板 | 下拉缺「总览看板」入口 + bento 卡 65px 竖排（FAIL） | 补下拉入口；静态 bento 两列、卡高 65→119px、标签换行 | 320 浅深截图，10 卡可达、可读（f1-visual/） | **PASS** |
| E2 内联错误 aria-describedby | 绑定关系未取证 | 空名提交制造校验错误 | 任务/交付物错误元素带 id 且控件 `aria-describedby` 指向该 id、`aria-invalid=true`；27 字段静态 1:1 绑定（f2-forms/final-probe.json + 截图） | **PASS（本就成立，取证闭环）** |
| E10 异步提交防重 | 本地秒开未触发，待验证 | 父级 `inflightRef` 在途守卫 + 七表单 `useSubmitGuard` | pending 9 采样点 `disabled/aria-busy/提交中…`；二次点击 blocked；延迟注入实测 + 无延迟连点均只落 1 条 `rowDelta=1`（f2-forms/） | **PASS** |
| E11 保存返回上下文 | 待验证 | 根因=开抽屉重置滚动；抽屉打开前快照、关闭/保存后恢复 | 修复前 420→0；修复后 chip=全部/sort=dueDate/scrollTop 420→420 全保留（f2-forms/post-e11.json） | **PASS** |
| F9 成功反馈 role=status | 待验证 | 成功 Notice 补 `role=status`+`aria-live=polite`，不抢焦点；错误变体 `role=alert`+`assertive` | `focusedInside=false`、role/live 取证（f2-forms/final-probe.json + 截图） | **PASS** |
| F10 stale 保留旧数据 | 待验证（面向未来远程路径） | 新增纯状态机 `core/stale-placeholder.ts`（保留旧数据+标更新中/陈旧+最后更新时间，失败不清空）+6 单测 | 18 文件 209 全绿含 6 新用例；未接真实远程（f2-forms/） | **PASS（实现+单测）** |
| I3 菜单 Esc 归还焦点 | 命名视图/导出菜单 Esc 未归还 trigger | 两菜单记录 trigger ref，Esc stopPropagation+关闭+rAF 归还 | 两菜单 Esc 后焦点分别回「切换命名视图」「导出当前视图」（f3-a11y/after/verify-i3.txt） | **PASS** |
| I4 浮层无焦点陷阱 | 抽屉 Tab#31 逃逸至宿主 rail | DrawerPanel 焦点陷阱：capture keydown 收集可见可聚焦元素首尾循环回绕 | Tab×20 escapedCount=0、末项→首项与 Shift+Tab 回绕成立、Esc 归还 opener（f3-a11y/after/verify-i4.txt） | **PASS** |
| I6 自定义 tab 模式 | 方向键不移动、无 tabpanel 关联 | 三处 tablist（模型车道/副驾模式/风险问题）补 roving tabindex + ←/→/↑/↓/Home/End + aria-controls + role=tabpanel/aria-labelledby | 三处方向键翻转+焦点跟随+panel 关联 DOM 摘录（f3-a11y/after/verify-i6-*.txt、i6-dom-excerpt.md） | **PASS** |
| I7 看板拖拽键盘替代 | wrap 不可聚焦、无坐标输入 | wrap tabIndex=0/role=group/aria-label；Enter 选中、方向键步进移动（碰撞交换+边界夹紧）；ConfigPanel 增 X/Y/W/H 键盘输入 | 10 卡全可聚焦、ArrowRight 完成移动 selected=true、X/Y/W/H 生效；鼠标 RGL 链路未动（f3-a11y/after/verify-i7.txt） | **PASS** |
| O2 链接实例补证 | 种子全站无 `<a>`，链接视觉待补 | 新建含 repoUrl 任务（O2 链接补证任务） | 真 anchor（href/target=_blank/rel=noopener）、tabIndex=0、下划线视觉可辨、Enter 打开新标签 activated=true；旁注：证据链接字段仅文本不渲染 anchor、anchor 色继承正文未走 `--pm-link`（o1-o2/） | **PASS（含 2 条旁注观察）** |
| 技术债·历史复核 | 待确认 | 逐项核实 | nextStatus 死码**已消除**（src 无残留）；重复 clamp=**有意区分**（写/展示路径语义不同，保留）；甘特连线重叠**已消除**（routeEdge 大 U 绕行+lane 错峰+专属测试）；在册 MANUAL_PENDING 均非源码债（tech-debt-inventory.md） | **确认闭环** |
| 技术债·新债清理 | 清点 1 中 + 多低 | 死导入 10+3 组、死组件 7 个、core 死导出 15 项删除；标签字典 4 处拷贝→zod-free `core/labels.ts` 单一来源（文案逐字不变）；抽 `clampStart/clampDue`、`parseProgressInput` 复用 `clampProgress`；删过时注释 | 门禁全绿；冒烟 22 任务/状态标签/概览/里程碑标签与 core 一致、控制台 0 error；**顺带修复引入 zod 致宿主 boot 失败隐患**（tech-debt-cleanup.md） | **PASS** |

## 二、需用户裁决项

- **O1 1440 任务页主 CTA 视口位置**：复测仍在视口外——`innerWidth=1440`，主 CTA `rect.x=1486.66/right=1593.70`，越右缘 **153.70px**；成因：`.pt-toolbar`（clientW 880/scrollW 1058）overflowX=visible，密度占位件（1149–1475）把 primary（1487–1594）挤出视口。
  - **方案①（推荐，成本小）**：工具条溢出收纳——保存视图/分组/排序/导入/导出/分享/密度收进「更多」，主 CTA 固定工具条右端常驻，对齐 §9.1 唯一主 CTA 常驻可达；
  - **方案②（成本中）**：主 CTA 落点上移至页头右缘（与全局「新建项目」同层），工具条只留筛选/分组，需统一各视图落点并落布局规范。
  - 对比图：`o1-o2/O1-A-vs-B-comparison.png`（方案 B 为页内临时 DOM 示意，刷新即还原，未落库）。**待所有者拍板后实施。**

## 三、环境阻塞 / 待输入项（非功能缺陷，需环境侧就绪后复测）

- **P2-6 AI 溯源流程复测 = BLOCKED**：隔离实例全部真实 AI 通道返回 `NO_ADAPTER`（ark-plan/deepseek-v4-1-flash-260910、openrouter/free、doubao-seed-2-1-lite 均未配置适配器；进程无 `CODING_PLAN_API_KEY`；availability 4 候选全 unavailable）。已真实尝试：副驾 ask（prod+PoC）、AI 助手 WBS、进度叙述，均无草稿生成；**零 mock、零伪造**，未新增/删改业务记录。解除阻断：宿主注册 LLM 适配器 + 设置录入方舟 Coding Plan Key 后重跑。F09 L3 维持 **MANUAL_PENDING**（依据：docs/testing/evidence-p2-6-*/ 与 p2-6/REPORT.md）。
- **D2 风险矩阵 320 / D3 交付物漏斗 320（填充态复验）**：CSS 已随 commit `8d36ea3` 修复（矩阵 ≤560 内部横滑不裁「严重」列；漏斗 ≤560 换行去竖排），源码规则已随构建生效；但当前实例数据根无风险/交付物填充记录（4 项目全空），填充态渲染无法在本会话复测——修复前破版帧见 g4-1/G4-1-320-risk-light.png 与 G4-1-320-deliverables-light.png（含数据），**待种子数据实例复核**（核实记录见 f1-visual/d2-d3-render-verify.md）。

## 四、待专项项（方法边界，不伪造）

- **I8 读屏播报**：无 AT 环境，已完成 DOM 级 aria 语义审计（26 项抽样：名来源/角色/状态可推导逐项列表，a11y/i8-audit-table.md）；「AT 实测」标注**待专项**。
- **G4-1 200% 文本缩放**：已用根元素 CSS zoom 模拟法取证（4 关键视图，SIM-PASS 无破版、方法局限如实标注）；**原生浏览器 200% 缩放实测**待有 GUI 通道专项执行（g4-1/manifest.md）。

## 五、门禁汇总（4 轮修复各执行一次）

| 轮次 | commit | build | vitest | isolation |
|---|---|---|---|---|
| F1 视觉/响应式 | 8d36ea3 | 0 | 203 绿 | 169→169 零污染 |
| F2 表单行为 | f2d3d9e | 0 | 209 绿（含 F10 新增 6） | 172→172 零污染 |
| F3 键盘可达性 | 21e27f7 | 0 | 209 绿 | 172→172 零污染 |
| T 技术债清理 | f2109a5 | 0 | 209 绿 | 172→172 零污染 |

## 六、证据索引

- `legacy-clearance-20261018/g3-7a/`（里程碑/风险/人员/会议 16 帧 + manifest + measurements）
- `legacy-clearance-20261018/g3-7b/`（汇报/交付物/概览 12 帧 + 甘特 390 2 帧 + manifest + measurements）
- `legacy-clearance-20261018/g4-1/`（320 档 14 帧 + zoom 模拟 4 帧 + manifest + measurements）
- `legacy-clearance-20261018/a11y/`（I4 焦点轨迹 / I6 DOM 摘录 / I7 替代路径 / I8 审计表）
- `legacy-clearance-20261018/p2-6/`（REPORT + 操作日志 + 磁盘基线 + 18 截图）
- `legacy-clearance-20261018/o1-o2/`（O1 复测 + A/B 对比图 + O2 anchor 取证）
- `legacy-clearance-20261018/f1-visual/`（D7/D8 + B/C/D 修复复验）
- `legacy-clearance-20261018/f2-forms/`（E2/E10/E11/F9/F10 复验 + 门禁日志）
- `legacy-clearance-20261018/f3-a11y/`（I3/I4/I6/I7 前后证据 + 门禁日志）
- `legacy-clearance-20261018/tech-debt-inventory.md`、`tech-debt-cleanup.md`

## 七、遗留状态总览

- **已闭环**：D7、D8、G3-6、G3-7（含修复后复验）、G4-1-320（看板），E2、E10、E11、F9、F10，I3、I4、I6、I7，O2，历史技术债确认、新债清理。
- **需用户裁决**：O1（两方案对比图待拍板）。
- **环境阻塞待输入**：P2-6（需模型 Key/适配器）、D2/D3 填充态复验（需种子数据实例）。
- **待专项**：I8 AT 实测、G4-1 原生 200% 缩放实测。
