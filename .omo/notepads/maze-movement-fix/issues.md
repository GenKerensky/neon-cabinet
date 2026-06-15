# Issues and Gotchas for maze-movement-fix

**Known Issues from Oracle Iterations:**

- Multiple rounds of fixes needed for:
  - Code fence closure
  - Commit strategy consistency (individual vs grouped)
  - Must NOT Have count alignment (7 bullets)
  - Package manager consistency (always use `bun nx` or `bunx`)
  - Task 6 dependency on Task 5 (both edit Player.ts)
  - Scope clarity for allowed files (player.steps.ts for QA only)

**Current Gotchas:**

- Player.update clamp logic MUST run before any snap logic
- Task 6 must use dynamic canMove probing - no hardcoded directions like RIGHT(4)/DOWN(2)
- All QA scenarios must be self-discovering via canMove() calls
- Task 4 can edit start helper but NOT core test infrastructure or Game.ts
- Pre-commit commands must use `bun nx run maze-runner:lint` and `bun nx run maze-runner:test`
- Final verification must use exact commands from Success Criteria section

**Open Questions Resolved:**

- How to handle spawn center: Use hasLeftCurrentCenter immediately after spawn
- How to handle rapid turns at intersection: Use isAtIntersection + dynamic perpendicular legal directions
- Test timing: stepSync(60) for normal movement, stepSync(30) for spawn/rapid turns

Updated: 2026-05-31
