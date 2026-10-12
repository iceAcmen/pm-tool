#!/usr/bin/env node
/**
 * collect-evidence.mjs — 补证采集器（只读源数据，仅写指定证据目录）
 *
 * 用途：为GUI回归补采七实体(projects/tasks/milestones/risk_issues/meetings/reports/deliverables)
 *       的原始JSON快照与阶段对比证据。不是测试本身，不验证断言，只采集。
 *
 * 安全边界：
 *   - 只读 <data-root> 下的文件，不修改、不删除
 *   - 仅写入 <output-dir> 指定目录
 *   - 不读取环境变量凭据、不联网、不调用LLM、不启停服务
 *   - 不猜测git commit，如实记录 `git rev-parse HEAD` 与 `git status --porcelain`
 *   - data-root 必须是存在的目录且包含 pmtool/ 子目录（也必须是目录），否则非0退出
 *   - output-dir 不得等于或位于 data-root 内部（防自引用覆盖）
 *   - stage 名仅允许 [a-zA-Z0-9_-]，禁止路径穿越
 *   - 同阶段 manifest / files目录 / diff文件 任一已存在时拒绝覆盖
 *   - aux (checks/settings) 只记hash不复制
 *   - cancellationUnchanged = SHA + mtime + size 三者均无变化（touch-only 失败）
 *   - --diff-against 对应的 baseline manifest 的存在性、JSON可解析、files为数组、
 *     dataRoot与当前一致、目标diffPath不存在 —— 全部在任何 mkdir/copy/write 之前校验
 *
 * 用法：
 *   # 基线快照（隔离data root，复制原始JSON）
 *   node collect-evidence.mjs \
 *     --data-root /path/to/isolated-data \
 *     --output-dir /path/to/case-dir \
 *     --stage before
 *
 *   # 阶段对比（after vs before）
 *   node collect-evidence.mjs \
 *     --data-root /path/to/isolated-data \
 *     --output-dir /path/to/case-dir \
 *     --stage after \
 *     --diff-against before
 *
 *   # 正式data root（只记hash清单，不复制隐私内容）
 *   node collect-evidence.mjs \
 *     --data-root /path/to/real-data \
 *     --output-dir /path/to/case-dir \
 *     --stage before \
 *     --no-copy
 *
 * 输出：
 *   <output-dir>/<stage>.manifest.json   — 运行元数据+文件hash清单
 *   <output-dir>/<stage>.diff.json      — diff模式下的对比结果（仅diff时）
 *   <output-dir>/files/<stage>/...      — 复制的原始JSON（--no-copy时不创建）
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..'); // docs/verification/tools/ -> repo root
const PKG_DIR = join(REPO_ROOT, 'packages', 'dsh-pm-tool');

const ENTITIES = ['projects', 'tasks', 'milestones', 'risk_issues', 'meetings', 'reports', 'deliverables'];

// --- args ---
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = process.argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

const args = parseArgs();

if (!args['data-root'] || !args['output-dir'] || !args.stage) {
  console.error('ERROR: --data-root, --output-dir, --stage are required');
  process.exit(1);
}

const DATA_ROOT_ARG = args['data-root'];
const OUTPUT_DIR_ARG = args['output-dir'];
const STAGE = args.stage;
const NO_COPY = !!args['no-copy'];
const DIFF_AGAINST = args['diff-against'] || null;

// Resolve to absolute paths for consistent comparisons
const DATA_ROOT = resolve(DATA_ROOT_ARG);
const OUTPUT_DIR = resolve(OUTPUT_DIR_ARG);

// =====================================================================
// PHASE 1 — Argument & name safety validation (no FS writes)
// =====================================================================

const STAGE_NAME_RE = /^[a-zA-Z0-9_-]+$/;
if (!STAGE_NAME_RE.test(STAGE)) {
  console.error(`ERROR: --stage "${STAGE}" must match [a-zA-Z0-9_-]+ (no path traversal)`);
  process.exit(2);
}
if (DIFF_AGAINST && !STAGE_NAME_RE.test(DIFF_AGAINST)) {
  console.error(`ERROR: --diff-against "${DIFF_AGAINST}" must match [a-zA-Z0-9_-]+`);
  process.exit(2);
}

// --- validation: data-root must exist and be a directory ---
let dataRootStat;
try {
  dataRootStat = statSync(DATA_ROOT);
} catch {
  console.error(`ERROR: data-root "${DATA_ROOT}" does not exist or is not accessible`);
  process.exit(2);
}
if (!dataRootStat.isDirectory()) {
  console.error(`ERROR: data-root "${DATA_ROOT}" is not a directory`);
  process.exit(2);
}

// --- validation: data-root must contain pmtool/ which must be a directory ---
const PMTOOL_DIR = join(DATA_ROOT, 'pmtool');
let pmtoolStat;
try {
  pmtoolStat = statSync(PMTOOL_DIR);
} catch {
  console.error(`ERROR: data-root "${DATA_ROOT}" does not contain pmtool/ subdirectory`);
  console.error('  Refusing to run — collecting 0 files would falsely imply no change.');
  process.exit(2);
}
if (!pmtoolStat.isDirectory()) {
  console.error(`ERROR: "${PMTOOL_DIR}" exists but is not a directory`);
  process.exit(2);
}

// --- validation: output-dir must NOT equal or be inside data-root ---
if (OUTPUT_DIR === DATA_ROOT || OUTPUT_DIR.startsWith(DATA_ROOT + '/')) {
  console.error(`ERROR: output-dir "${OUTPUT_DIR}" equals or is inside data-root — refusing to write evidence inside source data.`);
  process.exit(2);
}

// =====================================================================
// PHASE 2 — Overwrite protection: check all target paths BEFORE any write
// =====================================================================

const MANIFEST_PATH = join(OUTPUT_DIR, `${STAGE}.manifest.json`);
const DIFF_PATH = join(OUTPUT_DIR, `${STAGE}.diff.json`);
const STAGE_FILES_DIR = join(OUTPUT_DIR, 'files', STAGE);

if (existsSync(MANIFEST_PATH)) {
  console.error(`ERROR: manifest already exists for stage "${STAGE}": ${MANIFEST_PATH}`);
  console.error('  Refusing to overwrite — use a different stage name or clean the output dir.');
  process.exit(2);
}

if (existsSync(DIFF_PATH)) {
  console.error(`ERROR: diff file already exists for stage "${STAGE}": ${DIFF_PATH}`);
  console.error('  Refusing to overwrite — use a different stage name or clean the output dir.');
  process.exit(2);
}

if (existsSync(STAGE_FILES_DIR)) {
  console.error(`ERROR: files directory already exists for stage "${STAGE}": ${STAGE_FILES_DIR}`);
  console.error('  Refusing to overwrite — use a different stage name or clean the output dir.');
  process.exit(2);
}

// =====================================================================
// PHASE 3 — Baseline pre-validation (diff mode only; all before writes)
// =====================================================================

let baselineManifest = null;

if (DIFF_AGAINST) {
  const baselinePath = join(OUTPUT_DIR, `${DIFF_AGAINST}.manifest.json`);

  if (!existsSync(baselinePath)) {
    console.error(`ERROR: baseline manifest not found: ${baselinePath}`);
    console.error('  Refusing to proceed — no files will be written.');
    process.exit(2);
  }

  let raw;
  try {
    raw = readFileSync(baselinePath, 'utf8');
  } catch (e) {
    console.error(`ERROR: cannot read baseline manifest ${baselinePath}: ${e.message}`);
    process.exit(2);
  }

  try {
    baselineManifest = JSON.parse(raw);
  } catch (e) {
    console.error(`ERROR: baseline manifest ${baselinePath} is not valid JSON: ${e.message}`);
    process.exit(2);
  }

  if (!baselineManifest || !Array.isArray(baselineManifest.files)) {
    console.error(`ERROR: baseline manifest ${baselinePath} has no "files" array`);
    process.exit(2);
  }

  // Baseline must have been collected from the SAME data root
  const baselineDataRoot = baselineManifest.dataRoot ? resolve(baselineManifest.dataRoot) : null;
  if (baselineDataRoot !== DATA_ROOT) {
    console.error(`ERROR: baseline dataRoot "${baselineManifest.dataRoot}" does not match current data-root "${DATA_ROOT}"`);
    console.error('  Refusing to diff across different data roots.');
    process.exit(2);
  }
}

// =====================================================================
// ALL VALIDATION COMPLETE — safe to write now
// =====================================================================

// --- helpers ---
function sha256File(filepath) {
  const buf = readFileSync(filepath);
  return createHash('sha256').update(buf).digest('hex');
}

function gitHead() {
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'UNAVAILABLE';
  }
}

function gitDirtyList() {
  try {
    const out = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch {
    return ['UNAVAILABLE'];
  }
}

function libHash(filename) {
  const p = join(PKG_DIR, 'lib', filename);
  try {
    return sha256File(p);
  } catch {
    return 'UNAVAILABLE';
  }
}

function walkJsonFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

// --- collect file inventory ---
function collectInventory() {
  const files = [];

  for (const entity of ENTITIES) {
    const entityDir = join(PMTOOL_DIR, entity);
    const jsonFiles = walkJsonFiles(entityDir);
    for (const fp of jsonFiles) {
      const st = statSync(fp);
      const rel = relative(DATA_ROOT, fp);
      files.push({
        rel,
        sha256: sha256File(fp),
        size: st.size,
        mtimeMs: st.mtimeMs,
      });
    }
  }

  // Also record checks/ and settings/ as auxiliary (hash only, never copied)
  for (const aux of ['checks', 'settings']) {
    const auxDir = join(PMTOOL_DIR, aux);
    for (const fp of walkJsonFiles(auxDir)) {
      const st = statSync(fp);
      const rel = relative(DATA_ROOT, fp);
      files.push({ rel, sha256: sha256File(fp), size: st.size, mtimeMs: st.mtimeMs, auxiliary: true });
    }
  }

  files.sort((a, b) => a.rel.localeCompare(b.rel));
  return files;
}

// --- copy files (unless --no-copy; aux files never copied) ---
function copyFiles(files, stage) {
  if (NO_COPY) return;
  const destBase = join(OUTPUT_DIR, 'files', stage);
  for (const f of files) {
    if (f.auxiliary) continue; // checks/settings: hash only, never copy
    const src = join(DATA_ROOT, f.rel);
    const dest = join(destBase, f.rel);
    mkdirSync(join(dest, '..'), { recursive: true });
    copyFileSync(src, dest);
  }
}

// --- diff ---
function diffManifests(prevFiles, currFiles) {
  const prevMap = new Map(prevFiles.map(f => [f.rel, f]));
  const currMap = new Map(currFiles.map(f => [f.rel, f]));

  const added = [];
  const contentModified = [];   // SHA changed (actual content edit)
  const touchOnly = [];         // SHA same but mtime/size differs (touch-only / metadata churn)
  const deleted = [];
  const fullyUnchanged = [];    // SHA same AND mtime same AND size same

  for (const [rel, curr] of currMap) {
    const prev = prevMap.get(rel);
    if (!prev) {
      added.push(rel);
    } else if (prev.sha256 !== curr.sha256) {
      contentModified.push({ rel, beforeSha256: prev.sha256, afterSha256: curr.sha256 });
    } else if (prev.mtimeMs !== curr.mtimeMs || prev.size !== curr.size) {
      // SHA identical but mtime or size changed = touch-only / metadata churn
      touchOnly.push({
        rel,
        beforeMtimeMs: prev.mtimeMs, afterMtimeMs: curr.mtimeMs,
        beforeSize: prev.size, afterSize: curr.size,
      });
    } else {
      fullyUnchanged.push(rel);
    }
  }

  for (const [rel] of prevMap) {
    if (!currMap.has(rel)) {
      deleted.push(rel);
    }
  }

  // Content unchanged count = files that are present in both with same SHA
  const contentUnchangedCount = fullyUnchanged.length + touchOnly.length;
  // Cancellation requires EVERYTHING unchanged: no add, no delete, no content-mod, no touch-only
  const cancellationUnchanged =
    contentModified.length === 0 && added.length === 0 && deleted.length === 0 && touchOnly.length === 0;

  return {
    added: added.sort(),
    contentModified: contentModified.sort((a, b) => a.rel.localeCompare(b.rel)),
    touchOnly: touchOnly.sort((a, b) => a.rel.localeCompare(b.rel)),
    deleted: deleted.sort(),
    contentUnchangedCount,
    cancellationUnchanged,
  };
}

// --- main ---
const utcNow = new Date().toISOString();

const manifest = {
  tool: 'collect-evidence.mjs',
  version: '1.1.0',
  stage: STAGE,
  collectedAt: utcNow,
  dataRoot: DATA_ROOT,
  noCopy: NO_COPY,
  environment: {
    gitHead: gitHead(),
    runningCommit: 'UNKNOWN', // gitHead ≠ running commit of the live server; we cannot determine it
    gitDirtyFiles: gitDirtyList(),
    libIndexJsSha256: libHash('index.js'),
    libClientJsSha256: libHash('client.js'),
    nodeVersion: process.version,
  },
  entitiesTracked: ENTITIES,
  files: [],
  fileCount: 0,
};

console.log(`[collect-evidence] stage=${STAGE} data-root=${DATA_ROOT}`);
console.log(`[collect-evidence] git HEAD=${manifest.environment.gitHead}`);
console.log(`[collect-evidence] dirty files=${manifest.environment.gitDirtyFiles.length}`);

// Collect
const inventory = collectInventory();
manifest.files = inventory;
manifest.fileCount = inventory.length;
console.log(`[collect-evidence] found ${inventory.length} JSON files`);

// Copy
copyFiles(inventory, STAGE);
if (NO_COPY) {
  console.log(`[collect-evidence] --no-copy: files NOT copied (hash-only manifest)`);
} else {
  console.log(`[collect-evidence] copied to files/${STAGE}/`);
}

// Write manifest (output dir already validated; mkdir is safe now)
mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
console.log(`[collect-evidence] manifest -> ${MANIFEST_PATH}`);

// Diff mode
if (DIFF_AGAINST && baselineManifest) {
  const diff = diffManifests(baselineManifest.files, inventory);

  const diffResult = {
    tool: 'collect-evidence.mjs',
    diffedAt: utcNow,
    baselineStage: DIFF_AGAINST,
    currentStage: STAGE,
    baselineGitHead: baselineManifest.environment?.gitHead ?? 'UNKNOWN',
    currentGitHead: manifest.environment.gitHead,
    runningCommit: 'UNKNOWN',
    baselineCollectedAt: baselineManifest.collectedAt ?? 'UNKNOWN',
    result: diff,
  };

  writeFileSync(DIFF_PATH, JSON.stringify(diffResult, null, 2) + '\n');
  console.log(`[collect-evidence] diff -> ${DIFF_PATH}`);
  console.log(`[collect-evidence]   added=${diff.added.length} contentModified=${diff.contentModified.length} touchOnly=${diff.touchOnly.length} deleted=${diff.deleted.length} unchanged=${diff.contentUnchangedCount}`);
  console.log(`[collect-evidence]   cancellationUnchanged=${diff.cancellationUnchanged}`);
}

console.log(`[collect-evidence] done.`);
