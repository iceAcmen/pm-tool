# 前置复选框崩溃独立先行合同与计划

> 2026-10-22，trae，独立测试先行，非开发、非 GUI。使用 writing-plans 的文件级计划方法；本派单限定目录优先，不写通用 plans/livingdocs，不执行其提交或实现步骤。

## 授权与停止条件

负责人本轮原句摘录：

> “父授权多角色/确证缺陷持续修复，全部验完后普通commit，无push/tag/service。你独立测试先行非开发非GUI；唯一testing docs/testing/task-predecessor-checkbox-red-20261022-r1*及自有TaskPredCheckboxRedR1，唯一源test src/client/task-predecessor-refs-dom.test.tsx；若目录细节阻塞回Main先不要产品旁改。”
>
> “不得修改产品后自验，不用自建model代真实Component或mock useState。生产TaskForm不export时可最小测试transform导出(自有virtual adapter保diff/sha)但不要改原源码暴露测试API，明确边界。”
>
> “原错误前置循环根因另CF已修不可混为本bug；本bug在submit前零业务写。”

本角色可写：

- `docs/testing/task-predecessor-checkbox-red-20261022-r1*`：合同、运行器、审计和报告。
- `reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1/**`：独占冻结源/依赖/配置/原退出码/原 console/观察/指纹。
- `packages/dsh-pm-tool/src/client/task-predecessor-refs-dom.test.tsx`：唯一源测试文件。

Main 唯一 builder/GUI/最终 Git 协调者；renderer 开发、报告导出先行专家和只读 explorer 并行，不锁其文件。当前显式授权禁止本角色 Git 操作、build/noEmit/install、服务、浏览器、key/vendor/data 写及覆盖他人 testing 文件，故不执行通用接手 pull/安装/构建。限定原件读取，不广泛探索。

停止条件：独立必要红和最小开发交接落盘即 STOP；设施或目录问题自行仅在自有根纠正并保存原错误，无法解决时回 Main，不旁改产品。本轮红不能普通 commit，不签修后、整项或发布 PASS。

## 对象与候选

- Main 新真实实例：3260，`CombinedGuiR1`，来源 `CombinedRepairR1/r2`，107 声明、515 包输入；基线从原 candidate 读取，不执行 Git。
- 冻结源：`/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool`；复制其 src/脚本/配置及原声明/差异/新增清单作为身份，不使用 lib 构建或执行宿主。
- 主树允许合法新 dirty（包括 ReportExportRedTest）；读取 `panel.tsx` 对比后只绑定本冻结字节，不把全主树 HEAD 或并行变更当零漂移。
- React18/ReactDOM18/JSDOM 既有设施：`MaterialRefDevR1/dom-deps` 普通完整复制，校锁 SHA、逐文件字节、软链闭合、零共享 inode；项目依赖也独占复制，不安装。
- 不 export 的真实 `TaskForm` 通过自有 Vitest transform **仅附加 `export { TaskForm }`**，保原源码 SHA、虚拟结果 SHA 和 diff。不改原源文件，不提取/复制组件体，不 mock hook 或替换子组件。

## 用例与 Oracle

所有产品用例挂载真实 `TaskForm`（编辑已有合法 task），使用 React18 `createRoot`、JSDOM 原生 click/input，保真实受控状态、所有子组件和业务校验。输入用原生 value setter 加冒泡 input，不手清 SyntheticEvent，不强迫 updater 延迟。标题/搜索快速输入按真实事件序列执行。 fixture 用静态合法 Task 记录及生产 schema 校验，非状态模型，不写业务库。

| ID | 初态与动作 | 必须观察 |
| --- | --- | --- |
| C01 | 设施 Probe checkbox 选/取消 | handler 内 currentTarget 为 input，dispatch 后 null；同步布尔快照正确。仅设施控制，不能替代产品。 |
| C02 | 编辑已有 t4，已选 t2；搜索隐藏 t2/恢复，干净取消 | 初值与 FormData 一致；隐藏已选保留；无 run/fetch/保存，取消回调一次。 |
| C03 | 编辑已有 t4；不点前置，连续标题 input | 真实受控标题更新、表单仍在；零命令/网络/保存，记录稳定输入值。 |
| N01 | t1 已合法依赖 t4、t4 无前置；编辑 t4→fill title→选 t1，未 submit | 选择本地必须存活且 t1 checked=true/已选1/FormData精确；即使未来 submit 成环也不得当前崩溃；所有记录不变。 |
| N02 | t4 已合法选 t2；fill title→反选 t2，未 submit | checked=false/已选0/FormData空；表单存活、零业务调用/记录不变。 |
| N03 | t4 无前置；选 t2→rapid title input→选 t1→取消 t2→取消 t1 | 每步 checked 集合/计数/FormData精确；无重复/丢选，不因再次 updater 读取旧事件崩溃。 |
| N04 | t4 已选 t2；rapid title+search input→选 t1→取消 t2→重选 t2 | 同上，已有编辑/搜索与选择交叉准确；保标题、零业务写。 |

每例保存前后 HTML、输入、checkbox、FormData、捕获错误/component stack、原 console/window.error、run/fetch/callback 日志和 fixture 指纹。失败时剩余动作记 NOT_REACHED，不执行 submit 来补造成功。ErrorBoundary 只观察真实 TaskForm 子树崩溃，不冒完整 PM shell；完整宿主证据来自 Main 原件。

用例数为计划，不预设红/绿数字。设施失败与产品失败分开；只有兼容控制有效且生产栈指向相同 handler 的错误才判必要红。

## GUI 原件只读审证

读取原 `25-o3-console-events.json` 的完整 `Runtime.consoleAPICalled` 和 `loaded-complete.js` 的实际 49299 行，绑定 `loaded-binding.json`、20r2 命令、21/22r2/23/24 页面+roots及图。原件仍在途，只固定明确名单当时指纹，不封/覆盖 Main 根，不外推三次全有独立证据。

核其零业务写 roots 对照及可见 UI；本轮不执行 GUI、不补操作。CF 服务端循环原因修复、资料 refs 修复与本 bug 分开，不给既有 GUI PASS 改写。

## 执行顺序与命令

1. [x] 读取限定合同、原件、实际 handler，先落本计划。
2. [x] 新增唯一真实 DOM 测试与自有运行器；校依赖，冻结候选和最小导出 adapter。
3. [x] 执行本计划测试，保存所有原 stderr/stdout/JSON/退出码，设施问题只修自有配置并另轮保真。r1 diff 设施失败、r2 双 React 图标设施失败保留；r3 同源同 test、仅 inline 原图标库。
4. [x] 已审原 GUI console/roots/23与24原图及源对应；三轮封存指纹审计0，原错误保留。
5. [x] 已落具体 RED 报告、最小产品文件行/差异和另开发/另专家复验要求，release STOP。实际7项2控制绿/1单列控制失败/4目标崩溃红，不预设结果；不签修后或父总门。

环境：macOS，nvm Node22（实跑记录精确版本）；pnpm11.28.5 是仓库约定，本角色不调用。

```sh
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check \
  docs/testing/task-predecessor-checkbox-red-20261022-r1-run.mjs
env -i HOME=/Users/bytedance PATH=/Users/bytedance/.nvm/versions/node/v22.23.3/bin:/usr/bin:/bin \
  /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node \
  docs/testing/task-predecessor-checkbox-red-20261022-r1-run.mjs r1
```

实际 Vitest argv/cwd/白名单自有 HOME/TMP/cache/DSH_HOME/时间/PID/exit 单独保存。不要把审计 exit0 或设施 control 绿写成产品通过。全 build/verify/GUI/修后由 Main 与不同专家承担，不在本轮授权。
