# A0 路径、看板裁切及真实 TTL 有限审证

> 2026-10-21，trae，独立审证/源码诊断专家。原构建、产品测试、HTTP 与 GUI 执行者为 Main；本报告判定者为本专家。只签下列对象，不是 A0、batchA、全部功能或发布 PASS。

## 1. 即时结论

| 对象 | 本轮结果 | 有限范围 |
| --- | --- | --- |
| A0 同冻结14源文件 | **PASS：身份** | 主树、Main 隔离树、candidate 14/14 hash 一致，未修改产品。 |
| P0/P1/P2/P3 构建、export、settings | **PASS：命令和原断言局部门** | 四格各三命令，12/12 显式 exit0；各自独立 lib，逐格482项源码/配置与220项产物 hash 核对一致；不等于全部 PATH 合同字段齐全。 |
| PATH 本轮六保护根 | **PASS：同范围前后零变化** | 285项元数据包含234个有hash文件和51个目录；另有两个缺根。不是285个业务文件，不覆盖未列写根或历史轮。 |
| B1-PATH-01/02 完整交证门 | **BLOCKED：索引不全** | 新进程读回断言成立，但子进程实发argv/独立status、部分环境/路径/时间索引未保存；没有据此判产品 FAIL。 |
| 1440×900 编辑8卡的右缘裁切 | **合理内滚；实际可达性 BLOCKED** | 截图裁切成立；CSS 明定960px canonical画布和stage横滚，新增drag0 DOM证实879px stage/968px scrollWidth/overflow auto。不能凭1486>1440判布局产品 FAIL。 |
| BA-TTL-01 真实130s | **PASS：HTTP/内存局部** | 130012.600ms，首次回告200、S3→S4；GUI桥与真实认证/mount未验。 |
| BA-TTL-02 真实601s | **PASS：HTTP/内存局部** | 独立实例/未消费句柄，601005.036ms，403 invalid-nonce，仍S3。 |
| A0 完整门 | **未获 PASS** | 看板原完整拖动/撤销/保存取消旅程、GUI桥/Finder/复制与其他既定门不由上述局部结果替代。 |

不新增视口/主题/缩放矩阵，不改旧专家报告，不扩大截图为全部功能失败。

## 2. 授权与候选

负责人本轮原句：“你只审证和源码诊断、不改产品、不构建/安装/启服务/commit/push，仅写自己的docs/testing/a0-paths-board-review-20261021*”；“不要新扩矩阵，不把截图判全部功能失败”；“Main唯一产品builder……勿读runtime/private认证文件”。

本轮依此只读，不执行通用fetch/pull/install/build/启服或产品verify，不更新living docs，不操作正式3172/PID44388、旧3199/PID880或Main3205/PID27767。仅写本报告和同前缀只读checker。依据 AGENTS、collaboration §11、remaining总登记、batchA即时单及 `a0-independent-evidence-review-20261021.md`；不继承Main提交授权。

- 产品基线 `2a7603023bc54ef13d788e50069ee3fde4671bf3`；文档基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，加A0未提交14文件。candidate hash `2b6265bd1953c186f553d4092fa98ff87f2a14480a82e04383cc63255e0de071`，patch hash `fdeadce4b7c39298dc8d2c1d56f5b5854f914893817d7c1eb884f698afc3400a`，与前专家认领相同。
- Main隔离树 `/private/tmp/pmtool-all-closure-20261021`；3205/PID27767、宿主 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2` 为candidate声明。本专家不读取认证根、不连接该服务，不把声明当独立服务装载链已闭门。
- 14文件本轮再次逐hash一致；详细14文件表继承前审证报告 §4，不重抄为新候选。

## 3. 看板独立诊断与 Main 最小合同

### 3.1 截图和 DOM

原证 `A0/gui/board-edit-ready.png` 为1440×900浅色可见编辑态；同名JSON时间10:30:14.696Z，CSS viewport1440×900、dpr1，PM根x280/width1160/right1440，8个“移除…卡片”按钮。截图中右侧卡片/标题明显超出可见区域。

该ready JSON **没有各卡bbox、stage/祖先滚动数据**，`right1486`不能标作来自这个JSON；它原为负责人给出的观测。后到原证 `board-drag-states.json` 的 `drag0`（10:35:36.940Z）明确记录：

- 8卡ID：w-hero、w-ms-deliver、w-scale、w-obj、w-load、w-risk、w-week、w-queue。w-ms-deliver/w-obj/w-load/w-week右缘均1486。
- `.pm-bento-stage` bbox x534、width879、right1413；scrollWidth968、scrollLeft0、overflow `"auto"`。
- `.pm-bento-grid.pm-rgl-editing` 和RGL bbox x538、width960、right1498，overflow `"visible"`；卡片留12px内间距，故right1486。
- 两份证据是不同时间状态，不能假称同步；drag0卡尺寸/位置与ready截图相容，只用于补强当前同候选布局机制。未审该文件其余拖动/撤销状态，不替Main旅程专家审签。

### 3.2 源码/CSS 反证

独立核读主树与隔离树相同字节，且以下四文件均与产品基线相同，非A0复制反馈修复引入的新布局变化：

| 文件 | sha256 | 关键位置 |
| --- | --- | --- |
| `src/client/board/editor.tsx` | `5ddf057cf5bb0eab59dbb31233b59c586959705f452b56f59bc88d8a885cf6f8` | L27-51容器ResizeObserver测宽；L154 canonical12列；L452-523 stage→grid→RGL。 |
| `src/client/board/board.css` | `7be41947c6f3239ebd10eaae4a833279d1fb024f2585f6132b66e50f82e48c63` | L218-227明定窄工作面横向平移、stage `width:100%; overflow-x:auto`、grid `min-width:960px`。 |
| `src/client/panel.css` | `05dc2db1cff4fbf075e95b8ecc81829b7a749c5c924b4e7105049704c4391016` | L225后代border-box；L264 PM rail232；L267 main min-width0；L3015页padding。 |
| `src/client/board/BoardBento.tsx` | `53fd597bb305ad3f969fe31b2c28d4abf46e2a39a30c4fc48ff80ce2411721bd` | L187看板根；编辑与浏览网格分别渲染。 |

表中路径相对 `packages/dsh-pm-tool/`。隔离 `lib/client.js` hash仍为 `5ae7808cb3bcdb3f8e2577c84a587080f6dbd4f87b516a9520266a84872ac9ec`；其中实际包含上述stage横滚及960px规则，不是只看未装入bundle的源码。实际HTTP下发与浏览器计算CSS仍须Main装载链原证。

1440浏览器减宿主左栏280、PM左栏232、页边距/滚动条后，stage真实879，确实小于960。“浏览器宽屏”不等于“看板容器足够宽”。本合同允许内部工作面横滚，禁止的是外壳二维横滚（原B1-GUI-01 §5），不把二者混同。

**裁决：现有源码和drag0 DOM解释为预设内部横滚，不成立确证产品 FAIL；完整实际可达性仍 BLOCKED。** 不声称永久裁掉、不声称右侧按钮已经可操作；未实际采到横滚右缘，也未核document/pm-shell的clientWidth与scrollWidth。原证没有菜单100%缩放证明，theme为null、外窗高度857小于CSS900；按已交值登记，不能反推原生缩放/主题属性已经核实。

### 3.3 给 Main 的最小修复/补证合同

此合同仅收口现有B1-GUI-01同一1440×900编辑8卡状态，不新开矩阵：

1. **先补证、暂不修**：用真实指针/触控板将stage横滚到右缘，归档前后截图及stage clientWidth/scrollWidth/scrollLeft、卡bbox；同时记pm-shell/document的clientWidth/scrollWidth和overflowX/Y，确认只滚stage、不移动两栏/外壳。现有JSON已有部分bbox，不要求重做已保存字段。
2. **若右侧×/缩放柄完整可达、外壳不横滚**：签“合理内部滚动”的对应局部门，撤销布局FAIL假设；无需按截图强行改960、投影或已保存canonical数据。继续原三拖三撤销/保存重进/取消零写，不提前签整项。
3. **仅若实际不可达或外壳承担横滚**：记有限布局FAIL，Main只调整stage与其直接父容器的尺寸/收缩/overflow边界；优先 `src/client/board/board.css`，必要时 `editor.tsx` 的直接包裹关系。不改上游、不写正式数据、不删8卡、不批量改布局、不把 `overflow:hidden` 当修复。`panel.css` 全局修改须先证明直接容器修复不足，并追踪受影响页。
4. **修后限定复验**：同fixture右缘可达、外壳无横滚、8卡ID不变；回归原拖动/撤销/保存重进/取消与相关几何测试。Main唯一builder重新认领受影响源/产物/运行链；旧布局证据按接缝失效，其余无变化PATH/TTL断言不机械重开。本专家不实施修复。

## 4. PATH 原证、计数与有限门

### 4.1 四格身份与命令

实际根为 `/private/tmp/pmtool-path-matrix-20261021/` 下 `plain/pm-tool`、`with space/pm-tool`、`plain/wt-candidate`、`with space/wt candidate`。逐格包目录为各树 `packages/dsh-pm-tool`，realpath确认四个lib为四个本地目录，不是共同软链。

`matrix.source`每格507项 = **482项源码/配置/脚本/文档 +25项历史复制产物**。482项包括364个src、104脚本、2locale、2docs、10根文件；每格全部与manifest、主树包、A0隔离包hash一致。25项为24个 `.tmp/` 和1个 `backup/`，只核复制树当前字节与manifest一致，不称源码、不要求主树存在同历史tmp，不授权清理。每格220项lib产物均hash一致，880次核对无矛盾；不同client bundle hash不因路径变化判污染。

| 格 | build 秒/exit | export 秒/exit | settings 秒/exit | 源码/配置 | lib产物 |
| --- | --- | --- | --- | --- | --- |
| P0 | 8.432 / 0 | 0.235 / 0 | 0.263 / 0 | 482/482 | 220/220 |
| P1 | 8.279 / 0 | 0.241 / 0 | 0.264 / 0 | 482/482 | 220/220 |
| P2 | 7.732 / 0 | 0.288 / 0 | 0.262 / 0 | 482/482 | 220/220 |
| P3 | 8.156 / 0 | 0.260 / 0 | 0.435 / 0 | 482/482 | 220/220 |

Main原命令每格在其包目录：`pnpm run build`、`/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node scripts/verify-export.mjs`、同node运行 `scripts/verify-settings.mjs`。每格build stdout标pnpm11.28.5/tsdown完整成功；stderr展开tsc/copy/tsdown内部命令。本专家没有执行这些命令。

四格关键产物相同：`lib/index.js` hash `6cb0a8024b088df743b308fa81017cf71e49799b270e774129368f3b02ac1591`；`lib/core/export.js` hash `c6b6f4860266c09236572c007590020eda2d31871e9e6df3d3ff2253e58cd601`。24份stdout/stderr完整读取并生成hash索引，可由checker输出 `rows[].logs` 复查。

Export stdout逐格含Markdown/JSON内容排序、默认路径、0700/0600、覆盖保护、confirm和失败清理成功断言；stderr的EEXIST对应 `verify-export.mjs:158` 明确“not-a-directory”负例，非新的产品失败。

Settings stdout逐格12段标签序列 `A B C D A B C D E F E F`，是父/子各A-F的交织，不算12项独立功能；逐格明确“全新进程读回自定义口径”。源码L217-221确有真实spawnSync、child.status=0断言，`--reopen`分支核14/6；未以自建状态模型替代。静态E/F不当GUI。

### 4.2 保护资产

独立比较before/after JSON逐字节hash相同。统计如下，未读其指向的正式文件内容：

| 根 | 有hash文件 | 目录项 | 初末状态 |
| --- | --- | --- | --- |
| data | 123 | 21 | 存在、相同 |
| packages/backups | 110 | 28 | 存在、相同 |
| packages/backup | 0 | 0 | 都缺失 |
| exports | 1 | 1 | 存在、相同 |
| assets | 0 | 1 | 都为空目录 |
| packages/dsh-pm-tool/assets | 0 | 0 | 都缺失 |

本轮285元数据项零增删改，不覆盖home/profile/正式PID/主树lib或其他未列根。矩阵每格 `tempManifest` 有102项，包含node compile cache、导出与settings测试文件；只收到结束清单，不能当全部过程写根或前后零污染。保留前报告首次污染1与设施失败历史，不以本轮零变化抹掉历史。

### 4.3 最小索引缺口

完整B1-PATH-01/02交证门仍 **BLOCKED（证据完整性）**，不否认已核命令/业务断言局部PASS：

- matrix仅顶层node目录、每格package/argv/exit/seconds；缺明确开始/结束时点、逐命令pwd-P、运行时版本与清环境变量清单、独立TMPDIR声明、diff-check前后结果。stdout路径可补强实际隔离tmp使用，不冒充清环境已核。
- settings虽有新进程成功断言与代码生成argv，但未归档实发 `[node, script, --reopen, root]` 的完整值/独立status、stderr及绝对sourceRoot。不能从源码推算随机root补造实发索引。
- 未打印defaultExportDirectory实际值；与脚本相对URL期望相等的原断言成立，但实际路径/权限逐文件元数据索引不全。
- 四格package源码相同已核；没有逐格Launcher文件/diff与build前后manifest，不能把当前相同hash倒推冻结全过程。只在确实缺必需原值时补采，不要求因归档字段缺失重跑整包/扩大矩阵。

## 5. 真实计时 TTL 到件

`real-timing.json`启动10:21:23.534Z、执行PID61871；两个独立app/control实例端口60645/60646，各新句柄、S3初态；01完成10:23:33.555Z，02完成10:31:24.558Z。使用真实Date.now/performance.now，没有墙钟覆盖。

本专家只读检查 `/private/tmp/pmtool-ttl-real-20261021.mjs`，未执行：导入A0隔离生产 `launcher-app.mjs` 和 `loopback.mjs`；探测/打开浏览器为fake IO，提取句柄只在内存，130000/601000ms真实setTimeout后通过Node HTTP向真实临时control POST `/api/entered`，Origin固定合法值。每个实例只首次消费一次，finally关闭其control；未输出句柄/认证。

- 生产app L18有限600000ms TTL，L55登记expiresAt，L60-64验证；loopback L105-133真实HTTP分支验证后才S4。loopback源码hash `6dce1acea2e7064c1fea75c171bfdf345874d670d6bd0160478979eb0a7a62ba` 与产品基线一致；app为当前冻结hash。
- 因Node客户端可以显式设置Origin，此项只证生产HTTP receiver与内存TTL，不证明浏览器CORS约束、dsh认证、mount/snapshot或 `launch-handshake` 就绪桥。BA-TTL-01 GUI部分保持未验；BA-TTL-02 HTTP限定子项可签，不扩Finder/整项安全。
- runner仅在系统tmp，缺不忽略归档副本、执行argv/运行前后源指纹和外层exit；报告保实际hash便于Main补同字节原件。现有结果能签已观测计时/响应局部门，不能补造外层exit0。两实例的JSON句柄关系由runner证实，不复用已消费N1去验过期。

## 6. 指纹与本专家检查

证据根均为 `reports/all-pending-evidence-20261021/A0/`：

| 原证 | sha256 |
| --- | --- |
| `paths/matrix.json` | `6847a0a308957c77aa6c4287a92b8e261f304ba0d92d4dacee23d27d9e5faff9` |
| `paths/protected-before.json` = `protected-after.json` | `e04ecc1fbbd6c9943ff65a74df65e01ddaed12c58b3bcdcebb0e2c1340660115` |
| `paths/protection-result.json` | `8056252a03aeedb001137123bf50c231c983e3a9f3c19ac439135967767efc97` |
| `gui/board-edit-ready.png` | `46b7ac78ea2d60e209a0a42048db77e6b8111313b0fce800c4f1851f16a8fbb5` |
| `gui/board-edit-ready.json` | `15169b6ce81376e0059e159f907efac51cb305ea0077a3b6e85bb6b0055c5809` |
| `gui/board-drag-states.json`（仅审drag0布局） | `0669793fdbd127ae5c07ab5823760234c52090127b537543e093ec025d433d5f` |
| `ttl/real-timing.json` | `933386abc27eeab8e8ac344ec64e3a602add8237eef9a4292d185a21d3f6b980` |
| 系统tmp TTL runner | `1c3f295ab862977a90b913e94cde938bee3f7e0881af3abfba46540d19d33a22` |

新增drag0 DOM指纹与24日志逐hash在自有checker输出，属于可复算原证索引，不改Main原包。后续源/产物/原证变化须重新绑定；截图日期不能单独证明构建到运行身份。

审证环境macOS/darwin、Node22.23.3；pnpm11.28.5仅从Main build日志核得，本专家未运行pnpm。独立只读复核（不执行产品用例）：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a0-paths-board-review-20261021-check.mjs
```

10:37Z第一次完整核查exit0：14/14；各格482/482源码配置、25/25复制产物、220/220 lib；12/12命令原exit0；24日志；六保护根相等；两TTL符合。完整stdout含实际argv/耗时和逐原证hash，exit0只表示只读检查无矛盾。

最终快照10:41:48.972Z，复核同样无矛盾，新增drag0几何索引已回读；checker `node --check` exit0，两自有文件无行尾空白且均有末尾换行。均为审证工具/文档检查，不是产品测试。

过程初版checker曾将全部507条误作主树源码，读不存在历史tmp而ENOENT exit1，已纠正为482+25并重核；这是本专家审证工具分类错误，不是产品失败。未删除/tmp或backup、未改产品、未重跑构建或测试。工作记忆路径不存在、rg不可用，使用明确路径/结构化JSON读取，未安装工具。

**出口：路径命令/计数/保护与TTL HTTP内存局部PASS；看板合理内滚，实际右缘/外壳可达性BLOCKED。Main按§3.3最小补证/条件式修复继续既有旅程；A0完整门仍未PASS。**
