/**
 * Multiverse Scene
 //TODO: [explanation of scene]
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export default class MultiverseScene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationId = null;
  }

  init(canvas) {
    console.log("MultiverseScene init called");

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );
    this.camera.position.set(0, 0, 100);

    // Renderer
    this.renderer = new THREE.WebGLRenderer(
      this.camera,
      this.renderer.domElement,
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.4;
    this.controls.zoomSpeed = 0.8;
    this.controls.enablePan = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;

    // test cube to verify scene is working
    const testGeo = new THREE.BoxGeometry(10, 10, 10);
    const testMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const testCube = new THREE.Mesh(testGeo, testMat);
    this.scene.add(testCube);

    // Start animation
    this.animate();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  update(deltaTime) {
    // TODO: Animation logic to go here
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    console.log("MultiverseScene dispose called");

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.controls) {
      this.controls.dispose();
    }

    // Clean up geometries and materials
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
