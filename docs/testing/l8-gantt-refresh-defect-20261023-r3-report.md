# L8 甘特刷新原证独立裁定 R3

> 2026-10-23，平台 trae；独立 GUI 原证与最小缺陷合同专家，非开发、产品执行或 GUI 执行端。原证为 Main 已封包，本角色仅读字节/JSON/源码文本及实际图片。读证 audit-r2 截点和执行 PID 见本前缀真实收据。

## 1. 有限裁定

**FAIL：原 L8 `wrapped` 被甘特状态文案映射为“待办”，是确定的只读显示遗漏，不再只是根因未明的 stale/BLOCKED 疑点。** 实际刷新成功返回 wrapped，随后同一行完整原 DOM 文本仍是待办；两份封件源码都遗漏 wrapped，能直接解释现象。现有证据不支持为此改刷新、缓存、状态写入或聚合算法。

**限签：这不是“状态字形已完整目视”的 GUI PASS/FAIL。** 已实际查看的 PNG/末帧中，L8 标题、客观100、清单1/1及“未排期”可见，但副行状态尾部是省略号；任务页 L8 还位于视口外。对应字形曝光仍 **BLOCKED（原件未曝光，不是用户协作豁免）**。L8 无 startDate，真实条体不存在；排期条 wrapped aria 的运行/GUI 验证 **NOT_RUN**，只有同源分支遗漏的静态缺陷定位，必须按先行合同由 Main 后继执行。

只裁 L8 语义，不签全 OP、B8、父 ordinarycommit 或发布。保留原 gantt outer=1；不据此把整 OP 泛化为 FAIL，也不因其他门绿而抹除这个确定缺陷。

## 2. 本单与权限

负责人本轮原句（授权和停止条件）：

> 父原授权所有已实现未验独立收口到本批ordinarycommit，Main唯一builder/GUI/桌面；无新功能/push/release/正式切。你是独立GUI原证及最小缺陷合同专家，非开发/产品执行/GUI执行，唯一新增 docs/testing/l8-gantt-refresh-defect-20261023-r3* 和自有/tmp内置reader/outer，其余只读。明确本限单替代通用fetch/install/build/livingdocs/git。

> 不执行任何封件脚本/helper/产品、browser/runtime/private/网络/端口/git，仅自有reader读封包字节哈希、view_image实看PNG/帧、独立配对snapshot真实请求返回/rows及原task记录。

> 只给最小原修复/先行测试计划用例（五状态显示，左列与排期条aria统一，wrapped非done，旧四态/进度/聚合/日期写不改）……不新增设计矩阵/用例范围。审原当前包未排期L8并诚实限签，排期条需要测试/后继合法GUI由Main执行。只裁该L8语义，不签全OP/B8/父commit。真实seal/readback收据落盘后STOP/released，保原失败，不迫Main重当前有效完整回归，产品修后才须受影响全回归。继续期间Main处理独立F1/FL/MAX准备，不阻父。

已先读 [AGENTS](../../AGENTS.md)、[collaboration §9/§11](../collaboration.md) 与 [原 R2 报告 §5](op-growth-remaining-gui-review-20261022-r2-report.md#5-原失败疑点与准确剩余)。本张限单替代上述通用 SOP 的 fetch/install/build/livingdocs/git 收尾，不把父 commit 授权移成本角色 Git 权限。

下文短文件名均属 `reports/all-pending-evidence-20261021/L8GanttRefreshR3/`。Main 说明、helper 和 outer 输出用于交叉定位，不代独立裁定；封件代码只作为文本读，未执行。

## 3. 候选与封包实核

| 对象 | 本专家核验 | 边界 |
| --- | --- | --- |
| [index-r1](../../reports/all-pending-evidence-20261021/L8GanttRefreshR3/index-r1.json) | **310/310** 原件大小/SHA 同；index 49567字节，SHA `e6053fd9f4d4978a874ed913a8ac2a1b914e84f4e3429917131cb5348ff20eda` | 不把件数当功能数 |
| 索引外原 seal 与真实 outer | seal=1087字节/SHA `aa74c2b73ec4b8bc265ffc7605025d5dd4aabd0572edb2c194e81462f40da4dd`；outer=903字节/SHA `0b42eedbdcb8e517ce98f14c319ad299878f917afbbcbb09eab30cc823565a7d` | 没有补改 Main index；与 index 共313个明列输入 |
| 原 host/source | CombinedSuccessor112R1；baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；3263/PID7387；client SHA `415e24f2fc660370256aa9a186f141aae24064a80cdcd2d6729b7ff28c9fe8d7` | 绑定来自封件 host-start/source-binding，不探活、不读取运行目录 |
| SOURCE/complete | source 对象112键；complete-inputs519键，清单74653字节/SHA `22869ac1590786c4359fda5953da83970dda23bf9a543c7902791bfe3cf019e8` | **只核清单本体/声明与封包身份；未再读冻结 private 输入519件，不新签来源门** |
| 原/当前甘特源码副本 | 两者各30901字节/SHA `838a43451e037fdff363ce73e00570512d785f09f45688bf17afdb08ebc730bf`，逐字节身份一致 | 当前副本也有同遗漏；不能借此声称另一个当前实例已做 GUI 实验 |
| 状态与复制字节 | 5个原状态各14个业务副本，2个当前状态各38副本；共146副本均与各 roots/index 大小/SHA 同 | files/backups由始末根清单比较，不声称读取它们的未封原文件字节 |
| 原 GUI 环境 | 3263，1440×718 CSS视口，outer1440×857，dpr2；深色图 | 不是沿用 R2 1440×900/dpr1；不签其他视口/主题/native |

source-binding 中旧114并行候选说明只是原身份背景；不触碰、不安装、不以当前主树新变化污染原112实验。

## 4. 独立请求/返回/行/任务配对

原对象固定：QA-OP/p-0001/t-0010/F2-L8/code6/parent=t-0001。五个原状态的任务文件均565字节，SHA `d75a85a53f07baed6da65baf511198723d23990f421251dc425aeffaac38e8b0`；`version:2` 包装内 `.record` 全程 wrapped、legacy progress0、dueDate2026-10-20、无startDate/完成日期、同一清单 UUID 1/1=true。

| 原证 | 实读结果 |
| --- | --- |
| `round01-original-pm.json`，00:50:15.710Z | 原 L8 行文本“已收尾 · 非正式完成”，对应 SELECT aria=`F2-L8 状态`、value=wrapped。原 bbox y1162.42超过718视口，**不是截图已看见该字形** |
| `round02-gantt-before-refresh.json`，00:50:32.189Z | 同 L8 SPAN 的 parent/grandparent 实为“客观100% · 清单1/1 · 覆盖1/1 · 待办 · 负责人未分配”，并标未排期；任务原件仍 wrapped |
| `round03-real-refresh-events.json` **rows[0]→rows[1]** | 请求00:51:00.599Z，method=`commands/execute`，line=`/pm web snapshot`；成功返回00:51:00.671Z，HTTP200且result.ok=true、kind=success |
| 真刷新身份 | rpcId=`e1abd34b-e767-47fe-811b-942bb128ffec`；commandId=`cmd-ddabf288-26`；请求agentId与原新增cache会话ID一致 |
| `round03-real-snapshot.json` | 解开真实成功返回的 JSON text，L8仍 wrapped；返回10个 tasks 逐对象与 round03 原任务 `.record` **10/10全字段相等**，不是只拿状态摘要或HTTP200 |
| `round03-gantt-after-refresh.json`，00:51:00.736Z | 在真实成功返回之后，同 L8 行完整原文本仍待办、未排期。原`l8`定位、父行、完整页面文本互相一致 |
| `round04-original-final.json`，00:51:15.652Z | 同样仍待办；原任务记录不变。随后真实返回当前3269，当前末态00:51:16.589Z |

本专家实际 `view_image` 看过4张PNG：01原任务页、02重进甘特、03刷新后、04原末态；2张jpg：entry-57、refresh-15。甘特图片中 L8 行/客观100/清单1/1/未排期实际可见，**状态尾部省略，未读到完整“待办”**；entry末帧也未露出任务页L8。其他PNG/帧只核SHA，不冒称逐帧全部目视。

这是 **真实页面原 DOM 文本 + 真实请求/返回/任务字节 + 对应页面图片** 支撑的显示语义 FAIL，不冒充完整状态字形目视验收；未排期行不充作排期条 aria 实测。

## 5. 根因与原失败保真

根因在 [原源码](../../reports/all-pending-evidence-20261021/L8GanttRefreshR3/original-gantt-source.tsx#L39-L43)：

- 第40-43行 `ganttStatusText` 仅识别 done/in_progress/blocked，否则待办，wrapped必落兜底。
- 第349-355行条体另有同样四态分支，aria使用这个 statusText；左列第472行调用上述 helper。这一重复映射也漏 wrapped。
- 第328/461行 done 判定只认 done。**这个判定应保留，不是把 wrapped OR 进 done 的理由。** 客观100来自原1/1清单，不证明 wrapped 被聚合算作正式完成。

刷新已返回合法 wrapped，任务页原记录/控件也消费wrapped；不再以“也许后端没改”维持无结论。本报告定位到显示映射即可，不对全部内部缓存/重渲染机制作无证排除。

| Main 原 outer | parent/child PID | 真实退出 |
| --- | --- | --- |
| entry | 35716/35717 | 0 |
| gantt | 35778/35779 | **1** |
| refresh | 35917/35918 | 0 |
| return | 35957/35958 | 0 |
| seal | 36037/36038 | 0 |

gantt的全 data deepEqual 原失败属实。独立 roots 比较显示：原28条→29条，唯一新增 `data/session_projcache/sessions/session-913d0bad-764f-43e1-a504-af441567b702.json`，4503字节，02/03 SHA `4df52ce3f1d227b266ef172596d004098e3784f22da9b6927aba996b1cc8cfba`；04末态同条 SHA变为`56e77196fa51ccad94e41e39750c4f26b81aea4df8ff22a81a0b437a129cc82b`。**保留新增/后续变动，不清洗退出1、不签全 data 零写。**

原业务/files/backups清单在01/02/03/04对原初态均零差异；业务副本字节与原R2末态同，说明该显示实验未改变业务。cache归宿主session域，不把它归因于 L8 状态落盘错误或要求删文件“修复”。

3269当前根初/末 **44/44** 大小/SHA相同；Main `return-protection` 还声明对P2final同。本角色只独立核封包内当前44始末相同，**没有另读P2final原根，不把Main声明升格成新的P2签字**。

## 6. 最小交接

开发只按 [先行测试合同](l8-gantt-refresh-defect-20261023-r3-test-plan.md) 修五态共享映射。保留旧四态、wrapped非done、进度/聚合/日期写语义；不用本单引入新设计矩阵或功能。

本轮没有产品变更，因此不要求 Main 重跑当前有效完整回归。产品修复后，Main 唯一 builder 做完整现有回归、专项及受影响 GUI，独立专家再审；原失败永久留证，未排期/未曝光的边界不自动转绿。Main继续独立F1/FL/MAX准备，本角色不占其资源、不裁父commit，不冒称父批次已可提交。

## 7. 自有验证与释放

仓库仅新增本前缀 report/test-plan/audit与收据/seal/readback。自有程序在 `/tmp/l8-gantt-refresh-defect-20261023-r3-reader.mjs`、`/tmp/l8-gantt-refresh-defect-20261023-r3-outer.mjs`。reader只用内置fs/path/crypto/util；outer只spawn这个自有reader，并记录真实PID、退出码及完整stdout/stderr。无产品或封件代码import/执行。

运行环境：macOS/darwin、bash、现有 Node v22.23.3；未调用nvm切换、pnpm、安装、产品build/test/verify。真实命令均在仓库根；完整输出和代码哈希见本前缀收据：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/l8-gantt-refresh-defect-20261023-r3-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/l8-gantt-refresh-defect-20261023-r3-outer.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/l8-gantt-refresh-defect-20261023-r3-outer.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/l8-gantt-refresh-defect-20261023-r3-outer.mjs capture-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/l8-gantt-refresh-defect-20261023-r3-reader.mjs summary
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/l8-gantt-refresh-defect-20261023-r3-outer.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/l8-gantt-refresh-defect-20261023-r3-outer.mjs readback
```

两次语法检查exit0；首轮capture真实 **exit1**：310件哈希均同，但自有reader误将`{version,record}`外包装当任务，导致10项配对失败。原audit和capture-receipt保留；仅纠正reader解`.record`并用结构比较，capture-r2真实 **exit0**：310件/146副本零差异，10任务配对全同，原cache差异原样保存。inspect/summary只读exit0；初次summary过长，后裁摘要，不改变原证或裁定。

seal/readback结论只以真实落盘 [seal](l8-gantt-refresh-defect-20261023-r3-seal.json)、[seal执行收据](l8-gantt-refresh-defect-20261023-r3-seal-receipt.json)、[readback](l8-gantt-refresh-defect-20261023-r3-readback.json)、[readback执行收据](l8-gantt-refresh-defect-20261023-r3-readback-receipt.json) 为准；不提前声称产品回归已运行。封印核313明列封包输入与本批产物；回读再核产物SHA/输入及真实seal退出0，成功才 released。

工具定位`rg`缺失exit127、首次本前缀`ls`未找到exit1，仅定位失败，非产品结果。本轮没有Git、浏览器/桌面操作、网络/端口、runtime/private目录、密钥/配置读写，无业务/上游/livingdocs改动；除自有reader外不执行封件脚本/helper/tests。

**产品回归与后继GUI NOT_RUN；L8语义FAIL保留。真实seal/readback成功后STOP/released，无在途产品/GUI进程或资源锁；不再开展额外用例或父批次签字。**
