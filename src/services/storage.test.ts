import { it, expect } from "vitest";
import { parseImport } from "./storage";
import { defaults } from "../types";
it("rejects unsafe or unsupported backups", () => {
  expect(() => parseImport('{"version":2}')).toThrow();
  expect(() => parseImport("not json")).toThrow();
});
it("validates a complete portable backup", () =>
  expect(
    parseImport(
      JSON.stringify({
        version: 1,
        tasks: [],
        checkins: [],
        settings: defaults,
      }),
    ).version,
  ).toBe(1));
