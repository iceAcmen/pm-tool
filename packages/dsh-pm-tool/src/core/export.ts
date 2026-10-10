/** 报告文件导出：默认写到产品仓库 exports/，不进入 storage-domain。 */
import { link, mkdir, rename, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PmDomain } from './storage.js'
import { collectProjectReport, renderProjectMarkdown } from './report.js'

export const defaultExportDirectory = fileURLToPath(new URL('../../../../exports/', import.meta.url))

export class ExportFileExistsError extends Error {
  constructor(readonly path: string) {
    super(`导出文件已存在：${path}`)
    this.name = 'ExportFileExistsError'
  }
}

function expandDirectory(directory: string | undefined): string {
  if (!directory) return defaultExportDirectory
  const expanded = directory === '~'
    ? homedir()
    : directory.startsWith('~/')
      ? resolve(homedir(), directory.slice(2))
      : directory
  return isAbsolute(expanded) ? resolve(expanded) : resolve(defaultExportDirectory, '..', expanded)
}

export async function writeExportFile(
  target: string,
  content: string,
  overwrite: boolean,
): Promise<void> {
  const outputDirectory = resolve(target, '..')
  await mkdir(outputDirectory, { recursive: true, mode: 0o700 })
  const temporary = resolve(
    outputDirectory,
    `.${target.split('/').at(-1)}.${process.pid}.${Date.now()}.tmp`,
  )
  await writeFile(temporary, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
  try {
    if (overwrite) {
      await rename(temporary, target)
    } else {
      try {
        await link(temporary, target)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new ExportFileExistsError(target)
        throw error
      }
      await unlink(temporary).catch(() => {})
    }
  } catch (error) {
    await unlink(temporary).catch(() => {})
    throw error
  }
}

export async function exportProjectMarkdown(
  domain: PmDomain,
  projectId: string,
  directory?: string,
  overwrite = false,
): Promise<{ path: string, content: string }> {
  const report = collectProjectReport(domain, projectId)
  const content = renderProjectMarkdown(report)
  const outputDirectory = expandDirectory(directory)
  const target = resolve(outputDirectory, `${report.project.id}-report.md`)
  await writeExportFile(target, content, overwrite)
  return { path: target, content }
}

export function resolveExportPath(directory: string | undefined, filename: string): string {
  return resolve(expandDirectory(directory), filename)
}
