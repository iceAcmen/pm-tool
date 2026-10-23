# 旧包40%旁注替补独立补审

> 记录本旧包唯一40%视觉余证的独立裁决，供父协调者精准收口；证据来自归档原件、自有 reader 和实际 `view_image`，不是新 GUI 执行或产品测试。2026-10-23，平台 trae，替补独立审证角色。

## 1. 裁决

**限定 PASS：本旧包列表 F2-L1、F2-L3 的“原手填 40%”实际入镜、可读，并与“客观证据不足 / 覆盖 0/1”分离。** 仅关闭[原审报告](op-legacy-browse-gui-review-20261022-r1-report.md)留下的这一条视觉 `BLOCKED`；不把旧旁注改称客观40%，不签其他 OP 断言、完整备份域或父发布门。

原报告已签的标准预检、两次确认、真实恢复与恢复后只浏览退出重进业务零写，保持原**限定 PASS**。这属于同旧 fixture 的视觉余证补齐，不是重做恢复、不扩旧包覆盖范围，也不是重新签整项。80%旁注仍只说明原手填字段。

| 断言或门 | 本轮结果 | 边界 |
| --- | --- | --- |
| 本旧包列表40%旧旁注实际可见与客观证据不足分离 | 限定 PASS | 新 PNG 实际目视，L1/L3 同屏 |
| 原 restore/browse 切片 | 继承原限定 PASS | 原127封件、原签字内容身份不变，不重新执行 |
| 客观40%、旧OP112R2、native、P0–P3、B8、父ordinarycommit | 不裁决 | 不继承、不放行、不登记为本单通过 |

**本补审 remaining=[]；released=true，STOP。** 不是全父任务 remaining=[]，不是发布授权，也不停止宿主。

## 2. 授权与独立性

本次负责人原句限定：“你是替补不同独立审证，唯一新增docs/testing/op-legacy40-supplement-review-20261023-r1* reader/audit/report/seal。只读报告/原件自有reader+view_image，不业务/Git/browser/service/install/build/产品test/其他testing/livingdocs。”

前补审 `op_legacy40_supplement_review/arun_6ada32077cfef4f845ad48a5` 被用户中断 killed 是负责人补充事实；本角色仅核 `docs/testing/op-legacy40-supplement-review-20261022-r1*` 无文件，没有查询其任务活性或重复运行。新增前本次前缀无文件，未借用前审 reader、未执行 Main 脚本、未实现或改任何产品代码。

已读 [AGENTS](../../AGENTS.md) 与 [collaboration §9、§11](../collaboration.md)。特定任务范围按 §11.1/11.2 优先辨别，不执行通用开工 Git/安装/构建，不同步 livingdocs，不提交或推送。独立采证与审签按 §9.5 分离，继承理由与签字范围按 §11.5 保留。

本批唯一可写对象为 [reader](op-legacy40-supplement-review-20261023-r1-reader.mjs)、[audit](op-legacy40-supplement-review-20261023-r1-audit.json)、本 report、[seal](op-legacy40-supplement-review-20261023-r1-seal.json)。其他角色在途成果不修改。

## 3. 封件与继承依据

自有 reader 截点为 **2026-10-23 04:24:26.384 +0800**，实际 read/stat 明确输入151个，记录 byte/SHA 与纳秒mtime/ctime/inode，读前后稳定；其中不包含运行库或重新读取冻结源码树。

| 原件 | 实读身份及范围 |
| --- | --- |
| [新12条索引](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy40-supplement/index-r1.json) | 1616 bytes；SHA256 `3791b426e641c1d1f4fb2f11e6deb0b0aeb04948dbd6426fccb6a343ff506c00`；12/12 byte/SHA相符，目录集合与索引加自身exact |
| [原127索引](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/index-r1.json) | 20048 bytes；SHA256 `478e107080540bb25a32f250f5662c61399d0c9c166d858cd167becacf897ac2`；未覆盖，127/127 indexed原件byte/SHA相符；新补证在独立子目录，不偷加进原索引 |
| [原独立 seal](op-legacy-browse-gui-review-20261022-r1-seal.json) | 原reader/audit/report byte/SHA均匹配原seal；原audit对应归档输入内容身份仍相符，原40视觉BLOCKED未被改写 |
| [source-binding](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/source-binding.json)、[host-start](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/host-start.json) | 原归档及原audit一致：baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`、内层source114、complete521、PID16671/3265；sourceCount=3仍仅外层键数，不重新误判成3源文件 |
| [旧fixture binding](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/fixture-binding.json)、[legacy-f2](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy-f2.json) | 原转换旧包4502 bytes，SHA256 `abb086772fde51f0e96dff4d5a7e9d444b887e1acdca0180cce11631ba1473ee`；同原old fixture，不冒称历史版本新导出 |

runtime归属沿原签字：`/private/tmp/pmtool-op-legacy-runtime-20261022-r1`；profileTarget/bundle 指向 `/private/tmp/pmtool-combined-successor114-20261022-r1/packages/dsh-pm-tool`。helper归档明确同runtime；新row JSON的origin为3265。源/候选/bundle归属仅继承原签，未重探活、查PID/端口/软链或读服务库；**不声称该服务在本审证时刻的健康或未重启由本角色新验证**。

## 4. 实际目视

已由本替补审证者实际调用 `functions.view_image`、`detail=original` 打开[40-visible-r2.png](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy40-supplement/40-visible-r2.png)，不是凭图片存在、Main observations、DOM bbox 或哈希代签。

图为 **1440×900、深色**，184681 bytes，SHA256 `35dcab3371f1495bfe4856ad58d3149554a22afcfae31a97927cb997a45dbcd3`。可见真实任务列表及10任务导航；F2-L1约y422–479、F2-L3约y627–683逐行显示“客观 证据不足”“覆盖 0/1”“原手填 40%”；F2-L6约y798–854显示同样证据不足与“原手填 80%”。没有将40/80画成可签的客观完成率。

[row JSON](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy40-supplement/40-visible-r2.json)为7393 bytes，SHA256 `63de419a5586958c62d389b7fba77a607aa50102847d76fa4eb0e92bc9f2b133`。只记录L1：origin3265、viewport1440×900/dpr1、row bbox `(535,422.3828125,877,56.5)`；40% leaf `(1192,459.3828125,132,14.5)` 与客观标签/覆盖标签均在视口内，与实图位置相符。**L3/L6可见来自实际目视，不说JSON也覆盖这两行。**

图顶部内容、底部L7部分在视口之外，不影响本40旁注断言；不额外签全页、浅色、窄屏、native缩放或矩阵，也不把本次归档目视登记成第二次GUI采证。

## 5. 失败原件、成功收据与零写

[round01](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy40-supplement/pmtool-legacy-40-round01.mjs)实际记录 `focus('button[aria-label="编辑 F2-L1"]')` 加 `Tab`，只是定位/滚动，不是click“编辑”或保存。其后 `closest('tr')` 假设返回null导致取bbox失败，保留了原脚本及exit1。不能把这条采证选择器错误判为产品FAIL，亦未抹掉失败再只报all0。

[round02](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy40-supplement/pmtool-legacy-40-round02.mjs)只读祖先；[round03](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy40-supplement/pmtool-legacy-40-round03.mjs)改用真实DIV-grid `.pm-task-row` 读row/bbox/leaf，截图后读取业务文件元数据。三个脚本均无click/fill/保存或发commands请求代码；本审证只读，不import或执行它们。

| 真实收据ID | 工具PID | 开始与结束（+0800） | exit |
| --- | --- | --- | --- |
| `de773c380cdf1333e43401c4e0e63525` | 18924 | 2026-10-22 23:52:02.415–23:52:04.833 | 1，原TR假设失败 |
| `d1f3248add09faa4d12615be2f9e283d` | 19293 | 2026-10-22 23:53:32.823–23:53:34.950 | 0，真实row/PNG成功 |

[failed execution/output](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy40-supplement/failed-execution.json)与[captured execution/output](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy40-supplement/captured-execution.json)分别逐件对比工具private同ID的 `execution.json/output.log`，byte完全相同，均status exited、outputComplete=true。失败日志明确 `Cannot read properties of null (reading 'getBoundingClientRect')`，成功输出L1旧旁注与JSON bbox一致。工具metadata没有完整stdin，不单凭metadata证明全部脚本执行；本包未给round02的独立收据，不伪造第三条成功收据。

[after-mtime-r2](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy40-supplement/after-mtime-r2.json)与[原03-before](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/03-browse-before-mtime.json)均2547 bytes、SHA256 `7ea828ba63fca9a80002fef8bd9fe8c8f6ad73e90f6fea4b8c33e05c4972e8f4`；**11/11文件集合及bytes/sha256/mtimeMs/ctimeMs/ino全部exact**，与原audit的before/after也一致。

额外解析原恢复后的11业务副本并比原03-before SHA，L1=`t-0003/progress40`、L3=`t-0005/progress40`、L6=`t-0008/progress80`身份一致且无checklist补键。补证后快照保留原字节及时间戳，支持本补证无业务修改；运行mtime来自Main归档，不把本角色stat封件的mtime冒充业务库mtime。零写只限11个 `data/pmtool` 文件；没有新全量RPC日志，不宣称整个runtime或全机零写。

[observations](../../reports/all-pending-evidence-20261021/OpLegacyBrowseR1/legacy40-supplement/observations.json)明确 `NOT_A_GUI_PASS`；其布尔自述不作裁决依据。12封件含原失败/成功收据、三个round与seal脚本，逐件保真。

## 6. 自检与释放

运行环境：macOS/darwin、仓库根 `/Users/bytedance/Projects/dsh-pm/pm-tool`、已有Node `v22.23.3`；未使用pnpm、未install/build/运行产品test。仅运行以下自有reader命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/op-legacy40-supplement-review-20261023-r1-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-legacy40-supplement-review-20261023-r1-reader.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/op-legacy40-supplement-review-20261023-r1-reader.mjs seal
```

语法检查与capture实际exit0；capture **298项检查、failed=0、151输入、原127/补12/业务11/真实收据2**。seal实际exit及原件漂移、文件集合、尾空白、链接和自有产物byte/SHA纳[seal](op-legacy40-supplement-review-20261023-r1-seal.json)；seal不自哈希，审证检查不等产品回归或父验收。

环境小问题如实保留：初次exec设置 `login=false` 不受工具支持，未执行，去掉参数后只读正常；声明的memory绝对路径不存在，未以平台记忆推论产品状态。只使用已有内置依赖；research-guide只提供原件优先/反证核对，不扩单、不造来源或GUI。

**精准释放：本单40旧旁注余证已闭，remaining=[]，released=true，STOP。** 无后台reader、业务/构建/服务/浏览器资源锁；不kill PID16671、不写业务、Git、其他testing或livingdocs。父Main继续P0采证；负责人告知的EGO错误窗口native具体 `BLOCKED` 仍沿父负责角色处理，本角色不要求GUI、不将其改为PASS或MANUAL_PENDING。不启动下一功能、不执行父ordinarycommit、不推动发布。
