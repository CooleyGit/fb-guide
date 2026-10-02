import type { Selection } from "../types";

export type LessonTopic =
  | "Before the snap"
  | "Read run or pass"
  | "Keep the edge"
  | "Beat blocks and pursue"
  | "Tackle and finish"
  | "Coverage basics";

export interface Lesson {
  id: string;
  topic: LessonTopic;
  title: string;
  body: string[];
  advanced?: string;
  /** A supported scenario that illustrates this lesson ("Try it on the field"). */
  tryScenario?: Selection;
  tryLabel?: string;
}

export const TOPIC_ORDER: LessonTopic[] = [
  "Before the snap",
  "Read run or pass",
  "Keep the edge",
  "Beat blocks and pursue",
  "Tackle and finish",
  "Coverage basics",
];

// Lessons preserve the baseline coaching content, regrouped into scannable
// topics. Shared records (no paraphrased duplicates) feed field tips too.
export const LESSONS: Lesson[] = [
  {
    id: "before-the-snap",
    topic: "Before the snap",
    title: "Think before the snap. Play fast after it.",
    body: [
      "This is why you study formations. Before the ball moves, recognize the offense, hear the call, find your key, and know your job. Picture your response to a run, a pass, or a QB keeper.",
      "When the ball is snapped, trust your preparation. Read your key, find the ball, and react. You want quick, confident action—not a long conversation in your head while the play passes you.",
      "Reps build instinct. The more you recognize these looks, the faster the right response becomes. Fast does not mean guessing or chasing a fake; it means seeing your read and going.",
    ],
    tryScenario: { call: "Power", side: "left", formation: "i", outcome: "read" },
    tryLabel: "See a pre-snap read",
  },
  {
    id: "river-laso",
    topic: "Before the snap",
    title: "Listen for River or Laso",
    body: [
      "River = right. Laso = left. Start by looking for the wide side—the side with more room between the ball and the sideline. For the alignment rule in this guide, expect that to be the strong side.",
      "Left hash → wide side right → expect River. Right hash → wide side left → expect Laso.",
      "Always listen for the FS. Your free safety makes the strength call. The wide side gives you a starting expectation; the FS’s call confirms the side your defense is using.",
      "Ball in the middle? Neither side is wider. Read the formation and listen for the FS to declare River or Laso. If the formation is balanced, don’t pick a side on your own.",
    ],
    tryScenario: { call: "Zone", side: "middle-right", formation: "twins", outcome: "read" },
    tryLabel: "Try a middle-ball strength call",
  },
  {
    id: "one-rep",
    topic: "Before the snap",
    title: "Get better one rep at a time",
    body: [
      "Before the snap: Say your job to yourself: “I’m force,” “I’m rushing,” “I’ve got curl/flat,” or “I’ve got No. 2.” Then find the player you’re supposed to read.",
      "At the snap: Watch your key. Don’t guess from the formation or stare only at the quarterback. Make your first steps match what you see and what the call asks you to do.",
      "After the rep: Check three things: Was I in the right spot? Did I read the right player? Did I keep my assignment? Pick one thing to improve on the next rep.",
    ],
  },
  {
    id: "read-run-or-pass",
    topic: "Read run or pass",
    title: "Talk through your read: run or pass",
    body: [
      "Calling “run!” or “pass!” can be a useful habit once your assigned key gives you that read. It makes you recognize what you see and can help your teammates.",
      "Say it in your head while learning, or out loud when that is your team’s practice. Don’t shout a guess from the formation. Keep watching: a fake handoff, screen, or block-and-release can change the picture.",
    ],
    tryScenario: { call: "Man", side: "left", formation: "pro", outcome: "pass" },
    tryLabel: "Watch a release become a route",
  },
  {
    id: "read-keys",
    topic: "Read run or pass",
    title: "Blocks, releases, and fakes",
    body: [
      "Block: an offensive player tries to keep you or a teammate away from the ball. Release: he leaves his starting spot to run a route. A block can signal a run or screen; a release can signal a pass. Neither is proof by itself.",
      "Play-action: the offense fakes a run, then passes. Screen: a short pass with blockers in front. QB keeper: the QB keeps the ball instead of handing it off. Scramble: he leaves the pocket during a pass play and may still throw.",
      "Don’t chase the QB with your eyes on every call. In man, start with your receiver. In zone, use the coverage’s receiver and QB eye rules. On a run read, follow your assigned blocking key. Your eyes change with your job.",
    ],
    tryScenario: { call: "Power", side: "right", formation: "pistol", outcome: "qb" },
    tryLabel: "See a keeper vs a handoff",
  },
  {
    id: "keep-the-edge",
    topic: "Keep the edge",
    title: "Beat the block. Keep your edge.",
    body: [
      "“Shed the block” means get free of the blocker. Use your taught hand placement, keep a balanced base, and create space so he cannot stay attached to you. Find the ball and separate when you can make the play.",
      "Don’t win the block and lose the edge. If you are force, protect the outside escape lane as you work free. Don’t duck inside just to get around someone and let the runner turn the corner.",
      "“Outside arm free” is a cue you may hear for an edge fit: don’t let a blocker trap the side you need to protect. Use the technique and leverage your coaches assign.",
    ],
    tryScenario: { call: "Power", side: "left", formation: "double", outcome: "run" },
    tryLabel: "Set the edge on a run",
  },
  {
    id: "force-spill",
    topic: "Keep the edge",
    title: "Force and spill are different jobs",
    body: [
      "Force: keep the ball from escaping outside and turn it toward help. Spill: make the runner bounce outside toward a force defender. Alley: the space between the inside defense and the outside support.",
      "Leverage: which side of a blocker or receiver you must protect. Gap: the space between blockers. Contain: keep the ball carrier from escaping around the outside.",
    ],
    tryScenario: { call: "Power", side: "left", formation: "i", outcome: "run" },
    tryLabel: "See force, spill, and the alley",
  },
  {
    id: "pursue",
    topic: "Beat blocks and pursue",
    title: "Run to the ball—with a purpose",
    body: [
      "“Pursuit” means getting to the ball. Once your read tells you to go, run with effort and take an angle that meets the runner. Don’t trail directly behind him if you can cut off his path.",
      "“Rally” or “swarm” means teammates closing together. Keep your lane, stay alert for a cutback, and help finish the play. If a teammate has the runner wrapped, help within the rules; don’t pile on after the whistle.",
      "Effort lasts until the whistle. Hustle to help, but stop contact when the play is dead. A scrambling QB may still pass, so “run to the ball” does not mean abandoning coverage before your call allows it.",
    ],
  },
  {
    id: "affect-throw",
    topic: "Beat blocks and pursue",
    title: "No sack? Still affect the throw.",
    body: [
      "“Get your hands up” means challenge the passing lane. If you are rushing and the QB is about to throw before you can reach him, raise your arms to obstruct or tip the pass. You can affect the play without a sack.",
      "Keep your balance and rush lane. Don’t jump past a QB who can run around you. Watch the throwing motion; don’t stop your rush early just because the sack looks difficult.",
    ],
    tryScenario: { call: "Blitz", side: "left", formation: "trips", outcome: "pass" },
    tryLabel: "Rush and challenge the throw",
  },
  {
    id: "tackle",
    topic: "Tackle and finish",
    title: "Get low. Wrap up. Finish.",
    body: [
      "“Get low” means bend at your knees and hips into a strong, balanced position. It does not mean lower your head, dive at knees, or lead with your helmet. Keep your eyes up and your head out of the contact.",
      "“Wrap up” means secure the runner with your arms. Use the shoulder contact and aiming point your coaches teach, wrap and squeeze, and keep your feet working through the tackle.",
      "“Break down” means get under control near the runner. Shorten your steps, stay balanced, and avoid flying past him. Good tackling is controlled technique and a secure finish, not a contest to make the biggest hit.",
    ],
  },
  {
    id: "qb-contact",
    topic: "Tackle and finish",
    title: "Practice QB vs. game QB",
    body: [
      "In practice, follow the contact rules. If your QB is protected, tag off or stop exactly as the coaches tell you. Don’t tackle him to prove you could have made a sack.",
      "In a game, rush with intent. Disrupt the backfield. Finish the sack with your coached shoulder contact, wrap him up, and finish. Make him hurry his reads and throws.",
      "Know when to stop. No late shot after the throw, no helmet-led hit, and no contact after a slide, out of bounds, or the whistle.",
    ],
  },
  {
    id: "coverage-basics",
    topic: "Coverage basics",
    title: "Man, zone, and counting receivers",
    body: [
      "In man, start with your receiver and match his release. Count eligible receivers from the sideline inward: No. 1 is widest, No. 2 is next inside. “I’ve got No. 2” means the second receiver on your side.",
      "In zone, you cover an area, not one man. Get depth or width to your spot, read the receivers’ releases, and break on the throw. Don’t chase one receiver and leave your zone open.",
      "A scrambling QB can still throw. Man and zone defenders keep coverage until their rules trigger run support—then close under control.",
    ],
    tryScenario: { call: "Man", side: "left", formation: "trips", outcome: "pass" },
    tryLabel: "Match No. 2 in man",
  },
  {
    id: "zones",
    topic: "Coverage basics",
    title: "Flat, curl, and seam",
    body: [
      "Flat: the short outside area. Curl: the underneath area just inside the flat. Seam: the vertical route space between coverage areas.",
      "On a curl/flat assignment, settle at depth, keep your eyes on the two-receiver combination, and break on the throw. If a receiver goes vertical, follow your coverage’s rules instead of ignoring him.",
    ],
    tryScenario: { call: "Zone", side: "left", formation: "twins", outcome: "pass" },
    tryLabel: "Drop to curl/flat",
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
