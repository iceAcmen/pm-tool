# K16 archive R2 独立审证实际命令账

环境：macOS，cwd `/Users/bytedance/Projects/dsh-pm/pm-tool`，同步 `exec_command`；既有 Node `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`。没有产品执行、spawn、Git、网络、GUI/桌面操作或长运行session。下表的0/1/127均为实际已返回工具末码，不是预计码。

## 1. 自有 reader 命令

以下 `NODE` 只是表格缩写，实际工具参数一律使用上述绝对路径；reader实际路径为 `/tmp/p2007-archive-repair-gui-review-20261023-r2-reader.mjs`。

| 顺序 | 实际命令 | 实际工具exit / 结果 |
| --- | --- | --- |
| 1 | `NODE --check /tmp/p2007-archive-repair-gui-review-20261023-r2-reader.mjs` | 0，首版语法 |
| 2 | `NODE --version` | 0，v22.23.3 |
| 3 | `NODE /tmp/p2007-archive-repair-gui-review-20261023-r2-reader.mjs audit` | 1，0.3623s；source清单字符串/对象误读；first-reader-error.log |
| 4 | 同上 `audit`，仅修本reader对象解析 | 1，0.2937s；误要求storage未变源存在dirty124；second-reader-error.log |
| 5 | 同上 `audit`，仅修dirty/complete清单区别 | 1，0.3608s；source-map补回多newline；reader-error-1792715040445.json |
| 6 | 同上 `audit`，仅修source-map注释34B | **0，0.4209s；11组实核，717件，730保护输入，errors=[]** |

后续final `--check`、`publish`、`seal`、`readback`的真实工具结果在后置seal-tool-receipt/readback-tool-receipt；这些命令不重产品、GUI或成功archive。发布只逐原字节复制自有audit/inputs/reader/设施失败原件到授权新前缀。seal/readback只做明确封件保护和输出读回。

## 2. 只读探索命令

下面路径 `R`= `reports/all-pending-evidence-20261021/P2007ArchiveRepairGuiR2`，`T`=`docs/testing`，`S`=`/Users/bytedance/.trae-cn/plugins/trae-remote-official/deep-research-assistant/0.1.0/skills/research-guide`。缩写用于展示，原工具调用是展开的完整路径。所有命令 cwd 同上，未使用shell串联写入。

| 命令 / 按实际调用分组 | exit |
| --- | --- |
| `pwd` | 0 |
| `cat AGENTS.md` | 0 |
| `sed -n '1,240p' T/p2007-archive-known-gaps-red-20261023-r1.md` | 0 |
| `cat docs/plans/2026-10-23-p2007-archive-gui-r2-plan.md` | 0 |
| `rg -n '^#{1,4} \|ADL-057\|§11\|§9' docs/collaboration.md` | **127，rg未装；没有安装** |
| `sed -n '240,610p' docs/collaboration.md` | 0 |
| `cat T/p2007-archive-projection-source-auto-20261023-r1-report.md` | 0 |
| `cat T/f02-combined-regression-review-20261023-r2-report.md` | 0 |
| `ls R` | 0，只枚举此封包顶层 |
| `cat S/SKILL.md` | 0 |
| `sed -n '125,245p' docs/collaboration.md` | 0 |
| `cat T/f02-combined-regression-review-20261023-r2-seal-tool-receipt.json T/p2007-archive-projection-source-auto-20261023-r1-seal.json` | 0 |
| `sed -n '1,240p' R/index-r1.json` | 0 |
| `cat R/seal-r1.json R/seal-outer-receipt.json R/activation-binding.json` | 0 |
| `cat S/references/research-report.md` | 0 |
| `cat R/round02-before-archive-roots.json` | 0 |
| `sed -n '1,180p' R/round02-before-archive.json` | 0 |
| `cat R/round06-reentry-observations.json R/round03-export-originals.json R/round03-error.json R/round05-error.json` | 0 |
| `sed -n '1,170p' R/round02-archive-review-events.json` | 0 |
| `ls R/frozen-source R/round02-before-archive-raw` | 0 |
| `cat R/entry-executor-source.mjs R/export-executor-source.mjs R/files-executor-source.mjs R/filesfollow-executor-source.mjs R/reentry-executor-source.mjs R/reentryfollow-executor-source.mjs` | 0，只读正文，不import/eval |
| `cat R/frozen-source/src/core/archive.ts R/frozen-source/src/core/review-materials.ts` | 0 |
| `cat R/round02-before-archive-raw/data/pmtool/reflections/` 下四个指定 `ref-*.json`，同一cat调用 | 0，精确四ID，不glob递归业务根 |
| `cat R/harness-source.mjs` | 0，只读 |
| `ls R/frozen-source/src/core R/frozen-source/src/commands` | 0 |
| `cat reports/all-pending-evidence-20261021/F02RepairGuiR2/browser-script-binding.json` | 0 |
| `cat R/inspect-outer-start.json R/round04-file-0-reflection-scroll.json` | 0 |
| `cat R/frozen-source/src/commands/archive.ts R/frozen-source/src/commands/review.ts` | 0 |
| `sed -n '1,120p' R/frozen-source/src/core/storage.ts` | 0 |
| `sed -n '130,370p' R/frozen-source/src/core/archive.test.ts` | 0，不运行测试 |
| `cat R/2026-10-23-p2007-archive-gui-r2-outer.mjs` | 0，只读真实结束后收据写入及exitCode传播 |

内置 `NODE -e` 只读探索实际6次，全部exit0，使用仅 `node:fs` 或 `node:fs/crypto`，没有child_process/import产品/网络：

1. 结构化摘要 combined-source/complete/candidate/built、preflight、file/host/body、summary；末码0，但输出176.3KB触发工具持久化。没有访问该工具runtime持久化文件；不能称这段是精简输出。
2. 改为顶层摘要但complete等仍输出153.4KB，末码0；同样不访问工具runtime原件，后续独立reader读取指定封件取得全部字段。
3. 精确打印combined-built的前8个key/client.js声明及source的archive SHA；末码0，明确dirty清单的值为SHA字符串、complete才有size/SHA。
4. 只读F02 browser-script-2.js实际段尾/随后100B，对3种source-map尾巴计算长度/SHA；末码0，只有无新增newline的34B尾巴匹配1720393/SHA3be9...，不eval代码。
5. 从自有audit打印11组label、6组帧分母、Main8份实际收据及timeOrigin；读取round04/05/06原事件帧名首尾；末码0，不读取live或工具runtime。
6. 精确打印原reread RPC/commandId与自有tmp自动失败JSON文件名；末码0。
全部实际写入通过apply_patch创建本角色reader、两个真实错误转录、报告/本命令账；运行reader仅写自有tmp或指定新前缀生成原件。代码编辑不作为产品测试。读原封包/六必要源不等读活源码。

## 3. 目视工具实际结果

`functions.view_image` 12次均真实返回Image loaded，无GUI操作：

| 原件 | 工具结果 / 审查内容 |
| --- | --- |
| `R/round02-after-archive.png` | 成功，composer原路径/记录计数 |
| `R/round02-after-review.png` | 成功，done/wrapped各1、known9、JSON原输出 |
| `R/round04-file-0-reflections-upper.png` | 成功，t1四known和m1 final可见 |
| `R/round04-file-0-reflections-lower.png` | 成功，两gap、dlv1 final、t7三known可见 |
| `R/round04-file-1.png` | 成功，README全段边界 |
| `R/round06-after-original-reload.png` | 成功，空composer |
| `R/round06-after-review-reread.png` | 成功，原review全文复读 |
| `R/round06-archive-file-reread.png` | 成功，重开原package上部 |
| `R/frames/round04-files-follow-0.jpg` | 成功，file上部 |
| `R/frames/round04-files-follow-20.jpg` | 成功，file反思区 |
| `R/frames/round05-reentry-review-0.jpg` | 成功，reload前原输出 |
| `R/frames/round05-reentry-review-68.jpg` | 成功，reload后空composer |

图像工具没有进程exit字段，不为Image loaded补造“shell exit0”。156帧全部校SHA仅12件图像工具目视（8PNG/4JPEG），不是156帧逐目视。

## 4. Main原执行与后置收据

Main8次脚本的完整argv/cwd/UTC起止/parentPID/childPID/status/signal/stdout/stderr为audit最后一组 `detail.commands` 原结构。每次真实 argv为：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /Users/bytedance/Projects/dsh-pm/pm-tool/docs/plans/2026-10-23-p2007-archive-gui-r2-<action>.mjs
```

`action`实际依次inspect/entry/export/files/filesfollow/reentry/reentryfollow/seal，child exit依次 **0/0/0/1/0/1/0/0**，signal全null；不是本角色执行。parent/child分别28562/28563、28681/28682、28857/28858、28949/28950、29044/29045、29137/29138、29224/29225、29452/29453。

两个1保原error、stderr、状态和帧；没有重archive成功写入。Main seal-r1/index与seal-outer-receipt真实返回status0分别独立核读取，派单另明确实际outer0。不要把child receipt的status字段冒充另一份工具级outer原始execution记录。

本角色终封真实工具0与实际读回结果专列后置 `p2007-archive-repair-gui-review-20261023-r2-seal-tool-receipt.json`、`...-readback.json`、`...-readback-tool-receipt.json`。seal先完成返回才写tool receipt；两后置receipt不循环封自身。

**released / STOP。**
