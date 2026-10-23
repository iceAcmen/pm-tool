# 本单设施记录

日期2026-10-23，平台trae。本文件保留失败/未收终码，不用于产品或独立 PASS。

- `rg` 初次探索 exit127：`/bin/bash: rg: command not found`；使用 grep/find 定向替代。
- 指定 `/user_profile.md` 和项目记忆入口不存在，cat exit1；以实际仓库合同为准，不扩大查找。
- 包顶层 `node_modules/jsdom`、`react-dom` 不存在，定向 ls exit1；已有 `.tmp/widget-poc/node_modules` 只读 DOM 依赖可用，不安装、不写该目录。
- 首 `runner.mjs capture` 工具 executionID=`b7a07ef0436e86cabe0d358b29c2f8de`。设置短 yield 返回执行ID，当前可见工具不能按该字符串收尾，**终码 NOT_COLLECTED**，不写 exit0。自有 node PID98175、父shell98173，argv 明确为本单 capture。
- 首版 `inputs()` 对 `docs/testing` 递归，误纳入其历史 selftmp/frozen 目录的只读字节扫描与软链元数据，不是授权的顶层合同保护范围。另一次 `find docs/testing -type l` 也列出该历史目录元数据；没有写入这些目录。停止继续此扫描，不声称这次探索完全未读取历史临时目录。
- `kill -TERM 98175` 实际 exit0，仅停止上述自有 capture，不停止 Main/正式/隔离宿主；不从 kill 成功推造 capture 终码。未完成 baseline 不用作产品绑定。
- 首版已生成 `git-baseline-receipt.json`（包含真实 Git read-only 子进程退出码和完整 dirty 清单），保留不覆盖。首自有 `/tmp` 保留，不删。
- runner 修正为只保护 `testing` 顶层普通文件，并以新 `capture-r2` 重建有效 baseline；之后隔离测试及收据以 r2 为准。未改测试 oracle 或任何产品源码。

首捕获相关的 ls baseline 不存在 exit1、ls首Git收据 exit0、定向进程列表 exit0，均仅设施观测。后续实际测试终码见各 stage receipt，不将文件存在、执行ID或脚本自述等同工具终码。
