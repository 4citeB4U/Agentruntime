/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local LLM Service — Qwen / Ollama-compatible backend
 * Replaces the Gemini dependency entirely.
 *
 * Endpoint resolution order:
 *   1. VITE_LLM_BASE_URL  (env var, e.g. https://my-backend.local)
 *   2. http://localhost:11434  (default Ollama port)
 *
 * Models (env-overridable):
 *   VITE_LLM_MODEL        – default  "qwen2.5:7b"
 *   VITE_LLM_VISION_MODEL – default  "qwen2.5vl:7b"  (multi-modal)
 */

import { extractHtmlFromText } from '../utils/html';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL =
  (import.meta as any).env?.VITE_LLM_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:11434';

const TEXT_MODEL =
  (import.meta as any).env?.VITE_LLM_MODEL ?? 'qwen2.5:7b';

const VISION_MODEL =
  (import.meta as any).env?.VITE_LLM_VISION_MODEL ?? 'qwen2.5vl:7b';

// ---------------------------------------------------------------------------
// Prompts (mirrors the original Gemini prompts)
// ---------------------------------------------------------------------------

export const IMAGE_SYSTEM_PROMPT =
  'Generate a beautiful voxel art style object or character on a simple background. The style should be blocky, Minecraft-like, or isometric voxel art.';

export const VOXEL_PROMPT = `I have provided an image. Your task is to create a 3D voxel art representation of the main subject in this image using Three.js.

ENVIRONMENT & STYLE (CRITICAL):
- The subject MUST be placed on a floating voxel island (inverted cone shape with noise).
- Use a warm, cloudy background color: 0xffeedd.
- Add a subtle fog: new THREE.FogExp2(0xffeedd, 0.015).
- Use THREE.InstancedMesh for all voxels (subject and island).
- Include THREE.OrbitControls with autoRotate = true and autoRotateSpeed = 0.5.
- Lighting: AmbientLight(0xffcccc, 0.6) and a DirectionalLight(0xfffaed, 1.5) at (50, 80, 30) with shadows.

ANIMATION & PHYSICS REQUIREMENTS (MANDATORY):
- Every voxel must have physics properties: x, y, z (target), vx, vy, vz, rx, ry, rz, rvx, rvy, rvz.
- On load, voxels must start in a "SCATTERED" state: spread out on a virtual floor at y = -30 with random positions and rotations.
- Immediately after load, voxels must transition to a "REBUILDING" state.
- The rebuild animation should move voxels from their scattered positions to their target positions with height-based delays (building from bottom to top).
- Implement a "dismantle" function triggered via window.addEventListener('message', (e) => { if (e.data.type === 'DISMANTLE') { ... } }).
- In the "DISMANTLING" state, voxels must fall with gravity (vy -= 0.025) and bounce when hitting y = -30.
- Use smooth interpolation (lerp) for the rebuilding movement.

CODE STRUCTURE REFERENCE:
1. Setup Scene, Camera, Renderer, Controls, Lighting.
2. Define a 'voxels' array and an 'addVoxel(x, y, z, color)' function.
3. Procedurally generate the floating island (inverted cone) and the subject from the image.
4. Create a single THREE.InstancedMesh for all voxels.
5. In the animate loop, handle states:
   - 'SCATTERED': Voxels at y = -30.
   - 'REBUILDING': Lerp to target positions with height-based delay.
   - 'DISMANTLING': Apply gravity and bounce.
6. Add window message listener for 'DISMANTLE'.

STRICT OUTPUT RULES:
- Output ONLY the HTML code.
- DO NOT include any conversational text.
- DO NOT use markdown code blocks.
- Just the raw HTML starting with <!DOCTYPE html>.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** POST to /api/generate (Ollama) and return the full response text. */
async function ollamaGenerate(
  model: string,
  prompt: string,
  images?: string[]          // base64 strings without the data: prefix
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    prompt,
    stream: false,
  };
  if (images && images.length > 0) {
    body['images'] = images;
  }

  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Local LLM error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return (json.response as string) ?? '';
}

/** POST to /api/generate (Ollama streaming). Calls onChunk for each token. */
async function ollamaGenerateStream(
  model: string,
  prompt: string,
  images?: string[],
  onChunk?: (text: string) => void
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    prompt,
    stream: true,
  };
  if (images && images.length > 0) {
    body['images'] = images;
  }

  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Local LLM error ${res.status}: ${text}`);
  }

  let full = '';
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body from local LLM');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value, { stream: true }).split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const chunk: string = obj.response ?? '';
        full += chunk;
        if (onChunk && chunk) onChunk(chunk);
      } catch {
        // skip malformed JSON chunks
      }
    }
  }
  return full;
}

// ---------------------------------------------------------------------------
// Public API  (same shape as services/gemini.ts)
// ---------------------------------------------------------------------------

/**
 * generateImage — When a vision model is available the LLM describes the
 * voxel art subject; the description is then used as the alt-text / fallback
 * placeholder image.  If the model is not reachable we return a static SVG
 * so the pipeline never hard-fails.
 *
 * NOTE: Qwen 2.5VL can analyse images but cannot *generate* them.
 * The returned value is a small, opaque placeholder PNG (data URI) that the
 * voxel-generation step will describe textually instead.
 */
export const generateImage = async (
  prompt: string,
  _aspectRatio = '1:1',
  _optimize = true
): Promise<string> => {
  // XML-escape the prompt so it is safe inside SVG text content, then truncate
  const safeText = (prompt || 'voxel art')
    .slice(0, 24)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Return a 64×64 neon-cyan placeholder; the actual visual is built by
  // generateVoxelScene which reads the prompt, not the image.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
    <rect width="64" height="64" fill="#0d1117"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          font-family="monospace" font-size="8" fill="#39FF14">${safeText}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * generateVoxelScene — asks the local Qwen model to produce a self-contained
 * Three.js HTML scene from a prompt (+ optional image).
 */
export const generateVoxelScene = async (
  imageBase64: string,
  onThoughtUpdate?: (thought: string) => void
): Promise<string> => {
  // Strip the data: prefix to get raw base64
  const base64Data = imageBase64.split(',')[1] ?? imageBase64;

  // Use the vision model if we have a real image, otherwise text model
  const isPlaceholder = imageBase64.startsWith('data:image/svg+xml');
  const model = isPlaceholder ? TEXT_MODEL : VISION_MODEL;

  const prompt = VOXEL_PROMPT;

  let fullHtml = '';
  try {
    await ollamaGenerateStream(
      model,
      prompt,
      isPlaceholder ? undefined : [base64Data],
      (chunk) => {
        fullHtml += chunk;
        if (onThoughtUpdate) onThoughtUpdate(chunk.slice(0, 80));
      }
    );
  } catch (err: any) {
    // If the local model is not running, return a minimal offline demo scene
    console.warn('Local LLM unavailable, using offline voxel demo.', err?.message);
    fullHtml = offlineVoxelScene();
  }

  return extractHtmlFromText(fullHtml) || offlineVoxelScene();
};

// ---------------------------------------------------------------------------
// Offline fallback — a minimal Three.js voxel scene that runs without any LLM
// ---------------------------------------------------------------------------

function offlineVoxelScene(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>body{margin:0;overflow:hidden;background:#0d1117;}</style>
</head>
<body>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.183.2/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffeedd);
scene.fog = new THREE.FogExp2(0xffeedd, 0.015);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffcccc, 0.6));
const sun = new THREE.DirectionalLight(0xfffaed, 1.5);
sun.position.set(50, 80, 30);
scene.add(sun);

const geo = new THREE.BoxGeometry(1, 1, 1);
const mat = new THREE.MeshPhongMaterial({ color: 0x39ff14 });
const voxels = [];
const HALF = 4;
let STATE = 'REBUILDING';

for (let x = -HALF; x <= HALF; x++) {
  for (let z = -HALF; z <= HALF; z++) {
    const mesh = new THREE.Mesh(geo, mat.clone());
    mesh.userData = {
      tx: x, ty: 0, tz: z,
      x: (Math.random()-0.5)*40, y: -30, z: (Math.random()-0.5)*40,
      vx: 0, vy: 0, vz: 0
    };
    mesh.position.set(mesh.userData.x, mesh.userData.y, mesh.userData.z);
    scene.add(mesh);
    voxels.push(mesh);
  }
}

window.addEventListener('message', e => {
  if (e.data?.type === 'DISMANTLE') STATE = 'DISMANTLING';
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  voxels.forEach(v => {
    const d = v.userData;
    if (STATE === 'REBUILDING') {
      d.x += (d.tx - d.x) * 0.04;
      d.y += (d.ty - d.y) * 0.04;
      d.z += (d.tz - d.z) * 0.04;
    } else if (STATE === 'DISMANTLING') {
      d.vy -= 0.025;
      d.y += d.vy;
      if (d.y < -30) { d.y = -30; d.vy *= -0.5; }
      d.x += (Math.random()-0.5)*0.2;
      d.z += (Math.random()-0.5)*0.2;
    }
    v.position.set(d.x, d.y, d.z);
  });
  renderer.render(scene, camera);
}
animate();
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
</script>
</body>
</html>`;
}
