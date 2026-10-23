# 专家计划交件回执

> 2026-10-21，独立测试专家；仅是本角色计划/源码核查交件，不是全部验收完成。Main正在修batchA，尚未向本角色交冻结新候选与对应原证，旧产品基线上的FAIL不提前关闭。

## 1. Main即时接单

1. 先执行 [batchA即时单](batcha-independent-findings-and-main-worklist-20261021.md)；三项为独立确证FAIL，TTL本轮按10min纠正，不以130s有效误判。修后重冻结生成app、launcher桥与ResultCard产物，复验BA/PATH/原八项。
2. [总登记](remaining-acceptance-register-20261021.md)按A0/A1/B1..B4/C0推进；[旅程单](remaining-journey-cases-20261021.md)补资料/文件/恢复/冻结汇报、scope/canonical跨宽/导入/并发、B8及工具；[OP单](remaining-objective-cases-20261021.md)逐一保留原57个ID；[治理单](remaining-governance-cases-20261021.md)补非空来源和P0-P3；[层映射](remaining-layer-map-20261021.md)冻结42抽屉/39菜单真实设计ID。
3. 已承诺未实现单列RA-GAP-U4：tasks单sort/固定列与较新批准路线冲突；有限修复RA-U401/02，不重开看板multiSort历史PASS。H6/U3/跨重启计划/微信产品接入/OIL设计接管仍后置，不从本计划获得开发/发布授权。
4. 交新 `candidate.json` 和逐ID原证索引，不能只交“测试数全绿/最后成功”总结。Main只记录观察，专家给最终判定；缺证/运行身份未绑记BLOCKED，新未执行项NOT_RUN。当前整体未验完。

## 2. 自有产物验证

环境：macOS，Node v22.23.3（本机已激活），HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`。本角色无产品install/build/verify/GUI服务执行，未commit/push/操作正式profile。所有下列命令仅校验测试计划或探针本身：

| 命令 | 退出码 / 实际支持范围 |
| --- | --- |
| `node docs/testing/batcha-review-probe-20261021.mjs` | 0，已交探针：tmp复制冻结launcher模块+壳语法/内存旧旅程；不执行生成壳/不启服务，缺陷见batchA报告，退出0不是产品PASS |
| `node --check docs/testing/remaining-plan-check-20261021.mjs` | 0，自有脚本语法 |
| `node docs/testing/remaining-plan-check-20261021.mjs` | 0，五主计划链接/fence/空白/ID检查：原OP57全部一对一映射，显式RA164行无重复；42抽屉/39菜单/16卡在场 |
| `node docs/testing/remaining-plan-check-20261021.mjs --matrix` | 0，stdout JSON可解析；页面格1184，全部NOT_RUN/evidence=null，不产生GUI通过。格数只表示指定ID展开，不是产品覆盖百分比 |
| `git diff --check -- docs/testing` | 0，tracked差异空白校验；新文件另由自有checker校验，不用该命令空输出假称扫描了untracked全文 |
| `shasum -a 256 docs/testing/remaining-*.md docs/testing/remaining-plan-check-20261021.mjs` | 生成测试文档指纹；Main最终归档时连本回执重算，指纹不是产品身份 |

页面矩阵机器清单只在stdout输出，无需shared lib/写产品；Main可用结构化解析器记录自己原证。原viewport/主题/缩放/状态和动作预期在旅程单，不把输出JSON当测试运行。

## 3. 活跃变更与继承保护

编写期间Main修改launcher-app/local-app及相关测试、panel.tsx，又新增result-card组件测试、调整package/lock/verify-ui-feedback。它们是Main在途成果，本角色没有改写/删除/提交。旧HEAD不代表这些未提交源码或新产物，新候选须按ADL-057重新认领diff、新文件、锁及实例；特别共享ResultCard变化会影响O3/O5/长错误/复制，需重新绑定。

早期泛文件检索曾用不存在的`habit.ts`，命令exit2；随后按实际`habits.ts`和`storage.ts`核对schema/派生，无产品测试失败、未以missing文件推定功能缺失。未使用Python读写/installer/外部vendor执行；没有输出token/key/nonce。

下一接件是Main的batchA新候选+原证；仅这时才能复验关闭FAIL。后续各域独立审签按总登记保留历史局部PASS并说明继承接缝，直到全适用门证据齐全；由Main最后普通提交，专家不代提交或宣布发布。
