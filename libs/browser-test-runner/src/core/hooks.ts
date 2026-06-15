import { chromium } from "playwright";
import type { BrowserWorld } from "./world";

export class BrowserHooks {
  private world: BrowserWorld;
  private headed: boolean;

  constructor(world: BrowserWorld, headed = false) {
    this.world = world;
    this.headed = headed;
  }

  async before(): Promise<void> {
    this.world.browser = await chromium.launch({
      headless: !this.headed,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
    this.world.context = await this.world.browser.newContext({
      viewport: { width: 800, height: 600 },
    });
    this.world.page = await this.world.context.newPage();
    this.world.page.on("framenavigated", (frame) => {
      console.log(
        `[HOOKS] Frame navigated: ${frame.url().substring(frame.url().lastIndexOf("/") + 1)}`,
      );
    });
    this.world.page.on("crash", () => {
      console.log(`[HOOKS] Page crashed!`);
    });
    this.world.page.on("close", () => {
      console.log(`[HOOKS] Page closed!`);
    });
    this.world.page.on("console", (msg) => {
      if (
        msg.type() === "error" ||
        msg.type() === "warning" ||
        msg.type() === "log"
      ) {
        console.log(`[HOOKS] ${msg.type()}: ${msg.text()}`);
      }
    });
    this.world.page.on("pageerror", (err) => {
      console.log(`[HOOKS] pageerror: ${err.message}`);
    });
    await this.world.page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        type: any,
        ...rest: any[]
      ) {
        const gl: any = orig.call(this, type, ...rest);
        if (gl && (type === "webgl2" || type === "webgl")) {
          gl.drawArrays = () => {};
          gl.drawElements = () => {};
          gl.clear = () => {};
          gl.clearColor = () => gl;
          gl.clearDepth = () => gl;
          gl.clearStencil = () => gl;
          gl.flush = () => gl;
          gl.finish = () => gl;
        }
        return gl;
      };
    });
  }

  async after(): Promise<void> {
    await this.world.context?.close().catch(() => {});
    await this.world.browser?.close().catch(() => {});
  }
}
