# A3 独立复验执行清单

2026-10-21，trae 独立测试专家。父任务见 `reports/all-pending-acceptance-execution-20261021.md`；本轮授权只写本前缀与自有 tmp，不开发，不提交。最新派单对 pull/install/build/产品服务/正式 profile/私有 runtime/凭据/Main GUI 的禁止优先于通用开工流程。

## 候选与合同

- A3 `candidate.json` 的23源、tracked.patch、主树/Main隔离树/专家完整 launcher 副本一致；453插件产物沿A0，只读比对，不新签插件功能。
- A2 报告与 mapping-plan 为先行测试依据，保留旧 FAIL，不覆写他人原件。
- ordinary tab 为此次明确行为修订；显式 appWindow 保留，Chrome 显示名与 Google Chrome 应用名分离。等待 Promise、异步失败和调用接线须单独审查。
- HTTP fixture 使用自有临时端口；新 headless Chrome 使用自有配置，禁止连接既有 profile/CDP。OS投递仅模拟 spawn，不执行 macOS open，不路由个人浏览器。

## 执行状态

| 步骤 | 状态 | 验证 |
| --- | --- | --- |
| 规则、父分工、A2合同与源码读取 | 已完成 | AGENTS、collaboration §9/11、A2报告/mapping-plan |
| 候选、副本、patch、453产物身份 | 已完成 | 各轮前后23源/完整launcher/453产物一致 |
| 原测试受影响回归 | 已完成，局部PASS | 53/53、DOM7/7、原8/8、A2 additional9/9、followup实际10/10 |
| 新独立负例 | 已完成，FAIL两项 | 有界错误/超时/安全局部PASS；在途浏览器归属与旧S4沿用确证 |
| Main加载/菜单原证只读复核 | 已完成，局部PASS | 唯一插件执行段匹配；仅当前菜单100%；首次3212流程按新增原证有限审查 |
| 收尾身份和有限报告 | 已完成 | final-result零变化，自有Chrome退出；报告只写本前缀，不签全门 |

## 负例判据

1. 已等待的偏好失败后 latest 重试一次；持续失败只显示就近 alert，不 open，不无限写；新选择/后续用户动作可恢复。503、网络断开和真实35s偏好超时分别探测。
2. 生产 `browser-open` 捕获 spawn throw/error、非零/信号退出、5s真实超时，错误不含合成敏感标记，迟到结果不重投或重抛。
3. app 必须消费真实模块 Promise；owned 首投失败/超时在 finally 弃 URL，失败撤销 nonce，取消后的旧结果不得倒灌。正常回告先到S4后 exit0不得降S3；reopen亦同。
4. 生产bin静态核实际import/调用，不执行入口。安全probe仅对专家自己的loopback执行，Origin/Host/nonce/replay，不碰3211/3212。

执行记录由本前缀 runner、日志与结果JSON给出；外层归档成功不等子测试通过。完整OS收页、Finder启动、实际认证S4和全batchA仍由Main采证、另审。
