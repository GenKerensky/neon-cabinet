import * as Phaser from "phaser";
import {
  SVGPuppetMetadata,
  LayerMetadata,
  MaterialMetadata,
  DirectionRotationMetadata,
  AnimationMetadata,
  SocketMetadata,
} from "./types.js";
import { PathTokenizer } from "./path-tokenizer.js";

type LayerGameObject =
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Graphics;
type PointTransform = (x: number, y: number) => { x: number; y: number };
type StrokeStyle = { color: number; width: number } | undefined;
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export class VectorPuppet extends Phaser.GameObjects.Container {
  protected metadata: SVGPuppetMetadata;
  protected layers: Map<string, LayerGameObject> = new Map();
  protected layerDrawables: Map<string, LayerGameObject> = new Map();
  protected directionRotationTargets: Map<
    string,
    Phaser.GameObjects.Container
  > = new Map();
  protected layersMetadata: Map<string, LayerMetadata> = new Map();
  protected sockets: Map<string, SocketMetadata> = new Map();
  protected directionRotationContext: Map<string, boolean> = new Map();
  protected content: Phaser.GameObjects.Container;
  protected directionBendX = 0;
  protected currentDirection = "RIGHT";

  declare public scene: Phaser.Scene;
  declare public x: number;
  declare public y: number;
  declare public alpha: number;
  declare public scale: number;
  declare public depth: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    metadata: SVGPuppetMetadata,
  ) {
    super(scene, x, y);
    this.metadata = metadata;

    this.content = scene.add.container(0, 0);
    this.add(this.content);

    const offX = -(this.metadata.viewBox.x + this.metadata.viewBox.width / 2);
    const offY = -(this.metadata.viewBox.y + this.metadata.viewBox.height / 2);
    this.content.setPosition(offX, offY);

    this.setupLayers(this.metadata.layers, this.content);
    this.setupSockets();
    this.setupPhysics();

    scene.add.existing(this);
  }

  public getLayer(id: string): LayerGameObject | undefined {
    return this.layers.get(id);
  }

  public getLayerDrawable(id: string): LayerGameObject | undefined {
    return this.layerDrawables.get(id);
  }

  public getRotationTarget(
    id: string,
  ): Phaser.GameObjects.Container | undefined {
    return this.directionRotationTargets.get(id);
  }

  public override setScale(x?: number, y?: number): this {
    super.setScale(x, y);
    this.redrawScreenPolicyLayers();
    return this;
  }

  private setupLayers(
    layers: LayerMetadata[],
    parent: Phaser.GameObjects.Container,
    inheritedRotationContext = false,
  ) {
    layers.forEach((layer) => {
      const hasRotationContext =
        inheritedRotationContext || !!layer.directionRotation;
      this.directionRotationContext.set(layer.id, hasRotationContext);
      let gameObject: LayerGameObject;

      if (layer.type === "group") {
        const container = this.scene.add.container();
        this.layerDrawables.set(layer.id, container);
        this.layers.set(layer.id, container);
        this.layersMetadata.set(layer.id, layer);
        parent.add(container);
        gameObject = container;

        if (layer.children) {
          this.setupLayers(layer.children, container, hasRotationContext);
        }

        if (layer.directionRotation) {
          const pivotX =
            this.metadata.viewBox.x + this.metadata.viewBox.width / 2;
          const pivotY =
            this.metadata.viewBox.y + this.metadata.viewBox.height / 2;
          const pivotContainer = this.scene.add.container(pivotX, pivotY);
          parent.add(pivotContainer);
          parent.remove(container);
          container.x -= pivotX;
          container.y -= pivotY;
          pivotContainer.add(container);
          this.directionRotationTargets.set(layer.id, pivotContainer);
          gameObject = pivotContainer;
        }
      } else {
        const graphics = this.scene.add.graphics();
        this.layerDrawables.set(layer.id, graphics);
        this.layers.set(layer.id, graphics);
        this.layersMetadata.set(layer.id, layer);
        parent.add(graphics);
        gameObject = graphics;
        this.drawLayer(layer, graphics);

        if (layer.directionRotation && layer.type === "circle") {
          const pivotX = layer.cx || 0;
          const pivotY = layer.cy || 0;
          if (pivotX !== 0 || pivotY !== 0) {
            const pivotContainer = this.scene.add.container(pivotX, pivotY);
            parent.add(pivotContainer);
            parent.remove(graphics);
            graphics.x -= pivotX;
            graphics.y -= pivotY;
            pivotContainer.add(graphics);
            this.directionRotationTargets.set(layer.id, pivotContainer);
            gameObject = pivotContainer;
          }
        }
      }

      if (layer.visible === false) {
        gameObject.visible = false;
      }

      if (layer.opacity !== undefined) {
        gameObject.alpha = layer.opacity;
      }

      if (layer.transform) {
        this.applyTransform(gameObject, layer.transform);
      }
    });
  }

  protected drawLayer(
    layer: LayerMetadata,
    graphics: Phaser.GameObjects.Graphics,
    fillOverride?: string,
    strokeOverride?: string,
  ) {
    const stroke = strokeOverride ?? layer.stroke;
    const fill = fillOverride ?? layer.fill;

    const strokeStyle = this.applyStrokeStyle(graphics, layer, stroke);
    if (fill && fill !== "none") {
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color);
    }

    if (layer.type === "path" && layer.d) {
      const commands = PathTokenizer.tokenize(layer.d);
      graphics.beginPath();

      let curX = 0;
      let curY = 0;

      commands.forEach((cmd) => {
        const result = this.executeCommand(graphics, cmd, curX, curY);
        curX = result.x;
        curY = result.y;
      });

      if (fill && fill !== "none") graphics.fillPath();
      if (strokeStyle) graphics.strokePath();
    } else if (layer.type === "circle") {
      if (strokeStyle)
        graphics.strokeCircle(layer.cx || 0, layer.cy || 0, layer.r || 0);
      if (fill && fill !== "none")
        graphics.fillCircle(layer.cx || 0, layer.cy || 0, layer.r || 0);
    } else if (layer.type === "ellipse") {
      if (strokeStyle)
        graphics.strokeEllipse(
          layer.cx || 0,
          layer.cy || 0,
          (layer.rx || 0) * 2,
          (layer.ry || 0) * 2,
        );
      if (fill && fill !== "none")
        graphics.fillEllipse(
          layer.cx || 0,
          layer.cy || 0,
          (layer.rx || 0) * 2,
          (layer.ry || 0) * 2,
        );
    } else if (layer.type === "rect") {
      const rx = layer.rx || 0;
      const ry = layer.ry || 0;
      const corner = Math.max(rx, ry);

      if (corner > 0) {
        if (fill && fill !== "none")
          graphics.fillRoundedRect(
            layer.x || 0,
            layer.y || 0,
            layer.width || 0,
            layer.height || 0,
            corner,
          );
        if (strokeStyle)
          graphics.strokeRoundedRect(
            layer.x || 0,
            layer.y || 0,
            layer.width || 0,
            layer.height || 0,
            corner,
          );
      } else {
        if (fill && fill !== "none")
          graphics.fillRect(
            layer.x || 0,
            layer.y || 0,
            layer.width || 0,
            layer.height || 0,
          );
        if (strokeStyle)
          graphics.strokeRect(
            layer.x || 0,
            layer.y || 0,
            layer.width || 0,
            layer.height || 0,
          );
      }
    } else if (layer.type === "line") {
      graphics.beginPath();
      graphics.moveTo(layer.x1 || 0, layer.y1 || 0);
      graphics.lineTo(layer.x2 || 0, layer.y2 || 0);
      if (strokeStyle) graphics.strokePath();
    } else if (layer.type === "polyline" || layer.type === "polygon") {
      const points = layer.points || [];
      if (points.length > 0) {
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => {
          graphics.lineTo(point.x, point.y);
        });
        if (layer.type === "polygon") {
          graphics.closePath();
        }
        if (fill && fill !== "none") graphics.fillPath();
        if (strokeStyle) graphics.strokePath();
      }
    }
  }

  private applyStrokeStyle(
    graphics: Phaser.GameObjects.Graphics,
    layer: LayerMetadata,
    strokeOverride?: string,
  ): StrokeStyle {
    const stroke = strokeOverride ?? layer.stroke;
    const strokeStyle = this.getStrokeStyle(layer, stroke);
    if (!strokeStyle) return undefined;

    graphics.lineStyle(strokeStyle.width, strokeStyle.color);
    return strokeStyle;
  }

  private getStrokeStyle(
    layer: LayerMetadata,
    stroke: string | undefined,
  ): StrokeStyle {
    if (!stroke || stroke === "none" || layer.strokePolicy === "ignore") {
      return undefined;
    }

    const baseWidth = layer.strokeWidth || 1;
    const width =
      layer.strokePolicy === "screen"
        ? baseWidth / this.getCurrentStrokeScale()
        : baseWidth;

    return {
      width,
      color: Phaser.Display.Color.HexStringToColor(stroke).color,
    };
  }

  private getCurrentStrokeScale(): number {
    const scaleState = this as unknown as {
      scale?: number;
      scaleX?: number;
      scaleY?: number;
    };
    const scaleX = Math.abs(scaleState.scaleX ?? scaleState.scale ?? 1);
    const scaleY = Math.abs(scaleState.scaleY ?? scaleState.scale ?? scaleX);

    return Math.max(0.001, Math.max(scaleX, scaleY));
  }

  private redrawScreenPolicyLayers(): void {
    this.layersMetadata.forEach((layer, layerId) => {
      if (layer.strokePolicy === "screen") {
        this.redrawLayer(layerId);
      }
    });
  }

  private executeCommand(
    graphics: Phaser.GameObjects.Graphics,
    cmd: { type: string; params: number[] },
    curX: number,
    curY: number,
  ): { x: number; y: number } {
    const { type, params } = cmd;
    const isRelative = type === type.toLowerCase();
    const command = type.toUpperCase();

    let nextX = curX;
    let nextY = curY;

    switch (command) {
      case "M":
        nextX = isRelative ? curX + params[0] : params[0];
        nextY = isRelative ? curY + params[1] : params[1];
        graphics.moveTo(nextX, nextY);
        break;
      case "L":
        nextX = isRelative ? curX + params[0] : params[0];
        nextY = isRelative ? curY + params[1] : params[1];
        graphics.lineTo(nextX, nextY);
        break;
      case "C": {
        const x1 = isRelative ? curX + params[0] : params[0];
        const y1 = isRelative ? curY + params[1] : params[1];
        const x2 = isRelative ? curX + params[2] : params[2];
        const y2 = isRelative ? curY + params[3] : params[3];
        nextX = isRelative ? curX + params[4] : params[4];
        nextY = isRelative ? curY + params[5] : params[5];
        this.drawCubicCurve(graphics, curX, curY, x1, y1, x2, y2, nextX, nextY);
        break;
      }
      case "Q": {
        const x1 = isRelative ? curX + params[0] : params[0];
        const y1 = isRelative ? curY + params[1] : params[1];
        nextX = isRelative ? curX + params[2] : params[2];
        nextY = isRelative ? curY + params[3] : params[3];
        this.drawQuadraticCurve(graphics, curX, curY, x1, y1, nextX, nextY);
        break;
      }
      case "A": {
        const rx = params[0];
        const ry = params[1];
        const xAxisRotation = params[2];
        const largeArcFlag = params[3];
        const sweepFlag = params[4];
        nextX = isRelative ? curX + params[5] : params[5];
        nextY = isRelative ? curY + params[6] : params[6];
        this.drawSVGPathArc(graphics, curX, curY, [
          rx,
          ry,
          xAxisRotation,
          largeArcFlag,
          sweepFlag,
          nextX,
          nextY,
        ]);
        break;
      }
      case "Z":
        graphics.closePath();
        break;
    }
    return { x: nextX, y: nextY };
  }

  private drawQuadraticCurve(
    graphics: Phaser.GameObjects.Graphics,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    segments = 24,
  ) {
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const mt = 1 - t;
      const x = mt * mt * x0 + 2 * mt * t * x1 + t * t * x2;
      const y = mt * mt * y0 + 2 * mt * t * y1 + t * t * y2;
      graphics.lineTo(x, y);
    }
  }

  private drawCubicCurve(
    graphics: Phaser.GameObjects.Graphics,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    segments = 24,
  ) {
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const mt = 1 - t;
      const x =
        mt * mt * mt * x0 +
        3 * mt * mt * t * x1 +
        3 * mt * t * t * x2 +
        t * t * t * x3;
      const y =
        mt * mt * mt * y0 +
        3 * mt * mt * t * y1 +
        3 * mt * t * t * y2 +
        t * t * t * y3;
      graphics.lineTo(x, y);
    }
  }

  private drawSVGPathArc(
    graphic: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    params: number[],
    transformPoint?: PointTransform,
  ) {
    const [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x2, y2] = params;

    if (rx === 0 || ry === 0) {
      const point = transformPoint ? transformPoint(x2, y2) : { x: x2, y: y2 };
      graphic.lineTo(point.x, point.y);
      return;
    }

    const phi = (xAxisRotation * Math.PI) / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    const x1p = (cosPhi * (x1 - x2)) / 2 + (sinPhi * (y1 - y2)) / 2;
    const y1p = (-sinPhi * (x1 - x2)) / 2 + (cosPhi * (y1 - y2)) / 2;

    const rxSq = rx * rx;
    const rySq = ry * ry;
    const x1pSq = x1p * x1p;
    const y1pSq = y1p * y1p;

    const lambda = x1pSq / rxSq + y1pSq / rySq;
    let actualRx = rx;
    let actualRy = ry;

    if (lambda > 1) {
      actualRx *= Math.sqrt(lambda);
      actualRy *= Math.sqrt(lambda);
    }

    const actualRxSq = actualRx * actualRx;
    const actualRySq = actualRy * actualRy;

    const sign = largeArcFlag === sweepFlag ? -1 : 1;
    const coNumerator = Math.max(
      0,
      actualRxSq * actualRySq - actualRxSq * y1pSq - actualRySq * x1pSq,
    );
    const coDenominator = actualRxSq * y1pSq + actualRySq * x1pSq;
    const co = sign * Math.sqrt(coNumerator / coDenominator);

    const cxp = (co * actualRx * y1p) / actualRy;
    const cyp = (co * -actualRy * x1p) / actualRx;

    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

    const startVector = {
      x: (x1p - cxp) / actualRx,
      y: (y1p - cyp) / actualRy,
    };
    const endVector = {
      x: (-x1p - cxp) / actualRx,
      y: (-y1p - cyp) / actualRy,
    };

    const startAngle = Math.atan2(startVector.y, startVector.x);
    let deltaAngle = Math.atan2(endVector.y, endVector.x) - startAngle;

    if (sweepFlag === 0 && deltaAngle > 0) {
      deltaAngle -= 2 * Math.PI;
    } else if (sweepFlag === 1 && deltaAngle < 0) {
      deltaAngle += 2 * Math.PI;
    }

    const endAngle = startAngle + deltaAngle;

    if (transformPoint) {
      const segments = Math.max(
        12,
        Math.ceil(Math.abs(deltaAngle) / (Math.PI / 24)),
      );
      for (let i = 1; i <= segments; i++) {
        const angle = startAngle + deltaAngle * (i / segments);
        const localX = actualRx * Math.cos(angle);
        const localY = actualRy * Math.sin(angle);
        const x = cx + cosPhi * localX - sinPhi * localY;
        const y = cy + sinPhi * localX + cosPhi * localY;
        const point = transformPoint(x, y);
        graphic.lineTo(point.x, point.y);
      }
    } else if (xAxisRotation === 0 && actualRx === actualRy) {
      graphic.arc(cx, cy, actualRx, startAngle, endAngle, sweepFlag === 0);
    } else {
      const segments = Math.max(
        12,
        Math.ceil(Math.abs(deltaAngle) / (Math.PI / 24)),
      );
      for (let i = 1; i <= segments; i++) {
        const angle = startAngle + deltaAngle * (i / segments);
        const localX = actualRx * Math.cos(angle);
        const localY = actualRy * Math.sin(angle);
        const x = cx + cosPhi * localX - sinPhi * localY;
        const y = cy + sinPhi * localX + cosPhi * localY;
        graphic.lineTo(x, y);
      }
    }
  }

  private applyTransform(gameObject: LayerGameObject, transform: string) {
    const translateMatch = transform.match(
      /translate\(([^,)\s]+)[,\s]*([^,)\s]*)\)/,
    );
    if (translateMatch) {
      gameObject.x = parseFloat(translateMatch[1]);
      gameObject.y = translateMatch[2] ? parseFloat(translateMatch[2]) : 0;
    }
  }

  private setupSockets() {
    this.metadata.sockets.forEach((socket) => {
      this.sockets.set(socket.id, socket);
    });
  }

  private setupPhysics() {
    const physicsLayers = Array.from(this.layersMetadata.values()).filter(
      (l) => l.physics,
    );

    if (physicsLayers.length > 0) {
      this.scene.physics.add.existing(this);
      const body = this.body;
      if (!(body instanceof Phaser.Physics.Arcade.Body)) {
        return;
      }

      const p = physicsLayers[0].physics;
      if (!p) {
        return;
      }
      if (p.shape === "circle" && p.radius) {
        body.setCircle(p.radius);
        body.setOffset(-p.radius, -p.radius);
      } else if (p.shape === "rect" && p.width && p.height) {
        body.setSize(p.width, p.height);
        body.setOffset(-p.width / 2, -p.height / 2);
      }

      if (p.mass) body.setMass(p.mass);
      if (p.bounce) body.setBounce(p.bounce, p.bounce);
      if (p.drag) body.setDrag(p.drag, p.drag);
      if (p.friction) body.setFriction(p.friction, p.friction);
    }
  }

  public getSocketWorldPosition(id: string): Phaser.Math.Vector2 {
    const socket = this.sockets.get(id);
    if (!socket) return new Phaser.Math.Vector2(this.x, this.y);

    const worldPoint = new Phaser.Math.Vector2();
    const matrix = this.content.getWorldTransformMatrix();
    matrix.transformPoint(socket.x, socket.y, worldPoint);
    return worldPoint;
  }

  public getLayerMaterial(layerId: string): MaterialMetadata | undefined {
    return this.layersMetadata.get(layerId)?.material;
  }

  protected getLayerMetadata(layerId: string): LayerMetadata | undefined {
    return this.layersMetadata.get(layerId);
  }

  protected getSocketMetadata(id: string) {
    return this.sockets.get(id);
  }

  protected getAllSocketMetadata() {
    return Array.from(this.sockets.values());
  }

  protected redrawLayer(layerId: string): void {
    const layer = this.layersMetadata.get(layerId);
    const gameObject = this.layerDrawables.get(layerId);
    if (!layer || !gameObject) return;

    if (gameObject instanceof Phaser.GameObjects.Graphics) {
      gameObject.clear();
      this.drawLayer(layer, gameObject);
    }
    if (layer.opacity !== undefined) {
      gameObject.alpha = layer.opacity;
    }
    if (layer.visible !== undefined) {
      gameObject.visible = layer.visible;
    }
  }

  public setLayerVisibility(layerId: string, visible: boolean) {
    const gameObject = this.layers.get(layerId);
    if (gameObject) {
      gameObject.visible = visible;
    }
  }

  public setLayerAlpha(layerId: string, alpha: number) {
    const gameObject = this.layers.get(layerId);
    if (gameObject) {
      gameObject.alpha = alpha;
    }
  }

  public setLayerScale(layerId: string, scale: number) {
    const gameObject = this.layers.get(layerId);
    if (gameObject) {
      gameObject.setScale(scale);
    }
  }

  public setLayerRotation(layerId: string, rotation: number) {
    const gameObject =
      this.directionRotationTargets.get(layerId) ?? this.layers.get(layerId);
    if (gameObject) {
      gameObject.rotation = rotation;
    }
  }

  public setDirection(dir: Direction) {
    this.currentDirection = dir;

    this.layersMetadata.forEach((layer, id) => {
      const gameObject =
        this.directionRotationTargets.get(id) ?? this.layers.get(id);
      if (!gameObject || !layer.slideRange) return;

      const slideRange = layer.slideRange;

      let targetX = 0;
      let targetY = 0;

      switch (dir) {
        case "LEFT":
          targetX = -slideRange;
          break;
        case "RIGHT":
          targetX = slideRange;
          break;
        case "UP":
          targetY = -slideRange;
          break;
        case "DOWN":
          targetY = slideRange;
          break;
      }

      this.scene.tweens.add({
        targets: gameObject,
        x: targetX,
        y: targetY,
        duration: 100,
        ease: "Quad.out",
      });
    });

    this.layersMetadata.forEach((layer, id) => {
      const gameObject =
        this.directionRotationTargets.get(id) ?? this.layers.get(id);
      if (!gameObject || !layer.directionRotation) return;

      const targetDegrees = this.getDirectionRotationDegrees(
        dir,
        layer.directionRotation,
      );
      const targetRotation = this.degreesToRadians(targetDegrees);
      const shortestTarget = this.getShortestRotationTarget(
        gameObject.rotation || 0,
        targetRotation,
      );

      this.scene.tweens.add({
        targets: gameObject,
        rotation: shortestTarget,
        duration: 100,
        ease: "Quad.out",
      });
    });

    const bendTarget = dir === "LEFT" ? -1 : dir === "RIGHT" ? 1 : 0;
    this.scene.tweens.add({
      targets: this,
      directionBendX: bendTarget,
      duration: 120,
      ease: "Quad.out",
    });
  }

  public override update(time: number, delta: number) {
    super.update(time, delta);

    this.layersMetadata.forEach((layer, id) => {
      const gameObject = this.layerDrawables.get(id) ?? this.layers.get(id);
      if (!gameObject) return;

      const waveAnim = layer.animations.find((a) => a.type === "wave");
      const wobbleAnim = layer.animations.find((a) => a.type === "wobble");
      const chompAnim = layer.animations.find((a) => a.type === "chomp");
      const flashAnim = layer.animations.find((a) => a.type === "flash");
      const pulseAnim = layer.animations.find((a) => a.type === "pulse");

      const isGraphics = gameObject instanceof Phaser.GameObjects.Graphics;

      if (waveAnim && isGraphics) {
        this.applyWaveAnimation(gameObject, layer, waveAnim, time);
      }
      if (wobbleAnim) {
        this.applyWobbleAnimation(gameObject, layer, wobbleAnim, time);
      }
      if (chompAnim && isGraphics) {
        this.applyChompAnimation(gameObject, layer, chompAnim, time);
      }
      if (flashAnim && isGraphics) {
        this.applyFlashAnimation(gameObject, layer, flashAnim, time);
      }
      if (pulseAnim) {
        this.applyPulseAnimation(gameObject, layer, pulseAnim, time);
      }
    });
  }

  private createDirectionBendTransform(layer: LayerMetadata): PointTransform {
    const bend = layer.directionBend;
    if (!bend || this.directionBendX === 0) return (x, y) => ({ x, y });

    const viewBox = this.metadata.viewBox;
    const pivotY = bend.pivotY ?? viewBox.y + viewBox.height;

    return (x, y) => {
      const normalizedY = (pivotY - y) / viewBox.height;
      return { x: x + this.directionBendX * bend.amount * normalizedY, y };
    };
  }

  private applyWaveAnimation(
    graphics: Phaser.GameObjects.Graphics,
    layer: LayerMetadata,
    anim: AnimationMetadata,
    time: number,
  ) {
    graphics.clear();
    const strokeStyle = this.applyStrokeStyle(graphics, layer);
    if (layer.fill && layer.fill !== "none") {
      graphics.fillStyle(
        Phaser.Display.Color.HexStringToColor(layer.fill).color,
      );
    }

    if (layer.type === "path" && layer.d) {
      const commands = PathTokenizer.tokenize(layer.d);
      graphics.beginPath();
      const transformPoint = this.createDirectionBendTransform(layer);
      const wavePoint = (x: number, y: number) => {
        let damping = 1;
        if (anim.yStart !== undefined && anim.yEnd !== undefined) {
          const yStart = anim.yStart;
          const yEnd = anim.yEnd;
          if (yStart > yEnd) {
            if (y <= yEnd) {
              damping = 0;
            } else if (y < yStart) {
              damping = (y - yEnd) / (yStart - yEnd);
            }
          } else if (yStart < yEnd) {
            if (y >= yEnd) {
              damping = 0;
            } else if (y > yStart) {
              damping = (y - yStart) / (yEnd - yStart);
            }
          }
        }
        const wave =
          Math.sin(
            time * 0.001 * (anim.speed || 1) * anim.frequency + x * 0.1,
          ) *
          anim.amplitude *
          damping;
        return transformPoint(x, y + wave);
      };
      const drawWavedSegment = (
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        points = anim.points || 10,
      ) => {
        for (let i = 1; i <= points; i++) {
          const t = i / points;
          const px = fromX + (toX - fromX) * t;
          const py = fromY + (toY - fromY) * t;
          const point = wavePoint(px, py);
          graphics.lineTo(point.x, point.y);
        }
      };

      let curX = 0;
      let curY = 0;
      let subpathStartX = 0;
      let subpathStartY = 0;

      commands.forEach((cmd) => {
        const { type, params } = cmd;
        const isRelative = type === type.toLowerCase();
        const command = type.toUpperCase();

        if (command === "L" || command === "M") {
          const targetX = isRelative ? curX + params[0] : params[0];
          const targetY = isRelative ? curY + params[1] : params[1];

          if (command === "L") {
            drawWavedSegment(curX, curY, targetX, targetY);
          } else {
            const point = transformPoint(targetX, targetY);
            graphics.moveTo(point.x, point.y);
            subpathStartX = targetX;
            subpathStartY = targetY;
          }
          curX = targetX;
          curY = targetY;
        } else if (command === "A") {
          const rx = params[0];
          const ry = params[1];
          const xAxisRotation = params[2];
          const largeArcFlag = params[3];
          const sweepFlag = params[4];
          const targetX = isRelative ? curX + params[5] : params[5];
          const targetY = isRelative ? curY + params[6] : params[6];

          this.drawSVGPathArc(
            graphics,
            curX,
            curY,
            [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, targetX, targetY],
            wavePoint,
          );
          curX = targetX;
          curY = targetY;
        } else {
          if (command === "Z") {
            drawWavedSegment(curX, curY, subpathStartX, subpathStartY);
            graphics.closePath();
            curX = subpathStartX;
            curY = subpathStartY;
            return;
          }
          const result = this.executeCommand(graphics, cmd, curX, curY);
          curX = result.x;
          curY = result.y;
        }
      });

      if (layer.fill && layer.fill !== "none") graphics.fillPath();
      if (strokeStyle) graphics.strokePath();
    }
  }

  private applyWobbleAnimation(
    graphics: LayerGameObject,
    layer: LayerMetadata,
    anim: AnimationMetadata,
    time: number,
  ) {
    const wobbleX =
      Math.sin(time * 0.001 * (anim.speed || 1) * anim.frequency) *
      anim.amplitude;
    const wobbleY =
      Math.cos(time * 0.001 * (anim.speed || 1) * anim.frequency) *
      anim.amplitude;

    const translateMatch = layer.transform?.match(
      /translate\(([^,)\s]+)[,\s]*([^,)\s]*)\)/,
    );
    const baseX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const baseY =
      translateMatch && translateMatch[2] ? parseFloat(translateMatch[2]) : 0;

    graphics.x = baseX + wobbleX;
    graphics.y = baseY + wobbleY;
  }

  private applyChompAnimation(
    graphics: Phaser.GameObjects.Graphics,
    layer: LayerMetadata,
    anim: AnimationMetadata,
    time: number,
  ) {
    graphics.clear();
    const strokeStyle = this.applyStrokeStyle(graphics, layer);
    if (layer.fill && layer.fill !== "none") {
      graphics.fillStyle(
        Phaser.Display.Color.HexStringToColor(layer.fill).color,
      );
    }

    const mouthAngle =
      (Math.sin(time * 0.001 * (anim.speed || 1) * anim.frequency) + 1) *
      0.5 *
      anim.amplitude;
    const mouthRad = (mouthAngle * Math.PI) / 180;

    if (layer.type === "circle") {
      const radius = layer.r || 14;
      const cx = layer.cx || 0;
      const cy = layer.cy || 0;

      const inDirectionRotationContext =
        this.directionRotationContext.get(layer.id) === true;
      const gapCenter = inDirectionRotationContext
        ? 0
        : this.getChompGapCenter();
      const startAngle = gapCenter + mouthRad / 2;
      const endAngle = startAngle + Math.PI * 2 - mouthRad;

      graphics.beginPath();
      graphics.arc(cx, cy, radius, startAngle, endAngle, false);
      graphics.lineTo(cx, cy);
      graphics.closePath();

      if (layer.fill && layer.fill !== "none") graphics.fillPath();
      if (strokeStyle) graphics.strokePath();
    }
  }

  private applyFlashAnimation(
    graphics: Phaser.GameObjects.Graphics,
    layer: LayerMetadata,
    anim: AnimationMetadata,
    time: number,
  ) {
    const isFirstColor =
      Math.sin(time * 0.001 * (anim.speed || 1) * anim.frequency) > 0;
    const colorStr = isFirstColor
      ? anim.color1 || layer.fill || "#ffffff"
      : anim.color2 || "#ffffff";
    if (colorStr === "none") return;

    graphics.clear();
    const strokeColor =
      layer.stroke && layer.stroke !== "none" ? colorStr : layer.stroke;
    this.drawLayer(layer, graphics, colorStr, strokeColor);
  }

  private applyPulseAnimation(
    gameObject: LayerGameObject,
    layer: LayerMetadata,
    anim: AnimationMetadata,
    time: number,
  ) {
    const phase = Math.sin(
      time * 0.001 * (anim.speed || 1) * anim.frequency * Math.PI * 2,
    );
    const pulse = phase * anim.amplitude;
    gameObject.alpha = (layer.opacity ?? 1) * Math.max(0, 1 + pulse);
    gameObject.setScale(Math.max(0.01, 1 + pulse));
  }

  private getDirectionRotationDegrees(
    direction: string,
    metadata: DirectionRotationMetadata,
  ): number {
    switch (direction) {
      case "LEFT":
        return metadata.LEFT;
      case "UP":
        return metadata.UP;
      case "DOWN":
        return metadata.DOWN;
      default:
        return metadata.RIGHT;
    }
  }

  private degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private getShortestRotationTarget(
    currentRotation: number,
    targetRotation: number,
  ): number {
    const fullTurn = Math.PI * 2;
    let wrappedDelta =
      ((((targetRotation - currentRotation + Math.PI) % fullTurn) + fullTurn) %
        fullTurn) -
      Math.PI;
    if (wrappedDelta === -Math.PI) {
      wrappedDelta = Math.PI;
    }
    return currentRotation + wrappedDelta;
  }

  private getChompGapCenter(): number {
    switch (this.currentDirection) {
      case "LEFT":
        return Math.PI;
      case "UP":
        return -Math.PI / 2;
      case "DOWN":
        return Math.PI / 2;
      default:
        return 0;
    }
  }
}
