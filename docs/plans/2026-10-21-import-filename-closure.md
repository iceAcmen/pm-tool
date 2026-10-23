# 导入文件名参数收口

Main 原生 chooser 选择 `QA 原生导入.csv` 后，当前生产 `task import-content` 拒绝“不支持的文件类型：QA”，源文件完整合法、169字节。原图、错误页和初库见 A11/materials/native-import。定位 tasks.tsx 预检/confirm模板未把 file.name 引为一个命令参数，空格导致 tokenizer 拆分。属于既有 CSV/XLSX 导入入口缺陷。

限定 `client/views/tasks.tsx` 两处预检/确认参数序列化及同域真实组件测试；保中文/空格/引号/反斜杠文件名完整、不执行内容或丢扩展名。保现有内容编码、预检全行校验、确认/busy/失败保稿、当前scope和取消。不得放宽 schema/日期/后端半写合同。

独立先行 `a13-import-filename-contract-20261021` 确证实际 task handler 以空白 split，**未支持引号**，原“tokenizer已支持”的假设撤回、首红保留。因此同时限定 `commands/task.ts` 的 import-content 分支解析与同域测试：项目ID后允许JSON字符串文件名或旧无引号ASCII名，严格消费完整JSON字符串内容与唯一可选末尾confirm；不经split/join改内容空白、不双解码、不更改其他子命令解析。错误JSON/额外尾部应现有中文拒绝零写。

先独立最小红例合同→限定开发→独立复验，Main 实际原生选同文件及 XLSX、preview取消/confirm/非法日期零写补采。U4仅先行测试中，暂不并发修改 tasks.tsx。Main 唯一构建及GUI，最后普通commit，无push/发布。

## 本次限定开发执行（2026-10-22，trae）

**目标**：只关闭 A13 原生上传文件名含空格被截为 QA 的既有缺陷。负责人已明确授权本范围实施，不增加通用分词或路径安全合同。

**方案**：`tasks.tsx` 两模板使用 `JSON.stringify(file.name)`；`commands/task.ts` 仅 `import-content` 分支读取项目 ID 后严格 JSON 字符串 filename（或旧 unquoted ASCII），再读取完整 JSON content 字符串及唯一可选末尾 `confirm`。JSON.parse 仅各解一次，保内容空白，不 eval、不额外 decode；非法 JSON、非字符串、额外尾部在任何写入前拒绝。

**可写/独占**：
- `packages/dsh-pm-tool/src/client/views/tasks.tsx`：仅两模板。
- `packages/dsh-pm-tool/src/client/views/tasks-import-confirm.test.tsx`：两条序列化期望和中文/空格/引号/反斜杠测试文件名，其他既有控制断言不变。
- `packages/dsh-pm-tool/src/commands/task.ts`：仅 import-content 分支。
- `packages/dsh-pm-tool/src/commands/task-import-filename.test.ts`：同域解析与零写回归。
- 本计划及 `reports/a13-import-filename-developer-20261021*`：开发原证、自有 freeze/runner/报告。

core CSV/parser/schema、panel、taskviews、U4 与其他 docs/testing 均只读；Main A11/A12 existing lib、依赖、服务、credentials 不动。不 install/build/shared lib/GUI/services/commit/push。脏树不 pull、不清他人成果。本限定授权替代通用开工构建及 livingdocs 收尾动作；不替代独立门。

**执行清单**：
- [x] 读 AGENTS/collaboration 与独立 plan/cases/red，核已纠正的 split/quote 前提。
- [x] 确认方案、文件独占与停止条件；U4 待释放后再实施。
- [x] 新增同域测试，冻结修前候选并原样执行专家 37 用例，保存旧 22 红/4 绿原 exit。
- [x] 最小两模板与分支修复。
- [x] 新冻结无缓存执行原专家 fixture/base/name/protocol、同域测试、相关回归和 TypeScript noEmit。
- [x] 记录完整 hash/exit/原件及监测边界，交独立 SOURCE/AUTO 复验并释放独占。

**方法与停止条件**：原 169-byte CSV / 16561-byte XLSX 四输入同字节；实际 PmPanel→client execute→已安装 parseCommand→实际 pm handler→JSON。FileReader/remote transport 是测试设施，不称 GUI/HTTP。自有 HOME/TMP/cache/DSH/file root 均在报告前缀下，Vitest `--no-cache`；所有子进程退出后释放。开发绿只称自验，不自签独立 SOURCE；Main 后续唯一构建/GUI/总门收口及最后 commit，无 push。

**设施记录**：`old-r1` 专家 fixture/base/name-protocol 正常完成；同域组另有既有 `task-evidence-protocol` 在加载时缺冻结 `f2.json`。`new-r1` 专家 37/37 与同域已执行 24/24、相关已执行 108/108，但后两组原 exit1 同因，不能说整组通过。`new-r2` 专家及同域exit0，相关116绿1失败，缺该旧套件另一原件 `f2-backup.json`。仅修自有 runner 原样复制两原件，并把同域单跑定位到自己的 test；失败日志保留，new-r1/r2/r3产品字节相同。

**开发交回/释放**：`new-r3` 原专家37/37、同域24/24、相关12文件117/117及noEmit均原exit0；静态外部skill校验/diff检查exit0。源码/原件/依赖与监测lib/cache前后零漂移，A11/A12各453原产物hash全一致。完整原exit/hash与边界见 [开发报告](../../reports/a13-import-filename-developer-20261021.md) 及其selftmp索引；开发不自签SOURCE/AUTO、不称GUI/整门PASS。已释放tasks.tsx/同域test/commands/task.ts，U4可由其owner另认领实施，本角色不继续抢写。下一步独立专家复验new-r3，Main唯一构建/原chooser补采/最终持续验收与最后commit，无push。
