/**
 * R 旅程返修：任务抽屉「取消」干净态必须真正关闭（C/T 静态合同门，不渲染、不写库）。
 * 锁死：干净表单点取消经 tryClose() 返回 true 后调用 onCancel 关闭；dirty 仍走 confirmDanger
 * 异步确认后 onCancel；ESC/X/scrim 统一守卫注册不变。R 像素/交互采证由正式运行态完成，本测试不替代截图。
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const panel = readFileSync(join(here, 'panel.tsx'), 'utf8')

describe('任务抽屉取消关闭合同（panel.tsx）', () => {
  it('footer 取消：tryClose() 返回 true（干净）时调用 onCancel() 关闭，不再丢弃返回值', () => {
    expect(panel).toMatch(/onClick=\{\(\)\s*=>\s*\{\s*if \(tryClose\(\)\) onCancel\(\)\s*\}\}>取消<\/button>/)
  })

  it('dirty 守卫：mustConfirm 时仍弹「放弃未保存修改？」，确认后才 onCancel', () => {
    expect(panel).toContain('放弃未保存修改？')
    expect(panel).toContain("confirmLabel: '放弃修改'")
    expect(panel).toMatch(/confirmDanger\(\{[\s\S]*?\}\)\.then\(ok => \{ if \(ok\) onCancel\(\) \}\)/)
  })

  it('干净分支：非 mustConfirm 直接放行返回 true（由调用方/守卫关闭）', () => {
    expect(panel).toMatch(/if \(!mustConfirm\) return true/)
  })

  it('关闭守卫仍向抽屉壳注册，ESC/X/scrim 不绕过 dirty 确认', () => {
    expect(panel).toContain('registerGuard?.(tryClose)')
    expect(panel).toContain('beforeClose={() => (closeGuardRef.current ? closeGuardRef.current() : true)}')
  })

  it('回归：提交/删除/AI 确认入库能力保留，未被取消返修改动', () => {
    expect(panel).toContain('保存更改')
    expect(panel).toContain('添加任务')
    expect(panel).toContain('确认级联删除')
    expect(panel).toContain('显式确认才落库')
  })
})
