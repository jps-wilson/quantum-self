import * as THREE from "three";

/**
 * Void Scene
 * The cosmic space after entering the black hole
 * Contains: starfield, nebula, decision points
 */
export class VoidScene {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;

    this.stars = null;
    this.nebulaClouds = [];
  }

  /**
   * Initialize the void scene
   */
  async init() {
    this._createStarfield();
    this._createNebulaClouds();
    this._positionCamera();

    console.log("Void scene initialized");
  }

  // called when scene becomes active
  enter() {
    this.controls.enabled = true;
    console.log("Entered the void");
  }

  // called when scene becomes inactive
  exit() {
    // cleanup if needed
  }

  // update loop (called every frame)
  update(time) {
    // slowly rotate nebula clouds
    this.nebulaClouds.forEach((cloud, i) => {
      cloud.rotation.y = time * 0.05 * (i % 2 === 0 ? 1 : -1);
    });
  }

  // PRIVATE METHODS
  _createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      // Random position in a sphere
      const radius = 100 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
    });

    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  _createNebulaClouds() {
    const nebulaColors = [
      0x8b5cf6, // Purple
      0xec4899, // Pink
      0x3b82f6, // Blue
    ];

    nebulaColors.forEach((color, i) => {
      const geometry = new THREE.SphereGeometry(30, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
      });

      const nebula = new THREE.Mesh(geometry, material);

      // position nebulas around the space
      const angle = (i / nebulaColors.length) * Math.PI * 2;
      const distance = 80;
      nebula.position.set(
        Math.cos(angle) * distance,
        (Math.random() - 0.5) * 40,
        Math.sin(angle) * distance,
      );

      this.nebulaClouds.push(nebula);
      this.scene.add(nebula);
    });
  }

  _positionCamera() {
    // Position camera in the center of the void
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(0, 0, -10);
  }
}
