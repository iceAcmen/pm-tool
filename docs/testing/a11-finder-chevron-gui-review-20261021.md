# A11 Finder 箭头修后有限独立 GUI 审证

> 给 Main、负责人及接续专家使用：只判断 A10-FG-V01 在 A11 实际 control 上是否关闭，分列原证、执行摘要与缺口；不签全部 Finder、Launcher/B8、PM 完整旅程或发布。审证日期 2026-10-22，平台 trae，角色为独立限定测试专家；文件前缀保留派单日期 20261021。

## 1. 有限结论

**A10-FG-V01：A11 修后实际 control GUI 局部 PASS，限本报告四档选择框、菜单/键盘归还与已采 open/reopen 回告观察域，关闭该局部缺陷。A10 原视觉 FAIL 保留为历史；完整 Finder GUI 门仍 BLOCKED。**

| 对象 | 独立结论 | 覆盖边界 |
| --- | --- | --- |
| 1440/390 × 浅/深，closed/menu/ESC | GUI 局部 PASS | 12 份原 JSON/PNG，实际 chooser SVG 均 18×18，无巨箭头、无默认文字挤两行；不签全页面矩阵 |
| 菜单 Enter/ESC 与焦点归还 | GUI 局部 PASS | 三选项、expanded false→true→false；ESC 后 browser-toggle/solid，原图焦点环可见。按 Main 执行摘要识别按键，不伪称归档含独立键盘事件包 |
| 选择 Chrome 与首投 | 局部 PASS | 实际 Chrome 选择闭菜单、chooser18；原 OS Google Chrome exit0、N1 Origin3228 回告200、随后同 control 成功显示 |
| 同 control 再次打开 | 局部 PASS | S4-before、N2 clean-origin 新投递 exit0、N2 回告200、S4-after；不签所有中间状态 |
| 新 control 包含局部 CSS | 有限支持 | 生产模板源码可核，归档实际响应 localCSS=true；响应正文仅 hash，不等完整 loaded 字节独立匹配 |
| Finder 双击→个人 Chrome→PM mount/snapshot 完整原动作链 | BLOCKED | Main 摘要有真实动作，但本目录缺 Finder/PM 原 action/response、目标新 tab 文档代际与 PM 成功快照原件 |
| source→build→个人 Chrome 实际 loaded 全链 | BLOCKED | A11 旧树 source/lib 可核；没有3228个人 Chrome完整响应/实际执行字节原件，其他 origin/A12 不代证 |
| 同一已挂载 PM 仅改 hash、不重 mount | NOT_RUN GUI；该门保留 BLOCKED | 本轮 N2 是新 tab；control 文档未换不等 PM 文档未换，不继承旧组件42项为本分支 GUI PASS |

依据：[AGENTS](../../AGENTS.md) §6A、[collaboration](../collaboration.md) §9/11、[A10 §5](a10-finder-reopen-gui-independent-review-20261021.md)、[最小修复计划](../plans/2026-10-21-launcher-chevron-closure.md)、[独立 A11 SOURCE/AUTO](a11-chevron-independent-retest-20261021.md)。局部关闭不是整门放行，也不是把 hash-only 未采或加载缺证改为 MANUAL_PENDING。

## 2. 授权与对象冻结

本单负责人原句：“独立限定A10-FG-V01箭头修后A11真实controlGUI审证，非全部Finder。仅写docs/testing/a11-finder-chevron-gui-review-20261021前缀；禁止产品/GUI/build/services/credentials/commit。”

已先读 AGENTS/collaboration、A10 §5、独立 A11 SOURCE、最小 plan 和[父最新执行记录](../../reports/all-pending-acceptance-execution-20261021.md)（含 04:32 接续）。Main 是唯一实际 GUI 执行端；本专家只审归档并只读声明的 A11 生产 source/lib。未 fetch/pull、install、运行产品/GUI/build/服务、访问 control、追读 runtime 私有根/body/credentials 或 commit；没有继承父任务提交权限。通用文档同步与回归动作按本单明确限制不执行，留痕仅在授权前缀。

| 认领项 | 值 |
| --- | --- |
| 产品基线 / dirty 工作树基线 | `2a7603023bc54ef13d788e50069ee3fde4671bf3` / `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；HEAD 不代表 dirty 候选 |
| A11 candidate.json SHA256 | `37577ab52b1d9561afdf6c952616b2f1810c2d273365a0f8d9015792b376c7fa` |
| A11 tracked patch SHA256 | `6e09d16e991120ec21a3e88bf26bd4a3e93e6d432e5c1941e53c79ce9d5312fd` |
| A11 control-html.mjs SHA256 | `6994cdd109d7258f14b0283a8e2f0b1d55e6cacc34b80ed5d39736c6dd90a205`，与独立 SOURCE 认领相同 |
| A11 lib/client.js SHA256 | `279d952a9652eb2dd075c9b449bb0201184c90fe27da3dde94e86efbd8d62219`，不是个人 Chrome loaded hash |
| 宿主声明提交 | `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；仅 candidate 声明，本单未读运行宿主 |
| 实际对象 | Main 声明 Finder window24194/PID1032、新 A11 app → launcher PID76405/control50722 → target3228 → 个人 Chrome12221 |
| 生产输出树 | `/private/tmp/pmtool-all-closure-20261021`；本单核511/511 source、453/453产物相符 |
| A12 | 父记录声明独立 `/private/tmp/pmtool-a12-closure-20261021`/3229；本单未读取，不与 A11 图/字节混签 |

[app.json](../../reports/all-pending-evidence-20261021/A11/finder/app.json) 是创建绑定记录，不是双击执行证据；其生产 bin SHA 与 A11 manifest 相同。entry/passive 两个声明 SHA 与 [environment-only-sha.json](../../reports/all-pending-evidence-20261021/A11/finder/environment-only-sha.json) 一致；app-generator 另有 SHA。**只有 hash 声明，没有本单审读的 A11 环境设施正文**，因此不以旧 A10 observer 正文代证本轮所有设施行为，不检查私有 app/root 去补齐。

## 3. 四档实际选择框与目视

原件：[control目录](../../reports/all-pending-evidence-20261021/A11/finder/control/)、[14态汇总](../../reports/all-pending-evidence-20261021/A11/finder/control/boundary.json)。12态均为同 origin `http://127.0.0.1:50722`、同 `timeOrigin=1792613925793.1`，height900 CSS px；随后选Chrome/open各一态，共14态。源码中局部规则仅作用于实际选择框直属 SVG：

```css
.browser-select>svg{width:18px;height:18px;flex:0 0 18px;color:var(--muted)}
```

| 档位 | closed/menu/ESC chooser | 外壳 scroll/client | 菜单与关闭 | ESC 后 |
| --- | --- | --- | --- | --- |
| 1440 浅 | 均18×18，x872/y475.5 | 均1440/1440 | options0/3/0，expanded false/true/false | browser-toggle，solid；原图可见环 |
| 1440 深 | 同上 | 同上 | 同上 | 同上 |
| 390 浅 | 均18×18，x312/y475.5 | 均390/390 | 同上 | 同上 |
| 390 深 | 同上 | 同上 | 同上 | 同上 |

已通过 `view_image` **逐文件目视全部17张原PNG和18张实际 compositor JPG**，不生成替代图或用 contact sheet 代替原件。默认浏览器、Chrome、Safari 三标签可读，箭头不撑高选择框；菜单作为浮层遮住下方按钮区域，ESC 后恢复。没有把正常浮层覆盖归因为箭头缺陷，亦未扩大评审至全部菜单布局。

`selected-chrome.json/png` 为1440深色，菜单关闭、Chrome标签及小箭头可见；focus.id仍为browser-toggle，但outline=none，因此只签鼠标选择后归还目标，不声称该态有键盘焦点环。四档键盘归还由各自ESC原件证明。归档未测 trigger bbox/computed flex/color，**不写实际 trigger高48、实测shrink0或颜色数值**；18px实际 bbox及无放大视觉由本轮原证证明，不靠源码推算替代。

14帧全保留：control帧000002缩小，000006/000008放大并裁切；000013仍显示展开菜单，不能与同时刻选Chrome JSON硬作一一同步。这些是采集/尺寸切换呈现的原观察，原因未定，不冒称整轮无遮挡稳定录像或原生200%验收。稳定四档结论以对应原PNG/DOM为主。frame metadata包含720×450、195×450和1440×900，而JPG分别1440×900/390×900；pageScaleFactor1不证明原生缩放100%。

S4截图不含选择框；成功check仍小图标，但本单不量其bbox，不写“S4所有SVG18”。18px专属选择框，未扩大到app/privacy/check等全局SVG。

## 4. 首投与重开的有限链

原件：[execution.md](../../reports/all-pending-evidence-20261021/A11/finder/execution.md)、[passive.ndjson](../../reports/all-pending-evidence-20261021/A11/finder/reopen/passive.ndjson)、[reopen目录](../../reports/all-pending-evidence-20261021/A11/finder/reopen/)。

| UTC（本机为UTC+8） | 归档事实 |
| --- | --- |
| 20:18:26.056→26.536 | open投递control50722，子PID76411，exit0 |
| 20:19:35.960→36.685 | 四档12态选择框/菜单/ESC |
| 20:19:36.779 / 36.842 | Chrome选择、点击open时原快照；后者仍“尚未启动”，PNG按钮变浅，不能因文件名open-delivered称已OS投递 |
| 20:19:40.170→40.815 | `open -a Google Chrome`首投target3228，N1，query token已脱敏，PID76559/exit0 |
| 20:20:49.502→49.505 | 无别名204单列；N1 request Origin3228/control50722、N1 response200各一份 |
| 20:21:10.672 / 10.773 | S4-before及名为s3-reopen的正文仍显示“工作台已打开”；后者PNG按钮变浅 |
| 20:21:10.781→11.058 | 再次真实OS投递，PID76773/exit0，URL为 `http://127.0.0.1:3228/#pm-launch=50722.N2`，没有query token |
| 20:21:49.961→49.962 | 第二个无别名204单列；N2正确Origin request及response200各一份 |
| 20:22:22.373 | S4-after成功文案、Chrome及可用“再次打开”；timeOrigin与原control四档一致 |

N1/N2 open-start→200为69335ms/39181ms，不是nonce铸造时间、TTL测量或PM挂载时长。passive没有method、请求匿名ID、完整body或response body；结合已绑定生产receiver的 `/api/entered` POST200/OPTIONS204分支，**支持POST回告的有限解释，不伪称原日志记录了method**。两份别名request/response不是仅按邻近时间硬拼；但本轮observer正文只hash声明，未扩签传输关联设施的全部正确性。重复无别名request与204保留，不重复计成第三、第四次成功。

`s3-reopen.json/png` 时点早于N2 open-start，不能据名字签S3/confirmedfalse；四张reopen帧为点击附近，前三张S4（后有按钮变浅），最后一张回到Chrome选择的“尚未启动”视图。它不是完整reopen至S4录像，不据该暂态下退认新产品缺陷；本单只签后续N2回告与S4-after恢复的有限观察。原JSON是页面正文/buttons而非权威state回包，**没有confirmed字段，不宣称已独立核confirmedtrue或全部状态语义**。

Main摘要载有新A11 app目录GOTO回读、图标bbox48×48中心584/589实际双击、个人Chrome两轮翻译窗关闭与PM AXPress。它是执行端记录，不是本专家目视的Finder/PM原动作包；不得借用旧A10图、别的tab/port、成功文案或OS exit0补签新文档认证、PM mount/snapshot和hash清理。N2新tab不代同mounted hash-only。

## 5. 响应字节与继承边界

[control-body-sha.json](../../reports/all-pending-evidence-20261021/A11/finder/reopen/control-body-sha.json) 原件为UTC20:22:22.477、status200、19012bytes、SHA256 `b628e916536947fe21a2d7f9c714a083e188504f5f112cdb16f7863c173de3b8`、localCSS=true。它归档了**实际响应含局部CSS的布尔探针及整body指纹**；没有正文、CSS摘录或初始state。独立可核归档字段和生产模板CSS，不能仅凭该hash重新检查actual body所含CSS或全inline字节。

生产renderer会嵌control CSRF nonce，故不重建“旧nonce”，不请求现control、不读私有body、不以空nonce/fixture renderer生成新hash冒充本响应。19012bytes不等个人Chrome3228的PM loaded证明，响应采集时点也不能倒填四档首导航原包。局部FG-V01关闭依赖真实控件图/DOM、源码局部修复与该探针联合支持，完整loaded门仍BLOCKED。

既有独立SOURCE/AUTO56/8/5及旧A10回告/TTL等结果只在各自已签范围保留；本单没有重跑，不据GUI局部关闭升级全部56/42/Launcher。A10巨箭头FAIL不删不改；A11同模板的新实际GUI补齐其局部修复证据。A12独立树、source变化与3229下发不能污染或替代本次A11认领。

## 6. 检查、终核与释放

审计环境为macOS，使用已安装 nvm Node22.23.3，无pnpm/install。Main构建原记录环境为macOS+Node22+pnpm11.28.5；本单只读其 `pnpm exec tsc --noEmit`、`pnpm run build`、`pnpm exec vitest run --coverage --maxWorkers=1 --minWorkers=1 --no-cache` 及后续launcher/guard exit原件（均0），不将其当本专家重跑或全部97出口PASS。

仓库根实际审计命令：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-finder-chevron-gui-review-20261021-audit.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-finder-chevron-gui-review-20261021-audit.mjs review
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a11-finder-chevron-gui-review-20261021-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-finder-chevron-gui-review-20261021-audit.mjs final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a11-finder-chevron-gui-review-20261021-final-reconcile.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a11-finder-chevron-gui-review-20261021-final-reconcile.mjs
```

freeze已exit0，UTC20:37:00.925冻结1060输入（含60件Finder原证、511source/453产物）；review已exit0、31/31一致性检查。17PNG均已目视、18JPG逐文件原hash相符且已目视。全部数值/别名时序/帧索引见[observations](a11-finder-chevron-gui-review-20261021-observations.json)，完整文件/字节指纹见[inputs](a11-finder-chevron-gui-review-20261021-inputs.json)；一致性绿不是独立GUI判定的替代品。

首次[final-check](a11-finder-chevron-gui-review-20261021-final-check.json)于UTC20:40:00.162 **exit1**：1060输入中仅父execution从41609增至43012bytes，其他1059输入不变，Finder无新增/删除。已读其04:39新增“来源重启与资料/固定汇报补采”，未修改本单授权、A11候选或Finder证据；原exit1与前后SHA保留，不改成全绿。

随后独立[final-reconcile](a11-finder-chevron-gui-review-20261021-final-reconcile.mjs)实际 **exit0**，[r2终核](a11-finder-chevron-gui-review-20261021-final-check-r2.json)再次检查1060输入，1059完全相同；父文档旧41609字节前缀SHA严格等于冻结值，仅追加1403bytes，原追加全文另存r2。结果 `FROZEN_EVIDENCE_UNCHANGED_PARENT_APPEND_REVIEWED`，只处理已审文档追加，**不豁免任何source/lib/GUI原证漂移**。两份脚本的`node --check`均exit0。审计器只新建本前缀JSON，拒绝覆盖旧输出；再次执行须另认领输出，不覆盖本次原证。

本单仅新建本前缀报告、审计脚本和JSON，无产品/其他文档/他人testing原件修改，无服务或GUI执行，无nonce/body/credential访问，无后台资源需要清理，未commit/push。只监测声明输入的内容指纹，未WATCH全系统/所有业务写根、服务、profile，不声称全盘零污染或所有正式服务身份已复核。

**有限审签结束，专家释放。** Main按父任务继续既有缺证补件与其他在途验收；本单不启动下一功能或替Main补采。完整Finder loaded/PM原动作链与未采hash-only分支仍保BLOCKED，原证不存在则明确未采，禁止事后制造。父任务、全部功能门及最终提交仍未完成。
