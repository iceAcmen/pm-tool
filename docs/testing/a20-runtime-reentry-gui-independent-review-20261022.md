# A20 运行时重进与 GUI 原始证据独立审查

> 2026-10-22，A20 独立运行时/GUI 审证专家。只读 Main 已采集原始证据，不开发、不启动服务或 GUI、不修改产品。本报告只裁决 RA-P0007 的分层关闭程度，不扩成 A20 总门、提交或发布结论。

## 1. 限定结论

| 层级 | 结论 | 独立判定 |
| --- | --- | --- |
| 业务持久化 | **PASS_LIMITED** | file-only、mixed、empty 三条新 reflection 已真实落盘；raw 内容、ID、SHA 与命令结果一致。旧 t-0003 与旧 reflection 哈希不变；运行时 `finals={}` 前后均为空，只证明 final 集合无漂移，不构成“非空既有 final”运行时正向覆盖 |
| 命令重读 | **PASS_LIMITED** | 真实宿主 `command/done` 可重读三条 reflection；file-only 重复 done/reflect 保持同 ID、同生成时刻和同 raw SHA。限定在本次三条任务与 `/pm reflect` |
| 重启重进 | **PASS_LIMITED** | 同一隔离根和候选重启后，三次 `/pm reflect` 均返回原 ID；三份 raw SHA 不变，业务根与附件字节根前后逐项一致。进程重启由 Main 摘要声明，原证未另附 PID/启动日志，故不扩称完整宿主恢复门 |
| GUI 输入执行 | **PASS_LIMITED** | 真实 host composer 发出的 `/api/commands/execute` 请求，与 `command/run`、成功 `command/done` 可逐条对应，覆盖新建、文件上传、链接、交付物、done、reflect。未覆盖输入法、键盘可达性或视觉回显 |
| GUI 结果正文可见 | **FAIL** | 四张指定截图逐张目视均只有 new-session shell 与 composer，无命令卡或结果正文；DOM 为 `commandCards=0`，file-only/mixed/empty 的 `visibleResult` 全为 `false` |
| RA-P0007 | **部分关闭，整体不得关闭** | 可关闭到“业务持久化、命令重读、重启重进、GUI 输入执行”的上述限定范围；“GUI 结果正文可见”仍为明确 FAIL，不能用 event 文本、raw JSON 或截图中的空壳洗绿 |

本报告没有发现业务文本、落盘 ID/SHA 或重进只读性方面的新 FAIL。`PASS_LIMITED` 只绑定第 2 节候选及本报告列出的原证；候选、冻结产物或证据字节漂移即失效。

## 2. 候选与运行实例绑定

- 基线提交：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`
- `candidate.json` SHA256：`1bc7b72472e24f5ab3b193c3da87a5d76a175e081191be55cc2c4b6b66de6995`
- `src/core/reflect.ts` SHA256：`3423fef5553c3314577698439022310e463ab28c2f42c7476f4886d101cf433b`
- `src/core/reflect-file-count.test.ts` SHA256：`059a67a3dbeda0ab72284564fc627b52b3ca57bb57e7f405d489b09c4f9da16a`
- 冻结插件链接：`/private/tmp/pmtool-a20-closure-20261022-r1/packages/dsh-pm-tool`
- 候选登记及冻结文件实测 `lib/core/reflect.js` SHA256：`6b53e4534de33f327978fcebe7886a1571febecf6945f2fac4910b53852703c5`
- 候选登记及实例摘要 `lib/client/index.js` SHA256：`dce0c2df8549058a2504012ce13d6b20e58036296f3b0f1818b7d4b774371a25`
- 隔离运行根与端口：`/private/tmp/pmtool-a20-runtime-20261022-r4`，`3254`

`r4-continuation-r2/summary.json` 与 `reentry-r1/summary.json` 均绑定上述 candidate SHA、pluginLink、lib reflect/client SHA。候选登记的 `sourceDrift=[]`、`protectedDrift=[]`、`dependencySourceDrift=[]`；本报告不以当前 dirty HEAD 代替该冻结候选。

## 3. 失败历史继承

| 批次 | 原结论 | 本次归因与保留方式 |
| --- | --- | --- |
| `r1` | `exit=1`，等待 15 秒超时 | 四条业务命令均有成功 `command/done`；采集器按旧 card selector 等待，但页面为 new-session shell，`commandCards=[]`、`resultCards=[]`。采集设施失败原样保留 |
| `r2` | `exit=1`，等待 15 秒超时 | 扩展 DOM 检查仍为 0 张命令卡、0 张结果卡；业务事件成功。证明不是可见结果成功，不转绿 |
| `r3` | `reflection missing for t-0004` | command 结果已返回含“1 个文件”的 reflection；后续直接在未解包存储信封上查业务字段，形成假缺失 |
| `r4` | `reflection missing after bounded wait` | file-only 权威业务前置已成功，ID 为 `ref-mvj42quw-uq3nhz`；采集器仍未解包 `{version,record}` |
| `r4-continuation` | 同上 | 空续跑没有新增 commands/requests，仍沿用错误读取设施；不作为业务反证 |

上述失败文件没有被删除、覆盖或改写。后续权威证据是 `r4/commands.json`、`r4/legacy-before.json`，以及 `r4-continuation-r2/` 和 `reentry-r1/` 全部文件；后续成功只修正采集判据，不洗掉旧失败。

## 4. 权威业务链审查

### 4.1 file-only

`r4/commands.json` 记录真实 composer 依次执行新建 t-0004、上传 `a20-file-only.md`、done、reflect。首次 reflect 返回：

```text
复盘 ID：ref-mvj42quw-uq3nhz
资料区已登记：1 个文件（质量由人复核）
```

`r4-continuation-r2/commands.json` 随后对同一任务重复 done 与 reflect；ID、生成时刻、正文均不变。落盘 raw SHA256 为 `5fc96618e0765a657762bea59e8f33ff4559b70320f5b27a25229f1dd79921ab`。

### 4.2 mixed 与 empty

- mixed t-0005 的 host 命令顺序精确为：新建 → file → link → deliverable → done → reflect。结果材料行精确为 `1 条链接、1 项交付物、1 个文件（质量由人复核）`，raw ID `ref-mvj47xmv-g7yufo`，SHA256 `8bc79ed6d3025f9e2686878ba04a6e8c290b36d78b03e52fb67cda5b3c3664ff`。
- empty t-0006 的 host 命令顺序为：新建 → done → reflect。结果没有虚构材料行，保留 gap `待补：交付验收材料与证据链接`，raw ID `ref-mvj47zlw-oqm01b`，SHA256 `2f3719c86ae972ae18069c9f53212043c3d09950d1f1f1fa094afa8f73c715c9`。

三个 raw 文件均为已解包后可核的 `{version:2, record:{...}}` 信封，正文与 `command/done` 一致。

### 4.3 旧记录与重启不变量

- `r4/legacy-before.json` 与 `r4-continuation-r2/legacy-before.json` 逐字节一致。
- t-0003 前后 SHA256 均为 `41761065799eb198e589f270f77a21a911c2bd474322e6aaa39945e836fb9e3b`。
- 旧 reflection `ref-mvi5z85j-yk04ji.json` 前后 SHA256 均为 `710d08dba2d29c586e554a3b4df671b8881b5bb5d329da17b47531dd3a4bb332`。
- `finals` 前后均为 `{}`。因此只能判“空集合未漂移”；非空 final 的不回写由既有 SOURCE/AUTO 证据覆盖，不冒充本轮真实运行时覆盖。
- `reentry-r1` 重启后重读三条 reflection，ID 与上述 raw 完全相同；`before.json` 与 `after.json` SHA256 同为 `c6f640fbd7e5cc32eaa41a1e2e8d1789f5481b0abe222f9f05bbf727d6b5736f`，其中全部 pmtool 记录和四个附件字节文件逐项零变化。

## 5. 截图与 DOM 目视

已用 `view_image` 逐张查看：

1. `r4-continuation-r2/file-only-reflect-repeat.png`
2. `r4-continuation-r2/mixed-reflect.png`
3. `r4-continuation-r2/empty-reflect.png`
4. `reentry-r1/reentry-host.png`

四图均为 1440×900、深色主题、真实 DSH 本地构建页面；侧栏、新会话 hero、workspace/model 控件及 composer 清楚可见，页面未见崩溃或空白。但四图中央均没有命令卡、结果卡或任何 reflection 正文。对应 DOM/摘要同样记录 `commandCards=0`，三个 requiredText 均未出现在 body，`visibleResult=false`。

因此：

- host 页面加载与 composer 存在：有证。
- 从 composer 发起命令并由宿主执行：有请求和事件证据，限定通过。
- 用户在 GUI 中看到命令结果正文：反证明确，判 **FAIL**，不是 `BLOCKED` 或 `NOT_AVAILABLE`。

## 6. 边界

- 未运行服务、GUI、测试或业务命令；只审查 Main 原始证据并逐张目视指定截图。
- 未修改产品、候选、原证或其他测试资产；仓库内只新增本报告。
- 不裁决页面样式、响应式、键盘旅程、附件内容质量、其他命令或其他宿主入口。
- 不签署 A20 总门，不提供 commit/push/tag/发布许可，不触及正式端口。
- RA-P0007 只有业务与输入执行层可按本报告限定关闭；可见结果正文层必须补出真实可见证据并由独立专家复审，或由有效需求明确该新会话壳不承担结果展示后重新定义验收合同。在此之前 RA-P0007 整体保持未关闭。
