import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let k = 0; k < 8; k++) {
      const m = crc & 1
      crc = (crc >>> 1) ^ (m ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  const c = crc32(Buffer.concat([typeBuf, data]))
  crc.writeUInt32BE(c, 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function pngRgba(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rowSize = 1 + width * 4
  const raw = Buffer.alloc(rowSize * height)
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0
    rgba.copy(raw, y * rowSize + 1, y * width * 4, (y + 1) * width * 4)
  }

  const idat = deflateSync(raw, { level: 9 })
  const iend = Buffer.alloc(0)
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', iend)])
}

function clamp8(n) {
  if (n < 0) return 0
  if (n > 255) return 255
  return n | 0
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function drawMaskable(size) {
  const bg = { r: 5, g: 6, b: 11, a: 255 }
  const gold = { r: 242, g: 201, b: 76, a: 255 }
  const cyan = { r: 46, g: 231, b: 255, a: 255 }

  const buf = Buffer.alloc(size * size * 4)
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const r0 = size * 0.34
  const r1 = size * 0.39
  const r2 = size * 0.42

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy)

      let r = bg.r
      let g = bg.g
      let b = bg.b
      let a = bg.a

      if (d <= r0) {
        const t = Math.min(1, d / r0)
        r = clamp8(lerp(gold.r, 255, 0.07 * (1 - t)))
        g = clamp8(lerp(gold.g, 255, 0.07 * (1 - t)))
        b = clamp8(lerp(gold.b, 255, 0.07 * (1 - t)))
        a = 255
      } else if (d <= r1) {
        const t = (d - r0) / Math.max(1e-6, r1 - r0)
        r = clamp8(lerp(gold.r, cyan.r, t))
        g = clamp8(lerp(gold.g, cyan.g, t))
        b = clamp8(lerp(gold.b, cyan.b, t))
        a = 255
      } else if (d <= r2) {
        const t = (d - r1) / Math.max(1e-6, r2 - r1)
        r = clamp8(lerp(cyan.r, bg.r, t))
        g = clamp8(lerp(cyan.g, bg.g, t))
        b = clamp8(lerp(cyan.b, bg.b, t))
        a = 255
      }

      const i = (y * size + x) * 4
      buf[i] = r
      buf[i + 1] = g
      buf[i + 2] = b
      buf[i + 3] = a
    }
  }

  return pngRgba(size, size, buf)
}

const root = dirname(fileURLToPath(import.meta.url))
const outDir = join(root, '..', 'app', 'public')
writeFileSync(join(outDir, 'icon-maskable-192.png'), drawMaskable(192))
writeFileSync(join(outDir, 'icon-maskable-512.png'), drawMaskable(512))
