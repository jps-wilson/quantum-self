// ============================================
//            QUANTUM SELF - BOOT SYSTEM
// ============================================

const terminal = document.getElementById("terminal");
const powerSwitch = document.getElementById("powerSwitch");
let isPoweredOn = false;
let bootComplete = false;
let currentInput = "";
let awaitingInput = null; // 'username', 'password', 'command'
let username = "";

const bootMessages = [
  {
    text: "QUANTUM BIOS v2.4.1 (C) 1985 QuantumSoft Inc.",
    delay: 0,
    class: "glow-white",
  },
  {
    text: "Base Memory: 640K   Extended: 15360K   Total: 16000K",
    delay: 100,
    class: "glow-white",
  },
  { text: "Disk 0: 20MB ST-225 HDD [OK]", delay: 150, class: "glow-white" },
  { text: "", delay: 200, class: "glow-white" },
  {
    text: "Loading QUANTUM/UNIX Kernel v3.2...",
    delay: 250,
    class: "glow-amber",
  },
  { text: "", delay: 400, class: "glow-white" },
  { text: "unix: (ttyd0) multi-user", delay: 450, class: "glow-white" },
  { text: "mem = 15728K (0x0f60000)", delay: 500, class: "glow-white" },
  { text: "avail mem = 14336K", delay: 550, class: "glow-white" },
  {
    text: "using 147 buffers containing 1176K of memory",
    delay: 600,
    class: "glow-white",
  },
  { text: 'wd0: ST-225 <20MB 5.25" FH ESDI>', delay: 650, class: "glow-white" },
  {
    text: "wd0a: 19MB, 615 cyl, 4 heads, 17 sec, 512 bytes/sec",
    delay: 700,
    class: "glow-white",
  },
  { text: "", delay: 750, class: "glow-white" },
  { text: "Checking filesystems...", delay: 800, class: "glow-white" },
  {
    text: "/dev/wd0a: clean, 1847 files, 12456 used, 6234 free",
    delay: 900,
    class: "glow-white",
  },
  { text: "Mounting local filesystems...", delay: 1000, class: "glow-white" },
  {
    text: "Starting system daemons: update cron inetd lpd",
    delay: 1100,
    class: "glow-white",
  },
  { text: "", delay: 1150, class: "glow-white" },
  {
    text: "Initializing network interfaces: qe0",
    delay: 1200,
    class: "glow-white",
  },
  { text: "qe0: address 08:00:2b:3c:4d:5e", delay: 1250, class: "glow-white" },
  {
    text: "Starting network daemons: routed named",
    delay: 1300,
    class: "glow-white",
  },
  { text: "", delay: 1350, class: "glow-white" },
  {
    text: "Quantum Multi-User System ready.",
    delay: 1400,
    class: "glow-amber",
  },
  { text: "", delay: 1450, class: "glow-white" },
];

const quantumLogo = `
    ██████╗ ██╗   ██╗ █████╗ ███╗   ██╗████████╗██╗   ██╗███╗   ███╗
   ██╔═══██╗██║   ██║██╔══██╗████╗  ██║╚══██╔══╝██║   ██║████╗ ████║
   ██║   ██║██║   ██║███████║██╔██╗ ██║   ██║   ██║   ██║██╔████╔██║
   ██║▄▄ ██║██║   ██║██╔══██║██║╚██╗██║   ██║   ██║   ██║██║╚██╔╝██║
   ╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║   ██║   ╚██████╔╝██║ ╚═╝ ██║
    ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝
    `;

// Initialize terminal
terminal.innerHTML = `<div class="terminal-line glow-white">System offline. Press power button to boot...</div>`; // TODO: eventually change to different color screen so that there is no text displayed but still clear that the terminal is off

// ============================================
//              POWER BUTTON HANDLER
// ============================================
powerSwitch.addEventListener("click", () => {
  if (!isPoweredOn) {
    isPoweredOn = true;
    powerSwitch.classList.add("on");
    startBootSequence();
  } else if ((isPoweredOn = true)) {
    isPoweredOn = false;
    powerSwitch.classList.remove("on");
    // TODO: function to clear the screen
  }
});

// ============================================
//              BOOT SEQUENCE
// ============================================
function startBootSequence() {
  terminal.innerHTML = "";
  let currentDelay = 0;

  bootMessages.forEach((msg, index) => {
    setTimeout(() => {
      const line = document.createElement("div");
      line.className = `terminal-line ${msg.class}`;
      line.textContent = msg.text;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;

      // after last message, show QUANTUM logo
      if (index === bootMessages.length - 1) {
        setTimeout(() => {
          showQuantumLogo();
        }, 300);
      }
    }, msg.delay);
  });
}

function showQuantumLogo() {
  const logoDiv = document.createElement("div");
  logoDiv.className = "terminal-line";
  logoDiv.style.marginTop = "20px";
  logoDiv.style.marginBottom = "20px";

  const pre = document.createElement("pre");
  pre.className = "glow-amber";
  pre.style.margin = "0";
  pre.style.padding = "0";
  pre.style.textAlign = "center";
  pre.style.lineHeight = "1.2";
  pre.textContent = quantumLogo;

  logoDiv.appendChild(pre);
  terminal.appendChild(logoDiv);
  terminal.scrollTop = terminal.scrollHeight;

  setTimeout(() => {
    showSystemInfo();
  }, 500);
}

function showSystemInfo() {
  const lines = [
    { text: "", class: "glow-white" },
    {
      text: "                    QUANTUM SELF MULTIVERSE SYSTEM",
      class: "glow-amber",
    },
    {
      text: "                         Build 850415-REV-2.4",
      class: "glow-white",
    },
    { text: "", class: "glow-white" },
    { text: "", class: "glow-white" },
  ];

  lines.forEach((lineData, index) => {
    setTimeout(() => {
      const line = document.createElement("div");
      line.className = `terminal-line ${lineData.class}`;
      line.textContent = lineData.text;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;

      if (index === lines.length - 1) {
        setTimeout(() => {
          promptLogin();
        }, 300);
      }
    }, index * 100);
  });
}

// ============================================
//              LOGIN SYSTEM
// ============================================
function promptLogin() {
  const line = document.createElement("div");
  line.className = "terminal-line glow-white";
  line.innerHTML = `quantum login: <span id="user-input" class="glow-amber"></span><span class="cursor" style="display: inline-block; width: 8px; height: 14px; background: #ffa657; margin-left: 2px; animation: blink 1s infinite;"></span>`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;

  awaitingInput = "username";
  currentInput = "";
}

function promptPassword() {
  const line = document.createElement("div");
  line.className = "terminal-line glow-white";
  line.innerHTML = `Password: <span id="pass-input" class="glow-amber"></span><span class="cursor" style="display: inline-block; width: 8px; height: 14px; background: #ffa657; margin-left: 2px; animation: blink 1s infinite;"></span>`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;

  awaitingInput = "password";
  currentInput = "";
}

function initializeUser() {
  const lines = [
    { text: "", class: "glow-white" },
    { text: "Initializing user profile...", class: "glow-amber" },
    { text: "Creating session token...", class: "glow-white" },
    { text: "", class: "glow-white" },
    {
      text: "Last login: Mon Apr 15 09:42:13 1985 on ttyd0",
      class: "glow-white",
    },
    { text: "", class: "glow-white" },
    { text: "WELCOME TO THE QUANTUM SELF", class: "glow-amber" },
    {
      text: "An interactive exploration of identity across infinite realities",
      class: "glow-white",
    },
    { text: "", class: "glow-white" },
    { text: "Type 'start' to begin your journey...", class: "glow-white" },
    { text: "", class: "glow-white" },
  ];

  lines.forEach((lineData, index) => {
    setTimeout(() => {
      const line = document.createElement("div");
      line.className = `terminal-line ${lineData.class}`;
      line.textContent = lineData.text;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;

      if (index === lines.length - 1) {
        setTimeout(() => {
          showCommandPrompt();
        }, 300);
      }
    }, index * 80);
  });
}

function showCommandPrompt() {
  bootComplete = true;
  const line = document.createElement("div");
  line.className = "terminal-line glow-white";
  line.innerHTML = `<span class="glow-amber">quantum@self:~$</span> <span id="cmd-input" class="glow-white"></span><span class="cursor" style="display: inline-block; width: 8px; height: 14px; background: #ffa657; margin-left: 2px; animation: blink 1s infinite;"></span>`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;

  awaitingInput = "command";
  currentInput = "";
}

// ============================================
//              KEYBOARD INPUT HANDLER
// ============================================
document.addEventListener("keydown", (e) => {
  if (!isPoweredOn || !awaitingInput) return;

  if (e.key === "Enter") {
    handleEnter();
  } else if (e.key === "Backspace") {
    currentInput = currentInput.slice(0, -1);
    updateInputDisplay();
  } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    currentInput += e.key;
    updateInputDisplay();
  }
});

function updateInputDisplay() {
  if (awaitingInput === "username") {
    const userInput = document.getElementById("user-input");
    if (userInput) userInput.textContent = currentInput;
  } else if (awaitingInput === "password") {
    const passInput = document.getElementById("pass-input");
    if (passInput) passInput.textContent = "*".repeat(currentInput.length);
  } else if (awaitingInput === "command") {
    const cmdInput = document.getElementById("cmd-input");
    if (cmdInput) cmdInput.textContent = currentInput;
  }
}

function handleEnter() {
  // Remove cursor
  const cursors = document.querySelectorAll(".cursor");
  cursors.forEach((cursor) => cursor.remove());

  if (awaitingInput === "username") {
    username = currentInput || "guest";
    awaitingInput = null;
    setTimeout(() => promptPassword(), 100);
  } else if (awaitingInput === "password") {
    awaitingInput = null;
    setTimeout(() => initializeUser(), 100);
  } else if (awaitingInput === "command") {
    const cmd = currentInput.trim().toLowerCase();
    awaitingInput = null;

    if (cmd === "start") {
      // Success - start the experience
      const line = document.createElement("div");
      line.className = "terminal-line glow-amber";
      line.textContent = "Initializing quantum engine...";
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;

      // TODO: Trigger transition to 3D experience
      setTimeout(() => {
        const line2 = document.createElement("div");
        line2.className = "terminal-line glow-white";
        line2.textContent = "[3D experience will load here]";
        terminal.appendChild(line2);
        terminal.scrollTop = terminal.scrollHeight;
      }, 1000);
    } else if (cmd === "") {
      // Empty command - just show new prompt
      showCommandPrompt();
    } else {
      // Wrong command - show error
      const errorLine = document.createElement("div");
      errorLine.className = "terminal-line glow-white";
      errorLine.textContent = `bash: ${currentInput}: command not found`;
      terminal.appendChild(errorLine);
      terminal.scrollTop = terminal.scrollHeight;

      setTimeout(() => showCommandPrompt(), 100);
    }
  }
}

// ============================================
//              CURSOR BLINK ANIMATION
// ============================================
const style = document.createElement("style");
style.textContent = `
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`;
document.head.appendChild(style);
