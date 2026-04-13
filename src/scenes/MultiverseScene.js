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
  constructor(scene, camera, controls, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.renderer = renderer;

    this.originalBackground = null;
    this.stars = null;
    this.bubble = null;
  }

  async init() {
    // Called once at app startup — put expensive async setup here
    // (e.g. loading environment maps, textures)
    const texture = await new THREE.TextureLoader().loadAsync(
      "/textures/multiverse.png",
    );
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromEquirectangular(texture).texture;
    pmrem.dispose();
    texture.dispose();
  }

  enter() {
    // Called every time this scene becomes active
    this.originalBackground = this.scene.background;

    this.scene.background = new THREE.Color(0x05030f);
    this.scene.fog = new THREE.FogExp2(0x05030f, 0.018);

    const count = 4000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // random point inside a sphere of radius 80
      // rejection sampling: keep only points within the sphere
      let x, y, z;
      do {
        x = (Math.random() - 0.5) * 160;
        y = (Math.random() - 0.5) * 160;
        z = (Math.random() - 0.5) * 160;
      } while (Math.sqrt(x * x + y * y + z * z) > 80);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xaaaaff,
      size: 0.15,
      sizeAttenuation: true,
      map: this._makeStarTexture(),
      transparent: true,
      alphaTest: 0.01, // discards pixels below 1% opacity - kills the square edge
      depthWrite: false,
    });

    this.starTexture = mat.map;
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);

    const bubbleGeo = new THREE.SphereGeometry(3, 64, 64);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0x8888ff,
      transmission: 0.95,
      thickness: 0.4,
      roughness: 0.05,
      metalness: 0,
      ior: 1.35,
      iridescence: 1.0,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [100, 400],
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      envMap: this.envMap,
    });

    this.bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
    this.scene.add(this.bubble);

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

    if (this.bubble) {
      this.bubble.geometry.dispose();
      this.bubble.material.dispose();
      this.scene.remove(this.bubble);
      this.bubble = null;
    }

    // Dispose geometries, materials, and remove meshes here as you add them
    // Pattern: this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.scene.remove(this.mesh)
  }

  update(time) {
    // Called every frame — time is in seconds
    if (this.stars) {
      this.stars.rotation.y = time * 0.01;
    }
    // Step 6: vertex displacement loop here
    // Step 8: per-frame opacity/rotation animation here
  }

  _makeStarTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    // radial gradient: white center, fully transparent at edges
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.6)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
  }
}
