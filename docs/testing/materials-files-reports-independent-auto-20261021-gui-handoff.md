# Main 精确最小 GUI 采证与合法 Fixtures

> 本专家GUI全部 **NOT_RUN**，不是要求Main猜字段/重建非法库。按原余合同及 [Oracle纠正](materials-files-reports-independent-auto-20261021-oracle-correction.md)执行，不自行改预期。Main唯一build/启service/GUI；本专家没有启动/操作3214..3217。后续产品漂移须重认领新候选。

## 包与源文件

末轮根：`docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/`。

- 各 `fixtures/F3|F4|F5/backup.json`，旁边完整 `backup.json.files.<fileBundleId>/manifest.json`和字节目录；已通过生产createBackup、结构/关系precheck、原路径及重命名路径bytes precheck。不要只拿JSON丢侧车。
- 各包 `ids.json` 是别名到真实ID，`expected.json`是core7+extra6原始键值对、逐字节manifest、counts、D与current/historical三元组。**不同包必须新空目标**；相同t-0001并非跨包同一实体。
- 原生选文件来源：`fixtures/F4-source/qa-note.md`与`qa-note-copy.md`字节同hash；`qa-note-v2.md`不同字节。普通源为22字节UTF8，sha `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`；版本二22字节，sha `875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`。白名单二进制本轮只测magic层，不能拿短magic当完整PNG/PDF GUI文件。
- F3：A=p-0001、B=p-0002、T=t-0001、BT=t-0002、M=m-0001、V=dlv-0001、BV=dlv-0002、link=at-1、dlvAt=at-2、E1=pl-1（三版active）、E2=pl-2（两版软删）、E3=pl-3（active）。QA-B的BE也为pl-1，用来证明复合task+entry不碰号。
- F4：含上述材料及成功文件探针记录；T当前绑定fa-0001，FILE_TASK=t-0003曾断联，SHARED=t-0004曾断联，不误拿它们作当前有效下载。原包6tasks/5assets，以expected而非截图计数为准。共享下载旅程优先用干净F5。
- F5：2projects/3tasks/1milestone/1risk/1meeting/1report/2deliverables；extra settings=2（真实export出站审计）、reflections/okrs/lessons/habits各1、file_assets=2。T=t-0001与SHARED_TASK=t-0003共同引用fa-0001；T另引用fa-0002。OKR/habit/lesson/reflection真实随机ID见ids。rpt-0001=`sourceType:session/sourceSessionId:qa-f5-session`；宿主sessions/checks不在包，不假称绑定记录也恢复。
- 业务根、字节根、备份根、exports、DSH_HOME必须全是Main合法自有隔离根；默认`pm-b1-pilot`为浏览器localStorage OFF，不是DB setting。ON/OFF必须实际记录，不靠JSON造开关。

## 恢复播种注意

F3可经现UI JSON-only恢复播种；含文件F4/F5当前UI `restore-content`无法传侧车，确认真实拒绝（MFR-B-01）。可在隔离宿主用**原路径真实命令**先播种其它GUI测试，不声称RA-J06通过：

```text
/pm restore "/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/fixtures/F5/backup.json"
/pm restore "/Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr/fixtures/F5/backup.json" confirm
```

这是dsh隔离宿主命令输入，不是shell，不在正式服务输入。JSON-only假预检与失败确认另采原证，不删file_assets来绕字节守卫。

## 逐 ID 采证

每条原候选、开关、起末DB/data/files manifest、实际载荷、响应、console、录像/逐态截图绑定。提交点/取消点分别记。沿用原合同所需宽深矩阵，不把单条AUTO扩成矩阵PASS。

| ID | fixture与最小顺序 | 需精确记录 |
| --- | --- | --- |
| RA-M01 | F3主表单basic标题+E1正文+at-1备注→一次save→重开 | 单层draft ops单command；E1只append rv4，E2两版/deletedAt原样、E3全字段不变、at/pl稳定 |
| RA-M02 | F3fresh basic非法日期+合法ops；fresh合法basic+空author/坏URL→修正save | 两失败DB/data/files零写、输入保留；合法修正一次 |
| RA-M03 | F3 E1 softDelete→常规列表/报告候选→restore→重复active/unknown | 三旧版保全/同ID；重复错误零写是有效合同，不要求伪幂等成功 |
| RA-M04 | F3源V改名/版本v2→看T冻结→明确手动动作→断联 | 源变不自动变frozen；原“更新最新”入口未由本专家自动执行，入口不存在交owner核，不能用remove/readd偷偷替代指定动作 |
| RA-M05 | AUTO-only，最新真实raw/apply/非法atomic已跑 | 不要求另GUI；非空raw守卫中文拒绝，空首次raw合法，不引用旧摘要判失效 |
| RA-M06 | F0draft两link c-1/c-2→progress选c-2→save；另坏alias | true refs最终at-ID，提交前零写、坏alias不半建 |
| RA-M07 | F3浏览材料/导出/最小archive/review/check→basic标题save→重开 | 旧新双读；只读不物迁；最小archive只含规定attachments/evidence，不要求全progress历史；完整history以backup验证 |
| RA-F01 | F0新draft原生选同hash两源→取消/卸载→重开→一次主save→刷新 | stage/DB/字节归属；正常cancel清stage，成功final不被cleanup DELETE；file alias与progress真正联动 |
| RA-F02 | F4受控真实传输3s/拒绝→abort/离开；late201→remount；失败重试save | 无迟到publish/残留stage/悬挂busy；renderer包装不是StrictMode双effect，Main真DOM或GUI另证 |
| RA-F03 | AUTO-only，当前全白名单/10MiB边界/根安全负例已跑 | 不执行恶意文件；不要求Main重复恶意GUI；字节安全AUTO未证明完整图片解码 |
| RA-F04 | F5 T的fa-0001授权下载→无认证另浏览器→中文空格名 | 实际文件sha，不记录cookie/token；401/403不泄；nosniff/no-store/RFC5987。route adapter AUTO不是宿主真实认证 |
| RA-F05 | F5 T/SHARED_TASK共fa-0001→断T→下载shared→断最后 | 源未删除；GC AUTO只元数据未保护的孤儿、默认dry，UI无GC不新增按钮；勿清元数据假造归零 |
| RA-F06 | F5标准包→空目标precheck/cancel→confirm→重进records/growth/tasks→下载 | 全13业务表/共享/三版/软删/22字节双hash；sessions/checks不在包；JSON-only现拒不能被CLI播种绿替代 |
| RA-F07 | F5独立副本hash坏/缺字节/relPath越界；合法回滚adapter错 | 可预检项在confirm前拒；UI保原库/报真实错误；当前content precheck漏路径红独立采，禁止绕守卫 |
| RA-F08 | AUTO旧7表与历史tagcore已跑；实际pilot OFF basic保存补GUI | 新键/旧键/多rev不丢。历史v0.7.3 schema拒新keys，不能用降版清键恢复；原发布bundle往返未验 |
| RA-R01 | F3周期D-2..D→选**当时当前rv3**+E3rv1→preview/save/reopen；oldrv2请求拒；历史excerpts另路 | 三元组/正文/作者/date精确，E2及B不可选；preview零写；按纠正当前选版，不新增任意历史selected能力 |
| RA-R02 | F3 refs+excerpts同时；unknownrev/B/E2各拒→合法改正 | 后端互斥/存在/同项目/软删拒、零写、中文保输入 |
| RA-R03 | 已存当前版报告→源edit rv4/改author/softDelete→旧报告重开/export | 当前保存及历史合法excerpts两路均固定；snapshot/内容不静默更新，旧calcVersion缺键不回填 |
| RA-R04 | F5 session报告与新manual；无ID/非法source→合法ID保存→编辑title/MD | manual=null/session非空trim，update来源只读；宿主存在性不额外发明门 |
| RA-R05 | 含表/代码/javascript链接安全MD→preview/save→导出→改源 | 安全AST/覆盖拒和明确覆盖；实际固定report只有MD出口，web/plain为项目出口，不冒称三档同固定报告 |
| RA-J03 | F0+F4基础字段/两资料/进展/真文件→取消/保留/放弃；fresh一次save→重开 | 完整序列录证，AUTO原子零写不能替代GUIdirty/返回/真原生选文件 |
| RA-J04 | F3 E1追加rv4→softDelete→restore→当时current rv4+E3 save→源rv5→旧报告/MD预览/导出 | 历史不重写/同ID/固定当时版本；合法rv2 excerpts对照另路，旧rv2selected必须拒而非新增历史选择能力 |
| RA-J06 | F5 UI备份→预检/cancel→两次明确确认→重进/下载 | 现content文件恢复红；需修/核入口后实际成功，前置路径restore不算本GUI通过 |

## Main回件

先交F01/F05真实文件与取消新候选接缝，RA-M/R已绿domain可按精确diff继承；本专家再审GUI原证。两个恢复接缝缺陷见findings，Oracle纠正由原计划owner更新本人计划。不要把本表的NOT_RUN填成PASS，也不要用verify总数替代逐ID。
