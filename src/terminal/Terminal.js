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

  // resets terminal to blank slate so enter() can be called again
  reset() {
    // restore visibility
    this.terminalEl.style.display = "";
    this.terminalEl.style.opacity = "1";
    this.terminalEl.style.transition = "";
    this.terminalEl.classList.remove("entering", "active");

    // clear previous session output
    this.outputEl.innerHTML = "";

    // reset internal state
    this.phase = null;
    this.userInput = "";
    this.username = "";
    this._setPrompt("");
    this._hideInput();
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

      if (
        event.key.length === 1 ||
        event.key === "Backspace" ||
        event.key === "Enter"
      ) {
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
        this._addLine("Mapping identity across infinite realities...", "white");
        this._addLine("", "white");
        this._addLine("Entering the multiverse...", "amber");
        this._hideInput();
        this.phase = "transition";

        // Trigger transition callback
        if (this.onTransitionStart) {
          this.onTransitionStart();
        }
      } else if (command === "help") {
        this._addLine("", "white");
        this._addLine("Available commands:", "amber");
        this._addLine(
          "  start     — begin your journey into the multiverse",
          "white",
        );
        this._addLine("  whoami    — identify your quantum self", "white");
        this._addLine("  ls        — list local reality files", "white");
        this._addLine("  help      — show this message", "white");
        this._addLine("", "white");
        this._addLine("Navigation (once inside):", "amber");
        this._addLine("  W / S           move forward & back", "white");
        this._addLine("  A / D           move left & right", "white");
        this._addLine("  R / F           ascend & descend", "white");
        this._addLine("  HOLD + DRAG     look around", "white");
        this._addLine("", "white");
      } else if (command === "whoami") {
        this._addLine("", "white");
        this._addLine(`User: ${this.username}`, "amber");
        this._addLine("Origin: unknown", "white");
        this._addLine(
          "Quantum signature: " +
            Math.random().toString(36).substring(2, 10).toUpperCase(),
          "white",
        );
        this._addLine(
          "Reality branches detected: " +
            Math.floor(Math.random() * 9000 + 1000),
          "white",
        );
        this._addLine("Status: INFINITE", "amber");
        this._addLine("", "white");
      } else if (command === "ls") {
        this._addLine("", "white");
        this._addLine("total 7", "white");
        this._addLine("drwxr-xr-x  self_v1.dat", "white");
        this._addLine("drwxr-xr-x  reality_branch_map.json", "white");
        this._addLine("-rw-r--r--  identity_core.sys", "white");
        this._addLine("-rw-r--r--  parallel_selves.log", "white");
        this._addLine("-rw-------  quantum_signature.key", "white");
        this._addLine("drwxr-xr-x  multiverse/", "amber");
        this._addLine("", "white");
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
