# A10 会议 GUI 原证独立有界审证

> 给 Main 与后续独立专家使用：审查已归档真实画面、候选/装载与原 record 字段，分别判定局部保存、样式缺陷及缺证边界。2026-10-21，平台 trae，独立审证角色；不执行 GUI，不签 R8、B8、全部 kinds 或父总门。

## 1. 结论

**本轮存在局部 GUI 样式 FAIL：A10-MGUI-F01，P1。** 真实 1440×900 浅色会议抽屉中，行动项行与添加按钮重叠；第二行动项进入相邻栅格列，关联控件横向越出可见抽屉。实际主保存及字段保留的局部证据成立，不抵销此缺陷，不签会议整项通过。

| 对象 | 独立结论 | 证据范围 |
| --- | --- | --- |
| 已存空 actions 会议，两次主保存后关闭/重开 | **有限 GUI 行为及归档 record PASS** | `actions-r2` 主按钮提交中→关闭→真实编辑重开；首次 ai-001、第二次 ai-002；含“失败”的原标题未清洗。不是首次新建会议原子创建，不是同时新增两个 action |
| task 关联保存/解除，稳定 ID 与来源 | **有限归档 record PASS** | ai-001→t-0001、ai-002→t-0003；clear 主保存后两 taskId=null，ID/标题/状态/来源/会议其他字段保留。选择值有 DOM 原件，但关联控件在画面中被裁出，不签可视选择器体验 PASS |
| 第一新行未保存前草稿零写；clear 草稿零写；已存行改标题后取消零写 | **有限 data hash PASS** | `before=draftRoot`、`before=draft`、`cancelBefore=after`。只覆盖归档 data 字典，不代表 files/backups 三根或全机零污染 |
| 两行与添加按钮的布局/控件可见 | **FAIL，A10-MGUI-F01** | 第一行与添加按钮叠占；两 action 横向并排，状态/关联/保存等越出抽屉。PNG 与连续帧复现，不用根 scrollWidth 相等否认 |
| 同项目 task 候选、跨项目/risk 排除 | **有限 DOM/fixture 核对 PASS** | F5 同项目 t-0001/t-0003 在候选；跨项目 t-0002 不在；ri-0001 为 risk，问题列表仅空项。不是后端非法引用守卫 GUI 实测 |
| 合法 issue 正关联与解除、全部 kinds | **NOT_RUN，不签全集** | F5 没有 issue；null→null 不是问题关联成功/解除。没有为补验手改 fixture 或产品 |
| 实际命令 payload、完整 rawdisk 字节与逐检查点 wrappers | **BLOCKED，归档补证** | 审查时指定目录仅有页面状态、frames、PNG、boundary；boundary.first/second/saved 是完整 wrapper，但未找到传输 payload、rawdisk 原文件及 cancel 后 wrapper，不能将 count/说明补成原证 |
| 新增行填稿后取消、同一次主保存改两旧行标题/状态 | **NOT_RUN** | 现有取消是已存 ai-001 标题编辑；现有成功是先新增一个，再保 ai-001并新增第二个，不能替换原 LG-G01b 两旧行内容/状态修改合同 |
| 来源跳转、转任务/重复转、失败 retry、窄/深、原生菜单、真实 restart、完整旅程 | **NOT_RUN** | 未采本轮相应原证；Main-only 不转成 MANUAL_PENDING。浏览器重开编辑不等服务 restart |

继承 [A10 成功信封/预检独立报告](a10-preflight-success-independent-retest-20261021.md) 中绑定同源的 A9-F01 SOURCE/AUTO 有限 PASS；该报告四组合失败恢复不扩大成本轮真实 GUI retry PASS。历史 [A9-F01 FAIL](a9-existing-entries-independent-retest-20261021.md#4-确证缺陷与最小修复合同) 保留。GUI 含“失败”新行成功只证明实际此分支，没有复跑所有错误词、两旧行修改及故障恢复。

## 2. 授权与执行分离

本角色原句范围：

> 独立GUI原证审证有界，只写docs/testing/a10-meeting-gui-independent-review-20261021*+selftmp，无GUI/product/service/build/private-runtime/credentials/otherdocs/commit。父持续全部在途验收，Main唯一GUI。

同条派单另明确：保原标题及 r1 设施失败；当前 action 为顺序保存，不扩 atomic 多 action；按实际字段、ID/来源匹配，不从 count 自签；发现错误给最小合同；完成有限报告释放，不签 R8/B8/总门。

已读 AGENTS、collaboration §9/11、A8 layergap LG-01/01b §4/5、A9 独立 F01 与 A10 独立有限 PASS、当前父接续。主树为多角色在途 dirty 候选；本角色未 fetch/pull/install、未运行产品测试/build/verify、未连接 GUI/服务，也未进入 `/private/tmp/pmtool-a10-*-runtime-*` 或读取凭据。通用地基/更新其他档案/提交步骤不执行，以本次明示子角色边界为准。

Main 是 GUI 原证采集者/唯一 builder，当前专家只读原件和既有冻结源码、输出自有审证。父持续验完在途/最后 commit 的授权未转成本专家产品或提交权限；不暂停父不受影响工作。

## 3. 候选与实际装载

原证根 `reports/all-pending-evidence-20261021/A10/`；本轮机械核验与完整输入指纹见 [audit.json](a10-meeting-gui-independent-review-20261021-selftmp/audit.json)、[inputs.json](a10-meeting-gui-independent-review-20261021-selftmp/inputs.json)。

| 身份层 | 实际核对 |
| --- | --- |
| 插件基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，仅基线，不单独代表 dirty 候选 |
| 宿主认领 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`，按 candidate 原证，不重签上游授权 |
| dirty patch | `product-tracked.patch` SHA256=`caddc276e6b83d6f79850cc8c1490afdc6a1c5f9409cd8d160fa066cc632c715`，逐字节核验 |
| SOURCE 接缝 | 12 文件既有冻结字节与 candidate.sourceHashes、build/sync.sourceHashes 全匹配，sync.drift=[]；含 ui-feedback、panel、meetings、records-form/payload/callbacks/props、meeting core/command 及 records.css/panel.css |
| actual client 产物 | `build/artifacts.json` 的 client SHA256=`894a515cee081225687ef8ba887f55a51762ecc481c0d3c3613f035e9c202d2f` |
| actual 下发 | `restore/loaded-r1/combo-1.txt` 2572530 bytes，SHA256=`e16c70d5a75b368794d53754fd1fb8a3aba0f0a0c0f3fe3a3ac7023992ab21a2`；响应200、fromDiskCache=false；完整归一化插件片段1693698 bytes，first=875361、second=-1，片段 SHA256=`290b15739e68234c86f752bbced448e0e0a61790a2b1c7a46d13ff00563babc4` |
| 原 GUI 上下文 | origin=`http://127.0.0.1:3224`，timeOrigin=`1792597194924.6`；loaded-r1 与全部 r2/clear-cancel 页面状态一致；pilot=off、PM mounted=true、1440×900、dark=false |

完整下发里 `records_default` CSS 经结构化字符串解码，与冻结 `records.css` 逐字节相等。`records-meeting-form.tsx` SHA256=`80315b722efe83d0508a407e2cab3496ac175191fa3ca1bf2ce65d6c1aa9edcf`；`ui-feedback.ts` SHA256=`3808eef79e34595754ea9d8970d62c5c5da87feb1f42722eba593a061f1bbde7`。因此不能把本轮关联写回误归给 A8 旧源或旧错误词接受函数，也不能把真实当前样式缺陷说成仅旧截图。

不读取活跃私有运行目录/主树 lib，不另建服务；runtime 路径只是 environment 原件的声明。无法通过页面 count 推导生产守卫、提交次数或唯一生成协议；正式版本身份/父总门也不由上述 hash 放行。

## 4. 原始对象与逐帧判读

### 4.1 合法 F5 初态

`restore/seed/boundary.json` 指向原专家 `materials-files-reports-independent-auto-20261021-fiKpOr/fixtures/F5/backup.json`，precheck 的 before=first（data/files/backups）；本报告只核种子/恢复关联，不重签恢复整门。

原会议 `mtg-0001/projectId=p-0001/title=F5会议`，date=2026-10-21，actions=[]，status=draft，decisions=[保留标准来源]，sourceType=manual/sourceSessionId=null，createdAt=2026-10-21T13:44:55.241Z。不是种子已存 ai-001/ai-002 的富历史会；不得按数组位置把这个空初态称旧双行动项编辑实测。

同项目任务 t-0001=`1 F3-fixture-F5`、t-0003=`2 F5共享文件任务`；控制 t-0002 属 p-0002。F5 仅 ri-0001=`F5风险/type=risk`，无 issue。

### 4.2 61 帧全部查看与关键 PNG

全部 frames.json 中 SHA256 与 JPG 一致：actions-r1 3 帧、actions-r2 38 帧、clear-cancel 20 帧，共61；已通过自有九张 [contact 联系表](a10-meeting-gui-independent-review-20261021-selftmp/contact/) 逐张逐格目视，不用张数当 PASS。联系表是原 JPG 的缩放索引，不是新 GUI 执行或合成实测。另直接查看 first-draft、second-draft、reopened、cancel-draft 原 PNG。

| 连续帧（分支内） | 真实目视现象 | 独立判读 |
| --- | --- | --- |
| actions-r1 000000–000002 | 已存会议真实编辑，添加空新行/焦点进入标题，未见成功保存 | 依派单保留 aria 命名设施错误轮；无原错误日志，不凭帧补造报错文本，不定产品 FAIL |
| actions-r2 000000–000004 | 新行标题输入保持“失败待重试一”，底部主“保存会议”可见；添加按钮与行内输入叠占 | 合法错误词标题未删；布局缺陷已存在 |
| actions-r2 000005–000013 | 主按钮显示“提交中…”，会议/行动项成功回告，抽屉关闭，显示一行动项 | 第一真实主提交流程成立；不借回告倒推命令次数或 payload |
| actions-r2 000014–000023 | 真实编辑重开，第一行动项保留，添加第二行并输入“第二行动项” | 第二行被排到第一行右侧；两个 action 未成为独立全宽行 |
| actions-r2 000024–000030 | 第二次主按钮提交中，ai-001 更新/ai-002 新增回告，抽屉关闭、两行动项显示 | 顺序主保存局部分支成立，不称跨实体原子/两新行一次保存 |
| actions-r2 000031–000037 | 再次真实编辑重开，会议标题输入获焦 | opener 与重开实际发生；最终帧在表单上部，不能用它声称全部 action 控件可见 |
| clear-cancel 000000–000010 | 主提交中→会议/两 action 更新回告→关闭显示两条 | 配合 clear-draft SELECT 原值与 saved wrapper 证明两 task 关联解除；菜单本身未被录出 |
| clear-cancel 000011–000019 | 编辑重开→第一旧 action 改“取消草稿不落盘”→取消关闭，页面保留原标题 | 仅已有行改标题取消；不冒称新增行取消或 cancel 后再次重开 action 输入 |

### 4.3 字段与 ID，不按 count

`actions-r2/boundary.json` 的 first/second、`clear-cancel/boundary.json` 的 saved 均为 `{version:2,record:{...}}` 完整 wrapper。

| 实际 record | actions 精确字段 |
| --- | --- |
| first | ai-001，title=`失败待重试一`，owner=""，dueDate=null，status=todo，taskId=t-0001，riskIssueId=null |
| second | 原 ai-001 所有字段同 first；新增 ai-002，title=`第二行动项`，owner=""，dueDate=null，status=todo，taskId=t-0003，riskIssueId=null |
| saved（clear） | 两项 ID/标题/owner/dueDate/status 保留，只将各 taskId 改 null；riskIssueId 原本为 null、仍 null |

独立逐字段比较：三 wrapper 的 meeting 除 actions/updatedAt 外与 F5 原件全部相同，包括 id/projectId、标题/日期、排期、participants、summary/topics/decisions/notes、sourceType/sourceSessionId、createdAt。不借旧 count=2 声称同 ID/来源保留。

数据 hash：actions.before=draftRoot，actions before→after 仅 `/pmtool/meetings/mtg-0001.json` 改变（21键）；clear.before=draft（21键），cancelBefore=after（21键）。取消后会议 hash 是已 clear 版本 `dc27a256a30f02c2006785ca57888a4e053f19facb395a902c38a7186c6fe37e`；无新增/删除 data 键。actions after 会议 hash=`b333c1dee5d544861d6c73d229d53b71d54670a73ff3b5edc1f1c34165c26c69` 与 clear.before 对接。

这些字典只含 data（包含宿主 workspace/session 条目），不是每个时点的 data/files/backups 三根；不把同名 before/draft/after 三张字典说成三种写根。clear saved wrapper 没有配套 rawdisk 文件，不能以重新 JSON.stringify 字节假造原磁盘 digest；本轮只签其实际原 record 字段及记录的 data hash 等值。

## 5. 缺陷与 Main 最小合同

### A10-MGUI-F01：行动项行溢出/重叠（P1，局部 GUI 样式 FAIL）

确证原件：

- [first-draft.png](../../reports/all-pending-evidence-20261021/A10/meeting/actions-r2/first-draft.png)：03 行动项区添加按钮叠在负责人/截止输入附近，右侧状态及关联控件超出当前画面。
- [second-draft.png](../../reports/all-pending-evidence-20261021/A10/meeting/actions-r2/second-draft.png) 与 [cancel-draft.png](../../reports/all-pending-evidence-20261021/A10/meeting/clear-cancel/cancel-draft.png)：两标题横向并列，不是两个完整 action 行，右侧被裁。
- r2 000000–000009、000017–000028、clear 000016–000017 连续复现；主按钮仍可执行不等所有关联控件可见。

来源吻合：`records-meeting-form.tsx:265-339` 把 `.rb-action-row` 和添加按钮直接放进通用两列 `.pm-form-section-grid`；已实际下发 `records.css:122-133` 的 action 行为七列 grid，未全宽占父栅格，子输入没有足够的收缩/换行约束。`panel.css:1039-1041` 为父两列 minmax 栅格。此为源码支持的最小定位，不冒称已采浏览器 computed style/实际 bbox；根 `.pm-shell scrollWidth=clientWidth` 不证明嵌套抽屉无溢出。

Main 最小文件/行为合同：

1. 只修 `packages/dsh-pm-tool/src/client/views/records/records-meeting-form.tsx` 与局部 `client/views/records.css`，新增/更新对应布局合同测试；优先专属 action 容器/全宽行与可收缩控件，不改全局 panel 栅格影响其他表单。
2. 每个 stable action 自成可见完整行；标题/负责人/截止/状态/task/issue/行保存/转任务/删除及添加按钮不重叠，关联标签/值可读，主保存和取消可达；随抽屉实际宽度换行。保现有选项筛选、同项目保护、顺序 callbacks、ID/来源、原标题、失败保稿与取消语义。
3. 不新增 atomic 多 action、事务、新建原子会议、owner popup、issue fixture 回填或清理旧原证。样式修复导致相关 GUI 旧证失效，A10 F01 SOURCE/AUTO 接受语义若未变可由专家按 diff 有界继承。
4. Main 新候选/diff/source→唯一隔离 build→actual 下发 hash 后，按本次已批准局部合同重采1440浅色0/1/2行动项编辑/关联/clear/取消真实完整可视流程。原 LG-G01/01b 窄深/原生菜单/故障等未测项仍由父既定合同推进，不凭此次新缺陷强制启用待表决四视口矩阵。

### A10-MGUI-E01：证据归档补充，不是产品缺陷

派单称 r2 已有完整源码 payload/rawdisk/records；**本角色实际只找到上述 boundary wrappers，未找到这些完整原件**。请 Main 在其既有采证所有权内追加脱敏原命令/返回结构、原磁盘字节及逐检查点完整 wrapper/路径/sha，保旧 r1/r2，不按 source 推算 payload，不重序列化冒原 disk。新增行取消需要新增行填稿→取消→回读的原证；现有已存行取消不能替代。

这里只给最小补证对象；本专家不进入私有运行目录补捞、不点 GUI、不改产品，不用当前 BLOCKED 伪造成 PASS。合法 issue 正向、失败 retry 与其他未采旅程仍 NOT_RUN，不为本轮造无授权新种子。当前 F5 风险排除正确，不是 issue 列表为空的产品 bug。

## 6. 复核命令与释放

运行环境：macOS/bash，nvm Node `v22.23.3`；只用 Node 标准库、系统 Swift/AppKit 读本地图片。无产品依赖安装、pnpm 产品执行或 browser 工具。自有 Swift module cache 与联系表均在本前缀 selftmp。

在仓库根实际执行：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a10-meeting-gui-independent-review-20261021-audit.mjs
swift -Onone \
  -module-cache-path docs/testing/a10-meeting-gui-independent-review-20261021-selftmp/swift-cache \
  docs/testing/a10-meeting-gui-independent-review-20261021-contact.swift
```

- audit 首轮175输入 exit0；补核 records.css/panel.css 与 actual CSS 字符串后177输入 exit0、输入漂移=[]、12源码匹配、61帧hash一致、精确字段及三条 data 零写断言成立。机械 exit0 不等 GUI PASS。
- contact 首轮解释进程 PID24035 已退出；随后同步命令 exit0，3/38/20全部输出九张联系表。没有应用 UI 操作或系统截图；原件只读。
- Main build 原 exit 只读核对：`pnpm exec tsc --noEmit`=0、`pnpm run build`=0、`vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache`=0（140文件/1313项）、`node scripts/verify-isolation.mjs`=0（95脚本、声明五保护文件无变化）。这些不是本角色跑的回归，也不替代本轮样式 FAIL 或全部 verify/GUI 总门。
- 尚未执行/未重签：产品全回归、所有 verify、真实模型、服务/正式切换、GUI补采、issue/非法引用守卫/故障恢复/真实restart及完整旅程；无 commit/push。

本轮有界审证完成并释放，所有本角色执行进程已退出，不持有共享 builder、源冻结或 GUI 等待。仅新增本前缀 report/audit/contact 与 selftmp，不更新其他专家/livingdocs、产品、服务或私有资产。Main 继续父全部在途验收及当前最小样式修复/原证补充；独立专家按新候选再判。本报告不签 R8、B8、全部 kinds、总门、发布或最终 commit 准入。
