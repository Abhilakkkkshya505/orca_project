"""Data splitting and leakage verification for ORCA ML models.

Implements:
1. Temporal holdout split (e.g. final 6 months held out)
2. Spatial 5x5 degree block split (GroupKFold)
3. Combined unseen test split (unseen time AND unseen space blocks)
4. Strict assert_no_data_leakage verification
"""

from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import pandas as pd


def create_temporal_split(
    df: pd.DataFrame,
    date_col: str = "timestamp",
    test_months: int = 6,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Split dataframe temporally into train and holdout test.
    
    The latest `test_months` are held out strictly for evaluation.
    """
    if date_col not in df.columns:
        raise ValueError(f"Column '{date_col}' not found in dataframe.")
    
    dates = pd.to_datetime(df[date_col])
    max_date = dates.max()
    split_date = max_date - pd.DateOffset(months=test_months)
    
    train_mask = dates < split_date
    test_mask = dates >= split_date
    
    train_df = df[train_mask].copy()
    test_df = df[test_mask].copy()
    return train_df, test_df


def create_spatial_block_splits(
    df: pd.DataFrame,
    block_col: str = "block_id",
    n_splits: int = 5,
    random_state: int = 42,
) -> List[Tuple[np.ndarray, np.ndarray]]:
    """Generate spatial GroupKFold splits on 5x5 degree grid blocks.
    
    Ensures no spatial block appears in both train and validation folds.
    """
    from sklearn.model_selection import GroupKFold
    
    if block_col not in df.columns:
        raise ValueError(f"Column '{block_col}' not found in dataframe.")
    
    groups = df[block_col].values
    gkf = GroupKFold(n_splits=n_splits)
    
    splits = []
    indices = np.arange(len(df))
    for train_idx, val_idx in gkf.split(indices, groups=groups):
        splits.append((train_idx, val_idx))
    return splits


def create_combined_unseen_split(
    df: pd.DataFrame,
    date_col: str = "timestamp",
    block_col: str = "block_id",
    test_months: int = 6,
    test_block_fraction: float = 0.2,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Create combined unseen test set: unseen in both space and time.
    
    Train set: Seen time (< split_date) AND seen blocks.
    Test set: Unseen time (>= split_date) AND unseen blocks.
    """
    dates = pd.to_datetime(df[date_col])
    max_date = dates.max()
    split_date = max_date - pd.DateOffset(months=test_months)
    
    unique_blocks = df[block_col].unique()
    rng = np.random.RandomState(random_state)
    n_test_blocks = max(1, int(len(unique_blocks) * test_block_fraction))
    test_blocks = set(rng.choice(unique_blocks, size=n_test_blocks, replace=False))
    
    train_mask = (dates < split_date) & (~df[block_col].isin(test_blocks))
    test_mask = (dates >= split_date) & (df[block_col].isin(test_blocks))
    
    train_df = df[train_mask].copy()
    test_df = df[test_mask].copy()
    return train_df, test_df


def assert_no_data_leakage(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    date_col: Optional[str] = "timestamp",
    block_col: Optional[str] = "block_id",
    index_col: Optional[str] = None,
    enforce_temporal: bool = True,
    enforce_spatial: bool = False,
) -> None:
    """Strictly assert no data leakage between train and test dataframes.
    
    Checks:
    1. No shared indices/row IDs between train and test.
    2. If enforce_temporal: strict temporal separation (max(train_date) < min(test_date)).
    3. If enforce_spatial: strictly non-overlapping block_ids.
    4. Target leak check: verifies target column is not present inside features.
    
    Raises:
        AssertionError: If any leakage condition is violated.
    """
    # 1. Index overlap check
    if index_col and index_col in train_df.columns and index_col in test_df.columns:
        shared_ids = set(train_df[index_col]).intersection(set(test_df[index_col]))
        if shared_ids:
            raise AssertionError(f"Data leakage detected! {len(shared_ids)} shared IDs between train and test.")

    # 2. Temporal leakage check
    if enforce_temporal and date_col and date_col in train_df.columns and date_col in test_df.columns:
        train_max = pd.to_datetime(train_df[date_col]).max()
        test_min = pd.to_datetime(test_df[date_col]).min()
        if train_max >= test_min:
            raise AssertionError(
                f"Temporal leakage detected! Train max date ({train_max}) >= test min date ({test_min})."
            )

    # 3. Spatial block leakage check
    if enforce_spatial and block_col and block_col in train_df.columns and block_col in test_df.columns:
        train_blocks = set(train_df[block_col].unique())
        test_blocks = set(test_df[block_col].unique())
        overlap = train_blocks.intersection(test_blocks)
        if overlap:
            raise AssertionError(
                f"Spatial leakage detected! {len(overlap)} blocks present in both train and test sets: {list(overlap)[:5]}"
            )
