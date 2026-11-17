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
