import * as THREE from "three";

/**
 * Creates a circular radial gradient texture for soft round particles.
 */
function makeStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.6)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Creates the star field and nebula cloud particle systems
 * and adds them to the scene.
 * Returns { stars, nebula, starTexture, nebulaTexture }
 */
export function createStars(scene) {
  // --- Star field ---
  const count = 4000;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
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

  const starTexture = makeStarTexture();
  const mat = new THREE.PointsMaterial({
    color: 0xaaaaff,
    size: 0.15,
    sizeAttenuation: true,
    map: starTexture,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
  });

  const stars = new THREE.Points(geo, mat);
  scene.add(stars);

  // --- Nebula cloud ---
  const nebulaCount = 1000;
  const nebulaGeo = new THREE.BufferGeometry();
  const nebulaPos = new Float32Array(nebulaCount * 3);

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
    const centre = cloudCentres[Math.floor(Math.random() * cloudCentres.length)];
    const spread = 7;
    // Sum of three randoms approximates a bell curve
    const x = centre[0] + (Math.random() + Math.random() + Math.random() - 1.5) * spread;
    const y = centre[1] + (Math.random() + Math.random() + Math.random() - 1.5) * spread;
    const z = centre[2] + (Math.random() + Math.random() + Math.random() - 1.5) * spread;

    nebulaPos[i * 3] = x;
    nebulaPos[i * 3 + 1] = y;
    nebulaPos[i * 3 + 2] = z;
  }

  nebulaGeo.setAttribute("position", new THREE.BufferAttribute(nebulaPos, 3));

  const nebulaTexture = makeStarTexture();
  const nebulaMat = new THREE.PointsMaterial({
    color: 0x9955ff,
    size: 3.5,
    sizeAttenuation: true,
    map: nebulaTexture,
    transparent: true,
    opacity: 0.04,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const nebula = new THREE.Points(nebulaGeo, nebulaMat);
  scene.add(nebula);

  return { stars, nebula, starTexture, nebulaTexture };
}
