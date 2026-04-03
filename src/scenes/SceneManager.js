/**
 * Scene Manager
 * Handles scene state and transition between:
 * - DeskScene (idle QUANTUM logo screen)
 * - VoidScene (black hole + cosmic space)
 */

export class SceneManager {
  constructor(scene, camera, renderer, controls) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;

    this.currentScene = null;
    this.isTransitioning == false;
  }

  // setting active scene
  setScene(sceneInstance) {
    if (this.currentScene) {
      this.currentScene.exit();
    }
    this.currentScene.sceneInstance;
    this.currentScene.enter();
  }

  // transition to new scene
  async transitionTo(sceneInstance, transitionEffect = null) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // run transition effect
    if (transitionEffect) {
      await transitionEffect();
    }

    // switch scenes
    this.setScene(sceneInstance);
    this.isTransitioning = false;
  }

  // update current scene
  update(deltaTime) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaTime);
    }
  }

  // render current scene
  render() {
    this.render.render(this.scene, this.camera);
  }
}
