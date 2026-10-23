# 来源、撤销与缺席队列缺陷收口

> Main协调，开发修复，独立专家另签。持续授权见父执行记录；先行真实红例与有效合同见`docs/testing/governance-growth-independent-auto-20261021-findings.md`。2026-10-21，trae。只修GG01..04已有行为，不新增AI权限/自动化。

- `src/commands/ask.ts`：四类create的实际dispatch新ID带入真正applied action后建refs，拒步不入账；不扫库补造来源。撤销同目标多步按逆序还原到真实前态，内部过渡不当人工冲突；保外部全对象守卫、失败/冲突不覆盖、已撤部分不重复执行。
- `src/core/provenance-store.ts`：audit/undo.used与内存句柄实际耗尽一致。混合成功仍可重试，不把kind=undone无条件当全批耗尽，不抹历史。
- `src/core/queue.ts`：仅缺席项保rest不进主动top；到期/受阻正常项严重度及mute关键豁免保持，quiet仍top空。
- 对应真实command/JSON领域测试先红再绿，四create/update来源、链式clean undo、外部改/混合/再试/故障、absent-only及同时有due、quiet/mute回归；取专家合法fixture和准确expected。新schema若必要先向Main报具体影响，不顺手改文件/客观进度/其他模块。
- 自有tmp已有deps/源码编译输出，禁止install/build共享lib/service/正式/commit。Main唯一同步新候选build/全集/全部verify与新实例GUI；独立专家有限AUTO及真实GUI分开签，旧源按依赖diff继承。
