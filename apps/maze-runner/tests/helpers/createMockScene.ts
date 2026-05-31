/* eslint-disable @typescript-eslint/no-empty-function */
import { vi } from "vitest";

export function createMockScene(): any {
  const mockTexture = {
    key: "test",
    get: () => ({ width: 16, height: 16 }),
    frames: new Map(),
    getFrameNames: () => [],
  };

  const mockScene = {
    add: {
      existing: () => {},
      displayList: { add: () => {} },
      container: (x = 0, y = 0) => {
        const list: any[] = [];
        return {
          x,
          y,
          update() {},
          setPosition(newX: number, newY: number) {
            this.x = newX;
            this.y = newY;
            return this;
          },
          add(child: any) {
            if (Array.isArray(child)) {
              list.push(...child);
            } else {
              list.push(child);
            }
          },
          remove(child: any) {
            const idx = list.indexOf(child);
            if (idx !== -1) list.splice(idx, 1);
          },
          getWorldTransformMatrix: () => {
            return {
              transformPoint: (x: number, y: number, point: any) => {
                point.x = x;
                point.y = y;
              },
            };
          },
        };
      },
      graphics: () => ({
        update() {},
        lineStyle: () => ({}),
        fillStyle: () => ({}),
        beginPath: () => ({}),
        moveTo: () => ({}),
        lineTo: () => ({}),
        fillPath: () => ({}),
        strokePath: () => ({}),
        strokeCircle: () => ({}),
        fillCircle: () => ({}),
        strokeRect: () => ({}),
        fillRect: () => ({}),
        clear: () => ({}),
        closePath: () => ({}),
        arc: () => ({}),
        lineBetween: () => ({}),
        once: () => ({}),
        on: () => ({}),
        emit: () => ({}),
        off: () => ({}),
        x: 0,
        y: 0,
        destroy: () => {},
        removeFromDisplayList: () => ({}),
        addedToScene: () => ({}),
        setDepth: () => ({}),
      }),
    },
    physics: {
      add: {
        existing: vi.fn((target: any) => {
          target.body = { enabled: true, immovable: true };
        }),
      },
    },
    sys: {
      displayList: { add: () => {} },
      updateList: { add: () => {} },
      textures: {
        get: () => mockTexture,
        addCanvas: () => {},
        exists: () => true,
      },
      queueDepthSort: () => {},
      events: { on: () => {}, emit: () => {} },
    },
    textures: {
      get: () => mockTexture,
      addCanvas: () => {},
      exists: () => true,
    },
    input: {
      keyboard: {
        addKey: () => ({ on: () => {} }),
        on: () => {},
      },
    },
    cameras: {
      main: { setPostPipeline: () => {} },
    },
    children: { add: () => {} },
    make: {
      renderTexture: () => ({
        fill: () => {},
        draw: () => {},
        erase: () => {},
        destroy: () => {},
      }),
    },
    renderer: { type: 0 },
    cache: {
      text: {
        get: (key: string) => {
          if (key === "player_svg") {
            return `<svg viewBox="0 0 32 32">
              <circle id="body" cx="16" cy="16" r="14" fill="#ffff00" data-anim-chomp='{"frequency": 10, "amplitude": 45}' />
              <circle id="eye_l" cx="10" cy="12" r="2" fill="#000000" data-pivot="[10,12]" data-slide-range="2" />
              <circle id="eye_r" cx="22" cy="12" r="2" fill="#000000" data-pivot="[22,12]" data-slide-range="2" />
            </svg>`;
          }
          if (
            key === "ghost_svg" ||
            (typeof key === "string" &&
              key.startsWith("ghost_") &&
              key.endsWith("_svg"))
          ) {
            return `<svg viewBox="0 0 32 32">
              <path id="body" d="M4,16 A12,12 0 1,1 28,16 L28,28 L4,28 Z" fill="#ff0000" data-anim-wave='{"frequency": 10, "amplitude": 2, "points": 10}' />
              <circle id="eye_l" cx="11" cy="14" r="3" fill="#ffffff" data-pivot="[11,14]" data-slide-range="2" />
              <circle id="eye_r" cx="21" cy="14" r="3" fill="#ffffff" data-pivot="[21,14]" data-slide-range="2" />
              <circle id="pupil_l" cx="11" cy="14" r="1.5" fill="#000000" data-pivot="[11,14]" data-slide-range="2" />
              <circle id="pupil_r" cx="21" cy="14" r="1.5" fill="#000000" data-pivot="[21,14]" data-slide-range="2" />
            </svg>`;
          }
          return "";
        },
      },
    },
    tweens: {
      add: () => ({ stop: () => {} }),
    },
  };

  return mockScene;
}
