import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { gsap } from "gsap";
import { SCENE_CONFIG, MODELS } from "./config/constants.js";
import { loadModel } from "./utils/modelLoader.js";
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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.useLegacyLights = false;
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
bulbLight.castShadow = true;

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

  // 5. Start wormhole audio (fade in over 3s)
  const audio = new Audio("/audio/wormhole.wav");
  audio.loop = true;
  audio.volume = 0;
  audio.play();
  gsap.to(audio, { volume: 0.8, duration: 3 });

  // 6. Start wormhole — also begin building the tunnel-exit light 4s before it ends
  const flash = document.getElementById("transition-flash");
  const WORMHOLE_DURATION = 19000;
  const FLASH_BUILDUP = 4000;

  const outpostAudio = new Audio("/audio/outpost.mp3");
  outpostAudio.loop = true;
  outpostAudio.volume = 0;

  const flashBuildupTimer = setTimeout(() => {
    // Fade out wormhole audio and flash to white
    flash.style.transition = `opacity ${FLASH_BUILDUP / 1000}s ease-in`;
    flash.style.opacity = "1";
    gsap.to(audio, { volume: 0, duration: FLASH_BUILDUP / 1000 });

    // Crossfade into outpost audio
    outpostAudio.play();
    gsap.to(outpostAudio, { volume: 0.7, duration: FLASH_BUILDUP / 1000 });
  }, WORMHOLE_DURATION - FLASH_BUILDUP);

  await wormhole.animate();
  clearTimeout(flashBuildupTimer);

  // 7. Dispose wormhole and load void scene underneath while still white
  audio.pause();
  wormhole.dispose();
  sceneManager.setScene(voidScene);

  // 8. Fade the white light out to reveal the void
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

  // Load light fixture model and attach the point light to it
  const lightModel = await loadModel(
    MODELS.light.path,
    MODELS.light.position,
    MODELS.light.scale,
  );

  // Make the bulb meshes glow like a lit filament bulb
  const BULB_MESHES = [
    "Clean_light_bulb_clean_bulb_light_mat_0",
    "Broken_light_bulb_old_bulb_light_mat_0",
    "wire_filament_wire_filament_mat_0",
    "wire_filament001_old_wire_filament_mat_0",
  ];
  lightModel.traverse((child) => {
    if (child.isMesh && BULB_MESHES.includes(child.name)) {
      child.material = child.material.clone();
      child.material.emissive = new THREE.Color(0xff8800);
      child.material.emissiveIntensity = child.name.includes("filament") ? 3.5 : 1.5;
    }
  });

  lightModel.userData.isDesk = true;
  lightModel.add(bulbLight);
  scene.add(lightModel);

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
