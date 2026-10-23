# 固定汇报摘录导出 RED 计划

> 本文记录独立测试先行专家的有限计划，给 Main 与后续开发使用；只建立 MRR-R05-EXPORT-EXCERPTS 的必要 RED，不改业务、不执行 GUI、不签整域或 commit。2026-10-22，trae。

**目标**：把 RA-J04、RA-R03/R05 已批准的“导出与固定汇报正文/来源一致”转换为生产渲染器与真实命令处理器的回归断言。

**架构**：测试直接引用主树生产 TypeScript，真实 Context / Storage / JsonStorageBackend / DomainFacility 打开独立临时领域。生产 report generate 固定摘录，生产进展编辑/软删修改源，再执行既有 report export 并读真实文件。纯渲染补充精确字段、安全 AST 与旧记录兼容。预期来自合同与合法 fixture，不来自当前导出的 Markdown。

**技术栈**：macOS、现有 Node v22.23.3、Vitest 2.1.9；直接调用现有工具，pnpm 11.28.5 仅作项目环境说明，不调用安装或构建。

## 1. 授权与停止条件

负责人本次原句：

> “父任务已授权多角色、所有既有未验验完后的普通commit，持续授权确证缺陷修复；无push/tag/release/正式切换。”
> “你是独立测试先行专家，非开发、非GUI执行。”
> “你唯一源码写面 packages/dsh-pm-tool/src/core/report-export-excerpts.test.ts……唯一文档面 docs/testing/fixed-report-export-excerpt-red-20261022-r1*、自有reports/all-pending-evidence-20261021/ReportExportRedR1。”
> “不要build/install/noemit写共用lib……不fetch/pull/git写/停服务/触正式data/vendor/key。”
> “当前combined_repair_full_regression_review_r1仍在途勿重跑/重复派。”

按 AGENTS、collaboration §9、§11.1–11.5，本次明确动作/角色/写面优先于通用 fetch/build/livingdocs/提交动作。Main 是唯一整包 builder；新 r2 自动回归与 3260 GUI 在途不受本件接管。不读取密钥、不访问网络、不启动/停止服务、不加载 vendor skill、不修改他人 testing/docs 或原封包。内建 writing-plans 仅用于测试规划，通用实施/提交步骤不适用本角色。

源码目录已核存在；新增 test 单独认领，不并入原 107 声明冒作既有回归已覆盖。基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，父候选 107 增量以 CombinedRepairR1/r2 的 manifest、tracked diff、新文件清单为准。本件运行前后核对应生产输入及主树 lib 指纹；不冻结/锁住 Main。

## 2. 原合同与缺陷

- [有限 GUI 审证 §1/§3.3](material-meeting-report-gui-review-20261022-r1.md)：原 `57-fixed-export.md` 1415 byte，不含 rpt-0002 两冻结正文及 entry/revision 来源。
- [原 journey §2/§5](remaining-journey-cases-20261021.md)：RA-J04 导出正文/来源一致；RA-R03 源 edit/软删后旧摘录不跟随；RA-R04 manual/session；RA-R05 安全预览与固定导出。
- 原两条：`t-0001/pl-3/rv-1`，测试乙，2026-10-19，`E3 rv1同日异ID`；`t-0001/pl-1/rv-3`，测试甲，2026-10-21，`E1 rv3正文`。
- 仅测试既有固定报告 Markdown 出口。不因 RA-R05 表中 MD/web/plain 概括发明 report web/plain 命令或格式。
- selectedRefs 只选当时 current（有效 oracle 纠正），不要求生产接受历史 rv2。rv-3 通过真实两次 append edit 形成，之后才追加 rv-4/软删。

## 3. 步骤与预期

| 步骤 | 文件/动作 | 预期 |
| --- | --- | --- |
| 1 | 写本计划并核生产接口、依赖、父 107 manifest | 合法 seed 可由现有 API 重建；无业务编辑 |
| 2 | 新增唯一 test；写本前缀隔离配置、证据执行器 | 只读生产源码，所有 tmp/data/exports/cache 在自有证据根 |
| 3 | 控制组：真实生成两冻结条目→改两源作者/日期/正文→软删→raw 回读；来源、旧报告缺 excerpts/空 excerpts、overwrite/confirm/权限、路径拒绝 | 控制全绿；证明 fixture、出口和设施实际可用，报告 raw 全字节不变 |
| 4 | RED：直接 render 检查两条冻结字段；真实 export manual/session 在源变更后检查两条旧正文/来源；安全内容经实际出口仍保文字且不产生危险 AST 链接 | 当前应因丢弃 excerpts 而失败，不因导入、路径、schema 或新格式失败 |
| 5 | 保存完整 stdout/stderr/result、exit、缺字段列表、真实文件及 fixture；前后保护核对 | 每次原始失败保留，设施失败与产品 RED 分开 |
| 6 | 自有报告交 Main：有限 RED、最小生产修复面、复验建议与未覆盖边界 | 不开发、不自验修复、不判整域/commit；release STOP |

预计必要 RED 覆盖直接渲染、manual/session 命令以及安全复杂正文；最终精确用例数、错误与退出码以真实运行结果为准，不预填绿。

## 4. 复现命令

在仓库根、macOS 现有 Node 22 环境执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-excerpt-red-20261022-r1-run.mjs
```

执行器仅运行本 test，使用自有 `fixed-report-export-excerpt-red-20261022-r1-config.mjs`，关闭 coverage，单 fork/非并行，每次分配新的自有运行目录。命令逐次捕获子进程退出码与全量原始日志。RED 的实际 Vitest exit 应为 1；执行器验证证据/保护成功不代表产品 PASS。

## 5. 非目标与保护范围

不重跑 combined_repair_full_regression_review_r1、整包 verify/coverage/noEmit、旧 GUI 57–60，不操作任何宿主，不签 RA-J04/R05 整旅程。主树 lib 前后清单只是本次所观察保护，不等正式全盘零污染证明。正式 data、profile、vendor、key 不读取也不写入。控制/必要红及新增 test 指纹由本件单独归档；Main 后续独立开发与另一角色复验后才能判断受影响门。

## 6. 进度

- [x] 授权、目录、原合同与生产接缝已核。
- [x] 建立唯一测试与隔离执行设施；Domain.close 清理，缓存仅在自有根。
- [x] 控制组和必要 RED 实际执行并保存原证；最终 run-rtV1dy 为 7 绿/6 必要红，Vitest exit 1，首轮清理设施失败保留。
- [x] 保护核对、有限报告与 Main 交接；close exit 0，96声明原件匹配、源码/lib漂移0；详见同前缀report，不签整域/commit，release STOP。
