# batchA 独立缺陷与 Main 即时采证单

> 给协调者 trae/Main 与修复开发使用：记录独立源码核查、最小隔离探针、第一批补采步骤及 TTL 测试合同纠正。本报告只对注明的对象判定，不是第一批或全系统 PASS。测试专家不改产品、不提交、不推送、不启服务。

## 1. 对象与本轮权限

- 负责人本轮派单：独立测试专家、非开发；先核三项自查和 TTL，再盘点计划 §3 全部未验功能；Main 采证及修复；最后审证者才给 PASS/FAIL/BLOCKED。
- 文档 HEAD `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`；产品提交 `2a7603023bc54ef13d788e50069ee3fde4671bf3`。本轮 `git diff --name-only 2a76030 -- packages launcher` 为空。
- 仅写 `docs/testing/` 自有产物；未 pull/build/install、未操作正式 3172/PID44388/profile、未共用 `lib/`、未监听端口。临时探针复制四个冻结模块至系统 tmp，并由生成器写出测试壳，未执行壳。
- 依据 AGENTS §6A、collaboration §9/§11（ADL-045/047/057/058）。本派单“不 commit/push”覆盖角色自身，不继承所有者给 Main 的最终提交授权；不授权发布或正式切换。
- 基础材料：原 `independent-acceptance-batch1-closure-plan-20261021.md`（含 §13/§14 纠正）、R4/R5、`reports/batch1-expert-signoff-20261021.md`、批准的盘点及 EGO/OIL 分工。

## 2. 已确认缺陷

| ID / 优先级 | 独立结论与对象 | 证据 / 原因 | 处置范围 |
| --- | --- | --- | --- |
| BA-DEF-01 / P1 | **FAIL：生成壳的路径引用** | `launcher/src/local-app.mjs:70-71` 将绝对 launcher/node 路径直接放入单引号。普通及空格路径 `sh -n=0`；launcher 或 node 含单引号分别 `sh -n=2`。特制路径生成 `LAUNCHER_BIN='/tmp/qa'; :; #/main.mjs'` 且语法为 0，赋值外出现独立 shell 命令。未执行注入。 | Main 修路径字面量安全引用及单测；正常路径不能证明安全。风险依赖构建输入路径可控，不声称已发生远程攻击。 |
| BA-DEF-02 / P1 | **FAIL：旧旅程回告可冒充当前旅程** | `launcher-app.mjs:43-61,143-185` 只消费命中的 nonce，未撤销此前旅程。探针 Chrome 打开→切 Safari→旧 Chrome nonce 校验 true→S4，副标题称已进入 Safari；取消或返回后旧回告亦 S0→S4。重入/再次打开/重试旧 nonce 仍有效。 | 修旅程失效及 nonce 与有效当前 journey/browser 的绑定；保留 single-use、Origin 和 ready PID 保护。不读取浏览器 cookie、不用 token 补偿。 |
| BA-DEF-03 / P2 | **FAIL：ResultCard 新消息继承旧复制反馈（独立源码证实；GUI NOT_RUN）** | `panel.tsx:1273-1278` 连续非空 message 渲染同一未加 key 组件；`:1981-1995,2037-2040` copyState 保存在组件状态且没有 message 依赖重置或请求代际检查。复制 A 成功后 message 改 B 仍显示“已复制”；A 的延迟 resolve 也可给 B 标成功/失败。`result-card-copy.test.ts` 仅测 writer，不覆盖组件更新。 | 修消息切换状态及迟到异步结果；新增组件更新/延迟 writer 回归。不得因 wrapper 不抛异常把 GUI 判通过。 |

严重度仅用于顺序，三项均未获豁免。BA-DEF-02 的 `select-browser` 与 `report-auth-error` 探针是补充观察：单改偏好不一定已经投递新旅程，同一页面完成登录后有效回告可能正当，不将这两项独立扩大为必然缺陷。明确需拒的是已替换旅程及 cancel/back 的旧回告。

### 独立探针证据

环境：macOS/darwin，Node v22.23.3；时间 `2026-10-21T07:19:05.253Z`。命令：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
node docs/testing/batcha-review-probe-20261021.mjs
```

退出 0 是探针完成，不是产品 PASS。原证 `batcha-review-probe-result-20261021.json` 保存四模块 sha256、生成壳 sha256、5 格语法退出码、8 个内存动作结果；源码均从产品提交提取并与当前文件逐字节校验。只证明生成语法和编排行为，不证明 Finder、HTTP 鉴权或真实浏览器。nonce 未输出，未改 Date.now/系统时钟。

## 3. TTL 合同裁决与替代条款

1. 原 R4 与收口计划 §9 B1-DESK-02 第 3 步要求 `>120s` 拒绝，来自当时实现快照；原形态/状态合同 §2-4 **没有 120s 数字要求**。不能把测试专家对旧源码的描述升级成所有者固定产品时限。
2. 当前产品 `launcher-app.mjs:14-18`、`launcher/README.md:25`、`IMPLEMENTATION-REPORT.md:150` 与测试明确声明有限 TTL **10min**，目的是覆盖首次鉴权/API 配置；不是无限授权，未取消 single-use/Origin。数字变化未单独证实为所有者产品决策，但不与原有效状态合同冲突。仅就本轮已批准候选核查，专家将 TTL 测试参数纠正为 10min，**不因 130s 仍有效开产品 FAIL，不改回 120s**。
3. 本节替代原收口计划 §9 B1-DESK-02 第 3 步的 TTL 参数，原文字保留为历史。其他安全负例及 §13 safe app、§14 两条合法 code fixture 继续有效。
4. **BA-TTL-01（AUTO/内存+GUI桥，NOT_RUN）**：新旅程生成 N1，不替换、不消费；以真实单调计时记录 130s 后，受控首次合法回告应被接受。GUI 正常认证不应被超 2min 误拒。N1 只验证一次。
5. **BA-TTL-02（AUTO/HTTP，NOT_RUN）**：另一新旅程 N2，不替换、不消费；真实等待 601s 后再首次回告应 403 invalid-nonce、不得 S4。不可复用已消费 N1；不得改时钟。单元假时钟只能另列白盒证据，不代替此项。
6. **BA-TTL-03（AUTO，NOT_RUN）**：在有效 TTL 内，新旅程替换/取消旧旅程后，旧句柄即拒；不得借“10min 内”允许旧旅程迟到。不要求 Main 用毫秒级网络时点验证恰好 600000ms 等号语义。

若协调者查到所有者已生效的明确 120s 数值合同，暂停 TTL 两项并交专家修订，不临场改预期；其他修复/采证继续。这不是把所有 nonce 风险归为合同问题。

## 4. Main 现在可以执行的步骤

### 4.1 冻结与提交点

Main 是唯一产品写者及 builder。本报告新用例是缺陷复验，不是授权开发新功能。每次修复前后保存基线、tracked diff、新增文件清单/sha256、锁文件；隔离输出和运行实例须重新绑定。**旧 safe app hash 仅用于旧候选，生成器/桥改动后必须生成新 app 并认领，不能要求沿用旧字节。**

每个目录至少有 `candidate.json/environment.json/steps.txt/journey.mov/console.json/storage-before.sha256/storage-after.sha256/evidence.sha256`；自动项另有 stdout/stderr/exit；逐态布局、原文与系统剪贴板核值必须实际归档。参数含 nonce/token/cookie 的请求不得落 HAR/录屏/日志；记录脱敏状态码和句柄关系（N1/N2），不记录原值。Main 输出原始现象，不写验收 PASS。

### 4.2 修复复验用例

| 用例 / 门 | Fixture / 初态 | 动作与显式提交点 | 预期及必交原证 |
| --- | --- | --- | --- |
| BA-PATH-01 / AUTO | 临时 generator 副本，launcher 与 node 路径依次为普通、空格、中文、单引号及双路径单引号 | 各生成独立 app；只运行 `/bin/sh -n`；用隔离无副作用 stub 验证解析后 Node/launcher argv 等于原始路径。stub 不启 dsh。 | 各语法 0，完整路径不分裂；特制路径只能是值，不能新增命令节点。归档脚本、输入、argv、exit；不得执行任意注入 payload。 |
| BA-JOURNEY-01 / AUTO+GUI | 正常隔离 Finder 启动，同一 control；认证 A 与无 cookie B；阻延 A 回告但让 A 正常 mount/snapshot | 打开 A 保留 N1 于内存→切 B→再次打开形成 N2；释放旧 A 合法回告；B 未认证时观察 control；合法完成 B 认证/mount 再释放 N2；最后 replay N2。 | N1=403、不使 B 显 S4；B 无认证仍 401/诚实待认证；有效 N2 才 200/S4，replay 403。录屏、逐态 control/browser、脱敏响应、桥 ready 原证。只阻延回告，不伪造 snapshot。 |
| BA-JOURNEY-02 / AUTO | 内存 app fake IO（不开端口）每个分支新建实例 | open(N1)→reopen/open/retry(N2) 分别调用旧回告；另 open(N1)→cancel/back 分别回告；记录状态 | 替换或取消的旧句柄 false，cancel/back 保 S0；最新正常回告仍可达 S4。归档动作序列、返回值、状态；不以此替代 Finder。 |
| BA-COPY-01 / GUI | 隔离合法项目；备份错误 A、不同错误 B；允许系统 clipboard；1440×900、100%、真实深主题 | 从恢复预检入口触发 A→复制原文并核系统值；**不关结果卡**，再触发 B→截图未复制 B 的状态→复制 B→系统值回读；再做拒绝权限 B | B 出现时无 A 的成功/失败残留；B 复制与完整原文相等，拒绝诚实失败，数据零写。分别保 A/B 文本、时间、录屏、实际粘贴值。注入 writer 只能证明参数。 |
| BA-COPY-02 / AUTO | 可控 Promise writer 与真实组件渲染器，A 复制尚未返回 | A 开始复制→rerender B→resolve/reject A；再复制 B | 旧 Promise 不能改变 B 反馈；仅 B 结果可改变 B。不得用自建 copyState 模型替代产品组件。记录组件断言输出，GUI另验。 |

本人的认证/权限仅在确实系统阻止 Main 时列 MANUAL_PENDING（动作、错误、必要本人步骤）；Main-only Finder 能力不是 user-only，仍由 Main 采。不允许从正式实例复制认证或 data。

### 4.3 原八项补采清单（不删测、不替代）

| 原 ID | Main 按原计划执行的必要原证 / 纠正 |
| --- | --- |
| B1-PATH-01/02 | §10 四格 P0/P1/P2/P3、各独立 `lib`、命令 exit/argv、导出覆盖失败清理/settings 全新进程读回、实际写根；当前实现已修路径，先验不预设重写。 |
| B1-GUI-04 | §8 当前 schema+deriveHabitStreak+标准备份→产品预检/confirm；最近14天含边界日与跨两旧月，分组/重进/幂等/超窗零写。合法历史不受 checkin 两天写窗限制；不手改 data 或墙钟。 |
| B1-GUI-01 | §5 同会话三拖三撤销，分别交 0/1/2/3 拖和每次撤销坐标+bbox+ID；保存重进与取消零写另证。不只给最终截图。 |
| B1-GUI-02 | **按 §14 而不是旧 §6 缺 code fixture**，1440 两条合法 code，键盘复制两行+系统值、真实拒绝权限、不误开行；每次 viewport/zoom 记录。 |
| B1-GUI-03 | §7 真实宿主深主题、非法 OKR 就近错误、备份预检单前缀/长错误持久且单处、复制实际值、关闭恢复焦点；归档**新候选**错误 JSON，不覆盖旧双前缀证据。附 BA-COPY-01。 |
| B1-DESK-01/02 | §13 safe app 前置重绑定、Finder 指针真实双击完整录屏、合法认证→mounted snapshot→**当前旅程**→S4；全安全负例/cancel精确PID。TTL 改按本报告 §3；附 BA-JOURNEY。不得终端 open 代替。 |

旧磁盘 `restore-error.json` 是修复前双前缀，**不是新候选 FAIL 的证据**。Main 报告“最终观察成功”但未归档的 Finder/撤销/复制链，当前记 **BLOCKED（原证缺失/候选无法回绑）**，不是据缺证判产品坏；尚未执行新轮的子项记 NOT_RUN。

## 5. 历史继承与失效

- R4/R5 原 PASS 保留其日期、675×745 浅主题、冻结 diff 与具体子项范围；不重开已撤回的“删任务缺 undo”“select-only 没关联”等误判。
- BA-DEF-01 修生成器使旧 app artifact 身份过期，重采路径/Finder；不自动使离线 task CRUD 失效。
- BA-DEF-02 改 nonce 生命周期使 launcher 旧42/44项、bridge/Finder与安全/TTL 的受影响证据须复验；不据旧 S4 图片继承当前旅程成功。
- BA-DEF-03 改 ResultCard 使错误/复制/共享反馈相关 D-05/D-09、O3/O5 交互证据受影响；无行为差异的独立资料数据验证可保留，须在总登记按文件接缝论证。
- 尚未对当前候选给第一批 PASS。先关闭本表确证缺陷、执行补采，再由专家逐条审证；完整旅程总登记另交，不以八项数目代替全系统覆盖。

## 6. 下一交件

Main 立即可修 BA-DEF-01/02/03 并采上列用例；先交新的候选清单和原证索引，专家按同一候选审签。测试专家继续整理全部未验功能的有界总登记。期间只做已有承诺收口/确证修复/补测，不启新功能或发布，不用工具参与数、单测数、截图数给整项 PASS。
