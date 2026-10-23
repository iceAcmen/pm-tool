# A18 反馈控制补件独立 GUI 审证计划

> 2026-10-22，trae，独立测试专家，非开发、非 GUI 执行端。只审既有反馈控制原件并签有限切片，供 Main 和接续专家复核，不签整门或提交。

## 授权与边界

负责人原句：

> 独立A18真实正常成功含失败词/错误card关闭恢复补件审证，非开发GUI。只docs/testing/a18-feedback-controls-gui-review-20261022*;禁产品/other testing/livingdocs/build/install/GUI/service/credential/commit。
>
> 只签所采正常failurewordtitle成功/错误关闭后normalcontext恢复有限，原closebehindmodal不可达归因按dialog正常focus限制，不替换为保draft-through-closePASS。原原因含successmarkersGUI本包未采继续BLOCKED，不借AUTO。
>
> Main只采无PASS。原涉及资源PID已结束，fullsource保护onlyfreeze旧libs，不纳Main动态src/scripts；结束报告limited+hash保护释放。

只新增本前缀 `-plan.md`、`-audit.mjs`、`-audit.json`、`-audit-r2.json`、`.md`、`-seal.json`，需要的自有证据亦限此前缀。具体授权优先于通用拉取/构建/安装/全回归/livingdocs/提交步骤，不改变工作树或原件。已读 AGENTS、collaboration §9/11、原 A18 导入 GUI 报告/计划、A18 SOURCE/AUTO 报告/计划及批准错误上下文方案。记忆仅辅助，结论以仓库原件为准。

## 审证步骤

1. 登记固定原件、A18 candidate 声明的完整冻结 source/artifacts、旧 lib 的 bytes/SHA256/mtime；不把 Main 动态 src/scripts、在途新报告/服务/依赖全树纳零写根。
2. 独立核 feedback-controls/index 的162条文件、各 frames 元数据及全部帧 hash，核四轮 execution、observations、工具 stdout、commands、raw 与三类根。仅 Node 内置文件 API，不导入产品或执行采证脚本。
3. 重核 candidate/pinned11 source/artifacts、完整 loaded 执行段唯一匹配、3248/PID63429/target BA817/timeOrigin1792629512672.7 原运行认领。新版 Main 的三个 interface script 变化不代表旧冻结候选漂移，不签新 main 或95门。
4. 独立目视全部实际 PNG 和关键 JPG，对照 input/alert/status/卡 class、原生产命令及落盘。正常 t-0001 特殊标题保存与错误后正常保存分别签所采有限范围，不扩成所有成功信封/quiet/代际/复制竞争。
5. 原错误关闭尝试及30秒等待超时完整保留。依据 modal dialog 原正常交互限制解释背后全局卡不可达，不伪称按钮关闭成功或草稿穿越关闭。续采取消/放弃修改、关闭实际错误卡、重新输入同值并保存单独审签。
6. catch 原因含成功/动作标记 GUI 本包未采继续 BLOCKED；SOURCE/AUTO 不替代 GUI。原20红、旧 GUI 缺口、95/A19等其他门原样引用，不改变原报告或扩签。
7. 写有限结论及精确命令/退出/未覆盖边界，核保护前后无漂移；无子测试/GUI/服务资源，由报告声明释放，STOP。不探活、不停进程、不读凭据。

## 验证环境

macOS + 现有 Node22.23.3；不调用 pnpm、不安装依赖。仅本前缀纯文件审计和语法检查，命令/结果以最终报告与 audit/seal 为准。

进度：规则/原报告/有效合同、162原件/103帧/7PNG指纹、状态/生产命令/落盘已核；全部7PNG和8关键JPG已独立目视，有限结论与BLOCKED边界已写。首轮自有审计exit1原样保留，改正扫描器的页面字段/空值新增口径后r2 exit0、23项结构断言成立；最终保护/释放以seal为准，不签整门。
