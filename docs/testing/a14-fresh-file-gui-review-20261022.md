# A13 全新任务真文件有限独立审证

> 给 Main 接续：独立审阅 A13 冻结候选和 fresh-files 原证，逐项保留通过范围与缺证；本报告不是 A14 新候选、RA-F01/F04 整门或全部功能的放行。平台 `trae`，独立测试专家，2026-10-22。

## 1. 结论

**全新项目内的原生中文上传、主取消后零残留、两同字节暂存的一次主提交去重、重开与实际下载字节一致：所列原证切片有限 PASS。RA-F01、RA-F04 整门仍 BLOCKED，不签当前 Main 或发布。**

- A13 候选声明的 514 项源码/脚本/配置、453 项产物全部逐文件 SHA256 匹配；含 394 项 `src`，不是仅核三文件或 HEAD。
- 原证 305 文件已登记指纹，229 张合成帧全部校验；实际目视 **12 张不同截图 + 10 张不同合成帧**。重新用 original 分辨率查看同一截图不增加目视量。
- 存储差异与原始命令流支持取消零写、两个 stage 一次 `task add`、一个任务/关联/资产/字节文件；下载原件真实存在且独立回读 22 字节/hash 一致。
- **缺 3243/main 实际完整 client 下发绑定原证、授权下载的真实安全响应头，以及完整刷新/再次卸载保留分支。** 3242/materials 的下发记录不能替代 3243。缺证不转 `MANUAL_PENDING`，不判产品失败。
- 原 `save/exit1`、三次 responseBody evicted 保留；后续 `finish/result0` 只补成功步骤，不抹旧错。未发现本范围有原证支持的新产品 FAIL，不等于整个功能无缺陷。

## 2. 授权与边界

负责人原句：

> 按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。

本次限定派单：既有独立专家/GUI 分离授权持续；只写 `docs/testing/a14-fresh-file-gui-review-20261022*`，不可产品、其他 testing、livingdocs、build、install、GUI、services、credentials、commit。Main 继续 A14 mixed GUI，本角色只审证，父任务仍在进行。

先读 `AGENTS.md`、`docs/collaboration.md` §9/11、`remaining-journey-cases-20261021.md` RA-F01/F04、A13 Unicode 与 staging 独立报告。Unicode 首轮 G03 FAIL 与后续 staging 有限 SOURCE/AUTO PASS 分开保留；本轮未重跑它们，不将历史 AUTO 当作本轮 GUI。按明确范围不 fetch/pull、全回归、同步共享档案或提交。工作树已有他方在途修改，不清树、不覆盖。

原证根：`reports/all-pending-evidence-20261021/A13/`；下文 `fresh/` 指 `final/main/fresh-files/`。本轮机器审计见 [audit.json](a14-fresh-file-gui-review-20261022-audit.json)，终核见 [seal.json](a14-fresh-file-gui-review-20261022-seal.json)。所有写入仅本报告、专用审计脚本及其 audit/seal，不写原证。

## 3. 候选与环境

| 对象 | 独立核验 / 限定 |
| --- | --- |
| 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；dirty 候选不以此单独认领 |
| 宿主声明提交 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；来自候选记录，本轮未操作宿主/服务或独立查 live git |
| 冻结树 | `/private/tmp/pmtool-a13-closure-20261022`；514 项清单全部匹配 |
| tracked patch | `product-tracked.patch`，259151 字节，SHA256 `824d9c3c96095731580fac8edffbaced9998d5b8e245affbbb8c342e07df507b`，与 candidate 声明一致 |
| candidate 原件 | 123543 字节，SHA256 `d70267f974fb9aa8aaf496a4f1d49abef33d26d410b6a453eb4569fadaa9a51f` |
| 产物 | 453 项逐文件匹配；`lib/client.js` SHA256 `7f037fce5115157101afb64cef7b7fd0e470742ac3eb96a11cabe0a43e56ae7c`，只证明本轮字节，不当作版本 tag |
| Main 实例声明 | 隔离空业务库 `/private/tmp/pmtool-a13-main-runtime-20261022`，3243/PID8391；本轮不连服务。截图地址、页面 origin 与 collector target 相互吻合 |
| 浏览器原证 | target/frame `6D0411984B826559D61A327AF288F035`；页面 `timeOrigin=1792620662287.9`，从新建草稿到重开一致 |
| 实际视口 | CSS `1440×718`，PM `1160×718`，深色，DPR2；不是 1440×900、原生200%或全视口矩阵验收 |
| 当前主树 | 514 项对比中 `client/panel.tsx`、`client/panel.css` 不同；SM01 后的新候选不得引用本轮为 Main PASS |

关键产品源与既有独立释放相同：`stage-client.ts=3d47b8fb194cb221b7518c4f121aea93dc650b3bc1bdc1aaa8749b11b954b5d1`；`asset-route.ts=bac973650943798090c148f6245121781c2e7a080cb5b30f108b0ac793e1da80`；`file-staging.ts=3c643d5a47beeccad22908bb2c57a0d9d415b72243a169540ffa9638dc6f8e81`。完整 514/453 清单在 audit，未仅凭这些接缝推定其余功能通过。

`final/materials/loaded/result.json` 绑定 3242/另一 target，已有 uncached200 完整段匹配；本轮未找到 `final/main/loaded/result.json`。因此 **实际 3243 下发到上述页面的全段认领仍 BLOCKED**；编码请求头、源码、可见功能只作旁证，不冒充完整下发。

## 4. 原证链

### 4.1 新空库与取消

- `fresh/collector/ready.json` 与 `before-project.json`：仅宿主 session/workspace，无 `pmtool` 项目/任务/资产，无文件/备份。
- 原 `commands.ndjson` 的 project add 主命令与成功响应、真实“创建项目”页状态相接；项目 `p-0001`，随后 snapshot tasks/fileAssets 均空。不是手写任务 fixture 或直接调 domain 凑 GUI。
- `task-原生取消零残留-1792620801924.json` 与 `snapshot-before-cancel-stage-1792620822069.json`：标题保留，file input 为空、无暂存行；首个 upload 到 06:14:47 才出现。**该前态无上传/无残留可证；最初原生窗口“取消”的实际控件动作未在这组原生截图内留证，不据口述补成完整动作链。**
- `cancel-chooser/{path-action,path,selected}.txt`：原生 GoTo 设置精确 `/private/tmp/pmtool-a11-native-files/QA 文件 原件.md`，AX 打开 sheet、前往路径、原文件名存在；`chooser.png` 真窗口蓝选中文原件/22字节，后续 POST 与页暂存行相接。
- `staged-cancel.roots.json`：仅增加 `de82ab58774cf12094f8d06555c4ad8b.{bin,json}`，bin hash 为源 hash，业务数据未改。原响应 body 无法取得，不将 sidecar/manifest 称作 responseBody。
- `discard-confirm-1792620913811.png`：实际“放弃未保存修改？”、放弃/取消控件可见，JSON focus 为“放弃修改”；主 cancel/discard 的只读原执行脚本步骤与末页相符。
- `after-cancel.roots.json` 对 `before-cancel-stage.roots.json` 的 data/files/backups **新增、删除、变更均为空**；末页抽屉关、0任务。此结论仅限所监视三根与这一取消分支，不声称全盘或所有卸载路径零写。

### 4.2 两同字节暂存到一次主保存

- `save-chooser-1/chooser.png` 选原件，`save-chooser-2/chooser.png` 选“QA 文件 同字节.md”，均显示22字节；GoTo 原文分别精确，未用 `setInputFiles` 或路径复制冒充原生选择。
- 两原文件独立只读回读，均22字节，SHA256 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`。
- 原 collector 的三 POST：原件取消轮 `.138`，重建原件 `.140`，同字节 `.141`，均201；原请求头是完整 URI-component 编码，`x-pm-file-name-encoding=uri-component`，`content-type=text/markdown`。响应有 JSON/no-store/nosniff，但这是 **upload** 响应。
- 保存前两个侧车 `3c26d4815d87165255d8fa2e63bbc6c0`、`f3d060ff48ed66c8316080f4099948c6` 的名字各正确、size/hash相同，创建/到期时间各自保留。页有两个暂存行；合成帧另见短暂上传中、提交中状态，不签延迟取消/双击防重完整用例。
- 原 WebSocket `cmd-8e972fe3-4`：本窗口唯一 `task add`，draft 中恰两项 `addFile(stageId,clientId=c-1/c-2)`，随后同 commandId 成功。没有第二次 task add，末 snapshot 一个任务、一个附件、一个资产。
- `save/saved-task.json`、`finish/saved-task.json` 与 finish.task 语义一致：`t-0001` / `p-0001` / WBS1；附件唯一 `at-1→fa-0001`，progressLog空。这是成功路径单信封/一致落盘，不是注入故障后的原子回滚证明。
- 保存 diff：只增加 `tasks/t-0001.json`、`file_assets/fa-0001.json` 和一个最终 hash 文件；四个 stage bin/json 全移除，项目/既有数据不变，备份空。`fileAssets` 是快照键，**真实表目录是 `file_assets`**。
- 保存至 finish：仅宿主 session 变化，业务/files/backups不变；finish至collector/end全部不变。证明这一保存后关闭/重开期间 finalized 文件留存，不代替后续刷新、再卸载或重启分支。

### 4.3 重开、实际下载与匿名

`finish/reopened.{json,png}` / `file-visible.{json,png}` 与 collector末帧显示同任务编辑入口、单个 `fa-0001` 文件链接。页实际文案为“文件 fa-0001”，并非显示中文原名；原名保存在资产与真实下载文件。本轮不把 ID 文案称作已验中文显示，也不扩展新增命名设计需求。

只读原 finish 脚本先核 `a[href*="/assets/fa-0001?"]`、滚入视口、真实 click，再在新 finish 下载目录等待22字节 `.md`；没有 copy 源文件的步骤。实际 [下载原件](../../reports/all-pending-evidence-20261021/A13/final/main/fresh-files/finish/QA%20文件%20原件.md) 独立回读与两原文件、两 stage、最终资产、manifest 同 hash，文件名保留中文及空格。这是新建 `fa-0001`，不是既有资产下载替代。

同资源 `/api/pm/v1/assets/fa-0001?taskId=t-0001` 用新 browser context 无 cookie导航，finish记录401、73字节JSON、no-store/nosniff、内容hash不等原件。**有限签401拒绝及非原件全文；原匿名 buffer 未另存，不能推定任意错误正文无部分信息泄露或完整权限矩阵。** 本专家没有读取 cookie/请求鉴权头。

`finish/result.json.responses=[]`，collector `responses.ndjson` 也只有三个 upload201，无授权 asset-download 响应头。不能用匿名401或upload201的安全头替代授权下载的 nosniff/no-store/安全 disposition。

## 5. 目视明细

三 native `chooser.png`：取消轮选原件、保存轮选原件、保存轮选同字节；原生蓝选、22字节、打开/取消可见，地址3243。AX GoTo路径原文与图相互印证。原生系统窗口不在CDP页面帧内，不伪称合成帧拍到了整个native动作。

九页面截图：`snapshot-before-cancel-stage-1792620822069.png`、`snapshot-staged-cancel-1792620894585.png`、`discard-confirm-1792620913811.png`、`cancel-state-1792620913981.png`、`save/{two-staged,submit-visible,saved}.png`、`finish/{reopened,file-visible}.png`。实际看到暂存行、放弃提示、主提交入口、末页1任务和重开单文件入口；未将同图复看增加计数。

十合成帧逐张目视：collector `000023/000066/000146/000148/000181/000197/000209.jpg`；save `000000/000006/000017.jpg`。具体时点见 audit.frames；覆盖标题/空文件输入、上传后暂存、取消前、第二上传中、提交中、成功关闭和重开。collector 211帧为06:12:42.024至06:18:36.460，save18帧为06:17:43.503至06:17:44.046；仅 **10帧目视，229帧机器核hash**，不声称逐帧完整录像审看。截图JSON alerts空不等无console/pageerror；本组没有完整console日志，不能签无卸载警告。

## 6. 逐 ID 有限判定

下列分项是原 RA-F01/F04 的证据切片，不新增或替换用例。PASS只指本报告指定target/初态/步骤/末态，不解除完整下发绑定缺口。

| 原 ID / 切片 | 判定 | 精确范围或缺口 |
| --- | --- | --- |
| RA-F01 / 初次原生取消后态 | 有限 PASS；完整原生取消动作 BLOCKED | 文件输入空、无上传/暂存/业务写可证；缺最初原生sheet取消实际动作原证 |
| RA-F01 / native中文选件→stage→主cancel/discard | 有限 PASS | 中文原件22字节暂存后，三根回到before、0任务、抽屉关闭；不签所有卸载/路由/StrictMode分支 |
| RA-F01 / 两同hash→一次主save→dedup | 有限 PASS | 2stage/1command/1task/1attachment/1asset/1bytefile，stage归零；不签故障回滚/重复点击/跨任务共享GC |
| RA-F01 / 保存后关闭→重开→文件存在 | 有限 PASS | 保存至重开业务与文件不变，真链接可下载；缺显式刷新及再次卸载/重启后的完整原证 |
| RA-F01 / 整个 AUTO+GUI 门 | BLOCKED | 本轮只审GUI切片；下发绑定及上述未覆盖分支仍需补证，不靠历史AUTO自动升格 |
| RA-F04 / 授权实际下载新asset/中文空格名/源字节 | 有限 PASS | 真实下载原件22字节SHA一致；不签授权下载响应安全头 |
| RA-F04 / fresh无cookie同资源拒绝 | 有限 PASS | 401/73字节JSON且非源全文；匿名原body未保，不签错误正文绝无部分泄露/权限全集 |
| RA-F04 / 授权下载安全headers / 整门 | BLOCKED | 缺该真实GET的响应status、nosniff、no-store、安全disposition；响应extra未采，完整main下发仍缺 |
| A13-G03 / 历史SOURCE/AUTO继承边界 | 本轮未重测 | 两产品源/相关释放hash一致，引用既有有限PASS；旧FAIL保持，不签竞态/GUI安全全集 |
| 当前Main / A14 mixed / 整功能 / commit | 不审签 | panel候选已不同；不能引用本报告解除新候选独立门 |

## 7. 错误与进程保全

`save/exit.json` 在06:17:44为1：`ENOENT ... scandir .../data/pmtool/fileAssets`。在其前真实 task add 已成功、saved-task/roots已写；失败是脚本错表目录，不是任务保存失败。finish改读 `file_assets`，06:18:36 result0补重开/下载/匿名。本报告保留两者，不改旧exit，不伪称整runner从未失败。

collector即使 `maxTotalBufferSize=104857600 / maxResourceBufferSize=20971520` 仍三条 `Network.getResponseBody: Request content was evicted from inspector cache`。仅使用原请求/responseReceived、原侧车/根清单、原command/snapshot和实际下载字节作有限佐证；不生成丢失responseBody。上传取消DELETE的网络响应未在本组收齐，清理PASS依据实际末目录，不虚报已验DELETE响应信封。

`ready.pid=23449`，`end.json`06:19:47与末根已核；派单说明 Main 已核argv/cwd→单PID TERM→ps退出。本目录没有那组原argv/cwd/TERM/ps输出，故本轮 **只核collector结束记录，不独立签精确停进程操作链**，也不现场查/停任何服务。end文件本身不替代ps退出。本专家没有执行这些动作。

## 8. Main 最小补证与释放

1. **补 actual-client-main 完整下发**：3243、上述候选、target/frame/timeOrigin、无缓存请求/status、完整原response文件及client完整唯一段hash；脱敏查询/认证。3242原件不替代。若需reload取新timeOrigin，保旧记录、登记同候选关系，不伪造旧时点响应。
2. **补授权新asset实际GET安全头**：同 `fa-0001/t-0001`，真实响应status、Content-Type/Length、Cache-Control、X-Content-Type-Options、Content-Disposition，与下载22字节/hash关联；正确捕获download extra或直接响应原文，不保存Cookie/鉴权头。
3. 沿原RA-F01补显式刷新、再卸载/重开最终文件不被删除；最初原生取消动作缺口可补独立fresh轮，不覆盖本轮前态。若签匿名完整不泄露，再保脱敏原错误body而非仅equalsSource=false。console/延迟/StrictMode等仍按各自原用例审，不把本报告扩成RA-F02。
4. 原FAIL/evicted/设施exit1不抹；Main/SM01新候选必须重新绑定受影响证据。上述是可由执行端补的证据，不要求负责人再授权GUI、不转本人协作门。本专家已完成这次有限审证并释放，不占构建/GUI/服务资源，Main继续其已授权补余。

## 9. 本轮实际验证

环境：macOS arm64、现有 nvm Node `v22.23.3`；项目 pnpm11.28.5约定未在本轮调用。仓库根的专用机器审计命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-fresh-file-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a14-fresh-file-gui-review-20261022-audit.mjs seal
git diff --check -- docs/testing/a14-fresh-file-gui-review-20261022.md docs/testing/a14-fresh-file-gui-review-20261022-audit.mjs
```

审计退出0：514/453无漂移、229帧hash一致、两个原件/真实下载hash一致、取消diff全空、仅一次task add、task前后语义一致。seal登记终核时点和原证新增/删除/变更差异，不扫描个人profile/key；原证变化时由Main解释并复核，不清他人成果。diff检查仅做格式辅助，新文件未跟踪不等通过内容测试。

本轮探索设施错误也保留口径：`rg`不可用后改find/grep；一次只读node帧枚举多余括号SyntaxError退出1，改用正式审计脚本成功；一次查错执行记录文件名退出2，随后读真实 `all-pending-acceptance-execution-20261021.md`。这些不归产品FAIL，不伪称所有探索命令退出0。

未执行 build/install/verify/GUI/服务/commit/push，未改产品、其他testing、共享livingdocs、依赖或原证。**上述有限签字不表示“所有没验完功能已验完”或“所有代码可以提交”。**
