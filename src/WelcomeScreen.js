/**
 * WelcomeScreen
 * Shows how-to overlay screen.
 * Resolve a Promise when the user clicks the enter button, so main.js can wait for it before starting the experience.
 */
export class WelcomeScreen {
  constructor() {
    this.el = document.getElementById("welcome-screen");
    this.btn = document.getElementById("welcome-enter-btn");
  }

  // Returns a Promise that resolves when the user dismisses the screen
  show() {
    return new Promise((resolve) => {
      this.btn.addEventListener("click", () => {
        // Prevent double-clicks
        this.btn.disabled = true;

        // Step 1: flash the button green, change text
        this.btn.classList.add("activating");
        this.btn.textContent = "INITIALIZING...";

        // Step 2: after a short beat, flicker status then fade
        setTimeout(() => {
          this._typeStatus(resolve);
        }, 200);
      });
    });
  }

  // Resets button + subtitle so show() can be called again
  reset() {
    this.btn.disabled = false;
    this.btn.classList.remove("activating");
    this.btn.textContent = "ENTER THE SYSTEM";
    const subtitle = document.getElementById("welcome-subtitle");
    subtitle.style.color = "";
    subtitle.textContent = "A journey through infinite versions of you";
  }

  // Briefly flickers status text in the subtitle area before fading the screen
  _typeStatus(resolve) {
    const subtitle = document.getElementById("welcome-subtitle");
    const lines = [
      "loading multiverse...",
    ];
    let i = 0;

    const tick = () => {
      if (i < lines.length) {
        subtitle.style.color = "#00ff41";
        subtitle.textContent = lines[i++];
        setTimeout(tick, 220);
      } else {
        // All lines shown — fade the whole screen out
        this.el.classList.add("hidden");
        this.el.addEventListener(
          "transitionend",
          () => {
            this.el.style.display = "none";
            resolve();
          },
          { once: true },
        );
      }
    };

    tick();
  }
}
