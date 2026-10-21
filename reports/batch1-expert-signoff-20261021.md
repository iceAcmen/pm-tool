# 第一批候选：提交与专家审签交接

> 本文给独立测试专家和接续协调者使用，列出待审候选、验证入口、提交前自查发现和证据缺口。本文不是测试专家的验收结论。

## 授权与候选

- 所有者本次原句：**“提交代码并推送，准备进入专家审签流程”**（2026-10-21）。
- 本次授权普通 Git 提交及 `git push origin main`，用于冻结审查候选；不改变独立测试门，不授权正式部署、打 tag 或发布。
- 开工基线：`06a131cd5fdc4486dd74afe89cc4c5630f0a4c98`。远端拉取成功，当时 `origin/main` 是其祖先，本地领先 17 个已有提交。推送 main 会包含这 17 个提交及本次候选，不改写历史。
- 专家应以推送后的提交哈希为被测对象；候选源码逐文件指纹见同目录 `batch1-candidate-source-20261021.sha256`。该清单是提交前新冻结，不追溯冒充此前 GUI 执行时的清单。
- 产品范围：现有 13 类体验候选及 launcher 的收口修复；复盘和同期已完成文档一并归档，微信试点保持独立，不并入产品验收。

## 验证与运行入口

运行环境为 macOS、nvm Node v22.23.3、pnpm 11.28.5。以下是上一轮实际运行结果，本轮只核原始日志及静态完整性，不重复出网调用：

| 对象 | 命令 | 上轮结果 |
| --- | --- | --- |
| 插件 | `cd packages/dsh-pm-tool && pnpm test` | exit 0，124 个文件、1130 项 |
| 插件构建 | `cd packages/dsh-pm-tool && pnpm run build` | exit 0 |
| 全量脚本 | 在插件目录逐一运行全部 `node scripts/verify-*.mjs` | 97/97 exit 0 |
| Launcher | `cd launcher && pnpm test` | exit 0，44/44 |
| Launcher 自检 | `cd launcher && pnpm run verify` | exit 0 |
| 本轮静态校验 | `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` | exit 0，注册 vendor 指纹一致 |
| 本轮差异检查 | `git diff --check` | exit 0 |

暂存新增文档后，完整 `git diff --cached --check` 发现原测试专家计划第 3 行有 Markdown 两空格换行；原稿必须保留，未改该行。其余文件的暂存差异检查通过，专家五份原稿与暂存字节一致。敏感模式扫描命中的唯一字符串是 `launcher/test/browsers.controller.test.mjs` 内 fake spawn 的固定测试 token，不是真实认证凭据。

全量逐项退出码见 `batch1-final-verify-20261021.tsv`；原始日志保留在 `/private/tmp/pm-batch1-closure-20261021/final-verify/`。此前真实免费模型首轮失败不抹除，本轮最终日志是通过；不能推导免费模型长期稳定。

当前磁盘 client bundle SHA256：`966417debf740ac3553db5c901d33261163da2fa68290f4751362b1d0408aa35`。这只认领当前字节，不单独证明旧截图或服务加载身份。

当前本机宿主源码 HEAD：`1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；宿主与插件身份必须分别核定，源码 HEAD 不直接证明正式服务装载版本。

本轮只读核服务：正式 3172/PID 44388；隔离 3199/PID 880；launcher/PID 758、control 61201。它们是临时快照，专家复验前必须核 argv/cwd/端口/DSH_HOME/数据根，不能直接使用旧 PID 操作服务。

## 提交前 code-review：规范轴

本轮按锁定 `mattpocock/skills` commit `49dd158d1076134a641b33efb035946536778336` 使用 `code-review`，taskKind=delivery、vendorIntegrityVerified=true，13 个文件指纹一致；两个只读审查角色分别检查规范与需求。未执行 setup、未修改 vendor、全局配置、正式数据或上游。以下是自查发现，仍由专家核实严重度、复现及处置：

1. `launcher/src/local-app.mjs` 把 `launcherBin`、`bakedNode` 直接放进 shell 单引号；路径含 `'` 会破坏生成脚本，特制路径可能形成命令注入。当前正常路径不证明该边界安全。
2. `launcher/src/launcher-app.mjs` 允许多个 pending nonce；再次打开或更换浏览器后旧 nonce 仍可用，旧页面迟到回告可能把新旅程显示为 S4。需验证是否符合“当前浏览器已进入”的合同。

## 提交前 code-review：需求轴与证据

1. `panel.tsx` 的 ResultCard 复制状态不随 message 变化重置；新原文可能沿用旧“已复制”提示，需复现核定。
2. 实现 nonce TTL 为 10 分钟，专家计划 B1-DESK-02 的旧条款仍要求超过 120 秒拒绝。该差异交专家确认或调整合同，开发不修改专家计划。
3. 原始证据索引记录了最终 GUI 观察，但磁盘 `artifacts/B1-GUI-03/restore-error.json` 仍为修复前双前缀；没有在指定证据根找到最终 Finder 录屏、三次撤销逐态文件及复制参数完整原证。此前会话里的工具截图/页面状态不能自动视为已归档磁盘原证。
4. 已有截图尺寸与计划视口不同，缺少每次 viewport/zoom 记录；键盘复制及真实权限拒绝步骤的完整证据须专家逐项核实。注入 `writeText` 验证参数，只证明调用值和 UI 反馈，不证明系统剪贴板实际值。

因此，**自动化全绿不等于本批已可签 PASS**。本文将历史观察保留为执行端报告，同时明确可复核证据的缺口，不补造录屏、指纹或当时运行状态。

## 独立专家下一步

1. 读取 `docs/testing/independent-acceptance-batch1-closure-plan-20261021.md` 及原始证据索引，按推送提交重认领候选。
2. 核定上列三个实现边界与 TTL 合同差异，维护专家自己的计划/缺陷报告。
3. 对证据不足项给补采要求；执行端仅按专家步骤采证，不自行更改视口、动作或判定。
4. 由专家逐项签 PASS / FAIL / BLOCKED；需要修复时仍只推进当前候选，未通过前不开新功能、不正式切换或发布。

本轮没有启动专家审签代理，也没有向外部联系人发送消息；本交接包用于进入该流程。
