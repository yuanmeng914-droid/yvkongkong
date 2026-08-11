import test from "node:test";
import assert from "node:assert/strict";
import { parseAgentRequest } from "./request-validation.js";

test("accepts health_check as a valid agent action", () => {
  assert.deepEqual(parseAgentRequest({ action: "health_check" }), {
    ok: true,
    value: { action: "health_check", input: "", context: {} },
  });
});

test("normalizes malformed requests to invalid_request", () => {
  assert.deepEqual(parseAgentRequest({ action: "not-supported" }), {
    ok: false,
    error: "invalid_request",
  });
});

test("requires a valid selected day for daily_analysis", () => {
  assert.deepEqual(parseAgentRequest({ action: "daily_analysis", context: { day: "2026-08-11" } }), {
    ok: true,
    value: { action: "daily_analysis", input: "", context: { day: "2026-08-11", force: false } },
  });
  assert.deepEqual(parseAgentRequest({ action: "daily_analysis", context: { day: "not-a-date" } }), {
    ok: false,
    error: "invalid_request",
  });
});
