import * as THREE from "three";
import { TorusKnot } from "three/examples/jsm/curves/CurveExtras.js";
import { gsap } from "gsap";

/**
 * Wormhole class adapted from acrossthemultiverse repo
 * https://github.com/jesuisundev/acrossthemultiverse/tree/main
 */
export class Wormhole {
  constructor(scene) {
    this.scene = scene;

    // Wormhole state
    this.wormhole = {
      shape: null,
      speed: 0,
      active: false,
      percentage: 0,
      cameraIndex: 0,
    };

    // Materials
    this.wireframedStarsSpeederMaterial = null;
    this.auraSpeederMaterial = null;
    this.nebulaSpeederMaterial = null;
    this.starsSpeederMaterial = null;
    this.clusterSpeederMaterial = null;

    // Geometry
    this.wormholeGeometry = null;
    this.wormholeTubeMesh = null;

    // Animation
    this.wormholeTimeline = null;

    // Textures (you'll need to load these)
    this.galaxyTextures = [];
  }

  /**
   * Load galaxy textures
   * Loads the 5 galaxy images from the wormhole repo
   */
  async loadTextures() {
    const textureLoader = new THREE.TextureLoader();

    // Update these paths to match your actual file names!
    const texturePaths = [
      "/textures/galaxy/galaxy1.jpg", // Wireframed stars layer
      "/textures/galaxy/galaxy2.jpg", // Aura layer
      "/textures/galaxy/galaxy3.jpg", // Nebula layer
      "/textures/galaxy/galaxy4.jpg", // Stars layer
      "/textures/galaxy/galaxy5.jpeg", // Cluster layer
    ];

    // Load all textures in parallel
    const loadPromises = texturePaths.map((path) => {
      return new Promise((resolve, reject) => {
        textureLoader.load(
          path,
          (texture) => {
            console.log(`✅ Loaded: ${path}`);
            resolve(texture);
          },
          undefined,
          (error) => {
            console.error(`❌ Failed to load: ${path}`, error);
            reject(error);
          },
        );
      });
    });

    this.galaxyTextures = await Promise.all(loadPromises);
    console.log("✅ All galaxy textures loaded");
  }

  /**
   * Generate the wormhole geometry and materials
   */
  generate() {
    // Create the path (TorusKnot curve)
    this.wormhole.shape = new TorusKnot(500);

    // Setup texture wrapping for each layer
    // Layer 0: Wireframed stars
    this.galaxyTextures[0].wrapS = THREE.RepeatWrapping;
    this.galaxyTextures[0].wrapT = THREE.MirroredRepeatWrapping;
    this.galaxyTextures[0].repeat.set(40, 2);

    this.wireframedStarsSpeederMaterial = new THREE.MeshBasicMaterial({
      map: this.galaxyTextures[0],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
      wireframe: true,
    });

    // Layer 1: Aura
    this.galaxyTextures[1].wrapS = THREE.RepeatWrapping;
    this.galaxyTextures[1].wrapT = THREE.MirroredRepeatWrapping;
    this.galaxyTextures[1].repeat.set(1, 2);

    this.auraSpeederMaterial = new THREE.MeshBasicMaterial({
      map: this.galaxyTextures[1],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Layer 2: Nebula
    this.galaxyTextures[2].wrapS = THREE.RepeatWrapping;
    this.galaxyTextures[2].wrapT = THREE.MirroredRepeatWrapping;
    this.galaxyTextures[2].repeat.set(20, 2);

    this.nebulaSpeederMaterial = new THREE.MeshBasicMaterial({
      map: this.galaxyTextures[2],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });

    // Layer 3: Stars
    this.galaxyTextures[3].wrapS = THREE.RepeatWrapping;
    this.galaxyTextures[3].wrapT = THREE.MirroredRepeatWrapping;
    this.galaxyTextures[3].repeat.set(10, 2);

    this.starsSpeederMaterial = new THREE.MeshBasicMaterial({
      map: this.galaxyTextures[3],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });

    // Layer 4: Cluster
    this.galaxyTextures[4].wrapS = THREE.RepeatWrapping;
    this.galaxyTextures[4].wrapT = THREE.MirroredRepeatWrapping;
    this.galaxyTextures[4].repeat.set(20, 2);

    this.clusterSpeederMaterial = new THREE.MeshBasicMaterial({
      map: this.galaxyTextures[4],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });

    // Create tube geometry along the curve
    this.wormholeGeometry = new THREE.TubeGeometry(
      this.wormhole.shape,
      800, // tubularSegments
      5, // radius
      12, // radialSegments
      true, // closed
    );

    // Create multi-material mesh (all 5 layers) — one mesh per material sharing geometry
    this.wormholeTubeMesh = new THREE.Group();
    for (const mat of [
      this.wireframedStarsSpeederMaterial,
      this.auraSpeederMaterial,
      this.nebulaSpeederMaterial,
      this.starsSpeederMaterial,
      this.clusterSpeederMaterial,
    ]) {
      this.wormholeTubeMesh.add(new THREE.Mesh(this.wormholeGeometry, mat));
    }

    this.scene.add(this.wormholeTubeMesh);
    console.log("✅ Wormhole generated");
  }

  /**
   * Animate the wormhole transition (same as original)
   * Returns a promise that resolves when animation completes
   */
  async animate() {
    this.wormholeTimeline = gsap.timeline();

    // Phase 1: initial boost (0-7s)
    this.wormholeTimeline
      .to(this.starsSpeederMaterial, { duration: 7, opacity: 1 }, 0)
      .to(
        this.wireframedStarsSpeederMaterial,
        { duration: 7, ease: "expo.out", opacity: 1 },
        0,
      )
      .to(
        this.auraSpeederMaterial,
        { duration: 7, ease: "expo.out", opacity: 1 },
        0,
      )
      .to(this.wormhole, { duration: 7, ease: "expo.out", speed: 2500 }, 0);

    // Phase 2: speed and noise (7-13s)
    this.wormholeTimeline
      .to(this.clusterSpeederMaterial, { duration: 6, opacity: 1 }, 7)
      .to(this.auraSpeederMaterial, { duration: 2, opacity: 0 }, 7)
      .to(this.wormhole, { duration: 6, speed: 2000 }, 7);

    // Phase 3: nebula distortion (13-19s)
    this.wormholeTimeline
      .to(this.nebulaSpeederMaterial, { duration: 6, opacity: 1 }, 13)
      .to(this.clusterSpeederMaterial, { duration: 6, opacity: 0 }, 13)
      .to(this.auraSpeederMaterial, { duration: 6, opacity: 0.7 }, 13)
      .to(this.wormhole, { duration: 6, speed: 1800 }, 13);

    return this.wormholeTimeline.then(() => true);
  }

  /**
   * Regenerate the wormhole after a previous dispose() call.
   * Textures are already loaded so only geometry/materials need rebuilding.
   */
  regenerate() {
    // Reset animation state
    this.wormhole.active = false;
    this.wormhole.speed = 0;
    this.wormhole.percentage = 0;
    this.wormhole.cameraIndex = 0;
    this.wormholeTimeline = null;
    this.wormholeTubeMesh = null;
    this.wormholeGeometry = null;

    // Rebuild geometry and materials from existing textures
    this.generate();
  }

  /**
   * Activate the wormhole
   */
  active() {
    this.wormhole.active = true;
  }

  /**
   * Update the camera position along the wormhole path
   * Call this every frame while wormhole is active
   */
  update(camera) {
    if (!this.wormhole.active || this.wormhole.speed === 0) return;

    // Increment frame counter — divide by speed so higher speed = more frames per loop
    this.wormhole.cameraIndex++;
    const t = (this.wormhole.cameraIndex / this.wormhole.speed) % 1;
    const tNext = ((this.wormhole.cameraIndex + 1) / this.wormhole.speed) % 1;

    // Position camera on the curve, always looking one step ahead
    const point = this.wormhole.shape.getPoint(t);
    const lookAt = this.wormhole.shape.getPoint(tNext);

    camera.position.copy(point);
    camera.lookAt(lookAt);
  }

  /**
   * Clean up and dispose
   */
  dispose() {
    this.wormhole.active = false;

    if (this.wormholeGeometry) {
      this.wormholeGeometry.dispose();
    }

    if (this.wireframedStarsSpeederMaterial)
      this.wireframedStarsSpeederMaterial.dispose();
    if (this.auraSpeederMaterial) this.auraSpeederMaterial.dispose();
    if (this.nebulaSpeederMaterial) this.nebulaSpeederMaterial.dispose();
    if (this.starsSpeederMaterial) this.starsSpeederMaterial.dispose();
    if (this.clusterSpeederMaterial) this.clusterSpeederMaterial.dispose();

    if (this.wormholeTubeMesh) {
      this.scene.remove(this.wormholeTubeMesh);
    }

    this.wormholeTimeline = null;
    this.wormholeTubeMesh = null;
  }
}
