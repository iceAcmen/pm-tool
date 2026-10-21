/**
 * 面板视图模型（纯，路径 B）：状态机快照 → 可渲染视图，与容器解耦。
 * S3 不宣称成功；S4 仅由受认证工作台权威 nonce 回告到达；S5 由用户反馈触发；S6 安全失败层级。
 */

/**
 * @param {{status:string,step:number,browser?:string,detail?:object,confirmed?:boolean}} state
 * @param {{browsers?:string[],selectedBrowser?:string,theme?:string}} ctx
 */
export function buildPanelViewModel(state, ctx = {}) {
  const browsers = ctx.browsers ?? []
  const selectedBrowser = ctx.selectedBrowser ?? '系统默认浏览器'
  const theme = ctx.theme ?? 'light'
  const base = { browsers, selectedBrowser, theme, view: state.status }

  switch (state.status) {
    case 'S2':
      return {
        ...base,
        title: '正在打开工作台',
        subtitle: '完成后将在所选浏览器打开；可取消，取消不会停止已有服务。',
        steps: ['检查本地服务', '准备工作台', '打开浏览器'].map((label, i) => ({
          label,
          state: i < state.step ? 'done' : i === state.step ? 'active' : 'todo',
        })),
        progress: [24, 63, 88][state.step] ?? 0,
        actions: [{ id: 'cancel', label: '取消打开', kind: 'secondary' }],
      }
    case 'S3':
      return {
        ...base,
        title: '已在浏览器投递，等待已进入回告',
        subtitle: '等待受认证工作台 mount 后回告；启动器不自动判定已登录、不以按钮冒充成功，也不重放进程启动令牌。',
        actions: [
          { id: 'report-auth-error', label: '看到登录 / 认证错误', kind: 'secondary' },
          { id: 'switch-browser', label: '更换浏览器', kind: 'text' },
        ],
      }
    case 'S4':
      return {
        ...base,
        title: '工作台已打开',
        subtitle: `已由受认证工作台回告进入${state.browser ? `（${state.browser}）` : ''}，可以开始工作了。`,
        confirmed: true,
        actions: [
          { id: 'reopen', label: '再次打开', kind: 'primary' },
          { id: 'switch-browser', label: '更换浏览器', kind: 'text' },
        ],
      }
    case 'S5':
      return {
        ...base,
        title: '已打开，但当前浏览器未登录',
        subtitle: '该浏览器没有本机服务签发的签名 cookie；启动器不重放进程启动令牌、不注入会话。',
        detail: state.detail ?? null,
        actions: [
          { id: 'finish-login', label: '在该标签页完成登录', kind: 'primary' },
          { id: 'switch-browser', label: '换用已登录的浏览器', kind: 'secondary' },
          { id: 'toggle-detail', label: '查看详情', kind: 'text' },
        ],
      }
    case 'S6':
      return {
        ...base,
        title: '暂时无法打开',
        subtitle: state.detail?.detection ?? '本地服务暂不可用。',
        detail: state.detail ?? null,
        safeLine: '没有停止任何程序，项目数据和现有服务保持不变。',
        actions: [
          { id: 'retry', label: '重新尝试', kind: 'primary' },
          { id: 'toggle-detail', label: '查看详情', kind: 'secondary' },
          { id: 'back', label: '返回启动入口', kind: 'text' },
        ],
      }
    case 'S1':
      return {
        ...base,
        title: '工作台已在运行',
        subtitle: '将打开现有服务，不重复启动；复用依赖该浏览器既有登录态。',
        statusDot: 'ok',
        actions: [{ id: 'open', label: '打开 PM 工作台', kind: 'primary' }],
      }
    case 'S0':
    default:
      return {
        ...base,
        title: '工作台尚未启动',
        subtitle: '点击打开后，自动启动本地服务。',
        statusDot: 'off',
        actions: [{ id: 'open', label: '打开 PM 工作台', kind: 'primary' }],
      }
  }
}
