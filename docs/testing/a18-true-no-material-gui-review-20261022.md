# A18 真无材料任务补证有限独立审证

> 2026-10-22，平台 trae，独立测试专家。供 Main 与项目所有者核对本次 t8 原始证据、有限审签和剩余边界；只读审证，不开发、不执行 GUI、不运行产品。本前缀报告、审计和封存文件为唯一写域。

## 1. 有限结论

**有限 PASS：新任务 t-0008 真无材料 done→新反思 gap→重复 done 后原反思字节幂等；该任务唯一 done-missing-materials 提示只读、真实卡可见、点击可达同目标抽屉、取消不改业务。** 这是两个已有用例的有限切片，不是完整 RA-P0007/0008、反思 UI 读取、五类 check、全矩阵、整包或发布 PASS。

依据 [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[原审证 §4](a18-integration-more-gui-review-20261022.md#4-p0-有限结果) 与 [remaining-governance RA-P0007/0008](remaining-governance-cases-20261021.md#2-p0上下文与即时复盘)。原 t3 的 file/at-1/fa-0001 仍在，不再把 t3 当空材料；**A18-IM-01 文件数量声明 FAIL 保留**，P20/A20 先行 RED/control 不重跑、不签修复。A19 habit 是另批，不纳本候选或冻结输入。

负责人持续“验已有、修确证、独立审证、最后统一普通 commit”不变。本专家不 commit/push，不更改 other testing/livingdocs，不取得 Main 源码、builder、GUI、端口或服务锁，不把本切片通过当最终提交/发布门。

## 2. 授权与身份

本次负责人原句保留：

> 独立真无材料补证审证，非开发GUI。只docs/testing/a18-true-no-material-gui-review-20261022*；禁产品/other testing/livingdocs/build/install/GUIservicecredentialcommit。用户持续验已有/修确证/独立最后commit。读AGENTS/collab、a18-integration-more-gui-review§4t3有file不能当empty、remainingP0007/8，reports/all-pending-evidence-20261021/A18/no-material/index482+observations+10steps/execution原command/userPOST/run-done/rawdiff/PNGframes。实际A18host3248/63429完整loadedtargetBA817/timeOrigin1792629512672.7/A18candidate/453source未变，Main生产新增t8 QA真无材料(不手写库)→done产生新ref/ref-mviugfb6-ybnnwx sourceEventtask-done draft含待补交付验收/证据gap、repeatdone再次reflect原draft字节不变→checkdone-missing-materials1→PMtask列表真实卡见1→点击实际checktarget同title抽屉→cancel。全部10exit0为采证非PASS。核真正tasksattachments/progress/dlv/checklist/evidence不存在或空/保普通字段，反思source/timestamp新不是旧fixture，只签no-materialgap/重复ref幂等/check这条只读与真实目标可达有限；未final无须造，不全checkfive/反思UI读取/新进程/全矩阵。P20file计数原红保不重复其测试，A19habit修另批。核482原件/frames独立目视PNGJPG/原datafilesbyte保，sameframe/backendfailure不扩，原需要角色不占GUI。Mainonlyfreeze/lib保护，不纳Mainsrc后续fix动态；报告bounded+保护release。

本明确限定覆盖通用 fetch/pull、install/build、全 verify、livingdocs 和提交流程；没有执行上述动作。工作树已有多人在途改动，不清理、不回退。审证只使用原归档 JSON/命令/图像和已声明隔离候选字节，不访问认证/profile/活服务。

| 身份字段 | 独立核对 |
| --- | --- |
| 被测基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，只是 dirty 候选基线 |
| 候选 | `A18/candidate.json`，隔离树 `/private/tmp/pmtool-a18-closure-20261022` |
| candidate SHA256 | `2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9` |
| tracked patch SHA256 | `1b2becbaa4c910d0d7052ec42127bd3856e57cf49d30c72ec4d3ad55a6921fd4`，原 patch 实读吻合 |
| 源码/产物 | 520 个 sourceHashes、453 个 artifacts 逐件吻合；不是用“453”代源码数 |
| client.js SHA256 | `9ab0c3e0d94751870a53507530d899d4a711bda4fbe5c2b474ebd66127cc06bb` |
| 宿主声明 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，插件基线不能代宿主 |
| 运行实证 | `A18/final/host-start.json`/`host-ready.json`，3248/PID63429，plugin 指向上述 A18，cwd 为上游；这是归档身份，不是本专家重新查服务存活 |
| 完整加载 | `A18/final/loaded/result.json`，target/frame=`BA817F66FCE81BD58357C4B50BFFDF2C`，origin=`http://127.0.0.1:3248`，timeOrigin=`1792629512672.7` |
| 完整响应 | combo 2584301 bytes，SHA `b4a54301e085753ab4193ae1284156ac779064ec097d7e775970a3d6a9e9f708`；归一化完整 client 段 1705469 bytes、offset875361、仅一次、非缓存；不能以 HTTP200 代 GUI |
| 步骤绑定 | 10 步 actual/host-state 均相同 origin/timeOrigin，与加载一致；逐步骤未另写 targetId，不捏造逐步独立 target 采样 |

no-material 采集脚本的 boundary 字面仍写 `actual A13`，是保留的旧标签；不能据此换回 A13 身份。实际 start、完整加载、origin/timeOrigin、A18 源码/产物共同绑定本轮 A18。归档执行器原 import 的辅助脚本不在本执行目录，**不声称该目录可脱离原环境直接重放**；本次没有重放，原请求/事件/落盘/图片均可独立审证。

## 3. 原件完整性与真执行

原根：[A18/no-material](../../reports/all-pending-evidence-20261021/A18/no-material/)。下文短路径均相对此根。

| 原件 | 结果 |
| --- | --- |
| index | 482/482 bytes/SHA 相同，无缺件、未列新增；index SHA `453f3595228bd8b2a77c65e1d22ce2fe74d7c881c4a635c25f4fd9c804652626` |
| observations | 10 步 exit/events/four-root diff 独立重算吻合；SHA `d7a88c88f4fc09fa5893e2093b0dbafb63926c2f59bca832b37edfd3bc64ace1` |
| 原帧 | 190 JPG 与 frames.json 全部指纹吻合、无漏列；全哈希校验不等逐帧目视 |
| 执行器 | `execution/pmtool-a18-no-material-20261022.mjs`：真实输入/Enter、等待 run/done、点击 `.pm-check-card .pm-check-item`、真实取消；seal 源脚本原样保留，未执行 |
| 命令链 | 6 次显式命令 + 1 次 PM 导航 snapshot，共 7 对 `/api/commands/execute` POST→user `command/run`→同 commandId `command/done`，时序/参数吻合 |
| 会话 | `session-04548dcf-b6ba-4259-a7ad-e7957eb0593f`，请求 submittedAttachments=[]；不借旧 A13 session 绑定 |
| raw | 每步各表 raw 字节哈希与本步 after-roots 对应键相同；不是只相信 observations 摘要 |

**10/10 exit0 是采集事实，不是十项产品 PASS。** 以下单步差异由 before/after 重算：

| 步骤 | 实际动作与有限差异 |
| --- | --- |
| `host-open-1792631351569` | 打开已有合法会话；四根本步零写 |
| `command-1792631369987` | `/pm task add` 只提交 projectId/title/startDate/dueDate；新增 t-0008，非手写库 |
| `command-1792631405292` | `/pm task update t-0008 {"status":"done"}`；只改 t8 + 新增反思 |
| `command-1792631409390` | `/pm reflect t-0008` 返回新草稿；四根本步零写 |
| `command-1792631412477` | 同一 done 再提交；只改 t8.updatedAt，反思不变 |
| `command-1792631415555` | 再 reflect，返回文字/JSON 与第一次相同；四根本步零写 |
| `command-1792631418625` | `/pm check p-0001` 唯一 done-missing-materials/t8；四根本步零写 |
| `pm-nav-1792631435831` | 进入 PM 全部任务、实际 snapshot；7 条本项目任务、1 条检查提示；四根本步零写 |
| `check-target-1792631481031` | 点击检查项，不是另点列表编辑；同 title/status/dates 的实际 TaskForm；四根本步零写 |
| `task-close-1792631498578` | 真实“取消”；抽屉关闭，检查卡仍在；四根本步零写 |

9 个相邻样本桥接中，**5 个仅同一 session_projcache 文件哈希变化**，4 个全零。保留五次变化及首末 hash，不声称全部 data 静止，不从缺缓存正文推断原因；桥接业务表/附件/备份/导出没有新增、删除或内容变化。

## 4. 真无材料与反思幂等

原新建 [t8 raw](../../reports/all-pending-evidence-20261021/A18/no-material/command-1792631369987/raw/tasks/t-0008.json) 为合法生产新记录：title=`QA 真无材料复盘`、project=`p-0001`、code=`5`、priority=`P1`、parentId=null、description/assignee 空、progress=0、milestoneId=null、start=`2026-10-22`、due=`2026-10-23`。**attachments、progressLog、checklist、deliverableId、evidenceUrl 原键不存在**；不是删除附件后伪造的空种子。全部后续 t8 raw 保持上述材料字段缺省，没有把普通 progress=0 或叙事当材料。项目已有交付物/全局 file_assets 不等 t8 已关联材料。

新建时间 `2026-10-22T01:09:31.815Z`；首次 done 只改 status/completedDate/updatedAt，普通字段不丢。completedDate=`2026-10-22`，updatedAt=`01:10:08.482Z`；progress 仍0，没有自动写100或清单。

首次 done 的 before 不含新反思，after 仅新增：

```json
{
  "id": "ref-mviugfb6-ybnnwx",
  "projectId": "p-0001",
  "taskId": "t-0008",
  "status": "draft",
  "sourceEvent": "task-done",
  "draft": {
    "at": "2026-10-22T01:10:08.514Z",
    "lines": [{"text": "完成时刻 2026-10-22", "mark": "known"}],
    "gaps": ["待补：交付验收材料与证据链接"]
  }
}
```

这是从 [新反思原 record](../../reports/all-pending-evidence-20261021/A18/no-material/command-1792631405292/raw/reflections/ref-mviugfb6-ybnnwx.json) 摘取字段，不是新增模型。createdAt/updatedAt/draft.at 均 `01:10:08.514Z`，处于本次对应 run/done 时间内，**不是旧 `ref-mvi5z85j-yk04ji` fixture**。只记录完成日期事实与留白，没有伪造验收证据、自动 final 或徽章。

反思原文件 **596 bytes / SHA `e74006988d2e110eb48b9b80fb11e6b77b1928c449472fb4d7dfebbf92d1ebb1`** 从首次 done 到末步所有副本相同。重复 done 仅 t8.updatedAt→`01:10:14.743Z`；新反思 ID/全文/时间不变、无第二反思，两次 reflect 返回文字与 raw JSON 一致。**PASS 只签反思幂等，不把重复 task update 说成整步零写。**

本批未 edit/final，不为凑测试制造 final；这不是本有限切片的额外前置。未签 best-effort 失败钩子、milestone/deliverable 事件或新进程回读。原其他任务的人 final 不代替本 t8 未执行分支。

## 5. 单条检查与真实目标

check 原 done JSON 只有 `rule=done-missing-materials/taskId=t-0008/title=QA 真无材料复盘`；理由准确指出 done 但证据/客观清单/交付物/资料缺省，含“未覆盖≠未完成、最终验收由人判断、只读不下完成裁决”。没有把缺材料裁成未完成，task 仍 done/progress0，反思仍 draft。

独立目视限审计 [visual 清单](a18-true-no-material-gui-review-20261022-audit.json) 的 **6 PNG + 3 JPG**：真实 add/done 输入、reflect 后空 hero、PM 检查卡、同标题 done 抽屉、取消后原卡；另核 compositor 点前/点后/取消后的三个原帧。检查卡“1条提示”与原 done/TaskForm/raw 对齐，真实点击链可达正确 t8，不靠同名推断。

导航后与取消后 PNG 本来同 hash，部分 JPG 也重复；保留，不把相同画面计作额外独立场景。抽屉打开前后帧和 actual/fields 支持本次往返；不把单张截图或 DOM 断言升级为整 GUI 矩阵。

宿主命令步骤仍 hero、command cards=[]，reflect 后 PNG 没有可见反思文字。**本报告只签原命令完成结果与落盘，不签“反思 UI 已读到草稿”**，不扩同 frame 或后台成功为宿主反馈失败/恢复覆盖。

| 原 ID | 本次签署 | 保留边界 |
| --- | --- | --- |
| RA-P0007 | **有限 PASS**：真正新空材料 done、新 task-done 草稿 gap、重复反思原字节幂等；原“t3代空材料”不再引用 | 完整 ID 未签；未执行本 t8 edit/final/新进程/反思可见 UI/失败钩子；file 数量原 FAIL 另批 |
| RA-P0008 | **有限 PASS**：仅该条 done-missing-materials 的命令/真实卡/同目标打开/取消/只读 | 原五类合法 fixture 和完整旅程门仍未全闭；不签其他四规则、task 单独 check、wrapped 全 consumer 或矩阵 |

## 6. 字节保护、自检与释放

自有 freeze/audit/seal 保护 **10139 文件**：482 原索引全件及 index、完整旧 integration-more 原件/原报告审计、A18 完整加载/宿主非密身份、A13/A14/A16/A18 隔离完整 src/lib 与声明输入。除 A18 被测身份外，其他候选只保护、不重新验收。原 t3/旧反思/其他 raw 字节不变。

本次 Main 原步骤的 files manifest 两个22-byte文件 SHA 全程分别保持 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`、`875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`；没有附件/备份/导出写。专家核的是归档 raw 实字节与原四根采样，不读取或冻结活跃库，不声称已重新下载文件或全盘零污染。

**不把 Main 工作树 src/scripts 后续 fixes、livingdocs、A19/A20 动态产物、共享依赖/缓存、活数据/profile/凭据纳入不可变锁。** 本报告的隔离候选与原件在终封前 bytes/SHA/mtime 无新增、删除、内容或mtime漂移。

审证环境 macOS darwin arm64、Node v22.23.3；未 install/build、产品 verify/test、GUI、服务操作。仓库根执行：

```sh
node --check docs/testing/a18-true-no-material-gui-review-20261022-audit.mjs
node docs/testing/a18-true-no-material-gui-review-20261022-audit.mjs freeze
node docs/testing/a18-true-no-material-gui-review-20261022-audit.mjs audit
git diff --check -- 'docs/testing/a18-true-no-material-gui-review-20261022*'
node docs/testing/a18-true-no-material-gui-review-20261022-audit.mjs seal
```

语法/freeze/diff-check 退出0。首轮 audit 退出1，32/34，误要求跨步骤 session cache 也零写；原结果保在 [audit-r1](a18-true-no-material-gui-review-20261022-audit-r1.json)。按原件更正为只允许该同会话缓存变化，完整 diff 未删，业务只读期待未放宽。终轮 audit **退出0、34/34 审计断言成立**，482文件/190帧/10步/7对事件/10139保护符合原件；不是产品34项 PASS。终 seal 退出0、保护无漂移、释放=true，报告/脚本/两轮audit/before指纹见 [seal](a18-true-no-material-gui-review-20261022-seal.json)。缺 rg 改用现有 find/grep，未安装工具。

**释放/STOP：本有限独立审证结束，不占 GUI、lib、服务或主源码资源；原件继续保留不可覆盖。** Main 在已有授权与各自独立门内继续已有剩余采证/确证修复，A19 habit、P20 file-count 和最终全量门各自审签，不自动继承本报告。没有发布/tag/push/正式切换，也没有专家 commit；最终统一普通 commit 仍由 Main 待总门满足后执行。
