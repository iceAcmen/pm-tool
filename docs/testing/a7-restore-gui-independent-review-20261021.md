# A7 恢复 GUI 原证独立审签

> 2026-10-21，trae，独立审证角色。给 Main、负责人及后继专家使用；Main 执行，本角色只审公共归档原证并判定。只写本前缀及 selftmp，不操作产品/GUI/服务、不读 runtime private 或凭据、不 build/install/写 sharedlib、不改他人 testing/livingdocs、不 commit。父持续授权见 [执行记录](../../reports/all-pending-acceptance-execution-20261021.md)。

## 结论

- **A7-RV01，P1，局部 GUI FAIL**：实际预检长路径/`pre` 撑宽外壳并挤占 rail/main。已交 [最小修复合同](a7-restore-gui-independent-review-20261021-repair-contract.md)，只涉及 panel、局部 CSS 和对应测试，不提出 preview 摘要锁或新安全协议。
- **有限 PASS**：A7 认领与实际下发、继承有效的 backup SOURCE/AUTO、预检/取消数据零写、两级确认画面后真实恢复、十三表十九记录完整字段指纹、两份22字节资产、任务重开、首个中文空格名下载字节一致。
- **完整 RA-J06 / RA-F06 / RA-F07 / RA-F04 GUI 门未闭**：布局已 FAIL；带前库安全快照、UI备份、全部 records/growth 重进、第二 hash 下载、匿名/安全头及错误恢复尚缺原证，记 BLOCKED，不转 MANUAL_PENDING。下列子项 PASS 不能上升为整门。
- **A7-NAME01 只定位，不自动开产品缺陷**：主表单文件标签回退 faID，实际下载名/字节正确；已核合同未找到要求主表单必须显示资产 fileName 的明确条文，详见修复合同末节。

## 对象与证据绑定

原证根：[A7](../../reports/all-pending-evidence-20261021/A7/)。已读 AGENTS、collaboration §9/11、MFR 最终报告及 GUI 交接、backup-web 独立99/99报告/先行计划、父授权及当前交接记录。不以历史 A6/OP/Finder/整个 B8 的 PASS 代替本轮。

| 字段 | 本轮事实 |
| --- | --- |
| 候选 | `candidate.json`：baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，productBase `2a7603023bc54ef13d788e50069ee3fde4671bf3`，version 0.7.4；未提交差异+16新增文件 |
| patch | SHA256 `d335001cc91bfea14ca8d2c725ae470673e1f9cc6e856289943b6c5be935e1b4`，本角色重新核原 patch 字节 |
| source | candidate 395条源/测试指纹与 sync 503条同步指纹全相符，copyDrift 空；backup 专家374源逐一与 A7 相同，新增测试单列，不拿 HEAD 代表 dirty |
| 继承 | backup 专家 SOURCE/AUTO 99/99×2、全新Node回读、受影响 panel/launch/bridge47项，依赖为原冻结合同；三个已归档声明 package/lock/vitest 一致；sync 未列 tsconfig，不假称全声明均已核 |
| instance | 归档 setup/start：自有3216/PID54592，隔离 root `/private/tmp/pmtool-a6-restore-runtime-20261021`，插件解析隔离候选 worktree；正式服务/软链未在本角色范围 |
| 实际下发 | `loaded/combo.json` / `combo-1.txt`：uncached200，2560545 bytes；SHA256 `faaa2ba4ecff4570c5df0664941b0ef0e578d1738ad33d13bc1b8b4a0a13ef1a` |
| 完整片段 | offset875361、1681713 bytes、unique；片段SHA `ef04a9768c66d07bc8054091a4e8a45dba854c2b2bfb304e3633879076935b03`；本角色重算片段/全响应并查唯一性。artifact声明client SHA `f8e001ba19f99f48e6325966e337338249ff4d6b99ce316dcb52eb1185c9f03e` 与 observer一致 |
| 环境 | macOS arm64、Node v22.23.3，作者现有 pnpm11.28.5；origin3216、PM mounted、1440×900、浅、pilot OFF。DPR由1到2只是设备读数，未签原生100%/200% |

实际 combo 捕获时点14:26:34Z，在14:24恢复之后；直接证明该次 reload 的 A7 装载。较早动作按同一自有实例/start、冻结/source、特有路径入口及连续归档关联，不声称在其前已有这份 Network 响应，更不倒填旧 A6 的下发。没读取运行中 lib、private entry-url、browser-ws、cookie/token 或个人配置。合法 first-delivery/无个人凭据按 Main 公共设施及 scope 声明认领，不升级为认证安全总验收。

## 分层审签

以下 GUI PASS 仅签明确行为子段，不签全布局、键盘、完整录像或其他矩阵。

| 子断言 | 判定 | 原证与边界 |
| --- | --- | --- |
| MFR-B01/B02 新路径 SOURCE/AUTO | PASS（继承） | backup 专家99/99两轮已审签，374源与 A7相同；content-only诚实拒字节及错误/事务守卫仍按其原范围，不改原 MFR FAIL 历史 |
| 实际路径入口/预检执行 | PASS（行为） | `empty/path-entry/full-precheck` JSON/PNG；已见 label/input/空路径disabled，原 fiKpOr F5完整路径出现在实际预检文本及命令，不猜 filename 为路径 |
| 预检→取消的写入边界 | PASS（存储） | `precheck-cancel-boundary.json` 三根完整键/hash before=after：data两文件、files0、backups0。不是只数文件，不扩大到全盘/正式资产 |
| 取消后预检层关闭/焦点回归 | BLOCKED | 末 compositor 帧仍显示预检布局，缺取消后稳定观察与动作日志；零写不能证明层已消失，不把截帧时序问题判产品失败 |
| 两级确认及成功反馈 | PASS（GUI行为子段） | `confirm-frames` 预检→灰化→原危险dialog（全路径折行、两动作可见）→成功toast与任务列表；`second-confirm.png` 补静态。仅签两级可见与之后成功，不声称首次按钮后磁盘中间态已另采 |
| 十三表全字段/稳定ID | PASS（归档原证复核） | 原 F5 `expected.tables` 逐key重建 `JSON.stringify({version:2,record},null,2)+"\n"`，SHA与restore.after及download.before的19文件全同；额外/缺失PM键0。独立重算，不只读Main的`matches:true` |
| 共享/三修订/软删/来源 | PASS（存储） | 上述完整envelope匹配同时证明 T/SHARED共fa1、E1三版、E2两版及deletedAt、session报告来源、六extra表一致；settings真实键值不按实体ID数组误比。sessions/checks不在包，不声称宿主记录恢复 |
| 双资产恢复 | PASS（字节清单） | fa1 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`、fa2 `875a72ee9315a77dc0407dbfe29ce8823dfd2671e3c785ee69ffc6e18dbb2522`，均22bytes；readback和恢复后的完整files键/hash与原侧车一致 |
| 任务重开 | PASS（有限GUI） | 新timeOrigin后的 `task-files-reentered.json/png`：原T标题、里程碑、资料/进展及文件href相关文本。PNG仅抽屉上部，不能签文件区域全文目视/所有修订展开 |
| 首文件授权实际下载 | PASS（字节/名称） | `downloads/QA 中文 文件.md`实际22bytes，本角色重算sha=源fa1；download before/after全data键/hash不变。`replies:[]`表示未采headers，不是请求失败 |
| 下载头/匿名/第二hash | BLOCKED | 没有原宿主响应头/无认证同资源拒绝/第二文件实际下载原证，不能用route adapter旧AUTO代替 |
| 恢复预检布局 | FAIL，A7-RV01/P1 | full-precheck PMscroll2629/client1155差1474px；实际PNG/JPG可见长行越界/第三列挤占，源位置见先行合同；不依赖原生zoom认定此实际viewport失败 |
| 原生zoom/完整J06/错误GUI | BLOCKED | 仅当前片段已采，具体最小补件见下；空库无备份快照是合法初态，不判FAIL |

本角色目视读取了 path-entry/full-precheck/second-confirm/task-files-reentered PNG 和 precheck 000002/000006/000008、confirm 000008/000010/000015 JPG；其余帧校哈希及时间戳，不假称全部帧逐一目视。25帧来源为实际 `Page.screencastFrame`，公共 helper 原文已归档 A6/execution-scripts；只读设施、未执行。9帧跨度0.322771秒、16帧跨度0.640960秒，重复像素且不同timestamp是正常重复帧，非新增操作证明。接受这些为真实原帧子段，不称完整旅程录像；当前审签不依赖尚待Main封装的mp4，不用stack截图制造录屏。

## 自动原证与本角色验证

下面是 Main 已执行原命令/退出，不是本角色重跑产品。cwd均为 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool`，launcher一项cwd为该树`launcher`；完整argv/起末/exit见 A7/build各 `*.exit.json`，逐verify名单保存在本角色 [audit-result](a7-restore-gui-independent-review-20261021-selftmp/audit-result.json)。

| 命令 | 结果及可签范围 |
| --- | --- |
| `pnpm run build` | exit0，453产物指纹声明；本角色不重建、不读共享lib |
| `node node_modules/vitest/vitest.mjs run --coverage --maxWorkers=2 --minWorkers=1 --no-cache` | r3 exit0，135files/1262tests；coverage四列Statements77.91/Branches86.09/Functions79.22/Lines77.91，阈值未报失败。早两轮exit1保留为fixture设施缺口，不抹红 |
| `node scripts/verify-isolation.mjs` | exit0；95个具名子脚本均有exit0，去重95，runner五保护条目hash+mtime0变；仅隔离树WATCH，不声称当前正式全盘零变化。默认排runner自身及real-model，95≠所有97/真实模型完成 |
| launcher cwd `pnpm test` | exit0，56/56，fail/cancel/skipped/todo均0；AUTO不替Finder/GUI |
| 本角色 `node docs/testing/a7-restore-gui-independent-review-20261021-selftmp/audit.mjs` | exit0，139/139归档校验，47索引原证、25帧/原戳、fixture、source/patch、combo、19envelopes/双资产/下载及日志交叉检查；这是审证工具，不构成139项产品测试 |

本轮未执行新的安装、产品 build/verify/组件测试或 GUI；原因是明确角色范围禁止。不是测试工具无能力导致的用户协作项。139项是证据一致性 PASS，不能覆盖缺证GUI或消除当前布局FAIL。

## Main 精确最小补件

1. **先修 A7-RV01**：按已落先行合同，保旧红、新候选另归档；至少原长路径1440浅及390浅/深、受影响原确认/取消/键盘。同3216 origin菜单原生100%屏幕证明+实际尺寸/状态；地址栏凭据不入证。不拿其他origin、DPR2或调CSSviewport当zoom。
2. **两确认/取消边界**：取消后稳定预检消失与焦点观察；完整实际动作runner及脱敏command/response/console，第一次仅开dialog时的三根清单、第二明确确认后的清单。只归档允许的字段，不抓cookie/token；原frame按原timestamp封mp4并登记hash/时间映射，不把短片补长或补造中间状态。
3. **UI备份+带前库快照**：用自有合法非空前库，经UI备份得到完整JSON+侧车，再原路径预检/取消/双确认；归档前库13表/字节指纹、实际安全snapshot文件/侧车、完整预检结果及与前库字段/字节对照、成功后目标包对照。空库本轮不重判FAIL，不用两个包互相覆盖在途成果。
4. **双hash/头/匿名**：任务文件区实际滚到可见，fa1与fa2各真实下载并归档实际名字/size/sha；同origin同资源脱敏响应记录status、nosniff、no-store、Content-Disposition/RFC5987。新无认证浏览器直接访问同资源记录401/403及无字节；不能复制认证或把空replies记FAIL。
5. **records/growth重进**：实际重进会议/报告及复盘/经验/OKR/习惯既有入口，记录fixture真实ID、源字段/状态、可见内容及只读三根指纹；pending建议计数0不当业务记录0，sessions不在备份不造存在门。
6. **错误恢复**：原F5独立副本逐项hash坏/缺字节/relPath越界，GUI预检拒绝且保输入/原库；合法带前库恢复的一次现有adapter提升/落盘故障→错误→全表/字节回滚与安全snapshot可预检。仅原获批隔离故障缝，不改正式数据/系统、不新增hypo安全要求。

上述补件由 Main 继续，下一专家按新候选及受影响范围复验。本角色有限审证与通知已完成，释放；不等待将整个父积压验收做完，也不替Main改生活档案或提交。Skill使用限于 uicraft 的原证技术审查、writing-plans 文件级先行合同及证据分层；未运行vendor/installer或赋予新全局UI门。
