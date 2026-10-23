# 人员图轴文字槽与容量开发交接

2026-10-23，trae，唯一人员源继任开发。**最小源修复已落并冻结，仅交 Main 独立审源；不是人员 SOURCE/AUTO/GUI PASS，不授权本角色 ordinary commit。**

## 两源认领

原两源实核匹配父单后才写；两前任姓名/CSS定位开发实际 readback0、STOP / released，不复活、不修改其任何封件。基线提交/全包候选/他域变化由 Main 认领，本角色无 Git 操作、不背书 nonowned 全树。

| 对象 | before → after SHA-256 | 字节 |
| --- | --- | ---: |
| `people.css` | `8665e0874b0995a77bcd119fbcd892eaeb853593ce4014bce33100d270a995f4` → `7fa9e31329595f05fe846999eafc21208ec7ee011e86883e44afd223743c1594` | 14066 → 14862 |
| `people.tsx` | `e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6` → `d32a316ab25b958fc1bd93f14b157e8da1f75556f419ea72f72ab708f85c107b` | 26112 → 26546 |

只写这两源、本角色 [plan](2026-10-23-people-axis-slots-capacity-developer-plan.md)/本 handoff，以及 `/tmp/people-axis-slots-capacity-developer-20261023/`。原姓名 `.pp-name` 修复保持。

## 最小差异

- `.pp-lower` 零最小值7:5比例列，两卡/卡头/说明可收缩换行；沿原1100断点为零最小单列，没有新断点、字体缩小、列删除或新卡。
- 排期原112/84姓名列不变，完整姓名增 span/title，仅其文字槽局部省略。时间图最小160px宽，合理横滚只在现 `.pp-g-body`；未设整页裁切或分布图卡新内滚。
- 原点保 `xPct=(value/maxX)*100`、`flip>=82`、`top=14+i*15`、点序。外点 maxWidth 直接以图宽的 `flip ? xPct : 100-xPct` 百分比限剩余空间；不在子姓名槽误用该百分比，不改点位置。
- 点内 label 包姓名/数值两个独立 span，避免外层 flip 的 row-reverse 改变姓名/数值视觉顺序。姓名可省略，数值不收缩/不省略；完整原姓名留 DOM/title，无新增 aria-label 或隐藏读屏副本。
- 现图容器高度 `Math.max(124, (dots.at(-1)?.top ?? 0)+24)`：原15行末中心224，新高248，仍保原行距与最小124。未改统计/刻度/阈值/MAX/core/events/schema。

这是静态实现与人工审阅，不称消除外滚/叠压已获 GUI 证实。详见自有 `static-review.md` 规范/合同两轴；呈现和真实可访问树待 Main。

## 实际验证

环境：macOS，已有 Node v22.23.3、Vitest 2.1.9、TypeScript 5.9.3；没有安装、没有调用 pnpm。所有下表步骤为 runner 唯一 child 的真实 UTC 起止/退出与耗时，不加工具 outer 耗时。源码编辑区间是前后检查点，不冒充 apply 内部计时。

| 步骤 | UTC 起止（2026-10-23） | 唯一子耗时 / 结果 |
| --- | --- | --- |
| before | 03:06:01.262 → 03:06:01.316 | 0.053341s，exit0，两源匹配并冻结 |
| 前任回读纠正后实核 | 03:06:19.142 → 03:06:19.227 | 0.083904s，exit0，两前任均 released |
| vendor verifier | 03:06:19.168 → 03:06:19.311 | 0.141576s，exit0，注册13+23；未注册原样 SKIPPED |
| 注册13独立SHA/bytes | 03:08:54.227 → 03:08:54.293 | 0.065108s，exit0，含根LICENSE |
| 源编辑检查点区间 | 03:07:24.062 → 03:08:11.912 | 47.850s，区间非额外子耗时 |
| 有限冻结输入 | 03:08:53.821 → 03:08:54.113 | 0.291414s，exit0，精确15文件，无依赖copy |
| 原 people/core 五例 | 03:09:00.824 → 03:09:02.434 | 1.608952s，exit0，2文件5例全绿 |
| 窄type + CSS解析 | 03:09:01.355 → 03:09:04.171 | 2.814142s，exit0，0诊断、解析成功、noEmit |
| after | 03:09:35.819 → 03:09:35.878 | 0.055601s，exit0，上表新SHA/字节冻结 |

五例原 oracle：`people-load.test.ts` 的 wrapped不进open（1例）；`people-scale.test.ts` 的下限8/刻度0..8、未分配驱动上限、过滤不缩尺、2倍数+2（4例）。均冻结原src精确import闭包，不修改测试/fixture，不新增CSS镜像测试。`frozen-inputs.json`绑定15件大小/SHA及依赖逻辑只读symlink；依赖不复制，不扫描全树。

完整全部步骤（含失败）、真实 UTC、PID/executable/childargv/exit、stdout/stderr 在自有 `*.json/*.stdout/*.stderr`；最终 `timing-summary.json` 由 readback 真收据生成，含每步完整收据、子耗时每步计一次、并行区间合并秒数和起止墙钟跨度，不 child/outer 双计。最早工具只给墙钟耗时，无绝对UTC，不补造，其边界单列。

可复制原验证命令（cwd=`/Users/bytedance/Projects/dsh-pm/pm-tool`，macOS）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/usr/bin/env HOME=/tmp/people-axis-slots-capacity-developer-20261023/home TMPDIR=/tmp/people-axis-slots-capacity-developer-20261023/tmp XDG_CACHE_HOME=/tmp/people-axis-slots-capacity-developer-20261023/cache /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /tmp/people-axis-slots-capacity-developer-20261023/vitest.config.mjs
/usr/bin/env HOME=/tmp/people-axis-slots-capacity-developer-20261023/home TMPDIR=/tmp/people-axis-slots-capacity-developer-20261023/tmp XDG_CACHE_HOME=/tmp/people-axis-slots-capacity-developer-20261023/cache /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-axis-slots-capacity-developer-20261023/narrow.mjs check
```

## 失败、越界与未覆盖

真实设施/诊断失败均保留，不洗成全0：最初4次 `login:false` 工具参数被设施拒绝（命令未执行）；初步 `ls` 猜测若干不存在路径exit1；`test-location`/`test-oracles` cat误猜runner/raw声明路径exit1；前任readback最初误读`status`字段而实际是`actualStatus`，检查exit1，纠正后两件实际0；注册13初计仅skills内12件漏根LICENSE，exit1，补rootFiles后13件SHA/bytes0。`diff-css`/`diff-tsx` exit1为有真实差异，不是测试失败。Vitest保留原`cache.dir deprecated` stderr，实际cacheDir仍自有输出。

上述失败均非产品测试失败，未改前任收据或产品补第二轮修。**无禁止的产品/文档写入，无Git/fetch/pull/install/fullbuild/lib/browser/desktop/服务进程控制/正式上游动作**；仅启动允许的有限验证子进程，不启动宿主服务。不写 livingdocs/testing，不改他人成果。初始组合只读输出过宽，随后收窄到本单精确文件；未全树扫描/依赖copy。

未运行：整build、完整verify、GUI/键盘/读屏/原实际滚动、四宽原旅程。五例/窄type/人工语义审阅/封件0均不等于独立PASS；旧姓名 SOURCE不能覆盖本轴TSX，旧GUI不自动继承新源。F1/FL MAX10与FD MAX8原证边界保持。

## 封件与释放条件

`seal-manifest.json`封两源original/after、差异、plan/handoff、runner/narrow/config、15冻结输入与原测试oracle、stdout/stderr和收据，逐件真实bytes/SHA。seal/readback与最终timing-summary是其后的实际收据，避免自指哈希；不预填成功。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-axis-slots-capacity-developer-20261023/runner.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-axis-slots-capacity-developer-20261023/runner.mjs readback
```

**仅当上述 readback 真 child status0 且 receiptReread=true，才 STOP / released；最终真实结果以 `readback.json` 与 `timing-summary.json` 为准。** 此后本人不续写、不自判PASS。

Main可立即审本最小两源diff及原五例输出。全部源独立释放后，由Main唯一合包冻结构建/全回归，沿原F1/FL和FD四宽/轴wheel横滚动作采新原证、补真实MAX10缺口；独立专家判受影响门。父ordinary commit须原门齐，由Main处理，不push/release/正式切、不追加新功能。
