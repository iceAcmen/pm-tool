# 任务与人员合并候选唯一构建计划

2026-10-23，trae，Main。父全部已实现未验到普通提交，现只合已确证修复；不新增能力。主包及旧正式服务不承载该构建，所有输出在新的冻结根。

**候选：** 旧`CombinedF02RepairR2`完整525输入为父锚，合L8、首读、O4/stale、姓名与人员轴两源最小修。每项须开发真实released与独立SOURCE结论实读；人员轴独立仍在途时不冻结。当前源声明数待最终实核，不把前127/528当新全候选。

**文件与设施：** 产品仅已认领的`gantt.tsx`及测试、`panel.tsx`及首读/transport/confirm测试、`people.tsx/css`；/tmp执行器`pmtool-combined-tasks-people-executor-20261023-r1.mjs`负责冻结/构建/回归，/tmp新宿主模板负责3271独立实例。原检查scheduler、checklist document prerequisite、C02适配及报告专项oracle沿原有效设施，不自行改产品测试预期。

## 执行顺序与计时

1. 实读所有独立报告及真实seal/readback，最后一次核主源与旧完整输入delta。将完整delta名字、每个after bytes/SHA及新独立报告SHA写新证据根`CombinedTasksPeopleRepairR1/authorized-source-delta.json`，仅此对象自建、不覆盖旧证。冻结前守卫先核全部delta和报告指纹，失败立即停、记录真实错误，不进行半途依赖复制。
2. Main唯一执行`freeze`：隔离复制全部当前源、旧锁定依赖及upstream有限只读封件；依赖使用写时复制建议但仍逐bytes/SHA与独立inode核，软链重定位只在自有树。旧docs/vendor作为原验证fixture冻结，不把它们称当前livingdocs。新root不能复写。每依赖复制、阶段计时另记，父子不加总。
3. 依次`tsc`→`bundle`→`noemit`；full/DOM两suite可在各自cache/输出下并行。报告专项`special`需full生成既有合法夹具后再跑；不能重犯“专项先跑”缺输入。全部95 verify由`verify-isolation`跑完聚合，再`guard`；失败保原终码，不签完成，不盲重复已绿项目。
4. `close`实核全部当前源/旧主lib/旧冻结lib、三依赖树、launcher及专项输入不变；实核所有command终码0，落built-artifacts/close。封件和独立完整回归审证后，Main才用新3271模板启动，记录精确PID/argv/profile/产物/开关及私有入口。空库/标准备份预检明确恢复与后续浏览零写分开。
5. 同候选原GUI：任务首读至少3秒真实hold、失败重试与合法空成功；O4确认ESC保稿/Enter归焦、stale四宽/历史错误语义；人员F1/FL长名同段及MAX10入镜、FD四宽每宽先真实回顶后top/展开/轴。按原合同采，不自签PASS；独立审原证后继续原全部native/B8/旅程/继承。

运行环境macOS、绝对nvm Node22.23.3；pnpm11.28.5仅为既有环境，本冻结设施不安装依赖。逐阶段可复制命令（在仓库cwd；**先源门齐及authorized delta准备好**）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-executor-20261023-r1.mjs freeze
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-executor-20261023-r1.mjs tsc
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-executor-20261023-r1.mjs bundle
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-executor-20261023-r1.mjs noemit
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-executor-20261023-r1.mjs full
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-executor-20261023-r1.mjs dom
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-executor-20261023-r1.mjs special
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-executor-20261023-r1.mjs verify
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-executor-20261023-r1.mjs guard
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-combined-tasks-people-executor-20261023-r1.mjs close
```

长阶段不用55秒同步外层计时器包裹；执行器内部已有真实command/phase计时，终端session有界读取可持续沟通，未结束不伪填退出0。该计划不将构建绿称GUI/整功能完成；全部适用独立门齐才父ordinarycommit，未授权push/release/正式切。

## 11:40实际回归封交

全部源已released、人员两源独立SOURCE及末回读0实收后，Main认领source129/complete528；八delta与预期一致，freeze45.285秒exit0。完整tsc/bundle/noemit退出0；full163文件1721绿、coverage退出0；special两文件7绿、guard退出0。

DOM原41绿但首读/confirm两个collector因`createRequire`绕过ESM alias找不到jsdom而exit1；只在自有Vitest补片将这两测试的require锚指向现已冻结dom-deps，**原测试/源/依赖/断言不改**，只续两未执行组9+11=20绿，合61。原失败/原输出保在`dom.*`，补片在`dom-new-facility.json`，不能称原DOM一次全绿。

95verify原94绿，唯一P0的80ms异步裸done反思未到而失败；全并发结束后按**同一未改原脚本、同env**串行只复该项28/28绿、保护零变化。合95有效结果，因果尚未独立判定，不写成已确证负载根因。`verify.*`原exit1及`verify-p0-r2.*`exit0全保。后继应将此计时敏感脚本安排串行，少量补测不能据此新改产品或提高超时阈值。

`close`真实exit0，主源、主lib、旧冻结lib、三依赖树与launcher均同，455产物实核；command保DOM/verify原1和两个后继0，两个effective文件说明补链，不篡改原命令结果。1869文件/软链目标封存，实际子readback73712exit0/rereadtrue，seal0999eba9/indexfdcf43ae。封存首次猜旧seal路径1、随后原测试软链被设施拒1均留计时；改为封软链文本不随链读外域，未改负例或删临时成果。

原完整回归r1计划角色已finished，send明确拒后新同域独立r2 `arun_6adad6dd7cfef4f845ad78b1`审封件；不冒原角色仍在途。暂未启动3271，当前旧3270/正式保持。P26独立20完整候选对旧Combined有效但新候选待重绑、其余6原项明列，不据此修改当前精确percent。下一收独立门→新宿主及原真实GUI，父全部适用至ordinarycommit持续。
