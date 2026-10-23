# A10-OP-G01 总览完成卡开发交接

> 给 Main 与独立专家使用：只记录本限定修复、真实组件红绿和原始证据，不给独立 PASS，不关闭原 A10 FAIL。平台 trae；按 20261021 派单命名，实际执行时间为 2026-10-21 16:03–16:05Z（macOS 本地已跨日）。

## 授权与边界

- 本子单原句：“开发限定A10-OP-G01总览任务完成卡done/wrapped错误。父继续全部已实现在途修确证最后Maincommit无push。”
- 可写范围：`packages/dsh-pm-tool/src/client/views/overview.tsx`、同目录新增真实组件测试/必要局部 helper、`reports/a11-overview-done-card-developer-20261021*`。实际只改 overview，新增一份组件测试；无 helper/CSS。
- 明确不写 `core/war-room.ts`、其他 src/panel/tasks/testing/living docs；不 build/install/shared cache/GUI/service/credentials/commit/push。Main 唯一 builder、GUI 执行者与最终提交者。
- 已读 AGENTS、collaboration、当前接续、原专家报告 §1 与总览闭合计划；脏树为父任务在途成果，不 pull/清树/提交。地基构建、全 verify 与 living docs 留给 Main，本子单不扩大授权。

## 原因与最小改动

- 原 F2 备份实核十任务：done2、wrapped1、`t-0001 status=todo/progress=100`。挂载前 Overview SHA `17391f8a308926b0d559a1a346b9e4946f7c2054ba251458ffeb0c44b5c4c67e`，与 A10 声明一致。
- 原上卡 `done` 与 `kpi.doneRate` 都走“done 或 legacy progress>=100”，因此原 F2 实际为3/10、30%。细化源码根因：额外任务是 todo/legacy100，并非 wrapped 本身；保留专家原缺陷 ID、标题与 FAIL，不改专家文档。
- `overview.tsx` 上卡 `done` 改为只认 `status === 'done'`；`doneRate` 按全任务分母、整数四舍五入计算，零分母为0。数字、百分比文案、条宽同源，不再消费 `kpi.doneRate`。
- wrapped 原独立桶和未完成计数不动。团队/无主提示的历史谓词、风险 KPI、议程、健康分、阶段入口与客观 map、人工双轨、清单/覆盖均不改；保留作者已有 OP 修复。
- 只读核 `war-room.ts`：`computeKPI` 保留历史语义，`buildAgenda` 同用历史谓词。当前检索 computeKPI 的业务调用在 Overview，仍用于 openRisks；不据此顺带改全局。

## 环境与候选

- 实际 macOS/darwin arm64，Node v22.23.3；React/renderer18.3.1、Vitest2.1.9。pnpm11.28.5 是项目约定，本子单未调用 pnpm。
- 基线 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不代表未提交候选。每轮复制完整 src（380文件）及原 F2 两文件，独占私有 HOME/TMPDIR/XDG_CACHE_HOME、Vite cacheDir，均 `--no-cache`。
- 唯一依赖只读 link：`/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`；未安装、未写此依赖目录。临时副本为 red-xSElPI、green-34nA8b、regression-JJgEmN，完整绝对路径见各 `candidate.json`。
- 原备份 SHA `451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b`；既有消费测试的原 `f2.json` SHA `ec25f42d12190f509c32a78f760c21fcc817afcedb45ea33039436c17b03c22f`。没有另造十任务 oracle，原备份每任务经真实 schema 校验。
- 修后 Overview SHA `7b5076ec60f667bc0190eea5d055e055c6cd3d40d266065943b7c227a339266d`；新测试 SHA `8ed1ca262d6f9ccf586636da39515e6acef59fe235d05a5bb51d1471005d06a7`。
- 只读 war-room 三轮及当前 SHA `9fd95d54e68aed0b25463a66cbee879f389b705768269912df80aaa23dd16db2`。各临时 src 测试前后内容指纹漂移0；不将此扩大为系统全根零污染证明。

## 红绿与回归

在仓库根执行，完整实际 executable/argv/cwd/start/end/exit 见 [证据目录](a11-overview-done-card-developer-20261021-evidence/) 各轮 `command.json`；stdout/stderr/逐测试 JSON 原样保留。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a11-overview-done-card-developer-20261021-run.mjs red
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a11-overview-done-card-developer-20261021-run.mjs green
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a11-overview-done-card-developer-20261021-run.mjs regression
```

| 轮次 | 实际结果 | 覆盖 |
| --- | --- | --- |
| red | exit1，1失败/9未选 | 真实 Overview + 原 F2，期望2/10、收到3/10；发生在产品修改前。仅此断言红，不冒称其余9项已执行。 |
| green | exit0，3文件27项 | 新组件10项 + 既有 objective-consumers13项 + overview-contract4项。 |
| regression | exit0，6文件45项 | 前27项 + 既有 panel-checklist-toggle2项 + progress-meta5项 + progress-clamp11项。 |

新测试逐项覆盖：原F2 done2/10=20、wrapped1、todo legacy100不计完成、done progress0仍完成；空0/0；无done且所有progress/manual/checklist零值；todo/in_progress/blocked/wrapped的legacy100和人工100；同实例L1人工30→0→null；顶层人工30→0→null独立显示；L1清单50→100→50→0→100，父客观63→88→63→38→88、覆盖2/3、状态完成率始终20。每次同时断言真实 `collectStats` 的完成计数/比率，wrapped独列；未完成7/10、里程碑/风险0、done清单40/无清单证据不足均保真。

Overview 无清单写控件，新增测试用真实组件同实例 props 更新验证消费，不声称点击它能落盘。既有 panel 清单控件2项另验 stableID/显式目标态及失败恢复，其 execute 为内存边界，不是后端落盘或真实 GUI。

设施历史保留：首次 exec 的 `login=false` 不受工具支持，未运行；采证脚本首启语法笔误 exit1，发生在采集前，已修，不算业务红。初 green argv 包含两个不存在的候选 core 测试路径，实际只有3文件27项；未冒称它们覆盖。后改脚本使用真实文件并加存在性检查，regression45项为完整实际结果。旧 red/green 证据不覆盖，脚本重复同名轮次拒绝覆盖。

原 stderr 警告：既有 TaskTable key；扩展 panel 测试还有11个keydown listener与卸载阶段缺 requestAnimationFrame 的 React 警告。它们不改变命令 exit0，但本报告不把退出码扩大为无警告/浏览器通过；本子单未改其他作者测试或产品文件。

## 指纹、差异与自查

- `sourcehash.json`：各轮全部冻结 src 文件清单/字节指纹；`candidate.json`：HEAD、fixture、依赖、运行根、新测试清单；`source-after.json`：副本内容漂移检查。
- `tracked-overview.patch` 为 HEAD→dirty 完整差异，包含作者在先 OP；`owned-overview.patch` 为执行前副本→本次修后，只有完成卡计数/本地比率与说明注释，无阶段改动。diff工具 exit1 表示存在差异，不是验证失败。
- [最终审计](a11-overview-done-card-developer-20261021-evidence/audit.json) 收录最新可写文件清单/指纹、source回读、差异检查与 vendor 只读静态校验的完整命令/结果。
- Skill：读取 brainstorming/writing-plans，在既有已批准窄修计划内执行；不另写 living plan 或提交。trivial 修复抑制 grill/tdd，红绿按用户显式合同执行。delivery 用已校验 `49dd158d1076134a641b33efb035946536778336` 的 code-review 做标准/合同两轴开发自查；不运行 setup，不调用不存在的子代理工具，不声称独立并行评审/PASS。只读校验2注册vendor exit0，未注册目录不纳入结论。
- 标准自查：无其他业务写文件、无全局抽象或共享语义改动；合同自查：2/10、20%与同页权威函数一致，wrapped/legacy/manual不混入，保留原OP。警告与设施失败按上节披露。

## 释放与剩余门

本子单修复和开发侧自动证据交付，释放 overview 文件范围；临时副本和失败原证保留，不删他人成果。测试命令均已结束，无本子单服务、GUI、安装、构建或提交动作。

GUI **NOT_RUN**，全包build/全部verify/独立SOURCE-AUTO与最终审签仍由 Main/专家继续。原 A10-OP-G01 FAIL 保持开放。Main 下一步：绑定修后源码与新增文件重新冻结，唯一构建/新实例认领，按专家原用例采 F2 同页上下两卡原图/盘记录和人工/清单态；wrapped迁父/改回todo完整旅程仍须另验，不能被静态子项替代。living docs 与最终统一commit由 Main处理，不push/tag/切正式。
