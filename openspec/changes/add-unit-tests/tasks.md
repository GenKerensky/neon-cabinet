## 1. Pathfinder Tests

- [x] 1.1 Create `tests/utils/Pathfinder.spec.ts` with open corridor path test
- [x] 1.2 Add wall routing test — path goes around obstacles
- [x] 1.3 Add unreachable target test — returns null
- [x] 1.4 Add iteration limit test — returns null when exceeded
- [x] 1.5 Add start-equals-end test — returns single-node path
- [x] 1.6 Add custom heuristic test — BFS-style zero heuristic works
- [x] 1.7 Add static maxDistance test — returns negative Manhattan distance

## 2. EventBus Tests

- [x] 2.1 Create `tests/EventBus.spec.ts` with emit+receive test
- [x] 2.2 Add listener removal test — callback not called after off

## 3. Settings and Font Utils Tests

- [x] 3.1 Create `tests/utils/settings.spec.ts` with getVectorMode default test
- [x] 3.2 Add setVectorMode/getVectorMode round-trip test
- [x] 3.3 Add isColorMode true/false tests
- [x] 3.4 Add font.spec.ts with default value and custom value tests

## 4. Enemy AI Subclass Tests

- [x] 4.1 Add Chaser tests to `tests/objects/Enemy.spec.ts` — CHASE, SCATTER, FRIGHTENED state targeting
- [x] 4.2 Add Ambusher tests — forward prediction, grid clamping, SCATTER/FRIGHTENED
- [x] 4.3 Add Timid tests — chase within threshold, flee beyond threshold, SCATTER/FRIGHTENED
- [x] 4.4 Add Wanderer tests — pincer calculation, grid clamping, chaser position setter, SCATTER/FRIGHTENED

## 5. CollectibleManager Tests

- [x] 5.1 Create `tests/objects/Collectible.spec.ts` with DOT creation on all passage cells
- [x] 5.2 Add POWER_PELLET at corners test
- [x] 5.3 Add spawn area exclusion test
- [x] 5.4 Add removeCollectible counter tests (DOT increments, BONUS_ITEM does not)
- [x] 5.5 Add isLevelComplete true/false tests
- [x] 5.6 Add shouldSpawnBonus level gating and threshold tests
- [x] 5.7 Add createBonusItem placement and level gating tests
