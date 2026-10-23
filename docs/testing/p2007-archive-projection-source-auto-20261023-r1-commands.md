# 独立 SOURCE/AUTO 实际命令账

平台 trae；macOS/Darwin 24.6.0 arm64；仓库根 `/Users/bytedance/Projects/dsh-pm/pm-tool`。
全部下表命令已返回，最后 seal 行的退出状态须以实际终端结果/最终回复为准。未执行任何开发 runner 或 mirror/helper。

表内缩写只缩短路径，不省略动作：

- `N` = `/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node`
- `D` = `docs/plans/2026-10-23-p2007-archive-draft-projection-`
- `T` = `docs/testing/p2007-archive-projection-source-auto-20261023-r1-`
- `O` = `reports/all-pending-evidence-20261021/P2ArchiveReviewR1/round00-resume-raw/data/pmtool/`
- `C` = `packages/dsh-pm-tool/src/core/`

## 1. 执行/审证命令

| 命令（按先后） | exit | 结果/原始证据 |
| --- | --- | --- |
| `N --check Treader.mjs`，首次版本 | 0 | 语法有效；尚未产品执行 |
| `N Treader.mjs capture`，首次 | 1 | 自有设施递归枚举误碰 node_modules 软链，原输出逐字转录在 `Tcapture-first-error.log`；不是产品红 |
| `N Treader.mjs capture`，修正后 | 0 | `Taudit.json`：414当前保护输入、42自有复制输入、1019依赖；开发379清单无漂移 |
| `N --check Trunner.mjs` | 0 | 自有runner语法 |
| `N --check Treader.mjs`，修正后 | 0 | 自有reader语法 |
| `N Trunner.mjs affected` | 0 | `Taffected-receipt.json`及两原始log：四专项各一次，35/35 |
| `N Trunner.mjs bytes` | 0 | `Tbytes-receipt.json`及两原始log：独立生产字节专项3/3 |
| `N --version` | 0 | v22.23.3 |
| `N --check Treader.mjs`，终审版本 | 实际终端为准 | 终审仅增强结果JSON/收据/输入保护核验，不改被测产品或runner |
| `N Treader.mjs seal` | 实际终端为准 | `Tseal.json`：终审指纹、有限判定、released/STOP |

runner 实际子进程命令两条，各自 `exit=0, signal=null, error=null`；完整 argv/cwd/白名单环境/时刻/流字节与SHA在相应 receipt：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p2007-archive-projection-source-auto-20261023-r1-PkIBQo/node_modules/vitest/vitest.mjs run --config /tmp/p2007-archive-projection-source-auto-20261023-r1-PkIBQo/config/affected.config.mjs --reporter=verbose --reporter=json --outputFile /tmp/p2007-archive-projection-source-auto-20261023-r1-PkIBQo/output/affected/vitest-result.json
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /tmp/p2007-archive-projection-source-auto-20261023-r1-PkIBQo/node_modules/vitest/vitest.mjs run --config /tmp/p2007-archive-projection-source-auto-20261023-r1-PkIBQo/config/bytes.config.mjs --reporter=verbose --reporter=json --outputFile /tmp/p2007-archive-projection-source-auto-20261023-r1-PkIBQo/output/bytes/vitest-result.json
```

## 2. 全部探索/只读命令

本节普通命令 exit 均为工具实际观察值；路径按上述缩写展开。`node -e` 仅加载内置模块，没有执行被读的脚本。

| 实际命令 | exit |
| --- | --- |
| `pwd` | 0 |
| `cat AGENTS.md` | 0 |
| `ls /user_profile.md /projects/-Users-bytedance-Projects-dsh-pm-pm-tool--p2-11b908a9362bd421871f/project_memory.md` | 1，两个memory入口不存在 |
| `rg --files docs/plans docs/testing \| rg 'p2007.*(projection\|known-gaps\|draft)'` | 127，rg不存在，后改用find/grep |
| `sed -n '1,240p' Dresult.md` | 0 |
| `sed -n '1,300p' docs/testing/p2007-archive-known-gaps-red-20261023-r1.md` | 0 |
| `grep -n '^##\|^###' docs/collaboration.md` | 0 |
| `find docs/plans docs/testing -maxdepth 1 -type f -iname '*p2007*'` | 0 |
| `sed -n '133,174p' docs/collaboration.md` | 0 |
| `sed -n '202,300p' docs/collaboration.md` | 0 |
| `cat Dseal.json` | 0 |
| `cat Dplan.md` | 0 |
| `cat Carchive.ts` | 0 |
| `cat Carchive.test.ts` | 0 |
| `cat Drunner.mjs` | 0，仅阅读，不执行 |
| `sed -n '1,160p' Cstorage.ts` | 0 |
| `cat Cexport-isolation.test.ts` | 0 |
| `cat Cexport-outbound.test.ts` | 0 |
| `cat Dred-r1-stderr.log Dred-r1-stdout.log` | 0，读取旧产品红日志 |
| `N -e` A（以下完整body） | 0 |
| `cat Creview-materials.test.ts` | 0 |
| `cat Ddiff-archive-ts-stdout.log Ddiff-archive-test-ts-stdout.log` | 0 |
| `cat Oreflections/ref-mvi5z85j-yk04ji.json Oreflections/ref-mvk0iiij-42f7xa.json Oreflections/ref-mvk0n0me-25tmos.json` | 0 |
| `N -e` B（以下完整body） | 0，livingdocs输出过长，工具截断；不作为产品或保护证据 |
| `grep -n '^import\|from ' Cexport.ts Creview-materials.ts` | 0 |
| `ls -ld /tmp packages/dsh-pm-tool/node_modules` | 0 |
| `find /tmp/ -maxdepth 1 -type d -name 'p2007-archive-projection-source-auto-20261023-r1-*'` | 0，观察首失败根QSkpxQ，未删除 |
| `N -e` C（以下完整body） | 0 |
| `uname -srm` | 0，Darwin 24.6.0 arm64 |

A body：

```js
const f=require("node:fs");const p="docs/plans/2026-10-23-p2007-archive-draft-projection-";for(const n of ["baseline","red-r1-inputs","green-r1-inputs","affected-r1-inputs"]){let j=JSON.parse(f.readFileSync(p+n+".json"));console.log(n,Object.keys(j));console.log(JSON.stringify({root:j.root,protectedFirst:j.protectedBefore?.slice(0,3),dependencyFirst:j.dependencyFiles?.slice(0,3),sourceFirst:j.sources?.slice(0,2),dependencyRoots:j.dependencyRoots,config:j.config},null,2));}const i=JSON.parse(f.readFileSync("reports/all-pending-evidence-20261021/P2ArchiveReviewR1/index-r1.json"));console.log("index keys",Object.keys(i));console.log(JSON.stringify(i).slice(0,2500));
```

B body：

```js
const f=require("node:fs");for(const p of ["docs/progress.md","docs/handoff.md","docs/changelog.md","docs/onboarding-prompt.md"]){const s=f.readFileSync(p,"utf8");console.log(JSON.stringify({path:p,head:s.split("\n").slice(0,45).join("\n"),tail:p.includes("onboarding")?s.split("\n").slice(-55).join("\n"):undefined}));}for(const p of ["docs/requirements.md","docs/decision-log.md","docs/knowledge-base.md","docs/issues-and-solutions.md"]){const s=f.readFileSync(p,"utf8");console.log(JSON.stringify({path:p,sections:s.split("\n").filter(l=>/^#+ /.test(l)&&/P2007|K16|档案|ADL-05[78]|ISS-027/.test(l))}));}
```

C body：

```js
const fs=require("node:fs");const p="docs/testing/p2007-archive-projection-source-auto-20261023-r1-";for(const label of ["affected","bytes"]){const j=JSON.parse(fs.readFileSync(p+label+"-vitest-result.json"));console.log(JSON.stringify({label,numTotalTests:j.numTotalTests,numPassedTests:j.numPassedTests,numFailedTests:j.numFailedTests,numPendingTests:j.numPendingTests,success:j.success,files:j.testResults.map(t=>({name:t.name,status:t.status,cases:t.assertionResults.length}))},null,2));}const a=JSON.parse(fs.readFileSync(p+"audit.json"));console.log(JSON.stringify({sourceClosure:a.sourceInputs.map(i=>i.path),dependencies:a.dependencyRoots.map(d=>({root:d,...JSON.parse(fs.readFileSync(d+"/package.json"))})).map(d=>({root:d.root,name:d.name,version:d.version}))},null,2));
```

## 3. 设施失败边界与写面

首capture由于自有reader对 `docs/testing` 先递归枚举后过滤，实际递归查看了子目录成员元数据，在遇到 `node_modules` 软链时拒绝退出；没有在这些子目录读取文件正文、加载/执行任何 private frozen/runtime/helper，也未沿该软链。**这次不必要的目录枚举是本专家设施偏差，不应写成从未发生。** 修正仅为顶层 `readdir` 后按明确前缀过滤，原封包自身仍按授权核192件成员。失败没有产品测试或spawn receipt，日志是工具输出逐字转录，不伪装runner捕获。

失败根 `/tmp/p2007-archive-projection-source-auto-20261023-r1-QSkpxQ` 保留；有效根 `...-PkIBQo` 独占 input/config/cache/home/output。`/tmp -> /private/tmp` 仅系统别名例外，不放行任意软链。node_modules是既有目录只读使用链接，不是OS强制只读；没有安装、chmod或写共享依赖。

全部人工文件修改使用apply_patch，仅本前缀新文件；复制/收据/缓存/试验包只写自有根及本前缀。没有产品、旧testing、plans、原封包、livingdocs修改；没有上游/业务原根/profile/lib/端口/service/GUI/Git/凭据操作。P1004/P1005不执行、不改源锁；其可能在保护清单中的文件仅做指纹读取。任务出站位不执行。未加载vendor skill正文/运行其installer或verifier；vendor文件仅属于继承保护清单中的只读字节核验。
