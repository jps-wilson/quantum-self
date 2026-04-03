// BOOT MESSAGES
export const BOOT_MESSAGES = [
  {
    text: "QUANTUM BIOS v2.4.1 (C) 1985 QuantumSoft Inc.",
    delay: 0,
    color: "white",
  },
  { text: "Base Memory: 640K   Extended: 15360K", delay: 100, color: "white" },
  { text: "Disk 0: 20MB ST-225 HDD [OK]", delay: 150, color: "white" },
  { text: "", delay: 200, color: "white" },
  { text: "Loading QUANTUM/UNIX Kernel v3.2...", delay: 250, color: "amber" },
  { text: "", delay: 400, color: "white" },
  { text: "unix: (ttyd0) multi-user", delay: 450, color: "white" },
  { text: "mem = 15728K (0x0f60000)", delay: 500, color: "white" },
  { text: "avail mem = 14336K", delay: 550, color: "white" },
  {
    text: "using 147 buffers containing 1176K memory",
    delay: 600,
    color: "white",
  },
  { text: 'wd0: ST-225 <20MB 5.25" FH ESDI>', delay: 650, color: "white" },
  { text: "wd0a: 19MB, 615 cyl, 4 heads, 17 sec", delay: 700, color: "white" },
  { text: "", delay: 750, color: "white" },
  { text: "Checking filesystems...", delay: 800, color: "white" },
  { text: "/dev/wd0a: clean, 1847 files", delay: 900, color: "white" },
  { text: "Mounting local filesystems...", delay: 1000, color: "white" },
  {
    text: "Starting daemons: update cron inetd lpd",
    delay: 1100,
    color: "white",
  },
  { text: "", delay: 1150, color: "white" },
  { text: "Init network: qe0", delay: 1200, color: "white" },
  { text: "qe0: address 08:00:2b:3c:4d:5e", delay: 1250, color: "white" },
  {
    text: "Starting network daemons: routed named",
    delay: 1300,
    color: "white",
  },
  { text: "", delay: 1350, color: "white" },
  { text: "Quantum Multi-User System ready.", delay: 1400, color: "amber" },
  { text: "", delay: 1450, color: "white" },
];

// QUANTUM LOGO
export const QUANTUM_LOGO = `
   ██████╗ ██╗   ██╗ █████╗ ███╗   ██╗████████╗██╗   ██╗███╗   ███╗
  ██╔═══██╗██║   ██║██╔══██╗████╗  ██║╚══██╔══╝██║   ██║████╗ ████║
  ██║   ██║██║   ██║███████║██╔██╗ ██║   ██║   ██║   ██║██╔████╔██║
  ██║▄▄ ██║██║   ██║██╔══██║██║╚██╗██║   ██║   ██║   ██║██║╚██╔╝██║
  ╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║   ██║   ╚██████╔╝██║ ╚═╝ ██║
   ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝
`;

// WELCOME MESSAGES
export const WELCOME_MESSAGES = [
  { text: "", color: "white" },
  { text: "Initializing user profile...", color: "amber" },
  { text: "Creating session token...", color: "white" },
  { text: "", color: "white" },
  { text: "Last login: Mon Apr 15 09:42:13 1985", color: "white" },
  { text: "", color: "white" },
  { text: "WELCOME TO THE QUANTUM SELF", color: "amber" },
  { text: "Explore identity across infinite realities", color: "white" },
  { text: "", color: "white" },
];
