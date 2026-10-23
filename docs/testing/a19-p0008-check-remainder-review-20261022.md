# A19 P0008 交付检查余件有限独立审证

> 2026-10-22，平台 trae，独立 GUI/业务证据审证专家，非开发、非 GUI 执行端。本文只审 RA-P0008 的 task 单项入口、叙事非材料、wrapped 先映射三个余件；不重做 A18 已签五规则 25 步，不修改产品、原证或其他 testing 产物。

## 1. 限定结论

**RA-P0008 三个指定余件有限 PASS，可以关闭台账中的“task 单项入口、叙事非材料、wrapped 先映射”。**

| 余件 | 判定 | 有限范围 |
| --- | --- | --- |
| task 单项入口 | **PASS** | `/pm check t-0012` 精确命中 1 条 `done-open-checklist`；原任务为 done、清单 2/5，检查业务零写 |
| 叙事非材料 | **PASS** | t-0013 有 2 条真实 `progressLog`，但 attachments 空、checklist/evidenceUrl/deliverableId 均无材料；`/pm check t-0013` 仍精确命中 1 条 `done-missing-materials`；真实卡打开同一任务后取消，业务零写 |
| wrapped 先映射 | **PASS** | t-0014 为 wrapped、progress=100、dueDate=2026-10-21（相对 2026-10-22 已过期）；`/pm check t-0014` 未命中规则，项目检查卡也不列 t-0014 |

本结论继承 [A18 五规则 25 步有限 PASS](a18-check-five-gui-review-20261022.md)，未重跑、未重采、未重新签署那 25 步。关闭的是 [余项台账 RA-P0008 行](remaining-acceptance-delta-20261022-ledger.md)明确列出的三个余件，不是整个 RA-P0008、整个 P0008、全部阈值/失败矩阵、视口/主题/缩放/读屏、人 final、整包、提交、发布或全矩阵 PASS。

## 2. 原始失败保留

以下原件不洗绿，也不计入三个余件的成功分母：

| 原件 | 判定 | 处置 |
| --- | --- | --- |
| `command-1792636293343` 顶层 `progressLog` | **FAIL_RETAINED** | 产品明确返回“不支持的字段”，请求/run/done 链完整且业务零写。随后使用合法 `draft.progressLog` 建种子，不把本次非法命令改称成功 |
| `command-1792642107802` 中断恢复 | **BLOCKED_RETAINED** | 执行端报 `Error: owned composer missing`，只有 before，无请求、run/done 和 after。随后另一次合法命令成功，不覆盖本次失败 |

这两项分别证明非法输入被拒和一次采集设施中断；它们不是本报告的产品新增 FAIL，也不因后续成功而从原档案消失。

## 3. 候选与运行绑定

| 身份项 | 独立核对 |
| --- | --- |
| 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` |
| A18 candidate | SHA256 `2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9` |
| 冻结树 | `/private/tmp/pmtool-a18-closure-20261022` |
| 声明输入 | 520 个 source、453 个 artifact，逐文件实读哈希一致 |
| tracked patch | 与 candidate 声明 SHA 一致 |
| 隔离宿主 | `127.0.0.1:3248`，归档 PID 63429，插件指向 A18 冻结树 |
| 完整装载 | target/frame `BA817F66FCE81BD58357C4B50BFFDF2C`，timeOrigin `1792629512672.7` |
| 下发响应 | 2584301 bytes，SHA256 `b4a54301e085753ab4193ae1284156ac779064ec097d7e775970a3d6a9e9f708`，非缓存，client 片段唯一完整 |

本报告审的是 A18 候选在 3248 的原始执行证据。目录位于 `A19/check-remainder` 只是收件批次，不把它改成 A19 产品候选，也不用当前 Main 源码替代冻结字节。

## 4. 原证完整性

[原索引](../../reports/all-pending-evidence-20261021/A19/check-remainder/index.json)列出 1107 件；目录另有 index 本身，所以磁盘总文件数为 1108。逐件 bytes/SHA256、目录集合均一致，无缺件、额外未列文件或哈希漂移。

- 15 个 step 目录均保留；有 actual 的 step 全部绑定 `http://127.0.0.1:3248` 和同一 timeOrigin。
- 10 组真实 `/api/commands/execute` POST → user `command/run` → 同 commandId `command/done` 完整：9 次 success，1 次顶层 `progressLog` error。
- 所有 raw 记录文件字节哈希均与对应 step 的 after-root `/pmtool/<table>/<id>.json` 一致。
- 所有原 compositor 帧均逐 SHA 核对；完整数量与结果见 [result](a19-p0008-check-remainder-review-20261022-result.json)。完整哈希核验不等于逐帧目视。
- 独立目视了 `task-nav`、t-0013 检查卡打开、取消后卡片、恢复后命令画面；GUI 目视仅支持本文所述卡片和打开/取消切片。

## 5. 三个余件证据

### 5.1 task 单项入口

`command-1792636226258` 的真实请求为 `/pm check t-0012`。返回“命中 1 条提示”，JSON 仅有：

- rule=`done-open-checklist`
- taskId=`t-0012`
- 状态 done
- 清单 5 项，其中 2 true、3 false

before/after 四根除允许过滤的 session cache 外业务零差异，未改状态、进度、清单或材料。本项只签 task 单项命令入口；A18 已签的项目五规则卡与逐 ID 往返不重复计算。

### 5.2 叙事不冒充材料

t-0013 最终 raw 有两个稳定进展项 `pl-1`、`pl-2`，各自含一版真实叙事“已经写完说明，仍需材料复核。”；两项由合法 `draft.progressLog` 与后续 `draft.progressOps.add` 分别写入，不是审证者手改 JSON。

最终材料边界：

- attachments=`[]`
- checklist 不存在
- evidenceUrl 不存在
- deliverableId 不存在
- status=`done`

`command-1792642202499` 的 `/pm check t-0013` 仍只返回一条 `done-missing-materials`。`task-nav-1792636670129` 的真实检查卡显示同一 t-0013；`check-open-1792636703785` 打开同标题 done 任务并显示进展叙事；`cancel-1792636741031` 关闭表单后卡片仍在。导航、打开、取消和最终 check 均业务零写。

### 5.3 wrapped 不催办

t-0014 由真实命令创建，原 raw 为：

- status=`wrapped`
- progress=`100`
- startDate=`2026-10-20`
- dueDate=`2026-10-21`

`command-1792636606176` 的 `/pm check t-0014` 返回“未命中任何规则提示”，且业务零写。项目任务表显示“已收尾 1”和 t-0014 行，但 6 条检查提示中没有 `t-0014 · QA 检查 已收尾不催办`。本项只签 check 消费点，不扩大为 stats/queue/people/board/reflect 等 wrapped 全消费点。

## 6. 审计与停止

自有 [审计脚本](a19-p0008-check-remainder-review-20261022-audit.mjs)不导入产品，只用 Node 内置 fs/crypto/path 读取归档。初次 audit 因帧 manifest 包装结构解析中止，未生成业务结论；第二次仅因中断目录“有 before、无 after”的断言过严记 14/15，修正为保留原事实后终轮 **15/15**。这些是自有审计脚本问题，不是产品或原证 FAIL。

运行环境：macOS/darwin arm64，Node v22.23.3。实际命令：

```sh
node --check docs/testing/a19-p0008-check-remainder-review-20261022-audit.mjs
node docs/testing/a19-p0008-check-remainder-review-20261022-audit.mjs capture
node docs/testing/a19-p0008-check-remainder-review-20261022-audit.mjs audit
git diff --check -- 'docs/testing/a19-p0008-check-remainder-review-20261022*'
node docs/testing/a19-p0008-check-remainder-review-20261022-audit.mjs seal
```

未运行产品、build、install、verify、GUI、浏览器或服务；未访问 credentials；未修改原证、产品、其他 testing、livingdocs 或活数据；未 commit/push。封存保护 A19 原证、A18 声明 source/artifact、候选和运行绑定共 2094 条路径。最终 [seal](a19-p0008-check-remainder-review-20261022-seal.json)记录零漂移、产物格式与资源释放；各产物 SHA 另见同前缀 hashes 文件。

本批审证到此 STOP：无子进程、浏览器、服务、端口、profile、业务根或凭据占用，不再执行产品或 GUI 动作。
