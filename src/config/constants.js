// SCENE CONFIG
export const SCENE_CONFIG = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [0, 1.5, 3],
  },
  controls: {
    dampingFactor: 0.05,
    target: [0, 1, 0],
  },
  lighting: {
    ambient: { color: 0x404040, intensity: 1.5 },
    bulb: { color: 0xffa500, intensity: 3, distance: 50, position: [0, 3, 0] },
  },
};

// MONITOR CONFIG
export const MONITOR_CONFIG = {
  canvas: { width: 512, height: 384 },
  screen: {
    meshName: "Plane009_screen3_0",
    emissiveColor: 0x00ff41,
    emissiveBase: 0.4,
    emissiveVariance: 0.08,
  },
  effects: {
    scanlines: { gap: 4, thickness: 2, opacity: 0.25 },
    noise: { count: 20, maxOpacity: 0.12 },
    vignette: { innerRadius: 0.25, outerRadius: 0.75, opacity: 0.8 },
  },
};

// MODEL PATHS
export const MODELS = {
  desk: {
    path: "/models/desk.glb",
    position: [0, 0, 0],
    scale: null,
  },
  monitor: {
    path: "/models/monitor.glb",
    position: [0, 0.55, 0],
    scale: [0.13, 0.13, 0.13],
  },
  blackHole: {
    path: "/models/black_hole.glb",
    position: [0, 2, -5],
    scale: [0.1, 0.1, 0.1],
  },
};

// TRANSITION CONFIG
export const TRANSITION_CONFIG = {
  blackHole: {
    duration: 4.0, // transition duration (seconds)
    spawnDistance: 8, // initial distance in front of camera
    growthRate: 0.15, // how fast it grows
    spinSpeed: 0.5, // rotation speed
    pullStrength: 2.5, // camera pull force
  },
  terminal: {
    fadeOutDuration: 1.0, // how long terminal fades
  },
};
