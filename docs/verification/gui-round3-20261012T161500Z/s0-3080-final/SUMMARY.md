# S0-3080-FINAL 事实记录（执行端采集，非判定）

> 仅事实。PASS/FAIL/BLOCKED 判定权在测试专家。本目录未含 token/key/Authorization。

## 1. 被测基线
- git HEAD: `5b262c3553d88ee014fd8f1dd05cf1c54c05cc98`
- 产品 artifact SHA256（与 3f0528a 构建一致，未重建）：
  - `packages/dsh-pm-tool/lib/index.js`  = `64a48aecf941057f75df5e0906dba66622d42f464cd97b51261ff9a370e7b7e8`
  - `packages/dsh-pm-tool/lib/client.js` = `07c3edb2c8f4f40b54bfb7473b77e287e9323367f5177d953796a4d4b767da14`
- node: v22.23.2；profile=pm；port=3080；host=127.0.0.1；no-open；mode=formal-readonly
- git status 工作树改动：仅 `docs/testing/reverification-round2.md`(M) 与未跟踪 verify 产物/脚本；**产品 lib 未改动**。

## 2. 进程切换（升级）
- 旧 3080：PID `69461`，cmd=`node --import tsx/esm apps/cli/src/bin.ts --profile pm --port 3080 --no-open --host 127.0.0.1`，cwd=`.../deepseek-harness`，已 `kill -TERM` 优雅停止（仅该 PID）。
- 新 3080：PID `98579`，同 cmd/cwd，端口 3080 LISTEN。
  - tracked background taskId: **`f75f2354-6c99-46ca-bd0e-700c4540bb59`**（按要求保留运行，未停止）。
- 3091：PID `95085`，全程未触碰，结束时仍 LISTEN。
- 健康探针（无 token）：`GET /` → HTTP **401**（预期 auth 门，允许）。
- 未读/未打印/未保存 token、进程 env、完整启动日志（输出已丢弃）。

## 3. 数据完整性（manifest，仅记录元数据，不含内容）
- 生成器：`manifest.mjs`（relpath+sha256+size+mtimeMs，不复制内容）。
- before=`manifest-before.json`，after=`manifest-after.json`，diff=`manifest-diff.json`。
- before 总数 148；after 总数 148。
  - data/pmtool=27，data/session_projcache=39，data/workspace.json=1，packages/backups=81。
  - `packages/backup`（单数目录）：before/after 均 **不存在**。
- diff：**added=0, removed=0, changed=0（hash/mtimeMs/size 全等），DIFF_EMPTY=true**。
- 结论：服务器重启与本轮操作未对正式 data 与共享 backups 产生任何写入/变动。

## 4. 浏览器 S0 结果：BLOCKED
- `bu.list_tabs()` 仅 1 个 tab：`http://127.0.0.1:3091/`（title "DSH 本地构建"）。
- **无任何 3080 tab**（match3080=0）。
- 按执行纪律：未新开 tab、未读取/推导 token、未切换或改动 3091 tab、未触碰正式数据。
- 故 S0-01..S0-08 的七 Tab/树折叠/提醒/搜索/作战室/甘特/抽屉/AI ask/切项目回填等 DOM 与截图证据**均未采集**（N/A）。
- console：因 BLOCKED 于交互前，无 console 基线、0 浏览器交互错误（N/A）。

## 5. 遵守的红线
- 未改代码/文档业务内容/未 commit/未 push/未 build；未动 3091。
- 遇认证/可用性：仅报告 BLOCKED，未绕过。

## 待统一管理
- 新 3080 保持运行：taskId `f75f2354-6c99-46ca-bd0e-700c4540bb59`（PID 98579）。
- 解除 BLOCKED 的前提：存在一个已认证、可访问的 3080 tab（或经项目所有者明确授权的受控认证方式），方可执行 S0 只读 DOM/截图采集。
