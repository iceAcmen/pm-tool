# OP 独立自动化执行计划

> 给 Main 和接手测试专家使用。按既有 OP/RA-OP 合同执行有限 AUTO/领域集成，不修改原计划及他人报告。独立专家，2026-10-21。

- 对象：A3 `candidate.json` 的基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` + dirty 差异；实际插件产物以 A0 `all-built-files.json` 453 个文件指纹绑定。
- 最新依据：`remaining-objective-cases-20261021.md`、`objective-progress-acceptance.md`、总登记 F2、ADL-055、collaboration §9/11。
- 边界：只写本文同名前缀及自有 tmp。不 pull/install/build/服务/GUI/认证/正式资产/commit/push；不启动 U4，不实现产品。通用 SOP 的构建/档案同步由本轮明确分工替代。

## 执行步骤

1. 校验 A3 的 23 项声明、tracked patch 和 A0 453 个产物；保存输入（源码、脚本、声明、实际依赖）sha256/大小/mtime，复制到自有 tmp，现有依赖只读引用。
2. 以生产 `pmDomainSpec`、JSON backend 和真实领域动作独立构造 F2，保存真实生成 ID、清单 ID、合法性、标准备份与 expected。空数组仅通过生产预检后的标准恢复获得，绝不直接写正式库。
3. 原 ID 分组执行 schema、派生、异常纯函数、checklist 命令、幂等/并发/故障写、doctor、summary/stats/queue、report/diff、JSON 备份往返。每项存断言及实际值，不将作者脚本总数算成覆盖。
4. RA-OP01..06 自动子项：人工 30/0/清除与 objective 分离，wrapped 排除/重新纳入，工时/证据合法性边界，completedDate 流转，原始分数最后一次 round。
5. 审读后只运行已知 `verify-objective-progress.mjs`（纯函数）作辅助回归。额外脚本不自动发现/运行。
6. 保存所有测试进程完整 argv/cwd/隔离环境、stdout/stderr/exit、写根审计及前后输入指纹。有限 PASS/FAIL 逐 ID 签字；GUI 与 Main 宿主重启/full guard 保留缺口。
7. 交 Main 可直接恢复到新空隔离库的 F2 包、最小命令/按钮及 expected；不替 Main 操作其库或 GUI。

## 状态

- 已完成合同核对、A3 的23项声明/A0的453个产物认领和只读代码勘察。
- 已完成合法 F2、逐 ID 领域断言、真实 JSON publish EIO、summary/check、JSON备份往返和新Node进程读回；最终独立52子项PASS、3子项FAIL，1979输入/14依赖包前后指纹无变化。
- 已完成原57 ID + RA-OP01..06索引、五轮stdout/stderr/exit归档、写根审计和F2/按钮/expected交接，见 `objective-independent-auto-20261021.md`。三项缺陷交Main修复，非OP整门完成。
- GUI/真实宿主停起/Main full guard待Main；所有旧 NOT_RUN 及他人 testing/living docs 原样保留，未开始U4/新功能，无commit/push。
