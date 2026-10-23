# RA-F02 StrictMode SOURCE/AUTO 限定先行计划

> 给 Main 与独立验收接续者使用；平台 trae，独立 RA-F02 AUTO 角色，2026-10-22。先读本计划，再执行本前缀冻结测试及审签；不是产品开发计划。

## 授权与边界

负责人原句：

> 独立RA-F02 AUTO补验，非产品开发。只写docs/testing/a15-f02-strictmode-auto-20261022*；不产品/其他testing/livingdocs/build/install/GUI/services/credentials/commit。读AGENTS/collab/remaining-journey F02、docs/testing/a15-file-fault-gui-review-20261022.md §最小补件、现有client/shared/task-draft-materials-stage.test.tsx与真实TaskDraftMaterials/stage-client/asset-routes/file-staging。用户持续验收独立分工授权。先写限定先行计划：独立复验已有真实组件四条stage清理/迟201/失败busy恢复生产domain，不用自建模型；新增真实StrictMode重复挂载effects清理/AbortSignal/旧迟201不publish/stage真实DELETE/新挂载可save；React-test-renderer的<StrictMode>是否实际双effect须实观计数不宣称自动双；可用既有jsdom/真实ReactDOM createRoot（无GUI浏览器操作）才证明strict effects，未具备能力诚实BLOCKED而不臆造。新tests仅自有冻结与本前缀，不改产品/源测试expect。源码用已签A13 freeze（TaskDraftMaterials与当前main同hash），完整freeze/no-cache/单fork/HOME/TMP/cache白名单既有deps，不写共享cache/lib。核真实接口与stage/rawdomain/sidecar/保护前后；命令原exit/reporter记录全部失败。仅签F02 SOURCE/AUTO子范围，不签GUI/inputbusy实际属性/整门；Main继续唯一GUI补busyprobe与导入fixture，不重叠。结束报告释放，当前A16仅panel开发不归你。

依据 AGENTS §6A、collaboration §9/11、remaining-journey RA-F02，以及 a15-file-fault-gui-review §7。此次明确范围优先于通用 fetch/pull、install/build、完整产品回归、livingdocs 和 commit 步骤。既有脏树及他人在途内容只读；不加载 vendor skill、不增加功能。

## 对象与文件

- 产品唯一来源：`/private/tmp/pmtool-a13-closure-20261022`，按 `reports/all-pending-evidence-20261021/A13/candidate-final.json` 全部 sourceHashes/artifacts 核验；基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，dirty 身份绑定原 patch，而不是当前 HEAD。
- `TaskDraftMaterials` SHA `66af8221d089a2ad65fa4d831be218c4a78d3299c23239cfaf750497c4edc2ae`；现有 stage 测试 SHA `95992aef68f8a97f92137a5574b215fcad760246495317c2f383c52907b7b7a8`，开工时均与 main 一致。其余源码只认 A13，不混入 A16 panel。
- 仅新增本前缀 `-plan.md`、`-cases.test.tsx`、`-run.mjs`、`-selftmp/rN/**`、最终 `.md`。自有冻结中的原测试逐字复制，不改其 expect；新增测试只在本前缀。
- 只读既有 A13 依赖；不 install，不写依赖树、共享 `.vite`、`lib`、用户 HOME 或正式 data/files/backups。运行环境采用 Node 22 精确路径；不调用 pnpm。

## 步骤与 Oracle

1. 核真实接口：组件调用 stage-client 的 POST（无 task-id、URI 文件名、AbortSignal、same-origin/no-store）与 DELETE；网络适配器调用真实 asset handlers，不注入 attach/resolve，也不自建业务模型。生产 JSON backend/DomainFacility、pmDomainSpec、addProject/addTask、readStage 使用自有根。
2. 先核 A13 全声明输入/产物，复制完整声明输入及全 src 到自有 freeze；保存基线、原 patch、输入 SHA、依赖版本/指纹、冻结清单、前态保护。
3. 单 fork、`--no-cache`、默认及 JSON reporter 复验原四条：成功 stage 卸载清理/保存后不删；真实 handler 已产生201但 continuation 迟到；旧组件迟到与新组件隔离；失败恢复 busy/错误并重选。记录原终码及全部失败，不把原四条全绿扩大为 Strict effects。
4. 新增 renderer 能力探针：同一个真实 React/useEffect 在 `<StrictMode>` 下记录 setup/cleanup/render 次数及实际卸载计数；不 spy/替换产品 hooks。没有实观双 setup 与中间 cleanup 就不称自动严格 effects。
5. 在 `<StrictMode>` 包裹的真实组件上显式卸载、重新挂载：受控在途请求观察生产 AbortSignal；先让真实 handler 产生201和 stage bin/sidecar，再保持 continuation；旧卸载后新挂载上传可发布，释放旧201不得 publish，生产 DELETE 回收旧 stage。保存新 envelope 必须调用真实 addTask；raw JSON 解 `{version,record}`，核唯一任务/单附件/file_asset/最终字节/已消费 stage 零残留，成功 submissionRef 后卸载不删资产。显式重挂与自动严格 effects 分开签。
6. 新增失败/重选保存：只在传输层拒绝，生产组件错误/busy props/input ref 重置、零任务/资产/stage 写；同文件重选后真实201和主 domain 保存。props 是 AUTO，不签浏览器 input 属性。
7. 能力门：仅已有 jsdom 加兼容真实 ReactDOM createRoot 可证明自动 strict effects。若现有依赖没有 DOM 环境或版本不兼容，不安装、不搭 fake DOM、不假称 renderer 双 effects；自动 strict effects 明记 BLOCKED，其余真实生命周期 AUTO 单独结论。
8. 每轮保留 stdout/stderr、命令 argv/cwd/白名单 env/start/end/exit/signal、JSON reporter、case 原始 stage/request/publish/raw/根清单；失败保留原件，新轮不得覆盖旧轮。终核 A13/输入/依赖/共享 cache 与 freeze 前后，另列并发 main 变化与测试设施污染的区别。

## 执行与停止

预计命令（macOS，Node v22.23.3，仓库根）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a15-f02-strictmode-auto-20261022-run.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a15-f02-strictmode-auto-20261022-run.mjs r1
git diff --check -- docs/testing/a15-f02-strictmode-auto-20261022*
```

- 冻结/真实接口/已有依赖无法满足则相应项 BLOCKED；产品断言失败开给开发，测试角色不改产品补绿。
- 禁止读取凭据、连服务/GUI、build/install、修改原测试、修改任何非本前缀或停进程。
- 最终报告仅签 RA-F02 SOURCE/AUTO 精确切片，自动严格 effects 的能力缺口不转 MANUAL_PENDING；GUI忙态探针、真实宿主迟201、导入 fixture 仍由 Main 唯一执行。没有本角色全 GUI、RA-F02 整门或发布签字。
- 执行、终核和报告结束即释放；不启动 A16 或其它产品开发，不越权同步 livingdocs。

## 状态

- [x] 授权/合同/真实接口与原测试已读，限定计划先行落盘。
- [x] A13 完整认领、自有 freeze/环境与保护：514输入、453产物；r1/r2/r3保护均零差异。
- [x] 原四条独立复验及 renderer 实观计数：三轮4/4；实际挂载只有1 setup，无自动双effect。
- [x] 新增真实生命周期、迟201回收、失败重试/domain保存补验：r1扫描器ENOTDIR原失败保留；仅修自有扫描器后r2/r3四条通过，r3父exit0实录。
- [x] strict effects 能力判定与有限报告已完成：无jsdom/兼容createRoot，自动严格effects为BLOCKED，不冒充通过。
- [x] 最后seal保护回读exit0、保护零差异、runner查询exit1/空输出；有限报告后释放，追加final封存不再执行业务测试。
