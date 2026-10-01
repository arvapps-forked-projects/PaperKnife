// One-time vendoring of the OCR engine files into public/tesseract/.
//
// Matches tesseract.js v7 (see package.json). Run: npm run vendor:ocr
// - worker + core come from node_modules (plain npm ci, no extra download)
// - only eng.traineddata downloads (tessdata 4.0.0, uncompressed to match gzip:false)
// Never committed (binaries stay out of git) and never in the lite APK
// (the recipe strips public/tesseract/). Safe for reproducible builds:
// same inputs (package-lock + traineddata URL) produce the same bytes.
import { cp, mkdir, writeFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'tesseract')
const nm = join(root, 'node_modules')

const fromModules = [
  ['tesseract.js', 'dist/worker.min.js', 'worker.min.js'],
  ['tesseract.js-core', 'tesseract-core.wasm.js', 'tesseract-core.wasm.js'],
  ['tesseract.js-core', 'tesseract-core.wasm', 'tesseract-core.wasm'],
]

await mkdir(out, { recursive: true })
for (const [pkg, src, dest] of fromModules) {
  await cp(join(nm, pkg, src), join(out, dest))
  console.log(`copied ${pkg}/${src} -> public/tesseract/${dest}`)
}

const trained = join(out, 'eng.traineddata')
if (!existsSync(trained)) {
  console.log('downloading eng.traineddata.gz ...')
  const res = await fetch('https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0/eng.traineddata.gz')
  if (!res.ok) throw new Error(`traineddata download failed: HTTP ${res.status}`)
  const gz = Buffer.from(await res.arrayBuffer())
  await writeFile(trained, gunzipSync(gz))
  console.log('wrote public/tesseract/eng.traineddata')
} else {
  console.log('eng.traineddata already present, skipping download')
}

for (const f of ['worker.min.js', 'tesseract-core.wasm.js', 'tesseract-core.wasm', 'eng.traineddata']) {
  const bytes = statSync(join(out, f)).size
  console.log(`${f}: ${(bytes / 1024 / 1024).toFixed(2)} MB`)
}
console.log('OCR assets ready in public/tesseract/')
