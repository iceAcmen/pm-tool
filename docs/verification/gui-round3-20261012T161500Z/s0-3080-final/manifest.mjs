#!/usr/bin/env node
// Read-only manifest generator for S0 final verification.
// Records relpath + sha256 + size + mtimeMs for every file under the formal
// data/ and packages/backups/ roots. NEVER copies file contents into evidence.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool';
const roots = ['data', 'packages/backups'];

function walk(rel) {
  const abs = path.join(repo, rel);
  const out = [];
  if (!fs.existsSync(abs)) return out;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const childRel = path.join(rel, ent.name);
    const childAbs = path.join(repo, childRel);
    if (ent.isDirectory()) out.push(...walk(childRel));
    else if (ent.isFile()) {
      const st = fs.statSync(childAbs);
      const h = crypto.createHash('sha256');
      h.update(fs.readFileSync(childAbs));
      out.push({
        path: childRel,
        sha256: h.digest('hex'),
        size: st.size,
        mtimeMs: Math.round(st.mtimeMs * 1000) / 1000,
      });
    }
  }
  return out;
}

const entries = roots.flatMap(walk).sort((a, b) => a.path.localeCompare(b.path));
const summary = {
  generatedAtIso: new Date().toISOString(),
  repo,
  roots,
  packagesBackupSingularExists: fs.existsSync(path.join(repo, 'packages/backup')),
  counts: { total: entries.length },
  entries,
};
process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
