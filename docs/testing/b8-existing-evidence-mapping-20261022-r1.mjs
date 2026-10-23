import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

// Pure document projection. No product imports, subprocesses, GUI or network.
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const output = path.join(root, 'docs/testing/b8-existing-evidence-mapping-20261022-r1.json')
assert.equal(fs.existsSync(output), false, 'Refuse to overwrite an existing mapping')
const inputs = new Map()
function read(relative) {
  assert.ok(!path.isAbsolute(relative) && !relative.split('/').includes('..'))
  assert.ok(relative.startsWith('docs/') || relative.startsWith('reports/') || relative === 'AGENTS.md')
  const bytes = fs.readFileSync(path.join(root, relative))
  inputs.set(relative, { path: relative, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') })
  return bytes.toString('utf8')
}
const json = relative => JSON.parse(read(relative))
const old = json('docs/testing/remaining-acceptance-delta-20261022-index-r2.json')
const source = json('reports/layer-entry-map-source-20261021.json')
const oldById = new Map(old.ledger.map(row => [row.id, row]))
const contractText = read('docs/testing/remaining-layer-map-20261021.md')
for (const p of [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/final-remaining-acceptance-reconcile-20261022.md',
  'docs/testing/remaining-journey-cases-20261021.md',
  'docs/testing/remaining-acceptance-register-20261021.md',
  'docs/testing/gui-b8-expanded-checklist-20261020.md',
  'docs/testing/b1-b8-coverage-mapping-20261020.md',
  'reports/layer-entry-map-source-20261021.md',
]) read(p)

const evidence = []
function item(id, report, rawRoot, scope, boundary, extra = {}) {
  const reportPath = `docs/testing/${report}.md`
  read(reportPath)
  evidence.push({ id, report: reportPath, reportLocator: extra.reportLocator ?? '§1及候选/原证/继承节',
    rawRoot, mappedSignedScope: scope, excludedScope: boundary,
    reviewMode: '引用原独立审签；本角色不重复目视、执行或全原件SHA审计', ...extra })
}
const raw = 'reports/all-pending-evidence-20261021/'
item('E-BOARD', 'a8-gui-supplement-independent-review-20261021', `${raw}A8/board/`,
  '三原拖/三逆undo、两拖主save/reload、不同稿cancel/reload、完整layout与盘value、浅色绿色成功；client/editor实际下发',
  '精准cancel mtime/目录/LS与session归因仍缺；六卡存在不等十六卡逐卡拖缩/加删；不倒签A6', { candidate: 'A8', nominalViewport: [1440, 900], theme: 'light', zoom: '原动作未独立回绑native100；不能借后来菜单倒签', fixture: 'F1六卡布局' })
item('E-RESTORE', 'a10-restore-toolbar-gui-independent-review-20261021', `${raw}A10/restore/`,
  'hash/missing/path三拒绝单前缀、390浅深长预检与四数据按钮局部修后可见',
  '1440负例实际高718；390浅色cancel终态、精准保护/键盘/中宽/原生zoom仍缺', { candidate: 'A10', nominalViewport: [390, 900], theme: 'light/dark', zoom: '未证明原生档位' })
item('E-MEETING', 'a11-meeting-layout-gui-review-20261021', `${raw}A11/meeting/`,
  '0/1/2行布局、ai001非空task关联/解除、再次主save三业务命令、第三新行cancel；四宽浅深first→last-select→显式cancel',
  'issue正关联、四态全选择、两旧行同次标题/状态修改、故障/长菜单/200/restart未签；r1/r2不能作取消零写；1024/768背景横滚未闭',
  { candidate: 'A11', fixture: 'F5 mtg-0001/ai-001/ai-002；F5无issue', timeOrigin: 1792600688705.2, origin: 'http://127.0.0.1:3226', zoom: 'r3 nominal100+DPR1；menu100只证原时点，不证每格独立菜单' })
item('E-MATERIAL', 'a13-materials-report-gui-review-20261021', `${raw}A11/materials/`,
  'E1 rv4 append/软删/首次restore主save、current两refs默认全选preview/save、源rv5后旧report同byte/详情、危险MDpreview',
  '不含basic+link组合、非法组合、主动重选refs、源再软删、MD实save/export；取消仅DATA不签GUI',
  { candidate: 'A11', nominalViewport: [1440, 900], theme: 'dark', zoom: '未回绑原生100', fixture: 'F5 t-0001/pl-1/rv1..5；rpt-0002' })
item('E-OP', 'a11-overview-visible-final-review-20261021', `${raw}A11/objective/`,
  '人工30/0主save/reopen、有清单0→clear/null、Space100/50即时写/三页、同保存态上下2/10=20%与wrapped1、父63/88',
  '非报告consumer、无清单clear/cancel-clear、全部标签、wrapped迁父或全页面；原A10/r2失败保留',
  { candidate: 'A11', nominalViewport: [1440, 900], theme: 'light', zoom: 'nominal100，原menu100为前置旁证非每态重采', origin: 'http://127.0.0.1:3225', timeOrigin: 1792600846520.7, fixture: 'F2 t-0003 两稳定UUID' })
item('E-F7', 'gui-numbers-habit-dark-review-20261021', `${raw}A3/habit/`,
  '14日/月默认折叠→三月依次展开、D-13边界、390局部可读',
  '3213同origin/下发/native100未绑定、前后原bytes未齐、收起/reload/reentry未签；旧编号FAIL不引用为当前绿',
  { candidate: 'A3/A5历史', nominalViewport: [390, 900], theme: '报告未明确此窄图theme，不猜', zoom: '未回绑', fixture: '合法F7' })
item('E-PC', 'a16-extension-selection-gui-review-20261022', `${raw}A16/`,
  'Space取消s1/edit55/min-expand/cancel、外改后再生成再cancel、四update clean/conflict/freshundo、正常四表单单字段save',
  '再生成实际apply base缺；四create/白名单拒绝/浅色/390/全键盘未签；gateway旧stop缺档保留',
  { candidate: 'A16', nominalViewport: [1440, 900], theme: 'dark', zoom: 'DPR2不是native200', fixture: 'F6 s1..3/e1..4', timeOrigin: 1792625471494.4 })
item('E-GROWTH', 'a18-growth-more-gui-review-20261022', `${raw}A18/growth-more/`,
  '原A13建议confirm/ignore/重复guard、D+1/D-3拒、人final/repeat、F5解绑后普通表单选原OKR主save/reopen',
  '旧建议自身关联FAIL由E-GM定向取代；错误视觉/其他同项目目标/missing/失败保稿/聚合未签',
  { candidate: 'A13而非A18', nominalViewport: [1440, 718], theme: 'dark', zoom: '未回绑', timeOrigin: 1792618531950.5 })
item('E-INTEGRATION', 'a18-integration-more-gui-review-20261022', `${raw}A18/integration-more/`,
  'session/attach表单回读、queue添加/rest/mute/unmute/quiet、wrapped命令、lesson、项目三档相对只读出站',
  '不签全部卡动作、原绝对web无done、旧file计数FAIL由A20取代；无TTL/absence/全consumer/完整安全矩阵',
  { candidate: 'A13而非A18', nominalViewport: [1440, 718], theme: 'dark', zoom: '未回绑' })
item('E-OKR', 'a18-okr-journey-gui-review-20261022', `${raw}A18/okr-journey/`,
  '三建议→一次confirm draft KR/一次ignore→reentry→repeat拒零写→clear两processed保第三pending→reentry',
  'repeat错误视觉BLOCKED、跨项目动态反例/键盘/浅色未签；不是全P2003',
  { candidate: 'A18', nominalViewport: [1440, 718], theme: 'dark', zoom: '未回绑', timeOrigin: 1792629512672.7 })
item('E-CONTROL', 'a18-feedback-controls-gui-review-20261022', `${raw}A18/feedback-controls/`,
  '合法失败词标题成功、预host网络失败保稿、明确弃稿→close→重新编辑成功',
  '后台卡close30秒timeout不签保稿穿越；标记catch/同值generation/迟到copy/timer未采',
  { candidate: 'A18', nominalViewport: [1440, 718], theme: 'dark', zoom: '未回绑' })
item('E-M01', 'a18-material-composition-gui-review-20261022', `${raw}A18/material-composition/`,
  '同一次basic+既有link备注+E1 append主save，E2/E3/冻结/bytes保全',
  '不签两非法组合/新draft别名+file完整旅程/全材料门', { candidate: 'A18' })
item('E-M01-VISIBLE', 'a18-material-composition-gui-review-20261022-visible', `${raw}A18/material-visible/`,
  '重开link备注/当前rv4/E1四版作者正文可见、clean cancel四根等值',
  '四短版同一画面不是四个不同滚动态；E2/E3历史没展开，不补长史/dirty/非法组合',
  { candidate: 'A18', nominalViewport: [1440, 718], theme: 'dark', timeRange: ['2026-10-22T02:03:15.047Z', '2026-10-22T02:03:16.201Z'] })
item('E-GM', 'a19-habit-association-gui-review-20261022', `${raw}A19/habit-association/`,
  '两建议自身目标pending/confirmed/ignored、missing/unlinked pending、1440/390深色长建议行',
  '不等旧卡HC01或全习惯/收件全部错误；旧probe执行扩义必须按补正撤回',
  { candidate: 'A19', fixture: 'F5建议与新habit按原报告稳定ID逐项认领', reportLocator: '§1/§3/§5，另补正报告', nominalViewport: null })
read('docs/testing/a19-habit-association-gui-review-20261022-correction.md')
item('E-HC', 'a19hc-gui-independent-review-20261022', `${raw}A19HC/gui-main/`,
  '旧习惯长OKR自然换行、普通HTML字面、未关联建议无伪OKR',
  '仅1440×1000/390×844深色；不是900格/其他状态/全习惯；不重测已签HC01', { candidate: 'A19HC', nominalViewports: [[1440, 1000], [390, 844]], theme: 'dark', zoom: '不另推原生档位' })
item('E-NUMBER', 'a19-number-visual-retest-review-20261022', `${raw}A19/number-visual/`,
  '两编号1/2、Tab/Enter系统copy、全文成功/denied/复原、GNHD01裁切已闭',
  '不同context和标题bbox仍缺；manual r1/r2失败不能清掉，后诊断仅定向关闭',
  { candidate: 'A19', nominalViewport: [1440, 900], theme: 'dark', zoom: '同target/timeOrigin前置native100', timeOrigin: 1792634747265.7 })
item('E-MANUAL', 'a19-number-manual-diagnostic-independent-review-20261022', `${raw}A19/`,
  'D5字形内真拖选/native Copy/system值及普通文本控制；MAN-D01..03有限关闭',
  'D3/D4失败保留、不同context/标题bbox未补；不要重采成功诊断', { candidate: 'A19' })
item('E-U4', 'a13-u4-gui-total-retest-r2-20261022', `${raw}U4/`,
  'RA-U401/402整项PASS；r1双规则/视图/default/A-B/ESC继承，r2方向/换序/旧快捷/四列恢复、父叶分组头同源及390裁切关闭',
  '仅旧102/3257；adapter只签真实React回调+render/persist非物理click兼容；不签tasks整格/新增GUI故障；不重测U4',
  { candidate: 'U4r2', manifestSha256: '26f093c3f8fbc243a28cb736f452b6fc8aa1ed90ec7403bc14a94fac4948fba9', instance: '3257/PID88698（历史被测，不探活）', nominalViewports: [[390, 844]], theme: '不能从报告猜全部截图主题/宽高', zoom: '未签全矩阵档位' })
read('docs/testing/a13-u4-gui-total-retest-20261022.md')
item('E-SLASH', 'a20v2-gui-independent-review-20261022', `${raw}A20V2/gui-contract-r6/`,
  'SR-G01..06 success/error/session隔离/非pm/面板backup/restore单反馈；G07 N/A',
  '宿主conversation不是RA-V十二route整页；不补其他OKR/feedback错误', { candidate: 'A20V2' })
item('E-LG', 'a8-layer-gap-contract-review-20261021', 'docs/testing/a8-layer-gap-contract-review-20261021-r4-execution.json',
  'LG02新会议先建后编辑action；LG03 owner popup为P1参考不入门，普通owner字段仍验',
  'LG01/01b/04/05旧FAIL按各后续修后报告定向取代；SOURCE/组件不签GUI', { candidate: 'A8历史合同审查', kind: 'CONTRACT_CLARIFICATION' })
item('E-LEGACY', 'legacy-clearance-20261018', 'docs/testing/legacy-clearance-20261018/',
  '历史320看板/交付物填充等各自局部PASS；ARIA26和CSS zoom模拟仅辅助',
  'D2风险320填充仍缺；I8真VoiceOver未跑；原生200未跑；不借别种矩阵或AT模拟签AT01/02', { candidate: '历史legacy', kind: 'HISTORICAL_BOUNDARY' })
item('E-CYCLE', 'cycle-feedback-independent-retest-20261022-r1-report', 'docs/testing/cycle-feedback-independent-retest-20261022-r1-selftmp/r1/',
  'CF-R01/R02 SOURCE/AUTO PASS 10/29/134；104继任输入；三产品窄增量还原等旧U4字节',
  '未build/GUI；旧102/3257不代表新104；新core/commands/result-card反馈接缝须新绑定；不读取ATF活业务',
  { candidate: 'Cycle104', kind: 'SOURCE_AUTO_ONLY' })
const ci = json(`${raw}C0/ci/observation.json`)
read(`${raw}C0/ci/detail.json`)
evidence.push({ id: 'E-CI', rawRoot: `${raw}C0/ci/`, observation: ci, mappedSignedScope: '既有9b1a8c5远端core success；e2e host missing SKIP/exit0',
  excludedScope: '不代表dirty候选e2e PASS；父终端末码未另捕获；不push/dispatch' })
const native = `${raw}A8/restore/native-zoom/`
read(`${native}execution.md`)
evidence.push({ id: 'E-NATIVE', rawRoot: native, kind: 'RAW_EXECUTION_NOT_INDEPENDENT_CELL_SIGNOFF',
  mappedSignedScope: '真实100→150→175→200→reset；1440×900缩放前→720×450缩放后；同document PM重mount',
  excludedScope: '执行端原事实，未有精确RA-V格独立审签；状态动作未完整；不倒签别的origin/候选' })

const amendments = [
  { id: 'C-LG02', targets: ['RA-DR-08'], authority: 'E-LG §1/§5 LG-G02', action: '先主提交新会议→真实编辑同ID→新增行动项显式保存→重开；不要求未存会议原子创建action' },
  { id: 'C-LG03', targets: ['RA-DR-30', 'RA-MENU-14', 'RA-MENU-26'], authority: 'E-LG §1/§3/§5 LG-G03', action: 'owner popup NOT_APPLICABLE；普通输入填/清→主save/reopen仍是GUI余件；不撤销TaskForm assignee补全' },
  { id: 'C-FORMULA', targets: ['RA-DR-04'], authority: '原layer §2 + source-map缺口；有效生产白名单优先', action: '请原合同owner指明已有构建器的合法失败动作；不能要求编辑只读表达式或新增任意eval/parser入口；尚未自行N/A' },
  { id: 'C-DENSITY', targets: ['RA-MENU-01'], authority: '原layer §1/§3 + source-map两有效档', action: '请原合同owner确认按实际舒适/紧凑两档采cancel/save；原型三选不新增第三档；尚未自行删条目' },
  { id: 'C-MATRIX', targets: ['RA-V-*'], authority: 'register §2/§6 + journey §6.1 + final §4.4/§7.6；AGENTS §6A.1待表决', action: '保留1184原格；未发现哪一格已被证明只源未生效提议。若owner有此反证，只列具体ID/原来源/批准时间最小澄清，继续无争议格；不追溯全组件合同' },
]

const updates = new Map()
function map(ids, refs, signed, remaining) {
  for (const id of ids.split(',')) updates.set(id, { refs: refs.split(','), signed, remaining })
}
map('RA-DR-01,RA-DR-02', 'E-PC', '已有深宽副驾选择/取消；不是能力选择抽屉全条目', '按source-map真实AI能力opener，01补390、02补深态键盘选择/disabled理由与cancel')
map('RA-DR-03', '', '未见浅色能力选择完整GUI', '浅态真实能力选择、理由、键盘与cancel；不造按钮')
map('RA-DR-06,RA-DR-07', 'E-PC', '四update冲突前真实dlv说明主save/原history保全', '06深色note/清ms、07浅色全预填note fresh cancel/save；不重采description字段')
map('RA-DR-08', 'E-MEETING,E-LG', '合法已存空actions→新增一/二行、主save重开；第三新行cancel', '按C-LG02补空新会议决议/先建后action链及入口键盘，不补原子创建')
map('RA-DR-09,RA-DR-10', 'E-MEETING,E-PC', '四宽浅深末select/取消、ai001 task关联/clear、再次主save一旧标题；meeting summary单save', '合法issue选/clear主save；两旧行同次标题/状态主save、该类型真实失败保输入/重试；四态语义不靠出现菜单')
map('RA-DR-11', 'E-PC', '里程碑description深色正常主save', '合法到期/四态/achievedDate主save与非法日期保稿；不重description')
map('RA-DR-12', 'E-MATERIAL', 'current E3rv1/E1rv4默认全选preview/save零写前置', '主动取消/重选复合refs、周期校验/合法恢复；键盘')
map('RA-DR-13,RA-DR-14', 'E-MATERIAL', '深色安全MDpreview与固定来源/period只读辅证；源rv5后旧report同byte', '13深/14浅实际MD主save/reopen、安全原文与固定来源；原preview取消完整终态欠')
map('RA-DR-15', 'E-PC', 'risk responsePlan深色正常主save', 'probability/impact/owner预填及合法主save；不重responsePlan')
map('RA-DR-17,RA-DR-18', 'E-GROWTH', '深色F5正常选原OKR主save/reopen保历史', '17深title及另一同项目/失败保稿，18浅fresh cancel/save；不重原OKR重关联')
map('RA-DR-19', 'E-GROWTH,E-GM,E-HC', 'confirm/ignore/reentry守卫及建议自身目标/长行/未关联控制已签', '原真实收件opener/键盘/错误可见；不重建议自身关联或HC01')
map('RA-DR-25', 'E-OKR', '同项目三pending→confirm draft KR/ignore/reentry/clear保pending', '运行入口/键盘、repeat错误可见/异项目动态反例；不重复confirm/ignore业务')
map('RA-DR-27', 'E-GROWTH', '真实命令新objective，不等手工表单', '手工title/owner主save与fresh cancel/合法校验')
map('RA-DR-30', 'E-LG', 'popup N/A有原专家明确依据', '普通owner填/清→save/reopen与入口键盘；不新增候选池')
map('RA-DR-34,RA-DR-35', 'E-MATERIAL,E-M01,E-M01-VISIBLE,E-OP', '组合主save、E1四版可见、clean cancel、人工/清单即时Space及分区子项', '34组合之外失败保稿/入口；35 FL全部基础/清单/资料/进展/依赖区滚动及save/cancel；四短版不等全部FL')
map('RA-DR-36', 'E-OP', '非本件新签，原task↔ms历史局部保留', '当前选/清ms主save与反向一致，联J02；不重U4')
map('RA-DR-37,RA-DR-38', 'E-CONTROL', '合法失败词标题成功/明确弃稿后新编辑；原fresh file保存按原台账引用', '新draft basic+material+progress+file组合一次save/cancel；38深合法/非法组合错误；旧网络失败不代业务拒绝')
map('RA-DR-39', 'E-PC', '再生成前TaskForm assignee正常主save', '真实候选键盘选择/清未分配→save；不把普通输入等于datalist操作')
map('RA-DR-40,RA-DR-21', 'E-CYCLE', 'DAG循环真实command/组件SOURCE AUTO已签；GUI仍未激活', '新104实际依赖搜索多选→自指/循环/B拒保稿→解除retry主save；21限390；不重原AUTO')
map('RA-DR-41,RA-DR-42', 'E-INTEGRATION', '命令priority/done/wrapped及consumer局部；非菜单完整GUI', '41 P0/P1/P2键盘人save/reopen；42五态合法选择人save及wrapped AI拒沿原门')
map('RA-MENU-09', 'E-MEETING', 'issue控件空项存在/风险排除，不等issue正关联', '合法同项目issue→主save/clear及跨项目拒、键盘；不能null→null签解除')
map('RA-MENU-10', 'E-MEETING', 'stable action ID及已签主save链；并非四态全选择', '四态选择主save/reentry；两旧行修改/fault按原合同合并')
map('RA-MENU-11,RA-MENU-12', 'E-MEETING', 'ai001同项目非空task→主save→clear；r3浅深ArrowDown/Tab/显式cancel', '真实task候选搜索/选择完整键盘、ESC焦点；不重ai001保存/不借native browser菜单')
map('RA-MENU-14,RA-MENU-26', 'E-LG', 'owner popup原专家N/A', '普通owner填/清save/reentry仍验；不强造popup')
map('RA-MENU-18,RA-MENU-36,RA-MENU-38', 'E-U4', 'U401/402已PASS：真实双sort/方向/换序/legacy清链、named/default/reload/A-B、18 ESC焦点归还、四列/父叶分组头同源', '只补运行layer-map精确opener/动作时间索引；36 fresh cancel与未明示chip/group组合、其他旧快捷字段若原完整条目仍缺先交已存原件；不重U4已签排序/四列')
map('RA-MENU-21', 'E-U4,E-OKR', 'A/B视图隔离、业务列表重进局部', '键盘switcher和关联候选同步更新未签；不重复U4 A/B')
map('RA-MENU-22,RA-MENU-24', 'E-RESTORE,E-SLASH', '更多→预检真实入口/390四数据按钮与局部取消；面板backup/restore单反馈', '22各真实navigation/data项运行映射及危险cancel；24真390 menu内滚/Tab/ESC焦点，不拿按钮可见代menu')
map('RA-MENU-30,RA-MENU-31,RA-MENU-32', 'E-PC', '深宽真实诊断/计划选择edit/min/cancel与四update结果', '30相关task投影只读exit，31补390折行/焦点，32补原剩再生成执行base/四create/拒行软风险；不重四update')
map('RA-MENU-33', '', '浅色真实dispatch/refs未签', '浅色计划→明确确认→逐条真实结果/refs；不借深色')
map('RA-MENU-37', 'E-RESTORE', '390分享裁切局部已修；六原生导入按原台账保留', '全menu键盘、筛选export/share实际文件/只读映射；不重六导入，不虚构外部分享')
map('RA-MENU-39', 'E-GROWTH,E-INTEGRATION,E-OKR', 'growth上下文部分导航重进', '只补growth顶栏更多各真实项/返回/危险cancel；不能MENU22替此上下文')

const contracts = new Map()
for (const line of contractText.split('\n')) {
  if (!/^\| RA-(?:DR|MENU)-\d{2} \|/.test(line)) continue
  const columns = line.split('|').slice(1, -1).map(x => x.trim())
  contracts.set(columns[0], { manifestId: columns[1], fixture: columns[2], action: columns.slice(3).join('|') })
}
const layers = source.layers.map(layer => {
  const original = oldById.get(layer.id)
  assert.ok(original && contracts.has(layer.id))
  const entry = source.entries[layer.entryRef]
  const update = updates.get(layer.id)
  return {
    id: layer.id, ...contracts.get(layer.id),
    originalContract: 'docs/testing/remaining-layer-map-20261021.md#' + (layer.id.startsWith('RA-DR') ? '2-42条抽屉态' : '3-39条菜单弹层态'),
    originalLedger: original,
    sourceLocatorOnly: { map: 'reports/layer-entry-map-source-20261021.json', mappedAt: source.mappedAt,
      entryRef: layer.entryRef, route: source.productionNavigation.routeDefinitions[entry.route],
      component: entry.component, sourcePath: entry.currentSourcePath,
      trigger: layer.triggerOverride ?? entry.trigger,
      controls: layer.observableOverride ?? entry.observableControls,
      commands: entry.commands, sourceStatus: layer.sourceStatus ?? source.scope.defaultSourceStatus,
      warning: '历史source定位，不是当前live源码或runtime PASS；U4旧未实现事实被E-U4定向取代' },
    evidenceRefs: update?.refs.filter(Boolean) ?? [],
    signedParts: update?.signed ?? original.signedSubscopeQuotedFromReports,
    signedPartsAuthority: update ? '上列原独立报告，仅明示切片' : '原A18截点台账引用，非本轮重签；先按最新报告/接缝继承',
    minimumRemaining: update?.remaining ?? original.remainingRequiredByExistingContract,
    commonRemaining: '实际opener/控件/实体/命令或前端动作/原时间段与最终候选绑定；只补未签键盘、主提交或取消、该类型有效校验/恢复，不伪造本地loading',
    clarificationRefs: amendments.filter(a => a.targets.includes(layer.id)).map(a => a.id),
    status: update?.refs.filter(Boolean).length ? 'PARTIAL_SIGNED_SCOPE_MAPPED' : 'MISSING_RUNTIME_OR_CURRENT_MAPPING',
    fullLayerPass: false,
  }
})

const segments = []
function segment(id, evidenceRef, route, width, theme, state, scope, extra = {}) {
  segments.push({ id, evidenceRef, route, width, height: 900, theme, zoom: 100, state,
    signedParts: scope, entireCellPass: false, currentBinding: '旧候选切片；新候选按接缝绑定，不签当前ATF/全页',
    ...extra })
}
for (const w of [1440, 1024, 768, 390]) for (const t of ['light', 'dark']) {
  const p = `${raw}A11/meeting/widths100-r3/${t}-${w}-`
  const first = json(`${p}first.json`)
  const last = json(`${p}last-select.json`)
  const cancelled = json(`${p}cancelled.json`)
  assert.equal(first.viewport.width, w)
  assert.equal(first.viewport.height, 900)
  assert.equal(first.dark, t === 'dark')
  segment(`S-MEETING-${t}-${w}`, 'E-MEETING', 'meetings', w, t, 'typical',
    '两行动项局部first→末task select→ArrowDown/Tab→显式cancel、横向字段可达及data零写；非该格全部动作',
    { start: first.at, end: cancelled.at, checkpoint: last.at, raw: [`${p}first.json`, `${p}last-select.json`, `${p}cancelled.json`],
      origin: first.origin, timeOrigin: first.timeOrigin, fixture: 'F5 mtg-0001/ai-001/ai-002',
      zoomBinding: 'nominal100/DPR1，E-MEETING §4.2菜单原时点；非200%',
      knownUnclosedObservation: w === 1024 ? '背景shell792/739横滚，未被局部PASS关闭' : w === 768 ? '背景shell709/707横滚，未被局部PASS关闭' : null })
}
const boardStates = json(`${raw}A8/board/original-three-r2/states.json`)
const boardLayout = json(`${raw}A8/board/original-three-r2/layout-S0.json`)
segment('S-BOARD-1440', 'E-BOARD', 'dash', 1440, 'light', 'typical',
  '三原拖/undo、六卡布局实际几何；另save-cancel-r2内容保存/重载可引用，不等16卡完整动作',
  { start: boardStates[0].result.at, end: boardStates.at(-1).result.at,
    raw: [`${raw}A8/board/original-three-r2/states.json`, `${raw}A8/board/original-three-r2/layout-S0.json`],
    zoomBinding: '原动作native100前置缺独立回绑；仅尺寸/状态部分映射' })
for (const r of ['tasks', 'overview', 'gantt']) segment(`S-OP-${r}`, 'E-OP', r, 1440, 'light', 'typical',
  r === 'gantt' ? '同F2目标manual30/0、objective100/50的甘特标签；非时间轴调期/详情' :
    r === 'overview' ? '五保存态上下计数2/10=20%/wrapped1/父63↔88与真实滚动' : '人工主save/reopen、清单Space100/50、stable目标与跨页',
  { timeRange: ['2026-10-21T20:24:45.914Z', '2026-10-21T20:26:54.578Z'], timeRangeMeaning: 'manual93帧及checklist71帧两段，中间不是连续录像', zoomBinding: '原menu100同document前置旁证', fixture: 'F2 t-0003；不是原F1全部典型动作' })
segment('S-NUMBER', 'E-NUMBER', 'tasks', 1440, 'dark', 'typical',
  'code1/2 Tab/Enter/system copy/denied/复原及全文反馈修后',
  { timeRange: ['2026-10-22T02:21:51.449Z', '2026-10-22T02:21:55.365Z'], zoomBinding: '同target/timeOrigin menu100前置成立', fixture: '两合法编号，不等任务default/pilot全旅程' })
segment('S-PC', 'E-PC', 'tasks', 1440, 'dark', 'typical',
  '计划勾选编辑min-expand/cancel、正常assignee外改；计划为叠层，不能视为列表整格',
  { timeRange: ['2026-10-21T23:31:13.586Z', '2026-10-21T23:37:20.934Z'], timeRangeMeaning: 'loaded前置/人工更新时点，非全段连续影像', zoomBinding: '原生档位未独立回绑' })
segment('S-MATERIAL-TASK', 'E-MATERIAL', 'tasks', 1440, 'dark', 'typical',
  '资料修订/软删/首次restore主save；长抽屉内容不是FL全页',
  { raw: [`${raw}A11/materials/progress-journey/history-reopened.png`], zoomBinding: '原生档位未独立回绑' })
segment('S-MATERIAL-REPORT', 'E-MATERIAL', 'reports', 1440, 'dark', 'typical',
  'current两refs默认全选固定保存/源rv5后重入/安全preview；未实save安全MD/export',
  { raw: [`${raw}A11/materials/fixed-report/detail.png`], zoomBinding: '原生档位未独立回绑' })

const routeRemaining = {
  dash: 'F1十六卡/卡库配置互斥、保存取消/精准保护、FD长画布/FL公式文本、FE首载/FB失败retry；scope/跨宽另联B401..404',
  overview: 'F1 A/B/个人/legacy不串、开卡返回及project save/reset；FD/FL卡、FE/FB旧scope不可冒当前',
  tasks: 'default OFF/pilot ON各选同task→draft save/cancel返回，FD筛选/分组、FL标题编号/长抽屉、FE/FB恢复及FS stale/noresult；不重U4或编号已闭切片',
  gantt: '跨度/依赖/关键路径/今天线，阈值内移动零日期写、双击/Enter详情返回、合法调期保存，日周月；FE/FB无半写',
  milestones: '四有效状态/achievedDate、到期编辑/清取消、FD20/FL标题任务；FE/FB非法日期保稿后恢复',
  'risk-issues': '风险/问题枚举→填充矩阵→开行→合法save，FD含closed排除/FL描述；FE/FB局部拒绝保稿',
  people: '同MAX/未分配/负载建议筛选→task返回，FD20人/FL姓名、FE/FB恢复、只读零写',
  meetings: '新会议分命令actions、稳定行主save、issue正关联、四态/关联task打开、FD20/FL长决议行动、FE/FB保稿retry',
  reports: '主动复合refs/current固定、源再软删旧详情preview/export、安全MD实save、manual/session来源；FD20/FL正文、FE/FB不自动入报',
  deliverables: '五态/ms/note编辑清关联save、note/ms搜索命中，FD20/FL版本名；FE/FB失败保稿',
  okrs: 'objective/KR单父软联树、人确认/ignore及全kind、FD20/FL理由、FE/FB失败关联零半写与repeat错误可见',
  habits: 'F7收起/reload/reentry/历史保护、建议已签只补键盘/错误、允许补记及同项目关系、FD20/FL长标题；FE/FB超窗拒保稿，不重HC01',
}
const matrix = old.matrix.map(row => {
  const match = /^RA-V-(.+)-(1440|1024|768|390)-(light|dark)-(100|200)-(.+)$/.exec(row.id)
  assert.ok(match, row.id)
  const [, route, width, theme, zoom, state] = match
  const mapped = segments.filter(s => s.route === route && s.width === Number(width) && s.theme === theme && s.zoom === Number(zoom) && s.state === state)
  return { ...row, originalIndex: 'docs/testing/remaining-acceptance-delta-20261022-index-r2.json',
    dimensions: { route, width: Number(width), height: 900, theme, zoom: Number(zoom), state },
    segmentRefs: mapped.map(s => s.id),
    mappingStatus: mapped.length ? 'PARTIAL_DIMENSION_STATE_MATCH' : 'NO_EXACT_SEGMENT_IN_REVIEWED_SIGNED_INDEX',
    entireCellPass: false, currentCandidatePass: false,
    routeSharedRemainderNotRepeatedPerCell: routeRemaining[route],
    minimumRemaining: [row.existingContractActionAndFixture,
      '按此格合法初态只补未签主要动作/取消或恢复/Tab与滚动/完整文案目视；先交已存同格原时间段，不重新演已签子步骤',
      ...(Number(zoom) === 200 ? ['原生菜单200%及缩放前width×900/缩放后inner/宿主和PM容器绑定；DPR/CSS zoom不替代'] : []),
      ...(state === 'stale' ? ['FS旧snapshot→真实拒读→只读陈旧不进payload→retry更新消失，同页原O5'] : []),
      ...(state === 'noresult' ? ['同项目真实不命中词，空结果可辨并可恢复原筛选'] : [])] }
})
const cards = boardLayout.widgets.map(w => ({ kind: w.type, widgetId: w.i }))
const movedKinds = ['completionHero', 'milestoneDeliverable']
const widgets = old.ledger.filter(r => r.id.startsWith('RA-W-')).map(row => {
  const kind = row.id.slice('RA-W-'.length)
  const inSix = cards.find(c => c.kind === kind)
  const domainRefs = ({ completionHero: ['E-OP'], objectiveProgress: ['E-OP'], statusRing: ['E-OP', 'E-INTEGRATION'],
    queueCard: ['E-INTEGRATION'], overdueSoon: ['E-INTEGRATION'], textNote: ['E-MATERIAL'] })[kind] ?? []
  return { id: row.id, originalLedger: row, evidenceRefs: [...(inSix ? ['E-BOARD'] : []), ...domainRefs],
    boardWidgetId: inSix?.widgetId ?? null,
    publicActionMapping: inSix ? {
      drag: movedKinds.includes(kind) ? '原A/B真实拖动；B是一原位移动' : '仅压实/同布局观察，不冒称抓此卡拖动',
      undo: '三undo还原整个六卡布局；不是对此kind执行delete undo',
      saveReload: '同六卡配置/布局参与主save和真实reload完整JSON',
      cancelReload: '同六卡参与不同草稿cancel/reload；精准mtime/LS仍缺',
    } : null,
    minimumRemaining: '只补未签该kind加/配置、实际拖+resize、跨宽save/restart、该kind删/undo和cancel；内容按同fixture权威值。复用E-BOARD全局save/reload，不把六卡存在或压实签成六卡均拖缩；formula合法/empty/失败修正、trend/weekly诚实empty、MD安全沿原合同',
    kindSpecificOriginalRemaining: row.remainingRequiredByExistingContract,
    fullWidgetPass: false, status: inSix || domainRefs.length ? 'PARTIAL_SIGNED_SCOPE_MAPPED' : 'MISSING_KIND_ACTION_MAPPING' }
})
const specials = [
  { id: 'RA-AT01', contract: 'remaining-journey §6.2', status: 'NOT_RUN_CURRENT_FILLED_RISK_GUI',
    evidenceRefs: ['E-LEGACY'], excludedReuse: '旧320看板和交付漏斗非risk填充；空矩阵/风险ARIA AUTO不可代',
    minimumRemaining: 'Main F1+FL合法填充risk，真320×900浅/深100%，最高risk格→对应真实IDs列表→返回/Tab/局部横滚，轴/格数完整、closed排除；独立审签。真OS必要权限才单列本人一步' },
  { id: 'RA-AT02', contract: 'remaining-journey §6.2', status: 'NOT_RUN_REAL_VOICEOVER',
    evidenceRefs: ['E-LEGACY'], excludedReuse: 'ARIA26/静态keyboard不等VoiceOver；Main-only不等本人',
    minimumRemaining: 'Main真实macOS VoiceOver 1440×900浅100：F3 TaskForm、F6 AI确认、F5危险confirm/OKR listbox，label/role/state/error/模式播报、Tab/箭头/ESC、取消/主提交焦点；开启状态+音频录像/逐条转录+元素时间上下文。系统确拒才必要本人动作' },
  { id: 'RA-CI02', contract: 'remaining-journey §7', status: 'HISTORICAL_SKIP_CURRENT_NOT_RUN',
    evidenceRefs: ['E-CI'], excludedReuse: 'core success/e2e exit0 SKIP均非本机dirty e2e PASS',
    minimumRemaining: 'Main按原既有e2e合同一份无harness保SKIP，一份已有合法host+Chrome在自有隔离候选实际执行，交argv/cwd/host与plugin输入/产物/fixture/exit及原日志给独立专家；不新增下载/工作流，不为此push/dispatch' },
]
const out = {
  schema: 'pm-tool.b8-existing-evidence-mapping.v1',
  createdAt: new Date().toISOString(), role: 'trae/不同独立B8范围映射专家',
  authority: { ownerStatement: '父授权已持续批准按盘点/分工多角色验全部已有未验再普通commit，不push/tag/release',
    childStatement: '只读审既有证据；只写docs/testing/b8-existing-evidence-mapping-20261022-r1*；不GUI/产品/模型/测试运行，不Git写；子任务交回释放STOP',
    parentContinues: true, wholeB8Pass: false, ordinaryCommitAdmitted: false },
  candidateBoundary: { baseline: '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd（派单/报告记录，未读Git）',
    oldU4: '旧102/3257绑定，已签U4/HC01不重测',
    successor: 'Cycle104 SOURCE/AUTO有限PASS且未build；E-CYCLE三产品窄增量只影响对应原因/权限呈现。此件不认领当前全部live字节',
    inFlight: 'ATF core/ai-client.ts及新test由他人开发在途，本角色不读取/冻结/污染；Main唯一EGO13 p1/p2/p3 GUI与builder' },
  resultBoundary: '独立范围映射完成；局部原审签可引用，无整格/整层/整卡新PASS；未找到完整B8独立精确映射总出口',
  countMeaning: '文档ID/映射索引计数，不是功能数、通过率或截图分母',
  counts: { matrix: matrix.length, drawers: layers.filter(l => l.id.startsWith('RA-DR')).length,
    menus: layers.filter(l => l.id.startsWith('RA-MENU')).length, widgets: widgets.length,
    specials: specials.length, matrixWithPartialSegments: matrix.filter(m => m.segmentRefs.length).length,
    matrixEntirePass: 0, layerEntirePass: 0, widgetEntirePass: 0, evidenceCatalog: evidence.length },
  clarifications: amendments, evidenceCatalog: evidence, segments,
  nonExactEvidence: [
    { refs: ['E-HC'], targets: ['RA-V-habits-1440-dark-100-long', 'RA-V-habits-390-dark-100-long'], mismatch: '高1000/844非900；仅同宽长卡切片保留；不重HC01，不整格PASS' },
    { refs: ['E-U4'], targets: ['RA-V-tasks-390-light-100-typical', 'RA-V-tasks-390-dark-100-typical'], mismatch: '390×844，不推theme/native档位；只复用MENU18/36/38指定行为' },
    { refs: ['E-CONTROL', 'E-OKR', 'E-GROWTH', 'E-INTEGRATION', 'E-M01', 'E-M01-VISIBLE'], mismatch: '实际1440×718非900；行为切片保留，不批量映900格或借loaded1440×900改实际动作' },
    { refs: ['E-GM'], mismatch: '建议行confirmed/ignored不等habit页面六state；缺失/unlinked只pending；HC01另件' },
    { refs: ['E-F7'], mismatch: '390×900可读切片，theme/native档位/origin与instance绑定不齐；长史保护/收起缺证，不能猜精确格' },
    { refs: ['E-NATIVE'], mismatch: '真200仅原执行事实，未独立签状态格；候选/route/state/键盘恢复余证保留；不倒签旧约150%口径' },
    { refs: ['E-SLASH'], mismatch: '宿主conversation反馈不等十二业务route页面矩阵' },
  ],
  matrix, layers, widgets, specials,
  inheritedSourceIndex: '历史source-map按每entry引用源定位，非本轮活源码审查；实际layer runtime mapping仅由Main原证补，专家判',
  execution: { os: process.platform, node: process.version, productTest: 'NOT_RUN（派单禁止）',
    gui: 'NOT_RUN（派单禁止）', git: 'NOT_RUN', commandKind: '仅Node内置fs/path/crypto/assert纯文档投影',
    sourceFilesNotRead: ['packages/', 'launcher/', 'data/', 'private/', 'vendor/', 'credentials'],
    network: false, subprocess: false, enumeratedOriginalArchives: false,
    output: 'docs/testing/b8-existing-evidence-mapping-20261022-r1.json' },
  sourceDocuments: [...inputs.values()],
  released: true, stop: 'STOP；不持有GUI/builder/源码/依赖/端口/业务根锁；Main父任务继续',
}
assert.equal(matrix.length, 1184)
assert.equal(layers.length, 81)
assert.equal(widgets.length, 16)
assert.equal(specials.length, 3)
const all = [...matrix, ...layers, ...widgets, ...specials]
assert.equal(new Set(all.map(r => r.id)).size, 1284)
for (const row of layers) assert.ok(typeof row.minimumRemaining === 'string' && row.minimumRemaining.length)
const refSet = new Set(evidence.map(e => e.id))
for (const row of [...layers, ...widgets, ...specials]) for (const ref of row.evidenceRefs) assert.ok(refSet.has(ref), ref)
for (const s of segments) assert.ok(refSet.has(s.evidenceRef))
// Refuse drift only for the documents actually read, not Main's living source.
for (const input of inputs.values()) {
  const now = fs.readFileSync(path.join(root, input.path))
  assert.equal(crypto.createHash('sha256').update(now).digest('hex'), input.sha256, input.path)
}
fs.writeFileSync(output, `${JSON.stringify(out, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ output: out.execution.output, counts: out.counts, readDocuments: inputs.size,
  productOrGuiExecuted: false, released: true }))
