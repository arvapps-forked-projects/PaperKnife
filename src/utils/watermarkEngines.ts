/**
 * Watermark engine — shared by WatermarkTool UI and the local-only lab.
 * Single source of truth: bytes in, bytes out. Callers own toasts/state.
 */
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'

import { getProcessBytes } from './decryptInput'
import type { ToolEngineInput, ToolEngineResult } from './rotateEngines'

export interface WatermarkSettings {
  text: string
  opacity: number
  fontSize: number
  rotation: number
  color: string
}

export const watermarkPdf = async (
  input: ToolEngineInput,
  settings: WatermarkSettings,
  createUrl: (blob: Blob) => string
): Promise<ToolEngineResult> => {
  const { text, opacity, fontSize, rotation, color } = settings
  const bytes = await getProcessBytes(input.file, input.password)
  const pdfDoc = await PDFDocument.load(bytes, { throwOnInvalidObject: false } as any)
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const pages = pdfDoc.getPages()
  const watermarkColor = hexToRgb(color)

  pages.forEach(page => {
    const { width, height } = page.getSize()
    // Center the text on the page: pdf-lib draws from the unrotated
    // baseline start and rotates about it (CSS preview rotates about the
    // center, clockwise-positive), so offset by half the advance along
    // the rotated axis and negate the angle to match the preview.
    const tw = font.widthOfTextAtSize(text, fontSize)
    const rad = (-rotation * Math.PI) / 180
    const cap = font.heightAtSize(fontSize) * 0.35
    const x = width / 2 - (tw / 2) * Math.cos(rad) + cap * Math.sin(rad)
    const y = height / 2 - (tw / 2) * Math.sin(rad) - cap * Math.cos(rad)
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: watermarkColor,
      opacity,
      rotate: degrees(-rotation)
    })
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
