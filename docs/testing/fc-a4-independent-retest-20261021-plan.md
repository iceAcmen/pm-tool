# A4 独立复验计划

> 给 Main 与独立测试专家使用：按本清单复跑 A4 修复及受影响范围，只签实际 AUTO，不替 Finder/真实认证门签字。

2026-10-21，trae，独立测试专家。依据负责人本轮原句、`reports/all-pending-acceptance-execution-20261021.md`、AGENTS、collaboration §9/11、A3 报告。

## 授权与边界

- 只写 `docs/testing/fc-a4-independent-retest-20261021*` 与自有 tmp。
- 不改产品、他人 testing、living docs；不 build/install/pull、启产品服务、操作正式 profile、commit/push。
- 不读 runtime/private/凭据，不操作或连接 Main GUI/个人浏览器。
- Main 唯一 builder/GUI 执行端。只读允许的 A4 manifest/patch/作者日志；不把作者绿当独立绿。
- 复制 launcher src/test/bin/package 及 23 认领文件；仅链接既有依赖。独立 headless Chrome 和临时 loopback fixture，不运行 macOS open 或 dsh。
- 写根为自有 tmp、A4 前缀原证；TMPDIR/TMP/TEMP 指向自有 tmp。没有全盘保护监测，不声明全盘零污染。

## 清单

1. 已核：A4 candidate、tracked patch、主树/隔离树/专家副本23源、完整launcher、453产物；各轮前后零变化。
2. 已跑：原 package 九文件55/55、生产 control DOM7/7、专家原8/8。
3. 已跑：A2两原件9/9 + 实际10/10，保原期望与实际35s。
4. 已跑：最终A3 probes原件13/13，原红条件绿，保真实5s/35s。
5. 已跑：probe/start/三类OS await归属和下一轮偏好，局部PASS。
6. 已跑：旧S4各路、nonce/Origin/关闭/超时；发现当前早到S4后OS失败覆盖S6/true。首轮24/25，补验24/26，同根因FC-A4-01。
7. 已审：作者红/绿原证与JSDoc；不以作者结果替独立结论，未改产品。
8. 已收尾：命令结束、日志可识别自有Chrome PID已退出、原件未改；有限AUTO FAIL与最小采证建议见本轮报告。旧A3历史不改签。

## 产物与命令

- 新增本计划、`-run.mjs`、`-probes.test.mjs`、逐轮 `-result.json`/`.txt`、最终报告 `.md`。
- 环境 macOS + Node22；无安装/构建。仓库根运行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a4-independent-retest-20261021-run.mjs initial
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a4-independent-retest-20261021-run.mjs a2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a4-independent-retest-20261021-run.mjs a3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a4-independent-retest-20261021-run.mjs probes
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a4-independent-retest-20261021-run.mjs probes-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a4-independent-retest-20261021-run.mjs final
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a4-independent-retest-20261021-evidence-check.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/fc-a4-independent-retest-20261021-evidence-check.mjs r2
```

每轮拒绝覆盖旧原证。状态随实际执行写入本轮结果，不预签 PASS。
