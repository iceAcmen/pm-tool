# F02 自动 StrictEffects DOM 有限独立复验

> 给 Main 与独立接续专家引用；2026-10-22，平台 trae，独立 SOURCE/AUTO 角色。只签 A13 冻结对应的 F02 切片，不签 GUI、A16、整门或发布；原前专家文件保留。

## 有限结论

**F02 自动 StrictEffects DOM SOURCE/AUTO 有限 PASS。** 两轮各14/14：原四条、前专家四条、DOM六条，全子命令exit0。r2 collector实录runner exit0，r1工具只返回execution ID，父终码未回收，不补造。未发现真实产品FAIL，未改产品或原expect。

前专家「无兼容DOM能力，自动StrictEffects BLOCKED」是当时正确边界；本次以新只读隔离依赖实际补齐该 **AUTO能力切片**，不改写其历史结论，不关闭 GUI忙态/native chooser/真实宿主延迟或F02整门。负责人原句、停止条件与Oracle见[先行计划](a15-f02-strict-effects-dom-retest-20261022-plan.md)；依据AGENTS §6A、collaboration §9/11、remaining-journey RA-F02。

| 用例 | 判定与证据边界 |
| --- | --- |
| 原四条 | 有限AUTO PASS；逐字复制，不把原第三条仅读stage扩成实际save |
| 前专家四条 | 有限AUTO PASS；单effect观察和显式重挂范围保留，不冒自动replay |
| DOM-C01 | 能力PASS；createRoot+StrictMode，真实产品旁置Probe，挂载后实观setup/cleanup/setup，最终真正卸载追加cleanup；非Strict对照只有setup/最终cleanup |
| DOM-C02 | 事件控制PASS；真实JSDOM File经DOM冒泡change进入React一次，act刷新disabled true→false，名字节一致 |
| DOM-F01 | 有限SOURCE/AUTO PASS；自动replay后传输拒绝，busy/错误/input恢复，同File重选真实201，真实addTask一次，finalize后submissionRef卸载保资产 |
| DOM-F02 | 有限SOURCE/AUTO PASS；自动replay后真实handler201暂存，真正卸载abort，旧continuation不publish、DELETE200 removed=true、零任务/资产、根回初态 |
| DOM-F03 | 有限SOURCE/AUTO PASS；旧/新实例各实观自动replay，旧迟201只回收旧stage、不向新publish，新草稿实际保存，最终卸载不删资产 |
| DOM-F04 | 有限SOURCE/AUTO PASS；自动replay后未主保存stage201，真正卸载清bin/sidecar，业务不变 |
| GUI、A16、F02整门、全部积压、发布 | 不审签；GUI忙态补件由另一专家审，Main保持A16唯一builder，本角色已释放 |

## 候选与环境

A13来源`/private/tmp/pmtool-a13-closure-20261022`，基线`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，candidate SHA `d70267f974fb9aa8aaf496a4f1d49abef33d26d410b6a453eb4569fadaa9a51f`，tracked patch SHA `824d9c3c96095731580fac8edffbaced9998d5b8e245affbbb8c342e07df507b`。每轮核514声明输入、453产物并复制全部声明输入和完整src，不复制产物、不build。组件SHA `66af8221d089a2ad65fa4d831be218c4a78d3299c23239cfaf750497c4edc2ae`，原stage测试SHA `95992aef68f8a97f92137a5574b215fcad760246495317c2f383c52907b7b7a8`，与main前后相同。HEAD/version不充当dirty身份。

macOS darwin/arm64 release24.6.0，实际Node v22.23.3，Vitest2.1.9。旧八条用既有兼容React/renderer18.3.1；DOM用`/private/tmp/pmtool-f02-dom-deps-20261022/node_modules`中的React/ReactDOM18.3.1、JSDOM25.0.1。独立alias精确指向react/index、jsx/runtime、react-dom/index/client，全部React引用同实例，不加载原react19；createRoot在JSDOM document存在后动态加载。React18.3.1的`act`是真实act（没有使用会触发deprecated警告的test-utils act）。

新依赖安装由Main先前完成；本角色仅只读核`package-lock.json`SHA `15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973`，原npm日志尾部exit0/info ok。不是本角色install，也不把Main父终码NOT_CAPTURED改成实录0。完整alias、cwd、白名单env、版本/候选见每轮candidate.json。

子命令单fork/单worker/文件不并行、`--no-cache`、JSX automatic、自有Vite cacheDir，HOME/TMPDIR/TMP/TEMP/XDG/npm/Node cache全部本前缀。不继承credentials、DSH_HOME或正式file root；业务root由每个case指定本前缀data/files。

## 真实产品与原证

生产TaskDraftMaterials、stage-client、buildAssetRoutes(upload/cancelStage)、file-staging、Context/Storage/JsonStorageBackend/DomainFacility/pmDomainSpec/addProject/addTask/readStage全部真实。fetch只适配进程内传输、Promise失败和201 continuation hold，原始文件字节实际进入生产upload，无伪201或attach/resolve注入；合法宿主auth gate fixture不签鉴权。Probe只观察renderer能力，不spy/替换产品effect。SOURCE核active/generation/abort/isCurrent/迟stage回收、input reset与finally；AUTO由真实组件DOM行为支持，不用自建业务状态模型。

DOM选择fixture：JSDOM无native chooser，给真实input.files注入含`item`的array-like（不是原生FileList），真实`window.File`和冒泡`window.Event('change')`进入ReactDOM事件系统。没有调用产品onChange、mock hook或复制业务状态机。input.value setter仅透明委托真实JSDOM原setter并记值；故证明产品失败后确实写`''`及属性恢复，不声称浏览器同文件native重选。能力控制中的小Control仅校准ReactDOM事件/act，产品用例不使用它。

r2关键原证目录`-selftmp/r2/case-evidence/strict-dom`：

- case1 strict效果`setup,cleanup,setup,cleanup`，挂载快照只有前三项，最终cleanup才来自显式unmount；非strict对照两项。case3..6每个owner同样先自动三项、后最终cleanup，old/new分别四项。不能用显式remount冒自动replay。
- case3 input busy disabled=true/attribute存在、文案「上传暂存中」→拒绝后false、alert含`F02 DOM transport rejected`、真实setter一次`''`、data/files不变、publish0；空files change零请求。同一个28字节File重选stage `91f1576f7765945433a1a237bb3e9fa6`真实201；一次publish/一次addTask→t-0001/at-1/fa-0001，raw `{version:2,record}`一致、stage finalize清零、卸载无DELETE，data/files完全保留。
- case4 stage `9d4c8b5ce6956729df95983b2530a001`真实201时任务/资产0、publish0；真正卸载signal.aborted=true，释放201后仅一次DELETE200 `{ok:true,removed:true}`，bin/sidecar清空，业务根与初态相同。
- case5旧stage `0cc2869be4fa931af5b10350247de260`真正卸载，新的自动replayed实例stage `c64d3406f6d41947088a3e593207a53a`201、唯一publish owner=new；释放旧201只DELETE旧stage、新signal仍false。新domain保存单任务/资产，finalize后最终卸载不DELETE、不改盘。
- case6未提交stage `682cec13fd8b373adf6de968e285ad2c`201后最终卸载DELETE200，files回空、任务/资产0、project原JSON不变。
- 每个stage取消前副本保存为`case-N/raw-stages/<id>/stage.bin`及原sidecar `stage.json`，SHA `db366f0472adbddcd31ae2d43716cd82e7f905abae063c76c7984267f3e9b458`、28字节，最终资产`db/<sha>.md`字节一致。不是Main22字节fixture。每case console error/warn空，仅本进程/区间成立。

## 命令与原退出码

实际命令，macOS/Node22，仓库根（pnpm11.28.5为约定，本次未调用）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a15-f02-strict-effects-dom-retest-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strict-effects-dom-retest-20261022-run.mjs r1
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strict-effects-dom-retest-20261022-collect.mjs r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strict-effects-dom-retest-20261022-seal.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strict-effects-dom-retest-20261022-seal-collect.mjs
git diff --check -- 'docs/testing/a15-f02-strict-effects-dom-retest-20261022*'
```

完整子argv/cwd/env/start/end/exit/signal、default+JSON reporter、stdout/stderr见每轮`original-four/previous-four/strict-dom.*`；等价子命令为`<Node22> <旧deps>/vitest/vitest.mjs run <各自test> --config <自有retained或dom.config.mjs> --no-cache --reporter=default --reporter=json --outputFile <自有result.json>`。r2-parent/command.json另有父runner原exit0。

| 轮次 | 原四条 | 前专家四条 | DOM六条 | 父终码/边界 |
| --- | --- | --- | --- | --- |
| r1 | 4/4 exit0 | 4/4 exit0 | 6/6 exit0 | 工具未返回最终父码；summary及子码保留，不推断父0 |
| r2 | 4/4 exit0 | 4/4 exit0 | 6/6 exit0 | collector spawnSync实录runner exit0/signal null，23:28:53.759Z DOM子结束，后保护终核 |

无测试FAIL/重试/跳过；r2只增加原stage副本和父码采集，不改Oracle、产品或r1freeze。探索`rg`不存在exit127、memory路径不存在exit1、等待r2-parent暂未生成的cat exit1保留在工具原记录，不是产品失败。runner语法检查实际exit0；最终seal/diff结果见封存。

## 保护、封存与释放

每轮保护21092记录：A13/A14全部声明输入和453+453产物/全部lib、合同/原归档/main组件/原stage测试、前专家整个前缀（含各freeze/原证）；依赖保护20007记录含原物理依赖/链接目标及**新testdeps整个根含cache/home/tmp/lock**。主树lib/.vite共488、冻结src397记录（含目录）。r1/r2前后新增/删除/内容或mtime变化均0。A14来源`/private/tmp/pmtool-a14-closure-20261022`，515声明输入，candidate SHA `f89160400a28ba78af722303c01fe9caf3f596657b3d9767f4984a3569d85284`。

本前缀内raw-stages副本是证据，不是未回收产品stage；产品files/staging最终清空。未WATCH全用户HOME/正式业务或A16树，不声称整机零污染。源码freeze只读不重建，A16 Main新build不与本角色重叠。封存脚本回读reporter、rawstage、Probe顺序、domain初末、前后及当前保护，并生成本前缀索引，不覆盖原证。首seal已生成1382项索引，diff exit0、runner/collector精确前缀查询exit1/空输出；首工具父码未返回不补造。追加seal-final及seal-final-command记录完成后的文档指纹和封存实际exit，不重跑业务测试。

只写本前缀；没有fetch/pull、install/build、改product/manifest/lock/原expect/其他testing/livingdocs、GUI/services/credentials、shared cache/lib或commit/push。本角色报告后释放，不持有builder/GUI/服务资源；Main继续既定A16唯一新build及其他积压门，不能把本有限PASS变成A16或全门放行。
