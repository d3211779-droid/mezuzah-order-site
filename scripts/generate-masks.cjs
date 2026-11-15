/**
 * Builds the two alpha masks the live colour preview needs for every model photo:
 *   <id>-body.png  - silhouette of the mezuzah (so body colour never leaks onto the background)
 *   <id>-fill.png  - the engraved design area (so fill colour stays inside the cut-out)
 *
 * The original JPEGs are never modified. The photos have no transparency and a baked-in
 * checkerboard background, so the silhouette is a hand-measured polygon per image and the
 * design area is found automatically from the (contrast-stretched) shading.
 *
 * Usage:  node scripts/generate-masks.cjs [--debug <dir>]
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const IMG_DIR = path.join(__dirname, "..", "public", "images", "mezuzahs");
const OUT_DIR = path.join(IMG_DIR, "masks");
const N = 1024;
const debugIdx = process.argv.indexOf("--debug");
const DEBUG_DIR = debugIdx > -1 ? process.argv[debugIdx + 1] : null;

/**
 * silhouette: polygon of the whole mezuzah (source pixels)
 * side:       polygon of the dark side face that must never count as "design"
 * mode:       "dark"     design = very dark engraved pixels (holes)
 *             "enclosed" design = areas enclosed by the engraved outline
 * t:          darkness threshold on the contrast-stretched image (0-255)
 */
const MODELS = {
  "flame-large": {
    silhouette: [[409, 117], [470, 113], [591, 118], [588, 915], [473, 939], [410, 922]],
    side: [[405, 100], [472, 100], [473, 945], [405, 930]],
    mode: "dark", t: 30,
  },
  "flame-small": {
    silhouette: [[447, 93], [594, 95], [631, 142], [605, 500], [572, 934], [526, 945], [360, 939], [402, 510]],
    side: [[594, 90], [640, 140], [575, 940], [526, 950]],
    mode: "dark", t: 30,
  },
  "flame-side-large": {
    silhouette: [[376, 63], [603, 63], [596, 500], [595, 948], [489, 990], [379, 926]],
    side: null,
    mode: "dark", t: 22, close: 2, box: [390, 120, 596, 640],
  },
  "flame-side-small": {
    silhouette: [[405, 72], [439, 62], [598, 61], [631, 70], [609, 519], [586, 945], [489, 977], [378, 925], [390, 519]],
    side: null,
    mode: "dark", t: 22, close: 3, box: [395, 130, 620, 520],
  },
  "shin-large": {
    silhouette: [[407, 79], [615, 79], [611, 300], [609, 958], [537, 974], [399, 943], [403, 500]],
    side: [[544, 70], [620, 70], [612, 960], [537, 980]],
    mode: "enclosed", t: 25, box: [395, 150, 575, 830],
  },
  "shin-regular-large": {
    silhouette: [[397, 83], [450, 69], [592, 72], [596, 100], [592, 500], [592, 962], [466, 983], [397, 943]],
    side: [[390, 60], [453, 60], [466, 990], [390, 950]],
    mode: "enclosed", t: 25, box: [400, 150, 600, 800],
  },
  "shin-regular-small": {
    silhouette: [[407, 100], [453, 77], [588, 84], [598, 90], [598, 950], [505, 968], [407, 940]],
    side: [[400, 70], [459, 70], [460, 965], [400, 945]],
    mode: "dark", t: 30, box: [440, 140, 600, 520],
  },
  "shin-small": {
    silhouette: [[369, 76], [388, 62], [560, 62], [594, 76], [592, 500], [589, 954], [480, 985], [370, 962]],
    side: [[360, 60], [444, 60], [444, 990], [360, 970]],
    mode: "dark", t: 14, close: 3, box: [430, 110, 600, 660],
  },
  "shin-smallest": {
    silhouette: [[393, 112], [538, 94], [609, 112], [609, 927], [543, 953], [393, 925]],
    side: null,
    mode: "enclosed", t: 25, box: [400, 130, 600, 720],
  },
};

const idx = (x, y) => y * N + x;
const cfgRound = (cfg) => (cfg.close ? 4 : 1);

async function rasterPolygon(poly) {
  if (!poly) return new Uint8Array(N * N);
  const pts = poly.map((p) => p.join(",")).join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}"><rect width="${N}" height="${N}" fill="black"/><polygon points="${pts}" fill="white"/></svg>`;
  const { data } = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true });
  const out = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) out[i] = data[i] > 127 ? 1 : 0;
  return out;
}

/** Square-structuring-element morphology (separable). Outside the image counts as 0 (dilate) / 1 (erode). */
function morph(src, r, grow) {
  const pass = (input, horizontal) => {
    const out = new Uint8Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let v = grow ? 0 : 1;
        for (let k = -r; k <= r; k++) {
          const xx = horizontal ? x + k : x;
          const yy = horizontal ? y : y + k;
          const s = xx < 0 || xx >= N || yy < 0 || yy >= N ? (grow ? 0 : 1) : input[idx(xx, yy)];
          if (grow ? s === 1 : s === 0) { v = grow ? 1 : 0; break; }
        }
        out[idx(x, y)] = v;
      }
    }
    return out;
  };
  return pass(pass(src, true), false);
}
const dilate = (s, r) => morph(s, r, true);
const erode = (s, r) => morph(s, r, false);

/** Connected components (4-neighbour). Returns label array + per-label size. */
function components(mask) {
  const label = new Int32Array(N * N);
  const sizes = [];
  const stack = [];
  for (let s = 0; s < N * N; s++) {
    if (!mask[s] || label[s]) continue;
    const id = sizes.length + 1;
    let size = 0;
    stack.push(s);
    label[s] = id;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % N, y = (p / N) | 0;
      if (x > 0 && mask[p - 1] && !label[p - 1]) { label[p - 1] = id; stack.push(p - 1); }
      if (x < N - 1 && mask[p + 1] && !label[p + 1]) { label[p + 1] = id; stack.push(p + 1); }
      if (y > 0 && mask[p - N] && !label[p - N]) { label[p - N] = id; stack.push(p - N); }
      if (y < N - 1 && mask[p + N] && !label[p + N]) { label[p + N] = id; stack.push(p + N); }
    }
    sizes.push(size);
  }
  return { label, sizes };
}

async function loadStretched(file) {
  const { data } = await sharp(path.join(IMG_DIR, file + ".jpg")).greyscale().raw().toBuffer({ resolveWithObject: true });
  const g = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) g[i] = Math.max(0, Math.min(255, Math.round(((data[i] - 222) * 255) / 33)));
  return g;
}

/** Mean of the values inside the mask, over a (2r+1) window; used as the local face brightness. */
function maskedMean(values, mask, r) {
  const W = N + 1;
  const sum = new Float64Array(W * W), cnt = new Float64Array(W * W);
  for (let y = 0; y < N; y++) {
    let rs = 0, rc = 0;
    for (let x = 0; x < N; x++) {
      const i = idx(x, y);
      if (mask[i]) { rs += values[i]; rc += 1; }
      sum[(y + 1) * W + x + 1] = sum[y * W + x + 1] + rs;
      cnt[(y + 1) * W + x + 1] = cnt[y * W + x + 1] + rc;
    }
  }
  const out = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const x0 = Math.max(0, x - r), x1 = Math.min(N, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(N, y + r + 1);
    const sv = sum[y1 * W + x1] - sum[y0 * W + x1] - sum[y1 * W + x0] + sum[y0 * W + x0];
    const cv = cnt[y1 * W + x1] - cnt[y0 * W + x1] - cnt[y1 * W + x0] + cnt[y0 * W + x0];
    out[idx(x, y)] = cv > 0 ? sv / cv : 0;
  }
  return out;
}

function findDesign(cfg, g, sil, side) {
  const inner = erode(sil, 4); // stay clear of the outer edge
  const sideGuard = dilate(side, 3);
  const allowed = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) allowed[i] = inner[i] && !side[i] && !sideGuard[i] ? 1 : 0;

  if (cfg.box) {
    const [bx0, by0, bx1, by1] = cfg.box;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (x < bx0 || x > bx1 || y < by0 || y > by1) allowed[idx(x, y)] = 0;
  }

  // light smoothing so JPEG noise does not speckle the mask
  const gs = maskedMean(g, new Uint8Array(N * N).fill(1), 1);
  const dark = new Uint8Array(N * N);
  if (cfg.rel) {
    // relative: darker than the surrounding face by at least cfg.rel
    const faceMask = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) faceMask[i] = sil[i] && !side[i] ? 1 : 0;
    const bg = maskedMean(g, faceMask, 28);
    for (let i = 0; i < N * N; i++) dark[i] = allowed[i] && gs[i] < bg[i] - cfg.rel ? 1 : 0;
  } else {
    for (let i = 0; i < N * N; i++) dark[i] = allowed[i] && gs[i] < cfg.t ? 1 : 0;
  }

  let design;
  if (cfg.mode === "edges") {
    // faint relief: find outline strokes by gradient, then keep whatever they wall off
    const gm = new Float32Array(N * N);
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const i = idx(x, y);
      const gx = gs[i + 1] - gs[i - 1], gy = gs[i + N] - gs[i - N];
      gm[i] = Math.hypot(gx, gy);
    }
    const edge = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) edge[i] = allowed[i] && gm[i] > cfg.edge ? 1 : 0;
    const walls = dilate(edge, cfg.close || 2);
    const reach = new Uint8Array(N * N);
    const stack = [];
    const ring = erode(allowed, 1);
    for (let i = 0; i < N * N; i++) if (allowed[i] && !ring[i] && !walls[i]) { reach[i] = 1; stack.push(i); }
    while (stack.length) {
      const pp = stack.pop();
      const x = pp % N, y = (pp / N) | 0;
      const nb = [x > 0 ? pp - 1 : -1, x < N - 1 ? pp + 1 : -1, y > 0 ? pp - N : -1, y < N - 1 ? pp + N : -1];
      for (const q of nb) if (q >= 0 && allowed[q] && !walls[q] && !reach[q]) { reach[q] = 1; stack.push(q); }
    }
    const enclosed = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) enclosed[i] = allowed[i] && !walls[i] && !reach[i] ? 1 : 0;
    const near = dilate(enclosed, (cfg.close || 2) + 2);
    design = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) design[i] = allowed[i] && near[i] && (enclosed[i] || walls[i] || edge[i]) ? 1 : 0;
  } else if (cfg.mode === "dark") {
    design = dark;
  } else {
    // enclosed: flood the face from its border; whatever the outline walls off is design.
    const walls = dilate(dark, 2);
    const reach = new Uint8Array(N * N);
    const stack = [];
    const ring = erode(allowed, 1);
    for (let i = 0; i < N * N; i++) {
      if (allowed[i] && !ring[i] && !walls[i]) { reach[i] = 1; stack.push(i); }
    }
    while (stack.length) {
      const p = stack.pop();
      const x = p % N, y = (p / N) | 0;
      const nb = [x > 0 ? p - 1 : -1, x < N - 1 ? p + 1 : -1, y > 0 ? p - N : -1, y < N - 1 ? p + N : -1];
      for (const q of nb) if (q >= 0 && allowed[q] && !walls[q] && !reach[q]) { reach[q] = 1; stack.push(q); }
    }
    const enclosed = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) enclosed[i] = allowed[i] && !walls[i] && !reach[i] ? 1 : 0;
    const grown = dilate(enclosed, 3);
    design = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) design[i] = allowed[i] && (grown[i] || dark[i]) ? 1 : 0;
  }
  // tidy: close small gaps, drop specks
  const cr = cfg.close || 1;
  design = erode(dilate(design, cr), cr);
  const { label, sizes } = components(design);
  const out = new Uint8Array(N * N);
  const minSize = cfg.close ? 250 : 60;
  for (let i = 0; i < N * N; i++) if (label[i] && sizes[label[i] - 1] >= minSize) out[i] = 1;
  return out;
}

/** Writes a white PNG whose alpha is the mask. "round" smooths blocky morphology edges first. */
async function writeMask(file, mask, { round = 0, edge = 0.8 } = {}) {
  let alpha = Buffer.alloc(N * N);
  for (let i = 0; i < N * N; i++) alpha[i] = mask[i] ? 255 : 0;
  let img = sharp(alpha, { raw: { width: N, height: N, channels: 1 } });
  if (round) img = sharp(await img.blur(round).threshold(128).extractChannel(0).raw().toBuffer(), { raw: { width: N, height: N, channels: 1 } });
  alpha = await img.blur(edge).extractChannel(0).raw().toBuffer();
  const rgba = Buffer.alloc(N * N * 4, 255);
  for (let i = 0; i < N * N; i++) rgba[i * 4 + 3] = alpha[i];
  await sharp(rgba, { raw: { width: N, height: N, channels: 4 } }).png({ compressionLevel: 9 }).toFile(file);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (DEBUG_DIR) fs.mkdirSync(DEBUG_DIR, { recursive: true });
  const area = (m) => m.reduce((a, v) => a + v, 0);
  for (const [id, cfg] of Object.entries(MODELS)) {
    const g = await loadStretched(id);
    const silRaw = await rasterPolygon(cfg.silhouette);
    const sil = erode(silRaw, 2); // stay just inside the real edge
    const side = await rasterPolygon(cfg.side);
    const design = findDesign(cfg, g, sil, side);
    await writeMask(path.join(OUT_DIR, `${id}-body.png`), sil);
    await writeMask(path.join(OUT_DIR, `${id}-fill.png`), design, { round: cfgRound(cfg) });
    console.log(id.padEnd(20), "body px", area(sil), " fill px", area(design), `(${((area(design) / area(sil)) * 100).toFixed(1)}%)`);
    if (DEBUG_DIR) {
      const buf = Buffer.from(await sharp(path.join(IMG_DIR, id + ".jpg")).raw().toBuffer());
      const er = erode(silRaw, 1);
      for (let i = 0; i < N * N; i++) {
        if (design[i]) { buf[i * 3] = 0; buf[i * 3 + 1] = Math.min(255, buf[i * 3 + 1] + 80); buf[i * 3 + 2] = 0; }
        if (silRaw[i] && !er[i]) { buf[i * 3] = 255; buf[i * 3 + 1] = 0; buf[i * 3 + 2] = 0; }
      }
      await sharp(buf, { raw: { width: N, height: N, channels: 3 } }).jpeg({ quality: 88 }).toFile(path.join(DEBUG_DIR, id + ".jpg"));
    }
  }
})();
