import * as THREE from "three";

/**
 * Multiverse Scene
 * Fractal cosmic bubble environment — loaded after the wormhole transition.
 *
 * Build order (see teaching plan):
 *   Step 0  ✓ Shell wired into main.js
 *   Step 1  - Dark background + fog
 *   Step 2  - Particle star field
 *   Step 3  - Single iridescent bubble (MeshPhysicalMaterial)
 *   Step 4  - Nested inner glowing core (additive blending)
 *   Step 5  - Multiple bubbles via _createBubble() factory
 *   Step 6  - Organic blob connective shapes (vertex displacement)
 *   Step 7  - Lighting for the mood
 *   Step 8  - Animation (update loop + GSAP breathing)
 */
export class MultiverseScene {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;

    this.originalBackground = null;
    // Add more instance properties here as you build each step
  }

  async init() {
    // Called once at app startup — put expensive async setup here
    // (e.g. loading environment maps, textures)
  }

  enter() {
    // Called every time this scene becomes active
    this.originalBackground = this.scene.background;

    this.scene.background = new THREE.Color(0x05030f);
    this.scene.fog = new THREE.FogExp2(0x05030f, 0.018);

    // Step 2: create star field here

    // Step 3–5: create bubble(s) here

    // Step 7: add lights here

    // Position camera
    this.camera.position.set(0, 0, 20);
    this.controls.target.set(0, 0, 0);
    this.controls.enabled = true;
    this.controls.update();
  }

  exit() {
    // Called every time this scene is deactivated
    // Restore original state and dispose everything you created in enter()
    this.scene.background = this.originalBackground;
    this.scene.fog = null;

    // Dispose geometries, materials, and remove meshes here as you add them
    // Pattern: this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.scene.remove(this.mesh)
  }

  update(time) {
    // Called every frame — time is in seconds
    // Step 2: rotate star field here
    // Step 6: vertex displacement loop here
    // Step 8: per-frame opacity/rotation animation here
  }
}
