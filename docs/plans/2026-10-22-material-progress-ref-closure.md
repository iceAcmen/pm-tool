# 资料进展引用崩溃与候选不刷新的最小修复计划

> 2026-10-22，trae。沿父任务全部既有余项验收及确证修复授权；依据不同独立专家[必要红](../testing/material-progress-ref-crash-20261022-r1-report.md)，3控制绿/4必要红。开发与验收分离，Main唯一builder/GUI，不push/tag/release。

**目标：** 既有资料、新建两link及文件引用可真实选择，选中值进入进展草稿；不因事件回调崩溃卸载，不靠文件暂存偶然刷新新link选项。

**方案：** 在handler内同步读取checked，函数updater只消费布尔值；移除该处依赖可变journal数组的无效memo，直接从当前journal计算候选。保原c-ID/at-ID解析、ops信封、主保存/取消及清理。`persist()`不能保currentTarget；改OpsSession全局数组或吞异常扩大影响，均不采用。

**环境：** macOS、nvm Node22.23.3、pnpm11.28.5；使用既有React18.3.1/JSDOM25.0.1兼容设施的独占复制，不install/build共享输出。已授权具体缺陷修复，不重复问批准。

1. 独立开发仅写 `packages/dsh-pm-tool/src/client/shared/task-draft-materials.tsx` 和必要同域新测试；原独立cases/报告/在途 `MaterialRemainingR1` 不改。Cycle五文件及ATF两文件均保留，不进入core/tasks/b2-ops/stage/全局CSS/dirty。
2. 自有完整冻结先原样重现N01既有资料、N02两link缺选项、N03 c2+file、N04先file引用及三控制；真实React事件生命周期，不手造永活currentTarget。
3. 最小组件修复后实际select/unselect既有/新link/file，进展refs正确；原七用例不弱化，不只断“没抛”。
4. 必要新DOM回归与受影响draft/alias/materials/stage/lifecycle/原子保存测试，在自有tmp/no-cache单worker运行；保持无refs保存、取消DELETE、submissionRef成功卸载不DELETE/字节保全控制。主包noEmit，无共享build/lib/服务/Git写。
5. 开发交回increment patch/SHA/完整候选/原exit/设施失败与保护，另不同独立专家复验。统一新候选同时含Cycle/ATF/本修，Main等各SOURCE/AUTO门后再唯一build/必要完整回归。
6. Main新实例按原J03/M06两link+progress refs c2+file→取消保留/放弃→重建一次主save/重开/真实at-ID与字节采证交专家，不冒旧3257已加载新修。现M02/J02原件与其他旅程继续。
7. 原B8/文件恢复/成长等总出口全部闭后才普通commit；未签不宣布全完成，不清在途成果。
