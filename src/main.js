import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";

// ============================================
//                  CONFIG
// All tweakable values live here — no need to
// hunt through the file to change things.
// ============================================
const CONFIG = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [0, 1.5, 3],
  },
  controls: {
    dampingFactor: 0.05,
    target: [0, 1, 0],
  },
  canvas: {
    width: 512,
    height: 384,
  },
  terminal: {
    lines: [
      "QUANTUM BIOS v2.4.1",
      "Initializing...",
      "Loading kernel...",
      "System ready.",
    ],
    typingSpeed: 20,      // chars per second
    linePause: 0.5,       // seconds between lines
    font: "20px monospace",
    color: "#00ff41",
    glowBlur: 8,
    lineHeight: 30,
    startX: 20,
    startY: 40,
    cursorWidth: 10,
    cursorHeight: 20,
  },
  screen: {
    meshName: "Plane009_screen3_0",
    emissiveColor: 0x00ff41,
    emissiveBase: 0.28,
    emissiveVariance: 0.06,
  },
  models: [
    { path: "/models/desk.glb",    position: [0, 0,    0], scale: null              },
    { path: "/models/monitor.glb", position: [0, 0.55, 0], scale: [0.13, 0.13, 0.13] },
  ],
  lighting: {
    ambient: { color: 0x404040, intensity: 1.5 },
    bulb:    { color: 0xffa500, intensity: 3, distance: 50, position: [0, 3, 0] },
  },
  scanlines: { gap: 4, thickness: 2, opacity: 0.25 },
  noise:     { count: 30, maxOpacity: 0.15 },
  vignette:  { innerRadius: 0.25, outerRadius: 0.75, opacity: 0.8 },
};

// ============================================
//              SCENE SETUP
// ============================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov,
  window.innerWidth / window.innerHeight,
  CONFIG.camera.near,
  CONFIG.camera.far,
);
camera.position.set(...CONFIG.camera.position);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById("three-container").appendChild(renderer.domElement);

// ============================================
//         CONTROLS (Mouse look around)
// ============================================

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = CONFIG.controls.dampingFactor;
controls.target.set(...CONFIG.controls.target);

// ============================================
//              RAYCASTING SETUP
// ============================================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHoveringMonitor = false;

// ============================================
//          CANVAS TEXTURE FOR SCREEN
// ============================================

const canvas = document.createElement("canvas");
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;
const ctx = canvas.getContext("2d", { willReadFrequently: true });

if (!ctx) console.error("Failed to get 2D context");

const canvasTexture = new THREE.CanvasTexture(canvas);
canvasTexture.minFilter = THREE.LinearFilter;
canvasTexture.magFilter = THREE.LinearFilter;

// ============================================
//           TERMINAL ANIMATION STATE
// ============================================

let terminalTime = 0;

function computeLineStartTimes(lines, typingSpeed, linePause) {
  const times = [];
  let t = 0;
  for (const line of lines) {
    times.push(t);
    t += line.length / typingSpeed + linePause;
  }
  return { lineStartTimes: times, allTypedTime: t - linePause };
}

const { lineStartTimes, allTypedTime } = computeLineStartTimes(
  CONFIG.terminal.lines,
  CONFIG.terminal.typingSpeed,
  CONFIG.terminal.linePause,
);

// ============================================
//           TERMINAL CANVAS DRAW
// ============================================

function updateTerminalCanvas() {
  if (!ctx) return;

  const { width, height } = canvas;
  const t = CONFIG.terminal;

  // clear
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  // phosphor glow + text
  ctx.shadowColor = t.color;
  ctx.shadowBlur = t.glowBlur;
  ctx.fillStyle = t.color;
  ctx.font = t.font;

  let y = t.startY;

  for (let i = 0; i < CONFIG.terminal.lines.length; i++) {
    if (terminalTime < lineStartTimes[i]) break;
    const elapsed = terminalTime - lineStartTimes[i];
    const chars = Math.min(
      Math.floor(elapsed * t.typingSpeed),
      CONFIG.terminal.lines[i].length,
    );
    ctx.fillText(CONFIG.terminal.lines[i].substring(0, chars), t.startX, y);
    y += t.lineHeight;
    if (chars < CONFIG.terminal.lines[i].length) break;
  }

  // cursor — only after all lines are fully typed
  if (terminalTime >= allTypedTime && Math.floor(terminalTime * 2) % 2 === 0) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = t.color;
    ctx.fillRect(t.startX, y - 5, t.cursorWidth, t.cursorHeight);
  }

  ctx.shadowBlur = 0;

  // scanlines
  const { gap, thickness, opacity } = CONFIG.scanlines;
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  for (let scanY = 0; scanY < height; scanY += gap) {
    ctx.fillRect(0, scanY, width, thickness);
  }

  // static noise
  const { count, maxOpacity } = CONFIG.noise;
  for (let n = 0; n < count; n++) {
    const nx = Math.random() * width;
    const ny = Math.random() * height;
    ctx.fillStyle = `rgba(0, 255, 65, ${Math.random() * maxOpacity})`;
    ctx.fillRect(nx, ny, 1, 1);
  }

  // vignette
  const { innerRadius, outerRadius, opacity: vOpacity } = CONFIG.vignette;
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, height * innerRadius,
    width / 2, height / 2, height * outerRadius,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${vOpacity})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  canvasTexture.needsUpdate = true;
}

// ============================================
//                 LIGHTING
// ============================================

const ambientLight = new THREE.AmbientLight(
  CONFIG.lighting.ambient.color,
  CONFIG.lighting.ambient.intensity,
);
scene.add(ambientLight);

const bulbLight = new THREE.PointLight(
  CONFIG.lighting.bulb.color,
  CONFIG.lighting.bulb.intensity,
  CONFIG.lighting.bulb.distance,
);
bulbLight.position.set(...CONFIG.lighting.bulb.position);
bulbLight.castShadow = true;
scene.add(bulbLight);

const bulbGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const bulbMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.lighting.bulb.color,
  emissive: CONFIG.lighting.bulb.color,
  emissiveIntensity: 2,
});
const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
bulb.position.copy(bulbLight.position);
scene.add(bulb);

// ============================================
//              MODEL LOADING
// ============================================

let monitorModel = null;
let screenMaterial = null;

const loader = new GLTFLoader();

/**
 * Load a GLB model and add it to the scene.
 * @param {{ path: string, position: number[], scale: number[]|null }} modelConfig
 * @param {(gltf: object) => void} [onLoaded] - optional callback after load
 */
function loadModel(modelConfig, onLoaded) {
  loader.load(
    modelConfig.path,
    (gltf) => {
      const model = gltf.scene;
      model.position.set(...modelConfig.position);
      if (modelConfig.scale) model.scale.set(...modelConfig.scale);
      scene.add(model);
      console.log(`Loaded: ${modelConfig.path}`);
      onLoaded?.(model);
    },
    undefined,
    (error) => console.error(`Error loading ${modelConfig.path}:`, error),
  );
}

// load all models from config
for (const modelConfig of CONFIG.models) {
  const isMonitor = modelConfig.path.includes("monitor");

  loadModel(modelConfig, (model) => {
    if (!isMonitor) return;

    monitorModel = model;

    model.traverse((child) => {
      if (!child.isMesh) return;
      console.log("Mesh name:", child.name);
      if (child.name === CONFIG.screen.meshName) {
        screenMaterial = new THREE.MeshStandardMaterial({
          map: canvasTexture,
          emissiveMap: canvasTexture,
          emissive: new THREE.Color(CONFIG.screen.emissiveColor),
          emissiveIntensity: CONFIG.screen.emissiveBase,
        });
        child.material = screenMaterial;
      }
    });
  });
}

// ============================================
//              MOUSE INTERACTION
// ============================================

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("click", () => {
  if (isHoveringMonitor) {
    console.log("Monitor clicked");
    // TODO: trigger interaction
  }
});

// ============================================
//              ANIMATION LOOP
// ============================================

function animate(timestamp) {
  requestAnimationFrame(animate);
  controls.update();

  terminalTime = timestamp / 1000;

  updateTerminalCanvas();

  // screen flicker
  if (screenMaterial) {
    screenMaterial.emissiveIntensity =
      CONFIG.screen.emissiveBase + Math.random() * CONFIG.screen.emissiveVariance;
  }

  // hover detection
  if (monitorModel) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(monitorModel, true);

    if (intersects.length > 0 && !isHoveringMonitor) {
      isHoveringMonitor = true;
      document.body.style.cursor = "pointer";
    } else if (intersects.length === 0 && isHoveringMonitor) {
      isHoveringMonitor = false;
      document.body.style.cursor = "default";
    }
  }

  renderer.render(scene, camera);
}

animate();

// ============================================
//              WINDOW RESIZE
// ============================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
