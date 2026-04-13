/**
 * questions.js
 * Defines the three questions, their answer options, the narrative text
 * shown inside each bubble, and the portrait generator for the neural
 * network finale.
 */

export const QUESTIONS = [
  {
    id: 0,
    bubbleIndex: 0,
    text: "At a crossroads, you always choose...",
    answers: [
      {
        id: "A",
        text: "Security over risk",
        selfName: "The Guardian",
        narrative:
          "This version of you built walls instead of wings. They sleep soundly, but sometimes lie awake wondering what was on the other side of every door they chose not to open.",
      },
      {
        id: "B",
        text: "Passion over logic",
        selfName: "The Flame",
        narrative:
          "This version of you burned brightly. They have scars where most people have regrets, and would not trade a single one.",
      },
      {
        id: "C",
        text: "Others over yourself",
        selfName: "The Keeper",
        narrative:
          "This version of you became the person everyone needed. Somewhere in the giving, they lost track of what they needed for themselves.",
      },
    ],
  },
  {
    id: 1,
    bubbleIndex: 1,
    text: "The version of you that got away was...",
    answers: [
      {
        id: "A",
        text: "The fearless one",
        selfName: "The Bold",
        narrative:
          "They said yes when you said maybe. They jumped when you calculated. They are out there living the life that exists just past the edge of your comfort zone.",
      },
      {
        id: "B",
        text: "The creative one",
        selfName: "The Maker",
        narrative:
          "They kept making things long after the world told them to stop. Every blank page was an invitation, not a threat.",
      },
      {
        id: "C",
        text: "The one who stayed",
        selfName: "The Rooted",
        narrative:
          "They chose roots over wings. A life measured in depth rather than distance. They know what it means to truly belong somewhere.",
      },
    ],
  },
  {
    id: 2,
    bubbleIndex: 2,
    text: "What drives you most deeply?",
    answers: [
      {
        id: "A",
        text: "The need to be understood",
        selfName: "The Seeker",
        narrative:
          "You move through the world searching for the person who sees the part of you that language can't quite reach. Every connection is an attempt.",
      },
      {
        id: "B",
        text: "The desire to create",
        selfName: "The Builder",
        narrative:
          "You feel most alive when making something from nothing. The blank page, the empty canvas — these are not terrifying. They are invitations.",
      },
      {
        id: "C",
        text: "The search for peace",
        selfName: "The Still",
        narrative:
          "Beneath everything you do is a quiet longing for stillness. Not emptiness — presence. The kind of peace that doesn't need the world to be different.",
      },
    ],
  },
];

/**
 * Generates the personalized portrait shown at the neural network centre.
 * Takes the three chosen answer IDs (eg: "A", "B", "C") and returns a two-sentence description of that specific combination of self.
 */
export function generatePortrait(q0, q1, q2) {
  const traits = {
    A: "seeks security in a world of unknowns",
    B: "follows passion even when logic says otherwise",
    C: "gives yourself to others before yourself",
  };

  const lost = {
    A: "the fearless version who leapt without looking",
    B: "the creative version who never stopped making",
    C: "the version who stayed and grew deep roots",
  };

  const drive = {
    A: "the need to be truly understood",
    B: "the desire to create something lasting",
    C: "the search for a peace that asks nothing of you",
  };

  return `You are someone who ${traits[q0]}. The self you most wonder about is ${lost[q1]}. And what moves you, at your deepest level, is ${drive[q2]}.`;
}
