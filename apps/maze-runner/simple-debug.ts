import { MazeGenerator, CellType } from "./src/game/utils/MazeGenerator.ts";

// Let's manually check what's happening
const gen = new MazeGenerator(1);
const grid = gen.create();

console.log("Width:", gen.getWidth(), "Height:", gen.getHeight());
const cx = Math.floor(gen.getWidth() / 2);
const cy = Math.floor(gen.getHeight() / 2);
console.log("Center:", cx, cy);

// Check the specific cells the test is failing on
console.log("\nChecking left wall cells:");
console.log(`[${cy}][${cx - 2}]:`, grid[cy][cx - 2].type, "(should be WALL=0)");
console.log(
  `[${cy + 1}][${cx - 2}]:`,
  grid[cy + 1][cx - 2].type,
  "(should be WALL=0)",
);

console.log("\nChecking right wall cells:");
console.log(`[${cy}][${cx + 2}]:`, grid[cy][cx + 2].type, "(should be WALL=0)");
console.log(
  `[${cy + 1}][${cx + 2}]:`,
  grid[cy + 1][cx + 2].type,
  "(should be WALL=0)",
);

console.log("\nChecking surrounding area:");
for (let y = cy - 2; y <= cy + 3; y++) {
  let row = "";
  for (let x = cx - 4; x <= cx + 4; x++) {
    if (y >= 0 && y < gen.getHeight() && x >= 0 && x < gen.getWidth()) {
      row += grid[y][x].type === CellType.WALL ? "#" : ".";
    } else {
      row += " ";
    }
  }
  console.log(`${y}: ${row}`);
}
