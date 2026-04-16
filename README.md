# Quantum Self

An interactive 3D web experience about identity, choice, and the selves you never became.

**Live demo:** [quantumself.vercel.app](https://quantumself.vercel.app)

---

## Overview

Quantum Self is a narrative-driven 3D journey through a cosmic multiverse of alternate selves. Inspired by the many-worlds interpretation of quantum mechanics — the idea that every decision spawns a branching universe — the experience invites you to reflect on three existential questions about who you are and who you might have been.

You begin at a retro computer terminal. You type your way through a boot sequence. Then you're launched through a wormhole into an infinite void, where three iridescent bubbles float in deep space. Each bubble holds an alternate version of you. Approach one, answer the question inside, and its story unfolds. When all three are resolved, a neural network at the heart of the multiverse assembles your portrait — a single paragraph that is uniquely yours.

---

## Features

- **Desk scene** — A CRT monitor with an interactive terminal. Navigate the boot sequence and type `start` to begin.
- **Wormhole transition** — A 19-second animated tunnel built from layered galaxy textures. Skippable if you've seen it before.
- **Multiverse scene** — A particle-filled void with three floating iridescent bubbles, each containing a question and a narrative.
- **Personalized portrait** — Your three answers combine into a unique two-sentence self-description shown at the neural network finale.
- **Spatial audio** — 3D positional sound tied to proximity and environment.
- **Bloom post-processing** — Unreal Bloom pass gives the bubbles and starfield a cinematic glow.
- **CRT aesthetics** — Scanline overlays, green-phosphor terminal text, and retro UI throughout.
- **Full HUD controls** — Mute toggle, skip button, return to desk, and full restart — all accessible without reloading.

---

## Tech Stack

| Tool                                    | Purpose                                                           |
| --------------------------------------- | ----------------------------------------------------------------- |
| [Three.js](https://threejs.org/) v0.183 | 3D rendering, materials, lighting, post-processing, spatial audio |
| [GSAP](https://gsap.com/) v3.14         | Animation timelines (wormhole sequence, transitions, audio fades) |
| [Vite](https://vitejs.dev/) v8          | Build tool and dev server                                         |

---

## Browser Requirements

Quantum Self uses **WebGL** for 3D rendering. For the best experience:

- **Chrome** or **Edge** (latest) — recommended
- **Firefox** (latest) — supported
- **Safari** — may have reduced performance; WebGL 2 support varies by version
- **Mobile browsers** — not supported; keyboard and mouse input are required

Hardware acceleration must be enabled in your browser settings. If the 3D scene fails to load, check that WebGL is enabled at [get.webgl.org](https://get.webgl.org).

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Clone the repo
git clone https://github.com/jps-wilson/quantum-self
cd quantum-self

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## Controls

**In-scene movement**

| Key / Input              | Action                  |
| ------------------------ | ----------------------- |
| `W` / `S`                | Move forward / backward |
| `A` / `D`                | Strafe left / right     |
| `R` / `F`                | Move up / down          |
| Mouse drag (hold + drag) | Look around             |

**HUD buttons**

| Button      | Action                                                        |
| ----------- | ------------------------------------------------------------- |
| `SKIP →`    | Skip the wormhole transition (appears during transition only) |
| `← return`  | Return to the desk scene                                      |
| `⟳ restart` | Restart the full experience from the welcome screen           |
| `🔊 / 🔇`   | Toggle all audio                                              |

**Terminal**

Type your responses when prompted. Enter `start` at the command prompt to launch the wormhole.

---

## Project Structure

```
quantum-self/
├── index.html                  # Entry point, HUD buttons, terminal + 3D containers
├── public/
│   ├── audio/                  # Ambient, transition, and UI sound files
│   ├── models/                 # GLB 3D models (desk, monitor, light fixture)
│   └── textures/               # Environment map and wormhole galaxy layers
└── src/
    ├── main.js                 # Scene initialization and global transition logic
    ├── WelcomeScreen.js        # Intro overlay with controls
    ├── scenes/
    │   ├── SceneManager.js     # Scene state management
    │   ├── DeskScene.js        # Starting desk environment and monitor interaction
    │   └── MultiverseScene.js  # Main interactive scene
    ├── multiverse/
    │   ├── createBubbles.js    # Iridescent bubble geometry and materials
    │   ├── createSelf.js       # Silhouette rings representing chosen alternate selves
    │   ├── createStars.js      # Particle starfield and nebula clouds
    │   ├── createLights.js     # All scene lighting
    │   ├── createBloom.js      # Unreal Bloom post-processing pass
    │   └── createNeuralNetwork.js  # Final interconnected-sphere visualization
    ├── terminal/
    │   ├── Terminal.js         # Boot sequence, login, and command prompt logic
    │   └── terminalContent.js  # ASCII art, boot messages, and text content
    ├── ui/
    │   └── MultiverseUI.js     # Question panels, narrative text, and portrait display
    ├── utils/
    │   ├── wormhole.js         # 19-second wormhole animation sequence
    │   ├── SpatialAudio.js     # 3D positional audio wrapper
    │   └── modelLoader.js      # GLTFLoader utility
    ├── data/
    │   └── questions.js        # The three questions, answers, narratives, and portrait generator
    ├── config/
    │   └── constants.js        # Scene configuration and asset paths
    └── styles/                 # Modular CSS (base, terminal, CRT effects, transitions, UI)
```

---

## Design Decisions

### Why quantum mechanics?

The many-worlds interpretation felt like a natural metaphor for identity. Every decision you make collapses an infinite range of possible selves into one — the one reading this. The experience doesn't try to explain quantum physics; it borrows its structure. The bubbles represent superposition: all versions of you exist simultaneously until you choose.

### CRT terminal as a starting point

The desk and terminal are intentionally retro. The clunky boot sequence and green-phosphor text create friction before the vastness of the multiverse — the contrast is deliberate. You go from something familiar and constrained into something open and cosmic.

### Questions over answers

The three questions don't have right or wrong answers, and the experience doesn't judge your choices. The narratives are written to be uncomfortable in different ways — each alternate self has something the user might envy, and something they might not want. That's intentional.

### Visual language

Iridescent bubble materials were chosen because they shift colour depending on angle — the same object looks different depending on where you stand. That felt right for representing alternate selves. The bloom post-processing amplifies the sense of something glowing from within.

---

## AI Acknowledgment

Claude (Anthropic) was consulted during development for assistance with mathematical concepts and equations — specifically the spatial geometry used in placing and animating objects in 3D space, and the physics-based material parameters (transmission, iridescence, refraction index) for the bubble shaders. All creative direction, narrative writing, and implementation decisions are my own.

---

## Credits

- **Three.js** — [threejs.org](https://threejs.org)
- **GSAP** — [gsap.com](https://gsap.com)
- **Vite** — [vitejs.dev](https://vitejs.dev)

---

_Jess Wilson — Web Design & Interaction, Term 3 Final Project_
