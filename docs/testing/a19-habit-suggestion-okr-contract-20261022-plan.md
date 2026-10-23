# A19 习惯建议自身 OKR 展示先行测试合同

> 2026-10-22，平台 trae，独立测试专家、非开发。只细化既有 RA-P3001 / A18-GM-01 展示合同，供 Main 后续有限修复与独立复验使用；本轮保原红、STOP，不签 PASS。

## 1. 授权与停止条件

负责人原句：

> 独立先行测试合同A18-GM01习惯建议自己的关联OKR不显示，非开发。用户持续全部已实现验完/修确证独立/最后统一commit授权，Main现A18反馈独立复验在途不能改source。读AGENTS/collab、docs/testing/a18-growth-more-gui-review-20261022.md§5.1及完整新证据（只读不要重复全审）、remaining-governanceP3001，currentclient/views/habits.tsx、habit-model、其tests/Records controls。仅docs/testing/a19-habit-suggestion-okr-contract-20261022*自有tmp写；禁产品/其他testing/livingdocs/build/install/GUI/services/credentials/commit/sharedcache/lib。细化最小修复：每条pending/confirmed/ignored建议自身okrId解析当前注入okrs同project真实标题，保原ID可辨；missing旧ID诚实不借别记录目标，未关联如实或不显示不发明统计；不改confirm/ignore/final/backend/schema/aggregate、不扩成长功能。先给真实Habits组件可执行原必要红+无关联/缺失/其他项目同名防误配控制；明确只既有P3001展示合同、长标题窄布局/语义若必要并有限。计划与原红报告后释放，Main等A18反馈独立门闭才授权有限habits+必要tests实施，不能提前写产品或占唯一builder。源冻结自有/no-cache单fork白名单env/保护旧lib原证，原红保、报告STOP，不签PASS。

本前缀是唯一写域，含自有 `-selftmp/`。本专项明确覆盖通用 fetch/pull、安装/构建、完整 verify、livingdocs 同步及提交要求。当前脏树不清理、不回退，不启动其他 Agent，不借用其他专家输出目录。已只读核 AGENTS、collaboration §9/11、最新接续及本合同相关源码/原测试。

写入顺序：计划 -> 可执行测试/隔离执行器 -> 冻结 -> 原必要红及控制 -> 原红报告 -> 终检释放。Main 是唯一 builder；本角色没有 builder/源码/GUI/端口所有权。**即使本计划已交付，也不等于授权 Main 立即实施**：先等 A18 反馈独立门闭，再由 Main/负责人明确授权 `habits.tsx` 和必要同域 tests 的有限修复。

## 2. 原依据与最小实现方向

- [RA-P3001](remaining-governance-cases-20261021.md#5-p3习惯与周期占位) 明确 rationale / 关联 OKR 可见；[A18 §5.1](a18-growth-more-gui-review-20261022.md#51-a18-gm-01建议关联-okr-未展示) 的 GUI FAIL 保留，不复审或扩大其已签命令/功能子项。
- 现 `src/client/views/habits.tsx` 建议 `map` 不读取 `s.okrId`，三态均缺自身关联行。记录卡的 `h.okrId` 显示不能替代建议条目。
- `panel.tsx:889-891,1452-1460` 已把 snapshot.okrs 按 selected 项目过滤，再注入 `HabitsView`；建议也在视图按 projectId 筛选。`HabitOkrRef` 是 `{id,title}`，不含项目字段；不为本缺陷增字段或改 schema。测试模拟此真实注入边界，不把跨项目全清单冒充 panel 实际 props。
- `habit-model.ts` 原 `resolveHabitOkrTitle` 精确 ID 命中返回标题，缺失返回原 ID，无 ID 返回 undefined。保其兼容语义，不把缺失说成未关联。

**推荐最小方案**：只在 `habits.tsx` 的每个建议 `li` 内、理由和动作附近渲染只读文本：有 `s.okrId` 时用既有 resolver 对当前注入 `okrs` 精确解析；命中显示 `关联 OKR：真实标题（原 ID）`，未命中显示 `关联 OKR：原 ID`（可附“当前快照未找到”，但不强制新文案）。没有 `okrId` 则整行省略，或诚实“未关联”。ID 须在该条普通可读文本中，不能只放 title/hover/图标/隐藏 aria，也不能取 h.okrId / confirmedHabitId / 首目标 / 同名匹配。

替代方案只作边界说明：独立新 resolver/模型改动无必要；父层/后端新增查询或聚合违反本批范围，不选。不在本轮写任何产品实现。

## 3. 可执行 SOURCE/AUTO 合同

全部测试实际挂载未 mock 的 `HabitsView`，每条通过自身 suggestion ID 定位 `li.pm-habit-suggestion`，**断言局限该条**，不在全页寻找记录卡标题。真实 `HabitForm` / `RecordsListbox` 只作原接口控制，不当后端/GUI证据。静态 fixture 只注入组件，不落任何业务库；原必要红另使用已封存真实 snapshot。

| ID | 初态 / 操作 | 必要断言 |
| --- | --- | --- |
| HS-R01 | 原 A18 pending snapshot，两真实建议/同项目 F5目标 | 两条自身均含关联标签、当前标题与自身原 okrId；有记录卡显示目标也不能代替 |
| HS-R02/03 | 原 A18 重进 snapshot，第一 confirmed / 第二 ignored | 各自仍显示标题+原 ID，原理由/状态保；processed 无 confirm/ignore 按钮 |
| HS-R04 ×3 | 同项目三条、三状态、各不相同 okrId，另 habit 与别目标相连；重排注入清单 | 每条显示自己目标/ID，不能借其他建议/习惯；精确 ID 而非索引/标题 |
| HS-R05 ×3 | 三态建议仍存旧 okrId，当前 refs 未命中，另 habit/建议有有效关联 | 自身旧 ID 可读，不能显示其他目标，不说“未关联”；控件不新增 |
| HS-R06 | 旧 ID，refs=undefined 与 [] 两次注入 | 两次均回退原 ID，不伪造标题、不静默抹关联 |
| HS-R07 | 同 ID 的当前注入标题正常更新，组件 update -> unmount -> 重挂 | 新标题生效、ID不变、旧标题不残留；无 run/onSaved 调用，不用历史 habit 反推 |
| HS-R08 | A/B 项目 OKR 同名但不同 ID，按 panel 当前项目过滤；A 建议指向 A2，另旧引用 B | A2 ID可辨；B旧引用只保原ID，不借同名A标题；切B时B建议只解析B清单 |
| HS-R09 | 同项目合法长度长标题，含普通标点、HTML外形文本 | 该条全文及ID是普通文本，无 innerHTML/链接/输入/新操作；DOM不冒充窄屏布局或读屏 |
| HS-C01 ×3 | 原理由/三态/现按钮结构 | ID、理由、状态与 pending 两按钮/processed 标签原样 |
| HS-C02 ×3 | 无 okrId，另 habit 有关联 | 不借记录目标；整行省略或诚实未关联；不增“按OKR”计数/聚合 |
| HS-C03 | 外项目建议、同名目标清单 | 外项目建议不显示；当前项目注入按精确ID；缺失禁止借有效记录标题（与R08正展示分开） |
| HS-C04 | 冻结 props，挂载/重排/重挂 | props全文不变、渲染不调用run/onSaved；零自动建档/定稿 |
| HS-C05 | pending 真按钮调用；run true/false；processed 重挂 | 命令仍 `habit confirm <本建议ID>` / `habit ignore <本建议ID>`，仅 true 才onSaved；processed无写按钮 |
| HS-C06 | 真实HabitForm + RecordsListbox，同项目选项 -> 选空 -> 主保存/取消 | value/options及原提交草稿保持，不自动提交，不新增status/checkIns/streak入口 |
| 既有模型控制 | 原样执行 `habit-model.test.ts` | 原标题/缺失/undefined/计数/日期分组全部原断言保真，不改原测试洗绿 |

本轮预期：R 系列在未修源上真实失败，C 系列与既有模型控制应成立；失败如实分项，不为求红/绿修改源码、原报告、fixture或门规则。任何设施失败保留原日志并单列，不算产品红。

## 4. 长标题、语义与后续有限 GUI

本批只增加普通只读关联文本，不要求新组件/导航/统计/按 OKR 聚合、不重开 P3002..5。保理由与状态、按钮文案和 disabled/run 接口。图标若复用须装饰性，不替代标签和正文；不引入新 role=alert/status、链接或可点击关联入口。普通文本现有语义已足够，读屏全矩阵不自动升为本批新门。

最小方案优先自然块文本换行，避免盲复用记录卡 `inline-flex + width:fit-content` 导致长 ID/标题撑宽。只有新行确需局部排版时，另经 Main 确认在 `habits.tsx` 内限定到建议行的可收缩/换行规则；**不预授权 panel.css/records.css/shared controls**。若必须跨文件样式改动，暂停该追加并先明确文件级范围，不能扩大本轮授权。

修后独立 SOURCE/AUTO 再跑全部本合同原测试，不签 GUI。Main 新候选唯一隔离构建/认领实际下发后，仅补原 A18 两建议 pending -> confirm/ignore -> 重进：保存每条标题/ID可见、理由/状态/原字段和预期写入/无额外建档证据。再有限核一个同项目长标题及旧ID/无关联条目，在原1440深色与390窄档下确认关联文本可读、可换行、不压按钮、不新增外壳横滚；这是本缺陷新增行的局部检查，不要求全部成长/四宽浅深200%新矩阵。本角色无GUI授权；不把当前DOM全文断言写成布局PASS。

## 5. 冻结、证据与释放

- 完整复制本包 src/scripts/locale 及 package/lock/tsconfig/vitest/tsdown/cordis配置到本前缀自有目录；不带 lib，不构建。保存 HEAD、origin、本包 tracked binary diff、新输入清单指纹、冻结输入 hash/bytes/mtime，不能用 HEAD 单独表示dirty候选。
- 既有依赖只读；node_modules软链只写本前缀自有冻结树。白名单env、自有HOME/TMPDIR/DSH_HOME/XDG_CACHE_HOME、`NODE_DISABLE_COMPILE_CACHE=1`，Vite cacheDir自有，`--no-cache`/cache:false/单fork/1worker，无网络/凭据继承、不调用pnpm。
- 完整新 `A18/growth-more/index.json` 原件逐文件 SHA/bytes核对、JSON语法与完整目录差异只作证据完整性与保护，不重复A18全部业务审证。从原command/done snapshot与raw settings相接提取有限原fixture，不使用摘要替代snapshot。
- 保护 A18 原审计4179路径（含A13/A14/A16完整源/产物及原失败/旧报告），主包源码/配置/lib、A11/A12旧lib、所用依赖与既有缓存。Main其他新增/在途证据不纳零写，不声称整盘零污染。
- 每条运行保 argv/cwd/env/PID/时间/原退出/signal/stdout/stderr/reporter，冻结前后/终检差异保原件。保原红，报告STOP，精确自有执行PID退出后释放，不占唯一builder、不提交。

环境：macOS + Node v22.23.3；项目既有pnpm11.28.5依赖只读，未install/build。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-suggestion-okr-contract-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-contract-20261022-run.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-contract-20261022-run.mjs run
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-contract-20261022-run.mjs seal
git diff --check -- 'docs/testing/a19-habit-suggestion-okr-contract-20261022*'
```

进度：计划已落；原红/控制/保护/释放结果以本前缀最终报告和selftmp原件为准。**STOP，不签PASS，待Main收到A18反馈独立闭门后再授权有限实施。**
