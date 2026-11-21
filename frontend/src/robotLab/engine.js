// The 3D Robot Lab: a futuristic AI research lab with a humanoid robot that works through real
// activities (coding, reading, teaching, speaking, research, thinking, dance), walks between
// stations, sits, stands, turns, looks around and waves. Built with three.js; the robot is made in
// code from PBR parts (clear-coated white shell, brushed silver, black joints, electric-blue LEDs)
// on a skeleton of ~50 joints, so every pose, finger and expression is animated directly.
//
// Animation: each frame builds a target pose (an angle per joint) from layers: activity →
// walking/running → sitting → one-off gestures → breathing and blinking, then every joint eases
// toward its target (quaternion slerp), which blends one activity smoothly into the next.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ACTIVITIES, AUTO_ORDER } from './commands.js';

const TAU = Math.PI * 2;
const SIDES = [-1, 1];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const pos = (v) => Math.max(0, v);

// Where each activity happens. yaw: facing (0 = towards the camera).
const STATIONS = {
  center: { p: new THREE.Vector3(0, 0, 0.55), yaw: 0 },
  desk: { p: new THREE.Vector3(-1.65, 0, -0.35), yaw: -1.2 },
  board: { p: new THREE.Vector3(1.05, 0, 0.35), yaw: 0.3 },
};
// LED colour per activity (the robot "transforms" its glow with its job).
const LED = { coding: 0x22d3ee, reading: 0xfbbf24, teaching: 0x34d399, speaking: 0xa78bfa, research: 0x60a5fa, thinking: 0xf472b6, dance: 0xff5fd2, idle: 0x38bdf8 };

// ------------------------------------------------------------------ materials
function makeMaterials() {
  return {
    shell: new THREE.MeshPhysicalMaterial({ color: 0xc9d1dc, metalness: 0.3, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
    silver: new THREE.MeshStandardMaterial({ color: 0x9aa6b6, metalness: 1, roughness: 0.25 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0f141c, metalness: 0.75, roughness: 0.28 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1a1f29, metalness: 0.1, roughness: 0.8 }),
    visor: new THREE.MeshPhysicalMaterial({ color: 0x04060b, metalness: 0.5, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }),
    led: new THREE.MeshStandardMaterial({ color: 0x0a1a22, emissive: 0x22d3ee, emissiveIntensity: 2.4 }),
    eye: new THREE.MeshStandardMaterial({ color: 0x0a1a22, emissive: 0x7dd3fc, emissiveIntensity: 3.4 }),
    holo: new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }),
  };
}

function mesh(geo, mat, parent, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, shadow = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  parent.add(m);
  return m;
}

// A segment hanging down from its joint (capsule along -y).
const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 8, 20);
// Rounded box; the radius is capped at half the thinnest side so no corner turns inside out.
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 4, Math.min(r, Math.min(w, h, d) / 2 - 0.0005));

// ------------------------------------------------------------------ robot
function buildRobot(M) {
  const J = {};
  const joint = (name, parent, x, y, z) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, y, z);
    parent.add(g);
    J[name] = g;
    return g;
  };
  const root = new THREE.Group();
  root.name = 'robot';

  const hips = joint('hips', root, 0, 0.98, 0);
  mesh(rbox(0.3, 0.14, 0.19, 0.05), M.shell, hips);
  mesh(new THREE.CylinderGeometry(0.155, 0.15, 0.04, 32), M.dark, hips, { y: 0.07 });
  mesh(new THREE.TorusGeometry(0.152, 0.006, 8, 48), M.led, hips, { y: 0.07, rx: Math.PI / 2, shadow: false });

  const spine = joint('spine', hips, 0, 0.08, 0);
  for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(0.095 - i * 0.004, 0.1 - i * 0.004, 0.035, 28), i % 2 ? M.silver : M.dark, spine, { y: 0.02 + i * 0.04 });

  const chest = joint('chest', spine, 0, 0.15, 0);
  mesh(rbox(0.38, 0.33, 0.22, 0.09), M.shell, chest, { y: 0.17 });
  mesh(rbox(0.26, 0.16, 0.03, 0.03), M.dark, chest, { y: 0.2, z: 0.105 });
  const core = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 32), M.led, chest, { y: 0.2, z: 0.12, rx: Math.PI / 2, shadow: false });
  const coreRing = mesh(new THREE.TorusGeometry(0.062, 0.007, 8, 40), M.silver, chest, { y: 0.2, z: 0.122 });
  for (const s of SIDES) {
    mesh(new THREE.BoxGeometry(0.012, 0.18, 0.012), M.led, chest, { x: s * 0.17, y: 0.15, z: 0.095, shadow: false });
    mesh(new THREE.BoxGeometry(0.05, 0.012, 0.01), M.led, chest, { x: s * 0.07, y: 0.28, z: 0.108, shadow: false });
  }
  mesh(rbox(0.26, 0.24, 0.07, 0.03), M.dark, chest, { y: 0.17, z: -0.12 });
  for (const s of SIDES) mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 12), M.silver, chest, { x: s * 0.07, y: 0.17, z: -0.16 });
  mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.05, 28), M.dark, chest, { y: 0.345 });

  const neck = joint('neck', chest, 0, 0.36, 0);
  mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.09, 20), M.dark, neck, { y: 0.03 });
  mesh(new THREE.TorusGeometry(0.045, 0.006, 8, 24), M.led, neck, { y: 0.04, rx: Math.PI / 2, shadow: false });

  const head = joint('head', neck, 0, 0.08, 0);
  mesh(new THREE.SphereGeometry(0.13, 40, 32), M.shell, head, { y: 0.11, sy: 1.12, sz: 1.04 });
  mesh(new THREE.SphereGeometry(0.118, 40, 32), M.visor, head, { y: 0.1, z: 0.05, sy: 0.8, sz: 0.92 });
  mesh(rbox(0.03, 0.06, 0.16, 0.012), M.silver, head, { y: 0.255, z: -0.01 });
  mesh(new THREE.BoxGeometry(0.006, 0.03, 0.12), M.led, head, { y: 0.28, z: -0.01, shadow: false });
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.112, 0.158);
  head.add(eyes);
  const eyeMeshes = SIDES.map((s) => mesh(new THREE.CapsuleGeometry(0.011, 0.024, 6, 16), M.eye, eyes, { x: s * 0.046, rz: Math.PI / 2, shadow: false }));
  const mouth = mesh(new THREE.BoxGeometry(0.05, 0.007, 0.004), M.led, head, { y: 0.062, z: 0.156, shadow: false });
  for (const s of SIDES) {
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.035, 28), M.silver, head, { x: s * 0.135, y: 0.11, rz: Math.PI / 2 });
    mesh(new THREE.TorusGeometry(0.028, 0.005, 8, 24), M.led, head, { x: s * 0.153, y: 0.11, ry: Math.PI / 2, shadow: false });
  }

  const pads = [];
  for (const s of SIDES) {
    const side = s < 0 ? 'L' : 'R';
    const shoulder = joint(`shoulder${side}`, chest, s * 0.235, 0.29, 0);
    mesh(new THREE.SphereGeometry(0.06, 24, 18), M.dark, shoulder);
    pads.push(mesh(new THREE.SphereGeometry(0.078, 28, 20), M.shell, shoulder, { x: s * 0.012, y: 0.025, sy: 0.75 }));
    mesh(capsule(0.045, 0.19), M.shell, shoulder, { y: -0.16 });
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 10), M.silver, shoulder, { y: -0.15, z: -0.045 });
    const elbow = joint(`elbow${side}`, shoulder, 0, -0.3, 0);
    mesh(new THREE.SphereGeometry(0.045, 20, 16), M.dark, elbow);
    mesh(capsule(0.04, 0.18), M.shell, elbow, { y: -0.135 });
    mesh(new THREE.BoxGeometry(0.008, 0.14, 0.008), M.led, elbow, { x: s * 0.04, y: -0.14, shadow: false });
    const wrist = joint(`wrist${side}`, elbow, 0, -0.27, 0);
    mesh(new THREE.SphereGeometry(0.03, 16, 12), M.dark, wrist);
    mesh(rbox(0.032, 0.085, 0.075, 0.012), M.silver, wrist, { y: -0.05 });
    mesh(rbox(0.012, 0.07, 0.06, 0.005), M.shell, wrist, { x: s * 0.018, y: -0.05 });
    [-0.026, -0.009, 0.009, 0.026].forEach((fz, i) => {
      const a = joint(`f${side}${i}a`, wrist, 0, -0.095, fz);
      mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.036, 10), M.dark, a, { y: -0.018 });
      const b = joint(`f${side}${i}b`, a, 0, -0.038, 0);
      mesh(new THREE.CylinderGeometry(0.0078, 0.0078, 0.03, 10), M.silver, b, { y: -0.015 });
      mesh(new THREE.SphereGeometry(0.008, 10, 8), M.dark, b, { y: -0.032 });
    });
    const thumb = joint(`thumb${side}`, wrist, -s * 0.018, -0.045, 0.034);
    mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.045, 10), M.silver, thumb, { y: -0.02 });

    const hip = joint(`hip${side}`, hips, s * 0.095, -0.06, 0);
    mesh(new THREE.SphereGeometry(0.056, 20, 16), M.dark, hip);
    mesh(capsule(0.066, 0.28), M.shell, hip, { y: -0.22 });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 10), M.silver, hip, { x: s * 0.05, y: -0.22, z: -0.04 });
    const knee = joint(`knee${side}`, hip, 0, -0.44, 0);
    mesh(new THREE.SphereGeometry(0.052, 20, 16), M.dark, knee);
    mesh(rbox(0.08, 0.07, 0.04, 0.015), M.shell, knee, { z: 0.045 });
    mesh(capsule(0.055, 0.28), M.shell, knee, { y: -0.2 });
    mesh(new THREE.BoxGeometry(0.01, 0.2, 0.01), M.led, knee, { y: -0.2, z: 0.055, shadow: false });
    const ankle = joint(`ankle${side}`, knee, 0, -0.42, 0);
    mesh(new THREE.SphereGeometry(0.035, 16, 12), M.dark, ankle);
    mesh(rbox(0.105, 0.06, 0.23, 0.025), M.shell, ankle, { y: -0.035, z: 0.045 });
    mesh(rbox(0.11, 0.02, 0.235, 0.008), M.rubber, ankle, { y: -0.07, z: 0.045 });
  }
  root.scale.setScalar(0.94);
  return { root, J, eyes, eyeMeshes, mouth, core, coreRing, pads };
}

// ------------------------------------------------------------------ screens (canvas textures)
function screen(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { canvas, ctx, tex, draw, w, h };
}

const CODE = [
  ['k', 'import '], ['t', 'torch, numpy as np'], ['n', ''], ['k', 'class '], ['f', 'Brain'], ['t', '(nn.Module):'],
  ['k', '  def '], ['f', 'forward'], ['t', '(self, x):'], ['t', '    x = self.encoder(x)'], ['t', '    attn = softmax(q @ k.T / d**0.5)'],
  ['k', '    return '], ['t', 'self.head(attn @ v)'], ['n', ''], ['c', '# train with real data, measure on unseen data'],
  ['k', 'for '], ['t', 'epoch in range(epochs):'], ['t', '    loss = criterion(model(x), y)'], ['t', '    loss.backward(); opt.step()'],
  ['f', 'print'], ['t', "(f'accuracy: {acc:.2%}')"], ['n', ''], ['k', 'async def '], ['f', 'answer'], ['t', '(question):'],
  ['t', '    docs = await search_knowledge(question)'], ['k', '    return '], ['t', 'await llm(question, docs)'],
];
const TOKEN_COLOR = { k: '#c084fc', f: '#67e8f9', t: '#e2e8f0', c: '#64748b', n: '#e2e8f0' };

function drawCode(s, t, fast) {
  const { ctx, w, h } = s;
  ctx.fillStyle = '#060b16';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#0f1a2e';
  ctx.fillRect(0, 0, w, 26);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(14 + i * 16, 13, 5, 0, TAU); ctx.fill(); });
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace';
  ctx.fillText('azarvis_brain.py', 70, 18);
  const typed = Math.floor(t * (fast ? 34 : 18));
  const lineH = 19;
  let chars = 0;
  const lines = [];
  let current = [];
  for (const [kind, text] of CODE) {
    current.push([kind, text]);
    if (kind === 't' || kind === 'c' || kind === 'n') { lines.push(current); current = []; }
  }
  const total = lines.reduce((n, l) => n + l.reduce((m, [, x]) => m + x.length, 0) + 1, 0);
  const shown = typed % (total + 60);
  const visible = Math.floor((h - 40) / lineH);
  let y = 46;
  let lineNo = 0;
  const start = Math.max(0, lines.length - visible);
  ctx.font = '14px monospace';
  for (let li = 0; li < lines.length; li++) {
    let x = 44;
    const lineLen = lines[li].reduce((m, [, tx]) => m + tx.length, 0) + 1;
    if (chars >= shown) break;
    if (li >= start || lines.length <= visible) {
      ctx.fillStyle = '#334155';
      ctx.fillText(String(++lineNo + start).padStart(2), 8, y);
      for (const [kind, text] of lines[li]) {
        const n = Math.max(0, Math.min(text.length, shown - chars));
        ctx.fillStyle = TOKEN_COLOR[kind];
        ctx.fillText(text.slice(0, n), x, y);
        x += ctx.measureText(text.slice(0, n)).width;
        chars += text.length;
      }
      if (chars >= shown && Math.floor(t * 2) % 2) { ctx.fillStyle = '#67e8f9'; ctx.fillRect(x + 1, y - 13, 8, 16); }
      y += lineH;
    } else chars += lineLen - 1;
    chars += 1;
  }
}

function drawChart(s, t) {
  const { ctx, w, h } = s;
  ctx.fillStyle = '#060b16';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 14px sans-serif';
  ctx.fillText('Model accuracy · validation', 16, 24);
  ctx.strokeStyle = '#1e293b';
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(16, 50 + i * 50); ctx.lineTo(w - 16, 50 + i * 50); ctx.stroke(); }
  const bars = 12;
  for (let i = 0; i < bars; i++) {
    const v = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 0.7)) * (i / bars + 0.3);
    const grad = ctx.createLinearGradient(0, h, 0, h - v * 220);
    grad.addColorStop(0, '#4f46e5');
    grad.addColorStop(1, '#22d3ee');
    ctx.fillStyle = grad;
    ctx.fillRect(24 + i * ((w - 48) / bars), h - 20 - v * 220, (w - 48) / bars - 8, v * 220);
  }
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= w - 32; x += 8) {
    const y = 140 - 60 * Math.sin(x / 60 + t) * Math.exp(-x / 900) - x * 0.12;
    if (x === 0) ctx.moveTo(16 + x, y); else ctx.lineTo(16 + x, y);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawVision(s, t) {
  const { ctx, w, h } = s;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#0b1324');
  g.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // a simple scene: a desk, a mug and a plant, with detection boxes (a visual of what Vision does)
  ctx.fillStyle = '#334155'; ctx.fillRect(0, h * 0.68, w, h * 0.32);
  ctx.fillStyle = '#64748b'; ctx.fillRect(w * 0.18, h * 0.46, 60, 70);
  ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(w * 0.72, h * 0.42, 46, 0, TAU); ctx.fill();
  ctx.fillStyle = '#92400e'; ctx.fillRect(w * 0.7, h * 0.5, 26, 60);
  const boxes = [[w * 0.16, h * 0.43, 76, 86, 'mug 0.96', '#22d3ee'], [w * 0.62, h * 0.24, 110, 150, 'plant 0.91', '#34d399']];
  const k = 0.5 + 0.5 * Math.sin(t * 3);
  for (const [x, y, bw, bh, label, c] of boxes) {
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.strokeRect(x - k * 2, y - k * 2, bw + k * 4, bh + k * 4);
    ctx.fillStyle = c; ctx.fillRect(x - k * 2, y - 22, ctx.measureText(label).width + 16, 20);
    ctx.fillStyle = '#04121a'; ctx.font = '700 13px sans-serif'; ctx.fillText(label, x + 6 - k * 2, y - 7);
  }
  ctx.fillStyle = 'rgba(103,232,249,0.6)'; ctx.fillRect(0, (t * 120) % h, w, 2);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '600 13px sans-serif'; ctx.fillText('VISION · detecting objects', 12, 22);
}

function drawBoard(s, t, active) {
  const { ctx, w, h } = s;
  ctx.fillStyle = '#04101c';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#6ee7b7';
  ctx.font = '700 30px sans-serif';
  ctx.fillText('How a neural network learns', 36, 54);
  ctx.font = '22px monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('y = σ(W·x + b)     loss = −Σ y·log ŷ', 36, 96);
  const layers = [3, 5, 5, 2];
  const pts = layers.map((n, li) => Array.from({ length: n }, (_, i) => [140 + li * ((w - 280) / (layers.length - 1)), 150 + (i + 0.5) * ((h - 200) / n)]));
  const pulse = (t * (active ? 1.4 : 0.5)) % 1;
  for (let li = 0; li < pts.length - 1; li++) {
    for (const a of pts[li]) for (const b of pts[li + 1]) {
      const on = Math.abs(pulse * (pts.length - 1) - li - 0.5) < 0.5;
      ctx.strokeStyle = on ? 'rgba(52,211,153,0.75)' : 'rgba(100,116,139,0.35)';
      ctx.lineWidth = on ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }
  pts.forEach((layer, li) => layer.forEach(([x, y]) => {
    ctx.fillStyle = ['#22d3ee', '#a78bfa', '#a78bfa', '#fbbf24'][li];
    ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.fill();
  }));
  ctx.fillStyle = '#94a3b8'; ctx.font = '600 16px sans-serif';
  ['input', 'hidden', 'hidden', 'output'].forEach((l, li) => ctx.fillText(l, pts[li][0] - 22, h - 22));
}

function drawHolo(s, t, kind) {
  const { ctx, w, h } = s;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(103,232,249,0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.fillStyle = 'rgba(103,232,249,0.95)';
  ctx.font = '700 22px sans-serif';
  if (kind === 'ring') {
    ctx.fillText('AI CORE', 20, 36);
    const v = 0.6 + 0.35 * Math.sin(t * 0.8);
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(103,232,249,0.25)';
    ctx.beginPath(); ctx.arc(w / 2, h / 2 + 14, 70, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(167,139,250,0.95)';
    ctx.beginPath(); ctx.arc(w / 2, h / 2 + 14, 70, -Math.PI / 2, -Math.PI / 2 + v * TAU); ctx.stroke();
    ctx.fillStyle = '#e0f2fe'; ctx.font = '700 34px sans-serif';
    ctx.fillText(`${Math.round(v * 100)}%`, w / 2 - 34, h / 2 + 26);
  } else if (kind === 'wave') {
    ctx.fillText('VOICE', 20, 36);
    ctx.strokeStyle = 'rgba(244,114,182,0.95)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 20; x < w - 20; x += 4) {
      const y = h / 2 + 10 + Math.sin(x / 14 + t * 6) * 34 * Math.sin(x / (w - 40) * Math.PI) * (0.6 + 0.4 * Math.sin(t * 2));
      if (x === 20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else {
    ctx.fillText('TASKS', 20, 36);
    ['Plan', 'Research', 'Draft', 'Verify'].forEach((label, i) => {
      const p = clamp01(((t * 0.25 + i * 0.22) % 1.4));
      ctx.fillStyle = 'rgba(226,232,240,0.9)'; ctx.font = '600 17px sans-serif'; ctx.fillText(label, 20, 76 + i * 44);
      ctx.fillStyle = 'rgba(103,232,249,0.2)'; ctx.fillRect(120, 62 + i * 44, w - 150, 14);
      ctx.fillStyle = 'rgba(52,211,153,0.95)'; ctx.fillRect(120, 62 + i * 44, (w - 150) * p, 14);
    });
  }
}

// ------------------------------------------------------------------ the lab
function buildLab(scene, M) {
  const lab = {};
  const floorTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = '#0b1120';
    x.fillRect(0, 0, 512, 512);
    x.strokeStyle = 'rgba(56,189,248,0.35)';
    x.lineWidth = 2;
    for (let i = 0; i <= 512; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 10);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const floor = mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: floorTex, metalness: 0.35, roughness: 0.32, emissive: 0x0b2a4a, emissiveMap: floorTex, emissiveIntensity: 0.22 }), scene, { rx: -Math.PI / 2 });
  floor.castShadow = false;
  // stage ring
  mesh(new THREE.RingGeometry(2.3, 2.36, 96), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 }), scene, { y: 0.003, rx: -Math.PI / 2, shadow: false });

  // back wall with light strips
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x111a2e, metalness: 0.4, roughness: 0.5 });
  mesh(new THREE.PlaneGeometry(14, 6), wallMat, scene, { y: 3, z: -3.2, shadow: false });
  for (let i = -6; i <= 6; i++) {
    const color = i % 3 === 0 ? 0xa78bfa : 0x22d3ee;
    mesh(new THREE.BoxGeometry(0.04, 4.6, 0.02), new THREE.MeshStandardMaterial({ color: 0x0a0f1c, emissive: color, emissiveIntensity: i % 2 ? 0.7 : 1.25 }), scene, { x: i * 1.05, y: 2.6, z: -3.18, shadow: false });
  }
  for (const s of SIDES) mesh(new THREE.PlaneGeometry(8, 6), wallMat, scene, { x: s * 5.2, y: 3, z: 0.6, ry: -s * Math.PI / 2, shadow: false });
  // ceiling ring light
  mesh(new THREE.TorusGeometry(1.9, 0.035, 12, 120), new THREE.MeshStandardMaterial({ color: 0x0a0f1c, emissive: 0x7dd3fc, emissiveIntensity: 2.2 }), scene, { y: 3.6, z: 0.2, rx: Math.PI / 2, shadow: false });

  // --- workstation (desk, keyboard, monitors, chair) at the desk station
  const ws = new THREE.Group();
  ws.position.copy(STATIONS.desk.p);
  ws.rotation.y = STATIONS.desk.yaw;
  scene.add(ws);
  mesh(rbox(1.5, 0.05, 0.72, 0.02), M.dark, ws, { y: 0.74, z: 0.78 });
  mesh(new THREE.BoxGeometry(1.46, 0.012, 0.02), M.led, ws, { y: 0.715, z: 0.43, shadow: false });
  for (const s of SIDES) mesh(rbox(0.06, 0.72, 0.6, 0.02), M.silver, ws, { x: s * 0.66, y: 0.36, z: 0.8 });
  const kb = mesh(rbox(0.5, 0.025, 0.16, 0.008), M.dark, ws, { y: 0.777, z: 0.5 });
  kb.castShadow = false;
  const keyGeo = new THREE.BoxGeometry(0.026, 0.008, 0.026);
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0x22d3ee, emissiveIntensity: 0.25 });
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, 15 * 4);
  const mtx = new THREE.Matrix4();
  for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) keys.setMatrixAt(r * 15 + c, mtx.makeTranslation(-0.21 + c * 0.03, 0.793, 0.455 + r * 0.03));
  ws.add(keys);
  lab.screens = [];
  const monitor = (x, ry, kind) => {
    const g = new THREE.Group();
    g.position.set(x, 1.12, 0.98);
    g.rotation.y = Math.PI + ry;
    ws.add(g);
    mesh(rbox(0.62, 0.38, 0.03, 0.012), M.dark, g);
    const sc = screen(512, 320, kind);
    const face = mesh(new THREE.PlaneGeometry(0.58, 0.345), new THREE.MeshBasicMaterial({ map: sc.tex, toneMapped: false }), g, { z: 0.017, shadow: false });
    face.material.color.setScalar(1.4);
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 12), M.silver, g, { y: -0.3, z: -0.03 });
    mesh(rbox(0.2, 0.015, 0.14, 0.006), M.silver, g, { y: -0.44, z: -0.03 });
    lab.screens.push(sc);
  };
  monitor(-0.5, -0.35, 'chart');
  monitor(0.12, 0, 'code');
  monitor(0.72, 0.35, 'vision');
  // chair
  const chair = new THREE.Group();
  ws.add(chair);
  mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 32), M.dark, chair, { y: 0.47 });
  mesh(new THREE.TorusGeometry(0.24, 0.008, 8, 48), M.led, chair, { y: 0.47, rx: Math.PI / 2, shadow: false });
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 12), M.silver, chair, { y: 0.23 });
  mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.03, 24), M.dark, chair, { y: 0.02 });
  mesh(rbox(0.42, 0.42, 0.06, 0.03), M.dark, chair, { y: 0.78, z: -0.26, rx: -0.12 });
  // book on the desk (picked up when reading)
  const book = new THREE.Group();
  const bookMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.2, roughness: 0.5 });
  mesh(new THREE.BoxGeometry(0.2, 0.03, 0.26), bookMat, book);
  mesh(new THREE.BoxGeometry(0.19, 0.022, 0.25), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }), book, { x: 0.004, y: 0.003 });
  const page = new THREE.Group();
  page.position.set(-0.1, 0.017, 0);
  mesh(new THREE.PlaneGeometry(0.19, 0.24), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.9 }), page, { x: 0.095, rx: -Math.PI / 2, shadow: false });
  book.add(page);
  lab.book = { group: book, page, home: { parent: ws, pos: new THREE.Vector3(-0.42, 0.78, 0.62), rot: new THREE.Euler(0, 0.3, 0) } };
  ws.add(book);
  book.position.copy(lab.book.home.pos);
  book.rotation.copy(lab.book.home.rot);

  // --- teaching board
  const board = new THREE.Group();
  board.position.set(2.15, 1.55, -0.55);
  board.rotation.y = -0.6;
  scene.add(board);
  mesh(rbox(1.98, 1.18, 0.05, 0.03), M.dark, board);
  lab.board = screen(1024, 600, 'board');
  const bface = mesh(new THREE.PlaneGeometry(1.9, 1.1), new THREE.MeshBasicMaterial({ map: lab.board.tex, toneMapped: false }), board, { z: 0.03, shadow: false });
  bface.material.color.setScalar(1.25);
  mesh(new THREE.BoxGeometry(1.98, 0.012, 0.02), M.led, board, { y: -0.6, z: 0.03, shadow: false });
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 12), M.silver, board, { y: -1.05 });

  // --- floating holograms
  lab.holos = [];
  const holo = (x, y, z, ry, kind) => {
    const sc = screen(400, 260, kind);
    const mat = new THREE.MeshBasicMaterial({ map: sc.tex, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
    const m = mesh(new THREE.PlaneGeometry(0.9, 0.58), mat, scene, { x, y, z, ry, shadow: false });
    lab.holos.push({ m, sc, kind, y0: y, ry0: ry });
  };
  holo(-0.2, 2.35, -1.5, 0.15, 'ring');
  holo(-2.9, 1.9, -1.1, 0.7, 'tasks');
  holo(0.95, 2.45, -1.7, -0.25, 'wave');

  // --- robotics equipment: a lab arm and a server rack
  const arm = new THREE.Group();
  arm.position.set(3.1, 0, -1.9);
  scene.add(arm);
  mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.16, 32), M.dark, arm, { y: 0.08 });
  const a1 = new THREE.Group(); a1.position.y = 0.16; arm.add(a1);
  mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.2, 24), M.shell, a1, { y: 0.1 });
  const a2 = new THREE.Group(); a2.position.y = 0.2; a1.add(a2);
  mesh(rbox(0.12, 0.7, 0.12, 0.05), M.shell, a2, { y: 0.35 });
  mesh(new THREE.SphereGeometry(0.08, 20, 16), M.dark, a2);
  const a3 = new THREE.Group(); a3.position.y = 0.7; a2.add(a3);
  mesh(new THREE.SphereGeometry(0.07, 20, 16), M.dark, a3);
  mesh(rbox(0.1, 0.55, 0.1, 0.04), M.shell, a3, { y: 0.27 });
  mesh(new THREE.ConeGeometry(0.05, 0.1, 16), M.led, a3, { y: 0.58, shadow: false });
  lab.arm = { a1, a2, a3 };
  const rack = new THREE.Group();
  rack.position.set(-3.3, 0, -2.4);
  scene.add(rack);
  mesh(rbox(0.7, 2.0, 0.6, 0.03), M.dark, rack, { y: 1 });
  lab.rackLeds = [];
  for (let i = 0; i < 10; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x050a12, emissive: i % 3 ? 0x22d3ee : 0x34d399, emissiveIntensity: 2 });
    lab.rackLeds.push(mesh(new THREE.BoxGeometry(0.5, 0.025, 0.01), mat, rack, { y: 0.25 + i * 0.17, z: 0.305, shadow: false }));
  }

  // --- thinking rings and a hover seat (used away from the desk)
  const rings = new THREE.Group();
  for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(0.16 + i * 0.07, 0.006, 8, 64), M.holo, rings, { rx: Math.PI / 2 + i * 0.4, ry: i, shadow: false });
  rings.scale.setScalar(0.001);
  lab.rings = rings;
  const seat = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.06, 32), M.dark, seat, { y: 0.47 });
  mesh(new THREE.TorusGeometry(0.22, 0.01, 8, 48), M.led, seat, { y: 0.44, rx: Math.PI / 2, shadow: false });
  mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.02, 32), M.holo, seat, { y: 0.03, shadow: false });
  seat.scale.setScalar(0.001);
  scene.add(seat);
  lab.seat = seat;
  // a research tablet the robot scrolls (attached to its chest during research)
  const tablet = screen(256, 340, 'tablet');
  const tabMat = new THREE.MeshBasicMaterial({ map: tablet.tex, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  lab.tablet = { m: mesh(new THREE.PlaneGeometry(0.26, 0.34), tabMat, scene, { shadow: false }), sc: tablet };
  lab.tablet.m.visible = false;
  return lab;
}

function drawTablet(s, t) {
  const { ctx, w, h } = s;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(96,165,250,0.95)';
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, w - 6, h - 6);
  const off = (t * 70) % 60;
  for (let i = -1; i < 8; i++) {
    const y = 20 + i * 60 - off;
    ctx.fillStyle = 'rgba(147,197,253,0.9)';
    ctx.fillRect(16, y, 120 + ((i * 37) % 80), 10);
    ctx.fillStyle = 'rgba(147,197,253,0.45)';
    ctx.fillRect(16, y + 18, w - 32, 6);
    ctx.fillRect(16, y + 30, w - 60, 6);
  }
}

// ------------------------------------------------------------------ poses
// A pose: { joint: [x, y, z] } in radians. Unlisted joints go back to rest (0, 0, 0).
// Conventions (robot faces +z): shoulder x < 0 raises the arm forward; shoulder z = side * a
// moves it outward; elbow x < 0 bends the forearm forward; head x > 0 looks down; hip x < 0 lifts
// the thigh forward; knee x > 0 bends the knee.
const sideName = (s) => (s < 0 ? 'L' : 'R');

function fingers(p, s, curl, spread = 0) {
  for (let i = 0; i < 4; i++) { p[`f${sideName(s)}${i}a`] = [curl, 0, (i - 1.5) * spread]; p[`f${sideName(s)}${i}b`] = [curl * 0.9, 0, 0]; }
  p[`thumb${sideName(s)}`] = [-0.3 - curl * 0.3, 0, -s * 0.3];
}

function idlePose(g) {
  const p = {};
  for (const s of SIDES) {
    const n = sideName(s);
    p[`shoulder${n}`] = [0.06 + Math.sin(g * 0.9 + s) * 0.03, 0, s * 0.11];
    p[`elbow${n}`] = [-0.18, 0, 0];
    p[`wrist${n}`] = [0, s * 0.2, 0];
    fingers(p, s, 0.35);
  }
  p.head = [Math.sin(g * 0.5) * 0.04, Math.sin(g * 0.33) * 0.16, Math.sin(g * 0.27) * 0.03];
  p.hips = [0, 0, Math.sin(g * 0.7) * 0.015];
  return p;
}

const POSES = {
  coding(g) {
    const p = idlePose(g);
    for (const s of SIDES) {
      const n = sideName(s);
      p[`shoulder${n}`] = [-0.45, 0, -s * 0.06];
      p[`elbow${n}`] = [-1.05, 0, 0];
      p[`wrist${n}`] = [0.2, s * 1.35, 0];
      for (let i = 0; i < 4; i++) {
        const tap = pos(Math.sin(g * 15 + i * 1.9 + s * 0.8));
        p[`f${n}${i}a`] = [0.25 + tap * 0.6, 0, 0];
        p[`f${n}${i}b`] = [0.3 + tap * 0.4, 0, 0];
      }
      p[`thumb${n}`] = [-0.5, 0, -s * 0.4];
    }
    p.spine = [0.1, 0, 0];
    p.head = [0.06 + Math.sin(g * 0.6) * 0.03, Math.sin(g * 0.45) * 0.28, 0];
    return p;
  },
  reading(g, t) {
    const p = idlePose(g);
    const reach = t < 1.3;
    for (const s of SIDES) {
      const n = sideName(s);
      if (reach && s < 0) {
        p[`shoulder${n}`] = [-0.7, 0, -s * 0.05];
        p[`elbow${n}`] = [-0.5, 0, 0];
        fingers(p, s, 0.9);
      } else {
        p[`shoulder${n}`] = [-0.62, 0, s * 0.02];
        p[`elbow${n}`] = [-1.35, 0, 0];
        p[`wrist${n}`] = [0.1, s * 1.2, 0];
        fingers(p, s, 0.8);
      }
    }
    p.head = [0.42, Math.sin(g * 0.9) * 0.1, 0];
    p.spine = [0.08, 0, 0];
    return p;
  },
  teaching(g) {
    const p = idlePose(g);
    const look = Math.sin(g * 0.55) > -0.2;
    p.shoulderR = [-0.75 + Math.sin(g * 2.2) * 0.06, 0, 1.15 + Math.sin(g * 2.2) * 0.05];
    p.elbowR = [-0.12, 0, 0];
    p.wristR = [0, 0.3, 0];
    fingers(p, 1, 1.3);
    p.fR0a = [0, 0, 0]; p.fR0b = [0, 0, 0];
    p.shoulderL = [-0.5 + Math.sin(g * 1.6) * 0.15, 0, -0.12];
    p.elbowL = [-1.1 + Math.sin(g * 1.6) * 0.2, 0, 0];
    p.wristL = [0, -0.6, 0];
    fingers(p, -1, 0.2, 0.08);
    p.chest = [0, look ? 0.25 : 0, 0];
    p.head = [-0.05, look ? 0.55 : 0.05, 0];
    return p;
  },
  speaking(g) {
    const p = idlePose(g);
    for (const s of SIDES) {
      const n = sideName(s);
      const k = Math.sin(g * 1.7 + (s > 0 ? 0 : 1.4));
      p[`shoulder${n}`] = [-0.35 + k * 0.15, 0, s * 0.18];
      p[`elbow${n}`] = [-1.25 + k * 0.25, 0, 0];
      p[`wrist${n}`] = [0, s * (1.2 + k * 0.3), 0];
      fingers(p, s, 0.15, 0.1);
    }
    p.head = [Math.sin(g * 3) * 0.06, Math.sin(g * 0.7) * 0.2, Math.sin(g * 1.1) * 0.05];
    return p;
  },
  research(g) {
    const p = idlePose(g);
    p.shoulderR = [-0.85, 0, -0.18];
    p.elbowR = [-1.35, 0, 0];
    p.wristR = [Math.sin(g * 3.2) * 0.35, 1.3, 0];
    fingers(p, 1, 1.3);
    p.fR0a = [Math.sin(g * 3.2) * 0.2, 0, 0]; p.fR0b = [0, 0, 0];
    p.shoulderL = [-0.45, 0, 0.06];
    p.elbowL = [-1.0, 0, 0];
    p.wristL = [0.2, -1.35, 0];
    fingers(p, -1, 0.4);
    p.head = [0.12, Math.sin(g * 0.8) * 0.5, 0];
    p.spine = [0.06, 0, 0];
    return p;
  },
  thinking(g) {
    const p = idlePose(g);
    p.shoulderR = [-0.6, 0, -0.32];
    p.elbowR = [-2.15, 0, 0];
    p.wristR = [0.3, 1.0, 0];
    fingers(p, 1, 1.0);
    p.shoulderL = [-0.35, 0, 0.32];
    p.elbowL = [-1.45, 0, 0];
    p.wristL = [0, -1.2, 0];
    fingers(p, -1, 0.7);
    p.head = [-0.12 + Math.sin(g * 0.6) * 0.05, Math.sin(g * 0.4) * 0.2, 0.14];
    return p;
  },
  dance(g) {
    const p = idlePose(g);
    const b = g * 4.2;
    for (const s of SIDES) {
      const n = sideName(s);
      p[`shoulder${n}`] = [-0.3 + Math.sin(b + s) * 0.5, 0, s * (1.3 + Math.sin(b * 0.5 + (s > 0 ? 0 : Math.PI)) * 0.9)];
      p[`elbow${n}`] = [-0.5 - pos(Math.sin(b + s * 1.3)) * 0.9, 0, 0];
      fingers(p, s, 0.2, 0.12);
      p[`knee${n}`] = [0.25 + 0.25 * Math.abs(Math.sin(b)), 0, 0];
      p[`hip${n}`] = [-0.2 * Math.abs(Math.sin(b)), 0, 0];
    }
    p.hips = [0, Math.sin(b * 0.5) * 0.25, Math.sin(b) * 0.1];
    p.chest = [0, Math.sin(b * 0.5) * 0.25, -Math.sin(b) * 0.08];
    p.head = [Math.sin(b * 2) * 0.08, Math.sin(b * 0.5) * 0.3, Math.sin(b) * 0.1];
    return p;
  },
};
POSES.idle = (g) => idlePose(g);

function walkPose(p, phase, run, backward) {
  const ph = backward ? -phase : phase;
  const amp = run ? 0.85 : 0.5;
  for (const s of SIDES) {
    const n = sideName(s);
    const w = Math.sin(ph + (s > 0 ? Math.PI : 0));
    p[`hip${n}`] = [-w * amp, 0, 0];
    p[`knee${n}`] = [0.12 + pos(Math.sin(ph + (s > 0 ? Math.PI : 0) - 1.2)) * (run ? 1.5 : 0.85), 0, 0];
    p[`ankle${n}`] = [w * 0.2, 0, 0];
    p[`shoulder${n}`] = [w * (run ? 0.8 : 0.4), 0, s * 0.12];
    p[`elbow${n}`] = [run ? -1.4 : -0.35, 0, 0];
    fingers(p, s, run ? 1.1 : 0.4);
  }
  p.spine = [run ? 0.18 : 0.04, Math.sin(ph) * 0.06, 0];
  p.hips = [0, -Math.sin(ph) * 0.05, 0];
  p.head = [run ? -0.12 : 0, 0, 0];
}

function sitPose(p, k) {
  for (const s of SIDES) {
    const n = sideName(s);
    const hip = p[`hip${n}`] || [0, 0, 0];
    const knee = p[`knee${n}`] || [0, 0, 0];
    p[`hip${n}`] = [lerp(hip[0], -1.5, k), hip[1], lerp(hip[2], s * 0.08, k)];
    p[`knee${n}`] = [lerp(knee[0], 1.5, k), 0, 0];
    p[`ankle${n}`] = [0, 0, 0];
  }
}

// ------------------------------------------------------------------ engine
export function createRobotLab(container, { onState } = {}) {
  const lowPower = window.matchMedia('(max-width: 760px)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b16);
  scene.fog = new THREE.Fog(0x070b16, 9, 22);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 60);
  camera.position.set(0.2, 1.5, 3.8);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.0, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2.4;
  controls.maxDistance = 9;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.52;

  scene.add(new THREE.HemisphereLight(0xbfdcff, 0x0b1020, 0.3));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(2.5, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -3;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rimA = new THREE.PointLight(0x22d3ee, 18, 9); rimA.position.set(-3, 2.6, -1.5); scene.add(rimA);
  const rimB = new THREE.PointLight(0xa78bfa, 16, 9); rimB.position.set(3, 2.4, -1.2); scene.add(rimB);
  const spot = new THREE.SpotLight(0xffffff, 8, 9, 0.45, 0.7); spot.position.set(0, 4.2, 2.2); scene.add(spot); scene.add(spot.target);

  const M = makeMaterials();
  const lab = buildLab(scene, M);
  const robot = buildRobot(M);
  scene.add(robot.root);
  robot.root.add(lab.rings);
  lab.rings.position.set(0, 2.05, 0);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // Only true light sources (LEDs, screens, strips) glow: the threshold sits above a lit white shell.
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), lowPower ? 0.5 : 0.7, 0.45, 1.35);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------------- state
  const S = {
    activity: 'idle', actT: 0, auto: false, autoT: 0, autoIndex: 0, running: true,
    pos: STATIONS.center.p.clone(), yaw: 0, targetYaw: 0, spinLeft: 0,
    sit: 0, sitTarget: 0, sitOverride: null, tasks: [], patrol: null, phase: 0, moving: 0,
    oneShot: null, blinkAt: 2, blink: 0, talking: false, transformT: 9, led: new THREE.Color(LED.idle), at: 'center', g: 0,
  };
  robot.root.position.copy(S.pos);
  let lastReported = '';
  const report = () => {
    const st = { activity: S.activity, label: ACTIVITIES[S.activity]?.label, auto: S.auto, running: S.running, sitting: S.sit > 0.5, patrol: S.patrol?.mode || null, busy: S.tasks.length > 0 };
    const key2 = JSON.stringify(st);
    if (key2 !== lastReported) { lastReported = key2; onState?.(st); }
  };

  // ---------------- planning: go to the right station, then work
  const planTo = (stationName, sitAfter) => {
    const st = STATIONS[stationName];
    S.tasks = [];
    if (S.sit > 0.05) S.tasks.push({ type: 'stand' });
    if (S.pos.distanceTo(st.p) > 0.08) S.tasks.push({ type: 'walk', to: st.p.clone() });
    S.tasks.push({ type: 'face', yaw: st.yaw });
    if (sitAfter) S.tasks.push({ type: 'sit' });
    S.at = stationName;
  };

  const setActivity = (id) => {
    if (!ACTIVITIES[id]) return;
    if (S.activity === 'reading' && id !== 'reading') putBookBack();
    S.activity = id;
    S.actT = 0;
    S.transformT = 0;
    S.patrol = null;
    S.sitOverride = null;
    S.running = true;
    const a = ACTIVITIES[id];
    if (a.station) planTo(a.station, Boolean(a.sit));
    report();
  };

  const putBookBack = () => {
    const { group, home } = lab.book;
    home.parent.add(group);
    group.position.copy(home.pos);
    group.rotation.copy(home.rot);
  };
  const holdBook = () => {
    const { group } = lab.book;
    robot.J.chest.add(group);
    group.position.set(0, 0.1, 0.36);
    group.rotation.set(-1.05, 0, 0);
  };

  const command = (action) => {
    switch (action.type) {
      case 'activity': setActivity(action.activity); break;
      case 'start': S.running = true; break;
      case 'stop': S.running = false; S.patrol = null; S.tasks = []; break;
      case 'auto': S.auto = !S.auto; S.autoT = 0; if (S.auto) setActivity(AUTO_ORDER[S.autoIndex % AUTO_ORDER.length]); break;
      case 'walk':
      case 'run': {
        const mode = action.type;
        if (S.patrol?.mode === mode) { S.patrol = null; break; }
        S.tasks = S.sit > 0.05 ? [{ type: 'stand' }] : [];
        S.sitOverride = false;
        S.patrol = { mode, dir: 1 };
        break;
      }
      case 'sit': S.sitOverride = true; S.patrol = null; break;
      case 'stand': S.sitOverride = false; break;
      case 'rotate': S.targetYaw += action.dir * (Math.PI / 4); break;
      case 'spin': S.spinLeft = TAU; break;
      case 'look': S.oneShot = { type: 'look', t: 0, dur: 4.5 }; break;
      case 'wave': S.oneShot = { type: 'wave', t: 0, dur: 2.8 }; break;
      case 'reset':
        S.auto = false; S.patrol = null; S.sitOverride = null; S.oneShot = null; S.spinLeft = 0; S.running = true;
        if (S.activity === 'reading') putBookBack();
        S.activity = 'idle';
        planTo('center', false);
        break;
      default: break;
    }
    report();
  };

  // ---------------- per-frame update
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  const dir = new THREE.Vector3();

  function update(dt) {
    S.g += dt;
    const g = S.g;
    let locomotion = null; // { run, backward }

    // tasks (stand → walk → face → sit)
    const task = S.tasks[0];
    if (task) {
      if (task.type === 'stand') { S.sitTarget = 0; if (S.sit < 0.04) S.tasks.shift(); }
      else if (task.type === 'sit') { S.sitTarget = 1; if (S.sit > 0.96) S.tasks.shift(); }
      else if (task.type === 'face') { S.targetYaw = task.yaw; if (Math.abs(wrapAngle(S.targetYaw - S.yaw)) < 0.04) S.tasks.shift(); }
      else if (task.type === 'walk') {
        dir.subVectors(task.to, S.pos);
        dir.y = 0;
        const d = dir.length();
        if (d < 0.04) S.tasks.shift();
        else {
          S.targetYaw = Math.atan2(dir.x, dir.z);
          if (Math.abs(wrapAngle(S.targetYaw - S.yaw)) < 0.5) {
            S.pos.addScaledVector(dir.normalize(), Math.min(d, dt * 0.95));
            locomotion = { run: false, backward: false };
          }
        }
      }
    } else if (S.patrol && S.running) {
      // walk (or run) forward towards the camera, then backward to the start, facing forward
      const run = S.patrol.mode === 'run';
      S.targetYaw = 0;
      const z0 = -0.6;
      const z1 = 1.5;
      S.pos.x = lerp(S.pos.x, 0, dt * 2);
      S.pos.z += S.patrol.dir * dt * (run ? 1.9 : 0.8);
      if (S.pos.z > z1) S.patrol.dir = -1;
      if (S.pos.z < z0) S.patrol.dir = 1;
      locomotion = { run, backward: S.patrol.dir < 0 };
    }
    if (S.sitOverride !== null && !S.tasks.length && !S.patrol) S.sitTarget = S.sitOverride ? 1 : 0;

    // turning (with little steps while turning in place)
    if (S.spinLeft > 0) {
      const step = Math.min(S.spinLeft, dt * 3.2);
      S.yaw += step; S.targetYaw += step; S.spinLeft -= step;
    }
    const dy = wrapAngle(S.targetYaw - S.yaw);
    S.yaw += Math.sign(dy) * Math.min(Math.abs(dy), dt * 2.6);
    const turning = Math.abs(dy) > 0.05 || S.spinLeft > 0;
    if (!locomotion && turning && S.sit < 0.1) locomotion = { run: false, backward: false, turn: true };

    S.sit = lerp(S.sit, S.sitTarget, 1 - Math.exp(-dt * 3.2));
    if (locomotion) S.phase += dt * (locomotion.run ? 10 : locomotion.turn ? 6 : 6.5);

    // auto mode: a new activity every 14 s of work
    const working = S.running && !S.tasks.length && !S.patrol;
    if (working) S.actT += dt;
    if (S.auto && working && S.actT > 14) { S.autoIndex += 1; setActivity(AUTO_ORDER[S.autoIndex % AUTO_ORDER.length]); }

    // reading: pick the book up after reaching for it
    if (S.activity === 'reading' && working && S.actT > 1.3 && lab.book.group.parent !== robot.J.chest) holdBook();

    // ---- build the target pose
    const act = working ? S.activity : 'idle';
    const p = (POSES[act] || POSES.idle)(g, S.actT);
    if (locomotion) walkPose(p, S.phase, locomotion.run, locomotion.backward);
    const sitK = clamp01(S.sit);
    if (sitK > 0.01) sitPose(p, sitK);
    if (S.oneShot) {
      const o = S.oneShot;
      o.t += dt;
      if (o.type === 'look') {
        const k = Math.sin((o.t / o.dur) * Math.PI);
        p.head = [Math.sin(o.t * 0.9) * 0.15, Math.sin(o.t * 1.5) * 1.0 * k, 0];
        p.chest = [0, Math.sin(o.t * 1.5) * 0.3 * k, 0];
      } else if (o.type === 'wave') {
        p.shoulderR = [-0.2, 0, 2.55];
        p.elbowR = [0, 0, Math.sin(o.t * 9) * 0.45];
        p.wristR = [0, 0, 0];
        fingers(p, 1, 0.05, 0.12);
        p.head = [0, 0.15, 0.08];
      }
      if (o.t > o.dur) S.oneShot = null;
    }
    // breathing and life
    const breathe = Math.sin(g * 1.7);
    const chest = p.chest || [0, 0, 0];
    p.chest = [chest[0] + breathe * 0.012, chest[1], chest[2]];

    // ---- ease every joint towards its target
    const k = 1 - Math.exp(-dt * 9);
    const kf = 1 - Math.exp(-dt * 18);
    for (const [name, j] of Object.entries(robot.J)) {
      const r = p[name] || [0, 0, 0];
      tmpQ.setFromEuler(tmpE.set(r[0], r[1], r[2], 'YXZ'));
      j.quaternion.slerp(tmpQ, name.startsWith('f') || name.startsWith('thumb') ? kf : k);
    }
    // hips height: sitting lowers the body onto the seat; walking bobs it
    const bob = locomotion && !locomotion.turn ? Math.abs(Math.sin(S.phase)) * (locomotion.run ? 0.05 : 0.025) : 0;
    const danceDip = act === 'dance' ? Math.abs(Math.sin(g * 4.2)) * 0.05 : 0;
    robot.J.hips.position.y = 0.98 - sitK * 0.44 - bob - danceDip + breathe * 0.002;
    robot.J.hips.position.z = -sitK * 0.08;
    robot.root.position.copy(S.pos);
    robot.root.rotation.y = S.yaw;

    // ---- face: blinking, expression, talking mouth
    S.blinkAt -= dt;
    if (S.blinkAt < 0) { S.blink = 0.14; S.blinkAt = 2 + Math.random() * 3.5; }
    S.blink = Math.max(0, S.blink - dt);
    const eyeOpen = S.blink > 0 ? 0.12 : act === 'coding' || act === 'research' ? 0.72 : act === 'dance' || act === 'speaking' ? 0.85 : 1;
    robot.eyes.scale.y = lerp(robot.eyes.scale.y, eyeOpen, 1 - Math.exp(-dt * 30));
    robot.eyes.position.y = 0.112 + (act === 'dance' ? 0.006 : 0);
    robot.eyes.position.z = 0.158;
    const talking = S.talking || act === 'speaking' || act === 'teaching';
    const mouthOpen = talking ? 1 + Math.abs(Math.sin(g * 13)) * 3 * (0.6 + 0.4 * Math.sin(g * 3.1)) : 1;
    robot.mouth.scale.set(talking ? 1 + Math.sin(g * 7) * 0.2 : 1, lerp(robot.mouth.scale.y, mouthOpen, 0.5), 1);

    // ---- transform pulse and LED colour per activity
    S.transformT += dt;
    const tf = S.transformT < 1 ? Math.sin(S.transformT * Math.PI) : 0;
    robot.pads.forEach((pad, i) => { pad.position.y = 0.025 + tf * 0.04; pad.rotation.z = (i ? -1 : 1) * tf * 0.5; });
    robot.core.scale.setScalar(1 + tf * 0.6 + Math.sin(g * 3) * 0.06);
    robot.coreRing.rotation.z += dt * (1 + tf * 8);
    const target = new THREE.Color(act === 'dance' ? new THREE.Color().setHSL((g * 0.15) % 1, 0.9, 0.6) : LED[act] || LED.idle);
    S.led.lerp(target, 1 - Math.exp(-dt * 3));
    M.led.emissive.copy(S.led);
    M.eye.emissive.copy(S.led).lerp(new THREE.Color(0xffffff), 0.12);
    M.led.emissiveIntensity = 3 + Math.sin(g * 2.4) * 0.5 + tf * 2;

    // ---- props
    const think = act === 'thinking' ? 1 : 0;
    lab.rings.scale.setScalar(lerp(lab.rings.scale.x, think ? 1 : 0.001, 1 - Math.exp(-dt * 4)));
    lab.rings.rotation.y += dt * 1.4;
    lab.rings.children.forEach((r, i) => { r.rotation.z += dt * (0.8 + i * 0.5); });
    const seatOn = S.sit > 0.05 && S.at !== 'desk' ? 1 : S.sitTarget > 0.5 && S.at !== 'desk' ? 1 : 0;
    lab.seat.scale.setScalar(lerp(lab.seat.scale.x, seatOn ? 0.94 : 0.001, 1 - Math.exp(-dt * 6)));
    lab.seat.position.copy(S.pos);
    lab.seat.rotation.y = S.yaw;
    const tabletOn = act === 'research';
    lab.tablet.m.visible = tabletOn;
    if (tabletOn) {
      robot.J.chest.updateWorldMatrix(true, false);
      lab.tablet.m.position.set(0.12, 0.28, 0.42).applyMatrix4(robot.J.chest.matrixWorld);
      lab.tablet.m.quaternion.setFromRotationMatrix(robot.J.chest.matrixWorld).multiply(tmpQ.setFromEuler(tmpE.set(-0.35, 0, 0)));
    }
    if (lab.book.group.parent === robot.J.chest) lab.book.page.rotation.z = -Math.max(0, Math.sin(g * 1.2)) * Math.PI * 0.98;
    else lab.book.page.rotation.z = 0;

    lab.holos.forEach((h, i) => { h.m.position.y = h.y0 + Math.sin(g * 0.8 + i) * 0.06; h.m.rotation.y = h.ry0 + Math.sin(g * 0.4 + i) * 0.08; });
    lab.arm.a1.rotation.y = Math.sin(g * 0.5) * 1.2;
    lab.arm.a2.rotation.z = -0.4 + Math.sin(g * 0.7) * 0.35;
    lab.arm.a3.rotation.z = 0.9 + Math.sin(g * 0.9) * 0.5;
    lab.rackLeds.forEach((m, i) => { m.material.emissiveIntensity = 0.6 + (Math.sin(g * (2 + i * 0.37) + i) > 0.2 ? 2 : 0); });
    S.moving = locomotion ? 1 : 0;
    report();
  }

  // canvases update ~8 times a second (cheap), the 3D scene every frame
  let drawClock = 0;
  function drawScreens(dt) {
    drawClock += dt;
    if (drawClock < 0.12) return;
    drawClock = 0;
    const t = S.g;
    const coding = S.activity === 'coding' || S.activity === 'research';
    for (const sc of lab.screens) {
      if (sc.draw === 'code') drawCode(sc, t, coding);
      else if (sc.draw === 'chart') drawChart(sc, t);
      else drawVision(sc, t);
      sc.tex.needsUpdate = true;
    }
    drawBoard(lab.board, t, S.activity === 'teaching');
    lab.board.tex.needsUpdate = true;
    for (const h of lab.holos) { drawHolo(h.sc, t, h.kind); h.sc.tex.needsUpdate = true; }
    if (lab.tablet.m.visible) { drawTablet(lab.tablet.sc, t); lab.tablet.sc.tex.needsUpdate = true; }
  }

  // ---------------- loop, resize, cleanup
  const clock = new THREE.Clock();
  const follow = new THREE.Vector3();
  let frame = 0;
  let visible = true;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt);
    drawScreens(dt);
    follow.set(S.pos.x * 0.75, 1.0 - clamp01(S.sit) * 0.18, S.pos.z * 0.5);
    controls.target.lerp(follow, 1 - Math.exp(-dt * 1.5));
    controls.update();
    composer.render();
  };
  const resize = () => {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 500;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    camera.fov = w < 640 ? 52 : 40;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(container);
  resize();
  drawScreens(1);
  loop();
  report();

  return {
    command,
    setActivity,
    setTalking: (on) => { S.talking = on; },
    dispose() {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) { m.map?.dispose(); m.dispose(); }
      });
      pmrem.dispose();
      composer.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
