# A13 中文文件名上传独立确证与红例

> 本文给 Main 交限定 dev：记录独立白盒结果、A11 原件与证明边界。只确证 A13-U01，非产品修复 PASS；合同及用例见 [plan](a13-unicode-upload-contract-20261021-plan.md)、[cases](a13-unicode-upload-contract-20261021-cases.md)。

## 结论

**A13-U01：FAIL / 确证，阻塞中文真实上传闭环。** 生产客户端把 raw Unicode 写进 `x-pm-file-name`，实际 Headers 的 ByteString 转换在发送 HTTP 前失败。不是服务端拒绝、文件内容/大小不合法或中文下载本身失败。

A11 原生 chooser 原件可见所选 `QA 文件 原件.md` / 22 字节；页面 JSON 可见 Chromium 错误：

```text
暂存上传失败：Failed to execute 'fetch' on 'Window': Failed to read the 'headers' property from 'RequestInit': String contains non ISO-8859-1 code point.
```

本专家只读已有 PNG/JSON，不操作浏览器。源码 `stage-client.ts:73–89` 与原件相符；原 mock fetch 没有真实 Headers 构造，是覆盖缺口，旧信封映射 PASS 不证明中文头可传。

## 实际命令与结果

环境：macOS arm64，现有 nvm Node **v22.23.3**；未执行 pnpm、安装或 build。运行日期 2026-10-22；目录 `/Users/bytedance/Projects/dsh-pm/pm-tool`。

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --experimental-transform-types docs/testing/a13-unicode-upload-contract-20261021-red.mjs
```

**退出码 1，3 FAIL / 3 PASS 对照**；原始结构化输出在 [red.json](a13-unicode-upload-contract-20261021-red.json)，重放源码在 [red.mjs](a13-unicode-upload-contract-20261021-red.mjs)。

| 用例 | 实际 | 精确范围 |
| --- | --- | --- |
| A13-RED-H | FAIL / TypeError | raw 中文文件名构造原生 Headers 失败 |
| A13-RED-R | FAIL / TypeError | raw 中文文件名构造原生 Request 失败 |
| A13-RED-PRODUCTION | FAIL / StageUnavailable(reason=network) | 直接导入未修改生产 stageAsset，fetch 截断处构造原生 Headers/Request；失败被生产错误包装。**network 分类不等发过网络** |
| A13-CONTROL-ASCII | PASS 对照 | 原生 Headers/Request 接受旧 ASCII |
| A13-CONTROL-PRODUCTION-ASCII | PASS 对照 | 同一生产函数、同一截断条件 ASCII 构造/信封映射成功；测试信封不代表真实 stage |
| A13-PROTOCOL-FEASIBILITY | PASS 可行性 | 中文/空格/百分号/+ 的完整 encodeURIComponent + ASCII 标记可构造且 decode 一次还原；不是产品协议已实现 |

两条原生 TypeError 原文一致：

```text
Cannot convert argument to a ByteString because the character at index 3 has a value of 25991 which is greater than 255.
```

三红是**同一个根因**的构造层/生产调用层定位，不增加缺陷计数。raw Headers/Request 失败是平台约束，修复后仍应保持拒绝 raw Unicode；本脚本是原候选诊断红证，不是修后“全部转绿”套件。修后以 cases 的真实生产 C01 等断言通过为准，不能要求修改平台 raw Unicode 校验。

## 候选与原件绑定

- HEAD / 本地 origin/main ref 均 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；没有 fetch/pull。真实白盒候选以 red.json 的六文件 sourceSha256Before/After、scoped trackedDiff/untracked 认领，不用 HEAD 替代 dirty 候选。
- A11 candidate.json、product-tracked.patch、environment.json 与五件 native-files 原证全部前后 sha256 一致；只认领原件及当前所测源，不声称重新证明 A11 bundle/PID 全运行身份。
- `/private/tmp/pmtool-a11-native-files/QA 文件 原件.md` 实读 22 字节且 sha256 为 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`。Blob 使用这些原字节而非替造文件。
- A11 before-open 与 failure-boundary 的 data/files/backups keys 去前导 `/` 后逐 hash 完全一致；原 JSON 未改。这不把“没有成功 stage”冒充 stage/cancel 成功。
- Node 只在内存执行 TS，未生成编译目录或写共享 lib。fetch 替身调用原生构造器后返回测试 Response，绝不调用所保存的 nativeFetch；结束已恢复 global fetch。`nativeFetchInvocations=0 / httpSent=false / productWrites=0 / guiOperations=0 / serversStarted=0`。
- 工具第一次因 `login=false` 不受支持拒绝参数，未运行脚本；移除此参数后上述命令实际执行 exit1。Node 的 ExperimentalWarning 是运行模式提示，非构建/安装失败。

## 交付自检

- `node --check docs/testing/a13-unicode-upload-contract-20261021-red.mjs`（同一绝对 Node 路径）：退出 0，仅语法检查，不加载业务或运行上传。
- Node 标准库 `fs/path/crypto/assert` 只读校验：退出 0；指定前缀恰好五文件，三份 Markdown 尾换行/行尾空白合格，15 个相对链接存在，源码/原证前后 28 个指纹逐项匹配，漂移 0，JSON 结果确为三红三对照、httpSent=false、fetch 已恢复。
- `git status --short -- docs/testing/a13-unicode-upload-contract-20261021*`：退出 0，仅五个新增未跟踪交付文件；未暂存/提交。以上是文档与原证完整性检查，不改变 A13-U01 的 FAIL。

## 未覆盖与交接

服务端新标记/严格解码、安全接缝、真实 stage/主保存/下载、新 GUI/认证、完整回归及新候选审签均 **NOT_RUN**。未运行 build/verify/services/install/credentials/commit；仅写本前缀五文件，未更改产品或共享档案。相关源码与 A11 原件前后指纹检查通过；只检查这些根，不声称全仓其他并行任务无改动。

[原文件专项](materials-files-reports-independent-auto-20261021.md) 的 RA-F01/F03/F04 有限 AUTO 结果仍保其明确范围；它们不覆盖这次 raw Unicode fetch 构造缺陷，不洗成新 GUI/整门 PASS。

Main 可直接将 plan/cases/red 交给限定 dev，只改 stage-client.ts、asset-route.ts 和同域两测试；随后专家重认领复验，Main 唯一新构建/原生 chooser/取消与保存下载采证。**本次先行合同交付已结束并释放，不继续实现或启动其他任务。**
