# 首批候选 first checkpoint 回执（QA 独立 · backend ready ≠ GUI）

> 2026-10-20｜QA 只读、不启 service/browser、不改业务源码/vendor、不 commit/push。
> 口径：backend/AUTO green 仅代表数据与静态层；**GUI 未由 Main 采证前不称 PASS、不称发布**。

## 1. 实际 SHA / 版本 manifest（QA 采集，运行显示值由 Main 补）

| 项 | 值 |
|---|---|
| 仓 / branch | `/Users/bytedance/Projects/dsh-pm/pm-tool` / `main` |
| 基线 HEAD | `8dfed2d5a3ea7bd42be70dfbbdf0de1a977a3991`——**这是基线 HEAD，不是 candidate hash**；本批变更全部未提交（working tree），无新 commit |
| package.json version | `0.7.4` |
| git tag | `v0.7.4` 为**历史 tag，不包含本批未提交新代码**；运行时显示 0.7.4 只能结合 patch manifest 识别版本，正式 tag/version 收尾另定 |
| 完整候选指纹 | `新版实施-20261020/实施验收/首批候选完整指纹-20261020.json/.md`（baseline HEAD + version + 18 modified/27 untracked 逐文件 sha256/bytes/mtime + git diff HEAD sha256 + 时间） |
| 运行页脚/`--version` 显示值 | **Main 在隔离 candidate 服务采证时补**（QA 不运行服务，无法观测） |

> Main 须**起隔离 candidate 服务**采证，**不切正式当前服务**；本回执与指纹是 first-checkpoint 唯一版本依据。

## 2. 测试结果（QA 本轮独立实跑，非沿用作者自报）

| 门 | 结果 |
|---|---|
| `tsc -p tsconfig.json --noEmit`（build 首阶段，隔离不启 service） | **EXIT 0，0 条 error TS**（当前 records-preview WIP 已 type-clean，无 raw error 可定位；若复红，落点 `src/client/views/records/records-preview.ts` 等 records 分片，归 records owner） |
| vitest 全量 | **60 文件 / 624 PASS，0 FAIL** |
| records 分片子集 | 3 文件 / **21 PASS**（options 6 + payloads 9 + preview 6） |
| isolation `verify-isolation.mjs` | 90/90，资产 before=after=201，污染 0 |
| 作者门 `verify-b2-materials.mjs` | PASS（QA 独立复跑） |
| Oil `verify-external-skills.mjs` 主 scan | PASS（2 注册 vendor；未注册仅 SKIPPED 留痕） |
| 全量 `build`（真实 tsc emit → css copy → tsdown） | **执行证据 EXIT 0**（records owner 实跑 `pnpm build`，非 QA 复跑；version 0.7.4 / HEAD 8dfed2d 未 commit / 8 files）。**这是构建证据，不是 GUI PASS**；未 bypass 整包 tsc |

## 3. C8 复验（WARN 已闭，仅 3 个新增 case）

- **no-dangling**：`progress add` refs=`at-999`（不存在）→ error 拒、零写、日志不新增。
- **removed-ref**：先 link 再 `material remove` 摘除，refs 指向已摘除 `at-1` → error 拒、零写。
- **cross-ref 零写**：跨项目交付物引用（p-0001 交付物挂 p-0002 任务）→ error「交付物不属于当前项目」，异项目任务无 attachments。
- 合法 active ref 接受；C8 三向 PASS，原 WARN 关闭（详见 b2-audit 记录 23/23）。

## 4. 明确 NOT_RUN / 未实施（不算用例 PASS）

- **B6 backend shell（records-preview 本地只读派生/freeze 纯模型）**：未接 data 权威快照合同、未被 panel 接线，**NOT_RUN，不算用例 PASS**；`authoritative:false` 尽力均值不得当固定快照。
- **U2（file kind 真文件上传）未实施**，本批 attachments kind 仅 deliverable/link。
- **B2 写操作**（attachments/progressLog 原子 commit）data 接口未接，前端只读，无可点写入口，禁 localmock/半写。
- GUI 全量（B1 G01-G14、B2 G01-G07、B4 时间线旅程、200%、拖缩）：**NOT_RUN，Main 采证**，见 `main-first-journey-request-20261020.md`。
- Oil 同 task 页 actual GUI data review：NOT_RUN（official 静态 gate PASS，待 Main 前后图）；Ego 安装PASS / 首次设置 USER_PENDING / 效率 NOT_RUN。

## 5. 给 Main 的统一动作

1. build 已 EXIT 0，children 已 idle；Main 可单起 service/GUI，按 `main-first-journey-request-20261020.md` 执行。
2. 建隔离项目 `QA-隔离-20261020`，补运行版本 manifest 三元组（运行 HEAD SHA + package.json 0.7.4 + 页脚/`--version` 显示值），证据落 `docs/testing/evidence/<日期>/<用例ID>/`。
3. QA 据证据独立判 PASS/FAIL，backend/build green 不替代 GUI。

## 6. 首批 readiness（backend/build 就绪 ≠ 发布 PASS）

- **版本依据**：基线 HEAD `8dfed2d5…3991`（非 candidate hash，变更全未 commit）；version `0.7.4`，历史 tag `v0.7.4` 不含新代码；候选逐文件指纹以 `首批候选完整指纹-20261020.json` 为准（git diff HEAD sha256 `c6a72b26…59008`，45 文件：18 modified + 27 untracked）。Main 起隔离 candidate 服务采证，不切正式服务。
- **backend/build 通过门（已绿，仅静态/构建）**：tsc 0 error、vitest 60/624、records 21、isolation 90/90 零污染、B2 作者门 PASS、Oil 主 scan PASS、`pnpm build` EXIT 0。
- **Main 菜单必过门（GUI，未过前禁止发布 PASS）**：M-A1 pilot 默认OFF+回退、M-A2 dark select/option 可读、M-A3 焦点环、M-A4 四态反馈、M-B1 任务新建/编辑零写保输入、M-B2 切项目不串数、M-B3 390 无横滚、M-G01 空态、M-G10 重启持久、M-C1/C2 只读投影、M-C3 写入口不可点、M-D1 B4 时间线、M-D3 console 0 error。
- **仍 NOT_RUN（不记 PASS）**：200% 原生缩放、鼠标拖缩/布局保存重启、B2 UI 写操作（data 接口未接）、B6 backend shell、U2 file kind、Oil 同页 GUI、Ego 效率对照；全量 B1/B2/B4 旅程待 Main 采证。
- 报告路径：本文件 `docs/testing/first-checkpoint-receipt-20261020.md`；操作清单 `docs/testing/main-first-journey-request-20261020.md`。

