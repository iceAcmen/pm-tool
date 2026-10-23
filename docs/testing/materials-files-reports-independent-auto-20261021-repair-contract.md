# 即时先红合同与最小修复范围

> 2026-10-21，独立测试专家，给 Main 并行修复。仅本专家自有真实 AUTO；不判 GUI。基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3` 加第二轮未提交 source/patch。原证根 `materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-1XffrJ/`，`candidate.json` 保存完整 tracked patch/newFiles/deps，自有编译 `own-lib-sha256.json`。现有 A0 lib 未使用。第二轮仅 tasks 视图漂移，不签该消费点。

## 冻结指纹

| 生产 src 相对路径 | SHA256 |
| --- | --- |
| core/tasks.ts | `4762df5302a56f7934ab08459380d6ca4027be0f70e7d9204ed2e6072e4cc27d` |
| core/task.ts | `ad71b6d1b26e386e297c8f3c6a555252772c5247ab94b3ceec89c787eb21646b` |
| core/task-materials.ts | `bb18d02ecff443e80c7dbeca4cce17a79f61a59423f9706584f614e78d8710b9` |
| core/file-assets.ts | `23a7417bc33230ccbf1499e4cefb36cff30d70e56d19fdeedf7513a86f96d40e` |
| core/file-asset-store.ts | `b013acf44529e95fa425d73d6556e553f32e40a6e922a12aea53b996891f24d3` |
| core/file-staging.ts | `57f95fb58c0315bab73b568b205670e425707ba0fd10a38168f17399815e30db` |
| commands/material.ts | `15ef8594b8f9fde5dd00ceb8c0d7f99b7fede526decd605064fda76154b7b959` |
| commands/progress.ts | `8729a758a9be14a11784dd2f934807e2f27d63255d79f45208d730aa3d76f71d` |
| core/progress-reports.ts | `279b6ca7a41b4ccabe88a59340a631751a53d864726c47eafd81e1b759813d0b` |
| client/shared/task-draft-materials.tsx | `1149a096210394c88c573a480499fe2a0efe585da2b5185dcf7efa0c7b8619d0` |

## 五个确证 P1

真实 Cordis/JsonStorage/DomainFacility+生产 schema，不 fake domain；所有字节均自有 tmp。冻结 `worker.mjs` 与 `component.test.tsx` 在第二轮自有 package；最新版同名前缀脚本只修测试设施/追加覆盖，原红保留。

1. **MFR-F-01 / RA-F03**：`validateUploadedFile({originalName:'ancestor.md',bytes:Buffer.from('unique ancestor qa')})`，在 root/hash前2目录建指向同自有 tmp 外部目录的 symlink，调用 `storeAssetBuffer(root,v)`。前 external 空；后写到 external/完整hash.md，未抛。先红 `RA-F03/AUTO-parent-symlink` 断言 `FileAssetRejectedError` + external仍空。最小改 `file-assets.ts` 的真实根/祖先路径检测；写/读/复用均不能跟随祖先 symlink，不删共享正常资产。
2. **MFR-F-02 / RA-F01、RA-M06交叉、RA-J03**：真实 stage→`addTask(domain,{projectId,title,draft:{attachmentOps:[{op:'addFile',stageId,clientId:'c-file'}],progressOps:[{op:'add',author:'甲',content:'引用真文件',refs:['c-file']}]}})`。应生成单任务/真实at-ID且refs精确指向；实际抛“c-file不在本任务当前资料区”，准备时已写最终字节。先红 `RA-F01/AUTO-file-alias`；补成功alias、两同hash不同alias解析同最终at-ID、非法alias全批零写。最小 `tasks.ts/file-asset-store.ts/task-materials.ts` 计划映射接缝，不能靠第二条补写冒充原子。
3. **MFR-F-03 / RA-J03、RA-F01失败分支**：stage内容 `atomic last bad unique`→`addTask` addFile + progress add空author。实际抛作者错误，DB/原data全相等、stage保留，但 files新增 `df/df96c651a37a62f4030ddfad913cbfafed2540c71de29c2ecfaf3f3bc4880ca5.md`，22字节。原证 `results.json` 的 `RA-J03/AUTO-atomic-failure.actual/expected` 精确全内容。先红要求除原stage外DB/data/files全零写；故障后合法改正重试成功一次。最小补偿 try 覆盖准备和pure校验；只撤本次新字节，不删原共享hash。
4. **MFR-F-04 / RA-F01编辑、RA-J03**：stage→真实 `handleTaskCommand('update T '+JSON.stringify({title:'编辑加文件',draft:{attachmentOps:[{op:'addFile',stageId}]}}),domain)`。前已存task有稳定材料/history；实际error“未知资料操作：addFile”（宿主命令返回generic错误），task未改。先红 `RA-F01/AUTO-edit-file`，成功应同一次basic+file提交、旧数组不丢、stage消费；坏basic/坏op/落盘失败均零写且可retry。最小 update接入文件计划临界区，不改为即时attach后basic两阶段提交。
5. **MFR-F-05 / RA-F02、RA-J03取消**：真实 `TaskDraftMaterials` + 真upload路由201生成stage，fetch只延迟continuation；组件卸载后放行已成功response。实际 `onDraft`调用1次（应0），无DELETE回收（应1），真库仍无task/file_assets。先红 `RA-F02/component-late-success`（第二轮6例5绿1红）；取消stage而非final资产。最小组件成功分支mounted/abort代际守卫、迟到stage best-effort回收和finally守卫。同时保已成功主save `submissionRef=true`卸载不DELETE、网络拒绝busy恢复、正常cancel remount无残留三绿。

## 合同差异，不擅改期望

- **RA-M03**：softDelete保全四版、首次restore稳定ID/全部revision已绿；二次restore返回error“未找到可恢复的进展条目”。`RA-M03/AUTO-idempotent-retry`先红仍要求成功且零写。Main先按剩余合同核定幂等适用；若实现修复，只允许同已存在active条目幂等，unknown entry仍拒绝。
- **RA-R01 / RA-J04**：F3 E1=`rv1/2/3`active。`selectedRefs:[{taskId:T,entryId:E1,revisionId:'rv-2'}, {taskId:T,entryId:E3,revisionId:'rv-1'}]`实际拒“现最新rv-3，请重新预览”；真实历史 `excerpts`完整匹配正文/作者/日期直路径成功。旧B6冻结曾明确 stale selectedRefs拒绝，现余单要求主动选择历史rv2，两者含义须核。**不把新合同自动降为latest、不把显式历史与过期preview混同**。先红 `RA-R01/AUTO-selected-historical`原expect保留；只有明确合同裁定后才变业务，不在本专家自改预期。

## 复验边界

Main改产品并交 source diff/sha；本专家重新独立冻结编译，按先红+受影响材料/文件/report真实负例重测。task.ts OP改动导致跨schema失效须核；build/启3214..3217由Main唯一执行，本专家不碰。F3/F4/F5包继续标准预检后交，不需要等待整份报告才能修这五项。
