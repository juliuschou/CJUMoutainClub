import { describe, expect, it, vi } from "vitest";
import { convertWmf } from "@/../scripts/build-content";

function missingExecutableError() {
  return Object.assign(new Error("command not found"), { code: "ENOENT" });
}

describe("convertWmf", () => {
  it("falls back to ImageMagick 6's convert when magick is unavailable", async () => {
    const runCommand = vi.fn(async (command: string) => {
      if (command === "magick") throw missingExecutableError();
    });

    await convertWmf("source.wmf", "output.png", runCommand);

    expect(runCommand).toHaveBeenNthCalledWith(1, "magick", ["source.wmf", "output.png"]);
    expect(runCommand).toHaveBeenNthCalledWith(2, "convert", ["source.wmf", "output.png"]);
  });

  it("does not mask conversion failures from an available executable", async () => {
    const conversionError = new Error("WMF delegate unavailable");
    const runCommand = vi.fn(async () => {
      throw conversionError;
    });

    await expect(convertWmf("source.wmf", "output.png", runCommand)).rejects.toBe(conversionError);
    expect(runCommand).toHaveBeenCalledTimes(1);
  });

  it("reports an actionable error when neither executable is available", async () => {
    const runCommand = vi.fn(async () => {
      throw missingExecutableError();
    });

    await expect(convertWmf("source.wmf", "output.png", runCommand)).rejects.toThrow(
      "WMF conversion requires ImageMagick (`magick` or `convert`) to be installed and available on PATH.",
    );
    expect(runCommand).toHaveBeenCalledTimes(2);
  });
});
