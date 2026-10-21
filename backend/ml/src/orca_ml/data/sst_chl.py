"""
NOAA ERDDAP SST and Chlorophyll data ingest and cache.
Uses gap-filled satellite products for Indian Ocean marine domain.
"""

import json
import os
import urllib.parse
from typing import Any
import requests


class NOAAERDDAPClient:
    """Client for NOAA CoastWatch ERDDAP endpoints."""

    DEFAULT_BASE_URL = "https://coastwatch.pfeg.noaa.gov/erddap"

    def __init__(self, base_url: str | None = None, cache_dir: str | None = None):
        self.base_url = (base_url or os.getenv("NOAA_ERDDAP_BASE_URL", self.DEFAULT_BASE_URL)).rstrip("/")
        self.cache_dir = cache_dir or os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "erddap")
        os.makedirs(self.cache_dir, exist_ok=True)

    def fetch_gridded_variable(
        self,
        dataset_id: str,
        variable_name: str,
        start_date: str,
        end_date: str,
        lat_range: tuple[float, float],
        lon_range: tuple[float, float],
    ) -> dict[str, Any]:
        """
        Fetches gridded json data from ERDDAP griddap protocol.
        """
        cache_key = f"{dataset_id}_{variable_name}_{start_date}_{end_date}_{lat_range[0]}_{lon_range[0]}.json"
        cache_path = os.path.join(self.cache_dir, cache_key)
        if os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)

        query = f"[({start_date}):1:({end_date})][({lat_range[0]}):1:({lat_range[1]})][({lon_range[0]}):1:({lon_range[1]})]"
        url = f"{self.base_url}/griddap/{dataset_id}.json?{variable_name}{query}"

        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(data, f)
            return data
        except Exception:
            # Fallback to local recorded sample if remote is unreachable
            sample_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "erddap_sample.json")
            if os.path.exists(sample_path):
                with open(sample_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            return {"table": {"columnNames": ["time", "latitude", "longitude", variable_name], "rows": []}}
