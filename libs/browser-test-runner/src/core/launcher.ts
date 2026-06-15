import { execSync } from "child_process";
import { mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

interface LaunchResult {
  executablePath: string;
  cdpUrl: string;
  tempDir: string;
}

export class BrowserLauncher {
  static async detect(): Promise<string> {
    const platform = process.platform;

    if (platform === "linux") {
      const candidates = [
        "google-chrome",
        "google-chrome-stable",
        "chromium",
        "chromium-browser",
      ];

      for (const cmd of candidates) {
        try {
          execSync(`${cmd} --version`, { stdio: "ignore" });
          return cmd;
        } catch {
          continue;
        }
      }

      try {
        execSync("flatpak run org.chromium.Chromium --version", {
          stdio: "ignore",
        });
        return "flatpak run org.chromium.Chromium";
      } catch {
        // continue
      }
    }

    if (platform === "win32") {
      const paths = [
        join(
          process.env.ProgramFiles ?? "",
          "Google",
          "Chrome",
          "Application",
          "chrome.exe",
        ),
        join(
          process.env["ProgramFiles(x86)"] ?? "",
          "Google",
          "Chrome",
          "Application",
          "chrome.exe",
        ),
      ];

      for (const p of paths) {
        try {
          execSync(`"${p}" --version`, { stdio: "ignore" });
          return p;
        } catch {
          continue;
        }
      }
    }

    return "chromium";
  }

  static async launch(
    executablePath?: string,
    port = 9222,
  ): Promise<LaunchResult> {
    const bin = executablePath ?? (await BrowserLauncher.detect());
    const tempDir = mkdtempSync(join(tmpdir(), "neon-cabinet-"));

    const args = [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tempDir}`,
      "--no-first-run",
      "--disable-extensions",
      "--disable-default-apps",
    ];

    const { spawn } = await import("child_process");
    const child = spawn(bin, args, { detached: true, stdio: "ignore" });
    child.unref();

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      executablePath: bin,
      cdpUrl: `http://127.0.0.1:${port}`,
      tempDir,
    };
  }
}
