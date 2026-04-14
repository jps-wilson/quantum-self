import * as THREE from "three";
import gsap from "gsap";

const ANSWER_COLORS = { A: 0xffcc44, B: 0xff66aa, C: 0x44aaff };

function buildRingSystem(cx, cy, cz, ringRadius, color, count, particleSize) {
  const group = new THREE.Group();
  group.position.set(cx, cy, cz);

  const tiltsAndSpeeds = [
    { tilt: [0, 0, 0], rx: 0.006, ry: 0.004 },
    { tilt: [Math.PI / 2, 0, 0], rx: 0.003, ry: 0.007 },
    { tilt: [Math.PI / 4, Math.PI / 4, 0], rx: 0.005, ry: 0.003 },
  ];

  const ringData = tiltsAndSpeeds.map(({ tilt, rx, ry }) => {
    const positions = new Float32Array(count * 3);
    const scatter = ringRadius * 0.05;
    for (let j = 0; j < count; j++) {
      const angle = (j / count) * Math.PI * 2;
      positions[j * 3] =
        Math.cos(angle) * ringRadius + (Math.random() - 0.5) * scatter;
      positions[j * 3 + 1] =
        Math.sin(angle) * ringRadius + (Math.random() - 0.5) * scatter;
      positions[j * 3 + 2] = (Math.random() - 0.5) * scatter;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size: particleSize,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const ring = new THREE.Points(geo, mat);
    ring.rotation.set(...tilt);
    ring.userData.rx = rx;
    ring.userData.ry = ry;
    group.add(ring);
    return { ring, geo, mat };
  });

  return { group, ringData };
}

export function createChosenSelf(scene, bubblePos, bubbleRadius, answerId) {
  const color = ANSWER_COLORS[answerId] ?? 0xffffff;

  const { group, ringData } = buildRingSystem(
    bubblePos.x,
    bubblePos.y,
    bubblePos.z,
    bubbleRadius * 0.45,
    color,
    140,
    bubbleRadius * 0.025,
  );

  // Small glowing core at centre
  const coreGeo = new THREE.SphereGeometry(bubbleRadius * 0.07, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(coreGeo, coreMat));
  scene.add(group);

  ringData.forEach(({ mat }, i) => {
    gsap.to(mat, {
      opacity: 0.75,
      duration: 2.5,
      delay: i * 0.4,
      ease: "power2.inOut",
    });
  });
  gsap.to(coreMat, { opacity: 0.9, duration: 2, ease: "power2.inOut" });

  return {
    group,
    ringData,
    dispose() {
      ringData.forEach(({ geo, mat }) => {
        geo.dispose();
        mat.dispose();
      });
      coreGeo.dispose();
      coreMat.dispose();
      scene.remove(group);
    },
  };
}

export function createAlternateSelves(
  scene,
  bubblePos,
  bubbleRadius,
  chosenAnswerId,
  allAnswers,
) {
  const unchosen = allAnswers.filter((a) => a.id !== chosenAnswerId);
  const br = bubbleRadius;
  const offsets = [
    [br * 1.6, 0, br * 0.3],
    [-br * 1.6, 0, br * 0.3],
  ];

  return unchosen.map((answer, i) => {
    const color = ANSWER_COLORS[answer.id] ?? 0xaaaaff;
    const [ox, oy, oz] = offsets[i];

    const { group, ringData } = buildRingSystem(
      bubblePos.x + ox,
      bubblePos.y + oy,
      bubblePos.z + oz,
      br * 0.28,
      color,
      80,
      br * 0.018,
    );

    scene.add(group);

    ringData.forEach(({ mat }, j) => {
      gsap.to(mat, {
        opacity: 0.22,
        duration: 3,
        delay: 0.8 + j * 0.35,
        ease: "power2.inOut",
      });
    });

    return {
      answerId: answer.id,
      selfName: answer.selfName,
      group,
      ringData,
      dispose() {
        ringData.forEach(({ geo, mat }) => {
          geo.dispose();
          mat.dispose();
        });
        scene.remove(group);
      },
    };
  });
}
