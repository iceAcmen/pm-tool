# A11 会议布局独立 SOURCE/AUTO 复验计划

> 给 Main 和独立测试接续者使用：仅复验 A10-MGUI-F01 修后源码及受影响自动化，不操作 GUI，不签会议整项。平台 trae，任务日期 2026-10-21，执行时点按原日志。

## 授权

负责人本次限定：“独立测试专家限定A10-MGUI-F01修后SOURCE/AUTO，不GUI、不产品build或更改。”只写本文件名前缀与 selftmp；禁止 install/pull、主树 lib、共享 build/cache、真实服务、GUI、credentials、commit。Main 唯一 builder/实际 GUI，普通 commit 授权不转移给本专家。

已读 AGENTS、collaboration §9/11、最新父执行记录、A10 会议审证 §5、实际计划 `docs/plans/2026-10-21-meeting-action-layout-closure.md`、A11 开发报告/增量/测试。writing-plans 方法用于明确步骤与验证对象；本角色不是产品实现，不新增通用 plans、不建 git worktree、不提交。

## 执行步骤

1. 冻结全 src、package 声明及配置到自有 selftmp；校验开发释放三指纹。旧表单/CSS从开发 before 只读复制，并以 A10 candidate 指纹交叉核验，不用 HEAD 冒充 dirty 候选。登记基线、tracked diff、新文件状态和全源索引。
2. 独立 TypeScript AST/字节与 PostCSS 审计：render 前业务处理不变；所有原控件属性、事件、选项内容不变；非行动项 CSS 不变；新增规则只作用 action 局部，未用隐藏/裁切吞标签。
3. 自有副本运行原七文件 54 项，另运行相关 records/listbox 周边原测试。依赖只读复用既有隔离 node_modules，Vite/TMP/XDG/Node 缓存指向自有输出，关闭 Vitest cache/coverage，串行一 worker。不调用 build/noEmit/verify 产品出口。
4. 增加真实 RecordsMeetingForm + 生产 callback/domain/command 的有界断言：长标签与值完整保留、同项目 issue 正向与排除、错误词双旧行主保存及稳定 ID/来源、失败保稿与新行去重、填新稿取消零写、busy/disabled、行操作与归属。这是组件/内存 AUTO，不是原生菜单/布局引擎/磁盘 GUI。
5. 同版原布局测试跑 A10 旧表单/CSS，预期六红；修后原 54 及独立追加复跑两轮。记录完整 argv/cwd/exit、日志与源码/依赖缓存前后指纹；失败不改产品，设施错误保原件并注明。
6. 输出独立报告：SOURCE/AUTO 局部结果、回归影响索引、旧 A10 GUI FAIL 保留、修后 GUI NOT_RUN、payload/rawdisk 缺证及 Main 后续实际下发/0/1/2 行 GUI 要求。本轮完成释放，不扩大为父总门/发布/提交准入。

## 执行流水

- freeze/audit：381源码冻结、三释放hash与A10旧源吻合、40 AST条目/6611字节业务前缀/15局部规则核对完成。首冻结异步命令外层exit未回收，记缺证，后续同步proof重新核冻结并确认runner退出。
- old-layout→original-r1→independent-r1：原同版六项预期红exit1，修后54/54与追加7/7各exit0，无产品更改。
- extra→original-r2→independent-r2：周边42/42，第二轮54/54与7/7各exit0；pending均0。
- finish/proof：各exit0，源/两共享缓存根漂移0、依赖声明一致、812自有证据文件索引，未持有runner。
- 报告已写本前缀主Markdown，SOURCE/AUTO有限PASS、原GUIFAIL/缺证保留，释放本角色；Main继续实际GUI，不签父总门或提交准入。

## 判定边界

源码规则存在不等 bbox/不重叠成立。长字符串在组件树完整不等原生 select 长菜单可读；无 200%/窄深/真实键盘/真实服务 restart 证据。本轮不新建 headless 浏览器，也不读活跃 runtime/凭据；旧 A10 行为证据按实际变更影响有界保留，受影响布局必须新 GUI 重采。
