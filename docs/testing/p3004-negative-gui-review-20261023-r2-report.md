# P3004 原 missing/B 失败表单保稿独立 GUI 审证 R2

> 2026-10-23，平台 trae，独立 GUI 审证专家；非开发、非 GUI/桌面执行端。仅审 P3004NegativeGuiR1 冻结负例包，不签全 P3004、新 source、父提交或发布门。

## 1. 有限裁决

**原 RA-P3004 missing/B 真实表单关系失败、同一草稿五字段保留及连续零业务写：有限 GUI PASS；本子单 `remaining=[]`。** 关闭的是 [原范围裁定 §6](p3004-original-scope-resolution-20261023-r1-report.md#6-原用例最小澄清) 指定的可达负例补证，不是把旧未采证时点改成 PASS。

| 原断言 | 本轮结果 | 精确范围 |
| --- | --- | --- |
| E 本项目 OKR 空、H 合法未关联、missing 不存在、B 目标真实存在且异项目 | PASS | 真实 snapshot RPC、封存业务原件与实际编辑文本回退相符 |
| missing 真实保存遇存在性拒绝，原表单未关、精确 ID 和未提交文字保留 | 有限 GUI PASS | 关系拒绝原因可见；错误摘要右端 ID 尾部被抽屉遮挡，详见 §5 |
| 同一未关草稿仅替换关联为 B，真实保存遇归属拒绝并保留五字段 | 有限 GUI PASS | B 错误原因完整可见；不是 missing 错误替代归属错误 |
| 两次失败、结束取消与只读回读连续零业务写 | PASS | 11 状态/44 根项相同、418 份业务 raw 实核；不称全盘零写 |

没有按本子单发现需修产品缺陷或继续 BLOCKED 的原 missing/B 保稿断言；没有豁免任何原断言。原正例、人 final、集合及 F7 不重验、不重签。

## 2. 父原句、权限与停止条件

负责人父 goal 原句：

> 按已批准盘点和EGO/OIL分工，持续收口pm-tool所有已实现未验完功能：独立专家计划/审证、Main真实GUI/桌面采证、修确证缺陷、完整回归，所有适用验收完成后提交全部本批代码与文档；不新增暂停功能，不推送/发布或切正式服务，必要本人协作项诚实保留。

本显式子单只审 `reports/all-pending-evidence-20261021/P3004NegativeGuiR1` 全 893 索引件，按原范围裁定 §6；参考 [07:13 接续](../plans/2026-10-23-0713-continuation.md)。产品源码只读本包 `frozen-source`。唯一新写本 `p3004-negative-gui-review-20261023-r2*` 前缀和自有 `/tmp` reader；未改产品/测试/plans/livingdocs/旧 testing/封件，未读 private/runtime/凭据，未运行产品、GUI、build、install、服务或 Git，未执行 Main 脚本、未 spawn。

该明确范围替代本角色通用 fetch/pull/build/档案/commit SOP，不把父普通提交授权下放给审证角色。审结通知 Main 精确门边界后释放 STOP，只结束本角色，父持续任务仍 active。依据 [协作 §9 与 §11](../collaboration.md#九独立测试门控adl-0452026-10-12-起长期硬规则) 分离采证与判定、按原合同审，不新增反馈矩阵、取消/busy/成功保存/全视口或 F7 新门。

## 3. 物理封件与候选绑定

独立 reader 一次必要审计实核：

- [index-r1](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/index-r1.json) 893 项全部存在、regular file、大小/SHA 相同，共 24,242,264 字节，无缺件、多余成员、软链或差异。物理文件 896：另 3 件是 index 本身、`seal-r1.json`、`seal-outer-receipt.json`，分别指纹登记，不冒索引缺失。全部 16 PNG/182 JPEG 实核 SHA，不声称逐图目视。
- index SHA `e057e74a0bca3f52951bea241b962c862d3073627105c32b3111dbd3116932c9` 与原 seal 相同。round20–25 六真实外层收据均 exit0/null signal/空 stderr；activation 收据与封包 spawnSync 收据亦实收 0。原封包工具更外层终码未独立取得，**不补造**；这些执行码不是 GUI 判定。
- 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，六修候选 version `0.7.4`、124 变更声明/525 完整输入声明相符。本包 7 份冻结源码全部实际 bytes/SHA 对 525 输入同，其中 panel/listbox 对变更声明同。**其余 518 份实际源码不在本包，未读取私有冻结，也不声称独立实核全 525。**
- [浏览器激活绑定](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/activation-binding-r2.json) 的 `browser-script-3.js` 实物 SHA `b01f629fe3d174c75a0ddd2e923ba1cb973eeae5baaec6ae77c7b91070290de2`；偏移 875361 唯一的 1,720,305 字节插件段 SHA `2879edeee5c231abba7bf50a900d8ff395fdd7eb024f27c67c1b06b4b77f577a`。独立拼回原 34 字节 sourceMappingURL 尾后，1,720,339 字节 SHA `ba7e013dfc9094dea4646e36e8f193399861bb02bffa4dbc888c9cb7c0e3aa31` 与 built manifest、activation、host-start 三处同。
- host-start 候选/source 指纹同本包；原 PID9103/port3268/process/cwd/profileLink 收据与本包各 UI 的 `origin3268` 相合，`DSH_PM_E2E=0`。本角色没有探活或接浏览器；仅审封存实例，不动现服务。

封存 `habit-form` SHA `ade148c9d79954f0659d2cfde200e22b85d365fc12df4a257b1efe3bf57a3e29`、`panel` SHA `341675c4dd31b87d05264de520a4c198edbb3c3476f2f87d8f38cc80ba1d83d6`、`listbox` SHA `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2`。本轮结论不冒 Main 正在修改的 listbox/test 新源码或下一实例 GUI。全部细核见 [audit](p3004-negative-gui-review-20261023-r2-audit.json)；同目录 Main 脚本只作为封存文本读取与哈希，未执行。

## 4. 真实夹具、提交与零写

真实 `/pm web snapshot` 请求/响应由原 round21/25 events 按 rpcId 与 command JSON 对齐，再解析原成功响应 text，不只信 fixture-identity 或摘要：

- E=`p-0003 / QA-E-habit-negative-20261023`；H=`habit-mvk5br0w-ff4ta7` 属 E，已存 title/goal/frequency/notes 为“负例夹具习惯H / 已存目标原文 / 每天 / 已存备注原文”，无 okrId，status=draft、checkIns=[]、streak 三项 0。E 的 OKR 集合实际为空。
- B=`okr-mvk2mw6p-xiusuv` 在准备前、准备后均存在且 projectId=`p-0002`；missing=`okr-not-found-20261023` 实际不在该实例集合。round23 编辑 H 实际出现 `input#gf-habit-okr`，非菜单搜索伪回退。
- 正常准备两真实写：project add RPC `5a2457d4-e959-42a1-88fd-fe153061fe3a`、habit add RPC `379d25cc-26f5-4a9b-aa7a-412f063f1a90` 均 kind=success。准备前后根差仅新增 E/H 两文件，旧根零改删；**准备写与失败零写分开记账，负例基线从准备完成后起。**

两次真实保存由封存 round24 源件的 `.gf-actions .gf-btn--primary` click、真实请求/响应 events、原帧和表单状态相互印证。不是宿主 composer 两命令、重开表单或 title 校验冒关系错误：

| 原保存 | 实际 RPC / commandId | 业务返回 |
| --- | --- | --- |
| missing | `efd4bf21-d77c-4f33-bedd-9abd4fd5bbbe` / `cmd-06ee808a-28` | `kind=error`，`未找到关联目标：okr-not-found-20261023` |
| B | `9d276e12-f2c3-47eb-92e9-4d53cf9fa6ec` / `cmd-06ee808a-29` | `kind=error`，`关联目标不属于指定项目` |

HTTP200 与传输 `ok=true` 不是业务成功。原 events 恰 request→response→request→response，payload 同 H 的 habit update，五可编辑字段全部合法。未提交 title/goal/frequency/notes 实际为“保稿H未提交文字20261023 / 未提交目标原文20261023 / 工作日 / 未提交备注原文20261023”；第二次仅将 okrId 从 missing 改为 B。两次前后五字段 exact equality、disabled=false，同 `timeOrigin`、同编辑抽屉，原帧亦保连续草稿；没有回退成已存文字或关闭后重新预填。

按原 11 状态独立重算 44 根项连续差异均 `[]`。每状态有 38 份封存业务 raw，共 418 份，逐 bytes/SHA 对 roots 同；H 的 version=2 envelope **实际解包 record**，全字段对准备后 H 同，含稳定 ID/projectId、无可选关联、status/checkIns/streak、createdAt/updatedAt 及全部文字。准备后与 final 真实 snapshot 的 18 个顶层字段全同，原 A/B 目标、原 habit、任务、反思、附件等保全。原 files/backups 六根项沿连续指纹同，包未附这些六项的 raw，不谎称另实读附件/备份内容；原包之外根与日志不是本结论。

## 5. 原图独立目视与遮挡边界

本角色实际通过 `view_image(detail=original)` 打开 **6 张原 PNG + 3 张原 JPEG**，没有生成、裁剪、替换或重新采图：

| 原图/帧 | 独立观察 |
| --- | --- |
| [round23 原 H 编辑](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/round23-original-H-edit-text-fallback.png) | E 页、编辑抽屉、H 已存四字段、关联为空的文本入口 |
| [missing 保存前](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/round24-missing-before-save.png) / [拒绝后](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/round24-missing-after-rejection.png) | 五字段完整可读、前后草稿同、抽屉未关；“执行失败：未找到关联目标”实际可见 |
| [B 保存前](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/round24-cross-before-save.png) / [拒绝后](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/round24-cross-after-rejection.png) | 前图仍有 missing 错误、关联已改 B；后图换为完整归属拒绝、同稿仍开 |
| [round24-30](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/frames/round24-30.jpg)、[34](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/frames/round24-34.jpg)、[37](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/frames/round24-37.jpg) | missing 拒绝后→只换 B→B 拒绝后三个连续节点，与 RPC 顺序相合；不冒逐帧播放全部 182 帧 |
| [round25 正常取消后](../../reports/all-pending-evidence-20261021/P3004NegativeGuiR1/round25-after-normal-habit-cancel.png) | 抽屉已关，H 列表仍原已存文字、原状态/连续段，B 错误卡留存；只作为原结束观察，不另立取消门 |

missing summary CSS x=572、right=912.4375，抽屉从 x=880 起，**错误摘要 ID 右端被覆盖**；原 PNG/帧也确实如此，不能把 DOM 的全文当全部文字无遮挡。原拒绝原因“未找到关联目标”可读，精确 missing ID 同时在表单中完整可读、请求/响应全文相同；原 §6 的关系错误、精确输入保留、零写三个断言均已足证。B 原因 right=792.3203125，实际完整可见。故有限关闭本原负例，不签完整错误摘要/全反馈可读性，不自新增反馈矩阵、新门或要求重做足证；这不是所有者豁免。

## 6. 精确 remaining 与交回 Main

**本子单剩余 0：原 missing/B 真实失败保稿及连续零写关闭。** 原 [P2/习惯 R1 §4.3/§7](p2-okr-habit-remaining-gui-review-20261023-r1-report.md#43-p3004-合法更换非法命令与原未证边界) 的第二同项目目标、原命令拒绝/集合范围保留，不覆盖旧报告；原范围裁定 R1 的“当时未采 GUI”仍是历史事实。

不扩全 RA-P3004、人 final/其他正例、已关联 F5 富历史失败、F7/RA-P3003 收起→刷新/重进及非空历史保全，不关闭 F02 或其他 P0–P3/OP/B8/本人协作门。H 是新合法未关联空史负例夹具，不得冒 F7 非空史。**父剩余及原必要本人协作清单不在本子单重算，沿原合同/对应专家；全 P3004/父 ordinarycommit 仍未由本件签。**

Main 可引用本 report/audit/receipt/seal 定向消除原缺口，无须重做本包两保存或已足证正例。本件只绑定六修 124/525 原 candidate/3268 字节；Main 后继 listbox/test 变更、新 frozen/build/host 的受影响门须按既有合同审，不能冒本 GUI 为新 source 实测。本轮不新增补采计划、不写 livingdocs，不停 PID9103/正式服务，不承担 Main 操作。

## 7. 实际命令与收尾

运行环境 macOS/darwin、现有 bash、Node `v22.23.3` 绝对路径；pnpm 未调用。reader 仅 fs/path/crypto/assert，无产品 import、网络、child_process 或 spawn。实际执行 audit exit0、Node syntax check exit0、reader 指纹回核打印 OK/exit0；完整真实命令、工具可见输出与未取得的终态分层见 [receipt](p3004-negative-gui-review-20261023-r2-receipt.json)。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/p3004-negative-gui-review-20261023-r2-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p3004-negative-gui-review-20261023-r2-reader.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p3004-negative-gui-review-20261023-r2-reader.mjs seal
```

最后 seal 回读原包全员指纹、7 个明确合同/接续输入指纹、reader 指纹、本 report 本地链接/尾空白，绑定 report/audit/receipt。实际完成终码见本轮 seal 命令收据；不以 seal 自报 exit0 冒工具外层终态。设施 `login=false` 参数不支持，初始并行读未执行，随后默认 shell 成功；指定 memory 文件不存在 exit1，以仓库为准。这些非产品 FAIL，不影响原证。

**本角色审结，资源释放 / STOP。** 不占产品源码/builder/GUI/桌面/端口/profile/业务根锁，不提交、不推送/发布或切正式服务；Main 按父目标继续其他原门。
