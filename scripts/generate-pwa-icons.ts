import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// CRC32 lookup table (PNG chunk integrity)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u32(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const crc = crc32(Buffer.concat([typeBytes, data]));
  return Buffer.concat([u32(data.length), typeBytes, data, u32(crc)]);
}

function buildPNG(width: number, height: number, pixels: Uint8Array): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.concat([
    u32(width),
    u32(height),
    Buffer.from([8, 2, 0, 0, 0]), // 8-bit RGB, no interlace
  ]);
  const ihdr = pngChunk("IHDR", ihdrData);

  // Each row: 1 filter byte (0=None) + RGB pixels
  const rawSize = height * (1 + width * 3);
  const raw = Buffer.alloc(rawSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = (y * width + x) * 3;
      raw[rowOffset + 1 + x * 3 + 0] = pixels[pxOffset + 0];
      raw[rowOffset + 1 + x * 3 + 1] = pixels[pxOffset + 1];
      raw[rowOffset + 1 + x * 3 + 2] = pixels[pxOffset + 2];
    }
  }

  const idat = pngChunk("IDAT", deflateSync(raw));
  const iend = pngChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function generateIcon(size: number): Buffer {
  const pixels = new Uint8Array(size * size * 3);

  // Dark premium background: #141518
  const bgR = 0x14,
    bgG = 0x15,
    bgB = 0x18;
  // Accent red: #e0223a
  const fgR = 0xe0,
    fgG = 0x22,
    fgB = 0x3a;

  // Inner rounded square (20% padding each side, 22% inner radius)
  const pad = Math.round(size * 0.2);
  const inner = size - pad * 2;
  const rad = Math.round(inner * 0.22);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3;
      const ix = x - pad;
      const iy = y - pad;

      let isFg = false;
      if (ix >= 0 && ix < inner && iy >= 0 && iy < inner) {
        const cx = Math.min(ix, inner - 1 - ix);
        const cy = Math.min(iy, inner - 1 - iy);
        const inCorner = cx < rad && cy < rad;
        const outsideArc =
          inCorner && (cx - rad) * (cx - rad) + (cy - rad) * (cy - rad) > rad * rad;
        isFg = !outsideArc;
      }

      pixels[idx + 0] = isFg ? fgR : bgR;
      pixels[idx + 1] = isFg ? fgG : bgG;
      pixels[idx + 2] = isFg ? fgB : bgB;
    }
  }

  return buildPNG(size, size, pixels);
}

const ICONS_DIR = join(process.cwd(), "public", "icons");
mkdirSync(ICONS_DIR, { recursive: true });

for (const size of [192, 512]) {
  const data = generateIcon(size);
  const path = join(ICONS_DIR, `icon-${size}.png`);
  writeFileSync(path, data);
  console.log(`✓ icon-${size}.png  (${data.length} bytes)`);
}
