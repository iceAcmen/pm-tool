# P1005 外部 Skill 试点记录

> 按 external-skills 模板字段记录本子单三次自动路由；按本次限定写面归档本计划前缀，不写常规 verification/testing/livingdocs。平台 trae，2026-10-23；开发记录，待独立专家审证。

## 基本信息

| 字段 | 本次事实 |
| --- | --- |
| vendor / commit | mattpocock / `49dd158d1076134a641b33efb035946536778336` |
| manifest | `vendor/agent-skills/mattpocock/manifest.json`，schema3 |
| 完整性 | 初次静态exit0、capture逐文件13/13 SHA+bytes匹配，vendor-final exit0；vendorIntegrityVerified=true |
| 候选 | 原报告基线引用`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不用HEAD代dirty；本次前后source SHA和新增文件见result/seal |
| 任务 | 仅P1L2-F01，给两真实事件补既有reflect用户入口，保旧taskId及非目标字节 |
| 专家门 | 原P1005入口FAIL不改签；开发缺陷修复可做，skill自测不授予产品放行 |
| 执行层 | macOS/bash/Node22.23.3/Vitest2.1.9；隔离临时输入、缓存、配置、JSON、输出 |

## 三次路由与实际增益

### 1. rootCause → 仅 diagnosing-bugs

- 只读加载 `skills/diagnosing-bugs/SKILL.md`；未叠grill/tdd/review。已读独立报告及当前源码，先建立真实反馈环，未静默改产品。
- 原现象：L2反思没有taskId，当前command先getTask，再按task查reflection。候选解释为任务定位、落盘缺失、合法来源模型问题。
- 最小命令 red-view 实际exit1，正常updateMilestone生成 `ref-mvk198vr-c3sc1m` 后命令回“未找到任务”；原JSON完整及来源字段正确，排除落盘/模型假设。确认根因仅在命令定位层，无需改core。
- 实际改变的决定：选择handler级真实PmDomain/JSON复现，不用SOURCE推理或直接调用core冒有效红；不开GUI/服务/调试埋点/HITL脚本。

### 2. feature（可测缺陷）→ tdd

- 根因确认后只读加载 `skills/tdd/SKILL.md`、`tests.md`、`mocking.md`；公开测试边界已由负责人及专家 §4.1 指定为 handleReflectCommand，无需重复问边界。
- red-contract exit1→仅commands/reflect.ts最小修→green首轮exit1（7绿/3自有optional断言失配）→纠正测试、产品不变→green-r2 exit0（10/10）→同库互保补测green-final exit0（11/11）。
- 实际增益：断言命令正文/真实JSON/句级内容及命令前后字节，锁定只目标记录、不自动final、稳定来源、重复/重开与坏ID拒绝；不mock内部业务模块、不手seed成功事件。
- 项目合同优先：真实落盘审计是专家明确要求，不因vendor“尽量只看接口”而删去字节证据。围绕同一既定handler锁定原最小测试合同，不用vendor另开设计、页面或无关测试范围。
- 没有寻找未vendored codebase-design；可选GLOSSARY不存在不阻塞。没有installer、home写入、Git/commit。

### 3. delivery → code-review

- 交付阶段只读加载 `skills/code-review/SKILL.md`；自查结束时真实11项命令与24项必要原专项均绿。
- 不运行setup，不使用Gitdiff/log/rev-parse；固定点用本次开工实际reflect字节副本，真实 `diff -u` 保留差异。标准源为AGENTS/collaboration，需求源为独立报告 §4.1和原X6-L2 §四；可选CODING_STANDARDS/CONTRIBUTING不存在。
- 标准轴：精确读反思ID、来源只派生、集中小函数供view/list复用、写路径仍核心、写面不跨界；无剩余自查发现。
- 需求轴：两事件各自旅程之外，发现需明确验证“第二事件不更写第一事件已final字节”；仅加同库连续测试，真实green-final 11/11；无剩余实现自查发现。
- 能力降级：没有暴露可用的spawn子代理工具，未伪称两独立review角色。按项目允许的开发自查分两轴执行，不能代独立专家审签；不是产品PASS。

## 越权检查

| 模板红线 | 结论 | 证据/边界 |
| --- | --- | --- |
| 自动setup/installer/初始化 | 否 | 未调用，只读Skill正文 |
| 实际home/全局配置写 | 否 | 子进程HOME/TMPDIR/XDG定向自有/tmp；没有用户配置动作 |
| 正式data业务写 | 否 | 仅真实PmDomain写自有临时JSON根，正常update触发事件 |
| 上游修改 | 否 | 未写；依赖链接只读 |
| 替代专家门/自封PASS | 否 | 原FAIL保，GUI/完整候选待Main+独立专家 |
| 未授权删除/覆盖他人成果/系统改动/推送 | 否 | 自有产物拒绝覆盖；负例仅删除自有临时项目记录；未Git/服务/系统配置 |
| 联网抓新skill | 否 | 使用锁定vendor，未联网 |
| 复制/改写vendor正文 | 否 | 没有副本或vendor改动；试点只引用路径 |
| 直接加载exposed:false依赖 | 否 | 没有grill/grilling |
| 未vendored skill调用或因此阻塞 | 否 | 缺codebase-design/setup/HITL皆跳过 |
| 重建未vendored脚本 | 否 | 未HITL/setup；自有runner仅做专项隔离与收据 |

8条红线自查无越权；保护证明限seal声明输入和实际操作根，不称全盘扫描。两处并行Listbox源码变化按nonOwnedDelta单列，不写、不洗绿。

## 验证与剩余门

逐文件校验、完整实际红绿命令/exit及SHA在本前缀result.md/evidence.json/seal.json。必要原专项3文件24项各一次，新增handler专项最终11项绿；历史产品红及自有断言失败原件保留。未执行build/tsc/noEmit/整verify/GUI/服务/Git，原verify-reflect/p1c需lib/index由Main后继处理。

**独立专家结论：未填写，待专家；没有专家签字。** 本报告不得进入毕业计数，也不改变原P1005 FAIL或父ordinarycommit出口。没有必须本人协作的认证动作，不转MANUAL_PENDING。升级/回滚增量：无；版本和manifest未变化。

后续：保留锁定Skill供后继参考，Main新整包认领+GUI采证，独立专家审签；本角色完成封存后释放两源码写锁并STOP，不写livingdocs。
