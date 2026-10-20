<!--
B1+B2 独立测试计划/用例（开发前冻结，独立测试专家所有，ADL-045/047；其他角色只读引用，不改本文件）。
冻结日期：2026-10-20。本批 first return 只交付计划/用例，不给 final PASS；被测提交 SHA 待开发同步后绑定（禁止自行 fetch/pull）。
依据：PM工作台新版实施路线图-20261020.md §3 B1/B2、§4 回滚、§5 并发/取消/失败、§7 mapping。
角色边界：测试专家只读代码、不改产品、不自开浏览器；GUI 项由主端（唯一 service/GUI）按本计划采原始证据，测试专家据证据独立判证。
分层：AUTO=可离线自动；GUI=真实主端目视/交互（Main 采证，QA 判）；MANUAL_PENDING=必须用户本人配合；初始一律 NOT_RUN。FAIL/BLOCKED/NOT_RUN ≠ PASS。
-->
# B1+B2 独立测试计划/用例（2026-10-20 冻结 · 计划件 · 无 final PASS）

> 给谁：开发负责人（前端唯一 client `s_000E60G3Zfb`、data 唯一 core `s_000E60ePRfA`）作为开工依据；主端 GUI 执行方按本计划采证；项目所有者。
> 是什么：把路线图 B1（共享控件修 dark + tasks 试点 1 页，flag）、B2（资料软引用+安全链接多数组+progressLog 闭环，不做真文件）拆成可阻断、可追溯的 Given/When/Then 用例。
> 红线：不改生产业务代码自验；不安装 Ego、不迁 login；noKeys / noDSH remote / fork；离线优先；正式服务与真实数据零写（隔离实例+临时目录）。

### 静态门禁刷新（2026-10-20 QA 独立复跑，旧 87/90 作废，以本次实测为准）

- isolation `verify-isolation.mjs`：**90/90 通过，资产 before=after=201，污染 0**（client-bundle provide map / external-skills profile / p2-integration 三项已转绿，QA 独立复跑，不沿用作者 PASS）。
- vitest **最新实测 60 文件 / 624 测试全 PASS**（旧 603/600 为不同时点快照，以本轮实测为准）；`tsc --noEmit` 干净、build 成功。
- B2 数据层 AUTO：**23/23 PASS**（见 `b2-audit/b2-checkpoint-qa-audit-20261020.md`）。
- **C8 已修复关闭**：refs 写时校验∈本任务 active attachments（悬空拒/合法收/摘除拒，零写），原 WARN 不再保留。
- 边界：以上仅静态/AUTO 层绿；**B1/B2 GUI 未由 Main 采证全 PASS 前，不称上线/发布**；200%/drag 本轮 NOT_RUN，不得以截图替代真实交互。

## 0. 通用门（B1、B2 共用，先于功能用例）

| ID | 验收标准（可观察） | 方法 | 通过判据 | 分层 | 状态 |
|---|---|---|---|---|---|
| GEN-01 | 绑定被测基线：执行时 HEAD SHA + 工作树指纹（`git status --porcelain`）+ 版本三元组（package.json version == tag == releases 说明）一致；记录 PM8dfed2d 起点，上游 DSH1142fb74f2 tracked-clean 只读 | 执行前只读采集 | 三项齐全并写入证据头；不沿用历史旧 SHA 冒充 | AUTO | NOT_RUN |
| GEN-02 | `pnpm run build` 退出码 0；受影响 `node scripts/verify-*.mjs` 全绿；verify-isolation 权威资产 before==after 零污染 | 隔离目录实跑 | 退出 0、失败 0、资产指纹无新增/删除/篡改 | AUTO | NOT_RUN |
| GEN-03 | 真实版本号可观测：页脚/关于/命令 `--version` 与 package.json 一致；`actual route`（URL hash/route）与页面标题/面包屑一致，不靠口述 | 隔离实例 + 只读断言 | 版本三元组显示值一致；每条 GUI 用例记录实际路由串 | AUTO+GUI | NOT_RUN |
| GEN-04 | 真实输入落库与重启持久化：录入值经 domain 持久写（dsh-storage-domain + `enqueueDomainWrite`），**不是浏览器 localStorage**；杀进程重启后读回一致 | 前后存储快照 diff + 重启读回 | 重启后值在 JSON 域文件；localStorage 无业务副本 | AUTO | NOT_RUN |
| GEN-05 | 并发/取消/失败保输入：每域 Promise 串行写队列 + busy 守卫（E10 拒二次提交）；进行中取消零写；校验失败就地保全部输入、聚焦首错 | 故障注入 + 快照 diff | 二次提交被拒 E10；取消后存储字节不变；输入不丢 | AUTO | NOT_RUN |
| GEN-06 | 错误可恢复与备份：失败给中文原因/可重试方向，不泄 stack/Key；批前版本化安全快照（export/snapshot），恢复两步确认+恢复前快照 | 故障注入 + 备份演练 | 失败保留输入可重试；快照可还原；无跨记录事务不谎称 | AUTO+GUI | NOT_RUN |
| GEN-07 | 视口矩阵（凡涉及控件/抽屉/表单）：1440 / 1024 / 768 / 390 × 浅/深 × 100%/200% 原生文本缩放；鼠标拖缩（涉及处）；跨宽无外壳二维横滚；200% 标签不裁切、控件不断裂 | 主端逐视图采证 | 每视图有原始截图/录屏；测试专家目视判 | GUI | NOT_RUN |
| GEN-08 | 键盘走查：核心流程纯键盘可完成，焦点环可见、无焦点陷阱、ESC 归还焦点 | 主端采证 | Tab 序合理、ESC 归还、可见焦点 | GUI | NOT_RUN |
| GEN-09 | 证据协议：Main 只采原始证据（录屏/截图/日志/页面状态/存储 diff），**不自判 PASS**；证据绑定被测 SHA；缺级（code complete→tests passed→deployed→CDP observed→customer validated）诚实标缺 | 证据登记表 | 每条用例有证据指针；observed/measured/DOM/截图分级 | AUTO | NOT_RUN |

---

## 1. B1 共享控件修 dark + tasks 试点 1 页（flag，非逐页授权）

> 范围（路线图 §B1）：Reuse 现有 tasks 搜索/filter chips/单字段排序/分组/密度/WBS 树/检查清单（`client/views/tasks.tsx`）；Migrate 表格列视觉/行高、task 抽屉排版、Select、校验零写保输入；**本批只实现 task 页自用菜单/抽屉/状态**，42 抽屉态/39 菜单分散到 B4–B7，不塞进首批。flag 控制，不构成其余页逐页放行。

### 1.A AUTO 静态/构建/语义门

| ID | Given / When / Then | 通过判据 | 状态 |
|---|---|---|---|
| B1-A01 | Given build 干净；When `pnpm run build`+受影响 verify；Then 退出 0、无类型/打包错误、full guard 零污染 | 0 退出；资产 before==after | NOT_RUN |
| B1-A02 | Given 共享 dark safety；When 置 dark；Then 共享控件对比/边框/焦点环在**所有页面 applied**（非仅 tasks），正文 ≥4.5:1、边框分隔线可见、焦点环不丢（计算实测非肉眼/mockup 标注） | 每个共享基件有 color/bg/border/contrast 数值；AA 达标；跨页一致 | NOT_RUN |
| B1-A03 | Given dark 主题；When 全局置 dark；Then `color-scheme:dark` 生效，原生 select/option 显式 bg/text/border，无透明 option 黑字黑底 | computed colorScheme=dark；option 显式底色 | NOT_RUN |
| B1-A04 | Given pilot 开关；When 默认；Then localStorage `pm-b1-pilot` 默认 OFF；经「更多」菜单「新版界面试用」真实切换 ON/OFF，关闭回旧壳/旧页且不删旧实现、旧路径照常打开 | 默认 OFF；菜单真实切换；回退可用 | NOT_RUN |
| B1-A05 | Given host slots 不新增 URL routing（本批）；When 切换 project / view / named-view；Then 还原项目/视图/命名视图状态（状态恢复，非 URL 深链）；**真正 deep URL 路由属 U6 后续，本项 NOT_RUN，不得标 PASS** | project/view/named-view 恢复一致；deep URL 显式 NOT_RUN | NOT_RUN |
| B1-A06 | Given 任务五态（完成/进行中/受阻/待办/收尾）fixture；When 读 tasks；Then 五态计数同源重算、状态带文字标签、无仅色编码 | 计数与 fixture 一致；五态文字可见 | NOT_RUN |
| B1-A07 | Given 本批仅 task 自用菜单/抽屉；When 清点新增控件；Then 未越界实现其余页 42 抽屉态/39 菜单（仅登记，不堆首批） | 清单无越界新增；越界即 FAIL | NOT_RUN |
| B1-A08 | Given 既有 tasks 能力；When 迁移视觉；Then 搜索/chips/单字段排序/分组/密度/WBS 树/检查清单行为不退化（非回归） | 既有能力用例全保持 | NOT_RUN |
| B1-A09 | Given 全交互面型；When Oil Hard Rule#2 对照；Then success 成功反馈态与 permission-denied 无权限态均有定义（缺失=真 bug，非润色） | 两态有 fixture/可观测验收 | NOT_RUN |

### 1.B GUI 真实主端（Main 采证，QA 判；1440/1024/768/390 × 浅/深 ×200%）

| ID | Given / When / Then | 通过判据 | 分层 | 状态 |
|---|---|---|---|---|
| B1-G01 | Given 空项目；When 打开 tasks；Then 有引导空态（非白屏/非报错），空态文案与下一步清晰 | 空态可见可理解 | GUI | NOT_RUN |
| B1-G02 | Given 长文/密集项目；When 打开 tasks；Then 长标题/多记录内滚或折叠，不撑破布局、无横向溢出 | 长密不溢出错位 | GUI | NOT_RUN |
| B1-G03 | Given 加载中（busy）；When 进入/取数；Then loading 可见且 `aria-busy` 置位，非长时间空白、非假成功 | busy 可见+aria-busy=true | GUI | NOT_RUN |
| B1-G04 | Given 局部失败（模拟存储/拉取失败）；When 出错；Then 保留旧数据、标「陈旧(stale)」、给失败原因与可重试，不白屏不清空 | 旧数据在+陈旧标+原因+retry | GUI | NOT_RUN |
| B1-G05 | Given 错误重试；When 失败后重试；Then 输入保留、重试成功落库、可观察成功反馈 | 重试闭环 | GUI | NOT_RUN |
| B1-G06 | Given 筛选无结果；When 条件无匹配；Then 有「无结果」空态与清除入口，非死表 | 无结果态+清除 | GUI | NOT_RUN |
| B1-G13 | Given 操作成功；When 保存/切换/勾选成功；Then 有可观察成功反馈（did it work/what changed/what's next），非静默 | 成功反馈闭环 | GUI | NOT_RUN |
| B1-G14 | Given 无权限/受限操作（permission-denied 通用 error）；When 触及；Then 通用错误显示失败原因、保留已填输入、给退路，非静默失败/非假可点 | 原因可见+保输入+退路 | GUI | NOT_RUN |
| B1-G07 | Given task 抽屉；When 打开/编辑；Then 排版统一浅深、校验失败零写保输入、chevron/焦点可辨 | 抽屉六态齐、零写 | GUI | NOT_RUN |
| B1-G08 | Given 项目切换；When 切换项目；Then 列表按项目切换、状态正确、不串数据 | 切换正确 | GUI | NOT_RUN |
| B1-G09 | Given 跨宽度+200%；When 逐视口；Then 无外壳二维横滚、标签不裁切、控件不断裂；鼠标可拖缩（涉及处） | 逐视图原始证据 | GUI | NOT_RUN |
| B1-G10 | Given save/restart；When 录入后保存→刷新→重启；Then 自定义状态/筛选留存（持久，非内存） | 重启读回一致 | GUI | NOT_RUN |
| B1-G11 | Given 全视口；When 交互；Then console 0 error（记录完整日志） | consoleErrors=[] | GUI | NOT_RUN |
| B1-G12 | Given `pm-b1-pilot` ON；When 在「更多」菜单切回 OFF；Then 回旧壳/旧页且可用（Main 采证视觉），默认仍是 OFF | 切换回退可用、默认 OFF | GUI | NOT_RUN |

> 16 卡旧布局保持属 **B4**（路线图 §B4），本批不验，仅在 B4 非回归矩阵覆盖；此处不提前判 PASS。

---

## 2. B2 资料软引用 + 安全链接多数组 + progressLog 闭环（小高值，不做真文件）

> **前置闸门（开工前）**：P1–P3 已由用户明确批准——P1 本地项目相对路径+清单 manifest、不硬编码云/对象存储；P2 交付物引用冻结 version 快照+手动「更新到最新」，不自动覆盖历史；P3 进展历史 **append revision（强制，非 proposal）**：不改原文、新写一版、author 非空文本、deletedAt 软删可恢复、已存 report 摘录 freeze。**U1 已定方案 A**：attachments/progressLog 作为 task 可选 arrays（不另立独立 domain 表），已批准；待 data owner 补 schema 合同后，QA 追加 revision 专项 tests。file kind 随 U2/B3 再加，本批 attachments kind **仅 deliverable/link**，不先建 file 形状。

### 2.A AUTO schema 全链/语义/持久门

| ID | Given / When / Then | 通过判据 | 状态 |
|---|---|---|---|
| B2-A01 | Given U1 方案 A（task 可选 arrays）已批准；When data owner 未补 schema 合同；Then QA 暂缓 revision 专项 tests，仅框架登记；合同到位后追加 revision/author/deletedAt 用例 | 合同未到=NOT_RUN 非 FAIL；到位后补测 | NOT_RUN |
| B2-A02 | Given schema 链；When 新字段入 record/create/update 三个 `z.strictObject`（`core/task.ts:85/98/121`）；Then 未知键走 `unrecognized_keys` 拒绝（`:169`），缺一即保存报「不支持的字段」 | 三 schema 齐；坏键被拒 | NOT_RUN |
| B2-A03 | Given 写业务层；When 持久写；Then `core/tasks.ts` 经 `enqueueDomainWrite` 校验落库（dsh-storage-domain，非 localStorage）；`core/archive.ts:57-60` 字段透传；`core/export.ts:268-272` 导出 refs；前端镜像 `client/views/tasks.tsx:349-350` 同步 | 五处链逐一核对闭环 | NOT_RUN |
| B2-A04 | Given 单 `deliverableId`；When 迁移多引用数组；Then 存在性/同项目校验迁移为数组；旧单键双读兼容、旧任务缺新键照常打开 | 旧读兼容；数组校验 | NOT_RUN |
| B2-A05 | Given 单 `evidenceUrl`；When 迁移多链接数组；Then `core/evidence.ts` normalize/safeHref（http/https、≤2048、trim、不联网探测）逐链接校验 | 每链接过 safeHref | NOT_RUN |
| B2-A06 | Given 非法协议（ftp/javascript:/mailto 等）/超长；When 提交；Then 拦截并**保留全部输入**，不落库、不产生半成品 | 拦截+保输入+零写 | NOT_RUN |
| B2-A07 | Given attachments[]（本批 kind 仅 deliverable/link）；When 新增；Then kind 枚举白名单；deliverable 软引用**冻结 version 快照=P2**，另显「最新」手动更新，不自动覆盖历史 | kind 白名单；版本冻结 | NOT_RUN |
| B2-A08 | Given progressLog[]（方案 A 挂 task 可选 array）；When append/编辑/软删；Then schema {id,date(iso)/author(非空文本)/content MD/createdAt,deletedAt?}；**append revision=P3 强制（非 proposal）**：不改原文、新写一版；软删置 deletedAt 隐藏且可恢复；汇报摘录 freeze | author 非空；revision 强制；deletedAt 可恢复；freeze | NOT_RUN |
| B2-A09 | Given 新 progress 命令（追加/编辑/软删）；When 经 domain；Then 语义校验拒绝非法值并持久化；命令成功/失败用例留日志 | 命令校验+持久 | NOT_RUN |
| B2-A10 | Given 新 MD 内容；When 渲染；Then 走既有零 DOM/innerHTML/eval 安全 renderer（`client/shared/markdown.ts`），无 XSS/注入 | 安全 renderer 输出 | NOT_RUN |
| B2-A11 | Given 口径迁移；When done 完成材料闸 `core/check.ts:96-97`、复盘缺口 `core/reflect.ts:98`、导出 refs `core/export.ts`；Then 改读新数组，对已挂链接/交付物的 done 任务不误报「缺材料」，旧单键双读兼容 | done 不误报；旧兼容 | NOT_RUN |
| B2-A12 | Given 取消；When 表单取消；Then 零写（前后存储快照字节 diff 为空）；移除仅断联（unlink）不删源 | 快照 diff=空；源保留 | NOT_RUN |
| B2-A13 | Given 空校验；When 空内容提交；Then 就地报错、聚焦首错、已填内容全部保留 | 报错+保输入 | NOT_RUN |
| B2-A14 | Given 并发；When 快速二次提交；Then busy 守卫 E10 拒二次；进行中取消零写；串行写队列不撕裂 | E10 拒；零写；无撕裂 | NOT_RUN |
| B2-A15 | Given 保存→重开；When 本机重开；Then 多交付物/多链接/progressLog 仍在；重启读回一致 | 持久读回 | NOT_RUN |
| B2-A16 | Given 回滚；When 关闭两区入口；Then 旧任务缺新键照常读；**新键保留不清**（绝不「清新增键」丢用户日志）；旧 write 不得抹新字段（先做读写往返+版本化快照验证） | 新键保留；兼容往返 | NOT_RUN |
| B2-A17 | Given Proposal 项 snapshotRef 选取器联动（U3）/editedAt 留痕；When 本批；Then 标 Proposal 不当已实现，不验收 | 明确 Proposal 边界 | NOT_RUN |
| B2-A18 | Given copilot；When AI 面对 attachments[]/progressLog[]；Then 仅只读投影展示、不提议写入；`core/copilot.ts:16` ALLOWED_OPS 不变（无新字段写权限、不含 delete） | 白名单未扩 | NOT_RUN |

### 2.B GUI 真实主端（Main 采证，QA 判；1440/768/390 × 浅/深 ×200%；B2 不强制 1024，涉及处补）

| ID | Given / When / Then | 通过判据 | 分层 | 状态 |
|---|---|---|---|---|
| B2-G01 | Given 资料区；When 关联多个已有交付物；Then 搜索/筛选/多选/已选预览可见，冻结 version 标签正确 | 多选+预览+版本 | GUI | NOT_RUN |
| B2-G02 | Given 链接区；When 加多条 http/https（标题+地址）；Then 列表可增删；非法协议内联拦截、输入保留 | 多链接+拦截保输入 | GUI | NOT_RUN |
| B2-G03 | Given progressLog；When 追加/预览/保存/取消；Then 编辑预览、保存落库、取消零写 | 闭环+零写 | GUI | NOT_RUN |
| B2-G04 | Given 空/长/密/错态；When 各态进入；Then 空校验保输入、长文折叠、密集可读、错误有重试 | 四态齐 | GUI | NOT_RUN |
| B2-G05 | Given save/restart；When 保存→刷新→重启；Then 资料/链接/日志重开一致 | 持久 | GUI | NOT_RUN |
| B2-G06 | Given 跨宽+200%；When 逐视口；Then 无横滚、标签不裁切、表单不错位 | 逐视图证据 | GUI | NOT_RUN |
| B2-G07 | Given 全视口；When 交互；Then console 0 error | consoleErrors=[] | GUI | NOT_RUN |

### 2.D Main 首轮最小高值正式用例（first feedback；不等 B1-B8 全写完，QA 不做 GUI）

> 执行方：Main（唯一 service/GUI）。fixture 只建**隔离测试项目**（命名 `QA-隔离-<日期>`，验完即删），不碰正式项目/真实数据；每条记录「实际 route/view 串 + 输入原值 + 预期存储落点 + 读回值 + console 日志」。**运行版本 manifest（HEAD SHA + package.json version + 页脚/`--version` 显示值三元组）必须由 Main 随证据提供**，缺则该条 NOT_RUN 不记 PASS。200% / 鼠标拖缩本轮 NOT_RUN，禁止用截图替代真实交互。证据统一落 `docs/testing/evidence/<日期>/`（Main 建目录，QA 只读判）。

| 用例 | 实际 view/route（Main 填真实串） | 隔离输入 | 预期存储/读回（QA 判据） | 回滚安全 | 状态 |
|---|---|---|---|---|---|
| B1-G01 空态 | tasks 视图（记录实际 route/hash） | 新建隔离项目，0 task 打开 | 引导空态非白屏/非报错，文案含下一步；无 console error | 删隔离项目即净 | NOT_RUN |
| B1-G07 抽屉零写保输入 | tasks → task 抽屉 | 打开抽屉→改字段→点取消；再触发一次校验失败提交 | 取消后存储快照 diff=空、已填输入保留；校验失败零写、焦点可辨、浅深统一 | 不提交即零写 | NOT_RUN |
| B1-G08 项目切换不串数 | tasks 视图切换隔离项目 A↔B | A/B 各建 1 条不同 task | 列表按项目切换、状态正确、A 记录不出现在 B | 删两隔离项目 | NOT_RUN |
| B1-G10 持久重启读回 | tasks 视图录入后保存→刷新→重启 | 自定义状态/筛选（含一条 task） | 重启后自定义状态/筛选与 task 仍在、值一致（非内存） | 删隔离项目 | NOT_RUN |
| B1-G12 pilot 回退 | 「更多」→`pm-b1-pilot` ON→切回 OFF | ON 切旧壳 | 回旧壳/旧页可用；默认仍 OFF（重启核对 localStorage 缺省 off） | 清 flag 回默认 | NOT_RUN |
| B1-G13 成功反馈 | tasks 保存/切换/勾选成功 | 任一成功操作 | 可观察成功反馈（did it work / what changed / what's next），非静默 | 删隔离项目 | NOT_RUN |
| B2 软引用（P2 冻结） | task 抽屉资料区 | 关联 1 个已有交付物，记录 frozenVersion/frozenName | 存储落 `attachments[]` kind=deliverable + 冻结 version 快照；「更新到最新」手动、不自动覆盖历史；unlink 只断联不删源 | 仅断联，源交付物保留 | NOT_RUN |
| B2 progress append revision（P3） | task 抽屉 progressLog | 追加 1 条→再编辑同条 | 不改原文、新写一版进 `revisions[]`、author 非空文本、首版保留；读回两版都在 | 不删 revision | NOT_RUN |
| B2 软删可恢复 | progressLog 一条 | 软删该条（deletedAt）→恢复 | 软删隐藏、置 deletedAt；恢复后回到列表、内容/revision 完整；不清新键 | 可逆，源不物理删 | NOT_RUN |
| B2 安全链接 | task 抽屉链接区 | 合法 https 落库；另试 `javascript:`/`ftp:` | 合法落库；非法协议内联拦截、保留输入、零新增链接 | 拦截即零写 | NOT_RUN |

> 其余 B1-G02~G06/G09/G11/G14、B2-G01~G07 与 200%/drag 留待后续轮，不在首轮 first feedback。

### 2.C MANUAL_PENDING（仅必须用户本人配合，不阻塞自动化，不记 PASS）

| ID | 项 | 说明 | 状态 |
|---|---|---|---|
| B2-M01 | 主人目视「冻结版本 vs 手动更新到最新」交互措辞（P2 已批准，仅措辞手感） | 非阻塞，用户反馈再调 | MANUAL_PENDING |
| B2-M02 | 真实备份/恢复演练主人在场确认（不可逆/恢复动作） | 两步确认+恢复前快照 | MANUAL_PENDING |

---

## 2.5 B4 两入口视觉 cap 迁移（并行解锁；共享契约 `client/shared/ui-contract.md` 冻结版；GUI 归 Main，QA 独立 code/AUTO 审证）

> 边界：B4 只把既有 16 卡/旧布局与两入口（总览 overview + 看板 BoardBento）接进 B1 壳层视觉 cap；**不新增 core schema、不改 panel.tsx（共享 owner 统一接线）、不回写 token、不内联 hex**。布局经 `dashboard put/reset <scope>`（global/user/project）落盘，三层回退 user>project>default；静态 isolation 虽已 90/90 green，**B1 GUI 全 PASS 前仍不称同批发布**。前端 owner TDD 的 `b4-guard.test.ts` 属开发自测，QA 独立判，不直接沿用其 PASS。

### 2.5.A AUTO / 代码静态（QA 可离线判，无需 GUI）

| ID | Given / When / Then | 通过判据 | 状态 |
|---|---|---|---|
| B4-A01 | Given 16 类 widget registry；When 静态清点；Then registry 含全部 16 类、无 disabled/空壳旗标；`knownWidgetTypeSet` 与 registry 同源，默认布局引用类型全部可渲染 | 16 齐；无静默丢卡/空壳 | NOT_RUN |
| B4-A02 | Given 已存旧 layout data；When resolveDashboard/sanitize；Then 三档回退 user>project>default，**已有自定义坐标在网格内被保留**，不被改写成默认（不 reset 成空/默认）；越界/未知类型夹紧或跳过，不崩溃 | 旧坐标保留；回退序正确 | NOT_RUN |
| B4-A03 | Given 总览（单项目视图）；When 切项目/跨 project；Then overview 按**单 scope** 取数，不串项目、不把 user 级布局错套到另一项目；健康分/完成率/KPI 复用 core 纯函数，视图不手算 | 单 scope；复用 derived/war-room | NOT_RUN |
| B4-A04 | Given 卡片自定义 source / formula / filter / sort / history 配置；When 落盘读回；Then 各自定义项随 layout 持久化并读回一致，不被迁移/收紧覆盖 | 五项自定义读回一致 | NOT_RUN |
| B4-A05 | Given CSS；When 扫 board.css/overview.css；Then 零裸 hex/rgb 硬编码，全部引用 `.pm-shell` token；深浅跟随 `body[data-ds-dark-theme]` | 零硬编码色 | NOT_RUN |
| B4-A06 | Given customMarkdown；When 渲染；Then 走既有零 DOM/innerHTML/eval 安全 renderer，无 XSS/注入，不新增 dangerouslySetInnerHTML | 安全 renderer 输出 | NOT_RUN |
| B4-A07 | Given 保存失败/取消；When dashboard put 报错或用户取消；Then 内存改动不落盘、已存 layout 不被部分改写（保旧 layout），不出现「成功假态、重进丢失」 | 失败保旧；零假成功 | NOT_RUN |

### 2.5.B GUI 真实主端（Main 采证，QA 判；1440/1024/768/390 × 浅/深 ×200%）

| ID | Given / When / Then | 通过判据 | 分层 | 状态 |
|---|---|---|---|---|
| B4-G01 | Given 拖动改卡片宽/高；When 调整尺寸并保存；Then 宽/高落盘，刷新后按 canonical 网格落位，跨断点（12/8/4 列）投影不挤压、不溢出 | 宽高持久+canonical 落位 | GUI | NOT_RUN |
| B4-G02 | Given 自定义布局；When 刷新 → 重启应用；Then 自定义 source/formula/filter/sort/history 与坐标/尺寸读回一致 | 重启读回一致 | GUI | NOT_RUN |
| B4-G03 | Given 跨视口；When 拖窗/切断点；Then 卡片只做合法 canonical 重排，**不自动异常搬位/跳位/堆叠错位**；无碰撞重叠 | 无异常搬位/碰撞 | GUI | NOT_RUN |
| B4-G04 | Given 切换项目；When 进总览；Then 单 scope 数据正确、不串项目；两入口空/无结果/陈旧/错误七态齐备 | 单 scope+七态 | GUI | NOT_RUN |
| B4-G05 | Given pilot off；When 关闭 `pm-b1-pilot`；Then 两入口回旧壳/旧布局原样，新视觉层不显现 | off 回退原样 | GUI | NOT_RUN |
| B4-G06 | Given 全视口；When 交互；Then console 0 error；200% 与 390 无横滚/裁切/断裂 | consoleErrors=[] | GUI | NOT_RUN |

> B4 放行前置：静态 isolation 90/90 green、vitest 624 PASS（QA 2026-10-20 独立复跑）仅代表静态/AUTO 层；**B1 GUI（Main 采证全态/跨宽/刷新重启）未全 PASS 前，B4 不称发布**。

---

## 2.6 B6 records 前端切片（meetings / reports / deliverables 的 views+CSS+tests；front slice `s_000EuZNBH3B`；只改 views/CSS/tests，不碰 panel.tsx/core，props 交 front owner 接线）

> 边界：本切片是既有 records 三页的视觉/投影迁移，**不实现 data reports 持久 API**（数据 owner 稍后交合同，未交前相关项 NOT_RUN/BLOCKED，不得 PASS）。P3 周期 progress 的 preview 只**引用** sourceId+revision 并 freeze 展示，不回写日志（append-only 语义归 B2）。静态 isolation 已 green，但 B1 GUI 未全 PASS 前，下游切片可同授权批次实现，**不称下一功能已 PASS/已发布**。

### 2.6.A AUTO / 代码静态（QA 离线判）

| ID | Given / When / Then | 通过判据 | 状态 |
|---|---|---|---|
| B6-A01 | Given 既有 reports 快照；When 视觉迁移；Then 旧 frozen snapshot（真实计数/snapshotAt/字段）保持不变，restyle 不改数据、不清空历史 | 快照计数/字段逐位保持 | NOT_RUN |
| B6-A02 | Given P3 按周期 progress 选 preview；When 选定一条 revision；Then 存 sourceId + revision id，内容 freeze 成快照；重新打开该预览，日志原文/修订不被后续编辑改动（预览不回写 progressLog） | sourceId/revision 落存；freeze 不变 | NOT_RUN |
| B6-A03 | Given legacyMD（旧命令备注）；When 投影；Then `splitLegacyCommandNote` 只读拆分展示，legacy command 以 code 呈现**不执行**；正文走安全 MarkdownView（零 innerHTML/eval） | 只读投影；无执行/注入 | NOT_RUN |
| B6-A04 | Given meetings/reports/deliverables 同名字段；When CRUD/history；Then 既有字段 CRUD 与 history 记录保留；无「原型 disabled」空壳（禁用按钮须有真实禁用原因，不批量置灰冒充完成） | 字段闭环；无假 disabled | NOT_RUN |
| B6-A05 | When 清点改动文件；Then 仅 views/*.tsx、对应 *.css、tests；**不出现 panel.tsx / core/** 改动；新视图 props 由 front owner 接线，切片不自接壳层 | 改动面合规 | NOT_RUN |
| B6-A06 | When 扫三页 CSS；Then 零裸 hex/rgb，全引 `.pm-shell` token，深浅跟随 `body[data-ds-dark-theme]` | 零硬编码色 | NOT_RUN |
| B6-A07 | Given data 补 `selectedRefs` 复合键（taskId+entryId+revisionId，替代局部 `selectedEntryIds`）；When 两条不同 task 恰有相同局部 entry 序号；Then 引用不跨 task 碰撞，解析到唯一 task/entry/revision；伪造或悬空 taskId/entry/revision 一律拒且零写 | 复合键无跨 task 碰撞；拒伪造引用 | NOT_RUN（待 data 合同） |
| B6-A08 | Given preview 选定某 revision 并 freeze 成 contentSnapshot；When 后续编辑该 entry 新增 revision；Then 已存预览仍绑定原 revision 内容，不被新文替换；contentSnapshot 必须与所选 revision 逐位一致，禁止用最新正文冒充冻结快照 | freeze 版本一致；拒冒充 | NOT_RUN（待 data 合同） |

> B6-A07/A08 为 data owner 补 `selectedRefs` 复合键后 QA 新增的防伪造 AUTO 用例；**不阻塞当前基础 candidate 首 GUI 启动**，B6 自身在合同+用例绿前不称 PASS。

### 2.6.B GUI 真实主端（Main 采证，QA 判；1440/1024/768/390 × 浅/深 ×200%）

| ID | Given / When / Then | 通过判据 | 分层 | 状态 |
|---|---|---|---|---|
| B6-G01 | When 键盘/点选三页控件；Then `:focus-visible` 2px 环可见，浅/深/200% 无裁切、无二维横滚、不错位 | 焦点可见+响应式 | GUI | NOT_RUN |
| B6-G02 | Given 选过的周期 preview；When 重开/刷新；Then freeze 内容与所选 revision 一致，后续日志编辑不改变已存预览 | freeze 重开一致 | GUI | NOT_RUN |
| B6-G03 | Given 三页 CRUD；When 新增/编辑/取消；Then 往返读回一致、history 保留、取消保输入；失败不清空 | CRUD+history+保输入 | GUI | NOT_RUN |
| B6-G04 | Given data reports 持久 API；When 合同未交；Then 该项保持 BLOCKED/NOT_RUN，不以前端静态冒充持久 PASS | 未交不 PASS | GUI | BLOCKED |

### 2.7 B5 视觉切片附录（gantt / risk-issues / people；先满足 slice TDD，GUI 归 Main）

> 边界：仅三页视图视觉/cap 迁移与对应 CSS/tests，不改 panel 数据逻辑、不动 core、不新增 schema；既有排期/风险/人员行为不回归。B1 GUI 未全 PASS 前仅并行 TDD，不称发布。

#### 2.7.A AUTO / 静态（QA 离线判）

| ID | Given / When / Then | 通过判据 | 状态 |
|---|---|---|---|
| B5-A01 | Given gantt 视图；When 迁移；Then 既有排期/里程碑条、日期轴、今日线、依赖显示不丢失、不重置用户缩放/排序 | 行为零回归 | NOT_RUN |
| B5-A02 | Given risk-issues 双 tab（risk/issue）；When 迁移；Then tab 切换、概率/影响分级色、状态筛选保留，旧数据可读 | 双 tab+分级保留 | NOT_RUN |
| B5-A03 | Given people 视图；When 迁移；Then 成员/分工/负载字段展示与既有分组不退化 | 字段闭环 | NOT_RUN |
| B5-A04 | When 扫三页 CSS；Then 零裸 hex/rgb，全引 `.pm-shell` token，深浅跟随；改动仅 views/*.tsx + 对应 css + tests，不碰 panel.tsx/core | 零硬编码+改动面 | NOT_RUN |

#### 2.7.B GUI（Main 采证；1440/768/390 × 浅/深；200% 本轮 NOT_RUN）

| ID | Given / When / Then | 通过判据 | 分层 | 状态 |
|---|---|---|---|---|
| B5-G01 | When 逐页进入 gantt/risk-issues/people；Then 无 console error、无横滚裁切、`:focus-visible` 可辨、浅深一致 | 零错误+可辨 | GUI | NOT_RUN |
| B5-G02 | Given 隔离项目；When 各页 CRUD/切换往返；Then 读回一致、取消保输入、失败不清空 | 往返+保输入 | GUI | NOT_RUN |

### 2.8 B3 安全文件附件（safe-file；data owner 实现，QA 先用例后验代码；策略已定，非产品 blocker）

> **安全策略已定（owner 默认安全基线，不再挂「U2 待用户」开放项，不阻塞 B1/B2 发布）**：
> - 默认上限 **10 MiB**，可经配置项调整；超限拒绝并报大小原因。
> - **扩展名 + magic 头双白名单**：放行 pdf / png / jpeg(jpg) / gif / webp / md / txt / csv；**active 内容一律拒**：exe/二进制可执行、html、svg（内联脚本风险）、script、伪装扩展名。
> - 归档（zip/tar/7z 等）**不解包、不递归、不执行内部条目**，按策略拒或仅存原始字节。
> - 落盘走**真实新 file+db API**（不借道 B2 的 link/deliverable 软引用）；sha256 content-address 寻址；tmp 取消/失败清理；并发幂等；文件根 nofollow/禁穿越；file 字节 + db 记录一起备份往返。
> 代码未实现前各用例仍 **NOT_RUN**（不伪造可用），但产品口径已闭环，仅待实现+QA 离线复验。

> **mainform 原子落盘要求（staging/finalize，2026-10-20 补）**：
> - 当前初始路由只适合「已保存任务的 quickmanage 即时挂载」；**mainform 新建/编辑表单不得在最终表单保存前就立即落盘附件**。
> - 流程须为 **staged upload（暂存到独立暂存区/ticket）→ 表单最终保存成功时 finalize 绑定并提交 file+db**；表单取消/校验失败/放弃关闭时，暂存文件与 db 草稿引用必须全部清除（零文件、零 db 记录），不得留孤儿字节或半截引用。
> - **不接受 UI 在 create/edit 里把文件「藏」进隐藏字段/本地态冒充已挂**；未 finalize 即未保存，刷新/重进不得出现幽灵附件。
> - QA 审计时机：待 data positive/cancel 测试 + backup 往返完成后再独立审；此刻初始路由为 partial，QA 不提前下 PASS。

#### 2.8.Gate AUTO 离线复验门（代码到位后 QA 直接跑，不启服务）
1. 默认阈值常量=10 MiB（10×1024×1024）；配置项覆盖后按新阈值判定（B3-A01）。
2. 逐类型喂真实 magic 头样本：合法 8 类通过；改扩展名伪装的 exe/html/svg/script 被 magic 拒，零写（A02/A03）。
3. 归档字节落盘后不出现解包目录/执行痕迹；路径 `../`、绝对路径、软链均被拦在文件根内（A04/A08）。
4. sha256 寻址：同内容二次上传不产生重复字节；并发同内容/同名 id 唯一、无撕裂（A05/A07）。
5. 取消/失败后扫描无 `.*.tmp` 残留、db 无半截记录（A06）；mainform staged 取消零文件零 db（A11），成功才 finalize file+db（A12）。
6. file 字节 + db 元数据备份→恢复往返一致、可再取、新键不清（A09）。
7. md/txt/csv 预览走安全 renderer；html/svg 不被当可执行内容渲染（A10）。
8. staging 生命周期：暂存 noDB（A13）、新建 finalize 挂文件（A14）、单次 op 失败保留暂存可 retry（A15）、abort 全零（A16/A19 cancelDELETE）、filename 净化（A17）、跨项目隔离（A18）；前端：stageEnabled 双条件 assetUpload&stageCancel（A20）、StrictMode/unmount 不误删（A21）、摘除别名（A22）、取消网络失败 TTL（A23）、成功不伤正式资产（A24）、abort 竞态唯一落库（A25）。
9. 审计时机：待 positive 集成测试 + backup 往返完成后 QA 独立审，此刻 code27 为 partial，不提前 PASS。

#### 2.8.A AUTO / 静态（QA 离线判，代码到位后验）

| ID | Given / When / Then | 通过判据 | 状态 |
|---|---|---|---|
| B3-A01 | Given 默认上限；When 上传 >10 MiB；Then 拒绝并报大小原因，零写、不留 tmp；配置项可调上限后按新阈值生效 | 超限拒+零写+可配置 | NOT_RUN |
| B3-A02 | Given 白名单类型；When 上传 pdf/png/jpeg/jpg/gif/webp/md/txt/csv；Then **magic 头校验通过**（非仅看扩展名），落 content-address 存储 | magic 双校验通过 | NOT_RUN |
| B3-A03 | Given 伪装文件；When 改扩展名把 exe/html/svg/script 伪装成 .png 等；Then magic 不符即拒，零写；active exe/html/svg 一律拒（SVG 内联脚本风险） | 伪装拒+零写 | NOT_RUN |
| B3-A04 | Given 归档（zip/tar/7z 等）；When 上传；Then 不解包、不递归扫描内部、不执行内部条目；按策略拒或仅存原始字节 | 不解包不执行 | NOT_RUN |
| B3-A05 | Given 落盘；Then 以 sha256 为 content-address 命名/寻址，同内容重复上传幂等去重，不产生重复字节 | sha256 寻址+幂等去重 | NOT_RUN |
| B3-A06 | Given 上传中取消/失败；When 中断；Then tmp 临时文件被清理（无 `.*.tmp` 残留），db 不留半截记录 | tmp 清理+无半截 | NOT_RUN |
| B3-A07 | Given 并发；When 同内容/同名并发上传；Then 幂等不撕裂、不重复落盘、id 唯一；并发写经串行队列 | 并发幂等无撕裂 | NOT_RUN |
| B3-A08 | Given 路径；When 落盘；Then 禁止 `../` 穿越、nofollow 软链，不越出文件根目录 | 无穿越/软链逃逸 | NOT_RUN |
| B3-A09 | Given 备份；When file 字节 + db 记录一起备份→恢复；Then 字节与元数据往返一致、可再取，新键不清 | file+db 往返 | NOT_RUN |
| B3-A10 | Given 渲染；When md/txt/csv 预览；Then 走安全 renderer，html/svg 不被当可执行内容渲染 | 安全预览 | NOT_RUN |
| B3-A11 | Given mainform staged upload；When 用户在表单最终保存前取消/校验失败/放弃关闭；Then 暂存文件被清除、db 无半截/草稿引用，文件根无孤儿字节（file=0 且 db=0） | 取消零文件零 db | NOT_RUN |
| B3-A12 | Given mainform；When 表单最终保存；Then 成功路径才 finalize 绑定 file+db；失败回滚不留孤儿；不存在隐藏字段/本地态冒充已挂附件 | finalize 原子+无隐藏冒充 | NOT_RUN |
| B3-A13 | Given staging；When 暂存成功但未 finalize；Then 文件落暂存区，db **无任何记录/引用**（staging noDB），不进正式附件表 | 暂存零 db | NOT_RUN |
| B3-A14 | Given 新建任务 mainform；When 表单最终保存成功且已选文件；Then finalize 把文件绑定到新任务（newtask addFile），单条命令/单次原子落 file+db | 新建 finalize 挂文件 | NOT_RUN |
| B3-A15 | Given 单次 op 失败（finalize/绑定失败）；When 失败回滚；Then 已暂存文件保留可重试（failed op stage keep），不强制清空，retry 成功重新绑定，无重复字节 | 失败保留可重试 | NOT_RUN |
| B3-A16 | Given 用户 abort/中途放弃；When 离开；Then 全链零残留（无暂存字节、无 tmp、无 db、无半截引用），abort zero | abort 全零 | NOT_RUN |
| B3-A17 | Given 落盘命名；When 暂存/finalize；Then filename 经净化/控制（去路径分隔/穿越、规范化、不暴露原始任意名），content-address 寻址优先，不把用户文件名当落盘路径 | filename 净化控制 | NOT_RUN |
| B3-A18 | Given 跨项目；When A 项目暂存/挂载文件；Then 不可被 B 项目下载/引用/枚举（project cross 隔离），无跨项目可见泄漏 | 跨项目隔离 | NOT_RUN |
| B3-A19 | Given 取消暂存；When cancel；Then 暂存文件被 DELETE 清除（cancelDELETE），与 A11/A16 互证零残留 | 取消删除暂存 | NOT_RUN |
| B3-A20 | Given 功能开关；When 前端评估 stageEnabled；Then 必须同时具备 assetUpload 与 stageCancel 才启用暂存 UI，缺任一不暴露暂存入口（stageEnabled requires assetUpload & stageCancel） | 开关双条件门 | NOT_RUN |
| B3-A21 | Given React StrictMode/unmount 重挂载；When effect 清理；Then 清理逻辑不得误删已提交/已 finalize 的正式资产或误清 committed 引用（cleanup not accidental），仅清本组件临时态 | 重挂载不误删 | NOT_RUN |
| B3-A22 | Given 暂存清单；When 用户 remove alias refs；Then 仅摘除本次别名/待挂引用，不触碰已绑定正式资产，可重新选择 | 摘除别名安全 | NOT_RUN |
| B3-A23 | Given cancel；When 取消时遇网络失败；Then 仍按 TTL 兜底清理本地暂存/临时态（cancel network failure TTL），不永久悬挂孤儿 | 失败 TTL 清理 | NOT_RUN |
| B3-A24 | Given 成功提交；When finalize 成功；Then 不得改写/删除/截断已存在的正式 final asset（successful submit no damaging final asset），只新增绑定 | 成功不伤正式资产 | NOT_RUN |
| B3-A25 | Given aborted upload；When abort 与完成竞态（aborted upload race）；Then 无半截文件、无重复 finalize、无孤儿字节，胜者路径唯一落库 | 竞态唯一落库 | NOT_RUN |

#### 2.8.B GUI（Main 采证；UI 接线实际可用后才转 Ready）

| ID | Given / When / Then | 通过判据 | 分层 | 状态 |
|---|---|---|---|---|
| B3-G01 | Given 隔离项目；When 选合法文件上传；Then 进度/成功反馈、列表见文件、可下载/移除，取消保状态 | 上传闭环 | GUI | NOT_RUN |
| B3-G02 | When 超限/伪装/归档被拒；Then 显原因、保输入、零残留 | 拒绝可读 | GUI | NOT_RUN |
| B3-G03 | Given mainform 新建/编辑选了文件未保存；When 取消/校验失败/放弃；Then 重进/刷新无幽灵附件，暂存零残留；仅最终保存成功才见文件 | 取消零挂载无幽灵 | GUI | NOT_RUN |
| B3-G04 | Given 前端 staged UI；When assetUpload/stageCancel 缺任一；Then stageEnabled 不成立、不暴露暂存入口；StrictMode 重挂载/卸载不误删已提交资产，摘除别名/取消/成功提交各态反馈闭环 | 开关门+重挂载安全 | GUI | NOT_RUN |

---

## 3. 证据模板（每条用例回填）

```
用例ID:
被测 HEAD SHA / 工作树指纹:
环境: macOS arm64 / Node22 / pnpm11.28.5 / 隔离实例端口(非正式3080/3091)
分层: AUTO / GUI / MANUAL_PENDING
Given: / When: / Then:（实际观测，非预期复述）
原始证据: 截图/录屏/日志/存储快照diff 路径；observed>measured>DOM>截图
结论: PASS / FAIL / BLOCKED / NOT_RUN / MANUAL_PENDING
缺陷（若FAIL）: 现象/可复现步骤/证据/建议修复，交开发，测试专家不改码
```

## 4. 失败退回（路线图 §B1/§B2/§4）

- B1：flag 关闭回旧壳/旧页，不删旧实现；批前本地导出版本化安全快照。
- B2：关闭两区入口；旧任务缺新键照常读；**新键保留不清**；先做新旧读写往返测试与版本化快照；若旧版拒绝新字段/写入会丢数据，只回退界面并保留兼容数据层，不直接降级二进制，后果性降版/恢复须明确目标范围后人工确认。

## 5. 本批声明

本文件为开发前冻结计划，**GUI 用例 NOT_RUN，无 final PASS；首返回仅文档更新，非 final GUI**。P1–P3 已批准、U1 方案 A（task 可选 arrays）已批准；B4（§2.5）/B6（§2.6）为并行切片附录，静态/AUTO 可先审，GUI 归 Main。QA 独立复跑静态层：isolation 90/90、vitest 60 文件/624、B2 AUTO 23/23（C8 已修，见 b2-audit 记录）；**静态 green ≠ 发布，B1 GUI 全 PASS 与 Main 采证前，B2/B4/B6 均不称上线**。首轮 Main 操作请求见 `main-first-journey-request-20261020.md`。QA 不做业务实现，只 own 本测试计划。
