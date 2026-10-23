# 副驾错误前缀独立 SOURCE/AUTO 复验 R1

**Goal:** 独立确认 S112-PREFIX-01 两行业务窄修符合原全文合同，复跑原五例、开发列明的 17 文件 affected-250 与原配置 noEmit。

**Architecture:** 新冻结完整 521 输入，沿开发已释放依赖普通独占复制；不执行旧 executor，不改变组件、测试或 fixture。独立审源码 exact 差异和测试迁移，保留先行 R2 的 2 绿 3 红原件。

**Tech Stack:** macOS/bash、既有 Node v22.23.3、pnpm 11.28.5 依赖产物、Vitest 2.1.9、React 18.3.1。本轮不调用 pnpm。

## 授权与角色

负责人原句（保留）：

> 你不同独立SOURCE/AUTO复验，非开发非GUI，只docs/testing/copilot-error-prefix-independent-retest-20261022-r1*与reports/all-pending-evidence-20261021/CopilotPrefixRetestR1/selftmp。父持续多角色授权闭全部/确证修/最后ordinarycommit，子单不再审批。
>
> 独立先行-r2真实五case2green3red保，修后正式5全文ORACLE相同；不修改产品/旧test/其他testing/livingdocs、不build/install/browser/service/key/vendor/Git。只复制新自有freeze完整输入521+launcher ifneeded/独占depscopy开发已释放13579/1030，核bytes/inode/内链。
>
> 独立真正复跑原5和开发列明affected250集合、noEmit，完整commands/PID/status/stdout/stderr/warnings/原件保护/close/seal明确；允许额外只必要源码逆向验证这两行exact，不替fixtures归档classifier，原testfixture403byte全同。no sharedlib writes/no newfullbundle。
>
> 本次onlySOURCE/AUTO limited not GUI/B8/RAAI06/parentcommit，不重复旧112整回归。Main唯一GUI当前3263old112原F2OP，p3仅Main；你审后releaseSTOP交Main后继builder/GUI。主其他并行live docs允许，不锁/判pollution。失败只修自有设施、必要产品新缺陷交Main不自行修。

依据：已通读 AGENTS、collaboration §9/§11、父 closure 计划、开发 R1 plan/report/runner/seal 和先行独立 R2 plan/report/五例/observations。新授权限定通用 SOP，不 fetch/pull、install/build、Git、全回归或 livingdocs；不重复申请子单审批。

本角色不同于开发，仅本次 SOURCE/AUTO 判定。父 ordinarycommit 属 Main 全部门闭环后的动作。Main 的 3263、EGO p3 和其他并行 livingdocs 不锁、不探测或操作。

## 文件与资源

- 唯一文档写面：`docs/testing/copilot-error-prefix-independent-retest-20261022-r1*`。
- 唯一证据根：`reports/all-pending-evidence-20261021/CopilotPrefixRetestR1/`。
- 唯一新 selftmp：`/private/tmp/pmtool-copilot-prefix-independent-retest-20261022-r1`。
- 只读开发冻结：`/private/tmp/pmtool-copilot-prefix-dev-20261022-r1/packages/dsh-pm-tool`。
- 只读旧 112 冻结：`/private/tmp/pmtool-combined-successor112-20261022-r1/packages/dsh-pm-tool`。
- 认领 114 中的 15 launcher 只校字节，无本轮 launcher 用例，不必复制/执行。
- 不加载或校验 vendor，不运行 installer、外部 skill 或其命令。已读 brainstorming/writing-plans，仅沿获批设计使用执行计划纪律，不创建新功能方案、worktree 或 commit。

## 执行步骤

1. 核开发 seal 全部 evidence/ownDocs、基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`、声明 114 和输入 521；反推旧 112 仅替换 sidecar hash 和新增两文件。逐字核 sidecar 仅 helper import/catch 两处替换、测试仅 fixture 相对加载/observations 可选，403-byte fixture 全同；原 R2 全文 oracle 不改。
2. 保存主包输入/共享 lib、旧 112 全输入/lib/deps、开发冻结输入/deps、原前缀测试与开发证据/父认领原件/15 launcher 的内容指纹。Main livingdocs 不纳入锁定资产；不扫描业务数据、密钥、服务或全盘。
3. 新冻结 521，复制开发已释放的 13579 依赖文件/1030 软链，逐文件 bytes/SHA/inode、逐软链归属检查；所有 HOME/TMP/XDG 写根置于 selftmp，无缓存、singleFork、无外部网络。
4. 独立直接 Node 执行冻结 Vitest：正式五例、exact 17 文件 affected 集合；再以原 tsconfig 执行 `tsc -p tsconfig.json --noEmit --incremental false`。记录完整 argv/cwd/env、父子 PID、起止、status/signal/stdout/stderr。不开 full bundle、不重跑旧 112 全量。
5. 独立解析结果与完整 observations，比对先行 R2 五例 ID/input/expected/recovered/calls/writes，核修后 actual 全文等 expected、无写命令/onSaved、解锁/占位清除。核 17 文件所有实际 assertion 与开发列明 affected 集合相同；noEmit 只签原配置排除 tests 的边界。
6. close 再核所有保护对象/冻结/依赖/config/无 lib/子 PID 已退出；独立给有限结论，报告 warnings 和未签 GUI 等边界；seal 绑定计划/runner/report、完整输入、114 声明、原件保护及实际执行证据，released/STOP 交 Main。

## 命令与停止条件

仓库根、macOS/bash、既有 Node22 二进制：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/copilot-error-prefix-independent-retest-20261022-r1-runner.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/copilot-error-prefix-independent-retest-20261022-r1-runner.mjs execute
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/copilot-error-prefix-independent-retest-20261022-r1-runner.mjs seal
```

设施失败完整保留，只修自有设施并另存重试；产品 FAIL 不自修，交 Main。外链/共享 inode、声明漂移、超两行或 oracle 变化停止本门，不签 PASS。有限 SOURCE/AUTO 不签新 GUI、B8、RA-AI06、取消/realmodel、父 goal/commit；Main 唯一后继 builder/GUI 按新候选继续。

## 检查点

- [x] 授权、合同、开发认领和原 R2 五例读取完成。
- [x] 精确源码/原件审计及新冻结完成（freeze PID7183/status0，13579/1030、差异/共享 inode/外链均0）。
- [x] 原五例 5/5（PID7321）、affected 250/250（PID7341）、noEmit（PID7405）独立执行完成，均 status0/signal null。
- [x] close（PID7443/status0）、有限独立判定与报告完成，released/STOP。

封存出口以实际 `handoff-seal.json`、seal 工具退出码及封后 SHA 核验为完成证据；不由本检查点预判。Main 接续唯一后继 builder/GUI。
