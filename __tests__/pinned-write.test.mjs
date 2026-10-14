import { describe, it, expect } from "vitest";
import { outcomeUnknown } from "../src/logic.js";

const err = (props) => Object.assign(new Error("hub text"), props);

describe("outcomeUnknown", () => {
  it("treats no answer, a 400, a UNIQUE answer and a 5xx as possibly stored", () => {
    for (const e of [new TypeError("Failed to fetch"), err({ status: 400 }), err({ status: 400, code: "UNIQUE_CONSTRAINT" }), err({ status: 500 }), err({ status: 503 })]) {
      expect(outcomeUnknown(e)).toBe(true);
    }
  });
  it("treats a refusal as stored nothing", () => {
    for (const status of [403, 404, 409, 413, 415, 429, 507]) expect(outcomeUnknown(err({ status }))).toBe(false);
  });
});
