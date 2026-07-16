import { describe, expect, it } from "vitest";
import { formatMoney, formatPercent, toCsv } from "./utils";

describe("admin utils", () => {
  it("formats money in XOF", () => {
    expect(formatMoney(49000, "XOF")).toContain("490");
  });

  it("formats percent", () => {
    expect(formatPercent(82.5)).toContain("82");
  });

  it("exports CSV safely", () => {
    const csv = toCsv([{ id: 1, note: 'hello, "world"' }]);
    expect(csv).toContain('"hello, ""world"""');
  });
});