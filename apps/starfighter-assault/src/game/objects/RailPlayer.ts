export interface FlightBox {
  width: number;
  height: number;
}

export interface FlightPoint {
  x: number;
  y: number;
}

export class RailPlayer {
  readonly position: FlightPoint = { x: 0, y: 0 };
  readonly target: FlightPoint = { x: 0, y: 0 };

  constructor(private readonly flightBox: FlightBox) {}

  setPointerTarget(x: number, y: number): void {
    const halfWidth = this.flightBox.width / 2;
    const halfHeight = this.flightBox.height / 2;

    this.target.x = Math.max(-halfWidth, Math.min(halfWidth, x));
    this.target.y = Math.max(-halfHeight, Math.min(halfHeight, y));
  }

  update(deltaSeconds: number): void {
    const ease = Math.min(1, deltaSeconds * 6);

    this.position.x += (this.target.x - this.position.x) * ease;
    this.position.y += (this.target.y - this.position.y) * ease;
  }
}
