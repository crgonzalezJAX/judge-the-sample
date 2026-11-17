import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import csv from "../data/clinic_visits.csv?raw";
import { parseClinicCsv, simpleRandomSample, systematicSample, stratifiedSample, sampleMean, trueMean, weightedStratifiedMean } from "./sampling.js";
import "./style.css";

const population = parseClinicCsv(csv);
const populationMean = trueMean(population);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const byWeekDay = new Map();
for (const row of population) {
  const key = `${row.week}-${row.weekday}`;
  if (!byWeekDay.has(key)) byWeekDay.set(key, []);
  byWeekDay.get(key).push(row);
}
const maxWait = Math.max(...population.map((row) => row.wait_time));
const minWait = Math.min(...population.map((row) => row.wait_time));
const colour = (wait) => {
  const position = maxWait === minWait ? 0 : (wait - minWait) / (maxWait - minWait);
  const low = [20, 82, 155], high = [202, 59, 28];
  return `rgb(${low.map((value, i) => Math.round(value + (high[i] - value) * position)).join(",")})`;
};
const systematicSetting = (sample) => sample.design === "whole-number"
  ? `interval ${sample.interval} rows; start row ${sample.start}`
  : `interval ${sample.interval.toFixed(3)} rows; start ${sample.start.toFixed(3)} within the interval`;

function App() {
  const [view, setView] = useState("overview");
  const [method, setMethod] = useState("srs");
  const [nText, setNText] = useState("100");
  const [seed, setSeed] = useState("clinic-stage-3-2026");
  const n = Number(nText);
  const validN = nText.trim() !== "" && Number.isInteger(n) && n >= 1 && n <= population.length;
  const samples = useMemo(() => validN ? {
    srs: { rows: simpleRandomSample(population, n, seed) },
    systematic: systematicSample(population, n, seed),
    stratified: n >= 3 ? stratifiedSample(population, n, seed) : null,
  } : null, [n, seed, validN]);
  const current = samples?.[method] ?? null;
  const sampledIds = new Set(current?.rows.map((row) => row.visit_id) ?? []);
  const estimate = current ? method === "stratified" ? weightedStratifiedMean(current.strata) : sampleMean(current.rows) : null;
  const methodName = { srs: "Simple random", systematic: "Systematic", stratified: "Stratified" }[method];

  return <main>
    <header>
      <h1>Clinic waiting times</h1>
      <p>Finite population: all {population.length.toLocaleString()} appointments in this file. File order is chronological: weeks 1–100, Mon–Fri, slots 1–20 each day. Interval sampling of an unordered list means something different from sampling a chronological record.</p>
    </header>
    <div className="sample-controls">
      <label>Total sample size, same for all methods: <input type="number" min="1" max={population.length} step="1" value={nText} onChange={(event) => setNText(event.target.value)} /></label>
      <label>Random seed: <input type="text" value={seed} onChange={(event) => setSeed(event.target.value)} /></label>
      {!validN && <strong role="alert">Enter a whole sample size from 1 to {population.length.toLocaleString()}.</strong>}
    </div>
    <div className="method-cards" role="group" aria-label="Choose a sampling method">
      <section className={`method-card ${method === "srs" ? "active" : ""}`}>
        <button type="button" aria-pressed={method === "srs"} onClick={() => setMethod("srs")}>Simple random</button>
        <p>Choose {validN ? n : "n"} distinct appointments at random, without replacement. Every set of that size can be chosen.</p>
        <small>Settings: shared sample size and seed.</small>
      </section>
      <section className={`method-card ${method === "systematic" ? "active" : ""}`}>
        <button type="button" aria-pressed={method === "systematic"} onClick={() => setMethod("systematic")}>Systematic</button>
        <p>Take appointments at an interval from a random start in the file’s chronological row order.</p>
        {samples && <small>{samples.systematic.design === "whole-number" ? "Whole-number" : "Fractional-interval"} design; {systematicSetting(samples.systematic)}. Seed controls start.</small>}
      </section>
      <section className={`method-card ${method === "stratified" ? "active" : ""}`}>
        <button type="button" aria-pressed={method === "stratified"} onClick={() => setMethod("stratified")}>Stratified</button>
        <p>Split by visit type; choose distinct appointments at random within each type. Use population weights for the estimate.</p>
        {validN && n < 3 && <small>Needs at least one appointment per visit type (3 types); no sample at n = {n}.</small>}
        {samples?.stratified && <small>Proportional allocation: {samples.stratified.strata.map((s) => `${s.name} ${s.allocation} (weight ${s.weight.toFixed(3)})`).join("; ")}. Seed controls draws.</small>}
      </section>
    </div>
    <div className="layout">
      <section className="grid-section" aria-labelledby="grid-title">
        <div className="grid-heading"><h2 id="grid-title">Appointments by week and weekday</h2><p>20 marks per cell: slots 1–10 above 11–20. Sampled marks outlined; unsampled faded. Hover for row number, week, weekday, slot, visit type and wait.</p></div>
        <fieldset className="view-toggle" aria-label="Grid view">
          <legend>Grid view</legend>
          <label><input type="radio" name="grid-view" value="overview" checked={view === "overview"} onChange={() => setView("overview")} /> Overview — all 100 weeks</label>
          <label><input type="radio" name="grid-view" value="detail" checked={view === "detail"} onChange={() => setView("detail")} /> Detail — larger marks</label>
        </fieldset>
        <div className={`grid-scroll ${view}`}>
          <div className="calendar" role="table" aria-label="Appointments by week and weekday">
            <div className="corner" role="columnheader">Week ↓ / weekday →</div>
            {days.map((day) => <div className="day-header" role="columnheader" key={day}>{day}</div>)}
            {Array.from({ length: 100 }, (_, index) => index + 1).map((week) => <React.Fragment key={week}>
              <div className="week-label" role="rowheader" aria-label={`Week ${week}`} title={`Week ${week}`}>{view === "detail" || week === 1 || week % 10 === 0 ? week : ""}</div>
              {days.map((day) => <div className="day-cell" role="cell" aria-label={`Week ${week}, ${day}`} key={day}>
                {(byWeekDay.get(`${week}-${day}`) || []).map((row) => {
                  const selected = sampledIds.has(row.visit_id);
                  const label = `Row ${row.visit_id}; week ${row.week}, ${row.weekday}, slot ${row.slot}; ${row.visit_type}; wait ${row.wait_time} minutes${selected ? "; sampled" : ""}`;
                  return <span className={`mark ${selected ? "selected" : "unsampled"}`} style={{ backgroundColor: colour(row.wait_time) }} title={label} aria-label={label} tabIndex={selected ? 0 : -1} key={row.visit_id} />;
                })}
              </div>)}
            </React.Fragment>)}
          </div>
        </div>
        <div className="legend" aria-label={`Wait time colour legend from ${minWait} to ${maxWait} minutes`}><span>Wait time</span><span>Shorter: {minWait} min</span><div className="gradient" /><span>Longer: {maxWait} min</span></div>
        <p className="axis-note">Within each weekday cell: slots 1–10, then 11–20, left to right.</p>
      </section>
      <aside className="summary" aria-label="Sampling summary">
        <h2>{methodName} sample</h2>
        <p>Sample size: {validN ? n : "—"} appointments<br />Seed: <code>{seed}</code></p>
        {method === "systematic" && current && <p>{current.design === "whole-number" ? "Whole-number" : "Fractional-interval"} design in chronological file order; {systematicSetting(current)}.</p>}
        {method === "stratified" && current && <p>Visit type weights: {current.strata.map((s) => `${s.name} ${s.size}/${population.length}`).join("; ")}. Estimate = sum of each weight × that type’s sample mean.</p>}
        {validN && method === "stratified" && n < 3 && <p role="alert">Stratified sampling needs at least one appointment per visit type (3 types). Choose n of at least 3 to draw this sample.</p>}
        <dl><dt>{method === "stratified" ? "Population-weighted sample estimate" : "Sample mean"}</dt><dd>{estimate === null ? "No sample" : `${estimate.toFixed(2)} minutes`}</dd><dt>True population mean</dt><dd>{populationMean.toFixed(2)} minutes</dd></dl>
        <p>The true population mean uses all {population.length.toLocaleString()} appointments in this file.</p>
      </aside>
    </div>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
