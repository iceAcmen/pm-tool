# F02 自动 StrictEffects DOM 独立补验计划

> 记录限定测试合同，给 Main 和独立接续专家引用；2026-10-22，平台 trae，独立 SOURCE/AUTO 测试角色。先计划后冻结执行，不是开发或 GUI 计划。

## 授权

负责人原句：

> 独立F02自动StrictEffects DOM补验，非开发。只写docs/testing/a15-f02-strict-effects-dom-retest-20261022*；不product/其他testing/livingdocs/GUI/build/services/credentials/commit；不install/sharedcache/lib。用户持续已授权验收，Main为解决前专家工具BLOCKED已在完全自有/private/tmp/pmtool-f02-dom-deps-20261022安装react18.3.1/react-dom18.3.1/jsdom25.0.1 --ignore-scripts、lock与npmexit0原日志见reports/all-pending-evidence-20261021/A15/f02-dom-deps。不改产品manifest/lock，隔离依赖只读可用。读AGENTS/collab/remaining F02、a15-f02-strictmode-auto报告/plan/cases/run及r3原证。先写补验计划后真实完整A13src自有freeze同主TaskDraftMaterialhash66af...；用兼容同一React18 module alias指向该新依赖与react-dom/client，不混原react19。JSDOM+createRoot+<StrictMode>真实DOM挂载，计Probe setup/cleanup/setup/最终cleanup（Probe不是产品替身，仅证明renderer能力）。生产真实TaskDraftMaterials、stage-client、真实asset-route/JSON domain，只fetch传输适配失败/延迟，不mock产品hook或自建状态模型。自动effects replay后真实input change File→忙态/错误/重选、真实server201后unmount/late continuation→不publish/DELETE/零taskasset；新mount成功domain保存→finalize/submissionRef卸载不删；至少保原四条及上一新增有效测试/必要对照，单forkno-cache白名单env自有HOME/TMP/cache。ReactDOM act/DOM event可靠性先控制再判产品，所有失败原码保，不能把显式unmount/mount冒自动strictreplay。如产生真实产品FAIL先先行合同证据不自修。独立SOURCE/AUTO有限结论，GUI忙态属性已有Main补件另一专家审，不签整GUI/新A16/全门。保护A13/A14lib/声明输入、原前专家所有文件、共享依赖cache+新testdeps只读；精确command/reporter/原exit/rawstages/manifests/效果计数，报告释放。Main继续A16唯一新build等待独立结论，不重叠。

依据 AGENTS §6A、collaboration §9/11、remaining-journey RA-F02、前专家报告与 r3 原证。当前范围明确覆盖通用拉取、install/build、livingdocs/commit步骤；脏树只读，不清理他人成果。未加载 vendor skill。

## 对象与隔离

- A13 `candidate-final.json` 认领的 `/private/tmp/pmtool-a13-closure-20261022`，全部声明输入/产物核 SHA；完整 src 和声明输入逐字复制到本前缀 `-selftmp/rN/frozen`。不复制产物，不 build。
- 组件 SHA 必须为 `66af8221d089a2ad65fa4d831be218c4a78d3299c23239cfaf750497c4edc2ae`，冻结前/后核 main 一致；不混 A16。
- 原四条及前专家四条逐字复制执行，保留原 expect。其 renderer 依赖仍用原兼容 React18，DOM 子命令则单独将 `react`、JSX runtime、`react-dom`/client alias 到新隔离依赖中的同一 React18 实例，不用 react19。
- 只新增本前缀 `-plan.md/-run.mjs/-cases.test.tsx/-selftmp/**/.md/-seal*`。运行子进程单 fork、单 worker、不并行、no-cache，白名单 PATH/HOME/TMP/XDG/npm/Node cache/CI/LANG/TZ/证据根，不继承凭据或正式根。
- 只读保护 A13/A14 声明输入和全部 lib、前专家所有前缀文件、原依赖及链接目标/共享 cache、新依赖整个根。Main A16 输出不是本角色写根；不以其合法并发变化判设施污染。

## 用例与 Oracle

1. **保留回归**：原 stage 四条、前专家 r3 补验四条，独立子命令与 reporter，观察/显式重挂结论不扩大。
2. **DOM-C01 能力控制**：JSDOM 后加载 createRoot；真实 React18 Probe 旁置真实产品，StrictMode 挂载返回前必须实观 `setup/cleanup/setup`，显式最终卸载才追加最后 cleanup。另不包 StrictMode 的对照必须只有 setup/最终 cleanup。Probe 不替产品、不改 hooks。
3. **DOM-C02 事件控制**：真实文件 input + 同一 React onChange，对 DOM FileList fixture 注入真实 JSDOM File 并 dispatch 冒泡 change；事件一次、文件名字节正确、busy DOM 更新和恢复可观察。只控制工具，不自建业务状态模型。
4. **DOM-F01 错误/重选**：同实例自动 replay 已发生后，真实产品文件 input change；只传输 Promise 失败/延迟，观察 disabled、忙态文案、错误、input value 清空；空 files change 零请求；同 File 重选真实 handler 201，仅一草稿。真实 addTask 一次，raw domain 单任务/附件/资产和最终字节一致，stage finalize，submissionRef true 最终卸载不 DELETE。
5. **DOM-F02 迟201**：自动 replay 后真实 input 上传，真实 handler 收字节生成201及 bin/sidecar，先 hold 客户端 continuation；此时任务/资产零。显式真正卸载 abort；释放旧201不 publish、生产 DELETE removed=true、bin/sidecar清零、业务不变。挂载前 replay 和此显式卸载分开记录。
6. **DOM-F03 新挂载隔离**：旧实例真实201 hold后真正卸载，新实例同样自动 replay；新 File 上传 publish并主 domain save；释放旧201只删旧stage不 publish、不删新资产。新 submissionRef true 卸载保盘；全部效果计数明确实例 owner。
7. **DOM-F04 未提交stage清理**：自动 replay 后正常201+草稿，未主保存真正卸载，真实 DELETE 清 stage，任务/资产零、项目data不变。

记录真实请求字节/头/AbortSignal/handler响应、stage ID/sidecar/bin SHA、初末domain/raw文件清单、publish owner、DOM状态、Probe计数、console、最终保存/finalize。网络适配只调用真实 asset routes；认证为合法宿主 gate fixture，不签鉴权/实际 HTTP。

## 判定与停止

- 先控制再判产品；能力/事件控制失败记 BLOCKED，产品失败不得被绿色回归遮蔽，先留原合同和证据，不改产品。仅允许修本角色设施，并保留失败轮/新建轮次。
- SOURCE/AUTO 只签当前冻结精确切片；JSDOM DOM属性不冒充 GUI/native chooser/浏览器视觉/实际宿主3秒延迟，不签 RA-F02整门、A16或发布。
- 每轮前后 manifests 与原 exit、stdout/stderr、default+JSON reporter 记录；不覆盖原轮。最后核保护、封存索引和报告，释放本角色。

## 命令

运行环境 macOS + nvm Node v22.23.3，pnpm11.28.5为项目约定，本轮不调用：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a15-f02-strict-effects-dom-retest-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strict-effects-dom-retest-20261022-run.mjs r1
git diff --check -- 'docs/testing/a15-f02-strict-effects-dom-retest-20261022*'
```

## 状态

- [x] 合同、前专家计划/报告/代码及 r3 原证已读，计划先行。
- [x] A13完整冻结和保护认领：514输入/453产物，另保护A14 515输入/453产物。
- [x] 原八条保留回归与DOM能力/事件控制：r1/r2每轮14/14，全子exit0；自动setup/cleanup/setup控制成立。
- [x] 真实产品DOM StrictEffects补验、失败归因：无产品或设施失败；r2补原stage副本且collector实录runner exit0，r1父终码未返回不补造。
- [x] 保护终核、有限审签、报告释放：保护21092/依赖20007/shared488零差异，首seal回读原证1382项；最终追加封存不重跑产品，GUI/A16/整门未签。
