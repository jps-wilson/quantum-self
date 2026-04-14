import * as THREE from "three";
import gsap from "gsap";

export function createNeuralNetwork(scene, bubblePositions) {
  const group = new THREE.Group();
  const toDispose = [];

  const nodeVecs = bubblePositions.map((p) => new THREE.Vector3(p.x, p.y, p.z));
  // Geometric centre of all three nodes
  const centreVec = new THREE.Vector3();
  nodeVecs.forEach((v) => centreVec.add(v));
  centreVec.divideScalar(nodeVecs.length);

  function makeLine(from, to, color) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.Line(geo, mat));
    toDispose.push(geo, mat);
    return mat;
  }

  // White node at each bubble
  const bubbleNodeMats = nodeVecs.map((v) => makeNode(v, 0.75, 0xffffff));

  // Gold centre node (larger)
  const centreMat = makeNode(centreVec, 1.4, 0xffdd88);

  // Purple lines connecting each pair of bubble nodes
  const pairLineMats = [
    [0, 1],
    [1, 2],
    [0, 2],
  ].map(([a, b]) => makeLine(nodeVecs[a], nodeVecs[b], 0xaa55ff));

  // Gold spoke lines from each bubble to the centre
  const spokeLineMats = nodeVecs.map((v) => makeLine(v, centreVec, 0xffcc44));

  scene.add(group);

  // Staggered reveal - nodes first, then lines, then spokes
  const sequence = [
    ...bubbleNodeMats.map((mat, i) => ({
      mat,
      targetOpacity: 0.9,
      delay: i * 0.3,
    })),
    { mat: centreMat, targetOpacity: 1.0, delay: 0.9 },
    ...pairLineMats.map((mat, i) => ({
      mat,
      targetOpacity: 0.4,
      delay: 1.3 + i * 0.25,
    })),
    ...spokeLineMats.map((mat, i) => ({
      mat,
      targetOpacity: 0.65,
      delay: 2.1 + i * 0.22,
    })),
  ];

  sequence.forEach(({ mat, targetOpacity, delay }) => {
    gsap.to(mat, {
      opacity: targetOpacity,
      duration: 1.6,
      delay,
      ease: "power2.inOut",
    });
  });

  return {
    group,
    centrePos: centreVec,
    dispose() {
      toDispose.forEach((obj) => obj.dispose());
      scene.remove(group);
    },
  };
}
