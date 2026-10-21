"""orca_ml.models: candidate models, baseline training, evaluation, and serialization."""

from orca_ml.models.intent import (
    IntentClassifierModel,
    train_and_evaluate_intent_model,
    rule_based_predict,
)
from orca_ml.models.chl_anomaly import (
    ChlorophyllAnomalyDetector,
    run_historical_bloom_backtest,
    HISTORICAL_BLOOM_CITATIONS,
)
from orca_ml.models.fishing_zone import (
    FishingSuitabilityPipeline,
    train_and_evaluate_fishing_model,
    generate_fishing_fixture_dataset,
)
from orca_ml.models.wave_error import (
    WaveForecastErrorModel,
)

__all__ = [
    "IntentClassifierModel",
    "train_and_evaluate_intent_model",
    "rule_based_predict",
    "ChlorophyllAnomalyDetector",
    "run_historical_bloom_backtest",
    "HISTORICAL_BLOOM_CITATIONS",
    "FishingSuitabilityPipeline",
    "train_and_evaluate_fishing_model",
    "generate_fishing_fixture_dataset",
    "WaveForecastErrorModel",
]
