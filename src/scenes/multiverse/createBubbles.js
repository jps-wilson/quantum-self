import * as THREE from "three";
import gsap from "gsap";

export const BUBBLE_DATA = [
  { pos: [-8, 0, 0], radius: 14, core: 0xffcc88, halo: 0x6611ff },
  { pos: [10, 1, -5], radius: 10, core: 0xffeedd, halo: 0x4422ff },
  { pos: [3, 4, -18], radius: 6, core: 0xddaaff, halo: 0x8833ff },
];

/**
 * Creates a single iridescent bubble group at the given position.
 */
function createBubble(position, outerRadius, coreColor, haloColor, envMap) {
  const group = new THREE.Group();

  // Outer shell — iridescent transmission material
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
    envMap,
  });
  const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
  bubbleMesh.renderOrder = 1;
  group.add(bubbleMesh);

  // Inner core — small glowing point at centre
  const coreGeo = new THREE.SphereGeometry(outerRadius * 0.05, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({ color: coreColor });
  group.add(new THREE.Mesh(coreGeo, coreMat));

  // Glow halos — additive blended spheres for soft light bloom
  const haloSizes = [0.15, 0.4].map((s) => outerRadius * s);
  const haloOpacities = [0.06, 0.02];
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

/**
 * Creates an organic blob connector between bubbles.
 * Pushes the mesh and its original vertex positions into the
 * provided arrays so MultiverseScene can animate them each frame.
 */
function createBlob(
  position,
  radius = 2,
  scene,
  blobs,
  blobOriginalPositions,
  envMap,
) {
  const geo = new THREE.SphereGeometry(radius, 48, 48);

  // Store original vertex positions before any deformation
  const posAttr = geo.getAttribute("position");
  const originalPositions = posAttr.array.slice();

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xaaaaaf,
    transmission: 0.1,
    roughness: 0.0,
    metalness: 0,
    iridescence: 0.8,
    iridescenceThicknessRange: [100, 300],
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMap,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...position);
  mesh.renderOrder = 2;
  scene.add(mesh);

  blobs.push(mesh);
  blobOriginalPositions.push(originalPositions);

  return mesh;
}

/**
 * Creates a small decorative micro-bubble and adds it to the scene.
 */
function createMicroBubble(position, radius, scene, microBubbles) {
  const group = new THREE.Group();

  const colors = [0xffd0ff, 0xaaddff, 0xffffff, 0xffeebb];
  const coreGeo = new THREE.SphereGeometry(radius, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: colors[Math.floor(Math.random() * colors.length)],
    transparent: true,
    opacity: 0.5,
  });
  group.add(new THREE.Mesh(coreGeo, coreMat));

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
      side: THREE.FrontSide,
    });
    group.add(new THREE.Mesh(hGeo, hMat));
  });

  group.position.set(...position);
  scene.add(group);
  microBubbles.push(group);
}

/**
 * Main entry point — creates all bubbles, blobs, micro-bubbles and
 * their breathing animations.
 * Returns everything MultiverseScene needs to track and animate them.
 */
export function createBubbles(scene, envMap) {
  const bubbles = [];
  const blobs = [];
  const blobOriginalPositions = [];
  const microBubbles = [];
  const tweens = [];

  // Connector blob filling the space between the three main bubbles
  const connector = createBlob(
    [1, 1, -8],
    8,
    scene,
    blobs,
    blobOriginalPositions,
    envMap,
  );
  connector.scale.set(1.2, 0.8, 0.8);

  // Three main bubbles — large left, medium right, small far back
  const bubbleData = [
    { pos: [-8, 0, 0], radius: 14, core: 0xffcc88, halo: 0x6611ff },
    { pos: [10, 1, -5], radius: 10, core: 0xffeedd, halo: 0x4422ff },
    { pos: [3, 4, -18], radius: 6, core: 0xddaaff, halo: 0x8833ff },
  ];

  bubbleData.forEach((b) => {
    const group = createBubble(b.pos, b.radius, b.core, b.halo, envMap);
    scene.add(group);
    bubbles.push(group);
  });

  // Micro-bubbles scattered around the cluster
  const microData = [
    [[-28, 8, -15], 1.2],
    [[28, -6, -18], 0.9],
    [[-10, 22, -25], 1.5],
    [[24, -14, -12], 0.7],
    [[-22, -10, -22], 1.0],
    [[6, 24, -15], 0.8],
    [[-30, 4, -10], 1.3],
    [[20, 14, -28], 0.6],
  ];
  microData.forEach(([pos, r]) =>
    createMicroBubble(pos, r, scene, microBubbles),
  );

  // Breathing animation for each main bubble
  bubbles.forEach((bubble, i) => {
    tweens.push(
      gsap.to(bubble.scale, {
        x: 1.06,
        y: 1.06,
        z: 1.06,
        duration: 3 + i * 0.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: i * 0.5,
      }),
    );
  });

  // Slower breathing on the connector blob
  if (blobs[0]) {
    tweens.push(
      gsap.to(blobs[0].scale, {
        x: 2.5,
        y: 1.6,
        z: 1.6,
        duration: 5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      }),
    );
  }

  return { bubbles, blobs, blobOriginalPositions, microBubbles, tweens };
}
