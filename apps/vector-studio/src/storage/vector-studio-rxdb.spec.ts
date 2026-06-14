import "fake-indexeddb/auto";
import {
  getVectorStudioRxState,
  readPersistedVectorDraft,
  resetVectorStudioDatabaseForTests,
  vectorDraftStatePath,
  writePersistedVectorDraft,
} from "./vector-studio-rxdb";

describe("Vector Studio RxDB storage", () => {
  beforeEach(async () => {
    (
      globalThis as { __VECTOR_STUDIO_RXDB_NAME__?: string }
    ).__VECTOR_STUDIO_RXDB_NAME__ =
      `neon_vector_studio_test_${crypto.randomUUID()}`;
    await resetVectorStudioDatabaseForTests();
  });

  afterEach(async () => {
    await resetVectorStudioDatabaseForTests();
    delete (globalThis as { __VECTOR_STUDIO_RXDB_NAME__?: string })
      .__VECTOR_STUDIO_RXDB_NAME__;
  });

  it("persists drafts independently by game and asset", async () => {
    const state = await getVectorStudioRxState();
    const shipDraft = {
      appliedSvgSource: '<svg id="ship"/>',
      assetId: "space-defender-vector-ship",
      gameId: "space-defender",
      selectedElementId: "ship",
      svgSource: '<svg id="ship" data-draft="yes"/>',
      updatedAt: 123,
    };
    const landerDraft = {
      assetId: "mars-lander-vector-lander",
      gameId: "mars-lander",
      selectedElementId: "",
      svgSource: '<svg id="lander"/>',
      updatedAt: 456,
    };

    await writePersistedVectorDraft(shipDraft);
    await writePersistedVectorDraft(landerDraft);

    expect(
      readPersistedVectorDraft(
        state,
        "space-defender",
        "space-defender-vector-ship",
      ),
    ).toEqual(shipDraft);
    expect(
      readPersistedVectorDraft(
        state,
        "mars-lander",
        "mars-lander-vector-lander",
      ),
    ).toEqual(landerDraft);
    expect(
      readPersistedVectorDraft(state, "space-defender", "missing"),
    ).toBeUndefined();
    expect(
      state.get(
        vectorDraftStatePath("space-defender", "space-defender-vector-ship"),
      ),
    ).toEqual(shipDraft);
  });

  it("keeps drafts available after closing and reopening the local database", async () => {
    const draft = {
      assetId: "maze-runner-vector-player",
      gameId: "maze-runner",
      selectedElementId: "player_body",
      svgSource: '<svg id="player"/>',
      updatedAt: 789,
    };

    await writePersistedVectorDraft(draft);
    await resetVectorStudioDatabaseForTests({ remove: false });

    const state = await getVectorStudioRxState();
    expect(
      readPersistedVectorDraft(
        state,
        "maze-runner",
        "maze-runner-vector-player",
      ),
    ).toEqual(draft);
  });
});
