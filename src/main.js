import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { SCENE_CONFIG } from "./config/constants.js";
import { Wormhole } from "./utils/wormhole.js";
import { DeskScene } from "./scenes/DeskScene.js";
import { VoidScene } from "./scenes/VoidScene.js";
import { SceneManager } from "./scenes/SceneManager.js";
import { Terminal } from "./terminal/Terminal.js";

// ============================================
//              CORE SETUP
// ============================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  SCENE_CONFIG.camera.fov,
  window.innerWidth / window.innerHeight,
  SCENE_CONFIG.camera.near,
  SCENE_CONFIG.camera.far,
);
camera.position.set(...SCENE_CONFIG.camera.position);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById("three-container").appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = SCENE_CONFIG.controls.dampingFactor;
controls.target.set(...SCENE_CONFIG.controls.target);

// ============================================
//                LIGHTING
// ============================================

const ambientLight = new THREE.AmbientLight(
  SCENE_CONFIG.lighting.ambient.color,
  SCENE_CONFIG.lighting.ambient.intensity,
);
scene.add(ambientLight);

const bulbLight = new THREE.PointLight(
  SCENE_CONFIG.lighting.bulb.color,
  SCENE_CONFIG.lighting.bulb.intensity,
  SCENE_CONFIG.lighting.bulb.distance,
);
bulbLight.position.set(...SCENE_CONFIG.lighting.bulb.position);
bulbLight.castShadow = true;
scene.add(bulbLight);

// ============================================
//           WORMHOLE SETUP
// ============================================

const wormhole = new Wormhole(scene);
let voidScene = null;

// Transition callback: triggered when user types "start"
async function onTransitionStart() {
  console.log("🌀 Starting wormhole transition...");

  // 1. Fade out terminal (1 second)
  terminal.fadeOut(1000);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 2. Disable controls
  controls.enabled = false;

  // 3. Hide desk/monitor
  hideDeskScene();

  // 4. Activate wormhole
  wormhole.active();

  // 5. Start wormhole — also begin building the tunnel-exit light 4s before it ends
  const flash = document.getElementById("transition-flash");
  const WORMHOLE_DURATION = 19000;
  const FLASH_BUILDUP = 4000;

  const flashBuildupTimer = setTimeout(() => {
    flash.style.transition = `opacity ${FLASH_BUILDUP / 1000}s ease-in`;
    flash.style.opacity = "1";
  }, WORMHOLE_DURATION - FLASH_BUILDUP);

  await wormhole.animate();
  clearTimeout(flashBuildupTimer);

  // 6. Dispose wormhole and load void scene underneath while still white
  wormhole.dispose();
  sceneManager.setScene(voidScene);

  // 7. Fade the white light out to reveal the void
  await new Promise((resolve) => {
    flash.style.transition = "opacity 2s ease-out";
    flash.style.opacity = "0";
    setTimeout(resolve, 2000);
  });

  console.log("✅ Wormhole transition complete");
}

function hideDeskScene() {
  scene.traverse((object) => {
    if (
      object.userData &&
      (object.userData.isDesk || object.userData.isMonitor)
    ) {
      object.visible = false;
    }
  });
}

const terminal = new Terminal(onTransitionStart);
const sceneManager = new SceneManager(scene, camera, renderer, controls);
const deskScene = new DeskScene(scene, camera, controls, terminal);

// ============================================
//              INITIALIZATION
// ============================================

async function init() {
  console.log("⏳ Loading assets...");

  // Load desk scene
  await deskScene.init();

  // Load wormhole textures
  await wormhole.loadTextures();

  // Generate wormhole geometry
  wormhole.generate();

  // Create void scene
  voidScene = new VoidScene(scene, camera, controls);
  await voidScene.init();

  // Start with desk scene
  sceneManager.setScene(deskScene);

  console.log("✅ All assets loaded - ready to start!");
  console.log("💡 Click the monitor to begin");
}

init();

// ============================================
//              ANIMATION LOOP
// ============================================

let lastTime = 0;

function animate(timestamp) {
  requestAnimationFrame(animate);

  const time = timestamp / 1000;
  const deltaTime = time - lastTime;
  lastTime = time;

  controls.update();

  // Update wormhole camera movement if active
  wormhole.update(camera);

  // Update current scene
  sceneManager.update(time);
  sceneManager.render();
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
