import * as THREE from "three";

/**
 * Void Scene
 * The space between dimensions.
 * Contains: color-shifting void, dimensional grid, layered glowing particle field.
 */
export class VoidScene {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;

    this.particleLayers = [];
    this.grid = null;
    this.particleTexture = null;
    this.originalBackground = null;
  }

  async init() {
    // nothing to preload — objects are added when enter() is called
  }

  // called when scene becomes active
  enter() {
    this.originalBackground = this.scene.background;
    this.scene.background = new THREE.Color(0x04001a);

    this.particleTexture = this._createParticleTexture();
    this._createDimensionalGrid();
    this._createParticleField();
    this._positionCamera();

    console.log("Entered the dimensional void");
  }

  // called when scene becomes inactive
  exit() {
    this.scene.background = this.originalBackground;

    this.particleLayers.forEach((p) => this.scene.remove(p));
    if (this.grid) this.scene.remove(this.grid);
    if (this.particleTexture) this.particleTexture.dispose();

    this.particleLayers = [];
    this.grid = null;
    this.particleTexture = null;
  }

  // update loop (called every frame)
  update(time) {
    // slowly cycle background through deep dimensional hues
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setHSL((time * 0.01) % 1, 1.0, 0.035);
    }

    // drift particle layers at different speeds (parallax)
    this.particleLayers.forEach((layer, i) => {
      layer.rotation.y = time * 0.008 * (i % 2 === 0 ? 1 : -1);
      layer.rotation.x = time * 0.003 * (i % 2 === 0 ? -1 : 1);

      const pos = layer.geometry.attributes.position.array;
      const speed = 0.002 + i * 0.001;
      for (let j = 1; j < pos.length; j += 3) {
        pos[j] += Math.sin(time * 0.3 + j * 0.005) * speed;
      }
      layer.geometry.attributes.position.needsUpdate = true;
    });

    // breathe the grid opacity
    if (this.grid) {
      this.grid.material.opacity = 0.2 + Math.sin(time * 0.35) * 0.08;
    }
  }

  // PRIVATE METHODS

  // soft circular glow sprite — makes particles look like light orbs, not squares
  _createParticleTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0.0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(255,255,255,0.8)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.2)");
    gradient.addColorStop(1.0, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
  }

  _createDimensionalGrid() {
    this.grid = new THREE.GridHelper(400, 80, 0x4c1d95, 0x1e1b4b);
    this.grid.position.y = -20;
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.25;
    this.scene.add(this.grid);
  }

  _createParticleField() {
    // layer config: { count, size, spread, ySpread, zOffset, opacity }
    const layers = [
      // dense fine layer — fills the void with ambient haze
      {
        count: 6000,
        size: 0.6,
        spread: 300,
        ySpread: 80,
        zOffset: -60,
        opacity: 0.55,
      },
      // mid layer — larger, brighter, sparser
      {
        count: 1200,
        size: 1.8,
        spread: 200,
        ySpread: 60,
        zOffset: -40,
        opacity: 0.7,
      },
      // bright highlights — rare large orbs
      {
        count: 200,
        size: 4.0,
        spread: 150,
        ySpread: 40,
        zOffset: -30,
        opacity: 0.85,
      },
    ];

    const palette = [
      new THREE.Color(0x6d28d9), // deep violet
      new THREE.Color(0x7c3aed), // violet
      new THREE.Color(0x06b6d4), // cyan
      new THREE.Color(0x0ea5e9), // sky blue
      new THREE.Color(0xec4899), // pink
      new THREE.Color(0xa855f7), // purple
      new THREE.Color(0x22d3ee), // light cyan
      new THREE.Color(0xf0abfc), // lilac
      new THREE.Color(0x818cf8), // indigo
    ];

    for (const cfg of layers) {
      const positions = new Float32Array(cfg.count * 3);
      const colors = new Float32Array(cfg.count * 3);

      for (let i = 0; i < cfg.count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * cfg.spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * cfg.ySpread;
        positions[i * 3 + 2] = (Math.random() - 0.5) * cfg.spread + cfg.zOffset;

        const c = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: cfg.size,
        map: this.particleTexture,
        vertexColors: true,
        transparent: true,
        opacity: cfg.opacity,
        blending: THREE.AdditiveBlending, // particles glow and blend into each other
        depthWrite: false, // prevents z-sorting artefacts
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geo, mat);
      this.particleLayers.push(points);
      this.scene.add(points);
    }
  }

  _positionCamera() {
    this.camera.position.set(0, 0, 10);
    this.controls.target.set(0, 0, 0);
    this.controls.enabled = true;
    // force OrbitControls to resync its internal state from the new camera position
    // (necessary because camera.lookAt() was called during the transition)
    this.controls.update();
  }
}
