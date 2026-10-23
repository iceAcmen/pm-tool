# P2004 SOURCE/AUTO R1 设施与首失败保真

2026-10-23，trae，独立 SOURCE/AUTO 专家。设施事实不是产品 FAIL，也不由后续成功覆盖。

## 开发原件

- 首 capture executionID=`b7a07ef0436e86cabe0d358b29c2f8de`，终码 `NOT_COLLECTED`。原开发记录仅核自身 PID98175 后 TERM；未完成 capture 不作候选依据。其误递归读取 testing 历史 selftmp/frozen 已停止。本角色不执行原 runner、不访问原临时副本、不重扫该目录。
- 有效 capture-r2、vendor、RED/GREEN/affected、seal 以原同步收据及字节为证；不把开发 8/8、59/59 或 seal 的 satisfied 自签为独立验收。
- 原报告的其他 GUI 首失败、未收终码不在本单重跑，不抹除。原 testing 与原日志全部只读。

## 本角色实际设施

- `rg` 不存在：exit127，正文 `/bin/bash: rg: command not found`，转定向 `ls`/`sed`/Node 结构化读取。
- 两个指定 memory 入口不存在：`ls` exit1；不扩大搜索，以仓库为准。
- 首目录探索 `ls docs/plans/*p2004* docs/testing/*p2004*` exit1，原因当时没有本前缀 testing 文件；已有开发文件正常列出。
- 可选 `CODING_STANDARDS.md`、`CONTRIBUTING.md` 不存在：`ls` exit1。使用 AGENTS、协作规则和原合同，不安装或补写标准。
- 初始只读 `git status --short` exit0，输出过大；没有执行任何 Git 写，也没有 fetch/pull/commit/push。后续候选认领以实际 source/test SHA、开发封存和本隔离输入，不凭初始 status 或 HEAD。
- 首 audit 使用短等待返回 executionID=`8efd0b0f7e3cf6197388b017f4c3eaff`，工具给字符串而可见 poll schema 要求数值。可用工具查询未提供适配 polling，本轮不臆造 session ID。**audit 外层终码 NOT_COLLECTED**；随后定向 `ps ... | grep '[p]2004-kr-related-source-auto-20261023-r1-runner.mjs'` exit1，无匹配进程。audit 原产物和 vendor 同步 child exit0 可逐字节复核，但不由此倒推外层 exit0。
- 之后 RED/AUTO 均使用 30000ms 等待，收到了真实外层终码；子命令另外同步保存在独立 receipt。

## AUTO 首外层失败

Vitest child **exit0 / 19通过**，源码、oracle、隔离 source、借用依赖没有变化。原外层 **exit1**：

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

1 !== 0

    at file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/p2004-kr-related-source-auto-20261023-r1-runner.mjs:214:10
    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:681:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

actual: 1
expected: 0
operator: strictEqual
Node.js v22.23.3
```

原 `auto-protection.json` 唯一差分为非自有 `docs/progress.md`：

| 时点 | bytes | SHA256 |
| --- | --- | --- |
| AUTO前 | 133004 | `994ba598c9d0a50193868b59979f9ad3cc376ae7576f5be44b08894f734cfa43` |
| AUTO后 | 133667 | `5498b1f9d503521f17ab1305402326385c88492c0427db567b35b017241e918e` |

只读回看文件顶部，新增 Main 06:11 接续、F7/P2002等状态。该文件未进入 Vitest 所选 source/oracle，不使本两源有限结论失效。不能声称全保护零变化或由本角色证明每个并发写者身份。

保留首失败、原产物与外层1，不再次运行 AUTO。只调整**自有 seal 的保护分类**：源及依赖声明差分须0；已经审明的非自有文档并发变化逐项列出，不还原、不认领、不豁免未来产品变化。没有更改产品、test oracle、测试配置或重跑凑绿。

本角色只新增指定 testing 前缀及 `/tmp/pm-p2004-source-auto-r1-hY4mqH`；未扫描 testing 子目录、privatefreeze/runtime/业务根/凭据。保护观察是前后快照，不声称全盘、全时、正式业务根零污染。未启动或停止服务，未操作 GUI。
