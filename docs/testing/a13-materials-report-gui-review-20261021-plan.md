# A11 资料与固定汇报有界审证计划

> 给 Main、负责人及独立测试接续者使用：只审已经采集的 A11 材料修订与固定报告子范围。平台 trae，独立测试专家；任务日期 2026-10-21，实际执行 2026-10-22。此计划不是 PASS。

## 授权与停止边界

- 本次负责人原句：“独立限定A11资料/固定报告已采子范围审证，不产品/GUI/build/services/credentials/commit。仅写docs/testing/a13-materials-report-gui-review-20261021前缀。”
- 父目标原句见 `reports/all-pending-acceptance-execution-20261021.md` §1；goalcontinue 为继续既有全部收口，不扩成本专家产品、提交或 GUI 权限。Main 唯一 GUI/builder。
- 可写仅本前缀 Markdown、审计程序和自有 `-selftmp/`。不写 livingdocs、其他专家文档、业务数据；不 fetch/pull/install/build/verify、不启停服务、不读取凭据、不操作浏览器/桌面、不 commit/push。
- 读取 AGENTS、collaboration §9/11、remaining-journey RA-M01/03、RA-R01/03/05 与 RA-J04，以及原材料专家计划、报告、GUI 交接与 oracle-correction。
- 停止条件：输入/冻结源/产物漂移，候选归属不符，或原证无法支持结论。缺口列明，不假签完整 GUI。

## 对象与依据

- 只审 `reports/all-pending-evidence-20261021/A11/` 的 candidate、environment、patch、build、materials/seed、loaded-r2、progress-journey、fixed-report、report-freeze-reentry。
- 运行身份仅读已指定实例 `/private/tmp/pmtool-a11-materials-runtime-20261021/artifacts/start.json`，核 port3226/PID32661、插件/宿主归属。不读取活跃业务根/私有认证文件，不实时探测服务。
- 源/产物只读 A11 candidate 列出的 `/private/tmp/pmtool-all-closure-20261021` 文件；A12 独立输出树不混用。当前主树差异仅作失效范围提示。
- F5 原合法备份由 seed.boundary.file 指向，包含 F3 的复合材料：T=t-0001/p-0001，E1=pl-1 三版 active，E2=pl-2 两版 softdeleted，E3=pl-3 一版 active，以及 at-1..4。
- 已纠正合同：selectedRefs 只选当时 current；追加后为 rv4，旧 rv2 stale 拒绝正确。历史 excerpts 为另路，不沿 RA-J04 旧 rv2 oracle 新发缺陷。active 重复 restore 成功并非已生效要求。

## 子 ID 与验法

| 子 ID | 原 ID | 本轮审核范围 |
| --- | --- | --- |
| A13-M01-APPEND | RA-M01 / RA-J04 | 原 rv1..3 保全，单层 draft progressOps 单主保存追加 rv4；基本字段/link 备注未修改，不签原 M01 全步骤 |
| A13-M03-DELETE-RESTORE | RA-M03 / RA-J04 | 主保存 softdelete 与首次 restore、stable ID/全部四版保全，正常列表排除/历史回读；不签第二 restore/unknown 分支及软删时报告候选 |
| A13-R01-CURRENT-FREEZE | RA-R01 / RA-J04 | 实际周期 2026-10-19..22，当前 E1 rv4/E3 rv1 两三元组，preview 零写，主 save 原 rpt-0002/快照/作者日期正文一致 |
| A13-R03-SOURCE-APPEND | RA-R03 / RA-J04 | 正常主保存追加 rv5/修订作者改为测试甲，旧 rpt-0002 完整原文件保持；详情重入仍 rv4；不签 source 后续软删/export |
| A13-R05-PREVIEW-CANCEL | RA-R05 | 危险 protocol/script Markdown 预览不执行并 cancel，周期/source/frozen excerpts 只读；未保存恶意 MD、不签 export/覆盖/全部协议全集 |

独立依据为原 PNG/全部连续帧目视、原 command run/done、原 wrapper JSON、逐步 manifest；DOM/hash/HTTP只辅助，不以外层 exit0 或旧 AUTO 代 GUI。

## 步骤与状态

1. [已完成] 读取授权、协作规则、原余合同和 corrected oracle；识别 dirty 树及 A12 隔离边界。
2. [已完成] 1390 输入冻结；511 源/453 产物一致、原完整 uncached 片段唯一匹配；A12 主树差异单列。
3. [已完成] 三次主保存、固定生成和源追加原命令/回包/原 wrapper JSON 链吻合；draft/preview/cancel manifest 等值，旧报告完整字节不变。
4. [已完成] 15 张本地联系表覆盖三段 141 原帧及 13 状态图，均目视；关键原图另查看。预览末帧没有取消终态，取消仅支持 DATA 零写，不签完整取消 GUI。
5. [已完成] 有限报告与子 ID 结论落盘；final exit0、1390输入/511源/453产物零漂移、链接存在，九依赖一致。主树另有文件路由/上传客户端在途差异，与A12来源共五项单列；自有Swift退出，本角色释放，Main继续总收口。

## 明确未签范围

完整 RA-J04/材料/报告 GUI、session、export 与覆盖、invalid 及其他 ops、并发/失败重试、全矩阵/读屏等仍未闭，不改成 MANUAL_PENDING。本次不审 Main 新中文原生文件 `rawheaderinvalid`、不审真文件或 A12 来源跳转。

运行环境 macOS/bash、nvm Node22；项目约定 pnpm11.28.5（不运行 pnpm）。校验只使用 Node 标准库；联系表只用系统 Swift/AppKit 读取原图并写本前缀，不操作应用 UI。
