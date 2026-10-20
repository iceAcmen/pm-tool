# isolated-candidate 启动脚本独立只读审计（QA，开问题给 owner，不改脚本）· 2026-10-20

> 对象：`新版实施-20261020/实施验收/isolated-candidate/{bootstrap-isolated.sh,README-controlled-launch.md}`。
> 方式：只读审脚本 + 对照真实源码/注册 profile；QA 不执行启动、不启 service/browser、不改脚本。当前磁盘版本为**待修初稿**，下列问题在 owner 修订 `--prepare/--check/--start` 后复验。

## 结论：NOT_READY（6 项 FAIL / 2 项待证），不允许 Main 直接 `--start`

### F1（FAIL）live node_modules 软链，插件未 freeze 到候选指纹
- 现状：L32 `ln -s "$PROFILE_SRC/node_modules" "$HOME_DIR/profiles/pm/node_modules"`；注册 profile 内 `node_modules/dsh-pm-tool -> /Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool`（live 工作树，非冻结副本）。
- 风险：解析到 live 包，工作树后续改动/未重建 lib 会被热取，与 `首批候选完整指纹-20261020.json` 不绑定；peer 依赖也与正式 profile 共享同一 live 目录。
- 要求：`--prepare` 把候选插件**解析后的 lib/产物按指纹复制/钉住**（或用冻结 build 产物路径），peer 依赖从隔离目录解析；`--check` 断言解析结果 sha256 与候选 manifest 一致，且不回指 live 工作树。

### F2（FAIL）backup/export root 未重定向，会落正式仓库
- 源码事实：`core/backup.ts` `resolveBackupDirectory()` 默认=产品仓库 `backups/`，仅 `DSH_PM_BACKUP_DIR` 覆盖；脚本**未设**该变量。export 目标由调用方给路径，脚本也未固定到 `$ROOT`。
- 风险：隔离实例备份写正式 `backups/`，导出落正式/宿主目录，污染正式 root。
- 要求：`--start` 显式 `DSH_PM_BACKUP_DIR=$ROOT/backups`（0700），并固定/核证 export 默认目录在 `$ROOT/exports`；`--check` 打印解析后的 backup/export 绝对路径并断言都在 `$ROOT` 内、正式 `backups/`/`exports/` 启动前后无新增。

### F3（FAIL）echo 完整 token，明文进 stdout/host.log
- 现状：L75 `echo "URL=$URL"` 把带 `?token=` 的完整会话凭证打到 stdout 与 `$LOG`。
- 要求：token 只写 `$ROOT/url`（0600），stdout 仅打印 `port/path/日志位置`，不回显 token；host.log 由宿主产生的 token 行需脱敏或限制文件 0600。

### F4（FAIL）/tmp 目录权限与崩溃清理未证；PID 收尾可能留 web 子进程
- 现状：L12 `ROOT=/tmp/pm-isolated-$STAMP`（/tmp 世界可列）；无 `trap EXIT/INT/TERM`；L79 `wait $HOST_PID`，收尾只 TERM 记录的 launcher PID，未处理 launcher 派生的 web child，端口可能被孤儿占用。
- 要求：`$ROOT`/`$HOME_DIR` 建为 0700；`trap` 在 EXIT/信号时按进程组（set -m / new session，kill `-- -PGID`）回收 launcher+web child，再验 `lsof` 端口为空；`--check` 校验清理脚本存在并可干跑断言无残留。

### F5（FAIL）env 继承未隔离，provider/key 可能透传
- 现状：注册 `cordis.patch.yml` 的 llm-pi-ai providers 只引用 env（OPENROUTER/DASHSCOPE 等），脚本不复制该 patch 但也**不清洗继承 env**；`node` 子进程继承父 shell 全部变量。
- 要求：`--start` 用 env allowlist（只传必需非密钥）显式 unset 所有 `*_API_KEY`/provider secret；`--check` 列出将传给子进程的环境变量并断言无 key；`--prepare`/`--check` 阶段零网络、零 provider。

### F6（FAIL）允许 data owner 启动，违反 Main 唯一操作者
- 现状：脚本头 L2「由 Main / data owner 执行」、README §3「脚本只由 Main/data 执行」。
- 要求：`--start` 仅 Main；data owner 只允许只读 `--prepare/--check`，脚本可自检调用者角色或在文档/提示硬性拒绝非 Main `--start`。

### V1（待证）cordis.yml/patch 复制范围
- 注册 `cordis.yml` 为空 `[]`，provider/key 全在 `cordis.patch.yml`；脚本只复制 cordis.yml 并自写最小 patch（storage-json/ui-theme），方向对。需 owner 在 `--check` 明确：复制集合里**不含** provider/secret 块，自写 patch 不含任何 key，给出逐段 diff 证据。

### V2（待证）`--prepare`/`--check`/`--start` 三态缺失
- 当前脚本无条件启动。要求：`--prepare`（build/复制/核指纹，不启服务）、`--check`（静态断言全绿不启服务）、`--start`（仅 Main）；未通过 check 不得进入 start。

## 复验清单（owner 修后 QA 只跑 --prepare/--check，不启服务）
1. 插件解析 sha256=候选 manifest，无 live 回指（F1）。
2. backup/export 解析路径 ∈ $ROOT，正式目录零新增（F2）。
3. stdout/log 无明文 token（F3）。
4. 0700 + trap 进程组回收 + 端口空（F4）。
5. 子进程 env 无密钥、无 provider（F5）。
6. `--start` 仅 Main（F6）。
7. patch 无 provider/secret（V1）；三态分离（V2）。

---

# R3 复审（磁盘修订版 `bootstrap-isolated.sh` + `runs/run-20261020-033532`）· 2026-10-20

> QA 实读脚本全文、freeze/profile 产物，并跑 **no-service 静态 resolver 探针**（不装依赖、不启服务、不改 root 配置）。结论：**仍 NOT_READY，不允许 Main `--start`**；R3 已修掉初稿部分问题（三态分离、env allowlist、backup 重定向、ROOT 落交付目录、不软链 live 包），但下列 R3 新发现/遗留为 blocking，回 front 修 R4。

## R3 已改善（记录，不计 PASS）
- 三态 `--prepare/--check/--start` 分离；`--prepare` 不启服务。
- `clean_env` allowlist 剔除 `*API_KEY/*TOKEN/*SECRET/*_KEY` 与 provider key。
- `DSH_PM_BACKUP_DIR=$ROOT/backups` 已设；storage-json root 指向 `$ROOT/data`；ROOT 在交付 `runs/` 下非 /tmp；freeze 只复制 package.json/lib/locale，不复制 live node_modules。

## R3 仍 blocking（FAIL，回 front 修 R4）

### R3-F1（FAIL·blocking）profile/freeze 无 node_modules，peer 依赖非真实 resolve；`--check` 只查文件存在不解析
- 事实：隔离 `home/profiles/pm/` 仅 3 文件（cordis.yml/cordis.patch.yml/package.json），**无 node_modules**；`freeze/dsh-pm-tool/` **无 node_modules**；profile package.json 用 `file:$ROOT/freeze/dsh-pm-tool` 声明依赖，但脚本**没有任何 install/hoist/link 步骤**，loader 拿到 file: 路径后其自身 bare import 无解析底座。
- no-service 探针（createRequire 分别锚定 freeze/live-pkg/harness/registered-profile）结果：
  - `@deepseek-ai/dsh-commands/brand`、`@deepseek-ai/dsh-llm`、`@deepseek-ai/dsh-storage-domain` **仅 live-pkg node_modules 可解析**，harness 与隔离 profile 均无供给。
  - `zod` live-pkg + harness 可解析；server 无 bare `@deepseek-ai/cordis`（仅 client bundle/.d.ts）。
- 风险：隔离 `DSH_HOME=$ROOT/home` 下，若宿主不全局 hoist 这三个 peer，运行即 MISS；当前 `resolve_check()`（L112-121）只 grep 文件存在/main 字段，**从不真正 resolve import**，绿了也证明不了可启动。
- 要求：R4 要么把运行所需 peer/自有依赖（zod 等）**落进 ROOT 内可解析位置**（vendored/hoist 到 ROOT 并锁版本 sha），要么给出宿主全局注入 peer 的**可证机制**；`--check` 必须对每个 server bare specifier 做真实 resolve 并打印供给根，断言不在 live 工作树、不依赖外部未锁目录。

### R3-F2（FAIL）host.log 先以默认 umask 0644 落盘，token 晚到且永不 chmod
- 事实：L166 `>"$root/host.log"` 以当前 umask（通常 022→0644）创建；L185 `chmod 600` 只覆盖 connection.txt/pids.txt，**不含 host.log**；宿主把 `dsh web: http://127.0.0.1:PORT/?token=...` 写进 host.log 后，该文件对本机其他用户可读。
- 要求：host.log 先 `install -m 600`/umask 077 预建，或对 token 行脱敏；connection.txt 空（无 token）时 `--start` 必须非零退出。

### R3-F3（FAIL）启动轮询提前 break 且超时不 fail，无 token/无 child 仍继续
- 事实：L169-174 轮询中 `grep -q "dsh web:" host.log && break` 在拿到 child 前可提前退出；50 次（≈25s）耗尽后**无任何非零退出**；L176 token 提取为可选，L178 可写空 connection.txt，脚本照常 `wait`。
- 要求：轮询以「拿到完整 token URL」为唯一成功条件；超时/无 token/端口无监听 → 打印原因并 `exit 1`，不留半启动。

### R3-F4（FAIL）trap 仅按 cwd 白名单，无 PGID/父子核对，易误杀/漏收
- 事实：L188-196 `owned_term` 对 `child_pid`(lsof 端口反查) 与 `launcher_pid` 只核 cwd ∈ `$HARNESS` 或 `$root*`；launcher cwd 本就是 HARNESS（白名单放行），未核对进程组/父进程；`trap EXIT` 在正常 wait 返回也触发；端口反查到的 PID 可能非本实例。
- 要求：`set -m`/新会话按 PGID 回收（`kill -- -PGID`），启动前记录、收尾后复验端口空；cwd 仅作辅助断言，不作为唯一放行；禁止仅凭 cwd=HARNESS 杀进程。

### R3-F5（FAIL）`--start` 接受任意 RUN 路径与任意 PORT，无 ROOT  containment、无正式端口保留
- 事实：L150-156 仅 `-d "$root"` 存在 + 端口空闲检查；不校验 root 前缀 ∈ `$RUNS_DIR`，不拒绝正式 3080/3091（及已知占用）；`PORT=` 任意值透传。
- 要求：断言 `$root` 规范路径以 `$RUNS_DIR/run-` 开头；内置拒绝清单（3080/3091 等正式端口）；越界直接 exit 1。

### R3-F6（FAIL）export 未隔离：默认目录靠 freeze 深度巧合落 ROOT，相对/绝对/~/ 路径逃逸
- 事实：`core/export.js` `defaultExportDirectory = <freeze>/../../../../exports/`（深度巧合到 ROOT/exports）；`expandDirectory` 对绝对路径、`~`、相对路径分别 `resolve(homedir())` / `resolve(defaultExportDirectory,'..',expanded)`，可写到 ROOT 外；bootstrap 未设 export 环境钉住，也无 ROOT containment 断言。「候选不运行 export」不构成安全隔离。
- 要求：R4 固定 export 根到 `$ROOT/exports`（env 或参数默认），`--check` 断言解析后 target ∈ ROOT，拒绝逃逸绝对/~/路径；Main 验收时导出必须**实际写到 ROOT/exports 可证**，正式目录零新增。

### R3-V3（待证）构建身份未全：manifest 仅 client patch sha，未与候选完整指纹对账
- 事实：`freeze/manifest.txt` 记录 git_head=8dfed2d、dirty 清单、`client_patch_sha256`，但未对全部冻结 lib 产物与 `首批候选完整指纹-20261020.json` 做逐文件 sha 对账，也未证明当前 live lib 即候选 build。
- 要求：`--prepare/--check` 输出冻结文件 sha 集合并与候选 manifest 比对一致，标注 live 工作树未提交差异是否被纳入。

### R3-V4（待证）clean_env 保留 NODE_PATH
- 事实：L31 allowlist 保留 `NODE_PATH`，若父 shell 设过可把外部 live 目录注入解析。要求：`--start` 清空 NODE_PATH 或断言其为空，`--check` 打印最终子进程 env 白名单。

## R4 复验门（QA 仍只跑 --prepare/--check，不启服务）
1. server 每个 bare specifier 真实 resolve，供给根 ∈ ROOT 或可证宿主注入，不回指 live（R3-F1）。
2. host.log 0600、token 不落 stdout、空 token 非零退出（R3-F2）。
3. 轮询唯一成功条件=完整 token，超时无 fail 修复（R3-F3）。
4. PGID 回收 + 收尾端口空，cwd 仅辅助（R3-F4）。
5. RUN 路径 containment + 正式端口拒绝（R3-F5）。
6. export 根钉 ROOT、逃逸拒绝、正式目录零新增（R3-F6）。
7. 冻结 sha 与候选指纹对账（R3-V3）；NODE_PATH 清空（R3-V4）。

> R4 未全绿前，QA 不给 Main `--start` 绝对命令；本件为静态/no-service 结论，不代表可启动，更不代表 GUI PASS。

## R4 独立复验（run-20261020-034827，仅 --check，未启服务）· 2026-10-20 03:5x

QA 独立跑 `bash bootstrap-isolated.sh --check RUN=<固定路径>` → **CHECK_OK exit0，RESOLVE_OK specs=11**；逐项对 R3-F1…F6/V3/V4：

| 门 | R3 原 FAIL | R4 证据（脚本/冻结文件） | 判定 |
|---|---|---|---|
| F1 resolver/node_modules | profile 无 node_modules、bare spec 不 resolve | `check-resolve.mjs` 真实 resolve：profile overlay → 冻结包（非 live）；server bare spec 落锁定 `.pnpm` store，拒绝回指 live `lib/`/`src/`；QA 复核 zod/xlsx/dsh-commands/dsh-storage-domain/dsh-llm realpath 均在 `.pnpm`，NO_LEAK | **PASS** |
| F2 backup/export 根未证 | backup/export root 未钉、无 overwrite 证明 | `--start` export `DSH_PM_BACKUP_DIR=$rp/backups`、`DSH_PM_ISOLATED_ROOT=$rp`；`--check` 断言 backups ∈ ROOT、export 收敛 `$ROOT/exports`；冻结 `lib/core/export.js` 64-82 fail-closed 拒绝对对/`~`/`..`/symlink | **PASS（静态）**；实际写盘留 Main 启动后可证 |
| F3 echo token / /tmp | token 0644 晚、/tmp pid、watch 未拿 token | token 仅写 `connection.txt`（install 0600，340-341），stdout `START_OK` 不含 url；`host.log` 先 `install -m 600 /dev/null`（319）；无 /tmp pid 文件 | **PASS** |
| F4 PID trap/cwd | trap 只认 cwd、易误杀 | `set -m` 新进程组；cleanup 仅当 `ps pgid==launcher_pgid` 才 `kill -TERM -- -$pgid`（267-269），leftover 再 `ancestor_of` 校验（274），无 killall | **PASS（属主组回收，非模糊 kill）** |
| F5 timeout fail / 任意 root:port | 超时不 fail、任意路径/端口 | 60×0.5s 轮询，无完整 token → cleanup+exit1（337-339）；`validate_root` realpath ∈ RUNS_DIR（200-209）；`validate_port` ≥3188、禁 3080/3091/3172、fresh lsof（212-222）；QA 复核五端口全 FREE | **PASS** |
| F6 export 逃逸 | 默认目录深度巧合、可逃逸 | env 钉 `DSH_PM_ISOLATED_ROOT`；冻结 export.js 绝对/`~/`/越界 `..`/symlink 全 throw 零写（72-81） | **PASS（静态）**；实写留 Main |
| V3 构建身份 | 仅 client patch sha | provenance 输出 git_head + src/client patch sha + src/lib mtime + STALE=none + lib/index.js、lib/client.js sha256；382 冻结文件逐条 hash（manifest.txt） | **PASS（基线自洽）**；与首批候选整包指纹逐文件对账未做（基线候选，非整包） |
| V4 NODE_PATH | clean_env 保留 NODE_PATH | `clean_env` 白名单后 `unset NODE_PATH`（37），`--start` 再 `unset NODE_PATH`（316） | **PASS** |

**静态 READY（可交 Main 仅启动采证），不等于 GUI PASS**。
- profile overlay symlink → 冻结包（非 live）；cordis.yml CLEAN 无 provider/secret，patch 仅 storage root + ui-theme light；目录 0700、密钥文件 0600；无 host.log/connection/pids（从未启动）。
- 文档小出入（非 FAIL）：MAIN-START-HERE 写「384 条」，实盘冻结 hash = 382（package.json+lib+locale），peer symlink 不入 hash。
- **非阻塞观察（入 NEXT minimal guard，不挡本次启动）**：成功轮询条件=完整 token，未先核 listener 子进程归属本 launcher；Main 首次启动应核 lsof 监听 PID 属主链，再开 GUI。
- O3/O5 在制面板改动未入本冻结（基线），不影响安全运行；LLM provider 已剔除，AI 车道不可用。
