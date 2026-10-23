# 六修 L2 GUI 审证命令与失败账

2026-10-23，trae，独立 GUI 审证者。只记录本角色实际动作，不改 Main 原失败，不重执行产品或 GUI。

## 实际环境与边界

- macOS / bash / 仓库根；`node --version` 返回 `v22.23.3`。正式审计使用 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`。
- 唯一手写脚本为 `/tmp/six-repairs-l2-gui-review-20261023-r1-reader.mjs`，内置 fs/path/crypto/util。手写文件用 apply_patch；JSON 为该 reader 生成，`flag: wx` 拒绝覆盖原输出。
- Main 脚本和产品源码只当原件被动阅读/哈希；没有 import/执行产品、Main 采证器/assert、浏览器、build/install、网络、服务或凭据；没有 spawn 子角色。
- **操作偏差如实保留：起步误执行一次 `git status --short`，真实 exit0。** 本单禁止 Git，该只读探索不应发生；之后停止一切 Git 动作。没有 fetch/pull/commit/push/tag 或任何 Git 写入，未清理 dirty。这不是产品测试、父出口或 ordinarycommit 授权。

## Reader 与真实结果

以下 cwd 均为 `/Users/bytedance/Projects/dsh-pm/pm-tool`，不是要求 Main 重放。

| 命令 | 实际结果 |
| --- | --- |
| `node --version` | exit0，v22.23.3 |
| `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check /tmp/six-repairs-l2-gui-review-20261023-r1-reader.mjs`（首版） | exit0 |
| 同 Node + reader `capture`（首次） | exit1，`ENOENT .../SixRepairsGuiR1/raw-root-transitions.json`；首版错误假设全1507都是Main同名原件，没有生成审计JSON；原工具末码及错误已实际看到 |
| 同 Node + reader `capture`（第二次） | exit1，1437检查中6个DOM空白比较false；[原审计](six-repairs-l2-gui-review-20261023-r1-audit.json)完整保留，不计产品FAIL |
| 同 Node + reader `capture-r2` | **真实工具末码exit0**；1437检查、errors=[]、21组RPC、403帧SHA、3552去重输入；[有效审计](six-repairs-l2-gui-review-20261023-r1-audit-r2.json) |
| 最终同 Node + reader `--check` / `seal` | 实际结果见本任务终封及工具末码；封签仅核输入/输出保护，不代GUI裁定 |

第二次 capture 返回字符串 execution ID `240262309fe835b189d2d7df343908b5`，不能传给整数 session_id 的轮询工具，未伪造 poll。仅读本角色工具目录 `execution.json`，确认 `pid=11263, status=exited, exitCode=1, outputComplete=true`。不以审计文件存在或子结果倒推 outer0。capture-r2 在等待窗口内实际返回 exit0，不需要推测终码。Main seal 的外层终端仍为 **NOT_COLLECTED**，只认其封存自收据 exit0。

## Reader 纠正与保留

1. Main复制关系的首次假设过宽：1496件确有Main同名原件；11件为本包派生控制件（raw-root-transitions、old-f5-protection-after、execution-summary）及8件冻结源码。对1496逐字节比；对8源码比候选输入；对两个对账件按实际roots/raw重算。不以摘要自判。
2. 首版有效输出的6个false只发生在DOM可见文本：宿主按空白折叠展示第一行双空格，RPC/raw/composer保持原双空格、三行和标记。r2仅对DOM可见性作空白归一，literal校验仍在RPC/raw/composer；不修改原文本或降掉材料保真断言。
3. 未执行的准备脚本纠正：核JSON真实结构后，将自有代码中的假定 `extraTables` / `web/client.js` 改为实际 `extra` / `client.js`。这两个假定尚未运行，不伪造为产品失败或已跑失败测试。

## 只读探索末码

- `pwd`、cat/head/sed/find、Node内置读JSON与PNG头、grep匹配及本角色工具metadata读取均已结束，已观察末码为0。
- `rg` 不存在，真实exit127；随后用grep/Node。指定两个memory路径不存在、首次确认两个自有输出尚不存在的ls均exit1。
- 两次早期Node事件枚举误假设所有轮次都有events文件，分别在 `round03-events.json` 和 `round05-events.json` 不存在处exit1；之后按索引枚举实际文件，不补造这些轮次事件。
- collaboration 的超出文件行数sed返回空、exit0；换到实际章节读取。raw目录首次maxdepth3返回空、exit0；按索引发现实际数据路径更深，不把空输出当原件缺失。
- 工具发现查询只查可用工具元数据，没有调用网络、浏览器、视频生成或子角色。
- 目视通过 view_image 读取已存原PNG/frames，无桌面/浏览器执行。完整原件清单与结果在[报告](six-repairs-l2-gui-review-20261023-r1-report.md)。

**产品/GUI重执行 NOT_RUN；已完成的是独立原证审查。** 原Main失败、两次reader失败、全部旧testing/封件均未覆盖。released / STOP；不派已证动作，不暂停Main父goal。
