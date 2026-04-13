import * as THREE from "three";

/**
 * Creates all lights for the multiverse scene and adds them to the scene.
 * Returns an array of lights so MultiverseScene can remove them on exit.
 */
export function createLights(scene) {
  const lights = [];

  // Directional light — main source of direction and shadow
  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(5, 10, 10);
  scene.add(dirLight);
  lights.push(dirLight);

  // Deep purple ambient — keeps shadows from being pure black
  const ambient = new THREE.AmbientLight(0x1a0a2e, 6);
  scene.add(ambient);
  lights.push(ambient);

  // Main violet fill — above the cluster
  const violet = new THREE.PointLight(0x6622ff, 80, 120);
  violet.position.set(-10, 20, 10);
  scene.add(violet);
  lights.push(violet);

  // Golden accent — off to the right, matches the warm bubble cores
  const gold = new THREE.PointLight(0xffaa44, 80, 70);
  gold.position.set(18, 8, 10);
  scene.add(gold);
  lights.push(gold);

  // Cold blue underlight — gives depth from below
  const blue = new THREE.PointLight(0x0033ff, 150, 150);
  blue.position.set(-30, -30, 20);
  scene.add(blue);
  lights.push(blue);

  // Pink right light — hits the second bubble
  const pink = new THREE.PointLight(0xff44aa, 150, 150);
  pink.position.set(50, 15, 20);
  scene.add(pink);
  lights.push(pink);

  return lights;
}
