import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";

/**
 * Sets up the EffectComposer with a bloom post-processing pass.
 * Returns { composer, bloom } for use in MultiverseScene.
 */
export function createBloom(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.4, // strength — how intense the glow
    0.8, // radius — how far it spreads
    0.3, // threshold — only pixels brighter than this bloom
  );
  composer.addPass(bloom);

  return { composer, bloom };
}
