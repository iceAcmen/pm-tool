# A19 共享依赖 .bin 漂移只读诊断

> 2026-10-22，trae，只读诊断角色。仅新增本报告，不执行产品、不 install/build、不改软链、不恢复 .bin、不删文件、不操作 GUI/service/credential、不 commit。用户持续验修与独立分工不变，Main 仍为唯一 builder。本报告不是测试审签，不覆盖 A19 原保护 FAIL/BLOCKED 或任何独立原件。

## 1. 结论与证据强度

1. **确证内容漂移，不是仅 mtime 漂移**：A19 r2 的十条差异均为普通启动脚本，SHA 改变、bytes 不变。诊断读取时十件的 SHA/bytes/mtime 与原 after/r2 一致。
2. **确证具体文本 delta**：每个当前脚本中，`/private/tmp/pmtool-a18-closure-20261022` 出现七次，集中在两条 `NODE_PATH` 赋值和末尾 `cmd-shim-target`。仅在内存中将这七处替回 `/private/tmp/pmtool-a16-closure-20261022`，完整 SHA 即逐件等于原 before SHA，10/10 一致。相对 `exec` 目标与其余文本无需任何变化即可吻合旧指纹。不是“相对执行路径改变”；是**绝对依赖前缀 A16→A18 重写**。
3. **确证共享写穿条件**：A18 包 `node_modules` 是整目录软链，逐跳 A18→A16→A14→A13→A12→all，最终落在旧 `pmtool-all-closure-20261021` 实体依赖树。A19 通过 A14 读取的是同一实体树；更换 HOME/TMP/cache、只隔离源码/lib，不能隔离这种依赖写穿。
4. **强支持、但不锁定 PID 的来源链**：Main 首轮 `pnpm exec tsc --noEmit` 的时间包含全部十件新 mtime；原 stderr 明示 Corepack 下载 pnpm **12.14.0**、执行前自动安装尝试、lockfile 检查及“workspace hoist directory is not a real directory”失败。十件新文本均指向 A18，与该 cwd 完全一致。最符合现有证据的是该首轮执行前依赖验证/自动安装尝试经整目录软链重写 shim。
5. **归因边界**：现有 Main `*.exit.json` 无 PID/PPID/子进程记录，也无逐文件写入审计；不能确证哪个 PID 写了十件、不能证明不存在另一 A18 cwd 写者，不能把 install 失败简化成“没写过”。没有运行重现实验。后续 pinned11 发生在漂移之后，不是原漂移起点。
6. **门与时间分开**：A18 feedback 的独立有限 SOURCE/AUTO PASS 与其最后保护结束时点早于本漂移；不能据后来漂移追溯改成当时 FAIL，也不能据它的 PASS 把 A19 保护洗绿。A19 原必要红、seal exit1 / `preserved=false` / `released=false` 和 r2 设施 BLOCKED 原样保留。资源退出与保护门通过不是同一件事。

## 2. 原始依据与有限读取范围

以下均为原文件只读引用；没有重新运行这些执行器，也没有重扫其监测根。

| 编号 | 原证 |
| --- | --- |
| E1 | [A19 合同/原红报告](../docs/testing/a19-habit-suggestion-okr-contract-20261022.md)、[run 原执行器](../docs/testing/a19-habit-suggestion-okr-contract-20261022-run.mjs)、[check 原执行器](../docs/testing/a19-habit-suggestion-okr-contract-20261022-check.mjs) |
| E2 | [before](../docs/testing/a19-habit-suggestion-okr-contract-20261022-selftmp/r1/protected-before.json)、[after-run](../docs/testing/a19-habit-suggestion-okr-contract-20261022-selftmp/r1/protected-after-run.json)、[after-seal](../docs/testing/a19-habit-suggestion-okr-contract-20261022-selftmp/r1/protected-after-seal.json)、[r2 精确十条差异](../docs/testing/a19-habit-suggestion-okr-contract-20261022-selftmp/r1/final-check-r2.json)、[seal](../docs/testing/a19-habit-suggestion-okr-contract-20261022-selftmp/r1/seal.json) |
| E3 | [A19 全 argv/env/PID/时间](../docs/testing/a19-habit-suggestion-okr-contract-20261022-selftmp/r1/commands.json)、[summary](../docs/testing/a19-habit-suggestion-okr-contract-20261022-selftmp/r1/summary.json) |
| E4 | [Main build 目录](all-pending-evidence-20261021/A18/build/)、[首轮 noemit 原 stderr](all-pending-evidence-20261021/A18/build/noemit.stderr.txt)、[首轮 build 原 stderr](all-pending-evidence-20261021/A18/build/build.stderr.txt)、[sync](all-pending-evidence-20261021/A18/build/sync.json) |
| E5 | [Main build-pinned11 目录](all-pending-evidence-20261021/A18/build-pinned11/)、[proof](all-pending-evidence-20261021/A18/build-pinned11/proof.json) |
| E6 | [A18 feedback 有限独立报告](../docs/testing/a18-feedback-context-independent-retest-20261022.md)、[final-r3 保护快照](../docs/testing/a18-feedback-context-independent-retest-20261022-selftmp/final-r3/protected-after.json)、[review-r3](../docs/testing/a18-feedback-context-independent-retest-20261022-selftmp/review-r3/review.json)、[close-r3](../docs/testing/a18-feedback-context-independent-retest-20261022-selftmp/close-r3/close.json)、[最后精确进程检查](../docs/testing/a18-feedback-context-independent-retest-20261022-selftmp/close-r3/process-check.command.json) |

诊断仅解析上述已知 JSON/日志、读取十个精确实体文件、逐跳 lstat/readlink/realpath，并额外列读同一实体树顶层 `.bin` 的八件。未遍历全依赖、全盘或业务数据。只读 Node 内置 fs/path/crypto，用明确 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`；未导入产品/第三方模块。macOS，Node v22.23.3。用户禁止事项优先于通常开工 install/build/fullverify/档案同步；本批只写指定报告。

## 3. 真正软链与十个差异路径

公共包后缀为 `/packages/dsh-pm-tool/node_modules`。现场逐跳读取：

```text
/private/tmp/pmtool-a18-closure-20261022 + 后缀
  -> /private/tmp/pmtool-a16-closure-20261022 + 后缀
  -> /private/tmp/pmtool-a14-closure-20261022 + 后缀
  -> /private/tmp/pmtool-a13-closure-20261022 + 后缀
  -> /private/tmp/pmtool-a12-closure-20261021 + 后缀
  -> /private/tmp/pmtool-all-closure-20261021 + 后缀（实体目录）
```

A18 根级 `/private/tmp/pmtool-a18-closure-20261022/node_modules` 本次读取为 ENOENT；不能虚构它也有软链。A19 自有 frozen 的包级及根级 node_modules 链到 A14，见 E1 原执行器，因此仍共享上述实体。没有修改任何链。

下表 `实体根` 均以 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/.pnpm/` 开头；`脚本` 均接在该根的 `node_modules/.bin/` 内，不是项目顶层 `.bin`。

| 根代号 | 实体根余段 |
| --- | --- |
| R | `react@18.3.1/node_modules/react` |
| T | `typescript@5.9.3/node_modules/typescript` |
| V | `vite@5.4.21_@types+node@22.20.5/node_modules/vite` |
| VT | `vitest@2.1.9_@types+node@22.20.5_supports-color@7.2.0/node_modules/vitest` |

所有时间为 UTC；小数后三位显示，原始浮点 mtimeMs 全精度仍在 E2。bytes 是前后共同值。

| 根/脚本 | bytes | 旧 mtime（10-21） | 新 mtime（10-22） | 未变的相对执行目标 |
| --- | ---: | --- | --- | --- |
| R/loose-envify | 4296 | 23:28:01.630 | 00:30:40.226 | `../../../loose-envify/cli.js` |
| VT/vite | 4352 | 23:28:02.875 | 00:30:39.068 | `../../../vite/bin/vite.js` |
| VT/vite-node | 4513 | 23:28:01.751 | 00:30:38.833 | `../../../vite-node/vite-node.mjs` |
| VT/vitest | 4393 | 23:28:01.584 | 00:30:38.643 | `../../vitest.mjs` |
| VT/why-is-node-running | 4428 | 23:28:01.577 | 00:30:39.739 | `../../../why-is-node-running/cli.js` |
| T/tsc | 4199 | 23:28:01.312 | 00:30:38.610 | `../../bin/tsc` |
| T/tsserver | 4234 | 23:28:01.317 | 00:30:38.774 | `../../bin/tsserver` |
| V/esbuild | 3687 | 23:28:02.906 | 00:30:40.371 | `../../../esbuild/bin/esbuild` |
| V/rollup | 4304 | 23:28:02.908 | 00:30:39.621 | `../../../rollup/dist/bin/rollup` |
| V/vite | 4282 | 23:28:02.875 | 00:30:38.833 | `../../bin/vite.js` |

| 根/脚本 | before SHA256（内存逆替换也得到此值） | after SHA256（现场与原 after 一致） |
| --- | --- | --- |
| R/loose-envify | `c7f8915fd2dae147514542a98194a1a9d896fa68e1e5c51d7859ce8637771cd7` | `ed0a37ecce2dfad3e365276432bb0e2b93727fd93931bc3b32384fe0e5fd8c79` |
| VT/vite | `705300e360baa3333e3474e312894409d090106b8ef8b8c3f95a705258076aad` | `a040ef839123a7b2ad5cd2b9d17b5288746301590c59aa481b5557cd3d07b231` |
| VT/vite-node | `712036d9ea2a7e34ba2568494adcc9d81fb6936330ed9d5bb2e126d1ecd4aef7` | `abfe3ceaab35389e0b9f8c46b55a92011d90628194820312ec790f617fe12bd0` |
| VT/vitest | `f96819fe4b39d1ee8f58e2f22eecae733e114c8690a1a87f63458214ddc43fbd` | `55330f6e200f25b3b538adde6670b18b61b796e7fc4a2d642ccccb2a79bf691b` |
| VT/why-is-node-running | `a569585e6ab400d83c3c8b9122611dcc4d829534516ca6045c8e156b3e975b1a` | `237a8a1c906b50084803090cb911510b49cb00ae58f1968b4adb77a56a6d1f0b` |
| T/tsc | `3dbca64ad316add22f7c8c96d677c5214c1448cd2949cc5beaa351fb869fec88` | `19c730ff6c0599f4c4c14aa303a4a33f2c7f24bd44d432376273ceeb0baa3f2b` |
| T/tsserver | `a1eeb92fe18d1528275c510fa6f840512cd5bbf5431afddd7938c4b8cf30a522` | `16a65bd12a2a4bd46aa888e8db7555d2b2fbb7aead2517bed847db930f4dac97` |
| V/esbuild | `51b3505100794bc485bf1ca8dc8e361ac76c20baa371b1289be7964e6fe07a37` | `40eb01d2ba33335e919d611d779c5c6b80d6e2f00b3c70c04285ce2fda434b43` |
| V/rollup | `8a3dfeb9e5bb94efcc098843600391b3098510dbef63536d9b0ba3533b560e7c` | `d984e0e9ff425c6277e2bbf999ed00f50ac7b687e61c5625e9517f72f8a45a24` |
| V/vite | `73f18258aa4a42dbabd43ab49020cd53cdd1089c6775752ae90215a79c4195d8` | `a3c03d5c652fedd9f76cf9c9ede35641d9bcb1c1af2c0312fc79ccab1e3ee93f` |

before JSON 存指纹，不存旧文本。这里是**用完整原 SHA 校验的内存逆替换**，不是找到旧文本副本或重写旧文件。全部命中只需如下七处 token 替换，不需假设额外内容；SHA256 常规抗碰撞前提下支持完整文本 delta：

```diff
- /private/tmp/pmtool-a16-closure-20261022
+ /private/tmp/pmtool-a18-closure-20261022
```

非 esbuild 脚本发生在行 83（NODE_PATH 三处）、85（NODE_PATH 三处）、100（cmd-shim-target 一处）；esbuild 最后一处在行 89。例如 T/tsc 末行：

```diff
-# cmd-shim-target=/private/tmp/pmtool-a16-closure-20261022/packages/dsh-pm-tool/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/./bin/tsc
+# cmd-shim-target=/private/tmp/pmtool-a18-closure-20261022/packages/dsh-pm-tool/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/./bin/tsc
```

启动正文仍按真实 basedir 与 `../../bin/tsc` 执行，不能据绝对注释改变声称换了 TypeScript 版本或改了编译器业务源码。NODE_PATH 确实是运行变量；本诊断未实测其后续行为，不称行为等价或无影响。

## 4. argv/env/PID 与时序

### 4.1 Main 两轮

两轮全部原 argv/cwd/env/start/end/exit 已逐文件读取，见 E4/E5 的各 `*.exit.json`。共有 cwd：

```text
/private/tmp/pmtool-a18-closure-20261022/packages/dsh-pm-tool
```

共同 env 完整键集及值如下；原日志未登记 TZ、DSH_HOME、NODE_PATH 或凭据，不猜测子进程生成环境：

```text
PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/Applications/Trae CN.app/Contents/Resources/app/modules/ai-agent/bin:/Users/bytedance/.trae-cn/plugins/trae-remote-official/lark/1.0.5/bin:/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/Users/bytedance/.local/bin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/opt/puppetlabs/bin
LANG=zh_CN.UTF-8
TERM=dumb
HOME=/private/tmp/pmtool-a18-closure-20261022/private-home
TMPDIR=/private/tmp/pmtool-a18-closure-20261022/private-tmp
XDG_CACHE_HOME=/private/tmp/pmtool-a18-closure-20261022/private-cache
CI=true
NODE_DISABLE_COMPILE_CACHE=1
DSH_PM_FILE_ROOT=/private/tmp/pmtool-a18-closure-20261022/files
```

下表 `P11` 是完整二元素前缀 `["/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node", "/Users/bytedance/.cache/node/corepack/v1/pnpm/11.28.5/bin/pnpm.mjs"]`；不是 shell 中未固定的 `pnpm`。

| 原目录/命令 | 完整 argv（P11 按上定义展开） | UTC 起止（10-22） | exit | PID |
| --- | --- | --- | ---: | --- |
| build/noemit | `["pnpm","exec","tsc","--noEmit"]` | 00:30:21.372535→00:30:55.934996 | 0 | 未记录 |
| build/build | `["pnpm","run","build"]` | 00:30:55.935825→00:31:11.075076 | 0 | 未记录 |
| build/coverage | `["pnpm","exec","vitest","run","--coverage","--maxWorkers=1","--minWorkers=1","--no-cache"]` | 00:31:11.075581→00:32:26.862608 | 0 | 未记录 |
| build-pinned11/version | `P11 + ["--version"]` | 00:33:23.833289→00:33:24.248192 | 0 | 未记录 |
| build-pinned11/noemit | `P11 + ["exec","tsc","--noEmit"]` | 00:33:24.250058→00:33:31.914446 | 0 | 未记录 |
| build-pinned11/build | `P11 + ["run","build"]` | 00:33:31.916255→00:33:42.546588 | 0 | 未记录 |
| build-pinned11/coverage | `P11 + ["exec","vitest","run","--coverage","--maxWorkers=1","--minWorkers=1","--no-cache"]` | 00:33:42.548358→00:34:48.601574 | 0 | 未记录 |

首轮 noemit 原 stderr 的关键链（不是本诊断执行）：

```text
Corepack is about to download .../pnpm-12.14.0.tgz
Downloading the pnpm 12.14.0 binary for darwin-arm64...
Verifying lockfile ... (420 entries)
Lockfile is up to date, resolution step is skipped
Already up to date
installing dependencies
... node_modules": workspace hoist directory is not a real directory
[WARN] The install that runs before scripts failed ...
Set "verifyDepsBeforeRun: false" to skip this install.
```

该下载版本也留在 A18 自有 `private-cache/node/corepack/v1/pnpm/12.14.0`，现场只列目录；没有执行二进制/installer。常见 `dist/pnpm.cjs` 在该目录不存在，未据此源码推定内部函数，更没有扩大扫描寻找源码。

### 4.2 保护、测试与漂移相对顺序

| 事件 | UTC 时间 | 证据与边界 |
| --- | --- | --- |
| 旧十件 mtime | 10-21 23:28:01.312～23:28:02.908 | 前缀 A16；不能仅用 mtime 判旧写者 |
| A18 feedback final 保护文件完成 | 10-22 00:25:26.918 | final.json 的文件 mtime；不是内部采样精确时间 |
| A18 feedback review 进程检查结束 | 00:27:04.398 | PID60024，ps exit1/空输出；review liveDrift=[] |
| A18 feedback 最后 close 检查结束 | **00:29:48.640** | PID60652，ps exit1/空输出；close drift=[] / released=true |
| A19 before 文件写完 | 00:30:04.122 | 文件 mtime；前面的遍历采样不是原子快照 |
| Main 同步记录 | 00:30:20.930811 | E4 sync.at |
| Main 首轮 noemit | **00:30:21.372535～00:30:55.934996** | 包含全部新 mtime，自动安装尝试在 stderr |
| A19 necessary-red | 00:30:31.907～00:30:35.133 | PID60836，原 exit1，13必要红 |
| A19 component-controls | 00:30:35.133～00:30:37.826 | PID60845，原 exit0 |
| A19 original-model-controls | 00:30:37.827～00:30:39.024 | PID60856，原 exit0；仅部分漂移与此段交叠 |
| **十件新 mtime** | **00:30:38.610534～00:30:40.371178** | 最早 T/tsc，最晚 V/esbuild |
| A19 after-run 文件写完 | 00:30:45.192 | 十条 after 值逐字段与 r2 一致 |
| Main 首轮真正 build 开始 | 00:30:55.935825 | 晚于十件漂移，不归因给 tsc emit/tsdown 阶段 |
| A19 seal.at | 00:31:43.751 | 原 preserved=false / released=false |
| Main pinned11 首命令 | 00:33:23.833289 | 晚于原 seal；无法修复或抹去历史 FAIL |
| A19 r2.at | 00:35:52.362 | 原设施 BLOCKED / resourceReleased=true |

A19 是明确 Node→`.../node_modules/vitest/vitest.mjs`，不是 pnpm 或 .bin。三组完整 env、argv、PID 在 E3；run 源码没有 install/build/.bin 调用。此事实排除了“看到 pnpm 已装所以 A19 一定调用过 pnpm”这一推断，但不能单靠“执行器没有写调用”证明整个第三方依赖绝不产生写入。

A18 feedback final 原保护快照中的上述十件，SHA/bytes/mtime **逐件完全等于 A19 before**。因此先前保护绿与本次漂移存在明确时间分界，而非相互矛盾的同一快照结论。

## 5. 归因、反证与范围限制

**可确定的机制表征**：同长度 A16→A18 token 的批量 shim 重写；共有实体目录；写入窗口覆盖首轮 pnpm12 自动安装尝试；产物 build 开始晚于漂移；pinned11 更晚。多类脚本一起改变，不符合“只执行 tsc 导致 tsc 业务输出更新”的解释。

**不能升级为事实的部分**：具体 OS 写入者 PID/PPID、pnpm12 内部确切函数/调用栈、另一 A18 cwd 并发写者是否存在、全部依赖变更总量及业务影响。Main 原七条记录仅 argv/env/时间/退出码，没有 PID 字段；本诊断不借当前进程反推已退出历史 PID、不访问平台私有原始会话补造记录。

额外局部读取实体顶层 `.bin` 八件：`cordis/tsc/tsdown/tsserver/vitest/xlsx` 六件当前 cmd-shim-target 指向 A18，mtime 00:30:38.500～00:30:38.514；`rolldown/vite` 两件仍指向 all，mtime 为 10-21 07:27:06.055。这支持“范围不只 A19 监测的包内十件”的可能性；没有比对这八件各自 before，因此不把六件都新增认定为本次确证漂移。**十件是 A19 已监测差异数，不是全依赖写入总数。**

E5 proof 的 protectedDrift=[] 只代表其已列保护对象，本诊断没有将其扩大到 A19 共享依赖根。A19 r2 的 originalDrift=[]、mainDiff=[]、frozenDiff=[] 是原结果引用，4179原路径和11077唯一监测文件不是本诊断重新全扫所得。原首轮 final-check 的 JSON 键序误报与 r2 更正保留，不能把误报当产品漂移或覆盖原失败证据。

## 6. 最小隔离建议（仅交 Main，不实施）

### 6.1 共享只读 .pnpm 的最小方案

- 在 Main **下一自有候选目录**创建真实的包级 `node_modules` 外壳；若构建/解析需要根级 node_modules，该根也必须自有。只 copy 各外壳的 `.bin` 普通脚本为自有文件，禁止硬链接到旧文件；已有其他包 symlink 保留时须校验真实目标。`.pnpm` 可以 link 到现有实体树，但必须作为**只读输入**管理，不更改旧树权限或旧软链。
- 这不是只复制源码或仅换 HOME；root/package 顶层 `.bin` 都须独占，且登记 symlink realpath。复制旧普通脚本不会自动修正 NODE_PATH/目标，不能把旧带 A18/A16 的 shim 直接当自洽新候选；Main 应在自有位置核目标解析，或在既有批准流程内直接使用固定 Node 与已知工具入口。
- **仅 copy 顶层 `.bin` 不足以挡住本次十件**：它们在共享 `.pnpm/<包>/node_modules/<包>/node_modules/.bin/`。只要运行会重新 link/install/verify deps 的 pnpm 路径，仍可写穿 `.pnpm`。因此该最小方案的前提是禁自动安装/依赖重整，不执行 installer/setup；固定现有 Node/pnpm11 可避免本次版本漂移，但固定版本本身不是只读保证。
- 在可复用既有入口的范围，由 Main 控制唯一构建序列；独立测试继续明确 Node→工具入口、独立 cache/env/output，不能顺手变成新 builder。后续采证按精确共享路径的前后指纹及 Main 新 PID/argv/env/时间登记，不以 install 警告或 exit0 代替保护结果。

### 6.2 若需要 pnpm 改写依赖，则完整自有树

若 Main 必须使用可能整理 `.pnpm`/包内 `.bin` 的命令，选择**完整自有依赖树**：从现有依赖做隔离复制而非新 installer；目录与普通文件为自有实体、无共享硬链接；仅允许复制树内部可解析的相对 symlink。绝对指回旧树的链要在自有副本内经批准处理/核对，不动旧树。macOS 写时复制若采用，仍须证实独立 inode/写入不回旧树；不把复制命令成功当完整隔离。

此方案占用更多空间，但不会依赖“pnpm 执行前一定不写内部 shim”的假设。本报告不提供或运行安装器，不批准当前 .bin 恢复，不改现有 A18/A16/A19 候选，不授权新增产品修复。

## 7. 只读复核办法、失败记录与释放

本次已执行的核心校验为 Node 内置 JSON.parse + readFileSync + SHA256 + stat/lstat + readlink/realpath，只作用于 E2 differences 的十个精确路径。以下可供后续**只读复核**，不是产品命令，也不写文件；运行环境 macOS + 已有 Node22，仓库根：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node -e '
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const base = "docs/testing/a19-habit-suggestion-okr-contract-20261022-selftmp/r1/";
const rows = JSON.parse(fs.readFileSync(base + "final-check-r2.json")).differences;
const hash = x => crypto.createHash("sha256").update(x).digest("hex");
for (const d of rows) {
  const file = path.join(d.root, d.path);
  const bytes = fs.readFileSync(file), stat = fs.statSync(file);
  const text = bytes.toString("utf8");
  const reversed = text.replaceAll(
    "/private/tmp/pmtool-a18-closure-20261022",
    "/private/tmp/pmtool-a16-closure-20261022");
  console.log(JSON.stringify({
    file, sameAfter: hash(bytes) === d.after.sha256 &&
      bytes.length === d.after.bytes && stat.mtimeMs === d.after.mtimeMs,
    reverseMatchesBefore: hash(reversed) === d.before.sha256,
    regularFile: fs.lstatSync(file).isFile()
  }));
}
'
```

已观测：10/10 sameAfter、10/10 reverseMatchesBefore、10/10 regularFile；十件 E6 final 指纹等于 E2 before；十件 after-run 与 r2 相同。该校验是诊断证据，不是产品/设施 PASS。

辅助读取失败如实记录：本环境 `rg` 不存在（exit127），改用指定文件 grep；一次读取 A11 node_modules 返回 ENOENT 使该临时只读 Node 进程 exit1，未据此判断产品失败，后续拆开读取；尝试两个明确 Corepack 常用路径和 `dist/pnpm.cjs` 返回 ENOENT，随后仅按原 XDG_CACHE_HOME 确认 12.14.0 目录。不安装工具，不扩大扫描。已有大脏树不 fetch/pull，不碰其他人的在途文件。

停止条件已达到：文本 delta 与时序/共享链可复核，PID 归因缺口明确，最小建议已交 Main。所有本诊断短命令均已返回，未启动后台产品/测试/构建/GUI/服务，无本角色持有的相关资源；**本角色释放、STOP**。A19 原 PID60836/60845/60856 退出由原 r2 证据引用，不新增停进程操作。原 seal 的 released=false 保留；不能把本角色释放或 A19 自有资源释放改写成保护通过。
