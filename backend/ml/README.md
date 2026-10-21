# ORCA Machine Learning Package (`orca_ml`)

Package containing reproducible, advisory ML pipelines for the ORCA marine ecosystem platform (SDG 14).

## Package Layout
- `orca_ml.data`: Data ingestion, provenance manifests, NOAA ERDDAP and GFW adapters.
- `orca_ml.features`: Canonical feature extraction shared by training and inference.
- `orca_ml.models`: Classical ML model definitions (HistGradientBoosting, TF-IDF + LogisticRegression, Anomaly Detector).
- `orca_ml.eval`: Spatial block splits (GroupKFold), baselines, calibration, and adoption gate evaluation.
- `orca_ml.serve`: Model artifact loader, adoption gate enforcement, and spatial inference serving.
