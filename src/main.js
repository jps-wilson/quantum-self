import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";

// ============================================
//                  CONFIG
// ============================================
const CONFIG = {
  camera: { fov: 75, near: 0.1, far: 1000, position: [0, 1.5, 3] },
  controls: { dampingFactor: 0.05, target: [0, 1, 0] },
  canvas: { width: 512, height: 384 },
  terminal: {
    bootLines: [
      "QUANTUM BIOS v2.4.1",
      "Initializing...",
      "Loading kernel...",
      "System ready.",
      "",
      "quantum@self:~$ _",
    ],
    typingSpeed: 20,
    linePause: 0.5,
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
  // ADJUSTABLE POWER BUTTON POSITION
  powerButton: {
    position: [-0.3, 0.5, 1],
    size: 0.125,
    visible: false, // invisible but clickable
  },
  powerOn: { warmupDuration: 0.5, flashDuration: 0.1, flashIntensity: 2.0 },
  models: [
    { path: "/models/desk.glb", position: [0, 0, 0], scale: null },
    {
      path: "/models/monitor.glb",
      position: [0, 0.55, 0],
      scale: [0.13, 0.13, 0.13],
    },
  ],
  lighting: {
    ambient: { color: 0x404040, intensity: 1.5 },
    bulb: { color: 0xffa500, intensity: 3, distance: 50, position: [0, 3, 0] },
  },
  scanlines: { gap: 4, thickness: 2, opacity: 0.25 },
  noise: { count: 30, maxOpacity: 0.15 },
  vignette: { innerRadius: 0.25, outerRadius: 0.75, opacity: 0.8 },
};

// Scene setup
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

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = CONFIG.controls.dampingFactor;
controls.target.set(...CONFIG.controls.target);

// Raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHoveringPowerButton = false;

// Canvas texture
const canvas = document.createElement("canvas");
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;
const ctx = canvas.getContext("2d", { willReadFrequently: true });
if (!ctx) console.error("Failed to get 2D context");

const canvasTexture = new THREE.CanvasTexture(canvas);
canvasTexture.minFilter = THREE.LinearFilter;
canvasTexture.magFilter = THREE.LinearFilter;

// Terminal state
let terminalTime = 0;
let terminalLines = CONFIG.terminal.bootLines;
let userInput = "";
let terminalMode = "boot";

function computeLineStartTimes(lines, typingSpeed, linePause) {
  const times = [];
  let t = 0;
  for (const line of lines) {
    times.push(t);
    t += line.length / typingSpeed + linePause;
  }
  return { lineStartTimes: times, allTypedTime: t - linePause };
}

let lineData = computeLineStartTimes(
  terminalLines,
  CONFIG.terminal.typingSpeed,
  CONFIG.terminal.linePause,
);

// Canvas draw function
function updateTerminalCanvas() {
  if (!ctx) return;
  const { width, height } = canvas;
  const t = CONFIG.terminal;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.shadowColor = t.color;
  ctx.shadowBlur = t.glowBlur;
  ctx.fillStyle = t.color;
  ctx.font = t.font;

  let y = t.startY;
  for (let i = 0; i < terminalLines.length; i++) {
    if (terminalTime < lineData.lineStartTimes[i]) break;
    const elapsed = terminalTime - lineData.lineStartTimes[i];
    const chars = Math.min(
      Math.floor(elapsed * t.typingSpeed),
      terminalLines[i].length,
    );
    let displayText = terminalLines[i].substring(0, chars);
    if (terminalMode === "prompt" && i === terminalLines.length - 1) {
      displayText = terminalLines[i].replace("_", userInput);
    }
    ctx.fillText(displayText, t.startX, y);
    y += t.lineHeight;
    if (chars < terminalLines[i].length) break;
  }

  if (terminalMode === "prompt" && Math.floor(terminalTime * 2) % 2 === 0) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = t.color;
    const cursorX =
      t.startX +
      ctx.measureText(
        terminalLines[terminalLines.length - 1].replace("_", userInput),
      ).width;
    ctx.fillRect(cursorX, y - t.lineHeight + 10, t.cursorWidth, t.cursorHeight);
  }

  ctx.shadowBlur = 0;
  const { gap, thickness, opacity } = CONFIG.scanlines;
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  for (let scanY = 0; scanY < height; scanY += gap) {
    ctx.fillRect(0, scanY, width, thickness);
  }

  const { count, maxOpacity } = CONFIG.noise;
  for (let n = 0; n < count; n++) {
    const nx = Math.random() * width;
    const ny = Math.random() * height;
    ctx.fillStyle = `rgba(0, 255, 65, ${Math.random() * maxOpacity})`;
    ctx.fillRect(nx, ny, 1, 1);
  }

  const { innerRadius, outerRadius, opacity: vOpacity } = CONFIG.vignette;
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * innerRadius,
    width / 2,
    height / 2,
    height * outerRadius,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${vOpacity})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  canvasTexture.needsUpdate = true;
}

// Lighting
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

// Model loading
let monitorModel = null;
let screenMaterial = null;
let powerButton = null;
let isPoweredOn = false;
let powerOnTime = -1;

const loader = new GLTFLoader();

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

for (const modelConfig of CONFIG.models) {
  const isMonitor = modelConfig.path.includes("monitor");
  loadModel(modelConfig, (model) => {
    if (!isMonitor) return;
    monitorModel = model;

    model.traverse((child) => {
      if (!child.isMesh) return;

      if (child.name === CONFIG.screen.meshName) {
        console.log("Found screen mesh!");
        screenMaterial = new THREE.MeshStandardMaterial({
          map: canvasTexture,
          emissiveMap: canvasTexture,
          emissive: new THREE.Color(CONFIG.screen.emissiveColor),
          emissiveIntensity: 0,
        });
        child.material = screenMaterial;
      }
    });

    // makes invisible clickable hotspot
    const buttonGeometry = new THREE.BoxGeometry(
      CONFIG.powerButton.size,
      CONFIG.powerButton.size,
      CONFIG.powerButton.size,
    );
    const buttonMaterial = new THREE.MeshBasicMaterial({
      visible: CONFIG.powerButton.visible,
    });
    powerButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
    powerButton.position.set(...CONFIG.powerButton.position);
    powerButton.name = "PowerButton";

    model.add(powerButton);
    console.log("Power button hitbox created");
  });
}

function powerOn() {
  if (isPoweredOn) return;
  isPoweredOn = true;
  powerOnTime = 0;
  terminalTime = 0;
  terminalMode = "boot";
  console.log("⚡ POWERING ON...");

  // TODO: play click sound here
}

// Keyboard input
window.addEventListener("keydown", (event) => {
  if (terminalMode !== "prompt") return;
  if (event.key === "Enter") {
    const command = userInput.trim().toLowerCase();
    console.log("Command entered:", command);
    if (command === "begin" || command === "start") {
      console.log("Starting transition to cosmic space!");
      terminalMode = "transition";
    }
    userInput = "";
  } else if (event.key === "Backspace") {
    userInput = userInput.slice(0, -1);
  } else if (event.key.length === 1 && userInput.length < 20) {
    userInput += event.key;
  }
});

// Mouse interaction
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("click", () => {
  if (!monitorModel) return;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(monitorModel, true);
  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    if (clickedMesh === powerButton && !isPoweredOn) {
      console.log("Power button clicked!");
      powerOn();
    }
  }
});

// Animation loop
function animate(timestamp) {
  requestAnimationFrame(animate);
  controls.update();

  if (isPoweredOn && powerOnTime >= 0) {
    powerOnTime += 0.016;
    const { warmupDuration, flashDuration, flashIntensity } = CONFIG.powerOn;

    if (powerOnTime < warmupDuration) {
      const warmup = powerOnTime / warmupDuration;
      if (screenMaterial) {
        screenMaterial.emissiveIntensity = warmup * CONFIG.screen.emissiveBase;
      }
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      canvasTexture.needsUpdate = true;
    } else if (powerOnTime < warmupDuration + flashDuration) {
      if (screenMaterial) {
        screenMaterial.emissiveIntensity = flashIntensity;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      canvasTexture.needsUpdate = true;
    } else {
      terminalTime = powerOnTime - warmupDuration - flashDuration;
      if (terminalTime >= lineData.allTypedTime && terminalMode === "boot") {
        terminalMode = "prompt";
        console.log("⌨️ Terminal ready! Type 'BEGIN' or 'START'");
      }
      updateTerminalCanvas();
      if (screenMaterial) {
        screenMaterial.emissiveIntensity =
          CONFIG.screen.emissiveBase +
          Math.random() * CONFIG.screen.emissiveVariance;
      }
    }
  }

  if (monitorModel && powerButton && !isPoweredOn) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(monitorModel, true);
    const hoveringButton =
      intersects.length > 0 && intersects[0].object === powerButton;
    if (hoveringButton && !isHoveringPowerButton) {
      isHoveringPowerButton = true;
      document.body.style.cursor = "pointer";
      console.log("👆 Hovering over power button");
    } else if (!hoveringButton && isHoveringPowerButton) {
      isHoveringPowerButton = false;
      document.body.style.cursor = "default";
    }
  }

  renderer.render(scene, camera);
}

animate();

// Window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
