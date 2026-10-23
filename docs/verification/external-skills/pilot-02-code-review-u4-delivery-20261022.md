# External Skill 试点记录：U4 交付审查

> 2026-10-22，执行平台：trae。本记录只描述本轮对 U4 交付边界使用 vendored `code-review` 方法的过程与发现，不代替 ADL-045 独立测试结论，也不改写既有试点毕业状态。

## 0. 绑定与自动路由

| 字段 | 值 |
| --- | --- |
| Skill / vendor | code-review / mattpocock |
| 来源 commit | `49dd158d1076134a641b33efb035946536778336` |
| manifest | `vendor/agent-skills/mattpocock/manifest.json` |
| 正文 | `vendor/agent-skills/mattpocock/skills/code-review/SKILL.md` |
| 正文 SHA256 | `09eb147f793e4647949edd32dbad278f0554dfb56e0d46b699cd4c2c55bf0357` |
| Git 基线 | `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，另绑定 U4 r2 manifest 与父增量，HEAD不单独代表dirty候选 |
| taskKind / 触发 | delivery，按 ADL-049 自动追加 code-review；目标是发现交付范围及证据链缺口 |
| 完整性门 | vendorIntegrityVerified=true；本轮交付复核 `verify-external-skills.mjs` exit0，13个mattpocock文件指纹/bytes逐位一致 |
| 授权用途 | “对本分支改动做质量自查：命名、边界、明显安全问题、与既有约定一致性” |

## 1. 使用边界

- 只读加载 `vendor/agent-skills/mattpocock/skills/code-review/SKILL.md`，按 Standards / Spec 双轴审查 U4 冻结候选及交付证据。
- 未运行任何 setup、installer 或上游脚本；未写 `$HOME`、`data/`、上游只读仓库或 `vendor/`。
- 被审对象是 A20V3 父候选到 U4 r2 的增量、候选 manifest、GUI 原证和完整回归原证。
- 独立测试结论仍以 `docs/testing/a20v3-total-gate-independent-review-20261022.md` 和 `docs/testing/a13-u4-gui-total-retest-r2-20261022.md` 为准。

## 2. 双轴结果

### Standards

首轮发现三项证据治理缺口：

1. 缺少 A20V3 父候选到 U4 r2 的相对 patch。
2. `increment-files.txt` 与 `increment-files.sha256` 仍指向 r1。
3. 已保留的 GUI r2 与回归 r3-r6 文件没有完整索引。

修正仅新增或更新交付元数据：

- `reports/all-pending-evidence-20261021/U4/delivery-boundary.json`
- `reports/all-pending-evidence-20261021/U4/parent-increment.patch`
- `reports/all-pending-evidence-20261021/U4/increment-files.txt`
- `reports/all-pending-evidence-20261021/U4/increment-files.sha256`
- `reports/all-pending-evidence-20261021/U4/gui-r2-files.sha256`
- `reports/all-pending-evidence-20261021/U4/regression-files.sha256`

二次审查确认：父候选绑定、10 文件增量集合、patch 正反向应用、GUI 32/32 与回归 39/39 索引均闭合；未修改已签 manifest、独立报告、产品候选、bundle 或既有 GUI 原证。

### Spec

- 未发现 U4 规格缺失、越界扩张或错误实现。
- RA-U401、RA-U402 与 U4 总门均已有独立专家 PASS。
- r5 为 155/155 文件、1590/1590 测试；r6 为 95/95 verify、保护资产污染 0。
- 390px 修复只处理已确认的组织动作段裁切，没有追溯启用待表决的完整视口矩阵。

## 3. 结论与边界

本轮 `code-review` 作为交付前开发侧审查，发现的三项治理问题已关闭，复审无阻断项。该结论不新增独立测试 PASS，不授权 push、tag、发布或正式服务切换；vendored skills 的整体状态仍为“试点可用，未毕业”。

## 4. 验证、越权检查与未覆盖

| 项 | 实际结果 |
| --- | --- |
| `node packages/dsh-pm-tool/scripts/verify-external-skills.mjs` | macOS / nvm Node22.23.3，exit0；两个注册vendor全部sha256/bytes一致，无F1 |
| 产品构建/回归 | 引用U4独立报告绑定的r5 build/noEmit/1590测试、r6 95verify与guard原证，不冒充本试点重跑 |
| 文档格式 | 通用Markdown；`git diff --check` exit0，新文件结构由Main核对 |
| setup/installer、home/global、data、上游、vendor写入 | 全部“否”；本轮只读审查及项目内自有交付文档 |
| 自签独立PASS、删除/覆盖他人成果、推送、联网抓上游 | 全部“否”；不变更已签报告或原证，不运行任何上游安装/初始化 |
| dependency直接触发、缺失skill/未vendored脚本 | 全部“不适用”；仅公开code-review入口 |
| 偏差 | 首轮三项治理缺口已修，未改产品；没有通过此审查证明remaining acceptance整体完成 |

## 5. 独立测试专家结论

【待独立专家填写】本试点执行方不代签。U4产品已有独立PASS不等于本报告或外部skill毕业PASS；本轮无升级/回滚，保持锁定版本及长期红线。
