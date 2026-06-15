import { describe, expect, it } from "vitest";
import { createThreatWave } from "../objects/Threats";
import {
  createInitialRunState,
  finishSegment,
  type RunState,
} from "./RunState";
import {
  applyDamageToLeadThreat,
  getCombatThreatKinds,
  resolveClearedEncounter,
} from "./EncounterFlow";

describe("EncounterFlow", () => {
  it("keeps durable route debris out of mandatory combat waves", () => {
    expect(getCombatThreatKinds(["debris", "mine", "fighter"])).toEqual([
      "mine",
      "fighter",
    ]);
  });

  it("damages the lead alive threat and reports destroyed bounty targets", () => {
    const [fighter] = createThreatWave(["fighter"], 1);

    const damaged = applyDamageToLeadThreat([fighter], fighter.health);

    expect(damaged.threats[0].health).toBe(0);
    expect(damaged.destroyed).toEqual([
      {
        id: fighter.id,
        bountyValue: fighter.bountyValue,
        kind: "fighter",
      },
    ]);
  });

  it("moves cleared segments through upgrade shops and into the finale", () => {
    const firstClear = resolveClearedEncounter(createInitialRunState(1234));
    const secondClear = resolveClearedEncounter(resume(firstClear.runState));
    const finaleStart = resolveClearedEncounter(resume(secondClear.runState));

    expect(firstClear.nextScene).toBe("upgrade-shop");
    expect(firstClear.runState.currentSegmentIndex).toBe(1);
    expect(secondClear.nextScene).toBe("upgrade-shop");
    expect(finaleStart.nextScene).toBe("continue");
    expect(finaleStart.phase).toBe("finale");
    expect(finaleStart.runState.currentSegmentIndex).toBe(3);
  });

  it("progresses cleared finale encounters until victory", () => {
    const finaleState = finishSegment(
      finishSegment(finishSegment(createInitialRunState(1234))),
    );

    const surface = resolveClearedEncounter(finaleState);
    const weakPoint = resolveClearedEncounter(surface.runState);
    const escape = resolveClearedEncounter(weakPoint.runState);
    const victory = resolveClearedEncounter(escape.runState);

    expect(surface.runState.finale.stage).toBe("surface-skim");
    expect(weakPoint.runState.finale.stage).toBe("weak-point-pass");
    expect(escape.runState.finale.stage).toBe("escape");
    expect(victory.runState.status).toBe("victory");
    expect(victory.nextScene).toBe("victory");
  });
});

function resume(state: RunState): RunState {
  return { ...state, status: "playing" };
}
