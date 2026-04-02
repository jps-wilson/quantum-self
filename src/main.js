import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";

// Global reference to monitor
let monitorModel = null;
let screenMaterial = null;

// ============================================
//              SCENE SETUP
// ============================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 1.5, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('three-container').appendChild(renderer.domElement);

// ============================================
//         CONTROLS (Mouse look around)
// ============================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1, 0);

// ============================================
//              RAYCASTING SETUP
// ============================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isHoveringMonitor = false; // tracking if hovering over monitor

// ============================================
//          CANVAS TEXTURE FOR SCREEN
// ============================================
const canvas = document.createElement("canvas");
canvas.width = 512; // resolution
canvas.height = 384; // aspect ratio
const ctx = canvas.getContext("2d", { willReadFrequently: true });

// DEBUG: verify context is working
if (!ctx) {
  console.error("Failed to get 2D context");
}

// create texture from canvas
const canvasTexture = new THREE.CanvasTexture(canvas);
canvasTexture.minFilter = THREE.LinearFilter;
canvasTexture.magFilter = THREE.LinearFilter;

// animation state
let terminalTime = 0;
const terminalLines = [
  "QUANTUM BIOS v2.4.1",
  "Initializing...",
  "Loading kernel...",
  "System ready.",
];

// typing effect timing
const TYPING_SPEED = 20; // chars per second
const LINE_PAUSE = 0.5;  // seconds between lines

const lineStartTimes = [];
let _t = 0;
for (let i = 0; i < terminalLines.length; i++) {
  lineStartTimes.push(_t);
  _t += terminalLines[i].length / TYPING_SPEED + LINE_PAUSE;
}
const allTypedTime = _t - LINE_PAUSE;

// function to draw terminal content
function updateTerminalCanvas() {
  if (!ctx) return;

  // clear with black background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // phosphor glow on text
  ctx.shadowColor = "#00ff41";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#00ff41";
  ctx.font = "20px monospace";

  // draw lines with typing effect
  let y = 40;
  let lastVisibleLine = -1;

  for (let i = 0; i < terminalLines.length; i++) {
    if (terminalTime < lineStartTimes[i]) break;
    const elapsed = terminalTime - lineStartTimes[i];
    const chars = Math.min(
      Math.floor(elapsed * TYPING_SPEED),
      terminalLines[i].length,
    );
    ctx.fillText(terminalLines[i].substring(0, chars), 20, y);
    y += 30;
    lastVisibleLine = i;
    if (chars < terminalLines[i].length) break; // still typing this line
  }

  // cursor — only after all lines are fully typed
  const typingComplete = terminalTime >= allTypedTime;
  if (typingComplete && Math.floor(terminalTime * 2) % 2 === 0) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#00ff41";
    ctx.fillRect(20, y - 5, 10, 20);
  }

  ctx.shadowBlur = 0;

  // scanlines
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  for (let scanY = 0; scanY < canvas.height; scanY += 4) {
    ctx.fillRect(0, scanY, canvas.width, 2);
  }

  // static noise
  for (let n = 0; n < 30; n++) {
    const nx = Math.random() * canvas.width;
    const ny = Math.random() * canvas.height;
    ctx.fillStyle = `rgba(0, 255, 65, ${Math.random() * 0.15})`;
    ctx.fillRect(nx, ny, 1, 1);
  }

  // vignette
  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.height * 0.25,
    canvas.width / 2, canvas.height / 2, canvas.height * 0.75,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  canvasTexture.needsUpdate = true;
}

// ============================================
//                 LIGHTING
// ============================================

const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

const bulbLight = new THREE.PointLight(0xffa500, 3, 50);
bulbLight.position.set(0, 3, 0);
bulbLight.castShadow = true;
scene.add(bulbLight);

const bulbGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const bulbMaterial = new THREE.MeshStandardMaterial({
  color: 0xffaa00,
  emissive: 0xffaa00,
  emissiveIntensity: 2,
});
const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
bulb.position.copy(bulbLight.position);
scene.add(bulb);

// ============================================
//      LOAD MODELS (when you have them)
// ============================================

const loader = new GLTFLoader();

loader.load(
  "/models/desk.glb",
  (gltf) => {
    const deskModel = gltf.scene;
    deskModel.position.set(0, 0, 0);
    scene.add(deskModel);
    console.log("Desk loaded!");
  },
  undefined,
  (error) => console.error("Error loading desk:", error),
);

loader.load(
  "/models/monitor.glb",
  (gltf) => {
    monitorModel = gltf.scene;
    monitorModel.position.set(0, 0.55, 0);
    monitorModel.scale.set(0.13, 0.13, 0.13);
    scene.add(monitorModel);
    console.log("Monitor loaded!");

    // find screen mesh and apply canvas texture
    monitorModel.traverse((child) => {
      if (child.isMesh) console.log("Mesh name:", child.name);
      if (child.isMesh && child.name === "Plane009_screen3_0") {
        console.log("Found screen mesh");
        screenMaterial = new THREE.MeshStandardMaterial({
          map: canvasTexture,
          emissiveMap: canvasTexture,
          emissive: new THREE.Color(0x00ff41),
          emissiveIntensity: 0.3,
        });
        child.material = screenMaterial;
      }
    });
  },
  undefined,
  (error) => console.error("Error loading monitor:", error),
);

// ============================================
//              MOUSE INTERACTION
// ============================================

window.addEventListener("mousemove", (event) => {
  // convert mouse position to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// click handler
window.addEventListener("click", () => {
  if (isHoveringMonitor) {
    console.log("Monitor clicked");
    // TODO: Show "Press E to power on" UI
  }
});

// ============================================
//              ANIMATION LOOP
// ============================================

function animate(timestamp) {
  requestAnimationFrame(animate);
  controls.update();

  terminalTime = timestamp / 1000;

  // update canvas every frame (typing + noise need per-frame updates)
  updateTerminalCanvas();

  // screen flicker
  if (screenMaterial) {
    screenMaterial.emissiveIntensity = 0.28 + Math.random() * 0.06;
  }

  // check if hovering over monitor
  if (monitorModel) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(monitorModel, true);

    if (intersects.length > 0) {
      // Hovering over monitor
      if (!isHoveringMonitor) {
        isHoveringMonitor = true;
        document.body.style.cursor = "pointer";
        console.log("Hovering over monitor");
      }
    } else {
      // not hovering
      if (isHoveringMonitor) {
        isHoveringMonitor = false;
        document.body.style.cursor = "default";
        console.log("Left monitor");
      }
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
