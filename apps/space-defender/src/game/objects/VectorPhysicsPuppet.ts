import { Physics, Scene } from "phaser";
import { VectorPuppet } from "@neon-cabinet/sprite-tools";
import type { SVGPuppetMetadata } from "@neon-cabinet/sprite-tools";

export class VectorPhysicsPuppet extends VectorPuppet {
  declare public body: Physics.Arcade.Body | Physics.Arcade.StaticBody;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    metadata: SVGPuppetMetadata,
    bodyWidth: number,
    bodyHeight: number,
  ) {
    super(scene, x, y, metadata);
    this.setSize(bodyWidth, bodyHeight);
    if (!this.body) {
      scene.physics.add.existing(this);
    }
  }

  protected get arcadeBody(): Physics.Arcade.Body {
    return this.body as Physics.Arcade.Body;
  }

  protected setBodySize(width: number, height: number): void {
    this.setSize(width, height);
    this.arcadeBody.setSize(width, height);
    this.arcadeBody.setOffset(-width / 2, -height / 2);
  }

  setVelocity(x: number, y: number): this {
    this.arcadeBody.setVelocity(x, y);
    return this;
  }

  setAcceleration(x: number, y: number): this {
    this.arcadeBody.setAcceleration(x, y);
    return this;
  }

  setDrag(value: number): this {
    this.arcadeBody.setDrag(value, value);
    return this;
  }

  setDamping(value: boolean): this {
    this.arcadeBody.useDamping = value;
    return this;
  }

  setMaxVelocity(value: number): this {
    this.arcadeBody.setMaxVelocity(value, value);
    return this;
  }

  setCollideWorldBounds(value: boolean): this {
    this.arcadeBody.setCollideWorldBounds(value);
    return this;
  }
}
