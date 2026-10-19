# TASK 4 of 6: Train, evaluate and ship the ORCA models (honestly)

Paste after the CONTEXT BLOCK. Do Tasks 0 to 3 first. This task needs the Global Fishing Watch token and the NOAA ERDDAP/Copernicus data to be reachable. If a data source is not reachable, finish what is possible and mark the rest UNFINISHED. Never fabricate training data or metrics.

```
TASK 4: Build a reproducible ML package, train the models below on real public data on this machine, evaluate them against baselines with leakage-safe splits, and wire them into ORCA ONLY if they pass an adoption gate.

---------------------------------------------------------------------
READ THIS FIRST: WHAT "TRAINING" MEANS HERE
---------------------------------------------------------------------
- We do NOT fine-tune any large language model. The LLM only extracts intent and words an explanation, behind a validator. Fine-tuning it would not make ORCA safer and would add risk. LLM quality is handled by versioned prompts and the evaluation set from Task 3.
- We DO train small, classical ML models on real data. They are ADVISORY (safety rule S5). They can never set or override the risk level.
- A model ships only if it beats simple baselines on held-out data by a margin that is written down BEFORE you look at test results (the adoption gate). If it does not pass, the heuristic stays active and the UI says so. A failed gate is a valid, reportable outcome.
- Report real numbers only. If a run did not happen, say it did not happen.

---------------------------------------------------------------------
PART A: THE ML PACKAGE (reproducible, separate from Django)
---------------------------------------------------------------------
Create backend/ml/ as an installable package `orca_ml`:
  ml/pyproject.toml            (extras: train, serve; verify package names and versions before adding: numpy, pandas, xarray, netCDF4 or h5netcdf, scikit-learn, joblib, scipy, shapely, pyproj, rasterio only if needed, matplotlib, hypothesis, pytest, requests or httpx; lightgbm optional because scikit-learn HistGradientBoosting is enough and has fewer Windows install problems)
  ml/src/orca_ml/data/          fetchers: gfw.py, sst_chl.py, bathymetry.py, ports.py, manifest.py
  ml/src/orca_ml/features/      features.py (ONE implementation used by training AND serving), grid.py, gradients.py
  ml/src/orca_ml/models/        fishing_zone.py, chl_anomaly.py, intent.py, (optional) wave_error.py
  ml/src/orca_ml/eval/          splits.py, metrics.py, baselines.py, calibration.py, report.py
  ml/src/orca_ml/serve/         loader.py (adoption gate enforcement), predict.py
  ml/artifacts/<model>/<version>/ model file, model_card.md, metrics.json, feature_schema.json, data_manifest.json, training_log.txt
  ml/data/                      raw and cached data (git-ignored)
  scripts\ml-fetch.ps1, ml-features.ps1, ml-train.ps1, ml-evaluate.ps1, ml-export.ps1, ml-all.ps1
Rules: fixed random seeds; every dataset file recorded in data_manifest.json with source URL, request parameters, date range, row count and SHA-256; every run has a run id; training and serving share the same features.py (a test proves identical output for the same input); resumable downloads with caching; polite rate limiting; memory-aware chunking (check available RAM first and tell me what you chose).

---------------------------------------------------------------------
MODEL 1: FISHING-ACTIVITY SUITABILITY (the fishing-zone model)
---------------------------------------------------------------------
QUESTION IT ANSWERS: "Under sea conditions like today's, where have AIS-tracked fishing vessels historically operated near this port?" It does NOT predict catch or fish presence.

1.1 DATA (all real, all cited in docs/PROVIDERS.md and the manifest)
  - LABELS: Global Fishing Watch apparent fishing effort via the 4Wings API v3 (dataset `public-global-fishing-effort:latest`; confirm the current dataset id, endpoint, Bearer-token auth, spatial and temporal resolution options, date limits and rate limits in the official docs). Region: Indian Ocean box covering the Arabian Sea and Bay of Bengal (start with lon 45 to 100, lat -5 to 30; justify and record any change). Period: the last 3 complete years available (GFW data lags real time; find the latest available date). Aggregate to 0.1 degree cells and weekly bins (or the finest resolution you can fetch within limits; document the choice and the reason). Respect rate limits; cache every response; resume on failure. Token comes from GFW_API_ACCESS_TOKEN; if missing, stop this model and mark UNFINISHED.
  - FEATURES at the same cell and week: sea surface temperature and chlorophyll from the NOAA ERDDAP datasets you identified in Task 2 (or Copernicus products if credentials exist; prefer gap-filled L4 products when available because daily chlorophyll is full of cloud gaps; record which you used and why), bathymetry (ETOPO or GEBCO subset; fetch only the bbox via a subset service, never the global file; verify the source and licence), distance to coast (from Natural Earth coastline), distance to the nearest port from our Port table, month (sin and cos), and 1-week and 2-week lagged and mean SST and chlorophyll.
  - DERIVED: SST gradient magnitude and chlorophyll gradient magnitude (documented kernel and units per km), front indicator, log chlorophyll.
  - Do NOT include raw longitude or latitude as features in the main model (they let the model memorise places). Train a variant WITH them only as a diagnostic, and report the difference.
1.2 TARGET: y = 1 if apparent fishing hours in the cell-week are above 0, else 0. Also keep the continuous hours for an optional rank-based evaluation.
1.3 SAMPLING: fishing cells are rare. Keep ALL positive cells, sample negatives with documented ratios (for example 5:1), record sampling weights, and evaluate on UNSAMPLED test data so metrics are honest about the real class balance.
1.4 SPLITS (leakage-safe, decided before training):
    - Temporal holdout: the last 6 months are the test period and are never used for model selection.
    - Spatial blocks: assign cells to 5 x 5 degree blocks; use GroupKFold on blocks for validation; report performance on blocks never seen in training.
    - Combined test: unseen blocks AND the unseen period.
    - A leakage test: no block and no time range appears on both sides.
1.5 BASELINES (must be implemented and reported next to the model):
    B1 climatology: fishing probability by cell and calendar month from training years only.
    B2 heuristic: the rule-based score ORCA used before (SST front strength plus chlorophyll within a band; write down its formula and parameters before evaluating).
    B3 distance-only: probability as a function of distance to coast and distance to port.
1.6 MODEL: scikit-learn HistGradientBoostingClassifier (or LightGBM if installed cleanly), with early stopping on a validation block set, class weighting as justified, small hyperparameter search (randomised, at most 30 trials, grouped CV), monotonic constraints only where physically justified and documented. Calibrate probabilities (isotonic or Platt) on a held-out block set. Fix seeds.
1.7 METRICS (all on the combined unseen test; also per sub-region: Arabian Sea west coast, Bay of Bengal east coast, Andaman Sea, Lakshadweep area; and per month):
    ROC-AUC, PR-AUC, Brier score, expected calibration error and a calibration plot, and the operational metric: for each test week and each of 40 sample ports, take the cells within 100 km, rank by predicted score, and report recall of true fishing cells within the top 10 percent and top 20 percent of ranked cells ("top-k hit rate"), against the three baselines. Report confidence intervals from a block bootstrap.
1.8 ADOPTION GATE (write this into ml/gate.yaml BEFORE running evaluation, then do not change it):
    The model is ACTIVE only if, on the combined unseen test, it beats the BEST baseline by at least 10 percent relative on PR-AUC AND by at least 5 percentage points on top-20-percent hit rate, with the block-bootstrap lower bound above the baseline value, AND calibration error is below 0.08. Otherwise status = "not adopted" and ORCA keeps the heuristic. Print which conditions passed.
1.9 EXPLAINABILITY: permutation importance on the test set and partial dependence for SST gradient, chlorophyll and depth. Write what the plots do and do not show. No causal claims.
1.10 KNOWN BIASES (must appear in the model card, the methodology page and the UI info popover):
    - AIS-based data mostly shows larger fishing vessels. Many small and artisanal boats, especially in India, do not carry AIS, so nearshore small-boat fishing is under-represented.
    - Fishing effort is not catch. Good conditions for fishing effort are not guaranteed fish.
    - Historical behaviour can reflect regulations, seasonal bans, fuel costs and ports, not only ocean conditions.
    - Cloud cover affects chlorophyll inputs.
1.11 SERVING: zones agent loads the active artifact, builds features for the grid around the requested port or point (radius 100 km, 0.1 degree) from the latest stored SST and chlorophyll, predicts, takes the top cells, clusters adjacent cells into zone polygons, attaches score (calibrated probability), the risk level computed by the RISK ENGINE at the zone centroid (zones with unsafe conditions are listed as "not recommended right now" and are not drawn as targets), data ages, origin = "orca_model", model version, and the sentence "Areas where tracked fishing vessels have historically operated in similar sea conditions." If inputs are missing or the model is not adopted, use the heuristic and set origin = "orca_heuristic" and fallback = true with a reason. If an official PFZ advisory exists in the Advisory table, show it first and label origin = "official_pfz".

---------------------------------------------------------------------
MODEL 2: CHLOROPHYLL ANOMALY FLAG (statistical, not deep learning)
---------------------------------------------------------------------
Goal: flag unusually high chlorophyll for a location and season. Not a bloom detector.
2.1 Build a per-cell, per-month climatology of log chlorophyll (mean, standard deviation, robust median and MAD) from at least 5 years of the chosen chlorophyll product (monthly product is fine; record it).
2.2 Flag when the robust z-score is at least 2.5 AND the cluster covers at least N adjacent valid cells (choose and justify N) AND the data is not mostly cloud-masked. Output: flag, z, area, data age, `cloud_gap_fraction`.
2.3 Backtest QUALITATIVELY on documented, citable events (for example publicly reported Noctiluca or other algal bloom events in the Arabian Sea or Bay of Bengal; find and cite at least 3 real reports with dates and places). Report whether the flag fired near those events and how often it fires on quiet weeks. Do not claim accuracy numbers you cannot compute. Report the false-flag rate on the climatology years.
2.4 UI wording: "Unusually high chlorophyll compared with the usual level for this month. This is not a confirmed algal bloom. Satellite chlorophyll cannot identify harmful species. Check official advisories." Never use "toxic" or "dangerous".

---------------------------------------------------------------------
MODEL 3: INTENT CLASSIFIER (small text model for the chat)
---------------------------------------------------------------------
3.1 Task: classify `task` only (safety, fishing_zones, weather, waves, advisories, compare, explain_term, other). Place and date understanding stay rule-based.
3.2 Training data: generate a labelled set deterministically from templates x port names x time phrases x paraphrase variants x typos x casing, at least 6,000 examples, plus at least 150 hand-written examples you write yourself covering real phrasing from fishermen, students and officials. Keep the hand-written examples split: 100 in training, 50 held-out; ALSO use the Task 3 held-out set as an independent test set that is NEVER used for training or tuning.
3.3 Model: TF-IDF (word 1-2 grams plus character 3-5 grams) + LogisticRegression (or LinearSVC with calibration). Report macro-F1, per-class precision and recall, confusion matrix, on the independent test set. Compare to the rule-based scorer from Task 3.
3.4 Adoption gate (write before evaluating): macro-F1 at least 3 points above the rule-based scorer on the independent test set and no class recall below 0.80. Otherwise keep rules.
3.5 Inference under 5 ms; artifact under 20 MB; falls back to rules on any error.

---------------------------------------------------------------------
MODEL 4 (OPTIONAL, ONLY IF DATA IS REACHABLE): WAVE FORECAST ERROR RANGE
---------------------------------------------------------------------
Purpose: show an honest likely range next to the forecast wave height ("1.8 m, likely 1.3 to 2.4 m"). It changes ONLY what is displayed and the `confidence` label. It never changes the level.
4.1 Needs observations or a trusted reference. Use ERA5 reanalysis significant wave height (Copernicus Climate Data Store; needs CDS_API_KEY; verify the current API and variable names) as the reference, and archived past forecasts from the Open-Meteo historical forecast API (verify that it exists, that it includes wave variables, its date coverage and its terms). If either is unavailable, mark UNFINISHED with the reason and do NOT substitute invented data.
4.2 Target: signed forecast error by lead time (0 to 168 h). Model: quantile regression (10th, 50th, 90th percentile) using lead time, month, region, forecast wave height, period and wind. Evaluate interval coverage on held-out blocks and time: the 80 percent interval must cover between 75 and 85 percent of cases, else not adopted.

---------------------------------------------------------------------
PART B: INTEGRATION
---------------------------------------------------------------------
B1. apps/agents/agents/fishing_zone.py and chl_anomaly (new satellite sub-agent) call orca_ml.serve through a thin adapter and respect the loader's adoption gate.
B2. GET /api/v1/models/ (public): for each model: id, version, status (active | not_adopted | unfinished | disabled), trained_at, data range, key metrics, baseline comparison, gate result, limits. GET /api/v1/models/{id}/card/ returns the model card markdown.
B3. Frontend: `/methodology` shows each model with plain-language description, the numbers from metrics.json (no hand-typed numbers), the gate result, known biases, and a "last trained" date. Risk card and zone list show origin and version in a small info popover.
B4. Monitoring: a weekly Celery task computes input feature drift (PSI against the training distribution) and the share of requests that fell back; logs and flags in data-status and the admin Data sources page.
B5. Retraining: documented command and cadence (for example quarterly) in docs/ML.md, including how to re-run the gate.

---------------------------------------------------------------------
PART C: TESTS
---------------------------------------------------------------------
C1. features parity: the same raw inputs give identical features in training and serving paths.
C2. no leakage: split tests (blocks and time disjoint), no feature computed with future data (assert the max timestamp used for a row's features is not after the row's time).
C3. determinism: same seed, same data manifest -> same metrics within tolerance.
C4. loader: refuses to activate a model that failed its gate; falls back with a reason; handles corrupt artifact, missing artifact, schema mismatch.
C5. inference: handles all-null inputs, partial nulls, land cells, antimeridian, polar edge, and returns None rather than a guess.
C6. API: /models/ never leaks paths or secrets; metrics shown equal metrics.json.
C7. intent classifier: no class collapse, handles empty and very long input, falls back on error.
C8. adversarial: the model output cannot change risk level (test that the risk engine result is identical with the model on, off, and failing).

---------------------------------------------------------------------
VERIFICATION AND REPORT
---------------------------------------------------------------------
scripts\verify-task4.ps1 printing PASS, FAIL or SKIPPED (with reason) for:
- data manifests exist with hashes and date ranges (print date ranges and row counts)
- Model 1: trained, metrics table vs baselines, gate result printed condition by condition, calibration ECE, per-region and per-month table, top-k hit rates
- Model 2: climatology built, backtest events listed with citations, false-flag rate
- Model 3: independent-test macro-F1 vs rule-based, gate result
- Model 4: trained or SKIPPED with reason
- features parity, leakage, determinism and loader tests pass
- /api/v1/models/ and /methodology display the real numbers
- risk-level independence test passes
Then write docs/ML.md with: what each model does, data and licences, how to retrain, metrics, gate results, limits, and a plain-language paragraph I can paste into my project report. Paste the full verification output in your final report. If a gate failed, say so plainly and leave the heuristic or rules active.
```
