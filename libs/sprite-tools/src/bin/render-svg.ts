import sharp from "sharp";
import fs from "fs";
import { Window } from "happy-dom";
import { SVGParser } from "../lib/svg-parser.js";

declare global {
  var DOMParser: typeof DOMParser;
  var SVGElement: typeof SVGElement;
}

if (typeof globalThis !== "undefined" && !("DOMParser" in globalThis)) {
  const window = new Window();
  (
    globalThis as { DOMParser: typeof DOMParser; SVGElement: typeof SVGElement }
  ).DOMParser = window.DOMParser;
  (
    globalThis as { DOMParser: typeof DOMParser; SVGElement: typeof SVGElement }
  ).SVGElement = window.SVGElement;
}

async function renderSVG(
  inputPath: string,
  outputPath: string,
  showOverlays = true,
) {
  const svgString = fs.readFileSync(inputPath, "utf8");
  const parser = new SVGParser();
  const metadata = parser.parse(svgString);

  let finalSvg = svgString;

  if (showOverlays) {
    const overlays: string[] = [];

    // Draw physics hitboxes
    metadata.layers.forEach((layer) => {
      if (layer.physics) {
        const p = layer.physics;
        if (p.shape === "circle") {
          overlays.push(
            `<circle cx="${layer.cx}" cy="${layer.cy}" r="${p.radius}" fill="rgba(255, 0, 0, 0.3)" stroke="red" stroke-width="1" />`,
          );
        } else {
          overlays.push(
            `<rect x="${layer.x}" y="${layer.y}" width="${p.width}" height="${p.height}" fill="rgba(255, 0, 0, 0.3)" stroke="red" stroke-width="1" />`,
          );
        }
      }
    });

    // Draw sockets
    metadata.sockets.forEach((socket) => {
      overlays.push(`
        <line x1="${socket.x - 5}" y1="${socket.y}" x2="${socket.x + 5}" y2="${socket.y}" stroke="blue" stroke-width="1" />
        <line x1="${socket.x}" y1="${socket.y - 5}" x2="${socket.x}" y2="${socket.y + 5}" stroke="blue" stroke-width="1" />
        <circle cx="${socket.x}" cy="${socket.y}" r="2" fill="blue" />
      `);
    });

    // Inject overlays before closing </svg>
    finalSvg = svgString.replace("</svg>", `${overlays.join("\n")}</svg>`);
  }

  await sharp(Buffer.from(finalSvg)).png().toFile(outputPath);

  console.log(`Rendered asset to ${outputPath}`);
}

const [, , input, output] = process.argv;
if (input && output) {
  renderSVG(input, output).catch(console.error);
} else {
  console.log("Usage: bun run render-svg.ts <input.svg> <output.png>");
}
