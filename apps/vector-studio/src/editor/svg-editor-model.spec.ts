import {
  createGradientFill,
  createPenPath,
  createPrimitiveShape,
  createSocket,
  listSvgLayers,
  moveSvgPoint,
  parseSvgEditorDocument,
  serializeSvgEditorDocument,
  updateSvgElementAttributes,
  writeUadMetadata,
} from "./svg-editor-model";

const metadataFixture = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 64 64" data-document-flag="keep" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="existing_gradient" data-keep="yes">
      <stop offset="0%" stop-color="#66ffff" data-stop-note="cyan"/>
      <stop offset="100%" stop-color="#ff4fd8"/>
    </linearGradient>
  </defs>
  <g id="body" data-anim-wave="frequency:2 amplitude:5 points:20" data-direction-rotation='{"RIGHT":0,"DOWN":90}' data-material-phosphor-trail="1.5" data-unknown-uad="neon">
    <path id="wing" class="physics-collider accent" data-mass="2" data-custom="stay" d="M 0 0 L 10 0 L 10 8 Z" fill="url(#existing_gradient)" />
  </g>
  <g id="socket_muzzle" transform="translate(42 18)" data-socket-type="projectile" data-custom-socket="stay"/>
</svg>`;

describe("SVG editor model", () => {
  it("round-trips UAD metadata, unknown attributes, defs, gradients, sockets, and colliders", () => {
    const editor = parseSvgEditorDocument(metadataFixture);

    updateSvgElementAttributes(editor, "wing", {
      opacity: "0.75",
      stroke: "#ffffff",
    });
    createGradientFill(editor, {
      id: "nc-gradient-wing",
      stops: [
        { color: "#66ffff", offset: 0 },
        { color: "#ff4fd8", offset: 1 },
      ],
      targetId: "wing",
    });
    createPrimitiveShape(editor, {
      fill: "none",
      height: 12,
      id: "collider_probe",
      kind: "rect",
      stroke: "#ff4fd8",
      width: 18,
      x: 8,
      y: 20,
    });
    writeUadMetadata(editor, "collider_probe", {
      collider: true,
      physics: { height: 12, mass: 2, shape: "rect", width: 18 },
    });
    createSocket(editor, {
      id: "socket_booster",
      type: "thruster",
      x: 20,
      y: 52,
    });

    const roundTripped = new DOMParser().parseFromString(
      serializeSvgEditorDocument(editor),
      "image/svg+xml",
    );

    expect(
      roundTripped.querySelector("svg")?.getAttribute("data-document-flag"),
    ).toBe("keep");
    expect(
      roundTripped
        .querySelector("#existing_gradient")
        ?.getAttribute("data-keep"),
    ).toBe("yes");
    expect(
      roundTripped.querySelector("#wing")?.getAttribute("data-custom"),
    ).toBe("stay");
    expect(roundTripped.querySelector("#wing")?.getAttribute("fill")).toBe(
      "url(#nc-gradient-wing)",
    );
    expect(
      roundTripped.querySelector("#body")?.getAttribute("data-unknown-uad"),
    ).toBe("neon");
    expect(
      roundTripped
        .querySelector("#socket_muzzle")
        ?.getAttribute("data-custom-socket"),
    ).toBe("stay");
    expect(
      roundTripped.querySelector("#socket_booster")?.getAttribute("transform"),
    ).toBe("translate(20 52)");
    expect(
      roundTripped.querySelector("#collider_probe")?.getAttribute("class"),
    ).toContain("physics-collider");
    expect(
      roundTripped.querySelector("#collider_probe")?.getAttribute("data-mass"),
    ).toBe("2");
  });

  it("updates only the selected node when editing attributes", () => {
    const editor = parseSvgEditorDocument(`
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect id="left_eye" x="2" y="4" width="4" height="4" fill="#66ffff"/>
        <rect id="right_eye" x="18" y="4" width="4" height="4" fill="#66ffff"/>
      </svg>
    `);

    updateSvgElementAttributes(editor, "left_eye", {
      fill: "#ff4fd8",
      x: "3",
    });

    const output = new DOMParser().parseFromString(
      serializeSvgEditorDocument(editor),
      "image/svg+xml",
    );
    expect(output.querySelector("#left_eye")?.getAttribute("x")).toBe("3");
    expect(output.querySelector("#left_eye")?.getAttribute("fill")).toBe(
      "#ff4fd8",
    );
    expect(output.querySelector("#right_eye")?.getAttribute("x")).toBe("18");
    expect(output.querySelector("#right_eye")?.getAttribute("fill")).toBe(
      "#66ffff",
    );
  });

  it("supports path creation and direct point editing for polygon-like nodes", () => {
    const editor = parseSvgEditorDocument(`
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <polygon id="fin" points="0,0 12,0 12,10"/>
      </svg>
    `);

    moveSvgPoint(editor, "fin", 1, { x: 16, y: 3 });
    createPenPath(editor, {
      closed: true,
      id: "spark_path",
      points: [
        { x: 4, y: 4 },
        { x: 20, y: 6 },
        { x: 12, y: 18 },
      ],
      stroke: "#66ffff",
    });

    const output = new DOMParser().parseFromString(
      serializeSvgEditorDocument(editor),
      "image/svg+xml",
    );
    expect(output.querySelector("#fin")?.getAttribute("points")).toBe(
      "0,0 16,3 12,10",
    );
    expect(output.querySelector("#spark_path")?.getAttribute("d")).toBe(
      "M 4 4 L 20 6 L 12 18 Z",
    );
  });

  it("serializes UAD inspector controls into parser-compatible attributes", () => {
    const editor = parseSvgEditorDocument(`
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle id="core" cx="16" cy="16" r="8"/>
      </svg>
    `);

    writeUadMetadata(editor, "core", {
      audio: { onPeak: "spark" },
      collider: true,
      directionBend: { amount: 5, pivotY: 16 },
      directionRotation: true,
      material: { chromaticScale: 0.4, phosphorTrail: 1.2 },
      pulse: { amplitude: 0.5, frequency: 3 },
      slideRange: 4,
      wave: { amplitude: 2, frequency: 6, points: 12 },
    });

    const layers = listSvgLayers(editor);
    const output = new DOMParser().parseFromString(
      serializeSvgEditorDocument(editor),
      "image/svg+xml",
    );
    const core = output.querySelector("#core");

    expect(layers.find((layer) => layer.id === "core")).toMatchObject({
      depth: 0,
      tagName: "circle",
    });
    expect(core?.getAttribute("data-anim-wave")).toBe(
      "frequency:6 amplitude:2 points:12",
    );
    expect(core?.getAttribute("data-anim-pulse")).toBe(
      "frequency:3 amplitude:0.5",
    );
    expect(core?.getAttribute("data-slide-range")).toBe("4");
    expect(core?.getAttribute("data-direction-bend")).toBe(
      "amount:5 pivotY:16",
    );
    expect(core?.getAttribute("data-direction-rotation")).toBe("true");
    expect(core?.getAttribute("data-material-phosphor-trail")).toBe("1.2");
    expect(core?.getAttribute("data-material-chromatic-scale")).toBe("0.4");
    expect(core?.getAttribute("data-on-anim-peak")).toBe("spark");
    expect(core?.getAttribute("class")).toContain("physics-collider");
  });

  it("merges inspector-style UAD writes without removing sibling metadata", () => {
    const editor = parseSvgEditorDocument(`
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect id="core" x="8" y="8" width="16" height="16"/>
      </svg>
    `);

    writeUadMetadata(editor, "core", {
      collider: true,
      physics: { height: 16, shape: "rect", width: 16 },
    });
    writeUadMetadata(editor, "core", {
      wave: { amplitude: 2, frequency: 4, points: 12 },
    });
    writeUadMetadata(editor, "core", {
      material: { chromaticScale: 0.35, phosphorTrail: 1.2 },
    });
    writeUadMetadata(editor, "core", {
      audio: { onPeak: "spark" },
    });

    const output = new DOMParser().parseFromString(
      serializeSvgEditorDocument(editor),
      "image/svg+xml",
    );
    const core = output.querySelector("#core");

    expect(core?.getAttribute("class")).toContain("physics-collider");
    expect(core?.getAttribute("data-physics-shape")).toBe("rect");
    expect(core?.getAttribute("data-width")).toBe("16");
    expect(core?.getAttribute("data-height")).toBe("16");
    expect(core?.getAttribute("data-anim-wave")).toBe(
      "frequency:4 amplitude:2 points:12",
    );
    expect(core?.getAttribute("data-material-phosphor-trail")).toBe("1.2");
    expect(core?.getAttribute("data-material-chromatic-scale")).toBe("0.35");
    expect(core?.getAttribute("data-on-anim-peak")).toBe("spark");
  });
});
