# P2002 出站位独立 SOURCE/AUTO R2 窄测计划

> 2026-10-23，trae，独立 SOURCE/AUTO 专家；不是开发、builder 或 GUI 执行端。沿原 R1 §5.1 合同补证，不增加产品要求或放行门。

## 授权与对象

负责人原句：“父goal持续授权全部已实现未验独立收口至ordinarycommit，无push/release/正式切；你独立SOURCE/AUTO专家，不开发/GUI。”

本子单唯一写 `docs/testing/p2002-outbound-slot-source-auto-20261023-r2*` 新文件及本次创建的 `/tmp` 设施。原 dirty 保留。不运行 Git、build/install、服务、GUI，不读写 privatefreeze/runtime/正式 profile，不写产品、原 testing、开发封件、Main plans 或 livingdocs。原 R1 supplement 只读，未有执行收据不算通过。父 ordinarycommit 终点不是本子单授权的 Git 动作。

已读 AGENTS、collaboration §9/11、原 `p2-outbound-history-review-20261023-r1.md`、开发 result/handoff/seal/runner/test/delta。三源已 released；开发 ownDelta 仅 index.ts、panel.tsx、tasks.tsx。baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 仅引用原封件，不核 HEAD、不以版本代 dirty 候选。

## 执行顺序

1. 结构化审开发 seal 的 76 个 artifact 指纹、最终 RED/GREEN/邻接收据、测试输入绑定与内嵌输出。核三源当前字节；原 RED 8 项、GREEN 8 项、邻接 54 项不无理由重复运行。开发设施首败和 stderr 保留，不能当有效产品红。
2. 只在自有 tmp 复制实际 `src/`，只读链接现有依赖；原开发 test 及 R1 supplement 原字节组成测试设施，不改任何生产函数，不运行开发 runner 或开发 tmp。
3. Asia/Shanghai 下仅运行补充 T01-T05；原 S01-S08 显式不执行。UTC 下只复测 T05，用于时区不改变原显示口径的窄反例，不重测全案。
4. 捕获实际 argv/cwd/env/时间/退出码/错误、stdout/stderr、Vitest JSON、真实 JSON DB 前后指纹、业务写探针和命令输出。保护非 owned 输入与依赖；并行变更如实列明，不假称全机零写。
5. 输出 report/audit/seal，给有限 SOURCE/AUTO verdict、原门继承理由及 Main 新 host GUI 尚欠清单；释放自有执行资源 STOP。不签 GUI、整组合、整 P2 或父提交准入。

## 补充用例

| ID | 初态、动作与期望 | 原合同对应 |
| --- | --- | --- |
| T01 | 三项目真实 schema；A 未排序 audit 加更旧的 +08:00 记录，C 独立合法记录，B 非法条目；真实 snapshot 最大 at/窄字段/项目隔离，零 DB 写 | 真源最大时刻、null 不造值 |
| T02 | A 父/子/孙层含 blocked；真实 panel，折叠/展开；实际每行一 slot，编号/清单不变，操作格仍独立编辑 | 全部实际任务行与 U4 受影响回归 |
| T03 | 真 panel 选 C、refresh、选 B 后卸挂；C 时刻不借 A，B 持久选择/未导出保持，零 DB 写 | refresh/重进/项目隔离 |
| T04 | 原命名视图状态分组；实际深层 blocked/wrapped 行都有 slot，分组头不是任务行证据 | 状态分组实际路径 |
| T05 | A 最高绝对时间是字面较小的 -05:00 ISO，旧时间放数组末，混入日期超界/非有限 count；sent/archive 放不同较晚时间；真实 snapshot/panel 仍只用 audit 最大合法 at，datetime/title 完整、HH:MM 字面保留；两 TZ 各一次，零写 | 原审计来源、MAX/时区/不触发 TTL |

fixtures 为隔离 JSON backend 的合法 schema 项目/任务及 settings 测试记录，不声称历史真实发送。非法 settings 仅用于既有 read 防御，不放宽生产写入口。T05 的 Number.MAX_VALUE 仅验证既有 finite itemCount 边界，不新增业务最大值规则。

## 尚欠范围

本轮不采真实 host、产物或 GUI。jsdom 可证明 DOM/动作和读链，不证明 CSS 布局、视口、目视或真实 reload。Main 须以同一新组合候选/产物/宿主绑定补原 §5.1 GUI 与受影响整回归，不能沿旧 host 的 GUI FAIL 改签，也不能用本窄测代父 PASS。
