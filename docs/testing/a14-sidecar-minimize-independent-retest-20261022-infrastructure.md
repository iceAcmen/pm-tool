# SM01 独立复验设施与失败保留

2026-10-22，平台 trae。本文件不重写原专家或产品结果。

| 动作 | 完整调用（executable均为 `/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`） | 原退出码/观察 |
| --- | --- | --- |
| runner语法检查 | `--check docs/testing/a14-sidecar-minimize-independent-retest-20261022-run.mjs` | 0 |
| 首次prepare | `docs/testing/a14-sidecar-minimize-independent-retest-20261022-run.mjs r1 prepare` | 工具返回execution ID `13bab3a08da232464019e4e08d2e5889`，末态未采得，`NOT_CAPTURED`；scopes/候选/原证已完成且finalize复核0 |
| 首次SOURCE审查 | `docs/testing/a14-sidecar-minimize-independent-retest-20261022-source-audit.mjs r1` | 1，`AssertionError [ERR_ASSERTION]: CSS-no-other-sidecar-display-override` |
| 自有文件move | apply_patch把首轮源码移为 `*-source-audit-r1.mjs` | 首次空hunk被拒；第二次工具显示move成功，但回读旧/新路径均不存在。非产品/原专家文件；不把工具提示当文件已生效 |
| adapter首次 | `docs/testing/a14-sidecar-minimize-independent-retest-20261022-source-audit-r2.mjs r1` | 1，`Error: ENOENT: no such file or directory, open '.../a14-sidecar-minimize-independent-retest-20261022-source-audit-r1.mjs'`，零审证 |
| 自有首轮源码恢复 | apply_patch新增 `*-source-audit-r1.mjs` | 从本次初始patch完整重建失败代码；不修改原专家测试、产品或旧冻结 |
| adapter最终 | `docs/testing/a14-sidecar-minimize-independent-retest-20261022-source-audit-r2.mjs r1` | 0；生成新subject，仅机械替换选择器筛选一处；diff/完整argv/stderr/12校验保留 |
| 首轮失败重现并归档 | delivery脚本执行 `*-source-audit-r1.mjs r1` | 实际退出码与原始stdout/stderr/command存入本次selftmp；不覆盖原失败代码 |

CSS首轮设施把 `.pm-sidecar-chrome`、`.pm-sidecar-actions`、`.pm-sidecar-tab` 也纳入“aside display不得被覆盖”的清单，超出了aside对象。最终使用 `.pm-sidecar(?![\w-])` 区分完整class名；PostCSS仍解析全部CSS。aside hidden=display:none、fixed、display:flex与重要性/优先级合同未放宽，产品CSS未改。

新原A03失败不是这一设施问题：原专家测试L229保存ReactTestInstance，L233切模式卸载checkbox，L235读props异常，exit1保持。适配仅在原采样时点冻结props；原字节旧三红、新原A03设施失败及适配旧三红/新三绿均独立实际运行并保留。

TaskTable原缺key警告在stderr保留，未扩范围修产品。终端缺`rg`后使用grep/find；未安装工具。没有GUI、服务、凭据、RPC、build/install/commit，也未清理任何在途成果。
