# F02 option 默认动作局部修复开发交付

2026-10-23 07:20，trae，Main。本文给独立专家和后继执行者核对两文件 delta 与实际开发自测；不签独立 SOURCE/AUTO/GUI，不缩减父所有已实现未验到普通提交目标。

依 [原专家 §6](../testing/six-repairs-pointer-gui-review-20261023-r1-report.md#6-原默认-label-场景最小红--修--复验合同) 和 [已成计划](2026-10-23-f02-option-default-repair.md)，本轮已实际执行必要红、最小修、同测试绿与原28专项。原F02 GUI FAIL、后台保存 NOT_REACHED保留；新 GUI 尚 NOT_RUN。派单工具恢复，旧443原生trace与893习惯负例各有独立新角色审证在途；已签 F01 不重复派。

## 两文件变化与输入认领

| 文件 | 修前 bytes / SHA256 | 修后 bytes / SHA256 |
| --- | --- | --- |
| `src/client/views/records/records-listbox.tsx` | 4886 / `db16c2e6dcb9c574855b9f0bc82f2d976b7f1756a8d0abcab275c4bbc07683f2` | 5059 / `aeb3d15125ad311f335cfb09d348c0402b9925da9d4979df8b2ceb402725275f` |
| `src/client/views/records/records-deliverable-pointer-dom.test.tsx` | 9159 / `6de116ba10c320a162f1c465958f428ca9023e328b67827581db9ea23df42aec` | 10641 / `841e3fa0591c7a83213572650a73d7c63cf277e50e1ecf56197e8c0e58cc6057` |

生产仅 option onClick 先 `event.preventDefault()` 再原 `choose(option)`；保原 DOM/label、backdrop、键盘、表单和保存通道。原 D01–D07 内容保留，追加 D08/D09 实际 form+overlay 的 option button/span：公开 document bubble click 默认动作取消、无额外 trigger click、选中/close正确、零 save。不mock choose，不重放 label 默认激活；JSDOM 不声称浏览器默认动作时序或真实命中。

Main修前已逐字节核原六修525输入，复制17实际输入与完整原清单。red阶段仅test变；green/related阶段只上述两项变，其他523逐SHA相同。每阶段新隔离 inputs/config/cache/home/output/tmp，仅四声明依赖只读软链；ReactDOM由原suite在JSDOM globals之后import，identity在afterAll核同React来源。每阶段前后17输入/声明依赖文件相同；没有主lib/build、新实例或业务写。

## 实际命令与结果

运行环境：macOS + nvm Node22.23.3（绝对路径），现有pnpm11.28.5，本轮无install/pnpm/build。仓库根执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-f02-option-default-run.mjs baseline
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-f02-option-default-run.mjs red
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-f02-option-default-run.mjs green
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-f02-option-default-run.mjs related
```

| 阶段 | 原始执行结果 |
| --- | --- |
| vendor静态 | 实际工具exit0，两注册vendor文件与manifest逐指纹同；不是独立毕业/产品PASS |
| baseline | 实际工具exit0，525全同/17source另存 |
| red | 真实Vitest子进程exit1/signal=null，原7绿/新增2红；两红唯一原因为option click `defaultPrevented=false`。runner工具返回异步string executionId，工具外层终码未独立收，真实子进程完整receipt/stdout/stderr已存，不伪造外层 |
| green | 真实Vitest子进程0、工具0，9/9，stderr空；D08/09 bubble为true、calls=[]、无额外trigger |
| related | 真实Vitest子进程0、工具0，records-options8/payloads11/history3/form-validation6共28/28，stderr空 |

红绿同test SHA，React18.3.1 runtime同来源，identity输出时序在afterAll，未出现attachEvent设施污染。[开发包](../../reports/all-pending-evidence-20261021/F02OptionDefaultDevelopmentR2/)含每轮17 source、完整argv/cwd/env白名单/时间/exit/原stdout与stderr/JSON结果/逐例DOM观察、config与identity源码。旧red stderr为必要失败证，未删除或洗绿。

## 独立门与后继

1. 新独立 SOURCE/AUTO 角色仅审两文件/红绿必要性/9+28和受影响映射；GUI保持原§6，不能把AUTO绿当浏览器修复已通过。
2. 源门齐由Main唯一builder新freeze，新候选完整build/noEmit/全部verify与原DOM整回归一次。原3268仍旧候选，不改其lib冒新版本。
3. 原F02新host正常备份/真实侧车恢复合法F5（包括E/H及两L2final），通过真正表单主save准备planned，真实accepted选项稳定闭合→唯一首点主save实际命中/RPC/raw/重进，再原键盘对照一次，独立GUI审证。
4. 其他六修/历史/rest/FL/MAX/L8/native/VoiceOver/B8原余项与父全部出口保持。所有适用独立门齐才exactstage本批全部ordinarycommit，无push/tag/release/正式切。

主源码和新开发源门待审；原GUI门FAIL未关闭。未stage/commit，正式3080/3091及全部旧隔离服务保全。Main持续执行，不等待重复用户授权。
