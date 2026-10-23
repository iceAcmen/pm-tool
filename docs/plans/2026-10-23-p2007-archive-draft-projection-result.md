# P2007 archive draft 投影开发结果

> 记录本开发子单的实际改动、红绿证据、边界与交接，供 Main 和另一独立测试专家复核。平台 trae，2026-10-23。**开发自测，不自判 PASS，不做 ordinarycommit；实际封存与释放以同前缀 seal.json 为准。**

## 1. 对象与改动

负责人原句：“父授权验全部已实现未验/修确证缺陷至ordinarycommit，无push/release。你为开发只修刚独立确证K16 archive known/gaps遗漏，非独立专家/GUI。”
依据 `docs/testing/p2007-archive-known-gaps-red-20261023-r1.md` 全文 §6；不改原红证、原192封包或总门，不开启新功能。

仅两 source 有本批增量：

| 文件 | 原字节 → 修后 | 精确增量 |
| --- | --- | --- |
| `packages/dsh-pm-tool/src/core/archive.ts` | 9319 → 9339 bytes | +4/-3；仅 type import 与 pickReflection |
| `packages/dsh-pm-tool/src/core/archive.test.ts` | 5927 → 12831 bytes | +164/-9；旧反思 fixture 改真实 schema，补5个必要用例 |

`archive.ts` 只把读取改为 `const draft = r.draft as ReflectionRecord['draft']`、`draft.lines`、`draft.gaps`。known 筛选/文本映射、ID/sourceEvent/status/三个关联/时间字段及项目过滤原样。type import 不增加运行时 schema 导入。不迁移源记录，不增加顶层 fake schema fallback；对非法缺 draft 记录不承诺兼容。

| 文件 | 原 SHA256 | 修后 SHA256 |
| --- | --- | --- |
| archive.ts | `097f1860da2ee67a29b59f7f1047743e538acfab8856b93b344afb9c88badd55` | `46ab5017b32443d086712b83c34f63e35982588a045a7e6bc3b5ca54423f7140` |
| archive.test.ts | `c0648d39c040c11d4f8e36a0744dc5e980eea82f194d6512d6a603ec780e73f6` | `c53a8bbaf5ad49d84478d667ea3279c1c6be23cc00592254ecc58767e71e730b` |

baseline commit 只引用专家声明 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；本开发未运行 Git，不声称独立核 HEAD 或得到完整 tracked diff。新候选由 Main 另认领；本批增量是捕获的源原字节对最终源的标准 unified diff，封存在 `*-diff-archive-ts-stdout.log`、`*-diff-archive-test-ts-stdout.log`，diff exit1 表示有差异，不是产品失败。

## 2. 实际验证

macOS、现有 Node `v22.23.3`、Vitest `2.1.9`、实际已装 Zod `4.6.5`、Vite `5.4.21`。pnpm未调用、不 install。每轮新 tmp，input/config/cache/home/output 独占；子进程使用清空后白名单环境，无凭据继承。只读链接既有 node_modules，未 chmod 或改依赖。不是操作系统强制只读挂载，保护结论限定于列明文件的前后指纹。

| 实际命令 | exit | 实际结果 |
| --- | --- | --- |
| 直接 `node --version` | 0 | v22.23.3 |
| 直接 `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` | 0 | 两注册 vendor 静态门满足；mattpocock13件一致 |
| `node ...-runner.mjs capture` 首轮 | 1 | runner设施 ENOENT，未运行产品测试，见§4 |
| `node ...-runner.mjs capture` 第二轮 | 0 | 捕获两源原字节、379保护文件、1019依赖文件；内部 vendor-initial exit0 |
| `node ...-runner.mjs red-r1` | 1 | 旧产品 SHA，5个真实遗漏断言红；4旧例有意按标题过滤，非未执行冒绿 |
| `node ...-runner.mjs green-r1` | 0 | 同一测试 SHA，archive完整9/9 |
| `node ...-runner.mjs affected-r1` | 0 | 四文件35/35：archive9、review9、export-isolation7、export-outbound10 |
| `shasum -a 256` diagnosing/tdd六件 | 0 | 与锁定 manifest 逐位一致 |
| `shasum -a 256` review两件及修后两source | 0 | 与 manifest/上述最终SHA一致 |
| 直接 `/usr/bin/diff -u` 原archive→当前 | 1 | 仅§1的+4/-3 |
| `node ...-runner.mjs seal` | 以seal及终端实际结果为准 | vendor-final/diff/输入复核/释放；不在封存前伪造结果 |

完整子进程命令、cwd、白名单环境、时间、exit、stdout/stderr大小与SHA在 `*-receipt.json`；原输出在同标签 `*-stdout.log` / `*-stderr.log`。完整执行入口及探索命令/非0见 `*-commands.md`。时间保留机器实际UTC，文档日期为本地2026-10-23，不改时钟。

红输入 `/tmp/pmtool-p2007-archive-draft-projection-VfBwtf`；绿输入 `...-ZC3Vgs`；受影响输入 `...-4tcraU`。三轮94源文件快照中 archive.test.ts 都为上述同一SHA；只有 archive.ts 从原SHA到修后SHA。原字节捕获目录 `...-Qdq0dI` 保留，不修改旧源码造红。

## 3. 有效红与必要守卫

三个 `reflectionRecordSchema.parse` 合法记录为 `task-done` / `milestone-achieved` / `deliverable-accepted`，嵌套 draft（title/at/lines/gaps）、真实 ref ID 格式。已核数分别4/1/2，gaps分别0/1/1。红日志实见 task known空、另两事件 known/gaps空；event/关联/时间字段相符，失败不是 schema/import/fixture 无效。

补测直接调用生产公开 `buildArchiveSnapshot`，没有复制私有投影实现。字面预期与真实输入独立列明；pending/blank穿插，不收录、不伪造文本。空 lines + 两gap、仅pending/blank + 非空gap也保留 gaps；两gap顺序守卫覆盖。

合并案例在三事件之间插入另一项目合法反思，结果只含目标三ID且保持源顺序，7句/2gap逐项相同；review 同源返回7句与计数7，防回归。深冻结原反思/嵌套数组、全fake domain表 structuredClone 对照及引用身份守卫证明调用不改原对象。这里的 fake domain 仅为存储边界替身，反思值真实 schema 解析；不声称其他表 fixture 全部经真实存储/schema 或命令保存。

旧 archive 四例保留并重跑（只读字段/缺项目错误/生成文件和README/覆盖拒绝与confirm）。旧顶层 `r-0001/task.done/lines/gaps` 不再遮盖缺陷。旧 review 周期/done/wrapped/null/跨项目/Markdown与出站/隔离专项原字节重跑，无其他source改动。

## 4. 设施失败与试点

首轮实际 capture exit1：

```text
Error: ENOENT: no such file or directory, lstat '/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool/node_modules/vite'
    at realpathSync (node:fs:2791:29)
    at ...-runner.mjs:123:18
code: ENOENT
Node.js v22.23.3
```

这是工具观察记录，不伪造为该轮 spawn receipt；失败发生在 baseline写出/产品fixture改动之前，已经创建自有空设施根 `...-lVCoqw`，保留不清理。runner原先假定Vite顶层软链存在；实际 pnpm 仅Vitest顶层链接，Vite在Vitest依赖解析链。仅新增 createRequire、从真实 Vitest package.json 解析 `vite/package.json` 后 capture exit0，排除依赖未装/链接目标缺失。不安装、不构建、不把失败洗为产品红。

三轮 stderr 均有 Vitest `cache.dir` 弃用提示，实际 cache仍落自有root（Vite cacheDir）；不是失败，不删旧日志。本批 runner 保持同一配置进行红绿，不借警告改产品。

vendor试点按manifest锁 `49dd158d1076134a641b33efb035946536778336`，初始静态门0+逐SHA后置 `vendorIntegrityVerified=true`：

- 产品根因已独立确证：有效 `bug-fix/isTestableFix=true/isTrivial=false → tdd`；不为形式伪设根因未明。公开测试边界和方案已获本派单及专家§6确认。
- 首轮设施失败时切换 `bug-investigation/isRootCauseUnknown=true → diagnosing-bugs`，只诊断设施，不叠 tdd/review；反馈命令为capture。三假设按“顶层未提升/依赖未装/链接目标缺失”区分，真实Vitest位置解析成功确证第一条；根因后恢复TDD。
- 交付前 code-review 两文件重核SHA并只读加载，`delivery-self-check/isDeliveryBoundary=true → code-review`。本接口无独立子代理工具；双轴由本开发自查，不伪称平行独立审查。Git/setup/HITL/codebase-design/全构建等冲突步骤均跳过，理由是明确子单禁令、vendor只读政策与独立门。

**Standards自查：** 增量只在两个获准source，新可复用流程/证据只在自有前缀；类型复用真实schema、无兼容层/新抽象、无业务写。未发现需扩大源写面的缺陷。整包类型检查不在本角色权限，不冒称已完成。

**Spec自查：** 对照专家§6，三个event/ID/三个关联/排序/only-known/空lines非空gap/跨项目/原对象不变均有真实schema专项。局部绿色不替代实际原DB、真实命令或文件重开主链。没有更改 commands/archive 文案统计（仍是反思记录数）、reflect/review/storage/业务/UI。

8条红线检查：无installer/setup、home/全局持久写、真实data写、上游写、独立PASS替代、不可逆/推送发布、联网取新vendor、vendor改写。自有tmp home/config写是本次授权的隔离设施，不是用户home。

## 5. 保护与 Main 接续

保护清单为379个明确普通文件：原包192封件加index/seal共194物理文件、规则/livingdocs指定文件、mattpocock、相关commands/archive及非本写面的core输入。另列五个依赖包1019普通文件；不沿其node_modules软链扩扫，不宣称完整依赖/全盘冻结。最终前后SHA、原包物理成员、三个隔离94输入/config及原字节副本的复核结果均以 seal.json 为准。

全部实际写根只有自有前缀新文件、五个上述tmp根及seal新增自有tmp根（完整路径在vendor-final receipt/sealRoot）。两业务source是唯一非自有文档产品写面。没有 lib/正式root/profile/服务/端口/Git/凭据/private frozen/runtime 访问或写入；P1004/P1005源锁未操作，共享dirty未清。

未执行：install/build/noEmit/全部verify、verify-p2c/整包P2命令集成、宿主service/GUI、ordinarycommit/push/release。原因是本派单权限，不登记为必须用户协作的MANUAL_PENDING。不能拿旧lib或原192包代表新修复。

**Main下一步：** 收齐其他源门后认领组合候选，重新freeze基线/tracked diff/新增文件SHA；唯一builder做整包构建/当前全部verify及受影响P2专项，然后新hostGUI按原§6主chain重采composer→RPC→原包+README→真实file→前后DB/原根→重进复读。合法保存/标准恢复的同等fixture须回绑原7句/2gap，review7句不退化，并继续原done/wrapped/周期边界余链，不增页面。新原证交另一独立专家，原FAIL保留不覆盖、不直接继承旧受影响绿。

本开发子单收尾由seal释放两个source锁，全部spawnSync子进程已返回，**released / STOP**。此措辞只说明开发资源释放，不是P2007整项、父门或ordinarycommit已获准。
