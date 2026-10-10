# dsh-pm-tool（项目管理工作台插件）

> 这个目录是什么、给谁用、怎么用：它是本项目自研的 **DeepSeek Harness（dsh）插件包**，在 dsh 之上提供面向项目经理的能力（项目计划、WBS 任务拆解、里程碑、可读文件存储）。给开发与迁移者阅读；按本文命令即可构建并装载到本地 dsh。

- 当前阶段：**阶段 3 第 0 步「打通验证」**——只验证插件可被装载、离线命令与文件存储可用，尚未实现业务功能。
- 运行环境：macOS + Node v22（nvm）+ pnpm 11.28.5；上游 dsh 基线 **v0.2.1-alpha.2**（MIT）。

## 能力（第 0 步）

- `/pm ping`：离线连通性自检，不依赖模型或 API Key。
- `/pm selftest`：经 `@deepseek-ai/dsh-storage-domain` + `dsh-storage-json` 写入并读回一条记录，落为可读 JSON。

## 从源码构建

```sh
# 运行环境：macOS，已通过 nvm 启用 Node 22
cd ~/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool
pnpm install        # 安装类型依赖（dsh 包固定 0.2.1-alpha.2，cordis ~4.0.5-alpha.1）
pnpm run build      # 产物输出到 lib/（不入库）
```

## 装载到本地源码版 dsh（web profile 的派生 profile：pm）

```sh
cd ~/Projects/dsh-pm/deepseek-harness
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null

# 1) 基于 web 模板创建专属 profile（首次会启动，看到启动后可 Ctrl-C）
pnpm dsh --profile pm --from-default-profile web

# 2) 以 link 方式装入本插件（源码运行官方支持 link:<绝对目录>，复用 checkout 的依赖）
pnpm dsh plugin --profile pm add link:/Users/bytedance/Projects/dsh-pm/pm-tool/packages/dsh-pm-tool

# 3) 检查配置树，确认 pm-tool 已生效
pnpm dsh --profile pm --dump-config

# 4) 启动并在浏览器用终端打印的带 token URL 打开，输入 /pm ping
pnpm dsh web --profile pm
```

> 改动本包源码后需重新 `pnpm run build` 并重启 dsh。

## 目录

```
dsh-pm-tool/
├── package.json        # 插件清单与 dsh.bundle 声明
├── tsconfig.json       # 独立 ESM/NodeNext 编译配置
├── cordis.patch.yml    # 组合包补丁：激活本插件（存储配置在阶段 B 补充）
├── src/index.ts        # 插件入口：注册 /pm 命令、打开存储领域
├── locale/{en,zh}.json # 界面展示标题/描述
└── lib/                # 构建产物（不入库）
```
