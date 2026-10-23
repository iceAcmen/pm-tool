# A19 展示修复独立复验计划

> 2026-10-22，trae，不同独立测试专家、非开发。只复验已批准的 A18-GM-01 展示修复，供 Main 接续；本前缀和自有 tmp 是唯一写域。

## 授权与边界

负责人派单要求：冻结完整当前包，复制指定完整依赖到自身可写 tmp，检查内链和非共享 inode；复跑原必要13、controls10、model10、作者11、受影响与全 noEmit。另独立反例覆盖准确 ID、同名跨项目完整 refs、缺 ID 三态、处理后重挂、HTML 普通文本、零动作及 confirm/ignore 参数。保原红，不改原专家 fixture 期望，不签 GUI；历史共享10bin BLOCKED 保持。Main 暂保持产品源码静态，A18旧3248仅采其他既有旅程。

不 fetch/pull、产品修改、其他 testing/livingdocs、安装、构建、GUI、服务、凭据、commit/push、共享 cache/lib。本角色可签本缺陷有限 SOURCE/AUTO，不放行全习惯、发布或其他功能。

## 步骤与状态

1. 已读 AGENTS、collaboration §9/11、有限修复计划、先行合同/原红/cases、作者最终 Markdown/run/close/seal/索引及产品两文件。
2. 已核作者153件索引、8407条seal无漂移；作者修前与修后仅两文件内容差异、当前源码与作者修后相同。基线9b1a8c5不代替dirty候选。
3. 已冻结508输入、389源文件：完整 src/scripts/locale、所有源配置/锁文件/包内文档；排除生成和运行目录。已保存tracked binary diff、新文件清单、完整SHA/bytes/mtime/inode manifest；完整依赖13613文件/1030内链，无共享inode。
4. 已执行：白名单 env、Node固定入口、独占完整依赖、cache:false/--no-cache、单fork/1worker，原13+10+10+11与新独立15项全部通过。原9受影响套件缺fixture exit1/80绿原件保；只复制原fixture原样后作者12文件131/131。完整生产 noEmit exit0。
5. 已封存：24708枚举条目、22378唯一路径的限定保护与主源/完整依赖/冻结/原fixture前后差异0；8个测试/类型检查PID退出。有限SOURCE/AUTO PASS，原GUI FAIL与历史10bin BLOCKED保。报告/原命令回执收尾，不触发build/GUI/commit。

## 设施原失败

- 首freeze exit1：检查器跨两个副本比较inode，误报全部变化；无产品测试执行。保执行回执/完整输出，改为只对内容/bytes/link判两文件差异。
- r2 freeze exit1：版本信息误假设顶层 `vite/package.json` 存在；实际Vite为Vitest内部依赖。保原件，改为通过Vitest真实路径读Vite版本；不安装或改依赖。
- 自有SSR补断言依赖未提供的顶层react-dom；未执行该测试，移除额外SSR设施要求，保修改前原件和diff。普通HTML文本仍用真实组件渲染器逐字和无活动元素断言，不称SSR/浏览器PASS。

当前有效执行为 r3；前失败不覆盖、不当产品缺陷。原合同及作者用例/fixture未改，无产品adapter。

## 命令

环境 macOS、nvm Node v22.23.3；pnpm11.28.5为项目约定，本角色不调用。

```sh
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs freeze
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs run
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs supplement
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs seal
env -i PATH=/usr/bin:/bin NODE_DISABLE_COMPILE_CACHE=1 /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/testing/a19-habit-suggestion-okr-independent-retest-20261022-run.mjs index
git diff --check -- 'docs/testing/a19-habit-suggestion-okr-independent-retest-20261022*'
```

已存在输出拒覆盖，命令表为原执行入口，不要求重跑freeze覆盖原证。最终状态以报告/原始回执为准，不以本计划签PASS。
