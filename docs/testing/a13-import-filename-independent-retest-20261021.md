# A13 导入文件名独立限定复验

> 给 Main、开发与接续专家使用：记录 SOURCE/AUTO 独立复验结论、候选指纹、全部原 exit、设施纠正和释放边界。前缀沿用 20261021，实际执行 2026-10-22，平台 trae，角色独立测试专家。

## 1. 结论

**A13 文件名接缝 SOURCE/AUTO：PASS，仅绑定本轮 `new-r3` 自有冻结。** 先行原 FAIL 与首轮测试 oracle 失败均保留，不改写历史；新构建、宿主激活、实际原生 chooser、GUI、样式、完整 UX、整项/发布均 **NOT_RUN**，不转 MANUAL_PENDING、不以局部 PASS 放行全部持续任务。

本角色未改任何产品或副本产品实现。仅写 `docs/testing/a13-import-filename-independent-retest-20261021*` 和其 selftmp；已读 AGENTS/collaboration、先行 [plan](a13-import-filename-contract-20261021-plan.md)/[cases](a13-import-filename-contract-20261021-cases.md)/[red](a13-import-filename-contract-20261021-red.md)、[更新后的导入计划](../plans/2026-10-21-import-filename-closure.md)、[开发交回](../../reports/a13-import-filename-developer-20261021.md)。负责人完整原句、方案和停止条件见本轮 [计划](a13-import-filename-independent-retest-20261021-plan.md)。

特定授权替代通用 fetch/pull、install/build/全包回归、livingdocs 和 Git 收尾动作。没有 GUI/build/install/services/credentials/其他文档/commit/push/发布操作，不触碰任务视图 U4。

## 2. 全部执行与原退出码

环境：macOS darwin/arm64，OS release 24.6.0，nvm Node **22.23.3**；只读复用 React/renderer 18.3.1、Vitest 2.1.9、XLSX 0.18.5、TypeScript 5.9.3。项目约定 pnpm 11.28.5，但本轮没有调用 pnpm 或安装。

仓库根、macOS/bash 实际入口命令：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a13-import-filename-independent-retest-20261021-run.mjs old-r1
node docs/testing/a13-import-filename-independent-retest-20261021-run.mjs new-r1
node docs/testing/a13-import-filename-independent-retest-20261021-run.mjs new-r2
node docs/testing/a13-import-filename-independent-retest-20261021-finalize.mjs
node docs/testing/a13-import-filename-independent-retest-20261021-finalize.mjs --seal
```

`finalize.mjs` 内同步调用同一 runner 的 `old-r2` 与 `new-r3`，归档原外层 exit **1/0** 和精确 PID **5476/5549**，signal 均 null；不是把归档 exit 当产品 exit。前面三轮异步工具外层退出未另行捕获，不冒称原证；以下所有分组原 exit 均由 spawnSync 直接记录。

| 轮次 | fixture | base | names-protocol | safety | handler | related | noEmit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| old-r1 | 0，1绿 | 0，10绿 | 1，22红4绿 | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| new-r1 | 0，1绿 | 0，10绿 | 0，26绿 | 1，32绿1误判 | 0，24绿 | 0，117绿 | 0 |
| new-r2 | 0，1绿 | 0，10绿 | 0，26绿 | 0，33绿 | 0，24绿 | 0，117绿 | 0 |
| old-r2 | 0，1绿 | 0，10绿 | 1，22红4绿 | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |
| new-r3 | 0，1绿 | 0，10绿 | 0，26绿 | 0，33绿 | 0，24绿 | 0，117绿 | 0 |

fixture/base/names-protocol 分组的 filtered/pending 是同一原 37 例中的其他分组，37 例全部执行，不算未测通过。handler 24 例包含在 related 117 例中；重跑和重复执行不增加不同用例数。相关域共 12 文件，保留编号反馈测试既有 React key warning，不扩范围修 UI。

每组完整执行文件、argv、cwd、私有 env、起止时刻、原 exit/signal 与 stdout/stderr/result 都在各轮 `*.command.json`/`*.stdout.log`/`*.stderr.log`/`*.result.json`。实际命令是既有绝对路径 Vitest：

```text
node /private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config <本轮自有config.mjs> --no-cache --reporter=verbose --reporter=json --outputFile <本轮result.json> [--testNamePattern <分组>] [同域test路径]
node /private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/typescript/bin/tsc -p <本轮自有pkg>/tsconfig.json --noEmit --incremental false
```

原分组为 `^FIXTURE`、`^BASE`、`^(AUTO|PROTOCOL)`；safety/related 全执行，同域单跑定位 `src/commands/task-import-filename.test.ts` 且筛 `^A13`。具体无占位符 argv 以原 command.json 为准。全部 `--no-cache` + `cache:false`；HOME/TMPDIR/XDG_CACHE_HOME/NODE_COMPILE_CACHE/DSH_HOME/DSH_PM_FILE_ROOT 均在本前缀 selftmp，子进程私有 env 白名单无凭据。

只读 `git diff --no-index` 两命令另审了原专家 r3→当前 `commands/task.ts` 和 `client/views/tasks.tsx`，均 exit1，仅表示存在差异：task 只动 import-content 参数接缝，tasks 只动两模板，无其他子命令/业务改动。本专家没有改该源码。

## 3. 证据与用例判断

原 169-byte CSV 与 16561-byte XLSX **同字节**复验，仅改变 File.name 元数据。四个合法/非法输入长度/hash先核，再通过生产 CSV/XLSX planner 证明合法两层树与非法后行 dueDate；不是重新生成相近输入。

生产链是 `applyClient → PmPanel → TaskTable → FileReader设施 → remote.commands.execute → 已安装parseCommand → 实际注册pm handler → 领域/JSON`。原 AUTO-NAME 12 例和 PROTOCOL-QUOTE 12 例均接受完整中文/空格/单双引号/反斜杠名，预览零写、确认仅在原 line 尾加独立 confirm、原字段两层任务落盘、旁路项目保留、关闭 JSON 库重开一致。

两个 AUTO-TEMPLATE 例使用原计划明确的同字节 ASCII 生产 preview 成功响应作传输控制，只证明两模板 JSON.stringify(file.name) 与后缀，不单独证明该名称已落盘。后端实际接受由 AUTO-NAME/PROTOCOL-QUOTE 分别证明。原 BASE 的实际 PmPanel bridge 覆盖取消零写、同帧双确认只发一次、busy 禁确认/取消/重选、false/reject 保原预览/命令和重试仅成功关层；同域 LG-05 回归另覆盖复杂名下的 TaskTable busy/失败保稿。没有 HTTP/宿主/真实原生 chooser，不称 GUI。

新增独立 [SAFETY 探针](a13-import-filename-independent-retest-20261021-safety.test.ts) 33 例：

- 4 个保真例：严格 Unicode/JSON 转义文件名、旧 ASCII `confirm.csv`、名称内字面 confirm，完整 CSV JSON 字符串仅解一次；标题双空格/Tab/单双引号/字面 `\n`、`\t`、`\u4e2d`、双反斜杠和 confirm 保留，preview零写，大小写末尾确认兼容，落盘重开。
- 26 个拒绝例：畸形/未闭合 JSON、非法 escape/Unicode、非字符串、无分隔、额外或重复/带引号 confirm、分号/JS表达式/模板字面量。每例原命令重复两次，中文 error、全 JSON hash不变、零任务、重开一致；eval spy未调用、JS执行标记未变化。
- 2 个 schema 同级例：原非法后行 CSV/XLSX 的 JSON 名和旧 ASCII 名，preview与直接confirm两次均行3/dueDate拒绝，全部JSON不变；未放宽日期、全行 preflight 或半写边界。
- 1 个 AST 接缝例：真实 import-content 分支无 eval/Function/额外 decode 或输入 split/join；真实客户端恰两模板一致。静态结果仅补充运行证据，不单独声称全产品安全。

`new-r1` 唯一失败是本专家 AST oracle 过宽，误拦输出提示行数组 `join('\n')`。32 个运行例已绿且无内容损失；只将明确的输出数组 AST 形态排除，未改产品、原专家用例或失败原件。`new-r2/new-r3` 全部 33 例通过，产品源同字节。该纠正不是豁免产品 FAIL。

## 4. 完整指纹与认领

基线 commit：`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，仅 Git 基线，不代表 dirty 候选。new-r3冻结时刻 `2026-10-21T21:24:06.691Z`，本机 2026-10-22 05:24:06；完整源清单与 tracked patch 同开发 new-r3，四个释放文件匹配，new-r2/new-r3源同字节。本轮没有观测到并行 src 漂移；设施将 owned 与其他 owner 变化分开，不把其他 src/stage 在途成果认作本批改动。

| 对象 | 完整 SHA256 |
| --- | --- |
| 原169-byte CSV | `9ff4d80a312a90a2f09c3c31805aad7796341ade44e2944fa5c690cb07010501` |
| 原16561-byte XLSX | `1181f20b5bfe4400608bc85415b8ffeeadd70f51ac4035099fc4dfc1ed0ff4a8` |
| tasks.tsx | `c37f046188f763486010e9867117ca90899c4983b09fd163f4d004007f6f2dc1` |
| commands/task.ts | `223472a8580a78ff1aa18468c3d3560ca05eebef0d4d7066d518eabe91901f44` |
| tasks-import-confirm.test.tsx | `1f0241f9514476cd3b62980400eb7e7ef648b7c67cba4a88b99f2c84be91fa00` |
| task-import-filename.test.ts | `3575adcb202ca26cab341edee394634f16c69736d9f32fd8b8dc053e38a9b3e7` |
| 完整src清单 | `9ce36f7a3a4968c8bf11b6d309ec3837cd10069d27547e8cd21454805df6d938` |
| tracked.patch | `1b9537297c301bed5d3b5ed6e8e70e54bc6709aa8d77f2f807a70d43d2a818cc` |
| new-r3/candidate.json | `0c8c81c69c4e52607ec5e5587556fa9d70ce826413dc059698d2214cb28e2018` |
| new-r3/audit.json | `8760d7ebbd2f7fccc73359ff4e39ef5e8b00d6d104cc04a7d3d6c6e23567202b` |
| new-r3/observations.jsonl | `617c3d201f7f407772f06486387c2feb8ee1c14b97980cecee1fbbda847bf899` |
| new-r3/related-observations.jsonl | `a32ecdec90d08c1f6cb6de94983127321eb96524f0a0a6866b153fdf71f466c6` |
| new-r3/evidence-index.json | `43a76fa0b15a03f46eda3dc0085883f26326dc3d41878ae95d4eedad0c06671d` |
| final-check.json | `2959b238bd6e403916c4790e37794220eb0e852ac880816ecc867896f6bea89b` |

core CSV、panel、client入口分别保持：
`389c127aefb81fb08215512a168fd978928ec41e814faca2b6e6e26d066dabe5`、
`8618d9091d3544a4236e9ae92fa0225e3914ea065b910ff1f3cb55013d0bc506`、
`e5702c69f788e4513a78f2e2861ef87d08f1bfa7ea2dce3807ed600505340f89`。

完整原件/依赖入口/配置/新增源文件/源树和逐文件长度/hash见 [candidate](a13-import-filename-independent-retest-20261021-selftmp/new-r3/candidate.json)。已安装生产 `@deepseek-ai/dsh-commands@0.2.1-alpha.2` 入口 hash与原合同一致，未提供测试 tokenizer。五轮原证逐索引重核无变化，最终 [总索引](a13-import-filename-independent-retest-20261021-selftmp/evidence-index.json) 同时认领本轮作者文件与所有失败日志；索引自身不索引，避免循环指纹。

## 5. 保护、剩余门与释放

五轮审计的自有冻结、合同、原输入、A11原证、十项物理依赖均无漂移；主 lib、A11/A12 lib、所列 cache 和旧专家/开发冻结源的内容+mtime不变。A11/A12 **各453产物** 前后逐hash匹配原 candidate。只证明 audit 列出的监测根，不声称全机零写；未接触正式数据、凭据、profile、端口或服务。

[终核](a13-import-filename-independent-retest-20261021-selftmp/final-check.json) 已核精确子 runner PID退出，按本前缀筛自有 runner/worker无匹配；没有模糊停止命令。封存时再核 owned/原产物/原证及释放状态，见 `release-check.json`。不加载 vendor skill，不用静态校验替代本轮独立测试。

**本轮任务结束，释放 SOURCE/AUTO 复验占用；测试进程已结束，原件只读保留。** tasks.tsx/commands/task.ts及同域tests未写，U4仍未实施/NOT_RUN。本报告只认领冻结字节，未来同文件修改需按影响范围新认领/复验，不能拿本次 PASS 替新候选。

下一步仅由 **Main** 唯一 A13 最终冻结构建并认领 artifact/实际宿主/实例/开关，按原合同采真实原生 chooser 同169-byte CSV/16561-byte XLSX、完整文件名/outline、取消零写、明确确认落盘/重开和非法后行零写；busy/失败重试沿原合同补采后交独立专家审证。U4需其既定测试合同与 owner 另行推进；本报告不实施、不构建、不扩大授权，不替 Main 最后 commit，更无 push/发布授权。
