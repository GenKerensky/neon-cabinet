import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GradientSlider } from "./gradient-slider";

describe("GradientSlider", () => {
  it("renders an accessible slider with the shared suite gradient class", () => {
    render(
      <GradientSlider aria-label="Preview scale" max={8} min={1} value={[4]} />,
    );

    const slider = screen.getByRole("slider", { name: "Preview scale" });
    expect(slider).toBeTruthy();
    expect(
      slider
        .closest("[data-slot='slider']")
        ?.classList.contains("gradient-slider"),
    ).toBe(true);
  });
});
