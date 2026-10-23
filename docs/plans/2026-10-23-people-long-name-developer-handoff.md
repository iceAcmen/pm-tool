# 人员长姓名开发交接

2026-10-23，trae，唯一人员开发。本轮仅源修复封交，不是人员功能完成或独立 PASS。父 Main 唯一合建/GUI/desktop/git，后继任务/FDaxis专家仍独立。

## 修复与边界

- 唯一源码 delta：`packages/dsh-pm-tool/src/client/views/people.css:74` 的 `.pm-pp-root .pp-name` 增 `min-width: 0; overflow: hidden; text-overflow: ellipsis;`，单处替换、净增57字节。
- 保留原 `white-space: nowrap`，沿用现有 who/who-txt 的收缩和≤560 flex规则；不改行、列、头像、负载条、OPEN、日期、状态、事件或 responsive 断点。
- 姓名已有独立 span，`people.tsx`未改。原 `{row.display}` 不截断，原按钮可访问名称来源不变；这不是已执行的可访问树/GUI证明。
- 新文档仅本计划/交接；不写 testing/livingdocs/taskpanel。未 fetch/install/整build/GUI/服务/lib/正式/git；无业务写。Main普通commit授权未转成本角色Git授权。

| 对象 | 修改前 → 修改后 SHA-256 | 字节 |
| --- | --- | ---: |
| people.css | `60925a4083ce8740b610c7949038bafda823fe48b483a55d3e3f16d1163514ba` → `8665e0874b0995a77bcd119fbcd892eaeb853593ce4014bce33100d270a995f4` | 14009 → 14066 |
| people.tsx | `e41ab4ec75a04b47fef95595cfde2bc1e915a319ce81ccba6cc99885259ac6a6`，前后相同 | 26112 |

基线提交由Main已有候选登记认领，本角色未运行Git；旧 CombinedF02RepairR2 baseline `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 只引用，不冒充当前HEAD。首读Main声明126/527、旧124/525不当全树实核，task后继test不属于本delta。主树其他改动/全包source/cache/lib身份由Main核，本角色只核owned两源，不对nonowned状态背书。

## 实际验证

环境：macOS，既有 Node v22.23.3 / Vitest2.1.9；没有安装。以下真UTC起止、PID、实际退出、完整stdout/stderr均在自有 `/tmp/people-long-name-developer-20261023/*.json`。

| 项 | 开始 → 结束 UTC | 实际结果 |
| --- | --- | --- |
| 源认领 before | 02:48:26.034 → 02:48:26.042 | 两源字节/SHA实核 |
| vendor静态 | 02:48:26.022 → 02:48:26.142 | status0，注册vendor13+23全指纹相同；不替独立门 |
| 修改区间检查点 | 02:49:51.515 → 02:50:16.695 | 一处CSS，非apply工具内部精确耗时 |
| 人员负载/刻度回归 | 02:51:28.428 → 02:51:30.045 | status0，2文件5用例通过 |
| owned源两轴自查 | 02:51:29.275 → 02:51:29.385 | status0；diff1原文保留（有差异），TSX不变 |

可复制命令（cwd=`/Users/bytedance/Projects/dsh-pm/pm-tool`，macOS）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
/usr/bin/env HOME=/tmp/people-long-name-developer-20261023/home TMPDIR=/tmp/people-long-name-developer-20261023/tmp XDG_CACHE_HOME=/tmp/people-long-name-developer-20261023/cache /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/node_modules/vitest/vitest.mjs run --config /tmp/people-long-name-developer-20261023/vitest.config.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-long-name-developer-20261023/review.mjs
```

回归范围：wrapped不进open；刻度下限/未分配驱动/过滤不缩尺/2倍数+2。未找到既有PeopleView组件测试（grep1），不写低价值镜像测试。CSS-only未跑type；未跑完整verify/全包测试/GUI。Main封候选后合建全回归；专家决定 SOURCE/AUTO 可否继承，开发不判。

设施原状：rg127不存在，改find/grep；指定memory入口ls1不存在；前期工具只给耗时，未造起止；livingdocs初读输出过宽已收窄。Vitest stderr原保留 `cache.dir is deprecated`，未失去自有cacheDir隔离。测试无失败，警告不洗掉。code-review已校vendor后按standards/spec自查：局部现有样式/token合约不变，无新接口/事件；未用其setup/git/子代理步骤，不冒充独立审源。

## 封件与停止

自有runner：`/tmp/people-long-name-developer-20261023-runner.mjs`。seal包含owned源/2文档、前后认领、原差异/命令收据、runner/隔离配置，字节与SHA逐件核，不写镜像产品测试。`seal.json`不表示验收；`readback.json`由父runner启动独立check子进程写真实status/PID/stdout/stderr后再次回读。状态只在该收据实际0时为 **STOP / released**，无预填PASS。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-long-name-developer-20261023-runner.mjs seal
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/people-long-name-developer-20261023-runner.mjs readback
```

Main后续：独立审本owned delta与task源 → 唯一一次合build全部回归 → 原F1/FL dark1440×900/CSS100及真实MAX10图轴补缺、原FD四viewport受影响复验 → 专家审签。旧有限GUI不自动继承；不重旧确证坏图。

最后Main补充的FDaxis595件、dist x1581/宽149、外壳client1155/scroll3637为**nonowned Main观察**，不是本开发/独立专家确证。本轮不改gantt/dist；先封释放本姓名槽。尚在审的追加合同不加载、不实施；如合同有效，Main须顺序重新认领同文件后另修。不签PASS，不续新功能/push/release/正式切。
