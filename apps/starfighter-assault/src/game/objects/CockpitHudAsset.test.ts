import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("cockpit HUD vector asset", () => {
  it("exposes HUD sockets, editable ellipses, and state-driven layers", () => {
    const assetPath = join(
      process.cwd(),
      "public/assets/vector/cockpit-hud.svg",
    );
    expect(existsSync(assetPath)).toBe(true);

    const doc = new DOMParser().parseFromString(
      readFileSync(assetPath, "utf8"),
      "image/svg+xml",
    );
    const byId = (id: string) => doc.getElementById(id);
    const getStateStyles = (id: string) =>
      JSON.parse(byId(id)?.getAttribute("data-hud-state-styles") ?? "{}") as
        | Record<string, Record<string, string | number>>
        | undefined;

    expect(byId("socket_radar_center")).toMatchObject({
      id: "socket_radar_center",
    });
    expect(byId("socket_radar_center")?.getAttribute("data-hud-role")).toBe(
      "radar-center",
    );
    expect(byId("socket_radar_center")?.getAttribute("data-hud-bind")).toBe(
      "radar",
    );
    expect(byId("socket_reticle_center")?.getAttribute("data-hud-role")).toBe(
      "reticle-center",
    );
    expect(byId("socket_reticle_center")?.getAttribute("data-hud-bind")).toBe(
      "reticle",
    );

    expect(byId("radar_bezel")?.tagName.toLowerCase()).toBe("ellipse");
    expect(byId("radar_bezel")?.getAttribute("data-hud-role")).toBe(
      "radar-bezel",
    );
    expect(byId("radar_bezel")?.getAttribute("data-hud-bind")).toBe("radar");

    expect(byId("torpedo_meter")?.getAttribute("data-hud-role")).toBe(
      "ammo-indicator",
    );
    expect(byId("torpedo_meter")?.getAttribute("data-hud-bind")).toBe(
      "torpedoes",
    );
    expect(getStateStyles("torpedo_meter")?.empty).toMatchObject({
      stroke: "#ff43d6",
      opacity: 0.45,
    });

    expect(byId("shield_meter")?.getAttribute("data-hud-role")).toBe(
      "shield-indicator",
    );
    expect(byId("shield_meter")?.getAttribute("data-hud-bind")).toBe("shields");
    expect(getStateStyles("shield_meter")?.down).toMatchObject({
      stroke: "#ff43d6",
      opacity: 0.42,
    });
  });
});
