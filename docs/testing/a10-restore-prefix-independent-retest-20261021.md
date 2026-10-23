# A10 恢复组合前缀独立复验

> 2026-10-21，trae，独立测试专家。供 Main/后继专家核对 A8-RV02 的 SOURCE/AUTO 局部修复；不是 GUI、A8 整项或发布门 PASS。原始证据、命令、退出码与指纹均保留在同前缀 selftmp。

## 有限结论

| 对象 | 独立结论 | 证据及边界 |
| --- | --- | --- |
| A8-RV02 / RV02-A01 SOURCE | PASS | 对冻结 A8 helper，仅增加三行组合前缀允许映射；原分类、成功信封与当时接受规则未变 |
| RV02-A01/C01 AUTO | PASS | 本专家独立新增 50/50；真实 PmPanel、ConfirmHost、ResultCard，不 mock helper/PmPanel；只控制宿主响应及浏览器适配器 |
| 原作者 prefix 范围回归 | PASS，有限范围 | 25+9+5+2=41 绿；只排除另案 A9F01 的三个新标题测试，非隐藏 prefix 失败 |
| A9F01 追加 SOURCE/例核 | PASS，有限范围 | 新接受规则同源分类；独立 5/5，作者限定 44/44；不是全部消费者 GUI 或完整 A9 门 |
| RV02-G01/G02 / 样式 / UX | NOT_RUN | 按派单不操作 GUI/服务，等待 Main 新候选原证；不转 MANUAL_PENDING、不写 GUI 绿 |
| 历史 A8-RV02 GUI FAIL / 空项目设施红 | 保留 | 本轮没有覆盖、撤销旧原件或旧判定 |

**任务结束并释放，不无限等待 GUI。** Main 后续按原合同在新候选逐类采证，独立专家另审；无发布、commit 或服务切换结论。

## 授权、合同与冻结

- 负责人首派：新独立专家限定 A8RV02 prefix 修复；只写 `docs/testing/a10-restore-prefix-independent-retest-20261021*` 及 selftmp；不写产品、其他 testing、livingdocs，不 build、不写 sharedcache、不操作 GUI/service/credential、不 commit。
- 追加原句：“你prefix旧冻结仍有效，不重新全门；可若任务未完另有限追加source/例核new接受，不把GUI绿。”据此保留原冻结，另建 `success-frozen`，没有重冻整个主树或重启完整门。
- 已读 `AGENTS.md`、`docs/collaboration.md`、[先行 RV02 合同](a8-gui-supplement-independent-review-20261021-repair-contract.md)、[批准计划](../plans/2026-10-21-restore-prefix-closure.md)。本轮特定写边界优先于通用开工 pull/build/livingdocs/commit SOP；脏树未拉取、未更改历史。
- 只读依赖 donor：`/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`；React/renderer `18.3.1`、Vitest `2.1.9`、Vite `5.4.21`、TS `5.9.3`。macOS arm64、nvm Node `v22.23.3`；未安装依赖或调用 pnpm/build。
- 第一冻结时间 `2026-10-21T15:20:19.248Z`，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，**不是单靠 HEAD 认领**：389 个源/配置/fixture/旧合同输入，其中完整 `src` 378 项按仓库层级复制，另存 tracked binary diff、未跟踪清单与逐文件 SHA256。diff SHA256 `d2d40c6590aaec5d86fe762f0f1adc5fa9e70f2018fd2305e5fa8b1b3df0a8bf`；清单 SHA256 `1d25cb15360894f922e4f39df73c70c1851f84747164cfeb939f4e4e2e1f8ac5`。
- 原 prefix core SHA256：`11efe6218cac82da0aef5fc239f19d697a186d0f3c86633d5b4095cfd5295d43`。
- 旧 A8 冻结 core SHA256 `f43615f324d71dd7dd31e5c1a264cc3467f9b95bf6f8518d90c90e983d6f4cba`，与新 core 差异仅 `source.audit.json` 中的三行；不是用当前 lib 反证 A8。
- 追加接受规则 core SHA256：`3808eef79e34595754ea9d8970d62c5c5da87feb1f42722eba593a061f1bbde7`。追加冻结时间 `2026-10-21T15:25:49.666Z`，包含新 core/test、Main A10/prefix 与 A10/success 红绿原日志的 17 项指纹。它与第一冻结分开，不冒充第一候选。
- 本轮未 build、无产物/实例/profile/开关/浏览器认领；这些字段为“不适用：未启动”，不假称新 GUI 候选已就绪。

## 独立增量及适配边界

`independent.test.tsx` 最终 50 项，RV02-A01 27 项、真实组件 23 项：

- 允许恢复/备份两场景，组合前缀中文/英文冒号及无原因前缀，Error/string；多行、空行、缩进、原因中“恢复失败”和尾空格均逐字保全。
- 同场景前缀保持；非允许场景仍补外层。相似前缀、空格后冒号、分号、非首行组合前缀、前导空格均是正文，不任意清洗。
- 无前缀/Error/非字符串原转换，结构化成功的分类/3 秒 TTL/详情与裸错误持久性继续原契约。
- 本机 path 与 content 两通道，各三类独立下层错误 × 两种冒号；显式延迟 Promise，按特定拒绝完成信号审新反馈，不拿旧 alert 充数。
- 单一真实 alert、完整原因，推进 6 秒后仍存在；零 preview、零危险 dialog、零 confirm。path 保完整含空格/单引号中文路径。
- content 的生产文件输入本来就清空，**不伪称 DOM 文件框保输入**：预检失败核原 content 命令与文件读取；确认失败核保留的原预览和文件名，真实 confirm 命令仍带相同完整 content。
- 正常预检全文与警告、两确认/危险层取消/成功 refresh；确认失败不 refresh、不造成功并保预览；原 format/JSON 错误、非法路径拒绝、复制完整原文及关闭保路径回归。
- Host `execute` 只返回/拒绝原命令文本，FileReader 只提供内存字节、fetch 明确拒网络。没有运行真实备份校验/写恢复/真实文件读取，因此不能据此签 hash/sidecar/事务/落盘/GUI。
- A9F01 新增独立标题与作者不同，分别含“失败/错误/未找到”：成功信封新接受 true、旧接受 false、裸拒绝仍 false；同时审源码仅接受规则变化、正常文本不变、组合 prefix 不变。函数 hoist 有实际执行证据。

## 全部运行与原红件

入口为 [run.mjs](a10-restore-prefix-independent-retest-20261021-run.mjs)。每轮真实 argv、cwd、起止、exit/signal、设施副本/指纹、stdout/stderr、Vitest JSON、postcheck 见 selftmp；[summary.json](a10-restore-prefix-independent-retest-20261021-selftmp/summary.json) 逐轮索引，不用口述代日志。

| mode | exit | 结果 | 判读 |
| --- | --- | --- | --- |
| `freeze` 首尝试 | 1 | 旧 testing node_modules 软链被设施拒绝 | 当时未生成 freeze/未执行测试；改为记录软链目标、不遍历。错误是工具回传，不伪造为已归档 raw stdout |
| `freeze` 修设施后 | 0 | 389 输入副本/原源匹配 | 原冻结保留 |
| `independent` | 1 | 49 绿 / 3 红 | 两个范围外备份按钮探针未确认而超时，另一个不支持的 matcher；有 overlapping act 警告。首 stdout/stderr/设施副本仍在 |
| `independent-r2` | 0 | 50/50 | 撤出范围外备份按钮探针，修 matcher/act；stderr 空。第一轮观察文件未独立另存，现 `independent.observations.json` 属 r2，不当 r1 原证 |
| `author` | 1 | 59 绿 / 3 红（62） | 冻结恰逢 Main 已加三个标题测试而 core 尚未改；且首设施误选 26 项纯 launch 文件，不宣称 41 项 |
| `counterfactual` | 1 | 54 绿 / 8 红（62） | 同混合时点；3 个新接受规则红 + 5 个 prefix 红，二者分开 |
| `source` | 0 | 三行差异核对 | SOURCE 前缀局部通过 |
| `facility` | 1 | 0 绿 / 1 红 | 空项目真实 panel 不挂 ResultCard，生产命令确已完成；保留设施红，不据此报 prefix 产品 FAIL |
| `success-freeze` | 0 | 17 输入匹配 | 独立追加认领 |
| `author-prefix` | 0 | 40 绿 / 4 skipped | 名称过滤误跳一条含换行的非法路径，不据此放行 |
| `counterfactual-prefix` | 1 | 35 绿 / 5 红 / 4 skipped | 同设施缺口，保留 |
| `success` | 1 | 4 绿 / 1 红 | 源码断言猜错新增注释，行为样例已绿；不修改源码，只修设施 |
| `author-prefix-r2` | 0 | 41 绿 / 3 skipped | 精确 25+9+5+2；仅另案 3 新标题测试排除，所有 prefix/换行路径测试实际执行 |
| `counterfactual-prefix-r2` | 1 | 36 绿 / 5 红 / 3 skipped | 用冻结旧 helper 的真实允许反证；同 41 项范围，5 prefix 红。只是反证配置，不 mock helper 或改 frozen |
| `author-success` | 0 | 44/44 | 28+9+5+2；旧完整 frozen panel + 新冻结 core 的明确组合，不冒充全主树候选 |
| `success-r2` | 0 | 5/5 | 源字节与有限独立接受例核，stderr 空 |
| `final` | 0 | 两份冻结零漂移 | 不是产品完整回归 |

旧 A8 与 Main 的原红原件未改。Main 已归档旧同组 **5 红 / 29 绿（34，仅 core+path）**、prefix 41 绿、success 44 绿，本次另冻结原日志供回读；本专家同旧 helper 反证多跑 launch/checklist 7 项，所以是 **5 红 / 36 绿（41）**，不把不同分母说成矛盾或重复独立来源。

部分作者组件测试有 key、MaxListeners、缺 requestAnimationFrame 的警告，原 stderr 全保留；没有自改它们或将其当真实浏览器质量通过。本专家最终独立 prefix/success 两轮 stderr 均空。

## 护源、写根与退出

- 手动新增/修改仅本前缀 `run.mjs`、本文、同前缀 selftmp 的测试/配置/审计设施；副本、缓存、JSON/日志均落 selftmp。另创建 `/private/tmp/pmtool-a10-prefix-independent-20261021-AK11E9` 空自有 scratch，未承载业务/构建。
- package-local/private node_modules 只含依赖链接，隐藏共享缓存目录不链接；`cacheDir` 每轮私有，`--no-cache`，TMP/TEMP/NODE_COMPILE_CACHE 都指向 selftmp。
- 四个主/依赖共享 `.vite/.vitest` 根前后内容/mtime 未变；登记依赖 entry/package/CJS 指纹未变。不是全依赖目录或全磁盘 WATCH，不声称超出登记范围的零污染。
- 主 lib、其他 testing、所列 livingdocs 已纳入内容/mtime/新增清单保护。各运行窗口 `duringRunProtectedDrift=[]`、sharedCachesUnchanged=true；最终主树相比原 freeze 有三项并发变更：`core/ui-feedback.ts`、`core/csv-import.ts`、`core/csv-import.test.ts`。前一项对应 Main 已通知的新接受规则；CSV 不属本任务，未回退/覆盖、不签其结果。
- 第一冻结 `frozenDrift=[]`，追加冻结 `supplementaryFrozenDrift=[]`，追加 Main 输入 `supplementaryMainDrift=[]`，最终详见 `final.postcheck.json`。不能将主树上述漂移解释为本专家写入，也不能宣称整个主树零变化。
- 所有 runner 子调用均有结束时间/退出码；最后进程观察未见 A10 runner/Vitest。未启动或停止 GUI/服务，未读 credential，未 build、未碰主 lib、未 commit。

## 复现命令

运行环境 macOS + bash/zsh + nvm Node22。已有原件禁止同名覆盖；新轮须加独立 mode/文件名，不能直接覆盖 frozen。

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
node docs/testing/a10-restore-prefix-independent-retest-20261021-run.mjs final
```

各已执行测试命令完整 argv 见对应 `.execution.json`，均为 `node <只读donor>/vitest/vitest.mjs run --config <selftmp>/vitest.config.mjs --no-cache --reporter=verbose --reporter=json --outputFile.json=<独立轮次>`；`A10_MODE` 与私有缓存/临时环境逐轮登记。无完整 build/all-verify，此限制是本次授权边界，不借有限 PASS 改写整项门。
