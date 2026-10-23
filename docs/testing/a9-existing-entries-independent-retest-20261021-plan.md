# A9 既有入口独立复验计划

> 给 Main 与接手专家使用：只约束本轮 SOURCE/AUTO 复验、证据归档和最小缺陷合同，不签 GUI、构建或整包放行。2026-10-21，trae，独立测试专家。

## 授权与对象

负责人本次指定：“新独立测试专家，只写docs/testing/a9-existing-entries-independent-retest-20261021*和selftmp，产品只读，禁其他testing/livingdocs/build/sharedcache/GUI/service/credentials/commit。”父持续授权验完在途、修确证缺陷、最后 Main commit 不继承为本角色写产品或提交权限。

以 A8 §4/5、既有收口计划、两个开发报告和 Main 清单红绿为输入。不修改原专家文件；只改自有 probe 的指向、设施或可证明失效的控制组，不降低产品断言。

## 进度

- [x] 读合同、核旧源范围和作者边界，保留未提交主树。
- [x] 冻结完整插件包源码/脚本/配置及引用合同、F2 fixture；源378文件逐字节一致。基线 HEAD 仅基线，dirty 候选由 `selftmp/freeze.json`、tracked.patch、新文件指纹认领。
- [x] 原probe副本控制隔离后6绿/1旧观察SKIP，原LG05同库4!=2的exit1保留。
- [x] 独立追加真实JSON/注册pm handler/PmPanel组合，最终12绿6红；LG04真toggle通过，会议错误词组合与导入非法预检确证FAIL。
- [x] 作者与受影响旧测试独立32文件317绿，noEmit原exit0。
- [x] CSV/XLSX真实后行非法：preview成功、confirm先落1、原样重试再落1、JSON重开2；按既有schema/非法0写合同定最小preflight修复，不加事务/幂等协议。
- [x] 报告与原证索引落盘，GUI NOT_RUN；核Main三行prefix不影响LG，不换冻结、不重跑全LG。执行结束释放。

## 独立增量

1. LG01/01b：两个已存行动项经 PmPanel→MeetingsView→RecordsMeetingForm，同时改会议/两个行动项，状态和同项目 task+issue，主保存；草稿零写、取消零写、清空/重进、稳定 ID/创建来源；生产非法引用拒绝后保输入，修正重试；新行部分成功后失败再试只建一次。不要求首次会议原子新增行动项。
2. LG04：真实 pm handler 提供每次全新 snapshot，不用改内存 task 模拟后端。真实 add/checklist command 种子，明确目标 true/true/false，验证 JSON 回读、幂等零任务文件变化、客观/父派生与 manual/status/legacy 不变；empty/parent/busy/失败重试。失败注入只在传输或存储设施，不替产品写数组。
3. LG05：作者 CSV/XLSX 原测试复跑并追加后行非法、preview schema、确认失败保预览与真实重试观察；明确部分写入与重试重复的实测边界。合法/取消0写、层级和字段落盘重开，busy/false/reject由作者例与独立链交叉证明。
4. GUI、样式、焦点、宿主下发、新 build 全部 NOT_RUN。不是 MANUAL_PENDING；按原 LG-G01/01b/04/05 交 Main 新建候选采证。

环境：macOS/bash + nvm Node22.23.3 + pnpm11.28.5；只读链接指定父树 node_modules（React/renderer18.3.1、Vitest2.1.9）；私有 TMPDIR/cacheDir/XDG_CACHE_HOME/NODE_COMPILE_CACHE，cache:false/--no-cache。产品 `src` 副本禁止编辑，只新增包根独立 probe；允许临时 JSON 测试数据，禁止正式数据/凭据/服务访问。
