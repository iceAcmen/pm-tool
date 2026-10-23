# A19 编号手动取值补证独立审查

> 2026-10-22，平台 trae，独立 GUI/证据测试专家。只审 Main 已采 `manual-d3`、`manual-d4`、`manual-d5` 原证；未运行 GUI、未改产品或旧测试产物。本结论只覆盖手动诊断分支，不等于 A19、编号整体、总门、提交或发布 PASS。

## 1. 独立结论

**手动诊断分支 `PASS_LIMITED`。`GNHD-MAN-D01`、`GNHD-MAN-D02`、`GNHD-MAN-D03` 在候选 SHA256 `e6ae8366eeaae4293d4d960cfe4002bf249b10f148aad13f97eecdb28fee25d7` 上均可关闭。**

| 项目 | 判定 | 独立审查结论 |
| --- | --- | --- |
| `GNHD-MAN-D01` 目标字形内真实拖选与系统取值 | `PASS_LIMITED / 关闭` | D5 起止点均命中 `SPAN.pt-code-val`，父节点均为 `BUTTON.pt-code-btn.failed`；拖选中、抬起后和 native Copy 前 `selection` 均为 `1`。Chrome CDP 原生 `Copy` 后系统 `pbpaste=1`，等于目标值，且不等于预置哨兵。 |
| `GNHD-MAN-D02` 普通可见文本控制 | `PASS_LIMITED / 关闭` | D5 控制为既有 `P.pm-check-empty`；起止点均命中该节点。真实拖选后 selection 与系统 `pbpaste` 同为“命中规则提示。这不构成完成验”，非空且包含于原文。 |
| `GNHD-MAN-D03` 版本、实例与命中连续性 | `PASS_LIMITED / 关闭` | 原证保存 `Chrome/139.0.7258.155`、revision、origin `http://127.0.0.1:3249`、timeOrigin `1792634747265.7`；目标 before/during/after/beforeNativeCopy 与命中、失败态、选区连续。 |
| D3/D4 | `FAIL 原证保留，不作产品 FAIL` | 两轮目标真实拖选均已得到 `selection=1`，普通文本也形成非空 selection，但系统剪贴板均为空。D3 在 Browser clipboard permission denied 下使用 Puppeteer `Meta+C`；D4 虽在复制前 grant 权限，仍使用同一 Puppeteer 按键注入，且普通文本控制也为空。权限与按键注入设施因素混杂，不能用来否定 D5。 |
| 四根保护 | `PASS_LIMITED` | D3、D4、D5 各自 `before-roots.json` 与 `after-roots.json` 逐键、逐字节相同；每轮均为 data 23、files 2、backups 0、exports 0，文件 SHA256 均为 `73b5372bdce8b6716919ee8a86885d5ab491304146a6424aedb77a61a2a20f48`。 |

因此，既有“手动取值是否可行、先区分产品与设施”的最小诊断合同已闭合：D5 同轮中目标与普通文本控制都能通过真实鼠标选区和 CDP 原生 Copy 改写系统剪贴板。它只证明本候选、本实例、本页和本次 1440×900 深色场景的手动分支可行。

## 2. `cell.failed=false` 字段缺陷

D3/D4/D5 的 `result.json` 都出现 `cell.failed=false`，该字段不能解释为页面未处于失败态。三份 runner 的 `selectionState()` 先取 `.pt-code`，再错误检查 `cell.classList.contains('failed')`；实际 `failed` class 位于其子按钮。

连续原证明确显示：

- active element class 为 `pt-code-btn failed`；
- 起止命中的 `SPAN.pt-code-val` 父节点 class 为 `pt-code-btn failed`；
- cell 文本含“复制失败”；
- title 为“复制失败，可长按或手动选中编号复制”；
- aria-label 为“复制失败，可手动选择复制”；
- `.pt-code-val` 的计算 `userSelect=text`；
- D5 target 原图中编号 `1` 有真实选区，按钮下仍显示“复制失败”。

据此，`cell.failed=false` 是 runner 对 `.pt-code` 查错节点造成的采集字段缺陷，不是失败态反证。本审查没有静默忽略该缺陷，也不修改 runner 或产品。

## 3. D5 原图目视

已用原分辨率目视：

- `manual-d5-1792645183549/target-selected.png`：编号 `1` 的字形区域可见选中高亮，按钮处于黄色失败样式，下方“复制失败”可见。
- `manual-d5-1792645183549/control-selected.png`：交付前核对卡片中的普通提示段落可见连续文本选中高亮。

原图与 `result.json` 的命中节点、selection、clipboard 和时序互相一致。截图只作目视佐证，系统值仍以同轮 `pbpaste` 原证为准。

## 4. 旧 seal 的 missing-link

旧报告第 136 行当前真实链接 `a19-number-visual-retest-review-20261022-seal.json`。旧报告当前 SHA256 为 `2e24d28599d4dd84e09f919322c4eb22425d413c7831e2ee0a46372ff19eac6c`，与旧 seal `ownFiles` 中该报告的 SHA256、bytes `20955` 完全一致。

旧 audit 的 `seal()` 在第 156--172 行先检查 Markdown 链接，第 173 行后才调用 `output('seal', ...)` 创建 seal；同时第 155 行明确把 `-seal.json` 排除在 `ownFiles` 外。首次生成时，自引用目标尚不存在，因而把 `missing link` 写入随后创建的 seal。当前目标存在且报告字节未变，故这是 seal 生成时序留下的**陈旧格式记录**，不是报告漂移或链接仍缺失，不阻塞本次手动分支审查。

该判断不倒改旧 seal：其 `formatting` 非空及当时 seal 命令非绿仍按历史原样保留；本报告只说明该条不再代表当前文件状态。

## 5. 证据绑定与未覆盖边界

| 原件 | SHA256 |
| --- | --- |
| D3 `result.json` | `0cdd2d2198d91cd19ca621e0f0a231168a8f4d409c0df40f4f8873a3ab2273a6` |
| D4 `result.json` | `5ffb774f6f17d0665f38829e82af92fe9992e2060a2683bee8302d92bb62a73f` |
| D5 `result.json` | `94ad5b9d059ce9fcb500a6f0e59509f0bad5a803256dac98f0413994cc5a7b79` |
| D5 `runner.mjs` | `e361538a0efe6642e82db266ececaacc06df05803a86e95930e02516b54ec917` |
| D5 `target-selected.png` | `36b187d2ea77cf6a6a3e51b606acdc177d55d8514d3cc389fa396c17287e0d98` |
| D5 `control-selected.png` | `1d29de5abc97da7952a634acfffd50624c1478423b3a5615ae53bdafebbea166` |

仍未覆盖、不得由本结论扩张：

- 原合同要求的不同浏览器上下文；D5 仍是同一 origin/timeOrigin 下的权限切换。
- 原遗漏的任务标题 bbox，以及编号布局的全量 bbox 合同。
- 其他视口、浅色、200% 文本缩放、其他 Chrome 版本或其他编号值。
- A19 全部范围、编号整体、B1-GUI-02、全部未验功能、总门、提交与发布。

本审查没有新增产品缺陷。D3/D4 失败原证继续保留；D5 只关闭 `GNHD-MAN-D01..03` 的诊断缺口，不覆盖旧报告已经明确保留的其他边界。
