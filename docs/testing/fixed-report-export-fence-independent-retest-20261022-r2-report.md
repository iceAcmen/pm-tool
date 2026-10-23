# 固定汇报围栏 R2 独立 SOURCE/AUTO 复验报告

> 本件记录不同独立专家的实际复跑、源码审查与有限门结论，给 Main 接续；不是开发自测或 GUI 验收。2026-10-22，平台 trae，非开发、非 GUI。负责人原句、步骤及写范围见[本轮计划](fixed-report-export-fence-independent-retest-20261022-r2-plan.md)。

## 1. 结论

**PASS_SOURCE_AUTO_LIMITED，release STOP。**

精确 R2 候选原 **74/74** 项独立复验通过，0 失败、0 跳过，产品 noEmit exit 0；没有新增阻断发现。原 R1 合法长作者 `RangeError` 在本候选转绿，原 13/54/probes6 的有限事实保持，原六项遗漏冻结摘录的必要红继续通过。不使用开发绿作为本件 PASS。

本件只授予此 SOURCE/AUTO 门的通过事实。**GUI、父总门、整包回归、普通 commit、其他并行工作均不签。** 原 GUI FAIL 不注销；3260/71922 按父绑定仍是旧 107，不冒作装载 R2。Main 汇合其他门后才能唯一后继 build、新 GUI 导出回读及相应独立审签。

## 2. 候选与独立性

依据：[R2 获批闭环计划](../plans/2026-10-22-fixed-report-export-excerpts-closure.md)、[R1 有限 FAIL](fixed-report-export-excerpts-independent-retest-20261022-r1-report.md)、[开发释放](../../reports/all-pending-evidence-20261021/ReportExportFenceDevR2/report.md)及最终 `candidate-r2-complete.json`。本次具体授权覆盖通用 fetch/install/build/全 verify/Git/livingdocs 步骤，本角色均不执行。

| 绑定 | 本轮实际核对 |
| --- | --- |
| Git 基线，prepare/close 只读核对 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` |
| 父与完整声明 | 父107 + 原独立test + renderer = **109**；108只为继承子集，不当完整后继 |
| 自有完整冻结输入 | **531 = 516 包输入 + 15 Launcher 输入**；逐 bytes/SHA 对 final 开发表、R1完整表及父107声明 |
| 相对完整 R1 冻结输入 | 0新增/0删除，只 renderer 改动；schema/source/storage/command/export安全实现均无新改动 |
| R1 renderer | 4428byte，SHA `6ee3daf16d5572ea74a69b4b42b3a25ab3c1a03693e80ff07f8b258fb69edcac` |
| R2 renderer，主树与自有冻结相同 | 4510byte，SHA `94290aaf54764628161e84f11d1bd495f7cb965c4178ea155d52b2d28ac99fbf` |
| R1→R2 exact released patch | 1165byte，SHA `0ec15d3c81f6099fc9eb50501bc14f77dc1ee02e1e25be54ace5513be095320b`；独立diff正文逐字节一致，**+5/-1** |
| 原13项 oracle | 16703byte，SHA `c777b88dc003414f483a0c2f4360b845483d0a662710d9a43f351405027bbe8a` |
| 原stress，逐字节复制 | 1768byte，SHA `c27de301f66f8ecd8193d49f6fea98ff8d5999602ba33149959fb68c8249c588` |
| 原6probes，逐字节复制 | 3966byte，SHA `547e72ee5f00ac8a2272f3a96d762e2ebae28e51a1999029457556f1b7240dac` |
| 归档修前 renderer，兼容对照非候选增量 | 3721byte，SHA `8ddea982eac50078f999acfec17910f01687737dd200c00413abd7df32f575de` |
| 独占依赖 | 13579文件/1030内部软链；与既有来源逐字节相同，共享inode=0、外部软链=0，不 install |
| 本件唯一写根 | 本 testing 前缀与 `reports/all-pending-evidence-20261021/ReportExportFenceRetestR2/` |

[candidate.json](../../reports/all-pending-evidence-20261021/ReportExportFenceRetestR2/candidate.json)含107/109完整清单、531逐指纹、516包输入、oracle与patch绑定；原独立diff与 Git tracked diff/新增清单/index/HEAD 收据在 `prepare/`。候选消费自有冻结 TypeScript 与自有依赖，不是 shared lib 或运行中 bundle。

主树在准备时已较本109冻结子集有合法 `ask.ts`、`panel.tsx` 变化；close时相同，本运行期间531观察集合未再漂移。本件未吸收/回退/冻结锁主树，也不把这些差异判污染。`task-predecessor-refs-dom.test.tsx`、`task-predecessor-hidden-submit-dom.test.tsx`、`ask-auth-feedback.test.ts` 归其他owner，不借本件签其结论。Main总候选须另汇合，不拿109冒所有并行成果。

## 3. 实际复验

| 运行 | 结果与 meaningful 覆盖 |
| --- | --- |
| 原13，`runs/raw` | **13/13，exit0**；原7控制+6必要红。真实生成两冻结current、指定修订/来源；源改作者日期正文并软删后保旧修订/报告raw。实际原命令 export 六字段完整、正文各一次、排除当前源/未选/撞号；missing/empty旧形状不回填；默认拒覆盖/confirm同字节覆盖、0600、非法目录拒绝零导出写、领域JSON不变 |
| 原stress，`runs/stress` | **1/1，exit0**；真实schema接受作者300024字符/150000反引号段，`caught=null`，真实renderer返回301085byte，完整作者与正文保留，无RangeError、无截断或新长度限制 |
| 原6probes，`runs/probes` | **6/6，exit0**；missing/empty各manual/session与归档旧renderer全字节exact；多行作者和内部反引号0/3/17/1800的六字段字面块完整，外围栏4/4/18/1801严格更长；复杂正文仅一次，生产AST不生成危险href |
| 原5文件54项，`runs/affected` | **54/54，exit0**；来源2、冻结报告14、隔离导出7、出站10、安全Markdown21。所有原test不改 |
| 产品类型，`runs/noEmit` | **exit0**；继承冻结原tsconfig，保原产品include/exclude，显式自有typeRoots/noEmit/incremental=false/输出路径。不build，不写lib，不称test类型全门 |

原54文件为 `progress-report-markdown-u5.test.ts`、`progress-report.test.ts`、`export-isolation.test.ts`、`export-outbound.test.ts`、`client/shared/markdown.test.ts`。

直接审patch：`matchAll`迭代求最长段，`Math.max`每次仅两个参数，最短围栏3，不建立匹配长度数组或参数spread。仍按已存 `report.excerpts` 的顺序消费 task/entry/revision、作者、日期、正文，不读当前任务、不软删过滤、不写存储。`frozenExcerptSchema.author`原来且现在只trim/min1，没有max；正文2000与摘录50条是既有规则，不由本件新增。安全与兼容判断只到实际Markdown/生产AST，不签GUI或外部阅读器视觉。

实际命令仍为 `handleProgressReportCommand` 的原 `export` 分支 → `exportProgressReportMarkdown` → `getProgressReport` → 本renderer → 原`writeExportFile`。不是模板MD、修前MD或mock出口。巨大作者只覆盖原真实schema+renderer用例，**不冒已走巨大作者真实export命令**。

[audit.json](../../reports/all-pending-evidence-20261021/ReportExportFenceRetestR2/audit.json)逐条留本轮assertion、合法fixture、源变状态、commands与内容审计。两条实际export见证如下，前后MD相同且报告JSON全字节保持：

| 自有case/sourceType | 前后MD | 报告JSON |
| --- | --- | --- |
| `BlMBDO` / manual | 1196byte，两次SHA `199dc19ffde45ebf2128943301a27bb055f95c1c0a9a6d8692ffc2b462af83ca` | 1805byte，SHA `5cdfe0832341efee033f7c7805e883012a8159419ddb6ff4a9d454a191518d64` |
| `K3Vsks` / session | 1223byte，两次SHA `4006462b601852077f28a5f803590e15463d7f34735bacbd6b3b7df8f736db76` | 1825byte，SHA `9d4e461566aa0a9418ba56da305cb103c5555d666fbfd616e52a65e6504535fa` |

两冻结三元组是 `t-0001/pl-3/rv-1` 与 `t-0001/pl-1/rv-3`，作者测试乙/测试甲，日期2026-10-19/2026-10-21，正文 `E3 rv1同日异ID` / `E1 rv3正文`。不是只比前后相等而忽略正文oracle。

missing/empty各manual为915byte/SHA `94575ae6586e2f63323b053399302afd4291ab26ffbf6b41cbf3a35e48510e88`，各session为942byte/SHA `11b8c2f156b1eef0c13b8f5ef452ba6a9f9853904a9fa045210381278733c0ba`，均与归档修前输出逐字节相等。

## 4. 全部命令与原失败

环境：macOS/bash，直接指定nvm既有Node **v22.23.3**，冻结Vitest **2.1.9**、TypeScript **5.9.3**；pnpm11.28.5仅项目约定，不调用。白名单env只含自有HOME/TMP/cache/DSH与测试fixture路径，不继承key；不全局设置会改变legacy出站边界的`DSH_PM_ISOLATED_ROOT`，原隔离tests自行设原开关。

仓库根实际执行，禁止原地重跑覆盖原证：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-fence-independent-retest-20261022-r2-run.mjs prepare
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-fence-independent-retest-20261022-r2-run.mjs test
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-fence-independent-retest-20261022-r2-run.mjs audit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-fence-independent-retest-20261022-r2-run.mjs close
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fixed-report-export-fence-independent-retest-20261022-r2-run.mjs seal
```

`prepare/test/audit/close`外层均实际exit0；prepare内部`git diff --no-index` exit1只表示有patch，非产品失败。四Vitest与noEmit子命令均exit0。seal实测收据及最终原证/文档SHA索引见本根`seal.json`、`artifact-index.json`、`documentation-index.json`，只封存本门，不增加产品覆盖。

实际Vitest命令为冻结Node执行自有 `node_modules/vitest/vitest.mjs run --config <runs/name/config.mjs>`，cwd冻结包，singleFork、无coverage、仅既定用例。noEmit实际命令为同一Node执行自有 `node_modules/typescript/bin/tsc -p <runs/noEmit/tsconfig.json> --noEmit --incremental false`。各 `runs/name/command.json` 保存完整executable/argv/cwd/白名单env/PID/start/end/exit/signal，完整stdout/stderr/result.json均保。

本轮无测试设施失败；C05原绝对/~ /越界目录正常拒绝的catch日志保留，不称零stderr。读工具`rg`不可用exit127、memory约定路径不存在及探路ls未就绪exit1属于只读设施观察，不计产品失败。执行工具返回UUID，轮询使用返回execution_id，未终止测试进程或服务。

原失败不洗绿：原RED首轮0/13（dispose设施失败）、后两轮7绿6必要红/exit1；R1原stress1失败/exit1及完整300024字符输入/RangeError堆栈；R1初affected53/54、probes5/6和audit设施失败；开发原stress复现红与首noEmit **exit2** 均完整保留，未改、未覆盖、未重跑。独立审计读取原收据并以前后保护证明保真，不把旧失败改成本次成功。

## 5. 保护、释放与 Main 接续

[close.json](../../reports/all-pending-evidence-20261021/ReportExportFenceRetestR2/close.json)核 **20保护对象、31566文件/软链条目**，含主旧lib、原RED、原开发R1、原独立R1全根、开发R2全根、原GUIFAIL、原testing/闭环计划与父3manifest，全部前后0新增/删除/变化。自有冻结（含原oracle、归档旧renderer、独占deps）与依赖来源均0漂移。此口径只指这些对象，不声称全盘零污染或正式service健康。

HEAD/index只读核对不变。全部同步子命令已返回，PID/exit有原收据。未Git写、build/install、key/vendor/正式data/upstream读取、sharedlib写、浏览器或service操作。未改业务、原tests、他人testing、livingdocs。资源释放，**release STOP**，不另spawn或兼任开发/GUI。

Main接续仅是本件交接，不开新功能：合并其他合法并行增量及各自独立门，绑定新总候选；由Main唯一后继build/受影响完整回归/新GUI固定导出回读，并交相应专家审原证。原3260/71922旧107与旧GUIFAIL不能冒新renderer已载/新GUI通过。父全部验完后的普通commit归父授权，本件不签、不stage、不commit，不push/tag/release/正式切换。
