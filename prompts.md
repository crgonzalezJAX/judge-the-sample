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