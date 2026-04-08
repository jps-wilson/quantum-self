import * as THREE from "three";

/**
 * SpatialAudio: Manages 3D positional audio attached to objects
 * Audio gets louder as camera approaches the source
 */

export class SpatialAudio {
  constructor(camera, audioPath, options = {}) {
    this.camera = camera;
    this.audioPath = audioPath;

    // default options used
    this.refDistance = options.refDistance || 1;
    this.rolloffFactor = options.rolloffFactor || 1;
    this.volume = options.volume || 0.5;
    this.loop = options.loop !== undefined ? options.loop : true;
    this.autoplay = options.autoplay !== undefined ? options.autoplay : true;

    this.listener = null;
    this.sound = null;
    this.isReady = false;
  }

  /**
   * Initialize the audio listener (calls once per scene)
   * @param {THREE.Camera} camera - Camera to attach listener to
   */
  static createListener(camera) {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    return listener;
  }

  /**
   * Load and attach spatial audio to 3D object
   * @param {THREE.Object3D} object - object to attach sound to
   * @param {THREE.AudioListener} listener - audio listener for camera
   * @returns {Promise} resolves when audio is loaded + ready
   */
  async attachTo(object, listener) {
    this.listener = listener;
    this.sound = new THREE.PositionalAudio(listener);

    return new Promise((resolve, reject) => {
      const audioLoader = new THREE.AudioLoader();

      audioLoader.load(
        this.audioPath,
        (buffer) => {
          this.sound.setBuffer(buffer);
          this.sound.setRefDistance(this.refDistance);
          this.sound.setRolloffFactor(this.rolloffFactor);
          this.sound.setLoop(this.loop);
          this.sound.setVolume(this.volume);

          object.add(this.sound);

          if (this.autoplay) {
            this.sound.play();
          }

          this.isReady = true;
          resolve(this.sound);
        },
        undefined,
        (error) => {
          console.error("Error loading spatial audio", error);
          reject(error);
        },
      );
    });
  }

  /**
   * Play audio
   */
  play() {
    if (this.sound && this.isReady) {
      this.sound.play();
    }
  }

  /**
   * Pause the audio
   */
  pause() {
    if (this.sound && this.sound.isPlaying) {
      this.sound.stop();
    }
  }

  /**
   * Set volume (0.0 - 1.0)
   */
  setVolume(volume) {
    this.volume = volume;
    if (this.sound) {
      this.sound.setVolume(volume);
    }
  }

  /**
   * Fade in audio over duration
   */
  fadeIn(duration = 2000) {
    if (!this.sound) return;

    this.sound.setVolume(0);
    this.play();

    const startTime = Date.now();
    const targetVolume = this.volume;

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      this.sound.setVolume(progress * targetVolume);

      if (progress < 1) {
        requestAnimationFrame(fade);
      }
    };

    fade();
  }

  /**
   * Fade out over duration, then pause
   */
  fadeOut(duration = 2000) {
    if (!this.sound || !this.sound.isPlaying) return;

    const startTime = Date.now();
    const startVolume = this.sound.getVolume();

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      this.sound.setVolume(startVolume * (1 - progress));

      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        this.pause();
        this.sound.setVolume(this.volume); // restore for next play
      }
    };

    fade();
  }

  /**
   * Clean up audio resources
   */
  dispose() {
    if (this.sound) {
      this.sound.stop();
      if (this.sound.buffer) {
        this.sound.buffer = null;
      }
      this.sound = null;
    }
  }
}
