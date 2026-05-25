/* eslint-disable @typescript-eslint/no-empty-function */
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
    },
    physics: {
      add: { existing: () => {} },
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
    tweens: {
      add: () => ({ stop: () => {} }),
    },
  };

  return mockScene;
}
