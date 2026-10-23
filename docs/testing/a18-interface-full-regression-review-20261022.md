# A18 接口脚本完整回归独立原证审证

> 2026-10-22，trae 独立测试专家，非开发/构建/GUI执行端。给 Main 与接续专家核定已有原件、接口采纳和证据继承；只签有限 AUTO，不签全产品、GUI总门、发布或 commit。

## 1. 有限结论

**有限 AUTO 原证一致性与继承 PASS。** 当前接口输出的 typecheck、95/95 guard、guard selftest、Launcher 56/56、Launcher verify 原退出码均0，逐项原件与候选一致。主产品源码未因此改变，453件原 A18 产物逐字保持；既有 A18 构建及 SOURCE/AUTO 结论只按原范围继承。本角色没有执行上述产品命令、build/install、GUI、服务、模型或归档 Python。

**旧 A18 93/95 FAIL、旧20的19绿1红、原接口脚本两次 exit1及历史十个 bin 漂移全部保留。** 新 oracle 采纳后的95全绿不倒签旧候选，也不把历史污染洗成0。带成功/summary/detail/action标记的 catch 原因 GUI仍 BLOCKED，不借 AUTO 签 GUI。

最终 [audit](a18-interface-full-regression-review-20261022-audit.json) 有9组结构检查成立；[seal](a18-interface-full-regression-review-20261022-seal.json)登记限定保护与释放。所有父派单、后续交接和写面见 [计划](a18-interface-full-regression-review-20261022-plan.md)。本角色只写本 testing 前缀，不触碰产品、其他testing、livingdocs、原证、依赖、服务或版本控制；最终封存后释放、STOP。

## 2. 候选与唯一差异

原产品树 `/private/tmp/pmtool-a18-closure-20261022`；接口输出树 `/private/tmp/pmtool-a18-interface-output-20261022`。基线均 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，并非以 HEAD 单独代表 dirty 候选。原 candidate、tracked patch、完整source/artifact清单及新 approvedDelta共同认领。

| 对象 | 实核结果 |
| --- | --- |
| 原520输入→新521输入 | 原有文件仅两脚本不同，新增一个helper；其余518输入hash相同 |
| 完整src/scripts/lib实际发现集 | 与声明逐项同名单/同hash，不只抽查候选字段 |
| `verify-gantt-drag.mjs` | 加一条import，仅替换原105行形态断言为`verifyCatchFeedback` |
| `verify-ui-feedback.mjs` | 加一条import，仅替换原234行形态断言为`verifyNoticeContext` |
| `feedback-context-contract.mjs` | 与独立helper逐字相同，SHA256 `27b834a2786ea6b71615bf6d24dc67888f79321b4bb10160a392e97f225d4e03` |
| 453件lib产物 | 旧A18、新输出、pinned11 proof全部逐项同hash，无新build |
| 原接口独立冻结输入 | src388/scripts104/四配置逐项与旧A18一致 |
| Main当前输入 | 开工时单次哈希521项吻合；仅认领当时，不要求Main以后不变 |

Main 的 import 放在既有 import 列表末尾，专家副本放在首条import后，完整脚本hash不同。两者删除该唯一相同import后逐字一致；再反向替换唯一断言必须完整回到原件，已实核。没有放宽其余assert、fixture或步骤。生产实际publisher仍名 `setMessage`，不是依摘要另造 `publishMessage`。

依据 [原接口独立报告](a18-verify-interface-contract-review-20261022.md)：helper核真实catch无条件发布完整reason/显式error、实际state/context及ResultCard/Toast生产接线；八组反对照有效。本单重新核其52条原command/stdout/stderr/reporter哈希及原exit，未重跑、未重读全部旧开发四轮，不重复签原动态用例。

## 3. 原完整回归逐项核定

运行原环境：macOS、Node22.23.3；Launcher原argv固定既有pnpm11.28.5入口。接口父命令时间为01:05:50.180438Z至01:06:26.022718Z，均在独立输出下执行。精确五条argv/cwd/env/时间/退出及原stdout/stderr指纹在audit.commands；95个原名/退出/时长/完整stdout与原日志offset在audit.guard.rows，Launcher56名称在audit.commands[3].cases。

| 原命令，非本角色执行 | cwd（接口输出内） | 原exit/核定 |
| --- | --- | --- |
| `node <包>/node_modules/typescript/bin/tsc --noEmit` | `packages/dsh-pm-tool` | 0，stdout/stderr均空 |
| `node scripts/verify-isolation.mjs` | 同上 | 0，95/95，失败0 |
| `node scripts/test-isolation-guard.mjs` | 同上 | 0，增改删/缺根fixture检测与清理输出完整 |
| `node <既有pnpm11.28.5>/bin/pnpm.mjs test` | `launcher` | 0，56/56，无skip/todo/cancel |
| `node <既有pnpm11.28.5>/bin/pnpm.mjs run verify` | `launcher` | 0，隔离假监听者验证输出完整 |

默认发现器的 `verify-*.mjs` 排除guard自身与real-model，新旧均为同序95项，并与专家 proposed-discovery完整相同。非verify前缀helper未增加目标，自有adapter未混入scripts发现集。每项新原日志都有非空stdout及真实退出0；原两红保留空stdout与105/234 AssertionError stderr。不从“工具结束”或只一条总汇报推断成功。

**guard的污染0仅覆盖输出树的data、packages/backups、packages/backup、exports、assets五根。** 原日志五根均缺失，`before=5/after=5`是五条MISSING哨兵，并非五个真实文件。不得照末尾通用文案扩大成共享备份、全机或依赖历史零污染。

guard原stderr保留非法证据协议、未找到对象、写入失败、导出EEXIST、空清单等负例输出；并非stderr空或所有路径都成功。Launcher stderr为原pnpm命令回显，不能称所有stderr全绿/全空。

仅读归档 `/private/tmp/pmtool-a18-interface-regression-20261022.py`：确认拒覆盖、从旧A18复制、三脚本采纳、白名单env、`subprocess.run`原returncode和stdout/stderr落盘、差异与产物检查。没有执行它。五条父记录不含PID，95子项无单独PID/原stderr文件；子argv由已冻结guard源码推导并明确标注，不伪造原命令采集记录。外层Python最终退出/PID未独立归档，不据候选内写0补造。

## 4. 构建与证据继承

原 `build` 的 noemit/build/coverage各exit0；其首轮实际pnpm12.14自动安装尝试与warning保留。`build-pinned11`固定入口version11.28.5与noemit/build/coverage各0，149文件/1552测试绿，source520/artifacts453与原candidate相同。固定11原件仍有依赖校验/拒删除/安装前失败warning，不称干净install，更不因最终build0撤销设施问题。

| 变化接缝 | 旧证据处理 | 本单范围 |
| --- | --- | --- |
| 仅两verify形态断言 | 旧两脚本FAIL保；采用已独立审准oracle后新95有限PASS | 不把旧93/95改成绿 |
| helper新增/发现器 | 原95发现集完整不变，新helper逐字独立原件 | 无业务模块/新依赖引入 |
| 产品src、453产物未变 | 原A18 SOURCE/AUTO与构建按原范围继承 | 不重签GUI、真实网络或事务 |
| 原20无context TTL断言 | 原exit1/19绿1红保；独立真实context adapter20/新16只引用原签字 | 不修改旧expect |
| Main后续A19/reflect或其他源码更改 | 另认领新候选，按受影响文件/用例判重测或继承 | 本签字不自动覆盖后续源码 |

既有 [导入GUI报告](a18-import-feedback-gui-review-20261022.md) 的CSV/XLSX错误全文/复制/原时点持续/失败保预览/重试/新父子重开有限PASS仅引用，不重审。后续 [feedback-controls报告](a18-feedback-controls-gui-review-20261022.md) 已签实际成功词标题、明确弃稿→关闭卡→重输正常保存有限GUI PASS；原模态背后关闭超时、保草稿穿越关闭及标记catch/代际竞争GUI仍BLOCKED。本单不把取消草稿说成保稿穿越关闭，不重复该角色采证或目视。

A20原4红/12+31控制与自有依赖保护属其独立任务，不纳本审证。全积压/真实模型/宿主激活/完整GUI/样式UX/总门/统一普通commit未由本单放行。

## 5. 依赖完整复制证明

源 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，副本 `/private/tmp/pmtool-a19-owned-deps-20261022/node_modules`；接口包node_modules软链只指该副本，未重指原共享链。本单未修改source bin或任何依赖。

已逐项核 [source-before](../../reports/all-pending-evidence-20261021/A19/dependencies/source-before.json) 与 [copyproof](../../reports/all-pending-evidence-20261021/A19/dependencies/proof.json)：**13613个普通文件完整同名单/hash/bytes；源mtime/inode与原清单同值，副本每个dev/inode组合均不同于源；1030条link全文同原清单，逐条实际解析落副本内；外链0、共享inode0、源漂移0、违规0。** 新补的AJV dist/runtime、lib/runtime共64条属于合法库代码，不是私有运行根；首manifest未覆盖它们的事实保留，另补指纹，不重freeze。

copyproof可持久引用，但仅证明这次完整物理复制及已核link，不证明所有执行时动态依赖绝对封闭。普通shim中的历史绝对NODE_PATH文本仍原样复制；外链0不等文本没有外部前缀。历史十个bin A16→A18内容漂移和归因PID未确证问题继续保留，详 [原只读诊断](../../reports/a19-shared-bin-drift-diagnosis-20261022.md)。未来修改依赖须核其自身内容指纹、实际解析和受影响用例，不凭这次copyproof永远通行。

## 6. 哈希、保护与自有验证

| 固定对象 | SHA256 |
| --- | --- |
| interface candidate | `e730b693f9dabd66ca8dd26a39a7c47da828cd2629747a9696a665618ddc6901` |
| 原A18 candidate | `2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9` |
| dependency copyproof | `fd8754dcdb76d05f5516046001f8ab6390fc083b8944e471a61c17dcfb2c4eec` |
| dependency source-before | `b91c127d246b377481f6a7e57ec2b78db5800658efb0509af80873d96979d7f2` |
| 本轮before manifest | `5aa87c2c6e48b52e3ad512760895baf4a99f1b1c483d7c6795f0e071a8fd2995` |
| 本轮audit | `ae627ae56657bf6b80887a0555c23e66a0961e1e19f92f8250f8fffd5b429e8b` |

初次226声明根有重叠，34892唯一文件/link条目；另2个专家adapter及64个库文件补充保护。仅限定根，不是全盘扫描。原A18完整source/lib、接口输出/input、依赖源/副本及已读固定回归原证的hash/bytes/mtime/inode无漂移。私有HOME/cache/tmp不读、不复制。

**唯一原始delta是其他专家合法完成feedback-controls在途计划**：SHA `18194d7739209149b31a9ef6f467fc0f4600db61d1f228b67cddda8465c8e0fa`→`b81d749d51734892ea6d79642b56f4f326d47130076bd40443d91e4d5f23e767`。只单列这条已核进度变化，原before不覆盖，最终报告仅新增引用/指纹。immutableDrift为空不等所有参考文件绝对未变。Main动态src/scripts、GUI/runtime不列未来零写根。

本角色实际环境macOS darwin/arm64、现有Node22.23.3；仅Node内置文件API、无产品import/子进程/网络，未调用pnpm。本脚本入口仅供另轮授权文件审计，已存在输出拒覆盖：

```sh
# macOS，仓库根；不是产品回归命令
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a18-interface-full-regression-review-20261022-audit.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-interface-full-regression-review-20261022-audit.mjs freeze
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-interface-full-regression-review-20261022-audit.mjs audit
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-interface-full-regression-review-20261022-audit.mjs seal
```

语法检查0；单次freeze0/PID73765；审计先后五次exit1保留，原因依次是import位置假设、旧FAIL空stdout、originalExit字段、误排库runtime和合法在途计划收尾，不改产品或原件补绿。最终audit **exit0/PID74996、9组核对成立**。异步命令均只读取对应本次execution.json/output核真实exited，不以文件存在冒称退出码；完整失败/命令记录见 [attempts](a18-interface-full-regression-review-20261022-attempts.json)。最终seal退出和指纹以其原件为准，不以报告文字代替。

## 7. 释放

本单有限AUTO PASS允许引用本接口输出的原95完整回归及未变产品证据，不扩大为新Main、A19/A20、GUI总门或发布批准。已收束，不追加用例、开发、重复freeze、旧四轮读取或扩门。

最终封存后本角色无运行测试子进程、builder、GUI连接或服务资源占用，**报告交回即释放、STOP**。Main沿最新授权继续A19 habit关联展示有限开发及其他既有证据收集；用户持续全部适用独立验收、最后普通commit目标不停止。本单不做整包commit/push/tag/正式切换。
