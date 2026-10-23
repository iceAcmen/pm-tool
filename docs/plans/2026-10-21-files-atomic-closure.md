# 文件原子提交与取消缺陷收口

> Main执行，开发分域，独立专家先行合同已在`docs/testing/materials-files-reports-independent-auto-20261021-findings.md`记录生产红例，后续补精确验收。负责人持续修/验/最终commit授权见`reports/all-pending-acceptance-execution-20261021.md`；不push/发布/切正式。2026-10-21，trae。

关闭MFR-F01..05既有文件流程确定缺陷，不增新功能。Main独占`core/file-assets.ts`、对应测试、`client/shared/task-draft-materials.tsx`及新真实组件测试；领域开发独占`core/tasks.ts`、必要`file-asset-store.ts`、`task-materials.ts`与相关测试。`task.ts`仍OP开发所有，panel/views/board不在此单改动范围。

1. **F01 根和祖先**：读取/写入内容寻址路径均检查根、现存祖先及最终节点，拒symlink/越界；合法macOS `/tmp`父别名须按实际根归一，不误封所有临时根。校验错误不吞权限失败；目录创建后再次核目标归属。不更改类型/大小白名单。
2. **F02/F03/F04 同事务文件**：add/update共享最小prepare+ops接缝，文件alias须在progress refs之前映射到最终真实at-ID，同hash两个alias不造重复资产；基本字段/纯ops/文件prepare/记录schema及DB发布均覆盖补偿。失败不留新最终字节、不删旧共享资产、保stage供重试，成功才finalize；仍一个显式主命令，不拆二次业务写。
3. **F05 迟到取消**：真实TaskDraftMaterials挂载/上传代际守卫，abort/unmount后的201迟到仅安全回收stage，不publish/setState；finally不清另一在途请求。真实主提交已消费资产卸载不得DELETE。保输入/失败重试，不增加假loading成功。
4. **先红后绿**：使用专家真实领域worker/组件红例及生产组件/Context隔离测试，记录准确exit/前后DB+字节manifest；校验成功、失败后重试、partialprepare、sharedhash、unknownalias、当前/迟到/commit-success等。依赖只读现有隔离node_modules，各自tmp输出不build共享lib。
5. **集成出口**：Main唯一精确同步隔离树、重新build/全量/全部verify；新候选产物/实例与GUI采证后独立专家复验。其他已有SOURCE/AUTO按依赖diff判断继承，旧在途源不覆盖/删除。

二次restore幂等和selectedRefs旧revision为另列合同差异，先核已生效B6/资料规则，不把历史版改选latest偷换原用例，也不把测试提议自动升级产品规则。上述五确证项可独立推进。
