interface MockSceneAdd {
  existing: () => {
    setCircle: () => void;
    setOffset: () => void;
    setMass: () => void;
    setBounce: () => void;
    setDrag: () => void;
    setFriction: () => void;
    setSize: () => void;
  };
  container: (x?: number, y?: number) => MockContainer;
  graphics: () => MockGraphics;
  sprite: (x?: number, y?: number) => MockGameObject;
}

class MockGameObject {
  scene: MockScene;
  x = 0;
  y = 0;
  rotation = 0;
  active = true;
  alpha = 1;
  scale = 1;
  visible = true;
  depth = 0;
  parent: MockContainer | null = null;
  texture = { key: "test" };
  anims = {
    play: () => ({}),
    isPlaying: false,
    pause: () => ({}),
    resume: () => ({}),
  };
  directionBendX = 0;

  constructor(scene: MockScene, x: number, y: number, _texture?: string) {
    this.scene = scene;
    this.x = x;
    this.y = y;
  }

  update(_time = 0, _delta = 0): void {
    return;
  }

  setTexture(): void {
    return;
  }

  setAlpha(v: number) {
    this.alpha = v;
  }

  setScale(v: number) {
    this.scale = v;
  }

  setVisible(v: boolean) {
    this.visible = v;
  }

  setDepth(v: number) {
    this.depth = v;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  clearTint(): void {
    return;
  }

  setTint(): void {
    return;
  }

  play(): void {
    return;
  }

  stop(): void {
    return;
  }

  on(): void {
    return;
  }

  destroy() {
    this.active = false;
  }
}

class MockContainer extends MockGameObject {
  list: MockGameObject[] = [];

  add(child: MockGameObject | MockGameObject[]) {
    if (Array.isArray(child))
      child.forEach((c) => {
        if (c) c.parent = this;
        this.list.push(c);
      });
    else {
      if (child) child.parent = this;
      this.list.push(child);
    }
  }

  remove(child: MockGameObject) {
    const idx = this.list.indexOf(child);
    if (idx !== -1) this.list.splice(idx, 1);
  }

  override setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }
  getWorldTransformMatrix() {
    return {
      transformPoint: (
        x: number,
        y: number,
        point: { x: number; y: number },
      ) => {
        const px = this.parent ? this.parent.x : 0;
        const py = this.parent ? this.parent.y : 0;
        point.x = px + this.x + x;
        point.y = py + this.y + y;
      },
    };
  }
}

class MockGraphics extends MockGameObject {
  lineStyle() {
    return this;
  }
  fillStyle() {
    return this;
  }
  beginPath() {
    return this;
  }
  moveTo() {
    return this;
  }
  lineTo() {
    return this;
  }
  fillPath() {
    return this;
  }
  strokePath() {
    return this;
  }
  strokeCircle() {
    return this;
  }
  fillCircle() {
    return this;
  }
  strokeRoundedRect() {
    return this;
  }
  fillRoundedRect() {
    return this;
  }
  fillRect() {
    return this;
  }
  strokeRect() {
    return this;
  }
  closePath() {
    return this;
  }
  clear() {
    return this;
  }
  arc() {
    return this;
  }
  ellipse() {
    return this;
  }
}

class MockScene {
  tweenConfigs: Record<string, unknown>[] = [];
  private _add: MockSceneAdd | undefined;
  private _physics = { add: { existing: () => ({}), overlap: () => ({}) } };
  private _tweens = {
    add: (config: Record<string, unknown>) => {
      this.tweenConfigs.push(config);
      const tweenConfig = config as {
        targets?: MockGameObject | MockGameObject[];
        x?: number;
        y?: number;
        rotation?: number;
        directionBendX?: number;
      };
      const targets = (
        Array.isArray(tweenConfig.targets)
          ? tweenConfig.targets
          : [tweenConfig.targets]
      ).filter((target): target is MockGameObject => target !== undefined);
      targets.forEach((target: MockGameObject) => {
        if (tweenConfig.x !== undefined) target.x = tweenConfig.x;
        if (tweenConfig.y !== undefined) target.y = tweenConfig.y;
        if (tweenConfig.rotation !== undefined)
          target.rotation = tweenConfig.rotation;
        if (tweenConfig.directionBendX !== undefined)
          target.directionBendX = tweenConfig.directionBendX;
      });
      return {};
    },
  };

  get add(): MockSceneAdd {
    if (!this._add) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      this._add = {
        existing: () => ({
          setCircle: (): void => {
            return;
          },
          setOffset: (): void => {
            return;
          },
          setMass: (): void => {
            return;
          },
          setBounce: (): void => {
            return;
          },
          setDrag: (): void => {
            return;
          },
          setFriction: (): void => {
            return;
          },
          setSize: (): void => {
            return;
          },
        }),
        container: function (x = 0, y = 0) {
          return new MockContainer(self, x, y);
        },
        graphics: function () {
          return new MockGraphics(self, 0, 0);
        },
        sprite: function (x = 0, y = 0) {
          return new MockGameObject(self, x, y);
        },
      };
    }

    return this._add;
  }

  get physics() {
    return this._physics;
  }

  get tweens() {
    return this._tweens;
  }
}

export const GameObjects = {
  Sprite: MockGameObject,
  Container: MockContainer,
  Graphics: MockGraphics,
};

export const Scene = MockScene;

export const Math = {
  Vector2: class MockVector2 {
    constructor(
      public x = 0,
      public y = 0,
    ) {}
  },
};

export const Display = {
  Color: {
    HexStringToColor: (hex: string) => ({
      color: parseInt(hex.replace("#", ""), 16) || 0,
    }),
  },
};

export const Physics = {
  Arcade: {
    Body: class {},
  },
};

export { MockScene };
