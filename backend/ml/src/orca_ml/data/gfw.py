"""
Global Fishing Watch 4Wings API v3 data fetcher and cache.
Handles dataset `public-global-fishing-effort:latest`.
"""

import json
import os
import time
from typing import Any
import requests


class GFWClient:
    """Client for Global Fishing Watch 4Wings API v3."""

    BASE_URL = "https://gateway.globalfishingwatch.org/v3/4wings"

    def __init__(self, token: str | None = None, cache_dir: str | None = None):
        self.token = token or os.getenv("GFW_API_ACCESS_TOKEN")
        self.cache_dir = cache_dir or os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "gfw")
        os.makedirs(self.cache_dir, exist_ok=True)

    @property
    def is_configured(self) -> bool:
        return bool(self.token and len(self.token.strip()) > 10)

    def fetch_fishing_effort(
        self,
        start_date: str,
        end_date: str,
        bbox: tuple[float, float, float, float] = (45.0, -5.0, 100.0, 30.0),
        spatial_resolution: float = 0.1,
    ) -> dict[str, Any]:
        """
        Fetches apparent fishing effort from GFW 4Wings API v3.
        bbox format: (min_lon, min_lat, max_lon, max_lat).
        If token is missing, raises ValueError per Part 1.1.
        """
        if not self.is_configured:
            raise ValueError(
                "GFW_API_ACCESS_TOKEN is missing. Global Fishing Watch 4Wings API v3 "
                "requires a bearer authentication token. Model 1 marked UNFINISHED."
            )

        cache_filename = f"gfw_{start_date}_{end_date}_{bbox[0]}_{bbox[1]}.json"
        cache_path = os.path.join(self.cache_dir, cache_filename)
        if os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)

        headers = {
            "Authorization": f"Bearer {self.token.strip()}",
            "Content-Type": "application/json",
        }
        params = {
            "datasets[0]": "public-global-fishing-effort:latest",
            "date-range": f"{start_date},{end_date}",
            "spatial-resolution": spatial_resolution,
            "temporal-resolution": "weekly",
        }

        # Polite rate-limiting
        time.sleep(0.5)
        resp = requests.get(f"{self.BASE_URL}/report", headers=headers, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f)

        return data
