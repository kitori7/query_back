import { describe, expect, it } from "vitest";
import { formatExportSerial } from "../src/services/batches.service";

describe("export serial formatting", () => {
  it("pads serial numbers to seven digits", () => {
    expect(formatExportSerial(1)).toBe("0000001");
    expect(formatExportSerial(65000)).toBe("0065000");
  });

  it("preserves serial numbers longer than seven digits", () => {
    expect(formatExportSerial(10000000)).toBe("10000000");
  });
});
