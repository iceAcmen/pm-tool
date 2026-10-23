# 网页备份接缝独立复验计划

> 给 Main 与后继测试专家使用。2026-10-21，trae，独立测试角色；只认领本次 SOURCE/AUTO，不签 GUI、整包 dirty 或发布。

## 授权与范围

父原句及分工以 `reports/all-pending-acceptance-execution-20261021.md` 为准。本次明确授权只写 `docs/testing/backup-web-independent-retest-20261021*` 及同前缀 evidence/selftmp；不改产品、其他 testing、livingdocs、共享依赖/lib，不 install/build、启停服务、操作 Main GUI、访问私有配置/凭据或 commit。

AGENTS/collaboration 常规 pull/install/build/档案/提交步骤由本次更具体动作范围替代。已读批准 closure 计划、原 MFR 最终报告/findings/GUI 交接及开发最终 28 专项+43 回归。memory 不存在，仓库为准。当前 shell 无 rg，使用 find/grep。writing-plans 仅采用分步与文件级方法；不执行其开发、docs/plans、worktree 或提交步骤。

## 执行步骤

1. [已读] 确认 MFR-B-01/B-02 原 FAIL 与批准的路径替代入口，不改旧报告或原 F5。
2. [已执行] 冻结完整公开 src/声明、基线提交、tracked diff、新文件清单、依赖解析与 F5/expected/侧车指纹；逐字节核复制。
3. [已执行] 已装依赖仅只读软链。生产编译仅输出自有 out；Vite 自有 cache、Vitest --no-cache，Node 写根保护，禁止网络/服务。编译不等整包 build。
4. [已执行] 独立重跑后端 28+15=43、真实面板路径 5+受影响 launch 5。追加真实 Context/JSON domain/handler→真实 PmPanel/ConfirmHost 接缝，不 mock panel/confirm；浏览器环境与传输 adapter 可替代。
5. [已执行] 补空路径、双引号/换行/控制符安全拒绝、空格单引号与反斜杠原文 token、错误尾参、失败保输入、两层取消、第一次确认仅 dialog、第二次才写、F5 全十三表/字节/共享/历史、content-only 诚实拒字节、F3/legacy 兼容。
6. [已执行] 同新测试替换自有旧命令/core与旧 panel，复现原 FAIL；旧后端26红/17绿，旧panel路径5红/launch5绿，不是当前源码 FAIL。
7. [已执行] 全新 Node 重开恢复库，十三表逐字段和双22字节比 expected，读回前后目录不变；最终99/99两轮稳定。
8. [已执行] 全src/声明无漂移、共享缓存指纹相同、原证与完整命令已保存。首轮菜单重开遗漏仅改自有设施；原产品未改。最终原证检查见同前缀报告/校验输出。

## 判定矩阵

| ID | SOURCE/AUTO 预期 | GUI 边界 |
| --- | --- | --- |
| BW01 / MFR-B-02 | content schema/关系/越界先拒零写；路径含同等校验及摘要/mime/size/canonical bytes | 新 UI 错误显示/布局未采 |
| BW02 / MFR-B-01 | F5 JSON-only明确未检字节/需路径；真实面板路径→演练→两确认→全表字节 | 实际装载/宿主/下载/重进未采 |
| BW03 | 空/引号/控制字符/多余 args 不注入 confirm；单引号空格原文，不用 JSON.stringify 做路径 shellescape | 前端双引号拒为安全子集，不假称支持 |
| BW04 | 演练与取消零写，失败保输入，确认重读完整预检、安全快照/回滚 | 真 GUI 焦点/危险动作/体验未采 |
| BW05 | F3/legacy JSON-only兼容，file metadata 不删除逃红，sessions/checks 不恢复 | 历史发布 binary 不测 |
| BW06 | 新 panel 指纹下 launch 5回归，必要原 bridge 23与独立补充14 | Finder/N2真实认证未采 |
| BW07 | 新 Node 十三表与双22字节 hash一致；冻结前后及原证有效 | 不扩成整 dirty PASS |

服务/Main GUI 本次禁止，记 NOT_RUN；缺装载证据使整门 BLOCKED，不转 MANUAL_PENDING。
