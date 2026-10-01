/**
 * Rotate engine — shared by RotateTool UI and the local-only lab.
 * Single source of truth: bytes in, bytes out. Callers own toasts/state.
 */
import { PDFDocument, degrees } from 'pdf-lib'

import { getProcessBytes } from './decryptInput'

export interface ToolEngineInput {
  file: File
  password?: string
  isLocked?: boolean
}

export interface ToolEngineResult {
  url: string
  size: number
  buffer: Uint8Array
  note?: string
}

export const rotatePdf = async (
  input: ToolEngineInput,
  rotations: Record<number, number>,
  createUrl: (blob: Blob) => string
): Promise<ToolEngineResult> => {
  const bytes = await getProcessBytes(input.file, input.password)
  const pdfDoc = await PDFDocument.load(bytes, { throwOnInvalidObject: false } as any)
  const pages = pdfDoc.getPages()
  pages.forEach((page, idx) => {
    const pageNum = idx + 1
    const rotationToAdd = rotations[pageNum] || 0
    if (rotationToAdd !== 0) {
      const currentRotation = page.getRotation().angle
      page.setRotation(degrees((currentRotation + rotationToAdd) % 360))
    }
  })
  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
  const buffer = new Uint8Array(await blob.arrayBuffer())
  return { url: createUrl(blob), size: blob.size, buffer }
}
