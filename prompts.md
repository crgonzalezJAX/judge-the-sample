# Prompts log: Judge the Sample (M12)

Every prompt I sent to my coding agent, in order. Tool: Codex (VS Code extension).
Mode: Agent (asks approval) for building; Chat/read-only for Plan-mode discussions.
My own decisions, hypothesis and findings live in DECISIONS.md, not here.

---

## 0. Setup (Agent mode) – 2026-11-15

**Prompt:**
```
Read AGENT_BRIEF.md and follow it for this whole project.
My scenario is Clinic waiting times, file data/clinic_visits.csv.
Inspect the project (README.md, SETUP.md, DECISIONS.md, load_data.mjs) and the data (data/README.md and my CSV). Summarise in a few sentences what the project contains and what the columns of my CSV are. Do not calculate the true mean for me.
Then explain what setup this project needs on my computer for a browser-only JavaScript app built with React and Vite, as AGENT_BRIEF.md describes, and wait for my OK before installing anything.
After I agree, prepare the environment, explaining each command before you run it and what its output means. Do not design or build the app yet: I will brainstorm the design with you in Plan mode in stage 2.
```

**What Codex did:**
It seems that Codex checked all the files and confirmed and summarized the different types of files and the other applications needed such as React and Vite in order to build (or plan) this applicaiton.
**What I checked myself:**
I checked the "explorer" view to confirm if any files were updated as well as the Codex summary provided. JS (or Java Script) files are yellow, Markdown files are blue. Also for the icons on the right (u) means untracked, (M) means modified, (A) is added and no letter is unchanged.

**Prompt:**
OK, go ahead and prepare the environment.
**What Codex did:**
Seamed Codex checked (and modified) all the eviornments for specific version requirements (all passed). A loader read the csv data and expected columns. Its ready to brain storm.
**What I checked myself:**
Prompts were updated with (M) visible. I saw the thinking (explanation of what each application contributed to the whole) while Codex was reading the information.

**Prompt:**
I have switched you to Plan mode. Stay in Plan mode and do not implement changes yet. Help me brainstorm three different ways to visualize my dataset for a sampling activity. Each design should help a viewer understand the full population, identify which observations were sampled, and compare the sample estimate with the true population mean. Explain the strengths and limitations of each idea and how it could help reveal a sampling problem. Discuss the ideas with me before implementing anything.
My dataset: data/clinic_visits.csv (Clinic waiting times). One row is one appointment; the target is the wait_time column in minutes. Row order: chronological, week by week, Monday to Friday, slot 1 to 20 within each day (see data/README.md).
**What Codex did:**
Prepared 3 visualization type ideas and added certain columns for understangins - including what the viewer sees, positives, negataives, and sampling problem it can make visible.
**What I checked myself:**
Nothing was updated except the prompts.

**Prompt:**
I also have my own idea to compare against yours: organize the data by week and weekday so a viewer can see how wait times vary across the 100 weeks and the days of the week. Please critique it the same way, including whether it shows every individual appointment and which ones were sampled.
**What Codex did:**
It assessed my idea against the other 3 designs it first proposed.
**What I checked myself:**
I checked the feedback from Codex.

## 2b. Setup (Agent mode) – 2026-11-16
**Prompt:**
I have switched you out of Plan mode. Build the first version of my app using the design I chose: a 100-week × weekday grid. Each week × weekday cell holds 20 marks, one per appointment slot (1–20), so all 10,000 appointments are visible individually. Each mark's colour shows that appointment's wait_time, with a colour legend in minutes. Sampled marks are highlighted and unsampled marks are faded. Hovering over a mark shows its week, weekday, slot, visit type and wait time. Beside the grid, show the sample mean next to the labelled true population mean, both in minutes. My reason: the week-by-weekday layout follows the clinic calendar, which is how a clinician or nurse already thinks about the schedule, and showing every appointment as its own mark lets a viewer see exactly which appointments were sampled. Keep this design; ask me before changing it.
- Follow AGENT_BRIEF.md for the project structure, including one shared sampling module.
- Load data/clinic_visits.csv as the whole finite population (target wait_time, in minutes) using a Vite ?raw import, so data/ stays unchanged and the app will also work when I publish it to GitHub Pages later. Show the true mean over all rows, labelled as the true population mean.
- For now, select a temporary simple random sample of 100 rows without replacement, with a visible seed, labelled as temporary. Highlight the selected observations within the full population and show the sample mean beside the true mean.
- Include the visual feature I chose to reveal a sampling problem: because every sampled appointment is highlighted in its week and weekday, a viewer can see at a glance whether the sample only came from certain days, missed whole stretches of weeks, or clustered in certain appointment slots. Label the axes (weeks 1–100, Mon–Fri, slots 1–20) so this is readable.
- Do not add the three sampling methods yet; they come in the next stage. Keep the display clear and simple; do not add styling, animations or extra features unless I ask. Prefer no charting library; if you think one is needed, ask me first.
- Write run_app.sh as AGENT_BRIEF.md describes. Then tell me where to run bash run_app.sh, the address to open and how to stop it. Leave the app stopped; I will run it myself.
- Run automated correctness checks on the shared module (every row loaded, the target parsed as numbers, the sample has 100 distinct rows, the same seed gives the same rows) and tell me which pass. I will check the running app myself.
**What Codex did:**
Codex first confirmed what it would build, without building. It created an assortment of files including: src, tests, index, packagae.json, run_app.sh, as well as npd.cmd install. It asked for my approval. It had some issues reaching the npm registry.Its having a windows certificate error. The resolution it has found is to go and use the windows certificate store. It succeded resolving the issue as well as creating its first React/Vite app.
**What I checked myself:**
I checked the application visually against the questions in our checklists. There were some minor correctoins that are listed in my next prompt.

## 2c. Setup (Agent mode) – 2026-11-16
**Prompt:**
Keep my design exactly as it is (100-week × weekday grid, 20 marks per cell, wait-time colours, sampled marks outlined, unsampled faded, hover details, sample mean beside the labelled true mean). Add a simple zoom toggle with two settings:
1. Overview (the default when the app opens): all 100 weeks fit on one screen without scrolling the grid on a normal laptop (about 1366×768 or larger). Marks can be small, but sampled marks must stay clearly visible, and hover still shows full details for any mark.
2. Detail: larger marks for reading individual weeks, with scrolling as it works now.
Label the toggle clearly so a health professional knows which view they are in. Also use a wait-time colour scale with clear contrast between short and long waits, and keep the colour legend in minutes visible next to the grid in both views.
Do not add free mouse-wheel or pinch zoom. Do not change the sampling logic, the shared module, or the seed behaviour; the same seed must show the same sampled marks in both views. Rerun the automated checks and tell me which pass. Leave the app stopped.
**What Codex did:**
Codez added all my changes. However the overview view looked really small and bareably able to be read. This will suffice for revision 1 as it meets the requirements.
**What I checked myself:**
I ran bash and looked at the new fixes/resolutions we asked Codex to build. The overview chart is very washed out and the detail as mentioned above is non-existant.

## 3a. Setup (Agent mode) – 2026-11-16
**Prompt:**
I have switched you to Plan mode. Stay in Plan mode and do not implement changes yet; do not create, edit or delete any files. Propose two distinct ways users could interact with my existing visualization to understand simple random, systematic, and stratified sampling (or one proposal with a meaningful alternative). Keep the sampling rules statistically correct. For each approach, explain how users could understand why observations were selected, change a relevant sampling setting, and see the sample estimate update. Discuss the strengths and limitations with me before implementing anything.
Context: my data is data/clinic_visits.csv, N = 10000. Row order: chronological, week by week, Monday to Friday, slot 1 to 20 within each day (see data/README.md). The sampling rules are in AGENT_BRIEF.md. My existing visualization is the 100-week × weekday grid with an Overview/Detail toggle; keep it.
**What Codex did:**
Codex decided to give me the options within the chat. options given were: Method Panel and Guided Method cards. 
**What I checked myself:**
Nothing was updated. I worked on decisions within my DECISIONS.MD file.

## 3b. Setup (Agent mode) – 2026-11-16
**Prompt:**
I have switched you out of Plan mode. Implement the interaction approach I chose: guided method cards. Three cards (Simple random, Systematic, Stratified) sit in a row above my existing grid, each showing its selection rule in plain language and its relevant settings. Choosing a card highlights that method's sample in the grid and updates the sample estimate beside the labelled true mean; the active card stays visibly selected. My reason: all three selection rules stay visible on one screen, so a clinician can compare how each method chooses appointments without switching back and forth. Keep my existing visualization and design, including the Overview/Detail toggle; in Overview, all 100 weeks must still fit on one screen with the cards above the grid.
- Replace the temporary sample with three methods in the shared sampling module, following the sampling rules in AGENT_BRIEF.md: simple random sampling without replacement; systematic sampling with a random start in the file's row order; stratified sampling on visit_type.
- Use the same total sample size for all three methods, default 100, and let users change it. Simple random and systematic sampling must work for every n from 1 to N, including 1, 10 and 100, so never restrict n to divisors of N.
- Users must be able to identify the selection rule for each method, change a relevant setting, and see the selected observations and the estimate update beside the true mean.
- Systematic: show the row order, the interval and the random start, and tell the user whether the whole-number or the fractional-interval design is in use.
- Stratified: show the allocation for each visit type (whole numbers that total n, none above the group size), and the population-weighted estimate with its weights. If n is smaller than 3 (the number of visit types), do not draw a stratified sample: show a clear message that stratified sampling needs at least one appointment per visit type. Do not change n for the other methods.
- Explain in the app what the row order of my file means and that interval sampling of an unordered list means something different from sampling a chronological record. Do not tell users how this will affect results.
- Run automated correctness checks on the shared module, as AGENT_BRIEF.md describes: exactly n distinct rows for simple random and systematic sampling at n = 1, 10, 100 and an n that does not divide N; the same seed reproduces the same sample; allocations total n and none exceeds its stratum; weights sum to 1; the weighted estimator gives the known answer on a small synthetic population. Tell me which checks pass.
- When you finish, explain in plain language how each method behaves and what I can check in the running app. Do not tell me how the methods will compare. Leave the app stopped.
**What Codex did:**
Updated src and test files. As well as verified that the updaetd were implemented.
**What I checked myself:**
I ran the bash run_app.sh prompt and saw how the application worked. No grave issues to report. The updated are the following: simple, systemic and stratified options.

**Prompt:**
Display only: in the Systematic card, show the interval and start as whole numbers when the whole-number design is in use (e.g. "interval 100 rows; start row 35"), and with decimals only for the fractional-interval design. Also make sure the hover shows each appointment's row number (visit_id). Do not change the sampling module.
**What Codex did:**
Minor issue that was resolved my Codex
**What I checked myself:**
I checked n = 137 (fractional design), n = 2 (the stratified block), the allocations and weights by hand, and the predicted systematic rows.

## 4a. Setup (Agent mode) – 2026-11-17
**Prompt:**
I have switched you to Plan mode. Stay in Plan mode and do not implement changes yet; do not create, edit or delete any files. Propose two distinct ways to present two experiments in my app (or one proposal with a meaningful alternative). Experiment A compares simple random, systematic and stratified sampling at n = 100 on the same population. Experiment B investigates sample size using simple random sampling at n = 1, 10 and 100, with the population and method fixed. Monte Carlo results use 100 repetitions by default, with a control to increase to 1,000; n and the repetition count are separate settings. Users must be able to see how much estimates vary, compare them with the true population mean, and tell consistent error from random variation. Keep the true mean visible and label each current result with its settings. Keep the plan simple: do not design saved experiment histories or extra features unless I ask. Keep my existing grid and guided method cards. Explain the strengths and limitations of each approach, and discuss them with me before implementing anything.
Please do not run any experiments or tell me what results to expect: I will read and interpret them myself.
**What Codex did:**
Codex didnt change anything. What it did was provide me with two options. And those options I discussed with my agent and went ahead with one of them.
**What I checked myself:**
There was nothing to check as there were no files that were updated.

## 4b. Setup (Agent mode) – 2026-11-17
**Prompt:**
I have switched you out of Plan mode. Implement the presentation I chose: aligned estimate plots. Experiment A has one dot plot per method and Experiment B has one per sample size; every plot shares one horizontal wait-time scale (minutes) and one labelled true-mean line, with a compact bias / SD of estimates / RMSE row under each plot. Use semi-transparent dots so piles of estimates show up as darker areas at 1,000 repetitions. My reason: a shared scale and true-mean line let a reader compare how spread out each result is and how far it sits from the true mean at a glance, and each dot being one sample's average is intuitive for a clinician. Add it to my existing app below the grid and keep my design, including the guided method cards and the Overview/Detail toggle.
- Following AGENT_BRIEF.md, add repeated sampling to the shared sampling module: for each condition, at least 100 random repetitions (default 100, with a control to increase to 1,000), or all k random starts for systematic sampling with a whole-number interval (exact enumeration). Random repetitions must be seeded and reproducible. Set the app's default seed to crisg-m12.
- Keep n and the repetition count as separate settings: each repetition draws one sample of n observations without replacement and calculates one estimate. Show the repetition count beside each result, and explain briefly in the app that 100 repetitions usually reveal the main pattern while 1,000 give smoother distributions and more stable bias, SD and RMSE estimates.
- Experiment A: simple random, systematic and stratified (visit_type) sampling at n = 100, same population.
- Experiment B: simple random sampling at n = 1, 10 and 100, with the population and method fixed. Reuse the simple random n = 100 result from Experiment A when the population and settings match.
- Run the experiments only when I press a clearly labelled Run button, not on every keystroke, and compute the repetitions once in the shared module so every display reuses the same numbers.
- Label every current result Monte Carlo (with its seed) or exact (no seed), and show its population, method, settings, n and repetition or start count. Never pool results that differ in any label.
- Show the distribution of estimates in my chosen presentation, with the true population mean clearly labelled, plus bias (mean of estimates minus true mean), the SD of the estimates and RMSE, in minutes, as AGENT_BRIEF.md defines them. Clearly distinguish a single sample's result (the grid and cards above) from the distribution across repetitions.
- The app only needs to show current results. Do not add saved experiment histories, styling, animations or other extras unless I ask.
- Run automated correctness checks, as AGENT_BRIEF.md describes: the same seed reproduces the same numbers; each repetition has n distinct rows; the number of estimates equals the repetition count; exact enumeration lists each of the k starts once; bias, SD and RMSE match hand calculations on a small synthetic population with a known answer; RMSE² = bias² + SD². Tell me which checks pass.
- Do not run my experiments for me, report their results or tell me what they mean; I will run and interpret them myself. Leave the app stopped.
**What Codex did:**
Codex updated the program with the latest content. Files src and tests were updated. 
**What I checked myself:**
I checked the program. Codex added detail relevant with the Monte Carlo analysis as well as the required visual charts for visualizations. I also ran the program and initiated the different scenarios in order to fill the results section. I also cropped 2 images that serve as evidence for specific comparison methods.

## 4c. Setup (Agent mode) – 2026-11-17
**Prompt:**
Question only, no changes: in the Experiment A systematic plot, what does each dot's vertical position represent? Is it random jitter like the other plots, or are dots ordered by their start number?
**What Codex did:**
Codex answered my question about the systematic dots as a “rising, slightly angled line. No files were modified.
**What I checked myself:**
I did not check anything extra as I had already checked the app before I had made this inquiry.

## 4d. Setup (Agent mode) – 2026-11-17
**Prompt:**
- (a) Method comparison: At n = 100 on the baseline clinic population, all three methods had bias close to zero: simple random 0.03 min, stratified −0.07 min (Monte Carlo, 1,000 repetitions, seed crisg-m12), and systematic 0.00 min (exact, all 100 starts). These biases are tiny compared with the spread of the estimates, so I read them as simulation noise rather than a method being off target. The real difference was variability. Simple random (SD 1.48, RMSE 1.49) and stratified (SD 1.38, RMSE 1.38) were close, with stratified slightly tighter, and both plots were concentrated around the true mean. Systematic was far more spread out (SD 6.96, RMSE 6.96): its estimates ranged widely along the wait-time axis, from well below to well above the true mean, rather than clustering around it. For this population at n = 100, judged by RMSE, I would trust simple random and stratified, and not systematic.
**What Codex did:**Answered my inquiry about the small findings using the Monte Carlo Analysis.
**What I checked myself:**
I upated the decisions portion with an updated portion 4a.

## 5a. Setup (Agent mode) – 2026-11-17
**Prompt:**
I have already written my own hypothesis independently and have now switched you to Plan mode. Stay in Plan mode and do not implement changes yet; do not create, edit or delete any files. Here is my own hypothesis about how a condition could change the reliability of my chosen sampling method: I am challenging systematic sampling at n = 100. In a modified copy of the population, I sort each day's appointments by wait_time, longest wait first, keeping weeks and days in order and keeping the original file unchanged. At n = 100 the interval is 100 rows, so each start picks the same weekday and the same position within the day every week; after sorting, that position is tied directly to wait time, so I predict greater SD and RMSE for systematic estimates after sorting. My alternative method is simple random sampling on both the baseline and sorted copies, also at n = 100, because it draws from appointments across the entire file. Propose two distinct ways to let users apply those conditions in my existing app (or one proposal with a meaningful alternative). Do not implement anything until I have chosen an approach and switched to implementation mode. Keep the sampling methods statistically correct and do not substitute a different hypothesis. The feature must recalculate the modified population's true mean and compare, at the same total n and with repeated sampling, my chosen method on the baseline and modified populations and my alternative on the corresponding baseline and modified populations, each result clearly labelled and judged against its own population's true mean. Keep the plan simple: no saved experiment histories or extra features unless I ask.
**What Codex did:**
It gave me two options from which to chose.
**What I checked myself:**
No files were changed.

## 5b. Setup (Agent mode) – 2026-11-17
**Prompt:**
I have switched you out of Plan mode. Implement the challenge controls I chose: a Baseline / Sorted copy condition switch above the existing grid controls, plus one Run challenge button that produces four aligned plots below, to test my own hypothesis: systematic sampling at n = 100 will have greater SD and RMSE on a copy where each day's appointments are sorted by wait_time, longest wait first (weeks and days stay in order), than on the baseline; simple random sampling is my alternative on both. My reason: it keeps the grid and controls compact, so Overview still fits all 100 weeks, while the four results stay visible together. Keep my existing app and design.
- Keep the original data recoverable and unchanged on disk. Apply the sort to a copy in memory, label it clearly as "Sorted copy (modified)", and let users return to the baseline. Break ties in wait_time by keeping the original relative order.
- When the Sorted copy is selected, lay out the grid in the sorted copy's row order (each mark at its new position within the day) so users see the order systematic sampling follows; the hover still shows the appointment's original week, weekday, slot, visit type and wait time, plus its new position.
- Recalculate the modified population's true mean from its own rows and show which population each result comes from.
- Keep the sampling rules in AGENT_BRIEF.md exactly; never change a rule or estimator to force a result. Re-check which systematic design applies for the modified N.
- Produce four results at n = 100: systematic on the baseline and on the sorted copy, and simple random on the baseline and on the sorted copy. Measure each result's bias against its own population's true mean, and show bias, SD and RMSE for baseline and sorted side by side, never pooled. Use the same aligned estimate plot style, shared wait-time scale and true-mean line as Stage 4.
- Systematic at n = 100 uses exact enumeration of all 100 starts (labelled exact, no seed). Simple random uses seeded Monte Carlo with the existing repetition control (100 default, up to 1,000) and seed. Label each result with its population or condition, method, settings, n, and repetition or start count.
- Do not add saved histories, styling or extra features unless I ask.
- Run automated correctness checks, as AGENT_BRIEF.md describes: the file on disk is unchanged; the modified true mean equals the mean of the modified rows and is unchanged by reordering alone; each day in the sorted copy is in non-increasing wait_time order; the systematic design is re-checked for the modified N; all four results use the same n; the same seed reproduces the same numbers. Tell me which checks pass.
- Do not run my investigation for me, report its results or tell me whether my hypothesis is supported; I will interpret the evidence myself. Leave the app stopped.
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**

**Prompt:**
**What Codex did:**
**What I checked myself:**
---