import * as THREE from "three";
import gsap from "gsap";
import { createBloom } from "./multiverse/createBloom.js";
import { createStars } from "./multiverse/createStars.js";
import { createBubbles, BUBBLE_DATA } from "./multiverse/createBubbles.js";
import { createLights } from "./multiverse/createLights.js";
import { MultiverseUI } from "../ui/MultiverseUI.js";

/**
 * MultiverseScene
 * Fractal cosmic bubble environment — loaded after the wormhole transition.
 *
 * Responsibilities of this file:
 *   - Scene lifecycle: init / enter / exit / update / render
 *   - Coordinating the sub-modules (stars, bubbles, lights, bloom)
 *   - Per-frame animation (blob deformation, rotations, particle follow)
 *   - Audio
 *
 * Visual construction is delegated to src/scenes/multiverse/:
 *   createBloom.js   — EffectComposer + UnrealBloomPass
 *   createStars.js   — star field + nebula clouds
 *   createBubbles.js — bubbles, connector blob, micro-bubbles
 *   createLights.js  — all point / directional / ambient lights
 */
export class MultiverseScene {
  constructor(scene, camera, controls, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.renderer = renderer;

    this.originalBackground = null;
    this.envMap = null;
    this.composer = null;

    this.stars = null;
    this.starTexture = null;
    this.nebula = null;
    this.nebulaTexture = null;

    this.bubbles = [];
    this.blobs = [];
    this.blobOriginalPositions = [];
    this.microBubbles = [];

    this.tweens = [];

    this.lights = [];

    this.ui = null;

    this.ambientAudio = null;
    this._startAudio = null;
    this._onResize = null;
  }

  // * ─── Lifecycle ────────────────────────────────────────────────────────────

  async init() {
    // Load environment map (required for transmission materials)
    const texture = await new THREE.TextureLoader().loadAsync(
      "/textures/multiverse.png",
    );
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromEquirectangular(texture).texture;
    pmrem.dispose();
    texture.dispose();

    // Set up post-processing bloom
    const { composer, bloom } = createBloom(
      this.renderer,
      this.scene,
      this.camera,
    );
    this.composer = composer;
    this.bloom = bloom;
  }

  enter() {
    // Scene-wide settings
    this.originalBackground = this.scene.background;
    this.scene.background = new THREE.Color(0x05030f);
    this.scene.fog = new THREE.FogExp2(0x05030f, 0.006);
    this.scene.environment = this.envMap;

    this.controls.enabled = true;
    this.controls.domElement.style.pointerEvents = "auto";

    // Build scene elements via sub-modules
    ({
      stars: this.stars,
      nebula: this.nebula,
      starTexture: this.starTexture,
      nebulaTexture: this.nebulaTexture,
    } = createStars(this.scene));

    ({
      bubbles: this.bubbles,
      blobs: this.blobs,
      blobOriginalPositions: this.blobOriginalPositions,
      microBubbles: this.microBubbles,
      tweens: this.tweens,
    } = createBubbles(this.scene, this.envMap));

    // Mute any desk-scene ambient lights before adding multiverse lights
    this.scene.traverse((obj) => {
      if (obj.isAmbientLight && !this.lights.includes(obj)) {
        obj.userData._prevIntensity = obj.intensity;
        obj.intensity = 0;
      }
    });
    this.lights = createLights(this.scene);

    // Position camera facing the bubble cluster
    this.camera.position.set(0, 0, 45);
    this.camera.lookAt(0, 0, 0);

    // Audio
    this._setupAudio();

    // Keep composer sized correctly on window resize
    this._onResize = () =>
      this.composer.setSize(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", this._onResize);

    // UI - question panel and narrative overlays
    this.ui = new MultiverseUI(this.camera);
    this.ui.init(
      BUBBLE_DATA.map((b) => ({
        x: b.pos[0],
        y: b.pos[1],
        z: b.pos[2],
        radius: b.radius,
      })),
    );
    this.ui.onAnswer = (questionId, answerId) => {
      // TODO: Bubble reaction will be added here in a later step
      console.log(`Question ${questionId} answered: ${answerId}`);
    };
  }

  exit() {
    this.scene.background = this.originalBackground;
    this.scene.fog = null;
    this.scene.environment = null;

    // Stars
    if (this.stars) {
      this.stars.geometry.dispose();
      this.stars.material.dispose();
      this.scene.remove(this.stars);
      this.stars = null;
    }
    if (this.starTexture) {
      this.starTexture.dispose();
      this.starTexture = null;
    }

    // Nebula
    if (this.nebula) {
      this.nebula.geometry.dispose();
      this.nebula.material.dispose();
      this.scene.remove(this.nebula);
      this.nebula = null;
    }
    if (this.nebulaTexture) {
      this.nebulaTexture.dispose();
      this.nebulaTexture = null;
    }

    // Bubbles
    this.bubbles.forEach((group) => {
      group.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      this.scene.remove(group);
    });
    this.bubbles = [];

    // Blobs
    this.blobs.forEach((blob) => {
      blob.geometry.dispose();
      blob.material.dispose();
      this.scene.remove(blob);
    });
    this.blobs = [];
    this.blobOriginalPositions = [];

    // Micro-bubbles
    this.microBubbles.forEach((group) => {
      group.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      this.scene.remove(group);
    });
    this.microBubbles = [];

    // Tweens
    this.tweens.forEach((t) => t.kill());
    this.tweens = [];

    // Lights + restore desk-scene ambient
    this.lights.forEach((l) => this.scene.remove(l));
    this.lights = [];
    this.scene.traverse((obj) => {
      if (obj.isAmbientLight && obj.userData._prevIntensity !== undefined) {
        obj.intensity = obj.userData._prevIntensity;
        delete obj.userData._prevIntensity;
      }
    });

    // UI
    if (this.ui) {
      this.ui.dispose();
      this.ui = null;
    }

    // Audio
    if (this._startAudio) {
      window.removeEventListener("pointerdown", this._startAudio);
      this._startAudio = null;
    }
    if (this.ambientAudio) {
      this.ambientAudio.pause();
      this.ambientAudio = null;
    }

    window.removeEventListener("resize", this._onResize);
  }

  // * ─── Per-frame update ─────────────────────────────────────────────────────

  update(time) {
    // Blob vertex deformation — organic breathing surface
    this.blobs.forEach((blob, index) => {
      const posAttr = blob.geometry.getAttribute("position");
      const original = this.blobOriginalPositions[index];

      for (let i = 0; i < posAttr.count; i++) {
        const ox = original[i * 3];
        const oy = original[i * 3 + 1];
        const oz = original[i * 3 + 2];

        const r = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;
        const angle = Math.atan2(oy, ox);
        const elevation = Math.asin(Math.max(-1, Math.min(1, oz / r)));
        const wave =
          Math.sin(angle * 3 + time * 0.8) *
          Math.cos(elevation * 2 + time * 0.5);
        const disp = 1 + wave * 0.18;

        posAttr.array[i * 3] = ox * disp;
        posAttr.array[i * 3 + 1] = oy * disp;
        posAttr.array[i * 3 + 2] = oz * disp;
      }

      posAttr.needsUpdate = true;
      blob.geometry.computeVertexNormals();
    });

    // Slow bubble rotation
    this.bubbles.forEach((bubble, i) => {
      bubble.rotation.y = time * (0.04 + i * 0.01);
      bubble.rotation.x = time * (0.02 + i * 0.005);
    });

    // Star field + nebula follow camera so they never run out
    if (this.stars) {
      this.stars.position.copy(this.camera.position);
      this.stars.rotation.y = time * 0.01;
    }
    if (this.nebula) {
      this.nebula.position.copy(this.camera.position);
      this.nebula.rotation.y = time * 0.004;
      this.nebula.rotation.x = time * 0.002;
    }

    if (this.ui) {
      this.ui.update(this.camera, this.renderer);
    }
  }

  // * ─── Render ───────────────────────────────────────────────────────────────

  render() {
    this.composer.render();
  }

  // * ─── Private ──────────────────────────────────────────────────────────────

  _setupAudio() {
    this.ambientAudio = new Audio("/audio/ambient-soundscape.mp3");
    this.ambientAudio.loop = true;
    this.ambientAudio.volume = 0;

    // Fallback: play on next user interaction if autoplay is blocked
    this._startAudio = () => {
      if (this.ambientAudio) {
        this.ambientAudio
          .play()
          .then(() => gsap.to(this.ambientAudio, { volume: 0.35, duration: 4 }))
          .catch((e) => console.warn("Audio error:", e));
      }
    };

    this.ambientAudio
      .play()
      .then(() => gsap.to(this.ambientAudio, { volume: 0.35, duration: 4 }))
      .catch(() => {
        window.addEventListener("pointerdown", this._startAudio, {
          once: true,
        });
      });
  }
}
