# P1005 反思入口独立 SOURCE/AUTO 执行计划

**目标：** 独立核验 P1L2-F01 修复，不扩签原 GUI、P1005 整项或父 ordinary commit。

**架构：** 内置 fs/path/crypto reader 独立核开发 seal、源码 delta 和证据字节；自有 runner 在新 /tmp 复制同源输入，生产 handler/真实 Cordis/Storage/DomainFacility/JsonStorageBackend 执行独立断言。node_modules 仅依赖读链接，配置、缓存、HOME、输出全隔离。

**环境：** macOS、现有 nvm Node 22.23.3、Vitest 2.1.9；无 pnpm/install/build/noEmit/全 verify/GUI/服务/Git。

## 授权与停止条件

- 负责人原句：“独立SOURCE/AUTO测试专家，非开发/GUI，限定P1L2-F01。”
- 负责人原句：“内置reader独立核seal2858及dirtydelta、输入源码指纹、最小权限/兼容/source ID/未知ID/empty/明确final/非目标零写”。
- 负责人原句：“自己的runner禁止执行开发runner/脚本或mirrorhelper断言代验证。”
- 仅新增 `docs/testing/p1005-reflect-entry-source-auto-20261023-r1*` 和自有 `/tmp`。不改原 testing/plans/证据/livingdocs、产品或上游；Main 唯一 builder/GUI。
- 依据：AGENTS、collaboration §9/11、原 `p1-l2-events-gui-review-20261023-r1.md` §4.1、原 P1 design §四、开发 event-reflect-entry 交接。
- SOURCE/AUTO 审结并 seal 后 released/STOP；不 ordinarycommit、不 push/release。
- writing-plans 通用 worktree/提交/再次确认及 docs/plans 写面不适用本明确角色；不调用不存在的 superpowers 子技能。

## 检查点

1. 新增本计划、自有 `-runner.mjs`、`-independent.test.ts`。reader 核 seal 的 2858 个 /tmp 字节和 6 个仓库交付件；核自身两个源码 delta、当前声明输入漂移、原有效红及设施失败的区别。不会执行开发 runner 或原脚本。
2. runner `prepare`：创建唯一新 /tmp，捕获源码和指定文档指纹、依赖实际路径/字节、Node、隔离配置；复制 core 和必要 command 输入，不包含 lib/index/GUI 模块；只链接现有依赖。设施缺依赖先隔离适配，不 install。
3. runner `independent`：生产增改合法实体产生三种真实草稿（事件无 taskId），实际 handler 覆盖完整正文/JSON、来源和精准定位、同库两事件 edit/final/repeat/reopen、旧 taskId、未知/坏 ID、空编辑、缺项目/无草稿、读操作和拒绝零写。每次写核仅目标 JSON 变化，真实 v2 信封及稳定身份保全。最终定稿须显式 handler final，不冒人 GUI。
4. runner `supplied`：开发交付的新专项测试 11 项，仅在自身隔离输入执行一次，不继承开发 green；runner `affected`：确切 `core/reflect.test.ts`、`reflect-l2.test.ts`、`reflect-file-count.test.ts` 各一次。原三个测试内的 fake 保持原件，独立专项另用真实生产存储。
5. 逐项记录执行 argv/cwd/白名单环境/PID/exit/stdout/stderr/JSON；设施失败和真实产品失败分别保留，不重写原件。核最终输入、共享非自有变化并写报告及 `-seal.json`，不声称全树/全盘无变。

## 运行命令

运行环境：macOS/bash，仓库根；固定 Node 二进制，子进程环境不继承凭据。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1005-reflect-entry-source-auto-20261023-r1-runner.mjs prepare
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1005-reflect-entry-source-auto-20261023-r1-runner.mjs independent
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1005-reflect-entry-source-auto-20261023-r1-runner.mjs supplied
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1005-reflect-entry-source-auto-20261023-r1-runner.mjs affected
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1005-reflect-entry-source-auto-20261023-r1-runner.mjs collect
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/p1005-reflect-entry-source-auto-20261023-r1-runner.mjs seal
```

## 状态

- 合同和开发交接读取：完成。
- 内置 reader 与隔离输入：待执行。
- 独立生产断言、新专项、原受影响专项：待执行。
- 审签、最终 seal 与 released/STOP：待执行。
