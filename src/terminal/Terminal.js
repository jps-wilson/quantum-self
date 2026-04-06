import {
  BOOT_MESSAGES,
  QUANTUM_LOGO,
  WELCOME_MESSAGES,
} from "./terminalContent.js";

/**
 * Terminal Manager: Handles all terminal UI logic (boot, login, password, command prompt)
 */

export class Terminal {
  constructor(onTransitionStart) {
    this.terminalEl = document.getElementById("terminal");
    this.outputEl = document.getElementById("terminal-output");
    this.promptEl = document.getElementById("input-prompt");
    this.inputDisplayEl = document.getElementById("input-display");
    this.inputRowEl = document.getElementById("terminal-input-row");

    this.phase = null; // null | "boot" | "login" | "password" | "prompt" | "transition"
    this.userInput = "";
    this.username = "";
    this.onTransitionStart = onTransitionStart; // callback when user types "start"

    this.keypressSound = new Audio("/audio/keypress.mp3");
    this.keypressSound.volume = 1;

    this.textSound = new Audio("/audio/text.wav");
    this.textSound.volume = 1;
    this._textSoundTimer = null;

    this._setupKeyboardInput();
  }

  // show terminal with entry animation
  enter() {
    this.terminalEl.classList.add("entering");
    this.terminalEl.addEventListener(
      "animationend",
      () => {
        this.terminalEl.classList.remove("entering");
        this.terminalEl.classList.add("active");
        this.startBoot();
      },
      { once: true },
    );
  }

  // start boot sequence
  startBoot() {
    this.phase = "boot";
    this._hideInput();

    const lastDelay = BOOT_MESSAGES[BOOT_MESSAGES.length - 1].delay;

    // boot messages
    for (const msg of BOOT_MESSAGES) {
      setTimeout(() => this._addLine(msg.text, msg.color), msg.delay);
    }

    // logo
    setTimeout(() => {
      QUANTUM_LOGO.split("\n").forEach((line) => this._addLine(line, "green"));
    }, lastDelay + 300);

    // welcome messages
    setTimeout(() => {
      for (const msg of WELCOME_MESSAGES) {
        this._addLine(msg.text, msg.color);
      }
    }, lastDelay + 800);

    // login prompt
    setTimeout(() => {
      this._setPrompt("quantum login: ");
      this._showInput();
      this.phase = "login";
    }, lastDelay + 1200);
  }

  // fades out terminal (for transition)
  fadeOut(duration = 1000) {
    this.terminalEl.style.transition = `opacity ${duration}ms ease-out`;
    this.terminalEl.style.opacity = "0";
  }

  // fully removes terminal from view after fade
  hide() {
    this.terminalEl.style.display = "none";
  }

  // PRIVATE METHODS
  _addLine(text, color = "white") {
    const line = document.createElement("div");
    line.className = `terminal-line ${color}`;
    line.textContent = text;
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;

    if (text.trim().length > 0) {
      if (this.textSound.paused) {
        this.textSound.currentTime = 0;
        this.textSound.play().catch(() => {});
      }
      clearTimeout(this._textSoundTimer);
      this._textSoundTimer = setTimeout(() => {
        this.textSound.pause();
        this.textSound.currentTime = 0;
      }, 300);
    }
  }

  _setPrompt(text) {
    this.promptEl.textContent = text;
    this.userInput = "";
    this.inputDisplayEl.textContent = "";
  }

  _showInput() {
    this.inputRowEl.style.visibility = "visible";
  }

  _hideInput() {
    this.inputRowEl.style.visibility = "hidden";
  }

  _refreshInputDisplay() {
    this.inputDisplayEl.textContent =
      this.phase === "password"
        ? "*".repeat(this.userInput.length)
        : this.userInput;
  }

  _setupKeyboardInput() {
    window.addEventListener("keydown", (event) => {
      if (!this.phase || this.phase === "boot" || this.phase === "transition")
        return;

      if (event.key.length === 1 || event.key === "Backspace" || event.key === "Enter") {
        this.keypressSound.currentTime = 0;
        this.keypressSound.play().catch(() => {});
      }

      if (event.key === "Enter") {
        this._handleEnter();
      } else if (event.key === "Backspace") {
        this.userInput = this.userInput.slice(0, -1);
        this._refreshInputDisplay();
      } else if (event.key.length === 1 && this.userInput.length < 40) {
        this.userInput += event.key;
        this._refreshInputDisplay();
      }
    });
  }

  _handleEnter() {
    if (this.phase === "login") {
      if (this.userInput.length === 0) return;
      this.username = this.userInput;
      this._addLine(`quantum login: ${this.username}`, "green");
      this._setPrompt("Password: ");
      this.phase = "password";
    } else if (this.phase === "password") {
      this._addLine(`Password: ${"*".repeat(this.userInput.length)}`, "green");
      this._addLine("", "white");
      this._addLine(`Welcome, ${this.username}!`, "amber");
      this._addLine("", "white");
      this._addLine("Type 'start' to begin your journey...", "white");
      this._addLine("", "white");
      this._setPrompt("quantum@self:~$ ");
      this.phase = "prompt";
    } else if (this.phase === "prompt") {
      const command = this.userInput.trim().toLowerCase();
      this._addLine(`quantum@self:~$ ${this.userInput}`, "green");
      this.userInput = "";
      this.inputDisplayEl.textContent = "";

      if (command === "start" || command === "begin") {
        this._addLine("", "white");
        this._addLine("Initializing quantum engine...", "amber");
        this._addLine("Loading multiverse...", "white");
        this._addLine("Calibrating reality branches...", "white");
        this._addLine("", "white");
        this._addLine("Entering the void...", "amber");
        this._hideInput();
        this.phase = "transition";

        // Trigger transition callback
        if (this.onTransitionStart) {
          this.onTransitionStart();
        }
      } else if (command === "") {
        // Empty enter — just show new prompt
      } else {
        this._addLine(`bash: ${command}: command not found`, "white");
      }

      if (this.phase === "prompt") {
        this._setPrompt("quantum@self:~$ ");
      }
    }
  }
}
