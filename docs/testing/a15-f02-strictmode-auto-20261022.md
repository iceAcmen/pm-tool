# RA-F02 StrictMode SOURCE/AUTO 有限独立补验

> 给 Main 与接续独立专家引用；平台 trae，独立 AUTO 角色，2026-10-22。仅签 A13 指纹绑定的 SOURCE/AUTO 切片，不签 GUI、浏览器 input 忙态真实属性、A16、RA-F02 整门或发布。

## 1. 有限结论

**已有真实组件四条及新增真实生命周期三条有限 SOURCE/AUTO PASS；renderer 能力计数如实成立，但自动 Strict effects 仍 BLOCKED。** 不是「StrictMode 全部通过」。原 GUI 报告的忙态探针、真实宿主迟201及整门缺口不因本报告关闭。

| 切片 | 判定 | 精确边界 |
| --- | --- | --- |
| 原四条真实组件/生产 handler/domain 复验 | 有限 AUTO PASS | 三轮每轮4/4；原测试和 expect 未改。原“新上传仍可保存”实际只读新 stage，不借其名称声称实际保存 |
| `<StrictMode>` 中显式卸载/重新挂载、旧 AbortSignal、旧迟201不 publish、真实 DELETE、新挂载实际 save | 有限 AUTO PASS | r2/r3成立；真实组件+生产 handler+JSON domain，不是自建状态机；显式重挂不等同同实例严格 effects replay |
| 成功暂存但未主保存，卸载清 bin/sidecar，零任务/资产写 | 有限 SOURCE/AUTO PASS | 一次真实 POST201、生产 DELETE200 removed=true；不是全 GC/共享源/全 F01 |
| 传输拒绝→busy props与文件 ref恢复→同文件重选→一次真实 domain save→卸载保资产 | 有限 SOURCE/AUTO PASS | renderer props/ref与真实领域写；不签浏览器 input 的 disabled 实际属性、原生重选、TaskForm/命令 UI 主保存或3秒 GUI延迟 |
| renderer `<StrictMode>` 是否自动双 effect | 能力观察成立，未观察到自动双 effect | 实际 render=1，挂载 setup=1、cleanup=0；真正卸载后 cleanup=1 |
| 自动 Strict effects /真实 ReactDOM createRoot | BLOCKED | 现有可解析依赖没有 jsdom；传递 react-dom19.3.1 与 React18.3.1不匹配；未安装、未运行 createRoot、未搭 fake DOM |
| RA-F02 GUI/整门/实际宿主迟201/全功能/发布 | 不审签 | Main仍唯一 GUI执行者，继续原 busyprobe与导入 fixture；A16 panel不属于本角色 |

独立性：本角色只新增自有测试设施，没有改产品后自验收。负责人持续独立分工授权原句完整保存在 [先行计划](a15-f02-strictmode-auto-20261022-plan.md)。依据 [AGENTS](../../AGENTS.md)、[collaboration §9/11](../collaboration.md)、[RA-F02](remaining-journey-cases-20261021.md)和 [GUI最小补件](a15-file-fault-gui-review-20261022.md) §7。新明确限定优先于通用 fetch/pull/build/install/livingdocs/commit；原失败不覆写。

## 2. 冻结与环境

产品来源 `/private/tmp/pmtool-a13-closure-20261022`，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；candidate SHA `d70267f974fb9aa8aaf496a4f1d49abef33d26d410b6a453eb4569fadaa9a51f`，原 tracked patch SHA `824d9c3c96095731580fac8edffbaced9998d5b8e245affbbb8c342e07df507b`。每轮独立核 **514声明输入、453产物** 全部SHA，复制完整声明输入及整个 src，不复制/写产物。不用 HEAD 或版本号冒充 dirty 候选。

组件 SHA `66af8221d089a2ad65fa4d831be218c4a78d3299c23239cfaf750497c4edc2ae`，原 stage 测试 SHA `95992aef68f8a97f92137a5574b215fcad760246495317c2f383c52907b7b7a8`，与 main 开始/终核均一致。完整源/输入/依赖/环境记录见各轮 candidate/protected/frozen-source；A16源码不进入冻结。

macOS darwin/arm64，OS release24.6.0，实际 Node v22.23.3；React/react-test-renderer18.3.1、Vitest2.1.9、Cordis4.0.5-alpha.1、storage/json/domain0.2.1-alpha.2。pnpm11.28.5为项目约定，本轮未调用。A13依赖软链解析到 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，只读复用，不安装。

各轮在 `a15-f02-strictmode-auto-20261022-selftmp/rN/frozen` 执行，单fork/单worker、文件不并行、`--no-cache`、专属 Vite cacheDir，显式 JSX automatic；HOME/TMPDIR/TMP/TEMP/XDG/npm/Node cache全部指向本前缀。子进程环境白名单只含这些路径、PATH、CI/LANG/TZ、F02_EVIDENCE_ROOT，不继承 credentials或正式 file root。原测试的 mkdtemp 也落本前缀 TMPDIR；无共享 lib/cache 写。

## 3. 真实接口与新增原证

没有 mock 产品模块/hooks或自建业务模型。fetch仅做进程内传输适配、失败/continuation延迟；请求字节由真实 asset-route `buildAssetRoutes().upload/cancelStage` 处理。认证注入明确为合法宿主 gate fixture（不签鉴权），未注入 attach/resolve或伪201。领域使用真实 Context/Storage/JsonStorageBackend/DomainFacility/pmDomainSpec/addProject/addTask/readStage。

SOURCE：组件 effect 中 active/generation和 cleanup abort位于A13 `task-draft-materials.tsx`95–106；isCurrent及迟到回收115–125；文件 ref重置与finally144–148；文件 input props340。stage-client真实 POST无taskId、URI文件名、same-origin/no-store、AbortSignal；DELETE opaque stageId。asset-route无taskId→真实 stageUpload201；cancelStage→真实 deleteStage；file-staging真实 bin/sidecar写入和删除。源码存在仅作 SOURCE，不代替 AUTO/GUI。

r3 `case-evidence/case-2/evidence.json`：

- 旧 stage `7ad6bd479d57c174758aca19dd01212f` 已真实生成201，24字节 `F02 stage.md`、SHA `6658b92ab9b3e19ac1471424a1fc1391f0059d6a5ccfae29aec1bcdf22e2fa64`；bin/sidecar原文件和 meta逐字段核验。未主保存时只有初始项目，任务/资产0。
- 旧组件显式卸载，生产 signal变 aborted=true；新组件挂载，上传得到新 stage `8e9c991184de05a91998bb9c4aab066b`、新 signal=false；唯一 publish owner=new、c-1指新stage。
- 释放旧真实201 continuation后 publish仍1；真实 DELETE `/api/pm/v1/stages/7ad...` 返回200 `{ok:true,removed:true}`，旧 bin/sidecar消失，新stage保留，业务写仍0。
- 新 envelope实际调用 addTask一次，raw `{version:2,record:...}`：t-0001/at-1→fa-0001，单任务/单附件/单资产、progressLog空；最终路径 `66/6658...fa64.md` 24字节SHA吻合；新stage finalize清零。submissionRef成功置true后卸载没有对应DELETE，data/files与保存前完全一致。
- 相邻独立 Probe计数 `setup,cleanup,setup,cleanup` 来自两个明确 create/unmount，不替换产品 effect，不宣称其为React自动 replay。四个新增用例监听console error/warn均空，仅对本进程/本区间成立。

case-3：stage `1c4de0dd7707e8ee5086f1a912e8ef21`，POST201后卸载DELETE200 removed=true；files由bin+sidecar→0，data不变、任务/资产0。case-4：首次传输Promise拒绝 `F02 transport rejected`，组件busy props true→false、file ref值重置为空、alert保错，domain/files零写；同文件重选stage `d8f42d259a01e86a9dd7497eb302ab82`、201，错误消失，唯一addTask保存，卸载保最终资产。

这是**生产 handler已收到字节/生成 stage之后的客户端 continuation AUTO实验**，不是实际运行宿主HTTP或浏览器延迟201；不继承/关闭GUI seq1 Invalid InterceptionId缺口。文件fixture24字节是合法自有 Markdown，不冒充Main原生22字节原件或其图。

## 4. Strict Effects 能力门

`case-1/evidence.json` 实测 `<StrictMode>` renderer render=1，mounted effects=`["setup"]`，unmounted=`["setup","cleanup"]`，`automaticStrictEffectsObserved=false`；r1/r2/r3一致。能力计数测试PASS表示观察可靠，不表示自动 Strict effects PASS。原测试未包StrictMode；新增三条包裹但只支持显式重挂结论。

A13解析依赖根、传递`.pnpm/node_modules`、主树对应两个既有根均无可解析jsdom；可见react-dom为19.3.1而React18.3.1。没有获准install，不能用真实ReactDOM createRoot执行自动 effects replay，诚实 **BLOCKED**，不是产品 FAIL，也不转 MANUAL_PENDING。后续只能由获授权且已有兼容DOM能力的独立AUTO角色补同源createRoot实验；此报告不授予安装或产品改动。

## 5. 命令、失败与终码

环境同§2，仓库根；实际命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a15-f02-strictmode-auto-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strictmode-auto-20261022-run.mjs r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strictmode-auto-20261022-run.mjs r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strictmode-auto-20261022-run.mjs r3
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a15-f02-strictmode-auto-20261022-seal.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strictmode-auto-20261022-seal.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strictmode-auto-20261022-seal.mjs final
git diff --check -- 'docs/testing/a15-f02-strictmode-auto-20261022*'
```

每轮实际子命令完整argv/cwd/白名单env/start/end/exit/signal均在 `*.command.json`；等价模板为以下两文件分别执行，单fork等配置在专属vitest.config.mjs：

```sh
<Node22> <既有依赖>/vitest/vitest.mjs run <原stage测试或本前缀cases.test.tsx> \
  --config <本轮>/vitest.config.mjs --no-cache \
  --reporter=default --reporter=json --outputFile <本轮>/<label>.result.json
```

| 轮次 | 原四条 / 子exit | 新增四条 / 子exit | 父终码与失败 |
| --- | --- | --- | --- |
| r1 | 4通过0失败 / 0 | 2通过2失败 / 1 | 工具仅返回execution ID，父最终码未回收，不补造；runner按代码应1不当作实录 |
| r2 | 4通过0失败 / 0 | 4通过0失败 / 0 | 同样父最终码未回收；完整summary已落，不冒充实际父0 |
| r3 | 4通过0失败 / 0 | 4通过0失败 / 0 | 长等待实际工具父exit0；子时间23:15:58.039–23:16:00.885Z，signal均null |

r1两个失败是本角色snapshot扫描器按扩展名误把最终`.md`文件当目录，`ENOTDIR scandir ...files/66/6658...fa64.md`；发生在保存后observe及afterEach，各有原stack/reporter/stdout/stderr/evidence。产品save断言此前已成立，但不以此签失败轮完整通过。仅把自有扫描器改为lstat目录/常规文件结构判定，不改expect、产品或r1 freeze；r2/r3同Oracle复验全绿。旧原件永久保留，本轮冻结未被追改。

runner语法与初次diff检查exit0；seal语法/首封存执行均实际exit0，结构回读成立，原证索引1956项。追加final封存及最后diff由工具终码回读，不重跑业务用例。diff对untracked文件不等内容验证，报告断言另由seal结构回读。探索的rg不可用exit127、memory不存在exit1、首次ls无本前缀/jsdom/react-dom exit1保留；未为其安装或修改系统。两次宽输出已收窄，不把探索输出当产品证据。

## 6. 保护与释放

每轮保护979项（A13全部声明输入/产物、固定合同/候选/原patch/环境、自有输入、main组件/原测试），依赖物理及链接目标14611条；另核main lib/.vite、冻结完整src。r1/r2/r3全部新增/删除/变化0。逐项SHA/bytes/mtime在前后manifest；最后seal再核，唯一允许变化是本计划完成状态，封存时另保存当前自有文档指纹。未监视全用户HOME/正式业务根，不宣称整机零污染；业务仅在本前缀自有data/files/TMP写。

首封存 [seal.json](a15-f02-strictmode-auto-20261022-seal.json) 与追加 [seal-final.json](a15-f02-strictmode-auto-20261022-seal-final.json) 包含全部保留轮次索引、保护与case结构回读；final记录本报告/计划释放状态的当前指纹，不覆盖首封存。依赖链接记录不复制进证据包。runner已结束，终核pgrep仅检查本前缀runner，exit1/空输出，无需TERM；不探/停宿主。前两轮工具没有可用UUID poll接口，改以summary/子码保全并r3直接等待，不借代码推父终码。

只写本前缀计划/用例/runner/自有冻结原证/报告/封存；未fetch/pull、build/install、改原测试、产品、其他testing/livingdocs、共享lib/cache、credentials、GUI/services、commit/push。**本角色有限报告后释放，不持有GUI/builder/服务资源；Main继续原busyprobe与导入fixture，A16 panel与本报告无交叉放行。**
