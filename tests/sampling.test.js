import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseClinicCsv, simpleRandomSample, systematicSample, stratifiedAllocation,
  stratifiedSample, weightedStratifiedMean, trueMean,
} from "../src/sampling.js";

const rows = parseClinicCsv(readFileSync(new URL("../data/clinic_visits.csv", import.meta.url), "utf8"));
const ids = (sample) => sample.map((row) => row.visit_id);
const distinct = (sample, n) => {
  assert.equal(sample.length, n);
  assert.equal(new Set(ids(sample)).size, n);
  assert.ok(sample.every((row) => rows.includes(row)));
};

test("loads every appointment with a numeric target", () => {
  assert.equal(rows.length, 10000);
  assert.ok(rows.every((row) => Number.isFinite(row.wait_time)));
  assert.ok(Number.isFinite(trueMean(rows)));
});

for (const n of [1, 10, 100, 137]) {
  test(`SRS and systematic each select ${n} distinct rows`, () => {
    distinct(simpleRandomSample(rows, n, "test-seed"), n);
    const result = systematicSample(rows, n, "test-seed");
    distinct(result.rows, n);
    assert.equal(result.design, Number.isInteger(rows.length / n) ? "whole-number" : "fractional");
    assert.deepEqual(ids(result.rows), Array.from({ length: n }, (_, j) => {
      const oneBased = result.design === "whole-number"
        ? result.start + j * result.interval
        : Math.min(rows.length, Math.ceil(result.start + j * result.interval));
      return rows[oneBased - 1].visit_id;
    }));
  });
}

test("the same seed reproduces each method's selected rows", () => {
  assert.deepEqual(ids(simpleRandomSample(rows, 100, "same")), ids(simpleRandomSample(rows, 100, "same")));
  assert.deepEqual(ids(systematicSample(rows, 137, "same").rows), ids(systematicSample(rows, 137, "same").rows));
  assert.deepEqual(ids(stratifiedSample(rows, 100, "same").rows), ids(stratifiedSample(rows, 100, "same").rows));
});

for (const n of [3, 10, 100, 137, 10000]) {
  test(`stratified allocation is valid at n = ${n}`, () => {
    const strata = stratifiedAllocation(rows, n);
    assert.equal(strata.reduce((sum, s) => sum + s.allocation, 0), n);
    assert.ok(strata.every((s) => Number.isInteger(s.allocation) && s.allocation >= 1 && s.allocation <= s.size));
    assert.ok(Math.abs(strata.reduce((sum, s) => sum + s.weight, 0) - 1) < 1e-12);
    distinct(stratifiedSample(rows, n, "test-seed").rows, n);
  });
}

test("stratified sampling rejects n below the number of groups", () => {
  assert.throws(() => stratifiedSample(rows, 2, "test-seed"), RangeError);
});

test("weighted estimator gives the known answer on a small population", () => {
  const strata = [
    { weight: 3 / 4, sample: [{ wait_time: 0 }] },
    { weight: 1 / 4, sample: [{ wait_time: 12 }] },
  ];
  assert.equal(weightedStratifiedMean(strata), 3);
});
