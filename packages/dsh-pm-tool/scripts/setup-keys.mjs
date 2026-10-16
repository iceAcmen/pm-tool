#!/usr/bin/env node
/**
 * setup-keys.mjs — pm-tool 个人 Key 配置一键脚本
 * ------------------------------------------------------------
 * 背景：方舟官方【明确支持 DeepSeek Harness 接入 Coding Plan】。
 * pm-tool 活在 dsh 里，因此一个 Coding Plan 即可同时覆盖"dsh 开发 + pm-tool AI"。
 *
 * 本脚本一次配好：
 *   ① ark-plan（方舟 Coding Plan，/api/coding/v3，CODING_PLAN_API_KEY）→ dsh 内开发 + pm-tool（主）
 *   ② ollama-local（本地 Ollama，OLLAMA_API_KEY 占位）                → 敏感数据/断网/额度兜底
 *   ③ ark-standard（方舟标准 API，/api/v3，ARK_API_KEY）【可选】       → 独立部署/团队/付费兜底
 *   ④ Claude Code 环境变量（可选，写 ~/.zshrc）
 *
 * 安全红线（脚本强制）：
 *   - 真实 Key 只写到仓库外（~/.dsh/.credentials.yaml 或 ~/.zshrc），绝不写入仓库目录（写入前校验，命中即拦截）；
 *   - cordis.patch.yml 只写 apiKeyEnv（环境变量名），不含明文；
 *   - 每次改文件前自动备份；provider 与 export 幂等，可重复运行。
 *
 * 用法：
 *   node setup-keys.mjs                       交互模式（默认）
 *   node setup-keys.mjs --dry-run             只打印将要做的变更，不写盘
 *   node setup-keys.mjs --storage=credentials Key 存 dsh credentials（推荐，默认）
 *   node setup-keys.mjs --storage=zshrc       Key 存 ~/.zshrc
 *   node setup-keys.mjs --include-standard    额外配置标准 API（独立部署/团队/兜底）
 *   node setup-keys.mjs --non-interactive     非交互：Key 从环境变量读，默认配置（CI）
 *   node setup-keys.mjs --skip-claude-code    跳过 Claude Code（~/.zshrc）配置
 *   node setup-keys.mjs --verify              配置后自检
 *   node setup-keys.mjs --help
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';

// ---------- 常量 ----------
const REPO_DIR = '/Users/bytedance/Projects/dsh-pm/pm-tool';
const HOME = os.homedir();
const DSH_DIR = path.join(HOME, '.dsh');
const PROFILE_DIR = path.join(DSH_DIR, 'profiles', 'pm');
const PATCH_FILE = path.join(PROFILE_DIR, 'cordis.patch.yml');
const CRED_FILE = path.join(DSH_DIR, '.credentials.yaml');
const ZSHRC = path.join(HOME, '.zshrc');

const CODING_PLAN_OPENAI_URL = 'https://ark.cn-beijing.volces.com/api/coding/v3';
const CODING_PLAN_ANTHROPIC_URL = 'https://ark.cn-beijing.volces.com/api/coding';
const STANDARD_API_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const OLLAMA_URL = 'http://127.0.0.1:11434/v1';

const DEFAULT_PLAN_MODEL = 'deepseek-v4.1-flash';
const DEFAULT_OLLAMA_MODEL = 'qwen3:8b';

const ZSHRC_PM_KEYS_BEGIN = '# >>> pm-tool personal keys (managed by setup-keys.mjs) >>>';
const ZSHRC_PM_KEYS_END = '# <<< pm-tool personal keys (managed by setup-keys.mjs) <<<';
const ZSHRC_CODING_BEGIN = '# >>> ark coding plan for claude code (managed by setup-keys.mjs) >>>';
const ZSHRC_CODING_END = '# <<< ark coding plan for claude code (managed by setup-keys.mjs) <<<';

// ---------- 参数 ----------
const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0].split('/**')[1].trim());
  process.exit(0);
}
const DRY_RUN = argv.includes('--dry-run');
const NON_INTERACTIVE = argv.includes('--non-interactive');
const INCLUDE_STANDARD = argv.includes('--include-standard');
const SKIP_CLAUDE_CODE = argv.includes('--skip-claude-code');
const FORCE_VERIFY = argv.includes('--verify');
const storageArg = (argv.find((a) => a.startsWith('--storage=')) || '').split('=')[1];
const storage = storageArg || 'credentials';
if (storageArg && storageArg !== 'credentials' && storageArg !== 'zshrc') {
  console.error(`未知 --storage 值：${storageArg}（仅支持 credentials / zshrc）`);
  process.exit(2);
}

// ---------- 输出 ----------
const c = process.stdout.isTTY ? {
  dim: (s) => `\x1b[2m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`, yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`, cyan: (s) => `\x1b[36m${s}\x1b[0m`,
} : { dim: (s) => s, bold: (s) => s, green: (s) => s, yellow: (s) => s, red: (s) => s, cyan: (s) => s };
const log = (s) => console.log(s);
const step = (n, s) => log(`\n${c.cyan(`[${n}]`)} ${c.bold(s)}`);

// ---------- 交互 ----------
function makeRl() { return readline.createInterface({ input: process.stdin, output: process.stdout }); }
function ask(rl, question, def = '') {
  return new Promise((resolve) => {
    const hint = def ? c.dim(`（默认 ${def}）`) : '';
    rl.question(`${question}${hint} `, (a) => resolve((a || '').trim() || def));
  });
}
function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    let value = '';
    if (!stdin.isTTY) { const rl = readline.createInterface({ input: process.stdin }); rl.on('line', (line) => { rl.close(); resolve(line.trim()); }); return; }
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n') { stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData); process.stdout.write('\n'); resolve(value); }
      else if (ch === '\u0003') { process.stdout.write('\n'); process.exit(130); }
      else if (ch === '\u007f' || ch === '\b') { if (value.length) { value = value.slice(0, -1); process.stdout.write('\b \b'); } }
      else { value += ch; process.stdout.write('*'); }
    };
    stdin.on('data', onData);
  });
}

// ---------- 文件工具 ----------
function readSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function backup(p) {
  if (DRY_RUN || !fs.existsSync(p)) return;
  const d = new Date(); const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  fs.copyFileSync(p, `${p}.bak-${stamp}`);
}
function writeFile(p, content) {
  if (DRY_RUN) { log(c.dim(`  (dry-run) 将写入 ${p}`)); return; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

// ---------- 安全 ----------
function assertOutsideRepo(p) {
  const resolved = path.resolve(p); const repoResolved = path.resolve(REPO_DIR);
  if (resolved === repoResolved || resolved.startsWith(repoResolved + path.sep)) {
    log(c.red(`安全拦截：目标路径位于仓库内，拒绝写入 → ${resolved}`)); process.exit(3);
  }
}
function yamlScalar(v) { return /^[A-Za-z0-9._/:+-]+$/.test(v) ? v : `'${v.replace(/'/g, "''")}'`; }

// ---------- provider 定义与块构造 ----------
function buildProviderBlock(name, cfg) {
  const lines = [`      ${name}:`, `        displayName: ${cfg.displayName}`, `        apiKeyEnv: ${cfg.apiKeyEnv}`, `        api: ${cfg.api}`, `        baseURL: ${cfg.baseURL}`, '        models:'];
  for (const m of cfg.models) {
    lines.push(`          - id: ${m.id}`, `            name: ${m.name}`, `            contextWindow: ${m.contextWindow}`);
  }
  return lines;
}
function ensureProvidersInPatch(content, wanted) {
  const lines = content.split('\n');
  const startIdx = lines.findIndex((l) => /^- id:\s*llm-pi-ai\s*$/.test(l));
  if (startIdx === -1) return { error: '未找到 llm-pi-ai 条目（请确认 profile=pm 已初始化）' };
  let endIdx = startIdx + 1;
  while (endIdx < lines.length && !/^- id:\s/.test(lines[endIdx])) endIdx++;
  const blockText = lines.slice(startIdx, endIdx).join('\n');
  const report = [];
  const insertBlocks = [];
  for (const w of wanted) {
    const exists = new RegExp(`^ {6}${w.name}:\\s*$`, 'm').test(blockText);
    if (exists) report.push(`${w.name}（已存在，跳过）`);
    else { insertBlocks.push(...buildProviderBlock(w.name, w.cfg)); report.push(w.name); }
  }
  if (!insertBlocks.length) return { content, changed: false, report };
  const next = [...lines.slice(0, endIdx), ...insertBlocks, ...lines.slice(endIdx)];
  return { content: next.join('\n'), changed: true, report };
}

// ---------- credentials refs ----------
function ensureRefs(content, entries) {
  const body = content || 'version: 1\n';
  const lines = body.split('\n');
  const formatRow = (k, v) => `  ${k}: ${yamlScalar(v)}`;
  let refsIdx = lines.findIndex((l) => /^refs:\s*$/.test(l));
  if (refsIdx === -1) {
    return { content: `${body.replace(/\n*$/, '\n')}refs:\n${entries.map(([k, v]) => formatRow(k, v)).join('\n')}\n`, changed: true, touched: entries.map(([k]) => `${k}（新增）`) };
  }
  let segEnd = refsIdx + 1;
  while (segEnd < lines.length && (lines[segEnd] === '' || /^\s/.test(lines[segEnd]))) segEnd++;
  const seg = lines.slice(refsIdx + 1, segEnd);
  const touched = [];
  for (const [k, v] of entries) {
    const idx = seg.findIndex((l) => new RegExp(`^\\s+${k}:\\s*`).test(l));
    if (idx >= 0) { seg[idx] = formatRow(k, v); touched.push(`${k}（更新）`); }
    else { seg.push(formatRow(k, v)); touched.push(`${k}（新增）`); }
  }
  return { content: [...lines.slice(0, refsIdx + 1), ...seg, ...lines.slice(segEnd)].join('\n'), changed: true, touched };
}

// ---------- zshrc 块 ----------
function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function upsertBlock(content, begin, end, bodyLines) {
  const block = `${begin}\n${bodyLines.join('\n')}\n${end}`;
  const re = new RegExp(`${escRe(begin)}[\\s\\S]*?${escRe(end)}\\n?`, 'm');
  if (re.test(content)) return { content: content.replace(re, `${block}\n`), changed: true };
  return { content: `${content.replace(/\n*$/, '')}\n\n${block}\n`, changed: true };
}
const shellQuote = (v) => `'${v.replace(/'/g, `'\\''`)}'`;

// ---------- 自检 ----------
async function checkChat(baseUrl, key, label, model) {
  log(c.dim(`  自检 ${label}（最小请求）…`));
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: '只回复两个字：正常' }], max_tokens: 20 }),
    });
    if (!res.ok) { log(c.yellow(`  ${label} 返回 ${res.status}：${(await res.text()).slice(0, 160)}`)); return false; }
    const data = await res.json();
    log(c.green(`  ✓ ${label} 可用：${(data.choices?.[0]?.message?.content || '').trim()}`));
    return true;
  } catch (e) { log(c.yellow(`  ${label} 自检失败：${e.message}`)); return false; }
}
function verifyOllama() {
  const r = spawnSync('ollama', ['list'], { encoding: 'utf8' });
  if (r.status !== 0) { log(c.yellow('  未检测到 ollama（可稍后：brew install ollama）')); return false; }
  log(c.green('  ✓ ollama 已安装；请确认 pull 模型：ollama pull qwen3:8b'));
  return true;
}

// ---------- 主流程 ----------
async function main() {
  log(c.bold('\npm-tool 个人 Key 配置一键脚本') + (DRY_RUN ? c.yellow('  （dry-run，不写盘）') : ''));
  if (os.platform() !== 'darwin') log(c.yellow(`提示：当前平台 ${os.platform()}，脚本按 macOS 路径设计。`));
  [PATCH_FILE, CRED_FILE, ZSHRC].forEach(assertOutsideRepo);
  if (!fs.existsSync(PATCH_FILE)) { log(c.red(`找不到 ${PATCH_FILE}，请先初始化 dsh profile=pm。`)); process.exit(4); }

  // 收集
  let planKey = process.env.CODING_PLAN_API_KEY || '';
  let standardKey = process.env.ARK_API_KEY || '';
  let planModel = DEFAULT_PLAN_MODEL;
  let ollamaModel = DEFAULT_OLLAMA_MODEL;
  let wantStandard = INCLUDE_STANDARD;
  let wantClaudeCode = !SKIP_CLAUDE_CODE;
  let doVerify = FORCE_VERIFY;

  if (!NON_INTERACTIVE) {
    const rl = makeRl();
    step(1, '方舟 Coding Plan（dsh 开发 + pm-tool 主通道，官方支持）');
    if (!planKey) planKey = await askHidden(`  粘贴 Coding Plan API Key（回车跳过，稍后在 dsh 设置→模型补录）：`);
    else log(c.dim('  已从环境变量 CODING_PLAN_API_KEY 读取'));
    planModel = await ask(rl, `  Coding Plan 模型 ID`, DEFAULT_PLAN_MODEL);
    ollamaModel = await ask(rl, `  本地 Ollama 模型`, DEFAULT_OLLAMA_MODEL);

    step(2, '可选通道');
    const stdAns = await ask(rl, `  配置标准 API（独立部署/团队/兜底，需另 ARK_API_KEY）？[y/N]`, wantStandard ? 'y' : 'n');
    wantStandard = stdAns.toLowerCase() === 'y';
    if (wantStandard && !standardKey) standardKey = await askHidden(`  粘贴 ARK_API_KEY（标准 API，回车跳过）：`);

    if (wantClaudeCode && planKey) {
      const cc = await ask(rl, `  同时写 Claude Code 环境变量到 ~/.zshrc？[Y/n]`, 'y');
      wantClaudeCode = cc.toLowerCase() !== 'n';
    } else wantClaudeCode = false;

    step(3, 'Key 存储方式');
    const sc = await ask(rl, `  密钥存到 ① dsh credentials（推荐） 或 ② ~/.zshrc [1/2]`, storage === 'credentials' ? '1' : '2');
    var chosen = sc === '2' ? 'zshrc' : 'credentials';
    doVerify = FORCE_VERIFY || (await ask(rl, `  配置后立即自检？[y/N]`, 'n')).toLowerCase() === 'y';
    rl.close();
  } else { var chosen = storage; }

  // 构造 provider
  const wanted = [{
    name: 'ark-plan',
    cfg: { displayName: 'Ark Coding Plan', apiKeyEnv: 'CODING_PLAN_API_KEY', api: 'openai-completions', baseURL: CODING_PLAN_OPENAI_URL,
      models: [{ id: planModel, name: 'DeepSeek V4.1 Flash', contextWindow: 1024000 }] },
  }, {
    name: 'ollama-local',
    cfg: { displayName: '本地 Ollama', apiKeyEnv: 'OLLAMA_API_KEY', api: 'openai-completions', baseURL: OLLAMA_URL,
      models: [{ id: ollamaModel, name: 'Qwen3 本地', contextWindow: 32768 }] },
  }];
  if (wantStandard) wanted.push({
    name: 'ark-standard',
    cfg: { displayName: '方舟标准 API（按量）', apiKeyEnv: 'ARK_API_KEY', api: 'openai-completions', baseURL: STANDARD_API_URL,
      models: [{ id: planModel, name: 'DeepSeek V4.1 Flash（按量）', contextWindow: 1024000 }] },
  });

  step(4, '准备执行的变更');
  wanted.forEach((w) => log(`  · provider ${w.name} → ${w.cfg.baseURL}`));
  if (!planKey) log(c.yellow('  · 未提供 Coding Plan Key：仅写入 provider，稍后在 dsh 设置→模型补录。'));

  // 1) patch providers
  const pr = ensureProvidersInPatch(readSafe(PATCH_FILE) || '', wanted);
  if (pr.error) { log(c.red(`  ${pr.error}`)); process.exit(5); }
  if (pr.changed) { backup(PATCH_FILE); writeFile(PATCH_FILE, pr.content); log(c.green(`  ✓ cordis.patch.yml：${pr.report.join('、')}`)); }
  else log(c.dim(`  provider 均已存在：${pr.report.join('、')}`));

  // 2) 密钥（dsh / zshrc）
  const refs = [['CODING_PLAN_API_KEY', planKey], ['OLLAMA_API_KEY', 'ollama']];
  if (wantStandard) refs.push(['ARK_API_KEY', standardKey]);
  const validRefs = refs.filter(([, v]) => v);

  if (chosen === 'credentials') {
    if (validRefs.length) {
      const rr = ensureRefs(readSafe(CRED_FILE) || '', validRefs);
      backup(CRED_FILE); writeFile(CRED_FILE, rr.content);
      if (!DRY_RUN) fs.chmodSync(CRED_FILE, 0o600);
      log(c.green(`  ✓ dsh credentials refs：${rr.touched.join('、')}`));
    }
  } else {
    const body = validRefs.map(([k, v]) => `export ${k}=${shellQuote(v)}`);
    const r = upsertBlock(readSafe(ZSHRC) || '', ZSHRC_PM_KEYS_BEGIN, ZSHRC_PM_KEYS_END, body);
    backup(ZSHRC); writeFile(ZSHRC, r.content);
    log(c.green('  ✓ ~/.zshrc 已写入 pm-tool 环境变量块（新开终端或 source ~/.zshrc）'));
  }

  // 3) Claude Code（zshrc）
  if (wantClaudeCode && planKey) {
    const body = [
      `export ANTHROPIC_BASE_URL=${shellQuote(CODING_PLAN_ANTHROPIC_URL)}`,
      `export ANTHROPIC_AUTH_TOKEN=${shellQuote(planKey)}`,
      `export ANTHROPIC_MODEL=${shellQuote('doubao-seed-evolving')}`,
    ];
    const r = upsertBlock(readSafe(ZSHRC) || '', ZSHRC_CODING_BEGIN, ZSHRC_CODING_END, body);
    backup(ZSHRC); writeFile(ZSHRC, r.content);
    log(c.green('  ✓ ~/.zshrc 已写入 Claude Code（Coding Plan）环境变量块'));
  }

  // 自检
  if (doVerify && !DRY_RUN) {
    step(5, '自检');
    if (planKey) await checkChat(CODING_PLAN_OPENAI_URL, planKey, 'Coding Plan', planModel);
    if (wantStandard && standardKey) await checkChat(STANDARD_API_URL, standardKey, '标准 API', planModel);
    verifyOllama();
  }

  step(DRY_RUN ? 5 : 6, '完成与红线');
  if (DRY_RUN) log(c.yellow('  dry-run 未写盘；去掉 --dry-run 正式执行。'));
  else {
    log('  · 走 ~/.zshrc 需新开终端或 source ~/.zshrc；走 credentials 重启 dsh 即可。');
    log(c.red('  · Coding Plan Key 仅在 dsh / Claude Code 等官方支持工具内使用，不要拿到独立程序/第三方应用；'));
    log(c.red('  · pm-tool 若脱离 dsh 独立部署，改用标准 API。详见 docs/personal-billing-plan.md。'));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
