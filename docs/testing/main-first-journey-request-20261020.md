# Main 首次集成唯一操作请求（QA 拟 · NOT_RUN · Main 执行采证）

> QA 不启 browser/service、不驱 GUI；本文件是给 Main 的**唯一一份**精确操作请求。证据落 `docs/testing/evidence/<YYYY-MM-DD>/<用例ID>/`，QA 据证据独立判 PASS/FAIL，不沿用自报。
> 与冻结清单 `新版实施-20261020/实施验收/main-gui-journey-checklist-20261020.md` 对齐，并补 QA 计划遗漏的两条（空态、重启持久）。

## 0. 版本绑定（执行前先采，缺则整批 NOT_RUN）

- 仓 HEAD：`8dfed2d5a3ea7bd42be70dfbbdf0de1a977a3991`（工作树未提交）。
- 前端 freeze 11 文件 sha256/bytes 由 QA 独立复算**逐位一致**（见冻结清单 §3）；各 owner 分片源 SHA 由 owner 各自 phase freeze，Main 不代算。
- **Main 必须随证据提供运行版本 manifest 三元组**：实际运行构建 HEAD SHA + package.json version + 页脚/`--version` 显示值，三者一致；每条记录实际 tab/URL 串（本应用为面板内 tab，无独立 hash 路由，照实记录当前视图名与地址栏）。
- fixture：只新建**隔离测试项目** `QA-隔离-20261020`，验完即删；不碰正式项目/真实数据。

## 1. 本轮可采（1440 浅/深为主，抽 390；200% 与拖缩 NOT_RUN）

| 请求ID | 位置（tab/菜单） | 输入/动作 | 预期存储/读回（QA 判据） |
|---|---|---|---|
| M-A1 pilot 默认OFF+回退 | 顶栏「更多」菜单 →「新版界面试用」 | 未设置态打开菜单看是否勾选→切 ON→切 OFF→刷新→重启 | 默认未勾选、旧壳旧页；ON 视觉生效、OFF 回旧可用；localStorage `pm-b1-pilot` 按选择留存，重启不回跳默认 |
| M-A2 深色 select/option 可读 | 切 `body[data-ds-dark-theme]`，展开任务状态/筛选/编辑态原生下拉 | 逐看展开与收起 | 选项文字/底色对比可读（非黑字黑底）、边框可见、收起态可读 |
| M-A3 焦点环 | 纯键盘 Tab 走查可交互控件 | Tab/ESC | 每控件可见焦点环、无焦点陷阱、ESC 归还焦点 |
| M-A4 四态反馈 | 各触发点 | 成功保存/模拟局部失败/触及权限不足/取数中 | 成功 toast(did it work/what changed)；失败保旧数据+陈旧标+原因+retry 不清空；权限不足通用标签+原文原因+保输入+退路；busy 顶部进度条+aria-busy |
| M-B1 任务新建/编辑 | tasks tab →「新建任务」抽屉 | 合法值保存；再触发一次校验失败；取消 | 成功 toast 且列表出现；校验失败零写、保输入、首错聚焦；取消不落盘（前后存储 diff=空） |
| M-B2 切换项目 | 项目切换器 | 在隔离项目与另一隔离项目间切换 | 列表按项目切换、状态正确、不串数据 |
| M-B3 390 窄屏 | 390 视口走 tasks | 浏览/操作 | 无外壳二维横滚、标签不裁切、控件不断裂（**200% 原生缩放 NOT_RUN**） |
| M-G01 空态（补） | 隔离项目 0 task 打开 tasks | 进入 | 引导空态非白屏/非报错、文案含下一步 |
| M-G10 重启持久（补） | tasks tab | 设自定义状态/筛选→保存→刷新→重启 | 自定义状态/筛选与录入 task 重启后读回一致（非内存） |
| M-C1 资料只读投影 | task 抽屉资料区（**后端 atomic ready，UI 未接线，当前只读**） | 查看已挂交付物/链接 | 交付物显冻结 version/名称快照；link 显标题/域名；源不可用显「源已不可用」可移除；旧 deliverableId/evidenceUrl 双读不误报 |
| M-C2 进展日志只读 | task 抽屉 progressLog（**后端 atomic ready，UI 未接线，当前只读**） | 查看 | 条目按首版 date 倒序、current=最新 revision 正文、旧版可回看；软删隐藏且 revisions 保留；空/长/密可读 |
| M-C3 写入口状态 | 资料/进展两区 | 找新建/编辑新字段入口 | **后端 atomic commit 接口已 ready，仅待前端 UI 接线**；UI 实际可用前保持只读、**不出现可点写入口**（不得半写/localmock）；接线真正可用后本条转 Ready 再测写，不提前伪造 |
| M-D1 B4 时间线 | 总览/看板 → 里程碑·交付物卡 | 打开查看 | 里程碑 targetDate 升序、dot 随状态、右侧中文 pill；首个未达成未错过节点显「下一节点」横幅（at_risk 带风险）；分隔线后交付物列表 |
| M-D3 控制台 | 以上全程 | 记录完整 console | console 0 error（完整日志留存） |

## 2. 本轮 NOT_RUN（禁止截图替代、禁止冒 PASS）

- **B2 写操作**（attachments/progressLog 原子新建/编辑 commit）：**后端 atomic 接口已 ready，仅待前端 UI 接线**；接线真正可用前写路径保持 NOT_RUN/Ready，M-C3 只验「无提前出现的可点假写入口」，不测写成功、不伪造可用。
- **200% 原生缩放**、**鼠标拖缩卡片宽高/布局个性化保存重启（M-D2）**：需 Main CU native，本轮 NOT_RUN，静态不替。
- B1-G02~G06/G09/G11/G14、B2-G01~G07 全量、B4 其余未迁卡、B5/B6 切片旅程：后续轮。
- Oil 同 task 页 actual GUI data review：NOT_RUN（official 静态 gate 已 PASS，待 Main 前后图）；Ego 安装 PASS/SETUP_READY·CU 可用，native engine 效率对照 NOT_RUN，无 CLI/web JS 驱动。

## 3. QA 与冻结清单一致性审（独立判）

- 清单 A1↔B1-G12/G10、A2↔dark native、A3↔焦点、A4↔busy/stale/permission/success、B1↔G07/G13、B2↔G08、B3↔G09(390 部分)、C1/C2↔B2 只读、C3↔写未接、D1↔B4 时间线、D3↔console，**口径一致**。
- 缺口（已补为本文件 M-G01、M-G10）：清单原未列空态引导、未列自定义状态/筛选重启持久。
- 清单未强制版本 manifest 三元组与隔离项目删后即净，本文件 §0/§1 已补。
