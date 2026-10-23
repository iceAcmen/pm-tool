# 全宽看板拖动开发交接

> 2026-10-21，平台 trae，开发角色。给 Main 唯一 builder 与独立测试专家使用：记录限定修复、真实组件红绿证据、候选指纹与剩余复验；不是独立 PASS、GUI 验收或整包完成声明。

## 1. 授权与范围

父授权用户原句：“好的，按之前的盘点文档和这个分工方案继续推进，直到把所有没验完的功能全部验完，再把所有代码都提交为止，才算完成任务，中途不要停下来。”

本开发子单明确限定：“你是开发，不是验收专家。精确独占修 packages/dsh-pm-tool/src/client/board/editor.tsx，必要editor-ops.ts与自有新editor-drag-stop.test.tsx，必要原ops/compact tests；不要改panel/其他产品/docs/testing/living docs。”

依据已读 `AGENTS.md`、`docs/collaboration.md` §9/§11、`docs/plans/2026-10-21-bridge-board-objective-closure.md` §2、专家 `docs/testing/board-fullwidth-drag-diagnosis-20261021.md` 完整 §7 与原 fixture。父计划/专家先行合同已经冻结，持续修复授权覆盖本动作，没有重复请求批准。

本单仅修改 `editor.tsx`，新增 `editor-drag-stop.test.tsx` 与本报告。`editor-ops.ts` 和原 ops/compact/geometry 测试未改。没有改 panel、其他产品、schema、CSS、依赖、专家目录或 living docs；无 install/build、共享 lib 写入、服务启停、profile/正式树/上游改动、commit/push。Main 负责同步总候选、唯一构建、全量回归与档案；本开发不继承父提交动作。

仓库已有并行 dirty 成果，未 pull、覆盖、删除或清理它们。平台记忆指定路径不存在，以仓库合同为准。加载 brainstorming/writing-plans 指导理解与步骤拆分，使用现有已批准计划，不新增计划/审批/提交。vendor 当前缺陷 FAIL，本单没有加载任何 vendor 正文替代独立门。

## 2. 修复机制

1. **保留拖动意图**：`onDragStart` 入一次原历史，启用 RGL 原生 `compactType='vertical'` 处理后续真实多帧碰撞。停止时仍使用生产 `reverseFromBreakpoint` + `compactVertical` 提交草稿；不把卡固定到 row12。空闲及缩放仍为 `compactType=null`，合法含洞布局不会因挂载/测宽/面板开关自动重排。
2. **同值提交同步**：编辑器内增加很小的 `CanonicalRGL` 适配类。显式 stop 增加 `canonicalRevision`；等待 RGL 自身清除 `activeDrag` 后，失效其 `propsLayout` 比较缓存，调用 RGL 1.4.4 原有 `getDerivedStateFromProps` 同步 canonical。即使新草稿与旧 props 深相等，内部显示也重新采用草稿。
3. **保持提交边界**：没有被动 `onLayoutChange` 写回、延时重试、同值布局克隆、重挂载/换 key、依赖私有文件 import 或直接实例 `setState`/`forceUpdate`。生产压实函数、尺寸、ID/type/config/minW/minH、保存路由均不变。

适配依赖锁定 RGL 1.4.4 的类静态方法及 `activeDrag/propsLayout` 内部约定，不声称它是跨版本公共 API。今后升级 RGL 须重新审此接缝。显式提交序号只用于显示同步，不进入业务数据或撤销历史。

## 3. 组件测试与设施

新测试挂载真实 `BoardEditor`、真实 RGL 类与 React renderer，通过真实 RGL `onDragStart/onDrag/onDragStop` 逐网格行多帧执行。没有 mock RGL 或调用替代布局状态机。仅桩测宽 DOM/ResizeObserver/事件监听设施，卡内容为注入的简单 span。AUTO 不冒充原生 mouse/DraggableCore 输入或 GUI。

原六卡附件逐字节只读引用，并用生产 `parseLayout` 确认合法；两卡取附件 A/B，保留所有原字段。断言观察生产 `renderCard` 收到的 canonical、RGL state、实际渲染卡 transform/宽高和 grid 高度，另测稳定测宽帧。

| 合同 | 实际覆盖 |
| --- | --- |
| FW-T01 | A 从0逐行到12，共12 move；drop实际 A 位于实际 D 后；松手保留相对顺序、六卡完整字段、零相交、顶行0；两卡最小碰撞链；一次 undo 恢复且 disabled |
| FW-T02 | 同一合法缩放手势 A 高6→7→6，使真实内部邻卡下推，再归一为操作前同值；对照6→7不同值；两分支显示/草稿/高度一致，各一次 undo 恢复 |
| FW-T03 | 连续三拖三次逆序 undo；另拖/缩放/缩放三动作三次 undo；ResizeObserver、卡库/配置面板开关不改草稿/历史或调用保存/重置；RGL 实例不换；合法含洞初态与被动测宽不重排 |

AUTO 三拖用于历史/同步不变量，不称完成 FW-T04 原 GUI 的 B→初始A区等动作。物理 stage bbox/scrollHeight、placeholder/pointer buttons、滚动祖先、连续录像和真实保存/取消资产窗口仍归 Main。

### 设施问题与 Main 联络

- 首轮主树运行 exit1：`Failed to load url react-test-renderer`。原29测试正常执行，但新 suite 未加载；这是设施错误，不算先红产品证据。
- 现有配置起初仅收 `.test.ts`，Main 已自行补收 `.test.tsx`；本开发没有改共享配置。
- Main 明确纠正依赖实际位于 `/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules`，并授权自有 tmp 拷贝源/配置后链接该已安装目录。已按此做，未写共享 wt。
- 自有根 `/private/tmp/pmtool-fw-developer-20261021`：复制10个相关源/测试、package.json/vitestconfig/tsconfig 与 fixture；包内 `node_modules` 仅软链已装依赖。专项配置和 Vite 缓存也在自有根。没有整包 build。

实际运行环境：macOS/darwin arm64，Node **22.23.3**；React **18.3.1**、react-test-renderer **18.3.1**、RGL **1.4.4**、Vitest **2.1.9**、TypeScript **5.9.3**。RGL 实际解析的 react-dom 是 **19.3.1**。合同 pnpm **11.28.5**，本单直接运行 Node CLI，没有执行 pnpm 或调整版本。

## 4. 红绿原证与命令

初始产品红例在实现前取得，21:13:37 全部 suite 已加载：5 failed / 31 passed（原29全部绿），exit1。首修21:14:49为36绿；补强卡渲染几何/单手势同值/配置面板观察后21:15:54仍36绿。最终以**同一最终测试文件**再替换自有副本的旧/新 editor 复跑，旧5红、新36绿；主树产品从未回退。

环境同上，专项命令（cwd 自有隔离包）：

```sh
cd /private/tmp/pmtool-fw-developer-20261021/packages/dsh-pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node node_modules/vitest/vitest.mjs run --config /private/tmp/pmtool-fw-developer-20261021/vitest.config.mjs --reporter verbose
```

该命令实际运行四个文件：新组件7用例、原 ops18、compact6、geometry5，共36用例。

最终机械重跑器只在自有 tmp 暂换 editor：读取 `git show HEAD:.../editor.tsx` 的基线字节，跑红；恢复主树修复字节，跑绿；finally保留修复副本。两轮使用同一测试/fixture/依赖/配置。执行命令：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node /private/tmp/pmtool-fw-developer-20261021/recheck.mjs
```

重跑器 exit0 代表成功采到预期旧红/新绿，不是产品独立 PASS。原始输出在自有 `red.txt/green.txt`，认领在 `red-green.json`。关键原输出：

```text
red: exit=1, editor=5ddf057cf5bb0eab59dbb31233b59c586959705f452b56f59bc88d8a885cf6f8
六卡: expected 12 to be greater than or equal to 24
两卡: expected 6 to be +0
同值缩放: RGL B..F y=7/9/11/13/15，canonical=6/8/10/12/14
三拖: 显示与canonical不同
拖/缩放/缩放: 第三次undo未回原始A y=0
Test Files  1 failed | 3 passed (4)
Tests  5 failed | 31 passed (36)

green: exit=0, editor=ba1bf91211c87c068fe0bb4cb887249f1c321e2eecb20885d6745b2cd3086761
Test Files  4 passed (4)
Tests  36 passed (36)
```

另执行 scoped `git diff --check -- packages/dsh-pm-tool/src/client/board/editor.tsx` exit0；10相关文件主树/自有副本逐一 sha256 比对 exit0，全部一致；fixture指纹一致。未运行整包 TypeScript 类型检查/build/coverage/全部 verify/新运行实例/GUI，这些由 Main 唯一 builder 和独立专家继续，不引用旧产物替代。

## 5. 候选认领

本报告只认领 **board-FW-developer-20261021** 文件级未提交候选，不用 HEAD 冒充全包 dirty 候选。基线提交 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；旧 editor 指纹与专家原件一致。editor tracked diff 的 sha256（`git diff -- .../editor.tsx | shasum -a 256`）：`6253c7aed451a7ce54d779525167768f6a3e300c178c6d5552b0d4a0a707ac5c`。

| 对象 | sha256 |
| --- | --- |
| 修后 `editor.tsx` | `ba1bf91211c87c068fe0bb4cb887249f1c321e2eecb20885d6745b2cd3086761` |
| 新 `editor-drag-stop.test.tsx` | `973fa516de33a957292a7d996d6f778d765d924f480d2534b1513625074faa79` |
| 未改 `editor-ops.ts` | `ade6c08dd648dc02cb6813c89d159e59116052e0d3701eabd3cef414e7d06601` |
| 未改 ops / compact / geometry tests | `450b5a62eec641d9e6bbcac3ac30050ed58e62d1e8955f6d6e1f4f0020e2dedc` / `511eb0e74ca1b055c5a348bb9853adb556213152cf84ab814fb776d71ac31cee` / `29489d8b0323bd0182ff8fa23a136e7566b21973ddeff2c0d8684481c4171c07` |
| 专家 fixture | `41c91b49024270667b5a43e2f927bc43c478b8b69384c95b157aa01643176b87` |
| 自有专项配置 | `5ad8034d5d93950a3a6d14b45212c0527b400c39fc1404d1a6a96ec43397ddbb` |
| 最终 `red.txt` / `green.txt` | `6f7567e8fea7decc6a265b1a17ab60090a9eb387b8e4347e14c9b208dbde178f` / `e217b483fd1b4f140435a6a0c6af0778c475859e2d26afa6c4f78e6b7e145af7` |

本开发没有构建 manifest、下发 bundle、运行 PID/端口、browser 或 feature flag 的新认领；Main 同步和新建运行实例后应单独绑定。共享源码/依赖/未来构建变化须审受影响证据，不能以本专项绿继承完整门。

## 6. Main 接续与剩余风险

1. **仅同步两个文件**：本单产品 `src/client/board/editor.tsx`、新 `src/client/board/editor-drag-stop.test.tsx`；报告归档本文件。fixture在目标树须保留标准仓库相对路径，新测试通过相对URL只读加载它。
2. Main 在自己的同步时点冻结总候选，执行类型检查/唯一 build、全集（含tsx）/coverage/全部verify，认领准确新产物。不要让本开发自有 tmp 成为正式服务或共享 builder。
3. 独立专家复验 FW-T01/T02/T03 后，Main 按原 FW-T04/T05 标准UI导入/save/重进、1440×900浅100%、A→实际D下方、B→初始A区、同A返回及三撤销采完整原证；后续两拖保存/一拖取消分别回读显示=导出=落盘、全写根保护。不能拿7个组件用例当完整用户旅程。
4. RGL适配与同值 props 缓存是新增受影响接缝；真正 DOM/指针层、物理 stage高度、原始鼠标残留状态、滚动/遮挡、真实save/cancel与资产保护尚未由本单覆盖。ReactDOM19.3.1虽为已存在依赖，也须在实际宿主/browser继续核验，不在此修改依赖。

**开发交接状态**：限定实现与专项证据已就绪；请 Main 精确同步并交独立专家复验。本单没有自判 PASS、关闭专家 FAIL/BLOCKED 或声称父“全部验完并提交”任务完成。
