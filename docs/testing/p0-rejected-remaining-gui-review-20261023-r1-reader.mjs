import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool';
const prefix = 'docs/testing/p0-rejected-remaining-gui-review-20261023-r1';
const base = 'reports/all-pending-evidence-20261021';
const packet = `${base}/P0RejectedRemainingR1`;
const seen = {};
const errors = [];
const groups = {};
const mode = process.argv[2];
if (!/^(audit|seal)(-r[2-9])?$/.test(mode ?? '')) throw new Error('Invalid mode');

function read(relative) {
  const full = path.resolve(repo, relative);
  if (!full.startsWith(`${repo}/`)) throw new Error('Read outside repository');
  const bytes = fs.readFileSync(full);
  seen[relative] = digest(bytes);
  return bytes;
}
function digest(bytes) {
  return { bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
}
function json(relative) { return JSON.parse(read(relative)); }
function requireFact(ok, description) { if (!ok) throw new Error(description); }
function equal(a, b, description) { requireFact(isDeepStrictEqual(a, b), description); }
function group(name, fn) {
  try { groups[name] = fn(); }
  catch (error) { errors.push({ group: name, error: String(error) }); }
}
function walk(relative) {
  return fs.readdirSync(path.join(repo, relative), { withFileTypes: true }).flatMap(entry => {
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) return walk(child);
    requireFact(entry.isFile(), `Non-file input: ${child}`);
    return [child];
  }).sort();
}
function indexCheck(relative, indexName, nested) {
  const document = json(`${relative}/${indexName}`);
  const entries = nested ? document.files : document;
  for (const [name, expected] of Object.entries(entries)) {
    const actual = digest(read(`${relative}/${name}`));
    requireFact(actual.sha256 === expected.sha256, `SHA drift: ${relative}/${name}`);
    if (expected.bytes !== undefined) requireFact(actual.bytes === expected.bytes, `Size drift: ${name}`);
  }
  const indexed = Object.keys(entries).map(name => `${relative}/${name}`);
  equal(walk(relative), [...indexed, `${relative}/${indexName}`].sort(), 'Unindexed packet files');
  return { count: indexed.length, index: seen[`${relative}/${indexName}`], unindexed: [] };
}
function result(body) {
  requireFact(body.result?.ok === true, 'RPC result not ok');
  return body.result.value.result;
}
function plan(text) {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  requireFact(match, 'No JSON plan');
  return JSON.parse(match[1]).plan;
}

if (mode.startsWith('audit')) {
  group('inputProtection', () => {
    if (mode !== 'audit') read(`${prefix}-audit.json`);
    for (const name of [
      'AGENTS.md', 'docs/collaboration.md',
      'docs/testing/remaining-governance-cases-20261021.md',
      'docs/testing/op-growth-final-inheritance-20261022-r1.md',
      'docs/testing/p0-context-metric-gui-review-20261023-r1-report.md',
      'docs/testing/combined-successor114-regression-review-20261022-r1-report.md',
      'docs/testing/copilot-prefix114-gui-retest-20261022-r1-report.md',
    ]) read(name);
    const current = indexCheck(packet, 'index-r1.json', false);
    requireFact(current.count === 457, 'Expected 457 original files');
    const inherited = indexCheck(`${base}/Successor114GuiR1`, 'index-r1.json', true);
    requireFact(inherited.count === 166, 'Expected 166 deployment originals');
    return { current, inherited };
  });
  group('candidateBinding', () => {
    const binding = json(`${packet}/source-binding-close.json`);
    const source = json(`${base}/CombinedSuccessor114R1/source-files.json`);
    const complete = json(`${base}/CombinedSuccessor114R1/complete-inputs.json`);
    equal(binding.source, source, 'Archived 114 source declaration mismatch');
    requireFact(Object.keys(source.source).length === 114 && source.count === 114, 'Source count');
    requireFact(Object.keys(complete).length === 521 && binding.completeInputCount === 521, 'Input count');
    for (const [name, sha] of Object.entries(source.source)) {
      if (name.startsWith('packages/dsh-pm-tool/')) {
        requireFact(complete[name.slice('packages/dsh-pm-tool/'.length)]?.sha256 === sha, `Package input: ${name}`);
      }
    }
    const host = json(`${base}/Successor114GuiR1/host-start.json`);
    equal([binding.port, binding.pid, binding.gateway.port, binding.gateway.pid],
      [3264, 10975, 3261, 60386], 'Instance identity');
    equal([host.port, host.pid], [binding.port, binding.pid], 'Inherited deployment identity');
    requireFact(host.sourceSha256 === seen[`${base}/CombinedSuccessor114R1/source-files.json`].sha256,
      'Host source declaration SHA');
    requireFact(host.flags.DSH_PM_E2E === '0' && !binding.gateway.realExternalModel, 'Model/flags');
    return { baseline: source.baseline, sourceCount: 114, completeInputCount: 521,
      host, gateway: binding.gateway, privateRootsRead: false, currentMainSourceCompared: false };
  });
  let events;
  group('rpcAndFrames', () => {
    const eventNames = Object.keys(json(`${packet}/index-r1.json`))
      .filter(name => name.endsWith('-events.json'));
    events = eventNames.flatMap(name => {
      const doc = json(`${packet}/${name}`);
      for (const frame of doc.frames) {
        requireFact(digest(read(`${packet}/${frame.file}`)).sha256 === frame.sha256, `Frame ${frame.file}`);
      }
      return doc.rows.map(row => ({ ...row, eventFile: name }));
    });
    const requests = events.filter(row => row.type === 'request');
    const responses = events.filter(row => row.type === 'response');
    for (const row of requests) {
      const paired = responses.filter(other => other.body.rpcId === row.body.rpcId);
      requireFact(paired.length === 1 && paired[0].at >= row.at, `RPC pair ${row.body.rpcId}`);
    }
    requireFact(requests.length === responses.length, 'Unpaired response');
    const commandRequests = requests.filter(row => row.body.method === 'commands/execute');
    const commands = commandRequests.map(row => ({
      rpcId: row.body.rpcId, at: row.at, line: row.body.payload.args.line, eventFile: row.eventFile,
    }));
    requireFact(commands.filter(row => row.line.startsWith('/pm ask ')).length === 2, 'Ask count');
    requireFact(commands.filter(row => row.line.startsWith('/pm ask-apply ')).length === 1, 'Apply count');
    requireFact(!commands.some(row => row.line.startsWith('/pm ask-undo ')), 'Unexpected undo');
    requireFact(!commands.some(row => row.eventFile.startsWith('round01') && row.line.startsWith('/pm ask ')),
      'Ask before failed opener');
    return { pairs: requests.length, commands,
      frameReferences: eventNames.reduce((n, name) => n + json(`${packet}/${name}`).frames.length, 0) };
  });
  group('gatewayAndProposal', () => {
    requireFact(events, 'RPC group unavailable');
    const gateway = json(`${packet}/gateway-real-requests.json`);
    equal(gateway.map(row => row.sequence), [20, 21], 'Gateway sequences');
    const asks = events.filter(row => row.type === 'request'
      && row.body.payload?.args?.line?.startsWith('/pm ask ')).sort((a, b) => a.at.localeCompare(b.at));
    const linked = [];
    for (let i = 0; i < asks.length; i++) {
      const ask = asks[i];
      const response = events.find(row => row.type === 'response' && row.body.rpcId === ask.body.rpcId);
      const gatewayRow = gateway[i];
      requireFact(gatewayRow.path === '/v1/messages', 'Gateway route');
      requireFact(ask.at <= gatewayRow.at && gatewayRow.at <= response.at, 'Gateway timing');
      const line = ask.body.payload.args.line;
      const quoted = line.slice('/pm ask p-0001 '.length);
      const question = JSON.parse(quoted);
      requireFact(gatewayRow.body.messages[0].content[0].text.includes(question), 'Gateway question');
      equal(gatewayRow.fixture.text, result(response.body).text, 'Fixture / actual RPC response');
      const saved = json(`${packet}/${i === 0 ? 'round02' : 'round03'}-ask-response.json`);
      equal(saved.body, response.body, 'Saved ask response');
      linked.push({ rpcId: ask.body.rpcId, sequence: gatewayRow.sequence, at: gatewayRow.at,
        actions: plan(result(response.body).text).map(step => step.action) });
    }
    const first = linked[0].actions;
    requireFact(first.length === 8 && first.every(row => row.id === 't-0006'), 'First actions');
    equal(first.map(row => Object.keys(row.patch)[0]),
      ['evidenceUrl', 'repoUrl', 'description', 'branch', 'priority', 'manualProgress', 'checklist', 'dueDate'],
      'First patch keys');
    requireFact(first[0].patch.evidenceUrl === 'javascript:alert(1)' &&
      first[1].patch.repoUrl === 'javascript:alert(2)' &&
      first[2].patch.description.length === 2001 && first[3].patch.branch.length === 129 &&
      first[7].patch.dueDate === '2026-02-30', 'Invalid values');
    equal(linked[1].actions.map(row => row.patch), [{ branch: 'bad branch' }, { status: 'wrapped' }],
      'Second patches');
    const apply = events.find(row => row.type === 'request'
      && row.body.payload?.args?.line?.startsWith('/pm ask-apply '));
    const line = apply.body.payload.args.line;
    const payload = JSON.parse(line.slice('/pm ask-apply p-0001 '.length, line.indexOf(' --base ')));
    requireFact(payload.length === 1 && payload[0].id === 't-0006', 'Apply selection');
    equal(payload[0].patch, { branch: 'bad branch' }, 'Apply branch only; no wrapped');
    const outcome = result(json(`${packet}/round04-apply-response.json`).body);
    equal(outcome, result(events.find(row => row.type === 'response'
      && row.body.rpcId === apply.body.rpcId).body), 'Saved apply response');
    requireFact(outcome.kind === 'success' && outcome.text.startsWith('\u5df2\u5e94\u7528 0 \u6b65')
      && outcome.text.includes('\u672a\u6267\u884c 1 \u6b65')
      && outcome.text.includes('\u5206\u652f\u540d\u9700 \u226464'), 'Rejection outcome');
    return { linked, applyRpcId: apply.body.rpcId, outcome, businessApplied: 0, notExecuted: 1 };
  });
  group('rootsAndDatabase', () => {
    const index = json(`${packet}/index-r1.json`);
    const stateNames = Object.keys(index).filter(name => name.endsWith('-roots.json')).sort();
    const reference = json(`${packet}/round02-before-ask-roots.json`);
    const rawReference = 'round02-before-ask-raw';
    let payloads = 0;
    for (const stateName of stateNames) {
      const roots = json(`${packet}/${stateName}`);
      equal(roots, reference, `Saved root drift: ${stateName}`);
      const rawDirectory = stateName.replace('-roots.json', '-raw');
      for (const [name, expected] of Object.entries(roots)) {
        if (!name.startsWith('data/pmtool/')) continue;
        const bytes = read(`${packet}/${rawDirectory}/${name}`);
        equal(digest(bytes), expected, `Payload hash: ${stateName}/${name}`);
        requireFact(bytes.equals(read(`${packet}/${rawReference}/${name}`)), `Payload bytes: ${name}`);
        JSON.parse(bytes);
        payloads++;
      }
    }
    const taskEnvelope = json(`${packet}/${rawReference}/data/pmtool/tasks/t-0006.json`);
    requireFact(taskEnvelope.version === 2, 'Stored task envelope version');
    const task = taskEnvelope.record;
    requireFact(task.status === 'todo' && task.progress === 47
      && task.assignee === 'P1004\u5237\u65b0\u8d1f\u8d23\u4eba' && task.manualProgress === null,
    'Actual starting task fields');
    requireFact(!('branch' in task) && !('repoUrl' in task) && !('dueDate' in task), 'Starting absent keys');
    const snapshot = JSON.parse(result(json(`${packet}/round05-snapshot-command.json`).body).text);
    equal(snapshot.tasks.find(row => row.id === task.id), task, 'Final real snapshot task');
    return { states: stateNames, rootItems: Object.keys(reference).length,
      businessPayloadsVerifiedByteExact: payloads, task, taskBytes: reference['data/pmtool/tasks/t-0006.json'],
      settingsIncluded: true, filesBackups: 'Archived summaries equal; six payloads not in this packet',
      unobservedRoots: ['host sessions', 'profile', 'cache', 'formal data', 'whole disk'] };
  });
  group('domNotVisualVerdict', () => {
    const first = json(`${packet}/round02-rejected-visible.json`);
    requireFact(first.text.split('\n').filter(line => line.startsWith('\u5df2\u62d2\u7edd')).length === 8,
      'Eight DOM rejection lines');
    const execution = first.buttons.filter(button => /^\u6574\u6279\u6267\u884c|\u9010\u6b65\u6267\u884c/.test(button.text));
    requireFact(execution.length === 2 && execution.every(button => button.disabled), 'Zero disabled controls');
    const before = json(`${packet}/round04-before-confirm.json`);
    requireFact(before.text.includes('\u5df2\u62d2\u7edd') && before.text.includes('wrapped'), 'Wrapped DOM rejection');
    requireFact(before.fields.some(field => field.tag === 'INPUT' && field.checked), 'Selected step');
    requireFact(before.buttons.some(button => button.text === '\u6574\u6279\u6267\u884c\uff081\uff09'
      && !button.disabled), 'Explicit confirm control');
    const after = json(`${packet}/round04-final-schema-rejection.json`);
    requireFact(after.text.includes('\u6682\u65e0\u8349\u7a3f'), 'Draft cleared');
    const feedback = json(`${packet}/round05-visible-feedback.json`);
    const text = feedback.visible.map(row => row.text).join('\n');
    requireFact(text.includes('\u5df2\u5e94\u7528 0 \u6b65') && text.includes('\u672a\u6267\u884c 1 \u6b65')
      && text.includes('\u5206\u652f\u540d\u9700 \u226464'), 'Reason exists in DOM');
    const round01 = json(`${packet}/round01-error.json`);
    const round03 = json(`${packet}/round03-error.json`);
    requireFact(round01.error.includes('5000ms') && round03.error.includes('\u8349\u7a3f\u5f85\u786e\u8ba4'),
      'Original collection errors retained');
    return { earlyRows: 8, controlsDisabled: true, wrappedDom: true, draftCleared: true,
      reasonInDom: true, reasonChildBBoxSaved: false, visualVerdict: 'REQUIRES_INDEPENDENT_VIEW_IMAGE',
      originalErrors: [round01.error, round03.error] };
  });
} else {
  group('sealedInputs', () => {
    const audit = json(`${prefix}-audit-r2.json`);
    const drift = [];
    for (const [name, expected] of Object.entries(audit.inputs)) {
      if (!isDeepStrictEqual(digest(read(name)), expected)) drift.push(name);
    }
    equal(drift, [], 'Protected input drift');
    indexCheck(packet, 'index-r1.json', false);
    const ownFiles = fs.readdirSync(path.join(repo, 'docs/testing'), { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.startsWith(path.basename(prefix)));
    for (const entry of ownFiles) read(`docs/testing/${entry.name}`);
    const report = read(`${prefix}-report.md`).toString();
    const missing = [...report.matchAll(/\]\(([^)]+)\)/g)]
      .map(match => match[1]).filter(url => !url.includes('://'))
      .filter(url => !fs.existsSync(path.resolve(repo, 'docs/testing', url.split('#')[0])));
    equal(missing, [], 'Missing report links');
    requireFact(!/[ \t]+$/m.test(report), 'Trailing whitespace');
    return { protectedCount: Object.keys(audit.inputs).length, drift: [], linksMissing: [] };
  });
}

const output = { at: new Date().toISOString(), role: 'independent-read-only-review',
  mode, runtime: process.version, groups, errors, inputs: seen,
  productExecuted: false, guiExecuted: false, privateRootsRead: false };
fs.writeFileSync(path.join(repo, `${prefix}-${mode}.json`), `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ mode, groups: Object.keys(groups), errors, inputCount: Object.keys(seen).length }));
process.exitCode = errors.length ? 1 : 0;
