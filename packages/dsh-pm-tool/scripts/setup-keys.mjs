#!/usr/bin/env node
/**
 * setup-keys.mjs — pm-tool 个人 Key 配置一键脚本
 * ------------------------------------------------------------
 * 引导个人开发者（离职后）一次配好三条通道：
 *   ① 方舟标准 API（ARK_API_KEY）        → dsh pm profile 里的 pm-tool 自建应用
 *   ② 本地 Ollama（OLLAMA_API_KEY 占位）→ 敏感数据兜底
 *   ③ 方舟 Coding Plan Key（可选）       → Claude Code 日常开发（不属于 dsh，写 ~/.zshrc）
 *
 * 安全红线（脚本自身强制）：
 *   - 真实 Key 只写到仓库外的位置：~/.dsh/.credentials.yaml 或 ~/.zshrc，绝不写入任何仓库目录；
 *   - 写入 cordis.patch.yml 的只有 apiKeyEnv（环境变量名），不含明文；
 *   - 每次修改前自动备份；provider 与 export 均幂等（可重复运行）。
 *
 * 用法：
 *   node setup-keys.mjs                       交互模式（默认）
 *   node setup-keys.mjs --dry-run             只打印将要做的变更，不写盘
 *   node setup-keys.mjs --storage=credentials Key 存到 dsh credentials（推荐，默认）
 *   node setup-keys.mjs --storage=zshrc       Key 存到 ~/.zshrc 环境变量
 *   node setup-keys.mjs --non-interactive     非交互：从环境变量读 Key，默认配置（CI/自动化）
 *   node setup-keys.mjs --skip-coding-plan    跳过 Coding Plan（Claude Code）配置
 *   node setup-keys.mjs --verify              配置后自检（交互模式也会询问）
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

const ARK_STANDARD_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_CODING_URL = 'https://ark.cn-beijing.volces.com/api/coding';
const OLLAMA_URL = 'http://127.0.0.1:11434/v1';

const ARK_DEFAULT_MODEL = 'deepseek-v4-1-flash';
const DEFAULT_OLLAMA_MODEL = 'qwen3:8b';

const ZSHRC_PM_KEYS_BEGIN = '# >>> pm-tool personal keys (managed by setup-keys.mjs) >>>';
const ZSHRC_PM_KEYS_END = '# <<< pm-tool personal keys (managed by setup-keys.mjs) <<<';
const ZSHRC_CODING_BEGIN = '# >>> ark coding plan for claude code (managed by setup-keys.mjs) >>>';
const ZSHRC_CODING_END = '# <<< ark coding plan for claude code (managed by setup-keys.mjs) <<<';

// ---------- 参数解析 ----------
const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0].split('/**')[1].trim());
  process.exit(0);
}
const DRY_RUN = argv.includes('--dry-run');
const NON_INTERACTIVE = argv.includes('--non-interactive');
const SKIP_CODING = argv.includes('--skip-coding-plan');
const FORCE_VERIFY = argv.includes('--verify');
const storageArg = (argv.find((a) => a.startsWith('--storage=')) || '').split('=')[1];
const storage = storageArg || 'credentials'; // 'credentials' | 'zshrc'
if (storageArg && storageArg !== 'credentials' && storageArg !== 'zshrc') {
  console.error(`未知 --storage 值：${storageArg}（仅支持 credentials / zshrc）`);
  process.exit(2);
}

// ---------- 终端输出 ----------
const c = process.stdout.isTTY ? {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
} : { dim: (s) => s, bold: (s) => s, green: (s) => s, yellow: (s) => s, red: (s) => s, cyan: (s) => s };

const log = (s) => console.log(s);
const step = (n, s) => log(`\n${c.cyan(`[${n}]`)} ${c.bold(s)}`);

// ---------- 交互 ----------
function makeRl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}
function ask(rl, question, def = '') {
  return new Promise((resolve) => {
    const hint = def ? c.dim(`（默认 ${def}）`) : '';
    rl.question(`${question}${hint} `, (a) => resolve((a || '').trim() || def));
  });
}
/** 掩码输入（隐藏明文，支持退格）；回车返回；直接回车=空 */
function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    let value = '';
    if (!stdin.isTTY) { // 非 TTY：退化为普通读取一行
      const rl = readline.createInterface({ input: process.stdin });
      rl.on('line', (line) => { rl.close(); resolve(line.trim()); });
      return;
    }
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(value);
      } else if (ch === '\u0003') {
        process.stdout.write('\n');
        process.exit(130);
      } else if (ch === '\u007f' || ch === '\b') {
        if (value.length) { value = value.slice(0, -1); process.stdout.write('\b \b'); }
      } else {
        value += ch;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

// ---------- 文件工具 ----------
function readSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}
function backup(p) {
  if (DRY_RUN || !fs.existsSync(p)) return;
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  fs.copyFileSync(p, `${p}.bak-${stamp}`);
}
function writeFile(p, content) {
  if (DRY_RUN) { log(c.dim(`  (dry-run) 将写入 ${p}`)); return; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

// ---------- 安全：所有写入路径必须在仓库外 ----------
function assertOutsideRepo(p) {
  const resolved = path.resolve(p);
  const repoResolved = path.resolve(REPO_DIR);
  if (resolved === repoResolved || resolved.startsWith(repoResolved + path.sep)) {
    log(c.red(`安全拦截：目标路径位于仓库内，拒绝写入 → ${resolved}`));
    process.exit(3);
  }
}
function yamlScalar(v) {
  return /^[A-Za-z0-9._/:+-]+$/.test(v) ? v : `'${v.replace(/'/g, "''")}'`;
}

// ---------- cordis.patch.yml：幂等注入 provider ----------
function buildProviderBlock({ arkModel, ollamaModel }) {
  const lines = [];
  lines.push('      ark-standard:');
  lines.push('        displayName: 方舟标准 API');
  lines.push('        apiKeyEnv: ARK_API_KEY');
  lines.push('        api: openai-completions');
  lines.push(`        baseURL: ${ARK_STANDARD_URL}`);
  lines.push('        models:');
  lines.push(`          - id: ${arkModel}`);
  lines.push('            name: DeepSeek V4.1 Flash');
  lines.push('            contextWindow: 1024000');
  lines.push('      ollama-local:');
  lines.push('        displayName: 本地 Ollama');
  lines.push('        apiKeyEnv: OLLAMA_API_KEY');
  lines.push('        api: openai-completions');
  lines.push(`        baseURL: ${OLLAMA_URL}`);
  lines.push('        models:');
  lines.push(`          - id: ${ollamaModel}`);
  lines.push('            name: Qwen3 本地');
  lines.push('            contextWindow: 32768');
  return lines;
}
function ensureProvidersInPatch(content, opts) {
  const lines = content.split('\n');
  const startIdx = lines.findIndex((l) => /^- id:\s*llm-pi-ai\s*$/.test(l));
  if (startIdx === -1) return { error: '未找到 llm-pi-ai 条目（请确认 profile=pm 已初始化）' };
  let endIdx = startIdx + 1;
  while (endIdx < lines.length && !/^- id:\s/.test(lines[endIdx])) endIdx++;
  const blockText = lines.slice(startIdx, endIdx).join('\n');
  const hasArk = /^ {6}ark-standard:\s*$/m.test(blockText);
  const hasOllama = /^ {6}ollama-local:\s*$/m.test(blockText);
  const added = [];
  if (hasArk) added.push('ark-standard（已存在，跳过）');
  if (hasOllama) added.push('ollama-local（已存在，跳过）');
  const block = [];
  if (!hasArk) block.push(...buildProviderBlock(opts).slice(0, 9));
  if (!hasOllama) block.push(...buildProviderBlock(opts).slice(9));
  if (!block.length) return { content, added, changed: false };
  const next = [...lines.slice(0, endIdx), ...block, ...lines.slice(endIdx)];
  return { content: next.join('\n'), added: [...added, ...(!hasArk ? ['ark-standard'] : []), ...(!hasOllama ? ['ollama-local'] : [])], changed: true };
}

// ---------- ~/.dsh/.credentials.yaml：幂等写 refs ----------
function ensureRefs(content, entries) {
  const body = content || 'version: 1\n';
  const lines = body.split('\n');
  let refsIdx = lines.findIndex((l) => /^refs:\s*$/.test(l));
  const formatRow = (k, v) => `  ${k}: ${yamlScalar(v)}`;
  if (refsIdx === -1) {
    const trimmed = body.replace(/\n*$/, '\n');
    const out = `${trimmed}refs:\n${entries.map(([k, v]) => formatRow(k, v)).join('\n')}\n`;
    return { content: out, changed: true, added: entries.map(([k]) => k) };
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
  const next = [...lines.slice(0, refsIdx + 1), ...seg, ...lines.slice(segEnd)];
  return { content: next.join('\n'), changed: true, added: touched };
}

// ---------- ~/.zshrc：幂等标记块 ----------
function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function upsertBlock(content, begin, end, bodyLines) {
  const block = `${begin}\n${bodyLines.join('\n')}\n${end}`;
  const re = new RegExp(`${escRe(begin)}[\\s\\S]*?${escRe(end)}\\n?`, 'm');
  if (re.test(content)) return { content: content.replace(re, `${block}\n`), changed: true };
  const base = content.replace(/\n*$/, '');
  return { content: `${base}\n\n${block}\n`, changed: true };
}
function shellQuote(v) { return `'${v.replace(/'/g, `'\\''`)}'`; }

// ---------- 自检 ----------
async function verifyArk(arkKey) {
  log(c.dim('  自检 方舟标准 API（发送一条最小请求）…'));
  try {
    const res = await fetch(`${ARK_STANDARD_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${arkKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ARK_DEFAULT_MODEL,
        messages: [{ role: 'user', content: '只回复两个字：正常' }],
        max_tokens: 20,
      }),
    });
    if (!res.ok) { log(c.yellow(`  标准 API 返回 ${res.status}：${(await res.text()).slice(0, 160)}`)); return false; }
    const data = await res.json();
    log(c.green(`  ✓ 标准 API 可用：${(data.choices?.[0]?.message?.content || '').trim()}`));
    return true;
  } catch (e) { log(c.yellow(`  标准 API 自检失败：${e.message}`)); return false; }
}
function verifyOllama() {
  const r = spawnSync('ollama', ['list'], { encoding: 'utf8' });
  if (r.status !== 0) { log(c.yellow('  未检测到 ollama（可稍后安装：brew install ollama）')); return false; }
  log(c.green('  ✓ ollama 已安装；请确认已 pull 模型：ollama pull qwen3:8b'));
  return true;
}

// ---------- 主流程 ----------
async function main() {
  log(c.bold('\npm-tool 个人 Key 配置一键脚本') + (DRY_RUN ? c.yellow('  （dry-run，不写盘）') : ''));
  if (os.platform() !== 'darwin') log(c.yellow(`提示：当前平台为 ${os.platform()}，脚本按 macOS 路径设计，注意核对。`));

  // 预检：关键文件
  [PATCH_FILE, CRED_FILE, ZSHRC].forEach((p) => assertOutsideRepo(p));
  if (!fs.existsSync(PATCH_FILE)) {
    log(c.red(`找不到 ${PATCH_FILE}，请先在 dsh 初始化 profile=pm。`));
    process.exit(4);
  }

  // 收集输入
  let arkKey = process.env.ARK_API_KEY || '';
  let codingKey = process.env.ARK_CODING_PLAN_KEY || '';
  let ollamaModel = DEFAULT_OLLAMA_MODEL;
  let arkModel = ARK_DEFAULT_MODEL;
  let doCoding = !SKIP_CODING;
  let doVerify = FORCE_VERIFY;

  if (!NON_INTERACTIVE) {
    const rl = makeRl();
    step(1, '方舟标准 API（pm-tool 自建应用用，必须）');
    if (!arkKey) { arkKey = await askHidden(`  粘贴 ARK_API_KEY（方舟控制台→API Key，回车跳过）：`); }
    else log(c.dim('  已从环境变量 ARK_API_KEY 读取'));

    arkModel = await ask(rl, `  标准 API 模型 ID`, ARK_DEFAULT_MODEL);
    ollamaModel = await ask(rl, `  本地 Ollama 模型`, DEFAULT_OLLAMA_MODEL);

    step(2, '方舟 Coding Plan（Claude Code 日常开发用，可选）');
    if (doCoding) {
      if (!codingKey) {
        const ans = await askHidden(`  粘贴 Coding Plan Key（不配置 Claude Code 可直接回车跳过）：`);
        codingKey = ans;
      } else log(c.dim('  已从环境变量 ARK_CODING_PLAN_KEY 读取'));
      if (!codingKey) doCoding = false;
    }

    step(3, 'Key 存储方式');
    const storageChoice = await ask(rl, `  密钥存到 ① dsh credentials（推荐，与终端无关） 或 ② ~/.zshrc [1/2]`, storage === 'credentials' ? '1' : '2');
    var chosen = storageChoice === '2' ? 'zshrc' : 'credentials';
    doVerify = FORCE_VERIFY || (await ask(rl, `  配置后立即自检？[y/N]`, 'n')).toLowerCase() === 'y';
    rl.close();
  } else {
    var chosen = storage;
  }

  const summary = [];
  if (arkKey) summary.push(`ARK_API_KEY（${chosen}）`);
  summary.push(`OLLAMA_API_KEY=占位（${chosen}）`);
  if (doCoding && codingKey) summary.push('Coding Plan → ~/.zshrc（Claude Code）');

  step(4, '准备执行的变更');
  log(`  标准 API 模型：${arkModel}；Ollama 模型：${ollamaModel}`);
  summary.forEach((s) => log(`  · ${s}`));
  if (!arkKey) log(c.yellow('  · 未提供 ARK_API_KEY：仅写入 provider 与 Ollama 占位，标准 API 稍后在 dsh Web 设置→模型 补录。'));

  // 1) cordis.patch.yml：注入 provider（只含 apiKeyEnv）
  const patchContent = readSafe(PATCH_FILE) || '';
  const patchRes = ensureProvidersInPatch(patchContent, { arkModel, ollamaModel });
  if (patchRes.error) { log(c.red(`  ${patchRes.error}`)); process.exit(5); }
  if (patchRes.changed) {
    backup(PATCH_FILE);
    writeFile(PATCH_FILE, patchRes.content);
    log(c.green(`  ✓ cordis.patch.yml provider：${patchRes.added.join('、')}`));
  } else log(c.dim(`  cordis.patch.yml 已含 ark-standard / ollama-local，无需改动`));

  // 2) dsh / zshrc 密钥
  const refsEntries = [];
  if (arkKey) refsEntries.push(['ARK_API_KEY', arkKey]);
  refsEntries.push(['OLLAMA_API_KEY', 'ollama']);

  if (chosen === 'credentials') {
    const credRes = ensureRefs(readSafe(CRED_FILE) || '', refsEntries);
    if (credRes.changed) {
      backup(CRED_FILE);
      writeFile(CRED_FILE, credRes.content);
      if (!DRY_RUN) fs.chmodSync(CRED_FILE, 0o600);
      log(c.green(`  ✓ dsh credentials refs：${credRes.added.join('、')}`));
    }
  } else {
    const body = refsEntries.map(([k, v]) => `export ${k}=${shellQuote(v)}`);
    const zc = readSafe(ZSHRC) || '';
    const r = upsertBlock(zc, ZSHRC_PM_KEYS_BEGIN, ZSHRC_PM_KEYS_END, body);
    backup(ZSHRC);
    writeFile(ZSHRC, r.content);
    log(c.green('  ✓ ~/.zshrc 已写入 pm-tool 环境变量块（需新开终端或 source ~/.zshrc）'));
  }

  // 3) Coding Plan（Claude Code）→ 固定写 ~/.zshrc
  if (doCoding && codingKey) {
    const body = [
      `export ANTHROPIC_BASE_URL=${shellQuote(ARK_CODING_URL)}`,
      `export ANTHROPIC_AUTH_TOKEN=${shellQuote(codingKey)}`,
      `export ANTHROPIC_MODEL=${shellQuote('doubao-seed-evolving')}`,
    ];
    const zc = readSafe(ZSHRC) || '';
    const r = upsertBlock(zc, ZSHRC_CODING_BEGIN, ZSHRC_CODING_END, body);
    backup(ZSHRC);
    writeFile(ZSHRC, r.content);
    log(c.green('  ✓ ~/.zshrc 已写入 Claude Code（Coding Plan）环境变量块'));
  }

  // 自检
  if (doVerify && !DRY_RUN) {
    step(5, '自检');
    if (arkKey) await verifyArk(arkKey);
    verifyOllama();
  }

  // 收尾提示
  step(DRY_RUN ? 5 : 6, '完成与红线提醒');
  if (DRY_RUN) log(c.yellow('  当前为 dry-run，未写任何文件；去掉 --dry-run 后正式执行。'));
  else {
    log('  · 若 Key 走 ~/.zshrc，请新开终端或 source ~/.zshrc 后再启动 dsh；');
    log('  · 若 Key 走 dsh credentials，重启 dsh 即可生效，与启动终端无关；');
    log(c.red('  · 红线：Coding Plan 的 Key 仅用于 Claude Code 等编程工具，禁止配进 pm-tool / 任何自建应用；'));
    log(c.red('  · 真实 Key 不会进 git，请勿手动写入仓库；详见 docs/personal-billing-plan.md。'));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
