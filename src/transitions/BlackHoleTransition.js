import * as THREE from "three";
import { TRANSITION_CONFIG } from "../config/constants.js";

/**
 * Black Hole Transition
 * Animates the black hole appearing, growing, spinning, and pulling the camera in
 */
export class BlackHoleTransition {
  constructor(scene, camera, controls, BlackHoleModel) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.blackHole = BlackHoleModel;

    this.isPlaying = false;
    this.startTime = 0;
    this.config = TRANSITION_CONFIG.blackHole;

    // hide black hole initially
    this.blackHole.visible = false;
  }

  // play transition animation + returns promise that resolves when transition completes
  play() {
    return new Promise((resolve) => {
      this.isPlaying = true;
      this.startTime = performance.now() / 1000;
      this.onComplete = resolve;

      // disables orbit controls during transition
      this.controls.enabled = false;

      // positions black hole in front of camera
      this._spawnBlackHole();

      console.log("black hole transition started");
    });
  }

  // update transition animation (call every frame)
  update(currentTime) {
    if (!this.isPlaying) return;

    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.config.duration, 1.0);

    // update black hole
    this._updateBlackHole(progress);

    // update camera position (pull toward black hole)
    this._updateCamera(progress);

    // complete transition
    if (progress >= 1.0) {
      this._complete();
    }
  }

  // PRIVATE METHODS
  _spawnBlackHole() {
    // position black hole in front of camera
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    const spawnPosition = this.camera.position
      .clone()
      .add(cameraDirection.multiplyScalar(this.config.spawnDistance));

    this.blackHole.position.copy(spawnPosition);
    this.blackHole.scale.set(0.01, 0.01, 0.01); // start tiny
    this.blackHole.visible = true;
  }

  _updateBlackHole(progress) {
    // ease-out growth
    const growth = this._easeOutCubic(progress) * this.config.growthRate;
    this.blackHole.scale.set(growth, growth, growth);

    // spin
    this.blackHole.rotation.y += this.config.spinSpeed * 0.016; // 60fps
    this.blackHole.rotation.z += this.config.spinSpeed * 0.008;
  }

  _updateCamera(progress) {
    // pull camera toward black hole (ease-in for acceleration)
    const pullStrength = this._easeInCubic(progress) * this.config.pullStrength;

    const direction = new THREE.Vector3()
      .subVectors(this.blackHole.position, this.camera.position)
      .normalize()
      .multiplyScalar(pullStrength * 0.016);

    this.camera.position.add(direction);
    this.camera.lookAt(this.blackHole.position);
  }

  _complete() {
    this.isPlaying = false;
    console.log("Black hole transition complete");

    // hide desk/monitor (they should be gone by now)
    this._hideDeskScene();

    // callback
    if (this.onComplete) {
      this.onComplete();
    }
  }

  _hideDeskScene() {
    // Find and hide desk/monitor models
    this.scene.traverse((object) => {
      if (
        object.name &&
        (object.name.includes("desk") || object.name.includes("monitor"))
      ) {
        object.visible = false;
      }
      // Alternative: check if it's a loaded model group
      if (
        object.userData &&
        (object.userData.isDesk || object.userData.isMonitor)
      ) {
        object.visible = false;
      }
    });
  }

  // easing functions
  _easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  _easeInCubic(x) {
    return x * x * x;
  }
}
