const terminal = document.getElementById("terminal");

// makes terminal focusable
terminal.setAttribute("tabindex", "0");
terminal.innerHTML = `

  <div class="terminal-line glow-white">
    NEGOTIATING SESSION KEYS...
  </div>

  <div class="terminal-line glow-white">
    <span class="glow-amber">quantum@self:~$</span> initializing...
  </div>
  
  <div class="terminal-line glow-white">
    Loading multiverse engine... <span class="glow-amber">[OK]</span>
  </div>

  <div class="terminal-line glow-white">
    Calibrating reality branches... <span class="glow-amber">[OK]</span>
  </div>

  <div class="terminal-line glow-white">
    Connecting to parallel dimensions... <span class="glow-amber">[OK]</span>
  </div>

  <div class="terminal-line" style="margin: 30px 0;">
    <pre class="glow-amber" style="margin: 0; padding: 0; text-align: center; line-height: 1.2;">
    ██████╗ ██╗   ██╗ █████╗ ███╗   ██╗████████╗██╗   ██╗███╗   ███╗
   ██╔═══██╗██║   ██║██╔══██╗████╗  ██║╚══██╔══╝██║   ██║████╗ ████║
   ██║   ██║██║   ██║███████║██╔██╗ ██║   ██║   ██║   ██║██╔████╔██║
   ██║▄▄ ██║██║   ██║██╔══██║██║╚██╗██║   ██║   ██║   ██║██║╚██╔╝██║
   ╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║   ██║   ╚██████╔╝██║ ╚═╝ ██║
    ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝
    </pre>
  </div>

  <div class="terminal-line glow-amber">
    WELCOME TO THE QUANTUM SELF
  </div>

  <div class="terminal-line glow-white">
    An interactive exploration of the multiverse
  </div>

  <div class="terminal-line glow-white" style="margin-top: 20px;">
    Click anywhere to begin...
  </div>
`;

// create highlight bar
const highlightBar = document.createElement("div");
highlightBar.className = "terminal-highlight-bar";
terminal.insertBefore(highlightBar, terminal.firstChild);
terminal.focus();
let currentLine = 0; // tracking for current line position
let totalLines = 0; // tracking for current line position

function updateHighlightPosition() {
  const lines = terminal.querySelectorAll(".terminal-line");
  totalLines = lines.length;
  currentLine = Math.max(0, Math.min(currentLine, totalLines - 1));

  // position highlight bar
  if (lines[currentLine]) {
    const lineTop = lines[currentLine].offsetTop;
    const lineHeight = lines[currentLine].offsetHeight;
    highlightBar.style.top = `${lineTop}px`;
    highlightBar.style.height = `${lineHeight}px`;
    highlightBar.style.display = "block";

    // auto-scroll to keep highlight visible
    lines[currentLine].scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }
}

// keyboard navigation
terminal.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      currentLine++;
      updateHighlightPosition();
      break;

    case "ArrowUp":
      e.preventDefault();
      currentLine--;
      updateHighlightPosition();
      break;

    case "PageDown":
      e.preventDefault();
      const linesPerPage = Math.floor(
        terminal.clientHeight / parseInt(getComputedStyle(terminal).lineHeight),
      );
      currentLine += linesPerPage;
      updateHighlightPosition();
      break;

    case "PageUp":
      e.preventDefault();
      const linesPerPageUp = Math.floor(
        terminal.clientHeight / parseInt(getComputedStyle(terminal).lineHeight),
      );
      currentLine -= linesPerPageUp;
      updateHighlightPosition();
      break;

    case "Home":
      e.preventDefault();
      currentLine = 0;
      updateHighlightPosition();
      break;

    case "End":
      e.preventDefault();
      currentLine = totalLines - 1;
      updateHighlightPosition();
      break;
  }
});

// keep focus on terminal when clicking inside it
terminal.addEventListener("click", () => {
  terminal.focus();
});

// load highligh on first line
setTimeout(() => {
  updateHighlightPosition();
}, 200);
