import type { DebugOverlayOptions } from "./types";

const STORAGE_KEY = "neon-debug-overlay-visible";

export class DebugOverlay {
  private container: HTMLDivElement | null = null;
  private visible = true;
  private options: DebugOverlayOptions;

  constructor(options: DebugOverlayOptions) {
    this.options = options;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      this.visible = stored === "true";
    }
    this.createOverlay();
    this.bindToggle();
  }

  private createOverlay(): void {
    this.container = document.createElement("div");
    this.container.id = "neon-debug";
    Object.assign(this.container.style, {
      position: "fixed",
      bottom: "8px",
      left: "8px",
      zIndex: "10000",
      background: "rgba(0, 0, 0, 0.75)",
      color: "#0f0",
      fontFamily: "monospace",
      fontSize: "12px",
      padding: "8px 12px",
      borderRadius: "4px",
      whiteSpace: "pre-wrap",
      pointerEvents: "none",
      display: this.visible ? "block" : "none",
      maxHeight: "40vh",
      overflow: "auto",
    });
    document.body.appendChild(this.container);
  }

  private bindToggle(): void {
    window.addEventListener("keydown", (e) => {
      if (e.key === "F9") {
        e.preventDefault();
        this.visible = !this.visible;
        if (this.container) {
          this.container.style.display = this.visible ? "block" : "none";
        }
        localStorage.setItem(STORAGE_KEY, String(this.visible));
      }
    });
  }

  update(): void {
    if (!this.container || !this.visible) return;

    const state = this.options.getState();
    const scene = this.options.getScene();
    const seed = this.options.getSeed();

    const lines: string[] = [];
    lines.push(`Scene: ${scene}`);
    lines.push(`Seed: ${seed}`);

    if (state && typeof state === "object") {
      for (const [key, value] of Object.entries(
        state as Record<string, unknown>,
      )) {
        if (value !== null && typeof value === "object") {
          lines.push(`${key}:`);
          for (const [k, v] of Object.entries(
            value as Record<string, unknown>,
          )) {
            lines.push(`  ${k}: ${JSON.stringify(v)}`);
          }
        } else {
          lines.push(`${key}: ${JSON.stringify(value)}`);
        }
      }
    }

    this.container.textContent = lines.join("\n");
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
  }
}
