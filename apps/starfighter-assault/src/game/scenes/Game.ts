import Phaser, { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { projectThreatsToRadar } from "../hud/RadarProjection";
import { CockpitHud, type CockpitHudStatus } from "../objects/CockpitHud";
import { RailPlayer } from "../objects/RailPlayer";
import {
  createThreatWave,
  getAliveThreats,
  type Threat,
} from "../objects/Threats";
import { generateSortie } from "../rail/RouteGenerator";
import type { GeneratedSortie, ThreatKind } from "../rail/SegmentTypes";
import {
  createBountyState,
  awardBounty,
  type BountyState,
  type BountyTargetKind,
} from "../simulation/Bounties";
import {
  applyDamageToLeadThreat,
  getCombatThreatKinds,
  resolveClearedEncounter,
  type DestroyedThreat,
} from "../simulation/EncounterFlow";
import {
  createInitialRunState,
  getCurrentPhase,
  type FinaleStage,
  type RunState,
} from "../simulation/RunState";
import {
  createWeaponsState,
  fireLaser,
  fireTorpedo,
  type WeaponsState,
} from "../simulation/Weapons";

interface GameSceneData {
  runState?: RunState;
  sortie?: GeneratedSortie;
  bountyState?: BountyState;
  weapons?: WeaponsState;
}

export class Game extends Scene {
  private cockpitHud!: CockpitHud;
  private player!: RailPlayer;
  private weapons!: WeaponsState;
  private runState!: RunState;
  private sortie!: GeneratedSortie;
  private bountyState!: BountyState;
  private threats: Threat[] = [];

  constructor() {
    super("Game");
  }

  create(data: GameSceneData = {}): void {
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.runState = data.runState ?? createInitialRunState(Date.now());
    this.sortie =
      data.sortie ??
      generateSortie({ seed: this.runState.seed, difficulty: 1 });
    this.bountyState = data.bountyState ?? createBountyState();
    this.weapons = data.weapons ?? createWeaponsState();
    this.player = this.createPlayerForCurrentEncounter();
    this.threats = this.createCurrentThreatWave();

    this.cockpitHud = new CockpitHud(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cockpitHud.destroy();
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const { width, height } = this.cameras.main;
      this.player.setPointerTarget(pointer.x - width / 2, pointer.y - height / 2);
    });

    this.input.on("pointerdown", () => {
      this.fireLaserAtPlayerTarget();
    });

    this.input.keyboard?.on("keydown-SPACE", () => {
      this.fireLaserAtPlayerTarget();
    });

    this.input.keyboard?.on("keydown-SHIFT", () => {
      const result = fireTorpedo(this.weapons);
      this.weapons = result.state;
      if (result.fired) {
        this.applyDamage(result.damage);
      }
    });

    EventBus.emit("current-scene-ready", this);
  }

  update(_time: number, delta: number): void {
    this.player.update(delta / 1000);

    const { width, height } = this.cameras.main;
    const aliveThreats = getAliveThreats(this.threats);
    const dots = projectThreatsToRadar(
      aliveThreats.map(({ id, x, y, z, threat }) => ({
        id,
        x,
        y,
        z,
        threat,
      })),
    );

    this.cockpitHud.render(
      width,
      height,
      dots,
      this.player.position,
      this.createHudStatus(aliveThreats.length),
      aliveThreats,
    );
  }

  private fireLaserAtPlayerTarget(): void {
    const result = fireLaser(this.weapons, this.player.target);
    this.weapons = result.state;
    this.applyDamage(
      result.shots.reduce((totalDamage, shot) => totalDamage + shot.damage, 0),
    );
  }

  private applyDamage(damage: number): void {
    const result = applyDamageToLeadThreat(this.threats, damage);
    this.threats = result.threats;
    this.awardDestroyedThreats(result.destroyed);

    if (getAliveThreats(this.threats).length === 0) {
      this.resolveClearedEncounter();
    }
  }

  private awardDestroyedThreats(destroyedThreats: DestroyedThreat[]): void {
    for (const destroyedThreat of destroyedThreats) {
      const bountyKind = getBountyTargetKind(destroyedThreat.kind);
      if (bountyKind === null) continue;

      const result = awardBounty(this.bountyState, bountyKind, this.time.now);
      this.bountyState = result.state;
      this.runState = {
        ...this.runState,
        bounties: this.bountyState.total,
      };
    }
  }

  private resolveClearedEncounter(): void {
    const result = resolveClearedEncounter(this.runState);
    this.runState = result.runState;

    if (result.nextScene === "upgrade-shop") {
      this.scene.start("UpgradeShop", {
        runState: this.runState,
        sortie: this.sortie,
        bountyState: this.bountyState,
        weapons: this.weapons,
      });
      return;
    }

    if (result.nextScene === "victory" || result.nextScene === "game-over") {
      this.scene.start("GameOver", {
        status: this.runState.status,
        bounties: this.runState.bounties,
      });
      return;
    }

    this.player = this.createPlayerForCurrentEncounter();
    this.threats = this.createCurrentThreatWave();
  }

  private createPlayerForCurrentEncounter(): RailPlayer {
    if (getCurrentPhase(this.runState) === "finale") {
      return new RailPlayer({ width: 520, height: 320 });
    }

    const segment = this.sortie.segments[this.runState.currentSegmentIndex];
    return new RailPlayer(
      segment === undefined
        ? { width: 620, height: 380 }
        : {
            width: segment.constraints.flightBoxWidth,
            height: segment.constraints.flightBoxHeight,
          },
    );
  }

  private createCurrentThreatWave(): Threat[] {
    if (getCurrentPhase(this.runState) === "finale") {
      return createThreatWave(getFinaleThreats(this.runState.finale.stage), 3);
    }

    const segment = this.sortie.segments[this.runState.currentSegmentIndex];
    return createThreatWave(
      getCombatThreatKinds(segment?.allowedThreats ?? ["fighter"]),
      1,
    );
  }

  private createHudStatus(contacts: number): CockpitHudStatus {
    const phase = getCurrentPhase(this.runState);
    return {
      label:
        phase === "finale"
          ? `CAPITAL ${formatFinaleStage(this.runState.finale.stage)}`
          : `SEG ${this.runState.currentSegmentIndex + 1}`,
      contacts,
      bounties: this.runState.bounties,
      torpedoes: this.weapons.torpedoes,
      isFinale: phase === "finale",
    };
  }
}

function getFinaleThreats(stage: FinaleStage): ThreatKind[] {
  switch (stage) {
    case "approach":
      return ["fighter", "turret"];
    case "surface-skim":
      return ["gun-emplacement", "turret"];
    case "weak-point-pass":
      return ["shield-node", "gun-emplacement"];
    case "escape":
      return ["elite-fighter", "fighter"];
    case "complete":
      return [];
  }
}

function getBountyTargetKind(kind: ThreatKind): BountyTargetKind | null {
  switch (kind) {
    case "fighter":
    case "elite-fighter":
    case "turret":
    case "gun-emplacement":
    case "shield-node":
      return kind;
    case "mine":
    case "debris":
      return null;
  }
}

function formatFinaleStage(stage: FinaleStage): string {
  return stage
    .split("-")
    .map((part) => part.toUpperCase())
    .join(" ");
}
