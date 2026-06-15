/* eslint-disable @typescript-eslint/no-explicit-any */
import { When } from "@cucumber/cucumber";

When("{int} frames pass", async function (frames: number) {
  const start = Date.now();
  try {
    const state = await (this as any).page.evaluate((n: number) => {
      (window as any).__TEST__?.time?.stepSync(n);
      return (window as any).__TEST__?.state;
    }, frames);
    (this as any).lastState = state;
    console.log(`[TIME] stepSync(${frames}) wall=${Date.now() - start}ms`);
  } catch (e: any) {
    console.log(
      `[TIME] stepSync(${frames}) failed: ${e.message}, using lastState`,
    );
  }
});

/* eslint-enable @typescript-eslint/no-explicit-any */
