"""orca_ml.eval: evaluation, splits, baselines, metrics, calibration, and reporting."""

from orca_ml.eval.splits import (
    create_temporal_split,
    create_spatial_block_splits,
    create_combined_unseen_split,
    assert_no_data_leakage,
)
from orca_ml.eval.baselines import (
    ClimatologyBaseline,
    HeuristicRuleBaseline,
    DistanceOnlyBaseline,
)
from orca_ml.eval.metrics import (
    compute_ece,
    compute_top_k_hit_rate,
    compute_classification_metrics,
    block_bootstrap_confidence_intervals,
)
from orca_ml.eval.calibration import (
    ModelCalibrator,
    select_best_calibrator,
)
from orca_ml.eval.report import (
    evaluate_adoption_gate,
    generate_model_card_markdown,
)

__all__ = [
    "create_temporal_split",
    "create_spatial_block_splits",
    "create_combined_unseen_split",
    "assert_no_data_leakage",
    "ClimatologyBaseline",
    "HeuristicRuleBaseline",
    "DistanceOnlyBaseline",
    "compute_ece",
    "compute_top_k_hit_rate",
    "compute_classification_metrics",
    "block_bootstrap_confidence_intervals",
    "ModelCalibrator",
    "select_best_calibrator",
    "evaluate_adoption_gate",
    "generate_model_card_markdown",
]
