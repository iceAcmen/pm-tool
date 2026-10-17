# 遗留清零与技术债清理总证（2026-10-18，含 r9 复测与拍板项落地更新）

> 目的：融合脑暴方案启动前，清零 pm-tool 全部遗留问题与技术债，产出可复核证据。
> 基线 SHA：`380802c`；修复/补证提交：`8d36ea3`（UI 视觉/响应式）、`f2d3d9e`（表单行为）、`21e27f7`（键盘可达性）、`f2109a5`（技术债清理）、`0869603`（证据总证）；
> 用户拍板后追加：`5da6616`（setup-keys 一键配置）、`cab8698`（P2-6 r9 真实 AI 复测）、`ca65a05`（O1 方案②）。
> 验证实例：http://127.0.0.1:3172/ （token 以 /tmp/dsh-p2-iso-3172.log 尾行为权威，进程保持运行，供所有者复核；O1 落地后最新 token=`o3z19V9AixfJYWk4dKVJMCoEN2H1PfEuYt9Gco_eobw`）。
> 数据根：进程级证据确认 3172 实际读写 `pm-tool/data/pmtool`（profile patch storage-json root=pm-tool/data；仓库内 gitignored dev/test 根，非用户业务数据）。
> 门禁口径（每轮均执行）：`pnpm run build` 退出 0、`pnpm vitest run` 全绿（18 文件 209 用例）、`pnpm run verify:isolation-only` 零污染。
> 证据目录：`docs/testing/legacy-clearance-20261018/`。

---

## 一、闭环项（修复 + 复验 PASS）

| 条目 | 补证前状态 | 动作 | 结果证据 | 结论 |
|---|---|---|---|---|
| D7 深色对比度 | dark 最差 2.33:1（15px w800「P」首字母徽标） | 5 处徽章改静态深品牌蓝底+显式白字（宿主 `--pm-on-primary` 解析近黑不可用） | P 徽标 2.33→**5.39:1**；浅深全视图 0 FAIL（f1-visual/） | **PASS** |
| D8 状态色文字 | 次要文本 10–11px w600 浅 3.91–4.23:1 / 深 3.26:1 | 可读次要文本 `faint→muted` | 全视图浅/深 0 FAIL，全部 ≥4.5:1（f1-visual/） | **PASS** |
| G3-7 390 遮挡族 | 390×844 四视图 switcher 栏压操作条 23.8px | ≤560 顶栏两行 grid | 5 视图×浅深 10 帧 `ov_sw=0`（f1-visual/B-390×10） | **PASS** |
| G3-7 768 概览叠印 | 概览操作条与 crumb-bar 重叠 22px | 561–960 顶栏两行 grid | 浅深 `ov_cb=0`（f1-visual/C-768×2） | **PASS** |
| G3-7 其余视图 / G3-6 甘特 390 | 待验证项 | 逐帧真实导航截图+横溢测量 | 零外壳横溢/零裁切；甘特内部横滑成立、身份列固定（g3-7a/、g3-7b/） | **PASS** |
| G4-1 320 看板 | 下拉缺「总览看板」入口 + bento 卡 65px 竖排 | 补下拉入口；bento 两列、卡高 65→119px | 320 浅深可读、10 卡可达（f1-visual/） | **PASS** |
| **D3 交付物漏斗 320（填充态）** | 仅代码级修复，填充态待种子（旧实例无数据） | r9 真实入库 1 条交付物 dlv-0001 后首次渲染复测 | 六格漏斗两列换行、标签横排可读、无竖排断裂/竖线（o1-o2/after/D3-320-*.png、d3-funnel-evidence.json） | **PASS** |
| E2 内联错误 aria-describedby | 绑定关系未取证 | 空名提交制造错误 | 错误元素 id 与控件 `aria-describedby` 1:1、`aria-invalid=true`；27 字段静态绑定（f2-forms/） | **PASS（本就成立）** |
| E10 异步提交防重 | 本地秒开未触发 | 父级 `inflightRef` + 七表单 `useSubmitGuard` | 连点 `rowDelta=1`、pending 全程 disabled/aria-busy（f2-forms/） | **PASS** |
| E11 保存返回上下文 | 待验证 | 根因=开抽屉重置滚动；打开快照/关闭恢复 | 420→420，筛选/排序保留（f2-forms/post-e11.json） | **PASS** |
| F9 成功反馈 role=status | 待验证 | 成功 role=status+polite 不抢焦点；错误 role=alert+assertive | focusedInside=false（f2-forms/） | **PASS** |
| F10 stale 保留旧数据 | 待验证 | 新增 `core/stale-placeholder.ts` 状态机 +6 单测 | 209 全绿含 6 新用例（f2-forms/） | **PASS（实现+单测）** |
| I3 菜单 Esc 归还焦点 | 两菜单 Esc 未归还 trigger | 记录 trigger ref，Esc stopPropagation+归还 | 两菜单均归还（f3-a11y/after/verify-i3.txt） | **PASS** |
| I4 浮层焦点陷阱 | 抽屉 Tab#31 逃逸宿主 | DrawerPanel 焦点陷阱首尾循环 | Tab×20 escapedCount=0（f3-a11y/after/verify-i4.txt） | **PASS** |
| I6 自定义 tab 模式 | 方向键不移动、无 tabpanel | 三处 tablist roving tabindex+方向键+aria-controls+tabpanel | 三处翻转+焦点跟随+panel 关联（f3-a11y/after/verify-i6-*.txt） | **PASS** |
| I7 看板拖拽键盘替代 | wrap 不可聚焦、无坐标输入 | wrap 可聚焦+Enter 选中+方向键步进+ConfigPanel X/Y/W/H | 10 卡可聚焦、移动生效、四输入齐（f3-a11y/after/verify-i7.txt） | **PASS** |
| O2 链接实例补证 | 种子全站无 `<a>` | 新建含 repoUrl 任务 | 真 anchor/target/rel/tabIndex/Enter 开新标签成立（o1-o2/） | **PASS（含 2 条旁注）** |
| **P2-6 AI 溯源流程复测（F09）** | 首轮真实尝试全通道 NO_ADAPTER，MANUAL_PENDING；旧"mtime 晚于进程"推断口径已作废 | 配置就绪后按**宿主实际注册+真实调用**重测：直连 ark HTTP 200 真实补全；副驾生产车道真实生成两步计划；整批执行入库 | 交付物 **dlv-0001**「P2-6 复测：AI 溯源验证报告」planned/due 2026-10-25 落盘；台账 **prv-mvctk2dq-8ws70u** kind=ask-apply/status=confirmed/refs=[]/重校 consistent；警告条本流程不触发（refs=[] 无依据可失效，设计内正确）；task.create 被 ALLOWED_OPS 剔除属设计内白名单，未绕过（p2-6/r9-ready/） | **DONE（真实 PASS，零伪造）** |
| **O1 主 CTA 视口位置（方案②）** | 1440 主 CTA rect.x=1486.7 越右缘 153.7px，用户已拍板方案② | 主 CTA 移出工具条、常驻页头右缘（与「新建项目」同层），统一 7 个有创建语义视图的落点；概览/人员无新建语义，按设计不渲染（不硬造） | 1440 七视图 rect 全在视口内（right=1099.97、y=15.34）；旧工具条 `.pt-primary` 残留=0；768/390 零重叠、CTA 可见；视觉 accent 描边+12% tint+`--pm-link` 文字（浅深均 ≥4.5），**无近黑实心**（o1-o2/after/） | **PASS** |
| **一键配置脚本 setup-keys** | 旧脚本缺 --check、ark-plan 四模型校验、默认模型条目管理、真幂等、路径自适应 | 保留原结构补全：只读审计（区分文件层/运行时层）、canonical ark-plan 块、默认模型 upsert、哈希级幂等、DSH_HOME 隔离、package 入口+文档 | 现网 `--check` 全过（key 掩码、0600）；scratch 合成 key 端到端+幂等哈希一致+篡改检出；现网真实运行字节级零变更（5da6616） | **PASS** |
| 技术债·历史复核 | 待确认 | 逐项核实 | nextStatus 死码/甘特连线重叠已消除；双 clamp 有意区分；在册 MANUAL_PENDING 均非源码债（tech-debt-inventory.md） | **确认闭环** |
| 技术债·新债清理 | 1 中+多低 | 死导入 13 组、死组件 7 个、core 死导出 15 项删除；标签字典→zod-free `core/labels.ts`；抽 clampStart/clampDue、parseProgressInput 复用 | 门禁全绿、冒烟标签逐字一致；顺带修复引入 zod 致宿主 boot 失败隐患（tech-debt-cleanup.md） | **PASS** |

## 二、待输入/待种子项（环境侧，非功能缺陷）

- **D2 风险矩阵 320 填充态复验**：CSS 已随 `8d36ea3` 修复（≤560 内部横滑不裁「严重」列），但数据根始终无风险记录（r9 流程仅产生交付物），填充态渲染仍待风险种子数据；不造数，待种子实例复核（f1-visual/d2-d3-render-verify.md）。

## 三、待专项项（方法边界，不伪造）

- **I8 读屏播报**：DOM 级 aria 语义审计完成（26 项，a11y/i8-audit-table.md）；AT 实测待专项。
- **G4-1 200% 文本缩放**：根元素 CSS zoom 模拟法 4 视图 SIM-PASS（g4-1/）；原生浏览器 200% 缩放实测待 GUI 专项。

## 四、门禁汇总（每轮修复/变更均执行）

| 轮次 | commit | build | vitest | isolation |
|---|---|---|---|---|
| F1 视觉/响应式 | 8d36ea3 | 0 | 203 绿 | 169 零污染 |
| F2 表单行为 | f2d3d9e | 0 | 209 绿 | 172 零污染 |
| F3 键盘可达性 | 21e27f7 | 0 | 209 绿 | 172 零污染 |
| T 技术债清理 | f2109a5 | 0 | 209 绿 | 172 零污染 |
| setup-keys 脚本 | 5da6616 | 0 | 209 绿 | 173 零污染 |
| O1 方案② | ca65a05 | 0 | 209 绿 | 176 零污染 |

（P2-6 r9 为纯 UI/数据实测、零代码改动，未产生构建门禁需求；其证据提交 cab8698。）

## 五、证据索引

- `legacy-clearance-20261018/g3-7a/`、`g3-7b/`（768/390/甘特 32 帧+manifest+measurements）
- `legacy-clearance-20261018/g4-1/`（320 档+zoom 模拟帧+manifest+measurements）
- `legacy-clearance-20261018/a11y/`（I4/I6/I7/I8 审计与截图）
- `legacy-clearance-20261018/p2-6/`（首轮 REPORT/operation-log/disk-baseline + **r9-ready/：disk-evidence.md、operation-log-r9.md、shots 00–06**）
- `legacy-clearance-20261018/o1-o2/`（O1 复测与 A/B 对比 + **after/：AFTER-复盘说明.md、o1-after-measurements.json、d3-funnel-evidence.json、1440 浅深/768/390/D3 截图**）
- `legacy-clearance-20261018/f1-visual/`、`f2-forms/`、`f3-a11y/`（修复复验+门禁日志）
- `legacy-clearance-20261018/tech-debt-inventory.md`、`tech-debt-cleanup.md`

## 六、遗留状态总览

- **已闭环**：D7、D8、D3、G3-6、G3-7、G4-1-320（看板），E2、E10、E11、F9、F10，I3、I4、I6、I7，O1（方案②）、O2，P2-6/F09（真实 AI 入库+溯源），setup-keys 一键配置，历史技术债确认+新债清理。
- **待种子**：D2 风险矩阵填充态渲染（需风险种子数据）。
- **待专项**：I8 AT 实测、G4-1 原生 200% 缩放实测。
