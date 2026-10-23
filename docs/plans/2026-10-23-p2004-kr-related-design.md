# P2OKR-R1-01 最小视图修复设计

日期：2026-10-23。平台：trae，角色：最小开发子单。

## 授权与合同

父授权原句：

> 直到把所有没验完的功能全部验完，再把所有代码都提交为止，中途不要停。

本单明确限定：只修确证缺陷 P2OKR-R1-01，不自 PASS，不 Git 提交/push。Main 唯一 builder/GUI；P2002 的 index/panel/tasks 归其他执行者。原测试先行合同是 `docs/testing/p2-okr-habit-remaining-gui-review-20261023-r1-report.md` §6，结合 `AGENTS.md`、`docs/collaboration.md` §9/11 执行。本单范围覆盖通用拉取、安装、构建、全回归、livingdocs 同步和 Git SOP。

允许产品写：

- `packages/dsh-pm-tool/src/client/views/okrs.tsx`
- 新 `packages/dsh-pm-tool/src/client/views/okrs-related.test.tsx`

自有产物仅 `docs/plans/2026-10-23-p2004-kr-related-*` 及新建自有 `/tmp`。禁止 model/index/panel/tasks/CSS/core 写；禁止服务、正式3080/3091、凭据、privatefreeze/runtime、GUI、testing/livingdocs 写。所有现有 dirty 保留。交付证据后释放两源写锁并 STOP，不停止父任务。

## 已批准目的与实际源证据

基线 HEAD 实读为 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，不是 dirty 候选身份的替代物。actual `src/client/views/okr-model.ts` 的 `buildOkrTree` 为每个根、子 KR 和 orphan 构建自己的 `related: OkrViewRecord[]`，软关联不进入 children。actual `okrs.tsx` 仅消费 root.related，KR 和 orphan 均遗漏。根因已经独立确证，不路由 grill/diagnosing。

brainstorming 已应用于目的、约束、数据流和方案比较。目的与方案已获父明确授权及独立合同，不重复提问：

1. 采用：提取既有关联行呈现，root 保持原 markup；KR 在自己的节点内消费自己的 related；orphan 同一呈现窄复用。三处真实重复因此共享一个局部只读组件。
2. 不采用：向父 root 复制 KR related，会混淆声明者、制造重复，不能证明邻接 KR。
3. 不采用：改模型/schema/权重或新增按钮，数据供给已成立且超出本单。

## 呈现与不变量

复用 `.pm-okr-related`、`.pm-okr-related-row`、Link2 和 `关联：标题（ID · 只展示，不参与权重）`。空 related 不出容器。只消费模型已解析记录，不在视图自行查找、补关系或做业务去重。合法三记录 fixture：A 与第二目标 B 同项目，KR 的 primary=A、related=[B]；B 仍是独立根且不进入 A.children。

真实 OkrsView 的 DOM 红测必须在旧实现找不到 KR 关联行时失败。修后同 oracle 绿，rerender 清空消失、恢复重现，主父、children、状态及传入记录不变；无 run/onSaved/create/edit/fetch 调用。root 原有关联与其他 KR 不借用关系。orphan 仅证明同一组件消费已有供给，不新开产品 FAIL/GUI 门。

## 执行与边界

writing-plans 落盘实施步骤。先校 vendor manifest 的全部 SHA/bytes 并执行既有静态 verifier，之后自动路由 TDD；交付边界 code-review 只作开发自查并留 pilot。缺失 superpowers/codebase-design 不搜索、不安装、不执行 setup。

用自有 runner 从当前主树复制 src 到新 `/tmp`，借用既有依赖只读路径，React/ReactDOM 使用已存在匹配版本的 DOM 设施。不安装、不构建、不复用 Main 运行树；HOME/TMPDIR/cache/输出仅自有 `/tmp`。每次命令同步收终码、stdout/stderr、source/test/config/依赖指纹与前后保护差分，设施失败原样保留。手工改文件均用 apply_patch，runner 只负责机械复制和证据输出。

开发绿不是独立 PASS。整构建、全部 verify、GUI、Main 新 freeze/newhost、另一独立 SOURCE/AUTO 复验及普通提交均属后续，不由本单签字或执行。
