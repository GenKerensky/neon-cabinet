import { describe, expect, it } from "vitest";
import { normalizeSvgCanvasOutputForTests } from "./svgcanvas-adapter";

describe("SVGCanvas adapter normalization", () => {
  it("unwraps SVGCanvas layers and maps generated geometry into the asset viewBox", () => {
    const output = normalizeSvgCanvasOutputForTests(`
      <svg viewBox="0 0 30 15" id="svgcontent" overflow="visible" xmlns="http://www.w3.org/2000/svg">
        <g class="layer">
          <title>Layer 1</title>
          <rect id="round-1" x="2" y="6" width="9" height="2" fill="#ffd700"/>
          <rect id="svg_1" x="160" y="240" width="64" height="48" fill="#66ffff"/>
          <circle id="svg_2" cx="320" cy="120" r="32" fill="#66ffff"/>
          <line id="svg_3" x1="64" y1="96" x2="128" y2="144" stroke="#66ffff"/>
        </g>
      </svg>
    `);
    const document = new DOMParser().parseFromString(output, "image/svg+xml");

    expect(output).not.toContain('class="layer"');
    expect(output).not.toContain("<title");
    expect(document.querySelector("#round-1")?.getAttribute("x")).toBe("2");
    expect(document.querySelector("#svg_1")?.getAttribute("x")).toBe("7.5");
    expect(document.querySelector("#svg_1")?.getAttribute("y")).toBe("7.5");
    expect(document.querySelector("#svg_1")?.getAttribute("width")).toBe("3");
    expect(document.querySelector("#svg_1")?.getAttribute("height")).toBe(
      "1.5",
    );
    expect(document.querySelector("#svg_2")?.getAttribute("cx")).toBe("15");
    expect(document.querySelector("#svg_2")?.getAttribute("cy")).toBe("3.75");
    expect(document.querySelector("#svg_3")?.getAttribute("x1")).toBe("3");
    expect(document.querySelector("#svg_3")?.getAttribute("y2")).toBe("4.5");
  });
});
