import { AppElement } from "./app.element";

describe("AppElement", () => {
  let app: AppElement;

  beforeEach(() => {
    app = new AppElement();
  });

  it("should create successfully", () => {
    expect(app).toBeTruthy();
  });

  it("renders the vector studio workbench", () => {
    app.connectedCallback();

    expect(app.querySelector("h1")?.textContent).toContain("Vector Studio");
    expect(app.querySelector("#asset-select")?.textContent).toContain(
      "Space Defender Ship",
    );
    expect(app.querySelector(".warnings")?.textContent).toContain(
      "Unsupported Elements",
    );
  });
});
