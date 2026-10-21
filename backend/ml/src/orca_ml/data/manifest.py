"""
Dataset provenance and SHA-256 integrity manifest tracking.
Enforces Rule 29: Every dataset file recorded with source URL, request parameters,
date range, row count, and SHA-256 hash.
"""

from dataclasses import asdict, dataclass
from datetime import datetime
import hashlib
import json
import os
from typing import Any


@dataclass
class DatasetEntry:
    dataset_name: str
    source_url: str
    request_params: dict[str, Any]
    date_range: tuple[str, str]
    row_count: int
    sha256_hash: str
    fetched_at: str
    file_path: str


class DataManifest:
    """Manages data provenance tracking for reproducible model runs."""

    def __init__(self, manifest_dir: str):
        self.manifest_dir = manifest_dir
        self.manifest_path = os.path.join(manifest_dir, "data_manifest.json")
        self.entries: dict[str, DatasetEntry] = {}
        self.load()

    def load(self) -> None:
        if os.path.exists(self.manifest_path):
            try:
                with open(self.manifest_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for k, v in data.items():
                        self.entries[k] = DatasetEntry(**v)
            except Exception:
                self.entries = {}

    def compute_sha256(self, file_path: str) -> str:
        sha = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                sha.update(chunk)
        return sha.hexdigest()

    def record_file(
        self,
        name: str,
        file_path: str,
        source_url: str,
        params: dict[str, Any],
        start_date: str,
        end_date: str,
        row_count: int,
    ) -> DatasetEntry:
        file_hash = self.compute_sha256(file_path)
        entry = DatasetEntry(
            dataset_name=name,
            source_url=source_url,
            request_params=params,
            date_range=(start_date, end_date),
            row_count=row_count,
            sha256_hash=file_hash,
            fetched_at=datetime.utcnow().isoformat() + "Z",
            file_path=os.path.relpath(file_path, self.manifest_dir) if os.path.isabs(file_path) else file_path,
        )
        self.entries[name] = entry
        self.save()
        return entry

    def save(self) -> None:
        os.makedirs(self.manifest_dir, exist_ok=True)
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump({k: asdict(v) for k, v in self.entries.items()}, f, indent=2)
