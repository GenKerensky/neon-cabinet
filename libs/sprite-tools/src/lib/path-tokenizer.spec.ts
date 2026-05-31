import { describe, it, expect } from "vitest";
import { PathTokenizer } from "./path-tokenizer.js";

describe("PathTokenizer", () => {
  it("should tokenize simple move and line commands", () => {
    const d = "M 10 20 L 30 40";
    const tokens = PathTokenizer.tokenize(d);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toEqual({ type: "M", params: [10, 20] });
    expect(tokens[1]).toEqual({ type: "L", params: [30, 40] });
  });

  it("should handle comma separators", () => {
    const d = "M10,20L30,40Z";
    const tokens = PathTokenizer.tokenize(d);
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toEqual({ type: "M", params: [10, 20] });
    expect(tokens[1]).toEqual({ type: "L", params: [30, 40] });
    expect(tokens[2]).toEqual({ type: "Z", params: [] });
  });

  it("should handle negative numbers and decimals", () => {
    const d = "M-10.5 20.2 L -30 -40.5";
    const tokens = PathTokenizer.tokenize(d);
    expect(tokens[0].params).toEqual([-10.5, 20.2]);
    expect(tokens[1].params).toEqual([-30, -40.5]);
  });

  it("should tokenize complex curves (C, Q)", () => {
    const d = "C 10 20 30 40 50 60 Q 70 80 90 100";
    const tokens = PathTokenizer.tokenize(d);
    expect(tokens[0]).toEqual({ type: "C", params: [10, 20, 30, 40, 50, 60] });
    expect(tokens[1]).toEqual({ type: "Q", params: [70, 80, 90, 100] });
  });
});
