/**
 * Page-number engine — shared by PageNumberTool UI and the local-only lab.
 * Single source of truth: bytes in, bytes out. Callers own toasts/state.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

import { getProcessBytes } from './decryptInput'
import type { ToolEngineInput, ToolEngineResult } from './rotateEngines'

export type PageNumberPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface PageNumberSettings {
  format: string
  position: PageNumberPosition
}

const START_FROM = 1
const FONT_SIZE = 12
const COLOR = '#6B7280'

export const numberPages = async (
  input: ToolEngineInput,
  settings: PageNumberSettings,
  createUrl: (blob: Blob) => string
): Promise<ToolEngineResult> => {
  const { format, position } = settings
  const bytes = await getProcessBytes(input.file, input.password)
  const pdfDoc = await PDFDocument.load(bytes, { throwOnInvalidObject: false } as any)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const pages = pdfDoc.getPages()
  const textColor = hexToRgb(COLOR)
  pages.forEach((page, idx) => {
    const { width, height } = page.getSize()
    const n = idx + START_FROM
    const total = pages.length + (START_FROM - 1)
    const label = format.replace('{n}', n.toString()).replace('{total}', total.toString())
    const textWidth = font.widthOfTextAtSize(label, FONT_SIZE)
    const margin = 30
    let x = width / 2 - textWidth / 2
    let y = margin
    if (position.includes('left')) x = margin
    if (position.includes('right')) x = width - textWidth - margin
    if (position.includes('top')) y = height - margin - FONT_SIZE
    page.drawText(label, { x, y, size: FONT_SIZE, font, color: textColor })
  })
  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
  const buffer = new Uint8Array(await blob.arrayBuffer())
  return { url: createUrl(blob), size: blob.size, buffer }
}

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}
