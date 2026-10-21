"""Baselines for ORCA model evaluation.

Defines:
- B1: Climatology baseline (historical monthly/spatial block mean)
- B2: Deterministic heuristic rule score (Task 2 rule)
- B3: Distance-only baseline (heuristic decay based on distance to coast & port)
"""

from typing import Dict, Any, Optional
import numpy as np
import pandas as pd


class ClimatologyBaseline:
    """B1: Predicts historical mean positive rate by (month, block_id)."""
    
    def __init__(self):
        self.block_month_means: Dict[tuple, float] = {}
        self.global_mean: float = 0.5
        
    def fit(self, df: pd.DataFrame, target_col: str = "label", month_col: str = "month", block_col: str = "block_id"):
        self.global_mean = float(df[target_col].mean())
        grouped = df.groupby([block_col, month_col])[target_col].mean().to_dict()
        self.block_month_means = grouped
        return self
        
    def predict_proba(self, df: pd.DataFrame, month_col: str = "month", block_col: str = "block_id") -> np.ndarray:
        probs = []
        for _, row in df.iterrows():
            key = (row[block_col], int(row[month_col]))
            p = self.block_month_means.get(key, self.global_mean)
            probs.append(p)
        return np.array(probs, dtype=float)


class HeuristicRuleBaseline:
    """B2: Existing deterministic rule baseline from Task 2.
    
    Favorable conditions:
    - SST in [26.0, 29.0] °C
    - Chlorophyll-a >= 0.30 mg/m³
    - Bathymetry depth in [50, 200] m (continental shelf)
    - Front indicator active (+0.1 bonus)
    """
    
    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        probs = []
        for _, row in df.iterrows():
            score = 0.1  # base probability
            
            sst = row.get("sst", np.nan)
            if not np.isnan(sst) and 26.0 <= sst <= 29.0:
                score += 0.35
            elif not np.isnan(sst) and 24.0 <= sst <= 31.0:
                score += 0.15
                
            chl = row.get("chl", np.nan)
            if not np.isnan(chl) and chl >= 0.5:
                score += 0.30
            elif not np.isnan(chl) and chl >= 0.2:
                score += 0.15
                
            depth = row.get("bathymetry_depth_m", np.nan)
            if not np.isnan(depth) and 50.0 <= depth <= 200.0:
                score += 0.20
            elif not np.isnan(depth) and 20.0 <= depth <= 500.0:
                score += 0.10
                
            front = row.get("front_indicator", 0.0)
            if front > 0.5:
                score += 0.10
                
            probs.append(min(1.0, max(0.0, score)))
        return np.array(probs, dtype=float)


class DistanceOnlyBaseline:
    """B3: Predicts suitability strictly as a decay function of distance to port & coast."""
    
    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        probs = []
        for _, row in df.iterrows():
            d_port = row.get("dist_to_nearest_port_km", 50.0)
            d_coast = row.get("dist_to_coast_km", 30.0)
            
            # Nearshore/coastal shelf activity: highest within 20-80 km, decaying further out
            p_port = np.exp(-max(0.0, d_port - 20.0) / 80.0)
            p_coast = np.exp(-max(0.0, d_coast - 10.0) / 60.0)
            
            p = 0.5 * p_port + 0.5 * p_coast
            probs.append(float(np.clip(p, 0.05, 0.95)))
        return np.array(probs, dtype=float)
