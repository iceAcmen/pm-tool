# P1 下部 rest 可见补证有限审签

> 2026-10-23，trae，独立审证专家，非开发、GUI 或产品执行端。Main 唯一 builder/GUI/桌面。本轮只新增 `docs/testing/p1-rest-visible-gui-review-20261023-r2*`，原 testing、plans、livingdocs 和封件均只读。

## 1. 有限裁决

**PASS：仅关闭 [原 P1 报告 §5](p1-history-remaining-gui-review-20261023-r1.md#5-exactremaining各唯一原缺口) 中 P1001/P1002 共用的 `ORIGINAL_QUEUE_LOWER_REST_VISUAL` 缺图。** 不签整 ID、整 P1、P1006/FL MAX、父 ordinary commit 或新候选功能；无 push/release/正式切换授权。

父原授权保持：“父持续原授权所有已实现未验到本批ordinarycommit，无push/release/正式切；Main唯一builder/GUI/桌面。”本子单补证不改变父范围、不替 Main 作总出口裁决、不重复派动作。Main 继续非重叠 FL MAX/L8/native/B8 原父工作。

依据仅为原 P1 报告与已签 reader 结果、[原继承合同 §5 第三组](op-growth-final-inheritance-20261022-r1.md#5-给-main-的最小合并动作)、[治理合同 P1001/P1002](remaining-governance-cases-20261021.md#3-p1呈现与保护面)。没有新增矩阵、fixture、TTL 或产品要求。

## 2. 封件与候选回绑

| 实核对象 | 结果与边界 |
| --- | --- |
| [新 index](../../reports/all-pending-evidence-20261021/P1RestVisibleR2/index-r1.json) | SHA256 `ccc98a2c691e9a299fd2106fce43afc34de5aa9bfbdb3a6a21aa8a8d5010e7b5`；710/710 件 bytes/SHA 全符，全部为普通文件，无软链；含三件自排除文件的目录实际共 713 件 |
| 实际 raw/帧/状态 | **558 raw＝9×62，93 帧＝50+4+5+34，9 状态**；不是“预计 38”。9 态各 63 roots（62 业务 JSON＋1 backup），与原 round16-final 全同 |
| 原 final 根 | 原签 SHA `5631bd90699bd6a247727acab8664ace40d16714186aeaabaa9fc5afe3688e7d`；新副本与原件逐字节全同。原件从已签 audit 的明确指纹回核，不重核旧全部 2122 件 |
| 来源/宿主 | baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；原 **114 source/521 complete inputs、3267/PID3133、E2E=0/pilot=OFF**。来源绑定、浏览器脚本绑定、host-ready 四件必要元数据与原签原件全同；queue-aggregate 副本与绑定 SHA 全符 |
| 原签继承 | 原报告/audit/verdict 与原 seal 的 SHA 全符；旧 audit SHA `7b1550bb552dd721dccf70a4a114f65f2d22703735f804b20f1f9dd515422163`。继承已签写链/RPC/rows，不运行旧 reader/harness 或 import 归档源码 |
| 新候选保护 | [44 件实读保护记录](../../reports/all-pending-evidence-20261021/P1RestVisibleR2/round04-new-candidate-protected.json) 与 `P2DisplayRepairGuiR2/round10-final-a-roots.json` 全同；该 final SHA `17022947b257eb5328c5e35b3d5487117bee87778994291110f8308425080fea`。范围仅 data/pmtool、files、backups，不称全机零污染或新候选功能通过 |

九份 `*-roots.json` 来自旧 harness 的固定原3267历史根，即使页面在3269，仍不是新候选业务根。新候选44件保护须单独由 return 的明确记录对照 P2 final，二者不混用。只审封件元数据，不访问 runtime/privatefreeze、profile、回访地址文件或凭据，不探端口或当前活实例。

## 3. 独立目视与原链串联

真实调用 `view_image` 目视 **6 件已存图/原帧**，不是运行浏览器。PNG/帧可见事实为裁决主证，RPC/rows/reader 仅补身份、顺序与保全，不能代 GUI。

| 本次已目视文件（均在 P1RestVisibleR2） | 可见事实与限定 |
| --- | --- |
| `round03-absence-rest-visible.png`、`frames/round03-rest-follow-2.jpg` | 原总览下部展开 rest 的 t22 行：完整项目名 **QA-G 仅缺席**、标签 **会话有结存 · 未跟进** 可读，普通“打开/静音”按钮可见。任务标题在图中为“仅…”；本轮不签完整标题展示，也不把 DOM 的全标题当可见文字 |
| `round03-expired-rest-visible.png`、`frames/round03-rest-follow-4.jpg` | t18 **导出后改名**、**QA-G 队列**、未开始、迟到2天、应10-21 的普通行完整入镜；**没有“已静音”标记**。“静音”是可执行按钮，不是已静音状态 |
| `round02-error-state.png` | 首轮错误后的真实原卡保留，积压8、顶部/下一 rest 行可见；不能由此错图签下部缺席/到期行 |
| `round04-returned-new-candidate.png` | 返回后的 PM 任务页真实画面，项目 QA-A-fixture-F5；与 origin3269 状态/实际 return outer 串联，只证明本次返回观察，不验新功能 |

**P1001 的 t21 不在，不由局部截图凭空证明。** 原已签唯一主 save RPC `de71b3bc-ae36-4ead-98ee-c55d8d9e3c96`、完整 snapshot、refresh/reload rows 已证明跟进后 t21 消失而 t22 留存。新 entry 真实只读 snapshot RPC `942e9ea4-2858-4cd7-b567-7378f4eb296d` 的完整六项目 queue 与原已签 `afterFollowup` 全同，p5 top=null、rest 唯一 t22/absent=true，全 queue 无 t21；新完整八行 rows 同样无 t21。结合全同原 final roots 与本次 t22 项目/标签可见图，闭合同一个原读出口的缺图，不要求让已跟进 t21 再出现或重存一次。

**P1002 只补视觉。** 原真实D=10/23、t18 mutedAt10/13＋7天、到期 muted=false 的命令正文与历史保全已签；新原 RPC 仍为 t18/导出后改名/muted=false。所有状态 `pmQueueMute`/task 指纹未变，本次图补足普通行/无已静音标记。不重 restore、session bind、save、open 或 TTL/mute。

本限定缺图剩余 **0**。原 P1006 的 FL/MAX 未采/未签边界仍沿原报告，本轮不审、不关闭、不增加新动作；小尺度图里的“同刻度 MAX 3”不是 FL/MAX 证据。

## 4. 真实执行记录与错误保留

Main 既有 outer 原件实核：entry **0**（34031→34032）、scroll **1**（34183→34184）、scrollfollow **0**（34279→34280）、return **0**（34352→34353）、seal **0**（34447→34448）。argv/start/end/父子PID/status/signal 均从原 start/receipt 回核，不由文件存在或 summary 推测终码。

首 scroll 找错标题“仅缺席不入评分”，随后 `.pm-queue-row:last-child` 不存在，真实 `assert(last)` 退出1；toggle 此时已展开，原错误及四帧保留。follow 仅找到现有“仅缺席任务”和“导出后改名”两行并 `scrollIntoView`，无重 toggle、重写库或保存；其 events 无命令请求。

entry 为正常3269→3267→原PM→总览；return 正常返回3269，真实只读 snapshot RPC `ad2817f9-946f-4612-bda0-8c9e5d18840a` 及保护记录保留。源码只作文本核对，未执行归档脚本。outer 绿不是 GUI PASS，首 locator 错误也不凭自身认作产品 FAIL。

## 5. 审计、封签与停止

环境 macOS/darwin、仓库根、现有 Node **v22.23.3**；未调用 pnpm/install/build/verify/Vitest/Git/fetch、产品、浏览器、桌面或 spawn。自有 reader 只 import 内置 fs/path/crypto/assert，仅写本前缀。语法和 capture 已实际 exit0；共冻结 **724 个明确输入**，含新710件、自排除原件、必要原签/合同/元数据及P2 final。

实际核验命令（macOS，仓库根，现有 nvm Node22；每条独立）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/p1-rest-visible-gui-review-20261023-r2-reader.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1-rest-visible-gui-review-20261023-r2-reader.mjs capture
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1-rest-visible-gui-review-20261023-r2-reader.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1-rest-visible-gui-review-20261023-r2-reader.mjs readback
```

[audit](p1-rest-visible-gui-review-20261023-r2-audit.json)、[verdict](p1-rest-visible-gui-review-20261023-r2-verdict.json)、[工具收据](p1-rest-visible-gui-review-20261023-r2-tool-receipts.json)、[seal](p1-rest-visible-gui-review-20261023-r2-seal.json)、[实际 seal 工具收据](p1-rest-visible-gui-review-20261023-r2-seal-outer-receipt.json)、[readback](p1-rest-visible-gui-review-20261023-r2-readback.json) 保存实际字节/结果；seal/readback 的实际终码以对应工具收据及最终回报为准，不预造执行成功。探索时 `rg` 不可用（127），已用只读文件定位，不是产品失败。

**STOP/released：只释放本独立子单前缀写面；没有 builder/GUI/桌面/端口/业务根锁或后台产品进程。Main 继续原父工作，本报告不签父 commit。**
