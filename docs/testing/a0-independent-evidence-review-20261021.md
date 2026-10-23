# A0 已到证据包独立审证

> 供 Main 与独立测试专家使用。仅审 `reports/all-pending-evidence-20261021/A0` 已交原证及候选身份，不扩合同、不替其他专家改原件、不判整批或全系统 PASS。2026-10-21，平台 trae，独立审证测试专家角色；原测试执行者为 Main，本报告判定者为本专家。

## 1. 初审即时缺口

本节保留初审发现，后续核查和有限审签见 §3 至 §7。以下为证据阻塞，不据此判产品 FAIL。

| 编号 | 已核事实 | 最小补件 |
| --- | --- | --- |
| A0-E01 | `candidate.json` 有 14 项 source 与 3 个 client bundle 指纹，但无执行时间、逐命令 cwd/argv/exit、原日志 sha256、stdout/stderr 归属及运行前后候选清单。 | Main 补同候选的脱敏执行索引；不需要重跑已可核日志，不补造未保存的 exit。 |
| A0-E02 | 已交构建日志为 `pmtool-all-closure-20261021-build-fixed.log`，归档文件 mtime 为 07:30:05Z；末轮 launcher、plugin test、guard 日志为 10:08Z 至 10:11Z。candidate 冻结为 10:17Z。mtime 不是构建执行时间，也不足以证明最终修复已经编译。 | Main 交最终源码到实际构建产物的命令/时间/exit/清单绑定，含服务器端产物；当前 3 bundle 字节身份另核，不以当前 hash 反推早轮构建。 |
| A0-E03 | `pmtool-closure-verify-r3.log` 仅 WATCH 隔离树的 `data/packages/backups/packages/backup/exports/assets`，起始均缺失；末尾 before=5、after=5、污染0。这是五个 MISSING 哨兵，不是五个正式业务文件。已交 `formal-before.json`，未见同范围 after 清单。 | Main 交正式保护资产同范围的脱敏 after 与 before 比较；不得读取或归档认证内容。本轮隔离五根的零变化与正式资产零污染分开判定。 |
| A0-E04 | 七份原作者输出为 `.log`；尚未见原证 hash 索引或非忽略归档副本。 | Main 保原文件并补逐字节一致的 `.txt`/可交接原证及 hash 索引；本专家只在自己文件记录审查，不修改原包。 |

## 2. 边界与历史

- 依据 `AGENTS.md`、`docs/collaboration.md` §9/§11、`remaining-acceptance-register-20261021.md`、`batcha-independent-findings-and-main-worklist-20261021.md`、`batcha-independent-retest-findings-20261021.md`。用户当前明确派单覆盖本轮只读审证与自有报告写入，不执行通用 install/build/pull/commit/push，也不更新 living docs。
- HEAD 已独立读取为 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3` 加未提交修复。Main 唯一修复、构建及 GUI/桌面采证，本专家未独立运行这些产品测试。
- 首次 `pmtool-closure-verify.log` 已核 95 条启动、95 条 exit=0，但 before=5、after=4、污染1，删除项为 `assets|!!MISSING`。**保留该轮设施 FAIL**；该现象是缺根变为空目录的哨兵变化，不是业务文件被删除。
- 其他专家第五轮仅签源码/AUTO及具体 file-root 设施局部 PASS；第三轮设施 4/5、exit1 的失败历史保留。本轮新全量审查不抹除历史，也不替第五轮扩大结论。
- GUI 入口、项目创建截图仅作为事实材料；BA-COPY-01、BA-JOURNEY-01、Finder、真实 130s/601s TTL 未到完整原证，不签 PASS。不读 runtime/private 认证文件，不输出 nonce/token。

## 3. 本轮独立审签

审证快照：2026-10-21 10:21Z 至 10:23Z。**执行 Main，判定本专家；本轮没有独立重跑任何产品测试。** 下列 PASS 只签已核原始断言和身份，A0 证据包完整门仍 BLOCKED；不将数量映射为 remaining 总登记的新用例通过。

| 对象 / 适用 ID | 独立结果 | 原证与覆盖边界 |
| --- | --- | --- |
| A0 候选 14 文件、11 tracked + 3 新文件 | **PASS：身份核对** | 两树逐文件 hash 与 manifest 一致；两树产品 diff 与 `tracked.patch` 完整一致，无额外未认领产品文件。 |
| 三个 client bundle | **PASS：当前字节身份** | 隔离实际文件与 manifest 的 3/3 hash 一致；不表示最终源码编译链或服务实际下发已经完整核实。 |
| 作者插件全量单测原始断言 | **PASS：1134/1134 原证审证** | r3 日志独立重算 125 文件、1134 项，全部逐行成功与终汇总一致，Vitest 2.1.9、隔离包 cwd 可核。不是全部业务合同或 GUI 验收。外层 shell exit 未在日志保存，不补造 exit=0。 |
| 作者 Launcher 单测原始断言 | **PASS：49/49 原证审证** | r2 TAP 49 条 `ok`、零失败/取消/跳过/todo；8 个实际 test 参数与当前 package script 相符。不是 Finder、实际浏览器或真实 TTL PASS。外层 shell exit 未保存。 |
| 作者确定性 verify 全集 | **PASS：95/95 原证审证** | r3 95 个唯一启动与 95 个显式子命令 exit=0；与实际默认脚本全集相等，无漏件、额外目标或失败。默认排除 guard 自身与 `verify-real-model.mjs`；不能表示真实模型、coverage、宿主 E2E/CI 已通过。 |
| r3 guard 的隔离五根 | **PASS：限定 WATCH 零变化** | before=5、after=5、污染0；五根起始缺失，本专家只读回看仍缺失。5 是 MISSING 哨兵数量，实际业务文件数为0；不扩大到主树、home/profile、运行库、测试过程全部写根。 |
| BA-DEF-01/02/03、BA-INF-01 已有局部独立结论 | **PASS：继承第五轮注明范围** | r5 的 before/after 14 文件 hash 全部匹配 A0；继承路径引用、旅程内存/竞态/原 loopback、真实 React 复制代际、具体 file-root 设施。无变化接缝可继承，不重开已闭误判；完整 stub argv、系统 clipboard、真实计时仍未验。 |
| 正式保护资产全范围零污染 | **BLOCKED：缺 after** | `formal-before.json` 有234项：data123、backups110、exports1；无对应 after、缺根/空根清单、profile/正式进程保护检查原证。隔离 guard 不能替代。 |
| 最终构建与运行装载完整绑定 | **BLOCKED：证据链未完整** | 已交构建日志成功尾行与当前 3 bundle 字节成立；缺已构建输入、外层命令/exit、服务器产物、实际进程解析链和下发字节绑定。candidate/environment 的 PID/port/profileResolved 是 Main 声明，不冒充独立实测。 |
| BA-PATH-01、BA-JOURNEY-01、BA-COPY-01、BA-TTL-01/02/03 及原八项 | **未获本轮整项 PASS** | PATH 仅变量完整值/语法；JOURNEY-02 与 TTL-03 仅内存部分继承。真实130s/601s、GUI/HTTP桥、安全app、Finder、系统复制及原完整步骤原证未到；原 NOT_RUN/旧缺证 BLOCKED 保持，不因入口或作者总数转绿。 |

## 4. 候选身份与指纹

- 两树 HEAD 均为 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品基线至该 HEAD 的 `packages/launcher` diff 为空。认领对象为产品基线加14文件修复，不把文档 HEAD 当干净产品发布。
- `candidate.json` sha256：`2b6265bd1953c186f553d4092fa98ff87f2a14480a82e04383cc63255e0de071`；`environment.json`：`096ffbeffedeaba2e147e417071c59f736139acb18427d517112ac18728c2f52`。
- `tracked.patch` 与两树 `git diff <baselineCommit> -- launcher packages` 均为29028字节、sha256 `fdeadce4b7c39298dc8d2c1d56f5b5854f914893817d7c1eb884f698afc3400a`。下表 N 为新增未跟踪，M 为已有文件改动，清单无遗漏。

| 文件（相对仓库根） | 类别 | 主树 = 隔离树 = manifest 的 sha256 |
| --- | --- | --- |
| `launcher/package.json` | M | `d3a59bc513cccb69e1b9f090fff6248ed9c22a140e46553a20f362af7b24a413` |
| `launcher/src/launcher-app.mjs` | M | `b41e5fbaf8fe7679fe1516f92c516c24d89b60b636db529a002f2e727d3a5c19` |
| `launcher/src/local-app.mjs` | M | `1feaba02db033136e9786a7310a96a72c7332114faece5295b5b44545f058f9b` |
| `launcher/test/app.loopback.test.mjs` | M | `b3d003efe921098de4b80a834010ad13a2417b35bfde1a3a15aea5058015b8e7` |
| `launcher/test/journey-race.test.mjs` | N | `fa9ae8e1ad5201bb8f870e5ed7fe6d6554e96bd9d6cd4315dbe2c82ef023c37a` |
| `launcher/test/local-app.test.mjs` | M | `e15eea7885156c9e8ee5b4685647ecb2fbbe5887257000ad43e7d966121ac13a` |
| `packages/dsh-pm-tool/package.json` | M | `c50ccd376a46dbf8ae9c05e9425edcecc4e052e79e748e172780137276848d66` |
| `packages/dsh-pm-tool/pnpm-lock.yaml` | M | `646a1a27770cc32b8f07195a3e3c5b7c038aae7040dc408749719f8d76963caa` |
| `packages/dsh-pm-tool/scripts/verify-ui-feedback.mjs` | M | `492f4cb47083e98360acdf7e08df92d36cec3b4db2743fd93f3f4c7dc076d110` |
| `packages/dsh-pm-tool/src/client/panel.tsx` | M | `195c3cababcbca069b2c47e3042f667736e3c4038bdc78c341d55989849ed90d` |
| `packages/dsh-pm-tool/src/client/result-card.test.ts` | N | `4e815421f70ab285343aa6d1ba2feaf4c0472ae167a9109d48d43fe83deda32a` |
| `packages/dsh-pm-tool/src/client/result-card.tsx` | N | `c7c2578c2b3799c422ff202bde7b2003492e3688a30dac3ee84c9e3b4c9e517b` |
| `packages/dsh-pm-tool/src/client/shared/contract-pilot.test.ts` | M | `a6f24ae6ba5842f06c1ab306d4870c91cb749af3d7f11ec078c984211d84ec95` |
| `packages/dsh-pm-tool/src/core/file-root.test.ts` | M | `88b573dcd19d54266a5d4c7fcc506a2d6f38e55c5218bbb6e9bfa228528f212d` |

| 隔离产物（相对插件包根） | 实际 = manifest 的 sha256 |
| --- | --- |
| `lib/client.editor.js` | `e2e6d96093243df6cbe3e2e06e8316d9650db4cd87b95c192c167b35994b2d57` |
| `lib/client.formula-expr.js` | `89b55b0d853ec8a3ff559c3889694f18df3b969ea445d9cf5aaa7b881df7f798` |
| `lib/client.js` | `5ae7808cb3bcdb3f8e2577c84a587080f6dbd4f87b516a9520266a84872ac9ec` |

插件 version `0.7.4`、Launcher version `0.1.0` 与包字段相符，二者不同不构成版本三元组错误，本轮不打tag。Main声明宿主提交 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`、3205/PID27767、初始pilot off、DSH_PM_E2E=1；未读取 runtime/private/profile 凭据或实际服务状态。当前 source map 内 `client/panel.js` 与 `client/result-card.js` 的 sourcesContent 分别匹配隔离编译文件 hash `7f57321bf380c41d9333390dc16fc9b1bf17d2137a0104ac18609382bae64c90`、`058e2777fbaef5a40603b9a57f57ccb05a52fb74330a44c254a2bb29ca082efb`，仅补强已打包编译输入身份，不冒充 TSX 到 JS 的最终构建证明。

## 5. 原始日志完整性与执行结果

七份归档日志均与 `/private/tmp/<同名文件>` 的 Main 原件 hash 一致、均有完整尾换行。没有发现截断或计数矛盾；同源副本一致不是第二次独立执行。七份均被 Git `.log` 规则忽略，交接持久性缺口尚未关闭。

| A0 原日志 | 字节 | sha256 | 本轮审证结果 |
| --- | --- | --- | --- |
| `pmtool-all-closure-20261021-build-fixed.log` | 978 | `08931746cda61599cfa0b7fa180e479d3b9a53cd105a0b80faf8b11e9d8f5563` | tsdown完整成功尾行；外层exit/最终输入链待补 |
| `pmtool-closure-launcher-red.log` | 5483 | `7a7c4e8a9c76185f146a64aa328e61b76db7313b48a445f3148511d1b9a26c48` | 修前10/12、2失败历史保留 |
| `pmtool-closure-launcher-green.log` | 3407 | `62cc1f2e5eeeaca3d3cc90f891b2b61ec41c49e6615fe6a375d24d96e7e4ab2c` | 早轮12/12；不能代替最终49项 |
| `pmtool-closure-launcher-tests-r2.log` | 13073 | `1baf36913bebd94a74f994ae09c7ad9e1f97ba1fcc824f3949a87cba94258519` | 最终TAP49/49、fail/cancel/skip/todo均0 |
| `pmtool-closure-plugin-tests-r3.log` | 14696 | `257ed58a6bc70cfa0d1b14828343ad102225ae6295ae02fb4720dbd2635b0b47` | 125文件/1134项逐行重算一致 |
| `pmtool-closure-verify.log` | 80422 | `d13cf224c5183f562b56ffa1cf872d64678369c9ebbe51fb73623e1eee3339dd` | 子命令95/95 exit0，但设施污染1，整轮FAIL保留 |
| `pmtool-closure-verify-r3.log` | 80374 | `6972ed4dedd8cd8e0746a9fc321f1f544f34c65257ebe1118c054327a931bf80` | 子命令95/95 exit0、限定隔离五根污染0 |

可核执行命令和 cwd：

- 插件单测日志：`vitest run`，cwd `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool`，RUN v2.1.9；Start at 18:10:59、Duration7.04s。日期/时区及外层调用包装未保存，不从当前专家环境反推 Main 全部环境。
- Launcher 日志：cwd 由 Main 隔离执行声明及相对参数关联，外层 cwd 原证尚待索引补齐；命令为 `node --test test/contract.state.test.mjs test/browsers.controller.test.mjs test/app.loopback.test.mjs test/control-html.test.mjs test/cancel.race.test.mjs test/journey-race.test.mjs test/loopback-security.test.mjs test/local-app.test.mjs`，Duration406.880167ms。
- guard：实际 `scripts/verify-isolation.mjs` 默认目标规则与日志逐个匹配95项；每项 `node scripts/verify-*.mjs`、cwd 为上述隔离插件包、exit0与耗时均逐条存在。完整95条命令/exit/耗时可由自有只读 checker 的 `logs[].guard.commands` 回读；不把脚本内部合法的 unknown-card `skipped=1` 当用例SKIP，也没有发现宿主E2E成功记录可据此签字。
- 作者原命令输出合并 stdout/stderr，未保存外层 exit/signal 的项诚实缺证。负例预期错误日志与成功尾行并存不是新产品FAIL；本次不因缺 wrapper 元数据否定可核的1134/49原始断言。

`formal-before.json` sha256 `79a1bcd7738b109b56729a1eb894cb57062f384ba0dd76777a211d9f2770fc67`，只有文件 sha256/mtimeNs 元数据234项。本专家未读取其指向的正式业务内容。该单独 before 不能证明没有新增、删除、变更；未列根/空根更不能自动按零污染处理。

## 6. 继承、历史与最小缺口

第五轮独立复验时间为10:14:50.684Z至10:14:54.228Z，`sourceChangedWhileTesting=[]`；24项原登记中的本轮14项 before/after 全部对应A0。其独立执行者为原复验专家，**不是本审证者，也不是 Main 作者全量测试**；本报告不改该专家原件，只继承无变化的已签范围。

保留首次空目录污染和第三轮设施失败，不能写为“历史从未污染”。本轮五根都缺失并不证明首次旧目录如何处置；Main尚需补原根变化/处置时间线，不能倒推由哪个历史进程唯一造成，也不在本报告授权删除现有目录。guard源码hash `b0545013f1ffd8abf8b5fdeaab8553c8fed1d9f7556f6a681f3326011b7872d0`，本轮测试修复不改其WATCH/sentinel。

下一最小交件仅四组，不重派其他功能或扩大合同：

1. **执行与交接索引（A0-E01/E04）**：Main保七份原件，追加逐字节一致且不忽略的原证副本及hash；补原命令、cwd、开始/结束、Node/pnpm/OS、stdout/stderr归属、外层exit与执行前后候选。已丢失值写“未保存”，只有影响必需门的缺证才补跑，不伪造exit、不为归档全重跑。
2. **构建/装载绑定（A0-E02）**：补已构建生产输入与当前候选的差异/指纹、server-side产物清单及有效运行解析/下发字节原证。时间差不是旧bundle缺陷证明；若晚改仅Launcher源码或测试/声明且编译生产输入未变，可交接缝依据继承，无须无理由重建。若实际输入不同，由Main唯一builder重认领。
3. **保护资产完整比较（A0-E03）**：同范围正式before/after、缺根/空根及实际写根清单，准确分隔主树与隔离库、profile/正式PID/主树lib保护事实；只交脱敏元数据，不读或复制认证文件。保首次污染和处置记录，不用本轮空根覆盖历史。
4. **原合同剩余动作**：Main继续原batchA GUI/Finder/PATH完整stub与130s/601s真实计时原证，不把正在采/入口可见/新建项目当整门PASS。BA-TTL-03只继承替换/取消的内存断言，HTTP桥/真实旅程未交部分仍待审。

## 7. 专家只读复核与出口

本轮自有产物只有本 Markdown 与 [只读复核器](a0-independent-evidence-review-20261021-check.mjs)。复核器只用Node内置fs/crypto/child_process和只读git命令，硬限制14源文件与3隔离bundle、固定7份日志；无install/build、服务/端口、profile或主树lib操作，无运行产品用例，无runtime/private认证读取。工作记忆路径未存在、`rg`不可用，改用明确路径与Node结构化读取，不安装工具。

执行环境：macOS/darwin，审证Node `v22.23.3`；本轮未执行pnpm，其版本不能冒称独立核实。10:23:13.565Z只读检查输出：14/14一致、bundle3/3、原件7/7、125/1134、49/49、95/95、第五轮14/14继承匹配，`integrityFailures=[]`，**exit0仅表示审证检查无矛盾，缺口仍存在**。

复核命令（macOS + nvm Node22；无写入、无安装/构建）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a0-independent-evidence-review-20261021-check.mjs --summary
```

移除 `--summary` 可在 stdout 查看95条逐命令exit/耗时，不输出认证值。本轮未提交/推送，未更新其他专家原件或living docs。**A0已到原始AUTO断言有限PASS，证据包完整门BLOCKED；batchA/全部未验功能/发布门未获PASS。** 受影响源码、产物或日志字节再次变化时按ADL-057重新认领和审受影响部分。
