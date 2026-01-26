import { Vector3D } from "../../engine/Vector3D";
import { WireframeModel, createEdges } from "../../engine/WireframeModel";
import { COLORS } from "../colors";

/**
 * Shield pickup - hexagonal shield shape with plus sign (cyan)
 * Matches the design: wider at top, tapers to point at bottom
 */
export const SHIELD_PICKUP: WireframeModel = {
  vertices: [
    // Shield outline - six-sided polygon
    new Vector3D(-20, 40, 0), // 0: top left
    new Vector3D(20, 40, 0), // 1: top right (horizontal top edge)
    new Vector3D(25, 25, 0), // 2: upper right (angles down and out)
    new Vector3D(22, 10, 0), // 3: mid right (angles down and in)
    new Vector3D(0, 0, 0), // 4: bottom point (converges to center)
    new Vector3D(-22, 10, 0), // 5: mid left (angles down and in)
    new Vector3D(-25, 25, 0), // 6: upper left (angles down and out)
    // Inner plus sign - centered
    new Vector3D(0, 30, 0), // 7: plus top
    new Vector3D(0, 10, 0), // 8: plus bottom
    new Vector3D(-10, 20, 0), // 9: plus left
    new Vector3D(10, 20, 0), // 10: plus right
  ],
  edges: createEdges([
    // Outer shield outline
    [0, 1], // Top horizontal edge
    [1, 2], // Top-right angles down and out
    [2, 3], // Right side angles down and in
    [3, 4], // Right side to bottom point
    [4, 5], // Left side from bottom point
    [5, 6], // Left side angles down and in
    [6, 0], // Upper left angles down and out, back to top
    // Inner plus sign (centered)
    [7, 8], // Vertical bar
    [9, 10], // Horizontal bar
  ]),
  color: COLORS.pickup_armor,
};
