import { QUESTIONS, generatePortrait } from "../data/questions.js";

export class MultiverseUI {
  constructor() {
    this.container = document.getElementById("multiverse-ui");
    this.homeAnswers = {};
    this.isSequenceActive = false;
    this.currentPanel = null;
    this.alternatePanel = null;
    this.portraitPanel = null;
    this.portraitBackdrop = null;

    this.onAnswer = null; // (questionId, answerId)
    this.onHomeComplete = null; // (homeAnswers)
  }

  // ── Home question sequence ─────────────────────────────────────────────

  startHomeSequence() {
    if (this.isSequenceActive) return;
    this.isSequenceActive = true;
    this._showQuestion(0);
  }

  _showQuestion(index) {
    const q = QUESTIONS[index];
    const el = document.createElement("div");
    el.className = "question-panel centered";
    el.innerHTML = `
      <h3>QUANTUM SELF // QUESTION ${index + 1} OF ${QUESTIONS.length}</h3>
      <p>${q.text}</p>
      <div class="answer-options">
        ${q.answers
          .map(
            (a) => `
          <button class="answer-btn" data-question="${q.id}" data-answer="${a.id}">
            ${a.id}. ${a.text}
          </button>
        `,
          )
          .join("")}
      </div>
    `;

    el.querySelectorAll(".answer-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const qId = parseInt(btn.dataset.question);
        const aId = btn.dataset.answer;
        this._recordHomeAnswer(qId, aId, el, index);
      });
    });

    this.container.appendChild(el);
    this.currentPanel = el;
    requestAnimationFrame(() => el.classList.add("visible"));
  }

  _recordHomeAnswer(questionId, answerId, panelEl, index) {
    this.homeAnswers[questionId] = answerId;
    if (this.onAnswer) this.onAnswer(questionId, answerId);

    panelEl.classList.remove("visible");
    panelEl.addEventListener(
      "transitionend",
      () => {
        panelEl.remove();
        this.currentPanel = null;
        const next = index + 1;
        if (next < QUESTIONS.length) {
          setTimeout(() => this._showQuestion(next), 600);
        } else {
          setTimeout(() => this._finishHomeSequence(), 600);
        }
      },
      { once: true },
    );
  }

  _finishHomeSequence() {
    this.isSequenceActive = false;
    if (this.onHomeComplete) this.onHomeComplete({ ...this.homeAnswers });
    setTimeout(() => this._showPortrait(), 1500);
  }

  // ── Alternate universe content ─────────────────────────────────────────

  showAlternateContent(selfName, narrative) {
    this.clearAlternateContent();
    const el = document.createElement("div");
    el.className = "narrative-panel centered";
    el.innerHTML = `
      <div class="self-name">${selfName}</div>
      <div class="self-text">${narrative}</div>
    `;
    this.container.appendChild(el);
    this.alternatePanel = el;
    requestAnimationFrame(() => el.classList.add("visible"));
  }

  clearAlternateContent() {
    if (this.alternatePanel) {
      this.alternatePanel.classList.remove("visible");
      this.alternatePanel.addEventListener(
        "transitionend",
        () => {
          this.alternatePanel?.remove();
        },
        { once: true },
      );
      this.alternatePanel = null;
    }
  }

  // ── Portrait ──────────────────────────────────────────────────────────

  _showPortrait() {
    const { 0: q0, 1: q1, 2: q2 } = this.homeAnswers;
    const text = generatePortrait(q0, q1, q2);

    const backdrop = document.createElement("div");
    backdrop.id = "portrait-backdrop";
    this.container.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("visible"));
    this.portraitBackdrop = backdrop;

    const el = document.createElement("div");
    el.id = "portrait-panel";
    el.innerHTML = `
      <div class="portrait-label">YOUR QUANTUM SELF</div>
      <div class="portrait-text">${text}</div>
      <button class="portrait-close">continue exploring →</button>
    `;
    this.container.appendChild(el);
    this.portraitPanel = el;
    setTimeout(() => el.classList.add("visible"), 200);

    el.querySelector(".portrait-close").addEventListener("click", () => {
      el.classList.remove("visible");
      backdrop.classList.remove("visible");
      setTimeout(() => {
        el.remove();
        backdrop.remove();
        this.portraitPanel = null;
        this.portraitBackdrop = null;
      }, 2000);
    });
  }

  // ── Update + Teardown ─────────────────────────────────────────────────

  update() {
    // Panels are screen-centred via CSS — no 3D projection needed
  }

  dispose() {
    this.container.innerHTML = "";
    this.currentPanel = null;
    this.alternatePanel = null;
    this.portraitPanel = null;
    this.portraitBackdrop = null;
    this.homeAnswers = {};
    this.isSequenceActive = false;
  }
}
