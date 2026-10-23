# P2007 开发实际命令账

> 记录终端实际调用与exit，给Main/独立专家核查；工具apply_patch不是shell命令，其每次调用均成功且只写两source与本前缀。下表相同命令的多次调用均明确记录。默认cwd为仓库根，macOS；不含任何Git/install/build/noEmit/service/GUI动作。

## 阅读与定位

| 实际命令 | exit |
| --- | --- |
| `cat AGENTS.md` | 0 |
| `cat docs/testing/p2007-archive-known-gaps-red-20261023-r1.md` | 0 |
| `cat docs/collaboration.md` | 0 |
| `cat docs/external-skills.md` | 0 |
| `cat vendor/agent-skills/mattpocock/manifest.json` | 0 |
| `cat packages/dsh-pm-tool/src/core/archive.ts packages/dsh-pm-tool/src/core/archive.test.ts` | 0 |
| `cat packages/dsh-pm-tool/src/core/storage.ts packages/dsh-pm-tool/src/core/external-skill-router.ts` | 0 |
| `cat packages/dsh-pm-tool/package.json packages/dsh-pm-tool/scripts/verify-external-skills.mjs` | 0 |
| `rg --files docs/plans docs/testing packages/dsh-pm-tool \| rg 'p2007\|lock\|review.*test\|p2\|vitest\|verify-archive\|verify-review'` | 127；两段rg均command not found，不是产品失败 |
| `ls /user_profile.md /projects/-Users-bytedance-Projects-dsh-pm-pm-tool--p2-11b908a9362bd421871f/project_memory.md /Users/bytedance/.trae-cn/skills/brainstorming/SKILL.md /Users/bytedance/.trae-cn/skills/writing-plans/SKILL.md` | 1；两memory入口不存在，skills存在 |
| `find docs/plans -maxdepth 1 -type f -name '*2026-10-23*'` | 0 |
| `find packages/dsh-pm-tool -maxdepth 2 -name '*vitest*'` | 0 |
| `find packages/dsh-pm-tool/src/core -maxdepth 1 -name '*test.ts'` | 0 |
| `cat /Users/bytedance/.trae-cn/skills/brainstorming/SKILL.md /Users/bytedance/.trae-cn/skills/writing-plans/SKILL.md` | 0 |
| `sed -n '1,110p' docs/progress.md` | 0；输出大，工具自动截取展示，不声称通读全流水 |
| `cat packages/dsh-pm-tool/vitest.config.ts packages/dsh-pm-tool/src/core/review-materials.test.ts` | 0 |
| `find packages/dsh-pm-tool/scripts -maxdepth 1 -type f -name '*p2*'` | 0 |
| `cat docs/plans/2026-10-23-p1004-sidecar-handoff-plan.md docs/plans/2026-10-23-p1005-deliverable-pointer-plan.md` | 0；只读边界核对，不动其锁 |
| `sed -n '1,10p' docs/onboarding-prompt.md docs/handoff.md docs/changelog.md docs/requirements.md docs/decision-log.md docs/knowledge-base.md docs/issues-and-solutions.md` | 0；sed合并行号只输出第一文件头，不冒称已通读列出的其余文件 |
| `ls /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/node_modules/vitest/vitest.mjs` | 0 |
| `cat packages/dsh-pm-tool/scripts/verify-p2c.mjs` | 0；仅阅读，未执行脚本 |
| `cat packages/dsh-pm-tool/src/core/export.ts` | 0 |
| `cat vendor/agent-skills/mattpocock/skills/tdd/SKILL.md vendor/agent-skills/mattpocock/skills/tdd/tests.md vendor/agent-skills/mattpocock/skills/tdd/mocking.md` | 0 |
| `grep -R -n "archive\\.js\|review-materials\\.js" packages/dsh-pm-tool/src --include='*.test.ts' --include='*.test.tsx'` | 0 |
| `cat packages/dsh-pm-tool/src/core/export-isolation.test.ts` | 0 |
| `find docs/plans -maxdepth 1 -name '2026-10-23-p2007-archive-draft-projection-*'` | 0；当时前缀不存在，未覆盖旧文件 |
| `cat vendor/agent-skills/mattpocock/skills/diagnosing-bugs/SKILL.md` | 0；设施失败时只加载诊断 |
| `ls -l packages/dsh-pm-tool/node_modules/vitest packages/dsh-pm-tool/node_modules/@deepseek-ai/dsh-storage-domain packages/dsh-pm-tool/node_modules/@deepseek-ai/cordis` | 0 |
| `sed -n '1,50p' packages/dsh-pm-tool/node_modules/vitest/package.json` | 0 |
| `sed -n '1,15p;116,132p' docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs` | 0 |
| `cat packages/dsh-pm-tool/src/core/archive.test.ts` | 0 |
| `cat docs/plans/2026-10-23-p2007-archive-draft-projection-red-r1-receipt.json docs/plans/2026-10-23-p2007-archive-draft-projection-red-r1-stdout.log docs/plans/2026-10-23-p2007-archive-draft-projection-red-r1-stderr.log` | 0；收据确认子进程exit1已返回 |
| `sed -n '10,17p;92,112p' packages/dsh-pm-tool/src/core/archive.ts` | 0 |
| `cat vendor/agent-skills/mattpocock/skills/code-review/SKILL.md` | 0 |
| `cat docs/plans/2026-10-23-p2007-archive-draft-projection-red-r1-inputs.json` | 0 |
| `find . -maxdepth 1 -type f \( -name 'GLOSSARY.md' -o -name 'CODING_STANDARDS.md' -o -name 'CONTRIBUTING.md' \)` | 0；无匹配，optional跳过 |
| `cat docs/plans/2026-10-23-p2007-archive-draft-projection-plan.md` | 两次均0 |
| `find /tmp/ -maxdepth 1 -type d -name 'pmtool-p2007-archive-draft-projection-*'` | 0；确认五个自有根，含首轮失败空根 |
| `sed -n '176,225p' docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs` | 0 |
| `sed -n '34,47p;70,84p' docs/plans/2026-10-23-p2007-archive-draft-projection-commands.md` | 0 |

## 执行与验证

以下完整命令均在仓库根实际执行；首轮设施失败保留，red-r1是有效产品红。末尾seal在本账封存后运行，其实际退出/保护结果取seal.json与终端最终回报，不提前填绿。

```sh
# exit0；只读静态门
/usr/bin/env -i PATH=/usr/bin:/bin HOME=/tmp/p2007-archive-draft-projection-static-home /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node packages/dsh-pm-tool/scripts/verify-external-skills.mjs
# exit0；六件与manifest一致
shasum -a 256 vendor/agent-skills/mattpocock/skills/diagnosing-bugs/SKILL.md vendor/agent-skills/mattpocock/skills/diagnosing-bugs/agents/openai.yaml vendor/agent-skills/mattpocock/skills/tdd/SKILL.md vendor/agent-skills/mattpocock/skills/tdd/tests.md vendor/agent-skills/mattpocock/skills/tdd/mocking.md vendor/agent-skills/mattpocock/skills/tdd/agents/openai.yaml
# 首轮exit1：ENOENT顶层vite，仅设施失败；修runner后第二次同命令exit0
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs capture
# exit1：实际5遗漏断言红；不是设施失败
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs red-r1
# exit0：9/9
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs green-r1
# exit0：review两件及两source
shasum -a 256 vendor/agent-skills/mattpocock/skills/code-review/SKILL.md vendor/agent-skills/mattpocock/skills/code-review/agents/openai.yaml packages/dsh-pm-tool/src/core/archive.ts packages/dsh-pm-tool/src/core/archive.test.ts
# exit0：4文件35/35
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs affected-r1
# exit0：只读结构化元数据打印
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --input-type=module -e 'import fs from "node:fs"; const p="docs/plans/2026-10-23-p2007-archive-draft-projection-"; const b=JSON.parse(fs.readFileSync(p+"baseline.json")); console.log(JSON.stringify(b.ownedBefore)); for(const label of ["red-r1","green-r1","affected-r1"]){const j=JSON.parse(fs.readFileSync(p+label+"-inputs.json")); console.log(JSON.stringify({label,root:j.root,sources:j.sources.filter(x=>x.path.endsWith("/archive.ts")||x.path.endsWith("/archive.test.ts")),count:j.sources.length}));}'
# exit1：有差异的正常diff返回
/usr/bin/diff -u /tmp/pmtool-p2007-archive-draft-projection-Qdq0dI/input/src/core/archive.ts packages/dsh-pm-tool/src/core/archive.ts
# exit0：v22.23.3
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --version
# exit0：仅Node语法检查，不构建、不tsc/noEmit
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --check docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs
# exit0：原包194物理文件/379保护输入/1019依赖文件
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node --input-type=module -e 'import fs from "node:fs"; const b=JSON.parse(fs.readFileSync("docs/plans/2026-10-23-p2007-archive-draft-projection-baseline.json")); console.log(JSON.stringify({originalPhysicalFiles:b.originalFiles.length,protected:b.protectedBefore.length,dependencyFiles:b.dependencyFiles.length,dependencyRoots:b.dependencyRoots}));'
# 最终封存入口；内部vendor-final及两个diff完整命令/exit由各receipt记录
/usr/bin/env -i PATH=/usr/bin:/bin /Users/bytedance/.nvm/versions/node/v22.23.3/bin/node docs/plans/2026-10-23-p2007-archive-draft-projection-runner.mjs seal
```

三次Vitest的展开实际命令、cwd、完整白名单环境与exit见对应receipt（red-r1=1、green-r1=0、affected-r1=0）。capture内部vendor-initial=0。没有丢弃、覆盖或把任何非0升级为绿。
