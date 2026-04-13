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
      // Wait for button click
      this.btn.addEventListener("click", () => {
        // Fade out
        this.el.classList.add("hidden");

        // Wait for fade to finish then remove from view and resolve
        this.el.addEventListener(
          "transitionend",
          () => {
            this.el.style.display = "none";
            resolve();
          },
          { once: true },
        );
      });
    });
  }
}
