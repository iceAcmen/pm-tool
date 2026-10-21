# 第一批现有候选验收收口：原始证据索引

> 执行者：Main（trae）
>
> 日期：2026-10-21
>
> 候选基线：`06a131cd5fdc4486dd74afe89cc4c5630f0a4c98` + 未提交工作树
>
> 状态：仅原始现象与开发回归；**不代替独立测试专家的 PASS / FAIL / BLOCKED 判定**。

> **提交前审证纠正（2026-10-21）**：本文最终 GUI 叙述保留为执行端观察；磁盘目录部分原证仍属于修复前，尚未定位完整最终录屏/逐态记录，不能仅据本文视为可审签证据。源码新冻结、三项自查发现、TTL 合同和证据缺口见 [`batch1-expert-signoff-20261021.md`](batch1-expert-signoff-20261021.md)。所有者已授权候选提交推送，取代下文授权前“不提交”的状态；独立门及不发布边界不变。

## 1. 隔离与保护

- 正式 3172 始终由原 PID 44388 监听，未重启、未切软链。
- 最终复验时隔离 3199 由启动器自拉起 PID 880 监听；启动器 PID 758、控制端口 61201。PID 均为临时运行态，接续时须重新核对。
- 正式资产清单：
  - `formal-assets-before.sha256`
  - `formal-assets-after-path-r2.sha256`
  - 两文件 sha256 均为 `b10ed84a010be1a40df28f79b202ca84c52841b6fd97eda7c09c2360da624409`，逐字节相同。
- 原始证据根：`/private/tmp/pm-batch1-closure-20261021/`。
- 证据与本文均不记录启动 token、cookie、nonce 或 API Key。

## 2. GUI 原始现象

### B1-GUI-01 看板连续拖动

- 三次同会话指针拖动、逐步 bbox/布局、撤销、保存重进、取消刷新均已采集。
- 保存重进后的 canonical 坐标一致；取消草稿未落盘。
- 修复后重新执行三次同会话真实指针拖动：任务完成率、风险矩阵、补记队列依次改变位置；三次点击撤销严格逆序恢复第三、第二、第一步，最终回到初始布局且撤销按钮禁用。
- 目录：`artifacts/B1-GUI-01/`。

### B1-GUI-02 宽屏编号与复制

- 1440px 宽屏复现根层级分组行编号为空。
- 最小修复：根/叶行复用同一 `taskHandleButton`；真实 UI 显示编号 1/2。
- 复制成功显示“已复制”；模拟 `NotAllowedError` 显示“复制失败”，未假成功。
- 最终复验不读取系统剪贴板：向页面注入只记录参数的 `writeText`，点击“复制原文”后捕获数组唯一值为 `恢复失败：备份文件格式不认识（format/formatVersion 不符）`，与错误卡原文逐字一致。
- 目录：`artifacts/B1-GUI-02/`。

### B1-GUI-03 深色与错误反馈

- 宿主真实深色：`body` 深色标记生效，任务/OKR/设置/看板可读。
- OKR 非法关联 ID：抽屉保留输入、单一就近 `role=alert`、长文换行。
- 非法备份：单一顶层错误卡可关闭，关闭后可继续导航；数据预检零写。
- 修复后用页面内构造的非法 JSON 文件复验，错误卡仅显示一次前缀：`恢复失败：备份文件格式不认识（format/formatVersion 不符）`。
- “复制原文”成功态与写入参数均已核验；系统剪贴板仍未读取。
- 目录：`artifacts/B1-GUI-03/`。

### B1-GUI-04 合法长历史

- 通过当前 schema 构造、标准备份/恢复入口导入隔离历史；最近 14 天平铺，较早月份折叠。
- 展开月份、重进、同日幂等已采集；超出两天补记窗的命令明确拒绝，前后 habit JSON SHA 相同。
- 目录：`artifacts/B1-GUI-04/`。

## 3. Finder 与启动器原始现象

- Finder 指针真实双击 safe `.app` 已执行。
- 首轮发现控制页正文空白，状态停 S1。根因：浏览器内联脚本调用了仅存在于服务端作用域的 `esc()` / `svg()`。
- 修复 `launcher/src/control-html.mjs`，新增执行内联脚本的 `node:vm` 回归；第二次 Finder 双击后 S1 正文和“打开 PM 工作台”按钮正常。
- 点击真实按钮后进入 S3；无认证浏览器路径显示 API Key 首次配置，控制页可由“看到登录/认证错误”进入 S5，未假成功。
- 最终权威旅程释放 3199 后由 Finder 双击的启动器自拉起服务：S0→S2→带本次 token 打开目标页→“稍后配置”→打开 PM 插件→真实 snapshot 显示隔离项目与 2 项任务→控制端 `/api/state` 为 S4；目标地址由 `127.0.0.1:3199/#pm-launch=...` 清为 `127.0.0.1:3199/`。
- 中间一次手工预启动 3199 后复用旧浏览器认证，页面壳可见但 snapshot 命令通道等待；该次手工 POST 仅用于定位跨端口请求，不计验收。另发现临时 App 误烤不存在的 `isolated/dsh-home`，实际为 `isolated/dshhome`；重制同一临时 App 后启动器自拉起链路正常。
- 启动器安全负例：Host / Origin / null Origin / media type / nonce / replay / cancel 等自动化用例通过；真实 S4 旅程不能由自动化单测替代。

## 4. 两项隔离路径

- `verify-export.mjs`：移除仓库目录名 `/pm-tool/` 硬编码，按 `import.meta.url` 计算默认导出目录。
- `verify-settings.mjs`：用 `fileURLToPath()` 解码含空格路径，避免 `%20` 进入文件路径。
- 普通路径与含空格 detached 路径 P0-P3 配对矩阵均为 exit 0。
- 目录：`path-matrix/`。

## 5. 回归

- Launcher：
  - `node --test test/control-html.test.mjs`：5/5。
  - `pnpm test`：44/44。
  - 安全/取消/本地 app 聚焦集：22/22。
  - `pnpm run verify`：PASS。
- 插件：
  - `pnpm test`：124 文件、1130/1130。
  - `pnpm run build`：exit 0。
  - 最终全部 97 个 `verify-*.mjs`：97/97 exit 0，汇总在 `/private/tmp/pm-batch1-closure-20261021/final-verify/summary.tsv`。
  - 历史首轮 `verify-real-model.mjs` 外部免费模型未返回可解析 JSON 的失败仍保留；最终整轮重跑时该脚本通过，不抹除此前波动。
- 其他：`git diff --check` exit 0；正式 3172 始终为 PID 44388，未重启、未切软链。

## 6. 待独立专家审证

1. 审核修复后的三拖三撤销、单前缀、复制参数值与 Finder S0→S4 原始状态是否满足既定用例。
2. 审核 `verify-real-model` 历史首轮失败、最终整轮通过的门禁口径。
3. 逐项给出 PASS / FAIL / BLOCKED；在结论前不得写整批通过或发布。本次仅按所有者新授权提交推送审查候选。
