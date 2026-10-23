# 副驾鉴权原因覆盖修复计划

> 父持续多角色/确证修复授权；开发与验收分离，全部验完后普通commit，不push/tag/发布/切正式。Main唯一builder和GUI端。

**目标：** 实际AUTH/INVALID_CREDENTIAL保留“凭据无效”原因，真实MISSING_CREDENTIAL沿缺凭据配置指引。

**依据：** [独立先行](../testing/ask-auth-feedback-red-20261022-r1-report.md)真实handleAskCommand→generateDraft→LlmRuntime/pi终止链，8控制绿/3鉴权红；3260网关401/UI误报缺Key原证在CombinedGuiR1。原AIclient修复门保留，覆盖错误来自command层。

**唯一业务文件：** `packages/dsh-pm-tool/src/commands/ask.ts` 第126行附近。删除按message `/Key|密钥/`泛匹配缺凭据的分支，使用精确`MISSING_CREDENTIAL` code及原兼容哨兵。不更改全局分类器、schema、模型路由、上游或凭据服务。

**步骤：**

1. 开发读先行11项及原cmd/ai-client，记录主树输入/父107与并行修复的实际SHA。
2. 最小修改上述catch；原test归专家、不改oracle。
3. 自有隔离配置/tmp/cache执行原8控制+3鉴权及受影响副驾/反馈测试；record commands/exit/zero-write，不build共享lib或启停实例。
4. 另一独立专家复验SOURCE/AUTO，Main等所有在途门齐再唯一后继build/完整回归，实际GUI401原因与限流/正常恢复补证。
5. 同步档案/知识根因，父全部逐域总出口齐再commit。

**边界：** 正常正文含Key不改变成功；无凭据/鉴权/限流不相互改写，原底层硬故障不换池维持。未捕历史不补造，原误诊/重启和失败原件保留。
