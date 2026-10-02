import type { CallId, FormationId, OutcomeId } from "../types";

/**
 * The expected play for a call + formation, used as the default outcome so a
 * new combination opens on its most likely rep (the athlete can still toggle).
 */
export function defaultOutcome(call: CallId, formation: FormationId): OutcomeId {
  if (formation === "empty") return "pass"; // no back — a drop-back look
  const runFormation = formation === "i" || formation === "offset-i" || formation === "double";
  if (call === "Power") return "run"; // run-support call
  if (runFormation) return "run"; // heavy run personnel
  return "pass"; // Blitz / Zone / Man out of neutral or spread looks
}

export interface CallMeta {
  id: CallId;
  /** One-line summary of what the call illustrates. */
  summary: string;
  task: string;
  role: string;
  response: string;
  move: string;
  mistake: string;
  advanced: string;
}

// All text preserved verbatim from the baseline guide (tasks / roles /
// responses / callGuide). These are representative assignments, not complete
// coverage installations.
export const CALLS: Record<CallId, CallMeta> = {
  Power: {
    id: "Power",
    summary: "Run-support interpretation discussed while building the guide (not a verified team call).",
    task: "Close toward the line, control your edge, and turn the runner back inside. Keep your eyes ready for a pass.",
    role: "You are the force player here. Your job is to stop the runner from escaping outside. The end pushes the run toward you; you turn it back toward your help. Don’t chase yourself out of position.",
    response:
      "Run: close under control, handle the blocker, and keep the runner inside. Pass: recognize the release and get to the coverage assigned with the call. Power is not permission to ignore a pass.",
    move: "Read the block, close under control, and protect your outside edge. Make the runner turn toward help.",
    mistake:
      "Charging inside can leave an open path around you. A handoff fake can also pull you away from your pass job.",
    advanced:
      "Force is not the same as spill. Against a kick-out block, use the technique your coaches teach. Your end’s fit and the coverage determine where your help comes from.",
  },
  Blitz: {
    id: "Blitz",
    summary: "Illustrates an outside safety rush with the end inside.",
    task: "Attack your outside rush lane. Stay ready for a handoff or a quarterback trying to escape.",
    role: "You rush outside while the end attacks inside. Take your lane and close on the quarterback under control. If the ball is handed off, play the run in your assigned lane. Follow any call that changes your rush into coverage.",
    response:
      "Run: find the ball and protect your assigned lane. Pass: rush through your lane. If your call tells you to cover a releasing back, take him instead of continuing the rush.",
    move: "Take your assigned outside rush lane. Find the ball and close under control.",
    mistake:
      "Running straight at the QB can let a back or keeper escape outside. Do not freelance into a teammate’s lane.",
    advanced:
      "This is an outside safety rush with the end inside. Any peel instruction can send you with a releasing back. Pressure coverage must replace your usual area.",
  },
  Zone: {
    id: "Zone",
    summary: "Illustrates a curl/flat assignment.",
    task: "Cover your underneath outside area. Read the receivers and break on the throw.",
    role: "You cover the curl/flat: the short outside passing area. Watch how the nearby receivers release. Follow the call’s route rules; don’t chase one receiver and leave your area open.",
    response:
      "Run: react to your run key and fit your assigned spot. Pass: get to your area, read the routes, and break on the ball. Don’t let a fake run pull you away from your coverage.",
    move: "Work to your curl/flat area, read the releases, and use your call’s run/pass rules.",
    mistake:
      "Following every receiver everywhere can leave your zone empty. Charging on the first run-looking movement can open a pass behind you.",
    advanced:
      "Zone can include match rules that tell you to carry a route. Do not treat the shaded area as permission to ignore a vertical receiver; follow the coverage rules.",
  },
  Man: {
    id: "Man",
    summary: "Illustrates a No. 2 matchup.",
    task: "Cover No. 2 on your side. Stay with your receiver through the route.",
    role: "You cover No. 2: the second receiver counting from the sideline toward the ball. Match his release and stay with him. Use the leverage your coaches teach.",
    response:
      "Run: read your receiver’s block and follow your run-support rule. Pass: stay with your receiver. Be ready for him to fake a block and then release.",
    move: "Find No. 2 on your side and match his release using your taught leverage.",
    mistake:
      "Looking into the backfield too soon can lose your receiver. A block-and-release can look like run before it becomes a route.",
    advanced:
      "Motion and crossing routes can trigger switches or other checks. Do not assume you always follow motion across the field. Your call supplies the rule.",
  },
};

export const CALL_ORDER: CallId[] = ["Power", "Blitz", "Zone", "Man"];

// Per-outcome / per-call notes, preserved verbatim from the baseline.
export const OUTCOME_NOTES: Record<Exclude<OutcomeId, "read">, Record<CallId, string>> = {
  run: {
    Power:
      "Read the block, close downhill, and keep the runner inside your edge. Take on the blocker with the leverage your coaches teach.",
    Blitz:
      "A blitz can meet a handoff. Stay in your assigned rush/run lane and find the ball; don’t run past it chasing the quarterback.",
    Zone: "Once your run key confirms the run, leave your pass drop and fit your assigned edge. Don’t charge forward just because the back moves.",
    Man: "Read your receiver. If he blocks, follow your run-support rule. Stay alert: he can fake a block and release.",
  },
  pass: {
    Power:
      "Recognize the receiver’s release and get to your pass assignment. This view pairs Power with curl/flat coverage. Your actual paired coverage determines where you go.",
    Blitz:
      "Keep your outside rush lane and pressure the quarterback. Follow a peel or coverage instruction if your call includes one.",
    Zone: "Get to your curl/flat area and read the routes. Use your coverage rules if a receiver goes vertical.",
    Man: "Match No. 2’s release and stay with him. Use your taught leverage; don’t abandon him to chase the quarterback.",
  },
  qb: {
    Power:
      "If the QB keeps it toward you, protect your edge and close under control. If he goes inside, stay connected to your fit and pursue with your teammates.",
    Blitz:
      "The QB can keep the ball or escape the pocket. Stay in your outside lane and close under control so he cannot easily run around you.",
    Zone: "A scrambling QB can still throw. Keep coverage until your rules tell you to attack a committed runner. Then close under control; this diagram shows that run response.",
    Man: "A scrambling QB can still throw to your receiver. Stay in coverage until your rules trigger run support. This diagram keeps you with No. 2 until that read.",
  },
};

export const OUTCOME_GUIDE: Record<OutcomeId, string> = {
  read: "Before the snap, identify your key and help. Your first steps come from the call and what that key does.",
  run: "A confirmed run triggers your assigned fit. The example attacks your edge; an inside run or a run away from you can require a different pursuit angle.",
  pass: "A receiver releasing into a route is a clue. Power’s pass picture here uses curl/flat coverage; use your actual paired coverage if it differs.",
  qb: "A QB outside the pocket can still throw. Zone and man defenders keep coverage until their rules trigger run support. A committed runner and a scrambling passer are different reads.",
};

export const OUTCOME_LABELS: Record<OutcomeId, string> = {
  read: "At the snap",
  run: "Run",
  pass: "Pass",
  qb: "QB run",
};

export const OUTCOME_ORDER: OutcomeId[] = ["read", "run", "pass", "qb"];
