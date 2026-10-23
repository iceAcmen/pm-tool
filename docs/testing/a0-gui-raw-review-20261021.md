# A0 新 GUI 原证与构建保护范围独立审证

> 2026-10-21，平台 trae，独立测试审证专家。产品修复、构建、宿主运行、GUI/桌面采证执行者为 Main；本报告判定者为本专家。只审本轮明确交来的 GUI 合同及构建/正式保护原范围，不是 A0、batchA、全部功能或发布 PASS。

**收尾更正：** 11:08:04Z初核14源/补丁一致；11:15:35Z复核发现两树 Launcher 在并行工作中已变，原 candidate 未更新。下述GUI/构建局部结论只绑定原 A0 冻结对象，不给变后的当前全包身份签PASS。精确差异见§3.3，不回退他人在途成果。

## 1. 独立结论

| 对象 | 本轮判定 | 精确边界 |
| --- | --- | --- |
| 原 A0 同候选14源文件及补丁 | **历史快照PASS；当前认领BLOCKED** | 11:08Z一致，11:15Z起package及新增control接缝已变；当前须重新认领，见§3.3。 |
| 最终 build 原证 | **PASS：构建输入与产物局部门** | Main 明确 `pnpm run build`、cwd、exit0；src 全364文件及 lib 全453文件前后无增删改，当前实际文件逐 hash 相符。未由本专家重建。 |
| 七份 `.log` 的 `.txt` 归档 | **PASS：逐字节与非忽略性** | 7/7 与原件和索引 hash 一致；旧外层 exit 未保存仍不补造。未 commit，不称已跨机交付。 |
| r3 三次离散布局、逆序撤销 | **PASS：逐态结果局部** | 11组 DOM/布局/截图，8卡 ID 不变、各态 bbox 零相交；三次拖动分别变化，undo1=drag2、undo2=drag1、undo3=drag0。原目标动作和完整过程门仍缺证。 |
| r3 保存/取消后重进 | **PASS：布局持久结果局部** | reload=save-draft，cancel-reloaded=reloaded，取消草稿与已保存布局确实不同。不等于取消全库零写或只改 dashboard 的保护门。 |
| 右缘内滚 | **PASS：可见与几何局部** | stage 到右缘89px，卡右缘1486→1397，右侧×及缩放柄可见；HTML/pm-shell 宽度与横滚值未变。真实 wheel 输入/命中操作未由本专家执行或完整回绑。 |
| BA-COPY-01 的 A→B 反馈及系统复制 | **PASS：本轮四态 GUI/系统值局部** | 四张截图、原片局部抽帧、真实生产组件、系统 pbpaste 原值相符：A75/B43字节，B新出现无旧反馈，拒绝后诚实失败；已交 data 六文件零变化。 |
| B1-GUI-01、BA-COPY-01 完整合同门 | **BLOCKED：原证/环境绑定仍不足** | 原生菜单100%、运行实例实际下发绑定；看板另缺原目标动作说明、逐态画布高度及完整保护清单。不能把上述局部PASS合成整项PASS。 |
| 正式全 data/backups/exports 零变化 | **FAIL：零变化不变量不成立，归因未定** | 234→240，2变更6新增全在 data/wechat-pilot；不是产品缺陷或 Main 污染的归因证明。其余已列 PM/backups/exports 文件元数据局部PASS。 |
| 原片完整可见与安全持久归档 | **BLOCKED：遮挡/归档待补** | 原片可解码，但看板多时段被其他窗口及下载菜单遮挡；9片仍在临时 runtime，未完成全帧脱敏和持久归档。 |

**未发现可据本次已审 GUI 原证新增的确证产品 FAIL。** 保护不变量的 FAIL 与产品行为、写者归因分开。原 Finder、安全桥、OKR、习惯、任务编号完整门均不在本报告签字范围。

## 2. 授权、依据和方法

本轮负责人原句包括：“Main采证开发专家审”“仅写docs/testing/a0-gui-raw-review-20261021*”“不改产品/其他expert原件/living docs，不build/install/启服/commit/push，不读runtime/private”“只审上述GUI合同及build/正式保护原范围”“actual依原句动作差异明确，不扩大全球矩阵”。

本轮只读审证，按明确授权跳过通用 pull/install/build/产品验证/文档同步和提交动作。只新增本前缀的报告、复核器与生成的复核 JSON；视频抽帧辅助脚本和图片只在专家自有 `/tmp/a0-gui-raw-review-20261021-eDFXTC/`。未操作浏览器或桌面，未抢 Main 当前 Finder control，未读 runtime/private、业务内容、profile 凭据或认证原值，未改全局设置。

先读且只读引用：

- `AGENTS.md`、`docs/collaboration.md` §9/§11，适用 ADL-045/047/057/058。
- [remaining 总登记](remaining-acceptance-register-20261021.md)、[batchA 即时单](batcha-independent-findings-and-main-worklist-20261021.md)、[原收口计划](independent-acceptance-batch1-closure-plan-20261021.md) §5/§7/§13/§14。
- [A0 第一轮审证](a0-independent-evidence-review-20261021.md)、[A0 第二轮路径/看板/TTL 审证](a0-paths-board-review-20261021.md)，右缘按后者 §3.3 而非“卡right超过屏宽即FAIL”裁决。

审证工具只使用已有 Node 内置 fs/crypto/child_process、只读 git 与 macOS Swift/AVFoundation/AppKit。未装 ffmpeg 等工具；Swift 解释执行仅作原视频解码/裁切，缓存也在自有 tmp，不是构建产品。专家的目视、结构化比较与源执行脚本核查互相补强，同源截图/JSON/副本不算多次独立执行。

## 3. 候选、构建与日志归档

### 3.1 冻结身份

- 文档基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3` 加 A0 未提交14文件。
- candidate sha256 `2b6265bd1953c186f553d4092fa98ff87f2a14480a82e04383cc63255e0de071`；patch sha256 `fdeadce4b7c39298dc8d2c1d56f5b5854f914893817d7c1eb884f698afc3400a`。11:08Z两树实际产品diff与patch相同；14源文件明细继承前审§4。收尾发现新变更，不能继续称两树当前diff与旧patch相同。
- Main 隔离树 `/private/tmp/pmtool-all-closure-20261021`；插件 version0.7.4，Launcher0.1.0。manifest 声明宿主 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`、3205/PID27767、独立 runtime、初始 pilot off；**声明不是本专家独立现场/下发核验**。
- 三个 bundle 仍与前两审相同，主 client hash `5ae7808cb3bcdb3f8e2577c84a587080f6dbd4f87b516a9520266a84872ac9ec`；没有新产品构建或改动由本专家引入。

### 3.2 最终构建补件关闭范围

`final-build-proof.json` 和已归档的 `execution-scripts/pmtool-build-proof-20261021.py` 可核 Main subprocess 的 `argv=["pnpm","run","build"]`、cwd 为隔离插件包、returncode0，分别保存 stdout/stderr。before `2026-10-21T18:40:27.629835`，after `18:40:49.048564`；原值没有时区标识，保留其本地格式，不冒称 UTC。

本专家重新比较**完整键集及 hash**，不仅信任作者 `sourceChanges=[]/artifactChanges=[]`：364/364 src、453/453 lib，零新增/删除/改动；全部当前隔离文件相符，主树364源文件也相符。`all-built-files.json` 全453项与 proof 对应，覆盖服务器 JS、CSS、类型产物、bundle 和 map，不再仅三个 client bundle。构建输出完整成功尾行与 exit0相符。

这关闭前审 A0-E02 的“最终输入/完整产物/明确exit”子缺口，**不关闭运行装载子缺口**：尚无该 GUI 会话实际下发字节与冻结 bundle、有效 PID/profile/开关的执行原证。无需因此要求 Main 重建同字节产物；补已保存的脱敏解析/下发索引即可。

七份 `.txt` 均与原 `.log`/archive索引7/7 hash相等，git check-ignore 确认未被忽略。A0-E04 的忽略归档缺口关闭，A0-E01 的旧外层 exit/执行时间等未保存字段仍按前审限定，不重跑所有测试、不补造值。首轮设施污染1、Launcher修前2失败及独立第三轮设施失败历史仍保留；本轮不重新给1134/49/95或其他专家子项签字。

### 3.3 收尾新增候选边界

11:15:35.170Z只读复核exit1：旧14项中13/14仍相符，`launcher/package.json`两树当前hash均为 `2358bf0083703aa8d21f678e8b03ddbfa0cbee1b9310233520429c95dd1c976f`，原候选为 `d3a59bc513cccb69e1b9f090fff6248ed9c22a140e46553a20f362af7b24a413`。结构化读取及旧patch可核当前新增 `test:control-gui` 脚本；没有偷偷将manifest改成新hash。

随后只读文件清单又见原认领外的两个tracked改动 `launcher/src/control-html.mjs`、`launcher/test/control-html.test.mjs` 和新文件 `launcher/test/control-html-sync.test.mjs`。仅核清单/hash，不诊断或接手Finder专家的实现。本前缀result的currentAccounting记录两树当前patch指纹与额外文件。

插件364源/453产物及本次GUI原证仍与原A0相符，因此原A0复制/布局/构建的局部审证事实不因Launcher接缝变化被抹除；但**原A0整包身份、Launcher/Finder受影响历史证据不能自动给新候选继承**。Main重新认领patch/新增文件与当前实例后，专家按接缝决定继承或重验，不要求无变化插件重build，不要求所有GUI全量重采。

## 4. 看板逐态与原动作差异

### 4.1 r3 布局与撤销

本轮 Main GUI 时间10:44:27.698Z至10:44:51.133Z。A=`w-hero`，B=`w-ms-deliver` 是本轮执行脚本明确操作对象；原计划的 D 未见映射。每态均有 `board-r3-<label>.json/.png` 和 `layout-r3-<label>.json`，本专家读取并逐张目视11截图。

| 状态 | A canonical x,y | B canonical x,y | 结果 |
| --- | --- | --- | --- |
| drag0 | 0,0 | 4,0 | 8卡，max(y+h)=19 |
| drag1 | 4,0 | 4,10 | 与0不同，max=24 |
| drag2 | 4,0 | 0,10 | 与1不同，max=24 |
| drag3 | 2,0 | 0,10 | 与2不同，max=24 |
| undo1 | 4,0 | 0,10 | 全8卡布局=drag2 |
| undo2 | 4,0 | 4,10 | 全8卡布局=drag1 |
| undo3 | 0,0 | 4,0 | 全8卡布局=drag0 |
| save-draft | 4,0 | 0,10 | 全布局=drag2 |
| reloaded | 4,0 | 0,10 | 全布局=save-draft |
| cancel-draft | 2,0 | 0,10 | 与已保存布局不同 |
| cancel-reloaded | 4,0 | 0,10 | 全布局=reloaded |

“全布局”比较8卡的类型、config和全部layout字段，不只 A/B。各态 DOM 全8卡 bbox 两两零相交，transform 与该态 canonical x/y相符；撤销可用性吻合（drag0/undo3/reloaded为disabled，其余动作后可用）。有视口滚动时绝对 bbox 变化不等于canonical漂移，不能用撤销3的屏幕坐标与初态绝对坐标不等判失败。

保存后历史版本1→2可见，刷新重进导出仍为已保存坐标；取消草稿不出现在重进导出中。**仅签布局结果，未收到看板整段 before/after 全库清单，不能声称取消完全没写其他字段或保存只改dashboard。** 复制段六文件零写不能倒用为此前看板写操作保护。

### 4.2 actual 不替换原句

| 原计划 §5 动作 | 本轮实际可核动作与结果 | 判定边界 |
| --- | --- | --- |
| “将卡 A 从首行拖到卡 D 下方” | 脚本拖 A `(dx310,dy200)`，最终 A `(0,0)→(4,0)`，仍在首行；D无映射 | 可签发生了离散变化，不能签原指定相对目标已执行。压实可能改变松手坐标，尚缺 drop/目标原证，不能据此判产品错误。 |
| “将卡 B 拖到卡 A 原位置附近” | 脚本拖 B `(-310,0)`，B `(4,10)→(0,10)`，不是初始 A `(0,0)` | 同会话第二次离散变化成立；不冒称原A位置目标成立。 |
| “将卡 A 再拖回上半区” | 脚本拖 A `(-180,140)`，A `(4,0)→(2,0)`，前后都在首行 | 第三次变化成立，不证明“从下半区返回”。 |
| 逐次记录空白行、画布高度和不远推 | 原证有各卡bbox与canonical；max行19→24，后续保持24；缺各态stage scrollHeight | 不能仅用最后一张卡推导实际画布高度；未见离谱推至极远处的确证，但该完整观察仍缺证。 |

本专家没有改写原计划，亦未追溯新增设计矩阵。原 fixture 前三卡是否满足“连续行”、A/B/D映射、第一拖目标与压实关系，先交最小原证说明由专家澄清；需要重采时只重采原有动作，不扩卡种/视口/主题。

### 4.3 r1/r2 历史

保留 r1 原证：`layout-drag0` 与 `layout-drag1` 的 canonical相同，而同期 `board-drag-states.drag1` 的 A transform发生变化；不能说“r1完整第一拖已成功”。DOM与canonical记录差异的原因未核，不能只凭该旧采证链将当前产品判坏。

r2 的第一拖及后续动作有离散值，但 drag1到drag2跨10:37:57Z至10:39:50Z，下载设施失败/续采是历史补充事实，不把续采拼成一条无中断完整录像。r3新一轮不覆盖旧原件，也不消除两轮的证据问题。

### 4.4 右缘按前专家 §3.3 审

`board-right-edge-scroll.json` before/after 为10:45:57.595Z/57.792Z：stage client879、scrollWidth968、scrollLeft0→89，即已到最大右缘；目标卡 bbox右1486→1397，stage右1413。后截图中右侧客观进度卡的×和右下缩放柄完整可见。HTML client/scrollWidth均1440、pm-shell均1155，二者 scrollLeft始终0、bbox未动。

**裁决：关闭“右缘永久裁掉”的假设，签合理内部横滚、右缘控件可见与外壳不横滚的局部PASS；无需据此修960px画布/CSS。** 不扩大为全8卡控件操作PASS。“真实wheel”来自派单补充事实；当前 JSON只有前后态，未有对应输入日志/片段时点，故没有将指针输入或实际点击/缩放写成本专家实测。补当次 wheel 步骤/片段锚点即可，不要求为此删卡或新增缩放旅程。

## 5. A→B 复制原证

核读 Main 两份执行脚本：恢复入口上传 A；在不关闭 ResultCard 的情况下上传不同 B；真实产品组件按钮点击；`execFileSync('/usr/bin/pbpaste')` 读取系统值。不是自建copyState模型或注入writer返回成功。权限通过 Chrome CDP `Browser.setPermission` 对该隔离 origin设置 granted/denied，改变的是浏览器权限，不是伪造 Clipboard API。

| 原态/时间 UTC | 系统值或反馈 | 本轮观察 |
| --- | --- | --- |
| A-copied 10:54:08.200Z | `恢复失败：备份文件格式不认识（format/formatVersion 不符）` | pbpaste严格相等，UTF-8 75字节；成功反馈 |
| B-not-copied 10:54:08.534Z | `恢复失败：Unexpected end of JSON input` | 新原文，copyState字段不存在，无“已复制”残留 |
| B-copied 10:54:08.773Z | 同 B原文 | pbpaste严格相等，43字节；成功反馈 |
| B-denied 10:54:08.979Z | `复制失败，请手动复制` | 没有成功残留，原错误仍在 |

四态均只有一个 role=alert，aria-live=assertive，dark=true；`theme=""` 表示 body真实属性存在，不是 null。本轮真实宿主主题入口截图可见“深色”选择，与后续深色页面相符，未见用脚本加主题属性的原证。只签这一复制组件可读及反馈局部，不签任务/OKR/设置/看板全页深主题质量。

`copy-A-B-boundary.json` 主运行10:54:07.630Z至09.245Z，显式子命令argv与exit0；before/after六文件完整键集/hash相同，包括dashboard设置、两任务、项目、workspace和session缓存。只签该数据根该时段零变化，不读其指向的runtime/data实际业务内容，不扩大到backup/export/所有外部写根。A初始upload在started之前，但before manifest已在其前采；外围runner开始/结束的独立exit未保存，不补造。

BA-DEF-03 的“新B继承A复制反馈”在本轮真实GUI局部可签修复复验，旧异步迟到Promise只沿用原复验专家注明的AUTO结论，不称本轮GUI覆盖异步竞态。BA-COPY-01完整环境/运行绑定仍BLOCKED。B1-GUI-03就近OKR错误、全页浏览、3秒持久、关闭/焦点、浅深往返未由这四态替代；B1-GUI-02两行键盘复制亦未被本项替代。

## 6. 原视频审查边界

9个 mov 已逐文件实际读取核hash/bytes，与 `desktop-video-index.json` 9/9一致；本轮只对两段相关原片解码抽帧。Finder片仅核身份不审动作，不接手当前control诊断。其余历史片只核身份，未冒称看完9段录像。

| 原片 | 实际解码 | 已目视区间/限制 |
| --- | --- | --- |
| `board-drag-r3-actual-desktop.mov` | 54.733333s，2940×1912，nominal fps54.41436 | 全跨度0/6/12/18/24/30/36/42/48/54s抽帧，另10至23s每秒抽帧。0/6/10/11及30以后多张被其他应用遮挡，13至17多张有下载菜单遮挡；24s为加载。可见局部操作不等全程完整、无切换/无遮挡闭环。 |
| `copy-A-B-final-desktop.mov` | 24.716667s，2940×1912，nominal fps58.950203 | 0至21s每3s；13.5至16.25s每0.25s对结果卡区域裁切。14.25s可见A成功，14.5s可见新B无复制态，15s B成功，15.25s诚实失败，与四态JSON/截图一致。14.75s该裁切区域不可见，不补称全片无遮挡。 |

两片 sha256分别为 `d3c8112d612309e5ffe1ef59324c18109e4008ebc9afef85752d785ead14be2b`、`71e060c16d6dd7fe2a1bb1ea8f0577bfe7d0158f0b096510874ba44eba2c1900`。完整9片hash见本前缀result JSON的videos，与Main索引一一对应。

辅助图片仅在自有tmp，未归档包含无关应用/个人信息的全屏抽帧，不转抄无关聊天。抽帧排除顶部地址区域，复制细查仅取结果卡区域；**裁切/抽样不是全帧认证脱敏检查，不能给原片“无凭据可发布”的签字**。无录屏起止执行时间和用例事件到media秒数的完整索引，不能按文件名把不同轮自动拼接。

没有取得浏览器菜单100%的可核证明。本轮为隐私而裁掉菜单/地址区，所以也不声称“已检查全片菜单不存在”；缺证保持BLOCKED。DOM CSS1440×900/dpr1、outerHeight857不能替代原生缩放证明。原片解码能力已成立，不把证据遮挡或缺菜单转MANUAL_PENDING。

## 7. 正式保护原范围

仅比较 Main 已交 `formal-before.json/formal-after.json` 元数据，不读取其中任何业务/微信文件内容。按完整键集及sha256/mtimeNs重算，与 `formal-comparison.json` 的2变更6新增0删除完全相符。

| 原登记范围 | before→after文件数 | 本轮差异与口径 |
| --- | --- | --- |
| 全 data | 123→129 | 2变更6新增，均在wechat-pilot；全data零变化**不成立** |
| 其中 data/pmtool | 57→57 | 文件元数据零增删改，局部PASS |
| 其中 data/wechat-pilot | 2→8 | config/environment变更；collector锁、日志、原始记录、两报告、status新增 |
| data其余已列文件 | 64→64 | 文件元数据零变化；未扩大为目录/缺根状态门 |
| packages/backups | 110→110 | 已列文件元数据零变化，局部PASS |
| exports | 1→1 | 已列文件元数据零变化，局部PASS |

234/240是**文件元数据项**，不含原根/空根/缺根清单；不等于前轮PATH的285项（234文件+51目录）。后者六保护根历史限定PASS保持，不用不同时段的零变化替代当前全data比较。

**零变化门FAIL只指确证比较结果，不指Main污染。** 微信路径不证明写者、授权、并行采集时序或本轮归属；未核原始写进程链，来源标BLOCKED/待核。不清理、覆盖、停止微信在途成果，也不把并行来源口述当作排除污染的最终证据。

archive索引列了正式/隔离软链当前目标，没有同范围前后事实；正式PID/端口、主树lib及profile完整保护链仍未齐。当前软链指向主树只是索引事实，不据此推断该PID实际运行候选，不授权切换软链或恢复服务。

## 8. 最小补件与停止边界

这里只列既有合同缺证，不开启其他功能、不新增全球矩阵。优先补当次已保存原件，真正无法恢复才由Main按原合同补采：

1. **共同环境/运行绑定：** 同一GUI会话的浏览器名称版本、原生菜单100%、隔离PID/cwd/argv/profile解析、实际下发bundle指纹及当时开关。认证值全部排除；当前源码相同不能代替历史会话下发。能继承同会话环境者不要求每一步重拍菜单。
2. **看板原动作与保护：** A/B/D映射、首拖目标/松手位置与压实关系，按§4.2由专家澄清差异；原三拖/撤销逐态stage scrollHeight与空白观察；保存和取消窗口的全库before/after及允许dashboard差异。已有11布局结果无须为增加截图数重做。
3. **可审过程：** 给原片事件秒数映射及可持久脱敏副本。看板被遮挡而确实无法审的原动作只补同fixture/同视口的一条连续可见录像；复制四态局部已审，不因看板遮挡全量重采复制。右缘只补实际wheel步骤/片段锚点，不新增删除/缩放操作用例。
4. **保护归因：** 保留全data八处差异，补不含内容的写者/时序与该批隔离归属证明；正式原范围前后profile/精确PID/主树lib等已有保护原件。没有before的范围诚实标未覆盖，不倒推零变化。

上述补件引用“当前候选”前，须先处理§3.3的新增Launcher认领；本专家不会为使复核转绿而覆盖旧candidate或回退并行修复。

Main当前 Finder control真实双击及菜单/S3诊断交其他专家，本报告不操作、不判其PASS/FAIL。未覆盖的OKR/习惯/Finder/原八项余门及remaining后续阶段保持原登记状态，不标N/A、不偷签、不据本报告开始发布。

## 9. 复核产物与验证记录

复核环境 macOS/darwin、Node v22.23.3；pnpm11.28.5来自Main日志，专家未运行pnpm。只读检查器 [a0-gui-raw-review-20261021-check.mjs](a0-gui-raw-review-20261021-check.mjs) 和生成 [result JSON](a0-gui-raw-review-20261021-result.json) 保存14源、构建计数、各卡bbox/canonical、原证逐hash、正式差异、9片hash和一致性失败清单。

本轮首次checker误把 `git check-ignore` 的“非忽略exit1”当工具异常而中止，已改为按git语义检查；这是专家审证工具错误，不是产品失败。未执行产品测试，也未因此改产品。

复核命令（macOS，已存在nvm Node22；不安装/构建/启服）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a0-gui-raw-review-20261021-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a0-gui-raw-review-20261021-check.mjs --output
git diff --check -- docs/testing/a0-gui-raw-review-20261021*
```

`--output`只生成本前缀result JSON；复核器exit0仅表示原证/当前字节一致，不给GUI、保护不变量或全门自动PASS。原证索引sha和逐命令结果以本节收尾补记为准。只写授权自有文件，无commit/push，无living docs或其他专家原件改动。

收尾复核快照 `2026-10-21T11:17:26.863Z`：

| 验证 | exit / 结果 |
| --- | --- |
| `node --check ...check.mjs` | 0，专家工具语法可用 |
| `node ...check.mjs --output` | **1**，五项一致性告警全部为§3.3的package/两树patch/认领外文件；不是构建/GUI产品失败，不改检查使其转绿 |
| `git diff --check -- docs/testing/a0-gui-raw-review-20261021*` | 0；对未跟踪自有文件另作末尾换行/行尾空白/Markdown本地链接检查，0问题 |
| 原证复算 | 选定57原件均匹配Main的215项索引；7归档、9mov hash一致；GUI布局关系、复制六文件、src364/lib453无矛盾 |
| 本次检查期间稳定性 | 14认领文件及453产物复读无进一步变化；不表示它们全部匹配原candidate，package此前已变 |
| Swift原片解码/抽帧 | 5次解释执行均exit0（初次metadata、两片全跨度抽帧、看板10..23s、复制13.5..16.25s），具体可见状态/遮挡边界见§6；未运行任何产品用例 |

当前两树patch均为 `b5fd78d3370fab0966a701e1a67bdfb22cb86b7f6d3f999cd6f2672ebab273f9`，不是原A0的 `fdeadce4...3400a`。专家checker hash `4316d93e11ae95f9e882ceef3bc9c5cab319d4e7ed5ea8e49ff406029d5d422f`，本次result hash `bcbebab8abc76a0cf24bad661ae960d0e16256ca42106d80bbe2844079415b28`；以后重跑result时间/指纹会改变，引用须注明快照。

关键已交原证hash：final-build-proof `333913f85c200fbac7e1863f4da4aca2e3100c7a0fe1a1add545a4d99a962f36`；board-r3-states `64325e314bc9c5c743e431d1b476bb3b466b23368c236be510a1428305282621`；right-edge-scroll `3ecac3a5cd324db97d8a3586296235043e3e3d172a614a57710c5cce6357f5c7`；copy-steps `b6006a367fd3d0304cd58d2f97dae889458c9d424fab9bd2073c0cb52dd908ff`；copy-boundary `e615049fdc2b85a6ca5cd86ab0e768a5965d0cc6385dfe4be708abd7ff374156`。其余逐件hash在result中，不输出可能认证内容。

**最终出口：原A0逐态GUI/构建/归档有限PASS；完整GUI门BLOCKED；全data零变化不成立且写者归因待核；新Launcher候选尚未重新认领。没有给A0整批或其他领域签PASS。**
