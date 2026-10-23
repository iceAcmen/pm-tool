# A12 来源治理 GUI 独立修后审证

> 给 Main 与后续专家按候选和缺证接续。trae，独立测试专家；本地 2026-10-22 凌晨审证，文件日期沿父批次 20261021。只审 RA-AI01..03 / AGUI-01 的 A12 原件，不操作 GUI、产品、构建、服务、凭据或提交。旧 A11 对 A10 的 FAIL/BLOCKED 原报告保留，新复验另记于此。

## 1. 逐 ID 结论

| ID | A12 本轮有限结论 | 完整 ID / 剩余缺证 |
| --- | --- | --- |
| AGUI-01（用户简称 A11AGUI01） | **修后 GUI 有限 PASS，原来源 ID 视觉缺陷在本候选关闭**：原标题之外显示 ref.id；表、依据角色、快照 v1/口径 v1 保留；十来源与真实旧 refs 对齐 | 不倒改 A10 FAIL；无标题、不重复 ID、同名 callback 等 SOURCE/AUTO 见原 A12 独立报告，不当成真实 GUI |
| RA-AI01 | **有限 PASS**：生产 F6 十 refs 原件相符；十次可见 metadata→目标表单→返回台账及最后重进；登记导航区间 data/ledger 零写；本轮完整下发字节及页面绑定可核 | **BLOCKED（完整 GUI ID 未签）**：真实同名场景未采；kind 仅 ask-apply、context 0；完整 resolver 回读、浏览器 context 标识及冻结时间 UI 粒度未齐。不能由十个不同名来源推广同名防错 |
| RA-AI02 | **有限 PASS**：正常 TaskForm 主保存标题，材料/进展历史保留；changed/needs-regen、不计 supported；真实两次重校 0→1→2，只追加 history；新页面/新 PID 原回读保留旧结论 | **BLOCKED（完整 GUI ID 未签）**：四消费点真实请求/呈现链未齐；本包只证明 AI 助手台账，无其他三消费点完整路径。重启 TERM/port-free 原输出和新进程下发绑定未归档齐 |
| RA-AI03 | **有限 PASS**：合法危险确认删 t-0002，保旧 ref/ledger；missing/manual-review、点击缺失标签不跳错；两次重校 2→3→4，旧前缀及非 history 字段不变；重启后仍 missing/history4 | **BLOCKED（完整 GUI ID 未签）**：同上完整实例链缺件；只签此缺失任务，不推广全实体/同名导航守卫或四消费点 |

**没有 RA-AI01..03 整 ID PASS、治理 32 项整体 PASS、发布或提交放行。** 其余 29 个治理 GUI ID 未在本任务审签，不更新其状态；真实模型不在本范围，不从确定性 F6 继承、不改为 MANUAL_PENDING。作者 noEmit/build/coverage0、143 文件/1345 测试不是独立 GUI 结论。

## 2. 授权与合同

本次负责人要求“独立限定 RAAI01..03/A11AGUI01 修后 A12 GUI 审证”“仅写 docs/testing/a12-governance-source-gui-retest-20261021 前缀”“无 GUI 操作，只审件”“最终终核漂移并释放”。Main 唯一 GUI/builder，最后普通 commit/no push 的权限不传给本专家。

已核 `AGENTS.md`、`docs/collaboration.md` §9/11、`remaining-governance-cases-20261021.md` §1/6、两份 governance GUI handoff、原 A11 缺证/最小修复合同、A12 独立 provenance-ID SOURCE/AUTO 报告与原证、收口计划、最新接续档案/父执行记录。只读原件和明确声明的源码/lib 指纹；未读 private URL、正式 profile、令牌、认证头或私有配置。未 fetch/pull、install、build、产品测试、GUI、服务、commit/push/tag；在途 dirty 成果保留。通用 SOP 的写入/构建动作受本次明确限定，living docs 由 Main 接续。

原 A12 独立报告仅签 SOURCE/AUTO；本报告核其已验证组件 SHA，并用新的 A12 GUI 原件另签视觉子范围。原合同未改变，不新增设计矩阵、页面或 fixture 要求，不把缺证当确证产品 FAIL。

## 3. 冻结、候选与装载

有效冻结 [inputs-r2](a12-governance-source-gui-retest-20261021-inputs-r2.json)：`2026-10-21T20:37:22.584Z`，2850 输入，无缺失；主树与 A12 树声明源码、A12 产物均与 candidate 相符。包括 A12 governance 原件、合同、生产 F6 原证、独立 A12 SOURCE/AUTO 原证、512 源文件两树及453产物；没有读隔离 runtime 私有 URL。

首冻结 [inputs](a12-governance-source-gui-retest-20261021-inputs.json) 保留：审计过滤错误将文件名含 `tokens` 的 design-tokens 源/产物排除，形成 null 比较，不是候选文件缺失。修正为准确私有文件名过滤后另冻 r2，2850 项齐备，未倒改首轮。

| 层 | 本轮原件与核验 |
| --- | --- |
| 基线 / 候选 | 基线 `9b1a8c5317774ff07cc594a0acd12a5cc7893ebd`，dirty 候选 A12，独立树 `/private/tmp/pmtool-a12-closure-20261021`；512 sourceHashes + tracked patch SHA `29d9a389ef1f7f178dba50f5cff813672f0ea7c5ebf6dc7ad74aebd38269a596` 实核相符 |
| 组件 | `provenance-panel.tsx` SHA `039b7d47a9fc39df0913d38d102eb54e526023c3c49eb260278f59c3de4c973b`，与独立 SOURCE/AUTO 修后对象相同 |
| 版本 | A12 包 `0.7.4`，只表示本 dirty 候选包版本，不等历史 v0.7.4 tag 或正式服务身份；无新 tag / 发布 |
| 构建原件 | `build-r2/sync.json` sourceHashes 等 candidate；noEmit `20:26:19.362540Z→20:26:25.660474Z`、build `20:26:25.660810Z→20:26:32.325189Z`、coverage `20:26:32.330261Z→20:27:08.562705Z` 均 exit0，143 files/1345 tests；453 artifacts 等 candidate 且实际字节相符。作者执行，不是专家重建 |
| 宿主 / 实例 | 宿主提交 `1142fb74f2bbcc54dc9499054c0448c9b876cbf2`；governance3229，runtime `/private/tmp/pmtool-a12-governance-runtime-20261021`；旧 PID78113，新 PID79214，cwd 上游，实际 argv 声明 `--import tsx/esm apps/cli/src/bin.ts --profile pm --no-open --host 127.0.0.1 --port 3229` |
| setup / start | environment、start-old、start-new 与获准非私有 `artifacts/start.json` 一致；plugin 声明指 A12 包，setup patchSha `8c8dd327…c09ba` 是环境补丁，不混为 tracked product patch。`empty:true` 是最初 setup，不能解释为恢复后的空库 |
| 实际下发 | **A12 确实有 `loaded-r2/result.json`**，不是 A10 的缺 result。`/plugins/`，status200、fromDiskCache=false；原 `combo-1.txt` 2581368 bytes，SHA `e10bf9b3fd69e2c0a8d744c146362a2e1c235e38a0cb5d6059f74cc692c76cda` 精确匹配 result |
| 完整插件身份 | 原完整模块 `[875361,2577894)`，第二起点 -1；只在内存补被剥离的 `\n//# sourceMappingURL=client.js.map`，1702564 bytes，SHA **`3bc4a1723f10e8f0393eceb48841007e52e9ebafdc4b37f98dc0a970151bc3b7`**，精确等 A12 manifest/client.js；非字符串局部命中、非当前别轮 lib 补证 |
| 页面绑定 | loaded result：Origin `http://127.0.0.1:3229`、timeOrigin `1792614572280.2`、1440×900、pilot off、pmMounted true、editor false；全部十跳 before/target/return 与 stale 原 JSON 同 origin/timeOrigin；原截图/帧可见实际挂载和内容。JSON `dark=true`，不误写为浅主题 |

原 `loaded-r2/execution.mjs` 可核：Network enable/cacheDisabled=true，归档真实 getResponseBody，page.reload 后同 page 取 state；本专家**未执行**该脚本。result 的 segment 含宿主追加的 `\n;\n`，因此其 segmentBytes=1702536 与按模块尾截出的1702533不同；并非候选污染。原 `responseExact=false` 是宿主组合响应不等裸插件，完整模块恢复 SHA 相符才是本轮字节身份依据。

已关闭 A10 的“缺 status/cache/page result”对应 **A12 新证据子缺口**；但 result 未保存 requestId/浏览器 context ID，start 的 plugin 是声明而非实际 resolver/软链回读。新 PID 没有单独 loaded 原响应。故能签本轮原响应→原页面有限绑定，不能称完整所有实例链、正式软链归属全部通过。

## 4. 合法 F6 与十来源

生产标准包 SHA `c786212c1a5b0023d4a5b8e75b32ed4f4c3dde192b9b0e3901eeb857c1490035`，源为专家 `green-corrected/F6-ui-standard/`。seed-r2 有真实路径 precheck、确认恢复/危险确认、before/first/after 与32帧；before=first 全根相等，初态 data2→恢复后18，files/backups 前后相等。不是手工改库或新造 refs。恢复后原 ledger entry 全字段等标准包 raw；expected.refs、F6-nonempty-ledger 原 refs、本轮 refs 精确相同。

`source-jumps/ref-i-before/source-i/returned-i` 的 PNG/JSON、85原帧、逐 ref metadata、原 `command-events.json` 和最后 `reentered`：

| i | 真实表 / 来源 ID | 实际目标表单标题 |
| --- | --- | --- |
| 0/1 | tasks t-0001 / t-0002 | 来源任务一 / 来源任务二 |
| 2/6 | milestones m-0001 / m-0002 | 来源里程碑 / AI 新里程碑 |
| 3/7 | risk_issues ri-0001 / ri-0002 | 来源风险 / AI 新风险 |
| 4/8 | deliverables dlv-0001 / dlv-0002 | 来源交付物 / AI 新交付物 |
| 5/9 | meetings mtg-0001 / mtg-0002 | 来源会议 / AI 新会议 |

十目标全部标题及 QA-G A 项目一致，十个 return JSON 均有 AI 溯源台账/对应 ID；最后关闭重进仍十 refs。来源行有标题、ID、中文表、依据、快照 v1/口径 v1；PNG 可见，不只是 raw ID。原业务区间18键 before=after，原 ledger 前后完全相等；11对 `ask-provenance p-0001` run/done 成功，反映实际返回/重进取账本，不是新模型调用。

本轮可签十来源有限导航闭环，不声称全85帧逐帧目视、点击日志含坐标或所有同名场景。只有 ask-apply/basis10/context0，实际同名 fixture 不存在；组件同名合成 AUTO 不冒充生产 GUI。冻结版本可见，逐来源冻结时间 UI 粒度仍依原 A11 限界未另签。

## 5. 来源修改、删除与不可变历史

### RA-AI02：正常主保存与 changed

`source-stale/update-before-task.json` 是完整 version2.record，等标准包 t-0001；after 的稳定 ID、项目、附件 at-1、pl-1 三版/pl-2两版软删及全部 refs 精确保留。真实变化是标题→`来源任务一已复核A12`、updatedAt→`20:31:40.370Z`，以及原缺失的 manualProgress 被正常表单写为 null；不虚称“仅两字段变化”或移除 null 差异。description 原样保留，本次实际修改标题，不宣称正文另改。

原主保存请求/成功回包对应 `task update t-0001 {...}`，source user；登记 data 仅 task1变，ledger 前后原字节相等。页面随后 changed 原因 `updatedAt 已变更`、needs-regen、失效1、来源弱化不计有效。

| 重校 | 原 history | 新增时间 / 结论 |
| --- | --- | --- |
| changed-1 | 0→1 | `20:31:40.774Z` / needs-regen |
| changed-2 | 1→2 | `20:31:40.991Z` / needs-regen |
| missing-1 | 2→3 | `20:31:42.031Z` / manual-review |
| missing-2 | 3→4 | `20:31:42.248Z` / manual-review |

四步均有独立 raw before/after ledger，其 SHA 精确等每步 manifest；每步只改 ledger、旧 history 前缀不变、refs10不变、非 history entry 字段与旧标准包一致；步1after=步2before。changed 的新行只有 task1=changed，其余9 consistent；missing 行为 task1 changed + task2 missing +8 consistent。

原28个 `command/run/done` 完整14对：update1、delete1、snapshot2、provenance6、recheck4，每对 success、无缺 done；seq37..64。四次 recheck 原回包 summary 均 total1/supported0/stale1，不误把八条 consistent 来源当这条失效结论仍 supported。不存在 ask/generate 模型命令；这仅支持**所采 AI 助手台账**无自动生成，不能证明其他三消费点或所有网络不存在自动模型请求。

### RA-AI03：合法 delete、missing 与点击

delete-before-task 完整 t-0002 等标准包；危险确认明确 title/ID，原 `task delete t-0002 confirm` 成功。18→17键差异仅删 `/pmtool/tasks/t-0002.json`；before/after-delete 原 ledger 完全相等，旧 refs 和 history2保留。不绕删除保护、不用新来源替换旧 ref。

`missing-no-link`、`missing-label-click` PNG/JSON：来源任务二为灰色标签及“记录已删除”，没有该标题 jump button；实际点击后仍 AI 台账，无其他实体表单/错误导航。两次重校独立原回包及四个 raw ledger连续，2→3→4；旧 needs-regen 与新 manual-review分别保留。不是 runner 口述、不凭短间隔抹掉两次实际追加，也不宣称并发门。

### 新进程回读

restart 原 start-old PID78113→start-new PID79214，同3229、同 runtime/plugin/setup patch、同宿主；新 GUI timeOrigin `1792614826282.4`，不同于旧页。`after-restart-ledger/history-after-restart` 原 JSON/PNG及41帧有 changed/missing、refs10、history4、旧结论保留；原 before/after task及ledger完全相等，等最后 recheck 后字节。登记 data 仅 session文件改变，业务/ledger不变，不能称全根零写。

负责人与父记录说明精确 TERM/portfree/restart 已执行，**该说明与可签原证分开**：归档 restart 目录没有独立 kill/TERM 退出码、lsof端口释放原输出；before.boundary及start仅身份声明。本轮不否认实际更换PID/新页面及原落盘回读，但不据说明签完整进程停止安全门。Main补原非私有执行输出/原新进程请求绑定即可审，不能重造当时不存在的旧输出。

## 6. 目视、审计与终核

实际目视26 PNG +7原帧；不是全部223帧目视：

- source-id/ledger；source-jumps/ref-9-before、source-0..9、returned-0/5/9、reentered。
- source-stale/changed-saved、changed-recheck-1/2、delete-confirm、missing-no-link、missing-label-click、missing-recheck-1/2。
- restart/history-after-restart；seed-r2/precheck。
- 原帧：source-jumps `000015/000043/000084`；source-stale `000024/000056`；restart `000040`；seed-r2 `000012`。

四组32/85/65/41，共223帧 SHA 全相符；stale 两帧 metadata timestamp乱序保留，不修改原时间，不拿截图时长推导严格点击间隔。若干 return/reentry 截图处于真实动画转场，有叠影；用原返回 JSON/完整帧与请求回包交叉确认，不能当页面全样式 PASS。PNG像素/DPR不当作原生缩放菜单证据；仅本实际深色1440路径，其他主题/宽档/缩放/读屏不在本次签字。

审计首版 taskChanges 使用对象引用比较，误将相同 attachments/progressLog 列为变化；首 [observations](a12-governance-source-gui-retest-20261021-observations.json) 保留，最终 [observations-r2](a12-governance-source-gui-retest-20261021-observations-r2.json) 用结构化深比较并显式保留 missing/null字段差异，材料相等断言一直为true。无产品或原证改动，不把设施误报当产品 FAIL。

专家环境 macOS、Node v22.23.3；未执行 pnpm/product。已执行命令（仓库根），各退出码0：

```sh
cd /Users/bytedance/Projects/dsh-pm/pm-tool
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a12-governance-source-gui-retest-20261021-audit.mjs
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a12-governance-source-gui-retest-20261021-audit.mjs freeze
# 首冻结保留；修准确过滤后再执行一次 freeze，另存 inputs-r2，不覆写
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a12-governance-source-gui-retest-20261021-audit.mjs review
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a12-governance-source-gui-retest-20261021-audit.mjs review observations-r2
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a12-governance-source-gui-retest-20261021-audit.mjs finish drift
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a12-governance-source-gui-retest-20261021-audit.mjs finish
git diff --check -- 'docs/testing/a12-governance-source-gui-retest-20261021*'
```

原作者命令及退出码见§3与观察 JSON：noEmit/build/coverage 各0，非本专家重跑。审计 exit0表示完成核验，不等整产品回归通过；git diff --check 对未跟踪正文不作完整检查，新增文档另回读。

首终核 [drift](a12-governance-source-gui-retest-20261021-drift.json) `20:40:18.538Z`：2850→2850，唯一变化父执行记录新增04:39条目。已读新增：仅来源重启/资料和固定汇报进展，不替代原证、不改变授权/合同，本 A12 原件及源码产物变化0。交件前再次终核 [drift-final](a12-governance-source-gui-retest-20261021-drift-final.json) `20:42:45.838Z`：仍2850→2850、missing0，唯一差异仍为同一父执行记录，较首终核无新增漂移；A12 原件/源码/产物变化0，不改首记录。

## 7. 接续与释放

Main接本报告：AGUI-01仅此修后候选关闭；已签有限子范围可按同候选/fixture/原件继承。受影响 panel、provenance、ask/recheck、导航、入口或样式/实例变化须重新绑定，不用本报告签后续候选。

后续仍沿原合同：补真实同名/必要分组原件、四消费点无自动生成的完整请求和呈现、新实例 resolver/context/loaded与已有重启安全原输出；无法取得的旧输出如实缺证，可另采新轮，不补造当时结果。其余29治理GUI和完整产品门由Main继续；本专家不新增功能或改变旧用例，不批准普通commit/发布。

本任务及此前缀写入权已释放。未启动后台进程、占用GUI/build/端口，未读private入口/凭据，未改或停止任何服务，未commit/push；原证和两次审计补正记录保留。
