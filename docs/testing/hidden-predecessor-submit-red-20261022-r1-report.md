# 隐藏前置关系真实保存独立必要红报告

> 2026-10-22，trae，HiddenPredRedR1，独立测试先行、非开发、非 GUI。**TPC02 / P1 / FAIL_NECESSARY_RED，RELEASE_STOP**。原源红交 Main，由非本角色开发统一 panel 一次最小修 TPC01+TPC02，再由另一专家复验；本角色 STOP，不提交、不签修后或整项 PASS。

## 结论

**TPC02 不只是 FormData 丢项：已确证真实 TaskForm 主保存 → run 原命令 → 原 handleTaskCommand/core → 内存领域写入及回读，隐藏的既有 t2 关系被清除。**

- 初始合法已有 t4.predecessorIds=[t2]，全部同 p1、无自身/无初始环；通过原 addProject/addTask 创建及 taskWriteSchema 校验。
- HPS-N01：搜索“候选任务1”，DOM 只剩未选 t1、footer 仍“已选 1 项”；只改 title 后真实点击“保存更改”。一次原生产 submit 发 `task update t-0004 {...,"predecessorIds":[],...}`。
- HPS-N02：搜索无匹配、所有选项隐藏、footer1，同样真实主保存，payload=[]。
- 两条真实 handler 均 `kind:success`；各一次 tasks/t4 put，写前 predecessorIds=[t2]，写后该键被删除，`getTask` 回读无 t2；各一次 onSaved。标题更新成功、表单未崩、其余实体不变。
- **仅能称真实 handler/core 在内存存储中清除了关系**。本轮未接 storage-json、未落业务 JSON、未重启回读、未测宿主 run 全链/GUI；不能声称正式数据或磁盘持久化已经丢失。run 是捕获命令并接真实 handler 的薄接线，onSaved 等只是调用边界记录，不冒整个 PM shell 关闭成功。

原 C02 的“未 submit”边界保持原样，本报告新增后续提交证据，不覆盖原报告。原 TPL/TPC 七项 **2 控制绿、1 控制失败、4 崩红**未重跑。本轮未点击任何 checkbox，全部 console/window/component 错误为空，没有触发 TPC01 `null.checked`。

## 实际结果

| 用例 | 结果 | payload / 真实 core 回读 |
| --- | --- | --- |
| HPS-C01 无搜索、只改标题、主保存 | CONTROL_PASS | [t2] / [t2] |
| HPS-C02 隐藏后清空搜索恢复、主保存 | CONTROL_PASS | [t2] / [t2] |
| HPS-C03 搜索仍显示已选 t2、主保存 | CONTROL_PASS | [t2] / [t2] |
| HPS-N01 只剩 t1、隐藏已选 t2、主保存 | FAIL_NECESSARY_RED | [] / 缺键（关系清除） |
| HPS-N02 无匹配、全部隐藏、主保存 | FAIL_NECESSARY_RED | [] / 缺键（关系清除） |

Vitest **1 文件、5 实例、3 控制绿、2 必要红、0 skipped，exit1**。两条红均先达到 submit/handler/put/onSaved，再各保留 payload 与 core 回读两条独立失败，共4条 assertion failure，不是4个用例或 render crash。搜索/标题输入前后零 run/零新增内存写，所有 fixture 前后 SHA 相等，保存仅 tasks/t4 一次写入。

## 根因与最小交开发范围

独立业务合同：搜索是只读过滤，不是取消既有前置选择；原 panel:2527–2530 与 :2899 自身也明确被过滤已选项仍照常提交。

- 原 `panel.tsx:2925` 对不匹配行 `return null`，隐藏已选 checkbox 从 DOM 表单移除；`checkedIds` 及 footer 仍保 t2/1项。
- 原 submit `panel.tsx:2633` 从 `FormData.getAll('predecessorIds')` 读取不完整集合，发送显式[]。
- 原 handler `commands/task.ts:301–306` 解析 JSON 并调用原 updateTask；原 `core/tasks.ts:342–346` 对显式前置数组整体替换，[]按合同归一为缺键。**后端正确执行“清空”，不是 handler 拒绝/忽略了错误 payload。**

交 Main 的开发范围仅 `panel.tsx` 前置选择器/submit 和原 TPC01 checkbox handler：提交以完整受控 `checkedIds` 为准，不以搜索后可见 DOM 为准；同时按原 TPC01 报告同步读取 checked 布尔值，再进入 updater。无需改 backend/schema/renderer/样式/资料/服务，也不因本红扩大需求。本角色不实施该修改。

另一专家须在 Main 的新冻结候选复验本五例与原 TPC01 完整选/取消/rapid 旅程，并由 Main 接续受影响完整回归及 GUI 门；本报告不能替代后继通过或父全部验收，普通 commit 仍等待父总门。

## 候选与原证

- 原候选 CombinedRepairR1/r2，107声明、515包输入、version0.7.4、基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；[candidate](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/candidate.json)保原 tracked diff/new files/source hashes 及父 provenance。借 r2 原设施时已含旧唯一 TPC test，故继承输入实际516，本轮另加1新test，不篡改父515/107声明。
- 原 panel SHA=`fa07af612db1546e8df66cb31fb081087eb8aefcf60fd58d8484dca6664a0947`；[唯一新测试](../../packages/dsh-pm-tool/src/client/task-predecessor-hidden-submit-dom.test.tsx) SHA=`ff3897e963641159ffd6d59e9bf0a8a2d8c52631857b630dcc9470e2437b1988`。
- [虚拟 adapter diff](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/virtual-adapter.diff)仅追加 `export { TaskForm }`，虚拟 SHA=`4d5f1d438b91aee026966ed89b5ae8979dedac2d79b72b4b2d45f7ebbffd219f`；无生产 API 暴露，无 hook/组件 mock。run 接线位于测试 props，不修改 adapter。
- [真实测试 JSON](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/vitest.result.json)、[stdout](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/vitest.stdout.txt)、[完整 stderr/四条失败栈](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/vitest.stderr.txt)、[argv/cwd/env/PID/exit](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/vitest.command.json)。
- [N01完整原证](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/observations/4-HPS-N01/observations.json)、[N02完整原证](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/observations/5-HPS-N02/observations.json)保每步 HTML/选择集合/计数、完整命令与 payload、handler 原返回、内存前后记录、调用、异常及 fixture。
- [控制 C01](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/observations/1-HPS-C01/observations.json)、[C02](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/observations/2-HPS-C02/observations.json)、[C03](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/observations/3-HPS-C03/observations.json)均保完整保存链；[审计](hidden-predecessor-submit-red-20261022-r1-audit.json)复核封存16757条文件/软链指纹及五例因果一致，audit exit0仅原件完整，不是产品PASS。
- [close](../../reports/all-pending-evidence-20261021/HiddenPredRedR1/r1/close.json)原 r2/r3、旧 test/report、主 lib/package/lock、新源test及自有源码/依赖保护全零变。父 renderer 后继108合法且不锁，本轮不审后继；主 panel 本轮前后也为上述原SHA，仅作观察不设 writer 锁。

原项目依赖独占复制13579文件/1030内部软链、DOM依赖1595文件/2内部软链，字节一致、零共享 inode、零外链。复用原 r3 inline 真 lucide-react 设施，React/DOM18.3.1、jsdom25.0.1、Vitest2.1.9；DOM lock SHA=`15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973`。HOME/TMP/cache/DSH_HOME 全在自有 HiddenPredRedR1/r1；未 install/build/noemit/pnpm/全verify/browser/service/Git/key/vendor/正式data写。

## 命令与停止

运行环境 macOS + nvm Node22.23.3；从仓库根执行：

```sh
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/hidden-predecessor-submit-red-20261022-r1-run.mjs
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/hidden-predecessor-submit-red-20261022-r1-run.mjs
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/hidden-predecessor-submit-red-20261022-r1-audit.mjs
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/hidden-predecessor-submit-red-20261022-r1-audit.mjs
```

退出码依次 **0 / 1 / 0 / 0**。主测试 runner71786/子72060均已结束，signal/error为空；设施没有失败重跑，不重复旧七例。只读资料核对及自有进程等待检查，不操作服务；曾一次查看进程列表，随后限定自有精确PID，不据列表操作其他进程。

[先行计划](hidden-predecessor-submit-red-20261022-r1-plan.md)及本报告交 Main；旧报告不覆盖、livingdocs由Main统一汇总。本角色非开发非GUI，不继续修后自验。**RELEASE_STOP**。
