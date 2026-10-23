# P2OKR-R1-01 外部 Skill 试点记录

日期2026-10-23，平台trae，角色开发。仅本单自有 plans 留痕，不写通用试点目录或独立 testing。

## 版本与自动路由

- vendor：mattpocock；manifest `vendor/agent-skills/mattpocock/manifest.json`。
- 锁定 commit：`49dd158d1076134a641b33efb035946536778336`。
- `vendorIntegrityVerified=true`：capture-r2 对全部13个文件比 SHA/bytes；静态 verifier initial/final 实际各 exit0。
- taskKind=feature（可测确证缺陷修复，非新功能），自动 TDD。根因已有独立报告及实际模型供给证据，不加载 grill-me/diagnosing-bugs。
- taskKind=delivery，自动 code-review，仅本批产品差分两轴开发自查，非独立 SOURCE/AUTO 签字。
- 读取 TDD 的 SKILL.md/tests.md/mocking.md、code-review/SKILL.md；全部预先校 SHA 相符。可选 GLOSSARY/CODING_STANDARDS/CONTRIBUTING 顶层不存在，跳过。
- HEAD=`9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，dirty 身份绑定 baseline/RED/GREEN source/test，不能由 HEAD 推定结果。

## 预期与实际

TDD 预期：实际 OkrsView 公共接口先红再最小修，同 oracle 复验。实际：RED 7失败/1通过，exit1，所有失败是声明 KR 内关联行预期1实际0；产品+16/-9行后 GREEN 8/8，exit0，邻测59/59，exit0。没有 mock 自有模型/视图，没有改 oracle 凑绿。

父授权和独立合同已明确公共接口及方案，不重复 TDD 追问；本单固定单一缺陷切片的8个观察，未开下一功能。superpowers/codebase-design 未提供，不搜索、不安装。code-review 上游三点 HEAD diff 无法代表本未提交补丁，按项目§11以接手字节与当前两文件自查；已有issue/合同，不执行 setup。

本角色没有可用独立双子代理执行能力，code-review 两轴在本角色分列自查，**不是原生并行双代理评审，也不冒充独立门**。后续另独立 SOURCE/AUTO 专家仍需审签。

## Standards

产品自查无新增规范问题：局部函数消除三处呈现重复；仅取模型供给、没有I/O/存储/确认动作；保既有类/图标/文案；没有 CSS/core/index/panel/tasks 修改。测试沿既有 JSDOM/createRoot/act 模式，业务 oracle 不随实现派生，输入深冻结。未新增运行依赖或包/锁文件修改。

设施发现1项已改正但不洗掉：首capture保护扫描递归进入testing历史临时目录，随后终止自有进程并缩至顶层普通文件。原记录和未收终码见 `facility.md`，不宣称首探索全在范围内。

## Spec

产品自查无额外功能：KR 自己的 related 邻接自己、一次，root 不借行；primary/children和状态不改，清空/恢复成立。orphan 只复用既有供给与同一呈现，不新造FAIL/门。ROOT 原 DOM byte-equivalence 及运行输入保护由 seal 复核。

未覆盖项按原合同交后续：整构建、全回归、新freeze/newhost、真实GUI重进/reload以及独立SOURCE/AUTO，不能由开发8绿替代。

## 越权检查

| 项 | 结论与证据 |
| --- | --- |
| setup/installer/初始化 | 否 |
| 用户HOME/全局配置写 | 否；子进程HOME/TMPDIR/cache为自有/tmp |
| 业务data写 | 否；视图测试记录/回调只在内存 |
| 上游写 | 否 |
| 自PASS/代独立门 | 否；此处仅开发自查 |
| 未授权删除/覆盖他人成果/推送 | 否；产品只按已授权两源手工patch，保原dirty |
| 联网升级/抓上游 | 否 |
| vendor复制改写/依赖直接触发 | 否 |
| 缺失skill/未vendor脚本重建 | 否 |
| 首探索误读testing历史临时目录 | 是，仅只读扫描/元数据；已记录、停止并收窄，不粉饰 |

## 验证与独立结论

完整命令、退出码、指纹和未覆盖边界见 `result.md`、各stage receipts与seal。首次捕获终码NOT_COLLECTED，不推造0。vendor静态输出PASS只指指纹/策略门，不是产品专家PASS。

专家结论：本角色不填写；待独立 SOURCE/AUTO 与 Main 新候选GUI审证。本次不主张 Skill 毕业。升级/回滚增量：无。无需新增ADL或livingdocs变更。
