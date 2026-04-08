import * as THREE from "three";
import { MODELS, MONITOR_CONFIG } from "../config/constants.js";
import { loadModel } from "../utils/modelLoader.js";
import { SpatialAudio } from "../utils/SpatialAudio.js";

/**
 * Desk Scene
 * The idle "QUANTUM SELF" screen on the CRT monitor
 */

export class DeskScene {
  constructor(scene, camera, controls, terminal) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.terminal = terminal;

    this.monitorModel = null;
    this.screenMaterial = null;
    this.canvas = null;
    this.ctx = null;
    this.canvasTexture = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isHoveringMonitor = false;

    // audio setup
    this.audioListener = SpatialAudio.createListener(camera);
    this.computerHum = null;

    this._setupCanvas();
    this._setupMouseEvents();
  }

  // initialize scene
  async init() {
    // load desk
    const desk = await loadModel(
      MODELS.desk.path,
      MODELS.desk.position,
      MODELS.desk.scale,
    );
    desk.userData.isDesk = true;
    this.scene.add(desk);

    // load monitor
    this.monitorModel = await loadModel(
      MODELS.monitor.path,
      MODELS.monitor.position,
      MODELS.monitor.scale,
    );
    this.monitorModel.userData.isMonitor = true;
    this.scene.add(this.monitorModel);

    // find screen mesh + apply canvas
    this.monitorModel.traverse((child) => {
      if (child.isMesh && child.name === MONITOR_CONFIG.screen.meshName) {
        this.screenMaterial = new THREE.MeshStandardMaterial({
          map: this.canvasTexture,
          emissiveMap: this.canvasTexture,
          emissive: new THREE.Color(MONITOR_CONFIG.screen.emissiveColor),
          emissiveIntensity: MONITOR_CONFIG.screen.emissiveBase,
        });
        child.material = this.screenMaterial;
      }
    });

    // adding spatial audio to monitor
    this.computerHum = new SpatialAudio(
      this.camera,
      "/audio/computer-hum.wav",
      {
        refDistance: 2, // starts fading after 2 units away
        rolloffFactor: 1.5, // how quickly it fades with distance
        volume: 0.4, // max volume when close
        loop: true,
        autoplay: true,
      },
    );

    await this.computerHum.attachTo(this.monitorModel, this.audioListener);
    console.log("Spatial computer audio loaded");
  }

  // called when scene becomes active
  enter() {
    this.controls.enabled = true;
    // resume audio if it was paused
    if (this.computerHum) {
      this.computerHum.play();
    }
  }

  // called when scene becomes inactive
  exit() {
    this.scene.traverse((obj) => {
      if (obj.userData.isDesk || obj.userData.isMonitor) {
        obj.visible = false;
      }
    });
    // pause audio when leaving scene
    if (this.computerHum) {
      this.computerHum.pause();
    }
  }

  // update loop (called every frame)
  update(time) {
    this._drawQuantumScreen(time);
    this._updateScreenGlow();
    this._checkMonitorHover();
  }

  // PRIVATE METHODS
  _setupCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = MONITOR_CONFIG.canvas.width;
    this.canvas.height = MONITOR_CONFIG.canvas.height;
    this.ctx = this.canvas.getContext("2d");

    this.canvasTexture = new THREE.CanvasTexture(this.canvas);
    this.canvasTexture.minFilter = THREE.LinearFilter;
    this.canvasTexture.magFilter = THREE.LinearFilter;
  }

  _drawQuantumScreen(time) {
    if (!this.ctx) return;
    const { width, height } = this.canvas;
    const { scanlines, noise, vignette } = MONITOR_CONFIG.effects;

    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, width, height);

    const pulse = Math.sin(time * 1.8) * 0.4 + 0.6;

    // QUANTUM
    this.ctx.textAlign = "center";
    this.ctx.shadowColor = "#00ff41";
    this.ctx.shadowBlur = 4 * pulse;
    this.ctx.fillStyle = "#00ff41";
    this.ctx.font = "bold 52px monospace";
    this.ctx.fillText("QUANTUM", width / 2, height / 2 - 16);

    // SELF
    this.ctx.shadowColor = "#ffa657";
    this.ctx.shadowBlur = 2 * pulse;
    this.ctx.fillStyle = "#ffa657";
    this.ctx.font = "bold 22px monospace";
    this.ctx.fillText("S  E  L  F", width / 2, height / 2 + 22);

    // click hint
    const hintAlpha = Math.sin(time * 1.2) * 0.3 + 0.5;
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = `rgba(201, 209, 217, ${hintAlpha})`;
    this.ctx.font = "11px monospace";
    this.ctx.fillText("[ click to enter ]", width / 2, height - 28);

    this.ctx.textAlign = "left";
    this.ctx.shadowBlur = 0;

    // scanlines
    this.ctx.fillStyle = `rgba(0, 0, 0, ${scanlines.opacity})`;
    for (let scanY = 0; scanY < height; scanY += scanlines.gap) {
      this.ctx.fillRect(0, scanY, width, scanlines.thickness);
    }

    // noise
    for (let n = 0; n < noise.count; n++) {
      this.ctx.fillStyle = `rgba(0, 255, 65, ${Math.random() * noise.maxOpacity})`;
      this.ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
    }

    // vignette
    const vignetteGradient = this.ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * vignette.innerRadius,
      width / 2,
      height / 2,
      height * vignette.outerRadius,
    );
    vignetteGradient.addColorStop(0, "rgba(0,0,0,0)");
    vignetteGradient.addColorStop(1, `rgba(0,0,0,${vignette.opacity})`);
    this.ctx.fillStyle = vignetteGradient;
    this.ctx.fillRect(0, 0, width, height);

    this.canvasTexture.needsUpdate = true;
  }

  _updateScreenGlow() {
    if (!this.screenMaterial) return;
    this.screenMaterial.emissiveIntensity =
      MONITOR_CONFIG.screen.emissiveBase +
      Math.random() * MONITOR_CONFIG.screen.emissiveVariance;
  }

  _checkMonitorHover() {
    if (!this.monitorModel) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.monitorModel, true);

    if (intersects.length > 0 && !this.isHoveringMonitor) {
      this.isHoveringMonitor = true;
      document.body.style.cursor = "pointer";
    } else if (intersects.length === 0 && this.isHoveringMonitor) {
      this.isHoveringMonitor = false;
      document.body.style.cursor = "default";
    }
  }

  _setupMouseEvents() {
    let dragStartX = 0;
    let dragStartY = 0;
    let wasDrag = false;

    window.addEventListener("pointerdown", (e) => {
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      wasDrag = false;
    });

    window.addEventListener("pointermove", (e) => {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (dx * dx + dy * dy > 25) wasDrag = true; // 5 px threshold
    });

    window.addEventListener("mousemove", (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener("click", () => {
      if (!wasDrag && this.isHoveringMonitor) {
        this._enterTerminal();
      }
    });
  }

  _enterTerminal() {
    this.controls.enabled = false;
    document.body.style.cursor = "default";
    this.isHoveringMonitor = false;
    if (this.onTerminalOpen) this.onTerminalOpen();
    this.terminal.enter();
  }
}
