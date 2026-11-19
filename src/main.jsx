import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import csv from "../data/clinic_visits.csv?raw";
import { parseClinicCsv, simpleRandomSample, systematicSample, stratifiedSample, sampleMean, trueMean, weightedStratifiedMean, sortedWithinDaysCopy, runBaselineExperiments, runChallenge } from "./sampling.js";
import "./style.css";

const population = parseClinicCsv(csv);
const populationMean = trueMean(population);
const sortedPopulation = sortedWithinDaysCopy(population);
const sortedPopulationMean = trueMean(sortedPopulation);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const groupByWeekDay = (rows) => {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.week}-${row.weekday}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
};
const baselineByWeekDay = groupByWeekDay(population);
const sortedByWeekDay = groupByWeekDay(sortedPopulation);
const maxWait = Math.max(...population.map((row) => row.wait_time));
const minWait = Math.min(...population.map((row) => row.wait_time));
const colour = (wait) => {
  const position = maxWait === minWait ? 0 : (wait - minWait) / (maxWait - minWait);
  const low = [20, 82, 155], high = [202, 59, 28];
  return `rgb(${low.map((value, i) => Math.round(value + (high[i] - value) * position)).join(",")})`;
};
const hudColour = (wait) => {
  const position = Math.min(Math.max(wait, 0), 60) / 60;
  const low = [222, 235, 247], high = [8, 48, 107];
  return `rgb(${low.map((value, i) => Math.round(value + (high[i] - value) * position)).join(",")})`;
};
const systematicSetting = (sample) => sample.design === "whole-number"
  ? `interval ${sample.interval} rows; start row ${sample.start}`
  : `interval ${sample.interval.toFixed(3)} rows; start ${sample.start.toFixed(3)} within the interval`;

function EstimatePlot({ result, domain, populationMean, title, condition = "Baseline", commandMode = false }) {
  const [low, high] = domain;
  const x = (value) => 20 + ((value - low) / (high - low)) * 860;
  const trueMeanX = x(populationMean);
  const badgeX = Math.min(745, Math.max(5, trueMeanX - 75));
  const settings = result.method === "stratified"
    ? `visit_type; proportional allocation ${result.strata.map((s) => `${s.name} ${s.allocation}/${s.size}`).join(", ")}`
    : result.method === "systematic" ? `${condition === "Baseline" ? "chronological file order" : "within-day descending wait-time order"}; interval ${result.interval}` : "without replacement";
  return <div className="estimate-panel">
    <h4>{title}</h4>
    <p className="result-label">{condition} (all 10,000 appointments) · {title} · {settings} · n = {result.n} · {result.type} · {result.count} {result.type === "exact" ? "starts" : "repetitions"}{result.type === "Monte Carlo" ? ` · seed ${result.seed}` : " · no seed"} · true population mean {populationMean.toFixed(2)} min</p>
    <svg className="estimate-plot" viewBox={commandMode ? "0 0 900 88" : "0 0 900 72"} role="img" aria-label={`${title}: ${result.count} estimates on a shared wait-time scale, with true population mean marked`}>
      <line x1="20" x2="880" y1={commandMode ? "67" : "58"} y2={commandMode ? "67" : "58"} stroke="#52616b" />
      {result.estimates.map((value, index) => <circle key={index} cx={x(value)} cy={commandMode ? 26 + ((index * 37) % 29) : 11 + ((index * 37) % 39)} r="2.5" fill="#175a91" fillOpacity="0.22" />)}
      <line x1={trueMeanX} x2={trueMeanX} y1={commandMode ? "20" : "3"} y2={commandMode ? "67" : "61"} stroke="#a11d2b" strokeWidth="2" />
      {commandMode ? <>
        <rect className="true-mean-badge" x={badgeX} y="2" width="150" height="18" rx="9" />
        <text className="true-mean-badge-text" x={badgeX + 75} y="14" textAnchor="middle">True mean {populationMean.toFixed(2)} min</text>
      </> : <text x={trueMeanX} y="70" textAnchor="middle" fontSize="10" fill="#8b1420">True population mean</text>}
    </svg>
    <div className="plot-axis"><span>{low.toFixed(1)} min</span><span>{high.toFixed(1)} min</span></div>
    <p className="metrics">Bias: {result.bias.toFixed(2)} min <span>·</span> SD of estimates: {result.sd.toFixed(2)} min <span>·</span> RMSE: {result.rmse.toFixed(2)} min</p>
  </div>;
}

const panelNames = ["Population grid", "Sampling methods", "Experiment A", "Experiment B", "Challenge"];

function PanelFrame({ mode, index, activeIndex, onSelect, children }) {
  const active = mode === "standard" || index === activeIndex;
  const offset = index - activeIndex;
  const direction = Math.sign(offset);
  const distance = Math.min(Math.abs(offset), 2);
  const style = mode === "command" ? {
    "--panel-x": `${direction * (46 + distance * 10)}%`,
    "--panel-z": `${-distance * 180}px`,
    "--panel-rotation": `${-direction * 24}deg`,
    "--panel-scale": `${1 - distance * 0.1}`,
    zIndex: 10 - distance,
  } : undefined;
  return <section className={`panel-frame ${active ? "is-active" : "is-inactive"}`} style={style} aria-label={panelNames[index]}>
    <div className="panel-body" aria-hidden={!active} ref={(node) => { if (node) node.inert = !active; }}>
      {mode === "command" && <h2 className="panel-title" tabIndex={active ? -1 : undefined}>{panelNames[index]}</h2>}
      {children}
    </div>
    {mode === "command" && !active && <button className="panel-open" type="button" onClick={() => onSelect(index)} aria-label={`Open ${panelNames[index]} panel`}>{panelNames[index]}</button>}
  </section>;
}

const CalendarGrid = React.memo(function CalendarGrid({ view, condition, byWeekDay, sampledIds }) {
  const weeks = Array.from({ length: 100 }, (_, index) => index + 1);
  return <div className="calendar-transposed" role="table" aria-label="Weeks left to right, weekdays top to bottom, appointment positions top to bottom within each day">
    <div className="corner" role="columnheader">Week →<br />Day ↓</div>
    {weeks.map((week) => <div className={`week-header ${week === 100 ? "last-week" : ""} ${week % 10 === 0 ? "decade-end" : ""}`} role="columnheader" aria-label={`Week ${week}`} title={`Week ${week}`} key={week}><span className="week-number">{view === "detail" || week === 1 || week % 10 === 0 ? week : ""}</span></div>)}
    {days.map((day) => <React.Fragment key={day}>
      <div className="weekday-label" role="rowheader">{day}</div>
      {weeks.map((week) => <div className={`day-cell ${week % 10 === 0 ? "decade-end" : ""}`} role="cell" aria-label={`Week ${week}, ${day}`} key={week}>
        {(byWeekDay.get(`${week}-${day}`) || []).map((row) => {
          const selected = sampledIds.has(row.visit_id);
          const label = `Original visit ID ${row.visit_id}; week ${row.week}, ${row.weekday}, original slot ${row.slot}; ${row.visit_type}; wait ${row.wait_time} minutes${condition === "Baseline" ? "" : `; new position within day ${row.sorted_position}`}${selected ? "; sampled" : ""}`;
          return <span className={`mark ${selected ? "selected" : "unsampled"}`} style={{ backgroundColor: colour(row.wait_time), "--hud-wait-colour": hudColour(row.wait_time) }} title={label} aria-label={label} tabIndex={selected ? 0 : -1} key={row.visit_id} />;
        })}
      </div>)}
    </React.Fragment>)}
  </div>;
});

function App() {
  const [displayMode, setDisplayMode] = useState("standard");
  const [activePanel, setActivePanel] = useState(0);
  const swipeStart = useRef(null);
  const ignorePanelClickUntil = useRef(0);
  const wheelDistance = useRef(0);
  const lastWheelMove = useRef(0);
  const lastWheelEvent = useRef(0);
  const [view, setView] = useState("overview");
  const [condition, setCondition] = useState("Baseline");
  const [method, setMethod] = useState("srs");
  const [nText, setNText] = useState("100");
  const [seed, setSeed] = useState("crisg-m12");
  const [repetitions, setRepetitions] = useState(100);
  const [experiments, setExperiments] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const activePopulation = condition === "Baseline" ? population : sortedPopulation;
  const activeMean = condition === "Baseline" ? populationMean : sortedPopulationMean;
  const byWeekDay = condition === "Baseline" ? baselineByWeekDay : sortedByWeekDay;
  const n = Number(nText);
  const validN = nText.trim() !== "" && Number.isInteger(n) && n >= 1 && n <= population.length;
  const samples = useMemo(() => validN ? {
    srs: { rows: simpleRandomSample(activePopulation, n, seed) },
    systematic: systematicSample(activePopulation, n, seed),
    stratified: n >= 3 ? stratifiedSample(activePopulation, n, seed) : null,
  } : null, [activePopulation, n, seed, validN]);
  const current = samples?.[method] ?? null;
  const sampledIds = useMemo(() => new Set(current?.rows.map((row) => row.visit_id) ?? []), [current]);
  const estimate = current ? method === "stratified" ? weightedStratifiedMean(current.strata) : sampleMean(current.rows) : null;
  const methodName = { srs: "Simple random", systematic: "Systematic", stratified: "Stratified" }[method];
  const allResults = experiments ? [...experiments.A, ...experiments.B] : [];
  const plotValues = allResults.flatMap((result) => result.estimates);
  const plotMin = experiments ? Math.min(experiments.populationMean, ...plotValues) : 0;
  const plotMax = experiments ? Math.max(experiments.populationMean, ...plotValues) : 1;
  const padding = Math.max((plotMax - plotMin) * 0.05, 0.5);
  const plotDomain = [plotMin - padding, plotMax + padding];
  const challengeValues = challenge?.flatMap((result) => result.estimates) ?? [];
  const challengeMin = challenge ? Math.min(...challengeValues, ...challenge.map((result) => result.populationMean)) : 0;
  const challengeMax = challenge ? Math.max(...challengeValues, ...challenge.map((result) => result.populationMean)) : 1;
  const challengePadding = Math.max((challengeMax - challengeMin) * 0.05, 0.5);
  const challengeDomain = [challengeMin - challengePadding, challengeMax + challengePadding];

  useEffect(() => {
    if (displayMode !== "command") return undefined;
    const handleKey = (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true']"))) return;
      event.preventDefault();
      setActivePanel((index) => (index + (event.key === "ArrowRight" ? 1 : -1) + panelNames.length) % panelNames.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [displayMode]);

  useEffect(() => {
    if (displayMode !== "command") return;
    const title = document.querySelector(".command-center-content .panel-frame.is-active .panel-title");
    title?.focus({ preventScroll: true });
  }, [displayMode, activePanel]);

  const onTouchStart = (event) => {
    const touch = event.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event) => {
    if (!swipeStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - swipeStart.current.x;
    const dy = touch.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) >= 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      ignorePanelClickUntil.current = Date.now() + 400;
      setActivePanel((index) => (index + (dx < 0 ? 1 : -1) + panelNames.length) % panelNames.length);
    }
  };
  const selectPanel = (index) => {
    if (Date.now() >= ignorePanelClickUntil.current) setActivePanel(index);
  };
  const onWheel = (event) => {
    if (event.target instanceof HTMLElement && event.target.closest(".grid-scroll, input, textarea, select")) return;
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.5) {
      wheelDistance.current = 0;
      return;
    }
    const now = Date.now();
    if (now - lastWheelEvent.current > 250) wheelDistance.current = 0;
    lastWheelEvent.current = now;
    if (now - lastWheelMove.current < 450) return;
    wheelDistance.current += event.deltaX;
    if (Math.abs(wheelDistance.current) >= 75) {
      setActivePanel((index) => (index + (wheelDistance.current > 0 ? 1 : -1) + panelNames.length) % panelNames.length);
      wheelDistance.current = 0;
      lastWheelMove.current = now;
    }
  };

  return <main className={displayMode === "command" ? "command-mode" : undefined}>
    <header>
      <h1>Clinic waiting times</h1>
      <p>Finite population: all {population.length.toLocaleString()} appointments in this file. Baseline file order is chronological: weeks 1–100, Mon–Fri, slots 1–20 each day. Interval sampling of an unordered list means something different from sampling a chronological record.</p>
    </header>
    <fieldset className="display-mode" aria-label="Display mode">
      <legend>View</legend>
      <label><input type="radio" name="display-mode" checked={displayMode === "standard"} onChange={() => setDisplayMode("standard")} /> Standard view</label>
      <label><input type="radio" name="display-mode" checked={displayMode === "command"} onChange={() => setDisplayMode("command")} /> Command center view</label>
    </fieldset>
    {displayMode === "command" && <nav className="panel-nav" aria-label="Command center panels">
      {panelNames.map((name, index) => <button key={name} type="button" aria-pressed={activePanel === index} onClick={() => setActivePanel(index)}>{name}</button>)}
      <small className="nav-help">Choose a panel, use ← / →, or swipe horizontally. Scroll vertically inside the active panel.</small>
      <span className="sr-only" aria-live="polite">{panelNames[activePanel]} active</span>
    </nav>}
    <div className={displayMode === "command" ? "command-center-content" : "standard-content"} onTouchStart={displayMode === "command" ? onTouchStart : undefined} onTouchEnd={displayMode === "command" ? onTouchEnd : undefined} onWheel={displayMode === "command" ? onWheel : undefined}>
    <PanelFrame mode={displayMode} index={1} activeIndex={activePanel} onSelect={selectPanel}>
    <fieldset className="condition-switch" aria-label="Population condition">
      <legend>Population condition for the grid and single sample</legend>
      <label><input type="radio" name="population-condition" checked={condition === "Baseline"} onChange={() => setCondition("Baseline")} /> Baseline</label>
      <label><input type="radio" name="population-condition" checked={condition !== "Baseline"} onChange={() => setCondition("Sorted copy (modified)")} /> Sorted copy (modified)</label>
      <span>{condition === "Baseline" ? "Original chronological file order." : "Each day's appointments sorted by wait_time, longest first; weeks and weekdays stay in order. Original CSV unchanged."}</span>
    </fieldset>
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
        <p>Take appointments at an interval from a random start in the selected population’s row order.</p>
        {samples && <small>{samples.systematic.design === "whole-number" ? "Whole-number" : "Fractional-interval"} design; {systematicSetting(samples.systematic)}. Seed controls start.</small>}
      </section>
      <section className={`method-card ${method === "stratified" ? "active" : ""}`}>
        <button type="button" aria-pressed={method === "stratified"} onClick={() => setMethod("stratified")}>Stratified</button>
        <p>Split by visit type; choose distinct appointments at random within each type. Use population weights for the estimate.</p>
        {validN && n < 3 && <small>Needs at least one appointment per visit type (3 types); no sample at n = {n}.</small>}
        {samples?.stratified && <small>Proportional allocation: {samples.stratified.strata.map((s) => `${s.name} ${s.allocation} (weight ${s.weight.toFixed(3)})`).join("; ")}. Seed controls draws.</small>}
      </section>
    </div>
    {displayMode === "command" && <section className="command-sample-summary" aria-label="Selected method current single sample">
      <h3>Current single sample · {methodName}</h3>
      <p>{condition} · n = {validN ? n : "—"} · seed <code>{seed}</code>. The Population grid panel highlights these appointments.</p>
      <dl>
        <div><dt>{method === "stratified" ? "Population-weighted sample estimate" : "Sample mean"}</dt><dd>{estimate === null ? "No sample" : `${estimate.toFixed(2)} minutes`}</dd></div>
        <div><dt>{condition} true population mean</dt><dd>{activeMean.toFixed(2)} minutes</dd></div>
      </dl>
    </section>}
    </PanelFrame>
    <PanelFrame mode={displayMode} index={0} activeIndex={activePanel} onSelect={selectPanel}>
    <div className="layout">
      <section className="grid-section" aria-labelledby="grid-title">
        <div className="grid-heading"><h2 id="grid-title">{condition} · appointments by week and weekday</h2><p>Weeks run left to right; weekdays run top to bottom. Each cell stacks 20 marks in {condition === "Baseline" ? "original slot order" : "new sorted order"}. {displayMode === "command" ? "Sampled marks orange with a dark outline; unsampled marks blue." : "Sampled marks outlined; unsampled faded."} Hover for visit ID, week, weekday, original slot, visit type, wait{condition !== "Baseline" ? ", and new position" : ""}.</p></div>
        <fieldset className="view-toggle" aria-label="Grid view">
          <legend>Grid view</legend>
          <label><input type="radio" name="grid-view" value="overview" checked={view === "overview"} onChange={() => setView("overview")} /> Overview — all 100 weeks</label>
          <label><input type="radio" name="grid-view" value="detail" checked={view === "detail"} onChange={() => setView("detail")} /> Detail — larger marks</label>
        </fieldset>
        <div className={`grid-scroll ${view}`}>
          <CalendarGrid view={view} condition={condition} byWeekDay={byWeekDay} sampledIds={sampledIds} />
        </div>
        <div className="legend" aria-label={displayMode === "command" ? "Wait time colour legend from 0 to 60 or more minutes; orange marks are sampled" : `Wait time colour legend from ${minWait} to ${maxWait} minutes`}><span>Colour = wait time</span><span>Shorter: {displayMode === "command" ? 0 : minWait} min</span><div className="gradient" /><span>Longer: {displayMode === "command" ? "60+" : maxWait} min</span>{displayMode === "command" && <span className="sample-key"><span className="sample-key-mark" /> sampled</span>}</div>
        <p className="axis-note">X axis: weeks 1–100, left to right. Y axis: Mon–Fri. Within each cell: {condition === "Baseline" ? "original slots" : "new sorted positions"} 1–20, top to bottom. {condition !== "Baseline" && "Hover to see the original slot."}</p>
      </section>
      <aside className="summary" aria-label="Sampling summary">
        <h2>{condition} · {methodName} single sample</h2>
        <p>Sample size: {validN ? n : "—"} appointments<br />Seed: <code>{seed}</code></p>
        {method === "systematic" && current && <p>{current.design === "whole-number" ? "Whole-number" : "Fractional-interval"} design in {condition === "Baseline" ? "chronological file order" : "within-day descending wait-time order"}; {systematicSetting(current)}.</p>}
        {method === "stratified" && current && <p>Visit type weights: {current.strata.map((s) => `${s.name} ${s.size}/${population.length}`).join("; ")}. Estimate = sum of each weight × that type’s sample mean.</p>}
        {validN && method === "stratified" && n < 3 && <p role="alert">Stratified sampling needs at least one appointment per visit type (3 types). Choose n of at least 3 to draw this sample.</p>}
        <dl><dt>{method === "stratified" ? "Population-weighted single-sample estimate" : "Single-sample mean"}</dt><dd>{estimate === null ? "No sample" : `${estimate.toFixed(2)} minutes`}</dd><dt>{condition} true population mean</dt><dd>{activeMean.toFixed(2)} minutes</dd></dl>
        <p>This true population mean is recalculated from all {activePopulation.length.toLocaleString()} appointments in the selected condition.</p>
      </aside>
    </div>
    </PanelFrame>
    <PanelFrame mode={displayMode} index={2} activeIndex={activePanel} onSelect={selectPanel}>
    <section className="experiments" aria-labelledby="experiment-title">
      <h2 id="experiment-title">Repeated-sampling experiments</h2>
      <p>Each dot is one sample estimate. The grid above shows one sample; the plots below show estimates across repetitions or all possible starts. The {displayMode === "command" ? "coral" : "red"} line is the true population mean: {populationMean.toFixed(2)} minutes.</p>
      <div className="experiment-controls">
        <label>Monte Carlo repetitions: <select value={repetitions} onChange={(event) => setRepetitions(Number(event.target.value))}><option value="100">100</option><option value="1000">1,000</option></select></label>
        <button type="button" onClick={() => setExperiments(runBaselineExperiments(population, repetitions, seed))}>Run Experiments A and B</button>
      </div>
      <p className="repetition-help">Sample size n and repetition count are separate. Each Monte Carlo repetition draws a new sample of n distinct appointments; an appointment can appear in later repetitions. 100 repetitions usually reveal the main pattern; 1,000 give smoother distributions and more stable bias, SD and RMSE estimates. Neither guarantees stable results, and 100 cannot reliably separate small differences. Rerun with different seeds to check whether main conclusions hold.</p>
      {experiments ? <>
        <p className="result-label">Current results from the last Run. Changing controls above does not change these results until you run again. Simple random n = 100 is reused in A and B.</p>
        <h3>Experiment A · methods at n = 100</h3>
        {experiments.A.map((result) => <EstimatePlot key={result.method} result={result} domain={plotDomain} populationMean={experiments.populationMean} title={{ srs: "Simple random", systematic: "Systematic", stratified: "Stratified" }[result.method]} commandMode={displayMode === "command"} />)}
      </> : <p>No experiment results yet. Press Run Experiments A and B when you are ready to investigate.</p>}
    </section>
    </PanelFrame>
    <PanelFrame mode={displayMode} index={3} activeIndex={activePanel} onSelect={selectPanel}>
    <section className="experiment-b" aria-labelledby="experiment-b-title">
      {(experiments || displayMode === "command") && <h3 id="experiment-b-title">Experiment B · simple random at n = 1, 10 and 100</h3>}
      {experiments ? experiments.B.map((result) => <EstimatePlot key={result.n} result={result} domain={plotDomain} populationMean={experiments.populationMean} title={`Simple random, n = ${result.n}`} commandMode={displayMode === "command"} />) : displayMode === "command" ? <p>No experiment results yet. Run Experiments A and B in the Experiment A panel when you are ready to investigate.</p> : null}
    </section>
    </PanelFrame>
    <PanelFrame mode={displayMode} index={4} activeIndex={activePanel} onSelect={selectPanel}>
    <section className="experiments challenge" aria-labelledby="challenge-title">
      <h2 id="challenge-title">Your challenge · baseline versus sorted copy</h2>
      <p>At n = 100, compare systematic and simple random sampling on both conditions. The sorted copy changes row order within each day, longest wait first; its true mean is recalculated from its own rows. Each result is measured against the true mean of its own condition.</p>
      <div className="experiment-controls">
        <span>Monte Carlo repetitions: {repetitions.toLocaleString()} (control above) · seed: <code>{seed}</code> · sample size: 100</span>
        <button type="button" onClick={() => setChallenge(runChallenge(population, sortedPopulation, repetitions, seed, experiments?.A[0]))}>Run challenge</button>
      </div>
      {challenge ? <>
        <p className="result-label">Current challenge results from the last Run challenge. Changing controls does not alter these results until you run again. Every plot below shares one horizontal wait-time scale.</p>
        <div className="challenge-results">
          {challenge.map((result) => <EstimatePlot key={`${result.method}-${result.condition}`} result={result} domain={challengeDomain} populationMean={result.populationMean} condition={result.condition} title={result.method === "systematic" ? "Systematic" : "Simple random"} commandMode={displayMode === "command"} />)}
        </div>
      </> : <p>No challenge results yet. Press Run challenge when you are ready to investigate.</p>}
    </section>
    </PanelFrame>
    </div>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
