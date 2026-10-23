# 首次自有装载审计设施失败记录

> 独立专家保留本轮审计设施失败；不是产品失败，不替代或覆盖 Main 原证/必要红日志。

环境 macOS、Node v22.23.3，仓库根目录执行：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/cycle-feedback-reason-20261022-audit.mjs
```

原退出码 **1**；工具原始输出关键行：

```text
AssertionError [ERR_ASSERTION]: 完整生产执行段须唯一匹配
    at file:///Users/bytedance/Projects/dsh-pm/pm-tool/docs/testing/cycle-feedback-reason-20261022-audit.mjs:54:1
actual: false
expected: true
operator: '=='
Node.js v22.23.3
```

首次自有实现把去映射注释后的 client 追加 `\n;`，而原 client 已有末尾 LF，实际宿主装载是 LF + 分号 + LF；多出换行导致完整段不匹配。失败发生前 230 文件、27 execution/6失败、49 observation/102声明核对未抛错；不能因此签它们的全部行为或 GUI。

只改本前缀审计：仅去**末尾** sourceMappingURL 注释，trimEnd 后补 `\n;\n`，完整生产正文不动；不修改 loaded 原件、旧 R1/R2 数值、产品或测试 oracle。后续成功结果另存 `cycle-feedback-reason-20261022-audit.json`，本失败保留。必要红 exit1 两产品缺陷独立存在，未重跑或改写。
