# HC01 既有习惯卡长 OKR 换行先行测试计划

> 2026-10-22，平台 trae，独立先行测试槽，非开发。记录本批合同、必要红与控制边界，给 Main 分派不同开发、不同复验与真实 GUI 使用；本计划不授权产品改动或发布。

## 1. 父派单与边界

负责人本次原句：

> HC01既有卡长OKR裁切独立先行合同/必要原红，非开发。负责人持续全部未验功能缺陷收口，Main派此自有测试槽。仅新前缀docs/testing/a19-habit-card-wrap-contract-20261022*+自有tmp；禁产品/他人testing/livingdocs/buildinstall/GUI服务/credentials/commit。读AGENTS/collab、a19-habit-association-gui-review§7原HC01/1440+390原件和habits.tsx旧卡/panel.css .pm-habit-okr。先plan，再冻结当前源/完整独占依赖来自/private/tmp/pmtool-a19-owned-deps-20261022；Node直达Vitest无cache白名单单worker。最小合同保持旧卡图标/标题/裁决声明/控制，不新增编号/改内容/新UI；推荐仅作用旧卡badge max-width100%/min-width0/overflow-wrap:anywhere和必要文本flex容器/装饰图标不压缩。测试可用真实组件+真实CSS机制先必要红，不能jsdom布局当视觉PASS。短目标/新建议行/记录历史控制。引用GM01已关闭无需重复全部守卫。结束交具体最小范围/原exit/red/control/保护/资源释放STOP。Main随后不同开发+不同复验+实际GUI。macOS Node22.23.3/pnpm11.28.5，rg缺失用python/find。依赖需完整复制+内部links/inode证非共享，不执行旧bin/pnpm。原文件所有者testing勿改。

自行补齐工程字段：仅写本前缀计划、`-cases.test.tsx`、`-run.mjs`、`-evidence/`、最终报告和 `/private/tmp/pmtool-a19-hc01-contract-20261022-r1/`。不 fetch/pull 改在途树，不 install/build/全回归、不跑 pnpm/旧 `.bin`，不改 livingdocs 或其他 testing，不读取凭据，不操作任何服务/浏览器。依据 AGENTS §6A、collaboration §9/11，本任务是独立先行合同，不是产品完成或放行。

## 2. 原证与最小修复合同

- 原独立报告 [§7](a19-habit-association-gui-review-20261022.md#7-单列旧卡缺陷-a19-hc-01)：HC01 有限视觉 FAIL，未修；GM01 有限关闭，只引用不重开全部守卫。
- 原 390 [actual.png](../../reports/all-pending-evidence-20261021/A19/habit-association/width-1792634972808/actual.png) / 同目录 view、exit、raw：两旧卡长标题及连续编号右侧裁切。
- 原 CSS 1440 局部 [actual.png](../../reports/all-pending-evidence-20261021/A19/habit-association/suggestion-visible-1792634962691/actual.png) / 同目录 view、exit、raw：原报告的宽屏裁切证据。图片像素尺寸不等 CSS viewport，按原 view.layout 绑定，不把 DPR 当文本缩放。
- 真实旧卡 `src/client/views/habits.tsx` 内 `.pm-habit-okr` 与 `panel.css` 对应规则；当前 inline-flex / fit-content，无最大宽度与连续串换行约束。

**Goal:** 使旧卡关联 OKR 的原全文在卡内自然换行，不用隐藏裁切。

**Architecture:** 只约束旧卡 badge 的 `max-width:100%`、`min-width:0`、`overflow-wrap:anywhere`；确有必要才给原文本一个最小 flex 文本容器（`min-width:0`、允许收缩），原 Link2 装饰图标不压缩。保留 inline-flex、原 token、border、padding、fit-content 等短文本外观。不得改变 title 解析、裁决声明、正文、状态/编辑/打卡入口，不能为旧卡新增 OKR 编号、计数、聚合或新 UI。

**Tech Stack:** macOS darwin/arm64，固定 Node v22.23.3，项目约定 pnpm 11.28.5 仅声明不执行；真实 React/react-test-renderer + 完整依赖内的 PostCSS 解析真实 CSS + Vitest。无需 jsdom，不测虚假布局。

供 Main 后续开发的候选范围，不是本角色可写范围：

| 文件 | 最小允许方向 / 禁止 |
| --- | --- |
| `src/client/panel.css` | 只旧卡 `.pm-habit-okr` 换行、约束与必要直属子规则；不改 shell/shared/new suggestion |
| `src/client/views/habits.tsx` | 仅必要文本 flex 容器/原 Link2 不压缩；正文、解析、声明、控件逐字保持 |
| 必要同域测试 | 纳入本合同必要红和控制，不能删红或降低期望 |

## 3. 步骤与产物

1. **计划：已完成。** 写本文件后才冻结。
2. **冻结：已完成。** 508完整输入/389 src，完整13613依赖普通文件/1030内部links，外链/共享inode/源副本漂移0。基线、dirty patch、新输入与原证均绑定。未执行 bin/shim、installer、pnpm。
3. **必要红：已完成。** 首轮与自有补件均4/4 RED，分别缺最大宽度、最小宽度、anywhere与原图标不压缩约束；原exit1与失败全文保留。PostCSS仅作声明规则投影，非真实浏览器cascade或布局；旧文本无容器本身不是独立新 UI 要求。
4. **控制：已完成。** 首轮6绿/3自有设施错误保留；仅更正自有日志循环序列化、短目标fixture漏onEdit、断言诊断与实际执行标题刷新等后，9/9绿。原长/短全文、无新增编号、图标/声明、新建议行、原历史控制及命令接口保留。历史反例仅为组件合同，不冒原GUI种子。
5. **归档与释放：已完成。** 每组原argv/cwd/env/PID/exit/stdout/stderr/reporter保留；15669固定条目零漂移，完整源/依赖副本零漂移，四测试PID已退出。最终报告与索引供Main接续；资源释放STOP，非HC01通过。

## 4. 冻结执行命令

运行环境：本仓库根，macOS + Node v22.23.3。脚本拒绝覆盖已存在证据；测试只白名单单 fork / min=maxWorkers=1，`cache:false`、`--no-cache`、禁 Node compile cache，HOME/TMPDIR/DSH_HOME/XDG_CACHE_HOME 全为自有 tmp，Node 直达完整副本 Vitest JS。

```sh
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-card-wrap-contract-20261022-run.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-card-wrap-contract-20261022-run.mjs freeze
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-card-wrap-contract-20261022-run.mjs run
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-card-wrap-contract-20261022-run.mjs supplement
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-card-wrap-contract-20261022-run.mjs seal
git diff --check -- 'docs/testing/a19-habit-card-wrap-contract-20261022*'
```

`run` 外层保必要红真实 exit1，不能以预期失败把外层洗绿。freeze/seal 成功仅说明冻结/审计，控制绿不关闭 HC01。

## 5. Main 后续有限 GUI

不同开发修复 → 不同独立 SOURCE/AUTO 复验 → Main 唯一新候选/实际加载采证 → 独立审证。原两个 habit ID、原合法长 title/连续72字符，在1440深色和390深色各旧卡全文可读、自然换行；短 title 控制、新建议行不回归、原图标/声明/状态/编辑/打卡不遮挡，局部探针只辅助。保存实际 DOM/图/控件和原 habit/checkIns/inbox/OKR/四根前后，新索引不得覆盖原699件。本角色 GUI NOT_RUN，不能给修后视觉 PASS，更不能签全习惯/全部积压/发布。
