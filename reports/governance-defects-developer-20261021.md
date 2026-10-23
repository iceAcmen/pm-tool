# 治理四缺陷开发修复记录

> 给 Main 与独立测试专家使用。记录 GG-01..04 开发侧复现、改动、红绿证据和冻结交接；不是独立验收结论。2026-10-21，平台 trae。

## 授权与边界

- 负责人原句及父任务见 `reports/all-pending-acceptance-execution-20261021.md`。本子任务仅开发，不验收、不提交。
- 产品独占：`src/commands/ask.ts`、`src/core/provenance-store.ts`、`src/core/queue.ts` 及对应 tests。报告只写本文件，临时根 `.tmp/governance-defects-developer-20261021/`。
- 不改其他产品、tasks/file/board/panel/task.ts、testing、living docs、共享 lib；不 install/build/service/Main GUI/private 配置/commit。
- 当前已有多人在途 dirty 树，不拉取合并、不重置。基线 HEAD 以后续 `candidate.json` 实际记录为准；不能用 HEAD 单独代替候选。
- 依赖只读借用 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`。自有副本编译与 no-cache 测试，不写该依赖。
- 已读 AGENTS/collaboration/父派单/governance-closure/独立 findings 与 fix-contract。按专家准确初态和 expected 修复；不新增功能或 AI 权限。

## 执行计划

1. 已执行：真实 Context + JsonStorageBackend + DomainFacility + 生产 command 红例；完整前后库与命令返回保留。
2. 已实现：四 create 的 dispatch 新 ID 携入 appliedActions，来源只读真正 applied 目标；拒步/依赖跳步/旁路记录不入账。
3. 已实现：task 每步从真实表抓完整前态，不再原地改旧记录 updatedAt；逆序撤销每步仍核原始全对象 postimage，已撤项记内存进度，后段冲突/失败阻止同目标前段越过。
4. 已实现：recordUndoOutcome 增可选 used 小参数，调用侧传实际 record.used；审计仅追加，void/best-effort/串行队列保持。缺席项只排除 Top1，rest/due/critical/mute/quiet 保持。
5. 已执行并冻结：同测试红绿、受影响回归、类型检查、hash/diff/风险；只交开发证据，Main 整包/GUI 与独立专家另验仍待执行或审签。

## 方法记录

- writing-plans/brainstorming：方案、对象、边界已由父派单及专家合同批准，按现有合同执行，不重复索取授权；此报告承载文件级执行计划，不扩写 living docs。
- vendor 路由 feature → tdd：可测已确证修复，无阻塞歧义；交付前另做 code-review。锁定 commit `49dd158d1076134a641b33efb035946536778336`。
- `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` 实 exit0，manifest 13 文件 sha256/bytes 逐位一致。只读原件，不 installer/setup/home/全局/网络；静态校验不等专家 PASS。
- 项目独立门优先于 skill：生产数据回读是明确批准证据；不执行 skill 的提交/独立验收或越权步骤。

## 当前状态

**开发冻结，未独立验收，未提交。** 21:51 四文件主树与自有 green-ready 字节核对一致，freeze exit0；产品后续不再写，等待专家确证反馈。Main 可完整 hashcopy 当前四文件，不能将下面开发绿扩大为 A6 全集、GG GUI 或整门 PASS。

## 候选与指纹

- HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`；未提交候选为下列 tracked diff + 新测试。
- 三生产文件 diff SHA256 `bc10735738a77d85e1e1cddbbd51ad874d25e15324c33627a864d19626ba204b`。
- 冻结包 `.tmp/governance-defects-developer-20261021/handoff/`：三生产文件、新测试、tracked.patch、candidate.json。后者绑定完整 source/输出 manifest、真实命令与 exit；不是只报 HEAD。
- 其他源码固定取首轮自有 `red/package/src`（该轮生产编译 exit0），仅叠本任务四文件；未借此回退主树他人在途成果。受影响文件事务合并后的全包验证必须由 Main 新候选重跑。

| 文件 | bytes | SHA256 |
| --- | ---: | --- |
| `src/commands/ask.ts` | 34928 | `3db897be1275cbbc2473f73e8eb71bb061365a2ddd882008b33698972905bf26` |
| `src/core/provenance-store.ts` | 10855 | `ee3a5051126bc14073beef540627fa2faf5d5585dab8c6d12ddeba4833f3cc00` |
| `src/core/queue.ts` | 13563 | `ea816b70b725da12c165ee935f0e311272efd858db2f03f526d169ecf88a8144` |
| `src/commands/ask-governance.test.ts`（新增） | 15447 | `8d7a71f2b89d1414649caad8e541e350c203cc043816cc91bde89279a50cd7be` |

## 实跑与设施失败

环境：macOS，nvm Node `v22.23.3`；已有 pnpm 依赖只读，本任务不 install。调用前加载 nvm；运行器在每轮独立 package 执行生产 tsc（不是共享 build），测试 transpile 到其输出，仅用真实生产 index/command/repo/storage；vitest `--no-cache --maxWorkers=1 --minWorkers=1`。

| 轮次（自有根内） | 实际结果 / exit |
| --- | --- |
| `red` | 生产 tsc0；11测试失败/exit1，但漏项目必填日期，属于设施失败，不当产品红 |
| `red-valid` | 全源 tsc2，碰他人在途 `file-assets.ts(144,5)` 类型错误；不改对方文件。转首轮已编译冻结源码 |
| `red-frozen` | tsc0，7产品红+1设施红/3绿；clientId漏 `c-` 前缀设施纠正，旧证保留 |
| `red-final` | tsc0，11项8产品红/3绿，exit1；四create来源、链式undo、mixed used、absent-only及P0 absent抢due |
| `green` | tsc0，10绿1设施失败/exit1：磁盘 JSON 是 `{version:2,record}`，旧oracle误拿整包装比较；修为 version2 且 record 完整相等。受影响77/77 exit0 |
| `green-final` | tsc0，13/13 exit0，受影响77/77 exit0 |
| `red-same-tests` / `green-frozen` | 同13测试：红10失败/3绿 exit1，绿13/13 exit0；额外类型检查exit2，仅测试类型声明，不改产品或运行期望 |
| `red-same-ready` | **最终同一测试hash**，tsc0、test-typecheck0、13项10红/3绿、命令测试exit1；无设施错误 |
| `green-ready` | **最终同一测试hash**，tsc0、test-typecheck0、生产13/13 exit0、受影响7文件77/77 exit0 |
| `freeze.mjs` / `git diff --check` | exit0，主树四文件与 green-ready 一致；红绿测试同hash |

完整命令/exit/stdout/stderr 为各轮 `executions.json` / `*.stdout.txt` / `*.stderr.txt`；测试每条真实 rawInput、结果、完整前后 collectBackup 落在 `cases/governance-case-*/observations.json`，磁盘 JSON 原记录保留。不用计数/口述替代这些原件。

复现命令（macOS + bash，在仓库根运行；**运行器拒绝复用已有phase，避免覆盖旧证**，已存在轮直接审原证；新轮取不同phase名）：

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node .tmp/governance-defects-developer-20261021/run.mjs green-new-review
```

内部完整命令在 green-ready/executions.json：`node <只读deps>/typescript/bin/tsc -p tsconfig.json`；`node <只读deps>/typescript/bin/tsc -p governance-typecheck.json`；`node <只读deps>/vitest/vitest.mjs run --config production-vitest.config.mjs --no-cache --maxWorkers=1 --minWorkers=1`；同vitest运行 `src/core/{provenance,provenance-store,provenance-view,queue,ask-context,ask-projection,ask-copilot-b7}.test.ts` 七文件。

## 审查与风险

- Standards 作者自查：三生产文件与对应测试内聚，无新schema/领域/权限/服务配置，未写共享lib或wt，未改testing/livingdocs；完整性校验与diff-check均0。code-review 双轴依项目合同执行为作者自查，未具备可用独立子代理工具，不假称两位审查员。
- Spec 作者自查：四新ID从undo对应实际dispatch回值进入appliedActions→buildSourceRefs；记录视图只读applied目标而非扫库；拒步/跳步不造refs。完整真实前態、全对象外部守卫、同目标阻断和已撤进度均有命令/JSON断言。mixed/失败/clean used与审计历史有对应断言。
- F13 保 `void recordProvenance/recordUndoOutcome`、串行settings写、失败不回滚已写业务；单次真实JSON故障后来源/history补偿已开发测，不扩大为F13深故障/并发保证。
- 未新增 CAS/事务并发语义；比较→写的既有并发窗口、重启undo失效、TTL仍保旧合同。已撤项进度仅内存，不存新增明文patch；只在成功/原既有skip后记完成。
- 未自行重跑全量 verify、整包bundle、服务/GUI，未自PASS。独立专家需按fix-contract重测原真实worker四红及保绿，Main按新合并候选补全集/verify及GG新GUI。
- Main最新消息确认 A6copy/noDrift 已实际采入**新GG三生产+旧时点测试**且build0，原“oldGG”范围文字应由Main纠正；其全集1222绿/5红是Main当轮事实，不冒称通过。GG一红为旧wrapper oracle，当前新测试已修且最终hash如上；另四导出/归档设施问题归Main处理。本报告不编辑Main材料。
