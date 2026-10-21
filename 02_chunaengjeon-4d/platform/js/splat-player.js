// 4D Gaussian Splatting sequence player (WebGL2), adapted from the project's web_player/index.html.
// Frames are .gsq bytes (quantised position, scale, rotation, colour) stored losslessly in PNG pixels.
// Includes smooth camera damping, 32-camera HOLOSYS rig snapping, a 3D flower-patterned mat (Hwamunseok)
// stage footprint + camera rig overlay, and local .gsq folder loading.

const workerSrc = `
const WS = 100; // metres -> centimetres inside the renderer (keeps covariances in half-float range)
let n = 0, pos = null;
const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
function half(x) {
  f32[0] = x; const b = u32[0];
  const s = (b >>> 16) & 0x8000, e = ((b >>> 23) & 0xff) - 112, m = b & 0x7fffff;
  if (e <= 0) return s; if (e >= 31) return s | 0x7c00;
  return s | (e << 10) | (m >>> 13);
}
function decode(buf) {
  const dv = new DataView(buf);
  n = dv.getUint32(4, true);
  const pmin = [0,1,2].map(i => dv.getFloat32(8 + 4*i, true));
  const pmax = [0,1,2].map(i => dv.getFloat32(20 + 4*i, true));
  const smin = dv.getFloat32(32, true), smax = dv.getFloat32(36, true);
  let o = 40;
  const qp = new Uint16Array(buf, o, n*3); o += n*6;
  const qs = new Uint8Array(buf, o, n*3); o += n*3;
  const qr = new Int8Array(buf, o, n*4); o += n*4;
  const qc = new Uint8Array(buf, o, o + n*4 <= buf.byteLength ? n*4 : Math.floor((buf.byteLength - o)));
  pos = new Float32Array(n*3);
  const W = 2048, H = Math.ceil((2*n) / W);
  const texdata = new Uint32Array(W * H * 4);
  const tf = new Float32Array(texdata.buffer), tb = new Uint8Array(texdata.buffer);
  const ds = (smax - smin) / 255;
  for (let i = 0; i < n; i++) {
    const x = WS * (pmin[0] + qp[3*i] / 65535 * (pmax[0]-pmin[0]));
    const y = WS * (pmin[1] + qp[3*i+1] / 65535 * (pmax[1]-pmin[1]));
    const z = WS * (pmin[2] + qp[3*i+2] / 65535 * (pmax[2]-pmin[2]));
    pos[3*i] = x; pos[3*i+1] = y; pos[3*i+2] = z;
    tf[8*i] = x; tf[8*i+1] = y; tf[8*i+2] = z;
    tb[32*i+12] = qc[4*i]; tb[32*i+13] = qc[4*i+1]; tb[32*i+14] = qc[4*i+2]; tb[32*i+15] = qc[4*i+3];
    const sx = WS * Math.exp(smin + qs[3*i]*ds), sy = WS * Math.exp(smin + qs[3*i+1]*ds), sz = WS * Math.exp(smin + qs[3*i+2]*ds);
    let w = qr[4*i], a = qr[4*i+1], b = qr[4*i+2], c = qr[4*i+3];
    const l = Math.hypot(w, a, b, c) || 1; w /= l; a /= l; b /= l; c /= l;
    const M = [
      (1 - 2*(b*b + c*c)) * sx, (2*(a*b + w*c)) * sx, (2*(a*c - w*b)) * sx,
      (2*(a*b - w*c)) * sy, (1 - 2*(a*a + c*c)) * sy, (2*(b*c + w*a)) * sy,
      (2*(a*c + w*b)) * sz, (2*(b*c - w*a)) * sz, (1 - 2*(a*a + b*b)) * sz ];
    const s0 = M[0]*M[0] + M[3]*M[3] + M[6]*M[6], s1 = M[0]*M[1] + M[3]*M[4] + M[6]*M[7],
          s2 = M[0]*M[2] + M[3]*M[5] + M[6]*M[8], s3 = M[1]*M[1] + M[4]*M[4] + M[7]*M[7],
          s4 = M[1]*M[2] + M[4]*M[5] + M[7]*M[8], s5 = M[2]*M[2] + M[5]*M[5] + M[8]*M[8];
    texdata[8*i+4] = half(s0) | (half(s1) << 16);
    texdata[8*i+5] = half(s2) | (half(s3) << 16);
    texdata[8*i+6] = half(s4) | (half(s5) << 16);
  }
  return { texdata, W, H };
}
let sizes = null;
function sort(view) {
  if (!pos) return null;
  if (!sizes || sizes.length < n) sizes = new Int32Array(n);
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < n; i++) {
    const k = ((view[2]*pos[3*i] + view[6]*pos[3*i+1] + view[10]*pos[3*i+2]) * 4096) | 0;
    sizes[i] = k; if (k < mn) mn = k; if (k > mx) mx = k;
  }
  const B = 65536, inv = (B - 1) / Math.max(mx - mn, 1);
  const counts = new Uint32Array(B);
  for (let i = 0; i < n; i++) { sizes[i] = ((sizes[i] - mn) * inv) | 0; counts[sizes[i]]++; }
  const starts = new Uint32Array(B);
  for (let i = 1; i < B; i++) starts[i] = starts[i-1] + counts[i-1];
  const idx = new Uint32Array(n);
  for (let i = 0; i < n; i++) idx[starts[sizes[i]]++] = i;  // nearest first, drawn front-to-back
  return idx;
}
onmessage = (e) => {
  const m = e.data;
  if (m.frame) {
    const t = decode(m.frame.buf);
    const idx = sort(m.view);
    postMessage({ tex: t.texdata, W: t.W, H: t.H, idx, n, frameId: m.frame.id, gen: m.gen }, [t.texdata.buffer, idx.buffer]);
  } else if (m.view) {
    const idx = sort(m.view);
    if (idx) postMessage({ idx, n, gen: m.gen }, [idx.buffer]);
  }
};`;

const vs = `#version 300 es
precision highp float; precision highp int;
uniform highp usampler2D u_tex; uniform mat4 projection, view; uniform vec2 focal, viewport;
in vec2 position; in int index; out vec4 vColor; out vec2 vPosition;
void main () {
  uvec4 cen = texelFetch(u_tex, ivec2((uint(index) & 0x3ffu) << 1, uint(index) >> 10), 0);
  vec4 cam = view * vec4(uintBitsToFloat(cen.xyz), 1);
  vec4 pos2d = projection * cam;
  float clip = 1.2 * pos2d.w;
  if (pos2d.z < -clip || pos2d.x < -clip || pos2d.x > clip || pos2d.y < -clip || pos2d.y > clip) {
    gl_Position = vec4(0., 0., 2., 1.); return; }
  uvec4 cov = texelFetch(u_tex, ivec2(((uint(index) & 0x3ffu) << 1) | 1u, uint(index) >> 10), 0);
  vec2 u1 = unpackHalf2x16(cov.x), u2 = unpackHalf2x16(cov.y), u3 = unpackHalf2x16(cov.z);
  mat3 Vrk = mat3(u1.x, u1.y, u2.x, u1.y, u2.y, u3.x, u2.x, u3.x, u3.y);
  mat3 J = mat3(focal.x / cam.z, 0., -(focal.x * cam.x) / (cam.z * cam.z),
                0., -focal.y / cam.z, (focal.y * cam.y) / (cam.z * cam.z), 0., 0., 0.);
  mat3 T = transpose(mat3(view)) * J;
  mat3 cov2d = transpose(T) * Vrk * T;
  cov2d[0][0] += 0.3; cov2d[1][1] += 0.3;
  float mid = (cov2d[0][0] + cov2d[1][1]) / 2.0;
  float radius = length(vec2((cov2d[0][0] - cov2d[1][1]) / 2.0, cov2d[0][1]));
  float l1 = mid + radius, l2 = mid - radius;
  if (l2 < 0.0) { gl_Position = vec4(0., 0., 2., 1.); return; }
  vec2 dv = normalize(vec2(cov2d[0][1], l1 - cov2d[0][0]));
  vec2 major = min(sqrt(8.0 * l1), 2048.0) * dv;
  vec2 minor = min(sqrt(8.0 * l2), 2048.0) * vec2(dv.y, -dv.x);
  vColor = vec4((cen.w) & 0xffu, (cen.w >> 8) & 0xffu, (cen.w >> 16) & 0xffu, (cen.w >> 24) & 0xffu) / 255.0;
  vPosition = position;
  vec2 c = vec2(pos2d) / pos2d.w;
  gl_Position = vec4(c + position.x * major / viewport + position.y * minor / viewport, 0.0, 1.0);
}`;
const fs = `#version 300 es
precision highp float; in vec4 vColor; in vec2 vPosition; out vec4 fragColor;
void main () { float A = -dot(vPosition, vPosition); if (A < -4.0) discard;
  float B = exp(A) * vColor.a; fragColor = vec4(B * vColor.rgb, B); }`;

// Auxiliary line/point shader for the Hwamunseok mat floor guide & 32-camera rig overlay
const lineVs = `#version 300 es
precision highp float;
uniform mat4 projection, view;
in vec3 aPos;
in vec4 aCol;
out vec4 vCol;
void main() {
  vec4 cam = view * vec4(aPos, 1.0);
  gl_Position = projection * cam;
  gl_PointSize = 6.0;
  vCol = aCol;
}`;
const lineFs = `#version 300 es
precision highp float;
in vec4 vCol;
out vec4 fragColor;
void main() {
  fragColor = vec4(vCol.rgb * vCol.a, vCol.a);
}`;

const pngCanvas = document.createElement("canvas");
const pngCtx = pngCanvas.getContext("2d", { willReadFrequently: true });
async function pngToBuffer(blob) {
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  pngCanvas.width = bmp.width; pngCanvas.height = bmp.height;
  pngCtx.drawImage(bmp, 0, 0); bmp.close();
  const rgba = pngCtx.getImageData(0, 0, pngCanvas.width, pngCanvas.height).data;
  const npx = rgba.length / 4, bytes = new Uint8Array(npx * 3);
  for (let i = 0; i < npx; i++) { bytes[3*i] = rgba[4*i]; bytes[3*i+1] = rgba[4*i+1]; bytes[3*i+2] = rgba[4*i+2]; }
  const n = new DataView(bytes.buffer).getUint32(4, true);  // header: 'GSQ1', splat count
  return bytes.buffer.slice(0, 40 + 17 * n);
}

export function createSplatPlayer({
  canvas,
  onMessage = () => {},
  onFrame = () => {},
  onBuffer = () => {},
  onPlayState = () => {},
  onCameraChange = () => {},
}) {
  const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: true, alpha: true });
  if (!gl) { onMessage("webgl"); return null; }
  const worker = new Worker(URL.createObjectURL(new Blob([workerSrc], { type: "text/javascript" })));
  worker.onerror = (e) => onMessage("error", e.message);

  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);

  const lineProg = gl.createProgram();
  gl.attachShader(lineProg, sh(gl.VERTEX_SHADER, lineVs)); gl.attachShader(lineProg, sh(gl.FRAGMENT_SHADER, lineFs));
  gl.linkProgram(lineProg);

  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.ONE, gl.ONE_MINUS_DST_ALPHA, gl.ONE);

  const U = (n) => gl.getUniformLocation(prog, n);
  const LU = (n) => gl.getUniformLocation(lineProg, n);

  const splatVao = gl.createVertexArray();
  gl.bindVertexArray(splatVao);
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "position"); gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const idxBuf = gl.createBuffer(); const aIdx = gl.getAttribLocation(prog, "index");
  gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf); gl.enableVertexAttribArray(aIdx);
  gl.vertexAttribIPointer(aIdx, 1, gl.INT, false, 0, 0); gl.vertexAttribDivisor(aIdx, 1);

  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.useProgram(prog);
  gl.uniform1i(U("u_tex"), 0);

  // Build Hwamunseok mat guide & 32-camera rig geometry
  const lineVao = gl.createVertexArray();
  const lineBuf = gl.createBuffer();
  let matVertexCount = 0, rigLineCount = 0, rigPointCount = 0;
  let showGuide = true;
  let rigCams = {};

  function rebuildGuideGeometry() {
    const verts = [];
    const pushV = (x, y, z, r, g, b, a) => verts.push(x, y, z, r, g, b, a);
    const pushLine = (p1, p2, c) => { pushV(...p1, ...c); pushV(...p2, ...c); };

    // Hwamunseok (flower-patterned mat) rectangle on floor y ≈ 0, centered at [cx, 0, cz]
    const cx = HOME.target[0], cz = HOME.target[2], fy = 2.0; // y=2cm (floor level in Y-down world)
    const hw = 95, hd = 135; // ~1.9m x 2.7m traditional mat proportion in cm
    const gold = [0.84, 0.64, 0.29, 0.42];
    const muted = [0.66, 0.63, 0.59, 0.16];
    const border = [
      [cx - hw, fy, cz - hd], [cx + hw, fy, cz - hd],
      [cx + hw, fy, cz + hd], [cx - hw, fy, cz + hd]
    ];
    for (let i = 0; i < 4; i++) pushLine(border[i], border[(i + 1) % 4], gold);
    // Inner woven border
    const ihw = hw - 8, ihd = hd - 8;
    const inner = [
      [cx - ihw, fy, cz - ihd], [cx + ihw, fy, cz - ihd],
      [cx + ihw, fy, cz + ihd], [cx - ihw, fy, cz + ihd]
    ];
    for (let i = 0; i < 4; i++) pushLine(inner[i], inner[(i + 1) % 4], muted);
    // Subtle center crosshairs for left-right/front-back symmetry (Sayegeo / Hoeran reference)
    pushLine([cx - ihw, fy, cz], [cx + ihw, fy, cz], muted);
    pushLine([cx, fy, cz - ihd], [cx, fy, cz + ihd], muted);
    // Front direction indicator tick (-Z is front towards cam 001/004)
    pushLine([cx - 14, fy, cz - hd - 10], [cx, fy, cz - hd - 22], gold);
    pushLine([cx + 14, fy, cz - hd - 10], [cx, fy, cz - hd - 22], gold);

    matVertexCount = verts.length / 7;

    // 32-camera rig rays/stalks if loaded
    const camKeys = Object.keys(rigCams).sort();
    for (const k of camKeys) {
      const c = rigCams[k];
      const isAct = activeCamId === k;
      const col = isAct ? [0.84, 0.64, 0.29, 0.85] : [0.56, 0.62, 0.72, 0.22];
      // short sightline towards target
      const dir = [HOME.target[0] - c.eye[0], HOME.target[1] - c.eye[1], HOME.target[2] - c.eye[2]];
      const len = Math.hypot(...dir) || 1;
      const tip = [c.eye[0] + dir[0] / len * 24, c.eye[1] + dir[1] / len * 24, c.eye[2] + dir[2] / len * 24];
      pushLine(c.eye, tip, col);
    }
    rigLineCount = (verts.length / 7) - matVertexCount;

    for (const k of camKeys) {
      const c = rigCams[k];
      const isAct = activeCamId === k;
      const col = isAct ? [0.95, 0.76, 0.38, 1.0] : [0.68, 0.72, 0.80, 0.55];
      pushV(c.eye[0], c.eye[1], c.eye[2], ...col);
    }
    rigPointCount = (verts.length / 7) - matVertexCount - rigLineCount;

    gl.bindVertexArray(lineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    const laPos = gl.getAttribLocation(lineProg, "aPos");
    const laCol = gl.getAttribLocation(lineProg, "aCol");
    gl.enableVertexAttribArray(laPos);
    gl.vertexAttribPointer(laPos, 3, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(laCol);
    gl.vertexAttribPointer(laCol, 4, gl.FLOAT, false, 28, 12);
    gl.bindVertexArray(null);
  }

  let drawN = 0;

  // Orbit camera with physical damping (OpenCV convention, capture world is Y-down, cm)
  const HOME = { yaw: Math.PI, pitch: 0.12, dist: 420, target: [-30, -85, -45] };
  const cam = { ...HOME, target: HOME.target.slice(), fov: 0.62 };
  const goal = { ...HOME, target: HOME.target.slice() };
  let activeCamId = null;

  rebuildGuideGeometry();

  function viewMatrix() {
    const { yaw, pitch, dist, target: t } = cam;
    const eye = [t[0] + dist * Math.sin(yaw) * Math.cos(pitch), t[1] - dist * Math.sin(pitch), t[2] + dist * Math.cos(yaw) * Math.cos(pitch)];
    let z = [t[0]-eye[0], t[1]-eye[1], t[2]-eye[2]]; const zl = Math.hypot(...z); z = z.map(v => v / zl);
    const up = [0, -1, 0];
    let x = [z[1]*up[2]-z[2]*up[1], z[2]*up[0]-z[0]*up[2], z[0]*up[1]-z[1]*up[0]]; const xl = Math.hypot(...x); x = x.map(v => v / xl);
    const y = [z[1]*x[2]-z[2]*x[1], z[2]*x[0]-z[0]*x[2], z[0]*x[1]-z[1]*x[0]];
    const tr = (r) => -(r[0]*eye[0] + r[1]*eye[1] + r[2]*eye[2]);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, tr(x), tr(y), tr(z), 1];
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  new ResizeObserver(resize).observe(canvas); resize();

  let viewDirty = true;
  const pointers = new Map(); let pinch = 0;
  canvas.addEventListener("contextmenu", e => e.preventDefault());
  canvas.addEventListener("pointerdown", e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey });
    canvas.setPointerCapture(e.pointerId); pinch = 0;
    if (activeCamId) { activeCamId = null; rebuildGuideGeometry(); onCameraChange(null); }
  });
  const endPointer = e => { pointers.delete(e.pointerId); pinch = 0; };
  canvas.addEventListener("pointerup", endPointer); canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("pointermove", e => {
    const p = pointers.get(e.pointerId); if (!p) return;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]; p.x = e.clientX; p.y = e.clientY;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) { goal.dist = Math.min(2000, Math.max(60, goal.dist * pinch / d)); viewDirty = true; }
      pinch = d; return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (p.pan) {
      const v = viewMatrix(), s = goal.dist * 0.0015;
      for (let k = 0; k < 3; k++) goal.target[k] -= (v[4*k] * dx + v[4*k+1] * dy) * s;
    } else {
      goal.yaw -= dx * 0.008;
      goal.pitch = Math.max(-1.45, Math.min(1.45, goal.pitch + dy * 0.008));
    }
    viewDirty = true;
  });
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    goal.dist = Math.min(2000, Math.max(60, goal.dist * (e.deltaY > 0 ? 1.09 : 0.91)));
    viewDirty = true;
  }, { passive: false });

  // Sequence source + buffering
  let frames = [], fps = 15, cur = 0, playing = true, loadFrame = null, cacheMax = 45, frameNums = [];
  const cache = new Map(), inflight = new Map();
  let busy = false, shownFrame = -1, wanted = 0, lastAdvance = 0, gen = 0;
  function fetchFrame(i) {
    if (cache.has(i) || inflight.has(i)) return;
    const g = gen;
    const p = loadFrame(i).then(buf => { if (g !== gen) return; cache.set(i, buf); inflight.delete(i);
      while (cache.size > cacheMax) { let far = null, fd = -1;
        for (const k of cache.keys()) { const d = (k - cur + frames.length) % frames.length; if (d > fd) { fd = d; far = k; } }
        cache.delete(far); } }).catch(() => { inflight.delete(i); });
    inflight.set(i, p);
  }
  function startSequence(list, loader, manifest, keepAll) {
    gen++; frames = list; loadFrame = loader; cur = 0; cache.clear(); inflight.clear(); shownFrame = -1; busy = false; drawN = 0;
    cacheMax = keepAll ? list.length : 45;
    fps = (manifest && manifest.fps) || 30;
    frameNums = list.map((f, i) => { const m = /(\d+)(?=\D*$)/.exec(typeof f === "string" ? f : f.name); return m ? +m[1] : i + 1; });
    if (manifest && manifest.center) {
      HOME.target = manifest.center.map(v => v * 100);
      cam.target = HOME.target.slice();
      goal.target = HOME.target.slice();
      rebuildGuideGeometry();
      viewDirty = true;
    }
    onMessage("loading");
    requestFrame(0);
  }
  async function requestFrame(i) {
    wanted = i;
    if (busy) return;
    fetchFrame(i);
    if (!cache.has(i)) { await inflight.get(i); if (wanted !== i || !cache.has(i)) return requestFrame(wanted); }
    busy = true;
    const buf = cache.get(i).slice(0);
    worker.postMessage({ frame: { buf, id: i }, view: viewMatrix(), gen }, [buf]);
  }
  worker.onmessage = (e) => {
    const m = e.data;
    if (m.gen !== gen) { if (m.tex) { busy = false; requestFrame(wanted); } return; }
    if (m.tex) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, m.W, m.H, 0, gl.RGBA_INTEGER, gl.UNSIGNED_INT, m.tex);
      shownFrame = m.frameId; busy = false; onMessage("");
      if (wanted !== shownFrame) requestFrame(wanted);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf); gl.bufferData(gl.ARRAY_BUFFER, m.idx, gl.DYNAMIC_DRAW);
    drawN = m.n;
  };

  async function loadManifest(url) {
    const base = url.slice(0, url.lastIndexOf("/") + 1);
    const man = await fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
    const list = man.frames.map(f => base + f);
    startSequence(list, i => fetch(list[i]).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(b => list[i].endsWith(".png") ? pngToBuffer(b) : b.arrayBuffer()), man, true);
    return man;
  }

  async function loadLocalFiles(fileList) {
    const files = [...fileList];
    const gsq = files.filter(f => /frame_\d+\.(gsq|bin|png)$/.test(f.name)).sort((a, b) => a.name < b.name ? -1 : 1);
    if (!gsq.length) return null;
    const mf = files.find(f => f.name === "manifest.json");
    const manifest = mf ? JSON.parse(await mf.text()) : { fps: 30 };
    startSequence(
      gsq,
      i => gsq[i].name.endsWith(".png") ? pngToBuffer(gsq[i]) : gsq[i].arrayBuffer(),
      manifest,
      gsq.length <= 200
    );
    return { count: gsq.length, fps: manifest.fps || 30, first: frameNums[0], last: frameNums.at(-1), folder: gsq[0].webkitRelativePath?.split("/")[0] || "local" };
  }

  function setCameras(camsJson) {
    rigCams = {};
    for (const [k, c] of Object.entries(camsJson || {})) {
      const w = c.w2c;
      if (!w) continue;
      const R = [w[0].slice(0, 3), w[1].slice(0, 3), w[2].slice(0, 3)];
      const t = [w[0][3] * 100, w[1][3] * 100, w[2][3] * 100];
      const eye = [
        -(R[0][0] * t[0] + R[1][0] * t[1] + R[2][0] * t[2]),
        -(R[0][1] * t[0] + R[1][1] * t[1] + R[2][1] * t[2]),
        -(R[0][2] * t[0] + R[1][2] * t[1] + R[2][2] * t[2]),
      ];
      rigCams[k] = { eye, reproj: c.reproj_px };
    }
    rebuildGuideGeometry();
  }

  function snapToCamera(camId) {
    if (!camId || !rigCams[camId]) {
      activeCamId = null;
      resetView();
      rebuildGuideGeometry();
      onCameraChange(null);
      return;
    }
    activeCamId = camId;
    const { eye } = rigCams[camId];
    const t = HOME.target.slice();
    const d = [eye[0] - t[0], eye[1] - t[1], eye[2] - t[2]];
    const dist = Math.hypot(...d) || 400;
    const pitch = Math.asin(Math.max(-1, Math.min(1, -d[1] / dist)));
    let yaw = Math.atan2(d[0], d[2]);
    // Shortest angular path from current cam.yaw
    while (yaw - cam.yaw > Math.PI) yaw -= Math.PI * 2;
    while (yaw - cam.yaw < -Math.PI) yaw += Math.PI * 2;
    goal.yaw = yaw;
    goal.pitch = pitch;
    goal.dist = dist;
    goal.target = t;
    rebuildGuideGeometry();
    viewDirty = true;
    onCameraChange(camId);
  }

  function setPlaying(p) { playing = p; onPlayState(p); }
  function seek(i) { if (!frames.length) return; cur = Math.max(0, Math.min(frames.length - 1, i)); requestFrame(cur); }
  function step(d) { if (!frames.length) return; setPlaying(false); cur = (cur + d + frames.length) % frames.length; requestFrame(cur); }
  function resetView() {
    activeCamId = null;
    let yaw = HOME.yaw;
    while (yaw - cam.yaw > Math.PI) yaw -= Math.PI * 2;
    while (yaw - cam.yaw < -Math.PI) yaw += Math.PI * 2;
    goal.yaw = yaw;
    goal.pitch = HOME.pitch;
    goal.dist = HOME.dist;
    goal.target = HOME.target.slice();
    rebuildGuideGeometry();
    viewDirty = true;
    onCameraChange(null);
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function frameLoop(now) {
    // Smooth exponential camera damping (unless prefers-reduced-motion)
    const alpha = reducedMotion.matches ? 1.0 : 0.24;
    const dyaw = goal.yaw - cam.yaw, dpitch = goal.pitch - cam.pitch, ddist = goal.dist - cam.dist;
    const dt0 = goal.target[0] - cam.target[0], dt1 = goal.target[1] - cam.target[1], dt2 = goal.target[2] - cam.target[2];
    if (Math.hypot(dyaw, dpitch, ddist * 0.01, dt0 * 0.05, dt1 * 0.05, dt2 * 0.05) > 0.0005) {
      cam.yaw += dyaw * alpha;
      cam.pitch += dpitch * alpha;
      cam.dist += ddist * alpha;
      cam.target[0] += dt0 * alpha;
      cam.target[1] += dt1 * alpha;
      cam.target[2] += dt2 * alpha;
      viewDirty = true;
    }

    if (frames.length) {
      const ahead = cacheMax >= frames.length ? frames.length : 30;
      let started = 0;
      for (let k = 0; k < ahead && inflight.size < 4 && started < 4; k++) {
        const j = (cur + k) % frames.length; if (!cache.has(j) && !inflight.has(j)) { fetchFrame(j); started++; } }
      if (playing && now - lastAdvance >= 1000 / fps && shownFrame === cur && !busy) {
        const nx = (cur + 1) % frames.length;
        if (cache.has(nx)) { cur = nx; lastAdvance = now; requestFrame(cur); }
      }
      if (viewDirty && !busy && shownFrame >= 0) { worker.postMessage({ view: viewMatrix(), gen }); viewDirty = false; }
      onBuffer(cache.size / frames.length);
      if (shownFrame >= 0) onFrame({ index: shownFrame, count: frames.length, source: frameNums[shownFrame], splats: drawN });
    }
    const w = canvas.width, h = canvas.height, f = h / (2 * Math.tan(cam.fov / 2));
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const zn = 5, zf = 10000;
    const proj = [2*f/w, 0, 0, 0, 0, -2*f/h, 0, 0, 0, 0, zf/(zf-zn), 1, 0, 0, -(zf*zn)/(zf-zn), 0];
    const vm = viewMatrix();

    // Draw 4DGS splats first (front-to-back under-compositing via ONE_MINUS_DST_ALPHA)
    if (drawN) {
      gl.useProgram(prog);
      gl.bindVertexArray(splatVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniformMatrix4fv(U("projection"), false, proj);
      gl.uniformMatrix4fv(U("view"), false, vm);
      gl.uniform2fv(U("focal"), [f, f]);
      gl.uniform2fv(U("viewport"), [w, h]);
      gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, drawN);
    }

    // Draw Hwamunseok floor guide & 32-camera rig overlay behind the opaque dancer splats
    if (showGuide && matVertexCount > 0) {
      gl.useProgram(lineProg);
      gl.bindVertexArray(lineVao);
      gl.uniformMatrix4fv(LU("projection"), false, proj);
      gl.uniformMatrix4fv(LU("view"), false, vm);
      gl.drawArrays(gl.LINES, 0, matVertexCount + rigLineCount);
      if (rigPointCount > 0) {
        gl.drawArrays(gl.POINTS, matVertexCount + rigLineCount, rigPointCount);
      }
    }
    requestAnimationFrame(frameLoop);
  }
  requestAnimationFrame(frameLoop);

  return {
    loadManifest,
    loadLocalFiles,
    setCameras,
    snapToCamera,
    seek,
    step,
    resetView,
    toggleGuide: () => { showGuide = !showGuide; return showGuide; },
    get guideVisible() { return showGuide; },
    get activeCamera() { return activeCamId; },
    toggle: () => setPlaying(!playing),
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    get playing() { return playing; },
  };
}
