import { GLTFLoader } from "three/examples/jsm/Addons.js";

const loader = new GLTFLoader();

/**
 * Load a GLTF/GLB model
 * @param {string} path - Path to model file
 * @param {THREE.Vector3} position - Position vector
 * @param {THREE.Vector3|null} scale - Scale vector (or null for default)
 * @returns {Promise<THREE.Group>} - Loaded model
 */

export function loadModel(path, position, scale = null) {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.position.set(...position);
        if (scale) model.scale.set(...scale);
        resolve(model);
      },
      undefined,
      (error) => {
        console.error(`Error loading ${path}:`, error);
        reject(error);
      },
    );
  });
}

/**
 * Load a GLTF/GLB model and return both the scene and the full gltf object.
 * Use this when you need access to animations.
 * @returns {Promise<{ model: THREE.Group, gltf: object }>}
 */
export function loadModelFull(path, position, scale = null) {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.position.set(...position);
        if (scale) model.scale.set(...scale);
        resolve({ model, gltf });
      },
      undefined,
      (error) => {
        console.error(`Error loading ${path}:`, error);
        reject(error);
      },
    );
  });
}

/**
 * Load multiple models
 * @param {Array<{path, position, scale}>} models - Array of model configs
 * @returns {Promise<Array<THREE.Group>>} - Array of loaded models
 */

export async function loadModels(models) {
  const promises = models.map((m) => loadModel(m.path, m.position, m.scale));
  return Promise.all(promises);
}
