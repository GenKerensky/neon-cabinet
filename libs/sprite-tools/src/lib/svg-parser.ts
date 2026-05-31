import {
  SVGPuppetMetadata,
  LayerMetadata,
  AnimationMetadata,
  MaterialMetadata,
  PhysicsMetadata,
  SocketMetadata,
  AudioMetadata,
  DirectionBendMetadata,
  DirectionRotationMetadata,
} from "./types.js";

export class SVGParser {
  private parser: DOMParser;
  private static readonly DEFAULT_DIRECTION_ROTATION: DirectionRotationMetadata =
    {
      RIGHT: 0,
      DOWN: 90,
      LEFT: 180,
      UP: -90,
    };

  constructor() {
    this.parser = new DOMParser();
  }

  public parse(svgString: string): SVGPuppetMetadata {
    const doc = this.parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = doc.querySelector("svg");

    if (!svgElement) {
      throw new Error("Invalid SVG: No <svg> element found.");
    }

    const viewBoxAttr = svgElement.getAttribute("viewBox");
    const viewBox = viewBoxAttr
      ? this.parseViewBox(viewBoxAttr)
      : {
          x: 0,
          y: 0,
          width: parseFloat(svgElement.getAttribute("width") || "0"),
          height: parseFloat(svgElement.getAttribute("height") || "0"),
        };

    const layers: LayerMetadata[] = [];
    const sockets: SocketMetadata[] = [];

    // Parse top-level children
    Array.from(svgElement.children).forEach((child) => {
      if (child.id?.startsWith("socket_")) {
        sockets.push(this.parseSocket(child as SVGElement));
      } else {
        const layer = this.parseElement(child as SVGElement);
        if (layer) {
          layers.push(layer);
        }
      }
    });

    return {
      viewBox,
      layers,
      sockets,
    };
  }

  private parseViewBox(viewBoxAttr: string) {
    const [x, y, width, height] = viewBoxAttr.split(/[\s,]+/).map(parseFloat);
    return { x, y, width, height };
  }

  private parseElement(el: SVGElement): LayerMetadata | null {
    const tagName = el.tagName.toLowerCase();

    // Ignore non-graphical elements or specific ignores
    if (!["path", "circle", "rect", "g"].includes(tagName)) {
      return null;
    }

    const metadata: LayerMetadata = {
      id: el.id || `layer_${Math.random().toString(36).substr(2, 9)}`,
      type: (tagName === "g" ? "group" : tagName) as LayerMetadata["type"],
      animations: this.parseAnimations(el),
      material: this.parseMaterial(el),
      physics: this.parsePhysics(el),
      audio: this.parseAudio(el),
      visible:
        el.getAttribute("display") !== "none" &&
        el.getAttribute("visibility") !== "hidden",
      transform: el.getAttribute("transform") || undefined,
      slideRange: this.parseNumericAttribute(el, "data-slide-range"),
      directionBend: this.parseDirectionBend(el),
      directionRotation: this.parseDirectionRotation(el),
      stroke: el.getAttribute("stroke") || undefined,
      fill: el.getAttribute("fill") || undefined,
      strokeWidth: this.parseNumericAttribute(el, "stroke-width"),
      opacity: this.parseNumericAttribute(el, "opacity"),
    };

    if (tagName === "path") {
      metadata.d = el.getAttribute("d") || undefined;
    } else if (tagName === "circle") {
      metadata.cx = parseFloat(el.getAttribute("cx") || "0");
      metadata.cy = parseFloat(el.getAttribute("cy") || "0");
      metadata.r = parseFloat(el.getAttribute("r") || "0");
    } else if (tagName === "rect") {
      metadata.x = parseFloat(el.getAttribute("x") || "0");
      metadata.y = parseFloat(el.getAttribute("y") || "0");
      metadata.width = parseFloat(el.getAttribute("width") || "0");
      metadata.height = parseFloat(el.getAttribute("height") || "0");
      metadata.rx = parseFloat(el.getAttribute("rx") || "0");
      metadata.ry = parseFloat(el.getAttribute("ry") || "0");
    } else if (tagName === "g") {
      metadata.children = Array.from(el.children)
        .map((child) => this.parseElement(child as SVGElement))
        .filter((l): l is LayerMetadata => l !== null);
    }

    return metadata;
  }

  private parseAnimations(el: SVGElement): AnimationMetadata[] {
    const animations: AnimationMetadata[] = [];

    const wave = el.getAttribute("data-anim-wave");
    if (wave) {
      animations.push({
        type: "wave",
        ...this.parseDataParams(wave),
      } as AnimationMetadata);
    }

    const wobble = el.getAttribute("data-anim-wobble");
    if (wobble) {
      animations.push({
        type: "wobble",
        ...this.parseDataParams(wobble),
      } as AnimationMetadata);
    }

    const chomp = el.getAttribute("data-anim-chomp");
    if (chomp) {
      animations.push({
        type: "chomp",
        ...this.parseDataParams(chomp),
      } as AnimationMetadata);
    }

    const flash = el.getAttribute("data-anim-flash");
    if (flash) {
      animations.push({
        type: "flash",
        ...this.parseDataParams(flash),
      } as AnimationMetadata);
    }

    return animations;
  }

  private parseDirectionBend(
    el: SVGElement,
  ): DirectionBendMetadata | undefined {
    const value = el.getAttribute("data-direction-bend");
    if (!value) return undefined;

    const params = this.parseDataParams(value);
    if (typeof params.amount === "number") {
      return {
        amount: params.amount,
        pivotY: typeof params.pivotY === "number" ? params.pivotY : undefined,
      };
    }

    const amount = parseFloat(value);
    return Number.isFinite(amount) ? { amount } : undefined;
  }

  private parseDirectionRotation(
    el: SVGElement,
  ): DirectionRotationMetadata | undefined {
    if (!el.hasAttribute("data-direction-rotation")) return undefined;

    const value = el.getAttribute("data-direction-rotation");
    if (value === null || value === "" || value === "true" || value === "1") {
      return { ...SVGParser.DEFAULT_DIRECTION_ROTATION };
    }

    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        return undefined;

      const directionKeys: Array<keyof DirectionRotationMetadata> = [
        "RIGHT",
        "DOWN",
        "LEFT",
        "UP",
      ];
      const providedKeys = directionKeys.filter((key) =>
        Object.prototype.hasOwnProperty.call(parsed, key),
      );
      if (providedKeys.length === 0) return undefined;

      const rotation: DirectionRotationMetadata = {
        ...SVGParser.DEFAULT_DIRECTION_ROTATION,
      };
      for (const key of providedKeys) {
        const rawValue = (parsed as Record<string, unknown>)[key];
        if (typeof rawValue !== "number" || !Number.isFinite(rawValue))
          return undefined;
        rotation[key] = rawValue;
      }

      return rotation;
    } catch {
      return undefined;
    }
  }

  private parseMaterial(el: SVGElement): MaterialMetadata {
    return {
      phosphorTrail: this.parseNumericAttribute(
        el,
        "data-material-phosphor-trail",
      ),
      chromaticScale: this.parseNumericAttribute(
        el,
        "data-material-chromatic-scale",
      ),
    };
  }

  private parsePhysics(el: SVGElement): PhysicsMetadata | undefined {
    if (el.getAttribute("class")?.includes("physics-collider")) {
      const tagName = el.tagName.toLowerCase();
      const physics: PhysicsMetadata = {
        shape: tagName === "circle" ? "circle" : "rect",
        mass: this.parseNumericAttribute(el, "data-mass"),
        bounce: this.parseNumericAttribute(el, "data-bounce"),
        drag: this.parseNumericAttribute(el, "data-drag"),
        friction: this.parseNumericAttribute(el, "data-friction"),
      };

      if (tagName === "circle") {
        physics.radius = parseFloat(el.getAttribute("r") || "0");
      } else {
        physics.width = parseFloat(el.getAttribute("width") || "0");
        physics.height = parseFloat(el.getAttribute("height") || "0");
      }
      return physics;
    }
    return undefined;
  }

  private parseAudio(el: SVGElement): AudioMetadata | undefined {
    const onMax = el.getAttribute("data-on-anim-max");
    const onMin = el.getAttribute("data-on-anim-min");
    const onPeak = el.getAttribute("data-on-anim-peak");

    if (onMax || onMin || onPeak) {
      return {
        onMax: onMax || undefined,
        onMin: onMin || undefined,
        onPeak: onPeak || undefined,
      };
    }
    return undefined;
  }

  private parseNumericAttribute(
    el: SVGElement,
    name: string,
  ): number | undefined {
    const value = el.getAttribute(name);
    if (value === null || value === "") {
      return undefined;
    }

    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseSocket(el: SVGElement): SocketMetadata {
    const transform = el.getAttribute("transform") || "";
    const translateMatch = transform.match(
      /translate\(([^,)\s]+)[,\s]*([^,)\s]*)\)/,
    );

    return {
      id: el.id,
      x: translateMatch ? parseFloat(translateMatch[1]) : 0,
      y:
        translateMatch && translateMatch[2] ? parseFloat(translateMatch[2]) : 0,
      type: el.getAttribute("data-socket-type") || "spawn",
    };
  }

  private parseDataParams(
    paramString: string,
  ): Record<string, string | number> {
    try {
      // Try parsing as JSON first
      return JSON.parse(paramString) as Record<string, string | number>;
    } catch {
      // Fallback to key:value pairs if JSON fails
      const params: Record<string, string | number> = {};
      paramString.split(/\s+/).forEach((pair) => {
        const [key, value] = pair.split(":");
        if (key && value) {
          const num = parseFloat(value);
          params[key] = isNaN(num) ? value : num;
        }
      });
      return params;
    }
  }
}
