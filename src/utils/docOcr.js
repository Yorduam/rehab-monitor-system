
import { createWorker, PSM } from 'tesseract.js';
import { parseMrz, parseSnils } from './docParsers.js';

const MRZ_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<';
const DIGIT_CHARS = '0123456789 -';

const SCAN_WIDTH = 1200;
const LINE_HEIGHT = 60;
const MAX_CANVAS_WIDTH = 2600;

const assetBase = () => `${window.location.origin}/tesseract`;

let workerPromise = null;

function getWorker(onStage) {
  if (!workerPromise) {
    const base = assetBase();
    workerPromise = createWorker('eng', 1, {
      workerPath: `${base}/worker.min.js`,
      corePath: `${base}/core`,
      langPath: `${base}/lang`,
      gzip: true,
      logger: (m) => {
        if (m.status === 'loading tesseract core') onStage?.('Загружаю распознаватель…');
        else if (m.status === 'loading language traineddata') onStage?.('Загружаю языковые данные…');
      }
    }).catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

export async function disposeOcr() {
  if (!workerPromise) return;
  const w = await workerPromise.catch(() => null);
  workerPromise = null;
  await w?.terminate();
}

export function isSupportedScan(file) {
  return /^image\/(jpeg|png|webp|bmp)$/i.test(file?.type || '')
    || /\.(jpe?g|png|webp|bmp)$/i.test(file?.name || '');
}

async function fileToBitmap(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return createImageBitmap(file);
  }
}

function toGray(source, maxWidth) {
  const scale = Math.min(1, maxWidth / source.width);
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);

  const px = ctx.getImageData(0, 0, w, h).data;
  const g = new Uint8ClampedArray(w * h);
  for (let i = 0, p = 0; i < px.length; i += 4, p += 1) {
    g[p] = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000;
  }
  return { w, h, g };
}

function binarize({ w, h, g }, window, k) {
  const sums = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < w; x += 1) {
      rowSum += g[y * w + x];
      sums[(y + 1) * (w + 1) + x + 1] = sums[y * (w + 1) + x + 1] + rowSum;
    }
  }

  const r = Math.max(1, window >> 1);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x += 1) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w - 1, x + r);
      const area = (y1 - y0 + 1) * (x1 - x0 + 1);
      const sum = sums[(y1 + 1) * (w + 1) + x1 + 1] - sums[y0 * (w + 1) + x1 + 1]
        - sums[(y1 + 1) * (w + 1) + x0] + sums[y0 * (w + 1) + x0];
      out[y * w + x] = g[y * w + x] * area < sum * (1 - k) ? 1 : 0;
    }
  }
  return out;
}

const scanWindow = (h) => Math.max(15, Math.round(h * 0.03)) | 1;

function rowProfile(bin, w, h) {
  const solid = w * 0.6;
  const prof = new Uint32Array(h);
  for (let y = 0; y < h; y += 1) {
    let count = 0;
    const off = y * w;
    for (let x = 0; x < w; x += 1) count += bin[off + x];
    prof[y] = count > solid ? 0 : count;
  }
  return prof;
}

function textBands(prof, h) {
  const peak = Math.max(...prof);
  if (!peak) return [];

  const threshold = Math.max(2, peak * 0.22);
  const raw = [];
  let start = -1;
  for (let y = 0; y < h; y += 1) {
    if (prof[y] >= threshold) {
      if (start < 0) start = y;
    } else if (start >= 0) {
      raw.push([start, y - 1]);
      start = -1;
    }
  }
  if (start >= 0) raw.push([start, h - 1]);

  const merged = [];
  for (const band of raw) {
    const last = merged[merged.length - 1];
    if (last && band[0] - last[1] <= Math.max(4, (last[1] - last[0]) * 1.2)) last[1] = band[1];
    else merged.push([...band]);
  }
  return merged.filter(([a, b]) => b - a >= 3);
}

function textBlocks(bands, h) {
  const out = [];
  for (const [a, b] of bands) {
    const last = out[out.length - 1];
    if (last && a - last[1] <= h * 0.05) last[1] = b;
    else out.push([a, b]);
  }
  return out;
}

function mrzBlock({ gray, prof, bands }) {
  const lower = bands.filter(([a]) => a > gray.h * 0.45);
  let best = null;
  let bestInk = -1;
  for (const [a, b] of textBlocks(lower.length ? lower : bands, gray.h)) {
    let ink = 0;
    for (let y = a; y <= b; y += 1) ink += prof[y];
    if (ink > bestInk) {
      bestInk = ink;
      best = [a, b];
    }
  }
  return best;
}

function estimateSkew(bin, w, y0, y1) {
  let bestDeg = 0;
  let bestScore = -1;

  for (let deg = -10; deg <= 10; deg += 0.25) {
    const tan = Math.tan((deg * Math.PI) / 180);
    const acc = new Float64Array(y1 - y0 + 1);
    for (let y = y0; y <= y1; y += 1) {
      const off = y * w;
      for (let x = 0; x < w; x += 2) {
        if (!bin[off + x]) continue;
        const yy = Math.round(y - (x - w / 2) * tan) - y0;
        if (yy >= 0 && yy < acc.length) acc[yy] += 1;
      }
    }
    let score = 0;
    for (const v of acc) score += v * v;
    if (score > bestScore) {
      bestScore = score;
      bestDeg = deg;
    }
  }
  return bestDeg;
}

function rotate(bitmap, deg) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = Math.ceil(bitmap.width * cos + bitmap.height * sin);
  const h = Math.ceil(bitmap.width * sin + bitmap.height * cos);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-rad);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  return canvas;
}

function cutStrip(source, top, height, targetHeight) {
  const sy = Math.max(0, Math.round(top));
  const sh = Math.max(1, Math.min(source.height - sy, Math.round(height)));
  const scale = Math.min(targetHeight / sh, MAX_CANVAS_WIDTH / source.width, 4);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, sy, source.width, sh, 0, 0, canvas.width, canvas.height);

  const gray = toGray(canvas, canvas.width);
  const bin = binarize(gray, 31, 0.14);
  const img = ctx.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < bin.length; i += 1) {
    const v = bin[i] ? 0 : 255;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function analyze(source) {
  const gray = toGray(source, SCAN_WIDTH);
  const bin = binarize(gray, scanWindow(gray.h), 0.16);
  const prof = rowProfile(bin, gray.w, gray.h);
  return { gray, bin, prof, bands: textBands(prof, gray.h) };
}

function skewOf(source) {
  const info = analyze(source);
  const block = mrzBlock(info);
  if (!block) return 0;
  return estimateSkew(info.bin, info.gray.w, block[0], block[1]);
}

function deskew(bitmap) {
  let page = rotate(bitmap, skewOf(bitmap));
  const residual = skewOf(page);
  if (Math.abs(residual) >= 0.25) page = rotate(page, residual);
  return page;
}

function mrzStrips(page) {
  const info = analyze(page);
  const k = page.height / info.gray.h;
  const strips = [];

  const block = mrzBlock(info);
  if (block) {
    const height = block[1] - block[0];
    const pad = Math.max(6, height * 0.35);
    strips.push(() => cutStrip(page, (block[0] - pad) * k, (height + 2 * pad) * k, 2 * LINE_HEIGHT + 2 * pad * k));
  }

  strips.push(() => cutStrip(page, page.height * 0.62, page.height * 0.38, 6 * LINE_HEIGHT));
  strips.push(() => cutStrip(page, 0, page.height, 14 * LINE_HEIGHT));
  return strips;
}

async function readText(canvas, whitelist, mode, onStage) {
  const worker = await getWorker(onStage);
  onStage?.('Читаю документ…');
  await worker.setParameters({
    tessedit_char_whitelist: whitelist,
    tessedit_pageseg_mode: mode
  });
  const { data } = await worker.recognize(canvas);
  return data.text || '';
}

export async function recognizePassport(file, onStage) {
  const bitmap = await fileToBitmap(file);
  try {
    onStage?.('Выравниваю снимок…');
    const page = deskew(bitmap);

    let found = null;
    for (const strip of mrzStrips(page)) {
      const text = await readText(strip(), MRZ_CHARS, PSM.SINGLE_BLOCK, onStage);
      const mrz = parseMrz(text);
      if (!mrz) continue;
      if (!found) found = mrz;
      else for (const key of Object.keys(found)) found[key] = found[key] || mrz[key];
      if (Object.values(found).every((v) => v)) break;
    }
    return found;
  } finally {
    bitmap.close?.();
  }
}

export async function recognizeSnils(file, onStage) {
  const bitmap = await fileToBitmap(file);
  try {
    onStage?.('Выравниваю снимок…');
    const page = deskew(bitmap);
    const strip = cutStrip(page, 0, page.height, 10 * LINE_HEIGHT);
    const text = await readText(strip, DIGIT_CHARS, PSM.SINGLE_BLOCK, onStage);
    return parseSnils(text);
  } finally {
    bitmap.close?.();
  }
}
