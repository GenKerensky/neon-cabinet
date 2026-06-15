import { MazeGenerator, CellType } from "./src/game/utils/MazeGenerator.ts";

const gen = new MazeGenerator(1);
const grid = gen.create();
const cx = Math.floor(gen.getWidth() / 2);
const cy = Math.floor(gen.getHeight() / 2);

console.log("Grid dimensions:", gen.getWidth(), "x", gen.getHeight());
console.log("Center:", cx, cy);
console.log("Cell at [cy][cx-2]:", grid[cy][cx - 2]);
console.log("Cell type:", grid[cy][cx - 2].type);
console.log("Cell type value:", grid[cy][cx - 2].type.valueOf());
console.log("CellType.WALL:", CellType.WALL);
console.log("Are they equal?", grid[cy][cx - 2].type === CellType.WALL);

// Let's also check what the actual numeric value is
console.log("Cell type as number:", Number(grid[cy][cx - 2].type));
console.log("CellType.WALL as number:", Number(CellType.WALL));

// Check surrounding cells
console.log("\nSurrounding cells:");
console.log("[cy-1][cx-2]:", grid[cy - 1][cx - 2].type);
console.log("[cy][cx-1]:", grid[cy][cx - 1].type);
console.log("[cy][cx]:", grid[cy][cx].type);
console.log("[cy][cx+1]:", grid[cy][cx + 1].type);
console.log("[cy+1][cx-2]:", grid[cy + 1][cx - 2].type);
