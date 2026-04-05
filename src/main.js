import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { SCENE_CONFIG } from "./config/constants.js";
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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById("three-container").appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = SCENE_CONFIG.controls.dampingFactor;
controls.target.set(...SCENE_CONFIG.controls.target);

// ============================================
//              LIGHTING
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

// bulb visual — glass envelope + metal socket + soft glow halo
const bulbGroup = new THREE.Group();
bulbGroup.position.copy(bulbLight.position);

// glass envelope (the glowing part)
const glassMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 16, 16),
  new THREE.MeshStandardMaterial({
    color: SCENE_CONFIG.lighting.bulb.color,
    emissive: SCENE_CONFIG.lighting.bulb.color,
    emissiveIntensity: 4,
    transparent: true,
    opacity: 0.92,
  }),
);
bulbGroup.add(glassMesh);

// metal socket/base
const socketMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.055, 0.08, 12),
  new THREE.MeshStandardMaterial({
    color: 0x999999,
    metalness: 0.85,
    roughness: 0.35,
  }),
);
socketMesh.position.y = -0.12;
bulbGroup.add(socketMesh);

// soft glow halo — large transparent sphere, additive so it bleeds warm light
const glowMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 16, 16),
  new THREE.MeshBasicMaterial({
    color: SCENE_CONFIG.lighting.bulb.color,
    transparent: true,
    opacity: 0.07,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
bulbGroup.add(glowMesh);

scene.add(bulbGroup);

// ============================================
//              TRANSITION
// ============================================

const flashEl = document.getElementById("transition-flash");

function flashIn(duration) {
  flashEl.style.transition = `opacity ${duration}ms ease-in`;
  flashEl.style.opacity = "1";
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function flashOut(duration) {
  flashEl.style.transition = `opacity ${duration}ms ease-out`;
  flashEl.style.opacity = "0";
}

// triggered when user types "start" in the terminal
async function onTransitionStart() {
  // fade terminal out, revealing the 3D scene
  terminal.fadeOut(800);
  await new Promise((resolve) => setTimeout(resolve, 900));
  terminal.hide();

  // flash to white — the dimensional leap moment
  await flashIn(400);

  // hide desk lighting before switching scenes
  bulbLight.visible = false;
  bulbGroup.visible = false;

  // switch to the void
  sceneManager.setScene(voidScene);

  // fade out to reveal the dimensional space
  flashOut(1500);
}

// ============================================
//              SCENES
// ============================================

const terminal = new Terminal(onTransitionStart);
const sceneManager = new SceneManager(scene, camera, renderer, controls);
const deskScene = new DeskScene(scene, camera, controls, terminal);
let voidScene = null;

async function init() {
  await deskScene.init();

  voidScene = new VoidScene(scene, camera, controls);
  await voidScene.init();

  sceneManager.setScene(deskScene);
}

init();

// ============================================
//              ANIMATION LOOP
// ============================================

function animate(timestamp) {
  requestAnimationFrame(animate);

  const time = timestamp / 1000;

  controls.update();
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
