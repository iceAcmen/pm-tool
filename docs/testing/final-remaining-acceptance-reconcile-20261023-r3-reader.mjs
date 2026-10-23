import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const root = '/Users/bytedance/Projects/dsh-pm/pm-tool';
const prefix = 'docs/testing/final-remaining-acceptance-reconcile-20261023-r3';
const frozen = 'reports/all-pending-evidence-20261021/CombinedF02RepairR2/';
const mode = process.argv[2];
const outputRevision = mode === 'generate' ? '' : mode.startsWith('generate-') ? mode.slice(8) : '-r3';
const inputs = new Map();
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
const fingerprint = (p) => {
  const b = fs.readFileSync(path.join(root, p));
  return { path: p, bytes: b.length, sha256: hash(b) };
};
function read(p) {
  assert(!p.startsWith('/') && !p.split('/').includes('..'));
  assert(p.startsWith('docs/') || p.startsWith('reports/') || p === 'AGENTS.md'
    || ['packages/dsh-pm-tool/src/client/views/gantt.tsx',
      'packages/dsh-pm-tool/src/client/views/records/records-listbox.tsx'].includes(p));
  assert(!p.split('/').some((x) => ['runtime', 'private', 'profile', 'node_modules', 'data'].includes(x)));
  const b = fs.readFileSync(path.join(root, p));
  inputs.set(p, { path: p, bytes: b.length, sha256: hash(b) });
  return b.toString('utf8');
}
const json = (p) => JSON.parse(read(p));
function write(suffix, value) {
  const p = prefix + suffix;
  assert(path.dirname(p) === 'docs/testing');
  fs.writeFileSync(path.join(root, p),
    typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n',
    { flag: 'wx' });
}
function stable(list) {
  return list.filter((x) => {
    const actual = fingerprint(x.path);
    return actual.sha256 !== x.sha256 || actual.bytes !== x.bytes;
  }).map((x) => ({ before: x, after: fingerprint(x.path) }));
}
const relative = (p) => path.relative('docs/testing', p);
const md = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
const unique = (a) => [...new Set(a)];
function originalRows(row) {
  return (row.originalContracts ?? []).map((c) => ({
    ...c, originalRowText: read(c.path).split('\n')[c.line - 1],
  }));
}
function parseHashes(text) {
  return Object.fromEntries(text.trim().split('\n').map((line) => {
    const m = line.match(/^([a-f0-9]{64})\s+(.+)$/);
    assert(m, 'invalid declared SHA row');
    return [m[2], m[1]];
  }));
}
const plainSource = (p) => p.startsWith('packages/dsh-pm-tool/')
  ? p.slice('packages/dsh-pm-tool/'.length) : p;
function compareMaps(before, after) {
  const same = [], changed = [], missing = [], added = [];
  for (const [p, v] of Object.entries(before)) {
    if (!(p in after)) missing.push(p);
    else if (v === after[p]) same.push(p);
    else changed.push({ path: p, before: v, after: after[p] });
  }
  for (const p of Object.keys(after)) if (!(p in before)) added.push(p);
  return { beforeCount: Object.keys(before).length, afterCount: Object.keys(after).length,
    same, changed, missing, added };
}

const routeRefs = {
  dash: ['OPR1', 'OPR2', 'FINAL22'], overview: ['P1H', 'P1REST', 'OPR1', 'OPR2'],
  tasks: ['P1004', 'PDISPLAY', 'POUT', 'PREDECESSOR', 'J03', 'MRR', 'FEEDBACK'],
  gantt: ['OPR1', 'OPR2', 'L8', 'L8PLAN'], milestones: ['L2OLD', 'L2'],
  'risk-issues': ['MRR'], people: ['P1H', 'OPR1'],
  meetings: ['MRR'], reports: ['MRR', 'EXPORT'],
  deliverables: ['L2OLD', 'F02'], okrs: ['POKR', 'KR', 'PDISPLAY'],
  habits: ['POKR', 'P3004', 'F7'],
};
const layerRelated = {
  'RA-DR-01': ['RA-AI04'], 'RA-DR-02': ['RA-AI04'], 'RA-DR-03': ['RA-AI04'],
  'RA-DR-05': ['RA-P1005'], 'RA-DR-06': ['RA-P1005'], 'RA-DR-07': ['RA-P1005'],
  'RA-DR-08': ['RA-J02'], 'RA-DR-09': ['RA-J02'], 'RA-DR-10': ['RA-J02'],
  'RA-DR-11': ['RA-P1005'], 'RA-DR-12': ['RA-R01'],
  'RA-DR-13': ['RA-R04', 'RA-R05'], 'RA-DR-14': ['RA-R04', 'RA-R05'],
  'RA-DR-17': ['RA-P3004'], 'RA-DR-18': ['RA-P3004'],
  'RA-DR-19': ['RA-P3001', 'RA-P3004'], 'RA-DR-20': ['RA-P3004'],
  'RA-DR-21': ['RA-TOOL03'], 'RA-DR-22': ['RA-P1006'],
  'RA-DR-23': ['RA-P2004'], 'RA-DR-24': ['RA-P2004'],
  'RA-DR-25': ['RA-P2003'], 'RA-DR-26': ['RA-P2004'],
  'RA-DR-34': ['RA-M01', 'RA-OP04'], 'RA-DR-35': ['RA-M01', 'RA-J03', 'RA-OP04'],
  'RA-DR-36': ['RA-J02'], 'RA-DR-37': ['RA-J03'],
  'RA-DR-38': ['RA-J03', 'RA-TOOL04'], 'RA-DR-39': ['RA-P1006'],
  'RA-DR-40': ['RA-TOOL03'], 'RA-DR-42': ['RA-P2005'],
  'RA-MENU-09': ['RA-J02'], 'RA-MENU-10': ['RA-J02'],
  'RA-MENU-11': ['RA-J02'], 'RA-MENU-12': ['RA-J02'],
  'RA-MENU-15': ['RA-P1005'], 'RA-MENU-16': ['RA-U401', 'RA-P2002'],
  'RA-MENU-18': ['RA-U401', 'RA-U402'], 'RA-MENU-19': ['RA-P1001', 'RA-P1002'],
  'RA-MENU-20': ['RA-R05'], 'RA-MENU-23': ['RA-P1005'],
  'RA-MENU-30': ['RA-P1004', 'RA-P0001'], 'RA-MENU-31': ['RA-AI04'],
  'RA-MENU-32': ['RA-AI05', 'RA-AI06'], 'RA-MENU-33': ['RA-AI05'],
  'RA-MENU-36': ['RA-U401', 'RA-U402'], 'RA-MENU-37': ['RA-P2001', 'RA-P2002'],
  'RA-MENU-38': ['RA-U401', 'RA-U402'],
};
const layerRemaining = {
  'RA-DR-08': '先建会议主save→编辑同ID→action显式save；已签创建/转换不重做；补决策/合法issue等原未签字段、菜单/键盘与重开映射。',
  'RA-DR-19': 'GM01建议自身目标行已闭，不再派修；只补本层剩余键盘/实际入口/候选映射，不扩整习惯页。',
  'RA-DR-25': '同项目confirm/ignore/clear及异项目动态反例指定片已签；只核该层真实入口/键盘/浅态/原时间段继承，不重收件守卫。',
  'RA-MENU-18': 'U4已整项有限PASS；只整理原opener/控件/ESC归焦/时间段与当前继承，不重命名/default/A-B/reload。',
  'RA-MENU-36': 'U4命名/default/四列原段先映；fresh cancel及原未明示query/chip/group组合先找原件，仅欠原段补采，不重排序或列持久。',
  'RA-MENU-38': 'U4两规则/方向/换序及旧四sort已签；只补实际菜单/原时间/最终接缝继承，不重U4。',
  'RA-MENU-30': '有无材料context原ask只读片已闭；原P1004 ask卡nativeTab→opener对象连续性仍BLOCKED，恢复处理卡不能替代；只补原对象/读出口映射。',
};
const aliasLinks = {
  'D-08': ['RA-J02'], 'D-11': ['RA-D11'], 'D-12': ['RA-D12', 'RA-P2004'],
  'B1-GUI-01': ['D-01'], 'BA-DEF-03': ['D-09'],
  'BA-COPY-01': ['D-09'], 'BA-COPY-02': ['D-09'],
  'OP-CK-06': ['RA-OP01'], 'OP-RU-01': ['RA-OP01'],
  'OP-SRC-02': ['RA-OP01'], 'OP-SRC-04': ['RA-R03'],
  'OP-SRC-06': ['RA-OP01', 'RA-OP03'],
  'OP-GUI-01': ['RA-OP01', 'RA-OP02', 'RA-OP03', 'RA-OP04', 'OP-SRC-05'],
  'OP-DEFER-01': ['RA-OP01', 'RA-OP02'],
  'OP-DEFER-02': ['RA-OP04'], 'OP-DEFER-03': ['RA-OP04'],
  'OP-DEFER-04': ['RA-OP05'], 'PC-G01': ['RA-AI04'],
  'PC-G02': ['RA-AI04'], 'PC-G03': ['RA-AI04'],
};
const aliasRemaining = {
  B2: 'M01一次组合及重开可见已签，不重；仅M02错误全文/原修正路径、M03候选排除/重复拒、M04既有更新最新、M06坏alias合法入口、M07双读/出口及层映射剩段。',
  B3: '原安全AUTO/StrictDOM、真实同hash上传下载、非空UI恢复/新PID、一次中途回滚已签；只原生chooser cancel缺段、host迟201/取消、共享直接UI适用范围、空目标/完整读出口映射和其他原F07未签断言，不重上述链。',
  B5: '甘特点按实际阈值/详情/焦点、里程碑原四态/日期与风险320专项、人员F1FL/MAX；L8仅原T01–T04后继修复/回归，不能以小尺度people或单L2事件代整规划。',
  B6: '会议创建/稳定action/转换/issue指定片与固定refs/安全preview/MD摘录已签；只J02补ms/dlv双向返回与非法保稿、原报告详情/MDupdate来源保全/层菜单/长内容/native200剩段。',
  B7: 'GM01/HC01/A20、P0context/capture/metric、P1history/rest、KR/display/K16/F7及AI再生成base/四create指定片已签；只原AI拒因/句柄取消/真实模型、P1004原ask对象、F1FL/MAX、L8后继及原成长完整J05/错误呈现/层矩阵，不重已签切片。',
  B8: '全父适用ID/原1184格/81层/16卡/320/VoiceOver/现有e2e与最终逐域继承总出口仍未签。当前Combined回归1707/41/7/95有限已签，不无理由重跑；新L8产品变化只按其原合同重认领受影响候选/必要回归，不全废历史。',
  'OP-CK-06': '两Space及四consumer数值/报告66指定片已签，不重toggle；原即时失败恢复若无签字只按原出口补映，AUTO当前继承另核。',
  'OP-RU-01': '等权/最终一次round/父63及报告66原AUTO和指定GUI已签；只做当前派生接缝继承，不重人工30/0。',
  'OP-SRC-02': '报告66完整读出口已签；原null/旧0只补尚缺的原实际可读标签或继承，不把66外推全部变体。',
  'OP-SRC-06': '人工30/0报告66及其他已签consumer不重；仅原尚缺完整fixture的即时/coverage/pending标签和L8原FAIL按T01–T04处理。',
  'OP-GUI-01': '已签报告66/无清单clear/甘特40-null-70/完成日期/工时保稿等不重复；原其余精确比例标签与即时失败恢复、effort既有export、L8原FAIL分别按关联ID余段处理。',
  'OP-DEFER-01': 'ADL055人工双轨已实现，RA-OP01/02原余片闭；只继承，不恢复为N/A，不重清除/报告。',
  'OP-DEFER-02': 'RA-OP04合法保存/重开和负例已签；仅既有export余段，不新增effort权重。',
  'OP-DEFER-03': 'RA-OP04 evidence合法/非法保稿已签；仅既有export余段，不新增Git同步。',
  'OP-DEFER-04': 'task completedDate原只读/合法纠正/revert已签；只继承；item doneAt仍后置，不补旧值。',
  'PC-G01': '原三路径/四update及本子项无重复GUI动作；只做当前sidecar/panel候选接缝继承。',
  'PC-G02': '原freshundo指定片已签，不重撤销；当前继承及AI04其余句柄生命周期分开，不能把新reload当旧Promise。',
  'PC-G03': '原逐kind成功指定片已签，不重update；只继承，不把kindsuccess扩成所有前置已应用。',
};

function generate() {
  const review = json(prefix + '-review-data.json');
  const old = json('docs/testing/remaining-acceptance-delta-20261022-index-r2.json');
  const b8 = json('docs/testing/b8-existing-evidence-mapping-20261022-r1.json');
  const inheritance = json('docs/testing/op-growth-final-inheritance-20261022-r1-audit-r2.json');
  read('AGENTS.md');
  read('docs/collaboration.md');
  review.scopeChain.forEach(read);
  ['docs/testing/remaining-objective-cases-20261021.md',
    'docs/testing/remaining-governance-cases-20261021.md',
    'docs/testing/remaining-journey-cases-20261021.md',
    'docs/testing/remaining-layer-map-20261021.md'].forEach(read);
  Object.values(review.catalog).forEach(([p]) => read(p));
  const l8Seal = json('docs/testing/l8-gantt-refresh-defect-20261023-r3-seal.json');
  const l8Readback = json('docs/testing/l8-gantt-refresh-defect-20261023-r3-readback.json');
  const l8Receipt = json('docs/testing/l8-gantt-refresh-defect-20261023-r3-readback-receipt.json');
  assert(l8Readback.released && l8Readback.mismatches.length === 0);
  assert.equal(l8Receipt.exitCode, 0);
  assert(l8Receipt.outputComplete);
  assert.equal(fingerprint('docs/testing/l8-gantt-refresh-defect-20261023-r3-seal.json').sha256,
    l8Readback.seal.sha256);
  const treeReadback = json('docs/testing/p2002-tree-gui-review-20261023-r3-readback.json');
  const treeReceipt = json('docs/testing/p2002-tree-gui-review-20261023-r3-readback-tool-receipt.json');
  read('docs/testing/p2002-tree-gui-review-20261023-r3-seal.json');
  read('docs/testing/p2002-tree-gui-review-20261023-r3-seal-tool-receipt.json');
  assert.equal(treeReceipt.actualToolExitCode, 0);
  assert.equal(treeReadback.original708Unchanged, true);
  assert.deepEqual(treeReadback.drift, []);
  assert.equal(treeReadback.sealSha256,
    fingerprint('docs/testing/p2002-tree-gui-review-20261023-r3-seal.json').sha256);
  if (mode !== 'generate') {
    read(prefix + '-generate-audit.json');
    if (mode === 'generate-r3') read(prefix + '-generate-audit-r2.json');
  }
  const candidate = json(frozen + 'candidate.json');
  const source = json(frozen + 'source-files.json');
  const complete = json(frozen + 'complete-inputs.json');
  const delta = json(frozen + 'parent-six-to-current-inputs.json');
  read(frozen + 'index-r2.json');
  read(frozen + 'seal-r2.json');
  const six = json('reports/all-pending-evidence-20261021/CombinedSixRepairsR1/source-files.json');
  const old102 = {
    ...parseHashes(read('reports/all-pending-evidence-20261021/A20V3/source-files.sha256')),
    ...parseHashes(read('reports/all-pending-evidence-20261021/U4/increment-files.sha256')),
  };
  assert.equal(Object.keys(old102).length, 102);
  assert.equal(Object.keys(source.source).length, 124);
  assert.equal(Object.keys(complete).length, 525);
  assert.equal(candidate.baseline, review.baselineDeclared);
  assert.equal(delta.delta.length, 2);
  const oldToCurrent = compareMaps(old102, source.source);
  const sixToCurrent = compareMaps(six.source, source.source);
  const narrowCurrent = [
    'packages/dsh-pm-tool/src/client/views/gantt.tsx',
    'packages/dsh-pm-tool/src/client/views/records/records-listbox.tsx',
  ].map((p) => {
    read(p);
    const actual = inputs.get(p);
    const declared = complete[plainSource(p)];
    return { ...actual, declared, sameAsCombined: actual.sha256 === declared.sha256
      && actual.bytes === declared.bytes };
  });
  const updates = new Map();
  for (const u of review.updates) for (const id of u.ids) {
    assert(!updates.has(id), 'duplicate reviewed ID');
    updates.set(id, u);
  }
  const layerMap = new Map(b8.layers.map((x) => [x.id, x]));
  const widgetMap = new Map(b8.widgets.map((x) => [x.id, x]));
  const specialMap = new Map(b8.specials.map((x) => [x.id, x]));
  const opMap = new Map([...inheritance.originalIdMap.op,
    ...inheritance.originalIdMap.growth].map((x) => [x.id, x]));
  const catalogRef = (key) => {
    const [p, section, candidateScope] = review.catalog[key];
    return { key, path: p, section, candidateScope };
  };
  const catalogRefs = (keys) => unique(keys).map(catalogRef);
  function dependencyImpact(domain, id) {
    let patterns;
    if (domain.includes('board')) patterns = ['src/client/board', 'src/client/panel', '.css'];
    else if (domain.includes('gantt')) patterns = ['src/client/views/gantt', 'progress-derivation'];
    else if (domain.includes('launcher')) patterns = ['launcher/'];
    else if (domain.includes('report') || domain.includes('record')) patterns = ['report', 'records/', 'material', 'panel'];
    else if (domain.includes('habit')) patterns = ['habit', 'okrs', 'panel', '.css'];
    else if (domain.includes('okr')) patterns = ['okrs', 'panel', '.css'];
    else if (domain.includes('model') || domain.includes('copilot') || domain.includes('ai-')) patterns = ['ai-', 'copilot', 'result-card', 'panel', 'feedback', '.css'];
    else if (domain.includes('queue') || domain.includes('people')) patterns = ['queue', 'people', 'panel', '.css'];
    else if (domain.includes('op-domain')) patterns = ['src/core/task', 'progress', 'commands/task'];
    else patterns = ['panel', 'tasks', 'feedback', 'task-form', '.css'];
    return {
      candidate: 'CombinedF02RepairR2/124/525',
      comparedBoundary: 'A20V3+U4旧102声明SHA→当前124声明SHA；只列可能接缝，不把文件匹配当PASS或完整依赖图',
      possibleChangedSeams: oldToCurrent.changed.filter((x) => patterns.some((s) => x.path.includes(s))),
      addedDeclaredSeamsNotAllNewFiles: oldToCurrent.added.filter((p) => patterns.some((s) => p.includes(s))),
      latestSixDelta: sixToCurrent.changed.filter(() => id === 'RA-P1005'
        || domain.includes('deliverable') || domain.includes('records')),
      rule: '优先保持未变原签断言；改变的具体接缝由新SOURCE/AUTO/GUI限定报告替接。无原签不能因未变直接PASS；新甘特修复只重认领L8显示/条aria及原受影响回归，不全重开历史门。',
      stillMissing: '逐原断言→原证对象/时段→来源候选→当前接缝理由/新签字的总映射；124/525、HEAD/version或bundle存在均不能代替。',
    };
  }
  function evidenceMinimum(row, layer, widget, special) {
    if (special) return special.minimumRemaining;
    if (layer) return `${layer.fixture}；${layer.action}；${layer.commonRemaining}。只核原未签段。`;
    if (widget) return `${widget.minimumRemaining}；${widget.kindSpecificOriginalRemaining}。已有公共save/reload指原同段，不重复整链。`;
    if (row.affectedDomain === 'out-of-scope') return '保原N/A/后置依据，不采产品、不写PASS。';
    if (row.affectedDomain === 'tools') return '原同条件观察的版本/候选/冷1热2起末、失败与恢复；不可用具体BLOCKED，不阻产品主线。';
    return '先交本ID原报告指针中的实际对象/动作时间段与独立签字；未签原写行为才补请求/返回及原字段前后保全/重开；未签原呈现才补同视口/主题/原生档位实际可读图或音频、焦点/滚动原件。仅原AUTO门不用GUI替接，旧缺档不追造。';
  }
  const entries = old.ledger.map((row) => {
    const u = updates.get(row.id), layer = layerMap.get(row.id),
      widget = widgetMap.get(row.id), special = specialMap.get(row.id);
    const linkedIds = unique([...(layerRelated[row.id] ?? []), ...(aliasLinks[row.id] ?? [])]);
    const linked = linkedIds.map((id) => updates.get(id)).filter(Boolean);
    let remaining = u ? [...u.remaining] : [row.remainingRequiredByExistingContract];
    let priority = u?.priority ?? 6;
    let status = u ? (u.remaining.length ? 'ORIGINAL_REMAINDER_OPEN' : 'SIGNED_SLICE_CLOSED_INHERITANCE_PENDING')
      : 'ORIGINAL_REMAINDER_OR_INHERITANCE_OPEN';
    if (layer) {
      remaining = [layerRemaining[row.id] ?? layer.minimumRemaining, layer.commonRemaining];
      priority = 7;
      status = 'PARTIAL_LAYER_MAPPING_NOT_FULL_PASS';
    }
    if (widget) {
      remaining = [widget.minimumRemaining, widget.kindSpecificOriginalRemaining];
      priority = 7;
      status = 'PARTIAL_WIDGET_MAPPING_NOT_FULL_PASS';
    }
    if (special) { remaining = [special.minimumRemaining]; priority = 8; }
    if (aliasRemaining[row.id]) remaining = [aliasRemaining[row.id]];
    if (row.affectedDomain === 'op-domain' && !u) {
      status = 'HISTORICAL_AUTO_INHERITANCE_PENDING_NO_NEW_GUI';
      priority = 9;
    }
    if (row.id === 'OP-BD-06') {
      remaining = ['当前CombinedF02RepairR2完整SOURCE/AUTO已独立有限签1707/41/7/95及guard/close，不重跑已绿产品测试；只绑定原结果/警告/保护范围与最终继承。若L8等产品后变，由Main按原合同重认领受影响候选和必要回归。'];
      priority = 9; status = 'SIGNED_COMBINED_AUTO_BINDING_PENDING';
    }
    if (row.id === 'OP-BD-05') {
      remaining = ['当前组合guard/close限定五缺根与声明输入保护已签；只继承原范围/真实exit及警告，不读正式根、不说全机零污染、不无理由重跑。'];
      priority = 9;
    }
    if (row.affectedDomain === 'out-of-scope') {
      status = 'ORIGINAL_NOT_APPLICABLE_DEFERRED_NOT_PASS'; priority = 11;
    }
    if (row.id === 'RA-CI01') { remaining = []; status = 'HISTORICAL_CI_CORE_REUSE_NOT_DIRTY_REMOTE_PASS'; }
    if (row.id === 'RA-P1004') status = 'ORIGINAL_ASK_OBJECT_INHERITANCE_BLOCKED';
    if (row.id === 'RA-P2002') status = 'SIGNED_TREE_SLICE_IMMEDIATE_REFRESH_VISUAL_BLOCKED';
    if (['RA-OP03', 'RA-P2005', 'OP-SRC-06'].includes(row.id)) {
      status = 'L8_ORIGINAL_EXPERT_FAIL_LIMITED_NEXT_REPAIR';
      if (row.id === 'OP-SRC-06') priority = 1;
    }
    const ownRefs = u?.refs ?? [];
    const extraRefs = unique(linked.flatMap((x) => x.refs));
    if (opMap.has(row.id)) extraRefs.push('INHERIT');
    if (layer || widget || special) extraRefs.push('B8MAP');
    const declarations = originalRows(row);
    return {
      id: row.id, kind: layer ? 'layer' : widget ? 'widget' : special ? 'special' : 'ledger',
      priority, currentReconcileStatus: status,
      originalLedgerPreserved: row, originalContractRowsPreserved: declarations,
      originalAction: layer?.action ?? (declarations.map((x) => x.originalRowText).join('\n')
        || row.remainingRequiredByExistingContract),
      originalLocator: declarations.length ? declarations.map((x) => ({
        path: x.path, line: x.line, section: '原表对应ID行',
      })) : [{ ...row.ledger, section: '逐ID台账原行；D/批次域另按总登记§5' }],
      historicalAssertionMapPreserved: opMap.get(row.id) ?? null,
      historicalEvidenceBoundary: row.sourceAndCandidateBoundary,
      currentLimitedSignatures: catalogRefs([...ownRefs, ...extraRefs]),
      signedSliceAbsorbed: u?.signed ?? null,
      linkedIdsDoNotCloseThisId: linkedIds,
      linkedSignedSlices: linked.map((x) => ({ ids: x.ids, signed: x.signed,
        remaining: x.remaining, rule: '仅供分段映射，不扩为本整层/整卡PASS' })),
      b8PreviousMappingPreserved: layer ?? widget ?? special ?? null,
      remainingOriginalActions: remaining,
      minimumEvidence: evidenceMinimum(row, layer, widget, special),
      admission: layer?.clarificationRefs?.length
        ? b8.clarifications.filter((x) => layer.clarificationRefs.includes(x.id)).map((x) => x.action)
        : ['沿原合法fixture/已批准入口与实际对象；既有原件先映，缺口才采；同候选/实例/开关/实际环境可对应；不造新oracle或手改schema成功种子。'],
      executionOwner: 'Main唯一builder/GUI/桌面；原独立专家审证/继承判定，Main不自PASS',
      ownerOnlyCondition: review.necessaryOwner.rule,
      confirmedManualPending: false,
      candidateInheritanceImpact: dependencyImpact(row.affectedDomain, row.id),
      wholeIdPassByThisReport: false,
    };
  });
  const matrix = b8.matrix.map((row) => ({
    id: row.id, kind: 'matrix', priority: row.nativeZoomPercent === 200 ? 7 : 8,
    currentReconcileStatus: 'FULL_CELL_NOT_SIGNED_MAP_EXISTING_SEGMENTS_FIRST',
    originalMatrixPreserved: row,
    originalAction: row.existingContractActionAndFixture,
    originalLocator: [{ ...row.originalContract, section: '原journey§6.1对应route行和共同预期' }],
    currentLimitedSignatures: catalogRefs(routeRefs[row.route]),
    supplementalReportsOnlyNotNewExactSegment: true,
    remainingOriginalActions: row.minimumRemaining,
    routeSharedOriginalRemainder: row.routeSharedRemainderNotRepeatedPerCell,
    minimumEvidence: `本格原tuple=${row.route}/${row.widthBeforeNativeZoom}×900/${row.theme}/native${row.nativeZoomPercent}/${row.state}；原格状态对应合法fixture与未签动作。浏览器原生菜单档位及缩放后真实inner/宿主PM容器、实际对象/起末、可读图/焦点/滚动和原写/取消/恢复保全；不能重命名同一截图充格，先映原签片段。`,
    admission: ['原生200不是DPR或CSS缩放；不拉大窗口抵消；缺物理能力/合法fixture记具体BLOCKED。592个200格只是原登记维度，不新造组件矩阵。'],
    executionOwner: 'Main；原独立B8专家审证，不重复在途派单',
    ownerOnlyCondition: review.necessaryOwner.rule, confirmedManualPending: false,
    candidateInheritanceImpact: dependencyImpact(row.affectedDomain, row.id),
    wholeIdPassByThisReport: false,
  }));
  const all = [...entries, ...matrix].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id, 'en'));
  assert.equal(all.length, 1489);
  assert.equal(new Set(all.map((x) => x.id)).size, 1489);
  for (const id of updates.keys()) assert(all.some((x) => x.id === id), `unknown update ${id}`);
  const oldSet = [...old.ledger, ...old.matrix].map((x) => x.id).sort();
  assert.deepEqual(all.map((x) => x.id).sort(), oldSet);
  for (const row of entries) assert.deepEqual(row.originalLedgerPreserved,
    old.ledger.find((x) => x.id === row.id));
  const laneCounts = {};
  all.forEach((x) => { laneCounts[x.priority] = (laneCounts[x.priority] ?? 0) + 1; });
  const data = {
    schema: 'pmtool-full-parent-final-reconcile-r3-v1',
    generatedAt: new Date().toISOString(), role: review.role,
    parentGoalVerbatim: review.parentGoal, authority: '本限单替通用fetch/build/livingdocs/Git；只读原件；唯一新写本前缀。',
    parentPass: false, commitAdmission: false, newProductPassCount: 0,
    countMeaning: '305普通台账索引=252原普通合同ID+53补充/汇总标签；另1184原格。1489是索引键，不是功能数/剩余新采次数/通过率。',
    counts: { ledger: 305, originalOrdinary: 252, supplementalLabels: 53,
      matrix: 1184, layers: 81, widgets: 16, specials: 3,
      allUnique: 1489, native200: matrix.filter((x) => x.originalMatrixPreserved.nativeZoomPercent === 200).length,
      width390: matrix.filter((x) => x.originalMatrixPreserved.widthBeforeNativeZoom === 390).length,
      historicalPartialMatrixCells: b8.matrix.filter((x) => x.segmentRefs.length).length,
      newFullCellPass: 0, newWholeIdPass: 0, laneCounts },
    scopeChain: review.scopeChain,
    candidate: { ...candidate, sourceManifest: frozen + 'source-files.json',
      completeManifest: frozen + 'complete-inputs.json',
      independentReport: review.catalog.COMBINED, parentSixDeclaredDelta: delta,
      narrowCurrentBytes: narrowCurrent,
      notPhysicallyReadThisRole: '525主输入/运行副本/1816原件/全依赖/宿主未枚举或重核；继承原组合专家有限结论。仅当前明列gantt/listbox字节另核。',
    },
    inheritanceComparisons: {
      old102ToCombined124DeclaredSha: oldToCurrent,
      six124ToCombined124DeclaredSha: sixToCurrent,
      interpretation: '这是明确SHA清单的机械对账，不是全面源码依赖审计。逐ID的possibleChangedSeams只用于原专家接缝映射；未变化不替未验动作，变化不无理由全重开。',
    },
    originalFailureAndBlockedHistory: '每条original*原文保留。新报告只定向补签；原FAIL/BLOCKED/NOT_RUN/SKIP/outer1/缺档/警告不会被改写。',
    inFlightAndLatestTermination: review.inFlight,
    l8TerminationRead: { report: review.catalog.L8, plan: review.catalog.L8PLAN,
      seal: fingerprint('docs/testing/l8-gantt-refresh-defect-20261023-r3-seal.json'),
      readback: l8Readback, actualReadbackReceipt: l8Receipt,
      originalExpertConclusion: 'FAIL_LIMITED_DISPLAY_SEMANTICS；字形BLOCKED；有排期aria NOT_RUN；已released，仅后继T01–T04待Main。',
      sealDeclaredKeys: Object.keys(l8Seal) },
    treeTerminationRead: { report: review.catalog.PTREE, readback: treeReadback,
      actualReadbackReceipt: treeReceipt,
      boundary: '继承原专家主体树有限PASS；仅refresh当态三行视口图BLOCKED；不是本角色新GUI裁定。' },
    confirmedManualPending: [], necessaryOwner: review.necessaryOwner,
    reviewUpdates: review.updates, catalog: review.catalog,
    clarificationsPreserved: b8.clarifications,
    historicalB8SegmentsPreserved: b8.segments,
    historicalB8NonExactEvidencePreserved: b8.nonExactEvidence,
    orderedEntries: all,
    inputs: [...inputs.values()],
    prohibitedExecution: { product: 0, tests: 0, mainScripts: 0,
      git: 0, browser: 0, network: 0, runtimePrivateProfileFormalDataReads: 0 },
  };
  assert.equal(stable(data.inputs).length, 0, 'inputs drifted while reconciling');
  write('-table' + outputRevision + '.json', data);
  const lines = [
    '# 全父逐 ID 有序余项与继承附表 R3', '',
    '> 从属主报告；不是新用例/总PASS。每行只列原余件或继承动作。全1184格逐ID及其原tuple在table.json，不缩父范围。305行含252原普通合同ID及53汇总/补充标签，不能相加为新功能分母。', '',
    '优先顺序数字是执行归并顺序，不是严重度或豁免。F1FL定位仍在途，只等待原专家；Tree/L8已实读终结，不重派整诊断。L8只沿原T01–T04后继，Tree只原refresh当态缺图小段。', '',
    '| 顺序 | ID | 当前范围状态 | 原动作/剩余最小段 | 最小证据/准入 | 原定位与补签 |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const x of entries.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id, 'en'))) {
    const refs = [...x.originalLocator.map((r) => `[原行](${relative(r.path)}#L${r.line})`),
      ...x.currentLimitedSignatures.map((r) => `[${r.key}](${relative(r.path)}) ${r.section}`)];
    lines.push(`| ${x.priority} | \`${x.id}\` | ${md(x.currentReconcileStatus)} | ${md(x.remainingOriginalActions.length ? x.remainingOriginalActions.join('；') : '原指定行为余片闭；只补当前候选/对象/原断言继承，不重采已签动作')} | ${md(x.minimumEvidence)}<br>${md(x.admission.join('；'))} | ${refs.join('<br>')} |`);
  }
  lines.push('', '## 原页面格完整索引', '',
    `[table${outputRevision}.json](final-remaining-acceptance-reconcile-20261023-r3-table${outputRevision}.json) 的 \`orderedEntries[kind=matrix]\` 恰1184个原ID。每条保留原完整条目、route/width/height/theme/nativeZoom/state、旧segmentRefs/时段/原证指针与格内minimumRemaining；附新报告仅候选补片待映，不新签精确格。`,
    '', '| route | 原格数 | native200格 | 390格 | 原公共动作来源 |', '| --- | --- | --- | --- | --- |');
  for (const route of Object.keys(routeRefs)) {
    const rows = matrix.filter((x) => x.originalMatrixPreserved.route === route);
    lines.push(`| ${route} | ${rows.length} | ${rows.filter((x) => x.originalMatrixPreserved.nativeZoomPercent === 200).length} | ${rows.filter((x) => x.originalMatrixPreserved.widthBeforeNativeZoom === 390).length} | [journey§6.1](remaining-journey-cases-20261021.md#61-页面矩阵)；原route行逐ID保存 |`);
  }
  lines.push('', '全行执行负责Main，判定归原独立专家；本人只在确有系统/认证必要一步时条件化单列，当前确认MANUAL_PENDING=0。各ID候选影响见table同ID的`candidateInheritanceImpact`，原AUTO-only/N/A和警告/失败不洗白。', '');
  write('-queue' + outputRevision + '.md', lines.join('\n'));
  write('-generate-audit' + outputRevision + '.json', {
    at: new Date().toISOString(), pid: process.pid, executable: process.execPath,
    environment: { platform: process.platform, node: process.version, cwd: process.cwd() },
    kind: 'own-fs-document-reconciliation-not-product-test',
    counts: data.counts, inputFingerprints: data.inputs,
    setEquality: true, originalLedgerDeepEquality: true, inputDrift: [],
    l8ActualReadbackExit: l8Receipt.exitCode, newProductPass: false,
    outputs: ['-table' + outputRevision + '.json', '-queue' + outputRevision + '.md']
      .map((s) => fingerprint(prefix + s)),
  });
  console.log(JSON.stringify({ mode, pid: process.pid, environment: process.version,
    counts: data.counts, inputs: data.inputs.length, errors: [], parentPass: false }));
}
function check() {
  const table = json(prefix + '-table-r3.json');
  assert.equal(table.orderedEntries.length, 1489);
  assert.equal(new Set(table.orderedEntries.map((x) => x.id)).size, 1489);
  assert(table.parentPass === false && table.commitAdmission === false);
  const files = ['-report.md', '-queue-r3.md', '-reader.mjs', '-review-data.json',
    '-table-r3.json', '-generate-audit-r3.json', '-table-r2.json', '-queue-r2.md',
    '-generate-audit-r2.json', '-table.json', '-queue.md', '-generate-audit.json']
    .map((s) => prefix + s);
  const missingLinks = [], trailingWhitespace = [];
  let checkedLinks = 0;
  for (const p of files) {
    const text = read(p);
    text.split('\n').forEach((line, i) => {
      if (/[ \t]+$/.test(line)) trailingWhitespace.push({ path: p, line: i + 1 });
    });
    if (!p.endsWith('.md')) continue;
    for (const m of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (/^(https?:|file:)/.test(m[1])) continue;
      const target = path.resolve(root, path.dirname(p), m[1].split('#')[0]);
      assert(target.startsWith(root + path.sep));
      checkedLinks++;
      if (!fs.existsSync(target)) missingLinks.push({ p, target });
    }
  }
  const drift = stable(table.inputs);
  assert.deepEqual(missingLinks, []);
  assert.deepEqual(trailingWhitespace, []);
  assert.deepEqual(drift, []);
  return { at: new Date().toISOString(), pid: process.pid, checkedLinks,
    missingLinks, trailingWhitespace, inputDrift: drift, inputCount: table.inputs.length,
    allUniqueIds: 1489, newProductPass: false };
}
function seal() {
  const checks = check();
  const suffixes = ['-report.md', '-queue-r3.md', '-reader.mjs', '-review-data.json',
    '-table-r3.json', '-generate-audit-r3.json', '-table-r2.json', '-queue-r2.md',
    '-generate-audit-r2.json', '-table.json', '-queue.md', '-generate-audit.json'];
  const data = {
    schema: 'pmtool-final-reconcile-r3-seal-v1',
    at: new Date().toISOString(), pid: process.pid, executable: process.execPath,
    checks, artifacts: suffixes.map((s) => fingerprint(prefix + s)),
    inputs: json(prefix + '-table-r3.json').inputs,
    parentPass: false, commitAdmission: false,
    boundary: '字节/文本/元数据文档对账，不构成产品或GUI PASS；seal自身/其后实际outer与readback收据不循环自指纹。',
    actualOuterReceiptMustFollowObservedToolExit: true,
  };
  write('-seal.json', data);
  console.log(JSON.stringify({ mode, pid: process.pid, checks, state: 'SEALED_WAIT_ACTUAL_OUTER' }));
}
function readback() {
  const sealPath = prefix + '-seal.json';
  const sealed = json(sealPath);
  const outer = json(prefix + '-seal-outer-receipt.json');
  assert.equal(outer.exitCode, 0);
  assert.equal(outer.status, 'exited');
  assert.equal(outer.observedAfterToolReturn, true);
  assert.equal(outer.pid, sealed.pid);
  assert.equal(outer.sealSha256, fingerprint(sealPath).sha256);
  assert.deepEqual(stable(sealed.artifacts), []);
  assert.deepEqual(stable(sealed.inputs), []);
  const data = {
    at: new Date().toISOString(), pid: process.pid, executable: process.execPath,
    seal: fingerprint(sealPath), actualSealOuterReceipt: outer,
    artifacts: sealed.artifacts.length, inputCount: sealed.inputs.length,
    artifactAndInputDrift: [], parentPass: false, commitAdmission: false,
    released: true, state: 'STOP/released',
    restriction: '只释放本独立对账子单；Main父任务及在途原专家继续。',
  };
  write('-readback.json', data);
  console.log(JSON.stringify({ mode, pid: process.pid, artifacts: data.artifacts,
    inputCount: data.inputCount, drift: [], released: true }));
}
if (['generate', 'generate-r2', 'generate-r3'].includes(mode)) generate();
else if (mode === 'check') console.log(JSON.stringify(check()));
else if (mode === 'seal') seal();
else if (mode === 'readback') readback();
else throw new Error('mode must be generate/generate-r2/generate-r3/check/seal/readback');
