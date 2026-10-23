# P2007 archive draft 投影修复计划

> 记录本次限定开发的授权、方案、锁和步骤，供 Main 与独立专家接续；不是独立验收结论。平台 trae，2026-10-23。使用 writing-plans 整理既有合同，不扩需求。

**Goal:** 修复 K16 已独立确证的 known/gaps 丢失，先真实 schema 红，再最小绿。

**Architecture:** 仅把 `pickReflection` 的读取改为真实 `draft.lines/gaps`，保留已有筛选、ID/sourceEvent/关联和只读语义。公开测试边界为 `buildArchiveSnapshot`，已有 `writeArchivePackage` 专项保留。不增加顶层伪 schema 兼容、迁移或新能力。

**Tech Stack:** macOS、现有 nvm Node v22.23.3、Vitest 2.1.9、Zod 4；pnpm 不调用。

## 授权与互斥

- 负责人原句：“父授权验全部已实现未验/修确证缺陷至ordinarycommit，无push/release。你为开发只修刚独立确证K16 archive known/gaps遗漏，非独立专家/GUI。”
- 精确合同：`docs/testing/p2007-archive-known-gaps-red-20261023-r1.md` 全文，尤其 §6；不改原 FAIL 或原192封包。
- 本开发暂持两个文件级源写锁：`packages/dsh-pm-tool/src/core/archive.ts`（仅 pickReflection）、既有 `packages/dsh-pm-tool/src/core/archive.test.ts`（合法 fixture 与必要守卫）。
- 本前缀 `docs/plans/2026-10-23-p2007-archive-draft-projection-*` 新文件为自有 plan/result/runner/receipts/seal；自有 `/tmp/pmtool-p2007-archive-draft-projection-*` 为输入/config/cache/home/output 根。
- Main 独占整包 builder/GUI；本开发不持 lib/端口/profile/data 锁。不碰 P1004/P1005 源锁，不清共享 dirty。
- 禁止其他 source、commands、reflect/review、业务/UI 修改；testing/原封包/livingdocs/vendor/上游只读；不访问凭据/private frozen/runtime。
- 本次禁止 install/build/noEmit/全 verify/service/Git，包括只读 Git。本开发不做 ordinarycommit。baseline 仅引用专家声明 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不冒称已独立核 HEAD/tracked diff。
- 本次明确授权覆盖通用 SOP 的 fetch/pull、地基构建、livingdocs 更新、全回归/提交步骤，亦覆盖 brainstorming 的重复确认、worktree/commit 和 writing-plans 的频繁提交。既有方案和测试合同已明确，不另开功能或请求重复许可。

## 方案与路由

1. 采用嵌套 draft 读取：与现有合法 schema 一致，最小产品变更。
2. 不采用顶层 fallback：给历史 fake fixture 制造兼容，合同禁止。
3. 不采用修改 schema/reflect/review：真实源记录合法，扩大影响且不能修正旧打包投影。

static verifier 已实际 exit0，mattpocock commit `49dd158d1076134a641b33efb035946536778336`，13件 SHA/bytes 一致；另 shasum 核 diagnosing/tdd 6件 exit0。
根因已由独立专家确证且源码吻合，不假装 rootCauseUnknown：本阶段有效路由 `bug-fix/isTestableFix=true/isTrivial=false/vendorIntegrityVerified=true → tdd`，diagnosing-bugs 不为形式加载。若设施错误根因未明，切换仅 diagnosing-bugs，禁止把设施失败冒称产品红。交付阶段 `delivery-self-check → code-review`。
vendor 原文的未 vendored codebase-design/setup/HITL 脚本不调用；项目规则优先，FAIL 期间只修本确证缺陷，不把自测绿当独立 PASS。试点记录并入本前缀 result，不写共享 verification。

## 执行步骤

- [x] 读 AGENTS、collaboration §9/§11、vendorpolicy/manifest、专家全文及必要源码。
- [x] 静态门 exit0 与逐 SHA 核对；阅读 tdd 三正文。
- [x] runner 捕获两个源原字节、379保护输入及1019依赖文件；保留共享 dirty，不用 Git。首轮 Vite 顶层链接设施错误保留，修 runner 解析后 capture exit0。
- [x] 将旧顶层 fake fixture 改为 `reflectionRecordSchema.parse` 合法嵌套 draft；三实际 event，known/pending/blank、空 lines 与非空 gaps。
- [x] 旧产品字节 red-r1 实际5个遗漏断言红、4旧例有意过滤，exit1；没有 schema/import 失败。
- [x] 仅改 pickReflection draft 读取及其类型 import；同一测试 SHA 新 tmp green-r1 实际9/9，exit0。
- [x] affected-r1 既有 archive/review-materials/export-isolation/export-outbound 四文件35/35，exit0；不编译或复用旧 lib 运行 verify-p2c 等整链脚本，留 Main 全回归。
- [x] code-review 双轴开发自查、精确 diff/源 SHA/命令 exit 已留 result/commands/receipts；runner语法检查exit0。完整保护复核留最终seal。
- 最终动作：运行 seal 后释放两个源锁并 STOP；不开始下一任务。本文在封存前保存，不提前给此动作打勾；实际完成状态仅看同前缀 seal.json 的 sourceLocks/stop/保护复核，不改封存后文件。

## 实际命令入口与边界

运行环境 macOS，仓库根，直接现有 Node，不加载 shell 凭据或调用 pnpm。runner 用清空后白名单环境启动测试；HOME/TMPDIR/XDG/config/cache/output 在自己的 tmp。依赖仅链接现有 node_modules，不安装、不 chmod 共享目录。

```sh
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs capture
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs red-r1
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs green-r1
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs affected-r1
```

每轮不覆盖已有收据；红冻结旧 archive 字节，绿冻结修后字节。同一源7行/2gap在单元层证明，不冒真实原 DB 的7句逐字复验。Main 后续新 freeze/整包全回归/newhostGUI 重采 §6 主 chain，source→archive/review→RPC→包/README/file→DB/原根→重进复读，并补原 done/wrapped/周期余链；新证由另一独立专家审签。
