import * as THREE from "three";

/**
 * Void Scene
 * Empty space with multiverse.png as a skybox.
 */
export class VoidScene {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;

    this.skybox = null;
    this.originalBackground = null;
    this.isUserControlling = false;
    this._resumeTimer = null;
    this._onControlStart = () => {
      this.isUserControlling = true;
      clearTimeout(this._resumeTimer);
    };
    this._onControlEnd = () => {
      // Resume auto-rotation 1.5s after the user lets go
      this._resumeTimer = setTimeout(() => {
        this.isUserControlling = false;
      }, 1500);
    };
  }

  async init() {}

  enter() {
    this.originalBackground = this.scene.background;
    this.scene.background = new THREE.Color(0x000000);
    this._createSkybox();
    this._positionCamera();
    this.controls.addEventListener("start", this._onControlStart);
    this.controls.addEventListener("end", this._onControlEnd);
  }

  exit() {
    this.scene.background = this.originalBackground;
    this.controls.removeEventListener("start", this._onControlStart);
    this.controls.removeEventListener("end", this._onControlEnd);
    clearTimeout(this._resumeTimer);

    if (this.skybox) {
      this.skybox.geometry.dispose();
      this.skybox.material.map.dispose();
      this.skybox.material.dispose();
      this.scene.remove(this.skybox);
      this.skybox = null;
    }
  }

  update() {
    if (this.skybox && !this.isUserControlling) {
      this.skybox.rotation.y += 0.0003;
    }
  }

  _createSkybox() {
    const texture = new THREE.TextureLoader().load("/textures/multiverse.png");
    texture.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.SphereGeometry(500, 64, 64);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
    });

    this.skybox = new THREE.Mesh(geo, mat);
    this.scene.add(this.skybox);
  }

  _positionCamera() {
    this.camera.position.set(0, 0, 0);
    this.controls.target.set(0, 0, 1);
    this.controls.enabled = true;
    this.controls.update();
  }
}
