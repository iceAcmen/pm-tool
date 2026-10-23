# A13 导入文件名用例

> 给执行与审证者使用：只测既有上传文件名传参、生产解析和不变量；配合 plan 与可执行 cases.test.tsx，不代替真实 GUI。

## Fixture 与执行层

原输入根 `/private/tmp/pmtool-a11-native-import`，四文件复制到自有冻结证据内。合法 CSV 为 169 bytes、SHA256 `9ff4d80a312a90a2f09c3c31805aad7796341ade44e2944fa5c690cb07010501`；合法 XLSX 为 16561 bytes、SHA256 `1181f20b5bfe4400608bc85415b8ffeeadd70f51ac4035099fc4dfc1ed0ff4a8`。合法根/子标题、负责人、日期、进度来自原件，不另造“相近内容”冒充。非法后行日期原件与 A11 索引逐字节匹配。

每例使用自有临时 JSON 库，生产 project/task 命令建立选中项目和旁路项目；无服务/网络。真实客户端 apply 创建 execute/executeRaw，传输边界记录完整 `/pm` line/session/attachments/rawInput/result；实际依赖 `parseCommand` 只切 `/pm`，真实插件 handler 接管其后参数。挂载生产 PmPanel/TaskTable，FileReader 与最少 DOM/localStorage 为设施，不称原生 chooser/浏览器。

## 用例表

| ID | 输入/动作 | 最小 oracle | 未修预期 |
| --- | --- | --- | --- |
| FIXTURE-01 | 核四原件 hash/长度；生产 parseCsv/readXlsxGridFromBuffer/planGridCsvImport | 合法2行、父子层级、原字段；非法后行真实 schema 拒绝。XLSX 不重编码文件字节 | 绿；否则设施 BLOCKED |
| BASE-01 × CSV/XLSX | 同字节文件，File.name 仅改为 `qa.csv/qa.xlsx`；真实组件 preview→confirm→JSON 重开 | preview全库字节不变；原 line 尾加 confirm；创建原两层树、字段正确、旁路不变 | 绿，证明合法内容 |
| BASE-02 | 直接旧无引号 ASCII 生产 preview/confirm | 完整 ASCII 名、扩展正确、同内容树 | 绿，保兼容 |
| BASE-03 × CSV/XLSX | 原合法 preview→取消→重开 | 未发 confirm，全库不变 | 绿 |
| BASE-04 | ASCII preview，同帧双确认，延迟 remote；尝试取消/重选 | 一次确认；确认/取消/file禁用；不关层、不发新 preview；释放后只建2 | 绿 |
| BASE-05 × false/reject | ASCII preview；确认传输失败→重试 | 原预览与原命令保留、零写、锁复位；仅真实成功关层 | 绿 |
| BASE-06 × CSV/XLSX | 原非法日期内容，ASCII名；preview后取消；直接原命令 confirm 两次 | 行3/dueDate错误、无UI确认入口、全部JSON不变、重开不变 | 绿；不点不存在按钮 |
| AUTO-NAME × 6名 × CSV/XLSX | 真实组件选择→实际客户端桥→实际生产handler | preview成功并包含完整原名；内容编码与原 bytes 对应；确认原 line+suffix 后正确两层树/重开 | 空格名红；无空格中文/引号/backslash需实测，不预设都红 |
| AUTO-TEMPLATE × CSV/XLSX | 原空格名；remote 以同字节 ASCII 实际生产 preview 的成功返回作明确控制响应，捕获真实 confirm 模板 | 两 line 均含 `JSON.stringify(file.name)`；confirm=preview+唯一末尾后缀。该控制不签生产接受或落盘 | 红；用于覆盖未可达的第二模板 |
| PROTOCOL-QUOTE × CSV/XLSX | 直接实际生产handler：project + JSON.stringify(name) + 原JSON内容，preview和confirm分证 | 两阶段接受完整原名与扩展；preview零写，confirm正确写入；rawInput未经假tokenizer处理 | 红；证明仅改模板不足 |

六种文件名以测试字符串、不是新增路径/安全规则表示：

```text
QA 原生导入.csv
原生导入.csv
QA "原生"导入.csv
QA '原生'导入.csv
QA\原生导入.csv
QA 原生"引号'\反斜杠.csv
```

XLSX 只将末尾 `.csv` 换成 `.xlsx`；大小写扩展保持既有 `/i` 规则，本批不改内容。字面 backslash 不作为目录分隔；这些元数据不会当磁盘路径执行。AUTO-NAME 可接受任何已批准、被实际生产解析证明的单参数 quote 协议；AUTO-TEMPLATE 明确约束当前推荐的 JSON-string 两模板方向，采用另一真实可用协议前需专家核定，不能静默改用例。

## 主端修后 GUI（本轮 NOT_RUN）

按既有 LG-G05/RA-IM01：新认领实例/未缓存下发，实际原生 chooser 选原合法 CSV 和 XLSX，preview完整名/原outline且零写；取消零写；重选确认创建原两层树、snapshot与JSON重开一致；原非法后行日期preview拒绝且0写。busy/失败保preview沿原合同补采，不扩U4、路径/文件名安全或事务合同。A11旧截图只证明旧故障，不替修后证据。
