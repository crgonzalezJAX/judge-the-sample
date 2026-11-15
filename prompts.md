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
---