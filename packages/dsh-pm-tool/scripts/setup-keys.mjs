#!/usr/bin/env node
/**
 * setup-keys.mjs — pm-tool 个人 Key 配置一键脚本（离职重装 / 新机器一键复现）
 * ------------------------------------------------------------
 * 背景：方舟官方【明确支持 DeepSeek Harness 接入 Coding Plan】。
 * pm-tool 活在 dsh 里，因此一个 Coding Plan 即可同时覆盖"dsh 开发 + pm-tool AI"。
 *
 * 本脚本一次配好：
 *   ① ark-plan（方舟 Coding Plan，/api/coding/v3，CODING_PLAN_API_KEY）→ dsh 内开发 + pm-tool（主）
 *      —— canonical 四模型：deepseek-v4-1-flash-260910（默认）/ deepseek-v4-pro-ga-260813
 *         / doubao-seed-2-1-lite-260915 / glm-5-3-flash-260828
 *      —— 默认 provider/model 由独立条目 agent-default-model 锁定
 *   ② ollama-local（本地 Ollama，OLLAMA_API_KEY 占位）                → 敏感数据/断网/额度兜底
 *   ③ ark-standard（方舟标准 API，/api/v3，ARK_API_KEY）【可选】       → 独立部署/团队/付费兜底
 *   ④ Claude Code 环境变量（可选，写 ~/.zshrc）
 *
 * 安全红线（脚本强制）：
 *   - 真实 Key 只写到仓库外（~/.dsh/.credentials.yaml 或 ~/.zshrc），绝不写入仓库目录（写入前校验，命中即拦截）；
 *   - cordis.patch.yml 只写 apiKeyEnv（环境变量名），不含明文；
 *   - Key 不回显、不进日志、不进 stdout（--check 只打印掩码）；
 *   - 每次改文件前自动备份（.bak-时间戳）；provider / refs / 默认模型幂等，重复运行零变更。
 *
 * 用法：
 *   node setup-keys.mjs                       交互模式（默认，隐藏输入粘贴 Key）
 *   node setup-keys.mjs --check               只读自检：credentials 权限/非空(掩码)、ark-plan 四模型、默认模型；不写盘，全 OK 退出 0
 *   node setup-keys.mjs --dry-run             只打印将要做的变更，不写盘（可与 --check 之外任意模式组合）
 *   node setup-keys.mjs --storage=credentials Key 存 dsh credentials（推荐，默认）
 *   node setup-keys.mjs --storage=zshrc       Key 存 ~/.zshrc
 *   node setup-keys.mjs --include-standard    额外配置标准 API（独立部署/团队/兜底）
 *   node setup-keys.mjs --non-interactive     非交互：Key 从环境变量读，默认配置（CI）
 *   node setup-keys.mjs --skip-claude-code    跳过 Claude Code（~/.zshrc）配置
 *   node setup-keys.mjs --verify              配置后对 Coding Plan 发最小请求做联网自检
 *   node setup-keys.mjs --help
 *
 * 环境变量：DSH_HOME 覆盖 dsh 家目录（默认 ~/.dsh，隔离测试/CI 用）；Key 走 CODING_PLAN_API_KEY。
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';

// ---------- 常量 ----------
// 仓库根自适应：脚本位于 <repo>/packages/dsh-pm-tool/scripts/setup-keys.mjs，向上三级即仓库根；
// 新机器/离职重装路径不同，不再硬编码绝对路径（仅用于"禁止写入仓库内"安全校验）。
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const REPO_DIR = process.env.PM_TOOL_REPO_DIR || path.resolve(SCRIPT_DIR, '..', '..', '..');
const HOME = os.homedir();
// DSH_HOME 可覆盖（隔离测试 / CI / 自定义 dsh 家目录），默认 ~/.dsh
const DSH_DIR = process.env.DSH_HOME || path.join(HOME, '.dsh');
const PROFILE_DIR = path.join(DSH_DIR, 'profiles', 'pm');
const PATCH_FILE = path.join(PROFILE_DIR, 'cordis.patch.yml');
const CRED_FILE = path.join(DSH_DIR, '.credentials.yaml');
const ZSHRC = process.env.SETUP_KEYS_ZSHRC || path.join(HOME, '.zshrc');

const CODING_PLAN_OPENAI_URL = 'https://ark.cn-beijing.volces.com/api/coding/v3';
const CODING_PLAN_ANTHROPIC_URL = 'https://ark.cn-beijing.volces.com/api/coding';
const STANDARD_API_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const OLLAMA_URL = 'http://127.0.0.1:11434/v1';

// canonical 现网可用配置（2026-10-18 实测）：默认 provider/model + ark-plan 四模型
const DEFAULT_PROVIDER = 'ark-plan';
const DEFAULT_MODEL = 'deepseek-v4-1-flash-260910';
const ARK_PLAN_MODELS = [
  { id: 'deepseek-v4-1-flash-260910', name: 'DeepSeek V4.1 Flash', contextWindow: 1024000, maxTokens: 393216, reasoningEfforts: { off: null, high: 'high' } },
  { id: 'deepseek-v4-pro-ga-260813', name: 'DeepSeek V4 Pro', contextWindow: 1024000, maxTokens: 393216, reasoningEfforts: { off: null, high: 'high' } },
  { id: 'doubao-seed-2-1-lite-260915', name: 'Doubao Seed 2.1 Lite', contextWindow: 256000, maxTokens: 128000, reasoningEfforts: { off: null, high: 'high' } },
  { id: 'glm-5-3-flash-260828', name: 'GLM 5.3 Flash', contextWindow: 200000, maxTokens: 128000, reasoningEfforts: { high: 'high' } },
];
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
const CHECK = argv.includes('--check') || argv.includes('--audit');
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
const okMark = '✓';
const badMark = '✗';

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
// 掩码：只露前 5 后 4，绝不回显完整值
function maskSecret(v) {
  if (!v) return '(空)';
  if (v.length <= 12) return '****';
  return `${v.slice(0, 5)}****${v.slice(-4)}`;
}
function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---------- canonical ark-plan 块（与现网 ~/.dsh/profiles/pm/cordis.patch.yml 一致） ----------
function arkPlanBlockLines() {
  const out = [
    '      ark-plan:',
    '        displayName: Ark Coding Plan',
    '        apiKeyEnv: CODING_PLAN_API_KEY',
    '        api: openai-completions',
    `        baseURL: ${CODING_PLAN_OPENAI_URL}`,
    '        models:',
  ];
  for (const m of ARK_PLAN_MODELS) {
    out.push(`          - id: ${m.id}`, `            name: ${m.name}`, `            contextWindow: ${m.contextWindow}`, `            maxTokens: ${m.maxTokens}`, '            input: [ text ]');
    out.push('            reasoningEfforts:');
    for (const [k, v] of Object.entries(m.reasoningEfforts)) out.push(`              ${k}: ${v === null ? 'null' : v}`);
    out.push('            compat:', '              thinkingFormat: deepseek', '              supportsReasoningEffort: true');
  }
  return out;
}

// ---------- patch 解析 / provider ----------
// 在 llm-pi-ai 条目内定位某 provider 块（6 空格缩进键），返回起止行号与块文本
function findProviderBlock(lines, name) {
  const start = lines.findIndex((l) => new RegExp(`^      ${name}:\\s*$`).test(l));
  if (start === -1) return null;
  let end = start + 1;
  while (end < lines.length) {
    const l = lines[end];
    if (/^      \S/.test(l) || /^- id:/.test(l) || /^  [A-Za-z]/.test(l)) break;
    end++;
  }
  return { start, end, text: lines.slice(start, end).join('\n') };
}

// 校验 ark-plan：baseURL + 四模型 id 齐全（不改动现有 compat/reasoningEfforts 等富字段）
function auditArkPlan(text) {
  const issues = [];
  if (!new RegExp(`baseURL:\\s*${escRe(CODING_PLAN_OPENAI_URL)}\\s*$`, 'm').test(text)) issues.push(`baseURL 应为 ${CODING_PLAN_OPENAI_URL}`);
  for (const m of ARK_PLAN_MODELS) {
    if (!new RegExp(`^          - id:\\s*${escRe(m.id)}\\s*$`, 'm').test(text)) issues.push(`缺少模型声明 ${m.id}`);
  }
  return issues;
}

function buildProviderBlock(name, cfg) {
  const lines = [`      ${name}:`, `        displayName: ${cfg.displayName}`, `        apiKeyEnv: ${cfg.apiKeyEnv}`, `        api: ${cfg.api}`, `        baseURL: ${cfg.baseURL}`, '        models:'];
  for (const m of cfg.models) {
    lines.push(`          - id: ${m.id}`, `            name: ${m.name}`, `            contextWindow: ${m.contextWindow}`);
  }
  return lines;
}

// 在 llm-pi-ai 的 config.providers 内合并：ark-plan 缺失才插 canonical 块；已存在只校验差异并报告。
// ollama-local / ark-standard 仍按"缺失则插、已存在跳过"处理；不触碰其他 provider。
function ensureProvidersInPatch(content, wanted) {
  const lines = content.split('\n');
  const startIdx = lines.findIndex((l) => /^- id:\s*llm-pi-ai\s*$/.test(l));
  if (startIdx === -1) return { error: '未找到 llm-pi-ai 条目（请确认 profile=pm 已初始化）' };
  let endIdx = startIdx + 1;
  while (endIdx < lines.length && !/^- id:\s/.test(lines[endIdx])) endIdx++;
  const report = [];
  const insertBlocks = [];

  // ark-plan：canonical 四模型 + baseURL 校验
  const arkBlock = findProviderBlock(lines, 'ark-plan');
  if (!arkBlock) {
    insertBlocks.push(...arkPlanBlockLines());
    report.push('ark-plan（新增 canonical 四模型）');
  } else {
    const issues = auditArkPlan(arkBlock.text);
    if (issues.length) report.push(`ark-plan（已存在，但有差异未改写：${issues.join('；')}）`);
    else report.push('ark-plan（已存在，校验通过）');
  }

  // 其余 provider（ollama-local / ark-standard）：缺失则追加，已存在跳过
  for (const w of wanted) {
    if (w.name === 'ark-plan') continue;
    if (findProviderBlock(lines, w.name)) report.push(`${w.name}（已存在，跳过）`);
    else { insertBlocks.push(...buildProviderBlock(w.name, w.cfg)); report.push(w.name); }
  }

  if (!insertBlocks.length) return { content, changed: false, report };
  const next = [...lines.slice(0, endIdx), ...insertBlocks, ...lines.slice(endIdx)];
  return { content: next.join('\n'), changed: true, report };
}

// ---------- 默认模型条目 agent-default-model（幂等 upsert） ----------
function ensureDefaultModelEntry(content) {
  const lines = content.split('\n');
  const idx = lines.findIndex((l) => /^- id:\s*agent-default-model\s*$/.test(l));
  if (idx === -1) {
    const block = [
      '- id: agent-default-model',
      '  name: "@deepseek-ai/dsh-agent-default-model"',
      '  config:',
      `    provider: ${DEFAULT_PROVIDER}`,
      `    model: ${DEFAULT_MODEL}`,
    ];
    return { content: `${content.replace(/\n*$/, '')}\n\n${block.join('\n')}\n`, changed: true, touched: ['agent-default-model（新增）'] };
  }
  let end = idx + 1;
  while (end < lines.length && !/^- id:\s/.test(lines[end])) end++;
  const seg = lines.slice(idx, end);
  const touched = [];
  const upsert = (key, val) => {
    const re = new RegExp(`^(\\s+)${key}:\\s*.*$`, 'm');
    const i = seg.findIndex((l) => new RegExp(`^\\s+${key}:\\s*`).test(l));
    if (i >= 0) {
      const indent = seg[i].match(/^(\s+)/)[1];
      const wanted = `${indent}${key}: ${val}`;
      if (seg[i] !== wanted) { seg[i] = wanted; touched.push(`${key}→${val}（修正）`); }
    } else {
      seg.push(`    ${key}: ${val}`); touched.push(`${key}（新增）`);
    }
  };
  upsert('provider', DEFAULT_PROVIDER);
  upsert('model', DEFAULT_MODEL);
  const changed = touched.length > 0;
  return { content: [...lines.slice(0, idx), ...seg, ...lines.slice(end)].join('\n'), changed, touched };
}

function auditDefaultModel(content) {
  const issues = [];
  const lines = content.split('\n');
  const idx = lines.findIndex((l) => /^- id:\s*agent-default-model\s*$/.test(l));
  if (idx === -1) return ['缺少 agent-default-model 条目（默认 provider/model 未锁定）'];
  let end = idx + 1;
  while (end < lines.length && !/^- id:\s/.test(lines[end])) end++;
  const seg = lines.slice(idx, end).join('\n');
  if (!new RegExp(`^\\s+provider:\\s*${escRe(DEFAULT_PROVIDER)}\\s*$`, 'm').test(seg)) issues.push(`默认 provider 应为 ${DEFAULT_PROVIDER}`);
  if (!new RegExp(`^\\s+model:\\s*${escRe(DEFAULT_MODEL)}\\s*$`, 'm').test(seg)) issues.push(`默认 model 应为 ${DEFAULT_MODEL}`);
  return issues;
}

// ---------- credentials refs（真幂等：值相同则不动） ----------
function ensureRefs(content, entries) {
  const body = content || 'version: 1\n';
  const lines = body.split('\n');
  const formatRow = (k, v) => `  ${k}: ${yamlScalar(v)}`;
  let refsIdx = lines.findIndex((l) => /^refs:\s*$/.test(l));
  const touched = [];
  if (refsIdx === -1) {
    const seg = entries.map(([k, v]) => formatRow(k, v));
    return { content: `${body.replace(/\n*$/, '\n')}refs:\n${seg.join('\n')}\n`, changed: true, touched: entries.map(([k]) => `${k}（新增）`) };
  }
  let segEnd = refsIdx + 1;
  while (segEnd < lines.length && (lines[segEnd] === '' || /^\s/.test(lines[segEnd]))) segEnd++;
  const seg = lines.slice(refsIdx + 1, segEnd);
  for (const [k, v] of entries) {
    const idx = seg.findIndex((l) => new RegExp(`^\\s+${k}:\\s*`).test(l));
    const row = formatRow(k, v);
    if (idx >= 0) {
      if (seg[idx] === row) continue;
      seg[idx] = row; touched.push(`${k}（更新）`);
    } else { seg.push(row); touched.push(`${k}（新增）`); }
  }
  const changed = touched.length > 0;
  return { content: [...lines.slice(0, refsIdx + 1), ...seg, ...lines.slice(segEnd)].join('\n'), changed, touched };
}

// ---------- credentials 只读审计 ----------
function auditCredentials() {
  const issues = [];
  const info = {};
  if (!fs.existsSync(CRED_FILE)) {
    issues.push(`缺少 ${CRED_FILE}`);
    return { issues, info };
  }
  const st = fs.statSync(CRED_FILE);
  if ((st.mode & 0o077) !== 0) issues.push(`权限不是 0600（当前 ${(st.mode & 0o777).toString(8)}），应 chmod 600`);
  const text = fs.readFileSync(CRED_FILE, 'utf8');
  const m = text.split('\n').find((l) => !/^\s*#/.test(l) && new RegExp(`^\\s+CODING_PLAN_API_KEY:\\s*'?([^'#\\n]+)'?\\s*$`).test(l));
  if (!m) issues.push('refs 中缺少 CODING_PLAN_API_KEY');
  else {
    const val = m.match(/^\s+CODING_PLAN_API_KEY:\s*'?([^'#\n]+)'?/)[1].trim();
    if (!val) issues.push('CODING_PLAN_API_KEY 为空');
    else info.masked = maskSecret(val);
  }
  return { issues, info };
}

// ---------- zshrc 块 ----------
function upsertBlock(content, begin, end, bodyLines) {
  const block = `${begin}\n${bodyLines.join('\n')}\n${end}`;
  const re = new RegExp(`${escRe(begin)}[\\s\\S]*?${escRe(end)}\\n?`, 'm');
  if (re.test(content)) {
    const existing = content.match(re)[0];
    if (existing === `${block}\n`) return { content, changed: false };
    return { content: content.replace(re, `${block}\n`), changed: true };
  }
  return { content: `${content.replace(/\n*$/, '')}\n\n${block}\n`, changed: true };
}
const shellQuote = (v) => `'${v.replace(/'/g, `'\\''`)}'`;

// ---------- 自检（联网最小请求，可选） ----------
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

// ---------- --check 只读审计模式（绝不写盘） ----------
function runCheck() {
  log(c.bold('\npm-tool 配置只读自检（--check，不修改任何文件）'));
  let fail = 0;
  const item = (ok, label, detail = '') => {
    log(`  ${ok ? c.green(okMark) : c.red(badMark)} ${label}${detail ? c.dim(` — ${detail}`) : ''}`);
    if (!ok) fail++;
  };

  // 1) credentials
  step('1', `dsh 凭据 ${CRED_FILE}`);
  const { issues, info } = auditCredentials();
  item(issues.length === 0, 'CODING_PLAN_API_KEY 已录入且非空', info.masked ? `掩码 ${info.masked}` : '');
  for (const i of issues) log(c.yellow(`      · ${i}`));
  const envKey = process.env.CODING_PLAN_API_KEY;
  if (envKey) log(c.dim(`      · 另检测到进程环境变量 CODING_PLAN_API_KEY（${maskSecret(envKey)}，dsh 也可回落读取）`));

  // 2) patch provider
  step('2', `provider 声明 ${PATCH_FILE}`);
  const patch = readSafe(PATCH_FILE);
  if (patch === null) {
    item(false, `找不到 ${PATCH_FILE}（请先初始化 dsh profile=pm）`);
  } else {
    const lines = patch.split('\n');
    const llmIdx = lines.findIndex((l) => /^- id:\s*llm-pi-ai\s*$/.test(l));
    item(llmIdx !== -1, 'llm-pi-ai 条目存在');
    if (llmIdx !== -1) {
      const ark = findProviderBlock(lines, 'ark-plan');
      if (!ark) {
        item(false, 'ark-plan provider 缺失');
      } else {
        const arkIssues = auditArkPlan(ark.text);
        item(arkIssues.length === 0, 'ark-plan：baseURL + 四模型齐全（deepseek-v4-1-flash-260910 / deepseek-v4-pro-ga-260813 / doubao-seed-2-1-lite-260915 / glm-5-3-flash-260828）');
        for (const i of arkIssues) log(c.yellow(`      · ${i}`));
      }
    }
  }

  // 3) 默认模型
  step('3', '默认 provider / model（agent-default-model）');
  if (patch === null) {
    item(false, '无法校验（patch 文件缺失）');
  } else {
    const dmIssues = auditDefaultModel(patch);
    item(dmIssues.length === 0, `默认指向 ${DEFAULT_PROVIDER} / ${DEFAULT_MODEL}`);
    for (const i of dmIssues) log(c.yellow(`      · ${i}`));
  }

  // 4) 运行时层说明（只如实陈述，不探测进程、不声称已注册）
  step('4', '运行时层（本脚本不探测进程）');
  log(c.dim('  · 以上仅校验【文件层】：credentials 文件与 cordis.patch.yml 声明是否齐全、权限是否正确。'));
  log(c.dim('  · 文件齐全不等于宿主已加载：patch/cred 变更需【重启 dsh 进程】后才生效；'));
  log(c.dim('    加载结果请在 dsh「设置 → 模型」页目视确认（看到 Ark Coding Plan 四模型、默认模型已切换）。'));
  log(c.dim('  · 本脚本不连接、不重启、不写入任何运行中实例，也不替宿主声称注册成功。'));

  // 修复提示
  if (fail > 0) {
    log(`\n${c.red(`未通过 ${fail} 项（文件层）。修复方式：`)}`);
    log('  · 补 Key：交互运行 node scripts/setup-keys.mjs（隐藏输入粘贴 CODING_PLAN_API_KEY），');
    log('    或非交互：CODING_PLAN_API_KEY=<你的key> node scripts/setup-keys.mjs --non-interactive --skip-claude-code');
    log('  · 补 provider / 默认模型：先 node scripts/setup-keys.mjs --dry-run 预览，再正式运行（自动备份、幂等）。');
    log('  · 已有 ark-plan 块内漂移（缺模型/baseURL 不符）脚本只报告不覆写，需人工对齐 canonical 块，避免冲掉自定义 compat 字段。');
    log('  · 权限修复：chmod 600 ~/.dsh/.credentials.yaml');
    process.exit(1);
  }
  log(`\n${c.green('文件层全部通过：credentials 权限/非空、ark-plan 四模型、默认模型均正确；重启 dsh 后到「设置→模型」目视确认加载。')}`);
  process.exit(0);
}

// ---------- 主流程 ----------
async function main() {
  if (CHECK) return runCheck();

  log(c.bold('\npm-tool 个人 Key 配置一键脚本') + (DRY_RUN ? c.yellow('  （dry-run，不写盘）') : ''));
  if (!NON_INTERACTIVE && !process.stdout.isTTY) log(c.dim('  （非 TTY：Key 将从环境变量读取，等同于 --non-interactive）'));
  if (os.platform() !== 'darwin') log(c.yellow(`提示：当前平台 ${os.platform()}，脚本按 macOS 路径设计。`));
  [PATCH_FILE, CRED_FILE, ZSHRC].forEach(assertOutsideRepo);
  if (!fs.existsSync(PATCH_FILE)) { log(c.red(`找不到 ${PATCH_FILE}，请先初始化 dsh profile=pm。`)); process.exit(4); }

  // 无参（交互）引导
  if (!NON_INTERACTIVE && process.stdout.isTTY) {
    log(c.dim('  参数：--check 只读自检 ｜ --dry-run 预览不写盘 ｜ --storage=credentials|zshrc ｜ --include-standard ｜ --skip-claude-code ｜ --verify 联网自检 ｜ --help'));
  }

  // 收集
  let planKey = process.env.CODING_PLAN_API_KEY || '';
  let standardKey = process.env.ARK_API_KEY || '';
  let ollamaModel = DEFAULT_OLLAMA_MODEL;
  let wantStandard = INCLUDE_STANDARD;
  let wantClaudeCode = !SKIP_CLAUDE_CODE;
  let doVerify = FORCE_VERIFY;

  if (!NON_INTERACTIVE && process.stdout.isTTY) {
    const rl = makeRl();
    step(1, '方舟 Coding Plan（dsh 开发 + pm-tool 主通道，官方支持）');
    if (!planKey) planKey = await askHidden(`  粘贴 Coding Plan API Key（回车跳过，稍后在 dsh 设置→模型补录）：`);
    else log(c.dim('  已从环境变量 CODING_PLAN_API_KEY 读取（不回显）'));
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
    doVerify = FORCE_VERIFY || (await ask(rl, `  配置后立即联网自检？[y/N]`, 'n')).toLowerCase() === 'y';
    rl.close();
  } else { var chosen = storage; }

  // 构造 provider（ark-plan 走 canonical 块，不在此单模型构造）
  const wanted = [{
    name: 'ollama-local',
    cfg: { displayName: '本地 Ollama', apiKeyEnv: 'OLLAMA_API_KEY', api: 'openai-completions', baseURL: OLLAMA_URL,
      models: [{ id: ollamaModel, name: 'Qwen3 本地', contextWindow: 32768 }] },
  }];
  if (wantStandard) wanted.push({
    name: 'ark-standard',
    cfg: { displayName: '方舟标准 API（按量）', apiKeyEnv: 'ARK_API_KEY', api: 'openai-completions', baseURL: STANDARD_API_URL,
      models: [{ id: DEFAULT_MODEL, name: 'DeepSeek V4.1 Flash（按量）', contextWindow: 1024000 }] },
  });

  step(4, '准备执行的变更');
  log(`  · provider ark-plan → ${CODING_PLAN_OPENAI_URL}（canonical 四模型，默认 ${DEFAULT_MODEL}）`);
  wanted.forEach((w) => log(`  · provider ${w.name} → ${w.cfg.baseURL}`));
  log(`  · 默认模型条目 agent-default-model → ${DEFAULT_PROVIDER} / ${DEFAULT_MODEL}`);
  if (!planKey) log(c.yellow('  · 未提供 Coding Plan Key：仅写入 provider/默认模型，稍后在 dsh 设置→模型补录。'));

  // 1) patch providers（ark-plan 校验/补 canonical，其余幂等追加）
  const pr = ensureProvidersInPatch(readSafe(PATCH_FILE) || '', wanted);
  if (pr.error) { log(c.red(`  ${pr.error}`)); process.exit(5); }
  if (pr.changed) { backup(PATCH_FILE); writeFile(PATCH_FILE, pr.content); log(c.green(`  ✓ cordis.patch.yml：${pr.report.join('、')}`)); }
  else log(c.dim(`  provider 均已就绪：${pr.report.join('、')}`));

  // 1b) 默认模型条目（幂等 upsert）
  const dm = ensureDefaultModelEntry(readSafe(PATCH_FILE) || '');
  if (dm.changed) { backup(PATCH_FILE); writeFile(PATCH_FILE, dm.content); log(c.green(`  ✓ agent-default-model：${dm.touched.join('、')}`)); }
  else log(c.dim(`  默认模型已正确：${DEFAULT_PROVIDER} / ${DEFAULT_MODEL}（零变更）`));

  // 2) 密钥（dsh / zshrc）
  const refs = [['CODING_PLAN_API_KEY', planKey], ['OLLAMA_API_KEY', 'ollama']];
  if (wantStandard) refs.push(['ARK_API_KEY', standardKey]);
  const validRefs = refs.filter(([, v]) => v);

  if (chosen === 'credentials') {
    if (validRefs.length) {
      const rr = ensureRefs(readSafe(CRED_FILE) || '', validRefs);
      if (rr.changed) {
        backup(CRED_FILE); writeFile(CRED_FILE, rr.content);
        if (!DRY_RUN) fs.chmodSync(CRED_FILE, 0o600);
        log(c.green(`  ✓ dsh credentials refs：${rr.touched.join('、')}（权限 0600）`));
      } else log(c.dim(`  credentials refs 均未变化（幂等，零写入）`));
    } else log(c.dim('  无有效 Key 可写入 credentials（跳过）。'));
  } else {
    const body = validRefs.map(([k, v]) => `export ${k}=${shellQuote(v)}`);
    const r = upsertBlock(readSafe(ZSHRC) || '', ZSHRC_PM_KEYS_BEGIN, ZSHRC_PM_KEYS_END, body);
    if (r.changed) { backup(ZSHRC); writeFile(ZSHRC, r.content); log(c.green('  ✓ ~/.zshrc 已写入 pm-tool 环境变量块（新开终端或 source ~/.zshrc）')); }
    else log(c.dim('  ~/.zshrc pm-tool 环境变量块已一致（零变更）'));
  }

  // 3) Claude Code（zshrc）
  if (wantClaudeCode && planKey) {
    const body = [
      `export ANTHROPIC_BASE_URL=${shellQuote(CODING_PLAN_ANTHROPIC_URL)}`,
      `export ANTHROPIC_AUTH_TOKEN=${shellQuote(planKey)}`,
      `export ANTHROPIC_MODEL=${shellQuote('doubao-seed-evolving')}`,
    ];
    const r = upsertBlock(readSafe(ZSHRC) || '', ZSHRC_CODING_BEGIN, ZSHRC_CODING_END, body);
    if (r.changed) { backup(ZSHRC); writeFile(ZSHRC, r.content); log(c.green('  ✓ ~/.zshrc 已写入 Claude Code（Coding Plan）环境变量块')); }
    else log(c.dim('  Claude Code 块已一致（零变更）'));
  }

  // 自检
  if (doVerify && !DRY_RUN) {
    step(5, '联网自检');
    if (planKey) await checkChat(CODING_PLAN_OPENAI_URL, planKey, 'Coding Plan', DEFAULT_MODEL);
    if (wantStandard && standardKey) await checkChat(STANDARD_API_URL, standardKey, '标准 API', DEFAULT_MODEL);
    verifyOllama();
  }

  step(DRY_RUN ? 5 : 6, '完成与红线');
  if (DRY_RUN) log(c.yellow('  dry-run 未写盘；去掉 --dry-run 正式执行。'));
  else {
    log('  · 走 ~/.zshrc 需新开终端或 source ~/.zshrc；走 credentials 重启 dsh 即可。');
    log('  · 复查：node scripts/setup-keys.mjs --check 应全部 ✓（退出 0）。');
    log(c.red('  · Coding Plan Key 仅在 dsh / Claude Code 等官方支持工具内使用，不要拿到独立程序/第三方应用；'));
    log(c.red('  · pm-tool 若脱离 dsh 独立部署，改用标准 API。详见 docs/personal-billing-plan.md。'));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
