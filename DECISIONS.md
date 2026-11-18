# My decisions and evidence notes

Written by me, not by my AI agent. Write my challenge hypothesis (section 5) **before** consulting
my agent about it, and do not edit it afterwards; add a dated revision below instead.

| Stage | What I record here |
|---|---|
| 1 | Section 1 |
| 2–5 | Section 2: my design choice, written before I switch my agent to build |
| 4 | Section 3: method and sample-size rows; section 4: findings (a) and (b) |
| 5 | Section 5: hypothesis first; then section 3: challenge rows; section 5: finding (c) |
| All | Section 6: AI use |

## 1. Population and target

- Scenario and file:
- One row means: One appointment
- Number of rows (N): 10,000 
- Row order, and what it means in this file: time order, week by week, Monday to Friday, slot 1 to 20 within each day. These neighbouring rows are neighbouring appointments in time.
- Target column and units:wait_time; minutes
- My finite population is (and what it is not): what it is (these 10,000 simulated appointments) and what it isn’t (not every clinic, every week, or real patients)
- True mean I calculated (and how): 22.6842 minutes, from Excel =AVERAGE(F2:F10001) and awk over all 10,000 rows, which agreed 

## 2. Design choices

For each stage: the option I chose, why, and what it is meant to help a user learn.

- Stage 2, visualization (include one visual feature meant to reveal a sampling problem):
I chose a 100-week × weekday grid. The week-by-weekday layout was my idea because it follows the clinic calendar, which is how a clinician or nurse already thinks about the schedule. Each week × weekday cell holds exactly 20 marks, one per appointment slot (1–20), so all 10,000 appointments are visible individually. Codex’s initial feedback improved my idea by showing each appointment as its own mark instead of an average, so a viewer can see exactly which appointments were sampled. Each mark’s color shows that appointment’s wait time, and sampled marks are highlighted while the rest are faded. Hovering over a mark shows its week, weekday, slot, visit type and wait time. Beside the grid, the sample mean is shown next to the labelled true population mean (22.68 minutes).
Because every sampled appointment is highlighted in its week and weekday, a viewer can see at a glance if the sample only came from certain days, missed whole stretches of weeks, or clustered in certain appointment slots. A sample like that may not represent the whole population, and its mean could be pulled away from the true mean. Added more clarity to the tool as I was not able to see all data on the same scree. The details included: the overview shows the whole population for spotting gaps, and the detail view is for reading individual weeks. 
- Stage 3, sampling interactions and stratification column:
The sampling Interaction that I chose was called the guided method cards and the goal is to simplify the clinician's review by having all pertinent data on one screen.Essentially it has the three methods visible, so no switching back and forth. One note: the selected card controls which method’s sample the grid highlights.
The stratification column I chose was "visit_type". Visit types are expected to have different waits times. As such stratifying makes sure each type is represented in its proportion so the mix of visit types can’t throw off the overall estimate. I would expect to see the data or group "Follow-up" having less of a wait time than the "New" or "Same-Day" groups as they would already contain all (or most of the information) needed to match a patient with their case. 
- Stage 4, presentation of the method comparison and sample-size experiments:
I decided to choose "aligned estimate plots" due to all plots sharing one wait-time scale and one true-mean line. There are some minor limitations, but those are being fixed by the use of semi-transparent dots, so piles show up as darker areas at 1,000 reps. The benefit to the clinician is that each dot is one sample’s average and this is very intuitive.
- Stage 5, challenge controls and my alternative method or correction:

## 3. Results table

One row per result I read from my app. Add rows as needed. Rerun and update a row whenever I
like: my app does not need to keep a history of runs. Seed is "exact" for exact enumeration;
type is Monte Carlo or exact. In Settings I record the settings that matter for the result, such
as the stratification column and allocation, or my challenge-control values. True mean is the
true mean of the population that result was drawn from (the modified copy's own recalculated
value for modified rows). Keep each result in its own row: never pool estimates.

| Experiment | Population or condition | Method | Settings | Seed (or exact) | n | Repetitions or starts | Type | True mean | Bias | SD | RMSE |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Methods at n = 100 | baseline | Simple random | without replacement | crisg-m12 | 100 | 1000 | Monte Carlo | 22.6842 | 0.03 | 1.48 | 1.49 |
| Methods at n = 100 | baseline | Systematic | whole-number interval 100, chronological row order | exact | 100 | 100 starts | exact | 22.6842 | 0.00 | 6.96 | 6.96 |
| Methods at n = 100 | baseline | Stratified | visit_type, proportional allocation 55/25/20 | crisg-m12 | 100 | 1000 | Monte Carlo | 22.6842 | -0.07 | 1.38 | 1.38 |
| Sample size | baseline | Simple random | without replacement | crisg-m12 | 1 | 1000 | Monte Carlo | 22.6842 | 0.58 | 15.47 | 15.48 |
| Sample size | baseline | Simple random | without replacement | crisg-m12 | 10 | 1000 | Monte Carlo | 22.6842 | 0.01 | 4.65 | 4.65 |
| Challenge | baseline | (method I challenged) | | | | | | | | | |
| Challenge | modified | (method I challenged) | | | | | | | | | |
| Challenge | baseline | (alternative or correction) | | | | | | | | | |
| Challenge | modified | (alternative or correction) | | | | | | | | | |

The simple random n = 100 row is also the n = 100 sample-size result when the population and
settings match. If I reran it with different settings, I add a separate row. All four challenge
rows use the same n; a challenge baseline row may repeat a matching stage 4 result.

## 4. Findings (in my own words, using my own numbers)

- (a) Method comparison: the three sampling methods compared at n = 100 (bias versus variability, and for which population): - (a) Method comparison: At n = 100 on the baseline clinic population, all three methods had bias close to zero: simple random 0.03 min, stratified −0.07 min (Monte Carlo, 1,000 repetitions, seed crisg-m12), and systematic 0.00 min (exact, all 100 starts). These biases are tiny compared with the spread of the estimates, so I read them as simulation noise rather than a method being off target. The real difference was variability. Simple random (SD 1.48, RMSE 1.49) and stratified (SD 1.38, RMSE 1.38) were close, with stratified slightly tighter, and both plots were concentrated around the true mean. Systematic was far more spread out (SD 6.96, RMSE 6.96). Instead of a cloud around the true mean, its estimates formed a rising, slightly angled line: starting low on the left and climbing steadily, with the highest estimates at the far end. For this population at n = 100, judged by RMSE, I would trust simple random and stratified, and not systematic.
- (b) Sample-size finding: how sample size affects the spread of estimates and the estimation error, and what a larger sample cannot fix: - (b) Sample-size finding: Using simple random sampling on the baseline population (Monte Carlo, 1,000 repetitions, seed crisg-m12), increasing n from 1 to 10 to 100 shrank the SD of estimates from 15.47 to 4.65 to 1.48 minutes, and the RMSE from 15.48 to 4.65 to 1.49 minutes. As the sample gets larger, the estimates cluster more tightly around the true mean, so a typical estimate lands closer to the true population mean. But a larger sample does not guarantee that any single estimate is close: one simple random sample I drew at n = 100 gave 20.79 minutes, about 1.9 minutes from the true mean of 22.68, so one sample on its own should not be trusted. A bigger sample also cannot fix a selection problem: if the sample were chosen in a way that is not representative, for example only from certain days, a larger sample would just give a more precise version of the same off-target answer.

## 5. Challenge (hypothesis written independently, before consulting my agent)

Hypothesis, written before I consult my agent:

- Date written:
- Method I chose to challenge:
- The change to the population or its ordering:
- Why the selection rule would interact with that change:
- Evidence I expect across repeated samples:
- Alternative method or correction I will compare, and why:
- Evidence that would contradict my hypothesis:

After I test it:

- Test settings (conditions, methods, alternative method or correction, n, seeds); results are in the table above:
- (c) Challenge interpretation: did the evidence support my hypothesis? Bias versus variability, other explanations, what the alternative or correction showed, and any dated revision (keep the original above):

## 6. AI use

- Tools used:
- What I asked my agent to do, and what I checked myself:
- Automated checks my agent reported (I did not let it interpret my results):
