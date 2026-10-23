# OP 与编号有限独立复验计划

> 给 Main 与独立专家使用。2026-10-21，trae 独立测试角色；采用 writing-plans 的分步方法，仅实施测试设施，不实施产品。负责人派单已明确授权本前缀写入，不另建 worktree、不提交。

**目标：**独立复验 OP-AUTO-DEF-01/02/03 的 SOURCE/AUTO 和 GNHD-01 的结构/AUTO；不关闭视觉或整体门。

**架构：**主树只读，八文件独立冻结；相关静态导入闭包、配置、原 F2 和已有完整依赖另外登记。自有副本链接只读既有依赖，子进程白名单环境、写根保护、禁网络、无缓存。旧产品基线与当前产品运行相同测试。

**工具：**macOS、既有 Node 22.23.3、Vitest 2.1.9、React 18.3.1、react-test-renderer、生产 JSON Storage/DomainFacility/命令/schema；不 install、不整包 build、不触服务。

## 待办

- [x] 读取 AGENTS/collaboration、父持续授权、原 OP/RA/GNHD 合同、ADL-055、开发报告完整内容。
- [x] 冻结八文件、五 tracked diff与config、93相关输入、14611依赖条目，原F2字节不变；最终run-qCokWR。
- [x] 独立十五文件114/114；基线五产品同新测试24红/6绿。红绿原件分轮保留。
- [x] 必要边界17/17：人工30/0/clear、null/0、筛选完整聚合、日期唯一写、旧读/新写/完整JSON零变化、两合法code同列状态、完成日期/revert。缺code违反生产schema，撤销此fixture不伪签短ID；排序只SOURCE核接线不签实测。
- [x] 相关入口自有编译：旧file-assets类型错误exit2已交Main；仅类型修复后compile0。原package tsconfig完整自有副本noEmit0，实际build未执行。
- [x] 前后输入/依赖与审证hash未变，57原OP+6RA+GNHD逐ID有限结果/GUI缺证已交；audit0，closure0，不签整门。

## 写入与停止

只写 `docs/testing/objective-number-independent-retest-20261021*`，包含同前缀 evidence/selftmp。不修改产品、其他 testing、living docs、共享依赖/cache/lib、认证/private、服务、Main GUI 或 Git。发现产品缺陷即时通知 Main；依赖漂移使相关当前适用性失效，保留已冻结原结果，不改 expected 转绿。F2 oracle 来自专家 `9dg1J5/f2.json` 及报告 §5，禁止以当前派生反算。

完整执行命令与退出码由 runner 原样保存。测试数仅为断言运行数量，不能替代原门或视觉验收。
