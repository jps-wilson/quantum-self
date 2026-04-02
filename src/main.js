import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";

// Global reference to monitor
let monitorModel = null;

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
document.body.appendChild(renderer.domElement);

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
//                 LIGHTING
// ============================================

const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

const bulbLight = new THREE.PointLight(0xffa500, 3, 50);
bulbLight.position.set(0, 3, 0);
bulbLight.castShadow = true;
scene.add(bulbLight);

const bulbGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const bulbMaterial = new THREE.MeshBasicMaterial({
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

function animate() {
  requestAnimationFrame(animate);
  controls.update();

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
