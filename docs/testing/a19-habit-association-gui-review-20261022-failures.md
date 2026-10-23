# A19 GUI 审证自有检查器失败记录

> 2026-10-22，trae，独立审证。只记录本前缀文件审计器的原失败与最小更正，不改采证原件、产品或其他专家结果。

## 首次 Freeze

命令：`/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-association-gui-review-20261022-audit.mjs freeze`。

原退出码 **1**，尚未生成 `-before.json`。原错误：

```text
AssertionError [ERR_ASSERTION]: unexpected link /Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/a19-habit-suggestion-okr-contract-20261022-selftmp/r1/frozen/node_modules
```

原因：自有检查器将旧专家完整临时树当作普通证据目录枚举，碰到既有依赖软链；未跟随软链、未写共享依赖、未执行产品测试。最小更正：旧专家树只保护其报告、回执、manifest、原红/复验原件，排除 `dependencies/frozen/cache/home/tmp/runtime` 子目录；新 A19 和旧 A18 的已声明完整源码/产物仍分别保护。本次起步只读未受后续 freeze 覆盖，不追溯声称全程零漂移。

后续自有原失败由审计器另存本前缀 `-failure-*.json`，保错误、当时脚本 SHA、已完成检查与原退出 1；任何更正均只改本前缀检查器。

## 后续 Audit 与 Supplement

| 自有原失败 | 原结果 / 最小更正 |
| --- | --- |
| [首 audit](a19-habit-association-gui-review-20261022-failure-audit-1792635304727.json) | exit1，前三条文件检查成立后，ANSI 彩色 stdout 干扰纯文本正则；用 Node 内建 `stripVTControlCharacters` 核原计数，stdout 原件不改。完整 loader 规范化按既有末尾换行/分号协议明确，不裁短段 |
| [首 supplement](a19-habit-association-gui-review-20261022-failure-supplement-1792635478184.json) | exit1，误设帧 metadata.timestamp 随原编号必单调；读取全部325帧发现两处约11ms倒序，另核原 frame来源/全名单/SHA并显式保留两对，未重排或重采 |
| [再次 supplement](a19-habit-association-gui-review-20261022-failure-supplement-1792635527015.json) | exit1，帧/最终回执/处理字段前三条补核成立，过宽源码前缀把已签props类型细化当旧卡变化；缩为原 `.pm-habit-list` 记录卡渲染块逐字比较，完整CSS仍全SHA相同 |

最终有效 audit exit0、18/18文件检查；supplement exit0、5/5；freeze/visual/语法/diff及终seal按最终原件记录。原四次设施失败均保留，未修改任何旧报告、原测试期望、产品、fixture或采证文件。不存在“修自有检查器后重新把旧报告签绿”的动作。
