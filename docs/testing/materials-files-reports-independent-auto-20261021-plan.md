# 资料、文件、固定汇报独立 AUTO 执行计划

> 给 Main 和独立测试专家使用。先冻结和审核，再运行生产源码；本文是执行计划，不是 PASS。2026-10-21，平台 trae，角色独立测试专家。

## 目标与边界

- 父授权：`reports/all-pending-acceptance-execution-20261021.md`；负责人要求持续验完积压。子派单限定本专家只写 `docs/testing/materials-files-reports-independent-auto-20261021*`、该前缀 evidence 和自有 tmp。
- 验收依据：`remaining-acceptance-register-20261021.md`、`remaining-journey-cases-20261021.md` §3/4/5 的 RA-M01..07、RA-F01..08、RA-R01..05，以及 RA-J03/04/06。
- 禁止产品修改、其他 testing/living docs、install、整包 build、共享 lib、产品 service、Main GUI、私人凭据、上游、commit/push。不执行通用 SOP 中冲突的操作。
- 唯一依赖输入：已装 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，只读。源码从主树冻结到自有 tmp；TS 仅编译该副本到自有输出，不用现存 A0 lib 代表新 task.ts。
- 不做全盘零变声明。仅记录输入指纹与自有写根；不用正式 data/assets/exports/profile。故障使用生产 hooks 或纯 tmp adapter。

## 架构

真实 Cordis Storage + JsonStorageBackend + DomainFacility 打开生产 pmDomainSpec。调用生产领域函数和真实命令 handler；不自造 domain。请求/响应 adapter 只驱动生产路由，不替换 attach/resolve/存储。历史合法缺键种子通过生产 schema、标准备份预检和恢复导入。

## 步骤与状态

1. [已完成] 阅读授权、AGENTS/collaboration、总登记及逐 ID 合同；识别历史 B2/B3/B6冻结结论。
2. [已完成] 审核现有用例：保留有意义的真实断言；标记替身 domain、计数而非全内容、伪 abort、宽松并发断言及 StrictMode 接线缺口。
3. [已完成] 自有 run/guard 冻结主树 source、tracked diff、基线、新文件指纹及依赖声明；保存主树/隔离树差异、A0产物归属但不使用 A0。
4. [已完成] 在自有 tmp 用只读 TypeScript CLI 编译生产 core/commands 及所需模块到自有 lib；隔离复跑经审核的现有测试，不装依赖、不运行整包构建。
5. [已执行] 原子真实ops/旧双读及Oracle纠正新断言通过；未知entry仍拒零写，原红保留。
6. [已执行] 五缺陷新源具体AUTO转绿；真实组件7/7、根上层自有5/5（3当前+2旧函数反证）；StrictMode双effect/GUI仍未验。
7. [已执行] 标准F5全表/真实settings出站日志/字节/共享、多revision/软删恢复、新进程、两事务故障、旧7表和历史tag core只读评估已跑；GUI JSON-only两接缝红单列。
8. [已执行] 按核定B6旧rv2拒零写/当前rv3真命令保存/源rv4后固定，历史excerpts合法对照通过。
9. [已完成角色交付] 末轮fiKpOr F3/F4/F5标准包、ids/expected、GUI逐ID采证单及Oracle纠正回执已交。
10. [已完成角色交付] 末轮source复制相等、运行前后/审计相关源无漂移；正式角色报告+23ID原断言映射已交，整体未PASS，仍两恢复红与GUI未验。

## 当前须区分的合同

- RA-R01/J04的旧rv2selected期望已核为原计划单方追加；有效B6合同只冻结当时current、拒stale不抓新，历史excerpts另路合法。见自有oracle-correction回执，原红保留为ORACLE_CONFLICT，不修产品绕守卫。
- RA-M03原计划重复restore成功幂等未找到有效旧规范授权；只要求首次软删可恢复/保史、重复active与unknown错误零写，不把单方追加当产品缺陷。
- RA-F08备份不含宿主 sessions/checks：以当前 BACKUP_TABLES/EXTRA_BACKUP_TABLES真源为准，不能要求未列宿主表恢复。
- RA-F05 GC以 file_assets 元数据为引用源，断最后任务不自动删元数据；真实孤儿字节通过生产 storeAssetBuffer 在 tmp 建立。将分别说明，不强把 task 无引用等于 GC 可删。
- task/material/file接缝已按Main冻结重新全域认领，末轮相关源无漂移；之后变更须再核具体依赖，不借旧A0/本轮PASS签未来候选。

## 命令与交付

环境 macOS，nvm Node 22，pnpm 11.28.5 既有依赖只读。

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/materials-files-reports-independent-auto-20261021-run.mjs
```

run 保存每子命令 argv/cwd/开始结束/exit/stdout/stderr、生产源码与隔离输出 sha256。worker每负例保存 DB/字节前后 manifest 与实际错误。新进程读回独立 PID。证据逐轮独立目录，失败不覆盖；Main依据最终报告复验缺陷与 GUI，而非本专家启动服务。
