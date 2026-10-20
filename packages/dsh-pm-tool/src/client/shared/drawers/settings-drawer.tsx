/**
 * G-D 口径设置抽屉（13 字段三组 + 绿≥黄灯交叉校验）。
 *
 * 行为/数据逻辑与原 panel.tsx 内联 SettingsPanel 完全一致：
 * - 整数区间就近红框，错误保留已输入值（不清空）；
 * - 交叉约束：绿灯线 >= 黄灯线，违反时绿字段标红；
 * - 保存/恢复默认走 execute 命令通道，失败保输入、仅提示。
 * 纯校验抽到模块级 `validateSettingsValues` 以便单测，组件不改写用户输入。
 */
import { useState } from 'react'
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw.mjs'
import {
  DEFAULT_PROJECT_SETTINGS,
  SETTING_FIELDS,
  sameSettings,
  type ProjectSettings,
} from '../../../core/settings.js'

/** 纯校验：返回 { key: 错误文案 }；不修改入参，便于失败保输入与单测。 */
export function validateSettingsValues(
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of SETTING_FIELDS) {
    const raw = values[f.key] ?? ''
    const n = Number(raw)
    if (raw.trim() === '' || !Number.isInteger(n) || Number.isNaN(n)) {
      errors[f.key] = `须为 ${f.min}~${f.max} 的整数`
      continue
    }
    if (n < f.min || n > f.max) {
      errors[f.key] = `须为 ${f.min}~${f.max}（当前 ${n}）`
    }
  }
  // 交叉约束：绿灯线 ≥ 黄灯线。
  const green = Number(values.healthGreenAt)
  const yellow = Number(values.healthYellowAt)
  if (!Number.isNaN(green) && !Number.isNaN(yellow) && green < yellow) {
    errors.healthGreenAt = '绿灯线不得低于黄灯线'
  }
  return errors
}

export interface SettingsDrawerProps {
  settings: ProjectSettings
  execute: (line: string) => Promise<string>
  disabled: boolean
  onSaved: () => void
  notify: (msg: string) => void
}

export function SettingsPanel({ settings, execute, disabled, onSaved, notify }: SettingsDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(SETTING_FIELDS.map(f => [f.key, String(settings[f.key])])),
  )
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [busy, setBusy] = useState(false)

  const isDefault = sameSettings(settings, DEFAULT_PROJECT_SETTINGS)
  const groups: Array<SettingFieldMetaGroup> = ['健康分', '临期窗口', '人员负载']

  const validateAll = (): boolean => {
    const next = validateSettingsValues(values)
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const collect = (): Partial<ProjectSettings> => {
    const out: Partial<ProjectSettings> = {}
    for (const f of SETTING_FIELDS) {
      out[f.key] = Number(values[f.key])
    }
    return out
  }

  const save = async () => {
    if (busy) return
    if (!validateAll()) { notify('口径未通过校验，请修正标红字段后再保存。'); return }
    setBusy(true)
    try {
      const payload = JSON.stringify(collect())
      const resp = await execute(`settings put ${payload}`)
      if (/失败|错误|未通过|非法|需为|不得低于/.test(resp)) { notify(resp); return }
      notify('已保存口径设置。')
      onSaved()
    } catch (e) {
      notify(`保存失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const resetAll = async () => {
    if (busy) return
    setBusy(true)
    try {
      const resp = await execute('settings reset')
      if (/失败|错误/.test(resp)) { notify(resp); return }
      notify('已恢复全部默认口径。')
      onSaved()
    } catch (e) {
      notify(`恢复默认失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pm-settings-root">
      <p className="pm-settings-note">
        {isDefault ? '当前为默认口径（与配置化前逐值一致）。' : '当前为自定义口径；改动即时作用于健康分、临期提醒、人员负载与作战室。'}
      </p>
      {groups.map(group => (
        <section className="pm-settings-group" key={group}>
          <h3 className="pm-settings-group-title">{group}</h3>
          <div className="pm-settings-grid">
            {SETTING_FIELDS.filter(f => f.group === group).map(f => {
              const err = errors[f.key]
              const def = DEFAULT_PROJECT_SETTINGS[f.key]
              const v = values[f.key]
              const changed = Number(v) !== def
              return (
                <label className="pm-field" key={f.key} data-wide={f.group === '健康分'} data-invalid={!!err}>
                  <span>{f.label}{changed ? <em className="pm-settings-custom">（默认 {def}{f.unit}）</em> : null}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={v}
                    aria-label={f.label}
                    onChange={(e) => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                  <small className="pm-settings-hint">{f.hint}（{f.min}~{f.max}{f.unit}）</small>
                  {err && <span className="pm-field-error">{err}</span>}
                </label>
              )
            })}
          </div>
        </section>
      ))}
      <div className="pm-drawer-actions">
        <button type="button" className="pm-button pm-button-danger" disabled={disabled || busy} onClick={() => void resetAll()}>
          <RotateCcw size={14}/>恢复默认
        </button>
        <button type="button" className="pm-button pm-top-secondary" disabled={disabled || busy} onClick={() => void save()}>
          保存口径
        </button>
      </div>
    </div>
  )
}

type SettingFieldMetaGroup = '健康分' | '临期窗口' | '人员负载'
