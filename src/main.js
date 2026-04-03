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
  screen: {
    meshName: "Plane009_screen3_0",
    emissiveColor: 0x00ff41,
    emissiveBase: 0.4,
    emissiveVariance: 0.08,
  },
  models: [
    { path: "/models/desk.glb",    position: [0, 0,    0], scale: null               },
    { path: "/models/monitor.glb", position: [0, 0.55, 0], scale: [0.13, 0.13, 0.13] },
  ],
  lighting: {
    ambient: { color: 0x404040, intensity: 1.5 },
    bulb:    { color: 0xffa500, intensity: 3, distance: 50, position: [0, 3, 0] },
  },
  scanlines: { gap: 4, thickness: 2, opacity: 0.25 },
  noise:     { count: 20, maxOpacity: 0.12 },
  vignette:  { innerRadius: 0.25, outerRadius: 0.75, opacity: 0.8 },
};

// ============================================
//             TERMINAL CONTENT
// ============================================
const BOOT_MESSAGES = [
  { text: "QUANTUM BIOS v2.4.1 (C) 1985 QuantumSoft Inc.", delay: 0,    color: "white" },
  { text: "Base Memory: 640K   Extended: 15360K",          delay: 100,  color: "white" },
  { text: "Disk 0: 20MB ST-225 HDD [OK]",                  delay: 150,  color: "white" },
  { text: "",                                               delay: 200,  color: "white" },
  { text: "Loading QUANTUM/UNIX Kernel v3.2...",            delay: 250,  color: "amber" },
  { text: "",                                               delay: 400,  color: "white" },
  { text: "unix: (ttyd0) multi-user",                       delay: 450,  color: "white" },
  { text: "mem = 15728K (0x0f60000)",                       delay: 500,  color: "white" },
  { text: "avail mem = 14336K",                             delay: 550,  color: "white" },
  { text: "using 147 buffers containing 1176K memory",      delay: 600,  color: "white" },
  { text: 'wd0: ST-225 <20MB 5.25" FH ESDI>',              delay: 650,  color: "white" },
  { text: "wd0a: 19MB, 615 cyl, 4 heads, 17 sec",          delay: 700,  color: "white" },
  { text: "",                                               delay: 750,  color: "white" },
  { text: "Checking filesystems...",                        delay: 800,  color: "white" },
  { text: "/dev/wd0a: clean, 1847 files",                   delay: 900,  color: "white" },
  { text: "Mounting local filesystems...",                  delay: 1000, color: "white" },
  { text: "Starting daemons: update cron inetd lpd",        delay: 1100, color: "white" },
  { text: "",                                               delay: 1150, color: "white" },
  { text: "Init network: qe0",                              delay: 1200, color: "white" },
  { text: "qe0: address 08:00:2b:3c:4d:5e",                delay: 1250, color: "white" },
  { text: "Starting network daemons: routed named",         delay: 1300, color: "white" },
  { text: "",                                               delay: 1350, color: "white" },
  { text: "Quantum Multi-User System ready.",               delay: 1400, color: "amber" },
  { text: "",                                               delay: 1450, color: "white" },
];

const QUANTUM_LOGO = `   ██████╗ ██╗   ██╗ █████╗ ███╗   ██╗████████╗██╗   ██╗███╗   ███╗
  ██╔═══██╗██║   ██║██╔══██╗████╗  ██║╚══██╔══╝██║   ██║████╗ ████║
  ██║   ██║██║   ██║███████║██╔██╗ ██║   ██║   ██║   ██║██╔████╔██║
  ██║▄▄ ██║██║   ██║██╔══██║██║╚██╗██║   ██║   ██║   ██║██║╚██╔╝██║
  ╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║   ██║   ╚██████╔╝██║ ╚═╝ ██║
   ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝`;

const WELCOME_MESSAGES = [
  { text: "",                                          color: "white" },
  { text: "Initializing user profile...",              color: "amber" },
  { text: "Creating session token...",                 color: "white" },
  { text: "",                                          color: "white" },
  { text: "Last login: Mon Apr 15 09:42:13 1985",      color: "white" },
  { text: "",                                          color: "white" },
  { text: "WELCOME TO THE QUANTUM SELF",               color: "amber" },
  { text: "Explore identity across infinite realities", color: "white" },
  { text: "",                                          color: "white" },
];

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

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = CONFIG.controls.dampingFactor;
controls.target.set(...CONFIG.controls.target);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHoveringMonitor = false;

// ============================================
//       CANVAS TEXTURE — idle QUANTUM screen
// ============================================
const canvas = document.createElement("canvas");
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;
const ctx = canvas.getContext("2d");
if (!ctx) console.error("Failed to get 2D context");

const canvasTexture = new THREE.CanvasTexture(canvas);
canvasTexture.minFilter = THREE.LinearFilter;
canvasTexture.magFilter = THREE.LinearFilter;

function drawQuantumScreen(time) {
  if (!ctx) return;
  const { width, height } = canvas;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  const pulse = Math.sin(time * 1.8) * 0.4 + 0.6;

  // QUANTUM
  ctx.textAlign = "center";
  ctx.shadowColor = "#00ff41";
  ctx.shadowBlur = 18 * pulse;
  ctx.fillStyle = "#00ff41";
  ctx.font = "bold 52px monospace";
  ctx.fillText("QUANTUM", width / 2, height / 2 - 16);

  // SELF
  ctx.shadowColor = "#ffa657";
  ctx.shadowBlur = 12 * pulse;
  ctx.fillStyle = "#ffa657";
  ctx.font = "bold 22px monospace";
  ctx.fillText("S  E  L  F", width / 2, height / 2 + 22);

  // click hint
  const hintAlpha = Math.sin(time * 1.2) * 0.3 + 0.5;
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(201, 209, 217, ${hintAlpha})`;
  ctx.font = "11px monospace";
  ctx.fillText("[ click to enter ]", width / 2, height - 28);

  ctx.textAlign = "left";
  ctx.shadowBlur = 0;

  // scanlines
  ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.scanlines.opacity})`;
  for (let scanY = 0; scanY < height; scanY += CONFIG.scanlines.gap) {
    ctx.fillRect(0, scanY, width, CONFIG.scanlines.thickness);
  }

  // noise
  for (let n = 0; n < CONFIG.noise.count; n++) {
    ctx.fillStyle = `rgba(0, 255, 65, ${Math.random() * CONFIG.noise.maxOpacity})`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
  }

  // vignette
  const { innerRadius, outerRadius, opacity } = CONFIG.vignette;
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, height * innerRadius,
    width / 2, height / 2, height * outerRadius,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${opacity})`);
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

function loadModel(modelConfig, onLoaded) {
  loader.load(
    modelConfig.path,
    (gltf) => {
      const model = gltf.scene;
      model.position.set(...modelConfig.position);
      if (modelConfig.scale) model.scale.set(...modelConfig.scale);
      scene.add(model);
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
  if (isHoveringMonitor) enterTerminal();
});

// ============================================
//              ANIMATION LOOP
// ============================================
function animate(timestamp) {
  requestAnimationFrame(animate);
  controls.update();

  const time = timestamp / 1000;
  drawQuantumScreen(time);

  if (screenMaterial) {
    screenMaterial.emissiveIntensity =
      CONFIG.screen.emissiveBase + Math.random() * CONFIG.screen.emissiveVariance;
  }

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

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================
//              HTML TERMINAL
// ============================================
const terminalEl   = document.getElementById("terminal");
const outputEl     = document.getElementById("terminal-output");
const promptEl     = document.getElementById("input-prompt");
const inputDisplayEl = document.getElementById("input-display");
const inputRowEl   = document.getElementById("terminal-input-row");

let terminalPhase = null; // null | "boot" | "login" | "password" | "prompt" | "transition"
let userInput = "";
let username = "";

function addLine(text, color = "white") {
  const line = document.createElement("div");
  line.className = `terminal-line ${color}`;
  line.textContent = text;
  outputEl.appendChild(line);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function setPrompt(text) {
  promptEl.textContent = text;
  userInput = "";
  inputDisplayEl.textContent = "";
}

function showInput() { inputRowEl.style.visibility = "visible"; }
function hideInput() { inputRowEl.style.visibility = "hidden"; }

function enterTerminal() {
  controls.enabled = false;
  document.body.style.cursor = "default";
  isHoveringMonitor = false;

  terminalEl.classList.add("entering");
  terminalEl.addEventListener("animationend", () => {
    terminalEl.classList.remove("entering");
    terminalEl.classList.add("active");
    startBoot();
  }, { once: true });
}

function startBoot() {
  terminalPhase = "boot";
  hideInput();

  const lastDelay = BOOT_MESSAGES[BOOT_MESSAGES.length - 1].delay;

  for (const msg of BOOT_MESSAGES) {
    setTimeout(() => addLine(msg.text, msg.color), msg.delay);
  }

  // logo
  setTimeout(() => {
    QUANTUM_LOGO.split("\n").forEach((line) => addLine(line, "green"));
  }, lastDelay + 300);

  // welcome messages
  setTimeout(() => {
    for (const msg of WELCOME_MESSAGES) addLine(msg.text, msg.color);
  }, lastDelay + 800);

  // login prompt
  setTimeout(() => {
    setPrompt("quantum login: ");
    showInput();
    terminalPhase = "login";
  }, lastDelay + 1200);
}

// ============================================
//              KEYBOARD INPUT
// ============================================
window.addEventListener("keydown", (event) => {
  if (!terminalPhase || terminalPhase === "boot" || terminalPhase === "transition") return;

  if (event.key === "Enter") {
    handleEnter();
  } else if (event.key === "Backspace") {
    userInput = userInput.slice(0, -1);
    refreshInputDisplay();
  } else if (event.key.length === 1 && userInput.length < 40) {
    userInput += event.key;
    refreshInputDisplay();
  }
});

function refreshInputDisplay() {
  inputDisplayEl.textContent =
    terminalPhase === "password" ? "*".repeat(userInput.length) : userInput;
}

function handleEnter() {
  if (terminalPhase === "login") {
    if (userInput.length === 0) return;
    username = userInput;
    addLine(`quantum login: ${username}`, "green");
    setPrompt("Password: ");
    terminalPhase = "password";

  } else if (terminalPhase === "password") {
    addLine(`Password: ${"*".repeat(userInput.length)}`, "green");
    addLine("", "white");
    addLine(`Welcome, ${username}!`, "amber");
    addLine("", "white");
    addLine("Type 'start' to begin your journey...", "white");
    addLine("", "white");
    setPrompt("quantum@self:~$ ");
    terminalPhase = "prompt";

  } else if (terminalPhase === "prompt") {
    const command = userInput.trim().toLowerCase();
    addLine(`quantum@self:~$ ${userInput}`, "green");
    userInput = "";
    inputDisplayEl.textContent = "";

    if (command === "start" || command === "begin") {
      addLine("", "white");
      addLine("Initializing quantum engine...", "amber");
      addLine("Loading multiverse...", "white");
      addLine("Calibrating reality branches...", "white");
      addLine("", "white");
      addLine("Entering the void...", "amber");
      hideInput();
      terminalPhase = "transition";
      // TODO: trigger transition to 3D space
    } else if (command === "") {
      // empty enter — just show new prompt
    } else {
      addLine(`bash: ${command}: command not found`, "white");
    }

    if (terminalPhase === "prompt") setPrompt("quantum@self:~$ ");
  }
}
