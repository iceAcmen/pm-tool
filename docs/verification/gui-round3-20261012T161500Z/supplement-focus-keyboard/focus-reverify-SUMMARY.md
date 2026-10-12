# R3-OBS-002 Focus Fix Re-Verification (采证，不判 PASS)

运行环境（候选指纹，均经实测与冻结值比对一致）：
- baseCommit d88a3325275878a77129179dbf8578a25c5e6511，workingTreeCandidate=true，dirty 仅 3 产品文件
- lib/client.js SHA a3ba4f39...a20709b = 冻结值
- lib/core/drawer-focus.js SHA 60d1e11f...9aa86 = 冻结值
- 旧实例 PID 26939 已停；新实例 PID 45417，tracked background taskId 70fee9b8-2ebf-4003-a376-5ac9ae650755，HTTP 401 健康
- 页面 http://127.0.0.1:3091/ 单 tab，真 viewport 789x745；框架 loader rev=57359a8d2317（非业务 bundle）
- console 观测窗口起点 0 条

原始测量结果（js 实测 activeElement + isTrusted 事件）：
1. title 路径：点"逾期任务"标题 → 抽屉开、焦点 INPUT name=title；Esc → activeElement=BUTTON text="逾期任务"，activeIsTitleOpener=true（旧 bug 落点"7天"按钮不再复现）
2. edit 路径：点"编辑 逾期任务" → Esc → activeIsEditBtn=true
3. create 路径：点"添加记录" → 抽屉"新增任务"开、焦点 title INPUT；Esc → 焦点 BUTTON text="添加记录"（class 实测 pm-add-button）
4. 键盘：KeyJ→Enter 打开"临期任务"、KeyK→Enter 打开"逾期任务"，keyLog isTrusted=true
5. 删除 fallback：新建专用测试行 t-0018"R3FIX删除回退行" → 抽屉删除 → 原生 confirm 接受 → rowDeleted=true、drawerClosed=true，activeElement=BUTTON text="添加记录" class=pm-add-row，activeIsAddButton=true（toast: 任务已删除 9 | t-0018）

DOM 事实（不自行定性，留专家判定）：
- create-Esc 后按钮 class 实测 pm-add-button；删除 fallback 后同一按钮 class 实测 pm-add-row。修复说明文档描述的 fallback 选择器 .pm-add-row 与渲染类名存在并存/差异，焦点均落在"添加记录"按钮。

截图说明（诚实记录）：
- bu.screenshot 覆写同一临时文件，仅最终 after-delete 一张已持久化（screenshots/r3fix-after-delete-fallback-20261012T164341Z.png，实际看图确认焦点环在添加记录行 + 删除 toast）；
- title-open/title-after-esc/edit-after-esc/create-after-esc 四张截图当时未立即复制已被覆写丢失，但其焦点结论均以本轮 js 实测 activeElement 对象为准（本文件上方逐条列出），不以截图为唯一证据。

NOT_RUN / 未做：
- 真 390 viewport：CDP Emulation.setDeviceMetricsOverride 仍 -32001 Session not found，不重复无收益重试，NOT_RUN
- 空格键：bu.press_key(" "/"Space"/"space") 0 事件，NOT_RUN
- 不停 3091，taskId 70fee9b8-2ebf-4003-a376-5ac9ae650755 交专家统一管理；7 CRUD 冻结用例待采集器通过后另做
