# 部署检查记录（3080）— 2026-10-12T06:34:43Z
- 代码 HEAD: 826bfa63624ee92af9f41e57347e88fdc0c0f28e (main)
- 构建资产 SHA256 client.js: 2a288335fb0089e77c63b5f6735882fe4a7c85921267d503e2f048bb93bf3bd0
- build exit: 0（日志 docs/verification/build-*.log）
- 35 verify: 35/35 PASS（日志 docs/verification/verify-all-*.log）
- git status: 干净；v0.4.0 tag=1af5490 未动；其后未打新 tag
- 真实项目 data/pmtool/projects: p-0001~p-0004 仅只读存在
- 3081/3082 启动前无监听；3080 run_in_background 任务 af294538-6b97-4c9d-9d11-06a531a05e0e
- 启动: profile pm, --host 127.0.0.1 --no-open; DSH_PM_E2E 未开启; 未配 Key/未改凭据/未打 tag
- HTTP: ?token= 303 -> cookie 会话 -> / 返回 200（日志 docs/verification/dsh-3080.log）
- 已知限制: 真实浏览器 GUI 端到端本轮未运行（工具能力受限），独立验收待补；不代表生产已验收

## 勘误（自检写入范围）
- 早前未隔离运行时，verify-command/verify-storage 曾向真实 data/pmtool/checks/selftest.json 写自检记录（非业务项目实体，p-0001~4 未动）。
- 本轮已用 PM_DATA_ROOT+TMPDIR=项目 .tmp/verify-root 隔离全量重跑：35/35 PASS，写入全部落在隔离根（日志 verify-all-isolated-*.log）。
- 历史 selftest.json 保留未删；此后 runner 应默认带 PM_DATA_ROOT 隔离。
