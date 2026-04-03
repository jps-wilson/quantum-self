import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { SCENE_CONFIG } from "./config/constants.js";
import { DeskScene } from "./scenes/DeskScene.js";
import { SceneManager, SceneManager } from "./scenes/SceneManager.js";
import { Terminal } from "./terminal/Terminal.js";

// CORE SETUP
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

// LIGHTING
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

const bulbGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const bulbMaterial = new THREE.MeshStandardMaterial({
  color: SCENE_CONFIG.lighting.bulb.color,
  emissive: SCENE_CONFIG.lighting.bulb.color,
  emissiveIntensity: 2,
});
const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
bulb.position.copy(bulbLight.position);
scene.add(bulb);

// TERMINAL & SCENE SETUP

// transition callback: triggered when user types "start"
function onTransitionStart() {
  console.log("Starting black hole transition...");
  // TODO: implement black hole transition
  Terminal.fadeOut(1000);
}

const terminal = new Terminal(onTransitionStart);
const sceneManager = new SceneManager(scene, camera, renderer, controls);
const deskScene = new DeskScene(scene, camera, controls, terminal);

// INITIALIZATION
async function init() {
  await deskScene.init();
  sceneManager.setScene(deskScene);
  console.log("Desk scene loaded");
}

init();

// ANIMATION LOOP
let lastTime = 0;

function animate(timestamp) {
  requestAnimationFrame(animate);

  const time = timestamp / 1000;
  const deltaTime = time - lastTime;
  lastTime = time;

  controls.update();
  sceneManager.update(time);
  sceneManager.render();
}

animate();

// WINDOW RESIZE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
