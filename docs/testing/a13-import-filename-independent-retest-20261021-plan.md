# A13 文件名独立限定复验计划

> 给 Main、开发与独立审证者使用：本轮只复验 SOURCE/AUTO，所有写入限定本前缀及 selftmp。前缀沿用 20261021，实际执行 2026-10-22，平台 trae，角色独立测试专家。

## 授权与对象

负责人原句：

> 独立限定importfilenameSOURCE/AUTO复验。dev已释放tasks.tsx/commands/task.ts及同域tests，reports/a13-import-filename-developer-20261021.md；原22red/new26green/related117/noemit，oldA11/A12libunchanged。仅docs/testing/a13-import-filename-independent-retest-20261021前缀selftmp可写。读AGENTS/collab/先行a13-import-filename-contract plan/cases/red+updatedimportplan。原spaceunicodefile169csv16561xlsx，JSONstringfilename与完整JSONcontent单参数严格decode/旧ASCIIcompat/confirm尾/invalidzero/schema同级；client两templates和真实PmPanelexecute桥actualhandler预检/confirm/busy/failure/重试/取消。自有freeze/nocache复验原cases+额外parse安全不eval/不空白splitjoin损内容/畸形尾/文件名confirm字面/quote/backslash保。不产品/GUI/build/services/install/credentials/otherdocs/commit；taskviewsU4仍未实施，其他srcstage并行不误为owneddrift。source限定PASS不全GUI，新nativechooser待Main唯一A13freeze构建。终核报告完整exit/指纹/边界释放。

已读 AGENTS、collaboration §9/§11、先行 plan/cases/red、更新后的 import 闭环计划及开发交回。按本单特定授权，不 fetch/pull、不 install/build/服务/GUI/凭据，不更新其他文档、不 commit/push。不改产品，即使发现缺陷也只报告。平台记忆入口不存在，仓库为依据。

## 方法与用例

1. 从 live 源建立自有 new 冻结，四个已释放文件必须匹配开发 new-r3 指纹；全 src/配置、tracked patch、新文件清单、原件、用例和实际依赖均认领。
2. 从专家原 r3 旧源建立自有 old 冻结，原可执行 cases 同字节执行 fixture/base/names-protocol，独立复现 22 红/4 绿，不修改旧源后自验。
3. new 无缓存执行原 37 例：fixture 1、BASE 10、AUTO/PROTOCOL 26。实际 applyClient/PmPanel/TaskTable/remote execute/已安装 parseCommand/实际注册 handler/JSON；FileReader、DOM、transport 是设施，不称 GUI。
4. 独立新增 SAFETY 用例：严格 JSON 转义与 Unicode；连续空白、Tab、引号、字面反斜杠与 `confirm` 内容保真；文件名内 `confirm` 不是确认；旧 ASCII 与大小写 confirm 兼容；畸形/多余尾部、非字符串、非法转义重复零写；JSON 与旧 ASCII 同级 schema 拒绝；eval 运行探针与解析接缝 AST 检查，不以静态扫描单独证明安全。
5. new 单跑开发同域 24 例，再跑既有相关域 117 例及 tsc --noEmit --incremental false。不去重相同测试的重复执行为新增覆盖。
6. 私有 HOME/TMPDIR/cache/NODE_COMPILE_CACHE/DSH/file root 全在 selftmp，依赖只读链接，不读取正式数据。主 lib、A11/A12 lib/cache、原输入/合同/依赖前后核 hash；A11/A12 各原产物逐项比对。
7. 自有冻结零漂移为硬检查；live 四个 owned 文件漂移须停止认领。其他 live src 变化单列 owner 并行变化，不算 A13 owned drift；如实际依赖接缝变化影响 applicability，由 Main 在最终冻结重测。

## 执行与停止点

- [x] 读规则、原合同和开发报告，确认写范围。
- [x] 写自有 runner/SAFETY 探针并冻结。
- [x] old 原红、新原用例、独立补例、同域/相关/noEmit 执行与原 exit 归档。
- [x] 最终指纹/保护/进程检查，报告限定结论并释放。

运行环境：macOS/bash + nvm Node 22，复用既有 Vitest/React/XLSX/TypeScript。

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a13-import-filename-independent-retest-20261021-run.mjs old-r1
node docs/testing/a13-import-filename-independent-retest-20261021-run.mjs new-r1
```

每轮独立目录不覆盖原件。产品、设施、审签分层；旧红 exit1 是预期缺陷证据，不混成新候选失败。新增构建/宿主/实际 chooser/GUI/样式/UX/整项均 NOT_RUN，不转 MANUAL_PENDING。本轮完结不等 Main 持续任务结束；Main 唯一 A13 最终冻结构建、原生 chooser 补采后另审。

首轮记录：old-r1 原 22 红/4 绿；new-r1 原 37/37、同域 24/24、相关 117/117 与 noEmit exit0，补例 32 绿/1 失败。失败为专家自有 AST oracle 误将输出提示数组的 `join('\n')` 判作输入分词，并非产品损内容；仅豁免明确输出数组 AST 形态，原失败和冻结保留不覆盖。new-r2 重新完整执行并独立审证。

终核：old-r2 再现相同原红，外层原exit1；new-r2/new-r3 两轮全绿、产品源同字节，new-r3 外层原exit0。原37、补33、同域24、相关117、noEmit逐组原exit见报告；A11/A12各453产物原hash一致，自有冻结/合同/原件/依赖零漂移，最后owned与并行src均无变化。按本前缀检查无自有runner/worker在途。独立只签 SOURCE/AUTO PASS；原件、失败轮次和未测门保留，详见同前缀报告与selftmp索引。
