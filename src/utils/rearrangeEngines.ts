/**
 * Rearrange engine — shared by RearrangeTool UI and the local-only lab.
 * Single source of truth: bytes in, bytes out. Callers own toasts/state.
 */
import { PDFDocument } from 'pdf-lib'

import { getProcessBytes } from './decryptInput'
import type { ToolEngineInput, ToolEngineResult } from './rotateEngines'

export const reorderPdf = async (
  input: ToolEngineInput,
  order: number[],
  createUrl: (blob: Blob) => string
): Promise<ToolEngineResult> => {
  const bytes = await getProcessBytes(input.file, input.password)
  const pdfDoc = await PDFDocument.load(bytes, { throwOnInvalidObject: false } as any)
  const newPdf = await PDFDocument.create()
  const copiedPages = await newPdf.copyPages(pdfDoc, order)
  copiedPages.forEach(page => newPdf.addPage(page))
  const pdfBytes = await newPdf.save()
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
  const buffer = new Uint8Array(await blob.arrayBuffer())
  return { url: createUrl(blob), size: blob.size, buffer }
}
