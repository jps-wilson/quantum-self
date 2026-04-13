import * as THREE from "three";
import gsap from "gsap";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";

/**
 * Multiverse Scene
 * Fractal cosmic bubble environment — loaded after the wormhole transition.
 */
export class MultiverseScene {
  constructor(scene, camera, controls, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.renderer = renderer;

    this.originalBackground = null;
    this.stars = null;
    this.starTexture = null;
    this.nebula = null;
    this.nebulaTexture = null;
    this.bubbles = [];
    this.blobs = [];
    this.blobOriginalPositions = [];
    this.lights = [];
    this.microBubbles = [];

    this.tweens = [];
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

    // Post-processing bloom
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6, // strength - how intense the glow
      0.8, // radius - how far it spreads
      0.3, // threshold - only pixels brighter than this bloom
    );
    this.composer.addPass(bloom);
    this.bloom = bloom;
  }

  enter() {
    // Called every time this scene becomes active
    this.originalBackground = this.scene.background;

    this.scene.background = new THREE.Color(0x05030f);
    this.scene.fog = new THREE.FogExp2(0x05030f, 0.006);
    this.scene.environment = this.envMap;

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

    // Nebula cloud - particles clustered around several cloud centres
    const nebulaCount = 1000;
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaPos = new Float32Array(nebulaCount * 3);

    // Cloud centres - loosely placed around the bubble cluster
    const cloudCentres = [
      [-30, 10, -60],
      [25, 15, -80],
      [-8, -15, -55],
      [40, -8, -70],
      [-20, -12, -45],
      [50, 10, -50],
      [-5, 25, -65],
      [8, -22, -75],
      [-40, 5, -40],
      [30, 18, -90],
      [-2, 30, -50],
      [10, -28, -60],
    ];

    for (let i = 0; i < nebulaCount; i++) {
      // Pick a random cloud centre
      const centre =
        cloudCentres[Math.floor(Math.random() * cloudCentres.length)];

      // Scatter around it using a gaussian-like spread
      // (adding three randoms approximates a bell curve)
      const spread = 7;
      const x =
        centre[0] +
        (Math.random() + Math.random() + Math.random() - 1.5) * spread;
      const y =
        centre[1] +
        (Math.random() + Math.random() + Math.random() - 1.5) * spread;
      const z =
        centre[2] +
        (Math.random() + Math.random() + Math.random() - 1.5) * spread;

      nebulaPos[i * 3] = x;
      nebulaPos[i * 3 + 1] = y;
      nebulaPos[i * 3 + 2] = z;
    }

    nebulaGeo.setAttribute("position", new THREE.BufferAttribute(nebulaPos, 3));

    const nebulaMat = new THREE.PointsMaterial({
      color: 0x9955ff,
      size: 3.5,
      sizeAttenuation: true,
      map: this._makeStarTexture(),
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.nebulaTexture = nebulaMat.map;
    this.nebula = new THREE.Points(nebulaGeo, nebulaMat);
    this.scene.add(this.nebula);

    this.bubbles = [];

    const bubbleData = [
      { pos: [-8, 0, 0], radius: 14, core: 0xffcc88, halo: 0x6611ff }, // large left bubble
      { pos: [10, 1, -5], radius: 10, core: 0xffeedd, halo: 0x4422ff }, // medium right bubble
      { pos: [3, 4, -18], radius: 6, core: 0xddaaff, halo: 0x8833ff }, // small, far back bubble
    ];

    // Connector filling the space between all three bubbles
    const connector = this._createBlob([1, 1, -8], 8);
    connector.scale.set(1.2, 0.8, 0.8);

    bubbleData.forEach((b) => {
      const group = this._createBubble(b.pos, b.radius, b.core, b.halo);
      this.scene.add(group);
      this.bubbles.push(group);
    });

    // Micro-bubbles scattered around the cluster
    this._createMicroBubble([-28, 8, -15], 1.2);
    this._createMicroBubble([28, -6, -18], 0.9);
    this._createMicroBubble([-10, 22, -25], 1.5);
    this._createMicroBubble([24, -14, -12], 0.7);
    this._createMicroBubble([-22, -10, -22], 1.0);
    this._createMicroBubble([6, 24, -15], 0.8);
    this._createMicroBubble([-30, 4, -10], 1.3);
    this._createMicroBubble([20, 14, -28], 0.6);

    // Suppress the global desk scene ambient while in multiverse
    this.scene.traverse((obj) => {
      if (obj.isAmbientLight && !this.lights.includes(obj)) {
        obj.userData._prevIntensity = obj.intensity;
        obj.intensity = 0;
      }
    });

    this.lights = [];

    // Directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 10);
    this.scene.add(dirLight);
    this.lights.push(dirLight);

    // Deep purple ambient - keeps shadows from being pure black
    const ambient = new THREE.AmbientLight(0x1a0a2e, 6);
    this.scene.add(ambient);
    this.lights.push(ambient);

    // Main violet fill - above the cluster
    const violet = new THREE.PointLight(0x6622ff, 150, 120);
    violet.position.set(-10, 20, 10);
    this.scene.add(violet);
    this.lights.push(violet);

    // Golden accent - off to the right, matches the warm cores
    const gold = new THREE.PointLight(0xffaa44, 80, 70);
    gold.position.set(18, 8, 10);
    this.scene.add(gold);
    this.lights.push(gold);

    // Cold blue underlight - gives depth from below
    const blue = new THREE.PointLight(0x0033ff, 150, 150);
    blue.position.set(-30, -30, 20);
    this.scene.add(blue);
    this.lights.push(blue);

    // Fourth light on the right side to hit the second bubble
    const pink = new THREE.PointLight(0xff44aa, 150, 150);
    pink.position.set(50, 15, 20);
    this.scene.add(pink);
    this.lights.push(pink);

    // Breathing animation for each bubble
    this.bubbles.forEach((bubble, i) => {
      const tween = gsap.to(bubble.scale, {
        x: 1.06,
        y: 1.06,
        z: 1.06,
        duration: 3 + i * 0.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: i * 0.5,
      });
      this.tweens.push(tween);
    });

    // Slower breathing on the connector blob
    if (this.blobs[0]) {
      const blobTween = gsap.to(this.blobs[0].scale, {
        x: 2.5,
        y: 1.6,
        z: 1.6,
        duration: 5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      this.tweens.push(blobTween);
    }

    // Position camera
    this.camera.position.set(0, 0, 45);
    this.controls.target.set(0, 0, 0);
    this.controls.enablePan = true;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 200;
    this.controls.update();

    // Window resize for bloom effect
    this._onResize = () => {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", this._onResize);
  }

  exit() {
    // Called every time this scene is deactivated
    // Restore original state and dispose everything you created in enter()
    this.scene.background = this.originalBackground;
    this.scene.fog = null;
    this.scene.environment = null;

    // Dispose geometries, materials, and remove meshes here as you add them
    // Pattern: this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.scene.remove(this.mesh)

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

    this.blobs.forEach((blob) => {
      blob.geometry.dispose();
      blob.material.dispose();
      this.scene.remove(blob);
    });
    this.blobs = [];
    this.blobOriginalPositions = [];

    this.tweens.forEach((tween) => tween.kill());
    this.tweens = [];

    this.lights.forEach((light) => {
      this.scene.remove(light);
    });
    this.lights = [];

    // Restore global ambient
    this.scene.traverse((obj) => {
      if (obj.isAmbientLight && obj.userData._prevIntensity !== undefined) {
        obj.intensity = obj.userData._prevIntensity;
        delete obj.userData._prevIntensity;
      }
    });

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

    window.removeEventListener("resize", this._onResize);
  }

  update(time) {
    // Called every frame — time is in seconds
    if (this.stars) {
      this.stars.rotation.y = time * 0.01;
    }
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

    this.bubbles.forEach((bubble, i) => {
      bubble.rotation.y = time * (0.04 + i * 0.01);
      bubble.rotation.x = time * (0.02 + i * 0.005);
    });

    if (this.nebula) {
      this.nebula.rotation.y = time * 0.004;
      this.nebula.rotation.x = time * 0.002;
    }
  }

  render() {
    this.composer.render();
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

  _createBubble(position, outerRadius, coreColor, haloColor) {
    const group = new THREE.Group();

    // Outer shell
    const bubbleGeo = new THREE.SphereGeometry(outerRadius, 64, 64);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.7,
      thickness: 1.2,
      roughness: 0.05,
      metalness: 0,
      ior: 1.35,
      iridescence: 1.0,
      iridescenceThicknessRange: [100, 1000],
      iridescenceIOR: 1.5,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMap: this.envMap,
    });
    const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    bubbleMesh.renderOrder = 1;
    group.add(bubbleMesh);

    // Inner core
    const coreGeo = new THREE.SphereGeometry(outerRadius * 0.05, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: coreColor });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    // Glow halos
    const haloSizes = [0.15, 0.25, 0.4, 0.6].map((s) => outerRadius * s);
    const haloOpacities = [0.2, 0.12, 0.06, 0.02];
    haloSizes.forEach((size, i) => {
      const hGeo = new THREE.SphereGeometry(size, 32, 32);
      const hMat = new THREE.MeshBasicMaterial({
        color: haloColor,
        transparent: true,
        opacity: haloOpacities[i],
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide,
      });
      group.add(new THREE.Mesh(hGeo, hMat));
    });

    group.position.set(...position);
    return group;
  }

  _createBlob(position, radius = 2) {
    const geo = new THREE.SphereGeometry(radius, 48, 48);

    // Store the original vertex positions BEFORE any deformation
    const posAttr = geo.getAttribute("position");
    const originalPositions = posAttr.array.slice();

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.3,
      roughness: 0.0,
      metalness: 0,
      iridescence: 0.8,
      iridescenceThicknessRange: [100, 300],
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMap: this.envMap,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    this.scene.add(mesh);

    this.blobs.push(mesh);
    this.blobOriginalPositions.push(originalPositions);

    mesh.renderOrder = 2; // blobs draw after shells
    return mesh;
  }

  _createMicroBubble(position, radius) {
    const group = new THREE.Group();

    // Core glow
    const coreGeo = new THREE.SphereGeometry(radius, 16, 16);
    const colors = [0xffd0ff, 0xaaddff, 0xffffff, 0xffeebb];
    const coreMat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: 0.5,
    });

    group.add(new THREE.Mesh(coreGeo, coreMat));

    // Two halo layers
    const haloColors = [0x8833ff, 0x4422ff];
    const haloSizes = [2.5, 4.0].map((s) => radius * s);
    const haloOpacity = [0.06, 0.025];

    haloSizes.forEach((size, i) => {
      const hGeo = new THREE.SphereGeometry(size, 16, 16);
      const hMat = new THREE.MeshBasicMaterial({
        color: haloColors[i],
        transparent: true,
        opacity: haloOpacity[i],
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide, // changed from BackSide
      });
      group.add(new THREE.Mesh(hGeo, hMat));
    });

    group.position.set(...position);
    this.scene.add(group);
    this.microBubbles.push(group);
  }
}
