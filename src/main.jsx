import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import csv from "../data/clinic_visits.csv?raw";
import { parseClinicCsv, simpleRandomSample, sampleMean, trueMean } from "./sampling.js";
import "./style.css";

const population = parseClinicCsv(csv);
const seed = "clinic-stage-2-2026";
const sample = simpleRandomSample(population, 100, seed);
const sampledIds = new Set(sample.map((row) => row.visit_id));
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
  const low = [20, 82, 155];
  const high = [202, 59, 28];
  return `rgb(${low.map((channel, index) => Math.round(channel + (high[index] - channel) * position)).join(",")})`;
};

function App() {
  const [view, setView] = useState("overview");
  return (
    <main>
      <header>
        <h1>Clinic waiting times</h1>
        <p>Finite population: all {population.length.toLocaleString()} appointments in this file. Rows run chronologically by week, weekday and slot.</p>
      </header>
      <div className="layout">
        <section className="grid-section" aria-labelledby="grid-title">
          <h2 id="grid-title">Appointments by week and weekday</h2>
          <p>Each cell contains 20 appointment marks in slot order, 1–10 above 11–20. Sampled appointments have a dark outline; unsampled appointments are faded. Hover or focus for appointment details.</p>
          <fieldset className="view-toggle" aria-label="Grid view">
            <legend>Grid view</legend>
            <label><input type="radio" name="grid-view" value="overview" checked={view === "overview"} onChange={() => setView("overview")} /> Overview — all 100 weeks</label>
            <label><input type="radio" name="grid-view" value="detail" checked={view === "detail"} onChange={() => setView("detail")} /> Detail — larger marks</label>
          </fieldset>
          <div className={`grid-scroll ${view}`}>
            <div className="calendar" role="table" aria-label="Appointments by week and weekday">
              <div className="corner" role="columnheader">Week ↓ / weekday →</div>
              {days.map((day) => <div className="day-header" role="columnheader" key={day}>{day}</div>)}
              {Array.from({ length: 100 }, (_, index) => index + 1).map((week) => (
                <React.Fragment key={week}>
                  <div className="week-label" role="rowheader" aria-label={`Week ${week}`} title={`Week ${week}`}>
                    {view === "detail" || week === 1 || week % 10 === 0 ? week : ""}
                  </div>
                  {days.map((day) => (
                    <div className="day-cell" role="cell" aria-label={`Week ${week}, ${day}`} key={day}>
                      {(byWeekDay.get(`${week}-${day}`) || []).map((row) => {
                        const selected = sampledIds.has(row.visit_id);
                        const label = `Week ${row.week}, ${row.weekday}, slot ${row.slot}; ${row.visit_type}; wait ${row.wait_time} minutes${selected ? "; sampled" : ""}`;
                        return <span className={`mark ${selected ? "selected" : "unsampled"}`} style={{ backgroundColor: colour(row.wait_time) }} title={label} aria-label={label} tabIndex={selected ? 0 : -1} key={row.visit_id} />;
                      })}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="legend" aria-label={`Wait time colour legend from ${minWait} to ${maxWait} minutes`}>
            <span>Wait time</span><span>Shorter: {minWait} min</span><div className="gradient" /><span>Longer: {maxWait} min</span>
          </div>
          <p className="axis-note">Within each weekday cell: slots 1–10, then 11–20, left to right.</p>
        </section>
        <aside className="summary" aria-label="Sampling summary">
          <h2>Current sample</h2>
          <p><strong>Temporary simple random sample</strong> of 100 distinct appointments, without replacement.</p>
          <p>Seed: <code>{seed}</code></p>
          <dl>
            <dt>Sample mean</dt><dd>{sampleMean(sample).toFixed(2)} minutes</dd>
            <dt>True population mean</dt><dd>{trueMean(population).toFixed(2)} minutes</dd>
          </dl>
          <p>The true population mean uses all {population.length.toLocaleString()} appointments in this file.</p>
        </aside>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
