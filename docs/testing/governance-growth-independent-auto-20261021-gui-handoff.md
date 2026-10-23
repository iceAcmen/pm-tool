# 治理与成长 Main 最小 GUI 采证交件

> 独立测试专家，trae，2026-10-21。对应总 register 与 remaining-governance-cases 原 32 ID，不新增步骤门、设计或平台。本文件是采证步骤，不是执行记录。Main 是唯一 GUI、隔离宿主、共享构建执行端；本专家没有打开 GUI 或启动服务。

## 1. 先绑定候选

1. 使用本专家终态报告标明的第三轮 evidence。读 `candidate.json`、`copy-before.json`、`production-output.json`、`execution.json`；它们只绑定本专家自有 tsc 领域执行，不冒充 Main bundle 或宿主。
2. Main 的运行实例另记源码基线 + tracked diff + 新文件指纹、实际 bundle、隔离根、PID/端口、fixture hash、开关、浏览器与时间。若 Main 已修 GG-01..04，重验相关 AUTO，再提交该新候选 GUI 原证；旧失败不自动消失，旧 GUI 也不自动继承。
3. 仅使用 Main 已授权隔离数据根。F6 从 `F6-fixture.json` 找到标准 backup 与 hash，先生产 precheck 再明确 confirm restore；F5、F7 同理。不能为点页面把 refs 人工补到库中，也不能把测试任务 ID 写进正式库。
4. `ids.json` 是末态全 ID 字典，`F6-fixture.json.ids` 是 F6 导出时的初态字典，`F6-created-records.json` 有四类真实创建 ID。中文别名是键，不是示例 ID。F6 用 `A`、`来源任务一`、`来源任务二`、`milestone`、`risk`、`deliverable`、`meeting`；F5/F7 另有 `objectiveA`、`objectiveB`、`foreignOkr`、`kr`、`habit`、`historyHabit`、`wrapped`、`reflection`、`lesson`。
5. F6 由生产 gateway 的固定流输出，经生产解析得到 10 个 action，再由真实 ask-apply 确认产生。见 `F6-gateway-draft.json`、`F6-nonempty-ledger.json` 和 `commands-domain.json`，不是 seed refs。当前包保留 GG-01 的真实缺来源现象，不能拿它证明四个 create 来源已通过。
6. F5 为生产当前备份格式，不含 sessions 或 F4 共享附件字节。本专家另有真实 session 新进程回读证据，不声称它们从 F5 恢复。会话、共享文件恢复由对应已分工用例另外采证，不用假补表修饰 fixture。

## 2. 每组最小动作

以下保持既定用例的提交点。可用现行宿主命令面板完成只有命令承诺的能力；不要求新增导航。每段保连续页面状态/日志与前后 JSON，明确确认必须可见，不以截图张数或 HTTP 200 判通过。失败分支保返回与原值，不“清理”失败历史。

| ID | Main 最小采证动作 | 核对输出与留存 |
| --- | --- | --- |
| RA-AI01 | F6 来源台账按 kind 展开，打开各有效来源，返回并重进 | 标题/表/ID/角色/冻结版本；每次跳转正确项目实体；与非空 ledger 对齐 |
| RA-AI02 | F6 来源一正常改标题/正文，回台账，真实重校，刷新/重进 | changed、needs-regen、不计 supported；旧 refs/history 保留，追加 history，不自动调模型 |
| RA-AI03 | F6 来源二按真实保护合法删除，展开来源并点击，重校两次 | missing/manual-review，无错误导航；两次追加旧历史 |
| RA-AI04 | 隔离 gateway 出同目标 s1/s2 与独立 s3，取消/再生成；编辑勾选，整批及逐步确认；另一副本正常人改后确认；clean/changed/mixed 撤销 | 草稿零业务写、外部冲突/依赖拒而独立继续、逆序还原、mixed used/runtime 一致、重启无句柄 |
| RA-AI05 | 四扩展实体各 create/update；夹 delete/跨项目/unknown/wrapped/task资料数组，再明确确认 | 白名单落库、拒绝原因、四新 ID 来源记录；不能仅用旧 update 来源代替 create |
| RA-AI06 | Main 隔离 adapter 无 key/鉴权/限流/乱码/超长/取消后恢复；另真实授权模型一次确认非空来源并重校 | 中文降级/诊断、无假成功、busy/abort恢复、无密钥泄漏；真实模型单独原证，不从固定 fixture 继承 |
| RA-P0001 | 有材料及无材料任务 ask，上下文/相关投影可见，再 cancel | 描述/证据/session/资料与进展只读；缺口诚实，草稿不落业务 |
| RA-P0002 | 合法窄集提议并确认；非法 URL/过长/unknown/wrapped 再确认 | 返回与表单保留；按实际 schema 分开校 repo/branch，branch 单独合法，不能引用采证单笔误当新规则 |
| RA-P0003 | capture 草稿取消，再生成并明确 capture-apply；查新任务/来源/重进 | pending 无业务任务；日期/URL/白名单拒绝，确认 kind=capture，撤销说明真实 |
| RA-P0004 | attach-evidence 合法 https，再非法 javascript；另 capture evidence 候选 | evidence 持久、有来源，不自动 done/清单；非法零业务写 |
| RA-P0005 | 任务/session 同对 bind 两次、list/notes，再新进程 | 不重复关联、note 追加可追；其他项目不泄漏。F5 restore 不替代原库 session 回读 |
| RA-P0006 | metric 与同项目 applied/rejected/undo/kind 台账逐条对照，重进 | 数量/最近时间诚实，空库 0/null，不把缺失 refs 算正确应用步数 |
| RA-P0007 | 有/无材料任务人设 done，再 done，查看反思并 edit、人 final/重进 | 幂等，known/pending/blank、缺口诚实；best-effort 失败域见 AUTO 原证，不自动定稿 |
| RA-P0008 | 五类检查 fixture 执行 check，展开检查卡/目标，只查看退出 | D-1、D+2、done2/5、无材料done、100非done；最终由人，叙事不是完成材料 |
| RA-P1001 | queue list/open，展开 rest、正常跟进刷新；另只有 absent 的项目 | 严重度/迟到/Top1/rest、open设置；absence-only 不进 Top1，GG-04 修后重验 |
| RA-P1002 | 普通 mute/rest/unmute，关键 blocked mute 重读，再合法过期历史 | 历史可见/关键豁免/TTL派生恢复；settings可逆，不伪改墙钟 |
| RA-P1003 | 用真实当前时段 quiet，list/界面，再 off | top空、rest保留、off恢复；跨午夜纯函数证据不能冒充 GUI 时钟 |
| RA-P1004 | 正常改 task，回旧投影刷新/打开 task/回旧卡 | 当前值/数据截至时间/入口正确，不重调模型 |
| RA-P1005 | 关联任务；里程碑 achieved、交付物 accepted 分别保存，反思重进、重复状态、人 edit/final；非法关联 | 各 sourceEvent/关联清单/幂等与 gap；非法零写、不半写 |
| RA-P1006 | 合法历史负载事实/建议/烂尾筛选，打开目标返回 | 真实阈值，无伪 burnout/WIP/拒单，无信号不判烂尾；只读 |
| RA-P2001 | 三档明确 export，web 本地打开；改源后再开旧文件，重复 export 再 confirm | 内容与时间、自含只读快照、HTML转义、plain无HTML、静态不跟随、默认拒覆盖 |
| RA-P2002 | F5 标准历史包生产预检恢复，export→audit/sent/archive→task位→再export | 31天归档、29天active、审计只增，不改业务 task；不是等31天或改Date.now |
| RA-P2003 | OKR suggest/inbox，一 confirm 一 ignore，再重复 confirm，人 clear processed/重进 | pending不建OKR，draft不自动定稿，clear保pending，跨项目拒 |
| RA-P2004 | 同项目两objective和KR单父/软联，树/切关联、人 confirmed；非法关系 | 软联不计主权重，单父不变；跨项目/自指/不存在零写并保输入 |
| RA-P2005 | 单独 task 人 wrapped，查 stats/queue/check/people/board/reflect；AI提议wrapped | 非done/非open/不催/不自动反思，清单事实保留，中性徽标；board和客观聚合须Main原证 |
| RA-P2006 | wrapped 源 lesson add/edit、人 final/list/重进 | 真实来源、已核/待核/留白、无自动 final/徽章 |
| RA-P2007 | archive 最小包/字段说明，review 周期 JSON/MD与素材入口 | archive不是完整backup，不写K18审计；wrapped非done，源业务不变 |
| RA-P3001 | habit suggest/inbox，一confirm一ignore，重复confirm/重进 | pending无habit，确认draft，rationale/同项目OKR真实，不自动final |
| RA-P3002 | 实际 D、D-1、D-2 checkin，重复同日，再D+1/D-3 | 三日显式落库/backfilled，幂等；拒超窗且streak/checkIns不变 |
| RA-P3003 | F7标准预检confirm恢复，最近14天/跨月折叠展开/重进 | D-13内/D-14外、多月断签、空日不补，长历史不挤卡；D+3纯函数只是AUTO |
| RA-P3004 | habit合法OKR关联/切换、只读按OKR聚合、人final及重复final；跨项目提交 | 不计错/不写聚合、非法保输入，final幂等人裁决 |
| RA-P3005 | 检查真实 snapshot/习惯页的 cycleDue/占位说明 | enabled=false、无伪已提醒，不要求未批准后台调度 |

## 3. 原证回交

- 每 ID 对应一次提交点的参数、返回、前后库/manifest、截图/连续视频和页面状态；本专家按同候选逐项审证。
- 真实网络模型 Main-only 当前 NOT_RUN。只有确需所有者本人认证才能标 MANUAL_PENDING；不能把所有 GUI、无可用 adapter 或本专家无 GUI 都归为本人待验。
- 全 32 ID GUI 当前 NOT_RUN，因尚未收到 Main 可核原证，不是产品 GUI FAIL，也不是既有历史原证永久作废。
- 缩放/键盘/失败态等已有旅程矩阵继续复用同候选原证，不在本单追加待表决的设计矩阵硬门。
