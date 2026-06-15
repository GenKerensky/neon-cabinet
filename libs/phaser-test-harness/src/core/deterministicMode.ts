import type { DeterministicModeOptions } from "./types";

export class DeterministicMode {
  private _seed: number;
  private _isDeterministic: boolean;
  private paramName: string;
  private testParamName: string;

  constructor(options: DeterministicModeOptions = {}) {
    this.paramName = options.paramName ?? "seed";
    this.testParamName = options.testParamName ?? "test";

    const params = new URLSearchParams(window.location.search);
    const isTest = params.get(this.testParamName) === "1";
    const seedParam = params.get(this.paramName);

    if (isTest && seedParam !== null) {
      this._seed = parseInt(seedParam, 10);
      this._isDeterministic = true;
    } else if (isTest) {
      this._seed = 42;
      this._isDeterministic = true;
    } else {
      this._seed = 0;
      this._isDeterministic = false;
    }
  }

  seedRng(): void {
    if (this._isDeterministic) {
      const phaser = (window as unknown as Record<string, unknown>).Phaser as
        | { Math?: { RND?: { sow: (seeds: number[]) => void } } }
        | undefined;
      phaser?.Math?.RND?.sow([this._seed]);
    }
  }

  get seed(): number {
    return this._seed;
  }

  get isDeterministic(): boolean {
    return this._isDeterministic;
  }

  static getSeedDisplayText(seed: number): string {
    return `seed: ${seed}`;
  }
}
