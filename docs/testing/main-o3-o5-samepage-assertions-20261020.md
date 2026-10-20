# Main 新 build 同页采证断言（O3/O4/O5，task 抽屉）· 2026-10-20

> 仅给 Main 在**新 candidate build**（含 O3/O4/O5 补丁）上执行；R4 旧 build 不含补丁，旧 Ego harness/旧壳数据**不计本 production 证据**。QA 不启服务/浏览器。每条需记录 route→state→input→预期存储/视觉→rollback 安全；隔离新测试项目，不写正式数据。

## 前置
- 隔离 candidate 服务（不切正式）；新建空测试项目 P；进入 tasks 页（route view=tasks）。
- 记录 beforeRun：`lib/client.js` sha256（旧基线 `38971696…`），after 新 build 另存，搭配原始截图。

## O3 失败保留抽屉/输入（不被当成功关层）
| 步 | 操作/输入 | 预期 |
|---|---|---|
| O3-1 | task 抽屉填合法标题提交，命令返回业务拒绝文本（如非法/未找到） | 抽屉**保持打开**，输入内容保留，错误就近/全局可见，不 onSaved 关层 |
| O3-2 | 合法提交成功（结构化成功信封/无信封成功/只读预览） | 抽屉正常关闭，成功提示 3s |
| 负例 | 只读预览文本（尚未写入）不得被判失败关层 | 不误关 |

## O4 未保存草稿 dirty 确认（重点）
| 步 | 操作/输入 | 预期 |
|---|---|---|
| O4-1 干净 | 打开新 task 抽屉不改任何字段，按 ESC / 点 scrim / 点 X | **直接关闭，不弹确认** |
| O4-2 dirty 取消按钮 | 改标题/非控说明 description/勾选 predecessorIds 后点「取消」 | 弹 `confirmDanger`「放弃未保存修改？」；确认=放弃关闭，取消=留在抽屉且内容还在 |
| O4-3 dirty ESC | dirty 状态按 ESC | 同一确认弹层，不直接丢 |
| O4-4 dirty scrim | dirty 点遮罩 scrim | 同一确认弹层（scrim 点击被 guard 拦截） |
| O4-5 confirm 焦点 | 弹层出现 | 焦点在「放弃修改」按钮；Enter=确认、ESC=取消关闭弹层；关闭后**焦点归还 opener/触发按钮** |
| O4-6 保存后不误弹 | dirty 后成功保存提交 | 直接关层，**不再弹放弃确认** |
| O4-7 非控说明 | 只改 description（defaultValue 非控 textarea） | 识别为 dirty（不被静默丢弃） |
| O4-8 多选顺序 | predecessorIds 勾选顺序抖动不算 dirty；内容增减才算 | 顺序变化不弹 |

## O5 陈旧客观进度标注
| 步 | 操作 | 预期 |
|---|---|---|
| O5-1 | 外层读取失败进入 stale，打开 task 抽屉 | 客观进度（清单完成度/证据不足）只读附弱标注「数据陈旧，重试后更新」，**不进提交、不污染客观值** |
| O5-2 | 重试成功 | 标注消失，客观值更新 |

## 记录要求
- 每条：route(view/task)、输入值、提交前后 reports/tasks 表存储比对、回滚安全（测试项目删除不留）、console 0 error。
- 200%/拖缩不在本批；静态已 PASS，本批只补真实交互证据，不替代全量回归。
