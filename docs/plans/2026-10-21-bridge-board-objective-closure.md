# 回告、看板与客观进度确证缺陷收口计划

> Main负责最小产品修复/唯一构建/GUI采证，独立专家另判。负责人持续执行与最终普通提交授权见`reports/all-pending-acceptance-execution-20261021.md`；不重新询问已授权修复，不推送/发布/切正式。

目标：关闭已实现功能的确定缺陷，补原有合同，不启动U4或暂停功能。环境macOS、nvm Node22.23.3、pnpm11.28.5，主树源码认领并精确同步`/private/tmp/pmtool-all-closure-20261021`；该隔离树Main唯一builder，主树lib/profile/upstream只读。

## 1 跨旅程客户端回告

依据`docs/testing/reopen-handshake-diagnosis-20261021.md` §5与四红例R05..08。修`src/client/launch-handshake.ts`，令成功/在途按port+nonce分别归属，旧成功不清新hash、不把旧结果当新成功；同token并发合并仍保。选最小逐token内存状态，明确旧finally不清新flight，不存凭据。

修`src/client/panel.tsx`真实挂载/成功snapshot接线：新合法hash在已就绪PM范围触发真实回告或必要refresh，失败snapshot不回告，卸载移listener，业务hash不发。不得在index全局装载冒充挂载。

测试：扩`src/client/launch-handshake.test.ts`四红和已有正控制；新增`src/client/panel-launch-handshake.test.tsx`执行真实PmPanel（用当前react-test-renderer依赖或真实DOM包，不自建假状态机），覆盖同实例N2、旧N1在途、成功/失败snapshot/卸载/重复业务hash。先红后绿。仅确证缺陷与生产接线；不扩大认证、TTL或宿主。

## 2 看板显式拖动与同值显示同步

依据`docs/testing/board-fullwidth-drag-diagnosis-20261021.md` §7及专家六全宽fixture。修`src/client/board/editor.tsx`，必要小函数抽到`editor-ops.ts`；在实际拖动意图与碰撞排序上保留移至D之后的A，并保证松手后RGL稳定显示=canonical草稿，包含归一结果等于旧props。优先评估已有RGL垂直策略与显式意图函数，不用被动onLayoutChange写回、延时、对象克隆掩盖同步；不改schema/persist/projection/CSS/依赖版本。

新增`src/client/board/editor-drag-stop.test.tsx`真实BoardEditor+RGL多帧：六卡与两卡碰撞链、同值/不同值props、高度、一次历史、三动作三undo与被动ResizeObserver不写。扩既有`editor-ops.test.ts`/`editor-compact.test.ts`仅必要明确不变量；先红、再最小修。

真实GUI按原1440浅100%与标准导入/save重进：A到实际D下方（留drop相对bbox）、B初始A区、同A返回上部，完整无遮挡录像/每态stageHeight/导出坐标；三逆序undo，另两拖save/reload及一拖cancel/reload。只dashboard_user写，其他全键集保护；旧三态异常不覆盖。

## 3 客观/人工双轨与证据协议

依据`docs/testing/objective-independent-auto-20261021.md`三P1与`remaining-objective-cases-20261021.md`、ADL-055。

修`src/client/views/tasks.tsx`、`views/overview.tsx`及必要panel消费接线：客观进度/coverage取真实派生，display按人工mode；无清单显示证据不足，legacy仅旁注，父项不平均中间层legacy。`views/gantt.tsx`按客观/null/人工70三fixture接display/mode，客观真源不被人工覆盖。

修`src/core/task.ts`相关create/update输入schema中evidenceUrl协议与前端http(s)一致，旧record读取/备份仍兼容；非法新写必须零写，不为了输入校验重写合法旧库。对应任务meta/派生/视图现有测试与新精确回归先红后绿；领域用专家合法F2真实动作或标准backup，实际expected见报告§5。

OP GUI四消费点人工30/0/清除、todo清单100不自动done、wrapped排除/还原、工时3.5/非法协议拒绝、完成日期/反转及持久。另空隔离目标，不能覆盖QA-A/F7在途。

## 4 共同验证与交接

1. 每组先看完整相关源与专家原证，写红用例，修最小接线；追踪共享panel影响，不顺手改其他模块。
2. 精确同步源码，Main在隔离包运行针对性vitest与`pnpm run build`，认领新候选全部tracked/new源码及产物/lock/version；旧A5 Launcher有限AUTO按diff交专家继承。
3. 新bundle须新的合法运行实例/实际下发身份，不能把仍加载旧模块的3205/3212当修后产品。新端口/home/files/backups，记录精确PID，不改pm软链/正式。
4. 独立专家按先行合同复验，Main采真实GUI原证/逐命令exit。确证失败继续修，不将NOT_RUN/BLOCKED转PASS或为提交删成果。
5. 最终各域全部适用验收、全集build/tests/coverage/all verify/专项/真实模型边界、保护资产与档案同步后统一普通commit；不提前收工。当前大型剩余矩阵/文件/治理旅程仍待完成，计划不代替验收。
