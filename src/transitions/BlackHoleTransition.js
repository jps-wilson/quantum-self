import * as THREE from "three";
import { TRANSITION_CONFIG } from "../config/constants.js";

/**
 * Quantum Leap Transition
 * Plays the quantum_leap.glb model animations, pulls the camera through it,
 * and drives a CSS warp overlay to sell the dimensional jump.
 */
export class BlackHoleTransition {
  constructor(scene, camera, controls, quantumLeapModel, gltf) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.model = quantumLeapModel;
    this.config = TRANSITION_CONFIG.blackHole;

    this.isPlaying = false;
    this.startTime = 0;
    this.onComplete = null;

    // warp overlay DOM element
    this.warpEl = document.getElementById("warp-overlay");

    // animation mixer — plays the model's built-in animations
    this.mixer = null;
    if (gltf && gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.model);
      gltf.animations.forEach((clip) => {
        const action = this.mixer.clipAction(clip);
        action.play();
      });
    }

    // hide until transition starts
    this.model.visible = false;
  }

  // play() accepts an optional spawn position (e.g. the monitor's world position)
  play(spawnPosition = null) {
    return new Promise((resolve) => {
      this.isPlaying = true;
      this.startTime = performance.now() / 1000;
      this.onComplete = resolve;

      this.controls.enabled = false;
      this._spawn(spawnPosition);
    });
  }

  // called every frame from main animate loop
  update(currentTime) {
    if (!this.isPlaying) return;

    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.config.duration, 1.0);

    // tick model animations
    if (this.mixer) {
      this.mixer.setTime(elapsed);
    }

    this._updateModel(progress);
    this._updateCamera(progress);
    this._updateWarpOverlay(progress);

    if (progress >= 1.0) this._complete();
  }

  // PRIVATE METHODS

  _spawn(spawnPosition) {
    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);

    if (spawnPosition) {
      this.model.position.copy(spawnPosition);
    } else {
      this.model.position.copy(
        this.camera.position
          .clone()
          .add(cameraDir.multiplyScalar(this.config.spawnDistance)),
      );
    }

    // orient so the model's tunnel faces the camera
    this.model.lookAt(this.camera.position);

    // start tiny
    this.model.scale.set(0.05, 0.05, 0.05);
    this.model.visible = true;

    // store the spawn position for camera pull target
    this._target = this.model.position.clone();
    // store camera start position for interpolation
    this._cameraStart = this.camera.position.clone();
  }

  _updateModel(progress) {
    // grow using ease-out so it expands fast then stabilises
    const scale = this._easeOutCubic(Math.min(progress * 1.5, 1)) * this.config.maxScale;
    this.model.scale.set(scale, scale, scale);

    // spin — speeds up as progress increases
    const spinRate = this.config.spinSpeed * (1 + progress * 3);
    this.model.rotation.y += spinRate * 0.016;
    this.model.rotation.z += spinRate * 0.008;
  }

  _updateCamera(progress) {
    // ease-in-cubic so the camera starts slow and slams into the wormhole
    const pull = this._easeInCubic(progress);

    // interpolate camera toward (and through) the model center
    // overshoot slightly past the model at progress = 1
    const overshoot = 1.15;
    this.camera.position.lerpVectors(
      this._cameraStart,
      this._target,
      pull * overshoot,
    );

    // always look at the model centre for the "tunnel" effect
    this.camera.lookAt(this._target);
  }

  _updateWarpOverlay(progress) {
    if (!this.warpEl) return;

    // start at 15% progress, build to full intensity
    const warpIntensity = this._easeInCubic(Math.max(0, (progress - 0.15) / 0.85));

    // cycle through aurora hues as you travel
    const hue  = Math.floor(progress * 240) % 360;       // purple → green → cyan
    const hue2 = (hue + 130) % 360;

    // inner transparent zone shrinks as you get pulled in — tunnel effect
    const innerClear = Math.max(0, 45 - warpIntensity * 45);

    this.warpEl.style.background = `radial-gradient(ellipse at center,
      hsla(${hue},  100%, 85%, ${warpIntensity * 0.7}) 0%,
      hsla(${hue},  100%, 65%, ${warpIntensity * 0.5}) ${innerClear}%,
      hsla(${hue2}, 100%, 55%, ${warpIntensity * 0.85}) 70%,
      hsla(${hue2}, 100%, 40%, ${warpIntensity}) 100%
    )`;
    this.warpEl.style.opacity = Math.min(warpIntensity * 1.2, 1);
  }

  _complete() {
    this.isPlaying = false;

    // reset warp overlay
    if (this.warpEl) this.warpEl.style.opacity = "0";

    this._hideDeskScene();

    if (this.onComplete) this.onComplete();
  }

  _hideDeskScene() {
    this.scene.traverse((obj) => {
      if (
        obj.userData.isDesk ||
        obj.userData.isMonitor
      ) {
        obj.visible = false;
      }
    });
  }

  // easing functions
  _easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  _easeInCubic(x)  { return x * x * x; }
}
