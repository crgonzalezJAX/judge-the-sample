import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseClinicCsv, simpleRandomSample, systematicSample, stratifiedAllocation,
  stratifiedSample, weightedStratifiedMean, trueMean,
  summarizeEstimates, enumerateSystematicStarts, repeatedSampling, runBaselineExperiments,
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

const synthetic = Array.from({ length: 6 }, (_, index) => ({
  visit_id: index + 1,
  visit_type: index < 3 ? "A" : "B",
  wait_time: index + 1,
}));

test("100 seeded repetitions each draw n distinct rows and produce 100 estimates", () => {
  for (const [method, n] of [["srs", 2], ["systematic", 4], ["stratified", 2]]) {
    let draws = 0;
    const result = repeatedSampling(synthetic, method, n, 100, "same", (sample) => {
      draws++;
      assert.equal(sample.length, n);
      assert.equal(new Set(ids(sample)).size, n);
    });
    assert.equal(draws, 100);
    assert.equal(result.estimates.length, 100);
    assert.equal(result.type, "Monte Carlo");
    assert.deepEqual(result.estimates, repeatedSampling(synthetic, method, n, 100, "same").estimates);
  }
});

test("exact systematic enumeration lists each start once", () => {
  const starts = enumerateSystematicStarts(synthetic, 2);
  assert.deepEqual(starts.map((item) => item.start), [1, 2, 3]);
  assert.ok(starts.every((item) => item.rows.length === 2 && new Set(ids(item.rows)).size === 2));
  const result = repeatedSampling(synthetic, "systematic", 2, 0, "unused");
  assert.equal(result.type, "exact");
  assert.equal(result.count, 3);
  assert.deepEqual(result.starts, [1, 2, 3]);
  assert.deepEqual(result.estimates, starts.map((item) => item.estimate));
  assert.equal(result.seed, undefined);
});

test("bias, population SD, RMSE and their identity match a known answer", () => {
  const result = summarizeEstimates([2, 4], 2);
  assert.equal(result.bias, 1);
  assert.equal(result.sd, 1);
  assert.ok(Math.abs(result.rmse - Math.SQRT2) < 1e-12);
  assert.ok(Math.abs(result.rmse ** 2 - result.bias ** 2 - result.sd ** 2) < 1e-12);
});

test("Experiment B reuses Experiment A's SRS n = 100 result", () => {
  const population = Array.from({ length: 100 }, (_, index) => ({
    visit_id: index + 1, visit_type: index < 50 ? "A" : "B", wait_time: index + 1,
  }));
  const result = runBaselineExperiments(population, 100, "same");
  assert.strictEqual(result.A[0], result.B[2]);
  assert.equal(result.A[1].type, "exact");
  assert.ok([...result.A, ...result.B].every((item) => item.estimates.length === item.count));
});
