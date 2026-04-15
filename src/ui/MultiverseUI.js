/**
 * MultiverseUI.js
 * Manages all HTML overlays for the multiverse scene:
 *  - Question panels (positioned in 3D space each frame)
 *  - Narrative panels (shown inside bubbles after answering)
 *  - Portrait panel (shown at neural network centre at the end)
 */

import { QUESTIONS, generatePortrait } from "../data/questions.js";

export class MultiverseUI {
  constructor(camera) {
    this.camera = camera;
    this.container = document.getElementById("multiverse-ui");

    // Tracks which questions have been answered and what was chosen
    this.answers = {}; // { questionID: answerID }

    // Callbacks set by MultiverseScene
    this.onAnswer = null; // called when user picks an answer

    this.questionPanels = []; // { el, worldPos, questionId }
    this.narrativePanels = []; // { el, worldPos }
    this.portraitPanel = null;
  }

  // --- Setup -------------------------------------------------------------

  init(bubblePositions) {
    // Create one question panel per bubble
    QUESTIONS.forEach((q, i) => {
      const pos = bubblePositions[i];

      // Panel floats slightly above the bubble centre
      const worldPos = {
        x: pos.x,
        y: pos.y + pos.radius * 0.6,
        z: pos.z + pos.radius * 0.8,
      };

      // Proximity threshold — how close the camera needs to be to see the panel
      const proximityThreshold = pos.radius * 2.8;

      const el = this._createQuestionPanel(q);
      this.container.appendChild(el);
      this.questionPanels.push({
        el,
        worldPos,
        bubblePos: pos,
        proximityThreshold,
        questionId: q.id,
      });
    });
  }

  // --- Per-frame update -------------------------------------------------

  update(camera, renderer) {
    const width = renderer.domElement.clientWidth;
    const height = renderer.domElement.clientHeight;

    // Update question panel screen positions
    this.questionPanels.forEach(
      ({ el, worldPos, bubblePos, proximityThreshold, questionId }) => {
        // Don't show panels for already answered questions
        if (this.answers[questionId] !== undefined) {
          el.classList.remove("visible");
          return;
        }

        // Hide if camera is too far from the bubble
        const dx = camera.position.x - bubblePos.x;
        const dy = camera.position.y - bubblePos.y;
        const dz = camera.position.z - bubblePos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > proximityThreshold) {
          el.classList.remove("visible");
          return;
        }

        const screen = this._worldToScreen(worldPos, camera, width, height);

        // Only show if in front of camera and within screen bounds
        if (
          screen.z < 1 &&
          screen.x > 0 &&
          screen.x < width &&
          screen.y > 0 &&
          screen.y < height
        ) {
          el.style.left = `${screen.x}px`;
          el.style.top = `${screen.y}px`;
          el.classList.add("visible");
        } else {
          el.classList.remove("visible");
        }
      },
    );

    // Update narrative panel screen positions
    this.narrativePanels.forEach(
      ({ el, worldPos, bubblePos, proximityThreshold }) => {
        const dx = camera.position.x - bubblePos.x;
        const dy = camera.position.y - bubblePos.y;
        const dz = camera.position.z - bubblePos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > proximityThreshold) {
          el.classList.remove("visible");
          return;
        }
        const screen = this._worldToScreen(worldPos, camera, width, height);
        if (
          screen.z < 1 &&
          screen.x > 0 &&
          screen.x < width &&
          screen.y > 0 &&
          screen.y < height
        ) {
          el.style.left = `${screen.x}px`;
          el.style.top = `${screen.y}px`;
          el.classList.add("visible");
        } else {
          el.classList.remove("visible");
        }
      },
    );
  }

  // --- Answer handling ------------------------------------------------

  recordAnswer(questionId, answerId, bubbleWorldPos) {
    this.answers[questionId] = answerId;

    // Find the chosen answer data
    const question = QUESTIONS[questionId];
    const answer = question.answers.find((a) => a.id === answerId);

    // Show narrative panel at the bubble centre
    this._showNarrative(answer, bubbleWorldPos);

    // Notify MultiverseScene for visual "reaction"
    if (this.onAnswer) {
      this.onAnswer(questionId, answerId);
    }

    // If all questions answered - show portrait
    if (Object.keys(this.answers).length === QUESTIONS.length) {
      setTimeout(() => this._showPortrait(), 2000);
    }
  }

  // --- Teardown -------------------------------------------------------

  dispose() {
    this.container.innerHTML = "";
    this.questionPanels = [];
    this.narrativePanels = [];
    this.portraitPanel = null;
    this.answers = {};
  }

  // --- Private ---------------------------------------------------
  _createQuestionPanel(question) {
    const el = document.createElement("div");
    el.className = "question-panel";
    el.innerHTML = `
      <h3>QUANTUM SELF // QUESTION ${question.id + 1}</h3>
      <p>${question.text}</p>
      <div class="answer-options">
        ${question.answers
          .map(
            (a) => `
          <button class="answer-btn" data-question="${question.id}" data-answer="${a.id}">
            ${a.id}. ${a.text}
          </button>
        `,
          )
          .join("")}
      </div>
    `;

    // Wire up answer buttons
    el.querySelectorAll(".answer-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const qId = parseInt(btn.dataset.question);
        const aId = btn.dataset.answer;
        const panel = this.questionPanels.find((p) => p.questionId === qId);
        this.recordAnswer(qId, aId, panel?.bubblePos ?? { x: 0, y: 0, z: 0 });
      });
    });

    return el;
  }

  _showNarrative(answer, bubblePos) {
    const radius = bubblePos.radius || 8;
    const worldPos = {
      x: bubblePos.x,
      y: bubblePos.y + radius * 0.55,
      z: bubblePos.z + radius * 0.65,
    };

    const el = document.createElement("div");
    el.className = "narrative-panel";
    el.innerHTML = `
      <div class="self-name">${answer.selfName}</div>
      <div class="self-text">${answer.narrative}</div>
    `;
    this.container.appendChild(el);
    this.narrativePanels.push({
      el,
      worldPos,
      bubblePos,
      proximityThreshold: radius * 2.8,
    });
    setTimeout(() => el.classList.add("visible"), 100);
  }

  _showPortrait() {
    const q0 = this.answers[0];
    const q1 = this.answers[1];
    const q2 = this.answers[2];
    const text = generatePortrait(q0, q1, q2);

    // Dark backdrop
    const backdrop = document.createElement("div");
    backdrop.id = "portrait-backdrop";
    this.container.appendChild(backdrop);
    setTimeout(() => backdrop.classList.add("visible"), 50);

    // Portrait card
    const el = document.createElement("div");
    el.id = "portrait-panel";
    el.innerHTML = `
            <div class="portrait-label">YOUR QUANTUM SELF</div>
            <div class="portrait-text">${text}</div>
        `;
    this.container.appendChild(el);
    this.portraitPanel = el;

    setTimeout(() => el.classList.add("visible"), 100);
  }

  _worldToScreen(worldPos, camera, width, height) {
    const x = worldPos.x;
    const y = worldPos.y;
    const z = worldPos.z;

    const mv = camera.matrixWorldInverse;
    const p = camera.projectionMatrix;

    // Transform world pos by view matrix then projection matrix
    const elements = mv.elements;
    const ex =
      elements[0] * x + elements[4] * y + elements[8] * z + elements[12];
    const ey =
      elements[1] * x + elements[5] * y + elements[9] * z + elements[13];
    const ez =
      elements[2] * x + elements[6] * y + elements[10] * z + elements[14];
    const ew =
      elements[3] * x + elements[7] * y + elements[11] * z + elements[15];

    const pe = p.elements;
    const cx = pe[0] * ex + pe[4] * ey + pe[8] * ez + pe[12] * ew;
    const cy = pe[1] * ex + pe[5] * ey + pe[9] * ez + pe[13] * ew;
    const cw = pe[3] * ex + pe[7] * ey + pe[11] * ez + pe[15] * ew;
    const cz = pe[2] * ex + pe[6] * ey + pe[10] * ez + pe[14] * ew;

    const ndcX = cx / cw;
    const ndcY = cy / cw;
    const ndcZ = cz / cw;

    return {
      x: (ndcX * 0.5 + 0.5) * width,
      y: (-ndcY * 0.5 + 0.5) * height,
      z: ndcZ,
    };
  }
}
