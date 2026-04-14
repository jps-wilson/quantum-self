import * as THREE from "three";
import gsap from "gsap";

function makeSilhouetteTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 512);
  ctx.fillStyle = "#ffffff";

  // Head
  ctx.beginPath();
  ctx.arc(128, 72, 38, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillRect(112, 108, 32, 26);

  // Torso
  ctx.beginPath();
  ctx.moveTo(72, 134);
  ctx.lineTo(64, 292);
  ctx.lineTo(192, 292);
  ctx.lineTo(184, 134);
  ctx.closePath();
  ctx.fill();

  // Left arm
  ctx.beginPath();
  ctx.moveTo(72, 144);
  ctx.lineTo(36, 268);
  ctx.lineTo(54, 276);
  ctx.lineTo(86, 158);
  ctx.closePath();
  ctx.fill();

  // Right arm
  ctx.beginPath();
  ctx.moveTo(184, 144);
  ctx.lineTo(220, 268);
  ctx.lineTo(202, 276);
  ctx.lineTo(170, 158);
  ctx.closePath();
  ctx.fill();

  // Left leg
  ctx.beginPath();
  ctx.moveTo(84, 292);
  ctx.lineTo(72, 470);
  ctx.lineTo(104, 474);
  ctx.lineTo(112, 296);
  ctx.closePath();
  ctx.fill();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(144, 296);
  ctx.lineTo(152, 474);
  ctx.lineTo(184, 470);
  ctx.lineTo(172, 292);
  ctx.closePath();
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

export function createChosenSelf(
  scene,
  bubblePos,
  bubbleRadius,
  color = 0xffffff,
) {
  const texture = makeSilhouetteTexture();
  const w = bubbleRadius * 0.38;
  const h = bubbleRadius * 0.76;

  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(bubblePos.x, bubblePos.y, bubblePos.z + bubbleRadius * 0.1);
  scene.add(mesh);

  gsap.to(mat, { opacity: 0.85, duration: 2.5, ease: "power2.inOut" });

  return {
    mesh,
    dispose() {
      geo.dispose();
      mat.dispose();
      texture.dispose();
      scene.remove(mesh);
    },
  };
}

function buildHumanoidPoints(cx, cy, cz, scale, color) {
  const COUNT = 380;
  const positions = new Float32Array(COUNT * 3);

  const parts = [
    [-0.22, 0.22, 0.8, 1.15, -0.18, 0.18, 0.12],
    [-0.42, 0.42, 0.0, 0.8, -0.18, 0.18, 0.32],
    [-0.85, -0.42, 0.0, 0.65, -0.12, 0.12, 0.13],
    [0.42, 0.85, 0.0, 0.65, -0.12, 0.12, 0.13],
    [-0.32, -0.02, -0.85, 0.0, -0.12, 0.12, 0.15],
    [0.02, 0.32, -0.85, 0.0, -0.12, 0.12, 0.15],
  ];

  const cumWeights = [];
  let total = 0;
  for (const p of parts) {
    total += p[6];
    cumWeights.push(total);
  }

  for (let i = 0; i < COUNT; i++) {
    const r = Math.random() * total;
    const partIndex = cumWeights.findIndex((w) => r <= w);
    const part = parts[Math.max(0, partIndex)];
    positions[i * 3] =
      cx + (part[0] + Math.random() * (part[1] - part[0])) * scale;
    positions[i * 3 + 1] =
      cy + (part[2] + Math.random() * (part[3] - part[2])) * scale;
    positions[i * 3 + 2] =
      cz + (part[4] + Math.random() * (part[5] - part[4])) * scale;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size: scale * 0.065,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return { geo, mat, points: new THREE.Points(geo, mat) };
}

export function createAlternateSelves(
  scene,
  bubblePos,
  bubbleRadius,
  chosenAnswerId,
  allAnswers,
) {
  const unchosen = allAnswers.filter((a) => a.id !== chosenAnswerId);
  const ghostColors = [0xaa55ff, 0x44bbff];
  const r = bubbleRadius;
  const offsets = [
    [r * 1.55, 0, r * 0.4],
    [-r * 1.55, 0, r * 0.4],
  ];
  const scale = r * 0.52;

  return unchosen.map((answer, i) => {
    const [ox, oy, oz] = offsets[i];
    const { geo, mat, points } = buildHumanoidPoints(
      bubblePos.x + ox,
      bubblePos.y + oy,
      bubblePos.z + oz,
      scale,
      ghostColors[i % ghostColors.length],
    );
    scene.add(points);
    gsap.to(mat, {
      opacity: 0.28,
      duration: 3.0,
      delay: 0.6 + i * 0.5,
      ease: "power2.inOut",
    });

    return {
      answerId: answer.id,
      selfName: answer.selfName,
      points,
      dispose() {
        geo.dispose();
        mat.dispose();
        scene.remove(points);
      },
    };
  });
}
