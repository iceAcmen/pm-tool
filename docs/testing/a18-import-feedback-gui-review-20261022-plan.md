# A18 导入故障错误反馈独立 GUI 审证计划

> 2026-10-22，trae，独立测试专家，非开发、非 GUI 执行端。仅审既有原件、签有限结果，供 Main 与接续专家复核；不签整项导入、完整矩阵或提交。

## 范围与授权

本轮负责人指定只写 `docs/testing/a18-import-feedback-gui-review-20261022*` 及自有 evidence；禁止产品、其他 testing、livingdocs、build/install、GUI、service、credential 与 commit。原持续验修授权的最后普通 commit 不由本角色执行。具体边界优先于通用 SOP 的拉取、构建、全回归与档案同步。

已读 AGENTS、collaboration §9/11、旧 A15 导入故障 GUI FAIL、A17 先行合同、A18 错误 context 批准计划与有限独立 SOURCE/AUTO PASS。旧 A15 FAIL、原20的19绿1红、Main 原95中的93绿2红及 A19 共享十件 `.bin` 漂移不修改、不洗绿。Main 当前源码与在途输入不纳本角色零写保护；A18 冻结源、lib、固定原件必须保真。

## 审证步骤

1. 自有审计脚本仅使用 Node 内置 fs/path/crypto/util，禁止导入产品或采证执行器、访问网络/服务/浏览器/凭据。先登记固定输入及 A18 声明 source/artifacts 的 bytes/hash/mtime。
2. 核 candidate、tracked patch、首轮 build、pinned11 proof、环境骨架、host-start/ready、原 F5 GUI 预检及两级确认恢复；辨别目录声明与实际运行时点。完整 loaded 响应、唯一完整执行段与实际 target/timeOrigin 分别认领。
3. 对597索引原件、455合成帧、八步原 exit/roots/raw、两复制 pbpaste、完整 commands/faults/console 独立核 bytes/hash、事件与数据。native chooser/失败/忙态/复制/重试/真实ID重开 PNG 与关键 JPG 独立目视，不将机器核帧称全部逐帧目视。
4. 按原 RA-IM01/N01、LG-G05 与 A17/A18 合同签精确切片：错误全文/alert/assertive/红卡、停留时点、复制、保预览/三控件、明确生产重试/新父子/raw/旧记录/文件字节。第二点仅发生于 disabled 后；不签同帧或宿主收件后的失败事务。
5. 原包若无成功标题含失败/Failed/Error、带成功信封标记的 catch 原因、关闭重开/同值代际/复制竞争 GUI 原件，明确最小 BLOCKED，不能借 SOURCE/AUTO 扩成 GUI PASS。成功重试只签其实际可观察清错结果，不猜内存 state。
6. 核精准 collector64565 argv/cwd→TERM→end→ps1空输出，只引用历史原件，不重新探活/杀进程、不伪造父工具最终码。核脱敏：报告不复制凭据；扫描仅报可疑文件，不输出疑似秘密值。
7. 输出本前缀 audit/report/seal；前后保护固定输入与冻结候选无漂移才释放。共享依赖漂移独立引用 A19，既不追溯否定早于漂移的签字，也不因本 GUI 切片通过而解除其门。

## 文件与执行

只新增本前缀 `-plan.md`、`-audit.mjs`、`-audit.json`、`.md`、`-seal.json`。本角色不重跑任何产品测试、完整95或原采证动作。

```sh
# macOS，仓库根；现有 Node22，仅文件审计
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a18-import-feedback-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-import-feedback-gui-review-20261022-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a18-import-feedback-gui-review-20261022-audit.mjs seal
```

进度：规则/合同、597原件/455帧指纹、八步/复制/落盘实核及17PNG/8JPG目视已完成；33项结构断言成立，有限反馈/恢复PASS与未采GUI控制BLOCKED已写报告。最终保护比较见seal；本角色不执行补测或commit。
