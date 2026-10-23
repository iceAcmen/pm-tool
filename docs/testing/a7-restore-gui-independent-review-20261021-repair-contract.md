# A7 恢复预检布局最小修复合同

> 2026-10-21，trae，独立审证角色。给 Main 修复及后继专家复验使用；仅记录已见原证和先行测试合同，不改产品、不操作 GUI、不授权发布。父授权见 `reports/all-pending-acceptance-execution-20261021.md`；负责人追加要求核定实际预检横滚与附件名称投影。

## A7-RV01：P1，局部 GUI FAIL

- 候选：A7，基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd` 加 `A7/product-tracked.patch` 和 `candidate.json` 新文件/全源指纹。不是 A6 或整个 B8 的结论。
- 原证目录：`reports/all-pending-evidence-20261021/A7/restore/`。
- `full-precheck.json`：实际 viewport 1440×900、PM bbox x280/w1160，`scrollWidth=2629`、`clientWidth=1155`，横向超出 1474px。DPR=2 仅设备读数，不证明 200% 或原生 100%。
- `full-precheck.png` 实际警告/命令长路径越界，预检与 rail/main 发生挤占、遮挡；`precheck-cancel-frames/000006.jpg` 可见预检长行和底部水平滚条。`second-confirm.png` / `confirm-frames/000010.jpg` 可见后台长行继续超宽，而独立危险对话框本体折行、两个动作可见。
- 以上不是仅 DOM 推断，也不是审美意见；按原 `remaining-journey-cases-20261021.md` §6 共同比例下“主控可达、主要文案不裁切、外壳无二维横滚”及批准备份计划的“显示完整预检结果”，当前采证条件局部 FAIL。原生 100% 菜单缺证仍另列 BLOCKED，不妨碍确认此实际 viewport 的失败，也不把该失败扩大成所有宽/深/缩放。
- 源码定位：`client/panel.tsx:960-991` 把 `.pm-restore-preview` 直接作为 `.pm-shell` 子项置于 NavRail 前；`client/panel.css:262-267` shell 横向 flex，rail 固定宽、main 纵向。当前 CSS 无 `.pm-restore-preview` / `.pm-restore-preview-text` 专项规则；`pre` 默认保留长行。这是已定位的最小结构/约束缺口，不据此声称恢复事务失败。

## 修复边界

| 文件 | 最小动作 | 不做什么 |
| --- | --- | --- |
| `packages/dsh-pm-tool/src/client/panel.tsx` | 将既有预检内容放进已有纵向主内容区的受限块，不再成为第三个横向 shell 主列；必要时只给 warning/path 与动作行添加专属 class/语义包装 | 不新增恢复协议、preview 摘要锁、路径格式、上传模式或全局弹层架构 |
| `packages/dsh-pm-tool/src/client/panel.css` | 对本恢复预检块设置可收缩/限宽；warning 长路径可靠折行；`pre` 采用保留换行的可折行展示或明确受限的内部滚动；长内容纵向内滚/页面滚动，确认/取消不被裁切；沿现有 token 和窄屏规则 | 不靠全局 `overflow-x:hidden`、截断/删除路径、隐藏错误、CSS transform 或重排全部 shell 掩盖问题 |
| `packages/dsh-pm-tool/src/client/panel-restore-path.test.ts`，必要同范围真实组件测试 | 补结构回归，验证预检仍显示完整原文、仍在正确内容层；同一路径、取消和两确认接缝不变 | 不用 DOM 文本断言冒充布局/GUI PASS，不改 F5 或产品预期来逃红 |

独立专家只写本前缀。Main 唯一产品写者/builder/GUI 执行者；用 writing-plans 的文件级步骤组织本合同，明确授权优先，不执行其 worktree、commit 或 `docs/plans` 模板动作。

## 先行用例

1. **RV01-LONG**：保留原 fiKpOr F5 完整长路径与侧车，真实更多→填完整路径→预检；记录实际 viewport、shell/main/preview 的 bbox 与 scroll/clientWidth，并采完整 PNG/原 compositor 时间段。预期不再出现第三主列或外壳横滚；警告、13表摘要、确认/取消可见可达；完整路径可查看，不删除或截短原命令。
2. **RV01-CANCEL**：同长路径预检→取消；data/files/backups 的完整键+hash 前后零差异。重开输入/重预检不得借取消提交恢复。
3. **RV01-CONFIRM**：重预检→第一次确认仅开原危险对话框→第二次明确确认才恢复；保全原路径与 F5 的十三表/共享/修订/软删/双字节。第一次与第二次提交边界分别记录，不新增摘要锁定要求。
4. **RV01-REACH**：预检/危险对话框内纯键盘到两个动作，记录焦点可见、取消和关闭返回；长摘要滚动后按钮仍可操作。对话框本体原有可读折行不退化。
5. **RV01-WIDTH**：先复现并修后补 1440×900 浅色、390×900 浅/深同长路径；对应 origin 用原生菜单显示 100%，记录实际尺寸，不用 DPR 替代。原 B8 已有其他宽/深/200% 格仍按原合同补，不因本最小复验转绿或重新发明矩阵。

执行顺序：旧 A7 同用例保红 → 最小修复 → 新候选全源/补丁/产物/宿主/实例/开关认领 → 受影响组件/launch/bridge 自动回归与 Main 完整出口 → Main 原 GUI 补件 → 独立专家复验。不得覆写 A7 原证，不能沿用旧 A6 下发证明新 panel。纯 CSS 改动也影响呈现和 bundle，需新下发认领；数据结果继承须说明接缝未变。

## A7-NAME01：已定位，暂不定产品 FAIL

- `task-files-reentered.json` 主表单文字为“文件 fa-0001 / 文件 fa-0002”，`download-proof.json` 和真实下载原文件为“QA 中文 文件.md”，22字节 SHA256 等源。不是字节丢失、恢复失败或下载失败。
- `index.ts:243-246` 已向 snapshot 投影 `fileName/size/sha256/projectId`；`panel.tsx:338` 的 `fileAssets` 声明却是 Record，后端实际为数组。`panel.tsx:1519-1540` 未将资产元数据传给 TaskForm；`task-draft-materials.tsx:248-268` 使用附件镜像，`task-materials-mirror.ts:157-160` 缺 fileName 时明确回退“文件 <ID>”。F5 附件本来只有 assetId，名称在 file_assets，不能回填附件字段伪造显示。
- 当前已核 RA-F04 合同要求实际中文/空格文件名下载及安全头；已核批准恢复合同要求记录/文件一致，没有找到强制“主表单必须显示资产 fileName”的明确条文。因此本轮只登记展示投影接缝缺口，**不自动扩为新 UX 或开修复**；不把 ID 回退自签为名称完整展示 PASS。
- 最小后续定位材料：按原合同提供 TaskForm 文件区域实际滚到可见的 PNG、当前公共 snapshot 的该项目两条 fileAssets 脱敏结构及既有 B3 名称展示条款（如确有）。只投影该项目元数据，不读凭据、不扫正式库、不修改附件/备份；再由专家核是否属于既有承诺缺陷。
