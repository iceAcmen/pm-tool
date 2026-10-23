# A18 重开资料与四版历史可见补审

> 给 Main、负责人及独立测试接续者使用：原独立审证角色，仅审新 material-visible 43件。2026-10-22，trae。与[旧报告](a18-material-composition-gui-review-20261022.md)并读；旧报告、BLOCKED、首 audit 失败及旧封签原样保留，不覆盖、不倒签。

## 1. 本次结论

**A18-M01-REOPEN-VISIBLE：有限 GUI/data PASS。** 新证据补齐旧件缺少的重开链接备注、当前 rv4 正文/作者/日期、E1 展开四版正文/作者可见及 clean cancel 终态。原 RA-M01 组合主保存的有限结果与本补件可合并引用，但不签整材料门、其他旅程或完整矩阵。

| 子范围 | 独立核对 |
| --- | --- |
| 已存 at-1 备注 | 原 material-visible.png 与帧000007可见“QA规范 / QA 组合保存原链接备注”，旁边原交付物与两文件仍在 |
| 已存 E1 当前修订 | 原 progress-visible.png 可见 `2026-10-21 / 测试甲组合 / 历史（4 版）` 与完整“QA 组合保存 rv4 正文；既有版本必须保留。”；E3当前正文亦可见 |
| 点击四版历史后 rv1..4 | history-open.png及原revision-1..4.png完整可见四版作者与正文，帧000011支持真实展开终态；不是只看DOM或raw |
| clean cancel | 原closed.png显示任务页且抽屉消失；closed.json无标题输入/编辑抽屉按钮，四根前后完整等值，task.json与旧主save完全同字节 |

此补件关闭旧件中“重开备注/新rv4及E1四版历史可见”的**具体证据缺口**，只从新采证时点起生效；旧报告仍正确描述当时 BLOCKED。无本范围确证产品 FAIL。E2软删区未展开、E3历史未展开、长历史滚动/宽深缩放/读屏、dirty取消保留/放弃、RA-M02非法两路径、RA-J03新任务文件组合、RA-J04完整旅程及父总门均不由本件签署。Main仅采证，独立结论归本审证角色。

## 2. 新原证与身份

负责人追加限定为“同前缀补审新43件有限reopen note/newrv4/history可见，保旧BLOCKED原报告，不覆盖”。本角色仅新增本前缀 `-visible*` 自有audit/报告；不改产品、他人testing、livingdocs、原件，不build/install、GUI/services/credentials/commit，不重跑collector或重复save。

原根：[A18/material-visible](../../reports/all-pending-evidence-20261021/A18/material-visible/)，[index.json](../../reports/all-pending-evidence-20261021/A18/material-visible/index.json) SHA `1d43fa88f2185a7eb06dcaf982e878ffb3427756d09ed3db0fc75483cff462b2`。清单43件不含自身，含8 PNG、20真实CDP compositor JPEG、8状态JSON、fields、task、前后四根、exit与执行脚本；完整字节数/sha256/文件集合一致。

新唯一步骤 `reopen-1792634594109`，实际 `02:03:15.047Z..02:03:16.201Z`。八状态同 origin3248/timeOrigin=`1792629512672.7`，1440×718、dark、DPR2，与旧loaded target绑定接续；补件本身未另采target字段，不声称新独立target探测。A18 candidate SHA仍 `2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9`，原520输入/453产物完全同。

task.json SHA `edd07216aeaa0d3ef5b8aedb1c3def2be5f89d873f2e0f0e7532ef2dafa7aac5`，与旧一次主save/重开/取消同字节。新before=after=旧cancel末端四根；无新删改，原history/attachments/交付物冻结/file_assets及字节均沿旧原值。只读路径是按t-0001真实编辑按钮打开→scroll资料→scroll当前rv4→点击“历史（4版）”→各revision scrollIntoView→clean取消；执行脚本没有主save/命令执行入口。

**新件没有POST/run-done/console录制文件。** 因此不额外声称网络请求数或console错误数为零；零持久业务写由完整before/after清单、原任务字节及旧端点等值支持，未拿缺文件当空日志。

## 3. 真实目视与日期口径

本角色实际查看8张PNG与帧000007/000011，未生成替代图或操作浏览器。[原备注图](../../reports/all-pending-evidence-20261021/A18/material-visible/reopen-1792634594109/material-visible.png)、[当前rv4图](../../reports/all-pending-evidence-20261021/A18/material-visible/reopen-1792634594109/progress-visible.png)、[展开历史图](../../reports/all-pending-evidence-20261021/A18/material-visible/reopen-1792634594109/history-open.png)、[取消关闭图](../../reports/all-pending-evidence-20261021/A18/material-visible/reopen-1792634594109/closed.png)支持上述有限可见结果。

history-open与revision-1..4五PNG的SHA相同：`9d33af7abeb786da9004c1ced32e480d66a00d902ba0d372551f76dc662dedc0`。四段短历史已同时完整位于当前视口内，逐元素scrollIntoView后画面相同，**不计作四个不同滚动状态或长历史滚动覆盖**；实际一次展开视口可以目视核四版，不需要伪造四图差异。

| 版本 | 原图作者 / 正文 | 原历史行显示 |
| --- | --- | --- |
| rv-1 | 测试甲 / E1 rv1正文 | v1 · 2026-10-21 |
| rv-2 | 测试乙 / E1 rv2正文 | v2 · 2026-10-21 |
| rv-3 | 测试甲 / E1 rv3正文 | v3 · 2026-10-21 |
| rv-4 | 测试甲组合 / QA 组合保存 rv4 正文；既有版本必须保留。 | v4 · 2026-10-22 |

历史行日期不是进展业务date。只读核冻结 `task-draft-materials.tsx` L407，显示 `fmtDate(rv.revisedAt || rv.date)`：前三版revisedAt均10/21，rv4 revisedAt为 `2026-10-22T01:50:49.991Z`；当前进展取rv4.date仍 `2026-10-21`。原raw的rv1/2业务date分别10/19、10/20未被重写，不能把历史显示修订日说成旧业务日期塌缩或伪今日。

## 4. 自检与释放

运行环境macOS/darwin + bash +现有Node `v22.23.3`；pnpm11.28.5未执行，无产品回归/构建。仓库根实际命令：

```sh
node docs/testing/a18-material-composition-gui-review-20261022-visible-audit.mjs freeze
# exit0；1335个限定保护输入
node docs/testing/a18-material-composition-gui-review-20261022-visible-audit.mjs audit
# exit0；17/17，新43原件/20帧、候选、旧封签与四根一致
node docs/testing/a18-material-composition-gui-review-20261022-visible-audit.mjs seal
# 以-visible-seal.json记录最终保护、成果指纹与释放
```

[补件audit](a18-material-composition-gui-review-20261022-visible-audit.json)、[自有脚本](a18-material-composition-gui-review-20261022-visible-audit.mjs)、[新保护清单](a18-material-composition-gui-review-20261022-visible-before.json)、[补件封签](a18-material-composition-gui-review-20261022-visible-seal.json)可复核。17项机械绿不是单独GUI判定；原图独立目视与上述范围一起构成有限结论。新20帧时间戳未见倒序，旧首失败仍保留不改。

本角色继续保旧报告及封签五成果全字节、旧1285限定输入和新原件；不保护/打断Main在途A19构建回归，不冒称全盘或实时服务无变化。下一步仅由原协调者登记此补件关闭的具体可见缺口，保其他余项与最终总门；本角色封签后释放，不接管提交、采集或其他功能。
