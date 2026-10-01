/**
 * Unlock engine — shared by UnlockTool UI and the local-only lab.
 * Single source of truth: bytes in, bytes out. Callers own toasts/state.
 */
import { PDFDocument } from 'pdf-lib'

import { getPdfMetaData, unlockPdf, destroyPdf } from './pdfHelpers'
import { decryptInput } from './decryptInput'
import type { ToolEngineInput, ToolEngineResult } from './rotateEngines'

export const unlockPdfFile = async (
  input: ToolEngineInput,
  password: string | undefined,
  createUrl: (blob: Blob) => string
): Promise<ToolEngineResult> => {
  const sourceName = input.file.name
  const locked = input.isLocked ?? (await getPdfMetaData(input.file)).isLocked
  if (!locked) {
    const original = new Uint8Array(await input.file.arrayBuffer())
    const blob = new Blob([original as any], { type: 'application/pdf' })
    return { url: createUrl(blob), size: blob.size, buffer: original, note: 'File was already unlocked (byte-identical)' }
  }
  if (!password) throw new Error(`Password required for "${sourceName}".`)
  const probe = await unlockPdf(input.file, password)
  if (!probe.success || !probe.pdfDoc) throw new Error(`Incorrect password for "${sourceName}".`)
  const expectedPages = probe.pageCount
  await destroyPdf(probe.pdfDoc)
  const raw = new Uint8Array(await input.file.arrayBuffer())
  const pdfBytes = await decryptInput(raw, password, sourceName)
  let check
  try {
    check = await PDFDocument.load(pdfBytes, { throwOnInvalidObject: false } as any)
  } catch {
    throw new Error(`"${sourceName}" unlocked copy failed verification.`)
  }
  if (check.getPageCount() !== expectedPages) throw new Error(`"${sourceName}" unlocked copy failed verification.`)
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
  const buffer = new Uint8Array(await blob.arrayBuffer())
  return { url: createUrl(blob), size: blob.size, buffer, note: 'Encryption removed, page count verified' }
}
