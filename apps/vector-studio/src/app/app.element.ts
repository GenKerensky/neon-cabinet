import "./app.element.css";

interface BuiltInAsset {
  id: string;
  label: string;
  path: string;
}

interface LayerInfo {
  id: string;
  tagName: string;
}

interface LayerControls {
  alpha: number;
  scale: number;
  rotation: number;
}

type ShaderMode = "color" | "monochrome";

const BUILT_IN_ASSETS: BuiltInAsset[] = [
  {
    id: "ship",
    label: "Space Defender Ship",
    path: "/space-defender-assets/vector/ship.svg",
  },
  {
    id: "bullet",
    label: "Autocannon Bullet",
    path: "/space-defender-assets/vector/bullet.svg",
  },
  {
    id: "missile",
    label: "Guided Missile",
    path: "/space-defender-assets/vector/missile.svg",
  },
  {
    id: "thruster-flame",
    label: "Thruster Flame",
    path: "/space-defender-assets/vector/thruster-flame.svg",
  },
  {
    id: "muzzle-flash",
    label: "Muzzle Flash",
    path: "/space-defender-assets/vector/muzzle-flash.svg",
  },
  {
    id: "life-icon",
    label: "Life Icon",
    path: "/space-defender-assets/vector/life-icon.svg",
  },
];

const SUPPORTED_TAGS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
]);

const LAYER_TAGS = new Set([
  "g",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
]);

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 80">
  <polygon id="fallback-hull" points="25,2 41,62 31,78 19,78 9,62" fill="#05070d" stroke="#f7fdff" stroke-width="2"/>
  <line id="fallback-left-stripe" x1="20" y1="11" x2="11" y2="54" stroke="#00ffff" stroke-width="2"/>
  <line id="fallback-right-stripe" x1="30" y1="11" x2="39" y2="54" stroke="#00ffff" stroke-width="2"/>
  <rect id="fallback-collider" class="physics-collider" x="8" y="6" width="34" height="68" fill="none" opacity="0"/>
  <g id="socket_muzzle" transform="translate(25,2)" data-socket-type="weapon"/>
  <g id="socket_engine" transform="translate(25,78)" data-socket-type="thruster"/>
</svg>`;

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  private selectedAssetId = BUILT_IN_ASSETS[0].id;
  private svgText = FALLBACK_SVG;
  private previewRotation = 0;
  private shaderMode: ShaderMode = "color";
  private showSockets = true;
  private showColliders = true;
  private layerControls = new Map<string, LayerControls>();

  connectedCallback() {
    this.render();
    void this.loadBuiltInAsset(this.selectedAssetId);
  }

  private async loadBuiltInAsset(assetId: string): Promise<void> {
    const asset = BUILT_IN_ASSETS.find((candidate) => candidate.id === assetId);
    if (!asset || typeof fetch !== "function") return;

    try {
      const response = await fetch(asset.path);
      if (!response.ok) return;
      this.selectedAssetId = assetId;
      this.svgText = await response.text();
      this.layerControls.clear();
      this.render();
    } catch {
      // The fallback SVG keeps the studio usable when assets are unavailable.
    }
  }

  private render(): void {
    const analysis = this.analyzeSvg();
    this.innerHTML = `
      <main class="studio-shell">
        <section class="toolbar" aria-label="Vector preview controls">
          <div class="brand-row">
            <span class="brand-mark">VS</span>
            <div>
              <h1>Vector Studio</h1>
              <p>SVG puppet preview workflow</p>
            </div>
          </div>

          <label class="field">
            <span>Asset</span>
            <select id="asset-select">
              ${BUILT_IN_ASSETS.map(
                (asset) =>
                  `<option value="${asset.id}" ${
                    asset.id === this.selectedAssetId ? "selected" : ""
                  }>${asset.label}</option>`,
              ).join("")}
            </select>
          </label>

          <label class="file-drop">
            <span>Load SVG</span>
            <input id="file-input" type="file" accept="image/svg+xml,.svg" />
          </label>

          <label class="field">
            <span>Rotation</span>
            <div class="split-input">
              <input id="rotation-slider" type="range" min="-180" max="180" step="1" value="${this.previewRotation}" />
              <input id="rotation-input" type="number" min="-360" max="360" step="1" value="${this.previewRotation}" />
            </div>
          </label>

          <div class="field">
            <span>Shader Preview</span>
            <div class="segmented" role="group" aria-label="Shader preview">
              <button id="shader-color" class="${this.shaderMode === "color" ? "active" : ""}" type="button">Color</button>
              <button id="shader-monochrome" class="${this.shaderMode === "monochrome" ? "active" : ""}" type="button">Mono</button>
            </div>
          </div>

          <label class="toggle">
            <input id="show-sockets" type="checkbox" ${this.showSockets ? "checked" : ""} />
            <span>Socket overlay</span>
          </label>
          <label class="toggle">
            <input id="show-colliders" type="checkbox" ${this.showColliders ? "checked" : ""} />
            <span>Collider overlay</span>
          </label>
        </section>

        <section class="preview-column">
          <div class="preview-header">
            <div>
              <h2>${this.currentAssetLabel()}</h2>
              <p>${analysis.layers.length} layers, ${analysis.socketCount} sockets, ${analysis.colliderCount} colliders</p>
            </div>
            <span class="mode-badge">${this.shaderMode}</span>
          </div>

          <div class="preview-stage">
            <div class="preview-grid"></div>
            <div class="svg-preview ${this.shaderMode}" style="transform: rotate(${this.previewRotation}deg)">
              ${analysis.previewMarkup}
            </div>
          </div>

          <div class="warnings ${analysis.warnings.length === 0 ? "empty" : ""}">
            <h3>Unsupported Elements</h3>
            ${
              analysis.warnings.length === 0
                ? "<p>No unsupported SVG elements detected.</p>"
                : `<ul>${analysis.warnings.map((warning) => `<li>${warning}</li>`).join("")}</ul>`
            }
          </div>
        </section>

        <aside class="layers-panel">
          <h2>Layer Controls</h2>
          <div class="layers-list">
            ${analysis.layers.map((layer) => this.renderLayerControl(layer)).join("")}
          </div>
        </aside>
      </main>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.querySelector<HTMLSelectElement>("#asset-select")?.addEventListener(
      "change",
      (event) => {
        const value = (event.target as HTMLSelectElement).value;
        void this.loadBuiltInAsset(value);
      },
    );

    this.querySelector<HTMLInputElement>("#file-input")?.addEventListener(
      "change",
      (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          this.selectedAssetId = "custom";
          this.svgText = String(reader.result ?? FALLBACK_SVG);
          this.layerControls.clear();
          this.render();
        };
        reader.readAsText(file);
      },
    );

    const updateRotation = (value: string) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return;
      this.previewRotation = Math.max(-360, Math.min(360, parsed));
      this.render();
    };
    this.querySelector<HTMLInputElement>("#rotation-slider")?.addEventListener(
      "input",
      (event) => updateRotation((event.target as HTMLInputElement).value),
    );
    this.querySelector<HTMLInputElement>("#rotation-input")?.addEventListener(
      "input",
      (event) => updateRotation((event.target as HTMLInputElement).value),
    );

    this.querySelector("#shader-color")?.addEventListener("click", () => {
      this.shaderMode = "color";
      this.render();
    });
    this.querySelector("#shader-monochrome")?.addEventListener("click", () => {
      this.shaderMode = "monochrome";
      this.render();
    });
    this.querySelector<HTMLInputElement>("#show-sockets")?.addEventListener(
      "change",
      (event) => {
        this.showSockets = (event.target as HTMLInputElement).checked;
        this.render();
      },
    );
    this.querySelector<HTMLInputElement>("#show-colliders")?.addEventListener(
      "change",
      (event) => {
        this.showColliders = (event.target as HTMLInputElement).checked;
        this.render();
      },
    );

    this.querySelectorAll<HTMLInputElement>("[data-layer-control]").forEach(
      (input) => {
        input.addEventListener("input", (event) => {
          const target = event.target as HTMLInputElement;
          const id = target.dataset["layerId"];
          const control = target.dataset["layerControl"] as
            | keyof LayerControls
            | undefined;
          if (!id || !control) return;
          const current = this.getLayerControls(id);
          current[control] = Number(target.value);
          this.layerControls.set(id, current);
          this.render();
        });
      },
    );
  }

  private analyzeSvg(): {
    previewMarkup: string;
    warnings: string[];
    layers: LayerInfo[];
    socketCount: number;
    colliderCount: number;
  } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) {
      return {
        previewMarkup: FALLBACK_SVG,
        warnings: ["Missing root <svg> element."],
        layers: [],
        socketCount: 0,
        colliderCount: 0,
      };
    }

    const warnings = this.collectUnsupportedWarnings(svg);
    const layers = this.collectLayers(svg);
    this.applyLayerControls(svg, layers);
    this.applyOverlays(doc, svg);

    return {
      previewMarkup: new XMLSerializer().serializeToString(svg),
      warnings,
      layers,
      socketCount: svg.querySelectorAll('[id^="socket_"]').length,
      colliderCount: svg.querySelectorAll(".physics-collider").length,
    };
  }

  private collectUnsupportedWarnings(svg: SVGSVGElement): string[] {
    const warnings = new Set<string>();
    svg.querySelectorAll("*").forEach((node) => {
      const tagName = node.tagName.toLowerCase();
      if (!SUPPORTED_TAGS.has(tagName)) {
        warnings.add(`<${tagName}> is not supported by VectorPuppet.`);
      }
    });
    return Array.from(warnings);
  }

  private collectLayers(svg: SVGSVGElement): LayerInfo[] {
    const layers: LayerInfo[] = [];
    svg.querySelectorAll("*").forEach((node, index) => {
      const tagName = node.tagName.toLowerCase();
      if (!LAYER_TAGS.has(tagName)) return;
      if (node.id.startsWith("socket_")) return;
      layers.push({
        id: node.id || `${tagName}-${index}`,
        tagName,
      });
    });
    return layers;
  }

  private applyLayerControls(svg: SVGSVGElement, layers: LayerInfo[]): void {
    const layerIds = new Set(layers.map((layer) => layer.id));
    svg.querySelectorAll("*").forEach((node, index) => {
      const tagName = node.tagName.toLowerCase();
      const id = node.id || `${tagName}-${index}`;
      if (!layerIds.has(id)) return;

      const controls = this.layerControls.get(id);
      if (!controls) return;

      node.setAttribute("opacity", String(controls.alpha));
      const center = this.getLayerCenter(node, svg);
      const existingTransform = node.getAttribute("transform") || "";
      const previewTransform = `translate(${center.x} ${center.y}) rotate(${controls.rotation}) scale(${controls.scale}) translate(${-center.x} ${-center.y})`;
      node.setAttribute(
        "transform",
        [existingTransform, previewTransform].filter(Boolean).join(" "),
      );
    });
  }

  private applyOverlays(doc: XMLDocument, svg: SVGSVGElement): void {
    const overlay = doc.createElementNS("http://www.w3.org/2000/svg", "g");
    overlay.setAttribute("id", "vector-studio-overlays");

    if (this.showColliders) {
      svg.querySelectorAll(".physics-collider").forEach((node) => {
        const clone = node.cloneNode(true) as SVGElement;
        clone.setAttribute("fill", "none");
        clone.setAttribute("stroke", "#ff4fd8");
        clone.setAttribute("stroke-width", "1.5");
        clone.setAttribute("stroke-dasharray", "3 2");
        clone.setAttribute("opacity", "0.95");
        overlay.appendChild(clone);
      });
    }

    if (this.showSockets) {
      svg.querySelectorAll('[id^="socket_"]').forEach((node) => {
        const point = this.getSocketPoint(node as SVGElement);
        const group = doc.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("class", "socket-overlay");
        group.setAttribute("transform", `translate(${point.x} ${point.y})`);

        const circle = doc.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        circle.setAttribute("r", "3");
        circle.setAttribute("fill", "#05070d");
        circle.setAttribute("stroke", "#66ffff");
        circle.setAttribute("stroke-width", "1.5");

        const horizontal = doc.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        horizontal.setAttribute("x1", "-5");
        horizontal.setAttribute("x2", "5");
        horizontal.setAttribute("y1", "0");
        horizontal.setAttribute("y2", "0");
        horizontal.setAttribute("stroke", "#66ffff");
        horizontal.setAttribute("stroke-width", "1");

        const vertical = doc.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        vertical.setAttribute("x1", "0");
        vertical.setAttribute("x2", "0");
        vertical.setAttribute("y1", "-5");
        vertical.setAttribute("y2", "5");
        vertical.setAttribute("stroke", "#66ffff");
        vertical.setAttribute("stroke-width", "1");

        group.append(circle, horizontal, vertical);
        overlay.appendChild(group);
      });
    }

    svg.appendChild(overlay);
  }

  private getLayerCenter(
    node: Element,
    svg: SVGSVGElement,
  ): { x: number; y: number } {
    const tagName = node.tagName.toLowerCase();
    if (tagName === "circle") {
      return {
        x: Number(node.getAttribute("cx") || 0),
        y: Number(node.getAttribute("cy") || 0),
      };
    }
    if (tagName === "rect") {
      const x = Number(node.getAttribute("x") || 0);
      const y = Number(node.getAttribute("y") || 0);
      const width = Number(node.getAttribute("width") || 0);
      const height = Number(node.getAttribute("height") || 0);
      return { x: x + width / 2, y: y + height / 2 };
    }
    if (tagName === "line") {
      return {
        x:
          (Number(node.getAttribute("x1") || 0) +
            Number(node.getAttribute("x2") || 0)) /
          2,
        y:
          (Number(node.getAttribute("y1") || 0) +
            Number(node.getAttribute("y2") || 0)) /
          2,
      };
    }
    if (tagName === "polyline" || tagName === "polygon") {
      const points = this.parsePoints(node.getAttribute("points") || "");
      if (points.length > 0) {
        return {
          x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
          y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
        };
      }
    }

    const viewBox = (svg.getAttribute("viewBox") || "0 0 100 100")
      .split(/[\s,]+/)
      .map(Number);
    return {
      x: (viewBox[0] || 0) + (viewBox[2] || 100) / 2,
      y: (viewBox[1] || 0) + (viewBox[3] || 100) / 2,
    };
  }

  private getSocketPoint(node: SVGElement): { x: number; y: number } {
    const transform = node.getAttribute("transform") || "";
    const translateMatch = transform.match(
      /translate\(([^,)\s]+)[,\s]*([^,)\s]*)\)/,
    );
    return {
      x: translateMatch ? Number(translateMatch[1]) : 0,
      y: translateMatch && translateMatch[2] ? Number(translateMatch[2]) : 0,
    };
  }

  private parsePoints(pointsAttr: string): Array<{ x: number; y: number }> {
    const values = pointsAttr
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((value) => Number.isFinite(value));
    const points: Array<{ x: number; y: number }> = [];
    for (let index = 0; index < values.length - 1; index += 2) {
      points.push({ x: values[index], y: values[index + 1] });
    }
    return points;
  }

  private renderLayerControl(layer: LayerInfo): string {
    const controls = this.getLayerControls(layer.id);
    return `
      <article class="layer-row">
        <header>
          <strong>${layer.id}</strong>
          <span>${layer.tagName}</span>
        </header>
        <label>
          <span>Alpha</span>
          <input data-layer-id="${layer.id}" data-layer-control="alpha" type="range" min="0" max="1" step="0.05" value="${controls.alpha}" />
        </label>
        <label>
          <span>Scale</span>
          <input data-layer-id="${layer.id}" data-layer-control="scale" type="range" min="0.2" max="2" step="0.05" value="${controls.scale}" />
        </label>
        <label>
          <span>Rotate</span>
          <input data-layer-id="${layer.id}" data-layer-control="rotation" type="range" min="-180" max="180" step="1" value="${controls.rotation}" />
        </label>
      </article>
    `;
  }

  private getLayerControls(id: string): LayerControls {
    return (
      this.layerControls.get(id) ?? {
        alpha: 1,
        scale: 1,
        rotation: 0,
      }
    );
  }

  private currentAssetLabel(): string {
    return (
      BUILT_IN_ASSETS.find((asset) => asset.id === this.selectedAssetId)
        ?.label ?? "Custom SVG"
    );
  }
}

if (!customElements.get("neon-cabinet-root")) {
  customElements.define("neon-cabinet-root", AppElement);
}
