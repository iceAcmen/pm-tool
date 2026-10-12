# CRUD-MILE-01 — 全生命周期采证完成（不判 PASS）

环境：3091 PID 45417；lib/client.js a3ba4f39；data-root .tmp/e2e-3082/data；console 窗口 0 起。
实际 ID：**m-0002**（系统生成，非逻辑别名 m-r3t）。

阶段与采集器输出：
- before：27 JSON 基线
- create vs before：added=1（m-0002.json），其余 27 不变 → 创建证据干净
- edit vs create：contentModified=1（重命名 title R3T-Mile→R3T-Mile-改）
- 标记达成：toggle 按钮 outerHTML before data-checked="false" → after data-checked="true" disabled；JSON 落盘 status=achieved, achievedDate=2026-10-12
- cancel vs edit：contentModified=1（=达成 toggle，非取消副作用）；m-0002.json 仍在、行仍在列表 → 取消保护有效
- delete vs edit：deleted=[pmtool/milestones/m-0002.json]，27 不变；ls 证明 milestones/ 只剩 m-0001.json；toast"里程碑已删除 m-0002"

截图（bu.screenshot 覆写临时文件，仅最终 delete-confirmed 持久化）：shots/delete-confirmed-<ts>.png。
早期 create-form / marked-achieved / delete-cancelled 三张已覆写丢失，关键状态以采集器 diff + JSON 落盘为准。

重要观察（影响 PROJ 判定）：里程碑创建首击"添加里程碑"无反应、未落盘；补填目标日期 2026-10-25 后提交成功。
→ PROJ 疑似"创建项目按钮无反应"很可能同样是必填校验（开始/目标日期为空）的静默拒绝，非按钮 bug。需按补填日期复测 PROJ 再定性。
