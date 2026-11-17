import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseClinicCsv, simpleRandomSample, sampleMean, trueMean } from "../src/sampling.js";

const rows = parseClinicCsv(readFileSync(new URL("../data/clinic_visits.csv", import.meta.url), "utf8"));

test("loads every appointment and parses target as numbers", () => {
  assert.equal(rows.length, 10000);
  assert.ok(rows.every((row) => Number.isFinite(row.wait_time)));
  assert.equal(new Set(rows.map((row) => row.visit_id)).size, rows.length);
});

test("SRS selects 100 distinct population rows", () => {
  const sample = simpleRandomSample(rows, 100, "test-seed");
  assert.equal(sample.length, 100);
  assert.equal(new Set(sample.map((row) => row.visit_id)).size, 100);
  assert.ok(sample.every((row) => rows.includes(row)));
});

test("same seed reproduces the same rows", () => {
  const ids = (seed) => simpleRandomSample(rows, 100, seed).map((row) => row.visit_id);
  assert.deepEqual(ids("test-seed"), ids("test-seed"));
});

test("shared mean functions return numeric results", () => {
  assert.ok(Number.isFinite(trueMean(rows)));
  assert.ok(Number.isFinite(sampleMean(simpleRandomSample(rows, 100, "test-seed"))));
});
