## REMOVED Requirements

### Requirement: Enemy pathfinding uses A\*

**Reason**: Enemy movement no longer uses A\* pathfinding. The Pathfinder class is retained for offline use (level validation, debug tools), but is not called during gameplay.
**Migration**: No migration needed — the Pathfinder class is still importable if needed.

### Requirement: Pathfinding supports custom heuristics for enemy behaviors

**Reason**: Custom heuristics (maxDistance for Timid, etc.) were used only for enemy pathfinding, which no longer uses A\*. The heuristic parameter is deprecated in the pathfinding API.
**Migration**: If heuristic-based pathfinding is needed in the future, the API can be restored.
