# CRUD-PROJ-01 — BLOCKED on product bug (采证端只报事实，不判)

环境：3091 PID 45417 / taskId 70fee9b8；候选 lib/client.js a3ba4f39（冻结值实测一致）；data-root .tmp/e2e-3082/data；console 窗口从 0 起。

before 阶段已采：27 JSON 文件快照（before.manifest.json / files/before/）。

BUG 观察（GUI 新建项目）：
- 点"新建项目" → 抽屉"新建项目"打开（项目名称/项目描述/负责人/开始日期/目标日期/创建项目）
- 标题输入"R3T-Proj项目"（DOM value 已确认存在）
- 点"创建项目"按钮 3 次（含 ref 刷新后重取），标题框内按 Enter 1 次
- 现象：抽屉始终不关闭；projects/ 目录始终仍只有 p-0001.json、p-0002.json（无 p-0003 落盘）；console 窗口 0 条错误
- 按钮 outerHTML：<button class="pm-button pm-button-primary" data-scu-ref="e632">创建项目</button>，disabled=false
- 证据截图：shots/bug-create-noop-<ts>.png（实际看图：表单已填名称、按钮高亮、无错误提示）

结论状态：CRUD-PROJ-01 创建路径走不通，按"发现产品 bug 立即停该 CASE 并保存"处理。未创建任何数据，未做 edit/delete 阶段，before 基线已存。
后续：MILE/RISK 走项目内"添加记录"标签页路径（与 tasks 同路径，此前 task 创建/删除已通），不受本 bug 影响则继续。

---

# 复测补全（专家判 name/start/target required，非功能 FAIL）

invalid-nochange 段（补采）：
- 空日期提交后 DOM 实测：name input required 已填（checkValidity=true）；startDate/targetDate input required、checkValidity=false、valueMissing=true、validationMessage="请填写此字段。"（outerHTML 已存）
- invalid-nochange diff vs before：cancellationUnchanged=true，27 不变 → 空提交未写任何数据
- 截图：shots/delete-confirmed-*.png（含 native bubble 聚焦开始日期）

补填日期后全链（实际 ID **p-0003**）：
- create vs before：added=1（p-0003.json）；name=R3T-Proj项目 startDate=2026-10-01 targetDate=2026-12-31
- edit vs create：contentModified=1；name→R3T-Proj-改
- cancel vs edit：cancellationUnchanged=true，p-0003.json 仍在
- delete vs edit：deleted=[pmtool/projects/p-0003.json]，27 不变；ls 证明 projects/ 只剩 p-0001/p-0002；toast"项目已删除 p-0003"

结论采证事实：早期"创建项目按钮无反应"= required start/target 日期为空的原生表单校验拦截，非按钮 bug。
