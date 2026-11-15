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