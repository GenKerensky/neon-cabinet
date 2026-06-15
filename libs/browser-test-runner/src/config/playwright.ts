export function createPlaywrightConfig(gameName: string, port: number) {
  return {
    testDir: "./step-definitions",
    outputDir: "./test-results",
    timeout: 30000,
    retries: 0,
    use: {
      baseURL: `http://localhost:${port}`,
      headless: true,
      viewport: { width: 800, height: 600 },
      launchOptions: {
        args: ["--use-gl=swiftshader", "--no-sandbox"],
      },
    },
    projects: [
      {
        name: `${gameName}-smoke`,
        grep: /@smoke/,
      },
      {
        name: `${gameName}-full`,
      },
    ],
  };
}
