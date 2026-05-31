import type { ErrorCaptureApi, CapturedError } from "./types";

const MAX_ERRORS = 100;

export class ErrorCapture implements ErrorCaptureApi {
  private errors: CapturedError[] = [];

  capture(error: Error): void {
    this.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    });
    if (this.errors.length > MAX_ERRORS) {
      this.errors.shift();
    }
  }

  clear(): void {
    this.errors = [];
  }

  getErrors(): CapturedError[] {
    return [...this.errors];
  }

  get length(): number {
    return this.errors.length;
  }
}
