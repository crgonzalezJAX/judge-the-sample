// All population and sampling calculations for this app live here.
export function parseClinicCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const columns = lines.shift().split(",");
  const expected = ["visit_id", "week", "weekday", "slot", "visit_type", "wait_time"];
  if (columns.join(",") !== expected.join(",")) throw new Error("Unexpected clinic CSV columns");

  return lines.map((line, index) => {
    const values = line.split(",");
    if (values.length !== columns.length) throw new Error(`Invalid CSV row ${index + 2}`);
    const [visitId, week, weekday, slot, visitType, waitTime] = values;
    const row = {
      visit_id: Number(visitId),
      week: Number(week),
      weekday,
      slot: Number(slot),
      visit_type: visitType,
      wait_time: Number(waitTime),
    };
    if (![row.visit_id, row.week, row.slot, row.wait_time].every(Number.isFinite)) {
      throw new Error(`Invalid number in CSV row ${index + 2}`);
    }
    return row;
  });
}

export function mean(rows) {
  if (!rows.length) throw new Error("Cannot calculate a mean of no rows");
  return rows.reduce((sum, row) => sum + row.wait_time, 0) / rows.length;
}

export function trueMean(population) {
  return mean(population);
}

export function sampleMean(sample) {
  return mean(sample);
}

function seededRandom(seed) {
  let state = 2166136261;
  for (const char of String(seed)) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// Partial Fisher-Yates shuffle: every set of n distinct rows is equally likely.
export function simpleRandomSample(population, n, seed) {
  if (!Number.isInteger(n) || n < 1 || n > population.length) {
    throw new RangeError("Sample size must be an integer from 1 through N");
  }
  const random = seededRandom(seed);
  const indices = Array.from({ length: population.length }, (_, index) => index);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(random() * (indices.length - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, n).map((index) => population[index]);
}

export function systematicSample(population, n, seed) {
  if (!Number.isInteger(n) || n < 1 || n > population.length) {
    throw new RangeError("Sample size must be an integer from 1 through N");
  }
  const interval = population.length / n;
  const random = seededRandom(seed);
  if (Number.isInteger(interval)) {
    const start = Math.floor(random() * interval) + 1;
    return {
      rows: Array.from({ length: n }, (_, j) => population[start - 1 + j * interval]),
      interval,
      start,
      design: "whole-number",
    };
  }
  const start = (1 - random()) * interval; // Uniform on (0, interval].
  const rows = Array.from({ length: n }, (_, j) => {
    const oneBasedIndex = Math.min(population.length, Math.ceil(start + j * interval));
    return population[oneBasedIndex - 1];
  });
  return { rows, interval, start, design: "fractional" };
}

export function stratifiedAllocation(population, n, column = "visit_type") {
  const groups = new Map();
  for (const row of population) {
    const key = row[column];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const strata = [...groups].map(([name, rows]) => ({ name, rows, size: rows.length, weight: rows.length / population.length }));
  if (!Number.isInteger(n) || n < strata.length || n > population.length) {
    throw new RangeError(`Stratified sampling needs at least ${strata.length} rows, one per group, and at most N`);
  }
  const allocated = strata.map((stratum) => {
    const quota = n * stratum.weight;
    return { ...stratum, quota, allocation: Math.max(1, Math.min(stratum.size, Math.floor(quota))) };
  });
  let total = allocated.reduce((sum, stratum) => sum + stratum.allocation, 0);
  while (total < n) {
    const next = allocated.filter((s) => s.allocation < s.size)
      .sort((a, b) => (b.quota - b.allocation) - (a.quota - a.allocation))[0];
    next.allocation++;
    total++;
  }
  while (total > n) {
    const next = allocated.filter((s) => s.allocation > 1)
      .sort((a, b) => (a.quota - a.allocation) - (b.quota - b.allocation))[0];
    next.allocation--;
    total--;
  }
  return allocated;
}

export function stratifiedSample(population, n, seed, column = "visit_type") {
  const strata = stratifiedAllocation(population, n, column).map((stratum) => ({
    ...stratum,
    sample: simpleRandomSample(stratum.rows, stratum.allocation, `${seed}:${column}:${stratum.name}`),
  }));
  return { rows: strata.flatMap((stratum) => stratum.sample), strata };
}

export function weightedStratifiedMean(strata) {
  return strata.reduce((sum, stratum) => sum + stratum.weight * sampleMean(stratum.sample), 0);
}

// Return new rows in the new file order. The source rows and their original slot values stay intact.
export function sortedWithinDaysCopy(population) {
  const days = new Map();
  for (const row of population) {
    const key = `${row.week}:${row.weekday}`;
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(row);
  }
  return [...days.values()].flatMap((day) => day
    .map((row, originalPosition) => ({ row, originalPosition }))
    .sort((a, b) => b.row.wait_time - a.row.wait_time || a.originalPosition - b.originalPosition)
    .map(({ row }, index) => ({ ...row, sorted_position: index + 1 })));
}

export function summarizeEstimates(estimates, populationMean) {
  if (!estimates.length) throw new Error("At least one estimate is required");
  const average = estimates.reduce((sum, value) => sum + value, 0) / estimates.length;
  const bias = average - populationMean;
  const sd = Math.sqrt(estimates.reduce((sum, value) => sum + (value - average) ** 2, 0) / estimates.length);
  const rmse = Math.sqrt(estimates.reduce((sum, value) => sum + (value - populationMean) ** 2, 0) / estimates.length);
  return { bias, sd, rmse };
}

export function enumerateSystematicStarts(population, n) {
  const interval = population.length / n;
  if (!Number.isInteger(n) || n < 1 || n > population.length || !Number.isInteger(interval)) {
    throw new RangeError("Exact enumeration needs a whole-number systematic interval");
  }
  return Array.from({ length: interval }, (_, index) => {
    const start = index + 1;
    const rows = Array.from({ length: n }, (_, j) => population[start - 1 + j * interval]);
    return { start, rows, estimate: sampleMean(rows) };
  });
}

export function repeatedSampling(population, method, n, repetitions, seed, onDraw) {
  const populationMean = trueMean(population);
  if (method === "systematic" && Number.isInteger(population.length / n)) {
    const starts = enumerateSystematicStarts(population, n);
    const estimates = starts.map((item) => item.estimate);
    return { method, n, type: "exact", count: starts.length, starts: starts.map((item) => item.start), estimates,
      interval: population.length / n, ...summarizeEstimates(estimates, populationMean) };
  }
  if (!Number.isInteger(n) || n < 1 || n > population.length) throw new RangeError("Invalid sample size");
  if (!["srs", "systematic", "stratified"].includes(method)) throw new Error("Unknown sampling method");
  if (!Number.isInteger(repetitions) || repetitions < 100) {
    throw new RangeError("Monte Carlo needs at least 100 repetitions");
  }
  const estimates = [];
  for (let repetition = 0; repetition < repetitions; repetition++) {
    const drawSeed = `${seed}:${method}:${n}:${repetition}`;
    if (method === "srs") {
      const rows = simpleRandomSample(population, n, drawSeed);
      onDraw?.(rows);
      estimates.push(sampleMean(rows));
    }
    if (method === "systematic") {
      const rows = systematicSample(population, n, drawSeed).rows;
      onDraw?.(rows);
      estimates.push(sampleMean(rows));
    }
    if (method === "stratified") {
      const draw = stratifiedSample(population, n, drawSeed);
      onDraw?.(draw.rows);
      estimates.push(weightedStratifiedMean(draw.strata));
    }
  }
  return { method, n, type: "Monte Carlo", count: repetitions, seed, estimates,
    ...(method === "stratified" ? { strata: stratifiedAllocation(population, n).map(({ name, size, allocation, weight }) => ({ name, size, allocation, weight })) } : {}),
    ...(method === "systematic" ? { interval: population.length / n } : {}),
    ...summarizeEstimates(estimates, populationMean) };
}

export function runBaselineExperiments(population, repetitions, seed) {
  const srs100 = repeatedSampling(population, "srs", 100, repetitions, seed);
  return {
    populationMean: trueMean(population),
    A: [srs100, repeatedSampling(population, "systematic", 100, repetitions, seed), repeatedSampling(population, "stratified", 100, repetitions, seed)],
    B: [repeatedSampling(population, "srs", 1, repetitions, seed), repeatedSampling(population, "srs", 10, repetitions, seed), srs100],
  };
}

export function runChallenge(population, sortedCopy, repetitions, seed, matchingBaselineSrs = null) {
  const n = 100;
  const baselineMean = trueMean(population);
  const sortedMean = trueMean(sortedCopy);
  const baselineSrs = matchingBaselineSrs?.method === "srs" && matchingBaselineSrs.n === n
    && matchingBaselineSrs.count === repetitions && matchingBaselineSrs.seed === seed
    ? matchingBaselineSrs : repeatedSampling(population, "srs", n, repetitions, seed);
  return [
    { condition: "Baseline", populationMean: baselineMean, ...repeatedSampling(population, "systematic", n, repetitions, seed) },
    { condition: "Sorted copy (modified)", populationMean: sortedMean, ...repeatedSampling(sortedCopy, "systematic", n, repetitions, seed) },
    { condition: "Baseline", populationMean: baselineMean, ...baselineSrs },
    { condition: "Sorted copy (modified)", populationMean: sortedMean, ...repeatedSampling(sortedCopy, "srs", n, repetitions, seed) },
  ];
}
