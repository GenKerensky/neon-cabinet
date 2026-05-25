/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any */

if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = ((..._args: any[]) => {
    return {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      canvas: null,
      fillRect: () => {},
      strokeRect: () => {},
      clearRect: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      rotate: () => {},
      translate: () => {},
      fill: () => {},
      stroke: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      getImageData: () => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      }),
      putImageData: () => {},
      drawImage: () => {},
      measureText: () => ({ width: 0 }),
      fillText: () => {},
      strokeText: () => {},
    };
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
