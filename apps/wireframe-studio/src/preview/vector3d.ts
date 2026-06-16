export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export function rotatePoint(
  point: Vector3Like,
  yawDegrees: number,
  pitchDegrees: number,
): Vector3Like {
  const yaw = (yawDegrees * Math.PI) / 180;
  const pitch = (pitchDegrees * Math.PI) / 180;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const yawedX = point.x * cosYaw + point.z * sinYaw;
  const yawedZ = -point.x * sinYaw + point.z * cosYaw;
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  return {
    x: yawedX,
    y: point.y * cosPitch - yawedZ * sinPitch,
    z: point.y * sinPitch + yawedZ * cosPitch,
  };
}
